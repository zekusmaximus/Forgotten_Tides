# Atlas Map Plan — 2026-10-29

## Summary

This plan covers a high-resolution, zoomable chart of *The Forgotten Tides*,
built from the repository's own location data.

- **The canon describes topology, not geometry.** There are 15 location
  entities. Eight are canonical: six regions plus the Heliodrome and the
  Tessarine Vault. Seven are speculative. No file gives a coordinate, a
  distance, or a travel time between regions. Any map has to invent the
  geometry, and that geometry would be a new spatial claim. The richest canon
  structure is inside the Helios Drift: the inner relay, the mid-sleeve, and
  an outer sleeve split into nine numbered sleeves with populations, all from
  primary canon. The author owns the new claims, so the first phase is a
  cartographic brief and a set of author decisions, not code.
- **Recommended concept: a memory-density chart, not a star map.** In this
  universe memory is gravity. The chart's terrain is the memory-density field,
  pinned to the locked `memory_density` values. It is drawn as a nautical
  chart: isopleths instead of depth contours, measured soundings only where
  canon gives a number, corridors as shipping lanes, and Void Regions left
  blank because nothing there can be charted.
- **Recommended stack:** a Node build pipeline (`gray-matter` and `js-yaml`
  are already dependencies; add `sharp` and `simplex-noise`). It renders a
  procedural deep-zoom tile pyramid directly, tile by tile, on worker threads.
  OpenSeadragon displays the pyramid, and live SVG/HTML overlays generated
  from repository data supply labels, regions, corridors, and detail panels.
  Hosting is static: the Hetzner VPS behind Caddy, or object storage.
- **Keep placements out of the atlas entity files.** Put positions and shapes
  in a separate cartography file, `design/map/cartography.yaml`. Every
  placement records its basis: a canon citation, a draft citation, or
  cartographic license. A lint checks the chart against canon, including
  checking that the rendered density field reproduces each location's locked
  `memory_density`.
- **Resolution target:** a 65,536 × 65,536 px galaxy layer (4.3 gigapixels),
  with nested insets for sites that have canon interiors. A benchmark in this
  session puts the procedural base at about 13 CPU-minutes per layer on 4
  cores. That means hours of rendering, not days, and no GPU is needed.

## 1. What Exists Now

*Update, 2026-10-29:* After this section was written, PR #45 approved
Halix Exchange (`loc-0013`) and Skather-Ait pod (`loc-0015`) as primary
canon, and PR #46 promoted `story-0015`. Rows below that call those sources
speculative or draft reflect the earlier state. `design/map/CARTOGRAPHIC_BRIEF.md`
is current.

### 1.1 Location inventory

From `CANONICAL_INDEX.md` and the `atlas/` frontmatter. "Tier" is the index
tier; densities are the frontmatter values, locked for the primary-canon
entries.

| ID | Name | Type | Tier | `coordinates.region` | `memory_density` | Spatial statement in its own file |
|----|------|------|------|----------------------|------------------|-----------------------------------|
| `loc-0005` | Mnemosyne Lattice Core | region | primary | self | 0.97 | "the gravitational center of the Memory Web" |
| `loc-0008` | Helios Drift | region | primary | self | 0.65, pre-breach | "a broad belt"; "at its outer sleeve, where memory density thins and void margins begin to press inward" |
| `loc-0003` | Lattice Gap | region | primary | self | 0.31 | "where the Memory Web is tearing" |
| `loc-0004` | Remnant Seas | region | primary | self | 0.04 | none |
| `loc-0006` | Void Regions | region | primary | self | 0.00 | plural; "not destinations but outcomes" |
| `loc-0007` | Black Horizon | region | primary | self | 0.01 | "the galactic perimeter"; Archivist stations "on the near edge" |
| `loc-0001` | Heliodrome | station | primary | Lattice Gap | 0.31 | "at the epicenter of the Gap's worst fracture zone" (`atlas/Lattice_Gap.md`) |
| `loc-0011` | Tessarine Vault | structure | primary | Helios Drift outer sleeve | 0.78, pre-breach | "attached to the Helios Drift outer sleeve"; full vertical interior |
| `loc-0013` | Halix Exchange | ship | speculative | Helios Drift outer sleeve | 0.56 | "four-kilometer bazaar-ship" |
| `loc-0015` | Skather-Ait pod | structure | speculative | none | none | "an outer sleeve of the Helios Drift"; "six-hour tether shuttle" to Halix |
| `loc-0002` | Ostra-Vael | station | speculative | Remnant Seas | 0.30 | "on the edge of the Remnant Seas"; seven decks |
| `loc-0012` | Narthex of Low Mercy | station | speculative | Black Horizon | 0.015 | "inside the Black Horizon" |
| `loc-0010` | Solace Hospice | station | speculative | none | none | "orbiting the Lattice Gap's outer sleeve" |
| `loc-0014` | Heavonly | station | speculative | not a region name (see 1.4) | 0.82 | "gateway to three galaxies" |
| `loc-0009` | Ebbhaven | region | speculative | none | none | "no longer exists as a physical place"; its buoy "drifted into the outer Tides" |

The location schema (`docs/schemas/location.schema.json`) defines `region`,
`sector`, `memory_density`, and `memory_density_as_of` under `coordinates`.
No file uses `sector`. The top level of the schema is closed
(`additionalProperties: false`), but `coordinates` is not, so an `x`/`y` pair
there would pass validation today. Section 3.1 explains why positions should
still not go there.

### 1.2 Spatial facts elsewhere in the corpus

A sweep of `stories/`, `bible/`, `mechanics/`, `manuals/`, `lore/`,
`factions/`, `characters/`, the timeline, and the lexicon turned up the
following. Tier: **P** means a primary-canon story, **C** means a canonical
entity, mechanics, or manual file, and **D** means a draft. Paths shortened
to `ss/<slug>` are `stories/short_story/<slug>/manuscript.md`.

**Helios Drift structure.** This is the richest seam, and almost all of it is
primary canon.

| Fact | Tier | Source |
|------|------|--------|
| "The Helios Drift's outer sleeve was a deep-orbit ring"; Sleeve Four "had no harbors," with "a single hydroponic spine" | P | `ss/the_reliquarists_doubt:206` |
| The silo bank's "nine housings," one per sleeve, hold the outer sleeve's civic memory for "more than a quarter of a million people" | P | `ss/spend_what_you_can_afford:505-512` |
| A sleeve holds "stations and tethers and the small pods that clung to its edges" | P | `ss/spend_what_you_can_afford:509-510` |
| Populations: Second, "Eleven stations and the city-ship. Two hundred thousand"; Fifth, eighty thousand; Seventh, "Forty. A little more."; Ninth, "Four stations. Nine hundred." The Fourth is not given. | P | `ss/spend_what_you_can_afford:650-663` |
| "a coastal-adjacent sector of the Helios Drift mid-sleeve" | C | `characters/Inya_Solven.md:90` |
| From the Vault: "The Navigant house at the inner relay. Two pulls." | P | `ss/spend_what_you_can_afford:903` |
| "Drift control" assigns corridor mouths | P | `ss/the_smallest_burn:207`; `ss/spend_what_you_can_afford:607` |
| The Skather-Ait–Halix tether is "a six-hour ride on a thin filament" with "no Memory Drive," shared with "two other Drift Clade pods and one Remembrancer outstation." Halix shows as a smear at the third hour. | P | `ss/the_light_inheritance:282-292` |
| Skather-Ait and Halix are "both moored in an outer sleeve of the Helios Drift" | P | `ss/the_light_inheritance:42` |
| "the corridor between Halix and the lattice" | P | `ss/the_light_inheritance:168` |
| "the Helios Drift turned its slow blue weight, and an unremembered star did its work at the center of nothing" | P | `ss/the_light_inheritance:290` |
| Radial order: "clade pods held against the Drift. Farther in, Consortium nodes… Between them, Halix…" | D | `ss/the_halix_aftermarket:850-852` |
| "Halix is on the outer ring" | D | `ss/the_tuner_of_last_lights:100` |
| Route chart H-37, an internal Drift corridor from the "inner Drift" to Halix | D | `ss/the_loss_ledger:166`; `ss/receipt_for_a_voice:157` |

**Lattice Gap.**

| Fact | Tier | Source |
|------|------|--------|
| Corridor run, then Gap passage, then Heliodrome approach; "We have three pulls to reach them"; shear at "Eight degrees," with collapse at ten | P | `ss/the_archivists_wake:126-131`; events `event-0004`, `event-0005` |
| "The corridor released us a hundred meters from Array Two" | P | `ss/the_archivists_wake:158` |
| "a small fishing colony on a moon in the Lattice Gap's near sleeve," scoured 180 years before Tellis Aru's birth | P | `ss/the_reliquarists_doubt:208` |
| The Heliodrome's "eighty thousand residents" | D | `ss/the_public_weight_of_a_private_lie:223` |

**Black Horizon.**

| Fact | Tier | Source |
|------|------|--------|
| An unnamed abandoned Synod-release station | P | `ss/the_mercy_doctrine:34` |
| Tern Gate Station, with an evacuation corridor and the lost auxiliary *Vesper* | D | Doctrine scenes 006:260, continuity brief |
| "Near-edge beacon. Then fleet jurisdiction."; "the secret at its far edge… among black-hole superclusters" | D | Doctrine scenes 009:178, 007:500-501 |

**Galaxy and beyond.**

| Fact | Tier | Source |
|------|------|--------|
| "cruise corridors to opposing spiral arms"; a ship "bound for the other side of the galaxy"; Heavonly "the jumping off point for three other galaxies"; "corridor cruisers… long hauls between galaxies" | D | `stories/novel/NOVEL_FORGOTTEN_TIDES/scenes/SCENE_541938A8FD6140A456619C4030B828CCC5AC4298.md:32, 52, 54` |
| Eddy alert at "proximity < 3 AU" | C | `manuals/PILOT_MANUAL.md:308` |
| "a drift sphere 12 AU wide" | no frontmatter | `lore/theology/OBLIVION_HERESIES.md:78` |

**The unit of corridor travel is undefined.** Primary canon counts corridor
runs in *pulls*: three to the Heliodrome, two from the Vault to the inner
relay, and three inside one watch in `ss/the_smallest_burn`. The word is not
in `data/lexicon/terms.yaml`, and a draft uses "third pull" as a time of day
(`ss/the_hospice_knot:429`). The chart can label route legs in pulls where
canon gives them, without converting pulls to distance.

**Other named places with no entity file** (all draft): Waystation Commercial
Hub 11-C, "The Beige" (`ss/memoir_of_a_nobody`); the High Archives
(`ss/the_liturgy_of_rust`); "the Tides" as an outer-reaches region
(`ss/the_anchorless_tide:11`); and the ships *Raoniar*, *Iron Vow*, *Quiet
Drift*, *Pell*, and *Vesper*.

**Interior detail usable for insets:** the Heliodrome's Array Two (P), and its
Deck Six spine, west loop, and Stairwell Nine (D,
`ss/the_lie_that_learned_the_hallway`); the Lattice Core's numbered tiers,
where "inward tiers carried more memory-mass" (D,
`ss/the_error_that_remembered_itself:469-470`); and Heavonly's Bay Twelve and
Level Seven (D).

### 1.3 What the canon does not say

- Where any region sits relative to any other region, except that the Core is
  central, the Black Horizon is the perimeter, and the Drift's outer sleeve
  borders void margins.
- Any distance or scale between regions. The only clock time is the six-hour
  Skather-Ait–Halix tether. Corridor runs are counted in pulls, an undefined
  unit (see 1.2).
- The galaxy's shape. "Galactic perimeter," "center," and "broad belt" fit a
  disk with a radial gradient. Only a draft novel scene mentions "spiral
  arms."
- Whether the chart is two- or three-dimensional.
- The names or positions of the three galaxies Heavonly connects to.
- What lies inside the Black Horizon. Story-0012's continuity notes say "the
  Black Horizon perimeter mystery remains unrevealed." The chart must not
  resolve it.

### 1.4 Contradictions and ambiguities to resolve

None of these block the plan, but each one blocks placing at least one
location.

1. **Solace Hospice has four placements.** The atlas puts it "orbiting the
   Lattice Gap's outer sleeve" (`atlas/Solace_Hospice.md:11`). The drafts
   put it "At the edge of the Lattice Gap" (`ss/the_hospice_knot:11`), "at
   the edge of the Void Regions" (`ss/the_navigator_who_forgot_enough:54,
   152`), and "on the outer rim of the Helios Drift"
   (`ss/the_tuner_of_last_lights:12`). All four are speculative or draft.
   Primary canon mentions "a Solace outstation" on the Halix tether
   (`ss/the_light_inheritance:364`), so several Solace sites may be the
   reconciliation.
2. **The Helios Drift's scale.** The atlas calls it "a broad belt" in "the
   known galaxy" (`atlas/Helios_Drift.md`). Primary canon calls its outer
   sleeve "a deep-orbit ring" (`ss/the_reliquarists_doubt:206`) with "an
   unremembered star… at the center" (`ss/the_light_inheritance:290`). It
   could be a galactic belt of many systems or an orbital ring system around
   one star. The answer decides whether the Drift is a Z1 region or a Z2
   system, and what "two pulls" to the inner relay means.
3. **"Sleeve" is used at several levels.** Radial bands (inner relay,
   mid-sleeve, outer sleeve); numbered sleeves, at least nine, inside the
   outer sleeve; "an outer sleeve" in the Skather-Ait summary, which implies
   there is more than one; a "near sleeve" of the Lattice Gap
   (`ss/the_reliquarists_doubt:208`) and the Hospice's "Lattice Gap's outer
   sleeve," which give the Gap sleeves too. The draft
   `ss/the_navigator_who_forgot_enough:152` also uses "outer sleeve" for part
   of a station.
4. **Heavonly.** Its `coordinates.region` holds a description, not a region
   name (`atlas/Heavonly.md:37`), so no containment check can use it. It is
   "gateway to three galaxies" in the atlas and "the jumping off point for
   three other galaxies" in the novel scene: either three galaxies in total
   or four. The draft's routine "long hauls between galaxies" also strains
   `mechanics/CORRIDOR_MECHANICS.md` §6.3: inter-galactic travel "costs
   generational or cultural memory—never attempted lightly."
5. **Ostra-Vael** is filed with `coordinates.region: Remnant Seas`, which
   puts it inside the region. Its summary says "on the edge of," and its
   story says "near" (`ss/the_liturgy_of_rust:38`) and "perched on the edge
   of" (`:84`). The chart can place it on the boundary, but the region field
   and the prose disagree.
6. **Black Horizon superclusters.** Canon uses "black-hole superclustering"
   at a *galactic* perimeter (`atlas/Black_Horizon.md`). Real superclusters
   are larger than galaxies, so the art should draw dense knots of black
   holes rather than literal superclusters, unless the author means the
   Horizon to be extragalactic.
7. **Missing coordinate blocks.** Skather-Ait pod and Solace Hospice have no
   `coordinates`, and Ebbhaven is a `region` that "no longer exists as a
   physical place." Ebbhaven maps naturally as an *E.D.* marker at the
   buoy's last contact.
8. **Minor.** Halix is "moored" (P, `ss/the_light_inheritance:42`) but
   "moved… through the outer sleeve" (D, `ss/the_halix_aftermarket:851`). A
   bazaar-ship can do both. The Halix tether carries two other pods and an
   outstation (P, `:282`), against "three pods" (D,
   `ss/receipt_for_a_voice:212`).

### 1.5 Existing assets to reuse

- **Design tokens.** `ui_kits/colors_and_type.css` already defines the void
  scale, ink scale, memory amber, entity colors, and corridor-state colors
  (`--state-stable` through `--state-oblivion`), plus Cormorant Garamond and
  IBM Plex. The chart should use them unchanged. Its location red
  (`--entity-location`) is marked "do not remap."
- **Speculative styling.** The Continuity Dashboard draws speculative nodes
  dashed and faded (`dashboard/README.md`). The chart should use the same
  rule, so a viewer reads tiers the same way in both tools.
- **Relationship data.** `REFERENCE_MAP.json` already links each location to
  its stories, characters, and factions. Detail panels can come straight from
  it.
- **Events.** `data/timeline/events.yaml` events carry `involved_entities`
  with `loc-` IDs (for example, `event-story-0008-001` names `loc-0011` and
  `loc-0008`). That is enough for event pins and a story-route layer.
- **Server pattern.** `scripts/serve_dashboard.js` exports
  `createDashboardServer({ routes })` with a symlink- and traversal-safe asset
  resolver. A map server can reuse it. Tiles need a prefix route; the
  dashboard's exact-path allowlist cannot list 90,000 files.
- **Canonical home.** `design/README.md` reserves `design/` for "maps,
  diagrams, visual schematics," and `atlas/README.md` expects "supporting
  maps/diagrams." Neither directory has any yet.

## 2. Design Concept: The Coherence Chart

The universe's physics suggests a map form. Memory is mass, coherence is a
measurable field, and corridors form "through gradients of memory density"
(`mechanics/CORRIDOR_MECHANICS.md` §1, §8). The chart therefore draws that
field the way an Admiralty chart draws the sea floor. The visual rules below
come from canon text, so the art does not add metaphysics.

### 2.1 Chart conventions

- **Isopleths of memory density** in place of depth contours. They are
  interpolated, and the legend says so.
- **Soundings** (small mono numerals, such as `0.31`) appear only at locations
  with a locked `memory_density`. Every other number on the chart is a
  contour label for an interpolation band. This keeps the chart from
  inventing measurements.
- **Pre-breach soundings** at the Tessarine Vault and Helios Drift carry the
  `memory_density_as_of` note. After the breach they read *unmeasured* and are
  hatched. That matches the decision recorded in
  `docs/PROCESS_REVIEW_STORY_DRAFTING_2026_10_20.md` §7 (follow-up of
  October 27) and invents no post-breach figure.
- **Position notes** use real chart abbreviations. *P.A.* (position
  approximate) marks a placement that rests on cartographic license, *E.D.*
  (existence doubtful) marks Ebbhaven's last buoy contact, and an unmarked
  position is fixed by canon. The in-world reading and the provenance reading
  agree.
- **No distance scale bar.** The legend can carry the three travel classes
  from `mechanics/CORRIDOR_MECHANICS.md` §6 (intra-system, intra-galactic,
  inter-galactic) as a route-cost key. Corridors are coded by what a crossing
  spends, not by how long it is. Route legs that canon counts carry their
  pull count, for example "2 pulls" from the Tessarine Vault to the inner
  relay.
- **Population notes** come only from canon figures, such as the Second
  Sleeve's two hundred thousand. They sit beside sleeve names at Z2 the way
  a chart notes a harbor's facilities.

### 2.2 Region treatments, each tied to its source text

| Region | Treatment | Source |
|--------|-----------|--------|
| Mnemosyne Lattice Core | Tightly packed isopleths, crisp high-contrast line work, the densest and brightest star field. | "heavy gravitational pull"; "The architecture remembers everything." Stars' luminosity correlates with preserved memory (`mechanics/MEMORY_PHYSICS.md` §3.1). |
| Helios Drift | A warm amber belt: city-ship lights, a dense corridor-lane network, eddy glyphs, numbered sleeves as bands that fray at the outer edge. | "broad belt"; "dense corridor networks"; "frequent eddy formations"; "void margins begin to press inward." |
| Lattice Gap | Misregistered line work. Contours and labels print twice with a slight offset, corridor lanes break at harmonic seams, and the eddy glyphs face toward memory. | "conceptual fracture"; "disrupted corridor harmonics"; conceptual shear causes "perceptual duplication" (`CORRIDOR_MECHANICS.md` §5.2); eddies "follow memory scent." |
| Remnant Seas | Stars drawn as dim cinders with scar-tissue streaking and scattered glints of reliquary shards. | "the stellar mass persists"; "memory-scar tissue"; "drifting reliquary shards." |
| Void Regions | Nothing: no grid, contours, stars, or label inside the boundary. The name sits outside on a leader line, and the cursor readout shows a dash. | "no gravitational reference frame"; "no narrative." |
| Black Horizon | Isopleths stretch outward and the ink bleeds off the edge of the chart. Synod territory is hatched, black-hole superclusters appear as lensing knots, and the interior is left uncharted. | "dark energy dominates"; "memory bleeding"; "black-hole superclustering"; the perimeter mystery stays unrevealed. |

At universe zoom, a faint filament scaffold sits under everything. Dark matter
is "the unconscious archive" that "generates gravitational scaffolding"; dark
energy is forgetting that "pushes existence apart" (`MEMORY_PHYSICS.md`
§3.3–3.4).
This works as background texture with or without the author naming the
neighboring galaxies.

### 2.3 Semantic zoom

Zooming moves through four levels of detail rather than one literal scale. A
universe spanning galaxies down to booth-sized rooms covers more than twenty
orders of magnitude.

| Level | Shows | Content source |
|-------|-------|----------------|
| Z0 Universe | Cosmic web, the home galaxy, optionally Heavonly's three gateways | Mechanics §3; author decision 4 |
| Z1 Galaxy | Six regions, isopleths, region names on curved baselines, faction zones | Atlas regions, `lore/COSMIC_REGIONS.md` |
| Z2 Region | Stations, ships, structures, numbered sleeves, corridor lanes, eddies, event pins | Atlas sites, story-0022 sleeves, timeline events |
| Z3 Site | Interior insets that fade in at their location | Atlas body text (see 5.3) |

### 2.4 Canon lens

A three-position control: **Primary** (default), **+ Working**, and
**+ Speculative**. Speculative entities and draft-only routes are dashed and
faded, as on the dashboard. This answers "approved locations" directly: the
default view shows only what the author has approved, and drafts are one
click away, visibly marked as drafts.

## 3. Data Model

### 3.1 Why a separate cartography file

- The eight canonical atlas entries are `primary_canon`, which `CLAUDE.md`
  treats as locked. Coordinates added to any atlas file would read as canon.
  The open `coordinates` object would accept them, so nothing would mark
  them as interpretation.
- Most placements are cartographic license. They need provenance on each
  entry, which frontmatter has no place for.
- Region-name strings such as "Helios Drift outer sleeve" need a mapping to
  shapes and sub-bands that belongs to the chart, not to the entity.

### 3.2 `design/map/cartography.yaml` (proposed)

```yaml
schema_version: v0.1.0
frame:
  # Unitless chart coordinates, origin at the Core's center. 1.0 is the inner
  # edge of the Black Horizon. No canon distance is implied.
  units: chart_radius
  layout_approved: false        # author decision 1; flips the P.A. notes off

regions:
  - id: loc-0005                # Mnemosyne Lattice Core
    shape: { type: disc, center: [0, 0], radius: 0.12 }
    basis:
      - kind: canon
        claim: "the gravitational center of the Memory Web"
        source: atlas/Mnemosyne_Lattice_Core.md
      - kind: cartographic
        claim: "radius 0.12"

  - id: loc-0008                # Helios Drift
    shape: { type: annulus, center: [0, 0], inner: 0.18, outer: 0.62 }
    bands:                      # author decisions 2 and 5: scale and sleeves
      - { key: inner-relay, from: 0.18, to: 0.30, basis: canon,
          source: stories/short_story/spend_what_you_can_afford/manuscript.md }
      - { key: mid-sleeve,  from: 0.30, to: 0.46, basis: canon,
          source: characters/Inya_Solven.md }
      - key: outer-sleeve       # "a deep-orbit ring"
        from: 0.46
        to: 0.62
        basis: canon
        source: stories/short_story/the_reliquarists_doubt/manuscript.md
        subbands: 9             # numbered outward; see decision 5
    region_aliases: ["Helios Drift", "Helios Drift outer sleeve"]

sites:
  - id: loc-0011                # Tessarine Vault
    position: [0.55, -0.14]
    within: loc-0008/outer-sleeve
    basis:
      - kind: canon
        claim: "attached to the Helios Drift outer sleeve"
        source: atlas/Tessarine_Vault.md
      - kind: cartographic
        claim: "angular position along the sleeve"
    inset: design/map/insets/tessarine_vault.svg

features:                       # canon features with no entity file
  - key: drift-sleeve-4
    label: "Sleeve Four"
    within: loc-0008/outer-sleeve
    eras:
      pre-breach: held
      post-breach: oblivion     # event-story-0022-002; no density figure
    basis:
      - kind: canon
        source: data/timeline/events.yaml#event-story-0022-002

routes:
  - key: archivists-wake
    story: story-0001
    events: [event-0004, event-0005, event-0006]
    path: [[0.66, 0.30], [0.71, 0.36], [0.74, 0.41]]
    basis: [{ kind: cartographic, claim: "route geometry" }]
```

The file never repeats `memory_density`. The build reads densities from
frontmatter, so there is one source for each number.

### 3.3 Generated `out/map/atlas.json`

`npm run map:data` merges the following and writes to `out/` (gitignored), in
line with the generated-file boundaries in `docs/STATUS.md`:

- atlas frontmatter: name, type, tier, summaries, `memory_density`,
  `memory_density_as_of`
- `REFERENCE_MAP.json` edges, giving the stories, characters, and factions for
  each location
- timeline events whose `involved_entities` include a `loc-` ID
- `design/map/cartography.yaml`

### 3.4 `npm run lint:map` (proposed `scripts/lint/cartography_lint.js`)

| Rule | Severity |
|------|----------|
| Every `id` resolves to an atlas entity, and every `source` path exists | error |
| A site whose `coordinates.region` names a region lies inside that region's shape, after alias mapping | error |
| **Density fidelity:** the field function, evaluated at each site and at each region's centroid, reproduces the locked `memory_density` within ±0.02 | error |
| No placement shows a speculative or draft source as canon | error |
| No era state carries a number the frontmatter lacks | error |
| A primary or working canon location has no placement | warning (author decision 10 may raise it to an error) |
| A cartographic placement remains while `layout_approved: false` | info; the chart shows *P.A.* |

The density-fidelity rule is what makes the art canon-bound. The renderer and
the lint import the same `scripts/map/field.js`. If a later story moves a
locked density, the chart either re-renders to match or fails the lint.

## 4. Rendering Pipeline

### 4.1 Approach: render each pyramid tile directly

A 65,536² RGBA canvas is about 17 GB, which is too large to assemble in
memory. The renderer instead computes each Deep Zoom (DZI) tile
independently. For level *L*, column *c*, and row *r*, it maps the tile's
pixels to chart coordinates, evaluates the field and layers at those points,
and encodes the result with `sharp`. The approach has four useful properties:

- Memory per worker stays constant.
- Tiles parallelize across `worker_threads`.
- **Level of detail comes free.** Each level evaluates only the noise octaves
  its pixel size can show, so coarse levels never alias.
- It runs the same way on Windows PowerShell, because `sharp` ships prebuilt
  `win32-x64` binaries and nothing shells out.

```js
// scripts/map/render_tiles.js (sketch)
const sharp = require('sharp');
const { evaluate } = require('./field'); // shared with lint:map

async function renderTile(level, col, row, opts) {
  const { size, tile, maxLevel } = opts;
  const scale = 2 ** (maxLevel - level);             // source px per level px
  const levelSize = Math.ceil(size / scale);
  const w = Math.min(tile, levelSize - col * tile);
  const h = Math.min(tile, levelSize - row * tile);
  const px = Buffer.alloc(w * h * 4);
  const octaves = Math.max(1, opts.octaves - (maxLevel - level)); // band-limit
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cx = ((col * tile + x + 0.5) * scale) / size * 2 - 1; // chart -1..1
      const cy = ((row * tile + y + 0.5) * scale) / size * 2 - 1;
      const [r, g, b, a] = evaluate(cx, cy, { octaves, pixelSize: 2 * scale / size });
      const i = (y * w + x) * 4;
      px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
    }
  }
  return sharp(px, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: 82 })
    .toFile(`${opts.out}_files/${level}/${col}_${row}.webp`);
}
```

The DZI descriptor is a few lines of XML (`TileSize`, `Overlap`,
`Format="webp"`, `Size`). For raster sources such as painted plates or
rasterized SVG insets, `sharp(...).tile({ size: 256, layout: 'dz' })` builds
the pyramid in one call. `sharp` also supports `iiif3`, `zoomify`, and
`google` layouts if a different viewer is chosen later. Pass
`limitInputPixels: false` for sources above about 268 million pixels.

### 4.2 Layers, in compositing order

1. **Cosmic scaffold.** Ridged noise filaments in `--void-0`/`--void-2`.
2. **Density field.** A smooth radial base plus region signed-distance fields
   blended to each region's locked value, plus site kernels for local peaks
   and wells: Tessarine's 0.78 sits above its sleeve, and Ostra-Vael's 0.30
   sits above the Remnant Seas' 0.04. The field is mapped to the void and
   amber ramps.
3. **Nebular texture.** Domain-warped fractional Brownian motion, modulated
   by density, so the Core is luminous and the Remnant Seas are ashen.
4. **Star field.** Deterministic hashed point sprites whose count and
   brightness scale with local density (`MEMORY_PHYSICS.md` §3.1). They
   become cinders in the Remnant Seas and are absent in Void Regions.
5. **Region effects.** Lattice Gap misregistration, Black Horizon bleed and
   lensing knots, Void blanking.
6. **Isopleths.** Contour bands computed from the field. These can be baked
   at the deepest levels or drawn as live vectors (see 5.2).

Corridor lanes are computed rather than drawn by hand. They are least-cost
paths across the density raster between hubs, where cost rises as density
falls, using a Delaunay candidate graph (`d3-delaunay`) and Dijkstra. That
follows the corridor mechanics: lanes bend around voids, thin through the
Gap, and crowd the Drift. They are labeled illustrative unless a story names
the route.

### 4.3 Measured cost

This session benchmarked the field on its 4-core container. A 14-evaluation
domain-warped noise pass ran at about 25.7 million evaluations per second, or
1.84 megapixels per second, per core. A 1-megapixel WebP encoded in 130 ms at
36 KB. Projected costs:

| Target | Tiles (256 px) | Noise time, 4 cores | Noise time, 8 cores | Est. storage (WebP) |
|--------|----------------|---------------------|---------------------|---------------------|
| 16,384² | ~5,500 | ~50 s | ~25 s | 30–80 MB |
| 32,768² | ~22,000 | ~3.3 min | ~1.6 min | 120–300 MB |
| 65,536² | ~87,000 | ~13 min | ~6.5 min | 0.5–1.2 GB |
| 131,072² | ~350,000 | ~52 min | ~26 min | 2–5 GB |

The full layer stack will cost three to five times the bare noise pass.
Storage ranges are estimates, since star fields and texture compress worse
than smooth noise. Iterate at 16k and render 65k for release.

### 4.4 Optional painted pass

Procedural rendering is reproducible and re-renders when canon changes, which
painted art cannot do. If you want a hand-made layer, paint region plates in
Krita (free on Windows) at 16k over an exported base, then composite them as a
separate tiled layer above the procedural one.

AI-generated texture plates are possible, but two concerns apply to a working
author's commercial property:

- The U.S. Copyright Office's January 2025 report, *Copyright and Artificial
  Intelligence, Part 2: Copyrightability*, treats output determined by prompts
  alone as unprotectable.
- Generated plates drift in tone in ways that are hard to keep consistent
  across regions.

Code you direct and paint you apply keep authorship clean. A commissioned
cartographer is the premium path; get quotes before setting a budget.

**Update (2026-10-30).** The author waived copyright and own-art concerns for
the map and chose style direction A, an Admiralty chart on dark paper (see
the D9 follow-up in the cartographic brief). The chart stays procedural for
the other reasons above: it re-renders from canon, and generated plates
would invent geography.

### 4.5 Print

The same field and vector layers can produce a poster: 7,200 × 10,800 px is
24 × 36 inches at 300 dpi. Render the raster with the tile renderer at that
size, then lay the live SVG labels over it in headless Chromium and print to
PDF. The labels stay vector. Playwright is already used in this environment
and installs on Windows.

## 5. Viewer

### 5.1 Recommendation: OpenSeadragon 6.1.1

OpenSeadragon 6.1.1 (BSD-3, released 2026-09-09) fits for these reasons:

- **Built for gigapixel pyramids.** It reads DZI natively and ships a WebGL
  drawer with a canvas fallback.
- **Multi-image worlds.** `viewer.addTiledImage({ tileSource, x, y, width,
  opacity })` places a second pyramid at a position and scale inside the
  first. That is the mechanism for Z3 insets and for crossfading pre-breach
  and post-breach layers.
- **Navigator minimap, keyboard navigation, and touch** are built in.
- **Overlays** take viewport coordinates: point overlays keep a constant
  screen size (labels, pins), and rect overlays scale with the image (region
  hit areas).
- **No build step.** Like the dashboard, it loads from a pinned CDN URL with
  subresource integrity, with vanilla JS beside it.

```js
const viewer = OpenSeadragon({
  id: 'chart',
  tileSources: 'tiles/galaxy.dzi',
  showNavigator: true,
  maxZoomPixelRatio: 2,
  visibilityRatio: 0.6,
  constrainDuringPan: true,
});

// Z3 inset: the Vault's interior, invisible until zoomed close.
viewer.addTiledImage({
  tileSource: 'tiles/tessarine_vault.dzi',
  x: 0.7748, y: 0.4302, width: 0.0004, opacity: 0,
  success: ({ item }) => insets.push({ item, fadeIn: 900, full: 2400 }),
});
viewer.addHandler('zoom', () => {
  const z = viewer.viewport.getZoom(true);
  for (const s of insets) s.item.setOpacity(clamp((z - s.fadeIn) / (s.full - s.fadeIn)));
});
```

### 5.2 Overlay layer (live, from `atlas.json`)

- One SVG group in viewport coordinates, re-transformed on OpenSeadragon's
  `animation` and `resize` events, holds region outlines, curved region
  names, isopleths when drawn live, corridor lanes, routes, and faction
  hatching. About 80 lines of code; write it rather than depend on an
  unmaintained plugin.
- HTML point overlays hold site pins and labels in Cormorant Garamond small
  caps, with soundings in IBM Plex Mono.
- Labels switch sets by zoom band, so only region names show at Z1 and
  sleeve names appear at Z2.
- Eddies animate slowly on a canvas layer, which stops under
  `prefers-reduced-motion`.

### 5.3 Interaction

- **Hover** shows `summary_50`. **Click** opens a side panel with
  `summary_200`, a tier badge, the sounding and its as-of note, and linked
  stories, characters, and factions from `REFERENCE_MAP.json`. A **Copy
  path** button works as it does on the dashboard.
- **Canon lens** (2.4) and **layer toggles**: isopleths, corridors, factions,
  story routes, events, insets.
- **Era control:** *Before the Tessarine Breach* / *After*. It crossfades
  the sleeve states and swaps the two soundings to *unmeasured*. It never
  interpolates a number.
- **Story routes:** *The Archivist's Wake* (events 0002–0007, ending at the
  Heliodrome) and *Spend What You Can Afford* (`event-story-0022-008`, null
  stones bound for the inner relay). Draft routes appear only under
  **+ Speculative**.
- **Search** with `fuse.js` 7.5.0 over names, tags, and summaries.
- **Deep links:** `#loc-0011@0.775,0.430,z2400` restores the selection and
  viewport, so a link can go into a story note or a pitch.
- **Accessible alternative:** a list view of every placed entity with the
  same panel content, reachable by keyboard and readable by screen readers.

Candidate Z3 insets, from atlas text that already describes interiors:

- **Tessarine Vault** (canon). Audit hall with sixteen booths, of which
  Three, Nine, Eleven, and Fourteen are lost; the middle ring; and a silo bank
  of "nine housings in a shallow arc," with Four and Nine lost. The lost
  booths are drawn as cartographic blanks, because "no one can go where the
  booths were."
- **Heliodrome** (canon). Deck plan printed with misregistration, with
  Array Two from primary canon and the Deck Six spine, west loop, and
  Stairwell Nine shown only under **+ Speculative**.
- **Halix Exchange** (speculative). Four-kilometer hull, with the
  fourth-deck inheritance quarter.
- **Ostra-Vael** (speculative). Seven-deck elevation.
- **Skather-Ait pod** (speculative). Coherence-frame mesh, with the tether
  to Halix.

Draw the insets as SVG in Inkscape (free) or generate them in code,
rasterize them with `sharp` (which renders SVG), and tile them to DZI.

### 5.4 Alternatives considered

| Option | Verdict |
|--------|---------|
| Leaflet 1.9.4 with `CRS.Simple` | Mature, with good markers and layer control. Its stepwise zoom and single-pyramid model make nested insets and era crossfades awkward. A sound fallback. |
| MapLibre GL 6.16.0 | The best label collision and data-driven styling. It assumes Web Mercator, so a fictional chart needs a small fake-latitude box, and raster insets at extreme depth are not its strength. Worth revisiting if the atlas grows past roughly 200 sites. |
| deck.gl 9.4.1 (`OrthographicView`) | Excellent animated layers (corridor flows, heatmaps), with more engineering and a bundler. A candidate for a later overlay, not the base. |
| three.js 0.186.1 (3D orrery) | The most spectacular option. It needs z-coordinates canon has never given, and a 3D map is harder to read. Defer until author decision 3 settles dimensionality. |
| Live WebGL procedural tiles (no stored pyramid) | Infinite zoom and no storage. Painted layers and print output would still need offline renders. A stretch goal after Phase 3, since `field.js` can be ported to GLSL. |

## 6. Hosting and Repository Boundaries

- **Never commit tiles.** They are generated, there are tens of thousands of
  them, and they re-render from source. They live in `out/map/tiles/`, which
  is already gitignored.
- **Commit:** `design/map/cartography.yaml`, `design/map/insets/*.svg`,
  `scripts/map/*`, `scripts/lint/cartography_lint.js`, tests, and the viewer
  under `map/` (or `dashboard/map/`). Painted source files (`.kra`, `.psd`)
  belong in Git LFS or outside the repository.
- **Local:** `npm run map` serves `http://127.0.0.1:8081/map/` through
  `createDashboardServer`. It adds one prefix route confined to
  `out/map/tiles/` with an extension allowlist (`.dzi`, `.webp`, `.jpg`).
  That is a deliberate exception to the exact-path allowlist, and it should
  be documented and tested like the existing server boundary.
- **Published options:**
  1. **Hetzner VPS with Caddy (recommended).** You already run it. `rsync`
     the tiles, serve them as static files, and turn on `basic_auth` while
     the chart is private.
  2. **Object storage plus a CDN** (Hetzner Object Storage or Cloudflare
     R2). This scales without a server, and R2 charges no egress fees.
  3. **Netlify** for the viewer page only. Uploading about 87,000 tiles on
     every deploy is slow, so pair it with option 1 or 2 for tiles.
- **Spoilers.** A public chart publishes summaries of unpublished and draft
  stories. Decide visibility before deploying (author decision 8).

## 7. Tool and Dependency List

| Tool | Purpose | Cost | Windows |
|------|---------|------|---------|
| `sharp` 0.35.5 (needs Node ≥ 20.9; CI uses 20) | WebP/JPEG encoding, SVG rasterizing, DZI tiling | Free (Apache-2.0) | Prebuilt binaries |
| `simplex-noise` 4.0.3 | Noise for the field and textures (ships CommonJS and ESM) | Free (MIT) | Yes |
| `d3-delaunay` 6.0.4, `d3-contour` 4.0.2 | Corridor candidate graph; isopleth extraction | Free (ISC) | Yes |
| OpenSeadragon 6.1.1 | Deep-zoom viewer | Free (BSD-3) | Browser |
| `fuse.js` 7.5.0 | Client-side search | Free (Apache-2.0) | Browser |
| `gray-matter`, `js-yaml`, `ajv` | Already dependencies: frontmatter, cartography file, schema for the cartography file | — | Yes |
| Playwright / headless Chromium | Poster PDF, visual regression snapshots of the viewer | Free | Yes |
| Inkscape | Hand-drawn SVG insets and label proofs | Free | Yes |
| Krita | Optional painted region plates | Free | Yes |
| Caddy | Static hosting with automatic TLS and optional basic auth | Free | VPS |

Add the `npm` packages as `devDependencies` if the map stays a build-time
tool, so the core validation install stays small.

## 8. Phased Plan

Each phase ends in a commit on a `feat/map/...` branch and a green
`npm run validate:ci`.

### Phase 0 — Cartographic brief (one session, plus author review)

- Write `design/map/CARTOGRAPHIC_BRIEF.md`: every constraint in 1.1–1.4 with
  a file and line, the proposed radial layout as a low-resolution SVG sketch,
  and the decisions in section 9.
- **Done when** the author has answered decisions 1–6 or deferred them
  explicitly.
- **Status (2026-10-29):** The brief and the sketch (now
  `design/map/layout_sketch_v1.svg`) are written. Decisions D1–D10 and the
  second-pass decisions Q1–Q21 are accepted.

### Phase 0b — Canon and draft alignment (one to two sessions)

Settle the text before building tools that check it. Phase 1's lint reads
atlas `coordinates.region` and lexicon definitions, so fixing those first
lets it pass on its first run without exceptions. Revising drafts now clears
contradictions that the continuity checks and the map would otherwise flag.

1. Answer the brief's second-pass questions. Update the brief, the lexicon
   wording if Q4 changes it, and the sketch (v1).
2. Lore and atlas: add the "Arrangement" section to
   `lore/COSMIC_REGIONS.md` (Q14). Set the three speculative atlas region
   fields (Q16). Leave the primary-canon atlas files unchanged (Q15).
3. Drafts: revise `story-0003` (Q18) and `story-0007` (Q19). Add the
   novel's continuity note (Q20).
4. Run the source-first claim review of `loc-0013` Halix and `loc-0015`
   Skather-Ait against `story-0004`. **Done in PR #45**, which approved both
   as primary canon.
5. Open and merge the PRs (Q21).

- **Done when** every question in brief section 8 is answered, the edits are
  merged, and `npm run validate:ci` passes.

### Phase 1 — Data layer (one session)

- Add `design/map/cartography.yaml` and its JSON schema in `docs/schemas/`,
  `scripts/map/field.js`, `scripts/map/build_data.js` (`npm run map:data`),
  `scripts/lint/cartography_lint.js` (`npm run lint:map`), and
  `scripts/tests/test_map_data.js` with synthetic fixtures, following the
  pattern of the existing tests.
- **Done when** every canonical location is placed, the density-fidelity
  rule passes, and a deliberately bad fixture fails each rule.
- **Status (2026-10-29):** Done. All 15 locations are placed with zero
  findings. `scripts/tests/test_map_data.js` breaks the fixture 28 ways and
  each rule catches its defect. `lint:map` runs in `npm run lint`, and
  `test:map` runs in `validate:ci`. The playbook (Step 4 and Step 6b) and the
  PR template carry the D10 placement steps.

### Phase 2 — Viewer MVP (one to two sessions)

- Render a 16k procedural base, then build the OpenSeadragon viewer with the
  overlay layer, side panel, canon lens, search, deep links, list view, and
  `npm run map`.
- **Done when** every canonical location can be found, selected, and
  deep-linked; speculative entities appear only under the lens; and
  Playwright snapshot tests cover the three lens states.
- **Status (2026-10-29):** Done.
  - `npm run map:tiles` renders the 16k base in about 70 s on 4 cores:
    5,469 tiles, 22 MB.
  - `npm run map` serves the viewer, with:
    - the overlays and the detail panel;
    - the lens, search, deep links and the list view;
    - the public build and a no-tiles fallback.
  - `npm run test:map-browser`, a CI job, checks each lens state in headless
    Chromium against a structural snapshot derived from the data: pin
    visibility by tier, dashed speculative pins, solid canon pins. It also
    covers the other behaviors and saves screenshots for review. It uses no
    pixel baselines, which differ across machines; that is a deliberate
    departure from "snapshot" in the narrow sense.
  - The public build has its own tiles, rendered from canon densities only.
  - The viewer logic, the server boundary and the renderer have Node tests
    in `validate:ci`.
  - The procedural style frame is ready for the D9 review.

### Phase 3 — High-definition pipeline (two to three sessions)

- Build the worker-threaded tile renderer (`npm run map:tiles -- --size
  65536`), all six region treatments, star field, computed corridor lanes,
  and eddies.
- **Done when** a full 65k render completes on the author's Windows machine,
  the lint passes against the rendered field, and Void interiors contain no
  labels or contours.
- **Status (2026-10-30):** Built in style direction A, an Admiralty chart on
  dark paper (the D9 follow-up in the brief).
  - `scripts/map/painter.js` draws stepped tints, isopleths, paper grain, all
    six treatments of §2.2, stars, and the frame. `scripts/map/lanes.js`
    computes the lanes and eddies (rule R10). The field gained spiral arms
    that keep every ring average, and an eased falloff (rule R11).
  - The lint passes against the rendered field, in both builds.
    - An annulus is checked by its ring average, and the field may stray no
      more than 0.06 from it along the ring.
    - Every other probe and site must read its value in its own tint band.
    - Each region's sounding is printed, and checked, where the field reads
      that value.
  - Void interiors contain no labels or contours. A test paints every Void
    at two zooms and requires the void color inside; isopleth labels and
    region label anchors are tested to keep out.
  - Isopleth lines are baked into the tiles; their values and the soundings
    are live labels in the viewer, with the chart's furniture in the margin.
  - `npm run map:tiles -- --size 65536` completed on the final code in a
    4-core Linux container: 87,389 tiles in 17 levels, 36.4 minutes, 347 MB.
    A 16k render takes about 2.5 minutes there.
  - Not yet done: the 65k render on the author's Windows machine, which this
    phase's done-when names.

### Phase 4 — Depth and time (two sessions)

- Add Z3 insets (the Tessarine Vault first, then the Heliodrome), story
  routes, event pins, the era control, and the Z0 scaffold.
- **Done when** zooming from Z1 into the Vault's silo bank is continuous,
  and the post-breach view shows no invented figure.
- **Status (2026-10-30):** Built after the author accepted decisions
  Q22–Q36 (the brief's third pass; the options weighed are in
  [`ATLAS_MAP_PHASE4_QUESTIONS_2026_10_30.md`](ATLAS_MAP_PHASE4_QUESTIONS_2026_10_30.md)).
  - Corrections to §5.3:
    - Halix and Skather-Ait are primary canon since PR #45.
    - The Heliodrome's Deck Six, west loop, and Stairwell Nine come only from
      the drafts `story-0014` and `story-0016`, so the Heliodrome plate
      draws none of them (Q29).
    - `loc-0016` (H-37) and the `story-0021` run are not drawn (Q32).
  - The Tessarine Vault and Heliodrome plates are painted in Node on the
    chart's paper (`npm run map:insets`). Their text is live. The era control
    defaults to After the breach. The two story runs, the event pins, the
    layer toggles, and the Z0 scaffold are in the viewer.
  - The lint checks every element's basis and every printed figure against
    its cited lines (rules R12–R18).
  - The browser tests check both done-when conditions:
    - A stepped zoom from Z1 to the silo bank never shows a blank center and
      never fades the plate back out.
    - The After view prints no pre-breach figure, and every decimal on it is
      a canon sounding or an isopleth value.

### Phase 5 — Publish and print (one session)

- Write the deploy script (Node, cross-platform `rsync` wrapper or S3
  upload), produce the poster export, and set the access decision.
- **Done when** a deployed URL loads within three seconds at Z1, and a 24 ×
  36 inch PDF exports.

### Later options

- Painted plates, a commissioned cartographer pass, live WebGL tiles, and a
  three.js orrery once the dimensionality decision is made.

## 9. Author Decisions Required

The map cannot proceed past Phase 0 placeholders without these. None of them
overlaps the open decisions in
`docs/PROCESS_REVIEW_STORY_DRAFTING_2026_10_20.md` §7. Each item below gives
the question, then the agent's recommendation with its main reason.

**Accepted by the author on 2026-10-29, all ten as recommended.**
`design/map/CARTOGRAPHIC_BRIEF.md` records them as decisions D1–D10 and lists
the claims they approve.

1. **Status of the layout.** Options: cartographic interpretation only,
   working canon, or primary canon.
   *Recommendation:* split by claim type. Topology (containment, adjacency,
   radial order, which sleeve a site is in) becomes working canon on
   approval. Geometry (exact positions, sizes, angles, lane shapes) stays
   cartographic and carries *P.A.* notes. The map never reaches
   primary canon on its own authority. Stories rely on topology, so topology
   needs authority; geometry is presentation and should stay revisable.
2. **Galaxy shape, arrangement, and the Drift's scale.**
   *Recommendation:*
   - Draw a spiral disk whose arms carry the density field, with the Core at
     the center, the Drift as the inhabited belt, and the Black Horizon at
     the perimeter, its interior left uncharted.
   - Place the Lattice Gap as a rift at the outer reach of the Lattice,
     crossing the Drift's outer edge, with the Gap's outer sleeve touching a
     Void Region.
   - Put the Remnant Seas in pockets beyond the Drift. Scatter the Void
     Regions, densest at the margins.
   - Read the Drift at galactic scale throughout, with its outer sleeve as a
     sparse deep-orbit ring around the Core. That reading keeps every
     canonical statement literal; its only cost is that the outer sleeve is
     thinly settled, which canon already implies.
3. **Dimensionality.**
   *Recommendation:* a 2D chart as the canonical artifact, with an optional
   2.5D gravity-well view later that takes its height from the same density
   field. Do not assign z-coordinates.
4. **Beyond the galaxy.**
   *Recommendation:* place Heavonly under the speculative lens only, at the
   Drift's inner edge where it meets the Core. Its 0.82 falls between the
   Drift's 0.65 and the Core's 0.97, and a dense hub can fund
   inter-galactic burns. Do not draw or name other galaxies until the novel
   settles "three galaxies" against "three other galaxies."
5. **Sleeves and pulls.**
   *Recommendation:*
   - Define "sleeve" as a navigational band of any region, named by its
     position relative to the region's inward edge (near or inner, mid,
     outer).
   - In the Drift, the outer sleeve divides into nine numbered civic sleeves
     numbered outward. Canon populations fall with the number (Second
     200,000, Fifth 80,000, Seventh about 40,000, Ninth 900).
   - Add "pull" to the lexicon as a count of drive engagements on a
     corridor run, explicitly not a distance or a time.
6. **Specific placements.**
   *Recommendation:*
   - Put Solace Hospice where the Lattice Gap's outer sleeve touches a Void
     Region. That one position satisfies the atlas, `story-0007`, and
     `story-0018`. The `story-0003` hospice becomes a different Remembrancer
     house; already tracked in `docs/governance/provisional_profiles.md`.
   - Put Ostra-Vael on the Remnant Seas boundary.
   - Draw the Black Horizon's superclustering as dense black-hole knots at
     galactic scale.
   - Mark Ebbhaven with *E.D.* in the outer reaches.
   - Put Halix on a slow circuit through the outer sleeve, mooring at tether
     heads.
   - Put the Tessarine Vault at the outer sleeve's inner edge, facing all
     nine sleeves.
7. **Default canon lens.**
   *Recommendation:* two builds.
   - The author build shows every tier, with speculative entities faded.
   - The public build includes only primary and working canon, and
     excludes draft data at build time rather than hiding it in the browser.
   - Separately, run the source-first claim review of `loc-0013` Halix and
     `loc-0015` Skather-Ait against primary-canon `story-0004`. A
     primary-only map otherwise omits the settings of a primary-canon story.
8. **Visibility.**
   *Recommendation:* the author build goes on the VPS behind basic auth now.
   Launch the public build only with a reader-facing occasion. Public panels
   carry summaries only, never excerpts.
9. **Art direction.**
   *Recommendation:* the procedural base, which the lint requires anyway.
   Judge a style frame at the end of Phase 2. If hand craft is wanted,
   commission a hero print map on the approved geometry under a written
   work-made-for-hire agreement (a map is a "supplementary work" under
   17 U.S.C. §101), with an assignment as backup. Skip AI plates.
10. **Process.**
    *Recommendation:* require a placement at promotion (Step 6b), not at
    drafting. Drafting agents may propose a placement in the PR body but do
    not edit the cartography file. After the Phase 1 backfill, CI fails on
    an unplaced primary-canon location and warns on a speculative one. A
    placement change is a Canon Impact line in the PR.

## 10. Risks

- **Canon pressure.** A chart makes adjacency feel settled. If decision 1
  makes it working canon, every new story pays a placement cost. If it does
  not, writers may still treat it as canon. Mitigation: the *P.A.* notes, the
  legend disclaimer, and the lint.
- **Thin content at galaxy scale.** Eight canonical entities across a
  4-gigapixel chart is mostly atmosphere. That fits the tone, since forgetting
  is blankness, but the chart's appeal will come from the field and the Z3
  insets, not the pin count. Prioritize the Tessarine Vault inset.
- **Render time on the author's machine.** The 65k layer is estimated at
  20–60 minutes with the full layer stack. Iterate at 16k and render 65k for
  release only.
- **Tile hosting sprawl.** About 87,000 files per release. Use rsync with
  `--delete` to a versioned directory, or object storage, and never git.
- **Server boundary.** The tile prefix route relaxes the dashboard server's
  exact allowlist. Test traversal, symlinks, and extensions as the existing
  server test does.
