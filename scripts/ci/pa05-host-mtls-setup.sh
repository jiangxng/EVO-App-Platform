#!/usr/bin/env bash
# D14C12: ONLY inside disposable GitHub Actions PostgreSQL18 worker_a.
# No root keys or private credentials are added to the repository/artifacts.
set -euo pipefail
cid="${1:?pass GitHub Actions worker_a container id}"
out="${RUNNER_TEMP:-/tmp}/pa05-d14c12-tls"
umask 077
mkdir -p "$out"
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -sha256 \
  -subj "/CN=PA05 Test CA" -keyout "$out/ca.key" -out "$out/ca.crt" >/dev/null 2>&1
openssl req -newkey rsa:2048 -nodes -sha256 \
  -subj "/CN=localhost" -keyout "$out/server.key" -out "$out/server.csr" >/dev/null 2>&1
printf 'subjectAltName=DNS:localhost,IP:127.0.0.1\nextendedKeyUsage=serverAuth\n' > "$out/server.ext"
openssl x509 -req -days 1 -sha256 -in "$out/server.csr" \
  -CA "$out/ca.crt" -CAkey "$out/ca.key" -set_serial 111 \
  -extfile "$out/server.ext" -out "$out/server.crt" >/dev/null 2>&1
printf 'extendedKeyUsage=clientAuth\n' > "$out/client.ext"
for item in good bad; do
  if [ "$item" = good ]; then cn=pa05-certified-host; serial=4242; else cn=pa05-other-host; serial=4343; fi
  openssl req -newkey rsa:2048 -nodes -sha256 -subj "/CN=$cn" \
    -keyout "$out/$item.key" -out "$out/$item.csr" >/dev/null 2>&1
  openssl x509 -req -days 1 -sha256 -in "$out/$item.csr" \
    -CA "$out/ca.crt" -CAkey "$out/ca.key" -set_serial "$serial" \
    -extfile "$out/client.ext" -out "$out/$item.crt" >/dev/null 2>&1
done

docker exec -u root "$cid" mkdir -p /tmp/pa05-server-tls
for file in ca.crt server.crt server.key; do
  docker cp "$out/$file" "$cid:/tmp/pa05-server-tls/$file"
done
docker exec -u root "$cid" chown -R postgres:postgres /tmp/pa05-server-tls
docker exec -u root "$cid" chmod 600 /tmp/pa05-server-tls/server.key

run_sql() { docker exec "$cid" psql -U proof -d pa05_worker_a -v ON_ERROR_STOP=1 -Atc "$1"; }
hba="$(run_sql 'SHOW hba_file')"
# Critical: Host TLS without verified certificate and cleartext non-TLS
# both fail rather than falling back to the image's catch-all HBA rule.
docker exec -u root "$cid" sh -c 'hba="$1"; tmp="${hba}.pa05"; {
 printf "%s\n" \
 "hostssl all /^pa05c5host_.*$ 0.0.0.0/0 scram-sha-256 clientcert=verify-ca" \
 "hostnossl all /^pa05c5host_.*$ 0.0.0.0/0 reject";
 cat "$hba"; } > "$tmp"; cat "$tmp" > "$hba"; rm "$tmp"' -- "$hba"
run_sql "ALTER SYSTEM SET ssl = 'on'"
run_sql "ALTER SYSTEM SET ssl_cert_file = '/tmp/pa05-server-tls/server.crt'"
run_sql "ALTER SYSTEM SET ssl_key_file = '/tmp/pa05-server-tls/server.key'"
run_sql "ALTER SYSTEM SET ssl_ca_file = '/tmp/pa05-server-tls/ca.crt'"
docker restart "$cid" >/dev/null
for i in $(seq 1 40); do
  if pg_isready -h 127.0.0.1 -p 5433 -U proof -d pa05_worker_a >/dev/null 2>&1; then break; fi
  sleep 1
done
pg_isready -h 127.0.0.1 -p 5433 -U proof -d pa05_worker_a
if run_sql "SELECT error FROM pg_hba_file_rules WHERE error IS NOT NULL" | grep -q .; then
  echo "PA05_D14C12_INVALID_HBA" >&2; exit 1
fi
{
  echo "PA05_C12_CA_CERT=$out/ca.crt"
  echo "PA05_C12_HOST_CERT=$out/good.crt"
  echo "PA05_C12_HOST_KEY=$out/good.key"
  echo "PA05_C12_BAD_CERT=$out/bad.crt"
  echo "PA05_C12_BAD_KEY=$out/bad.key"
} >> "${GITHUB_ENV:?}"
echo "PA05_D14C12_WORKER_A_ACTUAL_TLS_CERT_CA_AND_HBA_CONFIGURED"
