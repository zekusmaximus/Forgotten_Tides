# New-chat editorial continuation prompt

Copy the text below into a new chat with the repository workspace attached.
It requests a review only. It does not approve any resulting profile changes.

```text
Continue the Forgotten Tides editorial work in /workspace/Forgotten_Tides.
Repository: zekusmaximus/Forgotten_Tides.

Fetch current main and work from it, preserving unrelated work and all later
changes. At this handoff, the latest editorial merge is PR #62 at
d9ec94dd67997800065e9a11cf0970312d2fe2e6. Begin with npm ci and
npm run validate:ci. Stop and report a red baseline before reviewing.

Read AGENT.md, CLAUDE.md, CONTRIBUTING.md, CANONICAL_INDEX.md,
docs/EDITORIAL_REVISION_PLAN.md, docs/governance/source_first_approvals.md,
docs/governance/provisional_profiles.md, and the current checkpoint plus
sections 10–11 of
docs/reviews/STORY_0007_CANON_PROMOTION_REVIEW_2026_10_30.md.
Use the plan's linked final decisions for earlier settled work. Historical
draft findings are not current blockers.

FIRST TASK — read-only, separate claim reviews of:
- char-0008, characters/Lira_Voss.md
- char-0009, characters/Maren_Holt.md
- loc-0010, atlas/Solace_Hospice.md

Story-0007, “The Hospice Knot,” is already primary canon, promoted after the
62/70 revision in PR #59. Its approved prose is unchanged; its six events are
primary and local. All three profiles remain speculative. Review their full
claims against approved sources; story promotion does not approve profiles.

Read the complete current story-0007 manuscript and each complete profile,
including all invariants, watchlists and references. Read relevant governing
mechanics, Pilot Manual, bible, faction/lore sources and the cartographic
brief's T18/Q16 decisions. Read primary 0013/0022 passages needed to evaluate
broader Solace claims. Run report:impact with --include-mentions for all three
IDs; inspect dependents and manually search prose, lexicon canonical_source /
related_terms, and event references. Structured links are not complete proof.

For each claim, distinguish primary evidence, broader working-lore support,
unsupported generalization and later-draft material. Give exact proposed
wording, tier/status and reference changes, with cited passages, affected
entries, pros, cons and recommendation. Keep the three approval choices
independent. Preserve existing reports; write a new tracked claim-review
report under docs/reviews/, commit and push it, then present the choices.

BOUNDARIES
- Maren permanently loses one evacuation-route anchor; two others answer.
  Written facts do not restore the lived experience. Current flight
  non-clearance, six missing pods and the later inquiry remain as established.
- Lira's assessment is local and contested. No consent detector, universal
  clinical precision, Fleet immunity, permanent cure or whole-order doctrine
  follows. Hael has not arrived at Solace on-page.
- Draft 0018/Nim/void-crossing/witness-device claims remain provisional.
  Solace's speculative map placement is not blanket approval of its profile.
- Keep the plan's earlier settled boundaries and all local events intact.
  No new story is selected. No manuscript, profile, status, lexicon, shared
  timeline, governing source or map edit is authorized by this review.

The last editorial head passed local full CI parity and all eleven GitHub
checks, including both browsers. Graph: 175 entities, 816 edges, no orphaned
targets; continuity/timeline: zero hard failures or soft warnings. Rerun
current gates; these are historical results, not a substitute.

After I approve defined changes, implement only those scopes, update the
review, regenerate all three graph artifacts, validate and prepare a PR.
My standing authorization permits merge after all CLI and GitHub gates pass
on the final head. It does not replace separate editorial approval. Any later
story review must follow agents/canon_promotion_review_agent.md in full.
```
