import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("EOG shared 2D code and both application siblings use neutral Workspace surface types", async () => {
  const files = [
    "eog/diagram-projection.ts",
    "eog/2d-inspector-editors.ts",
    "apps/eog-2d-viewer/workspace-page.ts",
    "apps/eog-2d-designer/enterprise-operating-graph-page.ts"
  ];
  const contents = await Promise.all(files.map(path => readFile(path, "utf8")));

  for (const source of contents) {
    assert.equal(source.includes("DiagramEditorPageV010"), false);
    assert.equal(source.includes("DiagramEditorStateV010"), false);
    assert.equal(source.includes("DiagramWorkspace"), true);
  }
});


test("Viewer and Designer serialize as the same neutral Workspace kind", async () => {
  const [viewer, designer] = await Promise.all([
    readFile("apps/eog-2d-viewer/workspace-page.ts", "utf8"),
    readFile("apps/eog-2d-designer/enterprise-operating-graph-page.ts", "utf8")
  ]);

  assert.equal(viewer.includes('kind: "diagram-workspace"'), true);
  assert.equal(designer.includes('kind: "diagram-workspace"'), true);
  assert.equal(viewer.includes("operationCommand"), false);
  assert.equal(designer.includes("operationCommand"), true);
});
