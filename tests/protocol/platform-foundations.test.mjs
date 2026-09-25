import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { validatePluginManifestV010 } from "../../dist/contracts/plugin-protocol.js";
import { evaluatePackageCompatibility } from "../../dist/manager/compatibility.js";
import {
  createMemoryPluginStorageService,
  createPluginEventBus
} from "../../dist/manager/plugin-host-services.js";
import { inspectPluginRuntimeV010 } from "../../dist/manager/plugin-runtime-host.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";

function nativePackage(overrides = {}) {
  return {
    contractVersion: "0.1.0",
    packageId: "sample-native",
    displayName: "Sample Native",
    version: "1.0.0",
    type: "APPLICATION",
    compatibility: {
      appPlatform: ">=0.1.0 <0.2.0",
      eidos: "^1.3.0",
      pluginProtocol: "0.1.0"
    },
    publisher: {
      id: "sample-publisher",
      displayName: "Sample Publisher",
      trust: "UNVERIFIED",
      source: "private-catalog"
    },
    permissions: [{
      id: "workspace.read",
      label: "Read workspace context",
      risk: "MEDIUM",
      required: true,
      reason: "Needed for the sample workflow."
    }],
    runtime: { kind: "DECLARATIVE", isolation: "HOST" },
    storage: { scope: "PACKAGE", quotaBytes: 1024 },
    events: {
      publish: ["sample-native.changed"],
      subscribe: ["evo.app-platform.lifecycle"]
    },
    features: [{
      contractVersion: "0.1.0",
      featureId: "sample-native.default",
      packageId: "sample-native",
      version: "1.0.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      activation: {
        mode: "ON_DEMAND",
        events: ["onCommand:sample-native.run"]
      },
      providesCapabilities: ["sample-native"]
    }],
    ...overrides
  };
}

test("host compatibility ranges are explicit and enforceable", () => {
  const compatible = nativePackage();
  assert.equal(evaluatePackageCompatibility(compatible).state, "COMPATIBLE");

  const incompatible = nativePackage({
    compatibility: {
      appPlatform: ">=2.0.0",
      eidos: "^1.3.0",
      pluginProtocol: "0.1.0"
    }
  });
  assert.equal(evaluatePackageCompatibility(incompatible).state, "INCOMPATIBLE");

  const manager = createAppManagerService(
    createPackageCatalog([incompatible]),
    createMemoryLifecycleStore()
  );
  assert.ok(manager.planInstall("sample-native").blockers.some(x => x.code === "HOST_INCOMPATIBLE"));
});

test("permission/trust admission and on-demand activation are server-side lifecycle concerns", () => {
  const pkg = nativePackage();
  const events = [];
  const manager = createAppManagerService(
    createPackageCatalog([pkg]),
    createMemoryLifecycleStore(),
    () => new Date("2026-09-25T00:00:00Z"),
    new Map(),
    event => events.push(event)
  );

  const plan = manager.planInstall("sample-native");
  assert.equal(plan.requiresTrustApproval, true);
  assert.equal(plan.requiresUserApproval, true);
  assert.deepEqual(plan.requestedPermissions.map(x => x.id), ["workspace.read"]);
  assert.deepEqual(plan.activateFeatures, []);

  assert.throws(() => manager.install("sample-native"), /INSTALL_TRUST_APPROVAL_REQUIRED/);
  manager.install("sample-native", {
    trustApproved: true,
    approvedPermissions: ["workspace.read"]
  });
  assert.equal(manager.getSnapshot().activeFeatures.length, 0);
  assert.equal(events.some(event => event.type === "PACKAGE_INSTALLED"), true);

  manager.activateForEvent("onCommand:sample-native.run");
  assert.deepEqual(
    manager.getSnapshot().activeFeatures.map(x => x.featureId),
    ["sample-native.default"]
  );
  assert.equal(events.some(event => event.type === "FEATURE_ACTIVATED"), true);

  manager.disable("sample-native");
  assert.equal(events.some(event => event.type === "FEATURE_DEACTIVATED"), true);
  manager.uninstall("sample-native");
  assert.equal(events.some(event => event.type === "PACKAGE_UNINSTALLED"), true);
});

test("executable plugin runtimes fail closed until an isolated runtime host exists", () => {
  const pkg = nativePackage({
    runtime: {
      kind: "WORKER",
      isolation: "WORKER",
      entrypoint: "plugin://sample-native/worker.js"
    }
  });
  assert.equal(inspectPluginRuntimeV010(pkg).status, "UNSUPPORTED");
  const manager = createAppManagerService(
    createPackageCatalog([pkg]),
    createMemoryLifecycleStore()
  );
  assert.ok(manager.planInstall("sample-native").blockers.some(x => x.code === "PLUGIN_RUNTIME_UNSUPPORTED"));
});

test("plugin storage and events are package namespaced", () => {
  const storage = createMemoryPluginStorageService();
  storage.set("plugin-a", "state", { count: 1 });
  storage.set("plugin-b", "state", { count: 2 });
  assert.deepEqual(storage.get("plugin-a", "state"), { count: 1 });
  assert.deepEqual(storage.get("plugin-b", "state"), { count: 2 });

  const bus = createPluginEventBus(() => new Date("2026-09-25T00:00:00Z"));
  const received = [];
  const unsubscribe = bus.subscribe("plugin-b", "plugin-a.changed", event => received.push(event));
  bus.publish("plugin-a", "plugin-a.changed", { id: 1 });
  assert.equal(received.length, 1);
  assert.equal(received[0].publisherPackageId, "plugin-a");
  assert.throws(
    () => bus.publish("plugin-a", "plugin-b.changed", {}),
    /PLUGIN_EVENT_TOPIC_NOT_OWNED/
  );
  unsubscribe();
});

test("Plugin Protocol validates new foundation declarations", () => {
  const result = validatePluginManifestV010(nativePackage());
  assert.equal(result.ok, true);

  const invalid = nativePackage({
    events: { publish: ["other.changed"] },
    runtime: { kind: "WORKER", isolation: "HOST", entrypoint: "x" }
  });
  const rejected = validatePluginManifestV010(invalid);
  assert.equal(rejected.ok, false);
  assert.ok(rejected.issues.some(x => x.code === "PLUGIN_EVENT_TOPIC_NOT_OWNED"));
  assert.ok(rejected.issues.some(x => x.code === "PLUGIN_RUNTIME_ISOLATION_INVALID"));
});
