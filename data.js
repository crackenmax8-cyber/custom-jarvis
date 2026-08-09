/*
 * data.js — JARVIS dashboard data model
 * Sample projects + usage limits. Persisted to localStorage so edits survive reloads.
 * This is the single source of truth the voice brain reads from.
 */

const DEFAULT_DATA = {
  operator: 'Commander',
  projects: [
    { id: 'odyssey',  name: 'Project Odyssey',  domain: 'Autonomous Navigation', status: 'active',   progress: 78,  tasksDone: 34, tasksTotal: 44, updated: '4m ago' },
    { id: 'forge',    name: 'Neural Forge',      domain: 'ML Training Pipeline',  status: 'active',   progress: 52,  tasksDone: 12, tasksTotal: 23, updated: '22m ago' },
    { id: 'sentinel', name: 'Sentinel Grid',     domain: 'Security Monitoring',   status: 'warning',  progress: 41,  tasksDone: 9,  tasksTotal: 22, updated: '1h ago' },
    { id: 'aegis',    name: 'Aegis UI',          domain: 'Design System',         status: 'complete', progress: 100, tasksDone: 30, tasksTotal: 30, updated: '2d ago' },
    { id: 'helios',   name: 'Helios Deploy',     domain: 'Infra Automation',      status: 'paused',   progress: 23,  tasksDone: 5,  tasksTotal: 21, updated: '5d ago' },
    { id: 'quantum',  name: 'Quantum Ledger',    domain: 'Blockchain Audit',      status: 'active',   progress: 66,  tasksDone: 18, tasksTotal: 27, updated: '38m ago' },
  ],
  // Usage limits — each is "magnitude toward a cap". Status is derived from the ratio.
  usage: [
    { id: 'api',       label: 'API Calls',  used: 68420,   limit: 100000,  unit: '',      fmt: 'int' },
    { id: 'tokens',    label: 'Tokens',     used: 4200000, limit: 5000000, unit: '',      fmt: 'compact' },
    { id: 'compute',   label: 'Compute',    used: 128,     limit: 160,     unit: 'GPU-h', fmt: 'int' },
    { id: 'storage',   label: 'Storage',    used: 342,     limit: 500,     unit: 'GB',    fmt: 'int' },
    { id: 'bandwidth', label: 'Bandwidth',  used: 1.82,    limit: 2.0,     unit: 'TB',    fmt: 'dec' },
  ],
};

// ---- persistence -----------------------------------------------------------
const STORAGE_KEY = 'jarvis.data.v1';

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredCloneSafe(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    // shallow-merge so new default fields appear even for older saved state
    return {
      operator: parsed.operator || DEFAULT_DATA.operator,
      projects: Array.isArray(parsed.projects) && parsed.projects.length ? parsed.projects : structuredCloneSafe(DEFAULT_DATA.projects),
      usage: Array.isArray(parsed.usage) && parsed.usage.length ? parsed.usage : structuredCloneSafe(DEFAULT_DATA.usage),
    };
  } catch (e) {
    return structuredCloneSafe(DEFAULT_DATA);
  }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* ignore quota */ }
}

function structuredCloneSafe(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ---- derived helpers -------------------------------------------------------
// Usage status thresholds: good < 70%, warning 70–90%, critical >= 90%.
function usageStatus(used, limit) {
  const pct = limit > 0 ? (used / limit) * 100 : 0;
  if (pct >= 90) return 'critical';
  if (pct >= 70) return 'warning';
  return 'good';
}

function formatUsageValue(value, fmt, unit) {
  let s;
  if (fmt === 'compact') {
    if (value >= 1e9) s = (value / 1e9).toFixed(2) + 'B';
    else if (value >= 1e6) s = (value / 1e6).toFixed(2) + 'M';
    else if (value >= 1e3) s = (value / 1e3).toFixed(1) + 'K';
    else s = String(value);
  } else if (fmt === 'dec') {
    s = value.toFixed(2);
  } else {
    s = Math.round(value).toLocaleString('en-US');
  }
  return unit ? `${s} ${unit}` : s;
}

// Expose to the rest of the app (plain globals — no bundler in play).
window.JarvisData = {
  DEFAULT_DATA,
  loadData,
  saveData,
  usageStatus,
  formatUsageValue,
  structuredCloneSafe,
};
