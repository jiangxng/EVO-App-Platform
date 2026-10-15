import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { createPostgresHostAsyncReadExecutionV030 } from
  "../../dist/manager/agent-async-read-worker-runtime.js";
import { createPersonalAgentRunActionHandlersV010 } from
  "../../dist/agents/enterprise-agent/run-action-handlers.js";
import { createAgentRunStoreV010, createMemoryAgentRunEventStoreV010 } from
  "../../dist/manager/agent-run-store.js";

const url = process.env.PA02A_PROOF_DATABASE_URL;
const principal = { contractVersion:"0.1.0", subjectId:"pa04-c03-person",
  actorType:"HUMAN", identityProviderId:"fixture" };
const context = { contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:pa04-c03-person", ownerSubjectId:principal.subjectId},
  activeContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:pa04-c03-person"} };
function handlers(runtime,provider,catalog) {
  return new Map(createPersonalAgentRunActionHandlersV010({
    runStore:createAgentRunStoreV010({
      eventStore:createMemoryAgentRunEventStoreV010(),eventId:randomUUID
    }),
    runExecutor:{resume(){throw Error("LEGACY_EXECUTOR_NOT_ALLOWED");}},
    asyncRunRuntime:runtime,
    resolveLlmProvider:()=>({installedProviderIds:[provider.providerId],provider}),
    resolveIdentitySession:()=>({contractVersion:"0.1.0",principal}),
    resolveContext:()=>context,createToolCatalog:catalog,
    runId:randomUUID,now:()=>new Date()
  }).map(h=>[h.commandCode,h]));
}
function action(label) { return {
  contractVersion:"0.1.0",type:"command",
  command:{code:"enterprise-agent.run.start",inputVersion:"0.1.0"},
  values:{message:"Answer from current authoritative READ: "+label},
  sourceInteractionId:"pa04:c03:ui",actionId:"pa04:c03:"+label,
  requiresConfirmation:false
};}
const descriptor={contractVersion:"0.1.0",id:"test.read",
  modelName:"test_read",title:"Read",description:"Authoritative READ",
  inputSchema:{type:"object",properties:{resourceId:{type:"string"}}},
  effect:"READ",ownerPackageId:"isolated-fixture"};

test("PA04 C03: PostgreSQL Run only answers after current READ refresh; durable audit preserves old and new source",{
  skip:!url?"Needs disposable PostgreSQL18":false,timeout:90000
},async()=>{
  const schema="pa04_c03_"+randomUUID().replaceAll("-","").slice(0,12);
  const db=postgres(url,{max:2});
  let runtime, modelCalls=0,readCalls=0, assessments=0;
  const provider={providerId:"pa04-c03-fixture",modelId:"isolated-model",
    async infer(request) {
      modelCalls++;
      const developer=request.messages.findLast(m=>m.role==="developer")?.content??"";
      if(modelCalls===1)return {contractVersion:"0.1.0",
        providerId:this.providerId,modelId:this.modelId,text:"",
        toolCalls:[{name:"test_read",arguments:{resourceId:"invoice-7"}}],
        finishReason:"tool_calls"};
      assert.match(developer,/INVOICE_VERSION_2/);
      assert.doesNotMatch(developer,/INVOICE_VERSION_1/);
      return {contractVersion:"0.1.0",providerId:this.providerId,
        modelId:this.modelId,text:"Verified invoice version 2",
        toolCalls:[],finishReason:"stop"};
    }
  };
  const catalog=()=>({list:()=>[structuredClone(descriptor)],
    async invoke(call) {
      assert.equal(call.tool,"test.read");
      assert.deepEqual(call.arguments,{resourceId:"invoice-7"});
      readCalls++;
      return {tool:call.tool,ok:true,result:{
        value:"INVOICE_VERSION_"+readCalls,version:readCalls
      }};
    }});
  const freshness={async assess({decision,descriptor,principal:actor,context:ctx}) {
    assessments++;
    assert.equal(descriptor.effect,"READ");
    assert.equal(actor.subjectId,principal.subjectId);
    assert.equal(ctx.activeContext.contextId,context.activeContext.contextId);
    return {status:decision.refreshedAt?"CURRENT":"REFRESH_REQUIRED",
      sourceVersion:"invoice-7@version-2"};
  }};
  try {
    const create=()=>createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,deps:{resolveProvider:()=>provider,
        createToolCatalog:catalog,readFreshness:freshness}
    });
    runtime=await create();
    const result=await handlers(runtime,provider,catalog).get(
      "enterprise-agent.run.start").execute(action("fresh-invoice"));
    assert.equal(result.ok,true,JSON.stringify(result.error));
    const run=result.result.run;
    assert.equal(run.state,"SUCCEEDED",JSON.stringify(run.blocker));
    assert.equal(run.finalMessage,"Verified invoice version 2");
    assert.equal(modelCalls,2);
    assert.equal(readCalls,2,"Host re-reads after prior READ before model inference");
    assert.equal(assessments,1);
    assert.equal(run.observations.length,1);
    assert.equal(run.observations[0].result.value,"INVOICE_VERSION_2");
    assert.equal(run.decisions[0].observation.result.value,"INVOICE_VERSION_2");
    assert.equal(run.decisions[0].refreshSourceVersion,"invoice-7@version-2");
    assert.ok(run.decisions[0].refreshedAt);
    const rows=await db.unsafe('SELECT type,payload FROM "'+schema+
      '".agent_run_events WHERE run_id=$1 ORDER BY ordinal',[run.runId]);
    const refresh=rows.filter(x=>x.type==="READ_REFRESH_RECORDED");
    assert.equal(refresh.length,1);
    assert.equal(refresh[0].payload.observation.result.value,"INVOICE_VERSION_2");
    assert.equal(rows.filter(x=>x.type==="TOOL_OBSERVATION_RECORDED").length,1);
    assert.ok(JSON.stringify(rows).includes("INVOICE_VERSION_1"),
      "immutable original READ evidence remains in source events");
    const runId=run.runId;
    await runtime.close();runtime=undefined;
    runtime=await create();
    const recovered=await runtime.read({runId,principal,context});
    assert.equal(recovered.observations[0].result.value,"INVOICE_VERSION_2");
    assert.equal(recovered.decisions[0].refreshSourceVersion,"invoice-7@version-2");
    assert.equal(modelCalls,2,"restart never repeats accepted inference");
    assert.equal(readCalls,2,"restart never repeats already-durable refresh");
    console.log("PA04_C03_FRESH_READ_PG="+JSON.stringify({
      currentAuthorizedReadReexecuted:true,
      staleReadNotPassedToModel:true,
      originalAuditPreserved:true,refreshedResultDurable:true,
      restartNoDuplicateWork:true,productionUsed:false
    }));
  }finally{
    await runtime?.close();
    try{await db.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await db.end();}
  }
});

test("PA04 C03: source revocation prevents a model from using an old READ after recovery",{
  skip:!url?"Needs disposable PostgreSQL18":false,timeout:90000
},async()=>{
  const schema="pa04_c03_revoke_"+randomUUID().replaceAll("-","").slice(0,12);
  const db=postgres(url,{max:2});let runtime,models=0,reads=0,authorized=true;
  const provider={providerId:"pa04-c03-revoked",modelId:"fixture",
    async infer() {
      models++;
      if(models!==1)throw Error("MODEL_MUST_NOT_RECEIVE_UNAUTHORIZED_OLD_READ");
      return {contractVersion:"0.1.0",providerId:this.providerId,
        modelId:this.modelId,text:"",
        toolCalls:[{name:"test_read",arguments:{resourceId:"secret"}}],
        finishReason:"tool_calls"};
    }};
  const catalog=()=>({list:()=>authorized?[structuredClone(descriptor)]:[],
    async invoke(call) {
      reads++;authorized=false;
      return {tool:call.tool,ok:true,result:{sensitive:"READ_BEFORE_REVOCATION"}};
    }});
  const freshness={async assess(){return {
    status:"REFRESH_REQUIRED",sourceVersion:"resource@version-2"
  };}};
  try{
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog,
        readFreshness:freshness}
    });
    const result=await handlers(runtime,provider,catalog).get(
      "enterprise-agent.run.start").execute(action("revoked"));
    assert.equal(result.ok,true,JSON.stringify(result.error));
    assert.equal(result.result.run.state,"BLOCKED");
    assert.equal(result.result.run.blocker.code,"PA04_READ_AUTHORITY_REVOKED");
    assert.equal(reads,1);
    assert.equal(models,1);
    assert.equal(result.result.run.observations[0].result.sensitive,
      "READ_BEFORE_REVOCATION", "old audit remains but is not model input");
    const runId=result.result.run.runId;
    await runtime.close();runtime=undefined;
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog,
        readFreshness:freshness}
    });
    assert.equal((await runtime.resume({runId,principal,context})).blocker.code,
      "PA04_READ_AUTHORITY_REVOKED");
    assert.equal(models,1);
    console.log("PA04_C03_REVOKED_READ_PG="+JSON.stringify({
      sourceRemovedFromCatalog:true,staleModelInferencePrevented:true,
      originalEvidenceDurable:true,terminalBlockerDurable:true,
      productionUsed:false
    }));
  }finally{
    await runtime?.close();
    try{await db.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await db.end();}
  }
});

test("PA04 C03: unverified freshness blocks inference without dispatching refresh",{
  skip:!url?"Needs disposable PostgreSQL18":false,timeout:90000
},async()=>{
  const schema="pa04_c03_unknown_"+randomUUID().replaceAll("-","").slice(0,12);
  const db=postgres(url,{max:2});let runtime,models=0,reads=0;
  const provider={providerId:"pa04-c03-unknown",modelId:"fixture",
    async infer(){
      models++;
      if(models!==1)throw Error("INFERENCE_AFTER_UNVERIFIED_FRESHNESS");
      return {contractVersion:"0.1.0",providerId:this.providerId,
        modelId:this.modelId,text:"",
        toolCalls:[{name:"test_read",arguments:{resourceId:"invoice-7"}}],
        finishReason:"tool_calls"};
    }};
  const catalog=()=>({list:()=>[structuredClone(descriptor)],
    async invoke(call) {reads++;return {tool:call.tool,ok:true,result:{old:true}};}});
  try {
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog,
        readFreshness:{async assess(){throw Error("SOURCE_VERSION_UNKNOWN");}}
      }
    });
    const result=await handlers(runtime,provider,catalog).get(
      "enterprise-agent.run.start").execute(action("unknown-freshness"));
    assert.equal(result.ok,true,JSON.stringify(result.error));
    assert.equal(result.result.run.state,"BLOCKED");
    assert.equal(result.result.run.blocker.code,"PA04_READ_FRESHNESS_UNVERIFIED");
    assert.equal(reads,1);
    assert.equal(models,1);
  }finally{
    await runtime?.close();
    try{await db.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await db.end();}
  }
});
