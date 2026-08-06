/* ============================================================================
   PepTalk — app.  View router, My Protocol dashboard, stack planner,
   countermeasures, printable sheets, chat, theme.
   ========================================================================== */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = { api: "peptalk.apiKey", model: "peptalk.model", theme: "peptalk.theme", stack: "peptalk.stack", protocol: "peptalk.protocol.v1" };

  function loadProtocol() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY.protocol) || "null");
      if (p && Array.isArray(p.items) && p.items.length) return p;
    } catch (e) { /* corrupt — ignore */ }
    return null;
  }

  const state = {
    view: "home",
    compound: null,
    stack: new Set(JSON.parse(localStorage.getItem(KEY.stack) || "[]")),
    chat: [],
    protocol: loadProtocol(),
    protocolEditing: false,
    draft: null,
  };

  const fmtDate = (iso) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return "—";
    return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString(undefined, {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  };

  /* ---- tiny markdown (bold, bullets, newlines) for bot messages -------- */
  function mdEscape(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function mdInline(s) {
    return mdEscape(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function mdBlock(s) {
    return s
      .split("\n")
      .map((ln) => mdInline(ln))
      .join("<br>");
  }

  const sevPill = (sev) => `<span class="sev-pill ${sev}">${sev} risk</span>`;

  /* ======================= LIBRARY (sidebar) ============================= */
  function renderLibrary(filter = "") {
    const list = $("#libList");
    const f = filter.toLowerCase().trim();
    const match = (c) =>
      !f ||
      [c.name, c.aka, c.klass, c.group].join(" ").toLowerCase().includes(f);
    let html = "";
    let shown = 0;
    PT.groups.forEach((g) => {
      const items = PT.compounds.filter((c) => c.group === g && match(c));
      if (!items.length) return;
      html += `<div class="lib-group-label">${g}</div>`;
      items.forEach((c) => {
        shown++;
        html += `<button class="lib-item ${state.compound === c.id && state.view === "compound" ? "active" : ""}" data-id="${c.id}" role="listitem">
          <span>
            <span class="li-name">${c.name}</span><br>
            <span class="li-aka">${c.aka}</span>
          </span>
          <span class="sev-dot ${c.severity}" title="${c.severity} risk"></span>
        </button>`;
      });
    });
    list.innerHTML = html || `<p style="padding:14px 6px;color:var(--text-faint);font-size:.82rem">No compounds match “${mdEscape(filter)}”.</p>`;
    $("#libCount").textContent = `${shown}/${PT.compounds.length}`;
    $$(".lib-item", list).forEach((b) =>
      b.addEventListener("click", () => openCompound(b.dataset.id))
    );
  }

  /* ======================= VIEW ROUTER ================================== */
  function setView(v) {
    state.view = v;
    $$(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.view === v));
    const c = $("#content");
    if (v === "home") renderHome(c);
    else if (v === "protocol") renderProtocol(c);
    else if (v === "today") renderToday(c);
    else if (v === "log") renderLog(c);
    else if (v === "trends") renderTrends(c);
    else if (v === "sites") renderSites(c);
    else if (v === "data") renderData(c);
    else if (v === "stack") renderStack(c);
    else if (v === "supplements") renderSupplements(c);
    else if (v === "labs") renderLabs(c);
    else if (v === "chat") renderChat(c);
    else if (v === "counters") renderCounters(c);
    else if (v === "emergency") renderEmergency(c);
    else if (v === "injection") renderInjection(c);
    else if (v === "pct") renderPct(c);
    else if (v === "women") renderWomen(c);
    else if (v === "compound") renderCompound(c);
    c.scrollTop = 0;
    // move focus to the new heading so screen readers announce the view change
    const h = c.querySelector("h2");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    else c.focus({ preventScroll: true });
  }

  function openCompound(id) {
    state.compound = id;
    setView("compound");
    renderLibrary($("#libSearch").value);
  }

  /* ======================= HOME ========================================= */
  function renderHome(c) {
    const chips = [
      "What vitamins should I take on trenbolone?",
      "What bloodwork do I need before a cycle?",
      "How do I protect my liver on orals?",
      "Tell me about semaglutide",
      "What raises hematocrit?",
    ];
    c.innerHTML = `
      <h2>Use safer, or don't use.</h2>
      <p class="hero-sub">PepTalk gathers what people report doing to reduce the harm of anabolic steroids and peptides — the supportive supplements, the nutrients you can run low on, and the bloodwork that turns invisible damage into something you can actually manage. It is <strong>not medical advice</strong>, and the safest cycle is the one you don't run.</p>

      ${homeProtocolCard()}

      <h3>Ask anything</h3>
      <div class="chips">${chips.map((q) => `<button class="chip" data-q="${q.replace(/"/g, "&quot;")}">${q}</button>`).join("")}</div>

      <h3>Three things that matter more than any pill</h3>
      <div class="principle-grid">
        ${PT.principles.slice(0, 3).map(hero => `
          <div class="principle"><div class="p-ic">${hero.icon}</div><h4>${hero.title}</h4><p>${hero.body}</p></div>`).join("")}
      </div>

      <h3>All harm-reduction principles</h3>
      <div class="principle-grid">
        ${PT.principles.slice(3).map(p => `
          <div class="principle"><div class="p-ic">${p.icon}</div><h4>${p.title}</h4><p>${p.body}</p></div>`).join("")}
      </div>

      <h3>Get started</h3>
      <div class="start-grid">
        ${state.protocol ? "" : `<button class="start-card feature" data-go="protocol">
          <span class="sc-ic">📋</span><b>Build my protocol</b>
          <span>Save what you're running with dates — get your personal timeline, labs and watch-list.</span>
        </button>`}
        <button class="start-card alarm" data-go="emergency">
          <span class="sc-ic">🚨</span><b>Emergency signs</b>
          <span>The symptoms that mean stop and get help now. Read this one before you need it.</span>
        </button>
        <button class="start-card" data-go="counters">
          <span class="sc-ic">🛡️</span><b>Side effects &amp; counters</b>
          <span>Something's going wrong — here's what actually counters it, free, OTC or prescription.</span>
        </button>
        <button class="start-card" data-go="stack">
          <span class="sc-ic">🧬</span><b>Stack planner</b>
          <span>Tick what you're running for one consolidated supplement &amp; bloodwork plan.</span>
        </button>
        <button class="start-card" data-go="labs">
          <span class="sc-ic">🩸</span><b>Bloodwork</b>
          <span>What to test and when — and a request sheet you can print for a doctor.</span>
        </button>
        <button class="start-card" data-go="injection">
          <span class="sc-ic">💉</span><b>Injection safety</b>
          <span>Sterile technique, sites and volumes — where most avoidable harm actually happens.</span>
        </button>
        <button class="start-card" data-go="pct">
          <span class="sc-ic">🔁</span><b>Coming off &amp; PCT</b>
          <span>Suppression, recovery, fertility, and the decision to make before you start.</span>
        </button>
        <button class="start-card" data-go="women">
          <span class="sc-ic">♀</span><b>Women &amp; virilization</b>
          <span>A different risk profile — and which effects don't reverse.</span>
        </button>
      </div>
      <p style="font-size:.86rem;margin-top:14px">Or pick any compound from the <strong>Library</strong> on the left for its full profile.</p>
    `;
    wireChips(c);
    wireGo(c);
  }

  /* ======================= COMPOUND DETAIL ============================== */
  function renderCompound(c) {
    const d = PT.byId[state.compound];
    if (!d) return renderHome(c);
    const inStack = state.stack.has(d.id);
    c.innerHTML = `
      <div class="detail-head">
        <div class="dh-main">
          <h2>${d.name}</h2>
          <p class="aka">${d.aka}</p>
          <div class="meta-row">
            ${sevPill(d.severity)}
            <span class="tag">${d.klass}</span>
            <span class="tag">${d.group}</span>
            <span class="tag">Route: ${d.route}</span>
          </div>
        </div>
        <button class="btn-solid" id="stackToggle">${inStack ? "✓ In your stack" : "+ Add to stack"}</button>
      </div>

      <p class="summary">${d.summary}</p>

      <h3>Main risks</h3>
      <ul class="risk-list">${d.risks.map((r) => `<li>${r}</li>`).join("")}</ul>

      <h3>What to take — supportive supplements</h3>
      <div class="depletes-note"><b>Why:</b> ${d.depletes}</div>
      <div class="support-grid">
        ${d.support.map((s) => {
          const S = PT.supplements[s.id];
          return `<div class="support-card">
            <div class="sc-name">${S.name}</div>
            <div class="sc-note">${s.note}</div>
            <span class="sc-dose">${S.dose}</span>
          </div>`;
        }).join("")}
      </div>

      ${(PT.countersByCompound[d.id] || []).length ? `
      <h3>If a side effect actually shows up — what counters it</h3>
      <p style="font-size:.83rem;color:var(--text-dim);margin:0 0 10px">
        Specific to ${d.name}. Each opens the full breakdown of free fixes, over-the-counter options and
        prescription treatments.
      </p>
      <div class="ctr-mini-grid">
        ${PT.countersByCompound[d.id].map((kid) => {
          const k = PT.counterById[kid];
          return `<button class="ctr-mini" data-counter="${kid}">
            <span class="cm-ic">${k.icon}</span>
            <span class="cm-name">${k.name}</span>
            <span class="cm-first">${k.first[0]}</span>
          </button>`;
        }).join("")}
      </div>` : ""}

      <h3>Bloodwork to monitor</h3>
      <div class="lab-list">
        ${d.labs.map((id) => {
          const L = PT.labs[id];
          return `<div class="lab-row">
            <div class="lab-name">${L.name}</div>
            <div class="lab-body">
              <span class="lab-markers">${L.markers}</span>
              <p class="lab-why">${L.why}</p>
              <div class="lab-when">When: ${L.when}</div>
            </div>
          </div>`;
        }).join("")}
      </div>

      <h3>Key warnings</h3>
      <ul class="warn-list">${d.warnings.map((w) => `<li>${w}</li>`).join("")}</ul>

      <p style="font-size:.8rem;color:var(--text-faint);margin-top:20px">
        Doses shown are commonly-reported ranges, not prescriptions. Everything here is educational harm-reduction information — confirm with bloodwork and a doctor.
      </p>
    `;
    $("#stackToggle").addEventListener("click", () => {
      toggleStack(d.id);
      renderCompound(c);
    });
    $$("[data-counter]", c).forEach((b) =>
      b.addEventListener("click", () => {
        setView("counters");
        const el = $("#ctr-" + b.dataset.counter);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      })
    );
  }

  /* ======================= STACK PLANNER =============================== */
  function renderStack(c) {
    const picks = PT.compounds
      .map(
        (co) => `<label class="pick ${state.stack.has(co.id) ? "on" : ""}">
          <input type="checkbox" data-id="${co.id}" ${state.stack.has(co.id) ? "checked" : ""}/>
          <span class="pk-name">${co.name}</span>
        </label>`
      )
      .join("");
    const plan = Brain.buildPlan([...state.stack]);
    c.innerHTML = `
      <h2>Stack planner</h2>
      <p class="hero-sub">Select what you're running and PepTalk merges it into one consolidated plan — every supportive supplement, the full bloodwork list, and the warnings that matter when compounds combine.</p>
      <div class="stack-pick">${picks}</div>
      ${state.stack.size ? `<div class="stack-actions">
        <button class="btn-solid" id="saveAsProto">📋 Save as my protocol</button>
        <button class="btn-ghost" id="clearStack">Clear all</button>
      </div>` : ""}
      <div id="planOut">${plan ? renderPlan(plan) : `<div class="plan-empty">Select one or more compounds above to build your support &amp; bloodwork plan.</div>`}</div>
    `;
    $$(".pick input", c).forEach((cb) =>
      cb.addEventListener("change", () => {
        toggleStack(cb.dataset.id);
        renderStack(c);
      })
    );
    $$("[data-counter]", c).forEach((b) =>
      b.addEventListener("click", () => {
        setView("counters");
        const el = $("#ctr-" + b.dataset.counter);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      })
    );
    const cl = $("#clearStack");
    if (cl) cl.addEventListener("click", () => {
      state.stack.clear();
      persistStack();
      renderStack(c);
      renderLibrary($("#libSearch").value);
    });
    const sp = $("#saveAsProto");
    if (sp) sp.addEventListener("click", () => openProtocolSetup([...state.stack]));
  }

  function renderPlan(plan) {
    const flags = plan.flags
      .map((f) => `<div class="flag ${f.level}"><span class="flag-ic">${f.level === "severe" ? "⛔" : "⚠️"}</span><span>${f.text}</span></div>`)
      .join("");
    const supp = plan.supplements
      .map((s) => {
        const S = PT.supplements[s.id];
        const tags = s.forCompounds.map((fc) => `<span class="for-tag">${fc.compound}</span>`).join("");
        return `<div class="support-card">
          <div class="sc-name">${S.name}</div>
          <div class="sc-note">${S.why}</div>
          <span class="sc-dose">${S.dose}</span>
          <div class="for-tags">${tags}</div>
        </div>`;
      })
      .join("");
    const labs = plan.labs
      .map((l) => {
        const L = PT.labs[l.id];
        return `<div class="lab-row">
          <div class="lab-name">${L.name}</div>
          <div class="lab-body">
            <span class="lab-markers">${L.markers}</span>
            <p class="lab-why">${L.why}</p>
            <div class="for-tags">${l.forCompounds.map((n) => `<span class="for-tag">${n}</span>`).join("")}</div>
          </div>
        </div>`;
      })
      .join("");
    const warns = plan.warnings
      .map((w) => `<li><strong>${w.compound}:</strong> ${w.text}</li>`)
      .join("");
    return `
      <h3>Selected — ${plan.chosen.length} compound${plan.chosen.length > 1 ? "s" : ""}</h3>
      <div class="meta-row">${plan.chosen.map((c) => `<span class="tag">${c.name} ${sevPillMini(c.severity)}</span>`).join("")}</div>
      ${flags ? `<h3>Read this first</h3>${flags}` : ""}
      <h3>Your consolidated support stack</h3>
      <div class="support-grid">${supp}</div>
      ${plan.counters.length ? `
      <h3>Side effects this stack can bring — and what counters each</h3>
      <div class="ctr-mini-grid">
        ${plan.counters.map((x) => {
          const k = PT.counterById[x.id];
          return `<button class="ctr-mini" data-counter="${x.id}">
            <span class="cm-ic">${k.icon}</span>
            <span class="cm-name">${k.name}</span>
            <span class="cm-first">${k.first[0]}</span>
            <span class="for-tags">${x.forCompounds.map((n) => `<span class="for-tag">${n}</span>`).join("")}</span>
          </button>`;
        }).join("")}
      </div>` : ""}

      <h3>Bloodwork checklist</h3>
      <div class="lab-list">${labs}</div>
      <h3>All warnings</h3>
      <ul class="warn-list">${warns}</ul>
      <p style="font-size:.8rem;color:var(--text-faint);margin-top:18px">
        A consolidated list isn't a green light — the more you stack, the more risk compounds. Doses are commonly-reported ranges, not prescriptions. Get bloodwork and a doctor.
      </p>
    `;
  }
  const sevPillMini = (sev) =>
    `<span style="color:var(--sev-${sev});font-weight:700;font-size:.68rem">•${sev}</span>`;

  /* ======================= MY PROTOCOL ================================= */
  const PHASE = {
    before:   { label: "Not started yet", tone: "soon" },
    on:       { label: "On cycle",        tone: "warn" },
    clearing: { label: "Esters clearing", tone: "warn" },
    pct:      { label: "PCT / recovery",  tone: "warn" },
    done:     { label: "Recovery complete", tone: "good" },
  };

  function protocolIds() {
    return (state.protocol ? state.protocol.items.map((i) => i.id) : []);
  }

  // Compact card shown on the Overview when a protocol exists
  function homeProtocolCard() {
    if (!state.protocol) return "";
    const tl = Brain.protocol.timeline(state.protocol, new Date());
    const names = state.protocol.items.map((i) => PT.byId[i.id] && PT.byId[i.id].name).filter(Boolean).join(" · ");
    let status;
    if (tl.planning) status = "Add a start date to see your timeline";
    else if (tl.phase === "on") status = `Week ${tl.weekNum} of ${tl.weeks}`;
    else if (tl.phase === "before") status = `Starts in ${tl.daysToStart} day${tl.daysToStart === 1 ? "" : "s"}`;
    else status = PHASE[tl.phase].label;
    const nextLine = !tl.planning && tl.next
      ? `Next: <b>${tl.next.label}</b> ${tl.next.inDays <= 0 ? "now" : `in ${tl.next.inDays} day${tl.next.inDays === 1 ? "" : "s"}`}`
      : "";
    return `
      <button class="proto-summary" data-go="protocol">
        <div class="ps-top"><span class="ps-eyebrow">Your protocol</span><span class="ps-status">${status}</span></div>
        <div class="ps-names">${names}</div>
        ${nextLine ? `<div class="ps-next">${nextLine}</div>` : ""}
        <span class="ps-cta">Open dashboard →</span>
      </button>`;
  }

  function renderProtocol(c) {
    if (state.protocol && !state.protocolEditing) renderProtocolDash(c);
    else renderProtocolSetup(c);
  }

  /* ---- Dashboard ---- */
  function renderProtocolDash(c) {
    const p = state.protocol;
    const tl = Brain.protocol.timeline(p, new Date());
    const plan = Brain.buildPlan(protocolIds());
    const names = p.items.map((it) => {
      const co = PT.byId[it.id];
      return `<span class="tag">${co.name}${it.dose ? ` · ${mdEscape(it.dose)}` : ""}</span>`;
    }).join("");

    // status header
    let big, sub, tone;
    if (tl.planning) {
      big = "Ready when you are"; tone = "soon";
      sub = "Add a start date and length to unlock your timeline, bloodwork schedule and PCT window.";
    } else {
      tone = PHASE[tl.phase].tone;
      if (tl.phase === "on") { big = `Week ${tl.weekNum} <span class="pd-of">of ${tl.weeks}</span>`; sub = "On cycle. Keep monitoring — the damage you can't feel is on your bloodwork."; }
      else if (tl.phase === "before") { big = `Starts in ${tl.daysToStart} day${tl.daysToStart === 1 ? "" : "s"}`; sub = "Get your baseline bloodwork done before the first dose — it's the reference for everything after."; }
      else if (tl.phase === "clearing") { big = "Esters clearing"; sub = `Cycle finished. Hold PCT until your longest ester clears${tl.clearedBy ? ` (${tl.clearedBy})` : ""} — starting too early wastes it.`; }
      else if (tl.phase === "pct") { big = "PCT / recovery window"; sub = "The highest-risk stretch for mood. Confirm recovery with bloods, not by feel — and get support if it gets dark."; }
      else { big = "Recovery complete"; sub = "Re-check hormones to confirm you're actually back to baseline before considering anything else."; }
    }
    const progPct = tl.planning ? 0 : Math.round(tl.progress * 100);

    // timeline
    const milestones = tl.planning ? "" : tl.milestones.map((m) => {
      const isNext = tl.next && tl.next.key === m.key;
      const cls = m.done ? "done" : isNext ? "next" : "todo";
      return `<li class="ms ${cls}">
        <span class="ms-dot" aria-hidden="true">${m.done ? "✓" : ""}</span>
        <div class="ms-body">
          <div class="ms-head"><span class="ms-label">${m.label}</span><span class="ms-date">${fmtDate(m.iso)}</span></div>
          <p class="ms-note">${m.note}</p>
          ${isNext ? `<span class="ms-badge">Next up${m.inDays > 0 ? ` — in ${m.inDays} days` : ""}</span>` : ""}
        </div>
      </li>`;
    }).join("");

    const supp = plan.supplements.map((s) => {
      const S = PT.supplements[s.id];
      return `<div class="support-card"><div class="sc-name">${S.name}</div><div class="sc-note">${S.why}</div><span class="sc-dose">${S.dose}</span></div>`;
    }).join("");
    const counters = plan.counters.length ? plan.counters.map((x) => {
      const k = PT.counterById[x.id];
      return `<button class="ctr-mini" data-counter="${x.id}"><span class="cm-ic">${k.icon}</span><span class="cm-name">${k.name}</span><span class="cm-first">${k.first[0]}</span></button>`;
    }).join("") : "";
    const flags = plan.flags.map((f) => `<div class="flag ${f.level}"><span class="flag-ic">${f.level === "severe" ? "⛔" : "⚠️"}</span><span>${f.text}</span></div>`).join("");

    c.innerHTML = `
      <div class="detail-head">
        <div class="dh-main"><h2>My protocol</h2><p class="aka">Saved on this device only — nothing leaves your browser.</p></div>
        <div class="pd-actions">
          <button class="btn-ghost" id="protoEdit">Edit</button>
          <button class="btn-ghost" id="protoClear">Clear</button>
        </div>
      </div>

      <div class="pd-status ${tone}">
        <div class="pd-big">${big}</div>
        <p class="pd-sub">${sub}</p>
        ${tl.planning ? "" : `<div class="pd-bar"><i style="width:${progPct}%"></i></div>`}
        <div class="meta-row" style="margin-top:12px">${names}</div>
      </div>

      ${flags ? `<h3>Flags for this stack</h3>${flags}` : ""}

      ${tl.planning ? `<div class="depletes-note">Set a start date to see your baseline, mid-cycle, last-dose${tl.hasPCT ? " and PCT" : ""} milestones with real dates. <button class="link-btn" id="protoAddDate">Add dates →</button></div>`
        : `<div class="pd-2col">
            <div>
              <h3>Your timeline</h3>
              <ul class="ms-list">${milestones}</ul>
            </div>
          </div>`}

      <div class="print-row">
        <button class="btn-solid" id="printProto">🖨️ Print my protocol</button>
        <span class="print-note">A one-page summary — compounds, dates, support and the labs to run — to hand a doctor.</span>
      </div>

      <h3>Your support stack</h3>
      <div class="support-grid">${supp}</div>

      ${counters ? `<h3>Watch for — and what counters each</h3><div class="ctr-mini-grid">${counters}</div>` : ""}

      <h3>Your bloodwork</h3>
      <div class="lab-list">
        ${plan.labs.map((l) => { const L = PT.labs[l.id]; return `<div class="lab-row"><div class="lab-name">${L.name}</div><div class="lab-body"><span class="lab-markers">${L.markers}</span><p class="lab-why">${L.why}</p></div></div>`; }).join("")}
      </div>

      ${p.sex === "f" ? `<div class="ctr-red" style="margin-top:16px">♀ You've set this protocol as female. Virilization is the priority risk and some of it is permanent — the first sign (especially any voice change) means stop that day. <button class="link-btn" data-go="women">Open Women &amp; virilization →</button></div>` : ""}

      <p style="font-size:.8rem;color:var(--text-faint);margin-top:18px">
        Dates are estimates from typical ester clearance, not a medical schedule. Doses you enter are your own notes.
        Confirm everything with bloodwork and a doctor.
      </p>`;

    $("#protoEdit").addEventListener("click", () => openProtocolSetup());
    $("#protoClear").addEventListener("click", () => {
      if (!confirm("Clear your saved protocol? This can't be undone.")) return;
      state.protocol = null;
      localStorage.removeItem(KEY.protocol);
      toast("Protocol cleared.");
      setView("protocol");
    });
    $("#printProto").addEventListener("click", printProtocolSheet);
    const addDate = $("#protoAddDate");
    if (addDate) addDate.addEventListener("click", () => openProtocolSetup());
    wireGo(c);
    $$("[data-counter]", c).forEach((b) => b.addEventListener("click", () => {
      setView("counters");
      const el = $("#ctr-" + b.dataset.counter);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  }

  /* ---- Setup ---- */
  function openProtocolSetup(seedIds) {
    state.protocolEditing = true;
    const base = state.protocol || {};
    state.draft = { items: {}, start: base.start || "", weeks: base.weeks || 12, sex: base.sex || "m" };
    const ids = seedIds || (base.items || []).map((i) => i.id);
    ids.forEach((id) => {
      if (!PT.byId[id]) return;
      const existing = (base.items || []).find((x) => x.id === id) || {};
      state.draft.items[id] = { dose: existing.dose || "", ester: existing.ester || Brain.protocol.defaultEster(PT.byId[id]) };
    });
    setView("protocol");
  }

  function protocolDraftItems() {
    const ids = Object.keys(state.draft.items);
    if (!ids.length) return `<p class="plan-empty">Tick what you're running above, then add doses and esters here.</p>`;
    return ids.map((id) => {
      const co = PT.byId[id];
      const it = state.draft.items[id];
      const supp = Brain.protocol.isSuppressive(co);
      return `<div class="draft-row">
        <div class="dr-name">${co.name}<span class="dr-sub">${co.aka}</span></div>
        <input class="dr-dose" data-dose="${id}" value="${(it.dose || "").replace(/"/g, "&quot;")}" placeholder="dose (optional), e.g. 250 mg/wk" aria-label="Dose for ${co.name}" />
        ${supp
          ? `<select class="dr-ester" data-ester="${id}" aria-label="Ester for ${co.name}">
               ${Brain.protocol.ESTERS.map((e) => `<option value="${e.id}" ${it.ester === e.id ? "selected" : ""}>${e.label}</option>`).join("")}
             </select>`
          : `<span class="dr-noester">peptide — no PCT</span>`}
      </div>`;
    }).join("");
  }

  function renderProtocolSetup(c) {
    const d = state.draft || (state.draft = { items: {}, start: "", weeks: 12, sex: "m" });
    const picker = PT.groups.map((g) => {
      const items = PT.compounds.filter((co) => co.group === g);
      return `<div class="lib-group-label">${g}</div>
        <div class="stack-pick">
          ${items.map((co) => `<label class="pick ${d.items[co.id] ? "on" : ""}">
            <input type="checkbox" data-pick="${co.id}" ${d.items[co.id] ? "checked" : ""}/>
            <span class="pk-name">${co.name}</span>
          </label>`).join("")}
        </div>`;
    }).join("");

    c.innerHTML = `
      <h2>${state.protocol ? "Edit your protocol" : "Build your protocol"}</h2>
      <p class="hero-sub">Save what you're actually running — with a start date — and PepTalk builds your personal timeline, the bloodwork schedule, an ester-aware PCT window, and a watch-list of what to counter. It's stored only in this browser.</p>

      <h3>Who's this for</h3>
      <div class="seg" role="group" aria-label="Sex for dosing and virilization guidance">
        <button class="seg-btn ${d.sex === "m" ? "on" : ""}" data-sex="m">Male</button>
        <button class="seg-btn ${d.sex === "f" ? "on" : ""}" data-sex="f">Female</button>
      </div>
      <p class="seg-note">Female adds virilization guidance and flags that the compound risk ratings are written from a male-dosing perspective.</p>

      <h3>What are you running</h3>
      ${picker}

      <h3>Doses &amp; esters</h3>
      <p class="seg-note">Ester sets how long a compound lingers — it's what your PCT timing is calculated from. Dose is just your own note.</p>
      <div class="draft-list" id="draftItems">${protocolDraftItems()}</div>

      <h3>Dates</h3>
      <div class="date-row">
        <label class="date-field">Cycle start
          <input type="date" id="protoStart" value="${d.start || ""}" />
        </label>
        <label class="date-field">Length (weeks)
          <input type="number" id="protoWeeks" min="1" max="52" value="${d.weeks || ""}" placeholder="12" />
        </label>
      </div>
      <p class="seg-note">Leave dates blank to save now and add them later — you'll still get your support stack and labs.</p>

      <div class="setup-actions">
        <button class="btn-solid" id="protoSave">${state.protocol ? "Save changes" : "Save protocol"}</button>
        <button class="btn-ghost" id="protoCancel">Cancel</button>
      </div>`;

    const rerenderItems = () => { $("#draftItems").innerHTML = protocolDraftItems(); bindDraftItemInputs(); };
    function bindDraftItemInputs() {
      $$("[data-dose]", c).forEach((i) => i.addEventListener("input", () => {
        if (state.draft.items[i.dataset.dose]) state.draft.items[i.dataset.dose].dose = i.value;
      }));
      $$("[data-ester]", c).forEach((s) => s.addEventListener("change", () => {
        if (state.draft.items[s.dataset.ester]) state.draft.items[s.dataset.ester].ester = s.value;
      }));
    }

    $$("[data-pick]", c).forEach((cb) => cb.addEventListener("change", () => {
      const id = cb.dataset.pick;
      if (cb.checked) state.draft.items[id] = { dose: "", ester: Brain.protocol.defaultEster(PT.byId[id]) };
      else delete state.draft.items[id];
      cb.closest(".pick").classList.toggle("on", cb.checked);
      rerenderItems();
    }));
    bindDraftItemInputs();
    $$("[data-sex]", c).forEach((b) => b.addEventListener("click", () => {
      state.draft.sex = b.dataset.sex;
      $$("[data-sex]", c).forEach((x) => x.classList.toggle("on", x === b));
    }));
    $("#protoStart").addEventListener("change", (e) => { state.draft.start = e.target.value; });
    $("#protoWeeks").addEventListener("input", (e) => { state.draft.weeks = e.target.value; });
    $("#protoCancel").addEventListener("click", () => {
      state.protocolEditing = false; state.draft = null;
      setView(state.protocol ? "protocol" : "home");
    });
    $("#protoSave").addEventListener("click", () => {
      const ids = Object.keys(state.draft.items);
      if (!ids.length) { toast("Pick at least one compound first."); return; }
      state.protocol = {
        items: ids.map((id) => {
          const it = state.draft.items[id];
          const o = { id };
          if (it.dose) o.dose = it.dose;
          if (it.ester) o.ester = it.ester;
          return o;
        }),
        start: state.draft.start || null,
        weeks: state.draft.weeks ? Math.max(1, Math.min(52, Math.round(+state.draft.weeks))) : null,
        sex: state.draft.sex,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(KEY.protocol, JSON.stringify(state.protocol));
      state.protocolEditing = false; state.draft = null;
      toast("Protocol saved.");
      setView("protocol");
    });
  }

  function printProtocolSheet() {
    const p = state.protocol;
    const tl = Brain.protocol.timeline(p, new Date());
    const plan = Brain.buildPlan(protocolIds());
    const compRows = p.items.map((it) => {
      const co = PT.byId[it.id];
      return `<tr><td><b>${co.name}</b> <span class="mk">${co.aka}</span></td><td>${it.dose ? mdEscape(it.dose) : "—"}</td><td>${it.ester ? (Brain.protocol.ESTERS.find((e) => e.id === it.ester) || {}).label || it.ester : "—"}</td></tr>`;
    }).join("");
    const dateRows = tl.planning ? "" : tl.milestones.map((m) => `<tr><td class="chk">☐</td><td><b>${m.label}</b></td><td class="wh">${fmtDate(m.iso)}</td></tr>`).join("");
    const labRows = plan.labs.map((l) => { const L = PT.labs[l.id]; return `<tr><td class="chk">☐</td><td><b>${L.name}</b><div class="mk">${L.markers}</div></td></tr>`; }).join("");
    const suppList = plan.supplements.map((s) => PT.supplements[s.id].name).join(" · ");

    let sheet = $("#printSheet");
    if (!sheet) { sheet = document.createElement("div"); sheet.id = "printSheet"; document.body.appendChild(sheet); }
    sheet.innerHTML = `
      <h1>My protocol</h1>
      <p class="sub">Prepared with PepTalk — educational harm-reduction information, not a prescription or a doctor's order. Please discuss it with a clinician, and be straightforward about what you're taking.</p>
      <h2>Compounds</h2>
      <table><thead><tr><th>Compound</th><th>Dose (self-reported)</th><th>Ester</th></tr></thead><tbody>${compRows}</tbody></table>
      ${dateRows ? `<h2>Timeline</h2><table><tbody>${dateRows}</tbody></table>` : ""}
      <h2>Bloodwork to run</h2><table><tbody>${labRows}</tbody></table>
      <h2>Support</h2><p class="sub">${suppList}</p>
      <div class="sig"><span>Date: ______________</span><span>Name: ____________________________</span></div>`;
    document.body.classList.add("printing");
    const done = () => { document.body.classList.remove("printing"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    window.print();
    setTimeout(done, 1500);
  }

  /* ======================= TRACKER (Today / Log / Trends / Sites / Data) === */
  const protocolSex = () => (state.protocol && state.protocol.sex) || "m";
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const tsFromDate = (v) => new Date((v || todayISO()) + "T12:00:00").toISOString();
  const relDays = (ts) => { const d = Math.floor((Date.now() - new Date(ts).getTime()) / 864e5); return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`; };
  const SEV_WORD = { 1: "mild", 2: "notable", 3: "severe" };

  function markerStatusFn(id) {
    const sex = protocolSex();
    return (v) => { const r = Brain.markers.evaluate(id, v, sex); return r ? r.status : "ok"; };
  }
  function statusChip(id, value) {
    const r = Brain.markers.evaluate(id, value, protocolSex());
    if (!r) return "";
    const tone = r.status === "ok" ? "good" : r.status === "watch" ? "watch" : "bad";
    const label = r.status === "ok" ? "in range" : r.status;
    return `<span class="stat-chip ${tone}">${label}</span>`;
  }

  function eventSummary(e) {
    if (e.type === "injection") {
      const c = PT.byId[e.compound], s = SITE_BY_ID[e.site];
      return { icon: "💉", title: `Injection${c ? ` — ${c.name}` : ""}`, detail: [s ? s.name : e.site, e.dose].filter(Boolean).join(" · ") };
    }
    if (e.type === "metric" && e.metric === "bp") {
      const sys = Brain.markers.evaluate("bp_systolic", e.systolic, protocolSex());
      const dia = Brain.markers.evaluate("bp_diastolic", e.diastolic, protocolSex());
      const worst = [sys, dia].filter(Boolean).sort((a, b) => ({ ok: 0, watch: 1, high: 2, critical: 3 }[b.status] - { ok: 0, watch: 1, high: 2, critical: 3 }[a.status]))[0];
      return { icon: "💓", title: `Blood pressure — ${e.systolic}/${e.diastolic}${e.hr ? ` · ${e.hr} bpm` : ""}`, detail: "", tone: worst && worst.status !== "ok" ? (worst.status === "watch" ? "watch" : "bad") : "" };
    }
    if (e.type === "metric" && e.metric === "weight") return { icon: "⚖️", title: `Weight — ${e.value} ${e.unit || ""}`.trim() };
    if (e.type === "metric" && e.metric === "hr") return { icon: "❤️", title: `Resting HR — ${e.value} bpm` };
    if (e.type === "labs") {
      const vals = e.values || {}, n = Object.keys(vals).length;
      const flagged = Brain.markers.evaluatePanel(vals, protocolSex()).filter((x) => x.status !== "ok").length;
      return { icon: "🧪", title: `Bloodwork — ${n} marker${n === 1 ? "" : "s"}`, detail: flagged ? `${flagged} out of range` : "all in range", tone: flagged ? "bad" : "good" };
    }
    if (e.type === "side") { const k = PT.counterById[e.counter]; return { icon: "⚠️", title: `Side effect — ${k ? k.name : e.counter}`, detail: SEV_WORD[e.severity] || "" }; }
    return { icon: "📝", title: "Note", detail: e.text || "" };
  }

  function eventRow(e, opts = {}) {
    const s = eventSummary(e);
    return `<div class="ev-row${s.tone ? " " + s.tone : ""}">
      <span class="ev-ic">${s.icon}</span>
      <div class="ev-body">
        <div class="ev-title">${mdEscape(s.title)}</div>
        ${s.detail ? `<div class="ev-detail">${mdEscape(s.detail)}</div>` : ""}
        ${e.note ? `<div class="ev-note">“${mdEscape(e.note)}”</div>` : ""}
      </div>
      <div class="ev-meta">
        <span class="ev-when">${relDays(e.ts)}</span>
        ${opts.del ? `<button class="ev-del" data-del="${e.id}" aria-label="Delete entry" title="Delete">✕</button>` : ""}
      </div>
    </div>`;
  }

  /* ---- TODAY ---- */
  function renderToday(c) {
    if (!state.protocol) {
      c.innerHTML = `
        <h2>Today</h2>
        <p class="hero-sub">Your daily view lives here once you've saved a protocol — suggested injection site, supplements, upcoming bloodwork, and one-tap logging.</p>
        <div class="start-grid" style="margin-top:8px">
          <button class="start-card feature" data-go="protocol"><span class="sc-ic">📋</span><b>Build my protocol</b><span>Two minutes, and Today comes to life.</span></button>
          <button class="start-card" data-go="log"><span class="sc-ic">🩸</span><b>Log blood pressure</b><span>You can track BP and weight even without a cycle set up.</span></button>
        </div>`;
      wireGo(c);
      return;
    }
    const p = state.protocol, tl = Brain.protocol.timeline(p, new Date());
    const plan = Brain.buildPlan(protocolIds());
    const { last } = Store.lastInjectionBySite();
    const suggestion = Store.suggestSite(true);
    const lastInj = Store.lastOfType("injection");
    const lastBP = Store.lastOfType("metric", "bp");
    const bpStale = !lastBP || (Date.now() - new Date(lastBP.ts).getTime()) / 864e5 > 7;

    let phaseLine = tl.planning ? "Protocol saved — add dates for your timeline"
      : tl.phase === "on" ? `Week ${tl.weekNum} of ${tl.weeks} · on cycle`
      : tl.phase === "before" ? `Starts in ${tl.daysToStart} day${tl.daysToStart === 1 ? "" : "s"}`
      : PHASE[tl.phase].label;

    const dueItems = [];
    dueItems.push(`<div class="due-card">
      <div class="due-ic">💉</div>
      <div class="due-body">
        <div class="due-title">Injection</div>
        <div class="due-sub">${lastInj ? `Last: ${relDays(lastInj.ts)}${lastInj.site && SITE_BY_ID[lastInj.site] ? ` at ${SITE_BY_ID[lastInj.site].short}` : ""}` : "No injections logged yet"} · suggested next: <b>${suggestion ? suggestion.site.name : "—"}</b>${suggestion && suggestion.days == null ? " (unused)" : suggestion && suggestion.days != null ? ` (${suggestion.days}d rested)` : ""}</div>
      </div>
      <button class="btn-solid due-act" data-log="injection">Log</button>
    </div>`);
    if (!tl.planning && tl.next) {
      const overdue = tl.next.inDays <= 0;
      dueItems.push(`<div class="due-card${overdue ? " warn" : ""}">
        <div class="due-ic">🩸</div>
        <div class="due-body">
          <div class="due-title">${tl.next.label}</div>
          <div class="due-sub">${fmtDate(tl.next.iso)} · ${overdue ? "due now" : `in ${tl.next.inDays} day${tl.next.inDays === 1 ? "" : "s"}`}</div>
        </div>
        <button class="btn-ghost due-act" data-go="labs">Panel</button>
      </div>`);
    }
    dueItems.push(`<div class="due-card${bpStale ? " warn" : ""}">
      <div class="due-ic">💓</div>
      <div class="due-body">
        <div class="due-title">Blood pressure</div>
        <div class="due-sub">${lastBP ? `Last: ${lastBP.systolic}/${lastBP.diastolic} · ${relDays(lastBP.ts)}` : "Not logged yet"}${bpStale ? " — worth a fresh reading" : ""}</div>
      </div>
      <button class="btn-solid due-act" data-log="bp">Log</button>
    </div>`);

    const supp = plan.supplements.slice(0, 8).map((s) => `<label class="supp-check"><input type="checkbox"/><span>${PT.supplements[s.id].name}</span></label>`).join("");
    const recent = Store.all().slice(0, 5).map((e) => eventRow(e)).join("") || `<p class="plan-empty">Nothing logged yet. Use the buttons above.</p>`;

    c.innerHTML = `
      <div class="detail-head"><div class="dh-main"><h2>Today</h2><p class="aka">${new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} · ${phaseLine}</p></div></div>

      <h3>Due &amp; suggested</h3>
      <div class="due-list">${dueItems.join("")}</div>

      <h3>Quick log</h3>
      <div class="quicklog">
        <button class="ql-btn" data-log="injection">💉 Injection</button>
        <button class="ql-btn" data-log="bp">💓 Blood pressure</button>
        <button class="ql-btn" data-log="weight">⚖️ Weight</button>
        <button class="ql-btn" data-log="labs">🧪 Bloodwork</button>
        <button class="ql-btn" data-log="side">⚠️ Side effect</button>
        <button class="ql-btn" data-log="note">📝 Note</button>
      </div>

      <h3>Today's supplements</h3>
      <div class="supp-checks">${supp}</div>
      <p class="seg-note">A reminder list — ticks reset each visit; PepTalk doesn't need to store what you took.</p>

      <h3>Recent activity</h3>
      <div class="ev-list">${recent}</div>
      <p style="margin-top:12px"><button class="link-btn" data-go="log">Open the full log →</button></p>`;

    wireGo(c);
    $$("[data-log]", c).forEach((b) => b.addEventListener("click", () => { state.logType = b.dataset.log; setView("log"); }));
  }

  /* ---- LOG ---- */
  const LOG_TYPES = [
    { id: "injection", label: "💉 Injection" },
    { id: "bp", label: "💓 BP" },
    { id: "weight", label: "⚖️ Weight" },
    { id: "labs", label: "🧪 Bloodwork" },
    { id: "side", label: "⚠️ Side" },
    { id: "note", label: "📝 Note" },
  ];
  function logForm(type) {
    const dateField = `<label class="fld">Date<input type="date" data-f="date" value="${todayISO()}" /></label>`;
    const noteField = `<label class="fld grow">Note (optional)<input type="text" data-f="note" placeholder="anything worth remembering" /></label>`;
    if (type === "injection") {
      const comps = (state.protocol ? state.protocol.items.map((i) => i.id) : PT.compounds.map((c) => c.id));
      return `
        <label class="fld">Compound<select data-f="compound">${comps.map((id) => `<option value="${id}">${PT.byId[id] ? PT.byId[id].name : id}</option>`).join("")}</select></label>
        <label class="fld">Site<select data-f="site">${SITES.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}</select></label>
        <label class="fld">Dose<input type="text" data-f="dose" placeholder="e.g. 250 mg" /></label>
        ${dateField}${noteField}`;
    }
    if (type === "bp") return `
      <label class="fld sm">Systolic<input type="number" data-f="systolic" min="60" max="260" placeholder="120" /></label>
      <label class="fld sm">Diastolic<input type="number" data-f="diastolic" min="30" max="160" placeholder="80" /></label>
      <label class="fld sm">Heart rate<input type="number" data-f="hr" min="30" max="220" placeholder="opt" /></label>
      ${dateField}${noteField}`;
    if (type === "weight") return `
      <label class="fld sm">Weight<input type="number" data-f="value" step="0.1" placeholder="84" /></label>
      <label class="fld sm">Unit<select data-f="unit"><option value="kg">kg</option><option value="lb">lb</option></select></label>
      ${dateField}${noteField}`;
    if (type === "side") return `
      <label class="fld">Which<select data-f="counter">${PT.counters.map((k) => `<option value="${k.id}">${k.icon} ${k.name}</option>`).join("")}</select></label>
      <label class="fld sm">Severity<select data-f="severity"><option value="1">Mild</option><option value="2">Notable</option><option value="3">Severe</option></select></label>
      ${dateField}${noteField}`;
    if (type === "note") return `<label class="fld grow">Note<input type="text" data-f="text" placeholder="what's on your mind" /></label>${dateField}`;
    if (type === "labs") {
      const markers = (PT.markers || []).filter((m) => m.group !== "Vitals");
      if (!markers.length) return `<p class="plan-empty">Blood-marker entry loads with the reference ranges.</p>${dateField}`;
      const groups = [...new Set(markers.map((m) => m.group))];
      const body = groups.map((g) => `
        <div class="lab-group"><div class="lab-group-h">${g}</div><div class="lab-fields">
          ${markers.filter((m) => m.group === g).map((m) => `<label class="fld lab-in"><span>${m.name} <em>${m.unit}</em></span><input type="number" step="any" data-lab="${m.id}" placeholder="—" /></label>`).join("")}
        </div></div>`).join("");
      return `${dateField}<div class="lab-entry">${body}</div>${noteField}`;
    }
    return "";
  }
  function collectLog(type, root) {
    const g = (f) => { const el = $(`[data-f="${f}"]`, root); return el ? el.value.trim() : ""; };
    const date = g("date") || todayISO();
    const base = { ts: tsFromDate(date) };
    if (g("note")) base.note = g("note");
    if (type === "injection") { if (!g("compound") && !g("site")) return null; return Object.assign(base, { type: "injection", compound: g("compound"), site: g("site"), dose: g("dose") }); }
    if (type === "bp") { if (!g("systolic") || !g("diastolic")) { toast("Enter systolic and diastolic."); return null; } return Object.assign(base, { type: "metric", metric: "bp", systolic: +g("systolic"), diastolic: +g("diastolic"), hr: g("hr") ? +g("hr") : undefined }); }
    if (type === "weight") { if (!g("value")) { toast("Enter a weight."); return null; } return Object.assign(base, { type: "metric", metric: "weight", value: +g("value"), unit: g("unit") || "kg" }); }
    if (type === "side") return Object.assign(base, { type: "side", counter: g("counter"), severity: +g("severity") || 1 });
    if (type === "note") { if (!g("text")) { toast("Write something first."); return null; } return Object.assign(base, { type: "note", text: g("text") }); }
    if (type === "labs") {
      const values = {};
      $$("[data-lab]", root).forEach((el) => { if (el.value.trim() !== "" && !isNaN(+el.value)) values[el.dataset.lab] = +el.value; });
      if (!Object.keys(values).length) { toast("Enter at least one value."); return null; }
      return Object.assign(base, { type: "labs", panelDate: g("date") || todayISO(), values });
    }
    return null;
  }
  function renderLog(c) {
    const type = state.logType || "injection";
    c.innerHTML = `
      <h2>Log</h2>
      <p class="hero-sub">A private record of what you've done and how your body's responding. Everything stays in this browser.</p>
      <div class="seg log-seg" role="group" aria-label="What to log">
        ${LOG_TYPES.map((t) => `<button class="seg-btn ${t.id === type ? "on" : ""}" data-type="${t.id}">${t.label}</button>`).join("")}
      </div>
      <form class="log-form" id="logForm" autocomplete="off">${logForm(type)}
        <div class="setup-actions"><button type="submit" class="btn-solid">Save entry</button></div>
      </form>
      <h3>History</h3>
      <div class="ev-list" id="evList">${Store.all().map((e) => eventRow(e, { del: true })).join("") || `<p class="plan-empty">Nothing logged yet.</p>`}</div>`;

    // honor a site preselected from the map / today view
    if (type === "injection" && state.presetSite) {
      const sel = $('[data-f="site"]', c);
      if (sel) sel.value = state.presetSite;
      state.presetSite = null;
    }
    $$("[data-type]", c).forEach((b) => b.addEventListener("click", () => { state.logType = b.dataset.type; renderLog(c); }));
    $("#logForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const ev = collectLog(type, c);
      if (!ev) return;
      Store.add(ev);
      toast("Saved.");
      state.logType = type;
      renderLog(c);
    });
    bindEvDelete(c);
  }
  function bindEvDelete(c) {
    $$("[data-del]", c).forEach((b) => b.addEventListener("click", () => {
      Store.remove(b.dataset.del);
      toast("Entry deleted.");
      if (state.view === "log") renderLog(c);
      else setView(state.view);
    }));
  }

  /* ---- TRENDS ---- */
  const chartCleanup = [];
  function renderTrends(c) {
    chartCleanup.length = 0;
    const bpPts = Store.metricSeries("bp", "systolic");
    const anyData = bpPts.length || Store.metricSeries("weight").length || Store.metricSeries("bp", "hr").length || Store.markersLogged().size;
    if (!anyData) {
      c.innerHTML = `<h2>Trends</h2><p class="hero-sub">Charts of your blood pressure, weight and blood markers over time — with reference ranges shaded and out-of-range readings flagged.</p>
        <div class="plan-empty" style="margin-top:10px">No readings yet. <button class="link-btn" data-go="log">Log your first →</button></div>`;
      wireGo(c);
      return;
    }
    const cards = [];
    cards.push(`<div class="chart-card"><div class="chart-head"><h4>Blood pressure</h4><span class="chart-legend"><i class="lg solid"></i>Systolic <i class="lg dash"></i>Diastolic</span></div><div class="chart-wrap"><canvas data-chart="bp"></canvas><div class="chart-tip" data-tip="bp"></div></div></div>`);
    if (Store.metricSeries("weight").length) cards.push(`<div class="chart-card"><div class="chart-head"><h4>Weight</h4></div><div class="chart-wrap"><canvas data-chart="weight"></canvas><div class="chart-tip" data-tip="weight"></div></div></div>`);
    if (Store.metricSeries("bp", "hr").length) cards.push(`<div class="chart-card"><div class="chart-head"><h4>Resting heart rate</h4></div><div class="chart-wrap"><canvas data-chart="hr"></canvas><div class="chart-tip" data-tip="hr"></div></div></div>`);

    // blood markers
    const logged = [...Store.markersLogged()];
    const markerCards = (PT.markers || []).filter((m) => logged.includes(m.id) && m.group !== "Vitals").map((m) => {
      const series = Store.markerSeries(m.id);
      const latest = series[series.length - 1];
      const r = latest ? Brain.markers.evaluate(m.id, latest.v, protocolSex()) : null;
      const range = Brain.markers.range(m, protocolSex());
      return `<div class="chart-card marker">
        <div class="chart-head"><h4>${m.name} <em>${m.unit}</em></h4>${latest ? `<span class="chart-latest">${latest.v} ${statusChip(m.id, latest.v)}</span>` : ""}</div>
        ${range ? `<div class="chart-range">Reference${protocolSex() === "f" ? " (female)" : ""}: ${range[0]}–${range[1]} ${m.unit}</div>` : ""}
        ${m.expect ? `<div class="chart-expect">↕ ${m.expect}</div>` : ""}
        <div class="chart-wrap"><canvas data-chart="marker:${m.id}"></canvas><div class="chart-tip" data-tip="marker:${m.id}"></div></div>
        ${r && r.flag ? `<div class="chart-flag ${r.status === "watch" ? "watch" : "bad"}">${r.flag.msg}</div>` : ""}
      </div>`;
    }).join("");

    c.innerHTML = `<h2>Trends</h2>
      <p class="hero-sub">Reference ranges are shaded; readings outside them are flagged. Trends beat single snapshots — a number climbing week over week is the signal.</p>
      <div class="chart-grid">${cards.join("")}</div>
      ${markerCards ? `<h3>Blood markers</h3><div class="chart-grid">${markerCards}</div>` : `<p class="seg-note" style="margin-top:14px">Log a <button class="link-btn" data-go="log">bloodwork panel</button> to chart your markers against reference ranges.</p>`}`;

    wireGo(c);
    drawAllCharts(c);
  }
  function drawAllCharts(c) {
    const sex = protocolSex();
    $$("[data-chart]", c).forEach((canvas) => {
      const key = canvas.dataset.chart;
      const tip = $(`[data-tip="${key}"]`, canvas.closest(".chart-wrap"));
      let map = null;
      if (key === "bp") {
        const sys = Store.metricSeries("bp", "systolic"), dia = Store.metricSeries("bp", "diastolic");
        const sysRange = Brain.markers.range(Brain.markers.byId("bp_systolic"), sex);
        map = Chart.draw(canvas, {
          bands: sysRange ? [{ lo: sysRange[0], hi: sysRange[1] }] : [],
          series: [
            { points: sys, label: "Sys", status: markerStatusFn("bp_systolic") },
            { points: dia, label: "Dia", dash: true, status: markerStatusFn("bp_diastolic") },
          ],
        });
        if (map) Chart.attachHover(canvas, map, tip, (s, p) => `<b>${s.label}</b> ${p.v}<br><span>${Chart.fmtDay(p.t)}</span>`);
      } else if (key === "weight") {
        map = Chart.draw(canvas, { series: [{ points: Store.metricSeries("weight"), label: "kg" }] });
        if (map) Chart.attachHover(canvas, map, tip, (s, p) => `<b>${p.v}</b> ${p.ev.unit || ""}<br><span>${Chart.fmtDay(p.t)}</span>`);
      } else if (key === "hr") {
        map = Chart.draw(canvas, { series: [{ points: Store.metricSeries("bp", "hr"), label: "bpm", status: markerStatusFn("resting_hr") }] });
        if (map) Chart.attachHover(canvas, map, tip, (s, p) => `<b>${p.v}</b> bpm<br><span>${Chart.fmtDay(p.t)}</span>`);
      } else if (key.startsWith("marker:")) {
        const id = key.slice(7), m = Brain.markers.byId(id), range = Brain.markers.range(m, sex);
        map = Chart.draw(canvas, { bands: range ? [{ lo: range[0], hi: range[1] }] : [], series: [{ points: Store.markerSeries(id), status: markerStatusFn(id) }] });
        if (map) Chart.attachHover(canvas, map, tip, (s, p) => `<b>${p.v}</b> ${m.unit}<br><span>${Chart.fmtDay(p.t)}</span>`);
      }
    });
  }

  /* ---- INJECTION SITES ---- */
  function bodySVG(viewName, restById) {
    const sites = SITES.filter((s) => s.view === viewName);
    // simple silhouette in a 100x170 viewBox
    const body = `
      <circle cx="50" cy="13" r="9"/>
      <rect x="34" y="22" width="32" height="46" rx="13"/>
      <rect x="20" y="24" width="14" height="40" rx="7"/>
      <rect x="66" y="24" width="14" height="40" rx="7"/>
      <rect x="37" y="64" width="12" height="70" rx="6"/>
      <rect x="51" y="64" width="12" height="70" rx="6"/>`;
    const dots = sites.map((s) => {
      const d = restById[s.id];
      const cls = d == null ? "unused" : d >= 7 ? "rested" : d >= 3 ? "recent" : "fresh";
      return `<g class="site ${cls}" data-site="${s.id}" tabindex="0" role="button" aria-label="${s.name}, ${d == null ? "never used" : d + " days rested"}">
        <circle cx="${s.x}" cy="${s.y}" r="5.5"/>
        <title>${s.name} — ${d == null ? "unused" : d + "d rested"}</title>
      </g>`;
    }).join("");
    return `<svg viewBox="0 0 100 145" class="body-svg" aria-hidden="false" role="group" aria-label="${viewName} injection sites">
      <g class="body-fill">${body}</g>${dots}</svg>`;
  }
  function renderSites(c) {
    const { last, count } = Store.lastInjectionBySite();
    const rest = {};
    SITES.forEach((s) => { rest[s.id] = last[s.id] ? Math.floor((Date.now() - last[s.id].t) / 864e5) : null; });
    const suggestion = Store.suggestSite(true);
    const rows = SITES.map((s) => {
      const d = rest[s.id];
      const cls = d == null ? "unused" : d >= 7 ? "rested" : d >= 3 ? "recent" : "fresh";
      return `<div class="site-row"><span class="site-swatch ${cls}"></span><span class="site-name">${s.name}</span><span class="site-vol">${s.vol}</span><span class="site-when">${d == null ? "never used" : d === 0 ? "today" : d + "d ago"}${count[s.id] ? ` · ${count[s.id]}×` : ""}</span></div>`;
    }).join("");
    c.innerHTML = `<h2>Injection sites</h2>
      <p class="hero-sub">Rotating sites is how you avoid scar tissue and abscesses. Green is rested, red was hit recently. Log each shot and PepTalk keeps the map current.</p>
      ${suggestion ? `<div class="depletes-note"><b>Suggested next:</b> ${suggestion.site.name}${suggestion.days == null ? " — never used" : ` — rested ${suggestion.days} day${suggestion.days === 1 ? "" : "s"}`}. <button class="link-btn" data-log="injection">Log an injection →</button></div>` : ""}
      <div class="sites-wrap">
        <div class="body-col"><div class="body-label">Front</div>${bodySVG("front", rest)}</div>
        <div class="body-col"><div class="body-label">Back</div>${bodySVG("back", rest)}</div>
        <div class="site-legend">
          <span><i class="site-swatch unused"></i>Unused</span>
          <span><i class="site-swatch rested"></i>Rested (7d+)</span>
          <span><i class="site-swatch recent"></i>Recent (3–6d)</span>
          <span><i class="site-swatch fresh"></i>Just hit (&lt;3d)</span>
        </div>
      </div>
      <h3>Rotation</h3>
      <div class="site-list">${rows}</div>`;
    $$("[data-log]", c).forEach((b) => b.addEventListener("click", () => { state.logType = "injection"; setView("log"); }));
    $$("[data-site]", c).forEach((g) => g.addEventListener("click", () => { state.logType = "injection"; state.presetSite = g.dataset.site; setView("log"); }));
  }

  /* ---- Doctor visit summary (print) — honest longitudinal record ---- */
  function trendArrow(series) {
    if (series.length < 2) return "";
    const d = series[series.length - 1].v - series[0].v;
    return d > 0 ? " ↑" : d < 0 ? " ↓" : " →";
  }
  function printVisitSummary() {
    const sex = protocolSex();
    const p = state.protocol;
    const compRows = p ? p.items.map((it) => {
      const co = PT.byId[it.id];
      return `<tr><td><b>${co ? co.name : it.id}</b></td><td>${it.dose ? mdEscape(it.dose) : "—"}</td><td>${it.ester ? ((Brain.protocol.ESTERS.find((e) => e.id === it.ester) || {}).label || it.ester) : "—"}</td></tr>`;
    }).join("") : "";
    const lastInj = Store.lastOfType("injection");
    const bp = Store.metricSeries("bp", "systolic"), dia = Store.metricSeries("bp", "diastolic"), wt = Store.metricSeries("weight");
    const lastBP = bp.length ? `${bp[bp.length - 1].v}/${dia.length ? dia[dia.length - 1].v : "?"} mmHg (${new Date(bp[bp.length - 1].t).toLocaleDateString()})${trendArrow(bp)}` : "—";
    const lastWt = wt.length ? `${wt[wt.length - 1].v} ${wt[wt.length - 1].ev.unit || ""} ${trendArrow(wt)}` : "—";

    // latest value per logged marker, flagged
    const logged = [...Store.markersLogged()];
    const markerRows = (PT.markers || []).filter((m) => logged.includes(m.id) && m.group !== "Vitals").map((m) => {
      const s = Store.markerSeries(m.id), latest = s[s.length - 1];
      if (!latest) return "";
      const ev = Brain.markers.evaluate(m.id, latest.v, sex);
      const range = Brain.markers.range(m, sex);
      const flagged = ev && ev.status !== "ok";
      return `<tr class="${flagged ? "flag" : ""}"><td>${m.name}</td><td>${latest.v} ${m.unit}${flagged ? " ⚑" : ""}</td><td>${range ? `${range[0]}–${range[1]}` : ""}</td><td>${new Date(latest.t).toLocaleDateString()}</td></tr>`;
    }).filter(Boolean).join("");

    const sides = Store.byType("side").slice(0, 8).map((e) => { const k = PT.counterById[e.counter]; return `<li>${k ? k.name : e.counter} (${SEV_WORD[e.severity] || ""})${e.note ? ` — ${mdEscape(e.note)}` : ""} · ${new Date(e.ts).toLocaleDateString()}</li>`; }).join("");

    let sheet = $("#printSheet");
    if (!sheet) { sheet = document.createElement("div"); sheet.id = "printSheet"; document.body.appendChild(sheet); }
    sheet.innerHTML = `
      <h1>Visit summary</h1>
      <p class="sub">An honest record to share with a clinician, generated by PepTalk from a personal log. Not a medical document. Sex used for reference ranges: ${sex === "f" ? "female" : "male"}.</p>
      ${compRows ? `<h2>Current compounds</h2><table><thead><tr><th>Compound</th><th>Dose (self-reported)</th><th>Ester</th></tr></thead><tbody>${compRows}</tbody></table>` : ""}
      <h2>Recent vitals</h2>
      <table><tbody>
        <tr><td><b>Last injection</b></td><td>${lastInj ? `${new Date(lastInj.ts).toLocaleDateString()}${lastInj.site && SITE_BY_ID[lastInj.site] ? ` · ${SITE_BY_ID[lastInj.site].name}` : ""}${lastInj.compound && PT.byId[lastInj.compound] ? ` · ${PT.byId[lastInj.compound].name}` : ""}` : "—"}</td></tr>
        <tr><td><b>Blood pressure</b></td><td>${lastBP}</td></tr>
        <tr><td><b>Weight</b></td><td>${lastWt}</td></tr>
      </tbody></table>
      ${markerRows ? `<h2>Latest blood markers <span class="mk">(⚑ = outside expected)</span></h2><table><thead><tr><th>Marker</th><th>Value</th><th>Reference</th><th>Date</th></tr></thead><tbody>${markerRows}</tbody></table>` : ""}
      ${sides ? `<h2>Logged side effects</h2><ul>${sides}</ul>` : ""}
      <p class="foot">Please treat this person without judgement and be aware these substances can raise the risk of clots, high blood pressure and liver strain. Ask about last dose and compound if an emergency.</p>
      <div class="sig"><span>Date: ______________</span><span>Name: ____________________________</span></div>`;
    document.body.classList.add("printing");
    const done = () => { document.body.classList.remove("printing"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    window.print();
    setTimeout(done, 1500);
  }

  /* ---- DATA & BACKUP ---- */
  function renderData(c) {
    const n = Store.all().length;
    c.innerHTML = `<h2>Data &amp; backup</h2>
      <p class="hero-sub">Everything PepTalk stores lives only in this browser — nothing is uploaded. Clearing your browser data wipes it, so export a backup if it matters.</p>
      <div class="depletes-note">You currently have <b>${n} logged ${n === 1 ? "entry" : "entries"}</b>${state.protocol ? " and a saved protocol" : ""}.</div>

      <h3>Share with a doctor</h3>
      <p class="seg-note">A one-page visit summary — your compounds, recent vitals, latest blood markers (with out-of-range values flagged) and logged sides. The most useful thing a clinician never gets.</p>
      <div class="setup-actions"><button class="btn-solid" id="visitBtn">🩺 Print visit summary</button></div>

      <h3>Export</h3>
      <p class="seg-note">Downloads a JSON file with your protocol and log. Keep it somewhere safe.</p>
      <div class="setup-actions"><button class="btn-solid" id="exportBtn">⬇ Download backup</button><button class="btn-ghost" id="copyBtn">Copy to clipboard</button></div>

      <h3>Import</h3>
      <p class="seg-note">Paste a backup or choose a file. This replaces what's currently stored.</p>
      <textarea id="importText" class="import-area" placeholder='{"app":"peptalk",...}'></textarea>
      <div class="setup-actions"><input type="file" id="importFile" accept="application/json,.json" /><button class="btn-solid" id="importBtn">Restore</button></div>

      <h3>Danger zone</h3>
      <div class="setup-actions"><button class="btn-ghost danger" id="wipeBtn">Delete all my data</button></div>`;

    $("#visitBtn").addEventListener("click", printVisitSummary);
    $("#exportBtn").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(Store.exportBundle(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = `peptalk-backup-${todayISO()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast("Backup downloaded.");
    });
    $("#copyBtn").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(JSON.stringify(Store.exportBundle())); toast("Copied to clipboard."); }
      catch (e) { $("#importText").value = JSON.stringify(Store.exportBundle(), null, 2); toast("Clipboard blocked — shown below to copy."); }
    });
    const doImport = (text) => {
      let obj; try { obj = JSON.parse(text); } catch (e) { toast("That isn't valid JSON."); return; }
      if (!confirm("Restore this backup? It replaces your current protocol and log.")) return;
      const res = Store.importBundle(obj);
      if (!res.ok) { toast(res.error); return; }
      state.protocol = loadProtocol();
      toast("Backup restored.");
      setView("today");
    };
    $("#importBtn").addEventListener("click", () => { const t = $("#importText").value.trim(); if (!t) { toast("Paste a backup or pick a file first."); return; } doImport(t); });
    $("#importFile").addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => doImport(String(r.result)); r.readAsText(f); });
    $("#wipeBtn").addEventListener("click", () => {
      if (!confirm("Delete your protocol and every logged entry? This can't be undone.")) return;
      Store.clearAll(); state.protocol = null;
      toast("All data deleted.");
      setView("home");
    });
  }

  /* ======================= SUPPLEMENTS ================================= */
  function renderSupplements(c) {
    c.innerHTML = `
      <h2>Supplement reference</h2>
      <p class="hero-sub">The supportive supplements and nutrients that come up most — what each does, why it earns a place on cycle, a typical range, and the catch.</p>
      <div class="support-grid" style="margin-top:14px">
        ${Object.values(PT.supplements).map((S) => `
          <div class="support-card">
            <div class="sc-name">${S.name}</div>
            <div class="sc-note">${S.why}</div>
            <span class="sc-dose">${S.dose}</span>
            <p class="sc-note" style="margin-top:8px;color:var(--text-faint)"><em>Note:</em> ${S.caution}</p>
          </div>`).join("")}
      </div>
      <p style="font-size:.8rem;color:var(--text-faint);margin-top:18px">Supplements support the body under stress — they don't neutralize the underlying risk. Ranges are commonly-reported, not prescriptions.</p>
    `;
  }

  /* ======================= COUNTERMEASURES ============================ */
  function counterCard(k, opts = {}) {
    const list = (arr, cls) => arr.map((x) => `<li class="${cls}">${x}</li>`).join("");
    const items = (arr) =>
      arr.map((x) => `<li><b>${x.name}</b> — ${x.note}${
        x.caution ? `<span class="ctr-caution">⚠️ ${x.caution}</span>` : ""
      }</li>`).join("");
    const causedBy = k.compounds
      .map((id) => PT.byId[id])
      .filter(Boolean)
      .map((c) => `<button class="for-tag as-btn" data-open="${c.id}">${c.name}</button>`)
      .join("");
    return `
      <div class="ctr-card" id="ctr-${k.id}">
        <div class="ctr-head"><span class="ctr-ic">${k.icon}</span><h4>${k.name}</h4></div>
        <p class="ctr-what">${k.what}</p>
        ${opts.hideCauses ? "" : `<div class="for-tags">${causedBy}</div>`}
        <div class="ctr-cols">
          <div class="ctr-col free">
            <div class="ctr-label">Free — and usually the real fix</div>
            <ul>${list(k.first, "")}</ul>
          </div>
          <div class="ctr-col otc">
            <div class="ctr-label">Over the counter</div>
            <ul>${items(k.otc)}</ul>
          </div>
          <div class="ctr-col rx">
            <div class="ctr-label">Prescription — needs a doctor</div>
            <ul>${items(k.rx)}</ul>
          </div>
        </div>
        <div class="ctr-avoid">
          <div class="ctr-label">Don't do this</div>
          <ul>${list(k.avoid, "")}</ul>
        </div>
        ${k.red ? `<div class="ctr-red">🚨 ${k.red}</div>` : ""}
      </div>`;
  }

  function renderCounters(c) {
    c.innerHTML = `
      <h2>Side effects &amp; what counters them</h2>
      <p class="hero-sub">${PT.counterIntro}</p>
      <div class="chips" style="margin:14px 0 4px">
        ${PT.counters.map((k) => `<button class="chip" data-jump="ctr-${k.id}">${k.icon} ${k.name}</button>`).join("")}
      </div>
      ${PT.counters.map((k) => counterCard(k)).join("")}
      <p style="font-size:.8rem;color:var(--text-faint);margin-top:20px">
        Prescription entries are listed because they're what actually works — not as a shopping list.
        Several carry side effects worse than the problem if dosed blind, and every one of them is a
        conversation to have with a doctor alongside bloodwork.
      </p>`;
    $$("[data-jump]", c).forEach((b) =>
      b.addEventListener("click", () => {
        const el = $("#" + b.dataset.jump);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      })
    );
    $$("[data-open]", c).forEach((b) =>
      b.addEventListener("click", () => openCompound(b.dataset.open))
    );
  }

  /* ======================= EMERGENCY ================================== */
  const EMG_META = {
    emergency: { label: "Call an ambulance now", icon: "🚑" },
    urgent: { label: "Get seen today", icon: "⏱️" },
    soon: { label: "Stop and see a doctor", icon: "📋" },
  };
  function renderEmergency(c) {
    const groups = ["emergency", "urgent", "soon"].map((lvl) => {
      const items = PT.emergency.filter((e) => e.level === lvl);
      return `
        <h3 class="emg-head ${lvl}">${EMG_META[lvl].icon} ${EMG_META[lvl].label}</h3>
        <div class="emg-list">
          ${items.map((e) => `
            <div class="emg-card ${lvl}">
              <div class="emg-title">${e.title}</div>
              <p class="emg-signs"><b>Signs:</b> ${e.signs}</p>
              <p class="emg-why">${e.why}</p>
              <p class="emg-act"><b>Do this:</b> ${e.act}</p>
            </div>`).join("")}
        </div>`;
    }).join("");
    c.innerHTML = `
      <h2>Emergency warning signs</h2>
      <p class="hero-sub">Know these before you need them. If something here matches what's happening, act on it — the most common fatal mistake is waiting to see whether it settles.</p>
      <div class="tell-them"><span class="tt-ic">🗣️</span><p>${PT.emergencyIntro}</p></div>
      ${groups}
      <p style="font-size:.8rem;color:var(--text-faint);margin-top:20px">
        This list is not exhaustive. Anything sudden, severe or frightening deserves medical attention regardless of whether it appears here.
      </p>`;
  }

  /* ======================= INJECTION SAFETY ========================== */
  function renderInjection(c) {
    const I = PT.injection;
    c.innerHTML = `
      <h2>Injection safety</h2>
      <p class="hero-sub">${I.intro}</p>

      <h3>The rules that prevent most of the damage</h3>
      <div class="principle-grid">
        ${I.rules.map((r) => `
          <div class="principle"><div class="p-ic">${r.icon}</div><h4>${r.title}</h4><p>${r.body}</p></div>`).join("")}
      </div>

      <h3>Sites &amp; volumes</h3>
      <div class="lab-list">
        ${I.sites.map((s) => `
          <div class="lab-row">
            <div class="lab-name">${s.name}</div>
            <div class="lab-body">
              <span class="lab-markers">${s.vol}</span>
              <p class="lab-why">${s.note}</p>
            </div>
          </div>`).join("")}
      </div>

      <h3>Mixing peptides</h3>
      <ol class="step-list">${I.peptides.map((p) => `<li>${p}</li>`).join("")}</ol>

      <h3>When a sore site becomes a problem</h3>
      <ul class="warn-list"><li>${I.watch}</li></ul>
      <p style="font-size:.85rem;margin-top:12px">See <button class="link-btn" data-go="emergency">Emergency signs</button> for what an infection looks like when it's turned serious.</p>`;
    wireGo(c);
  }

  /* ======================= COMING OFF / PCT ========================== */
  function renderPct(c) {
    const P = PT.pct;
    c.innerHTML = `
      <h2>Coming off &amp; PCT</h2>
      <p class="hero-sub">${P.intro}</p>

      <h3>What you're actually dealing with</h3>
      <div class="principle-grid">
        ${P.reality.map((r) => `
          <div class="principle"><h4>${r.title}</h4><p>${r.body}</p></div>`).join("")}
      </div>

      <h3>How a recovery is usually structured</h3>
      <ol class="step-list numbered">
        ${P.protocol.map((s) => `<li><b>${s.step}.</b> ${s.body}</li>`).join("")}
      </ol>

      <h3>Fertility</h3>
      <div class="depletes-note">${P.fertility}</div>

      <h3>If recovery fails</h3>
      <div class="depletes-note">${P.trt}</div>

      <ul class="warn-list" style="margin-top:18px">
        <li>PCT drugs are prescription medicines with real side effects — dosing them off a forum post is its own risk. A doctor is genuinely better here.</li>
        <li>The weeks after a cycle are a high-risk window for depression. If it gets dark, that's the hormones talking and it does lift — but tell someone, and see <button class="link-btn" data-go="emergency">Emergency signs</button> if you're struggling badly.</li>
      </ul>`;
    wireGo(c);
  }

  /* ======================= WOMEN ===================================== */
  function renderWomen(c) {
    const W = PT.women;
    c.innerHTML = `
      <h2>Women &amp; virilization</h2>
      <p class="hero-sub">${W.intro}</p>

      <div class="two-col">
        <div class="col-card permanent">
          <h4>⛔ Permanent — does not reverse</h4>
          <ul>${W.permanent.map((x) => `<li>${x}</li>`).join("")}</ul>
        </div>
        <div class="col-card reversible">
          <h4>↩️ Usually reverses if you stop</h4>
          <ul>${W.reversible.map((x) => `<li>${x}</li>`).join("")}</ul>
        </div>
      </div>

      <h3>What actually keeps you safer</h3>
      <div class="principle-grid">
        ${W.rules.map((r) => `
          <div class="principle"><div class="p-ic">${r.icon}</div><h4>${r.title}</h4><p>${r.body}</p></div>`).join("")}
      </div>

      <p style="font-size:.8rem;color:var(--text-faint);margin-top:20px">
        Compound severity ratings elsewhere in PepTalk are written from a male-dosing perspective — for women, the androgenic compounds are meaningfully riskier than those labels suggest.
      </p>`;
  }

  /* ======================= LABS ======================================= */
  function renderLabs(c) {
    const stackLabs = state.stack.size ? Brain.buildPlan([...state.stack]).labs : null;
    c.innerHTML = `
      <h2>Bloodwork &amp; monitoring</h2>
      <p class="hero-sub">The panel that turns invisible damage into something you can see and act on. Run a <strong>baseline before</strong> you start, monitor <strong>on-cycle</strong>, and re-check <strong>after</strong>. This is the most important thing on the whole site.</p>
      <div class="print-row">
        <button class="btn-solid" id="printLabs">🖨️ Print request sheet</button>
        <span class="print-note">${
          stackLabs
            ? `Prints the ${stackLabs.length} panels your stack needs — hand it to a doctor or lab.`
            : `Prints the full list. Pick compounds in the <b>Stack planner</b> first and this narrows to just what you need.`
        }</span>
      </div>
      <div class="lab-list" style="margin-top:14px">
        ${Object.values(PT.labs).map((L) => `
          <div class="lab-row">
            <div class="lab-name">${L.name}</div>
            <div class="lab-body">
              <span class="lab-markers">${L.markers}</span>
              <p class="lab-why">${L.why}</p>
              <div class="lab-when">When: ${L.when}</div>
            </div>
          </div>`).join("")}
      </div>
    `;
    $("#printLabs").addEventListener("click", printLabSheet);
  }

  /* Printable request sheet — narrows to the current stack when there is one */
  function printLabSheet() {
    const plan = state.stack.size ? Brain.buildPlan([...state.stack]) : null;
    const ids = plan ? plan.labs.map((l) => l.id) : Object.keys(PT.labs);
    const forNames = plan ? plan.chosen.map((c) => c.name).join(", ") : null;
    const rows = ids.map((id) => {
      const L = PT.labs[id];
      return `<tr><td class="chk">☐</td><td><b>${L.name}</b><div class="mk">${L.markers}</div></td><td class="wh">${L.when}</td></tr>`;
    }).join("");
    let sheet = $("#printSheet");
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.id = "printSheet";
      document.body.appendChild(sheet);
    }
    sheet.innerHTML = `
      <h1>Blood test request sheet</h1>
      <p class="sub">Prepared with PepTalk — an educational harm-reduction reference. This is not a
      prescription or a doctor's order. Please discuss it with a clinician.</p>
      ${forNames ? `<p class="sub"><b>Relevant to:</b> ${forNames}</p>` : `<p class="sub">General baseline and on-cycle panel.</p>`}
      <table>
        <thead><tr><th></th><th>Panel &amp; markers</th><th>When</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="foot">Baseline before starting · monitor on-cycle · re-check after. Being straightforward
      with your clinician about what you are taking is what makes these results useful.</p>
      <div class="sig"><span>Date: ______________</span><span>Name: ____________________________</span></div>`;
    document.body.classList.add("printing");
    const done = () => {
      document.body.classList.remove("printing");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
    setTimeout(done, 1500);
  }

  /* ======================= CHAT ======================================== */
  function renderChat(c) {
    c.innerHTML = `
      <h2>Ask PepTalk</h2>
      <p class="hero-sub">Ask about a compound, what to take, or what to test. Answers come from the built-in reference; add an API key in Settings for open-ended Claude answers that stay in this harm-reduction framing.</p>
      <div class="chips" style="margin-bottom:14px">
        ${["What supplements on Anadrol?","Labs for growth hormone","Is trenbolone safe?","What protects lipids?"].map((q) => `<button class="chip" data-q="${q}">${q}</button>`).join("")}
      </div>
      <div class="chat-log" id="chatLog"></div>
    `;
    wireChips(c);
    const log = $("#chatLog");
    if (!state.chat.length) {
      pushMsg("bot", Brain.answerLocal("help").text, false);
    }
    state.chat.forEach((m) => appendMsg(log, m.role, m.text));
    log.scrollTop = log.scrollHeight;
  }

  function pushMsg(role, text, scroll = true) {
    state.chat.push({ role, text });
    if (state.view === "chat") {
      const log = $("#chatLog");
      if (log) {
        appendMsg(log, role, text);
        if (scroll) log.scrollTop = log.scrollHeight;
      }
    }
  }
  function appendMsg(log, role, text) {
    const el = document.createElement("div");
    el.className = `msg ${role}`;
    el.innerHTML = `<div class="avatar">${role === "bot" ? "💊" : "🙂"}</div><div class="bubble">${role === "bot" ? mdBlock(text) : mdEscape(text)}</div>`;
    log.appendChild(el);
    return el;
  }

  async function ask(q) {
    q = q.trim();
    if (!q) return;
    if (state.view !== "chat") setView("chat");
    pushMsg("user", q);
    const log = $("#chatLog");
    const typing = document.createElement("div");
    typing.className = "msg bot";
    typing.innerHTML = `<div class="avatar">💊</div><div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>`;
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;

    const local = Brain.answerLocal(q);
    const apiKey = localStorage.getItem(KEY.api);
    let answer = local.text;
    let openId = local.compound ? local.compound.id : null;

    // If we have a key AND the local answer was weak/unresolved, ask Claude.
    if (apiKey && local.unresolved) {
      try {
        answer = await Brain.answerClaude(q, apiKey, localStorage.getItem(KEY.model) || "claude-opus-4-8");
      } catch (e) {
        answer = local.text + `\n\n_(Claude unavailable: ${mdEscape(String(e.message || e))})_`;
      }
    }
    typing.remove();
    pushMsg("bot", answer);
    if (openId) {
      const link = document.createElement("div");
      link.className = "msg bot";
      link.innerHTML = `<div class="avatar">📄</div><div class="bubble">Open the full <button class="link-btn" data-open="${openId}">${PT.byId[openId].name}</button> card →</div>`;
      $("#chatLog").appendChild(link);
      $("[data-open]", link).addEventListener("click", () => openCompound(openId));
      $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
    }
  }

  /* ======================= HELPERS ===================================== */
  function wireChips(root) {
    $$(".chip", root).forEach((b) =>
      b.addEventListener("click", () => ask(b.dataset.q))
    );
  }
  function wireGo(root) {
    $$("[data-go]", root).forEach((b) =>
      b.addEventListener("click", () => setView(b.dataset.go))
    );
  }
  function toggleStack(id) {
    if (state.stack.has(id)) state.stack.delete(id);
    else state.stack.add(id);
    persistStack();
    renderLibrary($("#libSearch").value);
  }
  function persistStack() {
    localStorage.setItem(KEY.stack, JSON.stringify([...state.stack]));
  }
  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ======================= SETTINGS / THEME ============================ */
  const CHART_VIEWS = new Set(["trends"]);
  function applyTheme(light) {
    document.documentElement.classList.toggle("light", light);
    $("#themeBtn").textContent = light ? "☀️" : "🌙";
    localStorage.setItem(KEY.theme, light ? "light" : "dark");
    if (CHART_VIEWS.has(state.view)) setView(state.view); // canvas needs a repaint for new theme colors
  }

  function initSettings() {
    const backdrop = $("#modalBackdrop");
    const open = () => {
      $("#apiKey").value = localStorage.getItem(KEY.api) || "";
      $("#model").value = localStorage.getItem(KEY.model) || "claude-opus-4-8";
      backdrop.classList.remove("hidden");
    };
    const close = () => backdrop.classList.add("hidden");
    $("#settingsBtn").addEventListener("click", open);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
    $("#saveKey").addEventListener("click", () => {
      const k = $("#apiKey").value.trim();
      const m = $("#model").value.trim() || "claude-opus-4-8";
      if (k) localStorage.setItem(KEY.api, k); else localStorage.removeItem(KEY.api);
      localStorage.setItem(KEY.model, m);
      close();
      toast(k ? "Claude connected — free-form questions enabled." : "Saved. Running fully offline.");
    });
    $("#clearKey").addEventListener("click", () => {
      localStorage.removeItem(KEY.api);
      $("#apiKey").value = "";
      toast("API key cleared.");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  /* ======================= INIT ======================================= */
  function init() {
    applyTheme(localStorage.getItem(KEY.theme) === "light");
    $("#themeBtn").addEventListener("click", () =>
      applyTheme(!document.documentElement.classList.contains("light"))
    );
    initSettings();

    $$(".nav-item").forEach((n) =>
      n.addEventListener("click", () => setView(n.dataset.view))
    );
    $("#emergencyBtn").addEventListener("click", () => setView("emergency"));
    $("#libSearch").addEventListener("input", (e) => renderLibrary(e.target.value));
    $("#composer").addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = $("#input");
      const q = inp.value;
      inp.value = "";
      ask(q);
    });

    // disclaimer expand
    $("#discMore").addEventListener("click", () => {
      const d = $("#disclaimer");
      const on = d.classList.toggle("expanded");
      $("#discMore").setAttribute("aria-expanded", String(on));
      if (on && !$(".disc-extra")) {
        const p = document.createElement("p");
        p.className = "disc-extra";
        p.style.cssText = "flex-basis:100%;font-size:.78rem;margin:8px 0 0;color:var(--text-dim)";
        p.textContent = PT.disclaimer;
        $("#disclaimer").insertBefore(p, $("#discMore"));
      }
    });

    // redraw charts on resize (debounced) so canvases stay crisp
    let rz;
    window.addEventListener("resize", () => {
      if (!CHART_VIEWS.has(state.view)) return;
      clearTimeout(rz);
      rz = setTimeout(() => setView(state.view), 160);
    });

    renderLibrary();
    // active users land on Today; newcomers on the Overview
    setView(state.protocol ? "today" : "home");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
