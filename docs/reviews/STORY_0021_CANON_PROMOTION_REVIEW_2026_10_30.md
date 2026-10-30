# Canon Promotion Review: Receipt for a Voice

**Current checkpoint:** On October 30, 2026, the author approved promotion
of the **65/70** revision merged in PR #55 at 6e4eb69. Story-0021 is now
primary_canon / canonical / authoritative, and its four unchanged local
events are primary_canon. The approved manuscript body is byte-identical.
Expanded profile claims still require separate review. Sections 1-9
preserve the original **50/70** review, section 10 records revision and
readiness, and section 11 records this promotion and its validation.

## 1. Scope and baseline

Evidence uses fetched main **8ba40df29399f2aeef9b686ed7fd0ba9ff1b0c44**
(PR #52), on branch review/story-0021-canon-2026-10-30. Reading began at
35d13c0200653b16dac0f1c27ddffe79b1612ff6 (PR #53). A final fetch found the
atlas viewer merge; the branch fast-forwarded to include it. No story,
profile, governing canon source, review instruction, or cartographic claim
changed between those snapshots. The worktree was clean before this report.
Existing unrelated atlas tooling and all prior reports are preserved.
Manuscript line references below use this snapshot; abbreviated “0021”
means stories/short_story/receipt_for_a_voice/manuscript.md.

First, npm ci and npm run validate:ci passed. The generated graph contains
175 entities, 806 edges, and zero orphaned targets. npm run
report:canon-tiers was then run and its output read. Continuity and timeline
reports both contain zero hard failures and zero soft warnings. Existing
nonblocking output is 21 schema warnings, 976 glossary candidates, and
draft red-line citation warnings for stories 0005 and 0007. The baseline
does not detect the first-visit conflict found by reading the prose.

After the atlas viewer merge, npm ci and the complete validate:ci suite
passed again on 8ba40df, including the newly added map viewer and render
tests. The graph and existing warning counts are unchanged. A final diff
against main confirms that all manuscripts, profiles, shared data,
governing sources, map placement, and generated graph files are unchanged.

Current story state is draft / draft / metadata.status draft, retrieval
role active_draft (0021:8-10,125-130). Its body contains exactly 2682
whitespace-delimited words, matching metadata; summary lengths are 123 and
549 characters, below the schema's 220/1200 limits.

The governing instructions, full review-agent reading list, both primary
exemplars, every directly linked entity, and the complete primary
prerequisites 0004, 0013, 0015, and 0017 were read. The historical reports'
current checkpoints and final approval records distinguish settled canon
from superseded draft findings:

- [Story-0004 review](STORY_0004_REVIEW_2026_10_28.md).
- [Story-0015 review and promotion](CANON_PROMOTION_REVIEW_2026-10-29.md).
- [Story-0017 review and promotion](STORY_0017_CANON_PROMOTION_REVIEW_2026_10_29.md).
- [Separate Corin/Lysa/H-37 claim approval](STORY_0017_PROFILE_CLAIM_REVIEW_2026_10_29.md).
- [Source-first approval policy](../governance/source_first_approvals.md).

No developmental edit of an approved prerequisite is reopened. The
contradictions below are proposed corrections to 0021.

## 2. Summary table

| ID | Title | Score | Hard gates | Recommendation band | Required fix groups | Story prerequisites |
| --- | --- | --- | --- | --- | --- | --- |
| story-0021 | Receipt for a Voice | 50/70 | PASS | Promote after fixes; not ready as written | F1-F5; O1-O2 optional | Primary 0004, 0015, 0017, 0013, 0001 |

E receives zero because the rubric explicitly assigns zero for a primary
canon contradiction. This is distinct from the four enumerated hard gates:
a correctable first-visit contradiction is not itself a bible red line,
new physical law, unapproved novel/novella dependency, or failing CI gate.
The resulting band permits the narrow wording and metadata fixes below;
it does not authorize promotion.

## 3. Hard-gate failures

**None.** Each formal gate was checked separately.

| Gate | Result and evidence |
| --- | --- |
| Bible red line | PASS. Extraction removes a living memory, shown at 0021:415-423; the ending does not return it (:512-519). Elior retains eleven anchors (:450-467), consistent with primary 0013's post-run eleven (:427-438). Yenu's retained grandmother voice (:434-435) is a different memory, heard in primary 0004:512-522. No locked crew character acts here; no Heliodrome resolution occurs. |
| Undocumented new metaphysical law | PASS. Volunteer rendering already exists in lore/MEMORY_ECONOMY.md:61-68. Tuned stored inputs and continuing attention are established in mechanics/CORRIDOR_MECHANICS.md:78-98. The courier pays its own tax (0021:445-448); the cutter spends ordinary stocks plus the donated extra input under attention (:450-467). The frame repair uses filament, labor, and recitation (:482-494), extending the local design in primary 0004:224-230. No collapsed corridor is reversed or burned anchor recovered. O1 addresses a hypothetical device capability, not a demonstrated new law. |
| Unapproved novel/novella outcome | PASS. All five references.stories entries (0021:59-64) resolve to primary canon. There are no references.events or novel/novella prerequisites. The four local events (:79-107) are not imported as shared canon. |
| Current frontmatter fails CI | PASS. Full baseline validate:ci passes, including schema, references, canon policy, continuity, timeline, promotion-tool, and map tests. Required contract, timeline, events, continuity notes, and bible citations exist (0021:4,65-124). |

The statement that H-37 was offered “for free” is inaccurate shorthand
(F2), but this story actually pays for each corridor trip. It does not
demonstrate a corridor running without input; do not misclassify that
wording as an enacted cost-refund mechanism.

## 4. Recommended promotion order

1. Preserve the existing primary approvals of 0004, 0013, 0015, and 0017,
   with 0001 as the governing story baseline. Nothing requires another
   prerequisite promotion or a revision of those sources.
2. Revise 0021 only after approval of section 8's concrete scopes. Apply
   F1-F5 and whichever optional choices the author selects, regenerate
   maps, run gates, and re-score the revised manuscript.
3. Promote 0021 only after separate authorization of the reviewed result.
   No mutual bundle or shared-event extraction is necessary.
4. Review any proposed profile expansions separately afterward. Story
   approval does not approve Tess's full rendering capabilities or expand
   the Yenu, Hol-Vren, pod, Halix, or Elior profiles automatically.

### Verified dependency graph and impact

| Edge from 0021 | Needed premise and source |
| --- | --- |
| story-0004 | The grandfather's correction, Yenu's chosen hearing/release, and an unpaid local frame repair: stories/short_story/the_light_inheritance/manuscript.md:172-180,500-524,594-616. |
| story-0015 | Tess pays to buy and withdraw another family's carrier, depleting her renewal bond: stories/short_story/the_halix_aftermarket/manuscript.md:596-612,674-678,750-752,888-892. Her inability to advance a later fare is this draft's proposed consequence, not a previously approved profile invariant. |
| story-0017 | The chart's certification is suspended and cargo rerouted/delayed: stories/short_story/the_loss_ledger/manuscript.md:577-590,802-807,823-828. The filament delay is compatible with this local traffic outcome. |
| story-0013 | Elior's first classroom-smell loss is permanent; eleven anchors remain: stories/short_story/the_smallest_burn/manuscript.md:427-482,638-640. |
| story-0001 | Existing attention, stored-memory, and irreversible-cost baseline; its full manuscript was read, including “Birch in the Void” and “The Heliodrome Unravels.” The direct baseline reference is valid. |

There are no draft story prerequisites. Drift Clades has the separately
approved working-canon baseline, not primary approval of every clade
practice (factions/Drift_Clades.md:7; source-first policy:37-40).
The seven character and three declared location entries otherwise resolve
to primary/authoritative; the missing existing chart link is F5.

The impact report with --include-mentions finds two direct dependents:
characters/Elior_Ren.md and factions/Canticle_Fleet.md, both primary
profiles with existing references.stories links to this draft. There are
no transitive dependents. Six further appearance candidates are Tess,
Yenu, Hol-Vren, Aurel, Halix, and the pod. These links record provenance
and do not make 0021 authoritative. Elior's named-manifest behavior has
independent primary evidence in 0022:858-880; the draft reference is not
needed to authenticate that behavior.

Primary 0022:895-904 sends Elior toward the inner relay with seven null
stones, an expected cost still unfiled. Neither 0021's references nor its
timeline dates it relative to that later run (0021:59-78). Do not infer a
free null-stone trip from its eleven-anchor count or add a new post-run
cost/history here. The older shared 0013 event note that mentions 0021
(data/timeline/events.yaml:130) is not approval of this draft.

All ten 0004 events, five 0015 events, five 0017 events, and four 0021
events remain local. Whole-story dependencies already express the needed
premises; no later approved story currently needs an individual 0021 beat.

## 5. Cross-story contradiction register

| ID | Locations | Finding, authority, and proposed disposition |
| --- | --- | --- |
| C1 | 0021:310-313 versus primary 0004:298 | A childhood cup ride to Halix conflicts with the explicit first visit. Primary 0004 governs. Delete that candidate-memory sentence (F1); retain the rest of the selection scene. |
| C2 | 0021:157-160 versus primary 0017:162-163,558-564; primary 0013:213 | “Held for free” overstates the old certificate. The approved route already has ordinary taxes; the defect is an unverified reliquary-only calibration model. Replace the free-passage claim with the model's actual evidentiary limit (F2). |
| C3 | 0021:166 versus primary 0017:512-516,588-590 | The narrator turns a supervisor's disputed estimate into a guaranteed minimum. Attribute the estimate and preserve uncertainty (F3). The local frame deadline can still drive the plot. |
| C4 | 0021:11-12,477-480 versus its own assay at :351-355 and loss at :420-423 | The summary/return-trip language can imply loss of every remembered instance of the grandfather's voice, while the procedure selects one exchange. No broad loss is proved. Bound the approval wording to that exchange (F4), without inventing retained episodes or a general sensory-erasure rule. |

No contradiction is found in the booked cargo being delayed: primary
0017:577-580,823-828 allows cargo rerouting/delay, while 0021:464-467 leaves
H-37 suspended. Physical pod repair is distinct from route recertification.

No contradiction is found in Yenu assisting Hol-Vren while remaining an
apprentice. He corrects her connections (0021:482-487), rather than
establishing completed tuner/drive-hand training; primary 0004:188 keeps
that distinction. No contradiction is found in the twelve displaced
residents here (:145-146) after the two children displaced earlier in
0004:230,574: these are different stages of the failing frame.

The tether still has no memory drive (0021:211-214; primary 0004:282).
Mentioning three pods does not deny the Remembrancer outstation sharing
the established line; no topology change or new FTL exception follows.

## 6. Per-story card

### story-0021 — Receipt for a Voice

Current tier: draft / draft / metadata.status draft

Hard gates: PASS (section 3; no formal gate failure)

Depends on: primary canon only — stories 0004, 0015, 0017, 0013, 0001

Depended on by: no story; Elior and Canticle Fleet profiles have existing
causal-reference links, with six other profile/location appearance links

What it establishes: A booked repair shipment is delayed by H-37's
suspended certification. Tess cannot advance the extra fare after her
earlier purchase/withdrawal, and Yenu renders one remembered exchange with
her grandfather for the cutter's additional release correction. Elior
delivers the filament while retaining eleven anchors; material work and
shared recitation stabilize this pod's corner. These remain proposed
local outcomes until the revised story is approved.

| Criterion | Score | Weight | Points | Evidence |
| --- | --- | --- | --- | --- |
| A Metaphysical fidelity | 4 | 3 | 12 | 0021:415-423 shows extraction's absence, :445-467 pays both courier and cutter costs, and :482-494 pays material/labor/recitation costs. Existing volunteer rendering is lore/MEMORY_ECONOMY.md:63-68. The hypothetical copying apparatus at :437-439 is an unsupported capability detail (O1), and F4 should bound the apparent extent of sensory loss. No enacted new law or restoration occurs. |
| B Bible compliance | 5 | 3 | 15 | 0021:121-124 cites the bible; :450-467 preserves Elior's count; :517-519 preserves the loss. The grandmother voice at :434-435 is retained learning from primary 0004:512-522, not the spent grandfather exchange. No locked crew/Heliodrome/Lattice Gap outcome is changed. |
| C Tonal fidelity | 4 | 2 | 8 | The uncertain corner (:141-146), substituted cadence (:477-480), and exact repair (:482-494) physicalize the cost. Consent/manifest explanation stacks at :361-365,407-411,445-454 and partly states what the extraction already shows; compare the immediately embodied losses in primary 0001, “The Heliodrome Unravels,” and 0022, “Afford.” This is a local procedural density issue, not comic/spectacle register. |
| D Craft and structure | 4 | 2 | 8 | The opening makes the deadline concrete (:141-191); Yenu's choice changes her memory (:413-423); the ending changes shelter while preserving absence (:489-522). The transport/audit bridge reports several completed steps from the counter (:445-467), reducing immediate dramatic pressure. Its brevity serves the civilian POV, so no restructuring is required. |
| E Cross-canon coherence | 0 | 2 | 0 | The literal rubric assigns zero for a primary contradiction: childhood Halix ride (:311-312) versus primary 0004:298, “She had never been to Halix.” F2-F3 also reconcile the approved 0017 cost-model and duration limits. |
| F Repository hygiene | 3 | 1 | 3 | Required contract/events/bible citations and exact word count exist (:4,79-107,121-127); summaries meet limits. Central causal H-37 has an approved artifact ID, loc-0016, missing from both location lists (:22-25,47-50). Four events for five chronology rows satisfy the event-block requirement; a fifth event is not mandatory. |
| G Canon value | 4 | 1 | 4 | The correction's burden reaches a living donor (:157-180,407-423), and the maintenance record preserves both Lysa and Yenu (:496-501). This connects four approved strands through a bounded civilian consequence. It should lock this instance rather than universal rendering precision, pod design, or certification law. |
| **Total** | | | **50/70** | |

Recommendation: **Promote after fixes.**

Required fixes before promotion (exact before/after text in section 7):

- F1, 0021:310-313: remove “The cup ride to Halix when she had been little.”
- F2, :159-160: replace “Pilots could no longer be told it held for free.”
  with “Pilots could no longer be offered its old load model as verified.”
- F3, :166: replace the guaranteed twelve-cycle minimum with an attributed
  estimate and inability to rely on earlier clearance.
- F4, :11-12,477-480: bound summaries and the return-trip search to the
  sound of the selected correction.
- F5, :22-25,47-50,86: link existing chart artifact loc-0016.

Contradictions found: C1-C4 above; C4 is an ambiguity to resolve, not proof
that every remembered voice episode was erased.

Author decisions needed: the three scoped revision choices in section 8.
No promotion or profile-status decision is bundled into them.

## 7. Fix list by story

All proposed edits below affect story-0021 only. They are not applied.

### F1 — Remove the incompatible childhood visit

At 0021:310-313, current:

> Yenu tried to think of something easy. The taste of the first bad meal she had
> cooked. An afternoon repairing a shuttle latch in Hol-Vren's shop. The cup ride
> to Halix when she had been little. Each had a shape but too little weight for
> the release correction Tess showed her on the cutter's chart.

Proposed:

> Yenu tried to think of something easy. The taste of the first bad meal she had
> cooked. An afternoon repairing a shuttle latch in Hol-Vren's shop. Each had a
> shape but too little weight for the release correction Tess showed her on the
> cutter's chart.

**Evidence:** primary 0004:298. **Pros:** removes the contradiction without
adding biography, a new cameo, or an assumed date. **Cons:** two candidate
memories replace three. **Recommendation:** apply. An alternative is the
Solace outstation visit at age nine, established by 0004:364; it costs an
additional mention/context link with no narrative need.

### F2 — Name what the certificate actually established

At 0021:159-160, current:

> The route itself still held. Pilots could no longer be told it held for free.

Proposed:

> The route itself still held. Pilots could no longer be offered its old load
> model as verified.

**Evidence:** primary 0017:162-163,558-564; primary 0013:213.
**Pros:** preserves the distinction between paid physics and false
certification. **Cons:** less aphoristic, slightly more technical.
**Recommendation:** apply. Retaining “free” preserves a misleading promise
that the approved source explicitly limits; do not change 0017 to fit it.

### F3 — Keep twelve cycles an estimate

At 0021:166, current:

> H-37 would take at least twelve cycles to recertify. Their frame would not wait.

Proposed:

> Traffic estimated twelve cycles for H-37's recertification. Hol-Vren could not
> count on an earlier clearance. Their frame would not wait.

**Evidence:** primary 0017:512-516 gives traffic's forecast; :588-590
allows less if pilots are assigned. **Pros:** retains urgency and uncertain
institutional scheduling without a universal minimum. **Cons:** adds one
short sentence. **Recommendation:** apply. Removing the number entirely
also works, at the cost of a concrete contrast with Hol-Vren's five-cycle
deadline (0021:190-191).

### F4 — Bound the loss consistently

At 0021:11, replace the entire summary_50 value with:

> A corrected route chart strands a pod's repair filament; Yenu renders the remembered sound of her grandfather's correction to bring it home.

At :12, replace the entire summary_200 value with:

> After Corin Tave's correction suspends H-37, the Skather-Ait pod cannot receive its frame filament on the booked route as its sleeping deck loses shape. At Halix, Tess Vlin cannot advance the fare after paying to withdraw another family's closed missed-generation Light-Bequest from trade. Yenu voluntarily renders her remembered sound of one correction spoken by her grandfather for a tuned stone, and Elior Ren flies the longer corridor with his eleven remaining anchors. The repair holds, the rendered sound does not return, and Lysa Korr's hidden cost stays on the record.

At :477-478, current:

> Halfway back, she tried again to remember her grandfather's voice.

Proposed:

> Halfway back, she tried again to recall the sound of his correction.

The proposed summaries are 140/576 characters, within the 220/1200 limits.

**Evidence:** the assay bounds one exchange (0021:340-355); its absence
leaves facts accessible (:420-423). Primary 0013:360-368,450-482 likewise
distinguishes one sensory component from retained facts. **Pros:** gives
future retrieval the same precise scope as the scene. **Cons:** reduces
the broader emotional shorthand; adds no account of which other voice
memories survive. **Recommendation:** apply the narrow wording. Expanding
the actual extraction to all remembered instances would require a wider
revision and separate mechanical review.

### F5 — Link the existing H-37 artifact

Add loc-0016 to both cross_refs.locations (0021:22-25) and
references.locations (:47-50), after the current entries. The exact new
item is:

~~~yaml
    - loc-0016
~~~

For event-story-0021-001 (:86), current:

~~~yaml
    involved_entities: [story-0021, story-0017, char-0021, char-0022, loc-0015, mech-0002]
~~~

Proposed:

~~~yaml
    involved_entities: [story-0021, story-0017, char-0021, char-0022, loc-0015, loc-0016, mech-0002]
~~~

**Evidence:** atlas/H_37_Route_Chart.md defines the approved chart artifact;
0021:157-174 makes its suspended certification causal. **Pros:** makes
the reused artifact retrievable without inventing a new route entity.
**Cons:** adds graph edges and generated-map changes. **Recommendation:**
apply; allocate no new ID.

The inner relay already exists as an approved facility: lore/COSMIC_REGIONS.md
section 7, design/map/CARTOGRAPHIC_BRIEF.md Q3/T9/T10 (:55,115-116), and
design/map/cartography.yaml:149-159. No new atlas entry or placement is
required for this use. “Halix relay” (0021:464) reads as the local arrival
facility. The displayed bends (:456-459) do not supply surveyed geometry,
fixed H-37 endpoints, or a conversion from pulls to time/distance.

### O1 — Optional: remove the hypothetical copying capability

At 0021:437-439, current:

> Then she looked at the new stone and found she could not bear to hear her
> grandfather on demand, even if the cradle could make a copy of its contents
> before the cutter spent them.

Proposed:

> Then she looked at the new stone. She could ask to hear his correction from it
> before it left. She did not want to.

**Evidence:** the returned unused stone can already be heard without
restoring the lived experience (:361-365). Term-0026 defines the cradle's
audit/amplification role, not a copying function. Primary 0001, “Birch in
the Void,” nevertheless permits a memory copy to be offered; copying as a
category is not forbidden.

**Pros:** retains the emotional refusal while avoiding an unnecessary
device-capability implication. **Cons:** drops the counterfactual choice
to keep a copy after consumption. **Recommendation:** apply as a small
precision cut. This is optional because “even if” is hypothetical; no copy
is actually made, replayed, restored, or used as fresh fuel.

### O2 — Optional: avoid an unsupported calendar conversion

At 0021:164, current:

> “The one who paid the missing fare. She died years ago.”

Proposed:

> “The one who paid the missing fare. She died before the loss was found.”

**Evidence:** primary 0017:181-183,432-436 dates the history in cycles,
not years. **Pros:** avoids silently converting those units. **Cons:**
loses a specific impression of elapsed time. **Recommendation:** apply
for precision; “years” is unverified, not a proved contradiction.

### Boundaries requiring no fix

- Keep Light-Bequest broad. The grandmother carrier's local closure
  (0021:245-250) and the separate carrier Tess bought (:280-286) are
  compatible with primary 0004:520,564 and 0015:286-288,467.
- Keep Aurel's earlier pitch a recollection (:239-243). No successful
  preservation/field performance is verified, and no later buyer is
  identified as Aurel.
- Keep Yenu's already-paid filament distinct from the extra transport
  input (:166-171,226-229,351-355). The donor memory does not purchase the
  material a second time.
- Keep consent specific and pressured rather than effortless: the mother
  neither replaces Yenu nor seizes the choice (:378-411), and Tess charges
  a fee (:473-475). No general legal doctrine of unpressured consent is
  inferred from this one household's decision.
- Keep correction, certification, transport, and physical frame repair
  distinct (:85,445-467,482-501). H-37 remains suspended, Lysa remains
  deceased, and the donor's spent experience does not return.
- Keep the repair local and maintained, not permanent: filament checks
  continue for months and bunks remain displaced another night (:491-494).
  The final person moving a bundle (:521-522) does not establish that
  every sleeping cell is cleared; no ending contradiction is proved.

## 8. Author decisions

These are concrete revision choices. Approval of changes is not permission
to promote the story or expand linked profiles.

| Choice | Evidence | Recommended scope, pros, cons, and alternative |
| --- | --- | --- |
| 1. Which history and H-37 account should this draft use? | C1-C3; primary 0004:298; primary 0017:558-590 | Approve F1-F3: delete the childhood Halix candidate, use verified-load-model wording, and attribute twelve cycles to traffic's estimate. Pros: reconciles the primary sources with minimal wording changes and preserves urgency. Cons: reduces one memory candidate and an aphorism. Alternative: substitute the established age-nine Solace visit and remove the time estimate altogether; it adds a mention while making the deadline less concrete. No option reopens the approved prerequisites. |
| 2. How narrowly should the rendering be stated? | 0021:340-365,407-439,477-480; lore/MEMORY_ECONOMY.md:63-68 | Approve F4 plus optional O1: one remembered spoken correction is rendered; recorded words, a new hearing, and the mother's testimony do not restore the original lived sound. Remove the hypothetical cradle-copy clause. Pros: exact retrievable scope and fewer unsupported capabilities. Cons: less broad voice-loss shorthand and no counterfactual copy. Alternative: retain O1 as explicitly hypothetical; it does not fail a hard gate, but leaves a capability suggestion for later agents to overread. |
| 3. Which local consequences and repository scope should proceed to a revised review? | 0021:445-501; primary 0017:823-828; source-first policy:14-17 | Keep the existing paid courier/cutter trip and maintained local frame repair, add F5's existing H-37 links, and apply optional O2's date narrowing. Pros: completes the civilian cost chain with no new IDs, shared events, map topology, or governing-law changes. Cons: an approved story would constrain later Yenu/Tess/Hol-Vren episodes and require separate profile claim reviews. Alternative: defer these outcomes and leave 0021 draft; no existing primary approval is undone. |

After the author chooses, implement only the selected wording, update this
report and generated artifacts, run lint/check/full CI parity, and present
the revised score and exact prose for review. Prepare a PR after the
approved changes pass. The earlier permission to merge once gates pass
does not substitute for a canon-promotion decision.

Expanded Tess/Halix claims supported by primary 0015 still await their
separate entry review. This story review does not settle that backlog.
The same source-first boundary applies to this draft's added Tess
rendering capability and the later Yenu/Hol-Vren/pod/Elior outcomes.

## 9. Method note

Only story-0021 was scored. Its full manuscript was read, and its card was
completed without opening another draft for scoring. The required full
reading covered AGENT.md, STYLE, all three mechanics documents, PILOT_MANUAL,
the locked bible, the four governing lore documents, both theology
documents, the full structured lexicon, primary exemplars 0001/0022, the
playbook, schema quick reference, and canonical index. CLAUDE.md,
CONTRIBUTING.md, the story schema, source-first/provisional-profile
governance, all linked profiles, and the full four primary prerequisites
were also checked. H-37's new approved profile and the cartographic brief
were consulted as governing reuse context.

Two independent read-only audits checked dependencies/hygiene and
mechanics/craft. Both independently identified the first-visit, free-route,
and minimum-duration problems. The independent mechanics score matched
the final 50/70. Every scored deduction has source evidence above.
No prior score or continuity note was accepted as a finding without
checking current prose.

Automated impact results were supplemented with searches for the seven
characters, H-37, the pod, and lexicon source/first-appearance fields.
No new reusable term lacking an entry was identified: volunteer rendering
is existing lore terminology, and local filament/frame work already has
the approved pod profile. No new named major character, faction, or
unplaced regional site needs allocation. Ordinary unnamed family/workshop
figures remain local.

At this checkpoint the only tracked deliverable added is this new report.
All manuscripts and metadata, profiles, lexicon, shared timeline, lore,
mechanics, map placement, and generated graph files remain unchanged.
The report is the only file to commit and push for this review checkpoint.
Its five relative Markdown links resolve, and git diff --check passes.


## 10. Author-approved revision and readiness assessment

### Approval and implementation

The author replied **“Approve all three revision scopes.”** This authorizes
the recommended changes in section 8, including O1's removal of unused copy
speculation and O2's date narrowing. It does not authorize promotion.
Current main was fetched again at 8ba40df; npm ci and the full baseline
validate:ci passed before editing. The existing report-only commit ed94b08
is preserved.

Only story-0021's approved passages, summaries, relevant references/event
metadata, word count, and modification timestamp change. The applied
prose matches section 7's proposals. This table cites the revised
manuscript; sections 1-9 retain their original snapshot citations.

| Scope | Applied result and revised evidence |
| --- | --- |
| F1: first Halix visit | The childhood Halix candidate is deleted; the meal and shuttle-latch candidates remain (:313-316). No replacement childhood biography or new cameo is added. Primary 0004:298 remains unchanged. |
| F2: certification | Pilots can no longer be offered the old load model as verified (:159-162), consistent with primary 0017:558-564. Ordinary memory expenditure remains necessary. |
| F3: recertification | Twelve cycles is traffic's estimate; Hol-Vren cannot count on earlier clearance (:168-169). H-37 stays suspended (:469), with no guaranteed minimum or completed recertification. |
| F4: selected sound | Both summaries (:11-12) and the return-trip search (:479-482) specify the remembered sound of the correction. The assay selects one exchange (:343-358), facts remain accessible (:423-426), and the ending does not return the rendered sound (:519-521). |
| F5: chart reuse | loc-0016 is added to both location lists (:26,52) and event-story-0021-001's involved entities (:88). No new entity or ID is allocated. |
| O1: copy speculation | Yenu declines to hear the correction from the unused stone (:440-441); no copying capability is asserted for Tess's cradle. The returned-stone consent choice remains (:364-374). |
| O2: death date | Hol-Vren says Lysa died before the loss was found (:166). No cycle/year conversion is introduced. |

The fourth event's causal note is synchronized with F4 (:108). Its old
wording said the grandfather's voice remained unavailable; it now says:

> Physical repair and collective recitation hold the sleeping corridor; Yenu's remembered sound of her grandfather's correction remains unavailable.

This is the same approved narrowing as the summaries and return-trip
sentence, not an additional story outcome. No event ID, timestamp,
summary, or tier changes. Metadata now records **2674 words**, modification
time **2026-10-30T00:19:07.066Z**, and the unchanged creation date.
Summary lengths are **140/576 characters**.

### Fresh per-story card

#### story-0021 — Receipt for a Voice

Current tier: draft / draft / metadata.status draft; active_draft

Hard gates: PASS (narrative, dependency, and final CI parity)

Depends on: primary stories 0004, 0015, 0017, 0013, 0001

Depended on by: no story; existing Elior and Canticle Fleet profile links,
plus six appearance candidates, as in the original impact report

What it establishes: This revised draft keeps the specific civilian cost
of H-37's suspension: Yenu renders one remembered spoken correction to
enable the delivery of already-purchased repair filament. A paid courier
and cutter trip bring it to Halix; supervised material work and shared
recitation hold this pod's corner. H-37 remains suspended, Lysa stays
deceased, and neither Yenu's surrendered sound nor Elior's earlier burned
smell returns.

| Criterion | Score | Weight | Points | Evidence in revised 0021 and governing sources |
| --- | --- | --- | --- | --- |
| A Metaphysical fidelity | 5 | 3 | 15 | Existing volunteer rendering (lore/MEMORY_ECONOMY.md:63-68) produces a bounded, permanent experiential loss (:343-368,410-426). The courier pays ordinary tax (:447-450); the cutter spends ordinary stocks plus the donated correction under continuing attention (:452-469), consistent with mechanics/CORRIDOR_MECHANICS.md:78-98. Filament, two watches of labor, and recitation repair the local frame (:484-496), following primary 0004:224-230. The unused copy-capability implication is removed (:440-441); no new law or refunded cost remains. |
| B Bible compliance | 5 | 3 | 15 | Bible citations remain (:123-126). The grandfather's selected sound is absent after extraction (:423-426) and at the ending (:519-521); the grandmother voice (:437-438) is a distinct retained experience. Elior's pre/post counts remain eleven (:452-469), preserving primary 0013:427-482. No locked crew, Heliodrome, or Lattice Gap outcome changes. |
| C Tonal fidelity | 4 | 2 | 8 | The corner's meaning/orientation failure (:143-148), the mother's restraint (:381-408), and substituted cadences (:479-482) earn the cost without spectacle. Consent and manifest explanation still stack (:364-368,410-414,447-456); this remains below the exemplars' most compressed embodied scenes. No tonal blocker requires more prose edits. |
| D Craft and structure | 4 | 2 | 8 | Need, financial limit, chosen rendering, irreversible absence, and maintained shelter form a complete chain (:159-206,276-297,313-426,447-524). The flight/audit and repair remain compressed through Yenu's viewpoint (:447-496), an effective bridge rather than the exemplars' strongest fully staged action. The paid cost and changed ending remain intact. |
| E Cross-canon coherence | 5 | 2 | 10 | The incompatible childhood Halix visit is gone (:313-316 versus primary 0004:298). The certificate and timing now preserve primary 0017:558-590 (:159-169). The specific selected sound and retained facts match the established sensory-loss distinction in primary 0013:360-368,450-482; no contradictory outcome or draft story prerequisite remains. |
| F Repository hygiene | 5 | 1 | 5 | Contract, story/event draft tiers, citations, structured events, and accurate summaries/count exist (:4,8-12,81-109,123-132). Existing loc-0016 is linked in both location lists and the relevant event (:26,52,88). The generated graph includes the deduplicated causal/appearance edge; all four event IDs remain local. |
| G Canon value | 4 | 1 | 4 | Certification's disclosed cost reaches a living household (:159-206,410-426), while the maintenance record names both Lysa and Yenu (:498-503). The local repair remains subject to ongoing checks (:493-496). This supplies usable consequences without locking universal pod design, rendering precision, or recertification law. |
| **Total** | | | **65/70** | |

Recommendation: **Promote band; ready for a separate promotion decision.**
There are no remaining editorial blockers or required prose fixes.
An independent full-manuscript review reached the same 65/70 score.
This is a readiness recommendation; the author has not authorized a tier
change.

### Hard gates and preserved boundaries

- Bible red lines PASS: no anchor, donor experience, death, or collapse is
  reversed. The revised story still distinguishes new testimony from the
  original lived sound (:364-368,479-482,514-521).
- New-law gate PASS: living-memory rendering uses existing lore; fresh
  stocks and present attention pay the trip; material upkeep and shared
  recitation hold this local frame (:447-496).
- Novel/novella dependency gate PASS: the five prerequisites are primary,
  with no event-level or longer-work dependency added (:61-66).
- CI gate PASS: full validate:ci completed after generated artifacts were staged.
- All story/event statuses remain draft; all four 0021 events remain
  local. The ten 0004, five 0015, and five 0017 events remain local too.
- H-37 is the existing chart artifact; no coordinates, surveyed route
  shape, reopening, or date relative to the Tessarine breach is added.
- The grandmother's carrier and the different family's carrier remain
  separate local closure cases. No donor content is recovered from either.
  Aurel's promises remain unverified, and no Synod booth claim is expanded.
- No character/location profile, lexicon term, governing mechanics/lore,
  shared timeline, map placement, or other manuscript changes. Separate
  Tess/Halix claim reviews and any later 0021 profile expansions remain
  outside this revision.

### Generated artifacts, validation, and PR

npm run linkmap:build regenerated all three graph artifacts. Only
REFERENCE_MAP.json and docs/link_map/LINK_MAP.md changed; CANONICAL_INDEX.md
is byte-identical because no entity or tier changed. The graph contains
**175 entities, 807 relationships, zero orphaned targets**. Its one new
deduplicated relationship is story-0021 to loc-0016 through both appearance
and causal reference fields.

npm run lint and npm run check pass. Continuity and timeline reports have
zero hard failures and zero soft warnings. The fresh impact report still
finds two direct profile dependents, no transitive dependents, and six
appearance candidates. Independent implementation QA confirms the exact
approved scope, unchanged protected sources, correct event tiers and IDs,
summary/count limits, and one-edge generated diff. git diff --check passes.
The complete final npm run validate:ci passes, including map data, viewer,
and render tests. Report links resolve and git diff --check passes. Remote
PR checks and merge results are recorded on the PR; they do not authorize
promotion.

During PR #55 verification, main advanced to 5c0deba (PR #54's nautical
atlas renderer). That merge is included without rewriting unrelated work.
No manuscript, profile, governing canon source, or cartographic claim
supporting this review changed; the brief's new lane/eddy rules explicitly
describe illustrative rendering. npm ci and the complete validate:ci suite
passed again on the combined tree, including the newly added map chart
tests. Existing warning counts remain 21 schema advisories, 976 glossary
candidates, and the two draft red-line warnings. The PR diff against main
still contains only the four revision paths listed below; the revised body
fingerprint is unchanged.

The reviewed revision's body SHA-256 (gray-matter content, including its
existing surrounding whitespace) is:

~~~text
252fb25c02beb89f934a5569534866ed4cbc76609b9a1328daeabc08a345fe2a
~~~

Only the story, this review, and the two changed generated files are
included in the revision commit. CANONICAL_INDEX.md was regenerated but
has no diff. There is no manuscript status/tier promotion or profile edit.


## 11. Author-approved promotion to primary canon

### Authorization and source

The author replied **“Promote it”** after the revised story's PR #55 merged
as 6e4eb69c7d81d633402e8013031548bf1da30cd0. That separately approves the
reviewed 65/70 story for primary canon. It does not approve expanded
character/location profiles or lexicon definitions.

Current main was fetched at 6e4eb69 before work on
canon/story-0021-promotion. npm ci and baseline npm run validate:ci pass.
All five declared story prerequisites resolve to primary canon: 0004,
0015, 0017, 0013, and 0001. There is no event-level, draft-story, novel, or
novella prerequisite.

### Applied promotion

The promotion tool was previewed with --dry-run, then applied. The
manuscript now has:

- canon_tier: primary_canon
- status and metadata.status: canonical
- retrieval_role: authoritative
- All four events[].canon_tier values: primary_canon
- metadata.modified: 2026-10-30T07:45:59.787Z

The manuscript's source-status continuity notes now describe approved local
rendering and repair outcomes and retain the separate profile-review rule.
Original frontmatter formatting was retained after verifying that the
promotion tool's parsed data was unchanged. The body after the closing
frontmatter delimiter is byte-identical to the approved revision at
6e4eb69, including its surrounding whitespace. Its SHA-256 remains:

~~~text
252fb25c02beb89f934a5569534866ed4cbc76609b9a1328daeabc08a345fe2a
~~~

The word count remains 2674 and the summaries remain 140/576 characters.
No prose, summary, event ID, timestamp, event summary, causal note, or
involved-entity list changes during promotion.

The four event IDs remain local to this manuscript. No entry is added to
data/timeline/events.yaml. The ten 0004, five 0015, and five 0017 event IDs
also remain local. The impact report still finds two direct profile
dependents, no transitive dependents, and six appearance candidates; no
other approved story currently needs an individual 0021 event.

### Source labels and independent profile review

Current source-tier labels are updated in Yenu, Hol-Vren, Tess, Aurel,
Skather-Ait pod, and Halix Exchange. Their existing continuation notes now
identify 0021 as an approved primary source and explicitly retain separate
review of additions to each profile's authoritative baseline. Halix's
still-draft 0003/0019 proposals remain in the unapproved section. Hol-Vren's
additional-training claims remain subject to review; supervised help in
the story is not a completed training qualification.

All six profiles retain their existing statuses, summaries, invariants,
appearance lists, and causal-reference lists. Only source-review wording,
related headings/watchlists, and modification dates change. No profile
tier or capability expansion is automatically approved. Aurel's mention
still establishes no new activity or verified technical performance.
Additional Tess/Halix claims supported by 0015 remain pending too.

The stories/README.md row now agrees with primary/canonical frontmatter.
docs/STORY_OPPORTUNITIES.md relabels the story's approved source tier and
corrects its H-37 description to suspended certification: 0021 does not
show a corridor learning a new route (approved revision:159-169,469).
Historical review findings in sections 1-10 and all other review reports
are preserved.

### Scope and validation record

The change includes only:

- stories/short_story/receipt_for_a_voice/manuscript.md
- characters/Yenu_Skather-Ait.md, Hol-Vren.md, Tess_Vlin.md, Aurel_Ket.md
- atlas/Skather-Ait_Pod.md and Halix_Exchange.md
- stories/README.md and docs/STORY_OPPORTUNITIES.md
- This review and the three generated graph artifacts

No shared timeline, lexicon, governing bible/mechanics/manual/lore, map
placement, other manuscript, or tooling changes. H-37 remains suspended;
the repair is local to the pod. Donor experience and burned anchors remain
lost. No universal Light-Bequest closure, ownership/gravity rule, or pod
design is added.

All three graph artifacts were regenerated. The graph remains **175
entities, 807 relationships, zero orphaned targets**; story-0021 now
resolves as primary/authoritative at weight 110. Only its retrieval
authority changes; no graph relationship is added. Independent promotion
QA confirms byte-identical prose, correct tiers and local event IDs,
unchanged profile baselines, and the preserved scope.

npm run lint and npm run check pass; continuity and timeline contain zero
hard failures and zero soft warnings. npm run test:validate-work passes.
Final npm run validate:ci passes after the promotion commit, exercising
all included test suites and the map data/viewer/render/chart tests.
Existing nonblocking advisories remain 21 schema warnings, 976 glossary
candidates, and the two draft red-line warnings for stories 0005 and 0007.

The local browser attempt using Debian Chromium 154 reported one resource
404 in the first atlas test; the remaining browser assertions passed.
Playwright's pinned Chromium 153 is not installed, and its CDN download
is blocked by this environment's network policy (HTTP 403, Domain
forbidden). No test or map code is changed to accommodate that fallback.
The required GitHub browser jobs use the pinned browser and must pass
before merging. Local CI parity passes; remote results and the final merge
record are available on the promotion PR.
