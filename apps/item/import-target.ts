import { createHash } from "node:crypto";
import type {
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import type {
  FoundationObjectImportCellV010,
  FoundationObjectImportTargetV010,
  FoundationObjectImportValidationV010
} from "../../contracts/foundation-object/import.js";
import {
  fieldsForSurfaceV010
} from "../../contracts/foundation-object/schema.js";
import {
  foundationObjectImportCellBlankV010,
  normalizeFoundationObjectImportCellV010
} from "../../foundation/import-values.js";
import type {
  ObjectExtensionRepositoryV010
} from "../object-extension/repository.js";
import type {
  ObjectExtensionValueRepositoryV010
} from "../object-extension/values.js";
import {
  createItemEffectiveObjectSchemaV010,
  ITEM_RESOURCE_TYPE_V010,
  type ItemKindV010
} from "./foundation-object.js";
import {
  assertItemSubjectV010,
  ITEM_COLLECTION_V010,
  ITEM_NAMESPACE_V010,
  type ItemRepositoryV010,
  type ItemSubjectV010
} from "./repository.js";

export const ITEM_IMPORT_TARGET_V010 = "item.subject" as const;

function textValue(
  values: Record<string, FoundationObjectImportCellV010>,
  fieldId: string
): string | undefined {
  const value = values[fieldId];
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function deterministicItemId(input: {
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
  return "item-import-" + digest;
}

function itemFromPrepared(input: {
  contextId: string;
  importJobId: string;
  rowNumber: number;
  values: Record<string, FoundationObjectImportCellV010>;
}): ItemSubjectV010 {
  const code = textValue(input.values, "code");
  const displayName = textValue(input.values, "displayName");
  const itemKind = textValue(input.values, "itemKind");
  const baseUomCode = textValue(input.values, "baseUomCode");
  if (!code || !displayName || !itemKind || !baseUomCode) {
    throw new Error("ITEM_IMPORT_PREPARED_ROW_INVALID");
  }
  return assertItemSubjectV010({
    contractVersion: "0.1.0",
    itemId: deterministicItemId({
      contextId: input.contextId,
      importJobId: input.importJobId,
      rowNumber: input.rowNumber,
      code
    }),
    code,
    displayName,
    itemKind: itemKind as ItemKindV010,
    baseUomCode,
    ...(textValue(input.values, "description")
      ? { description: textValue(input.values, "description") }
      : {})
  });
}

function extensionValueSets(input: {
  contextId: string;
  importJobId: string;
  item: ItemSubjectV010;
  values: Record<string, FoundationObjectImportCellV010>;
  extensionRepository: ObjectExtensionRepositoryV010;
}) {
  const definitions = input.extensionRepository.list(
    input.contextId,
    ITEM_RESOURCE_TYPE_V010
  );
  const byFieldId = new Map(
    definitions.map(definition => [definition.fieldId, definition])
  );
  const grouped = new Map<string, {
    slot: string;
    namespace: string;
    values: Record<string, FoundationObjectImportCellV010>;
  }>();

  for (const [fieldId, value] of Object.entries(input.values)) {
    const definition = byFieldId.get(fieldId);
    if (!definition || foundationObjectImportCellBlankV010(value)) continue;
    const key = definition.targetSlot + "|" + definition.namespace;
    const group = grouped.get(key) ?? {
      slot: definition.targetSlot,
      namespace: definition.namespace,
      values: {}
    };
    group.values[fieldId] = value;
    grouped.set(key, group);
  }

  return [...grouped.values()].map(group => ({
    contractVersion: "0.1.0" as const,
    targetRef: {
      objectType: ITEM_RESOURCE_TYPE_V010,
      objectId: input.item.itemId,
      slot: group.slot
    },
    namespace: group.namespace,
    values: group.values,
    provenance: {
      source: "IMPORT" as const,
      sourceRef: input.importJobId
    }
  }));
}

export function createItemImportTargetV010(input: {
  resources: EnterpriseResourceRepositoryV010;
  repository: ItemRepositoryV010;
  extensionRepository: ObjectExtensionRepositoryV010;
  extensionValueRepository: ObjectExtensionValueRepositoryV010;
}): FoundationObjectImportTargetV010 {
  const existingCodeCache = new Map<string, Set<string>>();

  function extensions(contextId: string) {
    return input.extensionRepository.list(
      contextId,
      ITEM_RESOURCE_TYPE_V010
    );
  }

  function describe(contextId: string, locale?: string) {
    return createItemEffectiveObjectSchemaV010({
      locale,
      applicabilityMode: "DISCOVERY",
      extensions: extensions(contextId)
    });
  }

  function rowSchema(inputRow: {
    contextId: string;
    locale?: string;
    itemKind?: ItemKindV010;
  }) {
    return createItemEffectiveObjectSchemaV010({
      locale: inputRow.locale,
      itemKind: inputRow.itemKind,
      extensions: extensions(inputRow.contextId)
    });
  }

  return {
    contractVersion: "0.1.0",
    targetId: ITEM_IMPORT_TARGET_V010,
    label: {
      default: "Items",
      translations: { "zh-CN": "物料 / 项目" }
    },
    objectType: ITEM_RESOURCE_TYPE_V010,
    ownerPackageId: "evo-item",

    describe(describeInput) {
      return describe(describeInput.contextId, describeInput.locale);
    },

    validateRow(validateInput): FoundationObjectImportValidationV010 {
      const discoveryFields = fieldsForSurfaceV010(
        validateInput.schema,
        "IMPORT"
      ).filter(field => field.writable);
      const discoveryMap = new Map(
        discoveryFields.map(field => [field.fieldId, field])
      );
      const issues: FoundationObjectImportValidationV010["issues"] = [];

      for (const fieldId of Object.keys(validateInput.values)) {
        if (!discoveryMap.has(fieldId)) {
          issues.push({
            code: "DATA_IMPORT_FIELD_NOT_IMPORTABLE",
            message: "Mapped field is not importable.",
            fieldId
          });
        }
      }

      const kindField = discoveryMap.get("itemKind");
      let resolvedItemKind: ItemKindV010 | undefined;
      if (kindField) {
        const rawKind = validateInput.values.itemKind;
        if (!foundationObjectImportCellBlankV010(rawKind)) {
          try {
            const normalizedKind =
              normalizeFoundationObjectImportCellV010(kindField, rawKind);
            if (
              normalizedKind === "GOODS"
              || normalizedKind === "SERVICE"
            ) {
              resolvedItemKind = normalizedKind;
            }
          } catch {
            // The normal field validation below emits the governed enum error.
          }
        }
      }

      const effectiveSchema = rowSchema({
        contextId: validateInput.contextId,
        locale: validateInput.schema.locale,
        itemKind: resolvedItemKind
      });
      const effectiveFields = fieldsForSurfaceV010(
        effectiveSchema,
        "IMPORT"
      ).filter(field => field.writable);
      const effectiveMap = new Map(
        effectiveFields.map(field => [field.fieldId, field])
      );
      const normalizedValues: Record<string, FoundationObjectImportCellV010> = {};

      for (const discoveryField of discoveryFields) {
        const raw = validateInput.values[discoveryField.fieldId];
        const field = effectiveMap.get(discoveryField.fieldId);
        if (!field) {
          if (!foundationObjectImportCellBlankV010(raw)) {
            issues.push({
              code: "DATA_IMPORT_FIELD_NOT_APPLICABLE",
              message:
                "Mapped field is not applicable to this row's object qualifiers.",
              fieldId: discoveryField.fieldId
            });
          }
          continue;
        }
        if (field.required && foundationObjectImportCellBlankV010(raw)) {
          issues.push({
            code: "DATA_IMPORT_REQUIRED_VALUE_MISSING",
            message: "Required import value is missing.",
            fieldId: field.fieldId
          });
          continue;
        }
        if (raw === undefined) continue;
        try {
          normalizedValues[field.fieldId] =
            normalizeFoundationObjectImportCellV010(field, raw);
        } catch (error) {
          const code = error instanceof Error
            ? error.message
            : "DATA_IMPORT_VALUE_INVALID";
          issues.push({ code, message: code, fieldId: field.fieldId });
        }
      }

      const code = textValue(normalizedValues, "code");
      const displayName = textValue(normalizedValues, "displayName");
      const itemKind = textValue(normalizedValues, "itemKind");
      const baseUomCode = textValue(normalizedValues, "baseUomCode");

      if (code && displayName && itemKind && baseUomCode && issues.length === 0) {
        try {
          assertItemSubjectV010({
            contractVersion: "0.1.0",
            itemId: "dry-run",
            code,
            displayName,
            itemKind: itemKind as ItemKindV010,
            baseUomCode,
            ...(textValue(normalizedValues, "description")
              ? { description: textValue(normalizedValues, "description") }
              : {})
          });
        } catch (error) {
          const errorCode = error instanceof Error
            ? error.message
            : "ITEM_IMPORT_SUBJECT_INVALID";
          issues.push({ code: errorCode, message: errorCode });
        }

        const cacheKey =
          validateInput.contextId + "|" + validateInput.importJobId;
        if (validateInput.rowNumber === 1 || !existingCodeCache.has(cacheKey)) {
          const existingCodes = new Set<string>();
          for (const resource of input.resources.list({
            contextId: validateInput.contextId,
            namespace: ITEM_NAMESPACE_V010,
            collectionId: ITEM_COLLECTION_V010,
            resourceType: ITEM_RESOURCE_TYPE_V010
          })) {
            const metadataCode = resource.metadata?.code;
            if (typeof metadataCode === "string" && metadataCode.trim()) {
              existingCodes.add(metadataCode.trim().toLocaleLowerCase());
              continue;
            }
            try {
              const payload = assertItemSubjectV010(
                resource.payload as unknown as ItemSubjectV010
              );
              existingCodes.add(payload.code.toLocaleLowerCase());
            } catch {
              // Repository validation will fail closed if the malformed
              // historical resource is ever addressed directly.
            }
          }
          existingCodeCache.set(cacheKey, existingCodes);
        }
        if (
          existingCodeCache.get(cacheKey)
            ?.has(code.toLocaleLowerCase())
        ) {
          issues.push({
            code: "ITEM_CODE_DUPLICATE",
            message: "Item code already exists.",
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
                dedupeKey: "item-code:" + code.toLocaleLowerCase()
              }
            }
          : {}),
        issues
      };
    },

    commitRow(commitInput) {
      const item = itemFromPrepared({
        contextId: commitInput.contextId,
        importJobId: commitInput.importJobId,
        rowNumber: commitInput.prepared.rowNumber,
        values: commitInput.prepared.values
      });
      input.repository.save({
        contextId: commitInput.contextId,
        item,
        actorSubjectId: commitInput.actorSubjectId,
        recordedAt: commitInput.recordedAt
      });
      const valueSets = extensionValueSets({
        contextId: commitInput.contextId,
        importJobId: commitInput.importJobId,
        item,
        values: commitInput.prepared.values,
        extensionRepository: input.extensionRepository
      });
      for (const valueSet of valueSets) {
        input.extensionValueRepository.save({
          contextId: commitInput.contextId,
          valueSet,
          actorSubjectId: commitInput.actorSubjectId,
          recordedAt: commitInput.recordedAt
        });
      }
      return {
        objectType: ITEM_RESOURCE_TYPE_V010,
        objectId: item.itemId,
        displayKey: item.code
      };
    },

    commitPreparedRows(batchInput) {
      if (!input.resources.transaction) {
        throw new Error("ENTERPRISE_RESOURCE_TRANSACTION_REQUIRED");
      }
      const items = batchInput.preparedRows.map(prepared =>
        itemFromPrepared({
          contextId: batchInput.contextId,
          importJobId: batchInput.importJobId,
          rowNumber: prepared.rowNumber,
          values: prepared.values
        })
      );
      const valueSets = batchInput.preparedRows.flatMap((prepared, index) =>
        extensionValueSets({
          contextId: batchInput.contextId,
          importJobId: batchInput.importJobId,
          item: items[index],
          values: prepared.values,
          extensionRepository: input.extensionRepository
        })
      );

      input.resources.transaction(() => {
        for (const item of items) {
          input.repository.save({
            contextId: batchInput.contextId,
            item,
            actorSubjectId: batchInput.actorSubjectId,
            recordedAt: batchInput.recordedAt
          });
        }
        if (valueSets.length > 0) {
          input.extensionValueRepository.saveMany({
            contextId: batchInput.contextId,
            valueSets,
            actorSubjectId: batchInput.actorSubjectId,
            recordedAt: batchInput.recordedAt
          });
        }
      });

      return {
        semantics: "ATOMIC_BATCH",
        results: items.map(item => ({
          objectType: ITEM_RESOURCE_TYPE_V010,
          objectId: item.itemId,
          displayKey: item.code
        }))
      };
    }
  };
}
