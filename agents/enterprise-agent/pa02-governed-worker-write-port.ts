import {createHash} from "node:crypto";
import type {AgentRunV010,AgentRunDecisionRecordV010} from "../../contracts/agent-run.js";
import type {AgentToolDescriptorV010} from "./contracts.js";
import type {HostResolvedAgentDurabilityScopeV020} from "../../contracts/agent-durability-async.js";
import type {PlatformPrincipalV010,ResolvedContextSetV010,PlatformRequestContextV010}
  from "../../contracts/platform-services.js";
import type {AgentLeaseV020,AgentExecutionCoordinatorV020} from "./pa02b-postgres-coordination.js";
import type {FencedAgentRunAuthorityV030} from "./pa02b-fenced-run-authority.js";
import type {GovernedAgentWriteHandoffV040} from "./pa02b-governed-owner-write-handoff.js";
import type {AgentWriteReconciliationPortV030} from "./pa02b-owner-reconciliation.js";

function stable(v:unknown):unknown {
  if(Array.isArray(v))return v.map(stable);
  if(v!==null&&typeof v==="object")
    return Object.fromEntries(Object.entries(v as Record<string,unknown>)
      .sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,stable(x)]));
  return v;
}
function hash(v:unknown):string {
  return createHash("sha256").update(JSON.stringify(stable(v))).digest("hex");
}
export interface GovernedAgentWorkerWritePortV040 {
  /** Host owns the static registration, never the model. */
  allows(descriptor:AgentToolDescriptorV010):boolean;
  execute(input:{
    scope:HostResolvedAgentDurabilityScopeV020;
    lease:AgentLeaseV020;
    run:AgentRunV010;
    decision:AgentRunDecisionRecordV010;
    descriptor:AgentToolDescriptorV010;
    principal:PlatformPrincipalV010;
    context:ResolvedContextSetV010;
    requestContext?:PlatformRequestContextV010;
  }):Promise<{status:"UNKNOWN"|"SUCCEEDED"|"FAILED"|"DENIED";receiptId:string;reconciled:boolean}>;
}

/**
 * One exact trusted business Owner registration. This is deliberately *not*
 * an arbitrary model-provided Tool/Owner resolver or a new authorization
 * provider. The existing Host Authorization Provider must recheck this
 * Principal/Context/Tool before a material effect, even on retries.
 */
export function createGovernedAgentWorkerWritePortV040(deps:{
  toolId:string;
  ownerPackageId:string;
  authorize(input:{
    descriptor:AgentToolDescriptorV010;
    principal:PlatformPrincipalV010;
    context:ResolvedContextSetV010;
    requestContext?:PlatformRequestContextV010;
    /** Original immutable model arguments for resource-level authorization. */
    arguments:Record<string,unknown>;
  }):Promise<boolean>;
  coordinator:Pick<AgentExecutionCoordinatorV020,"getWrite">;
  authority:Pick<FencedAgentRunAuthorityV030,"release">;
  handoff:GovernedAgentWriteHandoffV040;
  reconciler:Pick<AgentWriteReconciliationPortV030,"get">;
}):GovernedAgentWorkerWritePortV040 {
  if(!deps.toolId?.trim()||!deps.ownerPackageId?.trim()||
     typeof deps.authorize!=="function"||!deps.coordinator?.getWrite||
     !deps.authority?.release||!deps.handoff?.dispatch||
     !deps.handoff?.recover||!deps.reconciler?.get)
    throw Error("PA02_WORKER_TRUSTED_OWNER_PORT_REQUIRED");
  const allows=(d:AgentToolDescriptorV010)=>d?.effect==="WRITE" &&
    d.id===deps.toolId && d.ownerPackageId===deps.ownerPackageId;
  return {
    allows,
    async execute(r) {
      if(!allows(r.descriptor) || r.decision.decision.type!=="tool" ||
         r.decision.decision.call.tool!==r.descriptor.id ||
         r.run.runId!==r.lease.runId ||
         r.run.principalSubjectId!==r.principal.subjectId ||
         r.run.principalActorType!==r.principal.actorType ||
         r.run.context.kind!==r.context.activeContext.kind ||
         r.run.context.contextId!==r.context.activeContext.contextId ||
         (r.run.context.kind==="ENTERPRISE" &&
          (r.context.activeContext.kind!=="ENTERPRISE" ||
           r.run.context.enterpriseId!==r.context.activeContext.enterpriseId)) ||
         r.scope.principalSubjectId!==r.principal.subjectId ||
         r.scope.contextId!==r.run.context.contextId)
        throw Error("PA02_WORKER_WRITE_SCOPE_MISMATCH");
      const call=r.decision.decision.call;
      if(!await deps.authorize({
        descriptor:r.descriptor,principal:r.principal,context:r.context,
        requestContext:r.requestContext,arguments:structuredClone(call.arguments)
      })) throw Error("PA02_WORKER_WRITE_NOT_AUTHORIZED");
      const digest=hash(call.arguments);
      const identity=hash([r.run.runId,r.decision.decisionEventId,call.tool,call.arguments]);
      const effectId="agent-effect:"+identity;
      const receiptId="agent-receipt:"+identity;
      const receipt={
        receiptId,invocationId:"agent-invocation:"+identity,
        idempotencyKey:"agent-idempotency:"+identity,
        sourceInteractionId:r.run.runId,
        sourceActionId:r.decision.decisionEventId,
        principalSubjectId:r.principal.subjectId,
        principalActorType:r.principal.actorType,
        context:r.context.activeContext,
        toolId:r.descriptor.id,ownerPackageId:r.descriptor.ownerPackageId,
        ...(r.descriptor.capability?{capability:r.descriptor.capability}:{}),
        inputDigest:digest,requestedAt:r.decision.occurredAt
      };
      // The committed INVOKING/UNKNOWN marker is the authority for retries.
      // A missing/PREPARED marker is safe to dispatch (never invoked yet).
      // INVOKING means Owner might have committed: release lease before Owner
      // verification and never call Owner.invoke again.
      const current=await deps.coordinator.getWrite({scope:r.scope,effectId});
      if(current && (current.runId!==r.run.runId || current.inputDigest!==digest))
        throw Error("PA02_WORKER_WRITE_IDEMPOTENCY_CONFLICT");
      let result;
      if(!current||current.state==="PREPARED") {
        result=await deps.handoff.dispatch({
          scope:r.scope,lease:r.lease,effectId,receipt,
          arguments:structuredClone(call.arguments)
        });
      }else if(current.state==="INVOKING"||current.state==="UNKNOWN") {
        await deps.authority.release({scope:r.scope,lease:r.lease});
        result=await deps.handoff.recover({scope:r.scope,effectId});
      }else {
        // A verified terminal receipt can be re-read without calling Owner.
        const terminal=await deps.reconciler.get({scope:r.scope,effectId});
        if(!terminal||!terminal.reconciled||terminal.status!==current.state)
          throw Error("PA02_WORKER_WRITE_TERMINAL_EVIDENCE_REQUIRED");
        result=terminal;
      }
      if(result.receiptId!==receiptId)
        throw Error("PA02_WORKER_WRITE_RECEIPT_MISMATCH");
      return {status:result.status,receiptId,reconciled:result.reconciled};
    }
  };
}
