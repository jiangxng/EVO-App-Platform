import test from "node:test";
import assert from "node:assert/strict";

import {
  applyEnterpriseOperatingGraphOperationV010
} from "../../dist/apps/eog-2d-designer/enterprise-operating-graph-model.js";
import {
  projectEnterpriseOperatingGraphEditorStateV010
} from "../../dist/apps/eog-2d-designer/enterprise-operating-graph-page.js";
import {
  projectEnterpriseOperatingGraphDiagramBaseV010
} from "../../dist/eog/diagram-projection.js";

const baseGraph = {
  contractVersion: "0.1.0",
  graphId: "eog:primary",
  enterpriseId: "enterprise:demo",
  revision: 1,
  state: "DRAFT",
  nodes: [
    {
      nodeId: "app:1",
      kind: "APPLICATION",
      semanticRef: {
        authority: "HOST",
        kind: "APPLICATION",
        refId: "application:sales"
      }
    },
    {
      nodeId: "ledger:1",
      kind: "LEDGER",
      semanticRef: {
        authority: "EVO",
        kind: "LEDGER_DEFINITION",
        refId: "ledger:receivable"
      }
    }
  ],
  guidanceRelations: [],
  enterpriseRelations: [],
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z"
};

const view = {
  contractVersion: "0.1.0",
  viewId: "eog-view:primary:diagram-2d",
  graphId: "eog:primary",
  enterpriseId: "enterprise:demo",
  kind: "DIAGRAM_2D",
  revision: 0,
  placements: [],
  createdAt: "2026-10-02T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z"
};

function header(type, expectedRevision = 1) {
  return {
    contractVersion: "0.1.0",
    operationId: "op:" + type,
    graphId: "eog:primary",
    expectedRevision,
    actor: {
      type: "HUMAN",
      subjectId: "human:demo"
    },
    occurredAt: "2026-10-02T01:00:00.000Z",
    type
  };
}

test("NODE_REBIND creates a new graph revision for an unconnected node", () => {
  const next = applyEnterpriseOperatingGraphOperationV010(
    baseGraph,
    {
      ...header("NODE_REBIND"),
      nodeId: "app:1",
      semanticRef: {
        authority: "HOST",
        kind: "APPLICATION",
        refId: "application:renewed-sales",
        versionRef: "v2"
      }
    }
  );

  assert.equal(next.revision, 2);
  assert.equal(
    next.nodes.find(item => item.nodeId === "app:1").semanticRef.refId,
    "application:renewed-sales"
  );
  assert.equal(
    next.nodes.find(item => item.nodeId === "app:1").semanticRef.versionRef,
    "v2"
  );
  assert.equal(baseGraph.nodes[0].semanticRef.refId, "application:sales");
});

test("NODE_REBIND fails closed when the node participates in a relation", () => {
  const graph = structuredClone(baseGraph);
  graph.guidanceRelations.push({
    relationId: "guidance:1",
    kind: "APPLICATION_LEDGER",
    applicationNodeId: "app:1",
    ledgerNodeId: "ledger:1",
    source: {
      kind: "ENTERPRISE_TEMPLATE",
      sourceRef: "template:sales"
    }
  });

  assert.throws(
    () => applyEnterpriseOperatingGraphOperationV010(
      graph,
      {
        ...header("NODE_REBIND"),
        nodeId: "app:1",
        semanticRef: {
          authority: "HOST",
          kind: "APPLICATION",
          refId: "application:other"
        }
      }
    ),
    /EOG_NODE_REBIND_RELATION_CONFLICT/
  );
});

test("Guidance source can be revised before confirmation and becomes immutable after confirmation", () => {
  const graph = structuredClone(baseGraph);
  graph.guidanceRelations.push({
    relationId: "guidance:1",
    kind: "APPLICATION_LEDGER",
    applicationNodeId: "app:1",
    ledgerNodeId: "ledger:1",
    source: {
      kind: "ENTERPRISE_TEMPLATE",
      sourceRef: "template:sales"
    }
  });

  const next = applyEnterpriseOperatingGraphOperationV010(
    graph,
    {
      ...header("GUIDANCE_RELATION_SOURCE_UPDATE"),
      relationId: "guidance:1",
      source: {
        kind: "APQC",
        sourceRef: "apqc:process:1"
      }
    }
  );
  assert.equal(next.revision, 2);
  assert.equal(next.guidanceRelations[0].source.kind, "APQC");

  const confirmed = structuredClone(graph);
  confirmed.enterpriseRelations.push({
    relationId: "enterprise:1",
    kind: "APPLICATION_LEDGER",
    applicationNodeId: "app:1",
    ledgerNodeId: "ledger:1",
    confirmedBySubjectId: "human:demo",
    confirmedAt: "2026-10-02T00:30:00.000Z",
    confirmedFromGuidanceRelationId: "guidance:1"
  });

  assert.throws(
    () => applyEnterpriseOperatingGraphOperationV010(
      confirmed,
      {
        ...header("GUIDANCE_RELATION_SOURCE_UPDATE"),
        relationId: "guidance:1",
        source: {
          kind: "APQC",
          sourceRef: "apqc:process:2"
        }
      }
    ),
    /EOG_GUIDANCE_SOURCE_CONFIRMED_IMMUTABLE/
  );
});

test("Designer exposes EOG-owned field editors while Viewer sees the same values without editors", () => {
  const graph = structuredClone(baseGraph);
  graph.guidanceRelations.push({
    relationId: "guidance:1",
    kind: "APPLICATION_LEDGER",
    applicationNodeId: "app:1",
    ledgerNodeId: "ledger:1",
    source: {
      kind: "ENTERPRISE_TEMPLATE",
      sourceRef: "template:sales"
    }
  });

  const viewer = projectEnterpriseOperatingGraphDiagramBaseV010({
    graph,
    view,
    readOnly: true
  });
  const designer = projectEnterpriseOperatingGraphEditorStateV010(
    graph,
    view
  );

  const viewerNodeRef = viewer.nodes[0].properties.find(
    item => item.key === "semantic.ref"
  );
  const designerNodeRef = designer.nodes[0].properties.find(
    item => item.key === "semantic.ref"
  );

  assert.equal(viewerNodeRef.value, designerNodeRef.value);
  assert.equal(viewerNodeRef.editor, undefined);

  // Connected nodes cannot be rebound directly.
  assert.equal(designerNodeRef.editor, undefined);

  const viewerGuidanceSource = viewer.edges[0].properties.find(
    item => item.key === "source.ref"
  );
  const designerGuidanceSource = designer.edges[0].properties.find(
    item => item.key === "source.ref"
  );

  assert.equal(viewerGuidanceSource.value, designerGuidanceSource.value);
  assert.equal(viewerGuidanceSource.editor, undefined);
  assert.equal(designerGuidanceSource.editor.kind, "TEXT");
  assert.equal(
    designerGuidanceSource.editor.operation.type,
    "GUIDANCE_SOURCE_PATCH"
  );
});

test("Designer exposes semantic rebind editors on unconnected nodes only", () => {
  const designer = projectEnterpriseOperatingGraphEditorStateV010(
    baseGraph,
    view
  );
  const node = designer.nodes.find(item => item.id === "app:1");
  assert.equal(
    node.properties.find(item => item.key === "semantic.ref").editor.kind,
    "TEXT"
  );
  assert.equal(
    node.properties.find(item => item.key === "semantic.version").editor.kind,
    "TEXT"
  );
});
