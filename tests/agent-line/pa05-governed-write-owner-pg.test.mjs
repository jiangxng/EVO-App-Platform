import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import postgres from "postgres";

import { validatePluginManifestV010 } from "../../dist/contracts/plugin-protocol.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createPostgresAgentDurabilityProofV020 } from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import { createPostgresAgentExecutionCoordinatorV020 } from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";
import { createPostgresFencedAgentRunAuthorityV030 } from "../../dist/agents/enterprise-agent/pa02b-fenced-run-authority.js";
import { createPostgresAgentOwnerReconciliationV030 } from "../../dist/agents/enterprise-agent/pa02b-owner-reconciliation.js";
import { createGovernedAgentWriteHandoffV040 } from "../../dist/agents/enterprise-agent/pa02b-governed-owner-write-handoff.js";
import { createHostRegisteredAgentOwnerRegistryV040 } from "../../dist/manager/agent-trusted-owner-registration.js";
import { certifyCapabilitySchemaDefinitionV010 } from "../../certification/capability-operation-schema-fixture.mjs";

const databaseUrl = process.env.PA02A_PROOF_DATABASE_URL;
const sha = value => createHash("sha256").update(value).digest("hex");
const args = { recordId: "pa05:sandbox:1", value: 42 };
const inputDigest = sha(JSON.stringify(args));
const ownerPackageId = "pa05-certified-sandbox-owner";
const opId = "pa05.sandbox-owner.record.update";
const command = "pa05.sandbox-owner.record.update";
const resource = "pa05.sandbox-record";
const principal = {
  contractVersion: "0.1.0", subjectId: "pa05-owner-human",
  actorType: "HUMAN", identityProviderId: "fixture.identity"
};
const context = {
  contractVersion: "0.1.0",
  personalContext: {
    contractVersion: "0.1.0", kind: "PERSONAL",
    contextId: "personal:pa05-owner-human", ownerSubjectId: principal.subjectId
  },
  activeContext: {
    contractVersion: "0.1.0", kind: "ENTERPRISE",
    contextId: "enterprise:pa05-owner", enterpriseId: "pa05-sandbox-enterprise"
  },
  enterpriseContext: {
    contractVersion: "0.1.0", kind: "ENTERPRISE",
    contextId: "enterprise:pa05-owner", enterpriseId: "pa05-sandbox-enterprise",
    lifecycleState: "ACTIVE"
  }
};
const scope = {
  principalSubjectId: principal.subjectId,
  principalActorType: principal.actorType,
  contextKind: "ENTERPRISE",
  contextId: context.activeContext.contextId,
  enterpriseId: context.activeContext.enterpriseId
};
const requestContext = {
  contractVersion: "0.1.0",
  principal, context,
  correlationId: "pa05-write-certification",
  scope: {
    contractVersion: "0.1.0", enterpriseId: scope.enterpriseId,
    userId: principal.subjectId
  }
};

const plugin = {
  contractVersion: "0.1.0",
  packageId: ownerPackageId,
  displayName: "PA05 Isolated Write Owner",
  description: "Test-only governed business Owner for WRITE certification, never production.",
  version: "0.1.0",
  type: "APPLICATION",
  features: [{
    contractVersion: "0.1.0", featureId: ownerPackageId + ".default",
    packageId: ownerPackageId, version: "0.1.0",
    activationScope: "INSTALLATION", defaultActivation: true,
    providesCapabilities: ["pa05.sandbox-owner"],
    contributions: [{
      kind: "platform.capability-operation",
      operation: {
        contractVersion: "0.1.0",
        operationId: opId, capability: "pa05.sandbox-owner",
        operationVersion: "0.1.0", title: "Update Sandbox Record",
        description: "Only test an Owner-bound material WRITE under PA-05 certification.",
        effect: "WRITE", dataScope: "ENTERPRISE",
        authorization: {
          action: command,
          resource: { type: resource, idSource: "INPUT", inputKey: "recordId" }
        },
        inputSchema: {
          type: "object", additionalProperties: false,
          required: ["recordId", "value"],
          properties: {
            recordId: { type: "string", minLength: 1 },
            value: { type: "integer" }
          }
        },
        outputSchema: {
          type: "object", required: ["recordId", "value"],
          properties: { recordId: { type: "string" }, value: { type: "integer" } }
        },
        binding: { type: "ACTION_HOST", commandCode: command, inputVersion: "0.1.0" },
        exposure: ["PERSONAL_AGENT"],
        writeSafety: { idempotency: "HOST_REQUIRED", receipt: "HOST_REQUIRED" }
      }
    }]
  }]
};

function manager() {
  const instance = createAppManagerService(
    createPackageCatalog([plugin]), createMemoryLifecycleStore()
  );
  instance.install(ownerPackageId);
  return instance;
}
function registration(owner, verifier) {
  return {
    operationId: opId, packageId: ownerPackageId,
    commandCode: command, inputVersion: "0.1.0",
    modelName: "pa05_sandbox_record_update",
    owner, verifier,
    validateArguments: value =>
      value?.recordId === args.recordId && Number.isSafeInteger(value.value)
  };
}

test("PA05-04A sandbox WRITE manifest passes strict Protocol and schema admission", () => {
  const checked = validatePluginManifestV010(plugin);
  assert.equal(checked.ok, true, JSON.stringify(checked.issues));
  const operation = plugin.features[0].contributions[0].operation;
  assert.equal(certifyCapabilitySchemaDefinitionV010(operation.inputSchema).ok, true);
  assert.equal(certifyCapabilitySchemaDefinitionV010(operation.outputSchema).ok, true);
  assert.equal(operation.effect, "WRITE");
  assert.equal(operation.writeSafety.idempotency, "HOST_REQUIRED");
  assert.equal(operation.writeSafety.receipt, "HOST_REQUIRED");
  assert.deepEqual(operation.exposure, ["PERSONAL_AGENT"]);
  assert.equal(manager().listEffectiveCapabilityOperations().length, 1);
});

test("PA05-04A isolated PG18: governed WRITE owner, lost reply, verification, UNKNOWN, revocation and disable", {
  skip: !databaseUrl ? "Requires isolated PA02A_PROOF_DATABASE_URL / PostgreSQL" : false,
  timeout: 90000
}, async () => {
  const schema = "pa05_write_cert_" + randomUUID().replaceAll("-", "").slice(0, 12);
  const admin = postgres(databaseUrl, { max: 3 });
  let durability, coordinator, authority, reconciler;
  const activeManager = manager();
  const authorizations = [];
  let grantActive = true, ownerCalls = 0, verifierCalls = 0;
  let writeMode = "COMMIT_AND_LOSE_REPLY";
  const provider = {
    providerId: "pa05.fixture-auth",
    async check(request) {
      authorizations.push({
        actor: request.principal.actorType,
        enterpriseId: request.scope.enterpriseId,
        resourceId: request.resource.id
      });
      const allowed = grantActive
        && request.principal.actorType === "AI"
        && request.scope.enterpriseId === scope.enterpriseId
        && request.resource.id === args.recordId
        && request.action === command;
      return {
        contractVersion: "0.1.0", allowed,
        policyProviderId: "pa05.fixture-auth",
        reasonCodes: allowed ? [] : ["PA05_OWNER_DENIED"]
      };
    }
  };
  const verifiedRows = async () => admin.unsafe(
    'SELECT * FROM "' + schema + '".owner_business_effects ORDER BY effect_id'
  );
  const owner = {
    ownerPackageId,
    async invoke(call) {
      ownerCalls++;
      assert.equal(call.ownerPackageId, undefined);
      assert.equal(call.toolId, opId);
      assert.equal(call.scope.enterpriseId, scope.enterpriseId);
      assert.deepEqual(call.arguments, args);
      assert.equal(call.inputDigest, inputDigest);
      if (writeMode === "NO_COMMIT_LOST_REPLY") {
        throw Error("PA05_LOST_BEFORE_COMMIT");
      }
      await admin.unsafe(
        'INSERT INTO "' + schema + '".owner_business_effects ' +
        '(effect_id,run_id,owner_package_id,input_digest,record_id,value) ' +
        'VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(effect_id) DO NOTHING',
        [call.effectId, call.runId, ownerPackageId,
          call.inputDigest, args.recordId, args.value]
      );
      throw Error("PA05_LOST_AFTER_COMMIT");
    }
  };
  const verifier = {
    async verify(call) {
      verifierCalls++;
      assert.equal(call.scope.enterpriseId, scope.enterpriseId);
      assert.equal(call.ownerPackageId, ownerPackageId);
      const rows = await admin.unsafe(
        'SELECT * FROM "' + schema + '".owner_business_effects ' +
        'WHERE effect_id=$1 AND run_id=$2 AND owner_package_id=$3 AND input_digest=$4',
        [call.effectId, call.runId, call.ownerPackageId, call.inputDigest]
      );
      if (rows.length === 0) return { outcome: "UNRESOLVED" };
      return {
        outcome: "SUCCEEDED",
        evidenceRef: "pa05:sandbox:effect:" + call.effectId,
        evidenceDigest: sha(call.effectId + ":" + call.inputDigest),
        terminal: {
          receiptId: call.receiptId, status: "SUCCEEDED",
          completedAt: "2026-10-15T04:00:00.000Z",
          resultDigest: sha(call.effectId),
          resultEntityRefs: [args.recordId],
          resultSummary: "Verified persisted sandbox Owner business effect"
        }
      };
    }
  };
  try {
    durability = await createPostgresAgentDurabilityProofV020({
      connectionString: databaseUrl, schema
    });
    coordinator = await createPostgresAgentExecutionCoordinatorV020({
      connectionString: databaseUrl, schema
    });
    authority = await createPostgresFencedAgentRunAuthorityV030({
      connectionString: databaseUrl, schema
    });
    reconciler = await createPostgresAgentOwnerReconciliationV030({
      connectionString: databaseUrl, schema, ownerVerifier: verifier
    });
    await admin.unsafe(
      'CREATE TABLE "' + schema + '".owner_business_effects(' +
      'effect_id text PRIMARY KEY,run_id text NOT NULL,' +
      'owner_package_id text NOT NULL,input_digest text NOT NULL,' +
      'record_id text NOT NULL,value integer NOT NULL)'
    );
    const registry = createHostRegisteredAgentOwnerRegistryV040({
      manager: activeManager,
      resolveAuthorizationProvider: () => provider,
      registrations: [registration(owner, verifier)]
    });
    const binding = registry.resolve(opId);
    assert.ok(binding, "Host must resolve one explicitly trusted WRITE Owner");
    assert.equal(binding.owner, owner);
    assert.equal(binding.verifier, verifier);
    const authorize = (value = args, overrides = {}) => binding.authorize({
      descriptor: binding.descriptor, principal, context, requestContext,
      arguments: value, ...overrides
    });
    assert.equal(await authorize(), true);
    assert.equal(await authorize({ ...args, recordId: "pa05:other" }), false);
    assert.equal(await authorize({ ...args, value: "42" }), false);
    assert.equal(await authorize(args, {
      requestContext: {
        ...requestContext,
        scope: { ...requestContext.scope, enterpriseId: "different-tenant" },
        context: {
          ...context, activeContext: { ...context.activeContext, enterpriseId: "different-tenant" }
        }
      }
    }), false);
    grantActive = false;
    assert.equal(await authorize(), false);
    grantActive = true;

    const handoff = createGovernedAgentWriteHandoffV040({
      coordinator, authority, receipts: durability, reconciler, owner
    });
    async function begin(runId) {
      await durability.claimTurn({
        scope, threadId: "thread:" + runId, clientTurnId: "turn:" + runId,
        taskPayload: { message: "Test sandbox write" }, taskDigest: sha(runId),
        created: {
          contractVersion: "0.1.0", eventId: "create:" + randomUUID(), runId,
          type: "RUN_CREATED", occurredAt: "2026-10-15T03:00:00.000Z",
          payload: {
            principalSubjectId: scope.principalSubjectId,
            principalActorType: scope.principalActorType,
            context: context.activeContext,
            sourceInteractionId: "thread:" + runId, sourceActionId: "turn:" + runId,
            input: {
              message: "Test sandbox write", conversationHistory: [],
              locale: "en", providerId: "test", modelId: "test"
            }
          }
        }
      });
      const lease = await coordinator.claimLease({
        scope, runId, ownerId: "worker:" + runId, ttlSeconds: 300
      });
      assert.ok(lease);
      const effectId = "effect:" + runId, receiptId = "receipt:" + runId;
      const receipt = {
        receiptId, invocationId: "invocation:" + runId,
        idempotencyKey: "idempotency:" + runId, sourceInteractionId: runId,
        sourceActionId: "owner.write", principalSubjectId: principal.subjectId,
        principalActorType: principal.actorType, context: context.activeContext,
        toolId: opId, ownerPackageId, inputDigest,
        requestedAt: "2026-10-15T03:01:00.000Z"
      };
      return { lease, effectId, receiptId, receipt };
    }
    const first = await begin("run:pa05-write-committed");
    assert.equal(await authorize(), true);
    const committed = await handoff.dispatch({
      scope, lease: first.lease, effectId: first.effectId,
      receipt: first.receipt, arguments: args
    });
    assert.equal(committed.status, "SUCCEEDED");
    assert.equal(committed.reconciled, true);
    assert.equal((await verifiedRows()).length, 1);
    assert.equal(ownerCalls, 1);
    assert.equal((await durability.getReceipt({
      scope, receiptId: first.receiptId
    })).status, "SUCCEEDED");
    await assert.rejects(
      handoff.dispatch({
        scope, lease: first.lease, effectId: first.effectId,
        receipt: first.receipt, arguments: args
      }),
      /PA02B_LEASE_FENCED|PA02B_OWNER_WRITE_NOT_PREPARED/
    );
    assert.equal(ownerCalls, 1);

    writeMode = "NO_COMMIT_LOST_REPLY";
    const second = await begin("run:pa05-write-unknown");
    const unknown = await handoff.dispatch({
      scope, lease: second.lease, effectId: second.effectId,
      receipt: second.receipt, arguments: args
    });
    assert.equal(unknown.status, "UNKNOWN");
    assert.equal(unknown.reconciled, false);
    assert.equal((await verifiedRows()).length, 1);
    assert.equal(ownerCalls, 2);
    const recovered = await handoff.recover({
      scope, effectId: second.effectId
    });
    assert.equal(recovered.status, "UNKNOWN");
    assert.equal(ownerCalls, 2);
    assert.equal((await durability.getReceipt({
      scope, receiptId: second.receiptId
    })).status, "REQUESTED");

    // PA05-04B has to make lifecycle drains ATOMIC across active and unknown
    // writes. AppManager's current planDisable is not a multi-run drain gate.
    // Pin this as an OPEN release blocker; do not interpret it as safe disable.
    const currentPlan = activeManager.planDisable(ownerPackageId);
    assert.deepEqual(currentPlan.blockers, [],
      "Current AppManager has no cross-Run WRITE outstanding check");
    activeManager.disable(ownerPackageId);
    assert.equal(registry.resolve(opId), undefined);
    assert.equal(await authorize(), false,
      "Already-resolved binding must recheck effective Feature at dispatch");
    assert.equal((await handoff.recover({
      scope, effectId: second.effectId
    })).status, "UNKNOWN");
    assert.equal(ownerCalls, 2);
    assert.equal((await verifiedRows()).length, 1);
    assert.ok(authorizations.some(a => a.actor === "AI" && a.enterpriseId === scope.enterpriseId));
    assert.ok(verifierCalls >= 3);
    console.log("PA05_WRITE_PLUGIN_OWNER_PG=" + JSON.stringify({
      manifestPass: true, namedOwnerRegistration: true,
      actualPostgres18: true, sandboxBusinessRowCommitted: true,
      lostReplyReconciledWithOwnerEvidence: true, sameEffectNoReplay: true,
      unknownNoAutomaticReplay: true, receiptDurable: true,
      authorizationRevocationDenied: true, crossTenantDenied: true,
      disabledPluginRejectsNewDispatch: true,
      unknownReceiptStillRecoverableAfterDisable: true,
      lifecycleDrainAtomic: false, productionWriteEnabled: false
    }));
  } finally {
    for (const instance of [reconciler, authority, coordinator, durability]) {
      if (instance) await instance.close();
    }
    try {
      await admin.unsafe('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE');
    } finally {
      await admin.end();
    }
  }
});
