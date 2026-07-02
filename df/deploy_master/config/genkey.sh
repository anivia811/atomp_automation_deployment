#! /bin/bash

# openssl x509 -req -newkey rsa:4096 -sha512 -extfile v3.ext -nodes  -days 365 -out hae.crt -keyout hae.key
openssl req -x509 -nodes -days 365 -newkey rsa:4096 -keyout hae.key -out hae.crt -sha512 -config ssl.conf