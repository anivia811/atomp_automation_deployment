# Generate keys

  Run
```$
cd config
bash gen-key.sh
```
  Then fill your country (KR), city, company, ...

# Prepare docker images

  1. fpt/fsoft/gst/devicefarm:B2022_08_29_1354
  2. mysql:8.0.24
  3. nginx:latest
  4. rethinkdb:latest

# Change config

  1. Open file config.sh
  2. Change ip at line 15 & 16 to your server ip

# Install docker compose

  1. Check if you installed docker compose
```$
docker-compose version
```
  2. If error occurs, following instructions
```$
curl -SL https://github.com/docker/compose/releases/download/v2.7.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
sudo chmod a+x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

# Run devicefarm

```$
sudo bash start.sh
```

# Run nginx

```$
sudo bash start-nginx.sh
```