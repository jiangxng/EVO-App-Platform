import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {randomUUID} from "node:crypto";
import {createServer} from "node:net";
import {mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import postgres from "postgres";

const url=process.env.PA05_XDB_AUTHORITY_DATABASE_URL;
const packageId="evo-purchase-attention";
const ADMIN="pa05-j4d-throwaway-operator";
const policy=JSON.stringify({contractVersion:"0.1.0",rules:[{
  id:"pa05-j4d-admission-and-lifecycle",effect:"ALLOW",
  actions:["host.plugin.read.admit","host.plugin.lifecycle.install",
    "host.plugin.lifecycle.enable","host.plugin.lifecycle.disable",
    "host.plugin.lifecycle.uninstall"],
  subjectIds:["bootstrap-admin"],actorTypes:["HUMAN"],
  resourceTypes:["plugin-package"],resourceIds:[packageId]
}]});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function port(){
  const server=createServer();
  await new Promise((resolve,reject)=>server.once("error",reject)
    .listen(0,"127.0.0.1",resolve));
  const n=server.address().port;
  await new Promise(resolve=>server.close(resolve));
  return n;
}
async function host(extra={}){
  const p=await port(),dir=mkdtempSync(join(tmpdir(),"pa05-e01j4d-"));
  const env={
    PATH:process.env.PATH??"",HOME:dir,NODE_ENV:"test",PORT:String(p),
    APP_PLATFORM_BOOTSTRAP_ADMIN_TOKEN:ADMIN,
    APP_PLATFORM_PA05_E01D_ADMIN_READ_ADMISSION:"OPT_IN",
    APP_PLATFORM_PA05_E01J4D_READ_LIFECYCLE:"OPT_IN",
    APP_PLATFORM_AUTHORIZATION_POLICY_OVERLAY_JSON:policy,
    ...extra
  };
  const child=spawn(process.execPath,["dist/manager/server.js"],{
    cwd:process.cwd(),env,stdio:["ignore","pipe","pipe"]});
  let logs="";
  for(const stream of [child.stdout,child.stderr]){
    stream.on("data",b=>{logs=(logs+String(b)).slice(-20000);});
  }
  const base="http://127.0.0.1:"+p;
  let ready=false;
  for(let i=0;i<140;i++){
    if(child.exitCode!==null)break;
    try{
      const r=await fetch(base+"/v1/catalog",{signal:AbortSignal.timeout(750)});
      if(r.status===200){ready=true;break;}
    }catch{}
    await pause(130);
  }
  if(!ready)throw Error("PA05_J4D_ACTUAL_HOST_START_FAILED:"+logs.slice(-5000));
  return {base,logs:()=>logs,async close(){
    if(child.exitCode===null){
      child.kill("SIGTERM");
      await Promise.race([new Promise(resolve=>child.once("exit",resolve)),pause(2000)]);
      if(child.exitCode===null)child.kill("SIGKILL");
    }
    rmSync(dir,{recursive:true,force:true});
  }};
}
async function api(h,path,body,bearer=ADMIN){
  const r=await fetch(h.base+path,{
    method:"POST",headers:{"content-type":"application/json",
      ...(bearer?{authorization:"Bearer "+bearer}:{})},
    body:JSON.stringify(body),signal:AbortSignal.timeout(10000)
  });
  return {status:r.status,body:await r.json()};
}
async function state(h){
  const r=await fetch(h.base+"/v1/platform/snapshot",{signal:AbortSignal.timeout(2000)});
  assert.equal(r.status,200);
  return r.json();
}
const installed=s=>s.installedPackages.some(x=>x.packageId===packageId);
const active=s=>s.activeFeatures.some(x=>x.packageId===packageId);
async function admitInstall(h){
  const a=await api(h,"/v1/admin/pa05/read-plugin/admit",{
    packageId,confirmed:true});
  assert.equal(a.status,200,JSON.stringify(a));
  const i=await api(h,"/v1/install",{packageId,trustApproved:true,approvedPermissions:[]});
  assert.equal(i.status,200,JSON.stringify(i));
  assert.equal(installed(await state(h)),true);
  assert.equal(active(await state(h)),true);
}

test("E01J4D real Node Host HTTP+Action existing routes enforce SQL-first READ lifecycle",{
  skip:!url?"physical PostgreSQL18 required":false,timeout:120000
},async()=>{
  const suffix=randomUUID().replaceAll("-","").slice(0,10);
  const schema="pa05_j4d_"+suffix,hostId="read-host-a";
  const sqlRole="pa05_j4d_admin_"+suffix,workerRole="pa05_j4d_worker_"+suffix;
  const secret=randomUUID().replaceAll("-","");
  const root=postgres(url,{max:3,prepare:false});
  let live,empty;
  try{
    await root.unsafe('CREATE SCHEMA "'+schema+'"');
    await root.unsafe('CREATE ROLE "'+sqlRole+
      '" LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD \''+secret+'\'');
    await root.unsafe('CREATE ROLE "'+workerRole+
      '" LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD \''+secret+'\'');
    await root.unsafe('CREATE TABLE "'+schema+'".pa05_read_lifecycle_operators ('+
      'login_role name PRIMARY KEY,host_id text NOT NULL,enabled boolean NOT NULL)');
    await root.unsafe('INSERT INTO "'+schema+
      '".pa05_read_lifecycle_operators VALUES($1,$2,true)',[sqlRole,hostId]);
    await root.unsafe('CREATE TABLE "'+schema+'".pa05_read_owner_epoch ('+
      'owner_package_id text PRIMARY KEY,epoch bigint NOT NULL)');
    await root.unsafe('INSERT INTO "'+schema+
      '".pa05_read_owner_epoch VALUES($1,1)',[packageId]);
    await root.unsafe('CREATE TABLE "'+schema+'".pa05_read_host_activation_epoch ('+
      'owner_package_id text NOT NULL,host_id text NOT NULL,'+
      'approved_epoch bigint NOT NULL,PRIMARY KEY(owner_package_id,host_id))');
    await root.unsafe('INSERT INTO "'+schema+
      '".pa05_read_host_activation_epoch VALUES($1,$2,1)',[packageId,hostId]);
    await root.unsafe('CREATE TABLE "'+schema+'".pa05_read_lifecycle_intents ('+
      'operation_id text PRIMARY KEY,owner_package_id text NOT NULL,'+
      'host_id text NOT NULL,expected_epoch bigint NOT NULL,'+
      "state text NOT NULL CHECK(state IN ('FENCED','COMPLETE')),"+
      "operation text NOT NULL CHECK(operation IN ('DISABLE','UNINSTALL')))");
    await root.unsafe('GRANT USAGE ON SCHEMA "'+schema+'" TO "'+sqlRole+'"');
    await root.unsafe('GRANT USAGE ON SCHEMA "'+schema+'" TO "'+workerRole+'"');
    await root.unsafe('GRANT SELECT ON ALL TABLES IN SCHEMA "'+schema+
      '" TO "'+sqlRole+'"');
    await root.unsafe('GRANT INSERT,UPDATE ON "'+schema+
      '".pa05_read_lifecycle_intents TO "'+sqlRole+'"');
    await root.unsafe('GRANT UPDATE ON "'+schema+
      '".pa05_read_host_activation_epoch TO "'+sqlRole+'"');
    const roleUrl=new URL(url);roleUrl.username=sqlRole;roleUrl.password=secret;
    live=await host({
      APP_PLATFORM_PA05_E01J4D_DATABASE_URL:roleUrl.toString(),
      APP_PLATFORM_PA05_E01J4D_SCHEMA:schema,
      APP_PLATFORM_PA05_E01J4D_HOST_ID:hostId
    });
    await admitInstall(live);
    const unauth=await api(live,"/v1/disable",{packageId},null);
    assert.equal(unauth.status,403);
    assert.equal(active(await state(live)),true);

    const disabled=await api(live,"/v1/disable",{
      packageId,operationId:"attacker-supplied-id"
    });
    assert.equal(disabled.status,200,JSON.stringify(disabled));
    assert.equal(active(await state(live)),false);
    const receipt=await root.unsafe('SELECT state,operation,operation_id FROM "'+
      schema+'".pa05_read_lifecycle_intents');
    assert.equal(receipt.length,1);
    assert.equal(receipt[0].state,"COMPLETE");
    assert.equal(receipt[0].operation,"DISABLE");
    assert.notEqual(receipt[0].operation_id,"attacker-supplied-id");
    assert.equal((await root.unsafe('SELECT approved_epoch FROM "'+schema+
      '".pa05_read_host_activation_epoch'))[0].approved_epoch,"0");
    const role=new URL(url);role.username=workerRole;role.password=secret;
    const sqlWorker=postgres(role.toString(),{max:1,prepare:false});
    try{
      await assert.rejects(sqlWorker.unsafe('UPDATE "'+schema+
        '".pa05_read_host_activation_epoch SET approved_epoch=1'),/permission denied/);
    }finally{await sqlWorker.end({timeout:2});}

    // A separately authorized DBA recertifies before the second transition;
    // no HTTP caller may set approved_epoch or select another Host.
    await root.unsafe('UPDATE "'+schema+
      '".pa05_read_host_activation_epoch SET approved_epoch=1');
    const action={
      contractVersion:"0.1.0",type:"command",
      command:{code:"app-platform.uninstall-package",inputVersion:"0.1.0"},
      values:{itemId:packageId,confirmed:true},
      sourceInteractionId:"e01j4d-http-actual-action",
      actionId:"pa05-j4d-uninstall-"+suffix,requiresConfirmation:false
    };
    const removed=await api(live,"/v1/actions",action);
    assert.equal(removed.status,200,JSON.stringify(removed));
    assert.equal(installed(await state(live)),false);
    const receipts=await root.unsafe('SELECT operation,state FROM "'+schema+
      '".pa05_read_lifecycle_intents ORDER BY operation');
    assert.deepEqual(receipts.map(x=>x.operation),["DISABLE","UNINSTALL"]);
    assert.ok(receipts.every(x=>x.state==="COMPLETE"));

    // No authority supplied: E01D may register/install, but the new guarded
    // lifecycle mode cannot fall through to the generic local mutation.
    empty=await host();
    await admitInstall(empty);
    const denied=await api(empty,"/v1/disable",{packageId});
    assert.equal(denied.status,409,JSON.stringify(denied));
    assert.equal(denied.body.code,"PA05_READ_LIFECYCLE_AUTHORITY_NOT_CONFIGURED");
    assert.equal(active(await state(empty)),true);
    const denyAction=await api(empty,"/v1/actions",action);
    assert.equal(denyAction.status,409,JSON.stringify(denyAction));
    assert.equal(installed(await state(empty)),true);
    console.log("PA05_E01J4D_ACTUAL_HTTP_LIFECYCLE_PG="+JSON.stringify({
      physicalPostgresql18:true,actualNodeHostHttpAndAction:true,
      existingE01dAdmissionAndE01fOperator:true,
      sqlLoginRoleMappedBySessionUser:true,
      directDisableSqlFirst:true,originalAppManagerMutation:true,
      hostGeneratedOperationId:true,actionUninstallSqlFirst:true,
      missingCentralAuthorityFailsClosed:true,
      ordinaryWorkerCannotMutateCentralApproval:true,
      productionDeployment:false,enterpriseIdentityCertified:false,
      productionOperatorSecretCustodyCertified:false,
      automaticCrashRepairRouteCertified:false,
      fullDistributedCrossStoreAtomicity:false,
      productionMaterialWriteEnabled:false,pa05Signed:false
    }));
  }finally{
    await Promise.allSettled([live?.close(),empty?.close()]);
    await root.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE').catch(()=>{});
    for(const role of [sqlRole,workerRole]){
      await root.unsafe('DROP ROLE IF EXISTS "'+role+'"').catch(()=>{});
    }
    await root.end({timeout:2});
  }
});
