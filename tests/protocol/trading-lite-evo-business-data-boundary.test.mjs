import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Trading Lite declares Application Runtime Binding as a package dependency", async () => {
  const source = await readFile("catalog/seed.ts", "utf8");
  const start = source.indexOf('packageId: "trading-lite"');
  const end = source.indexOf("export const companyNotesExperienceAssets", start);
  const manifest = source.slice(start, end);
  assert.equal(
    manifest.includes('"enterprise.application-runtime-binding"'),
    true
  );
});

test("Host composition resolves Trading Lite target through binding provider and generic EVO adapter", async () => {
  const source = await readFile("manager/server.ts", "utf8");
  assert.equal(source.includes("createEvoBusinessDataHttpAdapterV010"), true);
  assert.equal(source.includes("createEvoRuntimeObservationHttpAdapterV010"), true);
  assert.equal(source.includes("resolveTradingLiteEvoRuntimeTarget"), true);
  assert.equal(
    source.includes("TRADING_LITE_HOST_APPLICATION_REF_ID_V010"),
    true
  );
  assert.equal(source.includes("EVO_LEDGER_RUNTIME_PROVIDER_ID_V010"), true);
  assert.equal(
    source.includes("runtimeApplicationId: tradingLiteEvoApplicationId"),
    true
  );
  assert.equal(
    source.includes("observationAdapter: evoRuntimeObservationAdapter"),
    true
  );
});
