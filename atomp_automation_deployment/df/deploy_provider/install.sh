#!/bin/bash

ATOMP_DF_DIR=$PWD

# install library
apt-get update
apt-get install -y vim openssh-server android-tools-adb screen libzmq3-dev zip unzip sshpass graphicsmagick python3-pip

ln -sf /usr/bin/python3 /usr/bin/python

# config nodejs 8 environment
export PATH=$ATOMP_DF_DIR/resource/node-v8.17.0-linux-x64/bin:$PATH
echo "NodeJS version: (If no version is printed => config nodejs failed)"
node -v

# create stf link
mkdir -p $ATOMP_DF_DIR/resource/node-v8.17.0-linux-x64/lib/node_modules/@devicefarmer
ln -sf $ATOMP_DF_DIR/resource/atom-device-farm $ATOMP_DF_DIR/resource/node-v8.17.0-linux-x64/lib/node_modules/@devicefarmer/stf
cd $ATOMP_DF_DIR/resource/node-v8.17.0-linux-x64/bin/
ln -sf ../lib/node_modules/@devicefarmer/stf/bin/stf stf
cd $ATOMP_DF_DIR
echo "STF PATH: (If no path is printed => config stf failed)"
which stf

# run atomp devicefarm
USER=devicefarm4 #Need change 1

echo "User: $USER"


cat provider.template.service > provider.service
sed -i -e "s:__WORKING_DIR__:${ATOMP_DF_DIR}:g" \
  -e "s/__USER__/${USER}/g" provider.service

cat provider-linux.template.service > provider-linux.service
sed -i -e "s:__WORKING_DIR__:${ATOMP_DF_DIR}:g" \
  -e "s/__USER__/${USER}/g" provider-linux.service

cat provider-ccnc.template.service > provider-ccnc.service
sed -i -e "s:__WORKING_DIR__:${ATOMP_DF_DIR}:g" \
  -e "s/__USER__/${USER}/g" provider-ccnc.service

# cat upgrader.template.service > upgrader.service
# sed -i -e "s:__WORKING_DIR__:${ATOMP_DF_DIR}:g" \
#   -e "s/__USER__/${USER}/g" upgrader.service

cp provider.service /etc/systemd/system/
cp provider-linux.service /etc/systemd/system/
cp provider-ccnc.service /etc/systemd/system/
# cp upgrader.service /etc/systemd/system/

systemctl daemon-reload

systemctl stop provider.service
systemctl start provider.service
systemctl enable provider.service

systemctl stop provider-linux.service
systemctl start provider-linux.service
systemctl enable provider-linux.service

systemctl stop provider-ccnc.service
systemctl start provider-ccnc.service
systemctl enable provider-ccnc.service

# Uncomment following if deploying in devicefarm4
# systemctl stop upgrader.service
# systemctl start upgrader.service
# systemctl enable upgrader.service
