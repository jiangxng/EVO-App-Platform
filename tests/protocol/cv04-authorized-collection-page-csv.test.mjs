import test from "node:test";
import assert from "node:assert/strict";
import { serializeAuthorizedCollectionPageCsvV010 } from "../../dist/foundation/collection-query/page-csv.js";
import { queryBusinessDictionaryCollectionV010 } from "../../dist/apps/business-dictionary/collection-query.js";

function samplePage() {
  return queryBusinessDictionaryCollectionV010({
    dictionaries: [
      { contractVersion: "0.1.0", contextId: "enterprise:secret",
        dictionaryId: "a", displayName: "=HYPERLINK(\"https://bad.example\")",
        state: "DRAFT", version: 1, options: [{ code: "hidden", label: { default: "SECRET" } }] },
      { contractVersion: "0.1.0", contextId: "enterprise:secret",
        dictionaryId: "b", displayName: "A \"quoted\", name\nwith newline",
        state: "PUBLISHED", version: 2, options: [] }
    ],
    query: { sort: "dictionaryId", page: 0, pageSize: 1 }
  });
}

test("CV-04 serializes only the CURRENT authorized owner page and its selected readable columns", () => {
  const page = samplePage();
  assert.equal(page.pageInfo.hasMore, true);
  assert.equal(page.rows.length, 1);
  const csv = serializeAuthorizedCollectionPageCsvV010({
    page, fieldIds: ["dictionaryId", "displayName", "version"]
  });
  assert.equal(csv, '"dictionaryId","displayName","version"\r\n'
    + '"a","\'=HYPERLINK(""https://bad.example"")",1\r\n');
  assert.equal(csv.includes("SECRET"), false);
  assert.equal(csv.includes("contextId"), false);
  assert.equal(csv.includes('"b"'), false, "must not imply whole filtered dataset was exported");
  assert.equal(page.rows[0].cells.displayName.startsWith("="), true,
    "never alter caller-owned authorized result");
});

test("CV-04 handles commas, quotes, newlines, zero/boolean and spreadsheet formula variants", () => {
  const page = samplePage();
  page.readableFieldIds = ["code", "text", "number", "active", "formula"];
  page.rows = [{
    rowId: "one", cells: {
      code: "A,1", text: 'A "quoted", name\nwith newline',
      number: 0, active: false, formula: "\t-42"
    }
  }];
  const csv = serializeAuthorizedCollectionPageCsvV010({
    page, fieldIds: ["code", "text", "number", "active", "formula"]
  });
  assert.equal(csv, '"code","text","number","active","formula"\r\n'
    + '"A,1","A ""quoted"", name\nwith newline",0,false,"\'\t-42"\r\n');
  for (const value of ["=2+2", "+cmd", "-cmd", "@SUM(1)", "\uFEFF=CMD", "\u200B=CMD", " \n=CMD"]) {
    page.readableFieldIds = ["formula"];
    page.rows = [{ rowId: "one", cells: { formula: value } }];
    const output = serializeAuthorizedCollectionPageCsvV010({page,fieldIds:["formula"]});
    assert.equal(output.includes('"' + "'" + value.replaceAll('"', '""') + '"'), true, value);
  }
});

test("CV-04 refuses unauthorized columns, malformed rows, out-of-range pages and dangerous values", () => {
  const page = samplePage();
  const serialize = fieldIds => serializeAuthorizedCollectionPageCsvV010({ page, fieldIds });
  assert.throws(() => serialize(["options"]), /COLLECTION_CSV_FIELD_NOT_READABLE/);
  assert.throws(() => serialize(["displayName","displayName"]), /COLLECTION_CSV_FIELDS_INVALID/);
  assert.throws(() => serialize(["__proto__"]), /COLLECTION_CSV_FIELDS_INVALID/);
  assert.throws(() => serialize([]), /COLLECTION_CSV_FIELDS_INVALID/);
  assert.throws(() => serialize(["displayName", "enterpriseId"]), /COLLECTION_CSV_FIELD_NOT_READABLE/);
  page.rows[0].cells.contextId = "enterprise:secret";
  assert.throws(() => serialize(["displayName"]), /COLLECTION_CSV_ROW_FIELD_UNREADABLE/);
  delete page.rows[0].cells.contextId;
  page.rows[0].cells.displayName = Number.NaN;
  assert.throws(() => serialize(["displayName"]), /COLLECTION_CSV_CELL_INVALID/);
  page.rows[0].cells.displayName = "x".repeat(2049);
  assert.throws(() => serialize(["displayName"]), /COLLECTION_CSV_CELL_INVALID/);
  page.rows[0].cells.displayName = "safe";
  page.pageInfo.pageSize = 101;
  assert.throws(() => serialize(["displayName"]), /COLLECTION_CSV_PAGE_INVALID/);
  page.pageInfo.pageSize = 1;
  page.rows.push({...page.rows[0]});
  assert.throws(() => serialize(["displayName"]), /COLLECTION_CSV_PAGE_INVALID/);
  page.pageInfo.pageSize = 2;
  assert.throws(() => serialize(["displayName"]), /COLLECTION_CSV_ROW_INVALID/);
});
