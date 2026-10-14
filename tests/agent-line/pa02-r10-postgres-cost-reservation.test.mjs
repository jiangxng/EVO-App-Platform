import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPa02IsolatedPostgresCostLedgerV010} from
  "../../dist/agents/enterprise-agent/pa02-r10-postgres-cost-reservation.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const scope={principalSubjectId:"pa02-r10-cost-human",principalActorType:"HUMAN",
  contextKind:"PERSONAL",contextId:"personal:pa02-r10-cost-human"};
const synthetic={
  contractVersion:"0.1.0",approvalId:"ISOLATED_SYNTHETIC_TEST_ONLY",
  pricingVersion:"test-fixture-no-vendor-bill",currency:"USD",
  providerId:"fixture-only",modelId:"fixture-model-not-real",
  runLimitMicros:170,maxBillableInputTokens:100,
  maxBillableOutputTokens:20,worstInputMicrosPerMillion:1_000_000,
  worstOutputMicrosPerMillion:2_000_000
};
test("PA02 R10: real PG18 reservation must happen before any provider, blocks exhaustion, preserves actual conservative charge across restart",{
  skip:!url?"Requires disposable PostgreSQL18":false,timeout:90000
},async()=>{
  const schema="pa02_cost_"+randomUUID().replaceAll("-","").slice(0,12);
  const admin=postgres(url,{max:2});
  let ledger,restarted;
  try{
    ledger=await createPa02IsolatedPostgresCostLedgerV010({connectionString:url,schema});
    const runId="pa02-cost:synthetic:main";
    const first=await ledger.reserve({scope,runId,sliceId:"slice:1",policy:synthetic});
    assert.equal(first.status,"RESERVED");
    assert.equal(first.worstMicros,"140");
    assert.equal(first.remainingMicros,"30");
    const duplicate=await ledger.reserve({scope,runId,sliceId:"slice:1",policy:synthetic});
    assert.equal(duplicate.status,"ALREADY_HELD",
      "A restart cannot authorize the same possibly billable model request twice");
    const secondWhileHeld=await ledger.reserve({
      scope,runId,sliceId:"slice:2",policy:synthetic});
    assert.equal(secondWhileHeld.status,"UNKNOWN_HELD",
      "Unresolved in-flight request is not free capacity");
    await ledger.close();ledger=undefined;
    restarted=await createPa02IsolatedPostgresCostLedgerV010({
      connectionString:url,schema});
    assert.equal((await restarted.reserve({
      scope,runId,sliceId:"slice:1",policy:synthetic})).status,"ALREADY_HELD");
    assert.equal((await restarted.reserve({
      scope,runId,sliceId:"slice:2",policy:synthetic})).status,"UNKNOWN_HELD");
    const settled=await restarted.settle({scope,runId,sliceId:"slice:1",
      policy:synthetic,usage:{inputTokens:25,outputTokens:5}});
    assert.equal(settled.status,"SETTLED");
    assert.equal(settled.chargedMicros,"35");
    assert.equal((await restarted.settle({
      scope,runId,sliceId:"slice:1",policy:synthetic,
      usage:{inputTokens:25,outputTokens:5}
    })).status,"SETTLED","same settlement may be rechecked without rebilling");
    await assert.rejects(restarted.settle({
      scope,runId,sliceId:"slice:1",policy:synthetic,
      usage:{inputTokens:30,outputTokens:5}
    }),/PA02_R10_COST_SETTLEMENT_CONFLICT/);
    const blocked=await restarted.reserve({scope,runId,sliceId:"slice:2",policy:synthetic});
    assert.equal(blocked.status,"EXHAUSTED");
    assert.equal(blocked.remainingMicros,"135");
    const snapshot=await restarted.snapshot({scope,runId});
    assert.equal(snapshot.capMicros,"170");
    assert.equal(snapshot.usedAndHeldMicros,"35");
    assert.equal(snapshot.entries.length,1);
    assert.equal(snapshot.entries[0].status,"SETTLED");
    assert.equal(snapshot.currency,"USD");
    console.log("PA02_R10_MONEY_RESERVATION_PG="+JSON.stringify({
      preInferenceWorstCaseMicros:140,reportedConservativeChargeMicros:35,
      restartPreventsDoubleChargeAttempt:true,
      atomicBudgetExhaustionBlocksBeforeProvider:true,
      noSupplierPriceAsserted:true,productionUsed:false
    }));
  }finally{
    await restarted?.close();await ledger?.close();
    await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');
    await admin.end();
  }
});
test("PA02 R10: concurrent Hosts cannot reserve twice; unknown/malformed usage remains held and forbids another billed request",{
  skip:!url?"Requires disposable PostgreSQL18":false,timeout:90000
},async()=>{
  const schema="pa02_cost_"+randomUUID().replaceAll("-","").slice(0,12);
  const admin=postgres(url,{max:2});
  const policy={...synthetic,runLimitMicros:500};
  let a,b;
  try{
    a=await createPa02IsolatedPostgresCostLedgerV010({connectionString:url,schema});
    b=await createPa02IsolatedPostgresCostLedgerV010({connectionString:url,schema});
    const runId="pa02-cost:race";
    const results=await Promise.all([
      a.reserve({scope,runId,sliceId:"A",policy}),
      b.reserve({scope,runId,sliceId:"B",policy})
    ]);
    assert.deepEqual(results.map(x=>x.status).sort(),["RESERVED","UNKNOWN_HELD"]);
    const winningSlice=results[0].status==="RESERVED"?"A":"B";
    const losingSlice=winningSlice==="A"?"B":"A";
    const unknown=await a.settle({scope,runId,sliceId:winningSlice,policy});
    assert.equal(unknown.status,"UNKNOWN");
    const next=await b.reserve({scope,runId,sliceId:losingSlice,policy});
    assert.equal(next.status,"UNKNOWN_HELD");
    const state=await b.snapshot({scope,runId});
    assert.equal(state.usedAndHeldMicros,"140");
    assert.equal(state.entries.length,1);
    assert.equal(state.entries[0].status,"UNKNOWN");
    assert.equal(state.entries[0].chargedMicros,"0",
      "Unknown charge means no bill asserted, not a zero-cost inference");
    await assert.rejects(b.reserve({
      scope,runId,sliceId:"C",policy:{...policy,pricingVersion:"new-unapproved-rate"}
    }),/PA02_R10_COST_POLICY_DRIFT_DENIED/);
    const wrongScope={...scope,contextId:"personal:foreign"};
    const other=await a.snapshot({scope:wrongScope,runId});
    assert.equal(other.entries.length,0);
    assert.equal(other.capMicros,undefined);
    console.log("PA02_R10_MONEY_UNKNOWN_PG="+JSON.stringify({
      concurrentPreflightSingleWinner:true,
      missingUsageNeverReleasesReserve:true,
      postCrashUnknownForbidsFurtherProviderCalls:true,
      changedPricingVersionDenied:true,crossContextInvisible:true,
      noSupplierPriceAsserted:true,productionUsed:false
    }));
  }finally{
    await b?.close();await a?.close();
    await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');
    await admin.end();
  }
});
test("PA02 R10: reject a missing, malformed or fabricated tariff before reserve",{
  skip:!url?"Requires disposable PostgreSQL18":false,timeout:90000
},async()=>{
  const schema="pa02_cost_"+randomUUID().replaceAll("-","").slice(0,12);
  const admin=postgres(url,{max:2});
  let ledger;
  try{
    ledger=await createPa02IsolatedPostgresCostLedgerV010({connectionString:url,schema});
    const sample={scope,runId:"pa02-cost:reject",sliceId:"S"};
    for(const policy of [
      {...synthetic,approvalId:""},
      {...synthetic,currency:""},
      {...synthetic,worstInputMicrosPerMillion:0},
      {...synthetic,worstOutputMicrosPerMillion:-1},
      {...synthetic,maxBillableInputTokens:0},
      {...synthetic,runLimitMicros:0}
    ]){
      await assert.rejects(ledger.reserve({...sample,policy}),
        /PA02_R10_COST_/);
    }
    await assert.rejects(ledger.reserve({
      ...sample,policy:undefined
    }),/PA02_R10_COST_/);
    const state=await ledger.snapshot({scope,runId:sample.runId});
    assert.equal(state.entries.length,0);
    assert.equal(state.capMicros,undefined);
    console.log("PA02_R10_MONEY_UNAPPROVED_REFUSAL="+JSON.stringify({
      invalidOrMissingTariffRejectedBeforeAnyReservation:true,
      noProviderInferenceFixtureUsed:true,productionUsed:false
    }));
  }finally{
    await ledger?.close();
    await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');
    await admin.end();
  }
});
