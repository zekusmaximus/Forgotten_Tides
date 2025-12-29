# Upgrade Guide V2 — System Upgrades

This guide explains how to use the twelve new systems introduced in the V2 upgrade set. Commands assume repo root.

## 1) Promise / Payoff Enforcement
- Fields: scenes use `promise_links` array (`id`, `role: setup|payoff|reminder`, `status` optional). Optional per-work `docs/schemas/work_promise.schema.json` data.
- Command: `npm run lint:promise -- --work "<name>" --json`.
- Output: `out/reports/promise_payoff_<work>.{json,md}` highlighting missing payoffs, out-of-order payoffs, and payoffs without setups.

## 2) Machine-Readable Stakes & Drift Check
- Fields: `stakes.summary`, `stakes.level (low|medium|high|existential)`, `stakes.irreversibility`.
- Command: `npm run check:stakes -- --work "<name>" --json`.
- Output: `out/reports/stakes_drift_<work>.{json,md}`; warns when stakes vanish or jump abruptly between scenes.

## 3) Epistemic (Knowledge) State Enforcement
- Fields: `knowledge_delta` entries (`entity`, `change: reveal|reinforce|contradict|forget`, `note`) plus optional `knowledge_state` snapshots.
- Command: `npm run check:knowledge -- --work "<name>" --json`.
- Output: `out/reports/knowledge_state_<work>.{json,md}`; flags contradictions, redundant reveals, and missing reinforcements.

## 4) Scene Failure-Modes Linter
- Purpose: find inert scenes with no stakes, knowledge movement, moral change, or promise touchpoints.
- Command: `npm run lint:scene-failure -- --work "<name>" --json`.
- Output: `out/reports/scene_failure_<work>.{json,md}` with warnings on low-signal scenes.

## 5) Revision-Mode Compilation
- Command: `npm run compile:edit -- --work "<name>" [--mode fast|strict]`.
- Output: `out/compiled/<work>_edit_packet.md` containing a table of POV, stakes, knowledge deltas, moral deltas, and per-scene word counts plus attached work notes if present.

## 6) Canon-Safe “What-if” Sandbox + Merge Gating
- Location: `sandbox/` (schema: `docs/schemas/sandbox_entry.schema.json`).
- Lint: `npm run sandbox:lint` (blocks when `canonical_lock: true`; warns on missing canonical IDs).
- Merge gate: `npm run sandbox:merge -- --into canonical --if clean` → copies sandbox files into `out/sandbox/merged/` only when lint is clean.

## 7) Drafting Velocity Mode
- Mode flag: `DRAFT_MODE=fast|strict`; `start_draft` stamps `draft_unstable` when fast.
- Command: `npm run start:draft -- --work "<name>" --mode fast` → initializes work folder + metadata.
- Effect: new checkers respect `--warn-only`; warnings stay non-fatal unless `--strict` is passed.

## 8) Scene Replacement Semantic Diff
- Command: `node scripts/prompt/scene_diff.js --scene <new> --previous <old>`.
- Output: `out/reports/scene_diff_<sceneId>.{json,md}` summarizing changes to stakes, knowledge, moral actions, and tone proxy (sentence length, dialogue ratio, violence markers).

## 9) POV Pressure Balancing Analytics
- Command: `npm run report:pov -- --work "<name>" --json`.
- Output: `out/reports/pov_pressure_<work>.{json,md}` plus graph-friendly `out/graphs/pov_pressure.json`; metrics cover word count by POV, decisions per scene, consequence density, and computed agency index.

## 10) Moral Physics Engine
- Fields: `moral_actions` entries (`actor`, `action`, `weight`, `direction: aid|harm|mixed`, `note`).
- Command: `npm run lint:moral -- --work "<name>" --json`.
- Output: `out/reports/moral_physics_<work>.{json,md}` with cumulative moral weight warnings and missing weights.

## 11) Screenplay Mode
- Structure: `stories/screenplay/<work>/scenes/*.md` with `scene_heading`, `pov`, `stakes`, `knowledge_delta`, `moral_actions`.
- Lint: `npm run lint:screenplay -- --work "<name>" --json`.
- Compile: `npm run compile:screenplay -- --work "<name>"` → `out/compiled/<work>.fountain`.
- Example work: `stories/screenplay/SCREENPLAY_SAMPLE/`.

## 12) Reader-Model Simulation
- Config: `docs/reader_model.json` (schema: `docs/schemas/reader_model.schema.json`).
- Command: `npm run check:reader -- --work "<name>" --json`.
- Output: `out/reports/reader_model_<work>.{json,md}` warning on overloading scenes and missing reinforcements within the configured window.

## Convenience: Validate a Work
- Run `npm run validate:work -- --work "<name>"` to generate all upgrade reports in one pass (warnings are non-fatal by default).
