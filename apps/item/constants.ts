export const ITEM_PACKAGE_ID = "evo-item" as const;
export const ITEM_FEATURE_ID = "evo-item.default" as const;

export const ITEM_DIRECTORY_PAGE_ID = "evo-item.directory" as const;
export const ITEM_DIRECTORY_PAGE_SOURCE =
  "app://evo-item/pages/directory" as const;
export const ITEM_DIRECTORY_ROUTE = "/items" as const;

export const ITEM_MY_ITEMS_PAGE_ID = "evo-item.my-items" as const;
export const ITEM_MY_ITEMS_PAGE_SOURCE =
  "app://evo-item/pages/my-items" as const;
export const ITEM_MY_ITEMS_ROUTE = "/items/my-items" as const;

export const ITEM_CREATE_PAGE_ID = "evo-item.create" as const;
export const ITEM_CREATE_PAGE_SOURCE =
  "app://evo-item/pages/create" as const;
export const ITEM_CREATE_ROUTE = "/items/new" as const;

export const ITEM_DETAIL_PAGE_ID = "evo-item.detail" as const;
export const ITEM_DETAIL_PAGE_SOURCE =
  "app://evo-item/pages/detail" as const;
export const ITEM_DETAIL_ROUTE = "/items/detail" as const;

export const ITEM_EDIT_PAGE_ID = "evo-item.edit" as const;
export const ITEM_EDIT_PAGE_SOURCE =
  "app://evo-item/pages/edit" as const;
export const ITEM_EDIT_ROUTE = "/items/edit" as const;

export const ITEM_CREATE_COMMAND = "item.create" as const;
export const ITEM_UPDATE_COMMAND = "item.update" as const;
export const ITEM_ARCHIVE_COMMAND = "item.archive" as const;

export const ITEM_PROJECTION_CAPABILITY_V010 =
  "enterprise.item.projection" as const;
export const ITEM_DIRECTORY_PROJECTION_V010 =
  "item.directory" as const;
export const ITEM_MY_ITEMS_PROJECTION_V010 =
  "item.my-stewardship" as const;
export type ItemProjectionIdV010 =
  | typeof ITEM_DIRECTORY_PROJECTION_V010
  | typeof ITEM_MY_ITEMS_PROJECTION_V010;
export const ITEM_DIRECTORY_READ_COMMAND_V010 =
  "item.projection.directory.read" as const;
export const ITEM_MY_ITEMS_READ_COMMAND_V010 =
  "item.projection.my-items.read" as const;
export const ITEM_DIRECTORY_READ_OPERATION_V010 =
  "item.projection.directory.read" as const;
export const ITEM_MY_ITEMS_READ_OPERATION_V010 =
  "item.projection.my-items.read" as const;

export function itemDetailRouteV010(itemId: string): string {
  if (!itemId.trim()) throw new Error("ITEM_ID_REQUIRED");
  return `${ITEM_DETAIL_ROUTE}?${new URLSearchParams({
    itemId: itemId.trim()
  }).toString()}`;
}

export function parseItemDetailRouteV010(
  route: string | undefined
): string | undefined {
  if (!route?.trim() || !route.trim().startsWith("/")) return undefined;
  const url = new URL(route.trim(), "http://evo.local");
  if (url.pathname !== ITEM_DETAIL_ROUTE) return undefined;
  return url.searchParams.get("itemId")?.trim() || undefined;
}

export function itemEditRouteV010(itemId: string): string {
  if (!itemId.trim()) throw new Error("ITEM_ID_REQUIRED");
  return `${ITEM_EDIT_ROUTE}?${new URLSearchParams({
    itemId: itemId.trim()
  }).toString()}`;
}

export function parseItemEditRouteV010(
  route: string | undefined
): string | undefined {
  if (!route?.trim() || !route.trim().startsWith("/")) return undefined;
  const url = new URL(route.trim(), "http://evo.local");
  if (url.pathname !== ITEM_EDIT_ROUTE) return undefined;
  return url.searchParams.get("itemId")?.trim() || undefined;
}
