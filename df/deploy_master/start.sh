. ./config.sh

mkdir -p $RETHINKDB_VOLUME $MYSQL_VOLUME $STORAGE_VOLUME $STORAGE_PERMANENT_VOLUME

# chmod -R a+rwx volumes

docker compose up --detach --no-recreate
