#!/usr/bin/env bash
# start_all.sh — Start all ATOMP services on any Linux / WSL machine
# Usage: bash start_all.sh [SERVER_IP]
set -euo pipefail

# ─── Helpers ──────────────────────────────────────────────────────────────────
BUNDLE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
log()  { echo "[$(date +%H:%M:%S)] $*"; }
die()  { echo "ERROR: $*" >&2; exit 1; }
ok()   { echo "[$(date +%H:%M:%S)] ✓ $*"; }
warn() { echo "[$(date +%H:%M:%S)] WARN: $*"; }

hr()   { echo "────────────────────────────────────────────────────"; }

# ─── Checks ───────────────────────────────────────────────────────────────────
command -v docker >/dev/null || die "docker is not installed"
docker info >/dev/null 2>&1  || die "docker daemon is not running"

hr
echo "  ATOMP Portable Deployment — start_all.sh"
hr

# ─── 1. Server IP ─────────────────────────────────────────────────────────────
if [[ -n "${1:-}" ]]; then
  SERVER_IP="$1"
else
  DETECTED="$(hostname -I 2>/dev/null | awk '{print $1}')"
  echo ""
  log "Detected IP: $DETECTED"
  read -r -p "  Enter server IP [${DETECTED}]: " INPUT
  SERVER_IP="${INPUT:-$DETECTED}"
fi
[[ -n "$SERVER_IP" ]] || die "SERVER_IP is empty"
log "Using SERVER_IP=$SERVER_IP"
echo ""

# ─── 2. Load docker images ────────────────────────────────────────────────────
hr; log "Loading docker images (skip if already present)..."

load_image() {
  local name="$1"; local tag="$2"; local file="$BUNDLE/images/$name.tar.gz"
  if docker image inspect "$tag" >/dev/null 2>&1; then
    log "  [OK]   $tag already loaded"
    return
  fi
  [[ -f "$file" ]] || { warn "  [MISS] $file not found — skipping $tag"; return; }
  log "  [LOAD] $tag from $name.tar.gz ..."
  docker load < "$file"
  ok "$tag loaded"
}

load_image "devicefarm"      "devicefarm:b-20260710"
load_image "atomid"          "atomid/web:b-20260710"
load_image "mysql-atomid"    "mysql:8.0.34"
load_image "mysql-df"        "mysql:8.0.24"
load_image "mysql-auto"      "mysql:8.0.43"
load_image "redis-atomid"    "redis:8.6.1"
load_image "redis"           "redis:8.2.2"
load_image "rethinkdb"       "rethinkdb:latest"
load_image "nginx-alpine"    "nginx:stable-alpine"
load_image "storage-web"     "storage-web:node20"
load_image "studio-client"   "studio-client:node20"
load_image "studio-web"      "studio-web:node20"
load_image "tester40-client" "tester40-client:node20"
load_image "tester40-web"    "tester40-web:node20"
load_image "tasker-web"      "tasker-web:node22"

# ─── 3. Docker networks ───────────────────────────────────────────────────────
hr; log "Ensuring docker networks exist..."

ensure_network() {
  local name="$1"; local subnet="$2"; local gw="$3"
  if docker network ls --format '{{.Name}}' | grep -q "^${name}$"; then
    log "  [OK]   $name exists"
  else
    log "  [NEW]  $name ($subnet)"
    docker network create --driver bridge "$name" --subnet "$subnet" --gateway "$gw"
  fi
}

ensure_network "atomp_automation_network"  "172.23.0.0/16" "172.23.0.1"
# deploy_master's network is pinned via the "networks:" block in its own
# docker-compose.yaml — do NOT pre-create it here, Compose needs to own it.

# ─── 4. Atomid stack ─────────────────────────────────────────────────────────
hr; log "Starting atomid stack..."

ATOMID_CFG="$BUNDLE/config/atomid"
ATOMID_DATA="$BUNDLE/data/atomid"
mkdir -p "$ATOMID_DATA/mysql" "$ATOMID_DATA/uploads"

# Render server.json from template
if [[ -f "$ATOMID_CFG/appenv/server.json.tmpl" ]]; then
  sed "s/__SERVER_IP__/$SERVER_IP/g" "$ATOMID_CFG/appenv/server.json.tmpl" \
    > "$ATOMID_CFG/appenv/server.json"
  ok "server.json rendered"
fi

# Render the atomid frontend (its DeviceFarm/Tester40 links are baked into the
# compiled JS at build time — re-render the whole tree fresh so re-runs with a
# different SERVER_IP aren't stuck with a stale value).
if [[ -d "$ATOMID_CFG/appenv/public_fixed_tmpl" ]]; then
  rm -rf "$ATOMID_CFG/appenv/public_fixed"
  cp -r "$ATOMID_CFG/appenv/public_fixed_tmpl" "$ATOMID_CFG/appenv/public_fixed"
  grep -rl "__SERVER_IP__" "$ATOMID_CFG/appenv/public_fixed" 2>/dev/null | \
    while read -r f; do sed -i "s/__SERVER_IP__/$SERVER_IP/g" "$f"; done
  ok "atomid frontend rendered for $SERVER_IP"
fi

# Export paths for atomid docker-compose
export ATOMID_APPENV="$ATOMID_CFG/appenv"
export ATOMID_MYSQL_DATA="$ATOMID_DATA/mysql"
export ATOMID_UPLOADS="$ATOMID_DATA/uploads"
export ATOMID_SQL="$ATOMID_CFG/atomid.sql"

docker compose \
  -f "$ATOMID_CFG/docker-compose.yaml" \
  -p atomid_deployment \
  up -d --force-recreate atomid
docker compose \
  -f "$ATOMID_CFG/docker-compose.yaml" \
  -p atomid_deployment \
  up -d

ok "atomid stack started"

# ─── 5. Device Farm stack ─────────────────────────────────────────────────────
hr; log "Starting device farm stack..."

DF_CFG="$BUNDLE/config/df"
DF_DATA="$BUNDLE/data/df"
mkdir -p "$DF_DATA/rethinkdb" "$DF_DATA/redis" "$DF_DATA/mysql" \
         "$DF_DATA/storage"   "$DF_DATA/storage-permanent"

# Render config.sh from template
if [[ -f "$DF_CFG/config.sh.tmpl" ]]; then
  sed "s/__SERVER_IP__/$SERVER_IP/g" "$DF_CFG/config.sh.tmpl" > "$DF_CFG/config.sh"
  ok "df config.sh rendered"
fi

# Source config to get env vars, then override volume paths
# shellcheck disable=SC1091
source "$DF_CFG/config.sh"
export RETHINKDB_VOLUME="$DF_DATA/rethinkdb"
export REDIS_VOLUME="$DF_DATA/redis"
export MYSQL_VOLUME="$DF_DATA/mysql"
export STORAGE_VOLUME="$DF_DATA/storage"
export STORAGE_PERMANENT_VOLUME="$DF_DATA/storage-permanent"
# DEVICEFARM_IMAGE is already set correctly by sourcing config.sh above —
# do NOT hardcode/override it here, that's what caused it to silently drift
# to a stale tag before.

# Render DF docker-compose if it's a template
if [[ -f "$DF_CFG/docker-compose.yaml.tmpl" ]]; then
  sed "s/__SERVER_IP__/$SERVER_IP/g" "$DF_CFG/docker-compose.yaml.tmpl" \
    > "$DF_CFG/docker-compose.yaml"
fi

# A stale `deploy_master_default` network (e.g. plain-created by an older
# version of this script, or left over from a partial/failed prior run) has
# the wrong Compose ownership label and makes `docker compose up` warn/fail
# with "network ... was found but has incorrect label". Compose's own
# docker-compose.yaml (networks: block) is the source of truth for this
# network — if a non-Compose-owned one is sitting in its place and nothing
# is attached to it, drop it so Compose can (re)create it correctly.
if docker network inspect deploy_master_default >/dev/null 2>&1; then
  NET_LABEL="$(docker network inspect deploy_master_default \
    --format '{{ index .Labels "com.docker.compose.network" }}' 2>/dev/null || true)"
  if [[ "$NET_LABEL" != "default" ]]; then
    NET_CONTAINERS="$(docker network inspect deploy_master_default \
      --format '{{len .Containers}}' 2>/dev/null || echo 1)"
    if [[ "$NET_CONTAINERS" == "0" ]]; then
      warn "  deploy_master_default is a stale non-Compose network — removing so Compose can recreate it"
      docker network rm deploy_master_default
    else
      warn "  deploy_master_default has the wrong Compose label but has containers attached — leaving it as-is"
    fi
  fi
fi

docker compose \
  -f "$DF_CFG/docker-compose.yaml" \
  -p deploy_master \
  up -d --no-recreate

ok "device farm stack started (provider excluded — see README)"

# ─── 5b. Auto-provision a fresh Device Farm API access token ─────────────────
# The token studio-web/tester40-web/tasker-web use to call Device Farm's
# private API is validated by exact RethinkDB lookup (accessTokens.get(id)),
# never by decoding — so a token baked in at build time is only ever valid on
# the machine it was generated on. Generate a fresh one here, for whichever
# admin has already logged into Device Farm at least once (that first login
# is what creates their `users` row — this script can't fabricate that part).
hr; log "Provisioning a Device Farm API access token..."

TOKEN_GEN_JS='
const jwtutil = require("/app/lib/util/jwtutil");
const r = require("/app/node_modules/rethinkdb");
const util = require("util");
const uuid = require("/app/node_modules/uuid");
const TITLE = "atomp-automation-shared-token";
r.connect({host:"rethinkdb", port:28015, db:"atompdf"}).then(async conn => {
  const cursor = await r.table("users").filter({privilege: "admin"}).run(conn);
  const admins = await cursor.toArray();
  if (admins.length === 0) { console.log("NO_ADMIN_YET"); process.exit(0); }
  const email = admins[0].email, name = admins[0].name || email;
  await r.table("accessTokens").getAll(email, {index: "email"}).filter({title: TITLE}).delete().run(conn);
  const jwt = jwtutil.encode({payload: {email, name}, privateKeyPath: "/config/client-privatekey.pem"});
  const id = util.format("%s-%s", uuid.v4(), uuid.v4()).replace(/-/g, "");
  await r.table("accessTokens").insert({email, id, title: TITLE, jwt}).run(conn);
  console.log("TOKEN:" + id);
  process.exit(0);
}).catch(e => { console.error("ERR:", e.message); process.exit(1); });
'

DEVICE_FARM_AUTHKEY=""
for attempt in 1 2 3 4 5; do
  TOKEN_OUTPUT="$(docker exec app node -e "$TOKEN_GEN_JS" 2>&1)" && break
  sleep 2
done

if [[ "$TOKEN_OUTPUT" == *"TOKEN:"* ]]; then
  DEVICE_FARM_AUTHKEY="${TOKEN_OUTPUT##*TOKEN:}"
  ok "Device Farm access token provisioned"
elif [[ "$TOKEN_OUTPUT" == *"NO_ADMIN_YET"* ]]; then
  warn "  No Device Farm admin has logged in yet — studio/tester40/tasker will start without a valid API token."
  warn "  Log into Device Farm once (as an email listed in ADMINISTRATOR in config.sh), then re-run start_all.sh"
  warn "  to auto-provision the token and pick up working device lists in Studio/Tester40/Tasker."
else
  warn "  Could not auto-provision a Device Farm access token: $TOKEN_OUTPUT"
fi

# ─── 6. df-nginx ──────────────────────────────────────────────────────────────
hr; log "Starting df-nginx..."

# Detect the gateway IP of deploy_master_default network
DF_GW_IP="$(docker network inspect deploy_master_default \
  --format '{{range .IPAM.Config}}{{.Gateway}}{{end}}' 2>/dev/null || echo '172.21.0.1')"
log "  df network gateway: $DF_GW_IP"

# Generate nginx.conf from template
NGINX_CONF="$DF_CFG/nginx/nginx.conf"
rm -f "$NGINX_CONF"
sed \
  -e "s/__DF_GATEWAY_IP__/${DF_GW_IP}/g" \
  -e "s/__DOMAIN__/${SERVER_IP}/g" \
  "$DF_CFG/nginx/nginx.template.conf" \
  > "$NGINX_CONF"
chmod 400 "$NGINX_CONF"

docker rm -f df-nginx 2>/dev/null || true
docker run -d \
  --name df-nginx \
  --network deploy_master_default \
  -v "$NGINX_CONF:/etc/nginx/nginx.conf:ro" \
  -v "$DF_CFG/nginx:/config" \
  -p 8180:80 \
  --restart on-failure:5 \
  nginx:stable-alpine

ok "df-nginx started on :8180"

# ─── 7. mysql-auto + redis-auto ───────────────────────────────────────────────
hr; log "Starting shared MySQL and Redis (mysql-auto / redis-auto)..."

MYSQL_AUTO_DATA="$BUNDLE/data/mysql_auto"
mkdir -p "$MYSQL_AUTO_DATA"

start_container() {
  local name="$1"
  if docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
    log "  [OK]   $name already running"
  elif docker ps -a --format '{{.Names}}' | grep -q "^${name}$"; then
    log "  [START] $name (existing stopped container)"
    docker start "$name"
  else
    shift
    log "  [RUN]  $name"
    docker run -d "$@"
  fi
}

# Always recreate — used for app services with IP-dependent configs
recreate_container() {
  local name="$1"; shift
  docker rm -f "$name" 2>/dev/null || true
  log "  [RUN]  $name"
  docker run -d "$@"
}

start_container mysql-auto \
  --name mysql-auto \
  --network atomp_automation_network \
  -e MYSQL_ROOT_PASSWORD=asdwer321 \
  -e MYSQL_ROOT_HOST=% \
  -v "$MYSQL_AUTO_DATA:/var/lib/mysql" \
  --restart unless-stopped \
  mysql:8.0.43 \
  --default-authentication-plugin=mysql_native_password

start_container redis-auto \
  --name redis-auto \
  --network atomp_automation_network \
  --restart unless-stopped \
  redis:8.2.2

log "Waiting 20s for MySQL to initialise..."
sleep 20
ok "mysql-auto / redis-auto ready"

# Import app databases on first run (marker file prevents re-import)
MARKER="$BUNDLE/data/.db_imported"
if [[ ! -f "$MARKER" ]]; then
  log "First run — importing app databases..."
  if [[ -f "$BUNDLE/config/mysql-auto-db.sql.gz" ]]; then
    gunzip -c "$BUNDLE/config/mysql-auto-db.sql.gz" | \
      docker exec -i mysql-auto mysql -uroot -pasdwer321 2>/dev/null && \
      ok "mysql-auto databases imported" || warn "mysql-auto import failed"
  fi
  if [[ -f "$BUNDLE/config/atomid/atomid-db.sql.gz" ]]; then
    docker exec atomid-mysql mysql -u root -proot -e \
      "DROP DATABASE IF EXISTS atomid; CREATE DATABASE atomid;" 2>/dev/null
    gunzip -c "$BUNDLE/config/atomid/atomid-db.sql.gz" | \
      docker exec -i atomid-mysql mysql -u root -proot atomid 2>/dev/null && \
      ok "atomid database imported" || warn "atomid import failed"
  fi
  touch "$MARKER"
fi

# ─── 8. App services ──────────────────────────────────────────────────────────
hr; log "Starting app services (tester40, studio, storage, tasker)..."

APP_DATA="$BUNDLE/data/app"
mkdir -p \
  "$APP_DATA/tester40/uploads" "$APP_DATA/tester40/data" "$APP_DATA/tester40/tmp" \
  "$APP_DATA/tasker/uploads"   "$APP_DATA/tasker/data"   "$APP_DATA/tasker/tmp" \
  "$APP_DATA/studio/tmp" \
  "$APP_DATA/storage/uploads"

# Common flags for all app containers
ATOM_ID_URL="http://$SERVER_IP/atomid"
NGINX_SERVER_URL="http://$SERVER_IP"
STORAGE_PRIVATE="http://storage-web:3000"
TESTER40_PRIVATE="http://tester40-web:3000"
STUDIO_PRIVATE="http://studio-web:3000"
TASKER_PRIVATE="http://tasker-web:3000"
# DEVICE_FARM_AUTHKEY was auto-provisioned in step 5b above (empty if no
# Device Farm admin has logged in yet) — do NOT hardcode it here, that's
# exactly what made it dead-on-arrival on every machine but the one it was
# generated on.
DEVICE_FARM_API_URL="http://${SERVER_IP}:3700"

# ── atomp-ai (visual/OCR compare service) ──
# FastAPI/uvicorn app; the web apps reach it in-network as http://atomp-ai:1337
# (they run on atomp_automation_network, so "localhost" would be the web
# container itself, not this service). Uvicorn defaults to :8000, so the port
# is pinned to 1337 to match *_AI_HOST below. start_container (not recreate) so
# the heavy conda/torch model load isn't repeated on every redeploy.
if docker image inspect atomp-ai:latest >/dev/null 2>&1; then
  # Persist the Keras/torch model caches: on first boot the app downloads
  # VGG16 imagenet weights (~553MB) into /root/.keras; without a volume that
  # 553MB re-downloads on every container restart. Named volumes keep it.
  start_container atomp-ai \
    --name atomp-ai \
    --network atomp_automation_network \
    -p 1337:1337 \
    -v atomp_ai_keras:/root/.keras \
    -v atomp_ai_torch:/root/.cache/torch \
    --restart unless-stopped \
    atomp-ai:latest \
    python -m uvicorn app:app --host 0.0.0.0 --port 1337
else
  log "  [SKIP] atomp-ai:latest image not built — AI compare service will be unavailable"
fi

# ── tester40-web ──
recreate_container tester40-web \
  --name tester40-web \
  --network atomp_automation_network \
  --memory 2g \
  -p 33000:3000 -p 33030:3030 \
  -v "$APP_DATA/tester40/uploads:/usr/src/app/public/uploads" \
  -v "$APP_DATA/tester40/data:/usr/src/app/data" \
  -v "$APP_DATA/tester40/tmp:/usr/src/app/tmp" \
  -e TESTER40_MSQL_HOST=mysql-auto \
  -e TESTER40_MSQL_PORT=3306 \
  -e TESTER40_MSQL_USERNAME=root \
  -e TESTER40_MSQL_PASSWORD=asdwer321 \
  -e TESTER40_MSQL_DB_NAME=t4_dev_webserver \
  -e TESTER40_REDIS_HOST=redis-auto \
  -e TESTER40_REDIS_PORT=6379 \
  -e TESTER40_ATOMID_HOST="$ATOM_ID_URL" \
  -e TESTER40_PUBLIC_HOST="$NGINX_SERVER_URL" \
  -e TESTER40_STORAGE_API_HOST_FULL_PATH="$STORAGE_PRIVATE/storage" \
  -e TESTER40_STORAGE_API_HOST_INTERNAL_PATH="$STORAGE_PRIVATE" \
  -e TESTER40_TASKER_HOST="$TASKER_PRIVATE" \
  -e TESTER40_STUDIO_API_HOST="$STUDIO_PRIVATE" \
  -e TESTER40_DEVICEFARM_HOST="$DEVICE_FARM_API_URL" \
  -e TESTER40_DEVICEFARM_AUTHKEY="$DEVICE_FARM_AUTHKEY" \
  -e TESTER40_AI_HOST="http://atomp-ai:1337" \
  -e TESTER40_SELENIUM_GRID_HOST="http://${SERVER_IP}:4444" \
  -e TESTER40_ALLOW_STORAGE_HOST="[]" \
  -e TESTER40_PIPE_URLS='[{"from":"","to":""}]' \
  -e TESTER40_GLOBAL_AGENT_OPTIONS='{"rejectUnauthorized":false}' \
  -e TESTER40_COOKIE_HTTP_ONLY=false \
  -e TESTER40_COOKIE_SECURE=false \
  -e TESTER40_COOKIE_SAME_SITE= \
  -e TESTER40_INTERNAL_PORT=3000 \
  -e TESTER40_INTERNAL_SOCKET_PORT=3030 \
  -e TESTER40_SERVICE_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiVGVzdGVyNDAiLCJhbGxvd19zZXJ2aWNlIjpbIkRGIiwiVGFza2VyIiwiQVRPTUlEIiwiU3RvcmFnZSIsIlN0dWRpbyJdfSwiaWF0IjoxNTk2MDkyNTM1fQ.YmzjH_vl-oWdeeqB-L5U7XuqDkdcbmCF4zNZ6JonAy0AYwNitT1Huk9O0V79t6-YyULsJSlkcOadELWJl-S_UEjDWRDJg61DM59oe6qZfjVJfihpnVA_IYcQUsaze6CIVEu9IhXqhIinDFBfXCNjyYZiJiSM3_rnbXdAYVTnI0s" \
  -e NODE_ENV=production \
  --restart unless-stopped \
  tester40-web:node20

# ── tester40-client ──
recreate_container tester40-client \
  --name tester40-client \
  --network atomp_automation_network \
  --memory 4g \
  -p 34100:3000 \
  -e TESTER40_CLIENT_SERVER_URL="$NGINX_SERVER_URL" \
  -e TESTER40_CLIENT_URL="$NGINX_SERVER_URL/tester40" \
  -e TESTER40_CLIENT_LOGIN_REDIRECT_HOST="$NGINX_SERVER_URL/tester40" \
  -e TESTER40_CLIENT_SOCKET_URL="$NGINX_SERVER_URL" \
  -e TESTER40_CLIENT_ATOMID_URL="$ATOM_ID_URL" \
  -e TESTER40_CLIENT_STORAGE_API_HOST_FULL_PATH="$NGINX_SERVER_URL/storage/upload" \
  -e TESTER40_CLIENT_PATH_PUBLIC_URL=/tester40/ \
  -e TESTER40_CLIENT_STUDIO_CLIENT_URL="$NGINX_SERVER_URL/studio" \
  -e TESTER40_CLIENT_STUDIO_SERVER_URL="$NGINX_SERVER_URL" \
  -e NODE_OPTIONS=--openssl-legacy-provider \
  --restart unless-stopped \
  tester40-client:node20

# ── tasker-web ──
recreate_container tasker-web \
  --name tasker-web \
  --network atomp_automation_network \
  --memory 4g \
  -p 33100:3000 \
  -v "$APP_DATA/tasker/uploads:/usr/src/app/public/uploads" \
  -v "$APP_DATA/tasker/data:/usr/src/app/data" \
  -v "$APP_DATA/tasker/tmp:/usr/src/app/tmp" \
  -e TASKER_MSQL_HOST=mysql-auto \
  -e TASKER_MSQL_PORT=3306 \
  -e TASKER_MSQL_USERNAME=root \
  -e TASKER_MSQL_PASSWORD=asdwer321 \
  -e TASKER_MSQL_DB_NAME=t4_dev_tasker \
  -e TASKER_TESTER40_HOST="$TESTER40_PRIVATE" \
  -e TASKER_STORAGE_API_HOST_FULL_PATH="$STORAGE_PRIVATE/storage" \
  -e TASKER_STORAGE_API_HOST_INTERNAL_PATH="$STORAGE_PRIVATE/storage" \
  -e TASKER_DEVICEFARM_HOST="$DEVICE_FARM_API_URL" \
  -e TASKER_DEVICEFARM_AUTHKEY="$DEVICE_FARM_AUTHKEY" \
  -e TASKER_AI_HOST="http://atomp-ai:1337" \
  -e TASKER_AI_PIPE_URL='[{"from":"","to":""}]' \
  -e TASKER_GLOBAL_AGENT_OPTIONS='{"rejectUnauthorized":false}' \
  -e TASKER_APPIUM_PROTOCOL=http \
  -e TASKER_APPIUM_HOST="$SERVER_IP" \
  -e TASKER_APPIUM_PORT=4723 \
  -e TASKER_APPIUM_PROXY_PATH_PATTERN="" \
  -e TASKER_APPIUM_PROXY_LINUX_PATH_PATTERN="" \
  -e TASKER_APPIUM_PROXY_HOST="" \
  -e TASKER_SELENIUM_HOST="http://${SERVER_IP}:4444" \
  -e TASKER_INTERNAL_PORT=3000 \
  -e TASKER_SERVICE_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiVGFza2VyIiwiYWxsb3dfc2VydmljZSI6WyJUZXN0ZXI0MCIsIkFUT01JRCIsIlN0b3JhZ2UiXX0sImlhdCI6MTU5NjA5MTczM30.llG3I1zTuuhtFDcLt-vaU0cXJT5V38SYdJLKGfziKXpaEJU0QBvhYn_FLYQV4fDy2Nm9kj5ziHFV1TKQOWcq2wzwGxBg4JOi-ZrwBXzRoFGWEAWwPc8i4FnygO9M58lFtrAZHRkNa5L3Wdkt37iS1QYJPmGJiW61pOYAK6abgv8" \
  -e NODE_ENV=production \
  --restart unless-stopped \
  tasker-web:node22

# ── studio-web ──
recreate_container studio-web \
  --name studio-web \
  --network atomp_automation_network \
  --memory 2g \
  -p 33300:3000 -p 33350:3030 \
  -v "$APP_DATA/studio/tmp:/usr/src/app/tmp" \
  -e STUDIO_REDIS_HOST=redis-auto \
  -e STUDIO_REDIS_PORT=6379 \
  -e STUDIO_ATOMID_HOST="$ATOM_ID_URL" \
  -e STUDIO_PUBLIC_HOST="$NGINX_SERVER_URL/studio/tmp" \
  -e STUDIO_TESTER40_HOST="$TESTER40_PRIVATE" \
  -e STUDIO_STORAGE_API_HOST_FULL_PATH="$STORAGE_PRIVATE/storage" \
  -e STUDIO_DEVICEFARM_HOST="$DEVICE_FARM_API_URL" \
  -e STUDIO_DEVICEFARM_AUTHKEY="$DEVICE_FARM_AUTHKEY" \
  -e STUDIO_AI_HOST="http://atomp-ai:1337" \
  -e STUDIO_PIPE_URL='[{"from":"","to":""}]' \
  -e STUDIO_GLOBAL_AGENT_OPTIONS='{"rejectUnauthorized":false}' \
  -e STUDIO_ALLOW_STORAGE_HOST="[]" \
  -e STUDIO_APPIUM_HOST="$SERVER_IP" \
  -e STUDIO_APPIUM_PORT=4723 \
  -e STUDIO_APPIUM_PROXY_HOST="" \
  -e STUDIO_APPIUM_PROXY_PORT=0 \
  -e STUDIO_APPIUM_PROXY_PATH_PATTERN="" \
  -e STUDIO_APPIUM_PROXY_LINUX_PATH_PATTERN="" \
  -e STUDIO_COOKIE_HTTP_ONLY=false \
  -e STUDIO_COOKIE_SECURE=false \
  -e STUDIO_COOKIE_SAME_SITE= \
  -e STUDIO_INTERNAL_PORT=3000 \
  -e STUDIO_INTERNAL_SOCKET_PORT=3030 \
  -e STUDIO_SERVICE_PUBLIC_KEY_PATH="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiU3R1ZGlvIiwiYWxsb3dfc2VydmljZSI6WyJERiIsIlRlc3RlcjQwIiwiQVRPTUlEIiwiU3RvcmFnZSJdfSwiaWF0IjoxNTk2MDkyNTM1fQ.Kq9LqOPiCxcACwDSAfe9Tl_BfdSGMS5tC0m6AJZsreqJpuJS3v2qob5OOcB-YOG7Ra295OCZve-yeQiLGAK0O6gIOxam3X7g9XtHnt8_EyxAVQ-hbwxwXQKpe2bRP3NT8BqIR8O0zaelg35dNOo4dAKOu7uIVOdgSbpz4px1Zb0" \
  -e NODE_ENV=production \
  --restart unless-stopped \
  studio-web:node20

# ── studio-client ──
recreate_container studio-client \
  --name studio-client \
  --network atomp_automation_network \
  --memory 4g \
  -p 34200:3000 \
  -e STUDIO_CLIENT_SERVER_HOST="$NGINX_SERVER_URL" \
  -e STUDIO_CLIENT_SOCKET_ENDPOINT="ws://${SERVER_IP}/studio/socket" \
  -e STUDIO_CLIENT_PATH_PUBLIC_URL=/studio/ \
  -e STUDIO_CLIENT_DEVICEFARM_HOST="$DEVICE_FARM_API_URL" \
  -e STUDIO_CLIENT_ALLOW_REDIRECTION_SITES="*" \
  -e CI=false \
  -e DISABLE_ESLINT_PLUGIN=true \
  --restart unless-stopped \
  studio-client:node20

# ── storage-web ──
recreate_container storage-web \
  --name storage-web \
  --network atomp_automation_network \
  --memory 4g \
  -p 6800:3000 \
  -v "$APP_DATA/storage/uploads:/usr/src/app/uploads" \
  -e STORAGE_MSQL_HOST=mysql-auto \
  -e STORAGE_MSQL_PORT=3306 \
  -e STORAGE_MSQL_USERNAME=root \
  -e STORAGE_MSQL_PASSWORD=asdwer321 \
  -e STORAGE_MSQL_DB_NAME=sto_dev_webserver \
  -e STORAGE_BASE_DOMAIN="$NGINX_SERVER_URL" \
  -e STORAGE_STORAGE_BASE_PATH=/storage/file \
  -e STORAGE_STORAGE_PATH=/usr/src/app/uploads \
  -e STORAGE_MAX_FILE_SIZE=5000000000 \
  -e STORAGE_ALLOWED_CORS='"*"' \
  -e STORAGE_SERVICE_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiKiIsImFsbG93X3NlcnZpY2UiOlsiKiJdfSwiaWF0IjoxNTk2MDkxNzMzfQ.htXogVlyOzo5muVQEJIckwdEMiVZB4YV3_Ve9YhEMSyXUENkX7dhPvOKu1A-dYN70D_LwC0KL-4uHafZn7b3l7OT7Z2G6LaGzo8HSy6_P64B-EiXSq5eQC-xDC0QhJOP3AokWaFROkjwgCvct2-jjOXo_NBRFzw9HRrv-8FtX2c" \
  -e STORAGE_INTERNAL_PORT=3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  storage-web:node20

ok "All app services started"

# ─── 9. Host router (dockerized nginx on port 80) ────────────────────────────
hr; log "Starting host router nginx (port 80, no host nginx install needed)..."

ROUTER_CONF="$BUNDLE/config/router-nginx.conf"
if [[ -f "$BUNDLE/config/router-nginx.conf.tmpl" ]]; then
  sed "s/__SERVER_IP__/$SERVER_IP/g" "$BUNDLE/config/router-nginx.conf.tmpl" > "$ROUTER_CONF"
fi

docker rm -f host-router 2>/dev/null || true
docker create \
  --name host-router \
  --network atomp_automation_network \
  -p 80:80 \
  -v "$ROUTER_CONF:/etc/nginx/nginx.conf:ro" \
  --restart unless-stopped \
  nginx:stable-alpine

# Connect all networks before starting so nginx can resolve all upstreams at boot
docker network connect deploy_master_default   host-router
docker network connect atomid_deployment_atomid host-router
docker start host-router

ok "host-router started on :80"

# ─── Done ─────────────────────────────────────────────────────────────────────
hr
echo ""
echo "  ATOMP services are up at http://$SERVER_IP"
if [ -f "$BUNDLE/start_appium.sh" ] && [ -d "$BUNDLE/appium" ]; then
  hr; log "Starting Appium (Android automation, port 4723)..."
  bash "$BUNDLE/start_appium.sh" || warn "Appium failed to start — see start_appium.sh requirements (adb, ANDROID_HOME)"
fi

echo ""
echo "  Atomid:          http://$SERVER_IP/atomid/"
echo "  Device Farm:     http://$SERVER_IP:8180/devicefarm/"
echo "  Tester40:        http://$SERVER_IP/tester40"
echo "  Studio:          http://$SERVER_IP/studio"
echo "  Storage:         http://$SERVER_IP/storage"
echo ""
echo "  Direct ports (no nginx):"
echo "    atomid:          :8081    tester40-web:  :33000"
echo "    tester40-client: :34100   tasker-web:    :33100"
echo "    studio-web:      :33300   studio-client: :34200"
echo "    storage-web:     :6800    device farm:   :8180"
echo ""
echo "  Provider (USB devices): see README — must be run manually with --privileged."
echo ""
hr
