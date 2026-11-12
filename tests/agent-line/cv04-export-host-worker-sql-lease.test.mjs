import test from "node:test";
import assert from "node:assert/strict";
import postgres from "postgres";
import {randomUUID,randomBytes} from "node:crypto";
import {preparePostgresConditionalResourceSchemaV010,
  createPostgresConditionalResourceRepositoryV010}
  from "../../dist/providers/enterprise-context/resources-postgres.js";
import {prepareIsolatedDictionaryExportAuditV010}
  from "../../dist/apps/business-dictionary/export-job-pg-audit.js";
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
import {prepareIsolatedDictionaryExportSqlLeaseV010,
  createIsolatedDictionaryExportSqlHostLeaseIssuerV010,
  createIsolatedDictionaryExportSqlWorkerLeaseV010}
  from "../../dist/apps/business-dictionary/export-job-pg-sql-lease.js";

const url=process.env.CV04_EXPORT_TEST_DATABASE_URL;
const requiresDB={skip:!url&&"CV04_EXPORT_TEST_DATABASE_URL real PG16 required",timeout:120000};
const contextId="enterprise-context:cv04-lease";
const org="cv04-lease-enterprise";
const ctx=(who="export-member",actorType="HUMAN")=>({
  contractVersion:"0.1.0",
  principal:{contractVersion:"0.1.0",subjectId:who,actorType,
    identityProviderId:"cv04-bearer-isolated",sessionId:"session:"+who},
  scope:{contractVersion:"0.1.0",enterpriseId:org,userId:who},
  context:{contractVersion:"0.1.0",
    activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",contextId,enterpriseId:org},
    personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
      contextId:"personal:"+who,ownerSubjectId:who}
  },correlationId:"cv04-host-worker-test"
});
const request=key=>({
  idempotencyKey:key,query:{view:"published",sort:"dictionaryId",direction:"asc"},
  fieldIds:["dictionaryId","displayName"]
});
const address=id=>({contextId,namespace:"evo.dictionary.export-jobs",
  collectionId:"bounded-csv-jobs",resourceType:"evo.dictionary.export.job",resourceId:id});
const u=(original,role,pw)=>{
  const v=new URL(original);v.username=role;v.password=pw;return v.toString();
};
const permission=()=>createHostStaticAuthorizationProviderV010({
  contractVersion:"0.1.0",rules:[{
    id:"export-only",effect:"ALLOW",actions:["dictionary.export"],
    subjectIds:["export-member"],actorTypes:["HUMAN","AI"],
    scope:{enterpriseId:org}
  }]
});
async function fixture(fn){
  const random=randomUUID().replaceAll("-","").slice(0,12);
  const schema="cv03_cv04_lease_"+random;
  const hostRole="cv04_host_"+random,workerRole="cv04_worker_"+random;
  const hostPw="CVO4_h_"+randomUUID().replaceAll("-","");
  const workerPw="CVO4_w_"+randomUUID().replaceAll("-","");
  const q='"'+schema+'"';
  const admin=postgres(url,{max:3,connect_timeout:10,prepare:false});
  let raw,host,workerA,workerB,created=false;
  try{
    await preparePostgresConditionalResourceSchemaV010({connectionString:url,schema});
    await prepareIsolatedDictionaryExportAuditV010({
      connectionString:url,schema,isolatedTestOnly:true
    });
    await admin.unsafe('CREATE ROLE "'+hostRole+
      '" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD \''+hostPw+'\'');
    await admin.unsafe('CREATE ROLE "'+workerRole+
      '" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD \''+workerPw+'\'');
    created=true;
    await prepareIsolatedDictionaryExportSqlLeaseV010({
      connectionString:url,schema,hostLoginRole:hostRole,
      workerLoginRole:workerRole,isolatedTestOnly:true
    });
    const hostUrl=u(url,hostRole,hostPw),workerUrl=u(url,workerRole,workerPw);
    host=createIsolatedDictionaryExportSqlHostLeaseIssuerV010({
      connectionString:hostUrl,schema,isolatedTestOnly:true
    });
    workerA=createIsolatedDictionaryExportSqlWorkerLeaseV010({
      connectionString:workerUrl,schema,isolatedTestOnly:true
    });
    workerB=createIsolatedDictionaryExportSqlWorkerLeaseV010({
      connectionString:workerUrl,schema,isolatedTestOnly:true
    });
    raw=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
    const resources=createMemoryEnterpriseResourceRepositoryV010();
    const dictionary=createBusinessDictionaryRepositoryV010(resources);
    const saved=dictionary.saveDraft({contextId,dictionaryId:"cv04-lease-d1",
      expectedVersion:0,displayName:"Authenticated Host Worker Export",
      options:[{code:"PRIVATE",label:{default:"Do not export"},status:"ACTIVE"}],
      actorSubjectId:"export-member",recordedAt:new Date().toISOString()});
    dictionary.publish({contextId,dictionaryId:"cv04-lease-d1",
      expectedVersion:saved.version,actorSubjectId:"export-member",
      actorType:"HUMAN",recordedAt:new Date().toISOString()});
    const flags={membership:true,active:true,granted:true};
    const owner=createDictionaryExportJobOwnerV010({
      repository:dictionary,
      resources:createIsolatedEncryptedDictionaryExportPgStoreV010({
        resources:raw,encryptionKey:randomBytes(32),keyId:"cv04-lease-k1",
        isolatedTestOnly:true
      }),
      isolatedTestOnly:true,
      resolveAuthorizationProvider:()=>flags.granted?permission():undefined,
      hasLiveRelationship:()=>flags.membership,
      isFeatureActive:()=>flags.active,
      now:()=>new Date()
    });
    await fn({admin,host,workerA,workerB,hostRole,workerRole,
      hostUrl,workerUrl,raw,owner,flags,schema,context:ctx(),q});
  }finally{
    for(const v of [host,workerA,workerB,raw])if(v)await v.close();
    await admin.unsafe("DROP SCHEMA IF EXISTS "+q+" CASCADE");
    if(created){
      await admin.unsafe('DROP ROLE "'+hostRole+'"');
      await admin.unsafe('DROP ROLE "'+workerRole+'"');
    }
    await admin.end();
  }
}
const approve=(job,rev=0,who="export-member",orgId=org)=>({
  contextId,jobId:job.jobId,expectedRevision:rev,
  enterpriseId:orgId,subjectId:who,actorType:"HUMAN",
  approvalId:"host-approved-"+randomUUID()
});

test("CV04 actual PG: Host physical LOGIN issues opaque permit; Worker physical LOGIN cannot read raw jobs/audit or issue",requiresDB,async()=>{
  await fixture(async({admin,host,workerA,workerRole,hostRole,hostUrl,workerUrl,owner,schema})=>{
    const queued=await owner.request(ctx(),request("cv04_lease_real_001"));
    const token=await host.issue(approve(queued));
    assert.match(token,/^[a-f0-9]{32}$/u);
    // Separate SQL sessions; both are physically low privileged.
    const h=postgres(hostUrl,{max:1,prepare:false});
    const w=postgres(workerUrl,{max:1,prepare:false});
    try{
      const identity=await w.unsafe("SELECT session_user AS who");
      assert.equal(identity[0].who,workerRole);
      const hostIdentity=await h.unsafe("SELECT session_user AS who");
      assert.equal(hostIdentity[0].who,hostRole);
      for(const client of [h,w]){
        await assert.rejects(client.unsafe('SELECT resource FROM "'+
          schema+'".resources'),/permission denied/i);
        await assert.rejects(client.unsafe('SELECT * FROM "'+
          schema+'".cv04_export_work_permits'),/permission denied/i);
        await assert.rejects(client.unsafe('SELECT * FROM "'+
          schema+'".cv04_export_work_leases'),/permission denied/i);
        await assert.rejects(client.unsafe('SELECT * FROM "'+
          schema+'".cv04_export_audit'),/permission denied/i);
        await assert.rejects(client.unsafe('UPDATE "'+
          schema+'".resources SET revision=9'),/permission denied/i);
      }
      await assert.rejects(w.unsafe('SELECT "'+schema+
        '".cv04_export_issue_lease($1,$2,$3,$4,$5,$6,$7)',[
        contextId,queued.jobId,0,org,"export-member","HUMAN","fake-approval"
      ]),/permission denied|HOST_LOGIN_REQUIRED/i);
      await assert.rejects(h.unsafe('SELECT "'+schema+
        '".cv04_export_claim_lease($1)',[token]),
        /permission denied|WORKER_LOGIN_REQUIRED/i);
    }finally{await h.end();await w.end();}
    const lease=await workerA.claim(token);
    assert.equal(lease.epoch,1);
    assert.equal(lease.jobId,queued.jobId);
    assert.equal(lease.contextId,contextId);
    await assert.rejects(workerA.claim(token),/CV04_EXPORT_SQL_PERMIT_NOT_ACTIVE/);
    await assert.rejects(workerA.complete(token,1),/CV04_EXPORT_SQL_OWNER_NOT_READY/);
    assert.equal((await owner.run(ctx(),queued.jobId)).state,"READY");
    assert.equal(await workerA.complete(token,1),"DONE");
    assert.equal((await host.status(contextId,queued.jobId)).state,"DONE");
    const downloaded=await owner.download(ctx(),queued.jobId);
    assert.ok(downloaded.content.includes("Authenticated Host Worker Export"));
    assert.ok(!downloaded.content.includes("Do not export"));
    console.log("CV04_EXPORT_PHYSICAL_SQL_HOST_WORKER_ONE_SHOT_PROVENANCE_PASS");
  });
});

test("CV04 actual PG: concurrent distinct permits only one lease claimant; stale epoch, replay and attempts fail",requiresDB,async()=>{
  await fixture(async({admin,host,workerA,workerB,owner,schema})=>{
    const queued=await owner.request(ctx(),request("cv04_lease_race_002"));
    const tokens=await Promise.all([
      host.issue(approve(queued)),host.issue(approve(queued))
    ]);
    const first=await Promise.allSettled([workerA.claim(tokens[0]),workerB.claim(tokens[1])]);
    assert.equal(first.filter(x=>x.status==="fulfilled").length,1);
    assert.equal(first.filter(x=>x.status==="rejected").length,1);
    const winner=first.find(x=>x.status==="fulfilled").value;
    const winnerToken=first[0].status==="fulfilled"?tokens[0]:tokens[1];
    const loserToken=first[0].status==="rejected"?tokens[0]:tokens[1];
    assert.equal(winner.epoch,1);
    await assert.rejects(workerB.claim(loserToken),
      /CV04_EXPORT_SQL_LEASE_ACTIVE_OR_EXHAUSTED/);
    // Simulate a crashed worker's lease expiring WITHOUT mutating Owner data.
    // Only privileged fixture admin does this, not the worker SQL credential.
    await admin.unsafe('UPDATE "'+schema+
      '".cv04_export_work_leases SET claimed_until=clock_timestamp()-interval \'1 second\''+
      ' WHERE job_id=$1',[queued.jobId]);
    const reclaimed=await workerB.claim(loserToken);
    assert.equal(reclaimed.epoch,2);
    await assert.rejects(workerA.complete(winnerToken,1),
      /CV04_EXPORT_SQL_STALE_LEASE_FENCE/);
    assert.equal((await host.status(contextId,queued.jobId)).epoch,2);
    await assert.rejects(workerA.claim(winnerToken),
      /CV04_EXPORT_SQL_PERMIT_NOT_ACTIVE/);
    await admin.unsafe('UPDATE "'+schema+
      '".cv04_export_work_leases SET claimed_until=clock_timestamp()-interval \'1 second\''+
      ' WHERE job_id=$1',[queued.jobId]);
    const third=await host.issue(approve(queued));
    await assert.rejects(workerA.claim(third),
      /CV04_EXPORT_SQL_LEASE_ACTIVE_OR_EXHAUSTED/);
    console.log("CV04_EXPORT_SQL_MULTI_WORKER_CAS_EPOCH_FENCING_PASS");
  });
});

test("CV04 actual PG: Host revoke fences claimed Worker, wrong scope/subject, stale revision and expired token deny",requiresDB,async()=>{
  await fixture(async({admin,host,workerA,owner,flags,schema})=>{
    const queued=await owner.request(ctx(),request("cv04_lease_revoke_003"));
    await assert.rejects(host.issue(approve(queued,0,"forged-subject")),
      /CV04_EXPORT_SQL_JOB_NOT_ADMISSIBLE/);
    await assert.rejects(host.issue(approve(queued,0,"export-member","foreign-enterprise")),
      /CV04_EXPORT_SQL_JOB_NOT_ADMISSIBLE/);
    await assert.rejects(host.issue(approve(queued,9)),
      /CV04_EXPORT_SQL_JOB_NOT_ADMISSIBLE/);
    const expired=await host.issue(approve(queued));
    await admin.unsafe('UPDATE "'+schema+
      '".cv04_export_work_permits SET expires_at=clock_timestamp()-interval \'1 second\''+
      ' WHERE token_hash=md5($1)',[expired]);
    await assert.rejects(workerA.claim(expired),/CV04_EXPORT_SQL_PERMIT_NOT_ACTIVE/);
    const fresh=await host.issue(approve(queued));
    const lease=await workerA.claim(fresh);
    assert.equal(lease.epoch,1);
    assert.equal(await host.revoke(contextId,queued.jobId),"REVOKED");
    flags.membership=false;
    await assert.rejects(owner.run(ctx(),queued.jobId),
      /COLLECTION_EXPORT_PERMISSION_DENIED/);
    flags.membership=true;
    assert.equal((await owner.run(ctx(),queued.jobId)).state,"READY");
    await assert.rejects(workerA.complete(fresh,1),
      /CV04_EXPORT_SQL_PERMIT_NOT_CLAIMED|CV04_EXPORT_SQL_STALE_LEASE_FENCE/);
    assert.equal((await host.status(contextId,queued.jobId)).state,"REVOKED");
    await assert.rejects(host.issue(approve(queued)),
      /CV04_EXPORT_SQL_JOB_NOT_ADMISSIBLE/,
      "READY owner cannot be re-issued as a queued job");
    flags.granted=false;
    await assert.rejects(owner.download(ctx(),queued.jobId),
      /COLLECTION_EXPORT_AUTHORIZATION_UNAVAILABLE/);
    console.log("CV04_EXPORT_SQL_LEASE_REVOKE_STALE_AUTHORITY_FAILCLOSED_PASS");
  });
});

test("CV04 lease installer and client never accept production mode, unsafe schema or identity",async()=>{
  await assert.rejects(prepareIsolatedDictionaryExportSqlLeaseV010({
    connectionString:"postgres://invalid.invalid/db",schema:"public",
    hostLoginRole:"cv04_host_safe",workerLoginRole:"cv04_worker_safe",
    isolatedTestOnly:true
  }),/CV04_EXPORT_LEASE_ISOLATED_SCHEMA_REQUIRED/);
  await assert.rejects(prepareIsolatedDictionaryExportSqlLeaseV010({
    connectionString:"postgres://invalid.invalid/db",schema:"cv03_safe",
    hostLoginRole:"cv04_host_safe",workerLoginRole:"cv04_host_safe",
    isolatedTestOnly:true
  }),/CV04_EXPORT_LEASE_DISTINCT_SQL_IDENTITIES_REQUIRED/);
  await assert.rejects(prepareIsolatedDictionaryExportSqlLeaseV010({
    connectionString:"postgres://invalid.invalid/db",schema:"cv03_safe",
    hostLoginRole:"cv04_host_safe",workerLoginRole:"cv04_worker_safe",
    isolatedTestOnly:false
  }),/CV04_EXPORT_LEASE_PRODUCTION_INSTALL_DENIED/);
  assert.throws(()=>createIsolatedDictionaryExportSqlWorkerLeaseV010({
    connectionString:"postgres://invalid.invalid/db",schema:"cv03_safe",
    isolatedTestOnly:false
  }),/CV04_EXPORT_LEASE_PRODUCTION_USE_DENIED/);
});
