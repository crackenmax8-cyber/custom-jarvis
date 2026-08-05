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

  // topic-based answers for concern questions with no specific compound
  const TOPICS = [
    { rx: /\bliver\b|hepato|17 ?aa|orals?\b/, sups: ["tudca", "nac"],
      lead: "Protecting the liver (relevant to any oral 17aa steroid):",
      tail: "Keep orals short, never run two at once, skip alcohol, and get a liver panel (AST/ALT/GGT) mid-cycle." },
    { rx: /lipid|cholesterol|hdl|ldl|artery|arterial/, sups: ["omega3", "bergamot", "fiber"],
      lead: "Protecting your lipids (AAS crush HDL and raise LDL — orals worst):",
      tail: "Do real cardio, keep saturated fat moderate, and get a lipid panel (ideally ApoB) baseline and mid-cycle." },
    { rx: /cramp|spasm/, sups: ["taurine", "magnesium", "electrolytes"],
      lead: "For the muscle cramps (classic on tren, winstrol and with creatine):",
      tail: "Hydrate well — cramps are often just dehydration plus low taurine/magnesium." },
    { rx: /joint|tendon|dry joints/, sups: ["omega3", "citrulline"],
      lead: "For dry, achy joints (especially on Winstrol / drying compounds):",
      tail: "Fish oil and hydration help; don't chase heavy PRs while your joints are dried out — tear risk is real." },
    { rx: /hematocrit|blood ?thick|rbc|red blood|donate blood|clot/, sups: ["citrulline", "omega3"],
      lead: "For high hematocrit / thick blood (testosterone, boldenone, tren):",
      tail: "Monitor CBC, stay very hydrated, and if hematocrit climbs above ~52–54% discuss donating blood / therapeutic phlebotomy with a doctor." },
    { rx: /blood ?sugar|glucose|insulin resist|diabet|hba1c/, sups: ["fiber", "omega3", "magnesium"],
      lead: "For blood-sugar / insulin sensitivity (GH, MK-677, insulin):",
      tail: "Monitor fasting glucose and HbA1c. With actual insulin, hypoglycemia can be fatal — never dose and sleep, always keep fast carbs on hand." },
    { rx: /prolactin/, sups: ["magnesium"],
      lead: "For prolactin issues (19-nors like Deca/Tren):",
      tail: "Test prolactin first. Vitamin B6 (P5P) ~100–200 mg is commonly used; cabergoline is a real medication with real side effects, not a casual add-on." },
    { rx: /muscle loss|lose muscle|preserve muscle|glp|semaglutide|ozempic|tirzep/, sups: ["protein", "multivit", "b12", "electrolytes"],
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

    return { chosen, supplements, labs, warnings, flags };
  }

  /* --- local answer engine ------------------------------------------------ */
  function answerLocal(input) {
    const t = norm(input);

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

  return { findCompound, buildPlan, answerLocal, answerClaude };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Brain;
