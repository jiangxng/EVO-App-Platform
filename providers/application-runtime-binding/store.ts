import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type {
  EnterpriseApplicationRuntimeBindingSnapshotV010,
  EnterpriseApplicationRuntimeBindingV010
} from "../../contracts/enterprise-application-runtime-binding.js";

export interface EnterpriseApplicationRuntimeBindingStoreV010 {
  put(binding: EnterpriseApplicationRuntimeBindingV010): EnterpriseApplicationRuntimeBindingV010;
  get(input: {
    enterpriseId: string;
    hostApplicationRefId: string;
    runtimeProviderId: string;
  }): EnterpriseApplicationRuntimeBindingV010 | undefined;
  listByEnterprise(enterpriseId: string): EnterpriseApplicationRuntimeBindingV010[];
  snapshot(): EnterpriseApplicationRuntimeBindingSnapshotV010;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function validate(binding: EnterpriseApplicationRuntimeBindingV010): void {
  if (
    binding.contractVersion !== "0.1.0"
    || binding.runtimeKind !== "EVO_APPLICATION_ANCHOR"
    || !Number.isFinite(Date.parse(binding.createdAt))
    || !Number.isFinite(Date.parse(binding.updatedAt))
  ) {
    throw new Error("EOG_APPLICATION_RUNTIME_BINDING_INVALID");
  }
  required(binding.bindingId, "EOG_APPLICATION_RUNTIME_BINDING_INVALID");
  required(binding.enterpriseId, "EOG_APPLICATION_RUNTIME_BINDING_INVALID");
  required(binding.hostApplicationRefId, "EOG_APPLICATION_RUNTIME_BINDING_INVALID");
  required(binding.runtimeProviderId, "EOG_APPLICATION_RUNTIME_BINDING_INVALID");
  required(binding.runtimeApplicationId, "EOG_APPLICATION_RUNTIME_BINDING_INVALID");
}

function key(binding: Pick<
  EnterpriseApplicationRuntimeBindingV010,
  "enterpriseId" | "hostApplicationRefId" | "runtimeProviderId"
>): string {
  return [
    binding.enterpriseId.trim(),
    binding.hostApplicationRefId.trim(),
    binding.runtimeProviderId.trim()
  ].join("|");
}

function validateSnapshot(
  snapshot: EnterpriseApplicationRuntimeBindingSnapshotV010
): EnterpriseApplicationRuntimeBindingSnapshotV010 {
  if (
    snapshot.contractVersion !== "0.1.0"
    || !Array.isArray(snapshot.bindings)
  ) {
    throw new Error("EOG_APPLICATION_RUNTIME_BINDING_SNAPSHOT_INVALID");
  }
  const ids = new Set<string>();
  const keys = new Set<string>();
  const runtimeIds = new Set<string>();
  for (const binding of snapshot.bindings) {
    validate(binding);
    if (ids.has(binding.bindingId)) {
      throw new Error("EOG_APPLICATION_RUNTIME_BINDING_ID_DUPLICATE");
    }
    ids.add(binding.bindingId);
    const mappingKey = key(binding);
    if (keys.has(mappingKey)) {
      throw new Error("EOG_APPLICATION_RUNTIME_BINDING_DUPLICATE");
    }
    keys.add(mappingKey);
    const runtimeKey = [
      binding.enterpriseId,
      binding.runtimeProviderId,
      binding.runtimeApplicationId
    ].join("|");
    if (runtimeIds.has(runtimeKey)) {
      throw new Error("EOG_APPLICATION_RUNTIME_IDENTITY_DUPLICATE");
    }
    runtimeIds.add(runtimeKey);
  }
  return snapshot;
}

function createStore(
  read: () => EnterpriseApplicationRuntimeBindingSnapshotV010,
  write: (snapshot: EnterpriseApplicationRuntimeBindingSnapshotV010) => void
): EnterpriseApplicationRuntimeBindingStoreV010 {
  return {
    put(binding) {
      validate(binding);
      const current = read();
      const mappingKey = key(binding);
      const previous = current.bindings.find(item => key(item) === mappingKey);
      const runtimeConflict = current.bindings.find(item =>
        item.enterpriseId === binding.enterpriseId
        && item.runtimeProviderId === binding.runtimeProviderId
        && item.runtimeApplicationId === binding.runtimeApplicationId
        && key(item) !== mappingKey
      );
      if (runtimeConflict) {
        throw new Error("EOG_APPLICATION_RUNTIME_IDENTITY_DUPLICATE");
      }
      if (
        previous
        && (
          previous.bindingId !== binding.bindingId
          || previous.createdAt !== binding.createdAt
        )
      ) {
        throw new Error("EOG_APPLICATION_RUNTIME_BINDING_IDENTITY_IMMUTABLE");
      }
      const next = {
        contractVersion: "0.1.0" as const,
        bindings: previous
          ? current.bindings.map(item =>
              key(item) === mappingKey ? clone(binding) : item
            )
          : [...current.bindings, clone(binding)]
      };
      write(validateSnapshot(next));
      return clone(binding);
    },

    get(input) {
      const mappingKey = [
        required(input.enterpriseId, "EOG_ENTERPRISE_ID_REQUIRED"),
        required(input.hostApplicationRefId, "EOG_HOST_APPLICATION_REF_REQUIRED"),
        required(input.runtimeProviderId, "EOG_RUNTIME_PROVIDER_ID_REQUIRED")
      ].join("|");
      const found = read().bindings.find(item => key(item) === mappingKey);
      return found ? clone(found) : undefined;
    },

    listByEnterprise(enterpriseId) {
      const id = required(enterpriseId, "EOG_ENTERPRISE_ID_REQUIRED");
      return read().bindings
        .filter(item => item.enterpriseId === id)
        .sort((a, b) => key(a).localeCompare(key(b)))
        .map(clone);
    },

    snapshot() {
      return clone(read());
    }
  };
}

export function createMemoryEnterpriseApplicationRuntimeBindingStoreV010(
  seed: EnterpriseApplicationRuntimeBindingSnapshotV010 = {
    contractVersion: "0.1.0",
    bindings: []
  }
): EnterpriseApplicationRuntimeBindingStoreV010 {
  let snapshot = clone(validateSnapshot(seed));
  return createStore(
    () => clone(snapshot),
    next => {
      snapshot = clone(validateSnapshot(next));
    }
  );
}

export function createFileEnterpriseApplicationRuntimeBindingStoreV010(
  path: string
): EnterpriseApplicationRuntimeBindingStoreV010 {
  const read = (): EnterpriseApplicationRuntimeBindingSnapshotV010 => {
    if (!existsSync(path)) {
      return { contractVersion: "0.1.0", bindings: [] };
    }
    return clone(validateSnapshot(JSON.parse(
      readFileSync(path, "utf8")
    ) as EnterpriseApplicationRuntimeBindingSnapshotV010));
  };
  const write = (snapshot: EnterpriseApplicationRuntimeBindingSnapshotV010): void => {
    const validated = validateSnapshot(snapshot);
    mkdirSync(dirname(path), { recursive: true });
    const temporaryPath = path + ".tmp";
    writeFileSync(
      temporaryPath,
      JSON.stringify(validated, null, 2) + "\n",
      "utf8"
    );
    renameSync(temporaryPath, path);
  };
  return createStore(read, write);
}
