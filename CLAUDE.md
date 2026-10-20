# CLAUDE.md

Standing instructions for Claude Code sessions in this repository. This file
routes work to the documents that govern it; it does not restate them. If this
file and a linked document disagree, follow the linked document and say so.

The repository is a continuity-locked fiction universe plus the Node tooling
that validates it. The author owns every canon decision.

## Canon Rules

The universe fundamentals, tonal constraints, expansion protocol, and Canon
Compliance Tests load from `AGENT.md`:

@AGENT.md

Locked continuity lives in `bible/ARCHIVISTS_WAKE_STORY_BIBLE.md`,
`mechanics/`, `manuals/PILOT_MANUAL.md`, `lore/` (including `lore/theology/`),
`data/lexicon/terms.yaml`, and `characters/`.

- `CANONICAL_INDEX.md` is the source of truth for what exists and at what
  tier. Hand-maintained lists elsewhere go stale; the index wins.
- Only `primary_canon` is locked. A `draft` story's facts are prior claims to
  reconcile with, not canon to obey.
- Report contradictions with file and line. Do not resolve them by editing
  locked files.

## Read First, by Task

| Task | Read before starting |
|------|----------------------|
| Draft a short story | `QUICKSTART_AGENT.md` (its full reading order), then `docs/PLAYBOOK_NEW_STORY.md` and `agents/short_story_drafting_agent.md` |
| Review drafts for promotion | `agents/canon_promotion_review_agent.md` (section 0 is the invocation) |
| Promote a story | `docs/PLAYBOOK_NEW_STORY.md` Step 6b |
| Brainstorm, outline, or revise | `agents/brainstorm_agent.md`, `agents/outline_agent.md`, `agents/revision_agent.md` |
| Prose-level editing | `docs/STYLE.md`, especially section 12 (Prohibited Moves) and section 13 (Tone Checklist) |
| Frontmatter and enums | `docs/SCHEMA_QUICK_REFERENCE.md`; schemas in `docs/schemas/` |
| Scripts, CI, tooling | `docs/STATUS.md`, `docs/USAGE.md`, and sections 3 and 6 of `docs/PROCESS_REVIEW_STORY_DRAFTING_2026_10_20.md` |

The quickstart and playbook cover short stories only. For novella, novel, or
screenplay work, ask which process applies before borrowing the short-story
rules.

## What Needs the Author

Do not do any of the following unless the author asked for it in the current
session:

- Change a `canon_tier`, run `promote:story` without `--dry-run`, or set an
  entity's `metadata.status` to `canonical`.
- Change the meaning of anything in `bible/`, `mechanics/`, `manuals/`, or
  `lore/`, including locked numeric values such as `memory_density`.
- Rewrite manuscript prose outside a drafting task or an authorized revision.
- Settle an item in section 7 (Open Author Decisions) of the process review:
  the entity status rule, the commit type for new fiction, the glossary
  enforcer's purpose, the novella and novel dependency policy, or which drafts
  to promote. Surface these; do not decide them.

## Repository Mechanics

- **IDs:** `node scripts/ids_next.js --type story` (also `char`, `loc`,
  `fact`). Never guess or reuse an ID.
- **Lexicon:** new terms go under `terms:` in `data/lexicon/terms.yaml`.
  `lexicon/GLOSSARY.md` is only a pointer, and `data/lexicon/legacy/` is
  archived.
- **Entities:** `characters/<Name>.md`; `atlas/<Name>.md` for locations,
  ships, stations, artifacts, and regions; `factions/<Name>.md`. Entity
  `metadata.status` allows only `canonical`, `speculative`, or `deprecated`.
- **`cross_refs` and `references`:** both are required and usually
  identical. `CONTRIBUTING.md` explains the distinction.
- **Generated artifacts:** `CANONICAL_INDEX.md`, `REFERENCE_MAP.json`, and
  `docs/link_map/LINK_MAP.md`. Never edit them by hand. Regenerate with
  `npm run linkmap:build` and commit them with the change that produced them.
- **Frontmatter edits:** prefer line-level edits over parsing and re-dumping
  YAML, which drops comments and rewrites quoting and line wrapping. The
  manuscript body below the closing `---` must stay byte-identical; check the
  diff, especially after `promote_story.js`, which re-serializes frontmatter.
- **Cross-platform tooling:** the author runs the npm scripts in Windows
  PowerShell, so write tooling in Node, not shell. The `.sh` files in
  `scripts/` are not wired into any npm script.

## Validation

```bash
npm ci                # node_modules is not committed; CI uses Node 20
npm run lint          # schema, refs, canonical refs, glossary, canon, red-line
npm run check         # continuity, timeline, stakes, knowledge, reader model
npm run validate:ci   # CI parity; must pass with 0 errors before a PR
```

- `validate:ci` rebuilds the link map, then fails if the three generated
  artifacts differ from what git has staged. Run `npm run linkmap:build` and
  stage or commit the results first, or a correct tree fails.
- `npm run lint:canon` scans every root-level `.md` file except `README.md`,
  `CANONICAL_INDEX.md`, and `CONTRIBUTING.md`, so it scans this file and
  `AGENT.md`. Its red-line patterns match any single line, negations included.
- CI also runs a Markdown link check over every `.md` file. Relative links
  must resolve.
- Reports go to `out/` (gitignored), for example
  `out/reports/canon_tier_report.md` from `npm run report:canon-tiers` and
  `out/reports/continuity.json` from `npm run check:continuity`.

## Commits, Branches, and Pull Requests

- Conventional commits per `docs/COMMIT_CONVENTIONS.md`. Use `canon:` for any
  change that moves or updates canon, with a Canon Note footer (section 4 of
  that file).
- Promotions: `canon(story): promote story-#### to primary_canon`.
- New fiction: `feat(story)` versus `canon(story)` is an open author decision,
  and history uses both. Until it is settled, follow
  `docs/PLAYBOOK_NEW_STORY.md` Step 7 and include a Canon Impact line.
- Pull request bodies follow `.github/pull_request_template.md`: Canon Impact,
  Lore Update Matrix, and validation output.
- Branches follow `type/scope/short-desc` unless the session assigns one.
  Prefer squash-merges.

## Work That Must Outlive the Session

Cloud sessions are ephemeral. Anything not committed and pushed is lost.

- Commit review output. Canon promotion reviews go to
  `docs/reviews/CANON_PROMOTION_REVIEW_<YYYY-MM-DD>.md`. Process and codebase
  reviews go in `docs/` beside the existing `*_REVIEW_*` files.
- Never put deliverables in `docs/reports/`. The `.gitignore` pattern
  `reports/` matches at any depth, so files there never reach git (process
  review 3.13).
- Before reporting a tooling bug, check section 3 of the process review. Many
  defects are already documented there, and some are already fixed.
- Session or project memory holds workflow state and preferences only: what
  is in flight, on which branch, and what the author asked for. Never store
  universe facts, lore, or canon decisions there. Those live in this
  repository and change only through the processes above.
