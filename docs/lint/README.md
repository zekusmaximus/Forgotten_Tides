# Linting Tools Documentation

This directory contains documentation for the linting scripts that ensure data integrity and consistency across The Forgotten Tides universe.

## Available Commands

### `npm run lint:schema`

**Purpose**: Validates YAML frontmatter against JSON schemas.

**What it does**:
- Walks through `characters/`, `stories/`, and `data/` directories
- Extracts YAML frontmatter from `.md` files
- Validates against schemas in `docs/schemas/*.schema.json`
- Reports validation errors with specific field information

**Exit codes**:
- `0`: All files pass validation
- `1`: Validation errors found

**Example usage**:
```bash
npm run lint:schema
```

### `npm run lint:refs`

**Purpose**: Checks for unresolved references between entities.

**What it does**:
- Builds an in-memory index of all entity IDs by type (characters, locations, factions, mechanics, stories)
- Checks cross-references in `cross_refs` fields
- Validates reference fields like `appears_in`, `rules_used`, and `relationships[].target_id`
- Reports missing references with location information

**Exit codes**:
- `0`: All references resolved
- `1`: Unresolved references found

**Example usage**:
```bash
npm run lint:refs
```

### `npm run lint:glossary`

**Purpose**: Enforces glossary term usage in stories.

**What it does**:
- Loads canonical terms from `lexicon/GLOSSARY.md`
- Scans `stories/*.md` files for capitalized multiword terms (e.g., "Memory Drive")
- Warns about terms not found in the glossary
- Respects ignore list in `docs/lint/glossary_ignore.txt`

**Exit codes**:
- `0`: Always exits with 0 (warnings don't fail the build)

**Example usage**:
```bash
npm run lint:glossary
```

### `npm run lint`

**Purpose**: Runs all linting checks in sequence.

**What it does**:
- Executes `lint:schema`, `lint:refs`, and `lint:glossary` in order
- Stops on first failure (non-zero exit code)

**Exit codes**:
- `0`: All linting checks pass
- `1`: At least one check failed

**Example usage**:
```bash
npm run lint
```

## Configuration Files

### `docs/lint/glossary_ignore.txt`

This optional file contains terms that should be ignored by the glossary enforcer. Each term should be on its own line.

Example:
```
The Forgotten Tides
Memory Corridor
```

## Schema Files

Schema files are located in `docs/schemas/` and follow JSON Schema Draft 2020-12. Each schema corresponds to a specific entity type:

- `character.schema.json`
- `faction.schema.json`
- `location.schema.json`
- `mechanics_rule.schema.json`
- `story.schema.json`

## Best Practices

1. **Run linting before commits**: Add `npm run lint` as a pre-commit hook
2. **Fix schema errors first**: Validation errors often cascade to reference errors
3. **Update glossary proactively**: Add new terms to `GLOSSARY.md` as they emerge
4. **Use ignore list sparingly**: Only ignore terms that are truly exceptions

## Troubleshooting

**Schema validation fails**:
- Check that your YAML frontmatter is properly formatted
- Verify required fields are present
- Ensure field values match the expected patterns/types

**Unresolved references**:
- Make sure the referenced entity exists
- Check that the ID format is correct (e.g., `CHAR-0001`)
- Verify the entity is in the correct directory

**Glossary warnings**:
- Add missing terms to `lexicon/GLOSSARY.md`
- Or add them to `docs/lint/glossary_ignore.txt` if appropriate
- Remember that warnings don't fail the build