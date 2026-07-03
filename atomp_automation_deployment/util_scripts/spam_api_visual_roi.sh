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

export https_proxy="username:pwd@fsoft-proxy:8080"

function make_request() {
  # local url=$1
  # local method=${2:-GET}
  # local data=$3
  # local headers=$4
  local method=POST
  # local url="http://10.5.187.190:8888/ai/api/compare/visual_roi"
  # local url="http://10.38.70.65:1337/api/compare/visual_roi"
  # local data='{"input_link":"https://10.5.187.190/storage/file/c4afb993-d9eb-415d-995b-c9b494c3c82c","test_link":"https://10.5.187.190/storage/file/7f080554-7b65-46f5-86b7-8b10a1bf9f02","ignore_roi":[[0,2.9104750903684704,120.522315181903,720.2239079261894],[112.46261368936568,78.1343556873834,1920.5223151819032,717.5373407620103],[416.0447032416045,2.9104750903684704,1920.5223151819032,86.19405717992072]],"metrics":[]}'

  local url="https://hae-us-ai.atomp.io/api/compare/visual_roi"
  local data='{"input_link":"https://hae-automation.atomp.io/storage/file/91a6a381-5740-4a7b-868c-d22ee41da4b6","test_link":"https://hae-automation.atomp.io/storage/file/93714c7c-97a4-465e-bc83-9ff9a82c46d7","ignore_roi":[[1434.626865671642,2.6865671641791047,1920,99.40298507462687],[1324.4776119402986,631.3432835820896,1915.5223880597016,720],[644.7761194029852,572.4486940298508,894.6268656716419,634.2397388059702]],"metrics":[],"expected_text":null}'

  echo "[MAIN][make_request] STARTING... -> $url"
  # In this script, -s option is used to silence any progress or error messages from curl,
  # -w option is used to specify the output format,
  # and -o /dev/null option is used to prevent the body of the response from being written to a file.
  # Ref: https://curl.se/docs/manpage.html#-w


  # Capture start time in nanoseconds
  START_TIME=$(date +%s)

  response=$(curl -k -s -o /dev/null -w "%{http_code} %{response_code} %{time_total}" -X "$method" -H "Content-Type: application/json" --data $data "$url")
  echo "[MAIN][make_request] COMPLETED REQUEST, STATUS_CODE=$response"

  # Capture end time in nanoseconds
  END_TIME=$(date +%s)

  # Calculate duration in milliseconds
  DURATION_MS=$((END_TIME - START_TIME))

  echo "[MAIN][make_request] Duration: ${DURATION_MS} s"

  # Extract the HTTP status code and status text from the response
  http_status_code=$(echo "$response" | awk '{print $1}')
  http_status_text=$(echo "$response" | awk '{print $2}')

  # if [[ $http_status_code -eq 200 ]] || [[ $http_status_code -eq 201 ]]; then
  #   echo "[MAIN][make_request] Request successful. Response: $response"
  # else
  #   echo "[MAIN][make_request] Error in curl request. Response: $response"
  # fi
  if [[ $http_status_code -ne 200 ]] && [[ $http_status_code -ne 201 ]]; then
    echo "[MAIN][make_request] Error in curl request. Response: $response"
  fi
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

# while sleep 0.5; do curl -s -o /dev/null -w "%{http_code}" -X "POST" --data '{"input_link":"https://10.5.187.190/storage/file/c4afb993-d9eb-415d-995b-c9b494c3c82c","test_link":"https://10.5.187.190/storage/file/7f080554-7b65-46f5-86b7-8b10a1bf9f02","ignore_roi":[[0,2.9104750903684704,120.522315181903,720.2239079261894],[112.46261368936568,78.1343556873834,1920.5223151819032,717.5373407620103],[416.0447032416045,2.9104750903684704,1920.5223151819032,86.19405717992072]],"metrics":[]}' "http://10.5.187.190:8888/api/compare/visual_roi";done