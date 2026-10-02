import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Viewer plugins consume public Observatory runtime contracts", async () => {
  const files = [
    "apps/eog-2d-viewer/observatory-actions.ts",
    "apps/eog-2d-viewer/agent-tools.ts",
    "apps/eog-2d-viewer/mobile-read-page.ts",
    "apps/eog-2d-viewer/desktop-page.ts",
    "apps/eog-3d-viewer/spatial-page.ts"
  ];
  const contents = await Promise.all(files.map(path => readFile(path, "utf8")));
  assert.equal(
    contents.every(content =>
      content.includes("contracts/enterprise-operating-graph-observatory-runtime.js")
    ),
    true
  );
  assert.equal(
    contents.some(content =>
      content.includes("manager/enterprise-operating-graph-observatory-provider.js")
    ),
    false
  );
});

test("peer Observatory Provider packages consume public capability constants", async () => {
  const files = [
    "providers/eog-bottleneck-analysis/package.ts",
    "providers/evo-runtime-observatory/package.ts"
  ];
  const contents = await Promise.all(files.map(path => readFile(path, "utf8")));
  assert.equal(
    contents.every(content =>
      content.includes("contracts/enterprise-operating-graph-observatory-runtime.js")
    ),
    true
  );
});
