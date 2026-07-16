# Known Bugs

Live/latent bugs found during operation, not yet necessarily fixed. Distinct from
`KNOWN_IMAGE_PATCHES.md` (fixes already baked into shipped images) — entries here may
still be open. Add new bugs to the bottom as they're found; update `Status` in place once
addressed.

---

## 1. `api` container crashes and stays down on any devicefarm API validation/error (Node 24 `util.isError` removal)

- **Status:** FIXED IN SOURCE, NOT YET DEPLOYED — recurred 4 times this session before the
  fix was applied. `util.isError` shim added to `atom-device-farm/lib/cli/please.js`
  (options #1 from below) and `restart: unless-stopped` added to every devicefarm service in
  `df/deploy_master/docker-compose.yaml` that lacked one — `api`, `app`, `groups-engine`,
  `reaper`, `report`, `schedule-job`, `storage-temp`, `storage-permanent`,
  `storage-plugin-image/apk/ipa`, `stream-gate`, `stream-gate-audio`, `triproxy-app`,
  `triproxy-dev` (option #2). Deliberately **not** rebuilt/redeployed on the live local stack
  (testers were actively using it) — needs a devicefarm image rebuild + bundle repack to take
  effect, same as the `atomid` oAuthFsoft fix.
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
