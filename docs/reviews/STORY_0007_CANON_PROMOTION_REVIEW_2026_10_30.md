# Canon Promotion Review: The Hospice Knot

**Current checkpoint:** On November 1, 2026, the author approved promotion
of the **62/70** revision merged in PR #59. Story-0007 is now
primary_canon / canonical / authoritative; its six local events are primary
canon. Its approved manuscript body is byte-identical. Lira, Maren and Solace
remain speculative pending separate full-profile claim approval. Section 11
records the promotion. Sections 1–9 preserve the original **38/70 Hold**
review and proposals; section 10 records the approved revision and readiness
assessment. The former consent-detector finding remains resolved.

## 1. Scope and baseline

Reviewed **story-0007 only**, plus Lira Voss, Maren Holt, Solace Hospice and
the causal links in Canticle Fleet / Remembrancers of Solace. The author
selected the audit's first recommendation, a review-only batch. Story-0018
is checked as a downstream dependency, not scored or selected for revision.

Evidence is current fetched main
**e92ceea2956abb3e9682613a216bf6caf7284c9b**, including PR #58. The clean
branch `docs/reviews/story-0007-canon-2026-10-30` starts there. The earlier
remaining-work audit commit `89f9f51` remains preserved on its pushed branch;
this report does not replace it or any earlier report.

`npm ci` and the complete `npm run validate:ci` passed before draft review.
Graph: **175 entities, 814 edges, zero orphaned targets**. Continuity and
timeline JSON reports contain zero hard failures and zero soft warnings,
including no 0007-specific issue. Schema: 127 seen / 109 validated / 18
skipped, 21 advisories. Glossary: 976 advisory candidates. The two draft
red-line warnings concern 0005/0007. Current map data/viewer/render/chart/depth
tests pass; the separate hosted browser jobs were not run or claimed here.
`report:canon-tiers` was run and its output inspected. An inferred tier in
that report is not a missing-field error by itself.

Citation key **S7** means
`stories/short_story/the_hospice_knot/manuscript.md` at this baseline.
Line references are to unchanged source files, not proposed text. Current S7
has 2610 whitespace-delimited body words, summaries of 121/349 characters,
and no `metadata.status`, word count, chronology, events or bible citations.
Its gray-matter content SHA-256 is:

~~~text
19e85ed0f4c5ba15ad3ac56f57503aa4ec7dc8cd004d9fafad505e450ae0e7c6
~~~

Settled 0004/0015/0017/0021 story decisions, the separately approved profile
scopes, and the PR #57 expanded claims are preserved. Their current final
records govern over older pending language. No concrete conflict with those
decisions warrants reopening them.

## 2. Summary table

| ID | Title | Total | Hard gates | Band | Required fix groups | Story/event prerequisites |
| --- | --- | --- | --- | --- | --- | --- |
| story-0007 | The Hospice Knot | **38/70** | **FAIL: undocumented objective consent detection** | **Hold** | 7, F1–F7 | None declared; no novel/novella outcome found |

The [review rubric](../../agents/canon_promotion_review_agent.md),
[source-first policy](../governance/source_first_approvals.md), and
[provisional-profile decisions](../governance/provisional_profiles.md)
govern this report. The score is for the current manuscript. It is not a forecast score for the
proposed revision. Profile claims and faction-reference dispositions below
are not automatically approved by the story's eventual approval.

## 3. Hard-gate failures

**FAIL — undocumented artifact capability / criterion A = 0.** S7 I:65 states
that the witness stone “would not brighten until it heard a choice freely
made.” IV:303 says it has “heard enough to know” a choice exists; its changing
light culminates at :371 and its retained content is described as freely given
consent at :407. These are narrator assertions, not merely Lira's uncertain
interpretation. They make an artifact recognize the freedom of a decision.
That would give later investigators a reusable consent test.

Memory stones can hold condensed memories (MEMORY_PHYSICS §4.1), and voluntary
extraction is established (MEMORY_ECONOMY §2). Neither grants objective access
to coercion, capacity or freedom. The Pilot Manual §§2.2/12 requires consent;
it does not supply a detector. Tuning Cradle, term-0026, explicitly distinguishes
resonance from knowing a memory's truth. Manual searches find witness stones
in drafts 0018 and 0020, not an authoritative definition that cures this gap.
Those draft recurrences are review inputs, not governing support.

**Recommended clearance:** F1 uses the existing consent slate as an ordinary
written record, with Lira accountable for assessing the answers. Keep the
permanent release; do not make its ethical validity a light reading. The
alternative is a separately specified and approved device/lexicon proposal,
including failure modes and downstream effects; this review does not approve it.

Other gate checks:

- **Bible red lines: PASS.** The released anchor stays lost (:319,407,453);
  two other anchors remain (:519–523). No locked character is rewritten,
  Heliodrome cured, or corridor run without input. Selected release is not
  itself a new law: hospice/ethical forgetting and voluntary anchor-shedding
  already exist in POLITIES §6 and OBLIVION_HERESIES §1. The particular safe
  outcome must remain local, without a general precision guarantee.
- **Unapproved novel/novella outcome: PASS.** `references.stories` is empty
  (:37), no event prerequisite is declared, and the failed evacuation is
  introduced locally (:125–139), not imported from a longer draft.
- **Current CI: PASS.** Do not call the green baseline red. A promotion of
  the *unchanged* frontmatter would, however, fail the red-line citation lint:
  the prose names the Lattice Gap (:125,489), but :43–54 cites no bible.
  The current warning becomes an error at primary/working tier. F5 must land
  before promotion; no tier was changed to test this in the repository.

## 4. Recommended promotion order and dependency findings

1. Obtain author selection of the defined S7 revision/reference scope below.
   Implement only that scope as a draft, re-read and rescore, and rerun gates.
2. Seek separate story-promotion approval only after readiness is established.
   No promotion is authorized by selecting this review or its revision options.
3. Review Lira, Maren and Solace claims separately against the approved source.
   Their current `metadata.status: speculative` remains. Do not bundle an
   unreviewed profile promotion with the story.
4. Review 0018 only if separately selected. No mutual dependency requires a
   promotion bundle. Its `references.stories` includes 0001 and 0007; its
   timeline explicitly follows 0007's consent precedent (:43–60). Its witness
   device (:550–647), Nim's crossing and Lira's later losses remain draft.

Impact reports with `--include-mentions`, run on the current graph:

| Target | Direct dependents | Transitive | Additional mention candidates |
| --- | --- | --- | --- |
| story-0007 | 6: Lira, Maren, Solace, Fleet, Remembrancers, 0018 | 0 | 0 |
| char-0008, Lira | 6: Maren, Nim, Remembrancers, Solace, 0007, 0018 | 0 | 0 |
| char-0009, Maren | 5: Lira, Fleet, Remembrancers, Solace, 0007 | 1: 0018 | 0 |
| loc-0010, Solace | 7: Lira, Maren, Nim, Fleet, Remembrancers, 0007, 0018 | 0 | 0 |

The faction/profile cycles are retrieval links, not independent evidence.
F7 removes unsupported causal links while keeping all appearance provenance.
The profile flags in review-agent §10 are historical: **Lira and Maren are
both speculative now**, not a current inconsistent canonical/speculative pair.

No 0007 event exists in the shared timeline or another manuscript's event
references. The six proposed event IDs in F5 are unused; keep them local.
0018 currently cites the whole story, not an individual event. This review
does not migrate that dependency or alter any shared events from settled stories.

## 5. Cross-story contradiction and ambiguity register

| Locations | Finding | Governing disposition / proposed fix |
| --- | --- | --- |
| S7:65,303,407 vs MEMORY_PHYSICS §4.1, MEMORY_ECONOMY §2, term-0026 | Consent is treated as an artifact-detectable fact without authoritative support. | Existing consent requirements prevail; F1 replaces the detector with written witnessed answers. Later draft 0018's light-reading is flagged for its own review, not copied as support. |
| S7:89,97,163,167 vs :127–139,315,359 | “First corridor,” a failed evacuation and “first failed corridor” do not clearly name the same retained knot. | This is an internal ambiguity, not an anchor resurrection. F2 identifies one failed-evacuation knot throughout, leaving earlier burned contents unnamed. |
| Solace profile:11 vs S7:389–425,519–533 and ANCHOR_THEORY §3.4 | “Chosen oblivion” describes a larger endpoint than Maren's survival with two anchors. | F6 names voluntary release, surviving anchors and local clinical limits; no catastrophic loss or permanent cure is inferred. |
| Faction `references` to S7 and speculative people/place vs CONTRIBUTING, cross_refs/references distinction | Approved baseline faction claims are linked causally to the draft that itself relies on those factions. | F7 retains mentions, removes draft-only causal support and explicitly attributes the Remembrancer baseline to POLITIES §6. No faction status is reopened. |
| S7:407,471–473 vs current primary 0017's surviving records and 0021's fact/experience distinction | The slate/stone may preserve statements without restoring the lived route; “no map” must not mean all descriptions are erased. | F1 explicitly preserves the spoken observations as incomplete testimony. No clean route reconstruction or burned-anchor restoration follows. This is a required wording boundary, not a contradiction with the settled primary stories. |

Resolved flags requiring no repair: 0007 already says “third watch” (:429,527),
and 0003's hospice is unnamed after PR #48. Solace's Gap–Void contact is
approved for the speculative map placement (cartographic brief T18/Q16), not
an invitation to move it or add a density. Primary 0013 recommends a Solace
consult; primary 0022 recommends Solace for Hael. Neither approves S7's detailed
rite, transfers Hael there on-page, or dates S7 relative to those stories.

## 6. Per-story card

### story-0007 — The Hospice Knot
Current tier: draft / draft / metadata.status absent
Hard gates: FAIL (undocumented consent-detection capability, A=0; manuscript:65,177,213,303,371)
Depends on: primary canon only (no declared story/event prerequisite; governing mechanics and established factions)
Depended on by: story-0018; also three provisional profiles and two canonical faction profiles

What it establishes: Lira Voss accepts Maren Holt's informed request to lose a contested route anchor despite a Canticle preservation hold. The loss removes his lived route evidence and flight capacity while two other anchors remain; the fate of six missing pods and the institutional dispute remain unresolved. Solace Hospice's local procedure and a witness stone claiming to recognize freely made choice would become reusable precedents if approved.

| Criterion | Score | Weight | Points | Evidence |
| --- | --- | --- | --- | --- |
| A Metaphysical fidelity | 0 | 3 | 0 | I: “It would not brighten until it heard a choice freely made”; IV: “heard enough to know” (65,303). No governing rule grants an artifact objective consent detection. Permanent cost itself is explicit (319,407,453-457). |
| B Bible compliance | 3 | 3 | 9 | V: Gap “pale and unfinished” (489) fits bible §4.1; two anchors remain (519-523), with no restoration. Frontmatter 43-54 lacks bible citation despite locked Gap/anchor-loss use. |
| C Tonal fidelity | 3 | 2 | 6 | I: handwriting retort (77); IV: “disappoint them by making this easy” (309); V: “worse mornings” (509) repeat pressure-release jokes against STYLE §§12-13. Physical cost is shown in the frayed speech (99) and mother-voice recitation (393-403). |
| D Craft and structure | 4 | 2 | 8 | The hold is already live at opening (67), choice changes state (369-407), dawn inquiry imposes cost (451-477). Explanatory “teeth/bones” framing (295,327,537) and repeated final exchange extend the ending beyond its enacted choice. |
| E Cross-canon coherence | 4 | 2 | 8 | Manual §§10,12 and POLITIES §6 support care/consent tension; no novel/novella prerequisite (25-37). “First corridor” (89) / failed evacuation (127) / “first failed corridor” (315) leave the contested knot's identity under-specified. Solace profile's “chosen oblivion” exceeds the two-anchor ending. |
| F Repository hygiene | 3 | 1 | 3 | Contract/refs and summaries exist (2-37); missing event/chronology coverage for five significant sections and missing bible citations (43-54). Witness device has no reusable definition; remove unsupported device rather than automatically adding it. |
| G Canon value | 4 | 1 | 4 | III-IV: the preservation hold conflicts with a lucid request (259-287,315-369). A local contested care decision supplies meaningful later prerequisites; it must not become blanket jurisdiction or machine-certified consent. |
| **Total** | | | **38 / 70** | |

Recommendation: Hold

Required fixes before promotion (if any): F1 remove objective consent-detection and use ordinary auditable testimony; F2 identify the same failed-evacuation knot consistently; F3 preserve clinical/institutional uncertainty; F4 remove repeated quips and explanatory closure; F5 add accurate local chronology/events, governing citations and links; F6 narrow provisional profile overclaims; F7 separate faction provenance from causal support. Exact current/proposed text appears in section 7.

Contradictions found: undocumented artifact capability; knot-label ambiguity; Solace “oblivion” overclaim; circular faction source links. Mirror these in section 5; no settled 0004/0015/0017/0021 decision is reopened.

Author decisions needed: choose ordinary recorded consent or a separately specified device proposal; approve the local contested-release scope without blanket immunity or guaranteed prognosis; select the defined revision/profile/reference cleanup while deferring promotion and profile status.

## 7. Exact fix list and linked-entry proposals

All text below is proposed, not applied. S7 denotes the single manuscript.
F1–F5 revise it while retaining draft status. F6 narrows three speculative
profiles without promoting them. F7 changes only dependency provenance in
the two already-canonical factions. No governing-source rewrite is proposed.

### F1 — Use a written consent record; remove the consent detector

Replace each complete current paragraph at the cited line with the proposed
paragraph below. This is the complete witness-stone removal scope in S7;
no replacement device or lexicon entry is needed.

| S7 line | Exact current text | Exact proposed text |
| --- | --- | --- |
| 65 | Lira Voss knelt opposite him. Between them rested a reliquary tray, a consent slate, and a witness stone the size of her thumb. The stone was dull. It would not brighten until it heard a choice freely made. | Lira Voss knelt opposite him. Between them rested a reliquary tray and a consent slate. She wrote his name at the top and left room beneath it for his answers. |
| 117 | Lira looked down at the witness stone. Still dull. Waiting. | Lira wrote down his answer. |
| 177 | The witness stone warmed by a single degree. Not light. Not yet. But attention. | Lira marked his refusal on the slate. |
| 213 | The witness stone brightened, faint as breath on glass. | She wrote the limit beneath his request and turned the slate so he could read it. |
| 303 | The ring on his brow pulsed amber. The witness stone shone with a low, steady milk-light. It had heard enough to know there was a choice in the room. | The ring on his brow pulsed amber. Lira set the consent slate where Maren could see her writing. |
| 353 | Lira touched the witness stone. "Name what goes." | Lira steadied the slate on her knee. "Name what goes." |
| 371 | The witness stone flared. | Lira wrote the word and read it back. Maren nodded. |
| 407 | On the tray, the witness stone went clear. Not empty. Clear. It held no route, no coordinates, no recoverable map. Only the shape of a consent freely given before loss. | On her knee, the slate held his answers, the warnings, and the few details he had spoken before release. None of it was the route as he had held it. |
| 437 | His eyes went to the witness stone in her palm. "Route trace?" | His eyes went to the slate in her palm. "Route trace?" |
| 471 | She gave him the witness stone. He held it awkwardly, as if it might accuse him. In a sense, it might. Any dawn audit could play it and hear Maren answer. Hear the warnings. Hear Lira name the cost. Hear the choice. | She let him read the slate. It named the shear, the knocking, the marker that would not stay blue. Below those fragments she had written the warnings and Maren's answers. The assessor asked for a copy. She made one and put her name beneath it. |
| 473 | That was all it preserved. | The copy preserved what they had said. It could not give Maren back the experience. |

With the new :407/:471, change Lira's :439 response from **"None."** to
**"Only what he said before release. No complete route."** This avoids claiming
that the record containing route-related words contains no testimony at all.
The assessor's following accusation and Lira's ownership remain as dialogue.

**Pros:** the consent audit remains observable and contestable; factual notes
survive without restoring the anchor; no new device or general truth test.
**Cons:** removes the responsive-stone imagery and playback. Alternative:
retain an ordinary stone used only for voluntary recording, with a separately
reviewed definition and limits; that retains more imagery but adds a device
scope and requires removing every assertion that its light proves freedom.
Recommend the slate version above.

### F2 — Identify one failed-evacuation knot

S7:89 and :97: replace **"Third teacher. First corridor. My mother's voice."**
with **"Third teacher. Evacuation route. My mother's voice."**

S7:163 and :167: replace **"First corridor,"** with **"Evacuation route,"**.

S7:315: replace **"the route anchor from your first failed corridor"** with
**"the route anchor from the failed evacuation"** within the existing question.
Keep the permanence question and all answers. No new loss, anchor count before
the evacuation, or content of the earlier burns is invented. The counted arc
remains three responsive anchors before this rite and two afterward.

**Pros:** the live knot, the hold and the lost evidence match. **Cons:** loses
the potentially meaningful “first corridor” history. Alternative: explicitly
establish how an older first-corridor anchor acquired this failed route, with
new author-selected history; that is larger and unnecessary. Recommend the
consistent evacuation label.

### F3 — Keep the judgment local, the hold contested and prognosis bounded

Replace S7:457's preceding question at :455, **"Can he fly?"**, with
**"Is he cleared to fly?"** Keep **"No."** The ending establishes present
non-clearance and two responsive anchors, not a permanent prognosis.

Replace the complete final audit at :533:

> *Preservation hold refused. Release witnessed. Consent valid. Route anchor unrecoverable. Patient remains himself.*

with:

> *Preservation hold refused; objection retained. Release witnessed. Consent assessed by Lira Voss. Route anchor unrecoverable. Two other anchors responsive. Not cleared for flight.*

At frontmatter :45 replace:

> Establishes Solace release practice as consent-first when institutional preservation demands conflict with a patient's remaining agency.

with:

> Depicts Lira's contested consent assessment and Maren's permanent release of one route anchor at Solace Hospice; it establishes neither general immunity from Fleet holds nor the outcome of the later inquiry.

No tribunal ruling, Fleet-wide coercive doctrine, nullification of the hold,
sanction or acquittal is added. Lira's “Not in that room” (:243) remains her
assertion, opposed on-page by the assessor. Patient consent to a clinical act
is distinct from legal permission to destroy potential evidence. His objections,
the six missing pods and the families' loss stay real.

**Pros:** keeps the ethical choice and institutional cost without a universal
care loophole or certification of recovery. **Cons:** the audit is less final
in its moral reassurance. Alternative: commission an institutional law/authority
proposal before resolving the dispute. Recommend leaving the dispute open.

### F4 — Remove repeated quips and thematic verdicts

These are bounded cuts/replacements, preserving the patient's fear of being
treated as a ship and his mother's imperfect song:

- Delete S7:73–77, the three paragraphs beginning **He gave a thin smile.**,
  **"That is what I say."**, and **"The wall has better handwriting."**
  Join “No command voice enters this room” directly to the wall inscription.
- Replace :295, **Lira held the folded order against her own slate. "Mercy is
  not the soft thing people imagine. It has teeth. Tonight they are pointed
  at me."**, with **Lira set the folded order against her slate and wrote her
  name beneath the objection.**
- Replace :309–311, **"Good. I would hate to disappoint them by making this
  easy."** and **Lira almost smiled. Almost.**, with **He watched the door
  until she sat down.**
- Replace :327, **Lira waited. If mercy had teeth, consent had bones. It had
  to stand under its own weight.**, with **Lira waited, her stylus held above
  the slate.**
- Replace :449, **That answer stopped him again. Lira was beginning to
  understand that the Fleet trained its people for refusal and excuse, but
  not for plain ownership.**, with **Lira marked his objection beside her
  name.** This also removes an unsupported Fleet-wide training generalization.
- Delete :475–477, **It was not enough for six missing pods.** / **It was
  enough for one man.** The assessor immediately names the families' loss.
- Delete :505–511, from **"Am I dead?"** through **This time Lira did smile.
  It hurt. That seemed appropriate.** Retain “Am I a ship?” / “No.” and the
  returning recitation.
- Replace :529, **Maren stayed seated, hands open on his knees, lighter by one
  useful anchor and heavier by one honest choice.**, with **Maren stayed
  seated, hands open on his knees.**
- Delete :537, **Mercy had teeth. So did record-keeping.** End with the signed
  audit and the ink drying (:531–535, as changed by F3).

**Pros:** decisions, objections and surviving anchors carry the ending;
removes repeated authorial explanations and pressured banter under STYLE §12.
**Cons:** reduces Maren's dry humor and the recurring “teeth” motif. A smaller
alternative retains the handwriting exchange as one pressure-release beat
while applying the other cuts. Recommend the full bounded set; preserve the
ordinary imperfection of his mother's song (:397–403).

### F5 — Complete metadata, event coverage and source links

Preserve ID, title, creation timestamp, summaries, themes, and draft statuses.
Add `retrieval_role: active_draft`; record the revised actual body word count
under metadata and refresh only its modified timestamp after implementation.
Do not copy the current 2610 count onto a shorter revision.

Add `mech-0001` to **both** mechanics lists: physical chamber behavior is used
on-page (:149,361–375). Add `loc-0003` to `cross_refs.locations` and
`references.locations`: the Gap is both described and causal to the failed
evacuation (:125,489). Do not add 0001 as a whole-story dependency merely
because its bible governs the mechanics. Add:

~~~yaml
bible_refs:
  - bible/ARCHIVISTS_WAKE_STORY_BIBLE.md#36-anchor-burn-consequence
  - bible/ARCHIVISTS_WAKE_STORY_BIBLE.md#41-the-lattice-gap
  - bible/ARCHIVISTS_WAKE_STORY_BIBLE.md#71-anchor-rules
  - bible/ARCHIVISTS_WAKE_STORY_BIBLE.md#83-drift-logic-test
~~~

Add the following exact local timeline setting and duration:

~~~yaml
timeline:
  setting: Solace Hospice in the Lattice Gap's outer sleeve; no date relative to other stories is established
  duration: From Maren's admission audit through the third-watch handover and final written audit
~~~

Under `timeline.chronology`, give the six rows below `timestamp`/`event`;
under `events`, give each the same timestamp/summary, the specified unused
ID, `canon_tier: draft`, and
`source: stories/short_story/the_hospice_knot/manuscript.md`.
T0–T5 are ordered story-local checkpoints, not hours, drive pulls or the
exemplar's universal dates. T4/T5 occur within the same stated third watch.

| ID | Timestamp | Exact chronology event / event summary | Evidence |
| --- | --- | --- | --- |
| event-story-0007-001 | T0 | Maren's admission audit finds three weak responsive anchors while a Canticle preservation hold awaits outside. | :65–113 |
| event-story-0007-002 | T1 | Maren refuses further audit of the evacuation knot and requests permanent release despite the possible loss of missing-pod evidence. | :175–195 |
| event-story-0007-003 | T2 | Lira refuses to defer the rite for the Fleet panel and accepts a named objection for the dawn audit. | :259–297 |
| event-story-0007-004 | T3 | After warnings and repeated assent, Maren releases the evacuation-route anchor; two other anchors remain responsive. | :315–425 |
| event-story-0007-005 | T4 | At third watch, Lira supplies the assessor a copy of the written consent record and confirms Maren is not cleared for flight. | revised :429–473 |
| event-story-0007-006 | T5 | Lira writes her consent assessment, retained objection and Maren's two responsive anchors into the closing audit. | revised :519–535 |

For each event, `involved_entities` may use this exact common list: story-0007,
char-0008, char-0009, loc-0010, fact-0001, fact-0006. No new named person,
ship or location is introduced by the unnamed assessor, clerks, officer or
evacuation background. Reusable sensorium rings already have bible §5.2;
the ordinary tray/slate is not a new proprietary technology. F1 removes the
only proposed new reusable device rather than adding a draft term by default.

**Pros:** retrievable beats and citations match the text; no shared timeline
or invented elapsed duration. **Cons:** more frontmatter to maintain. After
approval, regenerate all three graph artifacts with repository tooling and
run lint/check/full CI parity. This review itself needs no graph changes.

### F6 — Narrow provisional profiles; keep all three speculative

These are exact proposed corrections for a draft-revision batch. They do
not constitute the later primary-backed full-profile approval.

**Lira (`characters/Lira_Voss.md`).** Keep short summary and existing links.
Replace the long summary:

> Lira Voss administers Memory Hospice rites for pilots facing dementia cascade. She preserves the ethics of chosen forgetting without coercion, serving as quiet counterweight to institutional memory triage.

with:

> In story-0007, Lira Voss assesses Maren Holt's consent to release a contested evacuation-route anchor at Solace Hospice. She proceeds despite a Canticle preservation hold, records his answers and the assessor's objection, and signs the audit under her own name. Her decision establishes neither general immunity from Fleet inquiry nor an objective test of free consent.

Replace the first invariant, **Remembrancer practice centers voluntary anchor
release without coercion**, with **In story-0007, Lira requires Maren's stated
understanding and repeated assent before his contested release; this is a
local clinical judgment, not a universal consent test or Fleet ruling.**
Retain her other invariants and watchlist. Keep 0018's experiences outside
the approved-or-proposed S7 baseline. Add no later training, rank or sanction.

**Maren (`characters/Maren_Holt.md`).** Existing summaries/invariants already
match the chosen release and permanent loss; retain them. Replace watchlist
**Keep future recovery evidence external to Maren unless explicitly established
elsewhere** with **A surviving description or later factual account is not
the released experience and cannot restore the route anchor; do not infer
complete route reconstruction or permanent flight clearance.**
Retain the prohibition on making him a clean witness to the missing pods.
No new statement specifies the content/count of earlier evacuation burns.

**Solace (`atlas/Solace_Hospice.md`).** Retain ID, station classification,
short summary, existing links and coordinates. Replace long summary:

> A monastic station orbiting the Lattice Gap’s outer sleeve. Solace Hospice provides Memory Hospice for anchor-burned pilots and administers voluntary rites of release, preserving the dignity of chosen oblivion.

with:

> Solace Hospice is a monastic station in the Lattice Gap's outer sleeve, at its contact with a Void Region. In story-0007, Lira Voss conducts Maren Holt's contested release of one route anchor. Two other anchors remain responsive. The local rite establishes neither chosen oblivion, restoration of spent anchors, general immunity from Fleet holds, nor a permanent cure.

The contact is the existing approved speculative placement, T18, not newly
invented topology. No map placement, era, density or other cartographic
claim changes. Hael has not arrived there on-page; no new ward/procedure for
him is approved.

**Pros:** corrects overbroad provisional cues without prematurely locking
them. **Cons:** profiles remain provisional and need a later separate review
after source approval. Alternative: defer all profile corrections until that
review, preserving current misleading “oblivion”/generic practice wording in
the meantime. Recommend the narrow corrections with speculative status intact.

### F7 — Repair faction causal references without changing baseline claims

**Canticle Fleet, `factions/Canticle_Fleet.md`:** remove **only** char-0009
from `references.characters`, loc-0010 from `references.locations`, and
story-0007 from `references.stories`. Keep each in its existing `cross_refs`
list. Preserve all other reference values, summaries, doctrine and body.
The Fleet's general role is primary-backed without this episode; the removal
does not rewrite its accepted 0013/0021/0022 outcomes or Elior's unfiled run.

**Remembrancers, `factions/Remembrancers_of_Solace.md`:** change
`references.characters: [char-0008, char-0009]` to `[]`,
`references.locations: [loc-0010]` to `[]`, and
`references.stories: [story-0007]` to `[]`. Preserve faction/mechanics
references and **all** existing cross_refs. Preserve the canonical status
and both summaries. Add this exact source note after frontmatter:

> The order's general hospice mandate, pilot counseling, mediation and transformation doctrine follow `lore/POLITIES_AND_FACTIONS.md` section 6. Story-0007 is draft provenance for Lira, Maren and the particular Solace Hospice episode; it does not independently approve the episode's consent procedure or the full profiles of those people and place.

No unsupported `references.lore` key is added to the schema. On any later
source promotion, update the source label while retaining the separate claim
approval rule. Refresh modification timestamps only on changed profiles.

**Pros:** removes seven draft-only causal edges while retaining provenance
and independently sourced faction baselines. **Cons:** structured graph
cannot express the lore note as a dedicated typed edge without wider tooling;
the explicit source note supplies that context. Alternative: retain causal
links until eventual source approval, leaving a misleading dependency cycle.
Recommend the exact cleanup above, independently of any eventual promotion.

## 8. Three author decisions

| Decision | Recommended defined choice | Alternative / cost |
| --- | --- | --- |
| **1. What witnesses consent?** | F1's ordinary written slate and accountable human assessment; F2's consistent evacuation-knot identity. | Retain a bounded memory-recording device only after a separate exact technology/lexicon review. An objective consent detector would require a wider governing proposal and downstream impact analysis. |
| **2. What outcome and prose should the story lock later?** | F3's local, disputed release; two surviving responsive anchors, present non-clearance and no institutional judgment; F4's bounded cuts; F5's complete local metadata. | Retain one dry handwriting exchange via F4's smaller alternative, or request a larger clinical/legal worldbuilding proposal. Neither alternative approves a cure, acquittal, complete route reconstruction, or the six pods' fate. |
| **3. What linked-entry work belongs in the draft revision?** | F6's exact speculative-profile corrections and F7's exact faction reference cleanup. All statuses stay as they are. | Defer those corrections to later claim review, retaining the known overbroad cues/cycle longer. Do not promote profiles automatically to clear the graph. |

Recommendation: approve the defined F1–F7 **revision scope**, then review the
implemented draft afresh. Story promotion and the three profiles' eventual
primary-backed claim approvals remain separate decisions. The standing
permission to merge approved changes after all CLI/GitHub gates pass does
not supply those editorial approvals.

## 9. Method and verification boundary

Read the review agent's full required-reading sequence before opening S7:
AGENT, STYLE, all three mechanics, Pilot Manual, full bible, all four governing
lore files, both theology files, full structured lexicon, complete primary
exemplars 0001/0022, playbook/schema reference, and current index. Read S7 in
full, then every listed character/location/faction profile, including all
invariants/watchlists, and revisited its listed mechanics. Consulted schemas,
source-first/provisional governance and cartographic T18/Q16. Voice guidance
was used for proposed manuscript passages; project restraint/canon governs.

The S7 card was written before opening downstream draft 0018. Only its
frontmatter and relevant consent-device passages were then inspected for
dependency impact; it received no score or full review. No other draft was
scored. Manual prose/lexicon searches checked non-indexed references and found
no authoritative consent-detector support. Primary 0017/0021 passages were
checked for the surviving-record versus irrecoverable-experience distinction;
their settled outcomes were not revised or reopened.

At the original review checkpoint, the exact proposed replacements were checked against the baseline text;
proposed summaries remain below schema limits. Local event IDs are unused.
No ID allocator, promotion tool, status change, manuscript edit, profile edit,
term addition, shared timeline change or map-placement mutation was run.
The baseline link-map build regenerated artifacts without a diff. Only this
new tracked report is committed and pushed; all earlier reports are preserved.
The final report link and whitespace checks pass. Its proposals remain
pending author choice.

## 10. Author-approved revision and fresh readiness assessment

### Approval and implemented scope

The author replied **“Approved”** to the recommendation for all F1–F7,
with promotion and profile status deferred. This authorizes the defined
draft revision, speculative-profile corrections and faction provenance
cleanup. It does not approve a story promotion or additional 0018 work.

Current main was fetched again and remains `e92ceea`, including PR #58.
Branch `canon/stories/revise-story-0007` preserves the pushed review commit
`be38200` and starts from that reviewed main. `npm ci` and the complete
baseline `npm run validate:ci` passed before edits. No unrelated work was
present or changed.

| Group | Applied change |
| --- | --- |
| F1 | All eleven specified witness-stone paragraphs now use an ordinary written slate. The route-trace answer preserves incomplete spoken observations; the copy cannot return the lived experience. |
| F2 | All four anchor-audit labels and the release question identify the same failed-evacuation route. Prior burned contents remain unnamed. |
| F3 | The assessor asks about current flight clearance, and the closing audit records Lira's assessment, the retained objection and two responsive anchors. No general immunity or later inquiry outcome is established. |
| F4 | Applied the full approved cut/replacement set. The mother's imperfect song and the “Am I a ship?” fear remain. |
| F5 | Added active-draft retrieval role, actual word count, governing citations, Gap/memory-physics links and six matching local draft chronology/events. T0–T5 order this story's checkpoints without inventing elapsed hours or shared dates. |
| F6 | Applied the exact approved Lira summary/invariant, Maren watchlist and Solace summary. All three keep speculative status, short summaries, existing links and creation dates. Solace's station type and approved speculative coordinates remain unchanged. |
| F7 | Removed seven faction causal-reference memberships, retaining every appearance link and both faction statuses/baselines. The Remembrancer source note matches the approved wording. |

Three small consequential consistency edits complete the specified F1/F2
changes: “the word *corridor*” becomes “the word *route*” after the renamed
recitation; the hold order sits “beside the slate” rather than beside the
removed stone; “The assessor closed his fist around it” becomes “The assessor
held the copy.” The source's differing punctuation/attribution around the
four audit labels is preserved. These edits add no new act, device, clinical
claim or outcome. The surplus blank line left by the final cut was removed.

### Revised card

Evidence below refers to the revised
`stories/short_story/the_hospice_knot/manuscript.md`, not the old line numbers
in sections 1–9.

### story-0007 — The Hospice Knot, revised

Current tier: draft / draft / metadata.status absent
Hard gates: **PASS**
Depends on: primary governing mechanics/factions only; no story/event outcome prerequisite
Depended on by: draft story-0018 and three speculative profiles; the two faction links are now appearances

What it establishes if subsequently approved: Lira accepts Maren's informed,
repeated request for one permanent route-anchor release despite the Fleet's
preservation hold. Written fragments and the objection survive, but the
lived anchor does not; two other anchors answer and Maren is not cleared
for flight. Neither the six missing pods' fate nor a later institutional
judgment is decided.

| Criterion | Score | Weight | Points | Revised evidence |
| --- | --- | --- | --- | --- |
| A Metaphysical fidelity | 4 | 3 | 12 | Slate/written answers at :165,397,463; permanent loss at :411,499,565; two remaining anchors at :599–613. No artifact certifies freedom. The local release is demonstrated rather than specified as a general reproducible technique, limiting diagnostic detail. |
| B Bible compliance | 5 | 3 | 15 | Explicit bible citations at :141–145; Gap stays fractured (:577), the lost anchor cannot be restored (:411), and two other anchors remain (:599–613). No locked character or station outcome is changed. |
| C Tonal fidelity | 4 | 2 | 8 | Refusal and physical fraying remain (:193,269); the mother's bad singing carries grief (:489–495), without the three repeated pressure jokes. Some explanatory judgment remains in Lira's interiority (:329,365,553). |
| D Craft and structure | 4 | 2 | 8 | Live hold at opening (:167), explicit competing loss (:277–289), irreversible release (:461–499) and signed contested audit (:613–615). The extended assessor exchange remains deliberate ethical argument; it is not compressed to exemplar-level economy. |
| E Cross-canon coherence | 5 | 2 | 10 | One named evacuation knot (:183,191,257,261,407); partial record versus lived experience (:531,563–565); scoped profiles and faction provenance now agree. No novel/novella outcome is required. Later 0018 remains a separate draft. |
| F Repository hygiene | 5 | 1 | 5 | Contract, complete references, summaries and citations at :2–42,141–149; six local draft events match chronology (:43–131). The removed device needs no new term; supporting profiles exist and graph artifacts are regenerated. |
| G Canon value | 4 | 1 | 4 | The disputed release and preserved objection (:381–389,541,613) provide a usable local precedent without machine-certified consent or universal jurisdiction. Wider law, eventual care and the missing pods remain open. |
| **Total** | | | **62 / 70** | |

**Readiness recommendation: Promote band, subject to separate author approval.**
This is an assessment of the revised draft, not an applied promotion. No
further required manuscript fix remains within the approved scope. Remaining
craft deductions do not warrant an unapproved additional edit.

Hard-gate recheck: no new unsupported law, no restored anchor or free corridor,
no unapproved novel/novella outcome, and no unresolved citation gate. The
release remains a particular hospice case under the existing ethical-forgetting
framework; a responsive sensorium ring is not used to certify consent. The
new physical/source links cite established mechanics rather than importing
another draft's procedure.

### Preservation and validation

The complete revised manuscript was re-read against the approved changes,
governing sources and primary-exemplar rubric. Structured comparisons verify
all profile statuses, short summaries, creation dates and appearance links
are preserved; all six new events remain local and draft. The revised body
contains **2507** whitespace-delimited words; summary lengths remain **121/349**.
Its gray-matter content SHA-256 is:

~~~text
fef003d4db1220f03d6e318b6267fdbf97e00ba51dd159cd5b2eb4fed8038455
~~~

All three generated artifacts were rebuilt. `CANONICAL_INDEX.md` remains
byte-identical because entity tiers did not change. The graph contains
**175 entities, 816 relationships, zero orphaned targets**. The two new
deduplicated relationships link 0007 to the Gap and memory physics. Seven
existing faction relationships retain their appearance edges but lose their
causal-reference provenance; they are not seven deleted appearance edges.

No other manuscript, prior review report, lexicon, shared timeline, governing
bible/mechanics/manual/lore, atlas placement or tooling changes. In particular,
0018's witness device and later outcomes remain unapproved and untouched;
no date is added relative to the Tessarine breach or Elior's unfiled run.
The 0004/0015/0017/0021 local events and settled profile claims are unchanged.

Validation after implementation:

- `npm ci` and baseline full `npm run validate:ci`: PASS.
- Approved-proposal comparisons, profile status/appearance/date preservation,
  event/chronology equality and manuscript word count: PASS.
- `npm run lint`, `npm run check`, and complete `npm run validate:ci`: PASS,
  including the newer map data/viewer/render/chart/depth suites.
- Continuity and timeline: zero hard failures, zero soft warnings and zero
  event conflicts. Timeline now includes six additional local draft beats.
- Existing nonblocking output: 21 schema advisories, 976 glossary candidates,
  and **one** draft red-line warning (0005). The former 0007 warning is fixed.
- Review links, YAML proposal fences and whitespace: PASS.

The implementation and original review are prepared together for a PR.
The final committed head must pass local CI parity and every hosted check,
including both push/PR browser runs, before merge under the author's standing
merge authorization. Hosted final-head results and the merge record are
available on that PR. Those gates do not authorize story/profile promotion.

## 11. Author-approved promotion — November 1, 2026

### Authorization and current baseline

The author instructed **“excellent, let's promote this story.”** This
approves the revised story-0007 merged in PR #59 as
`55c6194c8d0bc82039e05aee45b72850427a8dd9`, following its 62/70 readiness
assessment. It does not approve the three full profiles or draft 0018.

Fetched main is **4eececb2e4e3a7bff722709c6de5abe1bcc2c7d4**, including
PRs #60/#61's atlas render records and completion documentation. Those later
changes are preserved. Comparing the approved revision to this main finds no
change to the manuscript, profiles, governing sources or relevant story-review
instructions. Work began on a clean `canon/stories/promote-story-0007` branch.
`npm ci` and the complete baseline `npm run validate:ci` pass on this head.

### Applied promotion and body preservation

Promotion-tool `--dry-run` passed link-map input preflight and found no
unapproved story or shared-event prerequisite. `references.stories` remains
empty and there is no event-level dependency or longer-draft outcome required.
The applied tool sets:

- `canon_tier: primary_canon`;
- root and metadata `status: canonical`;
- `retrieval_role: authoritative`;
- `canon_tier: primary_canon` on all six existing local events;
- the manuscript's modification timestamp.

Original frontmatter formatting was restored after confirming its parsed data
exactly matches the promotion tool's output. The body, including surrounding
whitespace, remains byte-identical to the approved revision and fetched main.
The count remains **2507 words**, summaries **121/349 characters**, and body
SHA-256:

~~~text
fef003d4db1220f03d6e318b6267fdbf97e00ba51dd159cd5b2eb4fed8038455
~~~

All six event IDs, timestamps, summaries, source paths and involved-entity
lists are unchanged. They stay **local**: no other work references an individual
0007 event ID, and 0018 currently depends on the whole story. No entry is added
to `data/timeline/events.yaml`. The previously approved 0004/0015/0017/0021
local events also remain untouched.

The approved outcome is Maren's permanent loss of one contested evacuation-route
anchor, two other responsive anchors, retained partial testimony, present
non-clearance for flight and Lira's named, disputed consent assessment. The
missing pods' fate and later institutional judgment remain open. No device
certifies consent, no record restores the lived anchor, and no universal
clinical precision, Fleet immunity, permanent cure or complete route
reconstruction is established.

### Manual source-first checklist

- **Lira, Maren and Solace:** all three files remain byte-identical to fetched
  main with `metadata.status: speculative`. Their summaries, invariants,
  watchlists, references, dates and coordinates are unchanged. Story approval
  opens a separate full-profile claim review; it does not settle that review.
- **Remembrancer source note:** identifies 0007 as primary canon and keeps
  full-profile approval and universal procedure separate. Only that source
  note and its modification timestamp change; status, summaries, baseline
  doctrine and all structured links remain unchanged.
- **Current orientation:** the story list now records primary/canonical.
  The provisional-profile register records source approval while explicitly
  retaining all three pending claim reviews, including Maren. The opportunities
  introduction agrees with the ten current primary stories, correcting its
  earlier 0017/0021 omissions alongside this promotion, and its Lira paragraph
  distinguishes primary 0007 from draft 0018. Only the canon-status check date
  is refreshed; the October 20 opportunity inventory and historical theme
  counts remain as dated.
- **Historical findings:** prior reports, the process review, working-lore
  approval history and cartographic decision records retain their original
  dated context. Their older 0007 draft/timing findings do not reopen the
  completed PR #48 or #59 fixes. Current source state is recorded here and in
  the index, not inferred from those historical snapshots.
- **Lexicon:** manual first-appearance/source/related-term and prose searches
  find no term introduced by 0007 requiring approval. The removed witness
  stone does not become a lexicon term through promotion. Draft 0018/0020
  witness devices remain unapproved review inputs.
- **Map and later drafts:** no location tier or placement changes, and no
  density or geography is invented. Solace remains speculative on the author
  map. Draft 0018's text, tiers, local events and later consent/crossing claims
  remain unchanged. No date is added relative to the Tessarine breach or
  Elior's unfiled run.

The impact report finds **four direct dependents** (the three speculative
profiles and draft 0018), zero transitive dependents, and two faction
appearance candidates. The faction causal-reference cleanup from #59 remains
intact; no circular draft support is reintroduced.

### Generated artifacts, validation and PR

All three graph artifacts were regenerated. The graph remains **175 entities,
816 relationships, zero orphaned targets**. Only 0007's retrieval authority
changes to primary/authoritative at weight 110; no relationship is added.
The three linked profiles retain speculative retrieval authority.

`npm run lint` and `npm run check` pass after promotion. Continuity and
timeline report zero hard failures and zero soft warnings. Existing advisories
remain 21 schema warnings, 976 glossary candidates and the one draft red-line
warning for 0005. Body/data comparisons, local-event checks, report links and
whitespace checks pass. No other manuscript, profile, lexicon, shared timeline,
governing source, atlas placement or tooling changes.

The promotion commit must pass complete final-head `npm run validate:ci` and
every hosted check, including both browser runs, before merge under the
author's standing authorization. Final-head results and the merge record are
recorded on the promotion PR. This source approval does not approve any
additional profile claim.
