# Continuity Dashboard

The Continuity Dashboard displays the repository's `REFERENCE_MAP.json` as a graph. It shows characters, locations, mechanics, factions, stories, lore, and terms, with counts and filters for every type present in the map. This page describes the dashboard code and data contract.

## Run

From the repository root:

```bash
npm run dashboard
```

Open `http://127.0.0.1:8080/dashboard/`. The server binds to loopback and serves only the dashboard page, its JavaScript, and `REFERENCE_MAP.json`. Open the URL through the server, since browser `file:` pages cannot reliably fetch the map. Use **Reload data** after regenerating the map; it refreshes the page.

The page uses vis-network 10.1.3 from a pinned CDN URL with subresource integrity. Graph rendering requires that library to load. Fonts are also fetched from Google Fonts; fallback fonts are available.

## Controls and visual signals

- The seven filter buttons toggle entity types. Their counts show totals in the full map. Hidden types and edges disappear from the current view.
- **Reset view** fits the visible graph. Mouse wheel and dragging zoom and pan. Focus the graph to use vis-network's keyboard navigation.
- Select a node to see its ID, path, and full-map connection count. **Copy path** copies its repository-relative path for use in an editor or terminal. If clipboard access is unavailable, the displayed path remains selectable. Nodes without a path have no copy button.
- A dashed, faded node has `canon_tier: "speculative"` or legacy `status: "speculative"` / `"missing"`. The detail badge distinguishes speculative from missing. A red border indicates zero incident edges in the complete map, regardless of active filters.
- Empty data, filters hiding every node, malformed data, failed fetches, and a missing graph library have separate visible states. The reload button remains available.

Existing entity colors remain unchanged. Lore uses teal (`#42C9C0`) and terms use copper (`#E49B6B`).

## `REFERENCE_MAP.json` contract

The dashboard accepts a JSON object with `nodes` and `edges` arrays. Both arrays may be empty. It validates the structure before rendering and displays an error when it cannot use the map.

```json
{
  "generated": "2026-10-27T00:00:00Z",
  "nodes": [
    {
      "canonical_id": "char-0001",
      "type": "character",
      "name": "Example character",
      "path": "characters/Example.md",
      "canon_tier": "primary_canon"
    }
  ],
  "edges": [
    { "from": "char-0001", "to": "char-0001", "type": "related" }
  ]
}
```

Each node requires a unique, nonempty string `canonical_id`, a nonempty string `name`, and one of these exact `type` values: `character`, `location`, `mechanics`, `faction`, `story`, `lore`, `term`. `path` is optional, but must be a string when present. It is displayed and copied as given; the dashboard server does not expose source files. The dashboard reads `canon_tier` to style `speculative` nodes. If available, legacy `status` values `speculative` and `missing` are also recognized. Other metadata such as `source_weight` and `retrieval_role` may be present but does not affect this graph.

Each edge requires string `from` and `to` IDs that match existing nodes and a nonempty string `type`. An edge counts once for each endpoint, including when it connects a node to itself. Edges render only when both endpoints are visible. A node's orphan state and detail-panel edge count always use the complete map.

The dashboard treats unsupported node types, duplicate IDs, unresolved endpoints, and incorrectly shaped data as malformed. Generate a compatible map before using the dashboard. No content file is read by the browser.

## Development and checks

The page is `dashboard/index.html`; behavior is in `dashboard/dashboard.js`. The local HTTP server is `scripts/serve_dashboard.js`. Run `npm run test:dashboard` for the dashboard checks. If the page shows an error, confirm the map exists and is valid, the server is running, and the browser can load the pinned vis-network script. If the graph is empty, inspect the message in the graph area and the filter buttons.
