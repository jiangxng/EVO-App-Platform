import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,createHash} from "node:crypto";
import postgres from "postgres";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createMemoryLifecycleStore} from "../../dist/manager/store.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {createCv03PersonalSavedViewHostReceiptIssuerV010}
  from "../../dist/manager/cv03-personal-saved-view-host-issuer.js";
import {hostEnterpriseContextProviderPackage}
  from "../../dist/providers/enterprise-context/package.js";
import {personalSavedViewsOptInFeatureV010}
  from "../../dist/providers/enterprise-context/personal-saved-views.js";
import {preparePostgresConditionalResourceSchemaV010}
  from "../../dist/providers/enterprise-context/resources-postgres.js";
import {
  digestConditionalResourcePutV010,
  sha256ResourceReceiptV010,
  stableResourceReceiptJsonV010
} from "../../dist/providers/enterprise-context/resource-receipt-digest.js";
import {
  evaluateCv03N104dRealManagerAuthorityV010,
  cv03N104dIsolatedOwnerOutboxSqlV010
} from "../../tools/cv03-n104d-isolated-pa05-manager-authority.mjs";
import {cv03N1GatewaySqlV010}
  from "../../tools/cv03-n1-isolated-signed-sql-gateway.mjs";
import {
  cv03N104cIsolatedAuthorityBridgeSqlV010,
  cv03N104cTestEventProofV010
} from "../../tools/cv03-n104c-isolated-authority-event-bridge.mjs";

const url=process.env.CV03_RESOURCE_PROOF_DATABASE_URL;
const isolated=process.env.CV03_N1_ONLY_ISOLATED_GATEWAY_TEST==="YES_CI_LOCAL"&&
  !!url&&(()=>{try{
    const p=new URL(url);
    return ["127.0.0.1","localhost"].includes(p.hostname)&&
      p.pathname==="/cv03proof";
  }catch{return false;}})();
const dbOnly={skip:!isolated&&"Only isolated PG18 localhost/cv03proof opt-in",
  timeout:90000};
const ns=(e,s)=>"evo.saved-view.personal."+createHash("sha256")
  .update(JSON.stringify([e,s])).digest("hex");
const op="collection.saved-view.personal.save";
const hostKeyId="cv03-n104d-test-host-key";
const hostSecret="CV03_N104D_HOST_TEST_ONLY_ISOLATED_HMAC_SECRET_012345";
const eventKeyId="cv03-n104d-test-event-key";
const eventSecret="CV03_N104D_EVENT_TEST_ONLY_ISOLATED_HMAC_SECRET_012345";
const quote=s=>'"'+s+'"';
const context=(enterprise="company-a",actor="HUMAN",subject="owner-a")=>({
  contractVersion:"0.1.0",
  principal:{contractVersion:"0.1.0",subjectId:subject,actorType:actor,
    identityProviderId:"cv03.n104d.test.identity",sessionId:"ci-"+subject},
  scope:{contractVersion:"0.1.0",enterpriseId:enterprise,userId:subject},
  context:{
    contractVersion:"0.1.0",
    personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
      contextId:"personal:"+subject,ownerSubjectId:subject},
    activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
      contextId:"enterprise-context:"+enterprise,enterpriseId:enterprise}
  },
  correlationId:"cv03-n104d-"+enterprise+"-"+actor
});
const cmd={contractVersion:"0.1.0",type:"command",
  command:{code:op,inputVersion:"0.1.0"},
  values:{},actionId:op,sourceInteractionId:"cv03-n104d-real-manager",
  requiresConfirmation:false};

function material(ctx,id){
  const at=new Date().toISOString(),subject=ctx.principal.subjectId;
  const ent=ctx.context.activeContext.enterpriseId;
  const input={
    contextId:ctx.context.activeContext.contextId,
    // Actual Saved View Domain Owner enterprise+subject SHA-256 address.
    namespace:ns(ent,subject),
    collectionId:"collection-views",resourceType:"saved-collection-view",
    resourceId:id,schemaRef:"evo.saved-view.personal/0.1.0",
    ownerPackageId:"host-enterprise-context-provider",storageKind:"DOCUMENT",
    payload:{contractVersion:"0.1.0",visibility:"PERSONAL",viewId:id,
      title:"Real PA05 manager policy "+id,ownerSubjectId:subject,
      enterpriseId:ent,queryOperationId:"dictionary.collection.query",
      collectionId:"evo.business-dictionary.directory",
      schemaRef:"evo.business-dictionary.directory/0.1.0",
      query:{search:"Hong Kong"},columns:["dictionaryId"],
      presentation:"table"},
    expectedRevision:null,actorSubjectId:subject,recordedAt:at
  };
  return {input,inputDigest:digestConditionalResourcePutV010(input)};
}
function gatewayArgs(item,signed){
  const i=item.input,r=signed.receipt,at=i.recordedAt;
  const doc={
    contractVersion:"0.1.0",contextId:i.contextId,namespace:i.namespace,
    collectionId:i.collectionId,resourceType:i.resourceType,
    resourceId:i.resourceId,schemaRef:i.schemaRef,
    ownerPackageId:i.ownerPackageId,storageKind:"DOCUMENT",
    payload:i.payload,lifecycleState:"ACTIVE",revision:0,createdAt:at,
    createdBySubjectId:i.actorSubjectId,updatedAt:at,
    updatedBySubjectId:i.actorSubjectId
  };
  const completed={...r,contractVersion:"0.1.0",
    effect:"WRITE",status:"SUCCEEDED",completedAt:at,
    resultDigest:sha256ResourceReceiptV010(doc),
    resultEntityRefs:["enterprise-resource:"+i.resourceId],
    resultSummary:"Saved view resource and immutable receipt committed atomically",
    latestEventId:"cv03-resource-commit:"+r.receiptId};
  return [
    stableResourceReceiptJsonV010(i),
    stableResourceReceiptJsonV010({
      domain:"cv03.enterprise-resource.host-write/0.1.0",
      keyId:signed.proof.keyId,receipt:r
    }),
    signed.proof.signature,
    stableResourceReceiptJsonV010(doc),
    stableResourceReceiptJsonV010(completed),
    stableResourceReceiptJsonV010(r)
  ];
}
function managerFixture(){
  const lifecycle=[];
  const pkg={...hostEnterpriseContextProviderPackage,
    features:[...hostEnterpriseContextProviderPackage.features,
      personalSavedViewsOptInFeatureV010]};
  const manager=createAppManagerService(
    createPackageCatalog([pkg]),createMemoryLifecycleStore(),
    ()=>new Date(),new Map(),e=>lifecycle.push(e)
  );
  manager.install(pkg.packageId);
  const access={companyA:true,companyB:false,human:true,ai:false};
  const provider={
    providerId:"cv03.n104d.actual.authorization-provider.fixture",
    check({principal,scope,action}){
      const authorized=action==="collection.saved-view.write" &&
        (scope.enterpriseId==="company-a"?access.companyA:access.companyB) &&
        (principal.actorType==="HUMAN"?access.human:
          principal.actorType==="AI"&&access.ai);
      return {contractVersion:"0.1.0",allowed:Boolean(authorized),
        policyProviderId:"cv03.n104d.actual.authorization-provider.fixture",
        reasonCodes:[authorized?"CI_AUTHORIZED":"CI_DENIED"]};
    }
  };
  const issuer=createCv03PersonalSavedViewHostReceiptIssuerV010({
    manager,resolveAuthorizationProvider:()=>provider,
    signingKeyId:hostKeyId,signingSecret:hostSecret
  });
  const inspect=(ctx,epoch)=>evaluateCv03N104dRealManagerAuthorityV010({
    manager,resolveAuthorizationProvider:()=>provider,
    requestContext:ctx,authorityEpoch:epoch
  });
  return {pkg,manager,access,provider,issuer,inspect,lifecycle};
}

test("N1-04d only trusted Host context and positive authority can sign a probe",async()=>{
  const x=managerFixture();
  const valid=await x.inspect(context(),1);
  assert.equal(valid.authorized,true);
  assert.equal(valid.event.evaluatedActorType,"HUMAN");
  const deniedAI=await x.inspect(context("company-a","AI"),1);
  assert.equal(deniedAI.authorized,false,
    "PA05 operation exposure + AuthorizationProvider are actor-specific");
  await assert.rejects(x.inspect({...context(),scope:{
    ...context().scope,enterpriseId:"company-b"
  }},1),/CV03_N104D_UNTRUSTED_HOST_REQUEST_CONTEXT/);
  await assert.rejects(x.inspect(context(),0),
    /CV03_N104D_AUTHORITY_EPOCH_INVALID/);
  assert.throws(()=>cv03N104dIsolatedOwnerOutboxSqlV010('cv03_"DROP'),
    /CV03_N1_ISOLATED_SCHEMA_REQUIRED/);
});

test("N1-04d isolated real PA05 manager and Host issuer → durable synthetic outbox → authenticated SQL authority",dbOnly,async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const schema="cv03_pa05_"+suffix,qSchema=quote(schema);
  const owner="cv03_pa05_owner_"+suffix;
  const delivery="cv03_pa05_deliver_"+suffix;
  const pwd="ci-delivery-"+randomUUID().replaceAll("-","");
  const accountUrl=new URL(url);
  accountUrl.username=delivery;accountUrl.password=pwd;
  const admin=postgres(url,{max:2,connect_timeout:10,prepare:false});
  let sqlDelivery,sqlRuntime,createdOwner=false,createdDelivery=false,createdSchema=false;
  const eventKeyTable=qSchema+".cv03_n104c_event_keys";
  const outboxTable=qSchema+".cv03_n104d_test_owner_outbox";
  const policyTable=qSchema+".cv03_n1_operation_policy";
  const ingestFn=qSchema+".cv03_n104c_ingest_signed_event";
  const gatewayFn=qSchema+".cv03_n1_signed_save";
  const env=managerFixture(),ctxA=context(),ctxB=context("company-b");
  const events=[];
  async function queue(snapshot){
    const event=snapshot.event;
    const auth=cv03N104cTestEventProofV010(event,eventKeyId,eventSecret);
    const payload=stableResourceReceiptJsonV010(event);
    await admin.unsafe("INSERT INTO "+outboxTable+
      "(context_id,principal_subject_id,actor_type,operation_id,authority_epoch,"+
      "event_json,signed_envelope,signature) VALUES "+
      "($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING",
      [event.contextId,event.principalSubjectId,event.evaluatedActorType,event.operationId,
        event.authorityEpoch,payload,auth.envelope,auth.signature]);
    const row=await admin.unsafe("SELECT event_json,signed_envelope,"+
      "signature,acked FROM "+outboxTable+
      " WHERE context_id=$1 AND principal_subject_id=$2 AND actor_type=$3 AND operation_id=$4"+
      " AND authority_epoch=$5",
      [event.contextId,event.principalSubjectId,event.evaluatedActorType,event.operationId,
        event.authorityEpoch]);
    assert.equal(row.length,1);
    assert.equal(row[0].event_json,payload,
      "reusing an outbox epoch with different authority must fail closed");
    assert.equal(row[0].signature,auth.signature);
    return {...event,...row[0]};
  }
  async function dispatch(snapshot,{ack=true}={}){
    const pending=await queue(snapshot);
    const row=await sqlDelivery.unsafe(
      "SELECT "+ingestFn+"($1::text,$2::text) AS result",
      [pending.signed_envelope,pending.signature]);
    if(ack)await admin.unsafe("UPDATE "+outboxTable+
      " SET acked=true WHERE context_id=$1"+
      " AND principal_subject_id=$2 AND actor_type=$3 AND operation_id=$4"+
      " AND authority_epoch=$5 AND signature=$6",
      [snapshot.event.contextId,snapshot.event.principalSubjectId,snapshot.event.evaluatedActorType,
        snapshot.event.operationId,snapshot.event.authorityEpoch,pending.signature]);
    events.push({epoch:snapshot.event.authorityEpoch,
      enabled:snapshot.event.enabled,context:snapshot.event.contextId,
      status:row[0].result});
    return row[0].result;
  }
  const dbState=async(ctx)=>admin.unsafe("SELECT enabled,mirror_healthy,"+
    "authority_epoch,delivery_required,lease_until FROM "+policyTable+
    " WHERE context_id=$1 AND principal_subject_id=$2 AND actor_type=$3 AND operation_id=$4",
    [ctx.context.activeContext.contextId,ctx.principal.subjectId,ctx.principal.actorType,op])
    .then(r=>r[0]);
  const makeValid=ctx=>{
    const input=material(ctx,"n104d-"+randomUUID().replaceAll("-").slice(0,12));
    return env.issuer(ctx,cmd,input).then(signed=>gatewayArgs(input,signed));
  };
  const sqlWrite=async args=>{
    const res=await admin.unsafe(
      "SELECT "+gatewayFn+"($1::text,$2::text,$3::text,"+
        "$4::text,$5::text,$6::text) AS result",args);
    return res[0].result;
  };
  try{
    await admin.unsafe("CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public");
    await admin.unsafe("CREATE ROLE "+quote(owner)+
      " NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE");
    createdOwner=true;
    await admin.unsafe("CREATE ROLE "+quote(delivery)+
      " LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '"+pwd+"'");
    createdDelivery=true;
    await preparePostgresConditionalResourceSchemaV010({
      connectionString:url,schema
    });
    createdSchema=true;
    await admin.unsafe(cv03N1GatewaySqlV010(schema));
    await admin.unsafe(cv03N104cIsolatedAuthorityBridgeSqlV010(schema));
    await admin.unsafe(cv03N104dIsolatedOwnerOutboxSqlV010(schema));
    await admin.unsafe("INSERT INTO "+qSchema+
      ".cv03_n1_signing_keys(key_id,secret) VALUES($1,$2)",
      [hostKeyId,hostSecret]);
    await admin.unsafe("INSERT INTO "+eventKeyTable+
      "(key_id,secret) VALUES($1,$2)",[eventKeyId,eventSecret]);
    await admin.unsafe("ALTER SCHEMA "+qSchema+" OWNER TO "+quote(owner));
    for(const name of ["resources","cv03_resource_receipts",
      "cv03_n1_signing_keys","cv03_n1_operation_policy",
      "cv03_n104c_event_keys","cv03_n104d_test_owner_outbox"]){
      await admin.unsafe("ALTER TABLE "+qSchema+"."+quote(name)+
        " OWNER TO "+quote(owner));
      await admin.unsafe("REVOKE ALL ON TABLE "+qSchema+"."+quote(name)+
        " FROM PUBLIC");
    }
    for(const sig of [
      "cv03_reject_receipt_mutation()",
      "cv03_n1_apply_owner_policy_epoch(text,text,text,text,bigint,boolean)",
      "cv03_n1_signed_save(text,text,text,text,text,text)",
      "cv03_n104c_ingest_signed_event(text,text)"
    ]){
      await admin.unsafe("ALTER FUNCTION "+qSchema+"."+sig+
        " OWNER TO "+quote(owner));
      await admin.unsafe("REVOKE ALL ON FUNCTION "+qSchema+"."+sig+
        " FROM PUBLIC");
    }
    await admin.unsafe("REVOKE ALL ON SCHEMA "+qSchema+" FROM PUBLIC");
    await admin.unsafe("GRANT USAGE ON SCHEMA "+qSchema+
      " TO "+quote(delivery));
    await admin.unsafe("GRANT EXECUTE ON FUNCTION "+ingestFn+
      "(text,text) TO "+quote(delivery));
    sqlDelivery=postgres(accountUrl.toString(),
      {max:2,connect_timeout:10,prepare:false});
    await assert.rejects(sqlDelivery.unsafe("SELECT * FROM "+outboxTable),
      /permission denied/i);
    await assert.rejects(sqlDelivery.unsafe("SELECT * FROM "+policyTable),
      /permission denied/i);
    await assert.rejects(sqlDelivery.unsafe("SELECT * FROM "+eventKeyTable),
      /permission denied/i);

    const initial=await env.inspect(ctxA,1);
    assert.equal(initial.authorized,true);
    const preparedBeforeRevoke=await makeValid(ctxA);
    assert.equal(await dispatch(initial,{ack:false}),"APPLIED");
    assert.equal((await dbState(ctxA)).enabled,true);
    assert.equal((await sqlWrite(preparedBeforeRevoke)).receipt.status,"SUCCEEDED");

    // ACK lost after database accepted the signed event. A separate
    // connection reconstructs the persisted envelope, and a replay becomes
    // STALE_IGNORED without extending an already granted lease.
    const reboot=postgres(url,{max:1,connect_timeout:10,prepare:false});
    try{
      const pending=await reboot.unsafe("SELECT signed_envelope,signature"+
        " FROM "+outboxTable+" WHERE acked=false");
      assert.equal(pending.length,1);
      const res=await sqlDelivery.unsafe("SELECT "+ingestFn+
        "($1::text,$2::text) AS result",
        [pending[0].signed_envelope,pending[0].signature]);
      assert.equal(res[0].result,"STALE_IGNORED");
      await reboot.unsafe("UPDATE "+outboxTable+" SET acked=true"+
        " WHERE acked=false AND signed_envelope=$1",
        [pending[0].signed_envelope]);
    }finally{await reboot.end();}
    assert.equal((await admin.unsafe("SELECT count(*)::int AS n FROM "+
      outboxTable+" WHERE acked=false"))[0].n,0);

    // The actual AuthorizationProvider revokes WRITE: a brand-new Host
    // issuer refuses it; an already signed receipt is stopped by SQL after
    // applying the revocation event.
    const late=await makeValid(ctxA);
    const aiScope=context("company-a","AI");
    assert.equal(await dispatch(await env.inspect(aiScope,1)),"APPLIED");
    assert.equal((await dbState(aiScope)).enabled,false);
    assert.equal((await dbState(ctxA)).enabled,true,
      "AI deny must not revoke the same subject's Human permission");
    env.access.companyA=false;
    await assert.rejects(()=>makeValid(ctxA),
      /CV03_HOST_RECEIPT_AUTHORIZATION_DENIED/);
    const denied=await env.inspect(ctxA,2);
    assert.equal(denied.authorized,false);
    assert.equal(await dispatch(denied),"APPLIED");
    assert.equal((await dbState(ctxA)).enabled,false);
    await assert.rejects(sqlWrite(late),
      /CV03_N104_OPERATION_REVOKED_OR_UNMIRRORED/);
    assert.equal(await dispatch(initial),"STALE_IGNORED",
      "old ENABLE must never override a newer real-Host DENY");

    // PA05's existing Capability Operation gate explicitly distinguishes
    // an AI actor; the SQL mirror independently records an AI DENY row,
    // so the same principal's Human ALLOW must never grant AI WRITE.
    env.access.companyA=true;
    assert.equal((await env.inspect(context("company-a","AI"),3)).authorized,
      false,"AI AuthorizationProvider denies while Human may be allowed");
    await assert.rejects(()=>makeValid(context("company-a","AI")),
      /CV03_HOST_RECEIPT_AUTHORIZATION_DENIED/);
    assert.equal(await dispatch(await env.inspect(ctxA,3)),"APPLIED");
    assert.equal((await dbState(ctxA)).enabled,true);

    // A new Enterprise Context is evaluated by the SAME real Manager and
    // AuthorizationProvider, not inferred from a database session string.
    const B=await env.inspect(ctxB,1);
    assert.equal(B.authorized,false);
    assert.equal(await dispatch(B),"APPLIED");
    assert.equal((await dbState(ctxB)).enabled,false);
    await assert.rejects(env.inspect({...ctxA,
      scope:{...ctxA.scope,enterpriseId:"company-b"}},4),
    /CV03_N104D_UNTRUSTED_HOST_REQUEST_CONTEXT/);
    // Explicitly revoke the previous enterprise scope on switching.
    // The adapter cannot discover/atomically fence old sessions by itself.
    env.access.companyA=false;
    assert.equal(await dispatch(await env.inspect(ctxA,4)),"APPLIED");
    assert.equal((await dbState(ctxA)).enabled,false);

    // Actual manager.disable() removes the effective Feature; even if the
    // AuthorizationProvider says ALLOW, both probes and Host issuer deny.
    env.access.companyA=true;
    env.access.companyB=true;
    env.manager.disable(env.pkg.packageId);
    assert.ok(env.lifecycle.some(e=>e.type==="FEATURE_DEACTIVATED" &&
      e.featureId==="host-enterprise-context-provider.personal-saved-views"));
    assert.equal((await env.inspect(ctxA,5)).authorized,false);
    await assert.rejects(()=>makeValid(ctxA),
      /CV03_HOST_RECEIPT_OPERATION_INACTIVE/);
    assert.equal(await dispatch(await env.inspect(ctxA,5)),"APPLIED");
    assert.equal(await dispatch(await env.inspect(ctxB,2)),"APPLIED");
    assert.equal((await dbState(ctxA)).enabled,false);
    assert.equal((await dbState(ctxB)).enabled,false);
    assert.equal((await admin.unsafe("SELECT count(*)::int AS n FROM "+
      outboxTable))[0].n,8,
      "one monotonic snapshot per explicit trusted fixture evaluation");
    console.log("CV03_N104D_REAL_PA05_MANAGER_AUTHORITY_TO_SIGNED_SQL=PASS");
    console.log("CV03_N104D_OUTBOX_LOST_ACK_REPLAY=PASS");
    console.log("CV03_N104D_REVOKE_SWITCH_ENTERPRISE_DISABLE_FEATURE=PASS");
    console.log("CV03_N104D_LIVE_PRODUCTION_OUTBOX=NOT_CERTIFIED");
  }finally{
    if(sqlRuntime)await sqlRuntime.end();
    if(sqlDelivery)await sqlDelivery.end();
    if(createdSchema)await admin.unsafe("DROP SCHEMA "+qSchema+" CASCADE");
    if(createdDelivery)await admin.unsafe("DROP ROLE "+quote(delivery));
    if(createdOwner)await admin.unsafe("DROP ROLE "+quote(owner));
    await admin.end();
  }
});
