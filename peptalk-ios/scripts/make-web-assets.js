/* Web assets for the hosted site: PWA icons (192/512, plus maskable) and the
   1200x630 social preview card. Same Chromium rasteriser as the iOS icons so
   the mark is identical everywhere. */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const WEB = path.resolve(ROOT, "../peptalk");
const SVG = fs.readFileSync(path.join(ROOT, "ios-assets/icon.svg"), "utf8");

/* maskable icons need the mark inside a safe circle (~80%), so pad it down */
const MASKABLE = SVG.replace(
  '<rect width="1024" height="1024" fill="url(#bg)"/>',
  '<rect width="1024" height="1024" fill="#0d1117"/><g transform="translate(512,512) scale(0.78) translate(-512,-512)"><rect width="1024" height="1024" fill="url(#bg)"/>'
).replace("</svg>", "</g></svg>");

const CARD = `
<div style="width:1200px;height:630px;display:flex;align-items:center;gap:56px;padding:0 76px;box-sizing:border-box;
     background:linear-gradient(135deg,#1e2740 0%,#141b2b 55%,#0d1117 100%);color:#eef2f7;
     font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,system-ui,sans-serif;position:relative;overflow:hidden">
  <div style="position:absolute;left:-120px;top:-160px;width:760px;height:700px;border-radius:50%;
       background:radial-gradient(closest-side,rgba(141,151,255,.34),transparent)"></div>
  <div style="position:absolute;right:-140px;top:-180px;width:640px;height:600px;border-radius:50%;
       background:radial-gradient(closest-side,rgba(69,196,192,.22),transparent)"></div>
  <div style="width:232px;height:232px;flex:none;border-radius:52px;overflow:hidden;position:relative;
       box-shadow:0 24px 60px rgba(0,0,0,.5)">${SVG.replace("<svg ", '<svg style="width:232px;height:232px" ')}</div>
  <div style="position:relative">
    <div style="display:flex;gap:9px;margin-bottom:22px">
      <i style="width:44px;height:5px;border-radius:99px;background:#8d97ff;display:block"></i>
      <i style="width:44px;height:5px;border-radius:99px;background:#45c4c0;display:block"></i>
      <i style="width:44px;height:5px;border-radius:99px;background:#63c48c;display:block"></i>
      <i style="width:44px;height:5px;border-radius:99px;background:#d8a663;display:block"></i>
      <i style="width:44px;height:5px;border-radius:99px;background:#f0906d;display:block"></i>
    </div>
    <div style="font-size:74px;font-weight:800;letter-spacing:-.035em;line-height:1">PepTalk</div>
    <div style="font-size:31px;color:#9aa7b6;margin-top:20px;line-height:1.38;max-width:620px">
      Use safer, or don't use. Harm-reduction reference and cycle tracker —
      supplements, bloodwork and warning signs.
    </div>
    <div style="font-size:21px;color:#66738a;margin-top:26px">Offline · private · not medical advice</div>
  </div>
</div>`;

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const shot = async (html, w, h, out, dsf = 1) => {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dsf });
    await page.setContent(`<style>html,body{margin:0;padding:0;background:#0d1117}</style>${html}`, { waitUntil: "load" });
    await page.screenshot({ path: out });
    await page.close();
  };
  const svgAt = (svg, s) => `<style>svg{display:block;width:${s}px;height:${s}px}</style>${svg}`;

  for (const s of [192, 512]) await shot(svgAt(SVG, s), s, s, path.join(WEB, `icon-${s}.png`));
  for (const s of [192, 512]) await shot(svgAt(MASKABLE, s), s, s, path.join(WEB, `icon-maskable-${s}.png`));
  await shot(svgAt(SVG, 180), 180, 180, path.join(WEB, "apple-touch-icon.png"));
  await shot(CARD, 1200, 630, path.join(WEB, "og-card.png"));
  await browser.close();
  console.log("web assets -> peptalk/: icon-192/512, icon-maskable-192/512, apple-touch-icon, og-card");
})();
