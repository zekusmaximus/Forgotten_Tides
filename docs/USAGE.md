# Forgotten Tides CLI Usage Guide

## Quickstart

The Forgotten Tides CLI provides a structured workflow for worldbuilding, storytelling, and canon management in the Forgotten Tides universe.

On Windows PowerShell, use `npm.cmd` for npm commands if execution policy blocks `npm.ps1`.

For short-story contributions, `docs/PLAYBOOK_NEW_STORY.md` is the source of truth. Run `npm run validate:ci` before opening a PR.

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
Creates a brainstorming template with the query, selected IDs, and a prompt-pack link. Fill in the ideas after reviewing the referenced material.

**Example:**
```bash
node scripts/prompt/orchestrate.js "brainstorm ways memory loss affects starship navigation"
```

**Output:**
- Creates `lore/ideas/{timestamp}_brainstorm.md`
- Includes prompts to develop 5–8 options and label speculative ideas

### `outline`
Creates a three-act outline template.

**Example:**
```bash
node scripts/prompt/orchestrate.js "outline a story about the Archivist discovering a forgotten star"
```

**Output:**
- Creates `lore/ideas/{timestamp}_outline.md`
- Provides empty Act I, II, and III sections and links the prompt pack

### `revise_scene`
Creates a revision-plan template for an existing scene.

**Example:**
```bash
node scripts/prompt/orchestrate.js "revise the memory corridor collapse scene to be more dramatic"
```

**Output:**
- Creates `lore/ideas/{timestamp}_revision_plan.md`
- Leaves fields for target scenes, changes, and continuity constraints

### `worldbuild_mechanics`
Creates a speculative mechanics template for later review.

**Example:**
```bash
node scripts/prompt/orchestrate.js "worldbuild how memory gravity affects black holes"
```

**Output:**
- Creates `lore/ideas/{timestamp}_mechanics_notes.md`
- Leaves prompts for hypotheses, tests, and candidate changes

### `compile_artifacts`

Compiles `primary_canon` story manuscripts and their referenced scenes into
`out/compiled/forgotten_tides_stories.md`. Missing scene references stop the
command without replacing a prior compilation. Use `scripts/compile_stories.sh`
below when an ePub is also needed.

```bash
node scripts/prompt/orchestrate.js "compile stories for review"
```

## Continuity Dashboard

Visualize canonical relationships between entities in the universe using an interactive network graph.

```bash
npm run dashboard
```

On Windows PowerShell, use `npm.cmd run dashboard` if execution policy blocks
`npm.ps1`.

Then open your browser to `http://127.0.0.1:8080/dashboard/`

**Features:**
- Interactive network graph visualization of all entities
- Color-coded nodes for characters, locations, mechanics, factions, stories, lore, and terms
- Click nodes to view detailed information
- Filter by entity type to focus on specific relationships
- Zoom, pan, and navigate large relationship graphs
- Highlights missing or speculative nodes
- Reads from `REFERENCE_MAP.json` in real-time

**Use Cases:**
- High-level continuity review
- Identifying entity relationship patterns
- Finding isolated or disconnected entities
- Exploring cross-references between mechanics and stories
- Understanding faction relationships

See [dashboard/README.md](../dashboard/README.md) for detailed documentation.

## Dependency Impact Report

Regenerate the reference map before checking what depends on an entity or
story. The report follows declared causal `references` and event source-story
links, showing direct and downstream dependents with their canon tiers. Add
`--include-mentions` to see `cross_refs` candidates as well.

```bash
npm run linkmap:build
npm run report:impact -- --id story-0007
npm run report:impact -- --id loc-0010 --include-mentions
npm run --silent report:impact -- --id story-0007 --json
```

Direct results include declared references from any file. Downstream traversal
follows story and event dependencies; it stops at character, faction, location,
and other entity links because older metadata sometimes copied associations
into `references`. `--include-mentions` adds direct `cross_refs` and mentions of
events sourced from the target story as review candidates. These structured
links help identify files to review, but prose may contain undeclared
dependencies. Review the affected stories before changing approved facts or
promoting a draft.

## Atlas Map Data

The atlas map's placements live in `design/map/cartography.yaml`. Its claims
and drawing rules cite the register in `design/map/CARTOGRAPHIC_BRIEF.md`, and
its densities come only from atlas frontmatter.

```bash
npm run lint:map                          # check placements against canon
npm run map:data                          # author build -> out/map/atlas.author.json
npm run map:data -- --build public        # public build -> out/map/atlas.public.json
npm run --silent lint:map -- --json       # findings as JSON
```

`lint:map` runs as part of `npm run lint`, so `validate:ci` fails on any of
these:

- An unplaced primary- or working-canon location. An unplaced speculative
  location is a warning.
- A site outside the region or band its atlas `coordinates.region` names.
- A field that misses a locked `memory_density` by more than 0.02.
- A claim, rule, source line, or timeline anchor that does not exist.
- A `canon` feature or route without a canon source.
- A relation from the brief that no longer holds.

`map:data` refuses to build while the lint reports errors. The public build
leaves speculative entities and draft material out of the file itself.
`npm run test:map` exercises every lint rule against a fixture.

## Story Compilation (Local)

Compile primary-canon story manuscripts into a single Markdown source and an ePub. The
selection follows each manuscript's `canon_tier: primary_canon` frontmatter.
Manuscript
scene references are expanded once, in place; scene files that are not referenced
are omitted. Outlines, notes, backups, and work directories marked `TEST`,
`SAMPLE`, or `SANDBOX` are excluded. Requires Node.js,
installed npm dependencies, and Pandoc.

```bash
scripts/compile_stories.sh
```

**Output:**
- `out/compiled/forgotten_tides_stories.md`
- `out/compiled/forgotten_tides_stories.epub`

## Publication Compilation

Publication selection and reading order live in an explicit JSON manifest. No
publication table of contents is selected by default. Create a file inside the
repository, such as `data/publication/issue_01.json`:

```json
{
  "title": "Issue 01",
  "works": [
    { "kind": "short_story", "work": "the_archivists_wake" },
    { "kind": "short_story", "work": "the_reliquarists_doubt" }
  ]
}
```

The `works` array is the reading order. Its entries use the directory names
under `stories/<kind>/`; valid kinds are `short_story`, `novella`, `novel`, and
`screenplay`. The example is illustrative, not an approved publication list.
The publication compiler may include a draft when it is deliberately listed.
Preview the proposed contents, source paths, canon tiers, and statuses before
assembling:

```bash
npm run publication:plan -- --manifest data/publication/issue_01.json
mkdir -p out/compiled
npm run publication:assemble -- --manifest data/publication/issue_01.json > out/compiled/issue_01.md
```

The second command writes the selected manuscripts and referenced scenes as
Markdown in manifest order. To produce an ePub after reviewing that Markdown:

```bash
pandoc out/compiled/issue_01.md --metadata title="Issue 01" -o out/compiled/issue_01.epub
```

Missing works, duplicate entries, unsafe paths, and missing scene references
stop assembly. The publication compiler never silently falls back to the canon
collection.

## Chunking & Summaries (RAG)

Generate chunked JSON artifacts with short summaries for larger markdown files.

```bash
npm run context:chunk
```

**Output:**
- `out/chunks/*.json` per source file
- `out/chunks/chunk_manifest.json`

**Optional environment overrides:**
- `CHUNK_MAX_CHARS` (default: 1400)
- `CHUNK_MIN_CHARS` (default: 400)
- `CHUNK_OUT_DIR` (default: `out/chunks`)
- `CHUNK_ROOT_DIR` (default: repo root)

### `export_pack_only`
Exports a prompt pack and records the context and session report.

**Example:**
```bash
node scripts/prompt/orchestrate.js "export pack for memory physics" --profile technical
```

**Output:**
- Creates JSON prompt pack in `out/prompts/`
- Creates its Markdown companion, a context JSON file, and an ignored session report

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
- `worldbuilding`: Prioritizes rules and mechanics

**Usage:**
```bash
# Use storytelling profile
node scripts/prompt/orchestrate.js "brainstorm character arcs" --profile storytelling

# Use technical profile for mechanics
node scripts/prompt/orchestrate.js "worldbuild memory physics" --profile technical
```

### Entity Caps

- **Orchestrator prompt-pack limit**: 50 entities after context selection
- **Direct context builder**: Uses the selected profile's cap unless `--max` is set
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

## Validation Coverage

The short-story PR gate is `npm run validate:ci`. It rebuilds generated canon artifacts, checks the tracked outputs for drift, runs lint and continuity checks, and executes the same smoke/policy tests used by CI.

`npm run lint:schema` is strict for short-story manuscripts and canonical entity roots. It reports skips and warnings for out-of-scope development material such as novel, novella, screenplay, notes, and unschematized YAML, but those optional skips do not satisfy or weaken the short-story gate.

Continuity and timeline checks recursively scan story markdown and write reports to `out/reports/continuity.json` and `out/reports/timeline_variance.json`.

```bash
npm run validate:ci
```

## Canon Discrimination

Prompt packs and graph outputs include `canon_tier`, `source_weight`, and `retrieval_role` so LLM review can distinguish authoritative canon from drafts, tests, and sandbox material.

Canonical tiers:
- `primary_canon`: published or governing canon such as mechanics, characters, bible material, lexicon, and The Archivist's Wake.
- `working_canon`: stable lore/manual material that can guide future writing.
- `draft`: active story/work material that should not be treated as settled universe law.
- `speculative`, `sandbox`, `test`, `deprecated`: non-authoritative material excluded or down-ranked by default.

Useful commands:
```bash
npm run report:canon-tiers
node scripts/prompt/context_builder.js "memory corridor physics" --canon-only
node scripts/prompt/export_prompt_pack.js --canon-only mech-0001 term-0007
node scripts/prompt/export_prompt_pack.js --include-test scene_screenplay_sample_001
```

Default prompt-pack behavior excludes test and sandbox material while allowing active drafts with lower source weight. Use `--canon-only` for LLM conversations that should only cite authoritative or working canon.
Add `--include-drafts` with `--canon-only` to include active drafts as well;
speculative, sandbox, test, and deprecated material remains excluded.

## Determinism & Token Discipline

### Deterministic Behavior

- Entity IDs are sorted alphabetically for consistent ordering
- Session state uses deterministic JSON serialization
- Output filenames use ISO timestamps for uniqueness

### Token Discipline

- **Orchestrator hard cap**: 50 selected entities per prompt pack
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
- Run `npm run lint:schema` to identify schema issues, or `npm run validate:ci` for the full PR gate
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

Session reports are written to the ignored `out/session/reports/` directory.

### Environment Requirements

- **Node.js**: Version 20+
- **Dependencies**: Install with `npm install` (or `npm.cmd install` on Windows PowerShell when required)
- **Directory Structure**: Must maintain standard layout
- **File Permissions**: Write access to `out/`, `lore/`, and the selected work directory

## Best Practices

1. **Start with specific queries** for better ID resolution
2. **Use profiles** to match your workflow type
3. **Carry sessions** for related workflows
4. **Clear sessions** when switching contexts
5. **Validate regularly** with `npm run lint:schema`
6. **Run the PR gate** with `npm run validate:ci`
7. **Check link maps** with `npm run linkmap:build`
8. **Monitor token usage** with entity caps

## System Upgrades (V2)

### Promise/Payoff, Stakes, Knowledge, Moral, Reader, POV
```bash
npm run lint:promise -- --work "<name>" --json       # promise/setup/payoff coverage
npm run check:stakes -- --work "<name>" --json       # stakes drift + irreversibility
npm run check:knowledge -- --work "<name>" --json    # epistemic state drift
npm run lint:scene-failure -- --work "<name>" --json # inert scene detection
npm run lint:moral -- --work "<name>" --json         # moral physics accounting
npm run check:reader -- --work "<name>" --json       # reader-model confusion/decay
npm run report:pov -- --work "<name>" --json         # POV pressure analytics
```

### Revision + Compilation Helpers
```bash
npm run compile:edit -- --work "<name>"              # edit packet with stakes/knowledge/moral table
npm run compile:screenplay -- --work "<name>"        # emit .fountain from screenplay scenes
npm run lint:screenplay -- --work "<name>"           # screenplay format guardrails
node scripts/prompt/scene_diff.js --scene <new> --previous <old>  # semantic diff for replacements
```

### Sandbox + Drafting Mode
```bash
npm run sandbox:lint                                 # enforce canonical_lock and schema on sandbox/*
npm run sandbox:merge -- --into canonical --if clean # gated copy to out/sandbox/merged
npm run start:draft -- --work "<name>" --mode fast   # init work with draft_unstable status
```

### One-command validation
```bash
npm run validate:ci                              # CI-parity gate for PRs
npm run validate:work -- --work "<name>"
```
`validate:ci` is the PR gate. `validate:work` generates V2 work-level reports under `out/reports/` without stopping on warnings.

## New Intents & Examples

Authoring commands that write scene, note, or outline content read the body from
standard input until EOF. The examples below use a Markdown file as input; on
PowerShell, use `Get-Content -Raw draft.md | node ...` instead of `< draft.md`.
Name an existing work for scene and outline changes. Run `start_work` first for
a new work.

### `save_scene`
Saves scene content to the appropriate location.

**Example:**
```bash
node scripts/prompt/orchestrate.js 'save this as a scene "A New Passage" in "First Corridor"' < draft.md
```

**Output:**
- Creates `stories/{kind}/{work_id}/scenes/SCENE_<hash>.md`
- Adds a scene entry to the manuscript frontmatter and updates work metadata
- Uses order 1 unless the request specifies a supported position

### `start_work`
Initializes a new work project with outline and structure.

**Example:**
```bash
node scripts/prompt/orchestrate.js 'start a new novella titled "Outer Veil Expedition"'
```

**Output:**
- Creates `stories/novella/NOVELLA_OUTER_VEIL_EXPEDITION/`
- Generates initial outline file
- Sets up scenes directory
- Creates a draft `manuscript.md` with story frontmatter

**Place scene examples:**
```bash
node scripts/prompt/orchestrate.js 'place this as a scene "Crossing" after SCENE_ABC123 in "First Corridor"' < draft.md
```

Use a real scene ID from `npm run scenes:list -- --work "First Corridor"` in place
of `SCENE_ABC123`.

### `replace_scene`
Replaces existing scene content while maintaining structure.

**Example:**
```bash
node scripts/prompt/orchestrate.js 'replace the scene "Existing Scene" in "First Corridor"' < revision.md
```

**Output:**
- Updates existing scene file
- Preserves scene frontmatter and writes a backup under the work's `.backups/scenes/` directory
- Preserves manuscript include order

### `save_notes`
Saves general notes and ideas for future reference.

**Example:**
```bash
node scripts/prompt/orchestrate.js 'save notes "Research Log"' < notes.md
```

**Output:**
- Creates `lore/notes/NOTES_<slug>_<uuid>.md` with draft frontmatter

### `update_outline`
Updates existing outline with new structure or content.

**Example:**
```bash
node scripts/prompt/orchestrate.js 'update outline for "First Corridor"' < outline.md
```

**Output:**
- Replaces the body of the existing work's `outline.md`, preserving its frontmatter when present

## File conventions

New works use `stories/{kind}/{KIND_SLUG}/`, where `kind` is `short_story`, `novella`, `novel`, or `screenplay`. Existing work directories may use older IDs. Work resolution accepts an unambiguous title or directory ID. Each work has `manuscript.md` and `meta.yaml`; authoring may also create `outline.md` and `scenes/`. General notes live under `lore/notes/`. Session state, reports, prompt packs, and compiled output live under ignored `out/` paths.

`meta.yaml` starts with `id`, `title`, `status`, `created`, and `modified`. Novel metadata also has `type`. The file may contain additional author-maintained fields. A parse error stops an update; the CLI preserves the existing file.

A new scene is stored as `scenes/SCENE_<hash>.md`. Its frontmatter contains a lowercase `id`, `schema_version`, `title`, `work_id`, `order`, `status`, `tags`, `created`, and `word_count`. The manuscript frontmatter stores ordered scene objects:

```yaml
scenes:
  - id: scene_example
    title: Example
    order: 1
    file: scenes/SCENE_EXAMPLE.md
```

Older manuscripts can contain string scene entries or `<!-- include: scenes/SCENE_EXAMPLE.md -->` comments. The scene indexer and compiler read these forms. New authoring writes scene objects and preserves the manuscript body when it updates the list. Replaced scenes are backed up under the work's `.backups/scenes/` directory, outside the live scene list.

## Context builder

`context_builder.js` accepts `--profile`, `--max`, `--expand one|none`, `--canon-only`, `--include-drafts`, `--include-test`, and `--include-sandbox`. Profiles come from `docs/agents/context_profiles.json`; the configured names are `default`, `storytelling`, `technical`, and `worldbuilding`. `--include-drafts` adds drafts to `--canon-only` output.

```bash
node scripts/prompt/context_builder.js "character development" --profile storytelling
node scripts/prompt/context_builder.js "memory physics" --max 10 --expand none
```

The command writes a context JSON file under `out/prompts/` and prints its path. See `node scripts/prompt/context_builder.js --help` for current flags.

## Auto-tagging

After a scene is saved or replaced through the orchestrator, auto-tagging updates the scene's `entities` frontmatter. It collects entity IDs from the body, context, prompt pack, and lexicon, then writes up to eight IDs in each of `characters`, `locations`, `factions`, and `rules_used`. It does not infer theme tags. Auto-tagging is advisory; inspect the generated metadata before relying on it.

## Scene navigator

The navigator lists or graphs scenes in manuscript order and resolves a scene to a path. `graph` prints Mermaid text. `open` prints the path; it does not launch an editor.

```bash
npm run scenes:list -- --work "First Corridor"
npm run scenes:graph -- --work "First Corridor" > scenes.mmd
npm run scenes:open -- --scene SCENE_EXAMPLE --work "First Corridor"
```

`list` and `graph` accept `--work` and optional `--kind`. `open` accepts `--scene` and optional `--work`. Unsupported flags return an error. Use the actual scene ID from `scenes:list` in place of `SCENE_EXAMPLE`.

## Advisory checks and reports

`validate:ci` runs the repository's enforced lint, continuity checks, and test suites. The optional promise, scene-failure, moral, screenplay, and POV commands under “System Upgrades” can be run for focused review; they are not all CI gates. Some scene checks require scene files and report only the scenes they inspected. Work-level reports are written under `out/reports/`. Review the report scope and findings before treating an empty result as coverage of a manuscript.
