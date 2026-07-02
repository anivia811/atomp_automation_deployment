. ./config.sh

# Actions to perform on each provider
function perform_deploy_provider() {
    # Extracting IP and password from the array value
    IFS=':' read -ra provider_info <<< "$1"
    user="${provider_info[0]}"
    ip="${provider_info[1]}"
    password="${provider_info[2]}"
    provider_path="home/$user"

    echo "=====================Performing on $user:$ip ...====================="
    echo sshpass -p "$password" ssh $RSA $user@$ip "rm -rf /$provider_path/$RESOURCE_DIR && mkdir /$provider_path/$RESOURCE_DIR"
    # Specific actions to perform on each provider

    sshpass -p "$password" ssh $RSA $user@$ip "rm -rf /$provider_path/$RESOURCE_DIR && mkdir /$provider_path/$RESOURCE_DIR" 

    echo "Copy resource to $user:$ip ..."
    sshpass -p "$password" scp $RSA $DF_SOURCE_DIR/$RESOURCE_FILE_NAME $user@$ip:/$provider_path/$RESOURCE_DIR
    sshpass -p "$password" ssh $RSA $user@$ip "tar -xf /$provider_path/$RESOURCE_DIR/$RESOURCE_FILE_NAME -C /$provider_path/$RESOURCE_DIR" 
    
    echo "=====================Stop provider $user:$ip ...====================="
    sshpass -p "$password" ssh $RSA $user@$ip "
        cp -r /$provider_path/$DEPLOYMENT_RESOURCE_DIR/atom-device-farm/* /$provider_path/$DEPLOYMENT_RESOURCE_DIR/atom-device-farm-old && echo $password | sudo -S systemctl stop provider && echo $password | sudo -S systemctl stop provider-linux && echo $password | sudo -S systemctl stop provider-ccnc
    "
    echo "=====================Start provider $user:$ip ...====================="
    sshpass -p "$password" ssh $RSA $user@$ip "
        cp -r /$provider_path/$RESOURCE_DIR/atom-device-farm/* /$provider_path/$DEPLOYMENT_RESOURCE_DIR/atom-device-farm && echo $password | sudo -S systemctl start provider && echo $password | sudo -S systemctl start provider-linux && echo $password | sudo -S systemctl start provider-ccnc
    "

    echo "=====================Removing tmp file ...====================="
    sshpass -p "$password" ssh $RSA $user@$ip "rm -rf /$provider_path/$RESOURCE_DIR/"
    echo "Deploy on $user:$ip completed."
}

# Iterate through the providers array and perform actions
for provider in "${!LIST_PROVIDER[@]}"; do
    perform_deploy_provider "${LIST_PROVIDER[$provider]}"
done