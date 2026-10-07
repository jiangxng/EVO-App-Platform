import { createHash } from "node:crypto";
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
  DataImportJobV010
} from "./types.js";
import type {
  DataImportRepositoryV010
} from "./repository.js";

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function digest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function effectiveSchemaSemanticDigest(
  schema: ReturnType<FoundationObjectImportTargetV010["describe"]>
): string {
  return digest({
    contractVersion: schema.contractVersion,
    objectType: schema.objectType,
    ownerPackageId: schema.ownerPackageId,
    baseSchemaRef: schema.baseSchemaRef,
    activeRelationshipRoles: schema.activeRelationshipRoles,
    fields: schema.fields.map(field => {
      const {
        resolvedLabel: _resolvedLabel,
        ...semantic
      } = field;
      return semantic;
    })
  });
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

function mappedValues(input: {
  sourceRow: Record<string, FoundationObjectImportCellV010>;
  mapping: DataImportMappingV010[];
}): Record<string, FoundationObjectImportCellV010> {
  const values: Record<string, FoundationObjectImportCellV010> = {};
  for (const item of input.mapping) {
    values[item.targetFieldId] = input.sourceRow[item.sourceColumn] ?? null;
  }
  return values;
}

export interface DataImportServiceV010 {
  stage(input: {
    contextId: string;
    importJobId: string;
    targetId: string;
    targetParameters?: DataImportJobV010["targetParameters"];
    source: DataImportSourceV010;
    mapping: DataImportMappingV010[];
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
  targets: readonly FoundationObjectImportTargetV010[];
}): DataImportServiceV010 {
  const targets = targetMap(input.targets);

  function targetFor(job: DataImportJobV010): FoundationObjectImportTargetV010 {
    const target = targets.get(job.targetId);
    if (!target) throw new Error("DATA_IMPORT_TARGET_NOT_FOUND");
    return target;
  }

  return {
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
      if (!targets.has(stageInput.targetId)) {
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
          schemaDigest: effectiveSchemaSemanticDigest(schema),
          totalRows: rows.length,
          validRows: rows.length - invalidRows,
          invalidRows,
          rows
        }
      };
      return input.repository.save({
        contextId: dryRunInput.contextId,
        job: next,
        actorSubjectId: dryRunInput.actorSubjectId,
        recordedAt: dryRunInput.recordedAt
      });
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
        effectiveSchemaSemanticDigest(schema)
        !== job.dryRun.schemaDigest
      ) {
        throw new Error("DATA_IMPORT_SCHEMA_CHANGED_AFTER_DRY_RUN");
      }

      const receiptRows = job.dryRun.rows.map(row => {
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
      return input.repository.save({
        contextId: commitInput.contextId,
        job: next,
        actorSubjectId: commitInput.actorSubjectId,
        recordedAt: commitInput.recordedAt
      });
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
