# Playbook: Adding a New Short Story

This is the authoritative step-by-step recipe for contributing a new short story to *The Forgotten Tides*. Follow every step in order. Do not skip steps.

## Prerequisites

Before writing a single word, read the following in this order:

1. [`AGENT.md`](../AGENT.md) — non-negotiable canon rules and prohibited moves
2. [`docs/STYLE.md`](STYLE.md) — prose voice, register, and sentence-level guidance
3. [`mechanics/MEMORY_PHYSICS.md`](../mechanics/MEMORY_PHYSICS.md) — the core physics engine
4. [`mechanics/ANCHOR_THEORY.md`](../mechanics/ANCHOR_THEORY.md) — pilot mechanics
5. [`lore/POLITIES_AND_FACTIONS.md`](../lore/POLITIES_AND_FACTIONS.md) — political landscape
6. At least one existing story in [`stories/short_story/`](../stories/short_story/) — the exemplar format
7. [`docs/SCHEMA_QUICK_REFERENCE.md`](SCHEMA_QUICK_REFERENCE.md) — all allowed enum values at a glance

---

## Step 1: Determine Next Available IDs

Run the helper script to get the next available ID for each entity type you need:

```bash
node scripts/ids_next.js --type story    # e.g., story-0005
node scripts/ids_next.js --type char     # e.g., char-0005
node scripts/ids_next.js --type loc      # e.g., loc-0008
node scripts/ids_next.js --type fact     # e.g., fact-0008
```

Alternatively, scan `CANONICAL_INDEX.md` and find the highest existing number for each prefix, then increment by 1.

---

## Step 2: Write the Manuscript

**Location:** `stories/short_story/<snake_case_title>/manuscript.md`

The manuscript file **must** have YAML frontmatter that validates against `docs/schemas/story.schema.json`. Required fields:

```yaml
---
id: story-####            # from Step 1
schema_version: v1.0.0
type: story
title: "Your Story Title"
story_type: short-story   # see allowed values below
status: draft             # see allowed values below
canon_tier: draft         # see allowed values below
summary_50: "≤220 char summary"
summary_200: "≤1200 char summary"
cross_refs:
  characters: []          # char-#### IDs
  locations: []           # loc-#### IDs
  factions: []            # fact-#### IDs
  mechanics: []           # mech-#### IDs
  stories: []             # story-#### IDs
references:
  characters: []
  locations: []
  factions: []
  mechanics: []
  stories: []
themes: []                # see allowed values below
metadata:
  created: "2026-05-23T00:00:00.000Z"
  modified: "2026-05-23T00:00:00.000Z"
---
```

### Allowed Enum Values

See [`docs/SCHEMA_QUICK_REFERENCE.md`](SCHEMA_QUICK_REFERENCE.md) for the complete table. Key values:

| Field | Allowed Values |
|-------|---------------|
| `story_type` | `short-story`, `novel`, `novella`, `scene`, `fragment` |
| `status` | `canonical`, `speculative`, `deprecated`, `draft` |
| `canon_tier` | `primary_canon`, `working_canon`, `draft`, `speculative`, `sandbox`, `test`, `deprecated` |
| `themes` | `memory-as-cost`, `identity-erosion`, `sacrifice`, `conceptual-fragility`, `quiet-heroism`, `memory-preservation`, `institutional-burden`, `ethical-forgetting`, `inheritance`, `duty-vs-faith` |

### About `cross_refs` vs `references`

- `cross_refs`: entities that **appear in or are mentioned by** this story (narrative presence)
- `references`: entities that this story **depends on for continuity** (causal dependency)

In most short stories these lists are identical. Populate both with the same IDs unless you have a specific reason to diverge. See `CONTRIBUTING.md` for the full explanation.

---

## Step 3: Create Supporting Entity Files

For every **new** character, location, or faction that appears in your story, create an entity file. The lint suite will reject story references to IDs that don't exist.

### New Characters → `characters/<Name>.md`

Must validate against `docs/schemas/character.schema.json`.

```yaml
---
id: char-####
schema_version: v1.0.0
type: character
name: "Character Name"
tags: []
summary_50: "≤220 char summary"
summary_200: "≤1200 char summary"
cross_refs:
  characters: []
  locations: []
  factions: []
  mechanics: []
  stories: []
references:
  characters: []
  locations: []
  factions: []
  mechanics: []
  stories: []
metadata:
  status: canonical         # ONLY: canonical, speculative, deprecated
  created: "2026-05-23T00:00:00.000Z"
  modified: "2026-05-23T00:00:00.000Z"
---
```

> ⚠️ **Critical:** `metadata.status` for characters, locations, and factions allows only `canonical`, `speculative`, or `deprecated` — **not** `draft`.

### New Locations → `atlas/<Name>.md`

Must validate against `docs/schemas/location.schema.json`.

```yaml
---
id: loc-####
schema_version: v1.0.0
type: location
name: "Location Name"
location_type: region       # station, planet, ship, region, artifact, structure
tags: []
summary_50: "≤220 char summary"
summary_200: "≤1200 char summary"
cross_refs:
  characters: []
  locations: []
  factions: []
  mechanics: []
  stories: []
references:
  characters: []
  locations: []
  factions: []
  mechanics: []
  stories: []
metadata:
  status: canonical
  created: "2026-05-23T00:00:00.000Z"
  modified: "2026-05-23T00:00:00.000Z"
---
```

### New Factions → `factions/<Name>.md`

Must validate against `docs/schemas/faction.schema.json`.

```yaml
---
id: fact-####
schema_version: v1.0.0
type: faction
name: "Faction Name"
faction_type: political     # political, military, religious, corporate, scientific, criminal
tags: []
summary_50: "≤220 char summary"
summary_200: "≤1200 char summary"
cross_refs:
  characters: []
  locations: []
  factions: []
  mechanics: []
  stories: []
references:
  characters: []
  locations: []
  factions: []
  mechanics: []
  stories: []
metadata:
  status: canonical
  created: "2026-05-23T00:00:00.000Z"
  modified: "2026-05-23T00:00:00.000Z"
---
```

---

## Step 4: Add Lexicon Terms (if new terminology introduced)

If your story introduces new terminology, add it to `data/lexicon/terms.yaml`:

```yaml
- id: term-####
  term: "New Term"
  definition: "Definition of the term."
  status: draft
  tags: []
```

Use `status: draft` for new terms until they are reviewed.

---

## Step 5: Validate

Run these commands and fix all errors before committing:

```bash
npm run lint          # Must exit with 0 errors
npm run check         # Must exit with 0 hard failures
npm run linkmap:build # Regenerates CANONICAL_INDEX.md and LINK_MAP.md
```

Common lint failures for new contributors:
- **Schema error on `themes`** — check the allowed enum values in the table above
- **Schema error on `metadata.status`** — entity files only allow `canonical`, `speculative`, or `deprecated`
- **Unresolved ref** — you referenced a `char-####` or `fact-####` that doesn't have an entity file yet

---

## Step 6: Commit

Use conventional commits with a Canon Impact note:

```
feat(story): add 'Your Story Title'

Canon Impact: Introduces [entities]. No changes to established metaphysics.
```

Use `canon:` prefix instead of `feat:` if your story materially expands canon:

```
canon(story): add 'Your Story Title' — introduces Halix Exchange bazaar-ship

Canon Impact: Establishes Halix Exchange as a named location in the Helios Drift outer sleeve.
```

---

## Pre-Flight Checklist

Before submitting, confirm:

- [ ] I know the next available IDs and have assigned them
- [ ] I have read at least one canonical short story
- [ ] My `themes` values are from the allowed enum list
- [ ] All `metadata.status` values in entity files use `canonical`, `speculative`, or `deprecated`
- [ ] All `cross_refs` IDs have corresponding entity files
- [ ] `npm run lint` exits with 0 errors
- [ ] `npm run check` exits with 0 hard failures
- [ ] `npm run linkmap:build` has been run
- [ ] Commit message includes a Canon Impact note
