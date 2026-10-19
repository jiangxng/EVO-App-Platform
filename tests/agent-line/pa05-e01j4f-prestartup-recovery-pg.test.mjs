import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {randomUUID} from "node:crypto";
import {createServer} from "node:net";
import {mkdtempSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname,join} from "node:path";
import postgres from "postgres";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {createFileLifecycleStore} from "../../dist/manager/store.js";
import {tradingReferencePackageV010} from "../../dist/apps/trading-reference/package.js";
import {purchaseAttentionPackageV010} from "../../dist/apps/purchase-attention/package.js";
import {createPa05ReadLifecyclePgAuthorityV010}
  from "../../dist/manager/pa05-read-owner-lifecycle-pg.js";

import {recoverPa05TrustedPrestartupUninstallV010}
  from "../../dist/manager/pa05-read-owner-trusted-prestartup.js";
import {createHostBearerSessionProviderV010}
  from "../../dist/providers/request-session/runtime.js";
import {createHostStaticAuthorizationProviderV010}
  from "../../dist/providers/authorization/runtime.js";
import {createMemorySecretStoreV010}
  from "../../dist/manager/secret-store.js";
import {createHostEncryptedSecretsProviderV010}
  from "../../dist/providers/secrets/runtime.js";

const url=process.env.PA05_XDB_AUTHORITY_DATABASE_URL;
const owner="evo-purchase-attention";
async function port(){
  const s=createServer();
  await new Promise((resolve,reject)=>s.once("error",reject)
    .listen(0,"127.0.0.1",resolve));
  const n=s.address().port;
  await new Promise(resolve=>s.close(resolve));
  return n;
}
async function childResult(file,env={},isServer=false){
  const n=await port();
  const args=isServer?["dist/manager/server.js"]:
    ["tests/agent-line/fixtures/pa05-e01j4f-repair-worker.mjs"];
  const p=spawn(process.execPath,args,{
    cwd:process.cwd(),
    env:{
      PATH:process.env.PATH??"",HOME:dirname(file),
      NODE_ENV:"test",PORT:String(n),
      ...(isServer?{
        APP_PLATFORM_STATE_FILE:file,
        APP_PLATFORM_PA05_E01D_ADMIN_READ_ADMISSION:"OFF"
      }:{PA05_J4F_TEST_STATE_FILE:file}),...env
    },
    stdio:["ignore","pipe","pipe"]
  });
  let output="";
  p.stdout.on("data",b=>{output=(output+String(b)).slice(-18000)});
  p.stderr.on("data",b=>{output=(output+String(b)).slice(-18000)});
  if(isServer){
    let served=false;
    for(let i=0;i<110;i++){
      if(p.exitCode!==null || p.signalCode!==null)break;
      try{
        let r=await fetch("http://127.0.0.1:"+n+"/v1/catalog",{
          signal:AbortSignal.timeout(500)
        });
        if(r.status===200){served=true;break;}
      }catch{}
      await new Promise(resolve=>setTimeout(resolve,120));
    }
    if(served)p.kill("SIGTERM");
    if(p.exitCode===null && p.signalCode===null){
      await Promise.race([
        new Promise(resolve=>p.once("exit",resolve)),
        new Promise((_,reject)=>setTimeout(()=>
          reject(Error("PA05_J4F_HOST_TIMEOUT:"+output)),17000))
      ]);
    }
    return {code:p.exitCode,signal:p.signalCode,output,served};
  }
  await Promise.race([
    new Promise(resolve=>p.once("exit",resolve)),
    new Promise((_,reject)=>setTimeout(()=>
      reject(Error("PA05_J4F_OPERATOR_TIMEOUT:"+output)),17000))
  ]);
  return {code:p.exitCode,signal:p.signalCode,output};
}
test("E01J4F original Host restart quarantine and fenced prestart UNINSTALL repair",{
  skip:!url?"real three PostgreSQL18 CI required":false,
  timeout:115000
},async()=>{
  const id=randomUUID().replaceAll("-","").slice(0,10);
  const schema="pa05_j4f_"+id,hostId="read-host-a";
  const operator="pa05_j4f_operator_"+id;
  const worker="pa05_j4f_worker_"+id;
  const password=randomUUID().replaceAll("-","");
  const dir=mkdtempSync(join(tmpdir(),"pa05-j4f-"));
  const file=join(dir,"state.json");
  const root=postgres(url,{max:2,prepare:false});
  let authority;
  const current=()=>createFileLifecycleStore(file).snapshot();
  const isInstalled=()=>current().installedPackages.some(x=>x.packageId===owner);
  const sameBytes=before=>assert.equal(readFileSync(file,"utf8"),before);
  try{
    await root.unsafe('CREATE SCHEMA "'+schema+'"');
    for(const role of [operator,worker])
      await root.unsafe('CREATE ROLE "'+role+
        '" LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD \''+
        password+"'");
    await root.unsafe('CREATE TABLE "'+schema+
      '".pa05_read_lifecycle_operators(login_role name PRIMARY KEY,'+
      'host_id text NOT NULL,enabled boolean NOT NULL)');
    await root.unsafe('INSERT INTO "'+schema+
      '".pa05_read_lifecycle_operators VALUES($1,$2,true)',[operator,hostId]);
    await root.unsafe('CREATE TABLE "'+schema+
      '".pa05_read_owner_epoch(owner_package_id text PRIMARY KEY,'+
      'epoch bigint NOT NULL)');
    await root.unsafe('INSERT INTO "'+schema+
      '".pa05_read_owner_epoch VALUES($1,1)',[owner]);
    await root.unsafe('CREATE TABLE "'+schema+
      '".pa05_read_host_activation_epoch(owner_package_id text NOT NULL,'+
      'host_id text NOT NULL,approved_epoch bigint NOT NULL,'+
      'PRIMARY KEY(owner_package_id,host_id))');
    await root.unsafe('INSERT INTO "'+schema+
      '".pa05_read_host_activation_epoch VALUES($1,$2,1)',[owner,hostId]);
    await root.unsafe('CREATE TABLE "'+schema+
      '".pa05_read_lifecycle_intents(operation_id text PRIMARY KEY,'+
      'owner_package_id text NOT NULL,host_id text NOT NULL,'+
      "expected_epoch bigint NOT NULL,state text NOT NULL CHECK(state IN ('FENCED','COMPLETE')),"+
      "operation text NOT NULL CHECK(operation IN ('DISABLE','UNINSTALL')))");
    for(const fixture of ["pa05-e01j4e-operator-function.sql",
      "pa05-e01j4f-pending-recovery.sql"]){
      const source=readFileSync(new URL("./fixtures/"+fixture,import.meta.url),"utf8");
      await root.unsafe(source.replaceAll("__PA05_SCHEMA__",schema));
    }
    const func1='"'+schema+
      '".pa05_read_lifecycle_operator_transition(text,text,text,text)';
    const func2='"'+schema+'".pa05_read_lifecycle_operator_pending(text)';
    for(const f of [func1,func2]){
      await root.unsafe("REVOKE ALL ON FUNCTION "+f+" FROM PUBLIC");
      await root.unsafe('GRANT EXECUTE ON FUNCTION '+f+' TO "'+operator+'"');
    }
    await root.unsafe('GRANT USAGE ON SCHEMA "'+schema+'" TO "'+operator+'"');
    await root.unsafe('GRANT USAGE ON SCHEMA "'+schema+'" TO "'+worker+'"');
    const roleUrl=new URL(url);roleUrl.username=operator;roleUrl.password=password;
    const operatorUrl=roleUrl.toString();
    const workerUrl=new URL(url);
    workerUrl.username=worker;workerUrl.password=password;
    const dbArgs={
      PA05_J4F_TEST_DATABASE_URL:operatorUrl,
      PA05_J4F_TEST_SCHEMA:schema,
      PA05_J4F_TEST_HOST_ID:hostId
    };
    const manager=createAppManagerService(createPackageCatalog([
      tradingReferencePackageV010,purchaseAttentionPackageV010
    ]),createFileLifecycleStore(file));
    manager.install(owner);
    assert.equal(isInstalled(),true);
    const before=readFileSync(file,"utf8");
    const bootBefore=await childResult(file,{},true);
    assert.equal(bootBefore.served,false);
    assert.match(bootBefore.output,
      /PA05_E01I_RESTORED_READ_OWNER_RECERTIFICATION_REQUIRED/);
    sameBytes(before);
    const noApproval=await childResult(file,{...dbArgs});
    assert.notEqual(noApproval.code,0);
    assert.match(noApproval.output,/PA05_READ_PRESTART_RECOVERY_OPERATOR_DENIED/);
    sameBytes(before);
    const preFence=await childResult(file,{
      ...dbArgs,PA05_J4F_TEST_AUTHORIZED:"explicit-test-only-yes"
    });
    assert.notEqual(preFence.code,0);
    assert.match(preFence.output,/PA05_READ_LIFECYCLE_SQL_NOT_FENCED/);
    sameBytes(before);
    const roleConn=postgres(operatorUrl,{max:1,prepare:false});
    authority=createPa05ReadLifecyclePgAuthorityV010({
      connectionString:operatorUrl,schema,hostId
    });
    const other=postgres(workerUrl.toString(),{max:1,prepare:false});
    try{
      await assert.rejects(other.unsafe('SELECT * FROM "'+schema+
        '".pa05_read_lifecycle_operator_pending($1)',[hostId]),
        /permission denied/);
      await assert.rejects(other.unsafe('UPDATE "'+schema+
        '".pa05_read_lifecycle_intents SET state=$1',["COMPLETE"]),
        /permission denied/);
      await authority.fence({
        operationId:"j4f-disable-"+id,operation:"DISABLE",packageId:owner
      });
      const wrongKind=await childResult(file,{
        ...dbArgs,PA05_J4F_TEST_AUTHORIZED:"explicit-test-only-yes"
      });
      assert.match(wrongKind.output,/PA05_READ_PRESTART_RECOVERY_UNINSTALL_REQUIRED/);
      sameBytes(before);
      // Separate disposable DBA resets previous negative DISABLE fixture and
      // reattests for the intended standalone UNINSTALL recovery scenario.
      await root.unsafe('UPDATE "'+schema+
        '".pa05_read_lifecycle_intents SET state=$1 WHERE operation=$2',
        ["COMPLETE","DISABLE"]);
      await root.unsafe('UPDATE "'+schema+
        '".pa05_read_host_activation_epoch SET approved_epoch=1');
      await authority.fence({
        operationId:"j4f-uninstall-"+id,operation:"UNINSTALL",packageId:owner
      });
      // A spoofed role connection Host ID is not enough to list an intent.
      const spoofed=await childResult(file,{
        ...dbArgs,PA05_J4F_TEST_HOST_ID:"read-host-b",
        PA05_J4F_TEST_AUTHORIZED:"explicit-test-only-yes"
      });
      assert.match(spoofed.output,/PA05_READ_LIFECYCLE_SQL_OPERATOR_NOT_TRUSTED/);
      sameBytes(before);
      // Simulate conflicting central operation (DBA only); fail closed.
      await root.unsafe('INSERT INTO "'+schema+
        '".pa05_read_lifecycle_intents VALUES($1,$2,$3,$4,$5,$6)',[
        "j4f-conflict-"+id,owner,hostId,1,"FENCED","UNINSTALL"
      ]);
      const ambiguous=await childResult(file,{
        ...dbArgs,PA05_J4F_TEST_AUTHORIZED:"explicit-test-only-yes"
      });
      assert.match(ambiguous.output,/PA05_READ_LIFECYCLE_PENDING_AMBIGUOUS/);
      sameBytes(before);
      await root.unsafe('UPDATE "'+schema+
        '".pa05_read_lifecycle_intents SET state=$1 WHERE operation_id=$2',[
        "COMPLETE","j4f-conflict-"+id
      ]);
      const stillDenied=await childResult(file,{},true);
      assert.equal(stillDenied.served,false);
      sameBytes(before);
      // SIGKILL after original JSON UNINSTALL but BEFORE SQL COMPLETE.
      const killed=await childResult(file,{
        ...dbArgs,PA05_J4F_TEST_AUTHORIZED:"explicit-test-only-yes",
        PA05_J4F_TEST_CRASH_BEFORE_COMPLETE:"1"
      });
      assert.equal(killed.signal,"SIGKILL");
      assert.equal(isInstalled(),false);
      assert.equal((await root.unsafe('SELECT state FROM "'+schema+
        '".pa05_read_lifecycle_intents WHERE operation_id=$1',[
        "j4f-uninstall-"+id
      ]))[0].state,"FENCED");
      // The second operator process observes already-mutated file, verifies
      // same SQL fence and marks COMPLETE idempotently (never reinstall).
      const repaired=await childResult(file,{
        ...dbArgs,PA05_J4F_TEST_AUTHORIZED:"explicit-test-only-yes"
      });
      assert.equal(repaired.code,0,repaired.output);
      assert.match(repaired.output,/"installed":false/);
      assert.equal((await root.unsafe('SELECT state FROM "'+schema+
        '".pa05_read_lifecycle_intents WHERE operation_id=$1',[
        "j4f-uninstall-"+id
      ]))[0].state,"COMPLETE");
      const repeat=await childResult(file,{
        ...dbArgs,PA05_J4F_TEST_AUTHORIZED:"explicit-test-only-yes"
      });
      assert.notEqual(repeat.code,0);
      assert.match(repeat.output,/PA05_READ_PRESTART_RECOVERY_NO_DB_FENCE/);
      assert.equal(isInstalled(),false);
      // E01J4G: reuse J4F PostgreSQL functions, but require an independently
      // checked request-bound HUMAN Session, Host-scoped policy and secret
      // resolver before any actual second local UNINSTALL.
      const j4gManager=createAppManagerService(createPackageCatalog([tradingReferencePackageV010,purchaseAttentionPackageV010]),createFileLifecycleStore(file));
      j4gManager.install(owner);
      assert.equal(isInstalled(),true);
      const j4gBefore=readFileSync(file,"utf8");
      await root.unsafe('UPDATE "'+schema+
        '".pa05_read_host_activation_epoch SET approved_epoch=1');
      await authority.fence({
        operationId:"j4g-uninstall-"+id,operation:"UNINSTALL",packageId:owner
      });
      const j4gToken="test-only-session-"+id;
      const j4gSubject="human:recovery-operator-"+id;
      const identity=createHostBearerSessionProviderV010([{
        token:j4gToken,session:{
          contractVersion:"0.1.0",sessionId:"j4g-session-"+id,
          principal:{contractVersion:"0.1.0",subjectId:j4gSubject,
            actorType:"HUMAN",identityProviderId:"disposable-test-provider"},
          issuedAt:new Date(Date.now()-10000).toISOString(),
          expiresAt:new Date(Date.now()+120000).toISOString()
        }
      }]);
      const policy=createHostStaticAuthorizationProviderV010({
        contractVersion:"0.1.0",rules:[{
          id:"j4g-exact-host-"+id,effect:"ALLOW",
          actions:["host.plugin.lifecycle.prestartup-uninstall-recovery"],
          subjectIds:[j4gSubject],actorTypes:["HUMAN"],
          resourceTypes:["plugin-host-lifecycle"],
          resourceIds:[owner+"@"+hostId]
        }]
      });
      const store=createMemorySecretStoreV010();
      store.put({
        contractVersion:"0.1.0",namespace:"pa05-read-lifecycle",
        key:"operatorDatabaseUrl",scope:"INSTALLATION",scopeId:hostId
      },operatorUrl);
      const secrets=createHostEncryptedSecretsProviderV010(store);
      const j4gAudit=[];
      const params={
        mode:"OPT_IN",hostId,schema,manager:j4gManager,
        sessionProvider:identity,authorizationProvider:policy,
        secretsProvider:secrets,
        audit:async event=>{j4gAudit.push(event);}
      };
      await assert.rejects(
        recoverPa05TrustedPrestartupUninstallV010({
          ...params,bearerToken:"not-authorized"
        }),/PA05_J4G_OPERATOR_DENIED/);
      sameBytes(j4gBefore);
      const authenticated=await recoverPa05TrustedPrestartupUninstallV010({
        ...params,bearerToken:j4gToken
      });
      assert.equal(authenticated.installedPackages.some(x=>x.packageId===owner),false);
      assert.deepEqual(j4gAudit.map(x=>x.stage),["AUTHORIZED","COMPLETED"]);
      assert.equal((await root.unsafe('SELECT state FROM "'+schema+
        '".pa05_read_lifecycle_intents WHERE operation_id=$1',[
          "j4g-uninstall-"+id
        ]))[0].state,"COMPLETE");
      assert.equal((await root.unsafe('SELECT approved_epoch FROM "'+schema+
        '".pa05_read_host_activation_epoch'))[0].approved_epoch,"0");
      console.log("PA05_E01J4G_TRUSTED_SQL_RECOVERY_PG="+JSON.stringify({
        actualPostgresql18:true,hostBoundAuthenticatedHumanSession:true,
        authorizationProviderRequired:true,
        scopedSecretResolvedWithoutSqlUrlInAudit:true,
        originalAppManagerUninstalledOnlyAfterDbFence:true,
        centralReadStillRevoked:true,
        auditStages:["AUTHORIZED","COMPLETED"],
        originalE01iUnchanged:true,
        productionOperatorIdentityCertified:false,
        productionSecretsProvisioned:false,
        maintenanceCliDelivered:false,
        multiWorkerAtomicityCertified:false,
        pa05Signed:false
      }));
      const bootAfter=await childResult(file,{},true);
      assert.equal(bootAfter.served,true,bootAfter.output);
      assert.equal((await root.unsafe('SELECT approved_epoch FROM "'+schema+
        '".pa05_read_host_activation_epoch'))[0].approved_epoch,"0");
      console.log("PA05_E01J4F_PRESTART_RECOVERY_PG="+JSON.stringify({
        actualPostgresql18:true,realHostE01iRejectedBeforeRepair:true,
        requiresExplicitOperatorDecision:true,
        noDbFenceDenies:true,disableIntentCannotAuthorizeUninstall:true,
        wrongSqlHostCannotEnumeratePending:true,
        workerCannotQueryOrCompleteCentralIntent:true,
        ambiguousPendingIntentsDenied:true,
        actualOsCrashAfterLocalUninstallBeforeComplete:true,
        differentOsProcessFinalizedCentralIntent:true,
        duplicateRepairNoAutomaticSideEffect:true,
        realHostBootedAfterClearedState:true,
        centralApprovalRemainedFenced:true,
        defaultServerQuarantineUnmodified:true,
        actualProductionOperatorIdentityCertified:false,
        productionRepairCommandWired:false,
        productionSecretsProvisioned:false,
        multiWorkerAtomicityCertified:false,
        pa05Signed:false
      }));
    }finally{
      await Promise.allSettled([roleConn.end({timeout:1}),
        other.end({timeout:1})]);
    }
  }finally{
    await authority?.close().catch(()=>{});
    await root.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE').catch(()=>{});
    for(const role of [operator,worker])
      await root.unsafe('DROP ROLE IF EXISTS "'+role+'"').catch(()=>{});
    await root.end({timeout:1});
    rmSync(dir,{recursive:true,force:true});
  }
});
