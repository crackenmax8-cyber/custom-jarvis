/* ============================================================================
   PepTalk — tracker.  The living-record layer: local storage for logged
   events, a dependency-free canvas trend chart, and injection-site geometry.
   Runs in the browser (Date/localStorage are fine here). No network, no deps.
   ========================================================================== */

/* ---- Injection sites (percent coords within a 100x170 body viewBox) ------ */
const SITES = [
  { id: "delt_l",     name: "Left delt",         short: "L delt",   view: "front", x: 26, y: 34, vol: "≤1 ml" },
  { id: "delt_r",     name: "Right delt",        short: "R delt",   view: "front", x: 74, y: 34, vol: "≤1 ml" },
  { id: "subq_l",     name: "Belly SubQ (left)", short: "L belly",  view: "front", x: 42, y: 60, vol: "small" },
  { id: "subq_r",     name: "Belly SubQ (right)",short: "R belly",  view: "front", x: 58, y: 60, vol: "small" },
  { id: "vastus_l",   name: "Left quad",         short: "L quad",   view: "front", x: 40, y: 96, vol: "≤3 ml" },
  { id: "vastus_r",   name: "Right quad",        short: "R quad",   view: "front", x: 60, y: 96, vol: "≤3 ml" },
  { id: "ventro_l",   name: "Left ventroglute",  short: "L v-glute",view: "back",  x: 36, y: 70, vol: "≤3 ml" },
  { id: "ventro_r",   name: "Right ventroglute", short: "R v-glute",view: "back",  x: 64, y: 70, vol: "≤3 ml" },
  { id: "glute_l",    name: "Left glute",        short: "L glute",  view: "back",  x: 42, y: 62, vol: "≤3 ml" },
  { id: "glute_r",    name: "Right glute",       short: "R glute",  view: "back",  x: 58, y: 62, vol: "≤3 ml" },
];
const SITE_BY_ID = Object.fromEntries(SITES.map((s) => [s.id, s]));

/* ---- Local store for logged events --------------------------------------- */
const Store = (() => {
  const LOG_KEY = "peptalk.log.v1";
  const PROTO_KEY = "peptalk.protocol.v1";

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const nowISO = () => new Date().toISOString();
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // calendar days between two epoch-ms instants (DST/time-of-day safe)
  const calDays = (fromMs, toMs) => Math.round((midnight(new Date(toMs)) - midnight(new Date(fromMs))) / 864e5);
  // parse a stored date: "yyyy-mm-dd" at local noon, else the ISO ts
  const eventMs = (dateStr, ts) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateStr || "") ? dateStr + "T12:00:00" : ts).getTime();

  function fresh() { return { version: 1, events: [], settings: { units: "metric" } }; }
  function normalize(d) {
    if (!d || typeof d !== "object") return fresh();
    d.version = 1;
    d.settings = d.settings && typeof d.settings === "object" ? d.settings : { units: "metric" };
    if (!d.settings.units) d.settings.units = "metric";
    d.events = Array.isArray(d.events) ? d.events.filter((e) => e && e.id && e.ts && e.type) : [];
    // sanitize fields that get rendered, so an imported backup can't inject markup
    d.events.forEach((e) => {
      if (e.metric === "weight" && e.unit !== "kg" && e.unit !== "lb") e.unit = "kg";
    });
    return d;
  }
  let data = normalize((() => { try { return JSON.parse(localStorage.getItem(LOG_KEY) || "null"); } catch (e) { return null; } })());

  let saveOk = true;
  function persist(value) { // save a specific value, report success
    try { localStorage.setItem(LOG_KEY, JSON.stringify(value)); saveOk = true; return true; }
    catch (e) { saveOk = false; return false; } // quota / private mode
  }
  const save = () => persist(data);

  const sortedDesc = () => data.events.slice().sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));

  return {
    all: sortedDesc,
    ok: () => saveOk, // did the last write persist?
    byType: (t) => sortedDesc().filter((e) => e.type === t),
    settings: () => data.settings,
    add(ev) {
      const e = Object.assign({ id: uid(), ts: nowISO() }, ev);
      data.events.push(e);
      save();
      return e;
    },
    update(id, patch) {
      const e = data.events.find((x) => x.id === id);
      if (e) { Object.assign(e, patch); save(); }
      return e;
    },
    remove(id) { data.events = data.events.filter((e) => e.id !== id); save(); },
    setUnits(u) { data.settings.units = u; save(); },

    // metric series ascending, for charts: metric="bp"|"weight"|"hr", field optional
    metricSeries(metric, field) {
      return data.events
        .filter((e) => e.type === "metric" && e.metric === metric && (field ? e[field] != null : true))
        .map((e) => ({ t: eventMs(e.date, e.ts), v: field ? +e[field] : +e.value, ev: e }))
        .filter((p) => Number.isFinite(p.t) && !isNaN(p.v))
        .sort((a, b) => a.t - b.t);
    },
    // blood-marker series ascending from "labs" events (panelDate at local noon)
    markerSeries(markerId) {
      return data.events
        .filter((e) => e.type === "labs" && e.values && e.values[markerId] != null && e.values[markerId] !== "")
        .map((e) => ({ t: eventMs(e.panelDate, e.ts), v: +e.values[markerId], ev: e }))
        .filter((p) => Number.isFinite(p.t) && !isNaN(p.v))
        .sort((a, b) => a.t - b.t);
    },
    markersLogged() {
      const set = new Set();
      data.events.forEach((e) => { if (e.type === "labs" && e.values) Object.keys(e.values).forEach((k) => { if (e.values[k] !== "" && e.values[k] != null) set.add(k); }); });
      return set;
    },
    // Suggest the most-rested site (never-used win first), biased to IM vs SubQ
    suggestSite(preferIM) {
      const { last } = this.lastInjectionBySite();
      const now = Date.now();
      const pool = SITES.filter((s) =>
        preferIM == null ? true : preferIM ? s.id.indexOf("subq") !== 0 : s.id.indexOf("subq") === 0);
      const list = (pool.length ? pool : SITES).map((s) => ({
        site: s,
        days: last[s.id] ? Math.max(0, calDays(last[s.id].t, now)) : null,
      }));
      list.sort((a, b) => {
        if (a.days == null && b.days == null) return 0;
        if (a.days == null) return -1; // never used first
        if (b.days == null) return 1;
        return b.days - a.days; // longest rested next
      });
      return list[0];
    },
    lastInjectionBySite() {
      const last = {}, count = {};
      data.events.filter((e) => e.type === "injection" && e.site).forEach((e) => {
        const t = new Date(e.ts).getTime();
        if (!last[e.site] || t > last[e.site].t) last[e.site] = { t, ev: e };
        count[e.site] = (count[e.site] || 0) + 1;
      });
      return { last, count };
    },
    lastOfType(type, metric) {
      const list = data.events
        .filter((e) => e.type === type && (metric ? e.metric === metric : true))
        .sort((a, b) => (a.ts < b.ts ? 1 : -1));
      return list[0] || null;
    },

    // Full backup bundle (log + protocol)
    exportBundle() {
      let protocol = null;
      try { protocol = JSON.parse(localStorage.getItem(PROTO_KEY) || "null"); } catch (e) {}
      return { app: "peptalk", kind: "backup", exportedAt: nowISO(), protocol, log: data };
    },
    importBundle(obj) {
      if (!obj || obj.app !== "peptalk") return { ok: false, error: "That doesn't look like a PepTalk backup file." };
      if (obj.log && !Array.isArray(obj.log.events)) return { ok: false, error: "The backup's log is malformed." };
      if (obj.log) {
        const next = normalize(obj.log);
        if (!persist(next)) return { ok: false, error: "Couldn't save — storage may be full or blocked. Nothing changed." };
        data = next; // only replace in-memory data once it's safely stored
      }
      if (obj.protocol && Array.isArray(obj.protocol.items)) {
        try { localStorage.setItem(PROTO_KEY, JSON.stringify(obj.protocol)); } catch (e) {}
      }
      return { ok: true };
    },
    clearAll() {
      data = fresh(); save();
      try { localStorage.removeItem(PROTO_KEY); } catch (e) {}
    },
  };
})();

/* ---- Canvas trend chart --------------------------------------------------- */
const Chart = (() => {
  const cssVar = (n) => (getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888");
  function withAlpha(hex, a) {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
    if (!m) return hex;
    return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
  }
  const fmtNum = (v) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10).toString();
  const fmtDay = (ms) => new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  // cfg: { height, series:[{points:[{t,v,ev}], dash, label, status(v)->level}], bands:[{lo,hi}], unit }
  function draw(canvas, cfg) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(240, Math.round(rect.width || 320));
    const H = cfg.height || 156;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const series = (cfg.series || []).filter((s) => s.points && s.points.length);
    const pad = { l: 40, r: 14, t: 12, b: 22 };
    const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
    const ink = cssVar("--text-faint"), line = cssVar("--line");

    if (!series.length) {
      ctx.fillStyle = ink; ctx.font = "12px system-ui, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("No data yet", W / 2, H / 2); ctx.textAlign = "left";
      return null;
    }

    const xs = series.flatMap((s) => s.points.map((p) => p.t));
    let minX = Math.min(...xs), maxX = Math.max(...xs);
    const single = minX === maxX, singleDate = minX;
    if (single) { minX -= 3 * 864e5; maxX += 3 * 864e5; }
    const ys = series.flatMap((s) => s.points.map((p) => p.v));
    let minY = Math.min(...ys), maxY = Math.max(...ys);
    (cfg.bands || []).forEach((b) => { if (b.lo != null) minY = Math.min(minY, b.lo); if (b.hi != null) maxY = Math.max(maxY, b.hi); });
    if (minY === maxY) { minY -= 1; maxY += 1; }
    const padY = (maxY - minY) * 0.14; minY -= padY; maxY += padY;

    const X = (t) => pad.l + ((t - minX) / (maxX - minX)) * plotW;
    const Y = (v) => pad.t + (1 - (v - minY) / (maxY - minY)) * plotH;

    // normal-range band
    (cfg.bands || []).forEach((b) => {
      const yHi = Y(b.hi != null ? b.hi : maxY), yLo = Y(b.lo != null ? b.lo : minY);
      ctx.fillStyle = withAlpha(cssVar("--sev-moderate"), 0.13);
      ctx.fillRect(pad.l, Math.min(yHi, yLo), plotW, Math.abs(yLo - yHi));
    });

    // grid + y labels
    ctx.font = "10px system-ui, sans-serif"; ctx.lineWidth = 1;
    for (let i = 0; i <= 2; i++) {
      const v = minY + ((maxY - minY) * i) / 2, y = Y(v);
      ctx.strokeStyle = line; ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = ink; ctx.textAlign = "left";
      ctx.fillText(fmtNum(v), 4, y + 3);
    }
    // x labels — one centered label for a single reading, else first / last
    ctx.fillStyle = ink;
    if (single) {
      const lbl = fmtDay(singleDate);
      ctx.fillText(lbl, pad.l + (plotW - ctx.measureText(lbl).width) / 2, H - 6);
    } else {
      ctx.fillText(fmtDay(minX), pad.l, H - 6);
      const lbl = fmtDay(maxX); ctx.fillText(lbl, W - pad.r - ctx.measureText(lbl).width, H - 6);
    }

    const dangerC = cssVar("--danger"), amberC = cssVar("--amber"), surface = cssVar("--panel");
    const baseC = cssVar("--chart-line");
    series.forEach((s) => {
      const pts = s.points.slice().sort((a, b) => a.t - b.t);
      ctx.strokeStyle = s.color || baseC; ctx.lineWidth = 2;
      ctx.setLineDash(s.dash ? [5, 4] : []);
      ctx.beginPath();
      pts.forEach((p, i) => { const x = X(p.t), y = Y(p.v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke(); ctx.setLineDash([]);
      pts.forEach((p) => {
        const st = s.status ? s.status(p.v) : "ok";
        const x = X(p.t), y = Y(p.v);
        if (st === "watch") {
          // hollow amber ring — distinct in shape as well as colour
          ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = surface; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = amberC; ctx.stroke();
        } else if (st === "low" || st === "high" || st === "critical") {
          // filled danger dot with a surface ring
          ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = dangerC; ctx.fill();
          ctx.lineWidth = 1.6; ctx.strokeStyle = surface; ctx.stroke();
        } else {
          ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = s.color || baseC; ctx.fill();
        }
      });
      // direct label on the latest point
      const last = pts[pts.length - 1];
      if (s.label) {
        ctx.fillStyle = s.color || baseC; ctx.font = "700 10px system-ui, sans-serif";
        const lx = Math.min(X(last.t) + 6, W - pad.r - ctx.measureText(s.label).width);
        ctx.fillText(s.label, lx, Y(last.v) - 6);
      }
    });

    return { X, Y, series, minX, maxX, pad, W, H };
  }

  // Hover tooltip — matches the nearest reading by x (crosshair style), robust
  function attachHover(canvas, map, tip, fmt) {
    if (!map) return;
    const move = (e) => {
      const r = canvas.getBoundingClientRect();
      const mx = (e.clientX - r.left) * (map.W / r.width); // css px -> chart units
      if (mx < map.pad.l - 20 || mx > map.W) { tip.classList.remove("show"); return; }
      let best = null, bestDX = Infinity;
      map.series.forEach((s) => s.points.forEach((p) => {
        const dx = Math.abs(map.X(p.t) - mx);
        if (dx < bestDX) { bestDX = dx; best = { s, p }; }
      }));
      if (best && bestDX < 60) {
        tip.innerHTML = fmt(best.s, best.p);
        tip.style.left = Math.min(map.X(best.p.t) / map.W * r.width + 12, r.width - 108) + "px";
        tip.style.top = Math.max(2, map.Y(best.p.v) - 36) + "px";
        tip.classList.add("show");
      } else tip.classList.remove("show");
    };
    canvas.onpointermove = move;
    canvas.onpointerleave = () => tip.classList.remove("show");
  }

  return { draw, attachHover, fmtDay };
})();

if (typeof module !== "undefined" && module.exports) module.exports = { SITES, Store, Chart };
