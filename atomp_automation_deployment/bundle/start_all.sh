#!/bin/bash
# ATOMP Bundle — startup script
# Usage: bash start_all.sh [SERVER_IP]

set -e

BUNDLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() { echo "[$(date +%H:%M:%S)] $*"; }
hr()  { echo "────────────────────────────────────────────────────"; }

# ── Server IP ─────────────────────────────────────────────────────────────────
if [ -n "${1:-}" ]; then
  SERVER_IP="$1"
else
  DETECTED_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  echo ""
  echo "=== ATOMP Bundle Deployment ==="
  echo "Detected IP: $DETECTED_IP"
  read -r -p "Enter server IP [${DETECTED_IP}]: " INPUT_IP
  SERVER_IP="${INPUT_IP:-$DETECTED_IP}"
fi
log "Server IP: $SERVER_IP"

# ── Load images ────────────────────────────────────────────────────────────────
hr; log "Loading images (skips if already loaded)..."

load_image() {
  local name="$1"
  local file="$BUNDLE_DIR/images/$name.tar.gz"
  if [ ! -f "$file" ]; then
    log "  [SKIP] $name.tar.gz not found"
    return
  fi
  log "  [LOAD] $name"
  docker load < "$file"
}

for img in devicefarm atomid mysql-atomid mysql-df mysql-auto redis-atomid redis \
           rethinkdb nginx-alpine storage-web studio-client studio-web \
           tester40-client tester40-web tasker-web; do
  load_image "$img"
done

# ── Docker networks ────────────────────────────────────────────────────────────
hr; log "Creating docker networks..."

create_net() {
  local name="$1" subnet="$2" gw="$3"
  if ! docker network ls --format "{{.Name}}" | grep -q "^${name}$"; then
    docker network create --driver bridge --subnet "$subnet" --gateway "$gw" "$name"
    log "  Created $name"
  else
    log "  $name already exists"
  fi
}

create_net "atomp_automation_network" "172.22.0.0/24" "172.22.0.1"

# ── Render templates ───────────────────────────────────────────────────────────
hr; log "Rendering config templates..."

render() {
  local tmpl="$1" out="$2"
  sed "s/__SERVER_IP__/${SERVER_IP}/g" "$tmpl" > "$out"
  log "  Rendered $(basename "$out")"
}

render "$BUNDLE_DIR/config/atomid/appenv/server.json.tmpl" \
       "$BUNDLE_DIR/config/atomid/appenv/server.json"

render "$BUNDLE_DIR/config/df/config.sh.tmpl" \
       "$BUNDLE_DIR/config/df/config.sh"

render "$BUNDLE_DIR/config/df/docker-compose.yaml.tmpl" \
       "$BUNDLE_DIR/config/df/docker-compose.yaml"

render "$BUNDLE_DIR/config/router-nginx.conf" \
       "/tmp/atomp-router-nginx.conf"

# ── mysql-auto ────────────────────────────────────────────────────────────────
hr; log "Starting mysql-auto..."
mkdir -p "$BUNDLE_DIR/data/mysql_auto"

if docker ps --format "{{.Names}}" | grep -q "^mysql-auto$"; then
  log "  mysql-auto already running"
elif docker ps -a --format "{{.Names}}" | grep -q "^mysql-auto$"; then
  docker start mysql-auto
else
  docker run -d \
    --name mysql-auto \
    --network atomp_automation_network \
    -e MYSQL_ROOT_PASSWORD=asdwer321 \
    -v "$BUNDLE_DIR/data/mysql_auto":/var/lib/mysql \
    -p 3306:3306 \
    --restart unless-stopped \
    mysql:8.0.43 \
    --default-authentication-plugin=mysql_native_password
fi

# ── redis-auto ────────────────────────────────────────────────────────────────
hr; log "Starting redis-auto..."
if docker ps --format "{{.Names}}" | grep -q "^redis-auto$"; then
  log "  redis-auto already running"
elif docker ps -a --format "{{.Names}}" | grep -q "^redis-auto$"; then
  docker start redis-auto
else
  docker run -d \
    --name redis-auto \
    --network atomp_automation_network \
    -p 6379:6379 \
    --restart unless-stopped \
    redis:8.2.2
fi

log "Waiting 15s for MySQL to be ready..."
sleep 15

# ── ATOMID ────────────────────────────────────────────────────────────────────
hr; log "Starting ATOMID..."
mkdir -p "$BUNDLE_DIR/data/atomid/mysql" "$BUNDLE_DIR/data/atomid/uploads"

if docker ps --format "{{.Names}}" | grep -q "^atomid$"; then
  log "  ATOMID already running"
else
  ATOMID_CONFIG_DIR="$BUNDLE_DIR/config/atomid" \
  ATOMID_MYSQL_VOLUME="$BUNDLE_DIR/data/atomid/mysql" \
  ATOMID_UPLOADS_VOLUME="$BUNDLE_DIR/data/atomid/uploads" \
  DOCKER_NET_IP_ATOMID=10.20.0.2 \
  DOCKER_NET_IP_MYSQL=10.20.0.3 \
  DOCKER_NET_IP_REDIS=10.20.0.4 \
  docker compose -f "$BUNDLE_DIR/config/atomid/docker-compose.yaml" up --detach
  log "Waiting 20s for ATOMID to start..."
  sleep 20
fi

# ── Device Farm ───────────────────────────────────────────────────────────────
hr; log "Starting Device Farm..."
mkdir -p \
  "$BUNDLE_DIR/data/df/rethinkdb" \
  "$BUNDLE_DIR/data/df/redis" \
  "$BUNDLE_DIR/data/df/mysql" \
  "$BUNDLE_DIR/data/df/storage" \
  "$BUNDLE_DIR/data/df/storage-permanent"

(
  source "$BUNDLE_DIR/config/df/config.sh"
  # Override volume paths to use bundle-relative dirs
  export RETHINKDB_VOLUME="$BUNDLE_DIR/data/df/rethinkdb"
  export REDIS_VOLUME="$BUNDLE_DIR/data/df/redis"
  export MYSQL_VOLUME="$BUNDLE_DIR/data/df/mysql"
  export STORAGE_VOLUME="$BUNDLE_DIR/data/df/storage"
  export STORAGE_PERMANENT_VOLUME="$BUNDLE_DIR/data/df/storage-permanent"
  docker compose -f "$BUNDLE_DIR/config/df/docker-compose.yaml" \
    --project-name deploy_master \
    up --detach --no-recreate
)

log "Waiting 15s for Device Farm to start..."
sleep 15

# ── DF nginx ──────────────────────────────────────────────────────────────────
hr; log "Starting DF nginx (port 8180)..."
(
  source "$BUNDLE_DIR/config/df/config.sh"
  DF_GATEWAY_IP="172.21.0.1"
  mkdir -p "$BUNDLE_DIR/config/df/nginx"
  sed \
    -e "s/__DF_GATEWAY_IP__/${DF_GATEWAY_IP}/g" \
    -e "s/__DOMAIN__/${NGINX_DOMAIN}/g" \
    "$BUNDLE_DIR/config/df/nginx/nginx.template.conf" \
    > "$BUNDLE_DIR/config/df/nginx/nginx.conf"
  chmod 400 "$BUNDLE_DIR/config/df/nginx/nginx.conf"

  docker rm -f df-nginx 2>/dev/null || true
  docker run -d \
    --name df-nginx \
    --network=deploy_master_default \
    -v "$BUNDLE_DIR/config/df/nginx/nginx.conf":/etc/nginx/nginx.conf \
    -v "$BUNDLE_DIR/config/df/nginx":/config \
    -p 8180:80 \
    --restart on-failure:5 \
    nginx:stable-alpine
)

# ── App data directories ───────────────────────────────────────────────────────
hr; log "Creating app data directories..."
mkdir -p \
  "$BUNDLE_DIR/data/app/tester40/uploads" \
  "$BUNDLE_DIR/data/app/tester40/data" \
  "$BUNDLE_DIR/data/app/tester40/tmp" \
  "$BUNDLE_DIR/data/app/tasker/uploads" \
  "$BUNDLE_DIR/data/app/tasker/data" \
  "$BUNDLE_DIR/data/app/tasker/tmp" \
  "$BUNDLE_DIR/data/app/studio/tmp" \
  "$BUNDLE_DIR/data/app/storage/uploads"

# ── App services ───────────────────────────────────────────────────────────────
hr; log "Starting app services..."

ATOMID_URL="http://$SERVER_IP/atomid"
DEVICE_FARM_URL="http://$SERVER_IP:3700"
NGINX_URL="http://$SERVER_IP"
MYSQL_HOST="mysql-auto"
REDIS_HOST="redis-auto"

start_svc() {
  local name="$1"; shift
  if docker ps --format "{{.Names}}" | grep -q "^${name}$"; then
    log "  $name already running"
    return
  fi
  docker rm -f "$name" 2>/dev/null || true
  docker run -d --name "$name" "$@"
  log "  Started $name"
}

start_svc tester40-client \
  --network=atomp_automation_network \
  -p 34100:3000 \
  -e TESTER40_CLIENT_SERVER_URL="$NGINX_URL" \
  -e TESTER40_CLIENT_URL="$NGINX_URL/tester40" \
  -e TESTER40_CLIENT_LOGIN_REDIRECT_HOST="$NGINX_URL/tester40" \
  -e TESTER40_CLIENT_SOCKET_URL="$NGINX_URL" \
  -e TESTER40_CLIENT_ATOMID_URL="$ATOMID_URL" \
  -e TESTER40_CLIENT_STORAGE_API_HOST_FULL_PATH="$NGINX_URL/storage/upload" \
  -e TESTER40_CLIENT_PATH_PUBLIC_URL="/tester40/" \
  -e TESTER40_CLIENT_STUDIO_CLIENT_URL="$NGINX_URL/studio" \
  -e TESTER40_CLIENT_STUDIO_SERVER_URL="$NGINX_URL" \
  --memory=4g \
  tester40-client:node20

start_svc tester40-web \
  --network=atomp_automation_network \
  -p 33000:3000 -p 33030:3030 \
  -v "$BUNDLE_DIR/data/app/tester40/uploads":/usr/src/app/public/uploads \
  -v "$BUNDLE_DIR/data/app/tester40/data":/usr/src/app/data \
  -v "$BUNDLE_DIR/data/app/tester40/tmp":/usr/src/app/tmp \
  -e TESTER40_MSQL_HOST="$MYSQL_HOST" \
  -e TESTER40_MSQL_PORT=3306 \
  -e TESTER40_MSQL_DB_NAME=t4_dev_webserver \
  -e TESTER40_MSQL_USERNAME=root \
  -e TESTER40_MSQL_PASSWORD=asdwer321 \
  -e TESTER40_REDIS_HOST="$REDIS_HOST" \
  -e TESTER40_REDIS_PORT=6379 \
  -e TESTER40_DEVICEFARM_HOST="$DEVICE_FARM_URL" \
  -e TESTER40_DEVICEFARM_AUTHKEY="studio-web-1782885942" \
  -e TESTER40_TASKER_HOST="http://tasker-web:3000" \
  -e TESTER40_ATOMID_HOST="$ATOMID_URL" \
  -e TESTER40_PUBLIC_HOST="$NGINX_URL" \
  -e TESTER40_STUDIO_API_HOST="http://studio-web:3000" \
  -e TESTER40_STORAGE_API_HOST_FULL_PATH="http://storage-web:3000/storage" \
  -e TESTER40_ALLOW_STORAGE_HOST='[]' \
  -e TESTER40_GLOBAL_AGENT_OPTIONS='{"rejectUnauthorized":false}' \
  -e TESTER40_COOKIE_HTTP_ONLY=false \
  -e TESTER40_COOKIE_SECURE=false \
  -e TESTER40_COOKIE_SAME_SITE="" \
  -e TESTER40_SERVICE_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiVGVzdGVyNDAiLCJhbGxvd19zZXJ2aWNlIjpbIkRGIiwiVGFza2VyIiwiQVRPTUlEIiwiU3RvcmFnZSIsIlN0dWRpbyJdfSwiaWF0IjoxNTk2MDkyNTM1fQ.YmzjH_vl-oWdeeqB-L5U7XuqDkdcbmCF4zNZ6JonAy0AYwNitT1Huk9O0V79t6-YyULsJSlkcOadELWJl-S_UEjDWRDJg61DM59oe6qZfjVJfihpnVA_IYcQUsaze6CIVEu9IhXqhIinDFBfXCNjyYZiJiSM3_rnbXdAYVTnI0s" \
  --memory=2g \
  tester40-web:node20

start_svc tasker-web \
  --network=atomp_automation_network \
  -p 33100:3000 \
  -v "$BUNDLE_DIR/data/app/tasker/uploads":/usr/src/app/public/uploads \
  -v "$BUNDLE_DIR/data/app/tasker/data":/usr/src/app/data \
  -v "$BUNDLE_DIR/data/app/tasker/tmp":/usr/src/app/tmp \
  -e TASKER_MSQL_HOST="$MYSQL_HOST" \
  -e TASKER_MSQL_PORT=3306 \
  -e TASKER_MSQL_DB_NAME=t4_dev_tasker \
  -e TASKER_MSQL_USERNAME=root \
  -e TASKER_MSQL_PASSWORD=asdwer321 \
  -e TASKER_TESTER40_HOST="http://tester40-web:3000" \
  -e TASKER_DEVICEFARM_HOST="$DEVICE_FARM_URL" \
  -e TASKER_DEVICEFARM_AUTHKEY="studio-web-1782885942" \
  -e TASKER_APPIUM_PROTOCOL=http \
  -e TASKER_APPIUM_HOST="$SERVER_IP" \
  -e TASKER_APPIUM_PORT=4723 \
  -e TASKER_AI_HOST="http://localhost:1337" \
  -e TASKER_AI_PIPE_URL='[{"from":"","to":""}]' \
  -e TASKER_STORAGE_API_HOST_FULL_PATH="http://storage-web:3000/storage" \
  -e TASKER_GLOBAL_AGENT_OPTIONS='{"rejectUnauthorized":false}' \
  -e TASKER_SERVICE_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiVGFza2VyIiwiYWxsb3dfc2VydmljZSI6WyJUZXN0ZXI0MCIsIkFUT01JRCIsIlN0b3JhZ2UiXX0sImlhdCI6MTU5NjA5MTczM30.llG3I1zTuuhtFDcLt-vaU0cXJT5V38SYdJLKGfziKXpaEJU0QBvhYn_FLYQV4fDy2Nm9kj5ziHFV1TKQOWcq2wzwGxBg4JOi-ZrwBXzRoFGWEAWwPc8i4FnygO9M58lFtrAZHRkNa5L3Wdkt37iS1QYJPmGJiW61pOYAK6abgv8" \
  --memory=4g \
  tasker-web:node22

start_svc studio-web \
  --network=atomp_automation_network \
  -p 33300:3000 -p 33350:3030 \
  -v "$BUNDLE_DIR/data/app/studio/tmp":/usr/src/app/tmp \
  -e STUDIO_REDIS_HOST="$REDIS_HOST" \
  -e STUDIO_REDIS_PORT=6379 \
  -e STUDIO_ATOMID_HOST="$ATOMID_URL" \
  -e STUDIO_DEVICEFARM_HOST="$DEVICE_FARM_URL" \
  -e STUDIO_DEVICEFARM_AUTHKEY="studio-web-1782885942" \
  -e STUDIO_TESTER40_HOST="http://tester40-web:3000" \
  -e STUDIO_STORAGE_API_HOST_FULL_PATH="http://storage-web:3000/storage" \
  -e STUDIO_ALLOW_STORAGE_HOST='[]' \
  -e STUDIO_PUBLIC_HOST="$NGINX_URL/studio/tmp" \
  -e STUDIO_APPIUM_HOST="$SERVER_IP" \
  -e STUDIO_APPIUM_PORT=4723 \
  -e STUDIO_GLOBAL_AGENT_OPTIONS='{"rejectUnauthorized":false}' \
  -e STUDIO_AI_HOST="http://localhost:1337" \
  -e STUDIO_PIPE_URL='[{"from":"","to":""}]' \
  -e STUDIO_SERVICE_PUBLIC_KEY_PATH="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiU3R1ZGlvIiwiYWxsb3dfc2VydmljZSI6WyJERiIsIlRlc3RlcjQwIiwiQVRPTUlEIiwiU3RvcmFnZSJdfSwiaWF0IjoxNTk2MDkyNTM1fQ.Kq9LqOPiCxcACwDSAfe9Tl_BfdSGMS5tC0m6AJZsreqJpuJS3v2qob5OOcB-YOG7Ra295OCZve-yeQiLGAK0O6gIOxam3X7g9XtHnt8_EyxAVQ-hbwxwXQKpe2bRP3NT8BqIR8O0zaelg35dNOo4dAKOu7uIVOdgSbpz4px1Zb0" \
  --memory=2g \
  studio-web:node20

start_svc studio-client \
  --network=atomp_automation_network \
  -p 34200:3000 \
  -v "$BUNDLE_DIR/data/app/studio/tmp":/usr/src/app/public/tmp \
  -e STUDIO_CLIENT_DEVICEFARM_HOST="$DEVICE_FARM_URL" \
  -e STUDIO_CLIENT_SOCKET_ENDPOINT="ws://$SERVER_IP/studio/socket" \
  -e STUDIO_CLIENT_SERVER_HOST="$NGINX_URL" \
  -e STUDIO_CLIENT_PATH_PUBLIC_URL="/studio/" \
  --memory=4g \
  studio-client:node20

start_svc storage-web \
  --network=atomp_automation_network \
  -p 6800:3000 \
  -v "$BUNDLE_DIR/data/app/storage/uploads":/usr/src/app/uploads \
  -e STORAGE_MSQL_HOST="$MYSQL_HOST" \
  -e STORAGE_MSQL_PORT=3306 \
  -e STORAGE_MSQL_DB_NAME=sto_dev_webserver \
  -e STORAGE_MSQL_USERNAME=root \
  -e STORAGE_MSQL_PASSWORD=asdwer321 \
  -e STORAGE_BASE_DOMAIN="$NGINX_URL" \
  -e STORAGE_STORAGE_BASE_PATH="/storage/file" \
  -e STORAGE_ALLOWED_CORS='"*"' \
  -e STORAGE_MAX_FILE_SIZE=5000000000 \
  -e STORAGE_SERVICE_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiKiIsImFsbG93X3NlcnZpY2UiOlsiKiJdfSwiaWF0IjoxNTk2MDkxNzMzfQ.htXogVlyOzo5muVQEJIckwdEMiVZB4YV3_Ve9YhEMSyXUENkX7dhPvOKu1A-dYN70D_LwC0KL-4uHafZn7b3l7OT7Z2G6LaGzo8HSy6_P64B-EiXSq5eQC-xDC0QhJOP3AokWaFROkjwgCvct2-jjOXo_NBRFzw9HRrv-8FtX2c" \
  --memory=4g \
  storage-web:node20

# ── Host nginx ─────────────────────────────────────────────────────────────────
hr
echo ""
echo "=== Startup complete ==="
echo ""
echo "Host nginx config (rendered): /tmp/atomp-router-nginx.conf"
echo ""
echo "To activate:"
echo "  sudo cp /tmp/atomp-router-nginx.conf /etc/nginx/sites-available/atomp"
echo "  sudo ln -sf /etc/nginx/sites-available/atomp /etc/nginx/sites-enabled/atomp"
echo "  sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "Service URLs:"
echo "  AtomID:      http://$SERVER_IP/atomid/"
echo "  Device Farm: http://$SERVER_IP:8180/devicefarm/"
echo "  Tester40:    http://$SERVER_IP/tester40"
echo "  Studio:      http://$SERVER_IP/studio"
echo "  Storage:     http://$SERVER_IP/storage"
echo "  Tasker:      http://$SERVER_IP:33100 (API only)"
echo ""
echo "On first run — seed the ATOMID database:"
echo "  docker exec -i atomid-mysql mysql -u root -proot atomid < $BUNDLE_DIR/config/atomid/atomid.sql"
