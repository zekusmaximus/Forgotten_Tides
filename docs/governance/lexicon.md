# Lexicon Governance

## Overview

This document defines the change control process for the structured lexicon in `data/lexicon/terms.yaml`. The lexicon is a critical component of The Forgotten Tides universe, ensuring consistency across all narrative and technical documentation.

## Change Control Process

### 1. Term Addition

**Requirements:**
- New terms must be canonical to the universe
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
  status: "..."          # canonical/speculative/deprecated
  aliases: [...]         # Optional alternative names
```

## Validation

The glossary enforcer script (`scripts/lint/glossary_enforcer.js`) runs automatically to:
- Validate term usage in stories
- Check for undefined terms
- Ensure consistency with structured data

## Legacy Migration

The original `lexicon/GLOSSARY.md` has been moved to `data/lexicon/legacy/GLOSSARY.md` for historical reference. All new development should use the structured YAML format.

## OWNERS

Current OWNERS for lexicon governance:
- @archivist-primary
- @memory-physics-expert
- @narrative-continuity

Changes to the OWNERS list require approval from existing OWNERS.