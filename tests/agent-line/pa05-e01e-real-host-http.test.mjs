import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtempSync,rmSync} from "node:fs";
import {createServer} from "node:net";
import {tmpdir} from "node:os";
import {join} from "node:path";

const PACKAGE_ID="evo-purchase-attention";
const ADMIN="e01e-throwaway-host-only";
const policy=JSON.stringify({contractVersion:"0.1.0",rules:[{
  id:"pa05-e01e-host-only-exact-plugin",effect:"ALLOW",
  actions:["host.plugin.read.admit"],subjectIds:["bootstrap-admin"],
  actorTypes:["HUMAN"],resourceTypes:["plugin-package"],
  resourceIds:[PACKAGE_ID]
},{
  id:"pa05-e01f-test-operator-lifecycle",effect:"ALLOW",
  actions:["host.plugin.lifecycle.install","host.plugin.lifecycle.enable",
    "host.plugin.lifecycle.disable","host.plugin.lifecycle.uninstall",
    "host.plugin.lifecycle.upgrade"],
  subjectIds:["bootstrap-admin"],actorTypes:["HUMAN"],
  resourceTypes:["plugin-package"],resourceIds:[PACKAGE_ID]
}]});
const admitOnlyPolicy=JSON.stringify({
  contractVersion:"0.1.0",
  rules:[{id:"e01e-admit-only",effect:"ALLOW",
    actions:["host.plugin.read.admit"],subjectIds:["bootstrap-admin"],
    actorTypes:["HUMAN"],resourceTypes:["plugin-package"],
    resourceIds:[PACKAGE_ID]}]
});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function freePort(){
  const server=createServer();
  await new Promise((resolve,reject)=>server
    .once("error",reject).listen(0,"127.0.0.1",resolve));
  const port=server.address().port;
  await new Promise(resolve=>server.close(resolve));
  return port;
}
async function startHost({mode="OFF",withPolicy=false,lifecycleAllowed=true}={}){
  const port=await freePort();
  const dir=mkdtempSync(join(tmpdir(),"pa05-e01e-host-"));
  const env={
    PATH:process.env.PATH??"",HOME:dir,PORT:String(port),
    NODE_ENV:"test",APP_PLATFORM_BOOTSTRAP_ADMIN_TOKEN:ADMIN,
    APP_PLATFORM_PA05_E01D_ADMIN_READ_ADMISSION:mode,
    APP_PLATFORM_AUTHORIZATION_POLICY_OVERLAY_JSON:
      withPolicy?(lifecycleAllowed?policy:admitOnlyPolicy):JSON.stringify({contractVersion:"0.1.0",rules:[]})
  };
  // Deliberately DO NOT inherit caller production DB/identity/key env vars.
  // This process is disposable; only its in-memory lifecycle may mutate.
  const child=spawn(process.execPath,["dist/manager/server.js"],{
    cwd:process.cwd(),env,stdio:["ignore","pipe","pipe"]
  });
  let log="";
  for(const stream of [child.stdout,child.stderr])stream.on("data",b=>{
    log=(log+b.toString()).slice(-18000);
  });
  const base="http://127.0.0.1:"+port;
  let ready=false;
  for(let i=0;i<160;i++){
    if(child.exitCode!==null)break;
    try{
      const r=await fetch(base+"/v1/catalog",{signal:AbortSignal.timeout(800)});
      if(r.status===200){ready=true;break;}
    }catch{}
    await pause(150);
  }
  if(!ready){
    child.kill("SIGKILL");
    rmSync(dir,{recursive:true,force:true});
    throw Error("PA05_E01E_REAL_HOST_START_FAILED: "+log.slice(-3200));
  }
  return {
    child,base,
    async stop(){
      if(child.exitCode===null){
        child.kill("SIGTERM");
        await Promise.race([
          new Promise(resolve=>child.once("exit",resolve)),pause(3000)
        ]);
        if(child.exitCode===null){child.kill("SIGKILL");}
      }
      rmSync(dir,{recursive:true,force:true});
    },
    getLog:()=>log
  };
}
async function api(host,path,{method="GET",bearer,body}={}){
  const response=await fetch(host.base+path,{
    method,
    headers:{
      ...(bearer===undefined?{}:{authorization:"Bearer "+bearer}),
      ...(body===undefined?{}:{"content-type":"application/json"})
    },
    ...(body===undefined?{}:{body:JSON.stringify(body)}),
    signal:AbortSignal.timeout(6500)
  });
  const payload=await response.json();
  return {status:response.status,payload};
}
const admit={packageId:PACKAGE_ID,confirmed:true};
const command={method:"POST",bearer:ADMIN,body:admit};
const includesPackage=arr=>Array.isArray(arr)&&arr.some(x=>x.packageId===PACKAGE_ID);

test("E01E actual Node Host HTTP: OFF has no catalog entry and rejects admin admission",{
  timeout:70000
},async()=>{
  const host=await startHost({mode:"OFF",withPolicy:true});
  try{
    const catalog=await api(host,"/v1/catalog");
    assert.equal(catalog.status,200);
    assert.equal(includesPackage(catalog.payload),false);
    const denied=await api(host,"/v1/admin/pa05/read-plugin/admit",command);
    assert.equal(denied.status,404);
    assert.equal(denied.payload.error.code,"PA05_E01D_ADMIN_NOT_ENABLED");
    assert.equal(includesPackage((await api(host,"/v1/catalog")).payload),false);
  }finally{await host.stop();}
});

test("E01E actual Node Host HTTP: authenticated admin + policy + explicit confirmation; original installer",{
  timeout:90000
},async()=>{
  const host=await startHost({mode:"OPT_IN",withPolicy:true});
  try{
    assert.equal(includesPackage((await api(host,"/v1/catalog")).payload),false);
    const absent=await api(host,"/v1/admin/pa05/read-plugin/admit",{
      method:"POST",body:admit
    });
    assert.equal(absent.status,403);
    const forged=await api(host,"/v1/admin/pa05/read-plugin/admit",{
      ...command,bearer:"wrong"
    });
    assert.equal(forged.status,403);
    const unconfirmed=await api(host,"/v1/admin/pa05/read-plugin/admit",{
      ...command,body:{packageId:PACKAGE_ID,confirmed:false}
    });
    assert.equal(unconfirmed.status,400);
    const unknown=await api(host,"/v1/admin/pa05/read-plugin/admit",{
      ...command,body:{...admit,loadFrom:"/tmp/arbitrary-plugin.js"}
    });
    assert.equal(unknown.status,400);
    assert.equal(includesPackage((await api(host,"/v1/catalog")).payload),false);
    const accepted=await api(host,"/v1/admin/pa05/read-plugin/admit",command);
    assert.equal(accepted.status,200,JSON.stringify(accepted.payload));
    assert.equal(accepted.payload.stage,"AVAILABLE_NOT_INSTALLED");
    assert.equal(accepted.payload.productionWriteEnabled,false);
    assert.equal(includesPackage((await api(host,"/v1/catalog")).payload),true);
    const snapshotBefore=await api(host,"/v1/platform/snapshot");
    assert.equal(snapshotBefore.status,200);
    assert.equal(includesPackage(snapshotBefore.payload.installedPackages),false);
    const plan=await api(host,"/v1/install/plan",{
      method:"POST",body:{packageId:PACKAGE_ID}
    });
    assert.equal(plan.status,200);
    assert.ok(Array.isArray(plan.payload.installPackages));
    assert.ok(plan.payload.installPackages.includes(PACKAGE_ID));
    const retry=await api(host,"/v1/admin/pa05/read-plugin/admit",command);
    assert.equal(retry.status,409);
    assert.equal(retry.payload.error.code,"ON_DEMAND_HOST_ALREADY_REGISTERED");
    // E01F closes the E01E-found bypass: body consent alone is insufficient.
    const untrustedInstall=await api(host,"/v1/install",{
      method:"POST",
      body:{packageId:PACKAGE_ID,trustApproved:true,approvedPermissions:[]}
    });
    assert.equal(untrustedInstall.status,403);
    assert.equal(untrustedInstall.payload.code,"PA05_E01F_LIFECYCLE_ADMIN_DENIED");
    assert.equal(includesPackage((await api(host,"/v1/platform/snapshot"))
      .payload.installedPackages),false);
    const install=await api(host,"/v1/install",{
      method:"POST",bearer:ADMIN,
      body:{packageId:PACKAGE_ID,trustApproved:true,approvedPermissions:[]}
    });
    assert.equal(install.status,200,JSON.stringify(install.payload));
    const snapshot=await api(host,"/v1/platform/snapshot");
    assert.equal(snapshot.status,200);
    assert.equal(includesPackage(snapshot.payload.installedPackages),true);
    const deniedDisable=await api(host,"/v1/disable",{
      method:"POST",body:{packageId:PACKAGE_ID}
    });
    assert.equal(deniedDisable.status,403);
    const disable=await api(host,"/v1/disable",{
      method:"POST",bearer:ADMIN,body:{packageId:PACKAGE_ID}
    });
    assert.equal(disable.status,200,JSON.stringify(disable.payload));
    const disabled=await api(host,"/v1/platform/snapshot");
    assert.equal(disabled.status,200);
    assert.equal(disabled.payload.activeFeatures.some(x=>
      x.packageId===PACKAGE_ID),false);
    console.log("PA05_E01E_REAL_HOST_HTTP="+JSON.stringify({
      actuallySpawnedNodeHost:true,realHttpRequests:true,
      defaultOffAndUnauthorizedDenied:true,bodyInjectionDenied:true,
      registeredInLiveOriginalHostCatalog:true,
      originalAppManagerInstallAndDisableThroughHttp:true,
      legacyInstallerWithoutAdminBearerObserved:false,
      formerlyUnguardedInstallerNowRejected:true,
      isolatedOperatorLifecycleAuthRequired:true,
      realOperatorInstallationAuthorizationCertified:false,
      realEnterpriseDataReadCertified:false,
      actualHumanOrAgentSessionsCertified:false,
      realModelProviderCertified:false,productionWriteEnabled:false
    }));
  }finally{await host.stop();}
});

test("E01E actual Host with missing policy denies even correct admin credential",{
  timeout:70000
},async()=>{
  const host=await startHost({mode:"OPT_IN",withPolicy:false});
  try{
    const denied=await api(host,"/v1/admin/pa05/read-plugin/admit",command);
    assert.equal(denied.status,403);
    assert.equal(includesPackage((await api(host,"/v1/catalog")).payload),false);
  }finally{await host.stop();}
});

test("E01F actual Host HTTP: every direct and plugin-store lifecycle mutation refuses anonymous, wrong and policy-unapproved callers",{
  timeout:90000
},async()=>{
  const host=await startHost({mode:"OPT_IN",withPolicy:true,lifecycleAllowed:false});
  try{
    const admitResult=await api(host,"/v1/admin/pa05/read-plugin/admit",command);
    assert.equal(admitResult.status,200,JSON.stringify(admitResult.payload));
    const direct=[
      ["/v1/install",{packageId:PACKAGE_ID,trustApproved:true,approvedPermissions:[]}],
      ["/v1/enable",{packageId:PACKAGE_ID}],
      ["/v1/disable",{packageId:PACKAGE_ID}],
      ["/v1/uninstall",{packageId:PACKAGE_ID}],
      ["/v1/upgrade",{packageId:PACKAGE_ID,trustApproved:true,approvedPermissions:[]}]
    ];
    for(const [path,body] of direct){
      for(const bearer of [undefined,"wrong",ADMIN]){
        const res=await api(host,path,{method:"POST",bearer,body});
        assert.equal(res.status,403,path+" bearer="+String(bearer));
        assert.equal(res.payload.code,"PA05_E01F_LIFECYCLE_ADMIN_DENIED");
      }
    }
    for(const code of ["app-platform.install-package",
      "app-platform.enable-package","app-platform.disable-package",
      "app-platform.uninstall-package","app-platform.upgrade-package"]){
      const req={contractVersion:"0.1.0",type:"command",
        command:{code,inputVersion:"0.1.0"},
        values:{itemId:PACKAGE_ID,confirmed:true,trustApproved:true},
        sourceInteractionId:"e01f-http",actionId:"e01f-"+code,
        requiresConfirmation:false};
      for(const bearer of [undefined,"wrong",ADMIN]){
        const res=await api(host,"/v1/actions",{
          method:"POST",bearer,body:req
        });
        assert.equal(res.status,403,code+" bearer="+String(bearer));
        assert.equal(res.payload.error.code,"PA05_E01F_LIFECYCLE_ADMIN_DENIED");
      }
    }
    assert.equal(includesPackage((await api(host,"/v1/platform/snapshot"))
      .payload.installedPackages),false);
    console.log("PA05_E01F_REAL_HOST_LIFECYCLE="+JSON.stringify({
      realHttpNegativeDirectRoutes:5,realHttpNegativeActionCodes:5,
      testedBearerVariants:3,policyDenyCannotBeOverriddenByToken:true,
      spoofedBodyConfirmationDenied:true,
      noUnauthorizedTargetInstall:true,
      defaultProductionWriteEnabled:false,
      realHumanOperatorAcceptance:false
    }));
  }finally{await host.stop();}
});
