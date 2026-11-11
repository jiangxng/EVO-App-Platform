#!/usr/bin/env bash
# CV03 N1-05c-07: second distinct QA PostgreSQL LOGIN + trusted Host binding.
# Safely install original-DB HBA reject BEFORE creating this new QA principal.
# On error, NOLOGIN-fence any created role before attempting HBA rollback.
# No original business DB DDL/DML, no source migration, no production SAVE.
set -euo pipefail
umask 077
test "$(id -un)" = evo-deploy
cd /opt/evo-tokyo
test -r compose.yaml && test -f .env && test -f .last-health-pass-sha

qa=cv03_n105b_qa
original=evo_dev
host1=tokyo-qa-host-01
host2=tokyo-qa-host-02
role1=cv03_n105c_qa_tcp_producer
role2=cv03_n105c07_qa_host02
generation=qa-gen-20261111
feature=host-enterprise-context-provider.personal-saved-views
backup=/var/lib/postgresql/data/pg_hba.conf.cv03-n105c07-before-host02-20261111

sql() {
  docker compose exec -T --interactive=false postgres psql \
    -X -qAt -v ON_ERROR_STOP=1 -U evo -d "$1" -c "$2" < /dev/null
}
readonly_sql() {
  docker compose exec -T --interactive=false \
    -e PGOPTIONS="-c default_transaction_read_only=on" postgres \
    psql -X -qAt -v ON_ERROR_STOP=1 -U evo -d "$1" -c "$2" < /dev/null
}
admin_pg() { sql postgres "$1"; }
admin_qa() { sql "$qa" "$1"; }
read_pg() { readonly_sql postgres "$1"; }
read_qa() { readonly_sql "$qa" "$1"; }
read_original() { readonly_sql "$original" "$1"; }
health() {
  for service in postgres evo; do
    cid="$(docker compose ps -q "$service")"
    test -n "$cid"
    test "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' "$cid")" = healthy
  done
}
tcp() {
  role="$1"
  password="$2"
  db="$3"
  statement="$4"
  docker compose exec -T --interactive=false -e PGPASSWORD="$password" postgres \
    psql -X -qAt -w -v ON_ERROR_STOP=1 -h 127.0.0.1 \
    -U "$role" -d "$db" -c "$statement" < /dev/null
}
socket() {
  docker compose exec -T --interactive=false postgres psql \
    -X -qAt -v ON_ERROR_STOP=1 -U "$1" -d "$2" -c "$3" < /dev/null
}
app_fresh() {
  docker compose exec -T --interactive=false evo node --input-type=module -e '
import postgres from "postgres";
const uri=process.env.APP_PLATFORM_CONVERSATION_DATABASE_URL;
if(typeof uri!=="string")process.exit(2);
const db=postgres(uri,{max:1,connect_timeout:5,idle_timeout:1});
try{
  const r=await db.unsafe("SELECT session_user AS login,current_database() AS db");
  if(r.length!==1||r[0].login!=="evo"||r[0].db!=="evo_dev")
    throw Error("CV03_N105C07_EVO_DB_CONNECT_DENIED");
}finally{await db.end({timeout:2});}
'
}
snapshot() {
  read_qa "SELECT
    (SELECT count(*)::text FROM cv03_n105b_qa.immutable_outbox)||'|'||
    (SELECT count(*)::text FROM cv03_n105b_qa.operation_receipts)||'|'||
    (SELECT md5(COALESCE(string_agg(event_id||':'||event_payload::text,'|' ORDER BY event_id),'')) FROM cv03_n105b_qa.immutable_outbox)||'|'||
    (SELECT md5(COALESCE(string_agg(operation_key||':'||input_arguments::text||':'||result_fields::text,'|' ORDER BY operation_key),'')) FROM cv03_n105b_qa.operation_receipts)||'|'||
    (SELECT md5(COALESCE(string_agg(context_id||':'||enterprise_id||':'||principal_subject_id||':'||actor_type||':'||operation_id||':'||source_generation||':'||authority_epoch::text||':'||enabled::text,'|' ORDER BY context_id,enterprise_id,principal_subject_id,actor_type,operation_id),'')) FROM cv03_n105b_qa.scope_authority)||'|'||
    (SELECT md5(COALESCE(string_agg(feature_id||':'||source_generation||':'||frozen::text||':'||COALESCE(fence_id,''),'|' ORDER BY feature_id),'')) FROM cv03_n105b_qa.feature_authority)"
}

test "$(read_pg "SELECT current_setting('server_version_num')")" = 170011
test "$(read_pg "SHOW hba_file")" = /var/lib/postgresql/data/pg_hba.conf
test "$(read_pg "SELECT count(*) FROM pg_database WHERE datname IN ('$qa','$original')")" = 2
test "$(read_pg "SELECT count(*) FROM pg_roles WHERE rolname='$role1' AND rolcanlogin AND NOT rolsuper AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolbypassrls")" = 1
test "$(read_pg "SELECT count(*) FROM pg_roles WHERE rolname='$role2'")" = 0
test "$(read_qa "SELECT count(*) FROM cv03_n105b_qa.producer_identity WHERE login_role='$role1' AND host_id='$host1' AND enabled")" = 1
test "$(read_qa "SELECT count(*) FROM cv03_n105b_qa.producer_identity WHERE login_role='$role2' OR host_id='$host2'")" = 0
test "$(read_qa "SELECT count(*) FROM cv03_n105b_qa.feature_authority WHERE feature_id='$feature' AND source_generation='$generation' AND frozen")" = 1
test "$(read_pg "SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL")" = 0
test "$(read_pg "SELECT count(*) FROM pg_hba_file_rules WHERE type LIKE 'host%' AND auth_method='trust'")" = 0
test "$(read_pg "SELECT count(*) FROM pg_hba_file_rules WHERE type='local' AND auth_method='trust'")" = 2
test "$(read_pg "SELECT count(*) FROM pg_hba_file_rules WHERE auth_method='reject' AND '$original'=ANY(database) AND '$role1'=ANY(user_name)")" = 3
test "$(read_pg "SELECT count(*) FROM pg_hba_file_rules WHERE auth_method='reject' AND '$original'=ANY(database) AND '$role2'=ANY(user_name)")" = 0
test "$(read_original "SELECT count(*) FROM pg_namespace WHERE nspname='cv03_n105b_qa'")" = 0
health
test "$(df -Pk "$HOME" | awk 'NR==2{print $4}')" -ge 2097152
test "$(free -m | awk '/^Mem:/{print $7}')" -ge 256

base="$HOME/.evo-cv03-n105c-qa-principal"
file1="$base/producer.password"
test -d "$base" && test ! -L "$base" && test "$(stat -c %a "$base")" = 700
test -f "$file1" && test ! -L "$file1" && test "$(stat -c %a "$file1")" = 600
secret1="$(cat "$file1")"
[[ "$secret1" =~ ^[0-9a-f]{64}$ ]]
test "$(tcp "$role1" "$secret1" "$qa" "SELECT session_user||'|'||current_database()")" = "$role1|$qa"
if tcp "$role1" "$secret1" "$original" "SELECT 1" >/dev/null 2>&1; then
  echo CV03_N105C07_PRIOR_HOST01_HBA_ESCAPED >&2
  exit 1
fi
app_fresh
before="$(snapshot)"
[[ "$before" == 2\|2\|* ]]
object_count="$(read_original "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'")"
[[ "$object_count" =~ ^[0-9]+$ ]]
echo CV03_N105C07_STRICT_EXISTING_HOST01_T0_HBA_AND_APP_BASELINE_PASS

private2="$HOME/.evo-cv03-n105c07-qa-host02"
test ! -e "$private2"
install -d -m 0700 "$private2"
file2="$private2/producer.password"
secret2="$(openssl rand -hex 32)"
[[ "$secret2" =~ ^[a-f0-9]{64}$ ]]
printf '%s\n' "$secret2" > "$file2"
chmod 600 "$file2"
test "$(stat -c %a "$private2")" = 700
test "$(stat -c %a "$file2")" = 600

hba_changed=0
role_created=0
rollback() {
  echo CV03_N105C07_ROLLBACK_ATTEMPT_START >&2
  # A network/psql failure can occur AFTER PostgreSQL committed CREATE ROLE
  # but BEFORE this shell acknowledged success. NEVER trust role_created=0
  # as proof of absence: interrogate the current PG catalogue again.
  local login_safe=0
  local role_count="unknown"
  role_count="$(read_pg "SELECT count(*) FROM pg_roles WHERE rolname='$role2'")" \
    || role_count="unknown"
  if test "$role_count" = 0; then
    login_safe=1
    echo CV03_N105C07_ROLLBACK_SQL_ROLE_CONFIRMED_ABSENT_PASS >&2
  elif test "$role_count" = 1; then
    if admin_pg "ALTER ROLE cv03_n105c07_qa_host02 NOLOGIN" >/dev/null &&
       test "$(read_pg "SELECT rolcanlogin::text FROM pg_roles WHERE rolname='$role2'")" = false; then
      login_safe=1
      echo CV03_N105C07_ROLLBACK_SQL_ROLE_NOLOGIN_VERIFIED_PASS >&2
    else
      echo CV03_N105C07_ROLE_NOLOGIN_FENCE_FAILED >&2
    fi
  else
    echo CV03_N105C07_ROLE_STATUS_UNKNOWN_HBA_FENCE_MUST_REMAIN >&2
  fi
  if (( hba_changed == 1 && login_safe == 1 )); then
    if docker compose exec -T --interactive=false postgres sh -ec \
      'cp -p /var/lib/postgresql/data/pg_hba.conf.cv03-n105c07-before-host02-20261111 /var/lib/postgresql/data/pg_hba.conf' &&
      test "$(read_pg "SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL")" = 0 &&
      test "$(admin_pg "SELECT pg_reload_conf()::text")" = true; then
      echo CV03_N105C07_HBA_ROLLBACK_ATTEMPTED_PASS >&2
    else
      echo CV03_N105C07_HBA_ROLLBACK_UNVERIFIED_MANUAL_RECOVERY_REQUIRED >&2
    fi
  elif (( hba_changed == 1 )); then
    # Never restore the permissive old HBA while a new SQL role might LOGIN.
    echo CV03_N105C07_HBA_FENCE_RETAINED_UNTIL_ROLE_NOLOGIN_VERIFIED >&2
  fi
}
finish() {
  result=$?
  trap - EXIT
  if (( result != 0 )); then rollback; fi
  exit "$result"
}
trap finish EXIT

# Only an original-file backup. New credentials and Host02 SQL role do NOT
# exist yet; thus HBA reject is enforced before any new login is possible.
docker compose exec -T postgres sh -se <<'BACKUP'
set -eu
f=/var/lib/postgresql/data/pg_hba.conf
b=/var/lib/postgresql/data/pg_hba.conf.cv03-n105c07-before-host02-20261111
t=/var/lib/postgresql/data/pg_hba.conf.cv03-n105c07-candidate-20261111
test -f "$f" && test ! -L "$f" && test ! -e "$b" && test ! -e "$t"
cp -p "$f" "$b"
chmod 600 "$b"
BACKUP
echo CV03_N105C07_PRIVATE_PRELOGIN_HBA_BACKUP_PASS

hba_changed=1
docker compose exec -T postgres sh -se <<'PATCH'
set -eu
f=/var/lib/postgresql/data/pg_hba.conf
t=/var/lib/postgresql/data/pg_hba.conf.cv03-n105c07-candidate-20261111
test -f "$f" && test ! -L "$f" && test ! -e "$t"
{
  printf '%s\n' '# CV03 N1-05c-07: second QA Host LOGIN is rejected from original only'
  printf '%s\n' 'local evo_dev cv03_n105c07_qa_host02 reject'
  printf '%s\n' 'host evo_dev cv03_n105c07_qa_host02 0.0.0.0/0 reject'
  printf '%s\n' 'host evo_dev cv03_n105c07_qa_host02 ::0/0 reject'
  cat "$f"
} > "$t"
chown "$(stat -c '%u:%g' "$f")" "$t"
chmod "$(stat -c '%a' "$f")" "$t"
test "$(stat -c '%u:%g' "$t")" = "$(stat -c '%u:%g' "$f")"
test "$(stat -c '%a' "$t")" = "$(stat -c '%a' "$f")"
mv "$t" "$f"
PATCH
test "$(read_pg "SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL")" = 0
test "$(read_pg "SELECT count(*) FROM pg_hba_file_rules WHERE auth_method='reject' AND '$original'=ANY(database) AND '$role2'=ANY(user_name)")" = 3
test "$(read_pg "SELECT count(*) FROM pg_hba_file_rules WHERE auth_method='reject' AND '$original'=ANY(database) AND '$role1'=ANY(user_name)")" = 3
test "$(read_pg "SELECT count(*) FROM pg_hba_file_rules WHERE type LIKE 'host%' AND auth_method='trust'")" = 0
test "$(read_pg "SELECT count(*) FROM pg_hba_file_rules WHERE type='local' AND auth_method='trust'")" = 2
test "$(admin_pg "SELECT pg_reload_conf()::text")" = true
sleep 2
app_fresh
echo CV03_N105C07_SECOND_HOST_ORIGINAL_DB_HBA_LOADED_BEFORE_LOGIN_PASS

# One QA-database ACID transaction creates a separate, password-backed
# NOSUPERUSER LOGIN and grants ONLY schema USAGE + T0 SECURITY DEFINER EXECUTE.
# Do not insert source authority facts. The Feature stays globally frozen.
admin_qa "BEGIN;
  SET LOCAL password_encryption='scram-sha-256';
  CREATE ROLE cv03_n105c07_qa_host02 LOGIN NOINHERIT NOSUPERUSER
    NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 2
    PASSWORD '$secret2' VALID UNTIL '2026-12-01 00:00:00+00';
  GRANT CONNECT ON DATABASE cv03_n105b_qa TO cv03_n105c07_qa_host02;
  GRANT USAGE ON SCHEMA cv03_n105b_qa TO cv03_n105c07_qa_host02;
  GRANT EXECUTE ON FUNCTION cv03_n105b_qa.cv03_n105b_commit_deny_t0(text,text,text,text,text,text,text,bigint,text,text)
    TO cv03_n105c07_qa_host02;
  GRANT EXECUTE ON FUNCTION cv03_n105b_qa.cv03_n105b_fence_package_t0(text,text,text,text,text,text)
    TO cv03_n105c07_qa_host02;
  INSERT INTO cv03_n105b_qa.producer_identity(login_role,host_id,enabled)
    VALUES('cv03_n105c07_qa_host02','tokyo-qa-host-02',true);
  COMMIT;" > /dev/null
role_created=1
test "$(read_pg "SELECT count(*) FROM pg_roles WHERE rolname='$role2' AND rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolbypassrls AND NOT rolinherit")" = 1
test "$(read_pg "SELECT count(*) FROM pg_authid WHERE rolname='$role2' AND rolpassword LIKE 'SCRAM-SHA-256$%'")" = 1
test "$(read_qa "SELECT count(*) FROM cv03_n105b_qa.producer_identity WHERE login_role='$role2' AND host_id='$host2' AND enabled")" = 1
test "$(tcp "$role2" "$secret2" "$qa" "SELECT session_user||'|'||current_database()")" = "$role2|$qa"
if tcp "$role2" "$secret2" "$original" "SELECT 1" >/dev/null 2>&1 ||
   socket "$role2" "$original" "SELECT 1" >/dev/null 2>&1; then
  echo CV03_N105C07_SECOND_HOST_ORIGINAL_DB_CONNECT_UNEXPECTED >&2
  exit 1
fi
if tcp "$role2" "$secret1" "$qa" "SELECT 1" >/dev/null 2>&1 ||
   tcp "$role1" "$secret2" "$qa" "SELECT 1" >/dev/null 2>&1; then
  echo CV03_N105C07_CROSS_HOST_CREDENTIAL_REUSE_ACCEPTED >&2
  exit 1
fi
echo CV03_N105C07_TWO_DISTINCT_SCRAM_LOGINS_QA_ONLY_AND_CROSS_PASSWORD_DENY_PASS

# Both real SQL identities should have open TCP sessions concurrently.
# This is same-server Host principal authentication, not separate machines.
temp="$(mktemp -d)"
chmod 700 "$temp"
p1=""
p2=""
cleanup() {
  for pid in "$p1" "$p2"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then kill "$pid" 2>/dev/null || :; fi
  done
  rm -rf -- "$temp"
}
overlap_query="SELECT session_user||'|'||current_database()
 FROM pg_sleep(5) /* cv03_n105c07_dual_login_overlap */"
tcp "$role1" "$secret1" "$qa" "$overlap_query" > "$temp/one" 2>"$temp/one.err" &
p1=$!
tcp "$role2" "$secret2" "$qa" "$overlap_query" > "$temp/two" 2>"$temp/two.err" &
p2=$!
overlap=0
for i in $(seq 1 50); do
  count="$(read_qa "SELECT count(*) FROM pg_stat_activity WHERE datname='$qa' AND state='active' AND usename IN ('$role1','$role2') AND query LIKE '%cv03_n105c07_dual_login_overlap%'")"
  if test "$count" = 2; then overlap=1; break; fi
  sleep 0.1
done
if (( overlap != 1 )); then
  echo CV03_N105C07_TWO_DISTINCT_SQL_LOGIN_SESSIONS_NOT_SIMULTANEOUS >&2
  exit 1
fi
wait "$p1"; p1=""
wait "$p2"; p2=""
test "$(cat "$temp/one")" = "$role1|$qa"
test "$(cat "$temp/two")" = "$role2|$qa"
echo CV03_N105C07_CONCURRENT_SEPARATE_HOST_SQL_LOGIN_IDENTITIES_PASS

# Distinguish a genuine authenticated Host02 from a failed permission call:
# the owner T0 explicitly sees the mapped Host02 and rejects the frozen
# authority rather than denying this Host as unknown.
must_error() {
  role="$1"; password="$2"; statement="$3"; marker="$4"
  if tcp "$role" "$password" "$qa" "$statement" >"$temp/error.out" 2>"$temp/error.err"; then
    echo CV03_N105C07_UNEXPECTED_OWNER_SQL_T0_ACCEPTANCE >&2
    exit 1
  fi
  grep -Fq "$marker" "$temp/error.err" || {
    echo CV03_N105C07_EXPECTED_OWNER_DENIAL_NOT_OBSERVED >&2
    exit 1
  }
}
must_error "$role2" "$secret2" "SELECT * FROM cv03_n105b_qa.cv03_n105b_commit_deny_t0(
 '$host2','qa-host02-deny-20261111','enterprise-context:qa-ent-01',
 'qa-ent-01','qa-human-01','HUMAN','$generation',0,
 'AUTHORIZATION_REVOKE','collection.saved-view.personal.save')" 'CV03_QA_FEATURE_FROZEN'
must_error "$role1" "$secret1" "SELECT * FROM cv03_n105b_qa.cv03_n105b_fence_package_t0(
 '$host2','qa-host02-spoof-20261111','host-enterprise-context-provider',
 '$feature','$generation','DISABLE')" 'CV03_QA_PRODUCER_IDENTITY_DENIED'
must_error "$role2" "$secret2" "SELECT * FROM cv03_n105b_qa.cv03_n105b_fence_package_t0(
 '$host1','qa-host01-spoof-20261111','host-enterprise-context-provider',
 '$feature','$generation','DISABLE')" 'CV03_QA_PRODUCER_IDENTITY_DENIED'
must_error "$role2" "$secret2" "SELECT * FROM cv03_n105b_qa.cv03_n105b_commit_deny_t0(
 '$host2','qa-deny-operation-0001','enterprise-context:qa-ent-01',
 'qa-ent-01','qa-human-01','HUMAN','$generation',0,
 'AUTHORIZATION_REVOKE','collection.saved-view.personal.save')" 'CV03_QA_OPERATION_KEY_CONFLICT'
echo CV03_N105C07_DB_OWNED_FROZEN_SOURCE_CROSS_HOST_AND_REPLAY_DENIAL_PASS

must_deny() {
  if tcp "$role2" "$secret2" "$qa" "$1" >/dev/null 2>&1; then
    echo CV03_N105C07_SECOND_HOST_DIRECT_SQL_PRIVILEGE_ESCALATION >&2
    exit 1
  fi
}
must_deny 'UPDATE cv03_n105b_qa.scope_authority SET enabled=true'
must_deny 'DELETE FROM cv03_n105b_qa.immutable_outbox'
must_deny 'SELECT * FROM cv03_n105b_qa.producer_identity'
must_deny 'CREATE TABLE cv03_n105b_qa.unauthorized_host02_table(x int)'
must_deny 'SET ROLE cv03_n105b_qa_owner'
test "$(snapshot)" = "$before"
test "$(read_original "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'")" = "$object_count"
test "$(read_original "SELECT count(*) FROM pg_namespace WHERE nspname='cv03_n105b_qa'")" = 0
echo CV03_N105C07_DIRECT_DML_DENIED_AND_ORIGINAL_QA_SOURCE_FINGERPRINTS_UNCHANGED_PASS

test "$(tcp "$role1" "$secret1" "$qa" "SELECT session_user")" = "$role1"
test "$(tcp "$role2" "$secret2" "$qa" "SELECT session_user")" = "$role2"
app_fresh
health
curl -fsS --connect-timeout 3 --max-time 10 http://127.0.0.1:4100/health | grep -Fq '"ok":true'
echo CV03_N105C07_EVO_RUNTIME_AND_TWO_QA_PRINCIPALS_STAY_HEALTHY_PASS

trap - EXIT
cleanup
unset secret1 secret2
echo CV03_N105C07_SECOND_QA_HOST_PHYSICAL_TERMINAL_PASS
