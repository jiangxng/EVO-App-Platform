import type { AppManagerService } from "./service.js";
import type { PlatformSnapshotV010 } from "../contracts/package.js";

/**
 * PA05-05/E01J4C — internal, opt-in Host composition for revoke-first
 * READ Owner disable/uninstall. Never call from an Agent or plugin command.
 *
 * The Host owns the trusted operator authorization and central authority
 * implementations. A Worker SQL READ role must NOT hold the separate
 * operator/DBA lifecycle credential. Neither side is provisioned here.
 *
 * Not wired into default manager/server.ts startup or public HTTP API.
 */
export type Pa05ReadLifecycleRemovalV010 = "DISABLE" | "UNINSTALL";

export interface Pa05HostReadLifecycleAuthorityV010 {
  /**
   * Atomically record the operation id + cut this Host's READ approval in
   * central PostgreSQL. Must serialize behind in-flight READ locks.
   * An exception or unreachable SQL never permits local mutation.
   */
  fence(input: {
    operationId: string;
    operation: Pa05ReadLifecycleRemovalV010;
    packageId: string;
  }): Promise<void>;
  /** Reacquire proof of a previously committed fenced operation on restart. */
  assertFenced(input: {
    operationId: string;
    operation: Pa05ReadLifecycleRemovalV010;
    packageId: string;
  }): Promise<void>;
  /** Idempotently record completion. No Host READ re-attestation here. */
  complete(input: {
    operationId: string;
    operation: Pa05ReadLifecycleRemovalV010;
    packageId: string;
  }): Promise<void>;
}

export function createPa05HostReadLifecycleV010(input: {
  manager: Pick<AppManagerService,
    "getSnapshot" | "planDisable" | "planUninstall" | "disable" | "uninstall">;
  /** Pinned by Host, never inferred from request JSON. */
  protectedPackageId: "evo-purchase-attention";
  /** Reuses the existing, independent Host admin + Provider decision. */
  authorizeHostOperator(operation: Pa05ReadLifecycleRemovalV010): Promise<boolean>;
  authority: Pa05HostReadLifecycleAuthorityV010;
}): {
  apply(operation: Pa05ReadLifecycleRemovalV010, operationId: string): Promise<PlatformSnapshotV010>;
  recover(operation: Pa05ReadLifecycleRemovalV010, operationId: string): Promise<PlatformSnapshotV010>;
} {
  if (input.protectedPackageId !== "evo-purchase-attention"
      || !input.manager || !input.authority
      || typeof input.authorizeHostOperator !== "function"
      || typeof input.authority.fence !== "function"
      || typeof input.authority.assertFenced !== "function"
      || typeof input.authority.complete !== "function") {
    throw new Error("PA05_READ_HOST_LIFECYCLE_CONFIGURATION_INVALID");
  }
  let busy = false;
  function args(operation: Pa05ReadLifecycleRemovalV010, operationId: string) {
    if (!["DISABLE", "UNINSTALL"].includes(operation)
        || typeof operationId !== "string"
        || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{7,79}$/.test(operationId))
      throw new Error("PA05_READ_HOST_LIFECYCLE_REQUEST_INVALID");
    return { operation, operationId, packageId: input.protectedPackageId };
  }
  async function execute(operation: Pa05ReadLifecycleRemovalV010,
    operationId: string, recovery: boolean
  ): Promise<PlatformSnapshotV010> {
    const context = args(operation, operationId);
    if (busy) throw new Error("PA05_READ_HOST_LIFECYCLE_CONCURRENT_TRANSITION");
    busy = true;
    try {
      // No reliance on supplied principal/hostId. An unavailable provider
      // must deny; an error is not an implicit operator approval.
      if (await input.authorizeHostOperator(operation) !== true)
        throw new Error("PA05_READ_HOST_LIFECYCLE_OPERATOR_DENIED");
      const snapshot = input.manager.getSnapshot();
      const installed = snapshot.installedPackages.some(x =>
        x.packageId === input.protectedPackageId);
      const active = snapshot.activeFeatures.some(x =>
        x.packageId === input.protectedPackageId);
      if (!recovery && !installed)
        throw new Error("PA05_READ_HOST_LIFECYCLE_NOT_INSTALLED");
      const plan = operation === "DISABLE"
        ? input.manager.planDisable(input.protectedPackageId)
        : input.manager.planUninstall(input.protectedPackageId);
      // On recovery only, an already absent or disabled state can be a
      // legitimate completed local phase. Never replay a blocked mutation.
      const needsMutation = operation === "DISABLE" ? active : installed;
      if (needsMutation && plan.blockers.length)
        throw new Error("PA05_READ_HOST_LIFECYCLE_PLAN_BLOCKED");
      if (recovery) await input.authority.assertFenced(context);
      else await input.authority.fence(context);
      // Once the central cut is confirmed, never roll it back if JSON
      // persistence fails. The operator can later call recover(operationId).
      if (needsMutation) {
        if (operation === "DISABLE") input.manager.disable(input.protectedPackageId);
        else input.manager.uninstall(input.protectedPackageId);
      }
      await input.authority.complete(context);
      return input.manager.getSnapshot();
    } finally {
      busy = false;
    }
  }
  return {
    apply(operation, operationId) {
      return execute(operation, operationId, false);
    },
    recover(operation, operationId) {
      return execute(operation, operationId, true);
    }
  };
}
