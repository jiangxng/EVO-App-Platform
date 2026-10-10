#!/usr/bin/env node
import assert from "node:assert/strict";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../dist/providers/enterprise-context/resources.js";
import { createCounterpartyRepositoryV010 } from "../dist/apps/counterparty/repository.js";
import { createCounterpartyRoleRepositoryV010 } from "../dist/apps/counterparty/roles.js";
import { createItemRepositoryV010 } from "../dist/apps/item/repository.js";
import { createWarehouseRepositoryV010 } from "../dist/apps/warehouse/repository.js";
import { createSalesReferenceServiceV010 } from "../dist/apps/trading-reference/sales-loop.js";
import { createEvoBusinessDataHttpAdapterV010 } from "../dist/manager/evo-business-data-http-adapter.js";
import { createMemoryEnterpriseApplicationRuntimeBindingStoreV010 } from "../dist/providers/application-runtime-binding/store.js";
import { createEnterpriseApplicationRuntimeBindingProviderV010 } from "../dist/providers/application-runtime-binding/runtime.js";
import { EVO_LEDGER_RUNTIME_PROVIDER_ID_V010,
  toEvoLedgerRuntimeApplicationIdBindingV010 } from "../dist/contracts/evo-ledger-runtime-application-id.js";
import {
 TRADING_REFERENCE_SALES_HOST_APPLICATION_REF_ID_V010,
 TRADING_REFERENCE_PRODUCTION_HOST_APPLICATION_REF_ID_V010,
 TRADING_REFERENCE_SHIPMENT_HOST_APPLICATION_REF_ID_V010,
 TRADING_REFERENCE_CUSTOMER_RECEIPT_HOST_APPLICATION_REF_ID_V010
} from "../dist/apps/trading-reference/sales-loop.js";

const base = (process.env.EVO_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/u,"");
const code = process.env.EVO_ENTERPRISE_CODE ?? "EVO_DEMO";
const wait = ms => new Promise(resolve => setTimeout(resolve,ms));
async function get(path){
 const r=await fetch(base+path,{headers:{accept:"application/json"}});
 const body=await r.json();
 if(!r.ok)throw Error("EVO_HTTP_"+r.status+":"+JSON.stringify(body));
 return body;
}
function transientBalance(err){
 const s=String(err);
 return s.includes("EVO_HTTP_500:")
 && s.includes('"message":"no result"');
}
async function balance(enterprise,ledger,dimensions,predicate,label){
 let last;
 const qs=new URLSearchParams({enterprise_id:enterprise,limit:"100"});
 for(const [key,value] of Object.entries(dimensions)) qs.set("dimension."+key,value);
 for(let a=0;a<75;a++){
  try{
   const page=await get("/api/v1/ledgers/"+encodeURIComponent(ledger)+"/balances?"+qs.toString());
   const exact=page.items?.filter(item=>Object.entries(dimensions).every(
     ([key,value])=>item.dimensions?.[key]===value
   ))??[];
   if(exact.length===1 && predicate(exact[0]))return exact[0];
   last=page;
  }catch(err){
   if(!transientBalance(err))throw err;
   last="temporarily no result while EVO posting";
  }
  await wait(400);
 }
 throw Error("TR01B_BALANCE_TIMEOUT:"+label+":"+JSON.stringify(last));
}
async function work(enterprise,orderNo,predicate,label){
 let last;
 for(let i=0;i<75;i++){
  last=await get("/api/v1/work-items?enterprise_id="+encodeURIComponent(enterprise)+"&limit=100");
  const rows=(last.items??[]).filter(x=>x.dimensions?.order_no===orderNo);
  if(predicate(rows))return rows;
  await wait(400);
 }
 throw Error("TR01B_WORK_TIMEOUT:"+label+":"+JSON.stringify(last));
}
async function observedCount(enterprise,application){
 const res=await fetch(base+"/api/v1/runtime-observations/query",{
  method:"POST",headers:{"content-type":"application/json",accept:"application/json"},
  body:JSON.stringify({
   contractVersion:"0.1.0",enterpriseId:enterprise,
   target:{kind:"APPLICATION_ANCHOR",applicationId:application},
   window:{startAt:"2020-01-01T00:00:00.000Z",endAt:"2030-01-01T00:00:00.000Z"},
   metricCodes:["event.count"]
  })
 });
 const body=await res.json();
 if(!res.ok)throw Error("EVO_EVENTS_"+res.status+":"+JSON.stringify(body));
 const x=body.observations?.find(i=>i.metricCode==="event.count");
 assert.ok(x,"EVO event.count unavailable for "+application);
 return Number(x.value);
}
async function waitEvent(enterprise,app,target){
 for(let i=0;i<70;i++){
  if((await observedCount(enterprise,app))>=target)return;
  await wait(300);
 }
 throw Error("TR01B_APP_EVENTS_NOT_VISIBLE:"+app);
}

const enterprise=await get("/api/v1/enterprises/"+encodeURIComponent(code));
assert.equal(enterprise.status,"ACTIVE");
const evoEnterpriseId=enterprise.id;
const contextId="enterprise-context:tr01b-real";
const binding=createEnterpriseApplicationRuntimeBindingProviderV010({
 store:createMemoryEnterpriseApplicationRuntimeBindingStoreV010(),
 now:()=>new Date("2026-10-10T01:00:00.000Z")
});
function bind(hostApplicationRefId,runtimeApplicationId){
 return toEvoLedgerRuntimeApplicationIdBindingV010(binding.bind({
  enterpriseId:contextId,hostApplicationRefId,
  runtimeProviderId:EVO_LEDGER_RUNTIME_PROVIDER_ID_V010,
  runtimeApplicationId
 })).applicationId;
}
const target={
 scopeKey:evoEnterpriseId,
 salesApplicationId:bind(TRADING_REFERENCE_SALES_HOST_APPLICATION_REF_ID_V010,"sales_order"),
 productionApplicationId:bind(TRADING_REFERENCE_PRODUCTION_HOST_APPLICATION_REF_ID_V010,"production_completion"),
 shipmentApplicationId:bind(TRADING_REFERENCE_SHIPMENT_HOST_APPLICATION_REF_ID_V010,"inventory_movement"),
 cashReceiptApplicationId:bind(TRADING_REFERENCE_CUSTOMER_RECEIPT_HOST_APPLICATION_REF_ID_V010,"cash_receipt")
};
const resources=createMemoryEnterpriseResourceRepositoryV010();
const counterparties=createCounterpartyRepositoryV010(resources);
const roles=createCounterpartyRoleRepositoryV010(resources,counterparties);
const items=createItemRepositoryV010(resources);
const warehouses=createWarehouseRepositoryV010(resources);
const customerId="cp-tr01b-customer",itemId="item-tr01b",warehouseId="wh-tr01b";
const dt="2026-10-10T01:00:00.000Z";
counterparties.save({
 contextId,
 subject:{contractVersion:"0.1.0",counterpartyId:customerId,
  code:"CUS-TR01B",displayName:"TR01B Reference Customer",
  subjectType:"ORGANIZATION",status:"ACTIVE"},
 actorSubjectId:"proof-owner",recordedAt:dt
});
roles.assign({contextId,counterpartyId:customerId,roleCode:"CUSTOMER",
 actorSubjectId:"proof-owner",recordedAt:dt});
items.save({contextId,item:{contractVersion:"0.1.0",itemId,
 code:"ITEM-TR01B",displayName:"TR01B Reference Item",
 itemKind:"GOODS",baseUomCode:"C62"},actorSubjectId:"proof-owner",recordedAt:dt});
warehouses.save({contextId,warehouse:{contractVersion:"0.1.0",warehouseId,
 code:"WH-TR01B",displayName:"TR01B Reference Warehouse"},actorSubjectId:"proof-owner",recordedAt:dt});
const service=createSalesReferenceServiceV010({
 adapter:createEvoBusinessDataHttpAdapterV010({baseUrl:base}),
 counterparties,roles,items,warehouses
});
const selection={contextId,customerCounterpartyId:customerId,itemId,warehouseId};
const orderNo="TR01B-SO-001",n=10,total="1000.00",cost="125.00";
const common={target,selection,orderNo};
const dimensions={order_no:orderNo,customer:customerId,product_id:itemId};
const stockDimensions={...dimensions,warehouse:warehouseId};
const moneyDimensions={order_no:orderNo,customer:customerId};
const before={
 sales:await observedCount(evoEnterpriseId,target.salesApplicationId),
 production:await observedCount(evoEnterpriseId,target.productionApplicationId),
 shipment:await observedCount(evoEnterpriseId,target.shipmentApplicationId),
 receipt:await observedCount(evoEnterpriseId,target.cashReceiptApplicationId)
};
const approved=await service.approveSalesOrder({
 ...common,quantity:n,unitPrice:"100.00",totalAmount:total,currency:"CNY",
 effectiveAt:"2026-10-10T01:10:00.000Z",
 correlationId:"TR01B:S:001",idempotencyKey:"tr01b:approved:001"
});
assert.equal(approved.submission.postingStatus,"QUEUED");
await waitEvent(evoEnterpriseId,target.salesApplicationId,before.sales+1);
const pendingShipment=await balance(evoEnterpriseId,"pending_shipment",
 dimensions,v=>Number(v.quantity)===10,"sales-order pending shipment");
const pendingProduction=await balance(evoEnterpriseId,"pending_production",
 dimensions,v=>Number(v.quantity)===10,"sales-order pending production");
const receivable=await balance(evoEnterpriseId,"receivable",
 moneyDimensions,v=>Number(v.amount)===1000,"sales-order receivable");
const initialWork=await work(evoEnterpriseId,orderNo,
 rows=>rows.some(x=>x.sourceLedgerCode==="pending_shipment"&&x.workType==="SHIP")
 &&rows.some(x=>x.sourceLedgerCode==="receivable"&&x.workType==="COLLECT"),
 "sales work opened");

const produced=await service.completeOrderProduction({
 ...common,orderBusinessDataId:approved.submission.businessDataId,
 productionNo:"TR01B-PROD-001",quantity:n,totalCost:cost,currency:"CNY",
 effectiveAt:"2026-10-10T02:10:00.000Z",
 correlationId:"TR01B:P:001",idempotencyKey:"tr01b:produced:001"
});
await waitEvent(evoEnterpriseId,target.productionApplicationId,before.production+1);
const finishedProduction=await balance(evoEnterpriseId,"pending_production",
 dimensions,v=>Number(v.quantity)===0,"production demand closed");
const stock=await balance(evoEnterpriseId,"inventory",
 stockDimensions,v=>Number(v.quantity)===10,"produced inventory");

const shipped=await service.shipSalesOrder({
 ...common,orderBusinessDataId:approved.submission.businessDataId,
 shipmentNo:"TR01B-SHIP-001",quantity:n,
 effectiveAt:"2026-10-10T03:10:00.000Z",
 correlationId:"TR01B:SHIP:001",idempotencyKey:"tr01b:shipped:001"
});
await waitEvent(evoEnterpriseId,target.shipmentApplicationId,before.shipment+1);
const afterShipment=await balance(evoEnterpriseId,"pending_shipment",
 dimensions,v=>Number(v.quantity)===0,"shipped to completion");
const stockAfterShipment=await balance(evoEnterpriseId,"inventory",
 stockDimensions,v=>Number(v.quantity)===0,"inventory decremented after shipment");
const shipmentWork=await work(evoEnterpriseId,orderNo,
 rows=>!rows.some(x=>x.sourceLedgerCode==="pending_shipment")
 &&rows.some(x=>x.sourceLedgerCode==="receivable"&&x.workType==="COLLECT"),
 "SHIP Work closes but COLLECT remains");

const receipt=await service.receiveCustomerCash({
 ...common,orderBusinessDataId:approved.submission.businessDataId,
 receiptNo:"TR01B-CASH-001",
 settledAmount:total,settledCurrency:"CNY",
 cashAmount:total,cashCurrency:"CNY",
 effectiveAt:"2026-10-10T04:10:00.000Z",
 correlationId:"TR01B:CASH:001",idempotencyKey:"tr01b:cash:001"
});
await waitEvent(evoEnterpriseId,target.cashReceiptApplicationId,before.receipt+1);
const paid=await balance(evoEnterpriseId,"receivable",
 moneyDimensions,v=>Number(v.amount)===0,"receivable settled");
const cash=await balance(evoEnterpriseId,"cash",
 moneyDimensions,v=>Number(v.amount)===1000,"cash recorded");
const finalWork=await work(evoEnterpriseId,orderNo,
 rows=>!rows.some(x=>["pending_production","pending_shipment","receivable"].includes(x.sourceLedgerCode)),
 "O2C reference work closed");
assert.equal(initialWork.length>=2,true);
assert.equal(shipmentWork.some(x=>x.workType==="COLLECT"),true);
assert.ok(approved.submission.businessDataId);
assert.ok(produced.submission.businessDataId);
assert.ok(shipped.submission.businessDataId);
assert.ok(receipt.submission.businessDataId);

console.log("TR01B1_SALES_CUSTOMER_CASH_EVO_POSTGRESQL_PROOF="+JSON.stringify({
 status:"PASS",enterpriseId:evoEnterpriseId,orderNo,
 facts:{
  order:approved.submission.businessDataId,
  production:produced.submission.businessDataId,
  shipment:shipped.submission.businessDataId,
  cashReceipt:receipt.submission.businessDataId
 },
 customerRef:customerId,itemRef:itemId,warehouseRef:warehouseId,
 relations:["FULFILLS","FULFILLS","REFERENCES"],
 afterSales:{
  pendingShipment:Number(pendingShipment.quantity),
  pendingProduction:Number(pendingProduction.quantity),
  receivable:Number(receivable.amount)
 },
 afterProduction:{
  pendingProduction:Number(finishedProduction.quantity),
  inventoryQuantity:Number(stock.quantity),
  inventoryValueNotCertified:true
 },
 afterShipment:{
  pendingShipment:Number(afterShipment.quantity),
  inventoryQuantity:Number(stockAfterShipment.quantity),
  inventoryValueNotCertified:true
 },
 afterReceipt:{receivable:Number(paid.amount),cash:Number(cash.amount)},
 work:{
  initialOpen:true,
  shipClosedBeforePayment:true,
  collectOpenBeforePayment:true,
  finalOpenCount:finalWork.length
 },
 financialBoundary:{
  customerCashNotBankAccount:true,
  noAllocationInstructionClaim:true,
  singleCurrencyFullSettlementOnly:true
 }
}));
