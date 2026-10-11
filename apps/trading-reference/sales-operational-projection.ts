import type {
  AuthorizationProviderV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import type {
  CompletePurchaseOperationalPageV010,
  PurchaseOperationalLedgerBalanceV010,
  PurchaseOperationalWorkItemV010
} from "./operational-projection.js";

/** Application-owned, read-only inverse view: EVO Ledger and Work remain authoritative. */
export const SALES_OPERATIONS_READ_ACTION_V010 =
  "trading-reference.sales-operations.read" as const;

export type SalesOperationalLedgerV010 =
  "pending_shipment" | "receivable" | "inventory" | "cash";

export interface SalesOperationalEvoReadPortV010 {
  listOpenWorkItems(
    enterpriseId: string
  ): Promise<CompletePurchaseOperationalPageV010<PurchaseOperationalWorkItemV010>>;
  readLedgerBalances(
    enterpriseId: string,
    ledger: SalesOperationalLedgerV010,
    dimensions: Readonly<Record<string, string>>
  ): Promise<CompletePurchaseOperationalPageV010<PurchaseOperationalLedgerBalanceV010>>;
}
export interface SalesOperationalReadRequestV010 {
  requestContext: PlatformRequestContextV010;
  contextId: string;
  /** Resolved by the Host's explicit enterprise → EVO runtime mapping. */
  enterpriseId: string;
  orderNo: string;
  customerCounterpartyId: string;
  itemId: string;
  warehouseId: string;
}
export interface SalesOperationalViewV010 {
  contractVersion: "0.1.0";
  projectionId: "trading-reference.sales-operations";
  enterpriseId: string;
  orderNo: string;
  references: {
    customerCounterpartyId: string;
    itemId: string;
    warehouseId: string;
  };
  pendingShipmentQuantity: number;
  receivableAmount: number;
  cashLedgerAmount: number;
  inventoryPosition: {
    quantity: number;
    /** This is an observed raw EVO ledger amount, NOT certified closing cost or COGS. */
    observedLedgerAmount: number;
    costValuationCertified: false;
  };
  openWork: {
    ship: { quantity: number } | null;
    collect: { amount: number } | null;
  };
}
export interface SalesOperationalProjectionServiceV010 {
  read(request: SalesOperationalReadRequestV010): Promise<SalesOperationalViewV010>;
}
function required(v: string, name: string): string {
  if (typeof v !== "string" || !v.trim()) {
    throw new Error("TR01B2_REFERENCE_REQUIRED:" + name);
  }
  return v.trim();
}
function decimal(v: string | number | undefined, field: string): number {
  if ((typeof v !== "string" && typeof v !== "number")
      || (typeof v === "string" && !v.trim())) {
    throw new Error("TR01B2_DECIMAL_INVALID:" + field);
  }
  const value = Number(v);
  if (!Number.isFinite(value)) {
    throw new Error("TR01B2_DECIMAL_INVALID:" + field);
  }
  return value;
}
function matches(
  dims: Record<string, string> | undefined,
  requested: Readonly<Record<string, string>>
): boolean {
  return Boolean(dims) && Object.entries(requested).every(
    ([key, value]) => dims?.[key] === value
  );
}
function single(
  page: CompletePurchaseOperationalPageV010<PurchaseOperationalLedgerBalanceV010>,
  scope: Readonly<Record<string, string>>,
  ledger: SalesOperationalLedgerV010
): PurchaseOperationalLedgerBalanceV010 {
  if (!page.complete) throw new Error("TR01B2_EVO_INCOMPLETE_PAGE:" + ledger);
  const found = page.items.filter(row => matches(row.dimensions, scope));
  // The public Ledger API should filter exactly; extra rows are not silently aggregated.
  if (found.length !== 1 || found.length !== page.items.length) {
    throw new Error("TR01B2_LEDGER_SCOPE_AMBIGUOUS:" + ledger);
  }
  return found[0]!;
}
function findWork(
  page: CompletePurchaseOperationalPageV010<PurchaseOperationalWorkItemV010>,
  scope: Readonly<Record<string, string>>,
  ledger: "pending_shipment" | "receivable",
  kind: "SHIP" | "COLLECT"
): PurchaseOperationalWorkItemV010 | null {
  if (!page.complete) throw new Error("TR01B2_EVO_INCOMPLETE_PAGE:work");
  const found = page.items.filter(row =>
    row.sourceLedgerCode === ledger && matches(row.dimensions, scope)
  );
  if (found.length > 1 || (found.length === 1 && found[0]?.workType !== kind)) {
    throw new Error("TR01B2_WORK_SCOPE_AMBIGUOUS:" + ledger);
  }
  return found[0] ?? null;
}
export function createSalesOperationalProjectionServiceV010(options: {
  reader: SalesOperationalEvoReadPortV010;
  resolveAuthorizationProvider(): AuthorizationProviderV010 | undefined;
}): SalesOperationalProjectionServiceV010 {
  return {
    async read(request) {
      const active = request.requestContext.context?.activeContext;
      if (!active || active.kind !== "ENTERPRISE"
          || active.contextId !== request.contextId
          || active.enterpriseId !== request.requestContext.scope.enterpriseId
          || !request.enterpriseId?.trim()) {
        throw new Error("TR01B2_ENTERPRISE_CONTEXT_MISMATCH");
      }
      const orderNo = required(request.orderNo, "orderNo");
      const customerCounterpartyId = required(
        request.customerCounterpartyId, "customerCounterpartyId"
      );
      const itemId = required(request.itemId, "itemId");
      const warehouseId = required(request.warehouseId, "warehouseId");
      const auth = options.resolveAuthorizationProvider();
      if (!auth) throw new Error("TR01B2_AUTHORIZATION_REQUIRED");
      const decision = await auth.check({
        contractVersion: "0.1.0",
        principal: request.requestContext.principal,
        scope: request.requestContext.scope,
        action: SALES_OPERATIONS_READ_ACTION_V010,
        resource: {
          type: "trading-reference.sales-order",
          id: orderNo,
          attributes: { customerCounterpartyId, itemId, warehouseId }
        },
        context: {
          activeContextId: request.contextId,
          correlationId: request.requestContext.correlationId
        }
      });
      if (!decision.allowed || decision.obligations?.length) {
        throw new Error("TR01B2_READ_DENIED");
      }
      const order = { order_no: orderNo, customer: customerCounterpartyId };
      const product = { ...order, product_id: itemId };
      const stock = { ...product, warehouse: warehouseId };
      const [works, shipment, receivable, inventory, cash] = await Promise.all([
        options.reader.listOpenWorkItems(request.enterpriseId),
        options.reader.readLedgerBalances(request.enterpriseId, "pending_shipment", product),
        options.reader.readLedgerBalances(request.enterpriseId, "receivable", order),
        options.reader.readLedgerBalances(request.enterpriseId, "inventory", stock),
        options.reader.readLedgerBalances(request.enterpriseId, "cash", order)
      ]);
      const pendingShipmentQuantity = decimal(
        single(shipment, product, "pending_shipment").quantity, "pending_shipment.quantity"
      );
      const receivableAmount = decimal(
        single(receivable, order, "receivable").amount, "receivable.amount"
      );
      const inventoryBalance = single(inventory, stock, "inventory");
      const inventoryQuantity = decimal(inventoryBalance.quantity, "inventory.quantity");
      const inventoryLedgerAmount = decimal(inventoryBalance.amount, "inventory.amount");
      const cashLedgerAmount = decimal(
        single(cash, order, "cash").amount, "cash.amount"
      );
      const ship = findWork(works, product, "pending_shipment", "SHIP");
      const collect = findWork(works, order, "receivable", "COLLECT");
      // Concurrent EVO projections cannot be silently reported as a valid closed task.
      if ((pendingShipmentQuantity > 0) !== Boolean(ship)) {
        throw new Error("TR01B2_WORK_POSITION_NOT_CONVERGED:SHIP");
      }
      if ((receivableAmount > 0) !== Boolean(collect)) {
        throw new Error("TR01B2_WORK_POSITION_NOT_CONVERGED:COLLECT");
      }
      if (ship && decimal(ship.quantity, "SHIP.quantity") !== pendingShipmentQuantity) {
        throw new Error("TR01B2_WORK_POSITION_NOT_CONVERGED:SHIP");
      }
      if (collect && decimal(collect.amount, "COLLECT.amount") !== receivableAmount) {
        throw new Error("TR01B2_WORK_POSITION_NOT_CONVERGED:COLLECT");
      }
      return {
        contractVersion: "0.1.0",
        projectionId: "trading-reference.sales-operations",
        enterpriseId: request.enterpriseId,
        orderNo,
        references: { customerCounterpartyId, itemId, warehouseId },
        pendingShipmentQuantity, receivableAmount, cashLedgerAmount,
        inventoryPosition: {
          quantity: inventoryQuantity,
          observedLedgerAmount: inventoryLedgerAmount,
          costValuationCertified: false
        },
        openWork: {
          ship: ship ? { quantity: pendingShipmentQuantity } : null,
          collect: collect ? { amount: receivableAmount } : null
        }
      };
    }
  };
}
