/* ============================================================================
   PepTalk — app.  View router, rendering, stack planner, chat, settings.
   ========================================================================== */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const KEY = { api: "peptalk.apiKey", model: "peptalk.model", theme: "peptalk.theme", stack: "peptalk.stack" };

  const state = {
    view: "home",
    compound: null,
    stack: new Set(JSON.parse(localStorage.getItem(KEY.stack) || "[]")),
    chat: [],
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
    else if (v === "stack") renderStack(c);
    else if (v === "supplements") renderSupplements(c);
    else if (v === "labs") renderLabs(c);
    else if (v === "chat") renderChat(c);
    else if (v === "emergency") renderEmergency(c);
    else if (v === "injection") renderInjection(c);
    else if (v === "pct") renderPct(c);
    else if (v === "women") renderWomen(c);
    else if (v === "compound") renderCompound(c);
    c.scrollTop = 0;
    c.focus({ preventScroll: true });
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
        <button class="start-card alarm" data-go="emergency">
          <span class="sc-ic">🚨</span><b>Emergency signs</b>
          <span>The symptoms that mean stop and get help now. Read this one before you need it.</span>
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
      ${state.stack.size ? `<button class="btn-ghost" id="clearStack" style="margin-top:6px">Clear all</button>` : ""}
      <div id="planOut">${plan ? renderPlan(plan) : `<div class="plan-empty">Select one or more compounds above to build your support &amp; bloodwork plan.</div>`}</div>
    `;
    $$(".pick input", c).forEach((cb) =>
      cb.addEventListener("change", () => {
        toggleStack(cb.dataset.id);
        renderStack(c);
      })
    );
    const cl = $("#clearStack");
    if (cl) cl.addEventListener("click", () => {
      state.stack.clear();
      persistStack();
      renderStack(c);
      renderLibrary($("#libSearch").value);
    });
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
  function applyTheme(light) {
    document.documentElement.classList.toggle("light", light);
    $("#themeBtn").textContent = light ? "☀️" : "🌙";
    localStorage.setItem(KEY.theme, light ? "light" : "dark");
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

    renderLibrary();
    setView("home");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
