import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,createHash} from "node:crypto";
import {fork} from "node:child_process";
import {fileURLToPath} from "node:url";
import postgres from "postgres";
import {
  preparePostgresConditionalResourceSchemaV010,
  createPostgresConditionalResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources-postgres.js";
import {digestConditionalResourcePutV010} from
  "../../dist/providers/enterprise-context/resource-receipt-digest.js";

const url=process.env.CV03_RESOURCE_PROOF_DATABASE_URL;
const requiresDB={skip:!url&&"Set CV03_RESOURCE_PROOF_DATABASE_URL for real Postgres",
  timeout:60000};
const fixture=fileURLToPath(new URL("../fixtures/cv03-resource-postgres-child.mjs",import.meta.url));
const addr={
  contextId:"enterprise-context:one",namespace:"evo.saved-view.personal.test-owner",
  collectionId:"collection-views",resourceType:"saved-collection-view",
  resourceId:"hk-suppliers"
};
const sha=value=>createHash("sha256").update(String(value)).digest("hex");
const input=(title,revision,changes={})=>({
  ...addr,schemaRef:"evo.saved-view.personal/0.1.0",
  ownerPackageId:"host-enterprise-context-provider",
  storageKind:"DOCUMENT",
  payload:{contractVersion:"0.1.0",visibility:"PERSONAL",viewId:addr.resourceId,
    title,ownerSubjectId:"owner-a",enterpriseId:"one",
    queryOperationId:"dictionary.collection.query",
    collectionId:"evo.business-dictionary.directory",
    schemaRef:"evo.business-dictionary.directory/0.1.0",
    query:{search:"Hong Kong"},columns:["dictionaryId"],presentation:"table"},
  expectedRevision:revision,actorSubjectId:"owner-a",
  recordedAt:"2026-11-09T05:00:00.000Z",...changes
});
const receipt=(write,changes={})=>{
  const digest=digestConditionalResourcePutV010(write);
  return {
    receiptId:"cv03-receipt:"+digest,invocationId:"cv03-invoke:"+digest,
    idempotencyKey:"cv03-idem:"+digest,
    sourceInteractionId:"cv03-transaction",
    sourceActionId:"collection.saved-view.personal.save",
    principalSubjectId:"owner-a",principalActorType:"AI",
    context:{contractVersion:"0.1.0",kind:"ENTERPRISE",
      contextId:write.contextId,enterpriseId:"one"},
    toolId:"collection.saved-view.personal.save",
    ownerPackageId:"host-enterprise-context-provider",
    capability:"enterprise.collection.saved-view",
    inputDigest:digest,requestedAt:write.recordedAt,...changes
  };
};
function lookup(write,approval,changes={}){
  return {address:write,idempotencyKey:approval.idempotencyKey,
    receiptId:approval.receiptId,inputDigest:approval.inputDigest,
    principalSubjectId:approval.principalSubjectId,
    principalActorType:approval.principalActorType,...changes};
}
function worker(mode,request,schema,{gate=false}={}){
  const child=fork(fixture,[mode,Buffer.from(JSON.stringify(request)).toString("base64")],{
    stdio:["ignore","pipe","pipe","ipc"],
    env:{...process.env,CV03_RESOURCE_PROOF_SCHEMA:schema}
  });
  const messages=[];let stderr="";
  child.stderr.on("data",d=>stderr+=String(d));
  let readyResolve,readyReject;
  const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
  child.on("message",m=>{messages.push(m);if(m.type==="ready")readyResolve();});
  const done=new Promise((resolve,reject)=>{
    child.once("error",e=>{readyReject(e);reject(e);});
    child.once("exit",(code,signal)=>{
      if(gate&&!messages.some(m=>m.type==="ready"))readyReject(Error("child died before READY: "+stderr));
      resolve({code,signal,messages,stderr});
    });
  });
  return {child,ready:gate?ready:Promise.resolve(),done};
}

test("CV-03 real PG: CAS and immutable Agent receipt commit atomically; replay, readback, collision and evidence failure",requiresDB,async()=>{
  const schema="cv03_receipt_"+randomUUID().replaceAll("-","").slice(0,14);
  await preparePostgresConditionalResourceSchemaV010({connectionString:url,schema});
  const db=postgres(url,{max:3,connect_timeout:10});
  const a=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
  const b=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
  try{
    const first=input("香港供应商",null),approval=receipt(first);
    await assert.rejects(a.putIfRevisionWithReceipt(first,receipt(first,{
      principalSubjectId:"owner-forged"
    })),/CV03_RESOURCE_HOST_RECEIPT_BINDING_INVALID/);
    await assert.rejects(a.putIfRevisionWithReceipt(first,receipt(first,{
      inputDigest:"0".repeat(64)
    })),/CV03_RESOURCE_HOST_RECEIPT_DIGEST_MISMATCH/);
    const committed=await a.putIfRevisionWithReceipt(first,approval);
    assert.equal(committed.replayed,false);
    assert.equal(committed.resource.revision,0);
    assert.equal(committed.receipt.status,"SUCCEEDED");
    assert.equal(committed.receipt.principalActorType,"AI");
    assert.match(committed.receipt.resultDigest,/^[a-f0-9]{64}$/);
    assert.deepEqual((await b.getCommittedWriteByIdempotencyKey(
      lookup(first,approval)))?.resource,committed.resource);
    assert.equal((await b.putIfRevisionWithReceipt(first,approval)).replayed,true);
    assert.equal((await b.get(addr)).revision,0);
    assert.equal(await b.getCommittedWriteByIdempotencyKey(lookup(first,approval,{
      principalSubjectId:"owner-b"
    })),undefined);
    assert.equal(await b.getCommittedWriteByIdempotencyKey(lookup(first,approval,{
      receiptId:"receipt:guessed"
    })),undefined);
    assert.equal(await b.getCommittedWriteByIdempotencyKey(lookup(first,approval,{
      address:{...addr,contextId:"enterprise-context:two"}
    })),undefined);
    assert.equal(await b.getCommittedWriteByIdempotencyKey(lookup(first,approval,{
      inputDigest:"0".repeat(64)
    })),undefined);

    const second=input("代理保存第二版",0),other=receipt(second);
    const updated=await b.putIfRevisionWithReceipt(second,other);
    assert.equal(updated.resource.revision,1);
    assert.equal((await b.putIfRevisionWithReceipt(first,approval)).resource.revision,0);
    assert.equal((await a.get(addr)).revision,1);
    assert.equal((await a.getCommittedWriteByIdempotencyKey(lookup(first,approval))).resource.revision,0);
    await assert.rejects(a.putIfRevisionWithReceipt(input("篡改旧 key",1),{
      ...approval,inputDigest:digestConditionalResourcePutV010(input("篡改旧 key",1))
    }),/CV03_RESOURCE_RECEIPT_IDEMPOTENCY_CONFLICT/);
    await assert.rejects(db.unsafe('UPDATE "'+schema+'".cv03_resource_receipts '+
      "SET input_digest='changed' WHERE receipt_id=$1",[approval.receiptId]),
      /CV03_RESOURCE_RECEIPT_IMMUTABLE/);
    await assert.rejects(db.unsafe('DELETE FROM "'+schema+'".cv03_resource_receipts '+
      "WHERE receipt_id=$1",[approval.receiptId]),
      /CV03_RESOURCE_RECEIPT_IMMUTABLE/);

    await db.unsafe('ALTER TABLE "'+schema+'".cv03_resource_receipts '+
      "ADD CONSTRAINT cv03_reject_fault CHECK(receipt_id <> 'cv03-receipt:fault')");
    const newAddress={...addr,resourceId:"fault-view"};
    const faultInput=input("failed receipt",null,{...newAddress});
    const faultReceipt=receipt(faultInput,{receiptId:"cv03-receipt:fault"});
    await assert.rejects(b.putIfRevisionWithReceipt(faultInput,faultReceipt),
      /violates check constraint/);
    assert.equal(await a.get(newAddress),undefined,"receipt failure rolled back business row");
    assert.equal(await b.getCommittedWriteByIdempotencyKey(
      lookup(faultInput,faultReceipt)),undefined);
    await db.unsafe('ALTER TABLE "'+schema+'".cv03_resource_receipts '+
      "DROP CONSTRAINT cv03_reject_fault");
    console.log("CV03_ATOMIC_HOST_RECEIPT_PG_PROOF=PASS");
  }finally{
    await Promise.all([a.close(),b.close()]);
    await db.unsafe('DROP SCHEMA "'+schema+'" CASCADE');
    await db.end();
  }
});

test("CV-03 actual OS processes: same receipt key replays once, distinct keys lose revision, lost ACK readback",requiresDB,async()=>{
  const schema="cv03_ack_"+randomUUID().replaceAll("-","").slice(0,14);
  await preparePostgresConditionalResourceSchemaV010({connectionString:url,schema});
  const admin=postgres(url,{max:2,connect_timeout:10});
  const db=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
  try{
    const base=input("base",null),proof=receipt(base);
    const writers=[
      worker("receipt-barrier-write",{input:base,receipt:proof},schema,{gate:true}),
      worker("receipt-barrier-write",{input:base,receipt:proof},schema,{gate:true})
    ];
    await Promise.all(writers.map(x=>x.ready));
    for(const x of writers)x.child.send({start:true});
    const results=await Promise.all(writers.map(x=>x.done));
    assert.equal(results.filter(x=>x.code===0).length,2,JSON.stringify(results));
    assert.deepEqual(results.map(x=>x.messages.find(m=>m.type==="result")?.replayed).sort(),
      [false,true]);
    assert.equal((await db.get(addr)).revision,0);
    const count=await admin.unsafe('SELECT count(*)::int AS n FROM "'+schema+
      '".cv03_resource_receipts');
    assert.equal(count[0].n,1);
    const w1=input("first contender",0),w2=input("second contender",0);
    const races=[
      worker("receipt-barrier-write",{input:w1,receipt:receipt(w1)},schema,{gate:true}),
      worker("receipt-barrier-write",{input:w2,receipt:receipt(w2)},schema,{gate:true})
    ];
    await Promise.all(races.map(x=>x.ready));
    for(const x of races)x.child.send({start:true});
    const finished=await Promise.all(races.map(x=>x.done));
    assert.equal(finished.filter(x=>x.code===0).length,1,JSON.stringify(finished));
    assert.equal(finished.filter(x=>x.code===2).length,1,JSON.stringify(finished));
    assert.ok(finished.some(x=>x.messages.some(m=>
      m.type==="rejected"&&m.code.includes("ENTERPRISE_RESOURCE_REVISION_CONFLICT"))));
    assert.equal((await db.get(addr)).revision,1);

    const lostInput=input("ACK lost despite durable commit",1),lostReceipt=receipt(lostInput);
    const lost=await worker("receipt-lost-ack",
      {input:lostInput,receipt:lostReceipt},schema).done;
    assert.equal(lost.code,19);
    assert.deepEqual(lost.messages,[]);
    const restarted=createPostgresConditionalResourceRepositoryV010({connectionString:url,schema});
    try{
      const durable=await restarted.getCommittedWriteByIdempotencyKey(
        lookup(lostInput,lostReceipt));
      assert.equal(durable.receipt.status,"SUCCEEDED");
      assert.equal(durable.resource.revision,2);
      assert.equal((await restarted.get(addr)).revision,2);
      assert.equal((await restarted.putIfRevisionWithReceipt(
        lostInput,lostReceipt)).replayed,true);
      assert.equal((await restarted.get(addr)).revision,2);
    }finally{await restarted.close();}
    console.log("CV03_ATOMIC_HOST_RECEIPT_MULTI_PROCESS_PROOF=PASS");
  }finally{
    await db.close();
    await admin.unsafe('DROP SCHEMA "'+schema+'" CASCADE');
    await admin.end();
  }
});
