import test from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryEnterpriseOperatingGraphStoreV010
} from "../../dist/manager/enterprise-operating-graph-store.js";
import {
  createEnterpriseOperatingGraphHostServiceV010
} from "../../dist/manager/enterprise-operating-graph-service.js";
import {
  createEnterpriseOperatingGraphAgentToolRegistrationsV010
} from "../../dist/manager/enterprise-operating-graph-agent-tools.js";
import {
  createEnterpriseOperatingGraphActionHandlersV010,
  EOG_APPLY_OPERATION_ACTION,
  EOG_CREATE_ACTION
} from "../../dist/manager/enterprise-operating-graph-actions.js";

function hostService() {
  let serial = 0;
  return createEnterpriseOperatingGraphHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphStoreV010(),
    id: () => String(++serial).padStart(4, "0"),
    now: () => new Date("2026-09-28T14:00:00.000Z")
  });
}

function enterpriseRequestContext(actorType = "HUMAN") {
  return {
    contractVersion: "0.1.0",
    correlationId: "corr:1",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "human:owner",
      actorType,
      identityProviderId: "test",
      displayName: "Owner"
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
        contextId: "personal:owner",
        kind: "PERSONAL",
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

function actionRequest(commandCode, values, requiresConfirmation = false) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: commandCode,
      inputVersion: "0.1.0"
    },
    values,
    sourceInteractionId: "interaction:1",
    actionId: "action:1",
    requiresConfirmation
  };
}

test("Host service persists one authoritative EOG across Agent proposal and Human confirmation", async () => {
  const service = hostService();
  const handlers = createEnterpriseOperatingGraphActionHandlersV010({
    service,
    resolveAuthorizationProvider: () => allowAuthorization
  });
  const create = handlers.find(item => item.commandCode === EOG_CREATE_ACTION);
  const apply = handlers.find(
    item => item.commandCode === EOG_APPLY_OPERATION_ACTION
  );
  assert.ok(create);
  assert.ok(apply);

  const created = await create.execute(
    actionRequest(EOG_CREATE_ACTION, { graphId: "eog:demo" }),
    enterpriseRequestContext()
  );
  assert.equal(created.ok, true);

  let graph = service.get({
    enterpriseId: "enterprise:demo",
    graphId: "eog:demo"
  });

  const context = enterpriseRequestContext().context;
  const principal = enterpriseRequestContext().principal;
  const tools = createEnterpriseOperatingGraphAgentToolRegistrationsV010({
    service,
    context,
    principal
  });
  const proposalTool = tools.find(
    item => item.descriptor.id === "enterprise.operating_graph.proposal.apply"
  );
  assert.ok(proposalTool);

  graph = await proposalTool.execute({
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    mutation: {
      type: "NODE_BIND",
      node: {
        nodeId: "node:app:sales",
        kind: "APPLICATION",
        semanticRef: {
          kind: "APPLICATION",
          authority: "HOST",
          refId: "application:sales-order"
        }
      }
    }
  }, []);

  graph = await proposalTool.execute({
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    mutation: {
      type: "NODE_BIND",
      node: {
        nodeId: "node:ledger:receivable",
        kind: "LEDGER",
        semanticRef: {
          kind: "LEDGER_DEFINITION",
          authority: "EVO",
          refId: "ledger:receivable"
        }
      }
    }
  }, []);

  graph = await proposalTool.execute({
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    mutation: {
      type: "GUIDANCE_RELATION_PUT",
      relation: {
        relationId: "guidance:receivable",
        kind: "APPLICATION_LEDGER",
        applicationNodeId: "node:app:sales",
        ledgerNodeId: "node:ledger:receivable",
        source: {
          kind: "ACCOUNTING_GUIDANCE",
          sourceRef: "prc-accounting-guidance:application-guide"
        }
      }
    }
  }, []);

  assert.equal(graph.guidanceRelations.length, 1);
  assert.equal(graph.enterpriseRelations.length, 0);

  const confirmed = await apply.execute(
    actionRequest(
      EOG_APPLY_OPERATION_ACTION,
      {
        graphId: graph.graphId,
        expectedRevision: graph.revision,
        mutation: {
          type: "ENTERPRISE_RELATION_CONFIRM",
          enterpriseRelationId: "enterprise-relation:receivable",
          applicationNodeId: "node:app:sales",
          ledgerNodeId: "node:ledger:receivable",
          guidanceRelationId: "guidance:receivable"
        }
      }
    ),
    enterpriseRequestContext()
  );

  assert.equal(confirmed.ok, true);
  graph = service.get({
    enterpriseId: "enterprise:demo",
    graphId: "eog:demo"
  });
  assert.equal(graph.enterpriseRelations.length, 1);
  assert.equal(
    graph.enterpriseRelations[0].confirmedBySubjectId,
    "human:owner"
  );
});

test("Agent create defaults to the same primary graph opened by the Eidos editor", async () => {
  const service = hostService();
  const tool = createEnterpriseOperatingGraphAgentToolRegistrationsV010({
    service,
    context: enterpriseRequestContext().context,
    principal: enterpriseRequestContext().principal
  }).find(
    item => item.descriptor.id === "enterprise.operating_graph.create"
  );
  assert.ok(tool);

  const graph = await tool.execute({}, []);
  assert.equal(graph.graphId, "eog:primary");
  assert.equal(
    service.get({
      enterpriseId: "enterprise:demo",
      graphId: "eog:primary"
    }).graphId,
    "eog:primary"
  );
});

test("Agent proposal tool cannot confirm or publish enterprise truth", async () => {
  const service = hostService();
  const graph = service.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:guard"
  });
  const tool = createEnterpriseOperatingGraphAgentToolRegistrationsV010({
    service,
    context: enterpriseRequestContext().context,
    principal: enterpriseRequestContext().principal
  }).find(
    item => item.descriptor.id === "enterprise.operating_graph.proposal.apply"
  );
  assert.ok(tool);

  assert.throws(
    () => tool.execute({
      graphId: graph.graphId,
      expectedRevision: graph.revision,
      mutation: { type: "PUBLISH" }
    }, []),
    /EOG_HUMAN_CONFIRMATION_REQUIRED/
  );

  assert.throws(
    () => tool.execute({
      graphId: graph.graphId,
      expectedRevision: graph.revision,
      mutation: {
        type: "ENTERPRISE_RELATION_CONFIRM",
        enterpriseRelationId: "relation:x",
        applicationNodeId: "app:x",
        ledgerNodeId: "ledger:x"
      }
    }, []),
    /EOG_HUMAN_CONFIRMATION_REQUIRED/
  );
});

test("Human publish action requires explicit confirmation", async () => {
  const service = hostService();
  const graph = service.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:publish"
  });
  const apply = createEnterpriseOperatingGraphActionHandlersV010({
    service,
    resolveAuthorizationProvider: () => allowAuthorization
  }).find(item => item.commandCode === EOG_APPLY_OPERATION_ACTION);
  assert.ok(apply);

  const result = await apply.execute(
    actionRequest(
      EOG_APPLY_OPERATION_ACTION,
      {
        graphId: graph.graphId,
        expectedRevision: graph.revision,
        mutation: { type: "PUBLISH" }
      },
      false
    ),
    enterpriseRequestContext()
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "EOG_PUBLISH_CONFIRMATION_REQUIRED");
});

test("EOG store is enterprise scoped", () => {
  const service = hostService();
  service.create({
    enterpriseId: "enterprise:a",
    graphId: "eog:a"
  });

  assert.throws(
    () => service.get({
      enterpriseId: "enterprise:b",
      graphId: "eog:a"
    }),
    /EOG_GRAPH_NOT_FOUND/
  );
});
