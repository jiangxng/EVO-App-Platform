import test from "node:test";
// Explicit isolated test environment: production wiring must fail closed.
process.env.NODE_ENV="test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createFileEnterpriseResourceRepositoryV010,createMemoryEnterpriseResourceRepositoryV010}
  from "../../dist/providers/enterprise-context/resources.js";
import {createBusinessDictionaryRepositoryV010} from "../../dist/apps/business-dictionary/repository.js";
import {createHostStaticAuthorizationProviderV010} from "../../dist/providers/authorization/runtime.js";
import {createDictionaryExportJobOwnerV010} from "../../dist/apps/business-dictionary/export-jobs.js";

const ENT_A="enterprise-context:a",ENT_B="enterprise-context:b";
function context(subjectId="owner",actorType="HUMAN",enterpriseId="ent-a",contextId=ENT_A){
  return {
    contractVersion:"0.1.0",
    principal:{contractVersion:"0.1.0",subjectId,actorType,
      identityProviderId:"host.bearer-session",sessionId:"session-"+subjectId+"-"+actorType},
    scope:{contractVersion:"0.1.0",enterpriseId,userId:subjectId},
    context:{contractVersion:"0.1.0",
      activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",contextId,enterpriseId},
      personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
        contextId:"personal:"+subjectId,ownerSubjectId:subjectId}
    },correlationId:"test-dictionary-export-job"
  };
}
const query={view:"published",sort:"dictionaryId",direction:"asc"};
const request=(key="key_export_001",fields=["dictionaryId","displayName"])=>({
  idempotencyKey:key,query,fieldIds:fields
});
function setup(opts={}){
  const resources=opts.resources??createMemoryEnterpriseResourceRepositoryV010();
  const repository=createBusinessDictionaryRepositoryV010(opts.repositoryResources??resources);
  let time=Date.parse("2026-11-12T00:00:00.000Z");
  const live=new Set(["owner","member","owner:AI","member:AI"]);
  let exportGranted=true,featureActive=true;
  const readOnly=createHostStaticAuthorizationProviderV010({
    contractVersion:"0.1.0",rules:[{id:"read-only",effect:"ALLOW",actions:["dictionary.read"],
      subjectIds:["owner","member"],actorTypes:["HUMAN","AI"]}]
  });
  const exportRule=createHostStaticAuthorizationProviderV010({
    contractVersion:"0.1.0",rules:[{id:"explicit-export",effect:"ALLOW",actions:["dictionary.export"],
      subjectIds:["owner","member"],actorTypes:["HUMAN","AI"]}]
  });
  const make=()=>createDictionaryExportJobOwnerV010({
    repository,resources,isolatedTestOnly:true,
    isFeatureActive:()=>featureActive,
    hasLiveRelationship:ctx=>live.has(ctx.principal.subjectId)
      || live.has(ctx.principal.subjectId+":"+ctx.principal.actorType),
    resolveAuthorizationProvider:()=>exportGranted?exportRule:readOnly,
    now:()=>new Date(time)
  });
  const seed=(count=205,enterprise=ENT_A)=>{
    for(let i=0;i<count;i++){
      const dictionaryId="d"+String(i).padStart(4,"0");
      const saved=repository.saveDraft({
        contextId:enterprise,dictionaryId,expectedVersion:0,
        displayName:i===0?"=HYPERLINK(\"malicious\")":"Visible "+i,
        options:[{code:"SECRET_OPTION_"+i,
          label:{default:"Private option "+i},status:"ACTIVE"}],
        actorSubjectId:"owner",recordedAt:new Date(time).toISOString()
      });
      repository.publish({contextId:enterprise,dictionaryId,
        expectedVersion:saved.version,actorSubjectId:"owner",actorType:"HUMAN",
        recordedAt:new Date(time).toISOString()});
    }
  };
  return {resources,repository,make,seed,live,
    setGranted:x=>exportGranted=x,
    setActive:x=>featureActive=x,
    advance:ms=>{time+=ms}};
}
test("CV04 Dictionary Owner isolated durable 3-page snapshot, same-field CSV, idempotency and restart",async()=>{
  const dir=mkdtempSync(join(tmpdir(),"cv04-dict-export-"));
  try{
    const path=join(dir,"resources.json");
    const h=setup({
      resources:createFileEnterpriseResourceRepositoryV010(path),
      repositoryResources:createMemoryEnterpriseResourceRepositoryV010()
    });
    h.seed();
    const owner=h.make(),ctx=context();
    const queued=await owner.request(ctx,request());
    assert.equal(queued.state,"QUEUED");
    assert.equal(queued.rows,0);
    const same=await owner.request(ctx,request());
    assert.equal(same.jobId,queued.jobId);
    await assert.rejects(owner.request(ctx,request("key_export_001",["dictionaryId"])),
      /COLLECTION_EXPORT_IDEMPOTENCY_CONFLICT/);
    const secondOwner=h.make();
    const processed=await secondOwner.run(ctx,queued.jobId);
    assert.equal(processed.state,"READY");
    assert.equal(processed.rows,205);
    // Reuse same live Domain Owner and provider across restart, but disk-backed
    // job repository is newly opened; no transient in-process job cache.
    const reopened=createDictionaryExportJobOwnerV010({
      repository:h.repository,resources:createFileEnterpriseResourceRepositoryV010(path),
      isolatedTestOnly:true,isFeatureActive:()=>true,hasLiveRelationship:()=>true,
      resolveAuthorizationProvider:()=>createHostStaticAuthorizationProviderV010({
        contractVersion:"0.1.0",rules:[{id:"export-only",effect:"ALLOW",
          actions:["dictionary.export"],subjectIds:["owner"],actorTypes:["HUMAN"]}]
      }),
      now:()=>new Date("2026-11-12T00:00:00.000Z")
    });
    const download=await reopened.download(ctx,queued.jobId);
    assert.ok(download.content.startsWith("\uFEFF"));
    assert.equal((download.content.match(/"dictionaryId","displayName"/g)||[]).length,1);
    assert.ok(download.content.includes("d0204"));
    assert.ok(download.content.includes("'=HYPERLINK"));
    assert.ok(!download.content.includes("SECRET_OPTION")&&!download.content.includes("Private option"));
    assert.equal((download.content.match(/\r\n/g)||[]).length,206);
    assert.equal((await reopened.status(ctx,queued.jobId)).state,"READY");
    const internal=createFileEnterpriseResourceRepositoryV010(path).get({
      contextId:ENT_A,namespace:"evo.dictionary.export-jobs",
      collectionId:"bounded-csv-jobs",resourceType:"evo.dictionary.export.job",
      resourceId:queued.jobId
    }).payload;
    assert.deepEqual(internal.audit.map(x=>x.type),[
      "REQUESTED","STARTED","STARTED","COMPLETED","READY","DOWNLOAD_AUTHORIZED"]);
    assert.equal(internal.pages.length,0,"Release snapshot rows after READY");
    assert.ok(!JSON.stringify(internal.audit).includes("SECRET_OPTION")
      &&!JSON.stringify(internal.audit).includes("Visible 4"));
    assert.equal((await owner.run(ctx,queued.jobId)).state,"READY");
    console.log("CV04_DICTIONARY_EXPORT_OWNER_DURABLE_RESTART_205_ROWS_PASS");
  }finally { rmSync(dir,{recursive:true,force:true}); }
});
test("CV04 READ grant alone cannot request independent EXPORT; revoke and feature disable deny delivery",async()=>{
  const h=setup();h.seed(3);
  const owner=h.make(),ctx=context();
  h.setGranted(false);
  await assert.rejects(owner.request(ctx,request()),/COLLECTION_EXPORT_PERMISSION_DENIED/);
  h.setGranted(true);
  const job=await owner.request(ctx,request());
  await owner.run(ctx,job.jobId);
  h.setGranted(false);
  await assert.rejects(owner.download(ctx,job.jobId),/COLLECTION_EXPORT_PERMISSION_DENIED/);
  h.setGranted(true);
  h.live.delete("owner");
  await assert.rejects(owner.download(ctx,job.jobId),/COLLECTION_EXPORT_PERMISSION_DENIED/);
  h.live.add("owner");
  h.setActive(false);
  await assert.rejects(owner.download(ctx,job.jobId),/COLLECTION_EXPORT_PERMISSION_DENIED/);
  h.setActive(true);
  assert.equal((await owner.download(ctx,job.jobId)).jobId,job.jobId);
  console.log("CV04_DICTIONARY_EXPORT_OWNER_SEPARATE_GRANT_REVOKE_DOWNLOAD_GATE_PASS");
});
test("CV04 Human/AI same Subject and other Enterprise cannot steal a persisted job",async()=>{
  const h=setup();h.seed(3);
  const owner=h.make(),ctx=context(),other=context("member");
  const queued=await owner.request(ctx,request());
  await assert.rejects(owner.download(other,queued.jobId),/COLLECTION_EXPORT_JOB_NOT_FOUND/);
  await assert.rejects(owner.status(context("owner","AI"),queued.jobId),
    /COLLECTION_EXPORT_JOB_NOT_FOUND/);
  await assert.rejects(owner.run(context("owner","HUMAN","ent-b",ENT_B),queued.jobId),
    /COLLECTION_EXPORT_JOB_NOT_FOUND/);
  const good=await owner.run(ctx,queued.jobId);
  assert.equal(good.state,"READY");
  await assert.rejects(owner.download(other,queued.jobId),/COLLECTION_EXPORT_JOB_NOT_FOUND/);
  const agentQueued=await owner.request(context("member","AI"),request());
  assert.notEqual(agentQueued.jobId,queued.jobId);
  await owner.run(context("member","AI"),agentQueued.jobId);
  assert.equal((await owner.download(context("member","AI"),agentQueued.jobId)).content,
    (await owner.download(ctx,queued.jobId)).content);
  console.log("CV04_DICTIONARY_EXPORT_OWNER_HUMAN_AI_SCOPE_ISOLATION_PASS");
});
test("CV04 real fixed-snapshot expiry deletes bytes, with no resurrected idempotency key",async()=>{
  const h=setup();h.seed(2);
  const owner=h.make(),ctx=context(),job=await owner.request(ctx,request());
  await owner.run(ctx,job.jobId);
  h.advance(16*60*1000);
  await assert.rejects(owner.download(ctx,job.jobId),/COLLECTION_EXPORT_DOWNLOAD_NOT_READY/);
  assert.equal((await owner.status(ctx,job.jobId)).state,"EXPIRED");
  const same=await owner.request(ctx,request());
  assert.equal(same.jobId,job.jobId);
  assert.equal(same.state,"EXPIRED");
});
test("CV04 budget, malformed and private column requests fail before persistent job exists",async()=>{
  const h=setup();h.seed(1001);const owner=h.make(),ctx=context();
  await assert.rejects(owner.request(ctx,request()),/COLLECTION_EXPORT_ROW_BUDGET_EXCEEDED/);
  for(const input of [
    request("abc",["dictionaryId"]),request("key_test_005",["options"]),
    request("key_test_006",["dictionaryId","dictionaryId"]),
    {...request("key_test_007"),query:{...query,sql:"SELECT *"}}
  ])await assert.rejects(owner.request(ctx,input),/COLLECTION_EXPORT_REQUEST_INVALID/);
});
test("CV04 fail closed when production-grade shared authority is absent",()=>{
  const h=setup();
  assert.throws(()=>createDictionaryExportJobOwnerV010({
    repository:h.repository,resources:h.resources,
    hasLiveRelationship:()=>true,isFeatureActive:()=>true,
    resolveAuthorizationProvider:()=>undefined
  }),/COLLECTION_EXPORT_SHARED_AUTHORITY_REQUIRED/);
});
test("CV04 recovering previously RUNNING CAS task resumes from persistent snapshot after lease",async()=>{
  const h=setup();h.seed(3);const ctx=context(),owner=h.make();
  const q=await owner.request(ctx,request("key_resume_2026"));
  const addr={contextId:ENT_A,namespace:"evo.dictionary.export-jobs",
    collectionId:"bounded-csv-jobs",resourceType:"evo.dictionary.export.job",
    resourceId:q.jobId};
  const res=h.resources.get(addr);
  h.resources.putIfRevision({
    ...addr,schemaRef:res.schemaRef,ownerPackageId:"evo-business-dictionary",
    payload:{...res.payload,state:"RUNNING",attempt:1,leaseUntil:"2026-11-11T00:00:00Z"},
    actorSubjectId:"owner",recordedAt:"2026-11-12T00:00:00Z",
    expectedRevision:res.revision
  });
  const resumed=await h.make().run(ctx,q.jobId);
  assert.equal(resumed.state,"READY");
  assert.equal(resumed.attempts,2);
  assert.ok((await h.make().download(ctx,q.jobId)).content.includes("d0002"));
});
