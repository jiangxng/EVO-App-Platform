import { randomUUID } from "node:crypto";
import type { AgentRunCreateInputV010, AgentRunEventV010, AgentRunV010 } from "../contracts/agent-run.js";
import type { PlatformPrincipalV010, PlatformRequestContextV010, ResolvedContextSetV010 } from "../contracts/platform-services.js";
import type { LlmInferenceProvider } from "../contracts/llm.js";
import type { AgentToolCatalogV010 } from "../agents/enterprise-agent/contracts.js";
import type { AsyncAgentRunReceiptRepositoryV020 } from "../contracts/agent-durability-async.js";
import type { FencedAgentRunAuthorityV030 } from "../agents/enterprise-agent/pa02b-fenced-run-authority.js";
import type { AgentAtomicCancellationPortV020 } from "../agents/enterprise-agent/pa02c-atomic-run-cancel.js";
import type { AgentExecutionCoordinatorV020 } from "../agents/enterprise-agent/pa02b-postgres-coordination.js";
import type { AgentWriteReconciliationPortV030 } from "../agents/enterprise-agent/pa02b-owner-reconciliation.js";
import type { GovernedAgentWorkerWritePortV040 } from "../agents/enterprise-agent/pa02-governed-worker-write-port.js";
import type { AgentTrustedOwnerBindingV040 } from "./agent-trusted-owner-registration.js";
import { createHostScopedAsyncAgentRunBridgeV020,hostResolvedAgentDurabilityScopeV020 } from "./agent-durability-host-bridge.js";


export interface HostAsyncReadExecutionV030 {
  /** Persist a Run first, before any conversation message or tool dispatch. */
  claim(input: { create: AgentRunCreateInputV010; clientTurnId?:string;principal: PlatformPrincipalV010;
    context: ResolvedContextSetV010; requestContext?:PlatformRequestContextV010 }):Promise<AgentRunV010>;
  getByTurn(input: {threadId:string;clientTurnId:string;principal:PlatformPrincipalV010;
    context:ResolvedContextSetV010}):Promise<AgentRunV010|undefined>;
  start(input: { create: AgentRunCreateInputV010; principal: PlatformPrincipalV010;
    context: ResolvedContextSetV010; requestContext?:PlatformRequestContextV010 }):Promise<AgentRunV010>;
  resume(input: {runId:string; principal:PlatformPrincipalV010;
    context:ResolvedContextSetV010;requestContext?:PlatformRequestContextV010}):Promise<AgentRunV010>;
  read(input: {runId:string; principal:PlatformPrincipalV010;context:ResolvedContextSetV010}):Promise<AgentRunV010|undefined>;
  cancel(input: {runId:string; reason:string;principal:PlatformPrincipalV010;
    context:ResolvedContextSetV010}):Promise<{run:AgentRunV010;state:"REQUESTED"|"CANCELLED"}>;
  close():Promise<void>;
}
export interface HostAsyncReadExecutionDependenciesV030 {
  resolveProvider():LlmInferenceProvider|undefined;
  createToolCatalog(run:AgentRunV010,principal:PlatformPrincipalV010,
    context:ResolvedContextSetV010,requestContext:PlatformRequestContextV010|undefined,
    interaction:{sourceInteractionId:string;sourceActionId:string}):AgentToolCatalogV010;
  /**
   * Explicit, already Host-registered business Owner. The same installed,
   * authorized Capability Operation must also appear in the ordinary catalog.
   * Never accept a model/provider-supplied Owner or expose a new tool here.
   */
  trustedOwner?: AgentTrustedOwnerBindingV040;
  /**
   * Host checks the installed, actively authorized Capability Operation for
   * the exact scoped Human/enterprise on each catalogue discovery. The base
   * generic Capability Fabric exposes operations through indirect tools, so
   * its authorized operation list is also a legitimate discovery source.
   */
  discoverTrustedOwner?(input:{
    principal:PlatformPrincipalV010;
    context:ResolvedContextSetV010;
    requestContext?:PlatformRequestContextV010;
  }):Promise<boolean>;
}
function valid(s:unknown):string {
  if(typeof s!=="string"||!s.trim())throw Error("PA02_HOST_RUN_ID_REQUIRED");
  return s.trim();
}
/**
 * Explicit development-mode async Run execution. Uses real fenced persisted Run
 * state and optional cooperative READ-worker yielding. Default is READ-only.
 * A trusted Host-injected Owner enables only its exact installed operation,
 * with the existing Fencing/Receipt/independent Owner verifier machinery.
 *
 * Not a substitute for the existing ordinary-chat Thread/Receipt pipeline.
 */
export async function createPostgresHostAsyncReadExecutionV030(input:{
  connectionString:string;schema:string;deps:HostAsyncReadExecutionDependenciesV030;
}):Promise<HostAsyncReadExecutionV030> {
  if(!/^[a-z][a-z0-9_]{0,62}$/.test(input.schema))
    throw Error("PA02_HOST_WORKER_SCHEMA_INVALID");
  if(!input.connectionString?.trim())
    throw Error("PA02_HOST_WORKER_DATABASE_URL_REQUIRED");
  const [{createPostgresAgentDurabilityProofV020},
    {createPostgresAgentExecutionCoordinatorV020},
    {createPostgresFencedAgentRunAuthorityV030},
    {createPostgresAtomicAgentRunCancellationV020},
    {createReadOnlyFencedAgentWorkerV030},
    {createPostgresAgentOwnerReconciliationV030},
    {createGovernedAgentWriteHandoffV040},
    {createGovernedAgentWorkerWritePortV040}]=await Promise.all([
    import("../agents/enterprise-agent/pa02a-postgres-durability-proof.js"),
    import("../agents/enterprise-agent/pa02b-postgres-coordination.js"),
    import("../agents/enterprise-agent/pa02b-fenced-run-authority.js"),
    import("../agents/enterprise-agent/pa02c-atomic-run-cancel.js"),
    import("../agents/enterprise-agent/pa02-async-read-worker.js"),
    import("../agents/enterprise-agent/pa02b-owner-reconciliation.js"),
    import("../agents/enterprise-agent/pa02b-governed-owner-write-handoff.js"),
    import("../agents/enterprise-agent/pa02-governed-worker-write-port.js")
  ]);
  let repo:AsyncAgentRunReceiptRepositoryV020|undefined;
  let execution:AgentExecutionCoordinatorV020|undefined;
  let authority:FencedAgentRunAuthorityV030|undefined;
  let cancellation:AgentAtomicCancellationPortV020|undefined;
  let reconciler:AgentWriteReconciliationPortV030|undefined;
  let governedWrite:GovernedAgentWorkerWritePortV040|undefined;
  const close=async()=>{
    for(const service of [reconciler,cancellation,authority,execution,repo]) {
      if(service)await service.close();
    }
  };
  try{
    repo=await createPostgresAgentDurabilityProofV020({
      connectionString:input.connectionString,schema:input.schema
    });
    execution=await createPostgresAgentExecutionCoordinatorV020({
      connectionString:input.connectionString,schema:input.schema
    });
    authority=await createPostgresFencedAgentRunAuthorityV030({
      connectionString:input.connectionString,schema:input.schema
    });
    cancellation=await createPostgresAtomicAgentRunCancellationV020({
      connectionString:input.connectionString,schema:input.schema
    });
    if(input.deps.trustedOwner) {
      const binding=input.deps.trustedOwner;
      if(binding.descriptor.effect!=="WRITE"||
        binding.descriptor.ownerPackageId!==binding.owner.ownerPackageId||
        !binding.descriptor.id?.trim()||!binding.descriptor.modelName?.trim()||
        !binding.descriptor.capability?.trim()||
        typeof binding.authorize!=="function"||
        typeof binding.verifier?.verify!=="function")
        throw Error("PA02_HOST_OWNER_TRUSTED_BINDING_INVALID");
      reconciler=await createPostgresAgentOwnerReconciliationV030({
        connectionString:input.connectionString,schema:input.schema,
        ownerVerifier:binding.verifier
      });
      const handoff=createGovernedAgentWriteHandoffV040({
        coordinator:execution!,authority:authority!,receipts:repo!,
        reconciler,owner:binding.owner
      });
      governedWrite=createGovernedAgentWorkerWritePortV040({
        toolId:binding.descriptor.id,
        ownerPackageId:binding.descriptor.ownerPackageId,
        authorize:binding.authorize,
        coordinator:execution!,authority:authority!,
        handoff,reconciler
      });
    }
  }catch(e){await close();throw e;}
  const durable=repo!,fenced=authority!,cancel=cancellation!;
  const reader=(i:{principal:PlatformPrincipalV010;context:ResolvedContextSetV010})=>
    createHostScopedAsyncAgentRunBridgeV020({
      repository:durable,principal:i.principal,context:i.context
    });
  const read=async (r:{runId:string;principal:PlatformPrincipalV010;
    context:ResolvedContextSetV010})=>reader(r).getRun(valid(r.runId));
  const runWorker=async (r:{runId:string;principal:PlatformPrincipalV010;
    context:ResolvedContextSetV010;requestContext?:PlatformRequestContextV010})=>{
    const runId=valid(r.runId);
    const before=await read(r);
    if(!before)throw Error("AGENT_RUN_NOT_FOUND");
    const trusted=input.deps.trustedOwner;
    const catalog=(
      run:AgentRunV010,principal:PlatformPrincipalV010,
      context:ResolvedContextSetV010,requestContext:PlatformRequestContextV010|undefined,
      interaction:{sourceInteractionId:string;sourceActionId:string}
    ):AgentToolCatalogV010=>{
      const base=input.deps.createToolCatalog(
        run,principal,context,requestContext,interaction
      );
      if(!trusted)return base;
      return {
        async list(){
          const listed=await base.list();
          // Ordinary catalog authorization MUST have exposed this operation.
          // A trusted registration alone never broadens tool discoverability.
          // Generic Capability Fabric exposes operations through its search
          // tool, not as one descriptor per operation. Only a separate current
          // Host-authorization check may append this exact trusted operation.
          const matched=listed.filter(item=>item.id===trusted.descriptor.id &&
            item.effect==="WRITE" &&
            item.ownerPackageId===trusted.descriptor.ownerPackageId &&
            item.capability===trusted.descriptor.capability);
          if(matched.length===1)
            return listed.map(item=>item===matched[0]
              ?structuredClone(trusted.descriptor):item);
          if(matched.length>1||
            listed.some(item=>item.id===trusted.descriptor.id||
              item.modelName===trusted.descriptor.modelName))
            return listed;
          const authorized=await input.deps.discoverTrustedOwner?.({
            principal,context,requestContext
          });
          return authorized?[...listed,structuredClone(trusted.descriptor)]:listed;
        },
        async invoke(call,observations) {
          // Material WRITE only travels through governedWrite, never through
          // an arbitrary Action Host handler with no idempotent Owner contract.
          if(call.tool===trusted.descriptor.id)
            throw Error("PA02_HOST_OWNER_CATALOG_DISPATCH_FORBIDDEN");
          return base.invoke(call,observations);
        }
      };
    };
    const worker=createReadOnlyFencedAgentWorkerV030({
      authority:fenced,releaseOnReturn:true,ttlSeconds:180,
      resolveProvider:input.deps.resolveProvider,
      createToolCatalog:catalog,
      ...(governedWrite?{governedWrite}:{}),
      eventId:randomUUID,sliceId:randomUUID
    });
    let run=before;
    for(let i=0;i<24;i++){
      if(["SUCCEEDED","FAILED","BLOCKED","CANCELLED"].includes(run.state))return run;
      const result=await worker.resumeOnce({
        runId,workerId:"agent-host-read-worker:"+randomUUID(),
        principal:r.principal,context:r.context,requestContext:r.requestContext
      });
      run=result.run;
      if(!result.claimed||!result.advanced)return run;
    }
    // Max bounded work per action invocation, but leaves the persisted Run
    // ready to resume; never fabricates success on exhausted slices.
    return run;
  };
  const claimRun=async(r:{create:AgentRunCreateInputV010;clientTurnId?:string;
    principal:PlatformPrincipalV010;context:ResolvedContextSetV010;
    requestContext?:PlatformRequestContextV010}):Promise<AgentRunV010>=>{
    const created=r.create;
    if(created.principalSubjectId!==r.principal.subjectId ||
      created.principalActorType!==r.principal.actorType ||
      JSON.stringify(created.context)!==JSON.stringify(r.context.activeContext)) {
      throw Error("PA02_HOST_RUN_CREATED_SCOPE_MISMATCH");
    }
    const event:AgentRunEventV010={
      contractVersion:"0.1.0",runId:valid(created.runId),
      eventId:"agent-run-event:"+randomUUID(),type:"RUN_CREATED",
      occurredAt:created.createdAt,
      payload:{
        principalSubjectId:created.principalSubjectId,
        principalActorType:created.principalActorType,
        context:structuredClone(created.context),
        sourceInteractionId:created.sourceInteractionId,
        sourceActionId:created.sourceActionId,
        input:structuredClone(created.input)
      }
    };
    const claim=await reader(r).claimTurn({
      threadId:valid(created.sourceInteractionId),
      clientTurnId:valid(r.clientTurnId ?? created.sourceActionId),created:event
    });
    if(!claim.run)throw Error("PA02_HOST_CLAIM_RUN_MISSING");
    return claim.run;
  };
  return {
    read,
    claim:claimRun,
    getByTurn(r){return reader(r).getByTurn({
      threadId:valid(r.threadId),clientTurnId:valid(r.clientTurnId)
    });},
    async start(r){
      const claimed=await claimRun(r);
      return runWorker({...r,runId:claimed.runId});
    },
    resume:runWorker,
    async cancel(r){
      const runId=valid(r.runId),scope=hostResolvedAgentDurabilityScopeV020(r);
      const before=await read(r);
      if(!before)throw Error("AGENT_RUN_NOT_FOUND");
      await cancel.request({scope,runId,
        requestedBy:r.principal.subjectId,reason:valid(r.reason)});
      let state:"REQUESTED"|"CANCELLED"="REQUESTED";
      try{
        const committed=await cancel.commitSafe({
          scope,runId,eventId:"agent-run-event:"+randomUUID(),
          occurredAt:new Date().toISOString()
        });
        state=committed.state;
      }catch(error){
        // Real in-flight work/uncertain WRITE or Receipt is NEVER declared
        // cancelled. Caller can retry after worker quiescence or owner review.
        const code=error instanceof Error?error.message:String(error);
        if(!["PA02C_WORKER_NOT_QUIESCED","PA02C_UNCONFIRMED_WRITE",
          "PA02C_UNCONFIRMED_RECEIPT"].includes(code))throw error;
      }
      const run=await read(r);
      if(!run)throw Error("AGENT_RUN_NOT_FOUND");
      return {run,state};
    },
    close
  };
}

export async function createOptionalPostgresHostAsyncReadExecutionV030(
  env:Record<string,string|undefined>,deps:HostAsyncReadExecutionDependenciesV030
):Promise<HostAsyncReadExecutionV030|undefined>{
  const mode=env.APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE?.trim().toUpperCase()||"OFF";
  if(mode==="OFF")return undefined;
  if(mode!=="READ_ONLY"&&mode!=="OWNER_SANDBOX")
    throw Error("PA02_HOST_WORKER_MODE_INVALID");
  if(mode==="READ_ONLY"&&deps.trustedOwner)
    throw Error("PA02_HOST_WORKER_READ_ONLY_OWNER_FORBIDDEN");
  if(mode==="OWNER_SANDBOX"&&(
      !deps.trustedOwner||
      env.APP_PLATFORM_AGENT_RUN_PA02_DEV_OWNER_ACK!=="ISOLATED_NO_PRODUCTION_DATA"||
      env.NODE_ENV==="production"
    ))throw Error("PA02_HOST_WORKER_SANDBOX_NOT_ADMITTED");
  if((env.APP_PLATFORM_AGENT_RUN_ASYNC_READ_MODE?.trim().toUpperCase()||"OFF")!=="OFF")
    throw Error("PA02_HOST_WORKER_READ_MODE_CONFLICT");
  const connectionString=env.APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL?.trim();
  if(!connectionString)throw Error("PA02_HOST_WORKER_DATABASE_URL_REQUIRED");
  const schema=env.APP_PLATFORM_AGENT_RUN_ASYNC_SCHEMA?.trim();
  if(!schema||!/^[a-z][a-z0-9_]{0,62}$/.test(schema))
    throw Error("PA02_HOST_WORKER_SCHEMA_INVALID");
  if(mode==="OWNER_SANDBOX"&&!schema.startsWith("pa02_"))
    throw Error("PA02_HOST_WORKER_SANDBOX_SCHEMA_REQUIRED");
  return createPostgresHostAsyncReadExecutionV030({connectionString,schema,deps});
}
