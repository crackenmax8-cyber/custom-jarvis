# PepTalk for iOS — App Store submission kit

Everything here turns the `peptalk/` web app into a submittable iOS app. The
web app is already fully offline (local storage only, zero network requests),
so it wraps cleanly with no rewrite.

**What you still need, and I can't do for you:** a Mac with Xcode, and an Apple
Developer Program membership (\$99/year). The final archive-and-upload step has
to happen on macOS.

---

## Read this before you spend the \$99

App Review is a real risk for this app, and you should go in with your eyes
open rather than be surprised.

**The rule that matters** is Guideline 1.4.3: apps that *encourage* consumption
of illegal drugs are rejected. Anabolic steroids are Schedule III controlled
substances in the US and controlled in most other markets.

**The argument in your favour** is that PepTalk does the opposite of
encouraging. It never tells anyone to take anything, it says on every screen
that not using is the safest option, it sells nothing and links to no supplier,
it gives no dosing protocols, and its core function is health monitoring that
repeatedly pushes the user toward bloodwork and a doctor. That is the same
public-health logic as needle exchange. Comparable apps do exist on the store —
TRT and cycle-tracking apps, drug-checking and overdose-response apps.

**Realistic expectation:** this can go either way, and it may depend on the
individual reviewer. A first-pass rejection is a normal outcome, not the end —
you can reply in Resolution Center and make the harm-reduction case, and that
often works. The App Review notes in `appstore/metadata.md` are written for
exactly that purpose; use them verbatim.

**Two things that would sink it, so don't do them:** adding any way to buy or
source compounds, and adding dosing protocols that read as instructions.

---

## What's in this kit

| Path | What it is |
|---|---|
| `capacitor.config.json` | App id `com.peptalk.app`, name, dark launch background |
| `scripts/sync-web.js` | Copies `peptalk/` → `www/` and **strips the API-key settings path** so the store build is provably offline |
| `scripts/make-icons.js` | Renders `ios-assets/icon.svg` to all 20 required PNG sizes |
| `scripts/make-screenshots.js` | Real App Store screenshots at Apple's exact pixel sizes, seeded with demo data |
| `ios-assets/icon.svg` + `icons/` | App icon, master and all rendered sizes |
| `ios-assets/Contents.json` | Drop-in asset catalog manifest for `AppIcon.appiconset` |
| `ios-assets/PrivacyInfo.xcprivacy` | Apple's required privacy manifest (declares: collects nothing) |
| `appstore/metadata.md` | Name, subtitle, description, keywords, age rating, **App Review notes** |
| `appstore/privacy-policy.md` | Privacy policy — you must host this and link it |
| `appstore/screenshots/` | 18 screenshots: 6 each at 6.9", 6.7" and 13" iPad |

Screenshot sizes produced (these are the ones App Store Connect requires):

- `iphone-6.9/` — 1320 × 2868
- `iphone-6.7/` — 1290 × 2796
- `ipad-13/` — 2064 × 2752

---

## Build steps (on a Mac)

```bash
cd peptalk-ios

# 1. Install and generate the iOS project
npm install
npm run sync:web          # copies the web app into www/
npx cap add ios           # creates ios/ (first time only)
npm run prepare:ios       # re-sync + cap sync, run this after any web change

# 2. Regenerate assets if you changed the icon or the app UI
npm run icons
npm run shots
```

### Wire up the assets in Xcode

```bash
npx cap open ios
```

1. **Icon** — copy `ios-assets/icons/*.png` and `ios-assets/Contents.json` into
   `ios/App/App/Assets.xcassets/AppIcon.appiconset/`, replacing what's there.
2. **Privacy manifest** — drag `ios-assets/PrivacyInfo.xcprivacy` into
   `ios/App/App/` in Xcode and tick the **App** target when prompted.
3. **Signing** — select the App target → Signing & Capabilities → your team.
   Bundle identifier must match `com.peptalk.app` (or change it in
   `capacitor.config.json` *and* Xcode so they agree).
4. **Deployment target** — iOS 14.0 or later is fine; the app uses nothing exotic.
5. **Orientation** — leave portrait and landscape both enabled; the layout is
   responsive and the iPad screenshots depend on it.
6. **Launch screen** — set the background to `#0d1117` so launch doesn't flash
   white into a dark app.

### Archive and upload

1. Set the run destination to **Any iOS Device (arm64)**.
2. **Product → Archive**.
3. **Distribute App → App Store Connect → Upload**.

---

## App Store Connect

1. Create the app record: platform iOS, name from `appstore/metadata.md`,
   bundle ID `com.peptalk.app`, SKU anything unique (e.g. `peptalk-001`).
2. Paste the description, subtitle, promotional text and keywords from
   `appstore/metadata.md`.
3. Upload the screenshots from `appstore/screenshots/`.
4. Set **Age Rating** using the answers in the metadata file → this must come
   out as **17+**.
5. **App Privacy** → answer **"Data Not Collected"** for everything. This is
   accurate today; it stops being accurate the moment you add any SDK.
6. Host `appstore/privacy-policy.md` publicly and paste the URL in.
7. Paste the **App Review notes** verbatim. This is the highest-leverage field
   in the whole submission for an app like this.
8. Submit.

---

## Keeping the app and the wrapper in sync

The wrapper never diverges from the web app: `scripts/sync-web.js` copies from
`peptalk/` on every build, and it fails loudly if a source file is missing or
if the settings/API path survives the strip. After changing anything in
`peptalk/`, run:

```bash
npm run prepare:ios
```

then archive again and upload a build with a bumped version/build number.

---

## Android, if you want it later

The same Capacitor project covers it: `npx cap add android`. Google Play's
equivalent rule is its Inappropriate Content / dangerous products policy, and
the same harm-reduction framing applies. The icon and screenshot scripts work
unchanged — only the required screenshot sizes differ.

---

## Offline guarantee (why the privacy answers are safe to give)

`scripts/sync-web.js` doesn't just copy files — it removes the optional
Claude/API path from the store build and then **fails the build** if any
`fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon` or `EventSource` survives
in `www/`. So the "Data Not Collected" and "no network requests" answers you
give App Review are verifiable by inspecting the shipped bundle, not just by
assertion.

Verified on the current build: 53 compounds load, search and the offline Ask
brain both work, and the app issues **zero** non-`file://` requests.
