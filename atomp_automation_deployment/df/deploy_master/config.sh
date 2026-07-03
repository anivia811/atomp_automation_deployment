# -----------------------------------------
# Init volumes
export RETHINKDB_VOLUME="/data/atomp_df_volumes/rethinkdb"
export REDIS_VOLUME="/data/atomp_df_volumes/redis"
export MYSQL_VOLUME="/data/atomp_df_volumes/mysql"
export STORAGE_VOLUME="/data/atomp_df_volumes/storage"
export STORAGE_PERMANENT_VOLUME="/data/atomp_df_volumes/storage-permanent"



# -----------------------------------------
# WEB
export BUILD_ENV="prod"
export SECURED=""
export SECRET_KEY="atom@nuclear!"
export DEVICEFARM_IMAGE="devicefarm:upgraded-260618-fix3"
export DOMAIN="10.193.9.70" #Need change 1 (your web server domain or ip. eg: localhost, 192.168.1.1, domain.com)
export ATOMID_URL="http://10.193.9.70/atomid" #Need change 2 (your atomid server. eg: http://localhost:8081)
export EXTERNAL_STORAGE_URL="http://$DOMAIN/storage/upload/tmp" #Need change 3

# path that external client use to connect APPLICATION
export WEB_APP_URL="http://$DOMAIN:8180/devicefarm/"
# call from client
export WEB_APP_AUTH_URL="$ATOMID_URL/login?callback=$WEB_APP_URL"
# call from server (app, api, ...)
export API_GET_USER_INFO_URL="http://${DOMAIN}:8081/api/get-user-by-email"
export LIST_COMPANY_API="http://${DOMAIN}:8081/api/companies"
export LIST_PROJECT_API="http://$DOMAIN/tester40/api/project/service/list-project-by-user-company" #Need change 4
export ADMINISTRATOR="atom@gst.io,admin@hae.com,admin2@hae.com"
# path that apk, ipa, image use to connect to storage temp server
export STORAGE_URL="http://storage-temp:3000"
export LIST_USER_API="http://${DOMAIN}:8081/api/atomid/users"

# -----------------------------------------
# NGINX
DF_GATEWAY_IP="172.21.0.1" #Need change: keep 172.17.0.1 if your're using linux or change to "host.docker.internal" in case you're using macos or windows
NGINX_DOMAIN="$DOMAIN"
