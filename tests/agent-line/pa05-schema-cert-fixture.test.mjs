import test from "node:test";
import assert from "node:assert/strict";

import {
  certifyCapabilitySchemaValueV010 as certify
} from "../../certification/capability-operation-schema-fixture.mjs";
import {
  ledgerRuntimeConfiguratorPackage,
  tradingReferencePackageV010
} from "../../dist/catalog/seed.js";
import {
  describeLedgerRuntimeConfigurationV010,
  readLedgerRuntimeConfigurationSectionV010
} from "../../dist/apps/ledger-runtime-configurator/capability-operations.js";
import {
  createLedgerRuntimeConfiguratorService
} from "../../dist/apps/ledger-runtime-configurator/service.js";
import {
  createPurchaseOperationalProjectionServiceV010
} from "../../dist/apps/trading-reference/operational-projection.js";
import {
  createPurchaseOperationalReadActionHandlerV010
} from "../../dist/apps/trading-reference/operational-actions.js";

function operation(pkg, id) {
  const operations = pkg.features.flatMap(feature =>
    (feature.contributions ?? [])
      .filter(item => item.kind === "platform.capability-operation")
      .map(item => item.operation)
  );
  const found = operations.find(item => item.operationId === id);
  assert.ok(found, "Missing actual published operation: " + id);
  return found;
}

const ledgerDescribe = () => operation(
  ledgerRuntimeConfiguratorPackage,
  "ledger.runtime.configuration.describe"
);
const ledgerRead = () => operation(
  ledgerRuntimeConfiguratorPackage,
  "ledger.runtime.configuration.section.read"
);
const purchaseRead = () => operation(
  tradingReferencePackageV010,
  "trading-reference.purchase-operations.read"
);
const refs = {
  orderNo: "PO-PA05-02",
  supplierCounterpartyId: "cp-pa05",
  itemId: "item-pa05",
  warehouseId: "wh-pa05"
};
const common = {
  order_no: refs.orderNo,
  supplier: refs.supplierCounterpartyId,
  product_id: refs.itemId
};
const wh = { ...common, warehouse: refs.warehouseId };

function requestContext() {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "user-pa05",
      actorType: "HUMAN",
      identityProviderId: "test.identity"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "host-pa05",
      userId: "user-pa05"
    },
    context: {
      activeContext: {
        contractVersion: "0.1.0", kind: "ENTERPRISE",
        contextId: "enterprise-context:pa05", enterpriseId: "host-pa05"
      }
    },
    correlationId: "schema-fixture"
  };
}

async function realPurchaseOwnerResult() {
  const service = createPurchaseOperationalProjectionServiceV010({
    resolveAuthorizationProvider: () => ({
      providerId: "test.policy",
      async check(input) {
        assert.equal(input.resource.id, refs.orderNo);
        assert.equal(input.scope.enterpriseId, "host-pa05");
        return { contractVersion: "0.1.0", allowed: true,
          policyProviderId: "test.policy", reasonCodes: [] };
      }
    }),
    reader: {
      async listOpenWorkItems(enterpriseId) {
        assert.equal(enterpriseId, "evo-pa05");
        return {
          complete: true,
          items: [
            { sourceLedgerCode: "pending_purchase", workType: "RECEIVE",
              dimensions: wh, quantity: 10 },
            { sourceLedgerCode: "payable", workType: "PAY",
              dimensions: common, amount: 125 }
          ]
        };
      },
      async readLedgerBalances(enterpriseId, code, dimensions) {
        assert.equal(enterpriseId, "evo-pa05");
        return {
          complete: true,
          items: [{
            dimensions,
            quantity: code === "pending_purchase" ? 10 : 0,
            amount: code === "payable" ? 125 : 0
          }]
        };
      }
    }
  });
  const handler = createPurchaseOperationalReadActionHandlerV010({
    service,
    resolveEvoEnterpriseId() { return "evo-pa05"; }
  });
  const result = await handler.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: { code: purchaseRead().binding.commandCode,
      inputVersion: purchaseRead().binding.inputVersion },
    values: refs,
    sourceInteractionId: "schema-cert",
    actionId: "read",
    requiresConfirmation: false
  }, requestContext());
  assert.equal(result.ok, true);
  return result.result;
}

test("PA05-02 validates actual Ledger owner inputs and outputs against the published manifests", () => {
  const service = createLedgerRuntimeConfiguratorService();
  const described = describeLedgerRuntimeConfigurationV010(service);
  const page = readLedgerRuntimeConfigurationSectionV010(service, {
    section: "accounts", pageSize: 5
  });

  assert.equal(certify(ledgerDescribe().inputSchema, {}).ok, true);
  assert.equal(certify(ledgerDescribe().outputSchema, described, {
    side: "output"
  }).ok, true);
  assert.equal(certify(ledgerRead().inputSchema, {
    section: "accounts", pageSize: 5
  }).ok, true);
  assert.equal(certify(ledgerRead().outputSchema, page, {
    side: "output"
  }).ok, true);
});

test("PA05-02 certifies the actual trading Owner READ response and rejects malformed input", async () => {
  const op = purchaseRead();
  const result = await realPurchaseOwnerResult();
  assert.equal(certify(op.inputSchema, refs).ok, true);
  assert.equal(certify(op.outputSchema, result, { side: "output" }).ok, true);
  assert.equal(result.payableAmount, 125);

  for (const [invalid, code] of [
    [{ ...refs, orderNo: undefined }, "PA05_CERT_VALUE_TYPE"],
    [{ ...refs, orderNo: "" }, "PA05_CERT_VALUE_MIN_LENGTH"],
    [{ ...refs, orderNo: 123 }, "PA05_CERT_VALUE_TYPE"],
    [{ ...refs, unexpected: "leak" }, "PA05_CERT_VALUE_ADDITIONAL_PROPERTY"]
  ]) {
    const checked = certify(op.inputSchema, invalid);
    assert.equal(checked.ok, false);
    assert.ok(checked.issues.some(issue => issue.code === code),
      JSON.stringify(checked.issues));
  }
});

test("PA05-02 rejects invalid owner output rather than treating a 200/ok as schema conformance", async () => {
  const op = purchaseRead();
  const actual = await realPurchaseOwnerResult();
  const missing = structuredClone(actual);
  delete missing.payableAmount;
  assert.ok(certify(op.outputSchema, missing, {
    side: "output"
  }).issues.some(issue => issue.code === "PA05_CERT_VALUE_REQUIRED"));

  const corrupted = { ...actual, payableAmount: "125" };
  assert.ok(certify(op.outputSchema, corrupted, {
    side: "output"
  }).issues.some(issue => issue.code === "PA05_CERT_VALUE_TYPE"));
});

test("PA05-02 validates limits, enum, const, nullable values and array items without coercion", () => {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["mode", "values", "nextCursor"],
    properties: {
      mode: { const: "READ" },
      values: {
        type: "array", minItems: 1, maxItems: 2,
        items: { type: "integer", minimum: 1, maximum: 10 }
      },
      nextCursor: { type: ["string", "null"] }
    }
  };
  assert.equal(certify(schema, {
    mode: "READ", values: [1, 10], nextCursor: null
  }).ok, true);
  const bad = certify(schema, {
    mode: "WRITE", values: [0, 1.5, 11], nextCursor: 42
  });
  assert.equal(bad.ok, false);
  const codes = new Set(bad.issues.map(issue => issue.code));
  for (const code of [
    "PA05_CERT_VALUE_CONST",
    "PA05_CERT_VALUE_MINIMUM",
    "PA05_CERT_VALUE_TYPE",
    "PA05_CERT_VALUE_MAXIMUM"
  ]) assert.ok(codes.has(code), JSON.stringify(bad.issues));
});

test("PA05-02 fails closed on unsupported schema keywords, invalid schemas and depth overflow", () => {
  assert.deepEqual(
    certify({ $ref: "#/$defs/item" }, {}).issues[0],
    { code: "PA05_CERT_SCHEMA_KEYWORD_UNSUPPORTED", path: "$.input.$ref" }
  );
  assert.equal(certify({ type: "not-a-type" }, {}).ok, false);
  assert.equal(certify({ type: "object", additionalProperties: {
    type: "string"
  } }, {}).ok, false);
  assert.equal(certify(null, {}).ok, false);
  const deep = { type: "object", properties: { a: {
    type: "object", properties: { b: { type: "string" } }
  } } };
  assert.ok(certify(deep, { a: { b: "x" } }, {
    maxDepth: 1
  }).issues.some(issue => issue.code === "PA05_CERT_SCHEMA_DEPTH_EXCEEDED"));
});
