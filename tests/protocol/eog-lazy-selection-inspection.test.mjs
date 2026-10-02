import test from "node:test";
import assert from "node:assert/strict";

import {
  inspectEog2dSelectionV010
} from "../../dist/eog/2d-selection-inspection.js";
import {
  createEnterpriseOperatingGraphViewerWorkspacePageV010,
  EOG_2D_VIEWER_WORKSPACE_SELECTION_GET_ACTION
} from "../../dist/apps/eog-2d-viewer/workspace-page.js";
import {
  createEnterpriseOperatingGraphEditorPageV010,
  EOG_VIEW_SELECTION_GET_ACTION
} from "../../dist/apps/eog-2d-designer/enterprise-operating-graph-page.js";

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

const resolver = {
  hasCandidates() {
    return true;
  },
  async inspect(input) {
    return [{
      contractVersion: "0.1.0",
      providerId: "application-definition-provider",
      target: structuredClone(input.target),
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
    }];
  }
};

test("lazy selection inspection strips owner editors in Viewer and preserves them in Designer", async () => {
  const viewer = await inspectEog2dSelectionV010({
    graph,
    target: { kind: "node", id: "app:1" },
    role: "VIEWER",
    resolver
  });
  const designer = await inspectEog2dSelectionV010({
    graph,
    target: { kind: "node", id: "app:1" },
    role: "DESIGNER",
    resolver
  });

  assert.equal(viewer.properties[0].value, "Sales Ops");
  assert.equal(viewer.properties[0].editor, undefined);
  assert.equal(
    designer.properties[0].editor.command.code,
    "application.definition.property.set"
  );
});

test("Viewer and Designer pages declare independent lazy selection commands", () => {
  const context = {
    contractVersion: "0.1.0",
    kind: "ENTERPRISE",
    contextId: "enterprise:demo",
    enterpriseId: "enterprise:demo"
  };

  const viewer = createEnterpriseOperatingGraphViewerWorkspacePageV010({
    activeContext: context
  });
  const designer = createEnterpriseOperatingGraphEditorPageV010({
    activeContext: context
  });

  assert.equal(
    viewer.selectionReadCommand.code,
    EOG_2D_VIEWER_WORKSPACE_SELECTION_GET_ACTION
  );
  assert.equal(
    designer.selectionReadCommand.code,
    EOG_VIEW_SELECTION_GET_ACTION
  );
  assert.notEqual(
    viewer.selectionReadCommand.code,
    designer.selectionReadCommand.code
  );
});
