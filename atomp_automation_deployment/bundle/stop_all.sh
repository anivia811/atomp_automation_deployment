#!/bin/bash
# ATOMP Bundle — shutdown script
# Usage: bash stop_all.sh

BUNDLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() { echo "[$(date +%H:%M:%S)] $*"; }

stop_container() {
  local name="$1"
  if docker ps --format "{{.Names}}" | grep -q "^${name}$"; then
    log "Stopping $name..."
    docker stop "$name"
  else
    log "$name is not running"
  fi
}

echo ""
echo "=== ATOMP Bundle Shutdown ==="

for svc in tester40-client tester40-web tasker-web studio-client studio-web storage-web; do
  stop_container "$svc"
done

stop_container "df-nginx"

if [ -f "$BUNDLE_DIR/config/df/docker-compose.yaml" ]; then
  log "Stopping Device Farm..."
  docker compose -f "$BUNDLE_DIR/config/df/docker-compose.yaml" \
    --project-name deploy_master down
fi

if [ -f "$BUNDLE_DIR/config/atomid/docker-compose.yaml" ]; then
  log "Stopping ATOMID..."
  ATOMID_CONFIG_DIR="$BUNDLE_DIR/config/atomid" \
  ATOMID_MYSQL_VOLUME="$BUNDLE_DIR/data/atomid/mysql" \
  ATOMID_UPLOADS_VOLUME="$BUNDLE_DIR/data/atomid/uploads" \
  DOCKER_NET_IP_ATOMID=10.20.0.2 \
  DOCKER_NET_IP_MYSQL=10.20.0.3 \
  DOCKER_NET_IP_REDIS=10.20.0.4 \
  docker compose -f "$BUNDLE_DIR/config/atomid/docker-compose.yaml" down
fi

stop_container "mysql-auto"
stop_container "redis-auto"

echo ""
echo "=== Shutdown complete ==="
docker ps -a --format "table {{.Names}}\t{{.Status}}" \
  | grep -E "NAME|tester40|tasker|studio|storage|atomid|mysql|redis|df-nginx|rethinkdb" || true
