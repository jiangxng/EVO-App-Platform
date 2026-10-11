import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const targetPathFiles = [
  "apps/trading-lite/action-handler.ts",
  "manager/evo-business-data-http-adapter.ts",
  "manager/evo-runtime-observation-http-adapter.ts",
  "manager/server.ts"
];

test("current EVO write/read path does not regress to capability or Command compatibility APIs", async () => {
  const contents = await Promise.all(
    targetPathFiles.map(path => readFile(path, "utf8"))
  );
  for (const source of contents) {
    assert.equal(source.includes("/api/v1/commands"), false);
    assert.equal(source.includes("/api/v1/capabilities"), false);
    assert.equal(source.includes("/api/v1/apps"), false);
  }
});

test("enterprise-code lookup remains explicit compatibility debt until runtime-scope migration closes", async () => {
  const server = await readFile("manager/server.ts", "utf8");
  const revisionBridge = await readFile(
    "manager/evo-runtime-revision-bridge.ts",
    "utf8"
  );
  const observatory = await readFile(
    "providers/evo-runtime-observatory/runtime.ts",
    "utf8"
  );

  assert.equal(server.includes("/api/v1/enterprises/"), true);
  assert.equal(revisionBridge.includes("/api/v1/enterprises/"), true);
  assert.equal(observatory.includes("/api/v1/enterprises/"), true);
  assert.equal(server.includes("resolveCompatibilityEvoRuntimeScopeKey"), true);
});
