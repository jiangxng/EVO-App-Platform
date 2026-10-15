import type { AppManagerService, InstallAuthorizationV010 } from "./service.js";
import type { PlatformSnapshotV010 } from "../contracts/package.js";
import {
  createPa05PluginWriteLifecycleGateV010,
  type Pa05PluginLifecycleOperationV010,
  type Pa05PluginWriteLifecycleGateV010
} from "./agent-plugin-write-lifecycle-gate.js";

/**
 * PA05-04C: optional Host HTTP lifecycle adapter.
 * No production WRITE or Agent Owner is registered by constructing it.
 *
 * Only the Host may supply the protected package IDs and database authority.
 * Every protected lifecycle change must use the SAME PostgreSQL schema and
 * coordinator requirePluginWriteLifecycleFence=true.
 */
export class Pa05HostLifecycleDeniedV010 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "Pa05HostLifecycleDeniedV010";
  }
}

/**
 * PA05-04D owner coverage: only a trusted Host may turn on this protection.
 * In opt-in mode every currently active Agent-exposed WRITE must be included,
 * even when a malformed/non-certified manifest omits writeSafety metadata.
 * It is intentionally strict: partial protection would be worse than no
 * claim of protection. No production WRITE is enabled here.
 */
export function assertPa05ProtectedAgentWriteCoverageV010(
  manager: AppManagerService,
  protectedPackageIds: readonly string[]
): void {
  const protectedIds = new Set(protectedPackageIds);
  if (!protectedIds.size) return; // feature explicitly not enabled
  const ownerPackages = new Set(
    manager.listEffectiveCapabilityOperations()
      .filter(operation => operation.effect === "WRITE"
        && operation.exposure.includes("PERSONAL_AGENT"))
      .map(operation => operation.packageId)
  );
  for (const ownerPackageId of ownerPackages) {
    if (!protectedIds.has(ownerPackageId)) {
      throw new Error("PA05_HOST_LIFECYCLE_OWNER_COVERAGE_INCOMPLETE");
    }
  }
}

export function createPa05HostWriteLifecycleV010(input: {
  manager: AppManagerService;
  protectedPackageIds: readonly string[];
  databaseUrl?: string;
  schema?: string;
  /** A trusted Host test seam only. It never comes from a request. */
  gateFactory?: () => Promise<Pa05PluginWriteLifecycleGateV010>;
}): {
  apply(
    operation: Pa05PluginLifecycleOperationV010,
    packageId: string,
    authorization?: InstallAuthorizationV010
  ): Promise<PlatformSnapshotV010>;
  close(): Promise<void>;
} {
  const ids = input.protectedPackageIds;
  if (!Array.isArray(ids) || ids.some(id => typeof id !== "string" || !id.trim())
      || new Set(ids).size !== ids.length) {
    throw new Error("PA05_HOST_LIFECYCLE_IDS_INVALID");
  }
  const guarded = new Set(ids);
  const configured = Boolean(input.databaseUrl?.trim() && input.schema?.trim());
  if ((guarded.size > 0 && !configured && !input.gateFactory)
    || (Boolean(input.databaseUrl?.trim()) !== Boolean(input.schema?.trim()))) {
    throw new Error("PA05_HOST_LIFECYCLE_CONFIGURATION_INCOMPLETE");
  }
  assertPa05ProtectedAgentWriteCoverageV010(input.manager, ids);
  let connection: Promise<Pa05PluginWriteLifecycleGateV010> | undefined;
  const gate = () => {
    connection ??= (input.gateFactory
      ? input.gateFactory()
      : createPa05PluginWriteLifecycleGateV010({
        manager: input.manager,
        connectionString: input.databaseUrl!,
        schema: input.schema!
      })).catch(error => {
        // Fail closed on this request; allow a recovered database to be
        // reconnected only after a subsequent explicit Host operation.
        connection = undefined;
        throw error;
      });
    return connection;
  };
  function applyWithoutGate(
    operation: Pa05PluginLifecycleOperationV010,
    packageId: string,
    authorization?: InstallAuthorizationV010
  ): PlatformSnapshotV010 {
    if (operation === "DISABLE") return input.manager.disable(packageId);
    if (operation === "UNINSTALL") return input.manager.uninstall(packageId);
    if (operation === "UPGRADE") return input.manager.upgrade(packageId, authorization);
    throw new Pa05HostLifecycleDeniedV010("PA05_HOST_LIFECYCLE_OPERATION_INVALID");
  }
  return {
    async apply(operation, packageId, authorization) {
      if (!["DISABLE", "UNINSTALL", "UPGRADE"].includes(operation)
        || typeof packageId !== "string" || !packageId.trim()) {
        throw new Pa05HostLifecycleDeniedV010("PA05_HOST_LIFECYCLE_REQUEST_INVALID");
      }
      // Re-evaluate the effective catalog every time: a dynamically added
      // Agent WRITE Owner cannot silently invalidate the protected set.
      assertPa05ProtectedAgentWriteCoverageV010(input.manager, ids);
      if (!guarded.has(packageId))
        return applyWithoutGate(operation, packageId, authorization);
      try {
        // No fallback to unguarded manager.disable/upgrade/uninstall when the
        // database is down, a gate is missing, or there is an UNKNOWN receipt.
        const protectedGate = await gate();
        const result = await protectedGate.transition({
          packageId, operation, authorization
        });
        if (result.status !== "APPLIED") {
          throw new Pa05HostLifecycleDeniedV010(
            "PA05_HOST_LIFECYCLE_PENDING_WRITE"
          );
        }
        return input.manager.getSnapshot();
      } catch (error) {
        if (error instanceof Pa05HostLifecycleDeniedV010) throw error;
        throw new Pa05HostLifecycleDeniedV010(
          "PA05_HOST_LIFECYCLE_GUARD_UNAVAILABLE"
        );
      }
    },
    async close() {
      const current = connection;
      connection = undefined;
      if (current) await (await current).close();
    }
  };
}

/**
 * Fail startup on partially populated opt-in configuration. An empty
 * package list is deliberately unprotected because production material WRITE
 * still has no installed/authorized Owner registration.
 */
export function pa05HostLifecycleConfigurationV010(env: NodeJS.ProcessEnv) {
  const raw = env.PA05_WRITE_LIFECYCLE_PACKAGES?.trim() ?? "";
  const ids = raw ? raw.split(",").map(x => x.trim()) : [];
  return {
    protectedPackageIds: ids,
    databaseUrl: env.PA05_WRITE_LIFECYCLE_DATABASE_URL?.trim(),
    schema: env.PA05_WRITE_LIFECYCLE_SCHEMA?.trim()
  };
}
