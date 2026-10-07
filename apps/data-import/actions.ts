import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010,
  JsonValue
} from "../../actions/contracts.js";
import type {
  FoundationObjectImportTargetParametersV010,
  FoundationObjectImportTargetV010
} from "../../contracts/foundation-object/import.js";
import type {
  PlatformPrincipalV010,
  PlatformRequestContextV010
} from "../../contracts/platform-services.js";
import {
  parseCsvSourceV010
} from "./csv.js";
import {
  parseXlsxSourceV010
} from "./xlsx.js";
import type {
  DataImportRepositoryV010
} from "./repository.js";
import type {
  DataImportServiceV010
} from "./service.js";
import type {
  DataImportMappingV010
} from "./types.js";
import {
  DATA_IMPORT_COMMIT_COMMAND_V010,
  DATA_IMPORT_DRY_RUN_COMMAND_V010,
  DATA_IMPORT_ERROR_CSV_COMMAND_V010,
  DATA_IMPORT_FEATURE_ID,
  DATA_IMPORT_GET_COMMAND_V010,
  DATA_IMPORT_PACKAGE_ID,
  DATA_IMPORT_REVIEW_COMMAND_V010,
  DATA_IMPORT_STAGE_CSV_COMMAND_V010,
  DATA_IMPORT_STAGE_FILE_COMMAND_V010,
  dataImportMappingRouteV010,
  dataImportReviewRouteV010
} from "./constants.js";

function text(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function required(value: unknown, code: string): string {
  const normalized = text(value);
  if (!normalized) throw new Error(code);
  return normalized;
}

function activeEnterpriseContext(
  context: PlatformRequestContextV010 | undefined
): { contextId: string; enterpriseId: string } {
  const active = context?.context?.activeContext;
  if (
    !context
    || !active
    || active.kind !== "ENTERPRISE"
    || !active.contextId?.trim()
    || !active.enterpriseId?.trim()
  ) {
    throw new Error("DATA_IMPORT_ENTERPRISE_CONTEXT_REQUIRED");
  }
  return {
    contextId: active.contextId.trim(),
    enterpriseId: active.enterpriseId.trim()
  };
}

function ensureManage(
  principal: PlatformPrincipalV010,
  contextId: string,
  canManageEnterpriseContext: (
    principal: PlatformPrincipalV010,
    contextId: string
  ) => boolean
): void {
  if (!canManageEnterpriseContext(principal, contextId)) {
    throw new Error("DATA_IMPORT_MANAGE_ROLE_REQUIRED");
  }
}

function mapping(value: JsonValue | undefined): DataImportMappingV010[] {
  if (!Array.isArray(value)) throw new Error("DATA_IMPORT_MAPPING_REQUIRED");
  return value.map(item => {
    if (item === null || Array.isArray(item) || typeof item !== "object") {
      throw new Error("DATA_IMPORT_MAPPING_INVALID");
    }
    return {
      sourceColumn: required(
        item.sourceColumn,
        "DATA_IMPORT_MAPPING_SOURCE_REQUIRED"
      ),
      targetFieldId: required(
        item.targetFieldId,
        "DATA_IMPORT_MAPPING_TARGET_REQUIRED"
      )
    };
  });
}

function targetParameters(
  value: JsonValue | undefined
): FoundationObjectImportTargetParametersV010 | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value) || typeof value !== "object") {
    throw new Error("DATA_IMPORT_TARGET_PARAMETERS_INVALID");
  }
  const output: FoundationObjectImportTargetParametersV010 = {};
  for (const [key, item] of Object.entries(value)) {
    if (
      typeof item === "string"
      || typeof item === "number"
      || typeof item === "boolean"
    ) {
      output[key] = item;
      continue;
    }
    if (
      Array.isArray(item)
      && item.every(entry => typeof entry === "string")
    ) {
      output[key] = item as string[];
      continue;
    }
    if (item !== null) {
      throw new Error("DATA_IMPORT_TARGET_PARAMETERS_INVALID");
    }
  }
  return output;
}


function uploadedFile(value: JsonValue | undefined): {
  name: string;
  mediaType: string;
  size: number;
  contentBase64: string;
} {
  if (
    value === null
    || value === undefined
    || Array.isArray(value)
    || typeof value !== "object"
  ) {
    throw new Error("DATA_IMPORT_FILE_REQUIRED");
  }
  const name = required(value.name, "DATA_IMPORT_FILE_NAME_REQUIRED");
  const mediaType = required(
    value.mediaType,
    "DATA_IMPORT_FILE_MEDIA_TYPE_REQUIRED"
  );
  const size = value.size;
  const contentBase64 = value.contentBase64;
  if (
    typeof size !== "number"
    || !Number.isInteger(size)
    || size < 0
    || typeof contentBase64 !== "string"
    || !contentBase64
  ) {
    throw new Error("DATA_IMPORT_FILE_INVALID");
  }
  return { name, mediaType, size, contentBase64 };
}

function targetParametersFromForm(
  target: FoundationObjectImportTargetV010,
  values: Record<string, JsonValue>
): FoundationObjectImportTargetParametersV010 | undefined {
  const output: FoundationObjectImportTargetParametersV010 = {};
  for (const parameter of target.parameters ?? []) {
    const value = values["parameter__" + parameter.key];
    if (
      (value === undefined || value === null || value === "")
      && parameter.defaultValue !== undefined
    ) {
      output[parameter.key] = parameter.defaultValue;
      continue;
    }
    if (value === undefined || value === null || value === "") {
      if (parameter.required) {
        throw new Error("DATA_IMPORT_TARGET_PARAMETER_REQUIRED");
      }
      continue;
    }
    if (typeof value !== "string") {
      throw new Error("DATA_IMPORT_TARGET_PARAMETER_INVALID");
    }
    output[parameter.key] = value;
  }
  return Object.keys(output).length > 0 ? output : undefined;
}

function sourceFromUploadedFile(value: JsonValue | undefined) {
  const file = uploadedFile(value);
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("DATA_IMPORT_FILE_TOO_LARGE");
  }
  const bytes = Buffer.from(file.contentBase64, "base64");
  if (bytes.byteLength !== file.size) {
    throw new Error("DATA_IMPORT_FILE_SIZE_MISMATCH");
  }
  const lower = file.name.toLocaleLowerCase();
  if (
    lower.endsWith(".csv")
    || file.mediaType === "text/csv"
    || file.mediaType === "application/csv"
  ) {
    return parseCsvSourceV010({
      name: file.name,
      csv: bytes.toString("utf8")
    });
  }
  if (
    lower.endsWith(".xlsx")
    || file.mediaType
      === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return parseXlsxSourceV010({
      name: file.name,
      bytes
    });
  }
  throw new Error("DATA_IMPORT_FILE_TYPE_UNSUPPORTED");
}

function failure(
  error: unknown,
  context?: PlatformRequestContextV010
): AppActionExecutionResultV010 {
  const code = error instanceof Error
    ? error.message
    : "DATA_IMPORT_ACTION_FAILED";
  return {
    ok: false,
    ...(context?.correlationId
      ? { correlationId: context.correlationId }
      : {}),
    error: {
      code,
      message: code
    }
  };
}

function jobResult(job: unknown): JsonValue {
  return JSON.parse(JSON.stringify({
    contractVersion: "0.1.0",
    job
  })) as JsonValue;
}

export function createDataImportActionHandlersV010(input: {
  service: DataImportServiceV010;
  repository: DataImportRepositoryV010;
  targets: readonly FoundationObjectImportTargetV010[];
  canManageEnterpriseContext(
    principal: PlatformPrincipalV010,
    contextId: string
  ): boolean;
  idFactory(): string;
  now?: () => Date;
}): AppActionHandler[] {
  const now = input.now ?? (() => new Date());

  const targetMap = new Map(
    input.targets.map(target => [target.targetId, target] as const)
  );

  const stageFile: AppActionHandler = {
    packageId: DATA_IMPORT_PACKAGE_ID,
    featureId: DATA_IMPORT_FEATURE_ID,
    commandCode: DATA_IMPORT_STAGE_FILE_COMMAND_V010,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const targetId = required(
          request.values.targetId,
          "DATA_IMPORT_TARGET_ID_REQUIRED"
        );
        const target = targetMap.get(targetId);
        if (!target) throw new Error("DATA_IMPORT_TARGET_NOT_FOUND");
        const source = sourceFromUploadedFile(request.values.file);
        const parameters = targetParametersFromForm(target, request.values);
        const schema = target.describe({
          contextId: active.contextId,
          parameters
        });
        const mapping = input.service.suggestMapping({
          schema,
          source
        });
        const recordedAt = now().toISOString();
        const job = input.service.stage({
          contextId: active.contextId,
          importJobId: input.idFactory(),
          targetId,
          ...(parameters ? { targetParameters: parameters } : {}),
          source,
          mapping,
          actorSubjectId: context.principal.subjectId,
          recordedAt
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: {
            contractVersion: "0.1.0",
            message: "File staged. Review the field mapping before validation.",
            navigateTo: dataImportMappingRouteV010(job.importJobId),
            job
          }
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const review: AppActionHandler = {
    packageId: DATA_IMPORT_PACKAGE_ID,
    featureId: DATA_IMPORT_FEATURE_ID,
    commandCode: DATA_IMPORT_REVIEW_COMMAND_V010,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const importJobId = required(
          request.values.importJobId,
          "DATA_IMPORT_JOB_ID_REQUIRED"
        );
        const current = input.repository.get(active.contextId, importJobId);
        if (!current) throw new Error("DATA_IMPORT_JOB_NOT_FOUND");
        const nextMapping: DataImportMappingV010[] = [];
        current.source.headers.forEach((sourceColumn, index) => {
          const value = request.values["map_" + index];
          if (typeof value !== "string" || !value.trim()) return;
          if (value === "__IGNORE__") return;
          nextMapping.push({
            sourceColumn,
            targetFieldId: value.trim()
          });
        });
        const recordedAt = now().toISOString();
        input.service.updateMapping({
          contextId: active.contextId,
          importJobId,
          mapping: nextMapping,
          actorSubjectId: context.principal.subjectId,
          recordedAt
        });
        const job = input.service.dryRun({
          contextId: active.contextId,
          importJobId,
          actorSubjectId: context.principal.subjectId,
          recordedAt
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: {
            contractVersion: "0.1.0",
            message: job.state === "DRY_RUN_READY"
              ? "Validation passed. Review the result and confirm import."
              : "Validation found issues. Review errors before importing.",
            navigateTo: dataImportReviewRouteV010(importJobId),
            job
          }
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const stageCsv: AppActionHandler = {
    packageId: DATA_IMPORT_PACKAGE_ID,
    featureId: DATA_IMPORT_FEATURE_ID,
    commandCode: DATA_IMPORT_STAGE_CSV_COMMAND_V010,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const recordedAt = now().toISOString();
        const job = input.service.stage({
          contextId: active.contextId,
          importJobId: input.idFactory(),
          targetId: required(
            request.values.targetId,
            "DATA_IMPORT_TARGET_ID_REQUIRED"
          ),
          targetParameters: targetParameters(
            request.values.targetParameters
          ),
          source: parseCsvSourceV010({
            csv: required(
              request.values.csv,
              "DATA_IMPORT_CSV_REQUIRED"
            ),
            ...(text(request.values.name)
              ? { name: text(request.values.name) }
              : {})
          }),
          mapping: mapping(request.values.mapping),
          actorSubjectId: context.principal.subjectId,
          recordedAt
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: jobResult(job)
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const dryRun: AppActionHandler = {
    packageId: DATA_IMPORT_PACKAGE_ID,
    featureId: DATA_IMPORT_FEATURE_ID,
    commandCode: DATA_IMPORT_DRY_RUN_COMMAND_V010,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const job = input.service.dryRun({
          contextId: active.contextId,
          importJobId: required(
            request.values.importJobId,
            "DATA_IMPORT_JOB_ID_REQUIRED"
          ),
          ...(text(request.values.locale)
            ? { locale: text(request.values.locale) }
            : {}),
          actorSubjectId: context.principal.subjectId,
          recordedAt: now().toISOString()
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: jobResult(job)
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const commit: AppActionHandler = {
    packageId: DATA_IMPORT_PACKAGE_ID,
    featureId: DATA_IMPORT_FEATURE_ID,
    commandCode: DATA_IMPORT_COMMIT_COMMAND_V010,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const job = input.service.commit({
          contextId: active.contextId,
          importJobId: required(
            request.values.importJobId,
            "DATA_IMPORT_JOB_ID_REQUIRED"
          ),
          actorSubjectId: context.principal.subjectId,
          recordedAt: now().toISOString()
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: jobResult(job)
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const get: AppActionHandler = {
    packageId: DATA_IMPORT_PACKAGE_ID,
    featureId: DATA_IMPORT_FEATURE_ID,
    commandCode: DATA_IMPORT_GET_COMMAND_V010,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const importJobId = required(
          request.values.importJobId,
          "DATA_IMPORT_JOB_ID_REQUIRED"
        );
        const job = input.repository.get(active.contextId, importJobId);
        if (!job) throw new Error("DATA_IMPORT_JOB_NOT_FOUND");
        return {
          ok: true,
          correlationId: context.correlationId,
          result: jobResult(job)
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const errorCsv: AppActionHandler = {
    packageId: DATA_IMPORT_PACKAGE_ID,
    featureId: DATA_IMPORT_FEATURE_ID,
    commandCode: DATA_IMPORT_ERROR_CSV_COMMAND_V010,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const csv = input.service.errorRowsCsv({
          contextId: active.contextId,
          importJobId: required(
            request.values.importJobId,
            "DATA_IMPORT_JOB_ID_REQUIRED"
          )
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: {
            contractVersion: "0.1.0",
            message: "Validation errors downloaded.",
            download: {
              fileName: "data-import-errors-" + required(
                request.values.importJobId,
                "DATA_IMPORT_JOB_ID_REQUIRED"
              ) + ".csv",
              mediaType: "text/csv;charset=utf-8",
              content: csv
            },
            csv
          }
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  return [stageFile, review, stageCsv, dryRun, commit, get, errorCsv];
}
