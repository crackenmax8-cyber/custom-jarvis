/* Copy the web app into www/ so the wrapper always ships the committed source.
   Everything is local — no network fetches — so the app works fully offline. */
const fs = require("fs"), path = require("path");
const SRC = path.resolve(__dirname, "../../peptalk");
const DST = path.resolve(__dirname, "../www");
const FILES = ["index.html", "styles.css", "data.js", "brain.js", "tracker.js", "app.js"];

fs.mkdirSync(DST, { recursive: true });
for (const f of FILES) {
  const from = path.join(SRC, f);
  if (!fs.existsSync(from)) { console.error("missing source file:", from); process.exit(1); }
  fs.copyFileSync(from, path.join(DST, f));
}
// The Settings modal offers an optional Anthropic API key. Shipping a feature that
// sends data off-device would change the privacy answers below, so it is stripped
// for the store build and the app stays 100% offline.
let html = fs.readFileSync(path.join(DST, "index.html"), "utf8");
const ms = html.indexOf("  <!-- ===== Settings modal ===== -->");
const me = html.indexOf('  <div class="toast"');
if (ms > 0 && me > ms) html = html.slice(0, ms) + html.slice(me);
html = html.replace(/\s*<button class="icon-btn" id="settingsBtn"[^<]*<\/button>/, "");
fs.writeFileSync(path.join(DST, "index.html"), html);

let app = fs.readFileSync(path.join(DST, "app.js"), "utf8");
app = app.replace(/\n\s*initSettings\(\);/, "");
app = app.replace(
  "Ask about a compound, what to take, or what to test. Answers come from the built-in reference; add an API key in Settings for open-ended Claude answers that stay in this harm-reduction framing.",
  "Ask about a compound, what to take, or what to test. Answers come from the built-in reference and work entirely offline."
);
fs.writeFileSync(path.join(DST, "app.js"), app);

if (/initSettings\(\)/.test(app.replace(/function initSettings[\s\S]*?\n  }/, ""))) {
  console.error("initSettings still invoked — offline guarantee not met"); process.exit(1);
}

// Remove the optional Claude call entirely. The settings UI is already gone, so
// the path is unreachable — but shipping live network code while declaring
// "Data Not Collected" and "no network requests" to App Review is a claim we
// should be able to prove by inspection of the binary, not by argument.
let brain = fs.readFileSync(path.join(DST, "brain.js"), "utf8");
const start = brain.indexOf("  async function answerClaude(");
if (start < 0) { console.error("answerClaude not found — did brain.js change?"); process.exit(1); }
const endMarker = "\n  /* --- personal protocol";
const end = brain.indexOf(endMarker, start);
if (end < 0) { console.error("could not find the end of answerClaude"); process.exit(1); }
brain = brain.slice(0, start) +
  "  // answerClaude() is stripped from the App Store build: this app makes no\n" +
  "  // network requests of any kind. The offline answer engine is the only path.\n" +
  "  async function answerClaude() {\n" +
  "    throw new Error(\"Online answers are not available in this build.\");\n" +
  "  }\n" +
  brain.slice(end + 1);
fs.writeFileSync(path.join(DST, "brain.js"), brain);

// Hard gate: nothing in the shipped bundle may reach the network.
const NET = /\bfetch\s*\(|XMLHttpRequest|new\s+WebSocket|sendBeacon|EventSource/;
for (const f of ["app.js", "brain.js", "tracker.js", "data.js", "index.html"]) {
  const body = fs.readFileSync(path.join(DST, f), "utf8");
  if (NET.test(body)) {
    console.error(`network call still present in www/${f} — offline guarantee not met`);
    process.exit(1);
  }
}
console.log("synced", FILES.length, "files -> www/ (settings/API path stripped: offline only)");
