#!/bin/bash
CONTAINER_NAME="nginx"
docker run -d --name $CONTAINER_NAME -p 80:80 nginx:1.29.6
docker cp ./proxy_params $CONTAINER_NAME:/etc/nginx
echo "FINISHED!"