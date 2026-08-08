/* ============================================================================
   PepTalk — brain
   Local intent matching over the knowledge base + a consolidated "support plan"
   builder for a stack, plus an optional Claude hookup that stays grounded in
   the same harm-reduction framing.
   ========================================================================== */

const Brain = (() => {
  const norm = (s) => (s || "").toLowerCase().trim();

  // common English words that shouldn't identify a compound
  const STOP = new Set([
    "how", "the", "and", "for", "what", "are", "you", "should", "take", "protect",
    "support", "need", "want", "make", "safe", "safer", "help", "about", "with",
    "this", "that", "cycle", "blood", "work", "test", "when", "from", "have",
    "does", "dose", "which", "best", "good", "also", "more", "some", "before",
    "after", "during", "vitamin", "vitamins", "supplement", "supplements",
    "reduce", "harm", "risk", "side", "effect", "effects",
  ]);

  // common short / slang aliases the substring search would otherwise miss
  const ALIAS = {
    gh: "hgh", hgh: "hgh", eq: "boldenone", npp: "nandrolone", deca: "nandrolone",
    dbol: "dianabol", dianabol: "dianabol", tbol: "turinabol", var: "anavar",
    winny: "winstrol", tren: "trenbolone", sust: "testosterone", test: "testosterone",
    mast: "masteron", primo: "primobolan", sdrol: "superdrol", sema: "semaglutide",
    tirz: "tirzepatide", mt2: "melanotan2", mtii: "melanotan2", mk677: "mk677",
    ibutamoren: "mk677", bpc: "bpc157", ipam: "ipamorelin",
  };

  /* --- fuzzy-ish compound resolver --------------------------------------- */
  function findCompound(text) {
    const t = norm(text);
    // punctuation-stripped tokens
    const tokens = t
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/[\s]+/)
      .filter(Boolean);

    // exact alias match on any token
    for (const tok of tokens) if (ALIAS[tok]) return PT.byId[ALIAS[tok]];

    // exact-ish id/name/aka contains (whole query)
    for (const c of PT.compounds) {
      const hay = [c.id, c.name, c.aka].map(norm).join(" | ");
      if (t.length >= 3 && hay.includes(t)) return c;
    }
    // token scoring against name/aka/id (skip common words so e.g. "protect"
    // doesn't false-match "Body Protection Compound")
    let best = null,
      bestScore = 0;
    const scoreTokens = tokens.filter((w) => w.length >= 3 && !STOP.has(w));
    for (const c of PT.compounds) {
      const hay = norm([c.name, c.aka, c.id].join(" "));
      let score = 0;
      for (const tok of scoreTokens) if (hay.includes(tok)) score += tok.length;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return bestScore >= 3 ? best : null;
  }

  // Topic answers for concerns that the countermeasure index doesn't own.
  // Anything that maps to a named side effect lives in PT.counters instead —
  // one source of truth, so the two can't drift apart.
  const TOPICS = [
    { rx: /muscle loss|lose muscle|preserve muscle|keep muscle/, sups: ["protein", "multivit", "b12", "electrolytes"],
      lead: "For keeping muscle & nutrition on GLP-1 weight-loss peptides:",
      tail: "Hit ~1.6–2.2 g protein/kg, keep lifting, and backfill micronutrients since you're eating much less." },
  ];

  /* --- consolidate a set of compounds into one support plan -------------- */
  function buildPlan(ids) {
    const chosen = ids.map((id) => PT.byId[id]).filter(Boolean);
    if (!chosen.length) return null;

    // Supplements: merge, collect the per-compound reasons
    const supMap = new Map();
    chosen.forEach((c) =>
      c.support.forEach(({ id, note }) => {
        if (!supMap.has(id)) supMap.set(id, { id, forCompounds: [] });
        supMap.get(id).forCompounds.push({ compound: c.name, note });
      })
    );
    const supplements = [...supMap.values()].sort(
      (a, b) => b.forCompounds.length - a.forCompounds.length
    );

    // Countermeasures: which side effects this stack can bring, and from what
    const ctrMap = new Map();
    chosen.forEach((c) =>
      (PT.countersByCompound[c.id] || []).forEach((kid) => {
        if (!ctrMap.has(kid)) ctrMap.set(kid, new Set());
        ctrMap.get(kid).add(c.name);
      })
    );
    const counters = [...ctrMap.entries()]
      .map(([id, set]) => ({ id, forCompounds: [...set] }))
      .sort((a, b) => b.forCompounds.length - a.forCompounds.length);

    // Labs: union, track which compounds ask for each
    const labMap = new Map();
    chosen.forEach((c) =>
      c.labs.forEach((id) => {
        if (!labMap.has(id)) labMap.set(id, new Set());
        labMap.get(id).add(c.name);
      })
    );
    const labs = [...labMap.entries()]
      .map(([id, set]) => ({ id, forCompounds: [...set] }))
      .sort((a, b) => b.forCompounds.length - a.forCompounds.length);

    // Warnings: keep them attributed
    const warnings = [];
    chosen.forEach((c) =>
      c.warnings.forEach((w) => warnings.push({ compound: c.name, text: w }))
    );

    // Flags that change the whole plan
    const flags = [];
    const hasOral = chosen.some((c) => c.group === "Oral (17aa)");
    const oralCount = chosen.filter((c) => c.group === "Oral (17aa)").length;
    const hasSevere = chosen.some((c) => c.severity === "severe");
    const raisesHct = chosen.some((c) =>
      ["testosterone", "boldenone", "trenbolone"].includes(c.id)
    );
    const glucose = chosen.some((c) =>
      ["hgh", "mk677", "ipamorelin", "insulin"].includes(c.id)
    );
    if (oralCount >= 2)
      flags.push({
        level: "severe",
        text: "You've selected two or more oral 17aa compounds. Stacking orals multiplies liver toxicity — most harm-reduction guidance says never run two orals at once.",
      });
    else if (hasOral)
      flags.push({
        level: "high",
        text: "An oral 17aa compound is in this stack — keep it short (~4–6 weeks), skip alcohol, run TUDCA, and get a mid-cycle liver panel.",
      });
    if (raisesHct)
      flags.push({
        level: "high",
        text: "One or more compounds here raise hematocrit (blood thickness). Check CBC regularly, stay hydrated, and be ready to donate blood if it climbs.",
      });
    if (glucose)
      flags.push({
        level: "high",
        text: "This stack affects blood sugar / insulin. Monitor fasting glucose and HbA1c; insulin misuse specifically can be fatal.",
      });
    if (hasSevere)
      flags.push({
        level: "severe",
        text: "This stack contains a compound rated 'severe' risk. Reconsider whether the trade-off is worth it, and don't run it as a beginner.",
      });

    return { chosen, supplements, labs, warnings, flags, counters };
  }

  /* --- local answer engine ------------------------------------------------ */
  function answerLocal(input) {
    const t = norm(input);

    // urgent symptoms — these jump the queue ahead of everything else
    const RED = [
      { rx: /chest pain|chest press|heart attack|pain in my arm/, name: "possible heart attack" },
      { rx: /stroke|face droop|slurred|numb on one side|worst headache/, name: "possible stroke" },
      { rx: /cough(ing)? blood|can'?t breathe|short of breath|breathless/, name: "possible clot in the lung" },
      // swelling is the hallmark — don't fire on ordinary post-training leg pain
      { rx: /(swollen|swelling)[\w\s]{0,14}(calf|leg|ankle)|(calf|leg|ankle)[\w\s]{0,14}(swollen|swelling)|\bdvt\b|blood clot/,
        name: "possible DVT" },
      { rx: /jaundice|yellow (eyes|skin)|dark urine/, name: "possible liver injury" },
      { rx: /abscess|pus|red streak|infected (site|injection)|lump.*(hot|red)/, name: "possible injection-site infection" },
      { rx: /suicid|kill myself|self.?harm|want to die/, name: "a mental health crisis" },
      { rx: /erection.*(hours|won'?t go)|priapism/, name: "priapism" },
      { rx: /passed out|unconscious|seizure|hypo(glycemi|glycaemi)/, name: "a hypoglycemic emergency" },
    ];
    const red = RED.find((r) => r.rx.test(t));
    if (red) {
      return {
        text:
          `That sounds like it could be **${red.name}** — this is not something to research, it's something to act on.\n\n` +
          `**Get medical help now.** Call emergency services if it is sudden, severe or getting worse.\n\n` +
          `Tell them exactly what you have taken, including doses. They are there to treat you, not to judge or report you — and withholding it can get you the wrong treatment.\n\n` +
          `Open **Emergency signs** in the sidebar for the full list and what to do.`,
        emergency: true,
      };
    }

    // side effect -> countermeasure
    const CTR_RX = [
      ["estrogen", /gyno|gynecomastia|bitch tit|puffy nipple|sore nipple|high e2|high estrogen|aromatiz/],
      ["lowE2", /low e2|e2 (is )?too low|estrogen (is )?too low|crushed? (my )?e(strogen|2)|killed my e(strogen|2)|no estrogen/],
      ["prolactin", /prolactin|lactat|caber|cabergoline/],
      ["hematocrit", /hematocrit|haematocrit|thick blood|donate blood|phlebotom|high (rbc|red blood)/],
      ["bp", /blood pressure|hypertens|\bbp\b|telmisartan/],
      ["lipids", /cholesterol|lipid|\bhdl\b|\bldl\b|apob/],
      ["liver", /liver|hepato|tudca|liver enzyme|alt|ast/],
      ["hairloss", /hair ?loss|balding|bald|receding|finasterid|dutasterid|minoxidil|shedding/],
      ["acne", /acne|spots|oily skin|breakout|accutane|isotretinoin/],
      ["cramps", /cramp|spasm/],
      ["joints", /joint|tendon|dry joints|ligament/],
      ["sleep", /insomnia|can'?t sleep|night sweat|sleepless/],
      ["libido", /libido|erectile|\bed\b|deca dick|sex drive|can'?t get hard/],
      ["glucose", /blood sugar|glucose|insulin resist|hba1c|diabet|metformin|berberine/],
      ["atrophy", /atroph|balls? (shrink|shrunk)|testicle|shrinkage|\bhcg\b/],
      ["appetite", /appetite|nausea|can'?t eat|no hunger|vomit/],
      ["pip", /\bpip\b|injection pain|sore after inject|painful inject/],
      ["kidney", /kidney|renal|creatinine|egfr/],
      ["mood", /mood|aggress|anger|rage|anxiety|depress|irritab/],
      ["water", /water retention|bloat|puffy|holding water|diuretic/],
    ];
    // the symptom patterns are specific enough to stand alone — only step aside
    // when the question is explicitly about ordering labs
    if (!/blood ?work|blood test|\blabs?\b|panel|get tested/.test(t)) {
      const hit = CTR_RX.find(([, rx]) => rx.test(t));
      if (hit) {
        const k = PT.counterById[hit[0]];
        const bullets = (arr) => arr.map((x) => `• ${x}`).join("\n");
        const named = (arr) =>
          arr.map((x) => `• **${x.name}** — ${x.note}${x.caution ? `\n   ⚠️ ${x.caution}` : ""}`).join("\n");
        return {
          text:
            `**${k.name}** — ${k.what}\n\n` +
            `**Free, and usually the real fix:**\n${bullets(k.first)}\n\n` +
            `**Over the counter:**\n${named(k.otc)}\n\n` +
            `**Prescription — needs a doctor:**\n${named(k.rx)}\n\n` +
            `**Don't do this:**\n${bullets(k.avoid)}` +
            (k.red ? `\n\n🚨 ${k.red}` : "") +
            `\n\nFull breakdown in **Side effects & counters** in the sidebar.`,
          counter: k.id,
        };
      }
    }

    // topic sections
    if (/inject|needle|syringe|abscess|site|sterile|reconstitut|bac ?water|subq|intramuscular/.test(t)) {
      return {
        text:
          "**Injection safety** — the short version:\n\n" +
          "• Never share needles, barrels or vials — that's how hepatitis and HIV spread.\n" +
          "• One needle, one use. Draw with one, swap to a fresh one to inject.\n" +
          "• Swab the vial top and the skin, and let the alcohol dry before you go in.\n" +
          "• Rotate sites; never inject into a lump, scar or inflamed area.\n" +
          "• Ventrogluteal (side of hip) is generally considered the safest IM site.\n" +
          "• Sharps into a sharps bin — pharmacies and needle exchanges take them free.\n\n" +
          "Spreading redness, heat, a hard lump, fever or red streaks means a possible abscess — see a doctor the same day. Open **Injection safety** in the sidebar for sites, volumes and peptide mixing.",
      };
    }
    if (/\bpct\b|post ?cycle|come off|coming off|shut ?down|suppress|recover|nolvadex|tamoxifen|clomid|clomiphene|hcg|fertility|sperm|blast and cruise/.test(t)) {
      return {
        text:
          "**Coming off** — the honest version:\n\n" +
          "Every AAS shuts down your own testosterone. You either restart your production or you replace it for life, and that's a decision worth making before the first cycle rather than after.\n\n" +
          "• Wait for the ester to clear before starting PCT — too early is wasted.\n" +
          "• SERMs (tamoxifen, clomiphene) restart the signal. They're real prescription drugs with real side effects — get them and the dosing from a doctor.\n" +
          "• Don't crush estrogen through recovery; it makes it feel far worse.\n" +
          "• Confirm recovery with bloods (LH, FSH, total testosterone) ~4–8 weeks after, not by feel.\n" +
          "• The crash is the highest-risk window for your mental health. Plan support for it.\n\n" +
          "Open **Coming off & PCT** in the sidebar for the full picture, including fertility.",
      };
    }
    if (/\b(wom[ae]n|females?|girls?|virilis\w*|viriliz\w*|she|her)\b/.test(t)) {
      const named = findCompound(t);
      return {
        text:
          (named
            ? `On **${named.name}** specifically — its card in the library is written from a male-dosing perspective, so read it alongside this.\n\n`
            : "") +
          "**For women**, the risk profile is different — and several effects are **permanent**: voice deepening, clitoral enlargement, facial/body hair, and possibly scalp hair loss. Acne, cycle disruption and mood usually reverse.\n\n" +
          "• The first sign — especially any voice change — means stop that day. Pushing through is how reversible becomes permanent.\n" +
          "• Doses are a small fraction of male doses, and testosterone/tren/Dianabol/Anadrol virilize fast.\n" +
          "• Oxandrolone is heavily counterfeited, and a fake is a virilization risk in itself.\n" +
          "• Absolute stop if pregnant or trying to conceive.\n\n" +
          "Open **Women & virilization** in the sidebar for the full breakdown.",
      };
    }

    // greetings / help
    if (/^(hi|hey|hello|yo|sup|help|what can you do)\b/.test(t)) {
      return {
        text:
          "I'm PepTalk — a harm-reduction reference for peptides and anabolic steroids. Ask me things like:\n" +
          "• “What vitamins should I take on trenbolone?”\n" +
          "• “What bloodwork do I need before a cycle?”\n" +
          "• “Tell me about semaglutide”\n" +
          "• “What protects the liver on orals?”\n\n" +
          "Or browse the library and build a stack for a consolidated support plan. None of this is medical advice — get bloodwork and see a doctor.",
      };
    }

    // labs / bloodwork question
    if (/(blood ?work|blood test|labs?|panel|monitor|get tested|test before)/.test(t)) {
      const c = findCompound(t);
      if (c) {
        const list = c.labs
          .map((id) => `• **${PT.labs[id].name}** — ${PT.labs[id].why}`)
          .join("\n");
        return {
          text: `Bloodwork to run for **${c.name}**:\n\n${list}\n\nGet a baseline before you start, monitor on-cycle, and re-check after.`,
        };
      }
      const core = ["lipids", "cbc", "liver", "hormones", "bp", "glucose", "kidney"]
        .map((id) => `• **${PT.labs[id].name}** — ${PT.labs[id].markers}`)
        .join("\n");
      return {
        text: `A solid baseline & on-cycle panel for most people:\n\n${core}\n\nRun it before, mid-cycle, and after. Bloodwork is the difference between managing risk and flying blind.`,
      };
    }

    // vitamins / supplements / support for a compound
    if (/(vitamin|supplement|deficien|take|protect|support|liver|lipid|cholesterol|joint|cramp|prolactin)/.test(t)) {
      const c = findCompound(t);
      if (c) {
        const sup = c.support
          .map((s) => {
            const S = PT.supplements[s.id];
            return `• **${S.name}** — ${s.note} (${S.dose})`;
          })
          .join("\n");
        return {
          text: `Support for **${c.name}**:\n\n${sup}\n\n_Why:_ ${c.depletes}\n\nThis is supportive, not protective armor — dose sensibly, keep it short, and get bloodwork.`,
          compound: c,
        };
      }
      // topic-based concern (liver, lipids, cramps, hematocrit, glucose…)
      const topic = TOPICS.find((tp) => tp.rx.test(t));
      if (topic) {
        const sup = topic.sups
          .map((id) => {
            const S = PT.supplements[id];
            return `• **${S.name}** — ${S.why} (${S.dose})`;
          })
          .join("\n");
        return { text: `${topic.lead}\n\n${sup}\n\n${topic.tail}` };
      }
      // generic supplement question — maybe about a specific supplement
      for (const [id, S] of Object.entries(PT.supplements)) {
        if (t.includes(norm(S.name.split(" ")[0])) || t.includes(id)) {
          return {
            text: `**${S.name}**\n${S.why}\n\n_Typical:_ ${S.dose}\n_Note:_ ${S.caution}`,
          };
        }
      }
    }

    // "how do I make X safer" / general about a compound (a bare name wins over a topic)
    const c = findCompound(t);
    if (c) {
      const risks = c.risks.slice(0, 3).map((r) => `• ${r}`).join("\n");
      const sup = c.support
        .slice(0, 4)
        .map((s) => `• ${PT.supplements[s.id].name}`)
        .join("\n");
      return {
        text: `**${c.name}** (${c.aka}) — _${c.klass}, ${c.severity} risk_\n\n${c.summary}\n\n**Main risks:**\n${risks}\n\n**Support stack:**\n${sup}\n\n**Labs:** ${c.labs
          .map((id) => PT.labs[id].name)
          .join(", ")}\n\nOpen its card in the library for the full breakdown, warnings and doses.`,
        compound: c,
      };
    }

    // topic concern with no specific compound (e.g. "what raises hematocrit", "protect my liver")
    {
      const topic = TOPICS.find((tp) => tp.rx.test(t));
      if (topic && !/\b(what is|tell me|about|who|history)\b/.test(t)) {
        const sup = topic.sups
          .map((id) => {
            const S = PT.supplements[id];
            return `• **${S.name}** — ${S.why} (${S.dose})`;
          })
          .join("\n");
        return { text: `${topic.lead}\n\n${sup}\n\n${topic.tail}` };
      }
    }

    // principles / general safety
    if (/(safe|safer|harm|reduce|principle|advice|start|beginner|first cycle)/.test(t)) {
      const p = PT.principles
        .slice(0, 5)
        .map((x) => `${x.icon} **${x.title}** — ${x.body}`)
        .join("\n\n");
      return {
        text: `The universal harm-reduction basics:\n\n${p}\n\nSee the Principles panel for the full list. The safest cycle is often the one you don't run.`,
      };
    }

    return {
      text:
        "I didn't quite catch which compound you mean. Try a name (e.g. “trenbolone”, “semaglutide”, “Anavar”), or ask about “bloodwork”, “liver support”, or “what to take on GH”. You can also browse the library on the left.",
      unresolved: true,
    };
  }

  /* --- optional Claude hookup -------------------------------------------- */
  async function answerClaude(input, apiKey, model) {
    const compendium = PT.compounds
      .map(
        (c) =>
          `${c.name} (${c.aka}) [${c.klass}, ${c.severity}]: ${c.summary} Support: ${c.support
            .map((s) => PT.supplements[s.id].name)
            .join(", ")}. Labs: ${c.labs.map((id) => PT.labs[id].name).join(", ")}.`
      )
      .join("\n");
    const sys =
      "You are PepTalk, a calm, non-judgmental harm-reduction guide for people using anabolic-androgenic steroids and performance/therapeutic peptides. " +
      "Your goal is to reduce harm for someone who has already decided to use — never to encourage or glamorize use, and never to shame. " +
      "Always steer toward bloodwork, medical supervision, sensible dosing, and the option of not using. Be specific about supportive supplements, " +
      "nutrient/monitoring needs, and labs. Frame any doses as commonly-reported ranges, not prescriptions. Keep answers concise and practical. " +
      "You are not a doctor and must say so when it matters. Ground yourself in this reference:\n\n" +
      compendium;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: model || "claude-opus-4-8",
        max_tokens: 900,
        system: sys,
        messages: [{ role: "user", content: input }],
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Claude ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    return (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
  }

  /* --- personal protocol: cycle phase + ester-aware timeline ------------- */
  const ESTERS = [
    { id: "oral", label: "Oral (17aa)", days: 3, hint: "clears in a few days" },
    { id: "short", label: "Short ester — propionate, acetate, NPP", days: 5, hint: "~5 days to clear" },
    { id: "long", label: "Long ester — enanthate, cypionate", days: 18, hint: "~2–3 weeks to clear" },
    { id: "verylong", label: "Very long — Deca, EQ, undecylenate", days: 40, hint: "~4–6 weeks to clear" },
  ];
  const esterDays = (id) => (ESTERS.find((e) => e.id === id) || { days: 18 }).days;
  const isSuppressive = (c) => !!c && c.klass === "Anabolic steroid";
  function defaultEster(c) {
    if (!isSuppressive(c)) return null; // peptides / GH / GLP-1 don't need SERM PCT
    if (/oral/i.test(c.route)) return "oral";
    if (c.id === "nandrolone" || c.id === "boldenone") return "verylong";
    if (c.id === "trenbolone") return "short";
    return "long";
  }

  const DAY = 86400000;
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // component arithmetic is immune to DST fall-back/spring-forward shifts
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const daysBetween = (a, b) => Math.round((midnight(b) - midnight(a)) / DAY);
  function parseISO(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d) ? null : d;
  }

  // protocol: { items:[{id,dose,ester}], start:"yyyy-mm-dd"|null, weeks:Number|null, sex:"m"|"f" }
  // todayDate: a Date (defaults handled by caller so this stays pure/testable)
  function timeline(protocol, todayDate) {
    const items = (protocol.items || []).map((it) => ({ ...it, c: PT.byId[it.id] })).filter((it) => it.c);
    const suppressive = items.filter((it) => isSuppressive(it.c));
    const hasPCT = suppressive.length > 0;
    const clearance = hasPCT
      ? Math.max(...suppressive.map((it) => esterDays(it.ester || defaultEster(it.c))))
      : 0;
    const clearedBy = suppressive
      .slice()
      .sort((a, b) => esterDays(b.ester || defaultEster(b.c)) - esterDays(a.ester || defaultEster(a.c)))[0];

    const start = parseISO(protocol.start);
    const weeks = Math.max(0, Math.min(52, Math.round(+protocol.weeks || 0)));
    if (!start || !weeks) {
      return { planning: true, hasPCT, clearance, clearedBy: clearedBy && clearedBy.c.name };
    }

    const today = midnight(todayDate || new Date());
    const end = addDays(start, weeks * 7);
    const mid = addDays(start, Math.min(Math.round((weeks * 7) / 2), 42));
    const pctStart = hasPCT ? addDays(end, clearance) : null;
    const recovery = hasPCT ? addDays(pctStart, 42) : null;

    let phase, weekNum = null, daysToStart = null;
    if (today < start) {
      phase = "before";
      daysToStart = daysBetween(today, start);
    } else if (today <= end) {
      phase = "on";
      // clamp: on the inclusive last day this would read weeks+1 ("13 of 12")
      weekNum = Math.min(weeks, Math.floor(daysBetween(start, today) / 7) + 1);
    } else if (hasPCT && today < pctStart) {
      phase = "clearing";
    } else if (hasPCT && recovery && today < recovery) {
      phase = "pct";
    } else {
      phase = "done";
    }

    const span = Math.max(1, daysBetween(start, end));
    const progress = Math.max(0, Math.min(1, daysBetween(start, today) / span));

    const iso = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : null);
    const milestones = [
      { key: "baseline", label: "Baseline bloodwork", date: addDays(start, -3), note: "Before you start — the reference point everything else is measured against.", done: today >= addDays(start, -3) },
      { key: "start", label: "Cycle start", date: start, note: `Planned ${weeks}-week run.`, done: today >= start },
      { key: "mid", label: "Mid-cycle bloodwork", date: mid, note: "Catch lipid, hematocrit and liver shifts while you can still act on them.", done: today >= mid },
      { key: "end", label: "Last dose", date: end, note: "End of the planned cycle.", done: today >= end },
    ];
    if (hasPCT) {
      milestones.push({ key: "pct", label: "Start PCT", date: pctStart, note: `After your longest ester clears (~${clearance} days${clearedBy ? `, driven by ${clearedBy.c.name}` : ""}). Too early is wasted.`, done: today >= pctStart });
      milestones.push({ key: "recovery", label: "Confirm recovery", date: recovery, note: "Re-test LH, FSH and total testosterone ~6 weeks into recovery — by bloods, not by feel.", done: today >= recovery });
    } else {
      milestones.push({ key: "post", label: "Post bloodwork", date: addDays(end, 21), note: "Re-check ~3 weeks after finishing to confirm things settled.", done: today >= addDays(end, 21) });
    }
    // next upcoming milestone
    const next = milestones.find((m) => !m.done) || null;

    return {
      planning: false, phase, weekNum, weeks, daysToStart, progress, hasPCT, clearance,
      clearedBy: clearedBy && clearedBy.c.name,
      dates: { start, mid, end, pctStart, recovery, baseline: addDays(start, -3) },
      milestones: milestones.map((m) => ({ ...m, iso: iso(m.date) })),
      next: next && { ...next, iso: iso(next.date), inDays: daysBetween(today, next.date) },
    };
  }

  const protocol = { ESTERS, esterDays, defaultEster, isSuppressive, timeline };

  /* --- blood-marker evaluation against reference ranges (pure) ------------ */
  const RANK = { ok: 0, watch: 1, low: 2, high: 2, critical: 3 };
  function markerById(id) { return (PT.markers || []).find((m) => m.id === id) || null; }
  function markerRange(m, sex) {
    if (!m) return null;
    if (sex === "f" && m.rangeF && m.rangeF.length === 2) return m.rangeF;
    if (m.rangeM && m.rangeM.length === 2) return m.rangeM;
    return m.rangeF && m.rangeF.length === 2 ? m.rangeF : null;
  }
  function evaluateMarker(id, value, sex) {
    const m = markerById(id);
    const v = +value;
    if (!m || value === "" || value == null || isNaN(v)) return null;
    let hit = null;
    (m.flags || []).forEach((f) => {
      if (f.sex && f.sex !== "any" && f.sex !== sex) return;
      const ok = f.when === "gt" ? v > f.value : f.when === "gte" ? v >= f.value
        : f.when === "lt" ? v < f.value : f.when === "lte" ? v <= f.value : false;
      if (ok && (!hit || RANK[f.level] > RANK[hit.level])) hit = f;
    });
    const range = markerRange(m, sex);
    const inRange = range ? v >= range[0] && v <= range[1] : null;
    // Flag-driven only: on cycle, several markers sit outside the normal
    // population range by design, so being out-of-band is NOT itself an alarm.
    // Only an explicit actionable threshold raises the status above "ok".
    const status = hit ? hit.level : "ok";
    return { marker: m, value: v, range, inRange, flag: hit, status };
  }
  function evaluatePanel(values, sex) {
    return Object.keys(values || {})
      .map((id) => evaluateMarker(id, values[id], sex))
      .filter(Boolean);
  }
  const markers = { byId: markerById, range: markerRange, evaluate: evaluateMarker, evaluatePanel };

  return { findCompound, buildPlan, answerLocal, answerClaude, protocol, markers };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Brain;
