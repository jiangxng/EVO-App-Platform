import test from "node:test";
import assert from "node:assert/strict";
import { createAppActionRouter } from "../../dist/actions/router.js";

const request = {
  contractVersion: "0.1.0",
  type: "command",
  command: { code: "trading-lite.create-order", inputVersion: "0.1.0" },
  values: { customer: "ACME", item: "P-100", quantity: 3, amount: 300 },
  sourceInteractionId: "trading-lite.home",
  actionId: "create-order",
  runtimeInstanceId: "run-1",
  requiresConfirmation: false
};

test("action router blocks an installed handler when its Feature is not active", async () => {
  let calls = 0;
  const router = createAppActionRouter([
    {
      packageId: "trading-lite",
      featureId: "trading-lite.default",
      commandCode: "trading-lite.create-order",
      async execute() {
        calls += 1;
        return { ok: true };
      }
    }
  ], () => false);

  const result = await router.execute(request);

  assert.equal(calls, 0);
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "ACTION_FEATURE_NOT_ACTIVE");
});

test("action router delegates only after Feature activation", async () => {
  const router = createAppActionRouter([
    {
      packageId: "trading-lite",
      featureId: "trading-lite.default",
      commandCode: "trading-lite.create-order",
      async execute(input) {
        return {
          ok: true,
          correlationId: input.runtimeInstanceId,
          result: { accepted: true }
        };
      }
    }
  ], featureId => featureId === "trading-lite.default");

  const result = await router.execute(request);

  assert.equal(result.ok, true);
  assert.equal(result.correlationId, "run-1");
  assert.deepEqual(result.result, { accepted: true });
});
