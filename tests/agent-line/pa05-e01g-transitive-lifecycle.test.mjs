import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {createMemoryLifecycleStore} from "../../dist/manager/store.js";
import {tradingReferencePackageV010} from "../../dist/apps/trading-reference/package.js";
import {purchaseAttentionPackageV010} from "../../dist/apps/purchase-attention/package.js";
import {pa05ProtectedReadLifecycleImpactV010}
  from "../../dist/manager/pa05-protected-read-lifecycle-impact.js";

const protectedId="evo-purchase-attention";
const dependentId="evo-pa05-e01g-dependent-fixture";
function setup(){
  const dependent=structuredClone(purchaseAttentionPackageV010);
  dependent.packageId=dependentId;
  dependent.displayName="E01G isolated dependent";
  dependent.features=[{
    ...dependent.features[0],packageId:dependentId,
    featureId:dependentId+".default",
    providesCapabilities:["pa05.e01g.fixture"],
    requiresCapabilities:["purchase.attention"],contributions:[]
  }];
  const manager=createAppManagerService(
    createPackageCatalog([tradingReferencePackageV010,
      purchaseAttentionPackageV010,dependent]),createMemoryLifecycleStore());
  const impact=(pkg,operation)=>pa05ProtectedReadLifecycleImpactV010({
    manager,requestedPackageId:pkg,protectedPackageId:protectedId,operation
  });
  return {manager,dependent,impact};
}

test("E01G: genuine AppManager install plan brings READ Owner transitively, not just requested package",()=>{
  const f=setup();
  const plan=f.manager.planInstall(dependentId);
  assert.deepEqual(plan.blockers,[]);
  assert.ok(plan.installPackages.includes(dependentId));
  assert.ok(plan.installPackages.includes(protectedId));
  assert.ok(plan.installPackages.includes(tradingReferencePackageV010.packageId));
  assert.equal(f.impact(dependentId,"INSTALL"),"TRANSITIVE_INSTALL");
  // Direct-only E01F checking requestedPackageId would have missed it.
  assert.equal(dependentId===protectedId,false);
});

test("E01G: already-installed but DISABLED protected dependency can be reactivated transitively",()=>{
  const f=setup();
  f.manager.install(protectedId);
  f.manager.disable(protectedId);
  assert.equal(f.manager.getSnapshot().activeFeatures.some(x=>
    x.packageId===protectedId),false);
  const plan=f.manager.planInstall(dependentId);
  assert.equal(plan.installPackages.includes(protectedId),false);
  assert.ok(plan.activateFeatures.includes(purchaseAttentionPackageV010.features[0].featureId));
  assert.equal(f.impact(dependentId,"INSTALL"),"TRANSITIVE_ACTIVATION");
  assert.equal(f.impact(dependentId,"ENABLE"),"TRANSITIVE_ACTIVATION");
});

test("E01G: already active dependency not falsely described as newly activated",()=>{
  const f=setup();f.manager.install(protectedId);
  const plan=f.manager.planInstall(dependentId);
  assert.equal(plan.installPackages.includes(protectedId),false);
  assert.equal(plan.activateFeatures.includes(purchaseAttentionPackageV010.features[0].featureId),false);
  assert.equal(f.impact(dependentId,"INSTALL"),"NONE");
});

test("E01G: direct operations always protected, unrelated plans and non-transitive actions unchanged",()=>{
  const f=setup();
  for(const operation of ["INSTALL","ENABLE","DISABLE","UNINSTALL","UPGRADE"]){
    assert.equal(f.impact(protectedId,operation),"DIRECT");
  }
  assert.equal(f.impact("other-not-in-catalog","INSTALL"),"NONE");
  assert.equal(f.impact(dependentId,"DISABLE"),"NONE");
  assert.equal(f.impact(dependentId,"UNINSTALL"),"NONE");
  assert.equal(f.impact(dependentId,"UPGRADE"),"NONE");
  assert.equal(f.impact(undefined,"INSTALL"),"NONE");
  assert.equal(f.impact(dependentId,"UNKNOWN"),"NONE");
});

test("E01G: initial plan is side-effect-free, and guard re-reads current plan on each call",()=>{
  const f=setup();
  const before=f.manager.getSnapshot();
  assert.equal(f.impact(dependentId,"INSTALL"),"TRANSITIVE_INSTALL");
  assert.deepEqual(f.manager.getSnapshot(),before);
  // A privileged Host may permit a signed installation. Once the protected
  // dependency is active, a new plan correctly reflects current state.
  f.manager.install(protectedId);
  assert.equal(f.impact(dependentId,"INSTALL"),"NONE");
  f.manager.disable(protectedId);
  assert.equal(f.impact(dependentId,"INSTALL"),"TRANSITIVE_ACTIVATION");
});

test("E01G: real Host has no eager READ plugin import, and checks both HTTP+Action requests before mutation",()=>{
  const host=readFileSync(new URL("../../manager/server.ts",import.meta.url),"utf8");
  assert.match(host,/await import\("\.\/pa05-protected-read-lifecycle-impact\.js"\)/);
  assert.match(host,/requestedPackageId: packageId/);
  assert.match(host,/operation !== "INSTALL" && operation !== "ENABLE"/);
  assert.match(host,/pa05ProtectedOperation && itemId\s*&&/);
  assert.doesNotMatch(host,/pa05ProtectedOperation && itemId === pa05E01fProtectedPackageId/);
  assert.doesNotMatch(host,/^import .*purchase-attention/m);
  for(const op of ["INSTALL","ENABLE"]){
    assert.ok(host.includes(`authorizePa05E01fLifecycle(request, body.packageId, "${op}")`));
  }
  console.log("PA05_E01G_TRANSITIVE_LIFECYCLE="+JSON.stringify({
    actualManagerDependencyPlan:true,
    uninstalledProtectedDependencyDetected:true,
    disabledProtectedFeatureReactivationDetected:true,
    directAndActionRoutesNowPlanAware:true,
    noNewDefaultHostPluginImports:true,
    realProductionWorkerOrHumanCertified:false,
    productionWriteEnabled:false
  }));
});
