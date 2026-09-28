import test from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryEnterpriseOperatingGraphStoreV010
} from "../../dist/manager/enterprise-operating-graph-store.js";
import {
  createEnterpriseOperatingGraphHostServiceV010
} from "../../dist/manager/enterprise-operating-graph-service.js";
import {
  createMemoryEnterpriseOperatingGraphViewStoreV010
} from "../../dist/manager/enterprise-operating-graph-view-store.js";
import {
  createEnterpriseOperatingGraphViewHostServiceV010
} from "../../dist/manager/enterprise-operating-graph-view-service.js";
import {
  createEnterpriseOperatingGraphAgentToolRegistrationsV010
} from "../../dist/manager/enterprise-operating-graph-agent-tools.js";
import {
  createEnterpriseOperatingGraphActionHandlersV010,
  EOG_APPLY_OPERATION_ACTION,
  EOG_CREATE_ACTION
} from "../../dist/manager/enterprise-operating-graph-actions.js";

function hostServices() {
  let serial = 0;
  const service = createEnterpriseOperatingGraphHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphStoreV010(),
    id: () => String(++serial).padStart(4, "0"),
    now: () => new Date("2026-09-28T14:00:00.000Z")
  });
  const viewService = createEnterpriseOperatingGraphViewHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphViewStoreV010(),
    now: () => new Date("2026-09-28T14:00:00.000Z")
  });
  return { service, viewService };
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

function agentTools(service, viewService) {
  return createEnterpriseOperatingGraphAgentToolRegistrationsV010({
    service,
    viewService,
    context: enterpriseRequestContext().context,
    principal: enterpriseRequestContext().principal
  });
}

test("Host service persists one authoritative EOG across Agent proposal and Human confirmation", async () => {
  const { service, viewService } = hostServices();
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

  const proposalTool = agentTools(service, viewService).find(
    item => item.descriptor.id === "enterprise.operating_graph.proposal.apply"
  );
  assert.ok(proposalTool);

  for (const mutation of [
    {
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
    },
    {
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
    },
    {
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
  ]) {
    graph = await proposalTool.execute({
      graphId: graph.graphId,
      expectedRevision: graph.revision,
      mutation
    }, []);
  }

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
  const { service, viewService } = hostServices();
  const tool = agentTools(service, viewService).find(
    item => item.descriptor.id === "enterprise.operating_graph.create"
  );
  assert.ok(tool);

  const graph = await tool.execute({}, []);
  assert.equal(graph.graphId, "eog:primary");
});

test("Agent semantic proposal tool cannot confirm, publish, or mutate layout", async () => {
  const { service, viewService } = hostServices();
  const graph = service.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:guard"
  });
  const tool = agentTools(service, viewService).find(
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
      mutation: { type: "NODE_MOVE", position: { nodeId: "x", x: 1, y: 2 } }
    }, []),
    /EOG_MUTATION_INVALID|EOG_OPERATION/
  );
});

test("Agent can arrange 2D or 3D views without advancing semantic revision", async () => {
  const { service, viewService } = hostServices();
  let graph = service.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary"
  });
  graph = service.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    actor: { type: "AGENT", subjectId: "agent:personal" },
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
  });
  const semanticRevision = graph.revision;
  const tools = agentTools(service, viewService);
  const getView = tools.find(
    item => item.descriptor.id === "enterprise.operating_graph.view.get"
  );
  const applyView = tools.find(
    item => item.descriptor.id === "enterprise.operating_graph.view.apply"
  );
  assert.ok(getView);
  assert.ok(applyView);

  const view = await getView.execute({
    graphId: graph.graphId,
    kind: "DIAGRAM_2D"
  }, []);
  const moved = await applyView.execute({
    graphId: graph.graphId,
    kind: "DIAGRAM_2D",
    expectedRevision: view.revision,
    mutation: {
      type: "NODE_POSITION_SET",
      placement: {
        nodeId: "node:app:sales",
        x: 120,
        y: 80
      }
    }
  }, []);

  assert.deepEqual(moved.placements, [
    { nodeId: "node:app:sales", x: 120, y: 80 }
  ]);
  assert.equal(
    service.get({
      enterpriseId: graph.enterpriseId,
      graphId: graph.graphId
    }).revision,
    semanticRevision
  );
});

test("Human publish action requires explicit confirmation", async () => {
  const { service } = hostServices();
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

test("EOG semantic store is enterprise scoped", () => {
  const { service } = hostServices();
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
