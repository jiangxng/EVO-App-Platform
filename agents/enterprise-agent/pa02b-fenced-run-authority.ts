import postgres from "postgres";
import { materializeAgentRunsV010 } from "../../manager/agent-run-store.js";
import type { AgentRunEventV010, AgentRunV010 } from "../../contracts/agent-run.js";
import type { HostResolvedAgentDurabilityScopeV020 } from "../../contracts/agent-durability-async.js";
import type { AgentLeaseV020 } from "./pa02b-postgres-coordination.js";
import { hostAgentRunScopeKeyV020 } from "./pa02a-postgres-durability-proof.js";
import { hostAgentDurabilityScopeKeyV020 } from "./pa02b-postgres-coordination.js";

export interface FencedRunAppendResultV030 {
  revision: number;
  run: AgentRunV010;
}
export interface FencedAgentRunAuthorityV030 {
  claim(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    runId: string;
    workerId: string;
    ttlSeconds: number;
  }): Promise<AgentLeaseV020 | undefined>;
  renew(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    lease: AgentLeaseV020;
    ttlSeconds: number;
  }): Promise<AgentLeaseV020 | undefined>;
  append(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    lease: AgentLeaseV020;
    expectedRevision: number;
    event: AgentRunEventV010;
  }): Promise<FencedRunAppendResultV030>;
  read(input: {
    scope: HostResolvedAgentDurabilityScopeV020;
    runId: string;
  }): Promise<{revision: number;run: AgentRunV010} | undefined>;
  close(): Promise<void>;
}
function required(s:unknown):string {
  if(typeof s!=="string" || !s.trim())throw Error("PA02B_RUN_VALUE_REQUIRED");
  return s.trim();
}
function ttl(n:number):number {
  if(!Number.isInteger(n)||n<1||n>3600)throw Error("PA02B_RUN_TTL_INVALID");
  return n;
}
function decode(rows:readonly Record<string,unknown>[]):AgentRunV010 {
  const events=rows.map(row =>
    (typeof row.payload==="string" ? JSON.parse(row.payload) : row.payload) as AgentRunEventV010
  );
  const runs=materializeAgentRunsV010(events);
  if(runs.length!==1)throw Error("PA02B_RUN_EVENTS_INCONSISTENT");
  return runs[0];
}
function mustMatch(
  scope:HostResolvedAgentDurabilityScopeV020,run:AgentRunV010
):void {
  if(run.principalSubjectId!==scope.principalSubjectId ||
    run.principalActorType!==scope.principalActorType ||
    run.context.kind!==scope.contextKind ||
    run.context.contextId!==scope.contextId ||
    (run.context.kind==="ENTERPRISE" && run.context.enterpriseId!==scope.enterpriseId)){
    throw Error("PA02B_RUN_SCOPE_INCONSISTENT");
  }
}
function isTerminal(run:AgentRunV010):boolean {
  return ["CANCELLED","BLOCKED","SUCCEEDED","FAILED"].includes(run.state);
}
function lease(row:Record<string,unknown>):AgentLeaseV020 {
  return {
    runId:String(row.run_id),ownerId:String(row.owner_id),
    fence:Number(row.fence),expiresAt:new Date(String(row.expires_at)).toISOString()
  };
}

/**
 * V030 staging Worker authority: one durable fence is checked in the SAME
 * transaction as V010 Run event revision CAS. Only the Host may supply scope.
 *
 * This code never invokes a business tool. A real WRITE must use the PA02B
 * write-intent/owner-reconciliation protocol before dispatch.
 * Not enabled by manager/server.ts.
 */
export async function createPostgresFencedAgentRunAuthorityV030(input:{
  connectionString:string;schema:string;
}):Promise<FencedAgentRunAuthorityV030> {
  if(!/^[a-z][a-z0-9_]{0,62}$/.test(input.schema))throw Error("PA02B_RUN_SCHEMA_INVALID");
  const sql=postgres(required(input.connectionString),{max:8,connect_timeout:10,idle_timeout:15});
  const q='"'+input.schema+'"';
  try{
    const tables=await sql.unsafe("SELECT table_name FROM information_schema.tables "+
      "WHERE table_schema=$1 AND table_name IN "+
      "('agent_turns','agent_run_events','pa02b_leases','pa02c_cancellations')",[input.schema]);
    if(new Set(tables.map(r=>r.table_name)).size!==4)throw Error("PA02B_RUN_COORDINATORS_REQUIRED");
  }catch(e){await sql.end();throw e;}

  function keys(scope:HostResolvedAgentDurabilityScopeV020) {
    return {a:hostAgentRunScopeKeyV020(scope),b:hostAgentDurabilityScopeKeyV020(scope)};
  }
  async function lock(tx:any,b:string,runId:string) {
    await tx.unsafe("SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))",
      [b+":"+runId]);
  }
  async function scopedRun(tx:any,a:string,runId:string) {
    const turns=await tx.unsafe("SELECT revision FROM "+q+".agent_turns "+
      "WHERE scope_key=$1 AND run_id=$2 FOR UPDATE",[a,runId]);
    if(!turns.length)return undefined;
    const events=await tx.unsafe("SELECT payload FROM "+q+".agent_run_events "+
      "WHERE run_id=$1 ORDER BY ordinal ASC",[runId]);
    return {revision:Number(turns[0].revision),run:decode(events),events};
  }
  async function cancelled(tx:any,b:string,runId:string) {
    const rows=await tx.unsafe("SELECT state FROM "+q+".pa02c_cancellations "+
      "WHERE scope_key=$1 AND run_id=$2",[b,runId]);
    return rows.length>0;
  }
  return {
    async claim(r) {
      const runId=required(r.runId),worker=required(r.workerId);
      const {a,b}=keys(r.scope);
      return sql.begin(async tx=>{
        await lock(tx,b,runId);
        const current=await scopedRun(tx,a,runId);
        if(!current)return undefined;
        mustMatch(r.scope,current.run);
        if(isTerminal(current.run)||await cancelled(tx,b,runId))return undefined;
        const rows=await tx.unsafe("INSERT INTO "+q+".pa02b_leases "+
          "(scope_key,run_id,owner_id,fence,expires_at) "+
          "VALUES($1,$2,$3,1,clock_timestamp()+($4::integer*interval '1 second')) "+
          "ON CONFLICT (scope_key,run_id) DO UPDATE SET "+
          "owner_id=EXCLUDED.owner_id,fence="+q+".pa02b_leases.fence+1,"+
          "expires_at=EXCLUDED.expires_at "+
          "WHERE "+q+".pa02b_leases.expires_at<=clock_timestamp() "+
          "RETURNING run_id,owner_id,fence,expires_at",
          [b,runId,worker,ttl(r.ttlSeconds)]);
        return rows.length?lease(rows[0]):undefined;
      });
    },
    async renew(r) {
      const l=r.lease,runId=required(l.runId),worker=required(l.ownerId);
      const {a,b}=keys(r.scope);
      return sql.begin(async tx=>{
        await lock(tx,b,runId);
        const current=await scopedRun(tx,a,runId);
        if(!current)return undefined;
        mustMatch(r.scope,current.run);
        if(isTerminal(current.run)||await cancelled(tx,b,runId))return undefined;
        const rows=await tx.unsafe("UPDATE "+q+".pa02b_leases SET "+
          "expires_at=clock_timestamp()+($5::integer*interval '1 second') "+
          "WHERE scope_key=$1 AND run_id=$2 AND owner_id=$3 AND fence=$4 "+
          "AND expires_at>clock_timestamp() RETURNING run_id,owner_id,fence,expires_at",
          [b,runId,worker,l.fence,ttl(r.ttlSeconds)]);
        return rows.length?lease(rows[0]):undefined;
      });
    },
    async append(r) {
      const l=r.lease,runId=required(l.runId),event=r.event;
      if(event.runId!==runId||!event.eventId?.trim()||
        ["RUN_CREATED","RUN_CANCELLED"].includes(event.type))
        throw Error("PA02B_FENCED_EVENT_INVALID");
      if(!Number.isInteger(r.expectedRevision)||r.expectedRevision<0)
        throw Error("PA02B_FENCED_REVISION_INVALID");
      const {a,b}=keys(r.scope);
      return sql.begin(async tx=>{
        await lock(tx,b,runId);
        const current=await scopedRun(tx,a,runId);
        if(!current)throw Error("PA02B_FENCED_RUN_NOT_FOUND");
        mustMatch(r.scope,current.run);
        if(await cancelled(tx,b,runId))throw Error("PA02B_FENCED_CANCEL_REQUESTED");
        const leases=await tx.unsafe("SELECT 1 FROM "+q+".pa02b_leases "+
          "WHERE scope_key=$1 AND run_id=$2 AND owner_id=$3 AND fence=$4 "+
          "AND expires_at>clock_timestamp() FOR UPDATE",
          [b,runId,required(l.ownerId),l.fence]);
        if(!leases.length)throw Error("PA02B_LEASE_FENCED");
        if(current.revision!==r.expectedRevision)
          throw Error("PA02B_FENCED_REVISION_CONFLICT");
        const next=decode([...current.events,{payload:event}]);
        mustMatch(r.scope,next);
        const updated=await tx.unsafe("UPDATE "+q+".agent_turns SET revision=revision+1 "+
          "WHERE scope_key=$1 AND run_id=$2 AND revision=$3 RETURNING revision",
          [a,runId,r.expectedRevision]);
        if(updated.length!==1)throw Error("PA02B_FENCED_REVISION_CONFLICT");
        await tx.unsafe("INSERT INTO "+q+".agent_run_events "+
          "(event_id,run_id,ordinal,payload) VALUES($1,$2,$3,$4::jsonb)",
          [event.eventId,runId,Number(updated[0].revision),JSON.stringify(event)]);
        return {revision:Number(updated[0].revision),run:next};
      });
    },
    async read(r) {
      const runId=required(r.runId),{a}=keys(r.scope);
      const current=await sql.begin(tx=>scopedRun(tx,a,runId));
      if(!current)return undefined;
      mustMatch(r.scope,current.run);
      return {revision:current.revision,run:current.run};
    },
    async close(){await sql.end();}
  };
}
