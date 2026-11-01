# Story-0007 linked-profile claim review

**Decision checkpoint: November 1, 2026. All three defined recommendations
are approved and implemented following separate author authorization.**
Section 9 preserves editorial approval; §10 records implementation and
verification. Sections 1–8 preserve the original review checkpoint and exact
proposals. No manuscript, governing source, lexicon, event or placement
changes accompany this profile implementation.

## 1. Scope, baseline and authority

Reviewed main: **548ceaa2bf7c8d056ea6ae862a6330aa419fb009** (PR #63), fetched
before work on `docs/editorial/solace-profile-claim-review`. The original
`work` branch at d9ec94d is preserved; the working tree was clean. The
[continuation prompt](../handoffs/EDITORIAL_CONTINUATION_PROMPT.md) and
[current plan](../EDITORIAL_REVISION_PLAN.md) select this review only.

`npm ci --cache /tmp/forgotten-tides-npm-cache` and full `npm run validate:ci`
passed before claim review. The temporary cache was necessary because npm's
default cache was outside writable storage. Graph: **175 entities, 816 edges,
zero orphaned targets**. Continuity/timeline: zero hard failures, zero soft
warnings. Existing advisories: 21 schema warnings, 976 glossary candidates,
one draft red-line citation warning (0005). These are baseline results, not
an approval of any proposal below.

The complete current story-0007 and all three complete profiles were read,
including every summary, invariant, watchlist and reference. All three
profiles contain frontmatter only. Story-0007 is primary/canonical; each
profile is still speculative. Its earlier 38/70 findings are resolved;
the [story review](STORY_0007_CANON_PROMOTION_REVIEW_2026_10_30.md) checkpoint
and §§10–11 record the approved 62/70 revision and promotion. This review
does not rescore that story or reopen its approved prose.

Governing reading: `AGENT.md`, `CLAUDE.md`, `CONTRIBUTING.md`, the complete
generated index, [source-first approvals](../governance/source_first_approvals.md),
[provisional profiles](../governance/provisional_profiles.md), Anchor Theory,
Memory Physics, Corridor Mechanics, Pilot Manual, the Wake bible,
Remembrancer/Fleet profiles, relevant polity/theology/region lore and the
cartographic brief. Earlier final decisions in the plan's linked 0004,
0015, 0017 and 0021 reports remain settled, including the expanded-profile
record's §11. Their historical draft labels do not override current sources.

### Evidence keys

Line references below identify the files at the reviewed main, not historical
versions. A range denotes the cited passage, not a proposed editing range.

| Key | Source |
| --- | --- |
| S | [The Hospice Knot](../../stories/short_story/the_hospice_knot/manuscript.md) |
| L | [Lira Voss](../../characters/Lira_Voss.md) |
| M | [Maren Holt](../../characters/Maren_Holt.md) |
| H | [Solace Hospice](../../atlas/Solace_Hospice.md) |
| A | [Anchor Theory](../../mechanics/ANCHOR_THEORY.md) |
| P | [Memory Physics](../../mechanics/MEMORY_PHYSICS.md) |
| C | [Corridor Mechanics](../../mechanics/CORRIDOR_MECHANICS.md) |
| PM | [Pilot Manual](../../manuals/PILOT_MANUAL.md) |
| B | [Wake bible](../../bible/ARCHIVISTS_WAKE_STORY_BIBLE.md) |
| R | [Remembrancers of Solace](../../factions/Remembrancers_of_Solace.md) |
| F | [Canticle Fleet](../../factions/Canticle_Fleet.md) |
| PL | [Polities and Factions](../../lore/POLITIES_AND_FACTIONS.md) |
| TH | [Theology of Memory](../../lore/theology/THEOLOGY_OF_MEMORY.md) |
| CB | [Cartographic brief](../../design/map/CARTOGRAPHIC_BRIEF.md) |
| S13 | [The Smallest Burn](../../stories/short_story/the_smallest_burn/manuscript.md) |
| S22 | [Spend What You Can Afford](../../stories/short_story/spend_what_you_can_afford/manuscript.md) |
| D18 | [The Navigator Who Forgot Enough](../../stories/short_story/the_navigator_who_forgot_enough/manuscript.md), draft |

Evidence classes: **primary** means an approved story, primary profile or
locked mechanics/bible; **working** means broader working lore or approved
cartographic topology; **unsupported generalization** exceeds those sources;
**later draft** is provenance only. A thematic/editorial guardrail is not a
new in-universe law. Siblings' mutually linked profiles are not independent
evidence for each other's approval.

## 2. Lira Voss — independent choice A

**Recommend approval only of the narrowed profile below**, subsequently
setting `metadata.status: canonical`. The existing entity policy then resolves
it to `primary_canon` / `authoritative`; do not add unsupported schema fields.
Defer retains the complete existing speculative profile. Approval of A
does not require approval of Maren's or Solace's full profile.

### Claim-by-claim disposition

| Current claim or field | Evidence and class | Proposed disposition |
| --- | --- | --- |
| Name, Remembrancer/hospice tags and role (L:2–9) | Primary: S:12,166,316,334 | Retain identity and tags. Replace “specializing” with the demonstrated act; no training, credential, exclusive specialty or career history is established. |
| Entire long summary (L:10) | Primary: S:168,272–290,374–390,408–464,542–566,612–616 | Retain verbatim. “Consent” is her assessment under objection, not objective freedom certified by a device. |
| Stated understanding and repeated assent; local judgment (L:37) | Primary: S:408–444,458–464,614 | Retain verbatim. The sensorium ring answers anchors (S:188,440–444); it does not certify consent. |
| “Stationed at” Solace and order association (L:38) | Primary: S:166,316,334,584–616; R:38 | Narrow to working there in this episode. No indefinite appointment or whole-order authority follows. |
| Memory physics (L:39) | Primary: P:63–84,155–160; A:64–76; B:125–140,221–224 | Retain. No anchor restoration or unlimited reserves. |
| Blanket prohibition on framing hospice rites as extraction, punishment or institutional triage (L:41) | Primary local choice: S:274–290,408–464. Working institutional context: PL:145–157. Unsupported as a universal description of every rite | Replace with a guardrail specific to Maren's release. It must not suppress the Fleet's objection or preapprove every later hospice act. |
| Chosen forgetting versus forced erasure; future patients/anchors (L:42–43) | Primary: S:354–390,424–434; working manual context: PM:75–79,364–365. Editorial rather than additional biography | Preserve the distinction with explicit local and later-source limits. |
| Nim, void crossing, weakened patient-bond, witness-device practice | Later draft: D18:54–105,449–459,469–626,905–970,1049–1094; Nim profile:43–62 | Exclude from authoritative biography, summaries and invariants. No D18 source promotion or revision is selected. |

### Exact proposed summaries and continuity

Replace only `summary_50` with:

```yaml
summary_50: Remembrancer at Solace Hospice who conducts Maren Holt's contested anchor release.
```

Keep `summary_200` exactly as currently written (L:10):

```yaml
summary_200: "In story-0007, Lira Voss assesses Maren Holt's consent to release a contested evacuation-route anchor at Solace Hospice. She proceeds despite a Canticle preservation hold, records his answers and the assessor's objection, and signs the audit under her own name. Her decision establishes neither general immunity from Fleet inquiry nor an objective test of free consent."
```

Replace the complete `continuity` block with:

```yaml
continuity:
  invariants:
    - "In story-0007, Lira requires Maren's stated understanding and repeated assent before his contested release; this is a local clinical judgment, not a universal consent test or Fleet ruling."
    - Works at Solace Hospice as a Remembrancer in story-0007.
    - Memory physics rules apply
  watchlist:
    - "Maren chooses his route-anchor release in story-0007; do not recast that episode as extraction, punishment, or institutionally ordered triage."
    - "Preserve the distinction between chosen forgetting and forced erasure while retaining the assessor's objection and the unresolved inquiry."
    - "Do not infer Fleet immunity, an objective consent detector, universal clinical precision, or a permanent cure from Lira's local judgment."
    - Later draft experiences and any future relationships to patients or released anchors require separate source and claim approval.
```

No body is added. The exact reference proposal is in §5.

**Pros:** Makes her approved act and accountability retrievable, removes an
unsupported career specialty and avoids turning the watchlist into universal
institutional doctrine. **Cons:** Leaves her qualifications, wider authority
and later experiences deliberately undefined. **Recommendation:** A, this
bounded primary profile; defer any broader biographical expansion.

## 3. Maren Holt — independent choice B

**Recommend approval of the expanded, bounded case record below**, subsequently
setting `metadata.status: canonical`, resolving to `primary_canon` /
`authoritative`. Defer retains the current speculative profile. B is
independent of A and C.

### Claim-by-claim disposition

| Current claim or omission | Evidence and class | Proposed disposition |
| --- | --- | --- |
| Name, Fleet pilot, hospice patient and anchor-release tags; short summary (M:2–10) | Primary: S:164,316–336,408–464 | Retain verbatim. Removed rank tabs do not establish a rank, dismissal or demotion. |
| Failed evacuation and contested route evidence (M:11) | Primary: S:198–232,278–286,340–354 | Retain and specify three through and six unlocated; the source counts nine pods at the first pull. Do not identify the missing pods as dead, recovered or erased. |
| Earlier self-expenditure versus the released knot | Primary: S:222–226,408,468 | Keep distinct. Earlier burned contents and original/lifetime anchor count are unnamed; the three-to-two audit is local to this rite. No zero-anchoring classification is established for his earlier flight. |
| Self-boundary erosion and chosen release (M:11,40) | Primary: S:234–270,274–290,408–464 | Approve as the depicted case under Lira's contested assessment; do not make it an independently certified absence of coercion. |
| Permanent inability to recover/testify from the anchor (M:41–42) | Primary: S:408–416,500–516,530–550,566,614; B:125–140,221–224 | Preserve with explicit distinction between lost experience and surviving spoken/written facts. It does not mean he cannot speak, learn facts or ever give any testimony. |
| Three weak anchors before, two responsive afterward (absent from current profile) | Primary: S:184–194,436–444,474–500,596–614 | Add the named teacher and mother's-voice anchors and story-close count; no lifelong minimum or future count is implied. |
| Record survives; no complete route (M:44–45) | Primary: S:452,500,530–566 | Retain and clarify. Ordinary slate/copy preserves fragments and warnings without restoring lived route experience. |
| Flight clearance and future testimony (M:45) | Primary: S:544–550,614 | State present non-clearance directly. Do not infer permanent disqualification or later clearance from this episode. |
| Agency watchlist (M:46), open inquiry | Primary: S:316,374–390,542,584–614 | Keep agency as editorial guidance; retain disputed authority and pending outcome rather than promising exoneration or sanction. |

### Exact proposed summaries and continuity

Keep the short summary verbatim:

```yaml
summary_50: Canticle pilot at Solace Hospice whose route anchor becomes contested evidence.
```

Replace the long summary with:

```yaml
summary_200: "In story-0007, Canticle pilot Maren Holt enters Solace Hospice with three weak responsive anchors after a failed evacuation. Three pods came through; six remain unlocated. His route anchor may contain testimony, but preserving it is eroding his self-boundary. Under Lira Voss's disputed consent assessment, he chooses permanent release of that one anchor despite a Fleet preservation hold. His third-teacher and mother's-voice anchors still answer. Written fragments survive without restoring the lived route or providing a complete reconstruction. He is not cleared for flight at story close; the missing pods' fate and later inquiry remain unresolved."
```

Replace the complete `continuity` block with:

```yaml
continuity:
  invariants:
    - "In story-0007, Maren voluntarily releases the contested evacuation-route anchor at Solace Hospice under Lira's disputed consent assessment."
    - "The admission audit has three weak responsive anchors; after release, the third-teacher and mother's-voice anchors remain responsive."
    - "The route anchor is permanently lost; spoken and written descriptions do not restore its lived experience."
    - "At story close, Maren cannot testify from the released anchor about the second pull and is not cleared for flight."
    - Memory physics and anchor-loss permanence apply
  watchlist:
    - "Six evacuation pods remain unlocated; do not settle their fate or reconstruct their complete route from Maren's surviving record."
    - "Retain the slate's factual fragments, warnings, answers, and copied testimony without treating them as the released experience or forbidding all later factual speech."
    - "Do not infer permanent flight disqualification, later clearance, or the outcome of Fleet inquiry from present non-clearance."
    - Preserve his agency as a patient and the retained objection; no institutional exoneration or sanction is established.
    - Do not invent earlier burned contents, an original anchor count, or a zero-anchoring classification for the evacuation.
```

No body is added. The exact reference proposal is in §5.

**Pros:** Makes the cost, surviving capacities, records and open outcomes
explicit; prevents “cannot testify” from becoming total factual silence.
**Cons:** Adds case detail to a previously brief profile and leaves later
care, inquiry and flight status open. **Recommendation:** B, with the exact
time-scoped account above.

## 4. Solace Hospice — independent choice C

**Recommend approval of the local primary case and station classification,
with separately labeled working topology**, subsequently setting
`metadata.status: canonical`. Retrieval resolves to `primary_canon` /
`authoritative`; that does not make every supporting lore/map statement
primary evidence. C does not approve A, B, the whole order or D18. Defer
retains speculative status and the already approved speculative placement.

### Claim-by-claim disposition

| Current claim or proposed detail | Evidence and class | Proposed disposition |
| --- | --- | --- |
| Proper name, hospice/Remembrancer tags (H:2–9) | Primary: S:12,44,166,316,334; R:38 | Retain identity/tags. “Solace Order” in H:10 is replaced with the established Remembrancer designation. |
| `location_type: station` (H:6) | Primary: S:578 explicitly says “station skin”; S:608 says “The station moved around them” | Retain and approve station classification. A room inside the station does not make this a planet, ship or region. |
| “Monastic” and institution-wide purpose (H:10–11) | Working context: PL:145–157, TH:98–102; primary faction R:10–11,38. No primary description of every service at this particular station | Use “Remembrancer hospice station”; keep broader mandate attributed to the order, not evidence that all its services occur here. |
| Gap outer sleeve/region (H:11,36–37) | Primary S:44,578; CB:83 Q16 | Preserve `coordinates.region: Lattice Gap outer sleeve`. No memory density, distance or new coordinate is proposed. |
| Contact with a Void Region (H:11) | Working topology: CB:22–36,51 D6,159 T18; S does not itself depict the Void contact | Move from the authoritative summary into an explicitly sourced working-topology body section. Preserve the author's placement. CB says this entity-specific topology binds canon upon entity approval; it remains working topology, not primary story evidence. |
| Local consent assessment, one release, two responsive anchors and limits (H:11) | Primary: S:408–464,500,530–566,614 | Retain in narrowed summary/body; no chosen oblivion, complete cure, restored anchor or general immunity. |
| Chamber, ledges, receiving corridor/seal, tray/slate, window, carts/robes/voices | Primary: S:162–176,332,398–406,564,578,608 | Add as witnessed facilities/practice in this episode only. No station plan, department count, capacity or universal protocol. |
| Solace care in primary 0013 and 0022 | Primary S13:516–519; S22:943–951,986–1001; Hael profile:60 | Supports broader care references only: consult offer and recommendation. Neither identifies a completed visit to loc-0010. No Hael arrival, recovery, cure or date relative to 0007. |
| Other Solace mentions | Primary 0004:172,254,364 and 0015:176,303–305,536,632–633 | Training, outstation and attributed opinions concern wider Solace; do not identify every “Solace” as this station or turn a character's expectation into policy. |
| Draft-0003 hospice | Draft 0003:12,28,76; CB:85 Q18 | Separate unnamed house in the Helios Drift. Do not merge its tuning bench, stock policy or final-day room practice into this profile. |
| Gardens, offices, north-corridor decline, locks, Nim crossing and witness stone | Later draft D18:146–169,264–269,449–459,905–970,1049–1094 | Exclude as established facilities, capabilities, protocols or history. No map rewrite or source-story selection follows. |

### Exact proposed summaries and retained fields

```yaml
summary_50: Remembrancer hospice station where Maren Holt releases one contested route anchor.
summary_200: "Solace Hospice is a Remembrancer hospice station in the Lattice Gap's outer sleeve. In story-0007, Lira Voss conducts Maren Holt's disputed release of one evacuation-route anchor despite a Fleet preservation hold. Two other anchors remain responsive; written fragments survive, but the lived route does not. Maren is not cleared for flight. This local case establishes no universal consent test, Fleet immunity, chosen oblivion, anchor restoration, or permanent cure."
```

Keep `location_type: station`, both tags and the entire existing `coordinates`
block verbatim. Keep no density field. The exact structured links are in §5.
Append the following complete body after frontmatter:

```markdown
# Solace Hospice

## Witnessed station and local practice

In primary story-0007, Solace Hospice has a chamber with low stone ledges,
a receiving corridor and a chamber seal. Lira uses a reliquary tray and an
ordinary consent slate. A high slit-window looks toward the Lattice Gap;
carts, robes and low voices accompany the station's continuing work. The
chamber inscription reads: “Spend only what you can afford. Preserve what
must endure.” These are witnessed details of this station, not a complete
facility plan or a protocol for every Remembrancer house.

Lira records Maren's understanding, warnings, answers and repeated assent,
then conducts his contested release despite the Canticle preservation hold.
The assessor's objection remains in the written audit. Maren's route anchor
is permanently lost; two other anchors remain responsive. The copied record
preserves fragments, not the lived route or a complete reconstruction.
Maren is not cleared for flight at story close. Neither the missing pods'
fate nor the later inquiry is settled. This case supplies no objective
consent detector, universal clinical precision, Fleet immunity, chosen
oblivion, restored anchors or permanent cure.

Source: stories/short_story/the_hospice_knot/manuscript.md, especially the
chamber, release audit and dawn audit.

## Approved cartographic topology — working canon

The author's cartographic brief, Q16 and T18, places Solace Hospice in the
Lattice Gap's outer sleeve at its contact with a Void Region. This is
approved topology, distinct from what the story directly depicts. Map
radius, angle, distance, shape and size remain cartographic interpretation;
no station memory density is established. The existing placement is retained.

Source: design/map/CARTOGRAPHIC_BRIEF.md, authority section and Q16/T18.

## Wider references and provisional material

The Remembrancers' general ethical-forgetting and hospice mandate is order
context. Story-0013 offers a Solace consult; story-0022 recommends Solace for
Hael. Neither shows a completed visit to this station, and Hael's transfer
has not happened on-page. The unnamed hospice in draft story-0003 is a
different house. Later draft-0018 material requires separate source and claim
approval and does not establish further facilities or procedures here.

Sources: factions/Remembrancers_of_Solace.md;
lore/POLITIES_AND_FACTIONS.md, section 6;
stories/short_story/the_smallest_burn/manuscript.md;
stories/short_story/spend_what_you_can_afford/manuscript.md;
design/map/CARTOGRAPHIC_BRIEF.md, Q18.
```

The final paragraph is an editorial provenance boundary, not an adopted
draft episode. Its consult/recommendation wording deliberately does not
name Elior or Hael as patients who attended this station.

**Pros:** Approves a directly witnessed station and useful bounded local
practice while preserving the author's topology and its separate authority.
**Cons:** Requires readers to respect mixed evidence levels within one
primary-retrieved profile. Approving the entity also makes its existing
placement eligible for the public map build under CB D7, and activates T18's
entity-specific working topology under CB §1; it is more than a label-only
change. **Recommendation:** C with these explicit limits. If that map
consequence is not wanted, defer C independently; do not silently relocate
the hospice or approve a different topology. No deployment is proposed.

## 5. Exact structured references and independent scope

Implement only the row(s) separately approved by the author. Keep all IDs,
names, schema versions, types, tags and creation dates. Refresh only the
modified date of an approved profile. No root status, explicit tier or
retrieval-role field is added: the character/location schemas do not expose
all of those fields, and existing metadata-status policy already supplies
primary retrieval for approved profiles. No new term or ID is required.

| Choice | Exact `cross_refs` change | Exact `references` change |
| --- | --- | --- |
| A, Lira | None; preserve all five existing lists. | Replace `characters: [char-0009]` with `characters: []` and `locations: [loc-0010]` with `locations: []`. Preserve factions `[fact-0001, fact-0006]`, mechanics `[mech-0003]` and stories `[story-0007]`. |
| B, Maren | None; preserve all five existing lists. | Replace `characters: [char-0008]` with `characters: []` and `locations: [loc-0010]` with `locations: []`. Preserve factions `[fact-0001, fact-0006]`, mechanics `[mech-0002, mech-0003]` and stories `[story-0007]`. |
| C, Solace | Replace `locations: []` with `locations: [loc-0003, loc-0006]`. Preserve characters `[char-0008, char-0009]`, factions `[fact-0001, fact-0006]`, mechanics `[mech-0003]` and stories `[story-0007]`. | Replace `characters: [char-0008, char-0009]` with `characters: []`; replace `locations: []` with `locations: [loc-0003, loc-0006]`. Preserve factions `[fact-0001, fact-0006]`, mechanics `[mech-0003]` and stories `[story-0007]`. |

The people/place context remains visible through appearance links. Their
approved biography/case facts depend on the primary story itself, not on
the unapproved full contents of sibling profiles. This removes copied
causal memberships without deleting appearances. Solace's new region links
support its explicit placement context and approved topology; they do not
adopt unrelated Void navigation claims. Source paths in the proposed body
carry provenance for broader context; 0013/0022 are not made causal sources
for a completed stay at loc-0010. No D18 story, Nim or shared event dependency
is added. Existing locked story/faction links remain untouched.

Broader Solace references do not establish a narrative appearance of this
particular station, so they are not added to its appearance lists merely
because its provenance paragraph distinguishes them.

## 6. Impact and manual dependency audit

All three `npm run report:impact -- --id <id> --include-mentions` commands
were run on the unchanged baseline, and their dependents inspected.

| Entry | Direct dependents | Transitive dependents | Indexed mention candidates |
| --- | --- | --- | --- |
| Lira, char-0008 | Maren, Nim, Solace, primary 0007, draft 0018 | None | Remembrancers |
| Maren, char-0009 | Lira, Solace, primary 0007 | Draft 0018 through 0007 | Fleet, Remembrancers |
| Solace, loc-0010 | Lira, Maren, Nim, primary 0007, draft 0018 | None | Fleet, Remembrancers |

- **Primary 0007:** Its character/location references establish those
  participants as depicted, not every proposed profile claim. Narrowing
  “specializing” or scoping a watchlist removes no fact it needs. No locked
  manuscript or its reference list is edited.
- **Sibling profiles:** Existing mutual causal links are not approval or
  independent corroboration. §5's per-profile removals allow approval of
  any subset without using another speculative profile as its evidence.
- **Nim and draft 0018:** Nim's full profile and D18's metadata, consent
  chamber, witness device, crossing and aftermath were inspected. Their
  later claims remain draft/speculative, including Lira's attenuated bond.
  Approval of these baseline profiles would not approve Nim, the later
  device, a repeatable crossing or D18's “consent precedent” generalization.
- **Faction sources:** F:15–57 retains appearance links to the local case
  while its broader causal sources exclude it. R:24–38 distinguishes its
  established mandate from this case. Preserve the PR #59 cleanup; no
  circular source memberships are reintroduced.
- **Non-indexed primary mentions:** S13:516–519 and S22:943–1001 were read
  in context. Hael:55–60, Inya:58, Elior:117–129 and Vault:117 reinforce the
  referral/arrival distinction. General Solace references in 0004/0015,
  the Wake character profiles and theology describe the wider order,
  training, teachings or support; none establishes extra loc-0010 history.
- **Other draft mentions:** 0003 is the separate unnamed house; the novel
  outline's memory hospice is not identified as Solace. Neither contributes
  facilities, new geography or biography to the proposals.
- **Lexicon:** Manual search of names, IDs, source paths, `first_appearance`,
  `canonical_source` and `related_terms` found no term sourced from Lira,
  Maren, Solace or 0007. There is no witness-device term to approve here.
  Existing draft Pull/Sleeve statuses remain unchanged.
- **Events:** All six `event-story-0007-00[1-6]` IDs occur only in S's local
  event list; no outside individual-event reference or shared-timeline entry
  requires a change. D18 depends on the whole approved story. The ten 0004,
  five 0015, five 0017 and four 0021 events likewise remain local and intact.
- **Map:** Q16/T18, current region profiles/lore and the placement entry at
  `design/map/cartography.yaml:119–121` were checked. Its existing approximate
  geometry and Gap–Void relations stay unchanged. No draft-0018 crossing
  route, density, numeric distance or new mapped entity is proposed.

Manual searches covered prose as well as structured IDs; generated graph
edges alone are not treated as exhaustive evidence. No primary dependent
was found requiring the unsupported specialty, a universal consent rule,
a completed Hael transfer or later D18 outcome.

## 7. Three author choices and implementation boundary

| Choice | Recommended defined approval | Independent alternative |
| --- | --- | --- |
| A — Lira | §2's exact narrowed summaries/continuity and §5's A reference cleanup; then canonical status | Defer; keep speculative. Broader specialty, authority and 0018 experience remain unapproved either way. |
| B — Maren | §3's exact bounded case/anchor/record/non-clearance account and §5's B cleanup; then canonical status | Defer; keep speculative. No future flight or inquiry outcome is chosen. |
| C — Solace | §4's exact local station profile/body, retained Q16/T18 topology and geometry, and §5's C links; then canonical status | Defer; keep speculative placement and current profile. Its map-build consequence is explicitly part of C, not A or B. |

**At the original review checkpoint, all three decisions were pending.**
The recommendation was A, B and C as defined, each separately approvable.
The author's subsequent approval is recorded in §9. Permission to implement
and the editorial approval of each defined scope are separate from preparing this
review or the standing permission to merge approved work after gates pass.
No implementation has occurred.

After explicit approval and implementation authorization: fetch main again,
preserve later work and this report, run the baseline, apply only selected
scope(s), record the actual author decision here and update the provisional
register only for approved entries. Rebuild the three generated artifacts;
check approved scopes, summary limits, map lint/build effects, local events
and preservation of protected files. Run required lint/check/full CI parity,
prepare a PR and require every final-head CLI/GitHub check before an
authorized merge. Any claim, map change or source revision beyond these
defined scopes returns to the author separately. No next story is selected.

## 8. Report verification and preservation

At the original report checkpoint, the report was the only tracked change.
All three original profiles retain speculative status. Every manuscript,
source, placement, lexicon, shared
timeline and generated graph artifact matches the reviewed main. Existing
reports and archived placeholders are preserved. S's six events remain
primary and local; its approved prose is unchanged.

Baseline and report-stage full `npm run validate:ci` both passed. The
proposed YAML blocks parse, and the three virtual profile candidates pass
their schemas without writing profiles. Summary lengths are Lira **82/369**,
Maren **79/653**, and Solace **82/467**, within the 220/1200 limits. Retained
summaries match their original values. Report links, source line bounds,
preserved paths and whitespace pass. The approved story body SHA-256 remains
`fef003d4db1220f03d6e318b6267fdbf97e00ba51dd159cd5b2eb4fed8038455`.

The report-stage graph remains 175 entities, 816 edges and zero orphaned
targets; continuity/timeline still have zero hard failures and zero soft
warnings. Existing advisory counts are unchanged. Local full CI parity
does not include hosted browser jobs; no hosted success or merge is claimed
here. Commit and push results are recorded in the chat. No test result is
editorial approval.

## 9. Author approval — implementation pending

On November 1, 2026, after the report was committed and pushed as
`a4fe45a346f913d4092e2075612bcfb4fc4c0917`, the author instructed:
**“approve the recommendations”**. This approves all three defined scopes:

| Choice | Editorial decision | Defined scope |
| --- | --- | --- |
| A — Lira | Approved | §2's exact summaries and continuity, §5's A reference cleanup, and proposed canonical status. No broader specialty, general authority or later-draft biography. |
| B — Maren | Approved | §3's exact case, anchor accounting, surviving record and present flight non-clearance, §5's B cleanup, and proposed canonical status. No later flight or inquiry outcome. |
| C — Solace | Approved | §4's exact local station profile and body, retained Q16/T18 topology and geometry, §5's C links, and proposed canonical status, including the stated public-map eligibility consequence upon implementation. |

The author separately specified that **“Implementation and profile approval
remain separate decisions.”** This approval records the editorial choices;
implementation remains pending. All three profile files still have
`metadata.status: speculative`. No profile wording, status, map eligibility,
placement, graph artifact, manuscript, lexicon or timeline change has been
applied. The current revision plan records the same checkpoint. No new
story is selected, and no PR or merge is performed by this decision record.

Current main was fetched again and remains `548ceaa`; the existing review
commit and clean working tree were preserved. This follow-up changes only
this approval record and the current revision plan. Documentation links,
whitespace and preservation of all other tracked files passed verification
before commit and push. The full CI-parity results in §8 belong to the original
report checkpoint and are not presented as new runs for this decision note.

## 10. Author-authorized implementation — November 1, 2026

### Authorization and baseline

After the separate editorial approval in §9 and an in-chat explanation of
each scope's pros, cons and recommendation, the author instructed:
**“implement A, B and C together in one PR”**. This supplies the separate
implementation authorization; no additional claim scope is inferred.

Current main was fetched again at `548ceaa2bf7c8d056ea6ae862a6330aa419fb009`.
Branch `canon/profiles/story-0007-approved-claims` preserves the pushed
review and approval commits `a4fe45a` and `0429875`. No unrelated working
changes were present. `npm ci` with the writable temporary cache and full
baseline `npm run validate:ci` passed before profile edits.

### Implemented scopes

| Scope | Applied implementation |
| --- | --- |
| A — Lira | §2's exact short summary and complete continuity block; existing long summary retained verbatim. §5's A reference cleanup removes copied sibling-profile dependencies while preserving every appearance list. |
| B — Maren | §3's exact long summary and continuity block; existing short summary retained verbatim. §5's B cleanup preserves the primary story as direct episode evidence and retains all appearances. |
| C — Solace | §4's exact summaries and complete body, with witnessed facilities, local practice, labeled working topology and provisional boundaries. §5's C links add the Gap and Void Regions and remove copied character dependencies. Station type, tags, region and map geometry are retained. |

All three entries now have `metadata.status: canonical`; the existing policy
resolves them to `primary_canon` / `authoritative`. No unsupported root tier
or retrieval-role field is added. Modification timestamps are refreshed;
IDs, names, schema versions, types, tags, creation dates and all other
unselected fields are preserved.

The provisional-profile register now records the completed separate approvals,
and the current revision plan records implementation. Original review evidence,
exact proposals and prior approval history remain available above.

### Preservation and verification

Exact comparisons against §§2–5 verify all approved summaries, continuity,
reference changes and the Solace body. Character bodies remain empty and
unchanged. The profile schemas pass; summary lengths remain Lira **82/369**,
Maren **79/653**, and Solace **82/467**.

All three graph artifacts are regenerated. The graph has **175 entities,
818 relationships, zero orphaned targets**. The two added relationships
link Solace to the Gap and Void Regions. Removed causal memberships retain
their appearance edges, rather than deleting the people/place context.

Both author and public map-data builds pass. Solace is newly included in
the public build at its existing placement; the number of public sites
increases by one. Every existing site's position and every region's geometry
match the baseline. No placement file, region field or memory density changes,
and no site deployment or tile publication is performed.

Every manuscript, local event, shared timeline, lexicon, faction, governing
source and map placement matches fetched main. Story-0007's approved body
SHA-256 remains
`fef003d4db1220f03d6e318b6267fdbf97e00ba51dd159cd5b2eb4fed8038455`.
Its six events remain primary and local; the 0004/0015/0017/0021 events are
also unchanged. Nim and draft 0018 remain speculative/draft; no later
experience, witness device, Hael transfer, completed cure, flight clearance,
missing-pod fate or inquiry outcome is added.

Implementation `npm run validate:ci` passes, including lint, continuity,
timeline, policy, tooling and the full map suites. Continuity/timeline have
zero hard failures and zero soft warnings; cartography lint has zero errors
and zero warnings. Existing advisories remain 21 schema warnings, 976
glossary candidates and one draft red-line citation warning (0005). Report
links, approved-scope comparisons and whitespace checks pass.

The committed implementation head must also pass final-head local CI parity
and every hosted check before merge under the author's standing authorization.
Those final-head results and the PR disposition are recorded on the
implementation PR. This batch selects no further story or profile scope.
