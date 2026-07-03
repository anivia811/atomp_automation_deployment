#!/bin/bash
# reconfig_ip.sh — switch to a new WiFi IP and restart all ATOMP services
# Usage:  bash reconfig_ip.sh [NEW_IP]
#         bash reconfig_ip.sh          # auto-detects current interface IP

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="$SCRIPT_DIR/.current_ip"

log() { echo "[$(date +%H:%M:%S)] $*"; }
hr()  { echo "────────────────────────────────────────────────────"; }

# ── Determine new IP ───────────────────────────────────────────────────────────
if [ -n "${1:-}" ]; then
  NEW_IP="$1"
else
  DETECTED=$(hostname -I 2>/dev/null | awk '{print $1}')
  echo ""
  echo "=== ATOMP IP Reconfiguration ==="
  echo "Detected IP: $DETECTED"
  read -r -p "Enter new server IP [${DETECTED}]: " INPUT
  NEW_IP="${INPUT:-$DETECTED}"
fi

# ── Determine old IP ───────────────────────────────────────────────────────────
if [ -f "$STATE_FILE" ]; then
  OLD_IP=$(cat "$STATE_FILE")
else
  OLD_IP=$(grep -m1 'TESTER40_SERVER_IPV4=' "$SCRIPT_DIR/run_app.sh" \
    | sed 's/.*="\(.*\)".*/\1/')
  [ -z "$OLD_IP" ] && OLD_IP="10.42.0.245"
fi

echo ""
log "Old IP: $OLD_IP"
log "New IP: $NEW_IP"

if [ "$OLD_IP" = "$NEW_IP" ]; then
  log "IP unchanged — nothing to do."
  exit 0
fi

# ── Patch config files ─────────────────────────────────────────────────────────
hr; log "Patching config files..."

patch_file() {
  local file="$1"
  if [ ! -f "$file" ]; then return; fi
  if grep -q "$OLD_IP" "$file"; then
    sed -i "s|$OLD_IP|$NEW_IP|g" "$file"
    log "  [OK] $file"
  else
    log "  [--] $file (no match)"
  fi
}

patch_file "$SCRIPT_DIR/run_app.sh"
patch_file "$SCRIPT_DIR/nginx_atomp.conf"
patch_file "$SCRIPT_DIR/ATOMID_Deployment/script/deploy/appenv/server.json"
patch_file "$SCRIPT_DIR/df/deploy_master/config.sh"

echo "$NEW_IP" > "$STATE_FILE"
log "  Saved $NEW_IP → $STATE_FILE"

# ── Restart app containers via run_app.sh ──────────────────────────────────────
hr; log "Restarting app services..."
bash "$SCRIPT_DIR/run_app.sh"

# ── Restart ATOMID ─────────────────────────────────────────────────────────────
hr; log "Restarting ATOMID container..."
if docker ps -a --format "{{.Names}}" | grep -q "^atomid$"; then
  docker restart atomid
  log "  atomid restarted"
else
  log "  atomid not found, skipping"
fi

# ── Update Docker nginx container config ───────────────────────────────────────
hr; log "Updating Docker nginx..."
if docker ps --format "{{.Names}}" | grep -q "^nginx$"; then
  NGINX_TMP=$(mktemp /tmp/nginx_reconfig_XXXXXX.conf)
  docker cp nginx:/etc/nginx/nginx.conf "$NGINX_TMP"
  # Replace ALL bare IP occurrences (upstream server blocks + http:// URLs)
  sed -i "s|\b[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+\b|$NEW_IP|g" "$NGINX_TMP"
  # Keep internal services using container names (not IPs)
  sed -i "s|${NEW_IP}:8081|atomid:8081|g" "$NGINX_TMP"
  docker cp "$NGINX_TMP" nginx:/etc/nginx/nginx.conf
  rm -f "$NGINX_TMP"
  # Ensure nginx is on the required networks
  docker network connect atomid_deployment_atomid nginx 2>/dev/null || true
  docker network connect atomp_automation_network nginx 2>/dev/null || true
  docker exec nginx nginx -t 2>/dev/null && docker exec nginx nginx -s reload
  log "  Docker nginx reloaded"
else
  log "  nginx container not running, skipping"
fi

# ── Recreate DF app + auth-mock with new IP ────────────────────────────────────
hr; log "Recreating Device Farm containers with new IP..."
APPENV="$SCRIPT_DIR/ATOMID_Deployment/script/deploy/appenv"
TRASH="/home/chanhol1/.local/share/Trash/files/deployment/df/app-fixes"

if docker inspect app &>/dev/null || docker inspect auth-mock &>/dev/null; then
  # Get token from running app container (if any)
  DF_TOKEN=$(docker inspect app --format '{{range .Config.Cmd}}{{.}} {{end}}' 2>/dev/null \
    | grep -oP '(?<=device-farm-service-token )\S+' || echo "")

  docker rm -f auth-mock 2>/dev/null || true
  docker run -d \
    --name auth-mock \
    --network deploy_master_default \
    --restart unless-stopped \
    -p 3200:3000 \
    -v "$APPENV/client-privatekey.pem:/config/client-privatekey.pem" \
    -v "$APPENV/client-publickey.pem:/config/client-publickey.pem" \
    -v "$APPENV/service-privatekey.pem:/config/service-privatekey.pem" \
    -v "$APPENV/service-publickey.pem:/config/service-publickey.pem" \
    devicefarm:upgraded-260618-fix5 \
    stf auth-mock --port 3000 \
      --app-url "http://$NEW_IP/df/" \
      --secret "atom@nuclear!" \
      --private-key-path /config/client-privatekey.pem
  log "  auth-mock recreated"

  docker rm -f app 2>/dev/null || true
  docker run -d \
    --name app \
    --network deploy_master_default \
    --restart unless-stopped \
    -p 3100:3000 \
    -v "$APPENV/client-privatekey.pem:/config/client-privatekey.pem" \
    -v "$APPENV/client-publickey.pem:/config/client-publickey.pem" \
    -v "$APPENV/service-privatekey.pem:/config/service-privatekey.pem" \
    -v "$APPENV/service-publickey.pem:/config/service-publickey.pem" \
    -v "$TRASH/app/index.js:/app/lib/units/app/index.js" \
    -v "$TRASH/app/middleware/auth.js:/app/lib/units/app/middleware/auth.js" \
    -v "/home/chanhol1/origin_note/atom-device-farm/res/app/control-panes/screenshots/screenshots-controller.js:/app/res/app/control-panes/screenshots/screenshots-controller.js" \
    devicefarm:upgraded-260618-fix5 \
    stf app --port 3000 \
      --auth-url "http://$NEW_IP/df/auth/mock/" \
      --websocket-url "http://$NEW_IP/df/" \
      --public-key-path /config/client-publickey.pem \
      --device-farm-service-token "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiVGVzdGVyNDAiLCJhbGxvd19zZXJ2aWNlIjpbIkRGIiwiVGFza2VyIiwiQVRPTUlEIl19LCJpYXQiOjE1ODM5OTkyNzZ9.ha55v-J72QLkcW3Won9ivTOZraEWyFrvDbei4tmW6ftfNFM47UJAhJSO_tBqEziHqXcUWUsv8TRvbIRa5FqdYCy6E7Enno9oVub4JsXh0CvVLs6_kRO12PLOlcfEkRKg3fxUT0PJ1flEugAey7J7xDKF2J6rEef84pLYYf5jgrY" \
      --administrator "atom@gst.io,admin@hae.com,admin2@hae.com,admin@atomp.io" \
      --env dev \
      --user-info-api-path "http://$NEW_IP:8081/api/get-user-by-email"
  log "  app recreated"
else
  log "  DF containers not found, skipping"
fi

# ── Recreate DF provider with new IP ──────────────────────────────────────────
hr; log "Recreating DF provider with new IP..."
KCONFIG="$SCRIPT_DIR/df/deploy_master/kconfig"
DF_PROVIDER_IMAGE=$(docker inspect provider --format '{{.Config.Image}}' 2>/dev/null || echo "devicefarm:upgraded-260618-fix5")
DF_PROVIDER_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiREYiLCJhbGxvd19zZXJ2aWNlIjpbIlRNIiwiVGVzdGVyNDAiLCJBVE9NSUQiLCJTdG9yYWdlIl19LCJpYXQiOjE1OTYwOTE3MzN9.fx-Jb-4mo8V6LkYN39t16za3xmWruIndzZcfinDXGIcPIE71okALCl1x2gikv8nJMWJGwSug68vFgrDVW5n_yjI60Mq-qO3rpT8vxVvCEjgAKtMWyXFn_erRufoLJE0RNNVWmUzQWhelbJoA2OLcOLckBUY8W1igu-Mf7b3tFgc"

docker rm -f provider 2>/dev/null || true
docker run -d \
  --name provider \
  --privileged \
  --network host \
  -v "$KCONFIG:/config" \
  -v /dev/bus/usb:/dev/bus/usb \
  --restart unless-stopped \
  "$DF_PROVIDER_IMAGE" \
  stf provider \
    --name "local-245" \
    --location "MCTech" \
    --adb-host "127.0.0.1" \
    --adb-port 5037 \
    --connect-sub "tcp://${NEW_IP}:7250" \
    --connect-push "tcp://${NEW_IP}:7270" \
    --storage-url "http://${NEW_IP}:3500" \
    --storage-permanent-url "http://${NEW_IP}:4200" \
    --provider-storage-url "http://${NEW_IP}:3500/storage/upload" \
    --min-port 11000 \
    --max-port 12000 \
    --heartbeat-interval 10000 \
    --screen-ws-url-pattern "ws://${NEW_IP}/d/MCTech/<%= serial %>/<%= publicPort %>/" \
    --using-stream-gate false \
    --screen-jpeg-quality 80 \
    --fps 10 \
    --device-farm-service-token "$DF_PROVIDER_TOKEN"
log "  provider recreated"

# ── Done ───────────────────────────────────────────────────────────────────────
hr
echo ""
echo "=== Reconfiguration complete ==="
echo ""
echo "  AtomID:      http://$NEW_IP/atomid/"
echo "  Tester40:    http://$NEW_IP/tester40"
echo "  Studio:      http://$NEW_IP/studio"
echo "  Storage:     http://$NEW_IP/storage"
echo "  Tasker:      http://$NEW_IP:33100"
echo "  Device Farm: http://$NEW_IP/devicefarm/"
echo ""
