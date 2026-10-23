import {
  fieldsForSurfaceV010,
  type EffectiveObjectSchemaV010
} from "../../contracts/foundation-object/schema.js";
import type { CatalogBrowserItemV010 } from "../../vendor/eidos/src/catalog-browser/contracts.js";
import type {
  DataImportDryRunRowV010,
  DataImportJobV010
} from "./types.js";
import { dataImportMappingRouteV010 } from "./constants.js";

function isChinese(locale?: string): boolean {
  return (locale ?? "").toLowerCase().startsWith("zh");
}

function cellPreview(value: unknown, chinese: boolean): string {
  if (value === null || value === undefined || value === "") {
    return chinese ? "（空）" : "(blank)";
  }
  const text = String(value);
  // Preview text is deliberately bounded; the source cells are never changed.
  return text.length > 100 ? text.slice(0, 100) + "…" : text;
}

function businessFieldName(field: {
  fieldId: string;
  resolvedLabel: string;
  resolvedDescription?: string;
}): string {
  return field.resolvedLabel
    + (field.resolvedDescription ? " · " + field.resolvedDescription : "")
    + " [" + field.fieldId + "]";
}

/**
 * Real Host job source evidence for the review page. Every persisted header
 * is represented, including unmapped or explicitly ignored columns.
 * Samples are display-only; there is no data mutation, mapping inference,
 * or implied approval in this function.
 */
export function dataImportSourceAuditItemsV010(input: {
  job: DataImportJobV010;
  schema?: EffectiveObjectSchemaV010;
  locale?: string;
}): CatalogBrowserItemV010[] {
  const { job } = input;
  const chinese = isChinese(input.locale);
  const fields = input.schema
    ? fieldsForSurfaceV010(input.schema, "IMPORT").filter(field => field.writable)
    : [];
  const selected = new Map(job.mapping
    .filter(mapping => mapping.sourceColumn)
    .map(mapping => [mapping.sourceColumn!, mapping.targetFieldId]));
  const ignored = new Set(job.ignoredSourceColumns ?? []);
  const editable = job.state !== "COMMITTED"
    && job.state !== "COMMITTED_WITH_ERRORS";
  return job.source.headers.map((header, index) => {
    const fieldId = selected.get(header);
    const mappedField = fields.find(field => field.fieldId === fieldId);
    const similar = fields.filter(field =>
      field.resolvedLabel.trim().toLocaleLowerCase()
        === header.trim().toLocaleLowerCase()
    );
    const needsComparison = similar.length > 1;
    const examples = job.source.rows
      .map(row => row[header])
      .filter(value => value !== null && value !== undefined && value !== "")
      .slice(0, 3)
      .map(value => cellPreview(value, chinese));
    const state = fieldId
      ? (needsComparison
        ? { label: chinese ? "同名字段需核对" : "Check same-name fields", tone: "warning" as const }
        : { label: chinese ? "已映射" : "Mapped", tone: "positive" as const })
      : ignored.has(header)
        ? { label: chinese ? "已忽略，可撤销" : "Ignored, reversible", tone: "neutral" as const }
        : { label: chinese ? "尚未映射" : "Not mapped", tone: "warning" as const };
    return {
      id: "source:" + index,
      title: header,
      summary: fieldId
        ? (mappedField
          ? businessFieldName(mappedField)
          : (chinese ? "已有目标字段：" : "Saved target: ") + fieldId)
        : ignored.has(header)
          ? (chinese ? "已保留来源数据，当前不参与导入" : "Source preserved; excluded from this import")
          : (chinese ? "来源数据已保留，请核对处理方式" : "Source preserved; choose how to handle"),
      status: state,
      metadata: {
        [chinese ? "来源列序号" : "Source column"]: index + 1,
        [chinese ? "原始样本" : "Original samples"]: examples.length
          ? examples.join(" · ")
          : (chinese ? "本列样本均为空" : "No nonempty samples"),
        ...(needsComparison
          ? { [chinese ? "同名目标候选（按用途区分）" : "Same-name targets (compare purpose)"]:
              similar.map(businessFieldName).join("；") }
          : {}),
        ...(fieldId
          ? { [chinese ? "目标字段标识" : "Target field ID"]: fieldId }
          : {})
      },
      ...(editable
        ? {
            primaryAction: {
              id: "review-source:" + index,
              label: chinese ? "核对或调整本列" : "Review or change this column",
              type: "navigate" as const,
              route: dataImportMappingRouteV010(job.importJobId)
            }
          }
        : {})
    };
  });
}

/** Keep each failure next to its actual staged source values, not prepared data. */
export function dataImportIssueSourceEvidenceV010(input: {
  job: DataImportJobV010;
  row: DataImportDryRunRowV010;
  locale?: string;
}): Record<string, string> {
  const { job, row } = input;
  if (row.ok) return {};
  const chinese = isChinese(input.locale);
  const source = job.source.rows[row.rowNumber - 1];
  if (!source) return {};
  const affectedFields = new Set(row.issues
    .map(issue => issue.fieldId)
    .filter((value): value is string => Boolean(value)));
  const affected = job.mapping.filter(mapping =>
    mapping.sourceColumn && affectedFields.has(mapping.targetFieldId)
  );
  // If an error has no fieldId, still show source identity without guessing.
  const headers = affected.length
    ? affected.map(mapping => mapping.sourceColumn!)
    : job.source.headers.slice(0, 3);
  return {
    [chinese ? "原始行核对" : "Original row values"]: headers
      .map(header => header + "：" + cellPreview(source[header], chinese))
      .join(" · "),
    ...(affected.length
      ? { [chinese ? "对应目标字段" : "Affected target IDs"]:
          affected.map(mapping => mapping.targetFieldId).join(" · ") }
      : {})
  };
}
