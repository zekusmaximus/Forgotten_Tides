# Playbook: Adding a New Short Story

This is the authoritative step-by-step recipe for contributing a new short story to *The Forgotten Tides*. Follow every step in order. Do not skip steps. Novel and screenplay work are outside this playbook.

## Prerequisites

Before writing a single word, read the following in this order:

1. [`AGENT.md`](../AGENT.md) — non-negotiable canon rules and prohibited moves
2. [`docs/STYLE.md`](STYLE.md) — prose voice, register, and sentence-level guidance
3. [`mechanics/MEMORY_PHYSICS.md`](../mechanics/MEMORY_PHYSICS.md) — the core physics engine
4. [`mechanics/ANCHOR_THEORY.md`](../mechanics/ANCHOR_THEORY.md) — pilot mechanics
5. [`mechanics/CORRIDOR_MECHANICS.md`](../mechanics/CORRIDOR_MECHANICS.md) — corridor costs and failure states
6. [`lore/POLITIES_AND_FACTIONS.md`](../lore/POLITIES_AND_FACTIONS.md) — political landscape
7. [`bible/ARCHIVISTS_WAKE_STORY_BIBLE.md`](../bible/ARCHIVISTS_WAKE_STORY_BIBLE.md) — locked canon for Rell, Sutira, Estavan, Tari, Heliodrome, the Lattice Gap, and corridor mechanics
8. At least one existing story in [`stories/short_story/`](../stories/short_story/) — the exemplar format
9. [`docs/SCHEMA_QUICK_REFERENCE.md`](SCHEMA_QUICK_REFERENCE.md) — all allowed enum values at a glance
10. [`agents/short_story_drafting_agent.md`](../agents/short_story_drafting_agent.md) — short-story drafting workflow for AI agents

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

## Step 4: Apply the Lore Update Matrix

Use this matrix before validation. The goal is that the next agent or human can find every new lore contribution without rereading the story from scratch.

| Change in the story | Required repository updates |
|---------------------|-----------------------------|
| New named character | Add `characters/<Name>.md`; add the `char-####` ID to story `cross_refs.characters` and `references.characters`; run `npm run linkmap:build`. |
| New named location, ship, station, artifact, or region | Add `atlas/<Name>.md`; add the `loc-####` ID to story `cross_refs.locations` and `references.locations`; run `npm run linkmap:build`. |
| New faction, order, institution, company, cult, or political body | Add `factions/<Name>.md`; add the `fact-####` ID to story refs; update `lore/POLITIES_AND_FACTIONS.md` if the faction changes the political landscape; run `npm run linkmap:build`. |
| New term or capitalized technical phrase | Add an entry under `terms:` in `data/lexicon/terms.yaml`; use `status: draft` until reviewed; run `npm run linkmap:build`. |
| Timeline-significant event | Add a story-frontmatter `events` entry. If the event becomes shared canon beyond this story, also add it to `data/timeline/events.yaml`. |
| Uses Rell, Sutira, Estavan, Tari, Heliodrome, Lattice Gap, eddies, zero-anchoring, or anchor burn | Re-read `bible/ARCHIVISTS_WAKE_STORY_BIBLE.md`; preserve all red lines; cite the relevant IDs in refs. |
| Introduces or changes metaphysical mechanics | Do not leave the change only in fiction. Add an explicit Canon Note in the PR and update the relevant mechanics or lore file. |
| Uses only existing canon and introduces no new named entities or terms | Manuscript plus accurate `cross_refs` and `references` may be sufficient. Still run full validation. |

When in doubt, create a draft entity or lexicon entry rather than burying a reusable concept only inside prose.

---

## Step 5: Add Lexicon Terms (if new terminology introduced)

If your story introduces new terminology, add it to `data/lexicon/terms.yaml`:

```yaml
terms:
  - id: term-####
    term: "New Term"
    definition: "Definition of the term."
    status: draft
    tags: []
```

The file already has a top-level `terms:` list; add only the new list item under that existing key. Use `status: draft` for new terms until they are reviewed.

---

## Step 6: Validate

Run the CI-parity command before opening a PR:

```bash
npm run validate:ci
```

`npm run validate:ci` rebuilds the link map, verifies generated artifacts are committed, runs lint and continuity checks, then runs the same smoke and policy tests used by CI.

For faster iteration while drafting:

```bash
npm run lint:schema
npm run lint:refs
npm run lint
npm run check
npm run linkmap:build
```

Common lint failures for new contributors:
- **Schema error on `themes`** — check the allowed enum values in the table above
- **Schema error on `metadata.status`** — entity files only allow `canonical`, `speculative`, or `deprecated`
- **Unresolved ref** — you referenced a `char-####` or `fact-####` that doesn't have an entity file yet
- **Generated artifact diff** — run `npm run linkmap:build` and commit `CANONICAL_INDEX.md`, `REFERENCE_MAP.json`, and `docs/link_map/LINK_MAP.md`

---

## Step 7: Commit and Pull Request

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

Before opening the PR, fill out `.github/pull_request_template.md`, including the Canon Impact and Lore Update Matrix sections.

---

## Pre-Flight Checklist

Before submitting, confirm:

- [ ] I know the next available IDs and have assigned them
- [ ] I have read at least one canonical short story
- [ ] I have read `bible/ARCHIVISTS_WAKE_STORY_BIBLE.md` if using its locked characters, locations, or mechanics
- [ ] My `themes` values are from the allowed enum list
- [ ] All `metadata.status` values in entity files use `canonical`, `speculative`, or `deprecated`
- [ ] All `cross_refs` IDs have corresponding entity files
- [ ] The Lore Update Matrix has been applied
- [ ] `npm run validate:ci` exits with 0 errors
- [ ] Generated artifacts are committed if changed
- [ ] Commit message includes a Canon Impact note
