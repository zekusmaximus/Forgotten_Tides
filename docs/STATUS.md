# Repository Status

**Last updated:** 2026-06-26

This is the canonical status page for repository structure, hygiene, and cleanup
planning. Historical audits and implementation plans belong in
`archive/project-history/`; current operating guidance belongs in `docs/`.

## Current State

- Active source material lives in `stories/`, `lore/`, `mechanics/`,
  `characters/`, `factions/`, `atlas/`, `lexicon/`, `agents/`, `bible/`,
  `manuals/`, `dashboard/`, `data/`, and `scripts/`.
- Generated indexes are tracked because they are reviewable project artifacts:
  `CANONICAL_INDEX.md`, `REFERENCE_MAP.json`, and `docs/link_map/LINK_MAP.md`.
- Generated reports, temporary outputs, dependency installs, local agent
  worktrees, and backup snapshots are not source material and should stay out
  of git.
- The current checkout has no tracked `tools/` dependency tree or root backup
  snapshot directory. If those appear again, treat them as generated artifacts
  unless a human explicitly promotes specific files into source.

## Validation Baseline

Use this command before merging structural cleanup:

```bash
npm run validate:ci
```

That wrapper regenerates the link map, verifies generated tracked artifacts are
current, runs repository lint/check gates, and executes the focused script tests.
The GitHub CI workflow uses the same validation command.

For local dashboard-only changes, this narrower check is also available:

```bash
npm run test:dashboard
```

## Phase 1 Hygiene Status

- Done: ignore rules cover local dependencies, generated reports, backup
  snapshots, transient diagnostics, and local agent runtime state.
- Done: stale root audit material has been moved to
  `archive/project-history/`.
- Done: duplicate dependency declarations have been removed from
  `package.json`.
- Verified in this checkout: no tracked `tools/node_modules`,
  `tools/conversion/node_modules`, `.backups/`, or `metadata-backups/` entries.
- Still pending beyond Phase 1: shared script-library extraction, stricter
  content boundaries, documentation consolidation, and dashboard hardening
  described in `docs/CODEBASE_REVIEW_2026_06_26.md`.

## Generated File Boundaries

Keep generated, machine-refreshable output in `out/` or another ignored
generated directory unless the file is intentionally tracked as a project index.
If a new generated artifact needs to be tracked, document why here and add its
validation path to `scripts/validate_ci.js`.

Backup snapshots should live outside the source tree or under ignored backup
directories. Preserve unique source content by promoting it into the appropriate
active content folder before deleting or replacing any backup.
