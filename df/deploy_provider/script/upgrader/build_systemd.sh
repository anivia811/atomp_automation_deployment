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

PROVIDER_IP_ADDRESS=$IP
MASTER_IP_ADDRESS=10.5.187.190

# Config feature software update
PROVIDER_USERNAME=user #Need change 1
PROVIDER_PASSWORD=password #Need change 2


TRIPROXY_DEV_CONNECT_SUB="${MASTER_IP_ADDRESS}:7250"
TRIPROXY_DEV_CONNECT_PUSH="${MASTER_IP_ADDRESS}:7270"

# PROVIDER 001
PROVIDER_NAME="MC_Tech_Upgrader" #Need change 3
PROVIDER_LOCATION="MCTech"

ZMQ_TCP_KEEPALIVE=1 ZMQ_TCP_KEEPALIVE_IDLE=1800 stf upgrader \
  --name "${PROVIDER_NAME}" \
  --location "${PROVIDER_LOCATION}" \
  --connect-sub "tcp://${TRIPROXY_DEV_CONNECT_SUB}" \
  --connect-push "tcp://${TRIPROXY_DEV_CONNECT_PUSH}" \
  --local-ip "${PROVIDER_IP_ADDRESS}"