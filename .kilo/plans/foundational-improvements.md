# Foundational Improvements Plan: Canon Schemas, Timeline, Contracts, Playbooks, and Delta Reporting

**Goal**: Deliver medium-effort foundational changes that eliminate perpetual SKIP/WARN noise, make timeline a first-class seeded canon artifact, version agent/playbook contracts, generalize the short-story pipeline into a maintainable family/matrix, and surface explicit "canon delta" artifacts for PRs and agents. These changes unblock scalable growth (novels, novellas, lore expansions, multi-agent workflows) while preserving the strict short-story gate and existing CI parity.

**Scope**: All 5 requested items. Focus on minimal, backward-compatible, high-leverage changes. No new hard gates that would immediately break the existing short-story corpus.

**Effort estimate**: Medium (primarily script + schema + doc work; limited backfills; one-time migration for versioning and seeding). 3-5 implementation turns + validation.

**Non-goals**: Full novel/novella authoring agents, complete canon promotion paths for non-shorts, historical git delta storage, or changes to redline/lore-update-matrix semantics.

**Plan structure**: 5 workstreams + cross-cutting sequencing, tests, docs, migration, risks, open questions.

---

## Workstream 1: Minimal/Tolerant Schemas for Novel/Novella Fragments, Data YAMLs, and Lore Notes (Eliminate Perpetual SKIP/WARN)

**Current state** (from schema_validate.js + content_discovery + full inventory):
- `scripts/lint/schema_validate.js` treats `stories/`, `lore/`, `data/` as `required: false` (best-effort only; short_story/manuscripts + canonical entities are strict).
- `selectSchema` + `TYPE_TO_SCHEMA` only route `type: story|character|...|lore`. Everything else (no frontmatter, unknown `type`, raw data YAMLs, `type: notes|novel|novella`, meta.yaml files) → SKIP "No schema found for type: X" or "Missing YAML frontmatter".
- Exact perpetual skips/warns in scope:
  - `data/lexicon/terms.yaml` (root `terms:` array, no top-level `type` or frontmatter).
  - `data/timeline/events.yaml` (root `events:` array).
  - `data/lexicon/legacy/GLOSSARY.md` (no frontmatter).
  - `lore/notes/*.md` (frontmatter with `type: notes`).
  - `lore/theology/*.md` (many lack frontmatter or `type: lore`).
  - `stories/novella/*/{meta.yaml,manuscript.md,outline.md}` (minimal meta; `kind: novella` or no `type`; scenes pass via path).
  - `stories/novel/NOVEL_FORGOTTEN_TIDES/{meta.yaml,manuscript.md,notes.md,outline.md}` (`type: novel`; scenes pass).
  - No `fragments/` directory exists.
- Post-Ajv checks in validateFile also emit warnings for missing `schema_version`/`tags` (hard error on required paths) or status.
- Result: 20+ perpetual SKIP + WARN lines on every `npm run lint:schema`; summary stats show them but they do not block CI.

**Proposed changes** (minimal surface area, preserve "best-effort" non-blocking semantics):
- Add 5-6 tiny permissive schemas under `docs/schemas/` (modeled on existing loose `scene.schema.json` / `sandbox_entry.schema.json`):
  - `data_lexicon.schema.json`: `{ "type": "object", "properties": { "terms": { "type": "array" } }, "additionalProperties": true }` (require nothing or minimal top marker).
  - `timeline_events.schema.json`: `{ "type": "object", "properties": { "events": { "type": "array" } }, "additionalProperties": true }`.
  - `lore_notes.schema.json` (or reuse/extend lore with `type: ["lore", "notes"]`): minimal for `id`, `title`, `type: "notes"`, `status`.
  - `novel_meta.schema.json`: `{ "type": "object", "required": ["id", "type"], "properties": { "type": { "enum": ["novel"] }, ... }, "additionalProperties": true }` (capture novel meta shape: id/title/type/status/logline/connections/series_arc_setup/etc.).
  - `novella_meta.schema.json`: Similar, tolerant of current `id/title/status/created/modified` (no `type` today) or `kind: novella`.
  - Optional: `story_fragment.schema.json` or relax story.schema for `story_type: "fragment"`.
- Update `scripts/lint/schema_validate.js`:
  - Extend `TYPE_TO_SCHEMA` or (preferred) add path-based early returns in `selectSchema` before type fallback: `if (rel.includes('/data/lexicon/terms.yaml')) return schemas.data_lexicon;`, same for `data/timeline/events.yaml`, `lore/notes/`, `stories/novel/*/meta.yaml`, `stories/novella/*/meta.yaml`, screenplay scenes already handled.
  - For raw YAML data files: continue whole-doc parse.
  - Make post-Ajv `schema_version`/`tags` checks warnings-only for these new non-strict schemas (parallel to current `status` warning); or require backfill of minimal `schema_version: v1.0.0` + `tags: []` in the data files themselves for cleanliness.
- For plain .md without frontmatter (theology files, novel outline/notes, legacy glossary): either (a) add minimal `---\nid: ...\ntype: lore\n---` frontmatter (low cost for theology), (b) early-return "notes-like" in validateFile for specific subdirs with no warning, or (c) accept SKIPs as intentional for pure prose notes.
- No changes to strict short-story/character/etc. paths.
- Update `docs/SCHEMA_QUICK_REFERENCE.md`, `docs/lint/README.md`, and `docs/schemas/examples/` with the new schemas + routing rules.
- Run `npm run lint:schema` post-change: target zero new SKIPs/WARNs in the listed trees (existing short-story gate unchanged).

**Files to touch**:
- New: `docs/schemas/data_lexicon.schema.json`, `docs/schemas/timeline_events.schema.json`, `docs/schemas/lore_notes.schema.json`, `docs/schemas/novel_meta.schema.json`, `docs/schemas/novella_meta.schema.json` (plus examples if useful).
- `scripts/lint/schema_validate.js` (selectSchema + walkDir logic).
- `docs/SCHEMA_QUICK_REFERENCE.md`, `docs/lint/README.md`, `docs/INSTRUCTION_MANUAL.md`, `docs/USAGE.md`.
- Optional backfill: `data/lexicon/terms.yaml` (add top-level `schema_version`/`tags` if chosen), `data/timeline/events.yaml`, novel/novella meta.yaml, lore/theology/*.md (frontmatter), novel/novella loose .md files.

**Validation**: `npm run lint:schema` (stats show reduced skips/warnings in data/lore/stories); existing tests (test_recursive_coverage etc.); `npm run validate:ci`.

**Tradeoff**: Tolerant `additionalProperties: true` keeps noise low but provides little structural enforcement. Alternative (stricter minimal required fields) increases maintenance when meta shapes evolve. Recommendation: tolerant + path heuristics first.

---

## Workstream 2: Seed + Maintain data/timeline/events.yaml from story-0001 + Bible; Require Structured Events for Non-Trivial Chronology; Improve timeline_variance Checks

**Current state** (from timeline_variance.js, test_timeline_events.js, build_linkmap, story frontmatter, bible read):
- `data/timeline/events.yaml`: 1 primary_canon event only (`event-0001`, Cycle 0 summary of story-0001).
- story-0001 (`the_archivists_wake/manuscript.md`): Has rich internal `timeline.chronology` (T0-relative) + prose phases; **no top-level `events:` array** (frontmatter schema supports it). Exempt from some redline rules.
- `bible/ARCHIVISTS_WAKE_STORY_BIBLE.md`: Detailed "Canonical Timeline of Events" (T0–T5 sections with bullets for corridor instability, zero-anchoring, anchor burns, eddy, Heliodrome docking, departure, red lines). Pure prose; no YAML; not parsed by variance (lore scan looks for `## Timeline` or `- **date**:` patterns; finds nothing).
- Story frontmatter `events[]` (story.schema.json): Optional; shape `{id, timestamp, summary, canon_tier?, causal_note?, involved_entities?, source?}`. **Zero stories currently use it** (PLAYBOOK says "add story-frontmatter `events` entry"; `timeline.chronology` is the lighter internal device).
- `timeline_variance.js`: Parses yaml first, then lore markdown (## Timeline + loose events), then story frontmatter `events` (pushes to report.events). `timeline.chronology` and story `timeline` object are parsed into `storyData` but **never normalized to global events**. `parseEvent` handles ISO/Year/Cycle (Cycle → fake 2000+ year). `normalizeStructuredEvent` is central. Checks: order, story-date vs span (hard before start, soft after), internal story event relationships (only "before" supported). Report: events[], stories[], issues.{hard,soft}, summary (counts, frontmatter_event_count, skipped, span), coverage.
- Specials: Hard if stories seen but total_stories==0; soft if canonical_event_count==0.
- `test_timeline_events.js`: Minimal (asserts yaml array + >=1 primary, runs variance, checks counts + frontmatter_event_count is number). No origin seeding assertions.
- PLAYBOOK + PR template: "Timeline-significant event → story `events` + (if shared) yaml".
- Gaps: Origin canon invisible to global timeline; 5+ "non-trivial chronology" stories (rich internal timelines) contribute 0; span is degenerate (single point); future stories always soft-warn; no enforcement of "require structured events"; no cross-story causality; relative timestamps (T0+Nh) poorly handled for span math; bible never ingested.

**Proposed changes** (seeding + enforcement + robustness):
- **Seeding**:
  - Special-case story-0001 in `parseTimelineDataEvents` or new `parseOriginStoryEvents` (or extend `parseStoryTimelines`): parse its `timeline.chronology` (or add `events:` to its frontmatter) → inject as primary_canon events (source = story-0001 path, involved_entities from its cross_refs, canon_tier=primary_canon). Map phases (I–VI or T0–T5 equivalents).
  - Add dedicated `parseBibleTimeline` (or extend lore parser): hard regex on "T0 — ...|T1 — ..." (or `## Canonical Timeline` section) in `bible/ARCHIVISTS_WAKE_STORY_BIBLE.md` → primary_canon events with summaries from bullets + causal_note/red-line cross-refs. Treat bible as first-class lore source (bypass some ideas/notes excludes).
  - Update `data/timeline/events.yaml` once (seed the T0–T5 + origin summary). Future maintenance via PRs (PLAYBOOK rule).
- **Require structured events**:
  - Define "non-trivial chronology": story has `timeline.chronology.length >= 3` (or explicit tag `has-nontrivial-chronology`, or `story_type` + duration > threshold). PLAYBOOK + schema already point here.
  - In `parseStoryTimelines` + new check in `checkTimelineConsistency` (or pre-check): if non-trivial but `!frontmatter.events || events.length === 0`, emit soft (or hard on promotion) issue: "Story has non-trivial internal chronology but no structured `events:` frontmatter".
  - Update PLAYBOOK step 4 + pre-flight checklist + PR template: make explicit for any story with chronology or timeline-significant events.
  - Optionally: authoring/orchestrate helpers that auto-suggest `events:` from `timeline.chronology` when emitting story frontmatter.
- **Improve timeline_variance checks + reporting**:
  - `parseEvent` / normalization: Support relative forms (`T0`, `T0+0.5h`, `T0+48h`, `T0-T0+Xd`, "several years", Cycle N). Return `{..., is_relative: true, offset: "..."}`. Keep original `original_date` for display; use a stable "Cycle 0" anchor for span when possible (avoid forcing fake JS Dates for Cycle-only timelines; add relative span mode).
  - Strengthen relationships: support `after`, `causes`, `contains`, `concurrent` (in addition to `before`); resolve cross-story via `involved_entities` or `causal_note`.
  - New checks: cross-source causality (later stories cannot predate story-0001 anchor burn); per-canon-tier date rules; explicit "non-trivial without events" enforcement.
  - Report enhancements: `non_trivial_chronology_stories` (list with chrono len vs events len), `events_by_source` (yaml/frontmatter/lore/bible/story-0001), `stories_with_internal_only` count, per-event links back to bible T# or story phase, coverage gap notes, human-readable span (Cycle-based when no absolute dates).
  - Output: keep `out/reports/timeline_variance.json`; also emit lightweight `.md` summary.
- **Tests**:
  - Extend `test_timeline_events.js`: assert story-0001 seeds >=1 (or N) primary event(s); bible T0–T5 appear (or at least origin coverage); frontmatter_event_count > 0 after seeding; relative timestamp handling; non-trivial enforcement fires for a test case.
  - Add cases for Cycle-only, relationships, cross-story.
- **Other**:
  - Update `scripts/checks/timeline_variance.js` (new parsers, checks, report fields).
  - Update story-0001 frontmatter to include granular `events:` (T0–T5 + the existing yaml summary) as part of seeding.
  - Update `data/timeline/events.yaml` with seeded events (idempotent; ids like event-0001, event-0002...).
  - PLAYBOOK + SCHEMA_QUICK_REFERENCE + PR template: document the requirement + examples.
  - `recomputeEventSummary` and hard/soft logic remain; reduce spurious softs for future-dated canon stories.

**Files to touch**:
- `data/timeline/events.yaml` (seed content).
- `stories/short_story/the_archivists_wake/manuscript.md` (add `events:` array).
- `scripts/checks/timeline_variance.js` (parsers, checks, report, bible integration).
- `scripts/tests/test_timeline_events.js` (assertions + new cases).
- `docs/PLAYBOOK_NEW_STORY.md`, `.github/pull_request_template.md`, `docs/SCHEMA_QUICK_REFERENCE.md`.
- Optional: helpers in `scripts/prompt/authoring.js` or `extract_metadata.js`.

**Validation**: Run `npm run check:timeline`; `npm run test:timeline-events`; full `validate:ci`; inspect `out/reports/timeline_variance.json` (expect canonical_event_count >= 6, frontmatter_event_count > 0, no spurious origin warnings, better span).

**Tradeoff / sequencing note**: Seeding first (makes reports useful), then enforcement (prevents regression). Relative timestamp support is the highest-friction parser change.

---

## Workstream 3: Version Agent Contracts (AGENT.md vX, PLAYBOOK vX) and Add "contract_version" Field to Story Frontmatter

**Current state**:
- Only pervasive version field: `schema_version` (story.schema.json + all entities; pattern `^v?\d+\.\d+\.\d+$`; enforced in validate for required paths; value `v1.0.0` everywhere; separate from behavioral contracts).
- AGENT.md: No version header, no `vX` in content/filename (only © 2025 footer).
- PLAYBOOK_NEW_STORY.md (and agents/*.md "Operating Contract" / "Final Contract" sections): No versions.
- No `contract_version`, `agent_version`, `playbook_version`, etc. anywhere in frontmatter or docs.
- References: PLAYBOOK requires reading AGENT.md first; agents/QUICKSTART/CONTRIBUTING/PR template/INSTRUCTION_MANUAL all treat the pair as the "contract"; redline linter + bible_refs field cross-ref AGENT.md.
- Matrix/family: Only "Lore Update Matrix" (table in PLAYBOOK) and canon tier/weight system (canon_policy + story schema).

**Proposed changes**:
- Version the contracts explicitly:
  - AGENT.md: Add header `# AGENT.md — AI Continuity & Generation Framework (v1.0.0)` (or current as v1.0.0; bump on future material changes to rules, tone, metaphysics, prohibitions, compliance tests).
  - PLAYBOOK_NEW_STORY.md: Same (`# Playbook: Adding a New Short Story (v1.0.0)`). Bump on changes to steps, matrix, frontmatter requirements, validation expectations.
  - Agents (short_story_drafting_agent.md etc.): Reference the versions in their "Operating Contract" sections; keep their internal contracts prose but tie to the top-level versions.
  - Optional: A tiny `docs/contracts/AGENT.md.v1.0.0` snapshot or just rely on git + header (prefer header + conventional commits for bumps).
- Add machine-readable "contract_version" to story frontmatter + schema:
  - In `docs/schemas/story.schema.json`: new optional (initially) top-level field:
    ```json
    "contract_version": {
      "type": "string",
      "pattern": "^v?\\d+\\.\\d+\\.\\d+$",
      "description": "Version of the AGENT.md / PLAYBOOK_NEW_STORY.md / short_story_drafting_agent.md Operating Contract this story was authored against. Separate from schema_version (frontmatter shape)."
    }
    ```
  - Make it required for strict short-story manuscripts in `scripts/lint/schema_validate.js` (parallel to schema_version; emit requiredFieldErrors for missing on story type).
  - Update all story frontmatter examples:
    - `docs/PLAYBOOK_NEW_STORY.md` (Step 2 YAML block).
    - `docs/schemas/examples/story_example.json`.
    - `docs/SCHEMA_QUICK_REFERENCE.md` (add row + to common failures table).
  - Backfill existing short stories (one-time): use `v1.0.0` (current contracts) via a small script or manual edit on the 8+ manuscripts. Tie to a promote or migration note.
  - Surface in `scripts/lib/canon_policy.js` (optional: `describePolicy` or new helper) and linkmap output if useful for filtering/packs.
  - Update validation, redline linter docs, canonical_reference_validator if they need awareness.
- Documentation/enforcement:
  - PLAYBOOK, agents/short_story_drafting_agent.md, QUICKSTART_AGENT.md, CONTRIBUTING.md, PR template, INSTRUCTION_MANUAL.md, USAGE.md, SCHEMA_QUICK_REFERENCE.md: add contract_version to required reading, frontmatter templates, pre-flight checklists, common lint failures.
  - In PR template "Validation" and "Checklist": require the field.
  - Future: when contracts materially change, bump version + require update on new stories (or promotion).
- Distinguish clearly: `schema_version` = frontmatter shape stability. `contract_version` = behavioral/operating contract (AGENT + PLAYBOOK + agent files).

**Files to touch**:
- `AGENT.md`, `docs/PLAYBOOK_NEW_STORY.md` (headers + any internal version refs).
- `docs/schemas/story.schema.json`.
- `scripts/lint/schema_validate.js` (enforcement for stories).
- `docs/PLAYBOOK_NEW_STORY.md`, `docs/schemas/examples/story_example.json`, `docs/SCHEMA_QUICK_REFERENCE.md`.
- All short-story `manuscript.md` (backfill `contract_version: v1.0.0`).
- Docs: QUICKSTART_AGENT.md, CONTRIBUTING.md, `.github/pull_request_template.md`, `docs/INSTRUCTION_MANUAL.md`, `docs/USAGE.md`, `agents/short_story_drafting_agent.md`, `agents/README.md`.
- Optional: `scripts/promote_story.js` (stamp contract_version on promotion); tiny migration helper.

**Validation**: `npm run lint:schema` (stories now require + pass with the field); `validate:ci`; manual inspection of frontmatter + generated INDEX/REFERENCE_MAP if policy surfaces it; PR template examples.

**Tradeoff**: Optional initially (for migration ease) vs required immediately (stronger enforcement but forces backfill). Recommendation: add to schema + examples now; enforce on strict short-story path in next minor; backfill as part of this work. Versioning headers: simple embedded is lowest friction (no file proliferation).

---

## Workstream 4: Generalize Short-Story Playbook into a Family of Playbooks or a Matrix (short-story / novella / novel chapter / lore expansion) with Appropriate Gates

**Current state**:
- `docs/PLAYBOOK_NEW_STORY.md`: Explicitly "Novel and screenplay work are outside this playbook." Gold standard for short stories only (story-#### IDs, full story.schema, cross_refs discipline, Lore Update Matrix, `validate:ci`, promotion via promote_story.js, dedicated short_story_drafting_agent.md).
- Novel: `meta.yaml` (rich but ad-hoc: id/title/type:novel/status/logline/series_arc_setup/connections + free-form themes); manuscript/outline/notes + 1 scene. No story_type enforcement.
- Novellas: Minimal `meta.yaml` (id/title/status); `manuscript.md` with `kind: novella` + scenes list; outlines stubs. Test/sandbox heavy.
- Screenplay: Separate (screenplay_scene.schema, compile_screenplay, format linter).
- Lore expansions: Separate (lore/*.md with lore.schema, data/lexicon, mechanics, bible).
- Schema: `story_type` enum includes `novel|novella|scene|fragment|short-story`, but validation, canon_policy, linkmap, promote, and most tooling are path-based or short-story-only. No differentiated gates.
- Promotion: `scripts/promote_story.js` hardcoded to short_story/.
- README, agents, docs: Out of sync (stories/README lists only novel + 4 shorts; no novellas).
- Asymmetry: Shorts have rigor + CI block; everything else is development-visible (lower canon weight) but noisy in indexes and validation.

**Proposed changes** (family + matrix, preserve short-story invariants):
- Create `docs/PLAYBOOKS/` (or flat with prefixes):
  - `PLAYBOOK_COMMON.md`: Shared prerequisites (AGENT.md, STYLE.md, core mechanics, bible, SCHEMA_QUICK_REFERENCE, Lore Update Matrix core, ID strategy (ids_next for story-/char- etc.; work_id for larger works), cross-refs discipline, validation basics (`validate:ci` parity where applicable), commit/PR conventions (Canon Impact), redline rules.
  - `PLAYBOOK_SHORT_STORY.md`: Current PLAYBOOK_NEW_STORY.md content (renamed/moved for continuity; update internal refs). story_type: short-story specifics + full gate.
  - `PLAYBOOK_NOVEL.md`: Flagship (Forgotten Tides example). Covers meta.yaml + manuscript/outline/notes/scenes structure, chapter management, series arc setup, tone/POV differentiation vs shorts, larger Lore Matrix (arc + per-chapter + new entities), optional generalized promotion, word-count targets, development notes.
  - `PLAYBOOK_NOVELLA.md`: Intermediate (kind: novella + scenes; outline + manuscript; lighter cross-refs on key anchors; test-to-draft path; scene-level matrix).
  - `PLAYBOOK_SCREENPLAY.md`: Format-specific (scene headings, stakes/promise_links/moral actions, screenplay linter first, compile flow, work_id).
  - `PLAYBOOK_LORE_EXPANSION.md` (or NON_STORY_CANON): For lore/*.md, mechanics, lexicon terms, timeline events, bible updates. Not story_type; cross-ref hygiene + dedicated lints.
- `docs/PLAYBOOK_MATRIX.md` (single source of truth table, hand-maintained or lightly scripted):
  Columns: story_type/kind | Dir structure | Frontmatter/schema | ID style | Validation gate | Promotion | Dedicated agent | Lore Matrix scope | Notes.
  Rows for short-story, novel, novella, scene/fragment, lore/non-story.
- Supporting changes (to make matrix operational):
  - Generalize `scripts/promote_story.js` → `promote_work.js` (or keep short-story one + add) that keys off explicit `story_type` (or `kind`/`work_id`) and walks appropriate dirs. Update package.json script + docs.
  - Enhance `scripts/lint/schema_validate.js` + `scripts/lib/canon_policy.js` to read/use `story_type` explicitly (per-type required lists; tier inference that prefers explicit story_type over pure path heuristics; e.g., novel chapters get appropriate draft weight).
  - Add parallel agents/ (e.g. `novel_drafting_agent.md`, `novella_drafting_agent.md`) that reference the new playbooks + forbid short-story-only moves.
  - Update `stories/README.md`, CONTRIBUTING.md, QUICKSTART_AGENT.md, INSTRUCTION_MANUAL.md, PR template, agents/README.md to point at the matrix + family.
  - Extend authoring/orchestrate/scenes_cli/linkmap/canon reports to surface `story_type` in outputs + respect matrix rules.
  - Optional: lightweight matrix validator or report (extend canon_tier_report or new playbook_lint.js).
  - For lore: treat as peer (separate playbook; cross-refs as the bridge to stories).
- Update existing novel/novella files minimally for consistency (e.g., add `story_type` or `kind` where missing; ensure meta.yaml have `schema_version`/`tags` if the new meta schemas expect them).
- No immediate hard gates for non-shorts (keep "best-effort" in validate); the matrix + docs + agents provide the structure. Future phases can tighten.

**Files to touch**:
- New: `docs/PLAYBOOK_COMMON.md`, `docs/PLAYBOOK_SHORT_STORY.md` (move/rename content), `docs/PLAYBOOK_NOVEL.md`, `docs/PLAYBOOK_NOVELLA.md`, `docs/PLAYBOOK_SCREENPLAY.md`, `docs/PLAYBOOK_LORE_EXPANSION.md`, `docs/PLAYBOOK_MATRIX.md`.
- `scripts/promote_story.js` (generalize or duplicate logic) + package.json.
- `scripts/lint/schema_validate.js`, `scripts/lib/canon_policy.js` (story_type awareness).
- `docs/PLAYBOOK_NEW_STORY.md` (or delete after rename), stories/README.md, all cross-ref docs (CONTRIBUTING, QUICKSTART, INSTRUCTION_MANUAL, USAGE, PR template, agents/*, SCHEMA_QUICK_REFERENCE).
- Minimal frontmatter harmonization on existing novel/novella meta + manuscripts.

**Validation**: Manual review of matrix table; `npm run validate:ci` (short-story path unchanged); `npm run lint:schema` (fewer skips for novel/novella meta once new schemas + routing land); agents can "follow" the matrix docs; generated INDEX/REFERENCE_MAP show improved categorization.

**Tradeoff**: Creating 5+ new playbook files adds surface area (but COMMON reduces duplication). Renaming the existing PLAYBOOK requires updating every reference (doable in one pass). Recommendation: start with COMMON + MATRIX + short-story rename; add novel/novella playbooks in the same PR or follow-up. Keep short-story gate untouched.

---

## Workstream 5: Enhance build_linkmap + canon_policy to Produce a "Canon Delta" Report Artifact for Agents and PR Summaries

**Current state**:
- `scripts/prompt/build_linkmap.js`: Full rebuild of entities (via TYPE_BY_DIR + root + lexicon), policy via canon_policy, edges from cross_refs/references, orphaned. Writes: `out/graphs/entities.json` (full, transient), `REFERENCE_MAP.json` (slim nodes+edges+tiers/weights), `CANONICAL_INDEX.md` (human + views), `docs/link_map/LINK_MAP.md` (stats + lists). Uses `writeGeneratedFile` (timestamp-normalized) for the 3 committed artifacts. No prior-state comparison.
- `scripts/lib/canon_policy.js`: Pure inference (`inferCanonTier`, `sourceWeight`, `describePolicy`, `shouldInclude`, `provenanceNote`). No delta.
- Artifacts: 3 committed + 1 transient. validate_ci.js does `git diff --exit-code -I[Gg]enerated` on the 3 (the enforced "delta check").
- Existing delta-like: `scene_diff.js` (knowledge/moral/stakes deltas via reporters.js); `canon_tier_report.js` (snapshot only, `out/reports/canon_tier_report.{json,md}`); validate_ci artifact gate; promote_story prints next steps including generated diffs.
- PR template: Requires running linkmap:build + validate:ci; Lore Update Matrix mentions the 3 generated files; Canon Impact checkboxes.
- Agents/PLAYBOOK/QUICKSTART: Must run linkmap + validate; document generated changes in PRs. No dedicated "canon delta" artifact for summarization.

**Proposed changes** (additive, reuses existing patterns):
- Primary extension inside `scripts/prompt/build_linkmap.js` (after entity/relationship collection + sorting, before/after writeGeneratedFile):
  - Load prior state: parse committed `REFERENCE_MAP.json` (or CANONICAL_INDEX.md) for "before" nodes/edges/tiers.
  - Compute delta vs in-memory current:
    - added_entities / removed_entities (by canonical_id + key fields: name, type, path, canon_tier, source_weight).
    - tier_changes (id + from_tier/to_tier + weight_delta).
    - added_edges / removed_edges (source|target|type).
    - new_orphaned / resolved_orphaned.
    - stats_delta (counts per tier/type before/after + net).
    - summary string (e.g. "Added 2 draft entities (term-0027, loc-0012); 1 tier promotion (story-0004); 3 new relationships; 0 new orphans.").
  - Write via shared reporters pattern to `out/reports/canon_delta_${iso}.json` + `.md` (human + machine).
  - Reuse `normalizeGeneratedContent` / writeGeneratedFile style if desired; always emit (reports are gitignored).
  - Optional flag: `--emit-delta` or always-on for build.
- Enhance `scripts/lib/reporters.js` (already used by scene_diff + linters): add `writeCanonDeltaReport`, pure `computeNodeDelta(prevNodes, currNodes)`, `computeEdgeDelta`, `renderCanonDeltaMarkdown` helpers. Keeps output format consistent.
- Alternative/parallel home: extend `scripts/reports/canon_tier_report.js` (it already walks + calls describePolicy) to do prior-snapshot comparison + full delta.
- Wire-in:
  - `scripts/validate_ci.js`: after linkmap:build, optionally invoke delta emitter; include short summary in console output ("Canon delta: ... see out/reports/canon_delta_*.md").
  - `scripts/promote_story.js`: after rebuild, emit delta for the promotion.
  - New npm script: `"report:canon-delta": "node scripts/prompt/build_linkmap.js --emit-delta"` (or dedicated thin wrapper).
  - Update validate:ci orchestration if needed.
- Consumption:
  - Short-story drafting agent + other agents: after linkmap:build step, "review canon_delta for PR summary".
  - PR template: add section or note "Attach/review canon_delta summary if present".
  - CI comments / validate:ci output.
  - Multi-agent (orchestrate.js), context profiles, dashboard.
  - Humans: `out/reports/` is the established place.
- Keep the git-diff gate on the 3 artifacts exactly as-is (delta report is additive evidence, not a replacement).
- No change to entities.json / REFERENCE_MAP / INDEX contracts.

**Files to touch**:
- `scripts/prompt/build_linkmap.js` (delta computation + emit, after collection).
- `scripts/lib/reporters.js` (new helpers).
- `scripts/reports/canon_tier_report.js` (optional extension point).
- `scripts/validate_ci.js`, `scripts/promote_story.js`.
- `package.json` (new script).
- Docs: `docs/PLAYBOOK_NEW_STORY.md` (or the new family), `agents/short_story_drafting_agent.md`, `.github/pull_request_template.md`, `docs/lint/README.md`, `docs/USAGE.md`, `docs/INSTRUCTION_MANUAL.md` (mention the artifact in workflows + "include in PR summaries").
- Optional: thin `scripts/reports/canon_delta.js` wrapper.

**Validation**: `npm run linkmap:build` (delta appears in out/reports/); manual diff of a small change (add a term or entity) shows correct added/tier/edge; `npm run validate:ci` still passes (no new gate); agent docs reference it; inspect JSON + MD output for usability in PRs.

**Tradeoff**: Emit always (simple) vs conditional (avoids report spam on pure prose changes). Recommendation: always emit on linkmap:build (reports dir is already for this). Store prior state only from committed artifacts (no extra snapshots).

---

## Cross-Cutting Sequencing, Tests, Docs, Migration, CI

**Recommended phases (optimized for minimal disruption + quick wins)**:
1. **Phase 1 (core noise reduction + visibility)**: Workstream 1 (schemas + routing) + Workstream 2 seeding (story-0001 + bible into events.yaml + basic parser improvements) + Workstream 3 (contract_version field + backfill + headers on AGENT/PLAYBOOK). Run full validate:ci after each. Update lint docs immediately.
2. **Phase 2 (generalization + reporting)**: Workstream 4 (COMMON + MATRIX + short rename + novel/novella playbooks skeleton) + Workstream 5 (delta computation in build_linkmap + reporters + wiring). Update all cross-refs, agents, PR template.
3. **Phase 3 (enforcement + polish)**: Strengthen non-trivial chronology requirement + timeline checks; make contract_version required on strict paths; generalize promote; add matrix validator if needed. Backfills complete.

**Tests** (add/extend in every stream):
- Existing: test_timeline_events, test_canon_policy, test_recursive_coverage, test_dashboard, validate:ci parity.
- New/updated: assertions for seeded events, contract_version presence on stories, reduced schema skips in data/lore/stories, canon_delta shape + content for a controlled change, matrix doc consistency (light).
- Run `npm test` equivalents + `npm run validate:ci` on every change.

**Docs updates** (required for usability):
- SCHEMA_QUICK_REFERENCE, lint/README, PLAYBOOK family files, PR template (Canon Impact + new delta section), INSTRUCTION_MANUAL, USAGE, QUICKSTART, CONTRIBUTING, stories/README, agents/*.
- Add "contract_version" and "canon delta" to common lint/usage patterns.
- Update examples (story_example.json, frontmatter blocks).

**Migration / backfill** (one-time, part of Phase 1):
- Add `contract_version: v1.0.0` to all short-story manuscripts (and novel/novella if they adopt story frontmatter).
- Seed `data/timeline/events.yaml` with origin events (T0–T5 + story-0001 summary); add corresponding `events:` to story-0001 frontmatter.
- Add minimal frontmatter or schema_version/tags to data YAMLs / novel/novella meta if the tolerant schemas still surface post-Ajv warnings.
- Commit together with regenerated artifacts + linkmap:build.
- Document in a migration note or UPGRADE_GUIDE entry.

**CI / gates**:
- No changes to the short-story required block or validate:ci orchestration (delta report and new schemas are non-blocking for non-shorts).
- The existing git-diff gate on generated artifacts remains the "canon change" signal.
- New reports live under `out/reports/` (already gitignored; visible in agent/CI runs).
- Add `report:canon-delta` (or equivalent) to validate:ci optional steps if desired.

**Risks & mitigations**:
- Schema changes accidentally making non-strict paths strict → use `required: false` + explicit path heuristics only.
- Timeline date parsing fragility (Cycles, relatives) → keep original strings + add relative mode; test heavily.
- Versioning + backfill churn on existing stories → do as single commit with clear message; make contract_version optional at first if needed.
- Playbook family proliferation → heavy use of COMMON + MATRIX table reduces duplication; keep short-story as the proven path.
- Delta report format instability → start minimal (added/removed/tier/edges/stats + summary); evolve in reporters.js.
- Agents/docs drift → update all references in the same PR where possible; use the matrix as the new single source.
- Effort creep → stick to "minimal/tolerant" schemas, "header + field" versioning, and "additive delta" only.

---

## Open Questions / Tradeoffs for User Input (Before or During Implementation)

1. **Schema strictness**: Prefer fully tolerant `additionalProperties: true` + path routing (lowest maintenance) or add a few more required fields (e.g. `id` + `type`) for the new meta/data schemas to give light structure?
2. **Contract versioning mechanics**: Embedded headers in AGENT.md / PLAYBOOK + `contract_version` field in stories (simple) or also maintain dated snapshot files under `docs/contracts/`? When we bump (e.g. v1.1), do we require all *new* stories to update immediately, or only on promotion?
3. **Playbook family granularity**: Full separate files for novel/novella/screenplay/lore (as outlined) or a single larger PLAYBOOKS.md with sections + the MATRIX table? Should "novel chapter" get its own row (as scene/fragment under a novel work_id) or be treated purely as sub-units of the novel playbook?
4. **Canon delta artifact**: Should the JSON/MD always be emitted on every `linkmap:build` (even no-change runs) or only when there is actual delta? Commit the delta reports to git (unlikely, since reports/) or treat purely as CI/agent output?
5. **Timeline "non-trivial" definition**: Hard threshold on `timeline.chronology.length >= N` (e.g. 3 or 4) + tag, or also consider presence of `duration`, `story_type`, or explicit `has-structured-timeline` flag in frontmatter? Make the check hard-fail for short stories or keep soft + promotion blocker?
6. **Migration order priority**: If effort must be sequenced strictly, which two workstreams deliver the highest immediate value (e.g. schemas + timeline seeding first to kill noise and make timeline real)?
7. Any constraints on touching existing story-0001 frontmatter or bible prose during seeding?

---

**Readiness**: All data gathered via direct reads, globs, and 5 targeted explore agents. Plan is actionable: specific files, code locations (e.g. schema_validate.js:64-87 for selectSchema, timeline_variance.js:455-472 for normalize, build_linkmap.js:241-292 for artifact writes, canon_policy.js:43-64 for infer), test hooks, and doc cross-refs.

Execute in the phased order above. After Phase 1, re-run full `npm run validate:ci` + inspect reports before Phase 2.

This plan is now ready for implementation. (Plan file written to .kilo/plans/foundational-improvements.md; plan_exit follows.)