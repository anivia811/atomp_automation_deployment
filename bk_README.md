# ATOMP Automation Deployment Guide

This guide walks you through the deployment process for ATOMP automation services.

---

## Prerequisites

- Docker and Docker Compose installed
- Bash >= 4.0

---

## Deployment Steps

### Step 1: Initialize Data Folders

Create the required data directories for application services:

```bash
bash initial_app_data_folder.sh
```

---

### Step 2: Setup Database Services

#### Configure MySQL and Redis

Edit the configuration in [setup_mysql_redis/start_mysql_redis.sh](setup_mysql_redis/start_mysql_redis.sh) (commonly deployment path is current working directory):

```bash
MYSQL_PASSWORD="asdwer321"
MYSQL_APP_NAME="mysql-auto"
REDIS_APP_NAME="redis-auto"
DEPLOYMENT_PATH="/Users/projects/fsoft/atomp/atomp_automation_deployment"
```

#### Start Database Containers

```bash
cd setup_mysql_redis
bash start_mysql_redis.sh
```

---

### Step 3: Build Service Images

Refer to README.md in `./build_image`

After building, move the output images from `./build_image/output_images/` to `./docker_images/` for deployment.

---

### Step 4: Configure and Start ATOMID Service

ATOMID is the authentication and identity management service for the ATOMP platform. It handles user authentication, authorization, and session management across all services.

#### 4.1 Start ATOMID service

Refer to README.md in `./ATOMID_Deployment`

---

### Step 5: Configure and Start DeviceFarm

DeviceFarm provides device management, real-time device interaction, and test execution capabilities for mobile testing. The `df` folder contains all DeviceFarm deployment configurations and scripts.

#### 5.1 Configure DeviceFarm Environment

Edit the [config.sh](df/config.sh) file to match your environment.

#### 5.2 Create DeviceFarm Docker Network

Create the dedicated Docker network for DeviceFarm services:

```bash
cd df
bash create_df_docker_network.sh
```

#### 5.3 Start DeviceFarm Services

Start all DeviceFarm services using the start script:

```bash
cd df
bash start.sh
```

---

### Step 6: Configure and Start NGINX

NGINX serves as a reverse proxy for the ATOMP services.

#### 6.1 Configure NGINX

Edit the NGINX configuration template at `./df/config/nginx.template.conf`:

**For Local Development:**
- Convert HTTPS to HTTP if SSL/TLS is not configured
- Remove or comment out SSL certificate directives
- Change `listen 443 ssl` to `listen 80`

**Port Configuration:**
- Ensure the upstream ports match your service configuration in `run_app.sh`
- Update proxy_pass directives to point to the correct service ports

Example:
```nginx
upstream tester40_web {
    server 10.38.70.61:33000;  # Match APP_RUNNING_PORT_LIST["tester40-web"]
}

upstream studio_web {
    server 10.38.70.61:33300;  # Match APP_RUNNING_PORT_LIST["studio-web"]
}
```

#### 6.2 Start NGINX
```bash
cd df
bash start-nginx.sh
```
---


### Step 7: Configure and Start Services of automation

#### Basic Configuration

Open [run_app.sh](run_app.sh) and configure the following sections:

##### 7.1 Deployment Folder

Set the base deployment directory (commonly this is current working directory):

```bash
DEPLOYMENT_FOLDER="/path/to/deployment"
```

##### 7.2 Service Selection

Choose which services to start (1 = start, 0 = skip):

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

##### 7.3 Port Configuration

Configure service ports:

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

##### 7.4 Server URLs and Network Configuration

Configure external service URLs and server IP addresses:

```bash
# External Services
ATOM_ID_URL="http://10.38.70.61/atomid"
DEVICE_FARM_URL="http://10.38.70.61:1337"
DEVICE_FARM_API_AUTH_KEY="your-api-key"
AI_SERVER_URL="http://10.38.70.61:1337"
BAMBOO_AUTOEVER_AUTHKEY=""

# Internal Server IPv4 Addresses
TESTER40_SERVER_IPV4="10.38.70.61"
STUDIO_SERVER_IPV4="10.38.70.61"
STORAGE_SERVER_IPV4="10.38.70.61"
TESTMAN_SERVER_IPV4="10.38.70.61"
APPIUM_SERVER_IPV4="10.38.70.61"
MYSQL_SERVER_IPV4="mysql8-container"
REDIS_SERVER_IPV4="redis-container"

# NGINX Configuration (leave empty if not using NGINX)
NGINX_SERVER_PUBLIC_URL="http://10.38.70.61"
NGINX_TESTER40_PATH="/tester40"
NGINX_STUDIO_PATH="/studio"
```

>>For `DEVICE_FARM_API_AUTH_KEY`, you need to access to devicefarm and create a access token in the DeviceFarm web interface under your `keys` settings. Then copy the generated ID and paste it here.

##### 7.5 Database Configuration

Configure database connection details:

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

##### 7.6 Memory Limits (Optional)

Set memory limits for each service:

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

##### 7.7 Advanced Docker Parameters (Optional)

For advanced configurations, add custom Docker run parameters for specific services:

```bash
DOCKER_RUN_PARAMS_LIST["tester40-web"]="--network=atomp_automation_network \
  -v $TESTER40_WEBSERVER_UPLOADS_FOLDER:/usr/src/app/public/uploads \
  {...other config}
  -e TESTER40_PIPE_URLS=${TESTER40_WEBSERVER_ENV_CONFIG['ai-pipe-url']}"

DOCKER_RUN_PARAMS_LIST["tasker-web"]="--network=atomp_automation_network \
  {...other config}
  -e TASKER_PIPE_URLS=${TASKER_WEBSERVER_ENV_CONFIG['ai-pipe-url']}"
```

#### Start Services

Once configuration is complete, start the services:

```bash
bash run_app.sh
```

---

## Common Issues

### 1. JSON Structure Errors in Tasker/Tester40 Backend Services

If you encounter JSON structure errors in the backend services, apply the advanced Docker parameters configuration described in step 7.7.

### 2. Cannot Login to DeviceFarm Through ATOMID

If you're unable to authenticate with DeviceFarm when using NGINX as a reverse proxy in localhost environments, this is typically caused by secure cookie flag restrictions.

**Solution:**

1. Open the NGINX configuration file:
   ```bash
   vim df/config/nginx.template.conf
   ```

2. Locate and comment out or remove the following line of `location /`:
   ```nginx
   proxy_cookie_flags ~.* HttpOnly Secure;
   ...
   proxy_set_header X-Forwarded-Proto https;	
   ...
   proxy_cookie_flags token "";
   ```

   Change it to:
   ```nginx
   # proxy_cookie_flags ~.* HttpOnly Secure;
   ...
   # proxy_set_header X-Forwarded-Proto https;	
   ...
   # proxy_cookie_flags token "";
   ```

3. Restart the NGINX container:
   ```bash
   cd df
   bash start-nginx.sh
   ```

**Explanation:** The `Secure` flag requires cookies to be transmitted only over HTTPS connections. In localhost development environments without SSL/TLS certificates, this prevents the authentication cookies from being properly set and transmitted between ATOMID and DeviceFarm services.

**Note:** This configuration is only recommended for local development. For production deployments, keep the secure cookie flags enabled and configure proper SSL/TLS certificates.

## Helpful Commands

- Export Docker Images:
  ```bash
  docker save -o tester40_web.tar tester40-web:latest
  tar -czvf tester40_web.tar.gz tester40_web.tar
  ```

- Import Docker Images:
  ```bash
  gunzip -c tester40_web.tar.gz | docker load
  ```

- Extract tar.gz File:
  ```bash
  tar -zxvf tester40_web.tar.gz -C /desired/path/
  ```

- Load Docker Image from tar File:
  ```bash
  docker load -i /desired/path/tester40_web.tar -q
  ```

- Compress tar File to tar.gz:
  ```bash
  tar -czvf tester40_web.tar.gz tester40_web.tar
  ```

# DF
## Build provider
```
sudo apt install graphicsmagick  yasm pkg-config cmake
# Zeromq
apt-get install libzmq3-dev
# protobuf
sudo snap install protobuf
# Python2
sudo apt update
sudo apt install -y make build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev libncursesw5-dev xz-utils tk-dev libffi-dev liblzma-dev python-openssl git
curl https://pyenv.run | bash
# Set env path .bashrc
```
```
npm i
npm link
# Run error? => Copy the working node_modules
```