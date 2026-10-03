import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Enterprise Observatory and spatial compatibility consume public Observatory runtime contracts", async () => {
  const files = [
    "apps/enterprise-observatory/observatory-actions.ts",
    "apps/enterprise-observatory/agent-tools.ts",
    "apps/enterprise-observatory/mobile-read-page.ts",
    "apps/enterprise-observatory/desktop-page.ts",
    "apps/enterprise-observatory/spatial-page.ts"
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
