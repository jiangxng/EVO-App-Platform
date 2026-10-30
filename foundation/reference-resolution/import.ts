import type {
  EffectiveObjectSchemaV010,
  EffectiveFoundationObjectFieldV010
} from "../../contracts/foundation-object/schema.js";
import type {
  FoundationObjectImportCellV010,
  FoundationObjectImportIssueV010
} from "../../contracts/foundation-object/import.js";
import type { BusinessDictionaryRepositoryV010 } from "../../apps/business-dictionary/repository.js";
import type { OrganizationRepositoryV010 } from "../../apps/organization/repository.js";
import type { PersonnelRepositoryV010 } from "../../apps/personnel/repository.js";

type ImportRow = {
  rowNumber: number;
  values: Record<string, FoundationObjectImportCellV010>;
};
export interface ManagedReferenceImportResolutionV010 {
  rowNumber: number;
  /** Stable, owner-verified references; never source display labels. */
  resolved: Record<string, string>;
  issues: FoundationObjectImportIssueV010[];
}
export interface ManagedReferenceImportReadersV010 {
  businessDictionary?: {
    isActive(): boolean;
    repository: Pick<BusinessDictionaryRepositoryV010, "resolveBatch">;
  };
  organization?: {
    isActive(): boolean;
    repository: Pick<OrganizationRepositoryV010, "resolveBatch">;
  };
  personnel?: {
    isActive(): boolean;
    repository: Pick<PersonnelRepositoryV010, "resolveBatch">;
  };
}

/** Synchronous batched preflight, reusable by every Foundation Object target.
 * Read privileges and active-Enterprise Context must already be checked by the
 * caller's Host capability. This function never writes domain data.
 */
export function prepareManagedReferenceImportRowsV010(input: {
  contextId: string;
  schema: EffectiveObjectSchemaV010;
  rows: readonly ImportRow[];
  readers: ManagedReferenceImportReadersV010;
}): ManagedReferenceImportResolutionV010[] {
  if (!input.contextId?.trim()) throw new Error("DATA_IMPORT_REFERENCE_CONTEXT_REQUIRED");
  const fields = input.schema.fields.filter(field =>
    field.valueType === "REFERENCE" && field.surfaces.includes("IMPORT")
  );
  const results = input.rows.map(row => ({
    rowNumber: row.rowNumber,
    resolved: {} as Record<string, string>,
    issues: [] as FoundationObjectImportIssueV010[]
  }));
  const issue = (i: number, field: EffectiveFoundationObjectFieldV010, code: string) => {
    results[i].issues.push({
      code, fieldId: field.fieldId, message: code
    });
  };
  for (const field of fields) {
    const reference = field.reference;
    if (!reference || reference.cardinality !== "ONE") {
      results.forEach((_, i) => issue(i, field, "DATA_IMPORT_REFERENCE_SCHEMA_NOT_READY"));
      continue;
    }
    const indices: number[] = [];
    const values: string[] = [];
    input.rows.forEach((row, i) => {
      const source = row.values[field.fieldId];
      if (source === null || source === undefined
        || (typeof source === "string" && !source.trim())) return;
      if (typeof source !== "string") {
        issue(i, field, "DATA_IMPORT_REFERENCE_SOURCE_VALUE_INVALID");
        return;
      }
      indices.push(i);
      values.push(source);
    });
    if (indices.length === 0) continue;
    const owner = reference.sourceKind === "BUSINESS_DICTIONARY"
      ? input.readers.businessDictionary
      : reference.sourceKind === "ORGANIZATION"
        ? input.readers.organization : input.readers.personnel;
    if (!owner || !owner.isActive()) {
      indices.forEach(i => issue(i, field, "DATA_IMPORT_REFERENCE_PROVIDER_NOT_ACTIVE"));
      continue;
    }
    try {
      const resolved = reference.sourceKind === "BUSINESS_DICTIONARY"
        ? input.readers.businessDictionary!.repository.resolveBatch({
          contextId: input.contextId,
          dictionaryId: reference.sourceId,
          expectedVersion: reference.expectedVersion,
          sourceValues: values
        })
        : reference.sourceKind === "ORGANIZATION"
          ? input.readers.organization!.repository.resolveBatch({
            contextId: input.contextId,
            organizationId: reference.sourceId,
            expectedVersion: reference.expectedVersion,
            sourceValues: values
          })
          : input.readers.personnel!.repository.resolveBatch({
            contextId: input.contextId,
            personnelDirectoryId: reference.sourceId,
            expectedVersion: reference.expectedVersion,
            sourceValues: values
          });
      if (resolved.length !== indices.length) {
        throw new Error("DATA_IMPORT_REFERENCE_BATCH_LENGTH_INVALID");
      }
      resolved.forEach((item, k) => {
        const index = indices[k];
        if (item.status !== "RESOLVED") {
          issue(index, field, "DATA_IMPORT_REFERENCE_" + item.status);
          return;
        }
        const stable = "optionCode" in item ? item.optionCode
          : "unitId" in item ? item.unitId : item.personId;
        if (!stable?.trim()) {
          issue(index, field, "DATA_IMPORT_REFERENCE_STABLE_ID_INVALID");
          return;
        }
        results[index].resolved[field.fieldId] = stable;
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "DATA_IMPORT_REFERENCE_LOOKUP_FAILED";
      indices.forEach(i => issue(i, field, "DATA_IMPORT_REFERENCE_LOOKUP_FAILED:" + code));
    }
  }
  return results;
}
