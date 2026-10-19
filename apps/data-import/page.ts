import {
  objectExtensionImportRouteV010
} from "../object-extension/constants.js";
import type {
  FoundationObjectImportIssueV010,
  FoundationObjectImportTargetSummaryV010,
  FoundationObjectImportTargetV010
} from "../../contracts/foundation-object/import.js";
import {
  fieldsForSurfaceV010,
  localizedTextV010,
  type EffectiveObjectSchemaV010
} from "../../contracts/foundation-object/schema.js";
import type {
  CatalogBrowserV010
} from "../../vendor/eidos/src/catalog-browser/contracts.js";
import type {
  DataImportJobV010
} from "./types.js";
import { dataImportCorrectableSourceV010 } from "./service.js";
import {
  dataImportIssueSourceEvidenceV010,
  dataImportSourceAuditItemsV010
} from "./source-audit.js";
import {
  DATA_IMPORT_COMMIT_COMMAND_V010,
  DATA_IMPORT_DIRECTORY_ROUTE,
  DATA_IMPORT_ERROR_CSV_COMMAND_V010,
  DATA_IMPORT_REVIEW_COMMAND_V010,
  DATA_IMPORT_STAGE_FILE_COMMAND_V010,
  dataImportMappingRouteV010,
  dataImportReviewRouteV010,
  dataImportRowCorrectRouteV010,
  dataImportUploadRouteV010
} from "./constants.js";

function zh(locale?: string): boolean {
  return (locale ?? "").toLowerCase().startsWith("zh");
}

function text(locale?: string) {
  return zh(locale)
    ? {
        title: "数据导入",
        description:
          "通过预检查、字段映射和明确确认，把 CSV / XLSX 数据安全导入当前企业。原始文件不会绕过业务对象校验。",
        chooseTarget: "选择要导入的数据对象",
        import: "开始导入",
        importTarget: (name: string) => "导入" + name,
        recent: "最近导入",
        unfinished: "待完成",
        continueImport: (name: string) => "继续导入 · " + name,
        continueMapping: "继续核对字段",
        continueReview: "继续查看预检查",
        continueFailed: "处理导入问题",
        unfinishedDescription: "未完成的导入已排在前面，之前保存的字段选择无需重新填写。",
        unnamedImport: "未命名文件",
        history: "导入历史",
        historyDescription: "查看过去的导入任务、处理状态和结果。",
        noJobs: "还没有导入历史。",
        uploadTitle: "上传数据文件",
        file: "CSV / XLSX 文件",
        stage: "读取文件并映射字段",
        relationshipRole: "关系角色",
        mappingTitle: "字段映射",
        mappingDescription:
          "先恢复本企业之前的映射，再按字段名建议匹配；可点击 AI 自动匹配。没有目标的列默认建议创建企业字段而非忽略，原始 Excel 全列保留。审核后再预检查和明确提交，允许后续修改映射。AI 设置的批次固定值和值转换仍会保留。",
        ignore: "忽略此列",
        batchConstant: "批次固定值",
        valueTransform: "值转换",
        aiMap: "AI 自动匹配",
        aiMapPrompt: "帮我做字段映射",
        validate: "保存映射并预检查",
        reviewTitle: "导入预检查",
        ready: "预检查通过",
        invalid: "发现问题",
        committed: "已导入",
        committedWithErrors: "导入失败",
        totalRows: "总行数",
        validRows: "可导入",
        invalidRows: "有问题",
        succeededRows: "成功",
        failedRows: "失败",
        commit: "确认导入",
        remap: "调整字段映射",
        downloadErrors: "下载错误清单",
        back: "返回数据导入",
        row: "第 {n} 行",
        source: "来源",
        target: "目标对象",
        mappingSource: "映射来源",
        deterministicMapping: "系统规则",
        recipeMapping: "已学习规则",
        humanMapping: "人工确认",
        agentMapping: "AI 辅助",
        explicitMapping: "显式映射",
        learnedRule: "导入规则",
        sourceEvidence: "原始来源",
        preserved: "已保留",
        unmappedColumns: "未映射列",
        none: "无",
        evidenceTitle: "来源与学习证据",
        evidenceDescription:
          "原始表头和行数据保留在本次导入记录中；未映射列不会因为本次未使用而被丢弃。成功确认导入后，可沉淀为企业导入规则供同结构文件复用。",
        recipeAppliedDescription:
          "系统已复用此前确认成功的企业导入规则并完成预检查。你可以直接核对结果；只有需要调整时才重新映射或请求 AI 辅助。",
        ecRecommendation: "EC 经验建议",
        ecRecommendationDescription:
          "Experience Compiler 根据以前由人工确认并成功导入的经验给出了字段建议。建议仍需你确认，EC 不会直接执行导入。",
        ecSupport: "成功经验",
        ecLearning: "EC 学习",
        ecLearningRecorded: "已记录",
        ecLearningUnavailable: "暂未记录"
      }
    : {
        title: "Data Import",
        description:
          "Safely import CSV / XLSX data into the current enterprise through explicit mapping, dry run and confirmation. Files never bypass domain validation.",
        chooseTarget: "Choose data to import",
        import: "Start import",
        importTarget: (name: string) => "Import " + name,
        recent: "Recent imports",
        unfinished: "To finish",
        continueImport: (name: string) => "Continue import · " + name,
        continueMapping: "Continue field review",
        continueReview: "Review validation",
        continueFailed: "Fix import issues",
        unfinishedDescription: "Incomplete imports appear first. Previously saved mapping choices remain available.",
        unnamedImport: "Untitled file",
        history: "Import history",
        historyDescription: "Review previous import jobs, processing status and results.",
        noJobs: "No import history yet.",
        uploadTitle: "Upload data file",
        file: "CSV / XLSX file",
        stage: "Read file and map fields",
        relationshipRole: "Relationship role",
        mappingTitle: "Field mapping",
        mappingDescription:
          "Confirm how each source column maps to EVO fields. Matching by field ID and localized labels is suggested automatically. AI-provided batch constants and value transforms are shown below and are preserved unless explicitly replaced.",
        ignore: "Ignore this column",
        batchConstant: "Batch constant",
        valueTransform: "Value transform",
        aiMap: "AI auto-match",
        aiMapPrompt: "Help me map the fields for this import.",
        validate: "Save mapping and validate",
        reviewTitle: "Import review",
        ready: "Validation passed",
        invalid: "Issues found",
        committed: "Imported",
        committedWithErrors: "Import failed",
        totalRows: "Total rows",
        validRows: "Valid",
        invalidRows: "Issues",
        succeededRows: "Succeeded",
        failedRows: "Failed",
        commit: "Confirm import",
        remap: "Adjust mapping",
        downloadErrors: "Download error list",
        back: "Back to Data Import",
        row: "Row {n}",
        source: "Source",
        target: "Target",
        mappingSource: "Mapping source",
        deterministicMapping: "System rules",
        recipeMapping: "Learned recipe",
        humanMapping: "Human confirmed",
        agentMapping: "AI assisted",
        explicitMapping: "Explicit mapping",
        learnedRule: "Import recipe",
        sourceEvidence: "Source evidence",
        preserved: "Preserved",
        unmappedColumns: "Unmapped columns",
        none: "None",
        evidenceTitle: "Source and learning evidence",
        evidenceDescription:
          "Original headers and row values remain preserved with this import job. Unmapped columns are not discarded. A successful confirmed import can become an enterprise import recipe for later files with the same structure.",
        recipeAppliedDescription:
          "A previously confirmed enterprise import recipe was reused and validation has already run. Review the result directly; remap or ask AI only when an adjustment is needed.",
        ecRecommendation: "EC experience recommendation",
        ecRecommendationDescription:
          "Experience Compiler suggested fields from prior Human-confirmed successful imports. You still confirm the mapping; EC never executes the import.",
        ecSupport: "successful experience(s)",
        ecLearning: "EC learning",
        ecLearningRecorded: "Recorded",
        ecLearningUnavailable: "Not recorded"
      };
}

function rowLabel(template: string, rowNumber: number): string {
  return template.replace("{n}", String(rowNumber));
}

function stateLabel(job: DataImportJobV010, locale?: string): {
  label: string;
  tone: "neutral" | "positive" | "warning";
} {
  const t = text(locale);
  switch (job.state) {
    case "DRY_RUN_READY":
      return { label: t.ready, tone: "positive" };
    case "DRY_RUN_FAILED":
      return { label: t.invalid, tone: "warning" };
    case "COMMITTED":
      return { label: t.committed, tone: "positive" };
    case "COMMITTED_WITH_ERRORS":
      return { label: t.committedWithErrors, tone: "warning" };
    default:
      return { label: "STAGED", tone: "neutral" };
  }
}

function mappingSourceLabel(
  job: DataImportJobV010,
  locale?: string
): string {
  const t = text(locale);
  switch (job.mappingOrigin) {
    case "RECIPE":
      return t.recipeMapping;
    case "HUMAN":
      return t.humanMapping;
    case "AGENT":
      return t.agentMapping;
    case "DETERMINISTIC":
      return t.deterministicMapping;
    default:
      return t.explicitMapping;
  }
}

function unmappedSourceColumns(job: DataImportJobV010): string[] {
  const mapped = new Set(
    job.mapping
      .map(item => item.sourceColumn)
      .filter((value): value is string => Boolean(value))
  );
  return job.source.headers.filter(header => !mapped.has(header));
}

function importEvidenceMetadata(
  job: DataImportJobV010,
  locale?: string
): Record<string, string | number | boolean> {
  const t = text(locale);
  const unmapped = unmappedSourceColumns(job);
  return {
    [t.mappingSource]: mappingSourceLabel(job, locale),
    ...(job.appliedRecipeId
      ? { [t.learnedRule]: job.appliedRecipeId }
      : {}),
    [t.unmappedColumns]: unmapped.length > 0
      ? unmapped.join(zh(locale) ? "、" : ", ")
      : t.none,
    [t.sourceEvidence]: t.preserved,
    ...(job.experienceLearning
      ? {
          [t.ecLearning]:
            job.experienceLearning.status === "RECORDED"
              ? t.ecLearningRecorded + " · "
                + job.experienceLearning.learnedMappings
              : t.ecLearningUnavailable
        }
      : {})
  };
}


/**
 * The business owner may provide a trusted local workspace destination.
 * This is an exit link, not an import commit, and must exist even when
 * mapping or validation fails. Do not accept arbitrary client return URLs.
 */
function objectWorkspaceNavigationV010(input: {
  target?: FoundationObjectImportTargetV010;
  parameters?: Readonly<Record<string, string | number | boolean | string[] | undefined>>;
  locale?: string;
}): { id: string; label: string; route: string } | undefined {
  const navigation = input.target?.completionNavigation?.({
    parameters: input.parameters,
    locale: input.locale
  });
  if (!navigation) return undefined;
  const route = navigation.route;
  if (!route.startsWith("/") || route.startsWith("//")
    || route.includes("#") || route.includes("\\")
    || /[\u0000-\u001f]/u.test(route)) {
    return undefined;
  }
  return {
    id: "object-workspace",
    label: localizedTextV010(navigation.label, input.locale),
    route
  };
}

function importContextNavigationV010(input: {
  target?: FoundationObjectImportTargetV010;
  parameters?: Readonly<Record<string, string | number | boolean | string[] | undefined>>;
  locale?: string;
  step: "upload" | "mapping" | "review";
}) {
  const t = text(input.locale);
  const destination = objectWorkspaceNavigationV010(input);
  return {
    items: [
      ...(destination ? [destination] : []),
      {
        id: "data-import",
        label: t.title,
        route: DATA_IMPORT_DIRECTORY_ROUTE
      },
      ...(input.step === "review"
        ? [{
            id: "mapping",
            label: t.mappingTitle
          }]
        : []),
      {
        id: input.step,
        label: input.step === "upload" ? t.uploadTitle
          : input.step === "mapping" ? t.mappingTitle : t.reviewTitle
      }
    ]
  };
}

export function createDataImportDirectoryPageV010(input: {
  targets: readonly FoundationObjectImportTargetSummaryV010[];
  jobs: readonly DataImportJobV010[];
  locale?: string;
}): CatalogBrowserV010 {
  const t = text(input.locale);
  const availableTargets = new Set(input.targets.map(target => target.targetId));
  // Read-only resume: only eligible current-target unfinished jobs. A committed
  // or partially committed job must never be exposed as a safe "resume" action.
  const isResumable = (job: DataImportJobV010): boolean =>
    availableTargets.has(job.targetId)
    && (job.state === "STAGED"
      || job.state === "DRY_RUN_FAILED"
      || job.state === "DRY_RUN_READY");
  const orderedJobs = [...input.jobs].sort((a, b) =>
    Number(isResumable(b)) - Number(isResumable(a))
    || b.stagedAt.localeCompare(a.stagedAt));
  const resumable = orderedJobs.find(isResumable);
  const routeForJob = (job: DataImportJobV010) =>
    job.state === "STAGED"
      ? dataImportMappingRouteV010(job.importJobId)
      : dataImportReviewRouteV010(job.importJobId);
  const importActions = input.targets.map(target => {
    const label = localizedTextV010(target.label, input.locale);
    return {
      id: "import:" + target.targetId,
      label: t.importTarget(label),
      type: "navigate" as const,
      route: dataImportUploadRouteV010(target.targetId),
      requiresConfirmation: false,
      ...(input.targets.length === 1 && !resumable ? { primary: true } : {})
    };
  });
  const jobItems = orderedJobs
    .slice(0, 20)
    .map(job => {
      const status = stateLabel(job, input.locale);
      return {
        id: "job:" + job.importJobId,
        title: job.source.name || job.importJobId,
        summary: job.targetId + " · " + job.source.kind,
        category: isResumable(job) ? t.unfinished : t.recent,
        status,
        metadata: {
          [t.totalRows]: job.source.rows.length,
          [t.source]: job.source.name ?? job.source.kind,
          ...importEvidenceMetadata(job, input.locale)
        },
        primaryAction: {
          id: "open",
          label: isResumable(job)
            ? job.state === "STAGED"
              ? t.continueMapping
              : job.state === "DRY_RUN_FAILED"
                ? t.continueFailed : t.continueReview
            : job.state === "STAGED" ? t.mappingTitle : t.reviewTitle,
          type: "navigate" as const,
          route: routeForJob(job)
        }
      };
    });

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    layout: "list",
    density: "compact",
    itemActivation: "primary-action",
    id: "evo-data-import.directory",
    title: t.title,
    description: resumable ? t.unfinishedDescription : t.description,
    actions: [
      ...(resumable ? [{
        id: "resume-import",
        label: t.continueImport(resumable.source.name || t.unnamedImport),
        type: "navigate" as const,
        route: routeForJob(resumable),
        requiresConfirmation: false,
        primary: true
      }] : []),
      ...importActions
    ],
    collectionTitle: t.history,
    collectionDescription: resumable
      ? t.unfinishedDescription : t.historyDescription,
    items: jobItems,
    emptyMessage: t.noJobs
  };
}

export function createDataImportUploadPageV010(input: {
  target: FoundationObjectImportTargetV010;
  locale?: string;
  initialParameters?: Readonly<Record<string, string>>;
}) {
  const t = text(input.locale);
  return {
    contractVersion: "0.1.1" as const,
    kind: "form" as const,
    id: "evo-data-import.upload",
    title: t.uploadTitle + " · " + localizedTextV010(
      input.target.label,
      input.locale
    ),
    description: t.description,
    contextNavigation: importContextNavigationV010({
      target: input.target,
      parameters: input.initialParameters,
      locale: input.locale,
      step: "upload"
    }),
    purpose: "execute-command" as const,
    command: {
      code: DATA_IMPORT_STAGE_FILE_COMMAND_V010,
      inputVersion: "0.1.0"
    },
    fields: [{
      key: "targetId",
      label: t.target,
      semanticType: "foundation-object-import-target",
      control: "select" as const,
      required: true,
      initialValue: input.target.targetId,
      options: [{
        value: input.target.targetId,
        label: localizedTextV010(input.target.label, input.locale)
      }]
    }, {
      key: "file",
      label: t.file,
      semanticType: "data-import-source-file",
      control: "file" as const,
      required: true,
      accept: [
        ".csv",
        ".xlsx",
        "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ],
      maxBytes: 20 * 1024 * 1024
    }, ...(input.target.parameters ?? []).map(parameter => ({
      key: "parameter__" + parameter.key,
      label: localizedTextV010(parameter.label, input.locale),
      semanticType: "data-import-target-parameter",
      control: "select" as const,
      required: parameter.required,
      ...(input.initialParameters?.[parameter.key] !== undefined
        && parameter.options.some(option =>
          option.value === input.initialParameters?.[parameter.key]
        )
        ? { initialValue: input.initialParameters[parameter.key] }
        : parameter.defaultValue !== undefined
          ? { initialValue: parameter.defaultValue }
          : {}),
      options: parameter.options.map(option => ({
        value: option.value,
        label: localizedTextV010(option.label, input.locale)
      }))
    }))],
    actions: [{
      id: "stage",
      label: t.stage,
      type: "submit" as const,
      command: DATA_IMPORT_STAGE_FILE_COMMAND_V010,
      requiresConfirmation: false
    }]
  };
}

export function createDataImportMappingPageV010(input: {
  job: DataImportJobV010;
  schema: EffectiveObjectSchemaV010;
  target?: FoundationObjectImportTargetV010;
  locale?: string;
  canCreateExtension?: boolean;
  createdMapping?: {sourceColumn: string; fieldId: string};
}) {
  const t = text(input.locale);
  const importFields = fieldsForSurfaceV010(input.schema, "IMPORT")
    .filter(field => field.writable);
  const unmapped = unmappedSourceColumns(input.job);
  const canReviewBatchConstant = input.canCreateExtension === true
    && input.job.targetId === "counterparty.subject"
    && !input.job.mapping.some(entry =>
      entry.targetFieldId === "subjectType" && Boolean(entry.sourceColumn));
  const current = new Map(
    input.job.mapping
      .filter(item => Boolean(item.sourceColumn))
      .map(item => [item.sourceColumn!, item.targetFieldId] as const)
  );
  const normalizedLabel = (v: string): string =>
    v.normalize("NFKC").trim().toLocaleLowerCase();
  const candidatesFor = (column: string) => importFields.filter(field =>
    normalizedLabel(field.resolvedLabel) === normalizedLabel(column)
  );
  // The actual /data-import/jobs/:id/map route must consume Eidos reviewGroups;
  // the separate object-extension batch route does not own this screen.
  // These profiles are derived only from original, authorized source rows.
  const sourceProfiles = input.job.source.headers.map(sourceColumn => {
    const examples: string[] = [];
    const seen = new Set<string>();
    let nonempty = 0;
    for (const row of input.job.source.rows) {
      const value = row[sourceColumn];
      if (value === null || value === undefined || value === "") continue;
      nonempty++;
      const literal = String(value);
      if (!seen.has(literal) && examples.length < 3) {
        seen.add(literal);
        examples.push(literal.length > 48 ? literal.slice(0, 48) + "…" : literal);
      }
    }
    return {
      nonempty,
      examples,
      // The four-column table needs a quick visual sample; the expanded evidence
      // remains available even on already-mapped source columns.
      summary: examples[0]
        ?? (zh(input.locale) ? "来源数据为空" : "Blank source data"),
      detailSummary: (zh(input.locale) ? "非空 " : "Nonempty ")
        + nonempty + " / " + input.job.source.rows.length + " · "
        + (examples.length ? examples.join(" · ")
          : (zh(input.locale) ? "来源数据为空" : "Blank source data"))
    };
  });
  const usedTargets = new Set(input.job.mapping.map(item => item.targetFieldId));
  // Duplicate labels (including two 开户银行) are never selected by name alone.
  const uniqueExistingField = (column: string): string | undefined => {
    const matches = candidatesFor(column);
    return matches.length === 1 && !usedTargets.has(matches[0].fieldId)
      ? matches[0].fieldId : undefined;
  };
  const fieldLabel = new Map(importFields.map(field => [
    field.fieldId,
    // Value always remains the real fieldId; show its technical identity only
    // when identical business labels require a Human choice between candidates.
    field.resolvedLabel
      + (candidatesFor(field.resolvedLabel).length > 1
        ? " · " + (field.resolvedDescription?.trim()
          || (zh(input.locale) ? "业务用途待核对" : "Purpose needs review"))
          + " · " + field.fieldId
        : "")
  ] as const));
  const advisoryFields = input.job.mapping
    .filter(item => Boolean(item.advisory))
    .map((item, index) => {
      const advisory = item.advisory!;
      const label = fieldLabel.get(item.targetFieldId) ?? item.targetFieldId;
      return {
        key: "advisory_" + index,
        label: t.ecRecommendation + " · " + (item.sourceColumn ?? ""),
        semanticType: "data-import-ec-recommendation",
        control: "text" as const,
        required: false,
        readOnly: true,
        initialValue:
          (item.sourceColumn ?? "")
          + " → " + label
          + " · " + Math.round(advisory.confidence * 100) + "%"
          + " · " + advisory.supportCount + " " + t.ecSupport
      };
    });
  const advancedFields = input.job.mapping
    .filter(item => Boolean(item.transform))
    .map((item, index) => {
      const transform = item.transform;
      if (!transform) {
        throw new Error("DATA_IMPORT_ADVANCED_MAPPING_TRANSFORM_REQUIRED");
      }
      const label = fieldLabel.get(item.targetFieldId) ?? item.targetFieldId;
      if (transform.kind === "CONSTANT") {
        return {
          key: "advanced_" + index,
          label: t.batchConstant + " · " + label,
          semanticType: "data-import-batch-constant",
          control: "text" as const,
          required: false,
          readOnly: true,
          initialValue: String(transform.value ?? "")
        };
      }
      return {
        key: "advanced_" + index,
        label: t.valueTransform + " · "
          + (item.sourceColumn ?? "")
          + " → " + label,
        semanticType: "data-import-value-transform",
        control: "text" as const,
        required: false,
        readOnly: true,
        initialValue: transform.entries
          .map(entry => String(entry.source ?? "")
            + " → " + String(entry.target ?? ""))
          .join("; ")
      };
    });

  const mappingSelectionFor = (sourceColumn: string): string =>
    current.get(sourceColumn)
      ?? (input.createdMapping?.sourceColumn === sourceColumn
        && importFields.some(field => field.fieldId === input.createdMapping?.fieldId)
          ? input.createdMapping.fieldId
          : input.job.ignoredSourceColumns?.includes(sourceColumn)
            ? "__IGNORE__"
            : uniqueExistingField(sourceColumn)
              ?? (candidatesFor(sourceColumn).length > 0
                ? "__PENDING__"
                : input.canCreateExtension && input.job.targetId === "counterparty.subject"
                  ? "__CREATE__" : "__PENDING__"));
  // Status reflects the Host-restored decision, not an unverified suggestion.
  // Source metadata-looking headings are surfaced for Human review, never auto-ignored.
  const metadataLikeColumn = (column: string) =>
    /^(系统编码|系统编号|流程状态|表单状态|系统状态|内部编号)$/.test(column.trim());
  const reviewStatusFor = (sourceColumn: string) => {
    const selected = mappingSelectionFor(sourceColumn);
    const candidates = candidatesFor(sourceColumn);
    const resolved = current.has(sourceColumn) && importFields.some(field =>
      field.fieldId === current.get(sourceColumn));
    if (selected === "__IGNORE__") return {
      key: "ignored", label: zh(input.locale) ? "不导入" : "Excluded",
      tone: "neutral" as const
    };
    if (resolved && candidates.length <= 1 && !metadataLikeColumn(sourceColumn)) return {
      key: "matched", label: zh(input.locale) ? "已匹配" : "Matched",
      tone: "positive" as const
    };
    if (selected === "__CREATE__" && !metadataLikeColumn(sourceColumn))
      return {
        key: "proposed", label: zh(input.locale) ? "待新增" : "Proposed",
        tone: "neutral" as const
      };
    if (selected !== "__PENDING__" && !current.has(sourceColumn)
      && selected !== "__CREATE__" && candidates.length === 1
      && !metadataLikeColumn(sourceColumn)) return {
        key: "suggested", label: zh(input.locale) ? "待确认匹配" : "Suggested",
        tone: "neutral" as const
      };
    return {
      key: "attention", label: zh(input.locale) ? "需要核对" : "Needs review",
      tone: "warning" as const
    };
  };

  const reviewGroups = input.job.source.headers.map((sourceColumn, index) => {
    const candidates = candidatesFor(sourceColumn);
    const target = current.get(sourceColumn);
    const ambiguous = candidates.length > 1;
    const unavailable = Boolean(target)
      && !importFields.some(field => field.fieldId === target);
    return {
      id: "map-source-" + index,
      title: sourceColumn,
      summary: sourceProfiles[index].summary,
      primaryFieldKey: "map_" + index,
      reviewStatus: reviewStatusFor(sourceColumn),
      // One row = one short visible sample, plus complete source preview on demand.
      // Keep original column/row values in the unchanged, durable Import Job.
      detailFieldKeys: [
        "sourceEvidence_" + index,
        ...(ambiguous ? ["candidateEvidence_" + index] : [])
      ],
      ...(ambiguous || unavailable ? { defaultExpanded: true } : {}),
      detailsLabel: zh(input.locale)
        ? "查看来源及候选字段用途" : "Inspect source and field candidates"
    };
  });

  // Eidos E2 validates each filter status against THIS authorized Job.
  // Do not advertise states absent from the current table: a fresh Job may
  // contain only previously mapped columns, or only unresolved columns.
  const statusKeys = [...new Set(reviewGroups.map(group =>
    group.reviewStatus.key))];
  const attentionKeys = statusKeys.filter(key =>
    key === "attention" || key === "proposed" || key === "suggested");
  const handledKeys = statusKeys.filter(key =>
    key === "matched" || key === "ignored");
  const filterOptions = [
    ...(attentionKeys.length ? [{
      id: "needs",
      label: zh(input.locale) ? "需要关注" : "Needs attention",
      statusKeys: attentionKeys
    }] : []),
    {
      id: "all",
      label: zh(input.locale) ? "全部字段" : "All fields",
      statusKeys
    },
    ...(handledKeys.length ? [{
      id: "handled",
      label: zh(input.locale) ? "已处理" : "Handled",
      statusKeys: handledKeys
    }] : [])
  ];
  const reviewTable = {
    // V3 compact four-column density uses upstream Eidos #200 semantics.
    presentation: "compact" as const,
    columnLabels: {
      subject: zh(input.locale) ? "来源列名" : "Source column",
      evidence: zh(input.locale) ? "示例值" : "Examples",
      decision: zh(input.locale) ? "对应系统字段" : "Target field",
      status: zh(input.locale) ? "状态" : "Status"
    },
    filter: {
      label: zh(input.locale) ? "显示" : "Show",
      selectedId: attentionKeys.length ? "needs" : "all",
      noMatchesMessage: zh(input.locale)
        ? "当前筛选没有需要处理的列。可选择“全部字段”查看原始列。"
        : "No matching columns. Choose All fields to inspect the source.",
      options: filterOptions
    }
  };

  const countStatus = (key: string): number =>
    reviewGroups.filter(group => group.reviewStatus.key === key).length;
  const attentionColumns = reviewGroups.filter(group =>
    group.reviewStatus.key === "attention"
      || group.reviewStatus.key === "suggested");
  const reviewTask = {
    // Eidos #196: keep all task context behind an accessible disclosure
    // so real source-row decisions lead the first viewport.
    presentation: "decision-first" as const,
    subject: {
      title: input.job.source.name ?? input.job.importJobId,
      subtitle: (zh(input.locale) ? "导入文件 · " : "Source file · ")
        + input.job.source.rows.length + (zh(input.locale) ? " 条记录 · " : " rows · ")
        + input.job.source.headers.length + (zh(input.locale) ? " 列" : " columns"),
      statusLabel: zh(input.locale) ? "来源数据已保留" : "Source preserved",
      facts: [{
        id:"records",label:zh(input.locale)?"记录数":"Records",
        value:String(input.job.source.rows.length)
      }, {
        id:"columns",label:zh(input.locale)?"来源列数":"Columns",
        value:String(input.job.source.headers.length)
      }]
    },
    steps: [{
      id:"source",label:zh(input.locale)?"选择文件":"Choose file",
      state:"complete" as const
    }, {
      id:"review",label:zh(input.locale)?"核对映射":"Review mapping",
      state:"current" as const
    }, {
      id:"commit",label:zh(input.locale)?"预检查与导入":"Validate & import",
      state:"upcoming" as const
    }],
    metrics: [{
      id:"matched",label:zh(input.locale)?"已匹配":"Matched",
      value:String(countStatus("matched")),tone:"positive" as const
    }, {
      id:"proposed",label:zh(input.locale)?"待新增字段":"Proposed fields",
      value:String(countStatus("proposed"))
    }, {
      id:"ignored",label:zh(input.locale)?"不导入的列":"Excluded columns",
      value:String(countStatus("ignored"))
    }, {
      id:"attention",label:zh(input.locale)?"需要核对":"Needs review",
      value:String(attentionColumns.length),tone:"warning" as const
    }],
    issuesTitle: zh(input.locale) ? "需要处理" : "Requires attention",
    issuesDescription: zh(input.locale)
      ? "只显示需要人工判断的来源列；可直接跳到对应的字段选择。"
      : "Review only uncertain sources; jump directly to the relevant choice.",
    issues: attentionColumns.slice(0,12).map(group => ({
      id:group.id,
      title:group.title,
      description:group.reviewStatus.label + " · " + group.summary,
      focusGroupId:group.id,
      actionLabel:zh(input.locale)?"核对本列":"Review column"
    })),
    helpText:zh(input.locale)
      ? "更改映射后仍需明确保存和预检查；当前列表不会自动提交业务数据。"
      : "Changes require explicit save and validation; viewing does not commit records."
  };
  return {
    contractVersion: "0.1.1" as const,
    kind: "form" as const,
    id: "evo-data-import.mapping",
    reviewGroups,
    reviewTable,
    reviewTask,
    title: t.mappingTitle + " · " + (input.job.source.name ?? input.job.importJobId),
    description: input.job.mappingOrigin === "RECIPE"
      ? t.recipeAppliedDescription
      : advisoryFields.length > 0
        ? t.ecRecommendationDescription + " " + t.mappingDescription
        : t.mappingDescription,
    contextNavigation: {
      items: [
        ...importContextNavigationV010({
          target: input.target,
          parameters: input.job.targetParameters,
          locale: input.locale,
          step: "mapping"
        }).items,
        ...(input.canCreateExtension && input.job.targetId === "counterparty.subject" && unmapped.length > 0
          ? [{
              id:"batch-review",
              label:zh(input.locale)
                ? "集中审核 " + unmapped.length + " 个未匹配字段"
                : "Review " + unmapped.length + " unmatched fields together",
              route:objectExtensionImportRouteV010(input.job.importJobId) + "&mode=batch"
            }, {
              id:"create-extension",
              label:zh(input.locale)?"创建企业扩展字段（未匹配列）":"Create extension from unmapped columns",
              route:objectExtensionImportRouteV010(input.job.importJobId)
            }]
          : []),
        ...(!unmapped.length && canReviewBatchConstant ? [{
          id:"batch-constant",
          label:zh(input.locale) ? "核对本次导入的批次固定值" : "Review batch constant",
          route:objectExtensionImportRouteV010(input.job.importJobId) + "&mode=batch"
        }] : [])
      ]
    },
    purpose: "execute-command" as const,
    command: {
      code: DATA_IMPORT_REVIEW_COMMAND_V010,
      inputVersion: "0.1.0"
    },
    fields: [{
      key: "importJobId",
      // Job identity stays the Host command value, never the visible file name.
      label: zh(input.locale) ? "当前文件" : "Current file",
      semanticType: "data-import-job-id",
      control: "select" as const,
      required: true,
      initialValue: input.job.importJobId,
      options: [{
        value: input.job.importJobId,
        label: input.job.source.name
          ?? (zh(input.locale) ? "已保存的导入任务" : "Saved import task")
      }]
    }, ...(!unmapped.length && canReviewBatchConstant ? [{
      key:"batchConstantEntry",
      label:zh(input.locale) ? "本次导入的批次固定值" : "Batch constant for this import",
      semanticType:"data-import-batch-constant-review-link",
      control:"text" as const,readOnly:true,required:false,
      initialValue:zh(input.locale)
        ? "批次值作用于全部记录。仅当来源列未映射主体类型时可人工设置；保存后必须重新预检查。"
        : "A batch value applies to all rows. Confirm explicitly and validate again.",
      contextLink:{
        label:zh(input.locale) ? "查看或修改批次固定值" : "Review or edit batch constant",
        route:objectExtensionImportRouteV010(input.job.importJobId) + "&mode=batch"
      }
    }] : []), ...(input.canCreateExtension && input.job.targetId === "counterparty.subject" && unmapped.length > 0
      ? [{
          key: "batchReviewEntry",
          label: zh(input.locale)
            ? "批量字段审核 · 先复用已有映射，可先使用 AI 自动匹配"
            : "Batch field review · reuse prior mappings, optionally ask AI",
          semanticType: "data-import-batch-review-link",
          control: "text" as const,
          readOnly: true,
          required: false,
          initialValue: zh(input.locale)
            ? "未匹配的来源列已保留。集中审核后一次创建并自动映射，不会自动提交供应商数据。"
            : "Unmatched source values are preserved. Confirm fields together before importing.",
          contextLink: {
            label: zh(input.locale)
              ? "集中审核 " + unmapped.length + " 个未匹配字段"
              : "Review " + unmapped.length + " unmatched columns together",
            route: objectExtensionImportRouteV010(input.job.importJobId) + "&mode=batch"
          }
        }]
      : []), ...input.job.source.headers.flatMap((sourceColumn, index) => {
      const candidates = candidatesFor(sourceColumn);

      return [
        {
          key:"sourceEvidence_" + index,
          label:sourceColumn + (zh(input.locale) ? " · 原始样本" : " · Source examples"),
          semanticType:"data-import-original-source-evidence",
          control:"text" as const,readOnly:true,required:false,
          initialValue: sourceProfiles[index].detailSummary
        },
        ...(candidates.length > 1 ? [{
          key:"candidateEvidence_" + index,
          label:sourceColumn + (zh(input.locale)
            ? " · 同名目标用途核对" : " · Compare same-name target purpose"),
          semanticType:"data-import-target-purpose-review",
          control:"text" as const,readOnly:true,required:false,
          initialValue:candidates.map(field => field.resolvedLabel + " · "
            + (field.resolvedDescription?.trim()
              || (zh(input.locale) ? "业务用途待确认" : "Purpose needs confirmation"))
            + " · " + field.fieldId
            + (input.job.mapping.some(item => item.targetFieldId === field.fieldId)
              ? (zh(input.locale) ? " · 已被其他来源占用" : " · Already assigned")
              : "")).join(" ； ")
        }] : []),
        {
      key: "map_" + index,
      label: sourceColumn,
      semanticType: "data-import-field-mapping",
      control: "select" as const,
      exclusiveSelect: { group: "data-import-targets", exemptValues: ["__IGNORE__", "__CREATE__", "__PENDING__"] },
      required: true,
      initialValue: mappingSelectionFor(sourceColumn),
      ...(input.canCreateExtension === true
        && input.job.targetId === "counterparty.subject"
        && unmapped.includes(sourceColumn)
        && candidatesFor(sourceColumn).length === 0
        ? {
            contextLink: {
              label: zh(input.locale)
                ? "＋ 为本列创建企业扩展字段"
                : "+ Create enterprise field for this column",
              route: objectExtensionImportRouteV010(input.job.importJobId, sourceColumn)
            }
          }
        : {}),
      options: [{
        value: "__PENDING__",
        label: zh(input.locale) ? "— 待处理（原始列已保留） —" : "— Pending (source preserved) —"
      }, ...(input.canCreateExtension && input.job.targetId === "counterparty.subject"
        ? [{value: "__CREATE__", label: zh(input.locale)
          ? "＋ 建议新建企业字段（集中审核确认）"
          : "+ Propose enterprise field (confirm in batch review)"}]
        : []), {
        value: "__IGNORE__",
        label: "— " + t.ignore + " —"
      }, ...(current.get(sourceColumn)
        && !importFields.some(field => field.fieldId === current.get(sourceColumn))
        ? [{value: current.get(sourceColumn)!, label: zh(input.locale)
          ? "⚠ 原映射目标不可用，需修复 · " + current.get(sourceColumn)
          : "⚠ Previous target unavailable; review · " + current.get(sourceColumn)}]
        : []), ...importFields.map(field => ({
        value: field.fieldId,
        label: fieldLabel.get(field.fieldId) ?? field.fieldId
      }))]
        }
      ];
    }), ...advisoryFields, ...advancedFields],
    actions: [{
      id: "review",
      label: t.validate,
      type: "submit" as const,
      command: DATA_IMPORT_REVIEW_COMMAND_V010,
      requiresConfirmation: false
    }, {
      id: "ai-auto-map",
      label: t.aiMap,
      type: "agent" as const,
      prompt: t.aiMapPrompt,
      agentCapability: "agent.personal",
      context: {
        taskKind: "data-import.mapping",
        importJobId: input.job.importJobId,
        targetId: input.job.targetId
      },
      refreshSourceOnComplete: true
    }],
    metadata: {
      description: input.job.mappingOrigin === "RECIPE"
        ? t.recipeAppliedDescription
        : t.mappingDescription,
      ...importEvidenceMetadata(input.job, input.locale)
    }
  };
}

function importReviewIssueMessageV010(input: {
  issue: FoundationObjectImportIssueV010;
  schema?: EffectiveObjectSchemaV010;
  locale?: string;
}): string {
  const { issue, schema, locale } = input;
  const field = schema?.fields.find(item => item.fieldId === issue.fieldId);
  const fieldLabel = field
    ? localizedTextV010(field.label, locale)
    : issue.fieldId;
  if (issue.code === "DATA_IMPORT_REQUIRED_VALUE_MISSING") {
    const instructions = zh(locale)
      ? "这是必填字段，目前没有值。请点击“调整字段映射”检查对应来源列；如果文件缺少该字段，需要补充数据后重新上传。"
      : "A required value is missing. Use Adjust mapping to check its source column, or add the missing value to the file and upload it again.";
    return (fieldLabel ? fieldLabel + "：" : "") + instructions;
  }
  const detail = issue.message && issue.message !== issue.code
    ? issue.message
    : issue.code;
  return (fieldLabel ? fieldLabel + ": " : "") + detail;
}

export function createDataImportReviewPageV010(input: {
  job: DataImportJobV010;
  locale?: string;
  target?: FoundationObjectImportTargetV010;
  schema?: EffectiveObjectSchemaV010;
}): CatalogBrowserV010 {
  const t = text(input.locale);
  const job = input.job;
  const status = stateLabel(job, input.locale);
  const dryRun = job.dryRun;
  const receipt = job.receipt;

  const workspace = objectWorkspaceNavigationV010({
    target: input.target,
    parameters: job.targetParameters,
    locale: input.locale
  });
  const summaryActions = [
    ...(workspace ? [{
      id: "return-to-target",
      label: workspace.label,
      type: "navigate" as const,
      route: workspace.route
    }] : []),
    {
      id: "back",
      label: t.back,
      type: "navigate" as const,
      route: DATA_IMPORT_DIRECTORY_ROUTE
    }, {
      id: "remap",
      label: t.remap,
      type: "navigate" as const,
      route: dataImportMappingRouteV010(job.importJobId)
    }
  ];
  if (job.state === "DRY_RUN_READY") {
    summaryActions.push({
      id: "commit",
      label: t.commit,
      type: "command" as const,
      command: DATA_IMPORT_COMMIT_COMMAND_V010,
      inputVersion: "0.1.0",
      requiresConfirmation: true,
      values: { importJobId: job.importJobId },
      primary: true
    } as never);
  }
  if ((dryRun?.invalidRows ?? 0) > 0) {
    summaryActions.push({
      id: "errors",
      label: t.downloadErrors,
      type: "command" as const,
      command: DATA_IMPORT_ERROR_CSV_COMMAND_V010,
      inputVersion: "0.1.0",
      requiresConfirmation: false,
      values: { importJobId: job.importJobId }
    } as never);
  }

  const items: CatalogBrowserV010["items"] = [{
    id: "summary",
    title: job.source.name || job.importJobId,
    summary: job.targetId + " · " + job.source.kind,
    status,
    metadata: {
      [t.totalRows]: dryRun?.totalRows ?? receipt?.totalRows ?? job.source.rows.length,
      ...(dryRun ? {
        [t.validRows]: dryRun.validRows,
        [t.invalidRows]: dryRun.invalidRows
      } : {}),
      ...(receipt ? {
        [t.succeededRows]: receipt.succeededRows,
        [t.failedRows]: receipt.failedRows
      } : {}),
      ...importEvidenceMetadata(job, input.locale)
    },
  }, {
    id: "evidence",
    title: t.evidenceTitle,
    summary: t.evidenceDescription,
    status: {
      label: t.preserved,
      tone: "neutral"
    },
    metadata: {
      [t.source]: job.source.name ?? job.source.kind,
      [t.totalRows]: job.source.rows.length,
      ...importEvidenceMetadata(job, input.locale)
    }
  }];

  // Exceptions are reviewed first regardless of their Excel row position.
  // Preserve a bounded result list; the complete source-column audit below
  // still covers every original header, without changing the Host job.
  const reviewedRows = dryRun?.rows ?? [];
  const correctedRowNumbers = new Set(
    (job.rowCorrections ?? []).map(item => item.rowNumber)
  );
  const visibleRows = [
    ...reviewedRows.filter(row => !row.ok),
    ...reviewedRows.filter(row => row.ok && correctedRowNumbers.has(row.rowNumber)),
    ...reviewedRows.filter(row => row.ok && !correctedRowNumbers.has(row.rowNumber))
  ].slice(0, 30);
  for (const row of visibleRows) {
    const targetCorrection = (job.rowCorrections ?? [])
      .find(item => item.rowNumber === row.rowNumber);
    const sourceMapping = targetCorrection
      ? job.mapping.find(item => item.sourceColumn === targetCorrection.sourceColumn)
      : job.mapping.find(item => item.sourceColumn && row.issues.some(issue =>
          issue.fieldId === item.targetFieldId));
    const correctionColumn = sourceMapping?.sourceColumn;
    let correctionRoute: string | undefined;
    if (correctionColumn && input.schema) {
      try {
        dataImportCorrectableSourceV010({
          job, schema: input.schema, rowNumber: row.rowNumber,
          sourceColumn: correctionColumn
        });
        correctionRoute = dataImportRowCorrectRouteV010(
          job.importJobId, row.rowNumber, job.source.headers.indexOf(correctionColumn)
        );
      } catch {
        // Some invalid fields require a mapping or file-level repair, not a cell patch.
      }
    }
    items.push({
      id: "row:" + row.rowNumber,
      title: rowLabel(t.row, row.rowNumber),
      summary: row.ok
        ? Object.entries(row.prepared?.values ?? {})
            .slice(0, 4)
            .map(([key, value]) => key + ": " + String(value ?? ""))
            .join(" · ")
        : row.issues.map(issue => importReviewIssueMessageV010({
            issue,
            schema: input.schema,
            locale: input.locale
          })).join(" · "),
      status: {
        label: row.ok ? t.ready : t.invalid,
        tone: row.ok ? "positive" : "warning"
      },
      category: row.ok
        ? (zh(input.locale) ? "通过预检查" : "Validated")
        : (zh(input.locale) ? "需要处理" : "Needs attention"),
      ...(row.ok ? {} : {
        metadata: dataImportIssueSourceEvidenceV010({
          job, row, locale: input.locale
        })
      }),
      ...(correctionRoute ? {
        primaryAction: {
          id: "correct-row:" + row.rowNumber,
          label: targetCorrection
            ? (zh(input.locale) ? "查看或撤销本行更正" : "Review or revert correction")
            : (zh(input.locale) ? "修正本行问题" : "Correct this row"),
          type: "navigate" as const,
          route: correctionRoute
        }
      } : {})
    });
  }
  // Audit every actual source header (mapped, ignored and unresolved).
  // Source cells stay in the persisted enterprise job, not in browser state.
  items.push(...dataImportSourceAuditItemsV010({
    job,
    schema: input.schema,
    locale: input.locale
  }));

  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    layout: "list",
    density: "compact",
    id: "evo-data-import.review",
    title: t.reviewTitle,
    description: job.mappingOrigin === "RECIPE"
      ? t.recipeAppliedDescription
      : t.description,
    contextNavigation: {
      items: [
        ...(workspace ? [workspace] : []),
        {
          id: "data-import",
          label: t.title,
          route: DATA_IMPORT_DIRECTORY_ROUTE
        }, {
          id: "mapping",
          label: t.mappingTitle,
          route: dataImportMappingRouteV010(job.importJobId)
        }, {
          id: "review",
          label: t.reviewTitle
        }
      ]
    },
    actions: summaryActions,
    items
  };
}
