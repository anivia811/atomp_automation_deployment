#!/bin/bash

if [ `id -u` -ne 0 ]
  then echo Please run this script as root or using sudo!
  exit
fi

# Define variables
service_name="atom-id"
service_file="atom-id.service"
new_service_file="/home/nhunhatom/Documents/ATOM_ID/source/systemd_config/atom-id.service"

# Stop the service if it is running
echo "Stopping $service_name service..."
CMD="sudo systemctl stop $service_name"
echo "cmd: $CMD"
$CMD

# Copy the new service file to /etc/systemd/system
echo "Copying $new_service_file to /etc/systemd/system..."
CMD="sudo cp $new_service_file /etc/systemd/system/$service_file"
echo "cmd: $CMD"
$CMD

# Reload systemd to apply changes
echo "Reloading systemd..."
CMD="sudo systemctl daemon-reload"
echo "cmd: $CMD"
$CMD

echo "Starting $service_name service..."
CMD="sudo systemctl start $service_name"
echo "cmd: $CMD"
$CMD

# Enable the service to start on boot
CMD="sudo systemctl enable $service_name"
echo "cmd: $CMD"
$CMD

echo "Script execution completed."