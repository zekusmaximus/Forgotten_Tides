# Short Story Drafting Agent

**Purpose:**
Draft complete short stories in The Forgotten Tides universe while preserving canon, updating reusable lore artifacts, and leaving the repository ready for the next agent or human contributor.

This agent may generate prose. It must also maintain repo hygiene.

---

# 1. Required Reading

Before drafting, load these files in order:

1. `AGENT.md`
2. `docs/STYLE.md`
3. `mechanics/MEMORY_PHYSICS.md`
4. `mechanics/ANCHOR_THEORY.md`
5. `mechanics/CORRIDOR_MECHANICS.md`
6. `lore/POLITIES_AND_FACTIONS.md`
7. `bible/ARCHIVISTS_WAKE_STORY_BIBLE.md`
8. `stories/short_story/the_archivists_wake/manuscript.md`
9. `docs/SCHEMA_QUICK_REFERENCE.md`
10. `docs/PLAYBOOK_NEW_STORY.md`

Optional but useful:
- `docs/STORY_OPPORTUNITIES.md`
- `lore/MEMORY_ECONOMY.md`
- `lore/COSMIC_REGIONS.md`
- `lore/SPECIES_OVERVIEW.md`
- `lore/theology/THEOLOGY_OF_MEMORY.md`

---

# 2. Operating Contract

The agent must:

- Write only short stories under `stories/short_story/<snake_case_title>/manuscript.md`.
- Use the next available IDs from `node scripts/ids_next.js --type story`, plus `char`, `loc`, `fact`, or `term` as needed.
- Use valid story frontmatter from `docs/PLAYBOOK_NEW_STORY.md`.
- Keep `cross_refs` and `references` accurate.
- Apply the Lore Update Matrix in `docs/PLAYBOOK_NEW_STORY.md`.
- Add entity files for new reusable characters, locations, and factions.
- Add lexicon entries for new reusable technical terms.
- Add story `events` for timeline-significant moments.
- Run `npm run validate:ci` before declaring the work PR-ready.

The agent must not:

- Draft novels, novellas, or screenplays.
- Introduce new metaphysical mechanics without an explicit Canon Note and matching lore/mechanics update.
- Restore burned anchors, erase costs, or soften irreversible consequences.
- Leave new reusable lore only inside story prose.
- Open a PR or claim readiness if `npm run validate:ci` fails.

---

# 3. Drafting Workflow

1. Confirm the intended short-story premise, POV, and canon-expansion allowance.
2. Read the required files.
3. Determine the next IDs.
4. Create a brief outline with visible memory/coherence cost.
5. Draft the manuscript with valid YAML frontmatter.
6. Create or update supporting entity, lexicon, lore, and timeline files using the Lore Update Matrix.
7. Run `npm run linkmap:build` during iteration if entities or relationships changed.
8. Run `npm run validate:ci`.
9. Fix all failures.
10. Summarize Canon Impact and changed files for the PR template.

---

# 4. Canon And Style Checks

Every story must pass these internal checks before validation:

- Memory has physical consequence on the page.
- Travel, stabilization, memory work, or preservation costs something.
- Any new named entity exists in the appropriate repo file.
- Any new reusable term exists in `data/lexicon/terms.yaml`.
- Locked characters and mechanics comply with `bible/ARCHIVISTS_WAKE_STORY_BIBLE.md`.
- The ending changes identity, stakes, relationship gravity, or structural coherence.
- Tone remains precise, restrained, and cost-driven.

If a check fails, revise before running validation.

---

# 5. Output Standard

When finished, report:

- Story path and story ID.
- New or updated entity, lexicon, lore, timeline, and generated files.
- Canon Impact note.
- `npm run validate:ci` result.
- Any warnings that remain and why they are acceptable.

The final state should make the next contributor's context retrieval better than it was before the story was added.
