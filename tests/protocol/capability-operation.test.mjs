import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { validatePluginManifestV010 } from "../../dist/contracts/plugin-protocol.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";

function operation({
  operationId = "ledger.runtime.describe",
  capability = "ledger.runtime",
  effect = "READ",
  exposure = ["EXTERNAL_AGENT"],
  dataScope = "INSTALLATION",
  authorization,
  commandCode,
  writeSafety
} = {}) {
  return {
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId,
      capability,
      operationVersion: "1.0.0",
      title: "Describe Ledger Runtime",
      description:
        "Returns the effective Ledger Runtime configuration for the current authorized enterprise context.",
      effect,
      dataScope,
      authorization: authorization ?? {
        action: capability + ".read",
        resource: {
          type: capability,
          idSource: "NONE"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {}
      },
      outputSchema: {
        type: "object",
        additionalProperties: true
      },
      binding: {
        type: "ACTION_HOST",
        commandCode: commandCode ?? operationId,
        inputVersion: "1.0.0"
      },
      exposure,
      ...(writeSafety ? { writeSafety } : {})
    }
  };
}

function pkg({
  packageId = "ledger-plugin",
  featureId = packageId + ".default",
  provided = "ledger.runtime",
  contribution = operation()
} = {}) {
  return {
    contractVersion: "0.1.0",
    packageId,
    displayName: packageId,
    version: "0.1.0",
    type: "APPLICATION",
    features: [{
      contractVersion: "0.1.0",
      featureId,
      packageId,
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: [provided],
      contributions: [contribution]
    }]
  };
}

test("Capability Operation contribution is valid when owned by a provided Capability", () => {
  const result = validatePluginManifestV010(pkg());
  assert.equal(result.ok, true, JSON.stringify(result.issues));
});

test("Capability Operation contribution rejects undeclared Capability and namespace mismatch", () => {
  const invalid = pkg({
    contribution: operation({
      operationId: "inventory.describe",
      capability: "inventory"
    })
  });
  const result = validatePluginManifestV010(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some(
    issue => issue.code === "PLUGIN_CAPABILITY_OPERATION_CAPABILITY_NOT_PROVIDED"
  ));

  const namespaceMismatch = pkg({
    contribution: operation({
      operationId: "other.describe",
      capability: "ledger.runtime"
    })
  });
  const namespaceResult = validatePluginManifestV010(namespaceMismatch);
  assert.equal(namespaceResult.ok, false);
  assert.ok(namespaceResult.issues.some(
    issue => issue.code === "PLUGIN_CAPABILITY_OPERATION_ID_NAMESPACE_MISMATCH"
  ));
});

test("Capability Operation WRITE requires Host idempotency + receipt declaration", () => {
  const missing = validatePluginManifestV010(pkg({
    contribution: operation({
      operationId: "ledger.runtime.replay",
      effect: "WRITE"
    })
  }));
  assert.equal(missing.ok, false);
  assert.ok(missing.issues.some(
    issue => issue.code === "PLUGIN_CAPABILITY_OPERATION_WRITE_SAFETY_REQUIRED"
  ));

  const safe = validatePluginManifestV010(pkg({
    contribution: operation({
      operationId: "ledger.runtime.replay",
      effect: "WRITE",
      writeSafety: {
        idempotency: "HOST_REQUIRED",
        receipt: "HOST_REQUIRED"
      }
    })
  }));
  assert.equal(safe.ok, true, JSON.stringify(safe.issues));

  const readWithWriteSafety = validatePluginManifestV010(pkg({
    contribution: operation({
      writeSafety: {
        idempotency: "HOST_REQUIRED",
        receipt: "HOST_REQUIRED"
      }
    })
  }));
  assert.equal(readWithWriteSafety.ok, false);
  assert.ok(readWithWriteSafety.issues.some(
    issue => issue.code === "PLUGIN_CAPABILITY_OPERATION_WRITE_SAFETY_FORBIDDEN"
  ));
});

test("Capability Operation exposure is explicit and package-local ids are unique", () => {
  const noExposure = validatePluginManifestV010(pkg({
    contribution: operation({ exposure: [] })
  }));
  assert.equal(noExposure.ok, false);
  assert.ok(noExposure.issues.some(
    issue => issue.code === "PLUGIN_CAPABILITY_OPERATION_EXPOSURE_REQUIRED"
  ));

  const duplicatePackage = pkg();
  duplicatePackage.features[0].contributions.push(operation());
  const duplicate = validatePluginManifestV010(duplicatePackage);
  assert.equal(duplicate.ok, false);
  assert.ok(duplicate.issues.some(
    issue => issue.code === "PLUGIN_CAPABILITY_OPERATION_ID_DUPLICATE"
  ));
});

test("App Manager exposes operations only from active Features", () => {
  const packageManifest = pkg();
  const manager = createAppManagerService(
    createPackageCatalog([packageManifest]),
    createMemoryLifecycleStore(),
    () => new Date("2026-09-30T10:30:00Z")
  );

  assert.deepEqual(manager.listEffectiveCapabilityOperations(), []);

  manager.install(packageManifest.packageId);
  assert.deepEqual(
    manager.listEffectiveCapabilityOperations().map(item => ({
      operationId: item.operationId,
      packageId: item.packageId,
      featureId: item.featureId,
      effect: item.effect
    })),
    [{
      operationId: "ledger.runtime.describe",
      packageId: "ledger-plugin",
      featureId: "ledger-plugin.default",
      effect: "READ"
    }]
  );

  manager.disable(packageManifest.packageId);
  assert.deepEqual(manager.listEffectiveCapabilityOperations(), []);
});

test("App Manager can filter effective operations by Capability", () => {
  const ledger = pkg();
  const inventory = pkg({
    packageId: "inventory-plugin",
    provided: "inventory",
    contribution: operation({
      operationId: "inventory.read",
      capability: "inventory"
    })
  });
  const manager = createAppManagerService(
    createPackageCatalog([ledger, inventory]),
    createMemoryLifecycleStore()
  );
  manager.install("ledger-plugin");
  manager.install("inventory-plugin");

  assert.deepEqual(
    manager.listEffectiveCapabilityOperations("ledger.runtime")
      .map(item => item.operationId),
    ["ledger.runtime.describe"]
  );
  assert.deepEqual(
    manager.listEffectiveCapabilityOperations("inventory")
      .map(item => item.operationId),
    ["inventory.read"]
  );
});

test("App Manager fails closed when active plugins claim one global operation id", () => {
  const first = pkg({ packageId: "ledger-a" });
  const second = pkg({ packageId: "ledger-b" });
  const manager = createAppManagerService(
    createPackageCatalog([first, second]),
    createMemoryLifecycleStore()
  );

  manager.install("ledger-a");
  manager.install("ledger-b");

  assert.throws(
    () => manager.listEffectiveCapabilityOperations(),
    /CAPABILITY_OPERATION_ID_CONFLICT: ledger.runtime.describe/
  );
});

test("Capability Operation requires explicit authorization and valid scoped resource semantics", () => {
  const missingAuthorization = operation();
  delete missingAuthorization.operation.authorization;
  const missing = validatePluginManifestV010(pkg({
    contribution: missingAuthorization
  }));
  assert.equal(missing.ok, false);
  assert.ok(missing.issues.some(
    issue => issue.code === "PLUGIN_CAPABILITY_OPERATION_AUTHORIZATION_REQUIRED"
  ));

  const invalidScopedId = validatePluginManifestV010(pkg({
    contribution: operation({
      dataScope: "INSTALLATION",
      authorization: {
        action: "ledger.runtime.read",
        resource: {
          type: "ledger.runtime",
          idSource: "DATA_SCOPE"
        }
      }
    })
  }));
  assert.equal(invalidScopedId.ok, false);
  assert.ok(invalidScopedId.issues.some(
    issue => issue.code === "PLUGIN_CAPABILITY_OPERATION_AUTH_DATA_SCOPE_ID_UNAVAILABLE"
  ));

  const inputResource = validatePluginManifestV010(pkg({
    contribution: operation({
      dataScope: "ENTERPRISE",
      authorization: {
        action: "ledger.runtime.item.read",
        resource: {
          type: "ledger.runtime.item",
          idSource: "INPUT",
          inputKey: "itemId"
        }
      }
    })
  }));
  assert.equal(inputResource.ok, true, JSON.stringify(inputResource.issues));
});

test("App Manager fails closed when active operations claim one Host Action binding", () => {
  const first = pkg({
    packageId: "ledger-a",
    contribution: operation({
      operationId: "ledger.runtime.describe",
      commandCode: "shared.command"
    })
  });
  const second = pkg({
    packageId: "ledger-b",
    contribution: operation({
      operationId: "ledger.runtime.summary",
      commandCode: "shared.command"
    })
  });
  const manager = createAppManagerService(
    createPackageCatalog([first, second]),
    createMemoryLifecycleStore()
  );

  manager.install("ledger-a");
  manager.install("ledger-b");

  assert.throws(
    () => manager.listEffectiveCapabilityOperations(),
    /CAPABILITY_OPERATION_BINDING_CONFLICT: shared.command/
  );
});
