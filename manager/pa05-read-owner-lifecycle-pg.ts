import postgres from "postgres";
import type {
  Pa05HostReadLifecycleAuthorityV010,
  Pa05ReadLifecycleRemovalV010
} from "./pa05-read-owner-host-lifecycle.js";

/**
 * PA05/E01J4E — PostgreSQL-owned, least-privilege lifecycle operations.
 *
 * The pre-provisioned DBA-owned SECURITY DEFINER function authenticates the
 * LOGIN session_user, pins the Host and Package, serializes the READ approval
 * cut with the original READ lock, and records the intent atomically.
 *
 * This runtime only has schema USAGE and EXECUTE on explicitly trusted\n * transition/pending functions; the pending function is E01J4F opt-in. It has
 * no SELECT/INSERT/UPDATE/DELETE on central authority tables and no DDL.
 * The PostgreSQL functions and role grants MUST be provisioned separately.
 * An old E01J4D table-grant database without this function fails CLOSED.
 */
export function createPa05ReadLifecyclePgAuthorityV010(input: {
  connectionString: string;
  schema: string;
  hostId: string;
}): Pa05HostReadLifecycleAuthorityV010 & {
  pending(): Promise<{operationId:string;operation:"DISABLE"|"UNINSTALL"} | null>;
  close(): Promise<void>;
} {
  if (!input.connectionString?.trim()
      || !/^postgres(?:ql)?:\/\//.test(input.connectionString)
      || !/^[a-z][a-z0-9_]{0,62}$/.test(input.schema)
      || !/^[a-z0-9][a-z0-9_-]{2,79}$/.test(input.hostId)) {
    throw new Error("PA05_READ_LIFECYCLE_SQL_CONFIGURATION_INVALID");
  }
  const db=postgres(input.connectionString,{
    max:1,prepare:false,connect_timeout:3
  });
  const schema='"'+input.schema+'"';
  const owner="evo-purchase-attention";

  async function transition(
    phase:"FENCE"|"ASSERT"|"COMPLETE",
    ctx:{operationId:string;operation:Pa05ReadLifecycleRemovalV010;packageId:string}
  ):Promise<void> {
    if(ctx.packageId!==owner
        || !["DISABLE","UNINSTALL"].includes(ctx.operation)
        || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{7,79}$/.test(ctx.operationId))
      throw new Error("PA05_READ_LIFECYCLE_SQL_OPERATION_INVALID");
    // One PostgreSQL function call = one atomic database transaction.
    // No request-supplied actor and no GUC-based Host identity.
    // Only a DBA can grant EXECUTE and change its session_user mapping.
    const result=await db.unsafe(
      "SELECT "+schema+
        ".pa05_read_lifecycle_operator_transition("+
        "$1::text,$2::text,$3::text,$4::text) AS authenticated_host_id",
      [phase,ctx.operationId,ctx.operation,input.hostId]
    );
    if(result.length!==1 || result[0].authenticated_host_id!==input.hostId)
      throw Error("PA05_READ_LIFECYCLE_SQL_IDENTITY_PROOF_INVALID");
  }
  return {
    async fence(ctx){await transition("FENCE",ctx);},
    async assertFenced(ctx){await transition("ASSERT",ctx);},
    async complete(ctx){await transition("COMPLETE",ctx);},
    async pending(){
      // DBA-owned SECURITY DEFINER discovery is confined to *this*
      // PostgreSQL-authenticated login's own Host and FENCED intents.
      // No caller may supply operation id/type, or query central tables.
      const rows=await db.unsafe(
        "SELECT operation_id,operation FROM "+schema+
          ".pa05_read_lifecycle_operator_pending($1::text)",
        [input.hostId]
      );
      if(rows.length===0)return null;
      if(rows.length!==1 || !["DISABLE","UNINSTALL"].includes(rows[0].operation)
         || typeof rows[0].operation_id!=="string")
        throw Error("PA05_READ_LIFECYCLE_PENDING_AMBIGUOUS");
      return {
        operationId:rows[0].operation_id,
        operation:rows[0].operation as "DISABLE"|"UNINSTALL"
      };
    },
    async close(){await db.end({timeout:2});}
  };
}
