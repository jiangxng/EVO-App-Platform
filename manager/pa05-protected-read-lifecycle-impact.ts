import type { AppManagerService } from "./service.js";

/**
 * Host-owned, side-effect-free impact check. An INSTALL/ENABLE request for a
 * different package can still install or activate a protected dependency.
 * Use the SAME AppManager plan that its mutation will later consume.
 *
 * This does not authorize the operation. The Host must check current
 * authenticated operator and policy before any impacted lifecycle mutation.
 */
export function pa05ProtectedReadLifecycleImpactV010(input: {
  manager: AppManagerService;
  requestedPackageId: string | undefined;
  protectedPackageId: string;
  operation: string;
}): "DIRECT" | "TRANSITIVE_INSTALL" | "TRANSITIVE_ACTIVATION" | "NONE" {
  const { manager, requestedPackageId, protectedPackageId, operation } = input;
  if (!requestedPackageId || !protectedPackageId) return "NONE";
  if (requestedPackageId === protectedPackageId) return "DIRECT";
  if (operation !== "INSTALL" && operation !== "ENABLE") return "NONE";

  // Do not infer dependency effects from the caller's declared manifest or
  // Boolean consent. Effective catalog + real current lifecycle state only.
  const plan = manager.planInstall(requestedPackageId);
  if (plan.installPackages.includes(protectedPackageId)) {
    return "TRANSITIVE_INSTALL";
  }
  const protectedManifest = manager.listCatalog()
    .find(pkg => pkg.packageId === protectedPackageId);
  if (protectedManifest?.features.some(feature =>
    plan.activateFeatures.includes(feature.featureId))) {
    return "TRANSITIVE_ACTIVATION";
  }
  return "NONE";
}


export type Pa05ProtectedReadLifecycleImpactV010 =
  | "DIRECT" | "TRANSITIVE_INSTALL" | "TRANSITIVE_ACTIVATION" | "NONE";

/**
 * PA05 E01H: in-process, bounded double-check before accepting a lifecycle
 * admission that was evaluated asynchronously.
 *
 * The authorization Provider must be consulted freshly twice. If it is
 * revoked or the actual dependency impact changes while awaiting either
 * decision, deny instead of accepting a stale plan or one ALLOW response.
 *
 * This is NOT a distributed lock, database transaction, or permission lease.
 * A separate Worker or mutation after this method returns needs durable
 * Host/SQL fencing before production certification.
 */
export async function pa05AuthorizeStableProtectedReadLifecycleV010(input: {
  readImpact(): Pa05ProtectedReadLifecycleImpactV010;
  authorize(): Promise<boolean>;
}): Promise<boolean> {
  try {
    const initial = input.readImpact();
    if (initial === "NONE") return true;
    if (!(await input.authorize())) return false;
    if (input.readImpact() !== initial) return false;
    if (!(await input.authorize())) return false;
    return input.readImpact() === initial;
  } catch {
    return false;
  }
}
