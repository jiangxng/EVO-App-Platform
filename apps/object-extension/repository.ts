import type {
  EnterpriseResourceJsonV010,
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import {
  assertObjectExtensionDefinitionV010,
  type ObjectExtensionDefinitionV010
} from "../../contracts/foundation-object/extension.js";

export const OBJECT_EXTENSION_NAMESPACE_V010 =
  "evo.object-extension" as const;
export const OBJECT_EXTENSION_COLLECTION_V010 =
  "definitions" as const;
export const OBJECT_EXTENSION_RESOURCE_TYPE_V010 =
  "object-extension.definition" as const;
export const OBJECT_EXTENSION_SCHEMA_V010 =
  "evo.object-extension.definition/0.1.0" as const;

export interface ObjectExtensionRepositoryV010 {
  list(
    contextId: string,
    targetObjectType?: string
  ): ObjectExtensionDefinitionV010[];
  get(
    contextId: string,
    extensionId: string
  ): ObjectExtensionDefinitionV010 | undefined;
  save(input: {
    contextId: string;
    definition: ObjectExtensionDefinitionV010;
    actorSubjectId: string;
    recordedAt: string;
  }): ObjectExtensionDefinitionV010;
  archive(input: {
    contextId: string;
    extensionId: string;
    actorSubjectId: string;
    recordedAt: string;
  }): ObjectExtensionDefinitionV010;
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function payloadOf(
  definition: ObjectExtensionDefinitionV010
): EnterpriseResourceJsonV010 {
  return JSON.parse(JSON.stringify(definition)) as EnterpriseResourceJsonV010;
}

function definitionFromPayload(
  payload: EnterpriseResourceJsonV010 | undefined
): ObjectExtensionDefinitionV010 {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("OBJECT_EXTENSION_RESOURCE_PAYLOAD_INVALID");
  }
  return assertObjectExtensionDefinitionV010(
    payload as unknown as ObjectExtensionDefinitionV010
  );
}

export function createObjectExtensionRepositoryV010(
  resources: EnterpriseResourceRepositoryV010
): ObjectExtensionRepositoryV010 {
  return {
    list(contextId, targetObjectType) {
      const normalizedContext = required(
        contextId,
        "OBJECT_EXTENSION_CONTEXT_REQUIRED"
      );
      const normalizedTarget = targetObjectType?.trim();
      return resources.list({
        contextId: normalizedContext,
        namespace: OBJECT_EXTENSION_NAMESPACE_V010,
        collectionId: OBJECT_EXTENSION_COLLECTION_V010,
        resourceType: OBJECT_EXTENSION_RESOURCE_TYPE_V010,
        lifecycleState: "ACTIVE"
      })
        .map(resource => definitionFromPayload(resource.payload))
        .filter(definition =>
          !normalizedTarget
          || definition.targetObjectType === normalizedTarget
        )
        .sort((a, b) =>
          a.targetObjectType.localeCompare(b.targetObjectType)
          || a.targetSlot.localeCompare(b.targetSlot)
          || a.order - b.order
          || a.fieldId.localeCompare(b.fieldId)
        );
    },

    get(contextId, extensionId) {
      const resource = resources.get({
        contextId: required(contextId, "OBJECT_EXTENSION_CONTEXT_REQUIRED"),
        namespace: OBJECT_EXTENSION_NAMESPACE_V010,
        collectionId: OBJECT_EXTENSION_COLLECTION_V010,
        resourceType: OBJECT_EXTENSION_RESOURCE_TYPE_V010,
        resourceId: required(extensionId, "OBJECT_EXTENSION_ID_REQUIRED")
      });
      if (!resource || resource.lifecycleState !== "ACTIVE") return undefined;
      return definitionFromPayload(resource.payload);
    },

    save(input) {
      const definition = assertObjectExtensionDefinitionV010(input.definition);
      const duplicate = this.list(input.contextId, definition.targetObjectType)
        .find(existing =>
          existing.extensionId !== definition.extensionId
          && existing.targetSlot === definition.targetSlot
          && existing.fieldId === definition.fieldId
        );
      if (duplicate) {
        throw new Error("OBJECT_EXTENSION_FIELD_DUPLICATE");
      }
      const saved = resources.put({
        contextId: required(
          input.contextId,
          "OBJECT_EXTENSION_CONTEXT_REQUIRED"
        ),
        namespace: OBJECT_EXTENSION_NAMESPACE_V010,
        collectionId: OBJECT_EXTENSION_COLLECTION_V010,
        resourceType: OBJECT_EXTENSION_RESOURCE_TYPE_V010,
        resourceId: definition.extensionId,
        schemaRef: OBJECT_EXTENSION_SCHEMA_V010,
        ownerPackageId: "evo-object-extension",
        storageKind: "DOCUMENT",
        payload: payloadOf(definition),
        metadata: {
          targetObjectType: definition.targetObjectType,
          targetSlot: definition.targetSlot,
          fieldId: definition.fieldId,
          namespace: definition.namespace
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return definitionFromPayload(saved.payload);
    },

    archive(input) {
      const current = this.get(input.contextId, input.extensionId);
      if (!current) throw new Error("OBJECT_EXTENSION_NOT_FOUND");
      resources.archive({
        address: {
          contextId: input.contextId,
          namespace: OBJECT_EXTENSION_NAMESPACE_V010,
          collectionId: OBJECT_EXTENSION_COLLECTION_V010,
          resourceType: OBJECT_EXTENSION_RESOURCE_TYPE_V010,
          resourceId: input.extensionId
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return current;
    }
  };
}
