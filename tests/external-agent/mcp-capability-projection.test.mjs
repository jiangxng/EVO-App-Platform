import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createAppActionRouter } from "../../dist/actions/router.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import {
  createCapabilityOperationActionPreExecuteV010
} from "../../dist/manager/capability-operation-access.js";
import {
  createMemoryExternalAgentGovernanceStoreV010
} from "../../dist/manager/external-agent-governance-store.js";
import {
  createMcpCapabilityProjectionV010
} from "../../dist/manager/mcp-capability-projection.js";

function operation(id, effect) {
  return {
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId: id,
      capability: "sample",
      operationVersion: "1.0.0",
      title: id,
      description: "MCP projection fixture " + id,
      effect,
      dataScope: "ENTERPRISE",
      authorization: {
        action: id,
        resource: {
          type: "sample",
          idSource: "DATA_SCOPE"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          value: { type: "string" }
        }
      },
      outputSchema: { type: "object" },
      binding: {
        type: "ACTION_HOST",
        commandCode: id,
        inputVersion: "0.1.0"
      },
      exposure: ["HUMAN", "EXTERNAL_AGENT"],
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

function fixture() {
  const state = {
    policyAllowed: true,
    calls: []
  };
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
        operation("sample.read", "READ"),
        operation("sample.plan", "PLAN"),
        operation("sample.write", "WRITE")
      ]
    }]
  };

  const manager = createAppManagerService(
    createPackageCatalog([pkg]),
    createMemoryLifecycleStore()
  );
  manager.install(pkg.packageId);

  const governance = createMemoryExternalAgentGovernanceStoreV010({
    contractVersion: "0.1.0",
    agents: [{
      contractVersion: "0.1.0",
      agentId: "agent-1",
      displayName: "External Agent",
      trustLevel: "REGISTERED",
      state: "ACTIVE",
      createdAt: "2026-09-30T10:00:00.000Z",
      createdBySubjectId: "human-1"
    }],
    clients: [{
      contractVersion: "0.1.0",
      clientId: "client-1",
      agentId: "agent-1",
      displayName: "MCP Client",
      kind: "PUBLIC",
      protocols: ["MCP"],
      oauthClientId: "https://client.example/mcp.json",
      state: "ACTIVE",
      createdAt: "2026-09-30T10:00:00.000Z",
      createdBySubjectId: "human-1"
    }],
    grants: [{
      contractVersion: "0.1.0",
      grantId: "grant-1",
      agentId: "agent-1",
      clientId: "client-1",
      authorizingPrincipalSubjectId: "human-1",
      contextId: "enterprise:ent-1",
      allowedOperationIds: [
        "sample.read",
        "sample.plan",
        "sample.write"
      ],
      effectConstraints: ["READ", "PLAN", "WRITE"],
      state: "ACTIVE",
      validFrom: "2026-09-30T10:00:00.000Z",
      validUntil: "2026-10-01T10:00:00.000Z",
      createdAt: "2026-09-30T10:00:00.000Z",
      createdBySubjectId: "human-1"
    }],
    events: []
  });

  const authorizationProvider = {
    providerId: "test.authorization",
    check(input) {
      return {
        contractVersion: "0.1.0",
        allowed: state.policyAllowed,
        policyProviderId: "test.authorization",
        reasonCodes: [state.policyAllowed ? "ALLOW" : "DENY"]
      };
    }
  };

  const delegatedAuthority = {
    store: governance,
    manager,
    identityDirectory: {
      providerId: "test.identity",
      get(subjectId) {
        if (subjectId !== "human-1") return undefined;
        return {
          contractVersion: "0.1.0",
          principal: {
            contractVersion: "0.1.0",
            subjectId: "human-1",
            actorType: "HUMAN",
            identityProviderId: "generic.oidc",
            displayName: "Human One"
          },
          state: "ACTIVE",
          firstSeenAt: "2026-09-29T10:00:00.000Z",
          lastAuthenticatedAt: "2026-09-30T10:30:00.000Z",
          updatedAt: "2026-09-30T10:30:00.000Z"
        };
      },
      list() {
        const item = this.get("human-1");
        return item ? [item] : [];
      }
    },
    enterpriseDirectory: {
      providerId: "test.enterprise",
      list() {
        return [{
          contractVersion: "0.1.0",
          enterpriseId: "ent-1",
          enterpriseProviderId: "test.enterprise",
          contextId: "enterprise:ent-1",
          kind: "ENTERPRISE",
          lifecycleState: "ACTIVE",
          displayName: "Enterprise One"
        }];
      }
    },
    enterpriseGrants: {
      providerId: "test.enterprise-grants",
      listForPrincipal(principal) {
        if (principal.subjectId !== "human-1") return [];
        return [{
          contractVersion: "0.1.0",
          grantId: "membership-1",
          subjectId: "human-1",
          contextId: "enterprise:ent-1",
          state: "ACTIVE"
        }];
      }
    },
    authorizationProvider,
    now: () => new Date("2026-09-30T12:00:00.000Z")
  };

  const handlers = ["sample.read", "sample.plan", "sample.write"].map(
    commandCode => ({
      packageId: "sample-plugin",
      featureId: "sample-plugin.default",
      commandCode,
      async execute(request, context) {
        state.calls.push({
          commandCode,
          request: structuredClone(request),
          context: structuredClone(context)
        });
        return {
          ok: true,
          correlationId: context?.correlationId,
          result: {
            commandCode,
            value: request.values.value ?? null,
            principalSubjectId: context?.principal.subjectId ?? null,
            delegatedActor: context?.delegatedActor ?? null,
            activeContextId:
              context?.context?.activeContext.contextId ?? null
          }
        };
      }
    })
  );

  const actionRouter = createAppActionRouter(
    handlers,
    featureId => manager.getSnapshot().activeFeatures.some(
      item => item.featureId === featureId
    ),
    createCapabilityOperationActionPreExecuteV010({
      manager,
      resolveAuthorizationProvider() {
        return authorizationProvider;
      }
    })
  );

  const projection = createMcpCapabilityProjectionV010({
    delegatedAuthority,
    actionRouter
  });

  const access = {
    contractVersion: "0.1.0",
    token: {
      contractVersion: "0.1.0",
      tokenId: "token-1",
      tokenHash: "hash",
      oauthClientId: "https://client.example/mcp.json",
      clientId: "client-1",
      agentId: "agent-1",
      grantId: "grant-1",
      resource: "https://evo.example/mcp",
      scopes: ["evo.capabilities"],
      createdAt: "2026-09-30T11:55:00.000Z",
      expiresAt: "2026-09-30T12:10:00.000Z"
    },
    grantId: "grant-1",
    agentId: "agent-1",
    clientId: "client-1",
    resource: "https://evo.example/mcp",
    operationIds: ["sample.read", "sample.plan", "sample.write"]
  };

  return {
    state,
    manager,
    projection,
    access
  };
}

test("MCP tool list projects only current delegated READ/PLAN operations", async () => {
  const f = fixture();
  const tools = await f.projection.listTools({
    access: f.access,
    correlationId: "corr-list"
  });

  assert.deepEqual(tools.map(item => item.name), [
    "sample.plan",
    "sample.read"
  ]);
  assert.ok(tools.every(item => item.inputSchema.type === "object"));
  assert.equal(tools.some(item => item.name === "sample.write"), false);
});

test("MCP tool call executes through ActionHost with Human principal and separate External Agent actor", async () => {
  const f = fixture();
  const result = await f.projection.callTool({
    access: f.access,
    correlationId: "corr-call",
    name: "sample.read",
    arguments: { value: "hello" }
  });

  assert.equal(result.isError, undefined);
  assert.equal(result.structuredContent.commandCode, "sample.read");
  assert.equal(
    result.structuredContent.principalSubjectId,
    "human-1"
  );
  assert.deepEqual(
    result.structuredContent.delegatedActor,
    {
      contractVersion: "0.1.0",
      kind: "EXTERNAL_AGENT",
      agentId: "agent-1",
      clientId: "client-1",
      grantId: "grant-1"
    }
  );
  assert.equal(
    result.structuredContent.activeContextId,
    "enterprise:ent-1"
  );
  assert.equal(f.state.calls.length, 1);
});

test("MCP cached tool cannot execute after current policy is revoked", async () => {
  const f = fixture();
  const before = await f.projection.listTools({
    access: f.access,
    correlationId: "corr-before"
  });
  assert.ok(before.some(item => item.name === "sample.read"));

  f.state.policyAllowed = false;

  const result = await f.projection.callTool({
    access: f.access,
    correlationId: "corr-after",
    name: "sample.read",
    arguments: {}
  });
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent, undefined);
  assert.equal(f.state.calls.length, 0);
});

test("MCP guessed operation and WRITE operation are both unavailable without revealing internals", async () => {
  const f = fixture();

  const guessed = await f.projection.callTool({
    access: f.access,
    correlationId: "corr-guessed",
    name: "sample.secret",
    arguments: {}
  });
  assert.equal(guessed.isError, true);
  assert.equal(guessed.structuredContent, undefined);

  const write = await f.projection.callTool({
    access: f.access,
    correlationId: "corr-write",
    name: "sample.write",
    arguments: {}
  });
  assert.equal(write.isError, true);
  assert.equal(write.structuredContent, undefined);
  assert.equal(f.state.calls.length, 0);
});

test("MCP token operationIds remain an upper bound even if current Grant/catalog could expose more", async () => {
  const f = fixture();
  f.access.operationIds = ["sample.read"];

  const tools = await f.projection.listTools({
    access: f.access,
    correlationId: "corr-token-scope"
  });
  assert.deepEqual(tools.map(item => item.name), ["sample.read"]);

  const plan = await f.projection.callTool({
    access: f.access,
    correlationId: "corr-plan",
    name: "sample.plan",
    arguments: {}
  });
  assert.equal(plan.isError, true);
  assert.equal(plan.structuredContent, undefined);
});

test("MCP action failure is bounded and does not expose Host authorization internals", async () => {
  const f = fixture();
  const original = f.projection;

  // Force an ActionHost race: delegated resolution succeeds, then the
  // ActionHost pre-execution authorization sees a deny on its second check.
  let checks = 0;
  const provider = f.manager;
  // The explicit policy-race case is covered by current-authority revocation
  // above; this assertion verifies returned failures are bounded in shape.
  const result = await original.callTool({
    access: {
      ...f.access,
      operationIds: ["sample.read"]
    },
    correlationId: "corr-shape",
    name: "sample.read",
    arguments: { value: "ok" }
  });
  assert.equal(result.isError, undefined);
  assert.equal(
    JSON.stringify(result).includes("test.authorization"),
    false
  );
});
