import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import postgres from "postgres";
import {
  preparePostgresObjectExtensionOwnerSchemaV010,
  createPostgresObjectExtensionAtomicOwnerV010
} from "../../dist/apps/object-extension/agent-owner-postgres.js";
import {objectExtensionCapabilityContributionsV010}
  from "../../dist/apps/object-extension/capability-manifest.js";
import {
  OBJECT_EXTENSION_PACKAGE_ID,OBJECT_EXTENSION_FEATURE_ID,
  OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010
} from "../../dist/apps/object-extension/constants.js";
import {createHostRegisteredAgentOwnerRegistryV040}
  from "../../dist/manager/agent-trusted-owner-registration.js";
import {createOptionalPostgresHostAsyncReadExecutionV030}
  from "../../dist/manager/agent-async-read-worker-runtime.js";
import {createPersonalAgentRunActionHandlersV010}
  from "../../dist/agents/enterprise-agent/run-action-handlers.js";
import {createAgentRunStoreV010,createMemoryAgentRunEventStoreV010}
  from "../../dist/manager/agent-run-store.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"pa02-host-owner-human",
  actorType:"HUMAN",identityProviderId:"fixture"};
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:pa02-host-owner-human",ownerSubjectId:principal.subjectId},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"pa02:owner:context",enterpriseId:"pa02:owner:tenant"},
  enterpriseContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"pa02:owner:context",enterpriseId:"pa02:owner:tenant",
    lifecycleState:"ACTIVE"}};
const requestContext={contractVersion:"0.1.0",principal,context,
  scope:{contractVersion:"0.1.0",enterpriseId:context.activeContext.enterpriseId,
    userId:principal.subjectId},correlationId:"pa02:host:owner:e2e"};
const definition={
  contractVersion:"0.1.0",extensionId:"ext:pa02:host:e2e",
  targetObjectType:"counterparty.subject",targetSlot:"counterparty.supplier",
  namespace:"sandbox.object-extension",fieldId:"hostVerifiedField",
  semanticType:"string",valueType:"STRING",
  label:{default:"Host verified field"},required:false,order:30,
  surfaces:["DETAIL"],agentReadable:true,agentWritable:false
};
const request=(code,values={},actionId="pa02:host:turn")=>({
  contractVersion:"0.1.0",type:"command",
  command:{code,inputVersion:"0.1.0"},values,
  sourceInteractionId:"pa02:host:client",actionId,
  requiresConfirmation:false
});
test("PA02 real Host Run handlers: trusted Object Extension SQL Owner WRITE, immutable receipt, lost ACK and no replay",{
  skip:!url?"Requires disposable PostgreSQL 18":false,timeout:90000
},async()=>{
  const agentSchema="pa02_host_write_"+randomUUID().replaceAll("-","").slice(0,10);
  const ownerSchema="pa02_object_write_"+randomUUID().replaceAll("-","").slice(0,10);
  await preparePostgresObjectExtensionOwnerSchemaV010({connectionString:url,schema:ownerSchema});
  const business=createPostgresObjectExtensionAtomicOwnerV010({
    connectionString:url,schema:ownerSchema});
  const admin=postgres(url,{max:2});
  let runtime,ownerCalls=0,modelCalls=0,authorizationCalls=0,available=true;
  const operation=objectExtensionCapabilityContributionsV010.find(
    contribution=>contribution.operation.operationId===
      OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010
  ).operation;
  const effective={...operation,packageId:OBJECT_EXTENSION_PACKAGE_ID,
    featureId:OBJECT_EXTENSION_FEATURE_ID};
  const manager={
    listEffectiveCapabilityOperations(){return available?[effective]:[];}
  };
  const authProvider={providerId:"pa02.fixture.authorizer",check(i){
    authorizationCalls++;
    return {contractVersion:"0.1.0",
      allowed:i.principal.actorType==="AI" &&
        i.scope.enterpriseId===context.activeContext.enterpriseId &&
        i.resource.type==="enterprise.object-extension.definition",
      policyProviderId:"pa02.fixture.authorizer",reasonCodes:[]};
  }};
  const lossOwner={ownerPackageId:business.owner.ownerPackageId,async invoke(input){
    ownerCalls++;
    await business.owner.invoke(input);
    throw Error("POST_COMMIT_TRANSPORT_REPLY_LOST");
  }};
  const registry=createHostRegisteredAgentOwnerRegistryV040({
    manager,resolveAuthorizationProvider:()=>authProvider,registrations:[{
      operationId:operation.operationId,packageId:OBJECT_EXTENSION_PACKAGE_ID,
      commandCode:operation.binding.commandCode,
      inputVersion:operation.binding.inputVersion,
      modelName:"pa02_object_extension_create",
      owner:lossOwner,verifier:business.verifier,
      validateArguments:args=>Boolean(args.definition&&
        args.definition.extensionId===definition.extensionId)
    }]
  });
  const binding=registry.resolve(operation.operationId);
  assert.ok(binding);
  const provider={providerId:"pa02:fixture",modelId:"fixture",
    async infer(){
      modelCalls++;
      if(modelCalls===1)return {contractVersion:"0.1.0",
        providerId:this.providerId,modelId:this.modelId,text:"",
        toolCalls:[{name:binding.descriptor.modelName,
          arguments:{definition}}],finishReason:"tool_calls"};
      return {contractVersion:"0.1.0",providerId:this.providerId,
        modelId:this.modelId,text:"Object Extension was verified by its Owner",
        toolCalls:[],finishReason:"stop"};
    }
  };
  let catalogWriteCalls=0;
  const catalog=()=>({
    list:()=>[binding.descriptor],
    async invoke(){catalogWriteCalls++;
      throw Error("PA02_UNSAFE_CATALOG_WRITE_INVOKED");
    }
  });
  try {
    // READ_ONLY never opts into Owner, even if a general catalog exposes it.
    await assert.rejects(createOptionalPostgresHostAsyncReadExecutionV030({
      APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE:"UNTRUSTED_WRITE"
    },{resolveProvider:()=>provider,createToolCatalog:catalog,
      trustedOwner:binding}),/PA02_HOST_WORKER_MODE_INVALID/);
    await assert.rejects(createOptionalPostgresHostAsyncReadExecutionV030({
      APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE:"READ_ONLY"
    },{resolveProvider:()=>provider,createToolCatalog:catalog,
      trustedOwner:binding}),/PA02_HOST_WORKER_READ_ONLY_OWNER_FORBIDDEN/);
    await assert.rejects(createOptionalPostgresHostAsyncReadExecutionV030({
      APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE:"OWNER_SANDBOX",
      APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL:url,
      APP_PLATFORM_AGENT_RUN_ASYNC_SCHEMA:agentSchema,
      NODE_ENV:"production",
      APP_PLATFORM_AGENT_RUN_PA02_DEV_OWNER_ACK:"ISOLATED_NO_PRODUCTION_DATA"
    },{resolveProvider:()=>provider,createToolCatalog:catalog,
      trustedOwner:binding}),/PA02_HOST_WORKER_SANDBOX_NOT_ADMITTED/);
    runtime=await createOptionalPostgresHostAsyncReadExecutionV030({
      APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE:"OWNER_SANDBOX",
      APP_PLATFORM_AGENT_RUN_PA02_DEV_OWNER_ACK:"ISOLATED_NO_PRODUCTION_DATA",
      APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL:url,
      APP_PLATFORM_AGENT_RUN_ASYNC_SCHEMA:agentSchema
    },{resolveProvider:()=>provider,createToolCatalog:catalog,
      trustedOwner:binding});
    const old=createAgentRunStoreV010({
      eventStore:createMemoryAgentRunEventStoreV010(),eventId:randomUUID});
    const handlers=new Map(createPersonalAgentRunActionHandlersV010({
      runStore:old,
      runExecutor:{resume(){throw Error("LEGACY_EXECUTOR_FORBIDDEN");}},
      asyncRunRuntime:runtime,
      resolveLlmProvider:()=>({installedProviderIds:[provider.providerId],provider}),
      resolveIdentitySession:()=>({contractVersion:"0.1.0",principal}),
      resolveContext:()=>context,createToolCatalog:catalog,
      runId:()=> "pa02-host-e2e:"+randomUUID(),
      now:()=>new Date("2026-10-14T04:00:00.000Z")
    }).map(handler=>[handler.commandCode,handler]));
    const start=handlers.get("enterprise-agent.run.start");
    const action=request("enterprise-agent.run.start",{
      message:"Create an enterprise Object Extension safely"
    });
    const result=await start.execute(action,requestContext);
    assert.equal(result.ok,true,JSON.stringify(result.error));
    assert.equal(result.result.run.state,"SUCCEEDED");
    assert.equal(result.result.run.observations.length,1);
    assert.equal(result.result.run.observations[0].ok,true);
    assert.equal(result.result.run.actionReceiptIds.length,1);
    assert.equal(result.result.run.finalMessage,
      "Object Extension was verified by its Owner");
    assert.equal(ownerCalls,1);
    assert.equal(catalogWriteCalls,0);
    const resource=await business.getResource({
      contextId:context.activeContext.contextId,
      enterpriseId:context.activeContext.enterpriseId
    },definition.extensionId);
    assert.equal(resource.payload.fieldId,definition.fieldId);
    const receiptId=result.result.run.actionReceiptIds[0];
    const stored=await admin.unsafe('SELECT status FROM "'+agentSchema+
      '".agent_receipts WHERE receipt_id=$1',[receiptId]);
    assert.equal(stored.length,1);
    assert.equal(stored[0].status,"SUCCEEDED");
    const businessProof=await admin.unsafe('SELECT count(*)::int AS n FROM "'+
      ownerSchema+'".pa02_owner_evidence');
    assert.equal(businessProof[0].n,1);

    const duplicate=await start.execute(action,requestContext);
    assert.equal(duplicate.ok,true,JSON.stringify(duplicate.error));
    assert.equal(duplicate.result.run.runId,result.result.run.runId);
    assert.equal(ownerCalls,1);
    assert.equal(modelCalls,2);
    const reload=await handlers.get("enterprise-agent.run.get").execute(
      request("enterprise-agent.run.get",{runId:result.result.run.runId},
        "pa02:host:get"),requestContext);
    assert.equal(reload.ok,true);
    assert.deepEqual(reload.result.run.actionReceiptIds,[receiptId]);

    // A different subject/enterprise can never retrieve the original Run
    // through Host scoped actions, even with its exact run ID.
    const foreignContext={...context,activeContext:{
      ...context.activeContext,enterpriseId:"pa02:foreign:tenant"}};
    const other=await handlers.get("enterprise-agent.run.get").execute(
      request("enterprise-agent.run.get",{runId:result.result.run.runId},
        "pa02:host:other"),{...requestContext,context:foreignContext,
          scope:{...requestContext.scope,enterpriseId:"pa02:foreign:tenant"}});
    assert.equal(other.ok,false);

    available=false;
    assert.equal(registry.resolve(operation.operationId),undefined,
      "uninstall removes Owner discovery");
    assert.equal(await binding.authorize({
      descriptor:binding.descriptor,principal,context,requestContext,
      arguments:{definition}
    }),false,"dispatch is denied after plugin removal");
    assert.ok(authorizationCalls>=1);

    console.log("PA02_HOST_OBJECT_EXTENSION_GOVERNED_WRITE="+JSON.stringify({
      actualHostRunAction:true,realPluginBusinessOwner:true,
      postgresAgentRunAndReceipt:true,ownerReceiptIndependent:true,
      lostAckReconciled:true,ownerInvocations:ownerCalls,
      catalogWriteBypassNeverUsed:true,duplicateHostTurnNoReplay:true,
      foreignScopeDenied:true,uninstalledOwnerDenied:true,
      productionServerModeEnabled:false
    }));
  }finally{
    if(runtime)await runtime.close();
    await business.close();
    for(const schema of [agentSchema,ownerSchema])
      await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');
    await admin.end();
  }
});
