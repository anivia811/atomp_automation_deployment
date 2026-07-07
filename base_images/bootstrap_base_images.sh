#!/usr/bin/env bash
# bootstrap_base_images.sh — Self-contained emergency fix: builds the 3
# custom Node base images (node:20-bookworm-slim-atomp, node:20-angular7-atomp,
# node:20-slim-gettextbase) that tester40-web/client, studio-web, and
# storage-web's Dockerfiles depend on. These were never real Docker Hub
# images, so `docker build` fails with "failed to resolve source metadata"
# on any machine that hasn't built them before.
#
# This script embeds the Dockerfile content directly (via heredoc) so it can
# be copied to another machine as a single file — no need to sync the
# separate Dockerfile.* files in this directory first. build_all.sh calls
# those directly on machines that already have the full repo; use this one
# when you only have this one file (e.g. relaying a fix to an already-copied,
# now-stale bundle on a different machine).
#
# Usage: bash bootstrap_base_images.sh
set -euo pipefail

WORKDIR="$(mktemp -d "./.atomp-base-fix.XXXXXX")"
WORKDIR="$(cd "$WORKDIR" && pwd)"
trap 'rm -rf "$WORKDIR"' EXIT

echo "[base-images] Building node:20-bookworm-slim-atomp..."
cat > "$WORKDIR/Dockerfile.bookworm-atomp" <<'EOF'
FROM node:20-bookworm-slim
RUN apt-get update && \
    apt-get install -y gettext-base && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
EOF
docker build -t node:20-bookworm-slim-atomp -f "$WORKDIR/Dockerfile.bookworm-atomp" "$WORKDIR"

echo "[base-images] Building node:20-angular7-atomp..."
cat > "$WORKDIR/Dockerfile.angular7-atomp" <<'EOF'
FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y \
      gettext-base zip unzip build-essential python3 && \
    ln -sf /usr/bin/python3 /usr/local/bin/python && \
    rm -rf /var/lib/apt/lists/*
RUN npm install -g @angular/cli@7 --legacy-peer-deps
RUN npm install -g sass --legacy-peer-deps
EOF
docker build -t node:20-angular7-atomp -f "$WORKDIR/Dockerfile.angular7-atomp" "$WORKDIR"

echo "[base-images] Building node:20-slim-gettextbase..."
cat > "$WORKDIR/Dockerfile.slim-gettextbase" <<'EOF'
FROM node:20-slim
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends gettext-base python3 build-essential && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
EOF
docker build -t node:20-slim-gettextbase -f "$WORKDIR/Dockerfile.slim-gettextbase" "$WORKDIR"

echo "[base-images] Done. You can now re-run start_all.sh / build_all.sh."
