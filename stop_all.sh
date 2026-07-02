#!/bin/bash
# ATOMP Automation Platform — One-shot shutdown script
# Stops all services started by start_all.sh
# Usage: bash stop_all.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

stop_container() {
  local name="$1"
  if docker ps --format "{{.Names}}" | grep -q "^${name}$"; then
    echo "[INFO] Stopping $name..."
    docker stop "$name"
  else
    echo "[INFO] $name is not running, skipping"
  fi
}

echo ""
echo "=== ATOMP Shutdown ==="

###############################################
# 1. Stop app service containers
###############################################
APP_CONTAINERS=(
  tester40-client
  tester40-web
  tasker-web
  studio-client
  studio-web
  storage-web
  appium-web
  testman-client
  testman-web
)

echo ""
echo "[INFO] Stopping app service containers..."
for name in "${APP_CONTAINERS[@]}"; do
  stop_container "$name"
done

###############################################
# 2. Stop ATOMID via docker compose
###############################################
ATOMID_DIR="$SCRIPT_DIR/ATOMID_Deployment"
if [ -f "$ATOMID_DIR/docker-compose.yaml" ] || [ -f "$ATOMID_DIR/docker-compose.yml" ]; then
  echo ""
  echo "[INFO] Stopping ATOMID stack via docker compose..."
  (
    cd "$ATOMID_DIR"
    export DOCKER_NET_IP_ATOMID=10.20.0.2
    export DOCKER_NET_IP_MYSQL=10.20.0.3
    export DOCKER_NET_IP_REDIS=10.20.0.4
    docker compose down
  )
else
  echo "[WARN] ATOMID_Deployment/docker-compose.yaml not found, skipping ATOMID compose down"
fi

###############################################
# 3. Stop device farm via docker compose
###############################################
DEVICE_FARM_DIR="$SCRIPT_DIR/../atom-device-farm"
if [ -f "$DEVICE_FARM_DIR/docker-compose.yml" ] || [ -f "$DEVICE_FARM_DIR/docker-compose.yaml" ]; then
  echo ""
  echo "[INFO] Stopping device farm stack via docker compose..."
  (
    cd "$DEVICE_FARM_DIR"
    docker compose down
  )
else
  echo "[WARN] atom-device-farm/docker-compose.yml not found, skipping device farm compose down"
fi

###############################################
# 4. Stop infrastructure containers
###############################################
echo ""
echo "[INFO] Stopping infrastructure containers..."
stop_container "mysql-auto"
stop_container "redis-auto"

echo ""
echo "=== Shutdown complete ==="
echo ""
docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep -E "NAME|tester40|tasker|studio|storage|appium|testman|atomid|mysql-auto|redis-auto" || true
