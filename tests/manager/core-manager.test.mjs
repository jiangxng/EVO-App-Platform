import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";

const provider = {
  contractVersion: "0.1.0",
  packageId: "fixture-provider",
  displayName: "Fixture Provider",
  version: "0.1.0",
  type: "RUNTIME_EXTENSION",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: "fixture-provider.default",
      packageId: "fixture-provider",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: ["fixture.capability"]
    }
  ]
};

const consumer = {
  contractVersion: "0.1.0",
  packageId: "fixture-consumer",
  displayName: "Fixture Consumer",
  version: "0.1.0",
  type: "APPLICATION",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: "fixture-consumer.default",
      packageId: "fixture-consumer",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      requiresCapabilities: ["fixture.capability"],
      providesCapabilities: ["fixture.consumer"]
    }
  ]
};

test("core lifecycle resolves capability dependencies using synthetic protocol fixtures", () => {
  const manager = createAppManagerService(
    createPackageCatalog([provider, consumer]),
    createMemoryLifecycleStore(),
    () => new Date("2026-09-25T00:00:00Z")
  );

  const plan = manager.planInstall("fixture-consumer");
  assert.deepEqual(plan.blockers, []);
  assert.deepEqual(plan.installPackages, ["fixture-consumer", "fixture-provider"]);
  assert.deepEqual(plan.activateFeatures, [
    "fixture-consumer.default",
    "fixture-provider.default"
  ]);

  const snapshot = manager.install("fixture-consumer");
  assert.deepEqual(snapshot.effectiveCapabilities, [
    "fixture.capability",
    "fixture.consumer"
  ]);
});

test("core lifecycle prevents disabling a capability provider with an active dependent", () => {
  const manager = createAppManagerService(
    createPackageCatalog([provider, consumer]),
    createMemoryLifecycleStore()
  );

  manager.install("fixture-consumer");
  const plan = manager.planDisable("fixture-provider");

  assert.ok(plan.blockers.some(blocker => blocker.code === "ACTIVE_DEPENDENT_CAPABILITY"));
  assert.throws(() => manager.disable("fixture-provider"), /DISABLE_BLOCKED/);
});


test("core lifecycle upgrade requires approval for newly requested required permissions", () => {
  const upgradedProvider = {
    ...structuredClone(provider),
    version: "0.2.0",
    permissions: [{
      id: "fixture.write",
      label: "Fixture write",
      risk: "MEDIUM",
      required: true
    }],
    features: provider.features.map(feature => ({
      ...structuredClone(feature),
      version: "0.2.0"
    }))
  };
  const store = createMemoryLifecycleStore();
  store.saveInstalledPackage({
    packageId: provider.packageId,
    version: "0.1.0",
    installedAt: "2026-10-09T00:00:00.000Z",
    trustApproved: true,
    grantedPermissions: []
  });
  store.saveActiveFeature({
    featureId: provider.features[0].featureId,
    packageId: provider.packageId,
    version: "0.1.0",
    activatedAt: "2026-10-09T00:00:00.000Z"
  });

  const manager = createAppManagerService(
    createPackageCatalog([upgradedProvider]),
    store,
    () => new Date("2026-10-09T00:01:00.000Z")
  );
  const plan = manager.planUpgrade(provider.packageId);
  assert.deepEqual(plan.blockers, []);
  assert.equal(plan.requiresUserApproval, true);
  assert.deepEqual(
    plan.requestedPermissions.map(permission => permission.id),
    ["fixture.write"]
  );
  assert.throws(
    () => manager.upgrade(provider.packageId),
    /UPGRADE_PERMISSION_APPROVAL_REQUIRED/
  );

  const snapshot = manager.upgrade(provider.packageId, {
    approvedPermissions: ["fixture.write"]
  });
  assert.equal(snapshot.installedPackages[0].version, "0.2.0");
  assert.deepEqual(snapshot.installedPackages[0].grantedPermissions, [
    "fixture.write"
  ]);
  assert.equal(snapshot.activeFeatures[0].version, "0.2.0");
});


test("data import target contributions are visible only while their owning feature is active", () => {
  const targetPackage = {
    contractVersion: "0.1.0",
    packageId: "fixture-import-owner",
    displayName: "Fixture Import Owner",
    version: "0.1.0",
    type: "APPLICATION",
    features: [{
      contractVersion: "0.1.0",
      featureId: "fixture-import-owner.default",
      packageId: "fixture-import-owner",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      contributions: [{
        kind: "platform.data-import-target",
        target: {
          contractVersion: "0.1.0",
          targetId: "fixture.subject",
          objectType: "fixture.subject",
          label: { default: "Fixtures" },
          binding: {
            type: "HOST_FACTORY",
            ref: "fixture.import-target.v0.1"
          }
        }
      }]
    }]
  };
  const manager = createAppManagerService(
    createPackageCatalog([targetPackage]),
    createMemoryLifecycleStore(),
    () => new Date("2026-10-09T12:00:00.000Z")
  );

  assert.deepEqual(manager.listEffectiveDataImportTargets(), []);

  manager.install("fixture-import-owner");
  assert.deepEqual(manager.listEffectiveDataImportTargets(), [{
    contractVersion: "0.1.0",
    targetId: "fixture.subject",
    objectType: "fixture.subject",
    label: { default: "Fixtures" },
    binding: {
      type: "HOST_FACTORY",
      ref: "fixture.import-target.v0.1"
    },
    packageId: "fixture-import-owner",
    featureId: "fixture-import-owner.default"
  }]);

  manager.disable("fixture-import-owner");
  assert.deepEqual(manager.listEffectiveDataImportTargets(), []);
});


test("one Feature deactivation keeps shared Package and sibling capabilities",()=>{
  const shared={contractVersion:"0.1.0",packageId:"fixture-shared",
    displayName:"Shared",version:"0.1.0",type:"PLATFORM_PROVIDER",
    features:[{
      contractVersion:"0.1.0",featureId:"fixture-shared.default",
      packageId:"fixture-shared",version:"0.1.0",activationScope:"INSTALLATION",
      defaultActivation:true,providesCapabilities:["enterprise.directory"]
    },{
      contractVersion:"0.1.0",featureId:"fixture-shared.optional",
      packageId:"fixture-shared",version:"0.1.0",activationScope:"INSTALLATION",
      defaultActivation:true,providesCapabilities:["enterprise.optional"]
    }]};
  const events=[];
  const manager=createAppManagerService(
    createPackageCatalog([shared]),createMemoryLifecycleStore(),
    ()=>new Date("2026-11-11T00:00:00Z"),new Map(),e=>events.push(e)
  );
  manager.install("fixture-shared");
  const before=manager.getSnapshot();
  const plan=manager.planDeactivateFeature("fixture-shared.optional");
  assert.deepEqual(plan.blockers,[]);
  assert.deepEqual(plan.deactivateFeatures,["fixture-shared.optional"]);
  assert.equal(plan.operation,"DEACTIVATE");
  assert.equal(plan.sideEffectFree,true);
  assert.deepEqual(manager.getSnapshot(),before);
  events.length=0;
  const after=manager.deactivateFeature("fixture-shared.optional");
  assert.equal(after.activeFeatures.length,1);
  assert.equal(after.activeFeatures[0].featureId,"fixture-shared.default");
  assert.deepEqual(after.installedPackages,before.installedPackages);
  assert.deepEqual(after.effectiveCapabilities,["enterprise.directory"]);
  assert.deepEqual(events.map(e=>[e.type,e.featureId]),[
    ["FEATURE_DEACTIVATED","fixture-shared.optional"]
  ]);
  assert.equal(manager.planDeactivateFeature("fixture-shared.optional").blockers[0].code,
    "FEATURE_NOT_ACTIVE");
  assert.throws(()=>manager.deactivateFeature("fixture-shared.optional"),
    /FEATURE_DEACTIVATION_BLOCKED/);
});

test("one Feature cut refuses same-Package and external dependent Features",()=>{
  const shared={contractVersion:"0.1.0",packageId:"fixture-deps",
    displayName:"Deps",version:"0.1.0",type:"PLATFORM_PROVIDER",
    features:[{
      contractVersion:"0.1.0",featureId:"fixture-deps.target",
      packageId:"fixture-deps",version:"0.1.0",activationScope:"INSTALLATION",
      defaultActivation:true,providesCapabilities:["fixture.target.cap"]
    },{
      contractVersion:"0.1.0",featureId:"fixture-deps.sibling",
      packageId:"fixture-deps",version:"0.1.0",activationScope:"INSTALLATION",
      defaultActivation:true,requiresFeatures:["fixture-deps.target"]
    }]};
  const consumer={contractVersion:"0.1.0",packageId:"fixture-external",
    displayName:"External",version:"0.1.0",type:"APPLICATION",
    features:[{
      contractVersion:"0.1.0",featureId:"fixture-external.default",
      packageId:"fixture-external",version:"0.1.0",activationScope:"INSTALLATION",
      defaultActivation:true,requiresCapabilities:["fixture.target.cap"]
    }]};
  const manager=createAppManagerService(
    createPackageCatalog([shared,consumer]),createMemoryLifecycleStore()
  );
  manager.install("fixture-deps");
  manager.install("fixture-external");
  const before=manager.getSnapshot();
  const plan=manager.planDeactivateFeature("fixture-deps.target");
  assert.ok(plan.blockers.some(x=>x.code==="ACTIVE_DEPENDENT_FEATURE"));
  assert.ok(plan.blockers.some(x=>x.code==="ACTIVE_DEPENDENT_CAPABILITY"));
  assert.deepEqual(plan.deactivateFeatures,[]);
  assert.throws(()=>manager.deactivateFeature("fixture-deps.target"),
    /FEATURE_DEACTIVATION_BLOCKED/);
  assert.deepEqual(manager.getSnapshot(),before);
});

test("one Feature cut accepts alternative active capability while preserving Package",()=>{
  const first={contractVersion:"0.1.0",packageId:"fixture-first",
    displayName:"First",version:"0.1.0",type:"PLATFORM_PROVIDER",
    features:[{
      contractVersion:"0.1.0",featureId:"fixture-first.default",
      packageId:"fixture-first",version:"0.1.0",activationScope:"INSTALLATION",
      defaultActivation:true,providesCapabilities:["fixture.common"]
    }]};
  const second={...structuredClone(first),packageId:"fixture-second",
    displayName:"Second",features:first.features.map(x=>({
      ...x,featureId:"fixture-second.default",packageId:"fixture-second"
    }))};
  const consumer={contractVersion:"0.1.0",packageId:"fixture-client",
    displayName:"Client",version:"0.1.0",type:"APPLICATION",
    features:[{
      contractVersion:"0.1.0",featureId:"fixture-client.default",
      packageId:"fixture-client",version:"0.1.0",activationScope:"INSTALLATION",
      defaultActivation:true,requiresCapabilities:["fixture.common"]
    }]};
  const manager=createAppManagerService(
    createPackageCatalog([first,second,consumer]),createMemoryLifecycleStore()
  );
  manager.install("fixture-first");
  manager.install("fixture-second");
  manager.install("fixture-client");
  assert.deepEqual(manager.planDeactivateFeature("fixture-first.default").blockers,[]);
  const after=manager.deactivateFeature("fixture-first.default");
  assert.deepEqual(after.effectiveCapabilities,["fixture.common"]);
  assert.deepEqual(after.installedPackages.map(x=>x.packageId),[
    "fixture-client","fixture-first","fixture-second"
  ]);
});
