#!/usr/local/bin/bash
#--/bin/bash
###!!! NOTE: Bash version >= 4 is required (for associative array work)
###!!! NOTE: Not support for zsh yet
if ((BASH_VERSINFO[0] < 4))
then
  echo "Sorry, you need at least bash-4.0 to run this script."
  exit 1
fi
# =========== # =========== # =========== #
# ATOMP DOCKER DEPLOYMENT SCRIPT
# Created at: 20220313-104500
# Updated at: 20220426-110200
# Version: v1.2
# =========== # =========== # =========== #

###============================================###
### ===>===>> SCRIPT CONFIGURATION <<<====== ###
###============================================###

# TODO: Need store /storage/upload to variable 

### Config deployment folder path
DEPLOYMENT_FOLDER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

#0: Do nothing
#1: Load/start new container from docker image id (the loaded image)
#2: Load docker image from compressed file & run/start new container using that image
DEPLOY_SCRIPT_MODE=1

### App name (container name). Config which app should be load/run
# 1 - Service app will be load/start
# 0 - Service app will not be load/start
declare -A SERIVCE_APP_NAME
SERIVCE_APP_NAME["tester40-client"]=1
SERIVCE_APP_NAME["tester40-web"]=1
SERIVCE_APP_NAME["tasker-web"]=1
SERIVCE_APP_NAME["studio-client"]=1
SERIVCE_APP_NAME["studio-web"]=1
SERIVCE_APP_NAME["storage-web"]=1
SERIVCE_APP_NAME["appium-web"]=0
SERIVCE_APP_NAME["testman-client"]=0
SERIVCE_APP_NAME["testman-web"]=0


declare -A DOCKER_IMAGE_ARCHIVED_FILES
DOCKER_IMAGE_ARCHIVED_FILES["tester40-client"]=$DEPLOYMENT_FOLDER/docker_images/tester40_client_node20.tar
DOCKER_IMAGE_ARCHIVED_FILES["tester40-web"]=$DEPLOYMENT_FOLDER/docker_images/tester40_web_node20.tar
DOCKER_IMAGE_ARCHIVED_FILES["tasker-web"]=$DEPLOYMENT_FOLDER/docker_images/tasker_web_node22.tar
DOCKER_IMAGE_ARCHIVED_FILES["studio-client"]=$DEPLOYMENT_FOLDER/docker_images/studio_client_node20.tar
DOCKER_IMAGE_ARCHIVED_FILES["studio-web"]=$DEPLOYMENT_FOLDER/docker_images/studio_web_node20.tar
DOCKER_IMAGE_ARCHIVED_FILES["storage-web"]=$DEPLOYMENT_FOLDER/docker_images/storage_web_node20.tar
DOCKER_IMAGE_ARCHIVED_FILES["appium-web"]=$DEPLOYMENT_FOLDER/docker_images/appium_web.tar
DOCKER_IMAGE_ARCHIVED_FILES["testman-client"]=$DEPLOYMENT_FOLDER/docker_images/testman_client.tar
DOCKER_IMAGE_ARCHIVED_FILES["testman-web"]=$DEPLOYMENT_FOLDER/docker_images/testman_web.tar

### Image ID (OPTIONAL)
declare -A SERIVCE_APP_IMAGE_ID
SERIVCE_APP_IMAGE_ID["tester40-client"]="tester40-client:node20"
SERIVCE_APP_IMAGE_ID["tester40-web"]="tester40-web:node20"
SERIVCE_APP_IMAGE_ID["tasker-web"]="tasker-web:node22"
SERIVCE_APP_IMAGE_ID["studio-client"]="studio-client:node20"
SERIVCE_APP_IMAGE_ID["studio-web"]="studio-web:node20"
SERIVCE_APP_IMAGE_ID["storage-web"]="storage-web:node20"
SERIVCE_APP_IMAGE_ID["appium-web"]=""
SERIVCE_APP_IMAGE_ID["testman-client"]=""
SERIVCE_APP_IMAGE_ID["testman-web"]=""

###============================================###
### ===>>> SERVICE APP CONFIGURATIONS <<<=== ###
###============================================###
declare -A APP_RUNNING_PORT_LIST
APP_RUNNING_PORT_LIST["testman-client"]=33220
APP_RUNNING_PORT_LIST["testman-web"]=33230
APP_RUNNING_PORT_LIST["tester40-client"]=34100
APP_RUNNING_PORT_LIST["tester40-web"]=33000
APP_RUNNING_PORT_LIST["tasker-web"]=33100
APP_RUNNING_PORT_LIST["appium-web"]="4723-4753"
APP_RUNNING_PORT_LIST["storage-web"]=6800
APP_RUNNING_PORT_LIST["studio-client"]=34200
APP_RUNNING_PORT_LIST["studio-web"]=33300

declare -A APP_WEBSOCKET_PORT_LIST
APP_WEBSOCKET_PORT_LIST["tester40-web"]=33030
APP_WEBSOCKET_PORT_LIST["studio-web"]=33350

# --------- Declare Server URL, Server IPv4 --------- #
# External service URL
ATOM_ID_URL="http://10.42.0.245/atomid"
DEVICE_FARM_URL="http://10.42.0.245:3700"
DEVICE_FARM_API_AUTH_KEY="studio-web-1782885942"
AI_SERVER_URL="http://localhost:1337"
BAMBOO_AUTOEVER_AUTHKEY=""
# Automation server IPv4 declaration (Private only)
TESTER40_SERVER_IPV4="10.42.0.245"
STUDIO_SERVER_IPV4="10.42.0.245"
STORAGE_SERVER_IPV4="10.42.0.245"
TESTMAN_SERVER_IPV4="10.42.0.245"
APPIUM_SERVER_IPV4="10.42.0.245"
MYSQL_SERVER_IPV4="mysql-auto" # Use "mysql-srv" if your mysql-container on same machine
REDIS_SERVER_IPV4="redis-auto" # Use "redis-srv" if your redis-container on same machine

# NGINX URL config (Let below values EMPTY if you NOT using nginx server)
# Forward request from /tester40, /tasker, /studio, /storage to its service
# NGINX_SERVER_PUBLIC_URL="https://10.38.70.65"
# NGINX_TESTER40_PATH="/tester40" # Meaning: "http://10.38.70.65/tester40", empty if not using nginx forward request
# NGINX_STUDIO_PATH="/studio"
NGINX_SERVER_PUBLIC_URL="http://10.42.0.245"
NGINX_TESTER40_PATH="/tester40"
NGINX_STUDIO_PATH="/studio"

NGINX_TESTMAN_SERVER_PUBLIC_URL="http://10.42.0.245"
NGINX_TESTMAN_PATH="" # /testman

# PROXY server URL (Apply for tester40-web only)
HTTP_PROXY=""
HTTPS_PROXY="" # http://uname:pass@proxy_host:proxy_port
NO_PROXY="" # localhost,10.*.*.*

####### Automation service auto-config URL ########
###==== TESTER40
TESTER40_WEBSERVER_PUBLIC_URL="http://$TESTER40_SERVER_IPV4:${APP_RUNNING_PORT_LIST['tester40-web']}" # If nginx forward http://10.16.88.2/tester40 => http://10.16.88.2 (Same for other services)
TESTER40_WEBSERVER_PUBLIC_SOCKET_URL="http://$TESTER40_SERVER_IPV4:${APP_WEBSOCKET_PORT_LIST['tester40-web']}"
TESTER40_CLIENT_PUBLIC_URL="http://$TESTER40_SERVER_IPV4:${APP_RUNNING_PORT_LIST['tester40-client']}"
# TODO EDIT
TESTER40_WEBSERVER_PRIVATE_URL="http://tester40-web:3000"
# TESTER40_WEBSERVER_PRIVATE_URL="http://10.38.70.65:3000"
TASKER_WEBSERVER_PRIVATE_URL="http://tasker-web:3000"

###==== STUDIO
STUDIO_CLIENT_PUBLIC_URL="http://$STUDIO_SERVER_IPV4:${APP_RUNNING_PORT_LIST['studio-client']}"
STUDIO_WEBSERVER_PUBLIC_URL="http://$STUDIO_SERVER_IPV4:${APP_RUNNING_PORT_LIST['studio-web']}"
STUDIO_WEBSERVER_PRIVATE_URL="http://studio-web:3000"
STUDIO_WEBSERVER_PUBLIC_SOCKET_URL="ws://$STUDIO_SERVER_IPV4:${APP_WEBSOCKET_PORT_LIST['studio-web']}"
# STUDIO_WEBSERVER_PUBLIC_SOCKET_URL="wss://10.38.70.65/studio/socket"
# STUDIO_WEBSERVER_PUBLIC_SOCKET_URL="ws://10.38.70.65:3350"

###==== STORAGE
# If the Storage deploy on server 172.31.0.5 and listen on 6800 => Then private url http://172.31.0.5:6800
STORAGE_SERVER_PRIVATE_API_URL="http://storage-web:3000"
# If the Storage is access through nginx server, e.g. http://10.16.88.2/storage => Then this below value should be http://10.16.88.2
STORAGE_SERVER_PUBLIC_API_URL="http://$STORAGE_SERVER_IPV4:${APP_RUNNING_PORT_LIST['storage-web']}"

###==== Selenium (Private url only)
SELENIUM_GRID_SERVER_URL="http://$APPIUM_SERVER_IPV4:4444"

###==== Apppium (Private url only)
APPIUM_SERVER_PROTOCOL="http"
APPIUM_SERVER_HOST="$APPIUM_SERVER_IPV4"
APPIUM_SERVER_PORT=4723

###==== TESTMAN
TESTMAN_WEBSERVER_PUBLIC_URL="http://$TESTMAN_SERVER_IPV4:${APP_RUNNING_PORT_LIST['testman-web']}" # If nginx forward http://10.16.88.2/tester40 => http://10.16.88.2 (Same for other services)
TESTMAN_WEBSERVER_PRIVATE_URL="http://testman-web:3000"
TESTMAN_CLIENT_PUBLIC_URL="http://$TESTMAN_SERVER_IPV4:${APP_RUNNING_PORT_LIST['testman-client']}"

# Database, redis configuration
declare -A DATABASE_CONFIGURATIONS
DATABASE_CONFIGURATIONS["mysql-server-host"]="$MYSQL_SERVER_IPV4"
DATABASE_CONFIGURATIONS["mysql-server-port"]=3306
DATABASE_CONFIGURATIONS["mysql-username"]="root"
DATABASE_CONFIGURATIONS["mysql-password"]="asdwer321"
DATABASE_CONFIGURATIONS["mysql-tester40-web-database-name"]="t4_dev_webserver"
DATABASE_CONFIGURATIONS["mysql-testman-web-database-name"]="tm_dev_webserver"
DATABASE_CONFIGURATIONS["mysql-tasker-web-database-name"]="t4_dev_tasker"
DATABASE_CONFIGURATIONS["mysql-storage-web-database-name"]="sto_dev_webserver"
DATABASE_CONFIGURATIONS["redis-server-host"]="$REDIS_SERVER_IPV4"
DATABASE_CONFIGURATIONS['redis-server-port']=6379

# LIMIT App Services memory usage (OPTIONAL)
declare -A APP_MEMORY_LIST
APP_MEMORY_LIST["tester40-client"]="4g" # It take approximately 1.2g when build client
APP_MEMORY_LIST["tester40-web"]="2g"
APP_MEMORY_LIST["tasker-web"]="4g"
APP_MEMORY_LIST["storage-web"]="4g"
APP_MEMORY_LIST["appium-web"]="3g"
APP_MEMORY_LIST["studio-client"]="4g"
APP_MEMORY_LIST["studio-web"]="2g"
APP_MEMORY_LIST["testman-client"]="3g"
APP_MEMORY_LIST["testman-web"]="2g"

###=======================================================###
### ===>>> SERVICE APP ENVIRONMENTS CONFIGURATIONS <<<=== ###
###=======================================================###

# Nginx auto-config
if [ ! -z $NGINX_SERVER_PUBLIC_URL ]; then
  # TESTER40-CLIENT
  TESTER40_CLIENT_PUBLIC_URL="$NGINX_SERVER_PUBLIC_URL$NGINX_TESTER40_PATH"
  TESTER40_WEBSERVER_PUBLIC_URL=$NGINX_SERVER_PUBLIC_URL
  TESTER40_WEBSERVER_PUBLIC_SOCKET_URL="$NGINX_SERVER_PUBLIC_URL"
  STORAGE_SERVER_PUBLIC_API_URL=$NGINX_SERVER_PUBLIC_URL
  STUDIO_CLIENT_PUBLIC_URL="$NGINX_SERVER_PUBLIC_URL$NGINX_STUDIO_PATH"
  STUDIO_WEBSERVER_PUBLIC_URL=$NGINX_SERVER_PUBLIC_URL
  STUDIO_WEBSERVER_PUBLIC_SOCKET_URL="$NGINX_SERVER_PUBLIC_URL$NGINX_STUDIO_PATH/socket"
  replace_protocol_str="https://"
  new_protocol_str="wss://"
  STUDIO_WEBSERVER_PUBLIC_SOCKET_URL=${STUDIO_WEBSERVER_PUBLIC_SOCKET_URL/$replace_protocol_str/$new_protocol_str}
  replace_protocol_str="http://"
  new_protocol_str="ws://"
  STUDIO_WEBSERVER_PUBLIC_SOCKET_URL=${STUDIO_WEBSERVER_PUBLIC_SOCKET_URL/$replace_protocol_str/$new_protocol_str}
fi

# Nginx TESTMAN auto-config
if [ ! -z $NGINX_TESTMAN_SERVER_PUBLIC_URL ]; then
  TESTMAN_CLIENT_PUBLIC_URL="$NGINX_TESTMAN_SERVER_PUBLIC_URL$NGINX_TESTMAN_PATH"
  TESTMAN_WEBSERVER_PUBLIC_URL=$NGINX_TESTMAN_SERVER_PUBLIC_URL
fi

## ---------===--------- ##
## ---TESTER40-CLIENT--- ##
## ---------===--------- ##
# - Mount config
# NONE

# - ENV config
declare -A TESTER40_CLIENT_ENV_CONFIG
TESTER40_CLIENT_ENV_CONFIG["server-url"]=$TESTER40_WEBSERVER_PUBLIC_URL
TESTER40_CLIENT_ENV_CONFIG["client-url"]=$TESTER40_CLIENT_PUBLIC_URL
TESTER40_CLIENT_ENV_CONFIG["login-redirect-host"]=$TESTER40_CLIENT_PUBLIC_URL
TESTER40_CLIENT_ENV_CONFIG["socket-server-url"]=$TESTER40_WEBSERVER_PUBLIC_SOCKET_URL
TESTER40_CLIENT_ENV_CONFIG["atomid-url"]=$ATOM_ID_URL # DO NOT edit
TESTER40_CLIENT_ENV_CONFIG["storage-server-api-upload-url"]="$STORAGE_SERVER_PUBLIC_API_URL/storage/upload"
TESTER40_CLIENT_ENV_CONFIG["path-public-url"]="/"
TESTER40_CLIENT_ENV_CONFIG["studio-client-url"]=$STUDIO_CLIENT_PUBLIC_URL
TESTER40_CLIENT_ENV_CONFIG["studio-server-url"]=$STUDIO_WEBSERVER_PUBLIC_URL

## ---------===--------- ##
## -TESTER40-WEBSERVER- ##
## ---------===--------- ##
# - Mount config
TESTER40_WEBSERVER_UPLOADS_FOLDER=$DEPLOYMENT_FOLDER/app_data/tester40_webserver/uploads
TESTER40_WEBSERVER_DATA_FOLDER=$DEPLOYMENT_FOLDER/app_data/tester40_webserver/data
TESTER40_WEBSERVER_TMP_FOLDER=$DEPLOYMENT_FOLDER/app_data/tester40_webserver/tmp

# - ENV config
declare -A TESTER40_WEBSERVER_ENV_CONFIG
TESTER40_WEBSERVER_ENV_CONFIG["mysql-server-host"]=${DATABASE_CONFIGURATIONS["mysql-server-host"]}
TESTER40_WEBSERVER_ENV_CONFIG["mysql-server-port"]=${DATABASE_CONFIGURATIONS["mysql-server-port"]}
TESTER40_WEBSERVER_ENV_CONFIG["mysql-username"]=${DATABASE_CONFIGURATIONS["mysql-username"]}
TESTER40_WEBSERVER_ENV_CONFIG["mysql-password"]=${DATABASE_CONFIGURATIONS["mysql-password"]}
TESTER40_WEBSERVER_ENV_CONFIG["mysql-database-name"]=${DATABASE_CONFIGURATIONS["mysql-tester40-web-database-name"]}
TESTER40_WEBSERVER_ENV_CONFIG["redis-server-host"]=${DATABASE_CONFIGURATIONS["redis-server-host"]}
TESTER40_WEBSERVER_ENV_CONFIG["redis-server-port"]=${DATABASE_CONFIGURATIONS["redis-server-port"]}

TESTER40_WEBSERVER_ENV_CONFIG["tester40-service-token"]="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiVGVzdGVyNDAiLCJhbGxvd19zZXJ2aWNlIjpbIkRGIiwiVGFza2VyIiwiQVRPTUlEIiwiU3RvcmFnZSIsIlN0dWRpbyJdfSwiaWF0IjoxNTk2MDkyNTM1fQ.YmzjH_vl-oWdeeqB-L5U7XuqDkdcbmCF4zNZ6JonAy0AYwNitT1Huk9O0V79t6-YyULsJSlkcOadELWJl-S_UEjDWRDJg61DM59oe6qZfjVJfihpnVA_IYcQUsaze6CIVEu9IhXqhIinDFBfXCNjyYZiJiSM3_rnbXdAYVTnI0s"
TESTER40_WEBSERVER_ENV_CONFIG["device-farm-url"]=$DEVICE_FARM_URL # DO NOT edit
TESTER40_WEBSERVER_ENV_CONFIG["device-farm-authkey"]=$DEVICE_FARM_API_AUTH_KEY # DO NOT edit
TESTER40_WEBSERVER_ENV_CONFIG["tasker-server-url"]=$TASKER_WEBSERVER_PRIVATE_URL
TESTER40_WEBSERVER_ENV_CONFIG["atomid-url"]=$ATOM_ID_URL
TESTER40_WEBSERVER_ENV_CONFIG["ai-server-url"]=$AI_SERVER_URL
# TESTER40_WEBSERVER_ENV_CONFIG["ai-pipe-url"]="[{\"from\":\"\",\"to\":\"\"}]"
TESTER40_WEBSERVER_ENV_CONFIG["tester40-public-url"]=$TESTER40_WEBSERVER_PUBLIC_URL
TESTER40_WEBSERVER_ENV_CONFIG["studio-server-url"]=$STUDIO_WEBSERVER_PRIVATE_URL
TESTER40_WEBSERVER_ENV_CONFIG["selenium-grid-server-url"]=$SELENIUM_GRID_SERVER_URL
TESTER40_WEBSERVER_ENV_CONFIG["allow-storage-host"]="[]"
# TESTER40_WEBSERVER_ENV_CONFIG["allow-storage-host"]="[\"http://localhost:6800\",\"http://10.16.x.x:6800\",\"https://fs.atomp.io\"]"
# TESTER40_WEBSERVER_ENV_CONFIG["storage-pipe-host"]="" # DO NOT edit
TESTER40_WEBSERVER_ENV_CONFIG["storage-server-api-url"]="$STORAGE_SERVER_PRIVATE_API_URL/storage"
TESTER40_WEBSERVER_ENV_CONFIG['global-https-agent']="{\"rejectUnauthorized\":false}"
# TESTER40_WEBSERVER_ENV_CONFIG["allow-cors"]="\"*\"" # Default
# TESTER40_WEBSERVER_ENV_CONFIG["testman-server-url"]="" # DO NOT edit
TESTER40_WEBSERVER_ENV_CONFIG["cookie-http-only"]="false"
TESTER40_WEBSERVER_ENV_CONFIG["cookie-secure"]="false"
TESTER40_WEBSERVER_ENV_CONFIG["cookie-samesite"]=""
TESTER40_WEBSERVER_ENV_CONFIG["bambo-autoever-authkey"]="$BAMBOO_AUTOEVER_AUTHKEY"
TESTER40_WEBSERVER_ENV_CONFIG["pipe-urls"]="[{\"from\":\"\",\"to\":\"\"}]"

## ---------===--------- ##
## --TASKER-WEBSERVER-- ##
## ---------===--------- ##
# - Mount config
TASKER_WEBSERVER_UPLOADS_FOLDER=$DEPLOYMENT_FOLDER/app_data/tasker_webserver/uploads
TASKER_WEBSERVER_DATA_FOLDER=$DEPLOYMENT_FOLDER/app_data/tasker_webserver/data
TASKER_WEBSERVER_TMP_FOLDER=$DEPLOYMENT_FOLDER/app_data/tasker_webserver/tmp

# TASKER_WEBSERVER_UPLOADS_FOLDER=/Users/duytq11/projects/fsoft/atomp/tester40/source_code/t4_hae_tasker/uploads
# TASKER_WEBSERVER_DATA_FOLDER=/Users/duytq11/projects/fsoft/atomp/tester40/source_code/t4_hae_tasker/data
# TASKER_WEBSERVER_TMP_FOLDER=/Users/duytq11/projects/fsoft/atomp/tester40/source_code/t4_hae_tasker/tmp

# - ENV config
declare -A TASKER_WEBSERVER_ENV_CONFIG
TASKER_WEBSERVER_ENV_CONFIG["mysql-server-host"]=${DATABASE_CONFIGURATIONS["mysql-server-host"]}
TASKER_WEBSERVER_ENV_CONFIG["mysql-server-port"]=${DATABASE_CONFIGURATIONS["mysql-server-port"]}
TASKER_WEBSERVER_ENV_CONFIG["mysql-username"]=${DATABASE_CONFIGURATIONS["mysql-username"]}
TASKER_WEBSERVER_ENV_CONFIG["mysql-password"]=${DATABASE_CONFIGURATIONS["mysql-password"]}
TASKER_WEBSERVER_ENV_CONFIG["mysql-database-name"]=${DATABASE_CONFIGURATIONS["mysql-tasker-web-database-name"]}

TASKER_WEBSERVER_ENV_CONFIG["tasker-service-token"]="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiVGFza2VyIiwiYWxsb3dfc2VydmljZSI6WyJUZXN0ZXI0MCIsIkFUT01JRCIsIlN0b3JhZ2UiXX0sImlhdCI6MTU5NjA5MTczM30.llG3I1zTuuhtFDcLt-vaU0cXJT5V38SYdJLKGfziKXpaEJU0QBvhYn_FLYQV4fDy2Nm9kj5ziHFV1TKQOWcq2wzwGxBg4JOi-ZrwBXzRoFGWEAWwPc8i4FnygO9M58lFtrAZHRkNa5L3Wdkt37iS1QYJPmGJiW61pOYAK6abgv8"
TASKER_WEBSERVER_ENV_CONFIG["device-farm-url"]=$DEVICE_FARM_URL # DO NOT edit
TASKER_WEBSERVER_ENV_CONFIG["device-farm-authkey"]=$DEVICE_FARM_API_AUTH_KEY # DO NOT edit
TASKER_WEBSERVER_ENV_CONFIG["tester40-server-url"]=$TESTER40_WEBSERVER_PRIVATE_URL

TASKER_WEBSERVER_ENV_CONFIG["appium-server-protocol"]=$APPIUM_SERVER_PROTOCOL
TASKER_WEBSERVER_ENV_CONFIG["appium-server-host"]=$APPIUM_SERVER_HOST
TASKER_WEBSERVER_ENV_CONFIG["appium-server-port"]=$APPIUM_SERVER_PORT

TASKER_WEBSERVER_ENV_CONFIG["ai-server-url"]=$AI_SERVER_URL
TASKER_WEBSERVER_ENV_CONFIG["ai-pipe-url"]="[{\"from\":\"\",\"to\":\"\"}]" # Default

TASKER_WEBSERVER_ENV_CONFIG["storage-server-api-url"]="$STORAGE_SERVER_PRIVATE_API_URL/storage"
TASKER_WEBSERVER_ENV_CONFIG["selenium-grid-server-url"]=$SELENIUM_GRID_SERVER_URL
TASKER_WEBSERVER_ENV_CONFIG['global-https-agent']="{\"rejectUnauthorized\":false}"
# TASKER_WEBSERVER_ENV_CONFIG["allow-cors"]="\"*\"" # Default
# TASKER_WEBSERVER_ENV_CONFIG["macos-firefox-profiles-path"]=""
# TASKER_WEBSERVER_ENV_CONFIG["window-firefox-profiles-path"]=""

TASKER_WEBSERVER_ENV_CONFIG["appium-proxy-path-pattern"]=''
TASKER_WEBSERVER_ENV_CONFIG["appium-proxy-linux-path-pattern"]=''
TASKER_WEBSERVER_ENV_CONFIG["appium-proxy-host"]="$CLOUD_IPV4"
TASKER_WEBSERVER_ENV_CONFIG["appium-proxy-port"]=8888

TASKER_WEBSERVER_ENV_CONFIG["pctrol-delay-poweroff"]=12000
TASKER_WEBSERVER_ENV_CONFIG["pctrol-delay-poweron"]=120000
TASKER_WEBSERVER_ENV_CONFIG["pctrol-use-b-plus-signal"]="true"


## ---------===--------- ##
## --STUDIO-WEBSERVER-- ##
## ---------===--------- ##
# - Mount config
STUDIO_WEBSERVER_TMP_FOLDER=$DEPLOYMENT_FOLDER/app_data/studio_webserver/tmp

# - ENV config
declare -A STUDIO_WEBSERVER_ENV_CONFIG
STUDIO_WEBSERVER_ENV_CONFIG["redis-server-host"]=${DATABASE_CONFIGURATIONS["redis-server-host"]}
STUDIO_WEBSERVER_ENV_CONFIG["redis-server-port"]=${DATABASE_CONFIGURATIONS["redis-server-port"]}

STUDIO_WEBSERVER_ENV_CONFIG["studio-service-token"]="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiU3R1ZGlvIiwiYWxsb3dfc2VydmljZSI6WyJERiIsIlRlc3RlcjQwIiwiQVRPTUlEIiwiU3RvcmFnZSJdfSwiaWF0IjoxNTk2MDkyNTM1fQ.Kq9LqOPiCxcACwDSAfe9Tl_BfdSGMS5tC0m6AJZsreqJpuJS3v2qob5OOcB-YOG7Ra295OCZve-yeQiLGAK0O6gIOxam3X7g9XtHnt8_EyxAVQ-hbwxwXQKpe2bRP3NT8BqIR8O0zaelg35dNOo4dAKOu7uIVOdgSbpz4px1Zb0"
STUDIO_WEBSERVER_ENV_CONFIG["atomid-url"]=$ATOM_ID_URL
STUDIO_WEBSERVER_ENV_CONFIG["device-farm-url"]=$DEVICE_FARM_URL # DO NOT edit
STUDIO_WEBSERVER_ENV_CONFIG["device-farm-authkey"]=$DEVICE_FARM_API_AUTH_KEY # DO NOT edit
STUDIO_WEBSERVER_ENV_CONFIG["tester40-server-url"]=$TESTER40_WEBSERVER_PRIVATE_URL
STUDIO_WEBSERVER_ENV_CONFIG["storage-server-api-url"]="$STORAGE_SERVER_PRIVATE_API_URL/storage"
STUDIO_WEBSERVER_ENV_CONFIG["allow-storage-host"]="[]"
STUDIO_WEBSERVER_ENV_CONFIG["studio-public-url"]="$STUDIO_WEBSERVER_PUBLIC_URL/tmp"
STUDIO_WEBSERVER_ENV_CONFIG["appium-server-host"]=$APPIUM_SERVER_HOST
STUDIO_WEBSERVER_ENV_CONFIG["appium-server-port"]=$APPIUM_SERVER_PORT
STUDIO_WEBSERVER_ENV_CONFIG["appium-server-linux-port"]=$APPIUM_SERVER_PORT
STUDIO_WEBSERVER_ENV_CONFIG['global-https-agent']="{\"rejectUnauthorized\":false}"
# STUDIO_WEBSERVER_ENV_CONFIG['global-https-agent']="{}"
# STUDIO_WEBSERVER_ENV_CONFIG["allow-cors"]="\"*\"" # Default

STUDIO_WEBSERVER_ENV_CONFIG["ai-server-url"]=$AI_SERVER_URL
STUDIO_WEBSERVER_ENV_CONFIG["ai-pipe-url"]="[{\"from\":\"\",\"to\":\"\"}]" # Default

STUDIO_WEBSERVER_ENV_CONFIG["appium-proxy-path-pattern"]=''
STUDIO_WEBSERVER_ENV_CONFIG["appium-proxy-linux-path-pattern"]=''
STUDIO_WEBSERVER_ENV_CONFIG["appium-proxy-host"]="$CLOUD_IPV4"
STUDIO_WEBSERVER_ENV_CONFIG["appium-proxy-port"]=8888

## ---------===--------- ##
## ---STUDIO-CLIENT--- ##
## ---------===--------- ##
# - Mount config
STUDIO_CLIENT_TMP_FOLDER=$STUDIO_WEBSERVER_TMP_FOLDER # DO NOT edit

# - ENV config
declare -A STUDIO_CLIENT_ENV_CONFIG
STUDIO_CLIENT_ENV_CONFIG["device-farm-url"]=$DEVICE_FARM_URL # DO NOT edit
STUDIO_CLIENT_ENV_CONFIG["socket-server-url"]=$STUDIO_WEBSERVER_PUBLIC_SOCKET_URL
STUDIO_CLIENT_ENV_CONFIG["server-url"]=$STUDIO_WEBSERVER_PUBLIC_URL
STUDIO_CLIENT_ENV_CONFIG["path-public-url"]=""


## ---------===--------- ##
## --STORAGE-WEBSERVER-- ##
## ---------===--------- ##

# - Mount config
STORAGE_WEBSERVER_UPLOADS_FOLDER=$DEPLOYMENT_FOLDER/app_data/storage_webserver/uploads

# - ENV config
declare -A STORAGE_WEBSERVER_ENV_CONFIG
STORAGE_WEBSERVER_ENV_CONFIG["mysql-server-host"]=${DATABASE_CONFIGURATIONS["mysql-server-host"]}
STORAGE_WEBSERVER_ENV_CONFIG["mysql-server-port"]=${DATABASE_CONFIGURATIONS["mysql-server-port"]}
STORAGE_WEBSERVER_ENV_CONFIG["mysql-username"]=${DATABASE_CONFIGURATIONS["mysql-username"]}
STORAGE_WEBSERVER_ENV_CONFIG["mysql-password"]=${DATABASE_CONFIGURATIONS["mysql-password"]}
STORAGE_WEBSERVER_ENV_CONFIG["mysql-database-name"]=${DATABASE_CONFIGURATIONS["mysql-storage-web-database-name"]}

STORAGE_WEBSERVER_ENV_CONFIG["studio-service-token"]="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiKiIsImFsbG93X3NlcnZpY2UiOlsiKiJdfSwiaWF0IjoxNTk2MDkxNzMzfQ.htXogVlyOzo5muVQEJIckwdEMiVZB4YV3_Ve9YhEMSyXUENkX7dhPvOKu1A-dYN70D_LwC0KL-4uHafZn7b3l7OT7Z2G6LaGzo8HSy6_P64B-EiXSq5eQC-xDC0QhJOP3AokWaFROkjwgCvct2-jjOXo_NBRFzw9HRrv-8FtX2c"
STORAGE_WEBSERVER_ENV_CONFIG["storage-public-url"]=$STORAGE_SERVER_PUBLIC_API_URL
STORAGE_WEBSERVER_ENV_CONFIG["storage-base-file-path"]="/storage/file"
STORAGE_WEBSERVER_ENV_CONFIG["allow-cors"]="\"*\""
STORAGE_WEBSERVER_ENV_CONFIG["max-file-size"]="5000000000"


## ---------===--------- ##
## ---APPIUM-SERVER--- ##
## ---------===--------- ##
# - Mount config
APPIUM_WEBSERVER_CHROMEDRIVER_FOLDER=$DEPLOYMENT_FOLDER/app_data/appium_webserver/chromedrivers
APPIUM_WEBSERVER_LOGS_FOLDER=$DEPLOYMENT_FOLDER/app_data/appium_webserver/logs

# - ENV config
declare -A APPIUM_WEBSERVER_ENV_CONFIG
APPIUM_WEBSERVER_ENV_CONFIG["default-chrome-webview-version"]="98"
APPIUM_WEBSERVER_ENV_CONFIG["device-farm-authkey"]=$DEVICE_FARM_API_AUTH_KEY # DO NOT edit
APPIUM_WEBSERVER_ENV_CONFIG["devicefarm-ios-app-install-api-url"]="$DEVICE_FARM_URL/api/v1/devices/installApp"
APPIUM_WEBSERVER_ENV_CONFIG["devicefarm-ios-app-uninstall-api-url"]="$DEVICE_FARM_URL/api/v1/devices/uninstallApp"
APPIUM_WEBSERVER_ENV_CONFIG["devicefarm-app-installed-api-url"]="$DEVICE_FARM_URL/api/v1/devices/appInstalled"
APPIUM_WEBSERVER_ENV_CONFIG["devicefarm-take-device-api-url"]="$DEVICE_FARM_URL/api/v1/private/devices/take"
APPIUM_WEBSERVER_ENV_CONFIG["devicefarm-release-device-api-url"]="$DEVICE_FARM_URL/api/v1/private/devices/release"
APPIUM_WEBSERVER_ENV_CONFIG["appium-service-token"]="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiQXBwaXVtIiwiYWxsb3dfc2VydmljZSI6WyJTdG9yYWdlIl19LCJpYXQiOjE1OTg5NDI1MDZ9.arFoJjYWc-PDKvMXST4pus0FHojwyaF3dX7SJbhchFwGx3f-7BLuDmHJaji-rTm1yev5264yVBbOK6IrH2ZKkEoKQzkOT7d49Ps76cCZyspsbvWjUH6Q272K6CxqQxpIGFSUBrJWC1xXBgqf1vrsCus_Ybgt_awYGj1FssKf0VU"
APPIUM_WEBSERVER_ENV_CONFIG["allow-storage-host"]="[\"http://localhost:6800\",\"$STORAGE_SERVER_PUBLIC_API_URL\",\"$STORAGE_SERVER_PRIVATE_API_URL\",\"https://fs.atomp.io\"]"

## ---------===--------- ##
## ---TESTMAN-CLIENT--- ##
## ---------===--------- ##
# - Mount config
# NONE

# - ENV config
declare -A TESTMAN_CLIENT_ENV_CONFIG
TESTMAN_CLIENT_ENV_CONFIG["server-url"]=$TESTMAN_WEBSERVER_PUBLIC_URL
TESTMAN_CLIENT_ENV_CONFIG["client-url"]="$TESTMAN_CLIENT_PUBLIC_URL/"
TESTMAN_CLIENT_ENV_CONFIG["login-redirect-host"]="$TESTMAN_CLIENT_PUBLIC_URL"
TESTMAN_CLIENT_ENV_CONFIG["socket-server-url"]="" # NOT USED
TESTMAN_CLIENT_ENV_CONFIG["atomid-url"]=$ATOM_ID_URL # DO NOT edit
TESTMAN_CLIENT_ENV_CONFIG["path-public-url"]="/"
TESTMAN_CLIENT_ENV_CONFIG["studio-client-url"]=$STUDIO_CLIENT_PUBLIC_URL
TESTMAN_CLIENT_ENV_CONFIG["studio-server-url"]=$STUDIO_WEBSERVER_PUBLIC_URL

## ---------===--------- ##
## -TESTMAN-WEBSERVER- ##
## ---------===--------- ##
# - Mount config
TESTMAN_WEBSERVER_UPLOADS_FOLDER=$DEPLOYMENT_FOLDER/app_data/testman_webserver/uploads
TESTMAN_WEBSERVER_TEST_VERSIONS_FOLDER=$DEPLOYMENT_FOLDER/app_data/testman_webserver/test_versions

# - ENV config
declare -A TESTMAN_WEBSERVER_ENV_CONFIG
TESTMAN_WEBSERVER_ENV_CONFIG["mysql-server-host"]=${DATABASE_CONFIGURATIONS["mysql-server-host"]}
TESTMAN_WEBSERVER_ENV_CONFIG["mysql-server-port"]=${DATABASE_CONFIGURATIONS["mysql-server-port"]}
TESTMAN_WEBSERVER_ENV_CONFIG["mysql-username"]=${DATABASE_CONFIGURATIONS["mysql-username"]}
TESTMAN_WEBSERVER_ENV_CONFIG["mysql-password"]=${DATABASE_CONFIGURATIONS["mysql-password"]}
TESTMAN_WEBSERVER_ENV_CONFIG["mysql-database-name"]=${DATABASE_CONFIGURATIONS["mysql-testman-web-database-name"]}
TESTMAN_WEBSERVER_ENV_CONFIG["redis-server-host"]=${DATABASE_CONFIGURATIONS["redis-server-host"]}
TESTMAN_WEBSERVER_ENV_CONFIG["redis-server-port"]=${DATABASE_CONFIGURATIONS["redis-server-port"]}

TESTMAN_WEBSERVER_ENV_CONFIG["atomid-url"]=$ATOM_ID_URL
TESTMAN_WEBSERVER_ENV_CONFIG["testman-client-public-url"]=$TESTMAN_CLIENT_PUBLIC_URL
TESTMAN_WEBSERVER_ENV_CONFIG["tester40-public-url"]=$TESTER40_WEBSERVER_PUBLIC_URL

TESTMAN_WEBSERVER_ENV_CONFIG["device-farm-url"]=$DEVICE_FARM_URL # DO NOT edit # TM NOT USED
TESTMAN_WEBSERVER_ENV_CONFIG["device-farm-authkey"]=$DEVICE_FARM_API_AUTH_KEY # DO NOT edit # TM NOT USED
TESTMAN_WEBSERVER_ENV_CONFIG["tasker-server-url"]=$TASKER_WEBSERVER_PRIVATE_URL # TM NOT USED


###============================================###
# SCRIPT, DONOT EDIT

if [ $DEPLOY_SCRIPT_MODE = 0 ]; then
  echo "DEPLOY_SCRIPT_MODE=0, nothhing to do"
  exit
fi

###============================================###
# SETUP START APP CONFIGURATION, DONOT EDIT

# Nginx auto-config
if [ ! -z $NGINX_SERVER_PUBLIC_URL ]; then
  # TESTER40-CLIENT
  TESTER40_CLIENT_ENV_CONFIG["path-public-url"]="$NGINX_TESTER40_PATH/"
  STUDIO_CLIENT_ENV_CONFIG["path-public-url"]="$NGINX_STUDIO_PATH/"
  STUDIO_WEBSERVER_ENV_CONFIG["studio-public-url"]="$STUDIO_WEBSERVER_PUBLIC_URL$NGINX_STUDIO_PATH/tmp"
fi

# Nginx auto-config
if [ ! -z $NGINX_TESTMAN_SERVER_PUBLIC_URL ]; then
  # TESTMAN-CLIENT
  TESTMAN_CLIENT_ENV_CONFIG["path-public-url"]="$NGINX_TESTMAN_PATH/"
fi

declare -A DOCKER_RUN_PARAMS_LIST
DOCKER_RUN_PARAMS_LIST["tester40-client"]="--network=atomp_automation_network -e TESTER40_CLIENT_SERVER_URL=${TESTER40_CLIENT_ENV_CONFIG['server-url']} -e TESTER40_CLIENT_URL=${TESTER40_CLIENT_ENV_CONFIG['client-url']} -e TESTER40_CLIENT_LOGIN_REDIRECT_HOST=${TESTER40_CLIENT_ENV_CONFIG['login-redirect-host']} -e TESTER40_CLIENT_SOCKET_URL=${TESTER40_CLIENT_ENV_CONFIG['socket-server-url']} -e TESTER40_CLIENT_ATOMID_URL=${TESTER40_CLIENT_ENV_CONFIG['atomid-url']} -e TESTER40_CLIENT_STORAGE_API_HOST_FULL_PATH=${TESTER40_CLIENT_ENV_CONFIG['storage-server-api-upload-url']} -e TESTER40_CLIENT_PATH_PUBLIC_URL=${TESTER40_CLIENT_ENV_CONFIG['path-public-url']} -e TESTER40_CLIENT_STUDIO_CLIENT_URL=${TESTER40_CLIENT_ENV_CONFIG['studio-client-url']} -e TESTER40_CLIENT_STUDIO_SERVER_URL=${TESTER40_CLIENT_ENV_CONFIG['studio-server-url']}"

DOCKER_RUN_PARAMS_LIST["tester40-web"]="--network=atomp_automation_network -v $TESTER40_WEBSERVER_UPLOADS_FOLDER:/usr/src/app/public/uploads -v $TESTER40_WEBSERVER_DATA_FOLDER:/usr/src/app/data -v $TESTER40_WEBSERVER_TMP_FOLDER:/usr/src/app/tmp -e TESTER40_MSQL_HOST=${TESTER40_WEBSERVER_ENV_CONFIG['mysql-server-host']} -e TESTER40_MSQL_PORT=${TESTER40_WEBSERVER_ENV_CONFIG['mysql-server-port']} -e TESTER40_MSQL_DB_NAME=${TESTER40_WEBSERVER_ENV_CONFIG['mysql-database-name']} -e TESTER40_MSQL_USERNAME=${TESTER40_WEBSERVER_ENV_CONFIG['mysql-username']} -e TESTER40_MSQL_PASSWORD=${TESTER40_WEBSERVER_ENV_CONFIG['mysql-password']} -e TESTER40_SERVICE_TOKEN=${TESTER40_WEBSERVER_ENV_CONFIG['tester40-service-token']} -e TESTER40_DEVICEFARM_HOST=${TESTER40_WEBSERVER_ENV_CONFIG['device-farm-url']} -e TESTER40_DEVICEFARM_AUTHKEY=${TESTER40_WEBSERVER_ENV_CONFIG['device-farm-authkey']} -e TESTER40_TASKER_HOST=${TESTER40_WEBSERVER_ENV_CONFIG['tasker-server-url']} -e TESTER40_REDIS_HOST=${TESTER40_WEBSERVER_ENV_CONFIG['redis-server-host']} -e TESTER40_REDIS_PORT=${TESTER40_WEBSERVER_ENV_CONFIG['redis-server-port']} -e TESTER40_ATOMID_HOST=${TESTER40_WEBSERVER_ENV_CONFIG['atomid-url']} -e TESTER40_AI_HOST=${TESTER40_WEBSERVER_ENV_CONFIG['ai-server-url']} -e TESTER40_PUBLIC_HOST=${TESTER40_WEBSERVER_ENV_CONFIG['tester40-public-url']} -e TESTER40_STUDIO_API_HOST=${TESTER40_WEBSERVER_ENV_CONFIG['studio-server-url']} -e TESTER40_SELENIUM_GRID_HOST=${TESTER40_WEBSERVER_ENV_CONFIG['selenium-grid-server-url']} -e TESTER40_STORAGE_API_HOST_FULL_PATH=${TESTER40_WEBSERVER_ENV_CONFIG['storage-server-api-url']} -e TESTER40_STORAGE_API_HOST_INTERNAL_PATH=${TESTER40_WEBSERVER_ENV_CONFIG['storage-server-api-url']} -e TESTER40_ALLOW_STORAGE_HOST=${TESTER40_WEBSERVER_ENV_CONFIG['allow-storage-host']} -e TESTER40_GLOBAL_AGENT_OPTIONS=${TESTER40_WEBSERVER_ENV_CONFIG['global-https-agent']} -e TESTER40_COOKIE_HTTP_ONLY=${TESTER40_WEBSERVER_ENV_CONFIG['cookie-http-only']} -e TESTER40_COOKIE_SECURE=${TESTER40_WEBSERVER_ENV_CONFIG['cookie-secure']} -e TESTER40_COOKIE_SAME_SITE=${TESTER40_WEBSERVER_ENV_CONFIG['cookie-samesite']} -e TESTER40_BAMBOO_AUTOEVER_AUTHKEY=${TESTER40_WEBSERVER_ENV_CONFIG['bambo-autoever-authkey']} -e TESTER40_PIPE_URLS=${TESTER40_WEBSERVER_ENV_CONFIG['pipe-urls']}"

DOCKER_RUN_PARAMS_LIST["tasker-web"]="--network=atomp_automation_network -v $TASKER_WEBSERVER_UPLOADS_FOLDER:/usr/src/app/public/uploads -v $TASKER_WEBSERVER_DATA_FOLDER:/usr/src/app/data -v $TASKER_WEBSERVER_TMP_FOLDER:/usr/src/app/tmp -e TASKER_MSQL_HOST=${TASKER_WEBSERVER_ENV_CONFIG['mysql-server-host']} -e TASKER_MSQL_PORT=${TASKER_WEBSERVER_ENV_CONFIG['mysql-server-port']} -e TASKER_MSQL_DB_NAME=${TASKER_WEBSERVER_ENV_CONFIG['mysql-database-name']} -e TASKER_MSQL_USERNAME=${TASKER_WEBSERVER_ENV_CONFIG['mysql-username']} -e TASKER_MSQL_PASSWORD=${TASKER_WEBSERVER_ENV_CONFIG['mysql-password']} -e TASKER_SERVICE_TOKEN=${TASKER_WEBSERVER_ENV_CONFIG['tasker-service-token']} -e TASKER_TESTER40_HOST=${TASKER_WEBSERVER_ENV_CONFIG['tester40-server-url']} -e TASKER_DEVICEFARM_HOST=${TASKER_WEBSERVER_ENV_CONFIG['device-farm-url']} -e TASKER_DEVICEFARM_AUTHKEY=${TASKER_WEBSERVER_ENV_CONFIG['device-farm-authkey']} -e TASKER_APPIUM_PROTOCOL=${TASKER_WEBSERVER_ENV_CONFIG['appium-server-protocol']} -e TASKER_APPIUM_HOST=${TASKER_WEBSERVER_ENV_CONFIG['appium-server-host']} -e TASKER_APPIUM_PORT=${TASKER_WEBSERVER_ENV_CONFIG['appium-server-port']} -e TASKER_AI_HOST=${TASKER_WEBSERVER_ENV_CONFIG['ai-server-url']} -e TASKER_AI_PIPE_URL=${TASKER_WEBSERVER_ENV_CONFIG['ai-pipe-url']} -e TASKER_STORAGE_API_HOST_FULL_PATH=${TASKER_WEBSERVER_ENV_CONFIG['storage-server-api-url']} -e TASKER_SELENIUM_HOST=${TASKER_WEBSERVER_ENV_CONFIG['selenium-grid-server-url']} -e TASKER_APPIUM_PROXY_PATH_PATTERN=${TASKER_WEBSERVER_ENV_CONFIG['appium-proxy-path-pattern']} -e TASKER_APPIUM_PROXY_LINUX_PATH_PATTERN=${TASKER_WEBSERVER_ENV_CONFIG['appium-proxy-linux-path-pattern']} -e TASKER_APPIUM_PROXY_PORT=${TASKER_WEBSERVER_ENV_CONFIG['appium-proxy-port']} -e TASKER_APPIUM_PROXY_HOST=${TASKER_WEBSERVER_ENV_CONFIG['appium-proxy-host']} -e TASKER_GLOBAL_AGENT_OPTIONS=${TASKER_WEBSERVER_ENV_CONFIG['global-https-agent']} -e TASKER_STORAGE_API_HOST_INTERNAL_PATH=${TASKER_WEBSERVER_ENV_CONFIG['storage-server-api-url']} -e TASKER_PCONTROL_DELAY_POWER_OFF_MS=${TASKER_WEBSERVER_ENV_CONFIG['pctrol-delay-poweroff']} -e TASKER_PCONTROL_DELAY_POWER_ON_MS=${TASKER_WEBSERVER_ENV_CONFIG['pctrol-delay-poweron']} -e TASKER_PCONTROL_USE_BPLUS_SIGNAL=${TASKER_WEBSERVER_ENV_CONFIG['pctrol-use-b-plus-signal']}"

DOCKER_RUN_PARAMS_LIST["storage-web"]="--network=atomp_automation_network -v $STORAGE_WEBSERVER_UPLOADS_FOLDER:/usr/src/app/uploads -e STORAGE_MSQL_HOST=${STORAGE_WEBSERVER_ENV_CONFIG['mysql-server-host']} -e STORAGE_MSQL_PORT=${STORAGE_WEBSERVER_ENV_CONFIG['mysql-server-port']} -e STORAGE_MSQL_DB_NAME=${STORAGE_WEBSERVER_ENV_CONFIG['mysql-database-name']} -e STORAGE_MSQL_USERNAME=${STORAGE_WEBSERVER_ENV_CONFIG['mysql-username']} -e STORAGE_MSQL_PASSWORD=${STORAGE_WEBSERVER_ENV_CONFIG['mysql-password']} -e STORAGE_SERVICE_TOKEN=${STORAGE_WEBSERVER_ENV_CONFIG['studio-service-token']} -e STORAGE_STORAGE_BASE_PATH=${STORAGE_WEBSERVER_ENV_CONFIG['storage-base-file-path']} -e STORAGE_BASE_DOMAIN=${STORAGE_WEBSERVER_ENV_CONFIG['storage-public-url']} -e STORAGE_ALLOWED_CORS=${STORAGE_WEBSERVER_ENV_CONFIG['allow-cors']} -e STORAGE_MAX_FILE_SIZE=${STORAGE_WEBSERVER_ENV_CONFIG['max-file-size']}"

DOCKER_RUN_PARAMS_LIST["appium-web"]="--network=atomp_automation_network --privileged -v $APPIUM_WEBSERVER_LOGS_FOLDER:/usr/src/app/output_logs -v $APPIUM_WEBSERVER_CHROMEDRIVER_FOLDER:/usr/src/app/chromedriver_folder -e APPIUM_SELECT_CHROME_VERSION=${APPIUM_WEBSERVER_ENV_CONFIG['default-chrome-webview-version']} -e APPIUM_DF_IOS_INSTALL_API=${APPIUM_WEBSERVER_ENV_CONFIG['devicefarm-ios-app-install-api-url']} -e APPIUM_DF_TOKEN=${APPIUM_WEBSERVER_ENV_CONFIG['device-farm-authkey']} -e APPIUM_DF_APP_INSTALLED_API=${APPIUM_WEBSERVER_ENV_CONFIG['devicefarm-app-installed-api-url']} -e APPIUM_DF_IOS_UNINSTALL_API=${APPIUM_WEBSERVER_ENV_CONFIG['devicefarm-ios-app-uninstall-api-url']} -e APPIUM_DF_TAKE_DEVICE_API=${APPIUM_WEBSERVER_ENV_CONFIG['devicefarm-take-device-api-url']} -e APPIUM_DF_RELEASE_DEVICE_API=${APPIUM_WEBSERVER_ENV_CONFIG['devicefarm-release-device-api-url']} -e APPIUM_SERVICE_TOKEN=${APPIUM_WEBSERVER_ENV_CONFIG['appium-service-token']} -e APPIUM_ALLOW_STORAGE=${APPIUM_WEBSERVER_ENV_CONFIG['allow-storage-host']}"

DOCKER_RUN_PARAMS_LIST["studio-client"]="--network=atomp_automation_network -v $STUDIO_CLIENT_TMP_FOLDER:/usr/src/app/public/tmp -e STUDIO_CLIENT_DEVICEFARM_HOST=${STUDIO_CLIENT_ENV_CONFIG['device-farm-url']} -e STUDIO_CLIENT_SOCKET_ENDPOINT=${STUDIO_CLIENT_ENV_CONFIG['socket-server-url']} -e STUDIO_CLIENT_SERVER_HOST=${STUDIO_CLIENT_ENV_CONFIG['server-url']} -e STUDIO_CLIENT_PATH_PUBLIC_URL=${STUDIO_CLIENT_ENV_CONFIG['path-public-url']}"

DOCKER_RUN_PARAMS_LIST["studio-web"]="--network=atomp_automation_network -v $STUDIO_WEBSERVER_TMP_FOLDER:/usr/src/app/tmp -e STUDIO_SERVICE_PUBLIC_KEY_PATH=${STUDIO_WEBSERVER_ENV_CONFIG['studio-service-token']} -e STUDIO_REDIS_HOST=${STUDIO_WEBSERVER_ENV_CONFIG["redis-server-host"]} -e STUDIO_REDIS_PORT=${STUDIO_WEBSERVER_ENV_CONFIG["redis-server-port"]} -e STUDIO_ATOMID_HOST=${STUDIO_WEBSERVER_ENV_CONFIG['atomid-url']} -e STUDIO_DEVICEFARM_HOST=${STUDIO_WEBSERVER_ENV_CONFIG['device-farm-url']} -e STUDIO_DEVICEFARM_AUTHKEY=${STUDIO_WEBSERVER_ENV_CONFIG['device-farm-authkey']} -e STUDIO_TESTER40_HOST=${STUDIO_WEBSERVER_ENV_CONFIG['tester40-server-url']} -e STUDIO_STORAGE_API_HOST_FULL_PATH=${STUDIO_WEBSERVER_ENV_CONFIG['storage-server-api-url']} -e STUDIO_ALLOW_STORAGE_HOST=${STUDIO_WEBSERVER_ENV_CONFIG['allow-storage-host']} -e STUDIO_PUBLIC_HOST=${STUDIO_WEBSERVER_ENV_CONFIG['studio-public-url']} -e STUDIO_APPIUM_HOST=${STUDIO_WEBSERVER_ENV_CONFIG['appium-server-host']} -e STUDIO_APPIUM_PORT=${STUDIO_WEBSERVER_ENV_CONFIG['appium-server-port']} -e STUDIO_APPIUM_PROXY_PATH_PATTERN=${STUDIO_WEBSERVER_ENV_CONFIG['appium-proxy-path-pattern']} -e STUDIO_APPIUM_PROXY_LINUX_PATH_PATTERN=${STUDIO_WEBSERVER_ENV_CONFIG['appium-proxy-linux-path-pattern']} -e STUDIO_APPIUM_PROXY_PORT=${STUDIO_WEBSERVER_ENV_CONFIG['appium-proxy-port']} -e STUDIO_APPIUM_PROXY_HOST=${STUDIO_WEBSERVER_ENV_CONFIG['appium-proxy-host']} -e STUDIO_GLOBAL_AGENT_OPTIONS=${STUDIO_WEBSERVER_ENV_CONFIG['global-https-agent']} -e STUDIO_AI_HOST=${STUDIO_WEBSERVER_ENV_CONFIG['ai-server-url']} -e STUDIO_PIPE_URL=${STUDIO_WEBSERVER_ENV_CONFIG['ai-pipe-url']}"

DOCKER_RUN_PARAMS_LIST["testman-client"]="--network=atomp_automation_network -e TESTMAN_CLIENT_SERVER_URL=${TESTMAN_CLIENT_ENV_CONFIG['server-url']} -e TESTMAN_CLIENT_URL=${TESTMAN_CLIENT_ENV_CONFIG['client-url']} -e TESTMAN_CLIENT_LOGIN_REDIRECT_HOST=${TESTMAN_CLIENT_ENV_CONFIG['login-redirect-host']} -e TESTMAN_CLIENT_SOCKET_URL=${TESTMAN_CLIENT_ENV_CONFIG['socket-server-url']} -e TESTMAN_CLIENT_ATOMID_URL=${TESTMAN_CLIENT_ENV_CONFIG['atomid-url']} -e TESTMAN_CLIENT_PATH_PUBLIC_URL=${TESTMAN_CLIENT_ENV_CONFIG['path-public-url']} -e TESTMAN_CLIENT_STUDIO_SERVER_URL=${TESTMAN_CLIENT_ENV_CONFIG['studio-client-url']} -e TESTMAN_CLIENT_STUDIO_CLIENT_URL=${TESTMAN_CLIENT_ENV_CONFIG['studio-server-url']}"

DOCKER_RUN_PARAMS_LIST["testman-web"]="--network=atomp_automation_network -v $TESTMAN_WEBSERVER_UPLOADS_FOLDER:/usr/src/app/public/uploads -v $TESTMAN_WEBSERVER_TEST_VERSIONS_FOLDER:/usr/src/app/test_versions -e TESTMAN_MSQL_HOST=${TESTMAN_WEBSERVER_ENV_CONFIG['mysql-server-host']} -e TESTMAN_MSQL_PORT=${TESTMAN_WEBSERVER_ENV_CONFIG['mysql-server-port']} -e TESTMAN_MSQL_DB_NAME=${TESTMAN_WEBSERVER_ENV_CONFIG['mysql-database-name']} -e TESTMAN_MSQL_USERNAME=${TESTMAN_WEBSERVER_ENV_CONFIG['mysql-username']} -e TESTMAN_MSQL_PASSWORD=${TESTMAN_WEBSERVER_ENV_CONFIG['mysql-password']} -e TESTMAN_DEVICEFARM_HOST=${TESTMAN_WEBSERVER_ENV_CONFIG['device-farm-url']} -e TESTMAN_DEVICEFARM_AUTHKEY=${TESTMAN_WEBSERVER_ENV_CONFIG['device-farm-authkey']} -e TESTMAN_REDIS_HOST=${TESTMAN_WEBSERVER_ENV_CONFIG['redis-server-host']} -e TESTMAN_REDIS_PORT=${TESTMAN_WEBSERVER_ENV_CONFIG['redis-server-port']} -e TESTMAN_ATOMID_HOST=${TESTMAN_WEBSERVER_ENV_CONFIG['atomid-url']} -e TESTMAN_TESTER40_HOST=${TESTMAN_WEBSERVER_ENV_CONFIG['tester40-public-url']} -e TESTMAN_CLIENT_HOST=${TESTMAN_WEBSERVER_ENV_CONFIG['testman-client-public-url']}"

###============================================###
# START APP, DONOT EDIT

# Check deployment folder exist or not
if [ -z $DEPLOYMENT_FOLDER ] || [ ! -d $DEPLOYMENT_FOLDER ]; then
  echo "DEPLOYMENT_FOLDER empty or folder does not exist!"
  exit
fi

# Create atomp_automation_network bridge network if not found
dockernetwork=$(docker network ls --filter name=atomp_automation_network -q)
if [ -z $dockernetwork ]; then
  docker network create --driver bridge atomp_automation_network
fi

for APP_NAME in "${!SERIVCE_APP_NAME[@]}"
do

if [ ${SERIVCE_APP_NAME[$APP_NAME]} = 0 ]; then
    echo "Do not load app $APP_NAME!"
    continue
fi

SCRIPT_TYPE=$DEPLOY_SCRIPT_MODE
IMAGE_COMPRESSED_FILE=${DOCKER_IMAGE_ARCHIVED_FILES["$APP_NAME"]}
INPUT_IMAGE_ID=${SERIVCE_APP_IMAGE_ID["$APP_NAME"]}

APP_PORT=${APP_RUNNING_PORT_LIST["$APP_NAME"]}
APP_WEBSOCKET_PORT=${APP_WEBSOCKET_PORT_LIST["$APP_NAME"]}
DOCKER_RUN_PARAMS=${DOCKER_RUN_PARAMS_LIST["$APP_NAME"]}
APP_MEMORY=${APP_MEMORY_LIST["$APP_NAME"]}

echo ""
echo "[INFO] App Image:        $INPUT_IMAGE_ID" 
echo "[INFO] App Package:      $IMAGE_COMPRESSED_FILE"
echo "[INFO] App Name:         $APP_NAME"
echo "[INFO] App Port:         $APP_PORT"
echo "[INFO] App Memory:       $APP_MEMORY"
echo "[INFO] App Websocket Port:  $APP_WEBSOCKET_PORT"
echo "[INFO] App Run Params:   $DOCKER_RUN_PARAMS"

if [ -z "$APP_PORT" ]; then
   echo "[INFO] Not Found APP_PORT. Progress is stopped."
   continue
fi

# Load container info
container_id=$(docker ps -a  --filter name=^/$APP_NAME$ --format "{{.ID}}")
container_image=$(docker ps -a --filter name=^/$APP_NAME$ --format "{{.Image}}")
image_id=$(docker images --filter=reference="$container_image" -q)

### =========== Validate

# Specify image id manually
if [ $SCRIPT_TYPE = 1 ] && [ ! -z "$INPUT_IMAGE_ID" ]; then
   verify_image_id=$(docker images | grep $INPUT_IMAGE_ID)
   if [ "$verify_image_id" == 0 ]; then
      echo ""
      echo "Not found image id!"
      continue
   fi
   image_id=$INPUT_IMAGE_ID
fi

if [ $SCRIPT_TYPE = 1 ] && [ -z "$image_id" ]; then
   echo ""
   echo "Not found image id!"
   continue
fi

# Remove old app

if [ ! -z "$container_id" ]; then
   echo ""
   echo "[INFO] Removing old container... $container_id"
   docker rm -f $container_id
fi

# Load new image
if [ $SCRIPT_TYPE = 2 ]; then

   bk_image_id=$image_id;

   # Install new app
   compressed_file=$IMAGE_COMPRESSED_FILE

   if [ -f "$compressed_file.gz" ] && [ ! -f $compressed_file ]; then
     echo ""
     echo "[INFO] Extract $compressed_file.gz . . ."
     gunzip -k "$compressed_file.gz"
   fi

   if [ ! -f  $compressed_file ]; then
      echo ""
      echo "[INFO] Not Found App Package File: $IMAGE_COMPRESSED_FILE. Progress is stopped."
      continue
   fi

   echo ""
   echo "[INFO] Loading image to docker... $compressed_file"

   LOAD_IMAGE_RESPONSE=$(docker load -i $compressed_file -q)
   echo $LOAD_IMAGE_RESPONSE

   if [[ $LOAD_IMAGE_RESPONSE == *"Loaded image: "* ]]
   then
      IMAGE_TAG=${LOAD_IMAGE_RESPONSE:13}
      echo "Image tag: "
      echo $IMAGE_TAG
      image_id=$(docker images --filter=reference="$IMAGE_TAG" -q)
   elif [[ $LOAD_IMAGE_RESPONSE == *"Loaded image ID: sha256:"* ]]
   then
      image_id=${LOAD_IMAGE_RESPONSE:24:12}
   else
      echo "Could not read image tag or image id"
      continue
   fi

   verify_image_id=$(docker images | grep $image_id)
   if [ "$verify_image_id" == 0 ]; then
      echo ""
      echo "Not found image id!"
      continue
   fi

   echo "Load image completed! ====="
   echo "Image id: "
   echo $image_id

   # Remove old image (only if different from newly loaded image)
   if [ ! -z "$bk_image_id" ] && [ "$bk_image_id" != "$image_id" ]; then
      echo ""
      echo "[INFO] Removing old image... $bk_image_id"
      docker rmi -f $bk_image_id
   fi
   
   # echo ""
   # echo "[INFO] Removing package file... $compressed_file"
   # rm -f "$compressed_file"
fi

echo "" 
echo "[INFO] Starting app... $APP_NAME $image_id"

# Docker Param: APP_PORT
APP_PORT_INTERNAL=3000

DOCKER_RUN_PARAMS="$DOCKER_RUN_PARAMS -p $APP_PORT:$APP_PORT_INTERNAL"

# Docker Param: APP_WEBSOCKET_PORT
if [ ! -z "$APP_WEBSOCKET_PORT" ]; then
   DOCKER_RUN_PARAMS="$DOCKER_RUN_PARAMS -p $APP_WEBSOCKET_PORT:3030"
fi

# PROXY ENV
# [ ! -z "$HTTPS_PROXY" ] && [ $APP_NAME = "tester40-web" -o $APP_NAME = "studio-web" ]
if [ ! -z "$HTTP_PROXY" ] && [ $APP_NAME = "tester40-web" ]; then
   DOCKER_RUN_PARAMS="$DOCKER_RUN_PARAMS -e HTTP_PROXY=$HTTP_PROXY"
fi
if [ ! -z "$HTTPS_PROXY" ] && [ $APP_NAME = "tester40-web" ]; then
   DOCKER_RUN_PARAMS="$DOCKER_RUN_PARAMS -e HTTPS_PROXY=$HTTPS_PROXY"
fi
if [ ! -z "$NO_PROXY" ] && [ $APP_NAME = "tester40-web" ]; then
   DOCKER_RUN_PARAMS="$DOCKER_RUN_PARAMS -e NO_PROXY=$NO_PROXY"
fi

# if [ "$APP_NAME" != "tester40-client" -a "$APP_NAME" != "studio-client" -a "$APP_NAME" != "testman-client" -a "$APP_NAME" != "appium-web" ]; then
#   DOCKER_RUN_PARAMS="$DOCKER_RUN_PARAMS --restart always"
# fi

echo "[INFO] Docker params: $DOCKER_RUN_PARAMS"

docker run \
   $DOCKER_RUN_PARAMS \
   --name $APP_NAME \
   --memory=$APP_MEMORY \
   -d \
   $image_id

echo ""
docker images

echo ""
docker ps -a

echo ""
echo "[INFO] Deployment is done."

done
