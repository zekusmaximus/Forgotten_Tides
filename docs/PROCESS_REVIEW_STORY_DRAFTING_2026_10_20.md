# Story Drafting Process Review - 2026-10-20

## Executive Summary

This review records what an agent actually encounters when it follows this
repository's instructions to draft, validate, merge, and promote a short story.
It is based on one complete pass: `story-0022` (*Spend What You Can Afford*)
was drafted from the documented reading order, carried through the Lore Update
Matrix, validated, merged in PR #33, and promoted to primary canon in PR #34.

- **The process works.** The reading order, the bible's red lines, the schema
  enum table, the Lore Update Matrix, and `npm run validate:ci` together got a
  canon-expanding story from blank file to merged primary canon without any
  guidance beyond the repository's own documents.
- **The documented promotion path was broken.** `scripts/promote_story.js`
  resolved the repository root one directory too high and had never found a
  manuscript. It is fixed in PR #34, but no test would have caught it, and the
  tool still only changes two of the eight or so fields a promotion needs.
- **Several checks are weaker than their documentation implies.** The glossary
  enforcer never scans manuscripts. The continuity checker matches character
  names as bare substrings. The canon linter's red-line patterns fire on
  negations. None of these is documented where a drafting agent would look.
- **Status and tier metadata are duplicated and inconsistently applied.**
  Stories carry both `status` and `metadata.status`. Entity files from draft
  stories are variously `canonical` or `speculative` with no rule.
- **Some navigational documents are stale** and will mislead a fresh agent:
  the quickstart lists six stories; `stories/README.md` lists four and calls
  two drafts canonical; the opportunities menu says a faction has no stories
  when it has two.
- **The highest-value fixes are small:** extend the promotion tool, add a
  smoke test for it, fix two matchers, and fold a gotcha-aware checklist into
  the playbook. A draft of that checklist is in section 5 below.

## 1. Basis

One agent, one session, one story, end to end:

1. Read every document in `QUICKSTART_AGENT.md`'s reading order plus all
   twenty-one existing stories, every entity file, the lexicon, the timeline,
   the schemas, and every lint and check script.
2. Drafted a 6,450-word short story introducing three characters, three
   lexicon terms, three shared timeline events, and consequences recorded in
   nine existing entity and lore files.
3. Ran the full validation suite, opened a PR with the template, merged on
   green CI, then promoted the story and opened and merged a second PR.

Everything below is an observation from that pass, with the file and line that
produced it where one exists.

## 2. What Works

- **The reading order is correct and sufficient.** `AGENT.md`, `STYLE.md`, the
  three mechanics documents, the bible, and the primary exemplar give an agent
  enough to write inside the universe. The bible's section 7 red lines and
  section 8 tests are the single most useful constraint set in the repository.
- **The schema enum table prevents the common failures it says it prevents.**
  `docs/SCHEMA_QUICK_REFERENCE.md` is accurate to the schemas and saves a
  round-trip through `docs/schemas/*.json`.
- **`node scripts/ids_next.js --type <t>` works for every type** and removes
  the ID-collision risk entirely.
- **The Lore Update Matrix is the right abstraction.** Framing repository
  hygiene as "for each change in the story, these files change" turns a
  diffuse obligation into a checklist. It was followed row by row and produced
  a complete canon package.
- **`npm run validate:ci` is genuinely CI-parity.** Local green predicted CI
  green on both PRs. The checks finish in about twenty seconds on GitHub.
- **Tracked generated artifacts plus the freshness check** catch the one
  failure a careless agent would make: editing frontmatter without rebuilding
  `CANONICAL_INDEX.md`, `REFERENCE_MAP.json`, and the link map.
- **Entity files with `continuity.invariants` and `continuity.watchlist`** are
  the right place for cross-story constraints. The watchlist on Elior Ren
  ("track anchor count as eleven unless a later canon event changes it") is
  exactly the sentence a later agent needs.
- **`continuity_notes` and `bible_refs` in story frontmatter** give a drafting
  agent a place to state what it did and did not change, and give a reviewer a
  place to start.
- **The PR template** forces the Canon Impact and matrix questions to be
  answered in the PR, where a reviewer sees them.

## 3. Friction and Defects

Each item gives the observation, the evidence, the effect on an agent, and a
recommended fix with a rough effort.

### 3.1 `promote_story.js` could not find any manuscript

- **Evidence:** `scripts/promote_story.js` computed `ROOT` as
  `path.join(__dirname, '..', '..')`. The script lives one level below the
  repository root, so the result was the parent of the repository.
  `node scripts/promote_story.js --id story-0022` failed with
  `ENOENT: scandir '/home/user/stories/short_story'`.
- **Effect:** The playbook's "optional but recommended" Step 6b and the
  quickstart's `npm run promote:story` had never worked.
- **Status:** Fixed in PR #34 (`path.join(__dirname, '..')`).
- **Fix remaining:** add `scripts/tests/test_promote_story.js` that runs the
  script against a fixture manuscript in a temporary directory and asserts the
  frontmatter changes. Effort: small.

### 3.2 The promotion tool changes two fields; a promotion needs about eight

- **Evidence:** `updateFrontmatter()` sets `canon_tier` and top-level
  `status`. Left untouched: `metadata.status`, `retrieval_role`, every
  `events[].canon_tier` inside the story, the story's shared events in
  `data/timeline/events.yaml`, the `metadata.status` of entity files the
  story introduced, the `status` of lexicon terms it introduced, and any
  "draft continuity" wording the story's PR wrote into atlas, faction, lore,
  and character files. All of these had to be aligned by hand in PR #34.
- **Effect:** A story can be `primary_canon` with `metadata.status: draft`,
  `retrieval_role: active_draft`, and draft-tier events in the same file. The
  Authoritative Canon view can list a story whose protagonist is speculative.
- **Fix:** extend the script to align the manuscript's own fields and the
  story's `data/timeline/events.yaml` entries; print a checklist of the
  entity, lexicon, and prose items it cannot safely automate; document the
  full checklist in the playbook's Step 6b. Effort: small to medium.

### 3.3 `validate:ci` fails on a correct uncommitted tree

- **Evidence:** `scripts/validate_ci.js` runs `linkmap:build` and then
  `git diff --exit-code` on the three generated files before any lint runs.
  Regenerated artifacts that differ from HEAD fail the step even when they are
  exactly what should be committed.
- **Effect:** The first local run after any frontmatter change exits 1 with a
  diff dump and no lint output, which reads as a failure. The agent must know
  to commit first or to run `npm run lint`, `npm run check`, and the
  `test:*` scripts individually while iterating.
- **Fix:** either reorder `validate_ci.js` to run the content gates before the
  freshness diff, or add a `--allow-dirty-artifacts` flag for local use, and
  say in the playbook that the freshness check is a commit-time gate.
  Effort: small.

### 3.4 The glossary enforcer never scans manuscripts

- **Evidence:** `scripts/lint/glossary_enforcer.js` reads `stories/` with a
  non-recursive `fs.readdirSync` and keeps only top-level `.md` files. The
  only file that matches is `stories/README.md`. It is warnings-only in any
  case.
- **Effect:** The quickstart's "Term Usage: use only canonical terms" rule and
  the governance document's "validates term usage in stories" claim are not
  enforced. Agents believe a check exists. It would also be unusable as
  written if enabled: its regex treats every Title Case bigram as a candidate
  term, so character names and phrases like "Second Sleeve" would all warn.
- **Fix:** decide what the enforcer is for. If it is advisory, say so in
  `docs/governance/lexicon.md` and the quickstart. If it is meant to catch
  synonyms for canon terms (`STYLE.md` section 10), rewrite it around a
  deny-list of known synonyms rather than a Title Case heuristic, and make it
  recursive. Effort: medium.

### 3.5 The continuity checker matches names as bare substrings

- **Evidence:** `scripts/checks/continuity.js` sets
  `charMentioned = contentLower.includes(charName.toLowerCase())` and then,
  for any invariant of the form `Property: Value`, searches the story for the
  property word. The only such invariants in the repository are `Species:
  Human` and `Species: Human (Mid-Gravity)`. A story containing "farewell"
  (which contains "rell") and the word "species" can hard-fail against Rell's
  file. The baseline passes today only because no story combines a name
  substring with that word.
- **Effect:** A latent hard failure that no document warns about. The
  practical rule for drafters is "do not use the word species," which is not
  written anywhere.
- **Fix:** match names on word boundaries and compare property values rather
  than regex-testing for any non-matching word. Add the rule to the drafting
  checklist until then. Effort: small.

### 3.6 The canon linter's red-line patterns fire on negations

- **Evidence:** `scripts/checks/canon_linter.js` tests each line against
  `/anchor (regrew|regenerated|restored|recovered)/i` and
  `/Corridor.*without.*memory/i`, among others. A sentence such as "no anchor
  restored" or "a corridor cannot hold without memory" fails the build. The
  patterns also apply to frontmatter lines, so a `continuity_notes` entry
  stating the rule can trip the rule.
- **Effect:** Drafters must phrase around the patterns. During story-0022 the
  continuity notes were worded "no anchor is regrown, replaced, or given
  back" specifically to avoid the matcher.
- **Fix:** document the patterns in the playbook as a "phrases that trip the
  canon linter" list, or add a per-line opt-out marker, or make the patterns
  negation-aware. Effort: small for documentation, medium for the matcher.

### 3.7 Shared timeline events are fragile and the namespace is ambiguous

- **Evidence:** In `scripts/checks/timeline_variance.js`, a
  `data/timeline/events.yaml` entry whose `timestamp` does not match the
  `Cycle N`, `Year N`, `T<n>[+-]...`, or ISO forms gets a null date. The
  internal-consistency loop then compares `new Date(null)` (the epoch) against
  dated neighbors and records an out-of-order hard failure. Separately, every
  story uses `T0` as its own local zero, so the shared file now mixes the
  bible's `T0` through `T5` with story-local `T0+1h` entries that have no
  relation to them.
- **Effect:** Adding a shared event is safe only if the timestamp is in a
  parseable form, and the resulting shared timeline sorts events from
  different stories as if they were simultaneous.
- **Fix:** adopt a relative-anchor convention for shared events (for example
  an `anchor: story-0008 +12w` field, or a `S0022+1h` form the parser
  recognizes) and skip null-dated events in the ordering check. Effort: medium.

### 3.8 Entity status has no rule

- **Evidence:** In `CANONICAL_INDEX.md`'s canon views, Lira Voss (char-0008)
  is `primary_canon` and Maren Holt (char-0009) is `speculative`; both come
  from story-0007, a draft. Inya Solven was `canonical` while her story was a
  draft. Elior Ren, Tess Vlin, and most later characters are `speculative`.
- **Effect:** Retrieval weight for characters depends on which agent wrote the
  file, not on canon state. Promotion has to decide per file.
- **Fix:** state a rule in the playbook. A defensible one: an entity's status
  follows the highest tier of any story it appears in, and promotion of a
  story promotes the entities that exist only because of it. Effort: small
  for the rule, small for a one-time pass to apply it.

### 3.9 Stories carry two status fields

- **Evidence:** `docs/schemas/story.schema.json` allows both a top-level
  `status` and `metadata.status`. The playbook template uses only the
  top-level field; most manuscripts set both; the promotion tool sets one.
- **Effect:** They drift. story-0022 had `status: canonical` and
  `metadata.status: draft` between the tool run and the manual fix.
- **Fix:** pick one. If `metadata.status` stays for entity-file symmetry,
  have the schema validator warn when the two disagree. Effort: small.

### 3.10 `bible_refs` anchors are never checked

- **Evidence:** `scripts/lint/redline_citation_linter.js` accepts any entry
  containing `ARCHIVISTS_WAKE` or `bible`. The anchors
  (`#36-anchor-burn-consequence` and so on) are frontmatter strings, so the
  Markdown link check never sees them either.
- **Effect:** A citation to a section that does not exist passes.
- **Fix:** have the linter resolve each anchor against the bible's headings.
  Effort: small.

### 3.11 Commit-type guidance conflicts

- **Evidence:** `docs/COMMIT_CONVENTIONS.md` restricts `feat:` to "new
  non-canon features (scripts, CI, scaffolding)" and reserves `canon:` for
  canon changes. `QUICKSTART_AGENT.md` and `docs/PLAYBOOK_NEW_STORY.md`
  recommend `feat(story): add 'Title'` for new fiction. The two most recent
  story commits used `feat(story)` and `canon(story)` respectively.
- **Effect:** History is less legible than the conventions document intends.
- **Fix:** reconcile. Either add a `story:` type or state that all new
  fiction is `canon(story):` with a Canon Impact line. Effort: trivial.

### 3.12 Navigational documents are stale

- **Evidence:** `QUICKSTART_AGENT.md` "What Exists" lists story-0001 to
  story-0006 of twenty-two. `stories/README.md` lists four stories and marks
  story-0002 and story-0003 "Canonical" while their frontmatter says draft.
  `docs/STORY_OPPORTUNITIES.md` describes the Remembrancers of Solace as "the
  only faction with no story appearances" although story-0007 and story-0018
  are set at Solace Hospice.
- **Effect:** A fresh agent that trusts these lists will under-read and may
  reintroduce lore that already exists.
- **Fix:** generate "What Exists" from `CANONICAL_INDEX.md` at
  `linkmap:build` time, or delete the hand-maintained lists and point at the
  index. Correct the opportunities menu. Effort: small.

### 3.13 `docs/reports/` is silently ignored

- **Evidence:** `.gitignore` contains the bare pattern `reports/`, which
  matches any directory of that name at any depth, including a `docs/reports/`
  an agent would naturally create for a review.
- **Effect:** A report written there is never committed and the agent may not
  notice.
- **Fix:** narrow the pattern to `/out/reports/` or `out/`, or add
  `!docs/reports/`. Effort: trivial.

### 3.14 The scene-level quality linters do not see short stories

- **Evidence:** `check:stakes`, `check:knowledge`, `check:reader`, and
  `lint:moral` read `moral_actions`, `knowledge_delta`, `stakes`, and
  `knowledge_state` from scene files. The strict story schema has
  `additionalProperties: false` and defines none of these fields, so a short
  story manuscript cannot carry them.
- **Effect:** For the short-story pipeline these four checks are no-ops that
  still print "report written," which suggests coverage that does not exist.
- **Fix:** either extend the story schema with an optional `stakes` block, or
  state in the playbook that these checks apply to novella and novel scenes
  only. Effort: small for the note.

### 3.15 Required `events` are not enforced

- **Evidence:** The playbook and drafting agent require an `events` block when
  `timeline.chronology` has three or more entries. No script in
  `scripts/lint/` or `scripts/checks/` tests that condition.
- **Effect:** The requirement depends on the agent reading the matrix.
- **Fix:** a ten-line check in `schema_validate.js` or `timeline_variance.js`.
  Effort: trivial.

### 3.16 Novella and novel drafts have no stated dependency policy

- **Evidence:** The Doctrine of Empty Stars continuity brief says later
  stories should not cite its Synod material; story-0012 explicitly declares
  independence from story-0009; story-0020 is written against the unpublished
  novel's context. Nothing in the playbook says whether a short story may
  depend on novella or novel drafts.
- **Effect:** Each agent decides for itself, and promotion later has to
  untangle it.
- **Fix:** one sentence in the playbook: short stories may use entities the
  novella or novel introduced only if those entities have their own files, and
  may not depend on novella or novel plot. Effort: trivial.

## 4. Smaller Observations

- `summary_50` and `summary_200` are character limits of 220 and 1200, not
  word counts. The names mislead; the quick reference corrects them.
- `scripts/**` is CODEOWNERS-protected. A one-token script fix in a story PR
  triggers a reviewer request. That is correct behavior, but agents should
  know that fixing tooling inside a content PR widens its review.
- The red-line citation linter triggers only on locked IDs in `cross_refs`
  and `references`. A story can use zero-anchoring or eddy tracking without
  those IDs and pass uncited; the playbook asks for the citation anyway.
  Agents should cite regardless.
- The promote tool re-serializes frontmatter with `gray-matter`, converting
  inline arrays to block lists and re-quoting strings. Values survive. Agents
  should diff the body to confirm it is unchanged, which it was.
- The canon-policy test suite asserts tier weights and ordering but has no
  fixture for a promoted short story other than story-0001, so promotion
  side-effects are untested.

## 5. The Checklist a Drafting Agent Actually Needs

This is the sequence that produced a clean pass, with the gotchas from section
3 placed where they bite. It is a candidate replacement for the Pre-Flight
Checklist in `docs/PLAYBOOK_NEW_STORY.md`.

**Setup**
1. `npm ci`. Run `npm run validate:ci` and confirm a green baseline before
   changing anything.
2. `node scripts/ids_next.js --type story|char|loc|fact|term` for every type
   you might need. Record the IDs.

**Read**
3. The reading order in `QUICKSTART_AGENT.md`, in full. Then both primary
   exemplars. Then every story whose entities you intend to touch, in full,
   with each entity file's invariants and watchlist. Do not trust the
   quickstart's "What Exists" list; trust `CANONICAL_INDEX.md`.
4. Read `scripts/checks/canon_linter.js` once. Know the phrases it rejects.

**Design**
5. Write the premise against `AGENT.md` section 2.3 and `STYLE.md` section
   12 before drafting. Name the cost on every page in one sentence each.
6. Decide what the story depends on. Do not depend on novella or novel plot.
   If you depend on another draft, say so in `continuity_notes`.
7. List every new reusable character, location, faction, and term. Each gets
   a file or a lexicon entry. Story-local figures may stay unnamed.

**Draft**
8. Frontmatter from the playbook template with `contract_version`. Both
   `cross_refs` and `references`. `timeline` with chronology; `events` if the
   chronology has three or more entries. `bible_refs` and `continuity_notes`
   whenever a locked character, the Heliodrome, the Lattice Gap,
   zero-anchoring, eddy tracking, or anchor burn appears.
9. In prose and frontmatter alike: never place "anchor" directly before
   "restored," "recovered," "regrew," or "regenerated"; never put "corridor,"
   "without," and "memory" on one line; never use the word "species."
10. Keep `summary_50` under 220 characters and `summary_200` under 1200.
    `themes` only from the enum. Story `metadata.status` is `draft`; entity
    `metadata.status` is `canonical` or `speculative`, never `draft`.

**Lore Update Matrix**
11. Entity files with `continuity.invariants` and `continuity.watchlist` that
    state what later stories must preserve.
12. Lexicon terms with `status: draft`, `first_appearance`, and
    `canonical_source`.
13. Shared timeline events only with parseable timestamps (`T0+1h` form).
14. Update the entity, lore, and `docs/STORY_OPPORTUNITIES.md` files the
    story's consequences touch, labelled as draft continuity until promotion.

**Validate**
15. `npm run linkmap:build`. Then `npm run lint`, `npm run check`, and each
    `npm run test:*` script individually. Fix everything.
16. Commit, including the three regenerated artifacts. Only then run
    `npm run validate:ci`; before the commit it fails on the freshness diff.

**Ship**
17. Conventional commit with a Canon Impact line and, for canon-moving
    changes, a Canon Note footer. PR with the template filled in. Squash-merge.

**Promote (a separate decision)**
18. Run the review agent in `agents/canon_promotion_review_agent.md`. If the
    author promotes, follow its section 9 checklist; the tool does two of the
    eight steps.

## 6. Recommended Changes, Prioritized

| Priority | Change | Files | Effort |
|----------|--------|-------|--------|
| P0 | Add a smoke test for `promote_story.js`; extend it to align `metadata.status`, `retrieval_role`, story `events[].canon_tier`, and the story's `data/timeline/events.yaml` entries; print the remaining manual checklist | `scripts/promote_story.js`, `scripts/tests/`, `docs/PLAYBOOK_NEW_STORY.md` | Small to medium |
| P0 | Fold section 5 of this review into the playbook's Pre-Flight Checklist, including the linter phrase traps | `docs/PLAYBOOK_NEW_STORY.md`, `QUICKSTART_AGENT.md` | Small |
| P1 | Word-boundary name matching and value comparison in the continuity checker | `scripts/checks/continuity.js` | Small |
| P1 | Run content gates before the artifact freshness diff, or add a local flag | `scripts/validate_ci.js`, `docs/STATUS.md` | Small |
| P1 | State an entity-status rule and apply it once | `docs/PLAYBOOK_NEW_STORY.md`, `characters/*.md` | Small |
| P1 | Narrow the `reports/` ignore pattern | `.gitignore` | Trivial |
| P1 | Reconcile `feat(story)` versus `canon(story)` | `docs/COMMIT_CONVENTIONS.md`, `QUICKSTART_AGENT.md`, `docs/PLAYBOOK_NEW_STORY.md` | Trivial |
| P2 | Decide the glossary enforcer's purpose; make it recursive with a synonym deny-list or mark it advisory | `scripts/lint/glossary_enforcer.js`, `docs/governance/lexicon.md` | Medium |
| P2 | Relative-anchor convention for shared timeline events; skip null dates in ordering | `scripts/checks/timeline_variance.js`, `data/timeline/events.yaml`, playbook | Medium |
| P2 | Resolve `bible_refs` anchors against bible headings | `scripts/lint/redline_citation_linter.js` | Small |
| P2 | Generate "What Exists" from the index; correct `stories/README.md` and the opportunities menu | `QUICKSTART_AGENT.md`, `stories/README.md`, `docs/STORY_OPPORTUNITIES.md` | Small |
| P2 | Enforce `events` when chronology has three or more entries | `scripts/lint/schema_validate.js` | Trivial |
| P2 | Note that scene-level quality checks do not apply to short stories, or extend the story schema | `docs/PLAYBOOK_NEW_STORY.md` or `docs/schemas/story.schema.json` | Small |
| P2 | One-sentence dependency policy for novella and novel drafts | `docs/PLAYBOOK_NEW_STORY.md` | Trivial |

## 7. Open Author Decisions

These cannot be settled by an agent and are not settled by this review.

1. **Entity status rule.** Should an entity's status follow the highest tier
   of any story it appears in? If yes, a one-time pass changes several files.
2. **`memory_density` after the Tessarine Breach.** `atlas/Tessarine_Vault.md`
   (0.78) and `atlas/Helios_Drift.md` (0.65) are unchanged and flagged. Two
   lost silos argue for lowering both; the figures are locked numeric canon.
3. **Commit type for new fiction.** `feat(story)` or `canon(story)`.
4. **The glossary enforcer's purpose.** Advisory, synonym guard, or removed.
5. **Novella and novel dependency policy.** Whether short stories may build on
   `story-0009` or the novel's draft context before those are promoted.
6. **Which drafts to promote.** The review agent produces the scored report;
   the decision is the author's.
