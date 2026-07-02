#!/usr/local/bin/bash
echo "# =========== # =========== # =========== #"
echo "ATOMP BACKUP LOGS SCRIPT"
echo "Created at: 20230418-110200"
echo "Updated at: 20230418-110200"
echo "Version: v1.0"
echo "# =========== # =========== # =========== #"
echo "###!!! NOTE: Bash version >= 4 is required (for associative array work)"
echo "###!!! NOTE: Not support for zsh yet"
echo "================================================================="
if ((BASH_VERSINFO[0] < 4))
then
  echo "Sorry, you need at least bash-4.0 to run this script."
  exit 1
fi
##### NOTE: Add to crontab (2 lines below). To edit => crontab -e
# # mysql daily data backup at 02:00AM
# 0 2 * * * /bin/bash /root/atom/scripts/backup.sh

# ====================================================================
# TODO: Config your log folder path
root_backup_folder="/Users/uname/projects/fsoft/atomp/misc/atomp_automation_deployment/logs"
backuplog="$root_backup_folder/backup.log"

# TODO: Declare your container
declare -A container_list
container_list[0]="tester40-web"
container_list[1]="tasker-web"
container_list[2]="storage-web"
container_list[3]="studio-web"
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
docker logs --since $backup_logs_since $container_name >& "${backup_folder_path}/$backup_file"

#log "Compressing file...  ${backup_compressed_file}"
tar -czvf "${backup_folder_path}/$backup_compressed_file" -C "${backup_folder_path}"  "./$backup_file"

#log "Removing file... ${backup_file}"
rm -f "${backup_folder_path}/${backup_file}"

log "File: ${backup_folder_path}/$backup_compressed_file"

log "End backup log container: $val"
done

log "===================="

exit

