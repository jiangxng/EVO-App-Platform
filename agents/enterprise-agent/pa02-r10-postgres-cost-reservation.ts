import {createHash} from "node:crypto";
import postgres from "postgres";
import type {HostResolvedAgentDurabilityScopeV020} from "../../contracts/agent-durability-async.js";
import {hostAgentRunScopeKeyV020} from "./pa02a-postgres-durability-proof.js";

/**
 * PA-02 R10: a scoped, durable, pre-inference monetary reservation primitive.
 * This is NOT a supplier invoice, approved production tariff, or new executor.
 *
 * Actual use MUST be gated by separately verified Host approval of provider,
 * model, pricing version, currency and a genuine hard upper bound on billed
 * inputs + outputs. Until that contract exists, the Worker must fail closed.
 * Existing production paths DO NOT construct this proof store.
 */
export interface Pa02CostPolicyCandidateV010 {
  contractVersion:"0.1.0";
  approvalId:string;
  pricingVersion:string;
  currency:string;
  providerId:string;
  modelId:string;
  runLimitMicros:number;
  // These MUST be verified upper bounds by the owning Provider contract.
  maxBillableInputTokens:number;
  maxBillableOutputTokens:number;
  // Input rate must cover *every* possible normal/cache read/cache write
  // billing mode and any additive charge, not just nominal uncached input.
  worstInputMicrosPerMillion:number;
  worstOutputMicrosPerMillion:number;
}
type State="HELD"|"UNKNOWN"|"SETTLED";
export interface Pa02CostLedgerV010 {
  reserve(input:{scope:HostResolvedAgentDurabilityScopeV020;runId:string;
    sliceId:string;policy:Pa02CostPolicyCandidateV010}):
    Promise<{status:"RESERVED"|"EXHAUSTED"|"ALREADY_HELD"|"UNKNOWN_HELD"|"SETTLED_ALREADY";
      worstMicros:string;remainingMicros:string}>;
  settle(input:{scope:HostResolvedAgentDurabilityScopeV020;runId:string;
    sliceId:string;policy:Pa02CostPolicyCandidateV010;
    usage?:{inputTokens:number;outputTokens:number}}):
    Promise<{status:"SETTLED"|"UNKNOWN";chargedMicros:string}>;
  snapshot(input:{scope:HostResolvedAgentDurabilityScopeV020;runId:string}):
    Promise<{currency?:string;approvalId?:string;pricingVersion?:string;
      capMicros?:string;usedAndHeldMicros:string;entries:Array<{
        sliceId:string;status:State;heldMicros:string;chargedMicros:string}>}>;
  close():Promise<void>;
}
function id(v:unknown):string {
  if(typeof v!=="string"||!v.trim()||v.length>256)
    throw Error("PA02_R10_COST_ID_INVALID");
  return v.trim();
}
function positiveSafe(v:unknown,upper:number):number {
  if(typeof v!=="number"||!Number.isSafeInteger(v)||v<1||v>upper)
    throw Error("PA02_R10_COST_POLICY_LIMIT_INVALID");
  return v;
}
function rate(v:unknown):number {
  if(typeof v!=="number"||!Number.isSafeInteger(v)||v<0||v>1_000_000_000_000)
    throw Error("PA02_R10_COST_RATE_INVALID");
  return v;
}
function validate(p:Pa02CostPolicyCandidateV010){
  if(!p||p.contractVersion!=="0.1.0"||
    !/^[A-Z]{3}$/.test(p.currency)||!p.approvalId?.trim()||
    !p.pricingVersion?.trim()||!p.providerId?.trim()||!p.modelId?.trim())
    throw Error("PA02_R10_COST_POLICY_UNAPPROVED");
  const normalized:Pa02CostPolicyCandidateV010={
    contractVersion:"0.1.0",
    approvalId:id(p.approvalId),pricingVersion:id(p.pricingVersion),
    currency:p.currency,providerId:id(p.providerId),modelId:id(p.modelId),
    runLimitMicros:positiveSafe(p.runLimitMicros,1_000_000_000_000),
    maxBillableInputTokens:positiveSafe(p.maxBillableInputTokens,10_000_000),
    maxBillableOutputTokens:positiveSafe(p.maxBillableOutputTokens,1_000_000),
    worstInputMicrosPerMillion:rate(p.worstInputMicrosPerMillion),
    worstOutputMicrosPerMillion:rate(p.worstOutputMicrosPerMillion)
  };
  if(normalized.worstInputMicrosPerMillion===0||
    normalized.worstOutputMicrosPerMillion===0)
    throw Error("PA02_R10_COST_UNPROVEN_FREE_RATE");
  const digest=createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
  return {...normalized,digest};
}
const ceiling=(n:bigint,denominator:bigint)=>
  (n+denominator-1n)/denominator;
function worst(p:ReturnType<typeof validate>){
  return ceiling(
    BigInt(p.maxBillableInputTokens)*BigInt(p.worstInputMicrosPerMillion)+
    BigInt(p.maxBillableOutputTokens)*BigInt(p.worstOutputMicrosPerMillion),
    1_000_000n
  );
}
function cost(p:ReturnType<typeof validate>,input:number,output:number){
  return ceiling(BigInt(input)*BigInt(p.worstInputMicrosPerMillion)+
    BigInt(output)*BigInt(p.worstOutputMicrosPerMillion),1_000_000n);
}
function validUsage(v:{inputTokens:number;outputTokens:number}|undefined,
  p:ReturnType<typeof validate>):v is {inputTokens:number;outputTokens:number}{
  return !!v&&Number.isSafeInteger(v.inputTokens)&&v.inputTokens>=0&&
    v.inputTokens<=p.maxBillableInputTokens&&
    Number.isSafeInteger(v.outputTokens)&&v.outputTokens>=0&&
    v.outputTokens<=p.maxBillableOutputTokens;
}
export async function createPa02IsolatedPostgresCostLedgerV010(input:{
  connectionString:string;schema:string
}):Promise<Pa02CostLedgerV010>{
  if(!input.connectionString?.trim()||
    !/^pa02_[a-z0-9_]{1,58}$/.test(input.schema))
    throw Error("PA02_R10_COST_ISOLATED_POSTGRES_REQUIRED");
  const q='"'+input.schema+'"',sql=postgres(input.connectionString,{
    max:5,connect_timeout:10,idle_timeout:15
  });
  try{
    await sql.begin(async tx=>{
      await tx.unsafe("CREATE SCHEMA IF NOT EXISTS "+q);
      await tx.unsafe("CREATE TABLE IF NOT EXISTS "+q+".pa02_run_cost_limits ("+
        "scope_key text NOT NULL,run_id text NOT NULL,approval_digest text NOT NULL,"+
        "approval_id text NOT NULL,pricing_version text NOT NULL,"+
        "currency text NOT NULL,run_limit_micros bigint NOT NULL,"+
        "PRIMARY KEY(scope_key,run_id))");
      await tx.unsafe("CREATE TABLE IF NOT EXISTS "+q+".pa02_model_cost_reservations ("+
        "scope_key text NOT NULL,run_id text NOT NULL,slice_id text NOT NULL,"+
        "state text NOT NULL CHECK(state IN ('HELD','UNKNOWN','SETTLED')),"+
        "held_micros bigint NOT NULL,charged_micros bigint NOT NULL DEFAULT 0,"+
        "usage_digest text,PRIMARY KEY(scope_key,run_id,slice_id),"+
        "FOREIGN KEY(scope_key,run_id) REFERENCES "+q+
        ".pa02_run_cost_limits(scope_key,run_id))");
    });
  }catch(e){await sql.end();throw e;}
  const parts=(s:HostResolvedAgentDurabilityScopeV020,runId:string)=>
    [hostAgentRunScopeKeyV020(s),id(runId)] as const;
  async function limit(tx:postgres.TransactionSql<{}>,
    scopeKey:string,runId:string,p:ReturnType<typeof validate>){
    await tx.unsafe("INSERT INTO "+q+".pa02_run_cost_limits "+
      "(scope_key,run_id,approval_digest,approval_id,pricing_version,"+
      "currency,run_limit_micros) VALUES($1,$2,$3,$4,$5,$6,$7) "+
      "ON CONFLICT DO NOTHING",[
        scopeKey,runId,p.digest,p.approvalId,p.pricingVersion,
        p.currency,String(p.runLimitMicros)
      ]);
    const rows=await tx.unsafe("SELECT * FROM "+q+".pa02_run_cost_limits "+
      "WHERE scope_key=$1 AND run_id=$2 FOR UPDATE",[scopeKey,runId]);
    if(rows.length!==1||rows[0].approval_digest!==p.digest)
      throw Error("PA02_R10_COST_POLICY_DRIFT_DENIED");
    return BigInt(String(rows[0].run_limit_micros));
  }
  return {
    async reserve({scope,runId,sliceId,policy}){
      const p=validate(policy),[sk,run]=parts(scope,runId),slice=id(sliceId);
      return sql.begin(async tx=>{
        const cap=await limit(tx,sk,run,p),required=worst(p);
        const held=await tx.unsafe("SELECT slice_id,state FROM "+q+
          ".pa02_model_cost_reservations WHERE scope_key=$1 AND run_id=$2 "+
          "AND state IN ('HELD','UNKNOWN')",[sk,run]);
        const own=await tx.unsafe("SELECT state FROM "+q+
          ".pa02_model_cost_reservations WHERE scope_key=$1 AND run_id=$2 "+
          "AND slice_id=$3",[sk,run,slice]);
        const all=await tx.unsafe("SELECT COALESCE(SUM(CASE WHEN state='SETTLED' "+
          "THEN charged_micros ELSE held_micros END),0)::text AS total FROM "+q+
          ".pa02_model_cost_reservations WHERE scope_key=$1 AND run_id=$2",[sk,run]);
        const used=BigInt(String(all[0].total));
        const remaining=cap>used?cap-used:0n;
        if(own.length)return{
          status:(own[0].state==="SETTLED"?"SETTLED_ALREADY":
            own[0].state==="UNKNOWN"?"UNKNOWN_HELD":"ALREADY_HELD") as
            "SETTLED_ALREADY"|"UNKNOWN_HELD"|"ALREADY_HELD",
          worstMicros:String(required),remainingMicros:String(remaining)
        };
        if(held.length)return{status:"UNKNOWN_HELD" as const,
          worstMicros:String(required),remainingMicros:String(remaining)};
        if(required>remaining)return{status:"EXHAUSTED" as const,
          worstMicros:String(required),remainingMicros:String(remaining)};
        await tx.unsafe("INSERT INTO "+q+".pa02_model_cost_reservations "+
          "(scope_key,run_id,slice_id,state,held_micros) "+
          "VALUES($1,$2,$3,'HELD',$4)",[sk,run,slice,String(required)]);
        return{status:"RESERVED" as const,worstMicros:String(required),
          remainingMicros:String(remaining-required)};
      });
    },
    async settle({scope,runId,sliceId,policy,usage}){
      const p=validate(policy),[sk,run]=parts(scope,runId),slice=id(sliceId);
      return sql.begin(async tx=>{
        await limit(tx,sk,run,p);
        const records=await tx.unsafe("SELECT state,charged_micros,usage_digest "+
          "FROM "+q+".pa02_model_cost_reservations WHERE "+
          "scope_key=$1 AND run_id=$2 AND slice_id=$3 FOR UPDATE",[sk,run,slice]);
        if(records.length!==1)throw Error("PA02_R10_COST_RESERVATION_REQUIRED");
        const found=records[0],valid=validUsage(usage,p);
        const ud=valid?createHash("sha256").update(JSON.stringify(usage)).digest("hex"):null;
        if(found.state==="SETTLED"){
          if(!valid||found.usage_digest!==ud)
            throw Error("PA02_R10_COST_SETTLEMENT_CONFLICT");
          return{status:"SETTLED" as const,chargedMicros:String(found.charged_micros)};
        }
        if(found.state==="UNKNOWN")return{
          status:"UNKNOWN" as const,chargedMicros:"0"
        };
        if(!valid){
          await tx.unsafe("UPDATE "+q+".pa02_model_cost_reservations "+
            "SET state='UNKNOWN' WHERE scope_key=$1 AND run_id=$2 "+
            "AND slice_id=$3",[sk,run,slice]);
          return{status:"UNKNOWN" as const,chargedMicros:"0"};
        }
        const charge=cost(p,usage.inputTokens,usage.outputTokens);
        await tx.unsafe("UPDATE "+q+".pa02_model_cost_reservations "+
          "SET state='SETTLED',charged_micros=$4,usage_digest=$5 "+
          "WHERE scope_key=$1 AND run_id=$2 AND slice_id=$3",
          [sk,run,slice,String(charge),ud]);
        return{status:"SETTLED" as const,chargedMicros:String(charge)};
      });
    },
    async snapshot({scope,runId}){
      const [sk,run]=parts(scope,runId);
      const [limits,records]=await Promise.all([
        sql.unsafe("SELECT approval_id,pricing_version,currency,run_limit_micros "+
          "FROM "+q+".pa02_run_cost_limits WHERE scope_key=$1 AND run_id=$2",[sk,run]),
        sql.unsafe("SELECT slice_id,state,held_micros,charged_micros "+
          "FROM "+q+".pa02_model_cost_reservations WHERE scope_key=$1 AND run_id=$2 "+
          "ORDER BY slice_id",[sk,run])
      ]);
      const total=records.reduce((n,r)=>n+BigInt(String(r.state==="SETTLED"?
        r.charged_micros:r.held_micros)),0n);
      return{
        ...(limits.length?{
          approvalId:String(limits[0].approval_id),
          pricingVersion:String(limits[0].pricing_version),
          currency:String(limits[0].currency),
          capMicros:String(limits[0].run_limit_micros)
        }:{}),
        usedAndHeldMicros:String(total),
        entries:records.map(r=>({
          sliceId:String(r.slice_id),status:r.state as State,
          heldMicros:String(r.held_micros),
          chargedMicros:String(r.charged_micros)
        }))
      };
    },
    close:()=>sql.end()
  };
}
