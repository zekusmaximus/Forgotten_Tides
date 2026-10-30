# Expanded Profile Claim Review: Stories 0015 and 0021

**Current checkpoint:** October 30, 2026. **All five scopes approved by the
author; implementation and gates are recorded in section 11.** This review
defines additions to five already-canonical entries: Yenu
Skather-Ait, Hol-Vren, Tess Vlin, the Skather-Ait pod, and Halix Exchange.
It includes the separately pending Tess/Halix claims from approved
story-0015. The original review findings and exact proposals below are
preserved; the approval applies only to these five expansions.

## 1. Scope, evidence, and baseline

Evidence uses fetched main **49ec83d22890411050f7e34d5235708d379c3b5e**,
including story-0021's primary promotion. The review branch is
docs/reviews/story-0021-expanded-claims. The worktree was clean; npm ci
and npm run validate:ci pass. The graph contains 175 entities, 807 edges,
and zero orphaned targets. Continuity and timeline reports each have zero
hard failures and zero soft warnings. Existing nonblocking output remains
21 schema warnings, 976 glossary candidates, and red-line citation
warnings for drafts 0005 and 0007.

Citation keys throughout this report refer to the current approved files:

- **S4:** stories/short_story/the_light_inheritance/manuscript.md.
- **S15:** stories/short_story/the_halix_aftermarket/manuscript.md.
- **S21:** stories/short_story/receipt_for_a_voice/manuscript.md.
- **S22:** stories/short_story/spend_what_you_can_afford/manuscript.md.

The [source-first policy](../governance/source_first_approvals.md), lines 14-17,
requires separate claim review after story approval. Its lines 33-35
require explicit author approval for a defined entry scope. Existing
canonical status and approved story references do not approve every
additional profile claim. These five entries retain their current status;
only the exact deltas below are proposed.

The settled [story-0004 profile approvals](STORY_0004_REVIEW_2026_10_28.md),
[story-0015 promotion](CANON_PROMOTION_REVIEW_2026-10-29.md),
[story-0017 promotion](STORY_0017_CANON_PROMOTION_REVIEW_2026_10_29.md),
[Corin/Lysa/H-37 approvals](STORY_0017_PROFILE_CLAIM_REVIEW_2026_10_29.md),
and [story-0021 review/promotion](STORY_0021_CANON_PROMOTION_REVIEW_2026_10_30.md)
supply workflow context. Their current checkpoints/final decision records
govern; historical draft findings are not reopened as unresolved blockers.
Current primary prose supplies the evidence for each proposed addition.

## 2. Review result and shared boundaries

| Entry | Existing status | Proposed decision | Short/long summary characters |
| --- | --- | --- | --- |
| Yenu, char-0026 | canonical | Approve bounded rendering, paid delivery, supervised work, ledger | 142 / 1191 |
| Hol-Vren, char-0027 | canonical | Approve internal relocation, two-watch retuning, observed corrections, ledger | 160 / 1061 |
| Tess, char-0019 | canonical | Approve particular purchase/withdrawal and consented rendering episodes | 135 / 1117 |
| Pod, loc-0015 | canonical | Approve local maintained repair and narrowed internal relocation | 104 / 1122 |
| Halix, loc-0013 | canonical | Approve local trading/release facilities and depicted rendering/transport | 118 / 944 |

These are claim dispositions, not fiction-rubric scores. All five
summary_50 values and existing story-0004 baseline invariants/body remain.
The full summary_200 proposals below preserve baseline wording, adding
only an explicit story-0004 closing time cue where needed and the approved
later episode. No earlier unpaid repair is retroactively paid.

- Yenu renders one remembered spoken correction. Facts and her
  grandmother's voice remain; the original lived sound does not return
  (S21:354-368,423-438,479-482,514-521).
- Filament material, cutting, and ordinary passage were already paid.
  Her stone supplies extra release-end input; ordinary courier/cutter
  costs remain (S21:229-232,447-469). No all-invoices-paid result follows.
- Twelve people move from closed sleeping cells to workshop bunks.
  Whole-deck closure remains conditional; whole-pod evacuation is not
  shown (S21:143-148,193-194).
- The corner holds after two watches of work and shared recitation.
  Filament checks continue for months; complete reopening and permanent
  pod-wide stabilization are not reported (S21:484-496,523-524).
- Light-Bequest remains broad; S4/S15 are particular closed-carrier cases.
  S15 buyer attention, payment, and withdrawal return no donor content or
  usable fuel to that carrier (S4:520,564; S15:286-288,467,775-782).
- H-37 remains suspended (S21:469). This frame repair neither recertifies
  that route nor restores Lysa's spent anchor.

## 3. Dependencies and contradiction checks

Impact reports were run with --include-mentions for each entry. Counts
separate direct causal dependents from additional indexed appearances:

| Entry | Direct dependents | Additional mentions | Transitive |
| --- | --- | --- | --- |
| char-0026 | 4: char-0027, char-0031, loc-0015, story-0021 | 4: char-0019, loc-0013, stories 0004/0015 | 0 |
| char-0027 | 3: char-0026, loc-0015, story-0021 | 1: story-0004 | 0 |
| char-0019 | 5: char-0026, char-0031, loc-0013, stories 0015/0021 | 1: story-0004 | 0 |
| loc-0015 | 3: char-0026, char-0027, story-0021 | 2: loc-0013, story-0004 | 0 |
| loc-0013 | 6: char-0019, char-0026, char-0031, loc-0015, stories 0015/0021 | 2: stories 0004/0022 | 0 |

All newly proposed story dependencies point to primary sources. The
profile cross-links do not establish claims by circular approval:
S21 directly supplies the later rendering, transport, and repair. The
earlier primary stories remain supported by the unchanged baseline.

No primary contradiction requires changing an approved source. Three
profile shorthand corrections matter: Yenu's stone supplies extra input
rather than purchasing the filament; the pod's “later evacuation” means
internal relocation; additional training means observed supervised work.
Earlier unpaid-state sentences remain true at S4's ending.

Manual lexicon canonical_source/related_terms searches find no entry
depending on these five IDs. Existing term-0021 mentions Yenu's local
carrier within the broad category; its approved definition stays unchanged.
Draft story-0003's hospice/Synod-stock assertions and story-0019's offstage
repair-record claims remain unapproved provenance.

Elior's related profile was checked; no additional proposal is made for
him in this batch. His eleven-anchor counts remain consistent with
approved stories 0013, 0022, and 0021. His later null-cargo run's cost is
unfiled (S22:871-877,903-905); this review neither dates that run relative
to S21 nor makes its cost free. Aurel, Corin, Lysa, and H-37 receive no
additional profile scope. Aurel's technical promises and alleged Synod
booth remain unverified; S15's later buyer is a different person.

## 4. Yenu Skather-Ait — char-0026

File: characters/Yenu_Skather-Ait.md. Keep the approved short summary,
five baseline invariants, baseline body, and Editorial guidance unchanged.

| Claim | Evidence | Disposition and tradeoff |
| --- | --- | --- |
| Specific voluntary rendering after assay | S21:304-311,320-338,343-374,410-426 | Approve this choice. Pro: exact agency/cost; con: longer biography. No general doctrine that household pressure is absent. |
| Lived sound lost; facts and grandmother voice retained | S21:354-368,423-438,479-482,514-521 | Approve narrowly. Pro: precise continuity; con: broader voice-loss shorthand is excluded. Do not invent other grandfather-voice episodes. |
| Additional transport input, already-purchased filament | S21:155-174,229-232,447-469 | Replace “fund a transport correction” with the specified extra release-end input. Pro: separates money/material from input; con: technical wording. |
| Return unused stone if canceled; decline playback | S21:364-376,440-443 | Approve in body. Pro: continuing agency; con: procedural detail. No copy/restoration is established. |
| Practical work and signed maintenance record | S21:479-505 | Approve actual tasks. Pro: contribution beyond donation; con: no completed training credential follows. |

### Exact summary_200

> Yenu Skather-Ait is sixteen at the opening of story-0004, an apprentice and runner in Hol-Vren's miniaturization shop on the Skather-Ait pod in the Helios Drift outer sleeve. With the pod's frame overdue for repair, she takes her grandmother's missed-generation Light-Bequest to Tess Vlin for an assay. She declines Aurel Ket's offer but returns with a private sale still possible. She then chooses to hear the stone beside her grandfather; that particular carrier closes. After his natural death, she releases it and carries his corrected account to her mother. The pod's repair remains unpaid at the close of story-0004. In story-0021, Yenu renders her remembered sound of one correction spoken by her grandfather after an assay and specific consent at Tess's bench. The filament and ordinary passage were already paid; the stone supplies the alternate cutter's extra release-end input alongside ordinary stocks. She retains the conversation's facts and her grandmother's voice; the rendered sound does not return. She brings the filament home, helps Hol-Vren retune the frame under his corrections, and signs its maintenance slate. The corner holds, with further filament checks required.

The final baseline sentence gains “at the close of story-0004”; the
remaining approved baseline wording is retained.

### Exact invariant additions and watchlist

Append these four entries after the five existing invariants:

~~~yaml
    - In story-0021, Yenu consents after assay to render her remembered sound of one correction spoken by her grandfather as a specified extra release-end input for the alternate cutter.
    - She retains the conversation's facts and her grandmother's voice; the rendered sound is absent after extraction and does not return through the later hearing of her mother's account.
    - Her donor stone supplies additional transport input for already-purchased filament; the cutter also spends ordinary drive stocks, and consumption does not charge her the memory a second time.
    - She brings the delivered filament home, feeds it into the frame while Hol-Vren retunes it, and signs the maintenance slate recording the cost; this does not establish completed tuner or drive-hand training.
~~~

Replace the complete watchlist with the following; its second entry is
the current approved guardrail retained verbatim:

~~~yaml
  watchlist:
    - Track the absence of the rendered spoken correction in later appearances; do not expand it to all memories of her grandfather's voice or invent which other episodes survive.
    - Preserve her chosen hearing and corrected recitation under financial and family pressure; distinguish that choice from the later depicted rendering and do not substitute a coerced memory sale or miraculous recovery.
    - Keep the story-0004 hearing and release distinct from story-0021's personal rendering; neither the mother's later account nor a recorded description restores the original lived sound.
    - Helping with the frame establishes supervised practical work, not completed training; later qualifications require separately approved evidence.
~~~

### Exact continuation replacement

Replace “Source-approved continuation pending profile review” and its
paragraph with this heading and body. Leave the preceding baseline and
following Editorial guidance intact.

> ## Continuation: Receipt for a Voice
>
> In primary *Receipt for a Voice*, H-37's suspended certification delays the
> booked transport of the pod's already-purchased filament. Yenu goes to Tess
> Vlin at Halix. After an assay, she consents to render her remembered sound
> of her grandfather's correction, retaining the conversation's facts and
> her grandmother's voice. She chooses return of the unused stone if the
> route is canceled, then declines to hear it before dispatch.
>
> Elior Ren's cutter consumes her stone for the additional release-end
> correction alongside ordinary drive stocks. The filament reaches Halix;
> Yenu brings the crate home on the tether cup. She feeds filament into the
> frame while Hol-Vren retunes it and corrects her work, then signs the
> maintenance slate recording material, labor, route, and donor stone. The
> corner holds, with further filament checks required. Her mother's later
> telling supplies a different voice and further testimony; the rendered
> sound does not return.

### Exact structured links


~~~yaml
cross_refs:
  characters: [char-0027, char-0019, char-0031, char-0017]
  locations: [loc-0015, loc-0013, loc-0008, loc-0016]
  factions: [fact-0004]
  mechanics: [mech-0001, mech-0002]
  stories: [story-0004, story-0021]
references:
  characters: [char-0027, char-0019, char-0017]
  locations: [loc-0015, loc-0013, loc-0016]
  factions: []
  mechanics: [mech-0001, mech-0002]
  stories: [story-0004, story-0021]
~~~

Elior and H-37 are named/causal in the added biography; mech-0002 supports
the described transport. Aurel remains an appearance link, not an added
causal prerequisite. No need to copy all of S21's prerequisites or add
Corin/Lysa when the proposed text does not name them.

**Recommendation:** approve this defined expansion, retaining canonical
status. Benefit: exact experiential cost and practical contribution become
retrievable. Cost: future appearances must preserve the specific absence
and cannot assume completed qualifications or permanent repair.

## 5. Hol-Vren — char-0027

File: characters/Hol-Vren.md. Keep the short summary, four existing
invariants, baseline body, and Editorial guidance unchanged.

| Claim | Evidence | Disposition and tradeoff |
| --- | --- | --- |
| Sleeping-cell closure and twelve people moved to workshop bunks | S21:143-148 | Approve internal relocation. Pro: exact protective action; con: excludes larger evacuation. |
| Five-cycle whole-deck closure | S21:193-194,404 | Keep conditional. Pro: preserves deadline; con: no completed closure may be asserted. |
| Paid filament delayed by certification | S21:155-174,229-232 | Approve this logistical problem. Pro: identifies the actual added cost; con: no settled total account follows. |
| Retuning and two corrections to Yenu's work | S21:484-496 | Approve actual supervised work. Pro: records maintained success; con: no universal repair method or completed training. |
| Maintenance ledger and Lysa margin | S21:498-505 | Approve exact entries and signature. Pro: accountable cost; con: neither recertification nor payment of every charge is shown. |

### Exact summary_200

> Hol-Vren runs the miniaturization shop on the Skather-Ait pod, where Yenu serves as a runner in story-0004. He has stretched the overdue coherence-frame's service life for two seasons using calculations and temporary braces. He measures a worsening corner against a wax mark, moves the two youngest into the galley, and braces the sleeping-cell wall. He taught Yenu at eleven not to touch softening walls. Filament replacement and retuning remain unpaid at the close of story-0004; recitation firms a galley soft place fractionally without removing his brace. In story-0021, he closes the sleeping cells and moves twelve people to workshop bunks. After alternate delivery of the already-purchased filament, he retunes the frame over two watches while Yenu feeds it and the elder and Yenu's mother recite. He twice corrects a connection Yenu set too tight. The corner holds, with months of filament checks required. His maintenance slate records material, labor, route, and donor stone, with H-37's suspension and Lysa Korr's corrected loss record in the margin.

The earlier ending is explicitly dated to the close of story-0004.

### Exact invariant additions and watchlist

Append after the existing four invariants:

~~~yaml
    - In story-0021, he closes the sleeping cells and moves twelve people to bunks in the workshop; his threatened whole-deck closure remains conditional on continued slipping.
    - He retunes the frame over two watches using delivered filament while Yenu feeds it and the pod elder and Yenu's mother recite rooms and names.
    - He stops twice to correct a connection Yenu set too tight; this is evidence of supervised assistance, not completed tuner, drive-hand, or frame-work training.
    - His maintenance slate records filament, labor, corrected route, and donor stone; his margin names H-37's suspension following correction to Lysa Korr's loss record, and Yenu signs.
~~~

Replace the complete watchlist; the existing complementary-work guardrail
is retained as its second entry:

~~~yaml
  watchlist:
    - Later appearances must retain the repaired corner's maintenance needs; story-0021 reports months of filament checks, not permanent stabilization or clearance of every sleeping cell.
    - Keep recitation and structural work complementary; neither supplies free, permanent stabilization, and Skather-Ait's design does not establish a rule for other pods.
    - Do not promote the two practical corrections into completed training or credentials for Yenu without separate approved evidence.
    - Distinguish an internal move to workshop bunks from whole-pod evacuation, and a conditional whole-deck closure from an event that occurred.
~~~

### Exact continuation replacement

Replace “Source-approved continuation pending profile review” and its
paragraph with the following. Keep the surrounding baseline and guidance.

> ## Continuation: Receipt for a Voice
>
> In primary *Receipt for a Voice*, Hol-Vren closes the sleeping cells and
> moves twelve people to workshop bunks. The filament's material, cutting,
> and ordinary corridor passage have been paid, but H-37's suspended
> certification delays the booked shipment. His threat to close the whole
> deck after five cycles is conditional on the frame continuing to slip.
>
> Once the filament reaches the pod, he retunes the frame over two watches.
> Yenu feeds filament while the elder recites the rooms and Yenu's mother
> carries the sleeping-cell names down the corridor. Hol-Vren stops twice
> to correct a connection Yenu set too tight. This is supervised work, not
> evidence of completed training. The corner holds, but the filament needs
> checking for months.
>
> He gives Yenu the maintenance slate to sign. It lists the filament,
> labor, corrected route, and donor stone; in the margin he names H-37's
> suspension following correction to Lysa Korr's loss record. The ledger
> records the cost rather than establishing that every charge has been paid.

### Exact structured links

~~~yaml
cross_refs:
  characters: [char-0026, char-0022]
  locations: [loc-0015, loc-0008, loc-0016]
  factions: [fact-0004]
  mechanics: [mech-0001]
  stories: [story-0004, story-0021]
references:
  characters: [char-0026]
  locations: [loc-0015, loc-0016]
  factions: []
  mechanics: [mech-0001]
  stories: [story-0004, story-0021]
~~~

Lysa is a documentary appearance in the new margin description, not an
added direct causal biography dependency. The chart and S21 supply the
needed route state. Preserve the existing regional/Clade context and
Yenu/pod causal links. No training entity or shared event is needed.

**Recommendation:** approve the closure, actual work, and ledger within
these limits. Benefit: records the approved continuation accurately.
Cost: does not establish full qualifications, settled accounts, complete
clearance, or permanent stabilization.

## 6. Tess Vlin — char-0019

File: characters/Tess_Vlin.md. This includes both the pending S15
purchase/withdrawal claims and S21's later rendering. Keep the short
summary, five baseline invariants, first three body paragraphs, and
Editorial guidance unchanged.

| Claim | Evidence | Disposition and tradeoff |
| --- | --- | --- |
| Another family's carrier assessed closed | S15:235-258,269-288,467 | Approve ring findings plus hearing-date/witness-mark check. Pro: auditable local assessment; con: no universal closure or silence-only test. |
| Authorized purchase with disclosed withdrawal/release | S15:553-557,611-612,657-678 | Approve particular terms and seller's ability to refuse. Pro: agency/custody exact; con: no general obligation to buy or universal provenance-rights law. |
| Purchase and separate financial withdrawal charge | S15:596-612,678,737-752 | Approve both costs. Pro: grounds later inability; con: no anchor debit, permanent bankruptcy, or gravity switch. |
| Case/slip return and ordinary release | S15:611-612,796-800,825-884 | Approve; do not say all provenance is destroyed. Pro: distinguishes carrier from family record; con: no metaphysical disposal mechanism. |
| Notices/message and later fare refusal | S15:888-892; S21:276-289 | Approve receipt and this inability to advance fare. Pro: useful consequence; con: no completed sanctions, bench loss, or exact remaining balance. |
| Tender/manifest and bounded rendering | S21:198,229-264,304-368,410-426 | Approve this shown work after specific consent. Pro: source-backed capability instance; con: no universal precision, Fleet command, licence, therapy, or copying. |
| Facts retained, sound lost, invoiced fee | S21:423-441,447-477 | Approve case and fee. Pro: cost remains; con: no collection amount or restored finances is established. |
| Named post-rendering witness | S21:455-456 | Defer Tess identification. Pro: retains anonymous evidence accurately; con: does not assign a convenient role the source never names. |
| Local market-attention response | S15:356-370,775-782 | Supported but omitted from minimal expansion. Pro: avoids extra generalization; con: leaves a source-observed detail outside the authoritative summary/invariants. No restored donor payload follows. |

### Exact summary_200

> Tess Vlin is a middle-aged, mid-gravity broker-tuner with a fourth-deck bench in Halix Exchange's inheritance quarter in the Helios Drift. The Skather-Ait elder recommends her commercial honesty. In story-0004 she checks Yenu's understanding before assaying her grandmother's stone, exposes its two registers without completing its intended hearing, and acknowledges that she does not know what that hearing will do. She values it at twelve to fourteen cycles of the pod's pooled wages, conditional on finding a buyer. She challenges Aurel Ket's intrusion into the valuation and later offers to approach private buyers while Yenu retains the stone. In story-0015 she assesses another family's carrier as closed, buys, withdraws, and releases it at financial and professional cost. In story-0021 she cannot advance the pod's extra fare after that expense; after assay and recorded consent she renders Yenu's remembered sound of one correction into a transport stone, preserving the facts while the lived sound is lost. Her fee remains on the invoice. These are particular cases, not general closure or rendering rules.

Existing baseline sentences remain verbatim; the continuation appends.

### Exact invariant additions and watchlist

Append after the current five invariants:

~~~yaml
    - In story-0015 her ring assay and hearing-date/witness-mark check support her assessment of another family's particular carrier as closed; it contains no usable donor memory.
    - She buys that carrier under the courier's written authority and agreed terms, withdraws it with a separate financial charge against her renewal bond, and releases it; complaints, a procedural review, and a Consortium message follow.
    - In story-0021 she cannot advance the extra transport fare sought by Yenu after that purchase and withdrawal expense.
    - In story-0021 she assays and, after recorded consent, renders Yenu's remembered sound of one correction spoken by her grandfather into a stone for the cutter's extra release correction; the facts remain, that lived sound is lost, and her fee is on the invoice.
~~~

Replace the complete watchlist; its first three entries are unchanged:

~~~yaml
  watchlist:
    - Avoid making Tess saintly; her credibility depends on being honest in Halix's hard commercial sense.
    - Do not let her invent new Light-Bequest doctrine or override Drift Clade inheritance practice outside her own bench.
    - Keep her conflicts grounded in price, provenance, and custody rather than heroic rescue.
    - Stories 0004 and 0015 establish particular closed-carrier cases, not a general closure rule for Light-Bequests or missed-generation stones; silence alone does not settle an assay.
    - Story-0021 demonstrates one bounded rendering; do not infer universal extraction precision, copying, memory restoration, therapy, or licensed technical authority.
    - Track the renewal-bond cost and inability to advance this particular fare without inferring permanent bankruptcy, lost bench rights, completed sanctions, or a duty to purchase every completed carrier.
~~~

### Exact continuation replacement

Replace “Continuations and review scope” and both pending paragraphs with
the following sections. Preserve the preceding baseline and following
Editorial guidance.

> ## The Halix Aftermarket
>
> In primary *The Halix Aftermarket* (story-0015), Tess assesses another
> family's particular missed-generation carrier as closed, checking her ring
> findings against the hearing date and witness mark. It has no usable donor
> memory, but buyers value its carrier and provenance. The courier has his
> aunt's written authority to choose a buyer and agree terms for the carrier
> and its record. Tess discloses her intended withdrawal and release, and he
> may refuse her lower offer. He accepts; she buys without commission while
> his aunt keeps the case and original witness slip.
>
> Tess enters no lot and pays a withdrawal charge against her financial
> renewal bond, separate from the purchase. She releases the carrier through
> Halix's outer lock. Three complaint notices, a procedural review, and a
> Consortium office message await her afterward. When asked what she would
> do if another completed carrier reached her, she says she would have to
> decide again.
>
> ## Receipt for a Voice
>
> In primary *Receipt for a Voice* (story-0021), Tess cannot advance the extra
> transport fare sought by Yenu after her earlier purchase and withdrawal
> expense. She shows the alternate cutter's manifest and required additional
> memory input. Tess distinguishes Yenu's consent from making the stone and
> requires the decision after assay. The assay identifies the remembered
> sound of one correction spoken by Yenu's grandfather. Tess calls its
> boundary an assessment, not a promise about how loss will feel.
>
> Tess records Yenu's choice to receive the unused stone back if the route is
> canceled. She reads the specific experience, assay limits, intended route
> use, and permanent loss aloud. Yenu corrects the wording and signs; Tess
> renders the stone. The facts and her grandmother's voice remain, while the
> selected lived sound is lost. Tess shows Yenu the courier's ordinary-tax
> entry and later reads the cutter's completed audit. Her fee remains on the
> invoice.

### Exact causal references

Keep all cross_refs unchanged. Replace the causal block with:

~~~yaml
references:
  characters: []
  locations: [loc-0013]
  factions: []
  mechanics: [mech-0001]
  stories: [story-0004, story-0015, story-0021]
~~~

The two newly causal stories directly support the added biography. Keep
characters/factions as context where currently designated; do not turn
every associated profile into a dependency.

**Recommendation:** approve this particular-case expansion. Benefit:
purchase, financial/professional cost, and exact consented rendering become
retrievable. Cost: a longer profile and commitments for future Tess
appearances, with sanctions, credentials, general performance, and later
finances still open.

## 7. Skather-Ait pod — loc-0015

File: atlas/Skather-Ait_Pod.md. Keep the short summary, approved baseline
body, location_type, region/coordinates, map placement, and canonical status.

| Claim | Evidence | Disposition and tradeoff |
| --- | --- | --- |
| “Later evacuation” | S21:143-148 | Narrow to closed sleeping cells and twelve residents moved inside. Pro: precise hazard response; con: removes overbroad shorthand. |
| Filament delay and extra transport input | S21:155-174,229-232,447-469 | Approve paid cost chain. Pro: retrievable logistical consequence; con: no H-37 physical failure, fixed reopening date, or free ordinary transport. |
| Two-watch retuning and tested corner | S21:484-496 | Approve demonstrated maintained result. Pro: records successful work; con: no complete/permanent pod-wide certification. |
| Complete reopening or all residents returned | S21:493-496,523-524 | Defer those inferences. Pro: preserves uncertain operational end state; con: location profile cannot supply a full clearance. |
| Cost ledger and local design | S4:224; S21:498-505 | Approve exact record while retaining local scope. Pro: useful continuity; con: no new ledger power, faction-wide design, or regional density measurement. |

### Exact summary_200

> The Skather-Ait pod is Yenu's small Drift Clade habitat moored in the Helios Drift outer sleeve, linked to Halix Exchange by a six-hour tether shuttle. Its local coherence-frame is a low-resonant mesh of tuned filaments threaded with shared recitations. In story-0004, the overdue frame develops worsening soft places, and Hol-Vren uses calculations and temporary braces to extend service. The frame still needs filament replacement and retuning at the close of story-0004; recitation's fractional effect does not complete that repair. In story-0021, Hol-Vren closes the sleeping cells and moves twelve people to workshop bunks. H-37's suspension delays transport of already-purchased filament. Yenu's rendered memory supplies an alternate cutter's extra release-end input alongside ordinary stocks. Hol-Vren retunes the frame over two watches while Yenu feeds filament and the elder and Yenu's mother recite rooms and names. The corner holds, but the filament needs checking for months; full reopening is not reported. A maintenance slate records the material, labor, route, donor stone, and reason for H-37's suspension.

The ending cue becomes “at the close of story-0004” before the appended
later result. The old unpaid repair is not retconned.

### Exact body replacement and continuity limits

Replace “Source-approved continuation pending profile review” and its
paragraph with the following sections; keep the earlier baseline body.

> ## Continuation: Receipt for a Voice
>
> In primary *Receipt for a Voice*, a corner outside the sleeping cells
> loses its orientation. Hol-Vren closes the cells and moves twelve people
> to bunks in the workshop. This is an internal relocation, not evacuation
> of the whole pod.
>
> The filament's material, cutting, and ordinary passage have been paid,
> but H-37's suspended certification delays its booked transport. A new
> stone rendered from Yenu's remembered sound of her grandfather's correction
> supplies an alternate cutter's additional release-end input alongside
> ordinary drive stocks. The closed grandmother carrier is not reused.
>
> Hol-Vren retunes the frame over two watches while Yenu feeds filament,
> the elder recites the rooms, and Yenu's mother carries the sleeping-cell
> names down the corridor. The corner holds when Yenu checks it from both
> approaches. The maintenance slate names the filament, labor, corrected
> route, donor stone, and reason for H-37's suspension; Yenu signs it.
>
> ## Maintenance and continuity limits
>
> Filament checks remain necessary for months. The account does not report
> complete clearance of every sleeping cell: people in workshop bunks can
> wait another night, while the final scene shows one person starting home
> with a bundle. The corner's maintained repair establishes neither
> permanent pod-wide stabilization nor a design rule for other Drift Clade
> habitats. H-37's certification remains suspended; repairing this frame
> does not recertify that route or return Yenu's rendered sound.

Location frontmatter has no continuity object and rejects additional
properties (docs/schemas/location.schema.json:182). Add no character-style
invariants/watchlist fields. The explicit body section carries these limits.

### Exact structured links

~~~yaml
cross_refs:
  characters: [char-0026, char-0027]
  locations: [loc-0013, loc-0008, loc-0016]
  factions: [fact-0004]
  mechanics: [mech-0001, mech-0002]
  stories: [story-0004, story-0021]
references:
  characters: [char-0026, char-0027]
  locations: [loc-0013, loc-0008, loc-0016]
  factions: []
  mechanics: [mech-0001, mech-0002]
  stories: [story-0004, story-0021]
~~~

The added chart, transport mechanic, and source story support the new
local state. Preserve existing character lists: the proposed location text
does not name Tess, Elior, Corin, or Lysa. Preserve Drift Clades as context,
not approval of every faction practice.

**Recommendation:** approve the narrowed later state. Benefit: records
the known repair without falsifying the earlier ending. Cost: full
reopening, permanent stability, and universal habitat-design claims remain
unestablished.

## 8. Halix Exchange — loc-0013

File: atlas/Halix_Exchange.md. Keep the short summary, existing body through
“During the Tessarine breach,” ship classification, coordinates/map
placement, and canonical status. Keep the final “Unapproved setting
proposals” section and its draft-0003/0019 paragraphs unchanged.

| Claim | Evidence | Disposition and tradeoff |
| --- | --- | --- |
| Existing ship/quarter, seller-understanding rule, rumor | S4:292-310,336-348,352,380,384-386 | Preserve approved baseline. Pro: no reopened source decisions; con: no universal hearing-before-price rule or confirmed Synod booth. |
| Existing two-deck recitation report | S22:603-610 | Preserve attribution. Pro: source precision; con: no destroyed-deck count, new density, or breach date relative to Yenu's visit. |
| Apology stalls, rented niches, fourth-deck trading mesh | S15:212,318-343,827-828 | Approve observed local facilities/system. Pro: reusable setting; con: no new institution or universal accommodation policy. |
| Entry seal, financial withdrawal charge, notices | S15:537,659,737-752,888-892 | Approve depicted procedures and receipt. Pro: coherent commercial detail; con: no general legal authority, anchor debit, or completed discipline. |
| Private devotional collecting | S15:339,397-398 | Approve offer only. Pro: preserves market interest; con: cabinet location or completed sale is not established. |
| Clerk, outer lock, release cup and confirmation | S15:827-884 | Approve shown facility/procedure. Pro: clear physical release; con: no new fuel, donor content, or universal disposal rule. |
| Tender, bounded rendering, paid courier/cutter arrival | S21:198,260-264,304-368,410-426,447-469 | Approve this episode. Pro: retrievable use of bench and local arrival; con: no route geometry, universal precision, licensing, restoration, or Fleet traffic control. |
| Witness confirmation and fee | S21:455-456,471-477 | Approve record/fee without identifying witness or general tariff. Pro: exact costs and consent; con: no new office or price schedule. |
| Local attention response | S15:356-370,775-782 | Supported but not required in location summary. Pro: avoids unnecessary generalization; con: source-observed detail remains outside proposed baseline expansion. |

### Exact summary_200

> Halix Exchange is a four-kilometer bazaar-ship moored in the Helios Drift outer sleeve, with banners in seven languages, tuning booths, and a shuttle dock. Its quieter fourth-deck inheritance quarter houses Tess Vlin's bench. In story-0004, Tess assays Yenu's family stone and gives a conditional valuation, while Aurel makes a separate acquisition offer. Halix benches require sellers to understand what they are selling. Tess's warning about a nearby Synod front remains an unverified rumor. During the Tessarine breach in story-0022, Halix reports two decks on full recitation. Story-0015 shows the fourth-deck trading mesh, a financial withdrawal charge against Tess's renewal bond, an offer for a private cabinet, and an outer-lock release chamber used for a spent carrier. In story-0021, Tess renders Yenu's remembered sound of one correction with consent for extra transport input; the cutter's filament crate arrives at the Halix relay.

The existing baseline sentences remain; the setting observations append.

### Exact body expansion and limits

Replace only “Source-approved setting pending profile review” and its two
paragraphs with these sections:

> ## Trading and withdrawal
>
> In *The Halix Aftermarket* (story-0015), Tess's bench sends lot type,
> status, restrictions, and provisional value through the fourth-deck
> trading mesh. Inquiries follow the classification. A buyer offers to
> acquire a spent carrier for a private devotional cabinet; the story does
> not locate that cabinet aboard Halix.
>
> Tess purchases this particular carrier under the seller's agreed terms,
> then records it as no lot and seals the entry. The counter charges her
> financial renewal bond for withdrawal, separately from her purchase
> payment. She later receives complaint notices, a procedural review, and
> a Consortium request for a future conversation. No outcome of that review
> or loss of her bench is established.
>
> ## Small-object release
>
> Story-0015 shows apology-incense stalls and rented sleeping niches on the
> way to an outer lock staffed by a maintenance clerk. Its release chamber
> has a cup behind an inner grate. The mechanism checks mass and requests
> Tess's thumb confirmation before opening the outer seal; ship air carries
> the purchased spent carrier away. This is the depicted Halix facility,
> distinct from Yenu's earlier release port on the pod.
>
> ## Later rendering and transport
>
> In *Receipt for a Voice* (story-0021), Tess has the alternate cutter's
> tender and shows its manifest at her bench. She assays and, after Yenu's
> consent, renders the remembered sound of one correction spoken by Yenu's
> grandfather. The facts remain accessible while that lived sound is lost.
> A new hearing of the stone would not restore the original experience.
>
> The outbound courier's manifest names the voluntary rendering and one
> specified use, and records its own route tax. The cutter's donor entry
> records a post-rendering consent confirmation by a witness at Halix.
> The cutter delivers the filament crate to the Halix relay, spending
> ordinary drive stocks and the additional donor stone. Tess reads its
> audit and invoices her fee. These are the observed arrangements of this
> episode, not a general Halix transport tariff or control of Fleet traffic.
>
> ## Editorial limits
>
> The closed carriers in stories 0004 and 0015 are particular cases; neither
> establishes a universal Light-Bequest closure rule. In story-0015, buyer
> attention, payment, and withdrawal return no donor content or usable fuel
> to that carrier.
> The one rendering at Tess's bench establishes no general extraction
> precision, copying capability, restorative treatment, or professional
> license. The local trading and release procedures do not become universal
> memory-economy or corridor laws.

As with the pod, add no continuity object to location frontmatter. Keep
explicit guardrails in the quoted Editorial limits body section.

### Exact causal references

Keep cross_refs unchanged. Proposed causal block:

~~~yaml
references:
  characters: [char-0019]
  locations: [loc-0008]
  factions: []
  mechanics: [mech-0001]
  stories: [story-0004, story-0015, story-0021, story-0022]
~~~

The new story links support the added local facts. Keep existing
character/region/mechanic categories; do not copy every participant or
faction prerequisite from the source stories. The proposed body adds no
new named person or site requiring allocation.

**Recommendation:** approve this defined expansion. Benefit: market,
release, rendering, and transport scenes become retrievable while draft
stock claims remain isolated. Cost: a longer location entry and commitments
to these local procedures, without approval of full linked profiles or
universal memory-economy rules.

## 9. Five independent author choices

| Choice | Recommended approval | Alternative and cost |
| --- | --- | --- |
| 1. Yenu | Section 4's exact summary append, added invariants, replacement watchlist/body, and links | Defer; retain the current canonical S4 baseline and pending continuation. The later cost/practical work remain available only through the approved story. |
| 2. Hol-Vren | Section 5's exact expansion, with internal relocation and observed corrections | Defer all or omit a specific claim; no completed training or full reopening may be inferred. |
| 3. Tess | Section 6's particular S15 transaction and S21 rendering/cost expansion | Defer either episode separately. Her existing S4 baseline stays canonical; no general precision or legal authority is approved. |
| 4. Pod | Section 7's narrowed later local state and body continuity limits | Defer; retain the earlier baseline and pending source note rather than assert a completed universal/permanent repair. |
| 5. Halix | Section 8's depicted local facilities, procedures, rendering/transport, and limits | Defer either S15 or S21 additions; keep the current approved ship/quarter/breach baseline. |

An approval may select or exclude individual proposed lines. Do not infer
approval of the other four entries, fiction revisions, or new global laws
from one selected entry. No status promotion is proposed: all five are
already canonical within their approved baselines.

## 10. Method, implementation boundary, and validation

Current sources and all five complete profiles were read and checked
against their existing invariants, watchlists, and isolated pending notes.
Full approved stories were read in the preceding reviews and checked at
this current main; changed S21 passages were verified in their promoted
form. Governing mechanics, memory economy, structured lexicon, schemas,
source-first governance, and the final prior approvals were consulted.
Independent audits covered the Yenu/Hol/pod and Tess/Halix groups; their
proposals were combined with direct impact and manual mention searches.

Each proposed delta has primary evidence and exact wording; summaries meet
220/1200 limits. All five proposed frontmatters were assembled in memory
and pass their character/location schemas, preserving baseline invariants.
All 11 YAML fences parse, all six Markdown links resolve, and the diff
passes whitespace checks. No new ID, term, shared event, physics value, placement,
route geometry, or status is needed. All 0004/0015/0017/0021 events remain
local. Manuscript prose, source tiers, governing rules, and other profiles
receive no proposed change.

After explicit author approval, apply only the selected scopes, preserve
unselected baseline claims, refresh each changed profile's modified date
while preserving created dates, update this decision record, and regenerate
the three maps/index files. Run relevant lint/check/full CI parity and
prepare a PR. The earlier permission to merge after gates pass does not
replace the separate claim approval required by source-first governance.

At the original review checkpoint, only this report was added; manuscripts,
profiles, statuses, lexicon, shared timeline, mechanics/lore, map placement,
and generated files were unchanged. The review was committed and pushed
as bfde4c99bf015a340d5b46867e839f06fdc1f215 on the branch named in
section 1. The author subsequently approved all five exact scopes.

## 11. Author decision and implementation

On October 30, 2026, the author instructed: **“Approve all five.”** This
approves the five defined scopes in sections 4-8, including their exact
wording, guardrails, and structured links. It authorizes no manuscript
revision, new physical rule, profile status change, or additional entry.

Implementation branch: canon/profiles/story-0021-expanded-claims, based on
current main 49ec83d22890411050f7e34d5235708d379c3b5e plus the preserved
review commit. All five exact scopes are implemented and local gates pass.

| Entry | Author decision | Implementation scope |
| --- | --- | --- |
| Yenu, char-0026 | Approved | Section 4: bounded rendering/loss, paid transport contribution, supervised work, ledger, and links |
| Hol-Vren, char-0027 | Approved | Section 5: internal relocation, actual retuning/corrections, ledger, and links |
| Tess, char-0019 | Approved | Section 6: particular S15 purchase/withdrawal and S21 rendering/cost episodes |
| Pod, loc-0015 | Approved | Section 7: narrowed maintained repair, internal relocation, body continuity limits, and links |
| Halix, loc-0013 | Approved | Section 8: depicted local trading/release and rendering/transport arrangements |

The summaries, invariant additions, replacement watchlists, continuation
bodies, and structured links match the approved sections 4-8 exactly.
All short summaries, baseline invariants/body, created dates, canonical
statuses, location types/coordinates, and unselected claims are preserved.
Only each changed profile's modified date is refreshed. The Halix draft
0003/0019 setting proposals remain isolated and unapproved.

The three generated artifacts were rebuilt: REFERENCE_MAP.json and
docs/link_map/LINK_MAP.md changed; CANONICAL_INDEX.md is unchanged. The
resulting graph contains **175 entities, 814 edges, and zero orphaned
targets**. No new entity, term, event, physics rule, placement, or status
was introduced. Every manuscript, governing source, lexicon, shared
timeline, and map placement file is unchanged from the fetched main.
Story-0021's body SHA256 remains
252fb25c02beb89f934a5569534866ed4cbc76609b9a1328daeabc08a345fe2a.

Validation after implementation:

- npm ci: PASS.
- Exact approved-proposal and protected-baseline comparisons: PASS.
- Character/location schemas, summary limits, YAML/Markdown links, and
  whitespace checks: PASS.
- npm run validate:ci: PASS, including lint, continuity/timeline, policy,
  promotion, coverage, tooling, and map data/viewer/render/chart checks.
- Continuity/timeline: zero hard failures and zero soft warnings.
- Existing nonblocking output: 21 schema warnings, 976 glossary candidates,
  and two draft red-line warnings (0005/0007).

The PR and hosted gate results will be recorded here after the branch is
pushed. Pinned-browser validation runs in GitHub CI; the local full CI-parity
command does not include those browser jobs.
