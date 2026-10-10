#!/usr/bin/env node
/**
 * B2D3 TLS phase: CI-only real HTTPS trust/hostname validation from the
 * actual Host process to a local TLS ingress proxy serving the real EVO API.
 * Does not claim production certificate, public ingress, or service mTLS.
 */
import assert from 'node:assert/strict';
import { createServer as httpsServer } from 'node:https';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync,readFileSync,openSync,closeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { createDatabase } from '../evo/dist/platform/database/src/index.js';
import { createEncryptedFileSecretStoreV010 } from '../dist/manager/secret-store.js';

const dir='/tmp/tr01b2d3-host-product';
const certDir=mkdtempSync(join(tmpdir(),'tr01b2d3-tls-'));
const key=join(certDir,'server.key'),cert=join(certDir,'server.crt');
execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes',
 '-keyout',key,'-out',cert,'-days','1','-subj','/CN=localhost',
 '-addext','subjectAltName=DNS:localhost'],{stdio:'ignore'});
const installation=JSON.parse(readFileSync('/tmp/tr01b2d3-host-install.json','utf8'));
const fixture=JSON.parse(readFileSync(dir+'/private-fixture.json','utf8'));
const baseEnv=JSON.parse(readFileSync(dir+'/private-host-env.json','utf8'));
const database=createDatabase(process.env.DATABASE_URL),db=database.db;
const tls=httpsServer({key:readFileSync(key),cert:readFileSync(cert)},async(req,res)=>{
 try{
  if(req.url!=='/api/v1/plugins/trading-finance/readonly-verifications'||
     req.method!=='POST'){res.statusCode=404;return res.end();}
  let data='';for await(const c of req)data+=c.toString();
  const upstream=await fetch('http://127.0.0.1:3000'+req.url,{
    method:'POST',headers:{'content-type':'application/json'},body:data,
    signal:AbortSignal.timeout(5000)});
  res.statusCode=upstream.status;
  res.setHeader('content-type','application/json');
  return res.end(await upstream.text());
 }catch(e){res.statusCode=502;res.end('Upstream unavailable');}
});
await new Promise((resolve,reject)=>{tls.once('error',reject);tls.listen(3443,resolve);});
let attempts=0,success=0,rejected=0;
async function countNonce(){
 const r=await db.selectFrom('finance_delegation_nonce')
  .select(({fn})=>fn.countAll().as('count')).executeTakeFirstOrThrow();
 return Number(r.count);
}
async function intent(){
 const ent=installation.evoEnterpriseId;
 const [shipment,val,alloc,rule,rt]=await Promise.all([
 db.selectFrom('business_data').select('id').where('enterprise_id','=',ent)
 .where('business_data_type','=','sales_shipment.created')
 .where('business_object_key','=','TR01B-SHIP-001').executeTakeFirstOrThrow(),
 db.selectFrom('valuation_policy').select(['id','version']).where('enterprise_id','=',ent)
 .where('code','=','inventory_fifo').where('status','=','ACTIVE').where('version','=',1).executeTakeFirstOrThrow(),
 db.selectFrom('allocation_policy').select(['id','version']).where('enterprise_id','=',ent)
 .where('code','=','inventory_fifo').where('status','=','PUBLISHED').where('version','=',1).executeTakeFirstOrThrow(),
 db.selectFrom('valuation_rule').select(['id','version']).where('enterprise_id','=',ent)
 .where('code','=','shipment-inventory-to-cogs').where('status','=','PUBLISHED')
 .where('version','=',1).executeTakeFirstOrThrow(),
 db.selectFrom('enterprise_runtime_state').select('next_posting_sequence')
 .where('enterprise_id','=',ent).executeTakeFirstOrThrow()
 ]);
 const pin=x=>({id:x.id,version:x.version});
 return {contractVersion:'0.1.0',kind:'COST_VALUATION',orderNo:'TR01B-SO-001',
  customerCounterpartyId:'cp-tr01b-customer',itemId:'item-tr01b',
  warehouseId:'wh-tr01b',idempotencyKey:'tls-tr01b2d3-ci',
  shipmentBusinessDataId:shipment.id,costMethod:'FIFO',
  valuationPolicy:pin(val),allocationPolicy:pin(alloc),
  shipmentValuationRule:pin(rule),
  boundarySequence:String(BigInt(rt.next_posting_sequence)-1n)};
}
async function runCase(label,endpoint,trust,positive,theIntent){
 attempts++;
 const env={...baseEnv,
  APP_PLATFORM_FINANCE_OWNER_INSTALLATION_JSON:JSON.stringify({
    installationId:installation.installationId,issuer:installation.issuer,
    keyId:installation.keyId,hostEnterpriseId:installation.hostEnterpriseId,
    contextId:installation.contextId,evoEnterpriseId:installation.evoEnterpriseId,
    endpoint,active:true
  }),APP_PLATFORM_FINANCE_OWNER_CI_LOOPBACK_HTTP:'false'};
 if(trust)env.NODE_EXTRA_CA_CERTS=cert;
 else delete env.NODE_EXTRA_CA_CERTS;
 const log=join(certDir,label+'.log'),fd=openSync(log,'w',0o600);
 const child=spawn(process.execPath,['dist/manager/server.js'],{
  env:{...process.env,...env},stdio:['ignore',fd,fd]});
 closeSync(fd);
 try{
  let ready=false;
  for(let i=0;i<60;i++){
   if(child.exitCode!==null)throw new Error(label+': host startup failed '+readFileSync(log,'utf8').slice(-7000));
   try{
    const v=await fetch('http://localhost:4100/login',{signal:AbortSignal.timeout(1000)});
    if(v.status===200){ready=true;break;}
   }catch{}
   await sleep(300);
  }
  assert.ok(ready,'TLS trial Host readiness '+label);
  const before=await countNonce();
  const response=await fetch('http://localhost:4100/api/v1/trading-finance/readonly-owner-verify',{
   method:'POST',headers:{authorization:'Bearer '+fixture.tokens.human,
    'content-type':'application/json',
    'x-evo-context-id':fixture.contextId},body:JSON.stringify({intent:theIntent}),
   signal:AbortSignal.timeout(8000)});
  const result=await response.json();
  if(positive){
   assert.equal(response.status,200,JSON.stringify({label,result}));
   assert.equal(result.executionAllowed,false);
   assert.equal(result.status,'OWNER_FACTS_VERIFIED_NO_EXECUTION');
   assert.equal(await countNonce(),before+1);
   success++;
  }else{
   assert.equal(response.status,403,JSON.stringify({label,result}));
   assert.equal(result.executionAllowed,false);
   assert.equal(await countNonce(),before,'TLS handshake refusal should not reach the EVO verification route');
   rejected++;
  }
 }finally{
  child.kill('SIGTERM');
  await Promise.race([new Promise(resolve=>child.once('exit',resolve)),sleep(5000)]);
  if(child.exitCode===null)child.kill('SIGKILL');
  // Ensure prior listening port is gone before next process.
  for(let i=0;i<30;i++){
    try{await fetch('http://localhost:4100/login',{signal:AbortSignal.timeout(500)});}
    catch{break;}
    await sleep(100);
  }
 }
}
try{
 // Earlier installed-key tests include a missing-secret phase. Restore
 // the ORIGINAL approved signing key before TLS tests; no new trust grants.
 const sec=createEncryptedFileSecretStoreV010(dir+'/secrets.enc.json',
  dir+'/secrets.master.key');
 sec.put({contractVersion:'0.1.0',namespace:'evo-trading-finance-owner',
  key:'host-ed25519-signing-pkcs8',scope:'INSTALLATION',
  scopeId:installation.installationId},
 readFileSync('/tmp/tr01b2d3-host-signing-key.pem','utf8'));
 const value=await intent();
 const path='/api/v1/plugins/trading-finance/readonly-verifications';
 await runCase('valid-local-ca','https://localhost:3443'+path,true,true,value);
 await runCase('bad-hostname','https://127.0.0.1:3443'+path,true,false,value);
 await runCase('untrusted-ca','https://localhost:3443'+path,false,false,value);
 console.log('TR01B2D3_HOST_HTTPS_TLS_IDENTITY_PROOF='+JSON.stringify({
  status:'PASS',realTlsHandshake:true,certificateValidated:true,
  hostnameMismatchDenied:true,untrustedRootDenied:true,
  originalEvoFinanceOverTlsIngress:true,
  positiveCases:success,negativeCases:rejected,
  noOwnerNonceForFailedTls:true,executionAllowed:false,
  productionPublicIngress:'NOT_CERTIFIED',serviceMtls:'NOT_CERTIFIED',
  productionCertificateRotation:'NOT_CERTIFIED'
 }));
}catch(e){
 console.error('TR01B2D3_TLS_CI_FAILED',e);
 process.exitCode=1;
}finally{
 await new Promise(resolve=>tls.close(resolve));
 await database.destroy();
}
