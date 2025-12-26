
# Structural Audit & Optimization Plan for The Forgotten Tides Universe Repository

## Executive Summary

This document outlines the implementation plan for structural improvements to The Forgotten Tides repository, based on the structural audit response. The plan addresses data duplication, file organization, metadata standards, and automation tooling to support AI-assisted writing and RAG optimization.

## Current Status

### Completed Items

- **Phase 1: Foundations** - Structured lexicon and frontmatter standards established.
- **Phase 2: Directory Structure** - All required directories exist (`factions/`, `atlas/`, `design/`).
- **Phase 3: Canonical ID System** - [`CANONICAL_INDEX.md`](CANONICAL_INDEX.md) established with canonical IDs.
- **Phase 4: Validation Scripts** - Multiple linting and validation scripts implemented.
- **Phase 5: Story Compilation** - GitHub Action and local scripts for PDF/ePub generation.
- **Phase 6: Context Chunking** - Chunking and summarization pipeline operational.
- **Phase 7: Continuity Dashboard** - Interactive network visualization of canonical relationships.

### Generated Artifacts

- `out/reports/canonical_reference_report.json` - Canonical reference validation report.
- `out/chunks/chunk_manifest.json` - Chunk manifest for RAG optimization.
- `REFERENCE_MAP.json` - Machine-readable relationship graph.
- `dashboard/` - Web-based continuity visualization tool.

## Implementation Phases

### Phase 1 — Completed / In-Place Foundations

> This phase captures work that is already present in the repository. These items are considered complete unless future changes explicitly alter them.

### 1.1 Structured YAML Frontmatter on Canon Files (Completed)
**Status:** ✅ Complete

**What exists today**
- Character and mechanics files already include YAML frontmatter blocks with IDs, metadata, and cross references.

**Evidence**
- `characters/*.md` (e.g., [characters/Rell.md](characters/Rell.md))
- `mechanics/*.md` (e.g., [mechanics/MEMORY_PHYSICS.md](mechanics/MEMORY_PHYSICS.md))

### 1.2 Structured Lexicon Data (Completed)
**Status:** ✅ Complete

**What exists today**
- `data/lexicon/terms.yaml` with structured glossary terms.
- Legacy glossary retained at `data/lexicon/legacy/GLOSSARY.md`.

**Evidence**
- `data/lexicon/terms.yaml`
- `data/lexicon/legacy/GLOSSARY.md`

### 1.3 Glossary Enforcement & Schema Validation Tooling (Completed)
**Status:** ✅ Complete

**What exists today**
- Glossary enforcement script (uses structured lexicon with legacy fallback).
- YAML frontmatter schema validation tooling.

**Evidence**
- [scripts/lint/glossary_enforcer.js](scripts/lint/glossary_enforcer.js)
- [scripts/lint/schema_validate.js](scripts/lint/schema_validate.js)

---

## Phase 2 — Structural Alignment & Directory Gaps

> Goal: align the physical repository layout with the intended taxonomy in the plan.

### 2.1 Create Missing Directories (from README vision)
**Status:** ✅ Complete

**Subtasks**
1. Create directories: `factions/`, `atlas/`, `design/` at repository root.
2. Add minimal `README.md` files inside each directory clarifying intended content.
3. Update any documentation references that point to non-existent directories.

### 2.2 Relocate Lexicon Legacy Source to a Single Canonical Location
**Status:** ✅ Complete

**Subtasks**
1. Move `lexicon/GLOSSARY.md` → `data/lexicon/legacy/GLOSSARY.md`.
2. Replace `lexicon/GLOSSARY.md` with a short stub that points to `data/lexicon/terms.yaml`.
3. Ensure all scripts reference `data/lexicon/terms.yaml` first.

### 2.3 Directory-Level Taxonomy Confirmation
**Status:** ✅ Complete

**Subtasks**
1. Verify `/bible/`, `/mechanics/`, `/lexicon/`, `/lore/`, `/characters/`, `/stories/`, `/manuals/`, `/docs/`, `/scripts/`, `/agents/` all exist.
2. Add short index files where missing to reinforce intended scope.

---

## Phase 3 — Canonical IDs, Metadata Harmonization, and Reference Consistency

> Goal: unify metadata conventions across files and eliminate ambiguity for automated tooling.

### 3.1 Canonical ID Standardization
**Status:** ✅ Complete

**Subtasks**
1. Define a canonical ID schema in `docs/` (format, prefixes, examples).
2. Map existing `id`/`uuid` fields in YAML frontmatter to the canonical ID standard.
3. Add a `canonical_id` field to all character, location, event, and mechanics files.

### 3.2 Reference Integrity Pass
**Status:** ✅ Complete

**Subtasks**
1. Normalize `cross_refs` so all references point to canonical IDs.
2. Update any references in stories and mechanics to canonical IDs.
3. Add explicit `references` nodes in YAML frontmatter where missing.

### 3.3 Canonical Index and Reference Map
**Status:** ✅ Complete

**Subtasks**
1. Create [`CANONICAL_INDEX.md`](CANONICAL_INDEX.md) listing all canonical entities.
2. Create `REFERENCE_MAP.json` describing relationships between entities.
3. Ensure both files include canonical IDs and source file paths.

---

## Phase 4 — Automation & Validation Enhancements

> Goal: improve tooling to prevent continuity drift and reduce manual oversight.

### 4.1 Canonical Reference Validator
**Status:** ✅ Complete

**Subtasks**
1. Build a script that scans frontmatter references.
2. Validate that each referenced ID exists in the knowledge base.
3. Emit a report to `out/reports/` with broken references.

**Evidence**
- [scripts/lint/canonical_reference_validator.js](scripts/lint/canonical_reference_validator.js)
- `out/reports/canonical_reference_report.json`

### 4.2 Glossary Linter Enhancements
**Status:** ✅ Complete

**Subtasks**
1. Extend `scripts/lint/glossary_enforcer.js` to suggest closest matching glossary terms.
2. Log missing glossary terms with file/line context.
3. Add configuration to allow per-directory ignore lists.

**Evidence**
- [scripts/lint/glossary_enforcer.js](scripts/lint/glossary_enforcer.js)

### 4.3 Frontmatter Schema Expansion
**Status:** ✅ Complete

**Subtasks**
1. Update schema definitions to include `canonical_id`, `references`, `status`, `tags`.
2. Validate files by type (character vs mechanics vs story).

**Evidence**
- `docs/schemas/*.schema.json`
- [scripts/lint/schema_validate.js](scripts/lint/schema_validate.js)

---

## Phase 5 — Story Compilation & Publication Workflow

> Goal: build a reproducible pipeline for compiled outputs.

### 5.1 GitHub Action for Story Compilation
**Status:** ✅ Complete

**Subtasks**
1. Add `.github/workflows/compile-stories.yml`.
2. Concatenate `stories/*.md` into a single source file.
3. Generate PDF and ePub artifacts via Pandoc.

**Evidence**
- `.github/workflows/compile-stories.yml`

### 5.2 Local Build Script
**Status:** ✅ Complete

**Subtasks**
1. Add `scripts/compile_stories.sh` mirroring the workflow logic.
2. Document how to run it in `docs/`.

**Evidence**
- `scripts/compile_stories.sh`
- [docs/USAGE.md](docs/USAGE.md)

---

## Phase 6 — RAG & Context Optimization

> Goal: make content more retrieval-friendly while preserving narrative quality.

### 6.1 Mechanics File “Quick Reference” Blocks
**Status:** ✅ Complete

**Subtasks**
1. Add a structured YAML “Quick Reference” block to each mechanics file.
2. Ensure the block is near the top of the file for token efficiency.

**Evidence**
- [mechanics/MEMORY_PHYSICS.md](mechanics/MEMORY_PHYSICS.md)
- [mechanics/CORRIDOR_MECHANICS.md](mechanics/CORRIDOR_MECHANICS.md)
- [mechanics/ANCHOR_THEORY.md](mechanics/ANCHOR_THEORY.md)

### 6.2 Chunking & Summaries Pipeline
**Status:** ✅ Complete

**Subtasks**
1. Implement a script to generate chunked versions of large files.
2. Add automated summaries for each chunk.
3. Store outputs in `out/` with a consistent naming convention.

**Evidence**
- [scripts/context/chunk_and_summarize.js](scripts/context/chunk_and_summarize.js)
- `out/chunks/chunk_manifest.json`

---

## Phase 7 — Continuity Dashboard

> Goal: a visual representation of canonical relationships for high-level continuity review.

### 7.1 Continuity Web UI
**Status:** ✅ Complete

**Subtasks**
1. Build a small web UI reading `REFERENCE_MAP.json`. ✅
2. Render relationships as a network graph. ✅
3. Highlight missing or speculative nodes. ✅

**Evidence**
- [dashboard/index.html](dashboard/index.html) - Main HTML structure
- [dashboard/dashboard.js](dashboard/dashboard.js) - Graph rendering logic
- [dashboard/README.md](dashboard/README.md) - Usage documentation
- `package.json` - Added `npm run dashboard` script

---

## Phase 8 — Advanced Automation & Validation

> Goal: move from manual maintenance to a fully automated, self-validating repository.

### 8.1 Dynamic Data Synchronization
**Status:** ✅ Complete

**Subtasks**
1. Automate `REFERENCE_MAP.json` generation from entity frontmatter.
2. Automate `CANONICAL_INDEX.md` rebuilding to prevent index drift.
3. Integrate both into the `build_linkmap.js` pipeline.

**Evidence**
- [scripts/prompt/build_linkmap.js](scripts/prompt/build_linkmap.js) (Updated)
- [CANONICAL_INDEX.md](CANONICAL_INDEX.md) (Auto-generated)
- [REFERENCE_MAP.json](REFERENCE_MAP.json) (Auto-generated)

### 8.2 Canon Linter (Red Line Enforcement)
**Status:** ✅ Complete

**Subtasks**
1. Implement a linter that checks for Story Bible "Red Line" violations.
2. Integrate canon checks into the standard `npm run lint` workflow.

**Evidence**
- [scripts/checks/canon_linter.js](scripts/checks/canon_linter.js)
- `package.json` (`lint:canon` script)

### 8.3 Context Packing & Dashboard UX
**Status:** ✅ Complete

**Subtasks**
1. Enhance `orchestrate.js` to generate Markdown "Prompt Packs" for AI agents.
2. Add VS Code deep-linking to the Continuity Dashboard for direct file editing.
3. Implement "Orphaned Node" highlighting in the dashboard to find lore gaps.

**Evidence**
- [scripts/prompt/orchestrate.js](scripts/prompt/orchestrate.js) (Updated)
- [scripts/prompt/export_prompt_pack.js](scripts/prompt/export_prompt_pack.js) (Updated)
- [dashboard/dashboard.js](dashboard/dashboard.js) (Updated)

---

## Tooling & Automation

### Available npm Scripts

```json
{
  "lint:schema": "node scripts/lint/schema_validate.js",
  "lint:refs": "node scripts/lint/unresolved_refs.js",
  "lint:canonical-refs": "node scripts/lint/canonical_reference_validator.js",
  "lint:glossary": "node scripts/lint/glossary_enforcer.js",
  "check:continuity": "node scripts/checks/continuity.js",
  "check:timeline": "node scripts/checks/timeline_variance.js",
  "check": "npm run check:continuity && npm run check:timeline",
  "lint": "npm run lint:schema && npm run lint:refs && npm run lint:canonical-refs && npm run lint:glossary && npm run lint:canon",
  "context:build": "node scripts/prompt/context_builder.js",
  "context:chunk": "node scripts/context/chunk_and_summarize.js",
  "dashboard": "npx http-server -p 8080 -o /dashboard/"
}
```

### Dependencies

**Production Dependencies:**
- `ajv` - JSON schema validation
- `glob` - File pattern matching
- `gray-matter` - YAML frontmatter parsing