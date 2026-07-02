#!/usr/local/bin/bash

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

function make_request() {
  # local url=$1
  # local method=${2:-GET}
  # local data=$3
  # local headers=$4
  local url="http://localhost:8888/tnt4/tester40/api/project/15/get-project-info"
  local method=GET
  local header_authen="Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImVtYWlsIjoiZHV5dHExMUBmc29mdC5jb20udm4iLCJyb2xlIjozLCJmdWxsTmFtZSI6IlRvIFF1YW5nIER1eSAoR1NULlBSTykiLCJuYW1lIjoiZHV5dHExMSIsImp0aSI6Ijg3MjhmNzA1LTUyZDktNDRlZi05OWI3LTM0ODk3OTdmZTg2NyIsInVzZXJfaWQiOjd9LCJpYXQiOjE3MDEzOTk1OTAsImV4cCI6MTcwMTQ4NTk5MH0.gu3GXVOdCZTqhmbleQylC90LMYI70YxpuefIL5V0cQs_UAXw2r3CTwOmqpMltBF8_qDP9rdQYkKU9Kqpd3je4JcE-gcyhxHrouhp9Mc_RA0EV-QerP6aKjwgI1VVpuNo1Xx2AcyY5CNVYETBsJqhBqbAeQaAC87WeEQej13WMC"
  local header_acl_resource="tester40-acl-resource: api.project.r001.getprojectinfo"
  local header_acl_right="tester40-acl-right: read"

  echo "[MAIN][make_request] STARTING... -> $url"
  # In this script, -s option is used to silence any progress or error messages from curl,
  # -w option is used to specify the output format,
  # and -o /dev/null option is used to prevent the body of the response from being written to a file.
  # Ref: https://curl.se/docs/manpage.html#-w
  response=$(curl -s -o /dev/null -w "%{http_code}" -H "$header_authen" -H "$header_acl_resource" -H "$header_acl_right" -X "$method" "$url")
  echo "[MAIN][make_request] COMPLETED REQUEST, STATUS_CODE=$response"

  # # Extract the HTTP status code and status text from the response
  # http_status_code=$(echo "$response" | awk '{print $1}')
  # http_status_text=$(echo "$response" | awk '{print $2}')


  # if [[ $response -eq 200 ]] || [[ $response -eq 201 ]]; then
  #   echo "[MAIN][make_request] Request successful. Response code: $response"
  # else
  #   echo "[MAIN][make_request] Error in curl request. Response code: $response"
  # fi
}

count=1
# while [ $count -ne 5 ]
while true
do
  make_request
  echo "=> Number of requests sent: $count"
  ((count++))
  sleep 1
done
