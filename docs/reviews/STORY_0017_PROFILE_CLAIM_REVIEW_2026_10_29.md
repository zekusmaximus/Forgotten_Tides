# Story-0017 Linked-Profile Claim Review

**Current decision:** On October 29, 2026, the author approved all three
defined scopes below. The approved corrections and reference cleanup are
applied; Corin Tave, Lysa Korr, and H-37 now have
`metadata.status: canonical`. Section 7 records implementation and
verification. Sections 1-6 preserve the pre-approval claim review at
`65c77d9`; their proposed dispositions are now settled within these scopes.

## 1. Scope, authority, and baseline

**Recommendation:** Approve a narrowed story-0017 scope for Corin Tave and
Lysa Korr, and approve the existing H-37 chart profile as written. Each
requires its own explicit author decision before changing
`metadata.status: speculative` to `canonical`. This report applies no
profile edit or status change.

Reviewed October 29, 2026, from fetched main
`65c77d9f30efbc97dff9a000550c7180d7640909` on
`docs/reviews/story-0017-profile-claims`. The workspace was clean. Main
includes story-0017's approved revision and promotion in PRs #50/#51, plus
PR #49's newer atlas tooling. No unrelated work was changed.

`npm ci` and `npm run validate:ci` pass, including the new map-data tests.
The graph has 175 entities, 808 relationships, and zero orphaned targets.
Continuity and timeline reports have zero hard failures and zero soft
warnings. Existing advisories remain 21 schema warnings, 976 glossary
candidates, and two nonblocking draft red-line warnings for stories 0005
and 0007. These checks verify repository integrity, not approval of prose
claims. `report:canon-tiers` and the canonical index confirm story-0017 is
primary/canonical/authoritative, while all three reviewed profiles remain
speculative (`CANONICAL_INDEX.md:269,360-361,370`).

The governing policy is
[Source-First Approval](../governance/source_first_approvals.md): story
approval opens a separate claim review and does not approve a profile
automatically. The prior story review and promotion are preserved in
[the story-0017 report](STORY_0017_CANON_PROMOTION_REVIEW_2026_10_29.md),
sections 10-11. This review does not rescore or revise the approved story.

**Citation key:** `S:line` means
`stories/short_story/the_loss_ledger/manuscript.md:line` at the baseline
commit. Profile citations identify their own file and line. All claims
below were checked against the full approved manuscript, not its summary
or continuity notes alone. The source's existing interpretation and
uncertainty are preserved.

| Entry | Current status | Proposed disposition | Required wording work |
| --- | --- | --- | --- |
| Corin Tave, char-0021 | speculative | Canonical within the defined scope below, after approval | Narrow role/career language and pending-review wording; separate interpretation from invariants; simplify provenance. |
| Lysa Korr, char-0022 | speculative | Canonical within the defined scope below, after approval | Distinguish the deleted line from surviving evidence; specify the prior voice loss; attribute reputation; keep unknowns and interpretation explicit. |
| H-37 Route Chart, loc-0016 | speculative | Canonical as written, after approval | No factual rewrite needed; retain artifact classification and local scope. |

IDs, names, schema versions, tags, and creation dates are administrative
metadata or supported indexing labels. Keep them. Existing summary lengths
are valid: Corin 92/426 characters, Lysa 105/463, H-37 140/500, against
220/1200 limits. Any approved summary replacement below must be checked
again during implementation. Update modification dates only when applying
approved changes.

## 2. Corin Tave — proposed approval scope

File: `characters/Corin_Tave.md`.

| Current claim or field | Evidence | Disposition |
| --- | --- | --- |
| Name, Canticle affiliation, records-clerk work, Loss Ledger duties, Helios Drift setting (`:5-12,46,64-65`; tags) | S:157-181,198-201,277-287,479,738-796,902-904 | Approve. Ledger keeper describes the shown work; it establishes no unique chief office or wider administrative rank. |
| Surviving calibration records reveal Lysa's omitted burn beneath H-37's clean summary (`:12,47,79-80`) | S:203-225,254-258,338-415,705-718 | Approve documentary evidence. The table does not extract a lived memory or diagnose a universal burn contour. |
| Corin signs the correction and clean certification withdraws pending recertification (`:12,48,80-82`) | S:738-807,902-904 | Approve, with the Archivist witness retained. This does not give Corin command of ships or establish successful recertification. |
| Traffic used by thousands is disrupted (`:12,81-82`) | S:163-165,262-266,823-839,883-888 | Approve. Passenger holds, cargo changes, and medical waiver choices are shown; no new fleet-wide policy beyond this episode follows. |
| Acceptance of operational disruption (`:12`) | S:577-590,622-644,783-794 | Approve as this decision. Corin acknowledges costs to living crews. |
| Acceptance of or being under personnel review (`:12,52`) | S:598-602 anticipates possible consequences; S:896-904 supplies the actual notice | Narrow to a personnel-slate pending-review notice at the close. No hearing, punishment, or reassignment is established. |
| “Clerical rather than command-facing” (`:65-68`) | S:483-650 shows direct confrontation with traffic leadership | Replace the contrast with the work actually performed. The story supplies a clerk's role, not a complete rank or command-service history. |
| “Specializes in reconciling … witness relays” (`:72-73`) | S:203-258,326-415,705-779 shows one audit; S:174,313-314,779,903 shows relay use | Narrow to reconciling telemetry and pilot records during this witnessed audit. Do not infer an additional career specialization in relay systems. |
| Suspicion of clean certifications and attention to inconsistencies (`:73-75`) | S:169,185-219,254-258,400-415,555-556,693-695,849-860 | Approve the demonstrated habit, without a guarantee about every future decision. |
| No anchor restoration, physical repair, or free stabilization (`:49,53,83-84,90-91`) | S:388-398,534-564,798-807,843-845,864-866,914-917 | Approve these limits. The effect is records/certification/traffic, not a new physical repair. |
| Burden rather than absolution (`:50`); restrained courage (`:54,74-75`); Narrative Function (`:86-91`) | S:622-644,783-807,864-888 | Preserve as interpretation of this story and editorial guidance. Replace the broad invariant with observed conduct; label the interpretive section explicitly. |
| Later H-37 suspension or recertification (`:55`) | S:902-904 establishes suspension only | Keep as a watchlist constraint requiring separately approved evidence for any later recertification. |

### Exact proposed summaries

Keep the short summary unchanged:

> Canticle Fleet records clerk who enters Lysa Korr's hidden anchor burn into
> the Loss Ledger.

Replace the long summary with:

> Corin Tave is a Canticle Fleet records clerk working in a Helios Drift
> records annex in story-0017. Surviving H-37 calibration records reveal
> deceased pilot Lysa Korr's undocumented anchor burn. With an Archivist
> witness, Corin signs the correction withdrawing the chart's clean
> certification. Passenger holds, cargo changes, and conditional medical
> waivers follow. Corin receives a pending-review notice on his personnel
> slate at the close; no later review outcome is established. The correction
> neither restores Lysa's burned experience nor repairs a physical corridor.

### Exact proposed corrections elsewhere

| Location | Exact current text | Exact proposed text |
| --- | --- | --- |
| `:65-68` | Corin's role is clerical rather than command-facing, but in a civilization where institutional memory carries physical and political weight, the accuracy of a record can determine who is asked to bear a cost. | Corin's work here is recordkeeping and certification. He challenges traffic leadership over H-37; the witnessed correction changes what the Fleet must disclose and route around. |
| `:72-73`, first sentence | Corin specializes in reconciling route charts, pilot loss records, and Archivist witness relays. | In story-0017, Corin reconciles route-chart telemetry and pilot loss records during an Archivist witness review. |
| Invariant `:50` | Treats accurate institutional memory as a burden the Fleet must carry, not as absolution | In story-0017, enters the hidden expenditure while acknowledging that rerouting imposes additional costs on living crews |
| Watchlist `:52` | Future appearances should account for Corin being under personnel review after the H-37 correction | Story-0017 ends with a pending-review notice on Corin's personnel slate; any later hearing, reassignment, or outcome requires separately approved evidence |
| Watchlist `:53` | Do not make Corin's ledger entry retroactively save ships or repair the corridor; it changes policy, routing, and institutional memory | Do not treat Corin's entry as retroactively saving ships or repairing a corridor; its shown effects are correction of the loss record, suspension, and traffic triage |
| Watchlist `:55` | If H-37 appears again, its status should reflect suspension or later recertification under corrected anchor-tax assumptions | H-37's clean certification is suspended at story-0017's close; any later recertification requires separately approved evidence |
| Heading `:86` | Narrative Function | Editorial Interpretation and Guidance |

Under the renamed heading, add:

> The following interprets Corin's role in story-0017; it adds no further
> biography or general rule of memory physics.

Retain the existing interpretive paragraph beneath it. Retain the remaining
invariants and watchlist, including the restraint guidance, as scoped above.
Also move the sentence at `:74-75`, **Their strength is not dramatic courage
but procedural refusal: they keep reading after a form has tried to become
convenient.**, from Operational Profile into the renamed editorial section,
unchanged. Leave the demonstrated suspicion of clean certifications and
attention to inconsistencies in Operational Profile.

**Proposed status after approval:** `metadata.status: canonical`. Use
story-0017 as the direct biographical source, with structured links as
specified in section 5. No additional later-draft biography is proposed.

**Pros:** Keeps the demonstrated work, courage, and costly correction;
prevents career/rank inference and an anticipated sanction becoming fact.
**Cons:** Gives a narrower professional biography and a less definitive
account of the review. **Recommendation:** approve this defined scope and
the exact corrections, then change status.

## 3. Lysa Korr — proposed approval scope

File: `characters/Lysa_Korr.md`.

| Current claim or field | Evidence | Disposition |
| --- | --- | --- |
| Deceased Canticle charting pilot in the Helios Drift (`:5-12,46-47,64-65`; tags) | S:235,330-334,432-436 | Approve. She is dead before Corin's audit, not a live or recoverable presence. |
| Hidden personal expenditure during H-37 confirmation and a reliquary-only clean summary (`:11-12,47-48,73-75`) | S:181-183,212-219,254-258,338-385,558-564 | Approve. If specifying the run, it is the second confirmation run. No claim that the entire physical crossing runs on that expenditure afterward is approved. |
| Corin discovers and records the omission after her death; clean certification is withdrawn (`:12,83-87`) | S:235,432-436,738-807,902-904 | Approve the record/certification consequence, not repair or completed recertification. |
| “Clean corridors in difficult places” and exactness rather than ceremony (`:65-67`) | S:320-324 is an Archivist's statement; S:664-689 gives actual addenda | Attribute the reputation to that witness; describe precision in the surviving addenda instead of certifying a universal reputation. |
| Prior mild sensory losses (`:71-72`) | S:664-677 | Approve three recorded mild sensory burns. |
| “Moderate vocational loss” (`:72`) | S:683-686 says the instructor's voice-knot is gone while name/vocation survive | Narrow to that lost voice-knot. Do not imply the vocation or name disappeared, or that the burned knot partly survived. |
| No recorded forbidden exposure or zero-anchoring (`:73`) | S:330-334 | Approve as what her file records, not an independently verified lifetime negative. |
| Additional burn “was excised from the source record” (`:74-75`) | S:362-385 retains declaration and result; S:364,378-390 identifies the missing line; S:705-712 dates its edit | Correct: one intervening transcript line is excised; surviving instruments and records still establish expenditure. |
| “Never entered … during her life” (`:75`) | S:223-225,400-412,438-441,758-775 | Narrow to its being unlogged when Corin reviews it. The surviving incomplete records do not establish every earlier state of the ledger. |
| Contents unknown; documentary description does not restore burned experience (`:12,48-49,77-79`) | S:388-398,758-762,864-866; `mechanics/CORRIDOR_MECHANICS.md:150-151` | Approve. The story finds no description; it does not establish universal destruction of external records or testimony. |
| No ghost, active consciousness, or recoverable memory in chart (`:49-50,83-85`) | S:217-219,548-560 | Approve. Surviving calibration is evidence, not Lysa herself or renewed fuel. |
| Correction does not “help Lysa directly” (`:87`) | S:447-451 is the Archivist's distinction; S:843-845,864-866 confirms concrete limits | Replace the value judgment with death and experiential loss remaining unchanged. |
| Watchlist and Narrative Function (`:51-55,89-93`) | S:699-703,758-775,864-888 | Preserve as explicit editorial guidance. Resolving unknown contents in a future story still requires separate approval; restoration remains prohibited. |

### Exact proposed summaries

Keep both existing summaries unchanged. Their approved scope is the
following text, without importing later events:

> Deceased Canticle charting pilot whose undocumented anchor burn was hidden
> by H-37's clean certification.

> Lysa Korr is a deceased Canticle Fleet charting pilot first documented in
> story-0017. Surviving calibration records show her undocumented personal
> anchor burn during H-37's confirmation; its summary recorded reliquary
> input alone. Corin Tave discovers the omission after her death, enters the
> loss into the Loss Ledger, and invalidates the chart pending
> recertification. The spent experience remains lost, and its contents remain
> unknown in the surviving records.

“Hidden” describes the omission in the certification, not proof that Lysa
herself falsified it. Her consent and the editor's identity remain unknown
(S:417-423,709-712,773-775).

### Exact proposed corrections elsewhere

Replace `:64-67` with:

> Lysa Korr was a Canticle Fleet charting pilot in the Helios Drift. The
> Archivist witness knows her through records and says she “charted clean
> corridors in dirty places.” Her surviving personal addenda describe prior
> anchor losses precisely.

Replace the paragraph at `:71-75` with:

> Before the H-37 discrepancy, Lysa's file records three mild sensory burns
> and a moderate loss of her first instructor's voice-knot; other memories
> still hold her name and vocation. It records no forbidden-anchor exposure
> or zero-anchoring. During H-37's second confirmation run she spends another
> personal anchor. One transcript line between her declared correction and
> its recorded result was manually excised, but surviving telemetry and
> records still establish the expenditure. The loss had not been entered in
> the Loss Ledger when Corin reviewed it.

At `:85-87`, replace the sentence beginning **Corin's correction gives** with:

> Corin's correction gives the Fleet an accurate institutional record of her
> expenditure and invalidates the clean chart certification. Neither the
> correction nor the surviving evidence restores her burned experience or
> changes her death.

Rename **Narrative Function** at `:89` to **Editorial Interpretation and
Guidance**, and add before its existing paragraph:

> The following interprets Lysa's role in story-0017; it adds no further
> biography or general rule of memory physics.

Retain the other invariants and watchlist unchanged. The profile does not
currently need new numeric invariants to approve its existing scope. Any
later expansion must preserve these source distinctions:

- The file records fifteen initial knots and four documented losses;
  Corin reconstructs eleven before H-37 and ten afterward. The death-run
  count of nine is merely listed and explicitly untrusted (S:330-334,405-436).
- Lysa dies on a different corridor two cycles after H-37 certification.
  The source does not establish that the H-37 burn caused her death
  (S:432-436), or who made the record alteration (S:709-712).
- No identification of the unknown spent contents is approved by this
  review. The surviving declaration **Basic tier** (S:362) is not grounds
  to replace Corin's final **exact tier unknown** (S:758) with a firmer
  classification in the profile.

**Proposed status after approval:** `metadata.status: canonical`, with the
summaries, invariants, watchlist, and corrected body limited to the above.

**Pros:** Preserves the documented sacrifice and remaining evidence while
preventing a deleted line, lost vocation, known culprit, or death mechanism
from being inferred. **Cons:** Keeps attribution and several consequential
unknowns explicit; trims general reputation language. **Recommendation:**
approve this defined scope and exact corrections, then change status.

## 4. H-37 Route Chart — proposed approval as written

File: `atlas/H_37_Route_Chart.md`.

| Current claim or field | Evidence | Disposition |
| --- | --- | --- |
| Name H-37, Canticle chart, internal Helios Drift crossing (`:5,12-13,52`) | S:159-183,248-250 | Approve. `loc-0016` identifies the chart artifact, not a permanent physical tunnel or a separately mapped celestial site. |
| `location_type: artifact` (`:6`) | S:159-160 describes the black-glass chart on the table | Approve. Location schema explicitly permits artifact. No regional coordinates or endpoint placement is asserted. |
| Surviving calibration evidence of Lysa's personal expenditure during confirmation (`:13,53-54`) | S:203-225,254-258,338-415 | Approve documentary evidence, not a residue diagnostic or recoverable anchor. |
| Corin's witnessed loss entry withdraws clean certification (`:12-13,54-55`) | S:738-807 | Approve. H-37's chart authority changes while the physical corridor remains unchanged. |
| Passenger holds; cargo delays/rerouting (`:13,55-56`) | S:577-582,823-824,883-888 | Approve these local consequences. The delayed passenger ship departs on an alternate line. |
| Exceptional medical passage under waiver (`:13,56-57`) | S:577-582,825-828 | Approve with the source's pilot acceptance and captain decision. One captain declines; acceptance does not establish a successful medical run beyond the ending. |
| Certification remains suspended pending recertification (`:12-13,57-58`) | S:902-904 | Approve as the end state of story-0017, not a permanent future state or a completed reassessment. |
| No continuing passage powered by Lysa's spent anchor (`:13,58-59`) | S:558-564,914-917; `mechanics/CORRIDOR_MECHANICS.md:68-84` | Approve the limit: each current crossing still requires present attention and memory input. |
| Tags, participant/region/faction/mechanics/story links (`:7-43`) | S:157-181,283-314,738-807 | Retain. Links identify participants and governing context, not approval of their full profiles. |

### Exact approved candidate text

Retain the short and long summaries at `:12-13`, and the body at `:52-59`,
without factual rewrite. The body defines the approval scope:

> H-37 is a Canticle route chart for an internal Helios Drift crossing. In
> story-0017, Corin Tave finds recorded evidence of Lysa Korr's undocumented
> personal anchor expenditure during its confirmation. His witnessed loss
> entry withdraws the chart's clean certification. Ordinary passenger use is
> held, cargo is delayed or rerouted, and exceptional medical passage is
> considered under waiver. The story closes with certification suspended
> pending recertification. It establishes neither a completed reassessment
> nor a route sustained by Lysa's spent anchor without new input.

**Proposed status after approval:** `metadata.status: canonical`; no other
semantic field change is needed. This approves no endpoints, fixed route
shape, memory-density measurement, guaranteed recertification duration,
filament delivery, or post-story reopening. The supervisor's **at least
twelve cycles** is an estimate challenged by Corin's **Maybe less**
(S:512-516,588-590), not a locked minimum.

The newer map tooling exempts artifact entries from spatial-placement
coverage (`scripts/lint/cartography_lint.js:177-181`). This profile's
approval therefore requires no invented `cartography.yaml` placement or
new map geometry. A later proposal to map the crossing's endpoints would
need its own source and approval.

**Pros:** Makes the approved certification state and limits retrievable
without conflating the object, modeled crossing, or physical corridor.
**Cons:** Keeps endpoints, quantitative operating requirements, and the
future reopening outside the profile. **Recommendation:** approve the
existing scope and change status; no new story or mechanics decision.

## 5. Structured references, impact, and later-draft boundaries

Every retained claim is grounded in the approved story or governing
mechanics, not in the other speculative profiles. Their mutually linked
IDs are not circular evidence. These are three independently approvable
scopes; approving one does not approve its siblings' full contents.

Recommended structured links after approval:

| Profile | `cross_refs` | `references` |
| --- | --- | --- |
| Corin | Keep all existing appearance/context lists. | Keep Lysa; H-37; Canticle Fleet and Archivist Orders; all three mechanics. Make story-0017 the sole direct story source. Keep Helios Drift as appearance/context rather than a dependency on its wider regional profile. |
| Lysa | Keep all existing appearance/context lists. | Keep Corin; H-37; Canticle Fleet; all three mechanics. Make story-0017 the sole direct story source. Keep Helios Drift and Archivist Orders as appearance/context links. |
| H-37 | Keep all existing lists. | Keep all existing lists: Corin, Lysa, Helios Drift, Fleet, Orders, three mechanics, story-0017. |

For exact application: remove `story-0001` from the two character profiles'
`references.stories`; remove `loc-0008` from their
`references.locations`; remove `fact-0002` only from Lysa's
`references.factions`. Retain the entries in `cross_refs` wherever currently
present. The character biographies require story-0017's episode; neither
needs a distinct wider story-0001 outcome. Governing rules remain directly
linked. The H-37 artifact is defined as an internal Helios crossing, so its
region reference remains. These changes clarify causal scope without
claiming the referenced entities do not appear.

`npm run report:impact -- --id <id> --include-mentions` was run for all three
entries. Results at the baseline:

| Entry | Direct dependents | Transitive | Indexed mention candidates |
| --- | --- | --- | --- |
| char-0021 | Lysa, H-37, primary story-0017, draft story-0021 | None | None |
| char-0022 | Corin, H-37, primary story-0017, draft story-0021 | None | None |
| loc-0016 | Corin, Lysa, primary story-0017 | Draft story-0021 through story-0017 | None |

Primary story-0017's references establish the participants as depicted in
that approved story; they do not approve extra biography or every sibling
profile claim. No other primary story relies on an additional claim proposed
for removal here. These reference changes do not modify that locked story.

Manual searches also checked prose and lexicon `canonical_source`,
`first_appearance`, and `related_terms`, which the impact report does not
fully index:

- No lexicon definition or source field depends on Corin, Lysa, or H-37.
  The existing Loss Ledger duty comes from
  `manuals/PILOT_MANUAL.md:294-297`; no new lexicon term is proposed.
- Draft story-0021 names Corin/Lysa and uses the suspension, including a
  twelve-cycle recertification assertion (`receipt_for_a_voice/manuscript.md:157-174`).
  It is downstream provenance, not authority for a minimum duration or
  any new profile outcome. Its later rendering, transport, and repair stay
  unapproved; no claim from them is added here.
- Hol-Vren's approved profile isolates its later H-37/filament proposal in
  the unapproved-continuation section (`characters/Hol-Vren.md:50-59`). It
  needs no change to approve this chart's source-backed suspension.
- A maintenance worker called Corin appears in draft story-0005 and
  `characters/Kaelen.md:74`; the name lacks Tave's surname and has a different
  role. No primary evidence identifies that worker as Corin Tave. Do not
  combine those biographies or create a new alias.
- The five story-0017 event IDs remain local; these profile approvals need
  no new shared timeline entry, new ID, or manuscript edit.

## 6. Author decisions and implementation boundary

The three concrete decisions are:

1. **Corin:** approve section 2's summary, narrowed role/observed work,
   pending-review limit, scoped invariants/editorial guidance, and section
   5's reference cleanup; then set `metadata.status: canonical`.
2. **Lysa:** approve section 3's retained summaries, precise prior voice
   loss and deleted-line account, attributed reputation, permanent-loss
   limits, and section 5's reference cleanup; then set
   `metadata.status: canonical`.
3. **H-37:** approve its existing text and artifact scope in section 4,
   without placement, completed recertification, or later transport claims;
   then set `metadata.status: canonical`.

These are recommendations, not completed approvals. Deferring an entry
leaves it speculative and does not undo story-0017's primary status.
Approving the defined scopes makes their supported profiles authoritative
through the existing status-based retrieval policy; it does not approve
story-0021 or any universal certification/repair law.

After approval, apply only the chosen scopes, update profile modification
dates and this report's decision record, regenerate the three graph files,
and run the relevant gates before preparing a PR. The earlier authorization
to merge after gates pass does not substitute for the author decisions
required for these still-unapproved claim scopes.

At the original review checkpoint, only this new tracked report was added. Existing reports,
all three profiles and their statuses, manuscripts, lexicon, timeline,
mechanics/lore, map placement, and generated maps remain unchanged. The
report will be committed and pushed so the review survives the session.

## 7. Author approval, implementation, and verification

### Approval and scope applied

The author replied **“Approve”** to the completed review's recommendation
for all three defined scopes. This separately approves each profile's
reviewed claims under the source-first policy; it is not an inference from
the earlier story approval or from permission to merge after gates pass.

Current main was fetched and remains `65c77d9`, including approved primary
story-0017 and the newer atlas tooling. `npm ci` and the full baseline
`npm run validate:ci` pass before profile edits. The report-only review
commit `00abb91` is preserved on this branch.

| Entry | Applied status | Applied scope |
| --- | --- | --- |
| Corin Tave, char-0021 | canonical | The exact revised long summary and scoped invariant/watchlist, observed audit work and role, unresolved pending-review notice, and separation of interpretation from biography. The procedural-refusal sentence is moved into editorial guidance unchanged. |
| Lysa Korr, char-0022 | canonical | Existing summaries/invariants/watchlist retained; reputation attributed to the Archivist; prior voice-knot loss distinguished from surviving vocation; one deleted transcript line distinguished from surviving expenditure evidence; the correction changes neither death nor burned experience. Editorial interpretation is labeled. |
| H-37 Route Chart, loc-0016 | canonical | Existing summaries, body, artifact classification, and references approved as written. Only status and modification timestamp change. No spatial placement or later recertification is added. |

Section 5's exact reference cleanup is applied: Corin and Lysa now have
story-0017 as their sole direct story source; both keep Helios Drift as an
appearance/context link, and Lysa keeps Archivist Orders as an
appearance/context link. Other approved links remain. Modification
timestamps on all three entries record this approval; creation dates,
IDs, and names are unchanged.

The three profiles resolve to `primary_canon` and `authoritative` through
the existing metadata-status policy. The rebuilt graph contains **175
entities, 806 relationships, and zero orphaned targets**. The two removed
relationships are the redundant direct character-to-story-0001 source
edges. The regional/Orders edges remain as appearances, rather than causal
references; no appearance was deleted.

### Preserved limits

- Corin has a pending-review notice at story close; no completed hearing,
  reassignment, punishment, or rank history is established.
- Lysa's unknown spent contents, consent to alteration, editor's identity,
  unreliable final count, and death on a later, different corridor remain
  unresolved within the approved source. No new numeric invariant is added.
- H-37 remains a chart artifact. Suspension does not equal physical repair;
  recertification remains pending, with no fixed minimum duration or
  guaranteed future reopening. Existing artifact-placement exemption means
  `design/map/cartography.yaml` needs no change.
- No manuscript, event tier, shared timeline entry, lexicon, governing
  mechanics/lore, or map placement is edited. All five story-0017 event IDs
  remain local. Its approved body is unchanged.
- Story-0021 remains draft, with its rendering, transport, repair, and
  childhood Halix-visit conflict still unapproved/unresolved. Tess/Halix's
  additional story-0015 profile claims remain outside this approval.

### Validation and PR

Profile summaries remain within schema limits: Corin **92/571**, Lysa
**105/463**, H-37 **140/500** characters. The H-37 body, Lysa's summaries,
and all unchanged frontmatter fields match the approved baseline.
`npm run lint`, `npm run check`, and the complete `npm run validate:ci`
suite pass, including the newer map-data tests. Continuity and timeline
report zero hard failures and zero soft warnings. Existing nonblocking
advisories remain 21 schema warnings, 976 glossary candidates, and the two
draft red-line warnings in stories 0005 and 0007. `git diff --check` passes.

An independent final audit found no scope blocker: exact approved wording
and reference changes match this report, H-37's body is unchanged, all three
generated nodes are primary/authoritative at weight 110, and manuscripts,
data, and map placement are unchanged. The approved changes, original claim
review, decision record, and generated maps are prepared together for a PR.
The author has authorized merge once all local and remote gates pass;
remote results and the merge record are available on that PR.
