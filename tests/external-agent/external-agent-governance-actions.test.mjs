import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createAppActionRouter } from "../../dist/actions/router.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import {
  createMemoryExternalAgentGovernanceStoreV010
} from "../../dist/manager/external-agent-governance-store.js";
import {
  createExternalAgentGovernanceServiceV010
} from "../../dist/manager/external-agent-governance-service.js";
import {
  createExternalAgentGovernanceActionHandlersV010
} from "../../dist/manager/external-agent-governance-actions.js";
import {
  EXTERNAL_AGENT_GOVERNANCE_FEATURE_ID,
  externalAgentGovernancePackage
} from "../../dist/manager/external-agent-governance-package.js";

function samplePlugin() {
  return {
    contractVersion: "0.1.0",
    packageId: "sample-external-agent-target",
    displayName: "Sample External Agent Target",
    version: "0.1.0",
    type: "APPLICATION",
    features: [{
      contractVersion: "0.1.0",
      featureId: "sample-external-agent-target.default",
      packageId: "sample-external-agent-target",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: ["sample.external"],
      contributions: [{
        kind: "platform.capability-operation",
        operation: {
          contractVersion: "0.1.0",
          operationId: "sample.external.read",
          capability: "sample.external",
          operationVersion: "1.0.0",
          title: "Sample external read",
          description: "Synthetic READ operation for External Agent governance Action Host tests.",
          effect: "READ",
          dataScope: "INSTALLATION",
          authorization: {
            action: "sample.external.read",
            resource: {
              type: "sample.external",
              idSource: "NONE"
            }
          },
          inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {}
          },
          outputSchema: { type: "object" },
          binding: {
            type: "ACTION_HOST",
            commandCode: "sample.external.read",
            inputVersion: "0.1.0"
          },
          exposure: ["HUMAN", "EXTERNAL_AGENT"]
        }
      }]
    }]
  };
}

function authorizationProvider() {
  return {
    providerId: "test.authorization",
    check(input) {
      return {
        contractVersion: "0.1.0",
        allowed: true,
        policyProviderId: "test.authorization",
        reasonCodes: ["TEST_ALLOW"],
        input
      };
    }
  };
}

function context(kind = "ENTERPRISE") {
  const principal = {
    contractVersion: "0.1.0",
    subjectId: "human-1",
    actorType: "HUMAN",
    identityProviderId: "generic.oidc"
  };
  const personalContext = {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:human-1",
    ownerSubjectId: "human-1"
  };
  const enterpriseContext = {
    contractVersion: "0.1.0",
    kind: "ENTERPRISE",
    contextId: "enterprise:ent-1",
    enterpriseId: "ent-1",
    enterpriseProviderId: "test.enterprise",
    displayName: "Enterprise 1"
  };
  const activeContext = kind === "ENTERPRISE"
    ? {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: enterpriseContext.contextId,
        enterpriseId: enterpriseContext.enterpriseId
      }
    : {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: personalContext.contextId
      };
  return {
    contractVersion: "0.1.0",
    principal,
    scope: {
      contractVersion: "0.1.0",
      ...(kind === "ENTERPRISE" ? { enterpriseId: "ent-1" } : {}),
      userId: principal.subjectId
    },
    context: {
      contractVersion: "0.1.0",
      personalContext,
      activeContext,
      ...(kind === "ENTERPRISE" ? { enterpriseContext } : {})
    },
    correlationId: "corr-1"
  };
}

function request(command, values = {}, requiresConfirmation = true, index = 1) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: command,
      inputVersion: "0.1.0"
    },
    values,
    sourceInteractionId: "interaction-" + index,
    actionId: "action-" + index,
    requiresConfirmation
  };
}

function fixture() {
  const target = samplePlugin();
  const manager = createAppManagerService(
    createPackageCatalog([externalAgentGovernancePackage, target]),
    createMemoryLifecycleStore()
  );
  manager.install(externalAgentGovernancePackage.packageId);
  manager.install(target.packageId);
  const store = createMemoryExternalAgentGovernanceStoreV010();
  const service = createExternalAgentGovernanceServiceV010({
    store,
    manager,
    resolveAuthorizationProvider: () => authorizationProvider(),
    now: () => new Date("2026-09-30T10:00:00.000Z"),
    id: (() => {
      let i = 0;
      return () => "id-" + String(++i);
    })()
  });
  const router = createAppActionRouter(
    createExternalAgentGovernanceActionHandlersV010({ service }),
    featureId => manager.getSnapshot().activeFeatures.some(
      feature => feature.featureId === featureId
    )
  );
  return { manager, store, router };
}

test("External Agent governance Action Host registers ChatGPT client and creates bounded READ Grant", async () => {
  const f = fixture();
  assert.equal(
    f.manager.getSnapshot().activeFeatures.some(
      item => item.featureId === EXTERNAL_AGENT_GOVERNANCE_FEATURE_ID
    ),
    true
  );

  const registered = await f.router.execute(
    request("external.agent.register", {
      displayName: "ChatGPT",
      publisherId: "openai"
    }, true, 1),
    context()
  );
  assert.equal(registered.ok, true);
  const agentId = registered.result.agent.agentId;

  const client = await f.router.execute(
    request("external.agent.client.register", {
      agentId,
      displayName: "ChatGPT MCP",
      kind: "PUBLIC",
      protocols: ["MCP"],
      oauthClientId: "https://chatgpt.com/oauth/client.json"
    }, true, 2),
    context()
  );
  assert.equal(client.ok, true);
  const clientId = client.result.client.clientId;
  assert.equal(
    client.result.client.oauthClientId,
    "https://chatgpt.com/oauth/client.json"
  );

  const grant = await f.router.execute(
    request("external.agent.grant.create", {
      agentId,
      clientId,
      allowedOperationIds: ["sample.external.read"],
      validUntil: "2026-10-01T10:00:00.000Z",
      description: "EA-001 read-only validation"
    }, true, 3),
    context()
  );
  assert.equal(grant.ok, true);
  assert.deepEqual(
    grant.result.grant.allowedOperationIds,
    ["sample.external.read"]
  );
  assert.deepEqual(grant.result.grant.effectConstraints, ["READ"]);
  assert.equal(grant.result.grant.contextId, "enterprise:ent-1");

  const listing = await f.router.execute(
    request("external.agent.governance.read", {}, false, 4),
    context()
  );
  assert.equal(listing.ok, true);
  assert.equal(listing.result.agents.length, 1);
  assert.equal(listing.result.clients.length, 1);
  assert.equal(listing.result.grants.length, 1);
});

test("External Agent governance Action Host accepts capability selector Grant without explicit operation ids", async () => {
  const f = fixture();

  const registered = await f.router.execute(
    request("external.agent.register", {
      displayName: "Capability Agent"
    }, true, 10),
    context()
  );
  assert.equal(registered.ok, true);
  const agentId = registered.result.agent.agentId;

  const client = await f.router.execute(
    request("external.agent.client.register", {
      agentId,
      displayName: "Capability MCP",
      kind: "PUBLIC",
      protocols: ["MCP"]
    }, true, 11),
    context()
  );
  assert.equal(client.ok, true);
  const clientId = client.result.client.clientId;

  const grant = await f.router.execute(
    request("external.agent.grant.create", {
      agentId,
      clientId,
      capabilitySelectors: [{
        capability: "sample.external",
        effects: ["READ"]
      }],
      validUntil: "2026-10-01T10:00:00.000Z"
    }, true, 12),
    context()
  );

  assert.equal(grant.ok, true);
  assert.deepEqual(grant.result.grant.allowedOperationIds, []);
  assert.deepEqual(grant.result.grant.capabilitySelectors, [{
    contractVersion: "0.1.0",
    capability: "sample.external",
    effects: ["READ"]
  }]);
  assert.deepEqual(grant.result.grant.effectConstraints, ["READ"]);
});

test("External Agent governance Action Host requires Human confirmation for mutations", async () => {
  const f = fixture();
  const result = await f.router.execute(
    request("external.agent.register", {
      displayName: "ChatGPT"
    }, false),
    context()
  );
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "MATERIAL_WRITE_CONFIRMATION_REQUIRED");
  assert.equal(f.store.snapshot().agents.length, 0);
});

test("delegated External Agent Grant fails closed outside Enterprise Context", async () => {
  const f = fixture();
  const registered = await f.router.execute(
    request("external.agent.register", {
      displayName: "ChatGPT"
    }, true, 1),
    context("PERSONAL")
  );
  const agentId = registered.result.agent.agentId;

  const client = await f.router.execute(
    request("external.agent.client.register", {
      agentId,
      displayName: "ChatGPT MCP",
      kind: "PUBLIC",
      protocols: ["MCP"],
      oauthClientId: "https://chatgpt.com/oauth/client.json"
    }, true, 2),
    context("PERSONAL")
  );
  const clientId = client.result.client.clientId;

  const grant = await f.router.execute(
    request("external.agent.grant.create", {
      agentId,
      clientId,
      allowedOperationIds: ["sample.external.read"],
      validUntil: "2026-10-01T10:00:00.000Z"
    }, true, 3),
    context("PERSONAL")
  );
  assert.equal(grant.ok, false);
  assert.equal(
    grant.error.code,
    "EXTERNAL_AGENT_ENTERPRISE_CONTEXT_REQUIRED"
  );
  assert.equal(f.store.snapshot().grants.length, 0);
});
