import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  toEvoLedgerRuntimeApplicationIdBindingV010
} from "../../dist/contracts/evo-ledger-runtime-application-id.js";

test("resolved runtimeApplicationId is the exact EVO applicationId", () => {
  const binding = {
    contractVersion: "0.1.0",
    bindingId: "binding:trading-lite:evo",
    enterpriseId: "enterprise:demo",
    hostApplicationRefId: "application:trading-lite",
    runtimeProviderId: "evo-ledger-runtime",
    runtimeKind: "EVO_APPLICATION_ANCHOR",
    runtimeApplicationId: "trading-lite",
    createdAt: "2026-10-02T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z"
  };

  const result = toEvoLedgerRuntimeApplicationIdBindingV010(binding);
  assert.equal(result.applicationId, binding.runtimeApplicationId);
  assert.equal(result.applicationId, "trading-lite");
  assert.equal(result.enterpriseId, binding.enterpriseId);
  assert.equal(result.sourceBindingId, binding.bindingId);
  assert.equal(result.runtimeProviderId, binding.runtimeProviderId);
});

test("EVO bridge rejects a non-EVO runtime discriminator", () => {
  const binding = {
    contractVersion: "0.1.0",
    bindingId: "binding:x",
    enterpriseId: "enterprise:demo",
    hostApplicationRefId: "application:x",
    runtimeProviderId: "other-runtime",
    runtimeKind: "OTHER_RUNTIME",
    runtimeApplicationId: "x",
    createdAt: "2026-10-02T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z"
  };

  assert.throws(
    () => toEvoLedgerRuntimeApplicationIdBindingV010(binding),
    /EVO_APPLICATION_RUNTIME_KIND_REQUIRED/
  );
});

test("cross-project proof forbids identity remapping language", async () => {
  const source = await readFile(
    "contracts/evo-ledger-runtime-application-id.ts",
    "utf8"
  );
  assert.equal(source.includes("applicationId: binding.runtimeApplicationId"), true);
});
