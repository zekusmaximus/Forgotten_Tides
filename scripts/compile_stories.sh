#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
OUTPUT_DIR="${ROOT_DIR}/out/compiled"
SOURCE_FILE="${OUTPUT_DIR}/forgotten_tides_stories.md"
EPUB_FILE="${OUTPUT_DIR}/forgotten_tides_stories.epub"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to compile stories. Please install Node.js and re-run." >&2
  exit 1
fi

if ! command -v pandoc >/dev/null 2>&1; then
  echo "pandoc is required to compile stories. Please install pandoc and re-run." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
source_temp=$(mktemp "${OUTPUT_DIR}/.stories.XXXXXXXX.md")
epub_temp=$(mktemp "${OUTPUT_DIR}/.stories.XXXXXXXX.epub")
trap 'rm -f "$source_temp" "$epub_temp"' EXIT

node "${ROOT_DIR}/scripts/compile_stories.js" > "$source_temp"
pandoc "$source_temp" --metadata title="Forgotten Tides Canon Stories" -o "$epub_temp"
mv "$source_temp" "$SOURCE_FILE"
mv "$epub_temp" "$EPUB_FILE"

echo "Compiled primary-canon stories source: $SOURCE_FILE"
echo "Compiled primary-canon stories ePub: $EPUB_FILE"
