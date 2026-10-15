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
  /**
   * Explicit Host-owned Worker schema contracts. Until federated admission is
   * implemented, a different schema is unsupported and must fail at startup.
   */
  workerSchemas?: readonly string[];
  /**
   * Explicit experimental opt-in. All schemas MUST reside on the SAME PG
   * database URL and share a single Host-owned Owner row/inventory. Never
   * interpret this as cross-database or unauthenticated Worker federation.
   */
  sharedWorkerSchemaAuthority?: boolean;
  /** Optional dedicated central Owner authority schema in same PostgreSQL DB. */
  sharedAuthoritySchema?: string;
  /** Explicit opt-in for database-level Owner admission guard on trusted Worker tables. */
  enforceSqlOwnerAdmission?: boolean;
  /** A trusted Host test seam only. It never comes from a request. */
  gateFactory?: () => Promise<Pa05PluginWriteLifecycleGateV010>;
}): {
  /**
   * Startup defaults are synchronous; opt-in Host refuses to auto-activate
   * any Agent WRITE owner (including transitive dependencies) without SQL.
   */
  bootstrapActivation(
    operation: "INSTALL" | "ENABLE",
    packageId: string,
    authorization?: InstallAuthorizationV010
  ): PlatformSnapshotV010;
  /**
   * At pre-listen, freeze pre-existing active Agent WRITE owners in durable PG,
   * including changes made by other startup paths. Network admission fails
   * closed on outage, missing coverage, mismatched versions or pending writes.
   */
  attestStartupActivation(): Promise<void>;
  admitActivation(
    operation: "INSTALL" | "ENABLE",
    packageId: string,
    authorization?: InstallAuthorizationV010
  ): Promise<PlatformSnapshotV010>;
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
  if (guarded.size && input.workerSchemas?.length) {
    const unique = new Set(input.workerSchemas);
    if (unique.size !== input.workerSchemas.length ||
      !input.workerSchemas.includes(input.schema ?? "") ||
      input.workerSchemas.some(value =>
        !value || !/^[a-z][a-z0-9_]{0,62}$/.test(value) ||
        (!input.sharedWorkerSchemaAuthority && value !== input.schema))) {
      throw new Error("PA05_HOST_WORKER_SCHEMA_NOT_SHARED");
    }
  }
  if (input.sharedWorkerSchemaAuthority &&
      (!guarded.size || !input.workerSchemas?.length || !configured ||
        (input.sharedAuthoritySchema !== undefined &&
          !/^[a-z][a-z0-9_]{0,62}$/.test(input.sharedAuthoritySchema)))) {
    throw new Error("PA05_HOST_SHARED_AUTHORITY_CONFIGURATION_INCOMPLETE");
  }
  if (!input.sharedWorkerSchemaAuthority &&
      (input.sharedAuthoritySchema || input.enforceSqlOwnerAdmission))
    throw new Error("PA05_HOST_SHARED_AUTHORITY_CONFIGURATION_INCOMPLETE");
  assertPa05ProtectedAgentWriteCoverageV010(input.manager, ids);
  let connection: Promise<Pa05PluginWriteLifecycleGateV010> | undefined;
  const gate = () => {
    connection ??= (input.gateFactory
      ? input.gateFactory()
      : createPa05PluginWriteLifecycleGateV010({
        manager: input.manager,
        connectionString: input.databaseUrl!,
        schema: input.schema!,
        ...(input.sharedWorkerSchemaAuthority ? {
          authoritySchema: input.sharedAuthoritySchema ?? input.schema!,
          workerSchemas: input.workerSchemas!,
          ...(input.enforceSqlOwnerAdmission ?
            {enforceSqlOwnerAdmission:true} : {})
        } : {})
      })).catch(error => {
        // Fail closed on this request; allow a recovered database to be
        // reconnected only after a subsequent explicit Host operation.
        connection = undefined;
        throw error;
      });
    return connection;
  };
  function prospectiveAgentWriteOwners(packageId: string): Array<{packageId: string; version: string}> {
    const plan = input.manager.planInstall(packageId);
    // All dependencies must be guarded, including a WRITE source dependency
    // brought in by a supposedly READ-only target package.
    const planned = new Set([packageId, ...plan.installPackages]);
    const owners = input.manager.listCatalog()
      .filter(pkg => planned.has(pkg.packageId))
      .filter(pkg => pkg.features.some(feature =>
        feature.contributions?.some(contribution =>
          contribution.kind === "platform.capability-operation" &&
          contribution.operation.effect === "WRITE" &&
          contribution.operation.exposure.includes("PERSONAL_AGENT")
        )))
      .map(pkg => ({packageId:pkg.packageId,version:pkg.version}));
    if (owners.some(owner => !guarded.has(owner.packageId)))
      throw new Pa05HostLifecycleDeniedV010(
        "PA05_HOST_WRITE_OWNER_NOT_PROTECTED"
      );
    return owners.sort((a,b)=>a.packageId.localeCompare(b.packageId));
  }
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
    bootstrapActivation(operation, packageId, authorization) {
      if (!["INSTALL", "ENABLE"].includes(operation) ||
        typeof packageId !== "string" || !packageId.trim())
        throw new Pa05HostLifecycleDeniedV010("PA05_HOST_LIFECYCLE_REQUEST_INVALID");
      if (guarded.size > 0) {
        try {
          assertPa05ProtectedAgentWriteCoverageV010(input.manager, ids);
        } catch {
          throw new Pa05HostLifecycleDeniedV010(
            "PA05_HOST_LIFECYCLE_OWNER_COVERAGE_INCOMPLETE"
          );
        }
        const prospective = prospectiveAgentWriteOwners(packageId);
        if (prospective.length > 0)
          throw new Pa05HostLifecycleDeniedV010(
            "PA05_HOST_BOOTSTRAP_WRITE_REQUIRES_ASYNC_ADMISSION"
          );
      }
      if (operation === "INSTALL") return input.manager.install(packageId, authorization);
      return input.manager.enable(packageId);
    },
    async attestStartupActivation() {
      if (!guarded.size) return; // production default behavior unchanged
      try {
        assertPa05ProtectedAgentWriteCoverageV010(input.manager, ids);
        const protectedGate = await gate(); // database/table prerequisite even with no active owner
        const catalog = new Map(input.manager.listCatalog().map(pkg => [pkg.packageId,pkg]));
        const installed = new Map(input.manager.getSnapshot().installedPackages.map(pkg =>
          [pkg.packageId,pkg.version]
        ));
        const activeOwners = [...new Set(input.manager.listEffectiveCapabilityOperations()
          .filter(operation => operation.effect === "WRITE" &&
            operation.exposure.includes("PERSONAL_AGENT"))
          .map(operation => operation.packageId))].sort();
        for (const ownerId of activeOwners) {
          const version = installed.get(ownerId);
          if (!version || catalog.get(ownerId)?.version !== version)
            throw new Pa05HostLifecycleDeniedV010(
              "PA05_HOST_BOOTSTRAP_OWNER_VERSION_MISMATCH"
            );
          const reserved = await protectedGate.reserveActivation(ownerId,version);
          if (reserved.pendingCount > 0)
            throw new Pa05HostLifecycleDeniedV010(
              "PA05_HOST_LIFECYCLE_PENDING_WRITE"
            );
        }
      } catch (error) {
        if (error instanceof Pa05HostLifecycleDeniedV010) throw error;
        throw new Pa05HostLifecycleDeniedV010(
          "PA05_HOST_BOOTSTRAP_GATE_UNAVAILABLE"
        );
      }
    },
    async admitActivation(operation, packageId, authorization) {
      if ((operation !== "INSTALL" && operation !== "ENABLE")
        || typeof packageId !== "string" || !packageId.trim()) {
        throw new Pa05HostLifecycleDeniedV010(
          "PA05_HOST_LIFECYCLE_REQUEST_INVALID"
        );
      }
      if (guarded.size > 0) {
        try {
          assertPa05ProtectedAgentWriteCoverageV010(input.manager, ids);
        } catch {
          throw new Pa05HostLifecycleDeniedV010(
            "PA05_HOST_LIFECYCLE_OWNER_COVERAGE_INCOMPLETE"
          );
        }
        const owners = prospectiveAgentWriteOwners(packageId);
        if (owners.length) {
          try {
            const protectedGate = await gate();
            // Fail CLOSED before exposing any new Owner: even if activation
            // fails after reservation, durable FROZEN remains in PostgreSQL.
            // Unknown/pending Owner effects cannot be bypassed by reinstall.
            for (const owner of owners) {
              const reserved = await protectedGate.reserveActivation(
                owner.packageId, owner.version
              );
              if (reserved.pendingCount > 0) {
                throw new Pa05HostLifecycleDeniedV010(
                  "PA05_HOST_LIFECYCLE_PENDING_WRITE"
                );
              }
            }
          } catch (error) {
            if (error instanceof Pa05HostLifecycleDeniedV010) throw error;
            throw new Pa05HostLifecycleDeniedV010(
              "PA05_HOST_LIFECYCLE_GUARD_UNAVAILABLE"
            );
          }
        }
      }
      if (operation === "INSTALL") return input.manager.install(packageId, authorization);
      return input.manager.enable(packageId);
    },
    async apply(operation, packageId, authorization) {
      if (!["DISABLE", "UNINSTALL", "UPGRADE"].includes(operation)
        || typeof packageId !== "string" || !packageId.trim()) {
        throw new Pa05HostLifecycleDeniedV010("PA05_HOST_LIFECYCLE_REQUEST_INVALID");
      }
      // Re-evaluate the effective catalog every time: a dynamically added
      // Agent WRITE Owner cannot silently invalidate the protected set.
      try {
        assertPa05ProtectedAgentWriteCoverageV010(input.manager, ids);
      } catch {
        throw new Pa05HostLifecycleDeniedV010(
          "PA05_HOST_LIFECYCLE_OWNER_COVERAGE_INCOMPLETE"
        );
      }
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
    schema: env.PA05_WRITE_LIFECYCLE_SCHEMA?.trim(),
    ...(env.PA05_SHARED_SCHEMA_AUTHORITY_ENABLED?.trim() === "1"
      ? {sharedWorkerSchemaAuthority: true} : {}),
    ...(env.PA05_SQL_WRITE_ADMISSION_ENABLED?.trim() === "1"
      ? {enforceSqlOwnerAdmission:true} : {}),
    ...(env.PA05_WRITE_LIFECYCLE_AUTHORITY_SCHEMA?.trim()
      ? {sharedAuthoritySchema: env.PA05_WRITE_LIFECYCLE_AUTHORITY_SCHEMA.trim()} : {}),
    ...(env.PA05_WRITE_LIFECYCLE_WORKER_SCHEMAS?.trim()
      ? {workerSchemas: env.PA05_WRITE_LIFECYCLE_WORKER_SCHEMAS
          .split(",").map(x => x.trim())}
      : {})
  };
}
