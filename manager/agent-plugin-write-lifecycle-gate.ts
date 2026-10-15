import postgres from "postgres";
import type { AppManagerService, InstallAuthorizationV010 } from "./service.js";

export type Pa05PluginLifecycleOperationV010 = "DISABLE" | "UNINSTALL" | "UPGRADE";
export type Pa05PluginWriteGateStateV010 = "ACTIVE" | "FROZEN";

export interface Pa05PluginWriteLifecycleGateV010 {
  /**
   * Persist FROZEN before Host install/enable can expose any Agent WRITE.
   * A successful reservation deliberately does NOT grant operation admission.
   */
  reserveActivation(packageId: string, expectedPackageVersion: string):
    Promise<{state: "FROZEN"; pendingCount: number}>;
  register(packageId: string): Promise<void>;
  freeze(packageId: string): Promise<{
    state: "FROZEN";
    pendingCount: number;
    pendingStates: Record<string, number>;
  }>;
  transition(input: {
    packageId: string;
    operation: Pa05PluginLifecycleOperationV010;
    authorization?: InstallAuthorizationV010;
  }): Promise<{
    status: "BLOCKED_PENDING_WRITE" | "APPLIED";
    pendingCount: number;
  }>;
  /** Explicit Host Owner re-certification; never automatic after upgrade. */
  reopen(input: {
    packageId: string;
    expectedPackageVersion: string;
    trustedOwnerReady(): Promise<boolean> | boolean;
  }): Promise<void>;
  getState(packageId: string): Promise<{
    state: Pa05PluginWriteGateStateV010;
    packageVersion: string;
  } | undefined>;
  close(): Promise<void>;
}

function required(value: string): string {
  if (typeof value !== "string" || !value.trim())
    throw Error("PA05_LIFECYCLE_OWNER_ID_REQUIRED");
  return value.trim();
}

/**
 * PA05-04B opt-in durable Host lifecycle port, NOT a global AppManager hook.
 *
 * This shares the same owner row lock with PA-02B's opt-in coordinator
 * beginWrite() check. It freezes the ability to START external effects before
 * examining outstanding Owner links, all in one PostgreSQL transaction.
 *
 * The FROZEN state persists across crashes and manager lifecycle exceptions;
 * callers must NEVER bypass this port with a direct manager.disable/upgrade.
 * No auto-reopen on failure, upgrade or uninstall.
 */
export async function createPa05PluginWriteLifecycleGateV010(input: {
  connectionString: string;
  schema: string;
  manager: AppManagerService;
}): Promise<Pa05PluginWriteLifecycleGateV010> {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(input.schema))
    throw Error("PA05_LIFECYCLE_SCHEMA_INVALID");
  if (!input.manager || typeof input.manager.getSnapshot !== "function")
    throw Error("PA05_LIFECYCLE_MANAGER_REQUIRED");
  const q = '"' + input.schema + '"';
  const sql = postgres(required(input.connectionString), {
    max: 8, connect_timeout: 10, idle_timeout: 15
  });
  try {
    // Do not create the underlying PA-02 write tables: the Host must install
    // and configure its governed durable Owner authority first.
    const tables = await sql.unsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema=$1 " +
      "AND table_name IN ('pa02b_writes','pa02b_owner_links')",
      [input.schema]
    );
    if (new Set(tables.map(row => String(row.table_name))).size !== 2)
      throw Error("PA05_LIFECYCLE_OWNER_COORDINATOR_REQUIRED");
    await sql.unsafe(
      "CREATE TABLE IF NOT EXISTS " + q + ".pa05_plugin_write_lifecycle_gates (" +
      "owner_package_id text PRIMARY KEY, package_version text NOT NULL," +
      "state text NOT NULL CHECK(state IN ('ACTIVE','FROZEN'))," +
      "updated_at timestamptz NOT NULL DEFAULT clock_timestamp())"
    );
  } catch (error) {
    await sql.end();
    throw error;
  }

  function installedVersion(packageId: string) {
    const snapshot = input.manager.getSnapshot();
    const installed = snapshot.installedPackages.find(x => x.packageId === packageId);
    const active = snapshot.activeFeatures.some(x => x.packageId === packageId);
    if (!installed || !active) throw Error("PA05_LIFECYCLE_PLUGIN_NOT_ACTIVE");
    const write = input.manager.listEffectiveCapabilityOperations().some(x =>
      x.packageId === packageId && x.effect === "WRITE"
    );
    if (!write) throw Error("PA05_LIFECYCLE_WRITE_CAPABILITY_REQUIRED");
    return installed.version;
  }

  async function locked(tx: any, packageId: string) {
    const rows = await tx.unsafe(
      "SELECT package_version,state FROM " + q +
      ".pa05_plugin_write_lifecycle_gates WHERE owner_package_id=$1 FOR UPDATE",
      [packageId]
    );
    if (rows.length !== 1) throw Error("PA05_LIFECYCLE_OWNER_NOT_REGISTERED");
    return rows[0] as { package_version: string; state: string };
  }

  async function pending(tx: any, packageId: string): Promise<Record<string, number>> {
    const rows = await tx.unsafe(
      "SELECT w.state,count(*)::integer AS amount FROM " +
      q + ".pa02b_owner_links l JOIN " + q + ".pa02b_writes w " +
      "ON w.scope_key=l.scope_key AND w.effect_id=l.effect_id " +
      "WHERE l.owner_package_id=$1 AND w.state IN ('PREPARED','INVOKING','UNKNOWN') " +
      "GROUP BY w.state ORDER BY w.state",
      [packageId]
    );
    return Object.fromEntries(rows.map((x: {state: string; amount: string | number}) => [String(x.state), Number(x.amount)]));
  }
  const count = (states: Record<string, number>) =>
    Object.values(states).reduce((sum, value) => sum + value, 0);

  const api: Pa05PluginWriteLifecycleGateV010 = {
    async reserveActivation(packageId, expectedPackageVersion) {
      packageId = required(packageId);
      const version = required(expectedPackageVersion);
      const manifest = input.manager.listCatalog().find(pkg => pkg.packageId === packageId);
      if (!manifest || manifest.version !== version ||
        !manifest.features.some(feature =>
          feature.contributions?.some(contribution =>
            contribution.kind === "platform.capability-operation" &&
            contribution.operation.effect === "WRITE" &&
            contribution.operation.exposure.includes("PERSONAL_AGENT")
          ))) {
        throw Error("PA05_LIFECYCLE_OWNER_MANIFEST_INVALID");
      }
      return sql.begin(async tx => {
        // A missing row must become FROZEN *before* Host manager activation.
        // An existing row is locked using the same authority as beginWrite.
        await tx.unsafe(
          "INSERT INTO " + q + ".pa05_plugin_write_lifecycle_gates "+
          "(owner_package_id,package_version,state) VALUES($1,$2,'FROZEN') "+
          "ON CONFLICT (owner_package_id) DO NOTHING",
          [packageId,version]
        );
        const current = await locked(tx,packageId);
        if (current.state === "ACTIVE" && current.package_version !== version)
          throw Error("PA05_LIFECYCLE_VERSION_CHANGED");
        await tx.unsafe(
          "UPDATE " + q + ".pa05_plugin_write_lifecycle_gates "+
          "SET state='FROZEN',updated_at=clock_timestamp() WHERE owner_package_id=$1",
          [packageId]
        );
        const outstanding = await pending(tx,packageId);
        return {state:"FROZEN" as const,pendingCount:count(outstanding)};
      });
    },
    async register(packageId) {
      packageId = required(packageId);
      const version = installedVersion(packageId);
      await sql.begin(async tx => {
        const existing = await tx.unsafe(
          "SELECT package_version,state FROM " + q +
          ".pa05_plugin_write_lifecycle_gates WHERE owner_package_id=$1 FOR UPDATE",
          [packageId]
        );
        if (existing.length) {
          if (existing[0].state !== "ACTIVE" || existing[0].package_version !== version)
            throw Error("PA05_LIFECYCLE_OWNER_RECERTIFICATION_REQUIRED");
          return;
        }
        await tx.unsafe(
          "INSERT INTO " + q + ".pa05_plugin_write_lifecycle_gates " +
          "(owner_package_id,package_version,state) VALUES($1,$2,'ACTIVE')",
          [packageId, version]
        );
      });
    },
    async freeze(packageId) {
      packageId = required(packageId);
      return sql.begin(async tx => {
        const gate = await locked(tx, packageId);
        // A stale registered owner version cannot be used to release a
        // different plugin version from the manager.
        const live = input.manager.getSnapshot().installedPackages.find(x =>
          x.packageId === packageId
        );
        if (live && live.version !== gate.package_version)
          throw Error("PA05_LIFECYCLE_VERSION_CHANGED");
        await tx.unsafe(
          "UPDATE " + q + ".pa05_plugin_write_lifecycle_gates " +
          "SET state='FROZEN',updated_at=clock_timestamp() WHERE owner_package_id=$1",
          [packageId]
        );
        const states = await pending(tx, packageId);
        return { state: "FROZEN" as const, pendingCount: count(states),
          pendingStates: states };
      });
    },
    async transition({packageId, operation, authorization}) {
      packageId = required(packageId);
      if (!["DISABLE","UNINSTALL","UPGRADE"].includes(operation))
        throw Error("PA05_LIFECYCLE_OPERATION_INVALID");
      const frozen = await api.freeze(packageId);
      if (frozen.pendingCount)
        return { status: "BLOCKED_PENDING_WRITE" as const,
          pendingCount: frozen.pendingCount };
      // The durable gate stays frozen while AppManager acts outside PG. This
      // avoids a false "atomic dual-store" claim: even after process death,
      // a guarded beginWrite cannot race across this transition.
      switch (operation) {
        case "DISABLE": input.manager.disable(packageId); break;
        case "UNINSTALL": input.manager.uninstall(packageId); break;
        case "UPGRADE": input.manager.upgrade(packageId, authorization); break;
      }
      return { status: "APPLIED" as const, pendingCount: 0 };
    },
    async reopen({packageId, expectedPackageVersion, trustedOwnerReady}) {
      packageId = required(packageId);
      if (typeof trustedOwnerReady !== "function")
        throw Error("PA05_LIFECYCLE_OWNER_RECERTIFICATION_REQUIRED");
      const version = installedVersion(packageId);
      if (version !== required(expectedPackageVersion))
        throw Error("PA05_LIFECYCLE_VERSION_CHANGED");
      // Trusted current Owner binding must be re-checked after upgrade or
      // disable/enable. The model may not provide this callback.
      if (!await trustedOwnerReady())
        throw Error("PA05_LIFECYCLE_OWNER_RECERTIFICATION_REQUIRED");
      await sql.begin(async tx => {
        const gate = await locked(tx, packageId);
        if (gate.state !== "FROZEN")
          throw Error("PA05_LIFECYCLE_GATE_NOT_FROZEN");
        const outstanding = await pending(tx, packageId);
        if (count(outstanding))
          throw Error("PA05_LIFECYCLE_WRITE_NOT_QUIESCED");
        // Recheck current installed version just before reopening; not an
        // unqualified old-version resume.
        if (installedVersion(packageId) !== version)
          throw Error("PA05_LIFECYCLE_VERSION_CHANGED");
        await tx.unsafe(
          "UPDATE " + q + ".pa05_plugin_write_lifecycle_gates " +
          "SET package_version=$2,state='ACTIVE',updated_at=clock_timestamp() " +
          "WHERE owner_package_id=$1",
          [packageId, version]
        );
      });
    },
    async getState(packageId) {
      const rows = await sql.unsafe(
        "SELECT package_version,state FROM " + q +
        ".pa05_plugin_write_lifecycle_gates WHERE owner_package_id=$1",
        [required(packageId)]
      );
      if (!rows.length) return undefined;
      return { state: rows[0].state, packageVersion: rows[0].package_version };
    },
    async close() { await sql.end(); }
  };
  return api;
}
