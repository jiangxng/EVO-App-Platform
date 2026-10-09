export const COUNTERPARTY_PACKAGE_ID = "evo-counterparty" as const;
export const COUNTERPARTY_FEATURE_ID = "evo-counterparty.default" as const;

export const COUNTERPARTY_DIRECTORY_PAGE_ID =
  "evo-counterparty.directory" as const;
export const COUNTERPARTY_DIRECTORY_PAGE_SOURCE =
  "app://evo-counterparty/pages/directory" as const;
export const COUNTERPARTY_DIRECTORY_ROUTE = "/counterparties" as const;

export const COUNTERPARTY_CUSTOMERS_PAGE_ID =
  "evo-counterparty.customers" as const;
export const COUNTERPARTY_CUSTOMERS_PAGE_SOURCE =
  "app://evo-counterparty/pages/customers" as const;
export const COUNTERPARTY_CUSTOMERS_ROUTE =
  "/counterparties/customers" as const;

export const COUNTERPARTY_SUPPLIERS_PAGE_ID =
  "evo-counterparty.suppliers" as const;
export const COUNTERPARTY_SUPPLIERS_PAGE_SOURCE =
  "app://evo-counterparty/pages/suppliers" as const;
export const COUNTERPARTY_SUPPLIERS_ROUTE =
  "/counterparties/suppliers" as const;

export const COUNTERPARTY_MY_CUSTOMERS_PAGE_ID =
  "evo-counterparty.my-customers" as const;
export const COUNTERPARTY_MY_CUSTOMERS_PAGE_SOURCE =
  "app://evo-counterparty/pages/my-customers" as const;
export const COUNTERPARTY_MY_CUSTOMERS_ROUTE =
  "/counterparties/my-customers" as const;

export const COUNTERPARTY_MY_SUPPLIERS_PAGE_ID =
  "evo-counterparty.my-suppliers" as const;
export const COUNTERPARTY_MY_SUPPLIERS_PAGE_SOURCE =
  "app://evo-counterparty/pages/my-suppliers" as const;
export const COUNTERPARTY_MY_SUPPLIERS_ROUTE =
  "/counterparties/my-suppliers" as const;

export const COUNTERPARTY_CREATE_PAGE_ID =
  "evo-counterparty.create" as const;
export const COUNTERPARTY_CREATE_PAGE_SOURCE =
  "app://evo-counterparty/pages/create" as const;
export const COUNTERPARTY_CREATE_ROUTE = "/counterparties/new" as const;

export const COUNTERPARTY_DETAIL_PAGE_ID =
  "evo-counterparty.detail" as const;
export const COUNTERPARTY_DETAIL_PAGE_SOURCE =
  "app://evo-counterparty/pages/detail" as const;
export const COUNTERPARTY_DETAIL_ROUTE = "/counterparties/detail" as const;

export const COUNTERPARTY_EDIT_PAGE_ID =
  "evo-counterparty.edit" as const;
export const COUNTERPARTY_EDIT_PAGE_SOURCE =
  "app://evo-counterparty/pages/edit" as const;
export const COUNTERPARTY_EDIT_ROUTE = "/counterparties/edit" as const;

export const COUNTERPARTY_CREATE_COMMAND =
  "counterparty.create" as const;
export const COUNTERPARTY_UPDATE_COMMAND =
  "counterparty.update" as const;
export const COUNTERPARTY_ARCHIVE_COMMAND =
  "counterparty.archive" as const;
export const COUNTERPARTY_ASSIGN_ROLE_COMMAND =
  "counterparty.role.assign" as const;
export const COUNTERPARTY_REMOVE_ROLE_COMMAND =
  "counterparty.role.remove" as const;

export const COUNTERPARTY_WRITE_AUTHORIZATION_ACTION =
  "counterparty.write" as const;

export function counterpartyDetailRouteV010(
  counterpartyId: string
): string {
  if (!counterpartyId.trim()) throw new Error("COUNTERPARTY_ID_REQUIRED");
  const query = new URLSearchParams({
    counterpartyId: counterpartyId.trim()
  });
  return `${COUNTERPARTY_DETAIL_ROUTE}?${query.toString()}`;
}

export function parseCounterpartyDetailRouteV010(
  route: string | undefined
): string | undefined {
  if (!route?.trim() || !route.trim().startsWith("/")) return undefined;
  const url = new URL(route.trim(), "http://evo.local");
  if (url.pathname !== COUNTERPARTY_DETAIL_ROUTE) return undefined;
  return url.searchParams.get("counterpartyId")?.trim() || undefined;
}


export function counterpartyEditRouteV010(
  counterpartyId: string
): string {
  if (!counterpartyId.trim()) throw new Error("COUNTERPARTY_ID_REQUIRED");
  const query = new URLSearchParams({
    counterpartyId: counterpartyId.trim()
  });
  return `${COUNTERPARTY_EDIT_ROUTE}?${query.toString()}`;
}

export function parseCounterpartyEditRouteV010(
  route: string | undefined
): string | undefined {
  if (!route?.trim() || !route.trim().startsWith("/")) return undefined;
  const url = new URL(route.trim(), "http://evo.local");
  if (url.pathname !== COUNTERPARTY_EDIT_ROUTE) return undefined;
  return url.searchParams.get("counterpartyId")?.trim() || undefined;
}


export const COUNTERPARTY_PROJECTION_CAPABILITY_V010 =
  "enterprise.counterparty.projection" as const;
export const COUNTERPARTY_MY_CUSTOMERS_READ_COMMAND_V010 =
  "counterparty.projection.my-customers.read" as const;
export const COUNTERPARTY_MY_SUPPLIERS_READ_COMMAND_V010 =
  "counterparty.projection.my-suppliers.read" as const;
export const COUNTERPARTY_MY_CUSTOMERS_READ_OPERATION_V010 =
  "counterparty.projection.my-customers.read" as const;
export const COUNTERPARTY_MY_SUPPLIERS_READ_OPERATION_V010 =
  "counterparty.projection.my-suppliers.read" as const;
