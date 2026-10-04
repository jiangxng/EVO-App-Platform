import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createMemoryEogViewStateStoreV010
} from "../../dist/providers/eog-view-state/store.js";
import {
  createEogViewStateProviderV010
} from "../../dist/providers/eog-view-state/runtime.js";

test("EOG View State is a shared Host provider boundary, not plugin-private state", () => {
  const store = createMemoryEogViewStateStoreV010();
  const provider = createEogViewStateProviderV010({
    store,
    now: () => new Date("2026-10-02T00:00:00.000Z")
  });

  const diagram = provider.ensure({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    kind: "DIAGRAM_2D"
  });
  const spatial = provider.ensure({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    kind: "SPATIAL_3D"
  });

  assert.notEqual(diagram.viewId, spatial.viewId);
  assert.equal(diagram.kind, "DIAGRAM_2D");
  assert.deepEqual(diagram.hiddenNodeIds, []);
  assert.deepEqual(diagram.hiddenEdgeIds, []);
  assert.equal(spatial.kind, "SPATIAL_3D");
  assert.equal(provider.list({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary"
  }).length, 2);
});

test("EOG plugins depend on the public View State provider contract instead of manager-private service", async () => {
  const files = [
    "apps/eog-2d-designer/agent-tools.ts",
    "apps/eog-2d-designer/enterprise-operating-graph-page.ts",
    "apps/eog-3d-viewer/agent-tools.ts"
  ];
  const contents = await Promise.all(files.map(path => readFile(path, "utf8")));

  for (const content of contents) {
    assert.equal(
      content.includes("contracts/enterprise-operating-graph-view-state.js"),
      true
    );
    assert.equal(
      content.includes("manager/enterprise-operating-graph-view-service.js"),
      false
    );
  }
});


test("2D projection clipping is reversible View State and does not require semantic mutation", () => {
  const store = createMemoryEogViewStateStoreV010();
  const provider = createEogViewStateProviderV010({
    store,
    now: () => new Date("2026-10-05T00:00:00.000Z")
  });
  let view = provider.ensure({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    kind: "DIAGRAM_2D"
  });

  view = provider.apply({
    enterpriseId: view.enterpriseId,
    graphId: view.graphId,
    viewId: view.viewId,
    expectedRevision: view.revision,
    mutation: {
      type: "PROJECTION_ITEM_VISIBILITY_SET",
      target: { kind: "NODE", id: "app:sales" },
      visible: false
    }
  });
  assert.deepEqual(view.hiddenNodeIds, ["app:sales"]);

  view = provider.apply({
    enterpriseId: view.enterpriseId,
    graphId: view.graphId,
    viewId: view.viewId,
    expectedRevision: view.revision,
    mutation: {
      type: "PROJECTION_ITEM_VISIBILITY_SET",
      target: { kind: "EDGE", id: "guidance-edge:guidance:1" },
      visible: false
    }
  });
  assert.deepEqual(view.hiddenEdgeIds, ["guidance-edge:guidance:1"]);

  view = provider.apply({
    enterpriseId: view.enterpriseId,
    graphId: view.graphId,
    viewId: view.viewId,
    expectedRevision: view.revision,
    mutation: { type: "PROJECTION_VISIBILITY_RESET" }
  });
  assert.deepEqual(view.hiddenNodeIds, []);
  assert.deepEqual(view.hiddenEdgeIds, []);
});
