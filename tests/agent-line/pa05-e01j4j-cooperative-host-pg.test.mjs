import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {createServer} from "node:net";
import {mkdtempSync,chmodSync,existsSync,rmSync,unlinkSync} from "node:fs";
import {join,dirname} from "node:path";
import {tmpdir} from "node:os";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {createFileLifecycleStore} from "../../dist/manager/store.js";
import {tradingReferencePackageV010} from "../../dist/apps/trading-reference/package.js";
import {purchaseAttentionPackageV010} from "../../dist/apps/purchase-attention/package.js";
import {recoverPa05OneShotHostPrestartupV010}
  from "../../dist/manager/pa05-read-owner-one-shot-prestartup.js";

async function port(){
  const server=createServer();
  await new Promise((resolve,reject)=>server.once("error",reject)
    .listen(0,"127.0.0.1",resolve));
  const n=server.address().port;
  await new Promise(resolve=>server.close(resolve));
  return n;
}
function launched(file,p,cooperativeMode="OPT_IN"){
  const proc=spawn(process.execPath,["--input-type=module","-e",
    "process.umask(0o077); await import('./dist/manager/server.js');"
  ],{cwd:process.cwd(),env:{
    PATH:process.env.PATH??"",HOME:dirname(file),
    NODE_ENV:"test",PORT:String(p),
    APP_PLATFORM_STATE_FILE:file,
    APP_PLATFORM_PA05_E01D_ADMIN_READ_ADMISSION:"OFF",
    APP_PLATFORM_PA05_E01J4D_READ_LIFECYCLE:"OFF",
    APP_PLATFORM_PA05_E01J4J_COOPERATIVE_HOST_LOCK:cooperativeMode
  },stdio:["ignore","pipe","pipe"]});
  let output="";
  proc.stdout.on("data",b=>{output=(output+String(b)).slice(-12000);});
  proc.stderr.on("data",b=>{output=(output+String(b)).slice(-12000);});
  return {proc,output:()=>output};
}
async function waitBoot(p,record,timeout=17000){
  const until=Date.now()+timeout;
  while(Date.now()<until){
    if(record.proc.exitCode!==null || record.proc.signalCode!==null)break;
    try{
      const res=await fetch("http://127.0.0.1:"+p+"/v1/catalog",{
        signal:AbortSignal.timeout(450)
      });
      if(res.status===200)return true;
    }catch{}
    await new Promise(resolve=>setTimeout(resolve,125));
  }
  return false;
}
async function ended(record,signal){
  if(record.proc.exitCode===null && record.proc.signalCode===null){
    record.proc.kill(signal);
    await Promise.race([
      new Promise(resolve=>record.proc.once("exit",resolve)),
      new Promise((_,reject)=>setTimeout(()=>reject(
        Error("PA05_J4J_HOST_EXIT_TIMEOUT")),8500))
    ]);
  }
}
test("E01J4J cooperating real Host excludes J4I, graceful release, SIGKILL stale fail closed",{
  skip:process.platform!=="linux"?"Linux POSIX live Host required":false,
  timeout:65000
},async()=>{
  const prior=process.umask(0o077);
  const dir=mkdtempSync(join(tmpdir(),"pa05-j4j-"));
  const file=join(dir,"state.json");
  const lock=file+".pa05-one-shot.lock";
  const audit=join(dir,"audit.jsonl");
  let first,second,defaultHost;
  let identityCalls=0,secretCalls=0;
  try{
    const manager=createAppManagerService(createPackageCatalog([
      tradingReferencePackageV010,purchaseAttentionPackageV010
    ]),createFileLifecycleStore(file));
    manager.install("evo-trading-reference");
    chmodSync(file,0o600);
    const params={
      mode:"OPT_IN",hostId:"read-host-a",schema:"pa05_test",
      stateFile:file,auditFile:audit,
      catalog:createPackageCatalog([
        tradingReferencePackageV010,purchaseAttentionPackageV010
      ]),
      bearerToken:"unknown-test-token",
      sessionProvider:{providerId:"identity-test",resolve(){
        identityCalls++;return undefined;
      }},
      authorizationProvider:{providerId:"policy-test",check(){
        throw Error("should not execute");
      }},
      secretsProvider:{providerId:"secrets-test",resolve(){
        secretCalls++;throw Error("never");
      }}
    };
    // Real default-OFF control process, not a hardcoded marker.
    // It must still boot normally without creating a J4J/J4I lock.
    const defaultPort=await port();
    defaultHost=launched(file,defaultPort,"OFF");
    assert.equal(await waitBoot(defaultPort,defaultHost),true,defaultHost.output());
    assert.equal(existsSync(lock),false);
    await ended(defaultHost,"SIGTERM");
    defaultHost=undefined;
    const firstPort=await port();
    first=launched(file,firstPort);
    assert.equal(await waitBoot(firstPort,first),true,first.output());
    assert.equal(existsSync(lock),true);
    // The true server is online; J4I must not touch operator Providers.
    await assert.rejects(recoverPa05OneShotHostPrestartupV010(params),
      /PA05_J4I_PRESTART_DENIED_OR_UNKNOWN/);
    assert.equal(identityCalls,0);
    assert.equal(secretCalls,0);
    await ended(first,"SIGTERM");
    assert.equal(existsSync(lock),false,
      "graceful Host shutdown must release its exact inode lock");
    // The same persisted state can now reach the identity step; no DBA
    // credential is touched because this token does not authenticate.
    await assert.rejects(recoverPa05OneShotHostPrestartupV010(params),
      /PA05_J4I_PRESTART_DENIED_OR_UNKNOWN/);
    assert.equal(identityCalls,1);
    assert.equal(secretCalls,0);
    assert.equal(existsSync(lock),false);
    const secondPort=await port();
    second=launched(file,secondPort);
    assert.equal(await waitBoot(secondPort,second),true,second.output());
    assert.equal(existsSync(lock),true);
    await ended(second,"SIGKILL");
    assert.equal(existsSync(lock),true,
      "SIGKILL must leave ambiguous Host ownership fail closed");
    await assert.rejects(recoverPa05OneShotHostPrestartupV010(params),
      /PA05_J4I_PRESTART_DENIED_OR_UNKNOWN/);
    assert.equal(identityCalls,1);
    assert.equal(secretCalls,0);
    const thirdPort=await port();
    const third=launched(file,thirdPort);
    try{
      assert.equal(await waitBoot(thirdPort,third,7000),false);
      assert.match(third.output(),/PA05_J4J_COOPERATIVE_LOCK_DENIED/);
    }finally{await ended(third,"SIGKILL");}
    assert.equal(existsSync(lock),true);
    // Removal here is strictly a disposable test fixture cleanup, NEVER
    // automatic production stale-lock takeover.
    unlinkSync(lock);
    console.log("PA05_E01J4J_COOPERATING_HOST="+JSON.stringify({
      actualSeparateNodeServer:true,hostHoldsSameStateLock:true,
      onlineHostExcludesMaintenanceBeforeIdentity:true,
      cooperativeGracefulExitReleases:true,
      operatorDenialAfterHostStop:true,
      crashLeavesAmbiguousLock:true,staleLockBlocksRestart:true,
      noSecretsTouched:true,defaultHostModeStillOff:true,
      multiWorkerGlobalStopCertified:false,
      actualProductionOperatorIdpCertified:false,
      productionMaterialWriteEnabled:false,pa05Signed:false
    }));
  }finally{
    try{if(defaultHost)await ended(defaultHost,"SIGKILL");}catch{}\n    try{if(first)await ended(first,"SIGKILL");}catch{}
    try{if(second)await ended(second,"SIGKILL");}catch{}
    process.umask(prior);
    chmodSync(dir,0o700);
    rmSync(dir,{recursive:true,force:true});
  }
});
