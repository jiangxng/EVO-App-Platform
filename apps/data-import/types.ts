import type {
  FoundationObjectImportCellV010,
  FoundationObjectImportIssueV010,
  FoundationObjectImportPreparedRowV010,
  FoundationObjectImportTargetParametersV010
} from "../../contracts/foundation-object/import.js";

export type DataImportJobStateV010 =
  | "STAGED"
  | "DRY_RUN_READY"
  | "DRY_RUN_FAILED"
  | "COMMITTED"
  | "COMMITTED_WITH_ERRORS";

export interface DataImportSourceV010 {
  kind: "CSV" | "ROWS";
  name?: string;
  headers: string[];
  rows: Array<Record<string, FoundationObjectImportCellV010>>;
}

export interface DataImportMappingV010 {
  sourceColumn: string;
  targetFieldId: string;
}

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

export interface DataImportJobV010 {
  contractVersion: "0.1.0";
  importJobId: string;
  targetId: string;
  targetParameters?: FoundationObjectImportTargetParametersV010;
  state: DataImportJobStateV010;
  source: DataImportSourceV010;
  mapping: DataImportMappingV010[];
  stagedAt: string;
  stagedBySubjectId: string;
  dryRun?: DataImportDryRunV010;
  receipt?: DataImportCommitReceiptV010;
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
  const mapping = value.mapping.map(item => ({
    sourceColumn: required(
      item.sourceColumn,
      "DATA_IMPORT_MAPPING_SOURCE_REQUIRED"
    ),
    targetFieldId: required(
      item.targetFieldId,
      "DATA_IMPORT_MAPPING_TARGET_REQUIRED"
    )
  }));
  for (const item of mapping) {
    if (!headerSet.has(item.sourceColumn)) {
      throw new Error("DATA_IMPORT_MAPPING_SOURCE_UNKNOWN");
    }
  }
  if (
    new Set(mapping.map(item => item.targetFieldId)).size
    !== mapping.length
  ) {
    throw new Error("DATA_IMPORT_MAPPING_TARGET_DUPLICATE");
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
    stagedAt: required(value.stagedAt, "DATA_IMPORT_STAGED_AT_REQUIRED"),
    stagedBySubjectId: required(
      value.stagedBySubjectId,
      "DATA_IMPORT_STAGED_BY_REQUIRED"
    ),
    ...(value.dryRun ? { dryRun: structuredClone(value.dryRun) } : {}),
    ...(value.receipt ? { receipt: structuredClone(value.receipt) } : {})
  };
}
