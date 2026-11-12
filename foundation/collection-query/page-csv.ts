import type {
  DataCollectionCellV010,
  DataCollectionResultV010
} from "../../contracts/data-collection/query.js";

const MAX_CSV_COLUMNS = 20;
const MAX_CSV_ROWS = 100;
const MAX_CSV_CELL_CHARS = 2048;
const MAX_CSV_OUTPUT_CHARS = 262144;
const FIELD_ID = /^[A-Za-z][A-Za-z0-9._-]{0,127}$/u;

/**
 * CV-04 opt-in serialization ONLY of one already-authorized collection page.
 *
 * This has no repository/query access, does not grant an export capability, and
 * must never be used to imply that rows on other pages were exported.
 * The domain owner/Host must authorize the export operation and requested
 * fields independently before passing its current principal-scoped result.
 */
export function serializeAuthorizedCollectionPageCsvV010(input: {
  page: DataCollectionResultV010;
  fieldIds: readonly string[];
}): string {
  const { page, fieldIds } = input;
  if (!page || page.contractVersion !== "0.1.0"
    || !Array.isArray(page.rows) || !Array.isArray(page.readableFieldIds)
    || !page.pageInfo
    || !Number.isSafeInteger(page.pageInfo.page)
    || page.pageInfo.page < 0
    || !Number.isSafeInteger(page.pageInfo.pageSize)
    || page.pageInfo.pageSize < 1
    || page.pageInfo.pageSize > MAX_CSV_ROWS
    || page.rows.length > page.pageInfo.pageSize) {
    throw new Error("COLLECTION_CSV_PAGE_INVALID");
  }
  if (!Array.isArray(fieldIds) || fieldIds.length < 1
    || fieldIds.length > MAX_CSV_COLUMNS
    || fieldIds.some(id => typeof id !== "string" || !FIELD_ID.test(id))
    || new Set(fieldIds).size !== fieldIds.length
    || page.readableFieldIds.some(id => typeof id !== "string" || !FIELD_ID.test(id))
    || new Set(page.readableFieldIds).size !== page.readableFieldIds.length) {
    throw new Error("COLLECTION_CSV_FIELDS_INVALID");
  }
  const readable = new Set(page.readableFieldIds);
  if (fieldIds.some(id => !readable.has(id))) {
    throw new Error("COLLECTION_CSV_FIELD_NOT_READABLE");
  }

  function cell(value: DataCollectionCellV010): string {
    if (value === null) return "";
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new Error("COLLECTION_CSV_CELL_INVALID");
      return String(value);
    }
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value !== "string" || value.length > MAX_CSV_CELL_CHARS) {
      throw new Error("COLLECTION_CSV_CELL_INVALID");
    }
    // CSV quoting does not prevent spreadsheet formula execution. Prefix an
    // apostrophe when a formula leader follows Unicode whitespace/BOM/ZWSP.
    const safe = /^[\s\uFEFF\u200B]*[=+\-@]/u.test(value)
      ? "'" + value : value;
    return '"' + safe.replaceAll('"', '""') + '"';
  }

  const lines = [fieldIds.map(id => cell(id)).join(",")];
  const seen = new Set<string>();
  for (const row of page.rows) {
    if (!row || typeof row.rowId !== "string" || !row.rowId
      || seen.has(row.rowId) || !row.cells || typeof row.cells !== "object"
      || Array.isArray(row.cells)) {
      throw new Error("COLLECTION_CSV_ROW_INVALID");
    }
    seen.add(row.rowId);
    // A malformed owner result is a hard error rather than an implicit
    // fallback to exporting private or unlisted fields.
    if (Object.keys(row.cells).some(id => !readable.has(id))) {
      throw new Error("COLLECTION_CSV_ROW_FIELD_UNREADABLE");
    }
    lines.push(fieldIds.map(id => cell(
      Object.hasOwn(row.cells, id) ? row.cells[id] : null
    )).join(","));
    if (lines.reduce((n, line) => n + line.length + 2, 0)
      > MAX_CSV_OUTPUT_CHARS) {
      throw new Error("COLLECTION_CSV_OUTPUT_TOO_LARGE");
    }
  }
  return lines.join("\r\n") + "\r\n";
}
