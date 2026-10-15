import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import {
  createPa05HostWriteLifecycleV010,
  Pa05HostLifecycleDeniedV010,
  pa05HostLifecycleConfigurationV010
} from "../../dist/manager/agent-plugin-write-host-lifecycle.js";

const packageId = "pa05-host-guarded-sandbox";
const auxiliary = "pa05-unguarded-read-sandbox";
const makePackage = (id, effect) => ({
  contractVersion: "0.1.0",
  packageId: id, displayName: id, version: "0.1.0", type: "APPLICATION",
  features: [{
    contractVersion: "0.1.0", packageId: id, featureId: id + ".default",
    version: "0.1.0", activationScope: "INSTALLATION", defaultActivation: true,
    providesCapabilities: [id + ".capability"],
    contributions: [{
      kind: "platform.capability-operation",
      operation: {
        contractVersion: "0.1.0", operationId: id + ".operation",
        capability: id + ".capability", operationVersion: "0.1.0",
        title: id, description: "Host lifecycle test only",
        effect, dataScope: "ENTERPRISE",
        authorization: {
          action: id + ".read-or-write",
          resource: { type: id, idSource: "INPUT", inputKey: "recordId" }
        },
        inputSchema: { type: "object" }, outputSchema: { type: "object" },
        binding: {
          type: "ACTION_HOST", commandCode: id + ".command", inputVersion: "0.1.0"
        },
        exposure: ["PERSONAL_AGENT"],
        ...(effect === "WRITE" ? {
          writeSafety: { idempotency: "HOST_REQUIRED", receipt: "HOST_REQUIRED" }
        } : {})
      }
    }]
  }]
});
function fixture() {
  const m = createAppManagerService(
    createPackageCatalog([makePackage(packageId, "WRITE"), makePackage(auxiliary, "READ")]),
    createMemoryLifecycleStore()
  );
  m.install(packageId);
  m.install(auxiliary);
  return m;
}
test("PA05 Host controller rejects incomplete configuration, malformed IDs and unknown operation", async () => {
  const m = fixture();
  assert.throws(() => createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId]
  }), /PA05_HOST_LIFECYCLE_CONFIGURATION_INCOMPLETE/);
  assert.throws(() => createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId, packageId],
    databaseUrl: "postgres://fixture", schema: "fixture"
  }), /PA05_HOST_LIFECYCLE_IDS_INVALID/);
  assert.deepEqual(pa05HostLifecycleConfigurationV010({
    PA05_WRITE_LIFECYCLE_PACKAGES: packageId,
    PA05_WRITE_LIFECYCLE_DATABASE_URL: "postgres://fixture",
    PA05_WRITE_LIFECYCLE_SCHEMA: "pa05_demo"
  }), {
    protectedPackageIds: [packageId],
    databaseUrl: "postgres://fixture",
    schema: "pa05_demo"
  });
  const host = createPa05HostWriteLifecycleV010({ manager: m, protectedPackageIds: [] });
  await assert.rejects(host.apply("RENAME", auxiliary), Pa05HostLifecycleDeniedV010);
  await host.close();
});

test("PA05 Host controller never falls back to direct manager on missing gate or pending WRITE", async () => {
  const m = fixture();
  let creates = 0, calls = 0, closes = 0;
  const host = createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId],
    gateFactory: async () => {
      creates++;
      return {
        async transition({packageId: id,operation}) {
          calls++;
          assert.equal(id, packageId);
          assert.equal(operation, "DISABLE");
          return { status: "BLOCKED_PENDING_WRITE", pendingCount: 2 };
        },
        async close() { closes++; }
      };
    }
  });
  for (let i = 0; i < 2; i++) {
    await assert.rejects(
      host.apply("DISABLE", packageId),
      e => e instanceof Pa05HostLifecycleDeniedV010
        && e.code === "PA05_HOST_LIFECYCLE_PENDING_WRITE"
    );
  }
  assert.equal(creates, 1);
  assert.equal(calls, 2);
  assert.ok(m.listEffectiveCapabilityOperations().some(o => o.packageId === packageId));
  // Unprotected READ package remains on existing Host lifecycle behavior.
  await host.apply("DISABLE", auxiliary);
  assert.equal(m.listEffectiveCapabilityOperations().some(o => o.packageId === auxiliary), false);
  await host.close();
  assert.equal(closes, 1);
});

test("PA05 Host controller blocks PostgreSQL outage and does not expose backend details", async () => {
  const m = fixture();
  const host = createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId],
    gateFactory: async () => {
      throw new Error("sensitive://backend-or-credential");
    }
  });
  await assert.rejects(
    host.apply("UPGRADE", packageId),
    e => e instanceof Pa05HostLifecycleDeniedV010
      && e.code === "PA05_HOST_LIFECYCLE_GUARD_UNAVAILABLE"
      && !e.message.includes("sensitive")
  );
  assert.ok(m.listEffectiveCapabilityOperations().some(x => x.packageId === packageId));
  await host.close();
});

test("PA05 Host controller forwards upgrade trust context through the guarded owner", async () => {
  const m = fixture();
  const approval = { trustApproved: true, approvedPermissions: ["read.trading"] };
  let actual;
  const host = createPa05HostWriteLifecycleV010({
    manager: m, protectedPackageIds: [packageId],
    gateFactory: async () => ({
      async transition(input) {
        actual = input;
        return { status: "APPLIED", pendingCount: 0 };
      },
      async close() {}
    })
  });
  const snapshot = await host.apply("UPGRADE", packageId, approval);
  assert.deepEqual(actual, { packageId, operation: "UPGRADE", authorization: approval });
  assert.deepEqual(snapshot, m.getSnapshot());
  await host.close();
});

test("PA05 Host HTTP Action and /v1 routes all use the single guarded lifecycle seam", () => {
  const source = readFileSync(new URL("../../manager/server.ts", import.meta.url), "utf8");
  const count = needle => source.split(needle).length - 1;
  assert.equal(count('pa05WriteLifecycleHost.apply("UPGRADE", itemId'), 1);
  assert.equal(count('pa05WriteLifecycleHost.apply("UPGRADE", body.packageId'), 1);
  assert.equal(count('pa05WriteLifecycleHost.apply("DISABLE", itemId'), 2);
  assert.equal(count('pa05WriteLifecycleHost.apply("UNINSTALL", itemId'), 2);
  assert.equal(count('pa05WriteLifecycleHost.apply("DISABLE", body.packageId'), 1);
  assert.equal(count('pa05WriteLifecycleHost.apply("UNINSTALL", body.packageId'), 1);
  for (const forbidden of [
    "manager.disable(itemId)", "manager.uninstall(itemId)",
    "manager.upgrade(itemId,", "manager.disable(body.packageId)",
    "manager.uninstall(body.packageId)", "manager.upgrade(body.packageId,"
  ]) assert.equal(count(forbidden), 0, "unguarded route " + forbidden);
  assert.ok(source.includes("error instanceof Pa05HostLifecycleDeniedV010"));
});
