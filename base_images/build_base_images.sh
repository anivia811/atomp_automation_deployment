#!/usr/bin/env bash
# build_base_images.sh — Build the small custom Node base images that
# tester40-web/client, studio-web, and storage-web's Dockerfiles expect
# (node:20-bookworm-slim-atomp, node:20-angular7-atomp,
# node:20-slim-gettextbase). These were never real Docker Hub images — only
# ever built once, locally, on the original dev machine — so a fresh machine
# building from source hits "failed to resolve source metadata" until these
# exist locally too. Fast (~1-2 min total, no big downloads).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[base-images] Building node:20-bookworm-slim-atomp..."
docker build -t node:20-bookworm-slim-atomp \
  -f "$SCRIPT_DIR/Dockerfile.node20-bookworm-slim-atomp" "$SCRIPT_DIR"

echo "[base-images] Building node:20-angular7-atomp..."
docker build -t node:20-angular7-atomp \
  -f "$SCRIPT_DIR/Dockerfile.node20-angular7-atomp" "$SCRIPT_DIR"

echo "[base-images] Building node:20-slim-gettextbase..."
docker build -t node:20-slim-gettextbase \
  -f "$SCRIPT_DIR/Dockerfile.node20-slim-gettextbase" "$SCRIPT_DIR"

echo "[base-images] Done."
