import { createHash } from "node:crypto";
import { assertObjectExtensionDefinitionV010 } from "../../contracts/foundation-object/extension.js";
import type { JsonValue } from "../../actions/contracts.js";
import type { DataImportJobV010, DataImportMappingV010 } from "../data-import/types.js";
import { dataImportMappingRouteV010 } from "../data-import/constants.js";
import type { ObjectExtensionRepositoryV010 } from "./repository.js";
import {
  BEX_BATCH_CREATE, BEX_BATCH_IGNORE, BEX_BATCH_REVIEW,
  batchApplicableDefinitionsV010, batchUnmappedColumnsV010,
  type BexImportTargetField
} from "./batch-page.js";

type TypeChoice = "STRING" | "NUMBER" | "BOOLEAN" | "DATE";
type MappingUpdate = {
  contextId: string; importJobId: string; mapping: DataImportMappingV010[];
  ignoredSourceColumns?: string[];
  actorSubjectId: string; recordedAt: string;
};
const allowedTypes: TypeChoice[] = ["STRING","NUMBER","BOOLEAN","DATE"];

function requiredString(value: JsonValue | undefined, error: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(error);
  return value.trim();
}

export function executeObjectExtensionBatchImportV010(input: {
  repository: ObjectExtensionRepositoryV010;
  job: DataImportJobV010;
  contextId: string;
  actorSubjectId: string;
  recordedAt: string;
  values: Record<string, JsonValue>;
  importableTargets?: BexImportTargetField[];
  getCurrentJob(): DataImportJobV010 | undefined;
  applyMapping(input: MappingUpdate): void;
}): JsonValue {
  const { job } = input;
  if (job.targetId !== "counterparty.subject") {
    throw new Error("OBJECT_EXTENSION_IMPORT_TARGET_INVALID");
  }
  // A batch constant is a real, auditable mapping decision, not an import
  // default and not a replacement for mixed per-row source values.
  if (job.state === "COMMITTED" || job.state === "COMMITTED_WITH_ERRORS") {
    throw new Error("DATA_IMPORT_JOB_ALREADY_COMMITTED");
  }
  const previousSubject = job.mapping.find(entry =>
    entry.targetFieldId === "subjectType"
  );
  const submittedSubject = input.values.batchSubjectType;
  const constantDecisionProvided = submittedSubject !== undefined;
  if (constantDecisionProvided && (
    typeof submittedSubject !== "string" ||
    !["__KEEP__", "ORGANIZATION", "PERSON"].includes(submittedSubject)
  )) {
    throw new Error("OBJECT_EXTENSION_BATCH_SUBJECT_TYPE_INVALID");
  }
  if (constantDecisionProvided && submittedSubject !== "__KEEP__"
    && previousSubject?.sourceColumn) {
    throw new Error("OBJECT_EXTENSION_BATCH_SUBJECT_SOURCE_CONFLICT");
  }
  // Undefined is the legacy route (preserve), __KEEP__ explicitly clears
  // an existing constant, and an enum choice explicitly sets it.
  const selectedSubject = constantDecisionProvided
    ? submittedSubject === "__KEEP__" ? undefined : submittedSubject as "ORGANIZATION" | "PERSON"
    : previousSubject?.transform?.kind === "CONSTANT"
      ? previousSubject.transform.value : undefined;
  const changeSubject = constantDecisionProvided
    && (!previousSubject?.sourceColumn)
    && (selectedSubject !== (previousSubject?.transform?.kind === "CONSTANT"
      ? previousSubject.transform.value : undefined));
  const columns = batchUnmappedColumnsV010(job);
  if (columns.length > 200 || (!columns.length && !changeSubject)) {
    throw new Error("OBJECT_EXTENSION_BATCH_COLUMNS_INVALID");
  }
  const role = job.targetParameters?.relationshipMode;
  const slot = role === "SUPPLIER" ? "counterparty.supplier-profile"
    : role === "CUSTOMER" ? "counterparty.customer-profile" : "counterparty.identity";
  const definitions = batchApplicableDefinitionsV010(
    job, input.repository.list(input.contextId, job.targetId)
  );
  const allDefinitions = input.repository.list(input.contextId, job.targetId);
  const allowedTargets = input.importableTargets ?? definitions.map(x => ({
    fieldId: x.fieldId, label: x.label.default, valueType: x.valueType
  }));
  const reserved = new Set(job.mapping.map(x => x.targetFieldId));
  if (selectedSubject !== undefined) reserved.add("subjectType");
  const labels = new Set<string>();
  const choices: Array<{
    column: string; fieldId: string; type: "NEW" | "EXISTING";
    label: string; valueType: TypeChoice;
  }> = [];
  const ignored: string[] = [];
  // Preflight the complete Human decision before persisting even one field.
  for (const [index, column] of columns.entries()) {
    const choice = requiredString(input.values["choice_" + index],
      "OBJECT_EXTENSION_BATCH_CHOICE_REQUIRED");
    if (choice === BEX_BATCH_IGNORE) { ignored.push(column); continue; }
    if (choice === BEX_BATCH_REVIEW) throw new Error("OBJECT_EXTENSION_BATCH_REVIEW_REQUIRED");
    if (choice !== BEX_BATCH_CREATE) {
      const existing = allowedTargets.find(x => x.fieldId === choice);
      if (!existing || reserved.has(choice)) {
        throw new Error("OBJECT_EXTENSION_BATCH_TARGET_UNAVAILABLE");
      }
      reserved.add(choice);
      choices.push({ column, fieldId: choice, type: "EXISTING",
        label: existing.label, valueType: existing.valueType as TypeChoice });
      continue;
    }
    const label = requiredString(input.values["label_" + index],
      "OBJECT_EXTENSION_BATCH_LABEL_REQUIRED");
    if (label.length > 80) throw new Error("OBJECT_EXTENSION_LABEL_TOO_LONG");
    const valueType = requiredString(input.values["type_" + index],
      "OBJECT_EXTENSION_BATCH_TYPE_REQUIRED") as TypeChoice;
    if (!allowedTypes.includes(valueType)) throw new Error("OBJECT_EXTENSION_TYPE_INVALID");
    const labelKey = label.toLocaleLowerCase();
    if (labels.has(labelKey)) throw new Error("OBJECT_EXTENSION_BATCH_LABEL_DUPLICATE");
    labels.add(labelKey);
    const fieldId = "ext_" + createHash("sha256")
      .update(job.targetId + "|" + column).digest("hex").slice(0, 16);
    if (reserved.has(fieldId)) throw new Error("OBJECT_EXTENSION_BATCH_TARGET_DUPLICATE");
    reserved.add(fieldId);
    const exact = definitions.find(x => x.fieldId === fieldId);
    if (exact) {
      if (exact.label.default.trim().toLocaleLowerCase() !== labelKey
        || exact.valueType !== valueType) {
        throw new Error("OBJECT_EXTENSION_BATCH_EXISTING_CONFLICT");
      }
      choices.push({ column, fieldId, type: "EXISTING", label, valueType });
      continue;
    }
    if (allowedTargets.some(x =>
      x.label.trim().toLocaleLowerCase() === labelKey
    ) || allDefinitions.some(x =>
      x.fieldId === fieldId
      || x.label.default.trim().toLocaleLowerCase() === labelKey
        && (!x.applicability?.relationshipRoles?.length || !role
          || x.applicability.relationshipRoles.includes(role as "SUPPLIER" | "CUSTOMER"))
    )) {
      throw new Error("OBJECT_EXTENSION_BATCH_EXISTING_FIELD_REVIEW_REQUIRED");
    }
    choices.push({ column, fieldId, type: "NEW", label, valueType });
  }
  // Explicitly ignoring all optional columns is a valid, reversible
  // decision. It must be saved instead of forcing a meaningless field write.
  if (!choices.length && !ignored.length && !changeSubject) {
    throw new Error("OBJECT_EXTENSION_BATCH_NO_DECISIONS_SELECTED");
  }
  const created: string[] = [];
  const reused: string[] = [];
  let currentColumn = "";
  try {
    for (const item of choices) {
      currentColumn = item.column;
      if (item.type === "EXISTING") { reused.push(item.column); continue; }
      // Check again in the owner immediately before the write. Retries
      // reuse exact matching definitions; ambiguous historical duplicates fail.
      const existing = input.repository.list(input.contextId,job.targetId)
        .filter(x => x.fieldId === item.fieldId
          || x.label.default.trim().toLocaleLowerCase() === item.label.toLocaleLowerCase());
      if (existing.length) {
        if (existing.length !== 1 || existing[0].fieldId !== item.fieldId
          || existing[0].valueType !== item.valueType) {
          throw new Error("OBJECT_EXTENSION_BATCH_EXISTING_FIELD_REVIEW_REQUIRED");
        }
        reused.push(item.column); continue;
      }
      const definition = assertObjectExtensionDefinitionV010({
        contractVersion: "0.1.0",
        extensionId: "import." + item.fieldId,
        targetObjectType: "counterparty.subject",
        targetSlot: slot,
        namespace: "enterprise.counterparty",
        fieldId: item.fieldId, semanticType: "enterprise-custom-" + item.fieldId,
        valueType: item.valueType, label: { default: item.label },
        required: false, order: 1000,
        ...(role === "SUPPLIER" || role === "CUSTOMER"
          ? { applicability: { relationshipRoles: [role] } } : {}),
        surfaces: ["DETAIL","EDIT","IMPORT"],
        importable: true, exportable: true,
        agentReadable: false, agentWritable: false
      });
      input.repository.save({
        contextId: input.contextId, definition,
        actorSubjectId: input.actorSubjectId, recordedAt: input.recordedAt
      });
      created.push(item.column);
    }
    const latest = input.getCurrentJob();
    const latestSubject = latest?.mapping.find(item =>
      item.targetFieldId === "subjectType");
    if (JSON.stringify(latestSubject ?? null)
      !== JSON.stringify(previousSubject ?? null)) {
      throw new Error("OBJECT_EXTENSION_BATCH_SUBJECT_STALE");
    }
    if (!latest || latest.targetId !== job.targetId
      || latest.source.headers.length !== job.source.headers.length
      || latest.source.headers.some((x, i) => x !== job.source.headers[i])) {
      throw new Error("OBJECT_EXTENSION_BATCH_JOB_CHANGED");
    }
    const sourceSet = new Set(latest.mapping.map(x => x.sourceColumn).filter(Boolean));
    const targetSet = new Set(latest.mapping.map(x => x.targetFieldId));
    for (const item of choices) {
      if (sourceSet.has(item.column) || targetSet.has(item.fieldId)) {
        throw new Error("OBJECT_EXTENSION_BATCH_MAPPING_CONFLICT");
      }
      sourceSet.add(item.column);
      targetSet.add(item.fieldId);
    }
    input.applyMapping({
      contextId: input.contextId, importJobId: job.importJobId,
      mapping: [
        ...latest.mapping.filter(item =>
          !(changeSubject && item.targetFieldId === "subjectType")
        ),
        ...choices.map(item => ({
          sourceColumn: item.column, targetFieldId: item.fieldId
        })),
        ...(changeSubject && selectedSubject !== undefined ? [{
          targetFieldId: "subjectType",
          transform: {kind:"CONSTANT" as const,value:selectedSubject}
        }] : [])
      ],
      ignoredSourceColumns: [...new Set([
        ...(latest.ignoredSourceColumns ?? []).filter(column =>
          !choices.some(item => item.column === column)
        ),
        ...ignored
      ])],
      actorSubjectId: input.actorSubjectId, recordedAt: input.recordedAt
    });
    return {
      contractVersion: "0.1.0",
      state: "MAPPED",
      message: "Created " + created.length + " field(s), reused " + reused.length
        + ", ignored " + ignored.length + ". Mapping saved. Run validation before committing any suppliers.",
      created, reused, ignored, mapped: choices.map(x => x.column),
      batchSubjectType: selectedSubject ?? null,
      navigateTo: dataImportMappingRouteV010(job.importJobId)
    } as JsonValue;
  } catch (error) {
    const cause = error instanceof Error ? error.message : "OBJECT_EXTENSION_BATCH_FAILED";
    // The owner has no N-field transaction. Never imply rollback after a
    // partial save; show the exact progress and make retry idempotent.
    return {
      contractVersion: "0.1.0",
      state: "PARTIAL",
      message: "Batch stopped at " + currentColumn + " (" + cause + "). "
        + created.length + " fields created, " + reused.length
        + " reused. No supplier data was committed. Reopen this review and retry.",
      created, reused, ignored, errorCode: cause
    } as JsonValue;
  }
}
