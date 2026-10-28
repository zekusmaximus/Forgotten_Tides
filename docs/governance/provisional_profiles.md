# Provisional Profiles Awaiting Story Approval

The author reviewed these seven profiles after PR #40. Each remains
provisional pending approval of its source story and a separate review of its
claims. The entity schemas currently use
`metadata.status: speculative` for this state. This status keeps the profile
available to draft workflows without treating its claims as primary canon.

| Draft story | Provisional profiles | Review before approval |
| --- | --- | --- |
| `story-0005` (*The Liturgy of Rust*) | `char-0005` Kaelen; `char-0006` Vane; `loc-0002` Ostra-Vael | Reconcile Kaelen's zero-anchoring and resulting anchor losses with governing mechanics; verify Ostra-Vael's `memory_density: 0.30` separately from the story's 30% conceptual integrity. |
| `story-0006` (*The Anchorless Tide*) | `char-0007` Kael Voss; `loc-0009` Ebbhaven | Resolve Kael's anchor accounting; decide what happened to Ebbhaven and whether `location_type: region` describes it correctly. |
| `story-0007` (*The Hospice Knot*) | `char-0008` Lira Voss; `loc-0010` Solace Hospice | Review the consent precedent and reconcile Solace's location across draft stories `0003`, `0007`, and `0018`. |

Promoting a source story starts a separate review of its linked profiles. It
does not automatically approve every claim in those profiles. Draft
`story-0018` explicitly depends on `story-0007` and adds later provisional
experiences for Lira; approving `story-0007` would not approve those later
events. Primary stories `0013` and `0022` refer to Solace care, and existing
lore establishes the Remembrancers' hospice mission. Those references do not
establish the detailed location and procedures in `loc-0010`.
