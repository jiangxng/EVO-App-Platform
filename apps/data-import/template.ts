import type { EffectiveObjectSchemaV010 } from "../../contracts/foundation-object/schema.js";
import { fieldsForSurfaceV010, localizedTextV010 } from "../../contracts/foundation-object/schema.js";

/** Use the same normalized alias identity as deterministic Import mapping. */
function headerKey(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s_\-\/()[\]{}.:：]+/gu, "");
}

function spreadsheetSafeHeader(value: string): boolean {
  return Boolean(value.trim()) && value.length <= 160
    && !/^\s*[=+\-@]/u.test(value)
    && !/[\u0000-\u001f\u007f]/u.test(value);
}

export interface DataImportBlankCsvTemplateV010 {
  fileName: string;
  mediaType: "text/csv;charset=utf-8";
  content: string;
}

/**
 * Only the active Owner's writable IMPORT schema. Never include example
 * business records, sensitive DETAIL-only fields or unresolved duplicate
 * aliases. A disambiguating fieldId is the deterministic mapping fallback.
 */
export function dataImportBlankCsvTemplateV010(input: {
  targetId: string;
  schema: EffectiveObjectSchemaV010;
  locale?: string;
}): DataImportBlankCsvTemplateV010 {
  const fields = fieldsForSurfaceV010(input.schema, "IMPORT")
    .filter(field => field.writable);
  if (fields.length === 0 || fields.length > 512) {
    throw new Error("DATA_IMPORT_TEMPLATE_FIELDS_INVALID");
  }
  const aliases = new Map<string, Set<string>>();
  for (const field of fields) {
    for (const alias of [field.fieldId, field.resolvedLabel,
      field.label.default, ...Object.values(field.label.translations ?? {}),
      ...(field.importHeaderAliases ?? [])]) {
      const key = headerKey(alias);
      const ids = aliases.get(key) ?? new Set<string>();
      ids.add(field.fieldId);
      aliases.set(key, ids);
    }
  }
  const used = new Set<string>();
  const headers = fields.map(field => {
    const localized = localizedTextV010(field.label, input.locale);
    const candidate = localized.trim();
    const key = headerKey(candidate);
    const header = spreadsheetSafeHeader(candidate)
      && key && aliases.get(key)?.size === 1 && !used.has(key)
      ? candidate : field.fieldId;
    const id = headerKey(header);
    // Match the mapper's explicit technical ID precedence when an Owner alias
    // collides with a canonical ID. A non-ID alias must still be unique.
    const matches = aliases.get(id);
    const explicitIds = [...(matches ?? [])].filter(value => headerKey(value) === id);
    const resolved = matches?.size === 1 ? [...matches][0]
      : explicitIds.length === 1 ? explicitIds[0] : undefined;
    if (!spreadsheetSafeHeader(header) || !id || used.has(id)
      || resolved !== field.fieldId) {
      throw new Error("DATA_IMPORT_TEMPLATE_HEADER_AMBIGUOUS");
    }
    used.add(id);
    return header;
  });
  const safeId = input.targetId.replace(/[^a-zA-Z0-9._-]/gu, "-").slice(0, 80);
  if (!safeId) throw new Error("DATA_IMPORT_TEMPLATE_TARGET_INVALID");
  return {
    fileName: "data-import-" + safeId + "-blank.csv",
    mediaType: "text/csv;charset=utf-8",
    // Excel-compatible UTF-8 BOM. Header only: no fake business facts.
    content: "\uFEFF" + headers.map(header =>
      '"' + header.replace(/"/gu, '""') + '"'
    ).join(",") + "\r\n"
  };
}
