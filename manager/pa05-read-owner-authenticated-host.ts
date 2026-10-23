import postgres from "postgres";

/**
 * PA05-05/E01J2 — isolated, opt-in authenticated PostgreSQL Host READ admission.
 *
 * The provisioning authority, role-to-Host mapping and SECURITY DEFINER
 * function are DBA-owned. This runtime deliberately has no DDL, epoch mutation,
 * declarative hostId, or AppManager mutation privilege. A successful result is
 * returned ONLY after the PostgreSQL read-lock transaction commits.
 *
 * The real production Host is NOT wired here; production identity/PKI, remote
 * network partition and AppManager cross-store atomicity are NOT certified.
 */
export interface Pa05AuthenticatedReadHostV010 {
  withReadAdmission<T>(input: {
    expectedEpoch: number;
    perform(verifiedHostId: string, sqlBackendPid: number): Promise<T>;
  }): Promise<T>;
  close(): Promise<void>;
}

function sqlSchema(value: string): string {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(value))
    throw Error("PA05_READ_SQL_SCHEMA_INVALID");
  return '"' + value + '"';
}

export function createPa05AuthenticatedReadHostV010(input: {
  connectionString: string;
  schema: string;
}): Pa05AuthenticatedReadHostV010 {
  const schema = sqlSchema(input.schema);
  if (typeof input.connectionString !== "string" ||
      !/^postgres(?:ql)?:\/\//.test(input.connectionString))
    throw Error("PA05_READ_SQL_AUTHORITY_URL_REQUIRED");
  // A production Host would receive this credential from a trusted secret
  // provider, never from a business/Agent request. Tests use isolated PG roles.
  const sql = postgres(input.connectionString, {
    max: 1, connect_timeout: 2, idle_timeout: 10,
    prepare: false
  });
  return {
    async withReadAdmission<T>({expectedEpoch, perform}: {
      expectedEpoch: number;
      perform(verifiedHostId: string, sqlBackendPid: number): Promise<T>;
    }): Promise<T> {
      if (!Number.isSafeInteger(expectedEpoch) || expectedEpoch < 1)
        throw Error("PA05_READ_SQL_EPOCH_INVALID");
      if (typeof perform !== "function")
        throw Error("PA05_READ_SQL_CALLBACK_REQUIRED");
      // The SECURITY DEFINER function checks PostgreSQL session_user, which
      // neither request JSON, custom GUC nor SET ROLE can falsify as a
      // non-superuser. Its FOR SHARE locks persist until THIS transaction ends.
      const result = await sql.begin(async tx => {
        const rows = await tx.unsafe(
          "SELECT " + schema +
          ".pa05_assert_authenticated_host_read($1::bigint) AS host_id, " +
          "pg_backend_pid() AS backend_pid",
          [expectedEpoch]
        );
        if (rows.length !== 1 ||
            typeof rows[0].host_id !== "string" ||
            !Number.isSafeInteger(Number(rows[0].backend_pid)))
          throw Error("PA05_READ_SQL_IDENTITY_PROOF_INVALID");
        return {
          value: await perform(
            rows[0].host_id as string, Number(rows[0].backend_pid)
          )
        };
      });
      // No business READ result is externally observable before COMMIT.
      // A broken/terminated central backend rejects this promise instead.
      return result.value as T;
    },
    async close() { await sql.end(); }
  };
}
