import postgres from "postgres";
import { materializeAgentRunsV010 } from "../../manager/agent-run-store.js";
import type { AgentRunEventV010, AgentRunV010 } from "../../contracts/agent-run.js";
import type { HostResolvedAgentDurabilityScopeV020 } from "../../contracts/agent-durability-async.js";
import { hostAgentRunScopeKeyV020 } from "./pa02a-postgres-durability-proof.js";
import { hostAgentDurabilityScopeKeyV020 } from "./pa02b-postgres-coordination.js";

export interface AgentAtomicCancellationV020 {
  runId: string;
  state: "REQUESTED" | "CANCELLED";
  runState: AgentRunV010["state"];
  revision: number;
}
export interface AgentAtomicCancellationPortV020 {
  request(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    runId: string;
    requestedBy: string;
    reason: string;
  }): Promise<AgentAtomicCancellationV020>;
  commitSafe(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    runId: string;
    eventId: string;
    occurredAt: string;
  }): Promise<AgentAtomicCancellationV020>;
  get(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    runId: string;
  }): Promise<AgentAtomicCancellationV020 | undefined>;
  close(): Promise<void>;
}

function required(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw Error("PA02C_ATOMIC_VALUE_REQUIRED");
  }
  return value.trim();
}

function materialize(rows: readonly Record<string, unknown>[]): AgentRunV010 {
  const events = rows.map(row =>
    (typeof row.payload === "string"
      ? JSON.parse(row.payload)
      : row.payload) as AgentRunEventV010
  );
  const runs = materializeAgentRunsV010(events);
  if (runs.length !== 1) throw Error("PA02C_ATOMIC_RUN_EVENTS_INCONSISTENT");
  return runs[0];
}

/**
 * Formal V010 event semantics, still an ISOLATED PostgreSQL integration proof.
 * Cancellation intent, the final RUN_CANCELLED and run revision commit inside
 * one DB transaction. The same per-scope/run advisory lock is REQUIRED on
 * every PA02B claim/begin path. Existing production Host is not wired here.
 */
export async function createPostgresAtomicAgentRunCancellationV020(input: {
  connectionString: string;
  schema: string;
}): Promise<AgentAtomicCancellationPortV020> {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(input.schema)) {
    throw Error("PA02C_ATOMIC_SCHEMA_INVALID");
  }
  const q = '"' + input.schema + '"';
  const sql = postgres(required(input.connectionString), {
    max: 8, connect_timeout: 10, idle_timeout: 15
  });
  try {
    const tables = await sql.unsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema=$1 "+
      "AND table_name IN ('agent_turns','agent_run_events','agent_receipts',"+
      "'pa02b_leases','pa02b_writes','pa02c_cancellations')", [input.schema]
    );
    if (new Set(tables.map(x => x.table_name)).size !== 6) {
      throw Error("PA02C_ATOMIC_COORDINATORS_REQUIRED");
    }
  } catch (error) {
    await sql.end();
    throw error;
  }

  function keys(scope: HostResolvedAgentDurabilityScopeV020) {
    return {
      runScope: hostAgentRunScopeKeyV020(scope),
      executionScope: hostAgentDurabilityScopeKeyV020(scope)
    };
  }
  async function lock(
    tx: any, executionScope: string, runId: string
  ): Promise<void> {
    await tx.unsafe("SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))",
      [executionScope + ":" + runId]);
  }
  async function rowForRun(tx: any, runScope: string, runId: string) {
    const turns = await tx.unsafe(
      "SELECT run_id,revision FROM "+q+".agent_turns "+
      "WHERE scope_key=$1 AND run_id=$2 FOR UPDATE", [runScope,runId]
    );
    if (!turns.length) throw Error("PA02C_ATOMIC_RUN_NOT_FOUND");
    const events = await tx.unsafe(
      "SELECT payload FROM "+q+".agent_run_events "+
      "WHERE run_id=$1 ORDER BY ordinal ASC", [runId]
    );
    const run = materialize(events);
    return {revision:Number(turns[0].revision),run};
  }
  function response(
    runId: string, state: AgentAtomicCancellationV020["state"],
    run: AgentRunV010, revision: number
  ): AgentAtomicCancellationV020 {
    return {runId,state,runState:run.state,revision};
  }

  return {
    async request(r) {
      const runId=required(r.runId),requestedBy=required(r.requestedBy),reason=required(r.reason);
      const {runScope,executionScope}=keys(r.scope);
      if (requestedBy!==r.scope.principalSubjectId) {
        throw Error("PA02C_ATOMIC_REQUESTER_SCOPE_MISMATCH");
      }
      return sql.begin(async tx => {
        await lock(tx,executionScope,runId);
        const {run,revision}=await rowForRun(tx,runScope,runId);
        if (run.state==="CANCELLED") {
          const old=await tx.unsafe("SELECT state FROM "+q+".pa02c_cancellations "+
            "WHERE scope_key=$1 AND run_id=$2",[executionScope,runId]);
          if (old.length && old[0].state==="CANCELLED") {
            return response(runId,"CANCELLED",run,revision);
          }
          throw Error("PA02C_ATOMIC_CANCEL_MISSING");
        }
        if (["SUCCEEDED","FAILED","BLOCKED"].includes(run.state)) {
          throw Error("PA02C_ATOMIC_RUN_TERMINAL");
        }
        await tx.unsafe("INSERT INTO "+q+".pa02c_cancellations "+
          "(scope_key,run_id,requested_by,reason) VALUES($1,$2,$3,$4) "+
          "ON CONFLICT (scope_key,run_id) DO NOTHING",
          [executionScope,runId,requestedBy,reason]);
        return response(runId,"REQUESTED",run,revision);
      });
    },
    async commitSafe(r) {
      const runId=required(r.runId),eventId=required(r.eventId);
      if (!Number.isFinite(Date.parse(r.occurredAt))) {
        throw Error("PA02C_ATOMIC_EVENT_TIME_INVALID");
      }
      const {runScope,executionScope}=keys(r.scope);
      return sql.begin(async tx => {
        await lock(tx,executionScope,runId);
        const {run,revision}=await rowForRun(tx,runScope,runId);
        const cancelRows=await tx.unsafe(
          "SELECT state FROM "+q+".pa02c_cancellations "+
          "WHERE scope_key=$1 AND run_id=$2 FOR UPDATE",
          [executionScope,runId]
        );
        if (!cancelRows.length) throw Error("PA02C_ATOMIC_REQUEST_REQUIRED");
        if (run.state==="CANCELLED" && cancelRows[0].state==="CANCELLED") {
          return response(runId,"CANCELLED",run,revision);
        }
        if (cancelRows[0].state!=="REQUESTED" ||
          ["SUCCEEDED","FAILED","BLOCKED","CANCELLED"].includes(run.state)) {
          throw Error("PA02C_ATOMIC_TERMINAL_CONFLICT");
        }
        const inFlight=await tx.unsafe(
          "SELECT 1 FROM "+q+".pa02b_leases WHERE "+
          "scope_key=$1 AND run_id=$2 AND expires_at>clock_timestamp() FOR UPDATE",
          [executionScope,runId]
        );
        if (inFlight.length) throw Error("PA02C_WORKER_NOT_QUIESCED");
        const uncertain=await tx.unsafe(
          "SELECT 1 FROM "+q+".pa02b_writes "+
          "WHERE scope_key=$1 AND run_id=$2 AND state IN ('INVOKING','UNKNOWN') FOR UPDATE",
          [executionScope,runId]
        );
        if (uncertain.length) throw Error("PA02C_UNCONFIRMED_WRITE");
        const pendingReceipts=await tx.unsafe(
          "SELECT 1 FROM "+q+".agent_receipts "+
          "WHERE scope_key=$1 AND status='REQUESTED' AND "+
          "(request_payload IS NULL OR request_payload->>'sourceInteractionId'=$2) FOR UPDATE",
          [runScope,runId]
        );
        if (pendingReceipts.length) throw Error("PA02C_UNCONFIRMED_RECEIPT");
        const original=await tx.unsafe(
          "SELECT payload FROM "+q+".agent_run_events "+
          "WHERE run_id=$1 ORDER BY ordinal ASC",[runId]
        );
        const events:AgentRunEventV010[]=[];
        const verifiedOwnerReceiptIds:string[]=[];
        // A material Owner may have committed while the Human requested
        // cancellation, before the Worker could append its observation.
        // Preserve this *already verified* fact in the CANCELLED Run, in the
        // very same SQL transaction. Never manufacture success from INVOKING,
        // UNKNOWN, a self-asserted model result, or an unlinked Receipt.
        const linkTable=await tx.unsafe("SELECT to_regclass($1) AS name",
          [input.schema+".pa02b_owner_links"]);
        if(linkTable[0]?.name) {
          const effects=await tx.unsafe(
            "SELECT w.state,w.input_digest,l.effect_id,l.receipt_id,"+
            "l.owner_package_id,l.evidence_ref,l.evidence_digest,"+
            "l.reconciled_at,l.terminal_payload,"+
            "a.status AS receipt_status,a.request_payload "+
            "FROM "+q+".pa02b_writes w "+
            "LEFT JOIN "+q+".pa02b_owner_links l "+
            "ON l.scope_key=w.scope_key AND l.effect_id=w.effect_id "+
            "LEFT JOIN "+q+".agent_receipts a "+
            "ON a.scope_key=$3 AND a.receipt_id=l.receipt_id "+
            "WHERE w.scope_key=$1 AND w.run_id=$2 "+
            "AND w.state IN ('SUCCEEDED','FAILED','DENIED') "+
            "ORDER BY w.effect_id FOR UPDATE OF w",
            [executionScope,runId,runScope]
          );
          for(const effect of effects) {
            const receipt=typeof effect.request_payload==="string"
              ?JSON.parse(effect.request_payload):effect.request_payload;
            const terminal=typeof effect.terminal_payload==="string"
              ?JSON.parse(effect.terminal_payload):effect.terminal_payload;
            const decision=run.decisions.find(d=>
              d.decisionEventId===receipt?.sourceActionId &&
              d.decision.type==="tool" &&
              d.decision.call.tool===receipt?.toolId);
            if(!effect.receipt_id||!effect.evidence_ref||
              !effect.evidence_digest||!effect.reconciled_at||
              effect.receipt_status!==effect.state||
              terminal?.receiptId!==effect.receipt_id||
              terminal?.status!==effect.state||
              receipt?.sourceInteractionId!==runId||
              receipt?.ownerPackageId!==effect.owner_package_id||
              receipt?.inputDigest!==effect.input_digest||
              receipt?.principalSubjectId!==r.scope.principalSubjectId||
              receipt?.principalActorType!==r.scope.principalActorType||
              receipt?.context?.contextId!==r.scope.contextId||
              (run.context.kind==="ENTERPRISE"&&
                receipt?.context?.enterpriseId!==r.scope.enterpriseId))
              throw Error("PA02C_OWNER_RECEIPT_EVIDENCE_REQUIRED");
            // Older isolated PA-02B proof Runs have durable Owner receipts
            // but deliberately never had model decisions. Retain only their
            // already VERIFIED receipt reference, never forge an observation.
            // A real Run with any decisions MUST match the original model
            // decision exactly (no fallback for a mismatched tool).
            if(!decision||!decision.sliceId) {
              if(run.decisions.length>0)
                throw Error("PA02C_OWNER_RECEIPT_DECISION_MISMATCH");
              verifiedOwnerReceiptIds.push(String(effect.receipt_id));
              continue;
            }
            verifiedOwnerReceiptIds.push(String(effect.receipt_id));
            if(decision.observation)continue;
            if(decision.sliceId!==run.activeSliceId)
              throw Error("PA02C_OWNER_DECISION_SLICE_NOT_ACTIVE");
            const status=effect.state as "SUCCEEDED"|"FAILED"|"DENIED";
            events.push({
              contractVersion:"0.1.0",runId,
              eventId:eventId+":owner:"+events.length,
              type:"TOOL_OBSERVATION_RECORDED",
              occurredAt:r.occurredAt,sliceId:decision.sliceId,
              payload:{
                decisionEventId:decision.decisionEventId,
                receiptId:String(effect.receipt_id),
                observation:{
                  tool:receipt.toolId,ok:status==="SUCCEEDED",
                  ...(status==="SUCCEEDED"
                    ?{result:{receiptId:effect.receipt_id,status}}
                    :{error:{code:"PA02_WORKER_OWNER_"+status,
                        message:"Business Owner verified terminal "+status}})
                }
              }
            });
          }
        }
        events.push({
          contractVersion:"0.1.0",eventId,runId,type:"RUN_CANCELLED",
          occurredAt:r.occurredAt,
          payload:verifiedOwnerReceiptIds.length
            ?{verifiedOwnerReceiptIds}:{} 
        });
        // Same reducer that governs all Host Run states, with an atomic
        // revision/ordinal advance for Owner observations AND cancellation.
        const resulting=materialize([...original,...events.map(payload=>({payload}))]);
        const updated=await tx.unsafe(
          "UPDATE "+q+".agent_turns SET revision=revision+$4 "+
          "WHERE scope_key=$1 AND run_id=$2 AND revision=$3 RETURNING revision",
          [runScope,runId,revision,events.length]
        );
        if(updated.length!==1)throw Error("PA02C_ATOMIC_RUN_REVISION_CONFLICT");
        for(let i=0;i<events.length;i++) {
          await tx.unsafe(
            "INSERT INTO "+q+".agent_run_events "+
            "(event_id,run_id,ordinal,payload) VALUES($1,$2,$3,$4::jsonb)",
            [events[i].eventId,runId,revision+i+1,JSON.stringify(events[i])]
          );
        }
        const done=await tx.unsafe(
          "UPDATE "+q+".pa02c_cancellations SET "+
          "state='CANCELLED',completed_at=clock_timestamp() "+
          "WHERE scope_key=$1 AND run_id=$2 AND state='REQUESTED' RETURNING state",
          [executionScope,runId]
        );
        if(done.length!==1)throw Error("PA02C_ATOMIC_CANCEL_CONFLICT");
        return response(runId,"CANCELLED",resulting,Number(updated[0].revision));
      });
    },
    async get(r) {
      const runId=required(r.runId);
      const {runScope,executionScope}=keys(r.scope);
      const rows=await sql.unsafe(
        "SELECT c.state,t.revision FROM "+q+".pa02c_cancellations c "+
        "JOIN "+q+".agent_turns t ON t.run_id=c.run_id "+
        "WHERE c.scope_key=$1 AND c.run_id=$2 AND t.scope_key=$3",
        [executionScope,runId,runScope]
      );
      if(!rows.length)return undefined;
      const events=await sql.unsafe(
        "SELECT payload FROM "+q+".agent_run_events "+
        "WHERE run_id=$1 ORDER BY ordinal ASC",[runId]
      );
      return response(runId,rows[0].state,materialize(events),Number(rows[0].revision));
    },
    async close() { await sql.end(); }
  };
}
