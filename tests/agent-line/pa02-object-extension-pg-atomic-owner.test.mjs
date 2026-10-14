import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import {fork} from "node:child_process";
import {fileURLToPath} from "node:url";
import postgres from "postgres";
import {
  preparePostgresObjectExtensionOwnerSchemaV010,
  createPostgresObjectExtensionAtomicOwnerV010
} from "../../dist/apps/object-extension/agent-owner-postgres.js";
import {OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010}
  from "../../dist/apps/object-extension/constants.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const stable=x=>Array.isArray(x)?x.map(stable):
  x&&typeof x==="object"?Object.fromEntries(Object.entries(x)
    .sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)])):x;
const hash=x=>createHash("sha256").update(JSON.stringify(stable(x))).digest("hex");
const definition=(id,field)=>({
  contractVersion:"0.1.0",extensionId:id,
  targetObjectType:"counterparty.subject",targetSlot:"basic",
  namespace:"demo",fieldId:field,semanticType:"text",
  valueType:"STRING",label:{default:"Agent "+field},required:false,
  order:101,surfaces:["DETAIL"]
});
const scope={principalSubjectId:"subject:human",principalActorType:"HUMAN",
  contextKind:"ENTERPRISE",contextId:"enterprise:one",enterpriseId:"org:one"};
const createRequest=(label,opts={})=>{
  const argumentsValue={definition:definition("ext:pa02:"+label,"field"+label)};
  return {
    scope,runId:"run:"+label,effectId:"effect:"+label,
    receiptId:"receipt:"+label,idempotencyKey:"idem:"+label,
    inputDigest:hash(argumentsValue),
    toolId:OBJECT_EXTENSION_DEFINITION_UPSERT_OPERATION_V010,
    arguments:argumentsValue,...opts
  };
};
const proofRequest=(r)=>({
  scope:r.scope,runId:r.runId,effectId:r.effectId,receiptId:r.receiptId,
  inputDigest:r.inputDigest,ownerPackageId:"evo-object-extension"
});
const childPath=fileURLToPath(new URL("./fixtures/pa02-object-extension-pg-child.mjs",import.meta.url));
function child(mode,request,schema,{checkpoint=false}={}){
  const cp=fork(childPath,[mode,Buffer.from(JSON.stringify(request)).toString("base64")],{
    stdio:["ignore","pipe","pipe","ipc"],env:{
      ...process.env,PA02_OBJECT_PG_SCHEMA:schema
    }});
  let stderr="",messages=[];
  cp.stderr.on("data",d=>stderr+=d);
  cp.on("message",v=>messages.push(v));
  if(checkpoint) {
    return new Promise((resolve,reject)=>{
      cp.on("message",v=>{
        if(v.checkpoint==="BUSINESS_INSERTED_UNCOMMITTED")
          resolve({cp,messages});
      });
      cp.on("exit",code=>reject(Error("worker exited before checkpoint: "+code+" "+stderr)));
      cp.on("error",reject);
    });
  }
  return new Promise((resolve,reject)=>{
    cp.on("error",reject);
    cp.on("exit",(code,signal)=>resolve({code,signal,messages,stderr}));
  });
}
function count(db,schema,table,contextId){
  return db.unsafe('SELECT count(*)::int AS n FROM "'+schema+'".'+table+
    " WHERE context_id=$1",[contextId]).then(rows=>rows[0].n);
}
const requirePG={skip:!url && "Set PA02A_PROOF_DATABASE_URL for real PostgreSQL 18"};

test("PA02 Object Extension PostgreSQL Owner: multi-process atomic commit, retry, crash, lost ACK and isolated independent proof",requirePG,async()=>{
  const schema="pa02_obj_"+randomUUID().replaceAll("-","").slice(0,16);
  await preparePostgresObjectExtensionOwnerSchemaV010({connectionString:url,schema});
  const db=postgres(url,{max:4});
  const owner=createPostgresObjectExtensionAtomicOwnerV010({connectionString:url,schema});
  try{
    const base=createRequest("concurrent");
    const attempts=await Promise.all(Array.from({length:6},()=>child("write",base,schema)));
    assert.ok(attempts.every(a=>a.code===0),JSON.stringify(attempts));
    assert.equal(await count(db,schema,"pa02_definitions",scope.contextId),1);
    assert.equal(await count(db,schema,"pa02_owner_evidence",scope.contextId),1);
    assert.equal((await owner.getResource(scope,base.arguments.definition.extensionId))
      ?.payload?.fieldId,"fieldconcurrent");
    const independently=await child("verify",proofRequest(base),schema);
    assert.equal(independently.code,0);
    assert.equal(independently.messages[0].proof.outcome,"SUCCEEDED");

    // Reuse of a key with another source tuple, even by the same actor, fails.
    const conflict=await child("write",{...base,runId:"run:forged"},schema);
    assert.equal(conflict.code,1);
    assert.match(conflict.messages[0].error,/IDEMPOTENCY_CONFLICT/);
    const wrongActor=await child("write",{
      ...base,scope:{...scope,principalSubjectId:"another-human"}
    },schema);
    assert.equal(wrongActor.code,1);
    assert.match(wrongActor.messages[0].error,/IDEMPOTENCY_CONFLICT/);
    const wrongEnterprise=await child("write",{
      ...createRequest("tenant-attack"),
      scope:{...scope,enterpriseId:"org:impostor"}
    },schema);
    assert.equal(wrongEnterprise.code,1);
    assert.match(wrongEnterprise.messages[0].error,/ENTERPRISE_BINDING_CONFLICT/);
    assert.equal((await child("verify",{
      ...proofRequest(base),scope:{...scope,enterpriseId:"org:impostor"}
    },schema)).messages[0].proof.outcome,"UNRESOLVED");
    assert.equal((await child("verify",{
      ...proofRequest(base),scope:{...scope,principalSubjectId:"other"}
    },schema)).messages[0].proof.outcome,"UNRESOLVED");
    assert.equal((await child("verify",{
      ...proofRequest(base),inputDigest:"0".repeat(64)
    },schema)).messages[0].proof.outcome,"UNRESOLVED");
    assert.equal((await child("verify",{
      ...proofRequest(base),ownerPackageId:"spoof"
    },schema)).messages[0].proof.outcome,"UNRESOLVED");
    assert.equal(await owner.getResource({
      contextId:scope.contextId,enterpriseId:"org:impostor"
    },base.arguments.definition.extensionId),undefined);

    // A different idempotency key cannot overwrite an existing resource.
    const duplicateObject=createRequest("new-operation",{
      arguments:base.arguments,inputDigest:base.inputDigest
    });
    const forbidden=await child("write",duplicateObject,schema);
    assert.equal(forbidden.code,1);
    assert.match(forbidden.messages[0].error,/CREATE_ONLY_OR_FIELD_CONFLICT/);

    // Separate concurrent keys cannot violate the business field uniqueness.
    const fieldCollision=createRequest("same-field",{
      arguments:{definition:{...base.arguments.definition,
        extensionId:"ext:pa02:distinct"}},
    });
    fieldCollision.inputDigest=hash(fieldCollision.arguments);
    const collision=await child("write",fieldCollision,schema);
    assert.equal(collision.code,1);
    assert.match(collision.messages[0].error,/CREATE_ONLY_OR_FIELD_CONFLICT/);

    // Business committed; caller never receives a success response.
    const lost=createRequest("lost-ack");
    const ack=await child("drop-ack",lost,schema);
    assert.equal(ack.code,19);
    assert.deepEqual(ack.messages,[]);
    assert.equal((await child("verify",proofRequest(lost),schema))
      .messages[0].proof.outcome,"SUCCEEDED");
    assert.equal((await child("write",lost,schema)).code,0);
    assert.equal(await count(db,schema,"pa02_owner_evidence",scope.contextId),2);

    // The worker dies AFTER its domain insert but BEFORE receipt/COMMIT.
    // PostgreSQL must roll the uncommitted business row back.
    const crash=createRequest("crash-before-commit");
    const suspended=await child("crash-after-domain-insert",crash,schema,{checkpoint:true});
    suspended.cp.kill("SIGKILL");
    await new Promise(resolve=>suspended.cp.once("exit",resolve));
    assert.equal(await owner.getResource(scope,crash.arguments.definition.extensionId),
      undefined);
    assert.equal((await child("verify",proofRequest(crash),schema))
      .messages[0].proof.outcome,"UNRESOLVED");
    assert.equal(await count(db,schema,"pa02_definitions",scope.contextId),2);

    // The DB refuses evidence insertion. The domain insert must also roll back.
    await db.unsafe('ALTER TABLE "'+schema+'".pa02_owner_evidence '+
      "ADD CONSTRAINT pa02_reject_test_receipt CHECK(receipt_id <> 'receipt:fault')");
    const fault=createRequest("fault");
    const rejected=await child("write",fault,schema);
    assert.equal(rejected.code,1);
    assert.equal(await owner.getResource(scope,fault.arguments.definition.extensionId),
      undefined);
    await db.unsafe('ALTER TABLE "'+schema+'".pa02_owner_evidence '+
      "DROP CONSTRAINT pa02_reject_test_receipt");

    // Once committed, even direct SQL cannot update or delete a receipt.
    await assert.rejects(db.unsafe('UPDATE "'+schema+'".pa02_owner_evidence '+
      "SET receipt_id='changed' WHERE context_id=$1",[scope.contextId]),
      /PA02_OBJECT_PG_EVIDENCE_IMMUTABLE/);
    await assert.rejects(db.unsafe('DELETE FROM "'+schema+'".pa02_owner_evidence '+
      "WHERE context_id=$1",[scope.contextId]),
      /PA02_OBJECT_PG_EVIDENCE_IMMUTABLE/);
    // An allowed later edit to current business data must not erase the
    // *historical* evidence that its creation already committed.
    await db.unsafe('UPDATE "'+schema+'".pa02_definitions '+
      "SET resource=jsonb_set(resource,'{payload,label,default}',"+
      "'\"Human later edit\"'::jsonb) WHERE context_id=$1 AND extension_id=$2",
      [scope.contextId,base.arguments.definition.extensionId]);
    assert.equal((await child("verify",proofRequest(base),schema))
      .messages[0].proof.outcome,"SUCCEEDED");

    const differentScope={...scope,contextId:"enterprise:other",enterpriseId:"org:other"};
    const other=createRequest("other-tenant",{scope:differentScope});
    assert.equal((await child("write",other,schema)).code,0);
    assert.equal((await child("verify",proofRequest(other),schema))
      .messages[0].proof.outcome,"SUCCEEDED");
    assert.equal((await child("verify",{
      ...proofRequest(other),scope:{...scope}
    },schema)).messages[0].proof.outcome,"UNRESOLVED");
    assert.equal(await count(db,schema,"pa02_owner_evidence",differentScope.contextId),1);

    console.log("PA02_OBJECT_EXTENSION_POSTGRES_ATOMIC_OWNER="+JSON.stringify({
      domainBusinessResource:true,independentProcesses:6,
      atomicDomainAndImmutableReceipt:true,duplicateCommitCount:1,
      lostAckOwnerVerified:true,crashBeforeCommitRollback:true,
      receiptFailureRollback:true,immutableHistoryAfterEdit:true,
      forgedPrincipalAndTenantDenied:true,productionRegistered:false,
      productionEligible:false
    }));
  }finally{
    await owner.close();
    await db.unsafe('DROP SCHEMA "'+schema+'" CASCADE');
    await db.end();
  }
});
