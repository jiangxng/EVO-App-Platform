import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {fork} from "node:child_process";
import {fileURLToPath} from "node:url";
import postgres from "postgres";
import {preparePostgresConditionalResourceSchemaV010,
  createPostgresConditionalResourceRepositoryV010}
  from "../../dist/providers/enterprise-context/resources-postgres.js";
import {stableResourceReceiptJsonV010,digestConditionalResourcePutV010,
  hmacCv03HostResourceReceiptV010,sha256ResourceReceiptV010}
  from "../../dist/providers/enterprise-context/resource-receipt-digest.js";
import {cv03N1GatewaySqlV010}
  from "../../tools/cv03-n1-isolated-signed-sql-gateway.mjs";

const url=process.env.CV03_RESOURCE_PROOF_DATABASE_URL;
const allowed=(process.env.CV03_N1_ONLY_ISOLATED_GATEWAY_TEST==="YES_CI_LOCAL"
  && !!url && (()=>{try{
    const u=new URL(url);
    return ["127.0.0.1","localhost"].includes(u.hostname)
      && u.pathname==="/cv03proof";
  }catch{return false;}})());
const isolated={skip:!allowed&&"Only run in explicit CI localhost/cv03proof",
  timeout:90000};
const op="collection.saved-view.personal.save";
const ownerPkg="host-enterprise-context-provider";
const keyId="cv03-n1-test-signing-key";
const secret="CV03-ISOLATED-PG18-GATEWAY-TEST-SECRET-NOT-FOR-PRODUCTION-01";
const fixture=fileURLToPath(new URL("../fixtures/cv03-n1-gateway-provider-child.mjs",import.meta.url));
function worker(mode,request,schema,runtimeUrl){
  const child=fork(fixture,[mode,Buffer.from(JSON.stringify(request)).toString("base64")],{
    stdio:["ignore","pipe","pipe","ipc"],
    env:{...process.env,CV03_N1_CHILD_SCHEMA:schema,
      CV03_N1_CHILD_RUNTIME_DATABASE_URL:runtimeUrl.toString()}
  });
  let stderr="",settled=false;
  child.stderr.on("data",d=>stderr+=String(d));
  const messages=[];
  let resolveReady,rejectReady;
  const ready=new Promise((resolve,reject)=>{
    resolveReady=resolve;rejectReady=reject;
  });
  child.on("message",m=>{
    messages.push(m);
    if(m?.type==="ready"){settled=true;resolveReady();}
  });
  const done=new Promise((resolve,reject)=>{
    child.once("error",err=>{if(!settled)rejectReady(err);reject(err);});
    child.once("exit",(code,signal)=>{
      if(!settled){settled=true;rejectReady(Error("worker not ready: "+stderr));}
      resolve({code,signal,messages,stderr});
    });
  });
  // Avoid unhandled rejections for workers which intentionally do not signal READY.
  void ready.catch(()=>{});
  return {child,ready,done};
}

test("CV03 N1-02 rejects unsafe schema names without SQL",()=>{
  assert.throws(()=>cv03N1GatewaySqlV010('cv03_ok"; DROP TABLE x'),
    /CV03_N1_ISOLATED_SCHEMA_REQUIRED/);
});

test("CV03 N1-02: NOLOGIN owner + EXECUTE-only runtime, signed gateway CAS, immutable receipt, replay and physical denials",isolated,async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const schema="cv03_gate_"+suffix;
  const qSchema='"'+schema+'"';
  const owner="cv03_n1_owner_"+suffix,runtime="cv03_n1_runtime_"+suffix;
  const qOwner='"'+owner+'"',qRuntime='"'+runtime+'"';
  const password="CV03_CI_"+randomUUID().replaceAll("-","");
  const admin=postgres(url,{max:1,connect_timeout:10,prepare:false});
  let runtimeSql,second;
  let schemaCreated=false,ownerCreated=false,runtimeCreated=false;
  const functionName=qSchema+".cv03_n1_signed_save";
  try{
    await admin.unsafe("CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public");
    await admin.unsafe("CREATE ROLE "+qOwner+
      " NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION");
    ownerCreated=true;
    await admin.unsafe("CREATE ROLE "+qRuntime+
      " LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD '"+
      password+"'");
    runtimeCreated=true;
    await preparePostgresConditionalResourceSchemaV010({
      connectionString:url,schema
    });
    schemaCreated=true;
    // This opt-in fixture migration runs only on random test schema.
    await admin.unsafe(cv03N1GatewaySqlV010(schema));
    await admin.unsafe("INSERT INTO "+qSchema+
      ".cv03_n1_signing_keys(key_id,secret) VALUES ($1,$2)",
      [keyId,secret]);
    await admin.unsafe("ALTER SCHEMA "+qSchema+" OWNER TO "+qOwner);
    for(const table of ["resources","cv03_resource_receipts","cv03_n1_signing_keys"]){
      await admin.unsafe("ALTER TABLE "+qSchema+'."'+table+'" OWNER TO '+qOwner);
      await admin.unsafe("REVOKE ALL ON TABLE "+qSchema+'."'+table+'" FROM PUBLIC');
    }
    await admin.unsafe("ALTER FUNCTION "+functionName+
      "(text,text,text,text,text,text) OWNER TO "+qOwner);
    await admin.unsafe("ALTER FUNCTION "+qSchema+
      ".cv03_reject_receipt_mutation() OWNER TO "+qOwner);
    await admin.unsafe("REVOKE ALL ON SCHEMA "+qSchema+" FROM PUBLIC");
    await admin.unsafe("REVOKE ALL ON FUNCTION "+functionName+
      "(text,text,text,text,text,text) FROM PUBLIC");
    await admin.unsafe("GRANT USAGE ON SCHEMA "+qSchema+" TO "+qRuntime);
    await admin.unsafe("GRANT EXECUTE ON FUNCTION "+functionName+
      "(text,text,text,text,text,text) TO "+qRuntime);
    const runtimeUrl=new URL(url);
    runtimeUrl.username=runtime;
    runtimeUrl.password=password;
    runtimeSql=postgres(runtimeUrl.toString(),
      {max:2,connect_timeout:10,prepare:false});
    second=postgres(runtimeUrl.toString(),
      {max:2,connect_timeout:10,prepare:false});
    const acl=await runtimeSql.unsafe(`
      SELECT current_user AS role,
        has_table_privilege(current_user,$1,'INSERT') AS insert_resource,
        has_table_privilege(current_user,$2,'INSERT') AS insert_receipt,
        has_table_privilege(current_user,$3,'SELECT') AS read_key,
        has_function_privilege(current_user,$4,'EXECUTE') AS can_gateway,
        has_schema_privilege(current_user,$5,'CREATE') AS create_schema_objects
      `,[schema+".resources",schema+".cv03_resource_receipts",
        schema+".cv03_n1_signing_keys",
        functionName+"(text,text,text,text,text,text)",schema]);
    assert.equal(acl[0].role,runtime);
    assert.equal(acl[0].insert_resource,false);
    assert.equal(acl[0].insert_receipt,false);
    assert.equal(acl[0].read_key,false);
    assert.equal(acl[0].can_gateway,true);
    assert.equal(acl[0].create_schema_objects,false);
    await assert.rejects(runtimeSql.unsafe("INSERT INTO "+qSchema+
      ".resources(context_id,namespace,collection_id,resource_type,"+
      "resource_id,revision,resource) VALUES ('x','x','x','x','x',0,'{}')"),
      /permission denied/i);
    await assert.rejects(runtimeSql.unsafe("INSERT INTO "+qSchema+
      ".cv03_resource_receipts(context_id,idempotency_hash,receipt_id,"+
      "approval_digest,input_digest,receipt_digest,receipt,resource)"+
      " VALUES ('x','x','x','x','x','x','{}','{}')"),
      /permission denied/i);
    await assert.rejects(runtimeSql.unsafe("SELECT * FROM "+qSchema+
      ".cv03_n1_signing_keys"),/permission denied/i);
    await assert.rejects(runtimeSql.unsafe("ALTER FUNCTION "+functionName+
      "(text,text,text,text,text,text) OWNER TO "+qRuntime),/must be owner|permission denied/i);

    const newInput=(title,expectedRevision,id="hk")=>({
      contextId:"enterprise-context:company-a",
      namespace:"evo.saved-view.personal.owner-a",
      collectionId:"collection-views",resourceType:"saved-collection-view",
      resourceId:id,schemaRef:"evo.saved-view.personal/0.1.0",
      ownerPackageId:ownerPkg,storageKind:"DOCUMENT",
      payload:{contractVersion:"0.1.0",visibility:"PERSONAL",
        viewId:id,title,ownerSubjectId:"owner-a",
        enterpriseId:"company-a",queryOperationId:"dictionary.collection.query",
        collectionId:"evo.business-dictionary.directory",
        schemaRef:"evo.business-dictionary.directory/0.1.0",
        query:{search:"Hong Kong"},columns:["dictionaryId"],
        presentation:"table"},
      expectedRevision,actorSubjectId:"owner-a",
      recordedAt:new Date().toISOString()
    });
    const signed=(input,extra={},previous=undefined)=>{
      const resource={
        contractVersion:"0.1.0",contextId:input.contextId,
        namespace:input.namespace,collectionId:input.collectionId,
        resourceType:input.resourceType,resourceId:input.resourceId,
        schemaRef:input.schemaRef,ownerPackageId:ownerPkg,
        storageKind:"DOCUMENT",payload:input.payload,
        lifecycleState:"ACTIVE",
        revision:input.expectedRevision===null?0:input.expectedRevision+1,
        createdAt:previous?.createdAt??input.recordedAt,
        createdBySubjectId:previous?.createdBySubjectId??input.actorSubjectId,
        updatedAt:input.recordedAt,updatedBySubjectId:input.actorSubjectId
      };
      const nonce=randomUUID();
      const receipt={
        receiptId:"cv03-n1:"+nonce,
        invocationId:"cv03-n1-invoke:"+nonce,
        idempotencyKey:"cv03-n1-idem:"+nonce,
        sourceInteractionId:"cv03-n1-test:"+nonce,
        sourceActionId:op,principalSubjectId:"owner-a",
        principalActorType:"HUMAN",
        context:{contractVersion:"0.1.0",kind:"ENTERPRISE",
          contextId:input.contextId,enterpriseId:"company-a"},
        toolId:op,ownerPackageId:ownerPkg,
        capability:"enterprise.collection.saved-view",
        inputDigest:digestConditionalResourcePutV010(input),
        requestedAt:input.recordedAt,...extra
      };
      const canonicalInput=stableResourceReceiptJsonV010(input);
      const envelope=stableResourceReceiptJsonV010({
        domain:"cv03.enterprise-resource.host-write/0.1.0",
        keyId,receipt
      });
      const signature=hmacCv03HostResourceReceiptV010(receipt,keyId,secret);
      const completed={
        contractVersion:"0.1.0",receiptId:receipt.receiptId,
        invocationId:receipt.invocationId,
        idempotencyKey:receipt.idempotencyKey,
        sourceInteractionId:receipt.sourceInteractionId,
        sourceActionId:receipt.sourceActionId,
        principalSubjectId:receipt.principalSubjectId,
        principalActorType:receipt.principalActorType,
        context:receipt.context,toolId:receipt.toolId,
        ownerPackageId:receipt.ownerPackageId,
        capability:receipt.capability,effect:"WRITE",
        inputDigest:receipt.inputDigest,status:"SUCCEEDED",
        requestedAt:receipt.requestedAt,
        completedAt:resource.updatedAt,
        resultDigest:sha256ResourceReceiptV010(resource),
        resultEntityRefs:["enterprise-resource:"+resource.resourceId],
        resultSummary:"Saved view resource and immutable receipt committed atomically",
        latestEventId:"cv03-resource-commit:"+receipt.receiptId
      };
      return {canonicalInput,envelope,signature,
        canonicalResource:stableResourceReceiptJsonV010(resource),
        canonicalCompleted:stableResourceReceiptJsonV010(completed),
        canonicalApproval:stableResourceReceiptJsonV010(receipt),
        receipt,resource};

    };
    const invoke=(client,proof)=>client.unsafe(
      "SELECT "+functionName+"($1::text,$2::text,$3::text,"+
      "$4::text,$5::text,$6::text) AS result",
      [proof.canonicalInput,proof.envelope,proof.signature,
       proof.canonicalResource,proof.canonicalCompleted,
       proof.canonicalApproval])
      .then(rows=>rows[0].result);
    const first=newInput("香港供应商",null);
    const valid=signed(first);
    await assert.rejects(invoke(runtimeSql,{...valid,signature:"0".repeat(64)}),
      /CV03_N1_SIGNED_PROOF_INVALID/);
    await assert.rejects(invoke(runtimeSql,{
      ...valid,canonicalInput:stableResourceReceiptJsonV010({
        ...first,resourceId:"forged-other"
      })
    }),/CV03_N1_EXACT_INPUT_DIGEST_DENIED/);
    await assert.rejects(invoke(runtimeSql,signed({
      ...first,payload:{...first.payload,ownerSubjectId:"different-subject"}
    })),/CV03_N1_GATEWAY_BINDING_DENIED/);
    await assert.rejects(invoke(runtimeSql,signed({
      ...first,payload:{...first.payload,enterpriseId:"different-company"}
    })),/CV03_N1_GATEWAY_BINDING_DENIED/);
    await assert.rejects(invoke(runtimeSql,signed({
      ...first,contextId:"enterprise-context:spoof"
    },{context:{contractVersion:"0.1.0",kind:"ENTERPRISE",
      contextId:first.contextId,enterpriseId:"company-a"}})),
      /CV03_N1_GATEWAY_BINDING_DENIED/);
    const result=await invoke(runtimeSql,valid);
    assert.equal(result.replayed,false);
    assert.equal(result.resource.revision,0);
    assert.equal(result.resource.payload.title,"香港供应商");
    assert.equal(result.receipt.status,"SUCCEEDED");
    assert.equal(result.receipt.inputDigest,digestConditionalResourcePutV010(first));
    const originalReader=createPostgresConditionalResourceRepositoryV010({
      connectionString:url,schema
    });
    try{
      const readback=await originalReader.getCommittedWriteByIdempotencyKey({
        address:first,idempotencyKey:valid.receipt.idempotencyKey,
        receiptId:valid.receipt.receiptId,
        inputDigest:valid.receipt.inputDigest,
        principalSubjectId:"owner-a",principalActorType:"HUMAN"
      });
      assert.deepEqual(readback?.resource,result.resource,
        "existing readback validates the actual original JS receipt digest");
      assert.deepEqual(readback?.receipt,result.receipt);
    }finally{await originalReader.close();}
    assert.equal((await invoke(second,valid)).replayed,true);
    const nextA=signed(newInput("新版 A",0),{},result.resource);
    const nextB=signed(newInput("新版 B",0),{},result.resource);
    const race=await Promise.allSettled([
      invoke(runtimeSql,nextA),invoke(second,nextB)
    ]);
    assert.equal(race.filter(x=>x.status==="fulfilled").length,1,
      JSON.stringify(race));
    assert.equal(race.filter(x=>x.status==="rejected").length,1,
      JSON.stringify(race));
    const winning=race.find(x=>x.status==="fulfilled").value;
    assert.equal(winning.resource.revision,1);
    assert.ok(["新版 A","新版 B"].includes(winning.resource.payload.title));
    const committed=await admin.unsafe("SELECT receipt::text AS receipt"+
      " FROM "+qSchema+".cv03_resource_receipts ORDER BY receipt_id");
    assert.equal(committed.length,2,
      "only successful resource revisions have immutable receipts");
    await assert.rejects(admin.unsafe("UPDATE "+qSchema+
      ".cv03_resource_receipts SET receipt='{}'::jsonb"),
      /CV03_RESOURCE_RECEIPT_IMMUTABLE/);
    // N1-03: the current enterprise PG Provider now has an EXPLICIT
    // SQL-only mode. The runtime receives table SELECT but never DML or
    // verifier key SELECT; no un-signed write / archive is permitted.
    await admin.unsafe("GRANT SELECT ON "+qSchema+
      ".resources, "+qSchema+".cv03_resource_receipts TO "+qRuntime);
    const runtimeConn=runtimeUrl.toString();
    assert.throws(()=>createPostgresConditionalResourceRepositoryV010({
      connectionString:runtimeConn,schema,
      receiptWriteMode:"SQL_GATEWAY_ISOLATED_V010",
      trustedHostReceiptKeys:[{keyId,secret}]
    }),/CV03_N1_GATEWAY_RUNTIME_MUST_NOT_HOLD_VERIFIER_SECRET/);
    const provider=createPostgresConditionalResourceRepositoryV010({
      connectionString:runtimeConn,schema,
      receiptWriteMode:"SQL_GATEWAY_ISOLATED_V010"
    });
    const originalPgRead=createPostgresConditionalResourceRepositoryV010({
      connectionString:runtimeConn,schema,
      receiptWriteMode:"SQL_GATEWAY_ISOLATED_V010"
    });
    const pack=p=>({receipt:p.receipt,proof:{
      contractVersion:"0.1.0",
      purpose:"cv03.enterprise-resource.host-write",
      algorithm:"HMAC-SHA256",keyId,signature:p.signature
    }});
    const providerInput=newInput("Provider 原生 SQL 保存",null,"provider-view");
    const providerProof=signed(providerInput);
    try{
      await assert.rejects(provider.putIfRevision(providerInput),
        /CV03_N1_GATEWAY_UNSIGNED_RESOURCE_WRITE_DENIED/);
      await assert.rejects(provider.archiveIfRevision({
        address:providerInput,expectedRevision:0,
        actorSubjectId:"owner-a",recordedAt:providerInput.recordedAt
      }),/CV03_N1_GATEWAY_UNSIGNED_RESOURCE_WRITE_DENIED/);
      await assert.rejects(provider.putIfRevisionWithReceipt(providerInput,{
        receipt:providerProof.receipt,proof:{...pack(providerProof).proof,
          signature:"0".repeat(64)}
      }),/CV03_N1_SIGNED_PROOF_INVALID/);
      const created=await provider.putIfRevisionWithReceipt(
        providerInput,pack(providerProof)
      );
      assert.equal(created.replayed,false);
      assert.equal(created.resource.revision,0);
      const historical=await originalPgRead.getCommittedWriteByIdempotencyKey({
        address:providerInput,
        idempotencyKey:providerProof.receipt.idempotencyKey,
        receiptId:providerProof.receipt.receiptId,
        inputDigest:providerProof.receipt.inputDigest,
        principalSubjectId:"owner-a",principalActorType:"HUMAN"
      });
      assert.deepEqual(historical?.resource,created.resource);
      assert.deepEqual(historical?.receipt,created.receipt);
      assert.equal((await provider.putIfRevisionWithReceipt(
        providerInput,pack(providerProof))).replayed,true);

      // Two actual OS processes, both through the same SQL-only Provider
      // with the same stale revision, must not both commit.
      const procA=newInput("OS Worker A",0,"provider-view");
      const procB=newInput("OS Worker B",0,"provider-view");
      const contenderA=worker("barrier-write",{
        input:procA,signed:pack(signed(procA,{},created.resource))
      },schema,runtimeUrl);
      const contenderB=worker("barrier-write",{
        input:procB,signed:pack(signed(procB,{},created.resource))
      },schema,runtimeUrl);
      await Promise.all([contenderA.ready,contenderB.ready]);
      contenderA.child.send({type:"start"});
      contenderB.child.send({type:"start"});
      const attempts=await Promise.all([contenderA.done,contenderB.done]);
      assert.equal(attempts.filter(a=>a.code===0).length,1,
        JSON.stringify(attempts));
      assert.equal(attempts.filter(a=>a.code===2).length,1,
        JSON.stringify(attempts));
      assert.ok(attempts.some(a=>a.messages.some(m=>
        m.type==="rejected" && /REVISION_CONFLICT/.test(m.code))),
        JSON.stringify(attempts));
      const afterRace=await originalPgRead.get(providerInput);
      assert.equal(afterRace.revision,1);

      // Child commits, exits without ACK. New Provider reads the original
      // historical signed receipt, then exact retry is idempotent.
      const lostInput=newInput("ACK 丢失后重启",1,"provider-view");
      const lostProof=signed(lostInput,{},afterRace);
      const lost=await worker("lost-ack",{
        input:lostInput,signed:pack(lostProof)
      },schema,runtimeUrl).done;
      assert.equal(lost.code,19,JSON.stringify(lost));
      assert.equal(lost.messages.some(m=>m.type==="success"),false);
      const restarted=createPostgresConditionalResourceRepositoryV010({
        connectionString:runtimeConn,schema,
        receiptWriteMode:"SQL_GATEWAY_ISOLATED_V010"
      });
      try{
        const recovered=await restarted.getCommittedWriteByIdempotencyKey({
          address:lostInput,
          idempotencyKey:lostProof.receipt.idempotencyKey,
          receiptId:lostProof.receipt.receiptId,
          inputDigest:lostProof.receipt.inputDigest,
          principalSubjectId:"owner-a",principalActorType:"HUMAN"
        });
        assert.equal(recovered?.resource.revision,2);
        assert.equal(recovered?.resource.payload.title,"ACK 丢失后重启");
        assert.equal((await restarted.putIfRevisionWithReceipt(
          lostInput,pack(lostProof))).replayed,true);
      }finally{await restarted.close();}
      console.log("CV03_N103_PROVIDER_SQL_ONLY_MULTI_PROCESS_AND_LOST_ACK=PASS");
    }finally{
      await provider.close();
      await originalPgRead.close();
    }

    const beforeDisable=await admin.unsafe("SELECT count(*)::int AS n"+
      " FROM "+qSchema+".resources");
    const revoked=signed(newInput("revoked",null,"another-view"));
    await admin.unsafe("UPDATE "+qSchema+
      ".cv03_n1_signing_keys SET enabled=false WHERE key_id=$1",[keyId]);
    await assert.rejects(invoke(runtimeSql,revoked),/CV03_N1_SIGNER_NOT_TRUSTED/);
    const final=await admin.unsafe("SELECT count(*)::int AS n"+
      " FROM "+qSchema+".resources");
    assert.equal(final[0].n,beforeDisable[0].n,
      "disabled signing key cannot create another resource");
    console.log("CV03_N1_SQL_GATEWAY_DENIED_DIRECT_DML=PASS");
    console.log("CV03_N1_SQL_GATEWAY_HOST_HMAC_BINDING_AND_ATOMIC_CAS=PASS");
    console.log("CV03_N1_SQL_GATEWAY_ISOLATED_ONLY_PRODUCTION=NOT_CERTIFIED");
  }finally{
    if(runtimeSql)await runtimeSql.end();
    if(second)await second.end();
    if(schemaCreated)await admin.unsafe("DROP SCHEMA "+qSchema+" CASCADE");
    if(runtimeCreated)await admin.unsafe("DROP ROLE "+qRuntime);
    if(ownerCreated)await admin.unsafe("DROP ROLE "+qOwner);
    await admin.end();
  }
});
