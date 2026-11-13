import type { BusinessDictionarySnapshotV010 } from "../../contracts/reference-data/dictionary.js";
import {
  BUSINESS_DICTIONARY_COLLECTION_ID_V010,
  BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010,
  queryBusinessDictionaryCollectionV010
} from "./collection-query.js";

/** Domain-owned authorized count; not an Eidos chart and not a saved view. */
export const BUSINESS_DICTIONARY_STATE_COUNT_METRIC_V010 =
  "dictionary.count.by-state" as const;
export const BUSINESS_DICTIONARY_AGGREGATE_PRIVACY_THRESHOLD_V010 = 3 as const;
/**
 * This in-memory dictionary repository is a bounded small-set owner. A remote
 * or large domain MUST use its own indexed, access-filtered aggregate READ.
 */
export const BUSINESS_DICTIONARY_AGGREGATE_MAX_ROWS_V010 = 10000 as const;

export interface BusinessDictionaryStateAggregateV010 {
  contractVersion: "0.1.0";
  kind: "business-dictionary.collection.aggregate.state";
  collectionId: typeof BUSINESS_DICTIONARY_COLLECTION_ID_V010;
  schemaRef: typeof BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010;
  metricId: typeof BUSINESS_DICTIONARY_STATE_COUNT_METRIC_V010;
  dimensionFieldId: "state";
  unit: "dictionary";
  scope: "AUTHORIZED_ALL_MATCHING_ROWS";
  asOf: string;
  query: { view: "all" | "draft" | "published"; search: string };
  privacy: { minimumVisibleBucketCount: 3; suppressionApplied: boolean };
  countKind: "EXACT" | "SUPPRESSED";
  total: number | null;
  buckets: Array<{
    key: "DRAFT" | "PUBLISHED";
    count: number | null;
    countKind: "EXACT" | "SUPPRESSED";
  }>;
}

/**
 * Use the identical allowlisted Collection query, not a second filter parser.
 * A single already-authorized Owner snapshot is reused for every state. We
 * never sum the current UI page or derive unauthorized option values.
 *
 * Suppression is a bounded disclosure guard, NOT differential privacy. The
 * caller already possesses ordinary row-level dictionary READ permission.
 */
export function aggregateBusinessDictionaryStatesV010(input: {
  dictionaries: readonly BusinessDictionarySnapshotV010[];
  contextId: string;
  query: Record<string, unknown>;
  now: Date;
}): BusinessDictionaryStateAggregateV010 {
  if (!Array.isArray(input.dictionaries)
    || input.dictionaries.length > BUSINESS_DICTIONARY_AGGREGATE_MAX_ROWS_V010) {
    throw new Error("BUSINESS_DICTIONARY_AGGREGATE_BUDGET_EXCEEDED");
  }
  if (!input.contextId || input.dictionaries.some(d =>
    d.contextId !== input.contextId || (d.state !== "DRAFT" && d.state !== "PUBLISHED"))) {
    throw new Error("BUSINESS_DICTIONARY_AGGREGATE_OWNER_SCOPE_INVALID");
  }
  if (!(input.now instanceof Date) || !Number.isFinite(input.now.getTime())) {
    throw new Error("BUSINESS_DICTIONARY_AGGREGATE_AS_OF_INVALID");
  }
  // All keys, including optional page/sort, are validated by the original
  // dictionary collection parser. Pagination is intentionally ignored for
  // this aggregate; only the currently authorized full filtered set counts.
  const all = queryBusinessDictionaryCollectionV010({
    dictionaries: input.dictionaries, query: input.query
  });
  const view = (input.query.view ?? "all") as "all" | "draft" | "published";
  const counts = (["DRAFT","PUBLISHED"] as const).map(key => {
    const visible = view === "all" || view === key.toLowerCase();
    const count = visible
      ? queryBusinessDictionaryCollectionV010({
          dictionaries: input.dictionaries,
          query: { ...input.query, view: key.toLowerCase(), page: 0, pageSize: 1 }
        }).pageInfo.total
      : 0;
    const suppressed = count > 0
      && count < BUSINESS_DICTIONARY_AGGREGATE_PRIVACY_THRESHOLD_V010;
    return {
      key, count: suppressed ? null : count,
      countKind: suppressed ? "SUPPRESSED" as const : "EXACT" as const
    };
  });
  const suppressionApplied = counts.some(bucket => bucket.countKind === "SUPPRESSED");
  return {
    contractVersion: "0.1.0",
    kind: "business-dictionary.collection.aggregate.state",
    collectionId: BUSINESS_DICTIONARY_COLLECTION_ID_V010,
    schemaRef: BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010,
    metricId: BUSINESS_DICTIONARY_STATE_COUNT_METRIC_V010,
    dimensionFieldId: "state",
    unit: "dictionary",
    scope: "AUTHORIZED_ALL_MATCHING_ROWS",
    asOf: input.now.toISOString(),
    query: {
      view,
      search: typeof input.query.search === "string"
        ? input.query.search.trim() : ""
    },
    privacy: {
      minimumVisibleBucketCount: BUSINESS_DICTIONARY_AGGREGATE_PRIVACY_THRESHOLD_V010,
      suppressionApplied
    },
    countKind: suppressionApplied ? "SUPPRESSED" : "EXACT",
    total: suppressionApplied ? null : all.pageInfo.total,
    buckets: counts
  };
}
