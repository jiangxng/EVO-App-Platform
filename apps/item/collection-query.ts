import type {
  DataCollectionResultV010, DataCollectionQueryV010
} from "../../contracts/data-collection/query.js";
import {
  parseDataCollectionQueryV010,
  pageAuthorizedCollectionRowsV010
} from "../../foundation/collection-query/index.js";
import { ITEM_SCHEMA_V010 } from "./foundation-object.js";
import { ITEM_DIRECTORY_ROUTE, ITEM_MY_ITEMS_ROUTE } from "./constants.js";
import type {
  ItemProjectionRecordV010, ItemProjectionResultV010
} from "./projection-service.js";

const SORT_FIELDS = ["displayName", "code", "itemKind", "baseUomCode"] as const;
const CELL_FIELDS = [
  "displayName", "code", "itemKind", "baseUomCode", "description"
] as const;

/** This is a query contract, never an authorization check or private repository. */
export type ItemCollectionQueryV010 = DataCollectionQueryV010;

export function parseItemCollectionQueryV010(
  input: Record<string, unknown>
): ReturnType<typeof parseDataCollectionQueryV010> {
  return parseDataCollectionQueryV010(input, { sortableFields: SORT_FIELDS });
}

/**
 * The caller must supply a FRESH projection from ItemProjectionService.read,
 * which has already checked principal, enterprise, item row grants and fields.
 * No extension values / Responsibility assignments enter Collection cells.
 */
export function pageAuthorizedItemProjectionV010(input: {
  projection: ItemProjectionResultV010;
  query: ItemCollectionQueryV010;
}): {
  items: ItemProjectionRecordV010[];
  collection: DataCollectionResultV010;
} {
  const query = parseItemCollectionQueryV010(
    input.query as Record<string, unknown>
  );
  const readable = new Set(input.projection.readableFieldIds);
  if (!readable.has("displayName")) {
    throw new Error("ITEM_COLLECTION_DISPLAY_NAME_FORBIDDEN");
  }
  const sort = query.sort ?? "displayName";
  if (!readable.has(sort)) {
    throw new Error("ITEM_COLLECTION_SORT_FORBIDDEN");
  }
  const paged = pageAuthorizedCollectionRowsV010({
    authorizedRows: input.projection.items,
    query,
    stableId: row => row.item.itemId,
    searchText: row => [
      row.item.displayName,
      ...(readable.has("code") ? [row.item.code] : [])
    ].join(" "),
    sortValue: (row, field) => {
      if (!readable.has(field)) {
        throw new Error("ITEM_COLLECTION_SORT_FORBIDDEN");
      }
      const value = row.item[field as typeof SORT_FIELDS[number]];
      return String(value);
    },
    defaultSortField: "displayName"
  });
  const visibleFields = CELL_FIELDS.filter(id => readable.has(id));
  return {
    items: paged.rows,
    collection: {
      contractVersion: "0.1.0",
      collectionId: input.projection.projectionId,
      schemaRef: ITEM_SCHEMA_V010,
      readableFieldIds: [...visibleFields],
      rows: paged.rows.map(record => ({
        rowId: record.item.itemId,
        cells: Object.fromEntries(visibleFields.map(id => [
          id, record.item[id] ?? null
        ]))
      })),
      pageInfo: paged.pageInfo
    }
  };
}

function routePath(projectionRoute: string): string {
  if (projectionRoute !== ITEM_DIRECTORY_ROUTE
    && projectionRoute !== ITEM_MY_ITEMS_ROUTE) {
    throw new Error("ITEM_COLLECTION_ROUTE_INVALID");
  }
  return projectionRoute;
}

/** URL selection is UI intent; on every navigation Host must reauthorize READ. */
export function parseItemCollectionRouteV010(
  value: string | undefined,
  expectedPath: string
): ItemCollectionQueryV010 {
  const path = routePath(expectedPath);
  if (!value) return {};
  if (!value.startsWith("/") || value.startsWith("//")
    || value.includes("#") || value.includes("\\")
    || value.length > 600) throw new Error("ITEM_COLLECTION_ROUTE_INVALID");
  const parsed = new URL(value, "https://evo.invalid");
  if (parsed.pathname !== path || parsed.origin !== "https://evo.invalid") {
    throw new Error("ITEM_COLLECTION_ROUTE_INVALID");
  }
  const query: Record<string, unknown> = {};
  for (const [key, raw] of parsed.searchParams) {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      throw new Error("ITEM_COLLECTION_PARAMETER_DUPLICATE");
    }
    query[key] = key === "page" || key === "pageSize" ? Number(raw) : raw;
  }
  return parseItemCollectionQueryV010(query);
}

export function itemCollectionQueryRouteV010(
  path: string,
  input: ItemCollectionQueryV010,
  page?: number
): string {
  routePath(path);
  const query = parseItemCollectionQueryV010(
    { ...input, ...(page !== undefined ? { page } : {}) }
  );
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.sort) params.set("sort", query.sort);
  params.set("direction", query.direction);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return path + "?" + params.toString();
}
