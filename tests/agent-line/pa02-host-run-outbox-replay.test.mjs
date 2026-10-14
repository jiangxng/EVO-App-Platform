import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPostgresHostAsyncReadExecutionV030} from
  "../../dist/manager/agent-async-read-worker-runtime.js";
import {createPersonalAgentRunActionHandlersV010} from
  "../../dist/agents/enterprise-agent/run-action-handlers.js";
import {createAgentRunStoreV010,createMemoryAgentRunEventStoreV010}
  from "../../dist/manager/agent-run-store.js";
import {createPostgresPa02RunOutboxReaderV010} from
  "../../dist/manager/agent-pa02-run-outbox.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"pa02-r05-r06-human",
  actorType:"HUMAN",identityProviderId:"fixture"};
const context={contractVersion:"0.1.0",personalContext:{
  contractVersion:"0.1.0",kind:"PERSONAL",
  contextId:"personal:pa02-r05-r06-human",
  ownerSubjectId:"pa02-r05-r06-human"},
  activeContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:pa02-r05-r06-human"}};
const request=(code,values={},actionId)=>({
  contractVersion:"0.1.0",type:"command",
  command:{code,inputVersion:"0.1.0"},values,
  sourceInteractionId:"ui:pa02:r05:r06",actionId:actionId??randomUUID(),
  requiresConfirmation:false
});
test("PA02 R05/R06 real Host Outbox: duplicate delivery dedup, scoped cursor, sequence gap -> terminal snapshot",{
  skip:!url?"Requires isolated PostgreSQL18":false,timeout:90000
},async()=>{
  const schema="pa02_r05r06_"+randomUUID().replaceAll("-","").slice(0,12);
  const db=postgres(url,{max:2});
  const provider={providerId:"fixture",modelId:"demo",async infer(r) {
    const observed=r.messages.some(m=>m.content.includes("READ-OK"));
    return {contractVersion:"0.1.0",providerId:this.providerId,
      modelId:this.modelId,
      text:observed?"Run completed safely":"",
      toolCalls:observed?[]:[{name:"test_read",arguments:{}}],
      finishReason:observed?"stop":"tool_calls"};
  }};
  let toolCalls=0,runtime,outbox;
  const catalog=()=>({
    list:()=>[{
      contractVersion:"0.1.0",id:"test.read",modelName:"test_read",
      title:"Read",description:"Isolated",
      inputSchema:{type:"object"},effect:"READ",ownerPackageId:"fixture"
    }],
    async invoke(call){toolCalls++;return {tool:call.tool,
      ok:true,result:{value:"READ-OK"}};}
  });
  const setupHandlers=()=>new Map(createPersonalAgentRunActionHandlersV010({
    runStore:createAgentRunStoreV010({
      eventStore:createMemoryAgentRunEventStoreV010(),eventId:randomUUID
    }),
    runExecutor:{resume(){throw Error("LEGACY_RUN_FORBIDDEN");}},
    asyncRunRuntime:runtime,
    resolveLlmProvider:()=>({installedProviderIds:[provider.providerId],provider}),
    resolveIdentitySession:()=>({contractVersion:"0.1.0",principal}),
    resolveContext:()=>context,createToolCatalog:catalog,
    runId:randomUUID,now:()=>new Date("2026-10-14T06:00:00.000Z")
  }).map(handler=>[handler.commandCode,handler]));
  try {
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog}
    });
    const handlers=setupHandlers();
    assert.ok(handlers.has("enterprise-agent.run.events"));
    const start=await handlers.get("enterprise-agent.run.start").execute(
      request("enterprise-agent.run.start",{
        message:"Read a test fact"
      },"r05r06:action:original"));
    assert.equal(start.ok,true,JSON.stringify(start.error));
    const {runId}=start.result.run;
    assert.equal(start.result.run.state,"SUCCEEDED");
    assert.equal(toolCalls,1);
    const events=handlers.get("enterprise-agent.run.events");
    const page=await events.execute(request("enterprise-agent.run.events",{
      runId,limit:2
    },"r05r06:page:1"));
    assert.equal(page.ok,true,JSON.stringify(page.error));
    assert.equal(page.result.run.state,"SUCCEEDED");
    assert.equal(page.result.hasMore,true);
    assert.deepEqual(page.result.events.map(x=>x.ordinal),[0,1]);
    assert.equal(page.result.resetRequired,false);
    const replayPage=await events.execute(request("enterprise-agent.run.events",{
      runId,limit:2
    },"r05r06:page:duplicate"));
    assert.equal(replayPage.ok,true);
    assert.deepEqual(replayPage.result.events,page.result.events,
      "duplicate transport delivery must retain identical durable event identities");

    // Consumer receives a page twice; eventId is the dedup key, not arrival
    // count or sequence. An exactly-once business effect is not retried.
    const seen=new Set(),applied=[];
    for(const event of [...page.result.events,...replayPage.result.events])
      if(!seen.has(event.eventId)){
        seen.add(event.eventId);applied.push(event);
      }
    assert.equal(applied.length,2);
    const recovered=[];
    let cursor=page.result.nextCursor;
    for(let attempt=0;attempt<30;attempt++){
      const next=await events.execute(request("enterprise-agent.run.events",{
        runId,afterEventId:cursor,limit:2
      },"r05r06:continuation:"+attempt));
      assert.equal(next.ok,true,JSON.stringify(next.error));
      assert.equal(next.result.resetRequired,false);
      for(const event of next.result.events) {
        recovered.push(event);
        if(!seen.has(event.eventId)){
          seen.add(event.eventId);applied.push(event);
        }
      }
      cursor=next.result.nextCursor;
      if(!next.result.hasMore)break;
      assert.ok(attempt<29,"replay bounded");
    }
    const all=await db.unsafe('SELECT event_id,ordinal FROM "'+schema+
      '".agent_run_outbox WHERE run_id=$1 ORDER BY ordinal',[runId]);
    assert.equal(applied.length,all.length);
    assert.deepEqual(applied.map(x=>x.ordinal),all.map(x=>Number(x.ordinal)));
    assert.equal(applied.at(-1).event.type,"RUN_SUCCEEDED");
    assert.equal(start.result.run.lastEventId,applied.at(-1).eventId);
    assert.equal(toolCalls,1,"event replay never executes LLM or tools");
    const otherContext={...context,activeContext:{
      contractVersion:"0.1.0",kind:"PERSONAL",contextId:"personal:someone-else"
    }};
    const foreign=await events.execute(
      request("enterprise-agent.run.events",{runId},"r05r06:foreign"),
      {contractVersion:"0.1.0",principal,context:otherContext});
    assert.equal(foreign.ok,false);
    assert.equal(foreign.error.code,"AGENT_DURABILITY_PERSONAL_OWNER_MISMATCH");
    const stale=await events.execute(request("enterprise-agent.run.events",{
      runId,afterEventId:"realtime:expired:event"
    },"r05r06:stale"));
    assert.equal(stale.ok,true);
    assert.equal(stale.result.resetRequired,true);
    assert.equal(stale.result.events.length,0);
    assert.equal(stale.result.run.state,"SUCCEEDED");
    assert.equal(stale.result.run.lastEventId,applied.at(-1).eventId);
    // Force an outbox delivery hole WITHOUT deleting the authoritative Run
    // event; R06 must fail closed and supply a terminal Run snapshot instead.
    await db.unsafe('DELETE FROM "'+schema+
      '".agent_run_outbox WHERE run_id=$1 AND ordinal=$2',[runId,2]);
    const gap=await events.execute(request("enterprise-agent.run.events",{
      runId,afterEventId:page.result.nextCursor
    },"r05r06:gap"));
    assert.equal(gap.ok,true);
    assert.equal(gap.result.resetRequired,true);
    assert.equal(gap.result.events.length,0);
    assert.equal(gap.result.run.state,"SUCCEEDED");
    assert.equal(gap.result.run.lastEventId,start.result.run.lastEventId);
    await runtime.close();runtime=undefined;
    runtime=await createPostgresHostAsyncReadExecutionV030({
      connectionString:url,schema,
      deps:{resolveProvider:()=>provider,createToolCatalog:catalog}
    });
    outbox=await createPostgresPa02RunOutboxReaderV010({
      connectionString:url,schema
    });
    const restored=await setupHandlers().get("enterprise-agent.run.events").execute(
      request("enterprise-agent.run.events",{
        runId,afterEventId:"unknown:after:restart"
      },"r05r06:restart"));
    assert.equal(restored.ok,true);
    assert.equal(restored.result.resetRequired,true);
    assert.equal(restored.result.run.state,"SUCCEEDED");
    assert.equal(toolCalls,1);
    const otherScope={principalSubjectId:"another-human",
      principalActorType:"HUMAN",contextKind:"PERSONAL",
      contextId:"personal:another-human"};
    assert.equal(await outbox.readSince({scope:otherScope,runId}),undefined);
    console.log("PA02_R05_R06_HOST_OUTBOX="+JSON.stringify({
      status:"PASS",transactionalRunOutbox:true,stableEventIds:true,
      duplicateTransportDeliveryDeduped:true,hostScopedReplay:true,
      gapRequiresAuthoritativeSnapshot:true,terminalNeverLost:true,
      restartRetainsRunAndCursor:true,foreignScopeInvisible:true,
      businessToolInvokedOnce:true,productionUsed:false
    }));
  }finally{
    await outbox?.close();
    await runtime?.close();
    try{await db.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await db.end();}
  }
});
