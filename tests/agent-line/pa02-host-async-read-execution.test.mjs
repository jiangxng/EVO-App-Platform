import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import postgres from "postgres";
import {createOptionalPostgresHostAsyncReadExecutionV030}
  from "../../dist/manager/agent-async-read-worker-runtime.js";
import {createPersonalAgentRunActionHandlersV010}
  from "../../dist/agents/enterprise-agent/run-action-handlers.js";
import {createAgentRunStoreV010,createMemoryAgentRunEventStoreV010}
  from "../../dist/manager/agent-run-store.js";
import {createConversationThreadStoreV010,createMemoryConversationThreadEventStoreV010}
  from "../../dist/manager/conversation-thread-store.js";
import {createThreadBackedAgentTurnActionHandlersV010}
  from "../../dist/agents/enterprise-agent/thread-turn-action-handlers.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"host-async-test-user",
  actorType:"HUMAN",identityProviderId:"fixture"};
const context={contractVersion:"0.1.0",personalContext:{
  contractVersion:"0.1.0",kind:"PERSONAL",contextId:"personal:host-async-test-user",
  ownerSubjectId:"host-async-test-user"},
  activeContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:host-async-test-user"}};
const providerBase={providerId:"fixture",modelId:"demo"};
const tool=()=>({list:()=>[{
  contractVersion:"0.1.0",id:"test.read",modelName:"test_read",title:"Test READ",
  description:"Host-backed read",inputSchema:{type:"object",properties:{},
    additionalProperties:false},effect:"READ",ownerPackageId:"test"
}],async invoke(call){assert.equal(call.tool,"test.read");
  return {tool:call.tool,ok:true,result:{value:"READ-OK"}};}});
const request=(code,values,actionId)=>({contractVersion:"0.1.0",
  type:"command",command:{code,inputVersion:"0.1.0"},
  sourceInteractionId:"ui:pa02",actionId:actionId??randomUUID(),
  requiresConfirmation:false,values});

test("PA02 actual Run action: async READ completion, persistence, cancellation, and scope",{
  skip:!url?"Requires isolated PostgreSQL":false,timeout:90000
},async()=>{
  const schema="pa02_host_exe_"+randomUUID().replaceAll("-","").slice(0,12);
  const admin=postgres(url,{max:2});
  let runtime,holdResolve,enteredResolve;
  const hold=new Promise(resolve=>holdResolve=resolve);
  const entered=new Promise(resolve=>enteredResolve=resolve);
  let readCalls=0,providerCalls=0;
  const provider={...providerBase,
    async infer(r){
      providerCalls++;
      const messages=r.messages.map(m=>m.content).join("\n");
      if(messages.includes("hold please")){
        enteredResolve();
        await hold;
        return {contractVersion:"0.1.0",...providerBase,text:"NEVER COMMITTED",
          toolCalls:[],finishReason:"stop"};
      }
      if(messages.includes("READ-OK"))return {
        contractVersion:"0.1.0",...providerBase,text:"Grounded result",
        toolCalls:[],finishReason:"stop"
      };
      return {contractVersion:"0.1.0",...providerBase,text:"",
        toolCalls:[{name:"test_read",arguments:{}}],finishReason:"tool_calls"};
    }
  };
  const createCatalog=()=>({
    list:tool().list,async invoke(call){readCalls++;
      return tool().invoke(call);}
  });
  try{
    assert.equal(await createOptionalPostgresHostAsyncReadExecutionV030({},{
      resolveProvider:()=>provider,createToolCatalog:createCatalog
    }),undefined);
    await assert.rejects(createOptionalPostgresHostAsyncReadExecutionV030({
      APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE:"DANGEROUS"
    },{resolveProvider:()=>provider,createToolCatalog:createCatalog}),
    /PA02_HOST_WORKER_MODE_INVALID/);
    runtime=await createOptionalPostgresHostAsyncReadExecutionV030({
      APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE:"READ_ONLY",
      APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL:url,
      APP_PLATFORM_AGENT_RUN_ASYNC_SCHEMA:schema
    },{resolveProvider:()=>provider,createToolCatalog:createCatalog});
    assert.ok(runtime);
    const store=createAgentRunStoreV010({
      eventStore:createMemoryAgentRunEventStoreV010(),eventId:randomUUID
    });
    let sequence=0;
    const handlers=createPersonalAgentRunActionHandlersV010({
      runStore:store,runExecutor:{resume(){throw Error("LEGACY_EXECUTOR_FORBIDDEN");}},
      asyncRunRuntime:runtime,
      resolveLlmProvider:()=>({installedProviderIds:[provider.providerId],provider}),
      resolveIdentitySession:()=>({contractVersion:"0.1.0",
        sessionId:"test-session",principal}),
      resolveContext:()=>context,
      createToolCatalog:createCatalog,runId:()=>String(++sequence),
      now:()=>new Date("2026-10-13T00:00:00.000Z")
    });
    const action=new Map(handlers.map(h=>[h.commandCode,h]));
    assert.ok(action.has("enterprise-agent.run.cancel"));
    const first=await action.get("enterprise-agent.run.start").execute(
      request("enterprise-agent.run.start",{message:"read a useful thing"},"client:read"));
    assert.equal(first.ok,true);
    assert.equal(first.result.run.runId,"agent-run:1");
    assert.equal(first.result.run.state,"SUCCEEDED");
    assert.equal(first.result.run.finalMessage,"Grounded result");
    assert.equal(readCalls,1);
    assert.equal(providerCalls,2);
    assert.equal(store.list({principalSubjectId:principal.subjectId,
      context:context.activeContext}).length,0,"async Run not stored in V010");
    const duplicate=await action.get("enterprise-agent.run.start").execute(
      request("enterprise-agent.run.start",{message:"read a useful thing"},"client:read"));
    assert.equal(duplicate.ok,true);
    assert.equal(duplicate.result.run.runId,"agent-run:1");
    assert.equal(readCalls,1,"same actionId must not reissue tool work");
    const changed=await action.get("enterprise-agent.run.start").execute(
      request("enterprise-agent.run.start",{message:"changed task"},"client:read"));
    assert.equal(changed.ok,false);
    assert.equal(changed.error.code,"CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED");
    const persisted=await action.get("enterprise-agent.run.get").execute(
      request("enterprise-agent.run.get",{runId:"agent-run:1"}));
    assert.equal(persisted.ok,true);
    assert.equal(persisted.result.run.state,"SUCCEEDED");
    const resumed=await action.get("enterprise-agent.run.resume").execute(
      request("enterprise-agent.run.resume",{runId:"agent-run:1"}));
    assert.equal(resumed.ok,true);
    assert.equal(resumed.result.run.state,"SUCCEEDED");
    assert.equal(readCalls,1);

    const inflight=action.get("enterprise-agent.run.start").execute(
      request("enterprise-agent.run.start",{message:"hold please"},"client:hold"));
    await entered;
    const requested=await action.get("enterprise-agent.run.cancel").execute(
      request("enterprise-agent.run.cancel",{runId:"agent-run:4",reason:"User stop"}));
    assert.equal(requested.ok,true);
    assert.equal(requested.result.cancellationState,"REQUESTED");
    holdResolve();
    const unfinished=await inflight;
    assert.equal(unfinished.ok,false);
    assert.equal(unfinished.error.code,"PA02B_FENCED_CANCEL_REQUESTED");
    const committed=await action.get("enterprise-agent.run.cancel").execute(
      request("enterprise-agent.run.cancel",{runId:"agent-run:4",reason:"User stop"}));
    assert.equal(committed.ok,true);
    assert.equal(committed.result.cancellationState,"CANCELLED");
    assert.equal(committed.result.run.state,"CANCELLED");
    const after=await action.get("enterprise-agent.run.get").execute(
      request("enterprise-agent.run.get",{runId:"agent-run:4"}));
    assert.equal(after.ok,true);
    assert.equal(after.result.run.state,"CANCELLED");
    const terminal=await action.get("enterprise-agent.run.cancel").execute(
      request("enterprise-agent.run.cancel",{runId:"agent-run:1"}));
    assert.equal(terminal.ok,false);
    assert.equal(terminal.error.code,"PA02C_ATOMIC_RUN_TERMINAL");

    // Actual thread.send is wired to the SAME Host-owned PostgreSQL runtime:
    // a browser retry must resolve one Run and append one USER/ASSISTANT pair.
    const threadId="thread:host-pg:"+randomUUID();
    const threadStore=createConversationThreadStoreV010({
      eventStore:createMemoryConversationThreadEventStoreV010(),eventId:randomUUID
    });
    threadStore.create({
      threadId,principalSubjectId:principal.subjectId,
      principalActorType:principal.actorType,context:context.activeContext,
      createdAt:"2026-10-13T00:00:00.000Z"
    });
    let threadClock=0;
    const turnActions=new Map(createThreadBackedAgentTurnActionHandlersV010({
      threadStore,runStore:store,
      runExecutor:{resume(){throw Error("LEGACY_EXECUTOR_FORBIDDEN");}},
      asyncRunRuntime:runtime,
      resolveLlmProvider:()=>({installedProviderIds:[provider.providerId],provider}),
      resolveIdentitySession:()=>({contractVersion:"0.1.0",principal}),
      resolveContext:()=>context,createToolCatalog:createCatalog,
      runId:()=>randomUUID(),
      now:()=>new Date(Date.parse("2026-10-13T00:00:02.000Z")+
        (threadClock++)*1000)
    }).map(h=>[h.commandCode,h]));
    const send=turnActions.get("enterprise-agent.thread.send");
    const sendRequest=message=>({
      ...request("enterprise-agent.thread.send",{
        threadId,clientTurnId:"turn:host-pg:1",message
      },"action:host-pg:1"),sourceInteractionId:"ui:thread"
    });
    const actionScope={contractVersion:"0.1.0",principal,context};
    const inferredBefore=providerCalls,readsBefore=readCalls;
    const sent=await send.execute(sendRequest("Read for my workbench"),actionScope);
    assert.equal(sent.ok,true,JSON.stringify(sent.error));
    assert.equal(sent.result.run.state,"SUCCEEDED");
    assert.equal(readCalls,readsBefore+1);
    assert.equal(providerCalls,inferredBefore+2);
    const duplicateTurn=await send.execute(sendRequest("Read for my workbench"),actionScope);
    assert.equal(duplicateTurn.ok,true,JSON.stringify(duplicateTurn.error));
    assert.equal(duplicateTurn.result.run.runId,sent.result.run.runId);
    assert.equal(readCalls,readsBefore+1,"retried Thread cannot repeat READ tool");
    const turnConflict=await send.execute(sendRequest("Changed input"),actionScope);
    assert.equal(turnConflict.ok,false);
    assert.equal(turnConflict.error.code,"CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED");
    const conversation=await threadStore.get(threadId);
    assert.equal(conversation.messages.filter(m=>m.role==="USER"&&
      m.runId===sent.result.run.runId).length,1);
    assert.equal(conversation.messages.filter(m=>m.role==="ASSISTANT"&&
      m.runId===sent.result.run.runId).length,1);

    console.log("PA02_HOST_ASYNC_READ_EXECUTION="+JSON.stringify({
      status:"PASS",actualActionHandlers:true,asyncRunCreated:true,
      readToolExecuted:true,duplicateSourceDeduped:true,
      changedTaskRejected:true,legacyRunUnchanged:true,
      cancellationRequestedWhileActive:true,cancellationCommittedAfterYield:true,
      finalRunPersisted:true,threadSendToHostPostgres:true,
      threadTurnExactlyOnce:true,materialWriteNeverIssued:true,devOnly:true
    }));
  }finally{
    holdResolve?.();
    if(runtime)await runtime.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await admin.end();}
  }
});
