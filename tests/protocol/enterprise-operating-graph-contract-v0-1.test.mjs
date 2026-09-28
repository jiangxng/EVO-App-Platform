import test from "node:test";
import assert from "node:assert/strict";
import {
  applyEnterpriseOperatingGraphOperationV010,
  createEnterpriseOperatingGraphV010,
  validateEnterpriseOperatingGraphV010
} from "../../dist/manager/enterprise-operating-graph-model.js";

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

test("Human direct manipulation and Agent edits use the same operation contract", () => {
  let graph = createEnterpriseOperatingGraphV010({
    graphId: "eog:roundtrip",
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
      type: "NODE_MOVE",
      position: {
        nodeId: "node:app:sales",
        x: 120,
        y: 80
      }
    })
  );

  graph = applyEnterpriseOperatingGraphOperationV010(
    graph,
    baseOperation(graph, {
      type: "NODE_MOVE",
      position: {
        nodeId: "node:ledger:receivable",
        x: 420,
        y: 80
      }
    })
  );

  assert.deepEqual(
    [...graph.positions].sort((a, b) => a.nodeId.localeCompare(b.nodeId)),
    [
      { nodeId: "node:app:sales", x: 120, y: 80 },
      { nodeId: "node:ledger:receivable", x: 420, y: 80 }
    ]
  );
  assert.equal(validateEnterpriseOperatingGraphV010(graph).publishable, true);
});

test("optimistic revision prevents Human and Agent from silently overwriting each other", () => {
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

test("published EOG version is immutable and guidance remains non-authoritative overlay", () => {
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
      actor: {
        type: "AGENT",
        subjectId: "agent:personal"
      },
      type: "GUIDANCE_RELATION_PUT",
      relation: {
        relationId: "guidance:legacy-rule",
        kind: "APPLICATION_LEDGER",
        applicationNodeId: "node:app:sales",
        ledgerNodeId: "node:ledger:receivable",
        source: {
          kind: "LEGACY_POSTING_RULE_TEMPLATE",
          sourceRef: "bookkeeping:policy:receivable"
        }
      }
    })
  );

  graph = applyEnterpriseOperatingGraphOperationV010(
    graph,
    baseOperation(graph, {
      type: "PUBLISH"
    })
  );

  assert.equal(graph.state, "PUBLISHED");
  assert.equal(graph.enterpriseRelations.length, 0);
  assert.equal(graph.guidanceRelations.length, 1);

  assert.throws(
    () => applyEnterpriseOperatingGraphOperationV010(
      graph,
      {
        contractVersion: "0.1.0",
        operationId: "op:after-publish",
        graphId: graph.graphId,
        expectedRevision: graph.revision,
        actor: {
          type: "HUMAN",
          subjectId: "human:owner"
        },
        occurredAt: "2026-09-28T12:30:00.000Z",
        type: "NODE_MOVE",
        position: {
          nodeId: "node:app:sales",
          x: 999,
          y: 999
        }
      }
    ),
    /EOG_PUBLISHED_IMMUTABLE/
  );
});
