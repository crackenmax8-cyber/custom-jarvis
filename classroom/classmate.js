/*
 * classmate.js — the Google Classroom client.
 *
 * Two data sources:
 *   1. DEMO: built-in sample data (dates computed relative to today) so the
 *      app is fully explorable without connecting anything.
 *   2. GOOGLE: real Classroom data via the Google Identity Services token
 *      flow + the Classroom REST API, all in the browser. Read-only scopes.
 *      Needs a (free) OAuth Client ID from the user's Google Cloud project —
 *      see README.md for the 5-minute setup.
 *
 * Normalized assignment shape used everywhere:
 *   { id, courseId, courseName, title, dueAt: Date|null, points, link,
 *     state: 'missing' | 'todo' | 'done' }
 */

const CLASSROOM_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
].join(' ');

class ClassroomClient {
  constructor(getConfig) {
    this.getConfig = getConfig;      // () => { googleClientId }
    this.mode = 'none';              // 'none' | 'demo' | 'google'
    this.courses = [];               // [{id, name}]
    this.items = [];                 // normalized assignments
    this.lastSync = null;
    this.token = null;
    this._tokenClient = null;
  }

  // ---- DEMO MODE -------------------------------------------------------------
  loadDemo() {
    const day = (offset, h = 23, m = 59) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      d.setHours(h, m, 0, 0);
      return d;
    };
    this.courses = [
      { id: 'c1', name: 'Algebra II' },
      { id: 'c2', name: 'English Lit' },
      { id: 'c3', name: 'Chemistry' },
      { id: 'c4', name: 'World History' },
    ];
    this.items = [
      { id: 'a1', courseId: 'c2', courseName: 'English Lit', title: 'Essay: The Great Gatsby themes', dueAt: day(-2), points: 100, link: '', state: 'missing' },
      { id: 'a2', courseId: 'c1', courseName: 'Algebra II', title: 'Worksheet 7.3 — Quadratic systems', dueAt: day(-1, 8, 0), points: 20, link: '', state: 'missing' },
      { id: 'a3', courseId: 'c3', courseName: 'Chemistry', title: 'Lab report: titration', dueAt: day(0, 15, 0), points: 50, link: '', state: 'todo' },
      { id: 'a4', courseId: 'c1', courseName: 'Algebra II', title: 'Problem set 7.4', dueAt: day(1, 8, 0), points: 20, link: '', state: 'todo' },
      { id: 'a5', courseId: 'c4', courseName: 'World History', title: 'Reading response: Chapter 12', dueAt: day(2), points: 15, link: '', state: 'todo' },
      { id: 'a6', courseId: 'c2', courseName: 'English Lit', title: 'Vocabulary quiz prep — unit 9', dueAt: day(4), points: 25, link: '', state: 'todo' },
      { id: 'a7', courseId: 'c3', courseName: 'Chemistry', title: 'Stoichiometry practice problems', dueAt: day(6, 15, 0), points: 30, link: '', state: 'todo' },
      { id: 'a8', courseId: 'c4', courseName: 'World History', title: 'Research project: primary sources', dueAt: day(12), points: 150, link: '', state: 'todo' },
      { id: 'a9', courseId: 'c1', courseName: 'Algebra II', title: 'Chapter 7 review packet', dueAt: null, points: 0, link: '', state: 'todo' },
      { id: 'a10', courseId: 'c2', courseName: 'English Lit', title: 'Reading journal — week 14', dueAt: day(-4), points: 10, link: '', state: 'done' },
      { id: 'a11', courseId: 'c3', courseName: 'Chemistry', title: 'Safety quiz', dueAt: day(-6), points: 10, link: '', state: 'done' },
      { id: 'a12', courseId: 'c1', courseName: 'Algebra II', title: 'Worksheet 7.2', dueAt: day(-5, 8, 0), points: 20, link: '', state: 'done' },
    ];
    this.mode = 'demo';
    this.lastSync = new Date();
  }

  // ---- GOOGLE MODE -------------------------------------------------------------
  loadGsi() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.accounts) return resolve();
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Could not load Google sign-in (no network access here, or it is blocked).'));
      document.head.appendChild(s);
    });
  }

  async connect() {
    const cfg = this.getConfig();
    if (!cfg.googleClientId) {
      throw new Error('NO_CLIENT_ID');
    }
    await this.loadGsi();
    const token = await new Promise((resolve, reject) => {
      try {
        this._tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: cfg.googleClientId,
          scope: CLASSROOM_SCOPES,
          callback: (resp) => resp.access_token ? resolve(resp.access_token) : reject(new Error(resp.error || 'Sign-in was cancelled.')),
          error_callback: (err) => reject(new Error(err.message || err.type || 'Sign-in failed.')),
        });
        this._tokenClient.requestAccessToken();
      } catch (e) { reject(e); }
    });
    this.token = token;
    await this.fetchAll();
    this.mode = 'google';
  }

  async api(path, params = {}) {
    const url = new URL(`https://classroom.googleapis.com/v1/${path}`);
    for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${this.token}` } });
    if (!resp.ok) {
      let detail = `${resp.status}`;
      try { const j = await resp.json(); detail = j.error?.message || detail; } catch (e) {}
      throw new Error(detail);
    }
    return resp.json();
  }

  async apiAll(path, params, listKey) {
    const out = [];
    let pageToken;
    do {
      const j = await this.api(path, { ...params, pageSize: 100, pageToken });
      out.push(...(j[listKey] || []));
      pageToken = j.nextPageToken;
    } while (pageToken);
    return out;
  }

  async fetchAll() {
    const courses = await this.apiAll('courses', { courseStates: 'ACTIVE' }, 'courses');
    this.courses = courses.map(c => ({ id: c.id, name: c.name }));
    const items = [];
    for (const c of this.courses) {
      const [work, subs] = await Promise.all([
        this.apiAll(`courses/${c.id}/courseWork`, {}, 'courseWork'),
        this.apiAll(`courses/${c.id}/courseWork/-/studentSubmissions`, { userId: 'me' }, 'studentSubmissions'),
      ]);
      const subByWork = new Map(subs.map(s => [s.courseWorkId, s]));
      for (const w of work) {
        const sub = subByWork.get(w.id);
        const dueAt = this.parseDue(w.dueDate, w.dueTime);
        const turnedIn = sub && (sub.state === 'TURNED_IN' || sub.state === 'RETURNED');
        const state = turnedIn ? 'done'
          : (sub && sub.late) || (dueAt && dueAt < new Date()) ? 'missing'
          : 'todo';
        items.push({
          id: w.id, courseId: c.id, courseName: c.name,
          title: w.title,
          dueAt,
          points: w.maxPoints || 0,
          link: w.alternateLink || '',
          state,
        });
      }
    }
    this.items = items;
    this.lastSync = new Date();
  }

  // Classroom due dates/times arrive in UTC pieces
  parseDue(dueDate, dueTime) {
    if (!dueDate) return null;
    return new Date(Date.UTC(
      dueDate.year, dueDate.month - 1, dueDate.day,
      dueTime && dueTime.hours != null ? dueTime.hours : 23,
      dueTime && dueTime.minutes != null ? dueTime.minutes : 59
    ));
  }

  disconnect() {
    this.mode = 'none';
    this.token = null;
    this.courses = [];
    this.items = [];
    this.lastSync = null;
  }

  // ---- QUERY HELPERS ------------------------------------------------------------
  open() { return this.items.filter(i => i.state !== 'done'); }
  missing() { return this.items.filter(i => i.state === 'missing'); }
  done() { return this.items.filter(i => i.state === 'done'); }

  dueBetween(from, to) {
    return this.open().filter(i => i.dueAt && i.dueAt >= from && i.dueAt <= to)
      .sort((a, b) => a.dueAt - b.dueAt);
  }

  dueToday() {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    return this.dueBetween(start, end);
  }

  dueTomorrow() {
    const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setHours(23, 59, 59, 999);
    return this.dueBetween(start, end);
  }

  dueThisWeek() {
    const start = new Date();
    const end = new Date(); end.setDate(end.getDate() + 7); end.setHours(23, 59, 59, 999);
    return this.dueBetween(start, end);
  }

  forCourse(nameFragment) {
    const f = nameFragment.toLowerCase();
    return this.open().filter(i => i.courseName.toLowerCase().includes(f))
      .sort((a, b) => (a.dueAt || Infinity) - (b.dueAt || Infinity));
  }
}

window.ClassroomClient = ClassroomClient;
window.CLASSROOM_SCOPES = CLASSROOM_SCOPES;
