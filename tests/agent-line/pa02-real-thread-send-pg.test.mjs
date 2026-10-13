import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPostgresAgentDurabilityProofV020}
  from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import {createPostgresAgentExecutionCoordinatorV020}
  from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";
import {createPostgresFencedAgentRunAuthorityV030}
  from "../../dist/agents/enterprise-agent/pa02b-fenced-run-authority.js";
import {createReadOnlyFencedAgentWorkerV030}
  from "../../dist/agents/enterprise-agent/pa02-async-read-worker.js";
import {createHostScopedAsyncAgentRunBridgeV020}
  from "../../dist/manager/agent-durability-host-bridge.js";
import {createConversationThreadStoreV010,createMemoryConversationThreadEventStoreV010}
  from "../../dist/manager/conversation-thread-store.js";
import {createAgentRunStoreV010,createMemoryAgentRunEventStoreV010}
  from "../../dist/manager/agent-run-store.js";
import {createThreadBackedAgentTurnActionHandlersV010}
  from "../../dist/agents/enterprise-agent/thread-turn-action-handlers.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"pg-send-human",
  actorType:"HUMAN",identityProviderId:"fixture"};
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:pg-send-human",ownerSubjectId:"pg-send-human"},
  activeContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:pg-send-human"}};
const scope={principalSubjectId:principal.subjectId,principalActorType:principal.actorType,
  contextKind:"PERSONAL",contextId:context.activeContext.contextId};

test("PA02 real thread.send -> PG atomic turn claim -> fenced model -> exactly-once assistant",{
  skip:!url?"Requires isolated PA02A_PROOF_DATABASE_URL":false,timeout:90000
},async()=>{
  const schema="agent_pa02_send_pg_"+randomUUID().replaceAll("-","").slice(0,12);
  const admin=postgres(url,{max:2});
  let repo,coordinator,authority;
  try{
    repo=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    coordinator=await createPostgresAgentExecutionCoordinatorV020({connectionString:url,schema});
    authority=await createPostgresFencedAgentRunAuthorityV030({connectionString:url,schema});
    const threadId="thread:pg:"+randomUUID(),clientTurnId="turn:pg:"+randomUUID();
    const threadStore=createConversationThreadStoreV010({
      eventStore:createMemoryConversationThreadEventStoreV010(),eventId:randomUUID
    });
    threadStore.create({
      threadId,principalSubjectId:principal.subjectId,
      principalActorType:principal.actorType,context:context.activeContext,
      createdAt:"2026-10-13T00:00:00.000Z"
    });
    const oldRunStore=createAgentRunStoreV010({
      eventStore:createMemoryAgentRunEventStoreV010(),eventId:randomUUID
    });
    const bridge=createHostScopedAsyncAgentRunBridgeV020({
      repository:repo,principal,context
    });
    let inferCount=0,claims=0,lookups=0;
    const provider={providerId:"pg.send",modelId:"fixture",
      async infer() {
        inferCount++;
        return {contractVersion:"0.1.0",providerId:"pg.send",modelId:"fixture",
          text:"A durable reply",toolCalls:[],
          usage:{inputTokens:1,outputTokens:1},finishReason:"stop"};
      }
    };
    const worker=createReadOnlyFencedAgentWorkerV030({
      authority,resolveProvider:()=>provider,
      createToolCatalog:()=>({list:()=>[],invoke:async()=>{throw Error("NO_WRITE");}}),
      eventId:randomUUID,sliceId:randomUUID,ttlSeconds:180
    });
    let tick=0;
    const handlers=createThreadBackedAgentTurnActionHandlersV010({
      threadStore,runStore:oldRunStore,
      runExecutor:{resume:async()=>{throw Error("LEGACY_EXECUTOR_FORBIDDEN");}},
      async asyncTurnLookup({threadId:t,clientTurnId:turn,principal:p,context:c}) {
        lookups++;
        assert.equal(p.subjectId,principal.subjectId);
        assert.equal(c.activeContext.contextId,context.activeContext.contextId);
        return bridge.getByTurn({threadId:t,clientTurnId:turn});
      },
      async asyncTurnClaimer({clientTurnId:turn,create,principal:p,context:c}) {
        claims++;
        assert.equal(p.subjectId,principal.subjectId);
        assert.equal(c.activeContext.contextId,context.activeContext.contextId);
        const claimed=await bridge.claimTurn({
          threadId:create.sourceInteractionId,clientTurnId:turn,
          created:{
            contractVersion:"0.1.0",eventId:"created:"+randomUUID(),
            runId:create.runId,type:"RUN_CREATED",occurredAt:create.createdAt,
            payload:{principalSubjectId:create.principalSubjectId,
              principalActorType:create.principalActorType,
              context:create.context,sourceInteractionId:create.sourceInteractionId,
              sourceActionId:create.sourceActionId,input:create.input}
          }
        });
        return claimed.run;
      },
      async asyncRunResumer({runId,principal:p,context:c,requestContext}) {
        return (await worker.resumeOnce({
          runId,workerId:"worker:send:"+randomUUID(),
          principal:p,context:c,requestContext
        })).run;
      },
      resolveLlmProvider(){return {installedProviderIds:[provider.providerId],provider};},
      resolveIdentitySession(){return {contractVersion:"0.1.0",principal};},
      resolveContext(){return context;},
      createToolCatalog:()=>({list:()=>[],invoke:async()=>{throw Error("NO_WRITE");}}),
      runId:randomUUID,now:()=>new Date(Date.parse("2026-10-13T00:00:02.000Z")+(tick++)*1000)
    });
    const send=handlers.find(x=>x.commandCode==="enterprise-agent.thread.send");
    const request=(message)=>({
      contractVersion:"0.1.0",type:"command",requiresConfirmation:false,
      actionId:"ui:send",sourceInteractionId:"ui:send",
      command:{code:"enterprise-agent.thread.send",inputVersion:"0.1.0"},
      values:{threadId,clientTurnId,message}
    });
    const requestContext={contractVersion:"0.1.0",principal,context};
    const first=await send.execute(request("summarize"),requestContext);
    assert.equal(first.ok,true,JSON.stringify(first.error));
    assert.equal(first.result.run.state,"SUCCEEDED");
    assert.equal(first.result.run.finalMessage,"A durable reply");
    assert.equal(inferCount,1);
    assert.equal(claims,1);
    const actualRunId=first.result.run.runId;
    assert.equal((await repo.listRunEvents({scope,runId:actualRunId})).length>=3,true);
    assert.equal(oldRunStore.get(actualRunId),undefined);
    const second=await send.execute(request("summarize"),requestContext);
    assert.equal(second.ok,true,JSON.stringify(second.error));
    assert.equal(second.result.run.runId,actualRunId);
    assert.equal(inferCount,1);
    assert.equal(claims,1);
    const conflict=await send.execute(request("changed task"),requestContext);
    assert.equal(conflict.ok,false);
    assert.equal(conflict.error.code,"CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED");
    assert.equal(claims,1);
    const stored=await threadStore.get(threadId);
    assert.equal(stored.messages.length,2);
    assert.equal(stored.messages.filter(m=>m.role==="USER"&&m.runId===actualRunId).length,1);
    assert.equal(stored.messages.filter(m=>m.role==="ASSISTANT"&&m.runId===actualRunId).length,1);
    assert.equal(lookups,3);
    console.log("PA02_REAL_THREAD_SEND_PG="+JSON.stringify({
      status:"PASS",actualThreadAction:true,durableAtomicTurn:true,
      externalWorkerFenced:true,modelInferenceExactlyOnce:true,
      messagesExactlyOnce:true,changedTaskRejected:true,
      legacyStoreUntouched:true,businessWrite:false,productionEnabled:false
    }));
  }finally{
    for(const s of [authority,coordinator,repo])if(s)await s.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await admin.end();}
  }
});
