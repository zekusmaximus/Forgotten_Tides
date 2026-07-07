# Repository Audit: The Forgotten Tides

**Evaluator:** AI Agent (Manus), completing a full story-writing and linting task from cold start  
**Date:** May 23, 2026  
**Task Performed:** Clone repo → understand universe → write a canon-compliant short story → add all supporting entities → pass all linting/checks → push to GitHub

---

## Overall Ratings

| Category | Rating (1–10) | Notes |
|----------|:---:|-------|
| **Discoverability of what to do** | 7/10 | Multiple good docs exist, but no single "start here" path for story-writing agents |
| **Speed to productive work** | 6/10 | Took significant exploration before I could confidently begin writing |
| **Lore accessibility** | 9/10 | Excellent — rich, well-organized, internally consistent |
| **Schema/validation clarity** | 7/10 | Schemas exist and work, but allowed values are only discoverable by reading JSON |
| **Confidence in canon compliance** | 8/10 | Linting catches most issues; some gaps remain (see below) |
| **Reusability of my additions** | 8/10 | New entities are properly indexed and cross-referenced |
| **Overall agent-readiness** | 7/10 | Strong foundation, but specific friction points slow cold-start agents |

---

## Part 1: What Worked Exceptionally Well

### 1.1 The Lore Layer is Outstanding

The `lore/`, `mechanics/`, and `lore/theology/` directories are genuinely excellent. They are:
- Internally consistent
- Written with narrative stakes (not dry wikis)
- Layered from physics → economy → politics → theology
- Clearly delineated between "hard rules" and "cultural interpretation"

An agent reading `MEMORY_PHYSICS.md`, `MEMORY_ECONOMY.md`, `POLITIES_AND_FACTIONS.md`, `SPECIES_OVERVIEW.md`, and `THEOLOGY_OF_MEMORY.md` in sequence gets a complete, coherent worldview in about 10 minutes of reading. This is rare and valuable.

### 1.2 AGENT.md is a Strong Guardrail Document

The `AGENT.md` file does exactly what it should: it establishes non-negotiable rules, tonal constraints, and prohibited moves. It reads like a system prompt and functions as one. The "Canon Compliance Tests" section (§6) is particularly useful as a final self-check.

### 1.3 The Linting Suite is Comprehensive and Functional

The `npm run lint` and `npm run check` pipelines are genuinely impressive. They catch:
- Schema violations in frontmatter
- Unresolved cross-references
- Missing canonical IDs
- Glossary term drift
- Continuity invariant violations
- Timeline inconsistencies

The fact that everything exits with clear pass/fail signals makes it possible for an agent to iterate until clean. This is a major strength.

### 1.4 The Linkmap Auto-Generation is Smart

Running `npm run linkmap:build` after adding entities automatically regenerates `CANONICAL_INDEX.md`, `REFERENCE_MAP.json`, and `docs/link_map/LINK_MAP.md`. This means an agent doesn't need to manually maintain the index — it just needs to know to run the command. Good design.

### 1.5 Existing Stories Set a Clear Quality Bar

The four existing short stories (`The Archivist's Wake`, `Memoir of a Nobody`, `The Tuner of Last Lights`, `The Light Inheritance`) are tonally consistent and demonstrate the expected output quality. They serve as implicit style guides.

---

## Part 2: Friction Points I Encountered

### 2.1 No Single "Write a Story" Playbook

**The Problem:** When I arrived at the repo with the task "write a new short story," I had to piece together the workflow from at least 6 different documents:
- `README.md` (overview)
- `AGENT.md` (rules)
- `CONTRIBUTING.md` (process)
- `docs/INSTRUCTION_MANUAL.md` (tooling)
- `docs/STYLE.md` (prose guidance)
- `docs/schemas/story.schema.json` (frontmatter requirements)

None of these documents says: *"To add a new short story, do steps 1–8 in this order."*

**Time Cost:** ~15 minutes of exploration before I felt confident enough to begin.

**Impact:** A less capable agent might miss a step (e.g., forgetting to add character files, or not knowing to run `linkmap:build` after adding entities).

### 2.2 Allowed Enum Values Are Hidden in Schema JSON

**The Problem:** The `themes` field in `story.schema.json` only allows six specific values:
```
memory-as-cost, identity-erosion, sacrifice, conceptual-fragility, quiet-heroism, memory-preservation
```

I only discovered this after my story failed `lint:schema`. Similarly, `metadata.status` for locations/characters only allows `canonical | speculative | deprecated` (not `draft`), which I also discovered only via lint failure.

**Time Cost:** Two lint-fix-relint cycles.

**Impact:** Every new agent will hit this. The allowed values are not documented anywhere in human-readable form outside the raw JSON schema files.

### 2.3 The `stories/README.md` is Stale

It only lists the flagship novel and The Archivist's Wake. Four other short stories exist but aren't listed. This makes it harder for an agent to quickly inventory what's been written.

### 2.4 Faction/Location Coverage is Sparse

The `POLITIES_AND_FACTIONS.md` lore document describes 7 major factions, but only 1 (`Canticle Fleet`) has a proper entity file in `factions/`. Similarly, `COSMIC_REGIONS.md` describes 6 regions, but only 2 locations have entity files in `atlas/`. This means:
- An agent writing about the Obsidian Synod can't cross-reference `fact-0002` because it doesn't exist
- The `lint:refs` check will warn on references to entities that *should* exist based on the lore

### 2.5 No "Next Available ID" Registry

When I needed to assign `story-0005`, `char-0005`, `char-0006`, and `loc-0002`, I had to manually scan `CANONICAL_INDEX.md` to determine the next available number. This is error-prone, especially for agents working in parallel or if the index is stale.

### 2.6 The `cross_refs` vs `references` Distinction is Unclear

Every entity file has both `cross_refs` and `references` with identical structure. The schema requires both. But no document explains the semantic difference between them. I duplicated the same IDs in both (as existing files do), but I have no confidence this is correct.

### 2.7 Lore Documents Lack Schema Validation

The `lore/` directory files have frontmatter with `type: lore`, but there is no `lore.schema.json`. The schema validator skips them entirely (they don't appear in the `walkDir` calls in `schema_validate.js`). This means lore documents can drift in format without any automated check.

### 2.8 The `authoring.js` Helper Creates Non-Compliant Files

The built-in `npm run author:apply` script generates story scaffolds with simplified metadata (`kind`, `status`, `created`) that doesn't match the full `story.schema.json` requirements. An agent using the built-in tooling would produce files that fail `lint:schema`.

---

## Part 3: Detailed Recommendations

### Priority 1: Create a `PLAYBOOK_NEW_STORY.md` (High Impact, Low Effort)

Create a single document at the repo root or in `docs/` that provides a step-by-step recipe for adding a new short story. This is the single highest-impact change for agent productivity.

**Suggested content:**

```markdown
# Playbook: Adding a New Short Story

## Prerequisites
- Read: AGENT.md, docs/STYLE.md
- Scan: lore/, mechanics/, characters/
- Review: At least one existing story in stories/short_story/

## Step 1: Determine Next Available IDs
- Check CANONICAL_INDEX.md for the next story-####, char-####, loc-#### numbers

## Step 2: Write the Manuscript
- Location: stories/short_story/<snake_case_title>/manuscript.md
- Frontmatter: Must match docs/schemas/story.schema.json
- Required fields: id, type, summary_50, summary_200, cross_refs, references
- Allowed themes: [list them]
- Allowed status values: canonical, speculative, deprecated, draft
- Allowed canon_tier values: [list them]

## Step 3: Create Supporting Entities
- Characters: characters/<Name>.md (must match character.schema.json)
- Locations: atlas/<Name>.md (must match location.schema.json)
- Factions: factions/<Name>.md (must match faction.schema.json)
- NOTE: metadata.status for characters/locations/factions allows ONLY:
  canonical, speculative, deprecated

## Step 4: Add Lexicon Terms (if new terminology introduced)
- File: data/lexicon/terms.yaml
- Use status: draft for new terms

## Step 5: Validate
npm run lint          # Must pass with 0 errors
npm run check         # Must pass with 0 hard failures
npm run linkmap:build # Regenerates indexes

## Step 6: Commit
- Use conventional commits: feat(story): add '<title>'
- Include Canon Impact note in commit message
```

### Priority 2: Create a Human-Readable Schema Reference

Create `docs/SCHEMA_QUICK_REFERENCE.md` that lists all enum constraints in one place:

| Field | Allowed Values |
|-------|---------------|
| story.themes | memory-as-cost, identity-erosion, sacrifice, conceptual-fragility, quiet-heroism, memory-preservation |
| story.status | canonical, speculative, deprecated, draft |
| story.canon_tier | primary_canon, working_canon, draft, speculative, sandbox, test, deprecated |
| story.story_type | short-story, novel, novella, scene, fragment |
| character.metadata.status | canonical, speculative, deprecated |
| location.location_type | station, planet, ship, region, artifact, structure |
| location.metadata.status | canonical, speculative, deprecated |

This eliminates the most common lint failure for new contributors.

### Priority 3: Populate Missing Faction and Location Entities

The lore documents describe entities that don't have corresponding files:

**Factions needing entity files:**
- Archivist Orders (referenced constantly but no `factions/Archivist_Orders.md`)
- Mnemosyne Lattice Consortium
- Drift Clades
- Obsidian Synod
- Remembrancers of Solace
- Heliodrome Authority

**Locations needing entity files:**
- Helios Drift (region)
- Lattice Gap (region)
- Remnant Seas (region)
- Mnemosyne Lattice Core (region)
- The Void Regions
- The Black Horizon

This would allow future stories to properly cross-reference these entities with canonical IDs, making the reference graph complete.

### Priority 4: Add an ID Auto-Increment Script

Create a simple utility:
```bash
npm run ids:next -- --type char
# Output: char-0007
```

This prevents ID collisions and removes guesswork for agents.

### Priority 5: Document the `cross_refs` vs `references` Distinction

Add a clear explanation to `CONTRIBUTING.md` or the schema docs:
- What is `cross_refs` for? (e.g., "entities that appear in or are mentioned by this entity")
- What is `references` for? (e.g., "entities that this entity depends on for continuity")
- Are they always identical? If so, why have both?
- If not, when do they diverge?

### Priority 6: Add a Lore Schema

Create `docs/schemas/lore.schema.json` and add `lore/` to the schema validator's directory scan. This ensures lore documents maintain consistent frontmatter as the repo grows.

### Priority 7: Update `stories/README.md`

Either auto-generate this from the canonical index, or manually update it to list all current stories. A stale index is worse than no index.

### Priority 8: Expand the Theme Enum (or Make It Open)

The current allowed themes (`memory-as-cost`, `identity-erosion`, `sacrifice`, `conceptual-fragility`, `quiet-heroism`, `memory-preservation`) are quite narrow. Consider either:
- Adding more values: `institutional-burden`, `ethical-forgetting`, `inheritance`, `duty-vs-faith`
- Making the field accept any string but providing a recommended list in documentation
- Adding a `custom_themes` array for non-enum values

### Priority 9: Add a "Lore Gaps" or "Story Opportunities" Document

Create a living document (perhaps `docs/STORY_OPPORTUNITIES.md`) that explicitly lists:
- Unexplored regions, factions, or mechanics
- Character arcs left open
- Thematic territory not yet covered
- Specific scenarios that would enrich the canon

This gives agents a menu of options rather than requiring them to deduce gaps from reading everything.

### Priority 10: Harmonize `authoring.js` with Schema Requirements

The built-in authoring helper (`npm run author:apply`) should generate files that pass `lint:schema` out of the box. Currently it produces simplified metadata that doesn't match the story schema. Either:
- Update the script to generate full-schema-compliant frontmatter
- Or clearly document that it's for "quick drafts" that need manual frontmatter completion

---

## Part 4: What I Wish I'd Found Immediately

If I could redesign the agent onboarding experience, here's what I'd want to see within the first 60 seconds of cloning the repo:

1. **`README.md`** → Already good. Points to AGENT.md and the first canonical story.

2. **A `QUICKSTART_AGENT.md`** at the root that says:
   > "You are an AI agent tasked with contributing to this universe. Here is your reading order, your workflow, and your checklist. Do not skip steps."

3. **Reading order explicitly stated:**
   1. `AGENT.md` (rules)
   2. `docs/STYLE.md` (voice)
   3. `mechanics/MEMORY_PHYSICS.md` (core physics)
   4. `mechanics/ANCHOR_THEORY.md` (pilot mechanics)
   5. `lore/POLITIES_AND_FACTIONS.md` (political landscape)
   6. `stories/short_story/the_archivists_wake/manuscript.md` (exemplar)
   7. `docs/SCHEMA_QUICK_REFERENCE.md` (frontmatter constraints)
   8. `PLAYBOOK_NEW_STORY.md` (step-by-step workflow)

4. **A pre-flight checklist** before writing:
   - [ ] I know the next available IDs
   - [ ] I've read at least one canonical story
   - [ ] I know the allowed theme values
   - [ ] I know what entities I need to create alongside the story
   - [ ] I know the lint commands to run

---

## Part 5: Summary Assessment

The Forgotten Tides repository is remarkably well-built for a creative fiction project. The combination of rigorous schema validation, automated linting, canonical ID governance, and rich lore documentation puts it far ahead of most worldbuilding repositories. The lore itself is genuinely compelling and internally consistent — I felt confident writing within this universe because the rules are clear and the existing stories demonstrate them beautifully.

The primary gap is **workflow documentation for the specific task of "add a new story."** The information exists across many files, but no single document assembles it into a linear recipe. An agent arriving cold must currently:
1. Discover that schemas exist
2. Discover what values they allow
3. Discover that supporting entities are expected
4. Discover the correct lint/build commands
5. Discover the correct commit conventions

Each of these is individually documented, but the *sequence* and *completeness requirements* are not. A 2-page playbook document would eliminate 80% of the friction I experienced and would make this repository genuinely exceptional for multi-agent collaborative worldbuilding.

---

## Appendix: Files I Read (in order) to Complete the Task

| # | File | Purpose |
|---|------|---------|
| 1 | README.md | Project overview |
| 2 | AGENT.md | Canon rules and constraints |
| 3 | CANONICAL_INDEX.md | Entity registry |
| 4 | stories/short_story/the_archivists_wake/manuscript.md | Exemplar story |
| 5 | stories/short_story/memoir_of_a_nobody/manuscript.md | Second story |
| 6 | stories/short_story/the_tuner_of_last_lights/manuscript.md | Third story |
| 7 | stories/short_story/the_light_inheritance/manuscript.md | Fourth story |
| 8 | lore/MEMORY_ECONOMY.md | Economic worldbuilding |
| 9 | lore/POLITIES_AND_FACTIONS.md | Political landscape |
| 10 | lore/COSMIC_REGIONS.md | Geography |
| 11 | mechanics/MEMORY_PHYSICS.md | Core physics |
| 12 | lore/SPECIES_OVERVIEW.md | Species context |
| 13 | lore/theology/THEOLOGY_OF_MEMORY.md | Thematic depth |
| 14 | data/lexicon/terms.yaml | Canonical terminology |
| 15 | docs/schemas/story.schema.json | Frontmatter requirements |
| 16 | characters/Rell.md | Character file format |
| 17 | atlas/Heliodrome.md | Location file format |
| 18 | factions/Canticle_Fleet.md | Faction file format |
| 19 | docs/INSTRUCTION_MANUAL.md | Tooling reference |
| 20 | CONTRIBUTING.md | Process rules |
| 21 | docs/STYLE.md | Prose guidance |

**Total files read before writing:** 21  
**Time to first productive output:** ~25 minutes of reading/exploration  
**Lint failures before passing:** 2 cycles (themes enum, metadata.status enum)  
**Confidence in final output:** High — the linting suite confirmed compliance
