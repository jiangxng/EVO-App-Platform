import type {AppActionRequestV010} from "../actions/contracts.js";
import type {EnterpriseResourceConditionalPutInputV010,
  EnterpriseResourceSignedHostReceiptV010} from "../contracts/enterprise-resource.js";
import type {AuthorizationProviderV010,PlatformRequestContextV010}
  from "../contracts/platform-services.js";
import type {AppManagerService} from "./service.js";
import {checkCapabilityOperationActionV010} from "./capability-operation-access.js";
import {
  digestConditionalResourcePutV010,
  hmacCv03HostResourceReceiptV010,
  sha256ResourceReceiptV010
} from "../providers/enterprise-context/resource-receipt-digest.js";

/**
 * Host-only C3-02 adapter: bind the CURRENT authorized Platform Capability
 * Operation, resolved Principal/Enterprise and exact Resource input into a
 * domain-separated signed Agent Action Receipt. This is NOT an API endpoint,
 * not a new Agent tool, and not registered by the production Host.
 *
 * The PostgreSQL Resource Owner independently validates this proof before it
 * commits a resource + immutable receipt in the same transaction.
 */
export function createCv03PersonalSavedViewHostReceiptIssuerV010(input:{
  manager:AppManagerService;
  resolveAuthorizationProvider():AuthorizationProviderV010|undefined;
  signingKeyId:string;
  signingSecret:string;
}):(
  ctx:PlatformRequestContextV010,
  request:AppActionRequestV010,
  material:{input:EnterpriseResourceConditionalPutInputV010;inputDigest:string}
)=>Promise<EnterpriseResourceSignedHostReceiptV010> {
  return async (ctx,request,material)=>{
    const active=ctx?.context?.activeContext;
    const operationId="collection.saved-view.personal.save";
    if(!ctx || ctx.delegatedActor ||
      !["HUMAN","AI"].includes(ctx.principal.actorType) ||
      !ctx.principal.subjectId?.trim() ||
      !active || active.kind!=="ENTERPRISE" ||
      !active.contextId?.trim() || !active.enterpriseId?.trim() ||
      ctx.scope.enterpriseId!==active.enterpriseId ||
      (ctx.scope.userId && ctx.scope.userId!==ctx.principal.subjectId) ||
      request.contractVersion!=="0.1.0" ||
      request.type!=="command" ||
      request.command.code!==operationId ||
      request.command.inputVersion!=="0.1.0" ||
      request.actionId!==operationId ||
      !request.sourceInteractionId?.trim() ||
      !material || !material.input ||
      material.input.contextId!==active.contextId ||
      material.input.actorSubjectId!==ctx.principal.subjectId ||
      material.input.ownerPackageId!=="host-enterprise-context-provider" ||
      !(material.input.payload && typeof material.input.payload==="object" &&
        !Array.isArray(material.input.payload)) ||
      (material.input.payload as Record<string,unknown>).enterpriseId!==active.enterpriseId ||
      (material.input.payload as Record<string,unknown>).ownerSubjectId!==ctx.principal.subjectId ||
      material.inputDigest!==digestConditionalResourcePutV010(material.input)){
      throw Error("CV03_HOST_RECEIPT_CONTEXT_OR_DIGEST_INVALID");
    }
    const operation=input.manager.listEffectiveCapabilityOperations()
      .find(o=>o.operationId===operationId);
    if(!operation || operation.binding.type!=="ACTION_HOST" ||
      operation.binding.commandCode!==operationId ||
      operation.effect!=="WRITE" ||
      !operation.exposure.includes(ctx.principal.actorType==="AI"?"PERSONAL_AGENT":"HUMAN") ||
      operation.writeSafety?.idempotency!=="HOST_REQUIRED" ||
      operation.writeSafety.receipt!=="HOST_REQUIRED"){
      throw Error("CV03_HOST_RECEIPT_OPERATION_INACTIVE");
    }
    const blocked=await checkCapabilityOperationActionV010({
      manager:input.manager,
      resolveAuthorizationProvider:input.resolveAuthorizationProvider,
      request,context:ctx
    });
    if(blocked && !blocked.ok)throw Error("CV03_HOST_RECEIPT_AUTHORIZATION_DENIED");

    const idempotencyIdentity=sha256ResourceReceiptV010({
      operationId,principalSubjectId:ctx.principal.subjectId,
      principalActorType:ctx.principal.actorType,
      enterpriseId:active.enterpriseId,contextId:active.contextId,
      sourceInteractionId:request.sourceInteractionId,
      sourceActionId:request.actionId,inputDigest:material.inputDigest
    });
    const receipt={
      receiptId:"cv03-host-receipt:"+idempotencyIdentity,
      invocationId:"cv03-host-invoke:"+idempotencyIdentity,
      idempotencyKey:"cv03-host-idem:"+idempotencyIdentity,
      sourceInteractionId:request.sourceInteractionId,
      sourceActionId:request.actionId,
      principalSubjectId:ctx.principal.subjectId,
      principalActorType:ctx.principal.actorType,
      context:structuredClone(active),
      toolId:operationId,
      ownerPackageId:"host-enterprise-context-provider",
      capability:"enterprise.collection.saved-view",
      inputDigest:material.inputDigest,
      requestedAt:material.input.recordedAt
    };
    const keyId=input.signingKeyId;
    return {
      receipt,
      proof:{
        contractVersion:"0.1.0",
        purpose:"cv03.enterprise-resource.host-write",
        keyId,algorithm:"HMAC-SHA256",
        signature:hmacCv03HostResourceReceiptV010(
          receipt,keyId,input.signingSecret
        )
      }
    };
  };
}
