#!/usr/bin/env bash
# stop_all.sh — Stop all ATOMP services
set -euo pipefail

log() { echo "[$(date +%H:%M:%S)] $*"; }

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
DF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/config/df"
if [[ -f "$DF_DIR/docker-compose.yaml" ]]; then
  docker compose -f "$DF_DIR/docker-compose.yaml" -p deploy_master down 2>/dev/null || true
fi

log "Stopping atomid stack..."
ATOMID_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/config/atomid"
if [[ -f "$ATOMID_DIR/docker-compose.yaml" ]]; then
  docker compose -f "$ATOMID_DIR/docker-compose.yaml" -p atomid_deployment down 2>/dev/null || true
fi

log "Done."
