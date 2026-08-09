# PepTalk — use safer, or don't use 💊

A calm, non-judgmental **harm-reduction app** for people using — or considering —
anabolic-androgenic steroids (AAS) and performance/therapeutic peptides. It's
both a **reference** (what to take, what to counter, what to watch for) and a
**living tracker** (log your cycle, your blood pressure and your labs, and see
what's drifting) — all offline, stored only in your browser.

![overview](preview.png)

> ## ⚠️ Not medical advice
> PepTalk is **educational harm-reduction information, not medical advice**, and
> nothing in it endorses using these substances. They carry real, sometimes
> permanent risks. Doses shown are *commonly-reported ranges from harm-reduction
> communities* so you can gauge whether you're wildly off — **not prescriptions.**
> Reference ranges are context-aware (several markers run outside "normal" on
> cycle by design) but they are not a diagnosis. Get baseline bloodwork, monitor
> on-cycle, and work with a licensed doctor. **The safest cycle is the one you
> don't run.**

## Track your cycle (the app half)

- 📅 **Today** — your daily driver once a protocol is saved: current cycle phase,
  *due & suggested* (next injection with a rotation-aware site suggestion,
  upcoming bloodwork, a blood-pressure nudge), one-tap quick-log, a supplements
  reminder, and a recent-activity feed. Active users land here.
- 📓 **Log** — record injections, blood pressure, weight, **bloodwork panels**,
  side effects and notes; edit and delete; full history. All user text is escaped.
- 📈 **Trends** — dependency-free canvas charts for blood pressure, weight, heart
  rate and every blood marker, with **reference-range bands** and **out-of-range
  readings flagged in red**. A number climbing week over week is the signal a
  single snapshot hides.
- 🩸 **Bloodwork results** — enter your real lab values and PepTalk compares them
  to **sex-aware, cycle-aware reference ranges** (clinically compiled and
  adversarially verified). Crucially, it *doesn't* alarm on the markers that are
  supposed to run high on cycle — supraphysiological testosterone is a calm
  "expected", while a hematocrit of 54% or a hypertensive-crisis BP is flagged
  loud. That keeps the signal meaningful.
- 🎯 **Injection sites** — a front/back body map coloured by days-since-use, a
  "most-rested, inject here next" suggestion, and a rotation table — the practical
  side of the abscess/scar-tissue advice.
- 🩺 **Visit summary** — a one-page, print-and-hand-to-a-doctor record of your
  compounds, recent vitals, latest labs (out-of-range values flagged) and logged
  sides. The honest longitudinal record a clinician or ER never otherwise gets.
- 🗄️ **Data & backup** — JSON export / import / clear, because localStorage is
  fragile.

## Know what to do (the reference half)

- 📋 **My Protocol** — the part that makes it a tool rather than a reference. Save
  what you're actually running (compounds, doses, esters, a start date and
  length, and whether you're male or female) and PepTalk builds a **personal
  dashboard**: your current cycle phase ("Week 5 of 12"), a progress bar, and an
  **ester-aware timeline** with real dates — baseline and mid-cycle bloodwork,
  last dose, and a **PCT window computed from your longest-clearing ester** (the
  thing people most often get wrong). It rolls up your support stack, the labs to
  run, and a watch-list of what to counter, and prints a **one-page summary for a
  doctor**. Stored only in your browser; peptide-only protocols correctly skip
  PCT. Bridged from Your stack via "Save as my protocol".
- 🚨 **Emergency warning signs** — 15 red-flag presentations sorted by what to do
  *right now*: call an ambulance (heart attack, stroke, pulmonary embolism, DVT,
  severe hypoglycemia, anaphylaxis), get seen today (liver injury, pancreatitis,
  abscess, hypertensive crisis, priapism, mental-health crisis), or stop and see
  a doctor. Reachable in one click from any screen, and the Ask box routes
  red-flag symptoms straight here instead of answering the literal question.
- 💉 **Injection safety** — sterile technique, one-needle-one-use, sites and
  volumes (ventrogluteal, vastus lateralis, delt, dorsogluteal, SubQ), rotation,
  sharps disposal, peptide reconstitution, and what a site infection looks like.
- 🔁 **Coming off & PCT** — what suppression actually is, why the crash is the
  highest-risk window for mental health, how a recovery is structured, fertility,
  and why "blast and cruise" is a decision rather than a default.
- ♀ **Women & virilization** — which effects are **permanent** (voice, clitoral
  enlargement, hirsutism, scalp hair) versus reversible, why the first sign means
  stop that day, and why counterfeits are themselves a virilization risk.
- 📚 **Compound library** — 53 compounds grouped by class: injectable and oral
  steroids, **SARMs and research anabolics** (RAD-140, LGD-4033, Ostarine, YK-11,
  Cardarine, S-23, Andarine), **ancillaries and PCT** (HCG, aromatase inhibitors,
  SERMs, cabergoline, proviron, finasteride, telmisartan, tadalafil), **fat-loss
  and thyroid** agents (clenbuterol, T3, DNP, yohimbine), the growth-hormone axis
  (HGH, CJC-1295, tesamorelin, sermorelin, GHRP-2/6, IGF-1 LR3, MK-677), and
  recovery, metabolic/GLP-1 and other peptides. Each carries a severity rating
  shown as a **label, never color alone**.
- 🛡️ **Side effects & what counters them** — 20 side effects, each answering
  *"this is happening, what do I actually do?"* in three honest tiers: what's
  **free** (lower the dose, cardio, hydrate — usually the real fix), what's
  **over the counter**, and what's an actual **prescription drug**, with the
  serious ones (cabergoline, finasteride, isotretinoin, diuretics) carrying
  explicit risk warnings. Plus a *"don't do this"* block per entry — including
  the mistakes that cause more harm than the original problem, like blind AI
  dosing or expecting finasteride to save your hair on trenbolone. Wired both
  ways: every compound card lists the counters relevant to it, and your stack
  rolls them up for everything you're running.
- 💊 **"What to take"** — for every compound: the supportive supplements and the
  nutrients you can run low on, each with *why*, a typical range, and the catch.
- 🩸 **Bloodwork to monitor** — the specific panels that matter for each compound
  (lipids/ApoB, CBC/hematocrit, liver, kidney, hormones, glucose, and more), plus
  a **printable request sheet** you can hand to a doctor or lab — it narrows to
  just the panels your selected stack needs.
- 🧬 **Create your stack** — a selection page of compound cards (searchable,
  filterable by type). As you pick, a live **auto-support rail** assembles the
  vitamins and nutrients your choices call for, de-duplicated with ×N counts,
  plus lab-panel totals and the first combined-risk flags.
- 🧬 **Your stack** — the saved stack as a dashboard: your compounds (open /
  remove each), **automatic support — vitamins & nutrients** (tagged with which
  compound each item is for), a **"what this stack runs low on"** nutrient-depletion
  section, the side effects the stack can bring, the full bloodwork checklist,
  every warning, and **combined-risk flags** (e.g. *"two oral 17aa compounds —
  doubling liver toxicity"*). One tap saves it as your protocol.
- 💬 **Ask PepTalk** — a local Q&A brain answers questions offline
  (*"what vitamins on tren?"*, *"labs before a cycle?"*, *"how do I protect my
  liver?"*, *"tell me about semaglutide"*). Add an API key for open-ended Claude
  answers that stay in the harm-reduction framing.
- 🌗 **Light & dark themes**, keyboard-friendly, fully responsive.

![stack planner](preview-stack.png)

## Run it as a website

The app is a static site — no build step, no server code. It is deployed to
GitHub Pages by `.github/workflows/pages.yml` on every push to `main`:

```
https://<owner>.github.io/<repo>/peptalk/
```

To run it locally, any static server will do:

```bash
python3 -m http.server 8000     # then open http://localhost:8000/peptalk/
```

Opening `index.html` straight off disk works too, minus the offline install
(service workers need http/https).

### Installable and offline

`manifest.webmanifest` and `sw.js` make it a PWA: "Add to Home Screen" on iOS
or "Install" on desktop/Android gives it its own icon and window, and the
service worker precaches the whole shell so it runs with **no network at all**
after the first visit — verified by loading it with the network disabled.

Registration is deliberately best-effort (`registerSW()` in `app.js`): it is
skipped on `file://` and a failed registration is swallowed, so the single-file
build and the iOS wrapper are unaffected.

When you change a shell file, bump `CACHE` in `sw.js` so returning visitors get
the new version instead of the cached one.

### Also on the site

- `privacy.html` — the privacy policy as a real page (this doubles as the
  public Privacy Policy URL that App Store Connect requires).
- `og-card.png` — the 1200×630 link-preview image, wired up via Open Graph and
  Twitter card tags.

## The harm-reduction stance

The tool is built on a few non-negotiables, surfaced everywhere:

1. **Bloodwork is non-negotiable** — baseline, on-cycle, and after.
2. **Work with a doctor** — be honest with them.
3. **Source & dose quality** — mis-dosing and contamination are top causes of harm.
4. **Injection hygiene**, **start low / one variable**, **cardio & blood pressure**,
   **have an exit plan (PCT/TRT)**, **mind & mood count**, and **some people just
   shouldn't** (under ~25, pregnant, or with heart/liver/kidney/mental-health
   conditions; women face virilization).

It never encourages or glamorizes use, and never shames — it meets someone where
they are and tries to reduce harm.

## Run it

Self-contained static site — no build step, no dependencies, no external
requests (system fonts, inline SVG):

```bash
# from this folder — pick whichever you have
python3 -m http.server 8000     # then open http://localhost:8000
npx serve .                      # or any static file server
```

Or just open `index.html` directly — everything works from `file://`.

## Optional: connect Claude

Open **Settings** (gear icon), paste an Anthropic API key, Save. Free-form
questions the local brain can't answer confidently route to Claude with
PepTalk's harm-reduction persona and the reference injected as context, so it
stays grounded and in-character. The key lives only in your browser's
`localStorage` and is sent directly to Anthropic from your machine; don't ship a
page with a baked-in key to other users. Without a key, everything above works
fully offline.

## Files

| File | Purpose |
|------|---------|
| `index.html` | App shell — disclaimer bar, grouped nav, library, content area, composer |
| `styles.css` | Clinical, calm design; dark + light themes; accessible labels; charts, timeline & print styling |
| `data.js` | Knowledge base — compounds, supplements, labs, countermeasures, emergency, injection, PCT, women, and **blood-marker reference ranges** |
| `brain.js` | Compound/symptom routing, stack planner, ester-aware protocol timeline, cycle-aware marker evaluation, optional Claude |
| `tracker.js` | localStorage event store (log, export/import), canvas trend chart, injection-site geometry |
| `app.js` | View router, Today/Log/Trends/Sites/Data + My Protocol dashboards, printable sheets, chat, theme |

---

Built as part of this repo's family of self-contained static apps. Educational
harm reduction only — please, get bloodwork and see a doctor.
