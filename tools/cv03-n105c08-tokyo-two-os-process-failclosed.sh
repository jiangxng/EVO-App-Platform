#!/usr/bin/env bash
# CV03 N1-05c-08: physical Tokyo two independent OS processes under two SQL
# Host credentials, plus one targeted QA-only backend termination.
# Never touch original business data, SQL grants, HBA or SAVE admission.
set -euo pipefail
umask 077
test "$(id -un)" = evo-deploy
cd /opt/evo-tokyo
test -r compose.yaml && test -f .env && test -f .last-health-pass-sha

role1=cv03_n105c_qa_tcp_producer
role2=cv03_n105c07_qa_host02
host1=tokyo-qa-host-01
host2=tokyo-qa-host-02
qa=cv03_n105b_qa
original=evo_dev
worker=/home/evo-deploy/.cv03-n105c08-os-process-worker.mjs
test -f "$worker" && test ! -L "$worker"
test "$(stat -c %a "$worker")" = 600
node_source="$(cat "$worker")"
test -n "$node_source"

sql() {
  docker compose exec -T --interactive=false \
    -e PGOPTIONS="-c default_transaction_read_only=on" postgres \
    psql -X -qAt -v ON_ERROR_STOP=1 -U evo -d "$1" -c "$2" < /dev/null
}
pg_admin() {
  docker compose exec -T --interactive=false postgres \
    psql -X -qAt -v ON_ERROR_STOP=1 -U evo -d postgres -c "$1" < /dev/null
}
health() {
  for service in postgres evo; do
    cid="$(docker compose ps -q "$service")"
    test -n "$cid"
    test "$(docker inspect -f '{{if .State.Health}}{{else}}unknown{{end}}' "$cid")" != unknown
    test "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' "$cid")" = healthy
  done
}
qa_state() {
  sql "$qa" "SELECT
   (SELECT count(*)::text FROM cv03_n105b_qa.immutable_outbox)||'|'||
   (SELECT count(*)::text FROM cv03_n105b_qa.operation_receipts)||'|'||
   (SELECT md5(COALESCE(string_agg(event_id||':'||event_payload::text,'|' ORDER BY event_id),'')) FROM cv03_n105b_qa.immutable_outbox)||'|'||
   (SELECT md5(COALESCE(string_agg(operation_key||':'||input_arguments::text||':'||result_fields::text,'|' ORDER BY operation_key),'')) FROM cv03_n105b_qa.operation_receipts)||'|'||
   (SELECT md5(COALESCE(string_agg(context_id||':'||enterprise_id||':'||principal_subject_id||':'||actor_type||':'||operation_id||':'||source_generation||':'||authority_epoch::text||':'||enabled::text,'|' ORDER BY context_id,enterprise_id,principal_subject_id,actor_type,operation_id),'')) FROM cv03_n105b_qa.scope_authority)||'|'||
   (SELECT md5(COALESCE(string_agg(feature_id||':'||source_generation||':'||frozen::text,'|' ORDER BY feature_id),'')) FROM cv03_n105b_qa.feature_authority)"
}
test "$(sql postgres "SELECT current_setting('server_version_num')")" = 170011
test "$(sql postgres "SELECT count(*) FROM pg_database WHERE datname IN ('$qa','$original')")" = 2
test "$(sql postgres "SELECT count(*) FROM pg_roles WHERE rolname IN ('$role1','$role2') AND rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolbypassrls AND NOT rolinherit")" = 2
test "$(sql "$qa" "SELECT count(*) FROM cv03_n105b_qa.producer_identity WHERE enabled AND (login_role,host_id) IN (('$role1','$host1'),('$role2','$host2'))")" = 2
test "$(sql "$qa" "SELECT count(*) FROM cv03_n105b_qa.feature_authority WHERE feature_id='host-enterprise-context-provider.personal-saved-views' AND source_generation='qa-gen-20261111' AND frozen")" = 1
test "$(sql postgres "SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL")" = 0
for role in "$role1" "$role2"; do
  test "$(sql postgres "SELECT count(*) FROM pg_hba_file_rules WHERE auth_method='reject' AND 'evo_dev'=ANY(database) AND '$role'=ANY(user_name)")" = 3
done
test "$(sql "$original" "SELECT count(*) FROM pg_namespace WHERE nspname='cv03_n105b_qa'")" = 0
health
before="$(qa_state)"
[[ "$before" == 2\|2\|* ]]
original_objects="$(sql "$original" "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'")"
[[ "$original_objects" =~ ^[0-9]+$ ]]

base1="$HOME/.evo-cv03-n105c-qa-principal"
base2="$HOME/.evo-cv03-n105c07-qa-host02"
for base in "$base1" "$base2"; do
  test -d "$base" && test ! -L "$base"
  test "$(stat -c %a "$base")" = 700
  test -f "$base/producer.password" && test ! -L "$base/producer.password"
  test "$(stat -c %a "$base/producer.password")" = 600
done
secret1="$(cat "$base1/producer.password")"
secret2="$(cat "$base2/producer.password")"
[[ "$secret1" =~ ^[a-f0-9]{64}$ && "$secret2" =~ ^[a-f0-9]{64}$ ]]
test "$secret1" != "$secret2"
echo CV03_N105C08_TRUSTED_TWO_HOST_CREDENTIALS_FROZEN_QA_AND_HBA_PREFLIGHT_PASS

# A docker compose exec creates a fresh, separate OS-level Node.js process.
# Secret enters Node stdin only, NOT docker env or process argv.
run_worker() {
  local login="$1" host="$2" mode="$3" password="$4"
  printf '%s\n' "$password" | docker compose exec -T evo \
    node --input-type=module -e "$node_source" -- "$login" "$host" "$mode"
}
tmp="$(mktemp -d)"
chmod 700 "$tmp"
pid1=""
pid2=""
pidkill=""
cleanup() {
  for pid in "$pid1" "$pid2" "$pidkill"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || :
    fi
  done
  rm -rf -- "$tmp"
}
trap cleanup EXIT

run_worker "$role1" "$host1" overlap "$secret1" >"$tmp/host01" 2>"$tmp/host01.err" &
pid1=$!
run_worker "$role2" "$host2" overlap "$secret2" >"$tmp/host02" 2>"$tmp/host02.err" &
pid2=$!

two=0
for i in $(seq 1 65); do
  pair="$(sql "$qa" "SELECT count(DISTINCT usename)::text||'|'||count(DISTINCT pid)::text FROM pg_stat_activity WHERE datname='$qa' AND state='active' AND usename IN ('$role1','$role2') AND query LIKE '%cv03_n105c08_two_distinct_os_processes%'")"
  if test "$pair" = '2|2'; then two=1; break; fi
  sleep 0.1
done
test "$two" = 1 || { echo CV03_N105C08_TWO_OS_PROCESS_SQL_BACKENDS_NOT_OBSERVED >&2; exit 1; }
wait "$pid1"; pid1=""
wait "$pid2"; pid2=""
grep -Fxq "CV03_N105C08_WORKER_OS_PROCESS_OVERLAP_PASS|$host1" "$tmp/host01"
grep -Fxq "CV03_N105C08_WORKER_OS_PROCESS_OVERLAP_PASS|$host2" "$tmp/host02"
echo CV03_N105C08_REAL_TWO_DIFFERENT_OS_PROCESSES_AND_SQL_SESSION_USERS_PASS

# Authentic owner T0 must give both identities the same persisted FROZEN
# failure. No test creates new Outbox, Authority or idempotency records.
run_worker "$role1" "$host1" frozen "$secret1" >"$tmp/owner01" 2>"$tmp/owner01.err"
run_worker "$role2" "$host2" frozen "$secret2" >"$tmp/owner02" 2>"$tmp/owner02.err"
grep -Fxq "CV03_N105C08_WORKER_AUTHENTIC_OWNER_FROZEN_DENIED_PASS|$host1" "$tmp/owner01"
grep -Fxq "CV03_N105C08_WORKER_AUTHENTIC_OWNER_FROZEN_DENIED_PASS|$host2" "$tmp/owner02"
test "$(qa_state)" = "$before"
echo CV03_N105C08_BOTH_REAL_NODE_HOST_PROCESSES_FROZEN_OWNER_DENY_NO_MUTATION_PASS

# Inject REAL loss of a single in-flight PostgreSQL QA backend. Require
# exactly ONE target role/query. Do not terminate app, original DB or another
# Host's session. The worker must treat the failed SQL call as fatal DENY,
# not continue with an unverified/cached ALLOW.
run_worker "$role2" "$host2" disconnect "$secret2" >"$tmp/kill" 2>"$tmp/kill.err" &
pidkill=$!
target_pid=""
for i in $(seq 1 90); do
  result="$(sql postgres "SELECT COALESCE(string_agg(pid::text,',' ORDER BY pid),'') FROM pg_stat_activity WHERE datname='$qa' AND usename='$role2' AND state='active' AND query LIKE '%cv03_n105c08_forced_qa_backend_termination%'")"
  if [[ "$result" =~ ^[0-9]+$ ]]; then target_pid="$result"; break; fi
  sleep 0.1
done
[[ "$target_pid" =~ ^[1-9][0-9]*$ ]] || { echo CV03_N105C08_UNIQUE_QA_TERMINATION_TARGET_MISSING >&2; exit 1; }
echo CV03_N105C08_SINGLE_QA_WORKER_BACKEND_CONFIRMED_BEFORE_TERMINATION_PASS

# Fail-closed target guard in ONE query. Use pg_terminate_backend only for
# the exact physical backend observed immediately before the command.
killed="$(pg_admin "WITH target AS MATERIALIZED (
    SELECT pid FROM pg_stat_activity WHERE pid=$target_pid AND datname='$qa'
      AND usename='$role2' AND state='active'
      AND query LIKE '%cv03_n105c08_forced_qa_backend_termination%'
  )
  SELECT CASE WHEN (SELECT count(*) FROM target)=1
    THEN pg_terminate_backend((SELECT pid FROM target))::text
    ELSE 'false' END")"
test "$killed" = true
wait "$pidkill"; pidkill=""
grep -Fxq "CV03_N105C08_WORKER_BACKEND_DISCONNECT_FAIL_CLOSED_PASS|$host2" "$tmp/kill"
echo CV03_N105C08_REAL_TARGETED_PG_BACKEND_TERMINATION_DENY_PASS

# This is an exact reconnect as a NEW OS process, not reuse of the failed
# process or a cached authenticated session. Previous Host01 unaffected.
run_worker "$role1" "$host1" frozen "$secret1" >"$tmp/recover01" 2>"$tmp/recover01.err"
run_worker "$role2" "$host2" frozen "$secret2" >"$tmp/recover02" 2>"$tmp/recover02.err"
grep -Fxq "CV03_N105C08_WORKER_AUTHENTIC_OWNER_FROZEN_DENIED_PASS|$host1" "$tmp/recover01"
grep -Fxq "CV03_N105C08_WORKER_AUTHENTIC_OWNER_FROZEN_DENIED_PASS|$host2" "$tmp/recover02"
test "$(qa_state)" = "$before"
test "$(sql "$original" "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'")" = "$original_objects"
echo CV03_N105C08_NEW_OS_PROCESS_REAUTH_FROZEN_AND_SQL_SOURCE_UNCHANGED_PASS

docker compose exec -T --interactive=false evo node --input-type=module -e '
import postgres from "postgres";
const uri=process.env.APP_PLATFORM_CONVERSATION_DATABASE_URL;
if(typeof uri!=="string")process.exit(2);
const db=postgres(uri,{max:1,connect_timeout:5,idle_timeout:1});
try{
  const rows=await db.unsafe("SELECT session_user AS login,current_database() AS db");
  if(rows.length!==1||rows[0].login!=="evo"||rows[0].db!=="evo_dev")throw Error("CV03_N105C08_EVO_DB_UNAVAILABLE");
} finally { await db.end({timeout:2}); }
'
health
curl -fsS --connect-timeout 3 --max-time 10 http://127.0.0.1:4100/health | grep -Fq '"ok":true'
test "$(qa_state)" = "$before"
echo CV03_N105C08_EVO_APP_HEALTH_AND_ALL_QA_FINGERPRINTS_INTACT_PASS

trap - EXIT
cleanup
unset secret1 secret2
echo CV03_N105C08_PHYSICAL_OS_PROCESS_SQL_FAIL_CLOSED_TERMINAL_PASS
