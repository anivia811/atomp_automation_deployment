#!/usr/local/bin/bash
echo "# =========== # =========== # =========== #"
echo "ATOMP BACKUP LOGS SCRIPT"
echo "Created at: 20230814-103400"
echo "Updated at: 20230814-103400"
echo "Version: v1.0"
echo "# =========== # =========== # =========== #"
echo "###!!! NOTE: Bash version >= 4 is required (for associative array work)"
echo "###!!! NOTE: Not support for zsh yet"
echo "==========================================================/;p-0======="
if ((BASH_VERSINFO[0] < 4))
then
  echo "Sorry, you need at least bash-4.0 to run this script."
  exit 1
fi
##### NOTE: Add to crontab (2 lines below). To edit => crontab -e
# # daily logs data backup at 06:00AM
# 0 6 * * * /bin/bash /root/atom/scripts/backup.sh

# ====================================================================

# TODO: Declare your service
declare -A service_list
service_list[0]="appium.service"
service_list[1]="appium-linux.service"
# service_list[2]="provider-linux.service"
# service_list[3]="provider-ccnc.service"
# service_list[4]="provider.service"
# ====================================================================
SOURCE=${BASH_SOURCE[0]}
while [ -L "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR=$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )
  SOURCE=$(readlink "$SOURCE")
  [[ $SOURCE != /* ]] && SOURCE=$DIR/$SOURCE # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR=$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )
log() {
  log_time="$(date '+%Y-%m-%dT%H:%M:%S')"
  echo "$log_time LOG/  $1"
  echo "$log_time LOG/  $1" >> $backuplog
}

# Log output folder
backuplog="$DIR/backup.log"
root_backup_folder="$DIR/logs"

# Time, create folder
backup_time_tmp="$(date '+%Y_%m_%d_%H_%M_%S')"
folder_time_parts=($(echo "$backup_time_tmp" | tr '_' '\n'))
backup_folder_path="${root_backup_folder}/${folder_time_parts[0]}/${folder_time_parts[1]}/${folder_time_parts[2]}"

log "===>>> START BACKUP DOCKER LOGS BATCH <<<==="
log "root_backup_folder: $root_backup_folder"
log "backup_time: $backup_time_tmp"
log "--------------------------------------------------"

# Create folder if not exist
if [ ! -d $backup_folder_path ]; then
  #log "Create new folder: $backup_folder_path"
  mkdir -p $backup_folder_path
fi

for val in "${service_list[@]}"; do 

log "-------"
log "Start backup log service: $val"

#
service_name=$val
backup_file="${service_name}_${backup_time_tmp}.log"
backup_compressed_file="${backup_file}.tar.gz"

#log "Exporting file... ${backup_file}"
journalctl -u $service_name --no-tail >> "${backup_folder_path}/$backup_file"

#log "Compressing file...  ${backup_compressed_file}"
tar -czvf "${backup_folder_path}/$backup_compressed_file" -C "${backup_folder_path}"  "./$backup_file"

#log "Removing file... ${backup_file}"
rm -f "${backup_folder_path}/${backup_file}"

log "File: ${backup_folder_path}/$backup_compressed_file"

log "End backup log service: $val"
done

log "===================="

exit

