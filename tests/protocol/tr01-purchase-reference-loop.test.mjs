import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createCounterpartyRepositoryV010
} from "../../dist/apps/counterparty/repository.js";
import {
  createCounterpartyRoleRepositoryV010
} from "../../dist/apps/counterparty/roles.js";
import {
  createItemRepositoryV010
} from "../../dist/apps/item/repository.js";
import {
  createWarehouseRepositoryV010
} from "../../dist/apps/warehouse/repository.js";
import {
  createPurchaseReferenceServiceV010
} from "../../dist/apps/trading-reference/purchase-loop.js";

function setup() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const roles = createCounterpartyRoleRepositoryV010(
    resources,
    counterparties
  );
  const items = createItemRepositoryV010(resources);
  const warehouses = createWarehouseRepositoryV010(resources);
  const contextId = "enterprise-context:tr01";

  counterparties.save({
    contextId,
    subject: {
      contractVersion: "0.1.0",
      counterpartyId: "cp-supplier-1",
      code: "SUP-001",
      displayName: "Reference Supplier",
      subjectType: "ORGANIZATION",
      status: "ACTIVE"
    },
    actorSubjectId: "owner",
    recordedAt: "2026-10-10T00:00:00.000Z"
  });
  items.save({
    contextId,
    item: {
      contractVersion: "0.1.0",
      itemId: "item-1",
      code: "ITEM-001",
      displayName: "Reference Item",
      itemKind: "GOODS",
      baseUomCode: "C62"
    },
    actorSubjectId: "owner",
    recordedAt: "2026-10-10T00:00:00.000Z"
  });
  warehouses.save({
    contextId,
    warehouse: {
      contractVersion: "0.1.0",
      warehouseId: "warehouse-1",
      code: "WH-001",
      displayName: "Reference Warehouse"
    },
    actorSubjectId: "owner",
    recordedAt: "2026-10-10T00:00:00.000Z"
  });

  const submissions = [];
  const adapter = {
    async submit(input) {
      submissions.push(structuredClone(input));
      const index = submissions.length;
      return {
        contractVersion: "0.1.0",
        businessDataId: "bd-" + index,
        businessObjectVersion: "1",
        postingInputId: "posting-" + index,
        postingSequence: String(index),
        postingStatus: "QUEUED",
        retroactive: false,
        replayRequired: false,
        idempotentReplay: false
      };
    }
  };

  const service = createPurchaseReferenceServiceV010({
    adapter,
    counterparties,
    roles,
    items,
    warehouses
  });

  return {
    contextId,
    counterparties,
    roles,
    items,
    warehouses,
    submissions,
    service
  };
}

const target = {
  scopeKey: "runtime-scope",
  purchaseApplicationId: "purchase_order",
  receiptApplicationId: "inventory_movement"
};

function selection(contextId) {
  return {
    contextId,
    supplierCounterpartyId: "cp-supplier-1",
    itemId: "item-1",
    warehouseId: "warehouse-1"
  };
}

test("TR-01A requires an active SUPPLIER role before Purchase Order submission", async () => {
  const state = setup();

  await assert.rejects(
    state.service.approvePurchaseOrder({
      target,
      selection: selection(state.contextId),
      orderNo: "PO-001",
      quantity: 10,
      unitPrice: "12.50",
      totalAmount: "125.00",
      currency: "CNY",
      effectiveAt: "2026-10-10T01:00:00.000Z",
      correlationId: "TR01:PO-001",
      idempotencyKey: "tr01:po:001"
    }),
    /TRADING_REFERENCE_SUPPLIER_ROLE_REQUIRED/
  );
  assert.equal(state.submissions.length, 0);
});

test("TR-01A submits stable master-data references and explicit FULFILLS receipt lineage", async () => {
  const state = setup();
  state.roles.assign({
    contextId: state.contextId,
    counterpartyId: "cp-supplier-1",
    roleCode: "SUPPLIER",
    actorSubjectId: "owner",
    recordedAt: "2026-10-10T00:01:00.000Z"
  });

  const purchase = await state.service.approvePurchaseOrder({
    target,
    selection: selection(state.contextId),
    orderNo: "PO-001",
    quantity: 10,
    unitPrice: "12.50",
    totalAmount: "125.00",
    currency: "CNY",
    effectiveAt: "2026-10-10T01:00:00.000Z",
    correlationId: "TR01:PO-001",
    idempotencyKey: "tr01:po:001"
  });
  assert.equal(purchase.submission.businessDataId, "bd-1");

  const receipt = await state.service.receivePurchaseOrder({
    target,
    selection: selection(state.contextId),
    purchaseBusinessDataId: purchase.submission.businessDataId,
    orderNo: "PO-001",
    receiptNo: "GR-001",
    quantity: 10,
    totalCost: "125.00",
    currency: "CNY",
    effectiveAt: "2026-10-10T02:00:00.000Z",
    correlationId: "TR01:GR-001",
    idempotencyKey: "tr01:gr:001"
  });
  assert.equal(receipt.submission.businessDataId, "bd-2");

  const [purchaseInput, receiptInput] = state.submissions;
  assert.equal(purchaseInput.applicationId, "purchase_order");
  assert.equal(purchaseInput.businessDataType, "purchase_order.approved");
  assert.equal(purchaseInput.payload.supplier, "cp-supplier-1");
  assert.equal(purchaseInput.payload.productId, "item-1");
  assert.equal(purchaseInput.payload.warehouse, "warehouse-1");
  assert.equal(purchaseInput.payload.supplierCode, "SUP-001");
  assert.equal(purchaseInput.payload.productCode, "ITEM-001");
  assert.equal(purchaseInput.payload.warehouseCode, "WH-001");

  assert.equal(receiptInput.applicationId, "inventory_movement");
  assert.equal(receiptInput.businessDataType, "goods_receipt.received");
  assert.equal(receiptInput.causationId, "bd-1");
  assert.deepEqual(receiptInput.relation, {
    fromBusinessDataId: "bd-1",
    relationType: "FULFILLS"
  });
  assert.equal(receiptInput.payload.movementType, "PURCHASE_RECEIPT");
  assert.equal(receiptInput.payload.supplier, "cp-supplier-1");
  assert.equal(receiptInput.payload.productId, "item-1");
  assert.equal(receiptInput.payload.warehouse, "warehouse-1");

  for (const input of state.submissions) {
    assert.equal("counterparty" in input.payload, false);
    assert.equal("item" in input.payload, false);
    assert.equal("warehouseSubject" in input.payload, false);
    assert.equal("inventoryQuantity" in input.payload, false);
    assert.equal("payableBalance" in input.payload, false);
  }
});

test("TR-01A fails before EVO submission when Item or Warehouse authority is absent", async () => {
  const state = setup();
  state.roles.assign({
    contextId: state.contextId,
    counterpartyId: "cp-supplier-1",
    roleCode: "SUPPLIER",
    actorSubjectId: "owner",
    recordedAt: "2026-10-10T00:01:00.000Z"
  });

  await assert.rejects(
    state.service.approvePurchaseOrder({
      target,
      selection: {
        ...selection(state.contextId),
        itemId: "missing-item"
      },
      orderNo: "PO-MISSING-ITEM",
      quantity: 1,
      unitPrice: "1.00",
      totalAmount: "1.00",
      currency: "CNY",
      effectiveAt: "2026-10-10T01:00:00.000Z",
      correlationId: "TR01:PO-MISSING-ITEM",
      idempotencyKey: "tr01:po:missing-item"
    }),
    /TRADING_REFERENCE_ITEM_NOT_FOUND/
  );

  await assert.rejects(
    state.service.approvePurchaseOrder({
      target,
      selection: {
        ...selection(state.contextId),
        warehouseId: "missing-warehouse"
      },
      orderNo: "PO-MISSING-WH",
      quantity: 1,
      unitPrice: "1.00",
      totalAmount: "1.00",
      currency: "CNY",
      effectiveAt: "2026-10-10T01:00:00.000Z",
      correlationId: "TR01:PO-MISSING-WH",
      idempotencyKey: "tr01:po:missing-wh"
    }),
    /TRADING_REFERENCE_WAREHOUSE_NOT_FOUND/
  );

  assert.equal(state.submissions.length, 0);
});

test("TR-01A2 appends receipt reversal with exact REVERSES lineage, preserving earlier facts", async () => {
  const state = setup();
  state.roles.assign({
    contextId: state.contextId,
    counterpartyId: "cp-supplier-1",
    roleCode: "SUPPLIER",
    actorSubjectId: "owner",
    recordedAt: "2026-10-10T00:01:00.000Z"
  });
  const purchase = await state.service.approvePurchaseOrder({
    target, selection: selection(state.contextId),
    orderNo: "PO-A2-001", quantity: 10,
    unitPrice: "12.50", totalAmount: "125.00", currency: "CNY",
    effectiveAt: "2026-10-10T01:00:00Z",
    correlationId: "a2-order", idempotencyKey: "a2-order"
  });
  const receipt = await state.service.receivePurchaseOrder({
    target, selection: selection(state.contextId),
    purchaseBusinessDataId: purchase.submission.businessDataId,
    orderNo: "PO-A2-001", receiptNo: "GR-A2-001",
    quantity: 10, totalCost: "125.00", currency: "CNY",
    effectiveAt: "2026-10-10T02:00:00Z",
    correlationId: "a2-receipt", idempotencyKey: "a2-receipt"
  });
  const originals = structuredClone(state.submissions);
  const reversal = await state.service.reversePurchaseReceipt({
    target, selection: selection(state.contextId),
    receiptBusinessDataId: receipt.submission.businessDataId,
    orderNo: "PO-A2-001", originalReceiptNo: "GR-A2-001",
    reversalNo: "GRR-A2-001", quantity: 10, totalCost: "125.00",
    currency: "CNY", effectiveAt: "2026-10-10T03:00:00Z",
    correlationId: "a2-reversal", idempotencyKey: "a2-reversal"
  });
  assert.equal(reversal.submission.businessDataId, "bd-3");
  assert.deepEqual(state.submissions.slice(0, 2), originals,
    "reversal must not edit historical PO/Receipt requests");
  const fact = state.submissions[2];
  assert.equal(fact.applicationId, "inventory_movement");
  assert.equal(fact.businessDataType, "goods_receipt.reversed");
  assert.equal(fact.businessObjectKey, "GRR-A2-001");
  assert.equal(fact.causationId, receipt.submission.businessDataId);
  assert.deepEqual(fact.relation, {
    fromBusinessDataId: receipt.submission.businessDataId,
    relationType: "REVERSES"
  });
  assert.equal(fact.payload.movementType, "PURCHASE_RECEIPT_REVERSAL");
  assert.equal(fact.payload.originalReceiptNo, "GR-A2-001");
  assert.equal(fact.payload.orderNo, "PO-A2-001");
  assert.equal(fact.payload.supplier, "cp-supplier-1");
  assert.equal(fact.payload.productId, "item-1");
  assert.equal(fact.payload.warehouse, "warehouse-1");
  assert.equal(fact.payload.quantity, 10);
  assert.equal(fact.payload.totalCost, "125.00");
  assert.equal("payableBalance" in fact.payload, false);
  assert.equal("inventoryQuantity" in fact.payload, false);
});

test("TR-01A2 fails closed before submission on missing lineage, reused fact key or negative cost", async () => {
  const state = setup();
  state.roles.assign({
    contextId: state.contextId,
    counterpartyId: "cp-supplier-1",
    roleCode: "SUPPLIER",
    actorSubjectId: "owner",
    recordedAt: "2026-10-10T00:01:00.000Z"
  });
  const valid = {
    target, selection: selection(state.contextId),
    receiptBusinessDataId: "bd-original-receipt",
    orderNo: "PO-A2", originalReceiptNo: "GR-A2",
    reversalNo: "GRR-A2", quantity: 10, totalCost: "125.00",
    currency: "CNY", effectiveAt: "2026-10-10T03:00:00Z",
    correlationId: "a2", idempotencyKey: "a2"
  };
  await assert.rejects(
    state.service.reversePurchaseReceipt({...valid, receiptBusinessDataId: ""}),
    /TRADING_REFERENCE_RECEIPT_BUSINESS_DATA_REQUIRED/
  );
  await assert.rejects(
    state.service.reversePurchaseReceipt({...valid, reversalNo: "GR-A2"}),
    /TRADING_REFERENCE_REVERSAL_REQUIRES_NEW_FACT_KEY/
  );
  await assert.rejects(
    state.service.reversePurchaseReceipt({...valid, totalCost: "-125.00"}),
    /TRADING_REFERENCE_REVERSAL_COST_NEGATIVE/
  );
  await assert.rejects(
    state.service.reversePurchaseReceipt({...valid, quantity: -10}),
    /TRADING_REFERENCE_QUANTITY_INVALID/
  );
  assert.equal(state.submissions.length, 0);
});
