import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,createHmac} from "node:crypto";
import postgres from "postgres";
import {mkdtempSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createFileLifecycleStore} from "../../dist/manager/store.js";
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
import {cv03N104gIsolatedOutboxBoundDeliverySqlV010}
  from "../../tools/cv03-n104g-isolated-outbox-bound-delivery.mjs";
import {cv03N104hIsolatedProducerFenceSqlV010}
  from "../../tools/cv03-n104h-isolated-producer-fence.mjs";
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
function fixture(filePath){
  const pkg={...hostEnterpriseContextProviderPackage,
    features:[...hostEnterpriseContextProviderPackage.features,
      personalSavedViewsOptInFeatureV010]};
  const catalog=createPackageCatalog([pkg]),lifecycle=[];
  let manager;
  const restartManager=()=>{
    manager=createAppManagerService(catalog,
      createFileLifecycleStore(filePath),()=>new Date(),new Map(),
      x=>lifecycle.push(x));
    return manager;
  };
  restartManager();
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
  return {pkg,get manager(){return manager},restartManager,
    lifecycle,access,evaluate};
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
  assert.throws(()=>cv03N104hIsolatedProducerFenceSqlV010(
    "cv03_bad; DROP TABLE policy"),/CV03_N1_ISOLATED_SCHEMA_REQUIRED/);
});

test("N1-04f real Manager decisions, atomic state/outbox, lost ACK, gap and signed snapshot recovery",isolated,async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,12);
  const schema="cv03_tx_"+suffix,q=quote(schema);
  const owner="cv03_tx_owner_"+suffix;
  const deliver="cv03_tx_deliver_"+suffix;
  const producerA="cv03_tx_producer_a_"+suffix;
  const producerB="cv03_tx_producer_b_"+suffix;
  const password="ci-tx-"+randomUUID().replaceAll("-","");
  const pwdA="ci-producer-a-"+randomUUID().replaceAll("-","");
  const pwdB="ci-producer-b-"+randomUUID().replaceAll("-","");
  const u=new URL(url);u.username=deliver;u.password=password;
  const admin=postgres(url,{max:2,connect_timeout:10,prepare:false});
  let delivery,clientA,clientB,ownerMade=false,roleMade=false,schemaMade=false;
  const createdProducerRoles=[];
  const lifecycleDir=mkdtempSync(join(tmpdir(),"cv03-n104i-pa05-restart-"));
  const lifecycleFile=join(lifecycleDir,"manager-lifecycle.json");
  const f=fixture(lifecycleFile),a=context(),ai=context("company-a","AI"),b=context("company-b");
  const state=q+".cv03_n104f_test_authority_state";
  const outbox=q+".cv03_n104f_test_authority_outbox";
  const policy=q+".cv03_n1_operation_policy";
  const txFn=q+".cv03_n104f_test_commit_authority";
  const ingest=q+".cv03_n104g_ingest_committed_authority";
  const unguarded=q+".cv03_n104c_ingest_signed_event";
  const recoverFn=q+".cv03_n104f_test_recover_snapshot";
  const fenceTable=q+".cv03_n104h_test_producer_fence";
  const fencedCommit=q+".cv03_n104h_test_commit_fenced";
  const fencedIngest=q+".cv03_n104h_ingest_fenced";
  const rotateFn=q+".cv03_n104h_test_rotate_generation";
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
    for(const [role,pwd] of [[producerA,pwdA],[producerB,pwdB]]){
      await admin.unsafe("CREATE ROLE "+quote(role)+
        " LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '"+pwd+"'");
      createdProducerRoles.push(role);
    }
    await preparePostgresConditionalResourceSchemaV010({connectionString:url,schema});
    schemaMade=true;
    await admin.unsafe(cv03N1GatewaySqlV010(schema));
    await admin.unsafe(cv03N104cIsolatedAuthorityBridgeSqlV010(schema));
    await admin.unsafe(cv03N104fIsolatedAuthorityTxOutboxSqlV010(schema));
    await admin.unsafe(cv03N104gIsolatedOutboxBoundDeliverySqlV010(schema));
    await admin.unsafe(cv03N104hIsolatedProducerFenceSqlV010(schema));
    await admin.unsafe("INSERT INTO "+fenceTable+
      "(source,active_generation,fence_epoch,producer_login) "+
      "VALUES('PA05_OWNER_TEST_ONLY','CI_GENERATION_1',1,$1::name)",
      [producerA]);
    await admin.unsafe("INSERT INTO "+q+
      ".cv03_n104c_event_keys(key_id,secret) VALUES($1,$2)",
      [eventKey,eventSecret]);
    await admin.unsafe("ALTER SCHEMA "+q+" OWNER TO "+quote(owner));
    for(const table of ["resources","cv03_resource_receipts",
      "cv03_n1_signing_keys","cv03_n1_operation_policy",
      "cv03_n104c_event_keys","cv03_n104f_test_authority_state",
      "cv03_n104f_test_authority_outbox",
      "cv03_n104h_test_producer_fence"]){
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
      "cv03_n104f_test_recover_snapshot(text,text)",
      "cv03_n104g_ingest_committed_authority(text,text)",
      "cv03_n104h_test_commit_fenced(text)",
      "cv03_n104h_test_rotate_generation(text,bigint,name)",
      "cv03_n104h_ingest_fenced(text,text)"
    ]){
      await admin.unsafe("ALTER FUNCTION "+q+"."+sig+" OWNER TO "+quote(owner));
      await admin.unsafe("REVOKE ALL ON FUNCTION "+q+"."+sig+" FROM PUBLIC");
    }
    await admin.unsafe("REVOKE ALL ON SCHEMA "+q+" FROM PUBLIC");
    await admin.unsafe("GRANT USAGE ON SCHEMA "+q+" TO "+quote(deliver));
    await admin.unsafe("GRANT EXECUTE ON FUNCTION "+ingest+
      "(text,text) TO "+quote(deliver));
    for(const role of [producerA,producerB]){
      await admin.unsafe("GRANT USAGE ON SCHEMA "+q+" TO "+quote(role));
      await admin.unsafe("GRANT EXECUTE ON FUNCTION "+fencedCommit+
        "(text) TO "+quote(role));
    }
    const connectAs=(role,pwd)=>{const c=new URL(url);
      c.username=role;c.password=pwd;return c.toString();};
    clientA=postgres(connectAs(producerA,pwdA),{max:1,connect_timeout:10,prepare:false});
    clientB=postgres(connectAs(producerB,pwdB),{max:1,connect_timeout:10,prepare:false});
    delivery=postgres(u.toString(),{max:1,connect_timeout:10,prepare:false});
    for(const table of [outbox,state,policy]){
      await assert.rejects(delivery.unsafe("SELECT * FROM "+table),
        /permission denied/i);
    }
    await assert.rejects(delivery.unsafe("SELECT "+txFn+
      "('{}',false)"),/permission denied/i);
    // Delivery login must not bypass the durable authority/outbox guard.
    await assert.rejects(delivery.unsafe("SELECT "+unguarded+
      "('{}','0')"),/permission denied/i);
    await assert.rejects(delivery.unsafe("SELECT "+recoverFn+
      "('{}','0')"),/permission denied/i);

    const initial=await f.evaluate(a,1);
    assert.equal(initial.enabled,true,"real Manager/Provider checked, not invented ALLOW");
    const uncommittedProof=cv03N104cTestEventProofV010(initial,eventKey,eventSecret);
    await assert.rejects(delivery.unsafe("SELECT "+ingest+
      "($1::text,$2::text)",[uncommittedProof.envelope,uncommittedProof.signature]),
      /CV03_N104G_UNCOMMITTED_AUTHORITY_DENIED/);
    assert.equal(await commit(initial),"COMMITTED_WITH_OUTBOX");
    const actorSpoof=cv03N104cTestEventProofV010(
      {...initial,evaluatedActorType:"AI"},eventKey,eventSecret);
    await assert.rejects(delivery.unsafe("SELECT "+ingest+
      "($1::text,$2::text)",[actorSpoof.envelope,actorSpoof.signature]),
      /CV03_N104G_UNCOMMITTED_AUTHORITY_DENIED/);
    assert.equal((await stateFor(a)).enabled,true);
    assert.equal((await pending(a,1)).acked,false);
    assert.equal(await commit(initial),"DUPLICATE");
    // Two concurrent Owner submissions for a fresh, independently-scoped
    // real Manager decision must produce exactly one state/outbox transaction.
    const raceCtx=context("company-race");
    const raceEvent=await f.evaluate(raceCtx,1);
    const raceResults=await Promise.all([commit(raceEvent),commit(raceEvent)]);
    assert.deepEqual(raceResults.slice().sort(),
      ["COMMITTED_WITH_OUTBOX","DUPLICATE"].sort());
    assert.equal((await stateFor(raceCtx)).enabled,false);
    assert.equal((await pending(raceCtx,1)).acked,false);
    console.log("CV03_N104F_CONCURRENT_T0_SINGLE_EVENT=PASS");
    await assert.rejects(commit({...initial,enabled:false}),
      /CV03_N104F_EPOCH_PAYLOAD_CONFLICT/);
    // Even a correctly HMAC-signed but unpersisted payload cannot mutate DB.
    const forged=cv03N104cTestEventProofV010(
      {...initial,enabled:false},eventKey,eventSecret);
    await assert.rejects(delivery.unsafe("SELECT "+ingest+
      "($1::text,$2::text)",[forged.envelope,forged.signature]),
      /CV03_N104G_OUTBOX_OR_SCOPE_MISMATCH/);
    await assert.rejects(delivery.unsafe("SELECT "+ingest+
      "($1::text,$2::text)",[uncommittedProof.envelope,"0".repeat(64)]),
      /CV03_N104G_SIGNER_DENIED/);
    assert.equal(await send(a,1,{acknowledge:false}),"APPLIED");
    assert.equal((await mirrorFor(a)).enabled,true);
    const oldLease=(await mirrorFor(a)).lease_until;
    const restarted=postgres(url,{max:1,connect_timeout:10,prepare:false});
    try{
      const recoveredOutbox=await restarted.unsafe(
        "SELECT event_json FROM "+outbox+
        " WHERE acked=false AND context_id=$1 AND actor_type=$2",
        [a.context.activeContext.contextId,a.principal.actorType]);
      assert.equal(recoveredOutbox.length,1,
        "only the ORIGINAL owner scope is replayed, not an unrelated concurrent scope");
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
    await assert.rejects(commit({...revoked,authorityEpoch:4}),
      /CV03_N104F_AUTHORITY_EPOCH_GAP_OR_STALE/);
    await admin.unsafe("UPDATE "+policy+
      " SET lease_until=clock_timestamp()-interval '1 second'"+
      " WHERE context_id=$1 AND actor_type='HUMAN'",[a.context.activeContext.contextId]);
    assert.ok((await mirrorFor(a)).lease_until<new Date(),
      "lost event cannot instantly revoke but expired lease fails CLOSED");
    assert.equal(await commit(revoked),"COMMITTED_WITH_OUTBOX");
    assert.equal(await send(a,1),"SUPERSEDED_NO_EFFECT",
      "older committed ALLOW cannot be replayed after a durable revoke");
    assert.ok((await mirrorFor(a)).lease_until<new Date(),
      "superseded ALLOW must not refresh an expired permit");
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
    assert.equal(await send(a,3),"SUPERSEDED_NO_EFFECT");
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
    await assert.rejects(recover(snapshotProof(heartbeat,{
      enterpriseId:"company-b"
    })),/CV03_N104F_SNAPSHOT_INVALID/);
    await assert.rejects(recover(snapshotProof(heartbeat,{
      evaluatedActorType:"AI"
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
    assert.ok(readFileSync(lifecycleFile,"utf8").includes('"activeFeatures": []'),
      "PA05 disable must persist inactive Feature to the actual file");
    f.restartManager();
    assert.equal(f.manager.listEffectiveCapabilityOperations()
      .some(x=>x.operationId===op),false,
      "restarted actual PA05 Manager must not rediscover disabled Operation");
    const disabled=await f.evaluate(a,5);
    assert.equal(disabled.enabled,false);
    console.log("CV03_N104I_REAL_PA05_FILE_DISABLE_REOPEN_DENIES=PASS");
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
    assert.equal((await admin.unsafe("SELECT count(*)::int AS n FROM "+outbox))[0].n,9);
    console.log("CV03_N104F_REVOKE_ACTOR_SWITCH_ENTERPRISE_DISABLE=PASS");
    console.log("CV03_N104G_COMMITTED_OUTBOX_BOUND_SIGNED_DELIVERY=PASS");
    console.log("CV03_N104G_NO_STALE_ALLOW_REFRESH_AFTER_REVOKE=PASS");
    // Disabled signer must also prevent even a 'safe' superseded-event ACK.
    await admin.unsafe("UPDATE "+q+
      ".cv03_n104c_event_keys SET enabled=false WHERE key_id=$1",[eventKey]);
    await assert.rejects(send(a,1),/CV03_N104G_SIGNER_DENIED/);
    console.log("CV03_N104G_KEY_DISABLE_STALE_ACK_FAIL_CLOSED=PASS");

    // N1-04h: re-enable the TEST signer only to exercise producer fencing.
    await admin.unsafe("UPDATE "+q+
      ".cv03_n104c_event_keys SET enabled=true WHERE key_id=$1",[eventKey]);
    await admin.unsafe("REVOKE EXECUTE ON FUNCTION "+ingest+
      "(text,text) FROM "+quote(deliver));
    await admin.unsafe("GRANT EXECUTE ON FUNCTION "+fencedIngest+
      "(text,text) TO "+quote(deliver));
    const publish=(client,event)=>client.unsafe("SELECT "+fencedCommit+
      "($1::text) AS status",[canonical(event)]).then(x=>x[0].status);
    const deliverFenced=async(ctx,epoch)=>{
      const persisted=await pending(ctx,epoch);
      assert.ok(persisted,"fenced consumer must read an already committed outbox row");
      const proof=cv03N104cTestEventProofV010(
        JSON.parse(persisted.event_json),eventKey,eventSecret);
      return delivery.unsafe("SELECT "+fencedIngest+
        "($1::text,$2::text) AS status",
        [proof.envelope,proof.signature]).then(x=>x[0].status);
    };
    const fenceInfo=async()=>admin.unsafe("SELECT active_generation,fence_epoch,"+
      "producer_login FROM "+fenceTable+
      " WHERE source='PA05_OWNER_TEST_ONLY'").then(x=>x[0]);
    const oldDecision=await f.evaluate(ai,2);
    const oldProducerEvent={...oldDecision,
      producerLogin:producerA,producerFenceEpoch:1};
    assert.equal(await publish(clientA,oldProducerEvent),"COMMITTED_WITH_OUTBOX");
    await assert.rejects(publish(clientB,oldProducerEvent),
      /CV03_N104H_PRODUCER_FENCED/);
    await assert.rejects(clientA.unsafe("SELECT "+rotateFn+
      "('CI_GENERATION_1',1,$1::name)",[producerA]),/permission denied/i);
    await assert.rejects(clientA.unsafe("SELECT "+txFn+"('{}',false)"),
      /permission denied/i);
    await assert.rejects(clientA.unsafe("SELECT * FROM "+fenceTable),
      /permission denied/i);
    assert.equal(await deliverFenced(ai,2),"APPLIED");
    // Re-authenticated SQL delivery has no path back to un-fenced N1-04g.
    await assert.rejects(delivery.unsafe("SELECT "+ingest+"('{}','0')"),
      /permission denied/i);

    // Emulate a still-live old mirror permit. Generation rotation must
    // disable it in the SAME COMMIT as authority/outbox deny tombstones.
    await admin.unsafe("UPDATE "+policy+
      " SET enabled=true,mirror_healthy=true,delivery_required=true,"+
      "lease_until=clock_timestamp()+interval '90 seconds'"+
      " WHERE context_id=$1 AND actor_type='HUMAN'",
      [a.context.activeContext.contextId]);
    assert.equal((await mirrorFor(a)).enabled,true);
    assert.equal((await f.evaluate(a,6)).enabled,false,
      "disk-restarted PA05 Manager is DENY while disconnected SQL still ALLOW");
    // This deliberately exposes the cross-store fail-open window. A trusted
    // cold-start owner must invoke generation fencing BEFORE serving Saved
    // View requests; the isolated DB cannot infer file-store changes itself.
    console.log("CV03_N104I_RESTART_STALE_SQL_MIRROR_REQUIRES_FENCE=PASS");
    const rotated=await admin.unsafe("SELECT "+rotateFn+
      "($1::text,$2::bigint,$3::name) AS scopes",
      ["CI_GENERATION_1",1,producerB]);
    assert.equal(Number(rotated[0].scopes),4,
      "generation switch must deny every existing actor/enterprise scope");
    assert.equal((await fenceInfo()).active_generation,"CI_GENERATION_2");
    assert.equal(Number((await fenceInfo()).fence_epoch),2);
    assert.equal((await fenceInfo()).producer_login,producerB);
    assert.equal((await mirrorFor(a)).enabled,false);
    assert.equal((await mirrorFor(a)).mirror_healthy,false);
    assert.equal((await mirrorFor(a)).lease_until,null);
    assert.equal(Number((await stateFor(a)).authority_epoch),6);
    const tombstone=await pending(a,6);
    assert.equal(JSON.parse(tombstone.event_json).rotationDenyTombstone,true);
    assert.equal(JSON.parse(tombstone.event_json).generation,"CI_GENERATION_2");
    assert.equal(JSON.parse(tombstone.event_json).enabled,false);
    const allTombstones=await admin.unsafe("SELECT count(*)::int AS total FROM "+
      outbox+" WHERE generation='CI_GENERATION_2' "+
      "AND event_json::jsonb->>'rotationDenyTombstone'='true'");
    assert.equal(allTombstones[0].total,4,
      "every known enterprise/actor scope must have durable generation-2 DENY tombstone");
    console.log("CV03_N104H_ROTATE_ATOMIC_DENY_ALL_SCOPES=PASS");

    await assert.rejects(admin.unsafe("SELECT "+rotateFn+
      "($1::text,$2::bigint,$3::name)",["CI_GENERATION_1",1,producerB]),
      /CV03_N104H_ROTATION_STALE_OR_UNSAFE/);
    await assert.rejects(publish(clientA,{...oldProducerEvent,authorityEpoch:4}),
      /CV03_N104H_PRODUCER_FENCED/);
    await assert.rejects(publish(clientB,oldProducerEvent),
      /CV03_N104H_PRODUCER_FENCED/);
    await assert.rejects(deliverFenced(ai,2),
      /CV03_N104H_GENERATION_FENCED/);
    await assert.rejects(recover(snapshotProof(heartbeat)),
      /CV03_N104F_SNAPSHOT_NOT_AUTHORITATIVE/);
    assert.equal(await deliverFenced(a,6),"STALE_IGNORED");
    assert.equal((await mirrorFor(a)).mirror_healthy,false,
      "generation tombstone never automatically clears unhealthy latch");
    // Verify generation survives a new database process/connection.
    const restartedFence=postgres(url,{max:1,connect_timeout:10,prepare:false});
    try{
      const persistedFence=await restartedFence.unsafe(
        "SELECT fence_epoch FROM "+fenceTable);
      assert.equal(Number(persistedFence[0].fence_epoch),2);
    }finally{await restartedFence.end();}
    console.log("CV03_N104H_OLD_PRODUCER_AND_OLD_SNAPSHOT_FENCED=PASS");

    // The true Manager is re-enabled; only new SQL producer B may append
    // new generation epoch7. Mirror stays unhealthy until signed T3 restore.
    f.manager.enable(f.pkg.packageId);
    const decisionNew=await f.evaluate(a,7);
    assert.equal(decisionNew.enabled,true);
    const newEvent={...decisionNew,generation:"CI_GENERATION_2",
      producerLogin:producerB,producerFenceEpoch:2};
    assert.equal(await publish(clientB,newEvent),"COMMITTED_WITH_OUTBOX");
    await assert.rejects(commit({...newEvent,authorityEpoch:8,
      generation:"CI_GENERATION_1"}),/CV03_N104H_GENERATION_ROLLBACK_DENIED/);
    assert.equal(await deliverFenced(a,7),"APPLIED");
    assert.equal((await mirrorFor(a)).enabled,true);
    assert.equal((await mirrorFor(a)).mirror_healthy,false,
      "ordinary new-generation ALLOW must not silently clear fail-closed latch");
    assert.equal(await recover(snapshotProof(newEvent)),"FULL_ACTOR_SNAPSHOT_APPLIED");
    assert.equal((await mirrorFor(a)).mirror_healthy,true);
    assert.equal((await mirrorFor(a)).enabled,true);
    assert.equal((await mirrorFor(ai)).enabled,false,
      "recovering one Human cannot release another actor's scope");
    console.log("CV03_N104H_NEW_PRODUCER_T3_RESTORE_ACTOR_ISOLATED=PASS");
    console.log("CV03_N104H_REAL_PA05_PRODUCER=NOT_CERTIFIED");
    console.log("CV03_N104F_REAL_LIFECYCLE_ATOMIC_OUTBOX=NOT_CERTIFIED");
    console.log("CV03_N104F_PRODUCTION_SQL_KMS_PA05_OWNER=NOT_CERTIFIED");
  }finally{
    if(delivery)await delivery.end();
    if(clientA)await clientA.end();
    if(clientB)await clientB.end();
    if(schemaMade)await admin.unsafe("DROP SCHEMA "+q+" CASCADE");
    for(const role of createdProducerRoles.slice().reverse())
      await admin.unsafe("DROP ROLE "+quote(role));
    if(roleMade)await admin.unsafe("DROP ROLE "+quote(deliver));
    if(ownerMade)await admin.unsafe("DROP ROLE "+quote(owner));
    await admin.end();
    rmSync(lifecycleDir,{recursive:true,force:true});
  }
});
