import type {
  EvoBusinessDataAdapterV010,
  EvoBusinessDataSubmissionResultV010
} from "../../contracts/evo-business-data.js";
import type {
  CounterpartyRepositoryV010,
  CounterpartySubjectV010
} from "../counterparty/repository.js";
import type {
  CounterpartyRoleRepositoryV010
} from "../counterparty/roles.js";
import type {
  ItemRepositoryV010,
  ItemSubjectV010
} from "../item/repository.js";
import type {
  WarehouseRepositoryV010,
  WarehouseSubjectV010
} from "../warehouse/repository.js";

export const TRADING_REFERENCE_PURCHASE_HOST_APPLICATION_REF_ID_V010 =
  "application:trading-reference.purchase-order" as const;
export const TRADING_REFERENCE_RECEIPT_HOST_APPLICATION_REF_ID_V010 =
  "application:trading-reference.goods-receipt" as const;

export interface PurchaseReferenceRuntimeTargetV010 {
  scopeKey: string;
  purchaseApplicationId: string;
  receiptApplicationId: string;
}

export interface PurchaseReferenceSelectionV010 {
  contextId: string;
  supplierCounterpartyId: string;
  itemId: string;
  warehouseId: string;
}

export interface ResolvedPurchaseReferencesV010 {
  supplier: CounterpartySubjectV010;
  item: ItemSubjectV010;
  warehouse: WarehouseSubjectV010;
}

export interface PurchaseReferenceServiceV010 {
  resolveReferences(
    selection: PurchaseReferenceSelectionV010
  ): ResolvedPurchaseReferencesV010;
  approvePurchaseOrder(input: {
    target: PurchaseReferenceRuntimeTargetV010;
    selection: PurchaseReferenceSelectionV010;
    orderNo: string;
    quantity: number;
    unitPrice: string;
    totalAmount: string;
    currency: string;
    effectiveAt: string;
    correlationId: string;
    idempotencyKey: string;
  }): Promise<{
    references: ResolvedPurchaseReferencesV010;
    submission: EvoBusinessDataSubmissionResultV010;
  }>;
  receivePurchaseOrder(input: {
    target: PurchaseReferenceRuntimeTargetV010;
    selection: PurchaseReferenceSelectionV010;
    purchaseBusinessDataId: string;
    orderNo: string;
    receiptNo: string;
    quantity: number;
    totalCost: string;
    currency: string;
    effectiveAt: string;
    correlationId: string;
    idempotencyKey: string;
  }): Promise<{
    references: ResolvedPurchaseReferencesV010;
    submission: EvoBusinessDataSubmissionResultV010;
  }>;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function quantity(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("TRADING_REFERENCE_QUANTITY_INVALID");
  }
  return value;
}

function decimal(value: string, code: string): string {
  const normalized = required(value, code);
  if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(normalized)) {
    throw new Error(code);
  }
  return normalized;
}

function timestamp(value: string): string {
  const normalized = required(
    value,
    "TRADING_REFERENCE_EFFECTIVE_AT_REQUIRED"
  );
  if (!Number.isFinite(Date.parse(normalized))) {
    throw new Error("TRADING_REFERENCE_EFFECTIVE_AT_INVALID");
  }
  return new Date(normalized).toISOString();
}

function target(
  value: PurchaseReferenceRuntimeTargetV010
): PurchaseReferenceRuntimeTargetV010 {
  return {
    scopeKey: required(value.scopeKey, "TRADING_REFERENCE_SCOPE_REQUIRED"),
    purchaseApplicationId: required(
      value.purchaseApplicationId,
      "TRADING_REFERENCE_PURCHASE_APPLICATION_REQUIRED"
    ),
    receiptApplicationId: required(
      value.receiptApplicationId,
      "TRADING_REFERENCE_RECEIPT_APPLICATION_REQUIRED"
    )
  };
}

export function createPurchaseReferenceServiceV010(input: {
  adapter: EvoBusinessDataAdapterV010;
  counterparties: CounterpartyRepositoryV010;
  roles: CounterpartyRoleRepositoryV010;
  items: ItemRepositoryV010;
  warehouses: WarehouseRepositoryV010;
}): PurchaseReferenceServiceV010 {
  const resolveReferences = (
    selection: PurchaseReferenceSelectionV010
  ): ResolvedPurchaseReferencesV010 => {
    const contextId = required(
      selection.contextId,
      "TRADING_REFERENCE_CONTEXT_REQUIRED"
    );
    const supplierCounterpartyId = required(
      selection.supplierCounterpartyId,
      "TRADING_REFERENCE_SUPPLIER_REQUIRED"
    );
    const itemId = required(
      selection.itemId,
      "TRADING_REFERENCE_ITEM_REQUIRED"
    );
    const warehouseId = required(
      selection.warehouseId,
      "TRADING_REFERENCE_WAREHOUSE_REQUIRED"
    );

    const supplier = input.counterparties.get(
      contextId,
      supplierCounterpartyId
    );
    if (!supplier) throw new Error("TRADING_REFERENCE_SUPPLIER_NOT_FOUND");
    if (!input.roles.has(contextId, supplierCounterpartyId, "SUPPLIER")) {
      throw new Error("TRADING_REFERENCE_SUPPLIER_ROLE_REQUIRED");
    }

    const item = input.items.get(contextId, itemId);
    if (!item) throw new Error("TRADING_REFERENCE_ITEM_NOT_FOUND");

    const warehouse = input.warehouses.get(contextId, warehouseId);
    if (!warehouse) throw new Error("TRADING_REFERENCE_WAREHOUSE_NOT_FOUND");

    return {
      supplier,
      item,
      warehouse
    };
  };

  return {
    resolveReferences,

    async approvePurchaseOrder(orderInput) {
      const runtime = target(orderInput.target);
      const references = resolveReferences(orderInput.selection);
      const orderNo = required(
        orderInput.orderNo,
        "TRADING_REFERENCE_ORDER_NO_REQUIRED"
      );
      const effectiveAt = timestamp(orderInput.effectiveAt);
      const currency = required(
        orderInput.currency,
        "TRADING_REFERENCE_CURRENCY_REQUIRED"
      );
      const unitPrice = decimal(
        orderInput.unitPrice,
        "TRADING_REFERENCE_UNIT_PRICE_INVALID"
      );
      const totalAmount = decimal(
        orderInput.totalAmount,
        "TRADING_REFERENCE_TOTAL_AMOUNT_INVALID"
      );

      const submission = await input.adapter.submit({
        contractVersion: "0.1.0",
        scopeKey: runtime.scopeKey,
        applicationId: runtime.purchaseApplicationId,
        businessDataType: "purchase_order.approved",
        businessObjectKey: orderNo,
        effectiveAt,
        correlationId: required(
          orderInput.correlationId,
          "TRADING_REFERENCE_CORRELATION_REQUIRED"
        ),
        idempotencyKey: required(
          orderInput.idempotencyKey,
          "TRADING_REFERENCE_IDEMPOTENCY_REQUIRED"
        ),
        payload: {
          eventKind: "PURCHASE_ORDER",
          orderNo,
          supplier: references.supplier.counterpartyId,
          supplierCode: references.supplier.code,
          supplierDisplayName: references.supplier.displayName,
          productId: references.item.itemId,
          productCode: references.item.code,
          productDisplayName: references.item.displayName,
          warehouse: references.warehouse.warehouseId,
          warehouseCode: references.warehouse.code,
          warehouseDisplayName: references.warehouse.displayName,
          quantity: quantity(orderInput.quantity),
          unitPrice,
          totalAmount,
          currency,
          project: null,
          department: null,
          costCenter: null
        }
      });

      return { references, submission };
    },

    async receivePurchaseOrder(receiptInput) {
      const runtime = target(receiptInput.target);
      const references = resolveReferences(receiptInput.selection);
      const orderNo = required(
        receiptInput.orderNo,
        "TRADING_REFERENCE_ORDER_NO_REQUIRED"
      );
      const receiptNo = required(
        receiptInput.receiptNo,
        "TRADING_REFERENCE_RECEIPT_NO_REQUIRED"
      );
      const parentBusinessDataId = required(
        receiptInput.purchaseBusinessDataId,
        "TRADING_REFERENCE_PURCHASE_BUSINESS_DATA_REQUIRED"
      );
      const effectiveAt = timestamp(receiptInput.effectiveAt);
      const currency = required(
        receiptInput.currency,
        "TRADING_REFERENCE_CURRENCY_REQUIRED"
      );
      const totalCost = decimal(
        receiptInput.totalCost,
        "TRADING_REFERENCE_TOTAL_COST_INVALID"
      );

      const submission = await input.adapter.submit({
        contractVersion: "0.1.0",
        scopeKey: runtime.scopeKey,
        applicationId: runtime.receiptApplicationId,
        businessDataType: "goods_receipt.received",
        businessObjectKey: receiptNo,
        effectiveAt,
        correlationId: required(
          receiptInput.correlationId,
          "TRADING_REFERENCE_CORRELATION_REQUIRED"
        ),
        idempotencyKey: required(
          receiptInput.idempotencyKey,
          "TRADING_REFERENCE_IDEMPOTENCY_REQUIRED"
        ),
        causationId: parentBusinessDataId,
        relation: {
          fromBusinessDataId: parentBusinessDataId,
          relationType: "FULFILLS"
        },
        payload: {
          movementType: "PURCHASE_RECEIPT",
          receiptNo,
          orderNo,
          supplier: references.supplier.counterpartyId,
          supplierCode: references.supplier.code,
          supplierDisplayName: references.supplier.displayName,
          productId: references.item.itemId,
          productCode: references.item.code,
          productDisplayName: references.item.displayName,
          warehouse: references.warehouse.warehouseId,
          warehouseCode: references.warehouse.code,
          warehouseDisplayName: references.warehouse.displayName,
          quantity: quantity(receiptInput.quantity),
          totalCost,
          currency,
          project: null,
          department: null,
          costCenter: null
        }
      });

      return { references, submission };
    }
  };
}
