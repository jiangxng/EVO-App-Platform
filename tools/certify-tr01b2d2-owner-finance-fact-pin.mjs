#!/usr/bin/env node
/**
 * TR-01B2D2: disposable App Platform ↔ EVO owner verifier certification.
 * The exact immutable source facts were submitted through EVO public APIs by
 * prior CI steps; costs and formal allocation were already posted/replayed.
 * EVO's in-process read-only verifier is NOT a production Host route.
 */
import assert from "node:assert/strict";
import { createDatabase } from "../evo/dist/platform/database/src/index.js";
import { PostgresTradingFinanceFactVerifierV010 } from
 "../evo/dist/modules/valuation/infrastructure/postgres-trading-finance-fact-verifier.js";
import { createTradingFinanceIntentPreflightV010 } from
 "../dist/apps/trading-reference/finance-intent-admission.js";
import { computeEconomicRuntimeDigest, computeReplayInputDigest } from
 "../evo/dist/modules/replay/infrastructure/postgres-replay-digest.js";

const db=createDatabase(process.env.DATABASE_URL??"postgres://evo:evo@localhost:5432/evo");
const verified=new PostgresTradingFinanceFactVerifierV010(db);
const orderNo="TR01B-SO-001";
const expected={
 customerCounterpartyId:"cp-tr01b-customer",
 itemId:"item-tr01b",warehouseId:"wh-tr01b"
};
const v=p=>({id:p.id,version:p.version});
async function selectBusiness(enterprise,type,key){
 return db.selectFrom("business_data")
  .select(["id","business_data_type","business_object_key","payload"])
  .where("enterprise_id","=",enterprise)
  .where("business_data_type","=",type)
  .where("business_object_key","=",key).executeTakeFirstOrThrow();
}
async function currentEconomicDigest(enterprise){
 const s=await db.selectFrom("enterprise_runtime_state")
  .select(["consistency_domain","next_posting_sequence"])
  .where("enterprise_id","=",enterprise).executeTakeFirstOrThrow();
 const boundary=BigInt(s.next_posting_sequence)-1n;
 return {
  boundary,
  economic:await computeEconomicRuntimeDigest(db,enterprise,s.consistency_domain,boundary),
  input:await computeReplayInputDigest(db,enterprise,s.consistency_domain,boundary)
 };
}
async function rejection(input,code){
 await assert.rejects(verified.verify(input),error=>
  error instanceof Error&&error.message.startsWith("EVO_FINANCE_FACT_"+code));
}
function hostContext(kind="HUMAN"){
 return {
  contractVersion:"0.1.0",
  principal:{
   contractVersion:"0.1.0",subjectId:"host-verified-user",
   actorType:kind,identityProviderId:"ci-identity",sessionId:"ci-session"
  },
  scope:{contractVersion:"0.1.0",enterpriseId:"host-ci-enterprise",userId:"host-verified-user"},
  context:{activeContext:{
   contractVersion:"0.1.0",kind:"ENTERPRISE",
   enterpriseId:"host-ci-enterprise",contextId:"host-ci-enterprise-context"
  }},
  correlationId:"tr01b2d2:real-evo"
 };
}
try{
 const tenant=await db.selectFrom("enterprise")
  .select(["id"]).where("code","=","EVO_DEMO").executeTakeFirstOrThrow();
 const enterprise=tenant.id;
 const [order,shipment,receipt,valuation,inventoryAllocation,
  settlementAllocation,shipmentRule,state]=await Promise.all([
  selectBusiness(enterprise,"sales_order.approved",orderNo),
  selectBusiness(enterprise,"sales_shipment.created","TR01B-SHIP-001"),
  selectBusiness(enterprise,"cash.received","TR01B-CASH-001"),
  db.selectFrom("valuation_policy").select(["id","version"])
   .where("enterprise_id","=",enterprise)
   .where("code","=","inventory_fifo").where("method","=","FIFO")
   .where("status","=","ACTIVE").where("version","=",1).executeTakeFirstOrThrow(),
  db.selectFrom("allocation_policy").select(["id","version"])
   .where("enterprise_id","=",enterprise)
   .where("code","=","inventory_fifo").where("status","=","PUBLISHED")
   .where("version","=",1).executeTakeFirstOrThrow(),
  db.selectFrom("allocation_policy").select(["id","version"])
   .where("enterprise_id","=",enterprise)
   .where("code","=","fx_settlement_explicit").where("status","=","PUBLISHED")
   .where("version","=",1).executeTakeFirstOrThrow(),
  db.selectFrom("valuation_rule").select(["id","version"])
   .where("enterprise_id","=",enterprise)
   .where("code","=","shipment-inventory-to-cogs")
   .where("status","=","PUBLISHED").where("version","=",1).executeTakeFirstOrThrow(),
  db.selectFrom("enterprise_runtime_state").select(["next_posting_sequence"])
   .where("enterprise_id","=",enterprise).executeTakeFirstOrThrow()
 ]);
 const common={
  contractVersion:"0.1.0",evoEnterpriseId:enterprise,
  orderNo,...expected,idempotencyKey:"B2D2-read-only-check"
 };
 const cost={
  ...common,kind:"COST_VALUATION",
  shipmentBusinessDataId:shipment.id,costMethod:"FIFO",
  valuationPolicy:v(valuation),allocationPolicy:v(inventoryAllocation),
  shipmentValuationRule:v(shipmentRule),
  boundarySequence:String(BigInt(state.next_posting_sequence)-1n)
 };
 const allocation={
  ...common,kind:"CASH_ALLOCATION",
  sourceOrderBusinessDataId:order.id,
  consumerReceiptBusinessDataId:receipt.id,
  amount:"1000.00",currency:"CNY",
  allocationPolicy:v(settlementAllocation),
  settlementMode:"EXPLICIT_FULL"
 };
 const before=await currentEconomicDigest(enterprise);
 const factsBefore=await db.selectFrom("allocation_instruction")
  .select("id").where("enterprise_id","=",enterprise).execute();
 const costBefore=await db.selectFrom("cost_run")
  .select("id").where("enterprise_id","=",enterprise).execute();

 const verifiedCost=await verified.verify(cost);
 const verifiedCash=await verified.verify(allocation);
 assert.equal(verifiedCost.executionAllowed,false);
 assert.equal(verifiedCash.executionAllowed,false);
 assert.equal(verifiedCost.verificationKind,"OWNER_DATABASE_READ_ONLY");
 assert.equal(verifiedCash.verified,true);

 // The Host's already-merged B2D1 guard retains independent policy checks;
 // this in-process adapter is TEST ONLY. It is NOT a trusted network bridge.
 const ownerCalls=[];
 const authCalls=[];
 function hostPreflight(deniedResource=""){
  return createTradingFinanceIntentPreflightV010({
   resolveAuthorizationProvider:()=>({
    providerId:"ci-host-authorization",
    async check(query){
     authCalls.push(query);
     return {
      contractVersion:"0.1.0",
      allowed:query.resource.type!==deniedResource,
      policyProviderId:"ci-host-authorization",reasonCodes:[]
     };
    }
   }),
   resolveEvoEnterpriseId(context){
    assert.equal(context.scope.enterpriseId,"host-ci-enterprise");
    return enterprise;
   },
   resolveOwnerPreflight:()=>({
    async verify(envelope){
     ownerCalls.push(envelope);
     assert.equal(envelope.hostEnterpriseId,"host-ci-enterprise");
     const answer=await verified.verify({
      ...envelope.intent,evoEnterpriseId:envelope.evoEnterpriseId
     });
     return {
      contractVersion:"0.1.0",verified:answer.verified,
      evoEnterpriseId:answer.evoEnterpriseId,
      orderNo:answer.orderNo,reasonCodes:[...answer.reasonCodes]
     };
    }
   })
  });
 }
 function hostRequest(intent,actor="HUMAN"){
  const {evoEnterpriseId,...hostIntent}=intent;
  return {
   contextId:"host-ci-enterprise-context",
   requestContext:hostContext(actor),intent:hostIntent
  };
 }
 const human=await hostPreflight().verify(hostRequest(cost));
 const ai=await hostPreflight().verify(hostRequest(allocation,"AI"));
 assert.equal(human.status,"OWNER_FACTS_VERIFIED_NO_EXECUTION");
 assert.equal(ai.status,"OWNER_FACTS_VERIFIED_NO_EXECUTION");
 assert.equal(human.executionAllowed,false);
 assert.equal(ai.executionAllowed,false);
 assert.equal(ownerCalls.length,2);
 assert.equal(ownerCalls[1].actorType,"AI");

 // A separately-denied Receipt MUST stop at Host before any EVO owner call.
 const calledBefore=ownerCalls.length;
 await assert.rejects(hostPreflight("trading-reference.customer-receipt-business-data")
  .verify(hostRequest(allocation)),/TR01B2D_RESOURCE_AUTHORIZATION_DENIED/);
 assert.equal(ownerCalls.length,calledBefore);
 assert.ok(authCalls.some(q=>q.resource.id===receipt.id));

 // Real owner negative probes: pinned policy, scope and immutable facts.
 await rejection({...cost,customerCounterpartyId:"not-this-customer"},"ORDER_SCOPE_MISMATCH");
 await rejection({...cost,itemId:"other-item"},"ORDER_SCOPE_MISMATCH");
 await rejection({...cost,warehouseId:"other-warehouse"},"ORDER_SCOPE_MISMATCH");
 await rejection({...cost,shipmentBusinessDataId:receipt.id},"SHIPMENT_SCOPE_MISMATCH");
 await rejection({...cost,boundarySequence:"1"},"SHIPMENT_NOT_POSTED_AT_BOUNDARY");
 await rejection({...cost,valuationPolicy:{...cost.valuationPolicy,version:999}},"VALUATION_POLICY_NOT_ACTIVE");
 await rejection({...cost,shipmentValuationRule:{...cost.shipmentValuationRule,version:999}},"SHIPMENT_VALUATION_RULE_NOT_PUBLISHED");
 await rejection({...allocation,sourceOrderBusinessDataId:receipt.id},"ORDER_SOURCE_ID_MISMATCH");
 await rejection({...allocation,consumerReceiptBusinessDataId:shipment.id},"RECEIPT_SCOPE_MISMATCH");
 await rejection({...allocation,amount:"999.00"},"FULL_SETTLEMENT_AMOUNT_MISMATCH");
 await rejection({...allocation,currency:"USD"},"SETTLEMENT_CURRENCY_MISMATCH");
 await rejection({...allocation,allocationPolicy:{...allocation.allocationPolicy,version:999}},"SETTLEMENT_POLICY_NOT_ELIGIBLE");
 await rejection({...allocation,settlementMode:"PARTIAL"},"SETTLEMENT_MODE_NOT_SUPPORTED");
 await rejection({...cost,evoEnterpriseId:"00000000-0000-0000-0000-000000000001"},"RUNTIME_NOT_NORMAL");

 const after=await currentEconomicDigest(enterprise);
 assert.deepEqual(after,before,"Read-only owner verification must not mutate canonical EVO economics");
 assert.deepEqual(
  await db.selectFrom("allocation_instruction").select("id")
   .where("enterprise_id","=",enterprise).execute(),
  factsBefore,"Read-only verifier may not create AllocationInstruction"
 );
 assert.deepEqual(
  await db.selectFrom("cost_run").select("id")
   .where("enterprise_id","=",enterprise).execute(),
  costBefore,"Read-only verifier may not create CostRun"
 );
 console.log("TR01B2D2_OWNER_FINANCE_FACT_PIN_POSTGRESQL_PROOF="+JSON.stringify({
  status:"PASS",
  originalSalesOrderId:order.id,
  originalShipmentId:shipment.id,
  originalCashReceiptId:receipt.id,
  ownerReadOnlyCostVerification:verifiedCost.verified,
  ownerReadOnlyCashVerification:verifiedCash.verified,
  humanAndAiHostPreflightWithoutExecution:true,
  deniedHostReceiptBeforeOwner:true,
  crossTenantWrongPinWrongFactWrongAmountRejected:true,
  immutableEconomicDigestUnchanged:true,
  noNewCostRunOrAllocationInstruction:true,
  ownerTrustedDelegation:"NOT_YET_ADMITTED",
  financeMutationApi:"NOT_INSTALLED",
  installedSalesWorkbench:"NOT_CERTIFIED"
 }));
}finally{await db.destroy();}
