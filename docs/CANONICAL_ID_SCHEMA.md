# Canonical ID Schema

This document defines the canonical ID format used for cross-references and indexing across **The Forgotten Tides** repository.

## Format

Canonical IDs are lowercase, hyphenated, and include a type prefix plus a four-digit numeric sequence:

```
<type>-<####>
```

**Examples**
- `char-0001`
- `mech-0001`
- `loc-0001`
- `fact-0001`
- `story-0001`
- `event-0001`

## Prefixes

| Prefix | Entity Type |
| --- | --- |
| `char` | Character |
| `loc` | Location |
| `fact` | Faction |
| `mech` | Mechanics rule |
| `story` | Story |
| `event` | Event |

## Rules

1. Canonical IDs are **stable** and must never be reused.
2. Canonical IDs are **lowercase** and **hyphenated**.
3. Legacy `id` fields remain in frontmatter for backward compatibility.
4. Cross-references (`cross_refs` and `references`) must use canonical IDs.
5. Canonical IDs must be listed in `CANONICAL_INDEX.md` and `REFERENCE_MAP.json`.
