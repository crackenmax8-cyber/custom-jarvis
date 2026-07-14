# SELECTA — House Music DJ Agent

An AI agent built to be a **house music DJ** — a veteran selector with three
decades of crate knowledge you can chat with in the browser. Fully offline by
default, with an optional Claude hookup for open-ended conversation.

## What it knows

SELECTA ships with a structured, built-in knowledge base (`knowledge.js`):

| Domain | Coverage |
|--------|----------|
| **Subgenres** | 17 house styles — Chicago, deep, acid, tech, progressive, French touch, soulful, garage (NY + UK), afro, melodic, organic, funky/jackin', bass, lo-fi, electro, Latin/tribal — each with BPM range, era, origin, sound description, key artists and essential tracks |
| **Legends** | 35+ artist bios, from Frankie Knuckles and Larry Levan to Peggy Gou and Dom Dolla |
| **Labels** | Trax, DJ International, Strictly Rhythm, Defected, Hot Creations, Dirtybird, Innervisions, Keinemusik and more |
| **Technique** | Beatmatching, phrasing/bar counting, EQ mixing & the bass swap, harmonic mixing, filter transitions, loops & hot cues, backspins/echo-outs/tempo jumps, gain staging, acapella layering, headphone cueing, library prep, set building & crowd reading |
| **Harmonic mixing** | The full Camelot wheel with live compatibility math — ask *"what mixes with 8A?"* |
| **Gear** | CDJs, turntables/DVS, battle vs. rotary mixers, software, monitoring, headphones |
| **History** | A timeline from 70s NYC loft culture through the Warehouse, acid house, the French touch, EDM and today's afro/melodic wave |
| **The crate** | 45+ classics tagged with BPM, Camelot key and energy — fuel for the set builder |

## The set builder

Say **"build me a set"** (or *"build me a warm-up deep house set"*, *"make a
peak time tech house playlist"*) and SELECTA routes a multi-track journey
through the crate: each pick is chained by **Camelot key compatibility**,
**small BPM steps** and a **rising (or arcing) energy curve**, with per-transition
notes ("harmonic move", "key jump — use an echo out").

## Try asking

- *"What is deep house?"* · *"Tech house BPM?"*
- *"Who is Larry Heard?"* · *"Tell me about Masters at Work"*
- *"How do I beatmatch?"* · *"Explain the bass swap"*
- *"What mixes with 8A?"* · *"Explain the Camelot wheel"*
- *"History of house"* · *"What happened in 1987?"*
- *"Recommend an afro house track"* · *"Build me a set"*
- *"What mixer should I get?"* · *"Give me a DJ tip"*

## Run it

It's a self-contained static site — no build step, no dependencies:

```bash
# from this folder
python3 -m http.server 8000
#   then open http://localhost:8000

npx serve .          # or any static file server
```

Or just open `index.html` directly — everything works from `file://`.

## Optional: connect Claude

Open **Settings** (gear icon), paste an Anthropic API key, Save. Questions the
local brain can't answer confidently are routed to Claude with SELECTA's DJ
persona and the knowledge base injected as context — so it stays in character
and factually grounded. The key lives only in your browser's `localStorage`
and is sent directly to Anthropic from your machine; don't ship a page with a
baked-in key to other users. Without a key, everything above works fully
offline.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Chat UI markup |
| `styles.css` | Neon club aesthetic, spinning vinyl header |
| `knowledge.js` | The DJ knowledge base (genres, artists, labels, techniques, Camelot wheel, gear, history, crate, tips) |
| `brain.js` | Intent matching, Camelot math, harmonic set builder, optional Claude |
| `app.js` | Chat rendering, composer, quick prompts, settings |
