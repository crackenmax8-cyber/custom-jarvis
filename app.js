/*
 * app.js — wires the JARVIS HUD together.
 *  - clock
 *  - renders projects + usage gauges from data.js
 *  - speech recognition (input) + speech synthesis (output)
 *  - reactor audio visualizer on <canvas>
 *  - settings modal (Claude API key, voice toggles)
 */
(function () {
  'use strict';

  const D = window.JarvisData;
  let data = D.loadData();

  // ---- config (API key, voice prefs) — kept separate from dashboard data ----
  const CFG_KEY = 'jarvis.config.v1';
  function loadConfig() {
    try {
      return Object.assign(
        { apiKey: '', model: 'claude-opus-4-8', voiceOut: true, autoListen: false },
        JSON.parse(localStorage.getItem(CFG_KEY) || '{}')
      );
    } catch (e) {
      return { apiKey: '', model: 'claude-opus-4-8', voiceOut: true, autoListen: false };
    }
  }
  function saveConfig(c) { try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) {} }
  let config = loadConfig();

  const brain = new window.JarvisBrain(() => data, () => config);

  const $ = (sel) => document.querySelector(sel);

  // ======================= CLOCK =======================
  function tickClock() {
    const now = new Date();
    $('#clockTime').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    $('#clockDate').textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
  setInterval(tickClock, 1000); tickClock();

  // ======================= STATUS CHIP =======================
  const STATUS_LABELS = { idle: 'Standby', listening: 'Listening', thinking: 'Processing', speaking: 'Responding' };
  function setStatus(state) {
    const chip = $('#statusChip');
    chip.dataset.state = state;
    $('#statusLabel').textContent = STATUS_LABELS[state] || 'Standby';
    const reactor = $('#reactor');
    reactor.classList.toggle('listening', state === 'listening');
    reactor.classList.toggle('thinking', state === 'thinking');
    reactor.classList.toggle('speaking', state === 'speaking');
  }

  // ======================= PROJECTS =======================
  const STATUS_TEXT = { active: 'Active', warning: 'At Risk', paused: 'Paused', complete: 'Complete' };
  function renderProjects() {
    const wrap = $('#projects');
    wrap.innerHTML = '';
    data.projects.forEach(p => {
      // Whitelist status against known keys and coerce numerics — every field is
      // treated as untrusted since data.js documents storage as the editable source.
      const status = STATUS_TEXT[p.status] ? p.status : 'active';
      const fillClass = status === 'warning' ? 'warning' : status === 'complete' ? 'complete' : status === 'paused' ? 'paused' : '';
      const done = Number(p.tasksDone) || 0;
      const total = Number(p.tasksTotal) || 0;
      const progress = Math.max(0, Math.min(100, Number(p.progress) || 0));
      const el = document.createElement('div');
      el.className = 'project';
      el.innerHTML = `
        <div class="project-top">
          <div>
            <div class="project-name">${esc(p.name)}</div>
            <div class="project-domain">${esc(p.domain)}</div>
          </div>
          <span class="pill ${status}"><span class="pdot"></span>${STATUS_TEXT[status]}</span>
        </div>
        <div class="pbar"><div class="pbar-fill ${fillClass}" style="width:0%"></div></div>
        <div class="project-foot">
          <span><b>${done}</b>/${total} tasks</span>
          <span>${progress}% · ${esc(p.updated)}</span>
        </div>`;
      wrap.appendChild(el);
      // animate the bar in
      requestAnimationFrame(() => { el.querySelector('.pbar-fill').style.width = progress + '%'; });
    });
    $('#projActive').textContent = data.projects.filter(p => p.status === 'active').length + ' ACTIVE';
  }

  // ======================= USAGE GAUGES =======================
  const ICON_GOOD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>';
  const ICON_WARN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>';
  const ICON_CRIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>';
  const STATUS_ICON = { good: ICON_GOOD, warning: ICON_WARN, critical: ICON_CRIT };
  const STATUS_WORD = { good: 'Nominal', warning: 'Elevated', critical: 'Critical' };

  function renderGauges() {
    const grid = $('#gauges');
    grid.innerHTML = '';
    const R = 44, C = 2 * Math.PI * R; // radius + circumference for the ring
    data.usage.forEach((u, i) => {
      const pct = Math.min(100, Math.round((u.used / u.limit) * 100));
      const status = D.usageStatus(u.used, u.limit);
      const used = D.formatUsageValue(u.used, u.fmt, u.unit);
      const limit = D.formatUsageValue(u.limit, u.fmt, u.unit);
      const offset = C * (1 - pct / 100);
      const wide = i === data.usage.length - 1 && data.usage.length % 2 === 1; // last item spans full width if odd count

      const g = document.createElement('div');
      g.className = 'gauge' + (wide ? ' span2' : '');
      g.innerHTML = `
        <div class="gauge-ring">
          <svg viewBox="0 0 104 104">
            <circle class="gauge-track" cx="52" cy="52" r="${R}" stroke-width="7"/>
            <circle class="gauge-arc ${status}" cx="52" cy="52" r="${R}" stroke-width="7"
                    stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}"/>
          </svg>
          <div class="gauge-center"><span class="gauge-pct ${status}">${pct}<small style="font-size:11px">%</small></span></div>
        </div>
        <div class="gauge-meta">
          <div class="gauge-label">${esc(u.label)}</div>
          <div class="gauge-vals">${used} / ${limit}</div>
          <div class="gauge-status ${status}">${STATUS_ICON[status]}${STATUS_WORD[status]}</div>
        </div>`;
      grid.appendChild(g);
      // animate the arc filling
      const arc = g.querySelector('.gauge-arc');
      requestAnimationFrame(() => { arc.style.strokeDashoffset = offset.toFixed(1); });
    });

    // overall "system load" summary bars from usage averages
    const avg = Math.round(data.usage.reduce((s, u) => s + (u.used / u.limit) * 100, 0) / data.usage.length);
    $('#loadCore').style.width = avg + '%'; $('#loadCoreVal').textContent = avg + '%';
    const mem = Math.min(100, avg + 6); $('#loadMem').style.width = mem + '%'; $('#loadMemVal').textContent = mem + '%';
    const net = Math.max(8, avg - 18); $('#loadNet').style.width = net + '%'; $('#loadNetVal').textContent = net + '%';
  }

  // ======================= TRANSCRIPT =======================
  function addMessage(who, text) {
    const convo = $('#convo');
    const m = document.createElement('div');
    m.className = 'msg ' + (who === 'you' ? 'user' : 'jarvis');
    m.innerHTML = `<div class="who">${who === 'you' ? 'You' : 'JARVIS'}</div>${esc(text)}`;
    convo.appendChild(m);
    convo.parentElement.scrollTop = convo.parentElement.scrollHeight;
  }

  // ======================= SPEECH SYNTHESIS =======================
  let preferredVoice = null;
  function pickVoice() {
    const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    if (!voices.length) return;
    // Prefer a deep/British male voice for the Jarvis feel, then any en-GB, then any English.
    preferredVoice =
      voices.find(v => /Daniel|Google UK English Male|Arthur|Oliver|George/i.test(v.name)) ||
      voices.find(v => /en-GB/i.test(v.lang)) ||
      voices.find(v => /^en/i.test(v.lang)) ||
      voices[0];
  }
  if (window.speechSynthesis) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  // Returns true if speech was dispatched (so callers know whether the utterance
  // callbacks will drive the status back to idle, or they must do it themselves).
  function speak(text) {
    if (!config.voiceOut || !window.speechSynthesis) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (preferredVoice) u.voice = preferredVoice;
      u.rate = 1.02; u.pitch = 0.9; u.volume = 1;
      u.onstart = () => setStatus('speaking');
      // onend AND onerror both recover status (error/interrupt fire instead of end).
      const done = () => { setStatus(recognizing ? 'listening' : 'idle'); maybeAutoListen(); };
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }

  // ======================= CONVERSATION FLOW =======================
  let handling = false;
  async function handleInput(text) {
    if (!text || handling) return;
    handling = true;
    addMessage('you', text);
    setStatus('thinking');
    let reply;
    try {
      reply = await brain.respond(text);
    } catch (e) {
      reply = { text: `Something went wrong: ${e.message}` };
    }
    addMessage('jarvis', reply.text);
    handling = false;
    const spoke = speak(reply.text);
    // If nothing will be spoken (voice off / no synthesis), we must reset the
    // status ourselves — otherwise the chip stays stuck on "Processing".
    if (!spoke) { setStatus(recognizing ? 'listening' : 'idle'); maybeAutoListen(); }
  }

  // ======================= SPEECH RECOGNITION =======================
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let recognizing = false;
  let manualStop = false;
  let sttFatal = false; // set on a permission-wall error so we don't auto-restart into it

  // Re-arm the mic for hands-free mode — but only once JARVIS is fully idle
  // (not thinking, not speaking), so the open mic never transcribes its own reply.
  function maybeAutoListen() {
    if (!recognition || !config.autoListen || manualStop || sttFatal) return;
    if (handling || recognizing) return;
    if (window.speechSynthesis && speechSynthesis.speaking) return;
    setTimeout(() => {
      if (config.autoListen && !manualStop && !sttFatal && !handling && !recognizing &&
          !(window.speechSynthesis && speechSynthesis.speaking)) {
        startListening();
      }
    }, 500);
  }

  if (SR) {
    recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => { recognizing = true; setStatus('listening'); };
    recognition.onerror = (e) => {
      recognizing = false;
      stopViz(); // release the mic/AudioContext on any recognition failure
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        sttFatal = true; // a permission wall — never auto-restart into it
        toast('Microphone blocked. Allow mic access, or type below.', true);
      } else if (e.error === 'no-speech') {
        toast('No speech detected.');
      }
      if (!handling) setStatus('idle');
    };
    recognition.onend = () => {
      recognizing = false;
      stopViz(); // a listening turn ended — free the mic instead of leaving it lit
      if (!handling && !(window.speechSynthesis && speechSynthesis.speaking)) setStatus('idle');
      // Hands-free re-arm is deferred to maybeAutoListen(): it waits until JARVIS
      // is done thinking/speaking, and it routes through startListening() (which
      // cancels TTS and restarts the visualizer) rather than a raw restart.
      maybeAutoListen();
    };
    recognition.onresult = (event) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
      }
      if (finalText.trim()) handleInput(finalText.trim());
    };
  }

  function startListening() {
    if (!recognition) { toast('Voice input not supported in this browser — type below.', true); $('#textInput').focus(); return; }
    if (recognizing) return;
    manualStop = false;
    sttFatal = false; // explicit user action clears any prior permission-wall latch
    if (window.speechSynthesis) speechSynthesis.cancel();
    startViz(); // begin mic-driven visualizer
    try { recognition.start(); } catch (e) { /* already started */ }
  }
  function stopListening() {
    manualStop = true;
    if (recognition && recognizing) { try { recognition.stop(); } catch (e) {} }
    stopViz();
    setStatus('idle');
  }

  // ======================= REACTOR VISUALIZER (canvas) =======================
  const canvas = $('#viz');
  const ctx = canvas.getContext('2d');
  let audioCtx = null, analyser = null, micStream = null, freqData = null;
  let vizRAF = null, vizPhase = 0, vizToken = 0;
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = canvas.clientWidth || 340;
    canvas.width = size * dpr; canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', sizeCanvas);

  async function startViz() {
    if (analyser) return;
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext))) return;
    const token = ++vizToken;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // If the session was cancelled while getUserMedia was resolving, don't turn
      // the mic on after the fact — tear the stream straight back down.
      if (token !== vizToken) { stream.getTracks().forEach(t => t.stop()); return; }
      micStream = stream;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.createMediaStreamSource(micStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;
      src.connect(analyser);
      freqData = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) {
      analyser = null; // mic denied — idle animation keeps running regardless
    }
  }
  function stopViz() {
    vizToken++; // invalidate any in-flight startViz() so its stream is discarded
    if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
    analyser = null; freqData = null;
  }

  const BARS = 64;
  function drawViz() {
    vizRAF = requestAnimationFrame(drawViz);
    const w = canvas.clientWidth || 340, h = canvas.clientHeight || 340;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const inner = Math.min(w, h) * 0.30;
    // Under prefers-reduced-motion, freeze the idle "breathing" (no perpetual
    // motion). Live mic amplitude during active listening is user-initiated.
    if (!reduceMotion) vizPhase += 0.02;

    const speaking = $('#reactor').classList.contains('speaking');
    const accent = speaking ? '52,230,176' : '69,224,255';

    let live = false;
    if (analyser && freqData) { analyser.getByteFrequencyData(freqData); live = true; }

    for (let i = 0; i < BARS; i++) {
      const angle = (i / BARS) * Math.PI * 2 - Math.PI / 2;
      let amp;
      if (live) {
        const idx = Math.floor((i / BARS) * freqData.length);
        amp = (freqData[idx] / 255);
      } else {
        // gentle idle breathing so the reactor always feels alive
        amp = 0.12 + 0.08 * (Math.sin(vizPhase + i * 0.35) * 0.5 + 0.5);
      }
      const len = inner * 0.12 + amp * inner * 0.85;
      const x1 = cx + Math.cos(angle) * inner;
      const y1 = cy + Math.sin(angle) * inner;
      const x2 = cx + Math.cos(angle) * (inner + len);
      const y2 = cy + Math.sin(angle) * (inner + len);
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(${accent},${0.35 + amp * 0.55})`;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  // ======================= SETTINGS MODAL =======================
  let lastFocused = null;
  function openSettings() {
    lastFocused = document.activeElement;
    $('#apiKeyInput').value = config.apiKey || '';
    $('#modelInput').value = config.model || 'claude-opus-4-8';
    $('#voiceOutToggle').checked = !!config.voiceOut;
    $('#autoListenToggle').checked = !!config.autoListen;
    $('#settingsModal').classList.add('open');
    // move focus into the dialog for keyboard/screen-reader users
    setTimeout(() => { try { $('#apiKeyInput').focus(); } catch (e) {} }, 30);
  }
  function closeSettings() {
    $('#settingsModal').classList.remove('open');
    if (lastFocused && lastFocused.focus) { try { lastFocused.focus(); } catch (e) {} }
  }
  // Trap Tab within the open modal so focus can't wander to the HUD behind it.
  $('#settingsModal').addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const modal = document.querySelector('#settingsModal .modal');
    const focusables = Array.from(modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.disabled && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  function saveSettings() {
    config.apiKey = $('#apiKeyInput').value.trim();
    config.model = $('#modelInput').value.trim() || 'claude-opus-4-8';
    config.voiceOut = $('#voiceOutToggle').checked;
    config.autoListen = $('#autoListenToggle').checked;
    saveConfig(config);
    closeSettings();
    toast(config.apiKey ? 'Claude link established.' : 'Settings saved.');
  }

  // ======================= TOAST =======================
  let toastTimer = null;
  function toast(msg, isErr) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.toggle('err', !!isErr);
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }

  // ======================= UTIL =======================
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ======================= EVENT WIRING =======================
  $('#reactor').addEventListener('click', () => { recognizing ? stopListening() : startListening(); });
  $('#micBtn').addEventListener('click', (e) => { e.stopPropagation(); recognizing ? stopListening() : startListening(); });

  $('#sendBtn').addEventListener('click', submitText);
  $('#textInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitText(); });
  function submitText() {
    const el = $('#textInput');
    const v = el.value.trim();
    if (!v) return;
    // Don't wipe the box if we can't accept the message yet — keep it so the
    // user isn't left wondering where their text went.
    if (handling) { toast('One moment — still processing your last request…'); return; }
    el.value = '';
    handleInput(v);
  }

  $('#settingsBtn').addEventListener('click', openSettings);
  $('#closeSettings').addEventListener('click', closeSettings);
  $('#cancelSettings').addEventListener('click', closeSettings);
  $('#saveSettings').addEventListener('click', saveSettings);
  $('#settingsModal').addEventListener('click', (e) => { if (e.target.id === 'settingsModal') closeSettings(); });

  // Space bar = push-to-talk — but never when a control (button/link/input) is
  // focused, so Space keeps activating buttons and typing spaces as usual.
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      const ae = document.activeElement;
      const onControl = ae && ae.closest && ae.closest('button, a, input, textarea, select, [role="button"], [contenteditable="true"]');
      const modalOpen = $('#settingsModal').classList.contains('open');
      if (!onControl && !modalOpen) {
        e.preventDefault();
        recognizing ? stopListening() : startListening();
      }
    }
    if (e.key === 'Escape') closeSettings();
  });

  // ======================= BOOT =======================
  function boot() {
    sizeCanvas();
    renderProjects();
    renderGauges();
    drawViz(); // idle animation runs from the start

    const greeting = `Systems online. Welcome back, ${data.operator}. ${data.projects.filter(p => p.status === 'active').length} active projects on the board.`;
    setTimeout(() => { addMessage('jarvis', greeting); speak(greeting); }, 700);

    if (!SR) $('#reactorHint').textContent = 'VOICE INPUT UNAVAILABLE — TYPE BELOW';
  }
  boot();
})();
