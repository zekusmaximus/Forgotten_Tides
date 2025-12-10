#!/usr/bin/env bash
set -euo pipefail

# Simple smoke checks against key “red lines” from the Story Bible.
# This is not a parser; it’s a guard to catch accidental edits.

BIBLE="bible/ARCHIVISTS_WAKE_STORY_BIBLE.md"

grep -q "Anchors CANNOT regrow, regenerate, or be restored" "$BIBLE" \
  || { echo "Canon check failed: anchor irrevocability text missing"; exit 1; }

grep -q "Corridors cannot function without memory input" "$BIBLE" \
  || { echo "Canon check failed: corridor input rule missing"; exit 1; }

grep -q "The Heliodrome — .* cannot spontaneously resolve" "$BIBLE" -i \
  || { echo "Canon check failed: Heliodrome non-resolution rule missing"; exit 1; }

echo "Canon smoke checks passed."
