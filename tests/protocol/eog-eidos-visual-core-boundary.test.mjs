import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import * as twoD from "../../dist/vendor/eidos/src/2d/index.js";
import * as diagramSurface from "../../dist/vendor/eidos/src/diagram/surface.js";
import * as threeD from "../../dist/vendor/eidos/src/3d/index.js";
import * as spatial from "../../dist/vendor/eidos/src/spatial/index.js";

test("vendored Eidos public 2D Core facade preserves diagram implementation identity", () => {
  assert.equal(twoD.mountDiagramEditorPageV010, diagramSurface.mountDiagramEditorPageV010);
  assert.equal(twoD.validateDiagramEditorStateV010, diagramSurface.validateDiagramEditorStateV010);
  assert.equal(twoD.mountDiagramWorkspacePageV010, diagramSurface.mountDiagramEditorPageV010);
  assert.equal(
    twoD.diagramWorkspaceSelectionReadRequestV010,
    diagramSurface.diagramEditorSelectionReadRequestV010
  );
});

test("vendored Eidos public 3D Core facade preserves spatial implementation identity", () => {
  assert.equal(threeD.reduceSpatial, spatial.reduceSpatial);
  assert.equal(threeD.mountSpatialObservatoryPageV010, spatial.mountSpatialObservatoryPageV010);
  assert.equal(threeD.mountSpatialWorkspacePageV010, spatial.mountSpatialObservatoryPageV010);
  assert.equal(threeD.realizeWithThreeAdapter, spatial.realizeWithThreeAdapter);
});

test("EOG application projections consume public Eidos visual-core facades, not implementation folders", async () => {
  const files = [
    "apps/eog-2d-designer/enterprise-operating-graph-page.ts",
    "apps/eog-2d-viewer/workspace-page.ts",
    "apps/enterprise-observatory/desktop-page.ts",
    "apps/eog-3d/workspace-page.ts",
    "apps/enterprise-observatory/spatial-page.ts"
  ];
  const contents = await Promise.all(files.map(path => readFile(path, "utf8")));

  assert.equal(contents[0].includes("vendor/eidos/src/2d/index.js"), true);
  assert.equal(contents[1].includes("vendor/eidos/src/2d/index.js"), true);
  assert.equal(contents[2].includes("vendor/eidos/src/2d/index.js"), true);
  assert.equal(contents[3].includes("vendor/eidos/src/3d/index.js"), true);
  assert.equal(contents[4].includes("vendor/eidos/src/3d/index.js"), true);

  for (const content of contents) {
    assert.equal(content.includes("vendor/eidos/src/diagram/"), false);
    assert.equal(content.includes("vendor/eidos/src/spatial/"), false);
  }
});


test("vendored Eidos snapshot includes neutral 2D and 3D Workspace boundaries", async () => {
  const manifest = JSON.parse(
    await readFile("vendor/eidos/source.manifest.json", "utf8")
  );
  assert.equal(
    manifest.sourceCommit,
    "22b487ffc3ddc12b819c9601d6f06c34326fb454"
  );
  assert.equal(manifest.files.includes("src/app-host/action-download.ts"), true);
  assert.equal(manifest.files.includes("src/diagram/workspace.ts"), true);
  assert.equal(manifest.files.includes("src/catalog-detail/render.ts"), true);
  assert.equal(manifest.files.includes("src/diagram/viewport.ts"), true);
  assert.equal(manifest.files.includes("src/spatial/workspace.ts"), true);
});


test("vendored Eidos preserves locally rendered form results in Workbench", async () => {
  const source = await readFile(
    "vendor/eidos/src/app-host/page-controller.ts",
    "utf8"
  );
  const resultRender = source.indexOf(
    "formatAppHostActionResultV010(execution.result.result)"
  );
  const preserve = source.indexOf(
    "{ preserveMountedPage: true }",
    resultRender
  );
  assert.notEqual(resultRender, -1);
  assert.ok(preserve > resultRender);
});
