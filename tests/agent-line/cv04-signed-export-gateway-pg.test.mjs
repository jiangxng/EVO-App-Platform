import test from "node:test";
import assert from "node:assert/strict";
import {createCipheriv,createHash,createHmac,randomBytes,randomUUID} from "node:crypto";
import postgres from "postgres";
import {spawn} from "node:child_process";
import {
  preparePostgresConditionalResourceSchemaV010,
  createPostgresConditionalResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources-postgres.js";
import {createIsolatedEncryptedDictionaryExportPgStoreV010}
  from "../../dist/apps/business-dictionary/export-job-pg-store.js";
import {prepareIsolatedDictionaryExportAuditV010,readIsolatedDictionaryExportAuditV010}
  from "../../dist/apps/business-dictionary/export-job-pg-audit.js";
import {cv04IsolatedSignedExportGatewaySqlV010}
  from "../../tools/cv04-isolated-signed-export-gateway.mjs";
import {createDictionaryExportJobOwnerV010}
  from "../../dist/apps/business-dictionary/export-jobs.js";
import {createMemoryEnterpriseResourceRepositoryV010}
  from "../../dist/providers/enterprise-context/resources.js";
import {createBusinessDictionaryRepositoryV010}
  from "../../dist/apps/business-dictionary/repository.js";
import {createHostStaticAuthorizationProviderV010}
  from "../../dist/providers/authorization/runtime.js";
import {createIsolatedDictionaryExportPgDispatcherV010}
  from "../../dist/apps/business-dictionary/export-job-pg-dispatch.js";
import {prepareIsolatedDictionaryExportSqlLeaseV010,
  createIsolatedDictionaryExportSqlHostLeaseIssuerV010,
  createIsolatedDictionaryExportSqlWorkerLeaseV010}
  from "../../dist/apps/business-dictionary/export-job-pg-sql-lease.js";

const url=process.env.CV04_EXPORT_TEST_DATABASE_URL;
const eligible=!!url && process.env.CV04_EXPORT_SIGNED_GATEWAY_ONLY==="YES_DISPOSABLE_CI"
  && (()=>{try{
    const u=new URL(url);
    return ["localhost","127.0.0.1"].includes(u.hostname)
      && u.pathname==="/cv04_ci";
  }catch{return false}})();
const realPG={skip:!eligible&&"Only disposable localhost/cv04_ci PostgreSQL with explicit flag",timeout:120000};
const subject="cv04-principal-a",enterprise="cv04-ent-a",ctx="enterprise-context:cv04-a";
const op="dictionary.collection.export.job.request",workerOp="dictionary.collection.export.job.worker";
const keyId="cv04-signing-fixture-k1";
const hmacSecret="CV04_TEST_ONLY_HOST_SIGNATURE_"+randomUUID();
const sha=value=>createHash("sha256").update(value).digest("hex");
const md5=value=>createHash("md5").update(value).digest("hex");
const canonical=value=>{
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==="object")return Object.fromEntries(
    Object.entries(value).filter(([,v])=>v!==undefined)
      .sort(([a],[b])=>a.localeCompare(b))
      .map(([k,v])=>[k,canonical(v)]));
  return value;
};
const json=value=>JSON.stringify(canonical(value));
const addr=id=>({
  contextId:ctx,namespace:"evo.dictionary.export-jobs",
  collectionId:"bounded-csv-jobs",resourceType:"evo.dictionary.export.job",resourceId:id
});
const policy={pageSize:100,maxPages:10,maxRows:1000,maxBytes:262144,maxDurationMs:30000};
const event=(type,rows=0,bytes=0)=>({
  eventId:randomUUID(),type,at:new Date().toISOString(),rows,bytes
});
function buildJob(jobId,createdAt=new Date().toISOString()){
  return {
    contractVersion:"0.1.0",jobId,contextId:ctx,enterpriseId:enterprise,
    subjectId:subject,actorType:"HUMAN",state:"QUEUED",
    createdAt,expiresAt:new Date(Date.now()+14*60*1000).toISOString(),
    requestDigest:sha("cv04:"+jobId),
    attempt:0,snapshotId:"dict-"+randomBytes(22).toString("hex"),rowCount:1,
    pages:[{
      contractVersion:"0.1.0",pageInfo:{page:0,pageSize:100,total:1,hasNext:false},
      collectionId:"evo.business-dictionary.directory",
      readableFieldIds:["dictionaryId","displayName"],
      rows:[{rowId:"cv04-secret",cells:{dictionaryId:"row-01",displayName:"Private CV04 Export Row"}}]
    }],
    fields:["dictionaryId","displayName"],policy,audit:[event("REQUESTED")]
  };
}
function encryptJob(job,cryptoKey,revision,prior){
  const address=addr(job.jobId);
  const {pages,csv,csvSha256,fields,policy:budget,...meta}=job;
  const privateBlob={pages,fields,policy:budget,...(csv===undefined?{}:{csv}),
    ...(csvSha256===undefined?{}:{csvSha256})};
  const aad=json({address,meta,schemaRef:"evo.dictionary.export-job/0.1.0"});
  const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",cryptoKey,iv);
  cipher.setAAD(Buffer.from(aad,"utf8"));
  const secret=Buffer.concat([cipher.update(json(privateBlob),"utf8"),cipher.final()]);
  return {
    contractVersion:"0.1.0",...address,
    schemaRef:"evo.dictionary.export-job/0.1.0",ownerPackageId:"evo-business-dictionary",
    storageKind:"DOCUMENT",lifecycleState:"ACTIVE",revision,
    createdAt:prior?.createdAt??job.createdAt,
    createdBySubjectId:prior?.createdBySubjectId??subject,
    updatedAt:revision===0?job.createdAt:new Date().toISOString(),updatedBySubjectId:subject,
    payload:{
      contractVersion:"0.1.0",kind:"dictionary.export-job.encrypted",meta,
      secret:{algorithm:"AES-256-GCM",keyId:"cv04-data-key-v1",
        iv:iv.toString("hex"),tag:cipher.getAuthTag().toString("hex"),
        ciphertext:secret.toString("base64")}
    }
  };
}
function permit(resource,opts={}){
  const doc=JSON.stringify(resource);
  const e={
    contractVersion:"0.1.0",domain:"cv04.dictionary-export.host-write/0.1.0",
    keyId,contextId:ctx,enterpriseId:enterprise,subjectId:subject,actorType:"HUMAN",
    operationId:opts.operationId??(resource.revision===0?op:workerOp),
    expectedRevision:opts.expectedRevision??(resource.revision===0?null:resource.revision-1),
    authorityEpoch:opts.authorityEpoch??1,
    issuedAt:opts.issuedAt??new Date().toISOString(),
    nonce:opts.nonce??randomUUID(),resourceSha256:sha(doc),
    ...opts.envelope
  };
  const text=JSON.stringify(e);
  return {envelope:text,signature:createHmac("sha256",hmacSecret).update(text).digest("hex"),resource:doc};
}
async function fixture(fn,{physical=false}={}){
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const schema="cv03_cv04_signed_"+suffix;
  const ownerRole="cv04_owner_"+suffix,runtimeRole="cv04_exec_"+suffix;
  const owner='"'+ownerRole+'"',runtime='"'+runtimeRole+'"',q='"'+schema+'"';
  const password="CV04_TMP_"+randomUUID().replaceAll("-","");
  const hostRole="cv04_host_"+suffix,workerRole="cv04_worker_"+suffix;
  const hostPw="CV04_H_"+randomUUID().replaceAll("-","");
  const workerPw="CV04_W_"+randomUUID().replaceAll("-","");
  const sql=postgres(url,{max:3,connect_timeout:10,prepare:false});
  let ownerCreated=false,runtimeCreated=false,schemaCreated=false;
  let hostCreated=false,workerCreated=false;
  let client,second,raw,host,workerA,workerB;
  try{
    await sql.unsafe("CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public");
    await sql.unsafe("CREATE ROLE "+owner+
      " NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION");
    ownerCreated=true;
    await sql.unsafe("CREATE ROLE "+runtime+
      " LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '"+password+"'");
    runtimeCreated=true;
    await preparePostgresConditionalResourceSchemaV010({connectionString:url,schema});
    schemaCreated=true;
    await prepareIsolatedDictionaryExportAuditV010({
      connectionString:url,schema,isolatedTestOnly:true
    });
    await sql.unsafe(cv04IsolatedSignedExportGatewaySqlV010(schema,{
      requirePhysicalWorkerLease:physical,
      ...(physical?{workerLoginRole:workerRole}:{})
    }));
    if(physical){
      await sql.unsafe("CREATE ROLE \""+hostRole+
        "\" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '"+hostPw+"'");
      hostCreated=true;
      await sql.unsafe("CREATE ROLE \""+workerRole+
        "\" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '"+workerPw+"'");
      workerCreated=true;
      await prepareIsolatedDictionaryExportSqlLeaseV010({
        connectionString:url,schema,hostLoginRole:hostRole,
        workerLoginRole:workerRole,isolatedTestOnly:true
      });
    }
    await sql.unsafe("INSERT INTO "+q+".cv04_export_signing_keys (key_id,secret) VALUES ($1,$2)",[
      keyId,hmacSecret
    ]);
    for(const operation of [op,workerOp,"dictionary.collection.export.job.download",
      "dictionary.collection.export.job.expire"]){
      await sql.unsafe("INSERT INTO "+q+".cv04_export_authority "+
        "(context_id,enterprise_id,principal_subject_id,actor_type,operation_id,"+
        "enabled,mirror_healthy,authority_epoch,lease_until) "+
        "VALUES ($1,$2,$3,'HUMAN',$4,true,true,1,clock_timestamp()+interval '10 minutes')",
        [ctx,enterprise,subject,operation]);
    }
    // Separate principal-wide generation shared by request, worker, download,
    // and expiry. Real PA05/T0 event delivery is intentionally NOT simulated.
    await sql.unsafe("INSERT INTO "+q+".cv04_export_principal_fence "+
      "(context_id,enterprise_id,principal_subject_id,actor_type,"+
      "enabled,mirror_healthy,authority_epoch,lease_until) "+
      "VALUES ($1,$2,$3,'HUMAN',true,true,1,"+
      "clock_timestamp()+interval '10 minutes')",[ctx,enterprise,subject]);
    // Real physical privilege split; SQL runtime has no raw job or audit DML.
    for(const table of ["resources","cv03_resource_receipts","cv04_export_audit",
      "cv04_export_signing_keys","cv04_export_authority",
      "cv04_export_principal_fence","cv04_export_used_proofs",
      ...(physical?["cv04_export_work_permits","cv04_export_work_leases"]:[])]){
      await sql.unsafe("ALTER TABLE "+q+'."'+table+'" OWNER TO '+owner);
      await sql.unsafe("REVOKE ALL ON TABLE "+q+'."'+table+'" FROM PUBLIC');
    }
    for(const name of ["cv04_audit_immutable()",
      "cv04_append_job_resource_audit()",
      "cv04_export_signed_put(text,text,text)",
      ...(physical?[
        "cv04_export_issue_lease(text,text,bigint,text,text,text,text,bigint)",
        "cv04_export_claim_lease(text)",
        "cv04_export_complete_lease(text,bigint)",
        "cv04_export_revoke_lease(text,text)",
        "cv04_export_lease_status(text,text)",
        "cv04_export_due_jobs(text,integer)",
        "cv04_export_runnable_jobs(text,integer)",
        "cv04_export_worker_read(text,bigint)"
      ]:[])]){
      await sql.unsafe("ALTER FUNCTION "+q+"."+name+" OWNER TO "+owner);
    }
    await sql.unsafe("ALTER SCHEMA "+q+" OWNER TO "+owner);
    await sql.unsafe("REVOKE ALL ON SCHEMA "+q+" FROM PUBLIC");
    await sql.unsafe("GRANT USAGE ON SCHEMA "+q+" TO "+runtime);
    await sql.unsafe("GRANT EXECUTE ON FUNCTION "+q+
      ".cv04_export_signed_put(text,text,text) TO "+runtime);
    if(physical)await sql.unsafe("GRANT EXECUTE ON FUNCTION "+q+
      ".cv04_export_worker_read(text,bigint) TO \""+workerRole+"\"");
    const loginUrl=new URL(url);loginUrl.username=runtimeRole;loginUrl.password=password;
    if(physical){
      const hostUrl=new URL(url);hostUrl.username=hostRole;hostUrl.password=hostPw;
      const workerUrl=new URL(url);workerUrl.username=workerRole;workerUrl.password=workerPw;
      host=createIsolatedDictionaryExportSqlHostLeaseIssuerV010({
        connectionString:hostUrl.toString(),schema,isolatedTestOnly:true
      });
      workerA=createIsolatedDictionaryExportSqlWorkerLeaseV010({
        connectionString:workerUrl.toString(),schema,isolatedTestOnly:true
      });
      workerB=createIsolatedDictionaryExportSqlWorkerLeaseV010({
        connectionString:workerUrl.toString(),schema,isolatedTestOnly:true
      });
    }
    client=postgres(loginUrl.toString(),{max:2,connect_timeout:10,prepare:false});
    second=postgres(loginUrl.toString(),{max:2,connect_timeout:10,prepare:false});
    raw=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
    const encrypted=createIsolatedEncryptedDictionaryExportPgStoreV010({
      resources:raw,encryptionKey:Buffer.alloc(32,0x24),keyId:"cv04-data-key-v1",
      isolatedTestOnly:true
    });
    const put=(params,which=client)=>which.unsafe(
      "SELECT "+q+".cv04_export_signed_put($1,$2,$3) AS result",
      [params.envelope,params.signature,params.resource]).then(rows=>rows[0].result);
    const read=(jobId)=>readIsolatedDictionaryExportAuditV010({
      connectionString:url,schema,contextId:ctx,jobId,isolatedTestOnly:true
    });
    await fn({sql,schema,q,owner,runtime,ownerRole,runtimeRole,client,second,raw,
      encrypted,put,read,cryptoKey:Buffer.alloc(32,0x24),
      host,workerA,workerB,hostRole,workerRole,
      hostUrl:physical?(()=>{const u=new URL(url);u.username=hostRole;u.password=hostPw;return u.toString()})():undefined,
      workerUrl:physical?(()=>{const u=new URL(url);u.username=workerRole;u.password=workerPw;return u.toString()})():undefined});
  }finally{
    if(client)await client.end();
    if(second)await second.end();
    if(raw)await raw.close();
    for(const v of [host,workerA,workerB])if(v)await v.close();
    if(schemaCreated)await sql.unsafe("DROP SCHEMA "+q+" CASCADE");
    if(runtimeCreated)await sql.unsafe("DROP ROLE "+runtime);
    if(workerCreated)await sql.unsafe('DROP ROLE "'+workerRole+'"');
    if(hostCreated)await sql.unsafe('DROP ROLE "'+hostRole+'"');
    if(ownerCreated)await sql.unsafe("DROP ROLE "+owner);
    await sql.end();
  }
}
test("CV04 gateway SQL builder rejects unsafe non-isolated schemas",()=>{
  assert.throws(()=>cv04IsolatedSignedExportGatewaySqlV010("public"),
    /CV04_EXPORT_GATEWAY_ISOLATED_SCHEMA_REQUIRED/);
  assert.throws(()=>cv04IsolatedSignedExportGatewaySqlV010('cv03_safe";DROP TABLE x'),
    /CV04_EXPORT_GATEWAY_ISOLATED_SCHEMA_REQUIRED/);
});
test("CV04 signed SQL: EXECUTE-only Host proof creates ciphertext job and immutable audit in one transaction",realPG,async()=>{
  await fixture(async({put,client,q,read,encrypted,raw,cryptoKey})=>{
    const id="exj-"+randomBytes(24).toString("hex");
    const job=buildJob(id),doc=encryptJob(job,cryptoKey,0);
    const signed=permit(doc);
    const done=await put(signed);
    assert.equal(done.committed,true);
    assert.equal(done.jobId,id);
    assert.equal(done.revision,0);
    const rows=await read(id);
    assert.deepEqual(rows.map(x=>x.stage),["REQUESTED"]);
    const loaded=await encrypted.get(addr(id));
    assert.equal(loaded.payload.pages[0].rows[0].cells.displayName,
      "Private CV04 Export Row");
    await assert.rejects(put(signed),/CV04_GATEWAY_REPLAY_OR_CONFLICT/);
    await assert.rejects(client.unsafe("SELECT resource FROM "+q+".resources"),
      /permission denied/);
    const rawBytes=JSON.stringify((await raw.get(addr(id))).payload);
    assert.ok(!rawBytes.includes("Private CV04 Export Row"),
      "Encrypted JSONB must not expose readable Dictionary rows");
    const metadata=JSON.stringify((await encrypted.get(addr(id))).payload.audit);
    assert.ok(!metadata.includes("Private CV04 Export Row"));
    console.log("CV04_SIGNED_PG_EXECUTE_ONLY_CIPHERTEXT_ATOMIC_AUDIT_PASS");
  });
});
test("CV04 signed SQL: hostile role cannot inspect key/policy/job/audit or bypass gateway with raw DML",realPG,async()=>{
  await fixture(async({sql,q,client,runtimeRole,put,cryptoKey})=>{
    const id="exj-"+randomBytes(24).toString("hex");
    const job=buildJob(id),doc=encryptJob(job,cryptoKey,0);
    const role=await client.unsafe("SELECT current_user AS role");
    assert.equal(role[0].role,runtimeRole);
    for(const table of ["resources","cv04_export_audit","cv04_export_signing_keys",
      "cv04_export_authority","cv04_export_principal_fence",
       "cv04_export_used_proofs"]){
      await assert.rejects(client.unsafe("SELECT * FROM "+q+"."+table),/permission denied/);
    }
    await assert.rejects(client.unsafe("INSERT INTO "+q+
      ".resources(context_id,namespace,collection_id,resource_type,resource_id,revision,resource) "+
      "VALUES ($1,$2,$3,$4,$5,0,$6::jsonb)",[
        ctx,"evo.dictionary.export-jobs","bounded-csv-jobs","evo.dictionary.export.job",
        id,JSON.stringify(doc)]),/permission denied/);
    await assert.rejects(client.unsafe("UPDATE "+q+
      ".cv04_export_authority SET enabled=true"),/permission denied/);
    await assert.rejects(client.unsafe("UPDATE "+q+
      ".cv04_export_principal_fence SET enabled=true"),/permission denied/);
    await assert.rejects(client.unsafe("DELETE FROM "+q+".cv04_export_audit"),/permission denied/);
    await assert.rejects(client.unsafe("ALTER TABLE "+q+
      ".resources DISABLE TRIGGER cv04_export_resource_audit"),/must be owner|permission denied/i);
    assert.equal((await put(permit(doc))).committed,true);
    console.log("CV04_SIGNED_PG_RUNTIME_ROLE_EXECUTE_ONLY_RAW_DML_DENIED_PASS");
  });
});
test("CV04 signed SQL: wrong HMAC/digest, cross-tenant scope, stale time, replay, revoked grant and authority epoch deny",realPG,async()=>{
  await fixture(async({sql,q,put,cryptoKey})=>{
    const id="exj-"+randomBytes(24).toString("hex");
    const job=buildJob(id),doc=encryptJob(job,cryptoKey,0);
    const good=permit(doc);
    await assert.rejects(put({...good,signature:"0".repeat(64)}),
      /CV04_GATEWAY_SIGNED_PROOF_INVALID/);
    const mutated={...good,resource:good.resource.replace("evo-business-dictionary","evo-other-dictionary")};
    await assert.rejects(put(mutated),/CV04_GATEWAY_SCOPE_BINDING_DENIED|CV04_GATEWAY_RESOURCE_DIGEST_INVALID/);
    await assert.rejects(put(permit(doc,{envelope:{enterpriseId:"cv04-other"}})),
      /CV04_GATEWAY_SCOPE_BINDING_DENIED/);
    await assert.rejects(put(permit(doc,{envelope:{subjectId:"intruder"}})),
      /CV04_GATEWAY_SCOPE_BINDING_DENIED/);
    await assert.rejects(put(permit(doc,{issuedAt:new Date(Date.now()-120000).toISOString()})),
      /CV04_GATEWAY_PERMIT_OR_STATE_DENIED/);
    const created=await put(good);
    assert.equal(created.committed,true);
    await assert.rejects(put(good),/CV04_GATEWAY_REPLAY_OR_CONFLICT/);
    const another=buildJob("exj-"+randomBytes(24).toString("hex"));
    const newDoc=encryptJob(another,cryptoKey,0);
    await sql.unsafe("UPDATE "+q+".cv04_export_authority "+
      "SET enabled=false,authority_epoch=2 WHERE operation_id=$1",[op]);
    await assert.rejects(put(permit(newDoc)),/CV04_GATEWAY_OPERATION_REVOKED_OR_UNMIRRORED/);
    await assert.rejects(put(permit(newDoc,{authorityEpoch:2})),
      /CV04_GATEWAY_OPERATION_REVOKED_OR_UNMIRRORED/);
    await sql.unsafe("UPDATE "+q+".cv04_export_authority "+
      "SET enabled=true,mirror_healthy=false,authority_epoch=3 WHERE operation_id=$1",[op]);
    await assert.rejects(put(permit(newDoc,{authorityEpoch:3})),
      /CV04_GATEWAY_OPERATION_REVOKED_OR_UNMIRRORED/);
    await sql.unsafe("UPDATE "+q+".cv04_export_authority "+
      "SET enabled=true,mirror_healthy=true,authority_epoch=4, "+
      "lease_until=clock_timestamp()-interval '1 second' WHERE operation_id=$1",[op]);
    await assert.rejects(put(permit(newDoc,{authorityEpoch:4})),
      /CV04_GATEWAY_OPERATION_REVOKED_OR_UNMIRRORED/);
    await sql.unsafe("UPDATE "+q+".cv04_export_authority "+
      "SET lease_until=clock_timestamp()+interval '5 minutes' WHERE operation_id=$1",[op]);
    await assert.rejects(put(permit(newDoc,{authorityEpoch:3})),
      /CV04_GATEWAY_OPERATION_REVOKED_OR_UNMIRRORED/);
    await sql.unsafe("UPDATE "+q+".cv04_export_principal_fence "+
      "SET authority_epoch=4 WHERE context_id=$1",[ctx]);
    assert.equal((await put(permit(newDoc,{authorityEpoch:4}))).committed,true);
    const last=buildJob("exj-"+randomBytes(24).toString("hex"));
    await sql.unsafe("UPDATE "+q+".cv04_export_signing_keys SET enabled=false");
    await assert.rejects(put(permit(encryptJob(last,cryptoKey,0),{authorityEpoch:4})),
      /CV04_GATEWAY_SIGNER_UNTRUSTED/);
    console.log("CV04_SIGNED_PG_WRONG_PROOF_TENANT_REVOKE_EPOCH_LEASE_FAILCLOSED_PASS");
  });
});
test("CV04 signed SQL: one principal revocation fences every operation despite valid op mirror",realPG,async()=>{
  await fixture(async({sql,q,put,cryptoKey,client})=>{
    const id="exj-"+randomBytes(24).toString("hex");
    const doc=encryptJob(buildJob(id),cryptoKey,0);
    await sql.unsafe("UPDATE "+q+".cv04_export_principal_fence "+
      "SET enabled=false,authority_epoch=2 WHERE context_id=$1",[ctx]);
    await assert.rejects(put(permit(doc)),
      /CV04_GATEWAY_PRINCIPAL_EPOCH_FENCED/);
    await sql.unsafe("UPDATE "+q+".cv04_export_principal_fence "+
      "SET enabled=true,mirror_healthy=false WHERE context_id=$1",[ctx]);
    await assert.rejects(put(permit(doc)),
      /CV04_GATEWAY_PRINCIPAL_EPOCH_FENCED/);
    await sql.unsafe("UPDATE "+q+".cv04_export_principal_fence "+
      "SET mirror_healthy=true,authority_epoch=3 WHERE context_id=$1",[ctx]);
    // A previous operation-specific mirror still has epoch=1. It cannot
    // continue just because its per-operation enabled bit remains true.
    await assert.rejects(put(permit(doc)),
      /CV04_GATEWAY_PRINCIPAL_EPOCH_FENCED/);
    await sql.unsafe("UPDATE "+q+".cv04_export_authority "+
      "SET authority_epoch=3 WHERE context_id=$1",[ctx]);
    await assert.rejects(put(permit(doc,{authorityEpoch:2})),
      /CV04_GATEWAY_OPERATION_REVOKED_OR_UNMIRRORED/);
    assert.equal((await put(permit(doc,{authorityEpoch:3}))).committed,true);
    await assert.rejects(client.unsafe("SELECT * FROM "+q+
      ".cv04_export_principal_fence"),/permission denied/);
    console.log("CV04_SIGNED_PG_PRINCIPAL_EPOCH_CROSS_OPERATION_FENCE_PASS");
  });
});

test("CV04 signed SQL: two runtime workers race on same CAS, loser cannot create audit or nonce side effect",realPG,async()=>{
  await fixture(async({put,second,raw,read,cryptoKey})=>{
    const id="exj-"+randomBytes(24).toString("hex"),original=buildJob(id);
    const doc=encryptJob(original,cryptoKey,0);
    await put(permit(doc));
    const next={...original,state:"RUNNING",attempt:1,leaseUntil:new Date(Date.now()+12000).toISOString(),
      audit:[...original.audit,event("STARTED")]};
    const update1=encryptJob(next,cryptoKey,1,doc);
    const update2=encryptJob({...next,audit:[...original.audit,event("STARTED")]},cryptoKey,1,doc);
    const both=await Promise.allSettled([
      put(permit(update1)),
      put(permit(update2),second)
    ]);
    assert.equal(both.filter(x=>x.status==="fulfilled").length,1,JSON.stringify(both));
    assert.equal(both.filter(x=>x.status==="rejected").length,1,JSON.stringify(both));
    assert.match(String(both.find(x=>x.status==="rejected").reason),
      /ENTERPRISE_RESOURCE_REVISION_CONFLICT/);
    assert.equal((await raw.get(addr(id))).revision,1);
    assert.deepEqual((await read(id)).map(x=>x.stage),["REQUESTED","STARTED"]);
    console.log("CV04_SIGNED_PG_TWO_RUNTIME_CAS_ONE_AUDIT_WINNER_PASS");
  });
});


test("CV04 signed SQL: DB fences active Worker lease, max 2 attempts and signed TTL tombstone",realPG,async()=>{
  await fixture(async({put,read,encrypted,raw,cryptoKey})=>{
    const id="exj-"+randomBytes(24).toString("hex");
    const job=buildJob(id);
    job.expiresAt=new Date(Date.now()+3000).toISOString();
    const created=encryptJob(job,cryptoKey,0);
    assert.equal((await put(permit(created))).state,"QUEUED");
    const unsafeLease={...job,state:"RUNNING",attempt:1,
      leaseUntil:new Date(Date.now()+60000).toISOString(),
      audit:[...job.audit,event("STARTED")]};
    await assert.rejects(put(permit(encryptJob(unsafeLease,cryptoKey,1,created))),
      /CV04_GATEWAY_WORKER_LEASE_DENIED/);
    assert.equal((await raw.get(addr(id))).revision,0);

    const running={...job,state:"RUNNING",attempt:1,
      leaseUntil:new Date(Date.now()+850).toISOString(),
      audit:[...job.audit,event("STARTED")]};
    const runDoc=encryptJob(running,cryptoKey,1,created);
    assert.equal((await put(permit(runDoc))).revision,1);
    const competing={...running,attempt:2,
      leaseUntil:new Date(Date.now()+850).toISOString(),
      audit:[...running.audit,event("STARTED")]};
    await assert.rejects(put(permit(encryptJob(competing,cryptoKey,2,runDoc))),
      /CV04_GATEWAY_WORKER_LEASE_DENIED/);
    await new Promise(r=>setTimeout(r,990));

    const staleResult={...running,state:"READY",pages:[],
      csv:"\\uFEFFdictionaryId\\r\\nrow-01\\r\\n",
      csvSha256:sha("old"),
      audit:[...running.audit,event("COMPLETED",1,38),event("READY",1,38)]};
    await assert.rejects(put(permit(encryptJob(staleResult,cryptoKey,2,runDoc))),
      /CV04_GATEWAY_STALE_WORKER_COMPLETION_DENIED/);
    assert.equal((await raw.get(addr(id))).revision,1);

    const resumed={...running,attempt:2,
      leaseUntil:new Date(Date.now()+850).toISOString(),
      audit:[...running.audit,event("STARTED")]};
    const resumedDoc=encryptJob(resumed,cryptoKey,2,runDoc);
    assert.equal((await put(permit(resumedDoc))).revision,2);
    const thirdAttempt={...resumed,attempt:3,
      leaseUntil:new Date(Date.now()+850).toISOString(),
      audit:[...resumed.audit,event("STARTED")]};
    await assert.rejects(put(permit(encryptJob(thirdAttempt,cryptoKey,3,resumedDoc))),
      /CV04_GATEWAY_SCOPE_BINDING_DENIED|CV04_GATEWAY_JOB_TRANSITION_DENIED/);

    const expired={...resumed,state:"EXPIRED",pages:[],leaseUntil:undefined,
      audit:[...resumed.audit,event("EXPIRED")]};
    const expiredDoc=encryptJob(expired,cryptoKey,3,resumedDoc);
    await assert.rejects(put(permit(expiredDoc,{
      operationId:"dictionary.collection.export.job.expire"
    })),/CV04_GATEWAY_PREMATURE_EXPIRY_DENIED/);
    await new Promise(r=>setTimeout(r,
      Math.max(0,Date.parse(job.expiresAt)-Date.now()+125)));
    const cleanup=await put(permit(expiredDoc,{
      operationId:"dictionary.collection.export.job.expire"
    }));
    assert.equal(cleanup.revision,3);
    assert.equal(cleanup.state,"EXPIRED");
    const persisted=await encrypted.get(addr(id));
    assert.equal(persisted.payload.state,"EXPIRED");
    assert.deepEqual(persisted.payload.pages,[]);
    assert.equal(persisted.payload.csv,undefined);
    assert.deepEqual((await read(id)).map(x=>x.stage),[
      "REQUESTED","STARTED","STARTED","EXPIRED"]);
    assert.equal((await raw.get(addr(id))).revision,3);
    console.log("CV04_SIGNED_PG_WORKER_LEASE_RECLAIM_TTL_TOMBSTONE_PASS");
  });
});


const approval=(jobId,revision)=>({
  contextId:ctx,jobId,expectedRevision:revision,
  enterpriseId:enterprise,subjectId:subject,actorType:"HUMAN",
  approvalId:"signed-host-"+randomUUID(),authorityEpoch:1
});
const physicalProof=(token,claim)=>({
  workerLeaseEpoch:claim.epoch,workerLeaseTokenHash:md5(token)
});

test("CV04 fenced PG: physical Worker lease epoch and exact CAS revision both required for STARTED and READY",realPG,async()=>{
  await fixture(async({put,raw,read,cryptoKey,host,workerA,client,q})=>{
    const id="exj-"+randomBytes(24).toString("hex"),job=buildJob(id);
    const created=encryptJob(job,cryptoKey,0);
    assert.equal((await put(permit(created))).revision,0);
    const token=await host.issue(approval(id,0));
    const lease=await workerA.claim(token);
    assert.equal(lease.expectedRevision,0);
    assert.equal(lease.epoch,1);
    const running={...job,state:"RUNNING",attempt:1,
      leaseUntil:new Date(Date.now()+6000).toISOString(),
      audit:[...job.audit,event("STARTED")]};
    const runDoc=encryptJob(running,cryptoKey,1,created);
    await assert.rejects(put(permit(runDoc)),/CV04_GATEWAY_PHYSICAL_LEASE_PROOF_REQUIRED/);
    await assert.rejects(put(permit(runDoc,{envelope:{
      ...physicalProof(token,lease),workerLeaseEpoch:2
    }})),/CV04_GATEWAY_PHYSICAL_LEASE_FENCED/);
    await assert.rejects(put(permit(runDoc,{envelope:{
      ...physicalProof(token,lease),workerLeaseTokenHash:"0".repeat(32)
    }})),/CV04_GATEWAY_PHYSICAL_LEASE_FENCED/);
    await assert.rejects(put(permit(runDoc,{expectedRevision:7,
      envelope:physicalProof(token,lease)})),
      /CV04_GATEWAY_PERMIT_OR_STATE_DENIED|CV04_GATEWAY_PHYSICAL_LEASE_FENCED|ENTERPRISE_RESOURCE_REVISION_CONFLICT/);
    assert.equal((await raw.get(addr(id))).revision,0);
    assert.equal((await put(permit(runDoc,{envelope:physicalProof(token,lease)}))).revision,1);

    const csv="\\uFEFFdictionaryId\\r\\nrow-01\\r\\n";
    const ready={...running,state:"READY",pages:[],csv,csvSha256:sha(csv),
      leaseUntil:undefined,
      audit:[...running.audit,event("COMPLETED",1,csv.length),event("READY",1,csv.length)]};
    const readyDoc=encryptJob(ready,cryptoKey,2,runDoc);
    assert.equal((await put(permit(readyDoc,{
      envelope:physicalProof(token,lease)
    }))).state,"READY");
    assert.equal(await workerA.complete(token,lease.epoch),"DONE");
    assert.equal((await raw.get(addr(id))).revision,2);
    assert.deepEqual((await read(id)).map(x=>x.stage),
      ["REQUESTED","STARTED","COMPLETED","READY"]);
    await assert.rejects(client.unsafe("SELECT * FROM "+q+".cv04_export_work_leases"),
      /permission denied/);
    console.log("CV04_SIGNED_PHYSICAL_LEASE_OWNER_REVISION_READY_ATOMIC_PASS");
  },{physical:true});
});

test("CV04 fenced PG: concurrent reclaimed epoch denies stale Worker signed CAS and preserves one winner",realPG,async()=>{
  await fixture(async({sql,q,put,raw,read,cryptoKey,host,workerA,workerB})=>{
    const id="exj-"+randomBytes(24).toString("hex"),job=buildJob(id);
    const created=encryptJob(job,cryptoKey,0);
    await put(permit(created));
    const token1=await host.issue(approval(id,0));
    const lease1=await workerA.claim(token1);
    const run1={...job,state:"RUNNING",attempt:1,
      leaseUntil:new Date(Date.now()+1350).toISOString(),
      audit:[...job.audit,event("STARTED")]};
    const doc1=encryptJob(run1,cryptoKey,1,created);
    assert.equal((await put(permit(doc1,{
      envelope:physicalProof(token1,lease1)
    }))).revision,1);
    // Disposable PG clock simulation of an abandoned physical lease. Do not
    // replace a real multi-Host/partition acceptance with this admin injection.
    await new Promise(r=>setTimeout(r,1460));
    await sql.unsafe("UPDATE "+q+".cv04_export_work_leases "+
      "SET claimed_until=clock_timestamp()-interval '1 second' "+
      "WHERE context_id=$1 AND job_id=$2",[ctx,id]);
    const token2=await host.issue(approval(id,1));
    const lease2=await workerB.claim(token2);
    assert.equal(lease2.epoch,2);
    await assert.rejects(workerA.complete(token1,1),
      /CV04_EXPORT_SQL_STALE_LEASE_FENCE/);
    const run2={...run1,attempt:2,
      leaseUntil:new Date(Date.now()+6000).toISOString(),
      audit:[...run1.audit,event("STARTED")]};
    const doc2=encryptJob(run2,cryptoKey,2,doc1);
    await assert.rejects(put(permit(doc2,{
      envelope:physicalProof(token1,lease1)
    })),/CV04_GATEWAY_PHYSICAL_LEASE_FENCED/);
    assert.equal((await raw.get(addr(id))).revision,1);
    assert.equal((await put(permit(doc2,{
      envelope:physicalProof(token2,lease2)
    }))).revision,2);
    const csv="\\uFEFFdictionaryId\\r\\nrow-01\\r\\n";
    const ready={...run2,state:"READY",pages:[],csv,csvSha256:sha(csv),
      leaseUntil:undefined,
      audit:[...run2.audit,event("COMPLETED",1,csv.length),event("READY",1,csv.length)]};
    const readyDoc=encryptJob(ready,cryptoKey,3,doc2);
    await assert.rejects(put(permit(readyDoc,{
      envelope:physicalProof(token1,lease1)
    })),/CV04_GATEWAY_PHYSICAL_LEASE_FENCED/);
    assert.equal((await put(permit(readyDoc,{
      envelope:physicalProof(token2,lease2)
    }))).revision,3);
    assert.equal(await workerB.complete(token2,2),"DONE");
    assert.deepEqual((await read(id)).map(x=>x.stage),
      ["REQUESTED","STARTED","STARTED","COMPLETED","READY"]);
    console.log("CV04_SIGNED_PHYSICAL_LEASE_RECLAIM_STALE_CAS_FENCED_PASS");
  },{physical:true});
});

test("CV04 fenced PG: Host lease revoke and principal-wide epoch deny signed Worker write even if revision valid",realPG,async()=>{
  await fixture(async({sql,q,put,raw,cryptoKey,host,workerA})=>{
    const id="exj-"+randomBytes(24).toString("hex"),job=buildJob(id);
    const created=encryptJob(job,cryptoKey,0);
    await put(permit(created));
    const token=await host.issue(approval(id,0));
    const lease=await workerA.claim(token);
    const running={...job,state:"RUNNING",attempt:1,
      leaseUntil:new Date(Date.now()+7000).toISOString(),
      audit:[...job.audit,event("STARTED")]};
    const doc=encryptJob(running,cryptoKey,1,created);
    const signed=permit(doc,{envelope:physicalProof(token,lease)});
    await sql.unsafe("UPDATE "+q+".cv04_export_principal_fence "+
      "SET enabled=false,authority_epoch=2 WHERE context_id=$1",[ctx]);
    await assert.rejects(put(signed),/CV04_GATEWAY_PRINCIPAL_EPOCH_FENCED/);
    // Epochs only advance: re-grant a new signed generation, never reset it.
    await sql.unsafe("UPDATE "+q+".cv04_export_principal_fence "+
      "SET enabled=true,authority_epoch=2 WHERE context_id=$1",[ctx]);
    await sql.unsafe("UPDATE "+q+".cv04_export_authority "+
      "SET authority_epoch=2 WHERE context_id=$1",[ctx]);
    const newGeneration=permit(doc,{authorityEpoch:2,envelope:physicalProof(token,lease)});
    await assert.rejects(put(newGeneration),/CV04_GATEWAY_PHYSICAL_LEASE_FENCED/);
    assert.equal((await raw.get(addr(id))).revision,0);

    // Independent newly approved permit at epoch=2 remains usable until
    // the physical Host revokes it (no older token can be refreshed).
    const id2="exj-"+randomBytes(24).toString("hex");
    const job2=buildJob(id2),initial2=encryptJob(job2,cryptoKey,0);
    assert.equal((await put(permit(initial2,{authorityEpoch:2}))).revision,0);
    const token2=await host.issue({...approval(id2,0),authorityEpoch:2});
    const lease2=await workerA.claim(token2);
    const running2={...job2,state:"RUNNING",attempt:1,
      leaseUntil:new Date(Date.now()+6000).toISOString(),
      audit:[...job2.audit,event("STARTED")]};
    const start2=permit(encryptJob(running2,cryptoKey,1,initial2),{
      authorityEpoch:2,envelope:physicalProof(token2,lease2)
    });
    assert.equal(await host.revoke(ctx,id2),"REVOKED");
    await assert.rejects(put(start2),/CV04_GATEWAY_PHYSICAL_LEASE_FENCED/);
    assert.equal((await raw.get(addr(id2))).revision,0);
    console.log("CV04_SIGNED_PHYSICAL_LEASE_REVOKE_PRINCIPAL_DENY_PASS");
  },{physical:true});
});


test("CV04 Owner continuation: signed RUNNING audit keeps lease and exact one new event per CAS",realPG,async()=>{
  await fixture(async({put,read,raw,client,q,cryptoKey,host,workerA})=>{
    const id="exj-"+randomBytes(24).toString("hex"),job=buildJob(id);
    const queuedDoc=encryptJob(job,cryptoKey,0);
    await put(permit(queuedDoc));
    const token=await host.issue(approval(id,0));
    const claim=await workerA.claim(token);
    const initial=await workerA.readCiphertext(token,claim.epoch);
    assert.equal(initial.revision,0);
    assert.equal(initial.resource.resourceId,id);
    assert.ok(initial.resource.payload.secret.ciphertext.length>0);
    assert.ok(!JSON.stringify(initial).includes("Private CV04 Export Row"));
    await assert.rejects(workerA.readCiphertext("0".repeat(32),claim.epoch),
      /CV04_EXPORT_WORKER_READ_PERMIT_DENIED/);
    await assert.rejects(workerA.readCiphertext(token,2),
      /CV04_EXPORT_WORKER_READ_LEASE_FENCED/);
    await assert.rejects(client.unsafe("SELECT resource FROM "+q+".resources"),
      /permission denied/);

    const running={...job,state:"RUNNING",attempt:1,
      leaseUntil:new Date(Date.now()+8000).toISOString(),
      audit:[...job.audit,event("STARTED")]};
    const startedDoc=encryptJob(running,cryptoKey,1,queuedDoc);
    assert.equal((await put(permit(startedDoc,{
      envelope:physicalProof(token,claim)
    }))).revision,1);
    const first=await workerA.readCiphertext(token,claim.epoch);
    assert.equal(first.revision,1);

    const progressed={...running,audit:[...running.audit,event("STARTED")]};
    const progressDoc=encryptJob(progressed,cryptoKey,2,startedDoc);
    assert.equal((await put(permit(progressDoc,{
      envelope:physicalProof(token,claim)
    }))).revision,2);

    const completedAudit={...progressed,
      audit:[...progressed.audit,event("COMPLETED",1,36)]};
    const progressDoc2=encryptJob(completedAudit,cryptoKey,3,progressDoc);
    assert.equal((await put(permit(progressDoc2,{
      envelope:physicalProof(token,claim)
    }))).revision,3);
    const stale={...completedAudit,audit:[...completedAudit.audit,event("REJECTED")]};
    const wrongLease=encryptJob({...stale,
      leaseUntil:new Date(Date.now()+15000).toISOString()},cryptoKey,4,progressDoc2);
    await assert.rejects(put(permit(wrongLease,{
      envelope:physicalProof(token,claim)
    })),/CV04_GATEWAY_RUNNING_AUDIT_FENCED/);
    const twoAtOnce=encryptJob({...completedAudit,
      audit:[...completedAudit.audit,event("STARTED"),event("COMPLETED",1,36)]},
      cryptoKey,4,progressDoc2);
    await assert.rejects(put(permit(twoAtOnce,{
      envelope:physicalProof(token,claim)
    })),/CV04_GATEWAY_RUNNING_AUDIT_FENCED/);
    assert.equal((await raw.get(addr(id))).revision,3);
    assert.deepEqual((await read(id)).map(x=>x.stage),
      ["REQUESTED","STARTED","STARTED","COMPLETED"]);

    assert.equal(await host.revoke(ctx,id),"REVOKED");
    await assert.rejects(workerA.readCiphertext(token,claim.epoch),
      /CV04_EXPORT_WORKER_READ_LEASE_FENCED|CV04_EXPORT_WORKER_READ_PERMIT_DENIED/);
    await assert.rejects(put(permit(encryptJob(stale,cryptoKey,4,progressDoc2),{
      envelope:physicalProof(token,claim)
    })),/CV04_GATEWAY_PHYSICAL_LEASE_FENCED/);
    assert.equal((await raw.get(addr(id))).revision,3);
    console.log("CV04_SIGNED_OWNER_RUNNING_AUDIT_LEASE_FENCED_PASS");
  },{physical:true});
});

test("CV04 Worker ciphertext GET: principal-wide and operation mirror revocations both deny",realPG,async()=>{
  await fixture(async({sql,q,put,cryptoKey,host,workerA})=>{
    const id="exj-"+randomBytes(24).toString("hex");
    await put(permit(encryptJob(buildJob(id),cryptoKey,0)));
    const token=await host.issue(approval(id,0));
    const claim=await workerA.claim(token);
    assert.equal((await workerA.readCiphertext(token,claim.epoch)).revision,0);
    // PostgreSQL NULL comparisons must not allow missing authorization TTLs.
    await sql.unsafe("UPDATE "+q+".cv04_export_authority "+
      "SET lease_until=NULL WHERE operation_id=$1",[workerOp]);
    await assert.rejects(workerA.readCiphertext(token,claim.epoch),
      /CV04_EXPORT_WORKER_READ_AUTHORITY_FENCED/);
    await sql.unsafe("UPDATE "+q+".cv04_export_authority "+
      "SET lease_until=clock_timestamp()+interval '10 minutes' "+
      "WHERE operation_id=$1",[workerOp]);
    await sql.unsafe("UPDATE "+q+".cv04_export_principal_fence "+
      "SET lease_until=NULL WHERE context_id=$1",[ctx]);
    await assert.rejects(workerA.readCiphertext(token,claim.epoch),
      /CV04_EXPORT_WORKER_READ_PRINCIPAL_FENCED/);
    await sql.unsafe("UPDATE "+q+".cv04_export_principal_fence "+
      "SET lease_until=clock_timestamp()+interval '10 minutes' "+
      "WHERE context_id=$1",[ctx]);
    await sql.unsafe("UPDATE "+q+".cv04_export_authority "+
      "SET enabled=false,authority_epoch=2 WHERE operation_id=$1",[workerOp]);
    await assert.rejects(workerA.readCiphertext(token,claim.epoch),
      /CV04_EXPORT_WORKER_READ_AUTHORITY_FENCED/);
    await sql.unsafe("UPDATE "+q+".cv04_export_authority "+
      "SET enabled=true,authority_epoch=1 WHERE operation_id=$1",[workerOp]);
    await sql.unsafe("UPDATE "+q+".cv04_export_principal_fence "+
      "SET enabled=false,authority_epoch=2 WHERE context_id=$1",[ctx]);
    await assert.rejects(workerA.readCiphertext(token,claim.epoch),
      /CV04_EXPORT_WORKER_READ_PRINCIPAL_FENCED/);
    console.log("CV04_SIGNED_WORKER_ENCRYPTED_READ_REVOKE_FAILCLOSED_PASS");
  },{physical:true});
});


test("CV04 actual Dictionary Owner.run: signed Host request, physical Worker read, intermediate CAS and READY audit",realPG,async()=>{
  await fixture(async({raw,put,read,cryptoKey,host,workerA,client,q})=>{
    const memory=createMemoryEnterpriseResourceRepositoryV010();
    const dictionary=createBusinessDictionaryRepositoryV010(memory);
    const seed=dictionary.saveDraft({
      contextId:ctx,dictionaryId:"cv04-real-owner-d1",expectedVersion:0,
      displayName:"Owner Bridge Readable Dictionary",
      options:[{code:"PRIVATE",label:{default:"Never export option detail"},status:"ACTIVE"}],
      actorSubjectId:subject,recordedAt:new Date().toISOString()
    });
    dictionary.publish({contextId:ctx,dictionaryId:"cv04-real-owner-d1",
      expectedVersion:seed.version,actorSubjectId:subject,actorType:"HUMAN",
      recordedAt:new Date().toISOString()});
    const ctxHuman={
      contractVersion:"0.1.0",
      principal:{contractVersion:"0.1.0",subjectId:subject,actorType:"HUMAN",
        identityProviderId:"cv04-owner-physical-sql-qa",sessionId:"session-owner-qa"},
      scope:{contractVersion:"0.1.0",enterpriseId:enterprise,userId:subject},
      context:{contractVersion:"0.1.0",
        activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
          contextId:ctx,enterpriseId:enterprise},
        personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
          contextId:"personal:"+subject,ownerSubjectId:subject}},
      correlationId:"cv04-owner-bridge-physical-pg"
    };
    const provider=createHostStaticAuthorizationProviderV010({
      contractVersion:"0.1.0",
      rules:[{id:"cv04-owner-bridge-only",effect:"ALLOW",actions:["dictionary.export"],
        subjectIds:[subject],actorTypes:["HUMAN"],scope:{enterpriseId:enterprise}}]
    });
    let work=null;
    // Disposable trusted Host signing harness. No SQL superuser or raw
    // resource DML is given to the runtime/Worker login. This is NOT a
    // production PA05/T0 signer and uses fixed CI-only key material.
    const address=(request)=>({
      contextId:request.contextId,namespace:request.namespace,
      collectionId:request.collectionId,resourceType:request.resourceType,
      resourceId:request.resourceId
    });
    const underlying={
      conditionalWriteConsistency:"SHARED_POSTGRES_TRANSACTION",
      async get(a){
        if(!work)return raw.get(a); // Trusted test Host request admission.
        const secured=await workerA.readCiphertext(work.token,work.lease.epoch);
        if(secured.resource.contextId!==a.contextId||
           secured.resource.resourceId!==a.resourceId||
           secured.resource.namespace!==a.namespace||
           secured.resource.collectionId!==a.collectionId||
           secured.resource.resourceType!==a.resourceType)
          throw Error("CV04_OWNER_WORKER_SCOPE_MISMATCH");
        return secured.resource;
      },
      async putIfRevision(request){
        const prior=request.expectedRevision===null?undefined:
          await this.get(address(request));
        if(request.expectedRevision!==null&&
          (!prior||prior.revision!==request.expectedRevision))
          throw Error("ENTERPRISE_RESOURCE_REVISION_CONFLICT");
        const revision=request.expectedRevision===null?0:request.expectedRevision+1;
        const resource={
          contractVersion:"0.1.0",...address(request),
          schemaRef:request.schemaRef,ownerPackageId:request.ownerPackageId,
          storageKind:"DOCUMENT",lifecycleState:"ACTIVE",revision,
          createdAt:prior?.createdAt??request.recordedAt,
          createdBySubjectId:prior?.createdBySubjectId??request.actorSubjectId,
          updatedAt:request.recordedAt,updatedBySubjectId:request.actorSubjectId,
          payload:request.payload
        };
        const signed=permit(resource,{
          operationId:work?workerOp:op,
          expectedRevision:request.expectedRevision,
          ...(work?{envelope:physicalProof(work.token,work.lease)}:{})
        });
        const result=await put(signed);
        if(result?.committed!==true||result?.revision!==revision)
          throw Error("CV04_OWNER_SIGNED_CAS_RECEIPT_INVALID");
        return resource;
      }
    };
    const signedEncryptedStore=createIsolatedEncryptedDictionaryExportPgStoreV010({
      resources:underlying,encryptionKey:cryptoKey,keyId:"cv04-data-key-v1",
      isolatedTestOnly:true
    });
    const owner=createDictionaryExportJobOwnerV010({
      repository:dictionary,resources:signedEncryptedStore,
      resolveAuthorizationProvider:()=>provider,
      hasLiveRelationship:()=>true,isFeatureActive:()=>true,
      isolatedTestOnly:true,now:()=>new Date()
    });
    const queued=await owner.request(ctxHuman,{
      idempotencyKey:"cv04_owner_run_bridge_20261112",
      query:{view:"published",sort:"dictionaryId",direction:"asc"},
      fieldIds:["dictionaryId","displayName"]
    });
    assert.equal(queued.state,"QUEUED");
    const before=await raw.get(addr(queued.jobId));
    assert.equal(before.revision,0);
    assert.ok(!JSON.stringify(before.payload).includes("Owner Bridge Readable Dictionary"));
    const token=await host.issue(approval(queued.jobId,0));
    const lease=await workerA.claim(token);
    assert.equal((await workerA.readCiphertext(token,lease.epoch)).revision,0);
    work={token,lease};
    const ready=await owner.run(ctxHuman,queued.jobId,{
      trustedSqlLeaseUntil:lease.leaseUntil
    });
    assert.equal(ready.state,"READY");
    assert.equal(ready.attempts,1);
    assert.equal(await workerA.complete(token,lease.epoch),"DONE");
    const persisted=await raw.get(addr(queued.jobId));
    assert.equal(persisted.revision,4);
    assert.equal(persisted.payload.meta.state,"READY");
    assert.ok(!JSON.stringify(persisted.payload).includes("Owner Bridge Readable Dictionary"));
    assert.ok(!JSON.stringify(persisted.payload).includes("Never export option detail"));
    assert.deepEqual((await read(queued.jobId)).map(x=>x.stage),
      ["REQUESTED","STARTED","STARTED","COMPLETED","READY"]);
    await assert.rejects(workerA.readCiphertext(token,lease.epoch),
      /CV04_EXPORT_WORKER_READ_LEASE_FENCED|CV04_EXPORT_WORKER_READ_JOB_FENCED/);
    await assert.rejects(client.unsafe("SELECT resource FROM "+q+".resources"),
      /permission denied/);
    console.log("CV04_REAL_DICTIONARY_OWNER_SIGNED_WORKER_CAS_AUDIT_READY_PASS");
  },{physical:true});
});


/**
 * A child process uses its own physical PostgreSQL LOGIN and never gets a
 * parent postgres.js pool. "crash" prints a successful claim, then the parent
 * SIGKILLs that OS process before any completion/connection close. Credentials
 * live only in the disposable CI process environment, never committed.
 */
const cv04WorkerChildSource=`
import {createIsolatedDictionaryExportSqlWorkerLeaseV010} from
  "./dist/apps/business-dictionary/export-job-pg-sql-lease.js";
const w=createIsolatedDictionaryExportSqlWorkerLeaseV010({
  connectionString:process.env.CV04_CHILD_DB,
  schema:process.env.CV04_CHILD_SCHEMA,isolatedTestOnly:true
});
try{
  const action=process.env.CV04_CHILD_ACTION,token=process.env.CV04_CHILD_TOKEN;
  const value=action==="complete"?
    await w.complete(token,Number(process.env.CV04_CHILD_EPOCH)):
    await w.claim(token);
  process.stdout.write(JSON.stringify({ok:true,value})+"\\n");
  if(action==="crash")setInterval(()=>{},1000);
  else await w.close();
}catch(e){
  process.stdout.write(JSON.stringify({ok:false,
    code:e instanceof Error?e.message:"CV04_CHILD_FAILED"})+"\\n");
  await w.close();
  process.exitCode=2;
}
`;
function childWorkerProcess(workerUrl,schema){
  const call=(action,token,epoch)=>new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,["--input-type=module","-e",cv04WorkerChildSource],{
      cwd:process.cwd(),stdio:["ignore","pipe","pipe"],
      env:{...process.env,NODE_ENV:"test",CV04_CHILD_DB:workerUrl,
        CV04_CHILD_SCHEMA:schema,CV04_CHILD_ACTION:action,
        CV04_CHILD_TOKEN:token,CV04_CHILD_EPOCH:String(epoch??"")}
    });
    let out="",err="",killed=false;
    child.stdout.on("data",part=>{
      out+=part.toString("utf8");
      if(action==="crash"&&out.includes("\n")&&!killed){
        killed=true;child.kill("SIGKILL");
      }
    });
    child.stderr.on("data",part=>{err+=part.toString("utf8").slice(0,256);});
    child.on("error",reject);
    child.on("close",(code,signal)=>{
      let message;
      try{message=JSON.parse(out.trim().split("\n")[0]);}
      catch{return reject(Error("CV04_CHILD_INVALID_RESPONSE "+err.slice(0,80)));}
      if(message.ok!==true)return reject(Error(message.code));
      if(action==="crash"&&signal!=="SIGKILL")
        return reject(Error("CV04_CHILD_NOT_KILLED"));
      if(action!=="crash"&&code!==0)
        return reject(Error("CV04_CHILD_EXIT_NONZERO"));
      resolve(message.value);
    });
  });
  return {
    claim(token){return call("claim",token);},
    complete(token,epoch){return call("complete",token,epoch);},
    crashClaim(token){return call("crash",token);}
  };
}

test("CV04 actual multi-Host SQL sessions + OS Worker crash: bounded dispatch, epoch=2 reclaim and stale signed CAS deny",realPG,async()=>{
  await fixture(async({sql,q,host,hostUrl,workerUrl,schema,put,raw,read,cryptoKey})=>{
    const secondHost=createIsolatedDictionaryExportSqlHostLeaseIssuerV010({
      connectionString:hostUrl,schema,isolatedTestOnly:true
    });
    try{
      const id="exj-"+randomBytes(24).toString("hex"),job=buildJob(id);
      const queued=encryptJob(job,cryptoKey,0);
      assert.equal((await put(permit(queued))).revision,0);
      const childA=childWorkerProcess(workerUrl,schema);
      const childB=childWorkerProcess(workerUrl,schema);
      const crashClient={claim:token=>childA.crashClaim(token),
        complete:(token,epoch)=>childA.complete(token,epoch)};
      let firstToken,firstLease,firstDoc,firstJob;
      let authorizations=0;
      const approveFresh=async candidate=>{
        authorizations++;
        assert.equal(candidate.jobId,id);
        assert.equal(candidate.enterpriseId,enterprise);
        assert.equal(candidate.subjectId,subject);
        assert.equal(candidate.actorType,"HUMAN");
        return {approvalId:"cv04-dispatch-auth-"+randomUUID(),authorityEpoch:1};
      };
      const doFirst=async({token,lease})=>{
        firstToken=token;firstLease=lease;
        firstJob={...job,state:"RUNNING",attempt:1,
          leaseUntil:new Date(Date.now()+1700).toISOString(),
          audit:[...job.audit,event("STARTED")]};
        firstDoc=encryptJob(firstJob,cryptoKey,1,queued);
        assert.equal((await put(permit(firstDoc,{
          envelope:physicalProof(token,lease)
        }))).revision,1);
        // The process which claimed the physical PG lease has ALREADY been
        // SIGKILLed. This trusted signed-CAS harness records that first attempt.
        throw Error("CV04_WORKER_CRASHED_BEFORE_COMPLETE");
      };
      const dispatchHost=hostClient=>createIsolatedDictionaryExportPgDispatcherV010({
        host:hostClient,workers:[crashClient],contextId:ctx,
        authorizeFresh:approveFresh,runWork:doFirst,isolatedTestOnly:true
      });
      const [a,b]=await Promise.all([
        dispatchHost(host).sweep({limit:2}),
        dispatchHost(secondHost).sweep({limit:2})
      ]);
      assert.equal(a.scanned+b.scanned>=1,true);
      assert.equal(a.issued+b.issued,1);
      assert.equal(a.claimed+b.claimed,1);
      assert.equal(a.completed+b.completed,0);
      assert.equal(a.failed+b.failed,1);
      assert.ok(authorizations>=1);
      assert.equal((await raw.get(addr(id))).revision,1);
      await assert.rejects(childA.complete(firstToken,1),
        /CV04_EXPORT_SQL_OWNER_NOT_READY/);

      // Physical PG expiry *alone* cannot cause early reclaim while signed
      // business snapshot still holds an unexpired RUNNING lease.
      await sql.unsafe("UPDATE "+q+".cv04_export_work_leases "+
        "SET claimed_until=clock_timestamp()-interval '3 seconds' "+
        "WHERE context_id=$1 AND job_id=$2",[ctx,id]);
      assert.equal((await host.runnable(ctx,10)).length,0);
      const remaining=Date.parse(firstJob.leaseUntil)+1350-Date.now();
      if(remaining>0)await new Promise(resolve=>setTimeout(resolve,remaining));
      const candidates=await host.runnable(ctx,10);
      assert.equal(candidates.length,1);
      assert.equal(candidates[0].expectedRevision,1);
      assert.equal(candidates[0].attempt,1);

      const resume=async({token,lease})=>{
        assert.equal(lease.epoch,2);
        assert.equal(lease.expectedRevision,1);
        const started2={...firstJob,attempt:2,
          leaseUntil:new Date(Date.now()+6500).toISOString(),
          audit:[...firstJob.audit,event("STARTED")]};
        const doc2=encryptJob(started2,cryptoKey,2,firstDoc);
        await assert.rejects(put(permit(doc2,{
          envelope:physicalProof(firstToken,firstLease)
        })),/CV04_GATEWAY_PHYSICAL_LEASE_FENCED/);
        assert.equal((await put(permit(doc2,{
          envelope:physicalProof(token,lease)
        }))).revision,2);
        const csv="\\uFEFFdictionaryId\\r\\nrow-01\\r\\n";
        const ready={...started2,state:"READY",pages:[],csv,csvSha256:sha(csv),
          leaseUntil:undefined,
          audit:[...started2.audit,event("COMPLETED",1,csv.length),
            event("READY",1,csv.length)]};
        const doc3=encryptJob(ready,cryptoKey,3,doc2);
        assert.equal((await put(permit(doc3,{
          envelope:physicalProof(token,lease)
        }))).state,"READY");
        return "READY";
      };
      const resumed=createIsolatedDictionaryExportPgDispatcherV010({
        host:secondHost,workers:[childB],contextId:ctx,
        authorizeFresh:approveFresh,runWork:resume,isolatedTestOnly:true
      });
      const completed=await resumed.sweep({limit:2});
      assert.deepEqual({...completed},{
        contractVersion:"0.1.0",scanned:1,issued:1,claimed:1,
        completed:1,skipped:0,failed:0
      });
      await assert.rejects(childA.complete(firstToken,1),
        /CV04_EXPORT_SQL_STALE_LEASE_FENCE/);
      assert.equal((await host.runnable(ctx,10)).length,0);
      assert.equal((await raw.get(addr(id))).revision,3);
      assert.deepEqual((await read(id)).map(x=>x.stage),
        ["REQUESTED","STARTED","STARTED","COMPLETED","READY"]);
      console.log("CV04_MULTIHOST_OS_WORKER_CRASH_RECLAIM_SIGNED_CAS_PASS");
    }finally{await secondHost.close();}
  },{physical:true});
});

test("CV04 Host dispatcher: live deny, active issued permit cooldown, Worker cannot enumerate, no duplicate authority",realPG,async()=>{
  await fixture(async({sql,q,host,workerA,workerUrl,schema,put,raw,cryptoKey})=>{
    const id="exj-"+randomBytes(24).toString("hex"),job=buildJob(id);
    await put(permit(encryptJob(job,cryptoKey,0)));
    const pending=await host.runnable(ctx,10);
    assert.equal(pending.length,1);
    assert.equal(pending[0].jobId,id);
    assert.equal(JSON.stringify(pending).includes("Private CV04 Export Row"),false);
    assert.deepEqual(await host.runnable("enterprise-context:other",10),[]);
    const physicalWorker=postgres(workerUrl,{max:1,prepare:false});
    try{
      await assert.rejects(physicalWorker.unsafe("SELECT * FROM "+q+
        ".cv04_export_runnable_jobs($1,$2)",[ctx,10]),
        /permission denied|CV04_EXPORT_SQL_HOST_LOGIN_REQUIRED/i);
      await assert.rejects(physicalWorker.unsafe("SELECT * FROM "+q+".resources"),
        /permission denied/i);
    }finally{await physicalWorker.end();}
    let called=0;
    const denied=createIsolatedDictionaryExportPgDispatcherV010({
      host,workers:[workerA],contextId:ctx,isolatedTestOnly:true,
      authorizeFresh:async()=>{called++;return null;},
      runWork:async()=>{throw Error("CV04_SHOULD_NOT_EXECUTE");}
    });
    assert.deepEqual(await denied.sweep({limit:1}),{
      contractVersion:"0.1.0",scanned:1,issued:0,claimed:0,
      completed:0,skipped:1,failed:0
    });
    assert.equal(called,1);
    assert.equal((await host.runnable(ctx,10)).length,1);
    // No Worker must receive a permit when the fresh Host denies authorization.
    const issued=await host.issue(approval(id,0));
    assert.match(issued,/^[a-f0-9]{32}$/u);
    assert.equal((await host.runnable(ctx,10)).length,0);
    await assert.rejects(host.issue(approval(id,0)),
      /CV04_EXPORT_SQL_DISPATCH_BUSY/);
    await sql.unsafe("UPDATE "+q+".cv04_export_work_permits "+
      "SET expires_at=clock_timestamp()-interval '1 second' "+
      "WHERE context_id=$1 AND job_id=$2",[ctx,id]);
    assert.equal((await host.runnable(ctx,10)).length,1);
    const second=await host.issue(approval(id,0));
    assert.notEqual(second,issued);
    const lease=await workerA.claim(second);
    assert.equal(lease.epoch,1);
    assert.equal((await host.runnable(ctx,10)).length,0);
    await host.revoke(ctx,id);
    assert.equal((await host.runnable(ctx,10)).length,0);
    assert.equal((await raw.get(addr(id))).revision,0);
    console.log("CV04_HOST_DISPATCH_LIVE_DENY_COOLDOWN_WORKER_DISCOVERY_DENIED_PASS");
  },{physical:true});
});
