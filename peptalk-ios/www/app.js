/* ============================================================================
   PepTalk — app.  View router, My Protocol dashboard, stack planner,
   countermeasures, printable sheets, chat, theme.
   ========================================================================== */
(() => {
  "use strict";
  // Guarded storage: accessing window.localStorage throws in a sandboxed frame
  // or with site-data blocked. Shadow it with a safe shim so nothing — including
  // the top-level state initializer below — can crash the app at load.
  const localStorage = (() => {
    try {
      const k = "__pt_probe"; window.localStorage.setItem(k, "1"); window.localStorage.removeItem(k);
      return window.localStorage;
    } catch (e) {
      const m = new Map();
      return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
    }
  })();
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const icon = (n) => `<svg class="ic"><use href="#ic-${n}"/></svg>`; // monochrome line-icon (sprite in index.html)
  const KEY = { api: "peptalk.apiKey", model: "peptalk.model", theme: "peptalk.theme", stack: "peptalk.stack", protocol: "peptalk.protocol.v1" };

  function loadProtocol() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY.protocol) || "null");
      if (p && Array.isArray(p.items) && p.items.length) {
        // ids can arrive from an imported backup or a library rename — keep
        // only ones that resolve, so no render path ever sees an unknown id
        p.items = p.items.filter((it) => it && PT.byId[it.id]);
        if (p.items.length) return p;
      }
    } catch (e) { /* corrupt — ignore */ }
    return null;
  }
  function loadStack() {
    try {
      const a = JSON.parse(localStorage.getItem(KEY.stack) || "[]");
      if (Array.isArray(a)) return new Set(a.filter((id) => typeof id === "string"));
    } catch (e) { /* corrupt — ignore */ }
    return new Set();
  }

  const state = {
    view: "home",
    compound: null,
    stack: loadStack(),
    chat: [],
    protocol: loadProtocol(),
    protocolEditing: false,
    draft: null,
    builderQ: "",
    builderGroup: "All",
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
  const attrEscape = (s) => mdEscape(s).replace(/"/g, "&quot;"); // for use inside "" attributes
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
            <span class="li-aka">${c.aka || c.klass}</span>
          </span>
          <span class="sev-dot ${c.severity}" title="${c.severity} risk" aria-hidden="true"></span>
          <span class="sr-only">${c.severity} risk</span>
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
  // Views are addressable (#/trends, #/compound/testosterone) so the browser
  // back button walks your history instead of leaving the app.
  const VIEWS = new Set(["home", "protocol", "today", "log", "trends", "sites", "data", "stack",
    "builder", "supplements", "labs", "chat", "counters", "emergency", "injection", "pct", "women", "compound"]);
  let routing = false; // set while we drive the hash ourselves, so hashchange doesn't re-render

  function routeOf(v, id) {
    return v === "compound" && id ? `#/compound/${encodeURIComponent(id)}` : `#/${v}`;
  }
  function parseRoute() {
    const m = /^#\/([a-z]+)(?:\/(.+))?$/.exec(location.hash || "");
    if (!m || !VIEWS.has(m[1])) return null;
    const id = m[2] ? decodeURIComponent(m[2]) : null;
    if (m[1] === "compound" && !PT.byId[id]) return null;
    return { view: m[1], id };
  }
  function syncHash(v, id) {
    const want = routeOf(v, id);
    if (location.hash === want) return;
    routing = true;
    try { location.hash = want; } catch (e) { /* hash blocked — routing is a bonus, not a requirement */ }
    setTimeout(() => { routing = false; }, 0);
  }
  function applyRoute() {
    if (routing) return;
    const r = parseRoute();
    if (!r) return setView("home", { push: false });
    if (r.view === "compound") { state.compound = r.id; setView("compound", { push: false }); renderLibrary($("#libSearch").value); }
    else setView(r.view, { push: false });
  }

  function setView(v, opts) {
    state.view = v;
    if (!opts || opts.push !== false) syncHash(v, v === "compound" ? state.compound : null);
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
    else if (v === "builder") renderBuilder(c);
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

  /* ======================= SEARCH PALETTE ============================== */
  // One box over the whole app — 53 compounds across 9 groups plus side effects,
  // supplements, labs and guides is more than a sidebar list can surface.
  let palIndex = null, palResults = [], palCursor = 0, palPrevFocus = null;

  function buildPalIndex() {
    if (palIndex) return palIndex;
    const out = [];
    PT.compounds.forEach((c) => out.push({
      kind: "Compound", tone: "t-iris", ic: "stack",
      label: c.name, sub: [c.aka, c.klass].filter(Boolean).join(" · "),
      hay: [c.name, c.aka, c.klass, c.group, c.id].join(" "),
      go: () => openCompound(c.id),
    }));
    PT.counters.forEach((k) => out.push({
      kind: "Side effect", tone: "t-clay", ic: k.icon,
      label: k.name, sub: k.first[0],
      hay: [k.name, k.what, k.id].join(" "),
      go: () => goAnchor("counters", "ctr-" + k.id),
    }));
    Object.entries(PT.supplements).forEach(([sid, S]) => out.push({
      kind: "Supplement", tone: "t-moss", ic: "pill",
      label: S.name, sub: S.what || S.why,
      hay: [S.name, S.why, (S.tags || []).join(" "), sid].join(" "),
      go: () => goAnchor("supplements", "sup-" + sid),
    }));
    Object.values(PT.labs).forEach((L) => out.push({
      kind: "Bloodwork", kindTone: 1, tone: "t-rose", ic: "drop",
      label: L.name, sub: L.markers,
      hay: [L.name, L.markers, L.why].join(" "),
      go: () => setView("labs"),
    }));
    [
      ["today", "Today", "today", "Your daily view — what's due"],
      ["protocol", "My protocol", "protocol", "Cycle dates, phase and timeline"],
      ["builder", "Create your stack", "stack-add", "Pick compounds, support builds itself"],
      ["stack", "Your stack", "stack", "Saved stack and its support plan"],
      ["trends", "Trends", "trends", "Charts of your readings over time"],
      ["log", "Log", "log", "Record injections, BP, weight, labs"],
      ["sites", "Injection sites", "target", "Rotation map"],
      ["emergency", "Emergency signs", "alert", "Symptoms that mean get help now"],
      ["injection", "Injection safety", "syringe", "Sterile technique, sites, volumes"],
      ["pct", "Coming off & PCT", "cycle", "Suppression and recovery"],
      ["women", "Women & virilization", "venus", "A different risk profile"],
      ["chat", "Ask PepTalk", "chat", "Offline question answering"],
      ["data", "Data & backup", "data", "Export, import, clear"],
    ].forEach(([v, label, ic, sub]) => out.push({
      kind: "Page", tone: "t-sky", ic, label, sub, hay: label + " " + sub, go: () => setView(v),
    }));
    palIndex = out.map((e) => ({ ...e, hayLc: e.hay.toLowerCase(), labelLc: e.label.toLowerCase() }));
    return palIndex;
  }

  function goAnchor(view, anchorId) {
    setView(view);
    const el = $("#" + anchorId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function palSearch(q) {
    const t = q.toLowerCase().trim();
    const idx = buildPalIndex();
    if (!t) return idx.filter((e) => e.kind === "Page").slice(0, 8);
    const words = t.split(/\s+/).filter(Boolean);
    const ranked = idx
      .map((e) => {
        let score = 0;
        for (const w of words) {
          if (e.labelLc.startsWith(w)) score += 100;
          else if (new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(e.labelLc)) score += 60;
          else if (e.labelLc.includes(w)) score += 35;
          else if (e.hayLc.includes(w)) score += 12;
          else return null; // every word must appear somewhere
        }
        if (e.kind === "Compound") score += 4; // the library is the main thing people look for
        return { e, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.e.label.length - b.e.label.length)
      .slice(0, 40)
      .map((x) => x.e);
    // keep each kind contiguous — ordered by its best hit — so headers appear once
    const order = [], byKind = new Map();
    for (const e of ranked) {
      if (!byKind.has(e.kind)) { byKind.set(e.kind, []); order.push(e.kind); }
      byKind.get(e.kind).push(e);
    }
    return order.flatMap((k) => byKind.get(k));
  }

  function palHighlight(label, q) {
    const t = q.trim();
    if (!t) return mdEscape(label);
    const words = [...new Set(t.toLowerCase().split(/\s+/).filter(Boolean))]
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .sort((a, b) => b.length - a.length);
    if (!words.length) return mdEscape(label);
    return mdEscape(label).replace(new RegExp("(" + words.join("|") + ")", "ig"), "<mark>$1</mark>");
  }

  function palRender(q) {
    palResults = palSearch(q);
    palCursor = 0;
    const list = $("#palList");
    if (!palResults.length) {
      list.innerHTML = `<p class="pal-empty">Nothing matches “${mdEscape(q)}”.</p>`;
      $("#palCount").textContent = "No results";
      $("#palInput").removeAttribute("aria-activedescendant");
      return;
    }
    let html = "", lastKind = null;
    palResults.forEach((e, i) => {
      if (e.kind !== lastKind) { html += `<div class="pal-group">${e.kind}</div>`; lastKind = e.kind; }
      html += `<button class="pal-item ${e.tone}" role="option" id="pal-opt-${i}" data-i="${i}" aria-selected="${i === 0}">
        <span class="pal-ic" aria-hidden="true">${icon(e.ic)}</span>
        <span class="pal-body">
          <span class="pal-name">${palHighlight(e.label, q)}</span>
          ${e.sub ? `<span class="pal-sub">${mdEscape(String(e.sub))}</span>` : ""}
        </span>
      </button>`;
    });
    list.innerHTML = html;
    $("#palCount").textContent = `${palResults.length} result${palResults.length === 1 ? "" : "s"}`;
    $("#palInput").setAttribute("aria-activedescendant", "pal-opt-0");
    $$(".pal-item", list).forEach((b) => {
      b.addEventListener("click", () => palChoose(+b.dataset.i));
      b.addEventListener("mousemove", () => palMove(+b.dataset.i - palCursor));
    });
  }

  function palMove(delta) {
    if (!palResults.length) return;
    const n = palResults.length;
    palCursor = (palCursor + delta + n) % n;
    $$(".pal-item").forEach((b, i) => b.setAttribute("aria-selected", String(i === palCursor)));
    const cur = $(`#pal-opt-${palCursor}`);
    if (cur) cur.scrollIntoView({ block: "nearest" });
    $("#palInput").setAttribute("aria-activedescendant", "pal-opt-" + palCursor);
  }

  function palChoose(i) {
    const e = palResults[i];
    if (!e) return;
    closePalette();
    e.go();
  }

  function openPalette(seed) {
    const bd = $("#palBackdrop");
    if (!bd.classList.contains("hidden")) return;
    palPrevFocus = document.activeElement;
    bd.classList.remove("hidden");
    const inp = $("#palInput");
    inp.value = seed || "";
    palRender(inp.value);
    inp.focus();
    inp.select();
  }
  function closePalette() {
    const bd = $("#palBackdrop");
    if (bd.classList.contains("hidden")) return;
    bd.classList.add("hidden");
    // put focus back where it came from, unless we are navigating away
    if (palPrevFocus && document.contains(palPrevFocus)) palPrevFocus.focus();
    palPrevFocus = null;
  }

  function initPalette() {
    const bd = $("#palBackdrop"), inp = $("#palInput");
    $("#searchBtn").addEventListener("click", () => openPalette());
    inp.addEventListener("input", () => palRender(inp.value));
    bd.addEventListener("mousedown", (e) => { if (e.target === bd) closePalette(); });
    bd.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); closePalette(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); palMove(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); palMove(-1); }
      else if (e.key === "Home" && palResults.length) { e.preventDefault(); palMove(-palCursor); }
      else if (e.key === "End" && palResults.length) { e.preventDefault(); palMove(palResults.length - 1 - palCursor); }
      else if (e.key === "Enter") { e.preventDefault(); palChoose(palCursor); }
      else if (e.key === "Tab") {
        e.preventDefault(); // keep focus inside; the input is the only stop
        inp.focus();
      }
    });
    document.addEventListener("keydown", (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || "")) || e.target.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openPalette(); }
      else if (e.key === "/" && !typing && $("#palBackdrop").classList.contains("hidden")) { e.preventDefault(); openPalette(); }
    });
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
    // each topic keeps a stable hue so the app reads as a place, not a wall of grey
    const TONE = ["t-teal", "t-sky", "t-moss", "t-iris", "t-sand", "t-clay", "t-plum", "t-rose", "t-iris"];
    const principle = (p, i) => `
      <div class="principle ${TONE[i % TONE.length]}"><div class="p-ic">${icon(p.icon)}</div><h4>${p.title}</h4><p>${p.body}</p></div>`;
    c.innerHTML = `
      <section class="hero">
        <div class="hero-strip" aria-hidden="true">
          <i style="background:var(--c-iris)"></i><i style="background:var(--c-teal)"></i><i style="background:var(--c-moss)"></i><i style="background:var(--c-sand)"></i><i style="background:var(--c-clay)"></i>
        </div>
        <h2>Use safer, or don't use.</h2>
        <p class="hero-sub">PepTalk gathers what people report doing to reduce the harm of anabolic steroids and peptides — the supportive supplements, the nutrients you can run low on, and the bloodwork that turns invisible damage into something you can actually manage. It is <strong>not medical advice</strong>, and the safest cycle is the one you don't run.</p>
      </section>

      ${homeProtocolCard()}

      <h3>Ask anything</h3>
      <div class="chips">${chips.map((q) => `<button class="chip" data-q="${attrEscape(q)}">${q}</button>`).join("")}</div>

      <h3>Three things that matter more than any pill</h3>
      <div class="principle-grid">${PT.principles.slice(0, 3).map(principle).join("")}</div>

      <h3>All harm-reduction principles</h3>
      <div class="principle-grid">${PT.principles.slice(3).map((p, i) => principle(p, i + 3)).join("")}</div>

      <h3>Get started</h3>
      <div class="start-grid">
        ${state.protocol ? "" : `<button class="start-card feature t-iris" data-go="protocol">
          <span class="sc-ic">${icon("protocol")}</span><b>Build my protocol</b>
          <span>Save what you're running with dates — get your personal timeline, labs and watch-list.</span>
        </button>`}
        <button class="start-card alarm" data-go="emergency">
          <span class="sc-ic">${icon("alert")}</span><b>Emergency signs</b>
          <span>The symptoms that mean stop and get help now. Read this one before you need it.</span>
        </button>
        <button class="start-card t-clay" data-go="counters">
          <span class="sc-ic">${icon("shield")}</span><b>Side effects &amp; counters</b>
          <span>Something's going wrong — here's what actually counters it, free, OTC or prescription.</span>
        </button>
        <button class="start-card t-teal" data-go="builder">
          <span class="sc-ic">${icon("stack-add")}</span><b>Create your stack</b>
          <span>Pick what you're running — the support vitamins, nutrients and bloodwork assemble automatically.</span>
        </button>
        <button class="start-card t-rose" data-go="labs">
          <span class="sc-ic">${icon("drop")}</span><b>Bloodwork</b>
          <span>What to test and when — and a request sheet you can print for a doctor.</span>
        </button>
        <button class="start-card t-sky" data-go="injection">
          <span class="sc-ic">${icon("syringe")}</span><b>Injection safety</b>
          <span>Sterile technique, sites and volumes — where most avoidable harm actually happens.</span>
        </button>
        <button class="start-card t-moss" data-go="pct">
          <span class="sc-ic">${icon("cycle")}</span><b>Coming off &amp; PCT</b>
          <span>Suppression, recovery, fertility, and the decision to make before you start.</span>
        </button>
        <button class="start-card t-plum" data-go="women">
          <span class="sc-ic">${icon("venus")}</span><b>Women &amp; virilization</b>
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
          <p class="aka">${d.aka || d.klass}</p>
          <div class="meta-row">
            ${sevPill(d.severity)}
            <span class="tag">${d.klass}</span>
            <span class="tag">${d.group}</span>
            <span class="tag">Route: ${d.route}</span>
          </div>
        </div>
        <button class="btn-solid" id="stackToggle">${inStack ? "✓ In your stack" : "+ Add to your stack"}</button>
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
            <span class="cm-ic">${icon(k.icon)}</span>
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

  /* ======================= CREATE YOUR STACK (builder) ================== */
  // Pick compounds; the support plan — vitamins, nutrients, labs, warnings —
  // assembles itself live in the rail as you go.
  function renderBuilder(c) {
    const groups = ["All", ...PT.groups];
    c.innerHTML = `
      <h2>Create your stack</h2>
      <p class="hero-sub">Tap what you're running or considering. As you pick, PepTalk assembles the support automatically — the vitamins and nutrients each compound calls for, the bloodwork to run, and the warnings that only show up when compounds combine.</p>
      <div class="builder-tools">
        <input type="search" id="builderSearch" class="builder-search" placeholder="Search compounds…" aria-label="Search compounds" autocomplete="off" value="${attrEscape(state.builderQ || "")}"/>
        <div class="builder-groups" role="group" aria-label="Filter by type">
          ${groups.map((g) => `<button class="bg-chip${(state.builderGroup || "All") === g ? " on" : ""}" data-group="${g}" aria-pressed="${(state.builderGroup || "All") === g}">${g === "Growth hormone axis" ? "GH axis" : g}</button>`).join("")}
        </div>
      </div>
      <div class="sr-only" role="status" id="builderCount"></div>
      <div class="builder-layout">
        <div id="builderGrid" class="builder-grid"></div>
        <aside class="builder-rail" id="builderRail" aria-label="Your stack so far">
          <div class="rail-eyebrow">Auto support</div>
          <div class="rail-sum" id="railSum" role="status"></div>
          <div id="railBody"></div>
        </aside>
      </div>`;

    // debounced so per-keystroke repaints coalesce into one announcement
    let annT;
    const announceCount = (shown) => {
      clearTimeout(annT);
      annT = setTimeout(() => {
        const el = $("#builderCount");
        if (el) el.textContent = shown ? `${shown} compound${shown === 1 ? "" : "s"} shown` : "No compounds match";
      }, 350);
    };
    const paintGrid = () => {
      const q = (state.builderQ || "").toLowerCase().trim();
      const grp = state.builderGroup || "All";
      const match = (co) =>
        (grp === "All" || co.group === grp) &&
        (!q || [co.name, co.aka, co.klass, co.group].join(" ").toLowerCase().includes(q));
      let html = "", shown = 0;
      PT.groups.forEach((g) => {
        const items = PT.compounds.filter((co) => co.group === g && match(co));
        if (!items.length) return;
        html += `<div class="bg-group-label">${g}</div><div class="pick-grid">`;
        items.forEach((co) => {
          shown++;
          const on = state.stack.has(co.id);
          html += `<button class="pick-card${on ? " on" : ""}" data-id="${co.id}" aria-pressed="${on}">
            <span class="pc-check" aria-hidden="true">${icon("check")}</span>
            <span class="pc-name">${co.name}</span>
            <span class="pc-aka">${co.aka || co.klass}</span>
            <span class="pc-meta"><span class="sev-dot ${co.severity}" aria-hidden="true"></span>${co.severity} risk · ${co.klass}</span>
          </button>`;
        });
        html += `</div>`;
      });
      $("#builderGrid").innerHTML = shown ? html
        : `<p class="builder-empty">No compounds match “${mdEscape(state.builderQ || "")}”.</p>`;
      announceCount(shown);
      $$(".pick-card", c).forEach((b) =>
        b.addEventListener("click", () => {
          toggleStack(b.dataset.id);
          const on = state.stack.has(b.dataset.id);
          b.classList.toggle("on", on);
          b.setAttribute("aria-pressed", on);
          paintRail();
        })
      );
    };

    const paintRail = () => {
      // #railSum is a persistent role="status" node updated via textContent only,
      // so screen readers actually announce each change; the rest re-renders freely.
      const sum = $("#railSum"), body = $("#railBody");
      const plan = state.stack.size ? Brain.buildPlan([...state.stack]) : null;
      if (!plan) {
        sum.textContent = "";
        body.innerHTML = `<p class="rail-empty">Nothing picked yet. Choose a compound and its support vitamins, nutrients and bloodwork appear here — merged and de-duplicated as your stack grows.</p>`;
        return;
      }
      const pl = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
      sum.textContent = `${pl(plan.chosen.length, "compound")} · ${pl(plan.supplements.length, "supplement")} · ${pl(plan.labs.length, "lab panel")}${plan.flags.length ? ` · ${pl(plan.flags.length, "warning")}` : ""}`;
      const supp = plan.supplements.map((s) => {
        const n = s.forCompounds.length;
        return `<li><span>${PT.supplements[s.id].name}</span>${n > 1 ? `<span class="rs-x" title="asked for by ${n} compounds">×${n}</span>` : ""}</li>`;
      }).join("");
      const flags = plan.flags.slice(0, 2).map((f) =>
        `<div class="rail-flag ${f.level}">${icon("alert")} <span>${f.text}</span></div>`).join("");
      body.innerHTML = `
        <div class="rail-sec">
          <div class="rail-k">Vitamins &amp; nutrients</div>
          <ul class="rail-supp">${supp}</ul>
        </div>
        ${flags ? `<div class="rail-sec"><div class="rail-k">Read this first</div>${flags}
          ${plan.flags.length > 2 ? `<div class="rail-more">+ ${plan.flags.length - 2} more on your stack page</div>` : ""}</div>` : ""}
        <button class="btn-solid rail-cta" data-go="stack">Open your stack →</button>`;
      wireGo(body);
    };

    paintGrid();
    paintRail();
    $("#builderSearch").addEventListener("input", (e) => {
      state.builderQ = e.target.value;
      paintGrid();
    });
    $$(".bg-chip", c).forEach((b) =>
      b.addEventListener("click", () => {
        state.builderGroup = b.dataset.group;
        $$(".bg-chip", c).forEach((x) => {
          const on = x === b;
          x.classList.toggle("on", on);
          x.setAttribute("aria-pressed", on);
        });
        paintGrid();
      })
    );
  }

  /* ======================= YOUR STACK ================================== */
  function renderStack(c) {
    const plan = state.stack.size ? Brain.buildPlan([...state.stack]) : null;
    if (!plan) {
      c.innerHTML = `
        <h2>Your stack</h2>
        <p class="hero-sub">Nothing here yet. Pick what you're running and PepTalk assembles the rest automatically — supportive vitamins and nutrients, the bloodwork list, and the warnings that matter when compounds combine.</p>
        <div class="start-grid" style="margin-top:8px">
          <button class="start-card feature" data-go="builder">
            <span class="sc-ic">${icon("stack-add")}</span><b>Create your stack</b>
            <span>Tap compounds — support builds itself as you pick.</span>
          </button>
        </div>`;
      wireGo(c);
      return;
    }
    const cards = plan.chosen.map((co) => `
      <div class="stack-card">
        <button class="stk-remove" data-rm="${co.id}" aria-label="Remove ${co.name} from your stack">×</button>
        <button class="stk-main" data-open="${co.id}" title="Open ${co.name}">
          <b>${co.name}</b>
          <span class="stk-aka">${co.aka || co.klass}</span>
        </button>
        <div class="stk-sev">${sevPill(co.severity)}</div>
      </div>`).join("");
    c.innerHTML = `
      <div class="detail-head today-head">
        <div class="dh-main">
          <h2>Your stack</h2>
          <p class="aka">${plan.chosen.length} compound${plan.chosen.length === 1 ? "" : "s"} · support assembled automatically</p>
        </div>
        <button class="btn-ghost" id="editStack">${icon("stack-add")} Add / edit</button>
      </div>
      <div class="stack-cards">${cards}</div>
      <div class="stack-actions">
        <button class="btn-solid" id="saveAsProto">Save as my protocol</button>
        <button class="btn-ghost" id="clearStack">Clear all</button>
      </div>
      ${renderPlan(plan)}`;
    $("#editStack").addEventListener("click", () => setView("builder"));
    $$("[data-open]", c).forEach((b) => b.addEventListener("click", () => openCompound(b.dataset.open)));
    // re-render destroys the focused button — restore focus to the same slot
    // (or the heading when the stack empties) so keyboard/SR users keep their place
    const focusHeading = () => {
      const h = c.querySelector("h2");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
    };
    $$("[data-rm]", c).forEach((b) =>
      b.addEventListener("click", () => {
        const idx = $$(".stk-remove", c).indexOf(b);
        const co = PT.byId[b.dataset.rm];
        toggleStack(b.dataset.rm);
        toast(`${co ? co.name : "Compound"} removed from your stack`);
        renderStack(c);
        const nb = $$(".stk-remove", c);
        if (nb.length) nb[Math.min(idx, nb.length - 1)].focus();
        else focusHeading();
      })
    );
    $$("[data-counter]", c).forEach((b) =>
      b.addEventListener("click", () => {
        setView("counters");
        const el = $("#ctr-" + b.dataset.counter);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      })
    );
    $("#clearStack").addEventListener("click", () => {
      state.stack.clear();
      persistStack();
      updateStackBadge();
      toast("Stack cleared");
      renderStack(c);
      renderLibrary($("#libSearch").value);
      focusHeading();
    });
    $("#saveAsProto").addEventListener("click", () => openProtocolSetup([...state.stack]));
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
    const gaps = plan.chosen
      .map((co) => `<div class="gap-row"><b>${co.name}</b><p>${co.depletes}</p></div>`)
      .join("");
    return `
      ${flags ? `<h3>Read this first</h3>${flags}` : ""}
      <h3>Automatic support — vitamins &amp; nutrients</h3>
      <div class="support-grid">${supp}</div>
      <h3>What this stack runs low on</h3>
      <div class="gap-list">${gaps}</div>
      ${plan.counters.length ? `
      <h3>Side effects this stack can bring — and what counters each</h3>
      <div class="ctr-mini-grid">
        ${plan.counters.map((x) => {
          const k = PT.counterById[x.id];
          return `<button class="ctr-mini" data-counter="${x.id}">
            <span class="cm-ic">${icon(k.icon)}</span>
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
      return `<button class="ctr-mini" data-counter="${x.id}"><span class="cm-ic">${icon(k.icon)}</span><span class="cm-name">${k.name}</span><span class="cm-first">${k.first[0]}</span></button>`;
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
        <button class="seg-btn ${d.sex === "m" ? "on" : ""}" data-sex="m" aria-pressed="${d.sex === "m"}">Male</button>
        <button class="seg-btn ${d.sex === "f" ? "on" : ""}" data-sex="f" aria-pressed="${d.sex === "f"}">Female</button>
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
      $$("[data-sex]", c).forEach((x) => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", String(on)); });
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
      return `<tr><td><b>${co.name}</b> <span class="mk">${co.aka}</span></td><td>${it.dose ? mdEscape(it.dose) : "—"}</td><td>${it.ester ? (Brain.protocol.ESTERS.find((e) => e.id === it.ester) || {}).label || mdEscape(String(it.ester)) : "—"}</td></tr>`;
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
  const midnightOf = (x) => { const d = new Date(x); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const calDaysAgo = (ts) => Math.round((midnightOf(Date.now()) - midnightOf(ts)) / 864e5); // >=0 for past
  const relDays = (ts) => { const d = calDaysAgo(ts); return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`; };
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
      return { icon: icon("syringe"), title: `Injection${c ? ` — ${c.name}` : ""}`, detail: [s ? s.name : e.site, e.dose].filter(Boolean).join(" · ") };
    }
    if (e.type === "metric" && e.metric === "bp") {
      const sys = Brain.markers.evaluate("bp_systolic", e.systolic, protocolSex());
      const dia = Brain.markers.evaluate("bp_diastolic", e.diastolic, protocolSex());
      const worst = [sys, dia].filter(Boolean).sort((a, b) => ({ ok: 0, watch: 1, high: 2, critical: 3 }[b.status] - { ok: 0, watch: 1, high: 2, critical: 3 }[a.status]))[0];
      return { icon: icon("heart"), title: `Blood pressure — ${e.systolic}/${e.diastolic}${e.hr ? ` · ${e.hr} bpm` : ""}`, detail: "", tone: worst && worst.status !== "ok" ? (worst.status === "watch" ? "watch" : "bad") : "" };
    }
    if (e.type === "metric" && e.metric === "weight") return { icon: icon("weight"), title: `Weight — ${e.value} ${e.unit || ""}`.trim() };
    if (e.type === "metric" && e.metric === "hr") return { icon: icon("pulse"), title: `Resting HR — ${e.value} bpm` };
    if (e.type === "labs") {
      const vals = e.values || {}, n = Object.keys(vals).length;
      const flagged = Brain.markers.evaluatePanel(vals, protocolSex()).filter((x) => x.status !== "ok").length;
      return { icon: icon("flask"), title: `Bloodwork — ${n} marker${n === 1 ? "" : "s"}`, detail: flagged ? `${flagged} out of range` : "all in range", tone: flagged ? "bad" : "good" };
    }
    if (e.type === "side") { const k = PT.counterById[e.counter]; return { icon: icon("alert"), title: `Side effect — ${k ? k.name : e.counter}`, detail: SEV_WORD[e.severity] || "" }; }
    return { icon: icon("note"), title: "Note", detail: e.text || "" };
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

  /* ---- TODAY: the hero "vitals readout" ---- */
  function bpWorst(bp) {
    const rank = { ok: 0, watch: 1, low: 1, high: 2, critical: 3 };
    const s = Brain.markers.evaluate("bp_systolic", bp.systolic, protocolSex());
    const d = Brain.markers.evaluate("bp_diastolic", bp.diastolic, protocolSex());
    return [s, d].filter(Boolean).sort((a, b) => rank[b.status] - rank[a.status])[0] || null;
  }
  function todayReadout(tl, lastBP) {
    const roTone = tl.planning ? "" : (tl.phase === "clearing" || tl.phase === "pct") ? "warn" : tl.phase === "done" ? "good" : "";
    let head, phaseWord;
    if (tl.planning) {
      head = `<div class="ro-week ro-word"><b>Ready</b></div>`; phaseWord = "Add dates for your timeline";
    } else if (tl.phase === "on") {
      head = `<div class="ro-week"><b>${String(tl.weekNum).padStart(2, "0")}</b><span class="ro-week-of">/ ${tl.weeks}</span><span class="ro-week-unit">weeks</span></div>`;
      phaseWord = "On cycle";
    } else if (tl.phase === "before") {
      head = `<div class="ro-week"><b>${tl.daysToStart}</b><span class="ro-week-unit">day${tl.daysToStart === 1 ? "" : "s"} to&nbsp;start</span></div>`;
      phaseWord = "Not started yet";
    } else {
      head = `<div class="ro-week ro-word"><b>${PHASE[tl.phase].label}</b></div>`;
      phaseWord = tl.phase === "done" ? "Cycle complete" : tl.phase === "pct" ? "Recovery window" : "Esters clearing";
    }

    // The signature: the cycle drawn as its own pharmacokinetic serum curve.
    let curve = "", precise = "";
    if (!tl.planning && tl.weeks) {
      const md = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const start = tl.dates.start, now = new Date();
      const todayDay = Math.round((md(now) - md(start)) / 864e5);
      const dosingEnd = tl.weeks * 7;                         // last-dose day
      const clr = Math.max(tl.clearance || 0, 6);             // clearance tail (days)
      const clearedOn = new Date(md(start).getTime() + (dosingEnd + clr) * 864e5);
      const shortD = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const dayNum = Math.min(todayDay + 1, dosingEnd);       // never past the last dose
      if (tl.phase === "on") precise = `<div class="ro-precise">Day ${dayNum} of ${dosingEnd}</div>`;
      const posText = tl.phase === "on" ? `week ${tl.weekNum} of ${tl.weeks}, day ${dayNum} of ${dosingEnd} — ` : "";
      curve = `<div class="ro-curve-wrap">
        <span class="ro-curve-eyebrow">Serum level</span>
        <canvas class="ro-curve" data-curve="1" data-weeks="${dosingEnd}" data-clear="${clr}" data-today="${todayDay}" role="img" aria-label="Projected serum level across the ${tl.weeks}-week cycle — ${posText}${phaseWord.toLowerCase()}, clearing around ${shortD(clearedOn)}."></canvas>
        <div class="ro-curve-cap"><span>${shortD(start)}</span><span>${shortD(clearedOn)}</span></div>
      </div>`;
    }

    const glance = [];
    if (lastBP) {
      const r = bpWorst(lastBP);
      const chip = r ? `<span class="stat-chip ${r.status === "ok" ? "good" : r.status === "watch" ? "watch" : "bad"}">${r.status === "ok" ? "ok" : r.status}</span>` : "";
      glance.push(`<div class="ro-metric"><span class="ro-metric-k">Blood pressure</span><span class="ro-metric-val">${lastBP.systolic}/${lastBP.diastolic} ${chip}</span></div>`);
    }
    if (!tl.planning && tl.next) {
      glance.push(`<div class="ro-metric"><span class="ro-metric-k">Next up</span><span class="ro-metric-val">${tl.next.label} · ${tl.next.inDays <= 0 ? "now" : tl.next.inDays + "d"}</span></div>`);
    }
    return `<div class="readout ${roTone}${tl.planning ? " planning" : ""}">
      <div class="ro-main"><span class="ro-eyebrow">Cycle</span>${head}${precise}<div class="ro-phase"><span class="ro-dot"></span>${phaseWord}</div></div>
      ${curve}
      ${glance.length ? `<div class="ro-glance">${glance.join("")}</div>` : ""}
    </div>`;
  }

  function renderToday(c) {
    if (!state.protocol) {
      c.innerHTML = `
        <h2>Today</h2>
        <p class="hero-sub">Your daily view lives here once you've saved a protocol — suggested injection site, supplements, upcoming bloodwork, and one-tap logging.</p>
        <div class="start-grid" style="margin-top:8px">
          <button class="start-card feature" data-go="protocol"><span class="sc-ic">${icon("protocol")}</span><b>Build my protocol</b><span>Two minutes, and Today comes to life.</span></button>
          <button class="start-card" data-log="bp"><span class="sc-ic">${icon("heart")}</span><b>Log blood pressure</b><span>You can track BP and weight even without a cycle set up.</span></button>
        </div>`;
      wireGo(c);
      $$("[data-log]", c).forEach((b) => b.addEventListener("click", () => { state.logType = b.dataset.log; setView("log"); }));
      return;
    }
    const p = state.protocol, tl = Brain.protocol.timeline(p, new Date());
    const plan = Brain.buildPlan(protocolIds());
    const { last } = Store.lastInjectionBySite();
    const suggestion = Store.suggestSite(true);
    const lastInj = Store.lastOfType("injection");
    const lastBP = Store.lastOfType("metric", "bp");
    const bpStale = !lastBP || (Date.now() - new Date(lastBP.ts).getTime()) / 864e5 > 7;

    const dueItems = [];
    dueItems.push(`<div class="due-card">
      <div class="due-ic">${icon("syringe")}</div>
      <div class="due-body">
        <div class="due-title">Injection</div>
        <div class="due-sub">${lastInj ? `Last: ${relDays(lastInj.ts)}${lastInj.site && SITE_BY_ID[lastInj.site] ? ` at ${SITE_BY_ID[lastInj.site].short}` : ""}` : "No injections logged yet"} · suggested next: <b>${suggestion ? suggestion.site.name : "—"}</b>${suggestion && suggestion.days == null ? " (unused)" : suggestion && suggestion.days != null ? ` (${suggestion.days}d rested)` : ""}</div>
      </div>
      <button class="btn-solid due-act" data-log="injection">Log</button>
    </div>`);
    if (!tl.planning && tl.next) {
      const overdue = tl.next.inDays <= 0;
      const isBlood = ["baseline", "mid", "recovery", "post"].includes(tl.next.key);
      dueItems.push(`<div class="due-card${overdue ? " warn" : ""}">
        <div class="due-ic">${isBlood ? icon("drop") : icon("today")}</div>
        <div class="due-body">
          <div class="due-title">${tl.next.label}</div>
          <div class="due-sub">${fmtDate(tl.next.iso)} · ${overdue ? "due now" : `in ${tl.next.inDays} day${tl.next.inDays === 1 ? "" : "s"}`}</div>
        </div>
        ${isBlood ? `<button class="btn-ghost due-act" data-go="labs">Panel</button>` : ""}
      </div>`);
    }
    dueItems.push(`<div class="due-card${bpStale ? " warn" : ""}">
      <div class="due-ic">${icon("heart")}</div>
      <div class="due-body">
        <div class="due-title">Blood pressure</div>
        <div class="due-sub">${lastBP ? `Last: ${lastBP.systolic}/${lastBP.diastolic} · ${relDays(lastBP.ts)}` : "Not logged yet"}${bpStale ? " — worth a fresh reading" : ""}</div>
      </div>
      <button class="btn-solid due-act" data-log="bp">Log</button>
    </div>`);

    const supp = plan.supplements.slice(0, 8).map((s) => `<label class="supp-check"><input type="checkbox"/><span>${PT.supplements[s.id].name}</span></label>`).join("");
    const recent = Store.all().slice(0, 5).map((e) => eventRow(e)).join("") || `<p class="plan-empty">Nothing logged yet. Use the buttons above.</p>`;

    c.innerHTML = `
      <div class="detail-head today-head"><div class="dh-main"><h2>Today</h2><p class="aka">${new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p></div></div>

      ${todayReadout(tl, lastBP)}

      <h3>Due &amp; suggested</h3>
      <div class="due-list">${dueItems.join("")}</div>

      <h3>Quick log</h3>
      <div class="quicklog">
        <button class="ql-btn" data-log="injection">${icon("syringe")} Injection</button>
        <button class="ql-btn" data-log="bp">${icon("heart")} Blood pressure</button>
        <button class="ql-btn" data-log="weight">${icon("weight")} Weight</button>
        <button class="ql-btn" data-log="labs">${icon("flask")} Bloodwork</button>
        <button class="ql-btn" data-log="side">${icon("alert")} Side effect</button>
        <button class="ql-btn" data-log="note">${icon("note")} Note</button>
      </div>

      <h3>Today's supplements</h3>
      <div class="supp-checks">${supp}</div>
      <p class="seg-note">A reminder list — ticks reset each visit; PepTalk doesn't need to store what you took.</p>

      <h3>Recent activity</h3>
      <div class="ev-list">${recent}</div>
      <p style="margin-top:12px"><button class="link-btn" data-go="log">Open the full log →</button></p>`;

    wireGo(c);
    $$("[data-log]", c).forEach((b) => b.addEventListener("click", () => { state.logType = b.dataset.log; setView("log"); }));
    drawReadoutCurve(c, true); // sweep the serum curve in on first paint
  }

  /* ---- LOG ---- */
  const LOG_TYPES = [
    { id: "injection", ic: "syringe", label: "Injection" },
    { id: "bp", ic: "heart", label: "BP" },
    { id: "weight", ic: "weight", label: "Weight" },
    { id: "labs", ic: "flask", label: "Bloodwork" },
    { id: "side", ic: "alert", label: "Side" },
    { id: "note", ic: "note", label: "Note" },
  ];
  function logForm(type) {
    const dateField = `<label class="fld">Date<input type="date" data-f="date" value="${todayISO()}" /></label>`;
    const noteField = `<label class="fld grow">Note (optional)<input type="text" data-f="note" placeholder="anything worth remembering" /></label>`;
    if (type === "injection") {
      const comps = (state.protocol ? state.protocol.items.map((i) => i.id) : PT.compounds.map((c) => c.id));
      return `
        <label class="fld">Compound<select data-f="compound">${comps.map((id) => `<option value="${attrEscape(String(id))}">${PT.byId[id] ? PT.byId[id].name : mdEscape(String(id))}</option>`).join("")}</select></label>
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
      <label class="fld">Which<select data-f="counter">${PT.counters.map((k) => `<option value="${k.id}">${k.name}</option>`).join("")}</select></label>
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
        ${LOG_TYPES.map((t) => `<button class="seg-btn ${t.id === type ? "on" : ""}" data-type="${t.id}" aria-pressed="${t.id === type}">${icon(t.ic)} ${t.label}</button>`).join("")}
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
      toast(Store.ok() ? "Saved." : "Couldn't save — storage may be full or in private mode.");
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
    if (bpPts.length) cards.push(`<div class="chart-card"><div class="chart-head"><h4>Blood pressure</h4><span class="chart-legend"><i class="lg solid"></i>Systolic <i class="lg dash"></i>Diastolic</span></div><div class="chart-wrap"><canvas data-chart="bp"></canvas><div class="chart-tip" data-tip="bp"></div></div></div>`);
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
    // one-shot wipe reveal on the initial trends paint (not on theme/resize repaints)
    $$("[data-chart]", c).forEach((cv) => cv.classList.add("wipe"));
  }
  function drawAllCharts(c) {
    const sex = protocolSex();
    const trend = (pts) => pts.length < 2 ? "" : (pts[pts.length - 1].v > pts[0].v ? ", rising" : pts[pts.length - 1].v < pts[0].v ? ", falling" : ", steady");
    const setAria = (canvas, label) => { canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", label); };
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
        const ls = sys[sys.length - 1], ld = dia[dia.length - 1];
        setAria(canvas, `Blood pressure over ${sys.length} reading${sys.length === 1 ? "" : "s"}${ls && ld ? `, latest ${ls.v} over ${ld.v}` : ""}${trend(sys)}.`);
        if (map) Chart.attachHover(canvas, map, tip, (s, p) => `<b>${s.label}</b> ${p.v}<br><span>${Chart.fmtDay(p.t)}</span>`);
      } else if (key === "weight") {
        const w = Store.metricSeries("weight");
        map = Chart.draw(canvas, { series: [{ points: w, label: "kg" }] });
        setAria(canvas, `Weight over ${w.length} reading${w.length === 1 ? "" : "s"}${w.length ? `, latest ${w[w.length - 1].v} ${w[w.length - 1].ev.unit || ""}` : ""}${trend(w)}.`);
        if (map) Chart.attachHover(canvas, map, tip, (s, p) => `<b>${p.v}</b> ${mdEscape(String(p.ev.unit || ""))}<br><span>${Chart.fmtDay(p.t)}</span>`);
      } else if (key === "hr") {
        const h = Store.metricSeries("bp", "hr");
        map = Chart.draw(canvas, { series: [{ points: h, label: "bpm", status: markerStatusFn("resting_hr") }] });
        setAria(canvas, `Resting heart rate over ${h.length} reading${h.length === 1 ? "" : "s"}${h.length ? `, latest ${h[h.length - 1].v} bpm` : ""}${trend(h)}.`);
        if (map) Chart.attachHover(canvas, map, tip, (s, p) => `<b>${p.v}</b> bpm<br><span>${Chart.fmtDay(p.t)}</span>`);
      } else if (key.startsWith("marker:")) {
        const id = key.slice(7), m = Brain.markers.byId(id), range = Brain.markers.range(m, sex);
        const ser = Store.markerSeries(id), latest = ser[ser.length - 1];
        const ev = latest ? Brain.markers.evaluate(id, latest.v, sex) : null;
        map = Chart.draw(canvas, { bands: range ? [{ lo: range[0], hi: range[1] }] : [], series: [{ points: ser, status: markerStatusFn(id) }] });
        setAria(canvas, `${m.name} over ${ser.length} reading${ser.length === 1 ? "" : "s"}${latest ? `, latest ${latest.v} ${m.unit}${ev && ev.status !== "ok" ? ` (${ev.status})` : " (in range)"}` : ""}${trend(ser)}.`);
        if (map) Chart.attachHover(canvas, map, tip, (s, p) => `<b>${p.v}</b> ${m.unit}<br><span>${Chart.fmtDay(p.t)}</span>`);
      }
    });
    drawReadoutCurve(c);
  }

  /* The Today hero's serum-level trace — a real one-compartment PK curve:
     level builds toward steady state while dosing, then clears after the last
     dose. Thin flat periwinkle line, faint fill, a settled "today" node. */
  let curveRAF = 0;
  function drawReadoutCurve(c, animate) {
    const canvas = $("[data-curve]", c || $("#content"));
    if (!canvas) return;
    cancelAnimationFrame(curveRAF); // never let two sweeps race (theme/resize mid-animation)
    const ctx = canvas.getContext("2d");
    const cssVar = (n) => (getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888");
    const withAlpha = (hex, a) => {
      const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
      return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})` : hex;
    };
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(120, Math.round(rect.width || 240));
    const H = 68;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const dosingEnd = Math.max(1, +canvas.dataset.weeks || 84);  // last-dose day
    const clr = Math.max(1, +canvas.dataset.clear || 6);         // clearance tail
    const todayDay = +canvas.dataset.today;
    const tHalf = Math.max(0.5, clr / 4.5);                      // ~4.5 half-lives to clear
    const k = Math.LN2 / tHalf;
    const domain = dosingEnd + clr;

    const pad = { l: 3, r: 3, t: 11, b: 9 };
    const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
    const Lpeak = 1 - Math.exp(-k * dosingEnd);
    const yMax = Math.max(Lpeak, 1e-4);
    const level = (d) => d <= 0 ? 0 : d <= dosingEnd ? 1 - Math.exp(-k * d) : Lpeak * Math.exp(-k * (d - dosingEnd));
    const X = (d) => pad.l + (d / domain) * plotW;
    const Y = (L) => pad.t + (1 - L / yMax) * plotH;
    const dayAtX = (x) => ((x - pad.l) / plotW) * domain;

    const accent = cssVar("--accent"), lineC = cssVar("--line"), panel = cssVar("--panel-2");
    const y0 = Math.round(Y(0)) + 0.5;
    const xEnd = X(dosingEnd);
    const td = Math.max(0, Math.min(domain, todayDay));
    const cx = X(td), cy = Y(level(td));

    // sample the curve once; paint() clips it to a moving cutoff for the draw-in
    const step = Math.max(0.5, domain / 240);
    const solid = [], decay = [];
    for (let d = 0; d <= dosingEnd + 1e-6; d += step) solid.push([X(d), Y(level(d))]);
    solid.push([xEnd, Y(Lpeak)]);
    for (let d = dosingEnd; d <= domain + 1e-6; d += step) decay.push([X(d), Y(level(d))]);
    decay.push([X(domain), Y(level(domain))]);

    // p in 0..1 = how far the trace has swept from left to right
    function paint(p) {
      ctx.clearRect(0, 0, W, H);
      const cutoffX = pad.l + p * plotW;

      // instrument frame appears immediately; only the signal sweeps in
      ctx.strokeStyle = lineC; ctx.globalAlpha = 0.8; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, y0); ctx.lineTo(W - pad.r, y0); ctx.stroke();
      ctx.globalAlpha = 0.9; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(Math.round(xEnd) + 0.5, pad.t - 5); ctx.lineTo(Math.round(xEnd) + 0.5, H - pad.b); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;

      // faint flat fill under the on-cycle build, clipped to the sweep
      const fx = Math.min(cutoffX, xEnd);
      ctx.beginPath(); ctx.moveTo(solid[0][0], y0);
      solid.forEach(([x, y]) => { if (x <= fx) ctx.lineTo(x, y); });
      if (fx < xEnd) ctx.lineTo(fx, Y(level(dayAtX(fx))));
      ctx.lineTo(fx, y0); ctx.closePath();
      ctx.fillStyle = withAlpha(accent, 0.08); ctx.fill();

      // solid build trace
      ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.strokeStyle = accent; ctx.lineWidth = 1.75;
      ctx.beginPath(); let started = false;
      solid.forEach(([x, y]) => { if (x <= fx) { started ? ctx.lineTo(x, y) : ctx.moveTo(x, y); started = true; } });
      if (fx < xEnd && started) ctx.lineTo(fx, Y(level(dayAtX(fx))));
      if (started) ctx.stroke();

      // dashed clearance tail, once the sweep passes the last dose
      if (cutoffX > xEnd) {
        const dx = Math.min(cutoffX, X(domain));
        ctx.setLineDash([4, 3]); ctx.globalAlpha = 0.85; ctx.beginPath(); let st2 = false;
        decay.forEach(([x, y]) => { if (x <= dx) { st2 ? ctx.lineTo(x, y) : ctx.moveTo(x, y); st2 = true; } });
        if (dx < X(domain) && st2) ctx.lineTo(dx, Y(level(dayAtX(dx))));
        if (st2) ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
      }

      // the "you are here" node — fades in as the sweep reaches it, settles once
      const rev = Math.max(0, Math.min(1, (cutoffX - cx) / 16));
      if (rev > 0) {
        ctx.strokeStyle = withAlpha(accent, 0.5 * rev); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(Math.round(cx) + 0.5, cy); ctx.lineTo(Math.round(cx) + 0.5, H - pad.b); ctx.stroke();
        ctx.globalAlpha = rev;
        ctx.beginPath(); ctx.arc(cx, cy, 3.4 * (0.55 + 0.45 * rev), 0, Math.PI * 2);
        ctx.fillStyle = accent; ctx.fill();
        ctx.lineWidth = 1.6; ctx.strokeStyle = panel; ctx.stroke();
        ctx.font = '600 8px ui-monospace, "SF Mono", Menlo, monospace';
        ctx.fillStyle = withAlpha(accent, rev);
        const NOW = "NOW", lw = ctx.measureText(NOW).width;
        const lx = Math.max(pad.l, Math.min(cx - lw / 2, W - pad.r - lw));
        const ly = cy > pad.t + 12 ? cy - 7 : cy + 12;   // above the node, or below if it sits high
        ctx.fillText(NOW, lx, ly);
        ctx.globalAlpha = 1;
      }
    }

    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduce) { paint(1); return; }
    const t0 = performance.now(), DUR = 760, ease = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / DUR);
      paint(ease(p));
      if (p < 1) curveRAF = requestAnimationFrame(tick);
    };
    curveRAF = requestAnimationFrame(tick);
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
    SITES.forEach((s) => { rest[s.id] = last[s.id] ? Math.max(0, calDaysAgo(last[s.id].t)) : null; });
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
    const pickSite = (site) => { state.logType = "injection"; state.presetSite = site; setView("log"); };
    $$("[data-site]", c).forEach((g) => {
      g.addEventListener("click", () => pickSite(g.dataset.site));
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pickSite(g.dataset.site); } });
    });
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
      return `<tr><td><b>${co ? co.name : mdEscape(String(it.id))}</b></td><td>${it.dose ? mdEscape(it.dose) : "—"}</td><td>${it.ester ? ((Brain.protocol.ESTERS.find((e) => e.id === it.ester) || {}).label || mdEscape(String(it.ester))) : "—"}</td></tr>`;
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
        ${Object.entries(PT.supplements).map(([sid, S]) => `
          <div class="support-card" id="sup-${sid}" style="scroll-margin-top:12px">
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
        <div class="ctr-head"><span class="ctr-ic">${icon(k.icon)}</span><h4>${k.name}</h4></div>
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
        ${PT.counters.map((k) => `<button class="chip" data-jump="ctr-${k.id}">${icon(k.icon)} ${k.name}</button>`).join("")}
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
            : `Prints the full list. <b>Create your stack</b> first and this narrows to just what you need.`
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
      <p class="hero-sub">Ask about a compound, what to take, or what to test. Answers come from the built-in reference and work entirely offline.</p>
      <div class="chips" style="margin-bottom:14px">
        ${["What supplements on Anadrol?","Labs for growth hormone","Is trenbolone safe?","What protects lipids?"].map((q) => `<button class="chip" data-q="${q}">${q}</button>`).join("")}
      </div>
      <div class="chat-log" id="chatLog"></div>
    `;
    wireChips(c);
    const log = $("#chatLog");
    if (!state.chat.length) {
      // seed state only — the forEach below renders it (pushMsg would append too)
      state.chat.push({ role: "bot", text: Brain.answerLocal("help").text });
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
        answer = await Brain.answerClaude(q, apiKey, localStorage.getItem(KEY.model) || "claude-sonnet-5");
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
    updateStackBadge();
    renderLibrary($("#libSearch").value);
  }
  function updateStackBadge() {
    const b = $("#stackCount");
    if (!b) return;
    const n = state.stack.size;
    b.hidden = !n;
    b.textContent = n;
    const btn = b.closest(".nav-item"); // badge is aria-hidden; the button carries the count
    if (btn) btn.setAttribute("aria-label", n ? `Your stack, ${n} compound${n === 1 ? "" : "s"}` : "Your stack");
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
  const CHART_VIEWS = new Set(["trends", "today"]);
  function applyTheme(light) {
    document.documentElement.classList.toggle("light", light);
    $("#themeBtn").innerHTML = icon(light ? "sun" : "moon");
    localStorage.setItem(KEY.theme, light ? "light" : "dark");
    if (CHART_VIEWS.has(state.view)) drawAllCharts($("#content")); // repaint canvases in-place for the new theme
  }

  function initSettings() {
    const backdrop = $("#modalBackdrop");
    const open = () => {
      $("#apiKey").value = localStorage.getItem(KEY.api) || "";
      $("#model").value = localStorage.getItem(KEY.model) || "claude-sonnet-5";
      backdrop.classList.remove("hidden");
    };
    const close = () => backdrop.classList.add("hidden");
    $("#settingsBtn").addEventListener("click", open);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
    $("#saveKey").addEventListener("click", () => {
      const k = $("#apiKey").value.trim();
      const m = $("#model").value.trim() || "claude-sonnet-5";
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
      rz = setTimeout(() => drawAllCharts($("#content")), 160); // redraw in place, keep scroll
    });

    // browser back/forward walks the view history instead of leaving the app
    window.addEventListener("hashchange", applyRoute);
    initPalette();

    renderLibrary();
    // drop stack ids that no longer exist in the library (stale localStorage)
    let stackDirty = false;
    [...state.stack].forEach((id) => { if (!PT.byId[id]) { state.stack.delete(id); stackDirty = true; } });
    if (stackDirty) persistStack();
    updateStackBadge();
    // a shared/bookmarked link wins; otherwise active users land on Today, newcomers on the Overview
    const start = parseRoute();
    if (start) applyRoute();
    else setView(state.protocol ? "today" : "home");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
