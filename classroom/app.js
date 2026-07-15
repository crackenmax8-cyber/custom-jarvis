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

  // falls back to in-memory storage where localStorage is blocked (sandboxed
  // embeds) so settings like the role switch still work for the session
  const memStore = {};
  const storage = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return k in memStore ? memStore[k] : null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { memStore[k] = String(v); } },
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
  const setupBackdrop = $('setupBackdrop'), setupClientId = $('setupClientId');
  const setupSave = $('setupSave'), setupCancel = $('setupCancel'), originCode = $('originCode');
  const connectLabel = $('connectLabel');

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
  const COURSE_COLORS = ['#0f9b80', '#6366f1', '#d97706', '#db2777', '#0284c7', '#7c3aed'];
  function courseColor(courseId) {
    const idx = client.courses.findIndex(c => c.id === courseId);
    return COURSE_COLORS[(idx >= 0 ? idx : 0) % COURSE_COLORS.length];
  }

  // board filters: free-text search + a stat-tile filter
  let searchQuery = '';
  let statFilter = null; // 'missing' | 'today' | 'week' | 'done' | null

  function fmtDueShort(i) {
    if (!i.dueAt) return 'no due date';
    return brain.fmtDue(i.dueAt);
  }

  function card(i) {
    const el = document.createElement('div');
    el.className = `card state-${i.state}`;
    const color = courseColor(i.courseId);
    if (i.state !== 'missing' && i.state !== 'done') el.style.borderLeftColor = color;
    const title = document.createElement(i.link ? 'a' : 'div');
    title.className = 'card-title';
    title.textContent = i.title;
    if (i.link) { title.href = i.link; title.target = '_blank'; title.rel = 'noopener'; title.title = 'Open in Google Classroom'; }
    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const course = document.createElement('span');
    course.className = 'card-pill course';
    course.textContent = i.courseName;
    course.style.color = color;
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
    if (loadConfig().role === 'teacher' && i.state !== 'done') {
      const r = brain.fmtRating(i);
      const diff = document.createElement('span');
      diff.className = 'card-pill diff';
      diff.textContent = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
      diff.title = `Estimated difficulty ${r.stars}/5 · ${r.label.split('· ')[1] || ''}`;
      meta.appendChild(diff);
    }
    el.appendChild(title);
    el.appendChild(meta);
    if (i.state !== 'done') {
      const teacher = loadConfig().role === 'teacher';
      const actions = document.createElement('div');
      actions.className = 'card-actions';
      const mkBtn = (label, title, query) => {
        const b = document.createElement('button');
        b.className = 'help-btn';
        b.textContent = label;
        b.title = title;
        b.addEventListener('click', (e) => { e.preventDefault(); handleQuery(query); });
        actions.appendChild(b);
      };
      if (teacher) {
        mkBtn('🧑‍🏫 Teach', 'A classroom-ready mini-lesson on the concept behind this assignment', `Teach the concept behind "${i.title}"`);
        mkBtn('✅ Solve', 'Work the assignment through — a full exemplar solution / answer key (needs a Claude key)', `Solve "${i.title}"`);
        mkBtn('🧪 Rate', 'Difficulty rating, time estimate, ambiguity flags and a rubric suggestion', `Test drive "${i.title}"`);
      } else {
        mkBtn('✨ Break it down', 'Get a step-by-step starter plan in the chat', `Break down "${i.title}"`);
      }
      el.appendChild(actions);
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
      : client.mode === 'demo' ? 'Demo data' : 'Not signed in';
    connectLabel.textContent = client.mode === 'google' ? 'Re-sync' : 'Sign in with Google';

    const teacher = loadConfig().role === 'teacher';
    const setStat = (id, v, hot) => {
      const el = $(id);
      el.textContent = connected ? v : '–';
      el.closest('.stat').classList.toggle('hot', !!(connected && hot && v > 0));
    };
    const setLabel = (k, txt) => { document.querySelector(`.stat[data-k="${k}"] .stat-label`).textContent = txt; };

    const missing = client.missing().sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0));
    const today = client.dueToday();
    const week = client.dueThisWeek().filter(i => !today.includes(i));

    if (teacher) {
      const pastDue = client.open().filter(i => i.dueAt && i.dueAt < new Date());
      setLabel('missing', 'past deadline');
      setLabel('done', 'courses');
      setStat('statMissing', pastDue.length, false);
      setStat('statToday', today.length, true);
      setStat('statWeek', week.length + today.length);
      setStat('statOpen', client.items.length);
      setStat('statDone', client.courses.length);
      setLabel('open', 'assignments');
    } else {
      setLabel('missing', 'missing');
      setLabel('done', 'turned in');
      setLabel('open', 'open total');
      setStat('statMissing', missing.length, true);
      setStat('statToday', today.length, true);
      setStat('statWeek', week.length + today.length);
      setStat('statOpen', client.open().length);
      setStat('statDone', client.done().length);
    }
    document.getElementById('boardTools').classList.toggle('hidden', !connected);
    if (!connected) return;

    // active filters: free-text search + a clicked stat tile
    const q = searchQuery.trim().toLowerCase();
    const todaySet = new Set(client.dueToday());
    const weekSet = new Set(client.dueThisWeek());
    const now = new Date();
    const visible = (i) => {
      if (q && !(i.title.toLowerCase().includes(q) || i.courseName.toLowerCase().includes(q))) return false;
      if (statFilter === 'missing') return teacher ? (i.dueAt && i.dueAt < now && i.state !== 'done') : i.state === 'missing';
      if (statFilter === 'today') return todaySet.has(i);
      if (statFilter === 'week') return todaySet.has(i) || weekSet.has(i);
      if (statFilter === 'done') return i.state === 'done';
      return true;
    };
    for (const tile of document.querySelectorAll('.stat')) {
      tile.classList.toggle('active', tile.dataset.k === statFilter);
    }
    document.getElementById('clearFilter').classList.toggle('hidden', !statFilter && !q);

    if (teacher) {
      // teacher board: one group per course, soonest deadline first, points total in the header
      for (const course of client.courses) {
        const list = client.items
          .filter(i => i.courseId === course.id && visible(i))
          .sort((a, b) => (a.dueAt ? a.dueAt.getTime() : Infinity) - (b.dueAt ? b.dueAt.getTime() : Infinity));
        const pts = list.reduce((s, i) => s + (i.points || 0), 0);
        const g = group(course.name, list, 'g-course', pts ? `${pts} points across ${list.length} assignment${list.length === 1 ? '' : 's'}` : null);
        if (g) boardGroups.appendChild(g);
      }
    } else {
      const later = client.open()
        .filter(i => !missing.includes(i) && !today.includes(i) && !week.includes(i) && i.dueAt)
        .sort((a, b) => a.dueAt - b.dueAt);
      const noDue = client.open().filter(i => !i.dueAt && !missing.includes(i));
      const done = client.done().sort((a, b) => (b.dueAt || 0) - (a.dueAt || 0)).slice(0, 6);

      for (const g of [
        group('Needs attention', missing.filter(visible), 'g-missing', 'Overdue or marked missing — oldest first.'),
        group('Due today', today.filter(visible), 'g-today'),
        group('This week', week.filter(visible), 'g-week'),
        group('Coming up', later.filter(visible), 'g-later'),
        group('No due date', noDue.filter(visible), 'g-nodue'),
        group('Recently turned in', done.filter(visible), 'g-done'),
      ]) if (g) boardGroups.appendChild(g);
    }

    if (!boardGroups.children.length) {
      const p = document.createElement('p');
      p.className = 'all-clear';
      p.textContent = (q || statFilter) ? 'Nothing matches that filter — clear it to see everything.'
        : teacher ? 'No coursework found in your courses yet.'
        : '🎉 Nothing here — you\'re completely caught up.';
      boardGroups.appendChild(p);
    }
  }

  // filter wiring: type to search, click a stat tile to filter, click again to clear
  document.getElementById('searchBox').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderBoard();
  });
  document.getElementById('clearFilter').addEventListener('click', () => {
    searchQuery = '';
    statFilter = null;
    document.getElementById('searchBox').value = '';
    renderBoard();
  });
  document.getElementById('stats').addEventListener('click', (e) => {
    const tile = e.target.closest('.stat');
    if (!tile || client.mode === 'none') return;
    const k = tile.dataset.k;
    if (k === 'open') { statFilter = null; renderBoard(); return; }
    if (loadConfig().role === 'teacher' && k === 'done') return; // 'courses' tile isn't a filter
    statFilter = statFilter === k ? null : k;
    renderBoard();
  });

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

  function copyText(text, btn) {
    const ok = () => { btn.textContent = '✓ copied'; setTimeout(() => { btn.textContent = '📋 copy'; }, 1500); };
    try {
      navigator.clipboard.writeText(text).then(ok, () => fallbackCopy(text, btn, ok));
    } catch (e) { fallbackCopy(text, btn, ok); }
  }
  function fallbackCopy(text, btn, ok) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      ok();
    } catch (e) { btn.textContent = '✗'; }
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
      // longer replies (plans, lessons, rankings) get a copy button
      if (text.length > 160) {
        const copy = document.createElement('button');
        copy.className = 'copy-btn';
        copy.textContent = '📋 copy';
        copy.title = 'Copy this reply as text';
        copy.addEventListener('click', () => copyText(text, copy));
        bubble.appendChild(copy);
      }
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
  function openSetup() {
    try { originCode.textContent = window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:8000'; } catch (e) {}
    setupClientId.value = loadConfig().googleClientId || '';
    setupBackdrop.classList.remove('hidden');
    setupClientId.focus();
  }

  async function doConnect() {
    const cfg = loadConfig();
    if (!cfg.googleClientId) {
      // first run: walk through Google's one-time app registration, then sign in
      openSetup();
      return;
    }
    addMessage('agent', 'Opening Google sign-in — pick your account and you\'re in…');
    try {
      await client.connect();
      const c2 = loadConfig();
      const firstTime = !c2.granted;
      c2.granted = true;
      saveConfig(c2);
      renderBoard();
      addMessage('agent', `Signed in! I can see ${client.courses.length} ${loadConfig().role === 'teacher' ? 'courses you teach' : 'classes'} and ${client.items.length} assignments. ${brain.quickPulse()}${firstTime ? ' (Next time it\'s one click — Google remembers your permission.)' : ''}`);
    } catch (e) {
      if (e.message === 'NO_CLIENT_ID') { openSetup(); return; }
      renderBoard();
      addMessage('agent', `Couldn't sign in: ${e.message} You can say "demo" to explore with sample data.`);
    }
  }

  setupSave.addEventListener('click', () => {
    const v = setupClientId.value.trim();
    const cfg = loadConfig();
    cfg.googleClientId = v;
    saveConfig(cfg);
    setupBackdrop.classList.add('hidden');
    if (v) doConnect();
    else addMessage('agent', 'No worries — say "demo" to explore meanwhile, and hit "Sign in with Google" whenever you\'re ready to finish the one-time setup.');
  });
  setupCancel.addEventListener('click', () => {
    setupBackdrop.classList.add('hidden');
    addMessage('agent', 'Setup parked — say "demo" to explore with sample data anytime, or hit "Sign in with Google" to pick the setup back up.');
  });
  setupBackdrop.addEventListener('click', (e) => { if (e.target === setupBackdrop) setupBackdrop.classList.add('hidden'); });

  function resetFilters() {
    searchQuery = '';
    statFilter = null;
    const box = document.getElementById('searchBox');
    if (box) box.value = '';
  }

  function doDemo() {
    client.loadDemo();
    resetFilters();
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
    resetFilters();
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
  emptyDemo.addEventListener('click', () => {
    doDemo();
    addMessage('agent', loadConfig().role === 'teacher'
      ? `Demo mode on — sample coursework across four courses. Hit "🧪 Test drive & rate" on any assignment, or say "rate everything".`
      : `Demo mode on — a sample week so you can poke around. ${brain.quickPulse()} Say "connect" for the real thing.`);
  });
  refreshBtn.addEventListener('click', doRefresh);

  // ---- role ----------------------------------------------------------------------
  function renderChips() {
    const teacher = loadConfig().role === 'teacher';
    const defs = teacher ? [
      ['🧪 Rate everything', 'Rate everything'],
      ['🔥 Which is hardest?', 'Which is hardest?'],
      ['📅 This week', "What's due this week?"],
      ['❓ Help', 'Help'],
    ] : [
      ['📅 This week', "What's due this week?"],
      ['⚠️ Missing?', 'Am I missing anything?'],
      ['🌅 Tomorrow', "What's due tomorrow?"],
      ['❓ Help', 'Help'],
    ];
    chips.textContent = '';
    for (const [label, q] of defs) {
      const b = document.createElement('button');
      b.className = 'chip';
      b.dataset.q = q;
      b.textContent = label;
      chips.appendChild(b);
    }
  }

  function setRole(role, announce) {
    const cfg = loadConfig();
    if (cfg.role === role) return;
    cfg.role = role;
    saveConfig(cfg);
    renderChips();
    resetFilters();
    if (client.mode === 'demo') client.loadDemo();
    else if (client.mode === 'google') {
      // role changes what we fetch (teacher: no submissions, teacherId filter)
      doDisconnect();
      addMessage('agent', `Role switched — hit "Connect Google" again so I can re-sync as a ${role}.`);
    }
    renderBoard();
    if (announce && client.mode !== 'google') {
      addMessage('agent', role === 'teacher'
        ? `Teacher mode on. 🍎 I'll organize coursework by course, and every assignment gets a "🧪 Test drive & rate" button — difficulty, time estimate, and (with a Claude key in Settings) a full worked solution, ambiguity check and rubric suggestion. Try "rate everything".`
        : `Student mode on. 🎒 I'll track what's missing and what's due, and every assignment gets a "✨ Break it down" starter plan.`);
    }
  }

  document.getElementById('emptyTeacher').addEventListener('click', () => setRole('teacher', true));

  // ---- settings modal ----------------------------------------------------------------
  function openModal() {
    const cfg = loadConfig();
    clientIdInput.value = cfg.googleClientId || '';
    apiKeyInput.value = cfg.apiKey || '';
    const role = cfg.role === 'teacher' ? 'teacher' : 'student';
    for (const r of document.querySelectorAll('input[name="role"]')) r.checked = r.value === role;
    modalBackdrop.classList.remove('hidden');
    clientIdInput.focus();
  }
  function closeModal() { modalBackdrop.classList.add('hidden'); setupBackdrop.classList.add('hidden'); }

  settingsBtn.addEventListener('click', openModal);
  modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  saveSettings.addEventListener('click', () => {
    const cfg = loadConfig();
    cfg.googleClientId = clientIdInput.value.trim();
    cfg.apiKey = apiKeyInput.value.trim();
    saveConfig(cfg);
    const picked = document.querySelector('input[name="role"]:checked');
    if (picked) setRole(picked.value, true);
    closeModal();
    renderBoard();
    addMessage('agent', cfg.googleClientId
      ? 'Settings saved — say "connect" (or hit the button) and I\'ll open Google sign-in.'
      : 'Saved.');
  });
  disconnectBtn.addEventListener('click', () => { doDisconnect(); closeModal(); addMessage('agent', 'Disconnected — your data is cleared from the page.'); });

  // ---- boot -----------------------------------------------------------------------
  renderChips();
  renderBoard();
  addMessage('agent', loadConfig().role === 'teacher'
    ? 'Hi, I\'m ClassMate! 🍎 Teacher mode: I pull the coursework from all your courses, organize it per class, and help you calibrate it — test-drive any assignment for a difficulty rating, time estimate and (with a Claude key) a full worked solution and rubric.\n\n' +
      '• "Connect Google" links your account (read-only)\n' +
      '• "Try the demo" shows it all with sample coursework\n\n' +
      'Then try "rate everything" or hit 🧪 on any assignment.'
    : 'Hi, I\'m ClassMate! I check your Google Classroom and keep every assignment in one tidy place — what\'s missing, what\'s due today, what\'s coming up.\n\n' +
      '• "Connect Google" links your school account (read-only — I can never change or submit anything)\n' +
      '• "Try the demo" shows how it all works with sample data\n\n' +
      'Once connected, ask me things like "what\'s due tomorrow?" or "am I missing anything?" (Teaching? Switch roles in Settings.)');
})();
