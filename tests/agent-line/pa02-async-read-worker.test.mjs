import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,createHash} from "node:crypto";
import postgres from "postgres";
import {createPostgresAgentDurabilityProofV020}
  from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import {createPostgresAgentExecutionCoordinatorV020}
  from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";
import {createPostgresAtomicAgentRunCancellationV020}
  from "../../dist/agents/enterprise-agent/pa02c-atomic-run-cancel.js";
import {createPostgresFencedAgentRunAuthorityV030}
  from "../../dist/agents/enterprise-agent/pa02b-fenced-run-authority.js";
import {createReadOnlyFencedAgentWorkerV030}
  from "../../dist/agents/enterprise-agent/pa02-async-read-worker.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"async-read-human",
  actorType:"HUMAN",identityProviderId:"fixture"};
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:async-read-human",ownerSubjectId:"async-read-human"},
  activeContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:async-read-human"}};
const scope={principalSubjectId:principal.subjectId,
  principalActorType:principal.actorType,contextKind:"PERSONAL",
  contextId:context.activeContext.contextId};
const sha=s=>createHash("sha256").update(s).digest("hex");

test("PA02: actual read-only Agent Worker restores Run from fenced PostgreSQL after lease handoff",{
  skip:!url?"Requires disposable PA02A_PROOF_DATABASE_URL":false,timeout:90000
},async()=>{
  const schema="agent_pa02_read_"+randomUUID().replaceAll("-","").slice(0,12);
  const admin=postgres(url,{max:2});
  let repo,execution,authorityA,authorityB,cancels;
  let toolReads=0,inferences=0;
  let releaseModel,modelEntered;
  const modelGate=new Promise(resolve=>releaseModel=resolve);
  const enteredGate=new Promise(resolve=>modelEntered=resolve);
  const provider={
    providerId:"read.fixture",modelId:"deterministic",
    async infer(request){
      inferences++;
      const user=request.messages.findLast(x=>x.role==="user")?.content??"";
      if(user.includes("cancel me")){
        modelEntered();
        await modelGate;
        return {contractVersion:"0.1.0",providerId:this.providerId,
          modelId:this.modelId,text:"Should not appear",toolCalls:[],
          usage:{inputTokens:1,outputTokens:1},finishReason:"stop"};
      }
      if(request.messages.some(x=>x.content.includes("READ-OK"))) {
        return {contractVersion:"0.1.0",providerId:this.providerId,
          modelId:this.modelId,text:"grounded final",toolCalls:[],
          usage:{inputTokens:1,outputTokens:1},finishReason:"stop"};
      }
      return {contractVersion:"0.1.0",providerId:this.providerId,
        modelId:this.modelId,text:"",toolCalls:[{name:"test_read",arguments:{}}],
        usage:{inputTokens:1,outputTokens:1},finishReason:"tool_calls"};
    }
  };
  const catalog=()=>({
    list(){return [{
      contractVersion:"0.1.0",id:"test.read",modelName:"test_read",
      title:"Read",description:"Authorized read",inputSchema:{
        type:"object",properties:{},additionalProperties:false
      },effect:"READ",ownerPackageId:"sandbox"
    },{
      contractVersion:"0.1.0",id:"test.write",modelName:"test_write",
      title:"Write",description:"Unsafe write",inputSchema:{
        type:"object",properties:{},additionalProperties:false
      },effect:"WRITE",ownerPackageId:"sandbox"
    }]},
    async invoke(call){
      assert.equal(call.tool,"test.read");
      toolReads++;
      return {tool:call.tool,ok:true,result:{value:"READ-OK"}};
    }
  });
  let eventNumber=0,sliceNumber=0;
  const worker=authority=>createReadOnlyFencedAgentWorkerV030({
    authority,resolveProvider:()=>provider,createToolCatalog:catalog,
    eventId:()=>String(++eventNumber),sliceId:()=>String(++sliceNumber),
    now:()=>new Date("2026-10-13T01:00:00.000Z"),ttlSeconds:300
  });
  const resume=(w,runId,workerId)=>w.resumeOnce({
    runId,workerId,principal,context
  });
  const expire=runId=>admin.unsafe('UPDATE "'+schema+'".pa02b_leases '+
    "SET expires_at=clock_timestamp()-interval '5 seconds' WHERE run_id=$1",[runId]);
  async function makeRun(label,message) {
    const runId="run:"+label;
    await repo.claimTurn({scope,threadId:"thread:"+label,clientTurnId:"turn:"+label,
      taskDigest:sha(label),taskPayload:{message},
      created:{
        contractVersion:"0.1.0",eventId:"created:"+randomUUID(),runId,
        occurredAt:"2026-10-13T00:00:00.000Z",type:"RUN_CREATED",
        payload:{principalSubjectId:principal.subjectId,
          principalActorType:principal.actorType,context:context.activeContext,
          sourceInteractionId:"thread:"+label,sourceActionId:"turn:"+label,
          input:{message,conversationHistory:[],locale:"en",
            providerId:provider.providerId,modelId:provider.modelId}}
      }
    });
    return runId;
  }
  try{
    repo=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    execution=await createPostgresAgentExecutionCoordinatorV020({connectionString:url,schema});
    cancels=await createPostgresAtomicAgentRunCancellationV020({connectionString:url,schema});
    authorityA=await createPostgresFencedAgentRunAuthorityV030({connectionString:url,schema});
    authorityB=await createPostgresFencedAgentRunAuthorityV030({connectionString:url,schema});
    const one=worker(authorityA),two=worker(authorityB);
    const runId=await makeRun("ordinary","read then answer");
    const first=await resume(one,runId,"worker:A");
    assert.equal(first.advanced,true);
    assert.equal(first.run.state,"PAUSED");
    assert.equal(first.run.observations.length,1);
    assert.equal(toolReads,1);
    const locked=await resume(two,runId,"worker:B");
    assert.equal(locked.claimed,false);
    assert.equal(locked.advanced,false);
    await expire(runId);
    const next=await resume(two,runId,"worker:B");
    assert.equal(next.run.state,"SUCCEEDED");
    assert.equal(next.run.finalMessage,"grounded final");
    assert.equal(toolReads,1);
    assert.equal(inferences,2);
    assert.equal((await authorityA.read({scope,runId})).run.state,"SUCCEEDED");

    const writeRun=await makeRun("pending-write","unsafe decision restored");
    await repo.appendRunEvent({scope,runId:writeRun,expectedRevision:0,event:{
      contractVersion:"0.1.0",eventId:"seed-start:"+randomUUID(),
      runId:writeRun,type:"SLICE_STARTED",sliceId:"slice:write",
      occurredAt:"2026-10-13T00:01:00.000Z",payload:{}
    }});
    await repo.appendRunEvent({scope,runId:writeRun,expectedRevision:1,event:{
      contractVersion:"0.1.0",eventId:"seed-decision:"+randomUUID(),
      runId:writeRun,type:"MODEL_DECISION_RECORDED",sliceId:"slice:write",
      occurredAt:"2026-10-13T00:02:00.000Z",payload:{
        decision:{type:"tool",call:{tool:"test.write",arguments:{}}}
      }
    }});
    const safety=await resume(one,writeRun,"worker:write");
    assert.equal(safety.run.state,"BLOCKED");
    assert.equal(safety.run.blocker.code,"PA02_WORKER_WRITE_REQUIRES_OWNER_PORT");
    assert.equal(safety.writeDeferred,true);
    assert.equal(toolReads,1);

    const cancelRun=await makeRun("cancel","cancel me");
    const inflight=resume(one,cancelRun,"worker:cancel");
    await enteredGate;
    await cancels.request({scope,runId:cancelRun,
      requestedBy:scope.principalSubjectId,reason:"User requested cancellation"});
    releaseModel();
    await assert.rejects(inflight,/PA02B_FENCED_CANCEL_REQUESTED/);
    assert.equal((await authorityA.read({scope,runId:cancelRun})).run.state,"RUNNING");
    await expire(cancelRun);
    const canceled=await cancels.commitSafe({scope,runId:cancelRun,
      eventId:"cancel-event:"+randomUUID(),occurredAt:"2026-10-13T01:01:00.000Z"});
    assert.equal(canceled.runState,"CANCELLED");
    assert.equal((await resume(two,cancelRun,"worker:late")).run.state,"CANCELLED");
    assert.equal(toolReads,1);

    await authorityA.close();authorityA=undefined;
    await authorityB.close();authorityB=undefined;
    authorityB=await createPostgresFencedAgentRunAuthorityV030({
      connectionString:url,schema
    });
    assert.equal((await authorityB.read({scope,runId})).run.state,"SUCCEEDED");
    assert.equal((await authorityB.read({scope,runId:cancelRun})).run.state,"CANCELLED");
    console.log("PA02_STAGED_ASYNC_READ_WORKER="+JSON.stringify({
      status:"PASS",authorizedReadExecuted:true,modelDecisionsDurable:true,
      replacementWorkerRecovers:true,noDuplicateRead:true,
      materialWriteNeverInvoked:true,cancelInFlightFailsClosed:true,
      terminalCancelPersisted:true,tenantScopeHostResolved:true,
      processReconnected:true,productionWired:false,actualBusinessWrite:false
    }));
  }finally{
    if(releaseModel)releaseModel();
    for(const s of [authorityA,authorityB,cancels,execution,repo])if(s)await s.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await admin.end();}
  }
});
