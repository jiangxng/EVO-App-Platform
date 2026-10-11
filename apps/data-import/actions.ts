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
  fieldsForSurfaceV010
} from "../../contracts/foundation-object/schema.js";
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
  DataImportExperienceAdvisorV010
} from "./experience-advisor.js";
import {
  dataImportTargetSchemaDigestV010
} from "./recipe.js";
import type {
  DataImportMappingV010,
  DataImportMappingOriginV010,
  DataImportValueMapEntryV010
} from "./types.js";
import {
  DATA_IMPORT_COMMIT_COMMAND_V010,
  DATA_IMPORT_DRY_RUN_COMMAND_V010,
  DATA_IMPORT_ERROR_CSV_COMMAND_V010,
  DATA_IMPORT_FEATURE_ID,
  DATA_IMPORT_GET_COMMAND_V010,
  DATA_IMPORT_MAPPING_APPLY_COMMAND_V010,
  DATA_IMPORT_MAPPING_INSPECT_COMMAND_V010,
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

function importCell(
  value: JsonValue | undefined,
  code: string
): string | number | boolean | null {
  if (
    value === null
    || typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean"
  ) {
    return value;
  }
  throw new Error(code);
}

function mapping(value: JsonValue | undefined): DataImportMappingV010[] {
  if (!Array.isArray(value)) throw new Error("DATA_IMPORT_MAPPING_REQUIRED");
  return value.map(item => {
    if (item === null || Array.isArray(item) || typeof item !== "object") {
      throw new Error("DATA_IMPORT_MAPPING_INVALID");
    }
    let transform: DataImportMappingV010["transform"];
    if (item.transform !== undefined) {
      if (
        item.transform === null
        || Array.isArray(item.transform)
        || typeof item.transform !== "object"
      ) {
        throw new Error("DATA_IMPORT_MAPPING_TRANSFORM_INVALID");
      }
      if (item.transform.kind === "VALUE_MAP") {
        if (
          !Array.isArray(item.transform.entries)
          || item.transform.entries.length === 0
        ) {
          throw new Error("DATA_IMPORT_MAPPING_TRANSFORM_INVALID");
        }
        const entries: DataImportValueMapEntryV010[] =
          item.transform.entries.map(entry => {
            if (
              entry === null
              || Array.isArray(entry)
              || typeof entry !== "object"
            ) {
              throw new Error("DATA_IMPORT_MAPPING_TRANSFORM_INVALID");
            }
            return {
              source: importCell(
                entry.source,
                "DATA_IMPORT_MAPPING_TRANSFORM_SOURCE_INVALID"
              ),
              target: importCell(
                entry.target,
                "DATA_IMPORT_MAPPING_TRANSFORM_TARGET_INVALID"
              )
            };
          });
        transform = {
          kind: "VALUE_MAP",
          entries
        };
      } else if (item.transform.kind === "CONSTANT") {
        transform = {
          kind: "CONSTANT",
          value: importCell(
            item.transform.value,
            "DATA_IMPORT_MAPPING_CONSTANT_VALUE_INVALID"
          )
        };
      } else {
        throw new Error("DATA_IMPORT_MAPPING_TRANSFORM_INVALID");
      }
    }

    const sourceColumn = text(item.sourceColumn);
    if (transform?.kind === "CONSTANT") {
      if (sourceColumn) {
        throw new Error("DATA_IMPORT_CONSTANT_MAPPING_SOURCE_FORBIDDEN");
      }
    } else if (!sourceColumn) {
      throw new Error("DATA_IMPORT_MAPPING_SOURCE_REQUIRED");
    }

    return {
      ...(sourceColumn ? { sourceColumn } : {}),
      targetFieldId: required(
        item.targetFieldId,
        "DATA_IMPORT_MAPPING_TARGET_REQUIRED"
      ),
      ...(transform ? { transform } : {})
    };
  });
}

function mappingOrigin(
  principal: PlatformPrincipalV010
): DataImportMappingOriginV010 {
  return principal.actorType === "AI" ? "AGENT" : "HUMAN";
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
  targets?: readonly FoundationObjectImportTargetV010[];
  resolveTargets?: () => readonly FoundationObjectImportTargetV010[];
  canManageEnterpriseContext(
    principal: PlatformPrincipalV010,
    contextId: string
  ): boolean;
  idFactory(): string;
  experienceAdvisor?: DataImportExperienceAdvisorV010;
  experienceRecommendationMinimumConfidence?: number;
  now?: () => Date;
}): AppActionHandler[] {
  const now = input.now ?? (() => new Date());
  const experienceRecommendationMinimumConfidence =
    input.experienceRecommendationMinimumConfidence ?? 0.85;

  const currentTargets = () =>
    input.resolveTargets?.() ?? input.targets ?? [];

  const currentTargetMap = () => new Map(
    currentTargets().map(target => [target.targetId, target] as const)
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
        const target = currentTargetMap().get(targetId);
        if (!target) throw new Error("DATA_IMPORT_TARGET_NOT_FOUND");
        const source = sourceFromUploadedFile(request.values.file);
        const parameters = targetParametersFromForm(target, request.values);
        const schema = target.describe({
          contextId: active.contextId,
          parameters
        });
        const initial = input.service.resolveInitialMapping({
          contextId: active.contextId,
          targetId,
          ...(parameters ? { targetParameters: parameters } : {}),
          source,
          schema
        });
        const targetSchemaDigest = dataImportTargetSchemaDigestV010(schema);
        const availableTargetFieldIds = fieldsForSurfaceV010(schema, "IMPORT")
          .filter(field => field.writable)
          .map(field => field.fieldId);
        const availableTargetFieldIdSet = new Set(availableTargetFieldIds);
        const resolvedMapping = structuredClone(initial.mapping);
        let experienceRecommendationCount = 0;

        if (initial.origin !== "RECIPE" && input.experienceAdvisor) {
          try {
            const recommendations = await input.experienceAdvisor.recommend({
              tenantId: active.enterpriseId,
              targetId,
              ...(parameters ? { targetParameters: parameters } : {}),
              sourceColumns: [...source.headers],
              availableTargetFieldIds,
              targetSchemaDigest
            });
            const usedSources = new Set(
              resolvedMapping
                .map(item => item.sourceColumn)
                .filter((value): value is string => Boolean(value))
            );
            const usedTargets = new Set(
              resolvedMapping.map(item => item.targetFieldId)
            );
            for (const recommendation of recommendations) {
              if (
                recommendation.confidence
                  < experienceRecommendationMinimumConfidence
                || !source.headers.includes(recommendation.sourceColumn)
                || !availableTargetFieldIdSet.has(
                  recommendation.targetFieldId
                )
                || usedSources.has(recommendation.sourceColumn)
                || usedTargets.has(recommendation.targetFieldId)
              ) {
                continue;
              }
              resolvedMapping.push({
                sourceColumn: recommendation.sourceColumn,
                targetFieldId: recommendation.targetFieldId,
                advisory: {
                  source: "EXPERIENCE_COMPILER",
                  confidence: recommendation.confidence,
                  supportCount: recommendation.supportCount,
                  conflictCount: recommendation.conflictCount,
                  supportingRecordIds:
                    [...recommendation.supportingRecordIds],
                  rationale: recommendation.rationale
                }
              });
              usedSources.add(recommendation.sourceColumn);
              usedTargets.add(recommendation.targetFieldId);
              experienceRecommendationCount += 1;
            }
          } catch {
            // EC is advisory. Import remains fully operable when EC is absent.
          }
        }

        const recordedAt = now().toISOString();
        let job = input.service.stage({
          contextId: active.contextId,
          importJobId: input.idFactory(),
          targetId,
          ...(parameters ? { targetParameters: parameters } : {}),
          source,
          mapping: resolvedMapping,
          mappingOrigin: initial.origin,
          ...(initial.recipeId
            ? { appliedRecipeId: initial.recipeId }
            : {}),
          actorSubjectId: context.principal.subjectId,
          recordedAt
        });
        if (initial.origin === "RECIPE") {
          job = input.service.dryRun({
            contextId: active.contextId,
            importJobId: job.importJobId,
            actorSubjectId: context.principal.subjectId,
            recordedAt
          });
        }
        const recipeReady =
          initial.origin === "RECIPE"
          && job.state === "DRY_RUN_READY";
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            contractVersion: "0.1.0",
            message: recipeReady
              ? "A previously validated enterprise import recipe was applied and validation passed."
              : initial.origin === "RECIPE"
                ? "A previous import recipe was applied but needs review because validation found issues."
                : experienceRecommendationCount > 0
                  ? "File staged. Experience Compiler recommendations were applied for Human review."
                  : "File staged. Review the field mapping before validation.",
            navigateTo: recipeReady
              ? dataImportReviewRouteV010(job.importJobId)
              : dataImportMappingRouteV010(job.importJobId),
            mappingOrigin: job.mappingOrigin,
            ...(job.appliedRecipeId
              ? { appliedRecipeId: job.appliedRecipeId }
              : {}),
            job
          })) as JsonValue
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
        const existingBySource = new Map(
          current.mapping
            .filter(item => Boolean(item.sourceColumn))
            .map(item => [item.sourceColumn!, item] as const)
        );
        const nextMapping: DataImportMappingV010[] = [];
        current.source.headers.forEach((sourceColumn, index) => {
          const value = request.values["map_" + index];
          if (typeof value !== "string" || !value.trim()) return;
          if (value === "__IGNORE__") return;
          const targetFieldId = value.trim();
          const existing = existingBySource.get(sourceColumn);
          nextMapping.push(
            existing?.targetFieldId === targetFieldId
              ? structuredClone(existing)
              : {
                  sourceColumn,
                  targetFieldId
                }
          );
        });

        const explicitlyMappedTargets = new Set(
          nextMapping.map(item => item.targetFieldId)
        );
        for (const item of current.mapping) {
          if (
            item.transform?.kind === "CONSTANT"
            && !explicitlyMappedTargets.has(item.targetFieldId)
          ) {
            nextMapping.push(structuredClone(item));
          }
        }
        const recordedAt = now().toISOString();
        input.service.updateMapping({
          contextId: active.contextId,
          importJobId,
          mapping: nextMapping,
          mappingOrigin: mappingOrigin(context.principal),
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
          result: JSON.parse(JSON.stringify({
            contractVersion: "0.1.0",
            message: job.state === "DRY_RUN_READY"
              ? "Validation passed. Review the result and confirm import."
              : "Validation found issues. Review errors before importing.",
            navigateTo: dataImportReviewRouteV010(importJobId),
            job
          })) as JsonValue
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
        const recordedAt = now().toISOString();
        let job = input.service.commit({
          contextId: active.contextId,
          importJobId: required(
            request.values.importJobId,
            "DATA_IMPORT_JOB_ID_REQUIRED"
          ),
          actorSubjectId: context.principal.subjectId,
          recordedAt
        });

        if (
          job.state === "COMMITTED"
          && job.mappingOrigin === "HUMAN"
          && input.experienceAdvisor
        ) {
          const sourceMappings = job.mapping.filter(
            item => Boolean(item.sourceColumn)
              && item.transform?.kind !== "CONSTANT"
          );
          try {
            const learned = await Promise.all(sourceMappings.map(item =>
              input.experienceAdvisor!.recordSuccessful({
                tenantId: active.enterpriseId,
                targetId: job.targetId,
                ...(job.targetParameters
                  ? { targetParameters: job.targetParameters }
                  : {}),
                sourceColumn: item.sourceColumn!,
                targetFieldId: item.targetFieldId,
                sourceHeaders: [...job.source.headers],
                importJobId: job.importJobId,
                targetSchemaDigest: job.dryRun!.schemaDigest,
                observedAt: recordedAt
              })
            ));
            job = input.repository.save({
              contextId: active.contextId,
              job: {
                ...job,
                experienceLearning: {
                  status: "RECORDED",
                  recordedAt,
                  learnedMappings: learned.length,
                  observationRecordIds:
                    learned.map(item => item.observationRecordId),
                  patternRecordIds:
                    learned.map(item => item.patternRecordId)
                }
              },
              actorSubjectId: context.principal.subjectId,
              recordedAt
            });
          } catch (error) {
            job = input.repository.save({
              contextId: active.contextId,
              job: {
                ...job,
                experienceLearning: {
                  status: "UNAVAILABLE",
                  recordedAt,
                  learnedMappings: 0,
                  diagnostic: error instanceof Error
                    ? error.message
                    : "DATA_IMPORT_EC_LEARNING_UNAVAILABLE"
                }
              },
              actorSubjectId: context.principal.subjectId,
              recordedAt
            });
          }
        }

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

  const inspectMapping: AppActionHandler = {
    packageId: DATA_IMPORT_PACKAGE_ID,
    featureId: DATA_IMPORT_FEATURE_ID,
    commandCode: DATA_IMPORT_MAPPING_INSPECT_COMMAND_V010,
    async execute(request, context) {
      try {
        if (!context) throw new Error("REQUEST_CONTEXT_REQUIRED");
        const active = activeEnterpriseContext(context);
        ensureManage(
          context.principal,
          active.contextId,
          input.canManageEnterpriseContext
        );
        const inspection = input.service.inspectMapping({
          contextId: active.contextId,
          importJobId: required(
            request.values.importJobId,
            "DATA_IMPORT_JOB_ID_REQUIRED"
          ),
          ...(text(request.values.locale)
            ? { locale: text(request.values.locale) }
            : {}),
          ...(typeof request.values.sampleLimit === "number"
            ? { sampleLimit: request.values.sampleLimit }
            : {})
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify(inspection)) as JsonValue
        };
      } catch (error) {
        return failure(error, context);
      }
    }
  };

  const applyMapping: AppActionHandler = {
    packageId: DATA_IMPORT_PACKAGE_ID,
    featureId: DATA_IMPORT_FEATURE_ID,
    commandCode: DATA_IMPORT_MAPPING_APPLY_COMMAND_V010,
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
        const recordedAt = now().toISOString();
        let job = input.service.updateMapping({
          contextId: active.contextId,
          importJobId,
          mapping: mapping(request.values.mapping),
          mappingOrigin: mappingOrigin(context.principal),
          actorSubjectId: context.principal.subjectId,
          recordedAt
        });
        const shouldValidate = request.values.dryRun !== false;
        if (shouldValidate) {
          job = input.service.dryRun({
            contextId: active.contextId,
            importJobId,
            ...(text(request.values.locale)
              ? { locale: text(request.values.locale) }
              : {}),
            actorSubjectId: context.principal.subjectId,
            recordedAt
          });
        }
        return {
          ok: true,
          correlationId: context.correlationId,
          result: JSON.parse(JSON.stringify({
            contractVersion: "0.1.0",
            message: shouldValidate
              ? job.state === "DRY_RUN_READY"
                ? "Mapping applied and validation passed."
                : "Mapping applied; validation found issues."
              : "Mapping applied.",
            navigateTo: shouldValidate
              ? dataImportReviewRouteV010(importJobId)
              : dataImportMappingRouteV010(importJobId),
            job
          })) as JsonValue
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

  return [
    stageFile,
    review,
    stageCsv,
    dryRun,
    commit,
    get,
    inspectMapping,
    applyMapping,
    errorCsv
  ];
}
