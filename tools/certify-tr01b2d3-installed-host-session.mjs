#!/usr/bin/env node
/** Run against a LIVE App Platform HTTP process using Host-issued persisted
 * Managed Sessions, installed Provider and AES-GCM Host Secrets. EVO remains
 * an independently serving Fastify process with real PostgreSQL facts.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDatabase } from '../evo/dist/platform/database/src/index.js';
import { computeEconomicRuntimeDigest, computeReplayInputDigest } from
  '../evo/dist/modules/replay/infrastructure/postgres-replay-digest.js';
const fixture=JSON.parse(readFileSync('/tmp/tr01b2d3-host-product/private-fixture.json','utf8'));
const mode=process.argv[2]??'active';
const base='http://localhost:4100';
const path='/api/v1/trading-finance/readonly-owner-verify';
const database=createDatabase(process.env.DATABASE_URL);
const db=database.db;
const ent=fixture.evoEnterpriseId;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function post(intent,token,options={}){
 const headers={
  'content-type':'application/json',
  origin:base,
  ...(token?{authorization:'Bearer '+token}:{}),
  ...(!options.noContext?{'x-evo-context-id':options.contextId??fixture.contextId}:{})
 };
 const response=await fetch(base+path,{method:'POST',headers,
  body:JSON.stringify(options.body??{intent}),signal:AbortSignal.timeout(7000)});
 return {status:response.status,result:await response.json()};
}
async function selectBusiness(type,key){
 return db.selectFrom('business_data').select('id')
  .where('enterprise_id','=',ent).where('business_data_type','=',type)
  .where('business_object_key','=',key).executeTakeFirstOrThrow();
}
async function digest(){
 const state=await db.selectFrom('enterprise_runtime_state')
  .select(['consistency_domain','next_posting_sequence'])
  .where('enterprise_id','=',ent).executeTakeFirstOrThrow();
 const boundary=BigInt(state.next_posting_sequence)-1n;
 return {
  economic:await computeEconomicRuntimeDigest(db,ent,state.consistency_domain,boundary),
  input:await computeReplayInputDigest(db,ent,state.consistency_domain,boundary)
 };
}
async function rowCount(table){
 const row=await db.selectFrom(table).select(({fn})=>fn.countAll().as('count'))
  .where('enterprise_id','=',ent).executeTakeFirstOrThrow();
 return Number(row.count);
}
async function nonceCount(){
 const result=await db.selectFrom('finance_delegation_nonce')
  .select(({fn})=>fn.countAll().as('count')).executeTakeFirstOrThrow();
 return Number(result.count);
}
function expectFailure(actual,code,status){
 assert.equal(actual.status,status,JSON.stringify(actual));
 assert.equal(actual.result.code,code,JSON.stringify(actual));
 assert.equal(actual.result.executionAllowed,false);
}
try {
 const common={
  contractVersion:'0.1.0',
  orderNo:'TR01B-SO-001',customerCounterpartyId:'cp-tr01b-customer',
  itemId:'item-tr01b',warehouseId:'wh-tr01b',
  idempotencyKey:'tr01b2d3-real-host-product-http'
 };
 const [order,shipment,cash,valuation,inventoryAllocation,settlementAllocation,
   shipmentRule,runtimeState]=await Promise.all([
  selectBusiness('sales_order.approved',common.orderNo),
  selectBusiness('sales_shipment.created','TR01B-SHIP-001'),
  selectBusiness('cash.received','TR01B-CASH-001'),
  db.selectFrom('valuation_policy').select(['id','version'])
   .where('enterprise_id','=',ent).where('code','=','inventory_fifo')
   .where('status','=','ACTIVE').where('version','=',1).executeTakeFirstOrThrow(),
  db.selectFrom('allocation_policy').select(['id','version'])
   .where('enterprise_id','=',ent).where('code','=','inventory_fifo')
   .where('status','=','PUBLISHED').where('version','=',1).executeTakeFirstOrThrow(),
  db.selectFrom('allocation_policy').select(['id','version'])
   .where('enterprise_id','=',ent).where('code','=','fx_settlement_explicit')
   .where('status','=','PUBLISHED').where('version','=',1).executeTakeFirstOrThrow(),
  db.selectFrom('valuation_rule').select(['id','version'])
   .where('enterprise_id','=',ent).where('code','=','shipment-inventory-to-cogs')
   .where('status','=','PUBLISHED').where('version','=',1).executeTakeFirstOrThrow(),
  db.selectFrom('enterprise_runtime_state').select(['next_posting_sequence'])
   .where('enterprise_id','=',ent).executeTakeFirstOrThrow()
 ]);
 const pin=v=>({id:v.id,version:v.version});
 const cost={...common,kind:'COST_VALUATION',
  shipmentBusinessDataId:shipment.id,costMethod:'FIFO',
  valuationPolicy:pin(valuation),allocationPolicy:pin(inventoryAllocation),
  shipmentValuationRule:pin(shipmentRule),
  boundarySequence:String(BigInt(runtimeState.next_posting_sequence)-1n)
 };
 const cashIntent={...common,kind:'CASH_ALLOCATION',
  sourceOrderBusinessDataId:order.id,consumerReceiptBusinessDataId:cash.id,
  amount:'1000.00',currency:'CNY',allocationPolicy:pin(settlementAllocation),
  settlementMode:'EXPLICIT_FULL'
 };
 const before={digest:await digest(),costs:await rowCount('cost_run'),
  allocations:await rowCount('allocation_instruction'),nonces:await nonceCount()};
 const tokens=fixture.tokens;
 if(mode==='active'){
  const human=await post(cost,tokens.human);
  const ai=await post(cashIntent,tokens.ai);
  assert.equal(human.status,200,JSON.stringify(human));
  assert.equal(ai.status,200,JSON.stringify(ai));
  for(const x of [human,ai]){
   assert.equal(x.result.status,'OWNER_FACTS_VERIFIED_NO_EXECUTION');
   assert.equal(x.result.executionAllowed,false);
  }
  assert.equal(await nonceCount(),before.nonces+2);
  expectFailure(await post(cost,undefined),
    'TR01B2D3_REQUEST_BOUND_SESSION_PROVIDER_REQUIRED',401);
  // The session provider is installed; missing bearer fails on resolution.
  expectFailure(await post(cost,'forged-token'),
    'REQUEST_IDENTITY_SESSION_REQUIRED',401);
  expectFailure(await post(cost,tokens.revoked),
    'REQUEST_IDENTITY_SESSION_REQUIRED',401);
  await delay(15);
  expectFailure(await post(cost,tokens.expired),
    'REQUEST_IDENTITY_SESSION_REQUIRED',401);
  expectFailure(await post(cost,tokens.ungranted),
    'CONTEXT_NOT_AVAILABLE',403);
  expectFailure(await post(cost,tokens.denied),
    'TR01B2D_RESOURCE_AUTHORIZATION_DENIED',403);
  expectFailure(await post(cost,tokens.human,{contextId:'other-enterprise-context'}),
    'CONTEXT_NOT_AVAILABLE',403);
  expectFailure(await post(cost,tokens.human,{body:{
   intent:cost,actorSubjectId:'another-privileged-user',evoEnterpriseId:ent
  }}),'TR01B2D3_INTENT_REQUEST_INVALID',403);
  expectFailure(await post({...cost,customerCounterpartyId:'forged-other-tenant'},tokens.human),
    'TR01B2D3_OWNER_REMOTE_DENIED_422',403);
  assert.equal(await nonceCount(),before.nonces+3,
    'only two real successes and one owner fact refusal consume nonce');
 }else if(mode==='disabled'){
  expectFailure(await post(cost,tokens.human),
   'TR01B2D_OWNER_PLUGIN_NOT_ADMITTED',403);
  assert.equal(await nonceCount(),before.nonces);
 }else if(mode==='missing-key'){
  expectFailure(await post(cost,tokens.human),
   'SECRET_NOT_FOUND',403);
  assert.equal(await nonceCount(),before.nonces);
 }else throw new Error('TR01B2D3_UNKNOWN_TEST_MODE');
 assert.deepEqual(await digest(),before.digest);
 assert.equal(await rowCount('cost_run'),before.costs);
 assert.equal(await rowCount('allocation_instruction'),before.allocations);
 console.log('TR01B2D3_INSTALLED_HOST_MANAGED_SESSION_POSTGRESQL_PROOF='+JSON.stringify({
  status:'PASS',mode,
  realProductHostHttp:true,
  hostManagedSessionServiceRealCredentials:true,
  serviceOwnedIssuerAuthentication:true,
  realEncryptedSecretStore:true,
  originalAppSalesShipmentCashFacts:true,
  noUntrustedSubjectOrTenantAccepted:true,
  revokedExpiredForgedAndUngrantedSessionRejected:mode==='active',
  installedProviderLifecycleFailClosed:mode==='disabled',
  missingEncryptedPrivateKeyFailClosed:mode==='missing-key',
  financeFactsAndDigestsUnchanged:true,executionAllowed:false,
  externalOidcLiveLogin:'NOT_CERTIFIED',
  productionTlsRotation:'NOT_CERTIFIED'
 }));
}finally{
 await database.destroy();
}
