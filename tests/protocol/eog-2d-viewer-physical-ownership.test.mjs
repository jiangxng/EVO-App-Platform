import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("2D Viewer runtime/read implementation is physically package-owned", async () => {
  const owned = [
    "apps/eog-2d-viewer/observatory-input.ts",
    "apps/eog-2d-viewer/observatory-actions.ts",
    "apps/eog-2d-viewer/agent-tools.ts",
    "apps/eog-2d-viewer/mobile-read-page.ts",
    "apps/eog-2d-viewer/desktop-page.ts"
  ];
  const contents = await Promise.all(owned.map(path => readFile(path, "utf8")));
  assert.equal(contents.every(content => !content.includes("../apps/eog-2d-viewer/")), true);

  const compatibility = [
    "manager/enterprise-operating-graph-observatory-input.ts",
    "manager/enterprise-operating-graph-observatory-actions.ts",
    "manager/enterprise-operating-graph-observatory-agent-tools.ts",
    "manager/enterprise-operating-graph-mobile-read-page.ts",
    "manager/enterprise-operating-graph-observatory-page.ts"
  ];
  const wrappers = await Promise.all(compatibility.map(path => readFile(path, "utf8")));
  assert.equal(wrappers.every(content => content.trim().startsWith("export * from")), true);
});


test("desktop 2D Viewer has a fail-closed Viewer-owned operation command", async () => {
  const source = await readFile(
    "apps/eog-2d-viewer/desktop-page.ts",
    "utf8"
  );
  assert.equal(
    source.includes("enterprise-operating-graph.observatory.view.operation"),
    true
  );
  assert.equal(source.includes("EOG_2D_VIEWER_READ_ONLY"), true);
  assert.equal(
    source.includes("enterprise-operating-graph.view.operation"),
    false
  );
  assert.equal(
    source.includes("projectEnterpriseOperatingGraphDiagramBaseV010"),
    true
  );
});
