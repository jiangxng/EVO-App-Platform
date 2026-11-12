import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,randomBytes} from "node:crypto";
import postgres from "postgres";
import {
  createPostgresConditionalResourceRepositoryV010,
  preparePostgresConditionalResourceSchemaV010
} from "../../dist/providers/enterprise-context/resources-postgres.js";
import {createMemoryEnterpriseResourceRepositoryV010}
  from "../../dist/providers/enterprise-context/resources.js";
import {createBusinessDictionaryRepositoryV010}
  from "../../dist/apps/business-dictionary/repository.js";
import {createHostStaticAuthorizationProviderV010}
  from "../../dist/providers/authorization/runtime.js";
import {createDictionaryExportJobOwnerV010}
  from "../../dist/apps/business-dictionary/export-jobs.js";
import {createIsolatedEncryptedDictionaryExportPgStoreV010}
  from "../../dist/apps/business-dictionary/export-job-pg-store.js";

const url=process.env.CV04_EXPORT_TEST_DATABASE_URL;
const requiresDb={
  skip:!url&&"Set CV04_EXPORT_TEST_DATABASE_URL for a real isolated PostgreSQL server",
  timeout:120000
};
const CONTEXT="enterprise-context:cv04-a",ENTERPRISE="cv04-a";
const keyId="cv04-test-key-v1";
const jobAddress=jobId=>({contextId:CONTEXT,namespace:"evo.dictionary.export-jobs",
  collectionId:"bounded-csv-jobs",resourceType:"evo.dictionary.export.job",resourceId:jobId});
const principal=(subjectId="owner",actorType="HUMAN",id=CONTEXT,enterprise=ENTERPRISE)=>({
  contractVersion:"0.1.0",
  principal:{contractVersion:"0.1.0",subjectId,actorType,
    identityProviderId:"cv04-test",sessionId:"cv04-session-"+subjectId},
  scope:{contractVersion:"0.1.0",enterpriseId:enterprise,userId:subjectId},
  context:{contractVersion:"0.1.0",
    personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
      contextId:"personal:"+subjectId,ownerSubjectId:subjectId},
    activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",contextId:id,enterpriseId:enterprise}
  },
  correlationId:"cv04-pg-proof"
});
const permissionProvider=()=>createHostStaticAuthorizationProviderV010({
  contractVersion:"0.1.0",
  rules:[{id:"cv04-independent-export",effect:"ALLOW",actions:["dictionary.export"],
    subjectIds:["owner","member"],actorTypes:["HUMAN","AI"]}]
});
const readOnlyProvider=()=>createHostStaticAuthorizationProviderV010({
  contractVersion:"0.1.0",
  rules:[{id:"cv04-read-only",effect:"ALLOW",actions:["dictionary.read"],
    subjectIds:["owner","member"],actorTypes:["HUMAN","AI"]}]
});
function domain(){
  const resources=createMemoryEnterpriseResourceRepositoryV010();
  const repo=createBusinessDictionaryRepositoryV010(resources);
  for(let i=0;i<4;i++){
    const dictionaryId="cv04-pg-"+i;
    repo.saveDraft({contextId:CONTEXT,dictionaryId,
      displayName:i===0?"Shared PG Secret =HYPERLINK(\"X\")":"Visible "+i,
      expectedVersion:0,
      options:[{code:"PRIVATE_OPTION_"+i,label:{default:"PRIVATE_LABEL_"+i},status:"ACTIVE"}],
      actorSubjectId:"owner",recordedAt:"2026-11-12T00:00:00Z"});
    repo.publish({contextId:CONTEXT,dictionaryId,expectedVersion:1,
      actorSubjectId:"owner",actorType:"HUMAN",recordedAt:"2026-11-12T00:00:00Z"});
  }
  return repo;
}
function owner(repository,resource,now,decisions){
  return createDictionaryExportJobOwnerV010({
    repository,resources:resource,isolatedTestOnly:true,
    isFeatureActive:()=>decisions.feature,
    hasLiveRelationship:()=>decisions.membership,
    resolveAuthorizationProvider:()=>decisions.export?permissionProvider():readOnlyProvider(),
    now:()=>new Date(now.value)
  });
}
const request=(key="cv04_pg_run_001",fields=["dictionaryId","displayName"])=>({
  idempotencyKey:key,query:{view:"published",sort:"dictionaryId",direction:"asc"},
  fieldIds:fields
});
function pgResource(raw,key,keyReference=keyId){
  return createIsolatedEncryptedDictionaryExportPgStoreV010({
    resources:raw,encryptionKey:key,keyId:keyReference,isolatedTestOnly:true
  });
}
async function fixture(fn){
  const schema="cv03_cv04_export_"+randomUUID().replaceAll("-","").slice(0,14);
  await preparePostgresConditionalResourceSchemaV010({connectionString:url,schema});
  const sql=postgres(url,{max:3,connect_timeout:10});
  const rawA=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
  const rawB=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
  const key=randomBytes(32);
  const encryptedA=pgResource(rawA,key);
  const encryptedB=pgResource(rawB,key);
  const repo=domain();
  const clock={value:Date.parse("2026-11-12T00:00:00Z")};
  const decision={feature:true,membership:true,export:true};
  try{
    await fn({schema,sql,rawA,rawB,encryptedA,encryptedB,key,repo,clock,decision,
      ownerA:owner(repo,encryptedA,clock,decision),
      ownerB:owner(repo,encryptedB,clock,decision)});
  }finally{
    await Promise.all([rawA.close(),rawB.close()]);
    await sql.unsafe('DROP SCHEMA "'+schema+'" CASCADE');
    await sql.end();
  }
}
test("CV04 real PostgreSQL: encrypted Owner snapshot, two connections, diskless restart and metadata-only CAS audit",requiresDb,async()=>{
  await fixture(async({schema,sql,rawA,encryptedA,encryptedB,repo,clock,decision,ownerA,ownerB,key})=>{
    const ctx=principal();
    const queued=await ownerA.request(ctx,request());
    assert.equal(queued.state,"QUEUED");
    const a=await ownerB.status(ctx,queued.jobId);
    assert.equal(a.jobId,queued.jobId);
    const rows=await sql.unsafe('SELECT resource::text AS resource FROM "'+schema+'".resources');
    assert.equal(rows.length,1);
    const persistent=String(rows[0].resource);
    for(const secret of ["Shared PG Secret","Visible 1","PRIVATE_OPTION_",
      "dictionaryId","displayName","PRIVATE_LABEL_","HYPERLINK"]){
      assert.equal(persistent.includes(secret),false,"Persisted JSONB must not expose: "+secret);
    }
    assert.ok(persistent.includes("AES-256-GCM"));
    assert.ok(persistent.includes("DOWNLOAD")===false);
    const ready=await ownerB.run(ctx,queued.jobId);
    assert.equal(ready.state,"READY");
    assert.equal(ready.rows,4);
    const freshRaw=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
    try{
      const restarted=owner(repo,pgResource(freshRaw,Buffer.from(key)),
        clock,decision);
      assert.equal((await restarted.status(ctx,queued.jobId)).state,"READY");
      const afterRestart=await restarted.download(ctx,queued.jobId);
      assert.ok(afterRestart.content.includes("Shared PG Secret"));
      assert.equal(afterRestart.fileName,"business-dictionaries-export.csv");
    }finally{
      await freshRaw.close();
    }
    const resolved=await ownerA.download(ctx,queued.jobId);
    assert.ok(resolved.content.startsWith("\uFEFF"));
    assert.ok(resolved.content.includes("Shared PG Secret"));
    assert.ok(!resolved.content.includes("PRIVATE_OPTION_"));
    assert.equal((resolved.content.match(/\r\n/gu)||[]).length,5);
    const resource=await encryptedB.get(jobAddress(queued.jobId));
    const history=resource.payload.audit;
    assert.deepEqual(history.map(x=>x.type),["REQUESTED","STARTED","STARTED",
      "COMPLETED","READY","DOWNLOAD_AUTHORIZED"]);
    assert.ok(!JSON.stringify(history).includes("PRIVATE_LABEL_"));
    assert.ok(!JSON.stringify(history).includes("Visible 1"));
    const rawAfter=await rawA.get(jobAddress(queued.jobId));
    assert.equal(rawAfter.payload.secret.algorithm,"AES-256-GCM");
    assert.equal(rawAfter.payload.meta.state,"READY");
    assert.ok(!JSON.stringify(rawAfter.payload).includes("Shared PG Secret"));
    console.log("CV04_PG_ENCRYPTED_OWNER_TWO_CONNECTION_RESTART_AUDIT_PASS");
  });
});

test("CV04 PostgreSQL CAS: cross-process-like contenders cannot both claim one job",requiresDb,async()=>{
  await fixture(async({ownerA,ownerB,encryptedA,encryptedB})=>{
    const ctx=principal(),queued=await ownerA.request(ctx,request("cv04_pg_cas_02"));
    const competing=await Promise.allSettled([
      ownerA.run(ctx,queued.jobId),ownerB.run(ctx,queued.jobId)
    ]);
    const successes=competing.filter(x=>x.status==="fulfilled");
    const rejects=competing.filter(x=>x.status==="rejected");
    assert.equal(successes.length,1,JSON.stringify(competing));
    assert.equal(rejects.length,1,JSON.stringify(competing));
    assert.match(String(rejects[0].reason),/ENTERPRISE_RESOURCE_REVISION_CONFLICT|COLLECTION_EXPORT_JOB_ALREADY_RUNNING/);
    assert.equal((await ownerA.status(ctx,queued.jobId)).state,"READY");
    const persisted=await encryptedB.get(jobAddress(queued.jobId));
    assert.equal(persisted.payload.attempt,1);
    assert.deepEqual(persisted.payload.audit.map(x=>x.type),
      ["REQUESTED","STARTED","STARTED","COMPLETED","READY"]);
    // Raw clients alone do not get the decrypted job bytes, even if they can
    // read resource metadata in this isolated proof schema.
    assert.equal((await encryptedA.get(jobAddress(queued.jobId))).payload.csv.startsWith("\uFEFF"),true);
    console.log("CV04_PG_ENCRYPTED_OWNER_TWO_WRITER_CAS_PASS");
  });
});
test("CV04 PG encrypted export denies raw adapter, wrong key, metadata tampering, principal theft and auth revoke",requiresDb,async()=>{
  await fixture(async({schema,sql,key,rawA,encryptedA,encryptedB,repo,clock,decision,ownerA,ownerB})=>{
    const ctx=principal(),queued=await ownerA.request(ctx,request("cv04_pg_guard_03"));
    assert.throws(()=>owner(repo,rawA,clock,decision),
      /COLLECTION_EXPORT_SHARED_AUTHORITY_REQUIRED/);
    await assert.rejects(ownerB.status(principal("member"),queued.jobId),
      /COLLECTION_EXPORT_JOB_NOT_FOUND/);
    await assert.rejects(ownerB.status(principal("owner","AI"),queued.jobId),
      /COLLECTION_EXPORT_JOB_NOT_FOUND/);
    await assert.rejects(ownerB.status(principal("owner","HUMAN",
      "cv04-b","enterprise-context:cv04-b"),queued.jobId),
      /COLLECTION_EXPORT_JOB_NOT_FOUND/);
    const alienKey=pgResource(rawA,randomBytes(32));
    await assert.rejects(alienKey.get(jobAddress(queued.jobId)),
      /COLLECTION_EXPORT_PG_CIPHERTEXT_INTEGRITY_FAILED/);
    const otherId=pgResource(rawA,key,"rotated-key-id");
    await assert.rejects(otherId.get(jobAddress(queued.jobId)),
      /COLLECTION_EXPORT_PG_KEY_OR_CIPHER_INVALID/);
    decision.export=false;
    await assert.rejects(ownerB.run(ctx,queued.jobId),
      /COLLECTION_EXPORT_PERMISSION_DENIED/);
    decision.export=true;
    await ownerB.run(ctx,queued.jobId);
    decision.membership=false;
    await assert.rejects(ownerA.download(ctx,queued.jobId),
      /COLLECTION_EXPORT_PERMISSION_DENIED/);
    decision.membership=true;
    await sql.unsafe('UPDATE "'+schema+'".resources SET resource=jsonb_set(resource,'+
      "'{payload,meta,state}', '"EXPIRED"'::jsonb) WHERE resource_id=$1",[queued.jobId]);
    await assert.rejects(encryptedB.get(jobAddress(queued.jobId)),
      /COLLECTION_EXPORT_PG_CIPHERTEXT_INTEGRITY_FAILED/);
    console.log("CV04_PG_ENCRYPTED_OWNER_WRONG_KEY_REVOKE_TAMPER_FAILCLOSED_PASS");
  });
});
test("CV04 PG encrypted audit cannot be silently rewritten across successful CAS revisions",requiresDb,async()=>{
  await fixture(async({ownerA,encryptedA,rawA})=>{
    const ctx=principal(),queued=await ownerA.request(ctx,request("cv04_pg_audit_04"));
    const addr=jobAddress(queued.jobId);
    const original=await encryptedA.get(addr);
    assert.equal(original.payload.audit.length,1);
    await assert.rejects(encryptedA.putIfRevision({
      ...addr,schemaRef:original.schemaRef,ownerPackageId:original.ownerPackageId,
      actorSubjectId:"owner",recordedAt:"2026-11-12T00:00:00Z",
      expectedRevision:original.revision,
      payload:{...original.payload,state:"RUNNING",audit:[],attempt:1}
    }),/COLLECTION_EXPORT_PG_AUDIT_HISTORY_REWRITE_DENIED/);
    assert.equal((await rawA.get(addr)).revision,0);
    const after=await ownerA.run(ctx,queued.jobId);
    assert.equal(after.state,"READY");
    console.log("CV04_PG_ENCRYPTED_OWNER_CAS_AUDIT_PREFIX_PROTECTED_PASS");
  });
});
test("CV04 PostgreSQL store construction fails closed without isolated proof and key",()=>{
  const resources={conditionalWriteConsistency:"SHARED_POSTGRES_TRANSACTION",
    get:async()=>undefined,putIfRevision:async()=>({revision:0})};
  assert.throws(()=>createIsolatedEncryptedDictionaryExportPgStoreV010({
    resources,encryptionKey:randomBytes(32),keyId:"cv04",isolatedTestOnly:false
  }),/COLLECTION_EXPORT_PG_PRODUCTION_ADMISSION_NOT_CERTIFIED/);
  assert.throws(()=>createIsolatedEncryptedDictionaryExportPgStoreV010({
    resources,encryptionKey:randomBytes(16),keyId:"cv04",isolatedTestOnly:true
  }),/COLLECTION_EXPORT_PG_KEY_CONFIG_INVALID/);
});
