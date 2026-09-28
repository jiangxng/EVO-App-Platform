import test from "node:test";
import assert from "node:assert/strict";
import {
  applyEnterpriseOperatingGraphOperationV010,
  createEnterpriseOperatingGraphV010,
  validateEnterpriseOperatingGraphV010
} from "../../dist/manager/enterprise-operating-graph-model.js";
import {
  createMemoryEnterpriseOperatingGraphViewStoreV010
} from "../../dist/manager/enterprise-operating-graph-view-store.js";
import {
  createEnterpriseOperatingGraphViewHostServiceV010
} from "../../dist/manager/enterprise-operating-graph-view-service.js";

function baseOperation(graph, overrides = {}) {
  return {
    contractVersion: "0.1.0",
    operationId: "op:" + (graph.revision + 1),
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    actor: {
      type: "HUMAN",
      subjectId: "human:owner"
    },
    occurredAt: new Date(
      Date.parse("2026-09-28T12:00:00.000Z") + graph.revision * 1000
    ).toISOString(),
    ...overrides
  };
}

function bindApplication(graph) {
  return applyEnterpriseOperatingGraphOperationV010(
    graph,
    baseOperation(graph, {
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
    })
  );
}

function bindLedger(graph) {
  return applyEnterpriseOperatingGraphOperationV010(
    graph,
    baseOperation(graph, {
      actor: {
        type: "AGENT",
        subjectId: "agent:personal"
      },
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
    })
  );
}

test("EOG v0.1 keeps guidance separate until Human confirmation", () => {
  let graph = createEnterpriseOperatingGraphV010({
    graphId: "eog:demo",
    enterpriseId: "enterprise:demo",
    createdAt: "2026-09-28T12:00:00.000Z"
  });

  graph = bindApplication(graph);
  graph = bindLedger(graph);

  graph = applyEnterpriseOperatingGraphOperationV010(
    graph,
    baseOperation(graph, {
      actor: {
        type: "AGENT",
        subjectId: "agent:personal"
      },
      type: "GUIDANCE_RELATION_PUT",
      relation: {
        relationId: "guidance:app-receivable",
        kind: "APPLICATION_LEDGER",
        applicationNodeId: "node:app:sales",
        ledgerNodeId: "node:ledger:receivable",
        source: {
          kind: "ACCOUNTING_GUIDANCE",
          sourceRef: "prc-accounting-guidance:application-guide"
        }
      }
    })
  );

  assert.equal(graph.guidanceRelations.length, 1);
  assert.equal(graph.enterpriseRelations.length, 0);

  graph = applyEnterpriseOperatingGraphOperationV010(
    graph,
    baseOperation(graph, {
      type: "ENTERPRISE_RELATION_CONFIRM",
      enterpriseRelationId: "enterprise-relation:app-receivable",
      applicationNodeId: "node:app:sales",
      ledgerNodeId: "node:ledger:receivable",
      guidanceRelationId: "guidance:app-receivable"
    })
  );

  assert.equal(graph.guidanceRelations.length, 1);
  assert.deepEqual(graph.enterpriseRelations, [{
    relationId: "enterprise-relation:app-receivable",
    kind: "APPLICATION_LEDGER",
    applicationNodeId: "node:app:sales",
    ledgerNodeId: "node:ledger:receivable",
    confirmedBySubjectId: "human:owner",
    confirmedAt: graph.updatedAt,
    confirmedFromGuidanceRelationId: "guidance:app-receivable"
  }]);
});

test("layout is independent View State and does not advance semantic graph revision", () => {
  let graph = createEnterpriseOperatingGraphV010({
    graphId: "eog:roundtrip",
    enterpriseId: "enterprise:demo",
    createdAt: "2026-09-28T12:00:00.000Z"
  });
  graph = bindApplication(graph);
  graph = bindLedger(graph);
  const semanticRevision = graph.revision;

  const views = createEnterpriseOperatingGraphViewHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphViewStoreV010(),
    now: () => new Date("2026-09-28T12:10:00.000Z")
  });

  let view = views.ensure({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    kind: "DIAGRAM_2D"
  });
  view = views.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    viewId: view.viewId,
    expectedRevision: view.revision,
    mutation: {
      type: "NODE_POSITION_SET",
      placement: {
        nodeId: "node:app:sales",
        x: 120,
        y: 80
      }
    }
  });
  view = views.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    viewId: view.viewId,
    expectedRevision: view.revision,
    mutation: {
      type: "NODE_POSITION_SET",
      placement: {
        nodeId: "node:ledger:receivable",
        x: 420,
        y: 80
      }
    }
  });

  assert.equal(graph.revision, semanticRevision);
  assert.equal("positions" in graph, false);
  assert.deepEqual(
    [...view.placements].sort((a, b) => a.nodeId.localeCompare(b.nodeId)),
    [
      { nodeId: "node:app:sales", x: 120, y: 80 },
      { nodeId: "node:ledger:receivable", x: 420, y: 80 }
    ]
  );
  assert.equal(validateEnterpriseOperatingGraphV010(graph).publishable, true);
});

test("2D and 3D views can coexist over the same semantic graph", () => {
  const graph = bindLedger(bindApplication(createEnterpriseOperatingGraphV010({
    graphId: "eog:views",
    enterpriseId: "enterprise:demo",
    createdAt: "2026-09-28T12:00:00.000Z"
  })));
  const views = createEnterpriseOperatingGraphViewHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphViewStoreV010()
  });

  const diagram = views.ensure({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    kind: "DIAGRAM_2D"
  });
  let spatial = views.ensure({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    kind: "SPATIAL_3D"
  });
  spatial = views.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    viewId: spatial.viewId,
    expectedRevision: spatial.revision,
    mutation: {
      type: "NODE_POSITION_SET",
      placement: {
        nodeId: "node:app:sales",
        x: 10,
        y: 20,
        z: 30
      }
    }
  });
  spatial = views.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    viewId: spatial.viewId,
    expectedRevision: spatial.revision,
    mutation: {
      type: "CAMERA_SET",
      camera: {
        position: { x: 0, y: 0, z: 1000 },
        target: { x: 0, y: 0, z: 0 }
      }
    }
  });

  assert.equal(diagram.kind, "DIAGRAM_2D");
  assert.equal(spatial.kind, "SPATIAL_3D");
  assert.equal(spatial.placements[0].z, 30);
  assert.equal(spatial.camera.position.z, 1000);
});

test("optimistic semantic revision prevents Human and Agent from silently overwriting each other", () => {
  let graph = createEnterpriseOperatingGraphV010({
    graphId: "eog:revision",
    enterpriseId: "enterprise:demo",
    createdAt: "2026-09-28T12:00:00.000Z"
  });
  const stale = baseOperation(graph, {
    type: "NODE_BIND",
    node: {
      nodeId: "node:ledger:stale",
      kind: "LEDGER",
      semanticRef: {
        kind: "LEDGER_DEFINITION",
        authority: "EVO",
        refId: "ledger:stale"
      }
    }
  });

  graph = bindApplication(graph);

  assert.throws(
    () => applyEnterpriseOperatingGraphOperationV010(graph, stale),
    /EOG_REVISION_CONFLICT/
  );
});

test("Application/Ledger relation direction is semantic, not an arbitrary visual line", () => {
  let graph = createEnterpriseOperatingGraphV010({
    graphId: "eog:direction",
    enterpriseId: "enterprise:demo",
    createdAt: "2026-09-28T12:00:00.000Z"
  });
  graph = bindApplication(graph);
  graph = bindLedger(graph);

  assert.throws(
    () => applyEnterpriseOperatingGraphOperationV010(
      graph,
      baseOperation(graph, {
        type: "ENTERPRISE_RELATION_CONFIRM",
        enterpriseRelationId: "enterprise-relation:invalid",
        applicationNodeId: "node:ledger:receivable",
        ledgerNodeId: "node:app:sales"
      })
    ),
    /EOG_APPLICATION_NODE_REQUIRED/
  );
});

test("published semantic EOG is immutable while View State remains independently editable", () => {
  let graph = createEnterpriseOperatingGraphV010({
    graphId: "eog:publish",
    enterpriseId: "enterprise:demo",
    createdAt: "2026-09-28T12:00:00.000Z"
  });
  graph = bindApplication(graph);
  graph = bindLedger(graph);
  graph = applyEnterpriseOperatingGraphOperationV010(
    graph,
    baseOperation(graph, {
      type: "PUBLISH"
    })
  );

  assert.equal(graph.state, "PUBLISHED");
  assert.throws(
    () => applyEnterpriseOperatingGraphOperationV010(
      graph,
      baseOperation(graph, {
        type: "NODE_REMOVE",
        nodeId: "node:app:sales"
      })
    ),
    /EOG_PUBLISHED_IMMUTABLE/
  );

  const views = createEnterpriseOperatingGraphViewHostServiceV010({
    store: createMemoryEnterpriseOperatingGraphViewStoreV010()
  });
  let view = views.ensure({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    kind: "DIAGRAM_2D"
  });
  view = views.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    viewId: view.viewId,
    expectedRevision: view.revision,
    mutation: {
      type: "NODE_POSITION_SET",
      placement: {
        nodeId: "node:app:sales",
        x: 999,
        y: 999
      }
    }
  });
  assert.deepEqual(view.placements, [
    { nodeId: "node:app:sales", x: 999, y: 999 }
  ]);
});
