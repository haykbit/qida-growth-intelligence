#!/usr/bin/env sh
set -eu

docker compose -f infra/docker-compose.yml config >/dev/null

for manifest in infra/k8s/*.yaml; do
  test -s "$manifest"
  grep -q '^apiVersion:' "$manifest"
  grep -q '^kind:' "$manifest"
done

grep -q "qida-api" Tiltfile
grep -q "qida-web" Tiltfile
grep -q "port_forwards='5173:5173'" Tiltfile

echo "Infrastructure configuration checks passed."

