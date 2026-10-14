import type { CounterpartySubjectV010 } from "./repository.js";

/** BEX-01: bounded read-side query, never an authority or SQL expression. */
export interface CounterpartyProjectionQueryV010 {
  search?: string;
  sort?: "displayName" | "code" | "status";
  direction?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface CounterpartyProjectionPageInfoV010 {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

const keys = new Set(["search", "sort", "direction", "page", "pageSize"]);
export function parseCounterpartyProjectionQueryV010(
  values: Record<string, unknown>
): CounterpartyProjectionQueryV010 {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    throw new Error("COUNTERPARTY_QUERY_INVALID");
  }
  for (const key of Object.keys(values)) {
    if (!keys.has(key)) throw new Error("COUNTERPARTY_QUERY_FIELD_UNSUPPORTED");
  }
  if (values.search !== undefined && (
    typeof values.search !== "string" || values.search.length > 120
  )) throw new Error("COUNTERPARTY_QUERY_SEARCH_INVALID");
  if (values.sort !== undefined
    && !["displayName", "code", "status"].includes(String(values.sort))) {
    throw new Error("COUNTERPARTY_QUERY_SORT_INVALID");
  }
  if (values.direction !== undefined
    && values.direction !== "asc" && values.direction !== "desc") {
    throw new Error("COUNTERPARTY_QUERY_DIRECTION_INVALID");
  }
  if (values.page !== undefined
    && (!Number.isSafeInteger(values.page) || Number(values.page) < 0
      || Number(values.page) > 100000)) {
    throw new Error("COUNTERPARTY_QUERY_PAGE_INVALID");
  }
  if (values.pageSize !== undefined
    && (!Number.isSafeInteger(values.pageSize) || Number(values.pageSize) < 1
      || Number(values.pageSize) > 100)) {
    throw new Error("COUNTERPARTY_QUERY_PAGE_SIZE_INVALID");
  }
  return {
    ...(values.search !== undefined ? { search: String(values.search).trim() } : {}),
    ...(values.sort !== undefined ? { sort: values.sort as CounterpartyProjectionQueryV010["sort"] } : {}),
    ...(values.direction !== undefined ? { direction: values.direction as CounterpartyProjectionQueryV010["direction"] } : {}),
    ...(values.page !== undefined ? { page: values.page as number } : {}),
    ...(values.pageSize !== undefined ? { pageSize: values.pageSize as number } : {})
  };
}

/** Query only the already authorized and role-scoped records. */
export function pageCounterpartyProjectionV010(input: {
  counterparties: readonly CounterpartySubjectV010[];
  readableFieldIds: readonly string[];
  query: CounterpartyProjectionQueryV010;
}): { counterparties: CounterpartySubjectV010[]; pageInfo: CounterpartyProjectionPageInfoV010 } {
  const query = parseCounterpartyProjectionQueryV010(
    input.query as Record<string, unknown>
  );
  const readable = new Set(input.readableFieldIds);
  const search = (query.search ?? "").toLocaleLowerCase();
  const sort = query.sort ?? "displayName";
  if (!readable.has(sort)) throw new Error("COUNTERPARTY_QUERY_SORT_FORBIDDEN");
  const direction = query.direction === "desc" ? -1 : 1;
  const filtered = input.counterparties.filter(item =>
    !search || item.displayName.toLocaleLowerCase().includes(search)
      || (readable.has("code") && item.code.toLocaleLowerCase().includes(search))
  );
  filtered.sort((a, b) =>
    direction * String(a[sort]).localeCompare(String(b[sort]))
    || a.counterpartyId.localeCompare(b.counterpartyId)
  );
  const page = query.page ?? 0, pageSize = query.pageSize ?? 50;
  const start = page * pageSize;
  return {
    counterparties: filtered.slice(start, start + pageSize),
    pageInfo: {
      page, pageSize, total: filtered.length,
      hasMore: start + pageSize < filtered.length
    }
  };
}
