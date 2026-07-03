. ./config.sh

NGINX_CONTAINER_NAME="df-nginx"

docker rm -f $NGINX_CONTAINER_NAME
docker compose down
