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
   BLOOD MARKERS — reference ranges + cycle-aware alarm thresholds.
   Clinically compiled and adversarially verified. Ranges are US lab units.
   Flags encode ACTIONABLE thresholds only — being mildly outside a normal
   population range is not itself flagged, because on cycle several markers
   (testosterone, estradiol, HDL, hematocrit) are expected to shift. That keeps
   the signal meaningful instead of alarming on everything.
   ========================================================================== */
PT.markers = [
  { id: "hematocrit", name: "Hematocrit", unit: "%", group: "Hematology", sexSpecific: true,
    rangeM: [40,50], rangeF: [36,46],
    flags: [
      { level: "watch", when: "gt", value: 52, msg: "Blood thickening. Hydrate hard, ease off any overdose, recheck soon." },
      { level: "high", when: "gt", value: 54, msg: "Clot/stroke risk. Talk to a doctor about donating blood or a phlebotomy." },
      { level: "critical", when: "gte", value: 56, msg: "Dangerously thick blood. Get a phlebotomy; seek care for chest pain, breathlessness or stroke signs." },
      { level: "low", when: "lt", value: 38, sex: "m", msg: "Low for a man — possible GI bleed from orals or too-frequent donation. Get it checked." },
      { level: "low", when: "lt", value: 34, sex: "f", msg: "Low — possible bleeding or over-donation. Get it checked." },
    ],
  },
  { id: "hemoglobin", name: "Hemoglobin", unit: "g/dL", group: "Hematology", sexSpecific: true,
    rangeM: [13.5,17.5], rangeF: [12,15.5],
    flags: [
      { level: "watch", when: "gt", value: 17.5, msg: "Thickening alongside hematocrit. Hydrate, ease off, recheck." },
      { level: "high", when: "gt", value: 18, msg: "Clot/stroke risk. Discuss donating blood or a phlebotomy with a doctor." },
      { level: "critical", when: "gte", value: 19, msg: "Dangerously high. Seek care, especially with headaches, vision changes or chest pain." },
      { level: "low", when: "lt", value: 13, sex: "m", msg: "Low for a man — possible bleeding or over-donation. Get checked." },
      { level: "low", when: "lt", value: 11.5, sex: "f", msg: "Low — possible bleeding or over-donation. Get checked." },
    ],
  },
  { id: "rbc", name: "Red blood cell count", unit: "x10^6/uL", group: "Hematology", sexSpecific: true,
    rangeM: [4.5,5.9], rangeF: [4.1,5.1],
    flags: [
      { level: "watch", when: "gt", value: 6, msg: "Red cells climbing — check hematocrit, the number to manage." },
      { level: "high", when: "gt", value: 6.5, msg: "Marked polycythemia. Check hematocrit; discuss donating blood or a phlebotomy." },
      { level: "low", when: "lt", value: 4.2, sex: "m", msg: "Low for a man — possible bleeding or over-donation. Get checked." },
      { level: "low", when: "lt", value: 3.8, sex: "f", msg: "Low — possible bleeding or over-donation. Get checked." },
    ],
  },
  { id: "total_cholesterol", name: "Total cholesterol", unit: "mg/dL", group: "Lipids",
    rangeM: [125,200], rangeF: [125,200],
    flags: [
      { level: "watch", when: "gte", value: 200, msg: "Borderline. AAS (orals worst) push this up — add cardio + omega-3, recheck." },
      { level: "high", when: "gte", value: 240, msg: "High. With crashed HDL this raises heart risk — get LDL, HDL and ApoB, see a doctor." },
    ],
  },
  { id: "ldl", name: "LDL cholesterol", unit: "mg/dL", group: "Lipids",
    rangeM: [0,100], rangeF: [0,100],
    flags: [
      { level: "watch", when: "gte", value: 130, msg: "Rising LDL — AAS push it up fast, orals worst. Cardio, omega-3, bergamot; recheck." },
      { level: "high", when: "gte", value: 160, msg: "High LDL — drives plaque. Consider dropping orals; get ApoB and talk to a doctor." },
      { level: "critical", when: "gte", value: 190, msg: "Very high — major long-term heart risk. Strongly reconsider the cycle; see a doctor." },
    ],
  },
  { id: "hdl", name: "HDL cholesterol", unit: "mg/dL", group: "Lipids", sexSpecific: true,
    rangeM: [40,60], rangeF: [50,60],
    flags: [
      { level: "low", when: "lt", value: 40, sex: "m", msg: "Low HDL — classic AAS effect, worst on orals. Cardio, omega-3, bergamot; reconsider orals." },
      { level: "low", when: "lt", value: 50, sex: "f", msg: "Low HDL for a woman — AAS effect. Cardio, omega-3, bergamot; reconsider orals." },
      { level: "low", when: "lt", value: 20, msg: "HDL crushed near zero — typical of harsh orals and a serious heart-risk signal. Come off the oral and recheck." },
    ],
    expect: "AAS suppress HDL; some drop is expected, orals worst. It's still worth countering.",
  },
  { id: "triglycerides", name: "Triglycerides", unit: "mg/dL", group: "Lipids",
    rangeM: [40,150], rangeF: [40,150],
    flags: [
      { level: "watch", when: "gte", value: 150, msg: "Borderline-high. Cut sugar/alcohol, add cardio + omega-3; orals worsen it." },
      { level: "high", when: "gte", value: 200, msg: "High — part of AAS lipid damage. Omega-3, cardio, reconsider orals." },
      { level: "critical", when: "gte", value: 500, msg: "Very high — pancreatitis risk. Needs medical attention, not just diet." },
    ],
  },
  { id: "apob", name: "Apolipoprotein B", unit: "mg/dL", group: "Lipids",
    rangeM: [40,90], rangeF: [40,90],
    flags: [
      { level: "watch", when: "gte", value: 100, msg: "Above optimal (<90). More plaque-forming particles — AAS drive it up. Cardio, omega-3, bergamot." },
      { level: "high", when: "gte", value: 120, msg: "High ApoB — the truest plaque-risk marker, and it moves fast on orals. Reconsider the cycle; see a doctor." },
    ],
  },
  { id: "ast", name: "AST", unit: "U/L", group: "Liver",
    rangeM: [10,40], rangeF: [10,40],
    flags: [
      { level: "watch", when: "gt", value: 80, msg: "~2x upper normal. Training raises AST too — recheck after a rest day; worse on 17aa orals." },
      { level: "high", when: "gt", value: 120, msg: "~3x upper normal. Pause oral steroids and get a full liver panel." },
      { level: "critical", when: "gt", value: 200, msg: "5x+ normal — possible liver injury. See a doctor now, especially with jaundice, dark urine or right-upper belly pain." },
    ],
  },
  { id: "alt", name: "ALT", unit: "U/L", group: "Liver",
    rangeM: [10,50], rangeF: [10,50],
    flags: [
      { level: "watch", when: "gt", value: 100, msg: "~2x upper normal. Some rise is training, but ALT is fairly liver-specific — recheck rested." },
      { level: "high", when: "gt", value: 150, msg: "~3x upper normal. Stop orals and get liver function evaluated." },
      { level: "critical", when: "gt", value: 250, msg: "5x+ normal — possible drug-induced liver injury. Urgent evaluation, especially with high bilirubin." },
    ],
  },
  { id: "ggt", name: "GGT", unit: "U/L", group: "Liver", sexSpecific: true,
    rangeM: [10,71], rangeF: [7,42],
    flags: [
      { level: "watch", when: "gt", value: 71, sex: "m", msg: "Above normal. GGT isn't a training artefact, so this is a real liver flag — recheck and reconsider orals." },
      { level: "watch", when: "gt", value: 42, sex: "f", msg: "Above normal. GGT isn't a training artefact, so this is a real liver flag — recheck and reconsider orals." },
      { level: "high", when: "gt", value: 140, msg: "~2x+ normal — cholestatic liver stress. Come off orals and see a doctor." },
      { level: "critical", when: "gt", value: 300, msg: "Very high. Urgent liver evaluation, especially if bilirubin is rising or you look jaundiced." },
    ],
  },
  { id: "bilirubin", name: "Total bilirubin", unit: "mg/dL", group: "Liver",
    rangeM: [0.1,1.2], rangeF: [0.1,1.2],
    flags: [
      { level: "watch", when: "gt", value: 1.2, msg: "Above normal. Often benign (Gilbert's), but with high ALT/AST or dark urine it signals liver stress." },
      { level: "high", when: "gt", value: 2, msg: "Jaundice may show. Combined with ALT/AST >3x normal this is a dangerous combo — stop orals, see a doctor." },
      { level: "critical", when: "gt", value: 3, msg: "Significant — possible real liver injury. Urgent evaluation." },
    ],
  },
  { id: "egfr", name: "eGFR", unit: "mL/min/1.73m²", group: "Kidney",
    rangeM: [90,120], rangeF: [90,120],
    flags: [
      { level: "watch", when: "lt", value: 60, msg: "Under 60. Creatinine-based eGFR reads low in muscular people — confirm with a cystatin C eGFR before worrying." },
      { level: "high", when: "lt", value: 45, msg: "Stage 3b range. Get kidney function properly worked up (cystatin C, urine albumin)." },
      { level: "critical", when: "lt", value: 30, msg: "Stage 4 CKD range — see a doctor promptly." },
    ],
  },
  { id: "creatinine", name: "Creatinine", unit: "mg/dL", group: "Kidney", sexSpecific: true,
    rangeM: [0.7,1.3], rangeF: [0.6,1.05],
    flags: [
      { level: "watch", when: "gt", value: 1.3, sex: "m", msg: "Above normal — but muscle, creatine and high protein raise it harmlessly. Confirm with cystatin C/eGFR before worrying." },
      { level: "watch", when: "gt", value: 1.05, sex: "f", msg: "Above normal — but muscle, creatine and high protein raise it harmlessly. Confirm with cystatin C/eGFR before worrying." },
      { level: "high", when: "gt", value: 2, msg: "Higher than muscle mass alone explains. Check eGFR + cystatin C — real kidney strain is possible." },
      { level: "critical", when: "gt", value: 4, msg: "Very high — possible acute kidney injury. Urgent care." },
    ],
  },
  { id: "bun", name: "BUN", unit: "mg/dL", group: "Kidney",
    rangeM: [7,20], rangeF: [7,20],
    flags: [
      { level: "watch", when: "gt", value: 20, msg: "Above normal. High protein + dehydration raise it — hydrate and read it alongside creatinine/eGFR." },
      { level: "high", when: "gt", value: 30, msg: "Notably high. Check hydration and kidney function together." },
      { level: "critical", when: "gt", value: 50, msg: "Very high — marked dehydration or kidney impairment. Seek care." },
    ],
  },
  { id: "testosterone_total", name: "Total testosterone", unit: "ng/dL", group: "Hormones", sexSpecific: true,
    rangeM: [264,916], rangeF: [8,60],
    flags: [
      { level: "low", when: "lt", value: 264, sex: "m", msg: "Below male range — hypogonadal. Post-cycle this means recovery has stalled; get bloods + see a doctor." },
      { level: "watch", when: "gt", value: 1200, sex: "m", msg: "Well above range — expected on-cycle, but watch E2, hematocrit, BP and lipids." },
      { level: "watch", when: "gt", value: 60, sex: "f", msg: "Above female range — virilization risk climbs. Reassess dose; stop if voice/hair/clitoral changes." },
      { level: "high", when: "gt", value: 150, sex: "f", msg: "Far above female range — high virilization risk; some changes can be permanent." },
    ],
    expect: "Runs far above the normal range on cycle by design — what matters is how high, and the knock-on effects on E2, hematocrit and BP.",
  },
  { id: "testosterone_free", name: "Free testosterone", unit: "pg/mL", group: "Hormones", sexSpecific: true,
    rangeM: [46,224], rangeF: [0.2,5],
    flags: [
      { level: "low", when: "lt", value: 46, sex: "m", msg: "Below male range — low active testosterone. If post-cycle, recovery isn't complete yet." },
      { level: "watch", when: "gt", value: 5, sex: "f", msg: "Above female range — virilization risk; reassess dose and watch for androgenic signs." },
    ],
    expect: "Expected well above range on cycle; low readings matter most post-cycle as a recovery signal.",
  },
  { id: "estradiol", name: "Estradiol", unit: "pg/mL", group: "Hormones", sexSpecific: true,
    rangeM: [10,40], rangeF: [15,350],
    flags: [
      { level: "low", when: "lt", value: 10, sex: "m", msg: "Crashed — usually too much AI. Joint pain, low libido, low mood, worse lipids. Back off the AI." },
      { level: "watch", when: "gt", value: 40, sex: "m", msg: "Above male range — water retention, higher BP, gyno risk. Recheck; adjust dose/AI, don't over-correct." },
      { level: "high", when: "gt", value: 60, sex: "m", msg: "High — gyno and bloating likely. Address aromatization; retest before any big AI dose." },
    ],
    expect: "Often above the male range on cycle — the aim is managed, not zero. Crushing it with an AI is its own harm.",
  },
  { id: "shbg", name: "SHBG", unit: "nmol/L", group: "Hormones", sexSpecific: true,
    rangeM: [17,56], rangeF: [25,122],
    flags: [
      { level: "watch", when: "lt", value: 17, sex: "m", msg: "Low — common on-cycle; raises free-T fraction. Very low can distort hormone reads." },
      { level: "watch", when: "lt", value: 25, sex: "f", msg: "Low — androgen effect; raises free-T fraction and adds to virilization risk." },
      { level: "watch", when: "gt", value: 56, sex: "m", msg: "High — lowers free testosterone. If unexpected, check thyroid, liver and estrogen." },
    ],
    expect: "Commonly low on cycle, which raises your free-testosterone fraction.",
  },
  { id: "lh", name: "LH", unit: "IU/L", group: "Hormones", sexSpecific: true,
    rangeM: [1.7,8.6], rangeF: [1,18],
    flags: [
      { level: "watch", when: "lt", value: 1.7, sex: "m", msg: "Suppressed — normal on-cycle (HPTA shut down). Post-cycle, still-low LH means recovery has stalled; key PCT marker." },
    ],
    expect: "Suppressed on cycle by design — this is a post-cycle recovery marker, not an on-cycle alarm.",
  },
  { id: "fsh", name: "FSH", unit: "IU/L", group: "Hormones", sexSpecific: true,
    rangeM: [1.5,12.4], rangeF: [1,21],
    flags: [
      { level: "watch", when: "lt", value: 1.5, sex: "m", msg: "Suppressed — expected on-cycle. Post-cycle, low FSH means recovery isn't underway yet; track it through PCT." },
    ],
    expect: "Suppressed on cycle by design — track it through PCT as a recovery marker.",
  },
  { id: "prolactin", name: "Prolactin", unit: "ng/mL", group: "Hormones", sexSpecific: true,
    rangeM: [4,15], rangeF: [5,23],
    flags: [
      { level: "watch", when: "gt", value: 15, sex: "m", msg: "Elevated — common on 19-nors; can cause gyno, low libido, ED. Retest rested; often enough androgen fixes it. Consider P5P/cabergoline with guidance." },
      { level: "watch", when: "gt", value: 23, sex: "f", msg: "Above female (non-pregnant) range — check meds, thyroid and pregnancy; see a doctor if it persists." },
      { level: "high", when: "gt", value: 50, msg: "Well above range — see a doctor. Rule out prolactinoma, meds and thyroid; don't just self-treat." },
      { level: "critical", when: "gt", value: 100, msg: "Very high — get a medical workup now (prolactinoma possible). Self-management isn't enough." },
    ],
  },
  { id: "glucose_fasting", name: "Fasting glucose", unit: "mg/dL", group: "Metabolic",
    rangeM: [70,99], rangeF: [70,99],
    flags: [
      { level: "watch", when: "lt", value: 70, msg: "Low blood sugar — shaky, sweaty or foggy? Eat fast carbs. Watch closely on insulin or GH." },
      { level: "critical", when: "lt", value: 54, msg: "Severe low sugar — take fast sugar NOW; if confused or can't self-treat, it's a 911 emergency. Big risk on insulin." },
      { level: "watch", when: "gte", value: 100, msg: "Pre-diabetic range (100–125). GH, MK-677 and orals push glucose up — retest and tighten diet." },
      { level: "high", when: "gte", value: 126, msg: "Diabetic range (126+). Get evaluated — AAS and GH worsen insulin resistance." },
      { level: "critical", when: "gte", value: 275, msg: "Very high blood sugar. With heavy thirst/urination, vomiting, confusion or fruity breath, seek urgent care now (DKA/HHS risk) — especially on insulin." },
    ],
  },
  { id: "hba1c", name: "HbA1c", unit: "%", group: "Metabolic",
    rangeM: [4,5.6], rangeF: [4,5.6],
    flags: [
      { level: "watch", when: "gte", value: 5.7, msg: "Pre-diabetic (5.7–6.4%). Act early with diet and cardio." },
      { level: "high", when: "gte", value: 6.5, msg: "Diabetic range (6.5%+). See a doctor; GH, insulin and orals make it worse." },
    ],
  },
  { id: "insulin_fasting", name: "Fasting insulin", unit: "uIU/mL", group: "Metabolic",
    rangeM: [2,20], rangeF: [2,20],
    flags: [
      { level: "watch", when: "gt", value: 10, msg: "Above ~10 hints at early insulin resistance — optimal fasting is under 8. Watch with GH/MK-677." },
      { level: "high", when: "gt", value: 20, msg: "High fasting insulin — insulin resistance. Cut refined carbs, add cardio, get a doctor's read." },
    ],
  },
  { id: "psa", name: "PSA", unit: "ng/mL", group: "Prostate", sexSpecific: true,
    rangeM: [0,4], rangeF: [0,0.1],
    flags: [
      { level: "watch", when: "gte", value: 4, sex: "m", msg: "Over 4.0 — see a urologist. Androgens can stimulate the prostate; track the trend, not one reading." },
      { level: "high", when: "gte", value: 10, sex: "m", msg: "Clearly elevated — needs a urology workup. Don't sit on this." },
    ],
    note: "Track the trend, not one value: a rise over ~0.75 ng/mL in a year is concerning (~0.35 if your baseline is under 4).",
  },
  { id: "bp_systolic", name: "Systolic blood pressure", unit: "mmHg", group: "Vitals",
    rangeM: [90,119], rangeF: [90,119],
    flags: [
      { level: "watch", when: "lt", value: 90, msg: "Low systolic — lightheaded standing up? Hydrate; some BP meds or peptides overshoot." },
      { level: "watch", when: "gte", value: 130, msg: "Elevated (130+). Most AAS raise BP — track daily and act early: cardio, less sodium, fish oil." },
      { level: "high", when: "gte", value: 140, msg: "High BP (140+). Get on a doctor's radar about meds; sustained high BP quietly damages heart, kidney and brain." },
      { level: "critical", when: "gte", value: 180, msg: "Crisis (180+). With chest pain, bad headache or vision changes → emergency care now." },
    ],
  },
  { id: "bp_diastolic", name: "Diastolic blood pressure", unit: "mmHg", group: "Vitals",
    rangeM: [60,79], rangeF: [60,79],
    flags: [
      { level: "watch", when: "lt", value: 60, msg: "Low diastolic — usually fine unless dizzy or faint; hydrate." },
      { level: "watch", when: "gte", value: 80, msg: "Elevated (80+). Tends to climb with systolic on AAS — keep tracking." },
      { level: "high", when: "gte", value: 90, msg: "High (90+). Actively manage BP and loop in a doctor." },
      { level: "critical", when: "gte", value: 120, msg: "Crisis (120+). With symptoms → emergency care." },
    ],
  },
  { id: "resting_hr", name: "Resting heart rate", unit: "bpm", group: "Vitals",
    rangeM: [60,100], rangeF: [60,100],
    flags: [
      { level: "watch", when: "lt", value: 40, msg: "Very low — normal for well-trained athletes, but with dizziness or fainting get checked." },
      { level: "watch", when: "gt", value: 100, msg: "Resting over 100. Stimulants, clen, tren, high E2, thyroid or dehydration can drive this." },
      { level: "high", when: "gt", value: 120, msg: "Resting over 120 — stop stimulants/clen, hydrate, and get evaluated." },
      { level: "critical", when: "gt", value: 140, msg: "Resting over 140 with chest pain or breathlessness → emergency care." },
    ],
  },
  { id: "tsh", name: "TSH", unit: "mIU/L", group: "Thyroid",
    rangeM: [0.4,4], rangeF: [0.4,4],
    flags: [
      { level: "watch", when: "lt", value: 0.4, msg: "Low TSH — overactive thyroid, or suppression from taking T3/T4. Watch for heart strain." },
      { level: "high", when: "lt", value: 0.1, msg: "Very suppressed — if running thyroid meds you're overshooting; heart and bone risk." },
      { level: "watch", when: "gt", value: 4, msg: "High TSH — underactive thyroid. Common with hard dieting; saps energy and mood." },
      { level: "high", when: "gt", value: 10, msg: "Markedly high — overt hypothyroid range, see a doctor." },
    ],
  },
  { id: "ft4", name: "Free T4", unit: "ng/dL", group: "Thyroid",
    rangeM: [0.8,1.8], rangeF: [0.8,1.8],
    flags: [
      { level: "watch", when: "lt", value: 0.8, msg: "Low free T4 — underactive thyroid; fatigue, feeling cold, low mood." },
      { level: "watch", when: "gt", value: 1.8, msg: "High free T4 — overactive thyroid or too much T4. Anxiety, sweats, heart strain." },
    ],
  },
  { id: "ft3", name: "Free T3", unit: "pg/mL", group: "Thyroid",
    rangeM: [2.3,4.2], rangeF: [2.3,4.2],
    flags: [
      { level: "watch", when: "lt", value: 2.3, msg: "Low free T3 — often from hard dieting; slows metabolism, energy and mood." },
      { level: "watch", when: "gt", value: 4.2, msg: "High free T3 — overactive thyroid or too much T3; raises heart rate." },
      { level: "high", when: "gt", value: 6, msg: "Well over range — real cardiac strain, worse with stimulants. Back off T3." },
    ],
  },
];

/* ============================================================================
   UNIVERSAL HARM-REDUCTION PRINCIPLES
   ========================================================================== */
PT.principles = [
  { icon: "drop", title: "Bloodwork is non-negotiable",
    body: "Baseline before, monitor during, re-check after. Without labs you're flying blind — labs turn damage you can't feel (lipids, hematocrit, liver) into something you can manage or stop." },
  { icon: "stethoscope", title: "Work with a doctor",
    body: "A supportive physician (or a TRT/men's-health clinic) beats forum guesses. Be honest with them — they can only keep you safe if they know what you're actually taking." },
  { icon: "flask", title: "Source & dose quality",
    body: "Underground product is often mis-dosed, under-dosed or contaminated. If you can test it, test it. Wrong dose is a top cause of avoidable harm." },
  { icon: "syringe", title: "Injection hygiene",
    body: "Sterile, single-use needles; clean the vial top and the site; rotate injection sites; never share equipment. Infections and abscesses put people in hospital." },
  { icon: "gauge", title: "One variable, start low",
    body: "Change one compound at a time and start at the low end. You can always add; you can't un-take a dose. Stacking several harsh compounds multiplies risk, it doesn't add it." },
  { icon: "heart", title: "Cardio & blood pressure",
    body: "The heart takes the biggest long-term hit. Keep doing real cardio, own a blood-pressure cuff, and treat high BP — don't wait for symptoms." },
  { icon: "cycle", title: "Have an exit plan (PCT / TRT)",
    body: "AAS shut down your own testosterone. Know before you start whether you'll restart production with a proper PCT or accept lifelong TRT — decide it deliberately, not by accident." },
  { icon: "brain", title: "Mind & mood count",
    body: "Some compounds (trenbolone especially) wreck sleep, mood and mental health. If you feel unwell mentally, that's a real side effect — lower or stop, and get support." },
  { icon: "ban", title: "Some people just shouldn't",
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
   COUNTERMEASURES — "this side effect is happening, what counters it?"
   Deliberately split into: what's free (usually the real fix), what's
   over-the-counter, and what's an actual prescription drug. Several of the
   effective answers here are real medicines with real risks — those are
   flagged, because the community habit of casually running them is itself
   a source of harm.
   ========================================================================== */
PT.counterIntro =
  "The honest pattern in almost every row below: the free fix — lower the dose, " +
  "shorten the run, do cardio, sleep, hydrate — outperforms anything you can buy. " +
  "Supplements blunt damage; they don't cancel it. And several genuinely effective " +
  "countermeasures are prescription drugs whose side effects can be worse than the " +
  "problem if you dose them blind.";

PT.counters = [
  {
    id: "estrogen", name: "High estrogen / gyno", icon: "venus",
    compounds: ["testosterone", "dianabol", "anadrol", "nandrolone"],
    what: "Aromatizing compounds convert testosterone into estradiol. Too much brings bloat, high blood pressure, mood swings and breast tissue growth — and once gyno becomes established fibrous tissue, only surgery removes it.",
    first: [
      "Lower the dose — aromatization is dose-dependent, and this is the actual fix rather than a workaround.",
      "Lose body fat: fat tissue contains aromatase, so a leaner person converts less.",
      "Cut alcohol, which raises estrogen and loads the liver.",
    ],
    otc: [
      { name: "DIM / calcium-D-glucarate", note: "Mild support for estrogen metabolism. Evidence is thin — do not rely on it to control real gyno." },
      { name: "Zinc", note: "Supports healthy androgen function generally." },
    ],
    rx: [
      { name: "Aromatase inhibitor (anastrozole, exemestane)", note: "Lowers estradiol directly and works well. The mistake is dosing it blind — see below." },
      { name: "SERM (tamoxifen, raloxifene)", note: "Blocks estrogen at breast tissue and can reverse early gyno without flattening estradiol everywhere. Often the better choice for gyno specifically." },
    ],
    avoid: [
      "Taking an AI \"just in case\" from day one — crushing estrogen is its own harm, and a common one.",
      "Dosing an AI off how you feel. High and low estrogen symptoms overlap heavily; use a sensitive estradiol assay.",
      "Ignoring a tender lump for months. Early is drug-treatable; established is surgical.",
    ],
  },
  {
    id: "lowE2", name: "Estrogen crushed too low", icon: "down",
    compounds: ["testosterone", "masteron", "winstrol", "anavar"],
    what: "Usually self-inflicted with an aromatase inhibitor. Estrogen is not the enemy — you need it for joints, mood, libido, bone and lipids. Low estrogen feels worse than slightly high estrogen, and does more long-term damage.",
    first: [
      "Stop or reduce the aromatase inhibitor. It reverses over days to a couple of weeks.",
      "Re-test with a sensitive estradiol assay before changing anything again.",
    ],
    otc: [
      { name: "Fish oil + collagen", note: "Helps the aching joints while estradiol recovers — doesn't fix the cause." },
    ],
    rx: [
      { name: "Adjusting the AI with a doctor", note: "Many people on a sane testosterone dose need no AI at all." },
    ],
    avoid: [
      "Adding more AI because the symptoms \"feel like high estrogen\". Flat mood, dead libido, aching joints and night sweats occur at BOTH ends — this is the single most common self-inflicted mistake in this space. Test, don't guess.",
    ],
  },
  {
    id: "prolactin", name: "High prolactin", icon: "flask",
    compounds: ["nandrolone", "trenbolone"],
    what: "19-nor compounds raise prolactin, which brings sexual dysfunction, low mood, and occasionally nipple discharge.",
    first: [
      "Lower the dose or drop the 19-nor.",
      "Make sure there's adequate testosterone/DHT alongside it — a lot of \"prolactin\" problems are actually not enough androgen.",
    ],
    otc: [
      { name: "Vitamin B6 as P5P", note: "~100–200 mg. Mild, cheap and commonly used. Don't megadose indefinitely — chronic very high B6 can cause nerve damage." },
    ],
    rx: [
      { name: "Cabergoline", note: "Effective dopamine agonist.", caution: "Not a casual supplement: nausea, blood-pressure drops, and at higher or chronic doses genuine concerns about heart-valve changes and impulse-control problems (compulsive gambling, spending, sexual behaviour). Test prolactin first and involve a doctor." },
    ],
    avoid: [
      "Running cabergoline preventatively without ever testing prolactin.",
      "Blaming prolactin when the real culprit is crushed estrogen or no DHT.",
    ],
  },
  {
    id: "hematocrit", name: "Thick blood (high hematocrit)", icon: "drop",
    compounds: ["testosterone", "boldenone", "trenbolone"],
    what: "More red cells means thicker blood, which raises the risk of clots, stroke and heart attack. It's silent — you find it on a blood test, not by feel.",
    first: [
      "Hydrate properly and consistently — dehydration concentrates it further.",
      "Lower the dose, and consider more frequent smaller injections rather than large spikes.",
      "Do cardio, stop nicotine, and get sleep apnea treated if you have it — all three drive it up.",
    ],
    otc: [
      { name: "Omega-3", note: "Modest help with blood viscosity and cardiovascular risk." },
      { name: "Electrolytes / water", note: "Keeps plasma volume up." },
    ],
    rx: [
      { name: "Blood donation or therapeutic phlebotomy", note: "The actual fix — it directly removes red cells. Many clinicians act somewhere around 52–54% hematocrit; agree your threshold with a doctor." },
    ],
    avoid: [
      "Treating aspirin as a substitute for actually lowering hematocrit.",
      "Donating every few weeks without checking ferritin — you can swing into iron deficiency, which has its own miserable symptoms.",
    ],
    red: "Chest pain, sudden breathlessness, one-sided leg swelling or stroke symptoms — that's an emergency, not a bloodwork problem.",
  },
  {
    id: "bp", name: "High blood pressure", icon: "gauge",
    compounds: ["anadrol", "trenbolone", "dianabol", "testosterone", "boldenone"],
    what: "The most consistently damaging and most ignored side effect. It's symptomless until it isn't, and it quietly damages heart, kidneys, eyes and brain.",
    first: [
      "Real cardio, several times a week — the single biggest lever you have.",
      "Buy a home cuff and actually use it. You cannot manage what you don't measure.",
      "Lower the dose, reduce sodium moderately, drop stimulants and pre-workout, fix sleep.",
    ],
    otc: [
      { name: "L-Citrulline", note: "~6–8 g, supports vasodilation." },
      { name: "Magnesium", note: "~200–400 mg." },
      { name: "Omega-3 + potassium-rich food", note: "Both help modestly and stack with the above." },
      { name: "Taurine", note: "~3–5 g, some blood-pressure benefit." },
    ],
    rx: [
      { name: "ARBs (e.g. telmisartan) or nebivolol", note: "Commonly prescribed, generally well tolerated by lifters, and a doctor should pick which. Treating high BP properly is one of the highest-value things you can do." },
    ],
    avoid: [
      "Waiting for symptoms before treating it.",
      "Recreational diuretics to 'drop water and pressure' — electrolyte crashes from this have killed bodybuilders.",
      "Non-selective beta blockers, which flatten performance and are rarely the right pick here.",
    ],
    red: "Very high readings with headache, chest pain, visual change or breathlessness — get urgent care.",
  },
  {
    id: "lipids", name: "Wrecked cholesterol", icon: "heart",
    compounds: ["winstrol", "superdrol", "anadrol", "dianabol", "turinabol", "anavar", "masteron", "trenbolone"],
    what: "AAS flatten HDL and push LDL/ApoB up — orals worst of all. This is the mechanism behind the long-term heart risk, and it moves within weeks.",
    first: [
      "Drop or shorten the oral. Nothing else you can do comes close to this.",
      "Cardio, and swap saturated fat for mono/polyunsaturated.",
    ],
    otc: [
      { name: "Omega-3", note: "~3–4 g EPA+DHA — the front-line supplement here." },
      { name: "Citrus bergamot", note: "~500–1,000 mg. One of the few with human data for nudging LDL down and HDL up." },
      { name: "Psyllium / soluble fiber", note: "~5–10 g, binds cholesterol in the gut." },
    ],
    rx: [
      { name: "Statin / ezetimibe", note: "A doctor's call if lipids stay bad off-cycle. Note statins deplete CoQ10 — supplement it if you're put on one." },
    ],
    avoid: [
      "Believing a supplement stack makes a harsh oral cardiovascularly safe. It blunts the damage; it does not prevent it.",
    ],
  },
  {
    id: "liver", name: "Liver stress", icon: "liver",
    compounds: ["dianabol", "anadrol", "winstrol", "anavar", "superdrol", "turinabol"],
    what: "17-alpha-alkylated orals back up bile flow and stress liver cells. Superdrol and Anadrol are the worst offenders, with documented cases of real liver injury.",
    first: [
      "Shorten the run and lower the dose — most harm-reduction guidance caps orals around 4–6 weeks.",
      "Never run two 17aa orals at once. That's doubling the toxicity, not adding to it.",
      "Zero alcohol, and go easy on paracetamol/acetaminophen.",
    ],
    otc: [
      { name: "TUDCA", note: "~500–1,000 mg daily while dosing an oral — the community standard for keeping bile moving." },
      { name: "NAC", note: "~600–1,200 mg, glutathione precursor." },
    ],
    rx: [
      { name: "None — stopping is the treatment", note: "If liver enzymes or bilirubin are climbing, the intervention is discontinuing the oral, not adding another pill." },
    ],
    avoid: [
      "Treating TUDCA as a licence to run a hepatotoxic oral longer or harder.",
      "Cheap \"liver support\" blends with token doses of everything.",
      "Judging your liver by how you feel — enzymes climb silently.",
    ],
    red: "Yellow eyes or skin, very dark urine, pale stools, pain under the right ribs — stop and get seen the same day.",
  },
  {
    id: "hairloss", name: "Hair loss", icon: "scissors",
    compounds: ["masteron", "winstrol", "anavar", "testosterone", "trenbolone", "primobolan"],
    what: "Androgens accelerate male-pattern baldness in people genetically prone to it. What's lost is generally gone — prevention massively beats rescue here.",
    first: [
      "If you're genetically prone, avoid or minimise the strongly DHT-derived compounds (Masteron, Winstrol, Anavar, Primobolan).",
      "Lower the dose — this is dose-responsive like everything else.",
    ],
    otc: [
      { name: "Topical minoxidil 5%", note: "Well-established, works while you keep using it." },
      { name: "Ketoconazole 2% shampoo", note: "Modest anti-androgenic effect at the scalp." },
      { name: "Microneedling", note: "Some decent evidence as an adjunct to minoxidil." },
    ],
    rx: [
      { name: "Finasteride / dutasteride", note: "Blocks the conversion of testosterone to DHT.", caution: "Two big caveats. It does nothing against compounds that aren't DHT-derived — trenbolone and nandrolone hit the receptor directly, so finasteride will not save your hair on those. And a minority report sexual and mood side effects that can persist after stopping. Topical finasteride may reduce systemic exposure. Think it through rather than panic-starting mid-cycle." },
    ],
    avoid: [
      "Expecting finasteride to protect you on trenbolone — it won't.",
      "Starting three treatments at once mid-cycle, so you can't tell what did what.",
    ],
  },
  {
    id: "acne", name: "Acne & oily skin", icon: "spots",
    compounds: ["testosterone", "trenbolone", "dianabol", "anadrol"],
    what: "Androgens drive sebum production. Usually manageable — but cystic acne scars permanently, so acting early matters.",
    first: [
      "Shower straight after training, change pillowcases often, don't pick.",
      "Lower the dose and get estradiol in a sane range.",
    ],
    otc: [
      { name: "Benzoyl peroxide 2.5–5%", note: "First-line and cheap." },
      { name: "Salicylic acid wash", note: "Keeps pores clear, good for back and chest." },
      { name: "Adapalene (topical retinoid)", note: "Over the counter in many countries and genuinely effective." },
      { name: "Zinc", note: "Modest help." },
    ],
    rx: [
      { name: "Topical/oral antibiotics, or isotretinoin for severe cystic acne", note: "Isotretinoin works.", caution: "It also raises lipids and stresses the liver — exactly the two things a cycle is already doing — and carries mood and pregnancy risks. Needs proper medical supervision, and your doctor needs to know what else you're taking." },
    ],
    avoid: [
      "Letting cystic lesions run for months. Scarring doesn't reverse.",
    ],
  },
  {
    id: "cramps", name: "Muscle cramps", icon: "bolt",
    compounds: ["trenbolone", "winstrol", "anadrol"],
    what: "Brutal, sudden cramping — classically on trenbolone and stanozolol, and worse if you're dieting or sweating heavily.",
    first: [
      "Hydrate seriously and don't strip electrolytes while dieting.",
      "Warm up properly; ease back on volume if calves and hamstrings keep seizing.",
    ],
    otc: [
      { name: "Taurine", note: "~3–5 g daily — the standard answer, and it works for most people." },
      { name: "Magnesium glycinate", note: "~200–400 mg in the evening." },
      { name: "Sodium + potassium", note: "Don't over-restrict salt while sweating hard." },
    ],
    rx: [{ name: "None needed", note: "If cramping is severe and constant, it's a signal to lower the dose." }],
    avoid: ["Assuming it's purely dehydration — these compounds cause it directly too."],
  },
  {
    id: "joints", name: "Dry, painful joints", icon: "bone",
    compounds: ["winstrol", "masteron", "anavar", "trenbolone"],
    what: "Drying compounds and low estrogen leave joints and tendons feeling grating and unlubricated — and meaningfully raise tear risk while you feel strongest.",
    first: [
      "Don't crush estradiol. Low E2 is the most common cause of \"Winstrol joints\", and people blame the compound.",
      "Don't chase heavy PRs while dry — this is how tendons rupture.",
    ],
    otc: [
      { name: "Fish oil", note: "~3–4 g, joint and lipid support in one." },
      { name: "Collagen + vitamin C", note: "~10–15 g with vitamin C, 30–60 min before training." },
      { name: "Glucosamine / hydration", note: "Modest, but cheap and low risk." },
    ],
    rx: [{ name: "Physio for an actual injury", note: "Pain that's sharp, localised and doesn't settle is an injury, not dryness." }],
    avoid: ["Painkillers so you can train through it — that's how a niggle becomes a rupture."],
  },
  {
    id: "sleep", name: "Insomnia & night sweats", icon: "moon",
    compounds: ["trenbolone", "mk677", "boldenone"],
    what: "Trenbolone is notorious for wrecking sleep and soaking the sheets. Chronic sleep loss then makes blood pressure, mood, insulin sensitivity and recovery all worse — it compounds.",
    first: [
      "Lower the dose. Tren insomnia is dose-dependent, and no supplement out-competes this.",
      "Cool, dark room; no stimulants after midday; consistent bed and wake times.",
    ],
    otc: [
      { name: "Magnesium glycinate", note: "~200–400 mg in the evening." },
      { name: "Glycine", note: "~3 g before bed." },
      { name: "L-theanine", note: "~200 mg, takes the edge off." },
      { name: "Melatonin", note: "0.3–1 mg. Low doses work better than the large ones sold everywhere." },
    ],
    rx: [
      { name: "Sedatives", note: "A poor long-term answer with real dependence risk. If you need them to sleep through a cycle, the cycle is the problem." },
    ],
    avoid: [
      "Alcohol as a sleep aid — it fragments sleep and stacks liver load.",
      "Pushing through days without sleep. That's the compound telling you to come down.",
    ],
  },
  {
    id: "libido", name: "Sexual dysfunction", icon: "heart-crack",
    compounds: ["nandrolone", "trenbolone", "masteron", "testosterone"],
    what: "\"Deca dick\" and its relatives. Almost always one of four things: estradiol too low, estradiol too high, prolactin high, or not enough androgen/DHT alongside a 19-nor.",
    first: [
      "Get bloods before changing anything — estradiol (sensitive), prolactin, total and free testosterone. Guessing here usually makes it worse.",
      "Run adequate testosterone alongside a 19-nor. A lot of cases are simply this.",
    ],
    otc: [{ name: "Nothing reliable", note: "This is a hormone problem, not a supplement one." }],
    rx: [
      { name: "PDE5 inhibitors (tadalafil, sildenafil)", note: "Treat the symptom effectively; tadalafil also has blood-pressure and prostate benefits." },
      { name: "Cabergoline, or adjusting the AI", note: "Only once bloods show prolactin or estradiol is actually the problem." },
    ],
    avoid: ["Stacking three fixes at once so you learn nothing about the cause."],
  },
  {
    id: "glucose", name: "Blood sugar & insulin resistance", icon: "sugar",
    compounds: ["hgh", "mk677", "insulin", "ipamorelin"],
    what: "Growth hormone and MK-677 push blood glucose up and insulin sensitivity down. Left unchecked over years this is a genuine diabetes risk.",
    first: [
      "Cardio — the strongest non-drug lever on insulin sensitivity.",
      "Lower the GH dose and aim for a sane IGF-1 rather than chasing a big number.",
      "Fibre and protein before carbs at meals; cut liquid sugar.",
    ],
    otc: [
      { name: "Soluble fiber", note: "Blunts glucose spikes." },
      { name: "Berberine", note: "Works — but it's pharmacologically active, so treat it like a drug and don't combine with metformin without medical advice." },
      { name: "Magnesium + omega-3", note: "Both support insulin sensitivity modestly." },
    ],
    rx: [{ name: "Metformin", note: "A doctor's call, and a reasonable one if fasting glucose or HbA1c is drifting." }],
    avoid: ["Ignoring a rising fasting glucose because you feel fine — you won't feel this one until it's advanced."],
    red: "On insulin: confusion, seizure or unconsciousness is a life-threatening emergency, not a monitoring issue.",
  },
  {
    id: "atrophy", name: "Testicular atrophy & shutdown", icon: "tri-down",
    compounds: ["testosterone", "nandrolone", "trenbolone", "boldenone", "dianabol", "anadrol", "winstrol", "anavar", "masteron", "primobolan", "superdrol", "turinabol"],
    what: "Expected on every AAS — external androgen switches off the signal to your testicles, so they shrink and sperm production falls, often to zero.",
    first: [
      "Shorter, lower cycles recover far more reliably than long heavy ones.",
      "Decide your exit plan before you start, not after.",
    ],
    otc: [{ name: "Nothing", note: "No supplement prevents suppression. Anyone selling you one is lying." }],
    rx: [
      { name: "hCG", note: "Low-dose on-cycle hCG mimics LH and keeps the testes responsive, which can ease recovery and help preserve fertility. Badly run it can desensitize the testes and spike estrogen — worth a doctor's input rather than a forum protocol." },
    ],
    avoid: [
      "Assuming shrinkage means permanent infertility — it usually recovers.",
      "Assuming it's harmless — see the Coming off & PCT section for what recovery actually involves.",
    ],
  },
  {
    id: "appetite", name: "Appetite loss & nausea", icon: "ban",
    compounds: ["anadrol", "superdrol", "semaglutide", "tirzepatide", "melanotan2", "trenbolone"],
    what: "Two very different causes: harsh orals that make food unappealing, and GLP-1s that are supposed to. Either way the risk is the same — losing muscle and falling short on micronutrients.",
    first: [
      "Smaller, more frequent meals; eat slowly; avoid large greasy meals on a GLP-1.",
      "Liquid calories when solid food is a struggle — shakes still count.",
      "On GLP-1s, slow the dose escalation. Most nausea is titration going too fast.",
    ],
    otc: [
      { name: "Protein powder", note: "The priority — protect muscle at ~1.6–2.2 g/kg even when eating little." },
      { name: "Ginger", note: "Genuinely helps nausea." },
      { name: "Multivitamin + B12 + electrolytes", note: "Backfills what a much smaller intake stops delivering." },
    ],
    rx: [{ name: "Anti-nausea medication", note: "Available if it's severe, but slowing the titration usually solves it." }],
    avoid: ["Simply eating almost nothing because you're not hungry — that's how a fat-loss phase becomes muscle loss."],
    red: "Severe unrelenting abdominal pain boring through to the back means possible pancreatitis — urgent.",
  },
  {
    id: "pip", name: "Injection pain (PIP)", icon: "syringe",
    compounds: ["testosterone", "nandrolone", "trenbolone", "masteron", "primobolan", "boldenone", "winstrol"],
    what: "Post-injection pain. Ordinary soreness for a day or two is normal; severe, repeated PIP usually points at the oil, the concentration or the technique rather than at you.",
    first: [
      "Warm the vial in your hands and inject slowly.",
      "Split larger volumes across two sites, and move gently afterwards — walking helps disperse it.",
      "Warm compress after; rotate sites so you're not hitting scar tissue.",
    ],
    otc: [{ name: "Heat + gentle movement", note: "More effective than anything you can swallow." }],
    rx: [{ name: "Not usually needed", note: "Persistent severe PIP from one source is a sourcing problem — high benzyl alcohol, high concentration, or poorly filtered gear." }],
    avoid: ["Assuming all PIP is normal. If it's getting worse rather than better after 48 hours, think infection."],
    red: "Spreading redness, heat, a hard or growing lump, fever or red streaks — that's a possible abscess and needs a doctor today.",
  },
  {
    id: "kidney", name: "Kidney strain", icon: "kidney",
    compounds: ["trenbolone", "testosterone", "boldenone", "anadrol"],
    what: "High blood pressure, thick blood, dehydration and very high protein all load the kidneys. Trenbolone has a particular reputation for it.",
    first: [
      "Hydrate properly — the simplest and most effective thing here.",
      "Control blood pressure. It's the main driver of kidney damage in this population.",
      "Keep protein sensible rather than extreme, and avoid routine NSAIDs (ibuprofen, naproxen) which are hard on kidneys.",
    ],
    otc: [
      { name: "Electrolytes + water", note: "Maintains perfusion." },
      { name: "NAC", note: "Antioxidant support." },
      { name: "Citrulline", note: "Indirect help via blood pressure." },
    ],
    rx: [{ name: "Blood-pressure treatment", note: "Managing hypertension properly is the single best thing you can do for your kidneys." }],
    avoid: [
      "Judging kidney function by creatinine alone — it reads high in muscular people and causes needless panic. Ask for cystatin C and eGFR.",
    ],
    red: "Passing very little urine, swelling in the ankles or face, or ongoing flank pain — get checked.",
  },
  {
    id: "mood", name: "Mood, aggression & anxiety", icon: "brain",
    compounds: ["trenbolone", "boldenone", "anadrol", "nandrolone"],
    what: "Irritability, anxiety, low mood, rage. Trenbolone is the worst offender and boldenone is known for anxiety — and the crash coming off is its own high-risk window.",
    first: [
      "Lower the dose or drop the compound. This is the fix; everything else is management.",
      "Protect sleep and keep doing cardio — both do more for mood than any supplement here.",
      "Tell someone close to you what you're taking, so they can flag changes you can't see in yourself.",
    ],
    otc: [
      { name: "Magnesium + omega-3", note: "Both have reasonable mood and stress support." },
      { name: "Ashwagandha", note: "Helps some people, but it blunts cortisol and a number of users report emotional flatness; rare liver issues reported. Not a default." },
    ],
    rx: [{ name: "Actual mental health support", note: "If you're struggling, this is worth far more than a supplement stack. Being honest about what you're taking helps them help you." }],
    avoid: [
      "Dismissing it as \"just tren\" and pushing through. Feeling mentally unwell is a real side effect and a legitimate reason to stop.",
    ],
    red: "Thoughts of suicide or self-harm — treat that as an emergency and get help today.",
  },
  {
    id: "water", name: "Water retention & bloat", icon: "waves",
    compounds: ["dianabol", "anadrol", "testosterone", "hgh", "mk677"],
    what: "Mostly estrogen-driven on aromatizing compounds, and dose-related on GH and MK-677. Cosmetically annoying, but it also drives up blood pressure, which is the part that matters.",
    first: [
      "Get estradiol into a sane range — not zero.",
      "Drink more water, not less. Restricting fluid makes retention worse.",
      "Moderate sodium rather than eliminating it, and do cardio.",
    ],
    otc: [
      { name: "Potassium-rich food", note: "Helps balance sodium." },
      { name: "Dandelion root", note: "Very mild and heavily overhyped — don't expect much." },
      { name: "Magnesium", note: "Supports fluid balance." },
    ],
    rx: [
      { name: "Prescription diuretics", note: "Effective and genuinely dangerous.", caution: "Recreational diuretic use has killed bodybuilders through electrolyte and cardiac events. This is not a cosmetic tool for a beach weekend — and never one to use without medical supervision." },
    ],
    avoid: ["Hard diuretics to look drier. This is one of the few things in this space that kills otherwise healthy people quickly."],
  },
];

/* reverse index: compound id -> counters that apply to it */
PT.countersByCompound = {};
PT.counters.forEach((k) =>
  k.compounds.forEach((cid) => {
    (PT.countersByCompound[cid] = PT.countersByCompound[cid] || []).push(k.id);
  })
);
PT.counterById = {};
PT.counters.forEach((k) => (PT.counterById[k.id] = k));

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
