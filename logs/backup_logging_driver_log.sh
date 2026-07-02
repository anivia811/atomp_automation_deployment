#!/bin/bash

# Check if the script is run by root
if [[ $EUID -ne 0 ]]; then
    echo "This script must be run as root."
    exit 1
fi

# Source directory where log files are located
source_dir="/var/lib/docker/containers"

# Target base directory for log backups
target_base_dir="./logs"

# Containers to exclude from backup
exclude_containers=("tester40-web" "studio-web" "")

# Get the current date in the format: year-month-day
current_date=$(date +"%Y-%m-%d")

# Create the target directory structure
target_dir="$target_base_dir/$current_date"
mkdir -p "$target_dir"

# Loop through all containers
for container_id in $(docker ps -q); do
    # Get the container name
    container_name=$(docker inspect --format '{{.Name}}' "$container_id")
    container_name=${container_name:1}  # Remove the leading '/'
    full_container_id=$(docker inspect --format="{{.ID}}" $container_name)

    # Check if the container should be excluded from backup
    if [[ "${exclude_containers[@]}" =~ "$container_name" ]]; then
        echo "Skipping backup for container: $container_name"
        continue
    fi
    
    # Get the logging driver for the container
    logging_driver=$(docker inspect --format='{{.HostConfig.LogConfig.Type}}' "$full_container_id")

    # Determine log file path based on the logging driver
    case "$logging_driver" in
        "json-file")
            log_file_path="$source_dir/$full_container_id/${full_container_id}-json.log"
            ;;
        "syslog")
            log_file_path=""
            echo "Skipping backup for container: $full_container_id (syslog logging driver)"
            continue
            ;;
        "journald")
            log_file_path=""
            echo "Skipping backup for container: $full_container_id (journald logging driver)"
            continue
            ;;
        *)
            log_file_path=""
            echo "Skipping backup for container: $full_container_id (unsupported logging driver)"
            continue
            ;;
    esac

    # Backup the log file if it exists
    if [[ -f "$log_file_path" ]]; then
        # Move log file to the target directory
        log_file_name="${full_container_id}.log"
        mv "$log_file_path" "$target_dir/$log_file_name"
        echo "Backed up log file for container: $full_container_id"
    else
        echo "No log file found for container: $full_container_id"
    fi
done

echo "Log backup completed."