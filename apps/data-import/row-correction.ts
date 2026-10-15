import { createHash } from "node:crypto";
import {
  fieldsForSurfaceV010,
  type EffectiveObjectSchemaV010
} from "../../contracts/foundation-object/schema.js";
import type { FoundationObjectImportCellV010 } from "../../contracts/foundation-object/import.js";
import type { DataImportJobV010 } from "./types.js";

export type DataImportRowCorrectionV010 = {
  rowNumber: number;
  sourceColumn: string;
  value: FoundationObjectImportCellV010;
  actorSubjectId: string;
  recordedAt: string;
};

export function dataImportRowCorrectionRevisionV010(
  job: DataImportJobV010, rowNumber: number, sourceColumn: string
): string {
  const row = job.source.rows[rowNumber - 1];
  if (!row || !job.source.headers.includes(sourceColumn)) {
    throw new Error("DATA_IMPORT_CORRECTION_SOURCE_NOT_FOUND");
  }
  const correction = job.rowCorrections?.find(item =>
    item.rowNumber === rowNumber && item.sourceColumn === sourceColumn
  );
  return createHash("sha256").update(JSON.stringify({
    jobId: job.importJobId, rowNumber, sourceColumn,
    original: row[sourceColumn] ?? null,
    correction: correction ?? null,
    mapping: job.mapping.find(item => item.sourceColumn === sourceColumn) ?? null
  })).digest("hex").slice(0, 32);
}

export function dataImportCorrectableSourceV010(input: {
  job: DataImportJobV010;
  schema: EffectiveObjectSchemaV010;
  rowNumber: number;
  sourceColumn: string;
}): { fieldId: string; fieldLabel: string; valueType: "STRING" | "ENUM" } {
  const { job, schema, rowNumber, sourceColumn } = input;
  if (!Number.isInteger(rowNumber) || rowNumber < 1
    || rowNumber > job.source.rows.length
    || !job.source.headers.includes(sourceColumn)) {
    throw new Error("DATA_IMPORT_CORRECTION_SOURCE_NOT_FOUND");
  }
  if (job.state === "COMMITTED" || job.state === "COMMITTED_WITH_ERRORS") {
    throw new Error("DATA_IMPORT_JOB_ALREADY_COMMITTED");
  }
  const mapping = job.mapping.find(item => item.sourceColumn === sourceColumn);
  if (!mapping || mapping.transform
    || job.ignoredSourceColumns?.includes(sourceColumn)) {
    throw new Error("DATA_IMPORT_CORRECTION_MAPPING_NOT_DIRECT");
  }
  const field = fieldsForSurfaceV010(schema, "IMPORT").find(item =>
    item.fieldId === mapping.targetFieldId && item.writable
  );
  if (!field || (field.valueType !== "STRING" && field.valueType !== "ENUM")) {
    throw new Error("DATA_IMPORT_CORRECTION_FIELD_NOT_EDITABLE");
  }
  const existing = job.rowCorrections?.some(item =>
    item.rowNumber === rowNumber && item.sourceColumn === sourceColumn);
  const issue = job.dryRun?.rows.find(item => item.rowNumber === rowNumber);
  const issueForField = issue?.issues.some(item =>
    item.fieldId === mapping.targetFieldId);
  if (!existing && !issueForField) {
    throw new Error("DATA_IMPORT_CORRECTION_REQUIRES_FIELD_ISSUE");
  }
  return {
    fieldId: field.fieldId,
    fieldLabel: field.resolvedLabel,
    valueType: field.valueType
  };
}

export function dataImportCorrectedRowV010(
  job: DataImportJobV010, rowNumber: number
): Record<string, FoundationObjectImportCellV010> {
  const raw = job.source.rows[rowNumber - 1];
  if (!raw) throw new Error("DATA_IMPORT_CORRECTION_SOURCE_NOT_FOUND");
  const effective = { ...raw };
  for (const item of job.rowCorrections ?? []) {
    if (item.rowNumber === rowNumber) {
      effective[item.sourceColumn] = item.value;
    }
  }
  return effective;
}
