# Atlas Map Viewer

A zoomable chart of *The Forgotten Tides*. It draws a procedural deep-zoom
base rendered from the canon memory-density field, and over it the
placements recorded in `design/map/cartography.yaml`. The decisions behind
it are in `design/map/CARTOGRAPHIC_BRIEF.md` and
[the atlas map plan](../docs/ATLAS_MAP_PLAN_2026_10_29.md).

## Run

From the repository root:

```bash
npm run map:data        # out/map/atlas.author.json (add -- --build public for the public file)
npm run map:tiles       # out/map/tiles/: the 16k base, about a minute on 4 cores
npm run map             # http://127.0.0.1:8081/map/
```

`npm run map -- --build public` serves the public build instead. Its tiles
come from `npm run map:tiles -- --build public` (`out/map/tiles-public/`),
rendered from canon densities only, so no speculative site shapes the public
image.

The server binds to loopback. It serves only this page, its scripts,
OpenSeadragon from `node_modules`, one data file, and that build's tile files
with `.dzi`, `.webp`, or `.json` extensions. Each tile path segment passes the
repository's `validatePathSegment`, and percent-encoding is refused.

Tile images are cached for a day. The descriptor and the render manifest are
never cached, and the viewer versions every tile URL with the manifest's
timestamp, so a re-render never mixes with cached tiles.

## Controls

- **Pan and zoom** with the mouse, a trackpad, touch, or the keyboard once the
  chart has focus. The minimap sits at the lower left.
- **Select** a pin, a list entry, or a search result. The panel shows:
  - the tier and region;
  - the canon memory density and when it was measured;
  - the summary;
  - linked stories, characters, and factions;
  - timeline events;
  - the source path, with a copy button.
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
appear by zoom level: region names at the overview, and location, feature,
route, and sleeve labels as you zoom in.

## Files

| File | Role |
|------|------|
| `index.html` | Page structure |
| `viewer.css` | Styles, using the tokens in `ui_kits/colors_and_type.css` |
| `viewer_core.js` | Pure logic: lens tiers, coordinates, the item index, search, hashes, and label levels. It loads in Node for tests. |
| `viewer.js` | OpenSeadragon setup, overlays, the panel, and the controls |

## Data contract

The viewer reads `data/atlas.json`, the output of `scripts/map/build_data.js`.
It has `build`, `image.extent` (the chart half-width the tiles span), and the
following lists:

- **`regions`:** outlines, label points, and bands.
- **`sites`:** `xy`, marker, and an optional circuit.
- **`features`:** points, positions, sleeves, and an edge outline.
- **`routes`:** `points`.

Coordinates are chart units with y up. Text is always inserted as text, never
as HTML.

## Tests

- `npm run test:map` runs in `validate:ci` and covers the viewer logic, the
  server boundary (traversal, symlinks, and extensions), and the renderer.
- `npm run test:map-browser` runs in its own CI job in headless Chromium. It
  covers:
  - the three lens states, each checked against a structural snapshot from
    the data: every pin's visibility matches its tier, speculative pins are
    dashed and faded, and canon pins are solid;
  - versioned tile URLs;
  - search, including Escape;
  - deep links;
  - the list view;
  - the public build;
  - the no-tiles fallback.

  Screenshots go to `out/map/screenshots/` for human review. Pixel baselines
  are not used: font and GPU differences between machines make them
  brittle.
