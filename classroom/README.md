# ClassMate — Google Classroom Assignment Checker

A friendly agent that **checks your Google Classroom for assignments** and keeps
everything in one tidy place: what's missing, what's due today, what's coming up
this week — as a color-coded board plus a chat assistant you can ask questions.

Everything runs in your browser. No server, no build step, read-only access.

## What it does

- **Assignment board** — grouped by urgency: Needs attention (missing/overdue),
  Due today, This week, Coming up, No due date, Recently turned in. Each card
  links to the assignment in Classroom.
- **Stat tiles** — missing / due today / due this week / open / turned in at a glance.
- **Chat agent** — ask *"what's due tomorrow?"*, *"am I missing anything?"*,
  *"how does my week look?"*, *"what's left in Chemistry?"*, or say *"refresh"*.
- **✨ Break it down** (student mode) — every open assignment has a button that
  turns it into a step-by-step starter plan (tailored to essays, labs, problem
  sets, quiz prep, projects or readings) paced against the due date. It coaches —
  it never does the work for a student or produces anything to hand in; that's
  deliberate.
- **🍎 Teacher mode** — switch roles in Settings and ClassMate becomes an
  assignment-calibration tool for the coursework *you* authored, across all the
  courses you teach: the board groups by course, and every assignment gets three
  buttons:
  - **🧑‍🏫 Teach** — a classroom-ready mini-lesson on the concept behind the
    assignment: objective, hook, plain-language explanation, a worked example
    (different from the assignment), common misconceptions, exit-ticket questions
  - **✅ Solve** — works the assignment through for a full exemplar solution /
    answer key (worked steps for problem sets, model outline + sample paragraph
    for essays, expected results for labs)
  - **🧪 Rate** — instant difficulty rating (1–5 stars) and student-time
    estimate, plus ambiguity flags, a prerequisite check and a suggested rubric

  Chat commands: *"solve the essay"*, *"teach worksheet 7.3"*, *"rate
  everything"*, *"which is hardest?"*. Solve and Teach do the real work via the
  Claude hookup (API key in Settings); without it you get the instant heuristic
  rating and lesson/solution skeletons.
- **Demo mode** — sample data so you can explore everything before connecting.
- **Optional Claude hookup** — add an Anthropic API key in Settings and the chat
  can also help you plan and prioritize, with your live assignment list as context.

## Try it instantly

```bash
# from this folder
python3 -m http.server 8000
#   then open http://localhost:8000
```

Click **Try the demo** — no account needed.

## Sign in with Google (plus a one-time app registration)

You log in with your **normal Google account** — hit "Sign in with Google",
pick your account in Google's own chooser, done. After the first grant, Google
remembers your permission and future sign-ins are one click.

The only wrinkle: Google requires every app that reads Classroom data to be
**registered once** (the registration is called an OAuth "Client ID" — it
identifies the app, not you, and there is no way around this requirement for a
self-hosted app). The in-app setup wizard walks you through it the first time
you hit Sign in; the same steps are below. You create your own registration
for free — that way *your* browser talks directly to Google and nobody else is
in the loop:

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and
   create a project (any name, e.g. "ClassMate").
2. **APIs & Services → Library** → search "Google Classroom API" → **Enable**.
3. **APIs & Services → OAuth consent screen** → External → fill in the app
   name + your email → add yourself as a **test user**.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID** →
   Application type **Web application** → under "Authorized JavaScript origins"
   add `http://localhost:8000` → **Create**.
5. Copy the Client ID (ends in `.apps.googleusercontent.com`), open ClassMate's
   **Settings** (⚙), paste it, Save — then hit **Connect Google**.

Sign in with your school account and allow the three read-only permissions.

### Privacy & scope

- ClassMate requests **read-only** scopes (`classroom.courses.readonly`,
  `classroom.coursework.me.readonly`, `classroom.student-submissions.me.readonly`).
  It can *never* change, submit, or delete anything.
- Your Client ID and the optional Anthropic key are stored only in your
  browser's `localStorage`. Assignment data lives in the page and is gone when
  you close the tab or hit Disconnect.
- Some school Google Workspace accounts block third-party API access; if
  sign-in is refused, that's a domain-admin policy, not a bug.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Board, stat tiles, chat, settings markup |
| `styles.css` | Friendly light/dark design, urgency color coding |
| `classmate.js` | Google Classroom API client (OAuth token flow) + demo data + query helpers |
| `brain.js` | Chat intents over the assignment data, optional Claude |
| `app.js` | Board rendering, chat wiring, connect/refresh/settings |
