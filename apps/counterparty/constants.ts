export const COUNTERPARTY_PACKAGE_ID = "evo-counterparty" as const;
export const COUNTERPARTY_FEATURE_ID = "evo-counterparty.default" as const;

export const COUNTERPARTY_DIRECTORY_PAGE_ID =
  "evo-counterparty.directory" as const;
export const COUNTERPARTY_DIRECTORY_PAGE_SOURCE =
  "app://evo-counterparty/pages/directory" as const;
export const COUNTERPARTY_DIRECTORY_ROUTE = "/counterparties" as const;

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

export const COUNTERPARTY_CREATE_COMMAND =
  "counterparty.create" as const;
export const COUNTERPARTY_ARCHIVE_COMMAND =
  "counterparty.archive" as const;

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
