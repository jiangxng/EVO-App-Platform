import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("3D Viewer spatial implementation is physically package-owned", async () => {
  const source = await readFile("apps/eog-3d-viewer/spatial-page.ts", "utf8");
  assert.equal(source.includes("vendor/eidos/src/3d/index.js"), true);
  assert.equal(
    source.includes("contracts/enterprise-operating-graph-read.js"),
    true
  );
  assert.equal(
    source.includes("contracts/enterprise-operating-graph-view-state.js"),
    true
  );
  assert.equal(source.includes("eog/observatory-input.js"), true);
  assert.equal(source.includes("eog-2d-designer"), false);
  assert.equal(source.includes("eog-2d-viewer"), false);

  const wrapper = await readFile(
    "manager/enterprise-operating-graph-spatial-observatory-page.ts",
    "utf8"
  );
  assert.equal(wrapper.trim().startsWith("export * from"), true);
});
