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

const url=process.env.PA02A_PROOF_DATABASE_URL;
const scope={principalSubjectId:"fenced-worker-human",principalActorType:"HUMAN",
  contextKind:"ENTERPRISE",contextId:"context:worker",enterpriseId:"tenant-1"};
const ctx={contractVersion:"0.1.0",kind:"ENTERPRISE",
  contextId:scope.contextId,enterpriseId:scope.enterpriseId};
const digest=s=>createHash("sha256").update(s).digest("hex");
const e=(runId,type,payload={},sliceId)=>({
  contractVersion:"0.1.0",eventId:"event:"+randomUUID(),runId,type,
  occurredAt:"2026-10-13T00:02:00.000Z",payload,
  ...(sliceId?{sliceId}:{})
});

test("PA02B Worker: lease and V010 Run revision are fenced in one transaction",{
  skip:!url?"Requires disposable PA02A_PROOF_DATABASE_URL":false,timeout:90000
},async()=>{
  const schema="agent_pa02b_worker_"+randomUUID().replaceAll("-","").slice(0,12);
  const admin=postgres(url,{max:2});
  let runs,coordinator,cancel,a,b;
  async function createRun(label) {
    const runId="run:"+label;
    assert.equal((await runs.claimTurn({
      scope,threadId:"thread:"+label,clientTurnId:"turn:"+label,
      taskDigest:digest(label),taskPayload:{label},
      created:e(runId,"RUN_CREATED",{
        principalSubjectId:scope.principalSubjectId,
        principalActorType:scope.principalActorType,
        context:ctx,sourceInteractionId:"thread:"+label,sourceActionId:"turn:"+label,
        input:{message:"sandbox "+label,conversationHistory:[],locale:"en",
          providerId:"fake",modelId:"deterministic"}
      })
    })).created,true);
    return runId;
  }
  const expire=runId=>admin.unsafe('UPDATE "'+schema+'".pa02b_leases SET '+
    "expires_at=clock_timestamp()-interval '5 seconds' WHERE run_id=$1",[runId]);
  try {
    runs=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    coordinator=await createPostgresAgentExecutionCoordinatorV020({connectionString:url,schema});
    cancel=await createPostgresAtomicAgentRunCancellationV020({connectionString:url,schema});
    a=await createPostgresFencedAgentRunAuthorityV030({connectionString:url,schema});
    b=await createPostgresFencedAgentRunAuthorityV030({connectionString:url,schema});
    const runId=await createRun("ordinary");
    const candidates=await Promise.all(Array.from({length:32},(_,i)=>
      (i%2?b:a).claim({scope,runId,workerId:"worker:"+i,ttlSeconds:300})
    ));
    assert.equal(candidates.filter(Boolean).length,1);
    const first=candidates.find(Boolean);
    assert.equal(first.fence,1);
    assert.equal((await a.append({
      scope,lease:first,expectedRevision:0,
      event:e(runId,"SLICE_STARTED",{},"slice:1")
    })).run.state,"RUNNING");
    await assert.rejects(a.append({
      scope,lease:first,expectedRevision:0,
      event:e(runId,"MODEL_DECISION_RECORDED",{
        decision:{type:"final",message:"not committed"}
      },"slice:1")
    }),/PA02B_FENCED_REVISION_CONFLICT/);
    await expire(runId);
    const second=await b.claim({scope,runId,workerId:"worker:replacement",ttlSeconds:300});
    assert.equal(second.fence,2);
    await assert.rejects(a.append({
      scope,lease:first,expectedRevision:1,
      event:e(runId,"MODEL_DECISION_RECORDED",{
        decision:{type:"final",message:"stale worker"}
      },"slice:1")
    }),/PA02B_LEASE_FENCED/);
    const decision=await b.append({
      scope,lease:second,expectedRevision:1,
      event:e(runId,"MODEL_DECISION_RECORDED",{
        decision:{type:"final",message:"finished"}
      },"slice:1")
    });
    assert.equal(decision.revision,2);
    const finish=await b.append({
      scope,lease:second,expectedRevision:2,
      event:e(runId,"RUN_SUCCEEDED",{message:"finished"})
    });
    assert.deepEqual([finish.run.state,finish.revision],["SUCCEEDED",3]);
    assert.equal(await a.claim({scope,runId,workerId:"late",ttlSeconds:300}),undefined);
    assert.equal(await b.renew({scope,lease:second,ttlSeconds:300}),undefined);
    await assert.rejects(b.append({
      scope,lease:second,expectedRevision:3,
      event:e(runId,"RUN_FAILED",{reason:"late failure"})
    }),/AGENT_RUN_TERMINAL_STATE_IMMUTABLE/);
    const other={...scope,enterpriseId:"tenant-2"};
    assert.equal(await a.read({scope:other,runId}),undefined);
    assert.equal(await a.claim({scope:other,runId,workerId:"attacker",ttlSeconds:300}),undefined);

    const runCancel=await createRun("cancel");
    const active=await a.claim({scope,runId:runCancel,workerId:"worker:cancel",ttlSeconds:300});
    await cancel.request({scope,runId:runCancel,requestedBy:scope.principalSubjectId,reason:"Stop"});
    await assert.rejects(a.append({
      scope,lease:active,expectedRevision:0,
      event:e(runCancel,"SLICE_STARTED",{},"slice:cancel")
    }),/PA02B_FENCED_CANCEL_REQUESTED/);
    assert.equal(await a.renew({scope,lease:active,ttlSeconds:300}),undefined);
    await expire(runCancel);
    const safe=await cancel.commitSafe({
      scope,runId:runCancel,eventId:"cancel-event:"+randomUUID(),
      occurredAt:"2026-10-13T00:03:00.000Z"
    });
    assert.equal(safe.runState,"CANCELLED");
    assert.equal(await b.claim({scope,runId:runCancel,workerId:"late",ttlSeconds:300}),undefined);

    await a.close();a=undefined;
    await b.close();b=undefined;
    b=await createPostgresFencedAgentRunAuthorityV030({connectionString:url,schema});
    assert.deepEqual([(await b.read({scope,runId})).revision,
      (await b.read({scope,runId})).run.state],[3,"SUCCEEDED"]);
    assert.equal((await b.read({scope,runId:runCancel})).run.state,"CANCELLED");
    console.log("PA02B_FENCED_RUN_AUTHORITY="+JSON.stringify({
      status:"PASS",concurrentWorkers:32,onlyOneLease:true,
      fencingAfterExpiry:true,staleWorkerCannotAppend:true,
      runRevisionCAS:true,terminalRunNotClaimed:true,
      canceledRunNotClaimed:true,postCancelAppendDenied:true,
      tenantIsolation:true,durableAcrossConnections:true,
      ownerWriteExecuted:false,formalHostWired:false,productionUsed:false
    }));
  }finally{
    for(const s of [runs,coordinator,cancel,a,b])if(s)await s.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await admin.end();}
  }
});
