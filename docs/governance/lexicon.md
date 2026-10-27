# Lexicon Governance

## Overview

This document defines the change control process for the structured lexicon in `data/lexicon/terms.yaml`. The lexicon is a critical component of The Forgotten Tides universe, ensuring consistency across all narrative and technical documentation.

## Editorial Scope

The structured lexicon is the curated list of approved concepts and terminology.
Add a reusable mechanic, institution, procedure, or device only when its
definition and source can be verified. Record genuine alternative names in
`aliases`. Keep distinct objects separate: a Synod Lamp is the housing for a
Null Stone, so it is a term of its own rather than an alias of Null Stone.

Names, story titles, incidental title-case phrases, and ordinary prose do not
become lexicon terms merely because the scanner flags them. A draft-only
concept should remain `draft` until its definition is approved or an
authoritative source establishes it.

## Change Control Process

### 1. Term Addition

**Requirements:**
- New terms must name a reusable concept and cite its current source
- Use `status: draft` until an authoritative definition is approved
- Must include proper categorization and cross-references
- Must specify canonical source and first appearance
- Must be reviewed by at least one OWNER

**Process:**
1. Create a Pull Request with the new term(s)
2. Include justification and canonical references
3. Tag relevant OWNERS for review
4. Address any feedback from reviewers
5. OWNER approval required for merge

### 2. Term Modification

**Requirements:**
- Changes must maintain backward compatibility where possible
- Deprecation path must be provided for significant changes
- Must be reviewed by at least one OWNER

**Process:**
1. Create a Pull Request with proposed changes
2. Document rationale for modification
3. Include impact analysis on existing content
4. OWNER approval required for merge

### 3. Term Deprecation

**Requirements:**
- Must have clear migration path or replacement
- Must be marked as `status: deprecated` in YAML
- Must include deprecation notice period

**Process:**
1. Create a Pull Request marking term as deprecated
2. Include replacement term (if applicable)
3. Document deprecation timeline
4. OWNER approval required for merge

## Roles and Responsibilities

### Contributors
- May propose new terms or modifications
- Must follow the change control process
- Responsible for providing complete metadata

### Reviewers
- Review term proposals for canonical consistency
- Check cross-references and categorization
- Verify compliance with universe physics

### OWNERS
- Final approval authority for lexicon changes
- Responsible for maintaining narrative coherence
- Ensure terms align with established canon

## File Structure Requirements

All terms in `data/lexicon/terms.yaml` must include:

```yaml
- id: TERM-XXXX          # Unique identifier
  term: "Term Name"      # Canonical term name
  definition: "..."      # Clear, concise definition
  category: "..."        # Classification (e.g., Memory Physics, Technology)
  related_terms: [...]   # Array of related terms
  first_appearance: "..." # Source of first canonical mention
  canonical_source: "..." # Authoritative reference
  status: "..."          # canonical/draft/speculative/deprecated
  aliases: [...]         # Optional alternative names
```

## Validation

The glossary enforcer script (`scripts/lint/glossary_enforcer.js`) scans story
Markdown recursively for title-case multiword phrases and compares them with
terms and aliases. Its findings are **advisory**; they do not fail lint. They
are candidates for editorial review, not evidence that every phrase needs a
term. Review the full coverage and warning list in
`out/reports/glossary_coverage.json` before proposing additions.

## Legacy Migration

The original `lexicon/GLOSSARY.md` has been moved to `data/lexicon/legacy/GLOSSARY.md` for historical reference. All new development should use the structured YAML format.

## OWNERS

Current OWNERS for lexicon governance:
- @archivist-primary
- @memory-physics-expert
- @narrative-continuity

Changes to the OWNERS list require approval from existing OWNERS.
