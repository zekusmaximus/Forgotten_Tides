#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel)
OUTPUT_DIR="${ROOT_DIR}/out/compiled"
SOURCE_FILE="${OUTPUT_DIR}/forgotten_tides_stories.md"
PDF_FILE="${OUTPUT_DIR}/forgotten_tides_stories.pdf"
EPUB_FILE="${OUTPUT_DIR}/forgotten_tides_stories.epub"

mkdir -p "$OUTPUT_DIR"

mapfile -t story_files < <(
  find "${ROOT_DIR}/stories" -type f -name '*.md' ! -name 'README.md' | sort
)

if [[ ${#story_files[@]} -eq 0 ]]; then
  echo "No story markdown files found under stories/." >&2
  exit 1
fi

: > "$SOURCE_FILE"

for file in "${story_files[@]}"; do
  rel_path="${file#${ROOT_DIR}/}"
  printf "\n\n<!-- Source: %s -->\n\n" "$rel_path" >> "$SOURCE_FILE"
  cat "$file" >> "$SOURCE_FILE"
done

if ! command -v pandoc >/dev/null 2>&1; then
  echo "pandoc is required to compile stories. Please install pandoc and re-run." >&2
  exit 1
fi

pandoc "$SOURCE_FILE" -o "$PDF_FILE"
pandoc "$SOURCE_FILE" -o "$EPUB_FILE"

echo "Compiled stories source: $SOURCE_FILE"
echo "Compiled stories PDF: $PDF_FILE"
echo "Compiled stories ePub: $EPUB_FILE"
