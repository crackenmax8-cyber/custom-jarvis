/*
 * brain.js — SELECTA, the house-music DJ agent.
 *
 * Two modes, mirroring jarvis.js:
 *   1. LOCAL (default, fully offline): intent matching over the DJ knowledge
 *      base — genres, artists, labels, techniques, gear, history, Camelot-wheel
 *      math, track recommendations, and a harmonic set builder.
 *   2. CLAUDE (optional): with an Anthropic API key saved in Settings,
 *      free-form questions go to Claude with a house-DJ persona and the
 *      knowledge base injected as context. Falls back to LOCAL on any error.
 */

class DJBrain {
  constructor(getConfig) {
    this.getConfig = getConfig; // () => { apiKey, model }
    this.kb = window.DJKnowledge;
    this.lastTipIndex = -1;
  }

  async respond(rawText) {
    const text = (rawText || '').trim();
    if (!text) return { text: "Didn't catch that over the monitors — run it back?" };

    const local = this.localIntent(text);
    if (local && local.confident) return { text: local.text };

    const cfg = this.getConfig();
    if (cfg && cfg.apiKey) {
      try {
        const reply = await this.askClaude(text, cfg);
        if (reply) return { text: reply };
      } catch (e) {
        return { text: (local && local.text) || this.fallbackText() + ` (Claude link error: ${e.message})` };
      }
    }

    return { text: (local && local.text) || this.fallbackText() };
  }

  // ---- LOCAL INTENTS -------------------------------------------------------
  localIntent(text) {
    const t = text.toLowerCase();
    const kb = this.kb;
    const has = (...words) => words.some(w => t.includes(w));

    // greeting
    if (has('hello', 'hey', 'hi ', 'yo ', 'sup', 'what up', "what's up", 'good morning', 'good evening', 'you there') || t === 'hi' || t === 'yo') {
      return { confident: true, text: `Yes yes — SELECTA in the booth, decks are hot. I live and breathe house music: ask me about any subgenre, the legends, mixing technique, harmonic keys ("what mixes with 8A?"), gear, history — or say "build me a set" and I'll pull from the crate.` };
    }

    // help / capabilities
    if (has('what can you do', 'help', 'commands', 'how do you work', 'what do you know')) {
      return { confident: true, text: [
        `Here's what I've got in the record bag:`,
        `• GENRES — "what is deep house?", "tech house bpm", "tell me about acid house"`,
        `• LEGENDS — "who is Frankie Knuckles?", "tell me about Kerri Chandler"`,
        `• TECHNIQUE — "how do I beatmatch?", "explain the bass swap", "what is phrasing?"`,
        `• HARMONIC MIXING — "what mixes with 8A?", "explain the camelot wheel"`,
        `• SET CRAFT — "build me a set", "how do I warm up a room?", "recommend a tech house track"`,
        `• GEAR — "CDJs or turntables?", "what mixer should I get?"`,
        `• HISTORY — "history of house", "what happened in 1987?"`,
        `• "give me a DJ tip" — booth wisdom on demand`,
        `Add a Claude API key in Settings and I'll freestyle on anything beyond the crate.`,
      ].join('\n') };
    }

    // dj tip
    if (has('tip', 'advice', 'wisdom', 'pro tip')) {
      let i;
      do { i = Math.floor(Math.random() * kb.tips.length); } while (i === this.lastTipIndex && kb.tips.length > 1);
      this.lastTipIndex = i;
      return { confident: true, text: `Booth wisdom: ${kb.tips[i]}` };
    }

    // camelot key compatibility — "what mixes with 8A", "compatible with 12b"
    const keyMatch = t.match(/\b(1[0-2]|[1-9])\s*([ab])\b/);
    if (keyMatch && has('mix', 'key', 'compatible', 'camelot', 'harmonic', 'goes with', 'go with', 'blend', 'match')) {
      return { confident: true, text: this.camelotAnswer(parseInt(keyMatch[1], 10), keyMatch[2].toUpperCase()) };
    }

    // camelot / harmonic explainer (no specific key given)
    if (has('camelot', 'harmonic mixing', 'key mixing', 'mixed in key', 'what key')) {
      const tech = kb.techniques.find(x => x.id === 'harmonic mixing');
      return { confident: true, text: `${tech.name} — ${tech.text}` };
    }

    // set builder — "build me a set", "make a setlist", "playlist for a warm up"
    if (has('build', 'make', 'create', 'give me', 'plan') && has('set', 'setlist', 'playlist', 'mix ')) {
      const genre = this.findGenre(t);
      const vibe = has('warm up', 'warmup', 'opening', 'opener', 'chill', 'deep', 'sunset', 'sunrise') ? 'warmup'
                 : has('peak', 'banger', 'main room', 'prime time', 'festival', 'big') ? 'peak'
                 : 'journey';
      return { confident: true, text: this.buildSet(vibe, genre) };
    }

    // track recommendation — "recommend a deep house track", "play me something soulful"
    if (has('recommend', 'suggest', 'play me', 'drop', 'track for', 'song for', 'what should i play', 'give me a track', 'give me a song')) {
      const genre = this.findGenre(t);
      return { confident: true, text: this.recommendTracks(genre) };
    }

    // history — "history of house", "how did house start", year queries
    const yearMatch = t.match(/\b(19[7-9]\d|20[0-2]\d)\b/);
    if (has('history', 'how did house start', 'where did house', 'origin of house', 'timeline', 'who invented house', 'when was house') || (yearMatch && has('happen', 'house', 'what was'))) {
      if (yearMatch) {
        const y = parseInt(yearMatch[1], 10);
        const hit = kb.history.find(h => {
          const nums = h.year.match(/\d{4}/g) || [];
          if (nums.length === 2) return y >= +nums[0] && y <= +nums[1];
          if (nums.length === 1) return h.year.includes('s') ? y >= +nums[0] && y < +nums[0] + 10 : y === +nums[0];
          return false;
        });
        if (hit) return { confident: true, text: `${hit.year}: ${hit.event}` };
      }
      const lines = kb.history.map(h => `${h.year} — ${h.event}`);
      return { confident: true, text: `The story of house, from the Warehouse to now:\n\n${lines.join('\n\n')}` };
    }

    // artist lookup
    for (const a of kb.artists) {
      const nameL = a.name.toLowerCase();
      const short = nameL.replace(/\s*\(.*\)/, '');
      if (t.includes(nameL) || t.includes(short) || (a.name === 'Larry Heard' && t.includes('mr. fingers')) || (a.name === 'Larry Heard' && t.includes('mr fingers')) || (a.name === 'Green Velvet' && t.includes('cajmere')) || (a.name === 'Moodymann' && t.includes('kenny dixon'))) {
        return { confident: true, text: `${a.name} — ${a.bio}` };
      }
    }

    // label lookup
    for (const l of kb.labels) {
      if (t.includes(l.name.toLowerCase().split(' / ')[0])) {
        return { confident: true, text: `${l.name} — ${l.info}` };
      }
    }
    if (has('label', 'labels', 'imprint', 'record company')) {
      const list = kb.labels.map(l => `• ${l.name} — ${l.info}`).join('\n');
      return { confident: true, text: `The imprints that built house music:\n${list}` };
    }

    // technique lookup
    for (const tech of kb.techniques) {
      if (t.includes(tech.id) || tech.aliases.some(al => t.includes(al))) {
        return { confident: true, text: `${tech.name} — ${tech.text}` };
      }
    }
    if (has('technique', 'transition', 'how do i mix', 'how to mix', 'mixing', 'get better', 'improve')) {
      const list = kb.techniques.map(x => `• ${x.name}`).join('\n');
      return { confident: true, text: `The craft, in order of importance:\n${list}\nAsk me about any of them — e.g. "explain the bass swap" or "how do I beatmatch?"` };
    }

    // genre lookup (also handles "bpm of tech house")
    const genre = this.findGenre(t);
    if (genre) {
      if (has('bpm', 'tempo', 'how fast', 'speed')) {
        return { confident: true, text: `${this.title(genre.id)} runs ${genre.bpm[0]}–${genre.bpm[1]} BPM. Sweet spot for mixing it: around ${Math.round((genre.bpm[0] + genre.bpm[1]) / 2)}.` };
      }
      return { confident: true, text: this.genreCard(genre) };
    }
    if (has('genre', 'genres', 'subgenre', 'styles of house', 'types of house', 'kinds of house')) {
      const list = kb.genres.map(g => `• ${this.title(g.id)} (${g.bpm[0]}–${g.bpm[1]} BPM) — ${g.origin}`).join('\n');
      return { confident: true, text: `The house family tree:\n${list}\nAsk about any of them — "what is deep house?"` };
    }

    // generic bpm question
    if (has('bpm', 'tempo', 'how fast')) {
      return { confident: true, text: `House lives roughly between 110 and 135 BPM. Rules of thumb: organic/afro 110–122, deep house 118–125, classic Chicago 118–128, French touch 115–126, prog & melodic 118–128, tech house 124–130, UK garage 128–135. When mixing across styles, keep jumps under ~4% or use a breakdown/echo-out to make the tempo change.` };
    }

    // gear lookup
    for (const g of kb.gear) {
      if (t.includes(g.id) || g.aliases.some(al => t.includes(al))) {
        return { confident: true, text: `${g.name} — ${g.text}` };
      }
    }
    if (has('gear', 'equipment', 'setup', 'what should i buy', 'buy first')) {
      const list = kb.gear.map(g => `• ${g.name}`).join('\n');
      return { confident: true, text: `The booth arsenal:\n${list}\nAsk about any of them. Starting out? An entry controller (DDJ-FLX4) + HD-25s + free Rekordbox is everything you need to learn skills that transfer straight to club CDJs.` };
    }

    // thanks
    if (has('thank', 'nice one', 'sick', 'awesome', 'love it', 'fire')) {
      return { confident: true, text: `Big up! Now go practice those blends — the dancefloor is waiting.` };
    }

    return null;
  }

  // ---- HELPERS ---------------------------------------------------------------
  title(s) { return s.replace(/\b\w/g, c => c.toUpperCase()).replace(/\bUk\b/, 'UK'); }

  findGenre(t) {
    // longest-alias-first so "tech house" wins over "house", "acid house" over "acid"
    const candidates = [];
    for (const g of this.kb.genres) {
      for (const name of [g.id, ...g.aliases]) {
        if (t.includes(name)) candidates.push({ g, len: name.length });
      }
    }
    if (!candidates.length) return null;
    candidates.sort((a, b) => b.len - a.len);
    return candidates[0].g;
  }

  genreCard(g) {
    return [
      `${this.title(g.id).toUpperCase()} · ${g.bpm[0]}–${g.bpm[1]} BPM · ${g.era} · ${g.origin}`,
      ``,
      g.sound,
      ``,
      `Key names: ${g.artists.join(', ')}.`,
      `Essential spins:`,
      ...g.essentials.map(e => `• ${e}`),
    ].join('\n');
  }

  // Camelot math: same code, ±1 same letter (wrapping 12↔1), relative (letter swap), +2 energy boost.
  camelotAnswer(num, letter) {
    const kb = this.kb.camelot;
    if (!kb[num]) return `That key isn't on the wheel — Camelot runs 1A–12A (minor) and 1B–12B (major).`;
    const keyName = n => kb[((n - 1) % 12 + 12) % 12 + 1] ? kb[((n - 1) % 12 + 12) % 12 + 1][letter === 'A' ? 0 : 1] : '';
    const wrap = n => ((n - 1) % 12 + 12) % 12 + 1;
    const code = `${num}${letter}`;
    const minus = wrap(num - 1), plus = wrap(num + 1), boost = wrap(num + 2);
    const relLetter = letter === 'A' ? 'B' : 'A';
    const relName = kb[num][relLetter === 'A' ? 0 : 1];
    return [
      `${code} is ${kb[num][letter === 'A' ? 0 : 1]}. Harmonically compatible mixes:`,
      `• ${code} → ${code} — same key, the safest blend`,
      `• ${code} → ${minus}${letter} (${keyName(minus)}) or ${plus}${letter} (${keyName(plus)}) — one step around the wheel, smooth`,
      `• ${code} → ${num}${relLetter} (${relName}) — relative ${relLetter === 'B' ? 'major, lifts the mood' : 'minor, darkens the mood'}`,
      `• ${code} → ${boost}${letter} (${keyName(boost)}) — the +2 "energy boost", great over a drum-heavy transition`,
      `Remember: key clash matters most when melodic content overlaps. Percussion-only sections forgive nearly anything.`,
    ].join('\n');
  }

  recommendTracks(genre) {
    let pool = this.kb.tracks;
    if (genre) pool = pool.filter(tr => tr.genre === genre.id);
    if (!pool.length) pool = this.kb.tracks;
    const picks = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    const label = genre ? `${this.title(genre.id)} — three from the crate` : `Three from the crate, across the spectrum`;
    return [
      `${label}:`,
      ...picks.map(tr => `• ${tr.artist} — ${tr.title} (${tr.year}) · ${tr.bpm} BPM · ${tr.key} · energy ${tr.energy}/10`),
      genre ? `Want a full journey? Say "build me a ${genre.id} set".` : `Name a subgenre for something more targeted, or say "build me a set".`,
    ].join('\n');
  }

  // Greedy harmonic set builder over the crate: pick a start by vibe, then chain
  // key-compatible tracks with a rising (or arcing) energy curve and small BPM steps.
  buildSet(vibe, genre) {
    let crate = [...this.kb.tracks];
    if (genre) {
      const filtered = crate.filter(tr => tr.genre === genre.id);
      if (filtered.length >= 4) crate = filtered; // only honor the filter if there's enough to work with
    }

    const targetLen = Math.min(8, crate.length);
    const ranges = { warmup: [1, 5], peak: [6, 10], journey: [2, 9] };
    const [eMin, eMax] = ranges[vibe];

    let pool = crate.filter(tr => tr.energy >= eMin && tr.energy <= eMax);
    if (pool.length < targetLen) pool = crate;

    // start low for warmup/journey, mid-high for peak — with a little randomness
    pool.sort((a, b) => a.energy - b.energy || a.bpm - b.bpm);
    const startIdx = vibe === 'peak' ? Math.floor(pool.length / 2) : Math.floor(Math.random() * Math.min(3, pool.length));
    const set = [pool[startIdx]];
    const used = new Set([pool[startIdx]]);

    while (set.length < targetLen) {
      const cur = set[set.length - 1];
      const progress = set.length / targetLen;
      // journey arcs up then eases off the last slot; others climb
      const wantCool = vibe === 'journey' && progress > 0.85;
      const candidates = pool.filter(tr => !used.has(tr));
      if (!candidates.length) break;
      const scored = candidates.map(tr => {
        let s = 0;
        if (this.keysCompatible(cur.key, tr.key)) s += 5;
        const bpmGap = Math.abs(tr.bpm - cur.bpm);
        s += Math.max(0, 3 - bpmGap / 2);
        const eDelta = tr.energy - cur.energy;
        if (wantCool) s += eDelta <= 0 ? 2 : -2;
        else s += (eDelta >= 0 && eDelta <= 2) ? 2 : eDelta > 2 ? -1 : -2;
        s += Math.random(); // keep repeat requests fresh
        return { tr, s };
      }).sort((a, b) => b.s - a.s);
      set.push(scored[0].tr);
      used.add(scored[0].tr);
    }

    const vibeLabel = { warmup: 'Warm-up', peak: 'Peak-time', journey: 'Full-journey' }[vibe];
    const genreLabel = genre && crate !== this.kb.tracks ? ` ${this.title(genre.id)}` : ' house';
    const lines = set.map((tr, i) => {
      const prev = set[i - 1];
      const note = !prev ? 'opener'
        : this.keysCompatible(prev.key, tr.key)
          ? (prev.key === tr.key ? 'same key — long blend' : 'harmonic move')
          : 'key jump — use an echo out or drum section';
      return `${i + 1}. ${tr.artist} — ${tr.title} · ${tr.bpm} BPM · ${tr.key} · energy ${tr.energy}/10  (${note})`;
    });
    return [
      `${vibeLabel}${genreLabel} set, ${set.length} tracks, harmonically routed:`,
      ...lines,
      ``,
      `Each pick chains by Camelot compatibility and small BPM steps${vibe === 'journey' ? ', arcing the energy up and easing off at the end' : ''}. Run it again for a different route through the crate.`,
    ].join('\n');
  }

  keysCompatible(a, b) {
    const pa = a.match(/^(\d+)([AB])$/), pb = b.match(/^(\d+)([AB])$/);
    if (!pa || !pb) return false;
    const na = +pa[1], nb = +pb[1], la = pa[2], lb = pb[2];
    if (na === nb) return true; // same or relative
    if (la !== lb) return false;
    const diff = Math.abs(na - nb);
    return diff === 1 || diff === 11; // ±1 with 12↔1 wrap
  }

  fallbackText() {
    return `That one's outside my crate. I can school you on genres, legends, technique, harmonic mixing, gear and history — try "help" for the full menu, or add a Claude API key in Settings and I'll freestyle on anything.`;
  }

  // ---- CLAUDE (optional) -------------------------------------------------------
  async askClaude(text, cfg) {
    const system = this.buildSystemPrompt();

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': cfg.apiKey,
        'anthropic-version': '2023-06-01',
        // Required to call the API directly from a browser origin.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: cfg.model || 'claude-opus-4-8',
        max_tokens: 600,
        system,
        messages: [{ role: 'user', content: text }],
      }),
    });

    if (!resp.ok) {
      let detail = `${resp.status}`;
      try { const j = await resp.json(); detail = j.error?.message || detail; } catch (e) {}
      throw new Error(detail);
    }

    const json = await resp.json();
    if (json.stop_reason === 'refusal') {
      return `Can't help with that one — let's keep it about the music.`;
    }
    const block = Array.isArray(json.content) ? json.content.find(b => b.type === 'text') : null;
    return block ? block.text.trim() : null;
  }

  buildSystemPrompt() {
    const kb = this.kb;
    const genres = kb.genres.map(g => `- ${g.id} (${g.bpm[0]}-${g.bpm[1]} BPM, ${g.origin}, ${g.era}): ${g.sound} Key artists: ${g.artists.join(', ')}.`).join('\n');
    const history = kb.history.map(h => `- ${h.year}: ${h.event}`).join('\n');
    return [
      `You are SELECTA, a veteran house music DJ and mentor with three decades in the booth — from Chicago basements to Ibiza terraces.`,
      `Personality: warm, generous with knowledge, a little playful, zero gatekeeping. You use natural DJ vernacular (the crate, the booth, blends, weapons) without overdoing slang.`,
      `You know house music history, every subgenre, harmonic mixing and the Camelot wheel, mixing technique (beatmatching, phrasing, EQ/bass swaps, filters, loops), gear (CDJs, turntables, rotary mixers, DVS), library prep, and set-building craft.`,
      `Answer questions about DJing and dance music with expert depth but keep replies conversational and reasonably concise. Plain text only — no markdown headers; simple bullet lists with "•" are fine.`,
      `If asked something entirely unrelated to music or DJing, answer briefly and helpfully, then steer back to the decks with a light touch.`,
      ``,
      `REFERENCE — HOUSE SUBGENRES:`,
      genres,
      ``,
      `REFERENCE — TIMELINE:`,
      history,
      ``,
      `Camelot rules you teach: compatible = same code, ±1 same letter (12 wraps to 1), same number with letter swapped (relative major/minor), and +2 as an energy boost.`,
    ].join('\n');
  }
}

window.DJBrain = DJBrain;
