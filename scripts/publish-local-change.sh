#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
PUBLISH_SCRIPT="$SCRIPT_DIR/../kit/scripts/publish-changes.sh"

if [[ ! -f "$PUBLISH_SCRIPT" ]]; then
  printf '[ERROR] Installable publish implementation not found: %s\n' "$PUBLISH_SCRIPT" >&2
  exit 1
fi

exec bash "$PUBLISH_SCRIPT" "$@"
