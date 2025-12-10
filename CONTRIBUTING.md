# Contributing to The Forgotten Tides

This repository is **continuity-locked**. All additions must comply with:
- `/bible/ARCHIVISTS_WAKE_STORY_BIBLE.md`
- `/mechanics/*`
- `/manuals/PILOT_MANUAL.md`
- `/lore/*` and `/lore/theology/*`
- `/lexicon/GLOSSARY.md`
- `/characters/*`

## Rules
1. **No canon expansion** in this repo without an explicit Canon Note.
2. New fiction must:
   - live in `/stories/`
   - pass link checks (`scripts/validate_links.sh`)
   - pass canon checks (`scripts/check_canon.sh`)
3. Don’t alter established metaphysics, anchor counts, or Heliodrome status.
4. Use PRs with a short “Canon Impact” section.

## Commit style
- Conventional commits (`feat:`, `docs:`, `fix:`, `canon:` for canon-moving changes).
