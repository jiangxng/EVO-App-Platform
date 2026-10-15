import postgres from "postgres";

/**
 * PA05-04D14C opt-in DOMAIN OWNER SQL fence for an explicitly provisioned
 * business table. This is NOT a generic retrofit of existing business
 * plugins. The table must expose the canonical PA-02 effect identity
 * columns and must be owned by a trusted administrative SQL LOGIN.
 *
 * The only authorized physical INSERT principal is the independently
 * authenticated business Owner LOGIN. The DB-side trigger requires the
 * exact D10 Host-staged ticket, PA-02 INVOKING/UNKNOWN state, and an ACTIVE
 * monotone local gate. Already-running effects cannot commit NEW physical
 * rows once the local gate is frozen.
 *
 * PostgreSQL SUPERUSER / table owner can DROP/DISABLE a trigger. An
 * unrelated business table without this trigger remains unprotected.
 */
export async function installPa05DomainOwnerSqlFenceV010(input:{
  connectionString:string;
  workerSchema:string;
  domainTable:string;
  domainOwnerLoginRole:string;
}):Promise<{close():Promise<void>}>{
  const ident=(v:string,code:string)=>{
    if(typeof v!=="string"||!/^[a-z][a-z0-9_]{0,62}$/.test(v))
      throw Error(code);
    return v;
  };
  const schema=ident(input.workerSchema,"PA05_XDB_DOMAIN_SCHEMA_INVALID");
  const table=ident(input.domainTable,"PA05_XDB_DOMAIN_TABLE_INVALID");
  const role=ident(input.domainOwnerLoginRole,"PA05_XDB_DOMAIN_LOGIN_INVALID");
  if(!input.connectionString)throw Error("PA05_XDB_DOMAIN_SQL_REQUIRED");
  const q='"'+schema+'"',business=q+'."'+table+'"';
  const pg=postgres(input.connectionString,{max:2,connect_timeout:10,idle_timeout:15});
  try{
    const host=String((await pg.unsafe("SELECT SESSION_USER AS login"))[0]?.login??"");
    if(host===role)throw Error("PA05_XDB_DOMAIN_DISTINCT_LOGIN_REQUIRED");
    const cols=await pg.unsafe("SELECT column_name FROM information_schema.columns "+
      "WHERE table_schema=$1 AND table_name=$2",[schema,table]);
    const present=new Set(cols.map(x=>String(x.column_name)));
    if(["scope_key","effect_id","run_id","input_digest","fence"].some(x=>!present.has(x)))
      throw Error("PA05_XDB_DOMAIN_PROVENANCE_COLUMNS_REQUIRED");
    const basic=await pg.unsafe(
      "SELECT r.rolcanlogin,r.rolsuper,r.rolbypassrls,r.rolcreaterole,"+
      "r.rolcreatedb,r.rolreplication,"+
      "pg_has_role(r.oid,c.relowner,'MEMBER') AS owns_table,"+
      "pg_has_role(r.oid,d.datdba,'MEMBER') AS owns_database,"+
      "has_schema_privilege(r.oid,n.oid,'CREATE') AS can_create,"+
      "has_table_privilege(r.oid,c.oid,'INSERT') AS can_insert,"+
      "has_table_privilege(r.oid,c.oid,'UPDATE') AS can_update,"+
      "has_table_privilege(r.oid,c.oid,'DELETE') AS can_delete,"+
      "has_table_privilege(r.oid,c.oid,'TRUNCATE') AS can_truncate,"+
      "has_table_privilege(r.oid,c.oid,'TRIGGER') AS can_trigger "+
      "FROM pg_roles r JOIN pg_class c ON c.oid=$2::regclass "+
      "JOIN pg_namespace n ON n.oid=c.relnamespace "+
      "JOIN pg_database d ON d.datname=current_database() WHERE r.rolname=$1",
      [role,business]);
    if(basic.length!==1)throw Error("PA05_XDB_DOMAIN_OWNER_SQL_LOGIN_REQUIRED");
    const a=basic[0];
    if(!a.rolcanlogin||a.rolsuper||a.rolbypassrls||a.rolcreaterole||
       a.rolcreatedb||a.rolreplication||a.owns_table||a.owns_database||
       a.can_create||!a.can_insert||a.can_update||a.can_delete||
       a.can_truncate||a.can_trigger)
      throw Error("PA05_XDB_DOMAIN_OWNER_ROLE_UNSAFE");

    // SECURITY DEFINER checks stable, schema-qualified existing PA-02 and
    // D10 state. Search path stays pg_catalog only. Repeated installation
    // is transactional and never momentarily exposes an unguarded table.
    await pg.begin(async tx=>{
      const body=[
        "BEGIN",
        "IF TG_OP!='INSERT' THEN",
        " RAISE EXCEPTION 'PA05_XDB_DOMAIN_MUTATION_DENIED'; END IF;",
        "IF SESSION_USER!='"+role+"' THEN",
        " RAISE EXCEPTION 'PA05_XDB_DOMAIN_WRONG_OWNER_LOGIN'; END IF;",
        "IF NOT EXISTS(SELECT 1 FROM "+q+".pa05_xdb_remote_config c",
        " WHERE c.singleton AND c.state='ACTIVE' FOR SHARE) THEN",
        " RAISE EXCEPTION 'PA05_XDB_DOMAIN_LOCALLY_FROZEN'; END IF;",
        "IF NOT EXISTS(",
        " SELECT 1 FROM "+q+".pa02b_writes w",
        " JOIN "+q+".pa05_xdb_remote_tickets t",
        " ON t.scope_key=w.scope_key AND t.effect_id=w.effect_id",
        " AND t.run_id=w.run_id AND t.input_digest=w.input_digest",
        " AND t.fence=w.fence",
        " WHERE w.scope_key=NEW.scope_key AND w.effect_id=NEW.effect_id",
        " AND w.run_id=NEW.run_id AND w.input_digest=NEW.input_digest",
        " AND w.fence=NEW.fence AND w.state IN ('INVOKING','UNKNOWN')",
        ") THEN",
        " RAISE EXCEPTION 'PA05_XDB_DOMAIN_DURABLE_ADMISSION_REQUIRED'; END IF;",
        "RETURN NEW; END;"
      ].join("\n");
      const fn=q+".pa05_xdb_domain_guard_"+table;
      await tx.unsafe("CREATE OR REPLACE FUNCTION "+fn+
        "() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER "+
        "SET search_path=pg_catalog AS $pa05$"+body+"$pa05$");
      await tx.unsafe("DROP TRIGGER IF EXISTS pa05_xdb_domain_write_gate ON "+business);
      await tx.unsafe("CREATE TRIGGER pa05_xdb_domain_write_gate "+
        "BEFORE INSERT OR UPDATE OR DELETE ON "+business+
        " FOR EACH ROW EXECUTE FUNCTION "+fn+"()");
      await tx.unsafe("CREATE OR REPLACE FUNCTION "+q+
        ".pa05_xdb_domain_no_truncate_"+table+
        "() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER "+
        "SET search_path=pg_catalog AS $pa05$"+
        "BEGIN RAISE EXCEPTION 'PA05_XDB_DOMAIN_TRUNCATE_DENIED'; END;"+
        "$pa05$");
      await tx.unsafe("DROP TRIGGER IF EXISTS pa05_xdb_domain_no_truncate ON "+business);
      await tx.unsafe("CREATE TRIGGER pa05_xdb_domain_no_truncate "+
        "BEFORE TRUNCATE ON "+business+" FOR EACH STATEMENT EXECUTE FUNCTION "+
        q+".pa05_xdb_domain_no_truncate_"+table+"()");
    });
    return {async close(){await pg.end();}};
  }catch(e){await pg.end();throw e;}
}
