import type {
  FoundationObjectImportCellV010,
  FoundationObjectImportIssueV010,
  FoundationObjectImportPreparedRowV010,
  FoundationObjectImportTargetParametersV010
} from "../../contracts/foundation-object/import.js";

export type DataImportRowCorrectionV010 = {
  rowNumber: number;
  sourceColumn: string;
  value: FoundationObjectImportCellV010;
  actorSubjectId: string;
  recordedAt: string;
};

export type DataImportJobStateV010 =
  | "STAGED"
  | "DRY_RUN_READY"
  | "DRY_RUN_FAILED"
  | "COMMITTED"
  | "COMMITTED_WITH_ERRORS";

export interface DataImportSourceV010 {
  kind: "CSV" | "XLSX" | "ROWS";
  name?: string;
  headers: string[];
  rows: Array<Record<string, FoundationObjectImportCellV010>>;
}

export interface DataImportValueMapEntryV010 {
  source: FoundationObjectImportCellV010;
  target: FoundationObjectImportCellV010;
}

export interface DataImportValueMapTransformV010 {
  kind: "VALUE_MAP";
  entries: DataImportValueMapEntryV010[];
}

export interface DataImportConstantTransformV010 {
  kind: "CONSTANT";
  value: FoundationObjectImportCellV010;
}

export type DataImportValueTransformV010 =
  | DataImportValueMapTransformV010
  | DataImportConstantTransformV010;

export interface DataImportMappingAdvisoryV010 {
  source: "EXPERIENCE_COMPILER";
  confidence: number;
  supportCount: number;
  conflictCount: number;
  supportingRecordIds: string[];
  rationale: string;
}

export interface DataImportMappingV010 {
  /**
   * Source column is required for direct and VALUE_MAP mappings.
   * CONSTANT mappings intentionally have no source column.
   */
  sourceColumn?: string;
  targetFieldId: string;
  transform?: DataImportValueTransformV010;
  advisory?: DataImportMappingAdvisoryV010;
}

export type DataImportMappingOriginV010 =
  | "DETERMINISTIC"
  | "RECIPE"
  | "HUMAN"
  | "AGENT";

export interface DataImportDryRunRowV010 {
  rowNumber: number;
  ok: boolean;
  prepared?: FoundationObjectImportPreparedRowV010;
  issues: FoundationObjectImportIssueV010[];
}

export interface DataImportDryRunV010 {
  schemaDigest: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: DataImportDryRunRowV010[];
}

export interface DataImportCommitRowReceiptV010 {
  rowNumber: number;
  ok: boolean;
  objectType?: string;
  objectId?: string;
  displayKey?: string;
  issues: FoundationObjectImportIssueV010[];
}

export interface DataImportCommitReceiptV010 {
  committedAt: string;
  totalRows: number;
  succeededRows: number;
  failedRows: number;
  rows: DataImportCommitRowReceiptV010[];
}

export interface DataImportExperienceLearningV010 {
  status: "RECORDED" | "UNAVAILABLE" | "NOT_ELIGIBLE";
  recordedAt: string;
  learnedMappings: number;
  observationRecordIds?: string[];
  patternRecordIds?: string[];
  diagnostic?: string;
}

/** Owner-scoped, non-approved Human choices. Never drives import commit or schema changes. */
export interface DataImportBatchReviewDraftV010 {
  actorSubjectId: string;
  recordedAt: string;
  columns: Array<{
    sourceColumn: string;
    choice: string;
    label: string;
    valueType: "STRING" | "NUMBER" | "BOOLEAN" | "DATE";
  }>;
  batchSubjectType?: "__KEEP__" | "ORGANIZATION" | "PERSON";
}

export interface DataImportJobV010 {
  contractVersion: "0.1.0";
  importJobId: string;
  targetId: string;
  targetParameters?: FoundationObjectImportTargetParametersV010;
  state: DataImportJobStateV010;
  source: DataImportSourceV010;
  mapping: DataImportMappingV010[];
  /** Per-Human review only; saving drafts cannot approve enterprise definitions. */
  batchReviewDrafts?: DataImportBatchReviewDraftV010[];
  /** Explicitly ignored source columns. All original cells remain in source.rows. */
  ignoredSourceColumns?: string[];
  /** Human-confirmed overrides; original Excel cells remain in source.rows. */
  rowCorrections?: DataImportRowCorrectionV010[];
  mappingOrigin?: DataImportMappingOriginV010;
  appliedRecipeId?: string;
  stagedAt: string;
  stagedBySubjectId: string;
  dryRun?: DataImportDryRunV010;
  receipt?: DataImportCommitReceiptV010;
  experienceLearning?: DataImportExperienceLearningV010;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

export function assertDataImportJobV010(
  value: DataImportJobV010
): DataImportJobV010 {
  if (value?.contractVersion !== "0.1.0") {
    throw new Error("DATA_IMPORT_JOB_VERSION_INVALID");
  }
  if (![
    "STAGED",
    "DRY_RUN_READY",
    "DRY_RUN_FAILED",
    "COMMITTED",
    "COMMITTED_WITH_ERRORS"
  ].includes(value.state)) {
    throw new Error("DATA_IMPORT_JOB_STATE_INVALID");
  }
  const headers = value.source.headers.map(header =>
    required(header, "DATA_IMPORT_SOURCE_HEADER_INVALID")
  );
  const headerSet = new Set(headers);
  if (headerSet.size !== headers.length) {
    throw new Error("DATA_IMPORT_SOURCE_HEADER_DUPLICATE");
  }
  const mapping = value.mapping.map(item => {
    const transform = item.transform;
    let normalizedTransform: DataImportValueTransformV010 | undefined;
    if (transform !== undefined) {
      if (transform === null || typeof transform !== "object") {
        throw new Error("DATA_IMPORT_MAPPING_TRANSFORM_INVALID");
      }
      if (transform.kind === "VALUE_MAP") {
        if (
          !Array.isArray(transform.entries)
          || transform.entries.length === 0
        ) {
          throw new Error("DATA_IMPORT_MAPPING_TRANSFORM_INVALID");
        }
        const keys = new Set<string>();
        const entries = transform.entries.map(entry => {
          if (
            entry === null
            || typeof entry !== "object"
            || !("source" in entry)
            || !("target" in entry)
          ) {
            throw new Error("DATA_IMPORT_MAPPING_TRANSFORM_INVALID");
          }
          const key = JSON.stringify(entry.source);
          if (keys.has(key)) {
            throw new Error("DATA_IMPORT_MAPPING_TRANSFORM_SOURCE_DUPLICATE");
          }
          keys.add(key);
          return {
            source: entry.source,
            target: entry.target
          };
        });
        normalizedTransform = {
          kind: "VALUE_MAP",
          entries
        };
      } else if (transform.kind === "CONSTANT") {
        if (!("value" in transform)) {
          throw new Error("DATA_IMPORT_MAPPING_TRANSFORM_INVALID");
        }
        normalizedTransform = {
          kind: "CONSTANT",
          value: transform.value
        };
      } else {
        throw new Error("DATA_IMPORT_MAPPING_TRANSFORM_INVALID");
      }
    }
    let normalizedAdvisory: DataImportMappingAdvisoryV010 | undefined;
    if (item.advisory !== undefined) {
      if (
        item.advisory === null
        || typeof item.advisory !== "object"
        || item.advisory.source !== "EXPERIENCE_COMPILER"
        || typeof item.advisory.confidence !== "number"
        || item.advisory.confidence < 0
        || item.advisory.confidence > 1
        || typeof item.advisory.supportCount !== "number"
        || !Number.isInteger(item.advisory.supportCount)
        || item.advisory.supportCount < 1
        || typeof item.advisory.conflictCount !== "number"
        || !Number.isInteger(item.advisory.conflictCount)
        || item.advisory.conflictCount < 0
        || !Array.isArray(item.advisory.supportingRecordIds)
        || item.advisory.supportingRecordIds.length === 0
        || !item.advisory.supportingRecordIds.every(value =>
          typeof value === "string" && Boolean(value.trim())
        )
        || typeof item.advisory.rationale !== "string"
        || !item.advisory.rationale.trim()
      ) {
        throw new Error("DATA_IMPORT_MAPPING_ADVISORY_INVALID");
      }
      normalizedAdvisory = {
        source: "EXPERIENCE_COMPILER",
        confidence: item.advisory.confidence,
        supportCount: item.advisory.supportCount,
        conflictCount: item.advisory.conflictCount,
        supportingRecordIds:
          item.advisory.supportingRecordIds.map(value => value.trim()),
        rationale: item.advisory.rationale.trim()
      };
    }
    const sourceColumn = item.sourceColumn?.trim();
    if (normalizedTransform?.kind === "CONSTANT") {
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
      ...(normalizedTransform ? { transform: normalizedTransform } : {}),
      ...(normalizedAdvisory ? { advisory: normalizedAdvisory } : {})
    };
  });
  for (const item of mapping) {
    if (item.sourceColumn && !headerSet.has(item.sourceColumn)) {
      throw new Error("DATA_IMPORT_MAPPING_SOURCE_UNKNOWN");
    }
  }
  if (
    new Set(mapping.map(item => item.targetFieldId)).size
    !== mapping.length
  ) {
    throw new Error("DATA_IMPORT_MAPPING_TARGET_DUPLICATE");
  }
  const ignoredSourceColumns = (value.ignoredSourceColumns ?? []).map(column =>
    required(column, "DATA_IMPORT_IGNORED_COLUMN_INVALID")
  );
  if (new Set(ignoredSourceColumns).size !== ignoredSourceColumns.length
    || ignoredSourceColumns.some(column => !headerSet.has(column))
    || ignoredSourceColumns.some(column =>
      mapping.some(item => item.sourceColumn === column))) {
    throw new Error("DATA_IMPORT_IGNORED_COLUMN_INVALID");
  }

  const corrections = (value.rowCorrections ?? []).map(item => {
    if (!Number.isInteger(item.rowNumber) || item.rowNumber < 1
      || item.rowNumber > value.source.rows.length
      || !headerSet.has(item.sourceColumn)
      || !mapping.some(entry => entry.sourceColumn === item.sourceColumn)
      || ignoredSourceColumns.includes(item.sourceColumn)
      || typeof item.actorSubjectId !== "string" || !item.actorSubjectId.trim()
      || typeof item.recordedAt !== "string" || !item.recordedAt.trim()
      || !("value" in item)
      || !(item.value === null || typeof item.value === "string"
        || (typeof item.value === "number" && Number.isFinite(item.value))
        || typeof item.value === "boolean")) {
      throw new Error("DATA_IMPORT_ROW_CORRECTION_INVALID");
    }
    return { rowNumber: item.rowNumber, sourceColumn: item.sourceColumn,
      value: item.value, actorSubjectId: item.actorSubjectId.trim(),
      recordedAt: item.recordedAt.trim() };
  });
  const correctionKeys = corrections.map(item => item.rowNumber + "|" + item.sourceColumn);
  if (new Set(correctionKeys).size !== correctionKeys.length) {
    throw new Error("DATA_IMPORT_ROW_CORRECTION_DUPLICATE");
  }
  let experienceLearning: DataImportExperienceLearningV010 | undefined;
  if (value.experienceLearning) {
    const item = value.experienceLearning;
    if (
      !["RECORDED", "UNAVAILABLE", "NOT_ELIGIBLE"].includes(item.status)
      || typeof item.recordedAt !== "string"
      || !item.recordedAt.trim()
      || typeof item.learnedMappings !== "number"
      || !Number.isInteger(item.learnedMappings)
      || item.learnedMappings < 0
    ) {
      throw new Error("DATA_IMPORT_EXPERIENCE_LEARNING_INVALID");
    }
    experienceLearning = {
      status: item.status,
      recordedAt: item.recordedAt.trim(),
      learnedMappings: item.learnedMappings,
      ...(item.observationRecordIds
        ? { observationRecordIds: item.observationRecordIds.map(value =>
            required(value, "DATA_IMPORT_EC_OBSERVATION_ID_INVALID")
          ) }
        : {}),
      ...(item.patternRecordIds
        ? { patternRecordIds: item.patternRecordIds.map(value =>
            required(value, "DATA_IMPORT_EC_PATTERN_ID_INVALID")
          ) }
        : {}),
      ...(item.diagnostic?.trim()
        ? { diagnostic: item.diagnostic.trim() }
        : {})
    };
  }

  return {
    contractVersion: "0.1.0",
    importJobId: required(value.importJobId, "DATA_IMPORT_JOB_ID_REQUIRED"),
    targetId: required(value.targetId, "DATA_IMPORT_TARGET_ID_REQUIRED"),
    ...(value.targetParameters
      ? { targetParameters: structuredClone(value.targetParameters) }
      : {}),
    state: value.state,
    source: {
      kind: value.source.kind,
      ...(value.source.name?.trim()
        ? { name: value.source.name.trim() }
        : {}),
      headers,
      rows: structuredClone(value.source.rows)
    },
    mapping,
    ...(value.batchReviewDrafts !== undefined ? {
      batchReviewDrafts: (() => {
        if (!Array.isArray(value.batchReviewDrafts)
          || value.batchReviewDrafts.length > 16) {
          throw new Error("DATA_IMPORT_BATCH_DRAFTS_INVALID");
        }
        const seenActors=new Set<string>();
        return value.batchReviewDrafts.map(draft=>{
          if (!draft || typeof draft !== "object"
            || typeof draft.actorSubjectId !== "string"
            || !draft.actorSubjectId.trim()
            || typeof draft.recordedAt !== "string"
            || !draft.recordedAt.trim()
            || !Array.isArray(draft.columns) || draft.columns.length > 200
            || seenActors.has(draft.actorSubjectId)
            || draft.batchSubjectType !== undefined && ![
              "__KEEP__","ORGANIZATION","PERSON"
            ].includes(draft.batchSubjectType)) {
            throw new Error("DATA_IMPORT_BATCH_DRAFT_INVALID");
          }
          seenActors.add(draft.actorSubjectId);
          const used=new Set<string>();
          const columns=draft.columns.map(entry=>{
            if (!entry || typeof entry.sourceColumn !== "string"
              || !headers.includes(entry.sourceColumn)
              || used.has(entry.sourceColumn)
              || typeof entry.choice !== "string" || !entry.choice.trim()
              || entry.choice.length > 160
              || typeof entry.label !== "string"
              || !entry.label.trim() || entry.label.length > 80
              || !["STRING","NUMBER","BOOLEAN","DATE"].includes(entry.valueType)) {
              throw new Error("DATA_IMPORT_BATCH_DRAFT_INVALID");
            }
            used.add(entry.sourceColumn);
            return {...entry};
          });
          return {
            actorSubjectId:draft.actorSubjectId,
            recordedAt:draft.recordedAt,
            columns,
            ...(draft.batchSubjectType ? {
              batchSubjectType:draft.batchSubjectType
            } : {})
          };
        });
      })()
    } : {}),
    ...(ignoredSourceColumns.length ? { ignoredSourceColumns } : {}),
    ...(corrections.length ? { rowCorrections: corrections } : {}),
    ...(value.mappingOrigin
      ? { mappingOrigin: value.mappingOrigin }
      : {}),
    ...(value.appliedRecipeId?.trim()
      ? { appliedRecipeId: value.appliedRecipeId.trim() }
      : {}),
    stagedAt: required(value.stagedAt, "DATA_IMPORT_STAGED_AT_REQUIRED"),
    stagedBySubjectId: required(
      value.stagedBySubjectId,
      "DATA_IMPORT_STAGED_BY_REQUIRED"
    ),
    ...(value.dryRun ? { dryRun: structuredClone(value.dryRun) } : {}),
    ...(value.receipt ? { receipt: structuredClone(value.receipt) } : {}),
    ...(experienceLearning ? { experienceLearning } : {})
  };
}
