import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createTradingLiteEvoActionHandler,
  TRADING_LITE_HOST_APPLICATION_REF_ID_V010
} from "../../dist/apps/trading-lite/action-handler.js";

const request = {
  contractVersion: "0.1.0",
  type: "command",
  command: { code: "trading-lite.create-order", inputVersion: "0.1.0" },
  values: {
    customer: "ACME",
    item: "P-100",
    quantity: 3,
    amount: 300
  },
  sourceInteractionId: "trading-lite.home",
  actionId: "create-order",
  runtimeInstanceId: "run-1",
  requiresConfirmation: false
};

const context = {
  contractVersion: "0.1.0",
  principal: {
    contractVersion: "0.1.0",
    subjectId: "user:1",
    actorType: "HUMAN",
    identityProviderId: "test"
  },
  scope: { contractVersion: "0.1.0", enterpriseId: "enterprise:demo" },
  context: {
    contractVersion: "0.1.0",
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:user:1"
    },
    activeContext: {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:demo",
      enterpriseId: "enterprise:demo"
    }
  },
  correlationId: "request:1"
};

test("Trading Lite maps business fields into generic EVO BusinessData while Host supplies runtime target", async () => {
  const submissions = [];
  const targetContexts = [];
  const handler = createTradingLiteEvoActionHandler({
    adapter: {
      async submit(input) {
        submissions.push(input);
        return {
          contractVersion: "0.1.0",
          businessDataId: "bd-1",
          businessObjectVersion: "1",
          postingInputId: "pi-1",
          postingSequence: "42",
          postingStatus: "QUEUED",
          retroactive: false,
          replayRequired: false,
          idempotentReplay: false
        };
      }
    },
    resolveRuntimeTarget(inputContext) {
      targetContexts.push(inputContext);
      return {
        scopeKey: "evo-enterprise-id",
        applicationId: "sales_order"
      };
    },
    now: () => new Date("2026-10-03T10:00:00.000Z")
  });

  const result = await handler.execute(request, context);

  assert.equal(result.ok, true);
  assert.equal(result.result.orderNo, "TL-run-1");
  assert.equal(result.result.applicationId, "sales_order");
  assert.equal(result.result.businessDataId, "bd-1");
  assert.equal(targetContexts[0], context);

  assert.deepEqual(submissions[0], {
    contractVersion: "0.1.0",
    scopeKey: "evo-enterprise-id",
    applicationId: "sales_order",
    businessDataType: "sales_order.approved",
    businessObjectKey: "TL-run-1",
    effectiveAt: "2026-10-03T10:00:00.000Z",
    correlationId: "TRADING-LITE:run-1",
    idempotencyKey: "trading-lite:run-1",
    payload: {
      eventKind: "ORDER",
      orderNo: "TL-run-1",
      customer: "ACME",
      productId: "P-100",
      quantity: 3,
      unitPrice: "100.00",
      totalAmount: "300.00",
      currency: "USD",
      localCarryingAmount: "300.00",
      localCurrency: "USD",
      fulfillmentMode: "MAKE",
      project: null,
      department: null,
      profitCenter: null,
      costCenter: null
    }
  });
});

test("Trading Lite fails closed when Host runtime target cannot be resolved", async () => {
  let submissions = 0;
  const handler = createTradingLiteEvoActionHandler({
    adapter: {
      async submit() {
        submissions += 1;
        throw new Error("must not submit");
      }
    },
    resolveRuntimeTarget() {
      throw new Error("APPLICATION_RUNTIME_BINDING_PROVIDER_REQUIRED");
    }
  });

  const result = await handler.execute(request, context);

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "TRADING_LITE_EVO_SUBMISSION_FAILED");
  assert.match(result.error.message, /APPLICATION_RUNTIME_BINDING_PROVIDER_REQUIRED/);
  assert.equal(submissions, 0);
});

test("Trading Lite application handler has no direct EVO compatibility endpoint knowledge", async () => {
  const source = await readFile("apps/trading-lite/action-handler.ts", "utf8");
  assert.equal(source.includes("/api/v1/capabilities"), false);
  assert.equal(source.includes("/api/v1/commands"), false);
  assert.equal(source.includes("/api/v1/enterprises"), false);
  assert.equal(source.includes("EvoBusinessDataAdapterV010"), true);
  assert.equal(
    TRADING_LITE_HOST_APPLICATION_REF_ID_V010,
    "application:trading-lite"
  );
});
