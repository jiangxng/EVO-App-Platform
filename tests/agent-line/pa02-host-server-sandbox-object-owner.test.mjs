import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import postgres from "postgres";
import {
  preparePostgresObjectExtensionOwnerSchemaV010
} from "../../dist/apps/object-extension/agent-owner-postgres.js";
import {objectExtensionCapabilityContributionsV010} from
  "../../dist/apps/object-extension/capability-manifest.js";
import {OBJECT_EXTENSION_PACKAGE_ID,OBJECT_EXTENSION_FEATURE_ID,
  OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010} from
  "../../dist/apps/object-extension/constants.js";
import {createOptionalPa02SandboxObjectOwnerV010} from
  "../../dist/manager/agent-pa02-sandbox-object-extension.js";
import {createOptionalPostgresHostAsyncReadExecutionV030} from
  "../../dist/manager/agent-async-read-worker-runtime.js";
import {createThreadBackedAgentTurnActionHandlersV010} from
  "../../dist/agents/enterprise-agent/thread-turn-action-handlers.js";
import {createAgentRunStoreV010,createMemoryAgentRunEventStoreV010}
  from "../../dist/manager/agent-run-store.js";
import {createConversationThreadStoreV010,createMemoryConversationThreadEventStoreV010}
  from "../../dist/manager/conversation-thread-store.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"pa02-host-sandbox-human",
  actorType:"HUMAN",identityProviderId:"fixture"};
const contextId="pa02-sandbox:object-extension-context";
const enterpriseId="pa02-sandbox:enterprise";
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:pa02-host-sandbox-human",ownerSubjectId:principal.subjectId},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId,enterpriseId},
  enterpriseContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId,enterpriseId,lifecycleState:"ACTIVE"}};
const requestContext={contractVersion:"0.1.0",principal,context,
  scope:{contractVersion:"0.1.0",enterpriseId,userId:principal.subjectId},
  correlationId:"pa02:sandbox:thread"};
const definition={contractVersion:"0.1.0",
  extensionId:"pa02-sandbox:extension:created",
  targetObjectType:"counterparty.subject",targetSlot:"basic",
  namespace:"pa02-test",fieldId:"agentCreated",
  semanticType:"text",valueType:"STRING",
  label:{default:"PA02 test"},required:false,order:10,
  surfaces:["DETAIL"]};
const operation=objectExtensionCapabilityContributionsV010.find(
  c=>c.operation.operationId===OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010
).operation;
const effective={...operation,packageId:OBJECT_EXTENSION_PACKAGE_ID,
  featureId:OBJECT_EXTENSION_FEATURE_ID};
const action=(threadId,message)=>({
  contractVersion:"0.1.0",type:"command",
  command:{code:"enterprise-agent.thread.send",inputVersion:"0.1.0"},
  sourceInteractionId:"sandbox-ui",actionId:"pa02-send",
  requiresConfirmation:false,
  values:{threadId,clientTurnId:"sandbox-turn-1",message}
});

test("PA02 Server sandbox composition: ordinary thread.send discovers authorized Capability Owner and reconciles SQL effect",{
  skip:!url?"Needs disposable PostgreSQL18":false,timeout:90000
},async()=>{
  // Worker uses the real clock and a 72h Run lifetime: this is a new Run fixture.
  const fixtureEpoch=Date.now();
  const runSchema="pa02_host_chat_"+randomUUID().replaceAll("-","").slice(0,10);
  const objectSchema="pa02_host_object_"+randomUUID().replaceAll("-","").slice(0,10);
  await preparePostgresObjectExtensionOwnerSchemaV010({connectionString:url,schema:objectSchema});
  const admin=postgres(url,{max:3});
  let sandbox,runtime,active=true,allowed=true,fileConflict=false;
  let modelCalls=0,readCalls=0;
  const manager={listEffectiveCapabilityOperations(){
    return active?[effective]:[];
  }};
  const authProvider={providerId:"sandbox-auth",check(i){
    return {contractVersion:"0.1.0",
      allowed:allowed&&i.principal.actorType==="AI"&&
        i.scope.enterpriseId===enterpriseId&&
        i.resource.type==="enterprise.object-extension.definition",
      policyProviderId:"sandbox-auth",reasonCodes:[]};
  }};
  const resources={list(){return fileConflict?[{resourceId:"shadow"}]:[]}};
  const options={
    APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE:"OWNER_SANDBOX",
    APP_PLATFORM_AGENT_RUN_PA02_DEV_OWNER_ACK:"ISOLATED_NO_PRODUCTION_DATA",
    APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL:url,
    APP_PLATFORM_AGENT_RUN_ASYNC_SCHEMA:runSchema,
    APP_PLATFORM_AGENT_RUN_PA02_OBJECT_SCHEMA:objectSchema,
    APP_PLATFORM_AGENT_RUN_PA02_SANDBOX_CONTEXT_ID:contextId,
    APP_PLATFORM_AGENT_RUN_PA02_SANDBOX_ENTERPRISE_ID:enterpriseId
  };
  const deps={manager,resolveAuthorizationProvider:()=>authProvider,resources};
  try {
    assert.equal(await createOptionalPa02SandboxObjectOwnerV010({},deps),undefined);
    await assert.rejects(createOptionalPa02SandboxObjectOwnerV010({
      ...options,NODE_ENV:"development",
      APP_PLATFORM_AGENT_RUN_PA02_TEST_POST_COMMIT_ACK_LOSS:"ackLostProof"
    },deps),/PA02_HOST_OWNER_TEST_FAULT_NOT_ADMITTED/);
    await assert.rejects(createOptionalPa02SandboxObjectOwnerV010({
      ...options,NODE_ENV:"test",
      APP_PLATFORM_AGENT_RUN_PA02_TEST_POST_COMMIT_ACK_LOSS:"wrongField"
    },deps),/PA02_HOST_OWNER_TEST_FAULT_NOT_ADMITTED/);
    await assert.rejects(createOptionalPa02SandboxObjectOwnerV010({
      ...options,NODE_ENV:"production"
    },deps),/PA02_HOST_OBJECT_SANDBOX_NOT_ADMITTED/);
    await assert.rejects(createOptionalPa02SandboxObjectOwnerV010({
      ...options,APP_PLATFORM_AGENT_RUN_PA02_SANDBOX_CONTEXT_ID:"real-customer"
    },deps),/PA02_HOST_OBJECT_SANDBOX_SCOPE_INVALID/);
    fileConflict=true;
    await assert.rejects(createOptionalPa02SandboxObjectOwnerV010(options,deps),
      /PA02_HOST_OBJECT_SANDBOX_FILE_AUTHORITY_CONFLICT/);
    fileConflict=false;
    sandbox=await createOptionalPa02SandboxObjectOwnerV010(options,deps);
    assert.ok(sandbox);
    assert.equal(await sandbox.isAuthorized({principal,context,requestContext}),true);
    allowed=false;
    assert.equal(await sandbox.isAuthorized({principal,context,requestContext}),false);
    allowed=true;
    const other={...context,activeContext:{...context.activeContext,
      contextId:"pa02-sandbox:other"}};
    assert.equal(await sandbox.isAuthorized({principal,context:other,
      requestContext:{...requestContext,context:other}}),false);

    const provider={providerId:"pa02-sandbox-llm",modelId:"fixture",async infer(){
      modelCalls++;
      if(modelCalls===1)return {contractVersion:"0.1.0",providerId:this.providerId,
        modelId:this.modelId,text:"",
        toolCalls:[{name:"pa02_object_extension_create",
          arguments:{definition}}],finishReason:"tool_calls"};
      return {contractVersion:"0.1.0",providerId:this.providerId,
        modelId:this.modelId,text:"Object Extension persisted safely",
        toolCalls:[],finishReason:"stop"};
    }};
    const generic={contractVersion:"0.1.0",
      id:"evo.capabilities.search",modelName:"evo_capabilities_search",
      title:"Search generic operations",description:"Authorized capabilities",
      inputSchema:{type:"object"},effect:"READ",ownerPackageId:"evo-app-platform"};
    let sawAuthorizedOwner=false;
    const catalog=()=>({
      list:()=>[generic],
      async invoke(){readCalls++;throw Error("UNEXPECTED_CATALOG_INVOKE");}
    });
    const wrappedProvider={...provider,async infer(params){
      sawAuthorizedOwner=sawAuthorizedOwner||params.tools.some(t=>
        t.name==="pa02_object_extension_create");
      assert.equal(params.tools.some(t=>t.name==="untrusted_write"),false);
      return provider.infer(params);
    }};
    runtime=await createOptionalPostgresHostAsyncReadExecutionV030(options,{
      resolveProvider:()=>wrappedProvider,createToolCatalog:catalog,
      trustedOwner:sandbox.binding,discoverTrustedOwner:sandbox.isAuthorized
    });
    const runStore=createAgentRunStoreV010({
      eventStore:createMemoryAgentRunEventStoreV010(),eventId:randomUUID
    });
    const threadStore=createConversationThreadStoreV010({
      eventStore:createMemoryConversationThreadEventStoreV010(),eventId:randomUUID
    });
    const threadId="thread:pa02:host:"+randomUUID();
    threadStore.create({
      threadId,principalSubjectId:principal.subjectId,
      principalActorType:principal.actorType,
      context:context.activeContext,createdAt:new Date(fixtureEpoch).toISOString()
    });
    const handlers=new Map(createThreadBackedAgentTurnActionHandlersV010({
      threadStore,runStore,runExecutor:{
        resume(){throw Error("LEGACY_RUN_EXECUTOR_MUST_NOT_BE_USED");}
      },
      asyncRunReader:runtime.read,asyncRunResumer:runtime.resume,
      asyncTurnLookup:runtime.getByTurn,asyncTurnClaimer:runtime.claim,
      resolveLlmProvider:()=>({installedProviderIds:[provider.providerId],
        provider:wrappedProvider}),
      resolveIdentitySession:()=>({contractVersion:"0.1.0",
        sessionId:"fixture-session",principal}),
      resolveContext:()=>context,createToolCatalog:catalog,
      runId:randomUUID,now:(()=>{let n=0;return ()=>
        new Date(fixtureEpoch+3000+(n++)*1000);})()
    }).map(h=>[h.commandCode,h]));
    const send=handlers.get("enterprise-agent.thread.send");
    const request=action(threadId,"Create Object Extension");
    const result=await send.execute(request,requestContext);
    assert.equal(result.ok,true,JSON.stringify(result.error));
    assert.equal(result.result.run.state,"SUCCEEDED",JSON.stringify(result.result.run));
    assert.equal(result.result.run.actionReceiptIds.length,1);
    assert.equal(sawAuthorizedOwner,true,"direct Owner added after Host Capability lookup");
    assert.equal(readCalls,0,"generic catalog never executes material WRITE");
    assert.equal(modelCalls,2);
    const repeat=await send.execute(request,requestContext);
    assert.equal(repeat.ok,true,JSON.stringify(repeat.error));
    assert.equal(repeat.result.run.runId,result.result.run.runId);
    assert.equal(modelCalls,2,"duplicate user turn cannot repeat Owner decision");
    const conversation=await threadStore.get(threadId);
    assert.equal(conversation.messages.filter(m=>m.role==="USER").length,1);
    assert.equal(conversation.messages.filter(m=>m.role==="ASSISTANT").length,1);
    const resource=await admin.unsafe('SELECT resource FROM "'+objectSchema+
      '".pa02_definitions WHERE extension_id=$1',[definition.extensionId]);
    assert.equal(resource.length,1);
    const proof=await admin.unsafe('SELECT count(*)::int AS n FROM "'+objectSchema+
      '".pa02_owner_evidence');
    assert.equal(proof[0].n,1);
    const receipts=await admin.unsafe('SELECT status FROM "'+runSchema+
      '".agent_receipts');
    assert.deepEqual(receipts.map(r=>r.status),["SUCCEEDED"]);
    active=false;
    assert.equal(await sandbox.isAuthorized({principal,context,requestContext}),false);
    active=true;
    fileConflict=true;
    assert.equal(await sandbox.isAuthorized({principal,context,requestContext}),false);
    console.log("PA02_SANDBOX_SERVER_THREAD_OWNER="+JSON.stringify({
      normalThreadSend:true,
      genericCatalogBeforeHostDiscovery:true,
      ownerVisibleOnlyWhenAuthorized:true,
      domainResourceAndImmutableReceipt:true,
      runReceiptSucceeded:true,
      dedupedTurnAndMessages:true,
      productionRejected:true,
      wrongContextDenied:true,
      fileAuthorityCollisionDenied:true,
      noProductionCutover:true
    }));
  }finally{
    await runtime?.close();
    await sandbox?.close();
    for(const schema of [runSchema,objectSchema])
      await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');
    await admin.end();
  }
});
