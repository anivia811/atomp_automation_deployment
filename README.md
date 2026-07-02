# ATOMP Automation Deployment Guide

This document provides a practical, end-to-end guide to deploy ATOMP automation services in this deployment workspace.

## Scope

This guide covers:
- Preparing runtime dependencies
- Building or loading Docker images
- Deploying required platform services (ATOMID, DeviceFarm, NGINX)
- Configuring and running automation services via `run_app.sh`

This guide does not explain internal data content under `app_data`.

## Prerequisites

Before you start, make sure:
- Docker is installed and running.
- Docker Compose is installed.
- Bash version is 4.0 or higher.
- You run deployment scripts with `bash` (not `zsh`).

Quick checks:

```bash
bash --version
docker --version
docker compose version
```

## Deployment Workspace Structure

Important folders and scripts:
- `run_app.sh`: Main script to deploy automation services.
- `initial_app_data_folder.sh`: Creates required folder structure for service data.
- `setup_mysql_redis/`: Scripts for MySQL and Redis setup.
- `build_image/`: Build scripts and outputs for service images.
- `docker_images/`: Image archives (`.tar` / `.tar.gz`) used by deployment script.
- `ATOMID_Deployment/`: ATOMID deployment resources.
- `df/`: DeviceFarm and NGINX deployment resources.

## Recommended Deployment Flow

Follow this order to reduce deployment issues.

### Step 1: Initialize Data Folders

```bash
bash initial_app_data_folder.sh
```

### Step 2: Set Up Database Services (MySQL and Redis)

Update configuration in [setup_mysql_redis/start_mysql_redis.sh](setup_mysql_redis/start_mysql_redis.sh):

```bash
MYSQL_PASSWORD="asdwer321"
MYSQL_APP_NAME="mysql-auto"
REDIS_APP_NAME="redis-auto"
DEPLOYMENT_PATH="/Users/projects/fsoft/atomp/atomp_automation_deployment"
```

Then start services:

```bash
cd setup_mysql_redis
bash start_mysql_redis.sh
cd ..
```

### Step 3: Build or Prepare Service Images

Read and run instructions in [build_image](build_image).

After building, move generated images from `./build_image/output_images/` to `./docker_images/`.

### Step 4: Deploy ATOMID

ATOMID handles authentication and authorization across platform services.

Follow instructions in [ATOMID_Deployment](ATOMID_Deployment).

### Step 5: Deploy DeviceFarm

Note: Skip this step if you have already deployed DeviceFarm.

DeviceFarm provides device management and execution support for mobile testing.

1. Configure [df/config.sh](df/config.sh).
2. Create the DeviceFarm Docker network:

```bash
cd df
bash create_df_docker_network.sh
```

3. Start DeviceFarm services:

```bash
cd df
bash start.sh
```

### Step 6: Deploy NGINX (Optional)

Use this step if you need reverse proxy routing.

Update [df/config/nginx.template.conf](df/config/nginx.template.conf):
- For local environments without TLS, switch HTTPS directives to HTTP.
- Ensure upstream ports match your values in [run_app.sh](run_app.sh).

Example:

```nginx
upstream tester40_web {
    server 10.38.70.61:33000;  # APP_RUNNING_PORT_LIST["tester40-web"]
}

upstream studio_web {
    server 10.38.70.61:33300;  # APP_RUNNING_PORT_LIST["studio-web"]
}
```

Start NGINX:

```bash
cd df
bash start-nginx.sh
```

### Step 7: Configure and Deploy Automation Services

Open [run_app.sh](run_app.sh) and review the following sections.

#### 7.1 Deployment Folder

```bash
DEPLOYMENT_FOLDER="/path/to/deployment"
```

#### 7.2 Service Selection

Enable or disable services (`1` = deploy, `0` = skip):

```bash
declare -A SERIVCE_APP_NAME
SERIVCE_APP_NAME["tester40-client"]=1
SERIVCE_APP_NAME["tester40-web"]=1
SERIVCE_APP_NAME["tasker-web"]=1
SERIVCE_APP_NAME["studio-client"]=0
SERIVCE_APP_NAME["studio-web"]=0
SERIVCE_APP_NAME["storage-web"]=0
SERIVCE_APP_NAME["appium-web"]=0
SERIVCE_APP_NAME["testman-client"]=0
SERIVCE_APP_NAME["testman-web"]=0
```

#### 7.3 Port Configuration

```bash
declare -A APP_RUNNING_PORT_LIST
APP_RUNNING_PORT_LIST["testman-client"]=33220
APP_RUNNING_PORT_LIST["testman-web"]=33230
APP_RUNNING_PORT_LIST["tester40-client"]=34101
APP_RUNNING_PORT_LIST["tester40-web"]=33000
APP_RUNNING_PORT_LIST["tasker-web"]=33100
APP_RUNNING_PORT_LIST["appium-web"]="4723-4753"
APP_RUNNING_PORT_LIST["storage-web"]=36800
APP_RUNNING_PORT_LIST["studio-client"]=34200
APP_RUNNING_PORT_LIST["studio-web"]=33300

declare -A APP_WEBSOCKET_PORT_LIST
APP_WEBSOCKET_PORT_LIST["tester40-web"]=33030
APP_WEBSOCKET_PORT_LIST["studio-web"]=33350
```

#### 7.4 Server URLs and Network Configuration

Important: Update all URL and IP values below to match your real server environment.

```bash
# External services
ATOM_ID_URL="http://10.38.70.61/atomid"
DEVICE_FARM_URL="http://10.38.70.61:1337"
DEVICE_FARM_API_AUTH_KEY="your-api-key"
AI_SERVER_URL="http://10.38.70.61:1337"
BAMBOO_AUTOEVER_AUTHKEY=""

# Internal server IPv4 addresses
TESTER40_SERVER_IPV4="10.38.70.61"
STUDIO_SERVER_IPV4="10.38.70.61"
STORAGE_SERVER_IPV4="10.38.70.61"
TESTMAN_SERVER_IPV4="10.38.70.61"
APPIUM_SERVER_IPV4="10.38.70.61"
MYSQL_SERVER_IPV4="mysql8-container"
REDIS_SERVER_IPV4="redis-container"

# NGINX configuration (leave empty if not using NGINX)
NGINX_SERVER_PUBLIC_URL="http://10.38.70.61"
NGINX_TESTER40_PATH="/tester40"
NGINX_STUDIO_PATH="/studio"
```

For `DEVICE_FARM_API_AUTH_KEY`, create an access token in DeviceFarm (`keys` section) and paste it into this config.

#### 7.5 Database Configuration

```bash
declare -A DATABASE_CONFIGURATIONS
DATABASE_CONFIGURATIONS["mysql-server-host"]="$MYSQL_SERVER_IPV4"
DATABASE_CONFIGURATIONS["mysql-server-port"]=3306
DATABASE_CONFIGURATIONS["mysql-username"]="root"
DATABASE_CONFIGURATIONS["mysql-password"]="12345678"
DATABASE_CONFIGURATIONS["mysql-tester40-web-database-name"]="t4_dev_webserver"
DATABASE_CONFIGURATIONS["mysql-testman-web-database-name"]="No"
DATABASE_CONFIGURATIONS["mysql-tasker-web-database-name"]="t4_dev_tasker"
DATABASE_CONFIGURATIONS["mysql-storage-web-database-name"]="sto_dev_webserver"
DATABASE_CONFIGURATIONS["redis-server-host"]="$REDIS_SERVER_IPV4"
DATABASE_CONFIGURATIONS["redis-server-port"]=6379
```

#### 7.6 Memory Limits (Optional)

```bash
declare -A APP_MEMORY_LIST
APP_MEMORY_LIST["tester40-client"]="5g"
APP_MEMORY_LIST["tester40-web"]="4g"
APP_MEMORY_LIST["tasker-web"]="4g"
APP_MEMORY_LIST["storage-web"]="4g"
APP_MEMORY_LIST["appium-web"]="3g"
APP_MEMORY_LIST["studio-client"]="5g"
APP_MEMORY_LIST["studio-web"]="4g"
```

#### 7.7 Advanced Docker Parameters (Optional)

For special runtime cases, add custom `docker run` parameters.

```bash
DOCKER_RUN_PARAMS_LIST["tester40-web"]="--network=atomp_automation_network \
  -v $TESTER40_WEBSERVER_UPLOADS_FOLDER:/usr/src/app/public/uploads \
  {...other config}
  -e TESTER40_PIPE_URLS=${TESTER40_WEBSERVER_ENV_CONFIG['ai-pipe-url']}"

DOCKER_RUN_PARAMS_LIST["tasker-web"]="--network=atomp_automation_network \
  {...other config}
  -e TASKER_PIPE_URLS=${TASKER_WEBSERVER_ENV_CONFIG['ai-pipe-url']}"
```

### Start Automation Services

After all configuration is ready:

```bash
bash run_app.sh
```

## Post-Deployment Validation

Run basic checks:

```bash
docker ps -a
docker network ls
docker images
```

Validate that:
- Expected service containers are running.
- Services are bound to intended ports.
- ATOMID, DeviceFarm, and automation services can reach each other.

## Common Issues

### 1) JSON Structure Errors in Tasker/Tester40 Backend Services

If this happens, review and apply advanced Docker parameters from section 7.7.

### 2) Cannot Log In to DeviceFarm Through ATOMID

If DeviceFarm is behind NGINX in localhost mode, secure cookie settings can block authentication.

Fix:

1. Open NGINX template:

```bash
vim df/config/nginx.template.conf
```

2. In `location /`, comment out:

```nginx
proxy_cookie_flags ~.* HttpOnly Secure;
...
proxy_set_header X-Forwarded-Proto https;
...
proxy_cookie_flags token "";
```

3. Restart NGINX:

```bash
cd df
bash start-nginx.sh
```

Reason:
`Secure` cookies require HTTPS. Without SSL/TLS in localhost, auth cookies may not be accepted.

Use this workaround only for local development. For production, keep secure flags and configure proper SSL/TLS.

## Helpful Commands

- Export Docker image:

```bash
docker save -o tester40_web.tar tester40-web:latest
tar -czvf tester40_web.tar.gz tester40_web.tar
```

- Import Docker image:

```bash
gunzip -c tester40_web.tar.gz | docker load
```

- Extract `.tar.gz`:

```bash
tar -zxvf tester40_web.tar.gz -C /desired/path/
```

- Load Docker image from `.tar`:

```bash
docker load -i /desired/path/tester40_web.tar -q
```

- Compress `.tar` to `.tar.gz`:

```bash
tar -czvf tester40_web.tar.gz tester40_web.tar
```

## DF Build Provider Notes

```bash
sudo apt install graphicsmagick yasm pkg-config cmake
# ZeroMQ
apt-get install libzmq3-dev
# protobuf
sudo snap install protobuf
# Python2
sudo apt update
sudo apt install -y make build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev xz-utils tk-dev libffi-dev liblzma-dev python-openssl git
curl https://pyenv.run | bash
# Set env path in .bashrc
```

```bash
npm i
npm link
# If run fails, copy the working node_modules
```
