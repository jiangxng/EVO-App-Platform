export const WAREHOUSE_PACKAGE_ID = "evo-warehouse" as const;
export const WAREHOUSE_FEATURE_ID = "evo-warehouse.default" as const;

export const WAREHOUSE_DIRECTORY_PAGE_ID =
  "evo-warehouse.directory" as const;
export const WAREHOUSE_DIRECTORY_PAGE_SOURCE =
  "app://evo-warehouse/pages/directory" as const;
export const WAREHOUSE_DIRECTORY_ROUTE = "/warehouses" as const;

export const WAREHOUSE_MY_PAGE_ID =
  "evo-warehouse.my-warehouses" as const;
export const WAREHOUSE_MY_PAGE_SOURCE =
  "app://evo-warehouse/pages/my-warehouses" as const;
export const WAREHOUSE_MY_ROUTE = "/warehouses/my-warehouses" as const;

export const WAREHOUSE_DETAIL_PAGE_ID =
  "evo-warehouse.detail" as const;
export const WAREHOUSE_DETAIL_PAGE_SOURCE =
  "app://evo-warehouse/pages/detail" as const;
export const WAREHOUSE_DETAIL_ROUTE = "/warehouses/detail" as const;

export const WAREHOUSE_PROJECTION_CAPABILITY_V010 =
  "enterprise.warehouse.projection" as const;
export const WAREHOUSE_DIRECTORY_PROJECTION_V010 =
  "warehouse.directory" as const;
export const WAREHOUSE_MY_PROJECTION_V010 =
  "warehouse.my-stewardship" as const;

export type WarehouseProjectionIdV010 =
  | typeof WAREHOUSE_DIRECTORY_PROJECTION_V010
  | typeof WAREHOUSE_MY_PROJECTION_V010;

export const WAREHOUSE_DIRECTORY_READ_COMMAND_V010 =
  "warehouse.projection.directory.read" as const;
export const WAREHOUSE_MY_READ_COMMAND_V010 =
  "warehouse.projection.my-warehouses.read" as const;
export const WAREHOUSE_DIRECTORY_READ_OPERATION_V010 =
  "warehouse.projection.directory.read" as const;
export const WAREHOUSE_MY_READ_OPERATION_V010 =
  "warehouse.projection.my-warehouses.read" as const;

export function warehouseDetailRouteV010(warehouseId: string): string {
  if (!warehouseId.trim()) throw new Error("WAREHOUSE_ID_REQUIRED");
  return `${WAREHOUSE_DETAIL_ROUTE}?${new URLSearchParams({
    warehouseId: warehouseId.trim()
  }).toString()}`;
}

export function parseWarehouseDetailRouteV010(
  route: string | undefined
): string | undefined {
  if (!route?.trim() || !route.trim().startsWith("/")) return undefined;
  const url = new URL(route.trim(), "http://evo.local");
  if (url.pathname !== WAREHOUSE_DETAIL_ROUTE) return undefined;
  return url.searchParams.get("warehouseId")?.trim() || undefined;
}
