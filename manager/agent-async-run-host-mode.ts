import type { PlatformPrincipalV010, ResolvedContextSetV010 } from "../contracts/platform-services.js";
import type { AgentRunV010, AgentRunEventV010 } from "../contracts/agent-run.js";

/**
 * Lazy Host integration for PA-02. No Postgres module, connection, schema
 * creation, worker or Agent plugin runtime is loaded when the mode is OFF.
 *
 * This deliberately covers ONLY run.get read-through. It does not imply
 * successful durable Run creation, Tool WRITE replay or async executor cutover.
 */
export interface OptionalAgentRunReaderV020 {
  read(input: {
    runId: string;
    principal: PlatformPrincipalV010;
    context: ResolvedContextSetV010;
  }): Promise<AgentRunV010 | undefined>;
  close(): Promise<void>;
}

export async function createOptionalHostAsyncRunReaderV020(
  env: Record<string, string | undefined>
): Promise<OptionalAgentRunReaderV020 | undefined> {
  const mode=(env.APP_PLATFORM_AGENT_RUN_ASYNC_READ_MODE?.trim().toUpperCase() || "OFF");
  if(mode==="OFF")return undefined;
  if(mode!=="POSTGRES_READ_ONLY")throw Error("AGENT_ASYNC_READ_MODE_INVALID");

  const url=env.APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL?.trim();
  if(!url)throw Error("AGENT_ASYNC_READ_DATABASE_URL_REQUIRED");
  const schema=env.APP_PLATFORM_AGENT_RUN_ASYNC_SCHEMA?.trim();
  if(!schema||!/^[a-z][a-z0-9_]{0,62}$/.test(schema))
    throw Error("AGENT_ASYNC_READ_SCHEMA_INVALID");

  // Imports intentionally occur only with explicit, local Host opt-in.
  const [{default:postgres},{createHostAsyncRunReaderPortV020},
    {hostAgentRunScopeKeyV020}]=await Promise.all([
    import("postgres"),import("./agent-async-run-reader.js"),
    import("../agents/enterprise-agent/pa02a-postgres-durability-proof.js")
  ]);
  const q='"'+schema+'"';
  const sql=postgres(url,{max:4,connect_timeout:10,idle_timeout:15});
  try {
    // Read-only bootstrap: never create or migrate agent tables from server.ts.
    const found=await sql.unsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema=$1 "+
      "AND table_name IN ('agent_turns','agent_run_events')",[schema]
    );
    if(new Set(found.map(x=>String(x.table_name))).size!==2)
      throw Error("AGENT_ASYNC_READ_SCHEMA_NOT_READY");
  }catch(error){
    await sql.end();
    throw error;
  }
  const reader=createHostAsyncRunReaderPortV020({
    async listRunEvents({scope,runId}){
      const rows=await sql.unsafe(
        "SELECT e.payload FROM "+q+".agent_run_events e "+
        "INNER JOIN "+q+".agent_turns t ON e.run_id=t.run_id "+
        "WHERE t.scope_key=$1 AND e.run_id=$2 ORDER BY e.ordinal",
        [hostAgentRunScopeKeyV020(scope),runId]
      );
      return rows.map(row=>(typeof row.payload==="string"
        ?JSON.parse(row.payload):structuredClone(row.payload)) as AgentRunEventV010);
    }
  });
  return {
    read:input=>reader.read(input),
    close:async()=>{await sql.end();}
  };
}
