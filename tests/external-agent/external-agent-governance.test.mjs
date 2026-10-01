import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  createExternalAgentGovernanceServiceV010,
  resolveExternalAgentGrantEffectiveStatusV010
} from "../../dist/manager/external-agent-governance-service.js";
import {
  createMemoryExternalAgentGovernanceStoreV010
} from "../../dist/manager/external-agent-governance-store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";

function operation({
  operationId = "sample.read",
  effect = "READ",
  exposure = ["HUMAN", "EXTERNAL_AGENT"]
} = {}) {
  return {
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId,
      capability: "sample",
      operationVersion: "1.0.0",
      title: operationId,
      description: "Synthetic external Agent grant fixture.",
      effect,
      dataScope: "INSTALLATION",
      authorization: {
        action: operationId,
        resource: {
          type: "sample",
          idSource: "NONE"
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
      exposure,
      ...(effect === "WRITE"
        ? {
            writeSafety: {
              idempotency: "HOST_REQUIRED",
              receipt: "HOST_REQUIRED"
            }
          }
        : {})
    }
  };
}

function packageWithOperations(operations = [operation()]) {
  return {
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
      contributions: operations
    }]
  };
}

function createManager(operations) {
  const pkg = packageWithOperations(operations);
  const manager = createAppManagerService(
    createPackageCatalog([pkg]),
    createMemoryLifecycleStore()
  );
  manager.install(pkg.packageId);
  return manager;
}

function humanContext(subjectId = "human-1") {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId,
      actorType: "HUMAN",
      identityProviderId: "test.identity"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "ent-1",
      userId: subjectId
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:" + subjectId,
        ownerSubjectId: subjectId
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise:ent-1",
        enterpriseId: "ent-1"
      },
      enterpriseContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise:ent-1",
        enterpriseId: "ent-1",
        enterpriseProviderId: "test.enterprise",
        displayName: "Enterprise 1"
      }
    },
    correlationId: "corr-1",
    locale: "en"
  };
}

function authorizationProvider({
  denyActions = []
} = {}) {
  const calls = [];
  return {
    calls,
    provider: {
      providerId: "test.authorization",
      check(input) {
        calls.push(structuredClone(input));
        const denied = denyActions.includes(input.action);
        return {
          contractVersion: "0.1.0",
          allowed: !denied,
          policyProviderId: "test.authorization",
          reasonCodes: [denied ? "TEST_DENY" : "TEST_ALLOW"]
        };
      }
    }
  };
}

function sequentialIds() {
  let current = 0;
  return () => "id-" + String(++current);
}

async function registeredFixture({
  operations = [operation()],
  denyActions = []
} = {}) {
  const store = createMemoryExternalAgentGovernanceStoreV010();
  const manager = createManager(operations);
  const auth = authorizationProvider({ denyActions });
  const service = createExternalAgentGovernanceServiceV010({
    store,
    manager,
    resolveAuthorizationProvider: () => auth.provider,
    now: () => new Date("2026-09-30T10:00:00.000Z"),
    id: sequentialIds()
  });
  const context = humanContext();
  const agent = await service.registerAgent(context, {
    displayName: "Reference External Agent",
    publisherId: "publisher.example"
  });
  const client = await service.registerClient(context, {
    agentId: agent.agentId,
    displayName: "Reference MCP Client",
    kind: "PUBLIC",
    protocols: ["MCP"]
  });
  return { store, manager, auth, service, context, agent, client };
}

test("Agent registration, Client registration and Authority Grant are separate durable facts", async () => {
  const fixture = await registeredFixture();

  const beforeGrant = fixture.store.snapshot();
  assert.equal(beforeGrant.agents.length, 1);
  assert.equal(beforeGrant.clients.length, 1);
  assert.equal(beforeGrant.grants.length, 0);
  assert.equal(beforeGrant.agents[0].trustLevel, "REGISTERED");

  const grant = await fixture.service.createGrant(fixture.context, {
    agentId: fixture.agent.agentId,
    clientId: fixture.client.clientId,
    allowedOperationIds: ["sample.read"],
    validUntil: "2026-10-01T10:00:00.000Z",
    description: "Read-only validation"
  });

  assert.equal(grant.authorizingPrincipalSubjectId, "human-1");
  assert.equal(grant.contextId, "enterprise:ent-1");
  assert.deepEqual(grant.allowedOperationIds, ["sample.read"]);
  assert.deepEqual(grant.effectConstraints, ["READ"]);
  assert.equal(grant.state, "ACTIVE");

  const snapshot = fixture.store.snapshot();
  assert.equal(snapshot.grants.length, 1);
  assert.deepEqual(
    snapshot.events.map(item => item.type),
    ["AGENT_REGISTERED", "CLIENT_REGISTERED", "GRANT_CREATED"]
  );
});

test("Capability selector Grant delegates a bounded READ capability without enumerating operation ids", async () => {
  const fixture = await registeredFixture({
    operations: [
      operation({ operationId: "sample.read" }),
      operation({ operationId: "sample.other" })
    ]
  });

  const grant = await fixture.service.createGrant(fixture.context, {
    agentId: fixture.agent.agentId,
    clientId: fixture.client.clientId,
    capabilitySelectors: [{
      contractVersion: "0.1.0",
      capability: "sample",
      effects: ["READ"]
    }],
    validUntil: "2026-10-01T10:00:00.000Z",
    description: "Capability-level READ delegation"
  });

  assert.deepEqual(grant.allowedOperationIds, []);
  assert.deepEqual(grant.capabilitySelectors, [{
    contractVersion: "0.1.0",
    capability: "sample",
    effects: ["READ"]
  }]);
  assert.deepEqual(grant.effectConstraints, ["READ"]);
});

test("Capability selector Grant rejects a capability/effect outside current Human grantable authority", async () => {
  const fixture = await registeredFixture();

  await assert.rejects(
    () => fixture.service.createGrant(fixture.context, {
      agentId: fixture.agent.agentId,
      clientId: fixture.client.clientId,
      capabilitySelectors: [{
        contractVersion: "0.1.0",
        capability: "missing.capability",
        effects: ["READ"]
      }],
      validUntil: "2026-10-01T10:00:00.000Z"
    }),
    /EXTERNAL_AGENT_GRANT_SELECTOR_NOT_AUTHORIZED: missing\.capability::READ/
  );

  assert.equal(fixture.store.snapshot().grants.length, 0);
});

test("Grant creation attenuates to current Human authority and External Agent eligibility", async () => {
  const fixture = await registeredFixture({
    operations: [
      operation({ operationId: "sample.read" }),
      operation({
        operationId: "sample.human-only",
        exposure: ["HUMAN"]
      })
    ]
  });

  await assert.rejects(
    () => fixture.service.createGrant(fixture.context, {
      agentId: fixture.agent.agentId,
      clientId: fixture.client.clientId,
      allowedOperationIds: ["sample.human-only"],
      validUntil: "2026-10-01T10:00:00.000Z"
    }),
    /EXTERNAL_AGENT_GRANT_OPERATION_NOT_AUTHORIZED: sample.human-only/
  );

  const deniedFixture = await registeredFixture({
    denyActions: ["sample.read"]
  });
  await assert.rejects(
    () => deniedFixture.service.createGrant(deniedFixture.context, {
      agentId: deniedFixture.agent.agentId,
      clientId: deniedFixture.client.clientId,
      allowedOperationIds: ["sample.read"],
      validUntil: "2026-10-01T10:00:00.000Z"
    }),
    /EXTERNAL_AGENT_GRANT_OPERATION_NOT_AUTHORIZED: sample.read/
  );
});

test("EA-3A refuses External Agent WRITE delegation even when Human policy allows it", async () => {
  const fixture = await registeredFixture({
    operations: [
      operation({
        operationId: "sample.write",
        effect: "WRITE"
      })
    ]
  });

  await assert.rejects(
    () => fixture.service.createGrant(fixture.context, {
      agentId: fixture.agent.agentId,
      clientId: fixture.client.clientId,
      allowedOperationIds: ["sample.write"],
      validUntil: "2026-10-01T10:00:00.000Z"
    }),
    /EXTERNAL_AGENT_WRITE_NOT_ENABLED: sample.write/
  );
  assert.equal(fixture.store.snapshot().grants.length, 0);
});

test("Grant requires explicit future expiration and is bound to the current Host Context", async () => {
  const fixture = await registeredFixture();

  await assert.rejects(
    () => fixture.service.createGrant(fixture.context, {
      agentId: fixture.agent.agentId,
      clientId: fixture.client.clientId,
      allowedOperationIds: ["sample.read"],
      validUntil: "2026-09-30T09:59:59.000Z"
    }),
    /EXTERNAL_AGENT_GRANT_VALID_UNTIL_INVALID/
  );

  const grant = await fixture.service.createGrant(fixture.context, {
    agentId: fixture.agent.agentId,
    clientId: fixture.client.clientId,
    allowedOperationIds: ["sample.read"],
    validUntil: "2026-10-01T10:00:00.000Z"
  });
  assert.equal(grant.contextId, "enterprise:ent-1");
});

test("Grant revocation is terminal and preserves immutable creation facts", async () => {
  const fixture = await registeredFixture();
  const grant = await fixture.service.createGrant(fixture.context, {
    agentId: fixture.agent.agentId,
    clientId: fixture.client.clientId,
    allowedOperationIds: ["sample.read"],
    validUntil: "2026-10-01T10:00:00.000Z"
  });

  const revoked = await fixture.service.revokeGrant(
    fixture.context,
    grant.grantId
  );
  assert.equal(revoked.state, "REVOKED");
  assert.equal(revoked.authorizingPrincipalSubjectId, "human-1");
  assert.deepEqual(revoked.allowedOperationIds, ["sample.read"]);

  await assert.rejects(
    () => fixture.service.revokeGrant(fixture.context, grant.grantId),
    /EXTERNAL_AGENT_GRANT_ALREADY_REVOKED/
  );

  const snapshot = fixture.store.snapshot();
  const tampered = structuredClone(snapshot);
  tampered.grants[0].allowedOperationIds = ["sample.changed"];
  assert.throws(
    () => fixture.store.save(tampered),
    /EXTERNAL_AGENT_GRANT_CREATION_FACT_IMMUTABLE/
  );
});

test("Agent or Client revocation makes an otherwise ACTIVE historical Grant ineffective", async () => {
  const fixture = await registeredFixture();
  const grant = await fixture.service.createGrant(fixture.context, {
    agentId: fixture.agent.agentId,
    clientId: fixture.client.clientId,
    allowedOperationIds: ["sample.read"],
    validUntil: "2026-10-01T10:00:00.000Z"
  });

  const active = resolveExternalAgentGrantEffectiveStatusV010({
    store: fixture.store,
    grantId: grant.grantId,
    agentId: fixture.agent.agentId,
    clientId: fixture.client.clientId,
    at: new Date("2026-09-30T11:00:00.000Z")
  });
  assert.equal(active.active, true);
  assert.equal(active.reason, "ACTIVE");

  await fixture.service.revokeClient(
    fixture.context,
    fixture.client.clientId
  );

  const clientRevoked = resolveExternalAgentGrantEffectiveStatusV010({
    store: fixture.store,
    grantId: grant.grantId,
    agentId: fixture.agent.agentId,
    clientId: fixture.client.clientId,
    at: new Date("2026-09-30T11:00:00.000Z")
  });
  assert.equal(clientRevoked.active, false);
  assert.equal(clientRevoked.reason, "CLIENT_NOT_ACTIVE");

  const historicalGrant = fixture.store.snapshot().grants[0];
  assert.equal(historicalGrant.state, "ACTIVE");
});

test("Grant validity is fail-closed for identity mismatch and expiration", async () => {
  const fixture = await registeredFixture();
  const grant = await fixture.service.createGrant(fixture.context, {
    agentId: fixture.agent.agentId,
    clientId: fixture.client.clientId,
    allowedOperationIds: ["sample.read"],
    validUntil: "2026-10-01T10:00:00.000Z"
  });

  assert.equal(
    resolveExternalAgentGrantEffectiveStatusV010({
      store: fixture.store,
      grantId: grant.grantId,
      agentId: "other-agent",
      clientId: fixture.client.clientId,
      at: new Date("2026-09-30T11:00:00.000Z")
    }).reason,
    "GRANT_AGENT_MISMATCH"
  );

  assert.equal(
    resolveExternalAgentGrantEffectiveStatusV010({
      store: fixture.store,
      grantId: grant.grantId,
      agentId: fixture.agent.agentId,
      clientId: fixture.client.clientId,
      at: new Date("2026-10-01T10:00:00.000Z")
    }).reason,
    "GRANT_EXPIRED"
  );
});

test("governance events are append-only and terminal Agent revocation cannot be reversed", async () => {
  const fixture = await registeredFixture();
  await fixture.service.revokeAgent(
    fixture.context,
    fixture.agent.agentId
  );

  const snapshot = fixture.store.snapshot();
  const reactivated = structuredClone(snapshot);
  reactivated.agents[0].state = "ACTIVE";
  delete reactivated.agents[0].revokedAt;
  delete reactivated.agents[0].revokedBySubjectId;
  assert.throws(
    () => fixture.store.save(reactivated),
    /EXTERNAL_AGENT_REACTIVATION_FORBIDDEN/
  );

  const removedEvent = structuredClone(snapshot);
  removedEvent.events.pop();
  assert.throws(
    () => fixture.store.save(removedEvent),
    /EXTERNAL_AGENT_GOVERNANCE_EVENTS_APPEND_ONLY/
  );
});

test("governance listing includes registrations created by the current Human before a Grant exists", async () => {
  const fixture = await registeredFixture();
  const listing = await fixture.service.listForPrincipal(fixture.context);
  assert.deepEqual(
    listing.agents.map(item => item.agentId),
    [fixture.agent.agentId]
  );
  assert.deepEqual(
    listing.clients.map(item => item.clientId),
    [fixture.client.clientId]
  );
  assert.deepEqual(listing.grants, []);
});


test("Human consent enrollment atomically creates one public CIMD Agent and Client", async () => {
  const store = createMemoryExternalAgentGovernanceStoreV010();
  const manager = createManager([operation()]);
  const auth = authorizationProvider();
  const service = createExternalAgentGovernanceServiceV010({
    store,
    manager,
    resolveAuthorizationProvider: () => auth.provider,
    now: () => new Date("2026-09-30T10:00:00.000Z"),
    id: sequentialIds()
  });
  const context = humanContext();

  const first = await service.ensurePublicCimdClient(context, {
    oauthClientId: "https://client.example/mcp-client.json",
    displayName: "Consent Client"
  });

  assert.equal(first.created, true);
  assert.equal(first.agent.trustLevel, "REGISTERED");
  assert.equal(first.client.kind, "PUBLIC");
  assert.deepEqual(first.client.protocols, ["MCP"]);
  assert.equal(
    first.client.oauthClientId,
    "https://client.example/mcp-client.json"
  );

  const snapshot = store.snapshot();
  assert.equal(snapshot.agents.length, 1);
  assert.equal(snapshot.clients.length, 1);
  assert.deepEqual(
    snapshot.events.map(item => item.type),
    ["AGENT_REGISTERED", "CLIENT_REGISTERED"]
  );

  const second = await service.ensurePublicCimdClient(context, {
    oauthClientId: "https://client.example/mcp-client.json",
    displayName: "Consent Client"
  });
  assert.equal(second.created, false);
  assert.equal(second.agent.agentId, first.agent.agentId);
  assert.equal(second.client.clientId, first.client.clientId);
  assert.equal(store.snapshot().agents.length, 1);
  assert.equal(store.snapshot().clients.length, 1);
});

test("Human consent grantable catalog excludes WRITE and non-External-Agent operations", async () => {
  const store = createMemoryExternalAgentGovernanceStoreV010();
  const manager = createManager([
    operation({ operationId: "sample.read" }),
    operation({ operationId: "sample.plan", effect: "PLAN" }),
    operation({ operationId: "sample.write", effect: "WRITE" }),
    operation({
      operationId: "sample.human-only",
      exposure: ["HUMAN"]
    })
  ]);
  const auth = authorizationProvider();
  const service = createExternalAgentGovernanceServiceV010({
    store,
    manager,
    resolveAuthorizationProvider: () => auth.provider,
    now: () => new Date("2026-09-30T10:00:00.000Z"),
    id: sequentialIds()
  });

  const grantable = await service.listGrantableOperations(humanContext());
  assert.deepEqual(
    grantable.map(item => item.operationId),
    ["sample.plan", "sample.read"]
  );
  assert.deepEqual(
    grantable.map(item => item.effect),
    ["PLAN", "READ"]
  );
});

test("Human consent enrollment cannot reactivate a revoked CIMD Client", async () => {
  const fixture = await registeredFixture();
  const client = await fixture.service.registerClient(
    fixture.context,
    {
      agentId: fixture.agent.agentId,
      displayName: "Consent OAuth Client",
      kind: "PUBLIC",
      protocols: ["MCP"],
      oauthClientId: "https://client.example/consent.json"
    }
  );
  await fixture.service.revokeClient(
    fixture.context,
    client.clientId
  );

  await assert.rejects(
    () => fixture.service.ensurePublicCimdClient(
      fixture.context,
      {
        oauthClientId: "https://client.example/consent.json",
        displayName: "Consent OAuth Client"
      }
    ),
    /EXTERNAL_AGENT_OAUTH_CLIENT_NOT_ACTIVE/
  );
});

test("OAuth client identity binding is unique, HTTPS and immutable", async () => {
  const store = createMemoryExternalAgentGovernanceStoreV010();
  const manager = createManager([operation()]);
  const auth = authorizationProvider();
  const service = createExternalAgentGovernanceServiceV010({
    store,
    manager,
    resolveAuthorizationProvider: () => auth.provider,
    now: () => new Date("2026-09-30T10:00:00.000Z"),
    id: sequentialIds()
  });
  const context = humanContext();
  const agent = await service.registerAgent(context, {
    displayName: "OAuth Agent"
  });

  const first = await service.registerClient(context, {
    agentId: agent.agentId,
    displayName: "OAuth MCP Client",
    kind: "PUBLIC",
    protocols: ["MCP"],
    oauthClientId: "https://client.example/mcp-client.json"
  });
  assert.equal(
    first.oauthClientId,
    "https://client.example/mcp-client.json"
  );

  await assert.rejects(
    () => service.registerClient(context, {
      agentId: agent.agentId,
      displayName: "Duplicate OAuth Client",
      kind: "PUBLIC",
      protocols: ["MCP"],
      oauthClientId: "https://client.example/mcp-client.json"
    }),
    /EXTERNAL_AGENT_OAUTH_CLIENT_ID_DUPLICATE/
  );

  await assert.rejects(
    () => service.registerClient(context, {
      agentId: agent.agentId,
      displayName: "Invalid OAuth Client",
      kind: "PUBLIC",
      protocols: ["MCP"],
      oauthClientId: "http://client.example/mcp-client.json"
    }),
    /EXTERNAL_AGENT_OAUTH_CLIENT_ID_INVALID/
  );

  const snapshot = store.snapshot();
  const tampered = structuredClone(snapshot);
  tampered.clients[0].oauthClientId = "https://other.example/client.json";
  assert.throws(
    () => store.save(tampered),
    /EXTERNAL_AGENT_CLIENT_CREATION_FACT_IMMUTABLE/
  );
});
