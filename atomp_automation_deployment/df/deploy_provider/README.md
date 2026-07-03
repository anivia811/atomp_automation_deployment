## Config
  Change config params at /script/provider/config.sh & /script/provider-linux/config.sh (at field marked with #Need change)

## Install & run
```$
sudo bash install.sh
```
## Config linux HU
  run remoteserver (FKR RemoteHU folder)
  copy file LinuxADB/linuxadb (for x86_64 HU) or LinuxADB/linuxadb-aarch64 (for aarch64 HU) to HU
  ssh to HU and run 2 following commands:
```$
chmod u+x linuxadb (linuxadb-aarch64)
./linuxadb & (./linuxadb-aarch64 &)
```