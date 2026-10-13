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
import {createPostgresAgentOwnerReconciliationV030}
  from "../../dist/agents/enterprise-agent/pa02b-owner-reconciliation.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const scope={principalSubjectId:"owner-test-human",principalActorType:"HUMAN",
  contextKind:"ENTERPRISE",contextId:"context:owner-proof",enterpriseId:"tenant-proof"};
const context={contractVersion:"0.1.0",kind:"ENTERPRISE",
  contextId:scope.contextId,enterpriseId:scope.enterpriseId};
const sha=s=>createHash("sha256").update(s).digest("hex");

test("PA02B Owner: UNKNOWN recovers only from registered owner without replaying effect",{
  skip:!url?"Requires disposable PA02A_PROOF_DATABASE_URL":false,timeout:90000
},async()=>{
  const schema="agent_pa02b_owner_"+randomUUID().replaceAll("-","").slice(0,12);
  const admin=postgres(url,{max:2});
  let repo,b,c,owner,reconnected;
  let mode="UNRESOLVED",verifierCalls=0;
  const runId="run:owner-reconcile",effectId="effect:owner-1",receiptId="receipt:owner-1";
  const terminal={
    receiptId,status:"SUCCEEDED",completedAt:"2026-10-13T00:12:00.000Z",
    resultDigest:sha("sandbox-owner-object-1"),
    resultEntityRefs:["sandbox:entity:verified"],
    resultSummary:"Owner looked up the existing sandbox operation"
  };
  const ownerVerifier={
    async verify(input){
      verifierCalls++;
      assert.deepEqual(input.scope,scope);
      assert.deepEqual([input.runId,input.effectId,input.receiptId,input.ownerPackageId],
        [runId,effectId,receiptId,"sandbox.owner"]);
      if(mode==="UNRESOLVED")return {outcome:"UNRESOLVED"};
      if(mode==="FORGED")return {outcome:"SUCCEEDED",evidenceRef:"sandbox:evidence:1",
        evidenceDigest:sha("evidence-1"),terminal:{...terminal,receiptId:"forged"}};
      return {outcome:"SUCCEEDED",evidenceRef:"sandbox:evidence:1",
        evidenceDigest:sha("evidence-1"),terminal};
    }
  };
  try{
    repo=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    b=await createPostgresAgentExecutionCoordinatorV020({connectionString:url,schema});
    c=await createPostgresAtomicAgentRunCancellationV020({connectionString:url,schema});
    owner=await createPostgresAgentOwnerReconciliationV030({
      connectionString:url,schema,ownerVerifier
    });
    await repo.claimTurn({scope,threadId:"thread:owner",clientTurnId:"turn:owner",
      taskDigest:sha("test-turn"),taskPayload:{message:"sandbox owner lookup"},
      created:{contractVersion:"0.1.0",eventId:"run-created:"+randomUUID(),runId,
        type:"RUN_CREATED",occurredAt:"2026-10-13T00:00:00.000Z",
        payload:{principalSubjectId:scope.principalSubjectId,
          principalActorType:scope.principalActorType,context,
          sourceInteractionId:"thread:owner",sourceActionId:"turn:owner",
          input:{message:"reconcile owner",conversationHistory:[],locale:"en",
            providerId:"test",modelId:"test-model"}
        }}
    });
    const lease=await b.claimLease({scope,runId,ownerId:"worker:a",ttlSeconds:300});
    assert.ok(lease);
    const inputDigest=sha("stable-sandbox-write");
    await b.prepareWrite({scope,lease,effectId,inputDigest});
    await repo.beginReceipt({scope,receipt:{
      receiptId,invocationId:"invocation:owner-1",idempotencyKey:"idem:owner-1",
      sourceInteractionId:runId,sourceActionId:"tool:owner-write",
      principalSubjectId:scope.principalSubjectId,
      principalActorType:scope.principalActorType,context,
      toolId:"sandbox.owner.write",ownerPackageId:"sandbox.owner",
      inputDigest,requestedAt:"2026-10-13T00:01:00.000Z"
    }});
    await assert.rejects(owner.bind({
      scope,lease,effectId,receiptId,ownerPackageId:"forged.owner"
    }),/PA02B_OWNER_SOURCE_MISMATCH/);
    const bound=await owner.bind({scope,lease,effectId,receiptId,
      ownerPackageId:"sandbox.owner"});
    assert.deepEqual(bound,{created:true,receiptId});
    assert.deepEqual(await owner.bind({
      scope,lease,effectId,receiptId,ownerPackageId:"sandbox.owner"
    }),{created:false,receiptId});
    await b.beginWrite({scope,lease,effectId});
    await b.markUnknown({scope,effectId});
    await admin.unsafe('UPDATE "'+schema+'".pa02b_leases SET '+
      "expires_at=clock_timestamp()-interval '5 seconds' WHERE run_id=$1",[runId]);

    await c.request({scope,runId,requestedBy:scope.principalSubjectId,
      reason:"Stop after uncertain business response"});
    await assert.rejects(c.commitSafe({
      scope,runId,eventId:"cancel:"+randomUUID(),
      occurredAt:"2026-10-13T00:03:00.000Z"
    }),/PA02C_UNCONFIRMED_WRITE/);
    assert.equal((await owner.reconcile({scope,effectId})).status,"UNKNOWN");
    assert.equal((await repo.getReceipt({scope,receiptId})).status,"REQUESTED");
    mode="FORGED";
    await assert.rejects(owner.reconcile({scope,effectId}),
      /PA02B_OWNER_ATTESTATION_INVALID/);
    assert.equal((await b.getWrite({scope,effectId})).state,"UNKNOWN");
    mode="SUCCEEDED";
    const first=await owner.reconcile({scope,effectId});
    assert.deepEqual([first.status,first.reconciled,first.evidenceRef],
      ["SUCCEEDED",true,"sandbox:evidence:1"]);
    const receipt=await repo.getReceipt({scope,receiptId});
    assert.equal(receipt.status,"SUCCEEDED");
    assert.deepEqual(receipt.terminal,terminal);
    assert.equal((await b.getWrite({scope,effectId})).state,"SUCCEEDED");
    const before=verifierCalls;
    const replay=await owner.reconcile({scope,effectId});
    assert.equal(replay.status,"SUCCEEDED");
    assert.equal(verifierCalls,before);
    assert.equal((await c.commitSafe({
      scope,runId,eventId:"cancel:"+randomUUID(),
      occurredAt:"2026-10-13T00:04:00.000Z"
    })).runState,"CANCELLED");

    const other={...scope,enterpriseId:"other-tenant"};
    assert.equal(await owner.get({scope:other,effectId}),undefined);
    await assert.rejects(owner.reconcile({scope:other,effectId}),
      /PA02B_OWNER_LINK_NOT_FOUND/);
    await owner.close();owner=undefined;
    reconnected=await createPostgresAgentOwnerReconciliationV030({
      connectionString:url,schema,ownerVerifier
    });
    assert.equal((await reconnected.get({scope,effectId})).status,"SUCCEEDED");
    assert.equal((await repo.getReceipt({scope,receiptId})).status,"SUCCEEDED");
    console.log("PA02B_OWNER_RECONCILIATION="+JSON.stringify({
      status:"PASS",ownerBoundBeforeWrite:true,changedOwnerDenied:true,
      missingOwnerAnswerRemainsUnknown:true,forgedAttestationDenied:true,
      ownerVerifiedTerminal:true,receiptAndWriteCommittedTogether:true,
      noWriteReplayed:true,cancellationOnlyAfterVerifiedOutcome:true,
      duplicateReconciliationIdempotent:true,tenantIsolation:true,
      reconnectPreservesEvidence:true,actualBusinessExecuted:false,
      formalHostOwnerWired:false,productionUsed:false
    }));
  }finally{
    for(const s of [reconnected,owner,c,b,repo])if(s)await s.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await admin.end();}
  }
});
