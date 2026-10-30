import type { EnterpriseResourceJsonV010, EnterpriseResourceRepositoryV010 } from "../../contracts/enterprise-resource.js";
import { assertObjectExtensionDefinitionV010, type ObjectExtensionDefinitionV010 } from "../../contracts/foundation-object/extension.js";
import type { FoundationObjectManagedReferenceV010 } from "../../contracts/foundation-object/schema.js";
import type { DataImportJobV010 } from "../data-import/types.js";
import { dataImportMappingRouteV010 } from "../data-import/constants.js";
import { createHash } from "node:crypto";
import { batchReviewSourceRevisionV010 } from "./batch-page.js";
import { createObjectExtensionRepositoryV010, OBJECT_EXTENSION_COLLECTION_V010, OBJECT_EXTENSION_NAMESPACE_V010, OBJECT_EXTENSION_RESOURCE_TYPE_V010, OBJECT_EXTENSION_SCHEMA_V010 } from "./repository.js";

const COLLECTION = "model-drafts";
const HISTORY = "model-history";
const RESOURCE_TYPE = "object-extension.model-publication";
const SCHEMA = "evo.object-extension.model-publication/0.1.0";
const PACKAGE = "evo-object-extension";

function required(value: string, error: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(error);
  return value.trim();
}

export interface ObjectExtensionModelDraftV010 {
  contractVersion: "0.1.0";
  contextId: string;
  modelDraftId: string;
  importJobId: string;
  sourceColumn: string;
  sourceRevision: string;
  version: number;
  state: "DRAFT" | "PUBLISHED";
  definition: ObjectExtensionDefinitionV010;
  actorSubjectId: string;
  recordedAt: string;
}
export interface ObjectExtensionModelCandidateV010 {
  sourceColumn: string;
  status: "REQUIRES_HUMAN_REVIEW";
  suggestedValueType: "STRING";
}

export interface ObjectExtensionModelPublicationV010 {
  propose(contextId: string, importJobId: string): {
    importJobId: string;
    sourceRevision: string;
    targetId: string;
    columns: ObjectExtensionModelCandidateV010[];
  };
  get(contextId: string, modelDraftId: string): ObjectExtensionModelDraftV010 | undefined;
  saveDraft(input: {
    contextId: string;
    importJobId: string;
    sourceColumn: string;
    sourceRevision: string;
    definition: ObjectExtensionDefinitionV010;
    expectedVersion: number;
    actorSubjectId: string;
    recordedAt: string;
  }): ObjectExtensionModelDraftV010;
  publish(input: {
    contextId: string;
    modelDraftId: string;
    expectedVersion: number;
    actorSubjectId: string;
    actorType: "HUMAN" | "AI";
    recordedAt: string;
  }): { published: ObjectExtensionModelDraftV010; navigateTo: string };
}

export function createObjectExtensionModelPublicationV010(input: {
  resources: EnterpriseResourceRepositoryV010;
  getImportJob(contextId: string, importJobId: string): DataImportJobV010 | undefined;
  /** The Host composes only activated, authorized owners in the same Enterprise Context. */
  isPublishedReference(contextId: string, reference: FoundationObjectManagedReferenceV010): boolean;
  assertAvailable?(): void;
}): ObjectExtensionModelPublicationV010 {
  const { resources } = input;
  function address(contextId: string, collectionId: string, modelDraftId: string) {
    return {
      contextId: required(contextId, "MODEL_CONTEXT_REQUIRED"),
      namespace: OBJECT_EXTENSION_NAMESPACE_V010,
      collectionId, resourceType: RESOURCE_TYPE,
      resourceId: required(modelDraftId, "MODEL_DRAFT_ID_REQUIRED")
    };
  }
  function modelDraftId(importJobId: string, column: string) {
    // Stable identity for (source job, source column), avoiding display labels.
    return encodeURIComponent(importJobId) + "::" + encodeURIComponent(column);
  }
  function parse(payload: EnterpriseResourceJsonV010 | undefined): ObjectExtensionModelDraftV010 {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("MODEL_DRAFT_PAYLOAD_INVALID");
    }
    const value = payload as unknown as ObjectExtensionModelDraftV010;
    if (value.contractVersion !== "0.1.0" || !Number.isSafeInteger(value.version)
      || value.version < 1 || !["DRAFT","PUBLISHED"].includes(value.state)) {
      throw new Error("MODEL_DRAFT_PAYLOAD_INVALID");
    }
    return { ...value, definition: assertObjectExtensionDefinitionV010(value.definition) };
  }
  function job(contextId: string, importJobId: string): DataImportJobV010 {
    input.assertAvailable?.();
    const existing = input.getImportJob(contextId, importJobId);
    if (!existing) throw new Error("MODEL_IMPORT_JOB_NOT_FOUND");
    if (existing.state === "COMMITTED" || existing.state === "COMMITTED_WITH_ERRORS") {
      throw new Error("MODEL_IMPORT_JOB_ALREADY_COMMITTED");
    }
    return existing;
  }
  function revision(current: DataImportJobV010): string {
    // Existing BEX review revision pins column choices; MD-02 additionally
    // pins original file rows, workbook identity, target and staged source.
    const original = createHash("sha256").update(JSON.stringify({
      targetId: current.targetId,
      targetParameters: current.targetParameters,
      source: current.source,
      stagedAt: current.stagedAt
    })).digest("hex").slice(0, 20);
    return batchReviewSourceRevisionV010(current) + "::" + original;
  }
  function assertColumn(current: DataImportJobV010, sourceColumn: string): void {
    if (!current.source.headers.includes(sourceColumn)
      || current.mapping.some(item => item.sourceColumn === sourceColumn)
      || current.ignoredSourceColumns?.includes(sourceColumn)) {
      throw new Error("MODEL_SOURCE_COLUMN_NOT_AVAILABLE");
    }
  }
  function persisted(record: ObjectExtensionModelDraftV010, collectionId: string) {
    resources.put({
      ...address(record.contextId, collectionId, collectionId === HISTORY
        ? record.modelDraftId + "::" + record.version : record.modelDraftId),
      ownerPackageId: PACKAGE, schemaRef: SCHEMA, storageKind: "DOCUMENT",
      payload: JSON.parse(JSON.stringify(record)) as EnterpriseResourceJsonV010,
      actorSubjectId: record.actorSubjectId, recordedAt: record.recordedAt
    });
  }
  function atomic<T>(work: () => T): T {
    if (!resources.transaction) throw new Error("MODEL_ATOMIC_RESOURCE_REQUIRED");
    return resources.transaction(work);
  }
  const read = (contextId: string, id: string) => {
    const resource = resources.get(address(contextId, COLLECTION, id));
    return resource?.lifecycleState === "ACTIVE" ? parse(resource.payload) : undefined;
  };
  return {
    propose(contextId, importJobId) {
      const current = job(contextId, importJobId);
      const used = new Set([
        ...current.mapping.map(item => item.sourceColumn).filter((x): x is string => !!x),
        ...(current.ignoredSourceColumns ?? [])
      ]);
      return {
        importJobId: current.importJobId,
        sourceRevision: revision(current),
        targetId: current.targetId,
        columns: current.source.headers.filter(column => !used.has(column))
          .map(sourceColumn => ({
            sourceColumn,
            status: "REQUIRES_HUMAN_REVIEW" as const,
            suggestedValueType: "STRING" as const
          }))
      };
    },
    get: read,
    saveDraft(request) {
      return atomic(() => {
        input.assertAvailable?.();
        const contextId = required(request.contextId, "MODEL_CONTEXT_REQUIRED");
        const column = required(request.sourceColumn, "MODEL_SOURCE_COLUMN_REQUIRED");
        const current = job(contextId, required(request.importJobId, "MODEL_IMPORT_JOB_REQUIRED"));
        assertColumn(current, column);
        if (revision(current) !== request.sourceRevision) {
          throw new Error("MODEL_SOURCE_REVISION_STALE");
        }
        const definition = assertObjectExtensionDefinitionV010(request.definition);
        if (definition.targetObjectType !== current.targetId || !definition.importable
          || !definition.surfaces.includes("IMPORT")) {
          throw new Error("MODEL_DEFINITION_TARGET_MISMATCH");
        }
        const id = modelDraftId(current.importJobId, column);
        const previous = read(contextId, id);
        if (previous?.state === "PUBLISHED") throw new Error("MODEL_ALREADY_PUBLISHED");
        if ((previous?.version ?? 0) !== request.expectedVersion) {
          if (previous?.state === "DRAFT"
            && previous.version === request.expectedVersion + 1
            && previous.sourceRevision === request.sourceRevision
            && JSON.stringify(previous.definition) === JSON.stringify(definition)) return previous;
          throw new Error("MODEL_VERSION_CONFLICT");
        }
        if (previous?.state === "DRAFT" && previous.sourceRevision === request.sourceRevision
          && JSON.stringify(previous.definition) === JSON.stringify(definition)) return previous;
        const record: ObjectExtensionModelDraftV010 = {
          contractVersion: "0.1.0", contextId, modelDraftId: id,
          importJobId: current.importJobId, sourceColumn: column,
          sourceRevision: request.sourceRevision, version: (previous?.version ?? 0) + 1,
          state: "DRAFT", definition,
          actorSubjectId: required(request.actorSubjectId, "MODEL_ACTOR_REQUIRED"),
          recordedAt: request.recordedAt
        };
        persisted(record, COLLECTION);
        persisted(record, HISTORY);
        return record;
      });
    },
    publish(request) {
      return atomic(() => {
        input.assertAvailable?.();
        if (request.actorType !== "HUMAN") throw new Error("MODEL_PUBLISH_HUMAN_REQUIRED");
        const current = read(request.contextId, request.modelDraftId);
        if (!current) throw new Error("MODEL_DRAFT_NOT_FOUND");
        if (current.version !== request.expectedVersion) throw new Error("MODEL_VERSION_CONFLICT");
        const staged = job(current.contextId, current.importJobId);
        assertColumn(staged, current.sourceColumn);
        if (current.sourceRevision !== revision(staged)) {
          throw new Error("MODEL_SOURCE_REVISION_STALE");
        }
        const existing = createObjectExtensionRepositoryV010(resources);
        const prior = existing.get(current.contextId, current.definition.extensionId);
        if (current.state === "PUBLISHED") {
          if (!prior || JSON.stringify(prior) !== JSON.stringify(current.definition)) {
            throw new Error("MODEL_PUBLISHED_DEFINITION_MISMATCH");
          }
          return { published: current, navigateTo: dataImportMappingRouteV010(current.importJobId) };
        }
        if (prior || existing.list(current.contextId, current.definition.targetObjectType)
          .some(item => item.targetSlot === current.definition.targetSlot
            && item.fieldId === current.definition.fieldId)) {
          throw new Error("MODEL_FIELD_ALREADY_EXISTS");
        }
        if (current.definition.reference
          && !input.isPublishedReference(current.contextId, current.definition.reference)) {
          throw new Error("MODEL_REFERENCE_NOT_PUBLISHED");
        }
        // Only this explicitly reviewed, active-Enterprise transaction may
        // materialize a REFERENCE into the existing Object Extension collection.
        resources.put({
          contextId: current.contextId,
          namespace: OBJECT_EXTENSION_NAMESPACE_V010,
          collectionId: OBJECT_EXTENSION_COLLECTION_V010,
          resourceType: OBJECT_EXTENSION_RESOURCE_TYPE_V010,
          resourceId: current.definition.extensionId,
          schemaRef: OBJECT_EXTENSION_SCHEMA_V010,
          ownerPackageId: PACKAGE, storageKind: "DOCUMENT",
          payload: JSON.parse(JSON.stringify(current.definition)) as EnterpriseResourceJsonV010,
          metadata: {
            targetObjectType: current.definition.targetObjectType,
            targetSlot: current.definition.targetSlot,
            fieldId: current.definition.fieldId,
            namespace: current.definition.namespace
          },
          actorSubjectId: required(request.actorSubjectId, "MODEL_ACTOR_REQUIRED"),
          recordedAt: request.recordedAt
        });
        const published: ObjectExtensionModelDraftV010 = {
          ...current, state: "PUBLISHED",
          actorSubjectId: request.actorSubjectId, recordedAt: request.recordedAt
        };
        persisted(published, COLLECTION);
        persisted(published, HISTORY);
        return { published, navigateTo: dataImportMappingRouteV010(current.importJobId) };
      });
    }
  };
}
