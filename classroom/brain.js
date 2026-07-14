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
    // greeting / help
    if (has('hello', 'hey', 'hi ', 'yo ', 'sup', 'good morning', 'good evening') || t === 'hi' || t === 'yo') {
      return { confident: true, text: connected
        ? `Hey! ${this.quickPulse()} Ask me "what's due this week?", "anything missing?", or pick a class by name.`
        : `Hey! I'm ClassMate — I keep an eye on your Google Classroom assignments. Say "connect" to link your account (read-only), or "demo" to see how it works first.` };
    }
    if (has('what can you do', 'help', 'commands', 'how do you work')) {
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
    const list = c.items.map(i =>
      `- [${i.state}] ${i.title} (${i.courseName})${i.dueAt ? ` due ${i.dueAt.toLocaleString()}` : ''}${i.points ? `, ${i.points} pts` : ''}`
    ).join('\n');
    return [
      `You are ClassMate, a friendly, encouraging assistant that helps a student stay on top of Google Classroom assignments.`,
      `Keep replies short, warm and practical. Plain text only — simple "•" bullets are fine, no markdown headers.`,
      `Help with prioritizing, planning study time, and breaking big assignments into steps. Do NOT do the assignments for them.`,
      ``,
      c.mode === 'none' ? `No Classroom data is connected yet.` : `Current assignments (synced ${c.lastSync ? c.lastSync.toLocaleTimeString() : ''}):`,
      list || '(none)',
    ].join('\n');
  }
}

window.ClassMateBrain = ClassMateBrain;
