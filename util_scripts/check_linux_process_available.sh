#!/bin/bash

# Crontab sample:
## Every minute
## * * * * * /path/to/your/check_process.sh

## Every 2 minutes
## */2 * * * * /path/to/your/check_process.sh

# Name of the process to check
PROCESS_NAME="your_process_name"

# Log file path
LOG_FILE="/path/to/your/logfile.log"

# Delay between checks (in seconds)
DELAY=60  # 60 seconds = 1 minute

# Infinite loop to check the process periodically
while true; do
    # Get current date and time
    CURRENT_TIME=$(date "+%Y-%m-%d %H:%M:%S")

    # Get the PID(s) of the process
    PIDS=$(pgrep -x "$PROCESS_NAME")

    if [ -n "$PIDS" ]; then
        echo "$CURRENT_TIME - Process '$PROCESS_NAME' is running with PID(s): $PIDS" >> "$LOG_FILE"
    else
        echo "$CURRENT_TIME - Process '$PROCESS_NAME' is NOT running." >> "$LOG_FILE"
    fi

    # Wait before the next check
    sleep "$DELAY"
done
