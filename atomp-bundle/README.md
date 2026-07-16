# ATOMP Portable Bundle

## Requirements
- Linux or WSL2 (Ubuntu 20.04+)
- Docker Engine 20.10+ and docker compose v2
- ~30 GB free disk space (images + data)
- Node.js is NOT required on the host — Appium ships its own portable
  node/npm runtime (`appium/.node/`) and uses it automatically whenever no
  system node satisfying `^20.19` is already on PATH.

## Quick start

```bash
tar xzf atomp-bundle.tar.gz
cd atomp-bundle

# One-time, only if you'll use real USB Android devices (not needed for
# emulator-only use). Must run BEFORE connecting a device.
sudo bash install_prereqs.sh

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
7. Install and reload the host nginx config — this is what actually serves Device
   Farm at `/devicefarm/` on port 80 (see below); the dedicated :8180 origin
   still runs too but LAN policies on some networks block non-standard ports
8. Start Appium (real device automation), using the uiautomator2 driver
   already bundled in appium_home/ and, if no suitable system node is found,
   the portable node runtime bundled in appium/.node/ — no network access
   or host Node.js install needed for any of this

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

Both `provider` (emulators) and `provider-android` (real ADB-connected phones)
are already defined in `config/df/docker-compose.yaml` (privileged, host
network, `/dev/bus/usb` mounted) and start automatically with the rest of the
device farm stack in step 4 above — there is no manual `docker run` step.

If a physically connected device doesn't show up in Device Farm:
1. Make sure `sudo bash install_prereqs.sh` was run (installs udev rules for
   Android USB vendor IDs — without it, Linux denies device access with
   "no permissions ... not in the plugdev group", regardless of Docker).
2. Check the OS/ADB sees it at all: `adb devices` should show it as `device`,
   not `unauthorized` or missing. Enable USB debugging in Developer Options
   and accept the "Allow USB debugging?" prompt on the device's own screen —
   this is a one-time physical step no script can do for you.
3. **adb runs inside the `provider-android` container (user `stf`), not on
   the host** — host-side `adb kill-server`/`start-server` just re-attaches
   to the container's already-running server, it doesn't restart anything.
   Use `docker logs provider-android` and `docker exec provider-android adb
   devices`, not the host's own adb, when diagnosing.
4. If `adb devices` shows `no permissions` even after step 1: many Android
   phones also expose a PTP/MTP camera interface, which makes
   `/usr/lib/udev/rules.d/60-libgphoto2-6.rules` match the same device and
   reset it back to mode 0664 — silently undoing a lower-priority rule.
   `install_prereqs.sh` installs at priority `99` specifically to run after
   that and win; if a permission issue persists, confirm with
   `ls -l /dev/bus/usb/*/*` that the device is actually `crw-rw-rw-`, and
   check for any other `/etc/udev/rules.d/` or `/usr/lib/udev/rules.d/` file
   for that vendor ID sorting after `99-atomp-android.rules`.

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

- `hostname -I` returns the WSL virtual IP — use that as SERVER_IP
- USB devices require usbipd-win for passthrough; provider won't work without it
- Access from Windows browser via `localhost` or the WSL IP

## Image inventory

| File | Image | Used by |
|------|-------|---------|
| devicefarm.tar.gz | devicefarm:b-20260716 | ALL device farm services (patched) |
| atomid.tar.gz | atomid/web:b-20260716 | atomid (patched) |
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

## Patches baked into devicefarm:b-20260716 (2026-07-16)

1. **Settings/Control/Devices/Groups redirect-to-atomid-homepage fix** —
   `res/app/menu/menu.pug` and `res/app/components/stf/common-ui/help-icon/help-icon.pug`
   used absolute-path hashbang links (`ng-href="/#!/settings"`). That only worked on
   Device Farm's old dedicated `:8180` origin, where `/` was its own root — under the
   shared `host-router` (port 80) used by this bundle, `/` unconditionally 302s to
   `/atomid/`, so every nav click bounced the user out of Device Farm entirely. Fixed
   by making the links path-relative (`#!/settings`, no leading `/`). Also hardened three
   unrelated `$window.location = '/'` fallbacks (401 interceptor, logout, idle-session
   timeout in `app.js`/`menu-controller.js`/`idle-session-service.js`) to target
   `/devicefarm/` instead, so they can't regress the same way.
2. **Redis v3→v4 API fix** — legacy `redis.setAsync/getAsync/delAsync/ttlAsync` calls
   (node-redis v3 callback style) against a v4 client silently failed; rewritten to the
   v4 API (`redis.set/get/del/ttl`).
3. **`node-fetch` ESM require fix** — `require('node-fetch')` crashed the `api` container
   on every logout (node-fetch v3 is ESM-only); switched to dynamic import, wrapped in
   try/catch.
