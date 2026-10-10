import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createPurchaseOperationalReadActionHandlerV010
} from "../../dist/apps/trading-reference/operational-actions.js";
import {
  createPurchaseOperationalProjectionServiceV010
} from "../../dist/apps/trading-reference/operational-projection.js";
import {
  createPurchaseOperationalEvoHttpReaderV010
} from "../../dist/apps/trading-reference/operational-http-reader.js";
import {
  tradingReferencePackageV010
} from "../../dist/apps/trading-reference/package.js";
import {
  PURCHASE_OPERATIONS_READ_COMMAND_V010,
  PURCHASE_OPERATIONS_READ_OPERATION_V010,
  TRADING_REFERENCE_FEATURE_ID_V010,
  TRADING_REFERENCE_PACKAGE_ID_V010
} from "../../dist/apps/trading-reference/constants.js";
import {
  tradingReferencePackageV010 as catalogPackage
} from "../../dist/catalog/seed.js";

const dimensions = {
  order_no: "PO-1", supplier: "cp-1", product_id: "item-1"
};
const withWarehouse = { ...dimensions, warehouse: "wh-1" };

function context() {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0", subjectId: "human-1",
      actorType: "HUMAN",
      identityProviderId: "test.identity", sessionId: "session-1"
    },
    scope: {
      contractVersion: "0.1.0", enterpriseId: "host-a", userId: "human-1"
    },
    context: {
      activeContext: {
        contractVersion: "0.1.0", kind: "ENTERPRISE",
        contextId: "enterprise-context:a", enterpriseId: "host-a"
      }
    },
    correlationId: "tr01a4-read"
  };
}

function request() {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: PURCHASE_OPERATIONS_READ_COMMAND_V010,
      inputVersion: "0.1.0"
    },
    values: {
      orderNo: "PO-1", supplierCounterpartyId: "cp-1",
      itemId: "item-1", warehouseId: "wh-1"
    },
    sourceInteractionId: "demo-1",
    actionId: "read-position",
    requiresConfirmation: false
  };
}

function serviceFixture() {
  const reads = [];
  const authorizations = [];
  const reader = {
    async listOpenWorkItems(enterpriseId) {
      reads.push(["work", enterpriseId]);
      return { complete: true, items: [
        {
          sourceLedgerCode: "pending_purchase", workType: "RECEIVE",
          dimensions: withWarehouse, quantity: 10
        },
        {
          sourceLedgerCode: "payable", workType: "PAY",
          dimensions, amount: 125
        }
      ] };
    },
    async readLedgerBalances(enterpriseId, code, scope) {
      reads.push([code, enterpriseId, scope]);
      return { complete: true, items: [
        code === "pending_purchase"
          ? { dimensions: withWarehouse, quantity: 10, amount: 0 }
          : code === "inventory"
            ? { dimensions: withWarehouse, quantity: 0, amount: 0 }
            : { dimensions, quantity: 0, amount: 125 }
      ] };
    }
  };
  const service = createPurchaseOperationalProjectionServiceV010({
    reader,
    resolveAuthorizationProvider: () => ({
      providerId: "test",
      check: async input => {
        authorizations.push(input);
        return {
          contractVersion: "0.1.0", allowed: true,
          policyProviderId: "test", reasonCodes: []
        };
      }
    })
  });
  return { service, reads, authorizations };
}

test("TR-01A4 registers lifecycle-gated READ operation for same Human/Agent contract", () => {
  assert.equal(catalogPackage, tradingReferencePackageV010);
  assert.equal(tradingReferencePackageV010.packageId, TRADING_REFERENCE_PACKAGE_ID_V010);
  const feature = tradingReferencePackageV010.features[0];
  assert.equal(feature.featureId, TRADING_REFERENCE_FEATURE_ID_V010);
  const op = feature.contributions.find(x => x.kind === "platform.capability-operation").operation;
  assert.equal(op.operationId, PURCHASE_OPERATIONS_READ_OPERATION_V010);
  assert.equal(op.binding.type, "ACTION_HOST");
  assert.equal(op.binding.commandCode, PURCHASE_OPERATIONS_READ_COMMAND_V010);
  assert.deepEqual(op.exposure, ["HUMAN", "PERSONAL_AGENT", "AUTOMATION"]);
  assert.equal(op.effect, "READ");
  assert.equal(op.authorization.resource.idSource, "INPUT");
  assert.equal(op.authorization.resource.inputKey, "orderNo");
  assert.equal(feature.contributions.some(x => x.kind === "eidos.experience"), false);
  assert.equal(feature.contributions.some(x => x.kind === "eidos.workbench-home-item"), false);
});

test("TR-01A4 explicit Host->EVO mapping supplies one governed read path", async () => {
  const f = serviceFixture();
  const handler = createPurchaseOperationalReadActionHandlerV010({
    service: f.service,
    resolveEvoEnterpriseId(ctx) {
      assert.equal(ctx.scope.enterpriseId, "host-a");
      return "evo-runtime-a";
    }
  });
  assert.equal(handler.packageId, TRADING_REFERENCE_PACKAGE_ID_V010);
  const result = await handler.execute(request(), context());
  assert.equal(result.ok, true);
  assert.equal(result.result.enterpriseId, "evo-runtime-a");
  assert.deepEqual(result.result.openWork, {
    receive: { quantity: 10 }, pay: { amount: 125 }
  });
  assert.deepEqual(result.result.inventoryPosition, { quantity: 0, amount: 0 });
  assert.equal(f.reads.length, 4);
  assert.ok(f.reads.every(row => row[1] === "evo-runtime-a"));
  assert.equal(f.authorizations.length, 1);
  assert.equal(f.authorizations[0].scope.enterpriseId, "host-a");
});

test("TR-01A4 fails closed before any derived Work/Position fetch for missing map", async () => {
  const f = serviceFixture();
  const action = createPurchaseOperationalReadActionHandlerV010({
    service: f.service,
    resolveEvoEnterpriseId() {
      throw new Error("TR01_OPERATIONAL_EVO_SCOPE_BINDING_REQUIRED");
    }
  });
  const blocked = await action.execute(request(), context());
  assert.equal(blocked.ok, false);
  assert.equal(blocked.error.code, "TR01_OPERATIONAL_EVO_SCOPE_BINDING_REQUIRED");
  assert.deepEqual(f.reads, []);
  assert.deepEqual(f.authorizations, []);
});

test("TR-01A4 disallows unselected context, invalid references, and mapped scope confusion", async () => {
  const f = serviceFixture();
  let resolved = 0;
  const action = createPurchaseOperationalReadActionHandlerV010({
    service: f.service,
    resolveEvoEnterpriseId() {
      resolved += 1;
      return "evo-runtime-a";
    }
  });
  const noContext = await action.execute(request());
  assert.equal(noContext.ok, false);
  const invalid = request();
  delete invalid.values.orderNo;
  assert.equal((await action.execute(invalid, context())).ok, false);
  const mismatched = context();
  mismatched.scope.enterpriseId = "host-b";
  const rejection = await action.execute(request(), mismatched);
  assert.equal(rejection.ok, false);
  assert.match(rejection.error.code, /CONTEXT_MISMATCH/);
  assert.deepEqual(f.reads, []);
  assert.equal(resolved, 1);
});

test("TR-01A4 EVO adapter only calls public dimension-scoped, tenant-filtered endpoints", async () => {
  const urls = [];
  const adapter = createPurchaseOperationalEvoHttpReaderV010({
    baseUrl: "http://evo.test/",
    fetchImpl: async url => {
      urls.push(String(url));
      return {
        ok: true,
        json: async () => ({ items: [{
          dimensions: withWarehouse, quantity: "10", amount: "125.00"
        }] })
      };
    }
  });
  assert.equal((await adapter.listOpenWorkItems("evo-a")).complete, true);
  assert.equal((await adapter.readLedgerBalances(
    "evo-a", "inventory", withWarehouse
  )).complete, true);
  assert.equal(urls.length, 2);
  assert.match(urls[0], /^http:\/\/evo\.test\/api\/v1\/work-items\?/);
  assert.ok(urls[0].includes("enterprise_id=evo-a"));
  assert.match(urls[1], /\/api\/v1\/ledgers\/inventory\/balances\?/);
  assert.ok(urls[1].includes("dimension\.warehouse=wh-1"));
  assert.ok(urls[1].includes("dimension\.product_id=item-1"));
});

test("TR-01A4 EVO adapter marks capped/nextCursor pages incomplete", async () => {
  const large = createPurchaseOperationalEvoHttpReaderV010({
    baseUrl: "http://evo.test",
    fetchImpl: async () => ({
      ok: true, json: async () => ({
        items: Array.from({ length: 100 }, () => ({}))
      })
    })
  });
  assert.equal((await large.listOpenWorkItems("evo-a")).complete, false);
  const next = createPurchaseOperationalEvoHttpReaderV010({
    baseUrl: "http://evo.test",
    fetchImpl: async () => ({
      ok: true, json: async () => ({ items: [], nextCursor: "cursor" })
    })
  });
  assert.equal((await next.listOpenWorkItems("evo-a")).complete, false);
});

test("TR-01A4 Host lazy registration cannot fall back to global demo enterprise", async () => {
  const source = await readFile("manager/server.ts", "utf8");
  const start = source.indexOf("packageId: TRADING_REFERENCE_PACKAGE_ID_V010,");
  assert.ok(start > 0);
  const scoped = source.slice(start, start + 2200);
  assert.ok(scoped.includes("evoRuntimeScopeMap.get(active.enterpriseId)"));
  assert.ok(scoped.includes("TR01_OPERATIONAL_EVO_SCOPE_BINDING_REQUIRED"));
  assert.equal(scoped.includes("resolveCompatibilityEvoRuntimeScopeKey"), false);
  assert.equal(scoped.includes("resolveTradingLiteEvoRuntimeTarget"), false);
});
