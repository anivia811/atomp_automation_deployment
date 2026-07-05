#!/usr/local/bin/bash

#if [ "$(id -u)" -ne 0 ]; then
#  echo "This script must be run by root!!!"
#  exit 1
#fi

echo "# =========== # =========== # =========== #"
echo "ATOMP BACKUP LOGS SCRIPT"
echo "Created at: 20230418-110200"
echo "Updated at: 20230418-110200"
echo "Version: v1.0"
echo "# =========== # =========== # =========== #"
echo "###!!! NOTE: Bash version >= 4 is required (for associative array work)"
echo "###!!! NOTE: Not support for zsh yet"
echo "================================================================="

##### NOTE: Add to crontab (2 lines below). To edit => contab -e
# # mysql daily data backup at 02:00AM
# 0 2 * * * /bin/bash /root/atom/scripts/backupdb.sh

# ====================================================================
# TODO: Config your log folder path
root_backup_folder="/home/appadmin/deploy_master_TEST/backup_logs_df"
backuplog="$root_backup_folder/backupdb.log"

# TODO: Declare your container
declare -A container_list
container_list[0]="processor"
container_list[1]="report"
container_list[2]="app"
container_list[4]="websocket"
container_list[5]="groups-engine"
container_list[6]="api"
container_list[7]="schedule-job"
container_list[8]="reaper"
container_list[9]="storage-plugin-apk"
container_list[10]="storage-plugin-ipa"
container_list[11]="storage-plugin-image"
container_list[12]="stream-gate"
container_list[13]="triproxy-app"
container_list[14]="storage-temp"
container_list[15]="stream-gate-audio"
container_list[16]="triproxy-dev"
container_list[17]="storage-permanent"
container_list[17]="df-nginx"
# ====================================================================
log() {
  log_time="$(date '+%Y-%m-%dT%H:%M:%S')"
  echo "$log_time LOG/  $1"
  echo "$log_time LOG/  $1" >> $backuplog
}

# Time, create folder
backup_time_tmp="$(date '+%Y_%m_%d_%H_%M_%S')"
folder_time_parts=($(echo "$backup_time_tmp" | tr '_' '\n'))
backup_folder_path="${root_backup_folder}/${folder_time_parts[0]}/${folder_time_parts[1]}/${folder_time_parts[2]}"

backup_logs_since=""
unameOut="$(uname -s)" # Get OS name
 # MacOS
if [ $unameOut = "Darwin" ]; then
  backup_logs_since="$(date -v-1d -u +'%Y-%m-%dT%H:%M:%SZ')"
else
  # backup_logs_since="$(date -d 'yesterday' -u +'%Y-%m-%dT%H:%M:%SZ')" # -u mean: UTC
  backup_logs_since="$(date -d 'yesterday 13:00' -u +'%Y-%m-%dT00:00:00Z')"
fi

log "===>>> START BACKUP DOCKER LOGS BATCH <<<==="
log "root_backup_folder: $root_backup_folder"
log "backup_time: $backup_time_tmp"
log "backup_logs_since: $backup_logs_since"
log "--------------------------------------------------"

# Create folder if not exist
if [ ! -d $backup_folder_path ]; then
  #log "Create new folder: $backup_folder_path"
  mkdir -p $backup_folder_path
fi

for val in "${container_list[@]}"; do 

log "-------"
log "Start backup log container: $val"

#
container_name=$val
backup_file="${container_name}_${backup_time_tmp}.log"
backup_compressed_file="${backup_file}.tar.gz"

#log "Exporting file... ${backup_file}"
docker logs $container_name >& "${backup_folder_path}/$backup_file"

#log "Compressing file...  ${backup_compressed_file}"
tar -czvf "${backup_folder_path}/$backup_compressed_file" -C "${backup_folder_path}"  "./$backup_file"
chown -R appadmin:appadmin ${backup_folder_path}
chown appadmin:appadmin ${backup_folder_path}/$backup_compressed_file
#log "Removing file... ${backup_file}"
rm -f "${backup_folder_path}/${backup_file}"

log "File: ${backup_folder_path}/$backup_compressed_file"

log "End backup log container: $val"
done

log "===================="

exit


