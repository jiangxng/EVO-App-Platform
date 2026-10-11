import type {
  EnterpriseResourceJsonV010,
  EnterpriseResourceRepositoryV010
} from "../../contracts/enterprise-resource.js";
import {
  assertDataImportJobV010,
  type DataImportJobV010
} from "./types.js";

export const DATA_IMPORT_NAMESPACE_V010 = "evo.data-import" as const;
export const DATA_IMPORT_JOB_COLLECTION_V010 = "jobs" as const;
export const DATA_IMPORT_JOB_RESOURCE_TYPE_V010 =
  "data-import.job" as const;
export const DATA_IMPORT_JOB_SCHEMA_V010 =
  "evo.data-import.job/0.1.0" as const;

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function payloadOf(job: DataImportJobV010): EnterpriseResourceJsonV010 {
  return JSON.parse(JSON.stringify(job)) as EnterpriseResourceJsonV010;
}

function fromPayload(
  payload: EnterpriseResourceJsonV010 | undefined
): DataImportJobV010 {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("DATA_IMPORT_JOB_RESOURCE_PAYLOAD_INVALID");
  }
  return assertDataImportJobV010(
    payload as unknown as DataImportJobV010
  );
}

export interface DataImportRepositoryV010 {
  get(contextId: string, importJobId: string): DataImportJobV010 | undefined;
  list(contextId: string): DataImportJobV010[];
  save(input: {
    contextId: string;
    job: DataImportJobV010;
    actorSubjectId: string;
    recordedAt: string;
  }): DataImportJobV010;
  archive(input: {
    contextId: string;
    importJobId: string;
    actorSubjectId: string;
    recordedAt: string;
  }): DataImportJobV010;
}

export function createDataImportRepositoryV010(
  resources: EnterpriseResourceRepositoryV010
): DataImportRepositoryV010 {
  return {
    get(contextId, importJobId) {
      const resource = resources.get({
        contextId: required(contextId, "DATA_IMPORT_CONTEXT_REQUIRED"),
        namespace: DATA_IMPORT_NAMESPACE_V010,
        collectionId: DATA_IMPORT_JOB_COLLECTION_V010,
        resourceType: DATA_IMPORT_JOB_RESOURCE_TYPE_V010,
        resourceId: required(importJobId, "DATA_IMPORT_JOB_ID_REQUIRED")
      });
      if (!resource || resource.lifecycleState !== "ACTIVE") return undefined;
      return fromPayload(resource.payload);
    },

    list(contextId) {
      return resources.list({
        contextId: required(contextId, "DATA_IMPORT_CONTEXT_REQUIRED"),
        namespace: DATA_IMPORT_NAMESPACE_V010,
        collectionId: DATA_IMPORT_JOB_COLLECTION_V010,
        resourceType: DATA_IMPORT_JOB_RESOURCE_TYPE_V010,
        lifecycleState: "ACTIVE"
      })
        .map(resource => fromPayload(resource.payload))
        .sort((a, b) =>
          b.stagedAt.localeCompare(a.stagedAt)
          || a.importJobId.localeCompare(b.importJobId)
        );
    },

    save(input) {
      const job = assertDataImportJobV010(input.job);
      const saved = resources.put({
        contextId: required(input.contextId, "DATA_IMPORT_CONTEXT_REQUIRED"),
        namespace: DATA_IMPORT_NAMESPACE_V010,
        collectionId: DATA_IMPORT_JOB_COLLECTION_V010,
        resourceType: DATA_IMPORT_JOB_RESOURCE_TYPE_V010,
        resourceId: job.importJobId,
        schemaRef: DATA_IMPORT_JOB_SCHEMA_V010,
        ownerPackageId: "evo-data-import",
        storageKind: "DOCUMENT",
        payload: payloadOf(job),
        metadata: {
          targetId: job.targetId,
          state: job.state,
          sourceKind: job.source.kind,
          rowCount: job.source.rows.length
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return fromPayload(saved.payload);
    },

    archive(input) {
      const current = this.get(input.contextId, input.importJobId);
      if (!current) throw new Error("DATA_IMPORT_JOB_NOT_FOUND");
      resources.archive({
        address: {
          contextId: input.contextId,
          namespace: DATA_IMPORT_NAMESPACE_V010,
          collectionId: DATA_IMPORT_JOB_COLLECTION_V010,
          resourceType: DATA_IMPORT_JOB_RESOURCE_TYPE_V010,
          resourceId: input.importJobId
        },
        actorSubjectId: input.actorSubjectId,
        recordedAt: input.recordedAt
      });
      return current;
    }
  };
}
