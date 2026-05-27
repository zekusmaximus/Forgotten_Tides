# Quickstart: Contributing to The Forgotten Tides

> You are an AI agent (or human contributor) tasked with drafting a short story in this universe. This document tells you exactly what to read, in what order, and what to do. Follow every step. Novel and screenplay workflows are intentionally out of scope for this quickstart.

---

## Your Reading Order (complete before writing anything)

| # | File | Why |
|---|------|-----|
| 1 | [`AGENT.md`](AGENT.md) | Non-negotiable canon rules, prohibited moves, Canon Compliance Tests |
| 2 | [`docs/STYLE.md`](docs/STYLE.md) | Prose voice, register, sentence-level guidance |
| 3 | [`mechanics/MEMORY_PHYSICS.md`](mechanics/MEMORY_PHYSICS.md) | The core physics engine — memory as gravity |
| 4 | [`mechanics/ANCHOR_THEORY.md`](mechanics/ANCHOR_THEORY.md) | Pilot mechanics, anchor burn, zero-anchoring |
| 5 | [`mechanics/CORRIDOR_MECHANICS.md`](mechanics/CORRIDOR_MECHANICS.md) | Corridor cost, thinning, raveling, collapse |
| 6 | [`lore/POLITIES_AND_FACTIONS.md`](lore/POLITIES_AND_FACTIONS.md) | The seven factions and their politics |
| 7 | [`bible/ARCHIVISTS_WAKE_STORY_BIBLE.md`](bible/ARCHIVISTS_WAKE_STORY_BIBLE.md) | Locked canon for core characters, Heliodrome, Lattice Gap, and corridor mechanics |
| 8 | [`stories/short_story/the_archivists_wake/manuscript.md`](stories/short_story/the_archivists_wake/manuscript.md) | The primary canonical exemplar — read this first |
| 9 | [`docs/SCHEMA_QUICK_REFERENCE.md`](docs/SCHEMA_QUICK_REFERENCE.md) | All allowed frontmatter enum values in one table |
| 10 | [`docs/PLAYBOOK_NEW_STORY.md`](docs/PLAYBOOK_NEW_STORY.md) | Step-by-step workflow, lore-update matrix, and PR checklist |
| 11 | [`agents/short_story_drafting_agent.md`](agents/short_story_drafting_agent.md) | Agent-specific drafting contract |

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
- [ ] I know the CI-parity command: `npm run validate:ci`
- [ ] I have applied the Lore Update Matrix in `docs/PLAYBOOK_NEW_STORY.md`

---

## The Three Things That Cause Lint Failures

1. **Wrong `themes` value** — only these are allowed: `memory-as-cost`, `identity-erosion`, `sacrifice`, `conceptual-fragility`, `quiet-heroism`, `memory-preservation`, `institutional-burden`, `ethical-forgetting`, `inheritance`, `duty-vs-faith`

2. **Wrong `metadata.status` in entity files** — character/location/faction files allow only `canonical`, `speculative`, or `deprecated` (not `draft`)

3. **Unresolved cross-reference** — referencing a `char-####` or `fact-####` that doesn't have a corresponding file

---

## Key Commands

```bash
# Before opening a PR — must pass with 0 errors
npm run validate:ci

# Regenerate generated canon artifacts while iterating
npm run linkmap:build

# Get the next available ID for a given type
node scripts/ids_next.js --type story
node scripts/ids_next.js --type char
node scripts/ids_next.js --type loc
node scripts/ids_next.js --type fact
```

---

## What Exists

**Short Stories (indexed):**
- `story-0001` — The Archivist's Wake
- `story-0002` — Memoir of a Nobody
- `story-0003` — The Tuner of Last Lights
- `story-0004` — The Light Inheritance
- `story-0005` — The Liturgy of Rust
- `story-0006` — The Anchorless Tide

**Core Characters:** Rell (`char-0001`), Sutira (`char-0002`), Estavan (`char-0003`), Tari (`char-0004`)

**Entity registry:** [`CANONICAL_INDEX.md`](CANONICAL_INDEX.md)

**Story opportunities:** [`docs/STORY_OPPORTUNITIES.md`](docs/STORY_OPPORTUNITIES.md)

**Short-story workflow:** [`docs/PLAYBOOK_NEW_STORY.md`](docs/PLAYBOOK_NEW_STORY.md)

---

## Commit Conventions

```
feat(story): add 'Title Here'
canon(story): add 'Title Here' — Canon Impact: <note>
docs: update contributing guidelines
fix(lint): resolve schema validation errors
```

Full conventions: [`docs/COMMIT_CONVENTIONS.md`](docs/COMMIT_CONVENTIONS.md)
