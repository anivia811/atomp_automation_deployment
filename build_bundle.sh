#!/usr/bin/env bash
# build_bundle.sh — Stage all ATOMP services into ./atomp-bundle/ (images,
# configs, Appium source, start/stop scripts). This is the fast, local-run
# path used by start_all.sh on every invocation — it does NOT create the
# portable atomp-bundle.tar.gz archive.
#
# To produce a tar.gz for shipping to another machine, run pack_bundle.sh
# separately after this (or after start_all.sh) — packing is slow (has to
# read the multi-GB data/ dir) and previously ran on every start_all.sh call
# for no reason, so it's now a separate, opt-in step.
#
# Usage:  bash build_bundle.sh [--skip-images]
#
# --skip-images  Skips docker save steps (fast re-run when only configs changed)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUNDLE="$SCRIPT_DIR/atomp-bundle"
SKIP_IMAGES=false
[[ "${1:-}" == "--skip-images" ]] && SKIP_IMAGES=true

log()  { echo "[$(date +%H:%M:%S)] $*"; }
ok()   { echo "[$(date +%H:%M:%S)] OK  $*"; }
die()  { echo "ERROR: $*" >&2; exit 1; }
hr()   { echo "────────────────────────────────────────────────────"; }

command -v docker >/dev/null || die "docker not found"
docker info >/dev/null 2>&1  || die "docker daemon not running"

hr
log " ATOMP Bundle Builder"
log " Output: $BUNDLE/"
hr
echo ""

# ─── Directory skeleton ────────────────────────────────────────────────────────
mkdir -p \
  "$BUNDLE/images" \
  "$BUNDLE/config/atomid/appenv" \
  "$BUNDLE/config/df/kconfig" \
  "$BUNDLE/config/df/nginx" \
  "$BUNDLE/data/atomid/mysql" \
  "$BUNDLE/data/atomid/uploads" \
  "$BUNDLE/data/df/rethinkdb" \
  "$BUNDLE/data/df/redis" \
  "$BUNDLE/data/df/mysql" \
  "$BUNDLE/data/df/storage" \
  "$BUNDLE/data/df/storage-permanent" \
  "$BUNDLE/data/app/tester40/uploads" \
  "$BUNDLE/data/app/tester40/data" \
  "$BUNDLE/data/app/tester40/tmp" \
  "$BUNDLE/data/app/tasker/uploads" \
  "$BUNDLE/data/app/tasker/data" \
  "$BUNDLE/data/app/tasker/tmp" \
  "$BUNDLE/data/app/studio/tmp" \
  "$BUNDLE/data/app/storage/uploads" \
  "$BUNDLE/data/mysql_auto"

# ─── Save docker images ────────────────────────────────────────────────────────
save_image() {
  local name="$1"; local ref="$2"
  local out="$BUNDLE/images/$name.tar.gz"
  local reffile="$BUNDLE/images/$name.ref"
  if $SKIP_IMAGES; then
    log "  [SKIP] $name (--skip-images)"
    return
  fi
  # Re-save if the archive is missing OR the ref it was saved from has changed
  # (e.g. you bumped a date-stamped tag like devicefarm:b-YYYYMMDD after a
  # rebuild) — comparing only file existence let stale image bytes silently
  # ship in the bundle even after the tag was updated in this script.
  if [[ -f "$out" && "$(cat "$reffile" 2>/dev/null)" == "$ref" ]]; then
    log "  [SKIP] $name already exists ($(du -sh "$out" | cut -f1))"
    return
  fi
  log "  [SAVE] $name  ← $ref"
  docker save "$ref" | gzip -1 > "$out"
  echo "$ref" > "$reffile"
  log "         → $(du -sh "$out" | cut -f1)"
}

log "Saving images..."
# Patched devicefarm image (2026-07-03) — committed from running containers, has:
#   - redis NX null fix, socket.io v4 namespace fix, session cookie Secure-outside-dev
#   - loadUser(data.data.email) JWT fix + company_id=-1 device visibility fix
#   - vendor/STFService, vendor/appium, etc. (real device + Appium support, was missing)
#   - statistical/report Angular app build
# Used for ALL device farm services (app, api, websocket, processor, provider, provider-android, etc.)
save_image "devicefarm"      "devicefarm:b-20260709"
# Base atomid image. The OTP algorithm fix (users.controller.js) and the frontend
# redirect-loop/cookie fix (public_fixed/) are shipped as separate bind-mounted
# files below, not baked into this image — see config/atomid/appenv/.
save_image "atomid"          "atomid/web:b-20260708"
save_image "mysql-atomid"    "mysql:8.0.34"
save_image "mysql-df"        "mysql:8.0.24"
save_image "mysql-auto"      "mysql:8.0.43"
save_image "redis-atomid"    "redis:8.6.1"
save_image "redis"           "redis:8.2.2"
save_image "rethinkdb"       "rethinkdb:latest"
save_image "nginx-alpine"    "nginx:stable-alpine"
save_image "storage-web"     "storage-web:node20"
save_image "studio-client"   "studio-client:node20"
save_image "studio-web"      "studio-web:node20"
save_image "tester40-client" "tester40-client:node20"
save_image "tester40-web"    "tester40-web:node20"
save_image "tasker-web"      "tasker-web:node22"

echo ""
log "Image total: $(du -sh "$BUNDLE/images" | cut -f1)"

# ─── Atomid config ─────────────────────────────────────────────────────────────
hr; log "Copying atomid config..."

cp "$SCRIPT_DIR/ATOMID_Deployment/script/deploy/appenv/database.json" \
   "$BUNDLE/config/atomid/appenv/"
cp "$SCRIPT_DIR/ATOMID_Deployment/script/deploy/appenv/client-privatekey.pem" \
   "$SCRIPT_DIR/ATOMID_Deployment/script/deploy/appenv/client-publickey.pem" \
   "$SCRIPT_DIR/ATOMID_Deployment/script/deploy/appenv/service-privatekey.pem" \
   "$SCRIPT_DIR/ATOMID_Deployment/script/deploy/appenv/service-publickey.pem" \
   "$BUNDLE/config/atomid/appenv/"
cp "$SCRIPT_DIR/ATOMID_Deployment/script/deploy/atomid.sql" \
   "$BUNDLE/config/atomid/"

# 2FA/OTP algorithm fix (sha512 mismatch) — bind-mounted over the stock
# users.controller.js inside the atomid image, not baked into the image itself.
cp "$SCRIPT_DIR/ATOMID_Deployment/script/deploy/appenv/users.controller.js" \
   "$BUNDLE/config/atomid/appenv/"

# Rebuilt Angular frontend (fixes hardcoded atomp.io redirect links + the
# .atomp.io cookie-domain infinite login/logout loop on IP-based deployments).
# Bind-mounted over /app/public inside the atomid image.
#
# The Angular build bakes the DeviceFarm/Tester40 link URLs directly into the
# compiled JS as literal strings (build-time env injection, no runtime config
# for this piece) — so this machine's IP (10.42.0.245) is hardcoded in
# main.*.js. Ship a __SERVER_IP__-templated copy instead and render it fresh
# per machine in start_all.sh, same pattern as server.json.tmpl.
mkdir -p "$BUNDLE/config/atomid/appenv/public_fixed_tmpl"
cp -r "$SCRIPT_DIR/ATOMID_Deployment/script/deploy/appenv/public_fixed/." \
   "$BUNDLE/config/atomid/appenv/public_fixed_tmpl/"
grep -rl "10\.42\.0\.245" "$BUNDLE/config/atomid/appenv/public_fixed_tmpl/" 2>/dev/null | \
  while read -r f; do sed -i 's/10\.42\.0\.245/__SERVER_IP__/g' "$f"; done

# server.json — replace source IP with placeholder, rendered at deploy time
sed 's/10\.42\.0\.245/__SERVER_IP__/g' \
  "$SCRIPT_DIR/ATOMID_Deployment/script/deploy/appenv/server.json" \
  > "$BUNDLE/config/atomid/appenv/server.json.tmpl"

# atomid docker-compose (bundle-specific, paths via env vars)
cp "$SCRIPT_DIR/bundle/config/atomid/docker-compose.yaml" \
   "$BUNDLE/config/atomid/docker-compose.yaml"

ok "atomid config done"

# ─── Device Farm config ────────────────────────────────────────────────────────
hr; log "Copying device farm config..."

cp "$SCRIPT_DIR/df/deploy_master/kconfig/client-privatekey.pem" \
   "$SCRIPT_DIR/df/deploy_master/kconfig/client-publickey.pem" \
   "$SCRIPT_DIR/df/deploy_master/kconfig/service-privatekey.pem" \
   "$SCRIPT_DIR/df/deploy_master/kconfig/service-publickey.pem" \
   "$BUNDLE/config/df/kconfig/"

cp "$SCRIPT_DIR/df/deploy_master/config/nginx.template.conf" \
   "$BUNDLE/config/df/nginx/"

# config.sh template — replace source IP with placeholder
sed 's/10\.42\.0\.245/__SERVER_IP__/g' \
  "$SCRIPT_DIR/df/deploy_master/config.sh" \
  > "$BUNDLE/config/df/config.sh.tmpl"

# docker-compose template — replace source IP. Services all reference
# ${DEVICEFARM_IMAGE} (set in config.sh.tmpl above), so no image-tag rewrite
# needed here. Includes provider-android (real ADB-based device provider,
# added 2026-07-03) alongside the existing provider-linux service.
sed \
  -e 's/10\.42\.0\.245/__SERVER_IP__/g' \
  "$SCRIPT_DIR/df/deploy_master/docker-compose.yaml" \
  > "$BUNDLE/config/df/docker-compose.yaml.tmpl"

ok "device farm config done"

# ─── Appium (real Android device automation) ───────────────────────────────────
hr; log "Copying Appium..."

mkdir -p "$BUNDLE/appium"
# Full source + node_modules (~800MB) so a new machine doesn't need to run
# npm install itself. Started as a native process (not Docker) via start_appium.sh
# because it needs direct access to the host's adb/USB stack.
cp -r "$SCRIPT_DIR/../appium/." "$BUNDLE/appium/" 2>/dev/null || \
  log "  [WARN] Appium source not found at ../appium — skipping (start_all.sh will warn at runtime)"
# Rewrite hardcoded dev-machine paths to be relative to wherever the bundle
# gets extracted on the new machine.
sed \
  -e 's|APPIUM_DIR="/home/a1/atomp-2/appium"|APPIUM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" \&\& pwd)/appium"|' \
  -e 's|LOG_DIR="/home/a1/atomp-2/atomp_automation_deployment/app_data/appium_webserver/logs"|LOG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" \&\& pwd)/data/appium/logs"|' \
  "$SCRIPT_DIR/start_appium.sh" > "$BUNDLE/start_appium.sh" 2>/dev/null
chmod +x "$BUNDLE/start_appium.sh" 2>/dev/null

ok "appium done ($(du -sh "$BUNDLE/appium" 2>/dev/null | cut -f1))"

# ─── Router nginx config (runs as docker container — no host nginx needed) ────
hr; log "Copying router nginx config..."

cp "$SCRIPT_DIR/bundle/config/router-nginx.conf" "$BUNDLE/config/router-nginx.conf"

ok "nginx config done"

# ─── Scripts ───────────────────────────────────────────────────────────────────
hr; log "Copying scripts..."

cp "$SCRIPT_DIR/bundle/start_all.sh" "$BUNDLE/start_all.sh"
cp "$SCRIPT_DIR/bundle/stop_all.sh"  "$BUNDLE/stop_all.sh"
chmod +x "$BUNDLE/start_all.sh" "$BUNDLE/stop_all.sh"

# Provider run command for README
PROVIDER_CMD=$(cat << 'PROVIDER'
# ── Provider (USB devices — run AFTER device farm stack is up) ────────────────
# Requires: --privileged, USB passthrough, ADB.
# WSL: USB passthrough requires usbipd-win. Android emulators work without it.
#
#   SERVER_IP=<your-server-ip>
#   docker run -d \
#     --name provider \
#     --privileged \
#     --network host \
#     -v "$(pwd)/config/df/kconfig:/config" \
#     -v /dev/bus/usb:/dev/bus/usb \
#     devicefarm:bundle-20260702 \
#     stf provider-linux \
#       --name "local" \
#       --location "local" \
#       --connect-sub "tcp://$SERVER_IP:7250" \
#       --connect-push "tcp://$SERVER_IP:7270" \
#       --storage-url "http://$SERVER_IP:3500" \
#       --storage-permanent-url "http://$SERVER_IP:4200" \
#       --provider-storage-url "http://$SERVER_IP:3500/storage/upload" \
#       --min-port 11000 --max-port 12000 \
#       --heartbeat-interval 10000 \
#       --screen-ws-url-pattern "ws://$SERVER_IP:8180/d/local/<%= serial %>/<%= publicPort %>/" \
#       --stream-gate-client-pattern "ws://$SERVER_IP:8180/c" \
#       --stream-gate-device-pattern "ws://$SERVER_IP:8180/dv" \
#       --using-stream-gate true \
#       --using-appium false \
#       --screen-jpeg-quality 80 \
#       --fps 10 \
#       --device-farm-service-token "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiREYiLCJhbGxvd19zZXJ2aWNlIjpbIlRNIiwiVGVzdGVyNDAiLCJBVE9NSUQiLCJTdG9yYWdlIl19LCJpYXQiOjE1OTYwOTE3MzN9.fx-Jb-4mo8V6LkYN39t16za3xmWruIndzZcfinDXGIcPIE71okALCl1x2gikv8nJMWJGwSug68vFgrDVW5n_yjI60Mq-qO3rpT8vxVvCEjgAKtMWyXFn_erRufoLJE0RNNVWmUzQWhelbJoA2OLcOLckBUY8W1igu-Mf7b3tFgc"
PROVIDER
)

# ─── README ────────────────────────────────────────────────────────────────────
cat > "$BUNDLE/README.md" << README
# ATOMP Portable Bundle

## Requirements
- Linux or WSL2 (Ubuntu 20.04+)
- Docker Engine 20.10+ and docker compose v2
- nginx (on host, for the /atomid /tester40 /studio /storage routing)
- ~30 GB free disk space (images + data)

## Quick start

\`\`\`bash
tar xzf atomp-bundle.tar.gz
cd atomp-bundle
bash start_all.sh          # prompts for server IP
# or
bash start_all.sh 192.168.1.100
\`\`\`

The script will:
1. Load all docker images (first run only — takes a while)
2. Create docker networks with fixed subnets
3. Start atomid (mysql + redis + app)
4. Start device farm (rethinkdb + redis + mysql + all STF services + nginx on :8180)
5. Start shared mysql-auto + redis-auto
6. Start tester40, studio, storage, tasker
7. Install and reload the host nginx config

## Stopping all services

\`\`\`bash
bash stop_all.sh
\`\`\`

## After first run — atomid DB init

On a fresh machine, run the atomid SQL seed once:

\`\`\`bash
docker exec -i atomid-mysql mysql -u root -proot atomid < config/atomid/atomid.sql
\`\`\`

## Provider (USB Android devices)

$PROVIDER_CMD

## Service URLs (replace <IP> with your server IP)

| Service      | URL                                  |
|-------------|--------------------------------------|
| Atomid       | http://<IP>/atomid/                 |
| Device Farm  | http://<IP>:8180/devicefarm/        |
| Tester40     | http://<IP>/tester40                |
| Studio       | http://<IP>/studio                  |
| Storage      | http://<IP>/storage                 |
| Tasker       | port :33100 (API only, no UI)       |

## WSL notes

- \`hostname -I\` returns the WSL virtual IP — use that as SERVER_IP
- USB devices require usbipd-win for passthrough; provider won't work without it
- Access from Windows browser via \`localhost\` or the WSL IP

## Image inventory

| File | Image | Used by |
|------|-------|---------|
| devicefarm.tar.gz | devicefarm:bundle-20260702 | ALL device farm services (patched) |
| atomid.tar.gz | atomid/web:bundle-20260702 | atomid (patched) |
| mysql-atomid.tar.gz | mysql:8.0.34 | atomid-mysql |
| mysql-df.tar.gz | mysql:8.0.24 | df mysql |
| mysql-auto.tar.gz | mysql:8.0.43 | mysql-auto |
| redis-atomid.tar.gz | redis:8.6.1 | atomid-redis |
| redis.tar.gz | redis:8.2.2 | df redis, redis-auto |
| rethinkdb.tar.gz | rethinkdb:latest | rethinkdb |
| nginx-alpine.tar.gz | nginx:stable-alpine | df-nginx |
| tester40-web.tar.gz | tester40-web:node20 | tester40-web |
| tester40-client.tar.gz | tester40-client:node20 | tester40-client |
| tasker-web.tar.gz | tasker-web:node22 | tasker-web |
| studio-web.tar.gz | studio-web:node20 | studio-web |
| studio-client.tar.gz | studio-client:node20 | studio-client |
| storage-web.tar.gz | storage-web:node20 | storage-web |

## Config fixes in this bundle

1. **\`/devicefarm/api/\` routing fix** — \`config/df/nginx/nginx.template.conf\`: the generic
   \`/devicefarm\` location was swallowing \`/devicefarm/api/*\` calls and sending them to the
   session-gated web app instead of the API service, which broke atomid's user-sync-to-DeviceFarm
   call (and any other server-to-server call into the DF API) on every request

## Patches baked into devicefarm:bundle-20260702

1. **Redis NX null fix** — \`lib/db-redis/common-service.js\`: saveEmailSession returns OK
   when key already exists (prevents redirect loop on revisit within 24h)
2. **socket.io v4 namespace fix** — \`lib/units/app/index.js\`: websocketUrl pathname
   stripped to '/' so client connects to namespace '/' instead of '/devicefarm/'
3. **Session cookie Secure fix** — \`lib/units/app/index.js\`: cookie-session now sets
   \`secure: true\` outside dev env instead of always \`false\`

## Patches baked into atomid/web:bundle-20260702

1. **Removed debug console.log leaking JWT auth tokens** — leftover \`[DUNGTT27]\`-tagged
   debug statements in \`ServiceInterceptor\`, \`CanActivatePageService\`, \`LoginComponent\`,
   \`DefaultLayoutComponent\`, and \`CommonService\` printed the raw auth token and decoded
   SSO payloads to the browser console on every request/navigation
README

ok "README written"

echo ""
log "Bundle staged at: $BUNDLE"
log "Bundle dir size:  $(du -sh "$BUNDLE" | cut -f1)"
echo ""
hr
echo ""
echo "  Stack can now be started directly from $BUNDLE (bash start_all.sh already does this)."
echo "  To also produce a portable atomp-bundle.tar.gz for another machine, run:"
echo "    bash pack_bundle.sh"
echo ""
