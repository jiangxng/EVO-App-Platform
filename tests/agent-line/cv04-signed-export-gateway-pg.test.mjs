import test from "node:test";
import assert from "node:assert/strict";
import {createCipheriv,createHash,createHmac,randomBytes,randomUUID} from "node:crypto";
import postgres from "postgres";
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
      requirePhysicalWorkerLease:physical
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
        "cv04_export_issue_lease(text,text,bigint,text,text,text,text)",
        "cv04_export_claim_lease(text)",
        "cv04_export_complete_lease(text,bigint)",
        "cv04_export_revoke_lease(text,text)",
        "cv04_export_lease_status(text,text)",
        "cv04_export_due_jobs(text,integer)"
      ]:[])]){
      await sql.unsafe("ALTER FUNCTION "+q+"."+name+" OWNER TO "+owner);
    }
    await sql.unsafe("ALTER SCHEMA "+q+" OWNER TO "+owner);
    await sql.unsafe("REVOKE ALL ON SCHEMA "+q+" FROM PUBLIC");
    await sql.unsafe("GRANT USAGE ON SCHEMA "+q+" TO "+runtime);
    await sql.unsafe("GRANT EXECUTE ON FUNCTION "+q+
      ".cv04_export_signed_put(text,text,text) TO "+runtime);
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
      host,workerA,workerB,hostRole,workerRole});
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
