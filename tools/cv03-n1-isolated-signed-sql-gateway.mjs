/**
 * CV-03 N1-02: ISOLATED PostgreSQL 18 SQL-enforced signed write gateway.
 *
 * This builder does not execute DDL. It returns a privileged, explicit test
 * migration; only the isolated PG CI fixture executes it. Never install it
 * into a live Host, production schema or managed runtime automatically.
 *
 * A NOLOGIN owner holds the tables/function/key vault. The SQL runtime gets
 * EXECUTE only, no DML and no access to the secret. SQL independently verifies
 * the existing Host HMAC proof (same canonical envelope bytes) and binds the
 * exact canonical resource input digest before committing resource + receipt.
 *
 * This POC does not implement the full read API or all production migrations,
 * key rotation, TTL/revocation race and real principal identity attestations.
 */
export function cv03N1GatewaySqlV010(schema){
  if(typeof schema!=="string"||!/^cv03_[a-z0-9_]{1,58}$/.test(schema))
    throw Error("CV03_N1_ISOLATED_SCHEMA_REQUIRED");
  const s='"'+schema+'"';
  return `
CREATE TABLE ${s}.cv03_n1_signing_keys (
 key_id text PRIMARY KEY, secret text NOT NULL, enabled boolean NOT NULL DEFAULT true
);
REVOKE ALL ON TABLE ${s}.cv03_n1_signing_keys FROM PUBLIC;
CREATE FUNCTION ${s}.cv03_n1_signed_save(p_input text, p_envelope text, p_signature text,
  p_resource text, p_completed text, p_approval text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $cv03_n1$
DECLARE
 i jsonb;
 envelope jsonb;
 a jsonb;
 k text;
 id text;
 ctx text;
 keyhash text;
 digest_input text;
 prior record;
 old_receipt record;
 revision_next bigint;
 expected bigint;
 doc jsonb;
 completed jsonb;
 scope_namespace text;
 scope_collection text;
 scope_type text;
 scope_resource text;
BEGIN
 IF length(p_input)>16384 OR length(p_envelope)>8192 OR
    length(p_resource)>16384 OR length(p_completed)>16384 OR
    length(p_approval)>8192 OR
    p_signature !~ '^[a-f0-9]{64}$' THEN
   RAISE EXCEPTION 'CV03_N1_SIGNED_GATEWAY_INPUT_INVALID';
 END IF;
 i := p_input::jsonb;
 envelope := p_envelope::jsonb;
 a := envelope->'receipt';
 id := envelope->>'keyId';
 ctx := i->>'contextId';
 scope_namespace := i->>'namespace';
 scope_collection := i->>'collectionId';
 scope_type := i->>'resourceType';
 scope_resource := i->>'resourceId';
 IF envelope->>'domain' IS DISTINCT FROM
      'cv03.enterprise-resource.host-write/0.1.0' OR
    id IS NULL OR id !~ '^[a-zA-Z0-9_-]{1,48}$' OR
    a IS NULL OR jsonb_typeof(a)<>'object' OR
    a->>'inputDigest' IS NULL OR
    a->>'sourceActionId' IS DISTINCT FROM 'collection.saved-view.personal.save' OR
    a->>'toolId' IS DISTINCT FROM 'collection.saved-view.personal.save' OR
    a->>'ownerPackageId' IS DISTINCT FROM 'host-enterprise-context-provider' OR
    a->>'principalActorType' NOT IN ('HUMAN','AI') OR
    a->'context'->>'kind' IS DISTINCT FROM 'ENTERPRISE' OR
    a->'context'->>'contextId' IS DISTINCT FROM ctx OR
    a->>'principalSubjectId' IS DISTINCT FROM i->>'actorSubjectId' OR
    i->>'ownerPackageId' IS DISTINCT FROM 'host-enterprise-context-provider' OR
    i->>'resourceType' IS DISTINCT FROM 'saved-collection-view' OR
    scope_namespace NOT LIKE 'evo.saved-view.personal.%' OR
    scope_collection IS NULL OR length(scope_collection)=0 OR
    scope_resource IS NULL OR length(scope_resource)=0 OR
    ctx IS NULL OR length(ctx)=0 OR
    i->>'schemaRef' IS NULL OR
    i->>'recordedAt' IS DISTINCT FROM a->>'requestedAt' OR
    jsonb_typeof(i->'payload') IS DISTINCT FROM 'object' OR
    i->'payload'->>'ownerSubjectId' IS DISTINCT FROM a->>'principalSubjectId' OR
    i->'payload'->>'enterpriseId' IS DISTINCT FROM a->'context'->>'enterpriseId' OR
    a->>'receiptId' IS NULL OR a->>'idempotencyKey' IS NULL OR
    a->>'invocationId' IS NULL OR a->>'sourceInteractionId' IS NULL OR
    a->>'inputDigest' !~ '^[a-f0-9]{64}$'
 THEN
   RAISE EXCEPTION 'CV03_N1_GATEWAY_BINDING_DENIED';
 END IF;
 SELECT secret INTO k FROM ${s}.cv03_n1_signing_keys
    WHERE key_id=id AND enabled=true;
 IF k IS NULL THEN RAISE EXCEPTION 'CV03_N1_SIGNER_NOT_TRUSTED'; END IF;
 IF encode(public.hmac(convert_to(p_envelope,'UTF8'),
       convert_to(k,'UTF8'),'sha256'),'hex')<>p_signature
 THEN RAISE EXCEPTION 'CV03_N1_SIGNED_PROOF_INVALID'; END IF;
 IF p_approval::jsonb IS DISTINCT FROM a THEN
   RAISE EXCEPTION 'CV03_N1_APPROVAL_CANONICAL_MISMATCH';
 END IF;
 digest_input:=encode(public.digest(convert_to(p_input,'UTF8'),'sha256'),'hex');
 IF digest_input<>a->>'inputDigest'
 THEN RAISE EXCEPTION 'CV03_N1_EXACT_INPUT_DIGEST_DENIED'; END IF;
 -- Same idempotency key semantics as sha256ResourceReceiptV010(ASCII id).
 keyhash:=encode(public.digest(convert_to(
     to_json(a->>'idempotencyKey')::text,'UTF8'),'sha256'),'hex');
 PERFORM pg_advisory_xact_lock(hashtextextended(ctx||'|'||keyhash,0));
 SELECT receipt,resource,input_digest,approval_digest INTO old_receipt
 FROM ${s}.cv03_resource_receipts
 WHERE context_id=ctx AND idempotency_hash=keyhash;
 IF FOUND THEN
   IF old_receipt.input_digest IS DISTINCT FROM a->>'inputDigest' OR
     old_receipt.receipt->>'receiptId' IS DISTINCT FROM a->>'receiptId' OR
     old_receipt.approval_digest IS DISTINCT FROM
       encode(public.digest(convert_to(p_approval,'UTF8'),'sha256'),'hex') OR
     old_receipt.receipt->>'principalSubjectId' IS DISTINCT FROM a->>'principalSubjectId'
   THEN RAISE EXCEPTION 'CV03_N1_IDEMPOTENCY_CONFLICT'; END IF;
   RETURN jsonb_build_object('resource',old_receipt.resource,
     'receipt',old_receipt.receipt,'replayed',true);
 END IF;
 IF i->'expectedRevision' IS NULL OR i->'expectedRevision'='null'::jsonb THEN
   expected:=NULL;
 ELSE
   IF jsonb_typeof(i->'expectedRevision')<>'number'
   THEN RAISE EXCEPTION 'CV03_N1_REVISION_INVALID'; END IF;
   expected:=(i->>'expectedRevision')::bigint;
   IF expected<0 THEN RAISE EXCEPTION 'CV03_N1_REVISION_INVALID'; END IF;
 END IF;
 SELECT revision,resource INTO prior
 FROM ${s}.resources
 WHERE context_id=ctx AND namespace=scope_namespace
   AND collection_id=scope_collection AND resource_type=scope_type
   AND resource_id=scope_resource
 FOR UPDATE;
 IF expected IS NULL THEN
   IF FOUND THEN RAISE EXCEPTION 'ENTERPRISE_RESOURCE_REVISION_CONFLICT'; END IF;
   revision_next:=0;
 ELSE
   IF NOT FOUND OR prior.revision<>expected THEN
     RAISE EXCEPTION 'ENTERPRISE_RESOURCE_REVISION_CONFLICT';
   END IF;
   IF prior.resource->>'lifecycleState'='ARCHIVED' THEN
     RAISE EXCEPTION 'ENTERPRISE_RESOURCE_ALREADY_ARCHIVED';
   END IF;
   revision_next:=expected+1;
 END IF;
 doc:=jsonb_build_object(
   'contractVersion','0.1.0','contextId',ctx,
   'namespace',scope_namespace,'collectionId',scope_collection,
   'resourceType',scope_type,'resourceId',scope_resource,
   'schemaRef',i->>'schemaRef',
   'ownerPackageId','host-enterprise-context-provider',
   'storageKind','DOCUMENT','payload',i->'payload',
   'lifecycleState','ACTIVE','revision',revision_next,
   'createdAt',CASE WHEN expected IS NULL THEN i->>'recordedAt'
     ELSE prior.resource->>'createdAt' END,
   'createdBySubjectId',CASE WHEN expected IS NULL THEN i->>'actorSubjectId'
     ELSE prior.resource->>'createdBySubjectId' END,
   'updatedAt',i->>'recordedAt',
   'updatedBySubjectId',i->>'actorSubjectId'
 );
 IF p_resource::jsonb IS DISTINCT FROM doc THEN
   RAISE EXCEPTION 'CV03_N1_RESOURCE_CANONICAL_MISMATCH';
 END IF;
 IF expected IS NULL THEN
   INSERT INTO ${s}.resources
     (context_id,namespace,collection_id,resource_type,resource_id,
       revision,resource)
   VALUES(ctx,scope_namespace,scope_collection,scope_type,scope_resource,
      revision_next,doc);
 ELSE
   UPDATE ${s}.resources SET revision=revision_next,resource=doc
   WHERE context_id=ctx AND namespace=scope_namespace
      AND collection_id=scope_collection AND resource_type=scope_type
      AND resource_id=scope_resource AND revision=expected;
   IF NOT FOUND THEN
     RAISE EXCEPTION 'ENTERPRISE_RESOURCE_REVISION_CONFLICT';
   END IF;
 END IF;
 completed:=a||jsonb_build_object(
   'contractVersion','0.1.0','effect','WRITE','status','SUCCEEDED',
   'completedAt',i->>'recordedAt',
   'resultDigest',encode(public.digest(convert_to(p_resource,'UTF8'),'sha256'),'hex'),
   'resultEntityRefs',jsonb_build_array('enterprise-resource:'||scope_resource),
   'resultSummary','Saved view resource and immutable receipt committed atomically',
   'latestEventId','cv03-resource-commit:'||(a->>'receiptId')
 );
 IF p_completed::jsonb IS DISTINCT FROM completed THEN
   RAISE EXCEPTION 'CV03_N1_RECEIPT_CANONICAL_MISMATCH';
 END IF;
 INSERT INTO ${s}.cv03_resource_receipts
   (context_id,idempotency_hash,receipt_id,approval_digest,
      input_digest,receipt_digest,receipt,resource)
 VALUES(ctx,keyhash,a->>'receiptId',
   encode(public.digest(convert_to(p_approval,'UTF8'),'sha256'),'hex'),
   a->>'inputDigest',
   encode(public.digest(convert_to(p_completed,'UTF8'),'sha256'),'hex'),
   completed,doc);
 RETURN jsonb_build_object('resource',doc,'receipt',completed,'replayed',false);
END;
$cv03_n1$;
`;
}
