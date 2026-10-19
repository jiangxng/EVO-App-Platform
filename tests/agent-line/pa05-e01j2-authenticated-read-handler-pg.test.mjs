import test from "node:test";
import assert from "node:assert/strict";
import {fork} from "node:child_process";
import {randomUUID} from "node:crypto";
import {mkdtempSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import postgres from "postgres";
import {createPa05TcpCutLinkV010} from "./fixtures/pa05-e01j3-tcp-link.mjs";
import {createPa05SharedReadOwnerGateV010}
  from "../../dist/manager/pa05-read-owner-shared-sql-gate.js";
import {createPa05AuthenticatedReadHostV010}
  from "../../dist/manager/pa05-read-owner-authenticated-host.js";

const authorityUrl=process.env.PA05_XDB_AUTHORITY_DATABASE_URL;
const workerScript=fileURLToPath(new URL("./fixtures/pa05-e01j2-host-worker.mjs",import.meta.url));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function reply(child,type,ms=20000){
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{cleanup();reject(Error("PA05_E01J2_TIMEOUT:"+type));},ms);
    const onMsg=m=>{if(m?.type===type){cleanup();resolve(m);}};
    const onExit=code=>{cleanup();reject(Error("PA05_E01J2_EXIT:"+code+":"+type+":"+child.lastError));};
    function cleanup(){clearTimeout(timer);child.off("message",onMsg);child.off("exit",onExit);}
    child.on("message",onMsg);child.once("exit",onExit);
  });
}
function connectionForRole(url,role,password){
  const parsed=new URL(url);
  parsed.username=role;parsed.password=password;
  return parsed.toString();
}
function start(roleUrl,schema,stateFile){
  const child=fork(workerScript,[],{
    stdio:["ignore","pipe","pipe","ipc"],cwd:process.cwd(),
    env:{PATH:process.env.PATH??"",HOME:process.env.RUNNER_TEMP??"/tmp",
      PA05_E01J2_HOST_SQL_URL:roleUrl,PA05_E01J2_SCHEMA:schema,
      ...(stateFile?{PA05_E01J4_STATE_FILE:stateFile}:{})}
  });
  child.stderr.on("data",b=>{child.lastError=(child.lastError??"")+String(b);});
  return child;
}
async function stop(child){
  if(!child||child.exitCode!==null||child.signalCode!==null)return;
  if(child.connected){
    const done=reply(child,"closed",1500).catch(()=>null);
    try{child.send({type:"close"});}catch{/* OS child already dead */}
    await done;
  }
  if(child.exitCode===null&&child.signalCode===null){
    child.kill("SIGTERM");
    await Promise.race([new Promise(resolve=>child.once("exit",resolve)),delay(800)]);
    if(child.exitCode===null&&child.signalCode===null)child.kill("SIGKILL");
  }
}
function assertBusiness(result,host){
  assert.equal(result.value.verifiedHostId,host);
  assert.equal(result.value.answer.summaryId,"purchase.attention.read");
  assert.deepEqual(result.value.answer.attentionFlags,
    ["RECEIVE_PENDING","PAYMENT_PENDING"]);
  assert.equal(result.value.answer.pendingPurchaseQuantity,2);
  assert.equal(result.value.answer.payableAmount,15);
}
test("E01J2 real PG18 session_user Host identity + least privilege + original READ Handler",{
  skip:!authorityUrl?"real PostgreSQL18 authority required":false,
  timeout:120000
},async t=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,10);
  const schema="pa05_e01j2_"+suffix;
  const roleA="pa05_j2_a_"+suffix, roleB="pa05_j2_b_"+suffix;
  const roleWorker="pa05_j2_worker_"+suffix;
  const passwordA=randomUUID().replaceAll("-","");
  const passwordB=randomUUID().replaceAll("-","");
  const passwordW=randomUUID().replaceAll("-","");
  const root=postgres(authorityUrl,{max:4,prepare:false});
  let admin,hostA,hostB;
  const granted=[];
  try {
    admin=await createPa05SharedReadOwnerGateV010({
      connectionString:authorityUrl,schema,
      ownerPackageId:"evo-purchase-attention",
      trustedHostIds:["read-host-a","read-host-b"]
    });
    // The provisioner is the existing disposable PG18 DBA, NEVER a Worker.
    for(const [role,password] of [
      [roleA,passwordA],[roleB,passwordB],[roleWorker,passwordW]
    ]){
      await root.unsafe('CREATE ROLE "'+role+
        '" LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD \''+password+'\'');
      granted.push(role);
    }
    await root.unsafe('CREATE TABLE "'+schema+'".pa05_read_host_principals ('+
      'owner_package_id text NOT NULL, host_id text NOT NULL, '+
      'login_role name UNIQUE NOT NULL, '+
      'PRIMARY KEY (owner_package_id,host_id))');
    await root.unsafe('INSERT INTO "'+schema+
      '".pa05_read_host_principals(owner_package_id,host_id,login_role) VALUES '+
      '($1,$2,$3),($1,$4,$5)',[
        "evo-purchase-attention","read-host-a",roleA,"read-host-b",roleB
      ]);
    // SECURITY DEFINER has a fixed search_path and fully qualified tables.
    // session_user is established by PostgreSQL authentication, not a GUC,
    // JSON hostId, application_name or non-superuser SET ROLE.
    await root.unsafe(`CREATE FUNCTION "${schema}".pa05_assert_authenticated_host_read(p_epoch bigint)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $pa05_fn$
DECLARE
  v_host text;
  v_epoch bigint;
  v_state text;
BEGIN
  SELECT p.host_id INTO v_host
    FROM "${schema}".pa05_read_host_principals AS p
    JOIN "${schema}".pa05_read_trusted_hosts AS h
      ON h.owner_package_id=p.owner_package_id AND h.host_id=p.host_id
    WHERE p.owner_package_id='evo-purchase-attention'
      AND p.login_role=session_user
    FOR SHARE OF p,h;
  IF v_host IS NULL THEN
    RAISE EXCEPTION 'PA05_READ_SQL_HOST_NOT_TRUSTED' USING ERRCODE='42501';
  END IF;
  SELECT epoch,state INTO v_epoch,v_state
    FROM "${schema}".pa05_read_owner_epoch
    WHERE owner_package_id='evo-purchase-attention' FOR SHARE;
  IF v_state IS DISTINCT FROM 'ACTIVE' OR v_epoch IS DISTINCT FROM p_epoch THEN
    RAISE EXCEPTION 'PA05_READ_SQL_ADMISSION_DENIED' USING ERRCODE='42501';
  END IF;
  RETURN v_host;
END
$pa05_fn$`);
    await root.unsafe('REVOKE ALL ON SCHEMA "'+schema+'" FROM PUBLIC');
    await root.unsafe('REVOKE ALL ON FUNCTION "'+schema+
      '".pa05_assert_authenticated_host_read(bigint) FROM PUBLIC');
    for(const role of [roleA,roleB]){
      await root.unsafe('GRANT USAGE ON SCHEMA "'+schema+'" TO "'+role+'"');
      await root.unsafe('GRANT EXECUTE ON FUNCTION "'+schema+
        '".pa05_assert_authenticated_host_read(bigint) TO "'+role+'"');
    }
    const urlA=connectionForRole(authorityUrl,roleA,passwordA);
    const urlB=connectionForRole(authorityUrl,roleB,passwordB);
    const urlW=connectionForRole(authorityUrl,roleWorker,passwordW);
    const sqlA=postgres(urlA,{max:1,prepare:false});
    const sqlB=postgres(urlB,{max:1,prepare:false});
    const sqlWorker=postgres(urlW,{max:1,prepare:false});
    try{
      assert.equal((await sqlA.unsafe("SELECT session_user AS actor"))[0].actor,roleA);
      assert.equal((await sqlB.unsafe("SELECT session_user AS actor"))[0].actor,roleB);
      await assert.rejects(sqlWorker.unsafe('SELECT "'+schema+
        '".pa05_assert_authenticated_host_read(1)'),/permission denied/);
      await assert.rejects(sqlA.unsafe('UPDATE "'+schema+
        '".pa05_read_owner_epoch SET epoch=900'),/permission denied/);
      await assert.rejects(sqlA.unsafe('INSERT INTO "'+schema+
        '".pa05_read_trusted_hosts VALUES ($1,$2)',[
          "evo-purchase-attention","imposter"
        ]),/permission denied/);
      await assert.rejects(sqlB.unsafe('SET ROLE "'+roleA+'"'),/permission denied/);
      await assert.rejects(sqlA.unsafe('SET SESSION AUTHORIZATION "'+roleB+'"'),
        /permission denied/);
      await sqlA.unsafe("SELECT set_config('pa05.host_id','read-host-b',false)");
      await sqlA.unsafe("SET application_name='read-host-b'");
      assert.equal(await admin.certify({
        expectedEpoch:1,async trustedOperatorApproved(){return true;}
      }),2);
      const fromDb=await sqlA.unsafe('SELECT "'+schema+
        '".pa05_assert_authenticated_host_read(2) AS host_id');
      assert.equal(fromDb[0].host_id,"read-host-a",
        "spoofed client GUC/application_name must not change session identity");
      hostA=start(urlA,schema);
      hostB=start(urlB,schema);
      await Promise.all([reply(hostA,"ready"),reply(hostB,"ready")]);
      assert.notEqual(hostA.pid,hostB.pid);
      const first=reply(hostA,"readResult");hostA.send({type:"read",epoch:2});
      assertBusiness(await first,"read-host-a");
      const second=reply(hostB,"readResult");hostB.send({type:"read",epoch:2});
      assertBusiness(await second,"read-host-b");

      // A real business Source Owner reader is held under the central lock.
      const held=reply(hostA,"held");hostA.send({type:"hold",epoch:2});
      const heldMsg=await held;
      assert.ok(heldMsg.backendPid>0);
      let committed=false;
      const revoking=admin.revoke(2).then(epoch=>{committed=true;return epoch;});
      await delay(250);
      assert.equal(committed,false,"DBA revoke must wait for in-flight actual Handler");
      const completed=reply(hostA,"readResult");
      hostA.send({type:"release"});
      assertBusiness(await completed,"read-host-a");
      assert.equal(await revoking,3);
      assert.deepEqual(await admin.getEpoch(),{epoch:3,state:"FROZEN"});
      const oldA=reply(hostA,"readDenied");hostA.send({type:"read",epoch:2});
      assert.match((await oldA).message,/PA05_READ_SQL_ADMISSION_DENIED/);
      const oldB=reply(hostB,"readDenied");hostB.send({type:"read",epoch:2});
      assert.match((await oldB).message,/PA05_READ_SQL_ADMISSION_DENIED/);
      assert.equal(await admin.certify({
        expectedEpoch:3,async trustedOperatorApproved(){return true;}
      }),4);
      // Revoke SQL EXECUTE while Worker A's authenticated backend remains alive.
      await root.unsafe('REVOKE EXECUTE ON FUNCTION "'+schema+
        '".pa05_assert_authenticated_host_read(bigint) FROM "'+roleA+'"');
      const revokedA=reply(hostA,"readDenied");hostA.send({type:"read",epoch:4});
      assert.match((await revokedA).message,/permission denied/);
      const survivor=reply(hostB,"readResult");hostB.send({type:"read",epoch:4});
      assertBusiness(await survivor,"read-host-b");

      // Terminate actual PG backend while original READ Handler is mid-call:
      // no result may escape a failed COMMIT; this is NOT a full network partition.
      const busy=reply(hostB,"held");hostB.send({type:"terminate",epoch:4});
      const {backendPid}=await busy;
      assert.equal((await root.unsafe(
        "SELECT pg_terminate_backend($1::integer) AS killed",[backendPid]
      ))[0].killed,true);
      const broken=reply(hostB,"readDenied");
      hostB.send({type:"release"});
      assert.match((await broken).message,/terminat|connection|closed|CONNECTION|backend|cancel|transaction/i);
      const recovered=reply(hostB,"readResult");hostB.send({type:"read",epoch:4});
      assertBusiness(await recovered,"read-host-b");
      const disabled=reply(hostB,"disabled");hostB.send({type:"disable"});await disabled;
      const deniedByAppManager=reply(hostB,"readDenied");
      hostB.send({type:"read",epoch:4});
      assert.match((await deniedByAppManager).message,/ACTION_FEATURE_NOT_ACTIVE/);
      await t.test("E01J3 physical TCP cut during original Purchase Attention READ, revoke and recover",{
        timeout:48000
      },async()=>{
        const proxy=await createPa05TcpCutLinkV010(authorityUrl);
        const proxied=new URL(urlB);
        proxied.hostname="127.0.0.1";
        proxied.port=String(proxy.port);
        let partitionHost,offlineHost;
        let resultLeaked=false;
        let workerExitAfterCut=false;
        const observe=m=>{if(m?.type==="readResult")resultLeaked=true;};
        try{
          partitionHost=start(proxied.toString(),schema);
          partitionHost.on("message",observe);
          await reply(partitionHost,"ready");
          const held=reply(partitionHost,"held");
          partitionHost.send({type:"hold",epoch:4});
          const {backendPid,pid}=await held;
          assert.equal(pid,partitionHost.pid);
          const active=await root.unsafe(
            "SELECT usename FROM pg_stat_activity WHERE pid=$1::integer",
            [backendPid]
          );
          assert.equal(active.length,1);
          assert.equal(active[0].usename,roleB);
          assert.ok(proxy.accepted>=1);
          // Either an ordinary SQL rejection OR a crashed isolated worker
          // must fail closed. Current postgres.js can fatally dereference its
          // closed socket while queuing COMMIT; never fake graceful recovery.
          const terminal=new Promise((resolve,reject)=>{
            const timer=setTimeout(()=>{cleanup();reject(Error("PA05_E01J3_TERMINAL_TIMEOUT"));},15000);
            const onMessage=m=>{
              if(m?.type==="readDenied"){cleanup();resolve({kind:"denied",message:m.message});}
              if(m?.type==="readResult"){cleanup();reject(Error("PA05_E01J3_RESULT_LEAKED"));}
            };
            const onExit=(code,signal)=>{
              cleanup();resolve({kind:"crashed",code,signal,error:partitionHost.lastError});
            };
            function cleanup(){
              clearTimeout(timer);
              partitionHost.off("message",onMessage);
              partitionHost.off("exit",onExit);
            }
            partitionHost.on("message",onMessage);
            partitionHost.once("exit",onExit);
          });
          // This closes ACTUAL Host->PostgreSQL TCP sockets, not an in-process
          // fake callback or DBA pg_terminate_backend. Other Host/DBA
          // connections stay healthy throughout the interrupted READ.
          const severed=proxy.cut();
          assert.ok(severed>=1,"no authenticated PG transport severed");
          // The SQL transaction loses its remote session, releasing its lock.
          // DBA revoke may then freeze the epoch while JS source READ is held.
          assert.equal(await admin.revoke(4),5);
          assert.deepEqual(await admin.getEpoch(),{epoch:5,state:"FROZEN"});
          if(partitionHost.connected){
            try{partitionHost.send({type:"release"});}catch{/* child already exited */}
          }
          const outcome=await terminal;
          if(outcome.kind==="crashed"){
            workerExitAfterCut=true;
            assert.notEqual(outcome.code,0,"transport-fault crash reported successful exit");
            assert.match(String(outcome.error),
              /Cannot read properties of null|socket|connection|write|ERR_/i);
          }else{
            assert.match(outcome.message,
              /connection|closed|CONNECTION|terminat|socket|network|transaction|write|read/i);
          }
          assert.equal(resultLeaked,false,"business result escaped a severed SQL transaction");
          // A new supervised child is the conservative recovery path. This
          // does NOT claim the original Host worker survives a TCP fault.
          offlineHost=start(proxied.toString(),schema);
          await reply(offlineHost,"ready");
          const down=reply(offlineHost,"readDenied");
          offlineHost.send({type:"read",epoch:5});
          await down;
          assert.equal(resultLeaked,false,"offline central SQL yielded a business result");

          proxy.restore();
          const stale=reply(offlineHost,"readDenied");
          offlineHost.send({type:"read",epoch:4});
          assert.match((await stale).message,/PA05_READ_SQL_ADMISSION_DENIED/);
          const frozen=reply(offlineHost,"readDenied");
          offlineHost.send({type:"read",epoch:5});
          assert.match((await frozen).message,/PA05_READ_SQL_ADMISSION_DENIED/);
          assert.equal(await admin.certify({
            expectedEpoch:5,async trustedOperatorApproved(){return true;}
          }),6);
          const recovered=reply(offlineHost,"readResult");
          offlineHost.send({type:"read",epoch:6});
          assertBusiness(await recovered,"read-host-b");
          // A surviving independent Host must independently reacquire epoch 6.
          const oldOther=reply(hostB,"readDenied");
          hostB.send({type:"read",epoch:4});
          assert.match((await oldOther).message,/PA05_READ_SQL_ADMISSION_DENIED/);
          console.log("PA05_E01J3_INFLIGHT_TCP_PARTITION_PG="+JSON.stringify({
            actualPostgresql18:true,
            authenticatedHostSqlSessionThroughRealTcp:true,
            cutOccurredDuringOriginalBusinessRead:true,
            originalBusinessResultNeverEscapedCut:true,
            independentCentralDbaRevocationCommitted:true,
            localFallbackDuringCut:false,
            staleEpochDeniedAfterTcpRecovery:true,
            frozenEpochDeniedAfterTcpRecovery:true,
            explicitRecertificationAllowsOnlyNewEpoch:true,
            survivingWorkerMustRecheckEpoch:true,
            isolatedWorkerCrashedOnTcpFault:workerExitAfterCut,
            originalWorkerGracefulTransportRecoveryCertified:false,
            supervisedFreshWorkerRecovered:true,
            silentPacketBlackholeCertified:false,
            automaticAppManagerCrossStoreAtomicity:false,
            liveProductionTransportCertified:false,
            productionWriteEnabled:false,
            pa05Signed:false
          }));
        }finally{
          if(partitionHost)partitionHost.off("message",observe);
          await Promise.allSettled([stop(partitionHost),stop(offlineHost)]);
          await proxy.close();
        }
      });

      await t.test("E01J4 isolate two persisted AppManagers against central Host reattestation",{
        timeout:55000
      },async()=>{
        const storage=mkdtempSync(join(tmpdir(),"pa05-e01j4-"));
        const fileA=join(storage,"host-a.json");
        const fileB=join(storage,"host-b.json");
        let durableA,durableB,restartedB;
        try{
          // The real DBA owns this opt-in authority; no Worker receives DDL
          // or permission to write approvals. E01J3 ended ACTIVE at epoch 6.
          assert.deepEqual(await admin.getEpoch(),{epoch:6,state:"ACTIVE"});
          await root.unsafe('CREATE TABLE "'+schema+
            '".pa05_read_host_activation_epoch ('+
            'owner_package_id text NOT NULL, host_id text NOT NULL, '+
            'approved_epoch bigint NOT NULL CHECK(approved_epoch>=1), '+
            'PRIMARY KEY(owner_package_id,host_id))');
          await root.unsafe('INSERT INTO "'+schema+
            '".pa05_read_host_activation_epoch VALUES '+
            '($1,$2,$3),($1,$4,$3)',[
              "evo-purchase-attention","read-host-a",6,"read-host-b"
            ]);
          // The original function permissions remain role-scoped; the extra
          // approval check is inside the same SQL transaction as the READ.
          await root.unsafe(`CREATE OR REPLACE FUNCTION "${schema}".
pa05_assert_authenticated_host_read(p_epoch bigint)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,pg_temp
AS $pa05_j4$
DECLARE
  v_host text;
  v_epoch bigint;
  v_state text;
  v_approved bigint;
BEGIN
  SELECT p.host_id INTO v_host
  FROM "${schema}".pa05_read_host_principals AS p
  JOIN "${schema}".pa05_read_trusted_hosts AS h
    ON h.owner_package_id=p.owner_package_id AND h.host_id=p.host_id
  WHERE p.owner_package_id='evo-purchase-attention'
    AND p.login_role=session_user
  FOR SHARE OF p,h;
  IF v_host IS NULL THEN
    RAISE EXCEPTION 'PA05_READ_SQL_HOST_NOT_TRUSTED' USING ERRCODE='42501';
  END IF;
  SELECT epoch,state INTO v_epoch,v_state
  FROM "${schema}".pa05_read_owner_epoch
  WHERE owner_package_id='evo-purchase-attention' FOR SHARE;
  IF v_state IS DISTINCT FROM 'ACTIVE' OR v_epoch IS DISTINCT FROM p_epoch THEN
    RAISE EXCEPTION 'PA05_READ_SQL_ADMISSION_DENIED' USING ERRCODE='42501';
  END IF;
  SELECT approved_epoch INTO v_approved
  FROM "${schema}".pa05_read_host_activation_epoch
  WHERE owner_package_id='evo-purchase-attention' AND host_id=v_host FOR SHARE;
  IF v_approved IS DISTINCT FROM v_epoch THEN
    RAISE EXCEPTION 'PA05_READ_SQL_HOST_REATTEST_REQUIRED' USING ERRCODE='42501';
  END IF;
  RETURN v_host;
END
$pa05_j4$`);
          await root.unsafe('GRANT EXECUTE ON FUNCTION "'+schema+
            '".pa05_assert_authenticated_host_read(bigint) TO "'+roleA+'"');
          await assert.rejects(sqlB.unsafe('UPDATE "'+schema+
            '".pa05_read_host_activation_epoch SET approved_epoch=999'),
            /permission denied/);

          durableA=start(urlA,schema,fileA);
          durableB=start(urlB,schema,fileB);
          await Promise.all([reply(durableA,"ready"),reply(durableB,"ready")]);
          assert.notEqual(durableA.pid,durableB.pid);
          const positiveA=reply(durableA,"readResult");
          durableA.send({type:"read",epoch:6});
          assertBusiness(await positiveA,"read-host-a");
          const positiveB=reply(durableB,"readResult");
          durableB.send({type:"read",epoch:6});
          assertBusiness(await positiveB,"read-host-b");
          const stateA=reply(durableA,"localState");
          durableA.send({type:"snapshot"});
          assert.equal((await stateA).active,true);
          const stateB=reply(durableB,"localState");
          durableB.send({type:"snapshot"});
          assert.equal((await stateB).active,true);

          // Freeze central authority BEFORE changing only local A. B is
          // left ACTIVE in a different persisted JSON file, then crashes.
          assert.equal(await admin.revoke(6),7);
          const localDisable=reply(durableA,"disabled");
          durableA.send({type:"disable"});
          await localDisable;
          const disabledState=reply(durableA,"localState");
          durableA.send({type:"snapshot"});
          assert.equal((await disabledState).active,false);
          assert.equal(JSON.parse(readFileSync(fileB,"utf8")).activeFeatures
            .some(f=>f.featureId==="evo-purchase-attention.default"),true);
          const dead=new Promise(resolve=>durableB.once("exit",resolve));
          durableB.kill("SIGKILL");
          await dead;
          restartedB=start(urlB,schema,fileB);
          await reply(restartedB,"ready");
          const restored=reply(restartedB,"localState");
          restartedB.send({type:"snapshot"});
          assert.deepEqual(
            {installed:(await restored).installed},
            {installed:true}
          );
          const stillActive=reply(restartedB,"localState");
          restartedB.send({type:"snapshot"});
          assert.equal((await stillActive).active,true);
          const deniedOld=reply(restartedB,"readDenied");
          restartedB.send({type:"read",epoch:6});
          assert.match((await deniedOld).message,/PA05_READ_SQL_ADMISSION_DENIED/);
          const deniedFrozen=reply(restartedB,"readDenied");
          restartedB.send({type:"read",epoch:7});
          assert.match((await deniedFrozen).message,/PA05_READ_SQL_ADMISSION_DENIED/);

          // Global recertification does NOT automatically trust each
          // persisted local AppManager installation from the previous epoch.
          assert.equal(await admin.certify({
            expectedEpoch:7,async trustedOperatorApproved(){return true;}
          }),8);
          const pendingB=reply(restartedB,"readDenied");
          restartedB.send({type:"read",epoch:8});
          assert.match((await pendingB).message,
            /PA05_READ_SQL_HOST_REATTEST_REQUIRED/);
          const pendingA=reply(durableA,"readDenied");
          durableA.send({type:"read",epoch:8});
          assert.match((await pendingA).message,
            /PA05_READ_SQL_HOST_REATTEST_REQUIRED/);
          // Only the isolated DBA may mark A re-attested, after explicitly
          // checking its local inactive state and re-enabling via AppManager.
          const checkedA=reply(durableA,"localState");
          durableA.send({type:"snapshot"});
          assert.equal((await checkedA).active,false);
          const reenabled=reply(durableA,"enabled");
          durableA.send({type:"enable"});
          await reenabled;
          await root.unsafe('UPDATE "'+schema+
            '".pa05_read_host_activation_epoch SET approved_epoch=8 '+
            'WHERE owner_package_id=$1 AND host_id=$2',[
              "evo-purchase-attention","read-host-a"
            ]);
          const newlyAllowed=reply(durableA,"readResult");
          durableA.send({type:"read",epoch:8});
          assertBusiness(await newlyAllowed,"read-host-a");
          const stillUnapproved=reply(restartedB,"readDenied");
          restartedB.send({type:"read",epoch:8});
          assert.match((await stillUnapproved).message,
            /PA05_READ_SQL_HOST_REATTEST_REQUIRED/);
          await t.test("E01J4B revoke-first durable lifecycle repair after multiple OS crashes",{
            timeout:42000
          },async()=>{
            let recoveredA;
            try{
              // A is authorized at epoch 8 and B is still locally ACTIVE
              // but unapproved. Durable intent and approval cut happen in
              // the SAME central SQL transaction, never after local mutation.
              await root.unsafe('CREATE TABLE "'+schema+
                '".pa05_read_lifecycle_intents('+
                'operation_id text PRIMARY KEY, host_id text NOT NULL, '+
                'owner_package_id text NOT NULL, expected_epoch bigint NOT NULL, '+
                "state text NOT NULL CHECK(state IN ('FENCED','COMPLETE')))");
              const held=reply(durableA,"held");
              durableA.send({type:"hold",epoch:8});
              await held;
              const oldBusiness=reply(durableA,"readResult");
              let prepared=false;
              const prepare=root.begin(async tx=>{
                await tx.unsafe('INSERT INTO "'+schema+
                  '".pa05_read_lifecycle_intents VALUES($1,$2,$3,$4,$5)',[
                  "e01j4b-disable-uninstall","read-host-a",
                  "evo-purchase-attention",8,"FENCED"
                ]);
                const updated=await tx.unsafe('UPDATE "'+schema+
                  '".pa05_read_host_activation_epoch '+
                  'SET approved_epoch=7 WHERE owner_package_id=$1 '+
                  'AND host_id=$2 AND approved_epoch=8 RETURNING host_id',[
                  "evo-purchase-attention","read-host-a"
                ]);
                assert.equal(updated.length,1);
                prepared=true;
              });
              await delay(220);
              assert.equal(prepared,false,
                "revocation must wait for the actual in-flight READ SQL lock");
              durableA.send({type:"release"});
              assertBusiness(await oldBusiness,"read-host-a");
              await prepare;
              const persisted=await root.unsafe('SELECT state FROM "'+schema+
                '".pa05_read_lifecycle_intents WHERE operation_id=$1',[
                "e01j4b-disable-uninstall"
              ]);
              assert.equal(persisted[0].state,"FENCED");
              // Simulate fatal exit after central cut but BEFORE the local
              // AppManager receives DISABLE. Stale ACTIVE must not bypass.
              const firstDeath=new Promise(resolve=>durableA.once("exit",resolve));
              durableA.kill("SIGKILL");
              await firstDeath;
              recoveredA=start(urlA,schema,fileA);
              await reply(recoveredA,"ready");
              const staleLocal=reply(recoveredA,"localState");
              recoveredA.send({type:"snapshot"});
              assert.equal((await staleLocal).active,true);
              const centrallyDenied=reply(recoveredA,"readDenied");
              recoveredA.send({type:"read",epoch:8});
              assert.match((await centrallyDenied).message,
                /PA05_READ_SQL_HOST_REATTEST_REQUIRED/);
              // Original AppManager must apply DISABLE to the correct file.
              const disabled=reply(recoveredA,"disabled");
              recoveredA.send({type:"disable"});
              await disabled;
              const secondDeath=new Promise(resolve=>recoveredA.once("exit",resolve));
              recoveredA.kill("SIGKILL");
              await secondDeath;
              recoveredA=start(urlA,schema,fileA);
              await reply(recoveredA,"ready");
              const afterDisable=reply(recoveredA,"localState");
              recoveredA.send({type:"snapshot"});
              assert.deepEqual(
                {installed:(await afterDisable).installed,active:false},
                {installed:true,active:false}
              );
              const disableAgain=reply(recoveredA,"disabled");
              recoveredA.send({type:"disable"});
              await disableAgain;
              const remove=reply(recoveredA,"uninstalled");
              recoveredA.send({type:"uninstall"});
              await remove;
              const thirdDeath=new Promise(resolve=>recoveredA.once("exit",resolve));
              recoveredA.kill("SIGKILL");
              await thirdDeath;
              recoveredA=start(urlA,schema,fileA);
              await reply(recoveredA,"ready");
              const afterUninstall=reply(recoveredA,"localState");
              recoveredA.send({type:"snapshot"});
              const absent=await afterUninstall;
              assert.equal(absent.installed,false,
                "restarted Worker auto-installed an explicitly removed plugin");
              assert.equal(absent.active,false);
              const noBusiness=reply(recoveredA,"readDenied");
              recoveredA.send({type:"read",epoch:8});
              assert.match((await noBusiness).message,
                /PA05_READ_SQL_HOST_REATTEST_REQUIRED/);
              // Confirm the lifecycle intent survived every Worker crash.
              assert.equal((await root.unsafe('SELECT state FROM "'+schema+
                '".pa05_read_lifecycle_intents WHERE operation_id=$1',[
                "e01j4b-disable-uninstall"
              ]))[0].state,"FENCED");
              await assert.rejects(sqlA.unsafe('UPDATE "'+schema+
                '".pa05_read_lifecycle_intents SET state=$1',[
                "COMPLETE"
              ]),/permission denied/);
              const completed=await root.unsafe('UPDATE "'+schema+
                '".pa05_read_lifecycle_intents SET state=$1 '+
                'WHERE operation_id=$2 AND state=$3 RETURNING operation_id',[
                "COMPLETE","e01j4b-disable-uninstall","FENCED"
              ]);
              assert.equal(completed.length,1);
              const replay=await root.unsafe('UPDATE "'+schema+
                '".pa05_read_lifecycle_intents SET state=$1 '+
                'WHERE operation_id=$2 AND state=$3 RETURNING operation_id',[
                "COMPLETE","e01j4b-disable-uninstall","FENCED"
              ]);
              assert.equal(replay.length,0,"duplicate repair must not create a new completion");
              const explicitInstall=reply(recoveredA,"installed");
              recoveredA.send({type:"install"});
              await explicitInstall;
              const stillDenied=reply(recoveredA,"readDenied");
              recoveredA.send({type:"read",epoch:8});
              assert.match((await stillDenied).message,
                /PA05_READ_SQL_HOST_REATTEST_REQUIRED/);
              // DBA checked the newly installed local state, then *explicitly*
              // reattests A. No automatic re-approval on uninstall or restart.
              const checked=reply(recoveredA,"localState");
              recoveredA.send({type:"snapshot"});
              assert.equal((await checked).active,true);
              const attested=await root.unsafe('UPDATE "'+schema+
                '".pa05_read_host_activation_epoch SET approved_epoch=8 '+
                'WHERE owner_package_id=$1 AND host_id=$2 '+
                'AND approved_epoch=7 RETURNING host_id',[
                "evo-purchase-attention","read-host-a"
              ]);
              assert.equal(attested.length,1);
              const legitimate=reply(recoveredA,"readResult");
              recoveredA.send({type:"read",epoch:8});
              assertBusiness(await legitimate,"read-host-a");
              const deniedB=reply(restartedB,"readDenied");
              restartedB.send({type:"read",epoch:8});
              assert.match((await deniedB).message,
                /PA05_READ_SQL_HOST_REATTEST_REQUIRED/);
              console.log("PA05_E01J4B_CRASH_RECOVER_LIFECYCLE_PG="+JSON.stringify({
                realPostgresql18:true,
                originalAppManagerAndBusinessHandler:true,
                revokeWaitedForInFlightRead:true,
                centralCutAndIntentSameSqlTransaction:true,
                crashedWhileLocallyActiveDenied:true,
                crashedAfterDisableRemainedDisabled:true,
                uninstalledPackageNotAutoRestored:true,
                repairDurableAcrossThreeWorkerCrashes:true,
                duplicateRepairIdempotent:true,
                ordinaryWorkerCannotCompleteCentralIntent:true,
                reinstallWithoutReattestationDenied:true,
                explicitAttestationRestoresOnlyOneHost:true,
                alternateWorkerStillDenied:true,
                productionCrossStoreAtomicityCertified:false,
                operatorConsentAndSecretsCertified:false,
                productionHostWired:false,
                productionWriteEnabled:false,pa05Signed:false
              }));
            }finally{
              await stop(recoveredA);
            }
          });
          console.log("PA05_E01J4_PERSISTED_MULTIWORKER_REATTEST_PG="+JSON.stringify({
            actualPostgresql18:true,distinctWorkerProcessAndStateFiles:2,
            originalAppManagerAndPurchaseRead:true,
            centralRevocationBeforeLocalDisable:true,
            crashedWorkerRestoredLocallyActive:true,
            oldEpochAndFrozenReadDenied:true,
            globalRecertificationDoesNotAutoApproveWorkers:true,
            workerCannotForgeHostReattestation:true,
            reattestedHostReadPasses:true,
            unapprovedSurvivingWorkerDenied:true,
            localJsonPostgresAtomicityCertified:false,
            productionOperatorAttestationCertified:false,
            productionHostLifecycleWired:false,
            productionWriteEnabled:false,pa05Signed:false
          }));
        }finally{
          await Promise.allSettled([stop(durableA),stop(durableB),stop(restartedB)]);
          rmSync(storage,{recursive:true,force:true});
        }
      });
      console.log("PA05_E01J2_AUTHENTICATED_HANDLER_PG="+JSON.stringify({
        actualPostgresql18:true,
        roleBoundSessionUser:true,
        workerCannotExecuteReadFunction:true,
        hostsCannotMutateEpochOrInventory:true,
        crossHostImpersonationDenied:true,
        clientHostIdSpoofDenied:true,
        actualNodeHostProcesses:2,
        originalPurchaseAttentionHandlerAndSourceRouter:true,
        appManagerActiveFeatureGate:true,
        readHeldBlocksRevoke:true,
        oldEpochDeniedBothHosts:true,
        oldSqlBackendPrivilegeRevoked:true,
        activeBackendTerminationFailClosed:true,
        centralNetworkPartitionCertified:false,
        productionHostWired:false,
        productionEnterpriseDataCertified:false,
        crossStorageAtomicInstallCertified:false,
        productionWriteEnabled:false,
        pa05Signed:false
      }));
    }finally{
      await Promise.allSettled([sqlA.end(),sqlB.end(),sqlWorker.end()]);
    }
  }finally{
    await Promise.allSettled([stop(hostA),stop(hostB)]);
    if(admin)await admin.close();
    await root.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');
    for(const role of granted.reverse())
      await root.unsafe('DROP ROLE IF EXISTS "'+role+'"');
    await root.end();
  }
});

test("E01J2 unavailable PostgreSQL authority must never invoke real READ callback",{
  timeout:14000
},async()=>{
  const gate=createPa05AuthenticatedReadHostV010({
    connectionString:"postgres://proof:proof@127.0.0.1:1/invalid",
    schema:"pa05_e01j2_unavailable"
  });
  let callbackInvoked=false;
  try{
    await assert.rejects(gate.withReadAdmission({
      expectedEpoch:2,
      async perform(){callbackInvoked=true;return "FORBIDDEN";}
    }),/connect|ECONNREFUSED|timeout|Connection/i);
    assert.equal(callbackInvoked,false);
    console.log("PA05_E01J2_AUTHORITY_UNAVAILABLE="+JSON.stringify({
      sqlAuthorityUnreachable:true,readCallbackInvoked:false,
      noLocalFallback:true,productionNetworkPartitionCertified:false
    }));
  }finally{
    await gate.close();
  }
});
