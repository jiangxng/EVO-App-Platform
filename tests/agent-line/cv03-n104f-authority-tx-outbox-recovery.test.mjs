import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,createHmac} from "node:crypto";
import postgres from "postgres";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createMemoryLifecycleStore} from "../../dist/manager/store.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {hostEnterpriseContextProviderPackage}
  from "../../dist/providers/enterprise-context/package.js";
import {personalSavedViewsOptInFeatureV010}
  from "../../dist/providers/enterprise-context/personal-saved-views.js";
import {preparePostgresConditionalResourceSchemaV010}
  from "../../dist/providers/enterprise-context/resources-postgres.js";
import {stableResourceReceiptJsonV010}
  from "../../dist/providers/enterprise-context/resource-receipt-digest.js";
import {cv03N1GatewaySqlV010}
  from "../../tools/cv03-n1-isolated-signed-sql-gateway.mjs";
import {cv03N104cIsolatedAuthorityBridgeSqlV010,
  cv03N104cTestEventProofV010}
  from "../../tools/cv03-n104c-isolated-authority-event-bridge.mjs";
import {cv03N104fIsolatedAuthorityTxOutboxSqlV010}
  from "../../tools/cv03-n104f-isolated-authority-tx-outbox.mjs";
import {evaluateCv03N104dRealManagerAuthorityV010}
  from "../../tools/cv03-n104d-isolated-pa05-manager-authority.mjs";

const url=process.env.CV03_RESOURCE_PROOF_DATABASE_URL;
const enabled=process.env.CV03_N1_ONLY_ISOLATED_GATEWAY_TEST==="YES_CI_LOCAL" &&
  !!url && (()=>{try{
    const u=new URL(url);
    return ["localhost","127.0.0.1"].includes(u.hostname) &&
      u.pathname==="/cv03proof";
  }catch{return false;}})();
const isolated={skip:!enabled&&"Explicit PG18 localhost/cv03proof only",timeout:90000};
const op="collection.saved-view.personal.save";
const eventKey="cv03-n104f-event-test-key";
const eventSecret="N104F_ISOLATED_TEST_ONLY_SIGNER_NEVER_PRODUCTION_123456789";
const quote=s=>'"'+s+'"';

function context(enterprise="company-a",actor="HUMAN"){
  const subject="owner-a";
  return {
    contractVersion:"0.1.0",
    principal:{contractVersion:"0.1.0",subjectId:subject,actorType:actor,
      identityProviderId:"cv03.n104f.fixture",sessionId:"ci-"+actor},
    scope:{contractVersion:"0.1.0",enterpriseId:enterprise,userId:subject},
    context:{contractVersion:"0.1.0",
      personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
        contextId:"personal:owner-a",ownerSubjectId:subject},
      activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
        contextId:"enterprise-context:"+enterprise,enterpriseId:enterprise}
    },correlationId:"cv03-n104f-"+enterprise+"-"+actor
  };
}
function fixture(){
  const pkg={...hostEnterpriseContextProviderPackage,
    features:[...hostEnterpriseContextProviderPackage.features,
      personalSavedViewsOptInFeatureV010]};
  const lifecycle=[];
  const manager=createAppManagerService(createPackageCatalog([pkg]),
    createMemoryLifecycleStore(),()=>new Date(),new Map(),x=>lifecycle.push(x));
  manager.install(pkg.packageId);
  const access={companyA:true,companyB:false,human:true,ai:false};
  const provider={
    providerId:"cv03.n104f.isolated.authorization-provider",
    check({scope,principal,action}){
      const allow=action==="collection.saved-view.write" &&
        (scope.enterpriseId==="company-a"?access.companyA:access.companyB) &&
        (principal.actorType==="HUMAN"?access.human:
          principal.actorType==="AI"&&access.ai);
      return {contractVersion:"0.1.0",allowed:Boolean(allow),
        policyProviderId:"cv03.n104f.isolated.authorization-provider",
        reasonCodes:[allow?"ALLOW_TEST_ONLY":"DENY_TEST_ONLY"]};
    }
  };
  const evaluate=async(ctx,epoch)=>{
    const probe=await evaluateCv03N104dRealManagerAuthorityV010({
      manager,resolveAuthorizationProvider:()=>provider,
      requestContext:ctx,authorityEpoch:epoch
    });
    return {...probe.event,
      enterpriseId:ctx.context.activeContext.enterpriseId,
      generation:"CI_GENERATION_1"};
  };
  return {pkg,manager,lifecycle,access,evaluate};
}
function snapshotProof(event,override={}){
  const snapshot={source:event.source,generation:event.generation,
    completeness:"SINGLE_ACTOR_OPERATION",
    contextId:event.contextId,enterpriseId:event.enterpriseId,
    principalSubjectId:event.principalSubjectId,
    evaluatedActorType:event.evaluatedActorType,
    operationId:event.operationId,authorityEpoch:event.authorityEpoch,
    enabled:event.enabled,issuedAt:new Date().toISOString(),...override};
  const envelope=stableResourceReceiptJsonV010({
    domain:"cv03.pa05-owner-snapshot.isolated/0.1.0",
    keyId:eventKey,snapshot
  });
  return {envelope,signature:createHmac("sha256",eventSecret)
    .update(envelope).digest("hex")};
}

test("N1-04f fixture rejects untrusted SQL namespace",()=>{
  assert.throws(()=>cv03N104fIsolatedAuthorityTxOutboxSqlV010(
    'cv03_wrong"; DROP TABLE x'),/CV03_N1_ISOLATED_SCHEMA_REQUIRED/);
});

test("N1-04f real Manager decisions, atomic state/outbox, lost ACK, gap and signed snapshot recovery",isolated,async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const schema="cv03_tx_"+suffix,q=quote(schema);
  const owner="cv03_tx_owner_"+suffix;
  const deliver="cv03_tx_deliver_"+suffix;
  const password="ci-tx-"+randomUUID().replaceAll("-","");
  const u=new URL(url);u.username=deliver;u.password=password;
  const admin=postgres(url,{max:2,connect_timeout:10,prepare:false});
  let delivery,ownerMade=false,roleMade=false,schemaMade=false;
  const f=fixture(),a=context(),ai=context("company-a","AI"),b=context("company-b");
  const state=q+".cv03_n104f_test_authority_state";
  const outbox=q+".cv03_n104f_test_authority_outbox";
  const policy=q+".cv03_n1_operation_policy";
  const txFn=q+".cv03_n104f_test_commit_authority";
  const ingest=q+".cv03_n104c_ingest_signed_event";
  const recoverFn=q+".cv03_n104f_test_recover_snapshot";
  const canonical=event=>stableResourceReceiptJsonV010(event);
  const commit=(event,fault=false)=>admin.unsafe(
    "SELECT "+txFn+"($1::text,$2::boolean) AS result",
    [canonical(event),fault]).then(x=>x[0].result);
  const stateFor=async(ctx)=>admin.unsafe(
    "SELECT authority_epoch,enabled FROM "+state+
    " WHERE context_id=$1 AND principal_subject_id=$2 AND actor_type=$3",
    [ctx.context.activeContext.contextId,ctx.principal.subjectId,
      ctx.principal.actorType]).then(x=>x[0]);
  const mirrorFor=async(ctx)=>admin.unsafe(
    "SELECT authority_epoch,enabled,mirror_healthy,lease_until FROM "+policy+
    " WHERE context_id=$1 AND principal_subject_id=$2 AND actor_type=$3",
    [ctx.context.activeContext.contextId,ctx.principal.subjectId,
      ctx.principal.actorType]).then(x=>x[0]);
  const pending=async(ctx,epoch)=>admin.unsafe(
    "SELECT event_json,acked FROM "+outbox+
    " WHERE context_id=$1 AND principal_subject_id=$2 AND actor_type=$3"+
    " AND operation_id=$4 AND authority_epoch=$5",
    [ctx.context.activeContext.contextId,ctx.principal.subjectId,
      ctx.principal.actorType,op,epoch]).then(x=>x[0]);
  const ack=async(ctx,epoch)=>admin.unsafe("UPDATE "+outbox+
    " SET acked=true,acked_at=clock_timestamp()"+
    " WHERE context_id=$1 AND principal_subject_id=$2 AND actor_type=$3"+
    " AND operation_id=$4 AND authority_epoch=$5",
    [ctx.context.activeContext.contextId,ctx.principal.subjectId,
      ctx.principal.actorType,op,epoch]);
  const send=async(ctx,epoch,{acknowledge=true}={})=>{
    const row=await pending(ctx,epoch);
    assert.ok(row,"only a COMMITTED durable event can be delivered");
    const ev=JSON.parse(row.event_json);
    const proof=cv03N104cTestEventProofV010(ev,eventKey,eventSecret);
    const result=await delivery.unsafe(
      "SELECT "+ingest+"($1::text,$2::text) AS result",
      [proof.envelope,proof.signature]).then(x=>x[0].result);
    if(acknowledge)await ack(ctx,epoch);
    return result;
  };
  const recover=proof=>admin.unsafe(
    "SELECT "+recoverFn+"($1::text,$2::text) AS result",
    [proof.envelope,proof.signature]).then(x=>x[0].result);
  try{
    await admin.unsafe("CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public");
    await admin.unsafe("CREATE ROLE "+quote(owner)+
      " NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE");
    ownerMade=true;
    await admin.unsafe("CREATE ROLE "+quote(deliver)+
      " LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '"+password+"'");
    roleMade=true;
    await preparePostgresConditionalResourceSchemaV010({connectionString:url,schema});
    schemaMade=true;
    await admin.unsafe(cv03N1GatewaySqlV010(schema));
    await admin.unsafe(cv03N104cIsolatedAuthorityBridgeSqlV010(schema));
    await admin.unsafe(cv03N104fIsolatedAuthorityTxOutboxSqlV010(schema));
    await admin.unsafe("INSERT INTO "+q+
      ".cv03_n104c_event_keys(key_id,secret) VALUES($1,$2)",
      [eventKey,eventSecret]);
    await admin.unsafe("ALTER SCHEMA "+q+" OWNER TO "+quote(owner));
    for(const table of ["resources","cv03_resource_receipts",
      "cv03_n1_signing_keys","cv03_n1_operation_policy",
      "cv03_n104c_event_keys","cv03_n104f_test_authority_state",
      "cv03_n104f_test_authority_outbox"]){
      await admin.unsafe("ALTER TABLE "+q+"."+quote(table)+
        " OWNER TO "+quote(owner));
      await admin.unsafe("REVOKE ALL ON TABLE "+q+"."+quote(table)+" FROM PUBLIC");
    }
    for(const sig of [
      "cv03_reject_receipt_mutation()",
      "cv03_n1_apply_owner_policy_epoch(text,text,text,text,bigint,boolean)",
      "cv03_n1_signed_save(text,text,text,text,text,text)",
      "cv03_n104c_ingest_signed_event(text,text)",
      "cv03_n104f_test_commit_authority(text,boolean)",
      "cv03_n104f_test_recover_snapshot(text,text)"
    ]){
      await admin.unsafe("ALTER FUNCTION "+q+"."+sig+" OWNER TO "+quote(owner));
      await admin.unsafe("REVOKE ALL ON FUNCTION "+q+"."+sig+" FROM PUBLIC");
    }
    await admin.unsafe("REVOKE ALL ON SCHEMA "+q+" FROM PUBLIC");
    await admin.unsafe("GRANT USAGE ON SCHEMA "+q+" TO "+quote(deliver));
    await admin.unsafe("GRANT EXECUTE ON FUNCTION "+ingest+
      "(text,text) TO "+quote(deliver));
    delivery=postgres(u.toString(),{max:1,connect_timeout:10,prepare:false});
    for(const table of [outbox,state,policy]){
      await assert.rejects(delivery.unsafe("SELECT * FROM "+table),
        /permission denied/i);
    }
    await assert.rejects(delivery.unsafe("SELECT "+txFn+
      "('{}',false)"),/permission denied/i);
    await assert.rejects(delivery.unsafe("SELECT "+recoverFn+
      "('{}','0')"),/permission denied/i);

    const initial=await f.evaluate(a,1);
    assert.equal(initial.enabled,true,"real Manager/Provider checked, not invented ALLOW");
    assert.equal(await commit(initial),"COMMITTED_WITH_OUTBOX");
    assert.equal((await stateFor(a)).enabled,true);
    assert.equal((await pending(a,1)).acked,false);
    assert.equal(await commit(initial),"DUPLICATE");
    await assert.rejects(commit({...initial,enabled:false}),
      /CV03_N104F_EPOCH_PAYLOAD_CONFLICT/);
    assert.equal(await send(a,1,{acknowledge:false}),"APPLIED");
    assert.equal((await mirrorFor(a)).enabled,true);
    const oldLease=(await mirrorFor(a)).lease_until;
    const restarted=postgres(url,{max:1,connect_timeout:10,prepare:false});
    try{
      const recoveredOutbox=await restarted.unsafe(
        "SELECT event_json FROM "+outbox+" WHERE acked=false");
      assert.equal(recoveredOutbox.length,1);
      assert.equal(recoveredOutbox[0].event_json,canonical(initial));
      assert.equal(await send(a,1,{acknowledge:true}),"STALE_IGNORED");
      assert.equal((await mirrorFor(a)).lease_until.getTime(),
        oldLease.getTime(),"duplicate delivery may not extend permit");
    }finally{await restarted.end();}
    assert.equal((await pending(a,1)).acked,true);
    console.log("CV03_N104F_T0_ATOMIC_AUTHORITY_OUTBOX_LOST_ACK=PASS");

    // A failed transaction must not leave an authority mutation without outbox.
    f.access.companyA=false;
    const revoked=await f.evaluate(a,2);
    assert.equal(revoked.enabled,false);
    await assert.rejects(commit(revoked,true),
      /CV03_N104F_FORCED_T0_ROLLBACK/);
    assert.equal(Number((await stateFor(a)).authority_epoch),1);
    assert.equal(await pending(a,2),undefined);
    await admin.unsafe("UPDATE "+policy+
      " SET lease_until=clock_timestamp()-interval '1 second'"+
      " WHERE context_id=$1 AND actor_type='HUMAN'",[a.context.activeContext.contextId]);
    assert.ok((await mirrorFor(a)).lease_until<new Date(),
      "lost event cannot instantly revoke but expired lease fails CLOSED");
    assert.equal(await commit(revoked),"COMMITTED_WITH_OUTBOX");
    assert.equal(await send(a,2),"APPLIED");
    assert.equal((await mirrorFor(a)).enabled,false);

    // Human state never confers AI. AI gets its own same-subject epoch 1 DENY.
    const deniedAI=await f.evaluate(ai,1);
    assert.equal(deniedAI.enabled,false);
    assert.equal(await commit(deniedAI),"COMMITTED_WITH_OUTBOX");
    assert.equal(await send(ai,1),"APPLIED");
    assert.equal((await mirrorFor(ai)).enabled,false);

    // Switch to another enterprise requires an explicit old-context revoke
    // and a distinct denied new context. No inferred grant via shared subject.
    const deniedB=await f.evaluate(b,1);
    assert.equal(deniedB.enabled,false);
    assert.equal(await commit(deniedB),"COMMITTED_WITH_OUTBOX");
    assert.equal(await send(b,1),"APPLIED");
    assert.equal((await mirrorFor(b)).enabled,false);

    // Deliberately deliver epoch 4 before epoch 3: unhealthy mirror latches.
    f.access.companyA=true;
    const reenabled=await f.evaluate(a,3);
    const heartbeat=await f.evaluate(a,4);
    assert.equal(reenabled.enabled,true);
    assert.equal(await commit(reenabled),"COMMITTED_WITH_OUTBOX");
    assert.equal(await commit(heartbeat),"COMMITTED_WITH_OUTBOX");
    assert.equal(await send(a,4),"GAP_FAIL_CLOSED");
    assert.equal((await mirrorFor(a)).mirror_healthy,false);
    assert.equal(await send(a,3),"STALE_IGNORED");
    assert.equal((await mirrorFor(a)).mirror_healthy,false,
      "ordinary older event cannot clear gap latch");
    await assert.rejects(recover({
      ...snapshotProof(heartbeat),signature:"0".repeat(64)
    }),/CV03_N104F_SNAPSHOT_SIGNATURE_INVALID/);
    await assert.rejects(recover(snapshotProof(heartbeat,{
      completeness:"PARTIAL"
    })),/CV03_N104F_SNAPSHOT_INVALID/);
    await assert.rejects(recover(snapshotProof(heartbeat,{
      authorityEpoch:3
    })),/CV03_N104F_SNAPSHOT_NOT_AUTHORITATIVE/);
    assert.equal(await recover(snapshotProof(heartbeat)),
      "FULL_ACTOR_SNAPSHOT_APPLIED");
    assert.equal((await mirrorFor(a)).mirror_healthy,true);
    assert.equal((await mirrorFor(a)).enabled,true);
    assert.equal((await mirrorFor(ai)).enabled,false,
      "recovery applies only to signed actor+operation scope");
    console.log("CV03_N104F_T3_SIGNED_FULL_SCOPE_SNAPSHOT_GAP_RECOVERY=PASS");

    // Actual manager.disable() removes effective Capability Operations.
    f.manager.disable(f.pkg.packageId);
    assert.ok(f.lifecycle.some(x=>x.type==="FEATURE_DEACTIVATED"));
    const disabled=await f.evaluate(a,5);
    assert.equal(disabled.enabled,false);
    assert.equal(await commit(disabled),"COMMITTED_WITH_OUTBOX");
    assert.equal(await send(a,5),"APPLIED");
    assert.equal((await mirrorFor(a)).enabled,false);
    await assert.rejects(recover(snapshotProof(heartbeat)),
      /CV03_N104F_SNAPSHOT_NOT_AUTHORITATIVE/);
    const disabledB=await f.evaluate(b,2);
    assert.equal(disabledB.enabled,false);
    assert.equal(await commit(disabledB),"COMMITTED_WITH_OUTBOX");
    assert.equal(await send(b,2),"APPLIED");
    assert.equal((await mirrorFor(b)).enabled,false);
    assert.equal((await admin.unsafe("SELECT count(*)::int AS n FROM "+outbox))[0].n,8);
    console.log("CV03_N104F_REVOKE_ACTOR_SWITCH_ENTERPRISE_DISABLE=PASS");
    console.log("CV03_N104F_REAL_LIFECYCLE_ATOMIC_OUTBOX=NOT_CERTIFIED");
    console.log("CV03_N104F_PRODUCTION_SQL_KMS_PA05_OWNER=NOT_CERTIFIED");
  }finally{
    if(delivery)await delivery.end();
    if(schemaMade)await admin.unsafe("DROP SCHEMA "+q+" CASCADE");
    if(roleMade)await admin.unsafe("DROP ROLE "+quote(deliver));
    if(ownerMade)await admin.unsafe("DROP ROLE "+quote(owner));
    await admin.end();
  }
});
