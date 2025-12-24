# STYLE.md — Narrative & Documentation Style Guide
**Scope:** Applies to all fiction and docs in this repo. Enforce via review.

## 0) North Star
Precise, restrained, consequence-driven prose that treats **memory as gravity** and **forgetting as entropy**. Avoid spectacle. Earn emotion through cost.

---

## 1) Narrative Voice & Tone (Fiction)
- **Voice:** Lyrical but technical; clean lines; subtext > exposition.
- **Mood:** Elegiac, intimate, morally weighty.
- **Distance:** Close-limited POV (when possible). Report only what a trained observer would notice.
- **Humor:** Rare, dry, pressure-release only.
- **Tension:** Derives from tradeoffs—what must be spent to hold reality together.

### Do
- “Rails thrummed. Meaning held.”  
- “He checked the knot. It did not answer.”

### Don’t
- “The corridor was crazy and everyone panicked!!!”

---

## 2) Diction & Syntax
- Nouns > adjectives. Verbs that imply physics (“bind,” “shear,” “ravel,” “thicken,” “drift”).
- Short declarative cores; periodic sentences sparingly for emphasis.
- Metaphors: physical and mechanical; avoid mystical vagueness.

---

## 3) Metaphysics Handling
- Treat memory like an **operational field**—observable, measurable, and costly.
- Never add new laws in fiction text. Use existing canon terms.
- When in doubt, **invoke known documents** (Memory Physics, Corridor Mechanics, Anchor Theory).

---

## 4) Exposition & World Info
- Show procedures and effects; avoid infodumps.
- One concrete, sensory sign of metaphysics per scene (e.g., hand slipping from solidity).
- If a reader needs a rule, give **one** clean sentence and move on.

---

## 5) Dialogue
- Tight, purposeful. Subtext carries emotion.
- Technical talk should be specific and understated (no techno-babble).
- Use beats that reflect **coherence checks** (anchor recitations, audits, reliquary tuning).

---

## 6) Pacing & Structure
- Enter late, exit early.  
- Scene spine: **Situation → Costed Action → Irreversible Change**.
- Each scene should alter either: anchor integrity, corridor stability, or relationship gravity.

---

## 7) Imagery & Sensory Rules
- Prefer tactile/kinetic cues: vibration, weight, pressure, misalignment.
- Avoid color catalogs. Use 1–2 concrete details to ground the set.

---

## 8) Technical Language
- Use canonical terms exactly as in `/data/lexicon/terms.yaml` and `/lexicon/LINK_MAP.md`.
- Keep units qualitative unless an existing doc defines a metric.
- Never invent pseudo-equations in prose. Equations live in mechanics docs only.

---

## 9) Formatting (Markdown)
- `#` H1 for document titles only (one per file). Sections use `##`/`###`.
- Hard-wrap at ~100 chars when practical; no trailing spaces.
- Link internal refs relatively: `../mechanics/ANCHOR_THEORY.md#2-types-of-anchors`.
- Code fences only for commands, configs, or quoted protocol text.
- Avoid inline HTML.

---

## 10) Capitalization & Terminology
- Proper nouns: **Heliodrome**, **Canticle Fleet**, **Archivist Orders**.
- Common mechanics lower-case unless a proper noun: **memory drive**, **corridor**, **eddy**.
- Do not create synonyms for canon terms (e.g., don’t call eddies “whorls”).

---

## 11) Numbers, Time, Measures
- Prefer qualitative time cues (“three pulls,” “post-run”) over clocks unless canon demands.
- Distances: use AU / meters only if already in mechanics; else keep descriptive.

---

## 12) Prohibited Moves
- Restoring burned anchors (hard no).
- Deus ex machina that bypasses memory cost.
- Quippy banter under existential pressure.
- “As you know” exposition.
- New factions/tech without prior doc PR.

---

## 13) Quick Tone Checklist (before PR)
- [ ] Cost is visible on-page.
- [ ] One physicalized sign of coherence/decay.
- [ ] No new metaphysics introduced.
- [ ] Dialogue minimal, purposeful, subtextual.
- [ ] Ending changes state (stakes, identity, or structure).

---

## 14) Micro Examples

**Good:**  
> The ring cooled against her scalp. She counted the knots. Fifteen answered.

**Bad:**  
> The device activated and a lot of crazy stuff happened that can’t be explained here.
