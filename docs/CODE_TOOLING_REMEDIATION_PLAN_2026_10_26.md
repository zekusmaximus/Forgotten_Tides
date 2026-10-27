# Code and Tooling Remediation Plan — 2026-10-26

## Goal and scope

Make the repository's commands safe to run, make validation results trustworthy,
and bring the CLI and dashboard into agreement with the files they operate on.
This plan covers `scripts/`, `dashboard/`, `ui_kits/`, package dependencies,
tests, CI, and CLI documentation. Use synthetic story and entity fixtures to
verify behavior. Keep canon decisions and manuscript prose out of these changes.

## Implementation status (2026-10-27)

- Steps 1, 2, and 4 have initial implementations: CLI subprocess arguments are
  literal, write paths are checked, the dashboard serves only allowlisted files
  on loopback, and the refreshed dependency tree has zero reported npm audit
  vulnerabilities. The server uses a direct file allowlist instead of staging
  copies in `out/`; its HTTP test verifies the same exposure boundary.
- Step 3 now protects new-work retries, reserves story IDs across concurrent
  creators, and rolls back promotion source and generated files after write or
  build failures. Promotion dry runs preflight link-map inputs without writing.
  Failure fixtures cover malformed metadata, timeline YAML, link-map sources,
  and an interrupted creator's ID reservation.
- Steps 5–8 have initial implementations: parse and duplicate-ID errors stop
  generation, work lookup covers the four active roots, orchestration propagates
  failed operations and checks, scene order is shared by the CLI and checkers,
  and promises are scoped by work. Reference and glossary checks now traverse
  nested story material, timeline checks deduplicate event IDs and compare
  local offsets, and the draft filter flags agree. Temp-repository tests cover
  creation, editing, discovery, ordering, coverage, and failure paths. The
  remaining advisory glossary findings and three timeline definition conflicts
  are reported without changing source content.
- `npm run validate:ci` passes locally on Node 20 and Node 24. Both npm audits
  report zero vulnerabilities. The hosted Linux and Windows CI jobs passed on
  commit `cd33509`; the story compilation workflow passed on commit `53c5f4e`
  and uploaded its Markdown/ePub artifact.
- Steps 9–10 have initial implementations: story compilation selects manuscripts
  and expands referenced scenes once, dashboard filters and counts all seven
  map types with runtime tests, and prompt-pack lookup indexes source files
  once per invocation. The orchestrator's compile intent writes the supported
  Markdown artifact; the Pandoc build also produces an ePub. The CLI guide now
  describes actual routes, stdin requirements, scene metadata, and navigator
  flags. A current-content prompt-pack comparison returned the same entries
  for 19 IDs while reducing Markdown reads from 2,123 to 119 in one run.

The work is ordered by risk and dependency. Each numbered step is a separate,
reviewable change unless a small prerequisite must be included with it. Add the
regression tests described in each step before changing the affected behavior.
Dashboard isolation and dependency updates can proceed alongside the CLI work
once their own baselines are captured.

| Order | Priority | Change | Why it comes here |
| --- | --- | --- | --- |
| 0 | Setup | Establish a reproducible baseline and fixture harness | Distinguishes defects from environment failures without delaying urgent fixes |
| 1 | P0 | Remove shell injection and confine all CLI writes | Prevents arbitrary commands and writes outside intended directories |
| 2 | P0 | Serve only dashboard assets on loopback | Stops exposure of the repository to reachable clients |
| 3 | P0 | Make creation and promotion safe on failure | Prevents erased manuscripts and mixed promotion state |
| 4 | P1 security | Refresh vulnerable dependencies | Removes known advisories in a separately testable change |
| 5 | P1 | Make validation and ID checks fail truthfully | Establishes a dependable gate for later refactors |
| 6 | P1 | Unify work discovery and repair orchestration | Fixes the main CLI path and its inconsistent directory rules |
| 7 | P1 | Make scene indexing and sequence checks agree | Repairs order-dependent findings and duplicate scene scans |
| 8 | P2 | Close remaining lint and timeline coverage gaps | Makes reports complete and reduces repeated noise |
| 9 | P2 | Correct compilation and dashboard behavior | Makes published artifacts and UI match their input data |
| 10 | P3 | Remove repeated scans and consolidate documentation | Improves scale and lowers the cost of future changes |

## 0. Baseline and test harness

The following baseline records the starting state before remediation; current
results are summarized above.

- Record a clean `npm ci` and `npm run validate:ci` result on the CI-supported
  Node 20 runtime. The October 26 local run passed lint, checks, and tests
  through `test:promote`, then stopped at `test:redline` because this sandbox
  returned `EPERM` for nested Node subprocesses. Confirm that test in normal CI;
  do not treat this sandbox result as a product failure.
- Snapshot the output of `npm audit` and `npm audit --omit=dev`: currently eight
  advisories in total, six in the production tree, with four high-severity
  advisories. Record the existing schema coverage (125 files seen, 107
  validated, 18 skipped) and classify the skipped files by reason before
  tightening the gate.
- Build reusable temporary-repository fixtures for CLI and validator tests.
  Assert exit codes, report data, and file bytes before and after failed
  operations. Avoid tests that only search source text or mirror an
  implementation. Run `git diff --check` and check generated artifacts in each
  change.

**Exit:** Normal CI provides a known baseline; local sandbox restrictions are
documented separately. Tests can prove that a rejected operation did not
modify any fixture file.

## 1. Remove command injection and confine writes (P0)

1. Replace the `execSync` command strings in
   [`validate_work.js`](../scripts/validate_work.js) with `execFileSync` calls
   that pass `--work` as one argument, use `process.execPath`, and run from a
   fixed repository root. Reject missing or invalid values before launching a
   check. Inventory other child-process calls for user-controlled interpolation.
2. Introduce one write-path helper for CLI work IDs and output names. Resolve
   titles or IDs to an allowed work directory, then check that the final path
   stays under its intended root. Reject separators, dot segments, absolute and
   Windows drive or UNC paths, NULs, and symlink escapes. Apply it first to
   `authoring.js` and `start_draft.js`, then to compilers and report filenames
   that incorporate CLI input. Preflight all target paths before writing.
3. Keep read-only work lookup separate from creation: a new work may use a
   validated generated slug, while an existing work must resolve to its actual
   directory. This preserves titles with spaces at the user-facing CLI without
   using raw titles as path segments.

**Tests:** Metacharacters (`;`, quotes, backticks, `$()`), spaces, traversal,
absolute paths, Windows-style separators, and symlinked parents must remain
literal input or fail with a nonzero exit. Outside fixture files remain
byte-identical. Exercise the command on Windows as well as Linux.

**Exit:** No CLI argument can execute another command or write outside its
declared output root.

## 2. Isolate dashboard serving (P0)

1. Change `npm run dashboard` to stage only `dashboard/index.html`, its assets,
   and `REFERENCE_MAP.json` in an ignored output directory, then serve that
   directory on `127.0.0.1`. The existing `-o /dashboard/` flag changes the
   opened URL; it does not limit the server root.
2. Keep the dashboard's map URL aligned with the staged directory. Pin the
   vis-network script to an exact version with integrity metadata, or serve a
   reviewed local copy. Keep this supply-chain change separate from UI logic.

**Tests:** HTTP requests for the dashboard and map succeed. Requests for
`/package.json`, `/.git/config`, story files, directory listings, and traversal
paths fail. Confirm that the listener binds only to loopback.

**Exit:** Running the documented dashboard command exposes only its intended
assets on the local machine.

## 3. Make file lifecycle operations recoverable (P0)

1. Make `start_work` fail before modifying anything if its generated work ID
   already exists. Use exclusive creation for the final directory and files to
   prevent a check/write race. On failure during *new* work creation, remove
   only files created by that invocation. Do not replace malformed existing
   `meta.yaml` with defaults; report the parse error and preserve the file.
   Replace fixed `.tmp` metadata paths with unique temporary names.
2. Split `promote_story.js` into a preflight phase that parses and computes all
   manuscript, timeline, and generated-index changes, and an apply phase. A
   dry run must exercise the full preflight without writing. Snapshot all
   touched files, detect concurrent modifications, and restore them if a
   write, link-map build, or validation step fails. Multi-file rename is not
   atomic, so explicit rollback and failure injection are necessary.
3. Preserve the manuscript body below its closing frontmatter delimiter byte
   for byte. Report exactly which files changed on success or were restored on
   failure.

**Tests:** Repeat `start_work`; try malformed metadata and simultaneous
creation; inject malformed timeline YAML, write failures, and build failures
into promotion. Every failed case exits nonzero with old files byte-identical
and no leftover temporary files. Successful promotion updates every intended
field and generated artifact.

**Exit:** Retrying a create cannot erase a work, and a failed promotion cannot
leave a partly promoted repository.

## 4. Refresh dependencies (P1 security)

- Update direct and transitive packages reported by the audit, including
  `ajv`, `js-yaml`, `uuid`, `fast-uri`, `minimatch`, and
  `@isaacs/brace-expansion`. Check `gray-matter`'s separate `js-yaml` 3.x
  dependency; changing the direct `js-yaml` version alone does not resolve it.
- Review lockfile and API changes rather than applying an unexamined bulk fix.
  Run `npm ci`, the full gate on Node 20, and both audit commands. Record any
  residual advisory with its actual input path and a follow-up owner.

**Exit:** No known high-severity advisory remains in the installed tree, and
behavioral tests pass with the refreshed lockfile.

## 5. Make validation results trustworthy (P1)

1. Make `canonical_reference_validator.js` exit nonzero for YAML parse errors
   and for a missing or empty canonical ID source, as well as missing refs.
   Treat YAML syntax errors as errors in `schema_validate.js` even for files
   without a required schema; keep intentional no-schema skips explicit and
   counted. Fail `reader_model_linter.js` if its present JSON config is
   malformed rather than substituting empty thresholds.
2. Make `build_linkmap.js` reject duplicate and unsafe canonical IDs *before*
   writing generated artifacts. Use `Map` or null-prototype objects for
   ID-keyed collections, including the promise checker. Have `ids_next.js`
   consider both the generated index and source files so a partially stale
   index cannot produce a duplicate ID.
3. Have `validate:work` reject an unknown work and require the expected inputs
   before reporting success. Make report status reflect actual validation,
   rather than the fact that an output file was written. Run content gates
   before, or independently of, the generated-artifact freshness diff so an
   uncommitted but correct index does not hide lint diagnostics.

**Tests:** Fixtures with malformed optional YAML, malformed reader JSON, zero
canonical IDs, duplicate IDs, `__proto__`, a stale index, and a nonexistent
work all exit nonzero with specific structured diagnostics. A valid repository
still passes. Assert report contents and exit codes, not success phrases alone.

**Exit:** A green `validate:ci` result means all inputs in its stated scope
were parsed, checked, and uniquely indexed.

## 6. Unify work discovery and repair orchestration (P1)

1. Add a shared work resolver rooted at the repository, covering the actual
   `short_story`, `novella`, `novel`, and `screenplay` directories. Accept
   legacy aliases only at the CLI boundary. Parse frontmatter consistently,
   recognize `SCENE_` IDs, and normalize stored `/` and `\` path separators.
   Move `extract_metadata.js`, `scenes_cli.js`, authoring lookup, and checkers
   onto it. Implement the scene CLI's documented flags or reject unsupported
   flags clearly.
2. Repair `orchestrate.js`: create `out/session` before saving; pass `--title`
   to `start_work`; read write-intent input through EOF instead of the 100 ms
   timeout; reject an empty required body; use the prompt exporter's returned
   path instead of the newest directory entry. Propagate authoring, export,
   and required validation failures as nonzero exits. Store real check exit
   statuses in session reports.
3. Keep generated session files and prompt packs under ignored output paths
   unless a specific artifact is intentionally reviewable and tracked.

**Tests:** A temporary-repository integration suite exercises `start_work`,
`save_scene`, `replace_scene`, `save_notes`, `update_outline`, and prompt export
from a first run with no `out/`. Discovery finds a work and scene in every
active story root; First Corridor's backslash paths resolve. Missing work,
scene, body, failed subprocess, or failed exporter must not print a success
summary or return a stale prompt pack.

**Exit:** The documented CLI operations either produce the requested files or
fail clearly without claiming completion.

## 7. Align scene storage and sequence checks (P1)

1. Choose one normalized scene entry for authoring, manuscript ordering, and
   checkers. Read existing string entries, object entries, and include comments
   through a compatibility adapter; write one documented representation.
   Prevent duplicate entries, replace by canonical scene ID, and preserve the
   manuscript body when changing order.
2. Update `scene_indexer.js` to exclude backup files, normalize path
   separators, and sort within a work by manuscript order or numeric scene
   metadata before using a deterministic filename fallback. Move new backups
   outside the live scene directory. Reject unknown `--work` filters.
3. Scope promise IDs by work with a `Map`, so a setup in one work cannot
   satisfy a payoff in another. Feed the corrected sequence to promise,
   stakes, knowledge, and reader checks.

**Tests:** Two works share a promise ID; setup and payoff order differs from
filename order; a scene has a replacement backup; scenes are inserted first,
last, before, after, and at an index. Navigator, manuscript, and checkers must
report the same live scene sequence and count. Cross-work promises remain
separate.

**Exit:** Sequence-sensitive findings refer to live scenes in story order.

## 8. Close coverage and timeline gaps (P2)

- Traverse all active work roots and `related_terms` in reference checking.
  Make glossary discovery recursive and report files scanned and skipped.
  Keep its warnings advisory until the author resolves the documented open
  decision on the glossary enforcer's purpose; the traversal fix does not
  require that decision.
- Preserve event `relationships` during timeline normalization, deduplicate
  repeated event IDs with provenance and conflict reporting, and emit each
  out-of-span warning once per defect. Parse subperiod offsets such as
  `T0+2h` within a story. A shared cross-story anchor convention remains a
  separate author decision; do not infer one from filename order.
- Make `--include-drafts` work as documented with `--canon-only`, or remove the
  contradictory option after updating CLI documentation and tests. Ensure
  advisory scene-quality commands state their scope and do not imply they
  validated short-story manuscripts when they saw no scenes.
- Add the existing route-intent suite and new behavior fixtures to
  `validate:ci`. Expand dashboard tests from source-string assertions to
  runtime behavior in step 9. Add Windows CI coverage after path handling is
  unified; retain Node 20 parity with the current workflow.

**Tests:** A bad reference in novel or screenplay material is detected;
glossary coverage includes nested manuscripts; valid and invalid `before`
relationships are exercised; each duplicate or out-of-span event produces one
meaningful finding; draft filter combinations match their documented behavior.

**Exit:** Coverage reports identify what was actually inspected, and timeline
findings are neither dropped nor multiplied by unrelated events.

## 9. Correct compilation and dashboard behavior (P2)

1. Make story compilation select manuscripts, resolve scene includes once,
   and exclude outlines, notes, backups, and duplicate scene text. Use a
   deterministic work order. Reconcile the PDF promise in `docs/USAGE.md` with
   the actual build: provide the artifact and test it, or correct the command's
   documented outputs.
2. Define the `REFERENCE_MAP.json` contract used by the dashboard. Render and
   filter `lore` and `term` nodes, use `canon_tier` for speculative styling,
   and calculate true orphan status from the full graph before filtering.
   Replace the repository-relative `vscode://file/` URI with a reliable path
   action. Add clear loading, empty, and malformed-map states.
3. Use actual buttons or equivalent keyboard semantics for pilot-manual anchor
   controls. Add a small browser/runtime test with all current node types,
   speculative and missing nodes, cross-type edges, and keyboard interaction.

**Tests:** A compilation fixture contains manuscript, scene, outline, note,
and backup; publishable text appears exactly once. The dashboard fixture
checks filters, counts, badges, orphan labels, error states, and keyboard use.
The isolated server from step 2 still serves the dashboard and map correctly.

**Exit:** Published artifacts contain only intended text, and dashboard
behavior matches generated data.

## 10. Reduce repeated work and consolidate guidance (P3)

- Build an ID-to-entity index once per prompt-pack invocation instead of
  globbing and parsing the content tree for every ID. Reuse shared discovery
  and parsing utilities where they remove divergent behavior; avoid a broad
  rewrite of independent checkers. Benchmark current content and a larger
  synthetic fixture, and compare output snapshots before and after caching.
- Update `docs/USAGE.md`, `docs/STATUS.md`, and script help to match actual
  flags, story roots, supported Node/runtime platforms, report scope, and
  artifact outputs. Move generated reports to ignored output directories and
  keep tracked generated indexes explicitly listed in CI.
- Review the still-optional quality checks. Either run them over their stated
  scope in CI or label them as advisory reports; require nonzero exits only for
  rules the project has chosen to enforce.

**Exit:** Prompt-pack results are unchanged while lookup cost scales mainly
with source files plus requested IDs, and a new contributor can follow the
documented commands without relying on obsolete paths or flags.

## Completion gate

The remediation is complete when:

1. The security and failure-injection fixtures prove command arguments remain
   literal, writes remain contained, retries preserve existing files, and
   promotion failures restore the prior state.
2. `npm run validate:ci` passes on the declared Node version in Linux CI and
   Windows coverage. Every intentional error fixture returns nonzero and a
   useful diagnostic. Generated indexes are deterministic and current.
3. The dashboard serves only its allowlisted assets on loopback, and its
   runtime tests pass against the generated map contract.
4. The production dependency audit has no high-severity advisories; any
   remaining advisory has a documented disposition.
5. The CLI integration suite covers first-run and failure paths, scene order,
   and compilation output. The working tree contains only intended code,
   test, documentation, and generated-index changes.
