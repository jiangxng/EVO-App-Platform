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
  createEnterpriseOperatingGraphViewActionHandlersV010,
  EOG_VIEW_GET_ACTION,
  EOG_VIEW_OPERATION_ACTION,
  projectEnterpriseOperatingGraphEditorStateV010
} from "../../dist/manager/enterprise-operating-graph-page.js";

function services() {
  let serial = 0;
  const service = createEnterpriseOperatingGraphHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphStoreV010(),
    id: () => String(++serial),
    now: () => new Date("2026-09-28T15:00:00.000Z")
  });
  const viewService = createEnterpriseOperatingGraphViewHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphViewStoreV010(),
    now: () => new Date("2026-09-28T15:00:00.000Z")
  });
  return { service, viewService };
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

function handlers(service, viewService) {
  return createEnterpriseOperatingGraphViewActionHandlersV010({
    service,
    viewService,
    resolveAuthorizationProvider: () => allowAuthorization
  });
}

function bindDemoGraph(service) {
  let graph = service.create({
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
    graph = service.apply({
      enterpriseId: graph.enterpriseId,
      graphId: graph.graphId,
      expectedRevision: graph.revision,
      actor: { type: "AGENT", subjectId: "agent:personal" },
      mutation
    });
  }
  return graph;
}

test("EOG view projection preserves rectangle Application and rounded Ledger convention", () => {
  const { service, viewService } = services();
  const graph = bindDemoGraph(service);
  const viewState = viewService.ensure({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    kind: "DIAGRAM_2D"
  });

  const view = projectEnterpriseOperatingGraphEditorStateV010(
    graph,
    viewState,
    "zh-CN"
  );
  assert.equal(view.nodes.find(node => node.id === "app:sales").shape, "rectangle");
  assert.equal(
    view.nodes.find(node => node.id === "ledger:receivable").shape,
    "rounded-rectangle"
  );
  assert.equal(view.edges[0].style, "dashed");
  assert.equal(view.actions.some(action => action.id === "confirm:guidance:receivable"), true);
  assert.equal(view.revision, 0);
});

test("EOG view starts as explicit NOT_CREATED projection and creates semantic graph plus empty 2D View State", async () => {
  const { service, viewService } = services();
  const list = handlers(service, viewService);
  const read = list.find(item => item.commandCode === EOG_VIEW_GET_ACTION);
  const operate = list.find(item => item.commandCode === EOG_VIEW_OPERATION_ACTION);
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
  assert.equal(created.result.revision, 0);
  assert.equal(
    service.get({
      enterpriseId: "enterprise:demo",
      graphId: "eog:primary"
    }).graphId,
    "eog:primary"
  );
  assert.equal(
    viewService.list({
      enterpriseId: "enterprise:demo",
      graphId: "eog:primary"
    }).length,
    1
  );
});

test("Human confirmation advances semantic revision but does not consume View revision", async () => {
  const { service, viewService } = services();
  const graph = bindDemoGraph(service);
  const operate = handlers(service, viewService).find(
    item => item.commandCode === EOG_VIEW_OPERATION_ACTION
  );
  assert.ok(operate);

  const confirmed = await operate.execute(
    request(
      EOG_VIEW_OPERATION_ACTION,
      {
        resourceId: graph.graphId,
        expectedRevision: 0,
        operation: {
          type: "CONFIRM_GUIDANCE_RELATION",
          semanticRevision: graph.revision,
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
  assert.equal(confirmed.result.revision, 0);

  const stored = service.get({
    enterpriseId: "enterprise:demo",
    graphId: graph.graphId
  });
  assert.equal(stored.enterpriseRelations.length, 1);
  assert.equal(stored.revision, graph.revision + 1);
});

test("direct node move advances only View revision and survives a fresh projection", async () => {
  const { service, viewService } = services();
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
  const semanticRevision = graph.revision;
  const operate = handlers(service, viewService).find(
    item => item.commandCode === EOG_VIEW_OPERATION_ACTION
  );
  assert.ok(operate);

  const moved = await operate.execute(
    request(EOG_VIEW_OPERATION_ACTION, {
      resourceId: graph.graphId,
      expectedRevision: 0,
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
  assert.equal(moved.result.revision, 1);
  assert.equal(
    service.get({
      enterpriseId: graph.enterpriseId,
      graphId: graph.graphId
    }).revision,
    semanticRevision
  );

  const persistedView = viewService.list({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId
  })[0];
  assert.deepEqual(persistedView.placements, [
    { nodeId: "app:sales", x: 222, y: 144 }
  ]);

  const fresh = projectEnterpriseOperatingGraphEditorStateV010(
    service.get({
      enterpriseId: graph.enterpriseId,
      graphId: graph.graphId
    }),
    persistedView
  );
  assert.equal(fresh.nodes[0].x, 222);
  assert.equal(fresh.nodes[0].y, 144);
});

test("published semantic graph still permits non-semantic layout changes", async () => {
  const { service, viewService } = services();
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
  graph = service.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    actor: { type: "HUMAN", subjectId: "human:owner" },
    mutation: { type: "PUBLISH" }
  });

  const operate = handlers(service, viewService).find(
    item => item.commandCode === EOG_VIEW_OPERATION_ACTION
  );
  const moved = await operate.execute(
    request(EOG_VIEW_OPERATION_ACTION, {
      resourceId: graph.graphId,
      expectedRevision: 0,
      operation: {
        type: "MOVE_NODE",
        nodeId: "app:sales",
        x: 300,
        y: 200
      }
    }),
    context()
  );

  assert.equal(moved.ok, true);
  assert.equal(moved.result.lifecycleState, "SEMANTIC_PUBLISHED");
  assert.equal(moved.result.nodes[0].readOnly, false);
  assert.equal(
    service.get({
      enterpriseId: graph.enterpriseId,
      graphId: graph.graphId
    }).state,
    "PUBLISHED"
  );
});


test("Designer projection clipping hides and restores items without changing semantic graph revision", async () => {
  const { service, viewService } = services();
  const graph = bindDemoGraph(service);
  const semanticRevision = graph.revision;
  const operate = handlers(service, viewService).find(
    item => item.commandCode === EOG_VIEW_OPERATION_ACTION
  );
  assert.ok(operate);

  const hiddenNode = await operate.execute(
    request(EOG_VIEW_OPERATION_ACTION, {
      resourceId: graph.graphId,
      expectedRevision: 0,
      operation: {
        type: "PROJECTION_ITEM_VISIBILITY_SET",
        targetKind: "NODE",
        targetId: "ledger:receivable",
        visible: false
      }
    }),
    context()
  );
  assert.equal(hiddenNode.ok, true);
  assert.deepEqual(
    hiddenNode.result.nodes.map(node => node.id),
    ["app:sales"]
  );
  assert.equal(hiddenNode.result.edges.length, 0);
  assert.equal(hiddenNode.result.revision, 1);
  assert.equal(
    service.get({
      enterpriseId: graph.enterpriseId,
      graphId: graph.graphId
    }).revision,
    semanticRevision
  );

  const restored = await operate.execute(
    request(EOG_VIEW_OPERATION_ACTION, {
      resourceId: graph.graphId,
      expectedRevision: 1,
      operation: {
        type: "PROJECTION_VISIBILITY_RESET"
      }
    }),
    context()
  );
  assert.equal(restored.ok, true);
  assert.equal(restored.result.nodes.length, 2);
  assert.equal(restored.result.edges.length, 1);
  assert.equal(restored.result.revision, 2);
  assert.equal(
    service.get({
      enterpriseId: graph.enterpriseId,
      graphId: graph.graphId
    }).revision,
    semanticRevision
  );
});
