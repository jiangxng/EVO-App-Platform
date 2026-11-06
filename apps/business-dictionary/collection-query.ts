import type { BusinessDictionarySnapshotV010 } from "../../contracts/reference-data/dictionary.js";
import type { DataCollectionResultV010 } from "../../contracts/data-collection/query.js";
import {
  pageAuthorizedCollectionRowsV010,
  parseDataCollectionQueryV010
} from "../../foundation/collection-query/index.js";

export const BUSINESS_DICTIONARY_COLLECTION_ID_V010 =
  "evo.business-dictionary.directory" as const;
export const BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010 =
  "evo.business-dictionary.directory/0.1.0" as const;

const readableFieldIds = ["dictionaryId", "displayName", "state", "version", "optionCount"];

/**
 * Owner-scoped read adapter. Never emits draft option values/aliases or
 * enterprise resource internals. Caller must first authorize current context.
 */
export function queryBusinessDictionaryCollectionV010(input: {
  dictionaries: readonly BusinessDictionarySnapshotV010[];
  query: Record<string, unknown>;
}): DataCollectionResultV010 {
  const query = parseDataCollectionQueryV010(input.query, {
    sortableFields: ["dictionaryId", "displayName", "state", "version"]
  });
  const paged = pageAuthorizedCollectionRowsV010({
    authorizedRows: input.dictionaries,
    query,
    stableId: dictionary => dictionary.dictionaryId,
    searchText: dictionary =>
      [dictionary.dictionaryId, dictionary.displayName ?? ""].join(" "),
    sortValue: (dictionary, field) => {
      switch (field) {
        case "dictionaryId": return dictionary.dictionaryId;
        case "displayName": return dictionary.displayName ?? dictionary.dictionaryId;
        case "state": return dictionary.state;
        case "version": return dictionary.version;
        default: throw new Error("COLLECTION_QUERY_SORT_INVALID");
      }
    },
    defaultSortField: "dictionaryId"
  });
  return {
    contractVersion: "0.1.0",
    collectionId: BUSINESS_DICTIONARY_COLLECTION_ID_V010,
    schemaRef: BUSINESS_DICTIONARY_COLLECTION_SCHEMA_V010,
    readableFieldIds: [...readableFieldIds],
    rows: paged.rows.map(dictionary => ({
      rowId: dictionary.dictionaryId,
      cells: {
        dictionaryId: dictionary.dictionaryId,
        displayName: dictionary.displayName ?? dictionary.dictionaryId,
        state: dictionary.state,
        version: dictionary.version,
        optionCount: dictionary.options.length
      }
    })),
    pageInfo: paged.pageInfo
  };
}
