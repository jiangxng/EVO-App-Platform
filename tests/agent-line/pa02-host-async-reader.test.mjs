import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID,createHash } from "node:crypto";
import postgres from "postgres";
import {createPostgresAgentDurabilityProofV020}
  from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import {createHostAsyncRunReaderPortV020}
  from "../../dist/manager/agent-async-run-reader.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"async-reader-human",
  actorType:"HUMAN",identityProviderId:"fixture"};
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:async-reader-human",ownerSubjectId:"async-reader-human"},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"context:reader-a",enterpriseId:"enterprise:A"},
  enterpriseContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"context:reader-a",enterpriseId:"enterprise:A",
    enterpriseProviderId:"fixture",lifecycleState:"ACTIVE"}};
const scope={principalSubjectId:principal.subjectId,
  principalActorType:principal.actorType,contextKind:"ENTERPRISE",
  contextId:context.activeContext.contextId,
  enterpriseId:context.activeContext.enterpriseId};

test("Host injected async Run reader: actual PG V010 rehydration and strict context scope",{
  skip:!url?"Requires disposable PA02A_PROOF_DATABASE_URL":false,timeout:90000
},async()=>{
  const schema="agent_pa02_reader_"+randomUUID().replaceAll("-","").slice(0,12);
  const admin=postgres(url,{max:2});
  let repository,second;
  try{
    repository=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    const runId="run:"+randomUUID(),clientTurnId="turn:"+randomUUID();
    await repository.claimTurn({
      scope,threadId:"thread:fixture",clientTurnId,taskDigest:createHash("sha256")
        .update("canonical").digest("hex"),taskPayload:{message:"fixture"},
      created:{contractVersion:"0.1.0",eventId:"event:"+randomUUID(),
        runId,type:"RUN_CREATED",occurredAt:"2026-10-13T00:00:00.000Z",
        payload:{principalSubjectId:principal.subjectId,
          principalActorType:principal.actorType,context:context.activeContext,
          sourceInteractionId:"thread:fixture",sourceActionId:"turn:fixture",
          input:{message:"fixture",conversationHistory:[],
            locale:"en",providerId:"fixture",modelId:"deterministic"}}}
    });
    const port=createHostAsyncRunReaderPortV020(repository);
    assert.equal((await port.read({runId,principal,context})).state,"READY");
    assert.equal(await port.read({runId:"not-present",principal,context}),undefined);
    const other={...context,
      activeContext:{...context.activeContext,contextId:"context:reader-b",
        enterpriseId:"enterprise:B"},
      enterpriseContext:{...context.enterpriseContext,contextId:"context:reader-b",
        enterpriseId:"enterprise:B"}};
    assert.equal(await port.read({runId,principal,context:other}),undefined);
    assert.equal(await port.read({
      runId,principal:{...principal,subjectId:"attacker"},context
    }),undefined);
    await repository.close();repository=undefined;
    second=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    assert.equal((await createHostAsyncRunReaderPortV020(second)
      .read({runId,principal,context})).state,"READY");
    assert.throws(()=>createHostAsyncRunReaderPortV020(undefined),
      /AGENT_ASYNC_READER_REPOSITORY_REQUIRED/);
    console.log("PA02_HOST_ASYNC_READER_PORT="+JSON.stringify({
      status:"PASS",actualPostgres:true,scopedHostIdentity:true,
      alternateEnterpriseHidden:true,runV010Rehydrated:true,
      freshConnectionRestore:true,noProductionBinding:true
    }));
  }finally{
    if(repository)await repository.close();
    if(second)await second.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await admin.end();}
  }
});
