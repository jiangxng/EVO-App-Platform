#!/usr/bin/env node
/** Separate PostgreSQL role privilege matrix in ephemeral CI DB.
 * Actual EVO API still uses the CI bootstrap user; this certifies database
 * roles and grant/revoke trigger policies, NOT deployed DB credential wiring.
 */
import assert from 'node:assert/strict';
import pg from '../evo/node_modules/pg/lib/index.js';
import { readFileSync } from 'node:fs';
const {Client}=pg;
const config=JSON.parse(readFileSync('/tmp/tr01b2d3-evo-public-key.json','utf8'));
const connectionString=process.env.DATABASE_URL;
const operatorRole='tr01b2d3_trust_operator_ci';
const runtimeRole='tr01b2d3_readonly_runtime_ci';
const admin=new Client({connectionString});
await admin.connect();
async function checkRole(role,statement,params=[],allowed=false,reason=''){
 const client=new Client({connectionString});
 await client.connect();
 try{
  await client.query('begin');
  await client.query('set local role '+role);
  if(reason){
   await client.query("select set_config('evo.finance_trust_actor',$1,true),set_config('evo.finance_trust_reason',$2,true)",
    ['ci-trust-admin-role',reason]);
  }
  try{
   const r=await client.query(statement,params);
   if(!allowed)throw new Error('TR01B2D3_ROLE_ESCALATION_UNEXPECTED:'+role);
   await client.query('commit');
   return r;
  }catch(e){
   await client.query('rollback');
   if(allowed)throw e;
   assert.equal(e.code,'42501','Expected PostgreSQL permission denied for '+role+': '+String(e));
  }
 }finally{await client.end();}
}
try{
 await admin.query('create role '+runtimeRole+' nologin');
 await admin.query('create role '+operatorRole+' nologin');
 await admin.query('grant usage on schema public to '+runtimeRole+','+operatorRole);
 await admin.query('grant select on finance_trusted_signing_key to '+runtimeRole);
 await admin.query('grant insert on finance_delegation_nonce to '+runtimeRole);
 await admin.query('grant select,insert,update on finance_trusted_signing_key to '+operatorRole);
 await admin.query('grant select,insert on finance_trust_change_audit to '+operatorRole);
 await admin.query('grant usage on sequence finance_trust_change_audit_audit_id_seq to '+operatorRole);
 const before=await admin.query('select count(*)::int as n from finance_trust_change_audit');
 const n0=before.rows[0].n;
 const active=await checkRole(runtimeRole,'select count(*) from finance_trusted_signing_key',[],true);
 assert.ok(Number(active.rows[0].count)>=1);
 await checkRole(runtimeRole,"update finance_trusted_signing_key set status='REVOKED' where 1=0");
 await checkRole(runtimeRole,"insert into finance_trust_change_audit (issuer,installation_id,key_id,action,operator_id,reason) values ('a','b','c','GRANT','x','y')");
 await checkRole(runtimeRole,"delete from finance_trusted_signing_key where 1=0");
 await checkRole(runtimeRole,"insert into cost_run(id) values ('00000000-0000-4000-8000-000000000001')");
 await checkRole(operatorRole,"insert into cost_run(id) values ('00000000-0000-4000-8000-000000000001')");
 const kid='tr01b2d3-ci-separate-roles-key';
 await checkRole(operatorRole,
  `insert into finance_trusted_signing_key
   (issuer,installation_id,key_id,public_key_pem,host_enterprise_id,context_id,evo_enterprise_id,status)
   values ($1,$2,$3,$4,$5,$6,$7,'ACTIVE')`,
  [config.issuer,config.installationId,kid,config.publicKeyPem,
   config.hostEnterpriseId,config.contextId,config.evoEnterpriseId],
  true,'CI-ROLE-OPERATOR-GRANT');
 await checkRole(operatorRole,
  `update finance_trusted_signing_key set status='REVOKED',revoked_at=now()
   where issuer=$1 and installation_id=$2 and key_id=$3 and status='ACTIVE'`,
  [config.issuer,config.installationId,kid],true,'CI-ROLE-OPERATOR-REVOKE');
 const after=await admin.query('select count(*)::int as n from finance_trust_change_audit');
 assert.equal(after.rows[0].n,n0+2);
 const rows=await admin.query('select action,operator_id,reason from finance_trust_change_audit where key_id=$1 order by audit_id',[kid]);
 assert.deepEqual(rows.rows.map(x=>x.action),['GRANT','REVOKE']);
 assert.ok(rows.rows.every(x=>x.operator_id==='ci-trust-admin-role'));
 console.log('TR01B2D3_FINANCE_POSTGRES_ROLE_SEPARATION_PROOF='+JSON.stringify({
  status:'PASS',runtimeSelectOnlyForTrust:true,
  runtimeCannotMutateTrustOrAudit:true,runtimeCannotWriteCostRuns:true,
  operatorCanGrantRevokeWithAudit:true,operatorCannotWriteCostRuns:true,
  auditDelta:2,financialExecutionAllowed:false,
  deployedRuntimeDbCredentials:'NOT_CERTIFIED',
  productionDbRoles:'NOT_CERTIFIED'
 }));
}finally{
 await admin.end();
}
