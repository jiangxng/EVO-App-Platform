import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import postgres from "postgres";
import { createPostgresAgentExecutionCoordinatorV020 } from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const scope={principalSubjectId:"pa02b-human",principalActorType:"HUMAN",contextKind:"ENTERPRISE",
  contextId:"enterprise:pa02b",enterpriseId:"tenant-a"};
const digest=value=>createHash("sha256").update(value).digest("hex");

test("PA02B: two-client lease fencing, durable write intent, and fail-closed unknown outcome",{
  skip:!url?"Requires disposable PA02A_PROOF_DATABASE_URL":false,timeout:90000
},async()=>{
  const schema="agent_pa02b_"+randomUUID().replaceAll("-","").slice(0,16);
  const admin=postgres(url,{max:2});
  let left,right,restarted;
  try{
    left=await createPostgresAgentExecutionCoordinatorV020({connectionString:url,schema});
    right=await createPostgresAgentExecutionCoordinatorV020({connectionString:url,schema});
    const requests=Array.from({length:24},(_,i)=>({
      scope,runId:"run:race",ownerId:"worker:"+i,ttlSeconds:300
    }));
    const winners=await Promise.all(requests.map((r,i)=>(i%2?right:left).claimLease(r)));
    assert.equal(winners.filter(Boolean).length,1);
    const winning=winners.find(Boolean);
    const stale={...winning};
    assert.equal((await right.renewLease({scope,lease:winning,ttlSeconds:300})).fence,1);
    const first=await left.prepareWrite({
      scope,lease:winning,effectId:"write:source:1",inputDigest:digest("same")
    });
    assert.equal(first.created,true);
    assert.equal(first.state,"PREPARED");
    const replay=await right.prepareWrite({
      scope,lease:winning,effectId:"write:source:1",inputDigest:digest("same")
    });
    assert.equal(replay.created,false);
    await assert.rejects(left.prepareWrite({
      scope,lease:winning,effectId:"write:source:1",inputDigest:digest("different")
    }),/PA02B_WRITE_IDEMPOTENCY_CONFLICT/);
    const invoking=await left.beginWrite({scope,lease:winning,effectId:"write:source:1"});
    assert.equal(invoking.state,"INVOKING");
    await assert.rejects(right.beginWrite({scope,lease:winning,effectId:"write:source:1"}),
      /PA02B_WRITE_MAY_HAVE_EXECUTED/);
    // Synthetic clock advancement in an isolated disposable table, not a sleep.
    await admin.unsafe('UPDATE "'+schema+'".pa02b_leases SET expires_at=clock_timestamp()-interval \'5 seconds\' WHERE run_id=$1',
      ["run:race"]);
    assert.equal(await left.renewLease({scope,lease:stale,ttlSeconds:300}),undefined);
    const next=await right.claimLease({scope,runId:"run:race",ownerId:"worker:successor",ttlSeconds:300});
    assert.equal(next.fence,2);
    await assert.rejects(left.completeWrite({
      scope,lease:stale,effectId:"write:source:1",outcome:"SUCCEEDED"
    }),/PA02B_LEASE_FENCED/);
    await assert.rejects(right.beginWrite({scope,lease:next,effectId:"write:source:1"}),
      /PA02B_WRITE_MAY_HAVE_EXECUTED/);
    assert.equal((await right.getWrite({scope,effectId:"write:source:1"})).state,"INVOKING");
    assert.equal((await right.markUnknown({scope,effectId:"write:source:1"})).state,"UNKNOWN");
    assert.equal((await right.markUnknown({scope,effectId:"write:source:1"})).state,"UNKNOWN");
    await assert.rejects(right.beginWrite({scope,lease:next,effectId:"write:source:1"}),
      /PA02B_WRITE_MAY_HAVE_EXECUTED/);

    // Verified tool execution belongs to a single active token, not an expired worker.
    const prepared=await right.prepareWrite({
      scope,lease:next,effectId:"write:source:2",inputDigest:digest("next")
    });
    assert.equal(prepared.created,true);
    await right.beginWrite({scope,lease:next,effectId:"write:source:2"});
    assert.equal((await right.completeWrite({
      scope,lease:next,effectId:"write:source:2",outcome:"SUCCEEDED"
    })).state,"SUCCEEDED");
    await assert.rejects(right.completeWrite({
      scope,lease:next,effectId:"write:source:2",outcome:"FAILED"
    }),/PA02B_WRITE_FINALIZATION_CONFLICT/);
    assert.equal(await right.getWrite({scope:{...scope,enterpriseId:"tenant-b"},effectId:"write:source:2"}),
      undefined);
    await left.close();left=undefined;
    await right.close();right=undefined;
    restarted=await createPostgresAgentExecutionCoordinatorV020({connectionString:url,schema});
    assert.equal((await restarted.getWrite({scope,effectId:"write:source:1"})).state,"UNKNOWN");
    assert.equal((await restarted.getWrite({scope,effectId:"write:source:2"})).state,"SUCCEEDED");
    const all=await admin.unsafe('SELECT state,count(*)::int AS total FROM "'+schema+'".pa02b_writes GROUP BY state ORDER BY state');
    assert.deepEqual(all.map(x=>[x.state,Number(x.total)]),[["SUCCEEDED",1],["UNKNOWN",1]]);
    console.log("PA02B_FENCED_OUTBOX_PROOF="+JSON.stringify({
      status:"PASS",concurrentClaimants:24,initialWinners:1,fenceBefore:1,fenceAfter:2,
      staleCompletionRejected:true,unknownWriteNeverReplayed:true,
      separateConnectionRecoveredState:true,tenantReadIsolation:true,
      externalToolInvoked:false,hostAdapterEnabled:false,productionUsed:false
    }));
  }finally{
    if(left)await left.close();
    if(right)await right.close();
    if(restarted)await restarted.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}finally{await admin.end();}
  }
});
