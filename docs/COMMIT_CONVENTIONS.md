# COMMIT_CONVENTIONS.md — Conventional Commits for Canon
We use a strict Conventional Commits subset so history is legible and canon-sensitive.

## 1) Types (restricted)
- `docs:` documentation changes (README, manuals, mechanics, lore, theology, bible, style)
- `feat:` new *non-canon* features (scripts, CI, scaffolding)
- `fix:` corrections that do not alter canon meaning
- `refactor:` reorganization without content change
- `chore:` repo plumbing (deps, CI bumps)
- `test:` add/adjust checks (link, canon scripts)
- `canon:` **changes that move or update canon** (requires Canon Note & approval)

> If you’re unsure, default to `docs:`. Reserve `canon:` for deliberate policy-level edits.

## 2) Scopes (recommended)
`bible|mechanics|manuals|lore|theology|lexicon|characters|stories|docs|ci|scripts|repo`

Examples:  
- `docs(mechanics): clarify raveling indicators`  
- `canon(bible): lock eddy pursuit language`  
- `ci: add lychee link check`  

## 3) Subject Line Rules
- Imperative, present tense, ≤ 72 chars.  
- No trailing period.  
- Be concrete: what changed, not just “update”.

**Good:** `docs(manuals): add post-run cognitive checklist links`  
**Bad:** `docs: misc updates`

## 4) Body & Footer
- Body: why + context (bulleted).  
- Reference files/sections with relative paths.  
- If **canon** is touched, add a **Canon Note** footer.

**Canon Note footer format:**

Canon Note:

Affected: /bible/ARCHIVISTS_WAKE_STORY_BIBLE.md#35-eddies

Rationale: tighten definition to match Pilot Manual §5

Impact: wording only; no rule change


## 5) Branch Naming
`type/scope/short-desc` (kebab-case).  
Examples:
- `docs/lexicon/add-link-map-entries`
- `canon/bible/lock-anchor-irrevocability`
- `ci/lychee/enable`

## 6) PR Titles
Mirror the primary commit, e.g.:  
`docs(lexicon): add LINK_MAP and anchors for core terms`

## 7) Squash Policy
- Prefer **squash-merge** with a clean, conventional PR title.
- Preserve Canon Note in the squash commit body if applicable.

## 8) Pre-merge Checklist (aligns with PR template)
- [ ] Link check passes
- [ ] Canon smoke check passes
- [ ] `LINK_MAP.md` updated when new terms/anchors are added
- [ ] No new metaphysics introduced (unless `canon:` with approval)

## 9) Examples

**Non-canon doc fix**


docs(manuals): fix heading anchor for eddy avoidance

Corrects §5 link in PILOT_MANUAL.md to match LINK_MAP.md


**Canon movement (requires approval)**


canon(bible): formalize eddy pursuit criteria

Adds “mnemonic wake” phrasing to §3.5

Mirrors Pilot Manual §5
Canon Note:

Affected: /bible/ARCHIVISTS_WAKE_STORY_BIBLE.md#35-eddies

Rationale: harmonize terminology; no behavior change

Impact: low


**CI**


ci: enforce lychee link checks on PR

Adds .github/workflows/ci.yml

Excludes mailto: links


## 10) Reverts
Use `revert:` with the original header. If a revert affects canon, include a Canon Note explaining restoration to prior state.
