import test from "node:test";
import assert from "node:assert/strict";
import {
  createTradingFinanceIntentPreflightV010,
  TRADING_FINANCE_COST_REQUEST_ACTION_V010,
  TRADING_FINANCE_ALLOCATION_REQUEST_ACTION_V010
} from "../../dist/apps/trading-reference/finance-intent-admission.js";
const v1=id=>({id,version:1});
function request(kind="COST_VALUATION"){
 const common={
  contractVersion:"0.1.0",orderNo:"SO-7",
  customerCounterpartyId:"cp-7",itemId:"item-7",warehouseId:"wh-7",
  idempotencyKey:"attempt-7"
 };
 return {
  contextId:"host-context-7",
  requestContext:{
   contractVersion:"0.1.0",
   principal:{
    contractVersion:"0.1.0",subjectId:"actor-7",
    actorType:"HUMAN",identityProviderId:"login",sessionId:"session-7"
   },
   scope:{contractVersion:"0.1.0",enterpriseId:"host-7",userId:"actor-7"},
   context:{activeContext:{
    contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"host-context-7",enterpriseId:"host-7"
   }},
   correlationId:"trace-7"
  },
  intent:kind==="COST_VALUATION"?{
   ...common,kind,
   shipmentBusinessDataId:"ship-bd-7",costMethod:"FIFO",
   valuationPolicy:v1("vp-7"),allocationPolicy:v1("ap-7"),
   shipmentValuationRule:v1("rule-7"),boundarySequence:"42"
  }:{
   ...common,kind,
   sourceOrderBusinessDataId:"order-bd-7",
   consumerReceiptBusinessDataId:"receipt-bd-7",
   amount:"1000.00",currency:"CNY",
   allocationPolicy:v1("allocation-7"),settlementMode:"EXPLICIT_FULL"
  }
 };
}
function fixture({deniedResource="",withPolicy=true,withOwner=true,
 ownerScope="evo-7",ownerOrder="SO-7",obligationType=""}={}){
 const auth=[],ownerCalls=[],mapped=[];
 const options={
  resolveEvoEnterpriseId(ctx){
   mapped.push(ctx.scope.enterpriseId);
   return ownerScope==="no-map"?"": "evo-7";
  },
  resolveAuthorizationProvider:()=>withPolicy?({
   providerId:"test-policy",
   check:async q=>{
    auth.push(q);
    return {contractVersion:"0.1.0",
      allowed:q.resource.type!==deniedResource,
      policyProviderId:"test-policy",
      reasonCodes:[],
      ...(obligationType && q.resource.type===obligationType
        ?{obligations:[{type:"REQUIRES_APPROVAL"}]}:{})
    };
   }
  }):undefined,
  resolveOwnerPreflight:()=>withOwner?({
   verify:async envelope=>{
    ownerCalls.push(envelope);
    return {contractVersion:"0.1.0",verified:true,
      evoEnterpriseId:ownerScope,orderNo:ownerOrder,reasonCodes:[]};
   }
  }):undefined
 };
 return {auth,ownerCalls,mapped,service:createTradingFinanceIntentPreflightV010(options)};
}
test("B2D1 Host verifies each COST reference separately with explicit EVO map and immutable pins",async()=>{
 const f=fixture();
 const result=await f.service.verify(request());
 assert.deepEqual(result,{
  contractVersion:"0.1.0",
  status:"OWNER_FACTS_VERIFIED_NO_EXECUTION",
  operation:"COST_VALUATION",orderNo:"SO-7",executionAllowed:false
 });
 assert.deepEqual(f.auth.map(x=>x.resource.type),[
  "trading-reference.sales-order","counterparty.subject",
  "item.subject","warehouse.subject",
  "trading-reference.shipment-business-data"
 ]);
 assert.ok(f.auth.every(x=>x.action===TRADING_FINANCE_COST_REQUEST_ACTION_V010));
 assert.ok(f.auth.every(x=>x.scope.enterpriseId==="host-7"));
 assert.equal(f.ownerCalls.length,1);
 assert.equal(f.ownerCalls[0].evoEnterpriseId,"evo-7");
 assert.equal(f.ownerCalls[0].hostEnterpriseId,"host-7");
 assert.equal(f.ownerCalls[0].intent.valuationPolicy.version,1);
 assert.equal(f.ownerCalls[0].intent.shipmentValuationRule.id,"rule-7");
 assert.equal(f.ownerCalls[0].intent.boundarySequence,"42");
 assert.deepEqual(f.mapped,["host-7"]);
});
test("B2D1 CASH requires independent source and receipt authorization and accepts AI principal via identical guard",async()=>{
 const f=fixture();
 const req=request("CASH_ALLOCATION");
 req.requestContext.principal.actorType="AI";
 const result=await f.service.verify(req);
 assert.equal(result.operation,"CASH_ALLOCATION");
 assert.equal(result.executionAllowed,false);
 assert.deepEqual(f.auth.map(x=>x.resource.type),[
  "trading-reference.sales-order","counterparty.subject",
  "item.subject","warehouse.subject",
  "trading-reference.source-order-business-data",
  "trading-reference.customer-receipt-business-data"
 ]);
 assert.ok(f.auth.every(x=>x.action===TRADING_FINANCE_ALLOCATION_REQUEST_ACTION_V010));
 assert.equal(f.ownerCalls[0].actorType,"AI");
 assert.equal(f.ownerCalls[0].intent.amount,"1000.00");
 assert.equal(f.ownerCalls[0].intent.currency,"CNY");
 assert.equal(f.ownerCalls[0].intent.consumerReceiptBusinessDataId,"receipt-bd-7");
});
test("B2D1 refuses personal, crossed enterprise or missing principal before policy or owner",async()=>{
 for(const mutate of [
  q=>q.requestContext.context.activeContext.kind="PERSONAL",
  q=>q.requestContext.scope.enterpriseId="other-enterprise",
  q=>q.contextId="other-context",
  q=>q.requestContext.principal.subjectId="",
  q=>{delete q.requestContext.context;}
 ]){
  const f=fixture(),q=request();mutate(q);
  await assert.rejects(f.service.verify(q),/TR01B2D_ENTERPRISE_CONTEXT_MISMATCH/);
  assert.equal(f.auth.length,0);
  assert.equal(f.ownerCalls.length,0);
  assert.equal(f.mapped.length,0);
 }
});
test("B2D1 validates required explicit pins/boundary and settlement semantics before any authorization",async()=>{
 const cases=[
  [q=>q.intent.valuationPolicy=undefined,"PIN_REQUIRED"],
  [q=>q.intent.allocationPolicy.version=0,"PIN_VERSION_INVALID"],
  [q=>q.intent.shipmentValuationRule.version=1.5,"PIN_VERSION_INVALID"],
  [q=>q.intent.boundarySequence="0","BOUNDARY_INVALID"],
  [q=>q.intent.boundarySequence="latest","BOUNDARY_INVALID"],
  [q=>q.intent.costMethod="UNKNOWN","COST_METHOD_UNSUPPORTED"],
  [q=>q.intent.shipmentBusinessDataId="","FIELD_REQUIRED"],
  [q=>q.intent.contractVersion="0.2.0","INTENT_VERSION_UNSUPPORTED"],
  [q=>q.intent.idempotencyKey="","FIELD_REQUIRED"],
  [q=>q.intent.orderNo="","FIELD_REQUIRED"]
 ];
 for(const [mutate,error] of cases){
  const f=fixture(),q=request();mutate(q);
  await assert.rejects(f.service.verify(q),new RegExp("TR01B2D_"+error));
  assert.equal(f.auth.length,0);
  assert.equal(f.ownerCalls.length,0);
 }
 const badCash=[
  [q=>q.intent.amount="0","AMOUNT_INVALID"],
  [q=>q.intent.amount="-1","AMOUNT_INVALID"],
  [q=>q.intent.amount="1.234","AMOUNT_INVALID"],
  [q=>q.intent.amount="NaN","AMOUNT_INVALID"],
  [q=>q.intent.currency="cny","CURRENCY_INVALID"],
  [q=>q.intent.currency="USD-EUR","CURRENCY_INVALID"],
  [q=>q.intent.settlementMode="PARTIAL","PARTIAL_SETTLEMENT_NOT_CERTIFIED"],
  [q=>q.intent.consumerReceiptBusinessDataId=q.intent.sourceOrderBusinessDataId,
   "SOURCE_CONSUMER_SAME"],
  [q=>q.intent.sourceOrderBusinessDataId="","FIELD_REQUIRED"],
  [q=>q.intent.allocationPolicy.version=-1,"PIN_VERSION_INVALID"]
 ];
 for(const [mutate,error] of badCash){
  const f=fixture(),q=request("CASH_ALLOCATION");mutate(q);
  await assert.rejects(f.service.verify(q),new RegExp("TR01B2D_"+error));
  assert.equal(f.auth.length,0);assert.equal(f.ownerCalls.length,0);
 }
});
test("B2D1 denies independently when any order/customer/item/warehouse/source/receipt policy fails",async()=>{
 const resources=[
  "trading-reference.sales-order","counterparty.subject","item.subject",
  "warehouse.subject","trading-reference.shipment-business-data"
 ];
 for(const name of resources){
  const f=fixture({deniedResource:name});
  await assert.rejects(f.service.verify(request()),/TR01B2D_RESOURCE_AUTHORIZATION_DENIED/);
  assert.equal(f.ownerCalls.length,0);
  assert.equal(f.auth.at(-1).resource.type,name);
 }
 for(const name of [
  "trading-reference.source-order-business-data",
  "trading-reference.customer-receipt-business-data"
 ]){
  const f=fixture({deniedResource:name});
  await assert.rejects(f.service.verify(request("CASH_ALLOCATION")),
    /TR01B2D_RESOURCE_AUTHORIZATION_DENIED/);
  assert.equal(f.ownerCalls.length,0);
 }
});
test("B2D1 never silently accepts authorization obligations or missing policy",async()=>{
 const denied=fixture({withPolicy:false});
 await assert.rejects(denied.service.verify(request()),/TR01B2D_AUTHORIZATION_REQUIRED/);
 assert.equal(denied.ownerCalls.length,0);
 const condition=fixture({obligationType:"warehouse.subject"});
 await assert.rejects(condition.service.verify(request()),/RESOURCE_AUTHORIZATION_DENIED/);
 assert.equal(condition.ownerCalls.length,0);
});
test("B2D1 has no default owner; cannot turn Host permission into a cost/settlement write",async()=>{
 const f=fixture({withOwner:false});
 await assert.rejects(f.service.verify(request()),/TR01B2D_OWNER_PLUGIN_NOT_ADMITTED/);
 assert.equal(f.auth.length,5);
 assert.equal(f.ownerCalls.length,0);
 const other=fixture({withOwner:false});
 await assert.rejects(other.service.verify(request("CASH_ALLOCATION")),
  /TR01B2D_OWNER_PLUGIN_NOT_ADMITTED/);
 assert.equal(other.ownerCalls.length,0);
});
test("B2D1 rejects missing Host-EVO binding before authorization and owner",async()=>{
 const f=fixture({ownerScope:"no-map"});
 await assert.rejects(f.service.verify(request()),/TR01B2D_FIELD_REQUIRED/);
 assert.equal(f.auth.length,0);assert.equal(f.ownerCalls.length,0);
});
test("B2D1 rejects owner attestation for another EVO tenant or order",async()=>{
 const f=fixture({ownerScope:"evo-foreign"});
 await assert.rejects(f.service.verify(request()),/OWNER_FACT_ATTESTATION_REJECTED/);
 assert.equal(f.ownerCalls.length,1);
 const other=fixture({ownerOrder:"OTHER-ORDER"});
 await assert.rejects(other.service.verify(request("CASH_ALLOCATION")),
  /OWNER_FACT_ATTESTATION_REJECTED/);
 assert.equal(other.ownerCalls.length,1);
});
