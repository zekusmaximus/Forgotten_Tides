# Linting Tools Documentation

This directory documents the validation scripts that protect The Forgotten Tides short-story pipeline.

## CI-Parity Validation

Run this before opening a PR:

```bash
npm run validate:ci
```

It performs the same local gate agents are expected to satisfy:

1. `npm run linkmap:build`
2. Generated artifact cleanliness check for `CANONICAL_INDEX.md`, `REFERENCE_MAP.json`, and `docs/link_map/LINK_MAP.md`
3. `npm run lint`
4. `npm run check`
5. `npm run test:dashboard`
6. `npm run test:upgrades`
7. `npm run test:coverage`
8. `npm run test:canon-policy`
9. `npm run test:prompt-pack`
10. `npm run test:timeline-events`

## Available Commands

### `npm run lint:schema`

Validates YAML frontmatter against `docs/schemas/*.schema.json`.

Strict, PR-blocking coverage:
- `characters/**/*.md`
- `factions/**/*.md`
- `atlas/**/*.md`
- `mechanics/**/*.md`
- `stories/short_story/*/manuscript.md`

Best-effort coverage:
- other `stories/**/*.md`
- `lore/**/*.md`
- `data/**/*.yaml`

Best-effort files are reported as `PASS`, `SKIP`, or `WARN`, but they do not block the short-story gate unless they are part of the strict coverage set. The summary line reports files seen, validated, skipped, warnings, and failures.

### `npm run lint:refs`

Recursively checks canonical references in:
- `characters/`
- `factions/`
- `atlas/`
- `mechanics/`
- `stories/short_story/`
- `lore/`

It builds an index of `char-####`, `loc-####`, `fact-####`, `mech-####`, `story-####`, and `term-####` IDs, then validates reference-bearing fields such as `cross_refs`, `references`, `appears_in`, `rules_used`, `relationships`, and `related_terms`.

Use `node scripts/lint/unresolved_refs.js --warn-only` only for exploratory audits. PR validation is strict by default.

### `npm run lint:canonical-refs`

Checks that referenced canonical IDs exist in the generated `CANONICAL_INDEX.md`. Run `npm run linkmap:build` first if new entities were added.

### `npm run lint:glossary`

Loads terms from `data/lexicon/terms.yaml` and warns about capitalized story terms not found there. Warnings do not fail the build, but new reusable technical terms should be added to the lexicon rather than ignored.

### `npm run lint:canon`

Runs the canon red-line checker for forbidden narrative moves and known continuity hazards.

### `npm run lint`

Runs:

```bash
npm run lint:schema
npm run lint:refs
npm run lint:canonical-refs
npm run lint:glossary
npm run lint:canon
```

## Troubleshooting

Schema failures: check YAML frontmatter against the matching schema and `docs/SCHEMA_QUICK_REFERENCE.md`.

Reference failures: create the missing entity file or remove the stale ID from `cross_refs`/`references`.

Generated artifact failures: run `npm run linkmap:build` and commit any changes to `CANONICAL_INDEX.md`, `REFERENCE_MAP.json`, and `docs/link_map/LINK_MAP.md`.

Glossary warnings: add the term under the existing `terms:` list in `data/lexicon/terms.yaml`, or add a rare exception to `docs/lint/glossary_ignore.txt`.
