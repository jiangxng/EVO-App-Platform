/**
 * CV-03 N1-04f: isolated PostgreSQL 18 proof only.
 *
 * The authority state and outbox below share ONE database transaction.
 * This does not change/replace the real PA05 LifecycleStore, whose
 * file/memory writes and onLifecycleEvent callbacks are not transactional
 * with this schema. The test feeds actual Manager authorization evaluations.
 *
 * DO NOT install or execute this builder in a production schema.
 */
export function cv03N104fIsolatedAuthorityTxOutboxSqlV010(schema){
  if(typeof schema!=="string"||!/^cv03_[a-z0-9_]{1,58}$/.test(schema))
    throw Error("CV03_N1_ISOLATED_SCHEMA_REQUIRED");
  const s='"'+schema+'"';
  return `
CREATE TABLE ${s}.cv03_n104f_test_authority_state (
 context_id text NOT NULL,
 enterprise_id text NOT NULL,
 principal_subject_id text NOT NULL,
 actor_type text NOT NULL CHECK (actor_type IN ('HUMAN','AI')),
 operation_id text NOT NULL CHECK (operation_id='collection.saved-view.personal.save'),
 generation text NOT NULL CHECK (generation IN ('CI_GENERATION_1','CI_GENERATION_2')),
 authority_epoch bigint NOT NULL CHECK (authority_epoch>=1),
 enabled boolean NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(context_id,principal_subject_id,actor_type,operation_id)
);
CREATE TABLE ${s}.cv03_n104f_test_authority_outbox (
 context_id text NOT NULL,
 enterprise_id text NOT NULL,
 principal_subject_id text NOT NULL,
 actor_type text NOT NULL CHECK (actor_type IN ('HUMAN','AI')),
 operation_id text NOT NULL,
 generation text NOT NULL,
 authority_epoch bigint NOT NULL,
 event_json text NOT NULL,
 acked boolean NOT NULL DEFAULT false,
 inserted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 acked_at timestamptz,
 PRIMARY KEY(context_id,principal_subject_id,actor_type,operation_id,authority_epoch),
 CHECK(authority_epoch>=1)
);
REVOKE ALL ON TABLE ${s}.cv03_n104f_test_authority_state FROM PUBLIC;
REVOKE ALL ON TABLE ${s}.cv03_n104f_test_authority_outbox FROM PUBLIC;

-- Owner-only transaction: a committed authority epoch must have a durable
-- corresponding outbox row. Duplicate event is idempotent; tampering is DENY.
CREATE FUNCTION ${s}.cv03_n104f_test_commit_authority(
 p_event text, p_fault_after_state boolean DEFAULT false
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $cv03_t0$
DECLARE
 ev jsonb;
 ctx text;
 enterprise text;
 subject text;
 actor text;
 op text;
 gen text;
 epoch bigint;
 previous bigint;
 prior_generation text;
 old_event text;
BEGIN
 IF p_event IS NULL OR length(p_event)>8192 THEN
   RAISE EXCEPTION 'CV03_N104F_AUTHORITY_EVENT_INVALID';
 END IF;
 ev:=p_event::jsonb;
 ctx:=ev->>'contextId';
 enterprise:=ev->>'enterpriseId';
 subject:=ev->>'principalSubjectId';
 actor:=ev->>'evaluatedActorType';
 op:=ev->>'operationId';
 gen:=ev->>'generation';
 IF ev->>'source' IS DISTINCT FROM 'PA05_OWNER_TEST_ONLY'
    OR gen IS NULL OR gen NOT IN ('CI_GENERATION_1','CI_GENERATION_2')
    OR op IS DISTINCT FROM 'collection.saved-view.personal.save'
    OR actor NOT IN ('HUMAN','AI') OR actor IS NULL
    OR ctx IS NULL OR ctx !~ '^enterprise-context:[a-zA-Z0-9_-]{1,100}$'
    OR enterprise IS NULL OR ctx IS DISTINCT FROM 'enterprise-context:'||enterprise
    OR subject IS NULL OR length(subject)=0 OR length(subject)>160
    OR jsonb_typeof(ev->'enabled') IS DISTINCT FROM 'boolean'
    OR jsonb_typeof(ev->'authorityEpoch') IS DISTINCT FROM 'number'
    OR ev->>'authorityEpoch' !~ '^[1-9][0-9]{0,16}$'
    OR ev->>'issuedAt' IS NULL THEN
   RAISE EXCEPTION 'CV03_N104F_AUTHORITY_EVENT_INVALID';
 END IF;
 epoch:=(ev->>'authorityEpoch')::bigint;
 -- Serialize both workers on exactly one authority scope.
 PERFORM pg_advisory_xact_lock(hashtextextended(
    ctx||'|'||subject||'|'||actor||'|'||op,0));
 SELECT event_json INTO old_event
 FROM ${s}.cv03_n104f_test_authority_outbox
 WHERE context_id=ctx AND principal_subject_id=subject AND actor_type=actor
   AND operation_id=op AND authority_epoch=epoch;
 IF FOUND THEN
   IF old_event IS DISTINCT FROM p_event THEN
     RAISE EXCEPTION 'CV03_N104F_EPOCH_PAYLOAD_CONFLICT';
   END IF;
   RETURN 'DUPLICATE';
 END IF;
 SELECT authority_epoch,generation INTO previous,prior_generation
 FROM ${s}.cv03_n104f_test_authority_state
 WHERE context_id=ctx AND principal_subject_id=subject AND actor_type=actor
   AND operation_id=op FOR UPDATE;
 IF FOUND AND prior_generation='CI_GENERATION_2' AND gen<>'CI_GENERATION_2' THEN
   RAISE EXCEPTION 'CV03_N104H_GENERATION_ROLLBACK_DENIED';
 END IF;
 IF (NOT FOUND AND epoch<>1) OR
    (FOUND AND epoch IS DISTINCT FROM previous+1) THEN
   RAISE EXCEPTION 'CV03_N104F_AUTHORITY_EPOCH_GAP_OR_STALE';
 END IF;
 INSERT INTO ${s}.cv03_n104f_test_authority_state
   (context_id,enterprise_id,principal_subject_id,actor_type,operation_id,
    generation,authority_epoch,enabled)
 VALUES(ctx,enterprise,subject,actor,op,gen,epoch,(ev->>'enabled')::boolean)
 ON CONFLICT(context_id,principal_subject_id,actor_type,operation_id)
 DO UPDATE SET authority_epoch=EXCLUDED.authority_epoch,
   enabled=EXCLUDED.enabled,updated_at=clock_timestamp();
 IF p_fault_after_state THEN
   RAISE EXCEPTION 'CV03_N104F_FORCED_T0_ROLLBACK';
 END IF;
 INSERT INTO ${s}.cv03_n104f_test_authority_outbox
   (context_id,enterprise_id,principal_subject_id,actor_type,operation_id,
    generation,authority_epoch,event_json)
 VALUES(ctx,enterprise,subject,actor,op,gen,epoch,p_event);
 RETURN 'COMMITTED_WITH_OUTBOX';
END;
$cv03_t0$;
REVOKE ALL ON FUNCTION ${s}.cv03_n104f_test_commit_authority(text,boolean) FROM PUBLIC;

-- A separately signed full snapshot for exactly ONE actor+operation. This
-- bounded form does not certify production-wide completeness or multi-Host
-- source recovery. In the fixture the authoritative state is co-located,
-- allowing an additional independent equality check before clearing a gap.
CREATE FUNCTION ${s}.cv03_n104f_test_recover_snapshot(
 p_envelope text,p_signature text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $cv03_t3$
DECLARE
 e jsonb;
 snap jsonb;
 k text;
 authority record;
 mirror_epoch bigint;
 snapshot_epoch bigint;
 seen_at timestamptz;
 ctx text;
 subject text;
 actor text;
 op text;
BEGIN
 IF p_envelope IS NULL OR length(p_envelope)>8192
    OR p_signature IS NULL OR p_signature !~ '^[a-f0-9]{64}$' THEN
   RAISE EXCEPTION 'CV03_N104F_SNAPSHOT_INVALID';
 END IF;
 e:=p_envelope::jsonb;
 snap:=e->'snapshot';
 ctx:=snap->>'contextId';
 subject:=snap->>'principalSubjectId';
 actor:=snap->>'evaluatedActorType';
 op:=snap->>'operationId';
 IF e->>'domain' IS DISTINCT FROM 'cv03.pa05-owner-snapshot.isolated/0.1.0'
   OR e->>'keyId' !~ '^[a-zA-Z0-9_-]{1,48}$'
   OR snap->>'source' IS DISTINCT FROM 'PA05_OWNER_TEST_ONLY'
   OR snap->>'generation' IS NULL OR
   snap->>'generation' NOT IN ('CI_GENERATION_1','CI_GENERATION_2')
   OR snap->>'completeness' IS DISTINCT FROM 'SINGLE_ACTOR_OPERATION'
   OR op IS DISTINCT FROM 'collection.saved-view.personal.save'
   OR actor NOT IN ('HUMAN','AI') OR actor IS NULL
   OR ctx IS NULL OR subject IS NULL
   OR snap->>'enterpriseId' IS NULL
   OR ctx IS DISTINCT FROM 'enterprise-context:'||(snap->>'enterpriseId')
   OR jsonb_typeof(snap->'enabled') IS DISTINCT FROM 'boolean'
   OR snap->>'authorityEpoch' !~ '^[1-9][0-9]{0,16}$'
   OR snap->>'issuedAt' IS NULL THEN
   RAISE EXCEPTION 'CV03_N104F_SNAPSHOT_INVALID';
 END IF;
 BEGIN
   snapshot_epoch:=(snap->>'authorityEpoch')::bigint;
   seen_at:=(snap->>'issuedAt')::timestamptz;
 EXCEPTION WHEN invalid_datetime_format OR numeric_value_out_of_range
     OR datetime_field_overflow THEN
   RAISE EXCEPTION 'CV03_N104F_SNAPSHOT_INVALID';
 END;
 SELECT secret INTO k FROM ${s}.cv03_n104c_event_keys
 WHERE key_id=e->>'keyId' AND enabled=true FOR SHARE;
 IF k IS NULL OR encode(public.hmac(convert_to(p_envelope,'UTF8'),
      convert_to(k,'UTF8'),'sha256'),'hex')<>p_signature THEN
   RAISE EXCEPTION 'CV03_N104F_SNAPSHOT_SIGNATURE_INVALID';
 END IF;
 IF seen_at IS NULL OR seen_at<clock_timestamp()-interval '90 seconds'
    OR seen_at>clock_timestamp()+interval '30 seconds' THEN
   RAISE EXCEPTION 'CV03_N104F_SNAPSHOT_EXPIRED';
 END IF;
 SELECT authority_epoch,enabled,generation,enterprise_id INTO authority
 FROM ${s}.cv03_n104f_test_authority_state
 WHERE context_id=ctx AND principal_subject_id=subject
   AND actor_type=actor AND operation_id=op FOR SHARE;
 IF NOT FOUND OR authority.authority_epoch<>snapshot_epoch
    OR authority.enabled IS DISTINCT FROM (snap->>'enabled')::boolean
    OR authority.generation IS DISTINCT FROM snap->>'generation'
    OR authority.enterprise_id IS DISTINCT FROM snap->>'enterpriseId' THEN
   RAISE EXCEPTION 'CV03_N104F_SNAPSHOT_NOT_AUTHORITATIVE';
 END IF;
 SELECT authority_epoch INTO mirror_epoch
 FROM ${s}.cv03_n1_operation_policy
 WHERE context_id=ctx AND principal_subject_id=subject
   AND actor_type=actor AND operation_id=op FOR UPDATE;
 IF FOUND AND mirror_epoch>snapshot_epoch THEN
   RAISE EXCEPTION 'CV03_N104F_SNAPSHOT_ROLLBACK_DENIED';
 END IF;
 INSERT INTO ${s}.cv03_n1_operation_policy
   (context_id,principal_subject_id,actor_type,operation_id,
    enabled,authority_epoch,mirror_healthy,delivery_required,lease_until)
 VALUES(ctx,subject,actor,op,(snap->>'enabled')::boolean,snapshot_epoch,
    true,true,CASE WHEN (snap->>'enabled')::boolean THEN
     clock_timestamp()+interval '90 seconds' ELSE NULL END)
 ON CONFLICT (context_id,principal_subject_id,actor_type,operation_id)
 DO UPDATE SET enabled=EXCLUDED.enabled,authority_epoch=EXCLUDED.authority_epoch,
   mirror_healthy=true,delivery_required=true,
   lease_until=EXCLUDED.lease_until,changed_at=clock_timestamp();
 RETURN 'FULL_ACTOR_SNAPSHOT_APPLIED';
END;
$cv03_t3$;
REVOKE ALL ON FUNCTION ${s}.cv03_n104f_test_recover_snapshot(text,text) FROM PUBLIC;
`;
}
