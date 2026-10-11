import type {
  EnterpriseResourceJsonV010,
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import {
  WAREHOUSE_RESOURCE_TYPE_V010,
  WAREHOUSE_SCHEMA_V010
} from "./foundation-object.js";

export const WAREHOUSE_NAMESPACE_V010 = "evo.warehouse" as const;
export const WAREHOUSE_COLLECTION_V010 = "warehouses" as const;
export const WAREHOUSE_LOCATION_COLLECTION_V010 = "locations" as const;
export const WAREHOUSE_LOCATION_RESOURCE_TYPE_V010 =
  "warehouse.location" as const;

export interface WarehouseSubjectV010 {
  contractVersion: "0.1.0";
  warehouseId: string;
  code: string;
  displayName: string;
  description?: string;
}

export interface WarehouseRepositoryV010 {
  list(contextId: string): WarehouseSubjectV010[];
  get(contextId: string, warehouseId: string): WarehouseSubjectV010 | undefined;
  save(input: {
    contextId: string;
    warehouse: WarehouseSubjectV010;
    actorSubjectId: string;
    recordedAt: string;
  }): WarehouseSubjectV010;
  archive(input: {
    contextId: string;
    warehouseId: string;
    actorSubjectId: string;
    recordedAt: string;
  }): WarehouseSubjectV010;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function optional(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function assertWarehouseSubjectV010(
  value: WarehouseSubjectV010
): WarehouseSubjectV010 {
  if (value?.contractVersion !== "0.1.0") {
    throw new Error("WAREHOUSE_CONTRACT_VERSION_INVALID");
  }
  return {
    contractVersion: "0.1.0",
    warehouseId: required(value.warehouseId, "WAREHOUSE_ID_REQUIRED"),
    code: required(value.code, "WAREHOUSE_CODE_REQUIRED"),
    displayName: required(
      value.displayName,
      "WAREHOUSE_DISPLAY_NAME_REQUIRED"
    ),
    ...(optional(value.description)
      ? { description: optional(value.description) }
      : {})
  };
}

function payloadOf(
  warehouse: WarehouseSubjectV010
): EnterpriseResourceJsonV010 {
  return JSON.parse(JSON.stringify(warehouse)) as EnterpriseResourceJsonV010;
}

function fromPayload(
  payload: EnterpriseResourceJsonV010 | undefined
): WarehouseSubjectV010 {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("WAREHOUSE_RESOURCE_PAYLOAD_INVALID");
  }
  return assertWarehouseSubjectV010(
    payload as unknown as WarehouseSubjectV010
  );
}

function address(contextId: string, warehouseId: string) {
  return {
    contextId: required(contextId, "WAREHOUSE_CONTEXT_REQUIRED"),
    namespace: WAREHOUSE_NAMESPACE_V010,
    collectionId: WAREHOUSE_COLLECTION_V010,
    resourceType: WAREHOUSE_RESOURCE_TYPE_V010,
    resourceId: required(warehouseId, "WAREHOUSE_ID_REQUIRED")
  };
}

export function createWarehouseRepositoryV010(
  resources: EnterpriseResourceRepositoryV010
): WarehouseRepositoryV010 {
  return {
    list(contextId) {
      return resources.list({
        contextId: required(contextId, "WAREHOUSE_CONTEXT_REQUIRED"),
        namespace: WAREHOUSE_NAMESPACE_V010,
        collectionId: WAREHOUSE_COLLECTION_V010,
        resourceType: WAREHOUSE_RESOURCE_TYPE_V010,
        lifecycleState: "ACTIVE"
      })
        .map(resource => fromPayload(resource.payload))
        .sort((a, b) =>
          a.displayName.localeCompare(b.displayName)
          || a.code.localeCompare(b.code)
          || a.warehouseId.localeCompare(b.warehouseId)
        );
    },

    get(contextId, warehouseId) {
      const resource = resources.get(address(contextId, warehouseId));
      if (!resource || resource.lifecycleState !== "ACTIVE") return undefined;
      return fromPayload(resource.payload);
    },

    save(input) {
      const contextId = required(input.contextId, "WAREHOUSE_CONTEXT_REQUIRED");
      const warehouse = assertWarehouseSubjectV010(input.warehouse);
      const existing = resources.get(address(contextId, warehouse.warehouseId));
      if (existing?.lifecycleState === "ARCHIVED") {
        throw new Error("WAREHOUSE_ARCHIVED");
      }
      const duplicate = resources.list({
        contextId,
        namespace: WAREHOUSE_NAMESPACE_V010,
        collectionId: WAREHOUSE_COLLECTION_V010,
        resourceType: WAREHOUSE_RESOURCE_TYPE_V010
      })
        .map(resource => fromPayload(resource.payload))
        .find(candidate =>
          candidate.warehouseId !== warehouse.warehouseId
          && candidate.code.toLocaleLowerCase()
            === warehouse.code.toLocaleLowerCase()
        );
      if (duplicate) throw new Error("WAREHOUSE_CODE_DUPLICATE");

      const saved = resources.put({
        contextId,
        namespace: WAREHOUSE_NAMESPACE_V010,
        collectionId: WAREHOUSE_COLLECTION_V010,
        resourceType: WAREHOUSE_RESOURCE_TYPE_V010,
        resourceId: warehouse.warehouseId,
        schemaRef: WAREHOUSE_SCHEMA_V010,
        ownerPackageId: "evo-warehouse",
        storageKind: "DOCUMENT",
        payload: payloadOf(warehouse),
        metadata: {
          code: warehouse.code,
          displayName: warehouse.displayName
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return fromPayload(saved.payload);
    },

    archive(input) {
      const contextId = required(input.contextId, "WAREHOUSE_CONTEXT_REQUIRED");
      const current = this.get(contextId, input.warehouseId);
      if (!current) throw new Error("WAREHOUSE_NOT_FOUND");
      const activeLocations = resources.list({
        contextId,
        namespace: WAREHOUSE_NAMESPACE_V010,
        collectionId: WAREHOUSE_LOCATION_COLLECTION_V010,
        resourceType: WAREHOUSE_LOCATION_RESOURCE_TYPE_V010,
        lifecycleState: "ACTIVE"
      }).some(resource =>
        resource.metadata?.warehouseId === current.warehouseId
      );
      if (activeLocations) {
        throw new Error("WAREHOUSE_HAS_ACTIVE_LOCATIONS");
      }
      resources.archive({
        address: address(contextId, current.warehouseId),
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return current;
    }
  };
}
