#!/bin/bash
CONTAINER_NAME="ai-nginx"
docker run -d --name $CONTAINER_NAME -p 3131:80 nginx:latest
docker cp ./proxy_params $CONTAINER_NAME:/etc/nginx
docker cp ./ai_nginx.conf $CONTAINER_NAME:/etc/nginx/nginx.conf
docker restart $CONTAINER_NAME
echo "FINISHED!"
