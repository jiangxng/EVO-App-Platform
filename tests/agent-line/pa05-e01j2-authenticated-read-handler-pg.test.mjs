import test from "node:test";
import assert from "node:assert/strict";
import {fork} from "node:child_process";
import {randomUUID} from "node:crypto";
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
function start(roleUrl,schema){
  const child=fork(workerScript,[],{
    stdio:["ignore","pipe","pipe","ipc"],cwd:process.cwd(),
    env:{PATH:process.env.PATH??"",HOME:process.env.RUNNER_TEMP??"/tmp",
      PA05_E01J2_HOST_SQL_URL:roleUrl,PA05_E01J2_SCHEMA:schema}
  });
  child.stderr.on("data",b=>{child.lastError=(child.lastError??"")+String(b);});
  return child;
}
async function stop(child){
  if(!child||child.exitCode!==null)return;
  const done=reply(child,"closed",1500).catch(()=>null);
  child.send({type:"close"});await done;
  if(child.exitCode===null){
    child.kill("SIGTERM");
    await Promise.race([new Promise(resolve=>child.once("exit",resolve)),delay(800)]);
    if(child.exitCode===null)child.kill("SIGKILL");
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
        let partitionHost;
        let resultLeaked=false;
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
          const denied=reply(partitionHost,"readDenied");
          // This closes ACTUAL Host->PostgreSQL TCP sockets, not an in-process
          // fake callback or DBA pg_terminate_backend. Other Host/DBA
          // connections stay healthy throughout the interrupted READ.
          const severed=proxy.cut();
          assert.ok(severed>=1,"no authenticated PG transport severed");
          // The SQL transaction loses its remote session, releasing its lock.
          // DBA revoke may then freeze the epoch while JS source READ is held.
          assert.equal(await admin.revoke(4),5);
          assert.deepEqual(await admin.getEpoch(),{epoch:5,state:"FROZEN"});
          partitionHost.send({type:"release"});
          assert.match((await denied).message,
            /connection|closed|CONNECTION|terminat|socket|network|transaction|write|read/i);
          assert.equal(resultLeaked,false,"business result escaped a severed SQL transaction");
          const down=reply(partitionHost,"readDenied");
          partitionHost.send({type:"read",epoch:5});
          await down;
          assert.equal(resultLeaked,false,"offline central SQL yielded a business result");

          proxy.restore();
          const stale=reply(partitionHost,"readDenied");
          partitionHost.send({type:"read",epoch:4});
          assert.match((await stale).message,/PA05_READ_SQL_ADMISSION_DENIED/);
          const frozen=reply(partitionHost,"readDenied");
          partitionHost.send({type:"read",epoch:5});
          assert.match((await frozen).message,/PA05_READ_SQL_ADMISSION_DENIED/);
          assert.equal(await admin.certify({
            expectedEpoch:5,async trustedOperatorApproved(){return true;}
          }),6);
          const recovered=reply(partitionHost,"readResult");
          partitionHost.send({type:"read",epoch:6});
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
            silentPacketBlackholeCertified:false,
            automaticAppManagerCrossStoreAtomicity:false,
            liveProductionTransportCertified:false,
            productionWriteEnabled:false,
            pa05Signed:false
          }));
        }finally{
          if(partitionHost)partitionHost.off("message",observe);
          await stop(partitionHost);
          await proxy.close();
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
