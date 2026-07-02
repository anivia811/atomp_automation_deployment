# ATOMID Web Application – Docker Compose Guide

This document describes how to start the ATOMID web application using Docker Compose and initialize the database.

---

## Prerequisites

- Docker installed
- Docker Compose installed  
  - Newer versions: `docker compose`
  - Older versions: `docker-compose`
- Bash shell
- Database dump file: `atomid_2026apr16.sql`
- Docker image archive: `atomid_web.tar.gz`

---

## Startup Instructions

### 1. Change to the configuration directory

```bash
cd <configuration-folder>
```

Replace `<configuration-folder>` with the directory containing `docker-compose.yml`, `start.sh`, and related configuration files.

---

### 2. Load the Docker image

Extract and load the compressed Docker image:

```bash
tar -zxf atomid_web.tar.gz
docker load -i atomid_web.tar
```

> **Note:**  
> If your Docker installation requires `sudo`, add it before the commands:
>
> ```bash
> sudo docker load -i atomid_web.tar
> ```

---

### 3. Start the application

Run the startup script:

```bash
bash start.sh
```

> **Important:**  
> Depending on your Docker version, the Docker Compose command may differ:
>
> - Newer versions: `docker compose up`
> - Older versions: `docker-compose up`
>
> If needed, edit `start.sh` and update the Docker Compose command accordingly.

---

### 4. Initialize the database

Execute the following commands to reset and load the database:

```bash
docker exec -i atomid-mysql mysql -u'atomp' -p'atomp@12345' -e "DROP DATABASE atomid;"
docker exec -i atomid-mysql mysql -u'atomp' -p'atomp@12345' -e "CREATE DATABASE atomid;"
docker exec -i atomid-mysql mysql -u'atomp' -p'atomp@12345' atomid < atomid_2026apr16.sql
```

---

### 5. Access the web application

Open your browser and navigate to:

```
http://localhost:8081
```

---

### 6. Default account

- **Username:** `admin@atomp.io`
- **Password:** `atomp@12345`
