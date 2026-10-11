import type {
  FoundationObjectImportCellV010,
  FoundationObjectImportTargetV010
} from "../../contracts/foundation-object/import.js";
import {
  fieldsForSurfaceV010
} from "../../contracts/foundation-object/schema.js";
import type {
  DataImportMappingV010,
  DataImportSourceV010,
  DataImportJobV010,
  DataImportMappingOriginV010,
  DataImportValueTransformV010
} from "./types.js";
import type {
  DataImportRepositoryV010
} from "./repository.js";
import {
  dataImportSourceFingerprintV010,
  dataImportTargetSchemaDigestV010,
  type DataImportRecipeRepositoryV010
} from "./recipe.js";

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}


function targetMap(
  targets: readonly FoundationObjectImportTargetV010[]
): Map<string, FoundationObjectImportTargetV010> {
  const map = new Map<string, FoundationObjectImportTargetV010>();
  for (const target of targets) {
    if (target.contractVersion !== "0.1.0") {
      throw new Error("DATA_IMPORT_TARGET_VERSION_INVALID");
    }
    if (map.has(target.targetId)) {
      throw new Error("DATA_IMPORT_TARGET_DUPLICATE");
    }
    map.set(target.targetId, target);
  }
  return map;
}

function normalizedTransformValue(
  value: FoundationObjectImportCellV010
): string {
  if (typeof value === "string") {
    return "s:" + value.normalize("NFKC").trim().toLocaleLowerCase();
  }
  if (value === null) return "null";
  return typeof value + ":" + String(value);
}

function transformedValue(
  value: FoundationObjectImportCellV010,
  transform: DataImportValueTransformV010 | undefined
): FoundationObjectImportCellV010 {
  if (!transform) return value;
  if (transform.kind === "CONSTANT") {
    return transform.value;
  }
  if (transform.kind === "VALUE_MAP") {
    const key = normalizedTransformValue(value);
    const entry = transform.entries.find(item =>
      normalizedTransformValue(item.source) === key
    );
    return entry ? entry.target : value;
  }
  return value;
}

function mappedValues(input: {
  sourceRow: Record<string, FoundationObjectImportCellV010>;
  mapping: DataImportMappingV010[];
}): Record<string, FoundationObjectImportCellV010> {
  const values: Record<string, FoundationObjectImportCellV010> = {};
  for (const item of input.mapping) {
    if (item.transform?.kind === "CONSTANT") {
      values[item.targetFieldId] = item.transform.value;
      continue;
    }
    if (!item.sourceColumn) {
      throw new Error("DATA_IMPORT_MAPPING_SOURCE_REQUIRED");
    }
    const raw = input.sourceRow[item.sourceColumn] ?? null;
    values[item.targetFieldId] = transformedValue(raw, item.transform);
  }
  return values;
}

function normalizedHeader(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s_\-\/()[\]{}.:：]+/gu, "");
}

function normalizedSemanticAlias(value: unknown): string | undefined {
  if (
    typeof value !== "string"
    && typeof value !== "number"
    && typeof value !== "boolean"
  ) {
    return undefined;
  }
  return String(value)
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s_\-\/()[\]{}.:：]+/gu, "");
}

function assertAgentMappingSemanticSafety(input: {
  schema: ReturnType<FoundationObjectImportTargetV010["describe"]>;
  mapping: DataImportMappingV010[];
  mappingOrigin?: DataImportMappingOriginV010;
}): void {
  if (input.mappingOrigin !== "AGENT") return;
  const byId = new Map(
    input.schema.fields.map(field => [field.fieldId, field] as const)
  );

  for (const item of input.mapping) {
    if (!item.transform || item.transform.kind !== "VALUE_MAP") continue;
    const field = byId.get(item.targetFieldId);
    if (!field || field.valueType !== "ENUM" || !field.enumOptions) continue;

    const options = new Map(field.enumOptions.map(option => [
      normalizedSemanticAlias(option.value),
      option
    ] as const));

    for (const entry of item.transform.entries) {
      const targetKey = normalizedSemanticAlias(entry.target);
      const option = targetKey ? options.get(targetKey) : undefined;
      if (!option) continue;

      const accepted = new Set(
        [
          option.value,
          option.label.default,
          ...Object.values(option.label.translations ?? {}),
          ...(option.aliases ?? [])
        ]
          .map(normalizedSemanticAlias)
          .filter((value): value is string => Boolean(value))
      );
      const sourceKey = normalizedSemanticAlias(entry.source);
      if (!sourceKey || !accepted.has(sourceKey)) {
        throw new Error(
          "DATA_IMPORT_AGENT_ENUM_VALUE_MAP_REQUIRES_HUMAN_REVIEW"
        );
      }
    }
  }
}

export function suggestDataImportMappingV010(input: {
  schema: ReturnType<FoundationObjectImportTargetV010["describe"]>;
  source: DataImportSourceV010;
}): DataImportMappingV010[] {
  const candidates = fieldsForSurfaceV010(input.schema, "IMPORT")
    .filter(field => field.writable);
  const byAlias = new Map<string, string[]>();
  for (const field of candidates) {
    for (const alias of [
      field.fieldId,
      field.resolvedLabel,
      field.label.default,
      ...Object.values(field.label.translations ?? {})
    ]) {
      const key = normalizedHeader(alias);
      const existing = byAlias.get(key) ?? [];
      if (!existing.includes(field.fieldId)) existing.push(field.fieldId);
      byAlias.set(key, existing);
    }
  }

  const usedTargets = new Set<string>();
  const mapping: DataImportMappingV010[] = [];
  for (const sourceColumn of input.source.headers) {
    const matches = byAlias.get(normalizedHeader(sourceColumn)) ?? [];
    const targetFieldId = matches.find(item => !usedTargets.has(item));
    if (!targetFieldId) continue;
    usedTargets.add(targetFieldId);
    mapping.push({ sourceColumn, targetFieldId });
  }
  return mapping;
}

export interface DataImportServiceV010 {
  suggestMapping(input: {
    schema: ReturnType<FoundationObjectImportTargetV010["describe"]>;
    source: DataImportSourceV010;
  }): DataImportMappingV010[];
  resolveInitialMapping(input: {
    contextId: string;
    targetId: string;
    targetParameters?: DataImportJobV010["targetParameters"];
    source: DataImportSourceV010;
    schema: ReturnType<FoundationObjectImportTargetV010["describe"]>;
  }): {
    mapping: DataImportMappingV010[];
    origin: "DETERMINISTIC" | "RECIPE";
    recipeId?: string;
  };
  inspectMapping(input: {
    contextId: string;
    importJobId: string;
    locale?: string;
    sampleLimit?: number;
  }): {
    contractVersion: "0.1.0";
    job: DataImportJobV010;
    schema: ReturnType<FoundationObjectImportTargetV010["describe"]>;
    sourceColumns: Array<{
      sourceColumn: string;
      sampleValues: FoundationObjectImportCellV010[];
      mappedTargetFieldId?: string;
      transform?: DataImportValueTransformV010;
    }>;
    constantMappings: DataImportMappingV010[];
    unmappedColumns: string[];
    rawSourcePreserved: true;
  };
  updateMapping(input: {
    contextId: string;
    importJobId: string;
    mapping: DataImportMappingV010[];
    mappingOrigin?: DataImportMappingOriginV010;
    appliedRecipeId?: string;
    actorSubjectId: string;
    recordedAt: string;
  }): DataImportJobV010;
  stage(input: {
    contextId: string;
    importJobId: string;
    targetId: string;
    targetParameters?: DataImportJobV010["targetParameters"];
    source: DataImportSourceV010;
    mapping: DataImportMappingV010[];
    mappingOrigin?: DataImportMappingOriginV010;
    appliedRecipeId?: string;
    actorSubjectId: string;
    recordedAt: string;
  }): DataImportJobV010;
  dryRun(input: {
    contextId: string;
    importJobId: string;
    locale?: string;
    actorSubjectId: string;
    recordedAt: string;
  }): DataImportJobV010;
  commit(input: {
    contextId: string;
    importJobId: string;
    actorSubjectId: string;
    recordedAt: string;
  }): DataImportJobV010;
  errorRowsCsv(input: {
    contextId: string;
    importJobId: string;
  }): string;
}

export function createDataImportServiceV010(input: {
  repository: DataImportRepositoryV010;
  targets?: readonly FoundationObjectImportTargetV010[];
  resolveTargets?: () => readonly FoundationObjectImportTargetV010[];
  recipeRepository?: DataImportRecipeRepositoryV010;
}): DataImportServiceV010 {
  function currentTargets(): Map<string, FoundationObjectImportTargetV010> {
    const resolved = input.resolveTargets?.() ?? input.targets ?? [];
    return targetMap(resolved);
  }

  function targetFor(job: DataImportJobV010): FoundationObjectImportTargetV010 {
    const target = currentTargets().get(job.targetId);
    if (!target) throw new Error("DATA_IMPORT_TARGET_NOT_FOUND");
    return target;
  }

  function sampleLimit(value: number | undefined): number {
    if (value === undefined) return 8;
    if (!Number.isInteger(value) || value < 1 || value > 20) {
      throw new Error("DATA_IMPORT_SAMPLE_LIMIT_INVALID");
    }
    return value;
  }

  return {
    suggestMapping(mappingInput) {
      return suggestDataImportMappingV010(mappingInput);
    },

    resolveInitialMapping(mappingInput) {
      const targetSchemaDigest =
        dataImportTargetSchemaDigestV010(mappingInput.schema);
      const importable = new Set(
        fieldsForSurfaceV010(mappingInput.schema, "IMPORT")
          .filter(field => field.writable)
          .map(field => field.fieldId)
      );
      const mappingIsReusable = (mapping: DataImportMappingV010[]) =>
        mapping.every(item =>
          (
            item.transform?.kind === "CONSTANT"
            || (
              Boolean(item.sourceColumn)
              && mappingInput.source.headers.includes(item.sourceColumn!)
            )
          )
          && importable.has(item.targetFieldId)
        );

      const recipe = input.recipeRepository?.findBySource({
        contextId: mappingInput.contextId,
        targetId: mappingInput.targetId,
        targetParameters: mappingInput.targetParameters,
        source: mappingInput.source
      });
      if (
        recipe
        && recipe.targetSchemaDigest === targetSchemaDigest
        && mappingIsReusable(recipe.mapping)
      ) {
        return {
          mapping: structuredClone(recipe.mapping),
          origin: "RECIPE" as const,
          recipeId: recipe.recipeId
        };
      }

      // Compatibility path for Human-confirmed mappings that predate
      // persistent Import Recipes. A successful dry run is sufficient evidence
      // for same-structure mapping reuse even when business data was never
      // committed. Repository history is durable evidence; if the target,
      // purpose, source structure and schema still match exactly, reuse it.
      // The next Human-confirmed dry run will persist it as a normal Recipe.
      const sourceFingerprint = dataImportSourceFingerprintV010({
        targetId: mappingInput.targetId,
        targetParameters: mappingInput.targetParameters,
        source: mappingInput.source
      });
      const historical = input.repository
        .list(mappingInput.contextId)
        .find(job =>
          (
            job.state === "COMMITTED"
            || job.state === "DRY_RUN_READY"
          )
          && job.mappingOrigin === "HUMAN"
          && job.targetId === mappingInput.targetId
          && job.dryRun?.schemaDigest === targetSchemaDigest
          && dataImportSourceFingerprintV010({
            targetId: job.targetId,
            targetParameters: job.targetParameters,
            source: job.source
          }) === sourceFingerprint
          && mappingIsReusable(job.mapping)
        );
      if (historical) {
        return {
          mapping: structuredClone(historical.mapping),
          origin: "RECIPE" as const,
          ...(historical.appliedRecipeId
            ? { recipeId: historical.appliedRecipeId }
            : {})
        };
      }

      return {
        mapping: suggestDataImportMappingV010({
          schema: mappingInput.schema,
          source: mappingInput.source
        }),
        origin: "DETERMINISTIC" as const
      };
    },

    inspectMapping(mappingInput) {
      const job = input.repository.get(
        mappingInput.contextId,
        mappingInput.importJobId
      );
      if (!job) throw new Error("DATA_IMPORT_JOB_NOT_FOUND");
      const target = targetFor(job);
      const schema = target.describe({
        contextId: mappingInput.contextId,
        locale: mappingInput.locale,
        parameters: job.targetParameters
      });
      const current = new Map(
        job.mapping
          .filter(item => Boolean(item.sourceColumn))
          .map(item => [item.sourceColumn!, item] as const)
      );
      const limit = sampleLimit(mappingInput.sampleLimit);
      const sourceColumns = job.source.headers.map(sourceColumn => {
        const seen = new Set<string>();
        const sampleValues: FoundationObjectImportCellV010[] = [];
        for (const row of job.source.rows) {
          const value = row[sourceColumn] ?? null;
          const key = normalizedTransformValue(value);
          if (seen.has(key)) continue;
          seen.add(key);
          sampleValues.push(value);
          if (sampleValues.length >= limit) break;
        }
        const mapped = current.get(sourceColumn);
        return {
          sourceColumn,
          sampleValues,
          ...(mapped
            ? {
                mappedTargetFieldId: mapped.targetFieldId,
                ...(mapped.transform
                  ? { transform: structuredClone(mapped.transform) }
                  : {})
              }
            : {})
        };
      });
      return {
        contractVersion: "0.1.0" as const,
        job: structuredClone(job),
        schema: structuredClone(schema),
        sourceColumns,
        constantMappings: job.mapping
          .filter(item => item.transform?.kind === "CONSTANT")
          .map(item => structuredClone(item)),
        unmappedColumns: sourceColumns
          .filter(item => !item.mappedTargetFieldId)
          .map(item => item.sourceColumn),
        rawSourcePreserved: true as const
      };
    },

    updateMapping(mappingInput) {
      const job = input.repository.get(
        mappingInput.contextId,
        mappingInput.importJobId
      );
      if (!job) throw new Error("DATA_IMPORT_JOB_NOT_FOUND");
      if (job.state === "COMMITTED" || job.state === "COMMITTED_WITH_ERRORS") {
        throw new Error("DATA_IMPORT_JOB_ALREADY_COMMITTED");
      }
      const target = targetFor(job);
      const schema = target.describe({
        contextId: mappingInput.contextId,
        parameters: job.targetParameters
      });
      assertAgentMappingSemanticSafety({
        schema,
        mapping: mappingInput.mapping,
        mappingOrigin: mappingInput.mappingOrigin
      });
      const next: DataImportJobV010 = {
        ...job,
        state: "STAGED",
        mapping: structuredClone(mappingInput.mapping),
        ...(mappingInput.mappingOrigin
          ? { mappingOrigin: mappingInput.mappingOrigin }
          : {}),
        ...(mappingInput.appliedRecipeId
          ? { appliedRecipeId: mappingInput.appliedRecipeId }
          : {}),
        dryRun: undefined,
        receipt: undefined
      };
      return input.repository.save({
        contextId: mappingInput.contextId,
        job: next,
        actorSubjectId: mappingInput.actorSubjectId,
        recordedAt: mappingInput.recordedAt
      });
    },

    stage(stageInput) {
      const contextId = required(
        stageInput.contextId,
        "DATA_IMPORT_CONTEXT_REQUIRED"
      );
      const importJobId = required(
        stageInput.importJobId,
        "DATA_IMPORT_JOB_ID_REQUIRED"
      );
      if (input.repository.get(contextId, importJobId)) {
        throw new Error("DATA_IMPORT_JOB_ALREADY_EXISTS");
      }
      if (!currentTargets().has(stageInput.targetId)) {
        throw new Error("DATA_IMPORT_TARGET_NOT_FOUND");
      }
      const job: DataImportJobV010 = {
        contractVersion: "0.1.0",
        importJobId,
        targetId: required(
          stageInput.targetId,
          "DATA_IMPORT_TARGET_ID_REQUIRED"
        ),
        ...(stageInput.targetParameters
          ? { targetParameters: structuredClone(stageInput.targetParameters) }
          : {}),
        state: "STAGED",
        source: structuredClone(stageInput.source),
        mapping: structuredClone(stageInput.mapping),
        ...(stageInput.mappingOrigin
          ? { mappingOrigin: stageInput.mappingOrigin }
          : {}),
        ...(stageInput.appliedRecipeId
          ? { appliedRecipeId: stageInput.appliedRecipeId }
          : {}),
        stagedAt: stageInput.recordedAt,
        stagedBySubjectId: required(
          stageInput.actorSubjectId,
          "DATA_IMPORT_ACTOR_REQUIRED"
        )
      };
      return input.repository.save({
        contextId,
        job,
        actorSubjectId: stageInput.actorSubjectId,
        recordedAt: stageInput.recordedAt
      });
    },

    dryRun(dryRunInput) {
      const job = input.repository.get(
        dryRunInput.contextId,
        dryRunInput.importJobId
      );
      if (!job) throw new Error("DATA_IMPORT_JOB_NOT_FOUND");
      if (job.state === "COMMITTED" || job.state === "COMMITTED_WITH_ERRORS") {
        throw new Error("DATA_IMPORT_JOB_ALREADY_COMMITTED");
      }
      const target = targetFor(job);
      const schema = target.describe({
        contextId: dryRunInput.contextId,
        locale: dryRunInput.locale,
        parameters: job.targetParameters
      });
      const importable = new Set(
        fieldsForSurfaceV010(schema, "IMPORT")
          .filter(field => field.writable)
          .map(field => field.fieldId)
      );
      for (const map of job.mapping) {
        if (!importable.has(map.targetFieldId)) {
          throw new Error("DATA_IMPORT_MAPPING_TARGET_NOT_IMPORTABLE");
        }
      }
      const seenDedupeKeys = new Set<string>();
      const rows = job.source.rows.map((sourceRow, index) => {
        const rowNumber = index + 1;
        const validation = target.validateRow({
          contextId: dryRunInput.contextId,
          importJobId: job.importJobId,
          schema,
          rowNumber,
          values: mappedValues({
            sourceRow,
            mapping: job.mapping
          }),
          parameters: job.targetParameters
        });
        const issues = [...validation.issues];
        if (
          validation.prepared?.dedupeKey
          && seenDedupeKeys.has(validation.prepared.dedupeKey)
        ) {
          issues.push({
            code: "DATA_IMPORT_DUPLICATE_IN_BATCH",
            message: "Duplicate row identity inside the staged import."
          });
        }
        if (validation.prepared?.dedupeKey) {
          seenDedupeKeys.add(validation.prepared.dedupeKey);
        }
        return {
          rowNumber,
          ok: validation.ok && issues.length === 0,
          ...(validation.prepared
            ? { prepared: structuredClone(validation.prepared) }
            : {}),
          issues
        };
      });
      const invalidRows = rows.filter(row => !row.ok).length;
      const next: DataImportJobV010 = {
        ...job,
        state: invalidRows === 0 ? "DRY_RUN_READY" : "DRY_RUN_FAILED",
        dryRun: {
          schemaDigest: dataImportTargetSchemaDigestV010(schema),
          totalRows: rows.length,
          validRows: rows.length - invalidRows,
          invalidRows,
          rows
        }
      };
      let saved = input.repository.save({
        contextId: dryRunInput.contextId,
        job: next,
        actorSubjectId: dryRunInput.actorSubjectId,
        recordedAt: dryRunInput.recordedAt
      });
      if (
        saved.state === "DRY_RUN_READY"
        && saved.mappingOrigin === "HUMAN"
        && input.recipeRepository
      ) {
        const recipe = input.recipeRepository.recordValidated({
          contextId: dryRunInput.contextId,
          targetId: saved.targetId,
          targetParameters: saved.targetParameters,
          source: saved.source,
          targetSchemaDigest: saved.dryRun!.schemaDigest,
          mapping: saved.mapping,
          importJobId: saved.importJobId,
          actorSubjectId: dryRunInput.actorSubjectId,
          recordedAt: dryRunInput.recordedAt
        });
        if (saved.appliedRecipeId !== recipe.recipeId) {
          saved = input.repository.save({
            contextId: dryRunInput.contextId,
            job: {
              ...saved,
              appliedRecipeId: recipe.recipeId
            },
            actorSubjectId: dryRunInput.actorSubjectId,
            recordedAt: dryRunInput.recordedAt
          });
        }
      }
      return saved;
    },

    commit(commitInput) {
      const job = input.repository.get(
        commitInput.contextId,
        commitInput.importJobId
      );
      if (!job) throw new Error("DATA_IMPORT_JOB_NOT_FOUND");
      if (job.state === "COMMITTED" || job.state === "COMMITTED_WITH_ERRORS") {
        throw new Error("DATA_IMPORT_JOB_ALREADY_COMMITTED");
      }
      if (job.state !== "DRY_RUN_READY" || !job.dryRun) {
        throw new Error("DATA_IMPORT_DRY_RUN_REQUIRED");
      }
      const target = targetFor(job);
      const schema = target.describe({
        contextId: commitInput.contextId,
        parameters: job.targetParameters
      });
      if (
        dataImportTargetSchemaDigestV010(schema)
        !== job.dryRun.schemaDigest
      ) {
        throw new Error("DATA_IMPORT_SCHEMA_CHANGED_AFTER_DRY_RUN");
      }

      let receiptRows;
      if (target.commitPreparedRows) {
        const preparedRows = job.dryRun.rows.map(row => {
          if (!row.ok || !row.prepared) {
            throw new Error("DATA_IMPORT_ROW_NOT_PREPARED");
          }
          return row.prepared;
        });
        try {
          const batch = target.commitPreparedRows({
            contextId: commitInput.contextId,
            importJobId: job.importJobId,
            schema,
            preparedRows,
            parameters: job.targetParameters,
            actorSubjectId: commitInput.actorSubjectId,
            recordedAt: commitInput.recordedAt
          });
          if (
            batch.semantics !== "ATOMIC_BATCH"
            || batch.results.length !== preparedRows.length
          ) {
            throw new Error("DATA_IMPORT_BATCH_RESULT_INVALID");
          }
          receiptRows = batch.results.map((result, index) => ({
            rowNumber: preparedRows[index].rowNumber,
            ok: true,
            objectType: result.objectType,
            objectId: result.objectId,
            ...(result.displayKey
              ? { displayKey: result.displayKey }
              : {}),
            issues: []
          }));
        } catch (error) {
          const cause = error instanceof Error
            ? error.message
            : "DATA_IMPORT_ATOMIC_BATCH_FAILED";
          receiptRows = preparedRows.map(prepared => ({
            rowNumber: prepared.rowNumber,
            ok: false,
            issues: [{
              code: "DATA_IMPORT_ATOMIC_BATCH_FAILED",
              message: cause
            }]
          }));
        }
      } else {
        receiptRows = job.dryRun.rows.map(row => {
          if (!row.ok || !row.prepared) {
            return {
              rowNumber: row.rowNumber,
              ok: false,
              issues: row.issues.length > 0
                ? row.issues
                : [{
                    code: "DATA_IMPORT_ROW_NOT_PREPARED",
                    message: "Row was not prepared by dry run."
                  }]
            };
          }
          try {
            const result = target.commitRow({
              contextId: commitInput.contextId,
              importJobId: job.importJobId,
              schema,
              prepared: row.prepared,
              parameters: job.targetParameters,
              actorSubjectId: commitInput.actorSubjectId,
              recordedAt: commitInput.recordedAt
            });
            return {
              rowNumber: row.rowNumber,
              ok: true,
              objectType: result.objectType,
              objectId: result.objectId,
              ...(result.displayKey
                ? { displayKey: result.displayKey }
                : {}),
              issues: []
            };
          } catch (error) {
            const code = error instanceof Error
              ? error.message
              : "DATA_IMPORT_COMMIT_ROW_FAILED";
            return {
              rowNumber: row.rowNumber,
              ok: false,
              issues: [{
                code,
                message: code
              }]
            };
          }
        });
      }

      const failedRows = receiptRows.filter(row => !row.ok).length;
      const next: DataImportJobV010 = {
        ...job,
        state: failedRows === 0 ? "COMMITTED" : "COMMITTED_WITH_ERRORS",
        receipt: {
          committedAt: commitInput.recordedAt,
          totalRows: receiptRows.length,
          succeededRows: receiptRows.length - failedRows,
          failedRows,
          rows: receiptRows
        }
      };
      let saved = input.repository.save({
        contextId: commitInput.contextId,
        job: next,
        actorSubjectId: commitInput.actorSubjectId,
        recordedAt: commitInput.recordedAt
      });
      if (saved.state === "COMMITTED" && input.recipeRepository) {
        const recipe = input.recipeRepository.recordSuccessful({
          contextId: commitInput.contextId,
          targetId: saved.targetId,
          targetParameters: saved.targetParameters,
          source: saved.source,
          targetSchemaDigest: saved.dryRun!.schemaDigest,
          mapping: saved.mapping,
          importJobId: saved.importJobId,
          actorSubjectId: commitInput.actorSubjectId,
          recordedAt: commitInput.recordedAt
        });
        if (saved.appliedRecipeId !== recipe.recipeId) {
          saved = input.repository.save({
            contextId: commitInput.contextId,
            job: {
              ...saved,
              appliedRecipeId: recipe.recipeId
            },
            actorSubjectId: commitInput.actorSubjectId,
            recordedAt: commitInput.recordedAt
          });
        }
      }
      return saved;
    },

    errorRowsCsv(errorInput) {
      const job = input.repository.get(
        errorInput.contextId,
        errorInput.importJobId
      );
      if (!job) throw new Error("DATA_IMPORT_JOB_NOT_FOUND");
      const dryRows = job.dryRun?.rows ?? [];
      const failed = dryRows.filter(row => !row.ok);
      const escape = (value: string) =>
        /[",\n\r]/u.test(value)
          ? '"' + value.replaceAll('"', '""') + '"'
          : value;
      const lines = [[
        "rowNumber",
        "code",
        "fieldId",
        "message"
      ].join(",")];
      for (const row of failed) {
        for (const issue of row.issues) {
          lines.push([
            String(row.rowNumber),
            escape(issue.code),
            escape(issue.fieldId ?? ""),
            escape(issue.message)
          ].join(","));
        }
      }
      return lines.join("\n") + "\n";
    }
  };
}
