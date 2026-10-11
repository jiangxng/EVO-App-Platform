import type {
  EnterpriseResourceJsonV010,
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import {
  WAREHOUSE_COLLECTION_V010,
  WAREHOUSE_LOCATION_COLLECTION_V010,
  WAREHOUSE_LOCATION_RESOURCE_TYPE_V010,
  WAREHOUSE_NAMESPACE_V010
} from "./repository.js";
import {
  WAREHOUSE_RESOURCE_TYPE_V010
} from "./foundation-object.js";

export const WAREHOUSE_LOCATION_SCHEMA_V010 =
  "evo.warehouse.location/0.1.0" as const;

export type WarehouseLocationKindV010 =
  | "ZONE"
  | "LOCATION"
  | "BIN";

export interface WarehouseLocationV010 {
  contractVersion: "0.1.0";
  locationId: string;
  warehouseId: string;
  parentLocationId?: string;
  code: string;
  displayName: string;
  locationKind: WarehouseLocationKindV010;
  description?: string;
}

export interface WarehouseLocationRepositoryV010 {
  list(contextId: string, warehouseId: string): WarehouseLocationV010[];
  listChildren(
    contextId: string,
    warehouseId: string,
    parentLocationId?: string
  ): WarehouseLocationV010[];
  get(
    contextId: string,
    locationId: string
  ): WarehouseLocationV010 | undefined;
  save(input: {
    contextId: string;
    location: WarehouseLocationV010;
    actorSubjectId: string;
    recordedAt: string;
  }): WarehouseLocationV010;
  archive(input: {
    contextId: string;
    locationId: string;
    actorSubjectId: string;
    recordedAt: string;
  }): WarehouseLocationV010;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function optional(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function assertWarehouseLocationV010(
  value: WarehouseLocationV010
): WarehouseLocationV010 {
  if (value?.contractVersion !== "0.1.0") {
    throw new Error("WAREHOUSE_LOCATION_CONTRACT_VERSION_INVALID");
  }
  if (!["ZONE", "LOCATION", "BIN"].includes(value.locationKind)) {
    throw new Error("WAREHOUSE_LOCATION_KIND_INVALID");
  }
  const locationId = required(
    value.locationId,
    "WAREHOUSE_LOCATION_ID_REQUIRED"
  );
  const parentLocationId = optional(value.parentLocationId);
  if (parentLocationId === locationId) {
    throw new Error("WAREHOUSE_LOCATION_PARENT_SELF");
  }
  return {
    contractVersion: "0.1.0",
    locationId,
    warehouseId: required(
      value.warehouseId,
      "WAREHOUSE_LOCATION_WAREHOUSE_REQUIRED"
    ),
    ...(parentLocationId ? { parentLocationId } : {}),
    code: required(value.code, "WAREHOUSE_LOCATION_CODE_REQUIRED"),
    displayName: required(
      value.displayName,
      "WAREHOUSE_LOCATION_DISPLAY_NAME_REQUIRED"
    ),
    locationKind: value.locationKind,
    ...(optional(value.description)
      ? { description: optional(value.description) }
      : {})
  };
}

function payloadOf(
  location: WarehouseLocationV010
): EnterpriseResourceJsonV010 {
  return JSON.parse(JSON.stringify(location)) as EnterpriseResourceJsonV010;
}

function fromPayload(
  payload: EnterpriseResourceJsonV010 | undefined
): WarehouseLocationV010 {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("WAREHOUSE_LOCATION_RESOURCE_PAYLOAD_INVALID");
  }
  return assertWarehouseLocationV010(
    payload as unknown as WarehouseLocationV010
  );
}

function locationAddress(contextId: string, locationId: string) {
  return {
    contextId: required(contextId, "WAREHOUSE_LOCATION_CONTEXT_REQUIRED"),
    namespace: WAREHOUSE_NAMESPACE_V010,
    collectionId: WAREHOUSE_LOCATION_COLLECTION_V010,
    resourceType: WAREHOUSE_LOCATION_RESOURCE_TYPE_V010,
    resourceId: required(locationId, "WAREHOUSE_LOCATION_ID_REQUIRED")
  };
}

function warehouseActive(
  resources: EnterpriseResourceRepositoryV010,
  contextId: string,
  warehouseId: string
): boolean {
  const warehouse = resources.get({
    contextId,
    namespace: WAREHOUSE_NAMESPACE_V010,
    collectionId: WAREHOUSE_COLLECTION_V010,
    resourceType: WAREHOUSE_RESOURCE_TYPE_V010,
    resourceId: warehouseId
  });
  return Boolean(warehouse && warehouse.lifecycleState === "ACTIVE");
}

function activeLocation(
  resources: EnterpriseResourceRepositoryV010,
  contextId: string,
  locationId: string
): WarehouseLocationV010 | undefined {
  const resource = resources.get(locationAddress(contextId, locationId));
  if (!resource || resource.lifecycleState !== "ACTIVE") return undefined;
  return fromPayload(resource.payload);
}

function assertNoCycle(input: {
  resources: EnterpriseResourceRepositoryV010;
  contextId: string;
  location: WarehouseLocationV010;
}): void {
  let currentId = input.location.parentLocationId;
  const visited = new Set<string>([input.location.locationId]);
  while (currentId) {
    if (visited.has(currentId)) {
      throw new Error("WAREHOUSE_LOCATION_HIERARCHY_CYCLE");
    }
    visited.add(currentId);
    const current = activeLocation(
      input.resources,
      input.contextId,
      currentId
    );
    if (!current) {
      throw new Error("WAREHOUSE_LOCATION_PARENT_NOT_FOUND");
    }
    if (current.warehouseId !== input.location.warehouseId) {
      throw new Error("WAREHOUSE_LOCATION_PARENT_WAREHOUSE_MISMATCH");
    }
    currentId = current.parentLocationId;
  }
}

export function createWarehouseLocationRepositoryV010(
  resources: EnterpriseResourceRepositoryV010
): WarehouseLocationRepositoryV010 {
  return {
    list(contextId, warehouseId) {
      const normalizedContext = required(
        contextId,
        "WAREHOUSE_LOCATION_CONTEXT_REQUIRED"
      );
      const normalizedWarehouse = required(
        warehouseId,
        "WAREHOUSE_LOCATION_WAREHOUSE_REQUIRED"
      );
      return resources.list({
        contextId: normalizedContext,
        namespace: WAREHOUSE_NAMESPACE_V010,
        collectionId: WAREHOUSE_LOCATION_COLLECTION_V010,
        resourceType: WAREHOUSE_LOCATION_RESOURCE_TYPE_V010,
        lifecycleState: "ACTIVE"
      })
        .map(resource => fromPayload(resource.payload))
        .filter(location => location.warehouseId === normalizedWarehouse)
        .sort((a, b) =>
          (a.parentLocationId ?? "").localeCompare(b.parentLocationId ?? "")
          || a.code.localeCompare(b.code)
          || a.locationId.localeCompare(b.locationId)
        );
    },

    listChildren(contextId, warehouseId, parentLocationId) {
      const parent = optional(parentLocationId);
      return this.list(contextId, warehouseId)
        .filter(location =>
          (location.parentLocationId ?? undefined) === parent
        );
    },

    get(contextId, locationId) {
      return activeLocation(resources, contextId, locationId);
    },

    save(input) {
      const contextId = required(
        input.contextId,
        "WAREHOUSE_LOCATION_CONTEXT_REQUIRED"
      );
      const location = assertWarehouseLocationV010(input.location);

      if (!warehouseActive(
        resources,
        contextId,
        location.warehouseId
      )) {
        throw new Error("WAREHOUSE_LOCATION_WAREHOUSE_NOT_FOUND");
      }

      const address = locationAddress(contextId, location.locationId);
      const existingResource = resources.get(address);
      if (existingResource?.lifecycleState === "ARCHIVED") {
        throw new Error("WAREHOUSE_LOCATION_ARCHIVED");
      }
      if (existingResource) {
        const existing = fromPayload(existingResource.payload);
        if (existing.warehouseId !== location.warehouseId) {
          throw new Error("WAREHOUSE_LOCATION_WAREHOUSE_IMMUTABLE");
        }
      }

      if (location.parentLocationId) {
        const parent = activeLocation(
          resources,
          contextId,
          location.parentLocationId
        );
        if (!parent) throw new Error("WAREHOUSE_LOCATION_PARENT_NOT_FOUND");
        if (parent.warehouseId !== location.warehouseId) {
          throw new Error("WAREHOUSE_LOCATION_PARENT_WAREHOUSE_MISMATCH");
        }
      }
      assertNoCycle({ resources, contextId, location });

      const siblingCode = resources.list({
        contextId,
        namespace: WAREHOUSE_NAMESPACE_V010,
        collectionId: WAREHOUSE_LOCATION_COLLECTION_V010,
        resourceType: WAREHOUSE_LOCATION_RESOURCE_TYPE_V010
      })
        .map(resource => fromPayload(resource.payload))
        .find(candidate =>
          candidate.locationId !== location.locationId
          && candidate.warehouseId === location.warehouseId
          && (candidate.parentLocationId ?? undefined)
            === (location.parentLocationId ?? undefined)
          && candidate.code.toLocaleLowerCase()
            === location.code.toLocaleLowerCase()
        );
      if (siblingCode) {
        throw new Error("WAREHOUSE_LOCATION_SIBLING_CODE_DUPLICATE");
      }

      const saved = resources.put({
        contextId,
        namespace: WAREHOUSE_NAMESPACE_V010,
        collectionId: WAREHOUSE_LOCATION_COLLECTION_V010,
        resourceType: WAREHOUSE_LOCATION_RESOURCE_TYPE_V010,
        resourceId: location.locationId,
        schemaRef: WAREHOUSE_LOCATION_SCHEMA_V010,
        ownerPackageId: "evo-warehouse",
        storageKind: "DOCUMENT",
        payload: payloadOf(location),
        metadata: {
          warehouseId: location.warehouseId,
          parentLocationId: location.parentLocationId ?? "",
          code: location.code,
          displayName: location.displayName,
          locationKind: location.locationKind
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return fromPayload(saved.payload);
    },

    archive(input) {
      const contextId = required(
        input.contextId,
        "WAREHOUSE_LOCATION_CONTEXT_REQUIRED"
      );
      const current = this.get(contextId, input.locationId);
      if (!current) throw new Error("WAREHOUSE_LOCATION_NOT_FOUND");
      const hasActiveChildren = this.listChildren(
        contextId,
        current.warehouseId,
        current.locationId
      ).length > 0;
      if (hasActiveChildren) {
        throw new Error("WAREHOUSE_LOCATION_HAS_ACTIVE_CHILDREN");
      }
      resources.archive({
        address: locationAddress(contextId, current.locationId),
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return current;
    }
  };
}
