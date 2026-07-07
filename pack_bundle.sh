#!/usr/bin/env bash
# pack_bundle.sh — Compress the already-staged ./atomp-bundle/ directory into
# a single portable atomp-bundle.tar.gz for shipping to another machine.
#
# Run `bash build_bundle.sh` (or `bash start_all.sh`) at least once first —
# this script only packs what's already staged, it doesn't build/save
# anything itself.
#
# Usage: bash pack_bundle.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE="$SCRIPT_DIR/atomp-bundle"

log() { echo "[$(date +%H:%M:%S)] $*"; }
die() { echo "ERROR: $*" >&2; exit 1; }
hr()  { echo "────────────────────────────────────────────────────"; }

[ -d "$BUNDLE" ] || die "$BUNDLE not found — run build_bundle.sh (or start_all.sh) first"

hr; log "Packing atomp-bundle.tar.gz..."

# atomid/df/mysql-auto data dirs accumulate root-owned files as the live
# containers run (MySQL auto-generates SSL keypairs on first start, Redis
# writes its RDB snapshot) — the host user can't read these, and they're not
# needed on the receiving machine anyway: MySQL regenerates SSL files itself
# on next startup if missing, and losing the Redis RDB snapshot just means
# Redis starts with an empty cache. Excluding them avoids requiring sudo.
tar czf "$SCRIPT_DIR/atomp-bundle.tar.gz" -C "$SCRIPT_DIR" \
  --exclude="server-key.pem" \
  --exclude="server-cert.pem" \
  --exclude="ca-key.pem" \
  --exclude="ca.pem" \
  --exclude="client-key.pem" \
  --exclude="client-cert.pem" \
  --exclude="private_key.pem" \
  --exclude="public_key.pem" \
  --exclude="dump.rdb" \
  atomp-bundle/

log "Done!"
echo ""
log "Bundle:      $SCRIPT_DIR/atomp-bundle.tar.gz"
log "Bundle size: $(du -sh "$SCRIPT_DIR/atomp-bundle.tar.gz" | cut -f1)"
echo ""
hr
echo ""
echo "  To deploy on another machine:"
echo "    scp atomp-bundle.tar.gz user@host:~/"
echo "    ssh user@host 'tar xzf atomp-bundle.tar.gz && cd atomp-bundle && bash start_all.sh'"
echo ""
