#!/usr/bin/env node
/**
 * B2D3: full external-style OIDC Authorization Code + PKCE + RS256 ID Token
 * over actual local HTTP IdP -> live Host auth/login/callback -> Host cookie
 * -> live EVO read-only owner. CI issuer is ephemeral and explicitly LOCAL;
 * this is not evidence of Google credentials or a deployed OIDC tenant.
 */
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, openSync, closeSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { createDatabase } from '../evo/dist/platform/database/src/index.js';
import { createFileSettingsStore } from '../dist/manager/settings-store.js';
import { createEncryptedFileSecretStoreV010 } from '../dist/manager/secret-store.js';
import { GENERIC_OIDC_PACKAGE_ID } from '../dist/providers/oidc/package.js';

const dir='/tmp/tr01b2d3-host-product';
const issuer='http://localhost:4400', host='http://localhost:4100';
const clientId='tr01b2d3-ci-oidc-client';
const idpSubject='finance-ci-oidc-human';
const subjectId='oidc:'+createHash('sha256').update(issuer).digest('base64url').slice(0,16)+':'+idpSubject;
const fixture=JSON.parse(readFileSync(dir+'/private-fixture.json','utf8'));
const installation=JSON.parse(readFileSync('/tmp/tr01b2d3-host-install.json','utf8'));
const hostEnv=JSON.parse(readFileSync(dir+'/private-host-env.json','utf8'));
const settings=createFileSettingsStore(dir+'/settings.json');
settings.setNamespace(GENERIC_OIDC_PACKAGE_ID,{issuer,clientId,scopes:'openid profile email'});
const policy=JSON.parse(hostEnv.APP_PLATFORM_AUTHORIZATION_POLICY_JSON);
policy.rules[0].subjectIds.push(subjectId);
hostEnv.APP_PLATFORM_AUTHORIZATION_POLICY_JSON=JSON.stringify(policy);
const grants=JSON.parse(hostEnv.APP_PLATFORM_ENTERPRISE_CONTEXT_GRANTS_JSON);
grants.grants.push({grantId:'tr01b2d3-oidc-verified-human',subjectId,contextId:installation.contextId});
hostEnv.APP_PLATFORM_ENTERPRISE_CONTEXT_GRANTS_JSON=JSON.stringify(grants);
const secrets=createEncryptedFileSecretStoreV010(dir+'/secrets.enc.json',dir+'/secrets.master.key');
secrets.put({contractVersion:'0.1.0',namespace:'evo-trading-finance-owner',
 key:'host-ed25519-signing-pkcs8',scope:'INSTALLATION',scopeId:installation.installationId},
 readFileSync('/tmp/tr01b2d3-host-signing-key.pem','utf8'));

const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const kid='tr01b2d3-ci-rsa-key',jwk=publicKey.export({format:'jwk'});
const pending=new Map();
let badNextNonce=false, pkceValidated=0, signedIdTokens=0;
const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
function jwt(claims){
 const head=encode({alg:'RS256',typ:'JWT',kid});
 const payload=encode(claims);
 const source=head+'.'+payload;
 return source+'.'+sign('RSA-SHA256',Buffer.from(source),privateKey).toString('base64url');
}
async function body(req){
 let raw='';for await(const part of req)raw+=part.toString();
 return new URLSearchParams(raw);
}
const idp=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url||'/',issuer);
  res.setHeader('cache-control','no-store');
  if(u.pathname==='/.well-known/openid-configuration'){
   res.setHeader('content-type','application/json');
   return res.end(JSON.stringify({issuer,authorization_endpoint:issuer+'/authorize',
    token_endpoint:issuer+'/token',jwks_uri:issuer+'/jwks',
    response_types_supported:['code'],code_challenge_methods_supported:['S256'],
    token_endpoint_auth_methods_supported:['none']}));
  }
  if(u.pathname==='/jwks'){
   res.setHeader('content-type','application/json');
   return res.end(JSON.stringify({keys:[{...jwk,kid,alg:'RS256',use:'sig'}]}));
  }
  if(u.pathname==='/authorize'){
   assert.equal(u.searchParams.get('response_type'),'code');
   assert.equal(u.searchParams.get('client_id'),clientId);
   assert.equal(u.searchParams.get('code_challenge_method'),'S256');
   assert.ok(u.searchParams.get('scope').split(' ').includes('openid'));
   const state=u.searchParams.get('state'),nonce=u.searchParams.get('nonce');
   const challenge=u.searchParams.get('code_challenge');
   const redirect=u.searchParams.get('redirect_uri');
   assert.ok(state&&nonce&&challenge);
   assert.equal(redirect,host+'/auth/callback');
   const code=randomUUID();
   pending.set(code,{state,nonce,challenge,redirect});
   res.statusCode=302;res.setHeader('location',redirect+'?code='+code+'&state='+state);
   return res.end();
  }
  if(u.pathname==='/token'&&req.method==='POST'){
   const form=await body(req);
   const code=form.get('code'),transaction=pending.get(code);
   pending.delete(code);
   assert.ok(transaction,'one-use authorization code');
   assert.equal(form.get('grant_type'),'authorization_code');
   assert.equal(form.get('client_id'),clientId);
   assert.equal(form.get('redirect_uri'),transaction.redirect);
   const verifier=form.get('code_verifier');
   assert.ok(verifier);
   assert.equal(createHash('sha256').update(verifier).digest('base64url'),transaction.challenge);
   pkceValidated++;
   const now=Math.floor(Date.now()/1000);
   const bad=badNextNonce;badNextNonce=false;
   const token=jwt({iss:issuer,sub:idpSubject,aud:clientId,iat:now,exp:now+300,
    nonce:bad?'ci-deliberately-incorrect-nonce':transaction.nonce,
    name:'CI External OIDC Human',email_verified:true});
   signedIdTokens++;
   res.setHeader('content-type','application/json');
   return res.end(JSON.stringify({access_token:'ci-not-shared',token_type:'Bearer',
    expires_in:300,id_token:token}));
  }
  res.statusCode=404;return res.end();
 }catch(e){
  res.statusCode=400;return res.end('CI IdP denied request '+(e instanceof Error?e.message:String(e)));
 }
});
await new Promise((resolve,reject)=>{
 idp.once('error',reject);idp.listen(4400,'127.0.0.1',resolve);
});
const database=createDatabase(process.env.DATABASE_URL),db=database.db;
let child;
async function request(path,opts={}){
 return fetch(host+path,{redirect:'manual',signal:AbortSignal.timeout(7000),...opts});
}
async function login(){
 const start=await request('/auth/login?returnTo=%2F');
 assert.equal(start.status,302);
 const redirect=start.headers.get('location');
 assert.ok(redirect?.startsWith(issuer+'/authorize?'));
 const auth=await fetch(redirect,{redirect:'manual'});
 assert.equal(auth.status,302);
 const callback=new URL(auth.headers.get('location'));
 assert.equal(callback.origin,host);
 const finish=await request(callback.pathname+callback.search);
 return {finish,callback};
}
async function resolveIntent(){
 const ent=installation.evoEnterpriseId;
 const [shipment,valuation,allocation,rule,state]=await Promise.all([
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
 return {contractVersion:'0.1.0',kind:'COST_VALUATION',
  orderNo:'TR01B-SO-001',customerCounterpartyId:'cp-tr01b-customer',
  itemId:'item-tr01b',warehouseId:'wh-tr01b',idempotencyKey:'ci-real-oidc-to-finance',
  shipmentBusinessDataId:shipment.id,costMethod:'FIFO',
  valuationPolicy:pin(valuation),allocationPolicy:pin(allocation),
  shipmentValuationRule:pin(rule),boundarySequence:String(BigInt(state.next_posting_sequence)-1n)};
}
try{
 const logfile=dir+'/oidc-host.log',fd=openSync(logfile,'w',0o600);
 child=spawn(process.execPath,['dist/manager/server.js'],{
  env:{...process.env,...hostEnv},stdio:['ignore',fd,fd]});
 closeSync(fd);
 let ready=false;
 for(let n=0;n<65;n++){
  if(child.exitCode!==null)throw new Error('CI_HOST_START_FAILED:'+readFileSync(logfile,'utf8').slice(-9000));
  try{const r=await request('/login');if(r.status===200){ready=true;break;}}catch{}
  await sleep(300);
 }
 if(!ready)throw new Error('CI_HOST_START_TIMEOUT:'+readFileSync(logfile,'utf8').slice(-9000));

 // Real IdP flow, not a directly-created Principal, yields an actual Host cookie.
 const {finish,callback}=await login();
 assert.equal(finish.status,303,'OIDC real callback must issue a Host cookie');
 const setCookie=finish.headers.get('set-cookie');
 assert.match(setCookie,/^__Host-evo_session=/);
 assert.match(setCookie,/HttpOnly/);
 const cookie=setCookie.split(';')[0];
 const current=await request('/auth/session',{headers:{cookie}});
 assert.equal(current.status,200);
 const session=await current.json();
 assert.equal(session.principal.subjectId,subjectId);
 assert.equal(session.principal.identityProviderId,'generic.oidc');
 assert.equal(session.principal.actorType,'HUMAN');
 const intent=await resolveIntent();
 const headers={cookie,origin:host,'content-type':'application/json',
  'x-evo-context-id':fixture.contextId};
 const finance=await request('/api/v1/trading-finance/readonly-owner-verify',{
  method:'POST',headers,body:JSON.stringify({intent})});
 const accepted=await finance.json();
 assert.equal(finance.status,200,JSON.stringify(accepted));
 assert.equal(accepted.executionAllowed,false);
 assert.equal(accepted.status,'OWNER_FACTS_VERIFIED_NO_EXECUTION');

 // One-use state cannot replay a callback or mint an additional Session.
 const replay=await request(callback.pathname+callback.search);
 assert.notEqual(replay.status,303);
 assert.equal(replay.headers.get('set-cookie'),null);

 // Invalid ID Token nonce must not issue a Host cookie.
 badNextNonce=true;
 const failed=await login();
 assert.notEqual(failed.finish.status,303);
 assert.equal(failed.finish.headers.get('set-cookie'),null);

 const logout=await request('/auth/logout',{method:'POST',headers:{cookie,origin:host}});
 assert.equal(logout.status,303);
 const denied=await request('/api/v1/trading-finance/readonly-owner-verify',{
  method:'POST',headers,body:JSON.stringify({intent})});
 assert.equal(denied.status,401);
 assert.equal((await denied.json()).executionAllowed,false);
 assert.equal(pkceValidated,2);
 assert.equal(signedIdTokens,2);
 console.log('TR01B2D3_EXTERNAL_STYLE_OIDC_TO_REAL_FINANCE_HOST_PROOF='+JSON.stringify({
  status:'PASS',liveMockIssuerHttp:true,authorizationCode:true,pkceS256Validated:true,
  rsaSignedIdToken:true,nonceAndIssuerAudienceValidation:true,hostIssuedHttpOnlyCookie:true,
  oidcPrincipalUsedForOriginalEvoFinance:true,sessionLogoutImmediateRevoke:true,
  replayedStateDenied:true,badNonceDenied:true,executionAllowed:false,
  googleRealTenant:'NOT_CERTIFIED',productionHttps:'NOT_CERTIFIED'
 }));
}catch(e){
 console.error('OIDC_REAL_HOST_CI_FAILED:',e);
 console.error('HOST_LOG:',readFileSync(dir+'/oidc-host.log','utf8').slice(-12000));
 process.exitCode=1;
}finally{
 if(child&&child.exitCode===null){
  child.kill('SIGTERM');
  await Promise.race([new Promise(resolve=>child.once('exit',resolve)),sleep(5000)]);
  if(child.exitCode===null)child.kill('SIGKILL');
 }
 idp.close();await database.destroy();
}
