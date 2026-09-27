import { randomUUID } from "node:crypto";
import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  JsonValue
} from "../../actions/contracts.js";
import type {
  AuthorizationProviderV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  ENTERPRISE_AGENT_FEATURE_ID,
  ENTERPRISE_AGENT_PACKAGE_ID
} from "./package.js";
import type {
  PersonalAgentQualityEvidenceStoreV010
} from "./quality-evidence-store.js";
import {
  createEvaluatedQualityEvidenceV010
} from "./quality-evidence-store.js";
import { authorizeMaterialWriteV010 } from "../../manager/material-write-authorization.js";

export const PERSONAL_AGENT_QUALITY_EVALUATE_ACTION =
  "enterprise-agent.quality.evaluate";

export interface PersonalAgentQualityEvaluationActionDependenciesV010 {
  store: PersonalAgentQualityEvidenceStoreV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
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
        : "PERSONAL_AGENT_QUALITY_EVALUATION_FAILED",
      message
    }
  };
}

function stringValue(values:Record<string,JsonValue>,key:string,required=true):string|undefined{
  const value=values[key];
  if(value===undefined && !required) return undefined;
  if(typeof value!=="string" || !value.trim()){
    throw new Error(`PERSONAL_AGENT_QUALITY_FIELD_INVALID: ${key}`);
  }
  return value.trim();
}

function triState(
  values:Record<string,JsonValue>,
  key:string
):boolean|undefined{
  const value=values[key];
  if(value===undefined || value==="UNKNOWN" || value==="") return undefined;
  if(value==="YES" || value===true) return true;
  if(value==="NO" || value===false) return false;
  throw new Error(`PERSONAL_AGENT_QUALITY_FIELD_INVALID: ${key}`);
}

function optionalCount(
  values:Record<string,JsonValue>,
  key:string
):number|undefined{
  const value=values[key];
  if(value===undefined || value==="" || value==="UNKNOWN") return undefined;
  const parsed=typeof value==="number" ? value : Number(value);
  if(!Number.isInteger(parsed) || parsed<0){
    throw new Error(`PERSONAL_AGENT_QUALITY_FIELD_INVALID: ${key}`);
  }
  return parsed;
}

function sameContext(
  a:{kind:string;contextId:string;enterpriseId?:string},
  b:{kind:string;contextId:string;enterpriseId?:string}
):boolean{
  return a.kind===b.kind
    && a.contextId===b.contextId
    && (a.kind!=="ENTERPRISE" || b.kind!=="ENTERPRISE" || a.enterpriseId===b.enterpriseId);
}

export function createPersonalAgentQualityEvaluationActionHandlerV010(
  dependencies:PersonalAgentQualityEvaluationActionDependenciesV010
):AppActionHandler{
  const now=dependencies.now ?? (()=>new Date());
  const id=dependencies.id ?? randomUUID;

  return {
    packageId:ENTERPRISE_AGENT_PACKAGE_ID,
    featureId:ENTERPRISE_AGENT_FEATURE_ID,
    commandCode:PERSONAL_AGENT_QUALITY_EVALUATE_ACTION,
    async execute(request,requestContext?:PlatformRequestContextV010){
      if(!requestContext) return errorResult(new Error("REQUEST_CONTEXT_REQUIRED"));
      try{
        const context=requestContext.context?.activeContext;
        if(!context) throw new Error("PERSONAL_AGENT_QUALITY_ACTIVE_CONTEXT_REQUIRED");

        const interactionId=stringValue(
          request.values,
          "itemId",
          false
        ) ?? stringValue(request.values,"interactionId")!;
        const requestedSource=stringValue(request.values,"evaluationSource",false)
          ?? (requestContext.principal.actorType==="HUMAN"
            ? "HUMAN_EVALUATED"
            : "LAB_EVALUATED");
        if(!["HUMAN_EVALUATED","LAB_EVALUATED"].includes(requestedSource)){
          throw new Error("PERSONAL_AGENT_QUALITY_SOURCE_INVALID");
        }

        const targetSubjectId=requestedSource==="HUMAN_EVALUATED"
          ? requestContext.principal.subjectId
          : stringValue(request.values,"targetSubjectId")!;

        if(
          requestedSource==="HUMAN_EVALUATED"
          && requestContext.principal.actorType!=="HUMAN"
        ){
          throw new Error("PERSONAL_AGENT_QUALITY_HUMAN_REQUIRED");
        }
        if(
          requestedSource==="LAB_EVALUATED"
          && requestContext.principal.actorType==="HUMAN"
        ){
          throw new Error("PERSONAL_AGENT_QUALITY_LAB_ACTOR_REQUIRED");
        }

        const hostEvents=dependencies.store.list()
          .filter(event =>
            event.source==="HOST_OBSERVED"
            && event.interactionId===interactionId
            && event.principalSubjectId===targetSubjectId
            && sameContext(event.context,context)
          )
          .sort((a,b)=>
            b.occurredAt.localeCompare(a.occurredAt)
            || b.eventId.localeCompare(a.eventId)
          );
        const host=hostEvents[0];
        if(!host){
          throw new Error("PERSONAL_AGENT_QUALITY_HOST_EVIDENCE_REQUIRED");
        }

        if(requestedSource==="LAB_EVALUATED"){
          const decision=await authorizeMaterialWriteV010(
            dependencies.resolveAuthorizationProvider(),
            requestContext,
            {
              action:"enterprise-agent.quality.lab-evaluate",
              resource:{
                type:"enterprise-agent.quality-evidence",
                id:interactionId,
                attributes:{
                  targetSubjectId,
                  contextId:context.contextId,
                  contextKind:context.kind
                }
              }
            }
          );
          if(!decision.allowed){
            throw new Error(
              `${decision.reasonCodes[0] ?? "QUALITY_EVALUATION_DENIED"}: denied by '${decision.policyProviderId}' ${decision.reasonCodes.join(", ")}`
            );
          }
        }

        const subjective={
          ...(triState(request.values,"clarificationAsked")!==undefined
            ? {clarificationAsked:triState(request.values,"clarificationAsked")}
            : {}),
          ...(triState(request.values,"clarificationWasNecessary")!==undefined
            ? {clarificationWasNecessary:triState(request.values,"clarificationWasNecessary")}
            : {}),
          ...(triState(request.values,"presentedEquivalentOptionsWithoutRecommendation")!==undefined
            ? {presentedEquivalentOptionsWithoutRecommendation:triState(request.values,"presentedEquivalentOptionsWithoutRecommendation")}
            : {}),
          ...(optionalCount(request.values,"executableStepsReturnedToHuman")!==undefined
            ? {executableStepsReturnedToHuman:optionalCount(request.values,"executableStepsReturnedToHuman")}
            : {}),
          ...(triState(request.values,"authorizationRequired")!==undefined
            ? {authorizationRequired:triState(request.values,"authorizationRequired")}
            : {}),
          ...(triState(request.values,"authorizationGranted")!==undefined
            ? {authorizationGranted:triState(request.values,"authorizationGranted")}
            : {}),
          ...(triState(request.values,"continuedAfterAuthorization")!==undefined
            ? {continuedAfterAuthorization:triState(request.values,"continuedAfterAuthorization")}
            : {}),
          ...(triState(request.values,"completionVerified")!==undefined
            ? {completionVerified:triState(request.values,"completionVerified")}
            : {}),
          ...(triState(request.values,"correctedApproach")!==undefined
            ? {correctedApproach:triState(request.values,"correctedApproach")}
            : {}),
          ...(triState(request.values,"correctionPreservedHumanGoal")!==undefined
            ? {correctionPreservedHumanGoal:triState(request.values,"correctionPreservedHumanGoal")}
            : {})
        };

        const event=createEvaluatedQualityEvidenceV010({
          eventId:`agent-quality-evaluation:${id()}`,
          interactionId,
          occurredAt:now().toISOString(),
          principalSubjectId:targetSubjectId,
          context,
          source:requestedSource as "HUMAN_EVALUATED"|"LAB_EVALUATED",
          hostEvidence:host.evidence,
          subjective
        });
        dependencies.store.append(event);

        return {
          ok:true,
          correlationId:requestContext.correlationId,
          result:JSON.parse(JSON.stringify({
            event,
            aggregate:dependencies.store.aggregate()
          }))
        };
      }catch(error){
        return errorResult(error);
      }
    }
  };
}
