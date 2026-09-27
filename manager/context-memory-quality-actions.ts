import { randomUUID } from "node:crypto";
import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../actions/contracts.js";
import type {
  AuthorizationProviderV010,
  EnterpriseContextRelationshipProviderV010,
  PlatformRequestContextV010
} from "../contracts/platform-services.js";
import {
  HOST_CONTEXT_MEMORY_FEATURE_ID,
  HOST_CONTEXT_MEMORY_PACKAGE_ID
} from "../providers/context-memory/package.js";
import type { ContextMemoryStoreV010 } from "./context-memory-store.js";
import type { PersonalAgentFollowUpStoreV010 } from "./personal-agent-follow-up-store.js";
import type {
  ContextMemoryContradictionResolutionV010,
  ContextMemoryQualityStoreV010
} from "./context-memory-quality-store.js";
import { authorizeMaterialWriteV010 } from "./material-write-authorization.js";

export const CONTEXT_MEMORY_CONTRADICTION_RESOLVE_ACTION =
  "context.memory.quality.contradiction.resolve";

export interface ContextMemoryQualityActionDependenciesV010 {
  memoryStore: ContextMemoryStoreV010;
  qualityStore: ContextMemoryQualityStoreV010;
  followUpStore?: PersonalAgentFollowUpStoreV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
  resolveRelationshipProvider(): EnterpriseContextRelationshipProviderV010 | undefined;
  now?: () => Date;
  id?: () => string;
}

function errorResult(error:unknown):AppActionExecutionResultV010{
  const message=error instanceof Error ? error.message : String(error);
  const [candidate]=message.split(":");
  return {
    ok:false,
    error:{
      code:candidate && /^[A-Z0-9_]+$/.test(candidate)
        ? candidate
        : "CONTEXT_MEMORY_QUALITY_ACTION_FAILED",
      message
    }
  };
}

function stringValue(
  values:Record<string,JsonValue>,
  key:string,
  required=true
):string|undefined{
  const value=values[key];
  if(value===undefined && !required) return undefined;
  if(typeof value!=="string" || !value.trim()){
    throw new Error(`CONTEXT_MEMORY_QUALITY_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function activeContext(requestContext:PlatformRequestContextV010){
  const context=requestContext.context?.activeContext;
  if(!context) throw new Error("CONTEXT_MEMORY_ACTIVE_CONTEXT_REQUIRED");
  return context;
}

function requireGovernanceAuthority(
  dependencies:ContextMemoryQualityActionDependenciesV010,
  requestContext:PlatformRequestContextV010
){
  const context=activeContext(requestContext);
  if(context.kind==="PERSONAL"){
    if(
      requestContext.context?.personalContext.contextId!==context.contextId
      || requestContext.context.personalContext.ownerSubjectId!==requestContext.principal.subjectId
    ) throw new Error("PERSONAL_CONTEXT_MEMORY_OWNER_REQUIRED");
    return;
  }
  const allowed=dependencies.resolveRelationshipProvider()
    ?.listForPrincipal(requestContext.principal)
    .some(item=>
      item.contextId===context.contextId
      && item.state==="ACTIVE"
      && ["OWNER","ADMIN"].includes(item.kind)
    ) ?? false;
  if(!allowed) throw new Error("ENTERPRISE_CONTEXT_MEMORY_GOVERNANCE_ROLE_REQUIRED");
}

function sameContext(
  a:{kind:string;contextId:string;enterpriseId?:string},
  b:{kind:string;contextId:string;enterpriseId?:string}
){
  return a.kind===b.kind
    && a.contextId===b.contextId
    && (a.kind!=="ENTERPRISE" || b.kind!=="ENTERPRISE" || a.enterpriseId===b.enterpriseId);
}

export function createContextMemoryQualityActionHandlerV010(
  dependencies:ContextMemoryQualityActionDependenciesV010
):AppActionHandler{
  const now=dependencies.now ?? (()=>new Date());
  const id=dependencies.id ?? randomUUID;

  return {
    packageId:HOST_CONTEXT_MEMORY_PACKAGE_ID,
    featureId:HOST_CONTEXT_MEMORY_FEATURE_ID,
    commandCode:CONTEXT_MEMORY_CONTRADICTION_RESOLVE_ACTION,
    async execute(request:AppActionRequestV010,requestContext?:PlatformRequestContextV010){
      if(!requestContext) return errorResult(new Error("REQUEST_CONTEXT_REQUIRED"));
      try{
        if(requestContext.principal.actorType!=="HUMAN"){
          throw new Error("CONTEXT_MEMORY_HUMAN_REQUIRED");
        }
        if(request.requiresConfirmation!==true){
          throw new Error("MATERIAL_WRITE_CONFIRMATION_REQUIRED");
        }
        requireGovernanceAuthority(dependencies,requestContext);

        const contradictionId=stringValue(request.values,"itemId",false)
          ?? stringValue(request.values,"contradictionId")!;
        const current=dependencies.qualityStore.contradiction(contradictionId);
        if(!current) throw new Error("CONTEXT_MEMORY_CONTRADICTION_NOT_FOUND");
        if(current.state!=="OPEN") throw new Error("CONTEXT_MEMORY_CONTRADICTION_NOT_OPEN");

        const context=activeContext(requestContext);
        if(!sameContext(current.context,context)){
          throw new Error("CONTEXT_MEMORY_CONTRADICTION_CONTEXT_MISMATCH");
        }

        const memories=dependencies.memoryStore.snapshot().items;
        for(const memoryId of [current.leftMemoryId,current.rightMemoryId]){
          const memory=memories.find(item=>item.memoryId===memoryId);
          if(!memory || !sameContext(memory.context,context)){
            throw new Error(`CONTEXT_MEMORY_CONTRADICTION_MEMORY_NOT_FOUND: ${memoryId}`);
          }
        }

        const dismiss=request.actionId==="dismiss-contradiction";
        const resolutionRaw=stringValue(request.values,"resolution",false);
        let resolution:ContextMemoryContradictionResolutionV010|undefined;
        if(!dismiss){
          if(!resolutionRaw || !["PREFER_LEFT","PREFER_RIGHT","BOTH_VALID","OTHER"].includes(resolutionRaw)){
            throw new Error("CONTEXT_MEMORY_CONTRADICTION_RESOLUTION_INVALID");
          }
          resolution=resolutionRaw as ContextMemoryContradictionResolutionV010;
        }
        const reason=stringValue(request.values,"reason",false);

        const auth=await authorizeMaterialWriteV010(
          dependencies.resolveAuthorizationProvider(),
          requestContext,
          {
            action:CONTEXT_MEMORY_CONTRADICTION_RESOLVE_ACTION,
            resource:{
              type:"context.memory.quality.contradiction",
              id:contradictionId,
              attributes:{
                contextId:context.contextId,
                contextKind:context.kind,
                outcome:dismiss ? "DISMISSED" : "RESOLVED",
                ...(resolution ? {resolution} : {})
              }
            }
          }
        );
        if(!auth.allowed){
          throw new Error(
            `${auth.reasonCodes[0] ?? "MATERIAL_WRITE_DENIED"}: denied by '${auth.policyProviderId}' ${auth.reasonCodes.join(", ")}`
          );
        }

        dependencies.qualityStore.append({
          contractVersion:"0.1.0",
          eventId:`memory-contradiction:${id()}`,
          contradictionId,
          context:structuredClone(context),
          leftMemoryId:current.leftMemoryId,
          rightMemoryId:current.rightMemoryId,
          state:dismiss ? "DISMISSED" : "RESOLVED",
          origin:"HUMAN",
          ...(resolution ? {resolution} : {}),
          ...(reason ? {reason} : {}),
          occurredAt:now().toISOString(),
          actorSubjectId:requestContext.principal.subjectId
        });

        const effective = dependencies.qualityStore.contradiction(contradictionId);
        let followUp;
        let followUpCreationError:string|undefined;
        if (!dismiss && resolution && dependencies.followUpStore) {
          try {
            followUp = dependencies.followUpStore.findBySource(
              requestContext.principal.subjectId,
              "MEMORY_CONTRADICTION",
              contradictionId
            );
            if (!followUp) {
              const preferredMemoryId = resolution === "PREFER_LEFT"
                ? current.leftMemoryId
                : resolution === "PREFER_RIGHT"
                  ? current.rightMemoryId
                  : undefined;
              const otherMemoryId = resolution === "PREFER_LEFT"
                ? current.rightMemoryId
                : resolution === "PREFER_RIGHT"
                  ? current.leftMemoryId
                  : undefined;
              const kind = preferredMemoryId
                ? "REVIEW_PREFERRED_MEMORY" as const
                : resolution === "BOTH_VALID"
                  ? "CLARIFY_MEMORY_CONTEXT" as const
                  : "REVIEW_MEMORY_RESOLUTION" as const;
              const title = preferredMemoryId
                ? "Review preferred Memory after contradiction resolution"
                : resolution === "BOTH_VALID"
                  ? "Clarify context for both valid Memory records"
                  : "Review resolved Memory contradiction";
              const instruction = preferredMemoryId && otherMemoryId
                ? `Review preferred Memory '${preferredMemoryId}' against '${otherMemoryId}'. If durable knowledge should change, prepare a new Memory Proposal; do not rewrite either existing Memory record.`
                : resolution === "BOTH_VALID"
                  ? `Review Memory '${current.leftMemoryId}' and '${current.rightMemoryId}' and determine whether an additional contextual Memory Proposal would help explain when each is valid.`
                  : `Review contradiction '${contradictionId}' and its Human resolution. Propose follow-up work only if new durable knowledge is warranted.`;

              const followUpId=`personal-agent-follow-up:${id()}`;
              dependencies.followUpStore.append({
                contractVersion:"0.1.0",
                eventId:`personal-agent-follow-up-event:${id()}`,
                followUpId,
                principalSubjectId:requestContext.principal.subjectId,
                context:structuredClone(context),
                state:"OPEN",
                kind,
                sourceType:"MEMORY_CONTRADICTION",
                sourceId:contradictionId,
                title,
                instruction,
                relatedMemoryIds:[current.leftMemoryId,current.rightMemoryId],
                occurredAt:now().toISOString(),
                actorSubjectId:requestContext.principal.subjectId
              });
              followUp=dependencies.followUpStore.get(followUpId);
            }
          } catch (error) {
            followUpCreationError=error instanceof Error ? error.message : String(error);
          }
        }

        return {
          ok:true,
          correlationId:requestContext.correlationId,
          result:JSON.parse(JSON.stringify({
            contradiction: effective,
            ...(followUp ? { followUp } : {}),
            ...(followUpCreationError ? { followUpCreationError } : {})
          }))
        };
      }catch(error){
        return errorResult(error);
      }
    }
  };
}
