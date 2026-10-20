import { createHash } from "node:crypto";
import type { DataImportJobV010 } from "../data-import/types.js";
import type { ObjectExtensionDefinitionV010 } from "../../contracts/foundation-object/extension.js";
import { DATA_IMPORT_DIRECTORY_ROUTE, dataImportMappingRouteV010 } from "../data-import/constants.js";
import { OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010, OBJECT_EXTENSION_IMPORT_DRAFT_SAVE_COMMAND_V010 } from "./constants.js";

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

/** Opaque identity of the authoritative source-column/mapping decision view.
 * A stale mounted form must never shift an indexed choice to another column.
 * This is a concurrency precondition, not an authentication token.
 */
export function batchReviewSourceRevisionV010(job: DataImportJobV010): string {
  const snapshot = {
    importJobId: job.importJobId,
    headers: job.source.headers,
    mapping: job.mapping,
    ignoredSourceColumns: job.ignoredSourceColumns ?? []
  };
  return "BATCH:" + createHash("sha256")
    .update(JSON.stringify(snapshot)).digest("hex").slice(0, 24);
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
  /** Only a draft belonging to the authorized Human may be shown. */
  actorSubjectId?: string;
  locale?: string;
}) {
  const { job } = input;
  const zh = input.locale?.startsWith("zh") ?? false;
  const columns = batchUnmappedColumnsV010(job);
  const draft=input.actorSubjectId
    ? job.batchReviewDrafts?.find(d=>d.actorSubjectId===input.actorSubjectId)
    : undefined;
  const draftChoices=new Map(draft?.columns.map(d=>[d.sourceColumn,d] as const) ?? []);
  const unavailableDraftSources=new Set<string>();
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
      // Ordinary candidates are named for Humans. Only duplicate labels
      // need a purpose qualifier and a stable technical disambiguator.
      label: field.label + (duplicate
        ? " · " + (purpose
          ? (purpose.length > 52 ? purpose.slice(0, 52) + "…" : purpose)
          : zh ? "用途待核对" : "Purpose needs review")
          + " · " + field.fieldId
        : "")
    };
  });
  const usedBy = new Map(job.mapping.map(entry =>
    [entry.targetFieldId, entry.sourceColumn] as const));
  const fields = [
    { key: "importJobId", label: zh ? "当前文件" : "Current file",
      semanticType: "data-import-job-id", control: "select" as const,
      hidden: true, required: true, initialValue: job.importJobId,
      // The stable Job ID is submitted to Host, but the Human sees the file.
      options: [{ value: job.importJobId,
        label: job.source.name ?? (zh ? "已保存的导入任务" : "Saved import task") }] },
    { key: "batchMode", label: zh ? "审核方式" : "Review mode",
      semanticType: "object-extension-batch-mode", control: "select" as const,
      hidden: true, required: true, initialValue: batchReviewSourceRevisionV010(job),
      // Keep the identical Human-visible control. Only the opaque submitted
      // option value carries this page's source identity for Host validation.
      options: [{ value: batchReviewSourceRevisionV010(job),
        label: zh ? "集中创建与映射" : "Review and map" }] },
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
      const savedDecision=draftChoices.get(column);
      const originalOptions=new Set([BEX_BATCH_CREATE,BEX_BATCH_IGNORE,
        BEX_BATCH_REVIEW,...fieldOptions.map(o=>o.value)]);
      const staleDraftChoice=Boolean(savedDecision && !originalOptions.has(savedDecision.choice));
      if (staleDraftChoice) unavailableDraftSources.add(column);
      // Never silently turn a previously selected target into CREATE or
      // reuse a different field when the saved target becomes unavailable.
      const selectedAction=staleDraftChoice ? BEX_BATCH_REVIEW
        : savedDecision ? savedDecision.choice : action;
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
        { key: "choice_" + i, label: column,
          semanticType: "object-extension-batch-action", control: "select" as const,
          exclusiveSelect: { group: "bex-batch-targets",
            exemptValues: [BEX_BATCH_CREATE, BEX_BATCH_IGNORE, BEX_BATCH_REVIEW] },
          required: true, initialValue: selectedAction,
          options: [
            { value: BEX_BATCH_CREATE, label: zh ? "＋ 建议新建企业字段（集中审核确认）" : "+ Propose enterprise field (batch approval)" },
            { value: BEX_BATCH_IGNORE, label: zh ? "忽略此列" : "Ignore column" },
            { value: BEX_BATCH_REVIEW, label: zh ? "需要人工确认（不可直接提交）" : "Needs review" },
            ...fieldOptions
          ] },
        { key: "label_" + i, label: column + (zh ? " · 业务字段名称" : " · Field name"),
          semanticType: "object-extension-batch-label", control: "text" as const,
          required: true, initialValue: savedDecision?.label ?? column },
        { key: "type_" + i, label: column + (zh ? " · 数据类型" : " · Data type"),
          semanticType: "object-extension-batch-type", control: "select" as const,
          required: true, initialValue: savedDecision?.valueType ?? batchSuggestedTypeV010(job, column),
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
  // A suggestion is NOT an approved field definition. The same concrete
  // choice values flow unchanged to the governed Host batch-create action.
  // Every status is based on this saved Job, not a guessed browser state.
  const initialChoiceFor = (index: number) => {
    const field = fields.find(item => item.key === "choice_" + index);
    return field && typeof field.initialValue === "string"
      ? field.initialValue : BEX_BATCH_REVIEW;
  };
  const statusForValue = (choice: string) => {
    if (choice === BEX_BATCH_IGNORE) return {
      key: "ignored", label: zh ? "不导入" : "Excluded",
      tone: "neutral" as const
    };
    if (choice === BEX_BATCH_CREATE) return {
      key: "proposed", label: zh ? "待新增" : "Proposed",
      tone: "neutral" as const
    };
    if (choice === BEX_BATCH_REVIEW) return {
      key: "attention", label: zh ? "需要校对" : "Needs review",
      tone: "warning" as const
    };
    return {
      key: "suggested", label: zh ? "待确认匹配" : "Suggested",
      tone: "neutral" as const
    };
  };
  const statusFor = (index: number) => statusForValue(initialChoiceFor(index));
  const columnStatuses = columns.map((_, index) => statusFor(index));
  const statusByChoiceFor = (index: number) => {
    const field = fields.find(item => item.key === "choice_" + index);
    const options = field && "options" in field && Array.isArray(field.options)
      ? field.options : [];
    // Every local display result is keyed to a real authorized select option.
    // The underlying Host receives ONLY the original choice_N value.
    return Object.fromEntries(options.map(option => [
      String(option.value), statusForValue(String(option.value))
    ]));
  };
  // Existing enterprise-wide constant decisions are shown only when they
  // already exist in the authorized Job. Never invent an ORGANIZATION default.
  const batchConstants = job.mapping.filter(entry =>
    entry.transform?.kind === "CONSTANT"
  );
  const subjectSource = job.mapping.find(entry =>
    entry.targetFieldId === "subjectType" && entry.sourceColumn
  );
  const subjectConstant = batchConstants.find(entry =>
    entry.targetFieldId === "subjectType"
  );
  const otherConstantFacts = batchConstants
    .filter(entry => entry.targetFieldId !== "subjectType")
    .map((entry, index) => ({
      key: "existingBatchConstant_" + index,
      label: (zh ? "已保存批次固定值：" : "Saved batch constant: ")
        + entry.targetFieldId,
      semanticType: "object-extension-saved-batch-constant",
      control: "text" as const, required: false, readOnly: true,
      initialValue: String(entry.transform?.kind === "CONSTANT"
        ? entry.transform.value ?? "" : "")
    }));
  // One batch value applies to *every* imported record. A source-column
  // mapping can represent mixed identities, so it must never be overwritten
  // by a convenient batch default.
  const subjectFixedValue = subjectSource
    ? [{
      key: "subjectTypeSourceNotice",
      label: zh ? "主体类型 · 按来源列逐行读取" : "Subject type · Per source row",
      semanticType: "object-extension-source-mapped-subject-type",
      control: "text" as const, readOnly: true, required: false,
      initialValue: (zh ? "已映射来源列：" : "Mapped source column: ")
        + subjectSource.sourceColumn
        + (zh ? "。如有缺失，请在预检查后逐行修正；不能用批次值覆盖。"
          : ". Correct missing rows after validation; do not override with a batch constant.")
    }]
    : [{
      key: "batchSubjectType",
      label: zh ? "批次固定值 · 主体类型（应用于所有导入记录）"
        : "Batch constant · Subject type (all imported records)",
      semanticType: "object-extension-batch-subject-type",
      control: "select" as const, required: true,
      // Only the explicitly persisted constant is restored; never guess
      // ORGANIZATION from a supplier relationship role or a sample.
      initialValue: draft?.batchSubjectType ?? (
        subjectConstant?.transform?.kind === "CONSTANT"
          ? String(subjectConstant.transform.value) : "__KEEP__"),
      options: [
        {value:"__KEEP__",label:zh ? "— 不设置批次固定值 —" : "— No batch constant —"},
        {value:"ORGANIZATION",label:zh ? "机构／法人（ORGANIZATION）" : "Organization"},
        {value:"PERSON",label:zh ? "个人（PERSON）" : "Person"}
      ]
    }, {
      key:"subjectTypeScopeNotice",
      label: zh ? "适用范围及后果" : "Scope and consequences",
      semanticType:"object-extension-batch-constant-scope",
      control:"text" as const,readOnly:true,required:false,
      initialValue:zh
        ? "仅在整批主体身份一致时选择。保存到当前导入任务，不修改原 Excel；须重新预检查。"
        : "Only choose when every record has the same identity. Source Excel is unchanged; validate again."
    }];
  const fixedValueFacts = [...subjectFixedValue, ...otherConstantFacts];
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
    const requiresReview = ambiguous || metadataLike.test(column)
      || unavailableDraftSources.has(column);
    return {
      id: "source-" + index,
      title: column,
      // Show one immediately readable source sample. Counts, complete
      // examples, candidate purposes, editable label and type remain in place.
      summary: batchSourceExamplesV010(job, column, zh).split(" · ")[0],
      primaryFieldKey: "choice_" + index,
      reviewStatus: columnStatuses[index],
      statusByChoice: statusByChoiceFor(index),
      detailFieldKeys: [
        ...(ambiguous ? ["candidate_" + index] : []),
        "sample_" + index, "label_" + index, "type_" + index
      ],
      detailsLabel: zh ? "查看来源及候选字段用途"
        : "Inspect source and target-field purposes",
      defaultExpanded: requiresReview
    };
  });
  const statusKeys = [...new Set(reviewGroups.flatMap(group => [
    group.reviewStatus.key,
    ...Object.values(group.statusByChoice).map(status => status.key)
  ]))];
  const hasInitialAttention = columnStatuses.some(status =>
    status.key === "attention" || status.key === "proposed"
      || status.key === "suggested");
  const attentionKeys = statusKeys.filter(key =>
    key === "attention" || key === "proposed" || key === "suggested");
  const handledKeys = statusKeys.filter(key => key === "ignored");
  const reviewTable = {
    // V3 compact four-column density uses upstream Eidos #200 semantics.
    presentation: "compact" as const,
    columnLabels: {
      subject: zh ? "来源列名" : "Source column",
      evidence: zh ? "示例值" : "Example",
      decision: zh ? "对应系统字段" : "Target field",
      status: zh ? "状态" : "Status"
    },
    filter: {
      label: zh ? "显示" : "Show",
      selectedId: hasInitialAttention ? "needs" : "all",
      noMatchesMessage: zh
        ? "当前筛选没有需要处理的来源列，请选择全部字段。"
        : "No matching sources. Choose All fields.",
      options: [
        ...(attentionKeys.length ? [{
          id: "needs", label: zh ? "需要关注" : "Needs attention",
          statusKeys: attentionKeys
        }] : []),
        { id: "all", label: zh ? "全部字段" : "All fields", statusKeys },
        ...(handledKeys.length ? [{
          id: "handled", label: zh ? "不导入" : "Excluded",
          statusKeys: handledKeys
        }] : [])
      ]
    }
  };
  // The preview reads exactly the same Human choices as the Host command.
  // It neither preapproves an enterprise field nor invokes a mutation.
  const reviewPlan = {
    title: zh ? "本批字段处理方案预览" : "Review proposed field changes",
    description: zh
      ? "确认之前先检查全部来源列的处理方式；已隐藏的行也会计入预览。"
      : "Review every source decision, including filtered-out rows.",
    warning: zh
      ? "仅预览当前未保存的选择。新建企业字段需显式确认并通过 Host 校验；供应商数据仍须独立预检查与确认导入。"
      : "Preview of unsaved choices only. Host approval and separate import validation are required.",
    categories: [
      {id:"create",label:zh ? "拟新建企业字段" : "Proposed new fields",statusKeys:["proposed"]},
      {id:"reuse",label:zh ? "复用已有字段" : "Reuse existing fields",
        statusKeys:statusKeys.includes("suggested") ? ["suggested"] : []},
      {id:"ignore",label:zh ? "本次不导入" : "Exclude from this import",statusKeys:["ignored"]},
      {id:"pending",label:zh ? "尚待人工决定" : "Human decision pending",statusKeys:["attention"]}
    ],
    proposedFields: columns.map((_,index)=>({
      groupId:"source-"+index,labelFieldKey:"label_"+index,typeFieldKey:"type_"+index
    }))
  };
  const count = (key: string) =>
    columnStatuses.filter(status => status.key === key).length;
  const issues = reviewGroups.filter(group =>
    group.reviewStatus.key === "attention"
      || group.reviewStatus.key === "suggested");
  const reviewTask = {
    // Eidos #196: foreground Human choices; retain provenance on expansion.
    presentation: "workbench" as const,
    subject: {
      title: job.source.name ?? (zh ? "未完成的导入任务" : "Saved import task"),
      subtitle: (zh ? "集中审核 · " : "Batch review · ") +
        job.source.rows.length + (zh ? " 条记录 · " : " rows · ") +
        columns.length + (zh ? " 列待处理" : " pending columns"),
      statusLabel: unavailableDraftSources.size
        ? (zh ? "草稿中 " + unavailableDraftSources.size + " 列原目标已失效，需重新核对"
          : unavailableDraftSources.size + " saved targets unavailable; review required")
        : draft
        ? (zh ? "当前审核人的未批准草稿已恢复" : "Your unapproved review draft restored")
        : (zh ? "原始 Excel 已保留" : "Original Excel retained"),
      facts: [
        { id: "sourceColumns", label: zh ? "来源列总数" : "Source columns",
          value: String(job.source.headers.length) },
        { id: "unmatched", label: zh ? "待集中审核" : "Batch review",
          value: String(columns.length) }
      ]
    },
    steps: [
      { id: "upload", label: zh ? "选择文件" : "Choose file",
        state: "complete" as const },
      { id: "review", label: zh ? "集中审核字段" : "Review field decisions",
        state: "current" as const },
      { id: "commit", label: zh ? "预检查与导入" : "Validate & import",
        state: "upcoming" as const }
    ],
    metrics: [
      { id: "proposed", label: zh ? "待新增字段" : "Proposed fields",
        value: String(count("proposed")) },
      { id: "suggested", label: zh ? "待确认匹配" : "Suggested matches",
        value: String(count("suggested")) },
      { id: "ignored", label: zh ? "不导入的列" : "Excluded",
        value: String(count("ignored")) },
      { id: "attention", label: zh ? "需要校对" : "Needs review",
        value: String(count("attention")), tone: "warning" as const }
    ],
    issuesTitle: zh ? "需要处理" : "Requires attention",
    issuesDescription: zh
      ? "先核对有歧义的目标字段，再集中确认新增字段；系统不会自行创建。"
      : "Review ambiguous targets before approving creation.",
    issues: issues.slice(0, 12).map(group => ({
      id: group.id, title: group.title,
      description: group.reviewStatus.label + " · " + group.summary,
      focusGroupId: group.id, actionLabel: zh ? "核对本列" : "Review column"
    })),
    helpText: zh
      ? "建议不会自动生效。确认本页只会创建获批企业字段并保存映射，供应商数据仍须预检查和另行确认导入。"
      : "Only confirmed definitions and mappings are saved. Import requires separate validation and approval."
  };
  return {
    contractVersion: "0.1.1" as const, kind: "form" as const,
    id: "evo-object-extension.batch-import",
    ...(columns.length ? { reviewTable, reviewPlan } : {}), reviewTask,
    title: !columns.length
      ? (zh ? "修改本次导入的批次固定值" : "Edit saved batch constant")
      : zh ? "集中审核 " + columns.length + " 个未匹配字段"
        : "Review " + columns.length + " unmatched Excel columns",
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
    fields: [...fixedValueFacts, ...fields],
    actions: [{ id: "create-extension-batch",
      label: zh ? "确认：批量创建并自动映射" : "Confirm: create and map selected fields",
      type: "submit" as const, command: OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010,
      requiresConfirmation: true },
      { id: "save-review-draft",
        label: zh ? "保存当前审核草稿（不创建字段）" : "Save review draft (no field creation)",
        type: "submit" as const, command: OBJECT_EXTENSION_IMPORT_DRAFT_SAVE_COMMAND_V010,
        requiresConfirmation: false }],
    metadata: {
      packageId: "evo-object-extension", featureId: "evo-object-extension.default",
      importJobId: job.importJobId, unmatchedColumns: columns.length,
      description: zh
        ? "字段定义与供应商数据提交分开执行；失败后可重新进入并复用已创建字段。"
        : "Field creation and import commit are separate; retry reuses saved fields."
    }
  };
}
