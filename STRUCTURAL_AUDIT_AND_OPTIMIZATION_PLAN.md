# Structural Audit & Optimization Plan for The Forgotten Tides Universe Repository

## Phase 1 — Completed / In-Place Foundations (Already Done)

> This phase captures work that is already present in the repository. These items are considered complete unless future changes explicitly alter them.

### 1.1 Structured YAML Frontmatter on Canon Files (Completed)
**Status:** ✅ Complete

**What exists today**
- Character and mechanics files already include YAML frontmatter blocks with IDs, metadata, and cross references.

**Evidence**
- `characters/*.md` (e.g., `characters/Rell.md`)
- `mechanics/*.md` (e.g., `mechanics/MEMORY_PHYSICS.md`)

**Notes for agents**
- Do **not** remove existing frontmatter fields. Extend or migrate carefully during later phases.

### 1.2 Structured Lexicon Data (Completed)
**Status:** ✅ Complete

**What exists today**
- `data/lexicon/terms.yaml` with structured glossary terms.
- Legacy glossary retained at `data/lexicon/legacy/GLOSSARY.md`.

**Evidence**
- `data/lexicon/terms.yaml`
- `data/lexicon/legacy/GLOSSARY.md`

**Notes for agents**
- Scripts already consume `data/lexicon/terms.yaml`. Treat this as the canonical structured lexicon source going forward.

### 1.3 Glossary Enforcement & Schema Validation Tooling (Completed)
**Status:** ✅ Complete

**What exists today**
- Glossary enforcement script (uses structured lexicon with legacy fallback).
- YAML frontmatter schema validation tooling.

**Evidence**
- `scripts/lint/glossary_enforcer.js`
- `scripts/lint/schema_validate.js`

**Notes for agents**
- Extend these tools rather than creating duplicates.

---

## Phase 2 — Structural Alignment & Directory Gaps

> Goal: align the physical repository layout with the intended taxonomy in the plan.

### 2.1 Create Missing Directories (from README vision)
**Status:** ✅ Complete

**Subtasks**
1. Create directories: `factions/`, `atlas/`, `design/` at repository root.
2. Add minimal `README.md` files inside each directory clarifying intended content.
3. Update any documentation references that point to non-existent directories.

**Agent guidance**
- Use short, declarative README content (“Purpose”, “Expected file types”, “Status”).

### 2.2 Relocate Lexicon Legacy Source to a Single Canonical Location
**Status:** ✅ Complete

**Subtasks**
1. Move `lexicon/GLOSSARY.md` → `data/lexicon/legacy/GLOSSARY.md` (if not already merged).
2. Replace `lexicon/GLOSSARY.md` with a short stub that points to `data/lexicon/terms.yaml` for canonical data.
3. Ensure all scripts reference `data/lexicon/terms.yaml` first, with a legacy fallback if required.

**Agent guidance**
- Preserve the legacy glossary content verbatim.
- Avoid breaking existing tooling that expects `lexicon/GLOSSARY.md` (keep a pointer file).

### 2.3 Directory-Level Taxonomy Confirmation
**Status:** ✅ Complete

**Subtasks**
1. Verify `/bible/`, `/mechanics/`, `/lexicon/`, `/lore/`, `/characters/`, `/stories/`, `/manuals/`, `/docs/`, `/scripts/`, `/agents/` all exist and are in active use.
2. Add short index files (e.g., `README.md` or `INDEX.md`) where missing to reinforce intended scope.

**Agent guidance**
- Keep index files minimal, consistent, and cross-linked.

---

## Phase 3 — Canonical IDs, Metadata Harmonization, and Reference Consistency

> Goal: unify metadata conventions across files and eliminate ambiguity for automated tooling.

### 3.1 Canonical ID Standardization
**Status:** ✅ Complete

**Subtasks**
1. Define a canonical ID schema in `docs/` (format, prefixes, examples).
2. Map existing `id`/`uuid` fields in YAML frontmatter to the canonical ID standard.
3. Add a `canonical_id` field to all character, location, event, and mechanics files.
4. Maintain backward compatibility by keeping existing IDs in place.

**Agent guidance**
- Do not rename files without a clear mapping.
- Create a translation table (CSV or JSON) mapping old IDs → canonical IDs.

### 3.2 Reference Integrity Pass
**Status:** ✅ Complete

**Subtasks**
1. Normalize `cross_refs` so all references point to canonical IDs.
2. Update any references in stories and mechanics to canonical IDs.
3. Add explicit `references` nodes in YAML frontmatter where missing.

**Agent guidance**
- Start with characters and mechanics before stories.
- Keep a changelog of updated references.

### 3.3 Canonical Index and Reference Map
**Status:** ✅ Complete

**Subtasks**
1. Create `CANONICAL_INDEX.md` listing all canonical entities (grouped by type).
2. Create `REFERENCE_MAP.json` describing relationships between entities.
3. Ensure both files include canonical IDs and source file paths.

**Agent guidance**
- Generate these files from frontmatter to avoid manual drift.

---

## Phase 4 — Automation & Validation Enhancements

> Goal: improve tooling to prevent continuity drift and reduce manual oversight.

### 4.1 Canonical Reference Validator
**Status:** ✅ Complete

**Subtasks**
1. Build a script (Node or Python) that scans frontmatter references.
2. Validate that each referenced ID exists in the knowledge base.
3. Emit a report to `out/reports/` with broken references.

**Agent guidance**
- Use the canonical index as the source of truth.
- Add the validator to existing lint/check workflows.

**Evidence**
- `scripts/lint/canonical_reference_validator.js`
- `out/reports/canonical_reference_report.json` (generated output)
- `package.json` (wired into `npm run lint`)

### 4.2 Glossary Linter Enhancements
**Status:** ✅ Complete

**Subtasks**
1. Extend `scripts/lint/glossary_enforcer.js` to suggest closest matching glossary terms.
2. Log missing glossary terms with file/line context.
3. Add configuration to allow per-directory ignore lists.

**Agent guidance**
- Keep output machine-readable for CI use.

**Evidence**
- `scripts/lint/glossary_enforcer.js` (JSON warnings with suggestions + line context; `.glossary_ignore.txt` support)

### 4.3 Frontmatter Schema Expansion
**Status:** ✅ Complete

**Subtasks**
1. Update schema definitions to include `canonical_id`, `references`, `status`, `tags`.
2. Validate files by type (character vs mechanics vs story).
3. Add schema versioning to reduce future churn.

**Agent guidance**
- Validate new fields without breaking older files; warn before failing.

**Evidence**
- `docs/schemas/*.schema.json` (status/tags/schema_version fields added)
- `scripts/lint/schema_validate.js` (warnings for missing recommended fields + expanded directory validation)

---

## Phase 5 — Story Compilation & Publication Workflow

> Goal: build a reproducible pipeline for compiled outputs.

### 5.1 GitHub Action for Story Compilation
**Status:** ✅ Complete

**Subtasks**
1. Add `.github/workflows/compile-stories.yml`.
2. Concatenate `stories/*.md` into a single source file.
3. Generate PDF and ePub artifacts via Pandoc.
4. Upload artifacts to the workflow summary.

**Agent guidance**
- Ensure the workflow doesn’t run on `stories/README.md` changes only.

**Evidence**
- `.github/workflows/compile-stories.yml`

### 5.2 Local Build Script
**Status:** ✅ Complete

**Subtasks**
1. Add `scripts/compile_stories.sh` mirroring the workflow logic.
2. Document how to run it in `docs/`.

**Agent guidance**
- Use predictable output filenames.

**Evidence**
- `scripts/compile_stories.sh`
- `docs/USAGE.md` (local compile instructions)

---

## Phase 6 — RAG & Context Optimization

> Goal: make content more retrieval-friendly while preserving narrative quality.

### 6.1 Mechanics File “Quick Reference” Blocks
**Status:** ⏳ Pending

**Subtasks**
1. Add a structured YAML “Quick Reference” block to each mechanics file.
2. Ensure the block is near the top of the file for token efficiency.
3. Include canonical examples and failure states.

**Agent guidance**
- Keep the block small and strictly structured.

### 6.2 Chunking & Summaries Pipeline
**Status:** ⏳ Pending

**Subtasks**
1. Implement a script to generate chunked versions of large files.
2. Add automated summaries for each chunk.
3. Store outputs in `out/` with a consistent naming convention.

**Agent guidance**
- Avoid modifying original files; generate derived artifacts.

---

## Phase 7 — Continuity Dashboard (Optional / Future)

> Goal: a visual representation of canonical relationships for high-level continuity review.

### 7.1 Continuity Web UI
**Status:** 💤 Deferred

**Subtasks**
1. Build a small web UI reading `REFERENCE_MAP.json`.
2. Render relationships as a network graph.
3. Highlight missing or speculative nodes.

**Agent guidance**
- Keep UI minimal; the value is the graph, not styling.

---

## Implementation Summary

**Already Completed:**
- Structured lexicon in `data/lexicon/terms.yaml`
- Glossary enforcement tooling
- YAML frontmatter present on canon files

**Immediate Next Steps (Recommended):**
1. Phase 6 mechanics quick reference blocks
2. Phase 6 chunking & summaries pipeline

This phased plan is designed so multiple AI agents can work in parallel without conflict, with each phase being independently verifiable and testable.
