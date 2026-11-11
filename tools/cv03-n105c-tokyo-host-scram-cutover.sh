#!/usr/bin/env bash
# CV03 N1-05c: bounded Tokyo PG17 preview host-auth cutover.
# Main-only GH Actions invokes this after independently proven app SCRAM match.
# Existing business DB tables, roles, volumes and credentials are never changed.
set -euo pipefail
umask 077
test "$(id -un)" = evo-deploy
cd /opt/evo-tokyo
test -f .env && test -r compose.yaml && test -f .last-health-pass-sha

pg_sql() {
  docker compose exec -T --interactive=false postgres \
    psql -X -qAt -v ON_ERROR_STOP=1 -U evo -d postgres -c "$1" < /dev/null
}
test "$(pg_sql "SELECT current_setting('server_version_num')")" = 170011
test "$(pg_sql "SELECT count(*) FROM pg_database WHERE datname IN ('evo_dev','cv03_n105b_qa')")" = 2
test "$(pg_sql "SHOW hba_file")" = /var/lib/postgresql/data/pg_hba.conf
test "$(pg_sql "SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL")" = 0
test "$(pg_sql "SELECT count(*) FROM pg_hba_file_rules WHERE type LIKE 'host%' AND auth_method='trust'")" = 4
test "$(pg_sql "SELECT count(*) FROM pg_hba_file_rules WHERE type='local' AND auth_method='trust'")" = 2
test "$(pg_sql "SELECT (rolpassword LIKE 'SCRAM-SHA-256$%')::text FROM pg_authid WHERE rolname='evo'")" = true
for service in postgres evo; do
  container="$(docker compose ps -q "$service")"
  test -n "$container"
  test "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' "$container")" = healthy
done
echo CV03_N105C_HBA_CUTOVER_STRICT_PREFLIGHT_PASS

file=/var/lib/postgresql/data/pg_hba.conf
backup=/var/lib/postgresql/data/pg_hba.conf.cv03-n105c-before-host-scram-v2-20261111
modified=0
rollback() {
  echo CV03_N105C_HBA_ROLLBACK_ATTEMPT_START >&2
  docker compose exec -T --interactive=false postgres sh -ec \
    'test -f /var/lib/postgresql/data/pg_hba.conf.cv03-n105c-before-host-scram-v2-20261111 &&
     cp -p /var/lib/postgresql/data/pg_hba.conf.cv03-n105c-before-host-scram-v2-20261111 /var/lib/postgresql/data/pg_hba.conf' \
    || echo CV03_N105C_HBA_ROLLBACK_COPY_FAILED >&2
  pg_sql "SELECT pg_reload_conf()::text" > /dev/null \
    || echo CV03_N105C_HBA_ROLLBACK_RELOAD_FAILED >&2
  echo CV03_N105C_HBA_ROLLBACK_ATTEMPT_ENDED >&2
}
finish() {
  result=$?
  trap - EXIT
  if (( result != 0 && modified == 1 )); then rollback; fi
  exit "$result"
}
trap finish EXIT

# Durable private backup and an exact four-rule change. A wrong prior shape
# causes RED; never apply a guessed rewrite or touch local socket auth rules.
docker compose exec -T postgres sh -se <<'PATCH'
set -eu
file=/var/lib/postgresql/data/pg_hba.conf
backup=/var/lib/postgresql/data/pg_hba.conf.cv03-n105c-before-host-scram-v2-20261111
tmp=/var/lib/postgresql/data/pg_hba.conf.cv03-n105c-candidate-v2-20261111
test -f "$file" && test ! -L "$file"
test ! -e "$backup" && test ! -e "$tmp"
cp -p "$file" "$backup"
chmod 600 "$backup"
awk '
  {
    if ($1=="host" || $1=="hostssl" || $1=="hostnossl" ||
        $1=="hostgssenc" || $1=="hostnogssenc") {
      for (i=2;i<=NF;i++) {
        if ($i ~ /^#/) break
        if ($i=="trust") {$i="scram-sha-256"; changed++}
      }
    }
    print
  }
  END {if (changed!=4) exit 21}
' "$file" > "$tmp"
# The exec client may run as root while PostgreSQL server runs as
# postgres. Preserve original HBA ownership AND permissions on the new inode
# before replacement; otherwise pg_hba_file_rules reports Permission denied.
chown "$(stat -c '%u:%g' "$file")" "$tmp"
chmod "$(stat -c '%a' "$file")" "$tmp"
test "$(stat -c '%u:%g' "$tmp")" = "$(stat -c '%u:%g' "$file")"
test "$(stat -c '%a' "$tmp")" = "$(stat -c '%a' "$file")"
mv "$tmp" "$file"
PATCH
modified=1
test "$(pg_sql "SELECT count(*) FROM pg_hba_file_rules WHERE type LIKE 'host%' AND auth_method='trust'")" = 0
test "$(pg_sql "SELECT count(*) FROM pg_hba_file_rules WHERE type LIKE 'host%' AND auth_method='scram-sha-256'")" -ge 4
test "$(pg_sql "SELECT count(*) FROM pg_hba_file_rules WHERE type='local' AND auth_method='trust'")" = 2
test "$(pg_sql "SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL")" = 0
test "$(pg_sql "SELECT pg_reload_conf()::text")" = true
sleep 2
echo CV03_N105C_HBA_TCP_TRUST_REPLACED_WITH_SCRAM_AND_RELOADED_PASS

# Correct original database credential must be valid on a fresh TCP session.
right="$(docker compose exec -T --interactive=false postgres sh -ec \
  'test -n "$POSTGRES_PASSWORD"; PGPASSWORD="$POSTGRES_PASSWORD" psql -X -qAt -w -v ON_ERROR_STOP=1 -h 127.0.0.1 -U evo -d evo_dev -c "SELECT session_user||chr(124)||current_database()"')"
test "$right" = 'evo|evo_dev'
echo CV03_N105C_HBA_REAL_EVO_PASSWORD_TCP_AUTH_PASS

# Wrong passwords must fail, including the actual original superuser.
for role in evo cv03_n105b_qa_producer; do
  db=evo_dev
  if test "$role" != evo; then db=cv03_n105b_qa; fi
  if docker compose exec -T --interactive=false \
    -e PGPASSWORD=cv03-intentionally-incorrect postgres \
    psql -X -qAt -w -v ON_ERROR_STOP=1 -h 127.0.0.1 \
    -U "$role" -d "$db" -c "SELECT 1" \
    < /dev/null > /dev/null 2>&1; then
    echo CV03_N105C_HBA_BAD_PASSWORD_STILL_ACCEPTED >&2
    exit 1
  fi
done
echo CV03_N105C_HBA_SUPERUSER_AND_QA_BAD_TCP_PASSWORD_DENIED_PASS

# New PostgreSQL connection must succeed from the actual EVO runtime
# container/network using its existing, unmodified database URL.
docker compose exec -T --interactive=false evo node --input-type=module -e '
import postgres from "postgres";
const uri=process.env.APP_PLATFORM_CONVERSATION_DATABASE_URL;
if(typeof uri!=="string")process.exit(2);
const db=postgres(uri,{max:1,connect_timeout:5,idle_timeout:1});
try {
  const rows=await db.unsafe("SELECT session_user AS u,current_database() AS d");
  if(rows.length!==1||rows[0].u!=="evo"||rows[0].d!=="evo_dev")throw Error("CV03_N105C_APP_FRESH_SQL_CONNECTION_FAILED");
  console.log("CV03_N105C_HBA_EVO_RUNTIME_FRESH_DB_CONNECTION_PASS");
} finally {
  await db.end({timeout:2});
}
'
for service in postgres evo; do
  cid="$(docker compose ps -q "$service")"
  test "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' "$cid")" = healthy
done
curl -fsS --connect-timeout 3 --max-time 10 http://127.0.0.1:4100/health |
  grep -Fq '"ok":true'
test "$(pg_sql "SELECT count(*) FROM pg_hba_file_rules WHERE type LIKE 'host%' AND auth_method='trust'")" = 0
echo CV03_N105C_HBA_EVO_AND_POSTGRES_HEALTHY_PASS
echo CV03_N105C_HBA_NO_BUSINESS_DATA_DDL_DML_PASS
modified=0
trap - EXIT
echo CV03_N105C_HBA_SCRAM_CUTOVER_TERMINAL_PASS
