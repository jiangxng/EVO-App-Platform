import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Observatory input grammar is package-neutral across 2D and 3D viewers", async () => {
  const neutral = await readFile("eog/observatory-input.ts", "utf8");
  assert.equal(
    neutral.includes("contracts/enterprise-operating-graph-observatory.js"),
    true
  );
  assert.equal(neutral.includes("apps/eog-2d-viewer"), false);
  assert.equal(neutral.includes("apps/eog-3d-viewer"), false);

  const consumers = [
    "apps/enterprise-observatory/observatory-actions.ts",
    "apps/enterprise-observatory/agent-tools.ts",
    "apps/enterprise-observatory/mobile-read-page.ts",
    "apps/enterprise-observatory/desktop-page.ts",
    "apps/enterprise-observatory/spatial-page.ts"
  ];
  const contents = await Promise.all(consumers.map(path => readFile(path, "utf8")));
  assert.equal(
    contents.every(content => content.includes("eog/observatory-input.js")),
    true
  );
});
