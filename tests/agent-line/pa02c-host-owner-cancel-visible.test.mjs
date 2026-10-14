import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPostgresHostAsyncReadExecutionV030} from
  "../../dist/manager/agent-async-read-worker-runtime.js";
import {createPersonalAgentRunActionHandlersV010} from
  "../../dist/agents/enterprise-agent/run-action-handlers.js";
import {createAgentRunStoreV010,createMemoryAgentRunEventStoreV010} from
  "../../dist/manager/agent-run-store.js";
import {preparePostgresObjectExtensionOwnerSchemaV010,
  createPostgresObjectExtensionAtomicOwnerV010} from
  "../../dist/apps/object-extension/agent-owner-postgres.js";
import {OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010,
  OBJECT_EXTENSION_PACKAGE_ID,OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010} from
  "../../dist/apps/object-extension/constants.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"pa02c-owner-human",
  actorType:"HUMAN",identityProviderId:"fixture"};
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:pa02c-owner-human",ownerSubjectId:principal.subjectId},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"pa02c:enterprise",enterpriseId:"pa02c:tenant"},
  enterpriseContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"pa02c:enterprise",enterpriseId:"pa02c:tenant",lifecycleState:"ACTIVE"}};
const requestContext={contractVersion:"0.1.0",principal,context,
  scope:{contractVersion:"0.1.0",enterpriseId:context.activeContext.enterpriseId,
    userId:principal.subjectId},correlationId:"pa02c-owner:fixture"};
const definition=id=>({
  contractVersion:"0.1.0",extensionId:"ext:pa02c:"+id,
  targetObjectType:"counterparty.subject",targetSlot:"basic",
  namespace:"pa02c",fieldId:"field_"+id,semanticType:"string",
  valueType:"STRING",label:{default:"PA-02C "+id},required:false,
  order:100,surfaces:["DETAIL"]
});
const command=(code,values,actionId)=>({
  contractVersion:"0.1.0",type:"command",
  command:{code,inputVersion:"0.1.0"},values,
  sourceInteractionId:"pa02c:ui",actionId,requiresConfirmation:false
});

test("PA02C real Host cancellation preserves independently verified Object Extension effect and never replays",{
  skip:!url?"Needs disposable PostgreSQL18":false,timeout:90000
},async()=>{
  const schema="pa02_cancel_owner_"+randomUUID().replaceAll("-","").slice(0,12);
  const objectSchema="pa02_cancel_object_"+randomUUID().replaceAll("-","").slice(0,12);
  await preparePostgresObjectExtensionOwnerSchemaV010({
    connectionString:url,schema:objectSchema
  });
  const business=createPostgresObjectExtensionAtomicOwnerV010({
    connectionString:url,schema:objectSchema
  });
  const admin=postgres(url,{max:3});
  let runtime,ackRelease,committedResolve;
  const ackHold=new Promise(resolve=>ackRelease=resolve);
  const ownerCommitted=new Promise(resolve=>committedResolve=resolve);
  let businessCalls=0,modelCalls=0,runNumber=0;
  const descriptor={
    contractVersion:"0.1.0",
    id:OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010,
    modelName:"pa02_create_object_extension",
    title:"Create object extension",description:"Trusted isolated owner",
    effect:"WRITE",ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID,
    capability:OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010,
    inputSchema:{type:"object"}
  };
  const trustedOwner={
    descriptor,verifier:business.verifier,
    owner:{ownerPackageId:OBJECT_EXTENSION_PACKAGE_ID,
      async invoke(input){
        businessCalls++;
        await business.owner.invoke(input);
        committedResolve();
        await ackHold;
        // Real business commit succeeded, but Host never receives its ACK.
        throw Error("PA02C_POST_COMMIT_ACK_LOST");
      }},
    authorize:async()=>true
  };
  const provider={providerId:"pa02c:fixture",modelId:"fixture",
    async infer(){
      modelCalls++;
      if(modelCalls===1)return {contractVersion:"0.1.0",
        providerId:this.providerId,modelId:this.modelId,text:"",
        toolCalls:[{name:descriptor.modelName,
          arguments:{definition:definition("cancel-race")}}],finishReason:"tool_calls"};
      throw Error("CANCELLED_RUN_MUST_NOT_INFER_AGAIN");
    }
  };
  const catalog=()=>({list:()=>[descriptor],
    async invoke(){throw Error("UNSAFE_CATALOG_WRITE");}});
  const actions=()=>new Map(createPersonalAgentRunActionHandlersV010({
    runStore:createAgentRunStoreV010({
      eventStore:createMemoryAgentRunEventStoreV010(),eventId:randomUUID
    }),
    runExecutor:{resume(){throw Error("V010_LEGACY_EXECUTOR_FORBIDDEN");}},
    asyncRunRuntime:runtime,
    resolveLlmProvider:()=>({installedProviderIds:[provider.providerId],provider}),
    resolveIdentitySession:()=>({contractVersion:"0.1.0",principal}),
    resolveContext:()=>context,
    createToolCatalog:catalog,runId:()=> "run:pa02c:"+(++runNumber),
    now:()=>new Date("2026-10-14T04:00:00.000Z")
  }).map(handler=>[handler.commandCode,handler]));
  try{
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog,trustedOwner}
    });
    const handlers=actions();
    const start=handlers.get("enterprise-agent.run.start");
    const cancel=handlers.get("enterprise-agent.run.cancel");
    const get=handlers.get("enterprise-agent.run.get");
    const runId="agent-run:run:pa02c:1";
    const inFlight=start.execute(command("enterprise-agent.run.start",{
      message:"Create Object Extension safely"
    },"pa02c:source:1"),requestContext);
    await ownerCommitted;
    const requested=await cancel.execute(command("enterprise-agent.run.cancel",{
      runId,reason:"Stop this run now"
    },"pa02c:cancel:1"),requestContext);
    assert.equal(requested.ok,true,JSON.stringify(requested.error));
    assert.equal(requested.result.cancellationState,"REQUESTED");
    assert.equal(requested.result.run.actionReceiptIds.length,0);
    assert.equal(businessCalls,1);
    ackRelease();
    // The previous Worker must not append success after cancellation; it
    // releases the lease, reconciles Owner evidence, and cannot regain fence.
    const stale=await inFlight;
    assert.equal(stale.ok,true,JSON.stringify(stale.error));
    const done=await cancel.execute(command("enterprise-agent.run.cancel",{
      runId,reason:"Stop this run now"
    },"pa02c:cancel:2"),requestContext);
    assert.equal(done.ok,true,JSON.stringify(done.error));
    assert.equal(done.result.cancellationState,"CANCELLED");
    assert.equal(done.result.run.state,"CANCELLED");
    assert.deepEqual(done.result.run.observations.map(o=>o.ok),[true]);
    assert.equal(done.result.run.actionReceiptIds.length,1);
    const receiptId=done.result.run.actionReceiptIds[0];
    assert.equal(done.result.run.observations[0].result.receiptId,receiptId);
    const persisted=await get.execute(command("enterprise-agent.run.get",{
      runId
    },"pa02c:get:1"),requestContext);
    assert.equal(persisted.ok,true);
    assert.equal(persisted.result.run.state,"CANCELLED");
    assert.deepEqual(persisted.result.run.actionReceiptIds,[receiptId]);
    const types=(await admin.unsafe('SELECT payload->>\'type\' AS type FROM "'+
      schema+'".agent_run_events WHERE run_id=$1 ORDER BY ordinal',[runId]))
      .map(r=>r.type);
    assert.deepEqual(types.slice(-2),[
      "TOOL_OBSERVATION_RECORDED","RUN_CANCELLED"
    ]);
    assert.equal(types.includes("RUN_SUCCEEDED"),false);
    const evidence=await admin.unsafe('SELECT count(*)::int AS n FROM "'+
      objectSchema+'".pa02_owner_evidence');
    assert.equal(evidence[0].n,1);
    const receipts=await admin.unsafe('SELECT status FROM "'+schema+
      '".agent_receipts');
    assert.deepEqual(receipts.map(r=>r.status),["SUCCEEDED"]);
    const duplicated=await cancel.execute(command("enterprise-agent.run.cancel",{
      runId,reason:"Stop this run now"
    },"pa02c:cancel:3"),requestContext);
    assert.equal(duplicated.ok,true);
    assert.equal(duplicated.result.run.actionReceiptIds.length,1);
    assert.equal(businessCalls,1,"no Owner replay after cancellation");
    assert.equal(modelCalls,1,"cancelled Run cannot resume model");

    await runtime.close();runtime=undefined;
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog,trustedOwner}
    });
    const restored=await runtime.read({runId,principal,context});
    assert.equal(restored.state,"CANCELLED");
    assert.deepEqual(restored.actionReceiptIds,[receiptId]);
    assert.equal((await runtime.resume({runId,principal,context,requestContext})).state,
      "CANCELLED");
    assert.equal(businessCalls,1);
    console.log("PA02C_HOST_OWNER_CANCEL_VISIBLE="+JSON.stringify({
      status:"PASS",realHostAction:true,activeWriteCancelRequested:true,
      realBusinessCommittedBeforeAck:true,staleWorkerBlockedAfterCancel:true,
      verifiedReceiptRecordedAtomicallyWithCancel:true,
      terminalCancelledRetainsCommittedEffect:true,
      duplicateCancelIdempotent:true,restartedHostRestoresHistory:true,
      ownerInvocations:businessCalls,productionUsed:false
    }));
  }finally{
    ackRelease?.();
    if(runtime)await runtime.close();
    await business.close();
    for(const name of [schema,objectSchema])
      await admin.unsafe('DROP SCHEMA IF EXISTS "'+name+'" CASCADE');
    await admin.end();
  }
});
