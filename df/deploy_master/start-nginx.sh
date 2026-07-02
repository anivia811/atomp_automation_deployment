. ./config.sh

# Create nginx config file
sed -e "s/__DF_GATEWAY_IP__/${DF_GATEWAY_IP}/g" \
  -e "s/__DOMAIN__/${NGINX_DOMAIN}/g" \
  ./config/nginx.template.conf |tee config/nginx.conf 

chmod 400 config/nginx.conf

NGINX_CONTAINER_NAME="df-nginx"

touch config/nginx.conf
docker rm -f $NGINX_CONTAINER_NAME
docker run -d \
  --name $NGINX_CONTAINER_NAME \
  --network=deploy_master_default \
  -v $PWD/config/nginx.conf:/etc/nginx/nginx.conf \
  -v $PWD/config:/config \
  -p 8180:80 \
  --restart on-failure:5 \
  nginx:stable-alpine

docker exec -ti -u root:root $NGINX_CONTAINER_NAME chown daemon:daemon /etc/nginx/nginx.conf
docker exec -ti -u root:root $NGINX_CONTAINER_NAME chmod 600 /etc/nginx/nginx.conf
docker exec -ti -u root:root $NGINX_CONTAINER_NAME chmod 750 /etc/nginx/conf.d

