#!/usr/bin/env bash
# CV03 N1-05c-06: real Tokyo PostgreSQL QA two-session ACK-loss replay proof.
# Deliberately NO schema, role, HBA or source data changes. QA fixture is frozen.
set -euo pipefail
umask 077
test "$(id -un)" = evo-deploy
cd /opt/evo-tokyo
test -r compose.yaml && test -f .env
role=cv03_n105c_qa_tcp_producer
db=cv03_n105b_qa
original=evo_dev
host=tokyo-qa-host-01
operation=qa-deny-operation-0001
generation=qa-gen-20261111

admin() {
  docker compose exec -T --interactive=false \
    -e PGOPTIONS="-c default_transaction_read_only=on" postgres \
    psql -X -qAt -v ON_ERROR_STOP=1 -U evo -d "$1" -c "$2" < /dev/null
}
test "$(admin postgres "SELECT current_setting('server_version_num')")" = 170011
test "$(admin postgres "SELECT count(*) FROM pg_database WHERE datname IN ('$db','$original')")" = 2
test "$(admin postgres "SELECT count(*) FROM pg_roles WHERE rolname='$role' AND rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolbypassrls")" = 1
test "$(admin "$db" "SELECT count(*) FROM cv03_n105b_qa.producer_identity WHERE login_role='$role' AND host_id='$host' AND enabled")" = 1
test "$(admin "$db" "SELECT count(*) FROM cv03_n105b_qa.feature_authority WHERE feature_id='host-enterprise-context-provider.personal-saved-views' AND frozen AND source_generation='$generation'")" = 1
test "$(admin "$db" "SELECT count(*) FROM cv03_n105b_qa.operation_receipts WHERE operation_key='$operation' AND (result_fields->>'epoch')::integer=1")" = 1
test "$(admin postgres "SELECT count(*) FROM pg_hba_file_rules WHERE error IS NOT NULL")" = 0
test "$(admin postgres "SELECT count(*) FROM pg_hba_file_rules WHERE auth_method='reject' AND '$role'=ANY(user_name) AND '$original'=ANY(database)")" = 3
pg="$(docker compose ps -q postgres)"
test -n "$pg" && test "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' "$pg")" = healthy

private="$HOME/.evo-cv03-n105c-qa-principal"
file="$private/producer.password"
test -d "$private" && test ! -L "$private"
test "$(stat -c %a "$private")" = 700
test -f "$file" && test ! -L "$file"
test "$(stat -c %a "$file")" = 600
secret="$(cat "$file")"
[[ "$secret" =~ ^[0-9a-f]{64}$ ]]

tcp() {
  docker compose exec -T --interactive=false -e PGPASSWORD="$secret" postgres \
    psql -X -qAt -w -v ON_ERROR_STOP=1 -h 127.0.0.1 \
    -U "$role" -d "$1" -c "$2" < /dev/null
}
test "$(tcp "$db" "SELECT session_user||'|'||current_database()")" = "$role|$db"
if tcp "$original" "SELECT 1" > /dev/null 2>&1; then
  echo CV03_N105C06_QA_ROLE_ESCAPED_ORIGINAL_DB_HBA >&2
  exit 1
fi
if docker compose exec -T --interactive=false \
  -e PGPASSWORD="cv03-n105c06-definitely-not-the-valid-password" postgres \
  psql -X -qAt -w -v ON_ERROR_STOP=1 -h 127.0.0.1 \
  -U "$role" -d "$db" -c "SELECT 1" < /dev/null > /dev/null 2>&1; then
  echo CV03_N105C06_INVALID_SQL_PASSWORD_ACCEPTED >&2
  exit 1
fi
echo CV03_N105C06_REAL_QA_SCRAM_AND_ORIGINAL_DB_FENCE_PASS

# Detect any change, including event identity/payload and per-scope authority.
# SQL identifiers and customer data are never emitted to the runner.
snapshot() {
  admin "$db" "SELECT
   (SELECT count(*)::text FROM cv03_n105b_qa.immutable_outbox)||'|'||
   (SELECT count(*)::text FROM cv03_n105b_qa.operation_receipts)||'|'||
   (SELECT md5(COALESCE(string_agg(event_id||':'||event_payload::text,'|' ORDER BY event_id),'')) FROM cv03_n105b_qa.immutable_outbox)||'|'||
   (SELECT md5(COALESCE(string_agg(operation_key||':'||input_arguments::text||':'||result_fields::text,'|' ORDER BY operation_key),'')) FROM cv03_n105b_qa.operation_receipts)||'|'||
   (SELECT md5(COALESCE(string_agg(context_id||':'||enterprise_id||':'||principal_subject_id||':'||actor_type||':'||operation_id||':'||source_generation||':'||authority_epoch::text||':'||enabled::text,'|' ORDER BY context_id,enterprise_id,principal_subject_id,actor_type,operation_id),'')) FROM cv03_n105b_qa.scope_authority)||'|'||
   (SELECT md5(COALESCE(string_agg(feature_id||':'||source_generation||':'||frozen::text||':'||COALESCE(fence_id,''),'|' ORDER BY feature_id),'')) FROM cv03_n105b_qa.feature_authority)"
}
before="$(snapshot)"
[[ "$before" == 2\|2\|* ]]
original_objects="$(admin "$original" "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'")"
[[ "$original_objects" =~ ^[0-9]+$ ]]
echo CV03_N105C06_PRIOR_RECEIPT_AND_FROZEN_SOURCE_FINGERPRINT_PASS

# The third connection holds the existing feature row lock without DML so
# two independent authenticated TCP sessions demonstrably overlap on the
# server lock, not just complete one after another by chance.
temp="$(mktemp -d)"
chmod 700 "$temp"
holder_pid=""
one_pid=""
two_pid=""
cleanup() {
  for pid in "$holder_pid" "$one_pid" "$two_pid"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then kill "$pid" 2>/dev/null || :; fi
  done
  rm -rf -- "$temp"
}
trap cleanup EXIT
docker compose exec -T --interactive=false postgres psql -X -qAt \
  -v ON_ERROR_STOP=1 -U evo -d "$db" \
  -c "BEGIN;
      SELECT 1 FROM cv03_n105b_qa.feature_authority
       WHERE feature_id='host-enterprise-context-provider.personal-saved-views' FOR UPDATE;
      SELECT pg_sleep(8) /* cv03_n105c06_lock_holder */;
      ROLLBACK;" < /dev/null > "$temp/holder.log" 2>&1 &
holder_pid=$!

holder_ready=0
for i in $(seq 1 35); do
  active="$(admin "$db" "SELECT count(*) FROM pg_stat_activity WHERE datname='$db' AND state='active' AND pid<>pg_backend_pid() AND query LIKE '%cv03_n105c06_lock_holder%'")"
  if [[ "$active" =~ ^[1-9][0-9]*$ ]]; then holder_ready=1; break; fi
  sleep 0.1
done
test "$holder_ready" = 1
echo CV03_N105C06_REAL_PG_ROW_LOCK_HOLDER_READY_PASS

# Use only an already committed operation; if implementation regresses it
# will be caught by the snapshot check. This is NOT a new mutation attempt.
statement="SELECT authenticated_host_id||'|'||authority_epoch::text||'|'||replayed::text||'|'||outbox_event_id
  FROM cv03_n105b_qa.cv03_n105b_commit_deny_t0(
  '$host','$operation','enterprise-context:qa-ent-01',
  'qa-ent-01','qa-human-01','HUMAN','$generation',0,
  'AUTHORIZATION_REVOKE','collection.saved-view.personal.save')"
tcp "$db" "$statement" > "$temp/one.result" 2> "$temp/one.err" &
one_pid=$!
tcp "$db" "$statement" > "$temp/two.result" 2> "$temp/two.err" &
two_pid=$!

overlap=0
for i in $(seq 1 45); do
  queued="$(admin "$db" "SELECT count(*) FROM pg_stat_activity WHERE usename='$role' AND datname='$db' AND wait_event_type='Lock' AND query LIKE '%cv03_n105b_commit_deny_t0%'")"
  if [[ "$queued" =~ ^[2-9][0-9]*$|^2$ ]]; then overlap=1; break; fi
  sleep 0.1
done
if test "$overlap" != 1; then
  echo CV03_N105C06_TWO_ACTIVE_PRODUCER_LOCK_WAITERS_NOT_OBSERVED >&2
  exit 1
fi
echo CV03_N105C06_TWO_DISTINCT_AUTHENTICATED_TCP_SESSIONS_CONTENDING_PASS
wait "$one_pid"
one_pid=""
wait "$two_pid"
two_pid=""
wait "$holder_pid"
holder_pid=""

expected_event="$(admin "$db" "SELECT result_fields->>'event_id' FROM cv03_n105b_qa.operation_receipts WHERE operation_key='$operation'")"
[[ "$expected_event" == evt-* ]]
expected="$host|1|true|$expected_event"
test "$(cat "$temp/one.result")" = "$expected"
test "$(cat "$temp/two.result")" = "$expected"
test "$(snapshot)" = "$before"
echo CV03_N105C06_ACK_LOSS_CONCURRENT_REPLAY_SAME_RECEIPT_NO_OUTBOX_PASS

# A different Actor/scope with an already-committed idempotency key MUST not
# be confused with the original operation or inherit its receipt.
must_deny() {
  if tcp "$db" "$1" > /dev/null 2>&1; then
    echo CV03_N105C06_UNEXPECTED_SCOPE_OR_HOST_ACCEPTANCE >&2
    exit 1
  fi
}
must_deny "SELECT * FROM cv03_n105b_qa.cv03_n105b_commit_deny_t0(
 '$host','$operation','enterprise-context:qa-ent-01','qa-ent-01',
 'qa-ai-01','AI','$generation',0,'AUTHORIZATION_REVOKE',
 'collection.saved-view.personal.save')"
must_deny "SELECT * FROM cv03_n105b_qa.cv03_n105b_commit_deny_t0(
 'spoofed-other-host','$operation','enterprise-context:qa-ent-01','qa-ent-01',
 'qa-human-01','HUMAN','$generation',0,'AUTHORIZATION_REVOKE',
 'collection.saved-view.personal.save')"
must_deny "SELECT * FROM cv03_n105b_qa.cv03_n105b_commit_deny_t0(
 '$host','$operation','enterprise-context:qa-ent-01','qa-ent-01',
 'qa-human-01','HUMAN','stale-generation-20260101',0,'AUTHORIZATION_REVOKE',
 'collection.saved-view.personal.save')"
test "$(snapshot)" = "$before"
test "$(admin "$original" "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname NOT LIKE 'pg_%' AND n.nspname<>'information_schema'")" = "$original_objects"
test "$(admin "$original" "SELECT count(*) FROM pg_namespace WHERE nspname='cv03_n105b_qa'")" = 0
echo CV03_N105C06_CROSS_ACTOR_HOST_GENERATION_DENIED_SOURCE_UNCHANGED_PASS

# Check the genuinely deployed application still connects to the ORIGINAL DB.
docker compose exec -T --interactive=false evo node --input-type=module -e '
import postgres from "postgres";
const url=process.env.APP_PLATFORM_CONVERSATION_DATABASE_URL;
if(typeof url!=="string")process.exit(2);
const db=postgres(url,{max:1,connect_timeout:5,idle_timeout:1});
try{
  const rows=await db.unsafe("SELECT session_user AS u,current_database() AS d");
  if(rows.length!==1||rows[0].u!=="evo"||rows[0].d!=="evo_dev")throw Error("CV03_N105C06_APP_SQL_FAILED");
}finally{await db.end({timeout:2});}
'
for service in postgres evo; do
  cid="$(docker compose ps -q "$service")"
  test "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' "$cid")" = healthy
done
echo CV03_N105C06_REAL_EVO_RUNTIME_HEALTH_AND_ORIGINAL_PRESERVED_PASS
unset secret
echo CV03_N105C06_PHYSICAL_CONCURRENT_ACK_REPLAY_TERMINAL_PASS
