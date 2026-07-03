#!/bin/bash
# ATOMP Automation Platform — Rebuild all service Docker images
# Usage: bash build_all.sh
# Builds images with the tags expected by run_app.sh / start_all.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
AUTHKEY_SRC="$SCRIPT_DIR/ATOMID_Deployment/script/deploy/appenv"
# Tìm dotnet SDK tarball trong origin_note (không dùng path ngoài)
DOTNET_SDK_TAR=$(find "$ROOT_DIR" -name "dotnet-sdk-*.tar.gz" -maxdepth 6 2>/dev/null | head -1)

# Tạo lib_setup/ và authkey/ nếu thiếu (một số Dockerfile yêu cầu 2 folder này)
prep() {
  local ctx="$1"
  # lib_setup: chỉ cần setup.sh rỗng; Dockerfile chạy || true nên không fail
  if [ ! -d "$ctx/lib_setup" ]; then
    mkdir -p "$ctx/lib_setup"
    echo "#!/bin/sh" > "$ctx/lib_setup/setup.sh"
    echo "[PREP] created $ctx/lib_setup"
  fi
  # authkey: cần 4 file PEM cho JWT
  if [ ! -d "$ctx/authkey" ]; then
    mkdir -p "$ctx/authkey"
    cp "$AUTHKEY_SRC/client-privatekey.pem"  "$ctx/authkey/"
    cp "$AUTHKEY_SRC/client-publickey.pem"   "$ctx/authkey/"
    cp "$AUTHKEY_SRC/service-privatekey.pem" "$ctx/authkey/"
    cp "$AUTHKEY_SRC/service-publickey.pem"  "$ctx/authkey/"
    echo "[PREP] copied authkeys → $ctx/authkey"
  fi
}

# Tạo serving_up_static_file_server/ cho client apps (Angular/React)
# Dockerfile dùng pre-installed node_modules trong folder này để serve built files
prep_static_server() {
  local ctx="$1"
  local srv="$ctx/serving_up_static_file_server"
  if [ -d "$srv" ] && [ -d "$srv/node_modules" ]; then return; fi
  mkdir -p "$srv/public"
  cat > "$srv/server.js" << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(port, () => console.log('Serving on port ' + port));
EOF
  cat > "$srv/package.json" << 'EOF'
{
  "name": "serving_up_static_file_server",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": { "express": "^4.18.0" }
}
EOF
  echo "[PREP] npm install in $srv..."
  (cd "$srv" && npm install --silent --no-fund)
  echo "[PREP] created $srv"
}

prep_storage() {
  local ctx="$1"
  local mod_dir="$ctx/ubuntu_nodemodule/node_modules"
  if [ -d "$mod_dir" ]; then return; fi
  echo "[PREP] npm install for storage (Node 20 container to match runtime)..."
  mkdir -p "$ctx/ubuntu_nodemodule"
  docker run --rm \
    -v "$ctx:/app" \
    -w /app \
    node:20-bookworm-slim \
    sh -c "npm install --legacy-peer-deps --silent --no-fund && mv node_modules ubuntu_nodemodule/"
  echo "[PREP] created $mod_dir"
}

prep_dotnet() {
  local ctx="$1"
  local dotnet_dir="$ctx/dotnet_root"
  if [ -d "$dotnet_dir" ]; then return; fi
  if [ ! -f "$DOTNET_SDK_TAR" ]; then
    echo "[WARN] dotnet SDK tarball not found: $DOTNET_SDK_TAR" >&2
    echo "[WARN] Creating empty dotnet_root — tasker .NET features may not work" >&2
    mkdir -p "$dotnet_dir"
    return
  fi
  echo "[PREP] Extracting dotnet SDK → $dotnet_dir ..."
  mkdir -p "$dotnet_dir"
  tar -xzf "$DOTNET_SDK_TAR" -C "$dotnet_dir"
  echo "[PREP] dotnet_root ready"
}

build_image() {
  local name="$1"
  local tag="$2"
  local context="$3"
  echo ""
  echo "============================================"
  echo "[BUILD] $name  =>  $tag"
  echo "        context: $context"
  echo "============================================"
  docker build $NO_CACHE -t "$tag" "$context"
  echo "[DONE] $name built as $tag"
}

# --no-cache flag support
NO_CACHE=""
for arg in "$@"; do
  [ "$arg" = "--no-cache" ] && NO_CACHE="--no-cache"
done

echo ""
echo "=== ATOMP Image Build ==="
echo "Root: $ROOT_DIR"
[ -n "$NO_CACHE" ] && echo "Mode: FORCE REBUILD (no cache)"

prep "$ROOT_DIR/atom-tester40-webserver"
build_image "tester40-web"    "tester40-web:node20"    "$ROOT_DIR/atom-tester40-webserver"

prep_static_server "$ROOT_DIR/atom-tester40-clientapp"
build_image "tester40-client" "tester40-client:node20" "$ROOT_DIR/atom-tester40-clientapp"

prep "$ROOT_DIR/atom-tasker"
prep_dotnet "$ROOT_DIR/atom-tasker"
build_image "tasker-web"      "tasker-web:node22"      "$ROOT_DIR/atom-tasker"

prep "$ROOT_DIR/atom-studio-server"
build_image "studio-web"      "studio-web:node20"      "$ROOT_DIR/atom-studio-server"

prep_static_server "$ROOT_DIR/atom-studio-client"
build_image "studio-client"   "studio-client:node20"   "$ROOT_DIR/atom-studio-client"

prep "$ROOT_DIR/atom-storage"
prep_storage "$ROOT_DIR/atom-storage"
build_image "storage-web"     "storage-web:node20"     "$ROOT_DIR/atom-storage"

echo ""
echo "=== All images built ==="
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}" \
  | grep -E "REPOSITORY|tester40|tasker|studio|storage"
