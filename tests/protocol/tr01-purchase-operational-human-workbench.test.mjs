import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assertValidUidl } from "../../dist/vendor/eidos/src/runtime/validate.js";
import {
  createPurchaseOperationalLookupPageV010,
  createPurchaseOperationalPositionPageV010,
  parsePurchaseOperationalDetailRouteV010,
  purchaseOperationalDetailRouteV010
} from "../../dist/apps/trading-reference/operational-page.js";
import {
  createPurchaseOperationalReadActionHandlerV010,
  createPurchaseOperationalEntryActionHandlerV010
} from "../../dist/apps/trading-reference/operational-actions.js";
import { tradingReferencePackageV010 } from "../../dist/apps/trading-reference/package.js";
import {
  PURCHASE_OPERATIONS_READ_COMMAND_V010,
  PURCHASE_OPERATIONS_ENTRY_OPEN_COMMAND_V010,
  PURCHASE_OPERATIONS_ENTRY_OPEN_OPERATION_V010,
  PURCHASE_OPERATIONS_LOOKUP_ROUTE_V010,
  PURCHASE_OPERATIONS_LOOKUP_PAGE_SOURCE_V010,
  PURCHASE_OPERATIONS_DETAIL_PAGE_SOURCE_V010
} from "../../dist/apps/trading-reference/constants.js";
import { composeWorkbenchHomeV010 } from "../../dist/apps/bi-workbench/composition.js";

const refs = {
  orderNo: "PO 1 / 2026",
  supplierCounterpartyId: "supplier-1",
  itemId: "item-1",
  warehouseId: "warehouse-1"
};

const positions = {
  contractVersion: "0.1.0",
  projectionId: "trading-reference.purchase-operations",
  enterpriseId: "evo-tenant-a",
  orderNo: refs.orderNo,
  references: {
    supplierCounterpartyId: refs.supplierCounterpartyId,
    itemId: refs.itemId,
    warehouseId: refs.warehouseId
  },
  pendingPurchaseQuantity: 10,
  inventoryPosition: { quantity: 0, amount: 0 },
  payableAmount: 125,
  openWork: {
    receive: { quantity: 10 },
    pay: { amount: 125 }
  }
};

function ctx(actorType = "HUMAN") {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      actorType, subjectId: "owner-a",
      identityProviderId: "fixture", sessionId: "session-a"
    },
    scope: { contractVersion: "0.1.0", enterpriseId: "host-a", userId: "owner-a" },
    context: {
      activeContext: {
        contractVersion: "0.1.0", kind: "ENTERPRISE",
        contextId: "enterprise-context:host-a", enterpriseId: "host-a"
      }
    },
    correlationId: "tr01-human-agent-workbench"
  };
}

function command(code, values = {}) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code, inputVersion: "0.1.0" },
    values, sourceInteractionId: "lookup-form",
    actionId: "submit", requiresConfirmation: false
  };
}

test("TR-01A5 Eidos lookup renders valid localized Human command form, not a mutation", () => {
  const en = createPurchaseOperationalLookupPageV010("en");
  const zh = createPurchaseOperationalLookupPageV010("zh-CN");
  assertValidUidl(en);
  assertValidUidl(zh);
  assert.equal(en.command.code, PURCHASE_OPERATIONS_READ_COMMAND_V010);
  assert.deepEqual(en.fields.map(item => item.key), [
    "orderNo", "supplierCounterpartyId", "itemId", "warehouseId"
  ]);
  assert.ok(en.fields.every(f => f.required && f.control === "text"));
  assert.equal(en.actions[0].type, "submit");
  assert.equal(en.actions[0].requiresConfirmation, false);
  assert.match(zh.title, /采购/);
});

test("TR-01A5 detail route is bounded, encoded and rejects unrelated or duplicate URL keys", () => {
  const route = purchaseOperationalDetailRouteV010(refs);
  assert.equal(route.startsWith("/trading-reference/purchase-position?"), true);
  assert.deepEqual(parsePurchaseOperationalDetailRouteV010(route), refs);
  assert.equal(parsePurchaseOperationalDetailRouteV010(
    route + "&enterpriseId=forged"
  ), undefined);
  assert.equal(parsePurchaseOperationalDetailRouteV010(
    route + "&orderNo=attacker"
  ), undefined);
  assert.equal(parsePurchaseOperationalDetailRouteV010(
    "/trading-reference/purchase-position"
  ), undefined);
  assert.equal(parsePurchaseOperationalDetailRouteV010(
    "/warehouses/detail?warehouseId=1"
  ), undefined);
  assert.equal(parsePurchaseOperationalDetailRouteV010(
    "https://attacker.test/trading-reference/purchase-position"
  ), undefined);
  assert.throws(() => purchaseOperationalDetailRouteV010({
    ...refs, itemId: ""
  }), /ROUTE_REFERENCE_INVALID/);
});

test("TR-01A5 Human position page represents derived RECEIVE, inventory cost and PAY clearly", () => {
  const en = createPurchaseOperationalPositionPageV010(positions, "en");
  const zh = createPurchaseOperationalPositionPageV010(positions, "zh-CN");
  assert.equal(en.kind, "catalog-browser");
  assert.equal(en.items.length, 3);
  assert.equal(en.items[0].status.label, "Open");
  assert.equal(en.items[2].status.label, "Open");
  assert.equal(en.items[1].metadata["Inventory quantity"], 0);
  assert.equal(en.items[1].metadata["Inventory cost amount"], 0);
  assert.equal(en.items[2].metadata["Payable amount"], 125);
  assert.ok(zh.title.includes("采购"));
  assert.deepEqual(en.actions.map(a => a.type), ["navigate"]);
  assert.equal(en.items.some(x => x.primaryAction?.type === "command"), false);
  const received = createPurchaseOperationalPositionPageV010({
    ...positions,
    pendingPurchaseQuantity: 0,
    inventoryPosition: { quantity: 10, amount: 125 },
    openWork: { receive: null, pay: { amount: 125 } }
  });
  assert.equal(received.items[0].status.label, "Closed");
  assert.equal(received.items[2].status.label, "Open");
  assert.equal(received.items[1].metadata["Inventory quantity"], 10);
  assert.equal(received.items[1].metadata["Inventory cost amount"], 125);
});

test("TR-01A5 Human/AI execute the same action and Human receives internal detail route", async () => {
  const checks = [];
  const h = createPurchaseOperationalReadActionHandlerV010({
    service: {
      read: async r => {
        checks.push(r);
        return structuredClone(positions);
      }
    },
    resolveEvoEnterpriseId: () => "evo-tenant-a"
  });
  const results = await Promise.all([
    h.execute(command(PURCHASE_OPERATIONS_READ_COMMAND_V010, refs), ctx("HUMAN")),
    h.execute(command(PURCHASE_OPERATIONS_READ_COMMAND_V010, refs), ctx("AI"))
  ]);
  assert.deepEqual(results[0].result, results[1].result);
  assert.equal(results[0].ok, true);
  assert.equal(results[0].result.navigateTo, purchaseOperationalDetailRouteV010(refs));
  assert.equal(checks[0].requestContext.principal.actorType, "HUMAN");
  assert.equal(checks[1].requestContext.principal.actorType, "AI");
  assert.equal(checks[0].enterpriseId, "evo-tenant-a");
});

test("TR-01A5 Workbench entry is optional and permission-filtered, never a static nav", async () => {
  const f = tradingReferencePackageV010.features[0];
  const work = f.contributions.find(c => c.kind === "eidos.workbench-home-item").item;
  const manifest = f.contributions.find(c => c.kind === "eidos.experience").manifest;
  const entry = f.contributions.filter(c => c.kind === "platform.capability-operation")
    .find(c => c.operation.operationId === PURCHASE_OPERATIONS_ENTRY_OPEN_OPERATION_V010)
    .operation;
  assert.deepEqual(manifest.navigation, []);
  assert.equal(manifest.pages.some(x => x.source === PURCHASE_OPERATIONS_LOOKUP_PAGE_SOURCE_V010), true);
  assert.equal(manifest.pages.some(x => x.source === PURCHASE_OPERATIONS_DETAIL_PAGE_SOURCE_V010), true);
  assert.equal(entry.authorization.resource.idSource, "DATA_SCOPE");
  assert.equal(work.capabilityOperationId, entry.operationId);
  assert.equal(work.route, PURCHASE_OPERATIONS_LOOKUP_ROUTE_V010);
  const input = {
    packageItems: [{ ...work, packageId: tradingReferencePackageV010.packageId, featureId: f.featureId }]
  };
  assert.equal(composeWorkbenchHomeV010({
    ...input, authorizedCapabilityOperationIds: new Set()
  }).items.length, 0);
  const allowed = composeWorkbenchHomeV010({
    ...input, authorizedCapabilityOperationIds: new Set([entry.operationId])
  });
  assert.equal(allowed.items.length, 1);
  assert.equal(allowed.items[0].section, "OPERATIONAL_PROJECTIONS");
});

test("TR-01A5 entry command only navigates and refuses missing Enterprise Context", async () => {
  const handler = createPurchaseOperationalEntryActionHandlerV010();
  const action = command(PURCHASE_OPERATIONS_ENTRY_OPEN_COMMAND_V010);
  const okay = await handler.execute(action, ctx());
  assert.equal(okay.ok, true);
  assert.deepEqual(okay.result, { navigateTo: PURCHASE_OPERATIONS_LOOKUP_ROUTE_V010 });
  assert.equal((await handler.execute(action)).ok, false);
  const crossed = ctx();
  crossed.scope.enterpriseId = "host-b";
  assert.equal((await handler.execute(action, crossed)).ok, false);
});

test("TR-01A5 production Host routes only through the same Action Host authorization", async () => {
  const source = await readFile("manager/server.ts", "utf8");
  const begin = source.indexOf(
    "source === PURCHASE_OPERATIONS_LOOKUP_PAGE_SOURCE_V010"
  );
  assert.ok(begin > 0);
  const block = source.slice(begin, begin + 5300);
  assert.match(block, /source === PURCHASE_OPERATIONS_DETAIL_PAGE_SOURCE_V010/);
  assert.match(block, /actionRouter\.execute\(/);
  assert.match(block, /PURCHASE_OPERATIONS_ENTRY_OPEN_COMMAND_V010/);
  assert.match(block, /PURCHASE_OPERATIONS_READ_COMMAND_V010/);
  assert.doesNotMatch(block, /fetch\(/);
  assert.doesNotMatch(block, /resolveCompatibilityEvoRuntimeScopeKey/);
  assert.match(block, /PAGE_NOT_EFFECTIVE_OR_NOT_FOUND/);
});
