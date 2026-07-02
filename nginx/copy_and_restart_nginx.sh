#!/bin/bash
CONTAINER_NAME="nginx"
docker cp nginx.conf $CONTAINER_NAME:/etc/nginx/nginx.conf
docker restart $CONTAINER_NAME
docker logs -f --tail 100 $CONTAINER_NAME
