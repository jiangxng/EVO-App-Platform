import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createPackageCatalog} from "../../dist/catalog/catalog.js";
import {createMemoryLifecycleStore} from "../../dist/manager/store.js";
import {createAppManagerService} from "../../dist/manager/service.js";
import {
  hostEnterpriseContextProviderPackage,
  HOST_ENTERPRISE_CONTEXT_PACKAGE_ID,
  HOST_ENTERPRISE_CONTEXT_FEATURE_ID
} from "../../dist/providers/enterprise-context/package.js";
import {personalSavedViewsOptInFeatureV010} from
  "../../dist/providers/enterprise-context/personal-saved-views.js";
import {CV03_UNCERTIFIED_SAVED_VIEW_FEATURE_ID_V010} from
  "../../dist/manager/cv03-personal-saved-view-host-admission.js";

const id=CV03_UNCERTIFIED_SAVED_VIEW_FEATURE_ID_V010;
const pkg=HOST_ENTERPRISE_CONTEXT_PACKAGE_ID;
const admit=(packageId,featureId)=>
  featureId!==CV03_UNCERTIFIED_SAVED_VIEW_FEATURE_ID_V010;
function packageFixture(feature=personalSavedViewsOptInFeatureV010){
  const value=structuredClone(hostEnterpriseContextProviderPackage);
  value.features.push(structuredClone(feature));
  return value;
}
function managerFor(manifest,store=createMemoryLifecycleStore(),gate=admit){
  return createAppManagerService(createPackageCatalog([manifest]),store,
    ()=>new Date("2026-11-11T00:00:00.000Z"),
    new Map(),()=>{},undefined,undefined,gate);
}

test("N1-05b/05 Host denies opt-in Feature before any initial Package state mutation",()=>{
  const store=createMemoryLifecycleStore();
  const m=managerFor(packageFixture(),store);
  const prior=m.getSnapshot();
  const plan=m.planInstall(pkg);
  assert.ok(plan.blockers.some(x=>x.code==="FEATURE_ACTIVATION_NOT_ADMITTED"));
  assert.deepEqual(m.getSnapshot(),prior);
  assert.throws(()=>m.install(pkg),/FEATURE_ACTIVATION_NOT_ADMITTED/);
  assert.deepEqual(m.getSnapshot(),prior);
  // The same deny policy must not block other unrelated/default features.
  const base=managerFor(structuredClone(hostEnterpriseContextProviderPackage));
  base.install(pkg);
  assert.deepEqual(base.getSnapshot().activeFeatures.map(x=>x.featureId),
    [HOST_ENTERPRISE_CONTEXT_FEATURE_ID]);
});

test("N1-05b/05 real Manager enable cannot re-activate locally deactivated Saved View",()=>{
  const store=createMemoryLifecycleStore();
  const seed=managerFor(packageFixture(),store,()=>true);
  seed.install(pkg);
  seed.deactivateFeature(id);
  const safe=managerFor(packageFixture(),store,admit);
  const before=safe.getSnapshot();
  assert.deepEqual(before.activeFeatures.map(x=>x.featureId),
    [HOST_ENTERPRISE_CONTEXT_FEATURE_ID]);
  assert.ok(safe.planInstall(pkg).blockers.some(x=>
    x.code==="FEATURE_ACTIVATION_NOT_ADMITTED"));
  assert.throws(()=>safe.enable(pkg),/FEATURE_ACTIVATION_NOT_ADMITTED/);
  assert.throws(()=>safe.install(pkg),/FEATURE_ACTIVATION_NOT_ADMITTED/);
  assert.deepEqual(safe.getSnapshot(),before);
});

test("N1-05b/05 ON_DEMAND event cannot bypass Host activation veto",()=>{
  const opt=structuredClone(personalSavedViewsOptInFeatureV010);
  opt.defaultActivation=false;
  opt.activation={mode:"ON_DEMAND",events:["cv03.savedview.requested"]};
  const m=managerFor(packageFixture(opt));
  m.install(pkg);
  const before=m.getSnapshot();
  assert.equal(before.activeFeatures.length,1);
  assert.throws(()=>m.activateForEvent("cv03.savedview.requested"),
    /FEATURE_ACTIVATION_NOT_ADMITTED/);
  assert.deepEqual(m.getSnapshot(),before);
});

test("N1-05b/05 dependent Feature cannot activate forbidden feature transitively",()=>{
  const manifest=packageFixture();
  manifest.features.find(x=>x.featureId===id).defaultActivation=false;
  manifest.features.push({
    contractVersion:"0.1.0",featureId:"host-enterprise-context-provider.dependent",
    packageId:pkg,version:"0.1.0",activationScope:"INSTALLATION",
    defaultActivation:true,requiresFeatures:[id],
    providesCapabilities:["fixture.depends-on-save"]
  });
  const m=managerFor(manifest);
  const before=m.getSnapshot();
  assert.ok(m.planInstall(pkg).blockers.some(x=>
    x.code==="FEATURE_ACTIVATION_NOT_ADMITTED"));
  assert.throws(()=>m.install(pkg),/FEATURE_ACTIVATION_NOT_ADMITTED/);
  assert.deepEqual(m.getSnapshot(),before);
});

test("N1-05b/05 throwing Host policy is fail-closed, not an implicit ALLOW",()=>{
  const store=createMemoryLifecycleStore();
  const m=managerFor(packageFixture(),store,()=>{
    throw Error("CV03_PRODUCTION_AUTHORITY_UNREACHABLE");
  });
  const before=m.getSnapshot();
  assert.throws(()=>m.install(pkg),/CV03_PRODUCTION_AUTHORITY_UNREACHABLE/);
  assert.deepEqual(m.getSnapshot(),before);
});

test("N1-05b/05 actual production Host installs deny-by-default hook",()=>{
  const code=readFileSync(new URL("../../manager/server.ts",import.meta.url),"utf8");
  assert.match(code,/featureId !== CV03_UNCERTIFIED_SAVED_VIEW_FEATURE_ID_V010/);
  assert.match(code,/assertCv03UnadmittedPersistedFeatureAbsentV010\(restored\)/);
  assert.match(code,/assertCv03HumanSaveNotEnabledV010\(process\.env\)/);
  // This test does not certify any DB transaction, SQL privilege or Producer.
});
