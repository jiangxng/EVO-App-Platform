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
