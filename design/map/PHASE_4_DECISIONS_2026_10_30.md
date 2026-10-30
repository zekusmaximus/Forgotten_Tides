# Phase 4 Decision Batch: Depth and Time

**Date:** 2026-10-30
**Phase:** 4 of the [atlas map plan](../../docs/ATLAS_MAP_PLAN_2026_10_29.md)
**Status:** Open. These questions await the author's answers. Accepted
answers go into [the cartographic brief](CARTOGRAPHIC_BRIEF.md) as a Phase 4
section, with new claims and rules. Nothing in this file is a decision yet.

Phase 4 adds Z3 interior insets (the Tessarine Vault first, then the
Heliodrome), story routes, event pins, an era control (Before and After the
Tessarine Breach), the Z0 universe scaffold, and layer toggles. It is done
when zooming from Z1 into the Vault's silo bank is continuous and the
post-breach view shows no invented figure.

**Citation key:** `ss/<slug>:<line>` is
`stories/short_story/<slug>/manuscript.md`; `ss/spend` is
`spend_what_you_can_afford`, `ss/wake` is `the_archivists_wake`. D, Q, T, and
R numbers refer to the brief. Tiers are checked against `CANONICAL_INDEX.md`
on `main` at 49ec83d.

## P1. What inset geometry may assert

The Vault is "a vertical complex: an audit hall at the base, a middle ring
... and an upper bank of ... silos" (`atlas/Tessarine_Vault.md:67`). Canon
gives these interior facts:

| Fact | Source |
|------|--------|
| Hall at the base, ring above it, silos above the ring | `atlas/Tessarine_Vault.md:67`; `ss/spend:387-388` |
| Sixteen booths in a low-ceilinged hall under the ring, along an aisle | `atlas/Tessarine_Vault.md:71`; `ss/spend:286, 337` |
| Provenance station at the head of the hall, under the lintel over the outer ("lintel") doors | `atlas/Tessarine_Vault.md:71, 75`; `ss/spend:253, 398, 980` |
| Booth Ten is beside Booth Nine; the Vault-Master stands at the far end | `ss/spend:367, 289` |
| A service stair runs from the hall to the ring (landings), then a last flight to the silo bank | `ss/spend:381, 415, 498` |
| The ring is a circle of shelving with an inner and an outer curve; a storeroom is off it | `ss/spend:457, 463, 482, 921` |
| Nine housings in a shallow arc; upper doors (plural); a door from the stair | `ss/spend:505, 514, 707`; `atlas/Tessarine_Vault.md:108` |
| The ring is below the silo bank's deck | `ss/spend:559` |
| A lower dock | `ss/spend:606, 843` |

Canon does not give the booths' numbering order or rows, the housings'
order along the arc, shelf positions, or any size.

**Options.**

- **A.** The inset draws canon topology only, each fact cited as a Canon
  claim (T30–T35 below). Arrangement within a room (booth order, housing
  order, shelf positions), sizes, and shapes are *P.A.* and assert no
  adjacency except where canon states one; the lint checks those (Booth
  Ten beside Nine). The sheet says "Arrangement approximate. Not to scale."
  - *Pro:* no future story has to honor a booth or housing order canon
    never gave. Fits D1: geometry stays cartographic.
  - *Con:* readers may still read the drawn order as fact; the sheet note is
    the only defense.
- **B.** As A, and approve the drawn arrangement (booths I–VIII on one side
  and IX–XVI on the other; housings I–IX in order along the arc) as working
  canon topology under D1.
  - *Pro:* the inset becomes authoritative for later stories.
  - *Con:* it invents adjacencies, such as which housings flank the Fourth,
    and binds stories to them.
- **C.** A labeled section diagram only, with no plans.
  - *Pro:* asserts the least.
  - *Con:* there is no silo-bank plan to zoom into, so the done-when fails,
    and the lost booths cannot be drawn.

**Recommendation: A.** D1 already splits topology from geometry; booth and
housing order are geometry canon left open.

**P1a. The lower dock.** Canon says only "lower" (`ss/spend:606, 843`).
*Recommendation:* the section key labels the dock at the Vault's lower end
and asserts no level relative to the hall or the ring.

**P1b. Where the outer doors lead.** `ss/the_reliquarists_doubt:318-320` has
Inya walk out of the audit hall, up through the middle ring past the silos,
and then reach "the lintel above the audit hall's outer doors."
`ss/spend:398, 913-914, 980` and `atlas/Tessarine_Vault.md:71` put the lintel
doors at the hall's head as its exit. The two can be reconciled by a loop,
but neither says where the outer doors open. *Recommendation:* draw the
lintel doors at the head of the hall with no passage beyond them. This is
reported, not resolved.

## P2. Lost booths, lost silos, and the other post-breach states

**Booths III, IX, XI, and XIV.** "No one can go where the booths were"
(`atlas/Tessarine_Vault.md:101`); they became "places where the eye stopped
receiving instruction" (`ss/spend:333-335`).

- **A.** Cartographic blanks: bare paper with no partition, tint, or numeral
  inside. Neighboring partitions stop short with a soft edge, since "the
  edges moved" (`ss/spend:367`). One note outside the hall, on a leader:
  "III, IX, XI, XIV: no one can go where the booths were." This is the Void
  convention: nothing charted inside, the name outside.
- **B.** Hatched as unsurveyed.
- **C.** A "lost" symbol inside each footprint.

**Recommendation: A.** A hatch or symbol would chart what canon says cannot
be charted.

**Silos IV and IX.** The Fourth housing "stood where it had always stood
... the brass was brass and the ceramic was ceramic" (`ss/spend:523-525`);
the Ninth "stood in the arc as brass and ceramic with nothing in it"
(`ss/spend:699-701`).

- **A.** Hollow: the housing's outline stands, with no fill and no pitch
  mark, labeled "lost."
- **B.** Blank, like the booths.
- **C.** Crossed out.

**Recommendation: A.** A blank would say the housing itself was forgotten,
which canon reserves for the booths. "The arc was missing a tooth"
(`ss/spend:521`) is Ilka's perception, and the hollow draws it.

**The rest of the After state (proposed; accept or edit):**

| Element | After the breach | Source |
|---------|------------------|--------|
| Housings V, VII | Half-weight fill, "reduced pitch," no figure | `atlas/Tessarine_Vault.md:110` |
| Housing II | Held; "HAEL" scored on the brass | `atlas/Tessarine_Vault.md:110-112`; `ss/spend:833-835` |
| Housings I, III, VI, VIII | Held, unchanged | "Two silos are lost to oblivion. Seven hold." (`ss/spend:12`) |
| Middle ring | Shelves drawn empty; two inner-curve shelves marked silent. No stone counts drawn: "forty," "approximately one hundred sixty," and the one withheld stone appear in the panel only (R2). | `atlas/Tessarine_Vault.md:104-107`; `ss/spend:463` |
| Audit hall | A seal line across the lintel doors; the provenance station outside it | `ss/spend:913-914, 980` |
| Where the acolyte fell | Nothing drawn: "There was no mark." | `ss/spend:561` |

## P3. The era control

**P3a. Default era.**

- **A.** After, in both builds.
  - *Pro:* the atlas calls the post-breach state "the Vault's current
    condition" that "binds later stories" (`atlas/Tessarine_Vault.md:96-97`).
    A chart defaults to its latest state.
  - *Con:* the chart opens with its two most prominent soundings reading
    *unmeasured*, and shows `story-0022`'s outcome to every reader.
- **B.** Before, in both builds.
  - *Pro:* the canon soundings show on first load.
  - *Con:* it presents a superseded state as the present.
- **C.** After in the author build, Before in the public build.
  - *Pro:* lighter on spoilers for readers.
  - *Con:* the two builds disagree about what "now" is. The sleeve panel
    already prints an "After the breach" column, so B or C does not hide
    the outcome anyway.

**Recommendation: A.**

**P3b. Isopleth values in the After view.** The isopleth lines and tints are
baked into the tiles and stay in both eras. Their live value labels can
change by era. The Drift's 0.65 "is a pre-breach measurement. No post-breach
measurement has been established" (`atlas/Helios_Drift.md:83-84`), and
every interpolated value in the Drift is anchored to it.

- **A.** In After, suppress isopleth values throughout the Helios Drift.
  The tint key and notes add "Helios Drift densities: pre-breach survey,
  not re-measured."
- **B.** Suppress them in the outer sleeve only, where canon says coherence
  fell (`ss/spend:211`).
- **C.** Keep them all, with the dated survey note.

**Recommendation: A.** It is the strict reading of R6 and the done-when.
The cost is that the default view shows the Drift with no numerals; its
tints still read through the key, and the key says how old they are.

**P3c. What each era changes (proposed; accept or edit).**

| Element | Before | After |
|---------|--------|-------|
| Vault and Drift soundings | 0.78 and 0.65 with their as-of note | *unmeasured*, on a small hatch. Driven by data: any entity whose `memory_density_as_of` cites `event-story-0022-001` |
| Sleeves IV and IX | Plain rings | Softening hatch, no figure (R9) |
| Drift isopleth values | Shown | Per P3b |
| Vault inset | 16 booths, 9 housings, full shelves | P2 states |
| Lintel | *Spend only what you can afford. Preserve what must endure.* (`ss/spend:274`) | *Spend* , a smooth space the width of one word, then *what you can afford. Preserve what must endure.* No ghost letters, no strike, no bracket: "between them was a smoothness the length of one word" (`ss/spend:1011-1014`) |
| Vault to the Navigant house route | Hidden | Shown (P4) |
| Breach event pins | Hidden | Shown (P5) |
| Panels | Before-state text first | After-state text first; neither shows a post-breach number |
| Legend | Survey note | Survey note, plus "outer sleeve coherence reduced after the breach; not re-measured" |

**P3d. No interpolation.** The control has two states and nothing between.
Inset rasters and hatch overlays crossfade by opacity only; text swaps
whole, at the crossfade's midpoint, and never tweens a number. Under
`prefers-reduced-motion` the swap is instant. The era goes into the deep-link
hash when it differs from the default. *Recommendation:* accept.

## P4. Story routes

All three routes already in `design/map/cartography.yaml` stay. Phase 4
puts them on a toggleable layer and dates them by era:

| Route | Label | Era | Change | Source |
|-------|-------|-----|--------|--------|
| *The Archivist's Wake* approach | 3 pulls, no origin | Both (not dated against the breach) | **Open tail:** the line fades in at the Gap's inner tip, with no origin mark. The three pulls are counted from the galley scene, before the Gap passage, so the drawn leg is the end of a three-pull run, not all of it. | `ss/wake:126-136`; bible §1, T1–T2; Q9; R4 |
| Vault to the Navigant house at the inner relay | 2 pulls | After only (it follows `event-story-0022-008`) | Note: "Pilot cost to be named post-run; not recorded." No figure. | `ss/spend:877, 903` |
| Skather-Ait tether | six hours | Both | None | `ss/the_light_inheritance:282` |

**How a route without canon geometry is drawn.**

- **A.** A straight chord between canon endpoints, *P.A.*, labeled with its
  canon pull count (as now).
- **B.** A computed least-cost path over the field.
  - *Pro:* looks like a corridor.
  - *Con:* it asserts a path canon never gives and blurs R10's line between
    illustrative lanes and routes.

**Recommendation: A** (R4, R10).

**Not in Phase 4:** `story-0021`'s alternate corridor, from the inner relay
to the Halix relay (`ss/receipt_for_a_voice:447-466`). It has canon
endpoints but no pull count, and it is not dated against the breach.
*Recommendation:* defer it to the Halix pass (P8). The alternative is to
draw it now, labeled "pulls not given," in both eras.

No draft routes exist, so nothing appears under **+ Speculative**.

## P5. Event pins

**Proposed rule:** a pin goes where canon places the event, at the coarsest
place canon gives: a route leg, an inset room, or a site, never a finer
point. An event canon places nowhere is listed in a panel, not pinned. An
event shows in an era only if canon dates it there; events not dated
against the breach show in both. Site-level events get no separate Z2 pin;
the site's panel lists them, as it does now.

| Event | Pinned at | Era | Basis |
|-------|-----------|-----|-------|
| `event-0001` | Not pinned (baseline) | — | `data/timeline/events.yaml` |
| `event-0002` (T0), `event-0003` (T1) | Not pinned: before the drawn leg. Listed in the Wake route's panel. | Both | bible §1 |
| `event-0004` (T2, Gap passage) | Wake route, inside the Gap | Both | bible §1; `ss/wake:135-155` |
| `event-0005` (T3, approach) | Wake route's end | Both | bible §1; `ss/wake:156-176` |
| `event-0006` (T4, docking) | Heliodrome inset: the hatch | Both | `ss/wake:177-178` |
| `event-0007` (T5, departure) | Heliodrome inset, sheet level | Both | `ss/wake:195-196` |
| `event-story-0008-001` to `-004` | Vault inset: audit hall | Both | `ss/the_reliquarists_doubt:134-142, 200, 216` |
| `event-story-0022-001` | Audit hall | After | `atlas/Tessarine_Vault.md:99-102` |
| `event-story-0022-002`, `-004` to `-007` | Silo bank | After | `ss/spend:505-835` |
| `event-story-0022-003` | Silo bank, the room only, not the spot | After | `ss/spend:552-561` |
| `event-story-0022-008` | Lower dock | After | `ss/spend:843-903` |
| `event-story-0012-*` | Not pinned: the station is not drawn (Q11, T28). Black Horizon panel, as now. | — | |
| `event-story-0013-*` | Not pinned: no site. Helios Drift panel, as now. | — | |

The Wake's events (`event-0002` to `event-0007`) carry no
`involved_entities`, so their anchors live in the placement file with bible
and story line sources. `data/timeline/events.yaml` does not change.

**Options.** **A**, the table above. **B**, a pin for every event at its
site at Z2 (twelve pins on the Vault's point). **C**, route pins only.
**Recommendation: A.**

## P6. The Z0 universe scaffold

- **A.** A separate procedural raster, in the chart's dark-paper style,
  behind the galaxy sheet and reached by zooming out past the current home
  view.
  - It draws dark-matter filaments, unlabeled (R8, Q13;
    `mechanics/MEMORY_PHYSICS.md:128-133`), thinning outward as dark
    energy's "forgetting in motion" (`mechanics/MEMORY_PHYSICS.md:135-139`).
  - The home galaxy is a small disc inside an index-chart limits box
    labeled with the sheet's own title, THE KNOWN GALAXY. Canon calls it
    "the known galaxy" (`atlas/Helios_Drift.md:69`) and names it nothing
    else.
  - No other galaxies (T12): filament knots stay no brighter than the
    filaments, with no discs or spirals, and a test checks that.
  - No Heavonly gateways, in either build.
  - The label is not "Memory Web": that name has the Core at its center
    (`atlas/Mnemosyne_Lattice_Core.md:45`), so it is galactic, not the
    universe's scaffold.
- **B.** As A, plus Heavonly's gateways in the author build under
  **+ Speculative**.
- **C.** Drop Z0 from Phase 4.

**Recommendation: A.** D4 keeps Heavonly speculative and the galaxy count
unsettled. Three gateway lines would assert the count the novel has not
settled: "gateway to three galaxies" (`atlas/Heavonly.md:13`) against "the
jumping off point for three other galaxies"
(`stories/novel/NOVEL_FORGOTTEN_TIDES/scenes/SCENE_541938A8FD6140A456619C4030B828CCC5AC4298.md:54`).
The cost is that Z0 is atmosphere only.

## P7. Heliodrome inset content

**Primary canon** (`story-0001`): arrays that jitter, with Array Two named
(`ss/wake:156-158`); the corridor release "a hundred meters from Array Two"
(`ss/wake:158`); a dock and hatch with a manual latch (`ss/wake:159,
177-178`); a catwalk (`ss/wake:185`). The atlas adds that "corridors forget
their purpose, decks lose their alignment" (`atlas/Heliodrome.md`).

**Draft only:** Deck Six as "a clean amber loop around the residential
core," the eastern stairwells, Stairwell Nine, and the service hall behind
the water office (`ss/the_lie_that_learned_the_hallway:142-145`); the west
loop (`:228-236`); Stairwell Nine again
(`ss/the_public_weight_of_a_private_lie:453, 477`); and 80,000 residents
(`:223`). Both stories are `draft`. **Correction to plan §5.3:** "Deck six"
in `ss/the_liturgy_of_rust:90` is Ostra-Vael's, not the Heliodrome's; that
story is set at Ostra-Vael (`:38`).

- **A.** A primary-only inset in both builds. The author build's panel
  lists the draft names with their sources but draws none of them.
- **B.** Primary content in both builds, plus the draft features drawn
  dashed and faded under **+ Speculative**, in the author build only (plan
  §5.3).
- **C.** Defer the Heliodrome inset until `story-0014` and `story-0016` are
  reviewed.

**Recommendation: A.** Drawing Deck Six as a loop around a residential
core, with a west loop and Stairwell Nine, needs topology from two drafts
that may change at review, and CLAUDE.md treats draft facts as prior claims,
not canon. The primary content is thin but real.

- The whole station prints out of register, like the Gap: it is
  "conceptually misaligned" (`ss/wake:158`).
- "A hundred meters" is the corpus's only canon distance. It goes on a note
  with a leader from Array Two, not as a drawn point, so the inset gets no
  implied scale.
- The era control does not touch the Heliodrome.

## P8. H-37 and the other inset candidates

**H-37 (`loc-0016`).** It is a primary-canon artifact, and the lint exempts
artifacts from placement (`scripts/lint/cartography_lint.js:189`). Canon
gives "Helios Drift internal corridor" (`ss/the_loss_ledger:181`), freight
booked "from the inner Drift" (`ss/receipt_for_a_voice:159`), no
destination, and a suspended certification, not dated against the breach.
Plan §1.2 still lists it as draft; `story-0017` and `story-0021` are now
primary.

- **A.** List view and search only: an "Artifacts" group with a panel
  (status, stories) and no geometry.
- **B.** Draw it as a route from the inner relay to Halix. The destination
  is an inference and needs approval, and it blurs R10.
- **C.** Leave it out of Phase 4.

**Recommendation: A.** It is cheap, asserts nothing, and leaves no
primary-canon location missing from the list view.

**Halix Exchange and the Skather-Ait pod.** Both have been primary canon
since PR #45; plan §5.3 still calls them speculative. Their canon interiors
include:

- Halix's four-kilometer hull, fourth-deck inheritance quarter, tuning
  booths, and shuttle dock (`atlas/Halix_Exchange.md:14, 56-63`);
- the "Halix relay" (`ss/receipt_for_a_voice:466`);
- the pod's coherence-frame mesh (`atlas/Skather-Ait_Pod.md:9, 33`).

*Recommendation:* queue both insets, with `story-0021`'s corridor leg, for a
later pass; Phase 4 stays with the Vault and the Heliodrome. Ostra-Vael is
still speculative and gets no inset.

## P9. Layer toggles

New toggles: **Story routes**, **Event pins**, **Insets**, and **Isopleth
values** (the live labels).

- The tints, isopleth lines, lanes, eddies, and knots are baked into the
  tiles and stay on. Toggling them would need separate tile layers, which
  Phase 4 does not build.
- Factions are not drawn yet, so there is no factions toggle.
- All toggles default to on, and their state goes into the hash.

*Recommendation:* accept.

## P10. The public build

| Element | Public build |
|---------|--------------|
| Vault inset, both eras | Included: all primary canon |
| Heliodrome inset | Primary content only. Its raster renders separately per build, as the tiles do; draft names are absent from both data and raster. |
| Wake, Vault–Navigant house, and tether routes | Included |
| Event pins | Primary- and working-canon events only (every pin in P5 is primary) |
| Era control | Included, with the same default |
| Z0 | Identical in both builds; nothing speculative |
| H-37 list entry | Included |

Every inset and Z0 renderer, and every data step, takes the build. A test
renders the public files and checks that no draft or speculative source or
name appears in them.

## Register entries if accepted

**Claims (Canon, each cited above):**

- **T30:** the Vault's vertical order.
- **T31:** the audit hall: sixteen booths along an aisle, the provenance
  station at the head under the lintel doors, and Booth Ten beside Nine.
- **T32:** the service stair from the hall to the ring and on to the silo
  bank.
- **T33:** the middle ring: inner and outer curves, and a storeroom off it.
- **T34:** the silo bank: nine housings in a shallow arc, upper doors, and
  the ring below its deck.
- **T35:** the lower dock.
- **T36:** the Heliodrome's arrays, Array Two, the release a hundred meters
  off, the hatch, and the catwalk.

**Rules:**

- **R12:** inset geometry asserts only cited topology; arrangement within a
  room is *P.A.*; insets have no scale.
- **R13:** lost booths are blanks; lost silos are hollow; reduced and held
  states carry no figure.
- **R14:** the era is two states keyed to `event-story-0022-001`, never
  interpolated. Soundings dated before the breach read *unmeasured* after it.
- **R15:** event pins sit at the coarsest place canon gives.
- **R16:** Z0 is an unlabeled scaffold, with no other galaxy and no gateway.

## Technical choices (not author decisions)

These do not touch canon. They proceed unless the author objects.

- **Insets.** SVG generated in code, rasterized with `sharp`, and tiled to
  DZI per inset, era, and build (`npm run map:insets`, writing to
  `out/map/insets/`). The tiles go into OpenSeadragon as extra tiled images
  at the site, fade in by zoom, and are served by `scripts/serve_map.js`
  under its existing path-safety rules. Labels stay live overlays from the
  data.
- **Z0.** Built by the same pipeline. The home view stays at Z1, so hashes
  and label zoom levels keep their meaning.
- **Viewer logic.** Era resolution, pin anchoring, and toggle state go in
  `map/viewer_core.js`, with Node tests. Playwright covers the era control,
  insets, routes, and pins.
- **Lint.** Every inset element, pin anchor, era state, and Z0 element must
  cite a claim, rule, or source, or the lint errors. Era states are enums;
  a number in one is an error.

## Findings (reported, not acted on)

1. **The current chart mixes eras.** The viewer draws the Fourth and Ninth
   Sleeves' softening rings at all times (`map/viewer.js:100-103`), beside
   soundings marked pre-breach. The era control fixes this.
2. **Plan §5.3 is stale.**
   - Halix and Skather-Ait are primary canon.
   - The Heliodrome deck details are from drafts (P7).
   - The Deck Six in `story-0005` belongs to Ostra-Vael.
3. **Plan §1.2 lists H-37 as draft.** Its stories are now primary.
4. **The path to the lintel is ambiguous.** `ss/the_reliquarists_doubt:318-320`
   differs from `ss/spend:913-914, 980` (P1b).
5. **The Wake's three pulls start before the Gap.** They are counted from the
   galley scene, but the drawn leg starts inside the Gap
   (`routes[archivists-wake-approach]`). Q9 stands; P4 proposes the open
   tail.
