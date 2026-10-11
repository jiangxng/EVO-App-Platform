import type {
  EnterpriseResourceJsonV010,
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import {
  assertObjectExtensionValueSetV010,
  type ObjectExtensionValueSetV010
} from "../../contracts/foundation-object/extension-value.js";

export const OBJECT_EXTENSION_VALUE_COLLECTION_V010 =
  "values" as const;
export const OBJECT_EXTENSION_VALUE_RESOURCE_TYPE_V010 =
  "object-extension.values" as const;
export const OBJECT_EXTENSION_VALUE_SCHEMA_V010 =
  "evo.object-extension.values/0.1.0" as const;

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function valueResourceId(
  value: ObjectExtensionValueSetV010
): string {
  return [
    value.targetRef.objectType,
    value.targetRef.objectId,
    value.targetRef.slot,
    value.namespace
  ].map(part => encodeURIComponent(part)).join("~");
}

function payloadOf(
  value: ObjectExtensionValueSetV010
): EnterpriseResourceJsonV010 {
  return JSON.parse(JSON.stringify(value)) as EnterpriseResourceJsonV010;
}

function fromPayload(
  payload: EnterpriseResourceJsonV010 | undefined
): ObjectExtensionValueSetV010 {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("OBJECT_EXTENSION_VALUE_RESOURCE_PAYLOAD_INVALID");
  }
  return assertObjectExtensionValueSetV010(
    payload as unknown as ObjectExtensionValueSetV010
  );
}

export interface ObjectExtensionValueRepositoryV010 {
  get(input: {
    contextId: string;
    objectType: string;
    objectId: string;
    slot: string;
    namespace: string;
  }): ObjectExtensionValueSetV010 | undefined;
  listForObject(input: {
    contextId: string;
    objectType: string;
    objectId: string;
  }): ObjectExtensionValueSetV010[];
  save(input: {
    contextId: string;
    valueSet: ObjectExtensionValueSetV010;
    actorSubjectId: string;
    recordedAt: string;
  }): ObjectExtensionValueSetV010;
  saveMany(input: {
    contextId: string;
    valueSets: ObjectExtensionValueSetV010[];
    actorSubjectId: string;
    recordedAt: string;
  }): ObjectExtensionValueSetV010[];
  archive(input: {
    contextId: string;
    valueSet: ObjectExtensionValueSetV010;
    actorSubjectId: string;
    recordedAt: string;
  }): ObjectExtensionValueSetV010;
}

export function createObjectExtensionValueRepositoryV010(
  resources: EnterpriseResourceRepositoryV010
): ObjectExtensionValueRepositoryV010 {
  return {
    get(input) {
      const valueSet: ObjectExtensionValueSetV010 = {
        contractVersion: "0.1.0",
        targetRef: {
          objectType: required(
            input.objectType,
            "OBJECT_EXTENSION_VALUE_OBJECT_TYPE_REQUIRED"
          ),
          objectId: required(
            input.objectId,
            "OBJECT_EXTENSION_VALUE_OBJECT_ID_REQUIRED"
          ),
          slot: required(
            input.slot,
            "OBJECT_EXTENSION_VALUE_SLOT_REQUIRED"
          )
        },
        namespace: required(
          input.namespace,
          "OBJECT_EXTENSION_VALUE_NAMESPACE_REQUIRED"
        ),
        values: {}
      };
      const resource = resources.get({
        contextId: required(
          input.contextId,
          "OBJECT_EXTENSION_VALUE_CONTEXT_REQUIRED"
        ),
        namespace: "evo.object-extension",
        collectionId: OBJECT_EXTENSION_VALUE_COLLECTION_V010,
        resourceType: OBJECT_EXTENSION_VALUE_RESOURCE_TYPE_V010,
        resourceId: valueResourceId(valueSet)
      });
      if (!resource || resource.lifecycleState !== "ACTIVE") return undefined;
      return fromPayload(resource.payload);
    },

    listForObject(input) {
      const contextId = required(
        input.contextId,
        "OBJECT_EXTENSION_VALUE_CONTEXT_REQUIRED"
      );
      const objectType = required(
        input.objectType,
        "OBJECT_EXTENSION_VALUE_OBJECT_TYPE_REQUIRED"
      );
      const objectId = required(
        input.objectId,
        "OBJECT_EXTENSION_VALUE_OBJECT_ID_REQUIRED"
      );
      return resources.list({
        contextId,
        namespace: "evo.object-extension",
        collectionId: OBJECT_EXTENSION_VALUE_COLLECTION_V010,
        resourceType: OBJECT_EXTENSION_VALUE_RESOURCE_TYPE_V010,
        lifecycleState: "ACTIVE"
      })
        .map(resource => fromPayload(resource.payload))
        .filter(value =>
          value.targetRef.objectType === objectType
          && value.targetRef.objectId === objectId
        )
        .sort((a, b) =>
          a.targetRef.slot.localeCompare(b.targetRef.slot)
          || a.namespace.localeCompare(b.namespace)
        );
    },

    save(input) {
      const valueSet = assertObjectExtensionValueSetV010(input.valueSet);
      const saved = resources.put({
        contextId: required(
          input.contextId,
          "OBJECT_EXTENSION_VALUE_CONTEXT_REQUIRED"
        ),
        namespace: "evo.object-extension",
        collectionId: OBJECT_EXTENSION_VALUE_COLLECTION_V010,
        resourceType: OBJECT_EXTENSION_VALUE_RESOURCE_TYPE_V010,
        resourceId: valueResourceId(valueSet),
        schemaRef: OBJECT_EXTENSION_VALUE_SCHEMA_V010,
        ownerPackageId: "evo-object-extension",
        storageKind: "DOCUMENT",
        payload: payloadOf(valueSet),
        metadata: {
          objectType: valueSet.targetRef.objectType,
          objectId: valueSet.targetRef.objectId,
          slot: valueSet.targetRef.slot,
          extensionNamespace: valueSet.namespace
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return fromPayload(saved.payload);
    },

    saveMany(input) {
      const contextId = required(
        input.contextId,
        "OBJECT_EXTENSION_VALUE_CONTEXT_REQUIRED"
      );
      const valueSets = input.valueSets.map(assertObjectExtensionValueSetV010);
      const seen = new Set<string>();
      for (const valueSet of valueSets) {
        const id = valueResourceId(valueSet);
        if (seen.has(id)) {
          throw new Error("OBJECT_EXTENSION_VALUE_DUPLICATE_IN_BATCH");
        }
        seen.add(id);
      }
      if (!resources.putMany) {
        return valueSets.map(valueSet => this.save({
          contextId,
          valueSet,
          actorSubjectId: input.actorSubjectId,
          recordedAt: input.recordedAt
        }));
      }
      const saved = resources.putMany(valueSets.map(valueSet => ({
        contextId,
        namespace: "evo.object-extension",
        collectionId: OBJECT_EXTENSION_VALUE_COLLECTION_V010,
        resourceType: OBJECT_EXTENSION_VALUE_RESOURCE_TYPE_V010,
        resourceId: valueResourceId(valueSet),
        schemaRef: OBJECT_EXTENSION_VALUE_SCHEMA_V010,
        ownerPackageId: "evo-object-extension",
        storageKind: "DOCUMENT" as const,
        payload: payloadOf(valueSet),
        metadata: {
          objectType: valueSet.targetRef.objectType,
          objectId: valueSet.targetRef.objectId,
          slot: valueSet.targetRef.slot,
          extensionNamespace: valueSet.namespace
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      })));
      return saved.map(resource => fromPayload(resource.payload));
    },

    archive(input) {
      const valueSet = assertObjectExtensionValueSetV010(input.valueSet);
      resources.archive({
        address: {
          contextId: required(
            input.contextId,
            "OBJECT_EXTENSION_VALUE_CONTEXT_REQUIRED"
          ),
          namespace: "evo.object-extension",
          collectionId: OBJECT_EXTENSION_VALUE_COLLECTION_V010,
          resourceType: OBJECT_EXTENSION_VALUE_RESOURCE_TYPE_V010,
          resourceId: valueResourceId(valueSet)
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return valueSet;
    }
  };
}
