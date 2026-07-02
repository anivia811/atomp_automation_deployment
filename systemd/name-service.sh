[Unit]
Description=ATOMP ID Application

[Service]
# User=root
# EnvironmentFile=/home/nhunhatom/.bashrc # not work
Environment=NODE_ENV=development
WorkingDirectory=/home/nhunhatom/Documents/ATOM_ID/source/atom-id-server
# ExecStart=/bin/bash -c "source /home/nhunhatom/.bashrc && nvm use 10 && node server.js" # Not work
ExecStart=/home/nhunhatom/.nvm/versions/node/v10.24.1/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target