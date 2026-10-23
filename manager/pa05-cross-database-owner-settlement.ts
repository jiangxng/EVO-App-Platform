import {createHash} from "node:crypto";
import {isDeepStrictEqual} from "node:util";
import postgres from "postgres";
import type {HostResolvedAgentDurabilityScopeV020} from "../contracts/agent-durability-async.js";
import {hostAgentRunScopeKeyV020} from "../agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import {hostAgentDurabilityScopeKeyV020} from "../agents/enterprise-agent/pa02b-postgres-coordination.js";
import type {AgentOwnerVerifierV030} from "../agents/enterprise-agent/pa02b-owner-reconciliation.js";
import type {Pa05CrossDatabaseReservationAuthorityV010} from "./pa05-cross-database-admission.js";

/**
 * D12: Host-controlled settlement, NOT Worker-authorized terminal reporting.
 * No new receipt engine: read the actual PA-02 terminal and invoke the
 * separately registered business Owner verifier AGAIN while the CENTRAL
 * Owner row is frozen and locked. Model/Worker cannot pass a terminal.
 * No automatic call from PA-02 recovery, and no production Host route.
 */
export interface Pa05CrossDatabaseOwnerSettlementV010 {
  settle(input:{
    scope:HostResolvedAgentDurabilityScopeV020;effectId:string;
  }):Promise<{state:"SETTLED"|"ALREADY_SETTLED";pendingCount:number}>;
  close():Promise<void>;
}
const hash=(v:string)=>createHash("sha256").update(v).digest("hex");
const name=(value:string)=>{
  if(typeof value!=="string"||!/^[a-zA-Z][a-zA-Z0-9_.-]{0,127}$/.test(value))
    throw Error("PA05_XDB_SETTLEMENT_TRUSTED_ID_INVALID");
  return value;
};
const version=(value:string)=>{
  if(typeof value!=="string"||!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(value))
    throw Error("PA05_XDB_SETTLEMENT_VERSION_INVALID");
  return value;
};
const schema=(value:string)=>{
  if(typeof value!=="string"||!/^[a-z][a-z0-9_]{0,62}$/.test(value))
    throw Error("PA05_XDB_SETTLEMENT_SCHEMA_INVALID");
  return value;
};
const actualJson=(value:unknown):Record<string,unknown>=>{
  const object=typeof value==="string"?JSON.parse(value):value;
  if(!object||typeof object!=="object"||Array.isArray(object))
    throw Error("PA05_XDB_SETTLEMENT_RECEIPT_INVALID");
  return object as Record<string,unknown>;
};
export async function createPa05CrossDatabaseOwnerSettlementV010(input:{
  /** Host administrative READ of existing remote PA-02 authority tables. */
  remoteConnectionString:string;
  workerSchema:string;
  /** Strictly Host-provided identities, never an Agent output or request. */
  workerId:string;ownerPackageId:string;ownerVersion:string;
  centralAuthority:Pick<Pa05CrossDatabaseReservationAuthorityV010,"settleVerified">;
  /** Registered business Owner's independent verifier, NOT a Worker result. */
  ownerVerifier:AgentOwnerVerifierV030;
}):Promise<Pa05CrossDatabaseOwnerSettlementV010>{
  const workerId=name(input.workerId),owner=name(input.ownerPackageId),
    ownerVersion=version(input.ownerVersion),q='"'+schema(input.workerSchema)+'"';
  if(!input.remoteConnectionString||
    typeof input.centralAuthority?.settleVerified!=="function"||
    typeof input.ownerVerifier?.verify!=="function")
    throw Error("PA05_XDB_SETTLEMENT_TRUSTED_PORTS_REQUIRED");
  const db=postgres(input.remoteConnectionString,{
    max:3,connect_timeout:10,idle_timeout:15
  });
  try{
    // No writes or schema creation by this read-and-verify settlement port.
    const names=await db.unsafe("SELECT table_name FROM information_schema.tables "+
      "WHERE table_schema=$1 AND table_name IN "+
      "('pa02b_writes','pa02b_owner_links','agent_receipts','pa05_xdb_remote_tickets')",
      [input.workerSchema]);
    if(new Set(names.map(x=>String(x.table_name))).size!==4)
      throw Error("PA05_XDB_SETTLEMENT_REMOTE_AUTHORITIES_REQUIRED");
    return {
      async settle({scope,effectId}){
        if(typeof effectId!=="string"||!effectId||effectId.length>1024)
          throw Error("PA05_XDB_SETTLEMENT_EFFECT_INVALID");
        const workerScope=hostAgentDurabilityScopeKeyV020(scope);
        const receiptScope=hostAgentRunScopeKeyV020(scope);
        // The reservation identity MUST be recomputed from D10's Host-owned
        // local ticket. No IDs, evidence or Owner outcome from the caller.
        const records=await db.unsafe(
          "SELECT w.scope_key,w.effect_id,w.run_id,w.input_digest,w.fence,"+
          "w.state AS write_state,l.receipt_id,l.owner_package_id,"+
          "l.evidence_ref,l.evidence_digest,l.terminal_payload AS owner_terminal,"+
          "r.status AS receipt_status,r.request_payload,r.terminal_payload AS receipt_terminal,"+
          "t.reservation_id,t.effect_digest "+
          "FROM "+q+".pa02b_writes w "+
          "JOIN "+q+".pa02b_owner_links l ON l.scope_key=w.scope_key "+
          "AND l.effect_id=w.effect_id AND l.run_id=w.run_id AND l.input_digest=w.input_digest "+
          "JOIN "+q+".pa05_xdb_remote_tickets t ON t.scope_key=w.scope_key "+
          "AND t.effect_id=w.effect_id AND t.run_id=w.run_id "+
          "AND t.input_digest=w.input_digest AND t.fence=w.fence "+
          "JOIN "+q+".agent_receipts r ON r.scope_key=$2 AND r.receipt_id=l.receipt_id "+
          "WHERE w.scope_key=$1 AND w.effect_id=$3",
          [workerScope,receiptScope,effectId]
        );
        if(records.length!==1)
          throw Error("PA05_XDB_SETTLEMENT_REMOTE_LINK_REQUIRED");
        const r=records[0],outcome=String(r.write_state);
        if(!["SUCCEEDED","FAILED","DENIED"].includes(outcome)||
          r.receipt_status!==outcome||r.owner_package_id!==owner||
          typeof r.evidence_ref!=="string"||!r.evidence_ref.trim()||
          typeof r.evidence_digest!=="string"||
          !/^[a-f0-9]{64}$/.test(r.evidence_digest))
          throw Error("PA05_XDB_SETTLEMENT_OWNER_TERMINAL_NOT_DURABLE");
        const receipt=actualJson(r.receipt_terminal);
        const ownerTerminal=actualJson(r.owner_terminal);
        const request=actualJson(r.request_payload);
        if(!isDeepStrictEqual(receipt,ownerTerminal)||
          receipt.receiptId!==r.receipt_id||receipt.status!==outcome||
          request.sourceInteractionId!==r.run_id||request.ownerPackageId!==owner||
          request.inputDigest!==r.input_digest||
          request.principalSubjectId!==scope.principalSubjectId||
          request.principalActorType!==scope.principalActorType||
          actualJson(request.context).contextId!==scope.contextId)
          throw Error("PA05_XDB_SETTLEMENT_OWNER_RECEIPT_CONFLICT");
        const identity={
          scopeKey:String(r.scope_key),effectId:String(r.effect_id),
          runId:String(r.run_id),inputDigest:String(r.input_digest),
          fence:String(r.fence)
        };
        const effectDigest=hash(JSON.stringify(identity));
        const reservationId=hash(JSON.stringify({
          workerId,owner,version:ownerVersion,effectDigest
        }));
        if(r.effect_digest!==effectDigest||r.reservation_id!==reservationId)
          throw Error("PA05_XDB_SETTLEMENT_RESERVATION_DIGEST_CONFLICT");
        return input.centralAuthority.settleVerified({
          packageId:owner,version:ownerVersion,workerId,
          reservationId,effectDigest,
          verifyOwnerTerminal:async()=>{
            // Recheck actual Owner independently, while CENTRAL owner is
            // FROZEN and row-locked. Not a Worker-provided terminal.
            const proof=await input.ownerVerifier.verify({
              scope,runId:String(r.run_id),effectId,
              receiptId:String(r.receipt_id),ownerPackageId:owner,
              inputDigest:String(r.input_digest)
            });
            if(!proof||proof.outcome!==outcome||
              proof.evidenceRef!==r.evidence_ref||
              proof.evidenceDigest!==r.evidence_digest||
              !proof.terminal||
              !isDeepStrictEqual(proof.terminal,receipt))
              throw Error("PA05_XDB_SETTLEMENT_INDEPENDENT_OWNER_MISMATCH");
            return {
              outcome:proof.outcome as "SUCCEEDED"|"FAILED"|"DENIED",
              receiptId:String(r.receipt_id),evidenceDigest:String(r.evidence_digest)
            };
          }
        });
      },
      async close(){await db.end();}
    };
  }catch(error){await db.end();throw error;}
}
