import type { AgentActionReceiptBeginInputV010 } from "../../contracts/agent-action-receipt.js";
import {createHash} from "node:crypto";
import type { HostResolvedAgentDurabilityScopeV020, AsyncAgentRunReceiptRepositoryV020 } from "../../contracts/agent-durability-async.js";
import type { AgentExecutionCoordinatorV020, AgentLeaseV020 } from "./pa02b-postgres-coordination.js";
import type { AgentWriteReconciliationPortV030, AgentWriteReconciliationResultV030 } from "./pa02b-owner-reconciliation.js";
import type { FencedAgentRunAuthorityV030 } from "./pa02b-fenced-run-authority.js";

/**
 * Trusted, Host-registered business Owner only. This is NOT a model-callable
 * interface. The Owner must enforce the supplied idempotency key at its own
 * business authority and support independent reconciliation by the V030
 * ownerVerifier; DB fencing alone cannot stop an in-flight external request.
 */
export interface GovernedAgentBusinessOwnerV040 {
  ownerPackageId: string;
  invoke(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    runId: string;
    effectId: string;
    receiptId: string;
    idempotencyKey: string;
    inputDigest: string;
    toolId: string;
    arguments?: Record<string, unknown>;
  }): Promise<void>;
}
export interface GovernedAgentWriteHandoffV040 {
  dispatch(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    lease: AgentLeaseV020;
    effectId: string;
    receipt: AgentActionReceiptBeginInputV010;
    arguments?: Record<string, unknown>;
  }): Promise<AgentWriteReconciliationResultV030>;
  /** Crash recovery never calls Owner.invoke, even when invocation is uncertain. */
  recover(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    effectId: string;
  }): Promise<AgentWriteReconciliationResultV030>;
}

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
function id(v:unknown):string {
  if(typeof v!=="string"||!v.trim())throw Error("PA02B_HANDOFF_VALUE_REQUIRED");
  return v.trim();
}
function digest(v:unknown):string {
  if(typeof v!=="string"||!/^[a-f0-9]{64}$/.test(v))
    throw Error("PA02B_HANDOFF_DIGEST_INVALID");
  return v;
}
function sameScope(
  scope:HostResolvedAgentDurabilityScopeV020,
  receipt:AgentActionReceiptBeginInputV010
):boolean {
  return receipt.principalSubjectId===scope.principalSubjectId &&
    receipt.principalActorType===scope.principalActorType &&
    receipt.context.kind===scope.contextKind &&
    receipt.context.contextId===scope.contextId &&
    (scope.contextKind!=="ENTERPRISE" ||
      (receipt.context.kind==="ENTERPRISE" &&
       receipt.context.enterpriseId===scope.enterpriseId));
}

/**
 * The only place a new business WRITE may cross from a fenced Agent Run into
 * an Owner. PREPARED + REQUESTED Receipt + bound Owner proof are all persisted
 * before INVOKING, which is committed BEFORE the external call.
 *
 * On any ambiguous Owner response, never re-invoke: quarantine UNKNOWN and
 * ask the separately registered trusted Owner verifier for real evidence.
 * UNKNOWN means unresolved, not FAILED, SUCCEEDED or safe to retry.
 *
 * An Owner port is injected by trusted Host composition; never resolve it by
 * arbitrary request data or model-generated package names.
 */
export function createGovernedAgentWriteHandoffV040(deps:{
  coordinator:AgentExecutionCoordinatorV020;
  authority:Pick<FencedAgentRunAuthorityV030,"release">;
  receipts:Pick<AsyncAgentRunReceiptRepositoryV020,"beginReceipt">;
  reconciler:Pick<AgentWriteReconciliationPortV030,"bind"|"reconcile">;
  owner:GovernedAgentBusinessOwnerV040;
}):GovernedAgentWriteHandoffV040 {
  if(typeof deps.owner?.invoke!=="function"||!deps.owner.ownerPackageId?.trim())
    throw Error("PA02B_HANDOFF_TRUSTED_OWNER_REQUIRED");
  if(!deps.coordinator||!deps.authority?.release||!deps.receipts||!deps.reconciler)
    throw Error("PA02B_HANDOFF_PORTS_REQUIRED");

  const recover=async (r:{scope:HostResolvedAgentDurabilityScopeV020;effectId:string})=>{
    // Explicit quarantine is useful after process death between INVOKING and
    // marking UNKNOWN; it is NOT permission for a second dispatch.
    const effectId=id(r.effectId);
    await deps.coordinator.markUnknown({scope:r.scope,effectId});
    return deps.reconciler.reconcile({scope:r.scope,effectId});
  };

  return {
    recover,
    async dispatch(r) {
      const effectId=id(r.effectId),receipt=r.receipt;
      const runId=id(r.lease?.runId),receiptId=id(receipt?.receiptId);
      const ownerPackageId=id(deps.owner.ownerPackageId);
      if(receipt.ownerPackageId!==ownerPackageId ||
         receipt.sourceInteractionId!==runId ||
         !sameScope(r.scope,receipt)) {
        throw Error("PA02B_HANDOFF_SOURCE_MISMATCH");
      }
      // All IDs and the input digest are provided by the authenticated Host
      // and retained in the immutable Receipt before any material dispatch.
      id(receipt.invocationId);
      id(receipt.idempotencyKey);
      id(receipt.toolId);
      digest(receipt.inputDigest);
      if(r.arguments!==undefined &&
         (r.arguments===null||typeof r.arguments!=="object"||
          Array.isArray(r.arguments)||hash(r.arguments)!==receipt.inputDigest))
        throw Error("PA02B_HANDOFF_ARGUMENT_DIGEST_MISMATCH");
      await deps.coordinator.prepareWrite({
        scope:r.scope,lease:r.lease,effectId,inputDigest:receipt.inputDigest
      });
      await deps.receipts.beginReceipt({scope:r.scope,receipt});
      await deps.reconciler.bind({
        scope:r.scope,lease:r.lease,effectId,receiptId,ownerPackageId
      });
      // On concurrent retry this is an atomic one-time transition and throws
      // PA02B_WRITE_MAY_HAVE_EXECUTED; Owner.invoke will NOT run twice.
      await deps.coordinator.beginWrite({scope:r.scope,lease:r.lease,effectId});
      try {
        await deps.owner.invoke({
          scope:r.scope,runId,effectId,receiptId,
          idempotencyKey:receipt.idempotencyKey,
          inputDigest:receipt.inputDigest,toolId:receipt.toolId,
          ...(r.arguments?{arguments:structuredClone(r.arguments)}:{})
        });
      } catch {
        // External transport errors can occur AFTER the business Owner commits.
        // They cannot safely be interpreted as failure or retried here.
      }
      // Yield the exact fenced lease before Owner confirmation. A stale worker
      // cannot release a successor; reconciliation rejects a live worker.
      await deps.coordinator.markUnknown({scope:r.scope,effectId});
      await deps.authority.release({scope:r.scope,lease:r.lease});
      return deps.reconciler.reconcile({scope:r.scope,effectId});
    }
  };
}
