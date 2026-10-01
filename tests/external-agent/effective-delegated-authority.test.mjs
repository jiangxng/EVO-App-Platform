import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  listEffectiveDelegatedCapabilityOperationsV010,
  resolveEffectiveDelegatedCapabilityOperationV010
} from "../../dist/manager/external-agent-delegated-access.js";
import {
  createMemoryExternalAgentGovernanceStoreV010
} from "../../dist/manager/external-agent-governance-store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";

function capabilityOperation(operationId = "sample.read") {
  return {
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId,
      capability: "sample",
      operationVersion: "1.0.0",
      title: operationId,
      description: "Delegated authority fixture.",
      effect: "READ",
      dataScope: "ENTERPRISE",
      authorization: {
        action: operationId,
        resource: {
          type: "sample",
          idSource: "DATA_SCOPE"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {}
      },
      outputSchema: {
        type: "object"
      },
      binding: {
        type: "ACTION_HOST",
        commandCode: operationId,
        inputVersion: "0.1.0"
      },
      exposure: ["HUMAN", "EXTERNAL_AGENT"]
    }
  };
}

function manager() {
  const pkg = {
    contractVersion: "0.1.0",
    packageId: "sample-plugin",
    displayName: "Sample Plugin",
    version: "0.1.0",
    type: "APPLICATION",
    features: [{
      contractVersion: "0.1.0",
      featureId: "sample-plugin.default",
      packageId: "sample-plugin",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: ["sample"],
      contributions: [
        capabilityOperation("sample.read"),
        capabilityOperation("sample.other")
      ]
    }]
  };
  const service = createAppManagerService(
    createPackageCatalog([pkg]),
    createMemoryLifecycleStore()
  );
  service.install(pkg.packageId);
  return service;
}

function governanceStore({
  grantState = "ACTIVE",
  clientState = "ACTIVE",
  agentState = "ACTIVE",
  validUntil = "2026-10-01T10:00:00.000Z",
  capabilitySelector = false
} = {}) {
  const revoked = "2026-09-30T10:30:00.000Z";
  return createMemoryExternalAgentGovernanceStoreV010({
    contractVersion: "0.1.0",
    agents: [{
      contractVersion: "0.1.0",
      agentId: "agent-1",
      displayName: "Reference Agent",
      trustLevel: "REGISTERED",
      state: agentState,
      createdAt: "2026-09-30T09:00:00.000Z",
      createdBySubjectId: "human-1",
      ...(agentState === "REVOKED"
        ? { revokedAt: revoked, revokedBySubjectId: "human-1" }
        : {})
    }],
    clients: [{
      contractVersion: "0.1.0",
      clientId: "client-1",
      agentId: "agent-1",
      displayName: "Reference Client",
      kind: "PUBLIC",
      protocols: ["MCP"],
      state: clientState,
      createdAt: "2026-09-30T09:05:00.000Z",
      createdBySubjectId: "human-1",
      ...(clientState === "REVOKED"
        ? { revokedAt: revoked, revokedBySubjectId: "human-1" }
        : {})
    }],
    grants: [{
      contractVersion: "0.1.0",
      grantId: "grant-1",
      agentId: "agent-1",
      clientId: "client-1",
      authorizingPrincipalSubjectId: "human-1",
      contextId: "enterprise:ent-1",
      allowedOperationIds: capabilitySelector ? [] : ["sample.read"],
      ...(capabilitySelector
        ? {
            capabilitySelectors: [{
              contractVersion: "0.1.0",
              capability: "sample",
              effects: ["READ"]
            }]
          }
        : {}),
      effectConstraints: ["READ"],
      state: grantState,
      validFrom: "2026-09-30T10:00:00.000Z",
      validUntil,
      createdAt: "2026-09-30T10:00:00.000Z",
      createdBySubjectId: "human-1",
      ...(grantState === "REVOKED"
        ? { revokedAt: revoked, revokedBySubjectId: "human-1" }
        : {})
    }],
    events: []
  });
}

function mutableSources() {
  const state = {
    humanState: "ACTIVE",
    membershipActive: true,
    policyAllowed: true
  };
  const authorizationCalls = [];

  const principal = {
    contractVersion: "0.1.0",
    subjectId: "human-1",
    actorType: "HUMAN",
    identityProviderId: "generic.oidc",
    displayName: "Current Human"
  };

  return {
    state,
    authorizationCalls,
    identityDirectory: {
      providerId: "test.identity-directory",
      get(subjectId) {
        if (subjectId !== "human-1") return undefined;
        return {
          contractVersion: "0.1.0",
          principal: structuredClone(principal),
          state: state.humanState,
          firstSeenAt: "2026-09-29T10:00:00.000Z",
          lastAuthenticatedAt: "2026-09-30T09:30:00.000Z",
          updatedAt: "2026-09-30T09:30:00.000Z",
          ...(state.humanState === "DISABLED"
            ? {
                disabledAt: "2026-09-30T10:30:00.000Z",
                disabledBySubjectId: "admin-1"
              }
            : {})
        };
      },
      list() {
        const current = this.get("human-1");
        return current ? [current] : [];
      }
    },
    enterpriseDirectory: {
      providerId: "test.enterprise-directory",
      list() {
        return [{
          contractVersion: "0.1.0",
          enterpriseId: "ent-1",
          enterpriseProviderId: "test.enterprise-directory",
          contextId: "enterprise:ent-1",
          kind: "ENTERPRISE",
          lifecycleState: "ACTIVE",
          displayName: "Enterprise 1"
        }];
      }
    },
    enterpriseGrants: {
      providerId: "test.enterprise-grants",
      listForPrincipal(currentPrincipal) {
        if (
          currentPrincipal.subjectId !== "human-1"
          || !state.membershipActive
        ) {
          return [];
        }
        return [{
          contractVersion: "0.1.0",
          grantId: "membership-1",
          subjectId: "human-1",
          contextId: "enterprise:ent-1",
          state: "ACTIVE"
        }];
      }
    },
    authorizationProvider: {
      providerId: "test.authorization",
      check(input) {
        authorizationCalls.push(structuredClone(input));
        return {
          contractVersion: "0.1.0",
          allowed: state.policyAllowed,
          policyProviderId: "test.authorization",
          reasonCodes: [state.policyAllowed ? "TEST_ALLOW" : "TEST_DENY"]
        };
      }
    }
  };
}

function dependencies(overrides = {}) {
  const sources = mutableSources();
  return {
    sources,
    dependencies: {
      store: governanceStore(),
      manager: manager(),
      identityDirectory: sources.identityDirectory,
      enterpriseDirectory: sources.enterpriseDirectory,
      enterpriseGrants: sources.enterpriseGrants,
      authorizationProvider: sources.authorizationProvider,
      now: () => new Date("2026-09-30T11:00:00.000Z"),
      ...overrides
    }
  };
}

async function catalog(fixture) {
  return listEffectiveDelegatedCapabilityOperationsV010({
    dependencies: fixture.dependencies,
    grantId: "grant-1",
    agentId: "agent-1",
    clientId: "client-1",
    correlationId: "corr-1"
  });
}

test("effective delegated catalog intersects current Human authority with stored Grant", async () => {
  const fixture = dependencies();
  const result = await catalog(fixture);

  assert.equal(result.active, true);
  assert.equal(result.reason, "ACTIVE");
  assert.deepEqual(
    result.operations.map(item => item.operationId),
    ["sample.read"]
  );
  assert.equal(result.context.activeContext.contextId, "enterprise:ent-1");
  assert.equal(fixture.sources.authorizationCalls.length, 2);
  assert.equal(
    fixture.sources.authorizationCalls[0].principal.displayName,
    "Current Human"
  );
  assert.equal(
    fixture.sources.authorizationCalls[0].scope.enterpriseId,
    "ent-1"
  );
});

test("capability selector dynamically resolves all current READ operations in that capability", async () => {
  const fixture = dependencies({
    store: governanceStore({ capabilitySelector: true })
  });

  const result = await catalog(fixture);
  assert.equal(result.active, true);
  assert.deepEqual(
    result.operations.map(item => item.operationId),
    ["sample.other", "sample.read"]
  );

  const direct = await resolveEffectiveDelegatedCapabilityOperationV010({
    dependencies: fixture.dependencies,
    grantId: "grant-1",
    agentId: "agent-1",
    clientId: "client-1",
    operationId: "sample.other",
    correlationId: "corr-selector"
  });
  assert.equal(direct.allowed, true);
  assert.equal(direct.operation.operationId, "sample.other");
});

test("disabled current Human immediately removes all delegated authority without rewriting Grant", async () => {
  const fixture = dependencies();
  fixture.sources.state.humanState = "DISABLED";

  const result = await catalog(fixture);
  assert.equal(result.active, false);
  assert.equal(result.reason, "AUTHORIZING_PRINCIPAL_NOT_ACTIVE");
  assert.deepEqual(result.operations, []);
  assert.equal(
    fixture.dependencies.store.snapshot().grants[0].state,
    "ACTIVE"
  );
});

test("removed Enterprise membership makes the historical Grant context unavailable", async () => {
  const fixture = dependencies();
  fixture.sources.state.membershipActive = false;

  const result = await catalog(fixture);
  assert.equal(result.active, false);
  assert.equal(result.reason, "GRANT_CONTEXT_NOT_AVAILABLE");
  assert.deepEqual(result.operations, []);
});

test("current authorization policy DENY removes operation even while Grant remains ACTIVE", async () => {
  const fixture = dependencies();
  fixture.sources.state.policyAllowed = false;

  const result = await catalog(fixture);
  assert.equal(result.active, true);
  assert.equal(result.reason, "ACTIVE");
  assert.deepEqual(result.operations, []);
  assert.ok(
    result.evaluations.some(item =>
      item.operationId === "sample.read"
      && item.allowed === false
      && item.reasonCodes.includes("TEST_DENY")
    )
  );

  const direct = await resolveEffectiveDelegatedCapabilityOperationV010({
    dependencies: fixture.dependencies,
    grantId: "grant-1",
    agentId: "agent-1",
    clientId: "client-1",
    operationId: "sample.read",
    correlationId: "corr-2"
  });
  assert.equal(direct.allowed, false);
  assert.equal(direct.reason, "OPERATION_NOT_CURRENTLY_AUTHORIZED");
});

test("plugin lifecycle is re-evaluated on every delegated discovery/invocation", async () => {
  const fixture = dependencies();
  const before = await catalog(fixture);
  assert.deepEqual(before.operations.map(item => item.operationId), ["sample.read"]);

  fixture.dependencies.manager.disable("sample-plugin");

  const after = await catalog(fixture);
  assert.equal(after.active, true);
  assert.deepEqual(after.operations, []);

  const direct = await resolveEffectiveDelegatedCapabilityOperationV010({
    dependencies: fixture.dependencies,
    grantId: "grant-1",
    agentId: "agent-1",
    clientId: "client-1",
    operationId: "sample.read",
    correlationId: "corr-3"
  });
  assert.equal(direct.allowed, false);
  assert.equal(direct.reason, "OPERATION_NOT_CURRENTLY_AUTHORIZED");
});

test("direct invocation distinguishes operation outside Grant from later current-authority denial", async () => {
  const fixture = dependencies();

  const notGranted = await resolveEffectiveDelegatedCapabilityOperationV010({
    dependencies: fixture.dependencies,
    grantId: "grant-1",
    agentId: "agent-1",
    clientId: "client-1",
    operationId: "sample.other",
    correlationId: "corr-4"
  });
  assert.equal(notGranted.allowed, false);
  assert.equal(notGranted.reason, "OPERATION_NOT_GRANTED");
});

test("revoked Client and expired Grant fail before Human authorization is evaluated", async () => {
  const revoked = dependencies({
    store: governanceStore({ clientState: "REVOKED" })
  });
  const revokedResult = await catalog(revoked);
  assert.equal(revokedResult.active, false);
  assert.equal(revokedResult.reason, "CLIENT_NOT_ACTIVE");
  assert.equal(revoked.sources.authorizationCalls.length, 0);

  const expired = dependencies({
    store: governanceStore({
      validUntil: "2026-09-30T10:30:00.000Z"
    })
  });
  const expiredResult = await catalog(expired);
  assert.equal(expiredResult.active, false);
  assert.equal(expiredResult.reason, "GRANT_EXPIRED");
  assert.equal(expired.sources.authorizationCalls.length, 0);
});

test("missing current identity and context authorities fail closed", async () => {
  const noIdentity = dependencies({ identityDirectory: undefined });
  const noIdentityResult = await catalog(noIdentity);
  assert.equal(noIdentityResult.active, false);
  assert.equal(noIdentityResult.reason, "IDENTITY_DIRECTORY_UNAVAILABLE");

  const noMembershipDirectory = dependencies({
    enterpriseGrants: undefined
  });
  const noMembershipResult = await catalog(noMembershipDirectory);
  assert.equal(noMembershipResult.active, false);
  assert.equal(
    noMembershipResult.reason,
    "ENTERPRISE_CONTEXT_GRANT_DIRECTORY_UNAVAILABLE"
  );
});
