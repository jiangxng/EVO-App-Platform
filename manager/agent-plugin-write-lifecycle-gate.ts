import postgres from "postgres";
import {createHash} from "node:crypto";
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
  /** Opt-in common PostgreSQL DATABASE authority schema, never a second DB. */
  authoritySchema?: string;
  /** Complete trusted Worker schema inventory; all must already have WRITE/Owner tables. */
  workerSchemas?: readonly string[];
  /**
   * Opt-in defense in depth for legacy coordinators which do not set the
   * JavaScript lifecycle fence. A Host-owned PostgreSQL trigger still locks
   * the central Owner row before PREPARED -> INVOKING.
   * Requires shared Worker inventory on the same PostgreSQL database.
   */
  enforceSqlOwnerAdmission?: boolean;
  /**
   * Optional opt-in trusted PG identities to certify at startup. No HTTP or
   * model input can populate this map. Each registered Worker schema must
   * have exactly one distinct LOGIN role with no authority to remove the SQL
   * admission trigger or mutate the Host-owned gate / inventory.
   */
  workerIdentities?: readonly {schema: string; role: string}[];
}): Promise<Pa05PluginWriteLifecycleGateV010> {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(input.schema))
    throw Error("PA05_LIFECYCLE_SCHEMA_INVALID");
  if (!input.manager || typeof input.manager.getSnapshot !== "function")
    throw Error("PA05_LIFECYCLE_MANAGER_REQUIRED");
  const shared = input.workerSchemas !== undefined;
  if(input.enforceSqlOwnerAdmission && !shared)
    throw Error("PA05_SQL_OWNER_ADMISSION_INVENTORY_REQUIRED");
  const workerSchemas = shared ? [...input.workerSchemas!] : [input.schema];
  const identityAudited = input.workerIdentities !== undefined;
  if (identityAudited) {
    const identities = input.workerIdentities!;
    if (!input.enforceSqlOwnerAdmission || !shared ||
      identities.length !== workerSchemas.length ||
      identities.some(x => !/^[a-z][a-z0-9_]{0,62}$/.test(x.schema) ||
        !/^[a-z_][a-z0-9_]{0,62}$/.test(x.role)) ||
      new Set(identities.map(x => x.schema)).size !== identities.length ||
      new Set(identities.map(x => x.role)).size !== identities.length ||
      workerSchemas.some(x => !identities.some(role => role.schema === x)))
      throw Error("PA05_SQL_WORKER_IDENTITY_COVERAGE_INVALID");
  }
  const authSchema = shared ? input.authoritySchema : input.schema;
  if (!authSchema || !/^[a-z][a-z0-9_]{0,62}$/.test(authSchema) ||
    !workerSchemas.length ||
    workerSchemas.some(value => !/^[a-z][a-z0-9_]{0,62}$/.test(value)) ||
    new Set(workerSchemas).size !== workerSchemas.length ||
    !workerSchemas.includes(input.schema))
    throw Error("PA05_LIFECYCLE_WORKER_INVENTORY_INVALID");
  const a = '"' + authSchema + '"';
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
    // All declared workers must share this PHYSICAL PostgreSQL database.
    // Check their durable tables before accepting the inventory. No source
    // Worker is allowed to create or edit the Host authority inventory.
    for (const workerSchema of workerSchemas) {
      const existing = await sql.unsafe(
        "SELECT table_name FROM information_schema.tables WHERE table_schema=$1 " +
        "AND table_name IN ('pa02b_writes','pa02b_owner_links')",
        [workerSchema]
      );
      if (new Set(existing.map(x => x.table_name)).size !== 2)
        throw Error("PA05_LIFECYCLE_WORKER_NOT_READY");
    }
    await sql.unsafe("CREATE SCHEMA IF NOT EXISTS " + a);
    await sql.unsafe(
      "CREATE TABLE IF NOT EXISTS " + a + ".pa05_plugin_write_lifecycle_gates (" +
      "owner_package_id text PRIMARY KEY, package_version text NOT NULL," +
      "state text NOT NULL CHECK(state IN ('ACTIVE','FROZEN'))," +
      "updated_at timestamptz NOT NULL DEFAULT clock_timestamp())"
    );
    await sql.unsafe(
      "CREATE TABLE IF NOT EXISTS " + a + ".pa05_plugin_write_worker_schemas (" +
      "schema_name text PRIMARY KEY)"
    );
    await sql.begin(async tx => {
      const existing = await tx.unsafe("SELECT schema_name FROM " + a +
        ".pa05_plugin_write_worker_schemas ORDER BY schema_name FOR UPDATE");
      const declared = [...workerSchemas].sort();
      if (existing.length) {
        // Fail closed on inventory changes: never silently remove an old
        // Worker with unresolved effects or add a new untracked Writer.
        if (JSON.stringify(existing.map(x => x.schema_name).sort()) !==
            JSON.stringify(declared))
          throw Error("PA05_LIFECYCLE_SHARED_WORKER_INVENTORY_CHANGED");
      } else {
        for (const workerSchema of declared) {
          await tx.unsafe("INSERT INTO " + a +
            ".pa05_plugin_write_worker_schemas (schema_name) VALUES($1)",
            [workerSchema]);
        }
      }
      if(input.enforceSqlOwnerAdmission) {
        // DDL and the Host inventory commit together. The trigger runs even
        // for a legacy unfenced coordinator, on the *business* schema table.
        // A Worker account that OWNS its write table can drop a trigger;
        // least-privilege PG role separation remains a release requirement.
        for(const workerSchema of declared) {
          const wq='"'+workerSchema+'"';
          const suffix=createHash("sha256").update(workerSchema).digest("hex").slice(0,20);
          const functionName="pa05_guard_"+suffix;
          const fq=a+'."'+functionName+'"';
          const funcBody=`
DECLARE gate_state text;
BEGIN
  IF OLD.state = 'PREPARED' AND NEW.state = 'INVOKING' THEN
    IF NOT EXISTS (
      SELECT 1 FROM ${a}.pa05_plugin_write_worker_schemas
      WHERE schema_name = '${workerSchema}'
    ) THEN
      RAISE EXCEPTION 'PA05_WRITE_SQL_WORKER_NOT_REGISTERED';
    END IF;
    SELECT g.state INTO gate_state
    FROM ${a}.pa05_plugin_write_lifecycle_gates g
    JOIN ${wq}.pa02b_owner_links l
      ON l.owner_package_id = g.owner_package_id
    WHERE l.scope_key = NEW.scope_key
      AND l.effect_id = NEW.effect_id
      AND l.run_id = NEW.run_id
    FOR UPDATE OF g;
    IF gate_state IS DISTINCT FROM 'ACTIVE' THEN
      RAISE EXCEPTION 'PA05_WRITE_SQL_OWNER_GATE_FROZEN';
    END IF;
  END IF;
  RETURN NEW;
END`;
          await tx.unsafe(
            "CREATE OR REPLACE FUNCTION "+fq+"() RETURNS trigger "+
            "LANGUAGE plpgsql SECURITY DEFINER "+
            "SET search_path = pg_catalog AS $pa05$"+funcBody+"$pa05$"
          );
          await tx.unsafe(
            "DROP TRIGGER IF EXISTS pa05_owner_write_admission ON "+
            wq+".pa02b_writes"
          );
          await tx.unsafe(
            "CREATE TRIGGER pa05_owner_write_admission "+
            "BEFORE UPDATE OF state ON "+wq+".pa02b_writes "+
            "FOR EACH ROW EXECUTE FUNCTION "+fq+"()"
          );
        }
      }
    });
    if (identityAudited) {
      // The Host must verify REAL database privileges after installing its
      // SQL admission trigger. A merely declared Worker role is no proof.
      // A table-owner, privileged role or central-gate writer could bypass
      // the trigger and forge material effects.
      for (const identity of input.workerIdentities!) {
        const workerTable = '"' + identity.schema + '"."pa02b_writes"';
        const ownerGate = a + '."pa05_plugin_write_lifecycle_gates"';
        const inventory = a + '."pa05_plugin_write_worker_schemas"';
        const checked = await sql.unsafe(
          "SELECT r.rolcanlogin, r.rolsuper, r.rolcreaterole, r.rolcreatedb," +
          " r.rolreplication, r.rolbypassrls," +
          " pg_has_role(r.oid, wt.relowner, 'MEMBER') AS owns_worker_table," +
          " pg_has_role(r.oid, gt.relowner, 'MEMBER') AS owns_host_gate," +
          " pg_has_role(r.oid, it.relowner, 'MEMBER') AS owns_inventory," +
          " pg_has_role(r.oid, d.datdba, 'MEMBER') AS owns_database," +
          " has_table_privilege(r.oid, wt.oid, 'UPDATE') AS can_write_effect," +
          " has_table_privilege(r.oid, wt.oid, 'TRIGGER') AS can_change_triggers," +
          " has_table_privilege(r.oid, gt.oid, 'INSERT') AS can_insert_gate," +
          " has_table_privilege(r.oid, gt.oid, 'UPDATE') AS can_update_gate," +
          " has_table_privilege(r.oid, gt.oid, 'DELETE') AS can_delete_gate," +
          " has_table_privilege(r.oid, it.oid, 'INSERT') AS can_insert_inventory," +
          " has_table_privilege(r.oid, it.oid, 'UPDATE') AS can_update_inventory," +
          " has_table_privilege(r.oid, it.oid, 'DELETE') AS can_delete_inventory," +
          " has_schema_privilege(r.oid, an.oid, 'CREATE') AS can_create_authority," +
          " has_schema_privilege(r.oid, wn.oid, 'CREATE') AS can_create_worker" +
          " FROM pg_roles r, pg_class wt, pg_class gt, pg_class it," +
          " pg_namespace an, pg_namespace wn, pg_database d" +
          " WHERE r.rolname=$1 AND wt.oid=to_regclass($2)" +
          " AND gt.oid=to_regclass($3) AND it.oid=to_regclass($4)" +
          " AND an.nspname=$5 AND wn.nspname=$6" +
          " AND d.datname=current_database()",
          [identity.role,workerTable,ownerGate,inventory,authSchema,identity.schema]
        );
        const result = checked[0];
        if (!result || !result.rolcanlogin || !result.can_write_effect ||
          ["rolsuper","rolcreaterole","rolcreatedb","rolreplication","rolbypassrls",
            "owns_worker_table","owns_host_gate","owns_inventory","owns_database",
            "can_change_triggers","can_insert_gate","can_update_gate",
            "can_delete_gate","can_insert_inventory","can_update_inventory",
            "can_delete_inventory","can_create_authority","can_create_worker"
          ].some(key => result[key] === true))
          throw Error("PA05_SQL_WORKER_PRIVILEGES_UNSAFE");
      }
    }
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
      "SELECT package_version,state FROM " + a +
      ".pa05_plugin_write_lifecycle_gates WHERE owner_package_id=$1 FOR UPDATE",
      [packageId]
    );
    if (rows.length !== 1) throw Error("PA05_LIFECYCLE_OWNER_NOT_REGISTERED");
    return rows[0] as { package_version: string; state: string };
  }

  async function pending(tx: any, packageId: string): Promise<Record<string, number>> {
    const inventory = await tx.unsafe(
      "SELECT schema_name FROM " + a +
      ".pa05_plugin_write_worker_schemas ORDER BY schema_name"
    );
    const actual = inventory.map((x: {schema_name: string}) => x.schema_name);
    if (JSON.stringify(actual) !== JSON.stringify([...workerSchemas].sort()))
      throw Error("PA05_LIFECYCLE_SHARED_WORKER_INVENTORY_CHANGED");
    const states: Record<string,number> = {};
    // The trusted inventory is validated and pinned at Host construction.
    // Same DB + same SQL tx + same locked Owner gate row means both Worker
    // admissions and freeze are serialized across all registered schemas.
    for (const workerSchema of actual) {
      if (!/^[a-z][a-z0-9_]{0,62}$/.test(workerSchema))
        throw Error("PA05_LIFECYCLE_WORKER_INVENTORY_INVALID");
      const wq = '"' + workerSchema + '"';
      const rows = await tx.unsafe(
        "SELECT w.state,count(*)::integer AS amount FROM " +
        wq + ".pa02b_owner_links l JOIN " + wq + ".pa02b_writes w " +
        "ON w.scope_key=l.scope_key AND w.effect_id=l.effect_id " +
        "WHERE l.owner_package_id=$1 AND w.state IN ('PREPARED','INVOKING','UNKNOWN') " +
        "GROUP BY w.state ORDER BY w.state",
        [packageId]
      );
      for (const row of rows) {
        const state = String(row.state);
        states[state] = (states[state] ?? 0) + Number(row.amount);
      }
    }
    return states;
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
          "INSERT INTO " + a + ".pa05_plugin_write_lifecycle_gates "+
          "(owner_package_id,package_version,state) VALUES($1,$2,'FROZEN') "+
          "ON CONFLICT (owner_package_id) DO NOTHING",
          [packageId,version]
        );
        const current = await locked(tx,packageId);
        if (current.state === "ACTIVE" && current.package_version !== version)
          throw Error("PA05_LIFECYCLE_VERSION_CHANGED");
        await tx.unsafe(
          "UPDATE " + a + ".pa05_plugin_write_lifecycle_gates "+
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
          "SELECT package_version,state FROM " + a +
          ".pa05_plugin_write_lifecycle_gates WHERE owner_package_id=$1 FOR UPDATE",
          [packageId]
        );
        if (existing.length) {
          if (existing[0].state !== "ACTIVE" || existing[0].package_version !== version)
            throw Error("PA05_LIFECYCLE_OWNER_RECERTIFICATION_REQUIRED");
          return;
        }
        await tx.unsafe(
          "INSERT INTO " + a + ".pa05_plugin_write_lifecycle_gates " +
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
          "UPDATE " + a + ".pa05_plugin_write_lifecycle_gates " +
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
          "UPDATE " + a + ".pa05_plugin_write_lifecycle_gates " +
          "SET package_version=$2,state='ACTIVE',updated_at=clock_timestamp() " +
          "WHERE owner_package_id=$1",
          [packageId, version]
        );
      });
    },
    async getState(packageId) {
      const rows = await sql.unsafe(
        "SELECT package_version,state FROM " + a +
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
