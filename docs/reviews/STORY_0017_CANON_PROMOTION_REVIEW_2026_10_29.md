# Canon Promotion Review: The Loss Ledger

**Current checkpoint:** The author approved all three recommended revision
scopes on October 29, 2026. They are implemented below in section 10. The
revised story scores **62/70**, with hard gates passing and no remaining
manuscript blocker identified. This is a readiness finding, not promotion.
Story-0017 and its five local events remain draft; Corin, Lysa, and the new
H-37 chart profile remain speculative. Sections 1-9 preserve the original
40/70 review at `8acded9`; those findings are historical after the revision.

## 1. Scope and baseline

**Review only: story-0017, *The Loss Ledger*. Recommendation: Hold, 40/70;
one hard gate fails.** No revision or promotion is authorized or applied.
All source line references in this report refer to fetched main
`8acded9b3ef65f0b8626386e0bded8952906163a`, reviewed October 29, 2026.
The workspace was clean before work began. The review branch is
`review/story-0017-canon-2026-10-29`.

`npm ci` and `npm run validate:ci` passed before draft review. The graph has
174 entities, 796 edges, and zero orphaned targets. Continuity and timeline
reports both have zero hard failures and zero soft warnings. The existing
nonblocking schema/glossary advisories and draft red-line citation warnings
for stories 0005 and 0007 do not establish story-0017 readiness. Automated
checks do not adjudicate the prose's mechanics, arithmetic, or chronology.
`npm run report:canon-tiers` was run and read: Corin and Lysa remain
speculative; story-0017 remains draft / draft / metadata.status draft, with
retrieval role active_draft (`manuscript.md:8-10,124-129`).

Main includes PR #46's merge `d50a906` and later atlas work in PRs #47/#48.
The index independently confirms stories 0004 and 0015 are primary canon
(`CANONICAL_INDEX.md:263-267`); the current checkpoint and section 11 of
`CANON_PROMOTION_REVIEW_2026-10-29.md` record final story-0015 approval.
That report's earlier draft findings are historical, not open blockers.
No concrete conflict here warrants reopening either approved story.

In this report, an unqualified `manuscript.md:line` means
`stories/short_story/the_loss_ledger/manuscript.md:line`. Proposals below are
review text, not approved manuscript wording or approved new lore.

## 2. Summary table

| ID | Title | Total | Hard gates | Band | Required fix groups | Prerequisite |
| --- | --- | --- | --- | --- | --- | --- |
| story-0017 | The Loss Ledger | 40 / 70 | FAIL: unsupported burn-contour law | Hold | Six required groups: F1-F3, F5-F7; F4, O1/O2, and added-event coverage optional | Primary story-0001 only |

The institutional premise is usable: an honest loss record invalidates a
false certification and makes living traffic bear real costs. The draft
does not restore Lysa or make the entry repair the corridor
(`manuscript.md:789-802,818-833,919-933`). The blocker is the categorical
forensic rule used to discover the loss (`:200-204`), not the premise of
auditing a dishonest record. Recorded telemetry can carry the investigation
without adding that law. The documentary-recovery prohibition, ambiguous
anchor arithmetic, incompatible confirmation-run timing, and metadata
overstatement also need correction before a fresh readiness assessment.

## 3. Hard-gate failures

**FAIL — New metaphysical law stated and used without a matching governing
update (criterion A = 0).** Section I says, “anchor burn left a contour in
systems that had used it” (`manuscript.md:202-204`). The table identifies a
personal burn and dates it from that contour (`:188-208,239-245`); section II
confirms the diagnosis (`:291-301`). This is a general rule about what a
spent anchor leaves in a system, not merely an unexplained display effect.

The nearest precedents do not establish it. Corridor residue allows eddy
pursuit (`mechanics/CORRIDOR_MECHANICS.md`, section 5.1); the manual calls for
a post-run memory-imprint scan (`manuals/PILOT_MANUAL.md:120-124`). Neither
establishes durable, anchor-specific chart residue that yields forensic
timing long after expenditure. Memory's physicality
(`mechanics/MEMORY_PHYSICS.md:75-84`) also does not establish that diagnostic
capability. Under the review agent's explicit new-law gate this must block,
not merely reduce the score. F1 recommends surviving instrument records
rather than a new mechanics/lore amendment.

| Other gate | Result | Evidence and limit |
| --- | --- | --- |
| Bible red line | PASS | No anchor regrows, no locked protagonist acts, no collapse is reversed (`manuscript.md:377-389,420-424,797-802`). The recovery claim is overrestrictive, not an actual restoration. Bible anchor rules remain binding. |
| Unapproved novel/novella outcome dependency | PASS | `references.stories` contains only primary story-0001 (`:41-42`); no event prerequisite is declared. |
| Current-frontmatter CI gate | PASS | Baseline `validate:ci` completed successfully. The unsupported recertification summary and duration mismatch below are manual findings, not claimed validator errors. |

The final claim that the corridor holds because memory was already spent
(`:932-933`) needs narrowing, but **is not proof of free FTL**: the draft
already specifies ongoing tax, attention, and other inputs
(`:147-148,233-235,527-531`). Treat it as an overstatement in F1, not a
second demonstrated red-line breach. The loss of documentary evidence in
F2 likewise does not authorize interpreting anchor permanence as universal
erasure of external records.

## 4. Recommended promotion order and dependency findings

1. Settle this report's editorial choices and revise story-0017 within the
   approved scope. Re-read and rescore it, then obtain explicit story
   approval before any promotion. Its sole declared story prerequisite,
   story-0001, is already primary (`manuscript.md:41-42`).
2. Review story-0021 afterward. Its `references.stories` includes 0017 as
   well as primary 0004, 0015, 0013, and 0001
   (`stories/short_story/receipt_for_a_voice/manuscript.md:59-64`). Its
   suspension claim is a downstream proposal, not evidence that story-0017
   is correct (`:82-85,115-120`). No story-0021 score or approval is made here.

No bundle is needed. Story-0017 does not depend on 0004, 0015, or 0021.
`report:impact -- --id story-0017 --include-mentions` finds three direct
dependents: Corin, Lysa, and draft story-0021, with no transitive dependents.
Manual prose/source-field searches found no lexicon entry sourced to 0017
and no external reference to its individual event IDs. Its four events are
local; none is in `data/timeline/events.yaml`. Story-0021's whole-story
dependency already expresses its reliance on suspension. A shared event
should be added only if a later approved story needs that particular beat.
The ten story-0004 and five story-0015 event IDs remain local and untouched.

All declared linked entries were read: Corin, Lysa, Helios Drift, Canticle
Fleet, Archivist Orders, the three mechanics files, and primary story-0001.
Corin and Lysa are speculative at profile lines 55. Their draft-origin
claims cannot authenticate the story that supplies those claims. The Fleet
profile contains pre-existing references to drafts 0007 and 0021
(`factions/Canticle_Fleet.md:59-63`); these are not additional declared story
edges from 0017, nor authority for its proposed chart mechanics. Its role,
audits, and ledger duty have independent support in story-0001, the manual,
and governing faction lore. The Helios Drift profile's open post-breach
recertification consequences (`atlas/Helios_Drift.md:75-87`) do not establish
H-37's history or place this story relative to the breach.

## 5. Contradiction and ambiguity register

| ID | Two locations / governing comparison | Finding, authority, and proposed fix |
| --- | --- | --- |
| C1 | `manuscript.md:202-204,239-245`; `mechanics/CORRIDOR_MECHANICS.md`, sections 2 and 5.1 | The draft adds anchor-specific forensic residue beyond the established wake and attention rules. Governing mechanics wins. Replace it with recorded telemetry and log comparison (F1). |
| C2 | `manuscript.md:375-385`; `characters/Lysa_Korr.md:75-77`; primary `stories/short_story/the_smallest_burn/manuscript.md:506` | Recovering a description is treated as restoring a burned experience. Primary canon explicitly retains facts after loss. Remove that inference; make this packet's deletion the reason its contents are unavailable (F2). |
| C3 | `manuscript.md:243-245`; `:325-373` | The trace is dated between confirmations two and three, but the replay spends the anchor during confirmation two. Put the evidence in the second run and keep the later third-run signature/excision sequence (F3). |
| C4 | `manuscript.md:317-320,396-403`; `:678-681` | Four reported prior burns accompany fourteen initial / eleven pre-H-37 anchors. The moderate vocational anchor “thinned but held,” so whole-knot subtraction is not a proved interpretation. State a coherent count/history rather than silently accepting either arithmetic or partial-knot mechanics (F3). |
| C5 | `manuscript.md:820-822`; `:573-577` | Both pilots can accept risk while one captain subsequently declines departure, so there is no proved contradiction. The sequence of waiver and assent is compressed. Optionally make eligibility, pilot consent, and captain acceptance explicit (F4). |
| C6 | Event 004 `manuscript.md:97`; ending `:919-920` | Metadata says recertification begins; the body establishes suspension and triage, not a recertification flight or completed reassessment. Narrow event 004 to the observed result (F5). |
| C7 | `manuscript.md:45,643-649`; `:895-897` | The declared single-watch duration does not accommodate departure near the end of second watch. Widen the metadata duration without inventing a watch-to-hours conversion (F5). |

No hard contradiction with an approved 0004/0015 decision was found.
Light-Bequest, the local two-register stone and coherence-frame, Aurel's
unverified pitch, the rumored Synod booth, and the distinct later buyer play
no role in story-0017. Story-0021's childhood Halix-visit conflict remains
unresolved and belongs to its later review; its rendering, transport, and
repair outcomes remain unapproved. None is imported here.

## 6. Per-story card

### story-0017 — The Loss Ledger

Current tier: draft / draft / metadata.status draft

Hard gates: FAIL (unsupported burn-contour law, `manuscript.md:202-204`; F1)

Depends on: primary story-0001; no shared event prerequisites

Depended on by: draft story-0021; speculative Corin and Lysa profiles

What it establishes: Corin Tave audits H-37 in an unnamed Canticle records
annex and uncovers deceased charting pilot Lysa Korr's unrecorded personal
anchor burn. An Archivist witnesses his correction, withdrawing clean
certification and imposing passenger holds, rerouting, exceptional medical
access, and personnel review. The proposed local certification process
changes institutional obligations; it neither restores Lysa nor repairs a
corridor. Successful recertification and later freight/repair outcomes are
not established by this ending (`manuscript.md:733-802,818-833,912-933`).

| Criterion | Score | Weight | Points | Evidence |
| --- | --- | --- | --- | --- |
| A Metaphysical fidelity | 0 | 3 | 0 | General burn-contour diagnosis has no matching governing rule (`:200-204,239-245`). This gate overrides the otherwise correct distinction between bookkeeping and physical stabilization (`:527-535,797-802`). |
| B Bible compliance | 5 | 3 | 15 | No actual anchor restoration, locked-character action, or collapse reversal; the burn remains absent and the corridor is unchanged by entry (`:377-389,797-802`). Explicit bible citations exist (`:120-123`). |
| C Tonal fidelity | 3 | 2 | 6 | The procedural sounds and pilot addenda earn loss through concrete absences (`:270-275,659-684`). The narrator explains “the story” (`:478-479`), and the ending repeatedly glosses its burden/justice after consequences already show it (`:837-856,902-904`). |
| D Craft and structure | 3 | 2 | 6 | Discovery, pressure, signed correction, and personnel review change the state (`:208-266,635-639,789-809,912-920`). The second/between-run discrepancy weakens the investigation (`:243-245,325-373`); repeated argument and multiple thematic endings dilute its exit (`:847-856,875-904,922-937`). |
| E Cross-canon coherence | 3 | 2 | 6 | Sole story dependency is primary (`:41-42`), and no donor or pilot is restored. The recovery prohibition exceeds primary factual/experiential distinction; the count is unresolved and Lysa's profile repeats the overclaim (`:317-320,396-403`; `characters/Lysa_Korr.md:75-77`). |
| F Repository hygiene | 3 | 1 | 3 | Required contract, citations, valid summaries, and accurate 4610-word count exist (`:4,11-12,120-129`). Event 004 asserts unshown recertification (`:97`), duration disagrees with the coda (`:45,895-897`), and H-37 lacks an atlas entry despite its named reusable role (F7). |
| G Canon value | 4 | 1 | 4 | A correction imposes new costs without refunding old sacrifice (`:818-833,875-877,912-920`); that is useful continuity for draft 0021's declared suspension dependency. Lock only the local procedure and unresolved suspension, not residue physics or a successful later repair. |
| **Total** | | | **40 / 70** | |

Recommendation: **Hold**. Resolve F1-F3 and F5-F7 and perform a fresh review
before a promotion decision. F4 is an optional procedural clarification.
Applying the proposed wording does not automatically produce a Promote score.

Required fixes before promotion: F1-F3 and F5-F7, with exact proposals in section 7.
The linked-profile portions of F1/F2 are corrections proposed for approval,
not permission to change those profiles' statuses.

Contradictions found: C1-C7 in section 5. No locked protagonist or settled
story-0004/story-0015 decision needs alteration.

Author decisions needed: documentary investigation versus expanded
metaphysics; a defined anchor-count history; the local institutional scope
and degree of prose compression (section 8).

## 7. Fix list by story

### F1 — Make the evidence documentary and the certification a model

**Required; hard-gate repair.** Governing sources support loss records,
attention, tuned inputs, and temporary corridors, not the universal
post-burn contour (`manuals/PILOT_MANUAL.md:120-124,294-297`;
`mechanics/CORRIDOR_MECHANICS.md:68-84,150-151`). The draft already has a
recorded replay and an excision checksum (`manuscript.md:329-373,700-707`),
so a documentary investigation preserves its plot.

Exact proposed substitutions below are coordinated; applying only the first
one would leave the unsupported premise elsewhere. Other uses of trace or
effect should refer back to these surviving instrument records, not anchor
contents left as fuel.

| Location | Exact current text | Exact proposed text |
| --- | --- | --- |
| `:188` | He lowered the room lights and asked for anchor residue. | He lowered the room lights and asked for the calibration telemetry beneath the summary. |
| `:196` | There, under the reliquary layer, something personal answered. | There, under the reliquary layer, the recorded pilot feed rose without a matching stone input. |
| `:200-204` | Corin held his attention on it until the table warmed. The trace did not bloom into a memory. It could not. Burned anchors did not return because a clerk stared at their ashes with professional discipline. But anchor burn left a contour in systems that had used it. A route chart could carry that contour the way a healed bone carried weather. | Corin held his attention on it until the table warmed. The table was reading instrument logs, not the spent memory. A recorded change in pilot feed could survive a false summary. It could not give back what the pilot had burned. |
| `:239-245` | Corin compared the timestamp to the residue. / The numbers did not agree. / The undocumented trace belonged between the second and third confirmation runs, seven minutes before Lysa signed the green recommendation. The chart said reliquary only. The route said a pilot had spent something. | Corin compared the recorded feed change with the confirmation logs. / It fell during the second run, where the summary recorded reliquary input alone. The instruments showed a pilot input the summary had omitted. He opened the run to find out what it had cost. |
| `:300-301` | "Likely. Not a stone. Not civic leakage." They touched two fingers to the table and waited for the witness relay to answer through their ring. "Whose packet?" | "Likely. The stone feed does not account for it." They touched two fingers to the table and waited for the witness relay to answer through their ring. "Whose packet?" |
| `:517` | "Because it learned a correction from a pilot we did not record." | "Its model includes a correction from a pilot whose loss we did not record." |
| `:551-553` | "Her anchor is gone," he said. "The chart contains the effect of its expenditure. That effect was certified as reliquary-only. Every pilot using H-37 is being told a false story about what the route requires." | "Her anchor is gone," he said. "The chart contains the calibration from that run. We certified a personal expenditure as reliquary-only. We have not verified the release under the load the chart promises." |
| `:697-698` | A schedule held. Thousands of safe arrivals leaning, fraction by fraction, on a loss filed as none. | A schedule held. Thousands of arrivals modeled against a calibration whose cost had been filed as none. |
| `:932-933` | Somewhere, a corridor that had never cared what clerks admitted continued to hold because memory had already been spent into it. | Somewhere, a pilot held a crossing with present attention and memory input. The correction changed what the Fleet disclosed, not what a drive had to spend. |

Slashes in the table mark paragraph breaks in the quoted current/proposed
blocks; they are not literal manuscript characters to insert.
When replacing `:517`, also delete the now-orphaned exchange at `:519-521`,
from **"Learned?"** through **"Mine. Plain language."**

Add after the proposed `:551-553` exchange:

> The certification admitted a cost model, not a promise that no pilot would
> ever burn. The missing expenditure meant that model had not been tested
> on the terms the Fleet was offering.

This makes the safety/consent reason for suspension explicit without
asserting H-37 has secretly operated on one dead pilot's fuel for seventy-two
cycles. Keep the ordinary recurring tax at `:147-148`, the stable corridor
at `:257-258`, and the unchanged physics after signature at `:797-802`.
Green certification establishes a reviewed model and disclosed assumptions;
it does not establish free passage, restored memory, or permanent safety.

Before any later profile approval, align the dependent wording too:

- `characters/Corin_Tave.md:77-79`: replace **an undocumented anchor-burn
  trace belonging to deceased pilot Lysa Korr inside the clean certification
  of route chart H-37** with **surviving calibration records of deceased
  pilot Lysa Korr's undocumented anchor burn beneath H-37's clean summary**.
- `characters/Lysa_Korr.md:81-83`: replace **Her undocumented burn remains
  as a trace folded into the route chart's release-end correction, not as a
  recoverable memory or active consciousness.** with **Surviving calibration
  records show her undocumented burn during H-37's release-end correction;
  they contain neither her spent experience nor an active consciousness.**

The recommended path requires no governing mechanics amendment. Keeping
literal anchor-specific residue instead would require separate author
approval, a sourced mechanics/lore proposal defining its limits, and a new
hard-gate assessment. This report does not supply that missing rule.

### F2 — Separate a deleted record from a burned experience

**Required.** `manuscript.md:375-385` and `characters/Lysa_Korr.md:75-77`
make documentary recovery impossible *because* the anchor burned. Primary
story-0013 retains known facts and recorded descriptions after the sensory
loss (`stories/short_story/the_smallest_burn/manuscript.md`, III. The Ledger:
“The facts remain. The attachment is thinner.”). Primary story-0022 also
retains Inya's independent memory of Hael (`:970-976`). These are comparisons
of scope, not a claim that Lysa's deleted line actually survives.

Replace the exchange at `manuscript.md:377-385`, from the Archivist's **"No."**
through **"impossible."**, with:

> "No. The packet retains the edit history, not the deleted text."
>
> "Another record might name it."
>
> "A description would still be a description. It would not restore her anchor."
>
> "There is no description here," Corin said.

Delete the following **"Good."** at `:387`. Replace **They both stood with the impossibility for a while.**
(`:389`) with **They both stood with the blank field for a while.**
In the entry at `:757`, replace **Unknown. Excised from source record. Not
recoverable.** with **Unknown. Excised from source record. No surviving
description found in this packet.** At `:875-877`, replace **The lost anchor
contents remain unknown and unrecoverable.** with **The lost anchor's
contents remain unknown in the surviving record; the burn is permanent.**

For the separate Lysa profile correction, replace its `:75-77` paragraph with:

> The exact contents of that burned anchor are unknown in the surviving
> records. Recovering a description would not restore Lysa's burned
> experience; no description is recovered in story-0017.

Replace the invariant at profile `:46`, **Performed an undocumented personal
anchor burn during H-37 confirmation; exact anchor contents remain unknown
and unrecoverable**, with **Performed an undocumented personal anchor burn
during H-37 confirmation; its contents remain unknown in the surviving
records, and the burned experience cannot be restored**. Keep the prohibition
on reviving her or restoring the anchor. Keep the unknown unresolved in this
story; this correction approves no later discovery or recovery capability.

### F3 — Reconcile the run sequence and anchor history

**Required.** F1's replacement of `:239-245` resolves the second-run conflict
in C3. Preserve the second-run burn, third confirmation, and later manual edit
(`:349-373,704-707`). No new history of a second hidden H-37 burn is needed.

For C4, the lowest-impact proposed history is fifteen initial knots, four
documented whole-knot burns, eleven actually responsive before H-37, and ten
after its hidden burn. Replace **fourteen responsive anchors** at `:317`
with **fifteen responsive anchors**. Replace `:680-681`, **The report
classified it as moderate because the name remained, the voice did not, and
the vocational anchor thinned but held.** with **The report classified it as
moderate: the voice-knot was gone, while other memories still held her name
and vocation.** After `:403`, add:

> Four documented knots gone from fifteen. Eleven before H-37. If this run
> had taken another, the post-run count should have been ten.

This is a proposed author choice, not a finding that the current fourteen is
necessarily a typo: the present “thinned but held” wording permits another
intention. An alternative is fourteen initial and ten genuinely responsive
before H-37, with the alleged eleven already falsified in earlier audits;
that creates an earlier falsification history and requires more revision.
Do not silently add anchor regrowth or a new partial-burn counting rule.

The final **listed as nine** at `:423-424` may remain explicitly unreliable.
Do not turn it into a verified nine, infer which later anchor was lost, or
assert a reconciled final inventory: the story deliberately lacks a trusted
death-run count. The proposed ten is the reconstructed H-37 outcome only.

### F4 — Make suspension exceptions procedurally consistent

**Recommended optional clarification, not a proven contradiction or a new
universal waiver policy.** Both pilots may have accepted the risk before one
captain declines departure; the current text does not exclude that reading.
For a more explicit sequence, replace
`manuscript.md:820-822`, **The two medical ships received captain's waivers
after their pilots accepted increased release-end tax and additional
Archivist witnesses. One captain declined and delayed. One accepted and
asked for the corrected chart.**, with:

> The two medical ships were offered waivers requiring pilot consent to
> possible additional release-end expenditure and an additional Archivist
> witness. One captain declined and delayed. The other returned the pilot's
> acceptance and asked for the corrected chart.

At `:574-575`, replace **Medical traffic by captain's acceptance of increased
anchor tax.** with **Medical traffic only by captain's waiver, with the
pilot's acceptance of possible additional anchor expenditure.** This separates
command authorization from the pilot's consent and avoids claiming the old
tax has already been quantified by recertification. Governing consent and
proportional expenditure remain required (`manuals/PILOT_MANUAL.md`, 12.1-12.2).

Keep the observed local outcome: no ordinary passenger service on H-37,
cargo delayed or rerouted, a courier sent elsewhere, and exceptional medical
authorization under caution (`:573-581,818-832`). Suspension is not a physical
barrier to all flight. Do not announce successful recertification, an exact
new operating tax, or a fixed twelve-cycle minimum: the supervisor predicts
at least twelve (`:501-505`), and Corin explicitly allows less with staffing
(`:583-585`). Later story-0021's twelve-cycle assertion must be assessed
during its own review, not ratified here.

### F5 — Match events and duration to what the body establishes

**Required hygiene: narrow event 004 and correct duration as below.** The
playbook's Step 4 requires an events block for this chronology; the existing
four events satisfy that threshold. It does not require one event per
chronology row. As an optional coverage improvement, add the significant
T0+3h confrontation (`manuscript.md:51-52`), allocating an unused local ID at
implementation time after repository and history checks. Do not guess it
in this review. Proposed optional event payload:

```yaml
timestamp: T0+3h
summary: Canticle traffic leadership pressures Corin to preserve the clean chart for operational stability.
canon_tier: draft
source: stories/short_story/the_loss_ledger/manuscript.md
involved_entities: [story-0017, char-0021, fact-0001, fact-0002]
```

If adding that event, use the same summary for its chronology row. Preserve
all four existing IDs and timestamps. Keep the other chronology and event
summaries consistent after F1/F2/F4; identical wording is useful but is not a
separate mandatory gate for these local records. Do not merge distinct beats
or move local records into the shared timeline merely to satisfy a promotion
tool.

For event 004 at `:97`, replace **Canticle traffic reroutes ships, delays
corridor assignments, and begins recertifying the chart without recovering
Lysa's burned anchor.** with **Canticle traffic reroutes ships and delays
corridor assignments while H-37's clean certification remains suspended
pending recertification; Lysa's burned anchor remains lost.** Use this also
for the T0+6h chronology summary. Recertification would require new flights
and checked inputs, which the body proposes (`:251-253,576-577,766`) but does
not stage or report complete.

Replace duration at `:45`, **One records watch, from routine chart audit to
traffic suspension notice**, with **From a records watch into the following
watch, through the first delayed departure and closing audit**. Do not
convert unspecified Fleet watches or cycles into hours. The T0 offsets need
not represent each later coda action.

After approved edits, recalculate the body word count, update modification
timestamps, rebuild maps, and run relevant gates. The present count is
correct: **4610** whitespace-delimited body words. Summary lengths are
**104/543** characters, within **220/1200** limits. `contract_version`,
`bible_refs`, current tiers, source paths, and references pass. No current
field repair is needed for these items.

### F6 — Remove narrative self-explanation and shorten the thematic coda

**Required craft pass with a defined minimal option.** The consequence is
already visible in the held ships and personnel review (`:818-833,912-920`).
Against `docs/STYLE.md`, sections 4 and 6, the draft explains those effects
again and repeatedly announces an ending. Preserve the supervisor's real
case about food, medical craft, limited stocks, and higher alternate-route
costs (`:481-505`); do not turn her into an opponent who has no valid concern.

Exact proposed cuts/replacements:

- At `:478-479`, cut **Corin preferred it that way. If he named everyone in
  this room, the story would pretend names were the same thing as
  accountability.** End the preceding observation at **in the angle of the
  light.** This removes the narrator's commentary about how a story works.
- At `:559`, replace **"Ignorance can be operationally useful."** with
  **"A caution flag could keep this watch moving."** Delete the following
  exchange from **The Archivist spoke then. "So can amputation."** through
  **"I am naming categories."** (`:561-566`). The supervisor's later
  restricted-anomaly proposal still states the specific compromise.
- Cut the coda exchange from **"It will not make the burn more meaningful."**
  (`:841`) through **"Burden is one of the honest forms memory takes."**
  (`:856`). Retain the prior question about Lysa not becoming more alive and
  Corin's answer; let the entry and consequences carry the rest.
- Delete the paragraph at `:902-904`, from **That was not justice.** through
  **the living to walk differently.** Keep the departure, the pilot's
  acknowledgment, and the pending personnel review.
- At `:881-882`, replace **Then he added one more sentence, because the record
  required it and because he did not know where else civilization put shame
  when it was still useful.** with **He added one sentence.** The field is
  optional (`:865`); a narrator need not declare this gloss required.

These changes keep the small spoken final correction and final physical
ledger image. A larger ending restructure is an available author choice,
not necessary to implement this minimal pass. No extra sacrifice is needed
to make the existing institutional cost count.

### F7 — Document only the reusable chart and keep profile approval separate

**Required repository scope decision.** H-37 is a named, central chart/route
artifact, identified at `manuscript.md:166`, reused in both linked profiles
and explicitly depended on by draft 0021. No atlas file exists for it.
The playbook's Step 4 calls for a profile for a new named location/artifact.
Recommend an `atlas/` entry for the **route chart artifact**, allocating its
`loc-####` with `ids_next.js --type loc` only during implementation. Proposed
body, after F1-F5 approval:

> H-37 is a Canticle route chart for an internal Helios Drift crossing. In
> story-0017, Corin Tave finds recorded evidence of Lysa Korr's undocumented
> personal anchor expenditure during its confirmation. His witnessed loss
> entry withdraws the chart's clean certification. Ordinary passenger use is
> held, cargo is delayed or rerouted, and exceptional medical passage is
> considered under waiver. The story closes with certification suspended
> pending recertification. It establishes neither a completed reassessment
> nor a route sustained by Lysa's spent anchor without new input.

Create schema-compliant short/long summaries from this defined scope, use
`location_type: artifact` and `metadata.status: speculative`, and add the
allocated ID to 0017's appearance/dependency location lists. Link only its
established participants, Fleet/Orders, Helios, mechanics, and source
story-0017; do not import 0021's filament transport or repair. Its later
canonical status requires its own claim review. H-37's exact endpoints,
spatial shape, age beyond the reported certification, and relation to the
Tessarine breach are not supplied by this story.

The annex, ship in replay, Archivist witness, and supervisor remain unnamed
local figures/settings and need no invented profiles. Loss Ledger already
has a source at `manuals/PILOT_MANUAL.md:297`; capitalization alone does not
require a new lexicon entry. Green/amber certification, witness relay, and
the annex equipment should remain **this Fleet procedure**, not a new
universal physics or lexicon bundle. No new faction is introduced.

Corin's and Lysa's profile corrections in F1/F2 do not authorize canonical
status. Review their full proposed profiles claim by claim only after story
approval, under `docs/governance/source_first_approvals.md`. Corin's personnel
review and Lysa's deceased status are supported proposals; successful future
recertification, documentary impossibility as a universal law, and revived
experience are not. Any Fleet/Orders/Helios backlink additions should be
appearance links unless their approved baselines truly need this outcome;
do not widen unrelated profile authority through this story review.

### O1 — Optional tighter exit

The closing ledger image at `:937` restates the opening weight image; the
personnel notice at `:912-920` already supplies a less explained cost. An
optional larger cut would end after **deceased Canticle pilot, one
undocumented anchor burn entered under correction.** at `:920`, deleting
`:922-937`. **Recommendation:** use F6's smaller cuts first; retain the last
physical image unless a reread still finds the coda too long. The F1 final
sentence replacement is unnecessary if that entire tail is deliberately cut.

### O2 — Optional sequential stone-use clarification

At `:331`, **Two personal memory stones warmed the model.** does not specify
whether the stones are fed concurrently. The manual's section 6.2 permits
one stone at a time unless lattice harmonics permit otherwise; the draft
does not prove a violation. Optionally replace that sentence with **The model
replayed the first personal stone, then the second.** This makes the existing
two-stone input sequence explicit at little prose cost; retaining the line
avoids an extra procedural detail but leaves the ambiguity. Recommend the
clarification, not a second hard-gate finding.

## 8. Author decisions

The following are proposed editorial choices, not requests to approve an
unseen revision. Each is concrete enough to authorize separately.

| Choice | Evidence | Options, pros, cons, and recommendation |
| --- | --- | --- |
| **1. Documentary evidence or new residue physics?** | `manuscript.md:202-204,329-373,700-707`; mechanics sections cited in F1 | **Recommend F1/F2:** use stored telemetry and excision history, distinguish a lost description from permanent experiential loss, and clarify present input/model certification. Pros: retains investigation and institutional premise; clears the identified new-law gate without changing governing canon. Cons: removes the literal burn-contour discovery and some metaphysical imagery. Alternative: keep forensic residue, first commission/approve a bounded mechanics/lore proposal; its scope and downstream diagnostic power would need review. No such expansion is approved by this report. |
| **2. Which count history should be true?** | `:317-320,396-403,423-424,678-681` | **Recommend F3:** fifteen initial, four documented knot losses, eleven pre-H-37, reconstructed ten afterward; final recorded nine remains untrusted. Pros: fewest changes, respects primary exemplar counting and retains uncertain death records. Cons: changes Lysa's initial number and specifies the distinction between the lost voice-knot and surviving vocation. Alternative: fourteen initial and ten actually pre-H-37, making the earlier eleven already false; costs a broader falsification history. Keeping fourteen/eleven through partial loss needs an explicit, sourced counting account rather than an unstated exemption. |
| **3. What institutional outcome and prose scope should lock?** | `:573-585,789-833,912-920`; Step 4 playbook; source-first policy | **Recommend F4-F7 plus F6's minimal cuts:** a local H-37 certification model, passenger hold/cargo triage/consensual medical exceptions, pending recertification with no fixed guaranteed duration, and a narrow speculative chart profile. Pros: precise usable prerequisite for later review; preserves competing real costs and avoids general Fleet physics. Cons: adds a small profile and reduces argumentative/thematic repetition. Alternative: larger O1 ending cut removes the last image; keeping all commentary retains voice but leaves the scored pacing weakness. No choice approves 0021's repair, transport, or rendering, or any profile's status. |

Implementation choices within those three scopes also have distinct costs:

| Item | Benefit of recommended treatment | Cost / alternative |
| --- | --- | --- |
| F4 optional medical wording | Clarifies waiver eligibility, pilot consent, and the captain's subsequent choice without alleging a proved contradiction. | A few more procedural words; eliminating the exception entirely would change the triage outcome and is not recommended. |
| F5 event/duration correction | Searchable metadata records suspension actually shown; an optional event can also expose the confrontation. | Wider duration and optionally one local event; staging completed recertification instead would require a new scene/outcome and is not recommended. |
| F6 minimal compression | Consequences carry the emotion; the supervisor keeps a credible case. | Fewer aphorisms and explicit interpretations; O1 offers a larger cut with loss of the final weight image. |
| F7 artifact/profile scope | Reusable H-37 facts can be retrieved without inferring a permanent powered corridor. | One provisional file and links; keeping H-37 exclusively local would defer documented reuse and leave Step 4 hygiene incomplete. |
| O2 optional stone sequence | Removes uncertainty about simultaneous untuned inputs. | Adds a procedural detail; no violation is proved by the current line. |

Approval of revision scope would authorize the specific corrections, not
promotion. After revision, the score and hard gates must be reassessed.
Tess/Halix additions supported by story-0015 still await their separate claim
review and are outside these choices.

## 9. Method and change boundary

The full review-agent required reading was completed: AGENT; STYLE; all three
mechanics files; Pilot Manual; full story bible; the four governing lore
files; both named theology files; full structured lexicon; full primary
exemplars *The Archivist's Wake* and *Spend What You Can Afford*; playbook;
schema quick reference; canonical index. CLAUDE, CONTRIBUTING, the review
agent, source-first policy, story schema, README, both requested historical
reports, and relevant commit conventions were also read. Primary story-0013
was read in full as additional evidence for retained facts, recorded costs,
and recurring route input; it was not rescored.

Story-0017 was read in full, followed by all its declared linked entries,
including both characters' invariants and watchlists. This single story's
card was completed before any next-story review; no next story was opened
for scoring. Later-draft metadata and limited passages found by dependency
searches were inspected only for provenance, not treated as authoritative
evidence. Independent read-only dependency and mechanics audits were
reconciled with the primary review. Summaries and continuity notes were
checked against scenes, not accepted as findings.

At the original review checkpoint, only this distinct report was added. Existing reports, all manuscripts,
profiles, lexicon, events, lore, mechanics, and generated maps are unchanged.
No promotion command was run. The approved story-0004/story-0015 prose and
decisions are preserved. The report is committed and pushed on the review
branch so the review survives the session; no PR is prepared until the
author's approved changes are implemented, as requested.

## 10. Author-approved revision and fresh readiness check

### Approval and implemented scope

The author responded **“Approve all three”** to the three recommended scopes
in section 8: documentary evidence rather than expanded residue mechanics;
the fifteen-anchor history; and the local suspension/triage outcome with a
narrow H-37 profile and minimal prose cuts. This authorizes revision and PR
preparation under the original task, not promotion or profile status changes.

The five-section plot remains intact. Corin still signs the entry despite
traffic disruption and personnel review. Lysa remains dead, the spent
experience remains absent, and neither recording the cost nor withdrawing
certification repairs a physical corridor. The last ledger image is retained;
O1's larger ending cut is not applied. The manuscript and repository style
guide control the prose, with the author's *Write in Jeff's Voice* fiction
guidance used to preserve its register.

The following references point to the revised manuscript, rather than the
original line numbers in sections 1-9.

| Finding | Implementation and revised evidence |
| --- | --- |
| F1: documentary investigation | The table reads calibration telemetry and instrument logs, not residue or spent contents (`manuscript.md:203-225,254-258`). The witness tests the recorded feed against stone input (`:304-314`); no automatic forensic law remains. The later display also uses recorded feeds (`:502`). |
| F1: certification and fresh cost | Corin identifies a calibration/model omission, not a living memory hidden in the chart (`:528,557-564`). Signature withdraws certification while physics remains unchanged (`:798-807`). Present pilot attention and input remain required (`:916-917`). |
| F2: record versus experience | The packet retains edit history, not deleted text (`:388-398`). The entry says no surviving description was found in this packet (`:762`); the coda leaves contents unknown while affirming permanent burn (`:864-866`). Both profiles now preserve this distinction. |
| F3: chronology and count | Telemetry belongs to the second run (`:254-258`), consistent with its replay. Fifteen initial anchors and four documented burns leave eleven; the hidden burn reconstructs ten (`:330-334,405-415`). The moderate voice-knot is gone while other memories carry vocation (`:683-686`). The final listed nine remains explicitly suspect (`:432-436`). |
| F4: local medical procedure | Waiver requires the pilot's acceptance of possible additional expenditure (`:577-582`). Both medical ships are offered the procedure; one captain declines and the other returns acceptance (`:825-828`). No guaranteed measured tax or universal waiver law is added. |
| F5: metadata and events | Duration now extends into the next watch. Event 004 records suspension pending recertification, not unshown recertification work. Existing IDs/timestamps remain; optional event 005 at T0+3h makes the leadership confrontation retrievable (`:45-120`). |
| F6: restraint and pacing | The narrator's reference to “the story,” the amputation exchange, and repeated burden/justice glosses are removed. The supervisor retains the concrete case about food, scarce stores, medical craft, and alternate-route costs (`:491-516`). The departure, personnel notice, spoken correction, and final physical image remain (`:883-921`). |
| F7: scoped artifact and profiles | `ids_next.js --type loc` allocated `loc-0016`, now `atlas/H_37_Route_Chart.md`. The artifact covers chart certification, the documented omission, triage, and pending recertification only. Story and character links include it. Corin/Lysa summaries, invariants, and bodies use recorded evidence and remain speculative. |
| O2: input sequence | The replay uses the first personal stone and then the second (`:342-346`), clarifying the existing two-stone input without implying concurrent untuned feed. |

The optional T0+3h event was added as a coverage improvement, not because
the playbook requires one event per chronology row. Repository and available
git-history searches found no prior use of `event-story-0017-005` before
allocation. All five event IDs stay local and draft. No entry was added to
`data/timeline/events.yaml`. The body now contains **4464 words**, matching
`metadata.word_count`; summaries remain within limits at 104/543 characters.
Modification dates were updated on the revised manuscript and profiles.

### Fresh assessment

The revised manuscript was reread in full. An independent fresh mechanics,
craft, and hygiene review reached the same score and found no remaining
manuscript blocker. The original unsupported-law hard gate is resolved by
documentary evidence, not waived or reclassified.

| Criterion | Score | Weight | Points | Revised evidence |
| --- | --- | --- | --- | --- |
| A Metaphysical fidelity | 4 | 3 | 12 | Evidence is surviving telemetry (`:203-219`); recorded calibration is not donor fuel (`:557-564`), and current attention/input are explicit (`:916-917`). The local equipment/procedure remains an application, not a reusable burn-contour law. |
| B Bible compliance | 5 | 3 | 15 | No anchor, lived experience, death, or collapse is reversed (`:388-398,432-436,864-866`). Bible references remain present (`:135-138`); no locked protagonist or Heliodrome outcome changes. |
| C Tonal fidelity | 4 | 2 | 8 | Pilot losses are concrete and restrained (`:664-689`); repeated coda explanation is reduced while the withheld passenger departure and private personnel notice retain cost (`:883-900`). Some pointed institutional phrasing remains, deliberately within this story's voice. |
| D Craft and structure | 4 | 2 | 8 | Evidence and second-run chronology agree (`:254-258,338-386`); the model defect supplies a practical suspension reason (`:557-564`). Waiver choice, traffic adaptation, and personnel review sustain irreversible consequence (`:823-844,896-904`). The retained coda is still more extended than the primary exemplars' tightest exits. |
| E Cross-canon coherence | 5 | 2 | 10 | Story-0001 remains the only causal story prerequisite (`:43-44`). Count and permanent-loss distinctions are reconciled (`:405-415,683-686`), and no later-draft outcome supports the result. The three dependent profiles remain explicitly speculative. |
| F Repository hygiene | 5 | 1 | 5 | Valid contract/citations and accurate count (`:4,135-144`); five local draft events record actual outcomes (`:59-120`), and the named chart has a scoped profile. Generated artifacts include the new artifact and links. |
| G Canon value | 4 | 1 | 4 | Disclosure creates a useful institutional constraint and real transport costs without repairing old sacrifice (`:798-844,903-917`). It supplies a precise proposed prerequisite for later 0021 review while locking neither completed recertification nor that draft's repair/rendering. |
| **Total** | | | **62 / 70** | |

**Hard gates: PASS. Recommendation: ready for the author's story-approval
decision (Promote score band). Full CI-parity validation passes.** This
readiness finding does not change any story, event, or profile status.

### Validation and preserved boundaries

Pre-commit `npm run lint`, `npm run check`, and `git diff --check` pass.
Continuity and timeline reports have zero hard failures and zero soft
warnings. The rebuilt graph has **175 entities, 808 edges, zero orphaned
targets**. Existing advisories are **21 schema warnings** (18 skips plus
three recommended-status warnings), **976 glossary candidates** across 55
scanned files, and the two nonblocking draft red-line warnings in stories
0005 and 0007. After staging the generated files, `npm run validate:ci`
passes the complete CI-parity suite, including dashboard, tooling,
dependency-impact, coverage, canon-policy, prompt-pack, timeline-event,
promotion-tool, red-line, and continuity regression tests. A final
`git diff --check` also passes.

The impact report now finds four direct dependents: speculative Corin,
speculative Lysa, speculative H-37, and draft story-0021; no transitive
dependents. Manuscript story prerequisites remain primary-only. The new
artifact depends on draft 0017 and cannot acquire canonical status merely
because this revision passes checks.

No governing mechanics, bible, manual, lore, lexicon, or shared timeline file
changes. No profile is promoted. Story-0004, story-0015, their local events,
Tess/Halix's separate pending claim reviews, and story-0021's manuscript and
unresolved childhood-visit conflict remain untouched. The PR contains only
the approved story-0017 revision, its two provisional profile corrections,
the new provisional chart artifact, this review checkpoint, and generated
maps. The author will merge; no merge or promotion is performed here.
