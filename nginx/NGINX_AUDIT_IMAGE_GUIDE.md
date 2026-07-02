# Customize Nginx Docker Image for Audit Ownership Requirement

## Purpose

HAE security audit requires the following ownership settings inside the Nginx container:

- `/etc/nginx` must be owned by `daemon:daemon`
- `/etc/nginx/conf.d` must be owned by `daemon:daemon`
- `/etc/nginx/nginx.conf` must be owned by `daemon:daemon`

This guide shows how to create a custom Nginx Docker image that satisfies that requirement.

## Base Image Example

This document uses the following image as an example:

```bash
docker pull nginx:1.31
```

Replace the version tag if your environment uses a different Nginx release.

## Build Method

### 1. Pull the latest base image

```bash
docker pull nginx:1.31
```

### 2. Start a temporary container

```bash
docker run -ti --name nginxtest nginx:1.31 bash
```

### 3. Change ownership inside the container

Run the following commands in the container shell:

```bash
chown daemon:daemon /etc/nginx
chown -R daemon:daemon /etc/nginx/conf.d
chown daemon:daemon /etc/nginx/nginx.conf
```

### 4. Exit the container

```bash
exit
```

### 5. Commit the container as a new image

```bash
docker commit --change='CMD ["nginx", "-g", "daemon off;"]' nginxtest nginx:1.31-hae-secu-audit
```

### 6. Export the custom image

```bash
docker save nginx:1.31-hae-secu-audit | gzip > nginx_1_31_atomp_audit.tar.gz
```

## Verification

Before distributing or using the image, verify the ownership values:

```bash
docker run --rm nginx:1.31-hae-secu-audit ls -ld /etc/nginx
docker run --rm nginx:1.31-hae-secu-audit ls -ld /etc/nginx/conf.d
docker run --rm nginx:1.31-hae-secu-audit ls -l /etc/nginx/nginx.conf
```

Expected result: owner and group should be `daemon daemon`.

## Important Note About Mounted Files

If `nginx.conf` is mounted from the host, the mounted host file overrides the file that exists in the image.

That means:

- the host-side `nginx.conf` must also be owned by `daemon:daemon`
- otherwise the mounted file may fail the audit requirement even if the Docker image itself is correct

Example:

```bash
sudo chown daemon:daemon /path/to/nginx.conf
```

## DeviceFarm Specific Note

For DeviceFarm Nginx, `nginx.conf` is generated from `template.conf` and then mounted from the host into the container.

In that flow, the generated host file ownership may become `bin:bin`. When that happens, the mounted file overrides the image file and the audit check may fail.

Because of that, after generating the host-side `nginx.conf`, ensure its ownership is changed back to `daemon:daemon` before starting the container.

### After start nginx container, execute following command

```
docker exec -ti -u root:root $NGINX_CONTAINER_NAME chown daemon:daemon /etc/nginx/nginx.conf
docker exec -ti -u root:root $NGINX_CONTAINER_NAME chmod 600 /etc/nginx/nginx.conf
docker exec -ti -u root:root $NGINX_CONTAINER_NAME chmod 750 /etc/nginx/conf.d
```

## Recommended Operational Check

If your deployment mounts Nginx config files from the host, add an ownership check before container startup.

Example:

```bash
ls -ld /path/to/nginx.conf
ls -ld /path/to/conf.d
```

## Summary

To satisfy the HAE security audit:

1. Update ownership inside the image for `/etc/nginx`, `/etc/nginx/conf.d`, and `/etc/nginx/nginx.conf`
2. Commit and export the customized image
3. Make sure any host-mounted `nginx.conf` or related config files are also owned by `daemon:daemon`
4. Re-check ownership after any config generation step such as the DeviceFarm template flow
