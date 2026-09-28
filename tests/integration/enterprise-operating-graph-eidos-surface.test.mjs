import test from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryEnterpriseOperatingGraphStoreV010
} from "../../dist/manager/enterprise-operating-graph-store.js";
import {
  createEnterpriseOperatingGraphHostServiceV010
} from "../../dist/manager/enterprise-operating-graph-service.js";
import {
  createEnterpriseOperatingGraphViewActionHandlersV010,
  EOG_VIEW_GET_ACTION,
  EOG_VIEW_OPERATION_ACTION,
  projectEnterpriseOperatingGraphEditorStateV010
} from "../../dist/manager/enterprise-operating-graph-page.js";

function service() {
  let serial = 0;
  return createEnterpriseOperatingGraphHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphStoreV010(),
    id: () => String(++serial),
    now: () => new Date("2026-09-28T15:00:00.000Z")
  });
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

function context() {
  return {
    contractVersion: "0.1.0",
    correlationId: "corr:1",
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
    command: {
      code: command,
      inputVersion: "0.1.0"
    },
    values,
    sourceInteractionId: "eog-editor",
    actionId: "diagram-action",
    requiresConfirmation
  };
}

test("EOG view projection preserves rectangle Application and rounded Ledger convention", () => {
  const host = service();
  let graph = host.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary"
  });
  graph = host.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    actor: { type: "AGENT", subjectId: "agent:personal" },
    mutation: {
      type: "NODE_BIND",
      node: {
        nodeId: "app:sales",
        kind: "APPLICATION",
        semanticRef: {
          kind: "APPLICATION",
          authority: "HOST",
          refId: "application:sales-order"
        }
      }
    }
  });
  graph = host.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    actor: { type: "AGENT", subjectId: "agent:personal" },
    mutation: {
      type: "NODE_BIND",
      node: {
        nodeId: "ledger:receivable",
        kind: "LEDGER",
        semanticRef: {
          kind: "LEDGER_DEFINITION",
          authority: "EVO",
          refId: "ledger:receivable"
        }
      }
    }
  });
  graph = host.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    actor: { type: "AGENT", subjectId: "agent:personal" },
    mutation: {
      type: "GUIDANCE_RELATION_PUT",
      relation: {
        relationId: "guidance:receivable",
        kind: "APPLICATION_LEDGER",
        applicationNodeId: "app:sales",
        ledgerNodeId: "ledger:receivable",
        source: {
          kind: "ACCOUNTING_GUIDANCE",
          sourceRef: "prc-accounting-guidance"
        }
      }
    }
  });

  const view = projectEnterpriseOperatingGraphEditorStateV010(graph, "zh-CN");
  assert.equal(view.nodes.find(node => node.id === "app:sales").shape, "rectangle");
  assert.equal(
    view.nodes.find(node => node.id === "ledger:receivable").shape,
    "rounded-rectangle"
  );
  assert.equal(view.edges[0].style, "dashed");
  assert.equal(view.actions.some(action => action.id === "confirm:guidance:receivable"), true);
});

test("EOG view starts as explicit NOT_CREATED projection and creates Host graph through semantic action", async () => {
  const host = service();
  const handlers = createEnterpriseOperatingGraphViewActionHandlersV010({
    service: host,
    resolveAuthorizationProvider: () => allowAuthorization
  });
  const read = handlers.find(item => item.commandCode === EOG_VIEW_GET_ACTION);
  const operate = handlers.find(item => item.commandCode === EOG_VIEW_OPERATION_ACTION);
  assert.ok(read);
  assert.ok(operate);

  const before = await read.execute(
    request(EOG_VIEW_GET_ACTION, { resourceId: "eog:primary" }),
    context()
  );
  assert.equal(before.ok, true);
  assert.equal(before.result.lifecycleState, "NOT_CREATED");

  const created = await operate.execute(
    request(EOG_VIEW_OPERATION_ACTION, {
      resourceId: "eog:primary",
      expectedRevision: 0,
      operation: { type: "CREATE_GRAPH" }
    }),
    context()
  );
  assert.equal(created.ok, true);
  assert.equal(created.result.lifecycleState, "DRAFT");
  assert.equal(
    host.get({
      enterpriseId: "enterprise:demo",
      graphId: "eog:primary"
    }).graphId,
    "eog:primary"
  );
});

test("Human graph confirmation uses the same Host EOG revision and becomes a solid relation", async () => {
  const host = service();
  let graph = host.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary"
  });
  for (const mutation of [
    {
      type: "NODE_BIND",
      node: {
        nodeId: "app:sales",
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
        nodeId: "ledger:receivable",
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
        applicationNodeId: "app:sales",
        ledgerNodeId: "ledger:receivable",
        source: {
          kind: "ACCOUNTING_GUIDANCE",
          sourceRef: "prc-accounting-guidance"
        }
      }
    }
  ]) {
    graph = host.apply({
      enterpriseId: graph.enterpriseId,
      graphId: graph.graphId,
      expectedRevision: graph.revision,
      actor: { type: "AGENT", subjectId: "agent:personal" },
      mutation
    });
  }

  const operate = createEnterpriseOperatingGraphViewActionHandlersV010({
    service: host,
    resolveAuthorizationProvider: () => allowAuthorization
  }).find(item => item.commandCode === EOG_VIEW_OPERATION_ACTION);
  assert.ok(operate);

  const confirmed = await operate.execute(
    request(
      EOG_VIEW_OPERATION_ACTION,
      {
        resourceId: graph.graphId,
        expectedRevision: graph.revision,
        operation: {
          type: "CONFIRM_GUIDANCE_RELATION",
          guidanceRelationId: "guidance:receivable"
        }
      },
      true
    ),
    context()
  );

  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.result.edges.length, 1);
  assert.equal(confirmed.result.edges[0].style, "solid");
  assert.equal(confirmed.result.edges[0].kind, "enterprise-confirmed");

  const stored = host.get({
    enterpriseId: "enterprise:demo",
    graphId: graph.graphId
  });
  assert.equal(stored.guidanceRelations.length, 1);
  assert.equal(stored.enterpriseRelations.length, 1);
  assert.equal(
    stored.enterpriseRelations[0].confirmedFromGuidanceRelationId,
    "guidance:receivable"
  );
});

test("direct node move persists Position through the Host rather than browser state", async () => {
  const host = service();
  let graph = host.create({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary"
  });
  graph = host.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    actor: { type: "AGENT", subjectId: "agent:personal" },
    mutation: {
      type: "NODE_BIND",
      node: {
        nodeId: "app:sales",
        kind: "APPLICATION",
        semanticRef: {
          kind: "APPLICATION",
          authority: "HOST",
          refId: "application:sales-order"
        }
      }
    }
  });

  const operate = createEnterpriseOperatingGraphViewActionHandlersV010({
    service: host,
    resolveAuthorizationProvider: () => allowAuthorization
  }).find(item => item.commandCode === EOG_VIEW_OPERATION_ACTION);
  assert.ok(operate);

  const moved = await operate.execute(
    request(EOG_VIEW_OPERATION_ACTION, {
      resourceId: graph.graphId,
      expectedRevision: graph.revision,
      operation: {
        type: "MOVE_NODE",
        nodeId: "app:sales",
        x: 222,
        y: 144
      }
    }),
    context()
  );

  assert.equal(moved.ok, true);
  assert.deepEqual(
    host.get({
      enterpriseId: "enterprise:demo",
      graphId: graph.graphId
    }).positions,
    [{ nodeId: "app:sales", x: 222, y: 144 }]
  );
});
