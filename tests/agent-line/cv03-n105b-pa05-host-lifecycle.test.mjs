import test from "node:test";
import assert from "node:assert/strict";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {createMemoryLifecycleStore} from "../../dist/manager/store.js";
import {createHostStaticAuthorizationProviderV010} from
  "../../dist/providers/authorization/runtime.js";
import {
  HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,
  HOST_ENTERPRISE_CONTEXT_FEATURE_ID,
  hostEnterpriseContextProviderPackage
} from "../../dist/providers/enterprise-context/package.js";
import {personalSavedViewsOptInFeatureV010}
  from "../../dist/providers/enterprise-context/personal-saved-views.js";
import {CV03_UNCERTIFIED_SAVED_VIEW_FEATURE_ID_V010} from
  "../../dist/manager/cv03-personal-saved-view-host-admission.js";
import {createCv03N105bDenyT0FromExecutorV010} from
  "../../dist/manager/cv03-n105b-authority-t0-pg.js";
import {createCv03N105bPa05HostLifecycleBarrierV010} from
  "../../dist/manager/cv03-n105b-pa05-host-lifecycle.js";

const packageId=HOST_ENTERPRISE_CONTEXT_PACKAGE_ID;
const featureId=CV03_UNCERTIFIED_SAVED_VIEW_FEATURE_ID_V010;
const generation="generation-20261111";
const opKey="host-minted-full-scope-deny-0001";
// Synthetic, explicitly exclusive package fixture for ordering tests ONLY.
 // The real enterprise-context provider is shared and must always fail CLOSED.
function fixture(events=[]){
  const pkg={
    contractVersion:"0.1.0",packageId,displayName:"CV03 exclusive test fixture",
    version:"0.1.0",type:"PLATFORM_PROVIDER",
    features:[{
      contractVersion:"0.1.0",featureId,packageId,version:"0.1.0",
      activationScope:"INSTALLATION",defaultActivation:true,
      providesCapabilities:["enterprise.collection.saved-view"],
      contributions:[]
    }]
  };
  const manager=createAppManagerService(
    createPackageCatalog([pkg]),createMemoryLifecycleStore(),
    ()=>new Date("2026-11-11T00:00:00Z"),new Map(),
    event=>events.push("manager:"+event.type)
  );
  manager.install(packageId);
  events.length=0;
  return manager;
}
function result(values,override={}){
  return {
    authenticated_host_id:values[0],
    operation_key:values[1],
    package_id:values[2],
    feature_id:values[3],
    source_generation:values[4],
    operation:values[5],
    package_state:"FROZEN_ALL_SCOPES",
    fence_id:"fence-pg-authority-001",
    outbox_batch_id:"outbox-batch-immutable-001",
    scope_count:"9",replayed:false,...override
  };
}
function authority(sql){
  return createCv03N105bDenyT0FromExecutorV010({
    schema:"approved_schema",trustedHostId:"pa05-host-01",
    sql:{query:sql}
  });
}
function auth(allow=true,subject="host-operator"){
  const rules=allow?[{
    id:"host-operator-permit",effect:"ALLOW",
    actions:["app-platform.lifecycle.disable","app-platform.lifecycle.uninstall"],
    subjectIds:["host-operator"],actorTypes:["HUMAN"],
    resourceTypes:["platform.package"],resourceIds:[packageId]
  }]:[];
  const provider=createHostStaticAuthorizationProviderV010({
    contractVersion:"0.1.0",rules
  });
  return async operation=>{
    const decision=await provider.check({
      contractVersion:"0.1.0",
      principal:{contractVersion:"0.1.0",subjectId:subject,actorType:"HUMAN",
        identityProviderId:"host.trusted-operator"},
      scope:{contractVersion:"0.1.0"},
      action:"app-platform.lifecycle."+operation.toLowerCase(),
      resource:{type:"platform.package",id:packageId}
    });
    return decision.contractVersion==="0.1.0"&&
      decision.policyProviderId===provider.providerId&&decision.allowed===true;
  };
}
function barrier(manager,db,allow=auth(true)){
  return createCv03N105bPa05HostLifecycleBarrierV010({
    manager,authority:db,authorizeHostOperator:allow,
    sourceGeneration:generation
  });
}

test("N1-05b/02 package T0 uses one database function call and no scope-by-scope loop",async()=>{
  const calls=[],db=authority(async(statement,values)=>{
    calls.push({statement,values});return [result(values)];
  });
  const receipt=await db.fencePackage({
    operationKey:opKey,sourceGeneration:generation,operation:"DISABLE"
  });
  assert.deepEqual(receipt,{
    sourceGeneration:generation,fenceId:"fence-pg-authority-001",
    outboxBatchId:"outbox-batch-immutable-001",scopesFenced:9,replayed:false
  });
  assert.equal(calls.length,1);
  assert.match(calls[0].statement,/cv03_n105b_fence_package_t0/);
  assert.doesNotMatch(calls[0].statement,/\b(?:INSERT|UPDATE|DELETE|ALTER|CREATE|DROP)\b/i);
  assert.deepEqual(calls[0].values.slice(2,4),[packageId,featureId]);
});

test("N1-05b/02 rejects invalid scope, mismatched receipt and partial DB response",async()=>{
  let calls=0;
  const bad=authority(async(sql,values)=>{calls++;return [result(values)]});
  for(const change of [{operationKey:""},{sourceGeneration:"none"},
    {operation:"GRANT"},{operation:"RESTART"}]){
    await assert.rejects(()=>bad.fencePackage({
      operationKey:opKey,sourceGeneration:generation,operation:"DISABLE",...change
    }));
  }
  assert.equal(calls,0);
  const changes=[
    {authenticated_host_id:"another-host"},{operation_key:"wrong"},
    {package_id:"wrong"},{feature_id:"wrong"},{source_generation:"old"},
    {package_state:"PARTIAL"},{operation:"UNINSTALL"},
    {fence_id:""},{outbox_batch_id:""},{scope_count:"-1"},
    {scope_count:"9007199254740992"},{replayed:"true"}
  ];
  for(const changed of changes){
    const db=authority(async(sql,values)=>[result(values,changed)]);
    await assert.rejects(()=>db.fencePackage({
      operationKey:opKey,sourceGeneration:generation,operation:"DISABLE"
    }),/CV03_N105B_PACKAGE_FENCE_UNVERIFIABLE/);
  }
  for(const behavior of [async()=>[],async(sql,values)=>[result(values),result(values)],
    async()=>{throw Error("connection lost")}]) {
    const db=authority(behavior);
    await assert.rejects(()=>db.fencePackage({
      operationKey:opKey,sourceGeneration:generation,operation:"DISABLE"
    }));
  }
});

test("N1-05b/02 existing real Manager disables ONLY after DB full-scope fence",async()=>{
  const order=[],manager=fixture(order);
  let pending=false;
  const db=authority(async(sql,values)=>{
    order.push("db:full-scope-fence");
    assert.equal(manager.getSnapshot().activeFeatures.length,1);
    pending=true;
    return [result(values)];
  });
  const host=barrier(manager,db,async op=>{
    order.push("provider:allow");
    return auth(true)(op);
  });
  const after=await host.apply("DISABLE",opKey);
  assert.deepEqual(order.slice(0,2),["provider:allow","db:full-scope-fence"]);
  assert.equal(pending,true);
  assert.ok(order.slice(2).includes("manager:FEATURE_DEACTIVATED"));
  assert.equal(after.activeFeatures.length,0);
  assert.equal(after.installedPackages.length,1);
});

test("N1-05b/02 failed DB/preflight or missing Provider never runs real Manager lifecycle",async()=>{
  for(const cause of ["unavailable","provider-denied","wrong-fence","missing-feature"]){
    const order=[],manager=fixture(order);
    let sqlCalls=0;
    if(cause==="missing-feature")manager.deactivateFeature(featureId);
    order.length=0;
    const db=authority(async(sql,values)=>{
      sqlCalls++;order.push("db:attempt");
      if(cause==="unavailable")throw Error("PG is unavailable");
      if(cause==="wrong-fence")return [result(values,{package_state:"PARTIAL"})];
      return [result(values)];
    });
    const host=barrier(manager,db,cause==="provider-denied"?auth(false):auth(true));
    await assert.rejects(()=>host.apply("DISABLE",opKey));
    assert.equal(order.some(x=>x.startsWith("manager:")),false,cause);
    if(cause==="provider-denied"||cause==="missing-feature")assert.equal(sqlCalls,0);
    if(cause!=="missing-feature")
      assert.equal(manager.getSnapshot().activeFeatures.length,1);
  }
});

test("N1-05b/02 recovery replays durable T0 after local Manager failure",async()=>{
  const events=[],manager=fixture(events);
  let fails=true,calls=0;
  const wrapper={
    listCatalog:()=>manager.listCatalog(),
    getSnapshot:()=>manager.getSnapshot(),
    planDeactivateFeature:id=>manager.planDeactivateFeature(id),
    deactivateFeature:id=>{
      if(fails){fails=false;throw Error("simulated local persistence crash");}
      return manager.deactivateFeature(id);
    }
  };
  const db=authority(async(sql,values)=>{
    calls++;return [result(values,{replayed:calls>1})];
  });
  const host=barrier(wrapper,db);
  await assert.rejects(()=>host.apply("DISABLE",opKey),/simulated local persistence crash/);
  assert.equal(manager.getSnapshot().activeFeatures.length,1);
  const recovered=await host.recover("DISABLE",opKey);
  assert.equal(recovered.activeFeatures.length,0);
  assert.equal(calls,2);
  const replay=await host.recover("DISABLE",opKey);
  assert.equal(replay.activeFeatures.length,0);
  assert.equal(calls,3);
});

test("N1-05b/04 never mistakes Feature DISABLE for Package UNINSTALL",async()=>{
  const manager=fixture(),prior=manager.getSnapshot();
  let calls=0;
  const db=authority(async(sql,values)=>{calls++;return [result(values)]});
  await assert.rejects(()=>barrier(manager,db).apply("UNINSTALL",opKey),
    /CV03_N105B_HOST_FEATURE_UNINSTALL_UNSUPPORTED/);
  assert.equal(calls,0);
  assert.deepEqual(manager.getSnapshot(),prior);
});

test("N1-05b/02 concurrent local calls deny while first fence is unresolved",async()=>{
  const manager=fixture();
  let release;
  const wait=new Promise(resolve=>{release=resolve;});
  const db=authority(async(sql,values)=>{await wait;return [result(values)]});
  const host=barrier(manager,db);
  const first=host.apply("DISABLE",opKey);
  await assert.rejects(()=>host.apply("DISABLE",opKey),
    /CV03_N105B_HOST_LIFECYCLE_IN_FLIGHT/);
  release();
  await first;
  assert.equal(manager.getSnapshot().activeFeatures.length,0);
});

test("N1-05b/04 real shared provider keeps Default while deactivating Saved View",async()=>{
  const events=[];
  const pkg=structuredClone(hostEnterpriseContextProviderPackage);
  pkg.features.push(structuredClone(personalSavedViewsOptInFeatureV010));
  const store=createMemoryLifecycleStore();
  const manager=createAppManagerService(createPackageCatalog([pkg]),store,
    ()=>new Date("2026-11-11T00:00:00Z"),new Map(),
    event=>events.push(event.type));
  manager.install(packageId);
  const before=manager.getSnapshot();
  assert.deepEqual(manager.planDisable(packageId).deactivateFeatures.sort(),
    [HOST_ENTERPRISE_CONTEXT_FEATURE_ID,featureId].sort());
  assert.deepEqual(manager.planDeactivateFeature(featureId).deactivateFeatures,[featureId]);
  events.length=0;
  let calls=0;
  const db=authority(async(sql,values)=>{calls++;return [result(values)]});
  const host=barrier(manager,db);
  const after=await host.apply("DISABLE",opKey);
  assert.equal(calls,1);
  assert.equal(after.activeFeatures.length,1);
  assert.deepEqual(after.activeFeatures[0],
    before.activeFeatures.find(x=>x.featureId===HOST_ENTERPRISE_CONTEXT_FEATURE_ID));
  assert.deepEqual(after.installedPackages,before.installedPackages);
  assert.deepEqual(after.effectiveCapabilities,
    before.effectiveCapabilities.filter(x=>x!=="enterprise.collection.saved-view"));
  assert.deepEqual(events,["FEATURE_DEACTIVATED"]);
  assert.deepEqual(await host.recover("DISABLE",opKey),after);
  assert.equal(calls,2);
  await assert.rejects(()=>host.apply("UNINSTALL",opKey),
    /CV03_N105B_HOST_FEATURE_UNINSTALL_UNSUPPORTED/);
  assert.equal(calls,2);
});

test("N1-05b/04 inactive default remains available in shared Package metadata",async()=>{
  const pkg=structuredClone(hostEnterpriseContextProviderPackage);
  pkg.features.push(structuredClone(personalSavedViewsOptInFeatureV010));
  const store=createMemoryLifecycleStore();
  const manager=createAppManagerService(createPackageCatalog([pkg]),store);
  manager.install(packageId);
  store.deleteActiveFeature(HOST_ENTERPRISE_CONTEXT_FEATURE_ID);
  const before=manager.getSnapshot();
  let calls=0;
  const host=barrier(manager,authority(async(sql,values)=>{
    calls++;return [result(values)];
  }));
  const after=await host.apply("DISABLE",opKey);
  assert.equal(calls,1);
  assert.deepEqual(after.activeFeatures,[]);
  assert.deepEqual(after.installedPackages,before.installedPackages);
  assert.ok(manager.listCatalog().find(x=>x.packageId===packageId)
    ?.features.some(x=>x.featureId===HOST_ENTERPRISE_CONTEXT_FEATURE_ID));
});

test("N1-05b/03 post-T0 same-package drift rejects local mutation",async()=>{
  const manager=fixture();
  const storeManager=manager;
  let mutated=false;
  const db=authority(async(sql,values)=>{
    // This mock cannot certify a real T0; it tests local drift detection.
    // If any post-fence package change is seen, do not call Manager.disable().
    mutated=true;
    return [result(values)];
  });
  const proxy={
    listCatalog:()=>storeManager.listCatalog(),
    getSnapshot:()=>{
      const snapshot=storeManager.getSnapshot();
      if(mutated && snapshot.installedPackages.length){
        snapshot.installedPackages[0].version="unexpected-version";
      }
      return snapshot;
    },
    planDeactivateFeature:id=>storeManager.planDeactivateFeature(id),
    deactivateFeature:()=>{throw Error("MUST_NOT_MUTATE");}
  };
  const host=barrier(proxy,db);
  await assert.rejects(
    ()=>host.apply("DISABLE",opKey),
    /CV03_N105B_HOST_LIFECYCLE_LOCAL_DRIFT/
  );
  assert.equal(storeManager.getSnapshot().activeFeatures.length,1);
});

test("N1-05b/02 no default Host registration or uncertified SAVE admission change",async()=>{
  const src=await import("../../dist/manager/cv03-personal-saved-view-host-admission.js");
  assert.throws(()=>src.assertCv03HumanSaveNotEnabledV010({
    APP_PLATFORM_CV03_HUMAN_SAVE_MODE:"ON"
  }),/CV03_HUMAN_SAVE_PRODUCTION_ADMISSION_REQUIRED/);
  const manager=fixture();
  const bad=()=>createCv03N105bPa05HostLifecycleBarrierV010({
    manager,authority:{fencePackage:async()=>({})},sourceGeneration:"",
    authorizeHostOperator:auth(true)
  });
  assert.throws(bad,/CV03_N105B_HOST_LIFECYCLE_CONFIGURATION_INVALID/);
});
