/*
 * app.js — UI wiring for SELECTA: chat rendering, composer, quick-prompt chips,
 * settings modal (optional Claude API key), and the spinning-deck header.
 */

(() => {
  const CONFIG_KEY = 'selecta.config.v1';

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
  const settingsBtn = document.getElementById('settingsBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const apiKeyInput = document.getElementById('apiKey');
  const saveKeyBtn = document.getElementById('saveKey');
  const clearKeyBtn = document.getElementById('clearKey');
  const bpmReadout = document.getElementById('bpmReadout');

  // ---- chat rendering ------------------------------------------------------------
  function addMessage(role, text) {
    const row = document.createElement('div');
    row.className = `msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    if (role === 'agent') {
      const tag = document.createElement('div');
      tag.className = 'msg-tag';
      tag.textContent = 'SELECTA';
      row.appendChild(tag);
    }
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
    'Yes yes — SELECTA on the decks. I\'m your house music DJ agent: three decades of crate ' +
    'knowledge, from the Warehouse to the White Isle.\n\n' +
    'Ask me about any subgenre, the legends, mixing technique, harmonic keys, gear or history — ' +
    'or hit "Build me a set" and I\'ll route a harmonically-mixed journey from the crate. ' +
    'Say "help" for the full menu.');
})();
