import { createHash } from "node:crypto";
import type {
  FoundationObjectImportCellV010,
  FoundationObjectImportTargetParametersV010,
  FoundationObjectImportTargetV010,
  FoundationObjectImportValidationV010
} from "../../contracts/foundation-object/import.js";
import {
  fieldsForSurfaceV010,
  type EffectiveFoundationObjectFieldV010
} from "../../contracts/foundation-object/schema.js";
import type {
  ObjectExtensionRepositoryV010
} from "../object-extension/repository.js";
import type {
  ObjectExtensionValueRepositoryV010
} from "../object-extension/values.js";
import {
  createCounterpartyEffectiveObjectSchemaV010
} from "./foundation-object.js";
import {
  assertCounterpartySubjectV010,
  type CounterpartyRepositoryV010,
  type CounterpartySubjectV010
} from "./repository.js";
import type {
  CounterpartyRelationshipRoleCodeV010,
  CounterpartyRoleRepositoryV010
} from "./roles.js";

export const COUNTERPARTY_IMPORT_TARGET_V010 =
  "counterparty.subject" as const;

function roles(
  parameters?: FoundationObjectImportTargetParametersV010
): CounterpartyRelationshipRoleCodeV010[] {
  const values = parameters?.relationshipRoles ?? [];
  const normalized = [...new Set(values.map(value => value.trim().toUpperCase()))];
  for (const value of normalized) {
    if (value !== "CUSTOMER" && value !== "SUPPLIER") {
      throw new Error("COUNTERPARTY_IMPORT_ROLE_INVALID");
    }
  }
  return normalized as CounterpartyRelationshipRoleCodeV010[];
}

function blank(value: FoundationObjectImportCellV010 | undefined): boolean {
  return value === null
    || value === undefined
    || (typeof value === "string" && !value.trim());
}

function normalizeCell(
  field: EffectiveFoundationObjectFieldV010,
  value: FoundationObjectImportCellV010 | undefined
): FoundationObjectImportCellV010 {
  if (blank(value)) return null;

  switch (field.valueType) {
    case "STRING":
      return typeof value === "string"
        ? value.trim()
        : String(value);
    case "NUMBER": {
      const number = typeof value === "number"
        ? value
        : Number(String(value).trim());
      if (!Number.isFinite(number)) {
        throw new Error("DATA_IMPORT_VALUE_NUMBER_INVALID");
      }
      return number;
    }
    case "BOOLEAN": {
      if (typeof value === "boolean") return value;
      const normalized = String(value).trim().toLowerCase();
      if (["true", "1", "yes", "y"].includes(normalized)) return true;
      if (["false", "0", "no", "n"].includes(normalized)) return false;
      throw new Error("DATA_IMPORT_VALUE_BOOLEAN_INVALID");
    }
    case "DATE": {
      const normalized = String(value).trim();
      if (!Number.isFinite(Date.parse(normalized))) {
        throw new Error("DATA_IMPORT_VALUE_DATE_INVALID");
      }
      return normalized;
    }
    case "ENUM": {
      const normalized = String(value).trim();
      const match = field.enumOptions?.find(option =>
        option.value.toLocaleLowerCase() === normalized.toLocaleLowerCase()
      );
      if (!match) throw new Error("DATA_IMPORT_VALUE_ENUM_INVALID");
      return match.value;
    }
  }
}

function textValue(
  values: Record<string, FoundationObjectImportCellV010>,
  fieldId: string
): string | undefined {
  const value = values[fieldId];
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function deterministicCounterpartyId(input: {
  contextId: string;
  importJobId: string;
  rowNumber: number;
  code: string;
}): string {
  const digest = createHash("sha256")
    .update([
      input.contextId,
      input.importJobId,
      String(input.rowNumber),
      input.code.toLocaleLowerCase()
    ].join("|"))
    .digest("hex")
    .slice(0, 24);
  return "cp-import-" + digest;
}

export function createCounterpartyImportTargetV010(input: {
  repository: CounterpartyRepositoryV010;
  roleRepository: CounterpartyRoleRepositoryV010;
  extensionRepository: ObjectExtensionRepositoryV010;
  extensionValueRepository: ObjectExtensionValueRepositoryV010;
}): FoundationObjectImportTargetV010 {
  const existingCodeCache = new Map<string, Set<string>>();
  const extensionDefinitionCache = new Map<
    string,
    ReturnType<ObjectExtensionRepositoryV010["list"]>
  >();

  function describe(contextId: string, locale?: string, parameters?: FoundationObjectImportTargetParametersV010) {
    return createCounterpartyEffectiveObjectSchemaV010({
      locale,
      activeRelationshipRoles: roles(parameters),
      extensions: input.extensionRepository.list(
        contextId,
        "counterparty.subject"
      )
    });
  }

  return {
    contractVersion: "0.1.0",
    targetId: COUNTERPARTY_IMPORT_TARGET_V010,
    objectType: "counterparty.subject",
    ownerPackageId: "evo-counterparty",

    describe(describeInput) {
      return describe(
        describeInput.contextId,
        describeInput.locale,
        describeInput.parameters
      );
    },

    validateRow(validateInput): FoundationObjectImportValidationV010 {
      const schema = validateInput.schema;
      const importFields = fieldsForSurfaceV010(schema, "IMPORT")
        .filter(field => field.writable);
      const fieldMap = new Map(
        importFields.map(field => [field.fieldId, field])
      );
      const normalizedValues: Record<string, FoundationObjectImportCellV010> = {};
      const issues: FoundationObjectImportValidationV010["issues"] = [];

      for (const field of importFields) {
        const raw = validateInput.values[field.fieldId];
        if (field.required && blank(raw)) {
          issues.push({
            code: "DATA_IMPORT_REQUIRED_VALUE_MISSING",
            message: "Required import value is missing.",
            fieldId: field.fieldId
          });
          continue;
        }
        if (raw === undefined) continue;
        try {
          normalizedValues[field.fieldId] = normalizeCell(field, raw);
        } catch (error) {
          const code = error instanceof Error
            ? error.message
            : "DATA_IMPORT_VALUE_INVALID";
          issues.push({
            code,
            message: code,
            fieldId: field.fieldId
          });
        }
      }

      for (const fieldId of Object.keys(validateInput.values)) {
        if (!fieldMap.has(fieldId)) {
          issues.push({
            code: "DATA_IMPORT_FIELD_NOT_IMPORTABLE",
            message: "Mapped field is not importable.",
            fieldId
          });
        }
      }

      const code = textValue(normalizedValues, "code");
      const displayName = textValue(normalizedValues, "displayName");
      const subjectType = textValue(normalizedValues, "subjectType");

      if (code && displayName && subjectType && issues.length === 0) {
        try {
          const candidate: CounterpartySubjectV010 = {
            contractVersion: "0.1.0",
            counterpartyId: "dry-run",
            code,
            displayName,
            subjectType: subjectType as CounterpartySubjectV010["subjectType"],
            status: "ACTIVE",
            ...(textValue(normalizedValues, "legalName")
              ? { legalName: textValue(normalizedValues, "legalName") }
              : {}),
            ...(textValue(normalizedValues, "taxIdentifier")
              ? { taxIdentifier: textValue(normalizedValues, "taxIdentifier") }
              : {}),
            ...(textValue(normalizedValues, "countryOrRegion")
              ? { countryOrRegion: textValue(normalizedValues, "countryOrRegion") }
              : {}),
            ...(textValue(normalizedValues, "phone")
              ? { phone: textValue(normalizedValues, "phone") }
              : {}),
            ...(textValue(normalizedValues, "email")
              ? { email: textValue(normalizedValues, "email") }
              : {}),
            ...(textValue(normalizedValues, "notes")
              ? { notes: textValue(normalizedValues, "notes") }
              : {})
          };
          assertCounterpartySubjectV010(candidate);
        } catch (error) {
          const errorCode = error instanceof Error
            ? error.message
            : "COUNTERPARTY_IMPORT_SUBJECT_INVALID";
          issues.push({
            code: errorCode,
            message: errorCode
          });
        }

        const cacheKey =
          validateInput.contextId + "|" + validateInput.importJobId;
        if (validateInput.rowNumber === 1 || !existingCodeCache.has(cacheKey)) {
          existingCodeCache.set(
            cacheKey,
            new Set(
              input.repository.list(validateInput.contextId)
                .map(existing => existing.code.toLocaleLowerCase())
            )
          );
        }
        if (
          existingCodeCache.get(cacheKey)
            ?.has(code.toLocaleLowerCase())
        ) {
          issues.push({
            code: "COUNTERPARTY_CODE_DUPLICATE",
            message: "Counterparty code already exists.",
            fieldId: "code"
          });
        }
      }

      return {
        ok: issues.length === 0,
        ...(issues.length === 0 && code
          ? {
              prepared: {
                rowNumber: validateInput.rowNumber,
                values: normalizedValues,
                dedupeKey: "counterparty-code:" + code.toLocaleLowerCase()
              }
            }
          : {}),
        issues
      };
    },

    commitRow(commitInput) {
      const code = textValue(commitInput.prepared.values, "code");
      const displayName = textValue(
        commitInput.prepared.values,
        "displayName"
      );
      const subjectType = textValue(
        commitInput.prepared.values,
        "subjectType"
      );
      if (!code || !displayName || !subjectType) {
        throw new Error("COUNTERPARTY_IMPORT_PREPARED_ROW_INVALID");
      }
      const counterpartyId = deterministicCounterpartyId({
        contextId: commitInput.contextId,
        importJobId: commitInput.importJobId,
        rowNumber: commitInput.prepared.rowNumber,
        code
      });
      const subject: CounterpartySubjectV010 = {
        contractVersion: "0.1.0",
        counterpartyId,
        code,
        displayName,
        subjectType: subjectType as CounterpartySubjectV010["subjectType"],
        status: "ACTIVE",
        ...(textValue(commitInput.prepared.values, "legalName")
          ? { legalName: textValue(commitInput.prepared.values, "legalName") }
          : {}),
        ...(textValue(commitInput.prepared.values, "taxIdentifier")
          ? { taxIdentifier: textValue(commitInput.prepared.values, "taxIdentifier") }
          : {}),
        ...(textValue(commitInput.prepared.values, "countryOrRegion")
          ? { countryOrRegion: textValue(commitInput.prepared.values, "countryOrRegion") }
          : {}),
        ...(textValue(commitInput.prepared.values, "phone")
          ? { phone: textValue(commitInput.prepared.values, "phone") }
          : {}),
        ...(textValue(commitInput.prepared.values, "email")
          ? { email: textValue(commitInput.prepared.values, "email") }
          : {}),
        ...(textValue(commitInput.prepared.values, "notes")
          ? { notes: textValue(commitInput.prepared.values, "notes") }
          : {})
      };
      input.repository.save({
        contextId: commitInput.contextId,
        subject,
        actorSubjectId: commitInput.actorSubjectId,
        recordedAt: commitInput.recordedAt
      });

      for (const roleCode of roles(commitInput.parameters)) {
        input.roleRepository.assign({
          contextId: commitInput.contextId,
          counterpartyId,
          roleCode,
          actorSubjectId: commitInput.actorSubjectId,
          recordedAt: commitInput.recordedAt
        });
      }

      const definitionCacheKey =
        commitInput.contextId + "|" + commitInput.importJobId;
      if (
        commitInput.prepared.rowNumber === 1
        || !extensionDefinitionCache.has(definitionCacheKey)
      ) {
        extensionDefinitionCache.set(
          definitionCacheKey,
          input.extensionRepository.list(
            commitInput.contextId,
            "counterparty.subject"
          )
        );
      }
      const definitions =
        extensionDefinitionCache.get(definitionCacheKey) ?? [];
      const byFieldId = new Map(
        definitions.map(definition => [definition.fieldId, definition])
      );
      const grouped = new Map<string, {
        slot: string;
        namespace: string;
        values: Record<string, FoundationObjectImportCellV010>;
      }>();

      for (const [fieldId, value] of Object.entries(
        commitInput.prepared.values
      )) {
        const definition = byFieldId.get(fieldId);
        if (!definition) continue;
        const key = definition.targetSlot + "|" + definition.namespace;
        const group = grouped.get(key) ?? {
          slot: definition.targetSlot,
          namespace: definition.namespace,
          values: {}
        };
        group.values[fieldId] = value;
        grouped.set(key, group);
      }

      for (const group of grouped.values()) {
        input.extensionValueRepository.save({
          contextId: commitInput.contextId,
          valueSet: {
            contractVersion: "0.1.0",
            targetRef: {
              objectType: "counterparty.subject",
              objectId: counterpartyId,
              slot: group.slot
            },
            namespace: group.namespace,
            values: group.values,
            provenance: {
              source: "IMPORT",
              sourceRef: commitInput.importJobId
            }
          },
          actorSubjectId: commitInput.actorSubjectId,
          recordedAt: commitInput.recordedAt
        });
      }

      return {
        objectType: "counterparty.subject",
        objectId: counterpartyId,
        displayKey: code
      };
    }
  };
}
