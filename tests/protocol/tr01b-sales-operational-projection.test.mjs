import test from "node:test";
import assert from "node:assert/strict";
import {
  createSalesOperationalProjectionServiceV010,
  SALES_OPERATIONS_READ_ACTION_V010
} from "../../dist/apps/trading-reference/sales-operational-projection.js";
import {
  createSalesOperationalEvoHttpReaderV010
} from "../../dist/apps/trading-reference/sales-operational-http-reader.js";

const order={order_no:"SO-1",customer:"cp-1"};
const product={...order,product_id:"item-1"};
const stock={...product,warehouse:"wh-1"};
function request(actorType="HUMAN"){
  return {
    contextId:"ctx-host",enterpriseId:"evo-a",
    orderNo:"SO-1",customerCounterpartyId:"cp-1",
    itemId:"item-1",warehouseId:"wh-1",
    requestContext:{
      contractVersion:"0.1.0",
      principal:{
        contractVersion:"0.1.0",subjectId:"user-a",actorType,
        sessionId:"proof-session",identityProviderId:"proof-provider"
      },
      scope:{contractVersion:"0.1.0",enterpriseId:"host-a",userId:"user-a"},
      context:{activeContext:{
        contractVersion:"0.1.0",kind:"ENTERPRISE",
        enterpriseId:"host-a",contextId:"ctx-host"
      }},
      correlationId:"proof"
    }
  };
}
function fixture({pending=10,receivable=1000,cash=0,
  inventory=10,inventoryAmount=125,work=true}={}){
 const calls=[],authCalls=[];
 const reader={
  async listOpenWorkItems(enterprise){
   calls.push(["work",enterprise]);
   return {complete:true,items:[
    ...(work&&pending>0?[{sourceLedgerCode:"pending_shipment",
     workType:"SHIP",dimensions:product,quantity:pending}]:[]),
    ...(work&&receivable>0?[{sourceLedgerCode:"receivable",
     workType:"COLLECT",dimensions:order,amount:receivable}]:[]),
    {sourceLedgerCode:"receivable",workType:"COLLECT",
     dimensions:{...order,order_no:"OTHER"},amount:500}
   ]};
  },
  async readLedgerBalances(enterprise,ledger,dims){
   calls.push([ledger,enterprise,dims]);
   const row=ledger==="pending_shipment"
    ?{dimensions:product,quantity:pending,amount:0}
    :ledger==="receivable"
     ?{dimensions:order,quantity:0,amount:receivable}
     :ledger==="inventory"
      ?{dimensions:stock,quantity:inventory,amount:inventoryAmount}
      :{dimensions:order,quantity:0,amount:cash};
   return {complete:true,items:[row]};
  }
 };
 const provider={providerId:"proof",async check(q){
  authCalls.push(q);return {
   contractVersion:"0.1.0",allowed:true,
   policyProviderId:"proof",reasonCodes:[]
  };
 }};
 const service=createSalesOperationalProjectionServiceV010({
  reader,resolveAuthorizationProvider:()=>provider
 });
 return {service,reader,calls,authCalls,provider};
}

test("TR-01B2A shared Human/AI view is derived solely from EVO Work/Ledger read",async()=>{
 const f=fixture();
 const human=await f.service.read(request());
 const ai=await f.service.read(request("AI"));
 assert.deepEqual(human,ai);
 assert.equal(human.enterpriseId,"evo-a");
 assert.equal(human.pendingShipmentQuantity,10);
 assert.equal(human.receivableAmount,1000);
 assert.equal(human.cashLedgerAmount,0);
 assert.equal(human.inventoryPosition.quantity,10);
 assert.equal(human.inventoryPosition.observedLedgerAmount,125);
 assert.equal(human.inventoryPosition.costValuationCertified,false);
 assert.deepEqual(human.openWork,{
  ship:{quantity:10},collect:{amount:1000}
 });
 assert.equal(f.authCalls.length,2);
 assert.equal(f.authCalls[0].action,SALES_OPERATIONS_READ_ACTION_V010);
 assert.equal(f.authCalls[0].resource.type,"trading-reference.sales-order");
 assert.equal(f.authCalls[0].resource.attributes.customerCounterpartyId,"cp-1");
 assert.equal(f.authCalls[1].principal.actorType,"AI");
 assert.equal(f.calls.length,10);
});

test("TR-01B2A collection closes SHIP and COLLECT without inventing COGS",async()=>{
 const f=fixture({pending:0,receivable:0,cash:1000,inventory:0});
 const view=await f.service.read(request());
 assert.deepEqual(view.openWork,{ship:null,collect:null});
 assert.equal(view.inventoryPosition.quantity,0);
 assert.equal(view.inventoryPosition.observedLedgerAmount,125);
 assert.equal(view.inventoryPosition.costValuationCertified,false);
 assert.equal(view.cashLedgerAmount,1000);
});

test("TR-01B2A rejects missing/denying/conditional policy before EVO I/O",async()=>{
 const f=fixture();
 for(const policy of [
  undefined,
  {providerId:"deny",check:async()=>({
   contractVersion:"0.1.0",allowed:false,policyProviderId:"deny",reasonCodes:["NO"]
  })},
  {providerId:"conditional",check:async()=>({
   contractVersion:"0.1.0",allowed:true,policyProviderId:"conditional",
   reasonCodes:[],obligations:[{type:"MASK"}]
  })}
 ]){
  const svc=createSalesOperationalProjectionServiceV010({
   reader:f.reader,resolveAuthorizationProvider:()=>policy
  });
  await assert.rejects(svc.read(request()),/AUTHORIZATION_REQUIRED|READ_DENIED/);
 }
 assert.deepEqual(f.calls,[]);
});

test("TR-01B2A rejects cross-enterprise and personal scope before policy or reader",async()=>{
 const f=fixture();
 const crossed=request();crossed.requestContext.scope.enterpriseId="host-b";
 await assert.rejects(f.service.read(crossed),/CONTEXT_MISMATCH/);
 const personal=request();personal.requestContext.context.activeContext.kind="PERSONAL";
 await assert.rejects(f.service.read(personal),/CONTEXT_MISMATCH/);
 const blank=request();blank.enterpriseId="";
 await assert.rejects(f.service.read(blank),/CONTEXT_MISMATCH/);
 assert.equal(f.authCalls.length,0);assert.equal(f.calls.length,0);
});

test("TR-01B2A fails closed on incomplete, extra scope and ambiguous EVO pages",async()=>{
 const f=fixture();
 const o=f.reader.listOpenWorkItems;
 f.reader.listOpenWorkItems=async(...args)=>({
  ...(await o(...args)),complete:false
 });
 await assert.rejects(f.service.read(request()),/INCOMPLETE_PAGE:work/);
 const b=fixture();
 const old=b.reader.readLedgerBalances;
 b.reader.readLedgerBalances=async(...args)=>{
  const result=await old(...args);
  return args[1]==="receivable"
   ?{complete:true,items:[...result.items,{...result.items[0],dimensions:{...order,customer:"different"}}]}
   :result;
 };
 await assert.rejects(b.service.read(request()),/LEDGER_SCOPE_AMBIGUOUS:receivable/);
});

test("TR-01B2A refuses contradictory Work/balance and stale Work quantity",async()=>{
 const missing=fixture({pending:10,work:false});
 await assert.rejects(missing.service.read(request()),/NOT_CONVERGED:SHIP/);
 const stale=fixture();
 const original=stale.reader.listOpenWorkItems;
 stale.reader.listOpenWorkItems=async(...args)=>{
  const x=await original(...args);
  return {...x,items:x.items.map(i=>i.workType==="SHIP"?{...i,quantity:9}:i)};
 };
 await assert.rejects(stale.service.read(request()),/NOT_CONVERGED:SHIP/);
});

test("TR-01B2A public reader verifies dimension filters and fails on truncated pages",async()=>{
 const urls=[];
 const reader=createSalesOperationalEvoHttpReaderV010({
  baseUrl:"http://evo.test/",
  fetchImpl:async url=>{
   urls.push(String(url));
   return {ok:true,json:async()=>({items:[],truncated:false})};
  }
 });
 const p=await reader.readLedgerBalances("evo-a","inventory",stock);
 assert.equal(p.complete,true);
 assert.match(urls[0],/dimension\.warehouse=wh-1/);
 assert.match(urls[0],/enterprise_id=evo-a/);
 const partial=createSalesOperationalEvoHttpReaderV010({
  baseUrl:"http://evo.test",
  fetchImpl:async()=>({ok:true,json:async()=>({items:[],truncated:true})})
 });
 assert.equal((await partial.listOpenWorkItems("evo-a")).complete,false);
 const capped=createSalesOperationalEvoHttpReaderV010({
  baseUrl:"http://evo.test",
  fetchImpl:async()=>({ok:true,json:async()=>({items:Array.from({length:100},()=>({}))})})
 });
 assert.equal((await capped.listOpenWorkItems("evo-a")).complete,false);
});
