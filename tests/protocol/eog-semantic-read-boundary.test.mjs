import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Viewer-side EOG code depends on the public semantic read contract", async () => {
  const files = [
    "apps/eog-3d-viewer/agent-tools.ts",
    "apps/eog-3d/workspace-page.ts",
    "manager/enterprise-operating-graph-observatory.ts",
    "manager/enterprise-operating-graph-observatory-provider.ts",
    "apps/enterprise-observatory/observatory-actions.ts",
    "apps/enterprise-observatory/agent-tools.ts",
    "apps/enterprise-observatory/desktop-page.ts",
    "apps/enterprise-observatory/mobile-read-page.ts",
    "apps/enterprise-observatory/spatial-page.ts"
  ];
  const contents = await Promise.all(files.map(path => readFile(path, "utf8")));

  for (const content of contents) {
    assert.equal(
      content.includes("contracts/enterprise-operating-graph-read.js"),
      true
    );
    assert.equal(
      content.includes("eog-2d-designer/enterprise-operating-graph-service.js"),
      false
    );
    assert.equal(
      content.includes("./enterprise-operating-graph-service.js"),
      false
    );
  }
});
