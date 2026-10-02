import test from "node:test";
import assert from "node:assert/strict";

import {
  projectEnterpriseOperatingGraphDiagramBaseV010
} from "../../dist/eog/diagram-projection.js";
import {
  applyEog2dInspectorPropertyContributionsV010
} from "../../dist/eog/2d-inspector-contributions.js";

const graph = {
  contractVersion: "0.1.0",
  graphId: "eog:primary",
  enterpriseId: "enterprise:demo",
  revision: 1,
  state: "DRAFT",
  nodes: [{
    nodeId: "app:1",
    kind: "APPLICATION",
    semanticRef: {
      authority: "ENTERPRISE",
      kind: "APPLICATION",
      refId: "application:sales"
    }
  }],
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

const contribution = {
  contractVersion: "0.1.0",
  providerId: "application-definition-provider",
  target: {
    kind: "NODE",
    nodeId: "app:1",
    nodeKind: "APPLICATION",
    semanticRef: graph.nodes[0].semanticRef
  },
  properties: [{
    key: "application.owner",
    label: "Owner",
    value: "Sales Ops",
    edit: {
      kind: "TEXT",
      actionId: "application.owner.set",
      command: {
        code: "application.definition.property.set",
        inputVersion: "0.1.0"
      },
      valueField: "value",
      operation: {
        type: "PROPERTY_SET",
        definitionId: "application:sales",
        propertyKey: "owner"
      }
    }
  }]
};

test("Viewer and Designer share contributed property values but only Designer receives owner editor command", () => {
  const base = projectEnterpriseOperatingGraphDiagramBaseV010({
    graph,
    view,
    readOnly: false
  });
  const viewer = applyEog2dInspectorPropertyContributionsV010(
    base,
    [contribution],
    "VIEWER"
  );
  const designer = applyEog2dInspectorPropertyContributionsV010(
    base,
    [contribution],
    "DESIGNER"
  );

  const viewerProperty = viewer.nodes[0].properties.find(
    item => item.key === "application.owner"
  );
  const designerProperty = designer.nodes[0].properties.find(
    item => item.key === "application.owner"
  );

  assert.equal(viewerProperty.value, "Sales Ops");
  assert.equal(designerProperty.value, "Sales Ops");
  assert.equal(viewerProperty.editor, undefined);
  assert.equal(
    designerProperty.editor.command.code,
    "application.definition.property.set"
  );
  assert.equal(
    base.nodes[0].properties.some(item => item.key === "application.owner"),
    false
  );
});

test("Inspector contributions fail closed on duplicate property keys", () => {
  const base = projectEnterpriseOperatingGraphDiagramBaseV010({
    graph,
    view,
    readOnly: true
  });
  assert.throws(
    () => applyEog2dInspectorPropertyContributionsV010(
      base,
      [{
        ...contribution,
        properties: [{
          key: "node.kind",
          label: "Conflicting kind",
          value: "Other"
        }]
      }],
      "VIEWER"
    ),
    /EOG_2D_INSPECTOR_CONTRIBUTION_PROPERTY_DUPLICATE/
  );
});
