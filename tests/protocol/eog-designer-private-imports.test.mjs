import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("2D Designer persistence and migration use package-owned model/store directly", async () => {
  const files = [
    "apps/eog-2d-designer/definition-persistence.ts",
    "apps/eog-2d-designer/legacy-definition-migration.ts"
  ];
  const contents = await Promise.all(files.map(path => readFile(path, "utf8")));
  assert.equal(
    contents.some(content => content.includes("../../manager/enterprise-operating-graph-")),
    false
  );
  assert.equal(
    contents.every(content => content.includes("./enterprise-operating-graph-model.js")),
    true
  );
});
