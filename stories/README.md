# Stories

[`CANONICAL_INDEX.md`](../CANONICAL_INDEX.md) at the repository root is the
authoritative, generated list of every story, its path, and its canon tier. Its
"Authoritative Canon" view lists what is locked; its "Active Drafts" view lists
everything else. Regenerate it with `npm run linkmap:build`. For a per-file
report, `npm run report:canon-tiers` writes `out/reports/canon_tier_report.md`.

The tables below are hand-maintained for orientation. They must agree with each
manuscript's `canon_tier` and `status` frontmatter; when they disagree, the
frontmatter and the index win. Only `primary_canon` stories are locked canon that
later work must not contradict. Drafts are reference material for agents and
candidates for promotion (see `docs/PLAYBOOK_NEW_STORY.md`, Step 6b).

## Short Stories

| ID | Title | Tier | Status | Manuscript |
|----|-------|------|--------|------------|
| `story-0001` | The Archivist's Wake | primary_canon | canonical | [manuscript](./short_story/the_archivists_wake/manuscript.md) |
| `story-0002` | Memoir of a Nobody | draft | draft | [manuscript](./short_story/memoir_of_a_nobody/manuscript.md) |
| `story-0003` | The Tuner of Last Lights | draft | draft | [manuscript](./short_story/the_tuner_of_last_lights/manuscript.md) |
| `story-0004` | The Light Inheritance | draft | draft | [manuscript](./short_story/the_light_inheritance/manuscript.md), [outline](./short_story/the_light_inheritance/outline.md) |
| `story-0005` | The Liturgy of Rust | draft | draft | [manuscript](./short_story/the_liturgy_of_rust/manuscript.md) |
| `story-0006` | The Anchorless Tide | draft | draft | [manuscript](./short_story/the_anchorless_tide/manuscript.md) |
| `story-0007` | The Hospice Knot | draft | draft | [manuscript](./short_story/the_hospice_knot/manuscript.md) |
| `story-0008` | The Reliquarist's Doubt | primary_canon | canonical | [manuscript](./short_story/the_reliquarists_doubt/manuscript.md) |
| `story-0010` | The Error That Remembered Itself | draft | draft | [manuscript](./short_story/the_error_that_remembered_itself/manuscript.md) |
| `story-0011` | The Quiet Census | draft | draft | [manuscript](./short_story/the_quiet_census/manuscript.md) |
| `story-0012` | The Mercy Doctrine | primary_canon | canonical | [manuscript](./short_story/the_mercy_doctrine/manuscript.md) |
| `story-0013` | The Smallest Burn | primary_canon | canonical | [manuscript](./short_story/the_smallest_burn/manuscript.md) |
| `story-0014` | The Public Weight of a Private Lie | draft | draft | [manuscript](./short_story/the_public_weight_of_a_private_lie/manuscript.md) |
| `story-0015` | The Halix Aftermarket | draft | draft | [manuscript](./short_story/the_halix_aftermarket/manuscript.md) |
| `story-0016` | The Lie That Learned the Hallway | draft | draft | [manuscript](./short_story/the_lie_that_learned_the_hallway/manuscript.md) |
| `story-0017` | The Loss Ledger | draft | draft | [manuscript](./short_story/the_loss_ledger/manuscript.md) |
| `story-0018` | The Navigator Who Forgot Enough | draft | draft | [manuscript](./short_story/the_navigator_who_forgot_enough/manuscript.md) |
| `story-0019` | The Miniaturist's Name | draft | draft | [manuscript](./short_story/the_miniaturists_name/manuscript.md) |
| `story-0020` | The Inventory of Absence | draft | draft | [manuscript](./short_story/the_inventory_of_absence/manuscript.md) |
| `story-0021` | Receipt for a Voice | draft | draft | [manuscript](./short_story/receipt_for_a_voice/manuscript.md) |
| `story-0022` | Spend What You Can Afford | primary_canon | canonical | [manuscript](./short_story/spend_what_you_can_afford/manuscript.md) |

`story-0009` is the novella below; the short-story sequence skips it. `story-0001`
predates the `canon_tier` field but now declares `canon_tier: primary_canon`
explicitly, matching what the index inferred from its path.

## Novellas

| ID | Title | Tier | Status | Manuscript |
|----|-------|------|--------|------------|
| `story-0009` | The Doctrine of Empty Stars | draft | draft | [manuscript](./novella/NOVELLA_THE_DOCTRINE_OF_EMPTY_STARS/manuscript.md) |
| `novella_first_corridor` | First Corridor | draft (inferred) | draft | [manuscript](./novella/NOVELLA_FIRST_CORRIDOR/manuscript.md) |

`NOVELLA_TEST` and `NOVELLA_TEST_NOVELLA` are tooling fixtures. The canon policy
classifies them as `test` material and excludes them from prompt packs.

## Novels

| ID | Title | Tier | Status | Manuscript |
|----|-------|------|--------|------------|
| `novel_forgotten_tides_manuscript` | Forgotten Tides | draft (inferred) | draft | [manuscript](./novel/NOVEL_FORGOTTEN_TIDES/manuscript.md) |

Flagship novel of the series. Protagonist: Gorgi, a ship technician from an
unremarkable planet who discovers his homeworld is being erased from existence,
and whose ordinary memories may be the only evidence of a conspiracy that
threatens the galaxy. Novel and screenplay workflows are outside
`docs/PLAYBOOK_NEW_STORY.md`; short stories must not depend on novel-draft facts.

## Screenplays

`SCREENPLAY_SAMPLE` is a format sample for the screenplay tooling, not canon.
