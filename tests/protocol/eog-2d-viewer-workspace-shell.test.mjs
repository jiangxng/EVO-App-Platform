import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  EOG_2D_VIEWER_WORKSPACE_PAGE_SOURCE,
  EOG_2D_VIEWER_WORKSPACE_ROUTE,
  eog2dViewerPackage
} from "../../dist/apps/eog-2d-viewer/package.js";

test("2D Viewer has a generic interactive Workspace independent of Observatory providers", async () => {
  const feature = eog2dViewerPackage.features[0];
  const experience = feature.contributions.find(
    item => item.kind === "eidos.experience"
  ).manifest;

  assert.equal(experience.defaultRoute, EOG_2D_VIEWER_WORKSPACE_ROUTE);
  assert.equal(
    experience.pages.some(page => page.source === EOG_2D_VIEWER_WORKSPACE_PAGE_SOURCE),
    true
  );
  assert.equal(
    experience.routes.some(route => route.path === "/operating-graph/observe"),
    false
  );

  const source = await readFile(
    "apps/eog-2d-viewer/workspace-page.ts",
    "utf8"
  );
  assert.equal(source.includes("ObservatoryProviderResolver"), false);
  assert.equal(source.includes("projectEnterpriseOperatingGraphDiagramBaseV010"), true);
  assert.equal(source.includes("readOnly: true"), true);
  assert.equal(source.includes('kind: "diagram-workspace"'), true);
  assert.equal(source.includes("operationCommand"), false);
  assert.equal(source.includes("EOG_2D_VIEWER_OPERATION_UNSUPPORTED"), false);
});
