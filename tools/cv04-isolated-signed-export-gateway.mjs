/**
 * CV-04 isolated PostgreSQL 16 signed EXPORT persistence admission.
 *
 * Source-aligned with CV03 N1's explicit SQL gateway, but NEVER shares
 * CV03 saved-view keys, policy rows, roles, operation grants or code.
 * No connection/DDL side effects on import. Only the disposable test fixture
 * runs this SQL against an isolated cv03_* schema.
 *
 * IMPORTANT: A test-only owner policy mirror and signing key aren't evidence
 * of genuine PA05 / enterprise membership event delivery, KMS, or multi-host
 * certification. A production runtime SQL role must NEVER use this fixture.
 */
export function cv04IsolatedSignedExportGatewaySqlV010(schema,options={}) {
  if (typeof schema!=="string"||!/^cv03_[a-z0-9_]{1,58}$/u.test(schema))
    throw new Error("CV04_EXPORT_GATEWAY_ISOLATED_SCHEMA_REQUIRED");
  if (!options || typeof options!=="object" ||
      (options.requirePhysicalWorkerLease!==undefined &&
       typeof options.requirePhysicalWorkerLease!=="boolean"))
    throw new Error("CV04_EXPORT_GATEWAY_LEASE_MODE_INVALID");
  const s='"'+schema+'"';
  // Opt-in combines two EXISTING isolated SQL protocols, not production Host.
  const physical=options.requirePhysicalWorkerLease===true;
  if(physical && (typeof options.workerLoginRole!=="string" ||
     !/^cv04_[a-z0-9_]{1,55}$/u.test(options.workerLoginRole)))
    throw new Error("CV04_EXPORT_GATEWAY_PHYSICAL_WORKER_LOGIN_REQUIRED");
  const workerFence=physical?`
  IF requested_op='dictionary.collection.export.job.worker' THEN
    IF e->>'workerLeaseEpoch' IS NULL OR
       e->>'workerLeaseEpoch' NOT IN ('1','2') OR
       e->>'workerLeaseTokenHash' IS NULL OR
       e->>'workerLeaseTokenHash' !~ '^[a-f0-9]{32}$'
    THEN RAISE EXCEPTION 'CV04_GATEWAY_PHYSICAL_LEASE_PROOF_REQUIRED'; END IF;
    -- Shared transaction lock with the separate Host/Worker SQL lease funcs.
    PERFORM pg_advisory_xact_lock(hashtextextended(scope_context||':'||id,42));
    SELECT l.epoch,l.claimed_until,l.state,l.claimed_token_hash,
           p.job_revision,p.authority_epoch,p.context_id AS permit_context,
           p.job_id AS permit_job,p.enterprise_id,p.subject_id,
           p.actor_type,p.state AS permit_state
      INTO physical_lease
      FROM ${s}.cv04_export_work_leases AS l
      JOIN ${s}.cv04_export_work_permits AS p
        ON p.token_hash=l.claimed_token_hash
       AND p.context_id=l.context_id AND p.job_id=l.job_id
      WHERE l.context_id=scope_context AND l.job_id=id
      FOR SHARE OF l,p;
    IF NOT FOUND THEN RAISE EXCEPTION 'CV04_GATEWAY_PHYSICAL_LEASE_FENCED'; END IF;
    IF physical_lease.state IS DISTINCT FROM 'RUNNING' OR
       physical_lease.permit_state IS DISTINCT FROM 'CLAIMED' OR
       physical_lease.authority_epoch IS DISTINCT FROM epoch OR
       physical_lease.claimed_until<=clock_timestamp() OR
       physical_lease.epoch IS DISTINCT FROM (e->>'workerLeaseEpoch')::bigint OR
       physical_lease.claimed_token_hash IS DISTINCT FROM e->>'workerLeaseTokenHash' OR
       physical_lease.permit_context IS DISTINCT FROM scope_context OR
       physical_lease.permit_job IS DISTINCT FROM id OR
       physical_lease.enterprise_id IS DISTINCT FROM scope_enterprise OR
       physical_lease.subject_id IS DISTINCT FROM subject OR
       physical_lease.actor_type IS DISTINCT FROM actor OR
       (next_state='RUNNING' AND
         (expected IS NULL OR expected<physical_lease.job_revision)) OR
       (next_state IN ('READY','FAILED') AND
         (expected IS NULL OR expected<=physical_lease.job_revision))
    THEN RAISE EXCEPTION 'CV04_GATEWAY_PHYSICAL_LEASE_FENCED'; END IF;
  END IF;
`:"";
  const startedFence=physical?`
         OR requested_attempt IS DISTINCT FROM physical_lease.epoch
         OR requested_lease>physical_lease.claimed_until`:"";
  const completedFence=physical?`
         OR requested_attempt IS DISTINCT FROM physical_lease.epoch
         OR previous_lease>physical_lease.claimed_until`:"";
  const auditFence=physical?`
         OR requested_attempt IS DISTINCT FROM physical_lease.epoch
         OR previous_lease>physical_lease.claimed_until`:"";
  // Ciphertext-only GET: the physical Worker SQL LOGIN cannot SELECT raw
  // resources, enumerate jobs, mint permits or use this after revocation.
  // DB authenticates session_user; no caller-entered context/subject permitted.
  const scopedReadSql=physical?`
CREATE FUNCTION ${s}.cv04_export_worker_read(p_token text,p_epoch bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog AS $cv04_worker_read$
DECLARE p record; l record; auth record; principal record;
  job_resource jsonb; job_revision bigint; m jsonb;
BEGIN
  IF session_user <> '${options.workerLoginRole}' THEN
    RAISE EXCEPTION 'CV04_EXPORT_WORKER_READ_LOGIN_DENIED'; END IF;
  IF p_token IS NULL OR p_token !~ '^[a-f0-9]{32}$' OR
     p_epoch NOT BETWEEN 1 AND 2 THEN
    RAISE EXCEPTION 'CV04_EXPORT_WORKER_READ_PROOF_INVALID'; END IF;
  -- First scope lookup is by unpredictable one-time token, not user input.
  SELECT * INTO p FROM ${s}.cv04_export_work_permits
    WHERE token_hash=md5(p_token);
  IF NOT FOUND OR p.state<>'CLAIMED' OR p.authority_epoch<1 THEN
    RAISE EXCEPTION 'CV04_EXPORT_WORKER_READ_PERMIT_DENIED'; END IF;
  SELECT enabled,mirror_healthy,authority_epoch,lease_until
    INTO auth FROM ${s}.cv04_export_authority
    WHERE context_id=p.context_id AND enterprise_id=p.enterprise_id
      AND principal_subject_id=p.subject_id AND actor_type=p.actor_type
      AND operation_id='dictionary.collection.export.job.worker'
    FOR SHARE;
  IF NOT FOUND OR auth.enabled IS DISTINCT FROM true OR
     auth.mirror_healthy IS DISTINCT FROM true OR
     auth.authority_epoch IS DISTINCT FROM p.authority_epoch OR
     auth.lease_until IS NULL OR
     auth.lease_until<=clock_timestamp() THEN
    RAISE EXCEPTION 'CV04_EXPORT_WORKER_READ_AUTHORITY_FENCED'; END IF;
  SELECT enabled,mirror_healthy,authority_epoch,lease_until
    INTO principal FROM ${s}.cv04_export_principal_fence
    WHERE context_id=p.context_id AND enterprise_id=p.enterprise_id
      AND principal_subject_id=p.subject_id AND actor_type=p.actor_type
    FOR SHARE;
  IF NOT FOUND OR principal.enabled IS DISTINCT FROM true OR
     principal.mirror_healthy IS DISTINCT FROM true OR
     principal.authority_epoch IS DISTINCT FROM p.authority_epoch OR
     principal.lease_until IS NULL OR
     principal.lease_until<=clock_timestamp() THEN
    RAISE EXCEPTION 'CV04_EXPORT_WORKER_READ_PRINCIPAL_FENCED'; END IF;
  -- Identical lock key and order as signed Worker CAS and Host revocation.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p.context_id||':'||p.job_id,42));
  SELECT * INTO p FROM ${s}.cv04_export_work_permits
    WHERE token_hash=md5(p_token) FOR SHARE;
  SELECT * INTO l FROM ${s}.cv04_export_work_leases
    WHERE context_id=p.context_id AND job_id=p.job_id FOR SHARE;
  IF NOT FOUND OR p.state IS DISTINCT FROM 'CLAIMED' OR
     p.authority_epoch IS DISTINCT FROM principal.authority_epoch OR
     l.state IS DISTINCT FROM 'RUNNING' OR l.epoch IS DISTINCT FROM p_epoch OR
     l.claimed_token_hash IS DISTINCT FROM p.token_hash OR
     l.claimed_until<=clock_timestamp() THEN
    RAISE EXCEPTION 'CV04_EXPORT_WORKER_READ_LEASE_FENCED'; END IF;
  SELECT revision,resource INTO job_revision,job_resource
    FROM ${s}.resources
    WHERE context_id=p.context_id
      AND namespace='evo.dictionary.export-jobs'
      AND collection_id='bounded-csv-jobs'
      AND resource_type='evo.dictionary.export.job'
      AND resource_id=p.job_id
    FOR SHARE;
  m:=job_resource->'payload'->'meta';
  IF NOT FOUND OR job_revision<p.job_revision OR
     job_resource->'payload'->>'kind' IS DISTINCT FROM
       'dictionary.export-job.encrypted' OR
     m->>'contextId' IS DISTINCT FROM p.context_id OR
     m->>'jobId' IS DISTINCT FROM p.job_id OR
     m->>'enterpriseId' IS DISTINCT FROM p.enterprise_id OR
     m->>'subjectId' IS DISTINCT FROM p.subject_id OR
     m->>'actorType' IS DISTINCT FROM p.actor_type OR
     (m->>'state' IS NULL OR m->>'state' NOT IN ('QUEUED','RUNNING')) OR
     m->>'expiresAt' IS NULL OR
     (m->>'expiresAt')::timestamptz<=clock_timestamp() OR
     (m->>'state'='RUNNING' AND
       (m->>'leaseUntil' IS NULL OR
        (m->>'leaseUntil')::timestamptz<=clock_timestamp() OR
        (m->>'leaseUntil')::timestamptz>l.claimed_until)) THEN
    RAISE EXCEPTION 'CV04_EXPORT_WORKER_READ_JOB_FENCED'; END IF;
  -- Metadata is already non-sensitive; selected rows/fields/CSV remain GCM
  -- ciphertext. Never return plaintext or expose resource list/select.
  RETURN jsonb_build_object('revision',job_revision,'resource',job_resource);
END;
$cv04_worker_read$;
REVOKE ALL ON FUNCTION ${s}.cv04_export_worker_read(text,bigint) FROM PUBLIC;
`:"";
  return `
CREATE TABLE ${s}.cv04_export_signing_keys(
  key_id text PRIMARY KEY,secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT true
);
REVOKE ALL ON TABLE ${s}.cv04_export_signing_keys FROM PUBLIC;
CREATE TABLE ${s}.cv04_export_authority(
  context_id text NOT NULL, enterprise_id text NOT NULL,
  principal_subject_id text NOT NULL, actor_type text NOT NULL
    CHECK(actor_type IN ('HUMAN','AI')),
  operation_id text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  mirror_healthy boolean NOT NULL DEFAULT false,
  authority_epoch bigint NOT NULL DEFAULT 0 CHECK(authority_epoch>0),
  lease_until timestamptz,
  PRIMARY KEY(context_id,enterprise_id,principal_subject_id,actor_type,operation_id)
);
REVOKE ALL ON TABLE ${s}.cv04_export_authority FROM PUBLIC;
-- Shared principal generation: revoking membership/tenant/plugin must fence
-- ALL operations, including any old signed worker/download proof.
-- Manually seeded only by disposable CI; NOT a trusted PA05 event bridge.
CREATE TABLE ${s}.cv04_export_principal_fence(
  context_id text NOT NULL,enterprise_id text NOT NULL,
  principal_subject_id text NOT NULL,actor_type text NOT NULL
    CHECK(actor_type IN ('HUMAN','AI')),
  enabled boolean NOT NULL DEFAULT false,
  mirror_healthy boolean NOT NULL DEFAULT false,
  authority_epoch bigint NOT NULL CHECK(authority_epoch>0),
  lease_until timestamptz,
  PRIMARY KEY(context_id,enterprise_id,principal_subject_id,actor_type)
);
REVOKE ALL ON TABLE ${s}.cv04_export_principal_fence FROM PUBLIC;
CREATE TABLE ${s}.cv04_export_used_proofs(
  key_id text NOT NULL,nonce text NOT NULL,
  context_id text NOT NULL,resource_id text NOT NULL,
  used_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(key_id,nonce)
);
REVOKE ALL ON TABLE ${s}.cv04_export_used_proofs FROM PUBLIC;

CREATE FUNCTION ${s}.cv04_export_signed_put(
  p_envelope text,p_signature text,p_resource text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,pg_temp
AS $cv04_signed_put$
DECLARE
  e jsonb;
  doc jsonb;
  meta jsonb;
  id text;
  signer text;
  scope_context text;
  scope_enterprise text;
  subject text;
  actor text;
  requested_op text;
  expected bigint;
  next_revision bigint;
  epoch bigint;
  permit_time timestamptz;
  resource_expires timestamptz;
  trusted_secret text;
  permitted boolean;
  healthy boolean;
  trusted_epoch bigint;
  policy_until timestamptz;
  principal_enabled boolean;
  principal_healthy boolean;
  principal_epoch bigint;
  principal_until timestamptz;
  prior record;
  row_namespace text;
  signed_digest text;
  next_state text;
  prior_meta jsonb;
  prior_state text;
  previous_attempt int;
  requested_attempt int;
  previous_lease timestamptz;
  requested_lease timestamptz;
  latest_event_type text;
  physical_lease record;
BEGIN
  IF p_envelope IS NULL OR p_resource IS NULL OR
     length(p_envelope)>8192 OR length(p_resource)>1000000 OR
     length(p_envelope)=0 OR length(p_resource)=0 OR
     p_signature IS NULL OR p_signature !~ '^[a-f0-9]{64}$'
  THEN RAISE EXCEPTION 'CV04_GATEWAY_INPUT_INVALID'; END IF;
  BEGIN
    e:=p_envelope::jsonb;
    doc:=p_resource::jsonb;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'CV04_GATEWAY_JSON_INVALID';
  END;
  IF jsonb_typeof(e)<>'object' OR jsonb_typeof(doc)<>'object' THEN
    RAISE EXCEPTION 'CV04_GATEWAY_JSON_INVALID';
  END IF;

  signer:=e->>'keyId';
  scope_context:=e->>'contextId';
  scope_enterprise:=e->>'enterpriseId';
  subject:=e->>'subjectId';
  actor:=e->>'actorType';
  requested_op:=e->>'operationId';
  id:=doc->>'resourceId';
  row_namespace:=doc->>'namespace';
  meta:=doc->'payload'->'meta';
  signed_digest:=e->>'resourceSha256';
  next_state:=meta->>'state';
  IF e->>'domain' IS DISTINCT FROM 'cv04.dictionary-export.host-write/0.1.0' OR
     e->>'contractVersion' IS DISTINCT FROM '0.1.0' OR
     signer IS NULL OR signer !~ '^[A-Za-z0-9_-]{1,48}$' OR
     scope_context IS NULL OR length(scope_context)=0 OR length(scope_context)>160 OR
     scope_enterprise IS NULL OR length(scope_enterprise)=0 OR length(scope_enterprise)>160 OR
     subject IS NULL OR length(subject)=0 OR length(subject)>160 OR
     actor NOT IN ('HUMAN','AI') OR
     requested_op NOT IN (
       'dictionary.collection.export.job.request',
       'dictionary.collection.export.job.worker',
       'dictionary.collection.export.job.download',
       'dictionary.collection.export.job.expire') OR
     e->>'nonce' IS NULL OR e->>'nonce' !~ '^[0-9a-f-]{36}$' OR
     signed_digest IS NULL OR signed_digest !~ '^[a-f0-9]{64}$' OR
     e->>'authorityEpoch' IS NULL OR e->>'authorityEpoch' !~ '^[1-9][0-9]{0,17}$' OR
     e->>'issuedAt' IS NULL OR
     row_namespace IS DISTINCT FROM 'evo.dictionary.export-jobs' OR
     doc->>'collectionId' IS DISTINCT FROM 'bounded-csv-jobs' OR
     doc->>'resourceType' IS DISTINCT FROM 'evo.dictionary.export.job' OR
     doc->>'schemaRef' IS DISTINCT FROM 'evo.dictionary.export-job/0.1.0' OR
     doc->>'ownerPackageId' IS DISTINCT FROM 'evo-business-dictionary' OR
     doc->>'storageKind' IS DISTINCT FROM 'DOCUMENT' OR
     doc->>'lifecycleState' IS DISTINCT FROM 'ACTIVE' OR
     id IS NULL OR id !~ '^exj-[0-9a-f]{48}$' OR
     doc->>'contextId' IS DISTINCT FROM scope_context OR
     doc->>'updatedBySubjectId' IS DISTINCT FROM subject OR
     doc->'payload'->>'kind' IS DISTINCT FROM 'dictionary.export-job.encrypted' OR
     doc->'payload'->>'contractVersion' IS DISTINCT FROM '0.1.0' OR
     jsonb_typeof(doc->'payload'->'secret') IS DISTINCT FROM 'object' OR
     doc->'payload'->'secret'->>'algorithm' IS DISTINCT FROM 'AES-256-GCM' OR
     jsonb_typeof(meta) IS DISTINCT FROM 'object' OR
     meta->>'jobId' IS DISTINCT FROM id OR
     meta->>'contextId' IS DISTINCT FROM scope_context OR
     meta->>'enterpriseId' IS DISTINCT FROM scope_enterprise OR
     meta->>'subjectId' IS DISTINCT FROM subject OR
     meta->>'actorType' IS DISTINCT FROM actor OR
     meta->>'contractVersion' IS DISTINCT FROM '0.1.0' OR
     meta->>'requestDigest' IS NULL OR
     meta->>'requestDigest' !~ '^[a-f0-9]{64}$' OR
     meta->>'snapshotId' IS NULL OR
     meta->>'snapshotId' !~ '^dict-[a-f0-9]{44}$' OR
     meta->>'attempt' IS NULL OR
     meta->>'attempt' !~ '^[0-2]$' OR
     jsonb_typeof(meta->'audit') IS DISTINCT FROM 'array' OR
     next_state NOT IN ('QUEUED','RUNNING','READY','FAILED','EXPIRED')
  THEN RAISE EXCEPTION 'CV04_GATEWAY_SCOPE_BINDING_DENIED'; END IF;
  BEGIN
    epoch:=(e->>'authorityEpoch')::bigint;
    permit_time:=(e->>'issuedAt')::timestamptz;
    resource_expires:=(meta->>'expiresAt')::timestamptz;
    IF e->'expectedRevision' IS NULL OR e->'expectedRevision'='null'::jsonb THEN
      expected:=NULL;
    ELSE
      expected:=(e->>'expectedRevision')::bigint;
    END IF;
    next_revision:=(doc->>'revision')::bigint;
    requested_attempt:=(meta->>'attempt')::int;
    IF meta->>'leaseUntil' IS NOT NULL THEN
      requested_lease:=(meta->>'leaseUntil')::timestamptz;
    END IF;
  EXCEPTION WHEN others THEN RAISE EXCEPTION 'CV04_GATEWAY_NUMBER_TIME_INVALID'; END;
  IF epoch<=0 OR (expected IS NOT NULL AND expected<0) OR
     next_revision<0 OR
     next_revision IS DISTINCT FROM COALESCE(expected+1,0) OR
     permit_time IS NULL OR
     permit_time<clock_timestamp()-interval '60 seconds' OR
     permit_time>clock_timestamp()+interval '20 seconds' OR
     resource_expires IS NULL OR
     (next_state<>'EXPIRED' AND resource_expires<=clock_timestamp()) OR
     (expected IS NULL AND
       (next_state<>'QUEUED' OR requested_op<>'dictionary.collection.export.job.request'
        OR resource_expires>clock_timestamp()+interval '16 minutes')) OR
     (expected IS NOT NULL AND
       (requested_op='dictionary.collection.export.job.request' OR
        (requested_op='dictionary.collection.export.job.worker' AND
          next_state NOT IN ('RUNNING','READY','FAILED')) OR
        (requested_op='dictionary.collection.export.job.download' AND next_state<>'READY') OR
        (requested_op='dictionary.collection.export.job.expire' AND next_state<>'EXPIRED')))
  THEN RAISE EXCEPTION 'CV04_GATEWAY_PERMIT_OR_STATE_DENIED'; END IF;

  -- Secret never returned to caller. Key and PA05-shaped operation mirror are
  -- locked until transaction commit; disabling/revoking is ordered with writes.
  SELECT secret INTO trusted_secret FROM ${s}.cv04_export_signing_keys
    WHERE key_id=signer AND enabled=true FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CV04_GATEWAY_SIGNER_UNTRUSTED'; END IF;
  IF encode(public.hmac(convert_to(p_envelope,'UTF8'),
      convert_to(trusted_secret,'UTF8'),'sha256'),'hex')<>p_signature
  THEN RAISE EXCEPTION 'CV04_GATEWAY_SIGNED_PROOF_INVALID'; END IF;
  IF encode(public.digest(convert_to(p_resource,'UTF8'),'sha256'),'hex')
       <>signed_digest
  THEN RAISE EXCEPTION 'CV04_GATEWAY_RESOURCE_DIGEST_INVALID'; END IF;

  SELECT enabled,mirror_healthy,authority_epoch,lease_until
  INTO permitted,healthy,trusted_epoch,policy_until
  FROM ${s}.cv04_export_authority WHERE
    context_id=scope_context AND enterprise_id=scope_enterprise AND
    principal_subject_id=subject AND actor_type=actor AND
    operation_id=requested_op
  FOR SHARE;
  IF NOT FOUND OR permitted IS DISTINCT FROM true OR
      healthy IS DISTINCT FROM true OR trusted_epoch IS DISTINCT FROM epoch OR
      policy_until IS NULL OR policy_until<=clock_timestamp()
  THEN RAISE EXCEPTION 'CV04_GATEWAY_OPERATION_REVOKED_OR_UNMIRRORED'; END IF;
  -- A valid operation-specific mirror must ALSO match the shared principal
  -- generation. Lock held through CAS/audit commit orders concurrent revoke.
  SELECT enabled,mirror_healthy,authority_epoch,lease_until
    INTO principal_enabled,principal_healthy,principal_epoch,principal_until
    FROM ${s}.cv04_export_principal_fence
    WHERE context_id=scope_context AND enterprise_id=scope_enterprise
      AND principal_subject_id=subject AND actor_type=actor FOR SHARE;
  IF NOT FOUND OR principal_enabled IS DISTINCT FROM true OR
     principal_healthy IS DISTINCT FROM true OR
     principal_epoch IS DISTINCT FROM epoch OR
     principal_until IS NULL OR principal_until<=clock_timestamp()
  THEN RAISE EXCEPTION 'CV04_GATEWAY_PRINCIPAL_EPOCH_FENCED'; END IF;
${workerFence}
  INSERT INTO ${s}.cv04_export_used_proofs(
    key_id,nonce,context_id,resource_id
  ) VALUES(signer,e->>'nonce',scope_context,id);

  SELECT revision,resource INTO prior FROM ${s}.resources
  WHERE context_id=scope_context AND namespace='evo.dictionary.export-jobs'
    AND collection_id='bounded-csv-jobs' AND
    resource_type='evo.dictionary.export.job' AND resource_id=id
  FOR UPDATE;

  IF expected IS NULL THEN
    IF FOUND THEN RAISE EXCEPTION 'ENTERPRISE_RESOURCE_REVISION_CONFLICT'; END IF;
    IF doc->>'createdBySubjectId' IS DISTINCT FROM subject OR
       doc->>'createdAt' IS DISTINCT FROM doc->>'updatedAt' OR
       meta->>'state' IS DISTINCT FROM 'QUEUED'
    THEN RAISE EXCEPTION 'CV04_GATEWAY_CREATE_BINDING_DENIED'; END IF;
    INSERT INTO ${s}.resources(
      context_id,namespace,collection_id,resource_type,resource_id,revision,resource
    ) VALUES(scope_context,'evo.dictionary.export-jobs','bounded-csv-jobs',
      'evo.dictionary.export.job',id,0,doc);
  ELSE
    IF NOT FOUND OR prior.revision<>expected THEN
      RAISE EXCEPTION 'ENTERPRISE_RESOURCE_REVISION_CONFLICT';
    END IF;
    IF prior.resource->>'createdBySubjectId' IS DISTINCT FROM subject OR
       doc->>'createdAt' IS DISTINCT FROM prior.resource->>'createdAt' OR
       doc->>'createdBySubjectId' IS DISTINCT FROM prior.resource->>'createdBySubjectId' OR
       meta->>'requestDigest' IS DISTINCT FROM
         prior.resource->'payload'->'meta'->>'requestDigest' OR
       meta->>'snapshotId' IS DISTINCT FROM
         prior.resource->'payload'->'meta'->>'snapshotId' OR
       meta->>'expiresAt' IS DISTINCT FROM
         prior.resource->'payload'->'meta'->>'expiresAt'
    THEN RAISE EXCEPTION 'CV04_GATEWAY_IMMUTABLE_JOB_BINDING_DENIED'; END IF;
    prior_meta:=prior.resource->'payload'->'meta';
    prior_state:=prior_meta->>'state';
    BEGIN
      previous_attempt:=(prior_meta->>'attempt')::int;
      IF prior_meta->>'leaseUntil' IS NOT NULL THEN
        previous_lease:=(prior_meta->>'leaseUntil')::timestamptz;
      END IF;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'CV04_GATEWAY_PRIOR_LEASE_INVALID';
    END;
    latest_event_type:=meta->'audit'->-1->>'type';
    IF requested_attempt<previous_attempt OR
       requested_attempt>2 OR
       meta->>'rowCount' IS DISTINCT FROM prior_meta->>'rowCount' OR
       meta->>'createdAt' IS DISTINCT FROM prior_meta->>'createdAt' OR
       jsonb_array_length(meta->'audit')<=jsonb_array_length(prior_meta->'audit')
    THEN RAISE EXCEPTION 'CV04_GATEWAY_JOB_TRANSITION_DENIED'; END IF;

    -- The Domain Owner.run() appends intermediate audit events under CAS.
    -- A continuation may NOT refresh the prior lease, increment the attempt,
    -- or append multiple events with one signed proof.
    IF next_state='RUNNING' AND prior_state='RUNNING'
       AND requested_attempt=previous_attempt THEN
      IF requested_op<>'dictionary.collection.export.job.worker' OR
         previous_lease IS NULL OR previous_lease<=clock_timestamp() OR
         requested_lease IS DISTINCT FROM previous_lease OR
         requested_attempt<1 OR requested_attempt>2 OR
         (latest_event_type IS NULL OR
          latest_event_type NOT IN ('STARTED','COMPLETED','REJECTED')) OR
         jsonb_array_length(meta->'audit')<>jsonb_array_length(prior_meta->'audit')+1
${auditFence}
      THEN RAISE EXCEPTION 'CV04_GATEWAY_RUNNING_AUDIT_FENCED'; END IF;
    ELSIF next_state='RUNNING' THEN
      IF requested_op<>'dictionary.collection.export.job.worker' OR
         requested_lease IS NULL OR
         requested_lease<=clock_timestamp() OR
         requested_lease>clock_timestamp()+interval '15 seconds' OR
         requested_attempt<>previous_attempt+1
${startedFence} OR
         NOT (prior_state='QUEUED' OR
           (prior_state='RUNNING' AND previous_lease<=clock_timestamp()))
         OR latest_event_type<>'STARTED'
      THEN RAISE EXCEPTION 'CV04_GATEWAY_WORKER_LEASE_DENIED'; END IF;
    ELSIF next_state IN ('READY','FAILED') AND
      requested_op='dictionary.collection.export.job.worker' THEN
      IF prior_state<>'RUNNING' OR previous_lease IS NULL OR
         previous_lease<=clock_timestamp() OR
         requested_attempt<>previous_attempt
${completedFence} OR
         (next_state='READY' AND latest_event_type<>'READY') OR
         (next_state='FAILED' AND latest_event_type<>'REJECTED')
      THEN RAISE EXCEPTION 'CV04_GATEWAY_STALE_WORKER_COMPLETION_DENIED'; END IF;
    ELSIF next_state='READY' AND
      requested_op='dictionary.collection.export.job.download' THEN
      IF prior_state<>'READY' OR requested_attempt<>previous_attempt OR
         latest_event_type<>'DOWNLOAD_AUTHORIZED'
      THEN RAISE EXCEPTION 'CV04_GATEWAY_DOWNLOAD_AUDIT_DENIED'; END IF;
    ELSIF next_state='EXPIRED' AND
      requested_op='dictionary.collection.export.job.expire' THEN
      IF resource_expires>clock_timestamp() OR
         prior_state='EXPIRED' OR
         requested_attempt<>previous_attempt OR
         latest_event_type<>'EXPIRED'
      THEN RAISE EXCEPTION 'CV04_GATEWAY_PREMATURE_EXPIRY_DENIED'; END IF;
    ELSE
      RAISE EXCEPTION 'CV04_GATEWAY_JOB_TRANSITION_DENIED';
    END IF;
    UPDATE ${s}.resources SET revision=expected+1,resource=doc
      WHERE context_id=scope_context AND namespace='evo.dictionary.export-jobs'
        AND collection_id='bounded-csv-jobs' AND
        resource_type='evo.dictionary.export.job' AND resource_id=id
        AND revision=expected;
    IF NOT FOUND THEN RAISE EXCEPTION 'ENTERPRISE_RESOURCE_REVISION_CONFLICT'; END IF;
  END IF;
  -- Existing CV04 BEFORE INSERT/UPDATE audit trigger appends the independent
  -- metadata ledger IN THIS SAME TRANSACTION. Audit failure rolls back nonce,
  -- resource revision and all new audit events atomically.
  RETURN jsonb_build_object('committed',true,'jobId',id,
    'revision',next_revision,'state',next_state,'authorityEpoch',epoch);
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'CV04_GATEWAY_REPLAY_OR_CONFLICT';
END;
$cv04_signed_put$;
REVOKE ALL ON FUNCTION ${s}.cv04_export_signed_put(text,text,text) FROM PUBLIC;
${scopedReadSql}
`;
}
