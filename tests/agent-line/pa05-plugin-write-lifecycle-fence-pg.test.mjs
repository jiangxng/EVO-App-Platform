import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import postgres from "postgres";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createPostgresAgentDurabilityProofV020 }
  from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import { createPostgresAgentExecutionCoordinatorV020 }
  from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";
import { createPostgresAgentOwnerReconciliationV030 }
  from "../../dist/agents/enterprise-agent/pa02b-owner-reconciliation.js";
import { createPa05PluginWriteLifecycleGateV010 }
  from "../../dist/manager/agent-plugin-write-lifecycle-gate.js";
import { createPa05HostWriteLifecycleV010 }
  from "../../dist/manager/agent-plugin-write-host-lifecycle.js";
import { createHostRegisteredAgentOwnerRegistryV040 }
  from "../../dist/manager/agent-trusted-owner-registration.js";

const url = process.env.PA02A_PROOF_DATABASE_URL;
const sha = value => createHash("sha256").update(value).digest("hex");
const packageId = "pa05-lifecycle-sandbox";
const operationId = "pa05.lifecycle.write";
const inputDigest = sha('{"recordId":"record-1","value":7}');
const scope = {
  principalSubjectId: "pa05-human-a", principalActorType: "HUMAN",
  contextKind: "ENTERPRISE", contextId: "enterprise:pa05-a",
  enterpriseId: "pa05-enterprise-a"
};
const context = {
  contractVersion: "0.1.0", kind: "ENTERPRISE", contextId: scope.contextId,
  enterpriseId: scope.enterpriseId
};
const pkg = {
  contractVersion: "0.1.0", packageId, displayName: "PA05 Lifecycle Sandbox",
  version: "0.1.0", type: "APPLICATION",
  features: [{
    contractVersion: "0.1.0", featureId: "pa05-lifecycle-sandbox.default",
    packageId, version: "0.1.0", activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: ["pa05.lifecycle"],
    contributions: [{
      kind: "platform.capability-operation",
      operation: {
        contractVersion: "0.1.0", operationId,
        capability: "pa05.lifecycle", operationVersion: "0.1.0",
        title: "Sandbox write", description: "Isolated durable Owner write",
        effect: "WRITE", dataScope: "ENTERPRISE",
        authorization: {
          action: operationId,
          resource: { type: "pa05.record", idSource: "INPUT", inputKey: "recordId" }
        },
        inputSchema: {
          type: "object", required: ["recordId", "value"],
          properties: { recordId: { type: "string" }, value: { type: "integer" } }
        },
        outputSchema: { type: "object" },
        binding: { type: "ACTION_HOST", commandCode: operationId, inputVersion: "0.1.0" },
        exposure: ["PERSONAL_AGENT"],
        writeSafety: { idempotency: "HOST_REQUIRED", receipt: "HOST_REQUIRED" }
      }
    }]
  }]
};
function manager() {
  const m = createAppManagerService(createPackageCatalog([pkg]), createMemoryLifecycleStore());
  m.install(packageId);
  return m;
}
function versionedManager(catalogVersion, installedVersion = "0.1.0") {
  const next = structuredClone(pkg);
  next.version = catalogVersion;
  next.features[0].version = catalogVersion;
  const store = createMemoryLifecycleStore();
  store.saveInstalledPackage({
    packageId, version: installedVersion,
    installedAt: "2026-10-15T04:00:00.000Z",
    trustApproved: true, grantedPermissions: []
  });
  store.saveActiveFeature({
    packageId, featureId: pkg.features[0].featureId,
    version: installedVersion,
    activatedAt: "2026-10-15T04:00:00.000Z"
  });
  return createAppManagerService(createPackageCatalog([next]), store);
}
async function setup(options = {}) {
  const schema = "pa05_lifecycle_" + randomUUID().replaceAll("-", "").slice(0, 12);
  const admin = postgres(url, { max: 3 });
  let durability, coordinator, reconciler, gate;
  const m = options.manager ?? manager();
  let verification = "UNRESOLVED";
  const verifier = {
    async verify(r) {
      if (verification === "ERROR") throw new Error("PA05_TEST_VERIFIER_UNAVAILABLE");
      if (verification === "UNRESOLVED") return { outcome: "UNRESOLVED" };
      return {
        outcome: "SUCCEEDED",
        evidenceRef: "sandbox:verified:" + r.effectId,
        evidenceDigest: sha(r.effectId + r.inputDigest),
        terminal: {
          receiptId: r.receiptId, status: "SUCCEEDED",
          completedAt: "2026-10-15T04:00:00.000Z",
          resultDigest: sha(r.effectId), resultEntityRefs: ["record-1"],
          resultSummary: "Isolated Owner evidence"
        }
      };
    }
  };
  try {
    durability = await createPostgresAgentDurabilityProofV020({
      connectionString: url, schema
    });
    coordinator = await createPostgresAgentExecutionCoordinatorV020({
      connectionString: url, schema, requirePluginWriteLifecycleFence: true
    });
    reconciler = await createPostgresAgentOwnerReconciliationV030({
      connectionString: url, schema, ownerVerifier: verifier
    });
    gate = await createPa05PluginWriteLifecycleGateV010({
      connectionString: url, schema, manager: m
    });
    await gate.register(packageId);
  } catch (error) {
    for (const obj of [gate, reconciler, coordinator, durability])
      if (obj) await obj.close();
    await admin.unsafe('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
    await admin.end();
    throw error;
  }
  async function prepare(runId, s = scope) {
    const c = { ...context, contextId: s.contextId, enterpriseId: s.enterpriseId };
    await durability.claimTurn({
      scope: s, threadId: "thread:" + runId, clientTurnId: "turn:" + runId,
      taskDigest: sha(runId), taskPayload: { message: "sandbox" },
      created: {
        contractVersion: "0.1.0", eventId: "created:" + randomUUID(),
        runId, type: "RUN_CREATED", occurredAt: "2026-10-15T03:00:00.000Z",
        payload: {
          principalSubjectId: s.principalSubjectId,
          principalActorType: s.principalActorType,
          context: c, sourceInteractionId: "thread:" + runId,
          sourceActionId: "turn:" + runId,
          input: {
            message: "sandbox", conversationHistory: [], locale: "en",
            providerId: "test", modelId: "test"
          }
        }
      }
    });
    const lease = await coordinator.claimLease({
      scope: s, runId, ownerId: "worker:" + runId, ttlSeconds: 300
    });
    assert.ok(lease);
    const effectId = "effect:" + runId;
    await coordinator.prepareWrite({ scope: s, lease, effectId, inputDigest });
    const receiptId = "receipt:" + runId;
    await durability.beginReceipt({
      scope: s, receipt: {
        receiptId, invocationId: "invocation:" + runId,
        idempotencyKey: "idempotency:" + runId,
        sourceInteractionId: runId, sourceActionId: "write",
        principalSubjectId: s.principalSubjectId,
        principalActorType: s.principalActorType, context: c,
        toolId: operationId, ownerPackageId: packageId, inputDigest,
        requestedAt: "2026-10-15T03:01:00.000Z"
      }
    });
    await reconciler.bind({
      scope: s, lease, effectId, receiptId, ownerPackageId: packageId
    });
    return { scope: s, lease, effectId, receiptId };
  }
  async function close() {
    for (const obj of [gate, reconciler, coordinator, durability])
      if (obj) await obj.close();
    try {
      await admin.unsafe('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
    } finally {
      await admin.end();
    }
  }
  return {
    admin, gate, manager: m, coordinator, reconciler, prepare, close,
    verifier, setVerification: value => { verification = value; },
    schema
  };
}

test("PA05-04B real PG18: freezing first forbids PREPARED -> INVOKING and keeps gate frozen on denial", {
  skip: !url ? "requires isolated PostgreSQL 18" : false,
  timeout: 90000
}, async () => {
  const h = await setup();
  try {
    const effect = await h.prepare("run:freeze-first");
    const frozen = await h.gate.freeze(packageId);
    assert.equal(frozen.state, "FROZEN");
    assert.deepEqual(frozen.pendingStates, { PREPARED: 1 });
    assert.equal(frozen.pendingCount, 1);
    await assert.rejects(
      h.coordinator.beginWrite(effect),
      /PA05_PLUGIN_WRITE_LIFECYCLE_FROZEN/
    );
    const blocked = await h.gate.transition({ packageId, operation: "DISABLE" });
    assert.deepEqual(blocked, { status: "BLOCKED_PENDING_WRITE", pendingCount: 1 });
    assert.equal(h.manager.listEffectiveCapabilityOperations().length, 1);
    await assert.rejects(h.gate.reopen({
      packageId, expectedPackageVersion: "0.1.0", trustedOwnerReady: () => true
    }), /PA05_LIFECYCLE_WRITE_NOT_QUIESCED/);
    assert.equal((await h.gate.getState(packageId)).state, "FROZEN");
  } finally {
    await h.close();
  }
});

test("PA05-04B real PG18: begin first blocks disable, UNKNOWN persists across connections, verified terminal drains", {
  skip: !url ? "requires isolated PostgreSQL 18" : false,
  timeout: 90000
}, async () => {
  const h = await setup();
  let reopened;
  try {
    const first = await h.prepare("run:begin-first");
    const invoking = await h.coordinator.beginWrite(first);
    assert.equal(invoking.state, "INVOKING");
    let frozen = await h.gate.freeze(packageId);
    assert.deepEqual(frozen.pendingStates, { INVOKING: 1 });
    assert.deepEqual(await h.gate.transition({ packageId, operation: "UPGRADE" }),
      { status: "BLOCKED_PENDING_WRITE", pendingCount: 1 });
    await h.coordinator.markUnknown(first);
    assert.equal((await h.gate.freeze(packageId)).pendingStates.UNKNOWN, 1);
    // Simulate a dead worker whose lease has expired; Owner reconciliation
    // must not pretend an actively leased worker has been quiesced.
    await h.admin.unsafe(
      'UPDATE "' + h.schema + '".pa02b_leases SET ' +
      "expires_at=clock_timestamp()-interval '5 seconds' WHERE run_id=$1",
      [first.lease.runId]
    );
    assert.equal((await h.reconciler.reconcile({
      scope, effectId: first.effectId
    })).status, "UNKNOWN");
    assert.equal((await h.gate.getState(packageId)).state, "FROZEN");
    // A second independent connection and distinct tenant share this Owner
    // freeze, not a per-principal in-memory flag.
    reopened = await createPostgresAgentExecutionCoordinatorV020({
      connectionString: url, schema: h.schema,
      requirePluginWriteLifecycleFence: true
    });
    const secondScope = {
      ...scope, principalSubjectId: "pa05-human-b",
      contextId: "enterprise:pa05-b", enterpriseId: "pa05-enterprise-b"
    };
    const second = await h.prepare("run:other-tenant", secondScope);
    await assert.rejects(reopened.beginWrite(second),
      /PA05_PLUGIN_WRITE_LIFECYCLE_FROZEN/);
    assert.equal((await h.gate.freeze(packageId)).pendingCount, 2);
    assert.deepEqual(await h.gate.transition({ packageId, operation: "UNINSTALL" }),
      { status: "BLOCKED_PENDING_WRITE", pendingCount: 2 });
    // This test deliberately leaves the second PREPARED request never invoked.
    // No silent force-uninstall or terminal fabrication is permitted.
    assert.equal(h.manager.getSnapshot().installedPackages.length, 1);
    h.setVerification("SUCCEEDED");
    assert.equal((await h.reconciler.reconcile({
      scope, effectId: first.effectId
    })).status, "SUCCEEDED");
    assert.equal((await h.gate.freeze(packageId)).pendingCount, 1);
    assert.equal((await h.gate.getState(packageId)).state, "FROZEN");
  } finally {
    if (reopened) await reopened.close();
    await h.close();
  }
});

test("PA05-04B real PG18: empty fence can disable safely, version-pinned owner re-certification is required to reopen", {
  skip: !url ? "requires isolated PostgreSQL 18" : false,
  timeout: 90000
}, async () => {
  const h = await setup();
  try {
    const disabled = await h.gate.transition({ packageId, operation: "DISABLE" });
    assert.deepEqual(disabled, { status: "APPLIED", pendingCount: 0 });
    assert.equal(h.manager.listEffectiveCapabilityOperations().length, 0);
    assert.equal((await h.gate.getState(packageId)).state, "FROZEN");
    await assert.rejects(h.gate.reopen({
      packageId, expectedPackageVersion: "0.1.0", trustedOwnerReady: () => true
    }), /PA05_LIFECYCLE_PLUGIN_NOT_ACTIVE/);
    h.manager.enable(packageId);
    await assert.rejects(h.gate.reopen({
      packageId, expectedPackageVersion: "9.9.9", trustedOwnerReady: () => true
    }), /PA05_LIFECYCLE_VERSION_CHANGED/);
    await assert.rejects(h.gate.reopen({
      packageId, expectedPackageVersion: "0.1.0", trustedOwnerReady: () => false
    }), /PA05_LIFECYCLE_OWNER_RECERTIFICATION_REQUIRED/);
    let verified = 0;
    await h.gate.reopen({
      packageId, expectedPackageVersion: "0.1.0",
      trustedOwnerReady: () => {
        verified++;
        const registry = createHostRegisteredAgentOwnerRegistryV040({
          manager: h.manager,
          resolveAuthorizationProvider: () => undefined,
          registrations: [{
            operationId, packageId, commandCode: operationId,
            inputVersion: "0.1.0", modelName: "pa05_lifecycle_write",
            owner: { ownerPackageId: packageId, async invoke() {} },
            verifier: h.verifier,
            validateArguments: () => true
          }]
        });
        return Boolean(registry.resolve(operationId));
      }
    });
    assert.equal(verified, 1);
    assert.equal((await h.gate.getState(packageId)).state, "ACTIVE");
    console.log("PA05_PLUGIN_WRITE_LIFECYCLE_PG=" + JSON.stringify({
      status: "ISOLATED_PROVEN", postgres18: true,
      sameTransactionOwnerGate: true, blockingOwnerRowLock: true,
      frozenPersists: true, unknownNoReplay: true,
      acrossTenantOwnerFreeze: true, disabledPluginCanOnlyReopenWithOwnerProof: true,
      fullHostManagerWiring: false, productionWrite: false
    }));
  } finally {
    await h.close();
  }
});


test("PA05-04C isolated PG18 Host adapter routes real lifecycle through frozen owner state", {
  skip: !url ? "requires isolated PostgreSQL 18" : false,
  timeout: 90000
}, async () => {
  const h = await setup();
  const host = createPa05HostWriteLifecycleV010({
    manager: h.manager, protectedPackageIds: [packageId],
    databaseUrl: url, schema: h.schema
  });
  try {
    await h.prepare("run:host-blocked");
    await assert.rejects(
      host.apply("DISABLE", packageId),
      e => e.code === "PA05_HOST_LIFECYCLE_PENDING_WRITE"
    );
    assert.ok(h.manager.listEffectiveCapabilityOperations().some(o =>
      o.operationId === operationId
    ));
    assert.equal((await h.gate.getState(packageId)).state, "FROZEN");
    assert.equal((await h.gate.freeze(packageId)).pendingCount, 1);
  } finally {
    await host.close();
    await h.close();
  }

  const ready = await setup();
  const uninstaller = createPa05HostWriteLifecycleV010({
    manager: ready.manager, protectedPackageIds: [packageId],
    databaseUrl: url, schema: ready.schema
  });
  try {
    const snapshot = await uninstaller.apply("DISABLE", packageId);
    assert.equal(snapshot.activeFeatures.some(f => f.packageId === packageId), false);
    assert.equal((await ready.gate.getState(packageId)).state, "FROZEN");
    console.log("PA05_HOST_WRITE_LIFECYCLE_PG=" + JSON.stringify({
      optInHostLifecycle: true, actualPostgres18: true,
      unknownAndPreparedBlockDisable: true,
      eligibleDisablePreservesFrozenGate: true,
      allHttpRoutesHaveStaticGuardTests: true,
      globalProductionWrite: false
    }));
  } finally {
    await uninstaller.close();
    await ready.close();
  }
});

test("PA05-04D PG18: upgrade remains frozen until old Owner writes drain and new version is recertified", {
  skip: !url ? "requires isolated PostgreSQL 18" : false,
  timeout: 90000
}, async () => {
  const h = await setup({manager: versionedManager("0.1.1")});
  try {
    const outstanding = await h.prepare("run:upgrade-with-prepared");
    assert.deepEqual(await h.gate.transition({
      packageId, operation: "UPGRADE"
    }), {status: "BLOCKED_PENDING_WRITE", pendingCount: 1});
    assert.equal(h.manager.getSnapshot().installedPackages[0].version, "0.1.0");
    assert.equal((await h.gate.getState(packageId)).state, "FROZEN");
    await assert.rejects(
      h.coordinator.beginWrite(outstanding),
      /PA05_PLUGIN_WRITE_LIFECYCLE_FROZEN/
    );
    await assert.rejects(h.gate.reopen({
      packageId, expectedPackageVersion: "0.1.0", trustedOwnerReady: () => true
    }), /PA05_LIFECYCLE_WRITE_NOT_QUIESCED/);
  } finally {
    await h.close();
  }

  // A clean upgrade may reopen ONLY under the new version after the Host
  // re-validates its trusted Owner registration. No stale version admission.
  const clean = await setup({manager: versionedManager("0.1.1")});
  try {
    assert.equal((await clean.gate.transition({
      packageId, operation: "UPGRADE"
    })).status, "APPLIED");
    await clean.gate.reopen({
      packageId, expectedPackageVersion: "0.1.1",
      trustedOwnerReady: async () => Boolean(
        createHostRegisteredAgentOwnerRegistryV040({
          manager: clean.manager,
          resolveAuthorizationProvider: () => undefined,
          registrations: [{
            operationId, packageId, commandCode: operationId,
            inputVersion: "0.1.0", modelName: "pa05_lifecycle_write_v011",
            owner: { ownerPackageId: packageId, async invoke() {} },
            verifier: clean.verifier, validateArguments: () => true
          }]
        }).resolve(operationId)
      )
    });
    assert.deepEqual(await clean.gate.getState(packageId), {
      state: "ACTIVE", packageVersion: "0.1.1"
    });
    const permitted = await clean.prepare("run:post-upgrade-owner");
    assert.equal((await clean.coordinator.beginWrite(permitted)).state, "INVOKING");
    await clean.coordinator.markUnknown(permitted);
    assert.deepEqual(await clean.gate.transition({
      packageId, operation: "DISABLE"
    }), {status: "BLOCKED_PENDING_WRITE", pendingCount: 1});
  } finally {
    await clean.close();
  }

  const ready = await setup({manager: versionedManager("0.1.1")});
  try {
    assert.deepEqual(await ready.gate.transition({
      packageId, operation: "UPGRADE"
    }), {status: "APPLIED", pendingCount: 0});
    assert.equal(ready.manager.getSnapshot().installedPackages[0].version, "0.1.1");
    assert.deepEqual(await ready.gate.getState(packageId), {
      state: "FROZEN", packageVersion: "0.1.0"
    });
    const next = await ready.prepare("run:new-version-prepared");
    await assert.rejects(ready.coordinator.beginWrite(next),
      /PA05_PLUGIN_WRITE_LIFECYCLE_FROZEN/);
    await assert.rejects(ready.gate.reopen({
      packageId, expectedPackageVersion: "0.1.0", trustedOwnerReady: () => true
    }), /PA05_LIFECYCLE_VERSION_CHANGED/);
    await assert.rejects(ready.gate.reopen({
      packageId, expectedPackageVersion: "0.1.1", trustedOwnerReady: () => false
    }), /PA05_LIFECYCLE_OWNER_RECERTIFICATION_REQUIRED/);
    // New PREPARED request must be drained/denied by Host before any reopen;
    // do not invent a terminal result in this test.
    await assert.rejects(ready.gate.reopen({
      packageId, expectedPackageVersion: "0.1.1",
      trustedOwnerReady: () => true
    }), /PA05_LIFECYCLE_WRITE_NOT_QUIESCED/);
    assert.equal((await ready.gate.getState(packageId)).state, "FROZEN");
  } finally {
    await ready.close();
  }
});

test("PA05-04D PG18: rollback not allowed, Owner verifier outage leaves UNKNOWN and lifecycle frozen", {
  skip: !url ? "requires isolated PostgreSQL 18" : false,
  timeout: 90000
}, async () => {
  const h = await setup({manager: versionedManager("0.1.0", "0.1.1")});
  try {
    assert.ok(h.manager.planUpgrade(packageId).blockers.some(
      b => b.code === "PACKAGE_DOWNGRADE_NOT_ALLOWED"
    ));
    await assert.rejects(h.gate.transition({
      packageId, operation: "UPGRADE"
    }), /UPGRADE_BLOCKED/);
    assert.equal(h.manager.getSnapshot().installedPackages[0].version, "0.1.1");
    assert.equal((await h.gate.getState(packageId)).state, "FROZEN");
    await assert.rejects(h.gate.reopen({
      packageId, expectedPackageVersion: "0.1.0", trustedOwnerReady: () => true
    }), /PA05_LIFECYCLE_VERSION_CHANGED/);

    // Explicit owner recovery failure is not evidence that a business effect
    // did not happen. Reconciliation must leave UNKNOWN, preserving freeze.
    const effect = await h.prepare("run:verifier-outage");
    await assert.rejects(h.coordinator.beginWrite(effect),
      /PA05_PLUGIN_WRITE_LIFECYCLE_FROZEN/);
  } finally {
    await h.close();
  }
  const unresolved = await setup();
  try {
    const write = await unresolved.prepare("run:failed-verifier");
    await unresolved.coordinator.beginWrite(write);
    await unresolved.coordinator.markUnknown(write);
    unresolved.setVerification("ERROR");
    await assert.rejects(unresolved.reconciler.reconcile({
      scope, effectId: write.effectId
    }), /PA05_TEST_VERIFIER_UNAVAILABLE/);
    assert.deepEqual(await unresolved.gate.transition({
      packageId, operation: "DISABLE"
    }), {status: "BLOCKED_PENDING_WRITE", pendingCount: 1});
    assert.equal((await unresolved.gate.getState(packageId)).state, "FROZEN");
    assert.equal((await unresolved.coordinator.getWrite({
      scope, effectId: write.effectId
    })).state, "UNKNOWN");
    console.log("PA05_WRITE_UPGRADE_ROLLBACK_PG=" + JSON.stringify({
      postgres18: true, upgradePreparedBlocked: true,
      noAutoReopenOnUpgrade: true, downgradeRejected: true,
      verifierOutageUnknownQuarantined: true, protectedOwnerCoverage: true,
      productionWrite: false
    }));
  } finally {
    await unresolved.close();
  }
});

test("PA05-04D2 PG18 Host INSTALL creates FROZEN owner before activation; independent Worker cannot WRITE", {
  skip: !url ? "requires isolated PostgreSQL18" : false,
  timeout: 90000
}, async () => {
  const h = await setup();
  let second;
  const host = createPa05HostWriteLifecycleV010({
    manager: h.manager, protectedPackageIds: [packageId],
    databaseUrl: url, schema: h.schema
  });
  try {
    h.manager.uninstall(packageId); // fixture-only reset: no effect was prepared
    await h.admin.unsafe(
      'DELETE FROM "' + h.schema +
      '".pa05_plugin_write_lifecycle_gates WHERE owner_package_id=$1',
      [packageId]
    );
    assert.equal(await h.gate.getState(packageId), undefined);
    const installed = await host.admitActivation("INSTALL", packageId);
    assert.ok(installed.activeFeatures.some(x => x.packageId === packageId));
    assert.deepEqual(await h.gate.getState(packageId), {
      state: "FROZEN", packageVersion: "0.1.0"
    });
    second = await createPostgresAgentExecutionCoordinatorV020({
      connectionString: url, schema: h.schema,
      requirePluginWriteLifecycleFence: true
    });
    const effect = await h.prepare("run:second-worker-after-install");
    await assert.rejects(second.beginWrite(effect),
      /PA05_PLUGIN_WRITE_LIFECYCLE_FROZEN/);
    // Independent processes sharing this PG schema use the same exact gate;
    // no one may write until trusted Owner is explicitly recertified.
    await assert.rejects(h.gate.reopen({
      packageId, expectedPackageVersion: "0.1.0",
      trustedOwnerReady: () => true
    }), /PA05_LIFECYCLE_WRITE_NOT_QUIESCED/);
    console.log("PA05_HOST_OWNER_ADMISSION_PG=" + JSON.stringify({
      postgres18: true, newGateInitiallyAbsent: true,
      installRequiresFrozenReservation: true, multiWorkerSameSchema: true,
      preCertificationWriteDenied: true, productionWrite: false
    }));
  } finally {
    if (second) await second.close();
    await host.close();
    await h.close();
  }
});

test("PA05-04D2 PG18 protected ENABLE fails closed on outstanding UNKNOWN", {
  skip: !url ? "requires isolated PostgreSQL18" : false,
  timeout: 90000
}, async () => {
  const h = await setup();
  const host = createPa05HostWriteLifecycleV010({
    manager: h.manager, protectedPackageIds: [packageId],
    databaseUrl: url, schema: h.schema
  });
  try {
    const effect = await h.prepare("run:reactivation-after-unknown");
    await h.coordinator.beginWrite(effect);
    await h.coordinator.markUnknown(effect);
    // Model a legacy direct store mutation in isolation. This is an explicit
    // remaining deployment blocker: only Host-mediated mutations are gated.
    h.manager.disable(packageId);
    await assert.rejects(host.admitActivation("ENABLE", packageId),
      e => e.code === "PA05_HOST_LIFECYCLE_PENDING_WRITE");
    assert.equal(h.manager.getSnapshot().activeFeatures.some(x =>
      x.packageId === packageId), false);
    assert.equal((await h.gate.getState(packageId)).state, "FROZEN");
    assert.equal((await h.coordinator.getWrite({
      scope, effectId: effect.effectId
    })).state, "UNKNOWN");
  } finally {
    await host.close();
    await h.close();
  }
});

test("PA05-04D3 real PG18: pre-listen startup freezes persisted ACTIVE owner, second Worker cannot write", {
  skip: !url ? "requires isolated PostgreSQL18" : false,
  timeout: 90000
}, async () => {
  const h = await setup();
  const host = createPa05HostWriteLifecycleV010({
    manager: h.manager, protectedPackageIds: [packageId],
    databaseUrl: url, schema: h.schema, workerSchemas: [h.schema]
  });
  let other;
  try {
    assert.equal((await h.gate.getState(packageId)).state, "ACTIVE");
    await host.attestStartupActivation();
    assert.deepEqual(await h.gate.getState(packageId), {
      state: "FROZEN", packageVersion: "0.1.0"
    });
    other = await createPostgresAgentExecutionCoordinatorV020({
      connectionString: url, schema: h.schema,
      requirePluginWriteLifecycleFence: true,
      hostLifecycleAuthoritySchema: h.schema
    });
    const first = await h.prepare("run:pre-listen-startup");
    await assert.rejects(other.beginWrite(first),
      /PA05_PLUGIN_WRITE_LIFECYCLE_FROZEN/);
    await assert.rejects(
      createPostgresAgentExecutionCoordinatorV020({
        connectionString: url, schema: h.schema + "_rogue",
        requirePluginWriteLifecycleFence: true,
        hostLifecycleAuthoritySchema: h.schema
      }), /PA05_WRITE_WORKER_SCHEMA_MISMATCH/);
    console.log("PA05_STARTUP_WORKER_SCHEMA_PG=" + JSON.stringify({
      actualPostgres18: true, startupActiveOwnerFrozen: true,
      secondWorkerSameSchemaBlocked: true,
      differentWorkerSchemaRejectedBeforeDbInit: true,
      defaultProductionWriteEnabled: false
    }));
  } finally {
    if (other) await other.close();
    await host.close();
    await h.close();
  }
});

test("PA05-04D3 real PG18: failed startup attestation never releases unresolved write", {
  skip: !url ? "requires isolated PostgreSQL18" : false,
  timeout: 90000
}, async () => {
  const h = await setup();
  const host = createPa05HostWriteLifecycleV010({
    manager: h.manager, protectedPackageIds: [packageId],
    databaseUrl: url, schema: h.schema
  });
  try {
    const effect = await h.prepare("run:pre-listen-unknown");
    await h.coordinator.beginWrite(effect);
    await h.coordinator.markUnknown(effect);
    await assert.rejects(host.attestStartupActivation(),
      e => e.code === "PA05_HOST_LIFECYCLE_PENDING_WRITE");
    assert.equal((await h.gate.getState(packageId)).state, "FROZEN");
    assert.equal((await h.coordinator.getWrite({
      scope, effectId: effect.effectId
    })).state, "UNKNOWN");
  } finally {
    await host.close();
    await h.close();
  }
});

test("PA05-04D4 PG18 distinct Worker Schemas: one central Owner row quarantines the other schema UNKNOWN", {
  skip: !url ? "requires isolated PostgreSQL18" : false,
  timeout: 90000
}, async () => {
  const a = await setup(), b = await setup();
  const central = "pa05_global_" + randomUUID().replaceAll("-", "").slice(0,12);
  let shared, workerA, workerB, host;
  try {
    const inventory = [a.schema, b.schema].sort();
    shared = await createPa05PluginWriteLifecycleGateV010({
      connectionString: url, schema: a.schema,
      manager: a.manager, authoritySchema: central, workerSchemas: inventory
    });
    await shared.register(packageId);
    host = createPa05HostWriteLifecycleV010({
      manager:a.manager,protectedPackageIds:[packageId],
      databaseUrl:url,schema:a.schema,
      workerSchemas:inventory,sharedWorkerSchemaAuthority:true,
      sharedAuthoritySchema:central
    });
    workerA = await createPostgresAgentExecutionCoordinatorV020({
      connectionString: url, schema: a.schema,
      requirePluginWriteLifecycleFence: true,
      hostLifecycleAuthoritySchema: central, sharedLifecycleWorkerSchemas: inventory
    });
    workerB = await createPostgresAgentExecutionCoordinatorV020({
      connectionString: url, schema: b.schema,
      requirePluginWriteLifecycleFence: true,
      hostLifecycleAuthoritySchema: central, sharedLifecycleWorkerSchemas: inventory
    });
    const effectA = await a.prepare("run:global-schema-a");
    const effectB = await b.prepare("run:global-schema-b");
    assert.equal((await workerB.beginWrite(effectB)).state, "INVOKING");
    await workerB.markUnknown(effectB);
    assert.deepEqual(await shared.freeze(packageId), {
      state: "FROZEN", pendingCount: 2,
      pendingStates: {PREPARED: 1, UNKNOWN: 1}
    });
    await assert.rejects(workerA.beginWrite(effectA),
      /PA05_PLUGIN_WRITE_LIFECYCLE_FROZEN/);
    assert.deepEqual(await shared.transition({
      packageId, operation: "DISABLE"
    }), {status: "BLOCKED_PENDING_WRITE", pendingCount: 2});
    await assert.rejects(host.apply("DISABLE",packageId),
      error => error.code === "PA05_HOST_LIFECYCLE_PENDING_WRITE");
    assert.equal((await shared.getState(packageId)).state, "FROZEN");
    assert.ok(a.manager.listEffectiveCapabilityOperations().length > 0);
    await assert.rejects(
      createPostgresAgentExecutionCoordinatorV020({
        connectionString: url, schema: b.schema,
        requirePluginWriteLifecycleFence: true,
        hostLifecycleAuthoritySchema: central,
        sharedLifecycleWorkerSchemas: [b.schema]
      }), /PA05_WRITE_SHARED_WORKER_INVENTORY_MISMATCH/
    );
    // Inventory mutations must be rejected by a previously started Worker;
    // the next dispatch cannot trust a stale local declaration.
    await a.admin.unsafe(
      'DELETE FROM "' + central +
      '".pa05_plugin_write_worker_schemas WHERE schema_name=$1',
      [b.schema]
    );
    await assert.rejects(workerA.beginWrite(effectA),
      /PA05_WRITE_SHARED_WORKER_INVENTORY_MISMATCH/);
    await assert.rejects(shared.freeze(packageId),
      /PA05_LIFECYCLE_SHARED_WORKER_INVENTORY_CHANGED/);
    console.log("PA05_SHARED_SCHEMA_OWNER_PG=" + JSON.stringify({
      actualPostgres18: true, separateBusinessWorkerSchemas: 2,
      centralizedOwnerRowLock: true, unknownFromOtherSchemaBlocksDisable: true,
      frozenRejectsOtherWorker: true, workerInventoryFailClosed: true,
      productionWriteEnabled: false
    }));
  } finally {
    for(const x of [workerA,workerB,host,shared]) if(x) await x.close();
    try { await a.admin.unsafe('DROP SCHEMA IF EXISTS "' + central + '" CASCADE'); }
    finally { await a.close(); await b.close(); }
  }
});

test("PA05-04D4 PG18 different Schema concurrent BEGIN versus FREEZE always serializes", {
  skip: !url ? "requires isolated PostgreSQL18" : false,
  timeout: 90000
}, async () => {
  const a=await setup(),b=await setup();
  const central="pa05_global_"+randomUUID().replaceAll("-", "").slice(0,12);
  let shared,worker;
  try {
    const inventory=[a.schema,b.schema].sort();
    shared=await createPa05PluginWriteLifecycleGateV010({
      connectionString:url,schema:a.schema,manager:a.manager,
      authoritySchema:central,workerSchemas:inventory
    });
    await shared.register(packageId);
    worker=await createPostgresAgentExecutionCoordinatorV020({
      connectionString:url,schema:b.schema,
      requirePluginWriteLifecycleFence:true,
      hostLifecycleAuthoritySchema:central,sharedLifecycleWorkerSchemas:inventory
    });
    const effect=await b.prepare("run:global-schema-b-race");
    const outcomes=await Promise.allSettled([
      shared.freeze(packageId),worker.beginWrite(effect)
    ]);
    assert.equal(outcomes[0].status,"fulfilled");
    const freeze=outcomes[0].value;
    assert.equal(freeze.pendingCount,1);
    if(outcomes[1].status==="fulfilled"){
      assert.equal(outcomes[1].value.state,"INVOKING");
      assert.deepEqual(freeze.pendingStates,{INVOKING:1});
    }else{
      assert.match(String(outcomes[1].reason),
        /PA05_PLUGIN_WRITE_LIFECYCLE_FROZEN/);
      assert.deepEqual(freeze.pendingStates,{PREPARED:1});
    }
    assert.equal((await shared.getState(packageId)).state,"FROZEN");
    assert.deepEqual(await shared.transition({
      packageId,operation:"UPGRADE"
    }),{status:"BLOCKED_PENDING_WRITE",pendingCount:1});
  } finally {
    for(const x of [worker,shared]) if(x) await x.close();
    try{await a.admin.unsafe('DROP SCHEMA IF EXISTS "'+central+'" CASCADE');}
    finally{await a.close();await b.close();}
  }
});

test("PA05-04D5 PG18: legacy unfenced Worker cannot begin WRITE after central SQL Owner freeze",{
  skip:!url?"requires isolated PostgreSQL 18":false,timeout:90000
},async()=>{
  const a=await setup(),b=await setup();
  const central="pa05_sql_guard_"+randomUUID().replaceAll("-","").slice(0,12);
  let hostGate;
  try{
    const inventory=[a.schema,b.schema].sort();
    hostGate=await createPa05PluginWriteLifecycleGateV010({
      connectionString:url,schema:a.schema,manager:a.manager,
      authoritySchema:central,workerSchemas:inventory,
      enforceSqlOwnerAdmission:true
    });
    await hostGate.register(packageId);
    for(const schema of inventory){
      const rows=await a.admin.unsafe(
        "SELECT trigger_name FROM information_schema.triggers "+
        "WHERE event_object_schema=$1 AND event_object_table='pa02b_writes' "+
        "AND trigger_name='pa05_owner_write_admission'",[schema]
      );
      assert.ok(rows.length>=1,"Host-installed SQL trigger for "+schema);
    }
    const first=await b.prepare("run:legacy-begin-while-active");
    // Old V020 coordinator is deliberately unfenced: its own schema has an
    // ACTIVE local gate. Only the CENTRAL SQL trigger can stop it after freeze.
    assert.equal((await b.coordinator.beginWrite(first)).state,"INVOKING");
    await b.coordinator.markUnknown(first);
    const frozen=await hostGate.freeze(packageId);
    assert.equal(frozen.state,"FROZEN");
    assert.deepEqual(frozen.pendingStates,{UNKNOWN:1});
    const second=await a.prepare("run:legacy-unfenced-after-freeze");
    await assert.rejects(a.coordinator.beginWrite(second),
      /PA05_WRITE_SQL_OWNER_GATE_FROZEN/);
    assert.equal((await a.coordinator.getWrite(second)).state,"PREPARED");
    assert.deepEqual(await hostGate.transition({packageId,operation:"DISABLE"}),
      {status:"BLOCKED_PENDING_WRITE",pendingCount:2});
    console.log("PA05_SQL_LEGACY_WORKER_PG="+JSON.stringify({
      postgres18:true,twoBusinessSchemas:true,legacyUnfencedDeniedBySql:true,
      otherSchemaUnknownDetected:true,centralOwnerRowLock:true,
      productionWriteEnabled:false
    }));
  }finally{
    if(hostGate)await hostGate.close();
    try{await a.admin.unsafe('DROP SCHEMA IF EXISTS "'+central+'" CASCADE');}
    finally{await a.close();await b.close();}
  }
});

test("PA05-04D5 PG18 SQL trigger serializes legacy begin versus central freeze",{
  skip:!url?"requires isolated PostgreSQL 18":false,timeout:90000
},async()=>{
  const a=await setup(),b=await setup();
  const central="pa05_sql_race_"+randomUUID().replaceAll("-","").slice(0,12);
  let gate;
  try{
    gate=await createPa05PluginWriteLifecycleGateV010({
      connectionString:url,schema:a.schema,manager:a.manager,
      authoritySchema:central,workerSchemas:[a.schema,b.schema].sort(),
      enforceSqlOwnerAdmission:true
    });
    await gate.register(packageId);
    const pending=await b.prepare("run:legacy-trigger-race");
    const results=await Promise.allSettled([
      gate.freeze(packageId),b.coordinator.beginWrite(pending)
    ]);
    assert.equal(results[0].status,"fulfilled");
    const frozen=results[0].value;
    assert.equal(frozen.pendingCount,1);
    if(results[1].status==="fulfilled"){
      assert.equal(results[1].value.state,"INVOKING");
      assert.equal(frozen.pendingStates.INVOKING,1);
    }else{
      assert.match(String(results[1].reason),/PA05_WRITE_SQL_OWNER_GATE_FROZEN/);
      assert.equal(frozen.pendingStates.PREPARED,1);
    }
    assert.equal((await gate.getState(packageId)).state,"FROZEN");
  }finally{
    if(gate)await gate.close();
    try{await a.admin.unsafe('DROP SCHEMA IF EXISTS "'+central+'" CASCADE');}
    finally{await a.close();await b.close();}
  }
});


test("PA05-04D6 PG18: least-privilege Worker can invoke with SQL guard but cannot alter Host authority", {
  skip: !url ? "requires isolated PostgreSQL 18" : false,
  timeout: 90000
}, async () => {
  const a=await setup(),b=await setup();
  const central="pa05_acl_"+randomUUID().replaceAll("-","").slice(0,12);
  const roleA="pa05_worker_a_"+randomUUID().replaceAll("-","").slice(0,10);
  const roleB="pa05_worker_b_"+randomUUID().replaceAll("-","").slice(0,10);
  const roleC="pa05_worker_other_"+randomUUID().replaceAll("-","").slice(0,10);
  const secrets=Object.fromEntries([roleA,roleB,roleC].map(role=>
    [role,"test_"+randomUUID().replaceAll("-","")]));
  let gate;
  async function asRole(role, statement, params=[]) {
    // New authenticated connection, not SET ROLE. SQL SECURITY DEFINER
    // sees SESSION_USER and must pin it to the registered LOGIN identity.
    const uri=new URL(url);
    uri.username=role;
    uri.password=secrets[role];
    const client=postgres(uri.toString(),{max:1});
    try { return await client.unsafe(statement,params); }
    finally { await client.end(); }
  }
  try {
    const workerSchemas=[a.schema,b.schema].sort();
    for(const [role,schema] of [[roleA,a.schema],[roleB,b.schema],[roleC,a.schema]]) {
      await a.admin.unsafe('CREATE ROLE "'+role+'" LOGIN PASSWORD \''+secrets[role]+'\'');
      await a.admin.unsafe('GRANT USAGE ON SCHEMA "'+schema+'" TO "'+role+'"');
      await a.admin.unsafe(
        'GRANT SELECT,UPDATE ON "'+schema+'".pa02b_writes TO "'+role+'"'
      );
    }
    gate=await createPa05PluginWriteLifecycleGateV010({
      connectionString:url,schema:a.schema,manager:a.manager,
      authoritySchema:central,workerSchemas,
      enforceSqlOwnerAdmission:true,
      workerIdentities:[
        {schema:a.schema,role:roleA},{schema:b.schema,role:roleB}
      ]
    });
    await gate.register(packageId);

    const first=await a.prepare("run:pa05-least-priv-approved");
    await assert.rejects(asRole(roleC,
      'UPDATE "'+a.schema+'".pa02b_writes SET state=\'INVOKING\' '+
      'WHERE state=\'PREPARED\' RETURNING state'),
      /PA05_WRITE_SQL_WORKER_LOGIN_DENIED/);
    await assert.rejects(a.admin.begin(async tx=>{
      await tx.unsafe('SET LOCAL ROLE "'+roleA+'"');
      return tx.unsafe(
        'UPDATE "'+a.schema+'".pa02b_writes SET state=\'INVOKING\' '+
        'WHERE state=\'PREPARED\' RETURNING state');
    }),/PA05_WRITE_SQL_WORKER_LOGIN_DENIED/);
    assert.equal((await a.coordinator.getWrite({
      scope,effectId:first.effectId
    })).state,"PREPARED");
    const approved=await asRole(roleA,
      'UPDATE "'+a.schema+'".pa02b_writes SET state=\'INVOKING\' '+
      'WHERE state=\'PREPARED\' RETURNING state');
    assert.equal(approved.length,1);
    assert.equal(approved[0].state,"INVOKING");
    assert.deepEqual((await gate.freeze(packageId)).pendingStates,{INVOKING:1});
    // The Worker may manipulate its authorized business write row, but it
    // cannot drop Host-owned admission guard or revive the central Owner.
    await assert.rejects(asRole(roleA,
      'DROP TRIGGER pa05_owner_write_admission ON "'+a.schema+'".pa02b_writes'),
      /permission denied|must be owner|not owner/i);
    await assert.rejects(asRole(roleA,
      'UPDATE "'+central+'".pa05_plugin_write_lifecycle_gates SET state=\'ACTIVE\''),
      /permission denied/i);
    await assert.rejects(asRole(roleB,
      'DELETE FROM "'+central+'".pa05_plugin_write_worker_schemas'),
      /permission denied/i);
    const second=await b.prepare("run:pa05-least-priv-denied");
    await assert.rejects(asRole(roleB,
      'UPDATE "'+b.schema+'".pa02b_writes SET state=\'INVOKING\' '+
      'WHERE state=\'PREPARED\''),
      /PA05_WRITE_SQL_OWNER_GATE_FROZEN/);
    assert.equal((await b.coordinator.getWrite({
      scope,effectId:second.effectId
    })).state,"PREPARED");
    assert.deepEqual(await gate.transition({
      packageId,operation:"DISABLE"
    }),{status:"BLOCKED_PENDING_WRITE",pendingCount:2});

    // Once a role is pinned it cannot be silently replaced by privileged
    // credentials even when the Host recreates its SQL guard.
    await assert.rejects(createPa05PluginWriteLifecycleGateV010({
      connectionString:url,schema:a.schema,manager:a.manager,
      authoritySchema:central,workerSchemas,
      enforceSqlOwnerAdmission:true,
      workerIdentities:[
        {schema:a.schema,role:"agentproof"},{schema:b.schema,role:roleB}
      ]
    }),/PA05_SQL_WORKER_LOGIN_RECERTIFICATION_REQUIRED/);
    await assert.rejects(createPa05PluginWriteLifecycleGateV010({
      connectionString:url,schema:a.schema,manager:a.manager,
      authoritySchema:central,workerSchemas,
      enforceSqlOwnerAdmission:true
    }),/PA05_SQL_WORKER_LOGIN_RECERTIFICATION_REQUIRED/);
    await a.admin.unsafe(
      'GRANT UPDATE ON "'+central+
      '".pa05_plugin_write_lifecycle_gates TO "'+roleA+'"');
    await assert.rejects(createPa05PluginWriteLifecycleGateV010({
      connectionString:url,schema:a.schema,manager:a.manager,
      authoritySchema:central,workerSchemas,
      enforceSqlOwnerAdmission:true,
      workerIdentities:[{schema:a.schema,role:roleA},{schema:b.schema,role:roleB}]
    }),/PA05_SQL_WORKER_PRIVILEGES_UNSAFE/);
    console.log("PA05_PG_WORKER_LOGIN="+JSON.stringify({
      postgres18:true,authenticatedLoginRole:true,
      distinctWorkerIdentityDenied:true,setRoleSpoofDenied:true,
      approvedWorkerAllowed:true,identityPinImmutable:true,
      productionWriteEnabled:false
    }));
    console.log("PA05_PG_WORKER_ROLE_ACL="+JSON.stringify({
      postgres18:true,distinctWorkerSchemas:2,distinctLoginRoles:2,
      workerDmlAllowedWithActiveGate:true,
      triggerRemovalDenied:true,centralGateMutationDenied:true,
      centralInventoryMutationDenied:true,sqlTriggerBlocksFrozenWorker:true,
      superuserRejected:true,overprivilegedRoleRejected:true,
      wrongLoginDenied:true,setRoleImpersonationDenied:true,
      rolePinCannotDowngrade:true,productionWriteEnabled:false
    }));
  } finally {
    if(gate)await gate.close();
    try{
      await a.admin.unsafe('DROP SCHEMA IF EXISTS "'+central+'" CASCADE');
      for(const role of [roleA,roleB,roleC]) {
        await a.admin.unsafe('DROP OWNED BY "'+role+'"');
        await a.admin.unsafe('DROP ROLE IF EXISTS "'+role+'"');
      }
    }finally{
      await a.close();await b.close();
    }
  }
});
