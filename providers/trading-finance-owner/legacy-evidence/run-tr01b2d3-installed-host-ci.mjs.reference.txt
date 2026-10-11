#!/usr/bin/env node
/** Drive LIVE Host HTTP process through enabled -> disabled -> missing-key.
 * Original EVO process, worker and PostgreSQL are already running via CI.
 */
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, openSync, closeSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { createFileLifecycleStore } from '../dist/manager/store.js';
import { createEncryptedFileSecretStoreV010 } from '../dist/manager/secret-store.js';
import { TRADING_FINANCE_OWNER_FEATURE_ID_V010 } from
  '../dist/providers/trading-finance-owner/package.js';
const dir='/tmp/tr01b2d3-host-product';
const hostEnv=JSON.parse(readFileSync(dir+'/private-host-env.json','utf8'));
const store=createFileLifecycleStore(dir+'/state.json');
const expectedFeature=store.getActiveFeature(TRADING_FINANCE_OWNER_FEATURE_ID_V010);
if(!expectedFeature)throw new Error('TR01B2D3_FINANCE_OWNER_NOT_INSTALLED_AT_START');
let phase=0;
async function launchHost(){
 const path=dir+'/host-'+phase+'.log';
 const fd=openSync(path,'w',0o600);
 const child=spawn(process.execPath,['dist/manager/server.js'],{
  env:{...process.env,...hostEnv},stdio:['ignore',fd,fd]
 });
 closeSync(fd);
 for(let attempt=0;attempt<65;attempt++){
  if(child.exitCode!==null)throw new Error('TR01B2D3_HOST_STARTUP_FAILED:'+readFileSync(path,'utf8').slice(-10000));
  try{
   const ready=await fetch('http://localhost:4100/login',{signal:AbortSignal.timeout(1000)});
   if(ready.status>=200&&ready.status<500)return child;
  }catch{}
  await sleep(400);
 }
 child.kill('SIGTERM');
 throw new Error('TR01B2D3_HOST_TIMEOUT:'+readFileSync(path,'utf8').slice(-10000));
}
async function haltHost(child){
 if(child.exitCode!==null)return;
 child.kill('SIGTERM');
 await Promise.race([new Promise(r=>child.once('exit',r)),sleep(9000)]);
 if(child.exitCode===null)child.kill('SIGKILL');
 for(let i=0;i<30;i++){
  try{await fetch('http://localhost:4100/login',{signal:AbortSignal.timeout(1000)});}
  catch{return;}
  await sleep(100);
 }
 throw new Error('TR01B2D3_HOST_PORT_STILL_ACTIVE');
}
async function certify(mode){
 let child;
 try {
  child=await launchHost();
  const proof=spawn(process.execPath,['tools/certify-tr01b2d3-installed-host-session.mjs',mode],{
   env:process.env,stdio:['ignore','pipe','pipe']
  });
  let stdout='',stderr='';
  proof.stdout.on('data',b=>{stdout+=b.toString();});
  proof.stderr.on('data',b=>{stderr+=b.toString();});
  const code=await new Promise((res,rej)=>{
   proof.once('error',rej);
   proof.once('exit',res);
  });
  if(code!==0)throw new Error('TR01B2D3_'+mode+'_FAILED:'+stderr.slice(-16000)+stdout.slice(-6000)+
   '\nHOST_LOG:'+readFileSync(dir+'/host-'+phase+'.log','utf8').slice(-16000));
  if(!stdout.includes('TR01B2D3_INSTALLED_HOST_MANAGED_SESSION_POSTGRESQL_PROOF=')
   ||!stdout.includes('"status":"PASS"'))throw new Error('TR01B2D3_PROOF_MARKER_MISSING');
  process.stdout.write(stdout);
 }finally{
  if(child)await haltHost(child);
 }
}
await certify('active');
phase++;
// Installer lifecycle is authoritative, not a stale runtime stub.
store.deleteActiveFeature(TRADING_FINANCE_OWNER_FEATURE_ID_V010);
await certify('disabled');
phase++;
store.saveActiveFeature(expectedFeature);
// Host AES-GCM secret removal must fail closed even with service installed.
const secrets=createEncryptedFileSecretStoreV010(dir+'/secrets.enc.json',dir+'/secrets.master.key');
secrets.remove({contractVersion:'0.1.0',namespace:'evo-trading-finance-owner',
 key:'host-ed25519-signing-pkcs8',scope:'INSTALLATION',
 scopeId:JSON.parse(readFileSync('/tmp/tr01b2d3-host-install.json','utf8')).installationId});
await certify('missing-key');
console.log('TR01B2D3_HOST_PRODUCT_ALL_THREE_PHASES=PASS');
