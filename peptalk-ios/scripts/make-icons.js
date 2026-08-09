/* Render the master SVG to every PNG size Xcode / App Store Connect wants.
   Chromium is the rasteriser so the output is exactly what a browser shows. */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SVG = fs.readFileSync(path.join(ROOT, "ios-assets/icon.svg"), "utf8");
const OUT = path.join(ROOT, "ios-assets/icons");

// iOS app icon set (points @scale) + the 1024 marketing icon
const SIZES = [
  1024, 180, 167, 152, 144, 128, 120, 114, 100, 87, 80, 76, 72, 60, 58, 57, 50, 40, 29, 20,
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  for (const s of SIZES) {
    const page = await browser.newPage({ viewport: { width: s, height: s }, deviceScaleFactor: 1 });
    await page.setContent(
      `<style>html,body{margin:0;padding:0;background:#0d1117}svg{display:block;width:${s}px;height:${s}px}</style>${SVG}`,
      { waitUntil: "load" }
    );
    await page.screenshot({ path: path.join(OUT, `icon-${s}.png`), omitBackground: false });
    await page.close();
  }
  await browser.close();
  console.log("wrote", SIZES.length, "icons ->", OUT);
})();
