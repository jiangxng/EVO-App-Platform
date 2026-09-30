import test from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryEnterpriseOperatingGraphStoreV010
} from "../../dist/manager/enterprise-operating-graph-store.js";
import {
  createEnterpriseOperatingGraphHostServiceV010
} from "../../dist/manager/enterprise-operating-graph-service.js";
import {
  createMemoryBusinessDefinitionRepositoryV010
} from "../../dist/providers/enterprise-context/business-definitions.js";
import {
  createEogExpectedSopServiceV010
} from "../../dist/manager/enterprise-operating-graph-sop-service.js";
import {
  createEogExpectedSopActionHandlersV010,
  EOG_SOP_CREATE_ACTION,
  EOG_SOP_PUBLISH_ACTION
} from "../../dist/manager/enterprise-operating-graph-sop-actions.js";
import {
  createEogExpectedSopAgentToolRegistrationsV010
} from "../../dist/manager/enterprise-operating-graph-sop-agent-tools.js";

function setup() {
  let serial = 0;
  const graphService = createEnterpriseOperatingGraphHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphStoreV010(),
    id: () => String(++serial),
    now: () => new Date("2026-09-29T00:00:00.000Z")
  });
  let graph = graphService.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary"
  });
  for (const [nodeId, refId] of [
    ["app:a", "application:a"],
    ["app:b", "application:b"]
  ]) {
    graph = graphService.apply({
      enterpriseId: graph.enterpriseId,
      graphId: graph.graphId,
      expectedRevision: graph.revision,
      actor: { type: "AGENT", subjectId: "agent:test" },
      mutation: {
        type: "NODE_BIND",
        node: {
          nodeId,
          kind: "APPLICATION",
          semanticRef: {
            kind: "APPLICATION",
            authority: "HOST",
            refId
          }
        }
      }
    });
  }

  const sopService = createEogExpectedSopServiceV010({
    repository: createMemoryBusinessDefinitionRepositoryV010(),
    graphService,
    now: () => new Date("2026-09-29T01:00:00.000Z")
  });
  return { graphService, sopService };
}

const allowAuthorization = {
  contractVersion: "0.1.0",
  providerId: "test.allow",
  capability: "authorization.check",
  check(request) {
    return {
      contractVersion: "0.1.0",
      allowed: true,
      policyProviderId: "test.allow",
      reasonCodes: ["TEST_ALLOW"],
      request
    };
  }
};

function humanContext() {
  return {
    contractVersion: "0.1.0",
    correlationId: "corr:sop",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "human:owner",
      actorType: "HUMAN",
      identityProviderId: "test"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "enterprise:demo",
      userId: "human:owner"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:owner",
        ownerSubjectId: "human:owner"
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise-context:demo",
        enterpriseId: "enterprise:demo"
      },
      enterpriseContext: {
        contractVersion: "0.1.0",
        contextId: "enterprise-context:demo",
        enterpriseId: "enterprise:demo",
        displayName: "Demo"
      }
    }
  };
}

function request(command, values, requiresConfirmation = false) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code: command, inputVersion: "0.1.0" },
    values,
    sourceInteractionId: "sop-test",
    actionId: command,
    requiresConfirmation
  };
}

test("Personal Agent can prepare SOP Drafts but has no publish tool", () => {
  const { sopService } = setup();
  const context = humanContext();
  const tools = createEogExpectedSopAgentToolRegistrationsV010({
    service: sopService,
    principal: {
      ...context.principal,
      actorType: "AI",
      subjectId: "agent:personal"
    },
    context: context.context
  });

  assert.equal(
    tools.some(tool =>
      tool.descriptor.id ===
      "enterprise.operating_graph.sop.draft.create"
    ),
    true
  );
  assert.equal(
    tools.some(tool =>
      tool.descriptor.id.includes("publish")
    ),
    false
  );
});

test("Human publish requires explicit confirmation and records Human authority", async () => {
  const { sopService } = setup();
  const handlers = createEogExpectedSopActionHandlersV010({
    service: sopService,
    resolveAuthorizationProvider: () => allowAuthorization
  });
  const create = handlers.find(
    handler => handler.commandCode === EOG_SOP_CREATE_ACTION
  );
  const publish = handlers.find(
    handler => handler.commandCode === EOG_SOP_PUBLISH_ACTION
  );
  assert.ok(create);
  assert.ok(publish);

  const created = await create.execute(
    request(EOG_SOP_CREATE_ACTION, {
      graphId: "eog:primary",
      sopId: "sop:demo",
      title: "Demo SOP",
      applicationNodeIds: ["app:a", "app:b"]
    }),
    humanContext()
  );
  assert.equal(created.ok, true);

  const denied = await publish.execute(
    request(EOG_SOP_PUBLISH_ACTION, {
      graphId: "eog:primary",
      sopId: "sop:demo",
      expectedRevision: 0
    }),
    humanContext()
  );
  assert.equal(denied.ok, false);
  assert.equal(
    denied.error.code,
    "EOG_SOP_PUBLISH_CONFIRMATION_REQUIRED"
  );

  const published = await publish.execute(
    request(
      EOG_SOP_PUBLISH_ACTION,
      {
        graphId: "eog:primary",
        sopId: "sop:demo",
        expectedRevision: 0
      },
      true
    ),
    humanContext()
  );
  assert.equal(published.ok, true);
  assert.equal(published.result.state, "PUBLISHED");
  assert.equal(
    published.result.publishedBySubjectId,
    "human:owner"
  );
});
