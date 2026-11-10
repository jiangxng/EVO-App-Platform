/**
 * CV-03 N1-04g isolated PG18 proof only.
 *
 * Reuses the existing N1-04c signed event verifier, but NEVER allows its
 * delivery SQL login to call that verifier directly. This privileged gate
 * first checks the exact event against COMMITTED N1-04f test authority state
 * and outbox within the same SQL transaction. It is NOT a production PA05
 * authority source, signer, tenant identity mapper or migration.
 */
export function cv03N104gIsolatedOutboxBoundDeliverySqlV010(schema){
  if(typeof schema!=="string"||!/^cv03_[a-z0-9_]{1,58}$/.test(schema))
    throw Error("CV03_N1_ISOLATED_SCHEMA_REQUIRED");
  const s='"'+schema+'"';
  return `
CREATE FUNCTION ${s}.cv03_n104g_ingest_committed_authority(
  p_envelope text,p_signature text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $cv03_n104g$
DECLARE
 envelope jsonb;
 ev jsonb;
 authority record;
 persisted jsonb;
 event_epoch bigint;
 signer_key text;
 ctx text;
 subject text;
 actor text;
 op text;
BEGIN
 IF p_envelope IS NULL OR length(p_envelope)>8192
    OR p_signature IS NULL OR p_signature !~ '^[a-f0-9]{64}$' THEN
   RAISE EXCEPTION 'CV03_N104G_ENVELOPE_INVALID';
 END IF;
 envelope:=p_envelope::jsonb;
 ev:=envelope->'event';
 IF envelope->>'domain' IS DISTINCT FROM
      'cv03.pa05-owner-event.isolated/0.1.0'
    OR jsonb_typeof(ev) IS DISTINCT FROM 'object'
    OR ev->>'source' IS DISTINCT FROM 'PA05_OWNER_TEST_ONLY'
    OR ev->>'generation' IS NULL
    OR ev->>'generation' NOT IN ('CI_GENERATION_1','CI_GENERATION_2')
    OR ev->>'operationId' IS DISTINCT FROM 'collection.saved-view.personal.save'
    OR ev->>'evaluatedActorType' NOT IN ('HUMAN','AI')
    OR ev->>'evaluatedActorType' IS NULL
    OR ev->>'enterpriseId' IS NULL
    OR ev->>'contextId' IS DISTINCT FROM
      'enterprise-context:'||(ev->>'enterpriseId')
    OR ev->>'principalSubjectId' IS NULL
    OR jsonb_typeof(ev->'authorityEpoch') IS DISTINCT FROM 'number'
    OR ev->>'authorityEpoch' !~ '^[1-9][0-9]{0,16}$'
    OR jsonb_typeof(ev->'enabled') IS DISTINCT FROM 'boolean' THEN
   RAISE EXCEPTION 'CV03_N104G_ENVELOPE_INVALID';
 END IF;
 -- Cryptographically authenticate even obsolete events: otherwise a forged
 -- stale envelope could receive a successful delivery ACK without a MAC.
 IF envelope->>'keyId' IS NULL
    OR envelope->>'keyId' !~ '^[a-zA-Z0-9_-]{1,48}$' THEN
   RAISE EXCEPTION 'CV03_N104G_SIGNER_DENIED';
 END IF;
 SELECT secret INTO signer_key
 FROM ${s}.cv03_n104c_event_keys
 WHERE key_id=envelope->>'keyId' AND enabled=true FOR SHARE;
 IF signer_key IS NULL OR encode(public.hmac(convert_to(p_envelope,'UTF8'),
      convert_to(signer_key,'UTF8'),'sha256'),'hex')<>p_signature THEN
   RAISE EXCEPTION 'CV03_N104G_SIGNER_DENIED';
 END IF;
 ctx:=ev->>'contextId';
 subject:=ev->>'principalSubjectId';
 actor:=ev->>'evaluatedActorType';
 op:=ev->>'operationId';
 event_epoch:=(ev->>'authorityEpoch')::bigint;
 -- Lock the authoritative row. Concurrent owner revocation/update must wait
 -- until verification+mirror commit; a subsequent call observes the new epoch.
 SELECT enterprise_id,generation,authority_epoch,enabled
 INTO authority
 FROM ${s}.cv03_n104f_test_authority_state
 WHERE context_id=ctx AND principal_subject_id=subject
   AND actor_type=actor AND operation_id=op FOR SHARE;
 IF NOT FOUND THEN
   RAISE EXCEPTION 'CV03_N104G_UNCOMMITTED_AUTHORITY_DENIED';
 END IF;
 SELECT event_json::jsonb INTO persisted
 FROM ${s}.cv03_n104f_test_authority_outbox
 WHERE context_id=ctx AND principal_subject_id=subject
   AND actor_type=actor AND operation_id=op
   AND authority_epoch=event_epoch FOR SHARE;
 IF NOT FOUND OR persisted IS DISTINCT FROM ev
    OR authority.enterprise_id IS DISTINCT FROM ev->>'enterpriseId'
    OR authority.generation IS DISTINCT FROM ev->>'generation' THEN
   RAISE EXCEPTION 'CV03_N104G_OUTBOX_OR_SCOPE_MISMATCH';
 END IF;
 -- An event can be genuinely committed but already superseded by a newer
 -- authority transaction. It MUST NOT renew or re-enable an old ALLOW.
 IF authority.authority_epoch>event_epoch THEN
   RETURN 'SUPERSEDED_NO_EFFECT';
 END IF;
 IF authority.authority_epoch IS DISTINCT FROM event_epoch OR
    authority.enabled IS DISTINCT FROM (ev->>'enabled')::boolean THEN
   RAISE EXCEPTION 'CV03_N104G_AUTHORITY_MISMATCH';
 END IF;
 -- The original N1-04c verifies key state, HMAC, time window, epoch and
 -- delivery lease; none of those checks are replaced by this wrapper.
 RETURN ${s}.cv03_n104c_ingest_signed_event(p_envelope,p_signature);
END;
$cv03_n104g$;
REVOKE ALL ON FUNCTION ${s}.cv03_n104g_ingest_committed_authority(
 text,text) FROM PUBLIC;
`;
}
