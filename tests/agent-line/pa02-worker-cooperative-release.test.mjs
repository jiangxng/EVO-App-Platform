import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,createHash} from "node:crypto";
import postgres from "postgres";
import {createPostgresAgentDurabilityProofV020}
  from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import {createPostgresAgentExecutionCoordinatorV020}
  from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";
import {createPostgresFencedAgentRunAuthorityV030}
  from "../../dist/agents/enterprise-agent/pa02b-fenced-run-authority.js";
import {createReadOnlyFencedAgentWorkerV030}
  from "../../dist/agents/enterprise-agent/pa02-async-read-worker.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"cooperative-worker-human",
  actorType:"HUMAN",identityProviderId:"fixture"};
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:cooperative-worker-human",ownerSubjectId:principal.subjectId},
  activeContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:cooperative-worker-human"}};
const scope={principalSubjectId:principal.subjectId,principalActorType:principal.actorType,
  contextKind:"PERSONAL",contextId:context.activeContext.contextId};

test("PA02 fenced Worker yields lease immediately, and stale release cannot free successor",{
  skip:!url?"Needs disposable PostgreSQL":false,timeout:90000
},async()=>{
  const schema="pa02_yield_"+randomUUID().replaceAll("-","").slice(0,18);
  const admin=postgres(url,{max:2});
  let repo,coord,a,b;
  try{
    repo=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    coord=await createPostgresAgentExecutionCoordinatorV020({connectionString:url,schema});
    a=await createPostgresFencedAgentRunAuthorityV030({connectionString:url,schema});
    b=await createPostgresFencedAgentRunAuthorityV030({connectionString:url,schema});
    const runId="run:yield:"+randomUUID();
    await repo.claimTurn({scope,threadId:"thread:yield",clientTurnId:"turn:yield",
      taskPayload:{message:"read this"},taskDigest:createHash("sha256").update("read").digest("hex"),
      created:{contractVersion:"0.1.0",eventId:"event:"+randomUUID(),
        // Lease release is tested with a fresh Run, not an expired historical fixture.
        runId,type:"RUN_CREATED",occurredAt:new Date().toISOString(),
        payload:{principalSubjectId:principal.subjectId,principalActorType:principal.actorType,
          context:context.activeContext,sourceInteractionId:"thread:yield",
          sourceActionId:"turn:yield",input:{message:"read this",
            conversationHistory:[],locale:"en",providerId:"fixture",modelId:"sample"}}}
    });
    let reads=0,models=0;
    const model={
      providerId:"fixture",modelId:"sample",
      async infer(r){
        models++;
        if(r.messages.some(m=>m.content.includes("READ-OK"))) {
          return {contractVersion:"0.1.0",providerId:"fixture",modelId:"sample",
            text:"done",toolCalls:[],finishReason:"stop"};
        }
        return {contractVersion:"0.1.0",providerId:"fixture",modelId:"sample",
          text:"",toolCalls:[{name:"test_read",arguments:{}}],finishReason:"tool_calls"};
      }
    };
    const catalog=()=>({
      list(){return [{contractVersion:"0.1.0",id:"test.read",modelName:"test_read",
        title:"Read",description:"read",inputSchema:{type:"object",
          properties:{},additionalProperties:false},effect:"READ",ownerPackageId:"fixture"}];},
      async invoke(call){assert.equal(call.tool,"test.read");reads++;
        return {tool:call.tool,ok:true,result:{value:"READ-OK"}};}
    });
    const worker=(authority,releaseOnReturn)=>createReadOnlyFencedAgentWorkerV030({
      authority,releaseOnReturn,resolveProvider:()=>model,createToolCatalog:catalog,
      eventId:randomUUID,sliceId:randomUUID,ttlSeconds:300
    });
    const resume=(w,id)=>w.resumeOnce({runId,workerId:id,principal,context});
    const first=await resume(worker(a,true),"worker:A");
    assert.equal(first.run.state,"PAUSED");
    assert.equal(reads,1);
    const expired=await admin.unsafe('SELECT owner_id,fence,expires_at FROM "'+schema+
      '".pa02b_leases WHERE run_id=$1',[runId]);
    assert.equal(expired[0].owner_id,"worker:A");
    assert.equal(Number(expired[0].fence),1);
    assert.ok(Date.parse(expired[0].expires_at)<=Date.now());
    // No test-specific clock advancement, unlike prior crash recovery proofs.
    const second=await resume(worker(b,false),"worker:B");
    assert.equal(second.claimed,true);
    assert.equal(second.run.state,"SUCCEEDED");
    assert.equal(second.run.finalMessage,"done");
    assert.equal(reads,1);
    assert.equal(models,2);
    const old={runId,ownerId:"worker:A",fence:1,
      expiresAt:new Date(expired[0].expires_at).toISOString()};
    assert.equal(await a.release({scope,lease:old}),false);
    const current=await admin.unsafe('SELECT owner_id,fence,expires_at FROM "'+schema+
      '".pa02b_leases WHERE run_id=$1',[runId]);
    assert.equal(current[0].owner_id,"worker:B");
    assert.equal(Number(current[0].fence),2);
    assert.ok(Date.parse(current[0].expires_at)>Date.now());
    assert.equal(await b.release({scope,lease:{
      runId,ownerId:"worker:B",fence:2,
      expiresAt:new Date(current[0].expires_at).toISOString()
    }}),true);
    assert.equal(await b.release({scope,lease:old}),false);
    console.log("PA02_WORKER_COOPERATIVE_RELEASE="+JSON.stringify({
      status:"PASS",normalYieldImmediate:true,noClockTravel:true,
      successorFence:2,staleCannotRelease:true,noDuplicateRead:true,
      runTerminal:"SUCCEEDED",productionWired:false
    }));
  }finally{
    for(const x of [a,b,coord,repo])if(x)await x.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await admin.end();}
  }
});
