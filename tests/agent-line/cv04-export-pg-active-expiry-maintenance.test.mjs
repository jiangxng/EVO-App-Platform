import test from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import {randomBytes,randomUUID} from "node:crypto";
import {preparePostgresConditionalResourceSchemaV010,
  createPostgresConditionalResourceRepositoryV010}
  from "../../dist/providers/enterprise-context/resources-postgres.js";
import {prepareIsolatedDictionaryExportAuditV010,
  readIsolatedDictionaryExportAuditV010}
  from "../../dist/apps/business-dictionary/export-job-pg-audit.js";
import {createIsolatedEncryptedDictionaryExportPgStoreV010}
  from "../../dist/apps/business-dictionary/export-job-pg-store.js";
import {createMemoryEnterpriseResourceRepositoryV010}
  from "../../dist/providers/enterprise-context/resources.js";
import {createBusinessDictionaryRepositoryV010}
  from "../../dist/apps/business-dictionary/repository.js";
import {createDictionaryExportJobOwnerV010}
  from "../../dist/apps/business-dictionary/export-jobs.js";
import {createHostStaticAuthorizationProviderV010}
  from "../../dist/providers/authorization/runtime.js";
import {prepareIsolatedDictionaryExportSqlLeaseV010,
  createIsolatedDictionaryExportSqlHostLeaseIssuerV010,
  createIsolatedDictionaryExportSqlWorkerLeaseV010}
  from "../../dist/apps/business-dictionary/export-job-pg-sql-lease.js";
import {createIsolatedDictionaryExportPgMaintenanceV010,
  CV04_EXPORT_MAINTENANCE_ACTOR_V010}
  from "../../dist/apps/business-dictionary/export-job-pg-maintenance.js";

const url=process.env.CV04_EXPORT_TEST_DATABASE_URL;
const requiresDB={skip:!url&&"CV04_EXPORT_TEST_DATABASE_URL real PostgreSQL16 required",
  timeout:120000};
const contextId="enterprise-context:cv04-maintenance",enterpriseId="cv04-maintenance";
const ctx={
  contractVersion:"0.1.0",
  principal:{contractVersion:"0.1.0",subjectId:"cv04-maintainer-member",
    actorType:"HUMAN",identityProviderId:"cv04-isolated",
    sessionId:"cv04-member-session"},
  scope:{contractVersion:"0.1.0",enterpriseId,userId:"cv04-maintainer-member"},
  context:{contractVersion:"0.1.0",
    activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",contextId,enterpriseId},
    personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
      contextId:"personal:cv04-maintainer-member",ownerSubjectId:"cv04-maintainer-member"}
  },correlationId:"cv04-expiry-maintenance"
};
const addr=id=>({contextId,namespace:"evo.dictionary.export-jobs",
  collectionId:"bounded-csv-jobs",resourceType:"evo.dictionary.export.job",
  resourceId:id});
const request=label=>({
  idempotencyKey:"cv04_cleanup_"+label,
  query:{view:"published",sort:"dictionaryId",direction:"asc"},
  fieldIds:["dictionaryId","displayName"]
});
const urlFor=(role,password)=>{
  const u=new URL(url);u.username=role;u.password=password;return u.toString();
};
async function fixture(fn){
  const n=randomUUID().replaceAll("-","").slice(0,12);
  const schema="cv03_cv04_cleanup_"+n,q='"'+schema+'"',
    hostRole="cv04_h_"+n,workerRole="cv04_w_"+n,
    hostPwd="Host_"+randomUUID().replaceAll("-",""),
    workerPwd="Worker_"+randomUUID().replaceAll("-","");
  const admin=postgres(url,{max:3,connect_timeout:10,prepare:false});
  let rawA,rawB,host,worker,created=false;
  try{
    await preparePostgresConditionalResourceSchemaV010({connectionString:url,schema});
    await prepareIsolatedDictionaryExportAuditV010({
      connectionString:url,schema,isolatedTestOnly:true
    });
    await admin.unsafe('CREATE ROLE "'+hostRole+
      '" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD \''+hostPwd+'\'');
    await admin.unsafe('CREATE ROLE "'+workerRole+
      '" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD \''+workerPwd+'\'');
    created=true;
    await prepareIsolatedDictionaryExportSqlLeaseV010({
      connectionString:url,schema,hostLoginRole:hostRole,
      workerLoginRole:workerRole,isolatedTestOnly:true
    });
    host=createIsolatedDictionaryExportSqlHostLeaseIssuerV010({
      connectionString:urlFor(hostRole,hostPwd),schema,isolatedTestOnly:true
    });
    worker=createIsolatedDictionaryExportSqlWorkerLeaseV010({
      connectionString:urlFor(workerRole,workerPwd),schema,isolatedTestOnly:true
    });
    rawA=createPostgresConditionalResourceRepositoryV010({
      connectionString:url,schema
    });
    rawB=createPostgresConditionalResourceRepositoryV010({
      connectionString:url,schema
    });
    const key=randomBytes(32);
    const encryptedA=createIsolatedEncryptedDictionaryExportPgStoreV010({
      resources:rawA,encryptionKey:key,keyId:"cv04-maintain-k1",isolatedTestOnly:true
    });
    const encryptedB=createIsolatedEncryptedDictionaryExportPgStoreV010({
      resources:rawB,encryptionKey:Buffer.from(key),keyId:"cv04-maintain-k1",
      isolatedTestOnly:true
    });
    const source=createMemoryEnterpriseResourceRepositoryV010();
    const repo=createBusinessDictionaryRepositoryV010(source);
    const saved=repo.saveDraft({
      contextId,dictionaryId:"cv04-expiry-d1",displayName:"Private customer-like name",
      expectedVersion:0,actorSubjectId:"cv04-maintainer-member",
      recordedAt:new Date().toISOString(),
      options:[{code:"PRIVATE_OPTION",label:{default:"Private option"},status:"ACTIVE"}]
    });
    repo.publish({contextId,dictionaryId:"cv04-expiry-d1",expectedVersion:saved.version,
      actorSubjectId:"cv04-maintainer-member",actorType:"HUMAN",
      recordedAt:new Date().toISOString()});
    const auth=()=>createHostStaticAuthorizationProviderV010({
      contractVersion:"0.1.0",rules:[{id:"dictionary-export-grant",effect:"ALLOW",
        actions:["dictionary.export"],subjectIds:["cv04-maintainer-member"],
        actorTypes:["HUMAN"],scope:{enterpriseId}}]
    });
    const createOwner=(store,time)=>createDictionaryExportJobOwnerV010({
      repository:repo,resources:store,isolatedTestOnly:true,
      now:()=>new Date(time),
      resolveAuthorizationProvider:auth,
      hasLiveRelationship:()=>true,isFeatureActive:()=>true
    });
    const pastTime=Date.now()-16*60*1000;
    const ownerPast=createOwner(encryptedA,pastTime),
      ownerNow=createOwner(encryptedB,Date.now());
    const readAudit=jobId=>readIsolatedDictionaryExportAuditV010({
      connectionString:url,schema,contextId,jobId,isolatedTestOnly:true
    });
    const maintenance=(store,authority=host,enterprise=enterpriseId)=>
      createIsolatedDictionaryExportPgMaintenanceV010({
        resources:store,leaseAuthority:authority,contextId,
        enterpriseId:enterprise,isolatedTestOnly:true
      });
    await fn({schema,q,admin,host,worker,hostRole,workerRole,
      workerConnectionString:urlFor(workerRole,workerPwd),
      encryptedA,encryptedB,rawA,rawB,ownerPast,ownerNow,
      maintenance,readAudit});
  }finally{
    for(const v of [host,worker,rawA,rawB])if(v)await v.close();
    await admin.unsafe("DROP SCHEMA IF EXISTS "+q+" CASCADE");
    if(created){
      await admin.unsafe('DROP ROLE "'+hostRole+'"');
      await admin.unsafe('DROP ROLE "'+workerRole+'"');
    }
    await admin.end();
  }
}

test("CV04 real PG: host-only due IDs, background READY/QUEUED payload purge, audit EXPIRED once and no live leakage",requiresDB,async()=>{
  await fixture(async({host,worker,schema,admin,ownerPast,ownerNow,
    workerConnectionString,maintenance,encryptedA,rawA,readAudit})=>{
    const ready=await ownerPast.request(ctx,request("ready_001"));
    assert.equal((await ownerPast.run(ctx,ready.jobId)).state,"READY");
    const queued=await ownerPast.request(ctx,request("queued_002"));
    const future=await ownerNow.request(ctx,request("future_003"));
    const due=await host.due(contextId,10);
    assert.deepEqual(new Set(due.map(x=>x.jobId)),
      new Set([ready.jobId,queued.jobId]));
    assert.equal(due.length,2);
    const workerSql=postgres(workerConnectionString,{max:1,prepare:false});
    try{
      await assert.rejects(workerSql.unsafe('SELECT * FROM "'+schema+
        '".cv04_export_due_jobs($1,$2)',[contextId,10]),
        /permission denied|HOST_LOGIN_REQUIRED/i);
      await assert.rejects(workerSql.unsafe('SELECT resource FROM "'+schema+
        '".resources'),/permission denied/i);
    }finally{await workerSql.end();}
    // Synthetic crashed-lease metadata installed only by fixture DBA:
    // physical Worker still has no raw table permission.
    await admin.unsafe('INSERT INTO "'+schema+'".cv04_export_work_leases'+
      ' (context_id,job_id,epoch,claimed_until,claimed_token_hash,state)'+
      " VALUES($1,$2,1,clock_timestamp()+interval '30 seconds',$3,'RUNNING')",
      [contextId,ready.jobId,"fixture-synthetic-old-claim"]);
    assert.equal((await host.status(contextId,ready.jobId)).state,"RUNNING");
    const report=await maintenance(encryptedA).cleanup({limit:10});
    assert.deepEqual({
      scanned:report.scanned,expired:report.expired,skipped:report.skipped
    },{scanned:2,expired:2,skipped:0});
    assert.equal((await host.status(contextId,ready.jobId)).state,"REVOKED");
    for(const id of [ready.jobId,queued.jobId]){
      const stored=await encryptedA.get(addr(id));
      assert.equal(stored.payload.state,"EXPIRED");
      assert.deepEqual(stored.payload.pages,[]);
      assert.equal(stored.payload.csv,undefined);
      assert.equal(stored.payload.csvSha256,undefined);
      assert.equal(stored.updatedBySubjectId,CV04_EXPORT_MAINTENANCE_ACTOR_V010);
      const events=await readAudit(id);
      assert.equal(events.filter(x=>x.stage==="EXPIRED").length,1);
      assert.equal(events.at(-1).stage,"EXPIRED");
      assert.equal(JSON.stringify(events).includes("Private customer-like"),false);
      const persisted=await rawA.get(addr(id));
      assert.equal(JSON.stringify(persisted).includes("Private customer-like"),false);
    }
    assert.equal((await encryptedA.get(addr(future.jobId))).payload.state,"QUEUED");
    assert.deepEqual(await host.due(contextId,10),[]);
    assert.equal((await maintenance(encryptedA).cleanup({limit:10})).expired,0);
    await assert.rejects(ownerNow.download(ctx,ready.jobId),
      /COLLECTION_EXPORT_DOWNLOAD_NOT_READY/);
    console.log("CV04_EXPORT_PG_ACTIVE_TTL_READY_QUEUED_PURGE_AUDIT_PASS");
  });
});

test("CV04 two PG connections concurrent cleanups are CAS-idempotent, no duplicate EXPIRED audit",requiresDB,async()=>{
  await fixture(async({ownerPast,encryptedA,encryptedB,maintenance,readAudit})=>{
    const job=await ownerPast.request(ctx,request("parallel_004"));
    assert.equal(job.state,"QUEUED");
    const results=await Promise.all([
      maintenance(encryptedA).cleanup({limit:10}),
      maintenance(encryptedB).cleanup({limit:10})
    ]);
    assert.equal(results.reduce((n,r)=>n+r.expired,0),1);
    assert.ok(results.reduce((n,r)=>n+r.skipped,0)<=1);
    const record=await encryptedA.get(addr(job.jobId));
    assert.equal(record.payload.state,"EXPIRED");
    assert.equal((await readAudit(job.jobId)).filter(x=>x.stage==="EXPIRED").length,1);
    console.log("CV04_EXPORT_PG_ACTIVE_TTL_TWO_CONNECTION_SINGLE_EXPIRE_PASS");
  });
});

test("CV04 failed physical Host revoke or tenant mismatch blocks purge before erasing private data",requiresDB,async()=>{
  await fixture(async({host,ownerPast,encryptedA,maintenance,readAudit})=>{
    const job=await ownerPast.request(ctx,request("reject_005"));
    const fails={due:(id,limit)=>host.due(id,limit),
      revoke:async()=>{throw Error("CV04_HOST_SQL_REVOKE_DOWN")}};
    await assert.rejects(maintenance(encryptedA,fails).cleanup({limit:3}),
      /CV04_HOST_SQL_REVOKE_DOWN/);
    assert.equal((await encryptedA.get(addr(job.jobId))).payload.state,"QUEUED");
    assert.equal((await readAudit(job.jobId)).filter(e=>e.stage==="EXPIRED").length,0);
    await assert.rejects(
      maintenance(encryptedA,host,"foreign-enterprise").cleanup({limit:3}),
      /CV04_EXPORT_MAINTENANCE_TENANT_OR_JOB_MISMATCH/);
    assert.equal((await encryptedA.get(addr(job.jobId))).payload.state,"QUEUED");
    const poisoned={due:async()=>[
      {jobId:job.jobId,expiresAt:new Date().toISOString()},
      {jobId:job.jobId,expiresAt:new Date().toISOString()}
    ],revoke:host.revoke};
    await assert.rejects(maintenance(encryptedA,poisoned).cleanup({limit:3}),
      /CV04_EXPORT_MAINTENANCE_DISCOVERY_INVALID/);
    assert.equal((await readAudit(job.jobId)).length,1);
    console.log("CV04_EXPORT_PG_ACTIVE_TTL_REVOKE_TENANT_FAILCLOSED_PASS");
  });
});

test("CV04 maintenance construction requires exact encrypted PG, physical Host lease, test-only mode and bounded batches",requiresDB,async()=>{
  await fixture(async({rawA,encryptedA,host,maintenance})=>{
    assert.throws(()=>createIsolatedDictionaryExportPgMaintenanceV010({
      resources:encryptedA,leaseAuthority:host,contextId,
      enterpriseId,isolatedTestOnly:false
    }),/CV04_EXPORT_MAINTENANCE_PRODUCTION_DISABLED/);
    assert.throws(()=>createIsolatedDictionaryExportPgMaintenanceV010({
      resources:rawA,leaseAuthority:host,contextId,
      enterpriseId,isolatedTestOnly:true
    }),/CV04_EXPORT_MAINTENANCE_ENCRYPTED_PG_AND_SQL_HOST_REQUIRED/);
    await assert.rejects(maintenance(encryptedA).cleanup({limit:26}),
      /CV04_EXPORT_MAINTENANCE_BATCH_INVALID/);
  });
});
