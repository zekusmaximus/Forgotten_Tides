# Contributing to The Forgotten Tides

This repository is **continuity-locked**. All additions must comply with:
- `/bible/ARCHIVISTS_WAKE_STORY_BIBLE.md`
- `/mechanics/*`
- `/manuals/PILOT_MANUAL.md`
- `/lore/*` and `/lore/theology/*`
- `/data/lexicon/terms.yaml` (structured lexicon)
- `/characters/*`

## Rules

1. **No canon expansion** in this repo without an explicit Canon Note.
2. New short fiction must:
   - live in `/stories/short_story/<snake_case_title>/manuscript.md`
   - follow `docs/PLAYBOOK_NEW_STORY.md`
   - apply the Lore Update Matrix in that playbook
   - pass CI-parity validation (`npm run validate:ci`)
3. Don’t alter established metaphysics, anchor counts, or Heliodrome status.
4. Use PRs with a short “Canon Impact” section.

## Commit Style

- Conventional commits (`feat:`, `docs:`, `fix:`, `canon:` for canon-moving changes).

## Authoring Rules

### General Requirements

1. **Schema Compliance**: All structured data must validate against schemas in `/docs/schemas/`
2. **Term Usage**: Use only canonical terms from `/data/lexicon/terms.yaml`
3. **Cross-referencing**: Maintain accurate cross-references in frontmatter
4. **Continuity**: Preserve established character traits and universe physics

### File Organization

- **Stories**: `/stories/` with proper YAML frontmatter
- **Characters**: `/characters/` with continuity invariants
- **Schemas**: `/docs/schemas/` with JSON Schema validation
- **Lexicon**: `/data/lexicon/terms.yaml` for structured terminology
- **Lore**: `/lore/` for universe background and history

### Content Requirements

1. **Memory Physics**: All technological and metaphysical elements must align with memory-as-gravity principles
2. **Character Continuity**: Maintain established character arcs and relationships
3. **Narrative Tone**: Preserve the lyrical yet precise style of the universe
4. **Canonical References**: Link to authoritative sources where possible

## Understanding `cross_refs` vs `references`

Every entity file (stories, characters, locations, factions) contains two sibling fields with identical structure: `cross_refs` and `references`. Both are required. Here is the semantic distinction:

| Field | Meaning |
|-------|---------|
| `cross_refs` | Entities that **appear in or are mentioned by** this entity — narrative presence. A character who walks through a scene goes in `cross_refs`. |
| `references` | Entities that this entity **depends on for continuity** — causal dependency. A character whose arc is built on the existence of another character or location goes in `references`. |

**In most short stories these two lists are identical.** Populate both with the same IDs unless you have a specific reason to diverge (e.g., a story that mentions a faction in passing but whose plot does not depend on that faction's continuity).

When in doubt: populate both with the same IDs. The linting suite validates format only; it does not enforce the semantic distinction.

---

## Validation Commands

Run this command before submitting a PR:

```bash
npm run validate:ci
```

This rebuilds canon graph artifacts, verifies generated files are committed, runs lint and continuity checks, then runs dashboard, system-upgrade, coverage, canon-policy, prompt-pack, and timeline-event tests.

Useful commands while iterating:

```bash
# Validate all schemas
npm run lint:schema

# Check for unresolved references
npm run lint:refs

# Enforce glossary term usage
npm run lint:glossary

# Run all lint checks
npm run lint

# Run continuity checks
npm run check:continuity

# Run timeline variance checks
npm run check:timeline

# Run all checks
npm run check

# Rebuild generated canon artifacts
npm run linkmap:build
```

## Pull Request Process

1. **Use the PR Template**: Fill out all sections in `.github/pull_request_template.md`
2. **Run All Checks**: Ensure `npm run validate:ci` passes
3. **Address Review Feedback**: Respond to CODEOWNERS review requests
4. **Update Documentation**: Keep docs in sync with code changes
5. **Commit Generated Artifacts**: Include `CANONICAL_INDEX.md`, `REFERENCE_MAP.json`, and `docs/link_map/LINK_MAP.md` when `npm run linkmap:build` changes them

## Protected Paths

The following paths require review by DX lead and maintainers:
- `docs/schemas/**` - Schema definitions
- `scripts/**` - Automation and validation scripts
- `data/**` - Structured data including lexicon

See `.github/CODEOWNERS` for complete ownership rules.

## Development Workflow

1. **Fork the Repository**: Create your own fork for development
2. **Create Feature Branch**: Use descriptive branch names (e.g., `feat/new-mechanics`)
3. **Make Atomic Commits**: Small, focused changes with clear messages
4. **Test Locally**: Run `npm run validate:ci`
5. **Submit PR**: Use the template and request appropriate reviews
6. **Address Feedback**: Iterate based on review comments
7. **Merge**: After approval and all checks pass

## Getting Help

- Check existing issues for similar problems
- Review the [Style Guide](docs/STYLE.md)
- Consult the [Commit Conventions](docs/COMMIT_CONVENTIONS.md)
- Ask questions in the discussion forum

## Code of Conduct

All contributors must adhere to the project's code of conduct:
- Be respectful and constructive
- Maintain narrative continuity
- Preserve the integrity of the universe
- Follow established governance processes
