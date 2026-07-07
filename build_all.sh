#!/bin/bash
# ATOMP Automation Platform — Rebuild all service Docker images
# Usage: bash build_all.sh
# Builds images with the tags expected by run_app.sh / start_all.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

build_image() {
  local name="$1"
  local tag="$2"
  local context="$3"
  echo ""
  echo "============================================"
  echo "[BUILD] $name  =>  $tag"
  echo "        context: $context"
  echo "============================================"
  docker build -t "$tag" "$context"
  echo "[DONE] $name built as $tag"
}

echo ""
echo "=== ATOMP Image Build ==="
echo "Root: $ROOT_DIR"

# tester40-web/client, studio-web, and storage-web's Dockerfiles FROM custom
# tags (node:20-bookworm-slim-atomp, node:20-angular7-atomp,
# node:20-slim-gettextbase) that were never real Docker Hub images — only
# ever built once, locally, on the original dev machine. Build them here so
# `docker build` below doesn't fail with "failed to resolve source metadata"
# on a machine that's never built them before. Fast (~1-2 min, cached after
# the first run).
bash "$SCRIPT_DIR/base_images/build_base_images.sh"

build_image "tester40-web"    "tester40-web:node20"    "$ROOT_DIR/tester40-web"
build_image "tester40-client" "tester40-client:node20" "$ROOT_DIR/tester40-client"
build_image "tasker-web"      "tasker-web:node22"      "$ROOT_DIR/tasker-web"
build_image "studio-web"      "studio-web:node20"      "$ROOT_DIR/studio-web"
build_image "studio-client"   "studio-client:node20"   "$ROOT_DIR/studio-client"
build_image "storage-web"     "storage-web:node20"     "$ROOT_DIR/storage-web"

echo ""
echo "=== All images built ==="
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}" \
  | grep -E "REPOSITORY|tester40|tasker|studio|storage"
