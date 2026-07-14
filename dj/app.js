/*
 * app.js — UI wiring for SELECTA: chat rendering (with rich formatting for
 * lists, tracklists and headers), composer, quick-prompt chips, light/dark
 * theme toggle, and the settings modal (optional Claude API key).
 */

(() => {
  const CONFIG_KEY = 'selecta.config.v1';
  const THEME_KEY = 'selecta.theme.v1';

  // ---- config ----------------------------------------------------------------
  function loadConfig() {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveConfig(cfg) { localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); }

  const brain = new window.DJBrain(loadConfig);

  // ---- elements ----------------------------------------------------------------
  const chat = document.getElementById('chat');
  const composer = document.getElementById('composer');
  const input = document.getElementById('input');
  const chips = document.getElementById('chips');
  const themeBtn = document.getElementById('themeBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const apiKeyInput = document.getElementById('apiKey');
  const saveKeyBtn = document.getElementById('saveKey');
  const clearKeyBtn = document.getElementById('clearKey');
  const bpmReadout = document.getElementById('bpmReadout');

  // ---- theme -------------------------------------------------------------------
  function applyTheme(theme) {
    document.body.classList.toggle('light', theme === 'light');
    themeBtn.textContent = theme === 'light' ? '🌙' : '☀️';
    themeBtn.title = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
  }
  let theme = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(theme);
  themeBtn.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  });

  // ---- rich message rendering ------------------------------------------------------
  // The brain returns plain text with a light structure: "• " bullets, "N. " numbered
  // tracklist lines, ALL-CAPS/colon-terminated header lines, and blank-line paragraph
  // breaks. Render those as real elements (built via DOM APIs — no innerHTML with
  // message content, so nothing can inject markup).
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
        li.textContent = bullet[1];
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
        if (noteMatch) {
          body.textContent = noteMatch[1];
          const note = document.createElement('span');
          note.className = 'track-note';
          note.textContent = noteMatch[2];
          body.appendChild(note);
        } else {
          body.textContent = numbered[2];
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

  function addMessage(role, text) {
    const row = document.createElement('div');
    row.className = `msg ${role}`;
    if (role === 'agent') {
      const tag = document.createElement('div');
      tag.className = 'msg-tag';
      tag.textContent = 'SELECTA';
      row.appendChild(tag);
    }
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (role === 'agent') renderRich(bubble, text);
    else bubble.textContent = text;
    row.appendChild(bubble);
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
    return bubble;
  }

  function addTyping() {
    const row = document.createElement('div');
    row.className = 'msg agent typing';
    row.innerHTML = '<div class="msg-tag">SELECTA</div><div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
    return row;
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
    const { text: reply } = await brain.respond(text);
    const elapsed = Date.now() - started;
    await new Promise(r => setTimeout(r, Math.max(0, 350 - elapsed)));
    typing.remove();
    addMessage('agent', reply);
  }

  composer.addEventListener('submit', (e) => {
    e.preventDefault();
    handleQuery(input.value);
  });

  chips.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (btn) handleQuery(btn.dataset.q);
  });

  // ---- settings modal --------------------------------------------------------------
  function openModal() {
    apiKeyInput.value = loadConfig().apiKey || '';
    modalBackdrop.classList.remove('hidden');
    apiKeyInput.focus();
  }
  function closeModal() { modalBackdrop.classList.add('hidden'); }

  settingsBtn.addEventListener('click', openModal);
  modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  saveKeyBtn.addEventListener('click', () => {
    const cfg = loadConfig();
    cfg.apiKey = apiKeyInput.value.trim();
    saveConfig(cfg);
    closeModal();
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

  // ---- decorative BPM readout ---------------------------------------------------------
  let bpm = 124.0;
  setInterval(() => {
    bpm += (Math.random() - 0.5) * 0.2;
    bpm = Math.min(128, Math.max(120, bpm));
    bpmReadout.textContent = `${bpm.toFixed(1)} BPM`;
  }, 2000);

  // ---- opening message -------------------------------------------------------------
  addMessage('agent',
    'Hey! I\'m SELECTA, your house music DJ — decades of crate knowledge, from the Warehouse to the White Isle.\n\n' +
    'I can help you with:\n' +
    '• Genres — every house style, its sound, BPM and essential tracks\n' +
    '• The legends — artists, labels and the history of house\n' +
    '• DJ technique — beatmatching, EQ mixing, harmonic keys, set building\n' +
    '• Gear advice and track recommendations\n\n' +
    'Tap a suggestion below, or just type a question to get started.');
})();
