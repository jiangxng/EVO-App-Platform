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
        recent: "最近导入",
        noJobs: "还没有导入任务。",
        uploadTitle: "上传数据文件",
        file: "CSV / XLSX 文件",
        stage: "读取文件并映射字段",
        relationshipRole: "关系角色",
        mappingTitle: "字段映射",
        mappingDescription:
          "确认每一列对应的 EVO 字段。系统已按字段 ID、中文/英文名称自动匹配，可忽略不需要的列。",
        ignore: "忽略此列",
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
        target: "目标对象"
      }
    : {
        title: "Data Import",
        description:
          "Safely import CSV / XLSX data into the current enterprise through explicit mapping, dry run and confirmation. Files never bypass domain validation.",
        chooseTarget: "Choose data to import",
        import: "Start import",
        recent: "Recent imports",
        noJobs: "No import jobs yet.",
        uploadTitle: "Upload data file",
        file: "CSV / XLSX file",
        stage: "Read file and map fields",
        relationshipRole: "Relationship role",
        mappingTitle: "Field mapping",
        mappingDescription:
          "Confirm how each source column maps to EVO fields. Matching by field ID and localized labels is suggested automatically.",
        ignore: "Ignore this column",
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
        target: "Target"
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

export function createDataImportDirectoryPageV010(input: {
  targets: readonly FoundationObjectImportTargetV010[];
  jobs: readonly DataImportJobV010[];
  locale?: string;
}): CatalogBrowserV010 {
  const t = text(input.locale);
  const targetItems = input.targets.map(target => ({
    id: "target:" + target.targetId,
    title: localizedTextV010(target.label, input.locale),
    summary: target.objectType,
    category: t.chooseTarget,
    metadata: {
      [t.target]: target.targetId
    },
    primaryAction: {
      id: "import",
      label: t.import,
      type: "navigate" as const,
      route: dataImportUploadRouteV010(target.targetId)
    }
  }));
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
          [t.source]: job.source.name ?? job.source.kind
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
    id: "evo-data-import.directory",
    title: t.title,
    description: t.description,
    items: [...targetItems, ...jobItems],
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
    input.job.mapping.map(item => [item.sourceColumn, item.targetFieldId])
  );

  return {
    contractVersion: "0.1.1" as const,
    kind: "form" as const,
    id: "evo-data-import.mapping",
    title: t.mappingTitle + " · " + (input.job.source.name ?? input.job.importJobId),
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
    }))],
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
      description: t.mappingDescription
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
      values: { importJobId: job.importJobId }
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
      } : {})
    },
    primaryAction: {
      id: "back",
      label: t.back,
      type: "navigate",
      route: DATA_IMPORT_DIRECTORY_ROUTE
    },
    secondaryActions: summaryActions
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
    id: "evo-data-import.review",
    title: t.reviewTitle,
    description: t.description,
    items
  };
}
