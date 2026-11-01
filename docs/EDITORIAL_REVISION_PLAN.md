# Editorial revision plan

Updated November 1, 2026. Repository: `zekusmaximus/Forgotten_Tides`.
Editorial checkpoint: **d9ec94dd67997800065e9a11cf0970312d2fe2e6** (PR #62).
Fetch current main before continuing; preserve this work and any later changes.
The [continuation prompt](handoffs/EDITORIAL_CONTINUATION_PROMPT.md) preserves
the original review request; the current checkpoint below records its outcome.

This is the current planning document. It supersedes the October 30 audit's
task ordering, while preserving that
[historical audit](https://github.com/zekusmaximus/Forgotten_Tides/blob/89f9f51820454fbcecf3f0b835925534d5f4521a/docs/reviews/REMAINING_EDITORIAL_WORK_AUDIT_2026_10_30.md)
and all existing reports. The old archive revision-plan placeholder concerns
an unrelated scene request and remains unchanged. This plan approves no canon
change or new story selection.

## Completed and settled

| Work | Final disposition |
| --- | --- |
| PRs #44/#45 | Story-0004 promoted; Light-Bequest, Tess, Yenu, Hol-Vren, Aurel, Halix and Skather-Ait baseline claims separately approved. |
| PR #46 | Revised story-0015 promoted. |
| PRs #51/#53 | Revised story-0017 promoted; Corin, Lysa and H-37 defined profile claims separately approved. |
| PRs #55/#56 | Story-0021 revised and promoted, 65/70. Childhood Halix-visit contradiction fixed. |
| PR #57 | Five expanded Yenu/Hol-Vren/Tess/pod/Halix scopes approved and implemented, including the previously pending 0015 Tess/Halix additions. |
| PRs #58/#60/#61 | Atlas depth/time work, render records and completion docs preserved. |
| PR #59 | Story-0007 F1–F7 revision implemented, 62/70. Consent-detecting stone removed; written testimony, consistent evacuation knot, scoped clinical outcome, prose cuts, six local draft events and source links added. Three speculative profiles corrected; faction causal provenance cleaned up. |
| PR #62 | Story-0007 promoted to primary canon at `d9ec94d`. Approved prose unchanged; all six events primary and local. No profile status changes. |

Current primary stories: **0001, 0004, 0007, 0008, 0012, 0013, 0015,
0017, 0021, 0022**. Verify against `CANONICAL_INDEX.md` and frontmatter;
this dated list does not override later source changes.

PR #62 passed final-head local CI parity and all eleven GitHub checks,
including both browser runs. The graph had **175 entities, 816 relationships,
zero orphaned targets**; continuity/timeline had zero hard failures or soft
warnings. Existing advisories: 21 schema warnings, 976 glossary candidates,
one draft red-line warning (0005). Rerun current gates in the next chat.

## Profile claims approved and implemented

The source story and all three defined profile scopes are approved.
**All three entries now have canonical status**:

| Entry | File | Review scope |
| --- | --- | --- |
| Lira Voss, char-0008 | `characters/Lira_Voss.md` | Role, local consent assessment, disputed authority, summary/invariant/watchlist scope, and separation from her later draft-0018 experiences. |
| Maren Holt, char-0009 | `characters/Maren_Holt.md` | Failed evacuation, three-to-two anchor accounting in the rite, permanent loss, surviving factual testimony, flight non-clearance and open inquiry. |
| Solace Hospice, loc-0010 | `atlas/Solace_Hospice.md` | Local facilities/practice, station classification and approved speculative Gap–Void placement; distinguish witnessed details from institution-wide claims. |

The read-only [claim review](reviews/STORY_0007_PROFILE_CLAIM_REVIEW_2026_11_01.md)
is complete and was committed and pushed as `a4fe45a`. It records exact
wording, tier/status and reference proposals, primary and working evidence,
dependency/mention checks, pros, cons and three independent recommendations.

On November 1, 2026, the author instructed **“approve the recommendations”**,
approving defined scopes A (Lira), B (Maren) and C (Solace), as recorded in
the report's §9. C includes the stated public-map eligibility consequence
when its approved status change is implemented. Approval does not expand
any scope beyond the report's exact proposals.

The author separately instructed **“implement A, B and C together in one PR”**.
The exact approved wording, continuity limits, reference cleanup and canonical
statuses are implemented, with the report's §10 recording verification and
preservation. The provisional-profile register is updated and all three graph
artifacts are regenerated. Solace's existing placement is now eligible for the
public map build; its region, station classification and map geometry remain
unchanged. Hosted checks and merge status belong to the implementation PR.
No manuscript revision, new term, geography change or next story is selected.

## Preserved editorial boundaries

- Story-0007's signed consent assessment is Lira's local, disputed judgment.
  Written fragments survive without restoring Maren's lived route anchor.
  Two other anchors remain responsive; he is not cleared for flight. The six
  missing pods' fate and later institutional judgment remain open. There is
  no objective consent detector, universal clinical precision, Fleet immunity
  or permanent cure. Do not reopen the completed 38/70 findings as blockers.
- Primary 0013/0022 establish Solace-care references, not every detailed
  profile claim. Hael's transfer to Solace has not happened on-page. Draft
  0018, Nim, the Void crossing and later witness-device behavior remain
  provisional; 0018 depends on now-primary 0007 and is not selected here.
- Solace's separately approved profile preserves the cartographic brief's
  T18/Q16 placement as labeled working topology. Its witnessed station
  classification is primary evidence; map geometry remains interpretation.
  No placement rewrite, density or later-draft facility is introduced.
- The ten 0004, five 0015, five 0017, four 0021 and six 0007 events remain
  local. Add a shared event only when an approved story actually requires it.

Earlier settled boundaries also remain: Light-Bequest is broad and its
stone/frame examples local; spent donor content never becomes usable fuel.
Aurel's promises are unverified, the booth is rumor and the later female
buyer is someone else. Yenu loses one remembered correction's sound, while
facts and her grandmother's voice remain. Filament/cutting/ordinary passage
were already purchased; extra input, ordinary drive stocks, courier tax and
Tess's fee stay distinct. Twelve residents relocate internally; maintained
local repair is not permanent pod stability or completed training. H-37
remains suspended; model certification is not free passage or physical repair,
and twelve cycles is an attributed estimate. Tess's charge is financial, with
no established sanctions, lost bench rights or permanent bankruptcy. Do not
date 0021 relative to Elior's unfiled run or invent its unnamed cost. Halix's
draft-0003/0019 assertions remain isolated, not leftover PR #57 blockers.

## Deferred queue: author choice required

| Candidate | Dependency or unresolved input | Status |
| --- | --- | --- |
| 0014, then 0016 | 0016 causally depends on 0014; locked Heliodrome constraints govern both. | Earlier audit's next story candidate; unselected. |
| 0005 plus later profile/term reviews | Zero-anchor/eddy outcome, anchor costs and Ostra-Vael density need review. Continuity Cleric and Liturgy of the Hull stay draft. | Unselected. |
| 0006 | Anchor accounting, physical “Tides,” Ebbhaven fate/classification and metadata need review. | Reserve candidate; unselected. |
| 0018 | Now has an approved 0007 source, but its later claims and mechanics need their own full review. | Dependency partly cleared; no review/revision/promotion implied. |
| Other drafts and standalone definition reviews | 0010/0011/0019/0020; draft Pull/Sleeve; wider Drift Clades claims. | Available later, without priority or approval inferred from an opportunities list. |

Deliberately open story outcomes, including H-37 recertification, Corin's
review, Elior's cost, Hael's care, Jory's judgment and the pledged stone's
provenance, are opportunities rather than unfinished promotion gates.

The opportunities introduction is now current through PR #62. Its theme
counts remain explicitly historical. The review agent's §10 flags and old
map-time repair directions preserve older snapshots; verify them against
current files. Any orientation cleanup is separate from manuscript work.

## Governing records and workflow

Read `AGENT.md`, `CLAUDE.md`, `CONTRIBUTING.md`, the generated index and
[source-first approvals](governance/source_first_approvals.md), then
[provisional profiles](governance/provisional_profiles.md).
Use current checkpoints and final decisions in these reports:

- [0007 review, revision and promotion](reviews/STORY_0007_CANON_PROMOTION_REVIEW_2026_10_30.md), especially §§10–11.
- [0004 and baseline claims](reviews/STORY_0004_REVIEW_2026_10_28.md).
- [0015 promotion](reviews/CANON_PROMOTION_REVIEW_2026-10-29.md).
- [0017 promotion](reviews/STORY_0017_CANON_PROMOTION_REVIEW_2026_10_29.md) and [profile claims](reviews/STORY_0017_PROFILE_CLAIM_REVIEW_2026_10_29.md).
- [0021 promotion](reviews/STORY_0021_CANON_PROMOTION_REVIEW_2026_10_30.md) and [expanded claims](reviews/STORY_0021_EXPANDED_PROFILE_CLAIM_REVIEW_2026_10_30.md), §11.

Reviews propose defined changes; the author approves each scope. After
approval, implement only that scope, update its review record, regenerate
`CANONICAL_INDEX.md`, `REFERENCE_MAP.json` and `docs/link_map/LINK_MAP.md`,
run relevant gates and prepare a PR. Standing authorization permits merging
approved changes after all CLI/GitHub gates pass on the final head; it does
not replace editorial approval. Any subsequent story review must execute
the full required-reading, evidence, hard-gate and scoring contract in
`agents/canon_promotion_review_agent.md`.
