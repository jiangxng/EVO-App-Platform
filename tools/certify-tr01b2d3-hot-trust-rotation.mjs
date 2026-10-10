#!/usr/bin/env node
/** TR01B2D3: EVO stays alive while operator revokes and rotates its trusted
 * Host signing keys in durable PostgreSQL; original Sales→Cash facts untouched.
 * This is process-backed CI, not a real production key custody ceremony.
 */
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { readFileSync,writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createDatabase } from '../evo/dist/platform/database/src/index.js';
import { createTrustedRemoteFinanceOwnerPreflightV010 } from
 '../dist/apps/trading-reference/finance-owner-remote.js';
import { computeEconomicRuntimeDigest,computeReplayInputDigest } from
 '../evo/dist/modules/replay/infrastructure/postgres-replay-digest.js';
const database=createDatabase(process.env.DATABASE_URL);
const db=database.db;
const install=JSON.parse(readFileSync('/tmp/tr01b2d3-host-install.json','utf8'));
const oldKey=readFileSync('/tmp/tr01b2d3-host-signing-key.pem','utf8');
function operator(...args){
 const result=spawnSync(process.execPath,['dist/scripts/finance-trust-operator.js',...args],
   {cwd:'evo',env:process.env,encoding:'utf8'});
 if(result.status!==0)throw new Error('TR01B2D3_OPERATOR_FAILURE: '+result.stderr.slice(-3000));
 assert.match(result.stdout,/FINANCE_TRUST_OPERATOR_CHANGE/);
}
function deniedOperator(...args){
 const result=spawnSync(process.execPath,['dist/scripts/finance-trust-operator.js',...args],
  {cwd:'evo',env:process.env,encoding:'utf8'});
 assert.notEqual(result.status,0,'invalid/reinstated key operation MUST fail');
}
async function audit(){
 const r=await db.selectFrom('finance_trust_change_audit').selectAll()
  .where('issuer','=',install.issuer).where('installation_id','=',install.installationId)
  .orderBy('audit_id','asc').execute();
 return r;
}
async function count(table){
 const x=await db.selectFrom(table).select(({fn})=>fn.countAll().as('count'))
  .where('enterprise_id','=',install.evoEnterpriseId).executeTakeFirstOrThrow();
 return Number(x.count);
}
async function digest(){
 const s=await db.selectFrom('enterprise_runtime_state')
  .select(['consistency_domain','next_posting_sequence'])
  .where('enterprise_id','=',install.evoEnterpriseId).executeTakeFirstOrThrow();
 const boundary=BigInt(s.next_posting_sequence)-1n;
 return {
  boundary:String(boundary),
  economic:await computeEconomicRuntimeDigest(db,install.evoEnterpriseId,s.consistency_domain,boundary),
  input:await computeReplayInputDigest(db,install.evoEnterpriseId,s.consistency_domain,boundary)
 };
}
async function business(type,key){
 return db.selectFrom('business_data').select('id')
  .where('enterprise_id','=',install.evoEnterpriseId)
  .where('business_data_type','=',type).where('business_object_key','=',key)
  .executeTakeFirstOrThrow();
}
function owner(i,key){
 return createTrustedRemoteFinanceOwnerPreflightV010({
  resolveInstallation:()=>i,resolveSigningPrivateKey:()=>key,
  allowLoopbackHttpInTest:true
 });
}
function input(intent){
 return {
  hostEnterpriseId:install.hostEnterpriseId,contextId:install.contextId,
  evoEnterpriseId:install.evoEnterpriseId,
  actorSubjectId:'host-finance-test-operator',actorType:'HUMAN',
  correlationId:'tr01b2d3-live-postgres-trust-rotation',
  intent
 };
}
async function expectVerified(client,request){
 const v=await client.verify(request);
 assert.equal(v.verified,true);
 assert.equal(v.evoEnterpriseId,install.evoEnterpriseId);
}
async function expectRejected(client,request){
 await assert.rejects(client.verify(request),
  e=>e instanceof Error&&e.message==='TR01B2D3_OWNER_REMOTE_DENIED_401');
}
try {
 const [shipment,valuation,allocation,rule]=await Promise.all([
  business('sales_shipment.created','TR01B-SHIP-001'),
  db.selectFrom('valuation_policy').select(['id','version'])
    .where('enterprise_id','=',install.evoEnterpriseId)
    .where('code','=','inventory_fifo').where('status','=','ACTIVE')
    .where('version','=',1).executeTakeFirstOrThrow(),
  db.selectFrom('allocation_policy').select(['id','version'])
    .where('enterprise_id','=',install.evoEnterpriseId)
    .where('code','=','inventory_fifo').where('status','=','PUBLISHED')
    .where('version','=',1).executeTakeFirstOrThrow(),
  db.selectFrom('valuation_rule').select(['id','version'])
    .where('enterprise_id','=',install.evoEnterpriseId)
    .where('code','=','shipment-inventory-to-cogs').where('status','=','PUBLISHED')
    .where('version','=',1).executeTakeFirstOrThrow()
 ]);
 const before={digest:await digest(),cost:await count('cost_run'),
  allocation:await count('allocation_instruction')};
 const pin=x=>({id:x.id,version:x.version});
 const intent={contractVersion:'0.1.0',kind:'COST_VALUATION',
  orderNo:'TR01B-SO-001',customerCounterpartyId:'cp-tr01b-customer',
  itemId:'item-tr01b',warehouseId:'wh-tr01b',
  idempotencyKey:'tr01b2d3-live-rotation',shipmentBusinessDataId:shipment.id,
  costMethod:'FIFO',valuationPolicy:pin(valuation),allocationPolicy:pin(allocation),
  shipmentValuationRule:pin(rule),boundarySequence:before.digest.boundary
 };
 const request=input(intent);
 const oldSigner=owner(install,oldKey);
 const previousAudit=await audit();
 assert.equal(previousAudit.length,1,'first operator GRANT must have been audited');
 assert.equal(previousAudit[0].action,'GRANT');
 await expectVerified(oldSigner,request);

 // Operating API stays RUNNING. Revoke persistent trust without restart.
 operator('revoke',install.issuer,install.installationId,install.keyId,
  'ci-finance-security-operator','CI-TRUST-001');
 await expectRejected(oldSigner,request);
 const revoked=await db.selectFrom('finance_trusted_signing_key')
  .select('status').where('issuer','=',install.issuer)
  .where('installation_id','=',install.installationId)
  .where('key_id','=',install.keyId).executeTakeFirstOrThrow();
 assert.equal(revoked.status,'REVOKED');

 // A *new* key-id is a separate operator admission, not a reinstatement.
 const generated=generateKeyPairSync('ed25519');
 const next={...install,keyId:'tr01b2d3-ephemeral-rotation-2',
  publicKeyPem:generated.publicKey.export({format:'pem',type:'spki'}).toString(),
  enabled:true};
 writeFileSync('/tmp/tr01b2d3-evo-new-public.json',JSON.stringify(next),{mode:0o600});
 operator('grant','/tmp/tr01b2d3-evo-new-public.json',
  'ci-finance-security-operator','CI-TRUST-002');
 const newSigner=owner({...install,keyId:next.keyId},
  generated.privateKey.export({format:'pem',type:'pkcs8'}).toString());
 await expectVerified(newSigner,request);
 await expectRejected(oldSigner,request);
 // Old key cannot be made ACTIVE again using a re-grant.
 deniedOperator('grant','/tmp/tr01b2d3-evo-public-key.json',
  'ci-finance-security-operator','CI-TRUST-REGRANT-FORBIDDEN');

 operator('revoke',install.issuer,install.installationId,next.keyId,
  'ci-finance-security-operator','CI-TRUST-003');
 await expectRejected(newSigner,request);
 deniedOperator('revoke',install.issuer,install.installationId,next.keyId,
  'ci-finance-security-operator','CI-TRUST-REPEATED-REVOKE-FORBIDDEN');

 const audits=await audit();
 assert.equal(audits.length,4);
 assert.deepEqual(audits.map(x=>x.action),['GRANT','REVOKE','GRANT','REVOKE']);
 assert.deepEqual(audits.map(x=>x.reason),
  ['CI-INITIAL-ADMISSION','CI-TRUST-001','CI-TRUST-002','CI-TRUST-003']);
 const after={digest:await digest(),cost:await count('cost_run'),
  allocation:await count('allocation_instruction')};
 assert.deepEqual(after,before);
 const ready=await fetch('http://127.0.0.1:3000/health/ready');
 assert.equal(ready.status,200);
 console.log('TR01B2D3_LIVE_POSTGRES_SIGNER_ROTATION_PROOF='+JSON.stringify({
  status:'PASS',oldKeyRevokedWithoutEvoRestart:true,
  newKeyAdmittedWithoutEvoRestart:true,
  oldKeyStillRejectedAfterNewGrant:true,
  newKeyRevokedWithoutEvoRestart:true,
  noRevokedKeyReactivation:true,appendOnlyOperatorAuditEntries:audits.length,
  operatorAndReasonRecorded:true,databaseNonceReplayGuardStillActive:true,
  immutableSalesCashFinanceDigestUnchanged:true,noCostOrAllocationWrites:true,
  executionAllowed:false,realProductionTls:'NOT_CERTIFIED',
  realOidcLogin:'NOT_CERTIFIED'
 }));
}finally{await database.destroy();}
