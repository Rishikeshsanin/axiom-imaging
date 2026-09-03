#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-10000}"
export ORTHANC_PASSWORD="${ORTHANC_PASSWORD:?ORTHANC_PASSWORD is required}"
export ORTHANC__REGISTERED_USERS="{\"axiom\":\"${ORTHANC_PASSWORD}\"}"
export ORTHANC__REMOTE_ACCESS_ALLOWED="true"
export ORTHANC__AUTHENTICATION_ENABLED="true"
export DICOM_WEB_PLUGIN_ENABLED="true"
export OHIF_PLUGIN_ENABLED="true"
export ORTHANC__DICOM_WEB__ENABLE="true"
export ORTHANC__OHIF__DATA_SOURCE="dicom-web"
export ORTHANC_URL="http://127.0.0.1:8042"
export ORTHANC_PUBLIC_URL="${ORTHANC_PUBLIC_URL:-https://${RENDER_EXTERNAL_HOSTNAME:-localhost}}"
export DEVICE_ENGINE_HOST="127.0.0.1"
export DEVICE_ENGINE_PORT="9300"

sed "s/__PORT__/${PORT}/g" /opt/axiom/nginx.conf > /tmp/axiom-nginx.conf

cleanup() {
  set +e
  kill "${API_PID:-}" "${ORTHANC_PID:-}" "${DEVICE_PID:-}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

/usr/local/bin/axiom-device-engine &
DEVICE_PID=$!

/docker-entrypoint.sh /tmp/orthanc.json &
ORTHANC_PID=$!

cd /opt/axiom/api
/opt/axiom/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 &
API_PID=$!

for _ in $(seq 1 60); do
  if curl -fsS -u "axiom:${ORTHANC_PASSWORD}" http://127.0.0.1:8042/system >/dev/null \
    && curl -fsS http://127.0.0.1:8000/api/health >/dev/null; then
    break
  fi
  sleep 1
done

nginx -c /tmp/axiom-nginx.conf -g 'daemon off;' &
NGINX_PID=$!

wait -n "$NGINX_PID" "$API_PID" "$ORTHANC_PID" "$DEVICE_PID"
exit 1
