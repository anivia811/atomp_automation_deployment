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
save_image "devicefarm"      "devicefarm:b-20260716"
# Base atomid image. The OTP algorithm fix (users.controller.js) and the frontend
# redirect-loop/cookie fix (public_fixed/) are shipped as separate bind-mounted
# files below, not baked into this image — see config/atomid/appenv/.
save_image "atomid"          "atomid/web:b-20260716"
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
# ~6.7GB (conda + PyTorch CPU + EasyOCR model) — by far the largest image
# here. Was previously absent from every bundle (never built/saved/started
# by any script — only ever existed as a one-off manual `docker run`), so any
# tasker-web/studio-web feature calling http://atomp-ai:8000 silently had
# nothing to connect to on a fresh machine.
save_image "atomp-ai"        "atomp-ai:latest"

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

# Installed drivers (e.g. uiautomator2) live in $APPIUM_HOME (~/.appium by
# default) — a location OUTSIDE the appium/ project directory copied above,
# tied to whatever user ran `appium driver install` on the source machine.
# Copying the project alone reproduced "Could not find a driver for
# automationName 'UIAutomator2'" on a fresh machine even though appium/
# itself was fully staged. Ship the actual installed driver files instead of
# requiring a fresh `driver install` (and npm registry access) on every new
# machine — start_appium.sh points APPIUM_HOME at this copy directly.
mkdir -p "$BUNDLE/appium_home"
cp -r "$HOME/.appium/." "$BUNDLE/appium_home/" 2>/dev/null || \
  log "  [WARN] ~/.appium not found — uiautomator2 driver will be missing on the target machine"

# extensions.yaml (Appium's driver/plugin manifest) records each driver's
# installPath as an ABSOLUTE path from wherever it was originally installed
# (this machine's $HOME/.appium) — copying the files alone doesn't fix this,
# the manifest still points back at the source machine's literal path, which
# doesn't exist on a fresh machine. Confirmed by testing: with the files
# copied as-is, Appium failed with "Could not read the driver manifest at
# /home/a1/.appium/node_modules/.../package.json: ENOENT" even though the
# driver files were physically present at the new location. Swap in a
# placeholder here; start_appium.sh renders it back to the real absolute path
# at runtime, same __SERVER_IP__-style pattern used elsewhere in this repo.
MANIFEST="$BUNDLE/appium_home/node_modules/.cache/appium/extensions.yaml"
if [[ -f "$MANIFEST" ]]; then
  sed -i "s|$HOME/\.appium|__APPIUM_HOME__|g" "$MANIFEST"
  ok "extensions.yaml installPath templated for portability"
fi

# Portable node/npm runtime — confirmed on real hardware (hopium, 2026-07-12)
# that a "brand new Ubuntu machine" can have NO system Node.js at all, which
# fails `node packages/appium/index.js` silently (start_all.sh only warns,
# never hard-fails, on Appium not starting) — the rest of the stack comes up
# looking fine while nothing ever listens on :4723. Extract node+npm from our
# own already-built node20 base image so Appium can run with zero host
# prerequisites beyond Docker itself. start_appium.sh only uses this when no
# suitable system node is already on PATH.
NODE_EXTRACT_IMG="node:20-bookworm-slim-atomp"
if docker image inspect "$NODE_EXTRACT_IMG" >/dev/null 2>&1; then
  hr; log "Extracting portable node/npm from $NODE_EXTRACT_IMG (Appium fallback runtime)..."
  mkdir -p "$BUNDLE/appium/.node/bin" "$BUNDLE/appium/.node/lib"
  CID="$(docker create "$NODE_EXTRACT_IMG")"
  docker cp "$CID:/usr/local/bin/node" "$BUNDLE/appium/.node/bin/node"
  docker cp "$CID:/usr/local/lib/node_modules" "$BUNDLE/appium/.node/lib/node_modules"
  docker rm "$CID" >/dev/null
  # Write plain wrapper scripts for npm/npx instead of relying on the
  # image's relative symlinks (`../lib/node_modules/npm/bin/npm-cli.js`) —
  # confirmed on hopium that `docker cp` doesn't reliably reproduce those,
  # since the two `docker cp` calls above land bin/ and lib/ separately
  # rather than as one atomic copy of /usr/local.
  cat > "$BUNDLE/appium/.node/bin/npm" << 'NPMWRAP'
#!/bin/sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/node" "$DIR/../lib/node_modules/npm/bin/npm-cli.js" "$@"
NPMWRAP
  cat > "$BUNDLE/appium/.node/bin/npx" << 'NPXWRAP'
#!/bin/sh
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/node" "$DIR/../lib/node_modules/npm/bin/npx-cli.js" "$@"
NPXWRAP
  chmod +x "$BUNDLE/appium/.node/bin/node" "$BUNDLE/appium/.node/bin/npm" "$BUNDLE/appium/.node/bin/npx"
  ok "portable node runtime staged ($(du -sh "$BUNDLE/appium/.node" | cut -f1))"
else
  log "  [WARN] $NODE_EXTRACT_IMG not found locally — Appium will require system node on the target machine"
fi

# Rewrite hardcoded dev-machine paths to be relative to wherever the bundle
# gets extracted on the new machine.
sed \
  -e 's|APPIUM_DIR="/home/a1/atomp-2/appium"|APPIUM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" \&\& pwd)/appium"|' \
  -e 's|LOG_DIR="/home/a1/atomp-2/atomp_automation_deployment/app_data/appium_webserver/logs"|LOG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" \&\& pwd)/data/appium/logs"|' \
  -e 's|APPIUM_HOME="/home/a1/.appium"|APPIUM_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")" \&\& pwd)/appium_home"|' \
  "$SCRIPT_DIR/start_appium.sh" > "$BUNDLE/start_appium.sh" 2>/dev/null
chmod +x "$BUNDLE/start_appium.sh" 2>/dev/null

ok "appium done ($(du -sh "$BUNDLE/appium" 2>/dev/null | cut -f1) + appium_home $(du -sh "$BUNDLE/appium_home" 2>/dev/null | cut -f1))"

# ─── Router nginx config (runs as docker container — no host nginx needed) ────
hr; log "Copying router nginx config..."

cp "$SCRIPT_DIR/bundle/config/router-nginx.conf" "$BUNDLE/config/router-nginx.conf"

ok "nginx config done"

# ─── Scripts ───────────────────────────────────────────────────────────────────
hr; log "Copying scripts..."

cp "$SCRIPT_DIR/bundle/start_all.sh" "$BUNDLE/start_all.sh"
cp "$SCRIPT_DIR/bundle/stop_all.sh"  "$BUNDLE/stop_all.sh"
cp "$SCRIPT_DIR/bundle/install_prereqs.sh" "$BUNDLE/install_prereqs.sh"
cp "$SCRIPT_DIR/bundle/99-atomp-android.rules" "$BUNDLE/99-atomp-android.rules"
chmod +x "$BUNDLE/start_all.sh" "$BUNDLE/stop_all.sh" "$BUNDLE/install_prereqs.sh"

# ─── README ────────────────────────────────────────────────────────────────────
cat > "$BUNDLE/README.md" << README
# ATOMP Portable Bundle

## Requirements
- Linux or WSL2 (Ubuntu 20.04+)
- Docker Engine 20.10+ and docker compose v2
- ~30 GB free disk space (images + data)
- Node.js is NOT required on the host — Appium ships its own portable
  node/npm runtime (\`appium/.node/\`) and uses it automatically whenever no
  system node satisfying \`^20.19\` is already on PATH.

## Quick start

\`\`\`bash
tar xzf atomp-bundle.tar.gz
cd atomp-bundle

# One-time, only if you'll use real USB Android devices (not needed for
# emulator-only use). Must run BEFORE connecting a device.
sudo bash install_prereqs.sh

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
7. Install and reload the host nginx config — this is what actually serves Device
   Farm at \`/devicefarm/\` on port 80 (see below); the dedicated :8180 origin
   still runs too but LAN policies on some networks block non-standard ports
8. Start Appium (real device automation), using the uiautomator2 driver
   already bundled in appium_home/ and, if no suitable system node is found,
   the portable node runtime bundled in appium/.node/ — no network access
   or host Node.js install needed for any of this

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

Both \`provider\` (emulators) and \`provider-android\` (real ADB-connected phones)
are already defined in \`config/df/docker-compose.yaml\` (privileged, host
network, \`/dev/bus/usb\` mounted) and start automatically with the rest of the
device farm stack in step 4 above — there is no manual \`docker run\` step.

If a physically connected device doesn't show up in Device Farm:
1. Make sure \`sudo bash install_prereqs.sh\` was run (installs udev rules for
   Android USB vendor IDs — without it, Linux denies device access with
   "no permissions ... not in the plugdev group", regardless of Docker).
2. Check the OS/ADB sees it at all: \`adb devices\` should show it as \`device\`,
   not \`unauthorized\` or missing. Enable USB debugging in Developer Options
   and accept the "Allow USB debugging?" prompt on the device's own screen —
   this is a one-time physical step no script can do for you.
3. **adb runs inside the \`provider-android\` container (user \`stf\`), not on
   the host** — host-side \`adb kill-server\`/\`start-server\` just re-attaches
   to the container's already-running server, it doesn't restart anything.
   Use \`docker logs provider-android\` and \`docker exec provider-android adb
   devices\`, not the host's own adb, when diagnosing.
4. If \`adb devices\` shows \`no permissions\` even after step 1: many Android
   phones also expose a PTP/MTP camera interface, which makes
   \`/usr/lib/udev/rules.d/60-libgphoto2-6.rules\` match the same device and
   reset it back to mode 0664 — silently undoing a lower-priority rule.
   \`install_prereqs.sh\` installs at priority \`99\` specifically to run after
   that and win; if a permission issue persists, confirm with
   \`ls -l /dev/bus/usb/*/*\` that the device is actually \`crw-rw-rw-\`, and
   check for any other \`/etc/udev/rules.d/\` or \`/usr/lib/udev/rules.d/\` file
   for that vendor ID sorting after \`99-atomp-android.rules\`.

## Service URLs (replace <IP> with your server IP)

| Service      | URL                                  |
|-------------|--------------------------------------|
| Atomid       | http://<IP>/atomid/                 |
| Device Farm  | http://<IP>/devicefarm/             |
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
| devicefarm.tar.gz | $(cat "$BUNDLE/images/devicefarm.ref" 2>/dev/null || echo "devicefarm:b-YYYYMMDD") | ALL device farm services (patched) |
| atomid.tar.gz | $(cat "$BUNDLE/images/atomid.ref" 2>/dev/null || echo "atomid/web:b-YYYYMMDD") | atomid (patched) |
| mysql-atomid.tar.gz | mysql:8.0.34 | atomid-mysql |
| mysql-df.tar.gz | mysql:8.0.24 | df mysql |
| mysql-auto.tar.gz | mysql:8.0.43 | mysql-auto |
| redis-atomid.tar.gz | redis:8.6.1 | atomid-redis |
| redis.tar.gz | redis:8.2.2 | df redis, redis-auto |
| rethinkdb.tar.gz | rethinkdb:latest | rethinkdb |
| nginx-alpine.tar.gz | nginx:stable-alpine | df-nginx, host-router |
| tester40-web.tar.gz | tester40-web:node20 | tester40-web |
| tester40-client.tar.gz | tester40-client:node20 | tester40-client |
| tasker-web.tar.gz | tasker-web:node22 | tasker-web |
| studio-web.tar.gz | studio-web:node20 | studio-web |
| studio-client.tar.gz | studio-client:node20 | studio-client |
| storage-web.tar.gz | storage-web:node20 | storage-web |
| atomp-ai.tar.gz | atomp-ai:latest | tasker-web, studio-web (OCR/image-similarity, ~6.7GB — by far the largest image) |

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

## Patches baked into devicefarm:b-20260716 (2026-07-16)

1. **Settings/Control/Devices/Groups redirect-to-atomid-homepage fix** —
   \`res/app/menu/menu.pug\` and \`res/app/components/stf/common-ui/help-icon/help-icon.pug\`
   used absolute-path hashbang links (\`ng-href="/#!/settings"\`). That only worked on
   Device Farm's old dedicated \`:8180\` origin, where \`/\` was its own root — under the
   shared \`host-router\` (port 80) used by this bundle, \`/\` unconditionally 302s to
   \`/atomid/\`, so every nav click bounced the user out of Device Farm entirely. Fixed
   by making the links path-relative (\`#!/settings\`, no leading \`/\`). Also hardened three
   unrelated \`\$window.location = '/'\` fallbacks (401 interceptor, logout, idle-session
   timeout in \`app.js\`/\`menu-controller.js\`/\`idle-session-service.js\`) to target
   \`/devicefarm/\` instead, so they can't regress the same way.
2. **Redis v3→v4 API fix** — legacy \`redis.setAsync/getAsync/delAsync/ttlAsync\` calls
   (node-redis v3 callback style) against a v4 client silently failed; rewritten to the
   v4 API (\`redis.set/get/del/ttl\`).
3. **\`node-fetch\` ESM require fix** — \`require('node-fetch')\` crashed the \`api\` container
   on every logout (node-fetch v3 is ESM-only); switched to dynamic import, wrapped in
   try/catch.
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
