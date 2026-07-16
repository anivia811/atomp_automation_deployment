# Known Bugs

Live/latent bugs found during operation, not yet necessarily fixed. Distinct from
`KNOWN_IMAGE_PATCHES.md` (fixes already baked into shipped images) — entries here may
still be open. Add new bugs to the bottom as they're found; update `Status` in place once
addressed.

---

## 1. `api` container crashes and stays down on any devicefarm API validation/error (Node 24 `util.isError` removal)

- **Status:** FIXED AND DEPLOYED — recurred 6 times this session before the fix was applied.
  `util.isError` shim added to `atom-device-farm/lib/cli/please.js` (option #1 below) and
  `restart: unless-stopped` added to every devicefarm service in both
  `df/deploy_master/docker-compose.yaml` and the live `atomp-bundle/config/df/docker-compose.yaml`
  (the second file was initially missed — the policy sat in the master source and the `.tmpl`
  for a while without ever reaching the file the running stack actually reads, so `app`/`api`
  had zero auto-recovery through several of those 6 crashes despite the fix supposedly being
  in). Both `app` and `api` rebuilt + recreated with the fixed image; confirmed live via
  `docker exec api sh -c "cat /proc/1/cmdline"` showing the real `stf api ...` entrypoint
  (not a bypassed `docker exec node -e` check, which doesn't go through `please.js` and gives
  a false negative).
- **Found:** 2026-07-16, during live testing right after a devicefarm bundle repack.
- **Symptom:** The devicefarm `api` container exits and does not come back — every request
  through `/devicefarm/api/*` (and the dedicated `:8180` origin's `/api/v1/*`) starts
  returning `502`/connection-refused for every user, not just one.

### Trigger

A routine, automatic server-to-server call — **not** anything a tester does deliberately.
Observed trigger: atomid's HMG SSO logout/force-login flow calls devicefarm's
`POST /api/v1/user/forceSessionExternalService` on every logout/force-login (see
`atom-id-web/app/api/users/users.controller.js:618` →
`atom-id-web/app/api/users/users.service.js:1402` `deleteUserSessionDeviceFarm`). This
fires for **any** user logging in/out — whoever happens to trigger it first takes the
service down for everyone.

### Root cause

Node 24 removed the long-deprecated `util.isError()` (confirmed live in the running
container: `docker exec api node -e "console.log(typeof require('util').isError)"` →
`undefined`). `bagpipes` (a dependency of devicefarm's Swagger/Express API framework)
still calls it unconditionally inside its own error handler:

```
/app/node_modules/bagpipes/lib/bagpipes.js:184
  if (!util.isError(err)) { err = new Error(JSON.stringify(err)) }
```

So **any** error reaching `Bagpipes.handleError` — a Swagger request-body validation
failure (`swagger_params_parser.js` → `finishedParseBody`, the case actually observed), an
outbound `ETIMEDOUT`, or anything else — throws `TypeError: util.isError is not a function`
from inside the error handler itself, which is uncaught and kills the whole Node process.
This is the same class of breakage as the Angular `lowercase`/`uppercase` removal already
patched in `res/app/app.js:5-18` for the same Node 24 upgrade — a legacy API the upgrade
dropped that a bundled dependency still assumes exists.

The `api` service in `df/deploy_master/docker-compose.yaml` also has **no `restart`
policy**, so once it crashes it stays down until someone manually runs `docker start api`.

### Evidence

```
TypeError: util.isError is not a function
    at Bagpipes.handleError (/app/node_modules/bagpipes/lib/bagpipes.js:184:13)
    at Runner.<anonymous> (/app/node_modules/bagpipes/lib/bagpipes.js:177:12)
    ...
    at /app/node_modules/autodesk-forks-swagger-node-runner/fittings/swagger_params_parser.js:43:7
    at finishedParseBody (.../swagger_params_parser.js:128:12)
```
`df-nginx` access log at the same timestamp: `POST /api/v1/user/forceSessionExternalService`
→ first attempt `502 upstream prematurely closed connection`, all subsequent retries
`502 connect() failed (111: Connection refused)` (process already dead).

### Fix options (not yet applied)

1. **(Recommended) Restore the missing API with a faithful shim** — add back
   `util.isError` exactly as Node's own removed implementation defined it
   (`Object.prototype.toString.call(e) === '[object Error]' || e instanceof Error`), loaded
   once in `lib/cli/please.js` (or wherever it delegates to) so every unit (`api`, `app`,
   `websocket`, `provider`, ...) gets it before any unit code runs — same pattern as the
   Angular polyfill. Zero logic-flow change: it just makes the check bagpipes always relied
   on work again, so the framework goes back to returning a normal HTTP error instead of
   crashing. Fixes the whole crash *class*, not just this one trigger.
2. **Add `restart: unless-stopped` to devicefarm services** in `docker-compose.yaml` — safety
   net so a crash from *any* cause (this bug or something else) doesn't mean extended
   downtime. Complementary to #1, not a substitute — without #1 the service would just
   crash-loop on the same recurring trigger.
3. **(Optional, narrower) Fix the specific `userId` type mismatch** between atomid and
   devicefarm's Swagger schema (`ForceUserSessionPayload.userId: integer` — likely receiving
   a string). Only closes this one trigger; the underlying fragility (any other validation
   error crashes the whole process for all users) remains.

---

## 2. Linux Host Unit (ccIC) devices: mac_address instability, transaction-parse crash, wrong stream port, missing company_id

- **Status:** FIXED AND DEPLOYED (this machine only — not yet propagated to hopium/other
  targets or repacked into the bundle).
- **Found:** 2026-07-16, while getting a manually-added ccIC Host Unit device working.
- **Chain of four distinct bugs, each masking the next:**
  1. `provider` (provider-linux) had no `--local-ip` pinned (unlike `provider-android`), so
     it fell back to `my-local-ip`'s auto-detection — unstable on this host's many network
     interfaces (Docker bridges/veths churn constantly). Every restart registered a new
     `mac_address` in the `providers` table, orphaning previously-known Host Unit devices
     (`getProvider` matches by exact `mac_address`+`type`). **Fix:** pinned
     `--local-ip "${DOMAIN}"` in `df/deploy_master/docker-compose.yaml` and the live
     `atomp-bundle/config/df/docker-compose.yaml`.
  2. Three duplicate `providers` rows had accumulated the same `mac_address` from past IP
     drift (`getProvider` requires an exact single match, silently returns "not found" on
     ambiguity — this is correct, cautious behavior, not a bug to fix in code). **Fix:**
     one-time rethinkdb cleanup, deleted the 2 stale duplicates, kept the one the device
     record already pointed to.
  3. `provider-linux/index.js`'s `TransactionDoneMessage` handler did
     `JSON.parse(message.body)` with no try/catch (unchanged since Nov 2022, confirmed via
     `git log -p -L`, and still unguarded even on `origin/prod/base-HU` — production just
     never triggers it because production doesn't have this host's interface instability).
     Once fix #1 let this provider receive a real transaction response for the first time,
     an empty-body case (`reply.okay('provider')` with no second arg is a normal, expected
     call pattern elsewhere in this codebase) crashed the whole process, crash-looping every
     ~10s. **Fix:** wrapped in try/catch, logs and skips the malformed transaction instead of
     crashing; valid transactions are handled identically to before.
  4. Even after 1-3, the device stayed grey-screen for other LAN machines (worked from this
     one) — `provider`'s `--stream-gate-client-pattern` (the actual browser-facing video
     stream URL, confirmed via `device-linux/plugins/screen/options.js:11-13`) was still
     `ws://<ip>:8180/c`, never migrated to the port-80 path when `provider-android` was.
     Machines behind a LAN policy that blocks non-standard ports (the whole reason that
     migration happened) get a silently-failed WebSocket and a grey screen. **Fix:** changed
     to `ws://${DOMAIN}/devicefarm/c`, matching `provider-android`.
  5. Separately, the device was invisible to Studio (and would be to any company-scoped
     query) — `createDevice()` in `atom-device-farm/lib/units/api/controllers/devices.js`
     (the "Add New Screen" handler) never sets `group.company_id` when building a
     manually-created Host Unit device record, unlike whatever path auto-assigns `-1` for
     Android devices (confirmed: every real Android device has `group.company_id: -1`; both
     ccIC sub-screens had it `undefined`, entirely excluded by
     `loadDevicesByCompanyId`'s exact-match-or-`-1` filter). **Fix applied:** one-time data
     patch (`company_id: -1` merged onto both device records) — **not yet fixed in code**,
     so the *next* manually-added screen will hit this same invisibility bug again. The
     actual `groups-engine`-driven group-assignment path for Host Units hasn't been traced
     yet; a real code fix needs that first so it doesn't get silently overwritten.

---

## 3. Devicefarm Logout button appears to do nothing — hangs on unreachable default session-cleanup URLs

- **Status:** FIXED AND DEPLOYED (this machine only).
- **Found:** 2026-07-16, "can't press logout button on devicefarm."
- **Root cause:** `lib/cli/api/index.js:102-109` — the `--remove-user-session-atomid` and
  `--remove-user-session-tester40` CLI options default to `http://10.38.70.68:3500/...` and
  `http://10.38.70.68:3000/...` (an unrelated, unreachable dev-machine IP), and
  `df/deploy_master/docker-compose.yaml`'s `api` service never passed either flag. Every
  logout calls `fetch()` on both dead URLs with **no timeout** on either the backend `fetch`
  calls (`lib/units/api/controllers/user.js`'s `logout()`) or the frontend's
  `$http.post('/api/v1/user/logout')` — so the whole request just hangs indefinitely with no
  error shown, looking exactly like an unresponsive button.
- **Fix:** added `--remove-user-session-atomid "${ATOMID_URL}/api/auth/force-user-session"`
  and `--remove-user-session-tester40 "http://${DOMAIN}/tester40/api/users/force-user-session"`
  to the `api` service in both compose files, pointing at the real, reachable endpoints
  (mirroring the URL pattern already confirmed working for
  `force-user-session-external-service`).
- **Not yet fixed:** no timeout was added to either fetch call — if the real URLs ever
  become unreachable again (service down, network change), the same hang would recur. Worth
  adding a timeout (e.g. matching studio-web's 30s `node-fetch` pattern) as defense in depth,
  not done here since it wasn't needed to resolve the immediate symptom.

---

## 4. Studio "Failed to start new session" on Linux devices — remote-linux-driver service never deployed

- **Status:** FIXED AND DEPLOYED (this machine only — not yet in the bundle repack or
  hopium). Built `linuxremote-web:node20` from `atomp-appium-linux` (its own repo Dockerfile,
  Node 20, live `npm install` — not the legacy `build_image/Dockerfile/linuxremote-web_Dockerfile`
  variant, which uses Node 10 and an offline node_modules tarball). The repo was missing its
  `authkey/service-publickey.pem` + `client-publickey.pem` (required by its own Dockerfile's
  COPY step) — recovered from `build_image/setup_data_folder/linuxremote-web/authkey/`, a
  prior abandoned attempt at wiring this up; confirmed byte-identical to the same atomid
  service key used everywhere else in this stack. Deployed via `docker run` (port `4722:3000`,
  `atomp_automation_network`) added to `bundle/start_all.sh` (section 7c, plus the
  `load_image` line), mirroring the `atomp-ai` pattern exactly. No studio-web config change
  needed — `STUDIO_APPIUM_HOST` already pointed at this address, it just had nothing
  listening. Confirmed the port now responds (previously `ECONNREFUSED`).
- **Found:** 2026-07-16, clicking a Linux ccIC device in Studio: `Failed to start new
  session — request to http://10.193.9.71:4722/remote-linux/api/connect failed, reason:
  connect ECONNREFUSED 10.193.9.71:4722`.
- **Root cause:** studio-web's `LinuxDriver` (`studio-web/app/utilities/linuxdriver.js`)
  calls out to a separate microservice at `appium.portLinux` (defaults to `4722`,
  `studio-web/config/environments/*/server.json`) for `/remote-linux/api/connect` — this is
  **not** devicefarm's own Appium-proxy path, it's an entirely different service. That
  service's source is `atomp-appium-linux/server.js` (a sibling repo, confirmed serving
  exactly `/remote-linux/api/*` and listening on `runTimeConfig.port`). It's tracked and
  pulled by `nightly_rebuild.sh` (line 55, 75) but **never actually started** anywhere —
  not in `start_all.sh`, `bundle/start_all.sh`, or any docker-compose file. Nothing has ever
  listened on port 4722 in this deployment. Same class of gap as the `atomp-ai` service,
  which was "previously absent from every bundle... only ever existed as a one-off manual
  `docker run`" before that was fixed.
- **To fix:** `atomp-appium-linux` has both a `Dockerfile` and a `package.json` `"prod"`
  script (`NODE_ENV=production node server.js`) — buildable the same way `atomp-ai` was.
  Needs: build the image, add it as a service (docker-compose or a `docker run` block in
  `start_all.sh`, matching the `atomp-ai` pattern), and wire up whatever config it needs
  (host/port at minimum — its own `config/environments/*/server.json` hasn't been read yet
  to enumerate the full set, e.g. does it need its own devicefarm/appium auth wiring).
