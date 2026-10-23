#!/usr/bin/env bash
# PA05 D14C13: apply the already-generated, CA-signed CRL only inside
# the disposable GitHub Actions PostgreSQL18 worker_a. Not production PKI.
set -euo pipefail
cid="${1:?worker_a container id required}"
out="${RUNNER_TEMP:-/tmp}/pa05-d14c12-tls"
test -s "$out/revoked.crl"
openssl crl -in "$out/revoked.crl" -noout -text | grep -q 'Serial Number: 1092'
docker cp "$out/revoked.crl" "$cid:/tmp/pa05-server-tls/revoked.crl"
docker exec -u root "$cid" chown postgres:postgres /tmp/pa05-server-tls/revoked.crl
docker exec "$cid" psql -U proof -d pa05_worker_a -v ON_ERROR_STOP=1 \
  -c "ALTER SYSTEM SET ssl_crl_file = '/tmp/pa05-server-tls/revoked.crl'"
docker exec "$cid" psql -U proof -d pa05_worker_a -v ON_ERROR_STOP=1 \
  -Atc "SELECT pg_reload_conf()" | grep -qx t
for i in $(seq 1 30); do
  current="$(docker exec "$cid" psql -U proof -d pa05_worker_a -Atc 'SHOW ssl_crl_file')"
  if [ "$current" = "/tmp/pa05-server-tls/revoked.crl" ]; then
    echo "PA05_D14C13_ACTUAL_PG18_CRL_RELOADED"
    exit 0
  fi
  sleep 1
done
echo "PA05_D14C13_CRL_NOT_LOADED" >&2
exit 1
