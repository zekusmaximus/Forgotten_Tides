# Pull Request: [Brief Description]

## Summary

Describe what changed and why.

- Key changes:
- Affected short story or canon area:
- Breaking or migration notes:

## Canon Impact

Choose one and explain.

- [ ] No canon expansion; uses existing entities, terms, and mechanics only
- [ ] Draft canon expansion; new entities or terms added for review
- [ ] Material canon expansion; mechanics, timeline, factions, or locked continuity changed

Canon note:

## Lore Update Matrix

Complete every row that applies.

- [ ] New characters have `characters/<Name>.md` files and story refs
- [ ] New locations, ships, stations, artifacts, or regions have `atlas/<Name>.md` files and story refs
- [ ] New factions, orders, institutions, companies, cults, or political bodies have `factions/<Name>.md` files and story refs
- [ ] New technical terms are added under `terms:` in `data/lexicon/terms.yaml`
- [ ] Timeline-significant events are represented in story `events` (structured), and `data/timeline/events.yaml` if promoted beyond this story. Non-trivial chronology stories include `events`.
- [ ] Use of Rell, Sutira, Estavan, Tari, Heliodrome, Lattice Gap, eddies, zero-anchoring, or anchor burn has been checked against `bible/ARCHIVISTS_WAKE_STORY_BIBLE.md`
- [ ] Metaphysical changes are documented outside the story, not only in prose
- [ ] `CANONICAL_INDEX.md`, `REFERENCE_MAP.json`, and `docs/link_map/LINK_MAP.md` are updated if generated output changed

Notes for rows marked incomplete or not applicable:

## Validation

Run and report:

```bash
npm run validate:ci
```

- [ ] `npm run validate:ci` passes
- [ ] Warnings are understood and listed below
- [ ] Failures are fixed before review

Warnings or notable output:

## Affected Paths

List major files or directories changed.

- `stories/short_story/...`

## Checklist

- [ ] Story/frontmatter follows `docs/PLAYBOOK_NEW_STORY.md`
- [ ] `contract_version` present on short-story manuscripts (e.g. v1.0.0)
- [ ] `cross_refs` and `references` are accurate
- [ ] Canon Impact section is complete
- [ ] Related issues referenced, if any
