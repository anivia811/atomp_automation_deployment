#!/usr/bin/env bash
# start_all.sh — single entrypoint: rebuild every buildable image from
# current source, refresh the bundle, and start the full ATOMP stack.
#
# Usage: bash start_all.sh [SERVER_IP]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BUNDLE="$SCRIPT_DIR/atomp-bundle"

log()  { echo "[$(date +%H:%M:%S)] $*"; }
die()  { echo "ERROR: $*" >&2; exit 1; }
hr()   { echo "────────────────────────────────────────────────────"; }

command -v docker >/dev/null || die "docker not found"
docker info >/dev/null 2>&1  || die "docker daemon not running"

hr; log "1/4  Building Node app images (tester40-web/client, tasker-web, studio-web/client, storage-web)"
bash "$SCRIPT_DIR/build_all.sh"

# save_image() in build_bundle.sh only re-saves when the *tag* it was saved
# from changes — these 6 images keep static tags across rebuilds, so without
# clearing their old archive+ref here the bundle would silently keep shipping
# yesterday's image bytes even though the local docker daemon has the new one.
for n in tester40-web tester40-client tasker-web studio-web studio-client storage-web; do
  rm -f "$BUNDLE/images/$n.tar.gz" "$BUNDLE/images/$n.ref"
done

hr; log "2/4  Building atomid from atom-id-web"
ATOMID_SRC="$ROOT_DIR/atom-id-web"
# atom-id (no -web suffix) is the Angular client only — it has no /api routes
# at all. Building from it instead of atom-id-web produces a container that
# 404s on every request and looks like a "connection error" on login.
[ -d "$ATOMID_SRC" ] || die "atom-id-web not found at $ATOMID_SRC — this must be the ATOMID BACKEND repo, not atom-id (the frontend-only client)"
ATOMID_TAG="atomid/web:b-$(date +%Y%m%d)"
docker build -t "$ATOMID_TAG" "$ATOMID_SRC"
log "  built $ATOMID_TAG"

log "  syncing the new tag into build_bundle.sh, bundle/start_all.sh, and compose configs"
for f in "$SCRIPT_DIR/build_bundle.sh" "$SCRIPT_DIR/bundle/start_all.sh" \
         "$SCRIPT_DIR/ATOMID_Deployment/docker-compose.yaml" \
         "$SCRIPT_DIR/bundle/config/atomid/docker-compose.yaml"; do
  sed -i -E "s|atomid/web:b-[0-9]{8}|$ATOMID_TAG|g" "$f"
done

hr; log "3/4  devicefarm — no rebuild path exists yet"
# atom-device-farm's package.json now requires Node >=24 (OSS-upgrade commit),
# but the only working build (df-base:2026feb12) has Node 8, and the source
# tree is missing the offline node_modules the Dockerfile expects. Until one
# of those is fixed, we just reuse whatever devicefarm image is already local.
if ! docker image inspect devicefarm:b-20260703 >/dev/null 2>&1; then
  die "devicefarm:b-20260703 not found locally — restore it (see KNOWN_IMAGE_PATCHES.md) before continuing"
fi
log "  reusing existing devicefarm:b-20260703"

hr; log "4/4  Refreshing the bundle and starting the stack"
bash "$SCRIPT_DIR/build_bundle.sh"
bash "$BUNDLE/start_all.sh" "${1:-}"
