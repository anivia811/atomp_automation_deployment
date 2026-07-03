#!/bin/bash

# Define host-port pairs
HOSTS_AND_PORTS=(
    "10.243.103.54:80"
    "10.243.103.54:443"
    "10.243.103.54:8080"
)

LOG_FILE="connection_test.log"
INTERVAL=2  # Time in seconds between each test

# Function to test each host-port pair
test_connections() {
    for ENTRY in "${HOSTS_AND_PORTS[@]}"; do
        HOST="${ENTRY%%:*}"
        PORT="${ENTRY##*:}"
        {
            TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
            echo "[$TIMESTAMP] Testing $HOST:$PORT" >> "$LOG_FILE"
            nc -zv -w 5 "$HOST" "$PORT" >> "$LOG_FILE" 2>&1
        } &
    done
    wait
}

# Main loop
while true; do
    test_connections
    sleep "$INTERVAL"
done
