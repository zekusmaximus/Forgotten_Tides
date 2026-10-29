# Source-First Review: Halix Exchange and Skather-Ait Pod — 2026-10-29

**Entries:** `loc-0013` Halix Exchange (`atlas/Halix_Exchange.md`) and
`loc-0015` Skather-Ait pod (`atlas/Skather-Ait_Pod.md`). Both are
`metadata.status: speculative`.
**Primary source:** `story-0004`, *The Light Inheritance*
(`stories/short_story/the_light_inheritance/manuscript.md`, cited below as
`LI`). `story-0022` (`SW`) also mentions Halix.
**Policy:** `docs/governance/source_first_approvals.md`. Approval of
`story-0004` opened a claim-by-claim review of the profiles it links; it did
not promote them.
**Decision:** The author's. This review recommends; it changes nothing.

## Summary

- **Skather-Ait pod.** One claim contradicts primary canon:
  - The profile says the pod-spine "uncoupled from the lattice four
    generations before Yenu's childhood."
  - In `LI:164`, her grandfather, who is 84, was "born on the spine. Before
    the uncoupling."

  Every other non-draft claim is primary-supported. **Recommendation:**
  correct the contradiction whatever happens to the profile's status. Then
  promote the profile, keeping its draft continuity in a labeled section.
- **Halix Exchange.** Its core identity is primary canon: a four-kilometer
  bazaar-ship in an outer sleeve, with a fourth-deck inheritance quarter and
  Tess Vlin's bench. Several details come only from drafts `story-0003` and
  `story-0015`. The 0.56 `memory_density` has no source in any story or lore
  file. **Recommendation:** promote a trimmed profile. Move the draft-only
  details into a labeled draft-continuity section, and drop the density
  value rather than lock an unsourced number.

## Impact Reports

`npm run report:impact -- --id <id> --include-mentions`, run on 2026-10-29:

- **`loc-0013`:**
  - Six direct dependents: `char-0019` Tess Vlin, `char-0026` Yenu,
    `char-0031` Aurel Ket, `loc-0015`, and draft stories `story-0015` and
    `story-0021`.
  - No transitive dependents.
  - Mention candidates: primary stories `story-0004` and `story-0022`.
- **`loc-0015`:**
  - Three direct dependents: `char-0026` Yenu, `char-0027` Hol-Vren, and
    draft `story-0021`.
  - No transitive dependents.
  - Mention candidate: `story-0004`.

Promoting either profile approves no dependent entry. The linked characters
stay speculative until their own review.

## Skather-Ait Pod (`loc-0015`)

| # | Claim | Evidence | Verdict |
|---|-------|----------|---------|
| S1 | A small Drift Clade habitat (summary) | `LI:42` "A small Drift Clade pod habitat" | Primary |
| S2 | In an outer sleeve of the Helios Drift | `LI:42`; `LI:224` "their sleeve of the Helios Drift" | Primary |
| S3 | Linked to Halix Exchange by a six-hour tether shuttle | `LI:282` | Primary |
| S4 | Frame is a low-resonant mesh of tuned filaments threaded with shared recitations | `LI:224` | Primary |
| S5 | In `story-0004` the overdue frame develops softening corners | `LI:12`; `LI:220-236` | Primary |
| S6 | Recitations and physical frame work together | `LI:224` "held together by two things" | Primary |
| S7 | "The pod-spine uncoupled from the lattice four generations before Yenu's childhood." (body, line 30) | `LI:164`, `LI:166`: the grandfather, 84, was born on the spine before the uncoupling, so it happened within his lifetime | **Contradicted** |
| S8 | The frame's retuning is unresolved at the end of `story-0004` | `LI:140` "the pod's filament and labor remain unpaid" | Primary |
| S9 | `story-0021` pays for the filament through an alternate corridor and a voluntary rendered memory (summary) | Draft `story-0021` | Draft only; labeled as draft |
| S10 | `coordinates.region: Helios Drift outer sleeve` (added 2026-10-29) | `LI:42`; map decision Q16 | Primary |

**Proposed changes if approved:**

1. Replace body line 30 with: "The pod-spine uncoupled from the lattice
   within the lifetime of Yenu's grandfather, who was born on the spine
   before the uncoupling." Make this correction even if the profile stays
   speculative, because it removes a contradiction with primary canon.
2. Move the `story-0021` repair out of `summary_200` and into a body
   section headed "Draft Continuity (provisional)."
3. Set `metadata.status: canonical`, then regenerate the link map.

## Halix Exchange (`loc-0013`)

| # | Claim | Evidence | Verdict |
|---|-------|----------|---------|
| H1 | A bazaar-ship (`location_type: ship`) | `LI:292` "a bazaar-ship four kilometers long" | Primary |
| H2 | In the Helios Drift outer sleeve | `LI:42`; `SW:608` "Halix reports two decks gone to full recitation" during the outer-sleeve thinning | Primary |
| H3 | Four kilometers long | `LI:292` | Primary |
| H4 | Banners in multiple languages | `LI:292` "banners in seven languages" | Primary |
| H5 | Reliquaries and light-bequests are tuned, valued, and sold | `LI:296` tuning rings in a dozen booths; `LI:12`, `LI:440` Tess's valuation and private buyers | Primary |
| H6 | "memory-market claims are brokered" | No primary passage | Draft only |
| H7 | A fourth-deck inheritance quarter houses benches such as Tess Vlin's | `LI:302` | Primary |
| H8 | Stones are tuned there before sale, refusal, or release | `story-0004` plot: assay, Aurel's refused offer, release | Primary |
| H9 | "morally gray but internally rule-bound trade"; "internal rules around assay, provenance, broker seals, and lot status" | Assay `LI:202` and provenance `LI:430` are primary; broker seals and lot status come only from `story-0015` ("Lot status: no lot.") | Partly draft only |
| H10 | "apology stalls, courier docks, ... private cabinets" | Apology stalls come from `story-0015`. Courier docks and private cabinets have no primary passage. | Draft only |
| H11 | Tess's ring is "known among Drift Clade sellers for a clean lowering" | `LI:302` Yenu finds the bench by the sound of a ring "lowered properly." No passage gives a reputation among sellers. | Partly supported; reword |
| H12 | "a broker's refusal to name a price before the stone has been heard" | `LI:348` "I will not put it on the shelf or name a price until you ask me to." | Supported in substance; reword to match |
| H13 | Market role between Drift Clade need, Consortium acquisition pressure, hospice refusal, and private collecting | Clade need (Yenu), Consortium buyers `LI:398`, `LI:478`, and private buyers `LI:440` are primary. Hospice refusal comes from draft `story-0003` ("Halix doesn't move hospice stock"). | Partly draft only |
| H14 | "prices hunger, provenance, and memory with unnerving precision" | Interpretive, consistent with `LI:296` ("A bazaar was a body. Bodies wanted things.") and `LI:430` | Consistent characterization |
| H15 | `coordinates.memory_density: 0.56` | No story, lore, or mechanics source | **Unsupported** |

**Proposed changes if approved:**

1. Rewrite `summary_50` and `summary_200` to primary-supported claims
   (H1–H5, H7, H8, H11–H12 as reworded, and H14).
2. Move H6, H9's broker seals and lot status, H10, and H13's hospice refusal
   into a body section headed "Draft Continuity (provisional)," citing
   `story-0003` and `story-0015`.
3. Reword the Tess Vlin sentence. Her bench is found by "the good silence"
   of a properly lowered ring, and she will not "name a price until you ask
   me to."
4. Remove `memory_density: 0.56` and keep `coordinates.region`. A canonical
   profile's density is locked, and this one has no source.
5. Set `metadata.status: canonical`, then regenerate the link map.

## Effects on the Atlas Map

- **If both are promoted:** Halix and Skather-Ait appear in the public build
  (map decision D7). Halix shows no density reading.
- **If they stay speculative:** they remain in the author build only, faded.
  The Skather-Ait correction should still be made.
