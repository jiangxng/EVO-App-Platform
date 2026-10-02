import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("EOG shared 2D code and both application siblings use neutral Workspace surface types", async () => {
  const files = [
    "eog/diagram-projection.ts",
    "eog/2d-inspector-editors.ts",
    "apps/eog-2d-viewer/desktop-page.ts",
    "apps/eog-2d-designer/enterprise-operating-graph-page.ts"
  ];
  const contents = await Promise.all(files.map(path => readFile(path, "utf8")));

  for (const source of contents) {
    assert.equal(source.includes("DiagramEditorPageV010"), false);
    assert.equal(source.includes("DiagramEditorStateV010"), false);
    assert.equal(source.includes("DiagramWorkspace"), true);
  }
});
