
-- CV03 N1-05b-08: QA-ONLY real PostgreSQL 17 atomic DENY + immutable outbox.
-- Must be invoked ONLY against separate cv03_n105b_qa, never evo_dev.
-- This is an isolated physical SQL transaction / grant test, NOT production
-- PA05 or AuthorizationProvider persistence, workload KMS or N1 certification.
BEGIN;
DO $guard$
BEGIN
  IF current_database() <> 'cv03_n105b_qa' OR session_user <> 'evo' THEN
    RAISE EXCEPTION 'CV03_QA_DATABASE_OR_MIGRATION_IDENTITY_INVALID';
  END IF;
  IF current_setting('server_version_num')::integer < 170000
     OR current_setting('server_version_num')::integer >= 180000 THEN
    RAISE EXCEPTION 'CV03_QA_EXPECTED_POSTGRES17';
  END IF;
END
$guard$;
SET ROLE cv03_n105b_qa_owner;
CREATE SCHEMA cv03_n105b_qa;
REVOKE ALL ON SCHEMA cv03_n105b_qa FROM PUBLIC;

CREATE TABLE cv03_n105b_qa.producer_identity (
  login_role name PRIMARY KEY,
  host_id text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true
);
CREATE TABLE cv03_n105b_qa.feature_authority (
  feature_id text PRIMARY KEY,
  package_id text NOT NULL,
  source_generation text NOT NULL,
  frozen boolean NOT NULL DEFAULT false,
  fence_id text
);
CREATE TABLE cv03_n105b_qa.scope_authority (
  context_id text NOT NULL,
  enterprise_id text NOT NULL,
  principal_subject_id text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('HUMAN','AI')),
  operation_id text NOT NULL,
  source_generation text NOT NULL,
  authority_epoch bigint NOT NULL DEFAULT 0 CHECK (authority_epoch >= 0),
  enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (context_id,enterprise_id,principal_subject_id,actor_type,operation_id)
);
CREATE TABLE cv03_n105b_qa.immutable_outbox (
  event_id text PRIMARY KEY,
  event_payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE cv03_n105b_qa.operation_receipts (
  operation_key text PRIMARY KEY,
  input_arguments jsonb NOT NULL,
  result_fields jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE FUNCTION cv03_n105b_qa.reject_outbox_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, cv03_n105b_qa, pg_temp
AS $fn$
BEGIN
  RAISE EXCEPTION 'CV03_QA_OUTBOX_IMMUTABLE';
END
$fn$;
CREATE TRIGGER reject_outbox_update_delete
  BEFORE UPDATE OR DELETE ON cv03_n105b_qa.immutable_outbox
  FOR EACH ROW EXECUTE FUNCTION cv03_n105b_qa.reject_outbox_mutation();
CREATE TRIGGER reject_outbox_truncate
  BEFORE TRUNCATE ON cv03_n105b_qa.immutable_outbox
  FOR EACH STATEMENT EXECUTE FUNCTION cv03_n105b_qa.reject_outbox_mutation();

-- One function call: feature lock, expected-generation / epoch checked against
-- persisted QA owner facts, DENY and outbox append or neither. All writes are
-- inside the invoking PostgreSQL statement's transaction.
CREATE FUNCTION cv03_n105b_qa.cv03_n105b_commit_deny_t0(
  p_host_id text,p_operation_key text,p_context_id text,p_enterprise_id text,
  p_principal_subject_id text,p_actor_type text,p_source_generation text,
  p_expected_epoch bigint,p_deny_reason text,p_operation_id text
) RETURNS TABLE (
  authenticated_host_id text,operation_key text,context_id text,
  enterprise_id text,principal_subject_id text,actor_type text,
  operation_id text,source_generation text,authority_epoch bigint,
  enabled boolean,outbox_event_id text,replayed boolean
) LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, cv03_n105b_qa, pg_temp
AS $fn$
DECLARE
  v_host text;
  v_feature cv03_n105b_qa.feature_authority%ROWTYPE;
  v_prior cv03_n105b_qa.operation_receipts%ROWTYPE;
  v_args jsonb;
  v_epoch bigint;
  v_event text;
BEGIN
  SELECT p.host_id INTO v_host FROM cv03_n105b_qa.producer_identity p
   WHERE p.login_role = session_user AND p.enabled;
  IF v_host IS NULL OR v_host <> p_host_id THEN
    RAISE EXCEPTION 'CV03_QA_PRODUCER_IDENTITY_DENIED';
  END IF;
  IF p_operation_key IS NULL OR length(p_operation_key) < 8 OR length(p_operation_key)>100
    OR p_context_id IS DISTINCT FROM 'enterprise-context:'||p_enterprise_id
    OR p_actor_type NOT IN ('HUMAN','AI')
    OR p_expected_epoch IS NULL OR p_expected_epoch<0
    OR p_deny_reason NOT IN ('PA05_DISABLE','PA05_UNINSTALL','AUTHORIZATION_REVOKE')
    OR p_operation_id IS DISTINCT FROM 'collection.saved-view.personal.save' THEN
    RAISE EXCEPTION 'CV03_QA_INVALID_DENY_REQUEST';
  END IF;
  SELECT f.* INTO v_feature FROM cv03_n105b_qa.feature_authority f
    WHERE f.feature_id='host-enterprise-context-provider.personal-saved-views'
    FOR UPDATE;
  IF NOT FOUND OR v_feature.source_generation IS DISTINCT FROM p_source_generation THEN
    RAISE EXCEPTION 'CV03_QA_GENERATION_DENIED';
  END IF;
  v_args=jsonb_build_array('DENY',p_host_id,p_operation_key,p_context_id,
    p_enterprise_id,p_principal_subject_id,p_actor_type,p_source_generation,
    p_expected_epoch,p_deny_reason,p_operation_id);
  SELECT r.* INTO v_prior FROM cv03_n105b_qa.operation_receipts r
    WHERE r.operation_key=p_operation_key FOR UPDATE;
  IF FOUND THEN
    IF v_prior.input_arguments <> v_args THEN
      RAISE EXCEPTION 'CV03_QA_OPERATION_KEY_CONFLICT';
    END IF;
    RETURN QUERY SELECT p_host_id,p_operation_key,p_context_id,p_enterprise_id,
      p_principal_subject_id,p_actor_type,p_operation_id,p_source_generation,
      (v_prior.result_fields->>'epoch')::bigint,false,
      v_prior.result_fields->>'event_id',true;
    RETURN;
  END IF;
  IF v_feature.frozen THEN
    RAISE EXCEPTION 'CV03_QA_FEATURE_FROZEN';
  END IF;
  UPDATE cv03_n105b_qa.scope_authority s
    SET enabled=false,authority_epoch=s.authority_epoch+1
    WHERE s.context_id=p_context_id AND s.enterprise_id=p_enterprise_id
      AND s.principal_subject_id=p_principal_subject_id
      AND s.actor_type=p_actor_type AND s.operation_id=p_operation_id
      AND s.source_generation=p_source_generation
      AND s.authority_epoch=p_expected_epoch AND s.enabled
    RETURNING s.authority_epoch INTO v_epoch;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'CV03_QA_SCOPE_OR_EPOCH_DENIED';
  END IF;
  v_event='evt-'||gen_random_uuid()::text;
  INSERT INTO cv03_n105b_qa.immutable_outbox(event_id,event_payload)
    VALUES (v_event,jsonb_build_object('type','DENY','epoch',v_epoch,
      'context_id',p_context_id,'enterprise_id',p_enterprise_id,
      'principal_subject_id',p_principal_subject_id,'actor_type',p_actor_type,
      'operation_id',p_operation_id,'source_generation',p_source_generation));
  INSERT INTO cv03_n105b_qa.operation_receipts(operation_key,input_arguments,result_fields)
    VALUES(p_operation_key,v_args,jsonb_build_object('epoch',v_epoch,'event_id',v_event));
  RETURN QUERY SELECT p_host_id,p_operation_key,p_context_id,p_enterprise_id,
    p_principal_subject_id,p_actor_type,p_operation_id,p_source_generation,
    v_epoch,false,v_event,false;
END
$fn$;

-- One locked global Saved View Feature fence; the frozen tombstone denies
-- future scopes. Default enterprise-context Feature in the shared Package
-- is not touched.
CREATE FUNCTION cv03_n105b_qa.cv03_n105b_fence_package_t0(
  p_host_id text,p_operation_key text,p_package_id text,p_feature_id text,
  p_source_generation text,p_operation text
) RETURNS TABLE (
  authenticated_host_id text,operation_key text,package_id text,feature_id text,
  source_generation text,operation text,package_state text,fence_id text,
  outbox_batch_id text,scope_count bigint,replayed boolean
) LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, cv03_n105b_qa, pg_temp
AS $fn$
DECLARE
  v_host text;
  v_feature cv03_n105b_qa.feature_authority%ROWTYPE;
  v_prior cv03_n105b_qa.operation_receipts%ROWTYPE;
  v_args jsonb;
  v_fence text;
  v_batch text;
  v_count bigint;
BEGIN
  SELECT p.host_id INTO v_host FROM cv03_n105b_qa.producer_identity p
    WHERE p.login_role=session_user AND p.enabled;
  IF v_host IS NULL OR v_host <> p_host_id THEN
    RAISE EXCEPTION 'CV03_QA_PRODUCER_IDENTITY_DENIED';
  END IF;
  IF p_operation_key IS NULL OR length(p_operation_key)<8 OR length(p_operation_key)>100
    OR p_package_id IS DISTINCT FROM 'host-enterprise-context-provider'
    OR p_feature_id IS DISTINCT FROM 'host-enterprise-context-provider.personal-saved-views'
    OR p_operation IS DISTINCT FROM 'DISABLE' THEN
    RAISE EXCEPTION 'CV03_QA_INVALID_FEATURE_FENCE';
  END IF;
  SELECT f.* INTO v_feature FROM cv03_n105b_qa.feature_authority f
    WHERE f.feature_id=p_feature_id AND f.package_id=p_package_id FOR UPDATE;
  IF NOT FOUND OR v_feature.source_generation IS DISTINCT FROM p_source_generation THEN
    RAISE EXCEPTION 'CV03_QA_GENERATION_DENIED';
  END IF;
  v_args=jsonb_build_array('FENCE',p_host_id,p_operation_key,p_package_id,
    p_feature_id,p_source_generation,p_operation);
  SELECT r.* INTO v_prior FROM cv03_n105b_qa.operation_receipts r
    WHERE r.operation_key=p_operation_key FOR UPDATE;
  IF FOUND THEN
    IF v_prior.input_arguments <> v_args THEN
      RAISE EXCEPTION 'CV03_QA_OPERATION_KEY_CONFLICT';
    END IF;
    RETURN QUERY SELECT p_host_id,p_operation_key,p_package_id,p_feature_id,
      p_source_generation,p_operation,'FROZEN_ALL_SCOPES'::text,
      v_prior.result_fields->>'fence_id',v_prior.result_fields->>'batch_id',
      (v_prior.result_fields->>'scope_count')::bigint,true;
    RETURN;
  END IF;
  IF v_feature.frozen THEN
    RAISE EXCEPTION 'CV03_QA_FEATURE_ALREADY_FROZEN';
  END IF;
  v_fence='fence-'||gen_random_uuid()::text;
  v_batch='batch-'||gen_random_uuid()::text;
  UPDATE cv03_n105b_qa.scope_authority s
    SET enabled=false,authority_epoch=s.authority_epoch+1
    WHERE s.source_generation=p_source_generation AND s.enabled;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  UPDATE cv03_n105b_qa.feature_authority f
    SET frozen=true,fence_id=v_fence WHERE f.feature_id=p_feature_id;
  INSERT INTO cv03_n105b_qa.immutable_outbox(event_id,event_payload)
    VALUES(v_batch,jsonb_build_object('type','FROZEN_ALL_SCOPES',
      'source_generation',p_source_generation,'feature_id',p_feature_id,
      'fence_id',v_fence,'scope_count',v_count));
  INSERT INTO cv03_n105b_qa.operation_receipts(operation_key,input_arguments,result_fields)
    VALUES(p_operation_key,v_args,jsonb_build_object('fence_id',v_fence,
      'batch_id',v_batch,'scope_count',v_count));
  RETURN QUERY SELECT p_host_id,p_operation_key,p_package_id,p_feature_id,
    p_source_generation,p_operation,'FROZEN_ALL_SCOPES'::text,v_fence,
    v_batch,v_count,false;
END
$fn$;

-- QA source facts are seeded by the isolated DB owner, NOT the real deployed
-- PA05/AuthorizationProvider. Never let Producer seed or edit these rows.
INSERT INTO cv03_n105b_qa.producer_identity(login_role,host_id)
  VALUES('cv03_n105b_qa_producer','tokyo-qa-host-01');
INSERT INTO cv03_n105b_qa.feature_authority(feature_id,package_id,source_generation)
  VALUES('host-enterprise-context-provider.personal-saved-views',
    'host-enterprise-context-provider','qa-gen-20261111');
INSERT INTO cv03_n105b_qa.scope_authority
 (context_id,enterprise_id,principal_subject_id,actor_type,operation_id,source_generation)
 VALUES
 ('enterprise-context:qa-ent-01','qa-ent-01','qa-human-01','HUMAN',
  'collection.saved-view.personal.save','qa-gen-20261111'),
 ('enterprise-context:qa-ent-01','qa-ent-01','qa-ai-01','AI',
  'collection.saved-view.personal.save','qa-gen-20261111'),
 ('enterprise-context:qa-ent-offline','qa-ent-offline','qa-offline-01','HUMAN',
  'collection.saved-view.personal.save','qa-gen-20261111');

-- Revoke the default PUBLIC function EXECUTE in the SAME schema transaction.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA cv03_n105b_qa FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA cv03_n105b_qa FROM PUBLIC;
GRANT USAGE ON SCHEMA cv03_n105b_qa TO cv03_n105b_qa_producer;
GRANT EXECUTE ON FUNCTION cv03_n105b_qa.cv03_n105b_commit_deny_t0(
 text,text,text,text,text,text,text,bigint,text,text) TO cv03_n105b_qa_producer;
GRANT EXECUTE ON FUNCTION cv03_n105b_qa.cv03_n105b_fence_package_t0(
 text,text,text,text,text,text) TO cv03_n105b_qa_producer;
RESET ROLE;
COMMIT;
