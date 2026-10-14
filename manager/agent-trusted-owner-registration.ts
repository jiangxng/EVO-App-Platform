import type { AppActionRequestV010 } from "../actions/contracts.js";
import type { AppManagerService } from "./service.js";
import type {
  AuthorizationProviderV010, PlatformPrincipalV010,
  PlatformRequestContextV010, ResolvedContextSetV010
} from "../contracts/platform-services.js";
import type { AgentToolDescriptorV010 } from "../agents/enterprise-agent/contracts.js";
import type { GovernedAgentBusinessOwnerV040 } from
  "../agents/enterprise-agent/pa02b-governed-owner-write-handoff.js";
import type { AgentOwnerVerifierV030 } from
  "../agents/enterprise-agent/pa02b-owner-reconciliation.js";
import {
  createCapabilityOperationActionPreExecuteV010,
  type EffectiveCapabilityOperationV010
} from "./capability-operation-access.js";
import { hostResolvedAgentDurabilityScopeV020 } from "./agent-durability-host-bridge.js";
import { personalAgentCapabilityRequestContextV010 } from
  "../agents/enterprise-agent/capability-fabric-tools.js";

/**
 * Host-installed Owner registry. A capability contribution is a discovery and
 * authorization contract, NOT evidence that the package implements idempotent
 * business dispatch or independent owner-side result verification.
 */
export interface AgentTrustedOwnerRegistrationV040 {
  operationId: string;
  packageId: string;
  commandCode: string;
  inputVersion: string;
  modelName: string;
  owner: GovernedAgentBusinessOwnerV040;
  verifier: AgentOwnerVerifierV030;
  /** Host-side validation; business Owner must still validate independently. */
  validateArguments(args:Record<string,unknown>):Promise<boolean>|boolean;
}

export interface AgentTrustedOwnerBindingV040 {
  descriptor: AgentToolDescriptorV010;
  owner: GovernedAgentBusinessOwnerV040;
  verifier: AgentOwnerVerifierV030;
  /**
   * Re-evaluate live plugin lifecycle, PERSONAL_AGENT exposure, input resource,
   * AI actor authorization and immutable binding, immediately before dispatch.
   */
  authorize(input:{
    descriptor:AgentToolDescriptorV010;
    principal:PlatformPrincipalV010;
    context:ResolvedContextSetV010;
    requestContext?:PlatformRequestContextV010;
    arguments:Record<string,unknown>;
  }):Promise<boolean>;
}

function required(value:unknown):string {
  if(typeof value!=="string"||!value.trim())throw Error("PA02_HOST_OWNER_ID_REQUIRED");
  return value.trim();
}
function contractKey(operation:EffectiveCapabilityOperationV010):string {
  return JSON.stringify({
    operationId:operation.operationId,
    packageId:operation.packageId,
    featureId:operation.featureId,
    effect:operation.effect,
    dataScope:operation.dataScope,
    exposure:operation.exposure,
    authorization:operation.authorization,
    binding:operation.binding,
    writeSafety:operation.writeSafety,
    inputSchema:operation.inputSchema
  });
}
function supported(operation:EffectiveCapabilityOperationV010,
  registration:AgentTrustedOwnerRegistrationV040):boolean {
  return operation.operationId===registration.operationId &&
    operation.packageId===registration.packageId &&
    operation.effect==="WRITE" &&
    operation.exposure.includes("PERSONAL_AGENT") &&
    operation.writeSafety?.idempotency==="HOST_REQUIRED" &&
    operation.writeSafety.receipt==="HOST_REQUIRED" &&
    operation.binding.type==="ACTION_HOST" &&
    operation.binding.commandCode===registration.commandCode &&
    operation.binding.inputVersion===registration.inputVersion;
}
function sameActorScope(input:{
  principal:PlatformPrincipalV010;
  context:ResolvedContextSetV010;
  requestContext?:PlatformRequestContextV010;
}):boolean {
  const rc=input.requestContext;
  if(!rc||rc.contractVersion!=="0.1.0"||!rc.correlationId?.trim()||
     rc.delegatedActor||!rc.context)return false;
  const current=hostResolvedAgentDurabilityScopeV020({
    principal:input.principal,context:input.context
  });
  const request=hostResolvedAgentDurabilityScopeV020({
    principal:rc.principal,context:rc.context
  });
  return current.principalSubjectId===request.principalSubjectId &&
    current.principalActorType===request.principalActorType &&
    current.contextKind===request.contextKind &&
    current.contextId===request.contextId &&
    current.enterpriseId===request.enterpriseId;
}
function jsonArgs(value:Record<string,unknown>):Record<string,unknown> {
  if(!value||Array.isArray(value)||typeof value!=="object")
    throw Error("PA02_HOST_OWNER_ARGUMENTS_INVALID");
  try{
    const clone=structuredClone(value);
    const text=JSON.stringify(clone);
    if(!text||text.length>1024*1024)throw Error("PA02_HOST_OWNER_ARGUMENTS_INVALID");
    const parsed=JSON.parse(text) as unknown;
    if(!parsed||Array.isArray(parsed)||typeof parsed!=="object")
      throw Error("PA02_HOST_OWNER_ARGUMENTS_INVALID");
    return parsed as Record<string,unknown>;
  }catch{throw Error("PA02_HOST_OWNER_ARGUMENTS_INVALID");}
}

/**
 * The Host constructs these registrations from trusted code. The model cannot
 * register a new Owner or choose a different ownerPackageId. The effective
 * Capability Operation still has to be active on EVERY authorized dispatch.
 *
 * This module does not activate WRITE in manager/server.ts or supply an Owner
 * adapter for an arbitrary Action Host command; such an adapter must first
 * implement idempotency and independently verifiable reconciliation.
 */
export function createHostRegisteredAgentOwnerRegistryV040(input:{
  manager:AppManagerService;
  resolveAuthorizationProvider():AuthorizationProviderV010|undefined;
  registrations:readonly AgentTrustedOwnerRegistrationV040[];
}):{resolve(operationId:string):AgentTrustedOwnerBindingV040|undefined} {
  const registrations=new Map<string,AgentTrustedOwnerRegistrationV040>();
  const modelNames=new Set<string>();
  for(const entry of input.registrations) {
    const operationId=required(entry.operationId);
    required(entry.packageId);
    required(entry.commandCode);
    required(entry.inputVersion);
    const modelName=required(entry.modelName);
    if(!/^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/.test(modelName))
      throw Error("PA02_HOST_OWNER_MODEL_NAME_INVALID");
    if(registrations.has(operationId)||modelNames.has(modelName))
      throw Error("PA02_HOST_OWNER_REGISTRATION_CONFLICT");
    if(entry.owner?.ownerPackageId!==entry.packageId||
       typeof entry.owner.invoke!=="function"||
       typeof entry.verifier?.verify!=="function"||
       typeof entry.validateArguments!=="function")
      throw Error("PA02_HOST_OWNER_TRUSTED_ADAPTER_REQUIRED");
    registrations.set(operationId,entry);
    modelNames.add(modelName);
  }
  const preExecute=createCapabilityOperationActionPreExecuteV010({
    manager:input.manager,
    resolveAuthorizationProvider:input.resolveAuthorizationProvider
  });
  const currentOperation=(entry:AgentTrustedOwnerRegistrationV040)=>{
    const operations=input.manager.listEffectiveCapabilityOperations();
    // Reject conflicting or ambiguous Action Host bindings, including another
    // plugin's same commandCode. Never pick whichever happens to be first.
    const active=operations.filter(o=>o.operationId===entry.operationId);
    if(active.length!==1||!supported(active[0],entry))return undefined;
    if(operations.filter(o=>o.binding.type==="ACTION_HOST" &&
      o.binding.commandCode===entry.commandCode).length!==1)return undefined;
    return active[0];
  };
  return {
    resolve(operationId) {
      const entry=registrations.get(operationId);
      if(!entry)return undefined;
      const initial=currentOperation(entry);
      if(!initial)return undefined;
      const descriptor:AgentToolDescriptorV010={
        contractVersion:"0.1.0",
        id:initial.operationId,
        modelName:entry.modelName,
        title:initial.title,
        description:initial.description,
        inputSchema:structuredClone(initial.inputSchema),
        effect:"WRITE",
        ownerPackageId:initial.packageId,
        capability:initial.capability
      };
      const expected=contractKey(initial);
      return {
        descriptor,owner:entry.owner,verifier:entry.verifier,
        async authorize(request) {
          // Only the trusted Worker passes an already-resolved Principal and
          // Context from Host session. Fail closed if any differs.
          if(request.descriptor.id!==descriptor.id ||
             request.descriptor.effect!=="WRITE" ||
             request.descriptor.ownerPackageId!==descriptor.ownerPackageId ||
             request.descriptor.modelName!==descriptor.modelName ||
             request.descriptor.capability!==descriptor.capability ||
             JSON.stringify(request.descriptor.inputSchema)!==
               JSON.stringify(descriptor.inputSchema))return false;
          try {
            if(!sameActorScope(request))return false;
            const args=jsonArgs(request.arguments);
            if(!await entry.validateArguments(args))return false;
            const before=currentOperation(entry);
            if(!before||contractKey(before)!==expected)return false;
            if(!request.requestContext)return false;
            const ctx=personalAgentCapabilityRequestContextV010({
              ...request.requestContext,
              context:structuredClone(request.context)
            });
            const action:AppActionRequestV010={
              contractVersion:"0.1.0",type:"command",
              command:{code:before.binding.commandCode,
                inputVersion:before.binding.inputVersion},
              values:args,sourceInteractionId:"agent-owner:"+
                request.requestContext.correlationId,
              actionId:before.operationId,
              requiresConfirmation:false
            };
            // Reuse the existing Host capability lifecycle/AI actor/INPUT
            // resource authorization policy. This does NOT invoke the Action
            // Router because an arbitrary Action handler has no idempotency
            // or trusted reconciliation contract.
            const denied=await preExecute({request:action,context:ctx});
            if(denied && !denied.ok)return false;
            const after=currentOperation(entry);
            return Boolean(after&&contractKey(after)===expected);
          }catch{return false;}
        }
      };
    }
  };
}
