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

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"pa02-r03-r10-human",
  actorType:"HUMAN",identityProviderId:"fixture"};
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:pa02-r03-r10-human",
    ownerSubjectId:principal.subjectId},
  activeContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:pa02-r03-r10-human"}};
const request=(code,values,actionId)=>({
  contractVersion:"0.1.0",type:"command",
  command:{code,inputVersion:"0.1.0"},values,
  sourceInteractionId:"pa02:r03:r10:ui",actionId,
  requiresConfirmation:false
});
function handlerMap(runtime,provider,catalog,createdAt="2026-10-14T07:00:00.000Z"){
  return new Map(createPersonalAgentRunActionHandlersV010({
    runStore:createAgentRunStoreV010({
      eventStore:createMemoryAgentRunEventStoreV010(),eventId:randomUUID
    }),
    runExecutor:{resume(){throw Error("LEGACY_EXECUTOR_FORBIDDEN");}},
    asyncRunRuntime:runtime,
    resolveLlmProvider:()=>({installedProviderIds:[provider.providerId],provider}),
    resolveIdentitySession:()=>({contractVersion:"0.1.0",principal}),
    resolveContext:()=>context,createToolCatalog:catalog,
    runId:randomUUID,now:()=>new Date(createdAt)
  }).map(h=>[h.commandCode,h]));
}
test("PA02 R03: Host model retry 2 failures then verified final, permanent failure stops at 3 with no false success",{
  skip:!url?"Needs disposable PostgreSQL18":false,timeout:90000
},async()=>{
  const schema="pa02_r03_"+randomUUID().replaceAll("-","").slice(0,12);
  const db=postgres(url,{max:2});
  let runtime,recovered;
  let calls=0;
  const provider={providerId:"pa02-model",modelId:"fixed",
    async infer(r){
      calls++;
      const question=r.messages.findLast(m=>m.role==="user")?.content??"";
      if(question.includes("permanent")||question.includes("recover")&&calls<=2)
        throw Error("MODEL_PROVIDER_TRANSIENT");
      return {contractVersion:"0.1.0",providerId:this.providerId,
        modelId:this.modelId,text:"Recovered without false business writes",
        toolCalls:[],finishReason:"stop"};
    }
  };
  const catalog=()=>({list:()=>[],async invoke(){
    throw Error("NO_TOOL_DISPATCH");
  }});
  try{
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog}
    });
    const handlers=handlerMap(runtime,provider,catalog);
    const start=handlers.get("enterprise-agent.run.start");
    const good=await start.execute(request("enterprise-agent.run.start",{
      message:"recover after temporary provider failure"
    },"pa02:r03:good"));
    assert.equal(good.ok,true,JSON.stringify(good.error));
    assert.equal(good.result.run.state,"SUCCEEDED");
    assert.equal(good.result.run.modelFailureCount,0);
    assert.equal(calls,3);
    const goodRows=await db.unsafe('SELECT payload FROM "'+schema+
      '".agent_run_events WHERE run_id=$1 ORDER BY ordinal',
      [good.result.run.runId]);
    assert.equal(goodRows.map(r=>typeof r.payload==="string"
      ?JSON.parse(r.payload):r.payload).filter(e=>e.type==="MODEL_INFERENCE_FAILED").length,2);
    await runtime.close();runtime=undefined;
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog}
    });
    const persisted=await runtime.read({runId:good.result.run.runId,
      principal,context});
    assert.equal(persisted.state,"SUCCEEDED");
    assert.equal(persisted.modelFailureCount,0);
    const duplicate=await handlerMap(runtime,provider,catalog).get(
      "enterprise-agent.run.start").execute(
      request("enterprise-agent.run.start",{
        message:"recover after temporary provider failure"
      },"pa02:r03:good"));
    assert.equal(duplicate.ok,true);
    assert.equal(duplicate.result.run.runId,persisted.runId);
    assert.equal(calls,3);

    const failed=await handlerMap(runtime,provider,catalog).get(
      "enterprise-agent.run.start").execute(
      request("enterprise-agent.run.start",{
        message:"permanent provider error"
      },"pa02:r03:bad"));
    assert.equal(failed.ok,true);
    assert.equal(failed.result.run.state,"FAILED");
    assert.equal(failed.result.run.modelFailureCount,3);
    assert.equal(failed.result.run.error.code,"PA02_MODEL_RETRY_EXHAUSTED");
    assert.equal(failed.result.run.finalMessage,undefined);
    assert.equal(failed.result.run.observations.length,0);
    assert.equal(failed.result.run.actionReceiptIds.length,0);
    assert.equal(calls,6,"permanent model error never retries indefinitely");
    const stop=await runtime.resume({runId:failed.result.run.runId,
      principal,context});
    assert.equal(stop.state,"FAILED");
    assert.equal(calls,6);
    const audit=await db.unsafe('SELECT payload FROM "'+schema+
      '".agent_run_events WHERE run_id=$1 ORDER BY ordinal',
      [failed.result.run.runId]);
    const types=audit.map(r=>(typeof r.payload==="string"
      ?JSON.parse(r.payload):r.payload).type);
    assert.equal(types.filter(t=>t==="MODEL_INFERENCE_FAILED").length,3);
    assert.equal(types.filter(t=>t==="RUN_FAILED").length,1);
    assert.equal(types.includes("RUN_SUCCEEDED"),false);
    console.log("PA02_R03_DURABLE_MODEL_RETRY="+JSON.stringify({
      temporaryTwoFailuresRecovered:true,permanentThreeFailuresTerminal:true,
      persistedModelAttemptBudget:true,duplicateHostActionNoReInference:true,
      noFalseSuccessOrFakeReceipt:true,productionUsed:false
    }));
  }finally{
    await recovered?.close();
    await runtime?.close();
    try{await db.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await db.end();}
  }
});
test("PA02 R10: total 24 durable Run slices cannot be bypassed by repeated Host resume or process restart",{
  skip:!url?"Needs disposable PostgreSQL18":false,timeout:90000
},async()=>{
  const schema="pa02_r10_"+randomUUID().replaceAll("-","").slice(0,12);
  const db=postgres(url,{max:2});
  let runtime;
  let calls=0,reads=0;
  const provider={providerId:"pa02-budget",modelId:"loop",
    async infer(){calls++;return {contractVersion:"0.1.0",providerId:this.providerId,
      modelId:this.modelId,text:"",
      toolCalls:[{name:"test_read",arguments:{iteration:calls}}],
      finishReason:"tool_calls"};}
  };
  const catalog=()=>({
    list:()=>[{contractVersion:"0.1.0",
      id:"test.read",modelName:"test_read",title:"Read",description:"sandbox",
      inputSchema:{type:"object",properties:{iteration:{type:"integer"}}},
      effect:"READ",ownerPackageId:"test"}],
    async invoke(call){reads++;return {tool:call.tool,ok:true,
      result:{value:"evidence:"+reads}};}
  });
  try{
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog}
    });
    const handlers=handlerMap(runtime,provider,catalog);
    const started=await handlers.get("enterprise-agent.run.start").execute(
      request("enterprise-agent.run.start",{
        message:"loop until the budget stops"
      },"pa02:r10:client"));
    assert.equal(started.ok,true,JSON.stringify(started.error));
    const runId=started.result.run.runId;
    let run=started.result.run;
    assert.equal(run.sliceCount,24);
    for(let i=0;i<3&&!["BLOCKED","FAILED"].includes(run.state);i++){
      const resumed=await handlers.get("enterprise-agent.run.resume").execute(
        request("enterprise-agent.run.resume",{runId},"pa02:r10:resume:"+i));
      assert.equal(resumed.ok,true,JSON.stringify(resumed.error));
      run=resumed.result.run;
    }
    assert.equal(run.state,"BLOCKED");
    assert.equal(run.blocker.code,"PA02_RUN_SLICE_BUDGET_EXHAUSTED");
    assert.match(run.blocker.reason,/narrower request/i);
    assert.equal(run.sliceCount,24);
    assert.equal(calls,24);
    assert.equal(reads,24);
    assert.equal(run.actionReceiptIds.length,0);
    const {lastEventId}=run;
    await runtime.close();runtime=undefined;
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog}
    });
    const recovered=await runtime.resume({runId,principal,context});
    assert.equal(recovered.state,"BLOCKED");
    assert.equal(recovered.lastEventId,lastEventId);
    assert.equal(recovered.sliceCount,24);
    assert.equal(calls,24);
    assert.equal(reads,24);
    console.log("PA02_R10_PERSISTED_STEP_BUDGET="+JSON.stringify({
      perRunStepBound:24,noUnboundedResume:true,
      restartCannotResetBound:true,noExtraModelOrToolCalls:true,
      actionableBlockedState:true,productionUsed:false
    }));
  }finally{
    await runtime?.close();
    try{await db.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await db.end();}
  }
});

test("PA02 R10: persisted whole-Run wall deadline blocks new work after 72h, preserves terminal state on Host restart",{
  skip:!url?"Needs disposable PostgreSQL18":false,timeout:90000
},async()=>{
  const schema="pa02_r10_age_"+randomUUID().replaceAll("-","").slice(0,12);
  const db=postgres(url,{max:2});
  let runtime,calls=0;
  const provider={providerId:"pa02:age",modelId:"fixture",async infer(){
    calls++;
    return {contractVersion:"0.1.0",providerId:this.providerId,
      modelId:this.modelId,text:"On-time answer",toolCalls:[],
      finishReason:"stop"};
  }};
  const catalog=()=>({list:()=>[],
    async invoke(){throw Error("PA02_R10_NO_TOOL_DISPATCH");}});
  try{
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog}
    });
    // This is an actual Host Run; only its Host-owned creation timestamp is
    // old. The runtime's real wall clock is October 14 (72h has elapsed).
    const oldHandlers=handlerMap(runtime,provider,catalog,
      "2026-10-09T00:00:00.000Z");
    const expired=await oldHandlers.get("enterprise-agent.run.start").execute(
      request("enterprise-agent.run.start",{
        message:"Do not execute after the persisted task deadline"
      },"pa02:r10:deadline:old"));
    assert.equal(expired.ok,true,JSON.stringify(expired.error));
    assert.equal(expired.result.run.state,"BLOCKED");
    assert.equal(expired.result.run.blocker.code,
      "PA02_RUN_TIME_BUDGET_EXHAUSTED");
    assert.match(expired.result.run.blocker.reason,/fresh, narrower request/);
    assert.equal(expired.result.run.sliceCount,0);
    assert.equal(calls,0,"expired durable task cannot reach inference or tools");
    const runId=expired.result.run.runId;
    await runtime.close();runtime=undefined;
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog}
    });
    const afterRestart=await runtime.resume({runId,principal,context});
    assert.equal(afterRestart.state,"BLOCKED");
    assert.equal(afterRestart.blocker.code,"PA02_RUN_TIME_BUDGET_EXHAUSTED");
    assert.equal(calls,0);
    const onTime=await handlerMap(runtime,provider,catalog).get(
      "enterprise-agent.run.start").execute(
      request("enterprise-agent.run.start",{
        message:"Use the currently valid Host time budget"
      },"pa02:r10:deadline:fresh"));
    assert.equal(onTime.ok,true,JSON.stringify(onTime.error));
    assert.equal(onTime.result.run.state,"SUCCEEDED");
    assert.equal(calls,1,"fresh Run remains usable");
    console.log("PA02_R10_WALL_TIME_BUDGET="+JSON.stringify({
      deadlineFromDurableCreatedAt:true,expiredRunCannotCallProvider:true,
      terminalStatePersistsAcrossRestart:true,onTimeNewRunWorks:true,
      businessWriteDispatched:false,productionUsed:false
    }));
  }finally{
    await runtime?.close();
    try{await db.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await db.end();}
  }
});


test("PA02 R10: original provider usage is durable and unknown usage is never counted as zero",{
  skip:!url?"Needs disposable PostgreSQL18":false,timeout:90000
},async()=>{
  const schema="pa02_r10_usage_"+randomUUID().replaceAll("-","").slice(0,12);
  const db=postgres(url,{max:2});
  let runtime,calls=0;
  const provider={providerId:"pa02-usage-evidence",modelId:"sandbox-metered",
    async infer(){
      calls++;
      return {contractVersion:"0.1.0",providerId:this.providerId,
        modelId:this.modelId,text:"Authoritative provider inference",
        toolCalls:[],finishReason:"stop",
        ...(calls===1?{usage:{
          inputTokens:57,outputTokens:9,cachedInputTokens:12,
          cacheWriteInputTokens:5
        }}:{})
      };
    }
  };
  const catalog=()=>({list:()=>[],async invoke(){
    throw Error("NO_BUSINESS_SIDE_EFFECT");
  }});
  try {
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog}
    });
    const h=handlerMap(runtime,provider,catalog);
    const first=await h.get("enterprise-agent.run.start").execute(
      request("enterprise-agent.run.start",{message:"meter this model response"},
        "pa02:r10:usage:known"));
    assert.equal(first.ok,true,JSON.stringify(first.error));
    assert.equal(first.result.run.state,"SUCCEEDED");
    assert.deepEqual(first.result.run.modelUsages.map(x=>x.status),["REPORTED"]);
    assert.deepEqual(first.result.run.modelUsages[0].usage,{
      inputTokens:57,outputTokens:9,cachedInputTokens:12,
      cacheWriteInputTokens:5
    });
    const runId=first.result.run.runId;
    const audited=await db.unsafe('SELECT payload FROM "'+schema+
      '".agent_run_events WHERE run_id=$1 ORDER BY ordinal',[runId]);
    const events=audited.map(x=>typeof x.payload==="string"
      ?JSON.parse(x.payload):x.payload);
    assert.equal(events.filter(e=>e.type==="MODEL_USAGE_RECORDED").length,1);
    assert.equal(events.find(e=>e.type==="MODEL_USAGE_RECORDED")
      .payload.providerId,provider.providerId);
    await runtime.close();runtime=undefined;
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog}
    });
    const recovered=await runtime.read({runId,principal,context});
    assert.deepEqual(recovered.modelUsages,first.result.run.modelUsages);
    const duplicate=await handlerMap(runtime,provider,catalog)
      .get("enterprise-agent.run.start").execute(
        request("enterprise-agent.run.start",{message:"meter this model response"},
          "pa02:r10:usage:known"));
    assert.equal(duplicate.result.run.runId,runId);
    assert.equal(calls,1,"reconnected duplicate must not call model again");
    const unknown=await handlerMap(runtime,provider,catalog)
      .get("enterprise-agent.run.start").execute(
        request("enterprise-agent.run.start",{message:"provider returns no usage"},
          "pa02:r10:usage:unknown"));
    assert.equal(unknown.ok,true,JSON.stringify(unknown.error));
    assert.equal(unknown.result.run.state,"SUCCEEDED");
    assert.deepEqual(unknown.result.run.modelUsages.map(x=>x.status),
      ["UNAVAILABLE"]);
    assert.equal(unknown.result.run.modelUsages[0].usage,undefined,
      "unknown provider costs cannot silently become zero");
    assert.equal(calls,2);
    console.log("PA02_R10_DURABLE_PROVIDER_USAGE="+JSON.stringify({
      providerReportedTokensPersisted:true,providerModelBound:true,
      unknownUsageExplicit:true,postRestartSameRunNoReInference:true,
      noPriceAssumed:true,productionUsed:false
    }));
  }finally{
    await runtime?.close();
    try{await db.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await db.end();}
  }
});
