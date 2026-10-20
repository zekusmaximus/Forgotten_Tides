# Canon Promotion Review — 2026-10-20

Produced by `agents/canon_promotion_review_agent.md`, executed in full. No manuscript, entity, lexicon, timeline, or lore file was modified. Nothing was promoted.

## 1. Scope and baseline

- Commit: `25ac80c` (`fix(tooling): complete promotion tool, tighten continuity matching, refresh story listings (#36)`), branch `claude/optimistic-curie-v7h9zp`.
- `npm ci` then `npm run validate:ci`: PASS ("CI-parity validation passed"). All lint, check, and test scripts green.
- `npm run report:canon-tiers`: 119 rows; 86 rows lack an explicit `canon_tier` (story-0001 and story-0002 among them; story-0001 is inferred primary by path).
- `out/reports/continuity.json`: 0 hard, 0 soft. `out/reports/timeline_variance.json`: 0 hard, 92 soft, every one naming the novel's files (`stories/novel/NOVEL_FORGOTTEN_TIDES/*`); none names a story in scope.
- Stories in scope (every `stories/short_story/` manuscript whose `canon_tier` is not `primary_canon`, plus the novella story-0009): story-0002, 0003, 0004, 0005, 0006, 0007, 0008, 0009 (novella, score only), 0010, 0011, 0012, 0013, 0014, 0015, 0016, 0017, 0018, 0019, 0020, 0021. All are `canon_tier: draft` / `status: draft` except story-0002 (no `canon_tier` field) and story-0006, story-0007, story-0009, story-0018 (no `metadata.status`).
- Not in scope: story-0001 and story-0022 (primary canon, read as the exemplars).

## 2. Summary table

| ID | Title | Total /70 | Hard gates | Band | Fixes | Depends on |
|---|---|---|---|---|---|---|
| story-0002 | Memoir of a Nobody | 23 | FAIL (A: new law) | Hold, consider sandbox or deprecate | 3 | primary canon only |
| story-0003 | The Tuner of Last Lights | 48 | PASS | Hold | 7 | primary canon only |
| story-0004 | The Light Inheritance | 41 | PASS | Hold | 7 | story-0003 (severable) |
| story-0005 | The Liturgy of Rust | 12 | FAIL (A: new law) | Hold, consider sandbox or deprecate | 3 | primary canon only |
| story-0006 | The Anchorless Tide | 19 | FAIL (A: new law) | Hold, consider sandbox or deprecate | 2 | primary canon only |
| story-0007 | The Hospice Knot | 51 | PASS | Promote after fixes | 5 | primary canon only |
| story-0008 | The Reliquarist's Doubt | 60 | PASS | Promote | 5 | primary canon only |
| story-0009 | The Doctrine of Empty Stars (novella) | 52 | PASS | Promote after fixes (manual; no tool) | 6 | primary canon only |
| story-0010 | The Error That Remembered Itself | 60 | PASS | Promote | 2 | primary canon only |
| story-0011 | The Quiet Census | 62 | PASS | Promote | 3 | primary canon only |
| story-0012 | The Mercy Doctrine | 62 | PASS | Promote | 2 | primary canon only |
| story-0013 | The Smallest Burn | 66 | PASS | Promote | 3 | story-0001 |
| story-0014 | The Public Weight of a Private Lie | 63 | PASS | Promote | 3 | story-0001 |
| story-0015 | The Halix Aftermarket | 51 | PASS | Promote after fixes | 4 | story-0004 |
| story-0016 | The Lie That Learned the Hallway | 60 | PASS | Promote | 2 | story-0001, story-0014 |
| story-0017 | The Loss Ledger | 58 | PASS | Promote after fixes | 5 | story-0001 |
| story-0018 | The Navigator Who Forgot Enough | 50 | PASS | Promote after fixes | 5 | story-0001, story-0007 |
| story-0019 | The Miniaturist's Name | 60 | PASS | Promote | 2 | primary canon only |
| story-0020 | The Inventory of Absence | 41 | FAIL (novel dependency) | Hold | 2 | novel draft (undeclared) |
| story-0021 | Receipt for a Voice | 62 | PASS | Promote (bundle) | 2 | story-0001, 0004, 0013, 0015, 0017 |

Band thresholds: Promote 60 to 70; Promote after fixes 50 to 59; Hold 38 to 49; Hold, consider sandbox or deprecate 0 to 37. A hard-gate failure caps the recommendation at Hold whatever the total.

## 3. Hard-gate failures

- **story-0002** — criterion A at 0. A new law is stated in prose: COST, "It didn't erase me. It nested. I became a living eddy — localized, low-intensity, targeted"; CHOICE, "Micro-particulate eddy material, trace neurological integration." No mechanics or lore document allows eddy internalization, and `lore/SPECIES_OVERVIEW.md` section 5 says eddies are phenomena, not matter. The story's own `continuity_notes` line 4 calls the case "not replicable."
- **story-0005** — criterion A at 0. IV: "the coherence wave that blasted outward ... It shattered, dispersing into harmless mnemonic static." No canon document allows an eddy to be destroyed; `manuals/PILOT_MANUAL.md` section 5 and bible 3.5 treat eddies as attractors to be avoided or, in story-0001, made to recoil. The zero-anchor in the same scene produces no anchor burn, against `mechanics/ANCHOR_THEORY.md` section 5 ("guaranteed anchor burn").
- **story-0006** — criterion A at 0. IV: memories "liberated. Scattered like seeds ... Some would catch on other buoys, other salvagers, other minds"; I: "Freelancers didn't rate full anchor drives. Just patched harnesses and enough neural dampers"; "the Forgotten Tides" as a navigable region absent from `lore/COSMIC_REGIONS.md`; II: a "civic" anchor class absent from `mechanics/ANCHOR_THEORY.md` section 2.
- **story-0020** — dependency on the novel draft. `atlas/Heavonly.md:13` ("developed in the Forgotten Tides novel draft"), `continuity_notes` line 103 (names "planetary bleaching" and "Gorgi"), IV ("Floater."), and the novel outline (`stories/novel/NOVEL_FORGOTTEN_TIDES/outline.md:23-39`) show the setting, the floater phenomenon, and the conspiracy frame exist only in the novel draft. `references.stories` is empty, so the dependency is undeclared.

## 4. Recommended promotion order

A story appears only after every story it depends on. Items 1 to 3 repair the current state in which the primary-canon story-0022 lists four drafts in `references.stories` (story-0008, story-0012, story-0013, story-0021) and cites draft lexicon terms (term-0022 to term-0026).

1. **story-0013** (66, Promote). Depends only on story-0001; primary canon already relies on Elior Ren's eleven anchors. Fixes are three hygiene lines.
2. **story-0008** (60, Promote). Depends only on primary canon; story-0022 is set "twelve weeks after" it. Promote term-0025 and term-0026 with it.
3. **story-0012** (62, Promote). Depends only on primary canon; story-0022 treats its lamps as null-stone housings.
4. **Lexicon only, no story**: set term-0022, term-0023, term-0024 (Continuity Cleric, Liturgy of the Hull, Structural Softening) to `status: canonical` and point `canonical_source` at a lore or mechanics file. Story-0022 already uses them; their source story (story-0005) cannot be promoted.
5. **story-0011** (62, Promote). Independent.
6. **story-0014** (63, Promote), then **story-0016** (60, Promote), which depends on it.
7. **story-0010** (60, Promote). Independent.
8. **story-0019** (60, Promote). Independent.
9. **story-0007** (51, Promote after fixes), then **story-0018** (50, Promote after fixes), which depends on it. Both wait on the Solace Hospice geography decision (register C-02).
10. **story-0017** (58, Promote after fixes). Waits on the Lysa Korr anchor-count fix (R-04).
11. **Bundle: story-0004, story-0015, story-0021.** story-0021 (62) is required by primary canon but depends on story-0015 (51, after fixes) and story-0004 (41, Hold). story-0004's deficit is almost entirely hygiene (criterion F at 0, empty `cross_refs`, no `events`) plus the undocumented closed-inheritance rule (register C-04). With the listed fixes applied, its score rises into the Promote-after-fixes band (F 0 to 4, A 2 to 3, E 2 to 3 once the story-0003 reference is severed), and the bundle can go in the order 0004, 0015, 0021. The reference from story-0004 to story-0003 carries only the offstage Halix mention and should be moved from `references.stories` to `cross_refs.stories` so the bundle does not wait on story-0003.
12. **story-0009** (52, Promote after fixes). Novella; outside `promote_story.js`. Promote by hand after assembly and the lexicon and mechanics entries listed in its card.

Hold, not on the path to promotion in current form: story-0003 (48; could re-enter after its seven fixes and the hospice decision), story-0020 (41; wait for the novel), story-0005 (12; climax rewrite), story-0002 (23; premise is the new law), story-0006 (19; premise is the new law).

## 5. Cross-story contradiction register

| ID | Locations | Conflict | Primary canon favors | Proposed fix |
|---|---|---|---|---|
| C-01 | story-0002 CHOICE and COST; `lore/SPECIES_OVERVIEW.md` section 5 | Eddy as particulate matter that nests in a body vs eddies as phenomena, not organisms. | The lore. | Sandbox or deprecate story-0002, or rewrite its premise on amnesiac lightness (`lore/SPECIES_OVERVIEW.md` 4.3). |
| C-02 | story-0003 `timeline.setting` and `summary_200` ("Helios Drift"); `atlas/Solace_Hospice.md:11` and story-0007 ("Lattice Gap's outer sleeve"); story-0018 `timeline.setting` and I ("edge of the Void Regions") | The Solace Hospice (loc-0010) is placed in three regions. | The atlas (canonical, bound to story-0007). | Extend the atlas line to "orbiting the Lattice Gap's outer sleeve, where the Gap's thinning meets a zero-coherence margin of the Void Regions"; change story-0003's two fields to match. |
| C-03 | story-0003 III ("Halix moves Synod stock"); `atlas/Halix_Exchange.md`; story-0015 | Halix as a Synod channel vs Halix as rule-bound market with provenance seals. | Neither is primary; story-0022 shows Synod stones entering through a vault, not Halix. | Reconcilable as Olenne's "Sometimes"; add one atlas sentence that off-channel lots reach Halix and are refused by benches that hear the cut harmonic. |
| C-04 | story-0004 V; story-0015 `continuity_notes:90`; story-0021; `characters/Yenu_Skather-Ait.md:24`, `characters/Tess_Vlin.md:43`; term-0021 | The closed-inheritance completion (stone goes inert, memory seats in the hearer) is stated in prose and relied on by two drafts and three entity files, but term-0021 and every mechanics and lore file omit it. | No primary-canon text speaks to it; story-0022 uses light-bequests only as pledges. | Append the completion state to term-0021 and `lore/MEMORY_ECONOMY.md` 1.4 (wording in the story-0004 card), or soften story-0004 V and change story-0015's premise. |
| C-05 | story-0005 IV; `mechanics/CORRIDOR_MECHANICS.md` 5.1; bible 3.5; story-0001 III and IV | A zero-anchor's "coherence wave" shatters an eddy vs eddies that are avoided or recoil. | Mechanics and bible. | Rewrite story-0005 IV so the eddy recoils or passes; no canon document should be changed to accommodate the story. |
| C-06 | story-0005 IV and V; `mechanics/ANCHOR_THEORY.md` section 5; bible 3.2 | Zero-anchoring that leaves "a lingering numbness" and burns no anchor vs guaranteed anchor burn. | Mechanics and bible. | Same rewrite; the zero-anchor must cost a named anchor. `characters/Kaelen.md:42` then needs the count updated. |
| C-07 | `stories/short_story/spend_what_you_can_afford/manuscript.md:32-36, 161, 903`; `data/lexicon/terms.yaml` term-0022 to term-0026 (`status: draft`, `canonical_source` = draft manuscripts) | A primary-canon story references four drafts and cites draft terms whose source is a draft manuscript. | The primary story stands; its dependencies must rise. | Items 1 to 4 of the promotion order. |
| C-08 | story-0006 I, II, V; `lore/COSMIC_REGIONS.md` | "The Forgotten Tides" as a navigable region vs six named regions and no Tides. | The lore. | Sandbox or deprecate; if rewritten, set it in the Remnant Seas. |
| C-09 | story-0006 II ("two personal, one civic" anchors); `mechanics/ANCHOR_THEORY.md` section 2 | A civic anchor class vs basic, ritual, emotional, forbidden (ancestral in the manual). | Mechanics. | Remove "civic" in any rewrite. |
| C-10 | `lore/MEMORY_ECONOMY.md` section 3 and story-0004 I and III ("the Bleaching", a market crash); story-0020 tag `bleaching-conspiracy` and `continuity_notes:103`; novel outline | One term for two events: a memory-market crash and the novel's planetary memory extraction. | The lore (the crash); the novel's sense is undocumented outside the draft. | Decide whether they are the same event; if not, rename the novel's phenomenon before any short story uses it. |

Notes carried for later stories (not contradictions): R-01 story-0014 fixes the Heliodrome's population at eighty thousand; R-02 rendering apparatus varies (story-0011 sensorium band; story-0016 attention into an empty stone; story-0021 tuning ring and thumb plate; story-0003 none), reconcilable as different Archivist and Halix practices but worth one lexicon sentence; R-03 "Corin" is a maintenance worker in story-0005 and Corin Tave in story-0017, no link intended; R-04 Lysa Korr's anchor arithmetic in story-0017 (fourteen, three mild, one moderate, "eleven" before H-37, nine at death) reconciles only if the moderate burn was on her fatal run, which IV's addendum contradicts.

## 6. Per-story cards

### story-0002 — Memoir of a Nobody
Current tier: (no `canon_tier` field) / draft / metadata.status draft
Hard gates: FAIL (new metaphysical law in prose with no mechanics or lore update: COST, "I became a living eddy — localized, low-intensity, targeted"; CHOICE, "Micro-particulate eddy material, trace neurological integration")
Depends on: primary canon only (`references.stories` empty; `mech-0001` only)
Depended on by: none

What it establishes: A maintenance worker, Vess Cormick, on "Waystation Commercial Hub 11-C (The Beige)" who hosts internalized eddy material and erases every observer's memory of them; a self-targeting eddy that eventually erodes the host's own autobiography; a posthumous publishing epilogue with an archivist, Tamar Lien, and a bestseller titled after the story. None of the named characters or the station has an entity file.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 0 | 3 | 0 | COST: "It didn't erase me. It nested. I became a living eddy"; CHOICE: "Memory retention by others impossible". No mechanics or lore doc allows eddy internalization; `lore/SPECIES_OVERVIEW.md` section 5 says "eddies are phenomena, not organisms", so "micro-particulate eddy material" has no referent. `continuity_notes` line 4 ("Unique case—not replicable, freak accident only") concedes the rule is invented. SITUATION: the door "experiences ... mild vertigo, and gives up. The door clicks open": a security system fails open with no memory cost. |
| B Bible compliance | 5 | 3 | 15 | No locked character, the Heliodrome, the Lattice Gap, zero-anchoring, or anchor burn appears; no `bible_refs` owed. |
| C Tonal fidelity | 1 | 2 | 2 | SITUATION: "I am the draft"; ESCALATION: "rejected by a form for being too persistent and not existing"; CHANGE: "A holofilm adaptation is rumored." Comic register is the story's declared mode (tag `dark-comedy`, `summary_200`: "A dark comedy"), against `AGENT.md` 2.3 "No upbeat comic tone" and `docs/STYLE.md` section 1 "Humor: Rare, dry, pressure-release only." One point for a recurring physical sign (the "warmth" of dissolution) in most scenes. |
| D Craft and structure | 2 | 2 | 4 | Section headings are the scene-spine labels themselves (`## SITUATION`, `## ESCALATION`, `## CHOICE`, `## COST`, `## CHANGE`), a template skeleton left in the text. ESCALATION, Kell scene: a stray non-English string "説明している — explaining" in the prose. ESCALATION, journal scene explains what it showed: "The contentment was a lie. The peace was dissociation." CHANGE restores the opening state: "Everything is fine." |
| E Cross-canon coherence | 1 | 2 | 2 | Contradicts `lore/SPECIES_OVERVIEW.md` section 5 (eddies are phenomena) by treating an eddy as particulate matter that can be carried in a body for twenty-three years. "Waystation Commercial Hub 11-C" appears in no atlas entry. No dependency on other stories. |
| F Repository hygiene | 0 | 1 | 0 | `stories/short_story/memoir_of_a_nobody/manuscript.md:1-60`: no `canon_tier`, no `retrieval_role`; `timeline.chronology` has five entries and there is no `events` block; `metadata.word_count: 5100` against roughly 3,960 words of body; protagonist Vess Cormick, Tamar Lien, Kell, and the station have no entity files while being named reusable elements; `cross_refs.characters` and `cross_refs.locations` are empty. |
| G Canon value | 0 | 1 | 0 | The reusable element (a human eddy host) would need a mechanics rewrite before any story could build on it, and the author's own note calls it non-replicable. Locking it would lock a freak case. |
| **Total** | | | **23 / 70** | |

Recommendation: Hold, consider sandbox or deprecate (hard gate FAIL on criterion A)

Required fixes before promotion (if any):
- Not fixable by hygiene or wording. The premise is the new law. If the story is kept, move it to `canon_tier: sandbox` and `status: speculative`, or rewrite the premise onto an existing mechanic (an amnesiac "light" individual per `lore/SPECIES_OVERVIEW.md` 4.3, not an eddy host).
- `stories/short_story/memoir_of_a_nobody/manuscript.md`: add `canon_tier: draft` (or `sandbox`) and `retrieval_role` so the tier report stops listing the story as implicit.
- ESCALATION, Kell scene: current "He gestures,説明している — explaining." proposed "He gestures, explaining."

Contradictions found: C-01 (eddy as particulate matter vs `lore/SPECIES_OVERVIEW.md` section 5).

Author decisions needed: Whether this story belongs in the anthology at all. Its register is the one the bible section 6.6 forbids for connected stories and `AGENT.md` 2.3 forbids outright. Options: deprecate; sandbox it as a tonal outlier; or rewrite the premise on amnesiac lightness rather than eddy hosting (a full revision, not a fix).

### story-0003 — The Tuner of Last Lights
Current tier: draft / draft / metadata.status draft
Hard gates: PASS
Depends on: primary canon only (`references.stories` empty)
Depended on by: story-0004 (and through it story-0015, story-0021, and the primary-canon story-0022)

What it establishes: Remembrancer hospice practice at the Solace Hospice: a tuning bench with a lowered ring, stones held at the temple to ease a dying mind's final raveling, a dawn audit ledger. It names the "cut harmonic", a perceptible severance tone in a coercively extracted stone, and names the Halix Exchange as an off-channel route that moves Synod stock. Reliquarist Indre Vael, Sister Olenne, patient Mira Calvent, and a station called Tess are introduced without entity files.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 4 | 3 | 12 | The cut harmonic derives from `lore/MEMORY_ECONOMY.md` section 2 (coercive extraction "produces unstable, damaged stones"); II: "a string that had been cut rather than untied" is a perceptible version of that rule, not a new one. The cost Indre pays is stated, not shown: V, "She had spent a night, and a small piece of her own childhood"; no memory is burned and no physical sign of loss follows the telling. "Raveling" (term-0017, a corridor state) is reused for a dying mind (I: "her last raveling"), a synonym drift `docs/STYLE.md` section 10 forbids. |
| B Bible compliance | 5 | 3 | 15 | No locked character, the Heliodrome, the Lattice Gap, zero-anchoring, or anchor burn appears. Doctrine lines quoted match `lore/POLITIES_AND_FACTIONS.md` sections 1 and 6 verbatim. |
| C Tonal fidelity | 3 | 2 | 6 | Register is restrained and elegiac. Lapses: III is a staged ethics dialogue that says the dilemma outright ("whether I become the person who uses what was stolen"); V closes by restating doctrine as theme ("It was not a triumph. It was not a tragedy. It was ... transformation"). Physical signs present in I, II, IV ("two notes off true"; "the room thickened"; "The sentence had ravelled"); none in III. |
| D Craft and structure | 4 | 2 | 8 | Enters on the stone's arrival, exits on the closed door. Each section ends in an irreversible change (stone withheld; Mira dies; letter locked away). V explains what it showed: "There were two reasons, and she understood both of them." Prose is at publication standard. |
| E Cross-canon coherence | 2 | 2 | 4 | `timeline.setting` ("Solace Hospice, an outer Remembrancer house in the Helios Drift") and `summary_200` ("on the outer rim of the Helios Drift") conflict with `atlas/Solace_Hospice.md:11` ("A monastic station orbiting the Lattice Gap's outer sleeve"), which is `canonical` and bound to story-0007. III: "Halix moves Synod stock" is not in `atlas/Halix_Exchange.md` and will need reconciling with story-0015. "Tess" (III, V) has no atlas entry. No dependencies on drafts. |
| F Repository hygiene | 0 | 1 | 0 | `cross_refs` and `references` list no characters, locations, or factions although loc-0010, loc-0013, fact-0006, fact-0004, fact-0005 all exist and appear in the text (`manuscript.md:11-24`); `timeline.chronology` has five entries with no `events` block; `metadata.word_count: 4100` against roughly 3,690 body words; Indre Vael, Olenne, Mira Calvent have no character files; "cut harmonic" has no lexicon entry. |
| G Canon value | 3 | 1 | 3 | The cut harmonic and hospice-stone practice are rigorous and generative, but live only in prose; nothing is documented outside the manuscript. story-0004 already builds on the Halix reference. |
| **Total** | | | **48 / 70** | |

Recommendation: Hold

Required fixes before promotion (if any):
- `stories/short_story/the_tuner_of_last_lights/manuscript.md:11-24`: current `characters: []`, `locations: []`, `factions: []`; proposed `locations: [loc-0010, loc-0013, loc-0008]`, `factions: [fact-0006, fact-0004, fact-0005]`, plus `characters` once files exist.
- Add `characters/Indre_Vael.md` (char-0031 or next free) with invariants (Remembrancer reliquarist, twenty-two years on the bench, Solace Hospice) and `continuity.watchlist` naming the withheld stone; Olenne and Mira Calvent may stay story-local per the story-0022 precedent, but the summary names Indre as the story's agent.
- Add `events` (five chronology entries).
- `metadata.word_count: 4100` to the actual count.
- `data/lexicon/terms.yaml`: add "Cut Harmonic" (status draft) with `canonical_source: lore/MEMORY_ECONOMY.md`.
- Resolve the Solace Hospice location: either `timeline.setting` and `summary_200` change "Helios Drift" to "the Lattice Gap's outer sleeve", or `atlas/Solace_Hospice.md` changes (which also touches story-0007 and story-0018). Author decision.
- I: current "her last raveling"; proposed "her last unmaking" (the story's own Remembrancer word), to keep `raveling` a corridor term.

Contradictions found: C-02 (Solace Hospice region: this story vs `atlas/Solace_Hospice.md`); C-03 (Halix moves Synod stock vs the Halix atlas and story-0015, pending that card).

Author decisions needed: Where the Solace Hospice is. Whether Indre Vael becomes a filed character (she is the kind of reusable figure a later Remembrancer story would want).

### story-0004 — The Light Inheritance
Current tier: draft / draft / metadata.status draft
Hard gates: PASS
Depends on: story-0003 (Hold); the edge carries only the offstage Halix reference and is severable now that `atlas/Halix_Exchange.md` exists
Depended on by: story-0015, story-0021 (and through story-0021, the primary-canon story-0022)

What it establishes: Drift Clade recitation culture on the Skather-Ait pod (char-0026 Yenu, char-0027 Hol-Vren, loc-0015), the coherence-frame of recited filaments, "stopping" as clade-chosen lightness, and the light-bequest (term-0021) heard at Tess Vlin's bench (char-0019) on the Halix Exchange (loc-0013). It also states, in prose, that a light-bequest heard by its intended hearer completes: the stone goes cool and inert and the memory seats in the hearer as a recitation ("closed inheritance"). A Consortium fixer, Aurel Ket, is introduced without a file.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 2 | 3 | 6 | V: "It became something the lexicon did not yet have a word for. A closed inheritance." and "She felt her grandmother's voice settle ... into the place in her own mind": a stone discharging its memory into a hearer is stated as a rule and is in no mechanics, lore, or lexicon entry (term-0021 ends at "honored only by being heard"). V: "she listened to the stone through the wood, which was a thing tuners said you could not do"; "her listening was a kind of ring": two more unexplained abilities. The coherence-frame (II) is an application of collective recitation per `mechanics/MEMORY_PHYSICS.md` section 1.1, not a new law. Costs are paid and not reversed: the sale is forgone, the frame stays overdue (VI: "The math had not changed"), the grandfather dies. |
| B Bible compliance | 5 | 3 | 15 | No locked element appears. Solace, the Bleaching (`lore/MEMORY_ECONOMY.md` section 3), and cultural reinforcement fields (`lore/POLITIES_AND_FACTIONS.md` section 3) are used as written. |
| C Tonal fidelity | 3 | 2 | 6 | Restraint holds across six sections with a physical sign in each (II: "a small, soft forgetting in a corner"; IV: "The booth thickened"; V: "The stone in her palm went cool"). Lapses: III, Tess's "Tell me, then" produces a recited lexicon definition ("A light-bequest ... is a memory stone willed across one missed generation"), an "as you know" dump dressed as a test; IV's four-paragraph gloss on what the Consortium would do to the stone explains what the scene already implied. |
| D Craft and structure | 3 | 2 | 6 | Scene spine holds and the ending changes state (death, release, Yenu as reciter). Slack: III's shuttle ride and V's shuttle return cover the same interior ground; at roughly 6,900 words the story carries two rumination sections. V: "a thing Drift Clade dyers did" is a typo for the dying. V: "This was the part no one had taught her" narrates the mechanic rather than dramatizing it. |
| E Cross-canon coherence | 2 | 2 | 4 | Entity invariants agree with the prose (`characters/Yenu_Skather-Ait.md:22-25`, `characters/Hol-Vren.md:23-24`, `characters/Tess_Vlin.md:41-44`). The declared dependency is on story-0003, which scores Hold; the completion rule is relied on by story-0015 (`stories/short_story/the_halix_aftermarket/manuscript.md:91`) and story-0021 while documented only in speculative entity files. "Unremembered star" (III, VI) is consistent with `mechanics/MEMORY_PHYSICS.md` 3.1. |
| F Repository hygiene | 0 | 1 | 0 | `manuscript.md:13-28`: `cross_refs.characters`, `locations`, `factions` are empty although char-0019, char-0026, char-0027, loc-0013, loc-0015, loc-0008, fact-0004, fact-0003 exist and appear in the text; nine `timeline.chronology` entries and no `events` block; `continuity_notes` line 1 ("Introduces no new metaphysics") is contradicted by V; "coherence-frame", "closed inheritance", "stopping" have no lexicon entries; Aurel Ket has no file though story-0021 reuses him (`stories/short_story/receipt_for_a_voice/manuscript.md:240`). |
| G Canon value | 4 | 1 | 4 | term-0021 is already load-bearing for story-0015, story-0021, and the primary-canon story-0022 (the Tellis Aru light-bequest). Drift Clade recitation and the coherence-frame are generative and already reused. The completion rule must be documented before it is locked. |
| **Total** | | | **41 / 70** | |

Recommendation: Hold

Required fixes before promotion (if any):
- `manuscript.md:13-28`: populate `cross_refs` and `references` with char-0026, char-0027, char-0019, loc-0015, loc-0013, loc-0008, fact-0004, fact-0003, fact-0006.
- Add `events` for the nine chronology entries (at minimum: stone received; valuation and Consortium offer refused; bequest completed; grandfather dies; stone released).
- `data/lexicon/terms.yaml` term-0021: current "honored only by being heard by their intended hearer or released into dark matter"; proposed append "When the intended hearer hears it, the bequest completes: the stone goes cool and inert (a closed carrier with no usable drive memory) and the memory remains with the hearer as a recitation, not as a transplanted anchor." Add draft terms "Coherence-Frame" (canonical_source `atlas/Skather-Ait_Pod.md`) and "Closed Inheritance".
- `continuity_notes` line 1: current "Introduces no new metaphysics"; proposed "Extends term-0021 with the completion state (closed inheritance); see lexicon."
- V: current "a thing Drift Clade dyers did"; proposed "a thing the Drift Clade dying did".
- Either sever the story-0003 reference (remove story-0003 from `references.stories`, keep it in `cross_refs.stories`) or promote story-0003 first.
- Add `characters/Aurel_Ket.md` (speculative) since story-0021 reuses him by name.

Contradictions found: none with primary canon. Register entry C-04: the completion rule is stated here, relied on by story-0015 and story-0021, and absent from every mechanics, lore, and lexicon file.

Author decisions needed: Whether "closed inheritance" (a stone discharging into its hearer) is canon. If yes, it belongs in term-0021 and `lore/MEMORY_ECONOMY.md` 1.4 before promotion. If no, V needs a wording change so the stone only goes quiet and Yenu keeps what she heard as ordinary memory, and story-0015's premise changes with it.

### story-0005 — The Liturgy of Rust
Current tier: draft / draft / metadata.status draft
Hard gates: FAIL (new metaphysical law in prose with no mechanics update: IV, "the coherence wave that blasted outward ... It shattered, dispersing into harmless mnemonic static"; no canon document allows an eddy to be destroyed, and `manuals/PILOT_MANUAL.md` section 5 and `bible/ARCHIVISTS_WAKE_STORY_BIBLE.md` 3.5 treat eddies only as attractors to be avoided or, in story-0001, made to recoil)
Depends on: primary canon only
Depended on by: none by `references`; the primary-canon story-0022 relies on this story's lexicon terms (term-0024 Structural Softening is cited in `stories/short_story/spend_what_you_can_afford/manuscript.md:161`; "recite a hull" at line 903)

What it establishes: Continuity Cleric daily operations on Ostra-Vael (char-0005 Kaelen, char-0006 Vane, loc-0002): the Liturgy of the Hull (term-0023), structural softening (term-0024), doubt accelerating drift, a Canticle courier *Iron Vow* docking under eddy pursuit, two personal anchors burned by direct expenditure, and a zero-anchor whose "coherence wave" destroys the eddy.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 0 | 3 | 0 | IV: "It shattered, dispersing into harmless mnemonic static": eddies are destroyed by a "coherence wave", a term and effect in no mechanics doc. II: "The energy released by the forgetting flared outward": forgetting as an energy source inverts `mechanics/MEMORY_PHYSICS.md` section 2 (forgetting is entropy; drives convert memory, not forgetting, into coherence), and the burn happens with no drive, cradle, or housing. IV: the zero-anchor yields only "a lingering numbness" where `mechanics/ANCHOR_THEORY.md` section 5 says "guaranteed anchor burn". Drift order is respected in II (Corin forgets the handle before the hatch loses solidity). |
| B Bible compliance | 1 | 3 | 3 | Zero-anchoring is used (IV: "The dangerous technique. The zero-anchor.") outside bible 3.2 (no anchor burn results from it) and with no `bible_refs` (`manuscript.md` has no such field). Eddy wake-tracking (III: "It's tracking the ship's memory wake") is used per bible 3.5 but uncited. No locked character appears; no section 7 red line is crossed. |
| C Tonal fidelity | 1 | 2 | 2 | IV: "'THIS IS OSTRA-VAEL!' he roared, his voice echoing with the force of a physical detonation"; "Pain arced through Kaelen's nervous system, white-hot and absolute"; "tears streaming down his face"; III: "The station screamed." Spectacle and melodrama at the climax against `docs/STYLE.md` section 0 ("Avoid spectacle"). III, Vane: "Coming in hot and heavy." Physical signs are present (II: "smeared"; IV: "The floor felt spongy"). |
| D Craft and structure | 2 | 2 | 4 | Clean five-part spine and the ending changes state (two anchors gone, liturgy continued from duty). V explains what it showed: "He had saved the station. He had saved the ship. He had lost pieces of himself." The officer's exit gift (V: "We'll leave a few reliquaries ... it will help with the drift") softens the cost. Prose is serviceable, not at the exemplars' standard ("a cold spike of panic", "profound, recognizing respect"). |
| E Cross-canon coherence | 0 | 2 | 0 | Contradicts `mechanics/ANCHOR_THEORY.md` section 5 (zero-anchoring without anchor burn) and the canonical treatment of eddies (`mechanics/CORRIDOR_MECHANICS.md` 5.1, bible 3.5) by destroying one. Entity files agree with the prose (`characters/Kaelen.md:42` "started with 6, lost 2, zero-anchor damage"), so the conflict is with mechanics, not with entities. "Corin" (II) shares a name with char-0021 Corin Tave of story-0017; no link is intended. |
| F Repository hygiene | 1 | 1 | 1 | Four `timeline.chronology` entries and no `events`; no `bible_refs` while zero-anchoring, eddy tracking, and anchor burn appear; `metadata.word_count: 3200` against roughly 2,575 body words; the courier *Iron Vow* has no atlas entry; "coherence wave" has no lexicon entry. Terms 0022, 0023, 0024 and entity files exist (status `canonical` while the story is draft). |
| G Canon value | 2 | 1 | 2 | Continuity Clerics, the Liturgy of the Hull, and structural softening are generative and already used by story-0022. The eddy-shattering climax would lock an anti-eddy weapon the setting cannot afford. |
| **Total** | | | **12 / 70** | |

Recommendation: Hold, consider sandbox or deprecate (hard gate FAIL on criterion A)

Required fixes before promotion (if any):
- Not fixable by wording alone: the climax (IV, zero-anchor to coherence wave to shattered eddy) must be rewritten so the eddy recoils or passes and the zero-anchor burns an anchor. Route to `agents/revision_agent.md`.
- Independently of the story: promote term-0022, term-0023, term-0024 in `data/lexicon/terms.yaml` from `status: draft` to `canonical`, since story-0022 (primary canon) already depends on them; add `canonical_source` pointing at a lore or mechanics file rather than this manuscript.
- Add `bible_refs` (3.2, 3.5, 3.6) and `events`; correct `word_count`; add `atlas/Iron_Vow.md` or drop the ship's name.

Contradictions found: C-05 (eddy destroyed vs mechanics and bible 3.5); C-06 (zero-anchoring without anchor burn vs `mechanics/ANCHOR_THEORY.md` section 5 and bible 3.2); C-07 (primary-canon story-0022 cites draft terms term-0022 to term-0024 whose `canonical_source` is this draft manuscript).

Author decisions needed: Whether to keep the story with a rewritten climax or sandbox it and canonize only its three lexicon terms (which primary canon already uses).

### story-0006 — The Anchorless Tide
Current tier: draft / draft / metadata.status (absent)
Hard gates: FAIL (new metaphysical law in prose with no mechanics or lore update: IV, "Memories flooded the Tides—not contained, but liberated. Scattered like seeds"; "Some would catch on other buoys, other salvagers, other minds"; I, "Freelancers didn't rate full anchor drives. Just patched harnesses and enough neural dampers"; I, "the Forgotten Tides" as a navigable region absent from `lore/COSMIC_REGIONS.md`)
Depends on: primary canon only
Depended on by: none

What it establishes: A freelance salvager, Kael Voss (char-0007), aboard the *Quiet Drift* in "the Forgotten Tides", intercepts a memory buoy from the lost colony Ebbhaven (loc-0009), is flooded by its memories, and releases them. It introduces anchor drives, neural dampers, memory buoys, a civic anchor, and the Tides as a place, none of which exists elsewhere.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 0 | 3 | 0 | IV: "fed the buoy not an anchor, but permission" is immediately followed by "The space where his mother's knot memory had lived was smooth and empty": the cost is denied and then paid, and the mechanism of either is unstated. IV: liberated memories "catch on ... other minds centuries from now": memory as free-floating seed is a new law. II: "two personal, one civic" anchors: `mechanics/ANCHOR_THEORY.md` section 2 has no civic anchor class. I: "anchor drives", "neural dampers" appear in no mechanics document (repository grep returns only this story). I: "Here, reality was negotiable." |
| B Bible compliance | 5 | 3 | 15 | No locked character, the Heliodrome, the Lattice Gap, zero-anchoring, or eddy tracking appears. |
| C Tonal fidelity | 1 | 2 | 2 | IV: "'Some tides aren't meant to be saved,' he told the ship. 'They're meant to teach the rest of us how to float.'" is an aphoristic quip after cost; V: "full of stories waiting for someone brave enough to forget just enough to keep moving" is an upbeat close; III: "whispering promises of belonging" is mystical vagueness in place of mechanism. One physical sign (II: anchors "flared hot against his skull"). |
| D Craft and structure | 1 | 2 | 2 | Roughly 700 words in five titled fragments; the ending (V: "Next ping") restores the opening state with the hero lighter and content; IV: "No ache. Just... absence." makes the loss weightless. |
| E Cross-canon coherence | 0 | 2 | 0 | "The Forgotten Tides" as a region contradicts `lore/COSMIC_REGIONS.md`, which names six regions and no Tides; "anchor drives" is a synonym for memory drives against `docs/STYLE.md` section 10; "civic anchor" contradicts `mechanics/ANCHOR_THEORY.md` section 2. `characters/Kael_Voss.md` records no anchor count, so the file cannot confirm the prose. |
| F Repository hygiene | 0 | 1 | 0 | `manuscript.md:1-27`: no `timeline`, no `continuity_notes`, no `retrieval_role`, no `metadata.status`, no `metadata.word_count`, `mechanics: []` in both ref blocks; the *Quiet Drift* has no atlas entry; `atlas/Ebbhaven.md:6` types a colony as `region`; both entity files are `metadata.status: canonical` for a draft story and carry no invariant a checker could test. |
| G Canon value | 0 | 1 | 0 | Memory buoys and salvage lore would need to be rebuilt on existing mechanics before anyone could use them; locking the Tides as a region would conflict with the atlas. |
| **Total** | | | **19 / 70** | |

Recommendation: Hold, consider sandbox or deprecate (hard gate FAIL on criterion A)

Required fixes before promotion (if any):
- Not fixable by wording. If kept, set `canon_tier: sandbox`, `status: speculative`, and set `characters/Kael_Voss.md` and `atlas/Ebbhaven.md` to `metadata.status: speculative`.
- If rewritten: place the story in a named region from `lore/COSMIC_REGIONS.md` (the Remnant Seas fits "drifting reliquary shards"), replace "anchor drives" with memory drive, drop "neural dampers" and "civic" anchors, and pay one anchor on-page.

Contradictions found: C-08 (Forgotten Tides as region vs `lore/COSMIC_REGIONS.md`); C-09 (civic anchor vs `mechanics/ANCHOR_THEORY.md` section 2).

Author decisions needed: Deprecate or sandbox. The salvageable lore is the idea of a pre-Lattice colony's memory buoy, which could become a Remnant Seas artifact entry.

### story-0007 — The Hospice Knot
Current tier: draft / draft / metadata.status (absent)
Hard gates: PASS
Depends on: primary canon only
Depended on by: story-0018

What it establishes: Solace Hospice (loc-0010) release practice as consent-first: a witness stone that records a freely given choice, the release audit's question sequence, and a Canticle "preservation hold" that treats a pilot's route anchor as evidence. Remembrancer Lira Voss (char-0008) and pilot Maren Holt (char-0009) are introduced; Maren's route anchor from a failed evacuation beyond the Lattice Gap is released and cannot be recovered.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 4 | 3 | 12 | Voluntary release rests on `lore/theology/THEOLOGY_OF_MEMORY.md` 6.2 and the Solace mandate in `lore/POLITIES_AND_FACTIONS.md` section 6; IV: "no Solace rite, memory stone, therapy, or Fleet reconstruction can restore a released or burned anchor" restates bible 3.6. Cost is paid on-page and not reversed (V: "Can he fly?" "No."). Drift order holds (IV: "Not the lights. The meaning of the lights."). One hand-wave: I, the witness stone "would not brighten until it heard a choice freely made", a stone that detects voluntariness, with no mechanics basis. |
| B Bible compliance | 3 | 3 | 9 | The Lattice Gap (I, V: "the Lattice Gap beyond the station skin") and anchor burn (II: "He burned a little of himself to remember the route") are handled within bible 3.6 and 4.1, but the manuscript has no `bible_refs` field, which `docs/PLAYBOOK_NEW_STORY.md` Step 4 requires for either element. |
| C Tonal fidelity | 4 | 2 | 8 | Dialogue is minimal and subtextual throughout; one physical sign per scene (I: "Syllables pulled apart, not in his mouth but in the air"; II: "the far wall sliding away like a corridor under bad attention"). Lapses: III states its theme ("Mercy is not the soft thing people imagine. It has teeth.") and V closes on the epigram "Mercy had teeth. So did record-keeping." |
| D Craft and structure | 4 | 2 | 8 | Enters on the hold order, exits on the ledger; every section ends in an irreversible change; the ending changes identity and structure (Maren cannot fly; the hold is refused in writing). III explains a beat it already showed: "There it was. The little change in noun that turned a person into a container." |
| E Cross-canon coherence | 4 | 2 | 8 | Entity invariants agree with the prose (`characters/Maren_Holt.md:40-42`). The hospice's position matches `atlas/Solace_Hospice.md` (Lattice Gap outer sleeve); the only tension is story-0003 placing the same hospice in the Helios Drift (register C-02, charged to story-0003). Nothing contradicts primary canon or mechanics. |
| F Repository hygiene | 2 | 1 | 2 | `manuscript.md:1-51`: no `timeline`, no `events`, no `bible_refs`, no `retrieval_role`, no `metadata.status`, no `metadata.word_count`; "witness stone" and "preservation hold" have no lexicon entries. Entity files exist; Lira Voss is `canonical` and Maren Holt `speculative` from the same draft (`characters/Lira_Voss.md:45`, `characters/Maren_Holt.md:48`). |
| G Canon value | 4 | 1 | 4 | Consent-first release, the witness stone, and the Fleet-versus-Solace jurisdiction conflict are generative and already reused by story-0018. Documented partly in the atlas and faction summaries, not in the lexicon. |
| **Total** | | | **51 / 70** | |

Recommendation: Promote after fixes

Required fixes before promotion (if any):
- `manuscript.md`: add `bible_refs` (`bible/ARCHIVISTS_WAKE_STORY_BIBLE.md#36-anchor-burn-consequence`, `#41-the-lattice-gap`, `#71-anchor-rules`).
- Add `timeline` (setting: Solace Hospice, Lattice Gap outer sleeve; duration: one night to third pull) and `events` (release audit; hold refused; anchor released; dawn audit filed).
- Add `retrieval_role: active_draft`, `metadata.status: draft`, `metadata.word_count` (roughly 2,610).
- `data/lexicon/terms.yaml`: add "Witness Stone" (draft; a reliquary that records a consent audit, not a memory) and "Preservation Hold".
- `characters/Maren_Holt.md:48`: current `status: speculative`; proposed `status: canonical`, to match Lira Voss on promotion.

Contradictions found: none charged to this story (C-02 is charged to story-0003).

Author decisions needed: Whether a witness stone that "hears a choice freely made" is a Solace instrument worth defining in lore (recommended: define it as recording the audit, with the brightening a tuned response to the ring's audit tone, not a lie detector).

### story-0008 — The Reliquarist's Doubt
Current tier: draft / draft / metadata.status draft
Hard gates: PASS
Depends on: primary canon only
Depended on by: story-0022 (primary canon; `stories/short_story/spend_what_you_can_afford/manuscript.md:56` lists story-0008 in `references.stories` and sets itself "twelve weeks after the events of story-0008")

What it establishes: The Reliquarist sect on-page (term-0025), the Tessarine Vault (loc-0011) with its sixteen-booth audit hall, middle ring, and civic silos, the tuning cradle (term-0026), the junior seal (an audit certified at the junior's own anchor cost, three per year), and the open provenance anomaly of pledge stone TES-N3-44217 (Tellis Aru), a personal memory whose terrain predates its donor. Inya Solven (char-0010) burns one of four knots.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 5 | 3 | 15 | Every effect traces to a documented rule: the cradle returns "the stone's own tone amplified back at itself" (II; term-0026); the junior seal's anchor cost is documented in `atlas/Tessarine_Vault.md:90`; pledging a stone costs the donor an anchor (IV: "Tellis Aru had given one of her remaining anchors"), per `lore/MEMORY_ECONOMY.md` section 2. The burn is shown, not stated (V: "a clean shape that knew it had once been a memory and was no longer"), and never reversed (VI: "Her four knots were three"). No new law; the anomaly is left open by design (`continuity_notes` line 5, verified against V). |
| B Bible compliance | 4 | 3 | 12 | No locked character appears. Anchor burn (V) is handled within bible 3.6 and 7.1; the Lattice Gap is touched once, historically (III: "a moon in the Lattice Gap's near sleeve, scoured in a Synod-adjacent event"), within bible 4.1. No `bible_refs` field. |
| C Tonal fidelity | 4 | 2 | 8 | Restraint throughout; dialogue minimal (VI: "How was routine?" "Routine."); one physical sign per scene (I: "Cold. She lit the cradle"; V: "The sensorium ring cooled against her scalp"). Lapse: VI states the theme outright ("the line did not tell a Reliquarist what to do. It told a Reliquarist what to carry"). |
| D Craft and structure | 4 | 2 | 8 | Enters on the tray, exits on sleep; each section ends in an irreversible step (the stylus set down; the query closed; the knot spent). VI explains what V showed: "She had not solved anything. She had passed the cost forward." Prose at publication standard. |
| E Cross-canon coherence | 5 | 2 | 10 | Agrees in every particular with the primary-canon sequel (Inya's three knots, the stone number, Hael's "hands", junior seals three per year) and with `characters/Inya_Solven.md:49` and `atlas/Tessarine_Vault.md:90`. No dependencies on drafts. |
| F Repository hygiene | 2 | 1 | 2 | Four `timeline.chronology` entries and no `events`; no `bible_refs`; `cross_refs.characters` omits char-0029 (Brother Hael, filed after this story, appears in I and VI); `metadata.word_count: 3450` against roughly 2,720 body words; III: "year 2244" is the only absolute calendar year in the short stories and sits outside the timeline tool's model (`out/reports/timeline_variance.json` span 2000 to 2005). |
| G Canon value | 5 | 1 | 5 | Reliquarist practice, the Vault, cradles, junior seals, and the provenance mystery are already the foundation of primary canon; promotion repairs the current state in which a primary-canon story references a draft. |
| **Total** | | | **60 / 70** | |

Recommendation: Promote

Required fixes before promotion (if any):
- `manuscript.md`: add `events` (four chronology entries; at minimum the junior seal and anchor burn, and the anomaly queued for quarterly review, which story-0022's event-story-0022-001 already presumes).
- `manuscript.md:14-15, 26-27`: add `char-0029` to `cross_refs.characters` and `references.characters`.
- Add `bible_refs` (`#36-anchor-burn-consequence`, `#71-anchor-rules`, `#41-the-lattice-gap`).
- `metadata.word_count: 3450` to the actual count.
- At promotion: `data/lexicon/terms.yaml` term-0025 and term-0026 `status: draft` to `canonical` (the promotion tool's checklist will name them).

Contradictions found: none.

Author decisions needed: Whether "year 2244" (III) stays as an in-world calendar year. If the timeline tool's date model is meant to be authoritative, replace with a relative cue ("born a hundred and eighty years after the scouring").

### story-0009 — The Doctrine of Empty Stars (novella; score only)
Current tier: draft / draft / metadata.status (absent)
Hard gates: PASS
Depends on: primary canon only (`references.stories` empty)
Depended on by: none

What it establishes: The Obsidian Synod from inside, at the Narthex of Low Mercy (loc-0012) in the Black Horizon (loc-0007): release ledgers and the rite of absence, stations kept deliberately light and hidden in a "memory shadow", a coerced evacuation memory (Tern Gate, the auxiliary *Vesper*) whose retained fear is used as route pressure, a "full resonance" audit that imprints a name into the auditor's anchors, "transit resonance" (a memory used as unburned relation-weight for a corridor), sealed inward witness custody as an alternative to zero-anchoring, and a station paying for a corridor by forgetting rooms. Sael Orro (char-0011), Ives Mar (char-0012), Veyr Anik (char-0013), plus story-local Tovan, Ilet, Aven Tor, Rin, and the ship *Pell*.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 3 | 3 | 9 | Memory is physical on every page (Scene 1: "The page bowed under the ink"; Scene 10: dust "choosing weight over instruction"). Drift order holds (Scene 2: "It still takes pressure. It does not take meaning"; Scene 7: "meaning failed before matter. Names went first"). Costs are paid and never reversed (Scene 9, Ives: "'Lost,' he said"; Scene 11: "That self did not burn. It remained as memory, intact and uninhabitable"). Zero-anchoring is named and refused per `mechanics/ANCHOR_THEORY.md` section 5. Two techniques are stated in prose and documented only in the drafting brief, not in any mechanics or lexicon file: full resonance ("The auditor lent coherence. The memory used the self as a temporary room ... An imprint", Scene 6) and sealed inward custody ("an intact room she was not allowed to enter and not allowed to abandon", Scene 11). Transit resonance follows `mechanics/CORRIDOR_MECHANICS.md` section 2 ("Burns or resonates with memories"). |
| B Bible compliance | 4 | 3 | 12 | No locked character, the Heliodrome, or the Lattice Gap appears. Zero-anchoring (Scene 11), anchor loss (Scene 9), and corridor raveling (Scene 7: "the station forgetting what a destination was") are handled within bible 3.2, 3.6, and `mechanics/CORRIDOR_MECHANICS.md` 4.3. `bible_refs` (`manuscript.md:112-113`) cites the bible as a bare path with no section anchor. |
| C Tonal fidelity | 4 | 2 | 8 | Restraint across twelve scenes; dialogue subtextual; one physical sign per scene. Lapses: a set of epigram tics recurs until it reads as mannerism (Scene 7: "Not accusation. Not forgiveness. Weight."; Scene 9: "The distinction was small. The distinction was everything."; Scene 4 and Scene 8: "Truths did not become lighter because they disliked sharing a line."), and Scenes 4 and 8 run as doctrinal dialogues long enough to become exposition of the moral argument. |
| D Craft and structure | 4 | 2 | 8 | Every scene turns on a costed action and leaves an irreversible change; the ending changes identity (office withdrawn, self "uninhabitable"), structure (the Narthex pays in rooms), and stakes (the first record). Slack: the four-line anchor litany ("Name. Station. Office. Doctrine.") recurs dozens of times; the middle act (Scenes 4, 6, 8) is argument-heavy. The novella is unassembled: `manuscript.md` body is a 22-word scaffold ("Draft manuscript scaffold. Scenes will be drafted under `scenes/`"). |
| E Cross-canon coherence | 5 | 2 | 10 | Synod conduct matches `factions/Obsidian_Synod.md:56` ("patient, methodical, and genuinely devoted") and story-0022's "no spectacle, no resistance"; the Black Horizon matches `atlas/Black_Horizon.md` (memory bleeding, hidden installations, unknown perimeter secret left untouched per Scene 7: "The audit did not open that door"). Entity invariants agree (`characters/Sael_Orro.md:44-46`, `characters/Ives_Mar.md:44-46`, `characters/Veyr_Anik.md:40-42`). No dependency on any draft. |
| F Repository hygiene | 1 | 1 | 1 | `manuscript.md:114-117`: `metadata.word_count: 0`, no `metadata.status`, no `retrieval_role` alignment with scenes; three manuscript `events` against thirty-six scene-level events; Tern Gate Station, the *Pell*, and the *Vesper* have no atlas entries; no lexicon entries for full resonance, transit resonance, witness custody, anchor weather, memory shadow, or the rite of absence; `continuity_brief.md` is typed `lore` with `status: draft` and `metadata.status: speculative` and is indexed as a story in `CANONICAL_INDEX.md`. Scene files carry complete scene-schema frontmatter. |
| G Canon value | 4 | 1 | 4 | Dramatizes the Synod and the Black Horizon from inside, establishes the consent/coercion doctrine the whole setting turns on, and feeds the novel's Synod arc. The reusable mechanics live only in a drafting brief and would need lexicon and mechanics entries before another story could build on them safely. |
| **Total** | | | **52 / 70** | |

Recommendation: Promote after fixes (the promotion tool does not handle novellas; promotion would be a manual edit of `manuscript.md`, the twelve scene files, and `continuity_brief.md`)

Required fixes before promotion (if any):
- Assemble the twelve scenes into `manuscript.md` (or record in the manuscript that the scenes are the text of record) and set `metadata.word_count` to roughly 50,000.
- `data/lexicon/terms.yaml`: add draft terms "Full Resonance" (auditor lends anchor sequence; leaves a name-bearing imprint; forbidden to acolytes), "Transit Resonance" (memory used as unburned relation-weight for a route), "Witness Custody" (sealed inward carriage distinct from zero-anchoring), "Anchor Weather", "Memory Shadow"; `canonical_source` should be a lore or mechanics file, not the scenes.
- `mechanics/ANCHOR_THEORY.md`: a short section under 5 distinguishing sealed custody from zero-anchoring, since the novella's climax depends on that distinction.
- `manuscript.md:112-113`: current `- bible/ARCHIVISTS_WAKE_STORY_BIBLE.md`; proposed section anchors `#32-zero-anchoring`, `#36-anchor-burn-consequence`, `#71-anchor-rules`, `#72-corridor-rules`.
- Add `atlas/Tern_Gate_Station.md` (deprecated or speculative; a collapsed station) and either atlas entries or a continuity note for the *Pell* and *Vesper*.
- `continuity_brief.md`: align `status` and `metadata.status`, and give it `type: lore` handling in the index (it currently lists under Story).

Contradictions found: none.

Author decisions needed: Whether full resonance, transit resonance, and sealed witness custody become canon mechanics (they are the novella's load-bearing inventions and nothing outside the drafting brief records them). Whether the novella should be assembled before any tier change.

### story-0010 — The Error That Remembered Itself
Current tier: draft / draft / metadata.status draft
Hard gates: PASS
Depends on: primary canon only
Depended on by: none

What it establishes: Inside the Mnemosyne Lattice Core (loc-0005), Consortium audit machinery that cannot retain a record for which it has no permitted category; concealed drift at an inner node service seam; the maintenance ledger as the Core's low-status, durable memory; junior auditor Sera Venn (char-0014) attaching the evidence to her own personnel record and losing her role, benefits, housing, and oath status while the ledger keeps the seam under standing watch.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 4 | 3 | 12 | Drift order is stated and respected (II: "Meaning failed first. Orientation came after. Material integrity would be last."). Institutional memory as structural weight follows `mechanics/MEMORY_PHYSICS.md` section 1.1 (IV: "her institutional self was losing weight. In the Core, that was not metaphor"). Cost is paid on-page and not reversed (III: "EXTERNAL SUBMITTER"; V: "AFFILIATION SUSPENDED"). No anchors, corridors, or burns. One effect is asserted rather than traced: a record "thinning" and vanishing because the system lacks a category (I: "the sentence had become easier for the eye to leave") is treated as memory physics without a stated rule linking category to coherence. |
| B Bible compliance | 5 | 3 | 15 | No locked character, the Heliodrome, the Lattice Gap, zero-anchoring, eddies, or anchor burn appears. |
| C Tonal fidelity | 4 | 2 | 8 | Dry, restrained, subtextual (II: "Clean hands make clean records."); one physical sign per scene (I: "the desk lose one degree of warmth"; II: "The metal trembled under her glove"). Lapse: V closes on a stated moral ("Not disclosure. Not justice. Continuity.") and III explains a beat ("There it was. The first clean loss."). |
| D Craft and structure | 4 | 2 | 8 | Enters on the authorless report, exits on the standing watch; each section ends in an irreversible step; the ending changes identity and structure. Prose at publication standard. The final line ("The Core, unwillingly, remembered.") resolves what the scene already showed. |
| E Cross-canon coherence | 5 | 2 | 10 | Matches `factions/Mnemosyne_Lattice_Consortium.md:54` (concealed node drift) and `atlas/Mnemosyne_Lattice_Core.md:45-47` (the "navigate blind" joke; the Core as the most dangerous place to tell the truth). Entity invariants agree (`characters/Sera_Venn.md:35-38`). No dependencies. |
| F Repository hygiene | 4 | 1 | 4 | `events` present and aligned with the chronology; `cross_refs` match the text; `word_count` accurate. Omissions: `atlas/Mnemosyne_Lattice_Core.md:24` and `factions/Mnemosyne_Lattice_Consortium.md` do not list story-0010 in `cross_refs.stories`; `characters/Sera_Venn.md:44` is `speculative`. |
| G Canon value | 3 | 1 | 3 | A sound, local dramatization of the Consortium's concealed crisis; Sera's watchlist already warns against generalizing the ledger tactic. Adds little reusable lore beyond the maintenance-ledger practice. |
| **Total** | | | **60 / 70** | |

Recommendation: Promote

Required fixes before promotion (if any):
- `atlas/Mnemosyne_Lattice_Core.md` and `factions/Mnemosyne_Lattice_Consortium.md`: add `story-0010` to `cross_refs.stories` and `references.stories`.
- At promotion: `characters/Sera_Venn.md` `metadata.status: speculative` to `canonical` (tool checklist).

Contradictions found: none.

Author decisions needed: none.

### story-0011 — The Quiet Census
Current tier: draft / draft / metadata.status draft
Hard gates: PASS
Depends on: primary canon only
Depended on by: none

What it establishes: Archivist census practice in the Remnant Seas (loc-0004): teaching an assay table to count because numbers loosen first; the three-light claim cascade (Archivist custody, Consortium interest, public index); blank reliquary chips for voluntary field rendering; a shard with stable coherence and no viewpoint, left explicitly unexplained. Oren Vale (char-0015) renders away the route memory and with it his first star lesson, and returns the shard to the Seas.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 5 | 3 | 15 | Pre-sentient memory is already in `mechanics/MEMORY_PHYSICS.md` 3.3 and `lore/COSMIC_REGIONS.md` section 3; the story refuses to make it law (II: "Candidate ... Evidence suggestive. Provenance unresolved."; V: "This does not amend mechanics."). Voluntary rendering follows `lore/MEMORY_ECONOMY.md` section 2, requires consent on-page (IV: "Coercion left scars in the stone"), and is shown as loss, not stated (IV: "A map is only a promise to return carefully. Return where? The answer was gone."). Drift fails in meaning first (I: "numbers loosened first ... Labels lost vowels"). Nothing is refunded. |
| B Bible compliance | 5 | 3 | 15 | No locked character, the Heliodrome, the Lattice Gap, zero-anchoring, eddies, or anchor burn appears. |
| C Tonal fidelity | 4 | 2 | 8 | Restraint throughout; dialogue minimal (III: "'No,' he said."); physical sign per scene (I: "the room became heavier"; IV: "the wall forgot whether the lock opened outward or inward"). Lapses: V states its theme in a three-sentence list ("Questions the Orders would preserve by owning...") and closes on "That would have to be enough," the same cadence as story-0002's ending. |
| D Craft and structure | 4 | 2 | 8 | Enters on the count, exits on the tea; the rendering is the irreversible change and the ending changes identity and structure. V explains a beat already shown ("Not a lie. Not the whole truth. The kind of record institutions hated most"). Prose at publication standard. |
| E Cross-canon coherence | 5 | 2 | 10 | Matches `atlas/Remnant_Seas.md:45` (researchers seeking pre-sentient structures), `factions/Mnemosyne_Lattice_Consortium.md` (acquisition pressure), and the Archivist Orders' doctrine. Entity invariants agree (`characters/Oren_Vale.md` invariants 3 to 5). No dependencies. |
| F Repository hygiene | 3 | 1 | 3 | `events` present and aligned; `continuity_notes` verified against the prose. `metadata.word_count: 4200` against roughly 3,085 body words; `atlas/Remnant_Seas.md` does not list story-0011 or char-0015 in `cross_refs`; "rendering chip" has no lexicon entry. |
| G Canon value | 3 | 1 | 3 | Preserves the pre-sentient question without locking an answer, and documents field rendering chips and the claim cascade as reusable Orders practice. Deliberately local by design. |
| **Total** | | | **62 / 70** | |

Recommendation: Promote

Required fixes before promotion (if any):
- `manuscript.md`: `metadata.word_count: 4200` to the actual count.
- `atlas/Remnant_Seas.md`: add `char-0015` and `story-0011` to `cross_refs` and `references`.
- At promotion: `characters/Oren_Vale.md` `metadata.status` to `canonical`.

Contradictions found: none.

Author decisions needed: none.

### story-0012 — The Mercy Doctrine
Current tier: draft / draft / metadata.status draft
Hard gates: PASS
Depends on: primary canon only
Depended on by: story-0022 (primary canon; `stories/short_story/spend_what_you_can_afford/manuscript.md:59` lists story-0012 in `references.stories`, and its `continuity_notes` line 160 takes "the Synod's dull lamps from story-0012" as the housings for null cores)

What it establishes: A Synod release rite on an abandoned Black Horizon station (loc-0007): dull lamps that "held no flame, only absence tuned into a steady hush"; release/return/retain trays; consent shaped as refusal; a survivor who kept the station's pressure-door injuries as a warning; the rite's final category "Living pain without remaining work". Novice Nara Oss (char-0016) copies the warning into her own ledger and carries it as retained weight. The station, the elder, and the survivor are story-local by design.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 4 | 3 | 12 | Memory as weight is physical on every page (II: "The room lightened by a measurable degree. Her boots settled differently"; VI: "By the third page, her wrist hurt"). Drift order holds in the back-story (IV: records stripped, then "the doors forgot why they were afraid to close", then "Door closed on seven from lower dorm"). Oblivion and death stay distinct (VI: "Oblivion was not death; death was not forgetting"). Cost is retention, named as not an anchor burn (VII). The lamps' mechanism ("reduced attachment until harm no longer had a structure to inhabit", I) was undocumented when written and is now covered by term-0027; the rite's final category ending a life is shown as the vigil's coherence loosening, which is plausible but not traced to a rule. |
| B Bible compliance | 5 | 3 | 15 | No locked character, the Heliodrome, the Lattice Gap, zero-anchoring, eddies, or anchor burn appears. |
| C Tonal fidelity | 4 | 2 | 8 | Restraint throughout; dialogue minimal and loaded (V: "You know how to sound like a door." "A good door opens and closes."); physical sign per scene (I: "The metal gave under her glove like skin"; II: the clock "clicked with the offended precision"). Lapse: VII explains the elder's line ("That was not absolution ... It was a record of fact") and the catechism in I ("What is memory?" "Memory is weight.") is rule-giving in dialogue. |
| D Craft and structure | 4 | 2 | 8 | Enters at the lock, exits on the return craft; the rite is the irreversible change; the ending changes identity (burden accepted) and structure (station partly released). V's debate runs a beat long. Prose at publication standard. |
| E Cross-canon coherence | 5 | 2 | 10 | Matches `factions/Obsidian_Synod.md:56` and the primary-canon reading of the Synod in story-0022 (sincere, no spectacle); the lamps are the same objects story-0022 opens as null-stone housings. Entity invariants agree (`characters/Nara_Oss.md:35-38`). No dependencies. |
| F Repository hygiene | 4 | 1 | 4 | `events` present and aligned; `cross_refs` match; `word_count` accurate; `continuity_notes` verified against the prose. Omissions: `data/lexicon/terms.yaml` term-0027 does not carry "lamp" as an alias though two stories use it; `characters/Nara_Oss.md:45` is `speculative`. |
| G Canon value | 5 | 1 | 5 | Primary canon already builds on it; promotion repairs the current state in which story-0022 references a draft. The consent-shaped-as-refusal rite and "mercy heard both" are generative for every later Synod story, including story-0009. |
| **Total** | | | **62 / 70** | |

Recommendation: Promote

Required fixes before promotion (if any):
- `data/lexicon/terms.yaml` term-0027: add alias "Lamp (Synod)" or a short note that the dull lamps of story-0012 are null-stone housings.
- At promotion: `characters/Nara_Oss.md` `metadata.status` to `canonical`.

Contradictions found: none.

Author decisions needed: none.

### story-0013 — The Smallest Burn
Current tier: draft / draft / metadata.status draft
Hard gates: PASS
Depends on: story-0001 (primary canon)
Depended on by: story-0021; story-0022 (primary canon, `references.stories` includes story-0013; Elior's eleven anchors are an invariant there)

What it establishes: The baseline cost of ordinary Canticle labor: a pre-run audit by name, assignment, count, and first three knots; a routine corridor trim in the Helios Drift (loc-0008) that thins at the port edge; a consented, logged "controlled anchor burn, basic sensory" of one childhood smell; a post-run audit with the classification "Mild anchor burn ... Solace consult offer"; the practice of keeping or renumbering a burned finger in the private count. Elior Ren (char-0017) goes from twelve to eleven anchors.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 5 | 3 | 15 | Every effect traces to a rule: audits per `manuals/PILOT_MANUAL.md` 3.2 (I: "Full name." "Anchor count." "Name the first three."); stored stones rejected as too broad per `mechanics/CORRIDOR_MECHANICS.md` section 2 (II: "A reliquary feed will overcorrect"); the burn is a basic anchor fed to the drive per `mechanics/ANCHOR_THEORY.md` 2.1; drift fails in meaning first (II: "A cargo tag ... had stopped meaning what it meant"); the loss is shown (III: "The room did not smell of anything") and permanent (V: "He let the absence remain exact"). |
| B Bible compliance | 5 | 3 | 15 | Anchor burn is handled exactly within bible 3.6 and 7.1; `bible_refs` present (`manuscript.md:101-102`, a bare path without section anchor); `continuity_notes` cite the story-0001 precedent. No locked character, the Heliodrome, or the Lattice Gap appears. |
| C Tonal fidelity | 5 | 2 | 10 | No lapse in register across five sections; dialogue minimal and audited (II: "Praise, in the Fleet, was issued in quantities small enough to be audited"); one physical sign per scene (II: "It went like breath leaving a cold pane of glass"; III: "His palms were dry. That frightened him more than shaking would have."); no spectacle by design. |
| D Craft and structure | 4 | 2 | 8 | Enters at the audit, exits at sleep; the burn is the irreversible change; the ending changes identity (V: "He was not the Elior Ren who had entered the corridor"). IV explains what III showed ("That was the part the ledger could not weigh"). |
| E Cross-canon coherence | 5 | 2 | 10 | Agrees with story-0022 (eleven anchors, named manifests) and `characters/Elior_Ren.md:50-56`. Depends only on primary canon. |
| F Repository hygiene | 3 | 1 | 3 | `events` and `bible_refs` present; `cross_refs` match the text. Omissions: `metadata.word_count: 3880` against roughly 3,330 body words; `atlas/Helios_Drift.md:31-33` does not list story-0013 or char-0017. |
| G Canon value | 5 | 1 | 5 | Sets the floor every later burn is measured against; Elior is already load-bearing in primary canon. Locks only what should be locked (audit procedure, mild-burn classification). |
| **Total** | | | **66 / 70** | |

Recommendation: Promote

Required fixes before promotion (if any):
- `manuscript.md`: `metadata.word_count: 3880` to the actual count; `bible_refs` entry to `bible/ARCHIVISTS_WAKE_STORY_BIBLE.md#36-anchor-burn-consequence` and `#71-anchor-rules`.
- `atlas/Helios_Drift.md`: add `story-0013` and `char-0017` to `cross_refs` and `references`.
- At promotion: `characters/Elior_Ren.md` `metadata.status` to `canonical`.

Contradictions found: none.

Author decisions needed: none.

### story-0014 — The Public Weight of a Private Lie
Current tier: draft / draft / metadata.status draft
Hard gates: PASS
Depends on: story-0001 (primary canon)
Depended on by: story-0016

What it establishes: The Heliodrome Authority (fact-0007) the day after the intervention of story-0001: restricted coherence reports, "message review", public sentences migrating into walls and transit boards as the station takes repeated phrasing for instruction, the bulletin line "Critical systems are being held by active work", a sealed corrective record witnessed by an Archivist with a dull stone, and the station's population given as eighty thousand. Communications officer Mael Ivar (char-0018) is introduced.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 5 | 3 | 15 | Public language as civic weight follows `AGENT.md` 1.1 ("Collective memory = macrogravity"; III: "Public memory was macrogravity. It pulled.") and bible 3.3. Drift order holds (I: stairwells "no longer returning to the levels painted beside their doors" before "A nursery wall had gone soft"). The Heliodrome is held, not healed (V: "The Heliodrome is held. It is not healed."), per bible 7.7. Cost is paid and not reversed (IV: the lie to his mother "took weight from both ends"; VI: the lost color of the assembly hall). No new law. |
| B Bible compliance | 5 | 3 | 15 | The Heliodrome is touched exactly within bible 3.3, 4.2, and 7.7, and `bible_refs` cites those sections (`manuscript.md:106-109`). No locked character appears; the intervention is referred to only as aftermath (I: "The rescue intervention bought us time"). |
| C Tonal fidelity | 4 | 2 | 8 | Restraint throughout; physical sign per scene (I: "His desk waited half a breath too long before agreeing to be horizontal"; II: "the visitor chairs all faced the wrong wall"). Lapses: VI's epigram triplet ("One was heavy. One was true. Neither was enough.") and V's exchange ("That distinction is where we put all the bodies") edge toward aphorism under pressure. |
| D Craft and structure | 4 | 2 | 8 | Enters on the omitted word, exits on the next sentence to be written; each section ends in an irreversible step (the bulletin voiced; the lie to his mother; the sealed record). IV to VI restate the lie-as-architecture idea more than once. Prose at publication standard. |
| E Cross-canon coherence | 5 | 2 | 10 | Matches `atlas/Heliodrome.md:54` (habitable only through constant reinforcement) and `factions/Heliodrome_Authority.md:46` ("Maintain the appearance of stability at all costs"). Entity invariants agree (`characters/Mael_Ivar.md:40-43`). Depends only on primary canon. |
| F Repository hygiene | 3 | 1 | 3 | `events` and section-anchored `bible_refs` present; `cross_refs` match the text. Omissions: `metadata.word_count: 4870` against roughly 4,480 body words; `atlas/Heliodrome.md:27-28` and `factions/Heliodrome_Authority.md:28-29` list only story-0001 and omit story-0014 and char-0018. |
| G Canon value | 4 | 1 | 4 | Establishes the Authority's post-intervention condition and the public-language mechanism story-0016 builds on; the sealed corrective record is a generative hook. Locks a population figure (eighty thousand) that later Heliodrome stories must honor. |
| **Total** | | | **63 / 70** | |

Recommendation: Promote

Required fixes before promotion (if any):
- `manuscript.md`: `metadata.word_count: 4870` to the actual count.
- `atlas/Heliodrome.md` and `factions/Heliodrome_Authority.md`: add `story-0014` and `char-0018` to `cross_refs` and `references`.
- At promotion: `characters/Mael_Ivar.md` `metadata.status` to `canonical`.

Contradictions found: none (population "eighty thousand" is new; see register note R-01 for the figure to be honored by story-0016).

Author decisions needed: none.

### story-0015 — The Halix Aftermarket
Current tier: draft / draft / metadata.status draft
Hard gates: PASS
Depends on: story-0004 (Hold); the premise is story-0004's closed-inheritance state and cannot be severed
Depended on by: story-0021

What it establishes: The Halix Exchange (loc-0013) from the bench: lot classifications pulsed through a trading mesh, the "no lot" entry, a bench bond spent to seal an unprofitable record, the outer-skin release chamber, and Consortium acquisition of provenance "for public trust". A closed Light-Bequest gains measurable weight from market attention and loses it when withdrawn. Tess Vlin (char-0019) buys the stone and releases it.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 4 | 3 | 12 | Attention as weight follows `mechanics/MEMORY_PHYSICS.md` section 5 and bible 3.1 (II: "The cradle scale registered a fractional rise ... The stone had not changed. The room had."); the story says so itself (III: "This was not a new law"). Cost is paid and shown (IV: "Her renewal number dimmed. There. Cost, small and exact."). The one unexplained piece is inherited: the closed carrier "with no usable memory" rests on story-0004's completion rule, which term-0021 does not contain despite `continuity_notes` line 90 claiming it does. |
| B Bible compliance | 5 | 3 | 15 | No locked character, the Heliodrome, the Lattice Gap, zero-anchoring, eddies, or anchor burn appears. |
| C Tonal fidelity | 3 | 2 | 6 | Register is dry and exact with physical signs per scene (I: "The booth thickened"; III: "the deck remembered for a moment that it was a ship"). Lapses: repartee runs thick under pressure (IV: "Sometimes there are three, if lunch is slow"; "The Lattice prefers mirrors." "Careful."; III: "Honest like Halix." "That is not a compliment."), against `docs/STYLE.md` section 12 on banter under pressure. |
| D Craft and structure | 4 | 2 | 8 | Enters on the case, exits on the next customer; each section ends in an irreversible step (classification pulsed; bond spent; stone released). III explains the physics to the reader in a paragraph ("Collective attention made weight. A station survived because..."). Prose at publication standard. |
| E Cross-canon coherence | 2 | 2 | 4 | Entity invariants agree (`characters/Tess_Vlin.md:41-44`); the Halix atlas matches; the reference to "the Consortium fixer who had stood at Tess's bench for a different Light-Bequest" (II) matches story-0004. The story depends on story-0004, which scores Hold, and on a completion rule documented nowhere outside speculative entity files. |
| F Repository hygiene | 3 | 1 | 3 | `events` present; `cross_refs` match; `word_count` accurate. `continuity_notes` line 90 overstates term-0021; "no lot", "bench bond", and "closed inheritance" have no lexicon entries; `characters/Tess_Vlin.md:50` is `speculative`. |
| G Canon value | 3 | 1 | 3 | Useful texture for the memory market and for Consortium acquisition practice; locks little beyond the Halix procedures. Its value is conditional on the completion rule being canonized. |
| **Total** | | | **51 / 70** | |

Recommendation: Promote after fixes, and only after story-0004 is promoted (the dependency cannot be severed)

Required fixes before promotion (if any):
- The term-0021 completion-state fix listed under story-0004 (it is this story's premise).
- `manuscript.md:90`: current "Light-Bequest behavior follows story-0004 and data/lexicon/terms.yaml term-0021: the intended hearing completes the inheritance function"; proposed, once the lexicon is updated, leave as is; until then it is a claim the lexicon does not support.
- `data/lexicon/terms.yaml`: add "No Lot" (Halix ledger status for an object withdrawn from commerce) under Technology or Factions, `canonical_source: atlas/Halix_Exchange.md`.
- At promotion: `characters/Tess_Vlin.md` and `atlas/Halix_Exchange.md` `metadata.status` to `canonical`.

Contradictions found: none with primary canon. Register C-04 (completion rule undocumented) applies.

Author decisions needed: none beyond the story-0004 decision on closed inheritance.

### story-0016 — The Lie That Learned the Hallway
Current tier: draft / draft / metadata.status draft
Hard gates: PASS
Depends on: story-0001 (primary canon), story-0014 (Promote)
Depended on by: none

What it establishes: The Heliodrome route board generating "safe routes" from the bulletin spine and dropping clerk warnings; a route table's witness socket that accepts a personal memory stone to outweigh public shorthand locally; the "ugly map" kept on paper; one resident lost behind a duplicated door; the revised bulletin "Held does not mean whole." Junior continuity cartographer Nessa Iral (char-0020) renders away her childhood route home.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 4 | 3 | 12 | Civic shorthand outweighing local records follows `AGENT.md` 1.1 and bible 3.3 (II: "If fewer people named it, it became lighter"). Drift order holds (V: the map twists on "station-left" before the door folds). The memory is rendered and lost, not copied (III: "Not a copy."; IV: "She could not walk them home"), and never restored (VI: "'Was,' she said."). One hand-wave: the transfer happens by attention alone into an empty stone with no band, cradle, or drive (IV: "The stone took it"), where story-0011 needs a sensorium band for the same act. |
| B Bible compliance | 5 | 3 | 15 | The Heliodrome is touched within bible 3.3, 7.7, and 8.3, each cited by section in `bible_refs` (`manuscript.md:111-114`). No locked character appears. |
| C Tonal fidelity | 4 | 2 | 8 | Restraint and physical signs throughout (I: "The office wall gave a soft click. A label ... changed to RESIDENTIAL LINEN and back"; IV: "she smelled laundry and warm pipe, and then the smell vanished"). Lapses: aphorism density (II: "Intentional harm is a luxury. Most damage is procedural."; V: "Trust did not break like glass. It lost density."; VI: "Truth was not kinder than lies. It only failed differently."). |
| D Craft and structure | 4 | 2 | 8 | Enters on the beautiful map, exits on the next update; the rescue is costed and one person is lost; the ending changes identity and structure. V's "Not collapse. Not stability. Work." repeats the closing triplet used by story-0010 and story-0014. |
| E Cross-canon coherence | 5 | 2 | 10 | Continuous with story-0014 in every particular (bulletin wording, the booth, the acting director); `characters/Nessa_Iral.md:44-47` invariants agree; the Heliodrome remains held, not healed. Depends only on primary canon and a draft this review recommends for promotion. |
| F Repository hygiene | 4 | 1 | 4 | `events`, section-anchored `bible_refs`, accurate `word_count`, matching `cross_refs`. Omissions: `atlas/Heliodrome.md` and `factions/Heliodrome_Authority.md` do not list story-0016 or char-0020; "witness socket" and "ugly map" have no lexicon entries. |
| G Canon value | 3 | 1 | 3 | A sound local extension of story-0014; the route-board mechanism is reusable and already warned against becoming a "formal metaphysical system" in Nessa's watchlist. |
| **Total** | | | **60 / 70** | |

Recommendation: Promote, after story-0014

Required fixes before promotion (if any):
- `atlas/Heliodrome.md` and `factions/Heliodrome_Authority.md`: add `story-0016` and `char-0020`.
- At promotion: `characters/Nessa_Iral.md` `metadata.status` to `canonical`.

Contradictions found: R-02 (rendering apparatus differs between story-0011's sensorium band and this story's attention-only transfer; reconcilable as two Archivist practices, but the lexicon should say so).

Author decisions needed: none.

### story-0017 — The Loss Ledger
Current tier: draft / draft / metadata.status draft
Hard gates: PASS
Depends on: story-0001 (primary canon)
Depended on by: story-0021 (route chart H-37's suspension is its premise)

What it establishes: The Canticle Loss Ledger on-page (six sealed cabinets, ceramic slates that bow under old entries, a witness relay to the Orders); anchor burn leaving a "contour" in a route chart that used it; route chart H-37 in the Helios Drift (loc-0008), certified clean on an excised personal burn and invalidated to amber pending recertification; pilots' three private lines per burn report. Records clerk Corin Tave (char-0021) and deceased charting pilot Lysa Korr (char-0022).

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 4 | 3 | 12 | Residue in a chart follows `mechanics/CORRIDOR_MECHANICS.md` section 8 ("personal anchor-tax") and is never mistaken for recovery (II: "Recovery would be restoration. Restoration is impossible."). The Loss Ledger is the `manuals/PILOT_MANUAL.md` 9.2 record. Costs are paid in traffic and rationing (V), nothing is refunded. One count does not reconcile: II gives Lysa fourteen anchors, "Three mild burns ... One moderate burn", an audit of "eleven" before H-37, and a final "nine"; the figures work only if the moderate burn was on her fatal run, yet IV has her filing an addendum for it. |
| B Bible compliance | 5 | 3 | 15 | Anchor burn and corridor rules are handled within bible 3.6, 7.1, 7.2, cited by section (`manuscript.md:120-123`); ejection "into sealed reality-layer" (II) matches `manuals/PILOT_MANUAL.md` 4.4. No locked character appears. |
| C Tonal fidelity | 4 | 2 | 8 | Restraint and procedure throughout; physical signs per scene (I: "The room seemed to settle a fraction lower"; V: "The page bowed slightly under his palm"). Lapses: aphorisms under pressure (II: "We are holy, Clerk Tave. Not innocent."; III: "Physics had already been paid. Civilization had stolen the receipt."). |
| D Craft and structure | 4 | 2 | 8 | Enters on the chart, exits in the dark; Lysa's private lines (IV) carry the emotional weight without spectacle; the entry is the irreversible change and the ending changes structure (H-37 amber) and Corin's standing. V explains what it showed ("That was not justice ... memory did not balance. It accumulated."). |
| E Cross-canon coherence | 4 | 2 | 8 | `characters/Corin_Tave.md` and `characters/Lysa_Korr.md` invariants agree, and the H-37 suspension is already honored by `characters/Hol-Vren.md` and story-0021. The anchor arithmetic above is an intra-story tension a later story could inherit. "Corin" shares a name with the Ostra-Vael maintenance worker in story-0005 (register R-03). |
| F Repository hygiene | 3 | 1 | 3 | `events`, section-anchored `bible_refs`, matching `cross_refs`. Omissions: `metadata.word_count: 5200` against roughly 4,610 body words; `atlas/Helios_Drift.md` lists neither story-0017 nor char-0021/char-0022; H-37, reused by story-0021, has no lexicon or atlas entry. |
| G Canon value | 4 | 1 | 4 | Puts the Loss Ledger and the Fleet's hidden-subsidy problem on the page; H-37 is already reused. Locks only what should be locked. |
| **Total** | | | **58 / 70** | |

Recommendation: Promote after fixes

Required fixes before promotion (if any):
- II, Lysa's audit: current "Anchor count before run: eleven. / Anchor count after run: eleven."; proposed "Anchor count before run: ten. / Anchor count after run: ten." (or, if the moderate burn is meant to be the fatal run, cut the addendum line in IV: "Lysa's addendum was only one line: Accuracy is not mourning, but it is the part command permits." and move that sentence to the third burn). Author chooses; the file for Lysa should then state the counts.
- `manuscript.md`: `metadata.word_count: 5200` to the actual count.
- `atlas/Helios_Drift.md`: add story-0017, char-0021, char-0022.
- `data/lexicon/terms.yaml`: add "Loss Ledger" (canonical_source `manuals/PILOT_MANUAL.md`) and a draft entry for "Route Chart H-37".
- At promotion: `characters/Corin_Tave.md` and `characters/Lysa_Korr.md` to `canonical`.

Contradictions found: R-03 (name collision "Corin" with story-0005, no link intended); R-04 (Lysa's anchor arithmetic, intra-story).

Author decisions needed: Which fix to the anchor arithmetic.

### story-0018 — The Navigator Who Forgot Enough
Current tier: draft / draft / metadata.status (absent)
Hard gates: PASS
Depends on: story-0001 (primary canon), story-0007 (Promote after fixes)
Depended on by: none

What it establishes: A Canticle petition to use a Solace patient's amnesiac lightness for a tethered crossing of a zero-coherence margin; a consent audit with the witness stone under thinning consent ("I choose to try. I do not choose to be spent."); the finding that lightness lets the Void reach deeper rather than sparing the crosser, and that retrieving a name from the margin draws on the witness's relationship memory; Lira's ledger line "No protocol established." Nim Orra (char-0023) is introduced; Lira Voss (char-0008) loses part of her remembered bond.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 3 | 3 | 9 | The Void matches `lore/COSMIC_REGIONS.md` section 5 and `atlas/Void_Regions.md` (IV: "only the absence of claims"); the lore line on amnesiacs is complicated as Lira's finding, not rewritten (I: "The old atlas line said amnesiacs could navigate there freely ... Freely was not safely."; V: "No protocol established."). Costs are paid and not reversed (V: "No memory restored. No route recovered."). Hand-waved: the Void drawing Lira's memories of Nim through the tether (IV: "Relationship was memory under tension. The Void could use it.") is asserted, not traced to a rule; the name "made the room heavier" follows from names gathering mass. |
| B Bible compliance | 4 | 3 | 12 | No locked character, the Heliodrome, zero-anchoring, eddies, or anchor burn appears. The Lattice Gap is not named, but the story relocates loc-0010, which `atlas/Solace_Hospice.md:11` places in the Lattice Gap's outer sleeve, to "the edge of the Void Regions" (`manuscript.md:54`; I: "The Void Regions lay beyond the station's outer sleeve"). `bible_refs` cites top-level sections 3 and 7 without subsection anchors. |
| C Tonal fidelity | 4 | 2 | 8 | Restraint throughout; Nim's humor is dry and pressure-releasing (II: "a compliment that has lost its manners"; "forgetting ... does not send a packing list"); one physical sign per scene (II: "The cup made the faint ceramic note of an object accepting instruction"; IV: "the hatch became a circle without promise"). Lapse: V's epigram "A perfect procedural sentence. A terrible moral one." |
| D Craft and structure | 4 | 2 | 8 | Enters on the unsealed petition, exits on a stranger's polite smile; the audit and the crossing are each costed; the ending changes identity on both sides. IV's "Nim screamed once" is the one beat that leans on volume. Prose at publication standard. |
| E Cross-canon coherence | 3 | 2 | 6 | Consistent with story-0007 (same chamber, same doctrine wall, same witness stone) and with `characters/Nim_Orra.md:45-48`. One reconcilable tension: the hospice's region (Lattice Gap outer sleeve in the atlas and story-0007; Void edge here; Helios Drift in story-0003), register C-02. Depends on a draft recommended for promotion after fixes. |
| F Repository hygiene | 3 | 1 | 3 | `events` present and aligned; `cross_refs` match. Omissions: no `metadata.status`, no `metadata.word_count` (`manuscript.md:109-111`); `bible_refs` without subsection anchors; `atlas/Solace_Hospice.md` and `atlas/Void_Regions.md` list neither story-0018 nor char-0023. |
| G Canon value | 4 | 1 | 4 | Closes a loophole the lore line invites (V: "amnesiac lightness is not a method. It is an injury."), which is exactly the kind of guard the setting needs; Nim's watchlist already forbids reuse as a technique. |
| **Total** | | | **50 / 70** | |

Recommendation: Promote after fixes, after story-0007

Required fixes before promotion (if any):
- Resolve the hospice geography (C-02). Proposed: `atlas/Solace_Hospice.md:11` current "A monastic station orbiting the Lattice Gap's outer sleeve."; proposed "A monastic station orbiting the Lattice Gap's outer sleeve, where the Gap's thinning meets a zero-coherence margin of the Void Regions." Then this story's setting stands and story-0003's "Helios Drift" is the odd one out.
- `lore/COSMIC_REGIONS.md` section 5: append one sentence after "amnesiacs can navigate freely; others risk dissociation": "Retrieving meaning from a zero-coherence margin still costs the crosser and any witness holding a line to them (story-0018)."
- `manuscript.md`: add `metadata.status: draft` and `metadata.word_count` (roughly 4,600); `bible_refs` to `#36-anchor-burn-consequence` and `#71-anchor-rules` or drop the bible refs if the author judges no locked element is touched.
- `atlas/Solace_Hospice.md` and `atlas/Void_Regions.md`: add story-0018 and char-0023.
- At promotion: `characters/Nim_Orra.md` to `canonical`.

Contradictions found: C-02 (hospice region, three placements across story-0003, story-0007/atlas, story-0018).

Author decisions needed: Where the Solace Hospice is (the same decision as story-0003's).

### story-0019 — The Miniaturist's Name
Current tier: draft / draft / metadata.status draft
Hard gates: PASS
Depends on: primary canon only
Depended on by: none

What it establishes: The Mnemosyne Lattice Core's patent gallery and recognition archive (loc-0005); lineage registration as the only record "heavy enough" to correct a Consortium patent; Drift Clade names as temporary obligations ("a promise with an exit"); the "little throat" (a miniature resonator in compact memory drives) and the intentional third-notch asymmetry of the Ivo-Senn hand. Yaret Ivo-Senn (char-0024) registers the line and carries a name that can no longer be thinned.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 4 | 3 | 12 | Record weight follows `mechanics/MEMORY_PHYSICS.md` sections 1.1 and 5 (II: "The patent did not need to argue. It was too heavy."); handled objects gaining weight follows 4.1 (III: "Memory gathered through use"). The cost is shown as physical (IV: "The hyphen, which had once been a bridge, set like cooled metal") and not reversed (VI: "The Core had taken that option"). One effect is hedged rather than traced: a Core registration firming a bench on a distant pod (III: "Its left leg stopped drifting"; V: "perhaps only in her imagination and perhaps not"). The registry plate reads memory pressure without taking it, and the boundary holds. |
| B Bible compliance | 5 | 3 | 15 | No locked character, the Heliodrome, the Lattice Gap, zero-anchoring, eddies, or anchor burn appears. |
| C Tonal fidelity | 4 | 2 | 8 | Restraint and physical signs throughout (I: "the floor insisted on a public gait"; IV: "The registry plate sank a fraction into the table"). Lapses: epigrams stack at the close (VI: "Recognition was not the opposite of erasure. It was another pressure placed on the same bone."; "Justice had mass. So did a wound.") and IV's "You people can make a knife out of a bandage" is a quip under pressure. |
| D Craft and structure | 4 | 2 | 8 | Enters on the gallery, exits on the shuttle; the registration is the irreversible change; the ending changes identity. VI explains in a list what IV showed. Prose at publication standard. |
| E Cross-canon coherence | 5 | 2 | 10 | Matches `factions/Drift_Clades.md:50` (impermanence, miniaturization), `atlas/Mnemosyne_Lattice_Core.md:47` (machinery that erases inconvenient facts), and story-0004's grandfather whose flux throttle "the lattice still uses, although they do not call it by your name". `characters/Yaret_Ivo-Senn.md:37-40` invariants agree. No dependencies. |
| F Repository hygiene | 4 | 1 | 4 | `events` present and aligned; `cross_refs` match; `word_count` accurate. Omissions: `atlas/Mnemosyne_Lattice_Core.md` and `factions/Drift_Clades.md` do not list story-0019 or char-0024; "lineage registration" and "little throat" have no lexicon entries. |
| G Canon value | 3 | 1 | 3 | Documents Drift Clade naming and the Core's recognition machinery, both reusable; local in consequence. |
| **Total** | | | **60 / 70** | |

Recommendation: Promote

Required fixes before promotion (if any):
- `atlas/Mnemosyne_Lattice_Core.md` and `factions/Drift_Clades.md`: add story-0019 and char-0024.
- At promotion: `characters/Yaret_Ivo-Senn.md` to `canonical`.

Contradictions found: none.

Author decisions needed: none.

### story-0020 — The Inventory of Absence
Current tier: draft / draft / metadata.status draft
Hard gates: FAIL (dependency on the novel draft: the setting, the "floater" phenomenon, and the conspiracy frame exist only in `stories/novel/NOVEL_FORGOTTEN_TIDES/outline.md:23-39`; `atlas/Heavonly.md:13` says Heavonly is "developed in the Forgotten Tides novel draft"; `continuity_notes` line 103 names "planetary bleaching" and "Gorgi"; IV: "He knew the word for it from maintenance briefings and lower-deck jokes. Floater.")
Depends on: the novel draft (undeclared in `references.stories`, which is empty)
Depended on by: none

What it establishes: Heavonly's lower-deck freight intake (loc-0014): a Consortium-tagged lot from a quarantined "mid-world" whose manifest says NO CARGO, seventeen sealed containers that lower bay coherence and erase their own count, chalk as counting that systems cannot smooth, a "floater" (a drifting speck of zero-memory residue) emerging from a seal, and freight auditor Toma Vey (char-0025) filing the lot as his own personal effects so the station must keep counting it, at the cost of his meal credit, residence access, and shift history.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 2 | 3 | 6 | Drift order holds (II: TWELVE "had become TWE ... It remembered intake. It remembered freight. It was less certain of which freight, which bay, which number"), and the cost is shown and not reversed (VI: "Shift history displayed only the current watch"). But the floater (IV: "frost without cold ... Tiny. White. Lighter than dust ... passed halfway through a conduit label ... The label now read OX") is a phenomenon in no mechanics or lore document, and the absence-bearing containers' effect ("lowered local coherence") is asserted without a stated rule, where term-0027's null stones would have supplied one. |
| B Bible compliance | 5 | 3 | 15 | No locked character, the Heliodrome, the Lattice Gap, zero-anchoring, eddies, or anchor burn appears. |
| C Tonal fidelity | 3 | 2 | 6 | Restraint and physical signs throughout (I: "the ordinary noises thinned to a polite distance"; II: "Thirteen resisted the chalk"). Lapses: quips under pressure thicken (II: "Upstairs thinks cargo levitates into their speeches"; V: "So is an airlock, in many rooms."; VI: "Probably is an upper-deck word for making someone else stand in front of the door"). |
| D Craft and structure | 4 | 2 | 8 | Enters on the early manifest, exits on a chalked door; each section ends in an irreversible step; the ending changes identity and structure. VI's "That was not victory. It was inventory." repeats the closing triplet of story-0010, story-0014, and story-0016. Prose at publication standard. |
| E Cross-canon coherence | 1 | 2 | 2 | Entity invariants agree (`characters/Toma_Vey.md:38-41`), and the Consortium's conduct matches fact-0003. But the story depends on the novel draft for its premise, and promotion would lock Heavonly's geography ("gateway to three galaxies"), the floater phenomenon, and the existence of the extraction conspiracy before the novel does. `lore/MEMORY_ECONOMY.md` section 3 already defines "The Bleaching" as a market crash; the story's "bleaching-conspiracy" tag uses the word for the novel's planetary bleaching, two senses of one term (register C-10). |
| F Repository hygiene | 3 | 1 | 3 | `events` present and aligned; `cross_refs` match; `word_count` accurate. Omissions: the novel dependency is absent from `references.stories`; "floater" has no lexicon entry; `atlas/Heavonly.md` has `coordinates.region: High-density political hub and intergalactic gateway`, a description rather than a region name. |
| G Canon value | 1 | 1 | 1 | Locks what should stay open until the novel sets it: Heavonly, floaters, and the conspiracy's shape. The lower-deck perspective is good material for the novel, not for primary canon ahead of it. |
| **Total** | | | **41 / 70** | |

Recommendation: Hold (hard gate FAIL on novel dependency)

Required fixes before promotion (if any):
- Not fixable until the novel's Heavonly, floater, and bleaching canon is promoted or documented in lore. Then: add the novel's story id to `references.stories`, add "Floater" to `data/lexicon/terms.yaml` with a mechanics source, and reconcile "bleaching" with `lore/MEMORY_ECONOMY.md` section 3.
- Meanwhile, consider `canon_tier: speculative` with a `continuity_notes` line stating the story is bound to the novel draft.

Contradictions found: C-10 ("The Bleaching" as a market crash in `lore/MEMORY_ECONOMY.md` and in story-0004 vs "planetary bleaching" in the novel outline and this story's notes).

Author decisions needed: Whether Heavonly and floaters are to be defined by the novel first (recommended) or documented now in lore so short stories can use them.

### story-0021 — Receipt for a Voice
Current tier: draft / draft / metadata.status draft
Hard gates: PASS
Depends on: story-0001 (primary canon), story-0004 (Hold), story-0015 (Promote after fixes), story-0017 (Promote after fixes), story-0013 (Promote)
Depended on by: story-0022 (primary canon; `references.stories` includes story-0021, and `characters/Elior_Ren.md:63` cites this story for his named-manifest discipline)

What it establishes: The downstream cost of story-0017's correction: H-37's suspension strands the Skather-Ait pod's frame filament; Tess Vlin's bond is too depleted after story-0015 to advance the fare; Yenu renders the sound of her grandfather's correction into a tuned stone under a consent form that names the exact experience, the use, and the return-or-destroy option; Elior Ren flies the longer line and spends the stone; Hol-Vren retunes the frame. Nothing is restored.

| Criterion | Score | Weight | Points | Evidence |
|---|---|---|---|---|
| A Metaphysical fidelity | 5 | 3 | 15 | Every effect traces to a rule: ethical rendering per `lore/MEMORY_ECONOMY.md` section 2 with consent, assay, and named use ("You can consent to a rendering. Then I can make one. Those are separate acts."); the stone is consumed once and the donor does not pay twice ("The drive's expenditure did not take the memory a second time."); the closed bequest cannot power a drive, per term-0021; drift fails in meaning first (opening: "The corner ... could no longer decide which wall it belonged to"). The loss is shown ("she found only the corrected words in her own voice") and never reversed ("The sound she had spent did not return."). |
| B Bible compliance | 5 | 3 | 15 | Anchor and corridor rules handled within bible 3.6, 7.1, 7.2 and cited by section (`manuscript.md:120-123`); Elior's eleven anchors and unrestored classroom smell honored. No locked character appears. |
| C Tonal fidelity | 5 | 2 | 10 | No lapse in register across four sections; dialogue minimal and subtextual (Hol-Vren: "Both things can be true."; Tess: "You can hate it when your walls are holding."); one physical sign per scene (the chalk mark changing sides; "The ring let go. Yenu gripped the edge of the counter."); the mother's restraint scene earns its emotion through cost alone. |
| D Craft and structure | 5 | 2 | 10 | Enters on the corner, exits on footsteps passing it; every scene runs Situation, Costed Action, Irreversible Change; the ending changes identity (a voice gone) and structure (the frame holds); roughly 2,700 words with nothing slack. |
| E Cross-canon coherence | 2 | 2 | 4 | Agrees with every predecessor and every entity file (`characters/Yenu_Skather-Ait.md:25`, `characters/Hol-Vren.md:24`, `characters/Elior_Ren.md:56`, `characters/Tess_Vlin.md:44`). The deduction is structural: the story depends on story-0004 (Hold) and story-0015 and story-0017 (Promote after fixes), and its own premise cannot stand without them. |
| F Repository hygiene | 4 | 1 | 4 | `events`, section-anchored `bible_refs`, accurate `word_count`, complete `cross_refs` including the story-0017 characters; entity files already carry its continuity. Omissions: `atlas/Halix_Exchange.md` and `atlas/Helios_Drift.md` do not list story-0021. |
| G Canon value | 4 | 1 | 4 | Binds four drafts into one consequence chain and is already relied on by primary canon; locks only the chain's facts. |
| **Total** | | | **62 / 70** | |

Recommendation: Promote, in a bundle after story-0004, story-0015, story-0017, and story-0013

Required fixes before promotion (if any):
- `atlas/Halix_Exchange.md` and `atlas/Helios_Drift.md`: add story-0021.
- At promotion: `characters/Yenu_Skather-Ait.md`, `characters/Hol-Vren.md`, `atlas/Skather-Ait_Pod.md` to `canonical`, and remove the "draft continuation" wording in those files and in `characters/Yenu_Skather-Ait.md:28`.

Contradictions found: none.

Author decisions needed: none beyond the story-0004 decision this chain waits on.

## 7. Fix list by story

Union of the "Required fixes" entries above, grouped. Entity-status changes marked "at promotion" are the promotion tool's manual checklist and are not repeated here.

- **story-0002**: not fixable by wording; set `canon_tier: sandbox` and `status: speculative` if kept; add `canon_tier` and `retrieval_role` in any case; remove the stray non-English string in ESCALATION ("He gestures,説明している — explaining." to "He gestures, explaining.").
- **story-0003**: populate `cross_refs`/`references` (loc-0010, loc-0013, loc-0008, fact-0006, fact-0004, fact-0005); add `characters/Indre_Vael.md`; add `events`; correct `word_count`; add lexicon "Cut Harmonic"; resolve the hospice region (C-02); I "her last raveling" to "her last unmaking".
- **story-0004**: populate `cross_refs`/`references` (char-0026, char-0027, char-0019, loc-0015, loc-0013, loc-0008, fact-0004, fact-0003, fact-0006); add `events`; term-0021 completion state and new terms "Coherence-Frame", "Closed Inheritance"; `continuity_notes` line 1 rewording; V "dyers" to "the dying"; move story-0003 from `references.stories` to `cross_refs.stories`; add `characters/Aurel_Ket.md`.
- **story-0005**: rewrite IV (not a hygiene fix); independently canonize term-0022 to term-0024 with a lore or mechanics `canonical_source`; add `bible_refs`, `events`; correct `word_count`; atlas entry or removal for the *Iron Vow*.
- **story-0006**: not fixable by wording; if kept, `canon_tier: sandbox`, `status: speculative`, and set `characters/Kael_Voss.md` and `atlas/Ebbhaven.md` to `speculative`.
- **story-0007**: add `bible_refs` (3.6, 4.1, 7.1); add `timeline` and `events`; add `retrieval_role`, `metadata.status`, `metadata.word_count`; lexicon "Witness Stone", "Preservation Hold"; `characters/Maren_Holt.md` to `canonical` at promotion.
- **story-0008**: add `events`; add char-0029 to both ref blocks; add `bible_refs`; correct `word_count`; author decision on "year 2244".
- **story-0009**: assemble the manuscript and set `word_count`; lexicon "Full Resonance", "Transit Resonance", "Witness Custody", "Anchor Weather", "Memory Shadow"; `mechanics/ANCHOR_THEORY.md` note distinguishing sealed custody from zero-anchoring; section-anchored `bible_refs`; atlas or continuity entries for Tern Gate, the *Pell*, the *Vesper*; align `continuity_brief.md` status fields.
- **story-0010**: add story-0010 to `atlas/Mnemosyne_Lattice_Core.md` and `factions/Mnemosyne_Lattice_Consortium.md`.
- **story-0011**: correct `word_count`; add char-0015 and story-0011 to `atlas/Remnant_Seas.md`.
- **story-0012**: term-0027 alias or note for the Synod's lamps.
- **story-0013**: correct `word_count`; section-anchor the `bible_refs`; add story-0013 and char-0017 to `atlas/Helios_Drift.md`.
- **story-0014**: correct `word_count`; add story-0014 and char-0018 to `atlas/Heliodrome.md` and `factions/Heliodrome_Authority.md`.
- **story-0015**: the term-0021 fix (shared with story-0004); lexicon "No Lot"; `continuity_notes:90` stands once the lexicon is updated.
- **story-0016**: add story-0016 and char-0020 to `atlas/Heliodrome.md` and `factions/Heliodrome_Authority.md`.
- **story-0017**: Lysa Korr anchor arithmetic (II "eleven" to "ten", or move the fourth-burn addendum); correct `word_count`; atlas back-references; lexicon "Loss Ledger" and a draft "Route Chart H-37".
- **story-0018**: hospice geography (C-02) and the `lore/COSMIC_REGIONS.md` section 5 sentence; add `metadata.status` and `word_count`; `bible_refs` anchors; atlas back-references for story-0018 and char-0023.
- **story-0019**: add story-0019 and char-0024 to `atlas/Mnemosyne_Lattice_Core.md` and `factions/Drift_Clades.md`.
- **story-0020**: blocked until the novel's Heavonly, floater, and bleaching canon exists; meanwhile `canon_tier: speculative` with a note binding it to the novel draft.
- **story-0021**: add story-0021 to `atlas/Halix_Exchange.md` and `atlas/Helios_Drift.md`; at promotion, remove "draft continuation" wording from `characters/Yenu_Skather-Ait.md`, `characters/Hol-Vren.md`, `atlas/Skather-Ait_Pod.md`.
- **Repository-wide** (surfaced by the review, not charged to any story): `data/timeline/events.yaml` holds only story-0001 and story-0022 events, so a promoted story's shared events must be added there by hand (the promotion tool only edits entries already present); story-0001's own frontmatter has no `canon_tier` or `status` field and is primary by path inference; the redline linter fires only on locked IDs in `cross_refs`, so a story that names the Lattice Gap or zero-anchoring in prose without listing loc-0003 passes with no `bible_refs`.

## 8. Author decisions

1. **Closed inheritance (C-04).** Is a light-bequest that discharges into its intended hearer, leaving an inert carrier, canon? Yes: append the rule to term-0021 and `lore/MEMORY_ECONOMY.md` 1.4, and the story-0004, story-0015, story-0021 bundle can proceed (cost: a documented sub-rule for a reliquary class that primary canon already uses as pledges). No: story-0004 V needs rewording so the stone only goes quiet, and story-0015's premise is gone (cost: one story loses its reason to exist, and three entity files change).
2. **Where the Solace Hospice is (C-02).** Lattice Gap outer sleeve (atlas, story-0007): story-0003 changes two fields and story-0018's "edge of the Void Regions" needs the atlas to say the Gap meets a Void margin there. Helios Drift (story-0003): the atlas, story-0007, and story-0018 all change, and the Gap setting of story-0007 is lost. Recommended: the first.
3. **Novel-bound material (story-0020, C-10).** Define Heavonly, floaters, and planetary bleaching in the novel first (recommended; story-0020 stays draft or speculative until then), or document them now in lore so short stories may use them (cost: the novel inherits locked definitions it did not write).
4. **Entity status inconsistency.** Lira Voss is `canonical` and Maren Holt `speculative` from story-0007; Kaelen, Vane, Kael Voss, and Ebbhaven are `canonical` from stories that cannot be promoted; Inya Solven was `canonical` while story-0008 was a draft; every character from the July batch is `speculative`. Options: a rule that entity status follows the highest tier of any story that references the entity (what the promotion tool's checklist assumes), or a one-time pass setting story-0005 and story-0006 entities to `speculative`.
5. **The novella's mechanics (story-0009).** Whether full resonance, transit resonance, and sealed witness custody become lexicon and mechanics entries. Yes: the novella can be promoted by hand after assembly. No: the climax of Scene 11 rests on an undocumented technique and the novella stays draft.
6. **story-0005.** Keep with a rewritten climax, or sandbox it and canonize only its three lexicon terms (which primary canon already uses).
7. **story-0002 and story-0006.** Deprecate, sandbox, or rewrite the premise. Neither reaches primary canon in its current form.
8. **story-0017's anchor arithmetic (R-04).** Change the audit figure to ten, or move the fourth-burn addendum to the third burn.
9. **story-0008's "year 2244".** Keep an in-world calendar year or replace it with a relative cue.

## 9. Method note

Every manuscript in scope was read in full, in ID order: story-0002 through story-0008, then the novella story-0009 (all twelve scene files under `scenes/`, the outline, and the continuity brief, since `manuscript.md` is a 22-word scaffold), then story-0010 through story-0021. Each story's card was written to a scratch file before the next manuscript was opened; entity files for stories 0016 to 0020 were read ahead of their manuscripts, which the contract permits, and no manuscript was read ahead. Every entity file in each story's `cross_refs` and `references` was read, including `continuity.invariants` and `continuity.watchlist`, plus the entity files the prose names but the frontmatter omits (story-0003, story-0004). The required reading (AGENT.md, STYLE.md, the three mechanics files, the pilot manual, the bible, the four lore files, the two theology files, the lexicon, both primary exemplars, the playbook, the schema quick reference, the story schema, and CANONICAL_INDEX.md) was read in full before the first draft was opened. Scores were set against the two primary exemplars; criterion B scores of 5 for stories that touch no locked element follow the rubric's own definition. The report was re-read once for claims without a citation; each deduction cites a section and a quotation of at most fifteen words or a `path:line`.
