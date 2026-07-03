#!/bin/bash
# switch_ip.sh — tự detect IP hiện tại rồi reconfig toàn bộ ATOMP
# Usage: bash switch_ip.sh [NEW_IP]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

NEW_IP="${1:-$(hostname -I | awk '{print $1}')}"

echo "==> Switching ATOMP to IP: $NEW_IP"
bash "$SCRIPT_DIR/reconfig_ip.sh" "$NEW_IP"
