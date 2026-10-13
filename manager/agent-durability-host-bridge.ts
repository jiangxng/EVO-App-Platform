import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type { AgentRunEventV010, AgentRunV010 } from "../contracts/agent-run.js";
import type { AsyncAgentRunReceiptRepositoryV020, HostResolvedAgentDurabilityScopeV020 } from "../contracts/agent-durability-async.js";
import type { PlatformPrincipalV010, ResolvedContextSetV010 } from "../contracts/platform-services.js";
import { materializeAgentRunsV010 } from "./agent-run-store.js";

/**
 * Experimental Host-facing *async* bridge. The Host must resolve principal and
 * active context from its authenticated session and policy before constructing.
 * NEVER pass client request.values or model output into this constructor.
 * This is NOT a replacement for the current synchronous V010 Host runtime.
 */
export function hostResolvedAgentDurabilityScopeV020(input: {
  principal: PlatformPrincipalV010; context: ResolvedContextSetV010;
}): HostResolvedAgentDurabilityScopeV020 {
  const {principal,context}=input;
  if(principal?.contractVersion!=="0.1.0"||context?.contractVersion!=="0.1.0"||
    !principal.subjectId?.trim()||!["HUMAN","AI"].includes(principal.actorType))
    throw Error("AGENT_DURABILITY_HOST_IDENTITY_REQUIRED");
  const active=context.activeContext;
  if(active?.contractVersion!=="0.1.0"||!active.contextId?.trim())
    throw Error("AGENT_DURABILITY_HOST_CONTEXT_REQUIRED");
  if(active.kind==="PERSONAL"){
    if(context.personalContext?.kind!=="PERSONAL"||
      context.personalContext.contextId!==active.contextId||
      context.personalContext.ownerSubjectId!==principal.subjectId)
      throw Error("AGENT_DURABILITY_PERSONAL_OWNER_MISMATCH");
  } else if(active.kind==="ENTERPRISE") {
    if(!active.enterpriseId?.trim()||context.enterpriseContext?.enterpriseId!==active.enterpriseId||
      (context.enterpriseContext.contextId && context.enterpriseContext.contextId!==active.contextId)||
      context.enterpriseContext.lifecycleState!=="ACTIVE")
      throw Error("AGENT_DURABILITY_ENTERPRISE_CONTEXT_NOT_ACTIVE");
  } else {
    throw Error("AGENT_DURABILITY_HOST_CONTEXT_REQUIRED");
  }
  return {
    principalSubjectId:principal.subjectId,
    principalActorType:principal.actorType as "HUMAN"|"AI",
    contextKind:active.kind,contextId:active.contextId,
    ...(active.kind==="ENTERPRISE"?{enterpriseId:active.enterpriseId}:{})
  };
}
function stable(x: unknown): unknown {
  if(Array.isArray(x))return x.map(stable);
  if(x!==null&&typeof x==="object")
    return Object.fromEntries(Object.entries(x as Record<string,unknown>)
      .sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)]));
  return x;
}
function required(s: string): string {
  if(typeof s!=="string"||!s.trim())throw Error("AGENT_DURABILITY_ID_REQUIRED");
  return s.trim();
}
export function createHostScopedAsyncAgentRunBridgeV020(input: {
  repository: AsyncAgentRunReceiptRepositoryV020;
  principal: PlatformPrincipalV010;
  context: ResolvedContextSetV010;
}) {
  const scope=hostResolvedAgentDurabilityScopeV020(input);
  const active=input.context.activeContext;
  const get=async (runId:string):Promise<AgentRunV010|undefined>=>{
    const events=await input.repository.listRunEvents({scope,runId:required(runId)});
    if(!events.length)return undefined;
    const runs=materializeAgentRunsV010(events);
    if(runs.length!==1||runs[0].runId!==runId||
      runs[0].principalSubjectId!==scope.principalSubjectId||
      runs[0].principalActorType!==scope.principalActorType||
      !isDeepStrictEqual(runs[0].context,active))
      throw Error("AGENT_DURABILITY_RUN_SCOPE_INCONSISTENT");
    return runs[0];
  };
  return {
    async claimTurn(r:{threadId:string;clientTurnId:string;created:AgentRunEventV010}) {
      const threadId=required(r.threadId),turnId=required(r.clientTurnId);
      const ev=r.created;
      if(ev.type!=="RUN_CREATED"||!ev.runId?.trim()||!ev.eventId?.trim())
        throw Error("AGENT_DURABILITY_CREATED_EVENT_REQUIRED");
      const payload=ev.payload as Record<string,unknown>;
      if(payload.principalSubjectId!==scope.principalSubjectId||
        payload.principalActorType!==scope.principalActorType||
        !isDeepStrictEqual(payload.context,active)||
        payload.sourceInteractionId!==threadId||!payload.sourceActionId||
        !payload.input)
        throw Error("AGENT_DURABILITY_CREATED_SCOPE_MISMATCH");
      // IDs/timestamps identifying this attempt are not part of task identity:
      // on retry the same canonical user request can carry a new provisional runId.
      const taskPayload={
        sourceInteractionId:threadId,sourceActionId:payload.sourceActionId,
        principalSubjectId:scope.principalSubjectId,context:active,
        input:payload.input
      };
      const taskDigest=createHash("sha256").update(JSON.stringify(stable({
        identityVersion:"host-turn-v1",taskPayload
      }))).digest("hex");
      const result=await input.repository.claimTurn({
        scope,threadId,clientTurnId:turnId,taskPayload,taskDigest,created:ev
      });
      return {...result,run:await get(result.runId)};
    },
    async getByTurn(r:{threadId:string;clientTurnId:string}) {
      const result=await input.repository.getByTurn({
        scope,threadId:required(r.threadId),clientTurnId:required(r.clientTurnId)
      });
      return result?get(result.runId):undefined;
    },
    getRun:get,
    async appendRunEvent(r:{runId:string;expectedRevision:number;event:AgentRunEventV010}) {
      const runId=required(r.runId);
      const existing=await input.repository.listRunEvents({scope,runId});
      if(!existing.length)throw Error("AGENT_DURABILITY_RUN_NOT_FOUND");
      if(r.event.runId!==runId||r.event.type==="RUN_CREATED")
        throw Error("AGENT_DURABILITY_EVENT_INVALID");
      if(existing.length-1!==r.expectedRevision)
        throw Error("AGENT_DURABILITY_REVISION_CONFLICT");
      // Reuse the current V010 reducer before committing a new async event;
      // PostgreSQL CAS remains the final concurrent-writer arbiter.
      materializeAgentRunsV010([...existing,r.event]);
      const result=await input.repository.appendRunEvent({
        scope,runId,expectedRevision:r.expectedRevision,event:r.event
      });
      return {revision:result.revision,run:await get(runId)};
    }
  };
}
