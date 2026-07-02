#!/usr/bin/env bash
# =============================================================================
# run_atomid.sh -- Deploy ATOMID exactly as it runs in production on this host.
#
# WHY this exists (not docker-compose):
#   The live atomid container is a plain `docker run` (predates ATOMID_Deployment
#   compose) and needs 3 things the compose does NOT capture:
#     1. image atomid/web:b-local-20260702  (rebuilt from atom-id-web source,
#        node20 base + express5 compat shim -- see build_image/build_atomid.sh)
#     2. the patched client bundle mounted over the hashed main.js
#     3. host port publish 8081 (nginx upstream atomid = 127.0.0.1:8081)
#   Recreating atomid via `docker run` (NOT compose up) also keeps the fixed
#   IP 10.20.0.2 so atomid-mysql/redis (10.20.0.3/.4) stay reachable.
#
# Usage:  bash run_atomid.sh
# Prereqs: atomid-mysql + atomid-redis already up (bash start.sh), docker network
#          atomid_deployment_atomid exists, image ATOMID_IMAGE present.
# =============================================================================
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ATOMID_IMAGE="atomid/web:b-local-20260702"
ATOMID_NET="atomid_deployment_atomid"
ATOMID_IP="10.20.0.2"
ATOMID_HOST_PORT="8081"          # nginx upstream atomid -> 127.0.0.1:8081
# Hashed client bundle the patched main.js overrides (must match ATOMID_IMAGE's build)
MAIN_JS_HASH="main.93e90d685d9c5b7590d2.js"

APPENV="$SCRIPT_DIR/script/deploy/appenv"

# sanity checks --------------------------------------------------------------
docker image inspect "$ATOMID_IMAGE" >/dev/null 2>&1 || {
  echo "!! image $ATOMID_IMAGE missing -> build it first: bash ../build_image/build_atomid.sh"; exit 1; }
[ -f "$SCRIPT_DIR/patched/main.js" ] || { echo "!! patched/main.js missing"; exit 1; }
for f in server.json database.json client-privatekey.pem client-publickey.pem \
         service-privatekey.pem service-publickey.pem; do
  [ -f "$APPENV/$f" ] || { echo "!! missing $APPENV/$f"; exit 1; }
done

echo ">> (re)creating atomid from $ATOMID_IMAGE"
docker rm -f atomid >/dev/null 2>&1

docker run -d --name atomid \
  --network "$ATOMID_NET" --ip "$ATOMID_IP" \
  -p "${ATOMID_HOST_PORT}:8081" \
  -v "$APPENV/server.json":/app/config/environments/production/server.json \
  -v "$APPENV/database.json":/app/config/environments/production/database.json \
  -v "$APPENV/client-privatekey.pem":/config/client-privatekey.pem \
  -v "$APPENV/client-publickey.pem":/config/client-publickey.pem \
  -v "$APPENV/service-privatekey.pem":/config/service-privatekey.pem \
  -v "$APPENV/service-publickey.pem":/config/service-publickey.pem \
  -v "$SCRIPT_DIR/uploads":/app/public/uploads \
  -v "$SCRIPT_DIR/patched/main.js":/app/public/${MAIN_JS_HASH} \
  "$ATOMID_IMAGE" node server.js

echo -n ">> waiting for atomid to serve on :${ATOMID_HOST_PORT} "
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:${ATOMID_HOST_PORT}/atomid/login" 2>/dev/null)
  [ "$code" = "200" ] && { echo "OK (200)"; exit 0; }
  echo -n "."; sleep 3
done
echo " TIMEOUT (last=$code) -- check: docker logs atomid"
exit 1
