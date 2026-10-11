import type {
  EvoBusinessDataAdapterV010,
  EvoBusinessDataSubmissionResultV010,
  EvoBusinessDataSubmissionV010
} from "../../contracts/evo-business-data.js";
import type {
  CounterpartyRepositoryV010, CounterpartySubjectV010
} from "../counterparty/repository.js";
import type { CounterpartyRoleRepositoryV010 } from "../counterparty/roles.js";
import type { ItemRepositoryV010, ItemSubjectV010 } from "../item/repository.js";
import type {
  WarehouseRepositoryV010, WarehouseSubjectV010
} from "../warehouse/repository.js";

/**
 * TR-01B1: application-owned inverse trading reference, not a new sales ERP.
 * All effects are EVO posting rules; no App Platform ledger, Work or cash writes.
 */
export const TRADING_REFERENCE_SALES_HOST_APPLICATION_REF_ID_V010 =
  "application:trading-reference.sales-order" as const;
export const TRADING_REFERENCE_PRODUCTION_HOST_APPLICATION_REF_ID_V010 =
  "application:trading-reference.production-completion" as const;
export const TRADING_REFERENCE_SHIPMENT_HOST_APPLICATION_REF_ID_V010 =
  "application:trading-reference.sales-shipment" as const;
export const TRADING_REFERENCE_CUSTOMER_RECEIPT_HOST_APPLICATION_REF_ID_V010 =
  "application:trading-reference.customer-cash-receipt" as const;

export interface SalesReferenceSelectionV010 {
  contextId: string;
  customerCounterpartyId: string;
  itemId: string;
  warehouseId: string;
}
export interface SalesReferenceRuntimeTargetV010 {
  scopeKey: string;
  salesApplicationId: string;
  productionApplicationId: string;
  shipmentApplicationId: string;
  cashReceiptApplicationId: string;
}
export interface ResolvedSalesReferencesV010 {
  customer: CounterpartySubjectV010;
  item: ItemSubjectV010;
  warehouse: WarehouseSubjectV010;
}
type Common = {
  target: SalesReferenceRuntimeTargetV010;
  selection: SalesReferenceSelectionV010;
  orderNo: string;
  effectiveAt: string;
  correlationId: string;
  idempotencyKey: string;
};
type Outcome = {
  references: ResolvedSalesReferencesV010;
  submission: EvoBusinessDataSubmissionResultV010;
};
export interface SalesReferenceServiceV010 {
  resolveReferences(selection: SalesReferenceSelectionV010): ResolvedSalesReferencesV010;
  approveSalesOrder(input: Common & {
    quantity: number;
    unitPrice: string;
    totalAmount: string;
    currency: string;
    /** For a separately governed FX receivable Position definition. Must be supplied as a pair. */
    localCarryingAmount?: string;
    localCurrency?: string;
  }): Promise<Outcome>;
  completeOrderProduction(input: Common & {
    orderBusinessDataId: string;
    productionNo: string;
    quantity: number;
    totalCost: string;
    currency: string;
  }): Promise<Outcome>;
  shipSalesOrder(input: Common & {
    orderBusinessDataId: string;
    shipmentNo: string;
    quantity: number;
  }): Promise<Outcome>;
  receiveCustomerCash(input: Common & {
    orderBusinessDataId: string;
    receiptNo: string;
    settledAmount: string;
    settledCurrency: string;
    cashAmount: string;
    cashCurrency: string;
  }): Promise<Outcome>;
}
function required(v: string, name: string): string {
  if (typeof v !== "string" || !v.trim()) {
    throw new Error("TR01B_REFERENCE_REQUIRED:" + name);
  }
  return v.trim();
}
function positive(v: number, field: string): number {
  if (!Number.isFinite(v) || v <= 0) {
    throw new Error("TR01B_QUANTITY_INVALID:" + field);
  }
  return v;
}
function money(v: string, field: string, allowZero = false): string {
  const n = required(v, field);
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(n)
    || (allowZero ? Number(n) < 0 : Number(n) <= 0)
    || !Number.isFinite(Number(n))) {
    throw new Error("TR01B_AMOUNT_INVALID:" + field);
  }
  return n;
}
function at(v: string): string {
  const n = required(v, "effectiveAt");
  if (Number.isNaN(Date.parse(n))) {
    throw new Error("TR01B_EFFECTIVE_AT_INVALID");
  }
  return new Date(n).toISOString();
}
function parentId(id: string): string {
  return required(id, "orderBusinessDataId");
}

export function createSalesReferenceServiceV010(input: {
  adapter: EvoBusinessDataAdapterV010;
  counterparties: CounterpartyRepositoryV010;
  roles: CounterpartyRoleRepositoryV010;
  items: ItemRepositoryV010;
  warehouses: WarehouseRepositoryV010;
}): SalesReferenceServiceV010 {
  function resolveReferences(selection: SalesReferenceSelectionV010): ResolvedSalesReferencesV010 {
    const contextId = required(selection.contextId, "contextId");
    const customerId = required(selection.customerCounterpartyId, "customerCounterpartyId");
    const itemId = required(selection.itemId, "itemId");
    const warehouseId = required(selection.warehouseId, "warehouseId");
    const customer = input.counterparties.get(contextId, customerId);
    if (!customer) throw new Error("TR01B_CUSTOMER_NOT_FOUND");
    if (!input.roles.has(contextId, customerId, "CUSTOMER")) {
      throw new Error("TR01B_CUSTOMER_ROLE_REQUIRED");
    }
    const item = input.items.get(contextId, itemId);
    if (!item) throw new Error("TR01B_ITEM_NOT_FOUND");
    const warehouse = input.warehouses.get(contextId, warehouseId);
    if (!warehouse) throw new Error("TR01B_WAREHOUSE_NOT_FOUND");
    return { customer, item, warehouse };
  }
  function refs(r: ResolvedSalesReferencesV010) {
    return {
      customer: r.customer.counterpartyId,
      customerCode: r.customer.code,
      customerDisplayName: r.customer.displayName,
      productId: r.item.itemId,
      productCode: r.item.code,
      productDisplayName: r.item.displayName,
      warehouse: r.warehouse.warehouseId,
      warehouseCode: r.warehouse.code,
      warehouseDisplayName: r.warehouse.displayName
    };
  }
  function shared(i: Common) {
    const orderNo = required(i.orderNo, "orderNo");
    return {
      orderNo,
      scopeKey: required(i.target.scopeKey, "scopeKey"),
      effectiveAt: at(i.effectiveAt),
      correlationId: required(i.correlationId, "correlationId"),
      idempotencyKey: required(i.idempotencyKey, "idempotencyKey")
    };
  }
  async function submit(
    s: ReturnType<typeof shared>, applicationId: string,
    businessDataType: string, businessObjectKey: string,
    payload: EvoBusinessDataSubmissionV010["payload"],
    relation?: EvoBusinessDataSubmissionV010["relation"]
  ) {
    return input.adapter.submit({
      contractVersion: "0.1.0",
      scopeKey: s.scopeKey,
      applicationId: required(applicationId, "applicationId"),
      businessDataType,
      businessObjectKey: required(businessObjectKey, "businessObjectKey"),
      effectiveAt: s.effectiveAt,
      correlationId: s.correlationId,
      idempotencyKey: s.idempotencyKey,
      ...(relation ? {
        relation,
        causationId: relation.fromBusinessDataId
      } : {}),
      payload
    });
  }
  function commonDimensions() {
    return {
      project: null, department: null,
      profitCenter: null, costCenter: null
    };
  }
  return {
    resolveReferences,
    async approveSalesOrder(i) {
      const s = shared(i), r = resolveReferences(i.selection);
      if ((i.localCarryingAmount === undefined) !== (i.localCurrency === undefined)) {
        throw new Error("TR01B_LOCAL_CARRYING_PAIR_REQUIRED");
      }
      const carrying: Record<string, string> = i.localCarryingAmount === undefined
        ? {}
        : {
          localCarryingAmount: money(i.localCarryingAmount, "localCarryingAmount"),
          localCurrency: required(i.localCurrency!, "localCurrency")
        };
      // A same-currency receivable may not declare a synthetic revaluation.
      if (i.currency === i.localCurrency &&
          i.localCarryingAmount !== undefined &&
          Number(i.localCarryingAmount) !== Number(i.totalAmount)) {
        throw new Error("TR01B_LOCAL_CARRYING_SAME_CURRENCY_MISMATCH");
      }
      const submission = await submit(
        s, i.target.salesApplicationId, "sales_order.approved", s.orderNo,
        {
          eventKind: "ORDER", orderNo: s.orderNo,
          ...refs(r),
          quantity: positive(i.quantity, "quantity"),
          unitPrice: money(i.unitPrice, "unitPrice"),
          totalAmount: money(i.totalAmount, "totalAmount"),
          currency: required(i.currency, "currency"),
          ...carrying,
          fulfillmentMode: "MAKE",
          ...commonDimensions()
        }
      );
      return { references: r, submission };
    },
    async completeOrderProduction(i) {
      const s = shared(i), r = resolveReferences(i.selection);
      const submission = await submit(
        s, i.target.productionApplicationId, "production.completed",
        required(i.productionNo, "productionNo"),
        {
          orderNo: s.orderNo, ...refs(r),
          quantity: positive(i.quantity, "quantity"),
          totalCost: money(i.totalCost, "totalCost", true),
          currency: required(i.currency, "currency"),
          ...commonDimensions()
        },
        { fromBusinessDataId: parentId(i.orderBusinessDataId), relationType: "FULFILLS" }
      );
      return { references: r, submission };
    },
    async shipSalesOrder(i) {
      const s = shared(i), r = resolveReferences(i.selection);
      const submission = await submit(
        s, i.target.shipmentApplicationId, "sales_shipment.created",
        required(i.shipmentNo, "shipmentNo"),
        {
          movementType: "SHIP", shipmentNo: i.shipmentNo,
          orderNo: s.orderNo, ...refs(r),
          quantity: positive(i.quantity, "quantity"),
          ...commonDimensions()
        },
        { fromBusinessDataId: parentId(i.orderBusinessDataId), relationType: "FULFILLS" }
      );
      return { references: r, submission };
    },
    async receiveCustomerCash(i) {
      const s = shared(i), r = resolveReferences(i.selection);
      const submission = await submit(
        s, i.target.cashReceiptApplicationId, "cash.received",
        required(i.receiptNo, "receiptNo"),
        {
          semanticRole: "CUSTOMER_CASH_RECEIPT",
          receiptNo: i.receiptNo,
          orderNo: s.orderNo,
          customer: r.customer.counterpartyId,
          customerCode: r.customer.code,
          customerDisplayName: r.customer.displayName,
          settledAmount: money(i.settledAmount, "settledAmount"),
          settledCurrency: required(i.settledCurrency, "settledCurrency"),
          cashAmount: money(i.cashAmount, "cashAmount"),
          cashCurrency: required(i.cashCurrency, "cashCurrency"),
          ...commonDimensions()
        },
        // Explicit historical relation is not AllocationInstruction/Relation.
        // This bounded same-order full-settlement reference must not claim
        // to certify partial payment, bank account or FX allocation semantics.
        { fromBusinessDataId: parentId(i.orderBusinessDataId), relationType: "REFERENCES" }
      );
      return { references: r, submission };
    }
  };
}
