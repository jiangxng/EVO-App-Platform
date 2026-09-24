import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type {
  ActivatedFeatureV010,
  InstalledPackageV010,
  PlatformSnapshotV010
} from "../contracts/package.js";

export interface LifecycleStore {
  getInstalledPackage(packageId: string): InstalledPackageV010 | undefined;
  saveInstalledPackage(record: InstalledPackageV010): void;
  deleteInstalledPackage(packageId: string): void;
  getActiveFeature(featureId: string): ActivatedFeatureV010 | undefined;
  saveActiveFeature(record: ActivatedFeatureV010): void;
  deleteActiveFeature(featureId: string): void;
  snapshot(): PlatformSnapshotV010;
}

export function createMemoryLifecycleStore(): LifecycleStore {
  const installed = new Map<string, InstalledPackageV010>();
  const active = new Map<string, ActivatedFeatureV010>();

  return {
    getInstalledPackage(packageId) {
      const item = installed.get(packageId);
      return item ? structuredClone(item) : undefined;
    },

    saveInstalledPackage(record) {
      installed.set(record.packageId, structuredClone(record));
    },

    deleteInstalledPackage(packageId) {
      installed.delete(packageId);
    },

    getActiveFeature(featureId) {
      const item = active.get(featureId);
      return item ? structuredClone(item) : undefined;
    },

    saveActiveFeature(record) {
      active.set(record.featureId, structuredClone(record));
    },

    deleteActiveFeature(featureId) {
      active.delete(featureId);
    },

    snapshot() {
      return {
        contractVersion: "0.1.0",
        installedPackages: [...installed.values()]
          .sort((a, b) => a.packageId.localeCompare(b.packageId))
          .map(x => structuredClone(x)),
        activeFeatures: [...active.values()]
          .sort((a, b) => a.featureId.localeCompare(b.featureId))
          .map(x => structuredClone(x)),
        effectiveCapabilities: []
      };
    }
  };
}


interface PersistedLifecycleStateV010 {
  contractVersion: "0.1.0";
  installedPackages: InstalledPackageV010[];
  activeFeatures: ActivatedFeatureV010[];
}

function loadPersistedState(filePath: string): PersistedLifecycleStateV010 {
  if (!existsSync(filePath)) {
    return { contractVersion: "0.1.0", installedPackages: [], activeFeatures: [] };
  }
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as PersistedLifecycleStateV010;
  if (
    parsed.contractVersion !== "0.1.0"
    || !Array.isArray(parsed.installedPackages)
    || !Array.isArray(parsed.activeFeatures)
  ) {
    throw new Error(`LIFECYCLE_STATE_INVALID: ${filePath}`);
  }
  return parsed;
}

export function createFileLifecycleStore(filePath: string): LifecycleStore {
  const initial = loadPersistedState(filePath);
  const installed = new Map<string, InstalledPackageV010>(
    initial.installedPackages.map(item => [item.packageId, structuredClone(item)])
  );
  const active = new Map<string, ActivatedFeatureV010>(
    initial.activeFeatures.map(item => [item.featureId, structuredClone(item)])
  );

  function persist(): void {
    mkdirSync(dirname(filePath), { recursive: true });
    const state: PersistedLifecycleStateV010 = {
      contractVersion: "0.1.0",
      installedPackages: [...installed.values()]
        .sort((a, b) => a.packageId.localeCompare(b.packageId))
        .map(item => structuredClone(item)),
      activeFeatures: [...active.values()]
        .sort((a, b) => a.featureId.localeCompare(b.featureId))
        .map(item => structuredClone(item))
    };
    const tmp = `${filePath}.tmp`;
    writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n", "utf8");
    renameSync(tmp, filePath);
  }

  return {
    getInstalledPackage(packageId) {
      const item = installed.get(packageId);
      return item ? structuredClone(item) : undefined;
    },

    saveInstalledPackage(record) {
      installed.set(record.packageId, structuredClone(record));
      persist();
    },

    deleteInstalledPackage(packageId) {
      installed.delete(packageId);
      persist();
    },

    getActiveFeature(featureId) {
      const item = active.get(featureId);
      return item ? structuredClone(item) : undefined;
    },

    saveActiveFeature(record) {
      active.set(record.featureId, structuredClone(record));
      persist();
    },

    deleteActiveFeature(featureId) {
      active.delete(featureId);
      persist();
    },

    snapshot() {
      return {
        contractVersion: "0.1.0",
        installedPackages: [...installed.values()]
          .sort((a, b) => a.packageId.localeCompare(b.packageId))
          .map(item => structuredClone(item)),
        activeFeatures: [...active.values()]
          .sort((a, b) => a.featureId.localeCompare(b.featureId))
          .map(item => structuredClone(item)),
        effectiveCapabilities: []
      };
    }
  };
}
