import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from "node:fs";
import {spawn} from "node:child_process";
import {createServer} from "node:net";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {createFileLifecycleStore} from "../../dist/manager/store.js";
import {tradingReferencePackageV010}
  from "../../dist/apps/trading-reference/package.js";
import {purchaseAttentionPackageV010}
  from "../../dist/apps/purchase-attention/package.js";

const protectedId="evo-purchase-attention";
const featureId="evo-purchase-attention.default";
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function port(){
  const s=createServer();
  await new Promise((resolve,reject)=>s.once("error",reject)
    .listen(0,"127.0.0.1",resolve));
  const n=s.address().port;
  await new Promise(resolve=>s.close(resolve));
  return n;
}

function persistedHostState(caseName){
  const dir=mkdtempSync(join(tmpdir(),"pa05-e01i-"));
  const file=join(dir,"lifecycle.json");
  const store=createFileLifecycleStore(file);
  const manager=createAppManagerService(createPackageCatalog([
    tradingReferencePackageV010,purchaseAttentionPackageV010
  ]),store);
  if(caseName==="ACTIVE"||caseName==="INSTALLED_DISABLED"){
    manager.install(protectedId);
    if(caseName==="INSTALLED_DISABLED") manager.disable(protectedId);
  } else if(caseName==="UNRELATED"){
    manager.install(tradingReferencePackageV010.packageId);
  } else if(caseName==="ORPHAN_FEATURE"){
    store.saveActiveFeature({
      contractVersion:"0.1.0",
      packageId:protectedId,featureId,
      activatedAt:"2026-10-16T00:00:00.000Z"
    });
  } else {
    throw Error("PA05_E01I_FIXTURE_UNKNOWN");
  }
  return {dir,file,snapshot:store.snapshot()};
}
async function start(state){
  const n=await port();
  // Never inherit database URL, provider keys, Railway identity, or live
  // storage: disposable process, temp HOME and only the explicit file store.
  const env={
    PATH:process.env.PATH??"",HOME:state.dir,
    PORT:String(n),NODE_ENV:"test",APP_PLATFORM_STATE_FILE:state.file,
    APP_PLATFORM_STARTUP_PROFILE:"minimal",
    APP_PLATFORM_PA05_E01D_ADMIN_READ_ADMISSION:"OFF"
  };
  const child=spawn(process.execPath,["dist/manager/server.js"],{
    cwd:process.cwd(),env,stdio:["ignore","pipe","pipe"]
  });
  let log="";
  for(const stream of [child.stdout,child.stderr])
    stream.on("data",b=>{log=(log+b.toString()).slice(-20000);});
  return {
    child,port:n,getLog:()=>log,
    async stop(){
      if(child.exitCode===null){
        child.kill("SIGTERM");
        await Promise.race([new Promise(resolve=>child.once("exit",resolve)),
          pause(2500)]);
        if(child.exitCode===null)child.kill("SIGKILL");
      }
    }
  };
}
async function untilExited(host){
  for(let i=0;i<120;i++){
    if(host.child.exitCode!==null)return;
    await pause(100);
  }
  throw Error("PA05_E01I_DENIED_HOST_DID_NOT_EXIT: "+host.getLog().slice(-1800));
}
async function untilServing(host){
  for(let i=0;i<130;i++){
    if(host.child.exitCode!==null)
      throw Error("PA05_E01I_UNRELATED_HOST_FAILED: "+host.getLog().slice(-1800));
    try{
      const r=await fetch("http://127.0.0.1:"+host.port+"/v1/catalog",{
        signal:AbortSignal.timeout(800)
      });
      if(r.status===200)return;
    }catch{}
    await pause(120);
  }
  throw Error("PA05_E01I_UNRELATED_HOST_NO_HTTP: "+host.getLog().slice(-1800));
}

for(const variant of ["ACTIVE","INSTALLED_DISABLED","ORPHAN_FEATURE"]){
  test("E01I actual Host startup refuses persisted unrecertified READ owner: "+variant,
    {timeout:55000},async()=>{
      const state=persistedHostState(variant);
      const before=readFileSync(state.file,"utf8");
      const host=await start(state);
      try{
        await untilExited(host);
        assert.notEqual(host.child.exitCode,0);
        assert.match(host.getLog(),
          /PA05_E01I_RESTORED_READ_OWNER_RECERTIFICATION_REQUIRED/);
        assert.equal(readFileSync(state.file,"utf8"),before,
          "denied restart must not rewrite persisted lifecycle");
      }finally{
        await host.stop();
        rmSync(state.dir,{recursive:true,force:true});
      }
    }
  );
}

test("E01I actual Host boot with unrelated persisted package remains available",{
  timeout:55000
},async()=>{
  const state=persistedHostState("UNRELATED");
  const host=await start(state);
  try{
    await untilServing(host);
    const response=await fetch("http://127.0.0.1:"+host.port+"/v1/catalog",{
      signal:AbortSignal.timeout(2000)
    });
    assert.equal(response.status,200);
    const catalog=await response.json();
    assert.equal(catalog.some(pkg=>pkg.packageId===protectedId),false);
    console.log("PA05_E01I_RESTART_QUARANTINE="+JSON.stringify({
      actualNodeHostProcess:true,
      activeOwnerRestartDenied:true,
      disabledInstalledOwnerRestartDenied:true,
      orphanActiveFeatureRestartDenied:true,
      unrelatedPersistenceStillStarts:true,
      durableMultiWorkerAuthorityCertified:false,
      actualHumanOrProviderCertified:false,
      productionWriteEnabled:false
    }));
  }finally{
    await host.stop();
    rmSync(state.dir,{recursive:true,force:true});
  }
});
