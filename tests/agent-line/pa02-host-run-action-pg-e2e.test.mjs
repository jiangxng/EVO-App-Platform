import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID,createHash } from "node:crypto";
import postgres from "postgres";
import {createPostgresAgentDurabilityProofV020}
  from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import {createHostAsyncRunReaderPortV020}
  from "../../dist/manager/agent-async-run-reader.js";
import {createAgentRunStoreV010,createMemoryAgentRunEventStoreV010}
  from "../../dist/manager/agent-run-store.js";
import {createPersonalAgentRunActionHandlersV010}
  from "../../dist/agents/enterprise-agent/run-action-handlers.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"action-reader",actorType:"HUMAN",identityProviderId:"fixture"};
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:action-reader",ownerSubjectId:"action-reader"},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"tenant:a",enterpriseId:"tenant-a"},
  enterpriseContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"tenant:a",enterpriseId:"tenant-a",
    enterpriseProviderId:"fixture",lifecycleState:"ACTIVE"}};
const scope={principalSubjectId:principal.subjectId,principalActorType:principal.actorType,
  contextKind:"ENTERPRISE",contextId:"tenant:a",enterpriseId:"tenant-a"};

test("PA02 Host action get: actual V020 PostgreSQL fallback, strict V010 ownership denial",{
  skip:!url?"Requires disposable PostgreSQL":false,timeout:90000
},async()=>{
  const schema="agent_pa02_action_"+randomUUID().replaceAll("-","").slice(0,12);
  const admin=postgres(url,{max:1});
  let repository;
  try{
    repository=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    const runId="run:postgres:"+randomUUID();
    await repository.claimTurn({
      scope,threadId:"thread:action",clientTurnId:"turn:action",
      taskDigest:createHash("sha256").update("action").digest("hex"),
      taskPayload:{message:"isolated"},
      created:{contractVersion:"0.1.0",eventId:"event:"+randomUUID(),
        type:"RUN_CREATED",runId,occurredAt:"2026-10-13T00:00:00.000Z",
        payload:{principalSubjectId:principal.subjectId,principalActorType:principal.actorType,
          context:context.activeContext,sourceInteractionId:"thread:action",
          sourceActionId:"thread.send:action",input:{
            message:"isolated",conversationHistory:[],locale:"en",
            providerId:"fixture",modelId:"static"
          }}
      }
    });
    const store=createAgentRunStoreV010({
      eventStore:createMemoryAgentRunEventStoreV010(),eventId:randomUUID
    });
    const foreignId="run:foreign";
    store.create({
      runId:foreignId,principalSubjectId:"another-person",principalActorType:"HUMAN",
      context:context.activeContext,sourceInteractionId:"foreign:ui",
      sourceActionId:"foreign:action",createdAt:"2026-10-13T00:00:00.000Z",
      input:{message:"foreign",conversationHistory:[],locale:"en",
        providerId:"fixture",modelId:"static"}
    });
    const reader=createHostAsyncRunReaderPortV020(repository);
    let invoked=0;
    const handlers=createPersonalAgentRunActionHandlersV010({
      runStore:store,
      runExecutor:{resume:async()=>{throw Error("READ_ONLY_TEST_MUST_NOT_EXECUTE");}},
      async asyncRunReader(input){invoked++;return reader.read(input);},
      resolveLlmProvider(){return {installedProviderIds:[]};},
      resolveIdentitySession(){return {contractVersion:"0.1.0",
        sessionId:"session:action",principal};},
      resolveContext(selection){
        if(selection?.kind==="ENTERPRISE"&&selection.enterpriseId==="tenant-b"){
          return {...context,
            activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
              contextId:"tenant:b",enterpriseId:"tenant-b"},
            enterpriseContext:{...context.enterpriseContext,contextId:"tenant:b",
              enterpriseId:"tenant-b"}
          };
        }
        return context;
      },
      createToolCatalog(){return {list:async()=>[],invoke:async()=>{throw Error("NEVER_INVOKE");}};},
      runId:randomUUID
    });
    const get=handlers.find(x=>x.commandCode==="enterprise-agent.run.get");
    const request=(id,selection)=>({
      contractVersion:"0.1.0",type:"command",
      command:{code:"enterprise-agent.run.get",inputVersion:"0.1.0"},
      values:{runId:id,...(selection?{activeContext:selection}:{})},
      sourceInteractionId:"ui:action",actionId:"action:get",
      requiresConfirmation:false
    });
    const read=await get.execute(request(runId));
    assert.equal(read.ok,true);
    assert.equal(read.result.run.runId,runId);
    assert.equal(read.result.run.state,"READY");
    assert.equal(invoked,1);
    const other=await get.execute(request(runId,{
      kind:"ENTERPRISE",contextId:"tenant:b",enterpriseId:"tenant-b"
    }));
    assert.equal(other.ok,false);
    assert.equal(other.error.code,"AGENT_RUN_NOT_FOUND");
    const foreign=await get.execute(request(foreignId));
    assert.equal(foreign.ok,false);
    assert.equal(foreign.error.code,"AGENT_RUN_NOT_FOUND");
    assert.equal(invoked,2,"foreign legacy run must not invoke async fallback");
    const missing=await get.execute(request("run:no-such"));
    assert.equal(missing.ok,false);
    assert.equal(missing.error.code,"AGENT_RUN_NOT_FOUND");
    assert.equal(invoked,3);
    console.log("PA02_ACTUAL_HOST_ACTION_PG_READ="+JSON.stringify({
      status:"PASS",realActionHandler:true,postgresBacked:true,
      enterpriseIsolation:true,legacyScopeDenialNeverFallsBack:true,
      businessWriteInvoked:false,productionEnabled:false
    }));
  }finally{
    if(repository)await repository.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await admin.end();}
  }
});
