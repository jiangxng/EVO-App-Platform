import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("cross-project Trading Lite certification pins an exact certified EVO commit", async () => {
  const source = await readFile(
    ".github/workflows/cross-project-evo-business-data.yml",
    "utf8"
  );
  assert.match(source, /EVO_CERTIFIED_COMMIT: [0-9a-f]{40}/);
  assert.equal(source.includes("repository: jiangxng/EVO"), true);
  assert.equal(source.includes("EVO_CERTIFIED_COMMIT"), true);
  assert.equal(source.includes("postgres:18"), true);
  assert.equal(
    source.includes("tools/certify-trading-lite-evo-postgres.mjs"),
    true
  );
});

test("cross-project certification uses public EVO transport and observation APIs only", async () => {
  const source = await readFile(
    "tools/certify-trading-lite-evo-postgres.mjs",
    "utf8"
  );
  assert.equal(source.includes("createEvoBusinessDataHttpAdapterV010"), true);
  assert.equal(source.includes("/api/v1/runtime-observations/query"), true);
  assert.equal(source.includes("../evo/"), false);
  assert.equal(source.includes("node_modules/"), false);
});
