# Quickstart: Contributing to The Forgotten Tides

> You are an AI agent (or human contributor) tasked with expanding this universe. This document tells you exactly what to read, in what order, and what to do. Follow every step.

---

## Your Reading Order (complete before writing anything)

| # | File | Why |
|---|------|-----|
| 1 | [`AGENT.md`](AGENT.md) | Non-negotiable canon rules, prohibited moves, Canon Compliance Tests |
| 2 | [`docs/STYLE.md`](docs/STYLE.md) | Prose voice, register, sentence-level guidance |
| 3 | [`mechanics/MEMORY_PHYSICS.md`](mechanics/MEMORY_PHYSICS.md) | The core physics engine — memory as gravity |
| 4 | [`mechanics/ANCHOR_THEORY.md`](mechanics/ANCHOR_THEORY.md) | Pilot mechanics, anchor burn, zero-anchoring |
| 5 | [`lore/POLITIES_AND_FACTIONS.md`](lore/POLITIES_AND_FACTIONS.md) | The seven factions and their politics |
| 6 | [`stories/short_story/the_archivists_wake/manuscript.md`](stories/short_story/the_archivists_wake/manuscript.md) | The primary canonical exemplar — read this first |
| 7 | [`docs/SCHEMA_QUICK_REFERENCE.md`](docs/SCHEMA_QUICK_REFERENCE.md) | All allowed frontmatter enum values in one table |
| 8 | [`docs/PLAYBOOK_NEW_STORY.md`](docs/PLAYBOOK_NEW_STORY.md) | Step-by-step workflow for writing and committing a new story |

Optional deep-reads for richer context:
- [`lore/MEMORY_ECONOMY.md`](lore/MEMORY_ECONOMY.md) — how memory functions as currency
- [`lore/COSMIC_REGIONS.md`](lore/COSMIC_REGIONS.md) — geography of the known universe
- [`lore/SPECIES_OVERVIEW.md`](lore/SPECIES_OVERVIEW.md) — major species and their traits
- [`lore/theology/THEOLOGY_OF_MEMORY.md`](lore/theology/THEOLOGY_OF_MEMORY.md) — thematic depth and meaning

---

## Pre-Flight Checklist

Before writing your first sentence, confirm all boxes:

- [ ] I've read `AGENT.md` in full
- [ ] I know the next available IDs (`node scripts/ids_next.js --type story`)
- [ ] I've read at least one canonical short story
- [ ] I know the allowed `themes` enum values (see `docs/SCHEMA_QUICK_REFERENCE.md`)
- [ ] I know what supporting entities I'll need to create (characters, locations, factions)
- [ ] I know the lint commands: `npm run lint` and `npm run check`

---

## The Three Things That Cause Lint Failures

1. **Wrong `themes` value** — only these are allowed: `memory-as-cost`, `identity-erosion`, `sacrifice`, `conceptual-fragility`, `quiet-heroism`, `memory-preservation`, `institutional-burden`, `ethical-forgetting`, `inheritance`, `duty-vs-faith`

2. **Wrong `metadata.status` in entity files** — character/location/faction files allow only `canonical`, `speculative`, or `deprecated` (not `draft`)

3. **Unresolved cross-reference** — referencing a `char-####` or `fact-####` that doesn't have a corresponding file

---

## Key Commands

```bash
# Before committing — must both pass with 0 errors
npm run lint
npm run check

# After adding any new entity files — regenerates CANONICAL_INDEX.md
npm run linkmap:build

# Get the next available ID for a given type
node scripts/ids_next.js --type story
node scripts/ids_next.js --type char
node scripts/ids_next.js --type loc
node scripts/ids_next.js --type fact
```

---

## What Exists

**Short Stories (canonical):**
- `story-0001` — The Archivist's Wake
- `story-0002` — Memoir of a Nobody
- `story-0003` — The Tuner of Last Lights
- `story-0004` — The Light Inheritance

**Core Characters:** Rell (`char-0001`), Sutira (`char-0002`), Estavan (`char-0003`), Tari (`char-0004`)

**Entity registry:** [`CANONICAL_INDEX.md`](CANONICAL_INDEX.md)

**Story opportunities:** [`docs/STORY_OPPORTUNITIES.md`](docs/STORY_OPPORTUNITIES.md)

---

## Commit Conventions

```
feat(story): add 'Title Here'
canon(story): add 'Title Here' — Canon Impact: <note>
docs: update contributing guidelines
fix(lint): resolve schema validation errors
```

Full conventions: [`docs/COMMIT_CONVENTIONS.md`](docs/COMMIT_CONVENTIONS.md)
