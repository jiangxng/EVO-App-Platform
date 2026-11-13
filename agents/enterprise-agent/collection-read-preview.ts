import {
  BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010,
  BUSINESS_DICTIONARY_DIRECTORY_ROUTE_V010
} from "../../contracts/reference-data/dictionary-operations.js";
import {
  COUNTERPARTY_MY_CUSTOMERS_COLLECTION_QUERY_V010,
  COUNTERPARTY_MY_CUSTOMERS_ROUTE,
  COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010,
  COUNTERPARTY_MY_SUPPLIERS_ROUTE
} from "../../apps/counterparty/constants.js";
import {
  businessDictionaryDirectoryQueryRouteV010,
  parseBusinessDictionaryDirectoryRouteV010
} from "../../apps/business-dictionary/directory-query.js";
import {
  counterpartyProjectionQueryRouteV010,
  parseCounterpartyProjectionRouteQueryV010
} from "../../apps/counterparty/projection-query.js";

/**
 * CV-05: present the result of an already authorized, actually executed
 * Collection READ. This adapter grants no permissions and never queries data.
 * Each route is interpreted by the existing Eidos/domain page and triggers a
 * fresh Host READ in the user's current context.
 */
export const PERSONAL_AGENT_COLLECTION_PREVIEW_OPERATIONS_V010: readonly string[] = [
  BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010,
  COUNTERPARTY_MY_CUSTOMERS_COLLECTION_QUERY_V010,
  COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010
];

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function viewRoute(operationId: string, query: Record<string, unknown>): string {
  const route = operationId === BUSINESS_DICTIONARY_COLLECTION_QUERY_COMMAND_V010
    ? BUSINESS_DICTIONARY_DIRECTORY_ROUTE_V010
    : operationId === COUNTERPARTY_MY_CUSTOMERS_COLLECTION_QUERY_V010
      ? COUNTERPARTY_MY_CUSTOMERS_ROUTE
      : operationId === COUNTERPARTY_MY_SUPPLIERS_COLLECTION_QUERY_V010
        ? COUNTERPARTY_MY_SUPPLIERS_ROUTE
        : undefined;
  if (!route) throw new Error("PERSONAL_AGENT_COLLECTION_PREVIEW_NOT_SUPPORTED");

  // Never let untrusted model text supply a hostname, path or arbitrary filter.
  // The existing domain parsers enforce every allowed parameter and value.
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if ((typeof value !== "string" && typeof value !== "number")
      || (typeof value === "number" && !Number.isFinite(value))) {
      throw new Error("PERSONAL_AGENT_COLLECTION_PREVIEW_QUERY_INVALID");
    }
    params.set(key, String(value));
  }
  const candidate = route + (params.size ? "?" + params.toString() : "");
  if (route === BUSINESS_DICTIONARY_DIRECTORY_ROUTE_V010) {
    const parsed = parseBusinessDictionaryDirectoryRouteV010(candidate);
    return businessDictionaryDirectoryQueryRouteV010(parsed, parsed.query.page ?? 0);
  }
  const parsed = parseCounterpartyProjectionRouteQueryV010(candidate, route);
  return counterpartyProjectionQueryRouteV010(route, parsed, parsed.page ?? 0);
}

const PREVIEW_MAX_ROWS_V010 = 10;

/**
 * Only accepts a DataCollectionResult returned by the existing domain
 * action (dictionary wraps it in {data}, counterparty returns it directly).
 * Do not let an LLM-provided result, unsupported operation, or page-sized
 * sample pose as an aggregate over all authorized records.
 */
export function presentPersonalAgentCollectionReadV010(input: {
  operationId: string;
  query: Record<string, unknown>;
  result: unknown;
  correlationId: string;
}) {
  if (!PERSONAL_AGENT_COLLECTION_PREVIEW_OPERATIONS_V010.includes(input.operationId)) {
    throw new Error("PERSONAL_AGENT_COLLECTION_PREVIEW_NOT_SUPPORTED");
  }
  const route = viewRoute(input.operationId, input.query);
  const envelope = input.result;
  const collection = record(envelope) && record(envelope.data)
    ? envelope.data : envelope;
  if (!record(collection) || collection.contractVersion !== "0.1.0"
    || typeof collection.collectionId !== "string"
    || typeof collection.schemaRef !== "string"
    || !Array.isArray(collection.readableFieldIds)
    || !collection.readableFieldIds.every(field => typeof field === "string")
    || !Array.isArray(collection.rows) || !record(collection.pageInfo)) {
    throw new Error("PERSONAL_AGENT_COLLECTION_PREVIEW_RESULT_INVALID");
  }
  const info = collection.pageInfo;
  if (!Number.isSafeInteger(info.page) || (info.page as number) < 0
    || !Number.isSafeInteger(info.pageSize) || (info.pageSize as number) < 1
    || !Number.isSafeInteger(info.total) || (info.total as number) < 0
    || typeof info.hasMore !== "boolean"
    || info.countKind !== "EXACT") {
    throw new Error("PERSONAL_AGENT_COLLECTION_PREVIEW_RESULT_INVALID");
  }

  const readable = new Set(collection.readableFieldIds as string[]);
  const rows = collection.rows.slice(0, PREVIEW_MAX_ROWS_V010).map(row => {
    if (!record(row) || typeof row.rowId !== "string" || !record(row.cells)) {
      throw new Error("PERSONAL_AGENT_COLLECTION_PREVIEW_RESULT_INVALID");
    }
    const cells: Record<string, string | number | boolean | null> = {};
    for (const [field, value] of Object.entries(row.cells)) {
      if (!readable.has(field)) continue;
      if (value === null || typeof value === "string"
        || typeof value === "boolean"
        || (typeof value === "number" && Number.isFinite(value))) {
        cells[field] = value;
      }
    }
    return { rowId: row.rowId, cells };
  });

  return {
    contractVersion: "0.1.0" as const,
    kind: "evo.personal-agent-collection.read-preview" as const,
    operationId: input.operationId,
    correlationId: input.correlationId,
    collectionId: collection.collectionId,
    schemaRef: collection.schemaRef,
    readableFieldIds: [...readable],
    query: { ...input.query },
    pageInfo: {
      page: info.page as number, pageSize: info.pageSize as number,
      total: info.total as number, hasMore: info.hasMore as boolean,
      countKind: "EXACT" as const
    },
    rows,
    previewTruncated: collection.rows.length > PREVIEW_MAX_ROWS_V010,
    navigation: {
      route,
      kind: "EIDOS_COLLECTION_PAGE" as const,
      authority: "PRESENTATION_ONLY_REAUTHORIZE_ON_OPEN" as const
    }
  };
}
