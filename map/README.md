# Atlas Map Viewer

A zoomable chart of *The Forgotten Tides*, drawn as an Admiralty chart on
dark paper. The tiles are rendered from the canon memory-density field, and
the placements recorded in `design/map/cartography.yaml` are drawn over
them. The decisions behind it are in `design/map/CARTOGRAPHIC_BRIEF.md` and
[the atlas map plan](../docs/ATLAS_MAP_PLAN_2026_10_29.md).

## Reading the chart

- **Tints and isopleths.** Each flat tint is a band of memory density; its
  edges are the isopleths, majors every 0.1 and minors every 0.05. Minors
  appear as you zoom. Isopleth values (small upright numerals set along the
  lines) are interpolated band edges, not measurements.
- **Soundings.** Italic values are canon `memory_density` values, the only
  measured numbers on the chart. A site's sits beside its name. A region's
  prints where the field reads that value, in its tint band (rule R11). The
  Void Regions print none, since nothing inside is charted. A pre-breach
  value says so.
- **Spiral arms** carry the density gradient (decision D2). They vary the
  field along each ring while keeping its average. Through the Helios Drift
  they stay gentle: the lint holds its field within 0.06 of 0.65 all around
  its mid-radius ring, so the Tessarine Vault still peaks above it. Beyond
  the Drift they grow strong (rule R11).
- **Region treatments.** The Lattice Gap breaks into splinters, prints its
  linework a second time out of register, and carries two hatch screens
  whose moiré stands for its disrupted harmonics. The Remnant Seas are
  streaked ash with cinder stars and glints of reliquary shards. The Void
  Regions are blank: nothing inside is drawn. The Black Horizon's ink bleeds
  past the neatline, and its black-hole knots show as lensing rings.
- **Corridor lanes** (faint dashed rose lines) mark where corridors tend to
  form, computed as least-cost paths over the field between anonymous hubs.
  They are illustrative and never canon routes. **Eddies** (small spirals)
  are an area symbol near the lanes, each facing up the density gradient
  (rule R10).
- **Furniture.** The margin carries the title cartouche, notes, the tint key,
  degree labels, and a rose that counts degrees counterclockwise from the
  right-hand side. The chart has no north.
- **Eras.** The chart opens *after* the Tessarine Breach, the state the atlas
  says binds later stories. After it, the Tessarine Vault's and the Helios
  Drift's pre-breach soundings read *unmeasured* (hatched), the outer
  sleeve's isopleth values are dropped, Sleeves IV and IX carry a softening
  screen with no figure, and the notes say the field is drawn from pre-breach
  soundings. *Before the Tessarine Breach* restores the pre-breach state.
  The switch crossfades; values swap whole and never tween (rule R15).
- **Story runs.** A run is labeled with its own pull count. *The Archivist's
  Wake* is a completed run (solid) into the Heliodrome with no charted
  origin. Elior Ren's run with the null stones, Vault to the Navigant house,
  is intended (dashed, arrowed) and shows after the breach only, since canon
  gives its count only then. No ticks are drawn: spacing them would convert
  pulls to distance (rule R16).
- **Event pins.** A diamond marks events where canon places them (P.A.).
  At region zoom a site carries one glyph with no count; inside an inset
  plate each room carries its own. Events of the breach show after it only
  (rule R17).
- **Inset plates (Z3).** Zooming into the Tessarine Vault or the Heliodrome
  fades in a framed plate, not to scale. The Vault's plate stacks the silo
  bank, middle ring, and audit hall as the Vault stands. After the breach,
  booths Three, Nine, Eleven, and Fourteen are blank (nothing inside, no
  crisp edge), the Fourth and Ninth housings stand with no pitch ring, and
  the lintel shows a smooth space where *only* was. The Heliodrome's plate
  charts only what canon gives (its arrays, Array Two, the dock, and the
  Wake's release point) and prints out of register. Past the chart tiles'
  own resolution a dark mat covers the chart around a plate.
- **Universe (Z0).** Zooming out past the chart shows an unlabeled scaffold
  of dark-matter filaments, with no nodes, knots, or other galaxies, around
  the known galaxy, which carries only the chart's title (rule R18).

## Run

From the repository root:

```bash
npm run map:data        # out/map/atlas.author.json (add -- --build public for the public file)
npm run map:tiles       # out/map/tiles/: the 16k chart, about 2.5 minutes on 4 cores
npm run map:insets      # out/map/insets/: the inset plates and the Z0 scaffold, about a minute
npm run map             # http://127.0.0.1:8081/map/
```

For release, render `npm run map:tiles -- --size 65536` (about 36 minutes on
4 cores, 87,389 tiles, about 350 MB). `npm run map:frame` paints any window to a PNG
with the same painter; see `docs/USAGE.md`.

`npm run map -- --build public` serves the public build instead. Its tiles
come from `npm run map:tiles -- --build public` (`out/map/tiles-public/`),
rendered from canon densities only, so no speculative site shapes the public
image. Its plates come from `npm run map:insets -- --build public`
(`out/map/insets-public/`), which leaves out insets at non-canon sites and
draft inset elements.

The server binds to loopback. It serves only this page, its scripts,
OpenSeadragon from `node_modules`, one data file, and that build's tile and
inset files with `.dzi`, `.webp`, or `.json` extensions. Each tile path segment passes the
repository's `validatePathSegment`, and percent-encoding is refused.

Tile images are cached for a day. The descriptor and the render manifest are
never cached, and the viewer versions every tile URL with the manifest's
timestamp, so a re-render never mixes with cached tiles.

## Controls

- **Pan and zoom** with the mouse, a trackpad, touch, or the keyboard once the
  chart has focus. Once zoomed in, a minimap appears at the lower left.
- **Select** a pin, a list entry, or a search result. The panel shows:
  - the tier and region;
  - the canon memory density and when it was measured;
  - the summary;
  - linked stories, characters, and factions;
  - timeline events;
  - the source path, with a copy button.
- **Era.** *Before the Tessarine Breach* or *After* (the default). The
  address hash records a non-default era, for example
  `#loc-0011@0.6669,0.5674,5.00~before`.
- **Layers.** Story routes, event pins, inset plates, isopleth values, and the
  universe scaffold toggle on and off. Lanes, eddies, and the isopleth lines
  are part of the tiles and do not.
- **Lens.** *Primary*, *+ Working*, or *+ Speculative* sets which tiers
  appear. The author build opens on *+ Speculative*, with speculative pins
  dashed and faded. The public build contains no speculative material, so
  that lens is disabled.
- **Search** matches names first, then summaries, within the current lens.
  Arrow keys move through the results; Enter selects.
- **List** shows everything on the chart under the current lens, grouped by
  kind.
- **Deep links.** The address hash records the selection and view, for
  example `#loc-0011@0.6669,0.5674,5.00`. A bare `#loc-0011` opens that
  location.

Positions, sizes, angles, and drawn counts are cartographic (*P.A.*). Labels
appear by zoom level: region names and soundings at the overview, then
location, isopleth, feature, route, and sleeve labels as you zoom in. Band
rings appear at region zoom.

## Files

| File | Role |
|------|------|
| `index.html` | Page structure |
| `viewer.css` | Styles, using the tokens in `ui_kits/colors_and_type.css` |
| `viewer_core.js` | Pure logic: lens tiers, eras, coordinates, the item index, search, hashes, label levels, soundings, plate fades, event markers, and the Z0 fade. It loads in Node for tests. |
| `viewer.js` | OpenSeadragon setup, overlays, the panel, and the controls |

## Data contract

The viewer reads `data/atlas.json`, the output of `scripts/map/build_data.js`.
It has `build`, `image.extent` (the chart half-width the tiles span), and the
following lists:

- **`regions`:** outlines, label points, bands, and `memory_density` for
  the soundings.
- **`sites`:** `xy`, marker, an optional circuit, and `memory_density`.
- **`features`:** points, positions, sleeves, and an edge outline.
- **`routes`:** `points`.
- **`chart`:** `tints` (each band's range and color, from the painter) and
  `isopleths` (each label's value, point, angle, ink, and knockout color,
  and `hidden_in`, the eras that drop it), computed from the same field as
  this build's tiles.
- **`eras`:** the breach event, the default era, and the After legend note.
  A region or site whose sounding reads *unmeasured* after the breach
  carries `era_sounding`; routes and event pins carry `era`.
- **`insets`:** each plate's chart rectangle, plate units, eras, and per era
  its live `labels` and event `anchors`, in chart coordinates. The rasters
  come from `scripts/map/render_insets.js` and its manifest,
  `insets/insets.json`.
- **`event_pins`:** each pinned event, its era, and where it sits (a route,
  or an inset room with its site).
- **`universe`:** the Z0 scaffold's extent, its clear center, and its one
  label.

Coordinates are chart units with y up. Text is always inserted as text, never
as HTML.

## Tests

- `npm run test:map` runs in `validate:ci` and covers the viewer logic, the
  server boundary (traversal, symlinks, and extensions), the renderer, and
  the chart layers:
  - empty Void interiors at two zooms;
  - tiles that agree across their seams;
  - flat plateaus;
  - lanes kept out of the Voids, and eddies out of the Voids and the Seas;
  - eddies densest in the Gap and facing up the gradient;
  - isopleth labels clear of Voids, the Seas, the Gap, and sites;
  - layers switched by the placement file;
  - the frame renderer;
  - the Phase 4 lint rules, each against a deliberate break of the real
    placement file;
  - the Vault plate's lost booths, housing states, and lintel by era;
  - the inset painter's determinism, seams, and Void-colored lost booths;
  - the Z0 scaffold's clear center and its filaments, with no knots or discs;
  - the era, plate, and event-pin data, and the public build's exclusions;
  - the inset renderer's pyramids, manifest, and byte-identical rerenders.
- `npm run test:map-browser` runs in its own CI job in headless Chromium. It
  covers:
  - the three lens states, each checked against a structural snapshot from
    the data: every pin's visibility matches its tier, speculative pins are
    dashed and faded, and canon pins are solid;
  - the furniture, soundings (including a pre-breach note and none for the
    Voids), and isopleth values and minimap by zoom;
  - tiles rendered for an older frame, which keep the overlays registered and
    say so;
  - versioned tile URLs;
  - search, including Escape;
  - deep links;
  - the list view;
  - the public build;
  - the no-tiles fallback;
  - the era control: its default, whole-state swaps, and deep links;
  - a stepped zoom from the galaxy into the Vault's silo bank that never shows
    a blank center and never fades the plate back out;
  - the post-breach view: no pre-breach figure, and every printed decimal a
    canon sounding or an isopleth value;
  - plate crossfades, the layer toggles, story runs, event pins, and Z0.

  Screenshots go to `out/map/screenshots/` for human review. Pixel baselines
  are not used: font and GPU differences between machines make them
  brittle.
