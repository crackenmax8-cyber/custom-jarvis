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
- **✨ Break it down** — every open assignment has a button that turns it into a
  step-by-step starter plan (tailored to essays, labs, problem sets, quiz prep,
  projects or readings) paced against the due date. It coaches — it never does
  the work for you or produces anything to hand in; that's deliberate.
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

## Connect your real Google Classroom (one-time, ~5 minutes)

Google requires an OAuth "Client ID" for any app that reads Classroom data.
You create your own for free — that way *your* browser talks directly to
Google and nobody else is in the loop:

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
