import postgres from "postgres";

/**
 * PA05-04D9: opt-in CENTRAL admission prototype for Worker databases with no
 * shared PostgreSQL transaction. This does not enforce remote Worker SQL.
 * The Host MUST NOT connect it to production WRITE until the remote Worker,
 * trusted principal, DB role and Owner verifier are independently certified.
 */
export interface Pa05CrossDatabaseReservationAuthorityV010 {
  /** Explicit certified Owner activation: registration always starts FROZEN. */
  registerFrozenOwner(packageId: string, version: string): Promise<void>;
  reopenOwner(input: {
    packageId: string; version: string;
    trustedOwnerReady(): Promise<boolean> | boolean;
  }): Promise<void>;
  /** Reserve BEFORE contacting a remote business database or business Owner. */
  reserve(input: {
    packageId: string; version: string; workerId: string;
    reservationId: string; effectDigest: string;
  }): Promise<void>;
  /** Persist FROZEN before reading unresolved reservations, in one CENTRAL tx. */
  freeze(packageId: string): Promise<{state: "FROZEN"; pendingCount: number}>;
  getState(packageId: string): Promise<
    {state: "FROZEN" | "ACTIVE"; version: string; pendingCount: number} | undefined>;
  close(): Promise<void>;
}
export interface Pa05CrossDatabaseTrustedWorkerV010 {
  workerId: string;
  /** Host-declared opaque identifier; not a client-supplied URL or credential. */
  databaseId: string;
  ownerPackageId: string;
}
const name = (value: string): string => {
  if (typeof value !== "string" || !/^[a-zA-Z][a-zA-Z0-9_.-]{0,127}$/.test(value))
    throw Error("PA05_XDB_TRUSTED_ID_INVALID");
  return value;
};
const versionId = (value: string): string => {
  if (typeof value !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(value))
    throw Error("PA05_XDB_VERSION_INVALID");
  return value;
};
const sha256 = (value: string): string => {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value))
    throw Error("PA05_XDB_DIGEST_INVALID");
  return value;
};
const equal = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * The sole Host-owned PostgreSQL authority. A pending row is a CONSERVATIVE
 * "may have invoked" marker, not a new domain receipt or permission to retry.
 * No Worker-accessible complete/delete method is exposed. Recovery and
 * cross-database receipt verification are separate, still unsigned gates.
 */
export async function createPa05CrossDatabaseReservationAuthorityV010(input: {
  authorityConnectionString: string;
  authoritySchema: string;
  trustedWorkers: readonly Pa05CrossDatabaseTrustedWorkerV010[];
}): Promise<Pa05CrossDatabaseReservationAuthorityV010> {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(input.authoritySchema))
    throw Error("PA05_XDB_SCHEMA_INVALID");
  if (!input.authorityConnectionString)
    throw Error("PA05_XDB_CONNECTION_REQUIRED");
  const workers = input.trustedWorkers.map(w => ({
    workerId: name(w.workerId), databaseId: name(w.databaseId),
    ownerPackageId: name(w.ownerPackageId)
  })).sort((a,b) => a.workerId.localeCompare(b.workerId));
  if (!workers.length || new Set(workers.map(w => w.workerId)).size !== workers.length)
    throw Error("PA05_XDB_INVENTORY_INVALID");
  const a = '"' + input.authoritySchema + '"';
  const sql = postgres(input.authorityConnectionString, {
    max: 8, connect_timeout: 10, idle_timeout: 15
  });
  try {
    await sql.unsafe("CREATE SCHEMA IF NOT EXISTS " + a);
    await sql.unsafe(
      "CREATE TABLE IF NOT EXISTS " + a + ".pa05_xdb_workers (" +
      "worker_id text PRIMARY KEY,database_id text NOT NULL,owner_package_id text NOT NULL)"
    );
    await sql.unsafe(
      "CREATE TABLE IF NOT EXISTS " + a + ".pa05_xdb_owners (" +
      "owner_package_id text PRIMARY KEY,package_version text NOT NULL," +
      "state text NOT NULL CHECK(state IN ('FROZEN','ACTIVE'))," +
      "updated_at timestamptz NOT NULL DEFAULT clock_timestamp())"
    );
    await sql.unsafe(
      "CREATE TABLE IF NOT EXISTS " + a + ".pa05_xdb_reservations (" +
      "reservation_id text PRIMARY KEY,owner_package_id text NOT NULL," +
      "worker_id text NOT NULL,effect_digest text NOT NULL," +
      "created_at timestamptz NOT NULL DEFAULT clock_timestamp())"
    );
    // Guard membership with a centralized transaction; constructing an
    // alternate Host with a partial/different inventory fails CLOSED.
    await sql.begin(async tx => {
      await tx.unsafe("SELECT pg_advisory_xact_lock(hashtext($1))",
        ["PA05_XDB_INVENTORY:" + input.authoritySchema]);
      const existing = await tx.unsafe("SELECT worker_id,database_id,owner_package_id " +
        "FROM " + a + ".pa05_xdb_workers ORDER BY worker_id");
      if (existing.length) {
        if (!equal(existing, workers.map(w => ({
          worker_id: w.workerId, database_id: w.databaseId,
          owner_package_id: w.ownerPackageId
        })))) throw Error("PA05_XDB_INVENTORY_CHANGED");
      } else {
        for (const w of workers) await tx.unsafe("INSERT INTO " + a +
          ".pa05_xdb_workers(worker_id,database_id,owner_package_id) VALUES($1,$2,$3)",
          [w.workerId,w.databaseId,w.ownerPackageId]);
      }
    });
  } catch (error) {
    await sql.end();
    throw error;
  }
  const pending = async (tx: any, id: string): Promise<number> => {
    const rows = await tx.unsafe("SELECT count(*)::integer AS n FROM " + a +
      ".pa05_xdb_reservations WHERE owner_package_id=$1", [id]);
    return Number(rows[0].n);
  };
  const lock = async (tx: any, id: string) => {
    const rows = await tx.unsafe("SELECT package_version,state FROM " + a +
      ".pa05_xdb_owners WHERE owner_package_id=$1 FOR UPDATE", [id]);
    if (rows.length !== 1) throw Error("PA05_XDB_OWNER_NOT_REGISTERED");
    return rows[0] as {package_version: string;state: string};
  };
  return {
    async registerFrozenOwner(packageId, version) {
      packageId = name(packageId); version = versionId(version);
      if (!workers.some(w => w.ownerPackageId === packageId))
        throw Error("PA05_XDB_OWNER_UNTRUSTED");
      await sql.begin(async tx => {
        await tx.unsafe("INSERT INTO " + a +
          ".pa05_xdb_owners(owner_package_id,package_version,state) " +
          "VALUES($1,$2,'FROZEN') ON CONFLICT (owner_package_id) DO NOTHING",
          [packageId,version]);
        const existing = await lock(tx,packageId);
        if (existing.package_version !== version)
          throw Error("PA05_XDB_OWNER_VERSION_RECERTIFICATION_REQUIRED");
        // Re-register must never thaw or reset a previous FROZEN state.
      });
    },
    async reopenOwner({packageId,version,trustedOwnerReady}) {
      packageId = name(packageId); version = versionId(version);
      if (typeof trustedOwnerReady !== "function" || !await trustedOwnerReady())
        throw Error("PA05_XDB_OWNER_RECERTIFICATION_REQUIRED");
      await sql.begin(async tx => {
        const owner = await lock(tx,packageId);
        if (owner.package_version !== version || owner.state !== "FROZEN")
          throw Error("PA05_XDB_REOPEN_DENIED");
        if (await pending(tx,packageId))
          throw Error("PA05_XDB_PENDING_RESERVATIONS");
        await tx.unsafe("UPDATE " + a + ".pa05_xdb_owners " +
          "SET state='ACTIVE',updated_at=clock_timestamp() WHERE owner_package_id=$1",
          [packageId]);
      });
    },
    async reserve({packageId,version,workerId,reservationId,effectDigest}) {
      packageId = name(packageId); version = versionId(version);
      workerId = name(workerId); reservationId = sha256(reservationId);
      effectDigest = sha256(effectDigest);
      await sql.begin(async tx => {
        const owner = await lock(tx,packageId);
        if (owner.state !== "ACTIVE" || owner.package_version !== version)
          throw Error("PA05_XDB_ADMISSION_FROZEN_OR_VERSION_CHANGED");
        const membership = await tx.unsafe("SELECT 1 FROM " + a +
          ".pa05_xdb_workers WHERE worker_id=$1 AND owner_package_id=$2",
          [workerId,packageId]);
        if (!membership.length) throw Error("PA05_XDB_WORKER_UNREGISTERED");
        await tx.unsafe("INSERT INTO " + a +
          ".pa05_xdb_reservations(reservation_id,owner_package_id,worker_id,effect_digest) " +
          "VALUES($1,$2,$3,$4) ON CONFLICT (reservation_id) DO NOTHING",
          [reservationId,packageId,workerId,effectDigest]);
        const rows = await tx.unsafe("SELECT owner_package_id,worker_id,effect_digest FROM " +
          a + ".pa05_xdb_reservations WHERE reservation_id=$1", [reservationId]);
        if (rows.length !== 1 || rows[0].owner_package_id !== packageId ||
          rows[0].worker_id !== workerId || rows[0].effect_digest !== effectDigest)
          throw Error("PA05_XDB_RESERVATION_REUSE_CONFLICT");
      });
    },
    async freeze(packageId) {
      packageId = name(packageId);
      return sql.begin(async tx => {
        await lock(tx,packageId);
        await tx.unsafe("UPDATE " + a + ".pa05_xdb_owners " +
          "SET state='FROZEN',updated_at=clock_timestamp() WHERE owner_package_id=$1",
          [packageId]);
        return {state: "FROZEN" as const,pendingCount:await pending(tx,packageId)};
      });
    },
    async getState(packageId) {
      packageId = name(packageId);
      const rows = await sql.unsafe("SELECT package_version,state FROM " + a +
        ".pa05_xdb_owners WHERE owner_package_id=$1", [packageId]);
      if (!rows.length) return undefined;
      return {state:rows[0].state as "ACTIVE"|"FROZEN",
        version:rows[0].package_version,
        pendingCount:await sql.unsafe("SELECT count(*)::integer AS n FROM " + a +
          ".pa05_xdb_reservations WHERE owner_package_id=$1", [packageId])
          .then(x=>Number(x[0].n))};
    },
    async close() {await sql.end();}
  };
}
