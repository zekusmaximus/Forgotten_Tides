# Remaining editorial work and dependencies

**Checkpoint:** October 30, 2026. Read-only editorial audit of fetched main
`e92ceea2956abb3e9682613a216bf6caf7284c9b`, including PR #58's atlas work.
No next story has been selected. This report recommends a review scope; it
does not approve revisions, profile expansions, lexicon changes, or promotion.
Only this report is added. Existing reports retain their historical findings.

## Baseline and method

The starting worktree was clean. Fetched `origin/main` matched the handoff
commit; branch `docs/review/remaining-editorial-audit` starts there. `npm ci`
and `npm run validate:ci` passed before the report was written. The current
graph has **175 entities, 814 edges, zero orphaned targets**. Continuity and
timeline each report **zero hard failures and zero soft warnings**. Current
schema coverage is 127 seen / 109 validated / 18 skipped, with 21 advisories;
glossary coverage reports 976 advisory candidates. The two draft red-line
citation warnings concern 0005/0007. The map data, viewer, render, chart, and
depth tests pass. CI parity does not run the separate hosted browser jobs;
no fresh browser result is claimed here.

Authority consulted: `AGENT.md`, `CLAUDE.md`, `CONTRIBUTING.md`, the current
`CANONICAL_INDEX.md`, manuscript frontmatter, structured graph, source-first
and provisional-profile governance, working-lore decisions, governing anchor
and corridor mechanics, bible red lines, and current review checkpoints.
`report:canon-tiers` was run; continuity/timeline report summaries were checked.
Impact reports with `--include-mentions` were inspected for 0005, 0006, 0007,
and 0014. Manual searches covered profile prose, lexicon provenance and related
terms, story dependencies, and orientation documents. Impact counts below
are structured causal links, not proof of claim approval or complete prose
coverage.

This is a remaining-work audit, **not a scored promotion review**. Draft prose
was spot-checked to verify specific flags; no draft receives a readiness score,
hard-gate verdict, or recommendation to promote. Any selected story review
must execute [the review agent](../../agents/canon_promotion_review_agent.md)
in full: required reading in order, full manuscript and linked-entity reading,
cited seven-criterion card, hard gates, dependency/contradiction register,
exact proposed fixes, and author choices. The shortlist does not substitute
for that work.

## 1. Settled work: do not reopen historical findings

The index's Authoritative Canon view and current manuscript tiers agree on
nine primary stories: **0001, 0004, 0008, 0012, 0013, 0015, 0017, 0021,
0022**. The following decisions supersede earlier draft findings:

| Completed work | Governing final record | Present disposition |
| --- | --- | --- |
| 0004 revision/promotion and seven baseline entry approvals | [0004 review](STORY_0004_REVIEW_2026_10_28.md), current decision and final linked-entry checkpoint | Settled by PRs #44/#45. Light-Bequest remains broad; stone/frame cases remain local. |
| 0015 revision/promotion | [0015 review](CANON_PROMOTION_REVIEW_2026-10-29.md), §11 | Settled by PR #46. Its separate carrier is another particular case; no restored donor payload or title-driven gravity. |
| 0017 revision/promotion | [0017 review](STORY_0017_CANON_PROMOTION_REVIEW_2026_10_29.md), §11 | Settled by PR #51. Documentary evidence and model certification replace the original residue overclaim. |
| Corin, Lysa, H-37 claims | [profile review](STORY_0017_PROFILE_CLAIM_REVIEW_2026_10_29.md), current decision and §7 | Settled by PR #53. All three are canonical within approved scopes. |
| 0021 revision/promotion | [0021 review](STORY_0021_CANON_PROMOTION_REVIEW_2026_10_30.md), §§10–11 | PRs #55/#56 completed the revision and 65/70 promotion. The childhood Halix-visit contradiction was fixed; it is not an outstanding blocker. |
| Yenu, Hol-Vren, Tess, pod, Halix expanded claims | [expanded claim review](STORY_0021_EXPANDED_PROFILE_CLAIM_REVIEW_2026_10_30.md), current checkpoint and §11 | All five approved and implemented in PR #57, merged as e6158e8. Includes the previously pending 0015 Tess/Halix claims. No new status decision remains for this batch. |

In particular, earlier reports calling 0017/0021 draft, the childhood visit
unresolved, or Tess/Halix's 0015 claims pending are dated history. Their final
decisions and the later expanded-claim review govern. No concrete current
conflict was found that warrants reopening these decisions.

## 2. Genuinely provisional work

### Source-story and profile queues

[Provisional profiles](../governance/provisional_profiles.md), lines 9–20,
still correctly identifies seven provisional profiles from three drafts:

| Source | Entries still speculative | Verified review input |
| --- | --- | --- |
| 0005, The Liturgy of Rust | Kaelen, Vane, Ostra-Vael | `manuscript.md:212,252-262,284` supplies anchor expenditures and a zero-anchor wave that shatters an eddy. Compare `ANCHOR_THEORY.md` §§3–5, `CORRIDOR_MECHANICS.md` §5.1, bible §3.5. Ostra-Vael's `coordinates.memory_density: 0.30` is not established merely by the story's thirty-percent conceptual integrity at `:170`. |
| 0006, The Anchorless Tide | Kael Voss, Ebbhaven | `manuscript.md:53,67,83-103` moves from two personal/one civic anchors to one personal, permission rather than expenditure, lost mother-memory, and no anchors. Accounting and post-loss survival need review against anchor theory §3.4. Ebbhaven's profile says vanished colony and `location_type: region`; the story's catastrophe evidence at `:55` needs a bounded disposition. |
| 0007, The Hospice Knot | Lira Voss, Maren Holt, Solace Hospice | Consent, contested evidence, release permanence, and the witness stone need review (`manuscript.md:319,365-407,437-473,533`). Geography is already reconciled: Solace is at the Lattice Gap outer sleeve, touching a Void Region; 0003's hospice is a separate unnamed house. |

These are review inputs, not findings that authorize editing governing rules.
The later 0018 Lira/Nim episode is not approved by reviewing or promoting 0007.
Primary stories 0013 and 0022 mentioning Solace do not approve all detailed
procedures or every claim in `loc-0010`.

The index also retains speculative profiles beyond that seven-entry memo:
Sael Orro, Ives Mar, Veyr Anik and Narthex of Low Mercy (0009); Sera Venn
(0010); Oren Vale (0011); Mael Ivar (0014, also used by 0016); Nessa Iral
(0016); Nim Orra (0018); Yaret Ivo-Senn (0019); Toma Vey and Heavonly (0020).
These are an unscheduled source-first queue, not overlooked PR #57 work.
Source approval must precede separate full-profile claim approval unless a
defined independent primary-backed baseline is proposed under governance.

### Lexicon and working-lore queue

- `data/lexicon/terms.yaml:258-279`: Continuity Cleric (0022) and Liturgy of
  the Hull (0023) remain draft by an explicit author decision in
  [working-lore approvals](../governance/working_lore_approvals.md), §Story-0005
  Lexicon Definitions. Review their detailed acoustic/doubt claims after
  0005, then obtain separate definition approval. Reliquarist's related-term
  link (`terms.yaml:299`) does not approve them.
- `terms.yaml:393-413`: Pull (0033) and Sleeve (0034) remain **draft**, despite
  primary-source provenance and approved map topology. The atlas decision
  explicitly entered them at draft. A bounded definition review is a possible
  small independent batch, with exact primary passages and map-interpretation
  limits; neither map implementation nor this audit authorizes status changes.
- Drift Clades stays working canon. Its wider profile scope for inheritance,
  recitation, and traditional thinning still needs separate claim review
  (`working_lore_approvals.md:13-17`). Local 0004/0015/0021 approvals do not
  establish faction-wide practice. This is optional future scope, not a reason
  to expand the faction now.
- `atlas/Halix_Exchange.md:143-150` isolates 0003 stock assertions and 0019
  offstage repair-record provenance. These remain unapproved future review
  inputs. They do not invalidate the approved Halix baseline or reopen #57.

### Dependency findings

All current primary short-story causal story/event prerequisites are primary.
0021 depends on 0004, 0015, 0017, 0013, 0001. 0022 depends on 0012/0001 and
shared events `event-story-0008-004` / `event-story-0013-003`; it does **not**
depend on 0021. No change to their ordering or shared timeline is needed.

For remaining numbered drafts, frontmatter declares just two draft-to-draft
story edges: **0016 → 0014** and **0018 → 0007**. Both also cite primary
0001. Drafts 0003/0005/0006/0007/0009/0010/0011/0019/0020 declare no story
prerequisite; 0014 cites only 0001. 0002 has no declared story prerequisite
and the index resolves it to draft, although it lacks an explicit manuscript
`canon_tier`. Empty references do not prove independence: 0020 explicitly
uses novel-derived Heavonly in its continuity notes, so its actual outcome
dependencies need prose review. Novella/novel/sample work is not selected.

**Concrete structured-link review issue:** impact for 0007 reports six direct
dependents: Lira, Maren, Solace, draft 0018, and canonical Canticle Fleet and
Remembrancers of Solace; zero transitive dependents. Both faction profiles
retain `references.stories: story-0007` and provisional entity links
(`factions/Canticle_Fleet.md:47-69`; `Remembrancers_of_Solace.md:25-37`).
These causal links deserve a source/mention distinction under CONTRIBUTING.
They do not establish that 0007's consent procedure is already canon.
Working lore §6 independently supports the Remembrancers' broad hospice
mandate and doctrine. A future review should propose exact reference/claim
dispositions against those sources, rather than promoting 0007 to make the
graph look cleaner. Current CI passes despite these profile links.

## 3. Deliberate open outcomes: preserve unless separately selected

| Open outcome | Current evidence and boundary |
| --- | --- |
| H-37 recertification and Corin's personnel review | Current H-37/Corin profiles and 0017 notes explicitly retain suspension and a pending notice. 0021 still says H-37 is suspended (`receipt_for_a_voice/manuscript.md:469`). Twelve cycles is an attributed estimate, not a fixed minimum. No physical corridor repair or restored Lysa anchor follows from correction. |
| Pod future, Yenu's qualification, Tess's finances | Expanded-claim review §2 and §11 preserve internal relocation of twelve residents, supervised work, maintained local repair and months of checks. No full reopening, permanent stability, completed training, sanctions, lost bench rights, or permanent bankruptcy is established. Financial withdrawal charge, courier tax and invoiced fee remain costs. |
| Aurel's promises and alleged Synod booth | `characters/Aurel_Ket.md:39-61` and Halix's approved baseline keep technical performance unverified and booth rumor unconfirmed. The 0015 female buyer is another person. These are intentional limits, not unfinished verification assignments. |
| TES-N3-44217's provenance and deferred hearing | 0008's continuity notes explicitly withhold the answer; Inya's current invariant records deferred review after 0022. An unwritten investigation is an opportunity, not an incomplete promotion gate. |
| Post-0022 cost, care and judgment | Elior's unfiled null-cargo cost, Hael's care, Jory's Inquisition, Ilka's judgment, civic-silo losses and sealed hall remain story opportunities. Current character invariants and `STORY_OPPORTUNITIES.md` preserve them. Do not date 0021 relative to the unfiled run or invent its cost. |

Yenu loses her remembered sound of one grandfather correction, not every
memory of his voice; facts and grandmother's voice survive. Already purchased
filament/cutting/ordinary passage remain distinct from extra release-end input
and ordinary drive stocks. No spent donor content becomes new usable fuel.
These approved limits are prerequisites for later work, not unresolved edits.
The ten 0004, five 0015, five 0017 and four 0021 events remain local; the audit
finds no selected approved story requiring their migration to the shared file.

## 4. Stale orientation text, distinct from historical evidence

No correction is applied in this report. Suggested exact documentation scope:

1. `docs/STORY_OPPORTUNITIES.md:5`: add `story-0017` and `story-0021` to the
   introductory primary-canon list. At `:7`, change only the canon-status
   check date from October 29 to October 30, 2026. Preserve the separate
   October 20 opportunity/theme-inventory date and the explicitly historical
   theme counts. The body already recognizes primary 0021 and its suspended
   H-37 setting; it is not evidence that the introduction is current.
2. `docs/governance/working_lore_approvals.md:74-75,98-100`: replace the
   forward-looking 0003/0007 repair directions with a dated completion note:
   “PR #48 completed these two draft reconciliations: story-0003's hospice
   is unnamed and separate from Solace Hospice; story-0007 uses ‘third watch’
   for time of day.” Current 0007 lines 429/527 say third watch, and commit
   `8acded9` records #48. Preserve the underlying approved map decisions.
3. `agents/canon_promotion_review_agent.md`, §10's entity-status flag: replace
   “Lira Voss is `canonical` and Maren Holt is `speculative`” with “Lira Voss
   and Maren Holt are both `speculative`; verify current source-first scopes
   rather than inferring approval from an earlier status.” Both current
   frontmatters and the index confirm this. The agent itself calls these
   historical flags facts to verify independently. A later cleanup can
   refresh its old 0004→0015→0021 draft-chain wording too, preserving the
   actual causal chain and current primary tiers.

Benefit: removes misleading task-selection cues without changing canon.
Cost: small documentation batch requiring care not to rewrite dated review
evidence. Recommendation: optional companion scope after author selection;
do not modernize historical review findings into false original decisions.

## 5. Ranked next scopes

| Rank | Concrete proposed batch | Evidence / prerequisites | Pros | Cons / excluded work |
| --- | --- | --- | --- | --- |
| **1** | **Full canon-readiness review of 0007, The Hospice Knot**, plus a source/dependency audit of Lira, Maren, Solace and the two faction links | No story prerequisite (`0007:25-37`); 0018 depends on it (`0018` references). Verify consent, irreversible loss and witness-record scope against mechanics/bible/lore; execute full review-agent reading and scoring. | Addresses a named provisional queue and the six direct dependency candidates; prepares a clean foundation for later 0018 or Hael-care choices. | Consent may need substantive author choices. No automatic approval of 0018, hospice procedures, profiles, faction rewrites, or a Hael sequel. |
| **2** | **Review 0014, The Public Weight of a Private Lie**, then consider 0016 as a separately scored successor | 0014 references primary 0001; 0016 references 0001/0014 (`0016:40-42`). Impact for 0014: Mael, Nessa and 0016, zero transitive dependents. Read locked Heliodrome bible rules before judging civic reassurance. | Clear two-story dependency sequence; assesses public-memory pressure before route-map consequences. | Greater locked-setting sensitivity; neither story may cure Heliodrome or turn messaging into free stabilization. Reviewing both is larger than rank 1; select 0014 first. |
| **3** | **Review 0005, The Liturgy of Rust**, with its three profiles and two draft definitions as follow-on claim inputs | Three direct profile dependents; lexicon links require manual coverage. Verify zero-anchor costs/eddy outcome and density distinction against the governing sources cited in §2. | Retires a concrete long-standing mechanics/profile/term queue if a defensible revision scope emerges. | More mechanical uncertainty than rank 1. Density and destructive eddy-wave claims cannot be solved by silently changing locked mechanics; story approval would still not approve terms/profiles. |

0006 is the next reserve candidate, not part of the recommendation: two direct
dependents, no transitive dependents, but anchor accounting, physical “Tides,”
Ebbhaven classification and thin metadata need a concentrated review. Standalone
0010/0011/0019 and novel-adjacent 0020 remain available; their appearance in
the opportunities list supplies no precedence or promotion permission.

**Recommendation:** choose rank 1 as a review-only batch. Produce a complete
0007 card and exact, evidence-backed revision/reference options, with pros,
cons and recommendations, before requesting any implementation approval.
Assess linked profiles to identify later claim scopes, retaining speculative
status. Defer the actual 0018 review and all post-0022 writing. The optional
orientation cleanup in §4 can be selected separately. No next scope has been
accepted merely by recording this recommendation.

## Delivery boundary

Only this new tracked report changes. No manuscript, profile, status, lexicon,
timeline, governing source, atlas placement/tooling, existing report, or
generated artifact is edited. Baseline tooling regenerated the three graph
artifacts without a diff. Commit and push preserve the report for the author's
choice; they do not implement any recommendation.
