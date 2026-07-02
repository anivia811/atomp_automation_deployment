#!/bin/bash

MYSQL_PASSWORD="asdwer321"
MYSQL_APP_NAME="mysql-auto"
REDIS_APP_NAME="redis-auto"
DEPLOYMENT_PATH="/home/a1/atomp-2/atomp_automation_deployment"

#Ref: https://stackoverflow.com/questions/192249/how-do-i-parse-command-line-arguments-in-bash
POSITIONAL_ARGS=()

while [[ $# -gt 0 ]]; do
  case $1 in
    -p|--password)
      MYSQL_PASSWORD="$2"
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

### Create docker bridge network
# Create atomp_automation_network bridge network if not found
dockernetwork=$(docker network ls --filter name=atomp_automation_network -q)
if [ -z $dockernetwork ]; then
  docker network create --driver bridge atomp_automation_network --subnet 172.23.0.0/16 --gateway 172.23.0.1
fi

### Start mysql container
echo "[INFO] Start mysql container . . ."
old_mysql_container_id=$(docker ps -a  --filter name=^/$MYSQL_APP_NAME$ --format "{{.ID}}")

if [ ! -z "$old_mysql_container_id" ];
then
  echo ""
  echo "[INFO] Found Mysql container... $old_mysql_container_id"
  echo "[INFO] Stop creating new mysql container"
else
  if [ -f mysql_server.tar.gz ]; then
      echo ""
      echo "[INFO] Load image mysql_server.tar.gz . . ."
      gunzip -c mysql_server.tar.gz | docker load
   fi
  docker run -d --name $MYSQL_APP_NAME --network=atomp_automation_network -v $DEPLOYMENT_PATH/app_data/mysql/mysql-volume:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=$MYSQL_PASSWORD -e MYSQL_ROOT_HOST=% mysql:8.0.43 --default-authentication-plugin=mysql_native_password
fi

### Start redis container
echo "[INFO] Start redis container . . ."
old_redis_container_id=$(docker ps -a  --filter name=^/$REDIS_APP_NAME$ --format "{{.ID}}")

if [ ! -z "$old_redis_container_id" ];
then
  echo ""
  echo "[INFO] Found Redis container... $old_redis_container_id"
  echo "[INFO] Stop creating new redis container"
else
  if [ -f redis_server.tar.gz ]; then
      echo ""
      echo "[INFO] Load redis_server.tar.gz . . ."
      tar -zxvf redis_server.tar.gz
      gunzip -c redis_server.tar.gz | docker load
   fi
  docker run -d --name $REDIS_APP_NAME --network=atomp_automation_network redis:8.2.2
fi
