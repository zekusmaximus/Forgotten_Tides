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
