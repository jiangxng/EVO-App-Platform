import assert from "node:assert/strict";

import {
  createEvoBusinessDataHttpAdapterV010
} from "../dist/manager/evo-business-data-http-adapter.js";
import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../dist/providers/enterprise-context/resources.js";
import {
  createCounterpartyRepositoryV010
} from "../dist/apps/counterparty/repository.js";
import {
  createCounterpartyRoleRepositoryV010
} from "../dist/apps/counterparty/roles.js";
import {
  createItemRepositoryV010
} from "../dist/apps/item/repository.js";
import {
  createWarehouseRepositoryV010
} from "../dist/apps/warehouse/repository.js";
import {
  createPurchaseReferenceServiceV010,
  TRADING_REFERENCE_PURCHASE_HOST_APPLICATION_REF_ID_V010,
  TRADING_REFERENCE_RECEIPT_HOST_APPLICATION_REF_ID_V010
} from "../dist/apps/trading-reference/purchase-loop.js";
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

async function json(response) {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      "HTTP " + response.status + ": " + JSON.stringify(body)
    );
  }
  return body;
}

function metric(body, code) {
  const found = body.observations?.find(item => item.metricCode === code);
  assert.ok(found, "missing runtime observation metric " + code);
  return Number(found.value);
}

async function applicationEventCount(enterpriseId, applicationId) {
  const body = await json(await fetch(
    baseUrl + "/api/v1/runtime-observations/query",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({
        contractVersion: "0.1.0",
        enterpriseId,
        target: {
          kind: "APPLICATION_ANCHOR",
          applicationId
        },
        window: {
          startAt: "2020-01-01T00:00:00.000Z",
          endAt: "2030-01-01T00:00:00.000Z"
        },
        metricCodes: ["event.count"]
      })
    }
  ));
  return metric(body, "event.count");
}

async function ledgerBalances(
  enterpriseId,
  ledgerCode,
  dimensions
) {
  const params = new URLSearchParams({
    enterprise_id: enterpriseId,
    limit: "100"
  });
  for (const [key, value] of Object.entries(dimensions)) {
    params.set("dimension." + key, String(value));
  }
  return json(await fetch(
    baseUrl
      + "/api/v1/ledgers/"
      + encodeURIComponent(ledgerCode)
      + "/balances?"
      + params.toString(),
    { headers: { accept: "application/json" } }
  ));
}

async function waitForBalance(
  enterpriseId,
  ledgerCode,
  dimensions,
  predicate,
  label
) {
  let last;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const body = await ledgerBalances(enterpriseId, ledgerCode, dimensions);
    if (body.items.length === 1 && predicate(body.items[0])) {
      return body.items[0];
    }
    last = body;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(label + ": " + JSON.stringify(last));
}

async function openWorkItems(enterpriseId) {
  return json(await fetch(
    baseUrl
      + "/api/v1/work-items?enterprise_id="
      + encodeURIComponent(enterpriseId)
      + "&limit=100",
    { headers: { accept: "application/json" } }
  ));
}

function orderWork(body, orderNo, ledgerCode) {
  return body.items.find(item =>
    item.sourceLedgerCode === ledgerCode
    && item.dimensions?.order_no === orderNo
  );
}

async function waitForOrderWork(
  enterpriseId,
  orderNo,
  predicate,
  label
) {
  let last;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    last = await openWorkItems(enterpriseId);
    if (predicate(last)) return last;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(label + ": " + JSON.stringify(last));
}

async function waitForApplicationEvents(
  enterpriseId,
  applicationId,
  expected,
  label
) {
  let last;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    last = await applicationEventCount(enterpriseId, applicationId);
    if (last >= expected) return last;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(label + ": " + String(last));
}

const enterprise = await json(await fetch(
  baseUrl + "/api/v1/enterprises/" + encodeURIComponent(enterpriseCode),
  { headers: { accept: "application/json" } }
));
assert.equal(enterprise.status, "ACTIVE");
assert.ok(enterprise.id);

const hostEnterpriseId = "enterprise-context:tr01-cross-project";
const bindingProvider = createEnterpriseApplicationRuntimeBindingProviderV010({
  store: createMemoryEnterpriseApplicationRuntimeBindingStoreV010(),
  now: () => new Date("2026-10-10T01:00:00.000Z")
});
const purchaseBinding = toEvoLedgerRuntimeApplicationIdBindingV010(
  bindingProvider.bind({
    enterpriseId: hostEnterpriseId,
    hostApplicationRefId: TRADING_REFERENCE_PURCHASE_HOST_APPLICATION_REF_ID_V010,
    runtimeProviderId: EVO_LEDGER_RUNTIME_PROVIDER_ID_V010,
    runtimeApplicationId: "purchase_order"
  })
);
const receiptBinding = toEvoLedgerRuntimeApplicationIdBindingV010(
  bindingProvider.bind({
    enterpriseId: hostEnterpriseId,
    hostApplicationRefId: TRADING_REFERENCE_RECEIPT_HOST_APPLICATION_REF_ID_V010,
    runtimeProviderId: EVO_LEDGER_RUNTIME_PROVIDER_ID_V010,
    runtimeApplicationId: "inventory_movement"
  })
);

const resources = createMemoryEnterpriseResourceRepositoryV010();
const counterparties = createCounterpartyRepositoryV010(resources);
const roles = createCounterpartyRoleRepositoryV010(resources, counterparties);
const items = createItemRepositoryV010(resources);
const warehouses = createWarehouseRepositoryV010(resources);

counterparties.save({
  contextId: hostEnterpriseId,
  subject: {
    contractVersion: "0.1.0",
    counterpartyId: "cp-tr01-supplier",
    code: "SUP-TR01",
    displayName: "TR-01 Supplier",
    subjectType: "ORGANIZATION",
    status: "ACTIVE"
  },
  actorSubjectId: "proof-owner",
  recordedAt: "2026-10-10T01:00:00.000Z"
});
roles.assign({
  contextId: hostEnterpriseId,
  counterpartyId: "cp-tr01-supplier",
  roleCode: "SUPPLIER",
  actorSubjectId: "proof-owner",
  recordedAt: "2026-10-10T01:00:01.000Z"
});
items.save({
  contextId: hostEnterpriseId,
  item: {
    contractVersion: "0.1.0",
    itemId: "item-tr01",
    code: "ITEM-TR01",
    displayName: "TR-01 Item",
    itemKind: "GOODS",
    baseUomCode: "C62"
  },
  actorSubjectId: "proof-owner",
  recordedAt: "2026-10-10T01:00:02.000Z"
});
warehouses.save({
  contextId: hostEnterpriseId,
  warehouse: {
    contractVersion: "0.1.0",
    warehouseId: "warehouse-tr01",
    code: "WH-TR01",
    displayName: "TR-01 Warehouse"
  },
  actorSubjectId: "proof-owner",
  recordedAt: "2026-10-10T01:00:03.000Z"
});

const service = createPurchaseReferenceServiceV010({
  adapter: createEvoBusinessDataHttpAdapterV010({ baseUrl }),
  counterparties,
  roles,
  items,
  warehouses
});
const target = {
  scopeKey: enterprise.id,
  purchaseApplicationId: purchaseBinding.applicationId,
  receiptApplicationId: receiptBinding.applicationId
};
const selection = {
  contextId: hostEnterpriseId,
  supplierCounterpartyId: "cp-tr01-supplier",
  itemId: "item-tr01",
  warehouseId: "warehouse-tr01"
};
const quantity = 10;
const amount = 125;
const beforePurchaseEvents = await applicationEventCount(
  enterprise.id,
  purchaseBinding.applicationId
);
const beforeReceiptEvents = await applicationEventCount(
  enterprise.id,
  receiptBinding.applicationId
);

const purchase = await service.approvePurchaseOrder({
  target,
  selection,
  orderNo: "TR01-PO-001",
  quantity,
  unitPrice: "12.50",
  totalAmount: "125.00",
  currency: "CNY",
  effectiveAt: "2026-10-10T01:10:00.000Z",
  correlationId: "TR01:PO:001",
  idempotencyKey: "tr01:po:001"
});
assert.equal(purchase.submission.postingStatus, "QUEUED");

await waitForApplicationEvents(
  enterprise.id,
  purchaseBinding.applicationId,
  beforePurchaseEvents + 1,
  "purchase BusinessData event was not observed"
);
const pendingAfterPurchase = await waitForBalance(
  enterprise.id,
  "pending_purchase",
  {
    order_no: "TR01-PO-001",
    supplier: "cp-tr01-supplier",
    product_id: "item-tr01",
    warehouse: "warehouse-tr01"
  },
  item => Math.abs(Number(item.quantity) - quantity) < 0.000001,
  "purchase pending quantity was not observed"
);
const payableAfterPurchase = await waitForBalance(
  enterprise.id,
  "payable",
  {
    order_no: "TR01-PO-001",
    supplier: "cp-tr01-supplier",
    product_id: "item-tr01"
  },
  item => Math.abs(Number(item.amount) - amount) < 0.000001,
  "purchase payable amount was not observed"
);
const purchaseWork = await waitForOrderWork(
  enterprise.id,
  "TR01-PO-001",
  body => {
    const receive = orderWork(
      body,
      "TR01-PO-001",
      "pending_purchase"
    );
    const pay = orderWork(body, "TR01-PO-001", "payable");
    return receive?.workType === "RECEIVE"
      && Math.abs(Number(receive.quantity) - quantity) < 0.000001
      && pay?.workType === "PAY"
      && Math.abs(Number(pay.amount) - amount) < 0.000001;
  },
  "purchase RECEIVE/PAY work was not observed"
);
const receiveWork = orderWork(
  purchaseWork,
  "TR01-PO-001",
  "pending_purchase"
);
const payWorkBeforeReceipt = orderWork(
  purchaseWork,
  "TR01-PO-001",
  "payable"
);
assert.ok(receiveWork);
assert.ok(payWorkBeforeReceipt);
assert.equal(receiveWork.workType, "RECEIVE");
assert.ok(Math.abs(Number(receiveWork.quantity) - quantity) < 0.000001);
assert.equal(payWorkBeforeReceipt.workType, "PAY");
assert.ok(Math.abs(Number(payWorkBeforeReceipt.amount) - amount) < 0.000001);

const receipt = await service.receivePurchaseOrder({
  target,
  selection,
  purchaseBusinessDataId: purchase.submission.businessDataId,
  orderNo: "TR01-PO-001",
  receiptNo: "TR01-GR-001",
  quantity,
  totalCost: "125.00",
  currency: "CNY",
  effectiveAt: "2026-10-10T01:20:00.000Z",
  correlationId: "TR01:GR:001",
  idempotencyKey: "tr01:gr:001"
});
assert.equal(receipt.submission.postingStatus, "QUEUED");

await waitForApplicationEvents(
  enterprise.id,
  receiptBinding.applicationId,
  beforeReceiptEvents + 1,
  "receipt BusinessData event was not observed"
);
const inventoryAfterReceipt = await waitForBalance(
  enterprise.id,
  "inventory",
  {
    order_no: "TR01-PO-001",
    supplier: "cp-tr01-supplier",
    product_id: "item-tr01",
    warehouse: "warehouse-tr01"
  },
  item =>
    Math.abs(Number(item.quantity) - quantity) < 0.000001
    && Math.abs(Number(item.amount) - amount) < 0.000001,
  "receipt inventory position was not observed"
);
const pendingAfterReceipt = await waitForBalance(
  enterprise.id,
  "pending_purchase",
  {
    order_no: "TR01-PO-001",
    supplier: "cp-tr01-supplier",
    product_id: "item-tr01",
    warehouse: "warehouse-tr01"
  },
  item => Math.abs(Number(item.quantity)) < 0.000001,
  "receipt did not close pending purchase"
);
const payableAfterReceipt = await waitForBalance(
  enterprise.id,
  "payable",
  {
    order_no: "TR01-PO-001",
    supplier: "cp-tr01-supplier",
    product_id: "item-tr01"
  },
  item => Math.abs(Number(item.amount) - amount) < 0.000001,
  "receipt must leave payable open"
);
const workAfterReceipt = await waitForOrderWork(
  enterprise.id,
  "TR01-PO-001",
  body =>
    orderWork(body, "TR01-PO-001", "pending_purchase") === undefined
    && orderWork(body, "TR01-PO-001", "payable")?.workType === "PAY",
  "receipt work closure was not observed"
);
assert.equal(
  orderWork(workAfterReceipt, "TR01-PO-001", "pending_purchase"),
  undefined,
  "full receipt must close RECEIVE work"
);
const payWorkAfterReceipt = orderWork(
  workAfterReceipt,
  "TR01-PO-001",
  "payable"
);
assert.ok(payWorkAfterReceipt);
assert.equal(payWorkAfterReceipt.workType, "PAY");
assert.ok(Math.abs(Number(payWorkAfterReceipt.amount) - amount) < 0.000001);

const reversal = await service.reversePurchaseReceipt({
  target,
  selection,
  receiptBusinessDataId: receipt.submission.businessDataId,
  originalReceiptNo: "TR01-GR-001",
  reversalNo: "TR01-GRR-001",
  orderNo: "TR01-PO-001",
  quantity,
  totalCost: "125.00",
  currency: "CNY",
  effectiveAt: "2026-10-10T01:30:00.000Z",
  correlationId: "TR01:GRR:001",
  idempotencyKey: "tr01:grr:001"
});
assert.equal(reversal.submission.postingStatus, "QUEUED");
assert.notEqual(
  reversal.submission.businessDataId,
  receipt.submission.businessDataId,
  "receipt must be reversed by a separate immutable fact"
);
assert.notEqual(
  reversal.submission.businessDataId,
  purchase.submission.businessDataId
);

await waitForApplicationEvents(
  enterprise.id,
  receiptBinding.applicationId,
  beforeReceiptEvents + 2,
  "receipt reversal BusinessData event was not observed"
);
const pendingAfterReversal = await waitForBalance(
  enterprise.id,
  "pending_purchase",
  {
    order_no: "TR01-PO-001",
    supplier: "cp-tr01-supplier",
    product_id: "item-tr01",
    warehouse: "warehouse-tr01"
  },
  item => Math.abs(Number(item.quantity) - quantity) < 0.000001,
  "receipt reversal did not reopen pending purchase"
);
const inventoryAfterReversal = await waitForBalance(
  enterprise.id,
  "inventory",
  {
    order_no: "TR01-PO-001",
    supplier: "cp-tr01-supplier",
    product_id: "item-tr01",
    warehouse: "warehouse-tr01"
  },
  item =>
    Math.abs(Number(item.quantity)) < 0.000001
    && Math.abs(Number(item.amount)) < 0.000001,
  "receipt reversal did not remove original inventory quantity and cost"
);
const payableAfterReversal = await waitForBalance(
  enterprise.id,
  "payable",
  {
    order_no: "TR01-PO-001",
    supplier: "cp-tr01-supplier",
    product_id: "item-tr01"
  },
  item => Math.abs(Number(item.amount) - amount) < 0.000001,
  "receipt reversal must preserve Purchase Order payable"
);
const workAfterReversal = await waitForOrderWork(
  enterprise.id,
  "TR01-PO-001",
  body => {
    const receive = orderWork(body, "TR01-PO-001", "pending_purchase");
    const pay = orderWork(body, "TR01-PO-001", "payable");
    return receive?.workType === "RECEIVE"
      && Math.abs(Number(receive.quantity) - quantity) < 0.000001
      && pay?.workType === "PAY"
      && Math.abs(Number(pay.amount) - amount) < 0.000001;
  },
  "receipt reversal did not reopen RECEIVE while preserving PAY"
);
assert.ok(orderWork(workAfterReversal, "TR01-PO-001", "pending_purchase"));
assert.ok(orderWork(workAfterReversal, "TR01-PO-001", "payable"));

console.log(JSON.stringify({
  status: "PASS",
  proof: "TR01A2_APP_PLATFORM_TO_EVO_PURCHASE_RECEIPT_REVERSAL",
  evoScopeKey: enterprise.id,
  purchaseApplicationId: purchaseBinding.applicationId,
  receiptApplicationId: receiptBinding.applicationId,
  references: {
    supplierCounterpartyId: selection.supplierCounterpartyId,
    itemId: selection.itemId,
    warehouseId: selection.warehouseId
  },
  purchaseBusinessDataId: purchase.submission.businessDataId,
  receiptBusinessDataId: receipt.submission.businessDataId,
  reversalBusinessDataId: reversal.submission.businessDataId,
  explicitRelation: "FULFILLS_AND_REVERSES",
  evidence: {
    purchaseEventDelta: 1,
    receiptEventDelta: 2,
    receiveWorkQuantityBeforeReceipt: Number(receiveWork.quantity),
    receiveWorkClosedAfterReceipt: true,
    ledgerCertification: "EVO_PUBLIC_DIMENSION_FILTERED_LEDGER_BALANCE",
    pendingPurchaseQuantityBeforeReceipt: Number(pendingAfterPurchase.quantity),
    pendingPurchaseQuantityAfterReceipt: Number(pendingAfterReceipt.quantity),
    payableAmountAfterPurchase: Number(payableAfterPurchase.amount),
    payableAmountAfterReceipt: Number(payableAfterReceipt.amount),
    inventoryQuantityAfterReceipt: Number(inventoryAfterReceipt.quantity),
    inventoryAmountAfterReceipt: Number(inventoryAfterReceipt.amount),
    inventoryDimensions: inventoryAfterReceipt.dimensions,
    pendingPurchaseQuantityAfterReversal: Number(pendingAfterReversal.quantity),
    inventoryQuantityAfterReversal: Number(inventoryAfterReversal.quantity),
    inventoryAmountAfterReversal: Number(inventoryAfterReversal.amount),
    payableAmountAfterReversal: Number(payableAfterReversal.amount),
    aggregateRuntimeObservationAvoided: true
  },
  work: {
    receiveClosed: true,
    payStillOpen: true,
    receiveReopenedAfterReversal: true,
    payStillOpenAfterReversal: true
  }
}, null, 2));
