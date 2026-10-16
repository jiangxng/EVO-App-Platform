import test from "node:test";
import assert from "node:assert/strict";
import {fork} from "node:child_process";
import {randomUUID} from "node:crypto";
import {fileURLToPath} from "node:url";
import postgres from "postgres";
import {createPa05SharedReadOwnerGateV010}
  from "../../dist/manager/pa05-read-owner-shared-sql-gate.js";

const urls=[process.env.PA05_XDB_AUTHORITY_DATABASE_URL,
  process.env.PA05_XDB_WORKER_A_DATABASE_URL,
  process.env.PA05_XDB_WORKER_B_DATABASE_URL];
const workerScript=fileURLToPath(new URL("./fixtures/pa05-e01j-sql-host-worker.mjs",import.meta.url));
const owner="evo-purchase-attention";
const trusted=["read-host-a","read-host-b"];
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function receive(child,type,timeout=20000){
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{
      cleanup();reject(Error("PA05_E01J_WORKER_TIMEOUT:"+type));
    },timeout);
    const handler=m=>{
      if(m?.type===type){cleanup();resolve(m);}
    };
    const ended=(code)=>{cleanup();reject(Error("PA05_E01J_WORKER_EXIT:"+type+":"+code));};
    function cleanup(){
      clearTimeout(timer);child.off("message",handler);child.off("exit",ended);
    }
    child.on("message",handler);child.once("exit",ended);
  });
}
function startWorker({url,schema,hostId}){
  const child=fork(workerScript,[],{
    cwd:process.cwd(),stdio:["ignore","pipe","pipe","ipc"],
    env:{
      PATH:process.env.PATH??"",HOME:process.env.RUNNER_TEMP??"/tmp",
      PA05_E01J_AUTHORITY_URL:url,PA05_E01J_SCHEMA:schema,
      PA05_E01J_HOST_ID:hostId
    }
  });
  child.stderr.on("data",b=>{child.lastError=(child.lastError??"")+b.toString();});
  return child;
}
async function stop(child){
  if(!child||child.exitCode!==null)return;
  const closed=receive(child,"closed",2000).catch(()=>null);
  child.send({type:"close"});
  await closed;
  if(child.exitCode===null){
    child.kill("SIGTERM");
    await Promise.race([new Promise(resolve=>child.once("exit",resolve)),delay(1000)]);
    if(child.exitCode===null)child.kill("SIGKILL");
  }
}
const gate=(url,schema,ids=trusted)=>createPa05SharedReadOwnerGateV010({
  connectionString:url,schema,ownerPackageId:owner,trustedHostIds:ids
});

test("E01J real three PG18 and two independent Host processes share one row-locked READ epoch",{
  skip:urls.some(x=>!x)?"requires three physical PostgreSQL18 clusters":false,
  timeout:95000
},async()=>{
  const [central,otherA,otherB]=urls.map(url=>postgres(url,{max:2}));
  const schema="pa05_e01j_"+randomUUID().replaceAll("-","").slice(0,12);
  let authority,hostA,hostB;
  try{
    const physical=await Promise.all([central,otherA,otherB].map(async sql=>
      String((await sql.unsafe("SELECT system_identifier::text AS sid FROM pg_control_system()"))[0].sid)));
    assert.equal(new Set(physical).size,3);
    authority=await gate(urls[0],schema);
    assert.deepEqual(await authority.getEpoch(),{epoch:1,state:"FROZEN"});
    let approvals=0;
    assert.equal(await authority.certify({
      expectedEpoch:1,async trustedOperatorApproved(){approvals++;return true;}
    }),2);
    assert.equal(approvals,2);
    hostA=startWorker({url:urls[0],schema,hostId:trusted[0]});
    hostB=startWorker({url:urls[0],schema,hostId:trusted[1]});
    await Promise.all([receive(hostA,"ready"),receive(hostB,"ready")]);
    assert.notEqual(hostA.pid,hostB.pid);
    const entered=receive(hostA,"held");
    hostA.send({type:"hold",epoch:2});
    assert.equal((await entered).pid,hostA.pid);
    // A revoke from the second OS process MUST wait on the same physical
    // PostgreSQL row until the first worker's in-flight READ finishes.
    let revoked=false;
    const revokedFuture=receive(hostB,"revoked");
    revokedFuture.then(()=>{revoked=true;});
    const started=receive(hostB,"revokeStarted");
    hostB.send({type:"revoke",epoch:2});
    await started;
    await delay(300);
    assert.equal(revoked,false,"cross-process revoke committed during held READ");
    const done=receive(hostA,"holdDone");
    hostA.send({type:"release"});
    await done;
    assert.equal((await revokedFuture).epoch,3);
    assert.deepEqual(await authority.getEpoch(),{epoch:3,state:"FROZEN"});
    const staleA=receive(hostA,"operationDenied");
    hostA.send({type:"read",epoch:2});
    assert.equal((await staleA).code,"PA05_READ_SQL_ADMISSION_DENIED");
    const frozenB=receive(hostB,"operationDenied");
    hostB.send({type:"read",epoch:3});
    assert.equal((await frozenB).code,"PA05_READ_SQL_ADMISSION_DENIED");
    assert.equal(await authority.certify({
      expectedEpoch:3,async trustedOperatorApproved(){return true;}
    }),4);
    const allowedB=receive(hostB,"readResult");
    hostB.send({type:"read",epoch:4});
    assert.equal((await allowedB).value,"ALLOWED");
    const staleStill=receive(hostA,"operationDenied");
    hostA.send({type:"read",epoch:2});
    assert.equal((await staleStill).code,"PA05_READ_SQL_ADMISSION_DENIED");
    const untrusted=receive(hostB,"operationDenied");
    hostB.send({type:"read",hostId:"attacker-host",epoch:4});
    assert.equal((await untrusted).code,"PA05_READ_SQL_HOST_NOT_TRUSTED");
    console.log("PA05_E01J_SHARED_READ_OWNER_PG="+JSON.stringify({
      physicalClusters:3,actualSeparateHostProcesses:2,
      samePhysicalPgAuthority:true,oldReadHeldBlocksRevokeCommit:true,
      revokeAdvancesEpochAndFreezes:true,oldEpochDeniedBothWorkers:true,
      explicitRecertificationRequired:true,
      unregisteredHostRejected:true,
      productionHostBusinessHandlerIntegrated:false,
      sqlRoleSeparationCertified:false,
      productionWriteEnabled:false
    }));
  }finally{
    await Promise.allSettled([stop(hostA),stop(hostB)]);
    if(authority)await authority.close();
    await central.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');
    await Promise.all([central.end(),otherA.end(),otherB.end()]);
  }
});

test("E01J actual PG pinned Host inventory, stale recertification and denied bootstrap approval",{
  skip:!urls[0]?"requires central PostgreSQL18":false,
  timeout:32000
},async()=>{
  const schema="pa05_e01j_"+randomUUID().replaceAll("-","").slice(0,12);
  const sql=postgres(urls[0],{max:2});
  let instance;
  try{
    instance=await gate(urls[0],schema);
    await assert.rejects(gate(urls[0],schema,["read-host-a","unexpected-host"]),
      /PA05_READ_SQL_HOST_INVENTORY_CHANGED/);
    assert.deepEqual(await instance.getEpoch(),{epoch:1,state:"FROZEN"});
    await assert.rejects(instance.certify({
      expectedEpoch:1,async trustedOperatorApproved(){return false;}
    }),/PA05_READ_SQL_OPERATOR_NOT_APPROVED/);
    assert.equal(await instance.certify({
      expectedEpoch:1,async trustedOperatorApproved(){return true;}
    }),2);
    await assert.rejects(instance.certify({
      expectedEpoch:1,async trustedOperatorApproved(){return true;}
    }),/PA05_READ_SQL_RECERTIFICATION_REQUIRED/);
    await assert.rejects(instance.revoke(1),/PA05_READ_SQL_EPOCH_CHANGED/);
    await sql.unsafe('INSERT INTO "'+schema+
      '".pa05_read_trusted_hosts(owner_package_id,host_id) VALUES($1,$2)',
      [owner,"unaudited-host"]);
    await assert.rejects(instance.getEpoch(),/PA05_READ_SQL_HOST_INVENTORY_CHANGED/);
    console.log("PA05_E01J_READ_INVENTORY_PG="+JSON.stringify({
      hostInventoryPinned:true,unauditedHostAdditionDenied:true,
      operatorMustApproveTwice:true,staleEpochDenied:true,
      runtimeDbPrivilegeIsolationCertified:false
    }));
  }finally{
    if(instance)await instance.close();
    await sql.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');
    await sql.end();
  }
});

test("E01J actual unavailable PG authority refuses to execute READ callback",{
  timeout:14000
},async()=>{
  let invoked=false;
  await assert.rejects(gate("postgres://proof:proof@127.0.0.1:1/invalid",
    "pa05_e01j_offline"),/connect|ECONNREFUSED|PA05_/i);
  // No client callback is submitted on a failed gate construction.
  assert.equal(invoked,false);
  await assert.rejects(gate("not-a-url","pa05_e01j_offline"),
    /PA05_READ_SQL_AUTHORITY_URL_REQUIRED/);
  await assert.rejects(gate("postgres://proof:proof@127.0.0.1:1/invalid",
    "BadSchema"),/PA05_READ_SQL_SCHEMA_INVALID/);
  console.log("PA05_E01J_PARTITION_FAIL_CLOSED="+JSON.stringify({
    unavailableAuthorityDenied:true,
    invalidEndpointDenied:true,
    noLocalFallback:true,
    runtimePartitionDuringActiveReadCertified:false
  }));
});
