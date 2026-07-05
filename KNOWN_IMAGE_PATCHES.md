# Known patches in devicefarm / atomid images (pre-rebuild snapshot, 2026-07-05)

These two images were built by patching a **running container** and `docker commit`-ing it,
not from a Dockerfile in this repo — `build_image/build_image.sh` even has both explicitly
disabled (`SERVICE_APP_NAMES["devicefarm"]=0`, `["atomid-web"]=0`). There is no confirmed
guarantee these fixes are present in the `atom-device-farm` / `atom-id` git history. Recorded
here before deleting the images so the specific behavior can be re-verified (or the fix
reapplied) after rebuilding from source.

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
