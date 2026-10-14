import postgres from "postgres";
import type {AgentRunEventV010} from "../contracts/agent-run.js";
import type {HostResolvedAgentDurabilityScopeV020} from
  "../contracts/agent-durability-async.js";
import {hostAgentRunScopeKeyV020} from
  "../agents/enterprise-agent/pa02a-postgres-durability-proof.js";

export interface Pa02RunOutboxEventV010 {
  eventId:string;
  /** Database outbox sequence; scope-wide gaps can belong to other Runs. */
  sequence:number;
  /** The strictly consecutive event ordinal within this Run. */
  ordinal:number;
  runId:string;
  event:AgentRunEventV010;
}
export interface Pa02RunOutboxReplayV010 {
  events:Pa02RunOutboxEventV010[];
  resetRequired:boolean;
  nextCursor?:string;
  hasMore:boolean;
}
export interface Pa02RunOutboxReaderV010 {
  readSince(input:{
    scope:HostResolvedAgentDurabilityScopeV020;
    runId:string;
    afterEventId?:string;
    limit?:number;
  }):Promise<Pa02RunOutboxReplayV010|undefined>;
  close():Promise<void>;
}
function required(s:unknown):string {
  if(typeof s!=="string"||!s.trim())throw Error("PA02_OUTBOX_ID_REQUIRED");
  return s.trim();
}
function rowEvent(row:Record<string,unknown>):Pa02RunOutboxEventV010 {
  const event=(typeof row.payload==="string"
    ?JSON.parse(row.payload):row.payload) as AgentRunEventV010;
  if(event.eventId!==row.event_id||
    event.runId!==row.run_id||
    event.contractVersion!=="0.1.0")
    throw Error("PA02_OUTBOX_EVENT_INCONSISTENT");
  const sequence=Number(row.sequence),ordinal=Number(row.ordinal);
  if(!Number.isSafeInteger(sequence)||sequence<1||
    !Number.isSafeInteger(ordinal)||ordinal<0)
    throw Error("PA02_OUTBOX_SEQUENCE_INVALID");
  return {eventId:event.eventId,sequence,ordinal,
    runId:event.runId,event:structuredClone(event)};
}

/**
 * Exact-run, exact Host-resolved scope replay of the durable Run-event Outbox.
 * PostgreSQL Run events, not SSE's in-memory ring, are the authority.
 * The outbox is written by the DB trigger in the SAME transaction as all
 * PA-02A, Fenced Worker and PA-02C cancellation Run event appends.
 *
 * Never use global sequence adjacency as a gap detector: other authorized
 * Runs and tenants legitimately occupy intervening sequence numbers.
 * Compare per-Run ordinal instead. Missing cursor or discontinuity requires
 * the caller to reload its authoritative Run snapshot.
 */
export async function createPostgresPa02RunOutboxReaderV010(input:{
  connectionString:string;schema:string;
}):Promise<Pa02RunOutboxReaderV010> {
  if(!/^[a-z][a-z0-9_]{0,62}$/.test(input.schema))
    throw Error("PA02_OUTBOX_SCHEMA_INVALID");
  const url=required(input.connectionString),q='"'+input.schema+'"';
  const sql=postgres(url,{max:4,connect_timeout:10,idle_timeout:15});
  try {
    const tables=await sql.unsafe(
      "SELECT table_name FROM information_schema.tables WHERE "+
      "table_schema=$1 AND table_name IN ('agent_turns','agent_run_outbox')",
      [input.schema]
    );
    if(new Set(tables.map(row=>row.table_name)).size!==2)
      throw Error("PA02_OUTBOX_TABLES_REQUIRED");
  }catch(e){await sql.end();throw e;}

  return {
    async readSince(r) {
      const runId=required(r.runId),key=hostAgentRunScopeKeyV020(r.scope);
      const limit=r.limit??64;
      if(!Number.isInteger(limit)||limit<1||limit>100)
        throw Error("PA02_OUTBOX_LIMIT_INVALID");
      if(r.afterEventId!==undefined)required(r.afterEventId);
      return sql.begin(async tx=>{
        // Lock only the snapshot revision for consistency during this read.
        // Never let a valid but foreign runId reveal any event/cursor data.
        const turns=await tx.unsafe("SELECT run_id,revision FROM "+
          q+".agent_turns WHERE scope_key=$1 AND run_id=$2",
          [key,runId]);
        if(!turns.length)return undefined;
        let cursorOrdinal=-1,cursorSequence=0;
        if(r.afterEventId) {
          const found=await tx.unsafe(
            "SELECT sequence,ordinal FROM "+q+".agent_run_outbox "+
            "WHERE scope_key=$1 AND run_id=$2 AND event_id=$3",
            [key,runId,r.afterEventId]
          );
          if(found.length!==1)return {
            events:[],resetRequired:true,hasMore:false
          };
          cursorOrdinal=Number(found[0].ordinal);
          cursorSequence=Number(found[0].sequence);
          if(!Number.isSafeInteger(cursorOrdinal)||
            !Number.isSafeInteger(cursorSequence))
            throw Error("PA02_OUTBOX_CURSOR_INVALID");
        }
        const rows=await tx.unsafe(
          "SELECT event_id,run_id,sequence,ordinal,payload FROM "+
          q+".agent_run_outbox WHERE scope_key=$1 AND run_id=$2 "+
          "AND ordinal>$3 AND sequence>$4 "+
          "ORDER BY ordinal ASC LIMIT $5",
          [key,runId,cursorOrdinal,cursorSequence,limit+1]
        );
        const page=rows.slice(0,limit).map(rowEvent);
        let expected=cursorOrdinal+1;
        for(const item of page) {
          if(item.ordinal!==expected++)return {
            events:[],resetRequired:true,hasMore:false
          };
        }
        // A deleted/missing last event also requires the authoritative
        // snapshot even if no later outbox row follows the gap.
        if(rows.length<=limit &&
          expected<=Number(turns[0].revision))return {
          events:[],resetRequired:true,hasMore:false
        };
        return {
          events:page,resetRequired:false,
          hasMore:rows.length>limit,
          ...(page.length?{nextCursor:page.at(-1)!.eventId}
            :r.afterEventId?{nextCursor:r.afterEventId}:{})
        };
      });
    },
    close(){return sql.end();}
  };
}
