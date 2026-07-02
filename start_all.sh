#!/bin/bash
# ATOMP Automation Platform — One-shot startup script
# Requirements: Docker, docker compose (v2), bash >= 4, nginx (optional)
# Usage: bash start_all.sh [SERVER_IP]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

###############################################
# 1. Determine server IP
###############################################
if [ -n "$1" ]; then
  SERVER_IP="$1"
else
  # Auto-detect first non-loopback IP
  DETECTED_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  echo ""
  echo "=== ATOMP Deployment Setup ==="
  echo "Detected server IP: $DETECTED_IP"
  read -r -p "Enter server IP [${DETECTED_IP}]: " INPUT_IP
  SERVER_IP="${INPUT_IP:-$DETECTED_IP}"
fi

echo ""
echo "[INFO] Using server IP: $SERVER_IP"

###############################################
# 2. Patch run_app.sh with the correct IP
###############################################
OLD_IP="192.168.105.102"
if grep -q "$OLD_IP" "$SCRIPT_DIR/run_app.sh"; then
  echo "[INFO] Patching run_app.sh: $OLD_IP -> $SERVER_IP"
  sed -i "s|$OLD_IP|$SERVER_IP|g" "$SCRIPT_DIR/run_app.sh"
fi

###############################################
# 3. Patch nginx config with the correct IP
###############################################
NGINX_CONF="$SCRIPT_DIR/nginx_atomp.conf"
if [ -f "$NGINX_CONF" ]; then
  if grep -q "$OLD_IP" "$NGINX_CONF"; then
    echo "[INFO] Patching nginx_atomp.conf: $OLD_IP -> $SERVER_IP"
    sed -i "s|$OLD_IP|$SERVER_IP|g" "$NGINX_CONF"
  fi
  echo ""
  echo "[INFO] To activate nginx config, run:"
  echo "  sudo cp $NGINX_CONF /etc/nginx/sites-available/atomp"
  echo "  sudo ln -sf /etc/nginx/sites-available/atomp /etc/nginx/sites-enabled/atomp"
  echo "  sudo nginx -t && sudo systemctl reload nginx"
fi

###############################################
# 4. Create docker network
###############################################
if ! docker network ls --format "{{.Name}}" | grep -q "^atomp_automation_network$"; then
  echo "[INFO] Creating docker network atomp_automation_network"
  docker network create atomp_automation_network
else
  echo "[INFO] Docker network atomp_automation_network already exists"
fi

###############################################
# 5. Start mysql-auto
###############################################
MYSQL_DATA_DIR="$SCRIPT_DIR/app_data/mysql_auto"
mkdir -p "$MYSQL_DATA_DIR"

if docker ps --format "{{.Names}}" | grep -q "^mysql-auto$"; then
  echo "[INFO] mysql-auto already running"
elif docker ps -a --format "{{.Names}}" | grep -q "^mysql-auto$"; then
  echo "[INFO] Starting existing mysql-auto container"
  docker start mysql-auto
else
  echo "[INFO] Creating mysql-auto container (pulling mysql:8.0 if needed)"
  docker run -d \
    --name mysql-auto \
    --network atomp_automation_network \
    -e MYSQL_ROOT_PASSWORD=asdwer321 \
    -v "$MYSQL_DATA_DIR":/var/lib/mysql \
    -p 3306:3306 \
    --restart unless-stopped \
    mysql:8.0 \
    --default-authentication-plugin=mysql_native_password
fi

###############################################
# 6. Start redis-auto
###############################################
if docker ps --format "{{.Names}}" | grep -q "^redis-auto$"; then
  echo "[INFO] redis-auto already running"
elif docker ps -a --format "{{.Names}}" | grep -q "^redis-auto$"; then
  echo "[INFO] Starting existing redis-auto container"
  docker start redis-auto
else
  echo "[INFO] Creating redis-auto container (pulling redis:7 if needed)"
  docker run -d \
    --name redis-auto \
    --network atomp_automation_network \
    -p 6379:6379 \
    --restart unless-stopped \
    redis:7
fi

echo "[INFO] Waiting 15s for MySQL to be ready..."
sleep 15

###############################################
# 7. Load and start ATOMID
###############################################
ATOMID_DIR="$SCRIPT_DIR/ATOMID_Deployment"
ATOMID_IMAGE="atomid/web:b-20260416-133008"

if ! docker image inspect "$ATOMID_IMAGE" &>/dev/null; then
  if [ -f "$ATOMID_DIR/atomid_web_b20260416.tar.gz" ]; then
    echo "[INFO] Loading ATOMID image..."
    docker load < "$ATOMID_DIR/atomid_web_b20260416.tar.gz"
  elif [ -f "$ATOMID_DIR/atomid_web.tar.gz" ]; then
    echo "[INFO] Loading ATOMID image from atomid_web.tar.gz..."
    docker load < "$ATOMID_DIR/atomid_web.tar.gz"
  else
    echo "[WARN] ATOMID image file not found, skipping ATOMID startup"
  fi
fi

if docker image inspect "$ATOMID_IMAGE" &>/dev/null; then
  if docker ps --format "{{.Names}}" | grep -q "^atomid$"; then
    echo "[INFO] ATOMID already running"
  else
    echo "[INFO] Starting ATOMID via docker compose..."
    mkdir -p "$ATOMID_DIR/mysql-volume"
    chmod a+rw "$ATOMID_DIR/mysql-volume"
    mkdir -p "$ATOMID_DIR/uploads"
    (
      cd "$ATOMID_DIR"
      export DOCKER_NET_IP_ATOMID=10.20.0.2
      export DOCKER_NET_IP_MYSQL=10.20.0.3
      export DOCKER_NET_IP_REDIS=10.20.0.4
      docker compose up --detach
    )
    echo "[INFO] Waiting 20s for ATOMID to start..."
    sleep 20
  fi
fi

###############################################
# 8. Create app_data directories
###############################################
echo "[INFO] Creating app_data directories..."
mkdir -p "$SCRIPT_DIR/app_data/tester40_webserver/uploads"
mkdir -p "$SCRIPT_DIR/app_data/tester40_webserver/data"
mkdir -p "$SCRIPT_DIR/app_data/tester40_webserver/tmp"
mkdir -p "$SCRIPT_DIR/app_data/tasker_webserver/uploads"
mkdir -p "$SCRIPT_DIR/app_data/tasker_webserver/data"
mkdir -p "$SCRIPT_DIR/app_data/tasker_webserver/tmp"
mkdir -p "$SCRIPT_DIR/app_data/studio_webserver/tmp"
mkdir -p "$SCRIPT_DIR/app_data/storage_webserver/uploads"

###############################################
# 9. Run the main service deployment script
###############################################
echo ""
echo "[INFO] Starting all ATOMP services via run_app.sh..."
bash "$SCRIPT_DIR/run_app.sh"

echo ""
echo "=== Startup complete ==="
echo "Access the platform at: http://$SERVER_IP/atomid/"
echo ""
echo "Service ports:"
echo "  tester40-web:    http://$SERVER_IP:33000"
echo "  tester40-client: http://$SERVER_IP:34100"
echo "  tasker-web:      http://$SERVER_IP:33100"
echo "  studio-web:      http://$SERVER_IP:33300"
echo "  studio-client:   http://$SERVER_IP:34200"
echo "  storage-web:     http://$SERVER_IP:6800"
echo "  ATOMID:          http://$SERVER_IP:8081"
echo ""
echo "Via nginx (after setup): http://$SERVER_IP/"
