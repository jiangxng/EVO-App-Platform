import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPostgresAgentDurabilityProofV020} from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import {createHostScopedAsyncAgentRunBridgeV020,hostResolvedAgentDurabilityScopeV020}
  from "../../dist/manager/agent-durability-host-bridge.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"host-human",actorType:"HUMAN",identityProviderId:"test"};
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",contextId:"personal:host-human",
    ownerSubjectId:"host-human"},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",contextId:"context:A",enterpriseId:"tenant-A"},
  enterpriseContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",contextId:"context:A",
    enterpriseId:"tenant-A",enterpriseProviderId:"test",lifecycleState:"ACTIVE"}
};
const event=()=>({contractVersion:"0.1.0",eventId:"event:"+randomUUID(),
  runId:"run:"+randomUUID(),type:"RUN_CREATED",occurredAt:"2026-10-13T00:00:00.000Z",
  payload:{
    principalSubjectId:principal.subjectId,principalActorType:principal.actorType,
    context:context.activeContext,sourceInteractionId:"thread:A",
    sourceActionId:"enterprise-agent.thread.send:turn-A",
    input:{message:"check customer mapping",conversationHistory:[],locale:"en",
      providerId:"test-model",modelId:"deterministic",interactionContext:{importJobId:"job:A"}}
  }
});

test("PA02A staged Host bridge: strict session scope, canonical turn and V010 event replay",{
  skip:!url?"Requires disposable PA02A_PROOF_DATABASE_URL":false,timeout:90000
},async()=>{
  const schema="agent_pa02a_host_"+randomUUID().replaceAll("-","").slice(0,14);
  const admin=postgres(url,{max:1});
  let repo,reopened;
  try{
    repo=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    const bridge=createHostScopedAsyncAgentRunBridgeV020({repository:repo,principal,context});
    const first=await bridge.claimTurn({threadId:"thread:A",clientTurnId:"turn-A",created:event()});
    assert.equal(first.created,true);
    assert.equal(first.run.state,"READY");
    const replay=await bridge.claimTurn({threadId:"thread:A",clientTurnId:"turn-A",created:event()});
    assert.equal(replay.created,false);
    assert.equal(replay.runId,first.runId);
    assert.equal((await bridge.getByTurn({threadId:"thread:A",clientTurnId:"turn-A"})).runId,first.runId);
    const changed=event();
    changed.payload.input.interactionContext.importJobId="job:B";
    await assert.rejects(bridge.claimTurn({
      threadId:"thread:A",clientTurnId:"turn-A",created:changed
    }),/CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED/);
    const forged=event();
    forged.payload.principalSubjectId="attacker";
    await assert.rejects(bridge.claimTurn({
      threadId:"thread:A",clientTurnId:"turn-forged",created:forged
    }),/AGENT_DURABILITY_CREATED_SCOPE_MISMATCH/);
    const final={contractVersion:"0.1.0",eventId:"event:"+randomUUID(),
      runId:first.runId,type:"RUN_SUCCEEDED",occurredAt:"2026-10-13T00:01:00.000Z",
      payload:{message:"accepted"}};
    const advanced=await bridge.appendRunEvent({
      runId:first.runId,expectedRevision:0,event:final
    });
    assert.equal(advanced.revision,1);
    assert.equal(advanced.run.state,"SUCCEEDED");
    await assert.rejects(bridge.appendRunEvent({
      runId:first.runId,expectedRevision:1,
      event:{...final,eventId:"event:"+randomUUID(),type:"RUN_FAILED",payload:{reason:"late"}}
    }),/AGENT_RUN_TERMINAL_STATE_IMMUTABLE/);
    await repo.close();repo=undefined;
    reopened=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    const after=createHostScopedAsyncAgentRunBridgeV020({repository:reopened,principal,context});
    assert.equal((await after.getRun(first.runId)).state,"SUCCEEDED");
    assert.equal((await after.getByTurn({threadId:"thread:A",clientTurnId:"turn-A"})).runId,first.runId);
    const other={
      ...context,
      activeContext:{...context.activeContext,contextId:"context:B",enterpriseId:"tenant-B"},
      enterpriseContext:{...context.enterpriseContext,contextId:"context:B",enterpriseId:"tenant-B"}
    };
    const isolated=createHostScopedAsyncAgentRunBridgeV020({repository:reopened,principal,context:other});
    assert.equal(await isolated.getByTurn({threadId:"thread:A",clientTurnId:"turn-A"}),undefined);
    assert.equal(await isolated.getRun(first.runId),undefined);
    assert.throws(()=>hostResolvedAgentDurabilityScopeV020({
      principal:{...principal,actorType:"SERVICE"},context
    }),/AGENT_DURABILITY_HOST_IDENTITY_REQUIRED/);
    assert.throws(()=>hostResolvedAgentDurabilityScopeV020({
      principal,context:{...context,enterpriseContext:{...context.enterpriseContext,lifecycleState:"ARCHIVED"}}
    }),/AGENT_DURABILITY_ENTERPRISE_CONTEXT_NOT_ACTIVE/);
    assert.throws(()=>hostResolvedAgentDurabilityScopeV020({
      principal,context:{...context,activeContext:{contractVersion:"0.1.0",
        kind:"PERSONAL",contextId:"personal:someone-else"}}
    }),/AGENT_DURABILITY_PERSONAL_OWNER_MISMATCH/);
    console.log("PA02A_HOST_ASYNC_STAGING="+JSON.stringify({
      status:"PASS",hostResolvedScopeRequired:true,canonicalReplay:true,
      changedSourceRejected:true,forgedPrincipalRejected:true,terminalReducerReplayed:true,
      crossEnterpriseLookupHidden:true,postgresProcessReopen:true,
      v010RuntimeStillAuthoritative:true,serverCutoverEnabled:false,productionUsed:false
    }));
  }finally{
    if(repo)await repo.close();
    if(reopened)await reopened.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}finally{await admin.end();}
  }
});
