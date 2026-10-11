import { createHash } from "node:crypto";
import postgres from "postgres";
import type { AgentRunEventV010 } from "../../contracts/agent-run.js";
import type {
  AsyncAgentRunReceiptRepositoryV020,
  AgentTurnClaimInputV020,
  AgentTurnClaimResultV020,
  HostResolvedAgentDurabilityScopeV020,
  AgentReceiptBeginInputV020,
  AgentReceiptRecordV020
} from "../../contracts/agent-durability-async.js";

/** Isolated PA-02A Postgres proof only. Never wired to production Host or old sync store. */
function required(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("PA02A_REQUIRED_VALUE");
  return value.trim();
}
function scopeKey(scope: HostResolvedAgentDurabilityScopeV020): string {
  const subject = required(scope.principalSubjectId);
  const context = required(scope.contextId);
  if (scope.principalActorType !== "HUMAN" && scope.principalActorType !== "AI") throw new Error("PA02A_SCOPE_ACTOR_INVALID");
  if (scope.contextKind !== "ENTERPRISE" && scope.contextKind !== "PERSONAL") throw new Error("PA02A_SCOPE_KIND_INVALID");
  const enterprise = scope.contextKind === "ENTERPRISE" ? required(scope.enterpriseId) : null;
  if (scope.contextKind === "PERSONAL" && scope.enterpriseId) throw new Error("PA02A_PERSONAL_SCOPE_INVALID");
  // Caller MUST be the authorized Host; client-supplied scope is never trusted.
  return createHash("sha256").update(JSON.stringify(["pa02a-v0.2",subject,scope.principalActorType,scope.contextKind,context,enterprise])).digest("hex");
}
function ensureDigest(value: string): string {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) throw new Error("PA02A_DIGEST_INVALID");
  return value;
}
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b))
      .map(([key,child])=>[key,stable(child)])
  );
  return value;
}
function same(a: unknown, b: unknown): boolean {
  // postgres.js may surface jsonb as text under different parser configurations.
  const raw = typeof a === "string" ? JSON.parse(a) as unknown : a;
  return JSON.stringify(stable(raw)) === JSON.stringify(stable(b));
}
function runRecord(row: Record<string,unknown>, created: boolean): AgentTurnClaimResultV020 {
  return {created,runId:String(row.run_id),taskDigest:String(row.task_digest),revision:Number(row.revision)};
}
function receiptRecord(row: Record<string,unknown>): AgentReceiptRecordV020 {
  return {receiptId:String(row.receipt_id),status:row.status as AgentReceiptRecordV020["status"],
    inputDigest:String(row.input_digest),revision:Number(row.revision)};
}

export async function createPostgresAgentDurabilityProofV020(input:{
  connectionString:string;
  schema:string;
}):Promise<AsyncAgentRunReceiptRepositoryV020> {
  const url=required(input.connectionString);
  if(!/^[a-z][a-z0-9_]{0,62}$/.test(input.schema))throw new Error("PA02A_SCHEMA_INVALID");
  const q='"'+input.schema+'"';
  const sql=postgres(url,{max:8,connect_timeout:10,idle_timeout:15});
  try {
    await sql.begin(async tx=>{
      await tx.unsafe("CREATE SCHEMA IF NOT EXISTS "+q);
      await tx.unsafe("CREATE TABLE IF NOT EXISTS "+q+".agent_turns ("+
        "run_id text PRIMARY KEY,scope_key text NOT NULL,thread_id text NOT NULL,"+
        "client_turn_id text NOT NULL,task_digest text NOT NULL,task_payload jsonb NOT NULL,"+
        "revision integer NOT NULL DEFAULT 0,UNIQUE(scope_key,thread_id,client_turn_id))");
      await tx.unsafe("CREATE TABLE IF NOT EXISTS "+q+".agent_run_events ("+
        "event_id text PRIMARY KEY,run_id text NOT NULL REFERENCES "+q+".agent_turns(run_id),"+
        "ordinal integer NOT NULL,payload jsonb NOT NULL,UNIQUE(run_id,ordinal))");
      await tx.unsafe("CREATE TABLE IF NOT EXISTS "+q+".agent_receipts ("+
        "receipt_id text PRIMARY KEY,scope_key text NOT NULL,idempotency_key text NOT NULL,"+
        "input_digest text NOT NULL,status text NOT NULL DEFAULT 'REQUESTED',"+
        "revision integer NOT NULL DEFAULT 0,"+
        "CHECK(status IN ('REQUESTED','SUCCEEDED','FAILED','DENIED')),"+
        "UNIQUE(scope_key,idempotency_key))");
    });
  } catch(error) {await sql.end();throw error;}

  const getByTurn=async (r:{scope:HostResolvedAgentDurabilityScopeV020;threadId:string;clientTurnId:string;}):
  Promise<AgentTurnClaimResultV020|undefined>=>{
    const rows=await sql.unsafe("SELECT run_id,task_digest,revision FROM "+q+".agent_turns "+
      "WHERE scope_key=$1 AND thread_id=$2 AND client_turn_id=$3",
      [scopeKey(r.scope),required(r.threadId),required(r.clientTurnId)]);
    return rows[0]?runRecord(rows[0],false):undefined;
  };
  const getReceipt=async (r:{scope:HostResolvedAgentDurabilityScopeV020;receiptId:string;}):
  Promise<AgentReceiptRecordV020|undefined>=>{
    const rows=await sql.unsafe("SELECT receipt_id,status,input_digest,revision FROM "+q+".agent_receipts "+
      "WHERE scope_key=$1 AND receipt_id=$2",[scopeKey(r.scope),required(r.receiptId)]);
    return rows[0]?receiptRecord(rows[0]):undefined;
  };
  return {
    async claimTurn(r:AgentTurnClaimInputV020) {
      const key=scopeKey(r.scope),thread=required(r.threadId),turn=required(r.clientTurnId),hash=ensureDigest(r.taskDigest);
      if(!r.taskPayload||typeof r.taskPayload!=="object"||Array.isArray(r.taskPayload))throw new Error("PA02A_TASK_INVALID");
      const event=r.created;
      if(event.type!=="RUN_CREATED"||!event.eventId?.trim()||!event.runId?.trim())throw new Error("PA02A_CREATED_EVENT_REQUIRED");
      return sql.begin(async tx=>{
        const inserted=await tx.unsafe("INSERT INTO "+q+".agent_turns "+
          "(run_id,scope_key,thread_id,client_turn_id,task_digest,task_payload) "+
          "VALUES($1,$2,$3,$4,$5,$6::jsonb) ON CONFLICT DO NOTHING "+
          "RETURNING run_id,task_digest,revision,task_payload",
          [event.runId,key,thread,turn,hash,JSON.stringify(stable(r.taskPayload))]);
        if(inserted.length) {
          await tx.unsafe("INSERT INTO "+q+".agent_run_events "+
            "(event_id,run_id,ordinal,payload) VALUES($1,$2,0,$3::jsonb)",
            [event.eventId,event.runId,JSON.stringify(event)]);
          return runRecord(inserted[0],true);
        }
        const rows=await tx.unsafe("SELECT run_id,task_digest,revision,task_payload FROM "+q+
          ".agent_turns WHERE scope_key=$1 AND thread_id=$2 AND client_turn_id=$3",[key,thread,turn]);
        if(!rows.length||rows[0].task_digest!==hash||!same(rows[0].task_payload,r.taskPayload))
          throw new Error("CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED");
        return runRecord(rows[0],false);
      });
    },
    getByTurn,
    async appendRunEvent(r) {
      const key=scopeKey(r.scope),run=required(r.runId),event=r.event;
      if(event.runId!==run||!event.eventId?.trim()||event.type==="RUN_CREATED")
        throw new Error("PA02A_RUN_EVENT_INVALID");
      if(!Number.isInteger(r.expectedRevision)||r.expectedRevision<0)throw new Error("PA02A_REVISION_INVALID");
      return sql.begin(async tx=>{
        const rows=await tx.unsafe("UPDATE "+q+".agent_turns SET revision=revision+1 "+
          "WHERE scope_key=$1 AND run_id=$2 AND revision=$3 RETURNING revision",
          [key,run,r.expectedRevision]);
        if(!rows.length)throw new Error("PA02A_RUN_REVISION_CONFLICT");
        await tx.unsafe("INSERT INTO "+q+".agent_run_events "+
          "(event_id,run_id,ordinal,payload) VALUES($1,$2,$3,$4::jsonb)",
          [event.eventId,run,Number(rows[0].revision),JSON.stringify(event)]);
        return {revision:Number(rows[0].revision)};
      });
    },
    async listRunEvents(r) {
      const rows=await sql.unsafe("SELECT e.payload FROM "+q+".agent_run_events e "+
        "JOIN "+q+".agent_turns t ON e.run_id=t.run_id "+
        "WHERE t.scope_key=$1 AND e.run_id=$2 ORDER BY e.ordinal ASC",
        [scopeKey(r.scope),required(r.runId)]);
      return rows.map(x=>structuredClone(x.payload as AgentRunEventV010));
    },
    async beginReceipt(r:AgentReceiptBeginInputV020) {
      const key=scopeKey(r.scope),receipt=r.receipt;
      const id=required(receipt.receiptId),idem=required(receipt.idempotencyKey),hash=ensureDigest(receipt.inputDigest);
      return sql.begin(async tx=>{
        const inserted=await tx.unsafe("INSERT INTO "+q+".agent_receipts "+
          "(receipt_id,scope_key,idempotency_key,input_digest,status) "+
          "VALUES($1,$2,$3,$4,'REQUESTED') ON CONFLICT DO NOTHING "+
          "RETURNING receipt_id,status,input_digest,revision",[id,key,idem,hash]);
        if(inserted.length)return {...receiptRecord(inserted[0]),created:true};
        const rows=await tx.unsafe("SELECT receipt_id,status,input_digest,revision "+
          "FROM "+q+".agent_receipts WHERE scope_key=$1 AND idempotency_key=$2",[key,idem]);
        if(!rows.length||rows[0].input_digest!==hash)throw new Error("PA02A_RECEIPT_IDEMPOTENCY_CONFLICT");
        return {...receiptRecord(rows[0]),created:false};
      });
    },
    async completeReceipt(r) {
      const key=scopeKey(r.scope),id=required(r.receiptId);
      if(!["SUCCEEDED","FAILED","DENIED"].includes(r.status))throw new Error("PA02A_TERMINAL_INVALID");
      const rows=await sql.unsafe("UPDATE "+q+".agent_receipts "+
        "SET status=$3,revision=revision+1 WHERE scope_key=$1 AND receipt_id=$2 "+
        "AND status='REQUESTED' RETURNING receipt_id,status,input_digest,revision",
        [key,id,r.status]);
      if(rows.length)return {...receiptRecord(rows[0]),transitioned:true};
      const old=await getReceipt({scope:r.scope,receiptId:id});
      if(!old||old.status!==r.status)throw new Error("PA02A_RECEIPT_TERMINAL_CONFLICT");
      return {...old,transitioned:false};
    },
    getReceipt,
    async close() {await sql.end();}
  };
}
