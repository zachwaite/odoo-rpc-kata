#! /usr/bin/env bash

HOST="$ODOO_HOST";
PORT="$ODOO_PORT";
PROTOCOL="$ODOO_PROTOCOL";
DB="$ODOO_DB";
LOGIN="$ODOO_LOGIN";
PASSWORD="$ODOO_PASSWORD";

# login
read -r -d '' LOGIN_ARGS << EOF
{
  "jsonrpc": "2.0",
  "id": 999999,
  "method": "call",
  "params": {
    "service": "common",
    "method": "login",
    "args": [
      "$DB",
      "$LOGIN",
      "$PASSWORD"
    ]
  }
}
EOF

USERID=$(curl -X POST \
     -H 'Content-Type: application/json' \
     -d "$LOGIN_ARGS" \
     -s \
     "$PROTOCOL://$HOST:$PORT/jsonrpc" | jq .result)

# download data pre-counted and pre-sorted
read -r -d '' DOWNLOAD_ARGS << EOF
{
  "jsonrpc":"2.0",
  "id": 999999,
  "method":"call",
  "params": {
    "service": "object",
    "method": "execute",
    "args": [
      "$DB",
      "$USERID",
      "$PASSWORD",
      "hr.employee",
      "read_group",
      [],
      ["name", "job_title"],
      ["job_title"],
      0,
      0,
      "job_title_count DESC"
    ]
  }
}
EOF

DATA=$(curl -X POST \
     -H 'Content-Type: application/json' \
     -d "$DOWNLOAD_ARGS" \
     -s \
     "$PROTOCOL://$HOST:$PORT/jsonrpc")

# extract fields and present
echo "$DATA" \
  | jq  ".result[] | {job_title: .job_title, job_title_count: .job_title_count}" --compact-output \
  | qsv jsonl \
  | qsv table

