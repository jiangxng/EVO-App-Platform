import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {fork} from "node:child_process";
import {fileURLToPath} from "node:url";
import postgres from "postgres";
import {
  preparePostgresConditionalResourceSchemaV010,
  createPostgresConditionalResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources-postgres.js";

const url = process.env.CV03_RESOURCE_PROOF_DATABASE_URL;
const fixture = fileURLToPath(new URL("../fixtures/cv03-resource-postgres-child.mjs", import.meta.url));
const address = {
  contextId:"enterprise-context:alpha",namespace:"evo.saved-views",
  collectionId:"counterparty.my-suppliers",resourceType:"saved-collection-view",
  resourceId:"view:hk"
};
const put = (name,expectedRevision,extra={}) => ({
  ...address,schemaRef:"counterparty.collection/0.1.0",
  payload:{name},actorSubjectId:"person:owner",
  recordedAt:"2026-11-09T05:00:00.000Z",expectedRevision,...extra
});
const archived = (expectedRevision,extra={}) => ({
  address:{...address,...extra},expectedRevision,
  actorSubjectId:"person:owner",recordedAt:"2026-11-09T06:00:00.000Z"
});
const code = error => String(error?.message??error);

function worker(mode,request,schema,{gate=false}={}) {
  const child=fork(fixture,[mode,Buffer.from(JSON.stringify(request)).toString("base64")],{
    stdio:["ignore","pipe","pipe","ipc"],
    env:{...process.env,CV03_RESOURCE_PROOF_SCHEMA:schema}
  });
  let stderr="",readyResolve,readyReject,messages=[];
  child.stderr.on("data",d=>stderr+=String(d));
  const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
  child.on("message",m=>{
    messages.push(m);
    if(m.type==="ready")readyResolve();
  });
  const done=new Promise((resolve,reject)=>{
    child.once("error",error=>{readyReject(error);reject(error);});
    child.once("exit",(exitCode,signal)=>{
      if(gate&&!messages.some(m=>m.type==="ready"))readyReject(new Error("worker died early: "+stderr));
      resolve({exitCode,signal,messages,stderr});
    });
  });
  return {child,ready:gate?ready:Promise.resolve(),done};
}

const requiresDB={skip:!url && "Set CV03_RESOURCE_PROOF_DATABASE_URL for isolated PostgreSQL test",timeout:60000};

test("C3-01 PostgreSQL: atomic create, separate connections, revision, scope and archive",requiresDB,async()=>{
  const schema="cv03_proof_"+randomUUID().replaceAll("-","").slice(0,15);
  await preparePostgresConditionalResourceSchemaV010({connectionString:url,schema});
  const sql=postgres(url,{max:2,connect_timeout:10});
  const a=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
  const b=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
  try{
    assert.equal(a.conditionalWriteConsistency,"SHARED_POSTGRES_TRANSACTION");
    assert.equal((await a.putIfRevision(put("initial",null))).revision,0);
    await assert.rejects(b.putIfRevision(put("duplicate",null)),/ENTERPRISE_RESOURCE_REVISION_CONFLICT/);
    const now=await b.putIfRevision(put("updated",0));
    assert.equal(now.revision,1);
    assert.equal(now.createdBySubjectId,"person:owner");
    await assert.rejects(a.putIfRevision(put("stale",0)),/ENTERPRISE_RESOURCE_REVISION_CONFLICT/);
    await assert.rejects(a.putIfRevision(put("bad",-1)),/ENTERPRISE_RESOURCE_REVISION_INVALID/);
    assert.deepEqual((await a.get(address)).payload,{name:"updated"});
    assert.equal((await a.list({contextId:address.contextId,namespace:address.namespace})).length,1);
    assert.equal((await a.list({contextId:"enterprise-context:other"})).length,0);
    assert.equal((await a.putIfRevision(put("other tenant",null,{
      contextId:"enterprise-context:other"
    }))).revision,0);
    assert.equal((await b.list({contextId:"enterprise-context:other"})).length,1);
    assert.equal((await b.list({contextId:address.contextId,lifecycleState:"ARCHIVED"})).length,0);
    await assert.rejects(a.archiveIfRevision(archived(0)),/ENTERPRISE_RESOURCE_REVISION_CONFLICT/);
    const done=await b.archiveIfRevision(archived(1));
    assert.equal(done.revision,2);
    assert.equal(done.lifecycleState,"ARCHIVED");
    await assert.rejects(a.putIfRevision(put("revive",2)),/ENTERPRISE_RESOURCE_ALREADY_ARCHIVED/);
    await assert.rejects(a.putIfRevision(put("recreate",null)),/ENTERPRISE_RESOURCE_REVISION_CONFLICT/);
    await assert.rejects(a.archiveIfRevision(archived(2)),/ENTERPRISE_RESOURCE_ALREADY_ARCHIVED/);
    assert.equal((await b.list({contextId:address.contextId,lifecycleState:"ARCHIVED"})).length,1);
    console.log("CV03_POSTGRES_RESOURCE_SEQUENTIAL_PROOF=PASS");
  }finally{
    await Promise.all([a.close(),b.close()]);
    await sql.unsafe('DROP SCHEMA "'+schema+'" CASCADE');
    await sql.end();
  }
});

test("C3-01 PostgreSQL: distinct Node processes cannot both update same revision; lost ACK readback",requiresDB,async()=>{
  const schema="cv03_race_"+randomUUID().replaceAll("-","").slice(0,15);
  await preparePostgresConditionalResourceSchemaV010({connectionString:url,schema});
  const sql=postgres(url,{max:2,connect_timeout:10});
  const a=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
  try {
    await a.putIfRevision(put("base",null));
    const contenders=[
      worker("barrier-write",put("worker-a",0),schema,{gate:true}),
      worker("barrier-write",put("worker-b",0),schema,{gate:true})
    ];
    await Promise.all(contenders.map(w=>w.ready));
    for(const w of contenders)w.child.send({type:"start"});
    const results=await Promise.all(contenders.map(w=>w.done));
    assert.equal(results.filter(x=>x.exitCode===0).length,1,JSON.stringify(results));
    assert.equal(results.filter(x=>x.exitCode===2).length,1,JSON.stringify(results));
    assert.ok(results.some(x=>x.messages.some(m=>m.type==="rejected"&&
      m.code.includes("ENTERPRISE_RESOURCE_REVISION_CONFLICT"))),JSON.stringify(results));
    const after=await a.get(address);
    assert.equal(after.revision,1);
    assert.ok(["worker-a","worker-b"].includes(after.payload.name));

    // A client dies or loses the response after commit. Readback is authoritative.
    const lost=await worker("lost-ack",put("ack-lost",1),schema).done;
    assert.equal(lost.exitCode,19);
    assert.ok(lost.messages.every(m=>m.type!=="result"));
    const restarted=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
    try{
      const final=await restarted.get(address);
      assert.equal(final.revision,2);
      assert.deepEqual(final.payload,{name:"ack-lost"});
      await assert.rejects(restarted.putIfRevision(put("blind retry",1)),/ENTERPRISE_RESOURCE_REVISION_CONFLICT/);
    }finally{await restarted.close();}
    console.log("CV03_POSTGRES_RESOURCE_MULTI_PROCESS_PROOF=PASS");
  }finally{
    await a.close();
    await sql.unsafe('DROP SCHEMA "'+schema+'" CASCADE');
    await sql.end();
  }
});

test("C3-01 PostgreSQL adapter rejects unsafe schema name before connecting",()=>{
  assert.throws(
    ()=>createPostgresConditionalResourceRepositoryV010({
      connectionString:"postgres://invalid.invalid/test",schema:'cv03_ok";DROP TABLE data'
    }),
    /ENTERPRISE_RESOURCE_POSTGRES_ISOLATED_SCHEMA_REQUIRED/
  );
});
