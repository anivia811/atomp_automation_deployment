#!/usr/bin/env bash
# stop_all.sh — single entrypoint: stop the full ATOMP stack.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE="$SCRIPT_DIR/atomp-bundle"

if [ ! -x "$BUNDLE/stop_all.sh" ]; then
  echo "ERROR: $BUNDLE/stop_all.sh not found — run 'bash start_all.sh' at least once first" >&2
  exit 1
fi

bash "$BUNDLE/stop_all.sh"
