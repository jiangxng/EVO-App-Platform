import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPostgresAgentDurabilityProofV020}
  from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import {createPostgresAgentExecutionCoordinatorV020}
  from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";
import {createPostgresAtomicAgentRunCancellationV020}
  from "../../dist/agents/enterprise-agent/pa02c-atomic-run-cancel.js";
import {createPostgresFencedAgentRunAuthorityV030}
  from "../../dist/agents/enterprise-agent/pa02b-fenced-run-authority.js";
import {createPostgresAgentOwnerReconciliationV030}
  from "../../dist/agents/enterprise-agent/pa02b-owner-reconciliation.js";
import {createGovernedAgentWriteHandoffV040}
  from "../../dist/agents/enterprise-agent/pa02b-governed-owner-write-handoff.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const sha=x=>createHash("sha256").update(x).digest("hex");
const scope={principalSubjectId:"owner-handoff-human",principalActorType:"HUMAN",
  contextKind:"ENTERPRISE",contextId:"context:write-handoff",
  enterpriseId:"sandbox-enterprise"};
const context={contractVersion:"0.1.0",kind:"ENTERPRISE",
  contextId:scope.contextId,enterpriseId:scope.enterpriseId};
const ownerPackageId="sandbox.owner";

test("PA02B actual sandbox WRITE -> lost reply -> Owner verifies once, not replayed",{
  skip:!url?"Requires isolated PostgreSQL":false,timeout:90000
},async()=>{
  const schema="pa02_owner_handoff_"+randomUUID().replaceAll("-","").slice(0,12);
  const admin=postgres(url,{max:3});
  let repo,coordinator,authority,cancel,owner,ownerAfterRestart;
  const invokeCount=new Map();
  const effectRows=async()=>admin.unsafe('SELECT * FROM "'+schema+'".owner_business_effects');
  const runIds=["run:handoff-1","run:handoff-2","run:handoff-3"];
  const effect=runId=>"effect:"+runId;
  const receiptId=runId=>"receipt:"+runId;
  const payloadHash=runId=>sha("business-request:"+runId);
  const claim=async runId=>{
    await repo.claimTurn({scope,threadId:"thread:handoff",
      clientTurnId:"turn:"+runId,taskPayload:{message:"sandbox write"},
      taskDigest:sha(runId),created:{
        contractVersion:"0.1.0",eventId:"create:"+randomUUID(),runId,
        type:"RUN_CREATED",occurredAt:"2026-10-14T00:00:00.000Z",
        payload:{principalSubjectId:scope.principalSubjectId,
          principalActorType:scope.principalActorType,context,
          sourceInteractionId:"thread:handoff",sourceActionId:"turn:"+runId,
          input:{message:"sandbox write",conversationHistory:[],
            locale:"en",providerId:"sandbox",modelId:"fixture"}}
      }
    });
    const lease=await coordinator.claimLease({scope,runId,
      ownerId:"worker:"+runId,ttlSeconds:300});
    assert.ok(lease);
    return lease;
  };
  const receipt=runId=>({
    receiptId:receiptId(runId),invocationId:"invocation:"+runId,
    idempotencyKey:"idem:"+runId,sourceInteractionId:runId,
    sourceActionId:"tool:write:"+runId,
    principalSubjectId:scope.principalSubjectId,
    principalActorType:scope.principalActorType,context,
    toolId:"sandbox.owner.update",ownerPackageId,
    inputDigest:payloadHash(runId),requestedAt:"2026-10-14T00:01:00.000Z"
  });
  const verifier={async verify(input){
    assert.equal(input.ownerPackageId,ownerPackageId);
    const rows=await admin.unsafe('SELECT * FROM "'+schema+'".owner_business_effects '+
      "WHERE effect_id=$1 AND run_id=$2 AND owner_package_id=$3 AND input_digest=$4",
      [input.effectId,input.runId,input.ownerPackageId,input.inputDigest]);
    if(!rows.length)return {outcome:"UNRESOLVED"};
    return {outcome:"SUCCEEDED",evidenceRef:"sandbox:effect:"+input.effectId,
      evidenceDigest:sha(JSON.stringify([input.runId,input.effectId,input.inputDigest])),
      terminal:{receiptId:input.receiptId,status:"SUCCEEDED",
        completedAt:"2026-10-14T00:02:00.000Z",
        resultDigest:sha(input.effectId),resultEntityRefs:["sandbox:object:"+input.effectId],
        resultSummary:"Owner verified an already committed sandbox effect"}};
  }};
  let writeMode="COMMIT_THEN_LOSE_REPLY";
  const businessOwner={ownerPackageId,async invoke(request){
    invokeCount.set(request.effectId,(invokeCount.get(request.effectId)??0)+1);
    if(writeMode==="NO_COMMIT_LOST_REPLY")throw Error("SANDBOX_TRANSPORT_LOST");
    await admin.unsafe('INSERT INTO "'+schema+'".owner_business_effects '+
      "(effect_id,run_id,owner_package_id,input_digest) VALUES($1,$2,$3,$4) "+
      "ON CONFLICT(effect_id) DO NOTHING",
      [request.effectId,request.runId,ownerPackageId,request.inputDigest]);
    // Intentional loss of response AFTER actual business-state commit.
    throw Error("SANDBOX_REPLY_LOST_AFTER_OWNER_COMMIT");
  }};
  try{
    repo=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    coordinator=await createPostgresAgentExecutionCoordinatorV020({connectionString:url,schema});
    authority=await createPostgresFencedAgentRunAuthorityV030({connectionString:url,schema});
    cancel=await createPostgresAtomicAgentRunCancellationV020({connectionString:url,schema});
    owner=await createPostgresAgentOwnerReconciliationV030({
      connectionString:url,schema,ownerVerifier:verifier
    });
    await admin.unsafe('CREATE TABLE "'+schema+'".owner_business_effects('+
      "effect_id text PRIMARY KEY,run_id text NOT NULL,owner_package_id text NOT NULL,"+
      "input_digest text NOT NULL)");
    const createGate=reconciler=>createGovernedAgentWriteHandoffV040({
      coordinator,authority,receipts:repo,reconciler,owner:businessOwner
    });
    const gate=createGate(owner);
    const lease=await claim(runIds[0]);
    await assert.rejects(gate.dispatch({scope,lease,effectId:effect(runIds[0]),
      receipt:{...receipt(runIds[0]),ownerPackageId:"forged.package"}}),
      /PA02B_HANDOFF_SOURCE_MISMATCH/);
    assert.equal(invokeCount.size,0);

    const first=await gate.dispatch({scope,lease,effectId:effect(runIds[0]),
      receipt:receipt(runIds[0])});
    assert.equal(first.status,"SUCCEEDED");
    assert.equal(first.reconciled,true);
    assert.equal((await effectRows()).length,1);
    assert.equal(invokeCount.get(effect(runIds[0])),1);
    assert.equal((await repo.getReceipt({scope,receiptId:receiptId(runIds[0])})).status,"SUCCEEDED");
    assert.equal((await coordinator.getWrite({scope,effectId:effect(runIds[0])})).state,"SUCCEEDED");
    await assert.rejects(gate.dispatch({scope,lease,effectId:effect(runIds[0]),
      receipt:receipt(runIds[0])}),/PA02B_LEASE_FENCED|PA02B_OWNER_WRITE_NOT_PREPARED/);
    assert.equal(invokeCount.get(effect(runIds[0])),1,"retried Agent must not reinvoke Owner");

    writeMode="NO_COMMIT_LOST_REPLY";
    const lease2=await claim(runIds[1]);
    const unresolved=await gate.dispatch({scope,lease:lease2,
      effectId:effect(runIds[1]),receipt:receipt(runIds[1])});
    assert.equal(unresolved.status,"UNKNOWN");
    assert.equal((await repo.getReceipt({scope,receiptId:receiptId(runIds[1])})).status,"REQUESTED");
    assert.equal((await effectRows()).length,1);
    await cancel.request({scope,runId:runIds[1],
      requestedBy:scope.principalSubjectId,reason:"uncertain effect"});
    await assert.rejects(cancel.commitSafe({scope,runId:runIds[1],
      eventId:"cancel:"+randomUUID(),occurredAt:"2026-10-14T00:04:00.000Z"}),
      /PA02C_UNCONFIRMED_WRITE/);
    // Reconciliation after process-style reconnect still does not dispatch.
    await owner.close();owner=undefined;
    ownerAfterRestart=await createPostgresAgentOwnerReconciliationV030({
      connectionString:url,schema,ownerVerifier:verifier
    });
    const restarted=createGate(ownerAfterRestart);
    const recovered=await restarted.recover({scope,effectId:effect(runIds[1])});
    assert.equal(recovered.status,"UNKNOWN");
    assert.equal(invokeCount.get(effect(runIds[1])),1);
    await assert.rejects(restarted.dispatch({scope,lease:lease2,
      effectId:effect(runIds[1]),receipt:receipt(runIds[1])}),
      /PA02C_CANCEL_REQUESTED|PA02B_LEASE_FENCED|PA02B_OWNER_WRITE_NOT_PREPARED/);
    assert.equal(invokeCount.get(effect(runIds[1])),1);

    // Abrupt death after INVOKING is handled by recover(), never invoke().
    const lease3=await claim(runIds[2]);
    await coordinator.prepareWrite({scope,lease:lease3,
      effectId:effect(runIds[2]),inputDigest:payloadHash(runIds[2])});
    await repo.beginReceipt({scope,receipt:receipt(runIds[2])});
    await ownerAfterRestart.bind({scope,lease:lease3,effectId:effect(runIds[2]),
      receiptId:receiptId(runIds[2]),ownerPackageId});
    await coordinator.beginWrite({scope,lease:lease3,effectId:effect(runIds[2])});
    assert.equal((await restarted.recover({scope,effectId:effect(runIds[2])})).status,"UNKNOWN");
    assert.equal(invokeCount.get(effect(runIds[2])),undefined);
    assert.equal((await effectRows()).length,1);

    const wrongTenant={...scope,enterpriseId:"other-enterprise"};
    await assert.rejects(restarted.recover({scope:wrongTenant,
      effectId:effect(runIds[0])}),/PA02B_WRITE_NOT_INVOKING/);
    console.log("PA02B_REAL_SANDBOX_OWNER_WRITE="+JSON.stringify({
      status:"PASS",businessEffectActuallyCommitted:true,transportReplyLost:true,
      hostPersistedIntentAndReceipt:true,ownerVerifiedAfterAmbiguity:true,
      missingOwnerEffectStaysUnknown:true,noWriteReplay:true,
      postInvokeCrashRecoverDoesNotInvoke:true,verifiedReceiptAtomic:true,
      cancelBlockedWhileUnknown:true,scopeIsolation:true,
      actualProductionOwnerEnabled:false,formalHostWiring:false
    }));
  }finally{
    for(const x of [ownerAfterRestart,owner,cancel,authority,coordinator,repo])if(x)await x.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await admin.end();}
  }
});
