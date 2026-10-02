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
});

test("vendored Eidos public 3D Core facade preserves spatial implementation identity", () => {
  assert.equal(threeD.reduceSpatial, spatial.reduceSpatial);
  assert.equal(threeD.mountSpatialObservatoryPageV010, spatial.mountSpatialObservatoryPageV010);
  assert.equal(threeD.realizeWithThreeAdapter, spatial.realizeWithThreeAdapter);
});

test("EOG application projections consume public Eidos visual-core facades, not implementation folders", async () => {
  const files = [
    "apps/eog-2d-designer/enterprise-operating-graph-page.ts",
    "apps/eog-2d-viewer/desktop-page.ts",
    "manager/enterprise-operating-graph-spatial-observatory-page.ts"
  ];
  const contents = await Promise.all(files.map(path => readFile(path, "utf8")));

  assert.equal(contents[0].includes("vendor/eidos/src/2d/index.js"), true);
  assert.equal(contents[1].includes("vendor/eidos/src/2d/index.js"), true);
  assert.equal(contents[2].includes("vendor/eidos/src/3d/index.js"), true);

  for (const content of contents) {
    assert.equal(content.includes("vendor/eidos/src/diagram/"), false);
    assert.equal(content.includes("vendor/eidos/src/spatial/"), false);
  }
});
