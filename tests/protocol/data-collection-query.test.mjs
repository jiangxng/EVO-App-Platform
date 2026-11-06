import test from "node:test";
import assert from "node:assert/strict";
import {
  parseDataCollectionQueryV010,
  pageAuthorizedCollectionRowsV010
} from "../../dist/foundation/collection-query/index.js";
import {
  queryBusinessDictionaryCollectionV010
} from "../../dist/apps/business-dictionary/collection-query.js";

test("CV-01 bounded collection query parser denies unsupported fields and invalid limits", () => {
  const p = { sortableFields: ["code", "title"] };
  assert.deepEqual(parseDataCollectionQueryV010({}, p), {
    search: undefined, sort: undefined, direction: "asc", page: 0, pageSize: 25
  });
  assert.equal(parseDataCollectionQueryV010({
    search: "  HONG KONG  ", sort: "code", direction: "desc", page: 1, pageSize: 2
  }, p).search, "HONG KONG");
  for (const [values, expected] of [
    [{ sql: "DROP TABLE" }, "COLLECTION_QUERY_FIELD_UNSUPPORTED"],
    [{ sort: "secret" }, "COLLECTION_QUERY_SORT_INVALID"],
    [{ search: "x".repeat(121) }, "COLLECTION_QUERY_SEARCH_INVALID"],
    [{ direction: "sideways" }, "COLLECTION_QUERY_DIRECTION_INVALID"],
    [{ page: -1 }, "COLLECTION_QUERY_PAGE_INVALID"],
    [{ page: 1.5 }, "COLLECTION_QUERY_PAGE_INVALID"],
    [{ page: 100001 }, "COLLECTION_QUERY_PAGE_INVALID"],
    [{ pageSize: 0 }, "COLLECTION_QUERY_PAGE_SIZE_INVALID"],
    [{ pageSize: 101 }, "COLLECTION_QUERY_PAGE_SIZE_INVALID"],
    [{ pageSize: "25" }, "COLLECTION_QUERY_PAGE_SIZE_INVALID"]
  ]) {
    assert.throws(() => parseDataCollectionQueryV010(values, p), new RegExp(expected));
  }
  assert.throws(() => parseDataCollectionQueryV010(null, p), /COLLECTION_QUERY_INVALID/);
});

test("CV-01 helper only pages already-authorized rows with stable tie-breaking", () => {
  const authorizedRows = [
    { id: "b", code: "X", value: 8 },
    { id: "a", code: "X", value: 8 },
    { id: "z", code: "Y", value: 5 }
  ];
  const input = {
    authorizedRows,
    query: parseDataCollectionQueryV010({sort:"code",pageSize:1,page:0},{sortableFields:["code"]}),
    stableId: row => row.id,
    searchText: row => row.code,
    sortValue: (row, field) => row[field],
    defaultSortField: "code"
  };
  const first = pageAuthorizedCollectionRowsV010(input);
  assert.deepEqual(first.rows.map(x=>x.id), ["a"]);
  assert.deepEqual(first.pageInfo, {
    page:0, pageSize:1,total:3,hasMore:true,countKind:"EXACT"
  });
  const later = pageAuthorizedCollectionRowsV010({
    ...input,query:{...input.query,page:1}
  });
  assert.deepEqual(later.rows.map(x=>x.id),["b"]);
  assert.equal(authorizedRows[0].id,"b","never mutate caller-owned records");
});

test("CV-01 dictionary collection emits only allowed fields; not draft internals", () => {
  const dictionaries = [
    { contractVersion:"0.1.0",contextId:"enterprise:a",dictionaryId:"customer-level",
      displayName:"Customer level",version:3,state:"PUBLISHED",
      options:[{code:"TOP",label:{default:"VIP"},status:"ACTIVE"}] },
    { contractVersion:"0.1.0",contextId:"enterprise:a",dictionaryId:"supplier-level",
      displayName:"Supplier level",version:2,state:"DRAFT",options:[] }
  ];
  const r = queryBusinessDictionaryCollectionV010({
    dictionaries, query:{search:"level",sort:"version",direction:"desc",pageSize:1,page:0}
  });
  assert.equal(r.contractVersion,"0.1.0");
  assert.equal(r.collectionId,"evo.business-dictionary.directory");
  assert.equal(r.pageInfo.total,2);
  assert.equal(r.pageInfo.hasMore,true);
  assert.equal(r.rows.length,1);
  assert.equal(r.rows[0].rowId,"customer-level");
  assert.equal(r.rows[0].cells.optionCount,1);
  assert.equal("options" in r.rows[0].cells,false);
  assert.equal("contextId" in r.rows[0].cells,false);
  assert.equal(r.readableFieldIds.includes("options"),false);
  assert.deepEqual(queryBusinessDictionaryCollectionV010({
    dictionaries,query:{search:"supplier",pageSize:10}
  }).rows.map(x=>x.rowId),["supplier-level"]);
});
