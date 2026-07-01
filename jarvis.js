/*
 * jarvis.js — the conversational brain.
 *
 * Two modes:
 *   1. LOCAL (default, works fully offline): rule-based intent matching over the
 *      dashboard data. Answers questions about projects and usage limits, plus
 *      greetings / time / help.
 *   2. CLAUDE (optional): if the operator saves an Anthropic API key in Settings,
 *      free-form questions are routed to Claude (claude-opus-4-8) with the live
 *      dashboard state injected as context, so it can answer intelligently and
 *      conversationally. Falls back to LOCAL on any error.
 */

class JarvisBrain {
  constructor(getData, getConfig) {
    this.getData = getData;       // () => current dashboard data
    this.getConfig = getConfig;   // () => { apiKey, model }
  }

  // Primary entry point. Returns { text } for display + speech.
  async respond(rawText) {
    const text = (rawText || '').trim();
    if (!text) return { text: "I didn't catch that. Say it again?" };

    const local = this.localIntent(text);

    // High-confidence local intents (dashboard queries, greetings, meta) answer
    // instantly and for free. Everything else prefers Claude when configured.
    if (local && local.confident) return { text: local.text };

    const cfg = this.getConfig();
    if (cfg && cfg.apiKey) {
      try {
        const reply = await this.askClaude(text, cfg);
        if (reply) return { text: reply };
      } catch (e) {
        // fall through to local fallback
        return { text: (local && local.text) || this.fallbackText() + ` (Claude link error: ${e.message})` };
      }
    }

    return { text: (local && local.text) || this.fallbackText() };
  }

  // ---- LOCAL INTENTS -------------------------------------------------------
  localIntent(text) {
    const t = text.toLowerCase();
    const data = this.getData();

    const has = (...words) => words.some(w => t.includes(w));

    // greeting
    if (has('hello', 'hey jarvis', 'hi jarvis', 'good morning', 'good evening', 'good afternoon', 'are you there', 'you online', 'wake up')) {
      const hour = new Date().getHours();
      const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      const active = data.projects.filter(p => p.status === 'active').length;
      return { confident: true, text: `Good ${part}, ${data.operator}. All systems online. You have ${active} active projects. How can I help?` };
    }

    // help / capabilities
    if (has('what can you do', 'help me', 'commands', 'how do you work', 'what do you do')) {
      return { confident: true, text: `I monitor your projects and usage limits. Try: "status report", "which projects need attention", "how many tokens are left", or "are we near any limits". You can also just talk to me — with a Claude API key in Settings I can hold a full conversation.` };
    }

    // time / date
    if (has('what time', 'the time', 'what day', "today's date", 'what date', 'current time')) {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      return { confident: true, text: `It's ${time} on ${date}.` };
    }

    // thanks
    if (has('thank you', 'thanks', 'appreciate it', 'good job', 'well done')) {
      return { confident: true, text: `Always a pleasure, ${data.operator}.` };
    }

    // ---- usage limits ----
    const usageWords = ['usage', 'limit', 'limits', 'quota', 'capacity', 'consumption', 'how much', 'running out', 'near', 'close to', 'over budget'];
    const perMetric = {
      tokens: ['token'],
      api: ['api', 'requests', 'calls'],
      compute: ['compute', 'gpu', 'processing'],
      storage: ['storage', 'disk', 'space'],
      bandwidth: ['bandwidth', 'network', 'traffic', 'transfer'],
    };
    // specific metric
    for (const [id, kws] of Object.entries(perMetric)) {
      if (kws.some(k => t.includes(k))) {
        const m = data.usage.find(u => u.id === id);
        if (m) {
          const pct = Math.round((m.used / m.limit) * 100);
          const status = window.JarvisData.usageStatus(m.used, m.limit);
          const used = window.JarvisData.formatUsageValue(m.used, m.fmt, m.unit);
          const limit = window.JarvisData.formatUsageValue(m.limit, m.fmt, m.unit);
          const tail = status === 'critical' ? ' That is a critical level — I recommend throttling.'
                     : status === 'warning' ? ' Approaching the ceiling — keep an eye on it.'
                     : ' Plenty of headroom.';
          return { confident: true, text: `${m.label} is at ${pct} percent — ${used} of ${limit}.${tail}` };
        }
      }
    }
    // general usage / "near any limits"
    if (has(...usageWords)) {
      const critical = data.usage.filter(u => window.JarvisData.usageStatus(u.used, u.limit) === 'critical');
      const warning = data.usage.filter(u => window.JarvisData.usageStatus(u.used, u.limit) === 'warning');
      if (has('near', 'close to', 'running out', 'over budget') || t.includes('any limit')) {
        if (!critical.length && !warning.length) return { confident: true, text: `All usage metrics are in the green. Nothing near its limit.` };
        const parts = [];
        if (critical.length) parts.push(`critical on ${critical.map(u => u.label).join(', ')}`);
        if (warning.length) parts.push(`elevated on ${warning.map(u => u.label).join(', ')}`);
        return { confident: true, text: `Heads up — you're ${parts.join(', and ')}.` };
      }
      // full readout
      const lines = data.usage.map(u => {
        const pct = Math.round((u.used / u.limit) * 100);
        return `${u.label} ${pct} percent`;
      });
      return { confident: true, text: `Usage readout — ${lines.join(', ')}.` };
    }

    // ---- projects ----
    // specific project by name match
    for (const p of data.projects) {
      const key = p.name.toLowerCase();
      const shortKey = key.replace(/^project\s+/, '');
      if (t.includes(shortKey) || t.includes(key)) {
        return { confident: true, text: `${p.name} — ${p.domain}. Status ${p.status}, ${p.progress} percent complete, ${p.tasksDone} of ${p.tasksTotal} tasks done. Last activity ${p.updated}.` };
      }
    }

    // projects needing attention / at risk
    if (has('attention', 'at risk', 'behind', 'stalled', 'blocked', 'problem', 'trouble', 'worried', 'concern')) {
      const flagged = data.projects.filter(p => p.status === 'warning' || p.status === 'paused');
      if (!flagged.length) return { confident: true, text: `Nothing flagged — all projects are on track.` };
      const desc = flagged.map(p => `${p.name} (${p.status})`).join(', ');
      return { confident: true, text: `${flagged.length} ${flagged.length === 1 ? 'project needs' : 'projects need'} attention: ${desc}.` };
    }

    // "how many projects" — checked before the status report so the 'projects'
    // keyword there doesn't swallow the count query.
    if (t.includes('how many project')) {
      return { confident: true, text: `You're tracking ${data.projects.length} projects.` };
    }

    // status report / overview
    if (has('status', 'report', 'overview', 'projects', 'working on', 'summary', 'brief me', "what's going on", 'whats going on', 'update me', 'rundown')) {
      const active = data.projects.filter(p => p.status === 'active');
      const complete = data.projects.filter(p => p.status === 'complete');
      const flagged = data.projects.filter(p => p.status === 'warning' || p.status === 'paused');
      const avg = Math.round(data.projects.reduce((s, p) => s + p.progress, 0) / data.projects.length);
      let text = `Status report: ${data.projects.length} projects tracked, ${avg} percent average completion. ${active.length} active, ${complete.length} complete.`;
      if (flagged.length) text += ` ${flagged.length} need attention: ${flagged.map(p => p.name).join(', ')}.`;
      return { confident: true, text };
    }

    return null; // no confident local match
  }

  fallbackText() {
    return `I can brief you on projects and usage limits — try "status report" or "are we near any limits". For open-ended conversation, add a Claude API key in Settings.`;
  }

  // ---- CLAUDE (optional) ---------------------------------------------------
  async askClaude(text, cfg) {
    const data = this.getData();
    const system = this.buildSystemPrompt(data);

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
        max_tokens: 400,
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
      return `I'm not able to help with that one.`;
    }
    const block = Array.isArray(json.content) ? json.content.find(b => b.type === 'text') : null;
    return block ? block.text.trim() : null;
  }

  buildSystemPrompt(data) {
    const projects = data.projects.map(p =>
      `- ${p.name} (${p.domain}): status=${p.status}, ${p.progress}% complete, ${p.tasksDone}/${p.tasksTotal} tasks, updated ${p.updated}`
    ).join('\n');
    const usage = data.usage.map(u => {
      const pct = Math.round((u.used / u.limit) * 100);
      const used = window.JarvisData.formatUsageValue(u.used, u.fmt, u.unit);
      const limit = window.JarvisData.formatUsageValue(u.limit, u.fmt, u.unit);
      return `- ${u.label}: ${used} / ${limit} (${pct}%)`;
    }).join('\n');

    return [
      `You are JARVIS, a calm, precise, lightly witty AI assistant modeled on Tony Stark's assistant.`,
      `You speak to the operator, whom you address as "${data.operator}".`,
      `Your replies are SPOKEN ALOUD, so keep them concise (1-3 sentences), natural, and free of markdown, lists, or code.`,
      `You have live access to this dashboard. Use it to answer questions about projects and usage limits accurately.`,
      ``,
      `PROJECTS:`,
      projects,
      ``,
      `USAGE LIMITS (thresholds: under 70% healthy, 70-90% elevated, 90%+ critical):`,
      usage,
      ``,
      `If asked something unrelated to the dashboard, answer helpfully and briefly anyway.`,
    ].join('\n');
  }
}

window.JarvisBrain = JarvisBrain;
