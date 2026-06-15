# Continuity Dashboard

A visual network graph interface for exploring canonical relationships in The Forgotten Tides Universe.

## Overview

The Continuity Dashboard is a web-based tool that visualizes the `REFERENCE_MAP.json` file as an interactive network graph. It provides a high-level view of how characters, locations, mechanics, factions, and stories are interconnected within the universe.

This dashboard implements **Phase 7** of the Structural Audit & Optimization Plan.

The interface uses the Forgotten Tides design system: deep blue-shifted void canvas, warm ink foregrounds, memory-amber selection accent, Cormorant Garamond display serif for the wordmark, IBM Plex Sans for UI, IBM Plex Mono for telemetry and stenciled labels. Entity colors are canonical and inherited from earlier versions — they are part of the universe's vocabulary and are not remapped.

## Features

- 📊 **Interactive Network Graph**: Visualize all entities and their relationships
- 🎨 **Color-Coded Nodes**: Different colors for each entity type
- 🔍 **Filtering**: Show/hide entity types to focus on specific relationships
- 📝 **Node Details**: Click on any node to see detailed information
- 🔎 **Zoom & Pan**: Navigate large graphs with mouse controls
- 🔄 **Live Updates**: Reload button to refresh data without page reload
- ⚠️ **Missing Node Detection**: Highlights speculative or missing entities

## Entity Types & Colors

| Type | Color | Description |
|------|-------|-------------|
| **Character** | 🔵 Blue (#4a9eff) | Character entities |
| **Location** | 🔴 Red (#ff6b6b) | Physical locations |
| **Mechanics** | 🟢 Green (#51cf66) | Physics/mechanics rules |
| **Faction** | 🟡 Yellow (#ffd93d) | Political/cultural groups |
| **Story** | 🟣 Purple (#a78bfa) | Published stories |
| **Missing** | ⚪ Gray (50% opacity) | Speculative or missing nodes |

## Usage

### Quick Start

1. **From the repository root**, start a local web server:
   ```bash
   npx http-server -p 8080
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8080/dashboard/
   ```

3. The dashboard will automatically load `REFERENCE_MAP.json` from the repository root.

### Alternative: Using npm scripts

Add this to your workflow by adding an npm script in `package.json`:

```json
{
  "scripts": {
    "dashboard": "npx http-server -p 8080 -o /dashboard/"
  }
}
```

Then run:
```bash
npm run dashboard
```

### Controls

- **Mouse Wheel**: Zoom in/out
- **Click & Drag**: Pan the view
- **Click Node**: Show node details in the info panel
- **Filter Checkboxes**: Toggle visibility of entity types
- **Reset View**: Fit all visible nodes into the viewport
- **Reload Data**: Refresh the dashboard with latest REFERENCE_MAP.json

## Data Structure

The dashboard reads from `REFERENCE_MAP.json` in the repository root. Expected structure:

```json
{
  "generated": "2025-12-12T00:00:00Z",
  "nodes": [
    {
      "canonical_id": "char-0001",
      "type": "character",
      "name": "Rell",
      "path": "characters/Rell.md",
      "status": "canonical"
    }
  ],
  "edges": [
    {
      "from": "char-0001",
      "to": "char-0002",
      "type": "characters"
    }
  ]
}
```

### Node Properties

- `canonical_id` (required): Unique identifier
- `type` (required): Entity type (character, location, mechanics, faction, story)
- `name` (required): Display name
- `path` (optional): File path in repository
- `canon_tier` (recommended): Retrieval authority tier — one of: `primary_canon`, `working_canon`, `draft`, `speculative`, `sandbox`, `test`, `deprecated`. Used by agents, prompt packs, and reports to prefer authoritative sources.
- `source_weight` (recommended): Numeric provenance score (higher = stronger signal). Typical ranges: primary_canon ≥ 100, working_canon ~90-95, draft ~50-70, speculative/sandbox ~30-60, test ~5-20. Drives deterministic sort order in context builders and export packs.
- `retrieval_role` (recommended): Human-readable role hint, e.g. `authoritative`, `working_reference`, `active_draft`, `exploratory`, `test_fixture`. Mirrors `canon_tier` but is more descriptive for LLM prompts.
- `status` (optional): Legacy / display status ("canonical", "speculative", or "missing"). Newer artifacts prefer the three fields above.

### Edge Properties

- `from` (required): Source canonical_id
- `to` (required): Target canonical_id
- `type` (required): Relationship type

## Technical Details

### Dependencies

- **vis-network**: Network graph visualization library (loaded via CDN)
- No build process required - pure HTML/CSS/JavaScript

### Browser Requirements

- Modern browsers with ES6+ support
- JavaScript must be enabled
- Fetch API support (all modern browsers)

### File Structure

```
dashboard/
├── index.html      # Main HTML file with styles
├── dashboard.js    # Dashboard logic and graph rendering
└── README.md       # This file
```

### Physics Simulation

The graph uses a force-directed layout with the following parameters:
- **Gravitational Constant**: -50 (nodes repel each other)
- **Spring Length**: 150px (preferred distance between connected nodes)
- **Spring Constant**: 0.08 (edge stiffness)
- **Damping**: 0.4 (motion decay)

The physics simulation runs for 200 iterations on initial load, then disables for better performance.

## Troubleshooting

### "Failed to load REFERENCE_MAP.json"

**Problem**: The dashboard can't find or load the reference map file.

**Solutions**:
1. Make sure you're running a local web server (not opening `index.html` directly)
2. Verify `REFERENCE_MAP.json` exists in the repository root
3. Check browser console for detailed error messages

### Graph is Empty

**Problem**: No nodes or edges are visible.

**Solutions**:
1. Check that all filter checkboxes are enabled
2. Verify `REFERENCE_MAP.json` has valid `nodes` and `edges` arrays
3. Click "Reset View" to fit the graph in the viewport

### Graph is Too Crowded

**Problem**: Too many nodes make the graph difficult to read.

**Solutions**:
1. Use filter checkboxes to hide entity types you're not interested in
2. Zoom in on specific clusters
3. Click individual nodes to see their details

### Performance Issues

**Problem**: Graph is slow or unresponsive with many nodes.

**Solutions**:
1. Filter out entity types to reduce visible nodes
2. Disable physics after initial layout (done automatically)
3. Close the browser's developer tools
4. Use a modern browser with hardware acceleration

## Development

### Adding New Features

To extend the dashboard:

1. **Add new entity types**: Update `typeColors` object in `dashboard.js`
2. **Modify physics**: Adjust parameters in the `options.physics` section
3. **Change styling**: Edit the `<style>` section in `index.html`
4. **Add new controls**: Add HTML elements and wire up event listeners

### Updating the Reference Map

The dashboard automatically reflects changes to `REFERENCE_MAP.json`. To update:

1. Modify `REFERENCE_MAP.json` in the repository root
2. Click "Reload Data" button in the dashboard
3. Or refresh the page

### Integration with CI/CD

The dashboard can be integrated into GitHub Actions or other CI/CD pipelines:

```yaml
# Example: Deploy dashboard to GitHub Pages
- name: Deploy Dashboard
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./dashboard
    keep_files: true
```

## Future Enhancements

Potential improvements for future versions:

- [ ] Search functionality to find specific entities
- [ ] Path highlighting to show connections between two nodes
- [ ] Export graph as image (PNG/SVG)
- [ ] Timeline view for temporal relationships
- [ ] Diff view to compare reference maps over time
- [ ] Integration with validation reports
- [ ] Custom layout algorithms (hierarchical, circular, etc.)
- [ ] Node grouping by entity type
- [ ] Edge filtering by relationship type
- [ ] Visual distinction (opacity, stroke, badges) for `canon_tier` / `retrieval_role` directly in the graph
- [ ] Filter chips or legend sections driven by `canon_tier` buckets (primary/working/draft/etc.)

## License

Part of The Forgotten Tides Universe repository.  
© 2025 Jeffrey A. Zyjeski. All rights reserved.

## Related Documentation

- [STRUCTURAL_AUDIT_AND_OPTIMIZATION_PLAN.md](../archive/project-history/STRUCTURAL_AUDIT_AND_OPTIMIZATION_PLAN.md) - Historical Phase 7 requirements
- [CANONICAL_INDEX.md](../CANONICAL_INDEX.md) - Entity index
- [REFERENCE_MAP.json](../REFERENCE_MAP.json) - Data source

## Support

For issues or questions about the dashboard:
1. Check this README for common solutions
2. Review the browser console for error messages
3. Verify `REFERENCE_MAP.json` structure
4. Open an issue in the repository
