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
