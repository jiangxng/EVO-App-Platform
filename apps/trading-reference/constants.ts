export const TRADING_REFERENCE_PACKAGE_ID_V010 = "evo-trading-reference" as const;
export const TRADING_REFERENCE_FEATURE_ID_V010 = "evo-trading-reference.default" as const;
export const PURCHASE_OPERATIONS_READ_OPERATION_V010 =
  "trading-reference.purchase-operations.read" as const;
export const PURCHASE_OPERATIONS_READ_COMMAND_V010 =
  "trading-reference.purchase-operations.read" as const;
/** Legacy dependency Capability identifier; remains provided for installed consumers.
 * Its old namespace does NOT own the two published Operation IDs under
 * Plugin Protocol 0.1.0. Do not silently drop it during Agent certification. */
export const PURCHASE_OPERATIONS_CAPABILITY_V010 =
  "enterprise.trading-reference.purchase-operations" as const;

/** Canonical Capability owner namespace for the two already-published
 * trading-reference.purchase-operations.* Operation IDs. */
export const PURCHASE_OPERATIONS_OPERATION_CAPABILITY_V010 =
  "trading-reference.purchase-operations" as const;

export const PURCHASE_OPERATIONS_LOOKUP_PAGE_ID_V010 =
  "evo-trading-reference.purchase-lookup" as const;
export const PURCHASE_OPERATIONS_LOOKUP_PAGE_SOURCE_V010 =
  "app://evo-trading-reference/pages/purchase-lookup" as const;
export const PURCHASE_OPERATIONS_LOOKUP_ROUTE_V010 =
  "/trading-reference/purchase-lookup" as const;
export const PURCHASE_OPERATIONS_DETAIL_PAGE_ID_V010 =
  "evo-trading-reference.purchase-position" as const;
export const PURCHASE_OPERATIONS_DETAIL_PAGE_SOURCE_V010 =
  "app://evo-trading-reference/pages/purchase-position" as const;
export const PURCHASE_OPERATIONS_DETAIL_ROUTE_V010 =
  "/trading-reference/purchase-position" as const;
export const PURCHASE_OPERATIONS_ENTRY_OPEN_OPERATION_V010 =
  "trading-reference.purchase-operations.entry.open" as const;
export const PURCHASE_OPERATIONS_ENTRY_OPEN_COMMAND_V010 =
  "trading-reference.purchase-operations.entry.open" as const;
export const PURCHASE_OPERATIONS_ENTRY_OPEN_ACTION_V010 =
  "trading-reference.purchase-operations.entry.open" as const;
