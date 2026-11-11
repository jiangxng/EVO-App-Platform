#!/usr/bin/env bash
# CV03 N1-05c-05: one-shot QA principal -> original DB HBA reject.
# Preview Tokyo only. Does not revoke PUBLIC DB ACLs, change SQL grants,
# restart a service, or enable Human SAVE.
set -euo pipefail
umask 077
test "$(id -un)" = evo-deploy
cd /opt/evo-tokyo
test -r compose.yaml && test -f .env && test -f .last-health-pass-sha

role=cv03_n105c_qa_tcp_producer
original=evo_dev
qa_db=cv03_n105b_qa
file=/var/lib/postgresql/data/pg_hba.conf
backup=/var/lib/postgresql/data/pg_hba.conf.cv03-n105c05-before-qa-original-deny-20261111
candidate=/var/lib/postgresql/data/pg_hba.conf.cv03-n105c05-candidate-20261111

pg_sql() {
  docker compose exec -T --interactive=false postgres \
    psql -X -qAt -v ON_ERROR_STOP=1 -U evo -d "$1" -c "$2" < /dev/null
}
pg_postgres() { pg_sql postgres "$1"; }
pg_qa() { pg_sql "$qa_db" "$1"; }
pg_original() { pg_sql "$original" "$1"; }
health() {
  for service in postgres evo; do
    cid="$(docker compose ps -q "$service")"
    test -n "$cid"
    test "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' "$cid")" = healthy
  done
}
qa_tcp() {
  docker compose exec -T --interactive=false -e PGPASSWORD="$secret" postgres \
    psql -X -qAt -w -v ON_ERROR_STOP=1 -h 127.0.0.1 -U "$role" -d "$1" -c "$2" < /dev/null
}
qa_socket() {
  docker compose exec -T --interactive=false postgres \
    psql -X -qAt -v ON_ERROR_STOP=1 -U "$role" -d "$1" -c "$2" < /dev/null
}
app_fresh() {
  docker compose exec -T --interactive=false evo node --input-type=module -e '
import postgres from "postgres";
const uri=process.env.APP_PLATFORM_CONVERSATION_DATABASE_URL;
if(typeof uri!=="string")process.exit(2);
const db=postgres(uri,{max:1,connect_timeout:5,idle_timeout:1});
try {
  const r=await db.unsafe("SELECT session_user AS u,current_database() AS d");
  if(r.length!==1||r[0].u!=="evo"||r[0].d!=="evo_dev")throw Error("APP_SQL_CONNECTION_FAILED");
} finally {await db.end({timeout:2});}
'
}

test "$(pg_postgres "SELECT current_setting('server_version_num')")" = 170011
test "$(pg_postgres "SHOW hba_file")" = "$file"
test "$(pg_postgres "SELECT count(*) FROM pg_database WHERE datname IN ('evo_dev','cv03_n105b_qa')")" = 2
test "$(pg_postgres "SELECT count(*) FROM pg_roles WHERE rolname='$role' AND rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolbypassrls")" = 1
test "$(pg_qa "SELECT count(*) FROM cv03_n105b_qa.producer_identity WHERE login_role='$role' AND host_id='tokyo-qa-host-01' AND enabled")" = 1
test "$(pg_postgres "SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL")" = 0
test "$(pg_postgres "SELECT count(*) FROM pg_hba_file_rules WHERE type LIKE 'host%' AND auth_method='trust'")" = 0
test "$(pg_postgres "SELECT count(*) FROM pg_hba_file_rules WHERE type LIKE 'host%' AND auth_method='scram-sha-256'")" -ge 4
test "$(pg_postgres "SELECT count(*) FROM pg_hba_file_rules WHERE type='local' AND auth_method='trust'")" = 2
test "$(pg_postgres "SELECT count(*) FROM pg_hba_file_rules WHERE auth_method='reject' AND 'evo_dev'=ANY(database) AND '$role'=ANY(user_name)")" = 0
test "$(pg_postgres "SELECT has_database_privilege('$role','evo_dev','CONNECT')::text")" = true
test "$(pg_original "SELECT count(*) FROM pg_namespace WHERE nspname='cv03_n105b_qa'")" = 0
health
test "$(df -Pk "$HOME" | awk 'NR==2{print $4}')" -ge 2097152
test "$(free -m | awk '/^Mem:/{print $7}')" -ge 256

private="$HOME/.evo-cv03-n105c-qa-principal"
password_file="$private/producer.password"
test -d "$private" && test ! -L "$private"
test "$(stat -c %a "$private")" = 700
test -f "$password_file" && test ! -L "$password_file"
test "$(stat -c %a "$password_file")" = 600
secret="$(cat "$password_file")"
[[ "$secret" =~ ^[0-9a-f]{64}$ ]]
test "$(qa_tcp "$qa_db" "SELECT session_user||'|'||current_database()")" = "$role|$qa_db"
test "$(qa_tcp "$original" "SELECT session_user||'|'||current_database()")" = "$role|$original"
test "$(qa_socket "$original" "SELECT session_user||'|'||current_database()")" = "$role|$original"
app_fresh
echo CV03_N105C05_STRICT_PRECHANGE_QA_ORIGINAL_OPEN_AND_EVO_POSITIVE_PASS

before_qa="$(pg_qa "SELECT (SELECT count(*) FROM cv03_n105b_qa.immutable_outbox)::text||'|'||(SELECT count(*) FROM cv03_n105b_qa.operation_receipts)::text")"
before_objects="$(pg_original "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'")"
[[ "$before_qa" =~ ^[0-9]+\|[0-9]+$ && "$before_objects" =~ ^[0-9]+$ ]]

# Create durable private HBA backup before enabling the rollback trap.
docker compose exec -T postgres sh -se <<'BACKUP'
set -eu
f=/var/lib/postgresql/data/pg_hba.conf
b=/var/lib/postgresql/data/pg_hba.conf.cv03-n105c05-before-qa-original-deny-20261111
t=/var/lib/postgresql/data/pg_hba.conf.cv03-n105c05-candidate-20261111
test -f "$f" && test ! -L "$f" && test ! -e "$b" && test ! -e "$t"
cp -p "$f" "$b"
chmod 600 "$b"
test -f "$b"
BACKUP
echo CV03_N105C05_PRIVATE_ORIGINAL_HBA_BACKUP_PASS

modified=0
rollback() {
  echo CV03_N105C05_HBA_ROLLBACK_ATTEMPT_START >&2
  docker compose exec -T --interactive=false postgres sh -ec \
    'cp -p /var/lib/postgresql/data/pg_hba.conf.cv03-n105c05-before-qa-original-deny-20261111 /var/lib/postgresql/data/pg_hba.conf' \
    || { echo CV03_N105C05_HBA_ROLLBACK_COPY_FAILED >&2; return 1; }
  test "$(pg_postgres "SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL")" = 0 || return 1
  test "$(pg_postgres "SELECT pg_reload_conf()::text")" = true || return 1
  sleep 2
  test "$(qa_tcp "$original" "SELECT session_user")" = "$role" || return 1
  test "$(qa_tcp "$qa_db" "SELECT session_user")" = "$role" || return 1
  app_fresh || return 1
  health || return 1
  echo CV03_N105C05_HBA_ROLLBACK_ORIGINAL_LOGIN_RESTORED_PASS >&2
}
finish() {
  result=$?
  trap - EXIT
  if (( result != 0 && modified == 1 )); then
    rollback || echo CV03_N105C05_HBA_ROLLBACK_UNVERIFIED_MANUAL_RECOVERY_REQUIRED >&2
  fi
  exit "$result"
}
trap finish EXIT

# Once the backed-up file exists, any post-fence failure attempts restore.
modified=1
docker compose exec -T postgres sh -se <<'PATCH'
set -eu
f=/var/lib/postgresql/data/pg_hba.conf
b=/var/lib/postgresql/data/pg_hba.conf.cv03-n105c05-before-qa-original-deny-20261111
t=/var/lib/postgresql/data/pg_hba.conf.cv03-n105c05-candidate-20261111
test -f "$f" && test -f "$b" && test ! -L "$f" && test ! -e "$t"
# Reject one restricted QA login to one original DB across all client
# address families; first matching HBA record wins.
{
  printf '%s\n' '# CV03 N1-05c-05 preview QA role / original DB only'
  printf '%s\n' 'local evo_dev cv03_n105c_qa_tcp_producer reject'
  printf '%s\n' 'host evo_dev cv03_n105c_qa_tcp_producer 0.0.0.0/0 reject'
  printf '%s\n' 'host evo_dev cv03_n105c_qa_tcp_producer ::0/0 reject'
  cat "$f"
} > "$t"
chown "$(stat -c '%u:%g' "$f")" "$t"
chmod "$(stat -c '%a' "$f")" "$t"
test "$(stat -c '%u:%g' "$t")" = "$(stat -c '%u:%g' "$f")"
test "$(stat -c '%a' "$t")" = "$(stat -c '%a' "$f")"
mv "$t" "$f"
PATCH
test "$(pg_postgres "SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL")" = 0
first_three="$(pg_postgres "SELECT string_agg(type||':'||auth_method,',' ORDER BY rule_number) FROM (SELECT * FROM pg_hba_file_rules WHERE error IS NULL ORDER BY rule_number LIMIT 3) a WHERE database=ARRAY['evo_dev']::text[] AND user_name=ARRAY['cv03_n105c_qa_tcp_producer']::text[]")"
test "$first_three" = 'local:reject,host:reject,host:reject'
test "$(pg_postgres "SELECT count(*) FROM pg_hba_file_rules WHERE type LIKE 'host%' AND auth_method='trust'")" = 0
test "$(pg_postgres "SELECT count(*) FROM pg_hba_file_rules WHERE type='local' AND auth_method='trust'")" = 2
test "$(pg_postgres "SELECT pg_reload_conf()::text")" = true
sleep 2
echo CV03_N105C05_FIRST_MATCH_THREE_FAMILY_REJECT_LOADED_PASS

# A successful password that worked before the reload MUST now be denied
# for original DB on both transport types. QA T0 must remain reachable.
if qa_tcp "$original" "SELECT 1" >/dev/null 2>&1; then
  echo CV03_N105C05_QA_ORIGINAL_TCP_UNEXPECTEDLY_ACCEPTED >&2
  exit 1
fi
if qa_socket "$original" "SELECT 1" >/dev/null 2>&1; then
  echo CV03_N105C05_QA_ORIGINAL_SOCKET_UNEXPECTEDLY_ACCEPTED >&2
  exit 1
fi
test "$(qa_tcp "$qa_db" "SELECT session_user||'|'||current_database()")" = "$role|$qa_db"
echo CV03_N105C05_QA_ORIGINAL_TCP_AND_LOCAL_DENIED_QA_T0_CONTINUES_PASS

# Correct original app identity must still connect through TCP and its own
# runtime pool. Do not log SQL URI, password, or business data.
real="$(docker compose exec -T --interactive=false postgres sh -ec \
  'test -n "$POSTGRES_PASSWORD"; PGPASSWORD="$POSTGRES_PASSWORD" psql -X -qAt -w -v ON_ERROR_STOP=1 -h 127.0.0.1 -U evo -d evo_dev -c "SELECT session_user||chr(124)||current_database()"')"
test "$real" = 'evo|evo_dev'
app_fresh
health
curl -fsS --connect-timeout 3 --max-time 10 http://127.0.0.1:4100/health | grep -Fq '"ok":true'
echo CV03_N105C05_REAL_EVO_TCP_RUNTIME_AND_HEALTH_POSITIVE_PASS

test "$(pg_postgres "SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL")" = 0
test "$(pg_qa "SELECT (SELECT count(*) FROM cv03_n105b_qa.immutable_outbox)::text||'|'||(SELECT count(*) FROM cv03_n105b_qa.operation_receipts)::text")" = "$before_qa"
test "$(pg_original "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'")" = "$before_objects"
test "$(pg_original "SELECT count(*) FROM pg_namespace WHERE nspname='cv03_n105b_qa'")" = 0
echo CV03_N105C05_ORIGINAL_AND_QA_DATABASES_DDL_DML_UNTOUCHED_PASS

modified=0
trap - EXIT
unset secret
echo CV03_N105C05_HBA_ROLE_DATABASE_FENCE_TERMINAL_PASS
