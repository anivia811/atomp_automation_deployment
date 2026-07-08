# ATOMP Portable Bundle

## Requirements
- Linux or WSL2 (Ubuntu 20.04+)
- Docker Engine 20.10+ and docker compose v2
- nginx (on host, for the /atomid /tester40 /studio /storage routing)
- ~30 GB free disk space (images + data)

## Quick start

```bash
tar xzf atomp-bundle.tar.gz
cd atomp-bundle
bash start_all.sh          # prompts for server IP
# or
bash start_all.sh 192.168.1.100
```

The script will:
1. Load all docker images (first run only — takes a while)
2. Create docker networks with fixed subnets
3. Start atomid (mysql + redis + app)
4. Start device farm (rethinkdb + redis + mysql + all STF services + nginx on :8180)
5. Start shared mysql-auto + redis-auto
6. Start tester40, studio, storage, tasker
7. Install and reload the host nginx config

## Stopping all services

```bash
bash stop_all.sh
```

## After first run — atomid DB init

On a fresh machine, run the atomid SQL seed once:

```bash
docker exec -i atomid-mysql mysql -u root -proot atomid < config/atomid/atomid.sql
```

## Provider (USB Android devices)

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

- `hostname -I` returns the WSL virtual IP — use that as SERVER_IP
- USB devices require usbipd-win for passthrough; provider won't work without it
- Access from Windows browser via `localhost` or the WSL IP

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

1. **`/devicefarm/api/` routing fix** — `config/df/nginx/nginx.template.conf`: the generic
   `/devicefarm` location was swallowing `/devicefarm/api/*` calls and sending them to the
   session-gated web app instead of the API service, which broke atomid's user-sync-to-DeviceFarm
   call (and any other server-to-server call into the DF API) on every request

## Patches baked into devicefarm:bundle-20260702

1. **Redis NX null fix** — `lib/db-redis/common-service.js`: saveEmailSession returns OK
   when key already exists (prevents redirect loop on revisit within 24h)
2. **socket.io v4 namespace fix** — `lib/units/app/index.js`: websocketUrl pathname
   stripped to '/' so client connects to namespace '/' instead of '/devicefarm/'
3. **Session cookie Secure fix** — `lib/units/app/index.js`: cookie-session now sets
   `secure: true` outside dev env instead of always `false`

## Patches baked into atomid/web:bundle-20260702

1. **Removed debug console.log leaking JWT auth tokens** — leftover `[DUNGTT27]`-tagged
   debug statements in `ServiceInterceptor`, `CanActivatePageService`, `LoginComponent`,
   `DefaultLayoutComponent`, and `CommonService` printed the raw auth token and decoded
   SSO payloads to the browser console on every request/navigation
