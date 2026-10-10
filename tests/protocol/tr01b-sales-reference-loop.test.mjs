import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { createCounterpartyRepositoryV010 } from "../../dist/apps/counterparty/repository.js";
import { createCounterpartyRoleRepositoryV010 } from "../../dist/apps/counterparty/roles.js";
import { createItemRepositoryV010 } from "../../dist/apps/item/repository.js";
import { createWarehouseRepositoryV010 } from "../../dist/apps/warehouse/repository.js";
import { createSalesReferenceServiceV010 } from "../../dist/apps/trading-reference/sales-loop.js";

const target = {
  scopeKey: "evo-runtime-a",
  salesApplicationId: "sales_order",
  productionApplicationId: "production_completion",
  shipmentApplicationId: "inventory_movement",
  cashReceiptApplicationId: "cash_receipt"
};
const selection = {
  contextId: "enterprise:test-a",
  customerCounterpartyId: "cp-customer-1",
  itemId: "item-1",
  warehouseId: "wh-1"
};
const common = {
  target, selection,
  orderNo: "SO-001",
  effectiveAt: "2026-10-10T01:00:00.000Z",
  correlationId: "TR01B:SO001",
  idempotencyKey: "tr01b:so001"
};
function setup() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const roles = createCounterpartyRoleRepositoryV010(resources, counterparties);
  const items = createItemRepositoryV010(resources);
  const warehouses = createWarehouseRepositoryV010(resources);
  counterparties.save({
    contextId: selection.contextId,
    subject: {
      contractVersion: "0.1.0",
      counterpartyId: selection.customerCounterpartyId,
      code: "CUST-1", displayName: "TR-01B Customer",
      subjectType: "ORGANIZATION", status: "ACTIVE"
    },
    actorSubjectId: "owner",
    recordedAt: "2026-10-10T00:00:00.000Z"
  });
  items.save({
    contextId: selection.contextId,
    item: {
      contractVersion: "0.1.0",
      itemId: "item-1", code: "ITEM-1",
      displayName: "TR-01B Item", itemKind: "GOODS",
      baseUomCode: "C62"
    },
    actorSubjectId: "owner", recordedAt: "2026-10-10T00:00:00.000Z"
  });
  warehouses.save({
    contextId: selection.contextId,
    warehouse: {
      contractVersion: "0.1.0", warehouseId: "wh-1",
      code: "WH-1", displayName: "TR-01B Warehouse"
    },
    actorSubjectId: "owner", recordedAt: "2026-10-10T00:00:00.000Z"
  });
  const submissions = [];
  const adapter = { async submit(value) {
    submissions.push(structuredClone(value));
    return {
      contractVersion: "0.1.0",
      businessDataId: "bd-"+submissions.length,
      businessObjectVersion: "1",
      postingInputId: "posting-"+submissions.length,
      postingSequence: String(submissions.length),
      postingStatus: "QUEUED",
      retroactive: false, replayRequired: false, idempotentReplay: false
    };
  }};
  const service = createSalesReferenceServiceV010({
    adapter, counterparties, roles, items, warehouses
  });
  return { roles, submissions, service, counterparties, items, warehouses };
}
function grant(f) {
  f.roles.assign({
    contextId: selection.contextId,
    counterpartyId: selection.customerCounterpartyId,
    roleCode: "CUSTOMER", actorSubjectId: "owner",
    recordedAt: "2026-10-10T00:00:01.000Z"
  });
}
function salesInput() {
  return { ...common, quantity: 10, unitPrice: "100.00",
    totalAmount: "1000.00", currency: "CNY" };
}

test("TR-01B1 refuses customer without CUSTOMER role before any EVO call", async () => {
  const f=setup();
  await assert.rejects(f.service.approveSalesOrder(salesInput()), /CUSTOMER_ROLE_REQUIRED/);
  assert.equal(f.submissions.length, 0);
  grant(f);
  const result=await f.service.approveSalesOrder(salesInput());
  assert.equal(result.submission.businessDataId,"bd-1");
});

test("TR-01B1 writes only immutable EVO BusinessData with linked sales production shipment receipt", async () => {
  const f=setup();grant(f);
  const order=await f.service.approveSalesOrder(salesInput());
  await f.service.completeOrderProduction({
    ...common,orderBusinessDataId:order.submission.businessDataId,
    productionNo:"PROD-1", quantity:10,totalCost:"125.00",currency:"CNY",
    idempotencyKey:"production-1"
  });
  await f.service.shipSalesOrder({
    ...common,orderBusinessDataId:order.submission.businessDataId,
    shipmentNo:"SHIP-1",quantity:10,idempotencyKey:"ship-1"
  });
  await f.service.receiveCustomerCash({
    ...common,orderBusinessDataId:order.submission.businessDataId,
    receiptNo:"CASH-1",settledAmount:"1000.00",settledCurrency:"CNY",
    cashAmount:"1000.00",cashCurrency:"CNY",idempotencyKey:"cash-1"
  });
  assert.deepEqual(f.submissions.map(s=>s.businessDataType),[
    "sales_order.approved","production.completed",
    "sales_shipment.created","cash.received"
  ]);
  assert.deepEqual(f.submissions.map(s=>s.applicationId),[
    "sales_order","production_completion","inventory_movement","cash_receipt"
  ]);
  assert.equal(f.submissions[0].payload.customer,"cp-customer-1");
  assert.equal(f.submissions[0].payload.productId,"item-1");
  assert.equal(f.submissions[0].payload.warehouse,"wh-1");
  assert.equal(f.submissions[0].payload.customerCode,"CUST-1");
  assert.equal(f.submissions[0].payload.productCode,"ITEM-1");
  assert.equal(f.submissions[0].payload.warehouseCode,"WH-1");
  assert.equal(f.submissions[0].payload.eventKind,"ORDER");
  assert.equal(f.submissions[0].payload.fulfillmentMode,"MAKE");
  assert.equal(f.submissions[1].payload.totalCost,"125.00");
  assert.equal(f.submissions[2].payload.movementType,"SHIP");
  assert.equal(f.submissions[3].payload.semanticRole,"CUSTOMER_CASH_RECEIPT");
  assert.equal(f.submissions[3].payload.settledAmount,"1000.00");
  assert.equal(f.submissions[3].payload.cashAmount,"1000.00");
  assert.deepEqual(f.submissions.slice(1).map(s=>s.relation?.relationType),[
    "FULFILLS","FULFILLS","REFERENCES"
  ]);
  assert.ok(f.submissions.slice(1).every(s=>
    s.relation?.fromBusinessDataId === order.submission.businessDataId
    && s.causationId === order.submission.businessDataId));
  assert.ok(f.submissions.every(s=>s.scopeKey==="evo-runtime-a"));
  assert.equal(f.submissions.some(s=>s.payload.bankAccountId!==undefined),false);
});

test("TR-01B1 enforces active item and Warehouse references without inventing state",async()=>{
 const f=setup();grant(f);
 for(const [k,id,pattern] of [
  ["customerCounterpartyId","missing","CUSTOMER_NOT_FOUND"],
  ["itemId","missing","ITEM_NOT_FOUND"],
  ["warehouseId","missing","WAREHOUSE_NOT_FOUND"]
 ]) {
  await assert.rejects(
   f.service.approveSalesOrder({...salesInput(),selection:{...selection,[k]:id}}),
   new RegExp(pattern)
  );
 }
 await assert.rejects(f.service.approveSalesOrder({
   ...salesInput(),quantity:-10
 }),/QUANTITY_INVALID/);
 await assert.rejects(f.service.approveSalesOrder({
   ...salesInput(),totalAmount:"-1000"
 }),/AMOUNT_INVALID/);
 await assert.rejects(f.service.receiveCustomerCash({
   ...common,orderBusinessDataId:"",receiptNo:"RC-1",
   settledAmount:"1000",settledCurrency:"CNY",
   cashAmount:"1000",cashCurrency:"CNY"
 }),/orderBusinessDataId/);
 assert.deepEqual(f.submissions,[]);
});

test("TR-01B1 does not pretend a raw BusinessData relation certifies FX allocation or Bank Account",async()=>{
 const f=setup();grant(f);
 const order=await f.service.approveSalesOrder(salesInput());
 await f.service.receiveCustomerCash({
  ...common,orderBusinessDataId:order.submission.businessDataId,
  receiptNo:"RC-1",settledAmount:"1000",settledCurrency:"USD",
  cashAmount:"7200",cashCurrency:"CNY"
 });
 assert.equal(f.submissions[1].relation.relationType,"REFERENCES");
 assert.equal(f.submissions[1].payload.settledCurrency,"USD");
 assert.equal(f.submissions[1].payload.cashCurrency,"CNY");
 assert.equal(f.submissions[1].payload.cashAmount,"7200");
 assert.equal(f.submissions[1].payload.allocationInstructionId,undefined);
 assert.equal(f.submissions[1].payload.bankAccountId,undefined);
});
