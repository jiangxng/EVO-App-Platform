import type {
  DataCollectionQueryV010,
  DataCollectionPageInfoV010
} from "../../contracts/data-collection/query.js";

export interface DataCollectionQueryPolicyV010 {
  sortableFields: readonly string[];
  maxPageSize?: number;
}

/** A bounded query parser. It grants no read access and accepts no SQL/AST. */
export function parseDataCollectionQueryV010(
  values: Record<string, unknown>,
  policy: DataCollectionQueryPolicyV010
): Required<Pick<DataCollectionQueryV010, "page" | "pageSize" | "direction">>
  & Pick<DataCollectionQueryV010, "search" | "sort"> {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    throw new Error("COLLECTION_QUERY_INVALID");
  }
  const keys = new Set(["search", "sort", "direction", "page", "pageSize"]);
  for (const key of Object.keys(values)) {
    if (!keys.has(key)) throw new Error("COLLECTION_QUERY_FIELD_UNSUPPORTED");
  }
  if (values.search !== undefined
    && (typeof values.search !== "string" || values.search.length > 120)) {
    throw new Error("COLLECTION_QUERY_SEARCH_INVALID");
  }
  if (values.sort !== undefined
    && (typeof values.sort !== "string" || !policy.sortableFields.includes(values.sort))) {
    throw new Error("COLLECTION_QUERY_SORT_INVALID");
  }
  if (values.direction !== undefined
    && values.direction !== "asc" && values.direction !== "desc") {
    throw new Error("COLLECTION_QUERY_DIRECTION_INVALID");
  }
  if (values.page !== undefined
    && (!Number.isSafeInteger(values.page) || (values.page as number) < 0
      || (values.page as number) > 100000)) {
    throw new Error("COLLECTION_QUERY_PAGE_INVALID");
  }
  const maxPageSize = policy.maxPageSize ?? 100;
  if (!Number.isSafeInteger(maxPageSize) || maxPageSize < 1 || maxPageSize > 100) {
    throw new Error("COLLECTION_QUERY_POLICY_INVALID");
  }
  if (values.pageSize !== undefined
    && (!Number.isSafeInteger(values.pageSize) || (values.pageSize as number) < 1
      || (values.pageSize as number) > maxPageSize)) {
    throw new Error("COLLECTION_QUERY_PAGE_SIZE_INVALID");
  }
  return {
    search: (values.search as string | undefined)?.trim(),
    sort: values.sort as string | undefined,
    direction: (values.direction as "asc" | "desc" | undefined) ?? "asc",
    page: (values.page as number | undefined) ?? 0,
    pageSize: (values.pageSize as number | undefined) ?? Math.min(25, maxPageSize)
  };
}

/**
 * Opt-in small-set helper, run only after the domain owner applies row/field
 * authorization. Large or remote sources MUST query their own indexed backend.
 * The caller supplies only readable text/sort keys, never private fields.
 */
export function pageAuthorizedCollectionRowsV010<Row>(input: {
  authorizedRows: readonly Row[];
  query: ReturnType<typeof parseDataCollectionQueryV010>;
  stableId(row: Row): string;
  searchText(row: Row): string;
  sortValue(row: Row, field: string): string | number;
  defaultSortField: string;
}): { rows: Row[]; pageInfo: DataCollectionPageInfoV010 } {
  const search = (input.query.search ?? "").toLocaleLowerCase();
  const sort = input.query.sort ?? input.defaultSortField;
  const direction = input.query.direction === "desc" ? -1 : 1;
  const sorted = input.authorizedRows.filter(row =>
    !search || input.searchText(row).toLocaleLowerCase().includes(search)
  );
  sorted.sort((a, b) => {
    const av = input.sortValue(a, sort);
    const bv = input.sortValue(b, sort);
    const order = typeof av === "number" && typeof bv === "number"
      ? av - bv : String(av).localeCompare(String(bv));
    return direction * order || input.stableId(a).localeCompare(input.stableId(b));
  });
  const start = input.query.page * input.query.pageSize;
  return {
    rows: sorted.slice(start, start + input.query.pageSize),
    pageInfo: {
      page: input.query.page,
      pageSize: input.query.pageSize,
      total: sorted.length,
      hasMore: start + input.query.pageSize < sorted.length,
      countKind: "EXACT"
    }
  };
}
