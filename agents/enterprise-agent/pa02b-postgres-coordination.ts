import { createHash } from "node:crypto";
import postgres from "postgres";
import type { HostResolvedAgentDurabilityScopeV020 } from "../../contracts/agent-durability-async.js";

/**
 * PA-02B isolated coordinator. It is NOT a Host Run Store or an authorization provider.
 * Only the authenticated Host may construct scope or authorize effect reconciliation.
 */
export interface AgentLeaseV020 {
  runId: string;
  ownerId: string;
  fence: number;
  expiresAt: string;
}
export type AgentWriteStateV020 =
  "PREPARED" | "INVOKING" | "UNKNOWN" | "SUCCEEDED" | "DENIED" | "FAILED";
export interface AgentWriteIntentV020 {
  effectId: string;
  state: AgentWriteStateV020;
  inputDigest: string;
  runId: string;
  fence: number;
}
export interface AgentExecutionCoordinatorV020 {
  claimLease(input: { scope: HostResolvedAgentDurabilityScopeV020; runId: string; ownerId: string; ttlSeconds: number }): Promise<AgentLeaseV020 | undefined>;
  renewLease(input: { scope: HostResolvedAgentDurabilityScopeV020; lease: AgentLeaseV020; ttlSeconds: number }): Promise<AgentLeaseV020 | undefined>;
  prepareWrite(input: { scope: HostResolvedAgentDurabilityScopeV020; lease: AgentLeaseV020; effectId: string; inputDigest: string }): Promise<AgentWriteIntentV020 & { created: boolean }>;
  beginWrite(input: { scope: HostResolvedAgentDurabilityScopeV020; lease: AgentLeaseV020; effectId: string }): Promise<AgentWriteIntentV020>;
  completeWrite(input: { scope: HostResolvedAgentDurabilityScopeV020; lease: AgentLeaseV020; effectId: string; outcome: "SUCCEEDED" | "DENIED" | "FAILED" }): Promise<AgentWriteIntentV020>;
  markUnknown(input: { scope: HostResolvedAgentDurabilityScopeV020; effectId: string }): Promise<AgentWriteIntentV020>;
  getWrite(input: { scope: HostResolvedAgentDurabilityScopeV020; effectId: string }): Promise<AgentWriteIntentV020 | undefined>;
  close(): Promise<void>;
}
function required(s: unknown): string {
  if (typeof s !== "string" || !s.trim()) throw Error("PA02B_VALUE_REQUIRED");
  return s.trim();
}
function key(scope: HostResolvedAgentDurabilityScopeV020): string {
  const kind = scope.contextKind;
  if (kind !== "ENTERPRISE" && kind !== "PERSONAL") throw Error("PA02B_CONTEXT_INVALID");
  if (scope.principalActorType !== "HUMAN" && scope.principalActorType !== "AI") throw Error("PA02B_ACTOR_INVALID");
  if (kind === "PERSONAL" && scope.enterpriseId) throw Error("PA02B_PERSONAL_SCOPE_INVALID");
  const parts = ["pa02b-scope-v1",required(scope.principalSubjectId),scope.principalActorType,kind,required(scope.contextId),
    kind === "ENTERPRISE" ? required(scope.enterpriseId) : null];
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}
function ttl(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 3600) throw Error("PA02B_TTL_INVALID");
  return value;
}
function digest(value: string): string {
  if (!/^[0-9a-f]{64}$/.test(value)) throw Error("PA02B_DIGEST_INVALID");
  return value;
}
function lease(row: Record<string, unknown>): AgentLeaseV020 {
  return {
    runId: String(row.run_id), ownerId: String(row.owner_id), fence: Number(row.fence),
    expiresAt: new Date(String(row.expires_at)).toISOString()
  };
}
function write(row: Record<string, unknown>): AgentWriteIntentV020 {
  return {
    effectId: String(row.effect_id), state: row.state as AgentWriteStateV020,
    inputDigest: String(row.input_digest), runId: String(row.run_id), fence: Number(row.fence)
  };
}

/**
 * A committed INVOKING write must NEVER be invoked again solely because the
 * lease expired. UNKNOWN is a quarantine state, not permission to replay.
 * The actual business owner and Host must verify a terminal result separately.
 */
export async function createPostgresAgentExecutionCoordinatorV020(input: {
  connectionString: string; schema: string;
}): Promise<AgentExecutionCoordinatorV020> {
  const url = required(input.connectionString);
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(input.schema)) throw Error("PA02B_SCHEMA_INVALID");
  const q = '"' + input.schema + '"';
  const sql = postgres(url,{max:8,connect_timeout:10,idle_timeout:15});
  try {
    await sql.begin(async tx => {
      await tx.unsafe("CREATE SCHEMA IF NOT EXISTS " + q);
      await tx.unsafe("CREATE TABLE IF NOT EXISTS " + q + ".pa02b_leases ("+
        "scope_key text NOT NULL,run_id text NOT NULL,owner_id text NOT NULL,"+
        "fence bigint NOT NULL,expires_at timestamptz NOT NULL,"+
        "PRIMARY KEY(scope_key,run_id))");
      await tx.unsafe("CREATE TABLE IF NOT EXISTS " + q + ".pa02c_cancellations ("+
        "scope_key text NOT NULL,run_id text NOT NULL,requested_by text NOT NULL,"+
        "reason text NOT NULL,state text NOT NULL DEFAULT 'REQUESTED',"+
        "requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),"+
        "completed_at timestamptz,"+
        "CHECK(state IN ('REQUESTED','CANCELLED')),PRIMARY KEY(scope_key,run_id))");
      await tx.unsafe("CREATE TABLE IF NOT EXISTS " + q + ".pa02b_writes ("+
        "scope_key text NOT NULL,effect_id text NOT NULL,run_id text NOT NULL,"+
        "input_digest text NOT NULL,fence bigint NOT NULL,"+
        "state text NOT NULL CHECK(state IN ('PREPARED','INVOKING','UNKNOWN','SUCCEEDED','DENIED','FAILED')),"+
        "PRIMARY KEY(scope_key,effect_id))");
    });
  } catch (e) { await sql.end(); throw e; }

  async function scopedWrite(scope: HostResolvedAgentDurabilityScopeV020,effectId: string) {
    const rows = await sql.unsafe("SELECT * FROM " + q + ".pa02b_writes WHERE scope_key=$1 AND effect_id=$2",
      [key(scope),required(effectId)]);
    return rows.length ? write(rows[0]) : undefined;
  }
  async function assertLease(tx: any, scopeKey: string, l: AgentLeaseV020, allowAfterCancel = false) {
    const rows = await tx.unsafe("SELECT run_id FROM " + q + ".pa02b_leases "+
      "WHERE scope_key=$1 AND run_id=$2 AND owner_id=$3 AND fence=$4 "+
      "AND expires_at>clock_timestamp() FOR UPDATE",
      [scopeKey,required(l.runId),required(l.ownerId),l.fence]);
    if (!rows.length) throw Error("PA02B_LEASE_FENCED");
    if (!allowAfterCancel) {
      const cancelled=await tx.unsafe("SELECT state FROM "+q+".pa02c_cancellations "+
        "WHERE scope_key=$1 AND run_id=$2",[scopeKey,l.runId]);
      if(cancelled.length)throw Error("PA02C_CANCEL_REQUESTED");
    }
  }
  return {
    async claimLease(r) {
      const stopped=await sql.unsafe("SELECT state FROM "+q+".pa02c_cancellations "+
        "WHERE scope_key=$1 AND run_id=$2",[key(r.scope),required(r.runId)]);
      if(stopped.length)return undefined;
      const rows = await sql.unsafe("INSERT INTO " + q + ".pa02b_leases "+
        "(scope_key,run_id,owner_id,fence,expires_at) "+
        "VALUES($1,$2,$3,1,clock_timestamp()+($4::integer*interval '1 second')) "+
        "ON CONFLICT (scope_key,run_id) DO UPDATE SET "+
        "owner_id=EXCLUDED.owner_id,fence=" + q + ".pa02b_leases.fence+1,"+
        "expires_at=EXCLUDED.expires_at "+
        "WHERE " + q + ".pa02b_leases.expires_at<=clock_timestamp() "+
        "RETURNING run_id,owner_id,fence,expires_at",
        [key(r.scope),required(r.runId),required(r.ownerId),ttl(r.ttlSeconds)]);
      return rows.length ? lease(rows[0]) : undefined;
    },
    async renewLease(r) {
      const l = r.lease;
      const rows = await sql.unsafe("UPDATE " + q + ".pa02b_leases SET "+
        "expires_at=clock_timestamp()+($5::integer*interval '1 second') "+
        "WHERE scope_key=$1 AND run_id=$2 AND owner_id=$3 AND fence=$4 "+
        "AND expires_at>clock_timestamp() RETURNING run_id,owner_id,fence,expires_at",
        [key(r.scope),required(l.runId),required(l.ownerId),l.fence,ttl(r.ttlSeconds)]);
      return rows.length ? lease(rows[0]) : undefined;
    },
    async prepareWrite(r) {
      const scopeKey=key(r.scope),effectId=required(r.effectId),inputDigest=digest(r.inputDigest);
      return sql.begin(async tx => {
        await assertLease(tx,scopeKey,r.lease);
        const created=await tx.unsafe("INSERT INTO " + q + ".pa02b_writes "+
          "(scope_key,effect_id,run_id,input_digest,fence,state) VALUES($1,$2,$3,$4,$5,'PREPARED') "+
          "ON CONFLICT DO NOTHING RETURNING *",
          [scopeKey,effectId,r.lease.runId,inputDigest,r.lease.fence]);
        if(created.length)return {...write(created[0]),created:true};
        const old=await tx.unsafe("SELECT * FROM " + q + ".pa02b_writes WHERE scope_key=$1 AND effect_id=$2",
          [scopeKey,effectId]);
        if(!old.length||old[0].run_id!==r.lease.runId||old[0].input_digest!==inputDigest)
          throw Error("PA02B_WRITE_IDEMPOTENCY_CONFLICT");
        return {...write(old[0]),created:false};
      });
    },
    async beginWrite(r) {
      const scopeKey=key(r.scope),effectId=required(r.effectId);
      return sql.begin(async tx => {
        await assertLease(tx,scopeKey,r.lease);
        const rows=await tx.unsafe("UPDATE " + q + ".pa02b_writes "+
          "SET state='INVOKING',fence=$4 WHERE scope_key=$1 AND effect_id=$2 "+
          "AND run_id=$3 AND state='PREPARED' RETURNING *",
          [scopeKey,effectId,r.lease.runId,r.lease.fence]);
        if(!rows.length)throw Error("PA02B_WRITE_MAY_HAVE_EXECUTED");
        return write(rows[0]);
      });
    },
    async completeWrite(r) {
      const scopeKey=key(r.scope),effectId=required(r.effectId);
      if(!["SUCCEEDED","DENIED","FAILED"].includes(r.outcome))throw Error("PA02B_OUTCOME_INVALID");
      return sql.begin(async tx => {
        await assertLease(tx,scopeKey,r.lease,true);
        const rows=await tx.unsafe("UPDATE " + q + ".pa02b_writes "+
          "SET state=$4 WHERE scope_key=$1 AND effect_id=$2 AND run_id=$3 "+
          "AND fence=$5 AND state='INVOKING' RETURNING *",
          [scopeKey,effectId,r.lease.runId,r.outcome,r.lease.fence]);
        if(!rows.length)throw Error("PA02B_WRITE_FINALIZATION_CONFLICT");
        return write(rows[0]);
      });
    },
    async markUnknown(r) {
      const rows=await sql.unsafe("UPDATE " + q + ".pa02b_writes SET state='UNKNOWN' "+
        "WHERE scope_key=$1 AND effect_id=$2 AND state='INVOKING' RETURNING *",
        [key(r.scope),required(r.effectId)]);
      if(rows.length)return write(rows[0]);
      const old=await scopedWrite(r.scope,r.effectId);
      if(!old||old.state!=="UNKNOWN")throw Error("PA02B_WRITE_NOT_INVOKING");
      return old;
    },
    getWrite(r) { return scopedWrite(r.scope,r.effectId); },
    async close() { await sql.end(); }
  };
}
