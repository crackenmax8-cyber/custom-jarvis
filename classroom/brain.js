/*
 * brain.js — ClassMate's conversational brain.
 *
 * LOCAL intents answer assignment questions from the synced Classroom data
 * ("what's due tomorrow?", "am I missing anything?", "how's my week look?").
 * With an optional Anthropic API key in Settings, anything else goes to
 * Claude with the live assignment list injected as context.
 *
 * respond() returns { text, action? } — actions the UI executes:
 *   {type:'connect'} / {type:'demo'} / {type:'refresh'} / {type:'disconnect'}
 */

class ClassMateBrain {
  constructor(client, getConfig) {
    this.client = client;         // ClassroomClient
    this.getConfig = getConfig;   // () => { apiKey, googleClientId }
  }

  async respond(rawText) {
    const text = (rawText || '').trim();
    if (!text) return { text: 'Say that again?' };

    const local = this.localIntent(text);
    if (local && local.confident) return { text: local.text, action: local.action };

    const cfg = this.getConfig();
    if (cfg && cfg.apiKey) {
      try {
        const reply = await this.askClaude(text, cfg);
        if (reply) return { text: reply };
      } catch (e) {
        return { text: (local && local.text) || this.fallbackText() + ` (Claude link error: ${e.message})` };
      }
    }
    return { text: (local && local.text) || this.fallbackText(), action: local && local.action };
  }

  localIntent(text) {
    const t = text.toLowerCase();
    const has = (...words) => words.some(w => t.includes(w));
    const c = this.client;
    const connected = c.mode !== 'none';

    // connection management ("disconnect" first — it contains "connect")
    if (has('disconnect', 'sign out', 'log out', 'logout', 'unlink')) {
      return { confident: true, text: `Disconnected. Your data is cleared from the page. Say "connect" anytime.`, action: { type: 'disconnect' } };
    }
    if (has('connect', 'sign in', 'log in', 'login', 'link my', 'sync my google')) {
      return { confident: true, text: `Opening Google sign-in — pick your school account and allow read-only access. I never see your password and can't change anything in Classroom.`, action: { type: 'connect' } };
    }
    if (has('demo', 'sample', 'try it', 'example data', 'test data')) {
      return { confident: true, text: `Demo mode on — here's a sample week so you can poke around. Say "connect" whenever you want your real Classroom.`, action: { type: 'demo' } };
    }
    if (has('refresh', 'reload', 'sync', 'check again', 'update')) {
      if (!connected) return { confident: true, text: `Nothing to refresh yet — say "connect" to link your Google Classroom, or "demo" to explore with sample data.` };
      return { confident: true, text: `On it — pulling the latest from ${c.mode === 'demo' ? 'the demo data' : 'Google Classroom'}…`, action: { type: 'refresh' } };
    }
    // ---- teacher tools: teach / solve / rate (teacher role only) ----
    if (this.role === 'teacher' && has('test drive', 'test-drive', 'solve', 'answer key', 'work through', 'rate', 'difficulty', 'how hard', 'hardest', 'easiest', 'calibrate', 'teach', 'explain the concept', 'mini-lesson', 'mini lesson', 'lesson for')) {
      if (!connected) {
        return { confident: true, text: `Once I can see your coursework I'm all yours — say "connect" to link your Classroom (teacher mode), or "demo" to try it with sample assignments.` };
      }
      if (has('hardest', 'easiest', 'rate all', 'rate everything', 'all of them', 'rank', 'my assignments', 'rate my')) {
        return { confident: true, text: this.rateAll(has('easiest')) };
      }
      const item = this.findItem(t);
      if (!item) {
        const ex = c.open()[0];
        return { confident: true, text: `Which assignment? e.g. "solve ${ex ? ex.title : 'the essay'}", "teach the concept behind it", or "rate everything" for the full ranking.` };
      }
      if (has('teach', 'explain the concept', 'mini-lesson', 'mini lesson', 'lesson for')) return this.teachConcept(item);
      if (has('solve', 'answer key', 'work through')) return this.solveItem(item);
      return this.testDrive(item);
    }

    // assignment coaching — checked before the generic help intent, since
    // "help me start…" contains "help"
    if (has('break it down', 'break down', 'help me start', 'help me with', 'how do i start', 'get started on', 'where do i start', 'plan for')) {
      if (!connected) {
        return { confident: true, text: `Happy to — once I can see your assignments. Say "connect" to link Google Classroom, or "demo" to try it with sample data.` };
      }
      const item = this.findItem(t);
      if (!item) {
        const ex = c.open()[0];
        return { confident: true, text: `Which one? Name it and I'll break it down — e.g. "break down ${ex ? ex.title : 'the essay'}".` };
      }
      return { confident: true, text: this.coachPlan(item) };
    }

    // greeting / help
    if (has('hello', 'hey', 'hi ', 'yo ', 'sup', 'good morning', 'good evening') || t === 'hi' || t === 'yo') {
      return { confident: true, text: connected
        ? `Hey! ${this.quickPulse()} Ask me "what's due this week?", "anything missing?", or pick a class by name.`
        : `Hey! I'm ClassMate — I keep an eye on your Google Classroom assignments. Say "connect" to link your account (read-only), or "demo" to see how it works first.` };
    }
    if (has('what can you do', 'help', 'commands', 'how do you work')) {
      if (this.role === 'teacher') {
        return { confident: true, text: [
          `Teacher mode — here's what I can do with your coursework:`,
          `• "Solve [assignment]" — work it through for a full exemplar solution / answer key`,
          `• "Teach [assignment]" — a classroom-ready mini-lesson on the concept behind it`,
          `• "Test drive [assignment]" — difficulty rating, time estimate, ambiguity flags, rubric`,
          `• "Rate everything" / "which is hardest?" — rank all open assignments by difficulty`,
          `• "What's due this week?" — deadlines across all your courses · any course by name`,
          `• "Refresh" to re-check Classroom · "connect" / "disconnect" / "demo"`,
          `Tip: Solve and Teach do the real work via Claude — add an API key in Settings.`,
        ].join('\n') };
      }
      return { confident: true, text: [
        `Here's what I can check for you:`,
        `• "What's due today / tomorrow / this week?"`,
        `• "Am I missing anything?" — overdue and unsubmitted work`,
        `• "How does my week look?" — a full workload summary`,
        `• "What's left in Chemistry?" — any class by name`,
        `• "What have I turned in?"`,
        `• "Refresh" to re-check Classroom · "connect" / "disconnect" / "demo"`,
        `Add a Claude API key in Settings and I can also help you plan and prioritize.`,
      ].join('\n') };
    }

    if (!connected && has('due', 'missing', 'assignment', 'homework', 'turned in', 'submit', 'week', 'today', 'tomorrow', 'left', 'overdue', 'late')) {
      return { confident: true, text: `I can't see your Classroom yet. Say "connect" to link your Google account (read-only), or "demo" to explore with sample data.` };
    }
    if (!connected) return null;

    // missing / overdue
    if (has('missing', 'overdue', 'late', 'behind', 'forgot', 'unsubmitted', 'past due')) {
      const m = c.missing().sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0));
      if (!m.length) return { confident: true, text: `You're all caught up — nothing missing or overdue. 🎉` };
      return { confident: true, text: [
        `${m.length} ${m.length === 1 ? 'assignment needs' : 'assignments need'} attention:`,
        ...m.map((i, n) => this.line(n + 1, i)),
        ``,
        `Oldest first — knock out the top one and the list gets friendlier.`,
      ].join('\n') };
    }

    // due today / tomorrow / this week
    if (has('today', 'tonight')) {
      return { confident: true, text: this.listOrCheer(c.dueToday(), `due today`) };
    }
    if (has('tomorrow')) {
      return { confident: true, text: this.listOrCheer(c.dueTomorrow(), `due tomorrow`) };
    }
    if (has('this week', 'next 7', 'week look', 'my week', 'weekend')) {
      return { confident: true, text: this.weekSummary() };
    }

    // turned in / done
    if (has('turned in', 'submitted', 'done', 'finished', 'completed')) {
      const d = c.done().sort((a, b) => (b.dueAt || 0) - (a.dueAt || 0)).slice(0, 8);
      if (!d.length) return { confident: true, text: `Nothing marked turned-in yet.` };
      return { confident: true, text: [
        `Recently turned in (${c.done().length} total):`,
        ...d.map((i, n) => this.line(n + 1, i)),
      ].join('\n') };
    }

    // per-course query
    for (const course of c.courses) {
      const words = course.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      if (t.includes(course.name.toLowerCase()) || words.some(w => t.includes(w))) {
        const list = c.forCourse(course.name);
        if (!list.length) return { confident: true, text: `${course.name}: nothing outstanding. Clean slate!` };
        return { confident: true, text: [
          `${course.name} — ${list.length} open:`,
          ...list.map((i, n) => this.line(n + 1, i)),
        ].join('\n') };
      }
    }

    // generic status / what's due / summary
    if (has('due', 'status', 'summary', 'what do i have', "what's left", 'whats left', 'workload', 'assignments', 'homework', 'everything', 'catch me up', 'brief')) {
      return { confident: true, text: this.weekSummary() };
    }

    // thanks
    if (has('thank', 'nice', 'awesome', 'great')) {
      return { confident: true, text: `Anytime. Go get that homework done — I'll keep watch. 📚` };
    }

    return null;
  }

  get role() { return (this.getConfig().role === 'teacher') ? 'teacher' : 'student'; }

  // ---- teacher tools --------------------------------------------------------------
  // Quick heuristic difficulty from type, points and description length — a
  // calibration starting point; the Claude hookup does the real analysis.
  rateItem(i) {
    const title = (i.title + ' ' + (i.description || '')).toLowerCase();
    let score = 2;
    if (/project|research|presentation|report/.test(title)) score += 2;
    else if (/essay|paper|analysis|analyzing/.test(title)) score += 1.5;
    else if (/lab/.test(title)) score += 1;
    if (/quiz|safety|review|optional|flashcard/.test(title)) score -= 1;
    if (i.points >= 100) score += 1; else if (i.points >= 50) score += 0.5; else if (i.points > 0 && i.points <= 15) score -= 0.5;
    if ((i.description || '').length > 220) score += 0.5;
    const stars = Math.min(5, Math.max(1, Math.round(score)));
    const mins = Math.round(Math.min(300, Math.max(15,
      (i.points ? i.points * 2 : 40) * (stars >= 4 ? 1.5 : stars <= 2 ? 0.7 : 1))) / 15) * 15;
    return { stars, mins };
  }

  fmtRating(i) {
    const { stars, mins } = this.rateItem(i);
    const time = mins >= 60 ? `${(mins / 60).toFixed(mins % 60 ? 1 : 0)} h` : `${mins} min`;
    return { stars, mins, label: `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} · ~${time} of student time` };
  }

  rateAll(easiestFirst) {
    const rated = this.client.open()
      .map(i => ({ i, r: this.fmtRating(i) }))
      .sort((a, b) => easiestFirst ? a.r.stars - b.r.stars || a.r.mins - b.r.mins : b.r.stars - a.r.stars || b.r.mins - a.r.mins);
    if (!rated.length) return `No open assignments to rate right now.`;
    const out = [`Difficulty ranking, ${easiestFirst ? 'easiest' : 'hardest'} first (my quick calibration — ask me to "test drive" any of them for the deep dive):`];
    rated.forEach(({ i, r }, n) => out.push(`${n + 1}. ${i.title} · ${i.courseName} · ${r.label}`));
    const heavy = rated.filter(x => x.r.stars >= 4).length;
    if (heavy >= 2) out.push('', `Heads up: ${heavy} heavyweight assignments are open at once — worth checking their due dates don't collide for students taking multiple of your courses.`);
    return out.join('\n');
  }

  testDrive(item) {
    const r = this.fmtRating(item);
    const base = [
      `Test drive: "${item.title}" (${item.courseName}${item.points ? `, ${item.points} pts` : ''})`,
      ``,
      `• Quick difficulty read: ${r.label}`,
      item.description ? `• Instructions on file: "${item.description.slice(0, 160)}${item.description.length > 160 ? '…' : ''}"` : `• No description on this one — students may need clearer instructions.`,
    ];
    if (this.getConfig().apiKey) {
      // hand off to Claude (system prompt carries the teacher instructions + full
      // descriptions) for the worked solution, ambiguity flags and rubric
      return { confident: false, text: base.join('\n') };
    }
    base.push('', `For the full test drive — a worked exemplar solution, ambiguity flags, prerequisite check and a rubric suggestion — add a Claude API key in Settings and ask again. The quick read above is heuristic (type + points + instruction length).`);
    return { confident: true, text: base.join('\n') };
  }

  // ✅ Solve: the full worked solution / answer key (Claude does the working)
  solveItem(item) {
    if (this.getConfig().apiKey) {
      return { confident: false, text: `Working "${item.title}" (${item.courseName}) end-to-end — full solution coming up.` };
    }
    const r = this.fmtRating(item);
    return { confident: true, text: [
      `Solving "${item.title}" needs the Claude hookup — that's the part that actually works the assignment (worked answers, model outline + sample paragraph for essays, expected lab results).`,
      ``,
      `Add an Anthropic API key in Settings (⚙) and hit Solve again. Meanwhile, my quick read: ${r.label}.`,
    ].join('\n') };
  }

  // 🧑‍🏫 Teach: a classroom-ready mini-lesson on the concept behind the assignment
  teachConcept(item) {
    if (this.getConfig().apiKey) {
      return { confident: false, text: `Building a mini-lesson for the concept behind "${item.title}" (${item.courseName})…` };
    }
    return { confident: true, text: [
      `Mini-lesson skeleton for "${item.title}" (${item.courseName}) — add a Claude API key in Settings and I'll fill in every beat with real content:`,
      ``,
      `1. Learning objective — one sentence: "Students will be able to…"`,
      `2. Hook — a 60-second real-world question that makes the concept matter.`,
      `3. Core explanation — the idea in plain language, then the formal version.`,
      `4. Worked example — one you do on the board (different from the assignment, so the assignment still assesses).`,
      `5. Common misconceptions — the 2 mistakes half the class will make, named out loud.`,
      `6. Quick check — 3 exit-ticket questions from easy to stretch.`,
    ].join('\n') };
  }

  // ---- assignment coaching ------------------------------------------------------
  // Fuzzy-match an open assignment from the user's words (quoted title wins).
  findItem(t) {
    const open = this.client.open();
    const quoted = t.match(/"([^"]+)"/);
    if (quoted) {
      const q = quoted[1].toLowerCase();
      const hit = open.find(i => i.title.toLowerCase().includes(q) || q.includes(i.title.toLowerCase()));
      if (hit) return hit;
    }
    let best = null, bestScore = 0;
    for (const i of open) {
      const words = i.title.toLowerCase().split(/[^a-z0-9.]+/).filter(w => w.length > 3);
      const score = words.filter(w => t.includes(w)).length;
      if (score > bestScore) { best = i; bestScore = score; }
    }
    return bestScore >= 1 ? best : null;
  }

  // A starter plan tailored to the assignment type — coaching, never the work itself.
  coachPlan(i) {
    const title = i.title.toLowerCase();
    const steps =
      /essay|paper|writing|paragraph/.test(title) ? [
        'Re-read the prompt and underline exactly what it asks — thesis questions hide in the verbs.',
        'Brain-dump every idea for 10 minutes, no filtering.',
        'Pick your 2–3 strongest points and write a one-sentence thesis.',
        'Outline: intro, one paragraph per point with a quote/example each, conclusion.',
        'Write the ugly first draft straight through — fix nothing yet.',
        'Revise once for argument, once for grammar. Read it aloud at the end.',
      ] :
      /lab|experiment/.test(title) ? [
        'Pull up your raw data and the lab handout side by side.',
        'Sketch the structure: purpose, hypothesis, method (brief), results, analysis, conclusion.',
        'Make your data table/graph first — the analysis almost writes itself from it.',
        'In the analysis, answer: did the results match the hypothesis? Why or why not?',
        'Note at least one error source — graders always look for it.',
      ] :
      /worksheet|problem|practice|set\b|packet/.test(title) ? [
        'Skim all the problems first and mark each: easy / medium / no idea.',
        'Do every easy one first — momentum is real.',
        'For the mediums, find the matching example in your notes or textbook and mirror it.',
        'For the "no idea" ones, write down where exactly you get stuck — that\'s your question for the teacher or a friend.',
        'Check answers on the easy ones before trusting your method on the hard ones.',
      ] :
      /quiz|test|exam|prep|review/.test(title) ? [
        'Gather what it covers: notes, past worksheets, the study guide if there is one.',
        'Make a one-page summary sheet from memory first, then fill gaps from notes.',
        'Turn the gaps into flashcards or practice questions.',
        'Do one timed self-test, then review only what you missed.',
        'Sleep — a rested brain outscores a crammed one.',
      ] :
      /project|research|presentation/.test(title) ? [
        'List every deliverable the rubric mentions — that list is your roadmap.',
        'Work backwards from the due date: research → outline → build → polish, with a day each at minimum.',
        'Do the research pass first and save every source link as you go.',
        'Build the skeleton (headings/slides) before writing anything pretty.',
        'Finish a rough complete version early — polishing beats panicking.',
      ] :
      /read|journal|chapter|response/.test(title) ? [
        'Read the response prompt FIRST so you know what to watch for.',
        'Skim the chapter headings, then read with quick margin notes or sticky flags.',
        'Mark 2–3 quotes or moments that connect to the prompt.',
        'Write your response from those marks — specific beats general every time.',
      ] : [
        'Read the instructions twice and list every deliverable.',
        'Split it into 3–4 chunks that each take under 30 minutes.',
        'Do the easiest chunk first to build momentum.',
        'Leave a final pass for checking against the instructions.',
      ];

    const out = [`Let's crack "${i.title}" (${i.courseName}${i.dueAt ? `, ${this.fmtDue(i.dueAt)}` : ''}):`, ''];
    steps.forEach((s, n) => out.push(`${n + 1}. ${s}`));
    if (i.dueAt) {
      const days = Math.max(0, Math.round((i.dueAt - new Date()) / 86400000));
      out.push('', days <= 0 ? `This one's due — do steps 1–2 right now and the rest in one sitting.`
        : days === 1 ? `Due tomorrow: steps 1–3 today, the rest tomorrow morning.`
        : `You've got ~${days} days: spread the steps out, roughly ${Math.max(1, Math.ceil(steps.length / days))} per day.`);
    }
    out.push('', `I'll coach you through any step — but the work itself has to be yours. That's the honest way and the only one that actually sticks for the test.${this.getConfig().apiKey ? '' : ' (Add a Claude key in Settings and I can explain concepts step-by-step too.)'}`);
    return out.join('\n');
  }

  // ---- formatting helpers -----------------------------------------------------
  line(n, i) {
    const due = i.dueAt ? this.fmtDue(i.dueAt) : 'no due date';
    const status = i.state === 'missing' ? 'missing' : i.state === 'done' ? 'turned in' : due === 'no due date' ? 'open' : 'upcoming';
    const pts = i.points ? ` · ${i.points} pts` : '';
    return `${n}. ${i.title} · ${i.courseName} · ${due}${pts} · ${status}`;
  }

  fmtDue(d) {
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const that = new Date(d); that.setHours(0, 0, 0, 0);
    const diff = Math.round((that - today) / 86400000);
    const time = d.getHours() !== 23 || d.getMinutes() !== 59
      ? ` ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : '';
    if (diff === 0) return `due today${time}`;
    if (diff === 1) return `due tomorrow${time}`;
    if (diff === -1) return `was due yesterday`;
    if (diff < 0) return `was due ${that.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    if (diff < 7) return `due ${d.toLocaleDateString('en-US', { weekday: 'long' })}${time}`;
    return `due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }

  listOrCheer(list, label) {
    if (!list.length) return `Nothing ${label}. Enjoy the breathing room!`;
    return [
      `${list.length} ${label}:`,
      ...list.map((i, n) => this.line(n + 1, i)),
    ].join('\n');
  }

  quickPulse() {
    const m = this.client.missing().length;
    const w = this.client.dueThisWeek().length;
    if (!m && !w) return `You're fully caught up.`;
    const parts = [];
    if (m) parts.push(`${m} missing`);
    if (w) parts.push(`${w} due this week`);
    return `Quick pulse: ${parts.join(', ')}.`;
  }

  weekSummary() {
    const c = this.client;
    const missing = c.missing();
    const today = c.dueToday();
    const week = c.dueThisWeek();
    const later = c.open().filter(i => i.dueAt && !week.includes(i) && !missing.includes(i)).sort((a, b) => a.dueAt - b.dueAt);
    const noDue = c.open().filter(i => !i.dueAt);
    const out = [`Here's your week across ${c.courses.length} classes:`];
    if (missing.length) {
      out.push(``, `Needs attention (${missing.length}):`);
      missing.forEach((i, n) => out.push(this.line(n + 1, i)));
    }
    if (week.length) {
      out.push(``, `Due in the next 7 days (${week.length}):`);
      week.forEach((i, n) => out.push(this.line(n + 1, i)));
    }
    if (later.length) out.push(``, `Further out: ${later.length} more (nearest: ${later[0].title}, ${this.fmtDue(later[0].dueAt)}).`);
    if (noDue.length) out.push(`No due date: ${noDue.map(i => i.title).join(', ')}.`);
    if (!missing.length && !week.length && !later.length && !noDue.length) {
      return `Completely clear — no open assignments anywhere. Legend. 🎉`;
    }
    if (!missing.length) out.push(``, `Nothing missing — you're on top of it. 💪`);
    return out.join('\n');
  }

  fallbackText() {
    return this.client.mode === 'none'
      ? `I'm your assignment checker — say "connect" to link Google Classroom, "demo" to try sample data, or "help" for everything I can do.`
      : `Not sure about that one. Try "what's due this week?", "anything missing?", a class name — or add a Claude API key in Settings and I can help with anything.`;
  }

  // ---- CLAUDE (optional) --------------------------------------------------------
  async askClaude(text, cfg) {
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
        system: this.buildSystemPrompt(),
        messages: [{ role: 'user', content: text }],
      }),
    });
    if (!resp.ok) {
      let detail = `${resp.status}`;
      try { const j = await resp.json(); detail = j.error?.message || detail; } catch (e) {}
      throw new Error(detail);
    }
    const json = await resp.json();
    if (json.stop_reason === 'refusal') return `I can't help with that one.`;
    const block = Array.isArray(json.content) ? json.content.find(b => b.type === 'text') : null;
    return block ? block.text.trim() : null;
  }

  buildSystemPrompt() {
    const c = this.client;
    const teacher = this.role === 'teacher';
    const list = c.items.map(i =>
      `- [${i.state}] ${i.title} (${i.courseName})${i.dueAt ? ` due ${i.dueAt.toLocaleString()}` : ''}${i.points ? `, ${i.points} pts` : ''}${i.description ? `\n  instructions: ${i.description.slice(0, 400)}` : ''}`
    ).join('\n');
    const roleBlock = teacher ? [
      `You are ClassMate, a sharp, collegial assistant for a TEACHER reviewing their own Google Classroom coursework across multiple courses. The assignments below are the teacher's own material — they authored it.`,
      `When asked to SOLVE an assignment (or "answer key" / "work through"), work it completely as a strong student would — a full exemplar solution / answer key (for essays: a model outline plus a sample paragraph; for problem sets: worked answers with steps shown; for labs: the expected results and calculations). Then add a one-line difficulty read and anything that felt ambiguous while working it.`,
      `When asked to TEACH or explain the concept behind an assignment, produce a classroom-ready mini-lesson: (1) a one-sentence learning objective, (2) a 60-second hook, (3) the core explanation in plain language then the formal version, (4) one worked example DIFFERENT from the assignment so the assignment still assesses, (5) the two most common misconceptions, (6) three exit-ticket questions from easy to stretch.`,
      `When asked to "test drive" or rate an assignment, do the full job:`,
      `1. Work the assignment as a strong student would — a complete exemplar solution / answer key.`,
      `2. Rate difficulty 1-5 with a one-line justification, and estimate realistic student time.`,
      `3. Flag anything ambiguous, unclearly worded, or missing from the instructions.`,
      `4. List prerequisite concepts students need, and note any that may not have been covered yet based on the other coursework.`,
      `5. Suggest a simple point-breakdown rubric.`,
      `Be candid — a too-hard or unclear assignment is exactly what they want to catch before students see it.`,
    ] : [
      `You are ClassMate, a friendly, encouraging assistant that helps a student stay on top of Google Classroom assignments.`,
      `Help with prioritizing, planning study time, breaking big assignments into steps, and explaining concepts they're stuck on.`,
      `You NEVER produce work for submission — no writing their essays, no solving their graded problems, no answers to hand in. If asked, warmly decline and coach them through doing it themselves instead (explain the concept, walk through a DIFFERENT example, ask guiding questions). This is non-negotiable, for their own good.`,
    ];
    return [
      ...roleBlock,
      `Keep replies practical and well-organized. Plain text only — simple "•" bullets and numbered lists are fine, no markdown headers.`,
      ``,
      c.mode === 'none' ? `No Classroom data is connected yet.` : `Current coursework (synced ${c.lastSync ? c.lastSync.toLocaleTimeString() : ''}):`,
      list || '(none)',
    ].join('\n');
  }
}

window.ClassMateBrain = ClassMateBrain;
