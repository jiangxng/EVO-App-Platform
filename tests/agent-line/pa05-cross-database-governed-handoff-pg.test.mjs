import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPostgresAgentDurabilityProofV020}
  from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import {createPostgresAgentExecutionCoordinatorV020,hostAgentDurabilityScopeKeyV020}
  from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";
import {createPostgresFencedAgentRunAuthorityV030}
  from "../../dist/agents/enterprise-agent/pa02b-fenced-run-authority.js";
import {createPostgresAtomicAgentRunCancellationV020}
  from "../../dist/agents/enterprise-agent/pa02c-atomic-run-cancel.js";
import {createPostgresAgentOwnerReconciliationV030}
  from "../../dist/agents/enterprise-agent/pa02b-owner-reconciliation.js";
import {createGovernedAgentWriteHandoffV040}
  from "../../dist/agents/enterprise-agent/pa02b-governed-owner-write-handoff.js";
import {createPa05CrossDatabaseReservationAuthorityV010}
  from "../../dist/manager/pa05-cross-database-admission.js";
import {createPa05CrossDatabaseRemoteSqlAdmissionV010}
  from "../../dist/manager/pa05-cross-database-remote-sql-admission.js";
import {createPa05CrossDatabaseOwnerSettlementV010}
  from "../../dist/manager/pa05-cross-database-owner-settlement.js";

const centralUrl=process.env.PA05_XDB_AUTHORITY_DATABASE_URL;
const workerAUrl=process.env.PA05_XDB_WORKER_A_DATABASE_URL;
const workerBUrl=process.env.PA05_XDB_WORKER_B_DATABASE_URL;
const sha=x=>createHash("sha256").update(x).digest("hex");
const ownerPackageId="pa05.xdb.owner";
const scope={
  principalSubjectId:"d11-human",principalActorType:"HUMAN",
  contextKind:"ENTERPRISE",contextId:"enterprise:d11",
  enterpriseId:"pa05-d11-business"
};
const context={
  contractVersion:"0.1.0",kind:"ENTERPRISE",
  contextId:scope.contextId,enterpriseId:scope.enterpriseId
};

test("PA05-04D11 real PA-02 handoff binds central reservation before remote Owner; freezes and UNKNOWN cannot replay",{
  skip:!centralUrl||!workerAUrl||!workerBUrl?"three independent PG18 clusters required":false,
  timeout:90000
},async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const schema="pa05_d11_"+suffix,authSchema="pa05_d11_auth_"+suffix;
  const role="pa05w_"+suffix,pass="Proof_"+randomUUID().replaceAll("-","");
  const q='"'+schema+'"';
  const central=postgres(centralUrl,{max:2});
  const workerA=postgres(workerAUrl,{max:4});
  const workerB=postgres(workerBUrl,{max:2});
  let repo,coordinator,runAuthority,cancellation,reconciler,admission,centralAuthority,settlement;
  let actualOwnerCalls=0,allowOwnerVerification=false;
  const effectId=runId=>"effect:"+runId;
  const receiptId=runId=>"receipt:"+runId;
  const inputDigest=runId=>sha("PA05:D11:"+runId);
  async function claim(runId){
    await repo.claimTurn({
      scope,threadId:"thread:d11",clientTurnId:"turn:"+runId,
      taskPayload:{message:"isolated domain WRITE"},taskDigest:sha(runId),
      created:{
        contractVersion:"0.1.0",eventId:"created:"+randomUUID(),runId,
        type:"RUN_CREATED",occurredAt:"2026-10-15T02:00:00.000Z",
        payload:{
          principalSubjectId:scope.principalSubjectId,
          principalActorType:scope.principalActorType,context,
          sourceInteractionId:"thread:d11",sourceActionId:"turn:"+runId,
          input:{message:"isolated domain WRITE",conversationHistory:[],
            locale:"en",providerId:"sandbox",modelId:"fixture"}
        }
      }
    });
    const lease=await coordinator.claimLease({scope,runId,ownerId:"host-worker:"+runId,ttlSeconds:300});
    assert.ok(lease);
    return lease;
  }
  function receipt(runId){
    return {
      receiptId:receiptId(runId),invocationId:"invocation:"+runId,
      idempotencyKey:"idempotency:"+runId,sourceInteractionId:runId,
      sourceActionId:"tool:"+runId,principalSubjectId:scope.principalSubjectId,
      principalActorType:scope.principalActorType,context,
      toolId:"d11.sandbox.write",ownerPackageId,
      inputDigest:inputDigest(runId),requestedAt:"2026-10-15T02:01:00.000Z"
    };
  }
  const verifier={
    async verify(r){
      assert.equal(r.ownerPackageId,ownerPackageId);
      if(!allowOwnerVerification)return {outcome:"UNRESOLVED"};
      const rows=await workerA.unsafe("SELECT effect_id FROM "+q+
        ".d11_business_effects WHERE effect_id=$1 AND run_id=$2 AND input_digest=$3",
        [r.effectId,r.runId,r.inputDigest]);
      if(rows.length!==1)return {outcome:"UNRESOLVED"};
      return {outcome:"SUCCEEDED",evidenceRef:"sandbox:verified:"+r.effectId,
        evidenceDigest:sha(r.effectId+r.inputDigest),
        terminal:{
          receiptId:r.receiptId,status:"SUCCEEDED",
          completedAt:"2026-10-15T02:03:00.000Z",
          resultDigest:sha(r.effectId),
          resultEntityRefs:["sandbox:business:"+r.effectId],
          resultSummary:"Independently read durable business Owner row"
        }};
    }
  };
  const domainOwner={ownerPackageId,async invoke(r){
    actualOwnerCalls++;
    assert.equal((await centralAuthority.getState(ownerPackageId)).pendingCount,1);
    const ticket=await workerA.unsafe("SELECT reservation_id FROM "+q+
      ".pa05_xdb_remote_tickets WHERE effect_id=$1",[r.effectId]);
    assert.equal(ticket.length,1,"real PA-02 must stage ticket before Owner.invoke");
    assert.equal((await coordinator.getWrite({scope:r.scope,effectId:r.effectId})).state,"INVOKING");
    await workerA.unsafe("INSERT INTO "+q+
      ".d11_business_effects(effect_id,run_id,input_digest) VALUES($1,$2,$3) "+
      "ON CONFLICT(effect_id) DO NOTHING",
      [r.effectId,r.runId,r.inputDigest]);
    throw Error("PA05_TEST_REPLY_LOST_AFTER_BUSINESS_COMMIT");
  }};
  try{
    const physical=await Promise.all([central,workerA,workerB].map(async db=>{
      const x=await db.unsafe("SELECT system_identifier::text AS sid FROM pg_control_system()");
      return x[0].sid;
    }));
    assert.equal(new Set(physical).size,3);
    repo=await createPostgresAgentDurabilityProofV020({connectionString:workerAUrl,schema});
    coordinator=await createPostgresAgentExecutionCoordinatorV020({
      connectionString:workerAUrl,schema
    });
    runAuthority=await createPostgresFencedAgentRunAuthorityV030({
      connectionString:workerAUrl,schema
    });
    cancellation=await createPostgresAtomicAgentRunCancellationV020({
      connectionString:workerAUrl,schema
    });
    reconciler=await createPostgresAgentOwnerReconciliationV030({
      connectionString:workerAUrl,schema,ownerVerifier:verifier
    });
    await workerA.unsafe("CREATE TABLE "+q+
      ".d11_business_effects(effect_id text PRIMARY KEY,run_id text NOT NULL,input_digest text NOT NULL)");
    await workerA.unsafe('CREATE ROLE "'+role+'" LOGIN PASSWORD \''+pass+'\'');
    await workerA.unsafe('GRANT USAGE ON SCHEMA '+q+' TO "'+role+'"');
    await workerA.unsafe('GRANT SELECT,UPDATE ON '+q+'.pa02b_writes TO "'+role+'"');
    centralAuthority=await createPa05CrossDatabaseReservationAuthorityV010({
      authorityConnectionString:centralUrl,authoritySchema:authSchema,
      trustedWorkers:[
        {workerId:"d11-worker-a",databaseId:"remote-a",ownerPackageId},
        {workerId:"d11-worker-b",databaseId:"remote-b",ownerPackageId}
      ]
    });
    await centralAuthority.registerFrozenOwner(ownerPackageId,"1.0.0");
    await centralAuthority.reopenOwner({packageId:ownerPackageId,version:"1.0.0",
      trustedOwnerReady:()=>true});
    admission=await createPa05CrossDatabaseRemoteSqlAdmissionV010({
      connectionString:workerAUrl,workerSchema:schema,
      workerId:"d11-worker-a",ownerPackageId,ownerVersion:"1.0.0",
      workerLoginRole:role,authority:centralAuthority
    });
    assert.equal(admission.ownerPackageId,ownerPackageId);
    assert.throws(()=>createGovernedAgentWriteHandoffV040({
      coordinator,authority:runAuthority,receipts:repo,reconciler,
      owner:domainOwner,
      remoteAdmission:{ownerPackageId:"forged.owner",
        stagePreparedEffect:admission.stagePreparedEffect}
    }),/PA05_XDB_HANDOFF_TRUSTED_OWNER_MISMATCH/);
    const write=createGovernedAgentWriteHandoffV040({
      coordinator,authority:runAuthority,receipts:repo,reconciler,
      owner:domainOwner,remoteAdmission:admission
    });
    const unavailable=createGovernedAgentWriteHandoffV040({
      coordinator,authority:runAuthority,receipts:repo,reconciler,
      owner:domainOwner,remoteAdmission:{
        ownerPackageId,
        async stagePreparedEffect(){throw Error("PA05_TEST_CENTRAL_AUTHORITY_UNREACHABLE");}
      }
    });
    const first="d11_first_"+suffix, lease=await claim(first);
    // Central outage after durable PREPARED/Receipt/Owner link must NOT
    // advance INVOKING or call business Owner; original IDs stay reusable.
    await assert.rejects(unavailable.dispatch({
      scope,lease,effectId:effectId(first),receipt:receipt(first)
    }),/PA05_TEST_CENTRAL_AUTHORITY_UNREACHABLE/);
    assert.equal(actualOwnerCalls,0);
    assert.equal((await coordinator.getWrite({scope,effectId:effectId(first)})).state,"PREPARED");
    assert.equal((await centralAuthority.getState(ownerPackageId)).pendingCount,0);
    // Normal path: durable central reservation -> remote ticket -> real PA-02
    // beginWrite -> real business Owner commit -> ACK loss -> UNKNOWN.
    const pending=await write.dispatch({
      scope,lease,effectId:effectId(first),receipt:receipt(first)
    });
    assert.equal(pending.status,"UNKNOWN");
    assert.equal(pending.reconciled,false);
    assert.equal(actualOwnerCalls,1);
    assert.equal((await centralAuthority.getState(ownerPackageId)).pendingCount,1);
    assert.equal((await coordinator.getWrite({scope,effectId:effectId(first)})).state,"UNKNOWN");
    assert.equal((await workerA.unsafe("SELECT count(*)::int AS n FROM "+q+
      ".d11_business_effects"))[0].n,1);
    // A trusted freeze blocks new D11 admission, even though the local
    // Worker schema is a physically separate PostgreSQL database.
    assert.deepEqual(await centralAuthority.freeze(ownerPackageId),{
      state:"FROZEN",pendingCount:1
    });
    const afterFreeze="d11_afterfreeze_"+suffix;
    const nextLease=await claim(afterFreeze);
    await assert.rejects(write.dispatch({
      scope,lease:nextLease,effectId:effectId(afterFreeze),receipt:receipt(afterFreeze)
    }),/PA05_XDB_ADMISSION_FROZEN/);
    assert.equal(actualOwnerCalls,1);
    assert.equal((await coordinator.getWrite({scope,effectId:effectId(afterFreeze)})).state,"PREPARED");
    // Only the independent Owner verifier can attest an already committed
    // real row. No second Owner.invoke and no automatic central clearing.
    allowOwnerVerification=true;
    const verified=await write.recover({scope,effectId:effectId(first)});
    assert.equal(verified.status,"SUCCEEDED");
    assert.equal(verified.reconciled,true);
    assert.equal(actualOwnerCalls,1);
    assert.equal((await repo.getReceipt({scope,receiptId:receiptId(first)})).status,"SUCCEEDED");
    assert.equal((await centralAuthority.getState(ownerPackageId)).pendingCount,1);
    await assert.rejects(centralAuthority.reopenOwner({
      packageId:ownerPackageId,version:"1.0.0",trustedOwnerReady:()=>true
    }),/PA05_XDB_PENDING_RESERVATIONS/);
    // D12: no central settlement before a second independent, actual
    // business-Owner verification. Never clear PENDING by worker claim or TTL.
    settlement=await createPa05CrossDatabaseOwnerSettlementV010({
      remoteConnectionString:workerAUrl,workerSchema:schema,
      workerId:"d11-worker-a",ownerPackageId,ownerVersion:"1.0.0",
      centralAuthority,ownerVerifier:verifier
    });
    await assert.rejects(settlement.settle({
      scope,effectId:effectId(afterFreeze)
    }),/PA05_XDB_SETTLEMENT_REMOTE_LINK_REQUIRED/);
    // A reply outage after remote terminal is persisted must NOT unblock Host.
    allowOwnerVerification=false;
    await assert.rejects(settlement.settle({
      scope,effectId:effectId(first)
    }),/PA05_XDB_SETTLEMENT_INDEPENDENT_OWNER_MISMATCH/);
    assert.equal((await centralAuthority.getState(ownerPackageId)).pendingCount,1);
    await assert.rejects(centralAuthority.reopenOwner({
      packageId:ownerPackageId,version:"1.0.0",trustedOwnerReady:()=>true
    }),/PA05_XDB_PENDING_RESERVATIONS/);
    // A fabricated and contradictory independent verifier cannot settle.
    const fake=await createPa05CrossDatabaseOwnerSettlementV010({
      remoteConnectionString:workerAUrl,workerSchema:schema,
      workerId:"d11-worker-a",ownerPackageId,ownerVersion:"1.0.0",
      centralAuthority,ownerVerifier:{
        async verify(){return {outcome:"SUCCEEDED",evidenceRef:"forged:evidence",
          evidenceDigest:sha("forged"),terminal:{
            receiptId:receiptId(first),status:"SUCCEEDED",
            completedAt:"2026-10-15T02:03:00.000Z",
            resultDigest:sha(effectId(first)),resultEntityRefs:[],
            resultSummary:"fake"
          }};}
      }
    });
    try{
      await assert.rejects(fake.settle({
        scope,effectId:effectId(first)
      }),/PA05_XDB_SETTLEMENT_INDEPENDENT_OWNER_MISMATCH/);
    }finally{await fake.close();}
    const disconnected=await createPa05CrossDatabaseOwnerSettlementV010({
      remoteConnectionString:workerAUrl,workerSchema:schema,
      workerId:"d11-worker-a",ownerPackageId,ownerVersion:"1.0.0",
      centralAuthority:{async settleVerified(){throw Error("PA05_TEST_CENTRAL_UNAVAILABLE");}},
      ownerVerifier:verifier
    });
    try{
      await assert.rejects(disconnected.settle({
        scope,effectId:effectId(first)
      }),/PA05_TEST_CENTRAL_UNAVAILABLE/);
    }finally{await disconnected.close();}
    assert.equal((await centralAuthority.getState(ownerPackageId)).pendingCount,1);
    // Correct genuine Owner evidence may settle precisely ONE reservation.
    allowOwnerVerification=true;
    assert.deepEqual(await settlement.settle({
      scope,effectId:effectId(first)
    }),{state:"SETTLED",pendingCount:0});
    assert.deepEqual(await settlement.settle({
      scope,effectId:effectId(first)
    }),{state:"ALREADY_SETTLED",pendingCount:0});
    assert.equal(actualOwnerCalls,1,"settlement MUST NOT replay actual Owner effect");
    const audits=await central.unsafe('SELECT state,terminal_outcome,'+
      'terminal_receipt_id,terminal_evidence_digest FROM "'+authSchema+
      '".pa05_xdb_reservations');
    assert.equal(audits.length,1,"never delete centrally settled provenance");
    assert.deepEqual({
      state:audits[0].state,outcome:audits[0].terminal_outcome,
      receiptId:audits[0].terminal_receipt_id
    },{state:"SETTLED",outcome:"SUCCEEDED",receiptId:receiptId(first)});
    assert.match(audits[0].terminal_evidence_digest,/^[a-f0-9]{64}$/);
    // Explicit recertification may reopen ONLY now, with zero pending.
    await centralAuthority.reopenOwner({packageId:ownerPackageId,
      version:"1.0.0",trustedOwnerReady:()=>true});
    const stored=await workerA.unsafe('SELECT reservation_id,effect_digest FROM "'+
      schema+'".pa05_xdb_remote_tickets WHERE effect_id=$1',[effectId(first)]);
    await assert.rejects(centralAuthority.reserve({
      packageId:ownerPackageId,version:"1.0.0",workerId:"d11-worker-a",
      reservationId:stored[0].reservation_id,effectDigest:stored[0].effect_digest
    }),/PA05_XDB_SETTLED_RESERVATION_CANNOT_REOPEN/);
    await assert.rejects(settlement.settle({
      scope,effectId:effectId(first)
    }),/PA05_XDB_SETTLEMENT_REQUIRES_FROZEN_OWNER/);
    console.log("PA05_XDB_OWNER_VERIFIED_SETTLEMENT_PG="+JSON.stringify({
      physicalClusters:3,actualPa02TerminalReceipt:true,
      ownerVerifierRechecked:true,requiresCentralOwnerFrozen:true,
      falseOwnerClaimRejected:true,ownerUnavailableKeepsPending:true,
      centralUnavailableKeepsPending:true,immutableSettlementAudit:true,
      duplicateSettlementIdempotent:true,settledReservationCannotReplay:true,
      explicitReopenOnlyAfterZeroPending:true,ownerInvokeCount:actualOwnerCalls,
      productionWriteEnabled:false,authenticatedProductionHostCertified:false,
      externalOwnerProviderCertified:false,partitionConsensusCertified:false
    }));
    console.log("PA05_XDB_GOVERNED_HANDOFF_PG="+JSON.stringify({
      physicalClusters:3,actualPa02Handoff:true,
      durableRunReceiptOwnerBindBeforeAdmission:true,
      centralOutageStopsOwnerInvoke:true,
      reservationBeforeActualBusinessOwner:true,
      ownerAckLostQuarantinesUnknown:true,
      freezeBlocksNextDispatch:true,
      independentOwnerVerificationNoReplay:true,
      centralPendingNotAutoCleared:true,
      productionWriteEnabled:false,
      allHostRoutesEnabled:false,
      distributedPartitionCertified:false
    }));
  }finally{
    for(const x of [settlement,admission,reconciler,cancellation,runAuthority,coordinator,repo,centralAuthority]){
      if(x&&typeof x.close==="function")try{await x.close();}catch{}
    }
    try{await workerA.unsafe("DROP SCHEMA IF EXISTS "+q+" CASCADE");}catch{}
    try{await workerA.unsafe('DROP OWNED BY "'+role+'"');}catch{}
    try{await workerA.unsafe('DROP ROLE IF EXISTS "'+role+'"');}catch{}
    try{await central.unsafe('DROP SCHEMA IF EXISTS "'+authSchema+'" CASCADE');}catch{}
    await Promise.allSettled([central.end(),workerA.end(),workerB.end()]);
  }
});
