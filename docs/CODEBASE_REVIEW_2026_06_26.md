# Forgotten Tides Codebase Review - 2026-06-26

## Executive Summary

The Forgotten Tides repository is a canon/content system with a Node-based
validation and generation layer. It is not a traditional backend/frontend app:
the "backend" is the script suite in `scripts/`, the canonical data lives in
Markdown/YAML/JSON under content folders, and the UI surface is the static
continuity dashboard plus design/manual prototypes.

- **Repository hygiene is the highest-impact first step.** Local dependency
  installs, generated reports, backup snapshots, and agent runtime state need
  explicit ignore boundaries so reviews stay focused on source.
- **The content/tooling layer is the backend.** Schema validation, reference
  resolution, link-map generation, continuity checks, report generation, story
  promotion, and prompt-pack export all run through Node scripts.
- **The dashboard is useful but small.** It is currently a static HTML/JS
  visualization over `REFERENCE_MAP.json`, so it needs lightweight structural
  hardening rather than a full UI rewrite.
- **Documentation is strong but spread out.** `AGENT.md`, `README.md`,
  `docs/USAGE.md`, `docs/PLAYBOOK_NEW_STORY.md`, and older project-history
  plans all carry useful context. A canonical status page should tell agents
  what is current.
- **Do not rewrite the repository.** The right path is staged cleanup:
  establish hygiene, harden content validation boundaries, then improve script
  structure and dashboard maintainability.

## Repository Inventory

| Area | Role | Review |
| --- | --- | --- |
| `stories/` | Canonical and draft fiction by format | Keep as core source. Some novel/novella manuscript and outline files still rely on tolerant schema coverage. |
| `lore/`, `mechanics/`, `atlas/`, `characters/`, `factions/` | World and entity canon | Strong structure; continue tightening schema/frontmatter coverage. |
| `data/` | Structured lexicon and timeline data | Core machine-readable canon; keep validation strict and documented. |
| `scripts/` | Validation, reports, prompt/context tools, story utilities | This is the backend layer. It needs clearer module boundaries before it grows much more. |
| `dashboard/` | Static continuity UI | Useful and tested. Future work should improve maintainability, accessibility, and data-loading boundaries. |
| `docs/` | Active operating documentation | Keep current guidance here. Add status and avoid duplicating historical plans. |
| `archive/` | Historical plans, session history, old generated or superseded material | Keep out of active validation/retrieval unless a script opts in deliberately. |
| `out/` | Generated reports and compiled outputs | Ignore from git. Regenerate through npm scripts. |
| `.kilo/` | Local agent plans/runtime/worktrees | Track only intentional plans; ignore local runtime state and dependency installs. |

## Redundant Or Cleanup-Priority Areas

1. **Generated reports and compiled outputs:** `out/` should remain ignored and
   reproducible.
2. **Backup snapshots:** `.backups/`, `metadata-backups/`, and generated
   `*_backup_*` files should not become active source without review.
3. **Local dependency installs:** root `node_modules/`, nested tool
   `node_modules/`, and agent-runtime dependencies belong outside git.
4. **Stale root reports:** historical audits or one-off reports should move
   into `archive/project-history/` instead of living at repository root.
5. **Duplicate planning/status docs:** keep current state in `docs/STATUS.md`
   and keep prior implementation plans in `archive/project-history/`.
6. **Ad hoc script growth:** script utilities are useful, but shared filesystem,
   reporting, discovery, and canon-policy helpers should keep moving into
   `scripts/lib/`.

## Backend / Tooling Deep Dive

There is no server backend. The backend-equivalent responsibilities are handled
by scripts:

- `scripts/validate_ci.js` orchestrates CI-parity validation.
- `scripts/lint/*` validates schema, references, glossary terms, and locked
  citation rules.
- `scripts/checks/*` performs continuity, timeline, stakes, knowledge, reader,
  screenplay, promise/payoff, moral-physics, and scene-failure checks.
- `scripts/prompt/*` builds link maps, prompt packs, context, scene metadata,
  routing, and authoring flows.
- `scripts/lib/*` contains the emerging shared backend library layer.

### What Is Working

- `npm run validate:ci` gives one reliable baseline matching GitHub CI.
- Link-map generation verifies tracked generated indexes stay current.
- Schema and reference checks are broad enough to catch common authoring drift.
- Focused script tests cover canon policy, dashboard expectations, recursive
  discovery, prompt-pack filtering, timeline events, and system upgrades.
- Shared helpers already exist for canon policy, content discovery, ID
  generation, file loading, reporting, modes, and scene indexing.

### Structural Work Still Needed

| Priority | Work | Why It Matters |
| --- | --- | --- |
| P0 | Keep `validate:ci` as the single baseline and document exceptions | Agents need one trusted gate before handing off cleanup. |
| P0 | Tighten schema coverage for skipped manuscript/outline/theology files | Current warnings are acceptable, but silent structural drift will grow over time. |
| P1 | Move more repeated traversal/report code into `scripts/lib/` | This reduces script divergence and makes future checks easier to test. |
| P1 | Define generated-artifact ownership | Tracked indexes are intentional; `out/` reports and compiled packets are not. This boundary should stay explicit. |
| P1 | Add fixtures for representative story formats | Novel, novella, screenplay, short story, notes, and lore fixtures should protect recursive discovery and schema changes. |
| P2 | Consider a small CLI wrapper for common workflows | A single `scripts/cli.js` could group validate, report, story, scene, and prompt operations without bloating package scripts. |

## UI Deep Dive

The main UI is the static continuity dashboard:

- `dashboard/index.html`
- `dashboard/dashboard.js`
- `dashboard/README.md`

The repo also contains `ui_kits/pilot_manual/`, which is best treated as a
prototype/reference kit rather than production application code.

### What Is Working

- Dashboard tests verify required files, DOM anchors, JavaScript functions,
  package script presence, and `REFERENCE_MAP.json` shape.
- The dashboard is simple to serve with `npm run dashboard`.
- Keeping it static makes it easy for non-app contributors to understand.

### UI Work Still Needed

| Priority | Work | Why It Matters |
| --- | --- | --- |
| P1 | Split dashboard data loading, filtering, rendering, and panel behavior | `dashboard.js` can remain plain JS while becoming easier to maintain. |
| P1 | Add accessibility checks for graph controls and info panels | The visualization should remain usable outside pointer-only exploration. |
| P1 | Add empty/error states for missing or malformed reference maps | The current tests protect structure, but runtime failure states should be clearer. |
| P2 | Decide whether `ui_kits/` is active design source or archive material | That boundary affects future cleanup and documentation. |
| P2 | Document dashboard data contract | The UI should state exactly which node/edge fields it expects from `REFERENCE_MAP.json`. |

## Folder Optimization Plan

### Phase 1 - Hygiene And Safety

1. Remove or confirm absence of checked-in nested dependency installs.
2. Add ignore rules for backup snapshots, generated reports, local dependency
   installs, transient diagnostics, and local agent runtime state.
3. Move stale root audit/report material into `archive/project-history/`.
4. Create canonical `docs/STATUS.md` for current state, validation baseline,
   and generated-file boundaries.
5. Run the full baseline with `npm run validate:ci`.

**Implementation note:** this checkout has no tracked `tools/node_modules`,
`tools/conversion/node_modules`, `.backups/`, or `metadata-backups/` entries.
The active baseline is `npm run validate:ci`, not separate `type-check`,
`lint:ci`, `test`, or `build` scripts.

### Phase 2 - Tooling Structure

1. Audit `scripts/` for repeated filesystem traversal, frontmatter parsing,
   reporting, and work-selection logic.
2. Move shared behavior into focused modules under `scripts/lib/`.
3. Add fixtures that cover each active content family.
4. Convert current schema-coverage warnings into documented backlog items or
   stricter validations where safe.

### Phase 3 - Documentation Consolidation

1. Make `docs/STATUS.md`, `docs/PLAYBOOK_NEW_STORY.md`, `docs/USAGE.md`, and
   `AGENT.md` the active operating set.
2. Move superseded planning/report docs into `archive/project-history/`.
3. Add cross-links from README and docs index to the active operating set.
4. Remove contradictory workflow instructions once their replacements are
   verified.

### Phase 4 - Dashboard Hardening

1. Split dashboard JavaScript into testable sections or modules.
2. Document and test the `REFERENCE_MAP.json` data contract.
3. Add user-facing empty/error states.
4. Improve keyboard and reduced-motion accessibility.

## Phase 1 Checklist

- [x] Add `.gitignore` entries for local dependencies, generated reports,
  backup snapshots, transient diagnostics, and agent runtime state.
- [x] Remove duplicate `glob` dependency declaration from `package.json`.
- [x] Archive the stale root repository audit under `archive/project-history/`.
- [x] Add `docs/STATUS.md` as the canonical current-state page.
- [x] Link `docs/STATUS.md` from `docs/README.md`.
- [x] Confirm no tracked nested dependency or root backup directories exist in
  this checkout.
- [x] Run `npm run validate:ci`.

## Risk Assessment

| Area | Risk | Severity |
| --- | --- | --- |
| Documentation drift | Multiple older plans can contradict active scripts and folder layout. | High |
| Script sprawl | Tooling can become hard to change if shared helpers are not extracted consistently. | Medium-high |
| Schema tolerance | Warning-only skipped files can hide format drift in long-form work. | Medium-high |
| Generated clutter | Reports, backups, and dependency installs can swamp searches and reviews if not ignored. | Medium |
| Dashboard maintainability | A single static JS file is fine now but will become brittle as interactions grow. | Medium |

## Bottom Line

Forgotten Tides is structurally healthy for a canon/content repository. The
next work should keep source boundaries clean, keep `validate:ci` authoritative,
move shared script behavior into `scripts/lib/`, and harden the dashboard in
small increments. Phase 1 is cleanup and safety; Phase 2 should focus on the
tooling/backend layer rather than inventing a new application architecture.
