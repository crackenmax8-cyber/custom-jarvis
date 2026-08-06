/* ============================================================================
   PepTalk — harm-reduction knowledge base
   ----------------------------------------------------------------------------
   Educational, harm-reduction reference for people who are going to use
   anabolic-androgenic steroids (AAS) or performance/therapeutic peptides.
   It is NOT medical advice and NOT an endorsement to use anything. The single
   most important message on every screen: get baseline & on-cycle bloodwork,
   and work with a doctor.

   Doses shown are "commonly reported" ranges from harm-reduction communities,
   included so a person can gauge whether what they're doing is wildly off — not
   prescriptions. Real dosing depends on your labs, body, and physician.
   ========================================================================== */

const PT = {};

/* ---- The line that never leaves the screen ---------------------------- */
PT.disclaimer =
  "PepTalk is educational harm-reduction information, not medical advice. " +
  "These substances carry real, sometimes permanent risks. Nothing here is an " +
  "endorsement to use them. Get baseline bloodwork before, monitor on-cycle, " +
  "and work with a licensed doctor. If you can choose not to use, that is " +
  "always the safest option.";

/* ============================================================================
   SUPPLEMENTS — the "what to take so you're not deficient / less damaged" list
   ========================================================================== */
PT.supplements = {
  omega3: {
    name: "Omega-3 (fish oil, EPA/DHA)",
    what: "Marine fatty acids EPA + DHA.",
    why: "Almost every AAS pushes LDL up and HDL down and raises blood pressure. Omega-3s blunt the lipid and BP damage and lower inflammation. The single most-recommended on-cycle supplement.",
    dose: "~2–4 g combined EPA+DHA daily, with food.",
    caution: "High doses thin the blood a little — relevant if you're already raising hematocrit or take other blood thinners.",
    tags: ["lipids", "heart", "blood pressure"],
  },
  vitd3k2: {
    name: "Vitamin D3 + K2",
    what: "D3 (cholecalciferol) paired with K2 (MK-7).",
    why: "Vitamin D behaves like a hormone and supports natural testosterone, mood, immune and bone health — many lifters are deficient. K2 helps steer calcium into bone instead of arteries, which matters when AAS are already stressing your vessels.",
    dose: "D3 ~2,000–5,000 IU/day (dose to a blood level of ~40–60 ng/mL); K2 ~100–200 mcg.",
    caution: "Get 25-OH vitamin D tested rather than guessing — too much D is also a problem.",
    tags: ["hormones", "bone", "heart"],
  },
  magnesium: {
    name: "Magnesium",
    what: "Glycinate or citrate forms absorb best.",
    why: "Hard training and heavy sweating deplete magnesium; low magnesium worsens cramps, blood pressure, insulin resistance and sleep — all things cycles already push on.",
    dose: "~200–400 mg elemental in the evening.",
    caution: "Citrate/oxide can loosen stools; glycinate is gentler.",
    tags: ["cramps", "sleep", "blood pressure"],
  },
  zinc: {
    name: "Zinc",
    what: "Trace mineral (picolinate/citrate).",
    why: "Lost heavily through sweat and central to testosterone production and immune function — commonly low in athletes.",
    dose: "~15–30 mg/day with food.",
    caution: "Chronic high zinc depletes copper — don't megadose; a 10–15:1 zinc:copper ratio is sensible long-term.",
    tags: ["hormones", "immune"],
  },
  taurine: {
    name: "Taurine",
    what: "Amino acid.",
    why: "Creatine and several compounds (notably trenbolone and stanozolol) trigger brutal muscle cramps; taurine reliably eases them and supports heart and blood-pressure health.",
    dose: "~2–5 g/day, more around training.",
    caution: "Very well tolerated.",
    tags: ["cramps", "heart"],
  },
  tudca: {
    name: "TUDCA",
    what: "Tauroursodeoxycholic acid — a bile acid.",
    why: "Oral 17-alpha-alkylated steroids back up bile flow and stress the liver. TUDCA is the community's go-to for keeping bile moving and protecting liver cells during oral cycles.",
    dose: "~500–1,000 mg/day while running an oral.",
    caution: "Supportive, not a shield — it does not make a hepatotoxic oral safe. Keep orals short and dosed low, and still check liver enzymes.",
    tags: ["liver"],
  },
  nac: {
    name: "NAC (N-acetylcysteine)",
    what: "Precursor to glutathione, the body's master antioxidant.",
    why: "Backs up the liver and kidneys under the oxidative load of a cycle; also studied for blood pressure and lung/mucus.",
    dose: "~600–1,200 mg/day.",
    caution: "Can upset an empty stomach.",
    tags: ["liver", "kidney"],
  },
  coq10: {
    name: "CoQ10 (ubiquinol)",
    what: "Mitochondrial coenzyme.",
    why: "Supports heart-muscle energy and blood pressure — worth it when AAS are straining the cardiovascular system, and essential if you're ever put on a statin (statins deplete CoQ10).",
    dose: "~100–200 mg/day with fat.",
    caution: "Ubiquinol form absorbs better than ubiquinone.",
    tags: ["heart", "blood pressure"],
  },
  bergamot: {
    name: "Citrus bergamot",
    what: "Polyphenol extract from bergamot orange.",
    why: "One of the few supplements with human data for nudging LDL down and HDL up — directly targets the lipid wreckage AAS cause, especially orals.",
    dose: "~500–1,000 mg/day (standardized extract).",
    caution: "Supports diet and cardio; it isn't a licence to run harsh orals.",
    tags: ["lipids"],
  },
  fiber: {
    name: "Psyllium / soluble fiber",
    what: "Viscous soluble fiber.",
    why: "Binds cholesterol in the gut and helps blunt the lipid hit; also steadies blood sugar and digestion.",
    dose: "~5–10 g/day with plenty of water.",
    caution: "Ramp up slowly and hydrate or it backfires.",
    tags: ["lipids", "gut"],
  },
  citrulline: {
    name: "L-Citrulline + hydration",
    what: "Nitric-oxide precursor amino acid, plus simply drinking enough water.",
    why: "Supports vasodilation and healthy blood pressure. Staying well hydrated also matters a lot when a compound is thickening your blood (raising hematocrit).",
    dose: "~6–8 g citrulline; water to pale-yellow urine.",
    caution: "Not a substitute for treating genuinely high blood pressure.",
    tags: ["blood pressure", "heart"],
  },
  electrolytes: {
    name: "Electrolytes (Na/K/Mg)",
    what: "Sodium, potassium, magnesium — from food or a supplement.",
    why: "Cutting compounds, GLP-1 appetite loss and heavy sweating drain electrolytes, causing cramps, dizziness and headaches. Keep them topped up.",
    dose: "Match to sweat and diet; potassium-rich foods help.",
    caution: "People with kidney or heart conditions should be careful with potassium — ask a doctor.",
    tags: ["cramps", "hydration"],
  },
  vitc: {
    name: "Vitamin C + antioxidants",
    what: "Ascorbic acid and dietary antioxidants.",
    why: "General support for vessels and recovery under the oxidative stress of a cycle.",
    dose: "~500 mg/day, or just eat fruit and vegetables.",
    caution: "Very high doses can affect iron absorption and some lab tests.",
    tags: ["heart", "recovery"],
  },
  multivit: {
    name: "Multivitamin + adequate diet",
    what: "A broad-spectrum multi plus real food.",
    why: "Insurance against micronutrient gaps — especially important when appetite drops (GLP-1s, some peptides) or a hard cut shrinks food variety.",
    dose: "One daily; prioritize whole-food nutrition first.",
    caution: "A multi doesn't replace protein, calories or fiber.",
    tags: ["general"],
  },
  b12: {
    name: "B12 + B-complex",
    what: "B vitamins, B12 in particular.",
    why: "Matters most when you're eating far less than usual (GLP-1 weight-loss peptides) and can fall short on B12, folate and other B vitamins.",
    dose: "Standard B-complex; test B12 if eating very little.",
    caution: "Water-soluble; excess is mostly excreted.",
    tags: ["general", "nerves"],
  },
  protein: {
    name: "Protein + resistance training",
    what: "Adequate dietary protein plus lifting.",
    why: "GLP-1s and aggressive cuts strip muscle along with fat. High protein (~1.6–2.2 g/kg) and continued resistance training are what actually preserve lean mass.",
    dose: "~1.6–2.2 g protein per kg bodyweight daily.",
    caution: "Very high protein plus dehydration and high hematocrit adds to kidney load — drink water, get eGFR checked.",
    tags: ["muscle", "general"],
  },
};

/* ============================================================================
   LABS — the bloodwork / monitoring that turns guessing into managing
   ========================================================================== */
PT.labs = {
  lipids: {
    name: "Lipid panel (+ ApoB)",
    markers: "HDL, LDL, triglycerides, ideally ApoB",
    why: "AAS — orals worst — can flatten HDL and spike LDL/ApoB within weeks, the core driver of long-term heart risk.",
    when: "Baseline, ~4–6 weeks in, and after.",
  },
  cbc: {
    name: "CBC (hematocrit / hemoglobin)",
    markers: "Hematocrit, hemoglobin, RBC",
    why: "Testosterone, boldenone and others thicken the blood; high hematocrit raises clot and stroke risk. Watch it and donate blood / get a phlebotomy if it climbs too high.",
    when: "Baseline, every 8–12 weeks on cycle.",
  },
  liver: {
    name: "Liver panel (LFTs)",
    markers: "AST, ALT, GGT, bilirubin",
    why: "Oral 17aa steroids are hepatotoxic. (Note: hard training alone raises AST/ALT — GGT is the more steroid-specific flag.)",
    when: "Baseline, mid-cycle for any oral, and after.",
  },
  kidney: {
    name: "Kidney function",
    markers: "eGFR, creatinine, BUN, cystatin C",
    why: "High blood pressure, high hematocrit and high protein all load the kidneys. Creatinine reads high in muscular people, so cystatin C is a truer marker.",
    when: "Baseline and periodically.",
  },
  hormones: {
    name: "Hormone panel",
    markers: "Total & free testosterone, estradiol (sensitive assay), SHBG, LH, FSH, prolactin",
    why: "Shows suppression, whether estrogen is managed (not crushed), and prolactin issues from 19-nor compounds — the levers behind side effects and recovery.",
    when: "Baseline, on-cycle to tune, and during PCT.",
  },
  glucose: {
    name: "Glucose / insulin",
    markers: "Fasting glucose, HbA1c, fasting insulin",
    why: "Growth hormone, MK-677 and — obviously — insulin move blood sugar and insulin sensitivity. Essential to monitor with any of those.",
    when: "Baseline; regularly with GH/MK-677/insulin.",
  },
  igf1: {
    name: "IGF-1",
    markers: "IGF-1",
    why: "The downstream readout of growth-hormone dosing — how you confirm a GH or secretagogue protocol is in a sane range rather than overdosed.",
    when: "Baseline and while dosing GH/secretagogues.",
  },
  psa: {
    name: "PSA + prostate",
    markers: "PSA",
    why: "Androgens can stimulate prostate tissue; a baseline and trend matter, particularly over ~40.",
    when: "Baseline, then per your doctor.",
  },
  thyroid: {
    name: "Thyroid panel",
    markers: "TSH, free T4, free T3",
    why: "Useful baseline; relevant if you feel off, are dieting hard, or ever consider thyroid hormones (which carry their own real risks).",
    when: "Baseline; if symptomatic.",
  },
  b12: {
    name: "Nutrient markers",
    markers: "B12, folate, ferritin/iron, vitamin D",
    why: "Eating far less — GLP-1 appetite loss or a hard cut — can quietly drop B12, iron and vitamin D. Worth checking when intake is very low.",
    when: "Baseline, and if you've been eating very little for a while.",
  },
  bp: {
    name: "Blood pressure (home cuff)",
    markers: "Systolic / diastolic",
    why: "Not a blood test but the cheapest, most important monitor you own. Most AAS raise BP; untreated high BP quietly damages heart, kidney and brain.",
    when: "Regularly — buy a cuff and actually use it.",
  },
};

/* ============================================================================
   UNIVERSAL HARM-REDUCTION PRINCIPLES
   ========================================================================== */
PT.principles = [
  { icon: "🩸", title: "Bloodwork is non-negotiable",
    body: "Baseline before, monitor during, re-check after. Without labs you're flying blind — labs turn damage you can't feel (lipids, hematocrit, liver) into something you can manage or stop." },
  { icon: "🩺", title: "Work with a doctor",
    body: "A supportive physician (or a TRT/men's-health clinic) beats forum guesses. Be honest with them — they can only keep you safe if they know what you're actually taking." },
  { icon: "🧪", title: "Source & dose quality",
    body: "Underground product is often mis-dosed, under-dosed or contaminated. If you can test it, test it. Wrong dose is a top cause of avoidable harm." },
  { icon: "💉", title: "Injection hygiene",
    body: "Sterile, single-use needles; clean the vial top and the site; rotate injection sites; never share equipment. Infections and abscesses put people in hospital." },
  { icon: "🐢", title: "One variable, start low",
    body: "Change one compound at a time and start at the low end. You can always add; you can't un-take a dose. Stacking several harsh compounds multiplies risk, it doesn't add it." },
  { icon: "❤️", title: "Cardio & blood pressure",
    body: "The heart takes the biggest long-term hit. Keep doing real cardio, own a blood-pressure cuff, and treat high BP — don't wait for symptoms." },
  { icon: "🔁", title: "Have an exit plan (PCT / TRT)",
    body: "AAS shut down your own testosterone. Know before you start whether you'll restart production with a proper PCT or accept lifelong TRT — decide it deliberately, not by accident." },
  { icon: "🧠", title: "Mind & mood count",
    body: "Some compounds (trenbolone especially) wreck sleep, mood and mental health. If you feel unwell mentally, that's a real side effect — lower or stop, and get support." },
  { icon: "🚫", title: "Some people just shouldn't",
    body: "Under ~25 (brain and growth-plate development), pregnant, or with heart/liver/kidney/mental-health conditions — the risk/reward is far worse. Women face virilization, some of it permanent." },
];

/* ============================================================================
   COMPOUNDS
   Each: id, name, aka, klass, group, route, severity, summary,
         risks[], depletes (nutrient/why note), support[{id,note}], labs[], warnings[]
   severity: 'severe' | 'high' | 'moderate'
   ========================================================================== */
PT.compounds = [
  /* ---------------- Injectable anabolic steroids -------------------------- */
  {
    id: "testosterone", name: "Testosterone", aka: "Test (E/C/P, Sustanon)",
    klass: "Anabolic steroid", group: "Injectable", route: "Injection",
    severity: "high",
    summary: "The base of nearly every cycle and the same molecule used in medical TRT. Better understood and more manageable than most — but it still aromatizes to estrogen, thickens the blood and suppresses your own production.",
    risks: [
      "Aromatizes to estrogen — high E2 brings water retention, high BP, gynecomastia; but crushing E2 with an aromatase inhibitor is its own harm (joints, lipids, libido, bone).",
      "Raises hematocrit — thicker blood, higher clot/stroke risk.",
      "Shuts down natural testosterone and fertility while on.",
      "Can worsen lipids and blood pressure; DHT conversion drives hair loss and prostate effects.",
    ],
    depletes: "Not a classic vitamin-depleter, but the cardiovascular strain means the heart-and-lipid support stack matters. Vitamin D and zinc underpin healthy androgen function generally.",
    support: [
      { id: "omega3", note: "Front-line for the lipid and BP impact." },
      { id: "vitd3k2", note: "Hormonal and arterial support." },
      { id: "coq10", note: "Heart support under cardiovascular load." },
      { id: "citrulline", note: "Blood-pressure and hydration support — especially if hematocrit climbs." },
      { id: "zinc", note: "Supports androgen function; replaces sweat losses." },
    ],
    labs: ["hormones", "cbc", "lipids", "bp", "psa"],
    warnings: [
      "Manage estradiol — don't crush it to zero. Aim to keep E2 in a healthy range, not eliminate it.",
      "If hematocrit climbs above ~52–54%, hydrate and discuss donating blood / therapeutic phlebotomy with a doctor.",
    ],
  },
  {
    id: "nandrolone", name: "Nandrolone", aka: "Deca-Durabolin, NPP, 'Deca'",
    klass: "Anabolic steroid", group: "Injectable", route: "Injection",
    severity: "high",
    summary: "A 19-nor known for joint comfort and steady mass, but it's a progestin — the prolactin and low-DHT effects behind 'deca dick' (sexual dysfunction) are the classic problem, and its long ester lingers for weeks.",
    risks: [
      "Progestogenic — raises prolactin; sexual dysfunction and mood effects are common.",
      "Needs some testosterone/DHT alongside it for sexual function; running it without enough androgen is a frequent mistake.",
      "Strong, long-lasting suppression of natural testosterone.",
      "Can raise blood pressure and worsen lipids.",
    ],
    depletes: "No single classic vitamin depletion; support is aimed at prolactin, mood and the cardiovascular/lipid load.",
    support: [
      { id: "vitd3k2", note: "Vitamin B6 (P5P) at ~100–200 mg is also used to help manage prolactin — get labs first." },
      { id: "omega3", note: "Lipid and mood support." },
      { id: "coq10", note: "Cardiovascular support." },
      { id: "magnesium", note: "Sleep and mood support." },
    ],
    labs: ["hormones", "lipids", "cbc", "bp"],
    warnings: [
      "Prolactin matters here — test it; some use P5P or, under medical guidance, cabergoline. Cabergoline is a real drug with real side effects, not a casual supplement.",
      "The long ester means side effects fade slowly — you can't quickly 'get out' if things go wrong.",
    ],
  },
  {
    id: "trenbolone", name: "Trenbolone", aka: "Tren (Ace/Enanthate)",
    klass: "Anabolic steroid", group: "Injectable", route: "Injection",
    severity: "severe",
    summary: "Extremely potent and extremely harsh. Widely considered an advanced-only compound — the cardiovascular, kidney, sleep and mental-health toll is heavy and, for many people, not worth it. Most harm-reduction voices say beginners should skip it entirely.",
    risks: [
      "Severe cardiovascular strain and lipid damage; raises blood pressure hard.",
      "Insomnia, night sweats, anxiety, aggression, low mood — mental-health effects are common and real.",
      "Progestogenic/prolactin effects; sexual dysfunction.",
      "Notable kidney stress (often dark urine); harsh on the whole system.",
    ],
    depletes: "Not a vitamin-depleter per se, but the cramps, cardiovascular strain and kidney load define the support stack. Extra hydration is essential.",
    support: [
      { id: "taurine", note: "For the classic tren cramps (~5 g/day)." },
      { id: "citrulline", note: "Hydration and blood-pressure support; drink a lot of water for the kidneys." },
      { id: "omega3", note: "Lipid, BP and mood support — dose it high here." },
      { id: "coq10", note: "Cardiovascular support." },
      { id: "magnesium", note: "For sleep and cramps — sleep is often wrecked." },
      { id: "nac", note: "Kidney and liver antioxidant support." },
    ],
    labs: ["lipids", "cbc", "kidney", "hormones", "bp"],
    warnings: [
      "If your mental health slides — anxiety, rage, depression, no sleep — that's the drug. Lower the dose or come off; this is not something to push through.",
      "Not a beginner compound. Never a first cycle. Keep doses and duration modest even if experienced.",
    ],
  },
  {
    id: "boldenone", name: "Boldenone", aka: "Equipoise, EQ",
    klass: "Anabolic steroid", group: "Injectable", route: "Injection",
    severity: "high",
    summary: "A slow, lean-mass compound whose signature problem is a big rise in red blood cells — and an anxiety/restlessness some people get badly. The long ester means you commit for months.",
    risks: [
      "Pronounced increase in hematocrit/RBC — the main watch-point; clot and stroke risk.",
      "Anxiety and restlessness in some users.",
      "Mild aromatization; suppresses natural production.",
      "Very long-acting — side effects clear slowly.",
    ],
    depletes: "Support centered on blood viscosity and cardiovascular health rather than a vitamin gap.",
    support: [
      { id: "citrulline", note: "Hydration and BP — keep blood volume up as hematocrit rises." },
      { id: "omega3", note: "Blood-viscosity and lipid support." },
      { id: "coq10", note: "Cardiovascular support." },
      { id: "magnesium", note: "May ease the anxiety/restlessness some feel." },
    ],
    labs: ["cbc", "bp", "lipids", "hormones"],
    warnings: [
      "Check hematocrit often — EQ is a leading cause of dangerously high hematocrit. Be ready to donate blood.",
      "If anxiety spikes badly, this compound may simply not suit you.",
    ],
  },
  {
    id: "masteron", name: "Masteron", aka: "Drostanolone",
    klass: "Anabolic steroid", group: "Injectable", route: "Injection",
    severity: "moderate",
    summary: "A DHT-derived 'finishing' compound that doesn't aromatize. Relatively mild on the liver, but hard on the scalp and lipids, and only really does much at low body-fat.",
    risks: [
      "Accelerates male-pattern hair loss (strong DHT).",
      "Suppresses HDL / worsens lipids.",
      "Mild anti-estrogen effect can push E2 too low when stacked.",
      "Suppresses natural production.",
    ],
    depletes: "Lipid-focused support; no notable vitamin depletion.",
    support: [
      { id: "omega3", note: "Lipid support." },
      { id: "bergamot", note: "Helps counter the HDL suppression." },
      { id: "vitd3k2", note: "General hormonal and vascular support." },
    ],
    labs: ["lipids", "hormones", "bp"],
    warnings: [
      "If you're prone to hair loss, Masteron will likely accelerate it.",
      "Watch that it doesn't drive combined estrogen too low — joints, mood and libido suffer.",
    ],
  },
  {
    id: "primobolan", name: "Primobolan", aka: "Methenolone",
    klass: "Anabolic steroid", group: "Injectable", route: "Injection",
    severity: "moderate",
    summary: "Reputed as one of the 'milder' injectables — no aromatization, gentle on the liver. Still fully suppressive, still hard on lipids, and frequently counterfeited because it's expensive.",
    risks: [
      "Suppresses natural testosterone like any AAS.",
      "Negative lipid impact (mild-to-moderate).",
      "Mild DHT-type effects (hair, skin).",
      "Very commonly faked — you may not be getting what you paid for.",
    ],
    depletes: "Lipid/cardiovascular support; no specific vitamin depletion.",
    support: [
      { id: "omega3", note: "Lipid support." },
      { id: "vitd3k2", note: "Hormonal and vascular support." },
      { id: "bergamot", note: "Lipid support if HDL drops." },
    ],
    labs: ["lipids", "hormones", "cbc", "bp"],
    warnings: [
      "'Mild' does not mean 'safe' — it still shuts you down and needs the same monitoring.",
      "Counterfeits are rampant; test product if you can.",
    ],
  },

  /* ---------------- Oral (17aa) anabolic steroids ------------------------- */
  {
    id: "dianabol", name: "Dianabol", aka: "Methandrostenolone, D-bol",
    klass: "Anabolic steroid", group: "Oral (17aa)", route: "Oral",
    severity: "high",
    summary: "A classic fast-acting oral for size and strength — and a textbook 17aa: liver-stressing, aromatizing, water-retaining and rough on blood pressure. Best kept short and low.",
    risks: [
      "Hepatotoxic (17-alpha-alkylated) — liver stress.",
      "Aromatizes strongly — water retention, high blood pressure, gyno risk.",
      "Harsh on lipids.",
      "Suppressive.",
    ],
    depletes: "Bile flow and liver-cell load are the issue — hence the liver stack — plus the general lipid/BP hit.",
    support: [
      { id: "tudca", note: "Bile-flow / liver support for the duration of the oral." },
      { id: "nac", note: "Additional liver antioxidant support." },
      { id: "omega3", note: "Lipid and BP support (dose high)." },
      { id: "bergamot", note: "Counter the lipid hit." },
      { id: "citrulline", note: "Blood-pressure and water-retention management." },
    ],
    labs: ["liver", "lipids", "bp", "hormones", "cbc"],
    warnings: [
      "Keep it short (many limit orals to ~4–6 weeks) and don't drink alcohol on it.",
      "Never stack two 17aa orals at once — that's doubling liver toxicity.",
    ],
  },
  {
    id: "anadrol", name: "Anadrol", aka: "Oxymetholone, A-drol",
    klass: "Anabolic steroid", group: "Oral (17aa)", route: "Oral",
    severity: "severe",
    summary: "One of the strongest oral mass builders and one of the harshest — heavy on the liver, brutal on blood pressure, and it causes estrogenic effects without even aromatizing. An advanced compound.",
    risks: [
      "Strongly hepatotoxic.",
      "Big blood-pressure spikes and water retention.",
      "Estrogen-like effects (gyno, bloat) despite not aromatizing — hard to control with a standard AI.",
      "Can cause lethargy and appetite loss.",
    ],
    depletes: "Liver load dominates; also severe lipid and BP stress.",
    support: [
      { id: "tudca", note: "Liver support — essential while dosing." },
      { id: "nac", note: "Extra liver antioxidant support." },
      { id: "omega3", note: "Lipid and BP support." },
      { id: "citrulline", note: "Help manage the blood-pressure surge." },
      { id: "bergamot", note: "Lipid support." },
    ],
    labs: ["liver", "bp", "lipids", "cbc", "hormones"],
    warnings: [
      "Blood pressure can climb fast — monitor it closely and be ready to stop.",
      "Short runs, low doses, no other oral alongside. Not for beginners.",
    ],
  },
  {
    id: "winstrol", name: "Winstrol", aka: "Stanozolol, Winny",
    klass: "Anabolic steroid", group: "Oral (17aa)", route: "Oral/Injection",
    severity: "high",
    summary: "A DHT-derived drying compound popular for cuts. Its trademark problems are painfully dry joints and some of the worst lipid profiles of any steroid, plus real liver toxicity.",
    risks: [
      "Hepatotoxic even injected (it's still 17aa).",
      "Severe HDL suppression — arguably the worst lipids of the common compounds.",
      "Dries out joints and tendons — pain and higher injury risk.",
      "Strong DHT effects (hair loss).",
    ],
    depletes: "Joint lubrication and healthy lipids are what suffer most.",
    support: [
      { id: "omega3", note: "Doubles as joint and lipid support — very important here." },
      { id: "bergamot", note: "For the heavy HDL suppression." },
      { id: "tudca", note: "Liver support." },
      { id: "citrulline", note: "Hydration to ease dry joints." },
    ],
    labs: ["lipids", "liver", "bp", "hormones"],
    warnings: [
      "Dry, achy joints mean higher tear risk — don't chase heavy PRs on Winstrol.",
      "The lipid damage is serious; keep runs short and get a mid-cycle lipid panel.",
    ],
  },
  {
    id: "anavar", name: "Anavar", aka: "Oxandrolone, Var",
    klass: "Anabolic steroid", group: "Oral (17aa)", route: "Oral",
    severity: "moderate",
    summary: "Often called the 'mildest' oral and one of the few used (cautiously) with women. Milder ≠ harmless — it still suppresses lipids hard and shuts down natural production, and it's among the most-counterfeited compounds.",
    risks: [
      "Suppresses HDL significantly despite being 'mild'.",
      "Milder liver load than most orals, but not zero.",
      "Still suppresses natural testosterone.",
      "Heavily faked (often actually Winstrol or Dianabol in the capsule).",
    ],
    depletes: "Lipids are the main casualty.",
    support: [
      { id: "omega3", note: "Lipid support." },
      { id: "bergamot", note: "Counter the HDL drop." },
      { id: "tudca", note: "Light liver support." },
    ],
    labs: ["lipids", "hormones", "liver", "bp"],
    warnings: [
      "Don't let 'mild' fool you — get lipids checked; HDL can crater.",
      "Because it's so faked, unexpected sides may mean it isn't actually Anavar.",
    ],
  },
  {
    id: "superdrol", name: "Superdrol", aka: "Methasterone",
    klass: "Anabolic steroid", group: "Oral (17aa)", route: "Oral",
    severity: "severe",
    summary: "A very potent oral once sold as a 'prohormone' — and one of the most liver-toxic and lipid-wrecking compounds out there, often with heavy lethargy. High risk for the size it adds.",
    risks: [
      "Severely hepatotoxic — cases of real liver injury reported.",
      "Devastates lipids; raises blood pressure.",
      "Marked lethargy and loss of appetite.",
      "Suppressive.",
    ],
    depletes: "Liver and lipids take the brunt.",
    support: [
      { id: "tudca", note: "Liver support — essential, but does not make it safe." },
      { id: "nac", note: "Extra liver antioxidant support." },
      { id: "omega3", note: "Aggressive lipid support." },
      { id: "bergamot", note: "Lipid support." },
    ],
    labs: ["liver", "lipids", "bp", "hormones"],
    warnings: [
      "Any yellowing of skin/eyes, dark urine or right-side abdominal pain — stop immediately and see a doctor.",
      "Very short runs only; many harm-reduction voices say skip it altogether.",
    ],
  },
  {
    id: "turinabol", name: "Turinabol", aka: "Tbol, Oral-Turinabol",
    klass: "Anabolic steroid", group: "Oral (17aa)", route: "Oral",
    severity: "high",
    summary: "A no-aromatization oral giving steady, dry gains — 'cleaner' feeling than Dianabol, but still liver-toxic and notably harsh on lipids.",
    risks: [
      "Hepatotoxic (17aa).",
      "Strong negative lipid impact.",
      "No aromatization, but fully suppressive.",
    ],
    depletes: "Liver and lipids.",
    support: [
      { id: "tudca", note: "Liver support for the duration." },
      { id: "omega3", note: "Lipid support." },
      { id: "bergamot", note: "Counter HDL suppression." },
      { id: "nac", note: "Liver antioxidant support." },
    ],
    labs: ["liver", "lipids", "hormones", "bp"],
    warnings: [
      "Feeling 'clean' doesn't spare your lipids — check them.",
      "Keep it short and skip alcohol.",
    ],
  },

  /* ---------------- Growth-hormone axis peptides -------------------------- */
  {
    id: "hgh", name: "Growth Hormone", aka: "HGH, Somatropin, GH",
    klass: "Peptide / hormone", group: "Growth hormone axis", route: "Injection",
    severity: "high",
    summary: "Recombinant growth hormone. Powerful for body composition and recovery, but it pushes blood sugar and insulin resistance the wrong way, holds water, and at higher doses causes joint/nerve compression and organ growth.",
    risks: [
      "Raises blood glucose and lowers insulin sensitivity — a diabetes-direction risk, dose-dependent.",
      "Water retention, carpal tunnel (numb/tingling hands), joint aches.",
      "High long-term doses can enlarge organs and features (acromegaly-type changes).",
      "Theoretical concern about promoting growth of existing tumors.",
    ],
    depletes: "Chiefly a glucose-metabolism issue, not a vitamin one — the priority is watching blood sugar, not popping a vitamin.",
    support: [
      { id: "fiber", note: "Helps steady blood sugar." },
      { id: "omega3", note: "Supports insulin sensitivity and heart health." },
      { id: "multivit", note: "General micronutrient insurance." },
      { id: "magnesium", note: "Supports insulin sensitivity and sleep." },
    ],
    labs: ["glucose", "igf1", "thyroid", "bp"],
    warnings: [
      "Monitor fasting glucose and HbA1c — GH's main danger is metabolic. Dose IGF-1 to a sane range, don't chase huge numbers.",
      "Numb, tingling hands usually mean the dose is too high — back off.",
    ],
  },
  {
    id: "mk677", name: "MK-677", aka: "Ibutamoren",
    klass: "Peptide-like (oral secretagogue)", group: "Growth hormone axis", route: "Oral",
    severity: "moderate",
    summary: "An oral compound that makes your body release more of its own growth hormone. Convenient, but it drives appetite hard, holds a lot of water, and nudges blood sugar and insulin resistance up.",
    risks: [
      "Big appetite increase and water retention.",
      "Raises blood glucose / lowers insulin sensitivity over time.",
      "Lethargy and vivid dreams / disturbed sleep for some.",
      "Can mildly raise prolactin and cortisol.",
    ],
    depletes: "Glucose-metabolism effect is the concern; no classic vitamin depletion.",
    support: [
      { id: "fiber", note: "Blunts blood-sugar swings." },
      { id: "omega3", note: "Insulin-sensitivity and heart support." },
      { id: "magnesium", note: "Supports insulin sensitivity and sleep." },
    ],
    labs: ["glucose", "igf1", "bp"],
    warnings: [
      "Watch blood sugar, especially if you're already insulin-resistant or prediabetic.",
      "The water weight and appetite are real — plan diet around it.",
    ],
  },
  {
    id: "ipamorelin", name: "Ipamorelin / CJC-1295", aka: "GHRP + GHRH peptides",
    klass: "Peptide (GH secretagogues)", group: "Growth hormone axis", route: "Injection",
    severity: "moderate",
    summary: "Injectable peptides that prompt a more natural, pulsed release of your own growth hormone. Generally milder than straight HGH; Ipamorelin is favored for being relatively 'clean' on appetite and prolactin versus older GHRPs.",
    risks: [
      "Water retention and mild glucose effects (less than HGH/MK-677).",
      "Older GHRPs (GHRP-2/-6) spike hunger, prolactin and cortisol more than Ipamorelin.",
      "Head-rush/flushing right after injecting for some.",
      "Research-grade sourcing means purity and sterility are real concerns.",
    ],
    depletes: "Minor glucose effect; no notable vitamin depletion.",
    support: [
      { id: "fiber", note: "Mild blood-sugar support." },
      { id: "omega3", note: "General metabolic and heart support." },
      { id: "multivit", note: "General insurance." },
    ],
    labs: ["glucose", "igf1"],
    warnings: [
      "Sterility and product quality vary widely in the research-peptide market — inject clean.",
      "Milder than GH, but still monitor glucose if running it long-term.",
    ],
  },

  /* ---------------- Healing / recovery peptides --------------------------- */
  {
    id: "bpc157", name: "BPC-157", aka: "Body Protection Compound-157",
    klass: "Peptide (healing)", group: "Recovery peptides", route: "Injection/Oral",
    severity: "moderate",
    summary: "A research peptide popular for tendon, gut and soft-tissue healing. Human safety data is thin — most evidence is animal studies — so the real risks are the unknowns and the unregulated supply, more than a known side-effect profile.",
    risks: [
      "Not an approved drug — human safety and long-term data are limited.",
      "Unregulated 'research' supply: purity, dosing accuracy and sterility all vary.",
      "Theoretical concern that a pro-healing, pro-angiogenesis peptide could also feed unwanted growth.",
    ],
    depletes: "No known nutrient depletion; support is really about clean sourcing and injection hygiene.",
    support: [
      { id: "multivit", note: "General nutrition supports actual tissue healing." },
      { id: "protein", note: "Protein and overall nutrition do the real repair work." },
      { id: "vitc", note: "Vitamin C supports collagen/connective-tissue repair." },
    ],
    labs: ["bp"],
    warnings: [
      "The biggest risk is what you don't know — treat the safety data as incomplete.",
      "Sterile technique matters most; a contaminated vial is the realistic hazard.",
    ],
  },
  {
    id: "tb500", name: "TB-500", aka: "Thymosin Beta-4 fragment",
    klass: "Peptide (healing)", group: "Recovery peptides", route: "Injection",
    severity: "moderate",
    summary: "A recovery/healing peptide often paired with BPC-157. Same story: limited human data, unregulated supply, and a theoretical growth-promotion concern outweighing any documented side-effect list.",
    risks: [
      "Very limited human safety data.",
      "Unregulated sourcing — purity and sterility vary.",
      "Theoretical concern about promoting growth of existing abnormal cells.",
      "Head-rush / lethargy reported by some.",
    ],
    depletes: "No known nutrient depletion.",
    support: [
      { id: "protein", note: "Nutrition and protein drive the actual recovery." },
      { id: "multivit", note: "General micronutrient support." },
      { id: "vitc", note: "Supports connective-tissue repair." },
    ],
    labs: ["bp"],
    warnings: [
      "Unknown long-term safety — go in clear-eyed about that.",
      "Prioritize sterile, clean injections from a trusted source.",
    ],
  },

  /* ---------------- Metabolic / GLP-1 peptides ---------------------------- */
  {
    id: "semaglutide", name: "Semaglutide", aka: "Ozempic, Wegovy (GLP-1)",
    klass: "Peptide (GLP-1 agonist)", group: "Metabolic peptides", route: "Injection",
    severity: "high",
    summary: "A GLP-1 agonist that powerfully cuts appetite for weight loss. The safety task here is nutrition: eating far less can mean losing muscle and falling short on protein and micronutrients, plus nausea, dehydration and gallbladder risk.",
    risks: [
      "Muscle loss alongside fat when protein and training are neglected.",
      "Nausea, vomiting, constipation, dehydration.",
      "Gallstones with rapid weight loss.",
      "Micronutrient shortfalls (B12, iron, others) from simply eating much less.",
      "Rare but serious: pancreatitis — severe persistent abdominal pain means stop and seek care.",
    ],
    depletes: "This is the one your question is really about: eating little means real vitamin/mineral and protein deficiencies unless you deliberately backfill them.",
    support: [
      { id: "protein", note: "Top priority — protein + lifting protect muscle while you lose fat." },
      { id: "multivit", note: "Covers the micronutrient gap from low food intake." },
      { id: "b12", note: "B12/B-complex commonly fall short when eating very little." },
      { id: "electrolytes", note: "Counters dehydration and headaches." },
      { id: "fiber", note: "Eases the constipation these cause." },
      { id: "omega3", note: "General metabolic and heart support." },
    ],
    labs: ["glucose", "kidney", "b12", "thyroid"],
    warnings: [
      "Hit your protein and keep lifting or you'll lose muscle with the fat.",
      "Severe, persistent stomach pain (radiating to the back) — stop and get medical help; think pancreatitis.",
      "Compounded/grey-market 'research' GLP-1 carries dosing-error and contamination risk — a top cause of harm with these.",
    ],
  },
  {
    id: "tirzepatide", name: "Tirzepatide", aka: "Mounjaro, Zepbound (GIP/GLP-1)",
    klass: "Peptide (GIP/GLP-1 agonist)", group: "Metabolic peptides", route: "Injection",
    severity: "high",
    summary: "A dual GIP/GLP-1 agonist — even stronger appetite suppression than semaglutide, so the muscle-loss and nutrition risks are, if anything, larger. Same playbook: protect protein, lifting and micronutrients.",
    risks: [
      "Pronounced muscle loss if protein/training slip.",
      "Nausea, GI upset, dehydration.",
      "Gallstones with rapid loss.",
      "Micronutrient shortfalls from very low intake.",
      "Rare: pancreatitis.",
    ],
    depletes: "As with semaglutide, sharply reduced food means genuine protein and micronutrient deficiencies unless you plan for them.",
    support: [
      { id: "protein", note: "Non-negotiable — protect muscle with protein + resistance training." },
      { id: "multivit", note: "Backfill the micronutrient gap." },
      { id: "b12", note: "Common shortfall on very low intake." },
      { id: "electrolytes", note: "Counters dehydration." },
      { id: "fiber", note: "Eases constipation." },
    ],
    labs: ["glucose", "kidney", "b12", "thyroid"],
    warnings: [
      "Same rules as semaglutide, more so — protein and lifting are how you keep muscle.",
      "Grey-market/compounded product carries real dosing and contamination risk.",
    ],
  },

  /* ---------------- Other peptides ---------------------------------------- */
  {
    id: "melanotan2", name: "Melanotan II", aka: "MT-II",
    klass: "Peptide", group: "Other peptides", route: "Injection",
    severity: "high",
    summary: "A peptide that darkens the skin (and boosts libido). The real concern is dermatological: it darkens and can change moles, so skin/mole surveillance matters, alongside nausea and blood-pressure effects.",
    risks: [
      "Darkens existing moles and can spawn new ones — makes melanoma harder to spot.",
      "Nausea, facial flushing, appetite loss (especially early).",
      "Blood-pressure changes; spontaneous erections.",
      "Unregulated sourcing — purity varies.",
    ],
    depletes: "No nutrient depletion; the key 'support' is a dermatologist, not a supplement.",
    support: [
      { id: "multivit", note: "General support only — the real safeguard is skin monitoring." },
    ],
    labs: ["bp"],
    warnings: [
      "See a dermatologist and photograph your moles — report any that change shape, size or color.",
      "Doesn't replace sunscreen; a tan is not real UV protection.",
    ],
  },
  {
    id: "pt141", name: "PT-141", aka: "Bremelanotide",
    klass: "Peptide", group: "Other peptides", route: "Injection",
    severity: "moderate",
    summary: "A peptide used for libido and erectile function. Generally short-acting; the common issues are nausea, flushing and transient blood-pressure changes.",
    risks: [
      "Nausea and facial flushing (common).",
      "Transient rise in blood pressure / drop in heart rate.",
      "Headache.",
      "Unregulated sourcing — purity varies.",
    ],
    depletes: "No nutrient depletion.",
    support: [
      { id: "citrulline", note: "General vascular support (not a fix for BP effects)." },
    ],
    labs: ["bp"],
    warnings: [
      "Caution if you have high blood pressure or heart disease — it nudges BP up.",
      "Don't combine with erectile-dysfunction nitrates without medical advice.",
    ],
  },
  {
    id: "insulin", name: "Insulin", aka: "(bodybuilding use)",
    klass: "Hormone", group: "Other peptides", route: "Injection",
    severity: "severe",
    summary: "The single most dangerous drug in this space when misused. An overdose causes hypoglycemia that can put you in a coma or kill you — and it has done exactly that to experienced users. Harm reduction here means loudly: for most people, don't.",
    risks: [
      "Hypoglycemia — can cause seizures, coma and death, sometimes fast.",
      "'Going to sleep' after a dose is how people die — you won't wake to treat a low.",
      "Encourages fat gain and, long-term, can worsen your own insulin function.",
      "Zero margin for error — a small mistake is life-threatening.",
    ],
    depletes: "This isn't a vitamin problem — it's an acute life-threatening-emergency problem. The 'support' is glucose and monitoring, not supplements.",
    support: [
      { id: "electrolytes", note: "Secondary only — glucose control and monitoring are everything here." },
    ],
    labs: ["glucose"],
    warnings: [
      "NEVER dose and then sleep. NEVER dose without fast-acting carbs (glucose tabs, juice) within reach.",
      "Always have a continuous glucose monitor or finger-stick meter and use it. Know the signs of a low: shaking, sweating, confusion, racing heart — treat immediately with sugar.",
      "Have someone who knows what you're doing and can call for help. If you can avoid insulin entirely, do — the downside is death, and it is not rare.",
    ],
  },
];

/* ============================================================================
   EMERGENCY — the "this symptom means get help now" list.
   level: 'emergency' (call an ambulance) | 'urgent' (same day) | 'soon'
   ========================================================================== */
PT.emergencyIntro =
  "Tell the medical staff exactly what you have taken — every compound, dose and when. " +
  "They are there to treat you, not to judge or report you, and withholding it can get " +
  "you the wrong treatment. If you can't say it out loud, write it down and hand it over.";

PT.emergency = [
  {
    level: "emergency", title: "Heart attack",
    signs: "Chest pain or pressure (may spread to arm, jaw, back), shortness of breath, cold sweat, nausea, feeling of doom.",
    why: "AAS raise LDL/ApoB, blood pressure, clotting and heart-muscle thickness — heart attacks happen in young, fit users.",
    act: "Call emergency services now. Chew aspirin if you're not allergic and it's to hand. Do not drive yourself.",
  },
  {
    level: "emergency", title: "Stroke",
    signs: "Face drooping, arm weakness, slurred or confused speech, sudden vision loss, sudden worst-ever headache, sudden numbness on one side.",
    why: "High hematocrit thickens the blood; combined with high blood pressure this is a real clot/bleed risk.",
    act: "Call emergency services now and note the time symptoms started — treatment is time-critical.",
  },
  {
    level: "emergency", title: "Pulmonary embolism (clot in the lung)",
    signs: "Sudden breathlessness, sharp chest pain that's worse when breathing in, coughing blood, racing heart, light-headedness.",
    why: "Thick blood from a high hematocrit is the classic driver, especially on testosterone or boldenone.",
    act: "Call emergency services now.",
  },
  {
    level: "emergency", title: "DVT (clot in the leg)",
    signs: "One calf or leg swollen, warm, red and painful — often aching or cramping that won't settle.",
    why: "Raised hematocrit and dehydration. A leg clot can travel to the lungs.",
    act: "Get emergency care. Do not rub or massage the leg — that can dislodge the clot.",
  },
  {
    level: "emergency", title: "Severe hypoglycemia (insulin)",
    signs: "Shaking, sweating, confusion, slurred speech, aggression, seizure, loss of consciousness.",
    why: "The single most lethal risk in this space. It can progress from 'a bit off' to unconscious very fast.",
    act: "If awake and able to swallow: fast sugar now — glucose tabs, juice, full-sugar soft drink — then a longer-acting carb. If drowsy or unconscious: call emergency services, put them in the recovery position, and put NOTHING in their mouth.",
  },
  {
    level: "emergency", title: "Anaphylaxis / severe reaction after injecting",
    signs: "Swelling of lips, tongue or throat, difficulty breathing, widespread hives, sudden collapse.",
    why: "Reaction to the compound, the carrier oil, or a contaminant.",
    act: "Call emergency services. Use an adrenaline auto-injector if one is available.",
  },
  {
    level: "urgent", title: "Liver injury",
    signs: "Yellowing of the eyes or skin, very dark urine, pale stools, pain under the right ribs, deep itching, unusual fatigue.",
    why: "Oral 17aa steroids — Superdrol, Anadrol, Dianabol and others — are genuinely hepatotoxic.",
    act: "Stop the oral and get seen the same day. Ask for liver function tests.",
  },
  {
    level: "urgent", title: "Pancreatitis (GLP-1s)",
    signs: "Severe, constant upper abdominal pain that bores through to the back, usually with vomiting, and not relieved by position.",
    why: "A rare but serious risk of semaglutide and tirzepatide.",
    act: "Stop the drug and get emergency assessment.",
  },
  {
    level: "urgent", title: "Injection-site infection or abscess",
    signs: "Spreading redness, heat, a hard or fluid-filled lump, severe or worsening pain, fever, red streaks tracking away from the site, pus.",
    why: "Non-sterile technique, reused equipment or contaminated product. This is the most common reason users end up in hospital.",
    act: "See a doctor today — it usually needs antibiotics, and an abscess needs proper drainage. Do NOT squeeze, cut or drain it yourself.",
  },
  {
    level: "urgent", title: "Hypertensive crisis",
    signs: "Very high blood pressure with headache, visual changes, chest pain, breathlessness, or nosebleeds that won't stop.",
    why: "Anadrol, trenbolone and heavy aromatization can drive blood pressure to dangerous levels.",
    act: "Seek urgent medical care — don't wait to 'see if it settles'.",
  },
  {
    level: "urgent", title: "Priapism (erection lasting over 4 hours)",
    signs: "A painful erection that won't go down, unrelated to arousal.",
    why: "A urological emergency — after a few hours it causes permanent tissue damage.",
    act: "Go to an emergency department. Do not wait it out from embarrassment.",
  },
  {
    level: "urgent", title: "Mental health crisis",
    signs: "Thoughts of suicide or self-harm, severe depression, uncontrollable rage, paranoia, not sleeping for days.",
    why: "Trenbolone is notorious for this, and the crash coming off a cycle or during PCT is a genuinely high-risk window.",
    act: "If you are thinking about acting on it, treat it as an emergency and get help now. Tell someone you trust today. This is a side effect, not a character flaw — and it lifts.",
  },
  {
    level: "soon", title: "Kidney strain",
    signs: "Much less urine than usual, persistent swelling in the ankles or face, foamy urine, ongoing flank pain.",
    why: "High blood pressure, high hematocrit, dehydration and very high protein all load the kidneys — trenbolone especially.",
    act: "Stop and get kidney function checked (eGFR, creatinine, cystatin C).",
  },
  {
    level: "soon", title: "Gynecomastia starting",
    signs: "Tender, itchy or sore nipples, a firm lump under the areola.",
    why: "Estrogen from aromatization, or prolactin from 19-nors.",
    act: "Get estradiol and prolactin tested and speak to a doctor early. Once the lump becomes established tissue, only surgery removes it.",
  },
  {
    level: "soon", title: "Persistent vomiting or dehydration",
    signs: "Can't keep fluids down, dizziness on standing, very dark urine, no urine for many hours.",
    why: "Common on GLP-1s, and dangerous when combined with anything raising hematocrit.",
    act: "Stop, rehydrate with electrolytes, and see a doctor if it doesn't settle quickly.",
  },
];

/* ============================================================================
   INJECTION SAFETY
   ========================================================================== */
PT.injection = {
  intro:
    "Most avoidable harm in this space isn't exotic — it's an abscess from a dirty injection, " +
    "or hepatitis from shared equipment. Sterile technique is not optional, and clean needles " +
    "are free and confidential at needle & syringe programmes in most countries.",
  rules: [
    { icon: "🚫", title: "Never share anything",
      body: "Not needles, not barrels, not vials, not swabs. Sharing transmits hepatitis B, hepatitis C and HIV. A multi-use vial that someone else's needle has entered is no longer yours to use." },
    { icon: "1️⃣", title: "One needle, one use",
      body: "Needles blunt on the first pass through a rubber stopper. Reusing one hurts more, tears tissue and drives infection. Draw with one needle, swap to a fresh one to inject." },
    { icon: "🧼", title: "Clean everything, in order",
      body: "Wash hands. Swab the vial stopper and let it dry. Swab the injection site and let it dry — alcohol only works as it evaporates, and injecting through wet alcohol stings and irritates." },
    { icon: "🔄", title: "Rotate sites",
      body: "Repeatedly hitting the same spot builds scar tissue, which makes future injections painful and poorly absorbed. Keep a simple rotation and never inject into a lump, scar, bruise or inflamed area." },
    { icon: "🗑️", title: "Sharps go in a sharps bin",
      body: "Never in household rubbish. Pharmacies and needle exchanges take them, usually free and without questions." },
    { icon: "🐢", title: "Inject slowly",
      body: "Slow, steady pressure hurts less and disperses better. If you hit sudden electric pain, radiating tingling or you can't push, stop and withdraw — you may be on a nerve." },
  ],
  sites: [
    { name: "Ventrogluteal (side of the hip)", note: "Widely considered the safest and most reliable IM site — thick muscle, well away from the sciatic nerve and major vessels.", vol: "up to ~3 ml" },
    { name: "Vastus lateralis (outer thigh)", note: "Easy to reach and self-inject, good for beginners. Can be sore for a day or two.", vol: "up to ~3 ml" },
    { name: "Deltoid (shoulder)", note: "Convenient but a small muscle — small volumes only, and easy to go too deep or too high into the joint.", vol: "up to ~1 ml" },
    { name: "Dorsogluteal (upper outer buttock)", note: "The traditional site, but it carries real sciatic nerve risk if placed wrong. Ventrogluteal is generally preferred now.", vol: "up to ~3 ml" },
    { name: "SubQ (abdomen, love handles)", note: "For most peptides, GLP-1s and some low-volume protocols. Short, fine needle into a pinched fold of fat.", vol: "small volumes" },
  ],
  peptides: [
    "Reconstitute with bacteriostatic water (it contains a preservative), not plain sterile water, if you'll use the vial more than once.",
    "Aim the stream down the inside wall of the vial — don't blast it into the powder.",
    "Swirl or roll gently to dissolve. Never shake: it can shear and destroy the peptide.",
    "Store reconstituted peptides in the fridge, protected from light, and respect how long they stay stable.",
    "Label every vial with what it is, the concentration and the date you mixed it. Mis-dosing from an unlabelled vial is a real and common error.",
  ],
  watch:
    "Some redness and soreness for a day or two is normal. Spreading redness, heat, a hard or growing lump, severe pain, red streaks or a fever is not — that's a possible abscess or cellulitis and needs a doctor the same day.",
};

/* ============================================================================
   COMING OFF — suppression, PCT, and the decision nobody plans for
   ========================================================================== */
PT.pct = {
  intro:
    "Every anabolic steroid shuts down your own testosterone production. That is not a side " +
    "effect you can supplement your way out of — it's the deal. The question is only whether " +
    "you restart your own production or accept replacing it for life, and that is a decision " +
    "to make deliberately before your first cycle, not afterwards.",
  reality: [
    { title: "What suppression actually is",
      body: "External androgens switch off the signal (LH and FSH) from your brain to your testicles. Production stops, the testicles shrink, and sperm production falls — often to zero. For most people this reverses; for some it doesn't, and 'some' is not a small number." },
    { title: "The crash is real",
      body: "When you stop, external hormone falls away before your own production returns. That gap brings fatigue, no libido, depression, strength and size loss, and low motivation. It's the highest-risk window for mental health on the whole cycle — plan support for it." },
    { title: "The odds get worse the harder you go",
      body: "Longer cycles, higher doses, more compounds, 19-nors, and older age all reduce the chance of a full recovery. A first short cycle at a modest dose recovers far more reliably than years of stacking." },
    { title: "'Blast and cruise' is a life sentence",
      body: "Never coming off means lifelong dependence on injections, lifelong cardiovascular risk, and almost certainly permanent infertility. People drift into it because recovery felt hard — make it a choice you actually made, with a doctor." },
  ],
  protocol: [
    { step: "Wait for the ester to clear",
      body: "PCT started too early is wasted. Short esters (propionate, acetate) clear in days; long ones (enanthate, cypionate) take a couple of weeks; nandrolone decanoate and boldenone undecylenate take considerably longer." },
    { step: "SERMs are the backbone",
      body: "Tamoxifen and clomiphene restart the LH/FSH signal. These are real prescription medicines with real side effects — clomiphene can cause visual disturbance and mood effects, tamoxifen carries a clotting risk. Get them, and the dosing, from a doctor rather than a forum." },
    { step: "hCG has a place, but timing matters",
      body: "hCG mimics LH and is generally used before or alongside the restart, not as the whole plan — it can suppress your own signal further if run badly. This is exactly the kind of thing worth a doctor's input." },
    { step: "Don't crush estrogen during recovery",
      body: "Aromatase inhibitors through PCT are a common mistake. You need some estrogen for mood, joints, libido, bone and lipids — flattening it makes recovery feel far worse." },
    { step: "Confirm it with bloods, not vibes",
      body: "Around 4–8 weeks after finishing PCT, test LH, FSH and total testosterone. Feeling 'okay' is not evidence of recovery. If levels are still on the floor, see an endocrinologist rather than starting another cycle to mask it." },
  ],
  fertility:
    "If you want children now or later: bank sperm before you start if you can, tell your doctor what you've used, and know that hCG/hMG and SERMs can often restore sperm production — but it can take many months, and occasionally it doesn't come back. Fertility is the consequence people most often assume won't apply to them.",
  trt:
    "If recovery genuinely fails, medically supervised TRT is a legitimate outcome — but it should be a diagnosis made on repeat bloodwork by a doctor, not a self-declared excuse to stay on. Get properly tested before accepting it.",
};

/* ============================================================================
   WOMEN — a different risk profile, and some of it permanent
   ========================================================================== */
PT.women = {
  intro:
    "Anabolic steroids affect women differently, and the headline difference is that several " +
    "of the effects are permanent. Virilization doesn't reverse just because you stop — " +
    "stopping only prevents it getting worse. Doses that are 'low' for a man are not low for a woman.",
  permanent: [
    "Voice deepening or hoarseness — often the first irreversible sign, and it does not come back.",
    "Clitoral enlargement.",
    "Facial and body hair growth (hirsutism).",
    "Male-pattern scalp hair loss, which may not regrow.",
    "Changes to jaw and facial structure with long-term use.",
  ],
  reversible: [
    "Acne and oily skin.",
    "Menstrual irregularity or periods stopping (usually returns, but not always quickly).",
    "Mood changes, irritability, raised libido.",
    "Fluid retention.",
  ],
  rules: [
    { icon: "🛑", title: "First sign means stop — immediately",
      body: "A scratchy or deepening voice, new facial hair, or clitoral changes are your cue to stop that day. 'Pushing through to the end of the cycle' is how reversible becomes permanent. Record your voice weekly so you notice a change early rather than after other people do." },
    { icon: "⚖️", title: "Doses are far lower",
      body: "Women who use report a small fraction of typical male doses, and the compounds most often used are the milder ones (oxandrolone, methenolone). Testosterone, trenbolone, Dianabol and Anadrol at male doses virilize quickly and severely." },
    { icon: "🧪", title: "Counterfeits are a virilization risk",
      body: "Oxandrolone is one of the most faked compounds on the market and is frequently substituted with something far more androgenic. A capsule sold as 'the mild one' causing rapid virilization usually means it isn't what it says." },
    { icon: "🤰", title: "Pregnancy is an absolute stop",
      body: "Androgens can virilize a female fetus. Do not use if pregnant, trying to conceive, or breastfeeding — and note that cycles frequently disrupt the menstrual cycle, so 'I'd know' is not reliable." },
    { icon: "🩸", title: "Monitor the same things, plus the ones specific to you",
      body: "Lipids and liver as usual, plus menstrual changes, and remember that oral contraceptives and hormonal coils interact with all of this. A doctor who knows the full picture is worth a great deal here." },
  ],
};

/* Convenience lookups ------------------------------------------------------ */
PT.byId = {};
PT.compounds.forEach((c) => (PT.byId[c.id] = c));

PT.groups = [
  "Injectable",
  "Oral (17aa)",
  "Growth hormone axis",
  "Recovery peptides",
  "Metabolic peptides",
  "Other peptides",
];

if (typeof module !== "undefined" && module.exports) module.exports = PT;
