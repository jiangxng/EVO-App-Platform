import test from "node:test";
import assert from "node:assert/strict";

import {
  layoutLayeredDiagramV010,
  isDiagramWorkspacePageV010
} from "../../dist/vendor/eidos/src/2d/index.js";
import {
  createEnterpriseDefinitionProjectionEditorPageV010
} from "../../dist/apps/eog-2d-designer/definition-projection-editor.js";

test("Eidos fixed layered layout is deterministic for directed business-style graphs", () => {
  const input = {
    nodes: [
      { id: "sales-order", width: 140, height: 64 },
      { id: "shipment", width: 140, height: 64 },
      { id: "receivable", width: 140, height: 64 },
      { id: "cash", width: 140, height: 64 }
    ],
    edges: [
      { id: "e1", source: "sales-order", target: "shipment" },
      { id: "e2", source: "shipment", target: "receivable" },
      { id: "e3", source: "receivable", target: "cash" }
    ]
  };
  const first = layoutLayeredDiagramV010(input);
  const second = layoutLayeredDiagramV010(input);
  assert.deepEqual(first, second);

  const byId = new Map(first.placements.map(item => [item.nodeId, item]));
  assert.ok(byId.get("sales-order").x < byId.get("shipment").x);
  assert.ok(byId.get("shipment").x < byId.get("receivable").x);
  assert.ok(byId.get("receivable").x < byId.get("cash").x);
});

test("Definition Projection Editor exposes Auto layout as a fixed Human feature and scales actions into More", () => {
  const page = createEnterpriseDefinitionProjectionEditorPageV010({
    enterpriseId: "ent-a",
    definitionId: "ledger:main",
    definitionRevision: 3,
    projectionId: "projection:sales-to-cash",
    title: "从销售到收款",
    locale: "zh-CN"
  });

  assert.equal(isDiagramWorkspacePageV010(page), true);
  assert.equal(page.toolbarOverflowLabel, "更多");
  assert.equal(page.viewInteraction.localAutoLayout, true);
  assert.equal(page.viewInteraction.localAutoLayoutLabel, "自动排版");
  assert.equal(page.viewInteraction.localAutoLayoutDirection, "RIGHT");
  assert.equal(page.viewInteraction.localAutoLayoutPlacement, "TOOLBAR");
  assert.equal(page.viewInteraction.localVisibilityResetPlacement, "OVERFLOW");
});
