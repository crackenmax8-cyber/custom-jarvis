/* App Store Connect screenshots, rendered from the real app at Apple's exact
   required pixel sizes. Seeded with demo data so the shots show a live cycle. */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const path = require("path"), fs = require("fs");
const WWW = "file://" + path.resolve(__dirname, "../www/index.html");
const OUT = path.resolve(__dirname, "../appstore/screenshots");

// Apple requires 6.9"/6.7" iPhone and 13" iPad; others are derived from these.
const DEVICES = [
  { id: "iphone-6.9", w: 1320, h: 2868, css: { width: 440, height: 956 }, dsf: 3 },
  { id: "iphone-6.7", w: 1290, h: 2796, css: { width: 430, height: 932 }, dsf: 3 },
  { id: "ipad-13",    w: 2064, h: 2752, css: { width: 1032, height: 1376 }, dsf: 2 },
];

const SEED = () => {
  localStorage.clear();
  localStorage.setItem("peptalk.stack", JSON.stringify(["testosterone", "trenbolone", "dianabol", "bpc157"]));
  localStorage.setItem("peptalk.protocol.v1", JSON.stringify({
    items: [{ id: "testosterone", dose: "250 mg/wk", ester: "long" },
            { id: "trenbolone", dose: "200 mg/wk", ester: "short" },
            { id: "dianabol", dose: "30 mg/day", ester: "oral" }],
    start: new Date(Date.now() - 34 * 864e5).toISOString().slice(0, 10), weeks: 12, sex: "m",
  }));
  const days = (n) => new Date(Date.now() - n * 864e5).toISOString();
  const mk = (o) => Object.assign({ id: Math.random().toString(36).slice(2) }, o);
  localStorage.setItem("peptalk.log.v1", JSON.stringify({ version: 1, settings: { units: "metric" }, events: [
    mk({ ts: days(28), type: "metric", metric: "bp", systolic: 124, diastolic: 78 }),
    mk({ ts: days(21), type: "metric", metric: "bp", systolic: 132, diastolic: 84 }),
    mk({ ts: days(14), type: "metric", metric: "bp", systolic: 138, diastolic: 88 }),
    mk({ ts: days(2),  type: "metric", metric: "bp", systolic: 142, diastolic: 90, hr: 74 }),
    mk({ ts: days(27), type: "metric", metric: "weight", value: 82.1, unit: "kg" }),
    mk({ ts: days(13), type: "metric", metric: "weight", value: 84.0, unit: "kg" }),
    mk({ ts: days(3),  type: "metric", metric: "weight", value: 85.6, unit: "kg" }),
    mk({ ts: days(20), type: "labs", panelDate: new Date(Date.now() - 20 * 864e5).toISOString().slice(0,10),
         values: { hematocrit: 47, hdl: 38, ldl: 130, alt: 42 } }),
    mk({ ts: days(6),  type: "labs", panelDate: new Date(Date.now() - 6 * 864e5).toISOString().slice(0,10),
         values: { hematocrit: 53, hdl: 29, ldl: 165, alt: 68 } }),
    mk({ ts: days(3),  type: "injection", compound: "testosterone", site: "ventro_r", dose: "125 mg" }),
  ]}));
};

const SHOTS = [
  { name: "1-today",   hash: "#/today" },
  { name: "2-stack",   hash: "#/stack" },
  { name: "3-builder", hash: "#/builder" },
  { name: "4-trends",  hash: "#/trends" },
  { name: "5-counters",hash: "#/counters" },
  { name: "6-compound",hash: "#/compound/trenbolone" },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  let n = 0;
  for (const d of DEVICES) {
    const dir = path.join(OUT, d.id);
    fs.mkdirSync(dir, { recursive: true });
    const page = await browser.newPage({ viewport: d.css, deviceScaleFactor: d.dsf });
    await page.goto(WWW, { waitUntil: "networkidle" });
    await page.evaluate(SEED);
    for (const s of SHOTS) {
      // the app reads localStorage once at init, so each shot needs a real load
      // (not just a hash change) for the seeded protocol to be picked up
      await page.goto(WWW + s.hash, { waitUntil: "networkidle" });
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(1100);          // let the enter cascade + curve settle
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(150);
      const file = path.join(dir, `${s.name}.png`);
      await page.screenshot({ path: file });
      n++;
    }
    await page.close();
  }
  await browser.close();
  console.log(`wrote ${n} screenshots ->`, OUT);
  DEVICES.forEach((d) => console.log(`  ${d.id}: ${d.w}x${d.h}`));
})();
