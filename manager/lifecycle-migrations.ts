import type { LifecycleStore } from "./store.js";

export interface LifecycleRetirementResultV010 {
  contractVersion: "0.1.0";
  retiredPackageId: string;
  changed: boolean;
  removedFeatureIds: string[];
}

export function retireExperimentalPackageV010(
  store: LifecycleStore,
  packageId: string,
  featureIds: readonly string[]
): LifecycleRetirementResultV010 {
  const installed = store.getInstalledPackage(packageId);
  const active = featureIds.filter(featureId => store.getActiveFeature(featureId) !== undefined);

  for (const featureId of active) store.deleteActiveFeature(featureId);
  if (installed) store.deleteInstalledPackage(packageId);

  return {
    contractVersion: "0.1.0",
    retiredPackageId: packageId,
    changed: installed !== undefined || active.length > 0,
    removedFeatureIds: [...active].sort()
  };
}
