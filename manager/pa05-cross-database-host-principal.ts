import postgres from "postgres";

/**
 * PA05-04D14B1: read-only, opt-in cross-PHYSICAL-DB Host LOGIN attestation.
 *
 * The central/remote manifests are provisioned OUT OF BAND by trusted DB
 * administrators. Every verification opens FRESH authenticated connections,
 * so a rotated/revoked password cannot silently reuse an existing pool.
 * Real SESSION_USER and PG system identifiers must match both immutable
 * manifests on three separate PG clusters. This does NOT provide atomic
 * cross-DB revocation, global fencing, or production Host launch control.
 */
export interface Pa05CrossDatabaseHostPrincipalV010 {
  readonly hostId: string;
  readonly revision:number;
  assertActive(): Promise<void>;
}
const identifier=(v:string,code:string):string=>{
  if(typeof v!=="string"||!/^[a-z][a-z0-9_]{0,62}$/.test(v))
    throw Error(code);
  return v;
};
const opaqueId=(v:string,code:string):string=>{
  if(typeof v!=="string"||!/^[a-zA-Z][a-zA-Z0-9_.-]{0,127}$/.test(v))
    throw Error(code);
  return v;
};
type DbRef={
  connectionString:string;schema:string;workerId:string;
  /** Optional D14B3 real business/Worker schema to audit for DML drift. */
  protectedSchema?:string;
};
type Row=Record<string,unknown>;
type Connection={unsafe:(query:string,params?:unknown[])=>Promise<Row[]>;end:()=>Promise<void>};
function closeEnough(p:unknown):p is string{
  return typeof p==="string"&&/^[0-9]+$/.test(p);
}
async function queryFresh(connectionString:string,fn:(db:Connection)=>Promise<void>):Promise<void>{
  if(typeof connectionString!=="string"||!connectionString)
    throw Error("PA05_XDB_HOST_IDENTITY_CONNECTION_REQUIRED");
  const sql=postgres(connectionString,{max:1,connect_timeout:5,idle_timeout:1});
  try{await fn(sql as unknown as Connection);}
  finally{await sql.end();}
}
async function principalRoleAudit(
  db:Connection,schema:string,manifest:string,protectedSchema?:string,
  protectedTables:readonly string[]=[]
):Promise<void>{
  const rows=await db.unsafe(
    "SELECT r.rolcanlogin,r.rolsuper,r.rolbypassrls,r.rolcreaterole,"+
    "r.rolcreatedb,r.rolreplication,"+
    "pg_has_role(r.oid,d.datdba,'MEMBER') AS database_owner_member,"+
    "pg_has_role(r.oid,c.relowner,'MEMBER') AS manifest_owner_member,"+
    "has_schema_privilege(r.oid,n.oid,'CREATE') AS schema_create,"+
    "has_table_privilege(r.oid,c.oid,'INSERT') AS can_insert,"+
    "has_table_privilege(r.oid,c.oid,'UPDATE') AS can_update,"+
    "has_table_privilege(r.oid,c.oid,'DELETE') AS can_delete,"+
    "has_table_privilege(r.oid,c.oid,'TRUNCATE') AS can_truncate,"+
    "has_table_privilege(r.oid,c.oid,'TRIGGER') AS can_trigger "+
    "FROM pg_roles r "+
    "JOIN pg_database d ON d.datname=current_database() "+
    "JOIN pg_class c ON c.oid=$1::regclass "+
    "JOIN pg_namespace n ON n.oid=c.relnamespace "+
    "WHERE r.rolname=SESSION_USER",
    ['"'+schema+'".'+manifest]
  );
  if(rows.length!==1)throw Error("PA05_XDB_HOST_IDENTITY_LOGIN_NOT_FOUND");
  const r=rows[0];
  if(!r.rolcanlogin||r.rolsuper||r.rolbypassrls||r.rolcreaterole||
    r.rolcreatedb||r.rolreplication||r.database_owner_member||
    r.manifest_owner_member||r.schema_create||r.can_insert||
    r.can_update||r.can_delete||r.can_truncate||r.can_trigger)
    throw Error("PA05_XDB_HOST_IDENTITY_SQL_ROLE_UNSAFE");
  if(protectedSchema) {
    // A read-only attestation role must NOT be able to mutate central
    // reservation/Owner inventory or any remote WRITE/ticket/config table.
    // Pg's role MEMBER graph also catches SET ROLE/NOINHERIT delegation
    // and ordinary PUBLIC grants, rather than checking only direct GRANTs.
    const protectedRows=await db.unsafe(
      "SELECT c.relname, "+
      "has_schema_privilege(SESSION_USER,n.oid,'CREATE') AS schema_create,"+
      "EXISTS (SELECT 1 FROM pg_roles delegate "+
      "WHERE (delegate.oid=actor.oid OR "+
      "pg_has_role(actor.oid,delegate.oid,'MEMBER')) "+
      "AND (pg_has_role(delegate.oid,c.relowner,'MEMBER') OR "+
      "has_table_privilege(delegate.oid,c.oid,'INSERT') OR "+
      "has_table_privilege(delegate.oid,c.oid,'UPDATE') OR "+
      "has_table_privilege(delegate.oid,c.oid,'DELETE') OR "+
      "has_table_privilege(delegate.oid,c.oid,'TRUNCATE') OR "+
      "has_table_privilege(delegate.oid,c.oid,'TRIGGER'))) AS delegated_write "+
      "FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace "+
      "JOIN pg_roles actor ON actor.rolname=SESSION_USER "+
      "WHERE n.nspname=$1 AND c.relname=ANY($2::text[]) "+
      "AND c.relkind IN ('r','p')",[protectedSchema,protectedTables]
    );
    if(protectedRows.length!==protectedTables.length||
      new Set(protectedRows.map(x=>String(x.relname))).size!==protectedTables.length)
      throw Error("PA05_XDB_HOST_IDENTITY_PROTECTED_TABLES_MISSING");
    if(protectedRows.some(x=>x.schema_create||x.delegated_write))
      throw Error("PA05_XDB_HOST_IDENTITY_PROTECTED_SQL_PRIVILEGE_DRIFT");
  }
}
export function createPa05CrossDatabaseHostPrincipalV010(input:{
  hostId:string;
  revision:number;
  centralConnectionString:string;
  centralSchema:string;
  /** D14B3 optional guarded central authority schema (all tables required). */
  centralProtectedSchema?:string;
  /**
   * Exactly one remote database per declared trusted Worker ID; the
   * *database URL* is Host configuration, never from the LLM/Worker.
   */
  remoteDatabases:readonly DbRef[];
}):Pa05CrossDatabaseHostPrincipalV010 {
  const hostId=opaqueId(input.hostId,"PA05_XDB_HOST_IDENTITY_HOST_ID_INVALID");
  const revision=input.revision;
  if(!Number.isSafeInteger(revision)||revision<1)
    throw Error("PA05_XDB_HOST_IDENTITY_REVISION_INVALID");
  const centralSchema=identifier(input.centralSchema,"PA05_XDB_HOST_IDENTITY_SCHEMA_INVALID");
  const centralProtected=input.centralProtectedSchema
    ?identifier(input.centralProtectedSchema,"PA05_XDB_HOST_IDENTITY_PROTECTED_SCHEMA_INVALID")
    :undefined;
  const remotes=input.remoteDatabases.map(r=>({
    connectionString:r.connectionString,
    schema:identifier(r.schema,"PA05_XDB_HOST_IDENTITY_SCHEMA_INVALID"),
    protectedSchema:r.protectedSchema
      ?identifier(r.protectedSchema,"PA05_XDB_HOST_IDENTITY_PROTECTED_SCHEMA_INVALID")
      :undefined,
    workerId:opaqueId(r.workerId,"PA05_XDB_HOST_IDENTITY_WORKER_INVALID")
  })).sort((a,b)=>a.workerId.localeCompare(b.workerId));
  if(!remotes.length||new Set(remotes.map(r=>r.workerId)).size!==remotes.length)
    throw Error("PA05_XDB_HOST_IDENTITY_INVENTORY_INVALID");

  const manifest="pa05_xdb_host_identity_bindings";
  const cq='"'+centralSchema+'".'+manifest;
  return {
    hostId,
    revision,
    async assertActive() {
      // All evidence must originate in fresh real SQL LOGIN sessions.
      // No remote can manufacture an untrusted worker inventory.
      let centralLogin="",centralSystem="";
      let centralRows:Row[]=[];
      try{
        await queryFresh(input.centralConnectionString,async sql=>{
          const info=await sql.unsafe("SELECT SESSION_USER AS login,"+
            "(SELECT system_identifier::text FROM pg_control_system()) AS system_id");
          centralLogin=String(info[0]?.login??"");
          centralSystem=String(info[0]?.system_id??"");
          await principalRoleAudit(sql,centralSchema,manifest,centralProtected,
            ["pa05_xdb_workers","pa05_xdb_owners","pa05_xdb_reservations"]);
          centralRows=await sql.unsafe("SELECT host_id,revision,worker_id,"+
            "central_login,remote_login,remote_system_id,state FROM "+cq+
            " WHERE host_id=$1 ORDER BY worker_id",[hostId]);
        });
      }catch(error){
        throw Error("PA05_XDB_HOST_IDENTITY_CENTRAL_UNVERIFIED",{cause:error});
      }
      if(!centralSystem||!closeEnough(centralSystem)||
        centralRows.length!==remotes.length||
        centralRows.some((r,i)=>
          r.host_id!==hostId||Number(r.revision)!==revision||
          r.worker_id!==remotes[i].workerId||
          r.central_login!==centralLogin||r.state!=="ACTIVE"||
          !closeEnough(r.remote_system_id)||!r.remote_login))
        throw Error("PA05_XDB_HOST_IDENTITY_CENTRAL_BINDING_MISMATCH");

      const outcome=await Promise.allSettled(remotes.map(async(remote,i)=>{
        await queryFresh(remote.connectionString,async sql=>{
          const info=await sql.unsafe("SELECT SESSION_USER AS login,"+
            "(SELECT system_identifier::text FROM pg_control_system()) AS system_id");
          const login=String(info[0]?.login??"");
          const systemId=String(info[0]?.system_id??"");
          await principalRoleAudit(sql,remote.schema,manifest,
            remote.protectedSchema,
            ["pa02b_writes","pa05_xdb_remote_tickets","pa05_xdb_remote_config"]);
          const rows=await sql.unsafe("SELECT host_id,revision,worker_id,"+
            "central_login,central_system_id,remote_login,remote_system_id,state "+
            "FROM "+'"'+remote.schema+'".'+manifest+
            " WHERE host_id=$1 AND worker_id=$2",[hostId,remote.workerId]);
          const c=centralRows[i];
          const r=rows[0];
          if(rows.length!==1||!r||r.host_id!==hostId||
            Number(r.revision)!==revision||r.worker_id!==remote.workerId||
            r.state!=="ACTIVE"||r.central_login!==centralLogin||
            r.central_system_id!==centralSystem||
            r.remote_login!==login||r.remote_login!==c.remote_login||
            r.remote_system_id!==systemId||
            r.remote_system_id!==c.remote_system_id)
            throw Error("PA05_XDB_HOST_IDENTITY_REMOTE_BINDING_MISMATCH");
        });
      }));
      if(outcome.some(x=>x.status==="rejected"))
        throw Error("PA05_XDB_HOST_IDENTITY_REMOTE_UNVERIFIED",{
          cause:outcome.filter(x=>x.status==="rejected").map(x=>x.reason)
        });
      // Physical system IDs must be distinct: no 3 schemas on one instance.
      if(new Set([centralSystem,...centralRows.map(x=>String(x.remote_system_id))])
          .size!==remotes.length+1)
        throw Error("PA05_XDB_HOST_IDENTITY_PHYSICAL_CLUSTER_COLLISION");
    }
  };
}
