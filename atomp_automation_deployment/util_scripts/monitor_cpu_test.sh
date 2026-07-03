#!/bin/bash

# Define the programs to monitor
programs=("xagt" "cpp-client-daemon" "epp-client" "epp")

# Output file for logging CPU usage
output_file="cpu_usage.log"

# Function to get CPU usage
get_cpu_usage() {
    for program in "${programs[@]}"; do
        # Get the CPU usage for the program
        cpu_usage=$(ps -C "$program" -o %cpu= | awk '{sum += \$1} END {print sum}')
        if [ -z "$cpu_usage" ]; then
            cpu_usage=0
        fi
        
        # Log the CPU usage with timestamp
        echo "$(date '+%Y-%m-%d %H:%M:%S') - $program CPU Usage: $cpu_usage%" >> "$output_file"
    done
}

# Run the CPU monitoring every 10 minutes indefinitely
while true; do
    get_cpu_usage
    sleep 600  # Sleep for 10 minutes (600 seconds)
done
