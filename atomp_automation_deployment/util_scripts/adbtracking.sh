#!/bin/sh

LOG_DIR="/Users/duytq11/Downloads/hae_works/273-26/adb-tracking"
LOG_FILE="$LOG_DIR/devices.log"

mkdir -p "$LOG_DIR"

echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] adb track-devices started" >> "$LOG_FILE"

# # Ensure adb server is running
# adb start-server

# Track device changes
adb track-devices | while read line; do
  echo "$(date '+%Y-%m-%d %H:%M:%S') $line" >> "$LOG_FILE"
done