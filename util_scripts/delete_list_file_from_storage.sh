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
  local url=$1
  # local method=${2:-GET}
  # local data=$3
  # local headers=$4
  local method=DELETE

  echo "[MAIN][make_request] STARTING... -> $url"
  # In this script, -s option is used to silence any progress or error messages from curl,
  # -w option is used to specify the output format,
  # and -o /dev/null option is used to prevent the body of the response from being written to a file.
  # Ref: https://curl.se/docs/manpage.html#-w

  TOKEN="Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiVGVzdGVyNDAiLCJhbGxvd19zZXJ2aWNlIjpbIkRGIiwiVGFza2VyIiwiQVRPTUlEIiwiU3RvcmFnZSIsIlN0dWRpbyJdfSwiaWF0IjoxNTk2MDkyNTM1fQ.YmzjH_vl-oWdeeqB-L5U7XuqDkdcbmCF4zNZ6JonAy0AYwNitT1Huk9O0V79t6-YyULsJSlkcOadELWJl-S_UEjDWRDJg61DM59oe6qZfjVJfihpnVA_IYcQUsaze6CIVEu9IhXqhIinDFBfXCNjyYZiJiSM3_rnbXdAYVTnI0s"

  # Capture start time in nanoseconds
  START_TIME=$(date +%s)

  response=$(curl -k -s -o /dev/null -w "%{http_code} %{response_code} %{time_total}" -X "$method" -H "Content-Type: application/json" -H "externalauthorization: $TOKEN" "$url")
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

url_list=("https://hae-automation.atomp.io/storage/file/64f70374-4c0e-45c6-b5c0-7a9ef2847edf" "https://hae-automation.atomp.io/storage/file/1e9b7239-f206-480d-9e74-56b8c230c413" "https://hae-automation.atomp.io/storage/file/aec51c25-3de2-43f1-964c-47ee121bac86" "https://hae-automation.atomp.io/storage/file/5e5842ac-c2b3-441c-9072-7c07bc9be795" "https://hae-automation.atomp.io/storage/file/25ea4290-3dfc-431d-87a1-d3019c87d601" "https://hae-automation.atomp.io/storage/file/f495232e-8c0d-47b7-ad42-2fd09dbb3cd3" "https://hae-automation.atomp.io/storage/file/da441f4f-7b87-4c30-9e10-1228a213e611" "https://hae-automation.atomp.io/storage/file/35d3a2d6-55e2-40e6-8cff-ee619c471145" "https://hae-automation.atomp.io/storage/file/7e2c80a5-2f30-46ae-80f5-67a609792d1d" "https://hae-automation.atomp.io/storage/file/faeda3f0-1115-4e63-b848-854de0066fe1" "https://hae-automation.atomp.io/storage/file/5172ce15-156f-4b41-b1a3-a9d1525f117a" "https://hae-automation.atomp.io/storage/file/c6adb68c-5d54-4229-9336-87f418839bb3" "https://hae-automation.atomp.io/storage/file/bab34582-cae0-4476-976d-a3d1432eeb46" "https://hae-automation.atomp.io/storage/file/b817312e-1adc-4d53-82ea-4d656be80821" "https://hae-automation.atomp.io/storage/file/45b20bb8-54be-4662-8a48-6657b45ed300" "https://hae-automation.atomp.io/storage/file/7001675b-7a4b-4946-9ded-cc0cc0adf80b" "https://hae-automation.atomp.io/storage/file/9406b8a4-5d2a-479d-913b-787b83cfe7e7" "https://hae-automation.atomp.io/storage/file/c32bed30-b208-4f26-859a-2d4eca34311b" "https://hae-automation.atomp.io/storage/file/97a9dabf-1d44-4da7-a16f-96ac8850175b" "https://hae-automation.atomp.io/storage/file/427ee2b6-2c8a-4e51-95e3-624977fc1524" "https://hae-automation.atomp.io/storage/file/a6e759a7-5618-4299-be09-88c32f2f8e2d" "https://hae-automation.atomp.io/storage/file/c35722fe-54e6-4164-8357-637e521e927b" "https://hae-automation.atomp.io/storage/file/c2b0f16e-d9da-4a97-b76c-51bdbd1112eb" "https://hae-automation.atomp.io/storage/file/d6acb66d-ec88-4bc7-805f-a46cdb9ef278" "https://hae-automation.atomp.io/storage/file/12001515-18a2-48d9-8cbe-e651be3eb937" "https://hae-automation.atomp.io/storage/file/86b231a4-bd15-43ec-a2e7-6d102ffefc1e" "https://hae-automation.atomp.io/storage/file/85fabdc8-0be6-4be3-a3af-db8c65cf9c7f" "https://hae-automation.atomp.io/storage/file/8b64b876-8973-45f6-a100-e908cbd51fb4" "https://hae-automation.atomp.io/storage/file/1bd62f34-a9a6-4205-96e4-7530e5b6474b" "https://hae-automation.atomp.io/storage/file/5111a772-e885-45dc-b994-5925a20b474d" "https://hae-automation.atomp.io/storage/file/be3f94e2-a5de-4cdf-a64c-439644ee2378" "https://hae-automation.atomp.io/storage/file/c4fdf94d-02bc-431c-9709-9e538646d426" "https://hae-automation.atomp.io/storage/file/823a2765-f031-4732-b728-19661e986711" "https://hae-automation.atomp.io/storage/file/e2235d0b-f153-4246-b9c5-c8c0959a01f8" "https://hae-automation.atomp.io/storage/file/8d92abaa-81d4-403e-b00a-c871fe769f31" "https://hae-automation.atomp.io/storage/file/352f8c90-e00a-4e29-8570-06a7b91738d0" "https://hae-automation.atomp.io/storage/file/e82511a8-3d9b-4531-a699-f8162a8a4b7d" "https://hae-automation.atomp.io/storage/file/f2ab38d6-04b4-4c5a-9d12-86aab333473e" "https://hae-automation.atomp.io/storage/file/dc2fafd8-f7c6-408b-b273-ebe123222ed6" "https://hae-automation.atomp.io/storage/file/139625ae-29ed-4d6d-b2cd-319790b09fe5" "https://hae-automation.atomp.io/storage/file/883c5f9d-536f-4ec3-9e74-9096091fdc58" "https://hae-automation.atomp.io/storage/file/64ee33d2-637f-40d6-8646-21eb05b2cda2" "https://hae-automation.atomp.io/storage/file/15f97d8b-3c14-46a2-ae24-5f3383a4fec7" "https://hae-automation.atomp.io/storage/file/4e4fd43f-a148-4d41-a21f-c1f670d8f25a" "https://hae-automation.atomp.io/storage/file/91b4c0c9-fbee-4336-a16f-f953d582b914" "https://hae-automation.atomp.io/storage/file/93189841-d2df-41c3-b041-9c653692e9a1" "https://hae-automation.atomp.io/storage/file/64df8f7c-901c-4d92-b923-6250eb560ab7" "https://hae-automation.atomp.io/storage/file/2cfd6dd1-bba1-48c8-af67-1b29f354029b" "https://hae-automation.atomp.io/storage/file/b23fab45-94a7-4023-8774-8d5c7f048de3" "https://hae-automation.atomp.io/storage/file/ebc40595-4d1f-4dc0-8090-b1603b236536" "https://hae-automation.atomp.io/storage/file/ac738fcb-6401-4751-8b98-147cff4d917f" "https://hae-automation.atomp.io/storage/file/36cee88c-f026-4592-9569-eabe26cd3928" "https://hae-automation.atomp.io/storage/file/40a5bf31-da6e-4866-97f5-c8e72b3d9975" "https://hae-automation.atomp.io/storage/file/319f1572-9b66-45ee-8ff3-0a397716b1b6" "https://hae-automation.atomp.io/storage/file/3e4c37ee-c6f6-492e-b29a-266a7c6db873" "https://hae-automation.atomp.io/storage/file/6f504df6-59c1-447e-ba4e-08b92d2bfd85" "https://hae-automation.atomp.io/storage/file/1062f879-a6d4-4e68-b871-29999eaa439e" "https://hae-automation.atomp.io/storage/file/0f048de9-6a22-4fd9-b88d-16dc79da21da" "https://hae-automation.atomp.io/storage/file/0a76516b-c4ad-4443-be7e-45227c8e3bd0" "https://hae-automation.atomp.io/storage/file/45c2044d-7aa4-4b9b-a3f0-a48c8677effe" "https://hae-automation.atomp.io/storage/file/2e95353c-ec01-4cd9-8687-c5bce55195ff" "https://hae-automation.atomp.io/storage/file/f78915d5-cb60-4c49-af95-4fbd8afa08ef" "https://hae-automation.atomp.io/storage/file/f0b57037-6e83-4cb8-b83a-9122640f0c2f" "https://hae-automation.atomp.io/storage/file/ba765e00-40d7-477f-b3c3-edd6e4954e50" "https://hae-automation.atomp.io/storage/file/da0f83da-0e88-4d05-96b8-037e31953901" "https://hae-automation.atomp.io/storage/file/1170c3c2-b1e9-43be-8773-975bb9604b08" "https://hae-automation.atomp.io/storage/file/97890e44-a098-4b08-bcad-4a821d286df9" "https://hae-automation.atomp.io/storage/file/2220e021-2319-4f27-b9dd-f7f838b0e580" "https://hae-automation.atomp.io/storage/file/6c3ab441-2bea-40fe-a0c6-5e07cd768a96" "https://hae-automation.atomp.io/storage/file/953ae531-7b25-42ba-a883-f01ba46ea5af" "https://hae-automation.atomp.io/storage/file/982a1584-1a3c-4806-8d6f-d91820440f9e" "https://hae-automation.atomp.io/storage/file/44c6ae7a-cf07-454c-be46-7bf5f392c044" "https://hae-automation.atomp.io/storage/file/17688d1c-fdfc-41b2-ba2b-e28b29907d42" "https://hae-automation.atomp.io/storage/file/88270bd8-b4be-473b-a3d3-dbe1842b86d0" "https://hae-automation.atomp.io/storage/file/02a29df5-c087-4c45-a1cd-48f2a22caac2" "https://hae-automation.atomp.io/storage/file/30e90e38-0518-4a0f-8b9b-f1b66b4815d8" "https://hae-automation.atomp.io/storage/file/194124b0-28d5-4f2d-8e53-4988fd0c41f7" "https://hae-automation.atomp.io/storage/file/46b0553c-fb66-4e60-80b8-409f0c4bc531" "https://hae-automation.atomp.io/storage/file/947a495f-5268-4dc6-942d-bde9b3fe66dc" "https://hae-automation.atomp.io/storage/file/9a46e5ff-081a-46c6-aca9-723f84c274a2" "https://hae-automation.atomp.io/storage/file/6ccaaecd-f382-4698-948c-d1e395596bbc" "https://hae-automation.atomp.io/storage/file/9bdc79f4-6bbb-46a8-94eb-fb34073f7715" "https://hae-automation.atomp.io/storage/file/c2dc3557-0994-4fda-be43-ed22fbde8fb3" "https://hae-automation.atomp.io/storage/file/5a758c53-92c0-4954-b432-b500eae7aea6" "https://hae-automation.atomp.io/storage/file/da6ff38f-28d6-4510-816d-f6725de4739f" "https://hae-automation.atomp.io/storage/file/4b45b1f0-99ac-4102-8ba7-a0f307ef8784" "https://hae-automation.atomp.io/storage/file/22a39f99-ad31-4ec2-bc14-bf4a1440ae0a" "https://hae-automation.atomp.io/storage/file/b12950df-b0a0-49be-847e-1aa24cd27f71")


# Loop through the array
for item in "${url_list[@]}"; do
  make_request "$item/delete"
  sleep 0.5
done

echo "Completed"
