import postgres from "postgres";
import type { AgentActionReceiptTerminalInputV010 } from "../../contracts/agent-action-receipt.js";
import type { HostResolvedAgentDurabilityScopeV020 } from "../../contracts/agent-durability-async.js";
import type { AgentLeaseV020 } from "./pa02b-postgres-coordination.js";
import { hostAgentRunScopeKeyV020 } from "./pa02a-postgres-durability-proof.js";
import { hostAgentDurabilityScopeKeyV020 } from "./pa02b-postgres-coordination.js";

export interface AgentOwnerVerificationV030 {
  /**
   * Only a Host-registered business owner can produce this result. Neither the
   * model nor an Agent caller may provide the terminal attestation.
   */
  outcome: "UNRESOLVED" | "SUCCEEDED" | "FAILED" | "DENIED";
  evidenceRef?: string;
  evidenceDigest?: string;
  terminal?: AgentActionReceiptTerminalInputV010;
}
export interface AgentOwnerVerifierV030 {
  verify(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    runId: string;
    effectId: string;
    receiptId: string;
    ownerPackageId: string;
    inputDigest: string;
  }): Promise<AgentOwnerVerificationV030>;
}
export interface AgentWriteReconciliationResultV030 {
  effectId: string;
  receiptId: string;
  status: "UNKNOWN" | "SUCCEEDED" | "FAILED" | "DENIED";
  reconciled: boolean;
  evidenceRef?: string;
}
export interface AgentWriteReconciliationPortV030 {
  bind(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    lease: AgentLeaseV020;
    effectId: string;
    receiptId: string;
    ownerPackageId: string;
  }): Promise<{created:boolean;receiptId:string}>;
  reconcile(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    effectId: string;
  }): Promise<AgentWriteReconciliationResultV030>;
  get(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    effectId: string;
  }): Promise<AgentWriteReconciliationResultV030|undefined>;
  close(): Promise<void>;
}
function required(s:unknown):string {
  if(typeof s!=="string"||!s.trim())throw Error("PA02B_OWNER_ID_REQUIRED");
  return s.trim();
}
function sha256(s:unknown):string {
  if(typeof s!=="string"||!/^[a-f0-9]{64}$/.test(s))
    throw Error("PA02B_OWNER_EVIDENCE_DIGEST_INVALID");
  return s;
}
function toObject(raw:unknown):Record<string,unknown> {
  if(!raw)throw Error("PA02B_OWNER_RECEIPT_PROVENANCE_REQUIRED");
  const parsed=typeof raw==="string"?JSON.parse(raw):raw;
  if(typeof parsed!=="object"||parsed===null||Array.isArray(parsed))
    throw Error("PA02B_OWNER_RECEIPT_PROVENANCE_INVALID");
  return parsed as Record<string,unknown>;
}
function result(row:Record<string,unknown>):AgentWriteReconciliationResultV030 {
  return {
    effectId:String(row.effect_id),receiptId:String(row.receipt_id),
    status:row.state as AgentWriteReconciliationResultV030["status"],
    reconciled:row.state!=="UNKNOWN",
    ...(row.evidence_ref ? {evidenceRef:String(row.evidence_ref)} : {})
  };
}
function verifiedTerminal(v:AgentOwnerVerificationV030,receiptId:string) {
  if(v.outcome==="UNRESOLVED")return undefined;
  const term=v.terminal;
  if(!term||term.receiptId!==receiptId||term.status!==v.outcome||
    !Number.isFinite(Date.parse(term.completedAt)) ||
    !v.evidenceRef?.trim())throw Error("PA02B_OWNER_ATTESTATION_INVALID");
  sha256(v.evidenceDigest);
  return term;
}

/**
 * Isolated PA-02B owner recovery bridge. No actual WRITE is performed here.
 *
 * The Host registers a trusted Owner verifier separately. A model-supplied
 * result, a timeout, and an absent provider CANNOT produce a terminal receipt.
 * Immutable owner evidence and terminal WRITE/Receipt are committed atomically.
 * No automatic replay of an uncertain business operation is possible.
 */
export async function createPostgresAgentOwnerReconciliationV030(input: {
  connectionString: string;
  schema: string;
  ownerVerifier: AgentOwnerVerifierV030;
}): Promise<AgentWriteReconciliationPortV030> {
  if(!/^[a-z][a-z0-9_]{0,62}$/.test(input.schema))
    throw Error("PA02B_OWNER_SCHEMA_INVALID");
  if(typeof input.ownerVerifier?.verify!=="function")
    throw Error("PA02B_OWNER_VERIFIER_REQUIRED");
  const q='"'+input.schema+'"';
  const sql=postgres(required(input.connectionString),{max:8,connect_timeout:10,idle_timeout:15});
  try{
    const tables=await sql.unsafe("SELECT table_name FROM information_schema.tables "+
      "WHERE table_schema=$1 AND table_name IN "+
      "('agent_turns','agent_receipts','pa02b_leases','pa02b_writes','pa02c_cancellations')",
      [input.schema]);
    if(new Set(tables.map(x=>x.table_name)).size!==5)
      throw Error("PA02B_OWNER_COORDINATORS_REQUIRED");
    await sql.unsafe("CREATE TABLE IF NOT EXISTS "+q+".pa02b_owner_links ("+
      "scope_key text NOT NULL,effect_id text NOT NULL,run_id text NOT NULL,"+
      "receipt_id text NOT NULL,owner_package_id text NOT NULL,input_digest text NOT NULL,"+
      "evidence_ref text,evidence_digest text,terminal_payload jsonb,reconciled_at timestamptz,"+
      "PRIMARY KEY(scope_key,effect_id),UNIQUE(scope_key,receipt_id))");
  }catch(error){await sql.end();throw error;}
  const keys=(scope:HostResolvedAgentDurabilityScopeV020)=>({
    a:hostAgentRunScopeKeyV020(scope),b:hostAgentDurabilityScopeKeyV020(scope)
  });
  async function lock(tx:any,b:string,runId:string){
    await tx.unsafe("SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))",
      [b+":"+runId]);
  }
  async function findLinked(scope:HostResolvedAgentDurabilityScopeV020,effectId:string) {
    const {b}=keys(scope);
    const rows=await sql.unsafe("SELECT w.state,l.effect_id,l.receipt_id,l.evidence_ref FROM "+
      q+".pa02b_owner_links l JOIN "+q+".pa02b_writes w "+
      "ON w.scope_key=l.scope_key AND w.effect_id=l.effect_id "+
      "WHERE l.scope_key=$1 AND l.effect_id=$2",[b,required(effectId)]);
    return rows[0]?result(rows[0]):undefined;
  }
  return {
    async bind(r) {
      const effectId=required(r.effectId),receiptId=required(r.receiptId),
        ownerId=required(r.ownerPackageId),runId=required(r.lease.runId);
      const {a,b}=keys(r.scope);
      return sql.begin(async tx=>{
        await lock(tx,b,runId);
        const canceled=await tx.unsafe("SELECT state FROM "+q+".pa02c_cancellations "+
          "WHERE scope_key=$1 AND run_id=$2",[b,runId]);
        if(canceled.length)throw Error("PA02B_OWNER_CANCEL_REQUESTED");
        const leased=await tx.unsafe("SELECT 1 FROM "+q+".pa02b_leases "+
          "WHERE scope_key=$1 AND run_id=$2 AND owner_id=$3 AND fence=$4 "+
          "AND expires_at>clock_timestamp() FOR UPDATE",
          [b,runId,required(r.lease.ownerId),r.lease.fence]);
        if(!leased.length)throw Error("PA02B_LEASE_FENCED");
        const turn=await tx.unsafe("SELECT run_id FROM "+q+".agent_turns "+
          "WHERE scope_key=$1 AND run_id=$2 FOR UPDATE",[a,runId]);
        if(!turn.length)throw Error("PA02B_OWNER_RUN_NOT_FOUND");
        const writes=await tx.unsafe("SELECT * FROM "+q+".pa02b_writes "+
          "WHERE scope_key=$1 AND run_id=$2 AND effect_id=$3 AND state='PREPARED' FOR UPDATE",
          [b,runId,effectId]);
        if(!writes.length)throw Error("PA02B_OWNER_WRITE_NOT_PREPARED");
        const receipts=await tx.unsafe("SELECT * FROM "+q+".agent_receipts "+
          "WHERE scope_key=$1 AND receipt_id=$2 AND status='REQUESTED' FOR UPDATE",
          [a,receiptId]);
        if(!receipts.length)throw Error("PA02B_OWNER_RECEIPT_NOT_REQUESTED");
        const req=toObject(receipts[0].request_payload);
        if(req.sourceInteractionId!==runId||req.ownerPackageId!==ownerId||
          req.inputDigest!==writes[0].input_digest||
          req.principalSubjectId!==r.scope.principalSubjectId||
          req.principalActorType!==r.scope.principalActorType||
          (req.context as Record<string,unknown>)?.contextId!==r.scope.contextId)
          throw Error("PA02B_OWNER_SOURCE_MISMATCH");
        const params=[b,effectId,runId,receiptId,ownerId,writes[0].input_digest];
        const inserted=await tx.unsafe("INSERT INTO "+q+".pa02b_owner_links "+
          "(scope_key,effect_id,run_id,receipt_id,owner_package_id,input_digest) "+
          "VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING receipt_id",params);
        if(inserted.length)return {created:true,receiptId};
        const old=await tx.unsafe("SELECT * FROM "+q+".pa02b_owner_links "+
          "WHERE scope_key=$1 AND effect_id=$2",[b,effectId]);
        if(!old.length||old[0].receipt_id!==receiptId||
          old[0].owner_package_id!==ownerId||old[0].run_id!==runId||
          old[0].input_digest!==writes[0].input_digest)
          throw Error("PA02B_OWNER_LINK_CONFLICT");
        return {created:false,receiptId};
      });
    },
    async reconcile(r) {
      const effectId=required(r.effectId),{a,b}=keys(r.scope);
      const candidate=await sql.unsafe("SELECT l.*,w.state FROM "+q+".pa02b_owner_links l "+
        "JOIN "+q+".pa02b_writes w ON w.scope_key=l.scope_key AND w.effect_id=l.effect_id "+
        "WHERE l.scope_key=$1 AND l.effect_id=$2",[b,effectId]);
      if(!candidate.length)throw Error("PA02B_OWNER_LINK_NOT_FOUND");
      const prior=candidate[0];
      if(prior.state!=="UNKNOWN") {
        if(prior.evidence_ref&&["SUCCEEDED","FAILED","DENIED"].includes(prior.state))
          return result(prior);
        throw Error("PA02B_OWNER_WRITE_NOT_UNKNOWN");
      }
      const proof=await input.ownerVerifier.verify({
        scope:r.scope,runId:String(prior.run_id),effectId,
        receiptId:String(prior.receipt_id),
        ownerPackageId:String(prior.owner_package_id),
        inputDigest:String(prior.input_digest)
      });
      if(proof.outcome==="UNRESOLVED")return result(prior);
      const terminal=verifiedTerminal(proof,String(prior.receipt_id));
      if(!terminal)throw Error("PA02B_OWNER_ATTESTATION_INVALID");
      return sql.begin(async tx=>{
        await lock(tx,b,String(prior.run_id));
        const links=await tx.unsafe("SELECT * FROM "+q+".pa02b_owner_links "+
          "WHERE scope_key=$1 AND effect_id=$2 FOR UPDATE",[b,effectId]);
        if(!links.length)throw Error("PA02B_OWNER_LINK_NOT_FOUND");
        const l=links[0];
        if(l.receipt_id!==prior.receipt_id || l.owner_package_id!==prior.owner_package_id ||
          l.input_digest!==prior.input_digest)
          throw Error("PA02B_OWNER_LINK_CONFLICT");
        const w=await tx.unsafe("SELECT * FROM "+q+".pa02b_writes "+
          "WHERE scope_key=$1 AND effect_id=$2 FOR UPDATE",[b,effectId]);
        if(w[0]?.state!=="UNKNOWN") {
          if(w[0]?.state===proof.outcome && l.evidence_ref===proof.evidenceRef &&
            l.evidence_digest===proof.evidenceDigest)return result({...l,state:w[0].state});
          throw Error("PA02B_OWNER_TERMINAL_CONFLICT");
        }
        const lease=await tx.unsafe("SELECT 1 FROM "+q+".pa02b_leases "+
          "WHERE scope_key=$1 AND run_id=$2 AND expires_at>clock_timestamp() FOR UPDATE",
          [b,l.run_id]);
        if(lease.length)throw Error("PA02B_OWNER_WORKER_NOT_QUIESCED");
        const receipt=await tx.unsafe("SELECT * FROM "+q+".agent_receipts "+
          "WHERE scope_key=$1 AND receipt_id=$2 AND status='REQUESTED' FOR UPDATE",
          [a,l.receipt_id]);
        if(!receipt.length)throw Error("PA02B_OWNER_RECEIPT_TERMINAL_CONFLICT");
        const original=toObject(receipt[0].request_payload);
        if(original.ownerPackageId!==l.owner_package_id||
          original.sourceInteractionId!==l.run_id||
          original.inputDigest!==l.input_digest)
          throw Error("PA02B_OWNER_SOURCE_MISMATCH");
        await tx.unsafe("UPDATE "+q+".pa02b_writes SET state=$3 "+
          "WHERE scope_key=$1 AND effect_id=$2 AND state='UNKNOWN'",
          [b,effectId,proof.outcome]);
        await tx.unsafe("UPDATE "+q+".agent_receipts SET "+
          "status=$3,revision=revision+1,terminal_payload=$4::jsonb "+
          "WHERE scope_key=$1 AND receipt_id=$2 AND status='REQUESTED'",
          [a,l.receipt_id,proof.outcome,sql.json(JSON.parse(JSON.stringify(terminal)))]);
        await tx.unsafe("UPDATE "+q+".pa02b_owner_links SET "+
          "evidence_ref=$3,evidence_digest=$4,terminal_payload=$5::jsonb,"+
          "reconciled_at=clock_timestamp() WHERE scope_key=$1 AND effect_id=$2 "+
          "AND evidence_ref IS NULL",
          [b,effectId,required(proof.evidenceRef),sha256(proof.evidenceDigest),
            sql.json(JSON.parse(JSON.stringify(terminal)))]);
        return {effectId,receiptId:String(l.receipt_id),status:proof.outcome as
          "SUCCEEDED"|"FAILED"|"DENIED",reconciled:true,evidenceRef:proof.evidenceRef};
      });
    },
    get(r){return findLinked(r.scope,r.effectId);},
    async close(){await sql.end();}
  };
}
