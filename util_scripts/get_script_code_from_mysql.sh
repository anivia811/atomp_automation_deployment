#!/bin/bash

SCRIPT_ID=8682
TYPE=1 # 1 - scriptFile, 2 - stepFile
#Ref: https://stackoverflow.com/questions/192249/how-do-i-parse-command-line-arguments-in-bash
POSITIONAL_ARGS=()
while [[ $# -gt 0 ]]; do
  case $1 in
    -id|--id)
      SCRIPT_ID="$2"
      shift # past argument
      shift # past value
      ;;
    -t|--type)
      TYPE="$2"
      shift # past argument
      shift # past value
      ;;
    -*|--*)
      echo "Unknown option $1"
      exit 1
      ;;
    *)
      POSITIONAL_ARGS+=("$1") # save positional arg
      shift # past argument
      ;;
  esac
done

# Function to remove trailing slash
remove_trailing_slash() {
  local input=$1
  local result=""

  # Check if the input ends with a slash
  if [[ $input == */ ]]; then
    # Remove the trailing slash
    result=${input%?}
  else
    result=$input
  fi

  echo "[remove_trailing_slash] $result"
}
# Function to get value after the last /
get_value_after_last_slash() {
  local input=$1
  local result=""

  # Check if the input contains /
  if [[ $input == */* ]]; then
    # Use parameter expansion to extract the value after the last /
    result="${input##*/}"
  else
    # No / found, return the input itself
    result=$input
  fi

  echo "$result"
}

# ****************************************************************************************
# ****************************************************************************************

# MySQL Connection Details
DB_HOST="0.0.0.0"
PORT=3306
DB_USER="root"
DB_PASSWORD="asdwer321"
DB_NAME="t4_hae_webserver"
STORAGE_DB_NAME="sto_hae_webserver"
STORAGE_PATH=/Users/duytq11/projects/fsoft/atomp/atomp_automation_deployment/app_data/storage_webserver/uploads

# Query
QUERY="SELECT testScript FROM Test_Cases WHERE id=$SCRIPT_ID;"

# Execute MySQL query and capture the response
# response=$(mysql -h $DB_HOST -P $PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME -se "$QUERY")
response=$(docker exec mysql-srv mysql -h $DB_HOST -P $PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME -se "$QUERY")

# Check if the query was successful
if [ $? -ne 0 ]; then
  # Handle error
  echo "[main] Error executing the query: $response"
  exit 1
fi

if [ -z "$response" ]; then
  echo "[main] No result found."
  exit 1
fi

echo "[main] response: $response"

autoScript=$(echo "$response" | jq -r '.autoScript')
stepFile=$(echo "$autoScript" | jq -r '.stepFile')
scriptFile=$(echo "$autoScript" | jq -r '.scriptFile')
echo "stepFile: $stepFile"
echo "scriptFile: $scriptFile"

scriptFile=$(remove_trailing_slash "$scriptFile")
stepFile=$(remove_trailing_slash "$stepFile")

if [[ $TYPE = 1 ]]; then
  fileId=$(get_value_after_last_slash "$scriptFile")
else
  fileId=$(get_value_after_last_slash "$stepFile")
fi
echo "fileId: $fileId"


# Storage Query
STORAGE_QUERY="SELECT path FROM files WHERE uuid='$fileId';"

# Execute MySQL query and capture the response
# sto_response=$(mysql -h $DB_HOST -P $PORT -u $DB_USER -p$DB_PASSWORD $STORAGE_DB_NAME -se "$STORAGE_QUERY")
sto_response=$(docker exec mysql-srv mysql -h $DB_HOST -P $PORT -u $DB_USER -p$DB_PASSWORD $STORAGE_DB_NAME -se "$STORAGE_QUERY")


# Check if the query was successful
if [ $? -ne 0 ]; then
  # Handle error
  echo "[main] Error executing the query: $sto_response"
  exit 1
fi

if [ -z "$sto_response" ]; then
  echo "[main] No result found."
  exit 1
fi

file_path=$STORAGE_PATH$sto_response
code $file_path
