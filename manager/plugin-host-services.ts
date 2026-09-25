import type { InstalledPackageV010, PackageManifestV010 } from "../contracts/package.js";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export interface PluginStorageServiceV010 {
  get(packageId: string, key: string): unknown;
  set(packageId: string, key: string, value: unknown): void;
  delete(packageId: string, key: string): void;
  list(packageId: string): Record<string, unknown>;
}

function assertNamespace(packageId: string, key: string): void {
  if (!packageId.trim()) throw new Error("PLUGIN_STORAGE_PACKAGE_REQUIRED");
  if (!key.trim()) throw new Error("PLUGIN_STORAGE_KEY_REQUIRED");
  if (key.includes("..")) throw new Error("PLUGIN_STORAGE_KEY_INVALID");
}

export function createMemoryPluginStorageService(): PluginStorageServiceV010 {
  const packages = new Map<string, Map<string, unknown>>();
  const bucket = (packageId: string): Map<string, unknown> => {
    let current = packages.get(packageId);
    if (!current) {
      current = new Map();
      packages.set(packageId, current);
    }
    return current;
  };
  return {
    get(packageId, key) {
      assertNamespace(packageId, key);
      return structuredClone(bucket(packageId).get(key));
    },
    set(packageId, key, value) {
      assertNamespace(packageId, key);
      bucket(packageId).set(key, structuredClone(value));
    },
    delete(packageId, key) {
      assertNamespace(packageId, key);
      bucket(packageId).delete(key);
    },
    list(packageId) {
      if (!packageId.trim()) throw new Error("PLUGIN_STORAGE_PACKAGE_REQUIRED");
      return Object.fromEntries(
        [...bucket(packageId).entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => [key, structuredClone(value)])
      );
    }
  };
}

interface PersistedPluginStorageV010 {
  contractVersion: "0.1.0";
  packages: Record<string, Record<string, unknown>>;
}

export function createFilePluginStorageService(filePath: string): PluginStorageServiceV010 {
  const initial: PersistedPluginStorageV010 = existsSync(filePath)
    ? JSON.parse(readFileSync(filePath, "utf8")) as PersistedPluginStorageV010
    : { contractVersion: "0.1.0", packages: {} };
  if (initial.contractVersion !== "0.1.0" || typeof initial.packages !== "object") {
    throw new Error(`PLUGIN_STORAGE_STATE_INVALID: ${filePath}`);
  }
  const memory = createMemoryPluginStorageService();
  for (const [packageId, values] of Object.entries(initial.packages)) {
    for (const [key, value] of Object.entries(values)) memory.set(packageId, key, value);
  }
  const persist = (): void => {
    const packages: Record<string, Record<string, unknown>> = {};
    for (const packageId of Object.keys(initial.packages)) packages[packageId] = memory.list(packageId);
    mkdirSync(dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    writeFileSync(tmp, JSON.stringify({ contractVersion: "0.1.0", packages }, null, 2) + "\n", "utf8");
    renameSync(tmp, filePath);
  };
  return {
    get: memory.get,
    set(packageId, key, value) {
      if (!initial.packages[packageId]) initial.packages[packageId] = {};
      memory.set(packageId, key, value);
      persist();
    },
    delete(packageId, key) {
      if (!initial.packages[packageId]) initial.packages[packageId] = {};
      memory.delete(packageId, key);
      persist();
    },
    list: memory.list
  };
}

export interface PluginEventV010<T = unknown> {
  contractVersion: "0.1.0";
  topic: string;
  publisherPackageId: string;
  occurredAt: string;
  payload: T;
}

export interface PluginEventBusV010 {
  publish<T>(publisherPackageId: string, topic: string, payload: T): PluginEventV010<T>;
  subscribe(packageId: string, topic: string, handler: (event: PluginEventV010) => void): () => void;
}

export function createPluginEventBus(
  now: () => Date = () => new Date()
): PluginEventBusV010 {
  const handlers = new Map<string, Map<string, Set<(event: PluginEventV010) => void>>>();
  return {
    publish(publisherPackageId, topic, payload) {
      if (!topic.startsWith(`${publisherPackageId}.`)) {
        throw new Error(`PLUGIN_EVENT_TOPIC_NOT_OWNED: ${topic}`);
      }
      const event = {
        contractVersion: "0.1.0" as const,
        topic,
        publisherPackageId,
        occurredAt: now().toISOString(),
        payload: structuredClone(payload)
      };
      for (const listeners of handlers.values()) {
        for (const handler of listeners.get(topic) ?? []) handler(structuredClone(event));
      }
      return event;
    },
    subscribe(packageId, topic, handler) {
      if (!packageId.trim() || !topic.trim()) throw new Error("PLUGIN_EVENT_SUBSCRIPTION_INVALID");
      let packageHandlers = handlers.get(packageId);
      if (!packageHandlers) {
        packageHandlers = new Map();
        handlers.set(packageId, packageHandlers);
      }
      let topicHandlers = packageHandlers.get(topic);
      if (!topicHandlers) {
        topicHandlers = new Set();
        packageHandlers.set(topic, topicHandlers);
      }
      topicHandlers.add(handler);
      return () => topicHandlers?.delete(handler);
    }
  };
}


export interface PluginHostContextV010 {
  contractVersion: "0.1.0";
  packageId: string;
  permissions: {
    has(permissionId: string): boolean;
    granted(): string[];
  };
  storage?: {
    get(key: string): unknown;
    set(key: string, value: unknown): void;
    delete(key: string): void;
    list(): Record<string, unknown>;
  };
  events: {
    publish<T>(topic: string, payload: T): PluginEventV010<T>;
    subscribe(topic: string, handler: (event: PluginEventV010) => void): () => void;
  };
}

export function createScopedPluginHostContextV010(
  pkg: PackageManifestV010,
  installed: InstalledPackageV010,
  storageService: PluginStorageServiceV010,
  eventBus: PluginEventBusV010
): PluginHostContextV010 {
  if (pkg.packageId !== installed.packageId) {
    throw new Error("PLUGIN_HOST_CONTEXT_PACKAGE_MISMATCH");
  }
  if (pkg.publisher?.trust === "UNVERIFIED" && installed.trustApproved !== true) {
    throw new Error(`PLUGIN_HOST_CONTEXT_TRUST_NOT_APPROVED: ${pkg.packageId}`);
  }

  const granted = new Set(installed.grantedPermissions ?? []);
  const declaredPermissions = new Set((pkg.permissions ?? []).map(permission => permission.id));
  for (const permissionId of granted) {
    if (!declaredPermissions.has(permissionId)) {
      throw new Error(`PLUGIN_HOST_CONTEXT_PERMISSION_NOT_DECLARED: ${permissionId}`);
    }
  }

  const publishTopics = new Set(pkg.events?.publish ?? []);
  const subscribeTopics = new Set(pkg.events?.subscribe ?? []);
  const quotaBytes = pkg.storage?.quotaBytes;

  const scopedStorage = pkg.storage
    ? {
        get(key: string) {
          return storageService.get(pkg.packageId, key);
        },
        set(key: string, value: unknown) {
          if (quotaBytes !== undefined) {
            const next = {
              ...storageService.list(pkg.packageId),
              [key]: value
            };
            const bytes = Buffer.byteLength(JSON.stringify(next), "utf8");
            if (bytes > quotaBytes) {
              throw new Error(
                `PLUGIN_STORAGE_QUOTA_EXCEEDED: ${pkg.packageId}: ${bytes} > ${quotaBytes}`
              );
            }
          }
          storageService.set(pkg.packageId, key, value);
        },
        delete(key: string) {
          storageService.delete(pkg.packageId, key);
        },
        list() {
          return storageService.list(pkg.packageId);
        }
      }
    : undefined;

  return {
    contractVersion: "0.1.0",
    packageId: pkg.packageId,
    permissions: {
      has(permissionId) {
        return granted.has(permissionId);
      },
      granted() {
        return [...granted].sort();
      }
    },
    ...(scopedStorage ? { storage: scopedStorage } : {}),
    events: {
      publish(topic, payload) {
        if (!publishTopics.has(topic)) {
          throw new Error(`PLUGIN_EVENT_PUBLISH_NOT_DECLARED: ${topic}`);
        }
        return eventBus.publish(pkg.packageId, topic, payload);
      },
      subscribe(topic, handler) {
        if (!subscribeTopics.has(topic)) {
          throw new Error(`PLUGIN_EVENT_SUBSCRIBE_NOT_DECLARED: ${topic}`);
        }
        return eventBus.subscribe(pkg.packageId, topic, handler);
      }
    }
  };
}
