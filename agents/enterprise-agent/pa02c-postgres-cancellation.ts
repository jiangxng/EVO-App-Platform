import postgres from "postgres";
import type { HostResolvedAgentDurabilityScopeV020 } from "../../contracts/agent-durability-async.js";
import { hostAgentDurabilityScopeKeyV020 } from "./pa02b-postgres-coordination.js";

export interface AgentCancellationV020 {
  runId: string;
  status: "REQUESTED" | "CANCELLED";
  requestedBy: string;
  reason: string;
}
export interface AgentCancellationCoordinatorV020 {
  request(input: { scope: HostResolvedAgentDurabilityScopeV020; runId: string; requestedBy: string; reason: string }): Promise<AgentCancellationV020>;
  get(input: { scope: HostResolvedAgentDurabilityScopeV020; runId: string }): Promise<AgentCancellationV020 | undefined>;
  completeSafe(input: { scope: HostResolvedAgentDurabilityScopeV020; runId: string }): Promise<AgentCancellationV020>;
  close(): Promise<void>;
}
function value(s: string): string {
  if (typeof s !== "string" || !s.trim()) throw Error("PA02C_VALUE_REQUIRED");
  return s.trim();
}
function record(r: Record<string, unknown>): AgentCancellationV020 {
  return {runId:String(r.run_id),status:r.state as AgentCancellationV020["status"],
    requestedBy:String(r.requested_by),reason:String(r.reason)};
}
/**
 * Isolated cancellation proof. CANCELLED here is a coordinator-only fact, NOT
 * a persisted AgentRun RUN_CANCELLED event. The official Host must atomically
 * project this with its authoritative async Run state, after Worker quiescence.
 */
export async function createPostgresAgentCancellationCoordinatorV020(input: {
  connectionString: string; schema: string;
}): Promise<AgentCancellationCoordinatorV020> {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(input.schema)) throw Error("PA02C_SCHEMA_INVALID");
  const q='"'+input.schema+'"';
  const sql=postgres(value(input.connectionString),{max:6,connect_timeout:10,idle_timeout:15});
  // Reuse PA-02B migrations: do not create a parallel authority or silently
  // install an independent standalone business plugin from this helper.
  try {
    const rows=await sql.unsafe("SELECT 1 FROM information_schema.tables "+
      "WHERE table_schema=$1 AND table_name='pa02c_cancellations'",[input.schema]);
    if(!rows.length)throw Error("PA02C_PA02B_COORDINATOR_REQUIRED");
  } catch(e) {await sql.end();throw e;}

  const scopeKey=(r:HostResolvedAgentDurabilityScopeV020)=>hostAgentDurabilityScopeKeyV020(r);
  return {
    async request(r) {
      const scope=scopeKey(r.scope),runId=value(r.runId),requestedBy=value(r.requestedBy),reason=value(r.reason);
      const rows=await sql.unsafe("INSERT INTO "+q+".pa02c_cancellations "+
        "(scope_key,run_id,requested_by,reason) VALUES($1,$2,$3,$4) "+
        "ON CONFLICT (scope_key,run_id) DO NOTHING RETURNING *",[scope,runId,requestedBy,reason]);
      if(rows.length)return record(rows[0]);
      const existing=await sql.unsafe("SELECT * FROM "+q+".pa02c_cancellations WHERE scope_key=$1 AND run_id=$2",
        [scope,runId]);
      if(!existing.length)throw Error("PA02C_CANCEL_RACE");
      // A duplicate request cannot overwrite the auditable original request.
      return record(existing[0]);
    },
    async get(r) {
      const rows=await sql.unsafe("SELECT * FROM "+q+".pa02c_cancellations WHERE scope_key=$1 AND run_id=$2",
        [scopeKey(r.scope),value(r.runId)]);
      return rows.length?record(rows[0]):undefined;
    },
    async completeSafe(r) {
      const scope=scopeKey(r.scope),runId=value(r.runId);
      return sql.begin(async tx=>{
        const rows=await tx.unsafe("SELECT * FROM "+q+".pa02c_cancellations "+
          "WHERE scope_key=$1 AND run_id=$2 FOR UPDATE",[scope,runId]);
        if(!rows.length)throw Error("PA02C_REQUEST_REQUIRED");
        if(rows[0].state==="CANCELLED")return record(rows[0]);
        // Lease timeout alone is not enough when an external write may have
        // committed before its receipt was durably finalized.
        const inFlight=await tx.unsafe("SELECT owner_id FROM "+q+".pa02b_leases "+
          "WHERE scope_key=$1 AND run_id=$2 AND expires_at>clock_timestamp() FOR UPDATE",
          [scope,runId]);
        if(inFlight.length)throw Error("PA02C_WORKER_NOT_QUIESCED");
        const unknown=await tx.unsafe("SELECT effect_id FROM "+q+".pa02b_writes "+
          "WHERE scope_key=$1 AND run_id=$2 AND state IN ('INVOKING','UNKNOWN') FOR UPDATE",
          [scope,runId]);
        if(unknown.length)throw Error("PA02C_UNCONFIRMED_WRITE");
        // PREPARED has never been dispatched; B's beginWrite observes this
        // cancellation request and must reject any post-cancel dispatch.
        const updated=await tx.unsafe("UPDATE "+q+".pa02c_cancellations "+
          "SET state='CANCELLED',completed_at=clock_timestamp() "+
          "WHERE scope_key=$1 AND run_id=$2 AND state='REQUESTED' RETURNING *",
          [scope,runId]);
        if(updated.length!==1)throw Error("PA02C_FINALIZATION_CONFLICT");
        return record(updated[0]);
      });
    },
    async close(){await sql.end();}
  };
}
