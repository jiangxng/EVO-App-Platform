import postgres from "postgres";

/**
 * CV04 isolated proof only. Adds a PostgreSQL-maintained, append-only
 * metadata ledger to the EXISTING encrypted Enterprise Resource CAS table.
 * It does NOT install any production migration or authorize an export.
 * Ordinary CV-03 gateway/PA05 SQL roles are never modified.
 */
function isolatedSchema(value:string):string {
  if(typeof value!=="string"||!/^cv03_[a-z0-9_]{1,58}$/u.test(value))
    throw new Error("CV04_EXPORT_AUDIT_ISOLATED_SCHEMA_REQUIRED");
  return '"'+value+'"';
}
function database(input:{connectionString:string;schema:string}){
  const q=isolatedSchema(input.schema);
  if(!input.connectionString?.trim())
    throw new Error("CV04_EXPORT_AUDIT_DATABASE_URL_REQUIRED");
  return {q,sql:postgres(input.connectionString,{
    max:2,connect_timeout:10,idle_timeout:15,prepare:false
  })};
}

/**
 * Explicit schema setup against an isolated cv03_* PostgreSQL resource proof
 * schema, already prepared by preparePostgresConditionalResourceSchemaV010.
 *
 * The trigger runs INSIDE the same INSERT/UPDATE transaction that advances
 * the encrypted resource revision. If the audit insert fails, the resource
 * write fails as well. No dual-write or recovery guesswork.
 *
 * Existing resource table writes by privileged SQL owner are not protected
 * against that same SQL owner disabling triggers: this is NOT a complete
 * production authorization or privileged-tamper-resistant audit certification.
 */
export async function prepareIsolatedDictionaryExportAuditV010(input:{
  connectionString:string;
  schema:string;
  isolatedTestOnly:true;
}):Promise<void>{
  const {q,sql}=database(input);
  if(process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true){
    await sql.end();
    throw new Error("CV04_EXPORT_AUDIT_PRODUCTION_PREPARE_DENIED");
  }
  const ledger=q+".cv04_export_audit";
  try{
    // Must reference original isolated CV-03 CAS table; never invent another
    // business resource authority or attach to a production unknown schema.
    const exists=await sql.unsafe("SELECT to_regclass($1) AS name",[
      input.schema+".resources"
    ]);
    if(!exists[0]?.name)
      throw new Error("CV04_EXPORT_AUDIT_RESOURCE_SCHEMA_NOT_PREPARED");
    await sql.unsafe(
      "CREATE TABLE IF NOT EXISTS "+ledger+" ("+
      "context_id text NOT NULL,job_id text NOT NULL,ordinal int NOT NULL CHECK (ordinal >= 0),"+
      "event_id text NOT NULL,stage text NOT NULL,"+
      "occurred_at timestamptz NOT NULL,rows_count int NOT NULL CHECK (rows_count >= 0),"+
      "bytes_count int NOT NULL CHECK (bytes_count >= 0),"+
      "code text,"+
      "PRIMARY KEY (context_id,job_id,ordinal),"+
      "UNIQUE (event_id))"
    );
    // The job CAS holds current state; history is independently immutable.
    // These stored events contain NO selected columns/rows/CSV content.
    await sql.unsafe(
      "CREATE OR REPLACE FUNCTION "+q+
      ".cv04_audit_immutable() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$"+
      "BEGIN RAISE EXCEPTION 'CV04_EXPORT_SQL_AUDIT_IMMUTABLE'; END; $$");
    await sql.unsafe(
      "DROP TRIGGER IF EXISTS cv04_audit_immutable ON "+ledger);
    await sql.unsafe(
      "CREATE TRIGGER cv04_audit_immutable BEFORE UPDATE OR DELETE ON "+ledger+
      " FOR EACH ROW EXECUTE FUNCTION "+q+".cv04_audit_immutable()"
    );
    await sql.unsafe(
      "CREATE OR REPLACE FUNCTION "+q+
      ".cv04_append_job_resource_audit() RETURNS trigger LANGUAGE plpgsql "+
      "SECURITY DEFINER SET search_path=pg_catalog AS $$ "+
      "DECLARE previous_events jsonb := '[]'::jsonb;"+
      " next_events jsonb; next_meta jsonb; item jsonb; "+
      " before_length int := 0; after_length int; idx int; "+
      "BEGIN "+
      "IF NEW.namespace <> 'evo.dictionary.export-jobs' THEN RETURN NEW; END IF; "+
      "IF NEW.collection_id <> 'bounded-csv-jobs' OR "+
      "NEW.resource_type <> 'evo.dictionary.export.job' OR "+
      "NEW.resource_id !~ '^exj-[0-9a-f]{48}$' OR "+
      "NEW.resource->>'schemaRef' <> 'evo.dictionary.export-job/0.1.0' OR "+
      "NEW.resource->'payload'->>'kind' <> 'dictionary.export-job.encrypted' "+
      "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_RESOURCE_INVALID'; END IF; "+
      "next_meta := NEW.resource->'payload'->'meta'; "+
      "next_events := next_meta->'audit'; "+
      "IF jsonb_typeof(next_meta) <> 'object' OR "+
      "jsonb_typeof(next_events) <> 'array' OR "+
      "next_meta->>'jobId' <> NEW.resource_id OR "+
      "next_meta->>'contextId' <> NEW.context_id OR "+
      "jsonb_array_length(next_events) > 24 "+
      "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_AUDIT_INVALID'; END IF; "+
      "IF TG_OP = 'UPDATE' THEN "+
      "IF OLD.namespace <> NEW.namespace OR OLD.collection_id <> NEW.collection_id OR "+
      "OLD.resource_type <> NEW.resource_type OR OLD.resource_id <> NEW.resource_id OR "+
      "OLD.context_id <> NEW.context_id OR NEW.revision <> OLD.revision + 1 "+
      "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_SCOPE_REVISION_INVALID'; END IF; "+
      "previous_events := OLD.resource->'payload'->'meta'->'audit'; "+
      "IF jsonb_typeof(previous_events) <> 'array' "+
      "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_PRIOR_AUDIT_INVALID'; END IF; "+
      "before_length := jsonb_array_length(previous_events); "+
      "END IF; "+
      "after_length := jsonb_array_length(next_events); "+
      "IF after_length < before_length OR "+
      "next_events->0 IS NULL OR "+
      "next_events->0->>'type' <> 'REQUESTED' OR "+
      "next_events->0->>'eventId' IS NULL OR "+
      "(TG_OP = 'INSERT' AND (NEW.revision <> 0 OR after_length <> 1)) "+
      "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_AUDIT_HISTORY_INVALID'; END IF; "+
      "IF TG_OP = 'UPDATE' AND "+
      "(SELECT COALESCE(jsonb_agg(value ORDER BY ord), '[]'::jsonb) "+
      "FROM jsonb_array_elements(next_events) WITH ORDINALITY AS e(value,ord) "+
      "WHERE ord <= before_length) <> previous_events "+
      "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_AUDIT_REWRITE_DENIED'; END IF; "+
      "FOR idx IN before_length..after_length-1 LOOP "+
      "item := next_events->idx; "+
      "IF jsonb_typeof(item) <> 'object' OR "+
      "item - 'eventId' - 'type' - 'at' - 'rows' - 'bytes' - 'code' <> '{}'::jsonb OR "+
      "item->>'eventId' !~ '^[0-9a-f-]{36}$' OR "+
      "item->>'type' NOT IN "+
      "('REQUESTED','STARTED','COMPLETED','REJECTED','READY','DOWNLOAD_AUTHORIZED','EXPIRED') OR "+
      "item->>'at' IS NULL OR "+
      "(item->>'rows') !~ '^[0-9]+$' OR "+
      "(item->>'bytes') !~ '^[0-9]+$' OR "+
      "(item ? 'code' AND (item->>'code') !~ '^[A-Z0-9_]{1,128}$') "+
      "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_AUDIT_EVENT_INVALID'; END IF; "+
      "INSERT INTO "+ledger+" (context_id,job_id,ordinal,event_id,stage,"+
      "occurred_at,rows_count,bytes_count,code) "+
      "VALUES (NEW.context_id, NEW.resource_id,idx,item->>'eventId',item->>'type',"+
      "(item->>'at')::timestamptz,(item->>'rows')::int,(item->>'bytes')::int,"+
      "item->>'code'); "+
      "END LOOP; "+
      "RETURN NEW; "+
      "END; $$"
    );
    await sql.unsafe(
      "DROP TRIGGER IF EXISTS cv04_export_resource_audit ON "+q+".resources");
    await sql.unsafe(
      "CREATE TRIGGER cv04_export_resource_audit "+
      "BEFORE INSERT OR UPDATE ON "+q+".resources "+
      "FOR EACH ROW EXECUTE FUNCTION "+q+".cv04_append_job_resource_audit()"
    );
  }finally{
    await sql.end();
  }
}

/**
 * Privileged isolated verifier only. This is not an end-user read API and
 * intentionally does not grant SELECT privileges to a runtime SQL login.
 */
export async function readIsolatedDictionaryExportAuditV010(input:{
  connectionString:string;schema:string;
  contextId:string;jobId:string;isolatedTestOnly:true;
}):Promise<{ordinal:number;eventId:string;stage:string;rows:number;bytes:number}[]>{
  const {q,sql}=database(input);
  try{
    if(process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true)
      throw new Error("CV04_EXPORT_AUDIT_PRODUCTION_READ_DENIED");
    if(!input.contextId || !/^exj-[0-9a-f]{48}$/u.test(input.jobId))
      throw new Error("CV04_EXPORT_AUDIT_ADDRESS_INVALID");
    const rows=await sql.unsafe(
      "SELECT ordinal,event_id,stage,rows_count,bytes_count FROM "+q+
      ".cv04_export_audit WHERE context_id=$1 AND job_id=$2 ORDER BY ordinal",
      [input.contextId,input.jobId]);
    return rows.map(r=>({ordinal:Number(r.ordinal),eventId:String(r.event_id),
      stage:String(r.stage),rows:Number(r.rows_count),bytes:Number(r.bytes_count)}));
  }finally{
    await sql.end();
  }
}
