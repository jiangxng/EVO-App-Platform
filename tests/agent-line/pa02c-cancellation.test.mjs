import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import postgres from "postgres";
import { createPostgresAgentExecutionCoordinatorV020 } from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";
import { createPostgresAgentCancellationCoordinatorV020 } from "../../dist/agents/enterprise-agent/pa02c-postgres-cancellation.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const scope={principalSubjectId:"cancel-test-human",principalActorType:"HUMAN",
  contextKind:"ENTERPRISE",contextId:"enterprise:pa02c",enterpriseId:"tenant-A"};
const digest=s=>createHash("sha256").update(s).digest("hex");
const request=(runId,reason="Human stop")=>({scope,runId,requestedBy:scope.principalSubjectId,reason});
const expiry=(sql,schema,runId)=>sql.unsafe('UPDATE "'+schema+'".pa02b_leases '+
  "SET expires_at=clock_timestamp()-interval '3 seconds' WHERE run_id=$1",[runId]);

test("PA02C: persisted cancellation prevents new WRITE and never hides an unknown execution",{
  skip:!url?"Requires disposable PA02A_PROOF_DATABASE_URL":false,timeout:90000
},async()=>{
  const schema="agent_pa02c_"+randomUUID().replaceAll("-","").slice(0,16);
  const admin=postgres(url,{max:2});
  let b,c;
  try{
    b=await createPostgresAgentExecutionCoordinatorV020({connectionString:url,schema});
    c=await createPostgresAgentCancellationCoordinatorV020({connectionString:url,schema});

    const idle=await c.request(request("run:idle"));
    assert.equal(idle.status,"REQUESTED");
    assert.equal((await c.request(request("run:idle","cannot overwrite"))).reason,"Human stop");
    assert.equal((await c.completeSafe({scope,runId:"run:idle"})).status,"CANCELLED");
    assert.equal((await c.completeSafe({scope,runId:"run:idle"})).status,"CANCELLED");
    assert.equal(await b.claimLease({scope,runId:"run:idle",ownerId:"late-worker",ttlSeconds:30}),undefined);

    const lease=await b.claimLease({scope,runId:"run:prepared",ownerId:"worker-1",ttlSeconds:300});
    assert.ok(lease);
    await b.prepareWrite({scope,lease,effectId:"effect:prepared",inputDigest:digest("prepared")});
    await c.request(request("run:prepared"));
    await assert.rejects(b.beginWrite({scope,lease,effectId:"effect:prepared"}),/PA02C_CANCEL_REQUESTED/);
    await assert.rejects(b.prepareWrite({scope,lease,effectId:"effect:new",inputDigest:digest("new")}),
      /PA02C_CANCEL_REQUESTED/);
    await assert.rejects(c.completeSafe({scope,runId:"run:prepared"}),/PA02C_WORKER_NOT_QUIESCED/);
    await expiry(admin,schema,"run:prepared");
    assert.equal((await c.completeSafe({scope,runId:"run:prepared"})).status,"CANCELLED");
    assert.equal((await b.getWrite({scope,effectId:"effect:prepared"})).state,"PREPARED");
    assert.equal(await b.claimLease({scope,runId:"run:prepared",ownerId:"late",ttlSeconds:300}),undefined);

    const unknownLease=await b.claimLease({scope,runId:"run:unknown",ownerId:"worker-2",ttlSeconds:300});
    await b.prepareWrite({scope,lease:unknownLease,effectId:"effect:unknown",inputDigest:digest("unknown")});
    await b.beginWrite({scope,lease:unknownLease,effectId:"effect:unknown"});
    await c.request(request("run:unknown"));
    await expiry(admin,schema,"run:unknown");
    await assert.rejects(c.completeSafe({scope,runId:"run:unknown"}),/PA02C_UNCONFIRMED_WRITE/);
    assert.equal((await b.markUnknown({scope,effectId:"effect:unknown"})).state,"UNKNOWN");
    await assert.rejects(c.completeSafe({scope,runId:"run:unknown"}),/PA02C_UNCONFIRMED_WRITE/);
    assert.equal((await c.get({scope,runId:"run:unknown"})).status,"REQUESTED");
    assert.equal((await b.getWrite({scope,effectId:"effect:unknown"})).state,"UNKNOWN");
    await assert.rejects(b.beginWrite({scope,lease:unknownLease,effectId:"effect:unknown"}));

    const doneLease=await b.claimLease({scope,runId:"run:known",ownerId:"worker-3",ttlSeconds:300});
    await b.prepareWrite({scope,lease:doneLease,effectId:"effect:known",inputDigest:digest("known")});
    await b.beginWrite({scope,lease:doneLease,effectId:"effect:known"});
    assert.equal((await b.completeWrite({
      scope,lease:doneLease,effectId:"effect:known",outcome:"SUCCEEDED"
    })).state,"SUCCEEDED");
    await c.request(request("run:known"));
    await expiry(admin,schema,"run:known");
    assert.equal((await c.completeSafe({scope,runId:"run:known"})).status,"CANCELLED");
    assert.equal((await b.getWrite({scope,effectId:"effect:known"})).state,"SUCCEEDED");

    const otherTenant={...scope,enterpriseId:"tenant-B"};
    assert.equal(await c.get({scope:otherTenant,runId:"run:unknown"}),undefined);
    assert.equal(await b.getWrite({scope:otherTenant,effectId:"effect:unknown"}),undefined);
    await c.close();c=undefined;
    c=await createPostgresAgentCancellationCoordinatorV020({connectionString:url,schema});
    assert.equal((await c.get({scope,runId:"run:unknown"})).status,"REQUESTED");
    assert.equal((await c.get({scope,runId:"run:prepared"})).status,"CANCELLED");
    console.log("PA02C_CANCELLATION_PROOF="+JSON.stringify({
      status:"PASS",cancelledIdle:true,lateLeaseRejected:true,
      preparedWriteNotDispatched:true,quiescenceRequired:true,
      unknownWriteCannotBeCalledCancelled:true,completedWriteNotUndone:true,
      durableAcrossDatabaseConnections:true,tenantReadIsolation:true,
      formalHostRunCancellationEnabled:false,productionUsed:false
    }));
  }finally{
    if(b)await b.close();
    if(c)await c.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}finally{await admin.end();}
  }
});
