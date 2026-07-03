#!/bin/bash

WORKSPACE_AUTHEN="WS3K.ATOM:Workspace@233"
# WORKSPACE_URL="https://ws3.fpt-software.vn/remote.php/webdav/Users/DuyTQ11/auto_linux_device/docker_images"
WORKSPACE_URL="https://ws3.fpt-software.vn/remote.php/webdav/Users/DuyTQ11/auto_linux_device/docker_images"

FILE_PATH=

#Ref: https://stackoverflow.com/questions/192249/how-do-i-parse-command-line-arguments-in-bash
POSITIONAL_ARGS=()
while [[ $# -gt 0 ]]; do
  case $1 in
    -f|--file)
      FILE_PATH="$2"
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

function make_workspace_upload_request() {
  # local url=$1
  # local method=${2:-GET}
  # local data=$3
  # local headers=$4
  local filePath=$1
  local filename=$(basename "$filePath")
  local url="$WORKSPACE_URL/$filename"
  local method=PUT
  echo "[MAIN][make_workspace_upload_request] STARTING... upload file $filePath to $url"
  response=$(curl -o /dev/null -w "%{http_code}" -u $WORKSPACE_AUTHEN -X "$method" -T "$filePath" "$url")
  echo "[MAIN][make_workspace_upload_request] COMPLETED REQUEST, STATUS_CODE=$response"
  if [[ $response -eq 200 ]] || [[ $response -eq 201 ]]; then
    echo "[MAIN][make_workspace_upload_request] Request successful. Response code: $response"
  else
    echo "[MAIN][make_workspace_upload_request] Error in curl request. Response code: $response"
  fi
}

make_workspace_upload_request "$FILE_PATH" &
