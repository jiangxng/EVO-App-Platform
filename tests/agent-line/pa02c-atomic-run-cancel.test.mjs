import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import postgres from "postgres";
import { createPostgresAgentDurabilityProofV020 } from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import { createPostgresAgentExecutionCoordinatorV020 } from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";
import { createPostgresAtomicAgentRunCancellationV020 } from "../../dist/agents/enterprise-agent/pa02c-atomic-run-cancel.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const scope={
  principalSubjectId:"pa02c-atomic-human",principalActorType:"HUMAN",
  contextKind:"ENTERPRISE",contextId:"context:atomic-a",enterpriseId:"tenant-a"
};
const context={contractVersion:"0.1.0",kind:"ENTERPRISE",contextId:scope.contextId,enterpriseId:scope.enterpriseId};
const sha=s=>createHash("sha256").update(s).digest("hex");

test("PA02C atomic commit: lease/write/receipt gates and real Run CANCELLED event agree",{
  skip:!url?"Requires disposable PA02A_PROOF_DATABASE_URL":false,timeout:90000
},async()=>{
  const schema="agent_pa02c_atomic_"+randomUUID().replaceAll("-","").slice(0,12);
  const admin=postgres(url,{max:2});
  let a,b,c;
  async function newRun(label) {
    const runId="run:"+label,threadId="thread:"+label;
    const input={
      scope,threadId,clientTurnId:"turn:"+label,taskDigest:sha(label),
      taskPayload:{label},created:{
        contractVersion:"0.1.0",eventId:"event:"+randomUUID(),
        runId,type:"RUN_CREATED",occurredAt:"2026-10-13T00:00:00.000Z",
        payload:{
          principalSubjectId:scope.principalSubjectId,
          principalActorType:scope.principalActorType,context,
          sourceInteractionId:threadId,sourceActionId:"client-turn:"+label,
          input:{message:"sandbox "+label,conversationHistory:[],locale:"en",
            providerId:"fixture",modelId:"fixture"}
        }
      }
    };
    assert.equal((await a.claimTurn(input)).created,true);
    return runId;
  }
  const cancel=runId=>({scope,runId,requestedBy:scope.principalSubjectId,reason:"Operator requested stop"});
  const safe=runId=>({scope,runId,eventId:"cancel-event:"+randomUUID(),
    occurredAt:"2026-10-13T00:01:00.000Z"});
  const expire=runId=>admin.unsafe('UPDATE "'+schema+'".pa02b_leases '+
    "SET expires_at=clock_timestamp()-interval '3 seconds' WHERE run_id=$1",[runId]);
  try {
    a=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    b=await createPostgresAgentExecutionCoordinatorV020({connectionString:url,schema});
    c=await createPostgresAtomicAgentRunCancellationV020({connectionString:url,schema});

    const idle=await newRun("idle");
    await assert.rejects(c.commitSafe(safe(idle)),/PA02C_ATOMIC_REQUEST_REQUIRED/);
    await assert.rejects(c.request({...cancel(idle),requestedBy:"spoofed"}),/PA02C_ATOMIC_REQUESTER_SCOPE_MISMATCH/);
    assert.equal((await c.request(cancel(idle))).state,"REQUESTED");
    assert.equal((await c.request(cancel(idle))).state,"REQUESTED");
    const canceled=await c.commitSafe(safe(idle));
    assert.deepEqual([canceled.state,canceled.runState,canceled.revision],["CANCELLED","CANCELLED",1]);
    assert.equal((await c.commitSafe(safe(idle))).revision,1);
    assert.deepEqual((await a.listRunEvents({scope,runId:idle})).map(x=>x.type),
      ["RUN_CREATED","RUN_CANCELLED"]);
    assert.equal(await b.claimLease({scope,runId:idle,ownerId:"after-cancel",ttlSeconds:30}),undefined);
    await assert.rejects(a.appendRunEvent({scope,runId:idle,expectedRevision:1,event:{
      contractVersion:"0.1.0",eventId:"late:event",runId:idle,type:"RUN_SUCCEEDED",
      occurredAt:"2026-10-13T00:02:00.000Z",payload:{message:"should not be possible"}
    }}),/AGENT_RUN_TERMINAL_STATE_IMMUTABLE/);

    const leased=await newRun("leased");
    const lease=await b.claimLease({scope,runId:leased,ownerId:"worker-1",ttlSeconds:300});
    assert.ok(lease);
    assert.equal((await c.request(cancel(leased))).state,"REQUESTED");
    assert.equal(await b.renewLease({scope,lease,ttlSeconds:300}),undefined);
    assert.equal(await b.claimLease({scope,runId:leased,ownerId:"second-worker",ttlSeconds:300}),undefined);
    await assert.rejects(c.commitSafe(safe(leased)),/PA02C_WORKER_NOT_QUIESCED/);
    await expire(leased);
    assert.equal((await c.commitSafe(safe(leased))).runState,"CANCELLED");

    const uncertain=await newRun("uncertain");
    const leased2=await b.claimLease({scope,runId:uncertain,ownerId:"worker-write",ttlSeconds:300});
    await b.prepareWrite({scope,lease:leased2,effectId:"write:uncertain",inputDigest:sha("write-1")});
    await b.beginWrite({scope,lease:leased2,effectId:"write:uncertain"});
    await c.request(cancel(uncertain));
    await expire(uncertain);
    await assert.rejects(c.commitSafe(safe(uncertain)),/PA02C_UNCONFIRMED_WRITE/);
    await b.markUnknown({scope,effectId:"write:uncertain"});
    await assert.rejects(c.commitSafe(safe(uncertain)),/PA02C_UNCONFIRMED_WRITE/);
    assert.equal((await c.get({scope,runId:uncertain})).state,"REQUESTED");
    assert.deepEqual((await a.listRunEvents({scope,runId:uncertain})).map(x=>x.type),
      ["RUN_CREATED"]);

    const pending=await newRun("pending-receipt");
    await a.beginReceipt({scope,receipt:{
      receiptId:"receipt:pending",invocationId:"invocation:pending",
      idempotencyKey:"idem:pending",sourceInteractionId:pending,
      sourceActionId:"tool:write",principalSubjectId:scope.principalSubjectId,
      principalActorType:scope.principalActorType,context,toolId:"test.write",
      ownerPackageId:"test-owner",inputDigest:sha("receipt-input"),
      requestedAt:"2026-10-13T00:00:00.000Z"
    }});
    await c.request(cancel(pending));
    const pendingRows=await admin.unsafe('SELECT status,request_payload,scope_key FROM "'+schema+'".agent_receipts');
    assert.equal(pendingRows.length,1);
    assert.equal(pendingRows[0].status,"REQUESTED");
    assert.equal(pendingRows[0].request_payload.sourceInteractionId,pending);
    await assert.rejects(c.commitSafe(safe(pending)),/PA02C_UNCONFIRMED_RECEIPT/);
    await a.completeReceipt({scope,receiptId:"receipt:pending",status:"DENIED",terminal:{
      receiptId:"receipt:pending",status:"DENIED",completedAt:"2026-10-13T00:03:00.000Z",
      error:{code:"SANDBOX_DENIED",message:"No effect was allowed"}
    }});
    assert.equal((await c.commitSafe(safe(pending))).runState,"CANCELLED");

    const other={...scope,enterpriseId:"tenant-b"};
    assert.equal(await c.get({scope:other,runId:idle}),undefined);
    await assert.rejects(c.request({...cancel(idle),scope:other}),/PA02C_ATOMIC_RUN_NOT_FOUND/);
    await a.close();a=undefined;
    await b.close();b=undefined;
    await c.close();c=undefined;
    a=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    c=await createPostgresAtomicAgentRunCancellationV020({connectionString:url,schema});
    assert.equal((await c.get({scope,runId:idle})).runState,"CANCELLED");
    assert.equal((await c.get({scope,runId:uncertain})).state,"REQUESTED");
    console.log("PA02C_ATOMIC_RUN_EVENT="+JSON.stringify({
      status:"PASS",terminalAndCancelOneTransaction:true,runReducerUsed:true,
      canceledRunCannotRevive:true,lateLeasesDenied:true,
      activeLeaseCannotClaimCancellation:true,unknownWriteNeverCancelled:true,
      pendingReceiptBlocksCancel:true,crossTenantIsolation:true,
      durableAcrossConnections:true,formalHostProductionWiring:false,productionUsed:false
    }));
  }finally{
    if(a)await a.close();
    if(b)await b.close();
    if(c)await c.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await admin.end();}
  }
});
