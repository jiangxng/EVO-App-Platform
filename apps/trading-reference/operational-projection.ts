import type {
  AuthorizationProviderV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";

/**
 * TR-01A3: a read-only purchase reference projection. All numbers and Work
 * originate in EVO; no duplicate Inventory/Payable state is persisted here.
 * This is an application-owned reference contract, not an installed Experience.
 */
export const PURCHASE_OPERATIONS_READ_ACTION_V010 =
  "trading-reference.purchase-operations.read" as const;

export interface PurchaseOperationalLedgerBalanceV010 {
  dimensions?: Record<string, string>;
  quantity?: string | number;
  amount?: string | number;
}

export interface PurchaseOperationalWorkItemV010 {
  sourceLedgerCode: string;
  workType: string;
  dimensions?: Record<string, string>;
  quantity?: string | number;
  amount?: string | number;
}

export interface CompletePurchaseOperationalPageV010<T> {
  items: readonly T[];
  /** Must be false for capped or unexhausted API pages. */
  complete: boolean;
}

export interface PurchaseOperationalEvoReadPortV010 {
  listOpenWorkItems(
    enterpriseId: string
  ): Promise<CompletePurchaseOperationalPageV010<PurchaseOperationalWorkItemV010>>;
  readLedgerBalances(
    enterpriseId: string,
    ledgerCode: "pending_purchase" | "payable" | "inventory",
    dimensions: Readonly<Record<string, string>>
  ): Promise<CompletePurchaseOperationalPageV010<PurchaseOperationalLedgerBalanceV010>>;
}

export interface PurchaseOperationalReadRequestV010 {
  requestContext: PlatformRequestContextV010;
  contextId: string;
  enterpriseId: string;
  orderNo: string;
  supplierCounterpartyId: string;
  itemId: string;
  warehouseId: string;
}

export interface PurchaseOperationalViewV010 {
  contractVersion: "0.1.0";
  projectionId: "trading-reference.purchase-operations";
  enterpriseId: string;
  orderNo: string;
  references: {
    supplierCounterpartyId: string;
    itemId: string;
    warehouseId: string;
  };
  pendingPurchaseQuantity: number;
  inventoryPosition: { quantity: number; amount: number };
  payableAmount: number;
  openWork: {
    receive: { quantity: number } | null;
    pay: { amount: number } | null;
  };
}

export interface PurchaseOperationalProjectionServiceV010 {
  read(request: PurchaseOperationalReadRequestV010): Promise<PurchaseOperationalViewV010>;
}

function required(value: string, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("TR01_OPERATIONAL_REFERENCE_REQUIRED:" + field);
  }
  return value.trim();
}

function numeric(value: string | number | undefined, field: string): number {
  if ((typeof value !== "string" && typeof value !== "number")
      || (typeof value === "string" && !value.trim())) {
    throw new Error("TR01_OPERATIONAL_VALUE_INVALID:" + field);
  }
  const result = Number(value);
  if (!Number.isFinite(result)) {
    throw new Error("TR01_OPERATIONAL_VALUE_INVALID:" + field);
  }
  return result;
}

function matches(
  dimensions: Record<string, string> | undefined,
  expected: Readonly<Record<string, string>>
): boolean {
  return Boolean(dimensions)
    && Object.entries(expected).every(([key, value]) => dimensions?.[key] === value);
}

function uniqueBalance(
  page: CompletePurchaseOperationalPageV010<PurchaseOperationalLedgerBalanceV010>,
  dimensions: Readonly<Record<string, string>>,
  ledger: string
): PurchaseOperationalLedgerBalanceV010 {
  if (!page.complete) throw new Error("TR01_OPERATIONAL_INCOMPLETE_PAGE:" + ledger);
  const matching = page.items.filter(item => matches(item.dimensions, dimensions));
  if (matching.length !== 1 || matching.length !== page.items.length) {
    throw new Error("TR01_OPERATIONAL_BALANCE_AMBIGUOUS:" + ledger);
  }
  return matching[0]!;
}

function uniqueWork(
  page: CompletePurchaseOperationalPageV010<PurchaseOperationalWorkItemV010>,
  ledger: "pending_purchase" | "payable",
  workType: "RECEIVE" | "PAY",
  dimensions: Readonly<Record<string, string>>
): PurchaseOperationalWorkItemV010 | null {
  if (!page.complete) throw new Error("TR01_OPERATIONAL_INCOMPLETE_PAGE:work");
  const matching = page.items.filter(item =>
    item.sourceLedgerCode === ledger && matches(item.dimensions, dimensions)
  );
  if (matching.length > 1 || (matching.length === 1 && matching[0]?.workType !== workType)) {
    throw new Error("TR01_OPERATIONAL_WORK_AMBIGUOUS:" + ledger);
  }
  return matching[0] ?? null;
}

export function createPurchaseOperationalProjectionServiceV010(input: {
  reader: PurchaseOperationalEvoReadPortV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
}): PurchaseOperationalProjectionServiceV010 {
  return {
    async read(request) {
      const active = request.requestContext.context?.activeContext;
      if (!active || active.kind !== "ENTERPRISE"
          || active.contextId !== request.contextId
          || active.enterpriseId !== request.requestContext.scope.enterpriseId
          || !request.enterpriseId.trim()) {
        throw new Error("TR01_OPERATIONAL_ENTERPRISE_CONTEXT_MISMATCH");
      }
      const orderNo = required(request.orderNo, "orderNo");
      const supplierCounterpartyId = required(
        request.supplierCounterpartyId, "supplierCounterpartyId"
      );
      const itemId = required(request.itemId, "itemId");
      const warehouseId = required(request.warehouseId, "warehouseId");
      const provider = input.resolveAuthorizationProvider();
      if (!provider) throw new Error("TR01_OPERATIONAL_AUTHORIZATION_REQUIRED");
      const decision = await provider.check({
        contractVersion: "0.1.0",
        principal: request.requestContext.principal,
        scope: request.requestContext.scope,
        action: PURCHASE_OPERATIONS_READ_ACTION_V010,
        resource: {
          type: "trading-reference.purchase-order",
          id: orderNo,
          attributes: {
            supplierCounterpartyId,
            itemId,
            warehouseId
          }
        },
        context: {
          activeContextId: request.contextId,
          correlationId: request.requestContext.correlationId
        }
      });
      if (!decision.allowed || decision.obligations?.length) {
        throw new Error("TR01_OPERATIONAL_READ_DENIED");
      }

      const common = {
        order_no: orderNo,
        supplier: supplierCounterpartyId,
        product_id: itemId
      };
      const warehouseDimensions = { ...common, warehouse: warehouseId };
      const [work, pending, inventory, payable] = await Promise.all([
        input.reader.listOpenWorkItems(request.enterpriseId),
        input.reader.readLedgerBalances(
          request.enterpriseId, "pending_purchase", warehouseDimensions
        ),
        input.reader.readLedgerBalances(
          request.enterpriseId, "inventory", warehouseDimensions
        ),
        input.reader.readLedgerBalances(
          request.enterpriseId, "payable", common
        )
      ]);
      const pendingBalance = uniqueBalance(
        pending, warehouseDimensions, "pending_purchase"
      );
      const inventoryBalance = uniqueBalance(
        inventory, warehouseDimensions, "inventory"
      );
      const payableBalance = uniqueBalance(payable, common, "payable");
      const receive = uniqueWork(work, "pending_purchase", "RECEIVE", warehouseDimensions);
      const pay = uniqueWork(work, "payable", "PAY", common);
      const pendingPurchaseQuantity = numeric(
        pendingBalance.quantity, "pending_purchase.quantity"
      );
      const payableAmount = numeric(payableBalance.amount, "payable.amount");
      const inventoryQuantity = numeric(
        inventoryBalance.quantity, "inventory.quantity"
      );
      const inventoryAmount = numeric(
        inventoryBalance.amount, "inventory.amount"
      );
      // Active Work may be absent when the derived balance has already closed.
      // A still-positive balance with missing Work means observations are not
      // synchronized; never present it as a safely closed task.
      if (pendingPurchaseQuantity > 0 && !receive) {
        throw new Error("TR01_OPERATIONAL_WORK_BALANCE_NOT_READY:RECEIVE");
      }
      if (payableAmount > 0 && !pay) {
        throw new Error("TR01_OPERATIONAL_WORK_BALANCE_NOT_READY:PAY");
      }
      return {
        contractVersion: "0.1.0",
        projectionId: "trading-reference.purchase-operations",
        enterpriseId: request.enterpriseId,
        orderNo,
        references: {
          supplierCounterpartyId,
          itemId,
          warehouseId
        },
        pendingPurchaseQuantity,
        inventoryPosition: {
          quantity: inventoryQuantity,
          amount: inventoryAmount
        },
        payableAmount,
        openWork: {
          receive: receive
            ? { quantity: numeric(receive.quantity, "receive.quantity") }
            : null,
          pay: pay ? { amount: numeric(pay.amount, "pay.amount") } : null
        }
      };
    }
  };
}
