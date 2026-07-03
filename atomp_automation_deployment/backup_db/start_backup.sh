##### NOTE: Add to crontab (2 lines below). To edit => contab -e
# # mysql daily data backup at 02:00AM
# 0 2 * * * /bin/bash /root/atom/scripts/backupdb.sh

# # crontab mysql daily data backup at 02:00AM
# 0 2 * * * /bin/bash /root/atom/scripts/backupdb.sh

# # Root
# if [ "$(id -u)" -ne 0 ]; then
#   echo "This script must be run by root!!!"
#   exit 1
# fi

username="root"
password="asdwer321"
container="mysql-srv"
backuplog="/Users/duytq11.pro/projects/fsoft/atomp/atomp_automation_deployment/backup_db/backupdb.log"
log() {
  log_time="$(date '+%Y-%m-%dT%H:%M:%S')"
  echo "$log_time LOG/  $1" >> $backuplog
}

# db_list[0]="atid_dev_webserver"
db_list[0]="t4_hae_tasker"
db_list[1]="t4_hae_webserver"
db_list[2]="sto_hae_webserver"

#
root_backup_folder="/Users/duytq11.pro/projects/fsoft/atomp/atomp_automation_deployment/backup_db"
backup_time_tmp="$(date '+%Y_%m_%d_%H_%M_%S')"
folder_time_parts=($(echo "$backup_time_tmp" | tr '_' '\n'))
backup_folder_path="${root_backup_folder}/${folder_time_parts[0]}/${folder_time_parts[1]}/${folder_time_parts[2]}"
log "BACKUP BATCH"
#
if [ ! -d $backup_folder_path ]; then
  #log "Create new folder: $backup_folder_path"
  mkdir -p $backup_folder_path
fi
for val in "${db_list[@]}"; do
log "-------"
log "Database: $val"
#
db_name=$val
backup_file="${db_name}_${backup_time_tmp}.sql"
backup_compressed_file="${backup_file}.tar.gz"
#log "Exporting file... ${backup_file}"
docker exec $container /usr/bin/mysqldump -u $username --password=$password $db_name > "${backup_folder_path}/$backup_file"
#log "Compressing file...  ${backup_compressed_file}"
tar -czvf "${backup_folder_path}/$backup_compressed_file" -C "${backup_folder_path}"  "./$backup_file"
#log "Removing file... ${backup_file}"
rm -f "${backup_folder_path}/${backup_file}"
log "File: ${backup_folder_path}/$backup_compressed_file"
done
log "===================="
exit