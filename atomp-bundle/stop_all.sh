#!/usr/bin/env bash
# stop_all.sh — Stop all ATOMP services
set -euo pipefail

BUNDLE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
log()  { echo "[$(date +%H:%M:%S)] $*"; }

log "Stopping Appium..."
pkill -f "packages/appium/index.js" 2>/dev/null && log "  appium stopped" || log "  appium not running"

log "Stopping host router..."
docker rm -f host-router 2>/dev/null || true

log "Stopping app services..."
for c in tester40-client tester40-web tasker-web studio-client studio-web storage-web; do
  docker rm -f "$c" 2>/dev/null && log "  stopped $c" || true
done

log "Stopping mysql-auto / redis-auto..."
docker rm -f mysql-auto redis-auto 2>/dev/null || true

log "Stopping df-nginx..."
docker rm -f df-nginx 2>/dev/null || true

log "Stopping device farm stack..."
DF_DIR="$BUNDLE/config/df"
if [[ -f "$DF_DIR/docker-compose.yaml" ]]; then
  # docker compose validates every ${VAR} in the file even for `down` — without
  # these exported it fails with "invalid spec: empty section between colons"
  # and silently no-ops behind the `|| true` below, leaving containers running.
  # shellcheck disable=SC1091
  [[ -f "$DF_DIR/config.sh" ]] && source "$DF_DIR/config.sh"
  export RETHINKDB_VOLUME="$BUNDLE/data/df/rethinkdb"
  export REDIS_VOLUME="$BUNDLE/data/df/redis"
  export MYSQL_VOLUME="$BUNDLE/data/df/mysql"
  export STORAGE_VOLUME="$BUNDLE/data/df/storage"
  export STORAGE_PERMANENT_VOLUME="$BUNDLE/data/df/storage-permanent"
  docker compose -f "$DF_DIR/docker-compose.yaml" -p deploy_master down 2>/dev/null || true
fi

log "Stopping atomid stack..."
ATOMID_DIR="$BUNDLE/config/atomid"
if [[ -f "$ATOMID_DIR/docker-compose.yaml" ]]; then
  export ATOMID_APPENV="$ATOMID_DIR/appenv"
  export ATOMID_MYSQL_DATA="$BUNDLE/data/atomid/mysql"
  export ATOMID_UPLOADS="$BUNDLE/data/atomid/uploads"
  export ATOMID_SQL="$ATOMID_DIR/atomid.sql"
  docker compose -f "$ATOMID_DIR/docker-compose.yaml" -p atomid_deployment down 2>/dev/null || true
fi

log "Done."
