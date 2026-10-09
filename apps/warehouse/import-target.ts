import { createHash } from "node:crypto";

import type {
  FoundationObjectImportCellV010,
  FoundationObjectImportPreparedRowV010,
  FoundationObjectImportTargetV010,
  FoundationObjectImportValidationV010
} from "../../contracts/foundation-object/import.js";
import type {
  EffectiveFoundationObjectFieldV010,
  EffectiveObjectSchemaV010
} from "../../contracts/foundation-object/schema.js";
import type {
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import {
  foundationObjectImportCellBlankV010,
  normalizeFoundationObjectImportCellV010
} from "../../foundation/import-values.js";
import type {
  WarehouseRepositoryV010
} from "./repository.js";
import {
  createWarehouseLocationRepositoryV010,
  type WarehouseLocationKindV010,
  type WarehouseLocationRepositoryV010,
  type WarehouseLocationV010
} from "./locations.js";

export const WAREHOUSE_LOCATION_IMPORT_TARGET_V010 =
  "warehouse.location" as const;
export const WAREHOUSE_LOCATION_IMPORT_SCHEMA_V010 =
  "evo.warehouse.location-import/0.1.0" as const;

function localizedField(input: {
  fieldId: string;
  semanticType: string;
  valueType: EffectiveFoundationObjectFieldV010["valueType"];
  control: EffectiveFoundationObjectFieldV010["control"];
  label: string;
  labelZh: string;
  required: boolean;
  order: number;
  enumOptions?: EffectiveFoundationObjectFieldV010["enumOptions"];
}): EffectiveFoundationObjectFieldV010 {
  return {
    fieldId: input.fieldId,
    slotId: "warehouse.location-import",
    semanticType: input.semanticType,
    valueType: input.valueType,
    control: input.control,
    label: {
      default: input.label,
      translations: { "zh-CN": input.labelZh }
    },
    required: input.required,
    order: input.order,
    surfaces: ["IMPORT"],
    ...(input.enumOptions ? { enumOptions: input.enumOptions } : {}),
    source: "CORE",
    resolvedLabel: input.label,
    readable: true,
    writable: true
  };
}

const FIELDS: EffectiveFoundationObjectFieldV010[] = [
  localizedField({
    fieldId: "warehouseCode",
    semanticType: "warehouse-code-reference",
    valueType: "STRING",
    control: "text",
    label: "Warehouse code",
    labelZh: "仓库编码",
    required: true,
    order: 10
  }),
  localizedField({
    fieldId: "path",
    semanticType: "warehouse-location-import-path",
    valueType: "STRING",
    control: "text",
    label: "Location path",
    labelZh: "位置路径",
    required: true,
    order: 20
  }),
  localizedField({
    fieldId: "displayName",
    semanticType: "warehouse-location-display-name",
    valueType: "STRING",
    control: "text",
    label: "Location name",
    labelZh: "位置名称",
    required: true,
    order: 30
  }),
  localizedField({
    fieldId: "locationKind",
    semanticType: "warehouse-location-kind",
    valueType: "ENUM",
    control: "select",
    label: "Location kind",
    labelZh: "位置类型",
    required: true,
    order: 40,
    enumOptions: [
      { value: "ZONE", label: { default: "Zone", translations: { "zh-CN": "区域" } } },
      { value: "LOCATION", label: { default: "Location", translations: { "zh-CN": "位置" } } },
      { value: "BIN", label: { default: "Bin", translations: { "zh-CN": "库位" } } }
    ]
  }),
  localizedField({
    fieldId: "description",
    semanticType: "warehouse-location-description",
    valueType: "STRING",
    control: "text",
    label: "Description",
    labelZh: "说明",
    required: false,
    order: 50
  })
];

function schema(locale = "en"): EffectiveObjectSchemaV010 {
  const normalizedLocale = locale.trim() || "en";
  return {
    contractVersion: "0.1.0",
    objectType: "warehouse.location",
    ownerPackageId: "evo-warehouse",
    baseSchemaRef: WAREHOUSE_LOCATION_IMPORT_SCHEMA_V010,
    locale: normalizedLocale,
    activeRelationshipRoles: [],
    fields: FIELDS.map(field => ({
      ...structuredClone(field),
      resolvedLabel:
        field.label.translations?.[normalizedLocale]
        ?? field.label.translations?.[normalizedLocale.toLocaleLowerCase()]
        ?? field.label.default
    }))
  };
}

function textValue(
  values: Record<string, FoundationObjectImportCellV010>,
  fieldId: string
): string | undefined {
  const value = values[fieldId];
  if (value === null || value === undefined) return undefined;
  const normalized = String(value).trim();
  return normalized || undefined;
}

function normalizePath(value: string): {
  displayPath: string;
  key: string;
  segments: string[];
  normalizedSegments: string[];
} {
  const raw = value.normalize("NFKC").trim();
  if (!raw) throw new Error("WAREHOUSE_LOCATION_IMPORT_PATH_REQUIRED");
  const segments = raw.split("/").map(item => item.trim());
  if (segments.some(item => !item || item === "." || item === "..")) {
    throw new Error("WAREHOUSE_LOCATION_IMPORT_PATH_INVALID");
  }
  if (segments.length > 32) {
    throw new Error("WAREHOUSE_LOCATION_IMPORT_PATH_TOO_DEEP");
  }
  const normalizedSegments = segments.map(item => item.toLocaleLowerCase());
  return {
    displayPath: segments.join("/"),
    key: normalizedSegments.join("/"),
    segments,
    normalizedSegments
  };
}

function deterministicLocationId(input: {
  contextId: string;
  warehouseId: string;
  normalizedPath: string;
}): string {
  return "whloc-" + createHash("sha256")
    .update([
      input.contextId,
      input.warehouseId,
      input.normalizedPath
    ].join("|"))
    .digest("hex")
    .slice(0, 24);
}

function pathIndex(
  locations: WarehouseLocationV010[]
): Map<string, WarehouseLocationV010> {
  const byId = new Map(locations.map(location => [
    location.locationId,
    location
  ] as const));
  const cache = new Map<string, string>();
  const visiting = new Set<string>();

  const resolve = (location: WarehouseLocationV010): string => {
    const cached = cache.get(location.locationId);
    if (cached) return cached;
    if (visiting.has(location.locationId)) {
      throw new Error("WAREHOUSE_LOCATION_EXISTING_HIERARCHY_CYCLE");
    }
    visiting.add(location.locationId);
    const current = location.code.normalize("NFKC").trim().toLocaleLowerCase();
    let value = current;
    if (location.parentLocationId) {
      const parent = byId.get(location.parentLocationId);
      if (!parent) {
        throw new Error("WAREHOUSE_LOCATION_EXISTING_PARENT_NOT_FOUND");
      }
      value = resolve(parent) + "/" + current;
    }
    visiting.delete(location.locationId);
    cache.set(location.locationId, value);
    return value;
  };

  const result = new Map<string, WarehouseLocationV010>();
  for (const location of locations) {
    const key = resolve(location);
    if (result.has(key)) {
      throw new Error("WAREHOUSE_LOCATION_EXISTING_PATH_DUPLICATE");
    }
    result.set(key, location);
  }
  return result;
}

function preparedRecord(input: {
  prepared: FoundationObjectImportPreparedRowV010;
  warehouseByCode: Map<string, { warehouseId: string; code: string }>;
}) {
  const warehouseCode = textValue(input.prepared.values, "warehouseCode");
  const pathText = textValue(input.prepared.values, "path");
  const displayName = textValue(input.prepared.values, "displayName");
  const kind = textValue(
    input.prepared.values,
    "locationKind"
  ) as WarehouseLocationKindV010 | undefined;
  if (!warehouseCode || !pathText || !displayName || !kind) {
    throw new Error("WAREHOUSE_LOCATION_IMPORT_PREPARED_INVALID");
  }
  const warehouse = input.warehouseByCode.get(
    warehouseCode.toLocaleLowerCase()
  );
  if (!warehouse) {
    throw new Error("WAREHOUSE_LOCATION_IMPORT_WAREHOUSE_NOT_FOUND");
  }
  const path = normalizePath(pathText);
  const parentKey = path.normalizedSegments.length > 1
    ? path.normalizedSegments.slice(0, -1).join("/")
    : undefined;
  return {
    rowNumber: input.prepared.rowNumber,
    warehouseId: warehouse.warehouseId,
    warehouseCode: warehouse.code,
    path,
    parentKey,
    code: path.segments[path.segments.length - 1],
    displayName,
    locationKind: kind,
    description: textValue(input.prepared.values, "description")
  };
}

export function createWarehouseLocationImportTargetV010(input: {
  resources: EnterpriseResourceRepositoryV010;
  warehouseRepository: WarehouseRepositoryV010;
  locationRepository?: WarehouseLocationRepositoryV010;
}): FoundationObjectImportTargetV010 {
  const locations = input.locationRepository
    ?? createWarehouseLocationRepositoryV010(input.resources);

  return {
    contractVersion: "0.1.0",
    targetId: WAREHOUSE_LOCATION_IMPORT_TARGET_V010,
    label: {
      default: "Warehouse locations",
      translations: { "zh-CN": "仓库位置层级" }
    },
    objectType: "warehouse.location",
    ownerPackageId: "evo-warehouse",

    describe(describeInput) {
      return schema(describeInput.locale);
    },

    validateRow(validateInput): FoundationObjectImportValidationV010 {
      const fieldMap = new Map(
        validateInput.schema.fields.map(field => [field.fieldId, field])
      );
      const values: Record<string, FoundationObjectImportCellV010> = {};
      const issues: FoundationObjectImportValidationV010["issues"] = [];

      for (const field of validateInput.schema.fields) {
        const raw = validateInput.values[field.fieldId];
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
          values[field.fieldId] =
            normalizeFoundationObjectImportCellV010(field, raw);
        } catch (error) {
          const code = error instanceof Error
            ? error.message
            : "DATA_IMPORT_VALUE_INVALID";
          issues.push({ code, message: code, fieldId: field.fieldId });
        }
      }

      const warehouseCode = textValue(values, "warehouseCode");
      const pathValue = textValue(values, "path");
      if (warehouseCode) {
        const warehouse = input.warehouseRepository.list(
          validateInput.contextId
        ).find(item =>
          item.code.toLocaleLowerCase() === warehouseCode.toLocaleLowerCase()
        );
        if (!warehouse) {
          issues.push({
            code: "WAREHOUSE_LOCATION_IMPORT_WAREHOUSE_NOT_FOUND",
            message: "Warehouse code does not resolve to an active Warehouse.",
            fieldId: "warehouseCode"
          });
        }
      }
      let normalizedPath;
      if (pathValue) {
        try {
          normalizedPath = normalizePath(pathValue);
          values.path = normalizedPath.displayPath;
        } catch (error) {
          const code = error instanceof Error
            ? error.message
            : "WAREHOUSE_LOCATION_IMPORT_PATH_INVALID";
          issues.push({ code, message: code, fieldId: "path" });
        }
      }

      const ok = issues.length === 0;
      return {
        ok,
        ...(ok
          ? {
              prepared: {
                rowNumber: validateInput.rowNumber,
                values,
                dedupeKey: [
                  warehouseCode!.toLocaleLowerCase(),
                  normalizedPath!.key
                ].join("|")
              }
            }
          : {}),
        issues
      };
    },

    commitRow() {
      throw new Error(
        "WAREHOUSE_LOCATION_IMPORT_ATOMIC_BATCH_REQUIRED"
      );
    },

    commitPreparedRows(batchInput) {
      if (!input.resources.transaction) {
        throw new Error("ENTERPRISE_RESOURCE_TRANSACTION_REQUIRED");
      }

      const warehouses = input.warehouseRepository.list(batchInput.contextId);
      const warehouseByCode = new Map(warehouses.map(warehouse => [
        warehouse.code.toLocaleLowerCase(),
        { warehouseId: warehouse.warehouseId, code: warehouse.code }
      ] as const));
      const records = batchInput.preparedRows.map(prepared =>
        preparedRecord({ prepared, warehouseByCode })
      );
      const batchByPath = new Map<string, typeof records[number]>();

      for (const record of records) {
        const key = record.warehouseId + "|" + record.path.key;
        if (batchByPath.has(key)) {
          throw new Error("WAREHOUSE_LOCATION_IMPORT_PATH_DUPLICATE");
        }
        batchByPath.set(key, record);
      }

      const existingByWarehouse = new Map<string, Map<string, WarehouseLocationV010>>();
      for (const warehouse of warehouses) {
        existingByWarehouse.set(
          warehouse.warehouseId,
          pathIndex(locations.list(batchInput.contextId, warehouse.warehouseId))
        );
      }

      for (const record of records) {
        if (!record.parentKey) continue;
        const parentBatchKey =
          record.warehouseId + "|" + record.parentKey;
        const existing = existingByWarehouse
          .get(record.warehouseId)
          ?.get(record.parentKey);
        if (!batchByPath.has(parentBatchKey) && !existing) {
          throw new Error("WAREHOUSE_LOCATION_IMPORT_PARENT_NOT_FOUND");
        }
      }

      const ordered = [...records].sort((a, b) =>
        a.path.segments.length - b.path.segments.length
        || a.path.key.localeCompare(b.path.key)
        || a.rowNumber - b.rowNumber
      );
      const savedByRow = new Map<number, WarehouseLocationV010>();

      input.resources.transaction(() => {
        for (const record of ordered) {
          const existingIndex = existingByWarehouse.get(record.warehouseId)!;
          const existing = existingIndex.get(record.path.key);
          let parentLocationId: string | undefined;
          if (record.parentKey) {
            const persistedParent = existingIndex.get(record.parentKey);
            if (persistedParent) {
              parentLocationId = persistedParent.locationId;
            } else {
              const parentBatch = batchByPath.get(
                record.warehouseId + "|" + record.parentKey
              );
              if (!parentBatch) {
                throw new Error("WAREHOUSE_LOCATION_IMPORT_PARENT_NOT_FOUND");
              }
              const savedParent = savedByRow.get(parentBatch.rowNumber);
              if (!savedParent) {
                throw new Error("WAREHOUSE_LOCATION_IMPORT_PARENT_ORDER_INVALID");
              }
              parentLocationId = savedParent.locationId;
            }
          }
          const location: WarehouseLocationV010 = {
            contractVersion: "0.1.0",
            locationId: existing?.locationId ?? deterministicLocationId({
              contextId: batchInput.contextId,
              warehouseId: record.warehouseId,
              normalizedPath: record.path.key
            }),
            warehouseId: record.warehouseId,
            ...(parentLocationId ? { parentLocationId } : {}),
            code: record.code,
            displayName: record.displayName,
            locationKind: record.locationKind,
            ...(record.description
              ? { description: record.description }
              : {})
          };
          const saved = locations.save({
            contextId: batchInput.contextId,
            location,
            actorSubjectId: batchInput.actorSubjectId,
            recordedAt: batchInput.recordedAt
          });
          existingIndex.set(record.path.key, saved);
          savedByRow.set(record.rowNumber, saved);
        }
      });

      return {
        semantics: "ATOMIC_BATCH",
        results: batchInput.preparedRows.map(prepared => {
          const saved = savedByRow.get(prepared.rowNumber);
          if (!saved) {
            throw new Error("WAREHOUSE_LOCATION_IMPORT_RESULT_MISSING");
          }
          return {
            objectType: "warehouse.location",
            objectId: saved.locationId,
            displayKey: saved.code
          };
        })
      };
    }
  };
}
