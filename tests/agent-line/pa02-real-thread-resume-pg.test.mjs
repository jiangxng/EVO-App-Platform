import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID,createHash } from "node:crypto";
import postgres from "postgres";
import {createPostgresAgentDurabilityProofV020}
  from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import {createPostgresAgentExecutionCoordinatorV020}
  from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";
import {createPostgresFencedAgentRunAuthorityV030}
  from "../../dist/agents/enterprise-agent/pa02b-fenced-run-authority.js";
import {createReadOnlyFencedAgentWorkerV030}
  from "../../dist/agents/enterprise-agent/pa02-async-read-worker.js";
import {createHostAsyncRunReaderPortV020}
  from "../../dist/manager/agent-async-run-reader.js";
import {createConversationThreadStoreV010,createMemoryConversationThreadEventStoreV010}
  from "../../dist/manager/conversation-thread-store.js";
import {createAgentRunStoreV010,createMemoryAgentRunEventStoreV010}
  from "../../dist/manager/agent-run-store.js";
import {createThreadBackedAgentTurnActionHandlersV010}
  from "../../dist/agents/enterprise-agent/thread-turn-action-handlers.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"pg-thread-human",actorType:"HUMAN",
  identityProviderId:"fixture"};
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:pg-thread-human",ownerSubjectId:"pg-thread-human"},
  activeContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:pg-thread-human"}};
const scope={principalSubjectId:principal.subjectId,principalActorType:principal.actorType,
  contextKind:"PERSONAL",contextId:context.activeContext.contextId};
const sha=s=>createHash("sha256").update(s).digest("hex");

test("PA02 real Thread.resume Action → V020 PG Run → fenced READ Worker → assistant message",{
  skip:!url?"Requires isolated PA02A_PROOF_DATABASE_URL":false,timeout:90000
},async()=>{
  const schema="agent_pa02_thread_pg_"+randomUUID().replaceAll("-","").slice(0,12);
  const admin=postgres(url,{max:2});
  let repo,coord,authority;
  try{
    repo=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    coord=await createPostgresAgentExecutionCoordinatorV020({connectionString:url,schema});
    authority=await createPostgresFencedAgentRunAuthorityV030({connectionString:url,schema});
    const runId="run:thread:"+randomUUID(),threadId="thread:pg:"+randomUUID();
    const threadStore=createConversationThreadStoreV010({
      eventStore:createMemoryConversationThreadEventStoreV010(),
      eventId:randomUUID
    });
    threadStore.create({threadId,principalSubjectId:principal.subjectId,
      principalActorType:principal.actorType,context:context.activeContext,
      createdAt:"2026-10-13T00:00:00.000Z"});
    await threadStore.appendMessage({
      threadId,messageId:"msg:"+randomUUID(),runId,
      role:"USER",content:"Provide a safe summary",
      createdAt:"2026-10-13T00:00:01.000Z"
    });
    await repo.claimTurn({
      scope,threadId,clientTurnId:"turn:pg",taskPayload:{message:"Provide a safe summary"},
      taskDigest:sha("thread-pg"),
      created:{contractVersion:"0.1.0",eventId:"event:"+randomUUID(),
        runId,type:"RUN_CREATED",occurredAt:"2026-10-13T00:00:00.000Z",
        payload:{principalSubjectId:principal.subjectId,
          principalActorType:principal.actorType,context:context.activeContext,
          sourceInteractionId:threadId,sourceActionId:"thread.send:pg",
          input:{message:"Provide a safe summary",conversationHistory:[],
            locale:"en",providerId:"pg.model",modelId:"deterministic"}}}
    });
    let modelCalls=0;
    const worker=createReadOnlyFencedAgentWorkerV030({
      authority,
      resolveProvider:()=>({
        providerId:"pg.model",modelId:"deterministic",
        async infer() {
          modelCalls++;
          return {contractVersion:"0.1.0",providerId:"pg.model",modelId:"deterministic",
            text:"Recovered from PostgreSQL",toolCalls:[],
            usage:{inputTokens:1,outputTokens:1},finishReason:"stop"};
        }
      }),
      createToolCatalog:()=>({list:()=>[],invoke:async()=>{throw Error("UNEXPECTED_TOOL");}}),
      eventId:randomUUID,sliceId:randomUUID,ttlSeconds:60
    });
    const reader=createHostAsyncRunReaderPortV020(repo);
    const v010Store=createAgentRunStoreV010({
      eventStore:createMemoryAgentRunEventStoreV010(),eventId:randomUUID
    });
    let readCount=0,resumeCount=0;
    const handlers=createThreadBackedAgentTurnActionHandlersV010({
      threadStore,runStore:v010Store,
      runExecutor:{resume:async()=>{throw Error("V010_EXECUTOR_SHOULD_NOT_BE_CALLED");}},
      async asyncRunReader(input){readCount++;return reader.read(input);},
      async asyncRunResumer(input){
        resumeCount++;
        return (await worker.resumeOnce({
          ...input,workerId:"worker:host-action:"+randomUUID()
        })).run;
      },
      resolveLlmProvider(){return {installedProviderIds:["pg.model"],
        provider:{providerId:"pg.model",modelId:"deterministic"}};},
      resolveIdentitySession(){return {contractVersion:"0.1.0",principal};},
      resolveContext(){return context;},
      createToolCatalog:()=>({list:()=>[],invoke:async()=>{throw Error("UNEXPECTED_TOOL");}}),
      runId:randomUUID,eventId:randomUUID
    });
    const action=handlers.find(h=>h.commandCode==="enterprise-agent.thread.resume");
    const request={contractVersion:"0.1.0",type:"command",requiresConfirmation:false,
      actionId:"ui:resume",sourceInteractionId:"ui:resume",
      command:{code:"enterprise-agent.thread.resume",inputVersion:"0.1.0"},
      values:{threadId,runId}};
    const hostContext={contractVersion:"0.1.0",principal,context};
    const first=await action.execute(request,hostContext);
    assert.equal(first.ok,true,JSON.stringify(first.error));
    assert.equal(first.result.run.state,"SUCCEEDED");
    assert.equal(first.result.run.finalMessage,"Recovered from PostgreSQL");
    assert.equal(modelCalls,1);
    assert.equal(resumeCount,1);
    const after=await threadStore.get(threadId);
    assert.equal(after.messages.filter(m=>m.role==="ASSISTANT"&&m.runId===runId).length,1);
    const repeat=await action.execute(request,hostContext);
    assert.equal(repeat.ok,true,JSON.stringify(repeat.error));
    assert.equal(repeat.result.run.state,"SUCCEEDED");
    assert.equal(modelCalls,1,"successful Run must not re-invoke model");
    assert.equal((await threadStore.get(threadId)).messages.length,2);
    assert.equal(readCount,2);
    assert.equal(resumeCount,2);
    const anotherThread=threadStore.create({
      threadId:"thread:foreign:"+randomUUID(),
      principalSubjectId:principal.subjectId,principalActorType:principal.actorType,
      context:context.activeContext,createdAt:"2026-10-13T00:00:00.000Z"
    });
    const deny=await action.execute({...request,
      values:{...request.values,threadId:anotherThread.threadId}},hostContext);
    assert.equal(deny.ok,false);
    assert.equal(deny.error.code,"CONVERSATION_THREAD_RUN_MISMATCH");
    assert.equal(modelCalls,1);
    console.log("PA02_REAL_THREAD_RESUME_PG="+JSON.stringify({
      status:"PASS",realThreadAction:true,hostScope:true,postgresV020:true,
      fencedWorker:true,assistantExactlyOnce:true,modelExactlyOnce:true,
      crossThreadDenied:true,externalWrite:false,productionEnabled:false
    }));
  }finally{
    for(const s of [authority,coord,repo])if(s)await s.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await admin.end();}
  }
});
