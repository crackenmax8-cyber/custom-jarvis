/*
 * app.js — UI wiring for SELECTA: chat rendering (rich formatting for lists,
 * track cards with BPM/key pills and energy meters, headers), composer,
 * quick-prompt chips, light/dark theme toggle, and the settings modal.
 *
 * All localStorage access goes through the `storage` wrapper — sandboxed
 * embeds (e.g. artifact viewers) block storage entirely, and a bare access
 * would throw and kill every event listener on the page.
 */

(() => {
  const CONFIG_KEY = 'selecta.config.v1';
  const THEME_KEY = 'selecta.theme.v1';

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
  let theme = storage.get(THEME_KEY) || 'dark';
  applyTheme(theme);
  themeBtn.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    storage.set(THEME_KEY, theme);
    document.body.classList.add('theme-locked'); // in-app choice wins over any host theme
    applyTheme(theme);
  });

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
      tag.textContent = 'SELECTA';
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
    tag.textContent = 'SELECTA';
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
