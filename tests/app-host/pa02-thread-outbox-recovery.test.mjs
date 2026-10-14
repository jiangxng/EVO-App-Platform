import test from "node:test";
import assert from "node:assert/strict";
import {
  recoverThreadBackedChatV010
} from "../../dist/vendor/eidos/src/app-host/personal-agent-thread-chat.js";
import {recoverPersonalAgentRunEventsV010}
  from "../../dist/vendor/eidos/src/app-host/personal-agent-run-event-recovery.js";

const runId="agent-run:pa02-eidos-recover";
const threadId="conversation-thread:pa02-eidos-recover";
const request=()=>({
  contractVersion:"0.1.0",type:"command",
  command:{code:"enterprise-agent.chat",inputVersion:"0.1.0"},
  values:{message:"",activeContext:{contractVersion:"0.1.0",
    kind:"PERSONAL",contextId:"personal:pa02-eidos"}},
  sourceInteractionId:"enterprise-agent.home",
  actionId:"chat.restore",requiresConfirmation:false
});
const pending=()=>({
  threadId,sourceInteractionId:"enterprise-agent.home",
  messages:[{
    messageId:"user:1",role:"USER",content:"work with durable facts",
    createdAt:"2026-10-14T06:00:00.000Z",runId
  }]
});
const completed=()=>({
  ...pending(),messages:[...pending().messages,{
    messageId:"assistant:1",role:"ASSISTANT",content:"Authoritative answer",
    createdAt:"2026-10-14T06:00:01.000Z",runId
  }]
});
const snapshot=(state="SUCCEEDED")=>({
  runId,state,lastEventId:"run:event:2",actionReceiptIds:["receipt:business:1"]
});
const evt=(ordinal)=>({
  eventId:"run:event:"+ordinal,ordinal,runId,
  event:{contractVersion:"0.1.0",runId,eventId:"run:event:"+ordinal,
    type:ordinal===2?"RUN_SUCCEEDED":"SLICE_STARTED"}
});
test("PA02 R05/R06 Eidos reconnect consumes scoped Outbox pages, dedupes duplicates and restores same durable Thread",async()=>{
  const calls=[],seen=[];
  const host={async execute(value){
    calls.push(value.command.code);
    if(value.command.code==="enterprise-agent.thread.list")
      return {ok:true,result:{threads:[pending()]}};
    if(value.command.code==="enterprise-agent.run.events"){
      assert.equal(value.values.runId,runId);
      assert.equal(value.values.activeContext.contextId,"personal:pa02-eidos");
      if(!value.values.afterEventId)
        return {ok:true,result:{run:snapshot(),
          events:[evt(0),evt(1)],resetRequired:false,hasMore:true,
          nextCursor:"run:event:1"}};
      assert.equal(value.values.afterEventId,"run:event:1");
      seen.push(value.values.afterEventId);
      return {ok:true,result:{run:snapshot(),
        events:[evt(1),evt(2)],resetRequired:false,hasMore:false,
        nextCursor:"run:event:2"}};
    }
    if(value.command.code==="enterprise-agent.thread.resume"){
      assert.equal(value.values.runId,runId);
      return {ok:true,result:{thread:completed(),
        run:{runId,state:"SUCCEEDED"},message:"Authoritative answer"}};
    }
    throw Error("UNEXPECTED_COMMAND:"+value.command.code);
  }};
  const output=await recoverThreadBackedChatV010({
    actionHost:host,request:request()
  });
  assert.equal(output.result.ok,true);
  assert.equal(output.runState,"SUCCEEDED");
  assert.equal(output.runId,runId);
  assert.deepEqual(output.runRecovery.eventIds,
    ["run:event:0","run:event:1","run:event:2"]);
  assert.deepEqual(output.runRecovery.actionReceiptIds,["receipt:business:1"]);
  assert.equal(output.runRecovery.resetRequired,false);
  assert.deepEqual(output.transcript.map(x=>x.id),["user:1","assistant:1"]);
  assert.deepEqual(seen,["run:event:1"]);
  assert.deepEqual(calls,[
    "enterprise-agent.thread.list","enterprise-agent.run.events",
    "enterprise-agent.run.events","enterprise-agent.thread.resume"
  ]);
  assert.equal(calls.includes("enterprise-agent.run.start"),false);
});

test("PA02 R06 gap reset drops partial delta and recovers terminal Run from Host snapshot without replayed work",async()=>{
  let resumeCount=0;
  const host={async execute(value){
    switch(value.command.code){
      case "enterprise-agent.thread.list":
        return {ok:true,result:{threads:[pending()]}};
      case "enterprise-agent.run.events":
        return {ok:true,result:{run:snapshot(),events:[],
          resetRequired:true,hasMore:false}};
      case "enterprise-agent.thread.resume":
        resumeCount++;
        return {ok:true,result:{run:{runId,state:"SUCCEEDED"},
          thread:completed(),message:"Authoritative answer"}};
      default:throw Error("no extra work allowed");
    }
  }};
  const output=await recoverThreadBackedChatV010({
    actionHost:host,request:request()
  });
  assert.equal(output.result.ok,true);
  assert.equal(output.runRecovery.resetRequired,true);
  assert.deepEqual(output.runRecovery.eventIds,[]);
  assert.equal(output.runRecovery.state,"SUCCEEDED");
  assert.deepEqual(output.runRecovery.actionReceiptIds,["receipt:business:1"]);
  assert.equal(resumeCount,1);
  assert.equal(output.transcript.length,2);
});

test("PA02 R06 run.events permission failure fails closed; no thread.resume or new Run",async()=>{
  const calls=[];
  const host={async execute(value){
    calls.push(value.command.code);
    if(value.command.code==="enterprise-agent.thread.list")
      return {ok:true,result:{threads:[pending()]}};
    if(value.command.code==="enterprise-agent.run.events")
      return {ok:false,error:{code:"AGENT_RUN_NOT_FOUND",
        message:"wrong enterprise or principal"}};
    throw Error("must not attempt resuming unauthorized Run");
  }};
  const output=await recoverThreadBackedChatV010({
    actionHost:host,request:request()
  });
  assert.equal(output.result.ok,false);
  assert.equal(output.result.error.code,"AGENT_RUN_NOT_FOUND");
  assert.equal(output.runId,runId);
  assert.deepEqual(calls,["enterprise-agent.thread.list","enterprise-agent.run.events"]);
});

test("PA02 Eidos invalid Outbox ordinal and mismatched terminal state fail closed",async()=>{
  const malformed={async execute(value){
    if(value.command.code!=="enterprise-agent.run.events")
      throw Error("read-only Outbox recovery only");
    return {ok:true,result:{run:snapshot(),events:[evt(0),evt(2)],
      resetRequired:false,hasMore:false}};
  }};
  const gap=await recoverPersonalAgentRunEventsV010({
    actionHost:malformed,request:request(),runId
  });
  assert.equal(gap.availability,"AVAILABLE");
  assert.equal(gap.recovery.resetRequired,true);
  assert.deepEqual(gap.recovery.eventIds,[]);
  const host={async execute(value){
    if(value.command.code==="enterprise-agent.thread.list")
      return {ok:true,result:{threads:[pending()]}};
    if(value.command.code==="enterprise-agent.run.events")
      return {ok:true,result:{run:snapshot(),events:[evt(0),evt(1),evt(2)],
        resetRequired:false,hasMore:false}};
    if(value.command.code==="enterprise-agent.thread.resume")
      return {ok:true,result:{run:{runId,state:"PAUSED"},
        thread:pending()}};
    throw Error("not allowed");
  }};
  const output=await recoverThreadBackedChatV010({
    actionHost:host,request:request(),maxConsecutiveResumes:0
  });
  assert.equal(output.result.ok,false);
  assert.equal(output.result.error.code,
    "EIDOS_PA02_RUN_RECOVERY_SNAPSHOT_MISMATCH");
  assert.equal(output.runRecovery.state,"SUCCEEDED");
});

test("PA02 Eidos bounded replay never enters infinite pagination or changes Run",async()=>{
  let reads=0;
  const host={async execute(value){
    reads++;
    return {ok:true,result:{run:snapshot("PAUSED"),
      events:[evt(reads-1)],resetRequired:false,hasMore:true,
      nextCursor:"run:event:"+(reads-1)}};
  }};
  const output=await recoverPersonalAgentRunEventsV010({
    actionHost:host,request:request(),runId,maxPages:2
  });
  assert.equal(output.availability,"ERROR");
  assert.equal(output.error.error.code,"EIDOS_PA02_RUN_EVENT_REPLAY_LIMIT");
  assert.equal(reads,2);
});
