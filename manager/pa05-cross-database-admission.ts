import postgres from "postgres";

/**
 * PA05-04D9: opt-in CENTRAL admission prototype for Worker databases with no
 * shared PostgreSQL transaction. This does not enforce remote Worker SQL.
 * The Host MUST NOT connect it to production WRITE until the remote Worker,
 * trusted principal, DB role and Owner verifier are independently certified.
 */
export interface Pa05CrossDatabaseReservationAuthorityV010 {
  /** D14B2 opt-in immutable trusted Host binding, if configured. */
  readonly boundHostId?: string;
  readonly boundHostRevision?: number;
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
  /**
   * Host-only, manually initiated retirement of ONE central reservation.
   * Owner must already be FROZEN. The callback is an independent trusted
   * business-Owner verification port, never an Agent/Worker payload.
   * Verification executes while holding the central Owner row lock and any
   * missing/ambiguous evidence rolls the transaction back (fail closed).
   */
  settleVerified(input: {
    packageId: string; version: string; workerId: string;
    reservationId: string; effectDigest: string;
    verifyOwnerTerminal(): Promise<{
      outcome: "SUCCEEDED" | "DENIED" | "FAILED";
      receiptId: string; evidenceDigest: string;
    }>;
  }): Promise<{state:"SETTLED" | "ALREADY_SETTLED"; pendingCount:number}>;

  getTrustedWorkerIds(packageId:string):Promise<string[]>;
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
  /**
   * D13 optional isolated SQL governance. Requires a non-superuser Host
   * LOGIN and exactly declared central-DB Worker LOGIN identities.
   * Every authority mutation rechecks Worker ACLs (including drift).
   * This does not attest identity across independently authenticated DBs.
   */
  enforceCentralSqlIdentity?: boolean;
  centralHostLoginRole?: string;
  centralWorkerLoginRoles?: readonly string[];
  /**
   * D14B2: Host-provisioned identity, NOT an Agent/Worker argument.
   * The central manifest is administrator-owned; its ACTIVE state and
   * revision are locked in the SAME tx that inserts a reservation.
   * This checks an out-of-band identity declaration, not a cryptographic
   * machine identity or a remote credential atomic transaction.
   */
  boundHost?: {
    hostId:string; revision:number; centralLogin:string; manifestSchema:string;
  };
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
  const strict = input.enforceCentralSqlIdentity === true;
  const roleName = (r: string): string => {
    if(typeof r!=="string"||!/^[a-z_][a-z0-9_]{0,62}$/.test(r))
      throw Error("PA05_XDB_CENTRAL_SQL_ROLE_INVALID");
    return r;
  };
  const expectedHost = strict ? roleName(input.centralHostLoginRole!) : "";
  const workerLogins = strict
    ? (input.centralWorkerLoginRoles??[]).map(roleName)
    : [];
  if(strict && (!workerLogins.length ||
    new Set(workerLogins).size !== workerLogins.length ||
    workerLogins.includes(expectedHost)))
    throw Error("PA05_XDB_CENTRAL_SQL_MEMBERSHIP_INVALID");
  const principal = input.boundHost ? {
    hostId:name(input.boundHost.hostId),
    revision:input.boundHost.revision,
    centralLogin:roleName(input.boundHost.centralLogin),
    schema:input.boundHost.manifestSchema
  } : undefined;
  if(principal && (!Number.isSafeInteger(principal.revision)||
     principal.revision<1||typeof principal.schema!=="string"||
     !/^[a-z][a-z0-9_]{0,62}$/.test(principal.schema)))
    throw Error("PA05_XDB_PRINCIPAL_FENCE_CONFIG_INVALID");
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
      "created_at timestamptz NOT NULL DEFAULT clock_timestamp()," +
      "state text NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','SETTLED'))," +
      "terminal_outcome text,terminal_receipt_id text,terminal_evidence_digest text," +
      "settled_at timestamptz)"
    );
    // Existing D9 central schemas migrate conservatively. All historic rows
    // remain PENDING, never inferred terminal merely because a remote WRITE
    // might have completed. Keep settled rows permanently for forensic audit.
    await sql.unsafe("ALTER TABLE " + a +
      ".pa05_xdb_reservations ADD COLUMN IF NOT EXISTS state text NOT NULL " +
      "DEFAULT 'PENDING' CHECK(state IN ('PENDING','SETTLED'))");
    await sql.unsafe("ALTER TABLE " + a +
      ".pa05_xdb_reservations ADD COLUMN IF NOT EXISTS terminal_outcome text");
    await sql.unsafe("ALTER TABLE " + a +
      ".pa05_xdb_reservations ADD COLUMN IF NOT EXISTS terminal_receipt_id text");
    await sql.unsafe("ALTER TABLE " + a +
      ".pa05_xdb_reservations ADD COLUMN IF NOT EXISTS terminal_evidence_digest text");
    await sql.unsafe("ALTER TABLE " + a +
      ".pa05_xdb_reservations ADD COLUMN IF NOT EXISTS settled_at timestamptz");
    if(strict) {
      // The Host schema/table owner has CREATE authority only within this
      // isolated database. Pin actual LOGIN not SET ROLE, which cannot
      // change SESSION_USER. Privileged Host compromise remains out of scope.
      const login=await sql.unsafe("SELECT SESSION_USER AS login");
      if(login.length!==1||login[0].login!==expectedHost)
        throw Error("PA05_XDB_CENTRAL_HOST_LOGIN_MISMATCH");
      const host=await sql.unsafe("SELECT rolsuper,rolbypassrls,rolcreaterole,"+
        "rolcreatedb,rolreplication,rolcanlogin FROM pg_roles WHERE rolname=$1",
        [expectedHost]);
      if(host.length!==1||!host[0].rolcanlogin||host[0].rolsuper||
        host[0].rolbypassrls||host[0].rolcreaterole||
        host[0].rolcreatedb||host[0].rolreplication)
        throw Error("PA05_XDB_CENTRAL_HOST_ROLE_UNSAFE");
      const plpgsql=[
        "BEGIN",
        "IF SESSION_USER != '"+expectedHost+"' THEN",
        " RAISE EXCEPTION 'PA05_XDB_CENTRAL_WRONG_HOST_LOGIN'; END IF;",
        "IF TG_OP='INSERT' THEN RETURN NEW; END IF;",
        "IF TG_OP='DELETE' THEN",
        " RAISE EXCEPTION 'PA05_XDB_CENTRAL_AUDIT_DELETE_DENIED'; END IF;",
        "IF OLD.state='SETTLED' THEN",
        " RAISE EXCEPTION 'PA05_XDB_CENTRAL_SETTLED_IMMUTABLE'; END IF;",
        "IF NEW.reservation_id IS DISTINCT FROM OLD.reservation_id OR",
        " NEW.owner_package_id IS DISTINCT FROM OLD.owner_package_id OR",
        " NEW.worker_id IS DISTINCT FROM OLD.worker_id OR",
        " NEW.effect_digest IS DISTINCT FROM OLD.effect_digest OR",
        " NEW.created_at IS DISTINCT FROM OLD.created_at THEN",
        " RAISE EXCEPTION 'PA05_XDB_CENTRAL_RESERVATION_IMMUTABLE'; END IF;",
        "IF OLD.state!='PENDING' OR NEW.state!='SETTLED' OR",
        " NEW.terminal_outcome NOT IN ('SUCCEEDED','DENIED','FAILED') OR",
        " NEW.terminal_receipt_id IS NULL OR",
        " length(NEW.terminal_receipt_id)=0 OR",
        " NEW.terminal_evidence_digest !~ '^[0-9a-f]{64}$' OR",
        " NEW.settled_at IS NULL THEN",
        " RAISE EXCEPTION 'PA05_XDB_CENTRAL_ILLEGAL_TRANSITION'; END IF;",
        "RETURN NEW; END;"
      ].join("\n");
      await sql.begin(async tx=>{
        await tx.unsafe("CREATE OR REPLACE FUNCTION "+a+
          ".pa05_xdb_protect_audit() RETURNS trigger LANGUAGE plpgsql "+
          "SECURITY DEFINER SET search_path=pg_catalog AS $pa05$"+
          plpgsql+"$pa05$");
        await tx.unsafe("DROP TRIGGER IF EXISTS pa05_xdb_protect_audit ON "+a+
          ".pa05_xdb_reservations");
        await tx.unsafe("CREATE TRIGGER pa05_xdb_protect_audit BEFORE INSERT OR UPDATE OR DELETE ON "+
          a+".pa05_xdb_reservations FOR EACH ROW EXECUTE FUNCTION "+
          a+".pa05_xdb_protect_audit()");
        await tx.unsafe("CREATE OR REPLACE FUNCTION "+a+
          ".pa05_xdb_forbid_truncate() RETURNS trigger LANGUAGE plpgsql "+
          "SECURITY DEFINER SET search_path=pg_catalog AS $pa05$"+
          "BEGIN RAISE EXCEPTION 'PA05_XDB_CENTRAL_AUDIT_TRUNCATE_DENIED'; END;"+
          "$pa05$");
        await tx.unsafe("DROP TRIGGER IF EXISTS pa05_xdb_no_truncate ON "+a+
          ".pa05_xdb_reservations");
        await tx.unsafe("CREATE TRIGGER pa05_xdb_no_truncate BEFORE TRUNCATE ON "+
          a+".pa05_xdb_reservations FOR EACH STATEMENT EXECUTE FUNCTION "+
          a+".pa05_xdb_forbid_truncate()");
        // Host membership + lifecycle rows also resist accidentally GRANTed
        // worker DML; Worker SQL privilege drift is not an authorization path.
        const onlyHost=[
          "BEGIN",
          "IF SESSION_USER != '"+expectedHost+"' THEN",
          " RAISE EXCEPTION 'PA05_XDB_CENTRAL_WRONG_HOST_LOGIN'; END IF;",
          "IF TG_OP='DELETE' THEN",
          " RAISE EXCEPTION 'PA05_XDB_CENTRAL_AUTHORITY_DELETE_DENIED'; END IF;",
          "IF TG_OP='UPDATE' THEN",
          " IF TG_TABLE_NAME='pa05_xdb_workers' THEN",
          "  RAISE EXCEPTION 'PA05_XDB_CENTRAL_MEMBERSHIP_IMMUTABLE'; END IF;",
          " IF NEW.owner_package_id IS DISTINCT FROM OLD.owner_package_id OR",
          "  NEW.package_version IS DISTINCT FROM OLD.package_version THEN",
          "  RAISE EXCEPTION 'PA05_XDB_CENTRAL_OWNER_IMMUTABLE'; END IF;",
          "END IF;",
          "RETURN NEW; END;"
        ].join("\n");
        await tx.unsafe("CREATE OR REPLACE FUNCTION "+a+
          ".pa05_xdb_host_only() RETURNS trigger LANGUAGE plpgsql "+
          "SECURITY DEFINER SET search_path=pg_catalog AS $pa05$"+
          onlyHost+"$pa05$");
        for(const table of ["pa05_xdb_owners","pa05_xdb_workers"]){
          await tx.unsafe("DROP TRIGGER IF EXISTS pa05_xdb_host_only ON "+
            a+"."+table);
          await tx.unsafe("CREATE TRIGGER pa05_xdb_host_only BEFORE INSERT OR UPDATE OR DELETE ON "+
            a+"."+table+" FOR EACH ROW EXECUTE FUNCTION "+a+".pa05_xdb_host_only()");
          await tx.unsafe("DROP TRIGGER IF EXISTS pa05_xdb_no_truncate ON "+
            a+"."+table);
          await tx.unsafe("CREATE TRIGGER pa05_xdb_no_truncate BEFORE TRUNCATE ON "+
            a+"."+table+" FOR EACH STATEMENT EXECUTE FUNCTION "+a+".pa05_xdb_forbid_truncate()");
        }
      });
    }
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
  // D13: fail closed if a privileged GRANT drifts any trusted Worker role.
  // Audited on every central mutator's SQL transaction, after its Owner lock.
  async function auditWorkerRoles(tx: any): Promise<void> {
    if (!strict) return;
    for (const role of workerLogins) {
      const rows=await tx.unsafe(
        "SELECT r.rolcanlogin,r.rolsuper,r.rolbypassrls,r.rolcreaterole,"+
        "r.rolcreatedb,r.rolreplication,"+
        "pg_has_role(r.oid,h.oid,'MEMBER') AS host_member,"+
        "pg_has_role(r.oid,d.datdba,'MEMBER') AS database_owner,"+
        "has_schema_privilege(r.oid,n.oid,'CREATE') AS schema_create,"+
        "EXISTS(SELECT 1 FROM pg_class c WHERE c.relnamespace=n.oid "+
        "AND c.relname IN ('pa05_xdb_workers','pa05_xdb_owners','pa05_xdb_reservations') "+
        "AND (pg_has_role(r.oid,c.relowner,'MEMBER') OR "+
        "has_table_privilege(r.oid,c.oid,'INSERT') OR "+
        "has_table_privilege(r.oid,c.oid,'UPDATE') OR "+
        "has_table_privilege(r.oid,c.oid,'DELETE') OR "+
        "has_table_privilege(r.oid,c.oid,'TRUNCATE') OR "+
        "has_table_privilege(r.oid,c.oid,'TRIGGER'))) AS can_mutate "+
        "FROM pg_roles r JOIN pg_roles h ON h.rolname=$3 "+
        "JOIN pg_namespace n ON n.nspname=$2 "+
        "JOIN pg_database d ON d.datname=current_database() "+
        "WHERE r.rolname=$1",
        [role,input.authoritySchema,expectedHost]);
      if (rows.length!==1||!rows[0].rolcanlogin||rows[0].rolsuper||
        rows[0].rolbypassrls||rows[0].rolcreaterole||
        rows[0].rolcreatedb||rows[0].rolreplication||
        rows[0].host_member||rows[0].database_owner||
        rows[0].schema_create||rows[0].can_mutate)
        throw Error("PA05_XDB_CENTRAL_WORKER_SQL_PRIVILEGE_DRIFT");
    }
  }
  if (strict) {
    try {await auditWorkerRoles(sql);} catch(error) {await sql.end();throw error;}
  }
  async function lockPrincipalManifest(tx:any,ownerId:string,workerId:string){
    if(!principal)return;
    const allowed=workers.filter(w=>w.ownerPackageId===ownerId)
      .map(w=>w.workerId).sort();
    // SELECT FOR SHARE takes row locks that conflict with a trusted
    // administrator's UPDATE REVOKED / revision rotation; revocation and
    // reservation therefore have an unambiguous central commit order.
    const rows=await tx.unsafe(
      'SELECT host_id,revision,worker_id,central_login,state FROM "'+
      principal.schema+'".pa05_xdb_host_identity_bindings '+
      'WHERE host_id=$1 ORDER BY worker_id FOR SHARE',[principal.hostId]);
    if(rows.length!==allowed.length||
       rows.some((r:any,i:number)=>r.host_id!==principal.hostId||
         Number(r.revision)!==principal.revision||
         r.worker_id!==allowed[i]||
         r.central_login!==principal.centralLogin||r.state!=="ACTIVE")||
       !allowed.includes(workerId))
      throw Error("PA05_XDB_PRINCIPAL_FENCE_REVOKED_OR_MISMATCHED");
  }
  const pending = async (tx: any, id: string): Promise<number> => {
    const rows = await tx.unsafe("SELECT count(*)::integer AS n FROM " + a +
      ".pa05_xdb_reservations WHERE owner_package_id=$1 AND state='PENDING'", [id]);
    return Number(rows[0].n);
  };
  const lock = async (tx: any, id: string) => {
    const rows = await tx.unsafe("SELECT package_version,state FROM " + a +
      ".pa05_xdb_owners WHERE owner_package_id=$1 FOR UPDATE", [id]);
    if (rows.length !== 1) throw Error("PA05_XDB_OWNER_NOT_REGISTERED");
    await auditWorkerRoles(tx);
    return rows[0] as {package_version: string;state: string};
  };
  return {
    ...(principal ? {
      boundHostId:principal.hostId,
      boundHostRevision:principal.revision
    } : {}),
    async registerFrozenOwner(packageId, version) {
      packageId = name(packageId); version = versionId(version);
      await auditWorkerRoles(sql);
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
        // The central transaction locks current Host identity rows, not an
        // earlier client-side preflight snapshot. A committed revoke cannot
        // admit a new reservation; a concurrent revoke waits for our commit.
        await lockPrincipalManifest(tx,packageId,workerId);
        const membership = await tx.unsafe("SELECT 1 FROM " + a +
          ".pa05_xdb_workers WHERE worker_id=$1 AND owner_package_id=$2",
          [workerId,packageId]);
        if (!membership.length) throw Error("PA05_XDB_WORKER_UNREGISTERED");
        await tx.unsafe("INSERT INTO " + a +
          ".pa05_xdb_reservations(reservation_id,owner_package_id,worker_id,effect_digest) " +
          "VALUES($1,$2,$3,$4) ON CONFLICT (reservation_id) DO NOTHING",
          [reservationId,packageId,workerId,effectDigest]);
        const rows = await tx.unsafe("SELECT owner_package_id,worker_id,effect_digest,state FROM " +
          a + ".pa05_xdb_reservations WHERE reservation_id=$1", [reservationId]);
        if (rows.length !== 1 || rows[0].owner_package_id !== packageId ||
          rows[0].worker_id !== workerId || rows[0].effect_digest !== effectDigest)
          throw Error("PA05_XDB_RESERVATION_REUSE_CONFLICT");
        if (rows[0].state !== "PENDING")
          throw Error("PA05_XDB_SETTLED_RESERVATION_CANNOT_REOPEN");
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
    async settleVerified({packageId,version,workerId,reservationId,effectDigest,verifyOwnerTerminal}) {
      packageId=name(packageId);version=versionId(version);
      workerId=name(workerId);reservationId=sha256(reservationId);
      effectDigest=sha256(effectDigest);
      if(typeof verifyOwnerTerminal!=="function")
        throw Error("PA05_XDB_TRUSTED_OWNER_VERIFIER_REQUIRED");
      return sql.begin(async tx=>{
        const owner=await lock(tx,packageId);
        if(owner.state!=="FROZEN"||owner.package_version!==version)
          throw Error("PA05_XDB_SETTLEMENT_REQUIRES_FROZEN_OWNER");
        const rows=await tx.unsafe(
          "SELECT * FROM "+a+".pa05_xdb_reservations WHERE reservation_id=$1 FOR UPDATE",
          [reservationId]);
        if(rows.length!==1||rows[0].owner_package_id!==packageId||
          rows[0].worker_id!==workerId||rows[0].effect_digest!==effectDigest)
          throw Error("PA05_XDB_SETTLEMENT_IDENTITY_CONFLICT");
        // No prior terminal is trusted without a fresh Owner-side verification.
        // A network outage or a false/unresolved verifier holds the central
        // database transaction (and hence lifecycle) FROZEN.
        const terminal=await verifyOwnerTerminal();
        if(!terminal||!["SUCCEEDED","DENIED","FAILED"].includes(terminal.outcome)||
          typeof terminal.receiptId!=="string"||!terminal.receiptId.trim()||
          terminal.receiptId.length>512)
          throw Error("PA05_XDB_OWNER_TERMINAL_NOT_VERIFIED");
        const evidenceDigest=sha256(terminal.evidenceDigest);
        const original=rows[0];
        if(original.state==="SETTLED") {
          if(original.terminal_outcome!==terminal.outcome||
            original.terminal_receipt_id!==terminal.receiptId||
            original.terminal_evidence_digest!==evidenceDigest)
            throw Error("PA05_XDB_SETTLEMENT_TERMINAL_CONFLICT");
          return {state:"ALREADY_SETTLED" as const,pendingCount:await pending(tx,packageId)};
        }
        if(original.state!=="PENDING")
          throw Error("PA05_XDB_SETTLEMENT_STATE_INVALID");
        await tx.unsafe("UPDATE "+a+".pa05_xdb_reservations SET state='SETTLED',"+
          "terminal_outcome=$2,terminal_receipt_id=$3,terminal_evidence_digest=$4,"+
          "settled_at=clock_timestamp() WHERE reservation_id=$1 AND state='PENDING'",
          [reservationId,terminal.outcome,terminal.receiptId,evidenceDigest]);
        return {state:"SETTLED" as const,pendingCount:await pending(tx,packageId)};
      });
    },
    async getTrustedWorkerIds(packageId){
      packageId=name(packageId);
      const rows=await sql.unsafe("SELECT worker_id FROM "+a+
        ".pa05_xdb_workers WHERE owner_package_id=$1 ORDER BY worker_id",
        [packageId]);
      if(!rows.length)throw Error("PA05_XDB_TRUSTED_REMOTE_INVENTORY_EMPTY");
      return rows.map(x=>String(x.worker_id));
    },
    async getState(packageId) {
      packageId = name(packageId);
      await auditWorkerRoles(sql);
      const rows = await sql.unsafe("SELECT package_version,state FROM " + a +
        ".pa05_xdb_owners WHERE owner_package_id=$1", [packageId]);
      if (!rows.length) return undefined;
      return {state:rows[0].state as "ACTIVE"|"FROZEN",
        version:rows[0].package_version,
        pendingCount:await sql.unsafe("SELECT count(*)::integer AS n FROM " + a +
          ".pa05_xdb_reservations WHERE owner_package_id=$1 AND state='PENDING'", [packageId])
          .then(x=>Number(x[0].n))};
    },
    async close() {await sql.end();}
  };
}
