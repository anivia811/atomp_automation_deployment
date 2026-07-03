#!/bin/bash

# Get execute root dir
SOURCE=${BASH_SOURCE[0]}
while [ -L "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR=$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )
  SOURCE=$(readlink "$SOURCE")
  [[ $SOURCE != /* ]] && SOURCE=$DIR/$SOURCE # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR=$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )

mkdir -p "$DIR/app_data/storage_webserver/uploads"
mkdir -p "$DIR/app_data/studio_webserver/tmp"
mkdir -p "$DIR/app_data/tasker_webserver/tmp"
mkdir -p "$DIR/app_data/tasker_webserver/data"
mkdir -p "$DIR/app_data/tasker_webserver/uploads"
mkdir -p "$DIR/app_data/tester40_webserver/tmp"
mkdir -p "$DIR/app_data/tester40_webserver/data"
mkdir -p "$DIR/app_data/tester40_webserver/uploads"
mkdir -p "$DIR/app_data/nginx"
mkdir -p "$DIR/app_data/mysql"