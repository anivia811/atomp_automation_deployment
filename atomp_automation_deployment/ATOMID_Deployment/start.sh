#!/bin/bash

# Load docker imager
# docker load -i atomid_web.tar
# docker load -i mysql.tar  # mysql:5.7.39
# docker load -i redis.tar  # redis:latest

mkdir -p mysql-volume
chmod a+rw mysql-volume

export DOCKER_NET_IP_ATOMID=10.20.0.2
export DOCKER_NET_IP_MYSQL=10.20.0.3
export DOCKER_NET_IP_REDIS=10.20.0.4


docker compose up --detach

sleep 8s

# . ./createuser.sh

# ###################
# UPDATE MYSQL AUTHEN
#use mysql;
#update user set authentication_string='atomp@12345', plugin='mysql_native_password' where user='atomp';
#flush privileges;



# ##############################
# NGINX CONFIG SAMPLE FOR ATOMID
# server {
#   listen 80;
#   location /atomid/ {
#     proxy_pass http://10.20.0.2:8081/;
#   }
# }