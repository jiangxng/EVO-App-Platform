import test from "node:test";
import assert from "node:assert/strict";
import {createHostRegisteredAgentOwnerRegistryV040}
  from "../../dist/manager/agent-trusted-owner-registration.js";
import {createCapabilityOperationActionPreExecuteV010}
  from "../../dist/manager/capability-operation-access.js";

const principal={contractVersion:"0.1.0",subjectId:"host-owner-human",
  actorType:"HUMAN",identityProviderId:"fixture"};
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:host-owner-human",ownerSubjectId:principal.subjectId},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"enterprise:fixture",enterpriseId:"tenant:1"},
  enterpriseContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"enterprise:fixture",enterpriseId:"tenant:1",lifecycleState:"ACTIVE"}};
const requestContext={contractVersion:"0.1.0",principal,
  scope:{contractVersion:"0.1.0",enterpriseId:"tenant:1",userId:principal.subjectId},
  context,correlationId:"fixture:correlation"};
const operation={
  contractVersion:"0.1.0",operationId:"sandbox.counterparty.write",
  capability:"sandbox.counterparty",operationVersion:"0.1.0",
  title:"Supplier Update",description:"Update one supplier in sandbox",
  effect:"WRITE",packageId:"sandbox-owner",featureId:"sandbox-feature",
  dataScope:"ENTERPRISE",exposure:["HUMAN","PERSONAL_AGENT"],
  authorization:{action:"supplier.update",resource:{
    type:"supplier",idSource:"INPUT",inputKey:"recordId"
  }},
  binding:{type:"ACTION_HOST",commandCode:"sandbox.supplier.update",inputVersion:"0.1.0"},
  writeSafety:{idempotency:"HOST_REQUIRED",receipt:"HOST_REQUIRED"},
  inputSchema:{type:"object",required:["recordId","value"],properties:{
    recordId:{type:"string"},value:{type:"integer"}
  }},
  outputSchema:{type:"object"}
};
const owner={ownerPackageId:"sandbox-owner",async invoke(){
  throw Error("REGISTRY_MUST_NOT_EXECUTE_OWNER");
}};
const verifier={async verify(){return {outcome:"UNRESOLVED"};}};
const registration={operationId:operation.operationId,packageId:"sandbox-owner",
  commandCode:operation.binding.commandCode,inputVersion:"0.1.0",
  modelName:"sandbox_supplier_update",owner,verifier,
  validateArguments:args=>typeof args.recordId==="string"&&
    typeof args.value==="number"&&Number.isInteger(args.value)};
const args={recordId:"supplier:1",value:42};

test("PA-02 Host resolves current registered owner and checks AI input-resource policy without executing",async()=>{
  let available=[operation],allowed=true,providerActive=true;
  const checks=[];
  const manager={listEffectiveCapabilityOperations(){return available;}};
  const policy={providerId:"sandbox.auth",check(i){
    checks.push(i);
    return {contractVersion:"0.1.0",allowed:allowed &&
      i.principal.actorType==="AI" && i.scope.enterpriseId==="tenant:1" &&
      i.resource.id==="supplier:1",
      policyProviderId:"sandbox.auth",reasonCodes:[]};
  }};
  const registry=createHostRegisteredAgentOwnerRegistryV040({
    manager,resolveAuthorizationProvider:()=>providerActive?policy:undefined,
    registrations:[registration]
  });
  const bound=registry.resolve(operation.operationId);
  assert.ok(bound);
  assert.equal(bound.owner,owner);
  assert.equal(bound.verifier,verifier);
  assert.equal(bound.descriptor.effect,"WRITE");
  assert.equal(bound.descriptor.ownerPackageId,"sandbox-owner");
  const authorize=(values=args, overrides={})=>bound.authorize({
    descriptor:bound.descriptor,principal,context,requestContext,
    arguments:values,...overrides
  });
  assert.equal(await authorize(),true);
  assert.equal(checks.at(-1).principal.actorType,"AI");
  assert.equal(checks.at(-1).resource.id,"supplier:1");
  assert.equal(checks.at(-1).resource.type,"supplier");
  assert.equal(checks.at(-1).action,"supplier.update");
  assert.equal(await authorize({value:42}),false,"Missing INPUT resource denied");
  assert.equal(await authorize({recordId:"supplier:2",value:42}),false,
    "Resource-level policy rechecks model argument");
  assert.equal(await authorize(args,{
    descriptor:{...bound.descriptor,ownerPackageId:"malicious.owner"}
  }),false);
  assert.equal(await authorize(args,{
    descriptor:{...bound.descriptor,effect:"READ"}
  }),false);
  assert.equal(await authorize(args,{
    requestContext:{...requestContext,principal:{...principal,subjectId:"other-human"}}
  }),false);
  assert.equal(await authorize(args,{
    requestContext:{...requestContext,context:{
      ...context,activeContext:{...context.activeContext,enterpriseId:"tenant:2"}
    }}
  }),false);
  assert.equal(await authorize(args,{
    requestContext:{...requestContext,delegatedActor:{
      contractVersion:"0.1.0",kind:"EXTERNAL_AGENT",
      agentId:"spoof",clientId:"spoof",grantId:"spoof"
    }}
  }),false);
  assert.equal(await authorize({recordId:"supplier:1",value:"not-integer"}),false,
    "Host adapter validates arguments before Owner invocation");
  allowed=false;
  assert.equal(await authorize(),false,"Revoked AI permission denied at dispatch");
  allowed=true;providerActive=false;
  assert.equal(await authorize(),false,"No Auth provider fails closed");
  providerActive=true;
  available=[];
  assert.equal(await authorize(),false,"Uninstalled package fails at dispatch");
  assert.equal(registry.resolve(operation.operationId),undefined);
  available=[operation];
  assert.equal(await authorize(),true);
  available=[{...operation,authorization:{
    action:"supplier.delete",resource:operation.authorization.resource
  }}];
  assert.equal(await authorize(),false,"Hot-swapped operation contract denied");
  available=[operation,{...operation,operationId:"shadow.operation",
    packageId:"shadow.owner"}];
  assert.equal(await authorize(),false,"Duplicate Host command binding denied");
  assert.equal(registry.resolve(operation.operationId),undefined);
  available=[operation];
  const preExecute=createCapabilityOperationActionPreExecuteV010({
    manager,resolveAuthorizationProvider:()=>policy
  });
  const routerGate=await preExecute({handler:{},request:{
    contractVersion:"0.1.0",type:"command",
    command:{code:operation.binding.commandCode,inputVersion:"0.1.0"},
    values:{recordId:"supplier:2",value:42},
    sourceInteractionId:"fixture",actionId:"fixture",requiresConfirmation:false
  },context:{...requestContext,principal:{...principal,actorType:"AI"}}});
  assert.equal(routerGate.ok,false,"Shared policy agrees with Action Host router");
  assert.ok(checks.length>=5);
});

test("PA-02 registry rejects untrusted Owner registrations and unsupported write contributions",()=>{
  const manager={listEffectiveCapabilityOperations(){return [operation];}};
  const build=(r,ops=[operation])=>createHostRegisteredAgentOwnerRegistryV040({
    manager:{listEffectiveCapabilityOperations(){return ops;}},
    resolveAuthorizationProvider:()=>undefined,registrations:[r]
  });
  assert.throws(()=>build({...registration,owner:{...owner,ownerPackageId:"other"}}),
    /PA02_HOST_OWNER_TRUSTED_ADAPTER_REQUIRED/);
  assert.throws(()=>build({...registration,verifier:{}}),
    /PA02_HOST_OWNER_TRUSTED_ADAPTER_REQUIRED/);
  assert.throws(()=>build({...registration,modelName:"untrusted tool name"}),
    /PA02_HOST_OWNER_MODEL_NAME_INVALID/);
  assert.throws(()=>createHostRegisteredAgentOwnerRegistryV040({
    manager,resolveAuthorizationProvider:()=>undefined,
    registrations:[registration,registration]
  }),/PA02_HOST_OWNER_REGISTRATION_CONFLICT/);
  for(const changed of [
    {...operation,effect:"READ"},
    {...operation,exposure:["HUMAN"]},
    {...operation,writeSafety:undefined},
    {...operation,binding:{...operation.binding,commandCode:"other"}},
    {...operation,packageId:"forged"}
  ])assert.equal(build(registration,[changed]).resolve(operation.operationId),undefined);
});
