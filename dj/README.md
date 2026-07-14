# MixIt — Your House Music DJ

An AI agent built to be a **house music DJ** — a veteran selector with three
decades of crate knowledge you can chat with in the browser. Fully offline by
default, with an optional Claude hookup for open-ended conversation.

## The live deck 🔊

MixIt doesn't just talk about house — it **plays** it. A built-in Web Audio
beat engine (`audio.js`) synthesizes a live groove from scratch: 909-style
kick, noise-burst hats and claps, a resonant sawtooth bassline and detuned
chord stabs — no samples, no network. Four presets voice the main strains:

| Preset | Style | Default BPM |
|--------|-------|-------------|
| CHI | Jacking Chicago — piano stabs, offbeat hats | 124 |
| DEEP | Warm, subby, patient — sustained minor-7 pads | 121 |
| TECH | Rolling and driving — 16th-note hats | 127 |
| ACID | 303 worship — one riff, big resonance sweep | 126 |

Hit the spinning record (or the ▶ transport), or just tell MixIt:
*"drop a beat"*, *"play some acid at 128"*, *"stop"*. The tempo nudgers run
112–135 BPM.

## The interactive Camelot wheel 🎡

Open the wheel (🎹 button, or say *"show me the Camelot wheel"*) and tap any
key — compatible mixes light up live: same-key and ±1 neighbours solid, the
relative major/minor across the ring, and the +2 "energy boost" dashed.

## Quiz mode 🧠

Say *"quiz me"* for a 5-question round of house trivia — tempo ranges, who
made what, release years, relative keys, genre origins — with scoring and a
verdict at the end.

## Spoken replies 🔈

Toggle the speaker button and MixIt reads its answers aloud via the browser's
speech synthesis (off by default).

## What it knows

MixIt ships with a structured, built-in knowledge base (`knowledge.js`):

| Domain | Coverage |
|--------|----------|
| **Subgenres** | 17 house styles — Chicago, deep, acid, tech, progressive, French touch, soulful, garage (NY + UK), afro, melodic, organic, funky/jackin', bass, lo-fi, electro, Latin/tribal — each with BPM range, era, origin, sound description, key artists and essential tracks |
| **Legends** | 35+ artist bios, from Frankie Knuckles and Larry Levan to Peggy Gou and Dom Dolla |
| **Labels** | Trax, DJ International, Strictly Rhythm, Defected, Hot Creations, Dirtybird, Innervisions, Keinemusik and more |
| **Technique** | Beatmatching, phrasing/bar counting, EQ mixing & the bass swap, harmonic mixing, filter transitions, loops & hot cues, backspins/echo-outs/tempo jumps, gain staging, acapella layering, headphone cueing, library prep, set building & crowd reading |
| **Harmonic mixing** | The full Camelot wheel with live compatibility math — ask *"what mixes with 8A?"* |
| **Gear** | CDJs, turntables/DVS, battle vs. rotary mixers, software, monitoring, headphones |
| **History** | A timeline from 70s NYC loft culture through the Warehouse, acid house, the French touch, EDM and today's afro/melodic wave |
| **The crate** | 55+ classics tagged with BPM, Camelot key and energy — fuel for the set builder |

## The set builder

Say **"build me a set"** (or *"build me a warm-up deep house set"*, *"make a
peak time tech house playlist"*) and MixIt routes a multi-track journey
through the crate: each pick is chained by **Camelot key compatibility**,
**small BPM steps** and a **rising (or arcing) energy curve**, with per-transition
notes ("harmonic move", "key jump — use an echo out").

## Try asking

- *"Drop a beat"* · *"Play some deep house at 122"* · *"Stop"*
- *"What is deep house?"* · *"Tech house BPM?"*
- *"Who is Larry Heard?"* · *"Tell me about Masters at Work"*
- *"How do I beatmatch?"* · *"Explain the bass swap"*
- *"What mixes with 8A?"* · *"Show me the Camelot wheel"*
- *"History of house"* · *"What happened in 1987?"*
- *"Recommend an afro house track"* · *"Build me a set"*
- *"Quiz me"* · *"What mixer should I get?"* · *"Give me a DJ tip"*

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
local brain can't answer confidently are routed to Claude with MixIt's DJ
persona and the knowledge base injected as context — so it stays in character
and factually grounded. The key lives only in your browser's `localStorage`
and is sent directly to Anthropic from your machine; don't ship a page with a
baked-in key to other users. Without a key, everything above works fully
offline.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Chat UI markup, deck transport, Camelot wheel modal |
| `styles.css` | Club aesthetic (dark + light themes), track cards, wheel, transport |
| `knowledge.js` | The DJ knowledge base (genres, artists, labels, techniques, Camelot wheel, gear, history, crate, tips) |
| `audio.js` | Web Audio beat engine — synthesized kick/hats/clap/bass/chords, 4 presets |
| `brain.js` | Intent matching, Camelot math, harmonic set builder, quiz mode, optional Claude |
| `app.js` | Chat rendering, deck controls, interactive wheel, voice output, settings |
