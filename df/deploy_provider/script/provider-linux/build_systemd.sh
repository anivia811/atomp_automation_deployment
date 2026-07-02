#============================
# BUILD CONFIGURATION
#============================

IPS=$(hostname -I)
IP="127.0.0.1"
for c in ${IPS};
do
  IP=$c;
  break;
done

echo $IP

export NODE_TLS_REJECT_UNAUTHORIZED='0'
BUILD_ENV="production"
SECURED="s"
USING_STREAM_GATE=true
USING_APPIUM=false
APPIUM_CONFIG=""

PROVIDER_IP_ADDRESS=$IP
MASTER_DOMAIN="10.5.191.174"
MASTER_IP_ADDRESS=10.5.191.174
# APPIUM_URL="$MASTER_IP_ADDRESS:8888/appium-l/h/$PROVIDER_IP_ADDRESS/p/3000"
APPIUM_URL="$PROVIDER_IP_ADDRESS:3000"
PUBLIC_HOST=""

# Config feature software update
PROVIDER_USERNAME=devicefarm4 #Need change 1
PROVIDER_PASSWORD=123123 #Need change 2
NODEJS_V15_PATH="$HOME/HAE_Deployment/deploy_provider/resource/node-v15.9.0-linux-x64/bin/node"


TRIPROXY_DEV_CONNECT_SUB="${MASTER_IP_ADDRESS}:7250"
TRIPROXY_DEV_CONNECT_PUSH="${MASTER_IP_ADDRESS}:7270"
STORAGE_ADDRESS="http$SECURED://$MASTER_DOMAIN"
EXTERNAL_STORAGE_URL="https://10.5.191.174/storage/upload/tmp"
PROVIDER_STORAGE_URL="http://${IP}:4729/storage/upload"

# PROVIDER 001
PROVIDER_NAME="MCTech_04_L" #Need change 3
PROVIDER_ADDRESS="${PROVIDER_IP_ADDRESS}" #Use real IP of provider on production
PROVIDER_LOCATION="MCTech" #Need change 4

# DOCKER
DOCKER_SECRET_KEY="atom@nuclear!"
# DOCKER_STF_BUILD_IMAGE="openstf

export DF_ENV=prod

ZMQ_TCP_KEEPALIVE=1 ZMQ_TCP_KEEPALIVE_IDLE=3 stf provider-linux \
  --name "${PROVIDER_NAME}" \
  --location "${PROVIDER_LOCATION}" \
  --connect-sub "tcp://${TRIPROXY_DEV_CONNECT_SUB}" \
  --connect-push "tcp://${TRIPROXY_DEV_CONNECT_PUSH}" \
  --storage-url "${STORAGE_ADDRESS}" \
  --storage-permanent-url "${STORAGE_ADDRESS}" \
  --min-port=11000 \
  --max-port=12000 \
  --heartbeat-interval 10000 \
  --screen-ws-url-pattern "ws$SECURED://${MASTER_DOMAIN}/d/${PROVIDER_LOCATION}/<%= serial %>/<%= publicPort %>/" \
  --stream-gate-client-pattern "ws$SECURED://${MASTER_DOMAIN}/c" \
  --stream-gate-device-pattern "ws$SECURED://${MASTER_DOMAIN}/dv" \
  --screen-jpeg-quality 0 \
  --fps 10 \
  --device-farm-service-token "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiREYiLCJhbGxvd19zZXJ2aWNlIjpbIlRNIiwiVGVzdGVyNDAiLCJBVE9NSUQiLCJTdG9yYWdlIl19LCJpYXQiOjE1OTYwOTE3MzN9.fx-Jb-4mo8V6LkYN39t16za3xmWruIndzZcfinDXGIcPIE71okALCl1x2gikv8nJMWJGwSug68vFgrDVW5n_yjI60Mq-qO3rpT8vxVvCEjgAKtMWyXFn_erRufoLJE0RNNVWmUzQWhelbJoA2OLcOLckBUY8W1igu-Mf7b3tFgc" \
  --appium-url "${APPIUM_URL}" \
  --using-stream-gate ${USING_STREAM_GATE} \
  --using-appium ${USING_APPIUM} \
  --appium-config ${APPIUM_CONFIG} \
  --public-host ${PUBLIC_HOST} \
  --bash-shell-server-host ${PROVIDER_IP_ADDRESS} \
  --bash-shell-server-username ${PROVIDER_USERNAME} \
  --bash-shell-server-password ${PROVIDER_PASSWORD} \
  --nodejs-v15-path ${NODEJS_V15_PATH} \
  --ssh-algo true \
  --provider-storage-url ${PROVIDER_STORAGE_URL} \
