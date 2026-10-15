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

async function setup() {
  const schema = "pa05_lifecycle_" + randomUUID().replaceAll("-", "").slice(0, 12);
  const admin = postgres(url, { max: 3 });
  let durability, coordinator, reconciler, gate;
  const m = manager();
  let verification = "UNRESOLVED";
  const verifier = {
    async verify(r) {
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
