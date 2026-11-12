import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,randomBytes} from "node:crypto";
import postgres from "postgres";
import {
  preparePostgresConditionalResourceSchemaV010,
  createPostgresConditionalResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources-postgres.js";
import {
  prepareIsolatedDictionaryExportAuditV010,
  readIsolatedDictionaryExportAuditV010
} from "../../dist/apps/business-dictionary/export-job-pg-audit.js";
import {createIsolatedEncryptedDictionaryExportPgStoreV010}
  from "../../dist/apps/business-dictionary/export-job-pg-store.js";
import {createDictionaryExportJobOwnerV010}
  from "../../dist/apps/business-dictionary/export-jobs.js";
import {createMemoryEnterpriseResourceRepositoryV010}
  from "../../dist/providers/enterprise-context/resources.js";
import {createBusinessDictionaryRepositoryV010}
  from "../../dist/apps/business-dictionary/repository.js";
import {createHostStaticAuthorizationProviderV010}
  from "../../dist/providers/authorization/runtime.js";

const url=process.env.CV04_EXPORT_TEST_DATABASE_URL;
const requiresDB={skip:!url&&"CV04_EXPORT_TEST_DATABASE_URL required for real PG",timeout:120000};
const ctxId="enterprise-context:cv04-a";
const jobAddr=id=>({contextId:ctxId,namespace:"evo.dictionary.export-jobs",
  collectionId:"bounded-csv-jobs",resourceType:"evo.dictionary.export.job",resourceId:id});
const context=(subjectId="owner",actorType="HUMAN")=>({
  contractVersion:"0.1.0",
  principal:{contractVersion:"0.1.0",subjectId,actorType,identityProviderId:"host.test",sessionId:"cv04-audit-test"},
  scope:{contractVersion:"0.1.0",enterpriseId:"cv04-a",userId:subjectId},
  context:{contractVersion:"0.1.0",
    personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",contextId:"personal:"+subjectId,
      ownerSubjectId:subjectId},
    activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",contextId:ctxId,enterpriseId:"cv04-a"}
  },correlationId:"cv04-immutable-audit-proof"
});
const provider=()=>createHostStaticAuthorizationProviderV010({
  contractVersion:"0.1.0",rules:[{
    id:"cv04-only-export",effect:"ALLOW",actions:["dictionary.export"],
    subjectIds:["owner"],actorTypes:["HUMAN"]
  }]
});
const exportRequest=(key="cv04_immutable_01")=>({
  idempotencyKey:key,query:{view:"published",sort:"dictionaryId",direction:"asc"},
  fieldIds:["dictionaryId","displayName"]
});
const rawSource=()=>{
  const resources=createMemoryEnterpriseResourceRepositoryV010();
  const repository=createBusinessDictionaryRepositoryV010(resources);
  for(let i=0;i<3;i++){
    const dictionaryId="audit-"+i;
    const saved=repository.saveDraft({
      contextId:ctxId,dictionaryId,displayName:i===0?"Sensitive dictionary row Alpha":"Visible "+i,
      expectedVersion:0,
      options:[{code:"PRIVATE_OPTION_"+i,label:{default:"Private option label"},status:"ACTIVE"}],
      actorSubjectId:"owner",recordedAt:"2026-11-12T00:00:00Z"
    });
    repository.publish({contextId:ctxId,dictionaryId,expectedVersion:saved.version,
      actorSubjectId:"owner",actorType:"HUMAN",recordedAt:"2026-11-12T00:00:00Z"});
  }
  return repository;
};
const madeOwner=(repository,raw,key,flags)=>{
  const encrypted=createIsolatedEncryptedDictionaryExportPgStoreV010({
    resources:raw,encryptionKey:key,keyId:"cv04-audit-test-key",isolatedTestOnly:true
  });
  const owner=createDictionaryExportJobOwnerV010({
    resources:encrypted,repository,isolatedTestOnly:true,
    now:()=>new Date("2026-11-12T00:00:00Z"),
    isFeatureActive:()=>flags.active,
    hasLiveRelationship:()=>flags.member,
    resolveAuthorizationProvider:()=>flags.exportGranted?provider():undefined
  });
  return {owner,encrypted};
};
async function fixture(fn){
  const schema="cv03_cv04_audit_"+randomUUID().replaceAll("-","").slice(0,13);
  await preparePostgresConditionalResourceSchemaV010({connectionString:url,schema});
  await prepareIsolatedDictionaryExportAuditV010({
    connectionString:url,schema,isolatedTestOnly:true
  });
  const admin=postgres(url,{max:2,connect_timeout:10,prepare:false});
  const rawA=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
  const rawB=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
  const key=randomBytes(32);
  const repository=rawSource(),flags={active:true,member:true,exportGranted:true};
  const a=madeOwner(repository,rawA,key,flags);
  const b=madeOwner(repository,rawB,key,flags);
  const read=(id,enterpriseCtx=ctxId)=>readIsolatedDictionaryExportAuditV010({
    connectionString:url,schema,contextId:enterpriseCtx,jobId:id,isolatedTestOnly:true
  });
  try{await fn({schema,admin,rawA,rawB,key,repository,flags,a,b,read});}
  finally{
    await Promise.all([rawA.close(),rawB.close()]);
    await admin.unsafe('DROP SCHEMA "'+schema+'" CASCADE');
    await admin.end();
  }
}

test("CV04 real PG: every Owner transaction appends independent immutable metadata audit, never CSV",requiresDB,async()=>{
  await fixture(async({schema,admin,a,b,flags,read})=>{
    const ctx=context();
    const created=await a.owner.request(ctx,exportRequest());
    assert.equal(created.state,"QUEUED");
    const requested=await read(created.jobId);
    assert.deepEqual(requested.map(x=>x.stage),["REQUESTED"]);
    const ready=await b.owner.run(ctx,created.jobId);
    assert.equal(ready.state,"READY");
    assert.equal(ready.rows,3);
    const completed=await read(created.jobId);
    assert.deepEqual(completed.map(x=>x.stage),[
      "REQUESTED","STARTED","STARTED","COMPLETED","READY"]);
    assert.deepEqual(completed.map(x=>x.ordinal),[0,1,2,3,4]);
    assert.equal(new Set(completed.map(x=>x.eventId)).size,5);
    flags.exportGranted=false;
    await assert.rejects(a.owner.download(ctx,created.jobId),
      /COLLECTION_EXPORT_AUTHORIZATION_UNAVAILABLE/);
    assert.equal((await read(created.jobId)).length,5,
      "denied download did not create a false authorization audit");
    flags.exportGranted=true;
    const download=await a.owner.download(ctx,created.jobId);
    assert.ok(download.content.includes("Sensitive dictionary row Alpha"));
    const eventList=await read(created.jobId);
    assert.deepEqual(eventList.map(x=>x.stage),[
      "REQUESTED","STARTED","STARTED","COMPLETED","READY","DOWNLOAD_AUTHORIZED"]);
    const raw=await admin.unsafe(
      'SELECT resource::text AS resource FROM "'+schema+'".resources');
    const ledger=await admin.unsafe(
      'SELECT row_to_json(audit)::text AS text FROM "'+schema+'".cv04_export_audit audit');
    assert.equal(raw.length,1);
    assert.equal(ledger.length,6);
    for(const item of [...raw.map(x=>x.resource),...ledger.map(x=>x.text)]){
      for(const privatePart of ["Sensitive dictionary row Alpha","PRIVATE_OPTION_",
        "Private option label","dictionaryId","displayName"]){
        assert.equal(item.includes(privatePart),false,"SQL plaintext leaked "+privatePart);
      }
    }
    assert.deepEqual(await read(created.jobId,"enterprise-context:another"),[],
      "Verifier must supply explicit enterprise context");
    console.log("CV04_PG_EXPORT_ATOMIC_INDEPENDENT_AUDIT_6_EVENTS_PASS");
  });
});

test("CV04 real PG: audit history rewrite, direct audit UPDATE/DELETE and bad new event rollback",requiresDB,async()=>{
  await fixture(async({schema,admin,a,rawA,read})=>{
    const ctx=context(),q=await a.owner.request(ctx,exportRequest("cv04_sql_tamper_02"));
    const addr=jobAddr(q.jobId);
    const ledger='"'+schema+'".cv04_export_audit',resource='"'+schema+'".resources';
    await assert.rejects(
      admin.unsafe("UPDATE "+ledger+" SET stage='FORGED' WHERE job_id=$1",[q.jobId]),
      /CV04_EXPORT_SQL_AUDIT_IMMUTABLE/
    );
    await assert.rejects(admin.unsafe("DELETE FROM "+ledger+" WHERE job_id=$1",[q.jobId]),
      /CV04_EXPORT_SQL_AUDIT_IMMUTABLE/);
    const raw=await rawA.get(addr);
    // Direct SQL writer tries to delete a historical REQUESTED event.
    const forged=structuredClone(raw);
    forged.payload.meta.audit=[];
    await assert.rejects(
      admin.unsafe("UPDATE "+resource+
        " SET revision=$1,resource=$2::jsonb WHERE resource_id=$3",
        [1,JSON.stringify(forged),q.jobId]),
      /CV04_EXPORT_SQL_AUDIT_HISTORY_INVALID|CV04_EXPORT_SQL_AUDIT_REWRITE_DENIED/
    );
    assert.equal((await rawA.get(addr)).revision,0);
    // SQL trigger is a real same-transaction fail-closed boundary even for
    // a new event. Unknown metadata keys must not reach the audit table.
    const corrupt=structuredClone(raw);
    corrupt.revision=1;
    corrupt.payload.meta.audit.push({...corrupt.payload.meta.audit[0],
      eventId:randomUUID(),type:"STARTED",csv:"SENSITIVE_MARKER"});
    await assert.rejects(admin.unsafe("UPDATE "+resource+
      " SET revision=$1,resource=$2::jsonb WHERE resource_id=$3",
      [1,JSON.stringify(corrupt),q.jobId]),/CV04_EXPORT_SQL_AUDIT_EVENT_INVALID|CV04_EXPORT_SQL_AUDIT_HISTORY_INVALID/);
    assert.equal((await rawA.get(addr)).revision,0);
    assert.deepEqual((await read(q.jobId)).map(x=>x.stage),["REQUESTED"]);
    assert.equal((await a.owner.run(ctx,q.jobId)).state,"READY");
    assert.equal((await read(q.jobId)).length,5);
    console.log("CV04_PG_EXPORT_LEDGER_IMMUTABLE_AND_ROLLBACK_PASS");
  });
});

test("CV04 real PG: distinct restricted login cannot select export payload or mutate ledger/owner job",requiresDB,async()=>{
  await fixture(async({schema,admin,a,read})=>{
    const role="cv04_export_reader_"+randomUUID().replaceAll("-","").slice(0,12);
    const password="CV04_DISPOSABLE_"+randomUUID().replaceAll("-","");
    const qRole='"'+role+'"',qSchema='"'+schema+'"';
    const q=await a.owner.request(context(),exportRequest("cv04_sql_role_03"));
    let login,created=false;
    try {
      await admin.unsafe("CREATE ROLE "+qRole+
        " LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '"+password+"'");
      created=true;
      await admin.unsafe("GRANT USAGE ON SCHEMA "+qSchema+" TO "+qRole);
      const urlForRole=new URL(url);
      urlForRole.username=role;urlForRole.password=password;
      login=postgres(urlForRole.toString(),{max:1,connect_timeout:10,prepare:false});
      const priv=await login.unsafe(
        "SELECT current_user AS current_user,"+
        "has_table_privilege(current_user,$1,'SELECT') AS can_read_resource,"+
        "has_table_privilege(current_user,$1,'INSERT') AS can_insert_resource,"+
        "has_table_privilege(current_user,$2,'SELECT') AS can_read_audit,"+
        "has_table_privilege(current_user,$2,'UPDATE') AS can_update_audit",
        [schema+".resources",schema+".cv04_export_audit"]);
      assert.equal(priv[0].current_user,role);
      assert.equal(priv[0].can_read_resource,false);
      assert.equal(priv[0].can_insert_resource,false);
      assert.equal(priv[0].can_read_audit,false,
        "No all-tenant audit list should be exposed to an unscoped SQL login");
      assert.equal(priv[0].can_update_audit,false);
      await assert.rejects(login.unsafe(
        "SELECT resource FROM "+qSchema+".resources"),/permission denied/);
      await assert.rejects(login.unsafe(
        "SELECT * FROM "+qSchema+".cv04_export_audit"),/permission denied/);
      await assert.rejects(login.unsafe(
        "DELETE FROM "+qSchema+".cv04_export_audit WHERE job_id=$1",[q.jobId]
      ),/permission denied/);
      await assert.rejects(login.unsafe(
        "UPDATE "+qSchema+".resources SET revision=100 WHERE resource_id=$1",[q.jobId]
      ),/permission denied/);
      assert.equal((await read(q.jobId)).length,1);
      console.log("CV04_PG_EXPORT_DISTINCT_LOGIN_NO_RAW_RESOURCE_OR_AUDIT_DML_PASS");
    }finally{
      if(login)await login.end();
      if(created){
        await admin.unsafe("REVOKE USAGE ON SCHEMA "+qSchema+" FROM "+qRole);
        await admin.unsafe("DROP ROLE "+qRole);
      }
    }
  });
});

test("CV04 real PG: two independent Owner connections share transaction-local audit with one CAS winner",requiresDB,async()=>{
  await fixture(async({a,b,rawA,read})=>{
    const ctx=context(),q=await a.owner.request(ctx,exportRequest("cv04_sql_cas_04"));
    // Encrypted job CAS still arbitrates independent workers.
    const outcomes=await Promise.allSettled([
      a.owner.run(ctx,q.jobId),b.owner.run(ctx,q.jobId)
    ]);
    assert.equal(outcomes.filter(o=>o.status==="fulfilled").length,1,
      JSON.stringify(outcomes));
    assert.equal(outcomes.filter(o=>o.status==="rejected").length,1,
      JSON.stringify(outcomes));
    assert.equal((await rawA.get(jobAddr(q.jobId))).revision,4);
    const stages=(await read(q.jobId)).map(e=>e.stage);
    assert.deepEqual(stages,["REQUESTED","STARTED","STARTED","COMPLETED","READY"]);
    assert.equal(new Set((await read(q.jobId)).map(e=>e.eventId)).size,5);
    console.log("CV04_PG_EXPORT_CAS_ATOMIC_AUDIT_MULTI_CONNECTION_PASS");
  });
});

test("CV04 audit preparation rejects production mode and unsafe schema before any connection",async()=>{
  await assert.rejects(
    prepareIsolatedDictionaryExportAuditV010({
      connectionString:"postgres://invalid.invalid/test",schema:"public",isolatedTestOnly:true
    }),/CV04_EXPORT_AUDIT_ISOLATED_SCHEMA_REQUIRED/
  );
  await assert.rejects(
    prepareIsolatedDictionaryExportAuditV010({
      connectionString:"postgres://invalid.invalid/test",
      schema:"cv03_safe",isolatedTestOnly:false
    }),/CV04_EXPORT_AUDIT_PRODUCTION_PREPARE_DENIED/
  );
});
