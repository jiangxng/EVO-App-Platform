/**
 * N1-04c: test-only, DB-authenticated PA05-shaped event delivery.
 * This is NOT a live PA05 producer, a migration, or a production KMS key.
 * Only CI / a separately approved isolated security fixture executes DDL.
 * Real Feature/Principal authorization and event transport remain missing.
 */
import {createHmac} from "node:crypto";
import {stableResourceReceiptJsonV010}
  from "../dist/providers/enterprise-context/resource-receipt-digest.js";

const DOMAIN="cv03.pa05-owner-event.isolated/0.1.0";
export function cv03N104cTestEventProofV010(event,keyId,secret) {
  if(!/^[a-zA-Z0-9_-]{1,48}$/.test(keyId)||
     Buffer.byteLength(secret??"","utf8")<32)
    throw Error("CV03_N104C_TEST_SIGNER_INVALID");
  const canonical=stableResourceReceiptJsonV010({
    domain:DOMAIN,keyId,event
  });
  return {envelope:canonical,signature:createHmac("sha256",secret)
    .update(canonical).digest("hex")};
}
export function cv03N104cIsolatedAuthorityBridgeSqlV010(schema){
  if(typeof schema!=="string"||!/^cv03_[a-z0-9_]{1,58}$/.test(schema))
    throw Error("CV03_N1_ISOLATED_SCHEMA_REQUIRED");
  const s='"'+schema+'"';
  return `
CREATE TABLE ${s}.cv03_n104c_event_keys (
 key_id text PRIMARY KEY, secret text NOT NULL, enabled boolean NOT NULL DEFAULT true
);
REVOKE ALL ON TABLE ${s}.cv03_n104c_event_keys FROM PUBLIC;
CREATE FUNCTION ${s}.cv03_n104c_ingest_signed_event(
 p_envelope text,p_signature text
)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $cv03_n104c$
DECLARE
 envelope jsonb;
 ev jsonb;
 key_name text;
 secret_key text;
 signed_at timestamptz;
 event_epoch bigint;
 applied text;
 ctx text;
 subject text;
 operation text;
BEGIN
 IF p_envelope IS NULL OR length(p_envelope)>8192 OR
    p_signature IS NULL OR p_signature !~ '^[a-f0-9]{64}$' THEN
   RAISE EXCEPTION 'CV03_N104C_EVENT_INVALID';
 END IF;
 envelope:=p_envelope::jsonb;
 ev:=envelope->'event';
 key_name:=envelope->>'keyId';
 ctx:=ev->>'contextId';
 subject:=ev->>'principalSubjectId';
 operation:=ev->>'operationId';
 IF envelope->>'domain' IS DISTINCT FROM
      'cv03.pa05-owner-event.isolated/0.1.0' OR
    key_name IS NULL OR key_name !~ '^[a-zA-Z0-9_-]{1,48}$' OR
    jsonb_typeof(ev) IS DISTINCT FROM 'object' OR
    ev->>'source' IS DISTINCT FROM 'PA05_OWNER_TEST_ONLY' OR
    operation IS DISTINCT FROM 'collection.saved-view.personal.save' OR
    ctx IS NULL OR length(ctx)=0 OR length(ctx)>160 OR
    subject IS NULL OR length(subject)=0 OR length(subject)>160 OR
     ev->>'evaluatedActorType' IS NULL OR
     ev->>'evaluatedActorType' NOT IN ('HUMAN','AI') OR
    ev->>'enabled' NOT IN ('true','false') OR
    jsonb_typeof(ev->'enabled') IS DISTINCT FROM 'boolean' OR
    (ev->>'authorityEpoch') IS NULL OR
    (ev->>'authorityEpoch') !~ '^[1-9][0-9]{0,17}$' OR
    jsonb_typeof(ev->'authorityEpoch') IS DISTINCT FROM 'number' OR
    ev->>'issuedAt' IS NULL THEN
   RAISE EXCEPTION 'CV03_N104C_EVENT_INVALID';
 END IF;
 BEGIN
   event_epoch:=(ev->>'authorityEpoch')::bigint;
   signed_at:=(ev->>'issuedAt')::timestamptz;
 EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow
       OR numeric_value_out_of_range THEN
   RAISE EXCEPTION 'CV03_N104C_EVENT_INVALID';
 END;
 SELECT secret INTO secret_key FROM ${s}.cv03_n104c_event_keys
 WHERE key_id=key_name AND enabled=true FOR SHARE;
 IF secret_key IS NULL THEN
   RAISE EXCEPTION 'CV03_N104C_EVENT_KEY_INACTIVE';
 END IF;
 IF encode(public.hmac(convert_to(p_envelope,'UTF8'),
      convert_to(secret_key,'UTF8'),'sha256'),'hex')<>p_signature THEN
   RAISE EXCEPTION 'CV03_N104C_EVENT_SIGNATURE_INVALID';
 END IF;
 IF signed_at IS NULL OR
    signed_at<clock_timestamp()-interval '90 seconds' OR
    signed_at>clock_timestamp()+interval '30 seconds' THEN
   RAISE EXCEPTION 'CV03_N104C_EVENT_EXPIRED';
 END IF;
 -- Owner-only applicator preserves monotonic epoch, duplicate rejection,
 -- gap poisoning, and write-policy row locks. All updates are atomic.
 applied:=${s}.cv03_n1_apply_owner_policy_epoch(
   ctx,subject,ev->>'evaluatedActorType',operation,event_epoch,
    (ev->>'enabled')::boolean
 );
 IF applied='STALE_IGNORED' THEN RETURN applied; END IF;
 UPDATE ${s}.cv03_n1_operation_policy
   SET delivery_required=true,
       lease_until=CASE WHEN mirror_healthy AND enabled
         THEN clock_timestamp()+interval '90 seconds'
         ELSE NULL END
 WHERE context_id=ctx AND principal_subject_id=subject
   AND actor_type=ev->>'evaluatedActorType'
   AND operation_id=operation;
 RETURN applied;
END;
$cv03_n104c$;
REVOKE ALL ON FUNCTION ${s}.cv03_n104c_ingest_signed_event(
 text,text) FROM PUBLIC;
`;
}
