#!/usr/bin/env node
/** No Host/EVO restart during Host active-signer key ID rollover. The keys
 * are pre-provisioned encrypted installation secrets, and only the PUBLIC
 * key IDs are changed in an operator-owned atomic file. No finance writes.
 */
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, renameSync, chmodSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { createEncryptedFileSecretStoreV010 } from '../dist/manager/secret-store.js';
import { createDatabase } from '../evo/dist/platform/database/src/index.js';
const dir='/tmp/tr01b2d3-host-product', pointer=dir+'/active-finance-key-id';
const env=JSON.parse(readFileSync(dir+'/private-host-env.json','utf8'));
const installation=JSON.parse(readFileSync('/tmp/tr01b2d3-host-install.json','utf8'));
const fixture=JSON.parse(readFileSync(dir+'/private-fixture.json','utf8'));
const dbh=createDatabase(process.env.DATABASE_URL),db=dbh.db;
const original=readFileSync('/tmp/tr01b2d3-evo-public-key.json','utf8');
const old=JSON.parse(original), ids=['tr01b2d3-host-online-key-3','tr01b2d3-host-online-key-4'];
let child,log=dir+'/host-key-pointer-rotation.log';
function operator(...args){
 const result=spawnSync(process.execPath,['dist/scripts/finance-trust-operator.js',...args],
  {cwd:'evo',env:process.env,encoding:'utf8'});
 if(result.status!==0)throw new Error('HOST_ROTATION_OPERATOR_FAILED:'+result.stderr.slice(-2500));
}
function installPointer(id){
 const tmp=pointer+'.new';
 writeFileSync(tmp,id+'\n',{mode:0o600});
 chmodSync(tmp,0o600);
 renameSync(tmp,pointer);
}
async function nonceCount(){
 const r=await db.selectFrom('finance_delegation_nonce')
 .select(({fn})=>fn.countAll().as('count')).executeTakeFirstOrThrow();
 return Number(r.count);
}
async function facts(){
 const e=installation.evoEnterpriseId;
 const [shipment,valuation,alloc,rule,state]=await Promise.all([
 db.selectFrom('business_data').select('id').where('enterprise_id','=',e)
 .where('business_data_type','=','sales_shipment.created')
 .where('business_object_key','=','TR01B-SHIP-001').executeTakeFirstOrThrow(),
 db.selectFrom('valuation_policy').select(['id','version']).where('enterprise_id','=',e)
 .where('code','=','inventory_fifo').where('status','=','ACTIVE')
 .where('version','=',1).executeTakeFirstOrThrow(),
 db.selectFrom('allocation_policy').select(['id','version']).where('enterprise_id','=',e)
 .where('code','=','inventory_fifo').where('status','=','PUBLISHED')
 .where('version','=',1).executeTakeFirstOrThrow(),
 db.selectFrom('valuation_rule').select(['id','version']).where('enterprise_id','=',e)
 .where('code','=','shipment-inventory-to-cogs').where('status','=','PUBLISHED')
 .where('version','=',1).executeTakeFirstOrThrow(),
 db.selectFrom('enterprise_runtime_state').select('next_posting_sequence')
 .where('enterprise_id','=',e).executeTakeFirstOrThrow()
 ]);
 const pin=x=>({id:x.id,version:x.version});
 return {contractVersion:'0.1.0',kind:'COST_VALUATION',orderNo:'TR01B-SO-001',
  customerCounterpartyId:'cp-tr01b-customer',itemId:'item-tr01b',
  warehouseId:'wh-tr01b',idempotencyKey:'ci-host-hot-key-pointer',
  shipmentBusinessDataId:shipment.id,costMethod:'FIFO',
  valuationPolicy:pin(valuation),allocationPolicy:pin(alloc),
  shipmentValuationRule:pin(rule),
  boundarySequence:String(BigInt(state.next_posting_sequence)-1n)};
}
async function run(intent,positive,label){
 const count=await nonceCount();
 const response=await fetch('http://localhost:4100/api/v1/trading-finance/readonly-owner-verify',{
  method:'POST',headers:{'content-type':'application/json',
   'x-evo-context-id':fixture.contextId,
   authorization:'Bearer '+fixture.tokens.human},
  body:JSON.stringify({intent}),signal:AbortSignal.timeout(8000)
 });
 const body=await response.json();
 assert.equal(response.status,positive?200:403,label+':'+JSON.stringify(body));
 assert.equal(body.executionAllowed,false,label);
 assert.equal(await nonceCount(),count+(positive?1:0),label+': nonce invariant');
}
try {
 const secrets=createEncryptedFileSecretStoreV010(dir+'/secrets.enc.json',dir+'/secrets.master.key');
 for(const keyId of ids){
  const kp=generateKeyPairSync('ed25519');
  const ref={contractVersion:'0.1.0',namespace:'evo-trading-finance-owner',
   key:'host-ed25519-signing-pkcs8:'+keyId,
   scope:'INSTALLATION',scopeId:installation.installationId};
  secrets.put(ref,kp.privateKey.export({format:'pem',type:'pkcs8'}).toString());
  const file=dir+'/public-'+keyId+'.json';
  writeFileSync(file,JSON.stringify({...old,keyId,
   publicKeyPem:kp.publicKey.export({format:'pem',type:'spki'}).toString()}),{mode:0o600});
  operator('grant',file,'ci-host-signing-operator','CI-HOST-PREPROVISION-'+keyId);
 }
 installPointer(ids[0]);
 const fd=openSync(log,'w',0o600);
 child=spawn(process.execPath,['dist/manager/server.js'],{
  env:{...process.env,...env,
   APP_PLATFORM_FINANCE_OWNER_ACTIVE_KEY_ID_FILE:pointer,
   APP_PLATFORM_FINANCE_OWNER_CI_LOOPBACK_HTTP:'true'},
  stdio:['ignore',fd,fd]
 });
 closeSync(fd);
 let ready=false;
 for(let i=0;i<70;i++){
  if(child.exitCode!==null)throw new Error('HOST_KEY_POINTER_START_FAILED:'+readFileSync(log,'utf8').slice(-5000));
  try{let r=await fetch('http://localhost:4100/login',{signal:AbortSignal.timeout(900)});
   if(r.status===200){ready=true;break;}}catch{}
  await sleep(300);
 }
 assert.equal(ready,true,'Host readiness');
 const intent=await facts();
 await run(intent,true,'initial preprovisioned key');
 installPointer(ids[1]);
 await run(intent,true,'second key without Host restart');
 operator('revoke',old.issuer,old.installationId,ids[0],
  'ci-host-signing-operator','CI-HOST-REVOKE-FIRST');
 installPointer(ids[0]);
 await run(intent,false,'revoked first key must fail closed');
 installPointer(ids[1]);
 await run(intent,true,'recovered second key no restart');
 // Filesystem attacks on operator pointer MUST fail closed before signing.
 chmodSync(pointer,0o644);
 await run(intent,false,'world readable pointer rejected');
 chmodSync(pointer,0o600);
 unlinkSync(pointer);
 await run(intent,false,'missing pointer cannot revert to startup signer');
 installPointer(ids[1]);
 await run(intent,true,'restored valid pointer');
 operator('revoke',old.issuer,old.installationId,ids[1],
  'ci-host-signing-operator','CI-HOST-REVOKE-SECOND');
 await run(intent,false,'new key revoked by EVO while Host stays online');
 assert.equal(child.exitCode,null,'Host process continuously running');
 console.log('TR01B2D3_HOST_NO_RESTART_SIGNING_KEY_ROTATION_PROOF='+JSON.stringify({
  status:'PASS',hostStayedAlive:true,evoStayedAlive:true,
  twoPreProvisionedEncryptedKeyIdScopedPrivateKeys:true,
  operatorAtomicPointerSwitch:true,noFallbackOnInvalidPointer:true,
  oldAndNewSignerRevocationEffective:true,
  noNonceOnDeniedCalls:true,executionAllowed:false,
  productionHostChangeApproval:'NOT_CERTIFIED'
 }));
}catch(e){
 console.error('TR01B2D3_HOST_ROTATION_FAILED',e);
 console.error(readFileSync(log,'utf8').slice(-6000));
 process.exitCode=1;
}finally{
 if(child && child.exitCode===null){
  child.kill('SIGTERM');
  await Promise.race([new Promise(resolve=>child.once('exit',resolve)),sleep(6000)]);
  if(child.exitCode===null)child.kill('SIGKILL');
 }
 await dbh.destroy();
}
