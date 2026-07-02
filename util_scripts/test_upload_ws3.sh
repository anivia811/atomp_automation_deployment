#!/usr/local/bin/bash
# NO_PROXY="AA"
# APP_NAME="studio-weba"
# if [ ! -z "$NO_PROXY" ] && [ $APP_NAME = "tester40-web" -o $APP_NAME = "studio-web" ]; then
#   echo "jooo"
# fi
NGINX_SERVER_PUBLIC_URL="https://r-auto.atomp.io"
STUDIO_WEBSERVER_PUBLIC_SOCKET_URL="$NGINX_SERVER_PUBLIC_URL/studio/socket"
replace_protocol_str="https://"
new_protocol_str="wss://"
STUDIO_WEBSERVER_PUBLIC_SOCKET_URL=${STUDIO_WEBSERVER_PUBLIC_SOCKET_URL/$replace_protocol_str/$new_protocol_str}
# echo $STUDIO_WEBSERVER_PUBLIC_SOCKET_URL

# source_code="./logs"
# if [ -d "$source_code/abc" ]; then
#   echo "Existed"
# fi

# myfile=/Users/duytq11/projects/fsoft/atomp/misc/atomp_automation_deployment/build_image/Dockerfile/tasker-web_Dockerfile
# filtered_data=$(grep -v '^ *#' $myfile)

# echo "====="
# # echo $filtered_data
# if [[ $filtered_data == *"RUN npm install"* ]]; then
#   echo "RUN npm install command existed"
# fi

# name="tasker-web"
# echo "${name/"-"/"/"}"
# echo $name

# time_stamp="$(date '+%Y_%m_%d_%H_%M_%S')"
# time_stamp_parts=($(echo "$time_stamp" | tr '_' '\n'))
# echo ${time_stamp_parts[0]}
# echo ${time_stamp_parts[1]}

# is_success="true"
# echo "old directory before: ${OLDPWD}"

# if cd logs; then
#   echo "old directory after: ${OLDPWD}"
#   ls -ll
#   is_success="true true"
# else
#   is_success="failed"
# fi

# echo "old directory: ${OLDPWD}"
# echo $(pwd)
# echo $is_success
# echo "go back to ${OLDPWD}"
# cd $OLDPWD
# pwd

# SOURCE=${BASH_SOURCE[0]}
# while [ -L "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
#   DIR=$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )
#   SOURCE=$(readlink "$SOURCE")
#   [[ $SOURCE != /* ]] && SOURCE=$DIR/$SOURCE # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
# done
# DIR=$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )

# echo $DIR

# SAVE_IMAGE_TO_FILE=1
# if [ $SAVE_IMAGE_TO_FILE = 1 ]; then
#   echo "HOOOOOOO"
# fi

# APP="name-1"
# APP2="name-2"
# declare -A MYLIST
# MYLIST[$APP]=/Users/uname/projects/fsoft/atomp/misc/atomp_automation_deployment/build_image/output_images
# MYLIST[$APP2]=1

# for key in "${!MYLIST[@]}"
# do
#     echo "$key": ${MYLIST[$key]}
# done

# if [ ${MYLIST[$APP2]} = 0 ] && [ -d "${MYLIST[$APP]}" ]; then
#   echo "GGGGGGGGG"
# fi

export https_proxy="username:pass@10.16.29.21:8080" # http://uname:pass@proxy_host:proxy_port # NOTE: If your password contain @, covert it to %40
WORKSPACE_AUTHEN="WS3K.ATOM:Workspace@12345"
WORKSPACE_URL="https://ws3.fpt-software.vn/remote.php/webdav/Users/tmp"

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
  # response=$(curl -o /dev/null -w "%{http_code}" -u $WORKSPACE_AUTHEN -X "$method" --form 'myfile=@'"$filePath"'' "$url")
  response=$(curl -o /dev/null -w "%{http_code}" -u $WORKSPACE_AUTHEN -X "$method" -T "$filePath" "$url")
  echo "[MAIN][make_workspace_upload_request] COMPLETED REQUEST, STATUS_CODE=$response"
  if [[ $response -eq 200 ]] || [[ $response -eq 201 ]]; then
    echo "[MAIN][make_workspace_upload_request] Request successful. Response code: $response"
  else
    echo "[MAIN][make_workspace_upload_request] Error in curl request. Response code: $response"
  fi
}
make_workspace_upload_request "/Users/uname/projects/fsoft/atomp/misc/atomp_automation_deployment/build_image/output_images/linuxremote_web.tar.gz" &
make_workspace_upload_request "/Users/uname/projects/fsoft/atomp/misc/atomp_automation_deployment/build_image/output_images/tasker_web.tar.gz" &
wait