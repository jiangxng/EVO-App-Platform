#!/usr/bin/env node
/**
 * TR-01B2C owner-only PostgreSQL certification.
 *
 * Starts from the SAME four App Platform-originated immutable BusinessData
 * records and completed pinned cost replay of TR-01B1/B2B. Does not create a
 * second synthetic Sales Order. EVO's internal allocation/valuation runtime is
 * invoked only from this disposable GitHub CI runner, never from Host/Agent UI.
 */
import assert from "node:assert/strict";
import { createDatabase } from "../evo/dist/platform/database/src/index.js";
import { createEvoRuntime, demoIds, drainPosting } from "../evo/dist/apps/api/src/evo-runtime.js";
import {
  computeEconomicRuntimeDigest, computeReplayInputDigest
} from "../evo/dist/modules/replay/infrastructure/postgres-replay-digest.js";

const orderNo="TR01B-SO-001";
const customer="cp-tr01b-customer";
const currency="CNY";
const receiptNo="TR01B-CASH-001";
const database=createDatabase(process.env.DATABASE_URL
  ?? "postgres://evo:evo@localhost:5432/evo");
const runtime=createEvoRuntime(database);
function amount(value) {
  assert.ok(value!==null&&value!==undefined,"Missing financial amount");
  return Number(value);
}
async function relation(enterpriseId,instructionId,receiptBusinessDataId){
  return runtime.db.selectFrom("allocation_relation as r")
    .innerJoin("allocation_run as run","run.id","r.allocation_run_id")
    .select([
      "r.id","r.source_position_key","r.source_business_data_id",
      "r.consumer_business_data_id","r.measurements","r.instruction_id",
      "r.allocation_policy_id","r.allocation_policy_version",
      "run.status"
    ])
    .where("r.enterprise_id","=",enterpriseId)
    .where("r.consumer_business_data_id","=",receiptBusinessDataId)
    .where("r.instruction_id","=",instructionId)
    .executeTakeFirst();
}
async function scopeBalances(enterpriseId) {
  const rows=await runtime.db.selectFrom("ledger_balance as l")
    .innerJoin("ledger_definition as d","d.id","l.ledger_definition_id")
    .select(["d.code","l.quantity","l.amount","l.dimensions"])
    .where("l.enterprise_id","=",enterpriseId)
    .where("d.code","in",["inventory","cogs","receivable","cash"])
    .execute();
  function row(code,dimensions){
    const exact=rows.filter(r=>r.code===code
      && Object.entries(dimensions).every(([key,value])=>r.dimensions?.[key]===value));
    assert.equal(exact.length,1,"Expected exactly one scoped "+code+" row");
    return exact[0];
  }
  const dims={order_no:orderNo,customer};
  const inv={...dims,product_id:"item-tr01b",warehouse:"wh-tr01b"};
  return {
    inventoryQuantity:amount(row("inventory",inv).quantity),
    inventoryAmount:amount(row("inventory",inv).amount),
    cogsAmount:amount(row("cogs",inv).amount),
    receivableAmount:amount(row("receivable",dims).amount),
    cashAmount:amount(row("cash",dims).amount)
  };
}
try{
 const ids=await demoIds(runtime);
 const enterpriseId=ids.enterpriseId;
 const [order,receipt]=await Promise.all([
  runtime.db.selectFrom("business_data")
    .select(["id","business_data_type","payload","effective_at"])
    .where("enterprise_id","=",enterpriseId)
    .where("business_data_type","=","sales_order.approved")
    .where("business_object_key","=",orderNo).executeTakeFirstOrThrow(),
  runtime.db.selectFrom("business_data")
    .select(["id","business_data_type","payload","effective_at"])
    .where("enterprise_id","=",enterpriseId)
    .where("business_data_type","=","cash.received")
    .where("business_object_key","=",receiptNo).executeTakeFirstOrThrow()
 ]);
 assert.equal(order.payload.customer,customer);
 assert.equal(receipt.payload.customer,customer);
 assert.equal(order.payload.totalAmount,"1000.00");
 assert.equal(receipt.payload.settledAmount,"1000.00");
 assert.equal(order.payload.currency,currency);
 assert.equal(order.payload.localCarryingAmount,"1000.00");
 assert.equal(order.payload.localCurrency,currency);
 assert.equal(receipt.payload.settledCurrency,currency);
 assert.equal(receipt.payload.cashCurrency,currency);

 const baseline=await scopeBalances(enterpriseId);
 assert.deepEqual(baseline,{
  inventoryQuantity:0,inventoryAmount:0,cogsAmount:125,
  receivableAmount:0,cashAmount:1000
 });
 const policy=await runtime.db.selectFrom("allocation_policy")
  .select(["id","version"])
  .where("enterprise_id","=",enterpriseId)
  .where("code","=","fx_settlement_explicit")
  .where("status","=","PUBLISHED")
  .where("version","=",1).executeTakeFirstOrThrow();
 const effectiveAt=receipt.effective_at instanceof Date
   ?receipt.effective_at:new Date(receipt.effective_at);
 const input={
  enterpriseId,
  consumerBusinessDataId:receipt.id,
  mode:"EXPLICIT",
  sourceSelector:{kind:"BUSINESS_DATA",businessDataId:order.id},
  actorType:"AUTOMATION",actorId:"demo-automation",
  effectiveAt,
  reason:"TR01B2C exact App Platform-originated Sales Order/Customer Cash settlement",
  allocationPolicyId:policy.id,
  allocationPolicyVersion:policy.version,
  idempotencyKey:"tr01b2c:formal-cash-allocation:001"
 };
 const instruction=await runtime.allocation.recordInstruction(input);
 const repeated=await runtime.allocation.recordInstruction(input);
 assert.equal(repeated.id,instruction.id,"Same instruction idempotency key must not duplicate");
 await assert.rejects(
  runtime.allocation.recordInstruction({
   ...input,sourceSelector:{kind:"BUSINESS_DATA",businessDataId:"wrong-order"}
  }),
  /ALLOCATION_INSTRUCTION_IDEMPOTENCY_CONFLICT/
 );
 await assert.rejects(runtime.allocation.recordInstruction({
  ...input,consumerBusinessDataId:"not-in-enterprise",idempotencyKey:"wrong-receipt"
 }),/ALLOCATION_BUSINESS_DATA_ENTERPRISE_MISMATCH/);
 assert.equal(await relation(enterpriseId,instruction.id,receipt.id),undefined,
  "Instruction alone cannot be claimed as formal consumed AllocationRelation");

 const pd=await runtime.db.selectFrom("position_definition")
  .select(["id","version","semantic_digest"])
  .where("enterprise_id","=",enterpriseId)
  .where("code","=","fx_receivable")
  .where("status","=","PUBLISHED")
  .where("version","=",1).executeTakeFirstOrThrow();
 const valRequest=await runtime.command.execute({
  enterpriseId,applicationInstanceId:ids.valuationAppId,
  commandCode:"request-valuation",
  actor:{type:"AUTOMATION",id:"demo-automation"},
  requestId:"tr01b2c:valuation-request:001",
  correlationId:"TR01B:SO001:SETTLEMENT",
  causationId:receipt.id,
  idempotencyKey:"tr01b2c:valuation-request:001",
  input:{
   requestCode:"FX-SETTLE-"+orderNo,
   valuationKind:"FX_REALIZED_SETTLEMENT",
   valuationAt:effectiveAt.toISOString(),
   scope:{kind:"DIMENSION_QUERY",dimensions:{order_no:orderNo,customer}},
   positionDefinition:{
    definitionId:pd.id,version:pd.version,digest:pd.semantic_digest
   },
   settlementBusinessDataId:receipt.id,
   allocationPolicy:{id:policy.id,version:policy.version},
   instructionId:instruction.id,
   settlementMapping:{
    foreignValueField:"settledAmount",
    foreignUnitField:"settledCurrency",
    localValueField:"cashAmount",
    localUnitField:"cashCurrency"
   }
  },
  effectiveAt,
  businessObjectKey:"TR01B2C-FORMAL-SETTLEMENT-001"
 });
 assert.ok(valRequest.commandExecutionId);
 await drainPosting(runtime,enterpriseId);
 const state=await runtime.db.selectFrom("enterprise_runtime_state")
  .select(["consistency_domain","next_posting_sequence"])
  .where("enterprise_id","=",enterpriseId).executeTakeFirstOrThrow();
 const boundary=BigInt(state.next_posting_sequence)-1n;
 const calculated=await runtime.valuationReplay.replayAcceptedRequests(
  enterpriseId,state.consistency_domain,boundary
 );
 assert.ok(calculated.replayedRequestCount>=1);
 const beforeRelation=await relation(enterpriseId,instruction.id,receipt.id);
 assert.ok(beforeRelation,"EVO must materialize formal source-target allocation relation");
 assert.equal(beforeRelation.status,"COMPLETED");
 assert.ok(beforeRelation.source_position_key);
 assert.equal(beforeRelation.consumer_business_data_id,receipt.id);
 assert.equal(beforeRelation.instruction_id,instruction.id);
 assert.equal(beforeRelation.allocation_policy_id,policy.id);
 assert.equal(beforeRelation.allocation_policy_version,policy.version);
 const settlement=beforeRelation.measurements.find(x=>x.role==="SETTLEMENT_QUANTITY");
 assert.ok(settlement);
 assert.equal(amount(settlement.value),1000);
 assert.equal(settlement.unit,currency);
 const fxResult=await runtime.db.selectFrom("valuation_result")
  .select(["delta_amount","delta_unit","source_business_data_ids"])
  .where("enterprise_id","=",enterpriseId)
  .where("result_kind","=","FX_REALIZED_SETTLEMENT").execute();
 const ourResult=fxResult.find(x=>Array.isArray(x.source_business_data_ids)
  && x.source_business_data_ids.includes(receipt.id));
 assert.ok(ourResult,"Formal settlement must generate a linked valuation result");
 assert.equal(amount(ourResult.delta_amount),0);
 assert.equal(ourResult.delta_unit,currency);
 assert.deepEqual(await scopeBalances(enterpriseId),baseline);
 const beforeEconomic=await computeEconomicRuntimeDigest(
  runtime.db,enterpriseId,state.consistency_domain,boundary
 );
 const beforeInput=await computeReplayInputDigest(
  runtime.db,enterpriseId,state.consistency_domain,boundary
 );

 const replay=await runtime.replay.prepareFullReplay(enterpriseId);
 assert.equal(replay.beforeDigest,beforeEconomic);
 assert.equal(replay.boundarySequence,boundary);
 assert.equal(replay.costMethod,"FIFO");
 assert.ok(replay.costPins?.valuationRules?.["sales_shipment.created"]);
 await drainPosting(runtime,enterpriseId);
 const cost=await runtime.cost.recalculate(
  enterpriseId,replay.costMethod,replay.costPins
 );
 assert.ok(cost.valuationPostingCount>=1);
 const replayed=await runtime.valuationReplay.replayAcceptedRequests(
  enterpriseId,state.consistency_domain,boundary
 );
 assert.ok(replayed.replayedRequestCount>=1);
 await runtime.work.refresh(enterpriseId);
 const afterEconomic=await computeEconomicRuntimeDigest(
  runtime.db,enterpriseId,state.consistency_domain,boundary
 );
 const afterInput=await computeReplayInputDigest(
  runtime.db,enterpriseId,state.consistency_domain,boundary
 );
 await runtime.replay.completeFullReplay(replay.replayRunId,enterpriseId,afterEconomic);
 assert.equal(afterEconomic,beforeEconomic);
 assert.deepEqual(afterInput,beforeInput);
 const afterRelation=await relation(enterpriseId,instruction.id,receipt.id);
 assert.ok(afterRelation);
 assert.equal(afterRelation.status,"COMPLETED");
 assert.equal(afterRelation.source_position_key,beforeRelation.source_position_key);
 assert.deepEqual(afterRelation.measurements,beforeRelation.measurements);
 const persisted=await runtime.allocation.getInstruction(instruction.id);
 assert.ok(persisted);
 assert.equal(persisted.sourceSelector.businessDataId,order.id);
 const run=await runtime.db.selectFrom("replay_run")
  .select(["validation_status","status"])
  .where("id","=",replay.replayRunId).executeTakeFirstOrThrow();
 assert.equal(run.validation_status,"MATCH");
 assert.equal(run.status,"COMPLETED");
 assert.deepEqual(await scopeBalances(enterpriseId),baseline);

 console.log("TR01B2C_APP_ORIGIN_RECEIPT_ALLOCATION_EVO_POSTGRESQL_PROOF="+JSON.stringify({
  status:"PASS",
  evidenceBoundary:"EVO_OWNER_ISOLATED_CI_NOT_PUBLIC_HOST_ALLOCATION_API",
  sourceOrderBusinessDataId:order.id,
  consumerReceiptBusinessDataId:receipt.id,
  instructionId:instruction.id,
  instructionReplaySurvived:true,
  relationConsumerMatchesReceipt:true,
  relationSourcePositionKey:afterRelation.source_position_key,
  measurement:{value:String(settlement.value),unit:settlement.unit},
  amountCny:1000,
  realizedFxDelta:0,
  canonicalEconomicReplay:"MATCH",
  canonicalInputReplay:"UNCHANGED",
  ledger:baseline,
  productionPublicAllocationOperation:"NOT_ADMITTED",
  bankAccountMasterData:"NOT_IMPLEMENTED"
 }));
}finally{
 await database.destroy();
}
