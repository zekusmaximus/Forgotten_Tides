#!/usr/bin/env bash
set -euo pipefail
if ! command -v lychee >/dev/null 2>&1; then
  echo "Install lychee (link checker) first: https://github.com/lycheeverse/lychee"
  exit 1
fi
lychee --verbose --no-progress --exclude-mail --max-concurrency 8 "**/*.md"
