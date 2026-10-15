import type { EffectiveObjectSchemaV010 } from "../../contracts/foundation-object/schema.js";
import { localizedTextV010 } from "../../contracts/foundation-object/schema.js";
import type { DataImportJobV010 } from "./types.js";
import {
  dataImportCorrectableSourceV010,
  dataImportRowCorrectionRevisionV010
} from "./row-correction.js";
import {
  DATA_IMPORT_DIRECTORY_ROUTE,
  DATA_IMPORT_ROW_CORRECT_COMMAND_V010,
  dataImportReviewRouteV010
} from "./constants.js";

function valueForDisplay(value: unknown, locale?: string): string {
  if (value === undefined || value === null || value === "") {
    return locale?.startsWith("zh") ? "（空）" : "(blank)";
  }
  return String(value);
}

/** Contextual correction from one flagged source row; Host owns persistence. */
export function createDataImportRowCorrectionPageV010(input: {
  job: DataImportJobV010;
  schema: EffectiveObjectSchemaV010;
  rowNumber: number;
  columnIndex: number;
  locale?: string;
}) {
  const { job, schema, rowNumber, columnIndex, locale } = input;
  const chinese = locale?.startsWith("zh") ?? false;
  const sourceColumn = job.source.headers[columnIndex];
  if (!sourceColumn) throw new Error("DATA_IMPORT_CORRECTION_SOURCE_NOT_FOUND");
  const target = dataImportCorrectableSourceV010({
    job, schema, rowNumber, sourceColumn
  });
  const correction = job.rowCorrections?.find(item =>
    item.rowNumber === rowNumber && item.sourceColumn === sourceColumn);
  const raw = job.source.rows[rowNumber - 1][sourceColumn] ?? null;
  const current = correction?.value ?? raw;
  const definition = schema.fields.find(field => field.fieldId === target.fieldId);
  const revision = dataImportRowCorrectionRevisionV010(job, rowNumber, sourceColumn);
  const originalValueLabel = valueForDisplay(raw, locale);
  const existingValueLabel = valueForDisplay(current, locale);
  const reviewRoute = dataImportReviewRouteV010(job.importJobId);
  return {
    contractVersion: "0.1.1" as const,
    kind: "form" as const,
    id: "evo-data-import.row-correct",
    title: chinese ? "修正第 " + rowNumber + " 行 · " + target.fieldLabel
      : "Correct row " + rowNumber + " · " + target.fieldLabel,
    description: chinese
      ? "只修改本次导入使用的值。Excel 原始值始终保留，保存后重新预检查，正式导入仍需确认。"
      : "Correct only this import. Original spreadsheet cells are preserved. Validation runs again before any separately confirmed import.",
    contextNavigation: { items: [
      {id: "data-import", label: chinese ? "数据导入" : "Data Import", route: DATA_IMPORT_DIRECTORY_ROUTE},
      {id: "review", label: chinese ? "导入核对" : "Import review", route: reviewRoute},
      {id: "correction", label: chinese ? "修正当前问题" : "Correct this issue"}
    ]},
    purpose: "execute-command" as const,
    command: { code: DATA_IMPORT_ROW_CORRECT_COMMAND_V010, inputVersion: "0.1.0" },
    fields: [{
      key: "importJobId", label: chinese ? "当前导入任务" : "Import job",
      semanticType: "data-import-job-id", control: "select" as const,
      required: true, initialValue: job.importJobId,
      options: [{value: job.importJobId, label: job.source.name ?? job.importJobId}]
    }, {
      key: "rowNumber", label: chinese ? "Excel 数据行" : "Spreadsheet row",
      semanticType: "data-import-row-number", control: "select" as const,
      required: true, initialValue: String(rowNumber),
      options: [{value: String(rowNumber), label: String(rowNumber)}]
    }, {
      key: "sourceColumn", label: chinese ? "来源字段" : "Source column",
      semanticType: "data-import-source", control: "select" as const,
      required: true, initialValue: sourceColumn,
      options: [{value: sourceColumn, label: sourceColumn}]
    }, {
      key: "expectedRevision", label: chinese ? "当前修正版本" : "Current edit version",
      semanticType: "data-import-correction-revision", control: "select" as const,
      required: true, initialValue: revision,
      options: [{value: revision, label: chinese ? "当前保存状态" : "Current saved state"}]
    }, {
      key: "mode", label: chinese ? "处理方式" : "Correction action",
      semanticType: "data-import-correction-mode", control: "select" as const,
      required: true, initialValue: "SET",
      options: [
        {value: "SET", label: chinese ? "使用修正后的值" : "Use corrected value"},
        ...(correction ? [{value: "REVERT", label: chinese ? "撤销更正，恢复原始值" : "Revert to original value"}] : [])
      ]
    }, {
      key: "value", label: chinese ? "本次导入使用的值" : "Value to import",
      semanticType: "data-import-corrected-cell",
      control: target.valueType === "ENUM" ? "select" as const : "text" as const,
      required: true,
      initialValue: current === null ? "" : String(current),
      ...(target.valueType === "ENUM"
        ? {options: [
            {value: "", label: chinese ? "请选择，不根据供应商角色推断" : "Choose; do not infer from supplier role"},
            ...(definition?.enumOptions ?? []).map(option => ({
              value: option.value,
              label: localizedTextV010(option.label, locale)
            }))
          ]}
        : {})
    }],
    actions: [{
      id: "save-row-correction",
      label: chinese ? "保存修正并重新预检查" : "Save correction and validate again",
      type: "submit" as const, command: DATA_IMPORT_ROW_CORRECT_COMMAND_V010,
      requiresConfirmation: false
    }, {
      id: "back",
      label: chinese ? "返回导入核对" : "Return to import review",
      type: "cancel" as const
    }],
    metadata: {
      packageId: "evo-data-import", featureId: "evo-data-import.default",
      importJobId: job.importJobId,
      originalSourceValue: originalValueLabel,
      description: (chinese ? "Excel 原值：" : "Excel original: ")
        + originalValueLabel
        + (correction ? (chinese ? " · 已更正：" : " · Corrected: ") + existingValueLabel : "")
        + (definition?.resolvedDescription ? " · " + definition.resolvedDescription : "")
    }
  };
}
