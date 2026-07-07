# Known patches in devicefarm / atomid images (pre-rebuild snapshot, 2026-07-05)

**Update (2026-07-06): devicefarm now has a working rebuild path — see below.** This file's
original premise (both images only existed as `docker commit`-patched containers with no
confirmed fix in git) turned out to be wrong for devicefarm: `atom-device-farm`'s own repo
root has a self-contained `Dockerfile` (added by commit `6ff9fc11a` "Upgrade Container and
nodejs — Fix OSS Issue") that installs Node 24 fresh from nodejs.org and `npm install`s from
the network — it does not use `df-base`/offline `ubuntu_nodemodule` at all. Diffing
`devicefarm:b-20260703`'s actual layer history (`docker history --no-trunc`) against this
Dockerfile confirms the running image WAS built from it, and all patches below (redis NX,
socket.io namespace, session cookie secure, loadUser/company_id) are already committed on
top of that same commit (`e7553dc59`, `6bf6e9598`, `ebd4e5da7`, `ffeabc9b4`) — no manual
re-patching needed. `start_all.sh` now builds devicefarm the same way it builds atomid:
`docker build -t devicefarm:b-$(date +%Y%m%d) atom-device-farm/`, then syncs the new tag into
`build_bundle.sh`/`bundle/start_all.sh`/`df/deploy_master/config.sh`. Verified the rebuilt
image matches the running one: same Node v24.16.0, same `vendor/*` layout (added
`vendor/nodejs/` to `atom-device-farm/.dockerignore` since the running container never had
it — it's only used by provider-linux's unrelated SSH shell-server feature), same
pre-built `res/statistical/dist`, final size 3.01GB vs the running image's 2.91GB.

The atomid section below is unrelated and still describes a real gap for that image.

Pre-rebuild image reference: `devicefarm:b-20260703` (id `c544d8ac65a1`, built 2026-07-03),
`atomid/web:b-20260629` (id `b2932ba0d096`, built 2026-06-29).

## devicefarm (`atom-device-farm`)

1. **Redis NX null fix** — `lib/db-redis/common-service.js`: `saveEmailSession` returns OK
   when the key already exists, instead of erroring — prevents a redirect loop on revisit
   within 24h.
2. **socket.io v4 namespace fix** — `lib/units/app/index.js`: `websocketUrl` pathname
   stripped to `/` so the client connects to namespace `/` instead of `/devicefarm/`.
3. **Session cookie Secure fix** — `lib/units/app/index.js`: cookie-session sets
   `secure: true` outside dev env instead of always `false`.
4. **loadUser JWT fix** — `loadUser(data.data.email)` fix + `company_id=-1` device
   visibility fix (exact file not recorded before the image was built).
5. **vendor/STFService, vendor/appium** — real device + Appium provider support (was
   missing from the plain upstream image).
6. **statistical/report Angular app** — built into the image.
7. (Not image-baked, but related) **`/devicefarm/api/` nginx routing fix** —
   `config/df/nginx/nginx.template.conf`: the generic `/devicefarm` location was swallowing
   `/devicefarm/api/*` calls meant for the API service — this fix lives in this repo's
   nginx template, unaffected by rebuilding the devicefarm image.

## atomid (`atom-id`)

1. **Removed debug console.log leaking JWT auth tokens** — `[DUNGTT27]`-tagged debug
   statements in `ServiceInterceptor`, `CanActivatePageService`, `LoginComponent`,
   `DefaultLayoutComponent`, and `CommonService` were printing the raw auth token and
   decoded SSO payload to the browser console on every request/navigation.
2. **OTP algorithm fix (sha512 mismatch)** — `users.controller.js`. Currently shipped as a
   bind-mounted file override (`ATOMID_Deployment/script/deploy/appenv/users.controller.js`),
   **not** baked into the image — unaffected by rebuilding.
3. **Frontend redirect-loop / cookie-domain fix** — `public_fixed/` (Angular build output).
   Currently shipped as a bind-mounted override, **not** baked into the image — unaffected
   by rebuilding.

## After rebuild — verify

- devicefarm: revisit-within-24h doesn't loop, DF websocket connects, session cookie works
  over plain HTTP, real devices + Appium provider show up, statistical/report page loads.
- atomid: no JWT/SSO payload printed to browser console on login/navigation.
