# Copy file to /etc/systemd/system/
Create a file named your-service-name.service and copy to /etc/systemd/system/
# File template:
[Unit]
Description=Multi Host-Port Connection Test Service
After=network.target

[Service]
ExecStart=/path/to/multi_host_port_test.sh
Restart=always
RestartSec=10
StandardOutput=append:/var/log/multi_host_port_test.log
StandardError=append:/var/log/multi_host_port_test.log

[Install]
WantedBy=multi-user.target

# Execute
sudo systemctl daemon-reload
sudo systemctl enable multi-host-port-test.service
sudo systemctl start multi-host-port-test.service
