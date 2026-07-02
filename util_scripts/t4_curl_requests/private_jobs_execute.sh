#!/bin/bash

URL="http://localhost:3000/tester40/api/private/jobs/execute"
DATA='{ "projectId": 1, "serials": ["10.206.85.196-st-0"], "scriptIds": [2] }'

EXATAUTH="Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNlcnZpY2Vfa2V5IjoiKiIsImFsbG93X3NlcnZpY2UiOlsiKiJdfSwiaWF0IjoxNTk2MDkxNzMzfQ.htXogVlyOzo5muVQEJIckwdEMiVZB4YV3_Ve9YhEMSyXUENkX7dhPvOKu1A-dYN70D_LwC0KL-4uHafZn7b3l7OT7Z2G6LaGzo8HSy6_P64B-EiXSq5eQC-xDC0QhJOP3AokWaFROkjwgCvct2-jjOXo_NBRFzw9HRrv-8FtX2c"

METHOD="POST"
HEADER0="Content-Type: application/json"
HEADER1="tester40-acl-resource: api.jobs.r012.privateexecutejob"
HEADER2="tester40-acl-right: create"
HEADER3="externalauthorization: $EXATAUTH"
# echo "$HEADER3"
curl -X $METHOD -H "$HEADER0" -H "$HEADER1" -H "$HEADER2" -H "$HEADER3" -d "$DATA" $URL
