import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,readFileSync,rmSync} from "node:fs";
import {spawn} from "node:child_process";
import {createServer} from "node:net";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createFileLifecycleStore} from "../../dist/manager/store.js";
import {
  assertCv03UnadmittedPersistedFeatureAbsentV010,
  CV03_UNCERTIFIED_SAVED_VIEW_FEATURE_ID_V010,
  assertCv03HumanSaveNotEnabledV010
} from "../../dist/manager/cv03-personal-saved-view-host-admission.js";
import {
  PERSONAL_SAVED_VIEW_FEATURE_V010,
  personalSavedViewsOptInFeatureV010
} from "../../dist/providers/enterprise-context/personal-saved-views.js";
import {HOST_ENTERPRISE_CONTEXT_FEATURE_ID}
  from "../../dist/providers/enterprise-context/package.js";

const pkg="host-enterprise-context-provider";
const feature=CV03_UNCERTIFIED_SAVED_VIEW_FEATURE_ID_V010;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function freePort(){
  const listener=createServer();
  await new Promise((resolve,reject)=>listener.once("error",reject)
    .listen(0,"127.0.0.1",resolve));
  const port=listener.address().port;
  await new Promise(resolve=>listener.close(resolve));
  return port;
}
function persistedState(variant){
  const dir=mkdtempSync(join(tmpdir(),"cv03-n104j-startup-"));
  const file=join(dir,"lifecycle.json");
  const store=createFileLifecycleStore(file);
  const now="2026-11-10T05:00:00.000Z";
  store.saveInstalledPackage({
    contractVersion:"0.1.0",packageId:pkg,version:"0.1.0",installedAt:now
  });
  if(variant==="ACTIVE_OPT_IN"||variant==="ORPHAN_CLAIM"){
    store.saveActiveFeature({
      contractVersion:"0.1.0",
      packageId:variant==="ACTIVE_OPT_IN"?pkg:"not-a-trusted-package",
      featureId:feature,version:"0.1.0",activatedAt:now
    });
  }else if(variant==="BASE_FEATURE"){
    store.saveActiveFeature({
      contractVersion:"0.1.0",packageId:pkg,
      featureId:HOST_ENTERPRISE_CONTEXT_FEATURE_ID,
      version:"0.1.0",activatedAt:now
    });
  }else if(variant!=="INACTIVE_METADATA")throw Error("UNSUPPORTED_TEST_CASE");
  return {dir,file};
}
async function spawnActualHost(state,{pageMode="OFF"}={}){
  const port=await freePort();
  // Never inherit production IdP, database, Railway, LLM credentials or
  // user-specific storage. Only a disposable file and loopback Node server.
  const env={
    PATH:process.env.PATH??"",HOME:state.dir,PORT:String(port),
    NODE_ENV:"test",APP_PLATFORM_STATE_FILE:state.file,
    APP_PLATFORM_CV03_HUMAN_SAVE_MODE:"OFF",
    APP_PLATFORM_CV03_PERSONAL_VIEW_PAGE_MODE:pageMode,
    APP_PLATFORM_PA05_E01D_ADMIN_READ_ADMISSION:"OFF"
  };
  const child=spawn(process.execPath,["dist/manager/server.js"],{
    cwd:process.cwd(),env,stdio:["ignore","pipe","pipe"]
  });
  let log="";
  for(const stream of [child.stdout,child.stderr])
    stream.on("data",buffer=>{log=(log+buffer.toString()).slice(-18000);});
  return {
    child,port,log:()=>log,
    async stop(){
      if(child.exitCode===null){
        child.kill("SIGTERM");
        await Promise.race([
          new Promise(resolve=>child.once("exit",resolve)),
          pause(2500)
        ]);
        if(child.exitCode===null)child.kill("SIGKILL");
      }
    }
  };
}
async function untilDenied(host){
  for(let i=0;i<120;i++){
    if(host.child.exitCode!==null)return;
    await pause(100);
  }
  throw Error("CV03_N104J_DENIAL_HOST_DID_NOT_EXIT: "+host.log().slice(-1100));
}
async function untilServing(host){
  for(let i=0;i<130;i++){
    if(host.child.exitCode!==null)
      throw Error("CV03_N104J_UNRELATED_HOST_EXITED: "+host.log().slice(-1100));
    try{
      const response=await fetch("http://127.0.0.1:"+host.port+"/v1/catalog",{
        signal:AbortSignal.timeout(750)
      });
      if(response.status===200)return;
    }catch{}
    await pause(120);
  }
  throw Error("CV03_N104J_UNRELATED_HOST_NOT_SERVING: "+host.log().slice(-1100));
}

test("N1-04j domain opt-in feature ID parity and pure startup denial",()=>{
  assert.equal(feature,PERSONAL_SAVED_VIEW_FEATURE_V010);
  assert.equal(feature,personalSavedViewsOptInFeatureV010.featureId);
  assert.notEqual(feature,HOST_ENTERPRISE_CONTEXT_FEATURE_ID);
  assert.throws(()=>assertCv03UnadmittedPersistedFeatureAbsentV010({
    activeFeatures:[{featureId:feature}]
  }),/CV03_N104J_RESTORED_SAVED_VIEW_FEATURE_RECERTIFICATION_REQUIRED/);
  assert.throws(()=>assertCv03UnadmittedPersistedFeatureAbsentV010({
    activeFeatures:null
  }),/CV03_N104J_RESTORED_SAVED_VIEW_FEATURE_RECERTIFICATION_REQUIRED/);
  assert.doesNotThrow(()=>assertCv03UnadmittedPersistedFeatureAbsentV010({
    activeFeatures:[{featureId:HOST_ENTERPRISE_CONTEXT_FEATURE_ID}]
  }));
  assert.doesNotThrow(()=>assertCv03HumanSaveNotEnabledV010({
    APP_PLATFORM_CV03_HUMAN_SAVE_MODE:"OFF"
  }));
  assert.throws(()=>assertCv03HumanSaveNotEnabledV010({
    APP_PLATFORM_CV03_HUMAN_SAVE_MODE:"ON"
  }),/CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED/);
});

for(const variant of ["ACTIVE_OPT_IN","ORPHAN_CLAIM"]){
  test("N1-04j actual Host denies restored unadmitted CV03 Feature: "+variant,
    {timeout:55000},async()=>{
      const state=persistedState(variant);
      const before=readFileSync(state.file,"utf8");
      const host=await spawnActualHost(state,{pageMode:"READ_ONLY"});
      try{
        await untilDenied(host);
        assert.notEqual(host.child.exitCode,0);
        assert.match(host.log(),
          /CV03_N104J_RESTORED_SAVED_VIEW_FEATURE_RECERTIFICATION_REQUIRED/);
        assert.equal(readFileSync(state.file,"utf8"),before,
          "denial must not silently rewrite the persisted operator state");
        console.log("CV03_N104J_REAL_HOST_RESTORED_FEATURE_QUARANTINE_"+variant+"=PASS");
      }finally{
        await host.stop();
        rmSync(state.dir,{recursive:true,force:true});
      }
    }
  );
}
for(const variant of ["INACTIVE_METADATA","BASE_FEATURE"]){
  test("N1-04j actual Host still serves with no active opt-in Feature: "+variant,
    {timeout:55000},async()=>{
      const state=persistedState(variant);
      const before=readFileSync(state.file,"utf8");
      const host=await spawnActualHost(state,{
        pageMode:variant==="INACTIVE_METADATA"?"READ_ONLY":"OFF"
      });
      try{
        await untilServing(host);
        const response=await fetch("http://127.0.0.1:"+host.port+"/v1/catalog",{
          signal:AbortSignal.timeout(2000)
        });
        assert.equal(response.status,200);
        // Ordinary Host startup is allowed to persist its existing
        // default/session/provider bootstrap packages. Preserve only the
        // caller-owned original records; never pretend startup does zero I/O.
        const after=JSON.parse(readFileSync(state.file,"utf8"));
        const prior=JSON.parse(before);
        for(const original of prior.installedPackages){
          assert.deepEqual(after.installedPackages.find(x=>
            x.packageId===original.packageId),original,
            "the original operator-owned installation remains intact");
        }
        for(const original of prior.activeFeatures){
          assert.deepEqual(after.activeFeatures.find(x=>
            x.featureId===original.featureId),original,
            "the original default Host Feature remains intact");
        }
        assert.ok(!after.activeFeatures.some(x=>x.featureId===feature),
          "a normal startup must never activate the uncertified CV03 Feature");
        console.log("CV03_N104J_REAL_HOST_UNRELATED_PERSISTENCE_"+variant+"=PASS");
      }finally{
        await host.stop();
        rmSync(state.dir,{recursive:true,force:true});
      }
    }
  );
}
