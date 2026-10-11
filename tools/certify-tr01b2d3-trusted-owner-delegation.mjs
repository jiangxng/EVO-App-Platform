#!/usr/bin/env node
/**
 * TR-01B2D3 candidate: original App-generated Sales/Shipment/Cash are already
 * POSTED by preceding stages, after FIFO/Allocation/Full Replay. Unlike B2D2,
 * all owner verification here goes over the real Fastify HTTP network route,
 * validated by independent Ed25519 signature and PostgreSQL nonce consumption.
 * This proves a transport candidate, not installed production Human UX.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDatabase } from '../evo/dist/platform/database/src/index.js';
import { createTradingFinanceIntentPreflightV010 } from
  '../dist/apps/trading-reference/finance-intent-admission.js';
import { createTrustedRemoteFinanceOwnerPreflightV010 } from
  '../dist/apps/trading-reference/finance-owner-remote.js';
import { computeEconomicRuntimeDigest,computeReplayInputDigest } from
  '../evo/dist/modules/replay/infrastructure/postgres-replay-digest.js';
const database=createDatabase(process.env.DATABASE_URL);
const db=database.db;
const installation=JSON.parse(readFileSync('/tmp/tr01b2d3-host-install.json','utf8'));
const key=readFileSync('/tmp/tr01b2d3-host-signing-key.pem','utf8');
const issued=[];
const endpoint=installation.endpoint;
const commonRefs={
 orderNo:'TR01B-SO-001',
 customerCounterpartyId:'cp-tr01b-customer',
 itemId:'item-tr01b',warehouseId:'wh-tr01b'
};
const ver=p=>({id:p.id,version:p.version});
async function business(kind,key){
 return db.selectFrom('business_data')
  .select(['id','payload']).where('enterprise_id','=',installation.evoEnterpriseId)
  .where('business_data_type','=',kind).where('business_object_key','=',key)
  .executeTakeFirstOrThrow();
}
async function digest(){
 const s=await db.selectFrom('enterprise_runtime_state')
  .select(['consistency_domain','next_posting_sequence'])
  .where('enterprise_id','=',installation.evoEnterpriseId).executeTakeFirstOrThrow();
 const boundary=BigInt(s.next_posting_sequence)-1n;
 return {
  boundary,
  economic:await computeEconomicRuntimeDigest(db,installation.evoEnterpriseId,s.consistency_domain,boundary),
  input:await computeReplayInputDigest(db,installation.evoEnterpriseId,s.consistency_domain,boundary)
 };
}
function hostContext(actorType='HUMAN'){
 return {
  contractVersion:'0.1.0',
  principal:{contractVersion:'0.1.0',subjectId:'host-authenticated-user',
    actorType,identityProviderId:'host-request-session',sessionId:'host-authenticated-session'},
  scope:{contractVersion:'0.1.0',enterpriseId:installation.hostEnterpriseId,
    userId:'host-authenticated-user'},
  context:{activeContext:{contractVersion:'0.1.0',kind:'ENTERPRISE',
    enterpriseId:installation.hostEnterpriseId,contextId:installation.contextId}},
  correlationId:'tr01b2d3-authenticated-service-transport'
 };
}
function request(intent,actorType='HUMAN'){
 return { requestContext:hostContext(actorType),
  contextId:installation.contextId,intent };
}
const authorization=[];
const networkClient=createTrustedRemoteFinanceOwnerPreflightV010({
 resolveInstallation:()=>installation,
 resolveSigningPrivateKey:()=>key,
 allowLoopbackHttpInTest:true,
 fetchImpl:async (url,init)=>{
  issued.push(JSON.parse(init.body).assertion);
  const response=await fetch(url,init);
  if (!response.ok) {
    const reason=await response.clone().json().catch(()=>({code:'OWNER_JSON_NOT_AVAILABLE'}));
    console.error('TR01B2D3_OWNER_REFUSAL_DIAGNOSTIC='+JSON.stringify({
      status:response.status,code:reason.code??'UNKNOWN'}));
  }
  return response;
 }
});
function preflight(denyResource='',owner=networkClient,bind=installation.evoEnterpriseId){
 return createTradingFinanceIntentPreflightV010({
  resolveAuthorizationProvider:()=>({
   providerId:'host-request-bound-per-resource',
   async check(query){
    authorization.push(query);
    return {contractVersion:'0.1.0',
      allowed:query.resource.type!==denyResource,
      policyProviderId:'host-request-bound-per-resource',reasonCodes:[]};
   }
  }),
  resolveEvoEnterpriseId:()=>bind,
  resolveOwnerPreflight:()=>owner
 });
}
async function expectDenied(intent,error,actor='HUMAN',pf=preflight()){
 await assert.rejects(pf.verify(request(intent,actor)),
  e=>e instanceof Error && e.message.includes(error));
}
try{
 const e=installation.evoEnterpriseId;
 const [order,shipment,cash,valuation,inventoryAllocation,
  settlementAllocation,shipmentRule,state]=await Promise.all([
  business('sales_order.approved',commonRefs.orderNo),
  business('sales_shipment.created','TR01B-SHIP-001'),
  business('cash.received','TR01B-CASH-001'),
  db.selectFrom('valuation_policy').select(['id','version'])
    .where('enterprise_id','=',e).where('code','=','inventory_fifo')
    .where('method','=','FIFO').where('status','=','ACTIVE')
    .where('version','=',1).executeTakeFirstOrThrow(),
  db.selectFrom('allocation_policy').select(['id','version'])
    .where('enterprise_id','=',e).where('code','=','inventory_fifo')
    .where('status','=','PUBLISHED').where('version','=',1).executeTakeFirstOrThrow(),
  db.selectFrom('allocation_policy').select(['id','version'])
    .where('enterprise_id','=',e).where('code','=','fx_settlement_explicit')
    .where('status','=','PUBLISHED').where('version','=',1).executeTakeFirstOrThrow(),
  db.selectFrom('valuation_rule').select(['id','version'])
    .where('enterprise_id','=',e).where('code','=','shipment-inventory-to-cogs')
    .where('status','=','PUBLISHED').where('version','=',1).executeTakeFirstOrThrow(),
  db.selectFrom('enterprise_runtime_state').select(['next_posting_sequence'])
    .where('enterprise_id','=',e).executeTakeFirstOrThrow()
 ]);
 const base={contractVersion:'0.1.0',...commonRefs,idempotencyKey:'b2d3-signed-transport'};
 const cost={
  ...base,kind:'COST_VALUATION',
  shipmentBusinessDataId:shipment.id,costMethod:'FIFO',
  valuationPolicy:ver(valuation),allocationPolicy:ver(inventoryAllocation),
  shipmentValuationRule:ver(shipmentRule),
  boundarySequence:String(BigInt(state.next_posting_sequence)-1n)
 };
 const alloc={
  ...base,kind:'CASH_ALLOCATION',
  sourceOrderBusinessDataId:order.id,
  consumerReceiptBusinessDataId:cash.id,
  amount:'1000.00',currency:'CNY',
  allocationPolicy:ver(settlementAllocation),settlementMode:'EXPLICIT_FULL'
 };
 const before=await digest();
 const costRowsBefore=await db.selectFrom('cost_run').select('id')
   .where('enterprise_id','=',e).execute();
 const allocRowsBefore=await db.selectFrom('allocation_instruction').select('id')
   .where('enterprise_id','=',e).execute();
 const human=await preflight().verify(request(cost));
 const ai=await preflight().verify(request(alloc,'AI'));
 assert.equal(human.executionAllowed,false);
 assert.equal(ai.executionAllowed,false);
 assert.equal(human.status,'OWNER_FACTS_VERIFIED_NO_EXECUTION');
 assert.equal(ai.status,'OWNER_FACTS_VERIFIED_NO_EXECUTION');
 assert.ok(authorization.some(x=>x.resource.id===shipment.id));
 assert.ok(authorization.some(x=>x.resource.id===cash.id));
 const preDeniedRequests=issued.length;
 await expectDenied(alloc,'TR01B2D_RESOURCE_AUTHORIZATION_DENIED','HUMAN',
  preflight('trading-reference.customer-receipt-business-data'));
 assert.equal(issued.length,preDeniedRequests,
  'Host rejected receipt never leaves trusted boundary');
 await expectDenied(cost,'TR01B2D3_OWNER_INSTALLATION_SCOPE_MISMATCH','HUMAN',
  preflight('',networkClient,'evo-not-bound'));
 assert.equal(issued.length,preDeniedRequests);
 // One-use assertion persists in PostgreSQL across instances.
 const assertion=issued[0];
 const replay=await fetch(endpoint,{method:'POST',
  headers:{'content-type':'application/json'},
  body:JSON.stringify({assertion})});
 assert.equal(replay.status,409);
 assert.equal((await replay.json()).code,'EVO_FINANCE_DELEGATION_REPLAY');
 // Caller-declared actor or enterprise without valid signature gets 401.
 const parts=assertion.split('.');
 const forged=parts.slice(0,2).join('.')+'.'+
   Buffer.alloc(64,3).toString('base64url');
 const bad=await fetch(endpoint,{method:'POST',
  headers:{'content-type':'application/json'},
  body:JSON.stringify({assertion:forged})});
 assert.equal(bad.status,401);
 assert.equal((await bad.json()).executionAllowed,false);
 const expiredClient=createTrustedRemoteFinanceOwnerPreflightV010({
  resolveInstallation:()=>installation,resolveSigningPrivateKey:()=>key,
  allowLoopbackHttpInTest:true,
  now:()=>Math.floor(Date.now()/1000)-1000
 });
 await expectDenied(cost,'TR01B2D3_OWNER_REMOTE_DENIED_401','HUMAN',
  preflight('',expiredClient));
 await expectDenied({...cost,itemId:'different-item'},'TR01B2D3_OWNER_REMOTE_DENIED_422');
 await expectDenied({...cost,valuationPolicy:{...cost.valuationPolicy,version:999}},
  'TR01B2D3_OWNER_REMOTE_DENIED_422');
 await expectDenied({...cost,boundarySequence:'1'},
  'TR01B2D3_OWNER_REMOTE_DENIED_422');
 await expectDenied({...alloc,consumerReceiptBusinessDataId:shipment.id},
  'TR01B2D3_OWNER_REMOTE_DENIED_422');
 const after=await digest();
 assert.deepEqual(after,before,'Read-only HTTP route cannot change canonical financial economics');
 assert.deepEqual(await db.selectFrom('cost_run').select('id')
  .where('enterprise_id','=',e).execute(),costRowsBefore);
 assert.deepEqual(await db.selectFrom('allocation_instruction').select('id')
  .where('enterprise_id','=',e).execute(),allocRowsBefore);
 console.log('TR01B2D3_HOST_EVO_SIGNED_HTTP_POSTGRESQL_PROOF='+JSON.stringify({
  status:'PASS',
  originalSalesOrderId:order.id,originalShipmentId:shipment.id,
  originalCashReceiptId:cash.id,realNetworkFastifyOwner:true,
  hostHumanAndAiPerResourceReadOnly:true,ed25519AuthenticatesHost:true,
  wrongTenantAndDeniedReceiptFailBeforeOwner:true,
  forgedReplayExpiredDelegationsRejected:true,
  wrongFactsPolicyAndBoundaryRejected:true,
  immutableFinancialDigestUnchanged:true,noCostOrAllocationWrites:true,
  executionAllowed:false,
  productionInstalledExperience:'NOT_CERTIFIED',
  actualProductSessionAndProviderInstall:'NOT_CERTIFIED'
 }));
}finally{await database.destroy();}
