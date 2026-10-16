import type { DataImportJobV010 } from "../data-import/types.js";
import type { ObjectExtensionDefinitionV010 } from "../../contracts/foundation-object/extension.js";
import { DATA_IMPORT_DIRECTORY_ROUTE, dataImportMappingRouteV010 } from "../data-import/constants.js";
import { OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010 } from "./constants.js";

export type BexImportTargetField = {
  fieldId: string;
  label: string;
  valueType: string;
  /** Governed description from the effective enterprise IMPORT schema. */
  description?: string;
};

export const BEX_BATCH_CREATE = "__CREATE__";
export const BEX_BATCH_IGNORE = "__IGNORE__";
export const BEX_BATCH_REVIEW = "__REVIEW__";

export function batchUnmappedColumnsV010(job: DataImportJobV010): string[] {
  const used = new Set(job.mapping.filter(x => x.sourceColumn).map(x => x.sourceColumn));
  return job.source.headers.filter(column => !used.has(column));
}

export function batchApplicableDefinitionsV010(
  job: DataImportJobV010,
  definitions: ObjectExtensionDefinitionV010[]
): ObjectExtensionDefinitionV010[] {
  const role = job.targetParameters?.relationshipMode;
  return definitions.filter(x =>
    x.targetObjectType === "counterparty.subject"
    && x.importable
    && x.surfaces.includes("IMPORT")
    && (!x.applicability?.relationshipRoles?.length
      || !role || x.applicability.relationshipRoles.includes(role as "SUPPLIER" | "CUSTOMER"))
  );
}

export function batchSuggestedTypeV010(job: DataImportJobV010, column: string): "STRING" | "NUMBER" {
  const samples = job.source.rows.slice(0, 20)
    .map(row => row[column])
    .filter(value => value !== null && value !== undefined && String(value).trim() !== "");
  const numeric = samples.length > 0 && samples.every(value =>
    typeof value === "number" && Number.isFinite(value)
    || typeof value === "string" && /^-?(?:\d+|\d*\.\d+)$/.test(value.trim())
  );
  return numeric && /天数|数量|金额|期限|days|amount|quantity/i.test(column)
    ? "NUMBER" : "STRING";
}

function normalizedLabel(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase();
}

function boundedOriginal(value: unknown): string {
  const literal = String(value);
  return literal.length > 48 ? literal.slice(0, 48) + "…" : literal;
}

export function batchSourceExamplesV010(
  job: DataImportJobV010, column: string, chinese: boolean
): string {
  const seen = new Set<string>();
  const examples: string[] = [];
  for (const row of job.source.rows) {
    const value = row[column];
    if (value === undefined || value === null || value === "") continue;
    const literal = boundedOriginal(value);
    if (seen.has(literal)) continue;
    seen.add(literal);
    examples.push(literal);
    if (examples.length === 3) break;
  }
  return examples.length ? examples.join(" · ")
    : chinese ? "无非空样本" : "No nonempty examples";
}

export function createObjectExtensionBatchImportPageV010(input: {
  job: DataImportJobV010;
  definitions: ObjectExtensionDefinitionV010[];
  importableTargets?: BexImportTargetField[];
  locale?: string;
}) {
  const { job } = input;
  const zh = input.locale?.startsWith("zh") ?? false;
  const columns = batchUnmappedColumnsV010(job);
  const available = batchApplicableDefinitionsV010(job, input.definitions);
  const usedTargets = new Set(job.mapping.map(x => x.targetFieldId));
  const all: BexImportTargetField[] = input.importableTargets ?? available.map(x => ({
    fieldId: x.fieldId, label: x.label.default, valueType: x.valueType
  }));
  const selectable = all.filter(x => !usedTargets.has(x.fieldId));
  const metadataLike = /^(系统编码|系统id|日志|创建时间|修改时间|更新时间|操作时间|创建人|修改人|历史状态|system[_ -]?id|log|audit)/i;
  const counts = new Map<string, number>();
  all.forEach(field => {
    const key = normalizedLabel(field.label);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  // Only duplicate labels need additional purpose context in the selector;
  // the comparison panel below preserves full descriptions and real IDs.
  const fieldOptions = selectable.map(field => {
    const duplicate = (counts.get(normalizedLabel(field.label)) ?? 0) > 1;
    const purpose = field.description?.trim();
    return {
      value: field.fieldId,
      label: field.label
        + (duplicate
          ? " · " + (purpose
            ? (purpose.length > 52 ? purpose.slice(0, 52) + "…" : purpose)
            : zh ? "用途待核对" : "Purpose needs review")
          : "")
        + " · " + field.fieldId
    };
  });
  const usedBy = new Map(job.mapping.map(entry =>
    [entry.targetFieldId, entry.sourceColumn] as const));
  const fields = [
    { key: "importJobId", label: "Import Job", semanticType: "data-import-job-id", control: "select" as const,
      required: true, initialValue: job.importJobId,
      options: [{ value: job.importJobId, label: job.importJobId }] },
    { key: "batchMode", label: "Batch mode", semanticType: "object-extension-batch-mode", control: "select" as const,
      required: true, initialValue: "BATCH",
      options: [{ value: "BATCH", label: zh ? "集中创建与映射" : "Review and map" }] },
    ...columns.flatMap((column, i) => {
      const same = all.filter(x =>
        normalizedLabel(x.label) === normalizedLabel(column)
      );
      const ambiguous = same.length > 1
        || same.length === 1 && usedTargets.has(same[0].fieldId);
      const comparison = ambiguous
        ? same.map((field, rank) => {
            const purpose = field.description?.trim()
              || (zh ? "业务用途尚未配置，请业务负责人确认"
                : "Purpose not yet documented; confirm with owner");
            const occupied = usedBy.get(field.fieldId);
            return (rank + 1) + ". " + field.label
              + " · " + purpose
              + " · " + (zh ? "类型 " : "Type ") + field.valueType
              + " · " + (zh ? "字段标识 " : "Field ID ") + field.fieldId
              + (occupied
                ? " · " + (zh ? "已用于来源列：" : "Already used by: ") + occupied
                : "");
          }).join(" ； ")
        : "";
      const action = job.ignoredSourceColumns?.includes(column)
        ? BEX_BATCH_IGNORE
        : same.length === 1 && !usedTargets.has(same[0].fieldId)
          ? same[0].fieldId
          : same.length > 0 || metadataLike.test(column) ? BEX_BATCH_REVIEW : BEX_BATCH_CREATE;
      const count = job.source.rows.filter(row =>
        row[column] !== null && row[column] !== undefined && String(row[column]).trim() !== ""
      ).length;
      return [
        ...(ambiguous ? [{
          key: "candidate_" + i,
          label: column + (zh ? " · 同名字段用途核对" : " · Compare matching purposes"),
          semanticType: "object-extension-batch-candidate-comparison",
          control: "text" as const,
          required: false,
          readOnly: true,
          initialValue: comparison
        }] : []),
        { key: "choice_" + i, label: column + (zh ? " · 已有字段 / 新建 / 忽略" : " · Reuse / create / ignore"),
          semanticType: "object-extension-batch-action", control: "select" as const,
          exclusiveSelect: { group: "bex-batch-targets",
            exemptValues: [BEX_BATCH_CREATE, BEX_BATCH_IGNORE, BEX_BATCH_REVIEW] },
          required: true, initialValue: action,
          options: [
            { value: BEX_BATCH_CREATE, label: zh ? "＋ 新建企业扩展字段（待确认）" : "Create enterprise field" },
            { value: BEX_BATCH_IGNORE, label: zh ? "忽略此列" : "Ignore column" },
            { value: BEX_BATCH_REVIEW, label: zh ? "需要人工确认（不可直接提交）" : "Needs review" },
            ...fieldOptions
          ] },
        { key: "label_" + i, label: column + (zh ? " · 业务字段名称" : " · Field name"),
          semanticType: "object-extension-batch-label", control: "text" as const,
          required: true, initialValue: column },
        { key: "type_" + i, label: column + (zh ? " · 数据类型" : " · Data type"),
          semanticType: "object-extension-batch-type", control: "select" as const,
          required: true, initialValue: batchSuggestedTypeV010(job, column),
          options: [
            { value: "STRING", label: zh ? "文本" : "Text" },
            { value: "NUMBER", label: zh ? "数字" : "Number" },
            { value: "BOOLEAN", label: zh ? "是 / 否" : "Yes / No" },
            { value: "DATE", label: zh ? "日期" : "Date" }
          ] },
        { key: "sample_" + i, label: column + (zh ? " · 数据概况" : " · Source summary"),
          semanticType: "object-extension-batch-sample", control: "text" as const,
          readOnly: true, required: false,
          initialValue: (zh
            ? "非空 " + count + " / " + job.source.rows.length + " 行 · 来源样本："
            : count + " / " + job.source.rows.length + " nonempty · Source examples: ")
            + batchSourceExamplesV010(job, column, zh) }
      ];
    })
  ];
  // BEX owns source values, matched field IDs and business choices.
  // Eidos #187 owns generic rows, primary decision and detail disclosure.
  const reviewGroups = columns.map((column, index) => {
    const count = job.source.rows.filter(row =>
      row[column] !== null && row[column] !== undefined
      && String(row[column]).trim() !== ""
    ).length;
    const same = all.filter(field =>
      normalizedLabel(field.label) === normalizedLabel(column)
    );
    const ambiguous = same.length > 1
      || (same.length === 1 && usedTargets.has(same[0].fieldId));
    const requiresReview = ambiguous || metadataLike.test(column);
    return {
      id: "source-" + index,
      title: column,
      summary: (zh ? "非空 " : "Nonempty ") + count
        + " / " + job.source.rows.length
        + " · " + batchSourceExamplesV010(job, column, zh),
      primaryFieldKey: "choice_" + index,
      detailFieldKeys: [
        ...(ambiguous ? ["candidate_" + index] : []),
        "label_" + index, "type_" + index, "sample_" + index
      ],
      detailsLabel: zh ? "核对字段名称、类型与原值"
        : "Review field name, type and source evidence",
      defaultExpanded: requiresReview
    };
  });
  return {
    contractVersion: "0.1.1" as const, kind: "form" as const,
    id: "evo-object-extension.batch-import",
    title: zh ? "集中审核 Excel 未匹配字段" : "Review unmatched Excel columns",
    description: zh
      ? "已有字段优先。逐列选择复用、新建或忽略；确认后一次创建并自动映射。仅修改企业字段定义和映射，不导入供应商记录。主体类型仍需真实数据。"
      : "Reuse existing fields first, then confirm creation or ignore. This does not import supplier records.",
    contextNavigation: { items: [
      { id: "data-import", label: zh ? "数据导入" : "Data Import", route: DATA_IMPORT_DIRECTORY_ROUTE },
      { id: "mapping", label: zh ? "字段映射" : "Field mapping", route: dataImportMappingRouteV010(job.importJobId) },
      { id: "batch", label: zh ? "集中审核" : "Batch review" }
    ] },
    purpose: "execute-command" as const,
    command: { code: OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010, inputVersion: "0.1.0" },
    reviewGroups,
    fields,
    actions: [{ id: "create-extension-batch",
      label: zh ? "确认：批量创建并自动映射" : "Confirm: create and map selected fields",
      type: "submit" as const, command: OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010,
      requiresConfirmation: true }],
    metadata: {
      packageId: "evo-object-extension", featureId: "evo-object-extension.default",
      importJobId: job.importJobId, unmatchedColumns: columns.length,
      description: zh
        ? "字段定义与供应商数据提交分开执行；失败后可重新进入并复用已创建字段。"
        : "Field creation and import commit are separate; retry reuses saved fields."
    }
  };
}
