# Schema Quick Reference

This document lists all constrained enum values across every entity schema. Consult this before writing frontmatter to avoid lint failures.

Last updated: May 23, 2026. Source of truth: `docs/schemas/*.schema.json`.

---

## Story (`docs/schemas/story.schema.json`)

| Field | Allowed Values |
|-------|---------------|
| `type` | `story` |
| `story_type` | `short-story`, `novel`, `novella`, `scene`, `fragment` |
| `status` | `canonical`, `speculative`, `deprecated`, `draft` |
| `canon_tier` | `primary_canon`, `working_canon`, `draft`, `speculative`, `sandbox`, `test`, `deprecated` |
| `themes[]` | `memory-as-cost`, `identity-erosion`, `sacrifice`, `conceptual-fragility`, `quiet-heroism`, `memory-preservation`, `institutional-burden`, `ethical-forgetting`, `inheritance`, `duty-vs-faith` |

### Story `cross_refs` and `references` sub-fields

Both objects accept the same keys. ID pattern constraints:

| Key | Pattern |
|-----|---------|
| `characters[]` | `char-####` |
| `locations[]` | `loc-####` |
| `factions[]` | `fact-####` |
| `mechanics[]` | `mech-####` |
| `stories[]` | `story-####` |

---

## Character (`docs/schemas/character.schema.json`)

| Field | Allowed Values |
|-------|---------------|
| `type` | `character` |
| `metadata.status` | `canonical`, `speculative`, `deprecated` |
| `continuity` | Object with `invariants[]` and `watchlist[]` |

> ⚠️ `metadata.status` for characters does **not** allow `draft`.

---

## Faction (`docs/schemas/faction.schema.json`)

| Field | Allowed Values |
|-------|---------------|
| `type` | `faction` |
| `faction_type` | `political`, `military`, `religious`, `corporate`, `scientific`, `criminal` |
| `metadata.status` | `canonical`, `speculative`, `deprecated` |

> ⚠️ `metadata.status` for factions does **not** allow `draft`.

---

## Location (`docs/schemas/location.schema.json`)

| Field | Allowed Values |
|-------|---------------|
| `type` | `location` |
| `location_type` | `station`, `planet`, `ship`, `region`, `artifact`, `structure` |
| `metadata.status` | `canonical`, `speculative`, `deprecated` |

> ⚠️ `metadata.status` for locations does **not** allow `draft`.

---

## Mechanics Rule (`docs/schemas/mechanics_rule.schema.json`)

| Field | Allowed Values |
|-------|---------------|
| `type` | `mechanics_rule` |

---

## Lore (`docs/schemas/lore.schema.json`)

| Field | Allowed Values |
|-------|---------------|
| `type` | `lore` |
| `metadata.status` | `canonical`, `speculative`, `deprecated` |

---

## ID Patterns by Entity Type

| Type | Pattern | Example | Script |
|------|---------|---------|--------|
| Story | `story-####` | `story-0005` | `node scripts/ids_next.js --type story` |
| Character | `char-####` | `char-0005` | `node scripts/ids_next.js --type char` |
| Location | `loc-####` | `loc-0008` | `node scripts/ids_next.js --type loc` |
| Faction | `fact-####` | `fact-0008` | `node scripts/ids_next.js --type fact` |
| Mechanic | `mech-####` | `mech-0004` | `node scripts/ids_next.js --type mech` |
| Term | `term-####` | `term-0021` | `node scripts/ids_next.js --type term` |

---

## Common Lint Failures and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `themes/0: must be equal to one of the allowed values` | Used an unlisted theme string | Check the `themes[]` table above |
| `metadata/status: must be equal to one of the allowed values` | Used `draft` in an entity file | Change to `canonical` or `speculative` |
| `Unresolved reference: char-####` | Character file not created yet | Create `characters/<Name>.md` with that ID |
| `Unresolved reference: fact-####` | Faction file not created yet | Create `factions/<Name>.md` with that ID |
| `Missing required field: schema_version` | Frontmatter missing `schema_version` | Add `schema_version: v1.0.0` |
| `Missing required field: tags` | Frontmatter missing `tags` array | Add `tags: []` |
| `must have required property 'continuity'` | Character frontmatter omitted continuity guardrails | Add `continuity.invariants` and `continuity.watchlist` arrays |
