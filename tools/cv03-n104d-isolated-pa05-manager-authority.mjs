/**
 * N1-04d: isolated PA05 *real manager state* probe.
 *
 * This reads the existing live-in-the-fixture AppManagerService effective
 * Capability Operation and invokes the SAME Action Host pre-execute
 * authorization gate used for the genuine Host receipt issuer.
 *
 * It does NOT create a production event source, reliable outbox, PA05 lifecycle
 * subscription, session attestation or deployable event signing credential.
 * It emits PA05_OWNER_TEST_ONLY events which the isolated N1-04c PG verifier
 * accepts. Only an approved CI fixture may sign/deliver their results.
 */
import {checkCapabilityOperationActionV010}
  from "../dist/manager/capability-operation-access.js";
import {sha256ResourceReceiptV010}
  from "../dist/providers/enterprise-context/resource-receipt-digest.js";

export const CV03_N104D_OPERATION="collection.saved-view.personal.save";

function requestFor(operationId){
  return {contractVersion:"0.1.0",type:"command",
    command:{code:operationId,inputVersion:"0.1.0"},
    values:{},actionId:operationId,
    sourceInteractionId:"cv03-n104d-authority-fixture",
    requiresConfirmation:false};
}

function checkedIdentity(ctx){
  const active=ctx?.context?.activeContext;
  const subject=ctx?.principal?.subjectId;
  const actor=ctx?.principal?.actorType;
  if(!ctx || ctx.delegatedActor || !subject ||
     !["HUMAN","AI"].includes(actor) ||
     !active || active.kind!=="ENTERPRISE" ||
     typeof active.contextId!=="string" || !active.contextId.trim() ||
     typeof active.enterpriseId!=="string" || !active.enterpriseId.trim() ||
     ctx.scope?.enterpriseId!==active.enterpriseId ||
     (ctx.scope?.userId && ctx.scope.userId!==subject) ||
     (ctx.context?.personalContext?.ownerSubjectId &&
       ctx.context.personalContext.ownerSubjectId!==subject)){
    throw Error("CV03_N104D_UNTRUSTED_HOST_REQUEST_CONTEXT");
  }
  return {contextId:active.contextId,enterpriseId:active.enterpriseId,
    principalSubjectId:subject,principalActorType:actor};
}

/**
 * No user-controlled request/Feature/operation ID is accepted: the trusted
 * CI Host synthesizes the exact Action Host command and evaluates it now.
 *
 * Epoch is allocated by the isolated fixture, NOT by the real PA05
 * lifecycle. Restart cannot safely invent a new epoch. Production outbox,
 * monotonic cursor, snapshot recovery and lease-source auth remain blockers.
 */
export async function evaluateCv03N104dRealManagerAuthorityV010({
  manager,resolveAuthorizationProvider,requestContext,authorityEpoch,
  now=()=>new Date()
}){
  if(!Number.isSafeInteger(authorityEpoch)||authorityEpoch<1)
    throw Error("CV03_N104D_AUTHORITY_EPOCH_INVALID");
  if(!manager || typeof manager.listEffectiveCapabilityOperations!=="function" ||
     typeof resolveAuthorizationProvider!=="function"){
    throw Error("CV03_N104D_TRUSTED_MANAGER_REQUIRED");
  }
  const id=checkedIdentity(requestContext);
  const operationId=CV03_N104D_OPERATION;
  const request=requestFor(operationId);
  let enabled=false,reason="OPERATION_INACTIVE";
  let provenance;
  try{
    const matches=manager.listEffectiveCapabilityOperations()
      .filter(o=>o.operationId===operationId);
    if(matches.length===1){
      const o=matches[0];
      const isExpected=o.packageId==="host-enterprise-context-provider" &&
        o.featureId==="host-enterprise-context-provider.personal-saved-views" &&
        o.binding?.type==="ACTION_HOST" &&
        o.binding?.commandCode===operationId &&
        o.binding?.inputVersion==="0.1.0" &&
        o.effect==="WRITE" && o.dataScope==="ENTERPRISE" &&
        o.authorization?.action==="collection.saved-view.write" &&
        o.writeSafety?.idempotency==="HOST_REQUIRED" &&
        o.writeSafety?.receipt==="HOST_REQUIRED" &&
        o.exposure?.includes(id.principalActorType==="HUMAN"?
          "HUMAN":"PERSONAL_AGENT");
      if(isExpected){
        const blocked=await checkCapabilityOperationActionV010({
          manager,resolveAuthorizationProvider,request,
          context:requestContext
        });
        // A missing pre-execute gate is NOT sufficient proof of authorization;
        // only an exact active operation matched above can be enabled.
        enabled=blocked===undefined;
        reason=enabled?"AUTHORIZED_BY_MANAGER_AND_PROVIDER":
          "DENIED_BY_CAPABILITY_OPERATION_AUTHORITY";
        provenance={packageId:o.packageId,featureId:o.featureId,
          operationVersion:o.operationVersion};
      }else reason="OPERATION_BINDING_OR_EXPOSURE_INVALID";
    }else if(matches.length>1)reason="OPERATION_BINDING_CONFLICT";
  }catch{
    // Never turn manager/provider errors into positive authorization.
    enabled=false;reason="AUTHORITY_QUERY_FAILED";
  }
  const issuedAt=now();
  if(!(issuedAt instanceof Date) || !Number.isFinite(issuedAt.getTime()))
    throw Error("CV03_N104D_AUTHORITY_CLOCK_INVALID");
  const event={
    source:"PA05_OWNER_TEST_ONLY",
    contextId:id.contextId,
    principalSubjectId:id.principalSubjectId,
    operationId,authorityEpoch,enabled,
    issuedAt:issuedAt.toISOString(),
    // Explicitly audit the actual actor exposure used during this *probe*.
    // SQL mirror is NOT actor-scoped yet: never claim full Human/AI separation.
    evaluatedActorType:id.principalActorType,
    producerEvidenceDigest:sha256ResourceReceiptV010({
      operationId,contextId:id.contextId,enterpriseId:id.enterpriseId,
      principalSubjectId:id.principalSubjectId,
      principalActorType:id.principalActorType,enabled,reason,
      ...(provenance?{provenance}:{})
    })
  };
  return {event,authorized:enabled,reason,
    producer:"REAL_PA05_MANAGER_ISOLATED_PROBE_ONLY"};
}


/**
 * CI-only durable queue. The test Host must enqueue its evaluated event in
 * this isolated table before issuing a DB-delivery call. Restart can replay
 * any unacknowledged signed envelope; DB monotonic epochs make replay safe.
 *
 * NOT atomic with PA05's actual lifecycle store / authorization mutations.
 * A production implementation needs a transactional owner outbox with a
 * proven source-of-truth cursor, not just this isolated queue.
 */
export function cv03N104dIsolatedOwnerOutboxSqlV010(schema){
  if(typeof schema!=="string"||!/^cv03_[a-z0-9_]{1,58}$/.test(schema))
    throw Error("CV03_N1_ISOLATED_SCHEMA_REQUIRED");
  const s='"'+schema+'"';
  return `
CREATE TABLE ${s}.cv03_n104d_test_owner_outbox (
 context_id text NOT NULL,
 principal_subject_id text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('HUMAN','AI')),
 operation_id text NOT NULL,
 authority_epoch bigint NOT NULL CHECK (authority_epoch>=1),
 event_json text NOT NULL,
 signed_envelope text NOT NULL,
 signature text NOT NULL CHECK (signature ~ '^[a-f0-9]{64}$'),
 acked boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(context_id,principal_subject_id,actor_type,operation_id,authority_epoch)
);
REVOKE ALL ON TABLE ${s}.cv03_n104d_test_owner_outbox FROM PUBLIC;
`;
}
