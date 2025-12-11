# Forgotten Tides CLI Usage Guide

## Quickstart

The Forgotten Tides CLI provides a structured workflow for worldbuilding, storytelling, and canon management in the Forgotten Tides universe.

### Basic Usage

```bash
# Brainstorm new ideas
node scripts/prompt/orchestrate.js "brainstorm memory corridor stabilization techniques"

# Outline a story
node scripts/prompt/orchestrate.js "outline the Archivist's next mission"

# Worldbuild mechanics
node scripts/prompt/orchestrate.js "worldbuild faction politics in the Outer Veil"

# Get help
node scripts/prompt/orchestrate.js --help
node scripts/prompt/context_builder.js --help
```

## Intents and What They Do

The system supports several intents that determine the workflow and output:

### `brainstorm`
Generates creative ideas and options consistent with canon.

**Example:**
```bash
node scripts/prompt/orchestrate.js "brainstorm ways memory loss affects starship navigation"
```

**Output:**
- Creates `lore/ideas/{timestamp}_brainstorm.md`
- Generates 5-8 options with canonical consistency
- Labels non-canon ideas as 'speculative'

### `outline`
Creates structured story outlines.

**Example:**
```bash
node scripts/prompt/orchestrate.js "outline a story about the Archivist discovering a forgotten star"
```

**Output:**
- Creates `lore/ideas/{timestamp}_outline.md`
- Provides Act I, II, III structure
- Includes canonical references

### `revise_scene`
Plans revisions to existing scenes.

**Example:**
```bash
node scripts/prompt/orchestrate.js "revise the memory corridor collapse scene to be more dramatic"
```

**Output:**
- Creates `lore/ideas/{timestamp}_revision_plan.md`
- Target scene identification
- Change descriptions
- Continuity constraints

### `worldbuild_mechanics`
Explores and documents new mechanics.

**Example:**
```bash
node scripts/prompt/orchestrate.js "worldbuild how memory gravity affects black holes"
```

**Output:**
- Creates `lore/ideas/{timestamp}_mechanics_notes.md`
- Hypotheses and tests
- Candidate canonical changes
- Potential PR content for `data/mechanics`

### `compile_artifacts`
Compiles project artifacts.

**Example:**
```bash
node scripts/prompt/orchestrate.js "compile all artifacts for review"
```

**Output:**
- Builds series bible (EPUB/PDF)
- Exports RAG chunks
- Validates all schemas

### `export_pack_only`
Exports only the prompt pack without additional processing.

**Example:**
```bash
node scripts/prompt/orchestrate.js "export pack for memory physics" --profile technical
```

**Output:**
- Creates JSON prompt pack in `out/prompts/`
- No additional artifacts generated

## Profiles and Caps

### Context Profiles

Context profiles define entity ordering and maximum entity counts. Profiles are defined in `docs/agents/context_profiles.json`.

**Default Profile:**
- Order: rules → characters → locations → mechanics → factions → terms → stories
- Max entities: 8

**Available Profiles:**
- `default`: Balanced approach for general use
- `storytelling`: Prioritizes characters and narrative elements
- `technical`: Focuses on mechanics and rules
- `lore`: Emphasizes factions and cosmic regions

**Usage:**
```bash
# Use storytelling profile
node scripts/prompt/orchestrate.js "brainstorm character arcs" --profile storytelling

# Use technical profile for mechanics
node scripts/prompt/orchestrate.js "worldbuild memory physics" --profile technical
```

### Entity Caps

- **Maximum entities per context pack**: 50 (hard cap)
- **Sticky IDs (session carry)**: Maximum 8 entities
- **History entries**: Maximum 50 sessions

## Session Memory

### `--carry` Flag

Carries forward "sticky IDs" from previous sessions to maintain context continuity.

**Example:**
```bash
# First session - establishes context
node scripts/prompt/orchestrate.js "brainstorm memory corridor physics"

# Subsequent session - carries forward relevant entities
node scripts/prompt/orchestrate.js "outline a story using those physics" --carry
```

**Behavior:**
- Preserves up to 8 most relevant entity IDs
- Merges with current query's entities
- Maintains deterministic ordering

### `--clear` Flag

Clears session state before processing.

**Example:**
```bash
# Clear previous session and start fresh
node scripts/prompt/orchestrate.js "brainstorm new faction politics" --clear
```

**Use Cases:**
- Starting a new unrelated workflow
- Resetting after experimental sessions
- Troubleshooting session issues

## Link Map Generation

Generate and validate link maps for canon consistency:

```bash
# Build link map
npm run linkmap:build

# Validate links
npm run lint:refs
```

**Link Map Components:**
- Entity relationships
- Cross-references
- Canonical dependencies
- Memory corridor connections

## Determinism & Token Discipline

### Deterministic Behavior

- Entity IDs are sorted alphabetically for consistent ordering
- Session state uses deterministic JSON serialization
- Output filenames use ISO timestamps for uniqueness

### Token Discipline

- **Hard cap**: 50 entities per prompt pack
- **Context expansion**: 1-hop relationships only
- **Session history**: Limited to 50 entries
- **Sticky IDs**: Maximum 8 entities carried forward

**Best Practices:**
```bash
# Limit entities explicitly
node scripts/prompt/context_builder.js "complex query" --max 12

# Disable expansion for focused contexts
node scripts/prompt/context_builder.js "specific entity" --expand none
```

## Troubleshooting

### Missing IDs

**Symptoms:**
- Resolved IDs list is empty
- "Could not resolve IDs" warnings

**Solutions:**
1. Verify entity files exist in expected directories
2. Check frontmatter contains valid `id` fields
3. Run validation: `npm run lint:schema`
4. Update lexicon: `data/lexicon/terms.yaml`

### Exceeding Caps

**Symptoms:**
- Only 50 entities in output despite larger input
- Warning about entity cap

**Solutions:**
1. Use `--max` flag to set lower limit
2. Refine query to be more specific
3. Use `--profile` to prioritize relevant entity types
4. Disable expansion with `--expand none`

### Common Issues

**Issue: "Could not get intent classification"**
- Ensure `route_intent.js` is accessible
- Verify Node.js dependencies are installed
- Check query format and content

**Issue: "Could not read context builder output"**
- Verify `out/prompts/` directory exists and is writable
- Check file permissions
- Ensure sufficient disk space

**Issue: Schema validation failures**
- Run `npm run lint:schema` to identify issues
- Check JSON/YAML syntax in entity files
- Validate against schemas in `docs/schemas/`

## Advanced Usage

### Context Builder Direct Usage

```bash
# Basic context building
node scripts/prompt/context_builder.js "memory corridor physics"

# With custom parameters
node scripts/prompt/context_builder.js "faction politics" --profile storytelling --max 15 --expand one

# Disable expansion
node scripts/prompt/context_builder.js "character backstory" --expand none
```

### Session State Management

Session state is stored in `out/session/state.json`:

```json
{
  "last_intent": "brainstorm",
  "active_work": null,
  "sticky_ids": ["memory_corridor", "archivist"],
  "history": [
    {
      "query": "brainstorm memory physics",
      "intent": "brainstorm",
      "ids": ["memory_corridor", "physics_rules"],
      "timestamp": "2025-12-11T15:00:00.000Z"
    }
  ]
}
```

### Environment Requirements

- **Node.js**: Version 18+
- **Dependencies**: Install with `npm install`
- **Directory Structure**: Must maintain standard layout
- **File Permissions**: Write access to `out/`, `lore/`, `docs/`

## Best Practices

1. **Start with specific queries** for better ID resolution
2. **Use profiles** to match your workflow type
3. **Carry sessions** for related workflows
4. **Clear sessions** when switching contexts
5. **Validate regularly** with `npm run lint:schema`
6. **Check link maps** with `npm run linkmap:build`
7. **Monitor token usage** with entity caps