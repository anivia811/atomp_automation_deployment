#!/bin/bash
# Start Appium from monorepo source on port 4723
APPIUM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/appium"
LOG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/data/appium/logs"
mkdir -p "$LOG_DIR"

# Use system adb 28.0.2 — SDK adb 36.x has a bug where `adb -s <serial> forward`
# fails with "more than one device/emulator" when multiple devices are attached.
export ANDROID_HOME="/usr/lib/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

cd "$APPIUM_DIR"

# Kill any existing appium on 4723
pkill -f "node.*appium.*4723" 2>/dev/null || true
sleep 1

node packages/appium/index.js \
  --port 4723 \
  --address 0.0.0.0 \
  --base-path /wd/hub \
  --allow-insecure '*:adb_shell' \
  --log /tmp/appium.log \
  --log-level info \
  &

echo "Appium started with PID $! on port 4723"
echo "Log: $LOG_DIR/appium.log"
