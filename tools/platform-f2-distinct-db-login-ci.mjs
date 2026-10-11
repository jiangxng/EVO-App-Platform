#!/usr/bin/env node
/**
 * F2: isolated PostgreSQL CI proof of separate physical LOGIN identities.
 * Rebuilds only permission/role invariants from legacy TR01B2D3 scripts.
 *
 * This is NOT the EVO Finance Owner listener, a Runtime semantic query, or
 * a release/production certification. It cannot access Railway or EVO data:
 * NODE_ENV=test, explicit opt-in, loopback host and f2_ci_* DB are mandatory.
 */
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import postgres from 'postgres';

export function validateF2DisposablePostgresTargetV010(env) {
  if (env.NODE_ENV !== 'test' || env.F2_DISPOSABLE_POSTGRES !== '1')
    return 'F2_DISPOSABLE_TEST_MODE_REQUIRED';
  let url;
  try { url = new URL(env.DATABASE_URL ?? ''); }
  catch { return 'F2_DATABASE_URL_INVALID'; }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) ||
      !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      !/^f2_ci_[a-z0-9_]+$/u.test(decodeURIComponent(url.pathname.slice(1))) ||
      decodeURIComponent(url.username) !== 'postgres' ||
      !url.password || url.search || url.hash)
    return 'F2_DISPOSABLE_LOCAL_POSTGRES_ONLY';
  return null;
}

const quote = id => '"' + id.replaceAll('"','""') + '"';
const randomSuffix = () => randomBytes(5).toString('hex');
const connectionAs = (urlString, user, password) => {
  const url = new URL(urlString);
  url.username = user;
  url.password = password;
  return url.toString();
};

export async function runF2DisposableIndependentLoginProofV010(env = process.env) {
  const blocked = validateF2DisposablePostgresTargetV010(env);
  if (blocked) throw new Error(blocked);

  const suffix=randomSuffix();
  const schema='f2_fixture_'+suffix;
  const runtimeRole='f2_runtime_'+suffix;
  const operatorRole='f2_operator_'+suffix;
  const runtimePassword=randomBytes(28).toString('hex');
  const operatorPassword=randomBytes(28).toString('hex');
  const admin=postgres(env.DATABASE_URL,{max:1,connect_timeout:10,prepare:false});
  let runtime,operator,schemaCreated=false;
  const createdRoles=[];
  let checks=0;
  const verifyDenied=async(client,sql,why) => {
    await assert.rejects(client.unsafe(sql),
      error => error?.code === '42501',why+' must be SQLSTATE 42501');
    checks++;
  };
  try {
    // Protect even against a stale accidentally renamed local server.
    const identity=await admin.unsafe(
      'select current_database() as db, session_user as login, current_user as effective');
    assert.match(identity[0].db,/^f2_ci_[a-z0-9_]+$/u);
    assert.equal(identity[0].login,'postgres');
    assert.equal(identity[0].effective,'postgres');

    for(const [name,password] of [[runtimeRole,runtimePassword],[operatorRole,operatorPassword]]) {
      // Identifiers and credentials are generated random ASCII, never user SQL.
      await admin.unsafe('create role '+quote(name)+
        " login noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls password '"+password+"'");
      createdRoles.push(name);
    }
    await admin.unsafe('create schema '+quote(schema));
    schemaCreated=true;
    const witness=quote(schema)+'.read_witness';
    const keys=quote(schema)+'.operator_keys';
    const audit=quote(schema)+'.operator_audit';
    await admin.unsafe('create table '+witness+' (id integer primary key, label text not null)');
    await admin.unsafe('create table '+keys+' (id integer primary key, active boolean not null)');
    await admin.unsafe('create table '+audit+' (id integer primary key, event text not null)');
    await admin.unsafe("insert into "+witness+" values (1,'fixture-not-evo-finance')");
    await admin.unsafe('insert into '+keys+' values (1,true)');
    await admin.unsafe('grant usage on schema '+quote(schema)+' to '+quote(runtimeRole)+','+quote(operatorRole));
    await admin.unsafe('grant select on '+witness+' to '+quote(runtimeRole));
    await admin.unsafe('grant select,update on '+keys+' to '+quote(operatorRole));
    await admin.unsafe('grant insert on '+audit+' to '+quote(operatorRole));

    runtime=postgres(connectionAs(env.DATABASE_URL,runtimeRole,runtimePassword),
      {max:1,connect_timeout:10,prepare:false});
    operator=postgres(connectionAs(env.DATABASE_URL,operatorRole,operatorPassword),
      {max:1,connect_timeout:10,prepare:false});
    for(const [client,name] of [[runtime,runtimeRole],[operator,operatorRole]]){
      const id=await client.unsafe('select session_user as login,current_user as effective');
      assert.equal(id[0].login,name,'must use the actual LOGIN, never SET ROLE');
      assert.equal(id[0].effective,name,'cannot inherit admin authority');
      const flags=await client.unsafe(
        "select rolsuper,rolcreatedb,rolcreaterole,rolbypassrls,rolinherit "+
        "from pg_roles where rolname=current_user");
      assert.deepEqual([flags[0].rolsuper,flags[0].rolcreatedb,
        flags[0].rolcreaterole,flags[0].rolbypassrls,flags[0].rolinherit],
        [false,false,false,false,false]);
      checks+=2;
    }

    const read=await runtime.unsafe('select label from '+witness+' where id=1');
    assert.equal(read[0].label,'fixture-not-evo-finance'); checks++;
    await verifyDenied(runtime,'select * from '+keys,'runtime cannot inspect operator keys');
    await verifyDenied(runtime,'update '+keys+' set active=false where id=1','runtime cannot revoke keys');
    await verifyDenied(runtime,"insert into "+audit+" values (1,'FORGED')",
      'runtime cannot forge operator audit');
    await verifyDenied(runtime,"insert into "+witness+" values (2,'FORGED')",
      'runtime cannot mutate reference data');
    await verifyDenied(operator,'select * from '+witness,
      'operator cannot read unrelated runtime data');
    await verifyDenied(operator,"insert into "+witness+" values (3,'FORGED')",
      'operator cannot write runtime data');
    await verifyDenied(runtime,'create table '+quote(schema)+'.runtime_escalation(id int)',
      'runtime cannot create database objects');
    await verifyDenied(operator,'create table '+quote(schema)+'.operator_escalation(id int)',
      'operator cannot create database objects');

    // The operator has a narrow, positive allowed action but no finance writes.
    await operator.unsafe('update '+keys+' set active=false where id=1');
    await operator.unsafe("insert into "+audit+" values (1,'TEST_REVOKE')");
    const state=await admin.unsafe('select active from '+keys+' where id=1');
    const audited=await admin.unsafe('select event from '+audit+' where id=1');
    assert.equal(state[0].active,false);
    assert.equal(audited[0].event,'TEST_REVOKE');
    checks+=2;

    // Privilege revocation must take effect on the same existing LOGIN session.
    await admin.unsafe('revoke select on '+witness+' from '+quote(runtimeRole));
    await verifyDenied(runtime,'select * from '+witness,
      'revoked privilege must be denied without reconnecting');
    return Object.freeze({
      status:'PASS',checks,
      sessions:'TWO_DISTINCT_REAL_POSTGRES_LOGINS',
      privileges:'ENFORCED_BY_DISPOSABLE_POSTGRES',
      revokeWithoutReconnect:true,
      financeTablesTouched:false,
      actualEvoOwnerListener:'NOT_TESTED',
      runtimeEconomicInterpretation:'NOT_TESTED',
      productionCertification:'NOT_CERTIFIED',
      executionAllowed:false
    });
  } finally {
    if(runtime) await runtime.end({timeout:3}).catch(()=>{});
    if(operator) await operator.end({timeout:3}).catch(()=>{});
    // Cleanup on the disposable DB; roles must not outlive this proof.
    try {
      if(schemaCreated)await admin.unsafe('drop schema '+quote(schema)+' cascade');
      for(const name of createdRoles.reverse())
        await admin.unsafe('drop role '+quote(name));
    }finally{
      await admin.end({timeout:3}).catch(()=>{});
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const result=await runF2DisposableIndependentLoginProofV010();
    console.log('PLATFORM_F2_DISTINCT_PG_LOGINS='+JSON.stringify(result));
  }catch(error){
    // Never echo connection strings, role passwords, SQL or external secrets.
    console.error('PLATFORM_F2_DISTINCT_PG_LOGINS='+JSON.stringify({
      status:'FAIL',reason:typeof error?.message==='string'&&error.message.startsWith('F2_')
        ?error.message:'ISOLATED_PROOF_FAILED',
      postgresCode:typeof error?.code==='string'?error.code:null,
      productionCertification:'NOT_CERTIFIED',executionAllowed:false
    }));
    process.exitCode=1;
  }
}
