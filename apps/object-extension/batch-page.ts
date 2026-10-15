import type { DataImportJobV010 } from "../data-import/types.js";
import type { ObjectExtensionDefinitionV010 } from "../../contracts/foundation-object/extension.js";
import { DATA_IMPORT_DIRECTORY_ROUTE, dataImportMappingRouteV010 } from "../data-import/constants.js";
import { OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010 } from "./constants.js";

export type BexImportTargetField = {fieldId:string; label:string; valueType:string};

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
  const all = input.importableTargets ?? available.map(x => ({
    fieldId: x.fieldId, label: x.label.default, valueType: x.valueType
  }));
  const selectable = all.filter(x => !usedTargets.has(x.fieldId));
  const metadataLike = /^(系统编码|系统id|日志|创建时间|修改时间|更新时间|操作时间|创建人|修改人|历史状态|system[_ -]?id|log|audit)/i;
  const fieldOptions = selectable.map(x => ({
    value: x.fieldId, label: x.label + " · " + x.fieldId
  }));
  const fields = [
    { key: "importJobId", label: "Import Job", control: "select" as const,
      required: true, initialValue: job.importJobId,
      options: [{ value: job.importJobId, label: job.importJobId }] },
    { key: "batchMode", label: "Batch mode", control: "select" as const,
      required: true, initialValue: "BATCH",
      options: [{ value: "BATCH", label: zh ? "集中创建与映射" : "Review and map" }] },
    ...columns.flatMap((column, i) => {
      const same = all.filter(x =>
        x.label.trim().toLocaleLowerCase() === column.trim().toLocaleLowerCase()
      );
      const action = same.length === 1 && !usedTargets.has(same[0].fieldId)
        ? same[0].fieldId
        : same.length > 0 || metadataLike.test(column) ? BEX_BATCH_REVIEW : BEX_BATCH_CREATE;
      const count = job.source.rows.filter(row =>
        row[column] !== null && row[column] !== undefined && String(row[column]).trim() !== ""
      ).length;
      return [
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
          initialValue: zh
            ? "非空 " + count + " / " + job.source.rows.length + " 行（隐去原始值）"
            : count + " / " + job.source.rows.length + " nonempty rows (values hidden)" }
      ];
    })
  ];
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
