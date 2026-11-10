import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import postgres from "postgres";
import {preparePostgresConditionalResourceSchemaV010}
  from "../../dist/providers/enterprise-context/resources-postgres.js";
import {
  stableResourceReceiptJsonV010,digestConditionalResourcePutV010,
  hmacCv03HostResourceReceiptV010,sha256ResourceReceiptV010
} from "../../dist/providers/enterprise-context/resource-receipt-digest.js";
import {cv03N1GatewaySqlV010}
  from "../../tools/cv03-n1-isolated-signed-sql-gateway.mjs";
import {
  cv03N104cIsolatedAuthorityBridgeSqlV010,
  cv03N104cTestEventProofV010
} from "../../tools/cv03-n104c-isolated-authority-event-bridge.mjs";

const url=process.env.CV03_RESOURCE_PROOF_DATABASE_URL;
const allowed=(process.env.CV03_N1_ONLY_ISOLATED_GATEWAY_TEST==="YES_CI_LOCAL"&&
  !!url&&(()=>{try{
    const p=new URL(url);
    return ["127.0.0.1","localhost"].includes(p.hostname)&&
      p.pathname==="/cv03proof";
  }catch{return false;}})());
const isolated={skip:!allowed&&"CI-only PostgreSQL localhost/cv03proof",
  timeout:90000};
const op="collection.saved-view.personal.save";
const ownerPkg="host-enterprise-context-provider";
const ctx="enterprise-context:company-a";
const subject="owner-a";
const receiptKeyId="cv03-n104c-host-test-receipt";
const receiptSecret="CV03_N104C_TEST_HOST_RECEIPT_SECRET_ONLY_FOR_LOCAL_PG_001";
const eventKeyId="cv03-n104c-test-event-key-a";
const eventSecret="CV03_N104C_TEST_AUTHORITY_EVENT_KEY_ONLY_FOR_LOCAL_PG_A";
const eventKeyIdB="cv03-n104c-test-event-key-b";
const eventSecretB="CV03_N104C_TEST_AUTHORITY_EVENT_KEY_ONLY_FOR_LOCAL_PG_B";
const quote=s=>'"'+s+'"';

test("CV03 N1-04c rejects untrusted SQL schema and test signing setup",()=>{
  assert.throws(()=>cv03N104cIsolatedAuthorityBridgeSqlV010(
    'cv03_bad"; DROP TABLE x'),/CV03_N1_ISOLATED_SCHEMA_REQUIRED/);
  assert.throws(()=>cv03N104cTestEventProofV010({},eventKeyId,"short"),
    /CV03_N104C_TEST_SIGNER_INVALID/);
});

test("CV03 N1-04c real PG18 authenticated delivery, no-forgery, expiry, revoke, outage and fail-closed gap",isolated,async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const schema="cv03_delivery_"+suffix;
  const qSchema=quote(schema);
  const owner="cv03_delivery_owner_"+suffix;
  const deliver="cv03_delivery_ingest_"+suffix;
  const runtime="cv03_delivery_runtime_"+suffix;
  const pwdDeliver="ci-deliver-"+randomUUID().replaceAll("-","");
  const pwdRuntime="ci-runtime-"+randomUUID().replaceAll("-","");
  const admin=postgres(url,{max:2,connect_timeout:10,prepare:false});
  const roles=[];
  let schemaCreated=false,deliverySql,runtimeSql;
  const runtimeUrl=(role,password)=>{const u=new URL(url);
    u.username=role;u.password=password;return u.toString();};
  const functionName=qSchema+".cv03_n1_signed_save";
  const ingestName=qSchema+".cv03_n104c_ingest_signed_event";
  const event=(epoch,enabled,override={})=>({
    source:"PA05_OWNER_TEST_ONLY",
    contextId:ctx,principalSubjectId:subject,
    operationId:op,authorityEpoch:epoch,enabled,
    issuedAt:new Date().toISOString(),...override
  });
  const send=async (ev,keyId=eventKeyId,secret=eventSecret)=>{
    const proof=cv03N104cTestEventProofV010(ev,keyId,secret);
    const rows=await deliverySql.unsafe(
      "SELECT "+ingestName+"($1::text,$2::text) AS result",
      [proof.envelope,proof.signature]);
    return rows[0].result;
  };
  const signedWrite=(id,title,actorType="HUMAN")=>{
    const when=new Date().toISOString();
    const input={
      contextId:ctx,namespace:"evo.saved-view.personal."+subject,
      collectionId:"collection-views",resourceType:"saved-collection-view",
      resourceId:id,schemaRef:"evo.saved-view.personal/0.1.0",
      ownerPackageId:ownerPkg,storageKind:"DOCUMENT",
      payload:{contractVersion:"0.1.0",viewId:id,
        title,visibility:"PERSONAL",ownerSubjectId:subject,
        enterpriseId:"company-a",queryOperationId:"dictionary.collection.query",
        collectionId:"evo.business-dictionary.directory",
        schemaRef:"evo.business-dictionary.directory/0.1.0",
        query:{search:"Hong Kong"},columns:["dictionaryId"],
        presentation:"table"},
      expectedRevision:null,actorSubjectId:subject,recordedAt:when
    };
    const resource={
      contractVersion:"0.1.0",contextId:input.contextId,
      namespace:input.namespace,collectionId:input.collectionId,
      resourceType:input.resourceType,resourceId:input.resourceId,
      schemaRef:input.schemaRef,ownerPackageId:input.ownerPackageId,
      storageKind:"DOCUMENT",payload:input.payload,
      lifecycleState:"ACTIVE",revision:0,createdAt:when,
      createdBySubjectId:subject,updatedAt:when,
      updatedBySubjectId:subject
    };
    const nonce=randomUUID();
    const receipt={
      receiptId:"ci-receipt:"+nonce,invocationId:"ci-invoke:"+nonce,
      idempotencyKey:"ci-idem:"+nonce,
      sourceInteractionId:"ci-ui:"+nonce,sourceActionId:op,
      principalSubjectId:subject,principalActorType:actorType,
      context:{contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId:ctx,enterpriseId:"company-a"},
      toolId:op,ownerPackageId:ownerPkg,
      capability:"enterprise.collection.saved-view",
      inputDigest:digestConditionalResourcePutV010(input),
      requestedAt:when
    };
    const completed={
      ...receipt,contractVersion:"0.1.0",effect:"WRITE",
      status:"SUCCEEDED",completedAt:when,
      resultDigest:sha256ResourceReceiptV010(resource),
      resultEntityRefs:["enterprise-resource:"+id],
      resultSummary:"Saved view resource and immutable receipt committed atomically",
      latestEventId:"cv03-resource-commit:"+receipt.receiptId
    };
    return [
      stableResourceReceiptJsonV010(input),
      stableResourceReceiptJsonV010({
        domain:"cv03.enterprise-resource.host-write/0.1.0",
        keyId:receiptKeyId,receipt
      }),
      hmacCv03HostResourceReceiptV010(receipt,receiptKeyId,receiptSecret),
      stableResourceReceiptJsonV010(resource),
      stableResourceReceiptJsonV010(completed),
      stableResourceReceiptJsonV010(receipt)
    ];
  };
  const write=async (id,title,actor="HUMAN")=>{
    const rows=await runtimeSql.unsafe(
      "SELECT "+functionName+"($1::text,$2::text,$3::text,"+
        "$4::text,$5::text,$6::text) AS result",
      signedWrite(id,title,actor));
    return rows[0].result;
  };
  try{
    await admin.unsafe("CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public");
    for(const [role,sql] of [[owner,"NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE"],
      [deliver,"LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '"+
        pwdDeliver+"'"],
      [runtime,"LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '"+
        pwdRuntime+"'"]]){
      await admin.unsafe("CREATE ROLE "+quote(role)+" "+sql);
      roles.push(role);
    }
    await preparePostgresConditionalResourceSchemaV010({
      connectionString:url,schema
    });
    schemaCreated=true;
    await admin.unsafe(cv03N1GatewaySqlV010(schema));
    await admin.unsafe(cv03N104cIsolatedAuthorityBridgeSqlV010(schema));
    await admin.unsafe("INSERT INTO "+qSchema+
      ".cv03_n1_signing_keys(key_id,secret) VALUES ($1,$2)",
      [receiptKeyId,receiptSecret]);
    await admin.unsafe("INSERT INTO "+qSchema+
      ".cv03_n104c_event_keys(key_id,secret) VALUES ($1,$2),($3,$4)",
      [eventKeyId,eventSecret,eventKeyIdB,eventSecretB]);
    await admin.unsafe("ALTER SCHEMA "+qSchema+" OWNER TO "+quote(owner));
    for(const table of ["resources","cv03_resource_receipts",
      "cv03_n1_signing_keys","cv03_n1_operation_policy",
      "cv03_n104c_event_keys"]){
      await admin.unsafe("ALTER TABLE "+qSchema+"."+quote(table)+
        " OWNER TO "+quote(owner));
      await admin.unsafe("REVOKE ALL ON TABLE "+qSchema+"."+
        quote(table)+" FROM PUBLIC");
    }
    for(const fn of [
      "cv03_n1_signed_save(text,text,text,text,text,text)",
      "cv03_n1_apply_owner_policy_epoch(text,text,text,bigint,boolean)",
      "cv03_n104c_ingest_signed_event(text,text)",
      "cv03_reject_receipt_mutation()"
    ]){
      await admin.unsafe("ALTER FUNCTION "+qSchema+"."+fn+
        " OWNER TO "+quote(owner));
      await admin.unsafe("REVOKE ALL ON FUNCTION "+qSchema+"."+fn+
        " FROM PUBLIC");
    }
    await admin.unsafe("REVOKE ALL ON SCHEMA "+qSchema+" FROM PUBLIC");
    await admin.unsafe("GRANT USAGE ON SCHEMA "+qSchema+" TO "+
      quote(deliver)+","+quote(runtime));
    await admin.unsafe("GRANT EXECUTE ON FUNCTION "+ingestName+
      "(text,text) TO "+quote(deliver));
    await admin.unsafe("GRANT EXECUTE ON FUNCTION "+functionName+
      "(text,text,text,text,text,text) TO "+quote(runtime));
    deliverySql=postgres(runtimeUrl(deliver,pwdDeliver),{
      max:1,connect_timeout:10,prepare:false
    });
    runtimeSql=postgres(runtimeUrl(runtime,pwdRuntime),{
      max:2,connect_timeout:10,prepare:false
    });
    await assert.rejects(runtimeSql.unsafe(
      "SELECT "+ingestName+"($1,$2)",["{}","0".repeat(64)]
    ),/permission denied/i);
    await assert.rejects(deliverySql.unsafe(
      "SELECT * FROM "+qSchema+".cv03_n104c_event_keys"
    ),/permission denied/i);
    await assert.rejects(deliverySql.unsafe(
      "SELECT * FROM "+qSchema+".cv03_n1_operation_policy"
    ),/permission denied/i);
    await assert.rejects(deliverySql.unsafe(
      "SELECT "+qSchema+".cv03_n1_apply_owner_policy_epoch("+
        "$1,$2,$3,1,true)",[ctx,subject,op]
    ),/permission denied/i);
    await assert.rejects(deliverySql.unsafe(
      "SELECT "+functionName+"($1,$2,$3,$4,$5,$6)",
      ["","","","","",""]),/permission denied/i);

    await assert.rejects(write("no-policy","no mirror"),
      /CV03_N104_OPERATION_REVOKED_OR_UNMIRRORED/);
    const goodEvent=event(1,true);
    const signed=cv03N104cTestEventProofV010(
      goodEvent,eventKeyId,eventSecret);
    await assert.rejects(deliverySql.unsafe(
      "SELECT "+ingestName+"($1::text,$2::text)",
      [signed.envelope,"0".repeat(64)]
    ),/CV03_N104C_EVENT_SIGNATURE_INVALID/);
    await assert.rejects(deliverySql.unsafe(
      "SELECT "+ingestName+"($1::text,$2::text)",
      [signed.envelope.replace("company-a","company-b"),signed.signature]
    ),/CV03_N104C_EVENT_SIGNATURE_INVALID/);
    await assert.rejects(send(event(1,true,{source:"FORGED_PA05"})),
      /CV03_N104C_EVENT_INVALID/);
    await assert.rejects(send(event(1,true,{
      issuedAt:new Date(Date.now()-3*60*1000).toISOString()
    })),/CV03_N104C_EVENT_EXPIRED/);
    await assert.rejects(send(event(1,true,{
      issuedAt:new Date(Date.now()+2*60*1000).toISOString()
    })),/CV03_N104C_EVENT_EXPIRED/);
    assert.equal(await send(goodEvent),"APPLIED");
    assert.equal((await write("human","HUMAN authorized","HUMAN")).resource.revision,0);
    assert.equal((await write("agent","AI authorized","AI")).receipt.status,"SUCCEEDED");
    // The valid signed proof from earlier remains cryptographically valid,
    // but a physical revoked epoch must deny a new WRITE.
    assert.equal(await send(event(2,false)),"APPLIED");
    await assert.rejects(write("revoked","must fail"),
      /CV03_N104_OPERATION_REVOKED_OR_UNMIRRORED/);
    assert.equal(await deliverySql.unsafe(
      "SELECT "+ingestName+"($1,$2) AS result",
      [signed.envelope,signed.signature]).then(r=>r[0].result),
    "STALE_IGNORED");
    await assert.rejects(write("stale","stale event"),
      /CV03_N104_OPERATION_REVOKED_OR_UNMIRRORED/);
    assert.equal(await send(event(3,true)),"APPLIED");
    assert.equal((await write("reenabled","after epoch3")).resource.revision,0);
    // No delivery for > 90 sec: simulate DB-clock lease expiry without
    // waiting and prove even a still-enabled mirror cannot authorize WRITE.
    await admin.unsafe("UPDATE "+qSchema+
      ".cv03_n1_operation_policy SET lease_until=clock_timestamp()-"+
      " interval '1 second' WHERE context_id=$1 AND principal_subject_id=$2"+
      " AND operation_id=$3",[ctx,subject,op]);
    await assert.rejects(write("outage","never delivered revoke"),
      /CV03_N104_OPERATION_REVOKED_OR_UNMIRRORED/);
    assert.equal(await send(event(4,true)),"APPLIED");
    assert.equal((await write("fresh","delivery recovered")).resource.revision,0);
    await admin.unsafe("UPDATE "+qSchema+
      ".cv03_n104c_event_keys SET enabled=false WHERE key_id=$1",
      [eventKeyId]);
    await assert.rejects(send(event(5,false)),
      /CV03_N104C_EVENT_KEY_INACTIVE/);
    // New credential is trusted independently by the DB; it does not
    // reset the epoch, and never re-enables anything by old key replay.
    assert.equal(await send(event(5,false),eventKeyIdB,eventSecretB),"APPLIED");
    await assert.rejects(write("key-rotated","revoked under new key"),
      /CV03_N104_OPERATION_REVOKED_OR_UNMIRRORED/);
    assert.equal(await send(event(7,true),eventKeyIdB,eventSecretB),
      "GAP_FAIL_CLOSED");
    assert.equal(await send(event(6,true),eventKeyIdB,eventSecretB),
      "STALE_IGNORED");
    assert.equal(await send(event(8,true),eventKeyIdB,eventSecretB),"APPLIED");
    await assert.rejects(write("gap","still unhealthy"),
      /CV03_N104_OPERATION_REVOKED_OR_UNMIRRORED/);
    const facts=await admin.unsafe("SELECT enabled,mirror_healthy,"+
      "delivery_required,authority_epoch,lease_until FROM "+qSchema+
      ".cv03_n1_operation_policy WHERE context_id=$1"+
      " AND principal_subject_id=$2",[ctx,subject]);
    assert.equal(facts.length,1);
    assert.equal(facts[0].mirror_healthy,false);
    assert.equal(facts[0].delivery_required,true);
    assert.equal(Number(facts[0].authority_epoch),8);
    console.log("CV03_N104C_SIGNED_AUTHORITY_DELIVERY_LEASE=PASS");
    console.log("CV03_N104C_HUMAN_AI_REVOKE_REPLAY_AND_EVENT_GAP=PASS");
    console.log("CV03_N104C_LIVE_PA05_DELIVERY=NOT_CERTIFIED");
  }finally{
    if(runtimeSql)await runtimeSql.end();
    if(deliverySql)await deliverySql.end();
    if(schemaCreated)await admin.unsafe("DROP SCHEMA "+qSchema+" CASCADE");
    for(const role of roles.reverse())await admin.unsafe(
      "DROP ROLE "+quote(role));
    await admin.end();
  }
});
