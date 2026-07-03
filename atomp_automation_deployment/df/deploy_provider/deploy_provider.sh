#! /bin/bash

# USER="$1"
# PASSWORD="$2"
# INDEX="$3"
# LOCATION="$4"
# FRAMEDROP="$5"
USER="devicefarm4"
PASSWORD="123123"
INDEX="1"
LOCATION="MCTech"
FRAMEDROP="0"


# option -i mean directly replace text in file instead of write to stdout
# 3 lodash here
sed -i -e "s/___USER___/${USER}/g" install.sh

sed -i -e "s/__USER__/${USER}/g" -e "s/__PASSWORD__/${PASSWORD}/g" -e "s/__INDEX__/${INDEX}/g" -e "s/__LOCATION__/${LOCATION}/g" script/provider/build_systemd.sh
sed -i -e "s/__USER__/${USER}/g" -e "s/__PASSWORD__/${PASSWORD}/g" -e "s/__INDEX__/${INDEX}/g" -e "s/__LOCATION__/${LOCATION}/g" -e "s/__FRAMEDROP__/${FRAMEDROP}/g" script/provider-linux/build_systemd.sh
sed -i -e "s/__USER__/${USER}/g" -e "s/__PASSWORD__/${PASSWORD}/g" -e "s/__INDEX__/${INDEX}/g" -e "s/__LOCATION__/${LOCATION}/g" -e "s/__FRAMEDROP__/${FRAMEDROP}/g" script/provider-ccnc/build_systemd.sh

. ./install.sh
