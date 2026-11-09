import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { dirname, resolve } from "node:path";
import type {
  EnterpriseResourceAddressV010,
  EnterpriseResourceConditionalConsistencyV010,
  EnterpriseResourceListInputV010,
  EnterpriseResourcePutInputV010,
  EnterpriseResourceRepositoryV010,
  EnterpriseResourceV010
} from "../../contracts/enterprise-resource.js";

interface EnterpriseResourceStoreSnapshotV010 {
  contractVersion: "0.1.0";
  resources: EnterpriseResourceV010[];
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function timestamp(value: string, code: string): string {
  if (!Number.isFinite(Date.parse(value))) throw new Error(code);
  return value;
}

function addressKey(address: EnterpriseResourceAddressV010): string {
  return [
    address.contextId,
    address.namespace,
    address.collectionId,
    address.resourceType,
    address.resourceId
  ].map(value => required(value, "ENTERPRISE_RESOURCE_ADDRESS_INVALID")).join("|");
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function validateResource(value: EnterpriseResourceV010): EnterpriseResourceV010 {
  if (value.contractVersion !== "0.1.0") {
    throw new Error("ENTERPRISE_RESOURCE_CONTRACT_VERSION_INVALID");
  }
  const resource: EnterpriseResourceV010 = {
    ...clone(value),
    contextId: required(value.contextId, "ENTERPRISE_RESOURCE_CONTEXT_REQUIRED"),
    namespace: required(value.namespace, "ENTERPRISE_RESOURCE_NAMESPACE_REQUIRED"),
    collectionId: required(value.collectionId, "ENTERPRISE_RESOURCE_COLLECTION_REQUIRED"),
    resourceType: required(value.resourceType, "ENTERPRISE_RESOURCE_TYPE_REQUIRED"),
    resourceId: required(value.resourceId, "ENTERPRISE_RESOURCE_ID_REQUIRED"),
    schemaRef: required(value.schemaRef, "ENTERPRISE_RESOURCE_SCHEMA_REQUIRED"),
    lifecycleState: value.lifecycleState,
    storageKind: value.storageKind,
    createdAt: timestamp(value.createdAt, "ENTERPRISE_RESOURCE_CREATED_AT_INVALID"),
    createdBySubjectId: required(
      value.createdBySubjectId,
      "ENTERPRISE_RESOURCE_CREATED_BY_REQUIRED"
    ),
    updatedAt: timestamp(value.updatedAt, "ENTERPRISE_RESOURCE_UPDATED_AT_INVALID"),
    updatedBySubjectId: required(
      value.updatedBySubjectId,
      "ENTERPRISE_RESOURCE_UPDATED_BY_REQUIRED"
    )
  };
  if (
    resource.revision !== undefined
    && (!Number.isSafeInteger(resource.revision) || resource.revision < 0)
  ) {
    throw new Error("ENTERPRISE_RESOURCE_REVISION_INVALID");
  }
  if (!["ACTIVE", "ARCHIVED"].includes(resource.lifecycleState)) {
    throw new Error("ENTERPRISE_RESOURCE_LIFECYCLE_INVALID");
  }
  if (!["DOCUMENT", "TABLE", "OBJECT", "REFERENCE"].includes(resource.storageKind)) {
    throw new Error("ENTERPRISE_RESOURCE_STORAGE_KIND_INVALID");
  }
  if (
    resource.storageKind === "DOCUMENT"
    && resource.payload === undefined
    && resource.payloadRef === undefined
  ) {
    throw new Error("ENTERPRISE_RESOURCE_DOCUMENT_PAYLOAD_REQUIRED");
  }
  return resource;
}

function validateSnapshot(
  snapshot: EnterpriseResourceStoreSnapshotV010
): EnterpriseResourceStoreSnapshotV010 {
  if (
    snapshot?.contractVersion !== "0.1.0"
    || !Array.isArray(snapshot.resources)
  ) {
    throw new Error("ENTERPRISE_RESOURCE_STORE_SNAPSHOT_INVALID");
  }
  const seen = new Set<string>();
  const resources = snapshot.resources.map(validateResource);
  for (const resource of resources) {
    const key = addressKey(resource);
    if (seen.has(key)) throw new Error("ENTERPRISE_RESOURCE_DUPLICATE");
    seen.add(key);
  }
  return { contractVersion: "0.1.0", resources };
}

function createRepository(
  read: () => EnterpriseResourceStoreSnapshotV010,
  write: (snapshot: EnterpriseResourceStoreSnapshotV010) => void,
  runExclusive: <T>(work: () => T) => T = work => work(),
  conditionalWriteConsistency: EnterpriseResourceConditionalConsistencyV010 = "PROCESS_LOCAL"
): EnterpriseResourceRepositoryV010 {
  let transactionSnapshot: EnterpriseResourceStoreSnapshotV010 | undefined;
  let transactionDepth = 0;

  const readCurrent = (): EnterpriseResourceStoreSnapshotV010 =>
    transactionSnapshot ?? read();

  const writeCurrent = (snapshot: EnterpriseResourceStoreSnapshotV010): void => {
    const valid = validateSnapshot(clone(snapshot));
    if (transactionSnapshot) {
      transactionSnapshot = clone(snapshot);
      return;
    }
    write(valid);
  };

  // Reuse the enclosing transaction's exclusive scope, never acquire a nested file lock.
  const exclusive = <T>(work: () => T): T =>
    transactionSnapshot ? work() : runExclusive(work);

  return {
    conditionalWriteConsistency,
    transaction<T>(work: () => T): T {
      if (transactionSnapshot) {
        transactionDepth += 1;
        try {
          return work();
        } finally {
          transactionDepth -= 1;
        }
      }
      return runExclusive(() => {
        transactionSnapshot = validateSnapshot(clone(read()));
        transactionDepth = 1;
        try {
          const result = work();
          const committed = validateSnapshot(clone(transactionSnapshot));
          transactionDepth = 0;
          transactionSnapshot = undefined;
          write(committed);
          return result;
        } catch (error) {
          transactionDepth = 0;
          transactionSnapshot = undefined;
          throw error;
        }
      });
    },
    get(address) {
      const key = addressKey(address);
      const resource = readCurrent().resources.find(item => addressKey(item) === key);
      return resource ? clone(resource) : undefined;
    },

    list(input: EnterpriseResourceListInputV010) {
      const contextId = required(
        input.contextId,
        "ENTERPRISE_RESOURCE_CONTEXT_REQUIRED"
      );
      return readCurrent().resources
        .filter(item =>
          item.contextId === contextId
          && (input.namespace === undefined || item.namespace === input.namespace)
          && (
            input.collectionId === undefined
            || item.collectionId === input.collectionId
          )
          && (
            input.resourceType === undefined
            || item.resourceType === input.resourceType
          )
          && (
            input.lifecycleState === undefined
            || item.lifecycleState === input.lifecycleState
          )
        )
        .sort((a, b) =>
          a.namespace.localeCompare(b.namespace)
          || a.collectionId.localeCompare(b.collectionId)
          || a.resourceType.localeCompare(b.resourceType)
          || a.resourceId.localeCompare(b.resourceId)
        )
        .map(clone);
    },

    put(input: EnterpriseResourcePutInputV010) {
      return exclusive(() => {
      const current = readCurrent();
      const key = addressKey(input);
      const previous = current.resources.find(item => addressKey(item) === key);
      if (previous?.revision !== undefined) {
        throw new Error("ENTERPRISE_RESOURCE_CONDITIONAL_WRITE_REQUIRED");
      }
      const recordedAt = timestamp(
        input.recordedAt,
        "ENTERPRISE_RESOURCE_RECORDED_AT_INVALID"
      );
      const actorSubjectId = required(
        input.actorSubjectId,
        "ENTERPRISE_RESOURCE_ACTOR_REQUIRED"
      );
      const next = validateResource({
        contractVersion: "0.1.0",
        contextId: required(input.contextId, "ENTERPRISE_RESOURCE_CONTEXT_REQUIRED"),
        namespace: required(input.namespace, "ENTERPRISE_RESOURCE_NAMESPACE_REQUIRED"),
        collectionId: required(
          input.collectionId,
          "ENTERPRISE_RESOURCE_COLLECTION_REQUIRED"
        ),
        resourceType: required(input.resourceType, "ENTERPRISE_RESOURCE_TYPE_REQUIRED"),
        resourceId: required(input.resourceId, "ENTERPRISE_RESOURCE_ID_REQUIRED"),
        schemaRef: required(input.schemaRef, "ENTERPRISE_RESOURCE_SCHEMA_REQUIRED"),
        ...(input.ownerPackageId?.trim()
          ? { ownerPackageId: input.ownerPackageId.trim() }
          : {}),
        storageKind: input.storageKind ?? "DOCUMENT",
        ...(input.payload !== undefined ? { payload: clone(input.payload) } : {}),
        ...(input.payloadRef?.trim() ? { payloadRef: input.payloadRef.trim() } : {}),
        ...(input.metadata ? { metadata: clone(input.metadata) } : {}),
        lifecycleState: "ACTIVE",
        createdAt: previous?.createdAt ?? recordedAt,
        createdBySubjectId: previous?.createdBySubjectId ?? actorSubjectId,
        updatedAt: recordedAt,
        updatedBySubjectId: actorSubjectId
      });
      writeCurrent({
        contractVersion: "0.1.0",
        resources: [
          ...current.resources.filter(item => addressKey(item) !== key),
          next
        ]
      });
      return clone(next);
      });
    },

    putMany(inputs: EnterpriseResourcePutInputV010[]) {
      if (inputs.length === 0) return [];
      return exclusive(() => {
      const current = readCurrent();
      const byKey = new Map(
        current.resources.map(resource => [addressKey(resource), resource])
      );
      const results: EnterpriseResourceV010[] = [];
      const inputKeys = new Set<string>();

      for (const input of inputs) {
        const key = addressKey(input);
        if (inputKeys.has(key)) {
          throw new Error("ENTERPRISE_RESOURCE_BATCH_DUPLICATE_ADDRESS");
        }
        inputKeys.add(key);
        const previous = byKey.get(key);
        if (previous?.revision !== undefined) {
          throw new Error("ENTERPRISE_RESOURCE_CONDITIONAL_WRITE_REQUIRED");
        }
        const recordedAt = timestamp(
          input.recordedAt,
          "ENTERPRISE_RESOURCE_RECORDED_AT_INVALID"
        );
        const actorSubjectId = required(
          input.actorSubjectId,
          "ENTERPRISE_RESOURCE_ACTOR_REQUIRED"
        );
        const next = validateResource({
          contractVersion: "0.1.0",
          contextId: required(input.contextId, "ENTERPRISE_RESOURCE_CONTEXT_REQUIRED"),
          namespace: required(input.namespace, "ENTERPRISE_RESOURCE_NAMESPACE_REQUIRED"),
          collectionId: required(
            input.collectionId,
            "ENTERPRISE_RESOURCE_COLLECTION_REQUIRED"
          ),
          resourceType: required(input.resourceType, "ENTERPRISE_RESOURCE_TYPE_REQUIRED"),
          resourceId: required(input.resourceId, "ENTERPRISE_RESOURCE_ID_REQUIRED"),
          schemaRef: required(input.schemaRef, "ENTERPRISE_RESOURCE_SCHEMA_REQUIRED"),
          ...(input.ownerPackageId?.trim()
            ? { ownerPackageId: input.ownerPackageId.trim() }
            : {}),
          storageKind: input.storageKind ?? "DOCUMENT",
          ...(input.payload !== undefined ? { payload: clone(input.payload) } : {}),
          ...(input.payloadRef?.trim() ? { payloadRef: input.payloadRef.trim() } : {}),
          ...(input.metadata ? { metadata: clone(input.metadata) } : {}),
          lifecycleState: "ACTIVE",
          createdAt: previous?.createdAt ?? recordedAt,
          createdBySubjectId: previous?.createdBySubjectId ?? actorSubjectId,
          updatedAt: recordedAt,
          updatedBySubjectId: actorSubjectId
        });
        byKey.set(key, next);
        results.push(clone(next));
      }

      writeCurrent({
        contractVersion: "0.1.0",
        resources: [...byKey.values()]
      });
      return results;
      });
    },

    /**
     * Atomically create when missing (expectedRevision=null), or replace one
     * exact version. An archived address still exists and cannot be recreated.
     */
    putIfRevision(input) {
      return exclusive(() => {
        const { expectedRevision } = input;
        if (expectedRevision !== null && (
          !Number.isSafeInteger(expectedRevision) || expectedRevision < 0
        )) throw new Error("ENTERPRISE_RESOURCE_REVISION_INVALID");
        const current = readCurrent();
        const key = addressKey(input);
        const previous = current.resources.find(item => addressKey(item) === key);
        const revision = previous?.revision ?? 0;
        if (previous?.lifecycleState === "ARCHIVED" && expectedRevision !== null) {
          throw new Error("ENTERPRISE_RESOURCE_ALREADY_ARCHIVED");
        }
        if (
          (expectedRevision === null && previous !== undefined)
          || (expectedRevision !== null && (!previous || revision !== expectedRevision))
        ) throw new Error("ENTERPRISE_RESOURCE_REVISION_CONFLICT");
        const recordedAt = timestamp(input.recordedAt, "ENTERPRISE_RESOURCE_RECORDED_AT_INVALID");
        const actorSubjectId = required(input.actorSubjectId, "ENTERPRISE_RESOURCE_ACTOR_REQUIRED");
        const next = validateResource({
          contractVersion: "0.1.0",
          contextId: required(input.contextId, "ENTERPRISE_RESOURCE_CONTEXT_REQUIRED"),
          namespace: required(input.namespace, "ENTERPRISE_RESOURCE_NAMESPACE_REQUIRED"),
          collectionId: required(input.collectionId, "ENTERPRISE_RESOURCE_COLLECTION_REQUIRED"),
          resourceType: required(input.resourceType, "ENTERPRISE_RESOURCE_TYPE_REQUIRED"),
          resourceId: required(input.resourceId, "ENTERPRISE_RESOURCE_ID_REQUIRED"),
          schemaRef: required(input.schemaRef, "ENTERPRISE_RESOURCE_SCHEMA_REQUIRED"),
          ...(input.ownerPackageId?.trim() ? { ownerPackageId: input.ownerPackageId.trim() } : {}),
          storageKind: input.storageKind ?? "DOCUMENT",
          ...(input.payload !== undefined ? { payload: clone(input.payload) } : {}),
          ...(input.payloadRef?.trim() ? { payloadRef: input.payloadRef.trim() } : {}),
          ...(input.metadata ? { metadata: clone(input.metadata) } : {}),
          lifecycleState: "ACTIVE",
          revision: previous ? revision + 1 : 0,
          createdAt: previous?.createdAt ?? recordedAt,
          createdBySubjectId: previous?.createdBySubjectId ?? actorSubjectId,
          updatedAt: recordedAt,
          updatedBySubjectId: actorSubjectId
        });
        writeCurrent({
          contractVersion: "0.1.0",
          resources: [...current.resources.filter(item => addressKey(item) !== key), next]
        });
        return clone(next);
      });
    },
    archiveIfRevision(input) {
      return exclusive(() => {
        if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0) {
          throw new Error("ENTERPRISE_RESOURCE_REVISION_INVALID");
        }
        const current = readCurrent();
        const key = addressKey(input.address);
        const previous = current.resources.find(item => addressKey(item) === key);
        if (!previous || (previous.revision ?? 0) !== input.expectedRevision) {
          throw new Error("ENTERPRISE_RESOURCE_REVISION_CONFLICT");
        }
        if (previous.lifecycleState === "ARCHIVED") {
          throw new Error("ENTERPRISE_RESOURCE_ALREADY_ARCHIVED");
        }
        const next = validateResource({
          ...clone(previous),
          revision: input.expectedRevision + 1,
          lifecycleState: "ARCHIVED",
          updatedAt: timestamp(input.recordedAt, "ENTERPRISE_RESOURCE_RECORDED_AT_INVALID"),
          updatedBySubjectId: required(input.actorSubjectId, "ENTERPRISE_RESOURCE_ACTOR_REQUIRED")
        });
        writeCurrent({
          contractVersion: "0.1.0",
          resources: current.resources.map(item => addressKey(item) === key ? next : item)
        });
        return clone(next);
      });
    },

    archive(input) {
      return exclusive(() => {
      const current = readCurrent();
      const key = addressKey(input.address);
      const previous = current.resources.find(item => addressKey(item) === key);
      if (!previous) throw new Error("ENTERPRISE_RESOURCE_NOT_FOUND");
      if (previous.revision !== undefined) {
        throw new Error("ENTERPRISE_RESOURCE_CONDITIONAL_WRITE_REQUIRED");
      }
      const next = validateResource({
        ...clone(previous),
        lifecycleState: "ARCHIVED",
        updatedAt: timestamp(
          input.recordedAt,
          "ENTERPRISE_RESOURCE_RECORDED_AT_INVALID"
        ),
        updatedBySubjectId: required(
          input.actorSubjectId,
          "ENTERPRISE_RESOURCE_ACTOR_REQUIRED"
        )
      });
      writeCurrent({
        contractVersion: "0.1.0",
        resources: current.resources.map(item =>
          addressKey(item) === key ? next : item
        )
      });
      return clone(next);
      });
    }
  };
}

export function createMemoryEnterpriseResourceRepositoryV010(
  seed: EnterpriseResourceStoreSnapshotV010 = {
    contractVersion: "0.1.0",
    resources: []
  }
): EnterpriseResourceRepositoryV010 {
  let snapshot = validateSnapshot(clone(seed));
  return createRepository(
    () => clone(snapshot),
    value => {
      snapshot = validateSnapshot(clone(value));
    }
  );
}

/**
 * Shared-file single-node/process CAS is serialized through atomic mkdir.
 * This is not a certified distributed datastore across separate host volumes.
 * A crashed writer leaves a lock: subsequent writes fail closed until recovery.
 */
export function createFileEnterpriseResourceRepositoryV010(
  path: string
): EnterpriseResourceRepositoryV010 {
  const filePath = resolve(path);
  const lockPath = filePath + ".write-lock";
  const runExclusive = <T>(work: () => T): T => {
    mkdirSync(dirname(filePath), { recursive: true });
    try {
      mkdirSync(lockPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        throw new Error("ENTERPRISE_RESOURCE_STORE_BUSY");
      }
      throw error;
    }
    try {
      return work();
    } finally {
      // Do not delete another process's lock or automatically steal stale locks.
      rmdirSync(lockPath);
    }
  };
  const read = (): EnterpriseResourceStoreSnapshotV010 => {
    if (!existsSync(filePath)) {
      return { contractVersion: "0.1.0", resources: [] };
    }
    return validateSnapshot(
      JSON.parse(readFileSync(filePath, "utf8")) as EnterpriseResourceStoreSnapshotV010
    );
  };
  const write = (snapshot: EnterpriseResourceStoreSnapshotV010): void => {
    const valid = validateSnapshot(snapshot);
    const temp = filePath + "." + randomUUID() + ".tmp";
    try {
      writeFileSync(temp, JSON.stringify(valid, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
      renameSync(temp, filePath);
    } finally {
      if (existsSync(temp)) unlinkSync(temp);
    }
  };
  return createRepository(read, write, runExclusive, "SAME_FILESYSTEM_LOCK");
}
