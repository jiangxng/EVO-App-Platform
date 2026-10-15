import postgres from "postgres";

/**
 * D14C2 opt-in coverage certification for domain tables already protected by
 * the D14C1 DB-side Owner INSERT trigger.
 *
 * This is a fresh read-only catalog audit, not a replacement for the SQL
 * trigger: a privileged table owner could disable/replace the trigger AFTER
 * the audit, and can always directly write. No global fail-stop claim.
 */
export interface Pa05DomainOwnerCoverageV010 {
  assertInstalled():Promise<void>;
  close():Promise<void>;
}
type Contract={domainTable:string;domainOwnerLoginRole:string};
const ident=(s:string):string=>{
  if(typeof s!=="string"||!/^[a-z][a-z0-9_]{0,62}$/.test(s))
    throw Error("PA05_XDB_DOMAIN_COVERAGE_TRUSTED_ID_INVALID");
  return s;
};
export async function createPa05DomainOwnerCoverageV010(input:{
  connectionString:string;workerSchema:string;
  /** Complete business-Owner table inventory, pinned by trusted Host config. */
  contracts:readonly Contract[];
}):Promise<Pa05DomainOwnerCoverageV010>{
  const schema=ident(input.workerSchema);
  if(!input.connectionString||!Array.isArray(input.contracts)||
     input.contracts.length<1)
    throw Error("PA05_XDB_DOMAIN_COVERAGE_INVENTORY_REQUIRED");
  const contracts=input.contracts.map(c=>({
    domainTable:ident(c.domainTable),
    domainOwnerLoginRole:ident(c.domainOwnerLoginRole)
  }));
  if(new Set(contracts.map(c=>c.domainTable)).size!==contracts.length)
    throw Error("PA05_XDB_DOMAIN_COVERAGE_DUPLICATE_TABLE");
  const sql=postgres(input.connectionString,{max:2,connect_timeout:5,idle_timeout:10});
  async function assertInstalled():Promise<void>{
    const tables=contracts.map(c=>c.domainTable);
    // All expected tables are required, not merely all tables discovered.
    const rows=await sql.unsafe(
      "SELECT c.oid::text AS oid,c.relname,c.relkind "+
      "FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace "+
      "WHERE n.nspname=$1 AND c.relname=ANY($2::text[])",
      [schema,tables]);
    if(rows.length!==tables.length||
      new Set(rows.map(r=>String(r.relname))).size!==tables.length||
      rows.some(r=>!["r","p"].includes(String(r.relkind))))
      throw Error("PA05_XDB_DOMAIN_COVERAGE_TABLE_MISSING");

    const triggers=await sql.unsafe(
      "SELECT c.relname AS table_name,t.tgname,t.tgenabled,t.tgtype::integer AS mask,"+
      "p.prosecdef,p.proconfig,p.proname,fn.nspname AS function_schema,"+
      "lang.lanname AS function_language "+
      "FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid "+
      "JOIN pg_namespace n ON n.oid=c.relnamespace "+
      "JOIN pg_proc p ON p.oid=t.tgfoid "+
      "JOIN pg_namespace fn ON fn.oid=p.pronamespace "+
      "JOIN pg_language lang ON lang.oid=p.prolang "+
      "WHERE n.nspname=$1 AND c.relname=ANY($2::text[]) "+
      "AND NOT t.tgisinternal AND t.tgname IN "+
      "('pa05_xdb_domain_write_gate','pa05_xdb_domain_no_truncate')",
      [schema,tables]);
    for(const contract of contracts){
      const found=triggers.filter(t=>t.table_name===contract.domainTable);
      if(found.length!==2)throw Error("PA05_XDB_DOMAIN_COVERAGE_TRIGGER_MISSING");
      for(const [trigger,mask,name] of [
        ["pa05_xdb_domain_write_gate",31,"pa05_xdb_domain_guard_"],
        ["pa05_xdb_domain_no_truncate",34,"pa05_xdb_domain_no_truncate_"]
      ] as const){
        const t=found.find(x=>x.tgname===trigger);
        if(!t||t.tgenabled!=="O"||t.mask!==mask||
          t.function_schema!==schema||
          t.proname!==name+contract.domainTable||
          !t.prosecdef||t.function_language!=="plpgsql"||
          !Array.isArray(t.proconfig)||
          !t.proconfig.includes("search_path=pg_catalog"))
          throw Error("PA05_XDB_DOMAIN_COVERAGE_TRIGGER_DISABLED_OR_CHANGED");
      }
    }

    // Real LOGINs may INSERT only their own table. Check delegated role
    // memberships too, including PostgreSQL NOINHERIT / SET ROLE paths.
    // Without this, D14C1's one-time bootstrap privilege verification could
    // grow stale after an administrator accidentally issues a new GRANT.
    for(const contract of contracts){
      const ro=await sql.unsafe(
        "SELECT r.oid AS role_oid,r.rolcanlogin,r.rolsuper,"+
        "r.rolbypassrls,r.rolcreatedb,r.rolcreaterole,r.rolreplication,"+
        "pg_has_role(r.oid,d.datdba,'MEMBER') AS db_owner "+
        "FROM pg_roles r JOIN pg_database d ON d.datname=current_database() "+
        "WHERE r.rolname=$1",[contract.domainOwnerLoginRole]);
      if(ro.length!==1||!ro[0].rolcanlogin||ro[0].rolsuper||
        ro[0].rolbypassrls||ro[0].rolcreatedb||
        ro[0].rolcreaterole||ro[0].rolreplication||ro[0].db_owner)
        throw Error("PA05_XDB_DOMAIN_COVERAGE_OWNER_LOGIN_UNSAFE");

      const rights=await sql.unsafe(
        "SELECT c.relname,"+
        "EXISTS(SELECT 1 FROM pg_roles delegated WHERE "+
        "(delegated.oid=r.oid OR pg_has_role(r.oid,delegated.oid,'MEMBER')) "+
        "AND (has_schema_privilege(delegated.oid,n.oid,'CREATE') OR "+
        "pg_has_role(delegated.oid,c.relowner,'MEMBER') OR "+
        "has_table_privilege(delegated.oid,c.oid,'UPDATE') OR "+
        "has_table_privilege(delegated.oid,c.oid,'DELETE') OR "+
        "has_table_privilege(delegated.oid,c.oid,'TRUNCATE') OR "+
        "has_table_privilege(delegated.oid,c.oid,'TRIGGER'))) AS mutation_right,"+
        "has_table_privilege(r.oid,c.oid,'INSERT') AS can_insert,"+
        "EXISTS(SELECT 1 FROM pg_roles delegated WHERE "+
        "(delegated.oid=r.oid OR pg_has_role(r.oid,delegated.oid,'MEMBER')) "+
        "AND has_table_privilege(delegated.oid,c.oid,'INSERT')) AS delegated_insert "+
        "FROM pg_roles r JOIN pg_class c ON c.relname=ANY($3::text[]) "+
        "JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname=$2 "+
        "WHERE r.rolname=$1",
        [contract.domainOwnerLoginRole,schema,tables]);
      if(rights.length!==tables.length||rights.some(row=>
        row.mutation_right||
        (row.relname===contract.domainTable
          ? !row.can_insert
          : row.delegated_insert)))
        throw Error("PA05_XDB_DOMAIN_COVERAGE_OWNER_PRIVILEGE_DRIFT");
    }
    // Structural consistency only. Already staged tickets and effect
    // execution must still be gated by actual local PostgreSQL triggers.
  }
  try{await assertInstalled();}
  catch(e){await sql.end();throw e;}
  return {assertInstalled,async close(){await sql.end();}};
}
