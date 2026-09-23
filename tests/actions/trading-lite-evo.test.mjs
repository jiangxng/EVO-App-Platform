import test from "node:test";
import assert from "node:assert/strict";
import { createTradingLiteEvoActionHandler } from "../../dist/apps/trading-lite/action-handler.js";

test("Trading Lite maps its simple form to EVO public capability discovery and command invocation", async () => {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const target = String(url);
    calls.push({ target, init });

    if (target.endsWith("/api/v1/enterprises/EVO_DEMO")) {
      return new Response(JSON.stringify({
        id: "ent-1",
        code: "EVO_DEMO",
        status: "ACTIVE"
      }), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (target.includes("/api/v1/capabilities?enterprise_id=ent-1")) {
      return new Response(JSON.stringify({
        enterpriseId: "ent-1",
        source: "COMMAND_DEFINITION_BOOTSTRAP",
        capabilitySetVersion: "sha256:test",
        capabilities: [
          { code: "sales_order.approve-sales-order", kind: "COMMAND" }
        ]
      }), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (target.endsWith("/api/v1/commands")) {
      return new Response(JSON.stringify({
        capabilityCode: "sales_order.approve-sales-order",
        command: {
          commandExecutionId: "cmd-1",
          businessDataId: "bd-1",
          postingInputId: "pi-1",
          postingSequence: "1",
          postingStatus: "QUEUED"
        }
      }), { status: 200, headers: { "content-type": "application/json" } });
    }

    throw new Error(`unexpected URL: ${target}`);
  };

  const handler = createTradingLiteEvoActionHandler({
    baseUrl: "http://evo.test/",
    fetchImpl,
    now: () => new Date("2026-09-23T10:00:00.000Z")
  });

  const result = await handler.execute({
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
  });

  assert.equal(result.ok, true);
  assert.equal(result.result.orderNo, "TL-run-1");
  assert.equal(result.result.businessDataId, "bd-1");

  const commandCall = calls.find(call => call.target.endsWith("/api/v1/commands"));
  const body = JSON.parse(commandCall.init.body);
  assert.deepEqual(body, {
    enterpriseId: "ent-1",
    capabilityCode: "sales_order.approve-sales-order",
    actor: { type: "HUMAN", id: "demo-user" },
    idempotencyKey: "trading-lite:run-1",
    correlationId: "TRADING-LITE:run-1",
    effectiveAt: "2026-09-23T10:00:00.000Z",
    businessObjectKey: "TL-run-1",
    input: {
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

test("Trading Lite fails before command invocation when required EVO capability is absent", async () => {
  let commandCalls = 0;
  const fetchImpl = async (url) => {
    const target = String(url);
    if (target.endsWith("/api/v1/enterprises/EVO_DEMO")) {
      return new Response(JSON.stringify({
        id: "ent-1",
        code: "EVO_DEMO",
        status: "ACTIVE"
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (target.includes("/api/v1/capabilities")) {
      return new Response(JSON.stringify({ capabilities: [] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
    commandCalls += 1;
    throw new Error("command must not execute");
  };

  const handler = createTradingLiteEvoActionHandler({
    baseUrl: "http://evo.test",
    fetchImpl
  });

  const result = await handler.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: { code: "trading-lite.create-order", inputVersion: "0.1.0" },
    values: { customer: "ACME", item: "P-100", quantity: 3, amount: 300 },
    sourceInteractionId: "trading-lite.home",
    actionId: "create-order",
    runtimeInstanceId: "run-2",
    requiresConfirmation: false
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "EVO_CAPABILITY_NOT_AVAILABLE");
  assert.equal(commandCalls, 0);
});
