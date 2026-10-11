import type {
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
import {
  DATA_IMPORT_COMMIT_COMMAND_V010,
  DATA_IMPORT_DIRECTORY_ROUTE,
  DATA_IMPORT_ERROR_CSV_COMMAND_V010,
  DATA_IMPORT_REVIEW_COMMAND_V010,
  DATA_IMPORT_STAGE_FILE_COMMAND_V010,
  dataImportMappingRouteV010,
  dataImportReviewRouteV010,
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
        history: "导入历史",
        historyDescription: "查看过去的导入任务、处理状态和结果。",
        noJobs: "还没有导入历史。",
        uploadTitle: "上传数据文件",
        file: "CSV / XLSX 文件",
        stage: "读取文件并映射字段",
        relationshipRole: "关系角色",
        mappingTitle: "字段映射",
        mappingDescription:
          "确认每一列对应的 EVO 字段。系统已按字段 ID、中文/英文名称自动匹配，可忽略不需要的列。AI 设置的批次固定值和值转换会在下方显示，并在未被明确修改时保留。",
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

export function createDataImportDirectoryPageV010(input: {
  targets: readonly FoundationObjectImportTargetV010[];
  jobs: readonly DataImportJobV010[];
  locale?: string;
}): CatalogBrowserV010 {
  const t = text(input.locale);
  const importActions = input.targets.map(target => {
    const label = localizedTextV010(target.label, input.locale);
    return {
      id: "import:" + target.targetId,
      label: t.importTarget(label),
      type: "navigate" as const,
      route: dataImportUploadRouteV010(target.targetId),
      requiresConfirmation: false,
      ...(input.targets.length === 1 ? { primary: true } : {})
    };
  });
  const jobItems = [...input.jobs]
    .slice(0, 20)
    .map(job => {
      const status = stateLabel(job, input.locale);
      return {
        id: "job:" + job.importJobId,
        title: job.source.name || job.importJobId,
        summary: job.targetId + " · " + job.source.kind,
        category: t.recent,
        status,
        metadata: {
          [t.totalRows]: job.source.rows.length,
          [t.source]: job.source.name ?? job.source.kind,
          ...importEvidenceMetadata(job, input.locale)
        },
        primaryAction: {
          id: "open",
          label: job.state === "STAGED" ? t.mappingTitle : t.reviewTitle,
          type: "navigate" as const,
          route: job.state === "STAGED"
            ? dataImportMappingRouteV010(job.importJobId)
            : dataImportReviewRouteV010(job.importJobId)
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
    description: t.description,
    actions: importActions,
    collectionTitle: t.history,
    collectionDescription: t.historyDescription,
    items: jobItems,
    emptyMessage: t.noJobs
  };
}

export function createDataImportUploadPageV010(input: {
  target: FoundationObjectImportTargetV010;
  locale?: string;
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
    contextNavigation: {
      items: [{
        id: "data-import",
        label: t.title,
        route: DATA_IMPORT_DIRECTORY_ROUTE
      }, {
        id: "upload",
        label: t.uploadTitle
      }]
    },
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
      ...(parameter.defaultValue !== undefined
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
  locale?: string;
}) {
  const t = text(input.locale);
  const importFields = fieldsForSurfaceV010(input.schema, "IMPORT")
    .filter(field => field.writable);
  const current = new Map(
    input.job.mapping
      .filter(item => Boolean(item.sourceColumn))
      .map(item => [item.sourceColumn!, item.targetFieldId] as const)
  );
  const fieldLabel = new Map(
    importFields.map(field => [
      field.fieldId,
      field.resolvedLabel + " · " + field.fieldId
    ] as const)
  );
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

  return {
    contractVersion: "0.1.1" as const,
    kind: "form" as const,
    id: "evo-data-import.mapping",
    title: t.mappingTitle + " · " + (input.job.source.name ?? input.job.importJobId),
    description: input.job.mappingOrigin === "RECIPE"
      ? t.recipeAppliedDescription
      : advisoryFields.length > 0
        ? t.ecRecommendationDescription + " " + t.mappingDescription
        : t.mappingDescription,
    contextNavigation: {
      items: [{
        id: "data-import",
        label: t.title,
        route: DATA_IMPORT_DIRECTORY_ROUTE
      }, {
        id: "mapping",
        label: t.mappingTitle
      }]
    },
    purpose: "execute-command" as const,
    command: {
      code: DATA_IMPORT_REVIEW_COMMAND_V010,
      inputVersion: "0.1.0"
    },
    fields: [{
      key: "importJobId",
      label: "Import Job",
      semanticType: "data-import-job-id",
      control: "select" as const,
      required: true,
      initialValue: input.job.importJobId,
      options: [{
        value: input.job.importJobId,
        label: input.job.importJobId
      }]
    }, ...input.job.source.headers.map((sourceColumn, index) => ({
      key: "map_" + index,
      label: sourceColumn,
      semanticType: "data-import-field-mapping",
      control: "select" as const,
      required: true,
      initialValue: current.get(sourceColumn) ?? "__IGNORE__",
      options: [{
        value: "__IGNORE__",
        label: "— " + t.ignore + " —"
      }, ...importFields.map(field => ({
        value: field.fieldId,
        label: field.resolvedLabel + " · " + field.fieldId
      }))]
    })), ...advisoryFields, ...advancedFields],
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

export function createDataImportReviewPageV010(input: {
  job: DataImportJobV010;
  locale?: string;
}): CatalogBrowserV010 {
  const t = text(input.locale);
  const job = input.job;
  const status = stateLabel(job, input.locale);
  const dryRun = job.dryRun;
  const receipt = job.receipt;

  const summaryActions = [{
    id: "back",
    label: t.back,
    type: "navigate" as const,
    route: DATA_IMPORT_DIRECTORY_ROUTE
  }, {
    id: "remap",
    label: t.remap,
    type: "navigate" as const,
    route: dataImportMappingRouteV010(job.importJobId)
  }];
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

  for (const row of (dryRun?.rows ?? []).slice(0, 30)) {
    items.push({
      id: "row:" + row.rowNumber,
      title: rowLabel(t.row, row.rowNumber),
      summary: row.ok
        ? Object.entries(row.prepared?.values ?? {})
            .slice(0, 4)
            .map(([key, value]) => key + ": " + String(value ?? ""))
            .join(" · ")
        : row.issues.map(issue =>
            (issue.fieldId ? issue.fieldId + ": " : "") + issue.code
          ).join(" · "),
      status: {
        label: row.ok ? t.ready : t.invalid,
        tone: row.ok ? "positive" : "warning"
      }
    });
  }

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
      items: [{
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
      }]
    },
    actions: summaryActions,
    items
  };
}
