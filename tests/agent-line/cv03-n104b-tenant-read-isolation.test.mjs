import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,createHash} from "node:crypto";
import postgres from "postgres";
import {
  preparePostgresConditionalResourceSchemaV010,
  createPostgresConditionalResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources-postgres.js";
import {sha256ResourceReceiptV010}
  from "../../dist/providers/enterprise-context/resource-receipt-digest.js";
import {createPersonalSavedViewActionHandlersV010,
  PERSONAL_SAVED_VIEW_READ_V010}
  from "../../dist/providers/enterprise-context/personal-saved-views.js";
import {cv03N1ScopedReadGatewaySqlV010}
  from "../../tools/cv03-n1-isolated-tenant-read-gateway.mjs";

const ns=(e,s)=>"evo.saved-view.personal."+createHash("sha256")
  .update(JSON.stringify([e,s])).digest("hex");
const url=process.env.CV03_RESOURCE_PROOF_DATABASE_URL;
const approved=(process.env.CV03_N1_ONLY_ISOLATED_GATEWAY_TEST==="YES_CI_LOCAL"&&
  !!url&&(()=>{try{const u=new URL(url);
    return ["127.0.0.1","localhost"].includes(u.hostname)&&
      u.pathname==="/cv03proof";
  }catch{return false;}})());
const isolated={skip:!approved&&"only localhost/cv03proof opt-in",
  timeout:90000};

test("N1-04b rejects untrusted SQL scope schema names",()=>{
  assert.throws(()=>cv03N1ScopedReadGatewaySqlV010(
    'cv03_read";REVOKE ALL'),/CV03_N1_ISOLATED_SCHEMA_REQUIRED/);
});

test("N1-04b real PG18 independent SQL identities: scoped get/list/receipt, revoke and no fallback",isolated,async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const schema="cv03_read_"+suffix,qSchema='"'+schema+'"';
  const owner="cv03_read_owner_"+suffix;
  const a="cv03_read_a_"+suffix,b="cv03_read_b_"+suffix;
  const ai="cv03_read_ai_"+suffix;
  const quote=v=>'"'+v+'"';
  const pwdA="cv03-ci-a-"+randomUUID().replaceAll("-","");
  const pwdB="cv03-ci-b-"+randomUUID().replaceAll("-","");
  const pwdAI="cv03-ci-ai-"+randomUUID().replaceAll("-","");
  const admin=postgres(url,{max:1,prepare:false,connect_timeout:10});
  const grants=["cv03_n1_scoped_get(text,text,text,text,text)",
    "cv03_n1_scoped_list(text,text,text,text,text)",
    "cv03_n1_scoped_receipt(text,text)"];
  const conn=(role,password)=>{const u=new URL(url);
    u.username=role;u.password=password;return u.toString();};
  let repoA,repoB,repoAI;
  const createdRoles=[],schemaCreated={value:false};
  const resourceTable=qSchema+".resources",receiptTable=qSchema+".cv03_resource_receipts";
  const ctx=id=>"enterprise-context:"+id;
  const makeFixture=(enterpriseId,subject,id,title)=>{
    const at=new Date().toISOString();
    const addr={contextId:ctx(enterpriseId),
      namespace:ns(enterpriseId,subject),
      collectionId:"collection-views",resourceType:"saved-collection-view",
      resourceId:id};
    const resource={
      contractVersion:"0.1.0",...addr,
      schemaRef:"evo.saved-view.personal/0.1.0",
      ownerPackageId:"host-enterprise-context-provider",
      storageKind:"DOCUMENT",lifecycleState:"ACTIVE",revision:0,
      payload:{contractVersion:"0.1.0",viewId:id,title,
        ownerSubjectId:subject,enterpriseId,visibility:"PERSONAL",
        collectionId:"dictionary",columns:["dictionaryId"],presentation:"table"},
      createdAt:at,createdBySubjectId:subject,
      updatedAt:at,updatedBySubjectId:subject
    };
    const idem="fixture:"+randomUUID(),receiptId="fixture-receipt:"+id;
    const inputDigest=sha256ResourceReceiptV010({id,enterpriseId,subject});
    const receipt={
      contractVersion:"0.1.0",receiptId,
      invocationId:"fixture-invocation:"+id,idempotencyKey:idem,
      sourceInteractionId:"fixture-UI:"+id,
      sourceActionId:"collection.saved-view.personal.save",
      principalSubjectId:subject,principalActorType:"HUMAN",
      context:{contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId:addr.contextId,enterpriseId},
      toolId:"collection.saved-view.personal.save",
      ownerPackageId:"host-enterprise-context-provider",
      effect:"WRITE",inputDigest,status:"SUCCEEDED",
      requestedAt:at,completedAt:at,
      resultDigest:sha256ResourceReceiptV010(resource),
      resultEntityRefs:["enterprise-resource:"+id],
      resultSummary:"N1-04b isolated fixture",
      latestEventId:"fixture:"+id
    };
    return {addr,resource,receipt,idem,inputDigest,receiptId};
  };
  try{
    await admin.unsafe("CREATE ROLE "+quote(owner)+
      " NOLOGIN NOSUPERUSER NOCREATEROLE NOCREATEDB");
    createdRoles.push(owner);
    for(const [role,pwd] of [[a,pwdA],[b,pwdB],[ai,pwdAI]]){
      await admin.unsafe("CREATE ROLE "+quote(role)+
        " LOGIN NOSUPERUSER NOCREATEROLE NOCREATEDB PASSWORD '"+pwd+"'");
      createdRoles.push(role);
    }
    await preparePostgresConditionalResourceSchemaV010({
      connectionString:url,schema
    });
    schemaCreated.value=true;
    await admin.unsafe("CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public");
    await admin.unsafe(cv03N1ScopedReadGatewaySqlV010(schema));
    for(const [enterprise,subject] of [
      ["company-a","owner-a"],["company-b","owner-b"],
      ['汉字, and quote "','subject:🔒'],["company-a","owner-other"]
    ]) {
      const actual=await admin.unsafe("SELECT "+qSchema+
        ".cv03_n1_saved_view_namespace($1,$2) AS namespace",
        [enterprise,subject]);
      assert.equal(actual[0].namespace,ns(enterprise,subject),
        "SQL hash MUST match Domain Owner JSON.stringify UTF-8 algorithm");
    }
    const fixtures=[
      makeFixture("company-a","owner-a","a-one","香港供应商"),
      makeFixture("company-b","owner-b","b-one","東京字典"),
      makeFixture("company-a","owner-other","a-other","其他人私有视图")
    ];
    // Derive a real address by running the EXISTING Domain Owner READ action.
    // This does not approximate its private address() implementation.
    const observed=[];
    const actualOwner=createPersonalSavedViewActionHandlersV010({
      storage:{conditionalWriteConsistency:"SHARED_POSTGRES_TRANSACTION",
        get:async addr=>{observed.push(addr);return undefined;}},
      readSource:async()=>{throw Error("READ source not reached for absent view");},
      allowedSourceOperationIds:[]
    });
    const ownerRead=actualOwner.find(x=>x.commandCode===PERSONAL_SAVED_VIEW_READ_V010);
    assert.ok(ownerRead);
    const realOwnerContext={
      principal:{subjectId:"owner-a",actorType:"HUMAN"},
      scope:{enterpriseId:"company-a",userId:"owner-a"},
      context:{activeContext:{kind:"ENTERPRISE",
        contextId:ctx("company-a"),enterpriseId:"company-a"},
        personalContext:{ownerSubjectId:"owner-a"}},
      correlationId:"cv03-n104e-domain-owner-parity"
    };
    const ownerResponse=await ownerRead.execute({values:{viewId:"a-one"}},realOwnerContext);
    assert.equal(ownerResponse.ok,true);
    assert.equal(observed.length,1);
    assert.equal(observed[0].namespace,fixtures[0].addr.namespace,
      "fixture must use the actual Domain Owner-generated address");
    const dbOwner=await admin.unsafe("SELECT "+qSchema+
      ".cv03_n1_saved_view_namespace($1,$2) AS namespace",["company-a","owner-a"]);
    assert.equal(dbOwner[0].namespace,observed[0].namespace);
    console.log("CV03_N104E_REAL_DOMAIN_OWNER_NAMESPACE_PG18=PASS");
    for(const item of fixtures){
      const r=item.resource;
      await admin.unsafe("INSERT INTO "+resourceTable+
        "(context_id,namespace,collection_id,resource_type,resource_id,"+
        "revision,resource) VALUES ($1,$2,$3,$4,$5,0,$6::text::jsonb)",
        [r.contextId,r.namespace,r.collectionId,r.resourceType,r.resourceId,
          JSON.stringify(r)]);
      await admin.unsafe("INSERT INTO "+receiptTable+
        "(context_id,idempotency_hash,receipt_id,approval_digest,input_digest,"+
        "receipt_digest,receipt,resource) VALUES"+
        " ($1,$2,$3,$4,$5,$6,$7::text::jsonb,$8::text::jsonb)",
        [r.contextId,sha256ResourceReceiptV010(item.idem),item.receiptId,
          sha256ResourceReceiptV010({fixture:true}),item.inputDigest,
          sha256ResourceReceiptV010(item.receipt),JSON.stringify(item.receipt),
          JSON.stringify(r)]);
    }
    await admin.unsafe("INSERT INTO "+qSchema+
      ".cv03_n1_read_scope(runtime_role,context_id,owner_subject_id,"+
      "enterprise_id,actor_type,operation_id,authority_epoch,mirror_healthy,"+
      "enabled,delivery_required,lease_until) VALUES "+
      "($1,$2,$3,$4,'HUMAN','collection.saved-view.personal.list',1,true,true,true,clock_timestamp()+interval '90 seconds'),"+
      "($5,$6,$7,$8,'HUMAN','collection.saved-view.personal.list',1,true,true,true,clock_timestamp()+interval '90 seconds'),"+
      "($9,$10,$11,$12,'AI','collection.saved-view.personal.list',1,true,false,true,clock_timestamp()+interval '90 seconds')",
      [a,ctx("company-a"),"owner-a","company-a",
       b,ctx("company-b"),"owner-b","company-b",
       ai,ctx("company-a"),"owner-a","company-a"]);
    await admin.unsafe("ALTER SCHEMA "+qSchema+" OWNER TO "+quote(owner));
    for(const name of ["resources","cv03_resource_receipts",
      "cv03_n1_read_scope"]){
      await admin.unsafe("ALTER TABLE "+qSchema+"."+quote(name)+
        " OWNER TO "+quote(owner));
      await admin.unsafe("REVOKE ALL ON TABLE "+qSchema+"."+quote(name)+
        " FROM PUBLIC");
    }
    for(const fn of grants){
      await admin.unsafe("ALTER FUNCTION "+qSchema+"."+fn+
        " OWNER TO "+quote(owner));
      await admin.unsafe("REVOKE ALL ON FUNCTION "+qSchema+"."+fn+
        " FROM PUBLIC");
    }
    await admin.unsafe("REVOKE ALL ON SCHEMA "+qSchema+" FROM PUBLIC");
    for(const role of [a,b,ai]){
      await admin.unsafe("GRANT USAGE ON SCHEMA "+qSchema+
        " TO "+quote(role));
      for(const fn of grants)await admin.unsafe(
        "GRANT EXECUTE ON FUNCTION "+qSchema+"."+fn+
        " TO "+quote(role));
    }
    const sqlA=postgres(conn(a,pwdA),{max:1,prepare:false});
    const sqlB=postgres(conn(b,pwdB),{max:1,prepare:false});
    const sqlAI=postgres(conn(ai,pwdAI),{max:1,prepare:false});
    try{
      for(const [role,client] of [[a,sqlA],[b,sqlB],[ai,sqlAI]]){
        const privileges=await client.unsafe(`
          SELECT session_user AS login, current_user AS runtime,
           has_table_privilege(current_user,$1,'SELECT') AS can_read_resources,
           has_table_privilege(current_user,$2,'SELECT') AS can_read_receipts,
           has_table_privilege(current_user,$3,'SELECT') AS can_read_scope,
           has_table_privilege(current_user,$1,'INSERT') AS can_insert_resources
        `,[schema+".resources",schema+".cv03_resource_receipts",
          schema+".cv03_n1_read_scope"]);
        assert.equal(privileges[0].login,role);
        assert.equal(privileges[0].runtime,role);
        assert.equal(privileges[0].can_read_resources,false);
        assert.equal(privileges[0].can_read_receipts,false);
        assert.equal(privileges[0].can_read_scope,false);
        assert.equal(privileges[0].can_insert_resources,false);
        await assert.rejects(client.unsafe("SELECT * FROM "+resourceTable),
          /permission denied/i);
        await assert.rejects(client.unsafe("SELECT * FROM "+receiptTable),
          /permission denied/i);
        await assert.rejects(client.unsafe("SELECT * FROM "+qSchema+
          ".cv03_n1_read_scope"),/permission denied/i);
      }
      await assert.rejects(sqlAI.unsafe("SET ROLE "+quote(a)),
        /permission denied|must be member/i);
    }finally{await sqlA.end();await sqlB.end();await sqlAI.end();}
    assert.throws(()=>createPostgresConditionalResourceRepositoryV010({
      connectionString:conn(a,pwdA),schema,
      readMode:"SQL_ROLE_SCOPED_ISOLATED_V010"
    }),/CV03_N104B_SCOPED_READ_REQUIRES_SQL_GATEWAY/);
    repoA=createPostgresConditionalResourceRepositoryV010({
      connectionString:conn(a,pwdA),schema,
      receiptWriteMode:"SQL_GATEWAY_ISOLATED_V010",
      readMode:"SQL_ROLE_SCOPED_ISOLATED_V010"
    });
    repoB=createPostgresConditionalResourceRepositoryV010({
      connectionString:conn(b,pwdB),schema,
      receiptWriteMode:"SQL_GATEWAY_ISOLATED_V010",
      readMode:"SQL_ROLE_SCOPED_ISOLATED_V010"
    });
    repoAI=createPostgresConditionalResourceRepositoryV010({
      connectionString:conn(ai,pwdAI),schema,
      receiptWriteMode:"SQL_GATEWAY_ISOLATED_V010",
      readMode:"SQL_ROLE_SCOPED_ISOLATED_V010"
    });
    const [fa,fb,fc]=fixtures;
    assert.equal((await repoA.get(fa.addr))?.payload?.title,"香港供应商");
    assert.equal(await repoA.get(fb.addr),undefined);
    assert.equal(await repoA.get(fc.addr),undefined);
    assert.equal((await repoB.get(fb.addr))?.payload?.title,"東京字典");
    assert.equal(await repoAI.get(fa.addr),undefined,
      "Human actor's SQL scope does not confer AI READ");
    assert.deepEqual(await repoAI.list({contextId:ctx("company-a")}),[]);
    assert.equal(await repoB.get(fa.addr),undefined);
    assert.deepEqual((await repoA.list({contextId:ctx("company-a")}))
      .map(z=>z.resourceId),["a-one"]);
    assert.deepEqual((await repoB.list({contextId:ctx("company-a")})),[]);
    assert.deepEqual((await repoB.list({contextId:ctx("company-b")}))
      .map(z=>z.resourceId),["b-one"]);
    const historic=(r,fixture)=>r.getCommittedWriteByIdempotencyKey({
      address:fixture.addr,idempotencyKey:fixture.idem,
      receiptId:fixture.receiptId,inputDigest:fixture.inputDigest,
      principalSubjectId:fixture.resource.createdBySubjectId,
      principalActorType:"HUMAN"
    });
    assert.equal((await historic(repoA,fa))?.receipt?.receiptId,fa.receiptId);
    assert.equal(await historic(repoA,fb),undefined);
    assert.equal(await historic(repoA,fc),undefined);
    assert.equal(await historic(repoB,fa),undefined);
    assert.equal((await historic(repoB,fb))?.receipt?.receiptId,fb.receiptId);
    assert.equal(await historic(repoAI,fa),undefined,
      "AI may not claim Human's immutable historical write receipt");
    await admin.unsafe("UPDATE "+qSchema+
      ".cv03_n1_read_scope SET enabled=true,authority_epoch=2"+
      " WHERE runtime_role=$1 AND actor_type='AI'",[ai]);
    assert.equal((await repoAI.get(fa.addr))?.resourceId,"a-one",
      "AI can read shared owner's Saved View only AFTER independent AI READ grant");
    assert.deepEqual((await repoAI.list({contextId:ctx("company-a")}))
      .map(z=>z.resourceId),["a-one"]);
    assert.equal(await historic(repoAI,fa),undefined,
      "AI READ never inherits a Human WRITE historical receipt");
    await admin.unsafe("UPDATE "+qSchema+
      ".cv03_n1_read_scope SET lease_until=clock_timestamp()-interval '1 second'"+
      " WHERE runtime_role=$1",[ai]);
    assert.equal(await repoAI.get(fa.addr),undefined);
    assert.equal((await repoA.get(fa.addr))?.resourceId,"a-one",
      "AI delivery outage must not revoke Human independently");
    await admin.unsafe("UPDATE "+qSchema+
      ".cv03_n1_read_scope SET lease_until=clock_timestamp()+interval '90 seconds'"+
      " WHERE runtime_role=$1",[ai]);
    assert.equal((await repoAI.get(fa.addr))?.resourceId,"a-one");
    console.log("CV03_N104F_ACTOR_SCOPED_READ_DENY_GRANT_LEASE=PASS");
    // The app SQL runtime cannot flip tenant read admission; only owner/admin.
    // Opt-in authority-delivery lease: a SQL read scope that still says
    // enabled=true MUST fail closed when its identity lease has expired.
    await admin.unsafe("UPDATE "+qSchema+
      ".cv03_n1_read_scope SET delivery_required=true,"+
      "lease_until=clock_timestamp()-interval '1 second'"+
      " WHERE runtime_role=$1",[a]);
    assert.equal(await repoA.get(fa.addr),undefined);
    assert.deepEqual(await repoA.list({contextId:ctx("company-a")}),[]);
    assert.equal(await historic(repoA,fa),undefined);
    assert.equal((await repoB.get(fb.addr))?.resourceId,"b-one");
    await admin.unsafe("UPDATE "+qSchema+
      ".cv03_n1_read_scope SET lease_until=clock_timestamp()+interval '90 seconds'"+
      " WHERE runtime_role=$1",[a]);
    assert.equal((await repoA.get(fa.addr))?.resourceId,"a-one");
    assert.equal((await historic(repoA,fa))?.receipt?.receiptId,fa.receiptId);
    const onlyA=await admin.unsafe("UPDATE "+qSchema+
      ".cv03_n1_read_scope SET enabled=false WHERE runtime_role=$1 RETURNING runtime_role",[a]);
    assert.equal(onlyA.length,1);
    assert.equal(await repoA.get(fa.addr),undefined);
    assert.deepEqual(await repoA.list({contextId:ctx("company-a")}),[]);
    assert.equal(await historic(repoA,fa),undefined);
    assert.equal((await repoB.get(fb.addr))?.resourceId,"b-one",
      "other SQL login remains isolated and unaffected");
    assert.equal((await repoAI.get(fa.addr))?.resourceId,"a-one",
      "Human revocation does not revoke separately granted AI READ");
    assert.equal(await historic(repoAI,fa),undefined);
    // Fail closed: removing the scoped function MUST NOT let Provider use raw
    // table SELECT, even though the original SQL table still holds row A.
    await admin.unsafe("DROP FUNCTION "+qSchema+
      ".cv03_n1_scoped_get(text,text,text,text,text)");
    await assert.rejects(repoA.get(fa.addr),/does not exist|cv03_n1_scoped_get/i);
    console.log("CV03_N104B_SQL_TENANT_SCOPED_READ_NO_BYPASS=PASS");
    console.log("CV03_N104B_PRODUCTION_PA05_IDENTITY_READ_ADMISSION=NOT_CERTIFIED");
  }finally{
    if(repoA)await repoA.close();
    if(repoB)await repoB.close();
    if(repoAI)await repoAI.close();
    if(schemaCreated.value)await admin.unsafe("DROP SCHEMA "+qSchema+" CASCADE");
    for(const role of createdRoles.reverse())
      await admin.unsafe("DROP ROLE "+quote(role));
    await admin.end();
  }
});
