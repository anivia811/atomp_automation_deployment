#!/bin/bash

# Get the date of two days ago (for macOS)
# two_days_ago=$(date -v -2d +"%Y-%m-%d")
# For linux
two_days_ago=$(date -d "2 days ago" +"%Y-%m-%d")

# Print the result
echo "The date two days ago was: $two_days_ago"

FOLDER_PATH=/tmp

# Remove folder named <uuid v4>
find $FOLDER_PATH -type d -name '*-4*'  -not -newermt $two_days_ago -exec rm -rf {} + 2>/dev/null
find $FOLDER_PATH -type f -name '*.log' -not -newermt $two_days_ago -exec rm {} + 2>/dev/null
find $FOLDER_PATH -type f -name '*.dlt' -not -newermt $two_days_ago -exec rm {} + 2>/dev/null
find $FOLDER_PATH -type f -name '*.zip' -not -newermt $two_days_ago -exec rm {} + 2>/dev/null

# find $FOLDER_PATH -type d -name '*-4*'  -not -newermt $two_days_ago
# find $FOLDER_PATH -type f -name '*.log' -not -newermt $two_days_ago
# find $FOLDER_PATH -type f -name '*.dlt' -not -newermt $two_days_ago
# find $FOLDER_PATH -type f -name '*.zip' -not -newermt $two_days_ago

######### MacOS
# # Changing the modification date
# touch -mt YYYYMMDDHHMM file.txt

# # Set a specific creation date
# SetFile -d "YYYY-MM-DD HH:MM:SS" file.txt

######### Linux
# # Changing the last modification date
# touch -m -d "YYYY-MM-DD HH:MM:SS" filename

# # Changing the last access date
# touch -a -d "YYYY-MM-DD HH:MM:SS" filename

# # Changing the creation date (if supported by the file system)
# touch -t YYYYMMDDHHMM filename
