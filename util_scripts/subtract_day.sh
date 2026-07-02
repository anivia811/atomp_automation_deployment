#!/bin/bash

# Get the date of two days ago (for macOS)
two_days_ago=$(date -v -2d +"%Y-%m-%d")

# Print the result
echo "The date two days ago was: $two_days_ago"
