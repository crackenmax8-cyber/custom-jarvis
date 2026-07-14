/*
 * app.js — UI wiring for MixIt: chat rendering (rich formatting for lists,
 * track cards with BPM/key pills and energy meters, headers), the live deck
 * (Web Audio beat engine + transport controls), the interactive Camelot wheel,
 * optional spoken replies, quick-prompt chips, theme toggle, and settings.
 *
 * All localStorage access goes through the `storage` wrapper — sandboxed
 * embeds (e.g. artifact viewers) block storage entirely, and a bare access
 * would throw and kill every event listener on the page.
 */

(() => {
  const CONFIG_KEY = 'mixit.config.v1';
  const THEME_KEY = 'mixit.theme.v1';
  const VOICE_KEY = 'mixit.voice.v1';

  // ---- safe storage (sandbox-proof) -------------------------------------------
  const storage = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };

  // ---- config ----------------------------------------------------------------
  function loadConfig() {
    try { return JSON.parse(storage.get(CONFIG_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveConfig(cfg) { storage.set(CONFIG_KEY, JSON.stringify(cfg)); }

  const brain = new window.DJBrain(loadConfig);

  // ---- elements ----------------------------------------------------------------
  const chat = document.getElementById('chat');
  const composer = document.getElementById('composer');
  const input = document.getElementById('input');
  const chips = document.getElementById('chips');
  const turntable = document.getElementById('turntable');
  const playBtn = document.getElementById('playBtn');
  const presets = document.getElementById('presets');
  const bpmDown = document.getElementById('bpmDown');
  const bpmUp = document.getElementById('bpmUp');
  const bpmReadout = document.getElementById('bpmReadout');
  const statusLabel = document.getElementById('statusLabel');
  const wheelBtn = document.getElementById('wheelBtn');
  const voiceBtn = document.getElementById('voiceBtn');
  const themeBtn = document.getElementById('themeBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const apiKeyInput = document.getElementById('apiKey');
  const saveKeyBtn = document.getElementById('saveKey');
  const clearKeyBtn = document.getElementById('clearKey');
  const wheelBackdrop = document.getElementById('wheelBackdrop');
  const wheelMount = document.getElementById('wheelMount');
  const wheelInfo = document.getElementById('wheelInfo');

  // ---- theme (light by default) --------------------------------------------------
  function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
    themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeBtn.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  }
  let theme = storage.get(THEME_KEY) || 'light';
  applyTheme(theme);
  themeBtn.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    storage.set(THEME_KEY, theme);
    document.body.classList.add('theme-locked'); // in-app choice wins over any host theme
    applyTheme(theme);
  });

  // ---- the live deck -------------------------------------------------------------
  const deck = new window.DJDeck(updateDeckUI);

  function updateDeckUI() {
    document.body.classList.toggle('playing', deck.playing);
    playBtn.textContent = deck.playing ? '⏹' : '▶';
    playBtn.setAttribute('aria-label', deck.playing ? 'Stop the beat' : 'Play the beat');
    statusLabel.textContent = deck.playing ? 'On air' : 'Ready to spin';
    bpmReadout.textContent = `${deck.bpm} BPM`;
    for (const btn of presets.querySelectorAll('.preset')) {
      btn.classList.toggle('active', btn.dataset.preset === deck.preset);
    }
  }

  function startDeck() {
    if (!deck.isSupported()) {
      addMessage('agent', 'This browser has no Web Audio support, so the live deck stays quiet — everything else still works.');
      return;
    }
    deck.start();
  }

  playBtn.addEventListener('click', () => (deck.playing ? deck.stop() : startDeck()));
  turntable.addEventListener('click', () => (deck.playing ? deck.stop() : startDeck()));
  presets.addEventListener('click', (e) => {
    const btn = e.target.closest('.preset');
    if (btn) deck.setPreset(btn.dataset.preset);
  });
  bpmDown.addEventListener('click', () => deck.setBpm(deck.bpm - 1));
  bpmUp.addEventListener('click', () => deck.setBpm(deck.bpm + 1));
  updateDeckUI();

  // ---- spoken replies (optional) ---------------------------------------------------
  let voiceOn = storage.get(VOICE_KEY) === 'on';
  function updateVoiceUI() {
    voiceBtn.textContent = voiceOn ? '🔊' : '🔇';
    voiceBtn.setAttribute('aria-pressed', String(voiceOn));
    voiceBtn.title = voiceOn ? 'Spoken replies: on' : 'Spoken replies: off';
  }
  updateVoiceUI();
  voiceBtn.addEventListener('click', () => {
    voiceOn = !voiceOn;
    storage.set(VOICE_KEY, voiceOn ? 'on' : 'off');
    updateVoiceUI();
    if (!voiceOn) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  });

  function speak(text) {
    if (!voiceOn) return;
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      // strip list bullets and squeeze whitespace; keep it to a spoken-size chunk
      const clean = text.replace(/^[•\d]+[.)]\s*/gm, '').replace(/\s+/g, ' ').trim().slice(0, 420);
      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = 1.02;
      utter.pitch = 0.92;
      synth.speak(utter);
    } catch (e) { /* speech unavailable */ }
  }

  // ---- rich message rendering ------------------------------------------------------
  // The brain returns plain text with a light structure: "• " bullets, "N. "
  // numbered tracklist lines, header lines, blank-line paragraph breaks, and
  // " · "-separated track metadata (BPM / Camelot key / energy). Everything is
  // built via DOM APIs — no innerHTML with message content.

  // "Artist — Title (1999) · 126 BPM · 11B · energy 8/10" → title + metadata pills
  function renderTrackText(container, text) {
    const parts = text.split(' · ');
    if (parts.length < 2) { container.appendChild(document.createTextNode(text)); return; }
    const title = document.createElement('span');
    title.className = 'track-title';
    title.textContent = parts[0];
    container.appendChild(title);
    const pills = document.createElement('span');
    pills.className = 'pills';
    for (const p of parts.slice(1)) {
      const energy = p.match(/^energy\s+(\d+)\/10$/i);
      const pill = document.createElement('span');
      if (energy) {
        pill.className = 'pill pill-energy';
        pill.title = `Energy ${energy[1]} out of 10`;
        const label = document.createElement('span');
        label.textContent = 'energy';
        const meter = document.createElement('span');
        meter.className = 'meter';
        const fill = document.createElement('span');
        fill.className = 'meter-fill';
        fill.style.width = `${Math.min(10, Number(energy[1])) * 10}%`;
        meter.appendChild(fill);
        pill.appendChild(label);
        pill.appendChild(meter);
      } else {
        pill.className = /^\d{1,2}[AB]$/.test(p) ? 'pill pill-key' : 'pill';
        pill.textContent = p;
      }
      pills.appendChild(pill);
    }
    container.appendChild(pills);
  }

  function renderRich(container, text) {
    const lines = text.split('\n');
    let list = null;      // open <ul>
    let tracklist = null; // open tracklist wrapper

    const closeGroups = () => { list = null; tracklist = null; };

    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim()) { closeGroups(); continue; }

      const bullet = line.match(/^•\s+(.*)$/);
      const numbered = line.match(/^(\d+)\.\s+(.*)$/);

      if (bullet) {
        tracklist = null;
        if (!list) { list = document.createElement('ul'); container.appendChild(list); }
        const li = document.createElement('li');
        renderTrackText(li, bullet[1]);
        list.appendChild(li);
        continue;
      }

      if (numbered) {
        list = null;
        if (!tracklist) { tracklist = document.createElement('div'); tracklist.className = 'tracklist'; container.appendChild(tracklist); }
        const row = document.createElement('div');
        row.className = 'track-row';
        const badge = document.createElement('span');
        badge.className = 'track-num';
        badge.textContent = numbered[1];
        const body = document.createElement('span');
        body.className = 'track-body';
        // split off a trailing "(note)" so transition hints read as a subtle second line
        const noteMatch = numbered[2].match(/^(.*)\s{2,}\((.+)\)$/);
        renderTrackText(body, noteMatch ? noteMatch[1] : numbered[2]);
        if (noteMatch) {
          const note = document.createElement('span');
          note.className = 'track-note';
          note.textContent = noteMatch[2];
          body.appendChild(note);
        }
        row.appendChild(badge);
        row.appendChild(body);
        tracklist.appendChild(row);
        continue;
      }

      closeGroups();
      const p = document.createElement('p');
      const isHeader = /:$/.test(line) || (/^[A-Z0-9 ·–&''\-()\/+]+$/.test(line) && line.length < 80 && /[A-Z]{2}/.test(line));
      if (isHeader) p.className = 'lead';
      p.textContent = line;
      container.appendChild(p);
    }
  }

  function makeAvatar() {
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.setAttribute('aria-hidden', 'true');
    const disc = document.createElement('div');
    disc.className = 'avatar-disc';
    avatar.appendChild(disc);
    return avatar;
  }

  function addMessage(role, text) {
    const row = document.createElement('div');
    row.className = `msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (role === 'agent') {
      renderRich(bubble, text);
      const col = document.createElement('div');
      col.className = 'msg-col';
      const tag = document.createElement('div');
      tag.className = 'msg-tag';
      tag.textContent = 'MixIt';
      col.appendChild(tag);
      col.appendChild(bubble);
      row.appendChild(makeAvatar());
      row.appendChild(col);
    } else {
      bubble.textContent = text;
      row.appendChild(bubble);
    }
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
    return bubble;
  }

  function addTyping() {
    const row = document.createElement('div');
    row.className = 'msg agent typing';
    const col = document.createElement('div');
    col.className = 'msg-col';
    const tag = document.createElement('div');
    tag.className = 'msg-tag';
    tag.textContent = 'MixIt';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      dot.className = 'dot';
      bubble.appendChild(dot);
    }
    col.appendChild(tag);
    col.appendChild(bubble);
    row.appendChild(makeAvatar());
    row.appendChild(col);
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
    return row;
  }

  // ---- brain actions -------------------------------------------------------------
  function handleAction(action) {
    if (!action) return;
    if (action.type === 'play') {
      deck.setPreset(action.preset || 'classic');
      if (action.bpm) deck.setBpm(action.bpm);
      startDeck();
    } else if (action.type === 'stop') {
      deck.stop();
    } else if (action.type === 'wheel') {
      openWheel();
    }
  }

  async function handleQuery(q) {
    const text = (q || '').trim();
    if (!text) return;
    addMessage('user', text);
    input.value = '';
    input.focus();
    const typing = addTyping();
    // tiny delay so local answers still feel conversational
    const started = Date.now();
    const { text: reply, action } = await brain.respond(text);
    const elapsed = Date.now() - started;
    await new Promise(r => setTimeout(r, Math.max(0, 350 - elapsed)));
    typing.remove();
    addMessage('agent', reply);
    speak(reply);
    handleAction(action);
  }

  composer.addEventListener('submit', (e) => {
    e.preventDefault();
    handleQuery(input.value);
  });

  chips.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (btn) handleQuery(btn.dataset.q);
  });

  // ---- Camelot wheel modal --------------------------------------------------------
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let wheelBuilt = false;

  function polar(cx, cy, r, deg) {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  // annular sector path from angle a0 to a1 between radii r1 (inner) and r2 (outer)
  function sectorPath(cx, cy, r1, r2, a0, a1) {
    const [x1, y1] = polar(cx, cy, r2, a0);
    const [x2, y2] = polar(cx, cy, r2, a1);
    const [x3, y3] = polar(cx, cy, r1, a1);
    const [x4, y4] = polar(cx, cy, r1, a0);
    return `M ${x1} ${y1} A ${r2} ${r2} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r1} ${r1} 0 0 0 ${x4} ${y4} Z`;
  }

  function buildWheel() {
    if (wheelBuilt) return;
    wheelBuilt = true;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 320 320');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Camelot wheel of musical keys');
    const cx = 160, cy = 160;
    const rings = [
      { letter: 'B', r1: 105, r2: 152, tr: 128 }, // outer: major
      { letter: 'A', r1: 58, r2: 105, tr: 82 },   // inner: minor
    ];
    for (const ring of rings) {
      for (let n = 1; n <= 12; n++) {
        const center = (n % 12) * 30 - 90; // 12 at the top
        const a0 = center - 14, a1 = center + 14;
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', sectorPath(cx, cy, ring.r1, ring.r2, a0, a1));
        path.setAttribute('class', 'wheel-seg');
        path.dataset.num = String(n);
        path.dataset.letter = ring.letter;
        const names = window.DJKnowledge.camelot[n];
        const title = document.createElementNS(SVG_NS, 'title');
        title.textContent = `${n}${ring.letter} — ${ring.letter === 'A' ? names[0] : names[1]}`;
        path.appendChild(title);
        svg.appendChild(path);
        const [tx, ty] = polar(cx, cy, ring.tr, center);
        const label = document.createElementNS(SVG_NS, 'text');
        label.setAttribute('x', String(tx));
        label.setAttribute('y', String(ty));
        label.setAttribute('class', 'wheel-label');
        label.textContent = `${n}${ring.letter}`;
        svg.appendChild(label);
      }
    }
    svg.addEventListener('click', (e) => {
      const seg = e.target.closest('.wheel-seg');
      if (seg) selectWheelKey(svg, Number(seg.dataset.num), seg.dataset.letter);
    });
    wheelMount.appendChild(svg);
  }

  function selectWheelKey(svg, num, letter) {
    const wrap = n => ((n - 1) % 12 + 12) % 12 + 1;
    for (const seg of svg.querySelectorAll('.wheel-seg')) {
      const n = Number(seg.dataset.num), l = seg.dataset.letter;
      seg.classList.toggle('sel', n === num && l === letter);
      seg.classList.toggle('comp', (n === num && l !== letter) || (l === letter && (n === wrap(num - 1) || n === wrap(num + 1))));
      seg.classList.toggle('boost', l === letter && n === wrap(num + 2));
    }
    wheelInfo.textContent = '';
    renderRich(wheelInfo, brain.camelotAnswer(num, letter));
  }

  function openWheel() {
    buildWheel();
    wheelBackdrop.classList.remove('hidden');
  }
  wheelBtn.addEventListener('click', openWheel);
  wheelBackdrop.addEventListener('click', (e) => { if (e.target === wheelBackdrop) wheelBackdrop.classList.add('hidden'); });

  // ---- settings modal --------------------------------------------------------------
  function openModal() {
    apiKeyInput.value = loadConfig().apiKey || '';
    modalBackdrop.classList.remove('hidden');
    apiKeyInput.focus();
  }
  function closeModals() {
    modalBackdrop.classList.add('hidden');
    wheelBackdrop.classList.add('hidden');
  }

  settingsBtn.addEventListener('click', openModal);
  modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModals(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModals(); });

  saveKeyBtn.addEventListener('click', () => {
    const cfg = loadConfig();
    cfg.apiKey = apiKeyInput.value.trim();
    saveConfig(cfg);
    closeModals();
    addMessage('agent', cfg.apiKey
      ? 'Claude link is live — ask me anything and I\'ll freestyle beyond the crate.'
      : 'Running fully offline on the built-in crate.');
  });
  clearKeyBtn.addEventListener('click', () => {
    apiKeyInput.value = '';
    const cfg = loadConfig();
    delete cfg.apiKey;
    saveConfig(cfg);
  });

  // ---- opening message -------------------------------------------------------------
  addMessage('agent',
    'Hey, I\'m MixIt — your house music DJ! I\'ve got decades of crate knowledge and a real working deck: press the record up top (or say "drop a beat") and I\'ll play you a groove right here.\n\n' +
    'Here\'s what we can do together:\n' +
    '• Play music — "drop a beat", "play some acid at 128"\n' +
    '• Explore — genres, legendary DJs, labels and the history of house\n' +
    '• Learn to mix — beatmatching, EQ, keys, building a set\n' +
    '• Have fun — "build me a set", "quiz me", "give me a DJ tip"\n\n' +
    'Tap a suggestion below, or just ask me anything.');
})();
