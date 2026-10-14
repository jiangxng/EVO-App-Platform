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

/** Decode only the current projection path's public query; no external redirects. */
export function parseCounterpartyProjectionRouteQueryV010(
  route: string | null | undefined,
  expectedPath: string
): CounterpartyProjectionQueryV010 {
  if (!route) return {};
  if (!route.startsWith("/") || route.startsWith("//")
    || route.includes("#") || route.includes("\\")
    || route.length > 600) throw new Error("COUNTERPARTY_QUERY_ROUTE_INVALID");
  const parsed = new URL(route, "https://evo.invalid");
  if (parsed.pathname !== expectedPath) {
    throw new Error("COUNTERPARTY_QUERY_ROUTE_INVALID");
  }
  const values: Record<string, unknown> = {};
  for (const [key, value] of parsed.searchParams) {
    if (Object.prototype.hasOwnProperty.call(values,key)) {
      throw new Error("COUNTERPARTY_QUERY_DUPLICATE_PARAMETER");
    }
    values[key] = key === "page" || key === "pageSize" ? Number(value) : value;
  }
  return parseCounterpartyProjectionQueryV010(values);
}

export function counterpartyProjectionQueryRouteV010(
  path: string,
  query: CounterpartyProjectionQueryV010,
  page: number
): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.sort) params.set("sort", query.sort);
  if (query.direction) params.set("direction", query.direction);
  params.set("page", String(page));
  params.set("pageSize", String(query.pageSize ?? 25));
  return path + "?" + params.toString();
}

/** Field-level grants apply to transmitted JSON, not merely visible columns. */
export type CounterpartyProjectionRecordV010 =
  Pick<CounterpartySubjectV010, "contractVersion" | "counterpartyId" | "displayName">
  & Partial<Omit<CounterpartySubjectV010, "contractVersion" | "counterpartyId" | "displayName">>;

export function readableCounterpartyProjectionRowsV010(
  records: readonly CounterpartySubjectV010[],
  readableFieldIds: readonly string[]
): CounterpartyProjectionRecordV010[] {
  const fields = new Set(readableFieldIds);
  return records.map(record => Object.fromEntries(
    Object.entries(record).filter(([key]) =>
      key === "contractVersion" || key === "counterpartyId"
      || key === "displayName" || fields.has(key)
    )
  ) as CounterpartyProjectionRecordV010);
}
