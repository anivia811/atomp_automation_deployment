#!/bin/bash

IS_ADDING=1
#Ref: https://stackoverflow.com/questions/192249/how-do-i-parse-command-line-arguments-in-bash
POSITIONAL_ARGS=()
while [[ $# -gt 0 ]]; do
  case $1 in
    -a|--add)
      IS_ADDING="$2"
      shift # past argument
      shift # past value
      ;;
    -*|--*)
      echo "Unknown option $1"
      exit 1
      ;;
    *)
      POSITIONAL_ARGS+=("$1") # save positional arg
      shift # past argument
      ;;
  esac
done


source ~/.zshrc

if [ $IS_ADDING = 1 ]; then
  echo "=== START set proxy..."
  nvm use 10
  # Fsoft npm proxy guide: https://insight.fsoft.com.vn/conf/pages/viewpage.action?pageId=226569333
  npm config set registry https://hn-repo.fsoft.com.vn/repository/npm/
  npm config set sass_binary_site=https://hn-repo.fsoft.com.vn/repository/github/sass/node-sass/releases/download/
  npm config set phantomjs_cdnurl=https://hn-repo.fsoft.com.vn/repository/github/Medium/phantomjs/releases/download/v2.1.7/
  npm config set chromedriver_cdnurl=https://hn-repo.fsoft.com.vn/repository/npm-chromedriver/
  npm config set electron_mirror=https://hn-repo.fsoft.com.vn/repository/npm-electron/
  npm config set NWJS_URLBASE=https://hn-repo.fsoft.com.vn/repository/npm-nwjs/v1.4.4
  npm config set CYPRESS_INSTALL_BINARY=https://hn-repo.fsoft.com.vn/repository/npm-cypress/desktop/5.3.0/win32-x64/cypress.zip
  npm config set strict-ssl=false
  npm cache clean --force
  echo "=== END set proxy!!!"
  exit 1
fi

echo "=== START delete proxy..."
nvm use 10
npm config delete registry
npm config delete sass_binary_site
npm config delete phantomjs_cdnurl
npm config delete chromedriver_cdnurl
npm config delete electron_mirror
npm config delete NWJS_URLBASE
npm config delete CYPRESS_INSTALL_BINARY
echo "=== END delete proxy!!!"
