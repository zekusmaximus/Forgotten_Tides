# Forgotten Tides Instruction Manual

This manual explains the repository structure, canon guardrails, and all available tooling so contributors can ship changes without breaking continuity.

## 1) Setup
- Requirements: Node.js 18+, npm. Install dependencies with `npm install`.
- Run commands from the repo root (`c:\Users\zeke\Projects\Forgotten_Tides`).
- Writable outputs land in `out/` (reports, chunks, graphs, compiled artifacts).

## 2) Canon & Governance Sources
- Universe rules: `AGENT.md` (non-negotiable tone, metaphysics, and red lines).
- Canon ids: `docs/canonical_id_map.json`, `docs/CANONICAL_ID_SCHEMA.md`, and generated `CANONICAL_INDEX.md`.
- Schemas: `docs/schemas/*.schema.json` define required frontmatter for characters, locations, mechanics, stories, etc.
- Relationship map: `REFERENCE_MAP.json` (auto-generated) drives the dashboard and link map docs.
- Structural plan: `STRUCTURAL_AUDIT_AND_OPTIMIZATION_PLAN.md` (phases, expected artifacts, and completed work).

## 3) Repository Layout (working set)
- `stories/`, `lore/`, `mechanics/`, `atlas/`, `factions/`, `characters/`, `manuals/`, `design/`, `bible/`: Canonical content with YAML frontmatter.
- `data/lexicon/`: Canonical glossary terms (`terms.yaml`) with legacy fallback under `data/lexicon/legacy/`.
- `docs/`: Governance, schemas, lint docs, link-map outputs, style guide, and this manual.
- `scripts/`: Automation (linting, checks, prompt/orchestration, chunking, story compilation).
- `dashboard/`: Static Continuity Dashboard (reads `REFERENCE_MAP.json`).
- `out/`: Generated reports (`out/reports`), chunks (`out/chunks`), graphs (`out/graphs`), compiled artifacts.

## 4) Validation & Linting Suite (npm scripts)
- `npm run lint:schema` → Validates YAML frontmatter against `docs/schemas/*.schema.json`.
- `npm run lint:refs` → Flags unresolved cross references between entities.
- `npm run lint:canonical-refs` → Ensures references point to canonical IDs from the current index.
- `npm run lint:glossary` → Warns on glossary terms missing from `data/lexicon/terms.yaml` (ignore list: `docs/lint/glossary_ignore.txt`).
- `npm run lint:canon` → Red-line checker (`scripts/checks/canon_linter.js`) for forbidden narrative moves.
- `npm run lint` → Runs all lint steps above in sequence.

## 5) Continuity & Timeline Checks
- `npm run check:continuity` → Scans stories for violations of character invariants; writes `out/reports/continuity.json`. Hard failures exit non-zero.
- `npm run check:timeline` → Parses timeline markers in `lore/` and stories; writes `out/reports/timeline_variance.json` with hard/soft issues.
- `npm run check` → Runs both continuity and timeline passes.

## 6) Canon Graph & Index Generation
- `npm run linkmap:build` (script: `scripts/prompt/build_linkmap.js`)
  - Rebuilds `REFERENCE_MAP.json` and `CANONICAL_INDEX.md` from entity frontmatter.
  - Writes human-readable `docs/link_map/LINK_MAP.md` and graph data under `out/graphs/`.
- Use before dashboard review or after adding new entities/relationships.

## 7) Dashboard
- Start local server: `npm run dashboard` (serves on port 8080).
- Open `http://localhost:8080/dashboard/` to explore the Continuity Dashboard (`dashboard/README.md` for controls).
- Reads the current `REFERENCE_MAP.json`; use the Reload button after regenerating maps.

## 8) Chunking & Context (RAG support)
- `npm run context:chunk` → `scripts/context/chunk_and_summarize.js`
  - Splits markdown into ~1400-char chunks with auto summaries.
  - Outputs `out/chunks/*__chunks.json` plus `out/chunks/chunk_manifest.json`.
  - Env overrides: `CHUNK_MAX_CHARS`, `CHUNK_MIN_CHARS`, `CHUNK_OUT_DIR`, `CHUNK_ROOT_DIR`.
- `npm run context:build` → `scripts/prompt/context_builder.js`
  - Resolves entities for a query using ordering profiles (`docs/agents/context_profiles.json`).
  - Flags: `--profile`, `--max`, `--expand`, `--carry`, `--clear`.

## 9) Prompt & Authoring Toolkit (AI-assisted workflows)
- Entry point: `node scripts/prompt/orchestrate.js "<natural language request>"` (see `docs/USAGE.md` for intents).
  - Intents include `brainstorm`, `outline`, `revise_scene`, `worldbuild_mechanics`, `compile_artifacts`, `save_scene`, `start_work`, `replace_scene`, `save_notes`, `update_outline`, `export_pack_only`.
  - Outputs land in `lore/ideas/`, `lore/notes/`, `stories/<type>/<work>/`, and `out/prompts/` depending on intent.
- Scene utilities: `npm run scenes:list|graph|open -- --work "<name>"` (script: `scripts/prompt/scenes_cli.js`) for listing, DOT graphs, or opening scenes.
- Authoring helper: `npm run author:apply` (`scripts/prompt/authoring.js`) can save scenes/notes using flags (`--intent`, `--work`, `--scene`, `--order`, `--body_file` or stdin).
- Export packs: `npm run pack:export` (`scripts/prompt/export_prompt_pack.js`) to build prompt packs for agents.
- ID and intent plumbing: `resolve_ids.js`, `route_intent.js`, `ordering.js`, `work_meta.js`, `scene_autotag.js` support deterministic IDs, intent routing, and auto-tagging.

## 10) Story Compilation
- Local build: `scripts/compile_stories.sh`
  - Produces `out/compiled/forgotten_tides_stories.{md,pdf,epub}` via Pandoc (mirrors `.github/workflows/compile-stories.yml`).
- Shell helpers: `scripts/check_canon.sh` (runs lint/canon guardrails) and `scripts/validate_links.sh`.

## 11) Testing
- `npm run test:dashboard` → Executes `scripts/tests/test_dashboard.js` against dashboard assets.
- If adding new automation, place additional tests under `scripts/tests/` and wire via `package.json`.

## 12) File & Frontmatter Conventions
- Use YAML frontmatter matching `docs/schemas/*.schema.json`; include `id` (lowercase canonical, e.g. `char-0001`), `uuid` (where applicable), `cross_refs` (canonical IDs), `metadata.status`, and type-specific fields.
- Prefer canonical IDs in cross references and filenames for determinism; regenerate link maps after adding entities.
- Glossary terms should be added to `data/lexicon/terms.yaml`; avoid relying on the legacy glossary except as fallback.

## 13) Standard Workflow Checklist
- 1) Add/update content with required frontmatter and canonical IDs.
- 2) Update glossary/lexicon entries as needed.
- 3) Run `npm run lint` and `npm run check` (ensure reports in `out/reports` are clean).
- 4) Regenerate link map: `npm run linkmap:build`.
- 5) (Optional) Rebuild chunks: `npm run context:chunk`.
- 6) Preview continuity graph: `npm run dashboard` and review.
- 7) For publication artifacts, run `scripts/compile_stories.sh`.

## 14) Troubleshooting Pointers
- Schema failures: check YAML frontmatter against the matching schema file and rerun `npm run lint:schema`.
- Missing references: verify canonical IDs exist in `CANONICAL_INDEX.md`; rerun `npm run lint:canonical-refs` and `npm run linkmap:build`.
- Glossary warnings: add terms to `data/lexicon/terms.yaml` or ignore via `docs/lint/glossary_ignore.txt` (sparingly).
- Dashboard empty: ensure `REFERENCE_MAP.json` exists and run a local server (`npm run dashboard`).
- Timeline/continuity failures: inspect `out/reports/continuity.json` and `out/reports/timeline_variance.json` for offending files/lines.

## 15) V2 System Upgrades (Promise/Payoff, Stakes, Reader Model)
- Promise/Payoff: `npm run lint:promise -- --work "<name>" --json` → `out/reports/promise_payoff_<work>.{json,md}`.
- Stakes drift: `npm run check:stakes -- --work "<name>" --json` → checks machine-readable stakes + irreversibility.
- Knowledge state: `npm run check:knowledge -- --work "<name>" --json` → enforces epistemic consistency.
- Scene failure modes: `npm run lint:scene-failure -- --work "<name>" --json` → flags inert/no-change scenes.
- Moral physics: `npm run lint:moral -- --work "<name>" --json` → aggregates moral_action weights.
- Reader model: `npm run check:reader -- --work "<name>" --json` → uses `docs/reader_model.json`.
- POV pressure: `npm run report:pov -- --work "<name>" --json` → also writes `out/graphs/pov_pressure.json`.
- Revision packet: `npm run compile:edit -- --work "<name>"` → `out/compiled/<work>_edit_packet.md`.
- Screenplay mode: `npm run compile:screenplay -- --work "<name>"`, lint via `npm run lint:screenplay -- --work "<name>"`.
- Sandbox guardrails: `npm run sandbox:lint` and `npm run sandbox:merge -- --into canonical --if clean` (copies into `out/sandbox/merged`).
- Draft velocity: `npm run start:draft -- --work "<name>" --mode fast` (marks `draft_unstable`), `DRAFT_MODE` env supported by checkers.
- Scene replacement diff: `node scripts/prompt/scene_diff.js --scene <new> --previous <old>` → `out/reports/scene_diff_<id>.md`.
- One-command work validation: `npm run validate:work -- --work "<name>"`.
