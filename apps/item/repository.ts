import type {
  EnterpriseResourceJsonV010,
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import {
  ITEM_RESOURCE_TYPE_V010,
  ITEM_SCHEMA_V010,
  type ItemKindV010
} from "./foundation-object.js";

export const ITEM_NAMESPACE_V010 = "evo.item" as const;
export const ITEM_COLLECTION_V010 = "items" as const;

export interface ItemSubjectV010 {
  contractVersion: "0.1.0";
  itemId: string;
  code: string;
  displayName: string;
  itemKind: ItemKindV010;
  baseUomCode: string;
  description?: string;
}

export interface ItemRepositoryV010 {
  list(contextId: string): ItemSubjectV010[];
  get(contextId: string, itemId: string): ItemSubjectV010 | undefined;
  save(input: {
    contextId: string;
    item: ItemSubjectV010;
    actorSubjectId: string;
    recordedAt: string;
  }): ItemSubjectV010;
  saveMany(input: {
    contextId: string;
    items: ItemSubjectV010[];
    actorSubjectId: string;
    recordedAt: string;
  }): ItemSubjectV010[];
  archive(input: {
    contextId: string;
    itemId: string;
    actorSubjectId: string;
    recordedAt: string;
  }): ItemSubjectV010;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function optional(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function assertItemSubjectV010(
  value: ItemSubjectV010
): ItemSubjectV010 {
  if (value?.contractVersion !== "0.1.0") {
    throw new Error("ITEM_CONTRACT_VERSION_INVALID");
  }
  if (value.itemKind !== "GOODS" && value.itemKind !== "SERVICE") {
    throw new Error("ITEM_KIND_INVALID");
  }
  return {
    contractVersion: "0.1.0",
    itemId: required(value.itemId, "ITEM_ID_REQUIRED"),
    code: required(value.code, "ITEM_CODE_REQUIRED"),
    displayName: required(value.displayName, "ITEM_DISPLAY_NAME_REQUIRED"),
    itemKind: value.itemKind,
    baseUomCode: required(value.baseUomCode, "ITEM_BASE_UOM_REQUIRED"),
    ...(optional(value.description)
      ? { description: optional(value.description) }
      : {})
  };
}

function payloadOf(item: ItemSubjectV010): EnterpriseResourceJsonV010 {
  return JSON.parse(JSON.stringify(item)) as EnterpriseResourceJsonV010;
}

function itemFromPayload(
  payload: EnterpriseResourceJsonV010 | undefined
): ItemSubjectV010 {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("ITEM_RESOURCE_PAYLOAD_INVALID");
  }
  return assertItemSubjectV010(payload as unknown as ItemSubjectV010);
}

function itemAddress(contextId: string, itemId: string) {
  return {
    contextId: required(contextId, "ITEM_CONTEXT_REQUIRED"),
    namespace: ITEM_NAMESPACE_V010,
    collectionId: ITEM_COLLECTION_V010,
    resourceType: ITEM_RESOURCE_TYPE_V010,
    resourceId: required(itemId, "ITEM_ID_REQUIRED")
  };
}

function resourcePutInput(input: {
  contextId: string;
  item: ItemSubjectV010;
  actorSubjectId: string;
  recordedAt: string;
}) {
  return {
    contextId: input.contextId,
    namespace: ITEM_NAMESPACE_V010,
    collectionId: ITEM_COLLECTION_V010,
    resourceType: ITEM_RESOURCE_TYPE_V010,
    resourceId: input.item.itemId,
    schemaRef: ITEM_SCHEMA_V010,
    ownerPackageId: "evo-item",
    storageKind: "DOCUMENT" as const,
    payload: payloadOf(input.item),
    metadata: {
      code: input.item.code,
      displayName: input.item.displayName,
      itemKind: input.item.itemKind,
      baseUomCode: input.item.baseUomCode
    },
    actorSubjectId: input.actorSubjectId,
    recordedAt: input.recordedAt
  };
}

export function createItemRepositoryV010(
  resources: EnterpriseResourceRepositoryV010
): ItemRepositoryV010 {
  return {
    list(contextId) {
      return resources.list({
        contextId: required(contextId, "ITEM_CONTEXT_REQUIRED"),
        namespace: ITEM_NAMESPACE_V010,
        collectionId: ITEM_COLLECTION_V010,
        resourceType: ITEM_RESOURCE_TYPE_V010,
        lifecycleState: "ACTIVE"
      })
        .map(resource => itemFromPayload(resource.payload))
        .sort((a, b) =>
          a.displayName.localeCompare(b.displayName)
          || a.code.localeCompare(b.code)
          || a.itemId.localeCompare(b.itemId)
        );
    },

    get(contextId, itemId) {
      const resource = resources.get(itemAddress(contextId, itemId));
      if (!resource || resource.lifecycleState !== "ACTIVE") return undefined;
      return itemFromPayload(resource.payload);
    },

    save(input) {
      const saved = this.saveMany({
        contextId: input.contextId,
        items: [input.item],
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return saved[0];
    },

    saveMany(input) {
      const contextId = required(input.contextId, "ITEM_CONTEXT_REQUIRED");
      const items = input.items.map(assertItemSubjectV010);
      if (items.length === 0) return [];

      const existingResources = resources.list({
        contextId,
        namespace: ITEM_NAMESPACE_V010,
        collectionId: ITEM_COLLECTION_V010,
        resourceType: ITEM_RESOURCE_TYPE_V010
      });
      const existingById = new Map(
        existingResources.map(resource => [
          resource.resourceId,
          {
            lifecycleState: resource.lifecycleState,
            item: itemFromPayload(resource.payload)
          }
        ])
      );
      const codeOwners = new Map(
        existingResources.map(resource => {
          const existing = itemFromPayload(resource.payload);
          return [existing.code.toLocaleLowerCase(), existing.itemId] as const;
        })
      );
      const batchIds = new Set<string>();
      const batchCodes = new Map<string, string>();

      for (const item of items) {
        if (batchIds.has(item.itemId)) {
          throw new Error("ITEM_ID_DUPLICATE_IN_BATCH");
        }
        batchIds.add(item.itemId);

        const existingIdentity = existingById.get(item.itemId);
        if (existingIdentity?.lifecycleState === "ARCHIVED") {
          throw new Error("ITEM_ARCHIVED");
        }

        const code = item.code.toLocaleLowerCase();
        const existingOwner = codeOwners.get(code);
        if (existingOwner && existingOwner !== item.itemId) {
          throw new Error("ITEM_CODE_DUPLICATE");
        }
        const batchOwner = batchCodes.get(code);
        if (batchOwner && batchOwner !== item.itemId) {
          throw new Error("ITEM_CODE_DUPLICATE");
        }
        batchCodes.set(code, item.itemId);
      }

      const inputs = items.map(item => resourcePutInput({
        contextId,
        item,
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      }));
      const saved = resources.putMany
        ? resources.putMany(inputs)
        : inputs.map(resource => resources.put(resource));
      return saved.map(resource => itemFromPayload(resource.payload));
    },

    archive(input) {
      const current = this.get(input.contextId, input.itemId);
      if (!current) throw new Error("ITEM_NOT_FOUND");
      resources.archive({
        address: itemAddress(input.contextId, input.itemId),
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return current;
    }
  };
}
