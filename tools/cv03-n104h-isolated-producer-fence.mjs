/**
 * CV-03 N1-04h, isolated PostgreSQL18 owner/producer fencing fixture.
 * Not a production PA05 producer, lifecycle migration, database credential
 * factory, KMS service, or authorization authority.
 *
 * The trusted CI owner controls one global authority generation. Only a
 * PostgreSQL LOGIN matching the fenced producer can append Manager-derived
 * events through the owner-only N1-04f T0 transaction. Generation rotation
 * atomically denies ALL existing actor scopes, advances their monotonic
 * epochs, and appends deny tombstones in the same PG transaction.
 */
export function cv03N104hIsolatedProducerFenceSqlV010(schema){
  if(typeof schema!=="string"||!/^cv03_[a-z0-9_]{1,58}$/.test(schema))
    throw Error("CV03_N1_ISOLATED_SCHEMA_REQUIRED");
  const s='"'+schema+'"';
  return `
CREATE TABLE ${s}.cv03_n104h_test_producer_fence(
 source text PRIMARY KEY CHECK (source='PA05_OWNER_TEST_ONLY'),
 active_generation text NOT NULL
   CHECK (active_generation IN ('CI_GENERATION_1','CI_GENERATION_2')),
 fence_epoch bigint NOT NULL CHECK (fence_epoch>=1),
 producer_login name NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON TABLE ${s}.cv03_n104h_test_producer_fence FROM PUBLIC;

-- Producer is the authenticated SQL session_user; request context alone
-- cannot supply or impersonate producer identity. FOR SHARE means a T0
-- commit and global rotation are serialized on the same durable fence.
CREATE FUNCTION ${s}.cv03_n104h_test_commit_fenced(p_event text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $cv03_h_commit$
DECLARE
 ev jsonb;
 f record;
BEGIN
 IF p_event IS NULL OR length(p_event)>8192 THEN
   RAISE EXCEPTION 'CV03_N104H_PRODUCER_EVENT_INVALID';
 END IF;
 ev:=p_event::jsonb;
 SELECT active_generation,fence_epoch,producer_login INTO f
 FROM ${s}.cv03_n104h_test_producer_fence
 WHERE source='PA05_OWNER_TEST_ONLY' FOR SHARE;
 IF NOT FOUND OR session_user IS DISTINCT FROM f.producer_login OR
    ev->>'source' IS DISTINCT FROM 'PA05_OWNER_TEST_ONLY' OR
    ev->>'generation' IS DISTINCT FROM f.active_generation OR
    ev->>'producerLogin' IS DISTINCT FROM session_user::text OR
    ev->>'producerFenceEpoch' IS DISTINCT FROM f.fence_epoch::text OR
    jsonb_typeof(ev->'producerFenceEpoch') IS DISTINCT FROM 'number' THEN
   RAISE EXCEPTION 'CV03_N104H_PRODUCER_FENCED';
 END IF;
 RETURN ${s}.cv03_n104f_test_commit_authority(p_event,false);
END;
$cv03_h_commit$;
REVOKE ALL ON FUNCTION ${s}.cv03_n104h_test_commit_fenced(text) FROM PUBLIC;

-- Trusted test authority Owner only, never granted to a producer or
-- delivery login. Calls must name the prior generation and fence counter.
-- A generation change is fail-closed AT COMMIT (not after asynchronous
-- tombstone delivery), including when the old ALLOW lease was still live.
CREATE FUNCTION ${s}.cv03_n104h_test_rotate_generation(
  p_prior_generation text,p_prior_epoch bigint,p_new_producer name
) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $cv03_h_rotate$
DECLARE
 f record;
 r record;
 tombstone jsonb;
 shifted integer:=0;
BEGIN
 IF p_prior_generation IS DISTINCT FROM 'CI_GENERATION_1' OR
    p_prior_epoch IS DISTINCT FROM 1 OR
    p_new_producer IS NULL OR length(p_new_producer::text)=0 THEN
   RAISE EXCEPTION 'CV03_N104H_ROTATION_INVALID';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles
   WHERE rolname=p_new_producer::text AND rolcanlogin) THEN
   RAISE EXCEPTION 'CV03_N104H_PRODUCER_LOGIN_INVALID';
 END IF;
 SELECT active_generation,fence_epoch,producer_login INTO f
 FROM ${s}.cv03_n104h_test_producer_fence
 WHERE source='PA05_OWNER_TEST_ONLY' FOR UPDATE;
 IF NOT FOUND OR f.active_generation IS DISTINCT FROM p_prior_generation
    OR f.fence_epoch IS DISTINCT FROM p_prior_epoch
    OR f.producer_login IS NOT DISTINCT FROM p_new_producer THEN
   RAISE EXCEPTION 'CV03_N104H_ROTATION_STALE_OR_UNSAFE';
 END IF;
 UPDATE ${s}.cv03_n104h_test_producer_fence
 SET active_generation='CI_GENERATION_2',fence_epoch=2,
     producer_login=p_new_producer,updated_at=clock_timestamp()
 WHERE source='PA05_OWNER_TEST_ONLY';
 FOR r IN
   UPDATE ${s}.cv03_n104f_test_authority_state
   SET enabled=false,generation='CI_GENERATION_2',
       authority_epoch=authority_epoch+1,updated_at=clock_timestamp()
   RETURNING context_id,enterprise_id,principal_subject_id,actor_type,
     operation_id,generation,authority_epoch,enabled
 LOOP
   tombstone:=jsonb_build_object(
     'source','PA05_OWNER_TEST_ONLY','generation','CI_GENERATION_2',
     'contextId',r.context_id,'enterpriseId',r.enterprise_id,
     'principalSubjectId',r.principal_subject_id,
     'evaluatedActorType',r.actor_type,'operationId',r.operation_id,
     'authorityEpoch',r.authority_epoch,'enabled',false,
     'issuedAt',to_char(clock_timestamp() AT TIME ZONE 'UTC',
       'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
     'producerLogin',p_new_producer::text,'producerFenceEpoch',2,
     'rotationDenyTombstone',true
   );
   INSERT INTO ${s}.cv03_n104f_test_authority_outbox(
     context_id,enterprise_id,principal_subject_id,actor_type,
     operation_id,generation,authority_epoch,event_json
   ) VALUES(r.context_id,r.enterprise_id,r.principal_subject_id,
     r.actor_type,r.operation_id,r.generation,r.authority_epoch,
     tombstone::text);
   UPDATE ${s}.cv03_n1_operation_policy SET
     enabled=false,mirror_healthy=false,delivery_required=true,
     lease_until=NULL,authority_epoch=GREATEST(
       authority_epoch,r.authority_epoch),changed_at=clock_timestamp()
   WHERE context_id=r.context_id AND principal_subject_id=r.principal_subject_id
     AND actor_type=r.actor_type AND operation_id=r.operation_id;
   shifted:=shifted+1;
 END LOOP;
 RETURN shifted;
END;
$cv03_h_rotate$;
REVOKE ALL ON FUNCTION ${s}.cv03_n104h_test_rotate_generation(
 text,bigint,name) FROM PUBLIC;

-- The delivery login gets this one function, not direct N1-04c or N1-04g.
-- Even an outbox-authenticated old-generation event cannot re-enable a
-- scope after a fail-closed generation switch.
CREATE FUNCTION ${s}.cv03_n104h_ingest_fenced(
  p_envelope text,p_signature text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $cv03_h_deliver$
DECLARE
 e jsonb;
 ev jsonb;
 f record;
BEGIN
 IF p_envelope IS NULL OR length(p_envelope)>8192 THEN
   RAISE EXCEPTION 'CV03_N104H_DELIVERY_INVALID';
 END IF;
 e:=p_envelope::jsonb;
 ev:=e->'event';
 SELECT active_generation,fence_epoch,producer_login INTO f
 FROM ${s}.cv03_n104h_test_producer_fence
 WHERE source='PA05_OWNER_TEST_ONLY' FOR SHARE;
 IF NOT FOUND OR jsonb_typeof(ev) IS DISTINCT FROM 'object' OR
    ev->>'generation' IS DISTINCT FROM f.active_generation OR
    ev->>'producerFenceEpoch' IS DISTINCT FROM f.fence_epoch::text OR
    ev->>'producerLogin' IS DISTINCT FROM f.producer_login::text OR
    jsonb_typeof(ev->'producerFenceEpoch') IS DISTINCT FROM 'number' THEN
   RAISE EXCEPTION 'CV03_N104H_GENERATION_FENCED';
 END IF;
 RETURN ${s}.cv03_n104g_ingest_committed_authority(p_envelope,p_signature);
END;
$cv03_h_deliver$;
REVOKE ALL ON FUNCTION ${s}.cv03_n104h_ingest_fenced(text,text) FROM PUBLIC;
`;
}
