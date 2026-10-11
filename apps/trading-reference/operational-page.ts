import type { CatalogBrowserV010 } from "../../vendor/eidos/src/catalog-browser/contracts.js";
import type { PurchaseOperationalViewV010 } from "./operational-projection.js";
import {
  PURCHASE_OPERATIONS_READ_COMMAND_V010,
  PURCHASE_OPERATIONS_LOOKUP_ROUTE_V010,
  PURCHASE_OPERATIONS_DETAIL_ROUTE_V010,
  TRADING_REFERENCE_FEATURE_ID_V010,
  TRADING_REFERENCE_PACKAGE_ID_V010
} from "./constants.js";

export interface PurchaseOperationalSelectionV010 {
  orderNo: string;
  supplierCounterpartyId: string;
  itemId: string;
  warehouseId: string;
}

function labels(locale?: string) {
  const zh = locale?.toLowerCase().startsWith("zh");
  return zh ? {
    title: "采购业务状态查询",
    description: "按采购单核对待收货、库存与应付款。数据实时来源于 EVO 的 Work 和账本，不在这里修改采购事实。",
    order: "采购订单号", supplier: "供应商 ID",
    item: "Item ID", warehouse: "仓库 ID",
    lookup: "查询业务状态", back: "重新查询",
    result: "采购业务状态", pending: "待收货数量",
    inventory: "库存位置", payable: "应付金额",
    receive: "待收货工作", pay: "待付款工作",
    inventoryAmount: "库存成本金额", inventoryQty: "库存数量",
    open: "待处理", closed: "已完成",
    reference: "业务引用", source: "权威来源",
    derived: "EVO Ledger / Work",
    noWrite: "此页面只提供已授权的业务事实派生状态；不进行收货、付款或冲销操作。"
  } : {
    title: "Purchase operational lookup",
    description: "Review RECEIVE Work, Inventory Position and Payable for a purchase order. Read live EVO Work and Ledger facts; no purchase transaction is edited here.",
    order: "Purchase order number", supplier: "Supplier ID",
    item: "Item ID", warehouse: "Warehouse ID",
    lookup: "Read operational position", back: "New lookup",
    result: "Purchase operational position", pending: "Pending receipt quantity",
    inventory: "Inventory position", payable: "Payable amount",
    receive: "Receive Work", pay: "Pay Work",
    inventoryAmount: "Inventory cost amount", inventoryQty: "Inventory quantity",
    open: "Open", closed: "Closed",
    reference: "Business references", source: "Authority",
    derived: "EVO Ledger / Work",
    noWrite: "This page is authorized read-only derived state; it cannot receive goods, settle or reverse transactions."
  };
}

/** Route accepts exactly four known business reference parameters; no EVO scope may be supplied by URL. */
export function purchaseOperationalDetailRouteV010(value: PurchaseOperationalSelectionV010): string {
  const params = new URLSearchParams();
  for (const key of [
    "orderNo", "supplierCounterpartyId", "itemId", "warehouseId"
  ] as const) {
    const normalized = value[key]?.trim();
    if (!normalized || normalized.length > 200) {
      throw new Error("TR01_OPERATIONAL_ROUTE_REFERENCE_INVALID:" + key);
    }
    params.set(key, normalized);
  }
  return PURCHASE_OPERATIONS_DETAIL_ROUTE_V010 + "?" + params.toString();
}

export function parsePurchaseOperationalDetailRouteV010(
  route: string | undefined
): PurchaseOperationalSelectionV010 | undefined {
  if (!route || !route.startsWith("/") || route.length > 1800) return undefined;
  const parsed = new URL(route, "http://evo.local");
  if (parsed.pathname !== PURCHASE_OPERATIONS_DETAIL_ROUTE_V010) return undefined;
  const expected = [
    "orderNo", "supplierCounterpartyId", "itemId", "warehouseId"
  ] as const;
  if ([...parsed.searchParams.keys()].some(key => !expected.includes(key as typeof expected[number]))) {
    return undefined;
  }
  if (expected.some(key => parsed.searchParams.getAll(key).length !== 1)) {
    return undefined;
  }
  const refs = Object.fromEntries(expected.map(key => [
    key, parsed.searchParams.get(key)?.trim() ?? ""
  ])) as Record<typeof expected[number], string>;
  if (expected.some(key => !refs[key] || refs[key].length > 200)) return undefined;
  return refs;
}

export function createPurchaseOperationalLookupPageV010(locale?: string) {
  const t = labels(locale);
  return {
    contractVersion: "0.1.1",
    kind: "form",
    id: "trading-reference.purchase-operational-lookup",
    title: t.title,
    description: t.description,
    purpose: "execute-command",
    command: {
      code: PURCHASE_OPERATIONS_READ_COMMAND_V010,
      inputVersion: "0.1.0"
    },
    fields: [{
      key: "orderNo", label: t.order, semanticType: "purchase-order-number",
      control: "text", required: true
    }, {
      key: "supplierCounterpartyId", label: t.supplier,
      semanticType: "counterparty-reference", control: "text", required: true
    }, {
      key: "itemId", label: t.item, semanticType: "item-reference",
      control: "text", required: true
    }, {
      key: "warehouseId", label: t.warehouse,
      semanticType: "warehouse-reference", control: "text", required: true
    }],
    actions: [{
      id: "lookup", label: t.lookup, type: "submit",
      command: PURCHASE_OPERATIONS_READ_COMMAND_V010,
      requiresConfirmation: false
    }],
    metadata: {
      packageId: TRADING_REFERENCE_PACKAGE_ID_V010,
      featureId: TRADING_REFERENCE_FEATURE_ID_V010,
      readOnly: true,
      authority: "EVO"
    }
  } as const;
}

export function createPurchaseOperationalPositionPageV010(
  view: PurchaseOperationalViewV010,
  locale?: string
): CatalogBrowserV010 {
  const t = labels(locale);
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "trading-reference.purchase-operational-position",
    layout: "list",
    density: "compact",
    title: t.result + " · " + view.orderNo,
    description: t.noWrite,
    contextNavigation: {
      items: [{
        id: "purchase-lookup", label: t.title, route: PURCHASE_OPERATIONS_LOOKUP_ROUTE_V010
      }, {
        id: "purchase-position", label: view.orderNo
      }]
    },
    actions: [{
      id: "new-lookup",
      label: t.back,
      type: "navigate",
      route: PURCHASE_OPERATIONS_LOOKUP_ROUTE_V010,
      requiresConfirmation: false
    }],
    items: [{
      id: "pending-receipt",
      title: t.pending,
      category: t.receive,
      summary: String(view.pendingPurchaseQuantity),
      status: {
        label: view.openWork.receive ? t.open : t.closed,
        tone: view.openWork.receive ? "warning" : "positive"
      },
      metadata: {
        [t.pending]: view.pendingPurchaseQuantity,
        [t.source]: t.derived
      }
    }, {
      id: "inventory-position",
      title: t.inventory,
      category: t.inventory,
      summary: t.inventoryQty + ": " + view.inventoryPosition.quantity,
      metadata: {
        [t.inventoryQty]: view.inventoryPosition.quantity,
        [t.inventoryAmount]: view.inventoryPosition.amount,
        [t.source]: t.derived
      }
    }, {
      id: "payable",
      title: t.payable,
      category: t.pay,
      summary: String(view.payableAmount),
      status: {
        label: view.openWork.pay ? t.open : t.closed,
        tone: view.openWork.pay ? "warning" : "positive"
      },
      metadata: {
        [t.payable]: view.payableAmount,
        [t.source]: t.derived
      }
    }],
    emptyMessage: t.noWrite
  };
}
