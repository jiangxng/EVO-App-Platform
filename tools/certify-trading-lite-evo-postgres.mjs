import assert from "node:assert/strict";

import {
  createTradingLiteEvoActionHandler,
  TRADING_LITE_HOST_APPLICATION_REF_ID_V010
} from "../dist/apps/trading-lite/action-handler.js";
import {
  createEvoBusinessDataHttpAdapterV010
} from "../dist/manager/evo-business-data-http-adapter.js";
import {
  createEvoRuntimeObservationHttpAdapterV010
} from "../dist/manager/evo-runtime-observation-http-adapter.js";
import {
  createMemoryEnterpriseApplicationRuntimeBindingStoreV010
} from "../dist/providers/application-runtime-binding/store.js";
import {
  createEnterpriseApplicationRuntimeBindingProviderV010
} from "../dist/providers/application-runtime-binding/runtime.js";
import {
  EVO_LEDGER_RUNTIME_PROVIDER_ID_V010,
  toEvoLedgerRuntimeApplicationIdBindingV010
} from "../dist/contracts/evo-ledger-runtime-application-id.js";

const baseUrl = (process.env.EVO_BASE_URL ?? "http://127.0.0.1:3000")
  .replace(/\/$/u, "");
const enterpriseCode = process.env.EVO_ENTERPRISE_CODE ?? "EVO_DEMO";
const runtimeApplicationId =
  process.env.EVO_RUNTIME_APPLICATION_ID ?? "sales_order";
const amount = 137;
const quantity = 1;

async function json(response) {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      "HTTP " + response.status + ": " + JSON.stringify(body)
    );
  }
  return body;
}

async function runtimeObservation(enterpriseId, target, metricCodes) {
  return json(await fetch(baseUrl + "/api/v1/runtime-observations/query", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({
      contractVersion: "0.1.0",
      enterpriseId,
      target,
      window: {
        startAt: "2020-01-01T00:00:00.000Z",
        endAt: "2030-01-01T00:00:00.000Z"
      },
      metricCodes
    })
  }));
}

function metric(body, code) {
  const found = body.observations.find(item => item.metricCode === code);
  assert.ok(found, "missing runtime observation " + code);
  return found.value;
}

const enterprise = await json(await fetch(
  baseUrl + "/api/v1/enterprises/" + encodeURIComponent(enterpriseCode),
  { headers: { accept: "application/json" } }
));
assert.equal(enterprise.status, "ACTIVE");
assert.ok(enterprise.id);

const beforeApp = await runtimeObservation(
  enterprise.id,
  { kind: "APPLICATION_ANCHOR", applicationId: runtimeApplicationId },
  ["event.count"]
);
const beforeEventCount = metric(beforeApp, "event.count");

const bindingProvider = createEnterpriseApplicationRuntimeBindingProviderV010({
  store: createMemoryEnterpriseApplicationRuntimeBindingStoreV010(),
  now: () => new Date("2026-10-03T03:30:00.000Z")
});
const hostEnterpriseId = "enterprise:cross-project-proof";
const binding = bindingProvider.bind({
  enterpriseId: hostEnterpriseId,
  hostApplicationRefId: TRADING_LITE_HOST_APPLICATION_REF_ID_V010,
  runtimeProviderId: EVO_LEDGER_RUNTIME_PROVIDER_ID_V010,
  runtimeApplicationId
});
const runtime = toEvoLedgerRuntimeApplicationIdBindingV010(binding);
assert.equal(runtime.applicationId, runtimeApplicationId);

const adapter = createEvoBusinessDataHttpAdapterV010({ baseUrl });
const observationAdapter = createEvoRuntimeObservationHttpAdapterV010({ baseUrl });
const handler = createTradingLiteEvoActionHandler({
  adapter,
  observationAdapter,
  resolveRuntimeTarget(context) {
    assert.equal(
      context?.context?.activeContext.kind,
      "ENTERPRISE"
    );
    assert.equal(
      context?.context?.activeContext.enterpriseId,
      hostEnterpriseId
    );
    return {
      scopeKey: enterprise.id,
      enterpriseId: enterprise.id,
      applicationId: runtime.applicationId
    };
  },
  now: () => new Date("2026-10-03T03:30:00.000Z")
});

const request = {
  contractVersion: "0.1.0",
  type: "command",
  command: {
    code: "trading-lite.create-order",
    inputVersion: "0.1.0"
  },
  values: {
    customer: "Cross Project Proof",
    item: "P-100",
    quantity,
    amount
  },
  sourceInteractionId: "trading-lite.cross-project-proof",
  actionId: "create-order",
  runtimeInstanceId: "cross-project-proof-001",
  requiresConfirmation: false
};

const context = {
  contractVersion: "0.1.0",
  principal: {
    contractVersion: "0.1.0",
    subjectId: "proof-user",
    actorType: "HUMAN",
    identityProviderId: "proof.identity"
  },
  scope: {
    contractVersion: "0.1.0",
    enterpriseId: hostEnterpriseId
  },
  context: {
    contractVersion: "0.1.0",
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:proof-user"
    },
    activeContext: {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: hostEnterpriseId,
      enterpriseId: hostEnterpriseId
    }
  },
  correlationId: "proof-request"
};

const result = await handler.execute(request, context);
assert.equal(result.ok, true, JSON.stringify(result));
assert.equal(result.result.applicationId, runtimeApplicationId);
assert.equal(result.result.postingStatus, "QUEUED");
assert.ok(result.result.businessDataId);
assert.equal(result.result.runtimeObservation.status, "OBSERVED");
assert.equal(result.result.runtimeObservation.metricCode, "event.count");
assert.equal(result.result.runtimeObservation.value, 1);

let afterEventCount = beforeEventCount;
let afterReceivable = null;
let lastLedgerError = null;
for (let attempt = 0; attempt < 40; attempt += 1) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const app = await runtimeObservation(
    enterprise.id,
    { kind: "APPLICATION_ANCHOR", applicationId: runtimeApplicationId },
    ["event.count"]
  );
  afterEventCount = metric(app, "event.count");

  try {
    const ledger = await runtimeObservation(
      enterprise.id,
      { kind: "LEDGER_DEFINITION", code: "receivable" },
      ["balance.amount"]
    );
    afterReceivable = metric(ledger, "balance.amount");
    lastLedgerError = null;
  } catch (error) {
    lastLedgerError = error;
  }

  if (
    afterEventCount >= beforeEventCount + 1
    && afterReceivable !== null
    && Math.abs(afterReceivable - amount) < 0.000001
  ) {
    break;
  }
}

assert.equal(afterEventCount, beforeEventCount + 1);
assert.notEqual(
  afterReceivable,
  null,
  lastLedgerError instanceof Error
    ? lastLedgerError.message
    : "receivable runtime observation unavailable"
);
assert.ok(
  Math.abs(afterReceivable - amount) < 0.000001,
  "expected receivable balance amount " + amount
    + ", got " + afterReceivable
);

console.log(JSON.stringify({
  status: "PASS",
  proof: "APP_PLATFORM_TRADING_LITE_TO_EVO_POSTGRES_LEDGER",
  hostApplicationRefId: TRADING_LITE_HOST_APPLICATION_REF_ID_V010,
  runtimeProviderId: EVO_LEDGER_RUNTIME_PROVIDER_ID_V010,
  runtimeApplicationId,
  evoScopeKey: enterprise.id,
  businessDataId: result.result.businessDataId,
  postingInputId: result.result.postingInputId,
  eventCountDelta: afterEventCount - beforeEventCount,
  receivableBalanceAmount: afterReceivable
}, null, 2));
