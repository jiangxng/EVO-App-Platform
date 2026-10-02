import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  projectEnterpriseOperatingGraphDiagramBaseV010
} from "../../dist/eog/diagram-projection.js";

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

test("shared EOG 2D base projection has no semantic edit actions", () => {
  const state = projectEnterpriseOperatingGraphDiagramBaseV010({
    graph,
    view,
    readOnly: true
  });
  assert.deepEqual(state.actions, []);
  assert.equal(state.nodes[0].readOnly, true);
});

test("Designer consumes package-neutral 2D base projection", async () => {
  const source = await readFile(
    "apps/eog-2d-designer/enterprise-operating-graph-page.ts",
    "utf8"
  );
  assert.equal(source.includes("../../eog/diagram-projection.js"), true);
  assert.equal(source.includes("function positions("), false);
  assert.equal(source.includes("function semanticLabel("), false);
});
