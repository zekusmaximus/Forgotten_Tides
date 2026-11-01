# Provisional Profiles Awaiting Source or Claim Approval

The author reviewed the original seven profiles after PR #40. Draft-origin
profiles require source-story approval followed by a separate review of their
claims. The register below records current source status; story approval
alone does not approve a full profile. The entity schemas currently use
`metadata.status: speculative` for this state. This status keeps the profile
available to draft workflows without treating its claims as primary canon.

| Source story | Provisional profiles | Review before approval |
| --- | --- | --- |
| `story-0005` (*The Liturgy of Rust*) | `char-0005` Kaelen; `char-0006` Vane; `loc-0002` Ostra-Vael | Reconcile Kaelen's zero-anchoring and resulting anchor losses with governing mechanics; verify Ostra-Vael's `memory_density: 0.30` separately from the story's 30% conceptual integrity. |
| `story-0006` (*The Anchorless Tide*) | `char-0007` Kael Voss; `loc-0009` Ebbhaven | Resolve Kael's anchor accounting; decide what happened to Ebbhaven and whether `location_type: region` describes it correctly; decide whether "the Tides" names anything physical (atlas map decision Q13). |

Promoting a source story starts a separate review of its linked profiles. It
does not automatically approve every claim in those profiles. Draft
`story-0018` explicitly depends on `story-0007` and adds later provisional
experiences for Lira; neither the promotion of `story-0007` nor the subsequent
bounded profile approvals establish those later events. Primary stories
`0013` and `0022` refer to Solace care, and existing lore establishes the
Remembrancers' hospice mission. Those references do not establish completed
visits to Solace Hospice or universal procedures at that station.

## Completed separate claim approvals — November 1, 2026

After source promotion, the author separately approved the three exact
scopes in the [story-0007 profile claim review](../reviews/STORY_0007_PROFILE_CLAIM_REVIEW_2026_11_01.md),
then authorized implementing A, B and C together in one PR. All three now
have `metadata.status: canonical` within those defined limits:

| Entry | Approved and implemented scope |
| --- | --- |
| Lira Voss, `char-0008` | Demonstrated Remembrancer role, local disputed consent assessment, signed accountability and scoped continuity guidance; no broader specialty or draft-0018 biography. |
| Maren Holt, `char-0009` | Permanent three-to-two anchor loss, surviving factual fragments and present flight non-clearance; missing pods and later inquiry remain open. |
| Solace Hospice, `loc-0010` | Witnessed station and local practice, with Q16/T18 placement labeled working topology. Existing geometry is retained and the approved entity is eligible for the public map build. No Hael arrival or draft-0018 facilities are established. |

The [story-0007 promotion record](../reviews/STORY_0007_CANON_PROMOTION_REVIEW_2026_10_30.md)
records source approval. The separate claim review's §§9–10 record editorial
approval and implementation; the profile status changes follow those author
decisions, rather than automatically following the story's promotion. The
`story-0003` hospice remains a separate, unnamed Remembrancer house.
