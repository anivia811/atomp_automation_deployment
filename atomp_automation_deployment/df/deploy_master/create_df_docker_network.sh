#!/bin/bash

DOCKER_NETWORK="deploy_master_test_default"
### Create docker bridge network
# Create atomp_automation_network bridge network if not found
dockernetwork=$(docker network ls --filter name=$DOCKER_NETWORK -q)
if [ -z $dockernetwork ]; then
  docker network create --driver bridge $DOCKER_NETWORK --subnet 172.18.0.0/16 --gateway 172.18.0.1
fi
echo "COMPLETED!"
