/*
 * app.js — UI wiring for ClassMate: assignment board rendering, stat tiles,
 * chat, connect/demo/refresh flows, theme toggle and settings.
 *
 * All localStorage access goes through the `storage` wrapper — sandboxed
 * embeds block storage entirely, and a bare access would throw and kill
 * every event listener on the page.
 */

(() => {
  const CONFIG_KEY = 'classmate.config.v1';
  const THEME_KEY = 'classmate.theme.v1';

  const storage = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };

  function loadConfig() {
    try { return JSON.parse(storage.get(CONFIG_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveConfig(cfg) { storage.set(CONFIG_KEY, JSON.stringify(cfg)); }

  const client = new window.ClassroomClient(loadConfig);
  const brain = new window.ClassMateBrain(client, loadConfig);

  // ---- elements ----------------------------------------------------------------
  const $ = id => document.getElementById(id);
  const chat = $('chat'), composer = $('composer'), input = $('input'), chips = $('chips');
  const connectBtn = $('connectBtn'), refreshBtn = $('refreshBtn'), themeBtn = $('themeBtn'), settingsBtn = $('settingsBtn');
  const syncDot = $('syncDot'), syncLabel = $('syncLabel');
  const boardEmpty = $('boardEmpty'), boardGroups = $('boardGroups');
  const emptyConnect = $('emptyConnect'), emptyDemo = $('emptyDemo');
  const modalBackdrop = $('modalBackdrop'), clientIdInput = $('clientId'), apiKeyInput = $('apiKey');
  const saveSettings = $('saveSettings'), disconnectBtn = $('disconnectBtn');

  // ---- theme (light by default) --------------------------------------------------
  function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
    themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  let theme = storage.get(THEME_KEY) || 'light';
  applyTheme(theme);
  themeBtn.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    storage.set(THEME_KEY, theme);
    document.body.classList.add('theme-locked');
    applyTheme(theme);
  });

  // ---- board rendering ------------------------------------------------------------
  function fmtDueShort(i) {
    if (!i.dueAt) return 'no due date';
    return brain.fmtDue(i.dueAt);
  }

  function card(i) {
    const el = document.createElement('div');
    el.className = `card state-${i.state}`;
    const title = document.createElement(i.link ? 'a' : 'div');
    title.className = 'card-title';
    title.textContent = i.title;
    if (i.link) { title.href = i.link; title.target = '_blank'; title.rel = 'noopener'; title.title = 'Open in Google Classroom'; }
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const course = document.createElement('span');
    course.className = 'card-pill course';
    course.textContent = i.courseName;
    const due = document.createElement('span');
    due.className = 'card-pill due';
    due.textContent = fmtDueShort(i);
    meta.appendChild(course);
    meta.appendChild(due);
    if (i.points) {
      const pts = document.createElement('span');
      pts.className = 'card-pill';
      pts.textContent = `${i.points} pts`;
      meta.appendChild(pts);
    }
    el.appendChild(title);
    el.appendChild(meta);
    if (i.state !== 'done') {
      const help = document.createElement('button');
      help.className = 'help-btn';
      help.textContent = '✨ Break it down';
      help.title = 'Get a step-by-step starter plan in the chat';
      help.addEventListener('click', (e) => {
        e.preventDefault();
        handleQuery(`Break down "${i.title}"`);
      });
      el.appendChild(help);
    }
    return el;
  }

  function group(title, items, cls, note) {
    if (!items.length) return null;
    const g = document.createElement('div');
    g.className = `group ${cls || ''}`;
    const h = document.createElement('h2');
    h.className = 'group-title';
    h.textContent = `${title} · ${items.length}`;
    g.appendChild(h);
    if (note) {
      const p = document.createElement('p');
      p.className = 'group-note';
      p.textContent = note;
      g.appendChild(p);
    }
    const wrap = document.createElement('div');
    wrap.className = 'group-cards';
    for (const i of items) wrap.appendChild(card(i));
    g.appendChild(wrap);
    return g;
  }

  function renderBoard() {
    const connected = client.mode !== 'none';
    boardEmpty.style.display = connected ? 'none' : '';
    boardGroups.textContent = '';
    syncDot.className = 'sync-dot' + (connected ? ' on' : '');
    syncLabel.textContent = client.mode === 'google' ? `Synced ${client.lastSync.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
      : client.mode === 'demo' ? 'Demo data' : 'Not connected';
    connectBtn.textContent = connected ? (client.mode === 'demo' ? 'Connect Google' : 'Reconnect') : 'Connect Google';

    const setStat = (id, v, hot) => {
      const el = $(id);
      el.textContent = connected ? v : '–';
      el.closest('.stat').classList.toggle('hot', !!(connected && hot && v > 0));
    };
    const missing = client.missing().sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0));
    const today = client.dueToday();
    const week = client.dueThisWeek().filter(i => !today.includes(i));
    setStat('statMissing', missing.length, true);
    setStat('statToday', today.length, true);
    setStat('statWeek', week.length + today.length);
    setStat('statOpen', client.open().length);
    setStat('statDone', client.done().length);
    if (!connected) return;

    const later = client.open()
      .filter(i => !missing.includes(i) && !today.includes(i) && !week.includes(i) && i.dueAt)
      .sort((a, b) => a.dueAt - b.dueAt);
    const noDue = client.open().filter(i => !i.dueAt && !missing.includes(i));
    const done = client.done().sort((a, b) => (b.dueAt || 0) - (a.dueAt || 0)).slice(0, 6);

    for (const g of [
      group('Needs attention', missing, 'g-missing', 'Overdue or marked missing — oldest first.'),
      group('Due today', today, 'g-today'),
      group('This week', week, 'g-week'),
      group('Coming up', later, 'g-later'),
      group('No due date', noDue, 'g-nodue'),
      group('Recently turned in', done, 'g-done'),
    ]) if (g) boardGroups.appendChild(g);

    if (!boardGroups.children.length) {
      const p = document.createElement('p');
      p.className = 'all-clear';
      p.textContent = '🎉 Nothing here — you\'re completely caught up.';
      boardGroups.appendChild(p);
    }
  }

  // ---- chat ---------------------------------------------------------------------
  function renderRich(container, text) {
    const lines = text.split('\n');
    let list = null;
    const closeList = () => { list = null; };
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim()) { closeList(); continue; }
      const bullet = line.match(/^•\s+(.*)$/);
      const numbered = line.match(/^(\d+)\.\s+(.*)$/);
      if (bullet || numbered) {
        if (!list) { list = document.createElement('ul'); container.appendChild(list); }
        const li = document.createElement('li');
        li.textContent = bullet ? bullet[1] : numbered[2];
        if (numbered) li.classList.add('numbered');
        list.appendChild(li);
        continue;
      }
      closeList();
      const p = document.createElement('p');
      if (/:$/.test(line)) p.className = 'lead';
      p.textContent = line;
      container.appendChild(p);
    }
  }

  function addMessage(role, text) {
    const row = document.createElement('div');
    row.className = `msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (role === 'agent') {
      const tag = document.createElement('div');
      tag.className = 'msg-tag';
      tag.textContent = 'ClassMate';
      row.appendChild(tag);
      renderRich(bubble, text);
    } else {
      bubble.textContent = text;
    }
    row.appendChild(bubble);
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
  }

  function addTyping() {
    const row = document.createElement('div');
    row.className = 'msg agent typing';
    row.innerHTML = '<div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
    return row;
  }

  // ---- actions --------------------------------------------------------------------
  async function doConnect() {
    const cfg = loadConfig();
    if (!cfg.googleClientId) {
      addMessage('agent', 'First we need a Google OAuth Client ID (free, 5-minute one-time setup — see the README). Open Settings (⚙), paste it in, then say "connect" again. Or say "demo" to explore with sample data meanwhile.');
      openModal();
      return;
    }
    addMessage('agent', 'Opening Google sign-in…');
    try {
      await client.connect();
      renderBoard();
      addMessage('agent', `Connected! I can see ${client.courses.length} classes and ${client.items.length} assignments. ${brain.quickPulse()}`);
    } catch (e) {
      if (e.message === 'NO_CLIENT_ID') { openModal(); return; }
      renderBoard();
      addMessage('agent', `Couldn't connect: ${e.message} You can say "demo" to explore with sample data.`);
    }
  }

  function doDemo() {
    client.loadDemo();
    renderBoard();
  }

  async function doRefresh() {
    if (client.mode === 'google') {
      try { await client.fetchAll(); } catch (e) { addMessage('agent', `Refresh failed: ${e.message}`); }
    } else if (client.mode === 'demo') {
      client.loadDemo();
    }
    renderBoard();
    if (client.mode !== 'none') addMessage('agent', `Fresh numbers: ${brain.quickPulse()}`);
  }

  function doDisconnect() {
    client.disconnect();
    renderBoard();
  }

  function handleAction(action) {
    if (!action) return;
    if (action.type === 'connect') doConnect();
    else if (action.type === 'demo') doDemo();
    else if (action.type === 'refresh') doRefresh();
    else if (action.type === 'disconnect') doDisconnect();
  }

  async function handleQuery(q) {
    const text = (q || '').trim();
    if (!text) return;
    addMessage('user', text);
    input.value = '';
    input.focus();
    const typing = addTyping();
    const started = Date.now();
    const { text: reply, action } = await brain.respond(text);
    await new Promise(r => setTimeout(r, Math.max(0, 300 - (Date.now() - started))));
    typing.remove();
    addMessage('agent', reply);
    handleAction(action);
  }

  composer.addEventListener('submit', (e) => { e.preventDefault(); handleQuery(input.value); });
  chips.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (btn) handleQuery(btn.dataset.q);
  });
  connectBtn.addEventListener('click', doConnect);
  emptyConnect.addEventListener('click', doConnect);
  emptyDemo.addEventListener('click', () => { doDemo(); addMessage('agent', `Demo mode on — a sample week so you can poke around. ${brain.quickPulse()} Say "connect" for the real thing.`); });
  refreshBtn.addEventListener('click', doRefresh);

  // ---- settings modal ----------------------------------------------------------------
  function openModal() {
    const cfg = loadConfig();
    clientIdInput.value = cfg.googleClientId || '';
    apiKeyInput.value = cfg.apiKey || '';
    modalBackdrop.classList.remove('hidden');
    clientIdInput.focus();
  }
  function closeModal() { modalBackdrop.classList.add('hidden'); }

  settingsBtn.addEventListener('click', openModal);
  modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  saveSettings.addEventListener('click', () => {
    const cfg = loadConfig();
    cfg.googleClientId = clientIdInput.value.trim();
    cfg.apiKey = apiKeyInput.value.trim();
    saveConfig(cfg);
    closeModal();
    addMessage('agent', cfg.googleClientId
      ? 'Client ID saved — say "connect" (or hit the button) and I\'ll open Google sign-in.'
      : 'Saved.');
  });
  disconnectBtn.addEventListener('click', () => { doDisconnect(); closeModal(); addMessage('agent', 'Disconnected — your data is cleared from the page.'); });

  // ---- boot -----------------------------------------------------------------------
  renderBoard();
  addMessage('agent',
    'Hi, I\'m ClassMate! I check your Google Classroom and keep every assignment in one tidy place — what\'s missing, what\'s due today, what\'s coming up.\n\n' +
    '• "Connect Google" links your school account (read-only — I can never change or submit anything)\n' +
    '• "Try the demo" shows how it all works with sample data\n\n' +
    'Once connected, ask me things like "what\'s due tomorrow?" or "am I missing anything?"');
})();
