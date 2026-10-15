import postgres from "postgres";

/**
 * D14C4: explicit admin-only installation onto the ACTUAL first-party PA02
 * Object Extension business tables. No implicit production migration.
 * The business SQL credential must be a distinct non-owner LOGIN limited
 * to SELECT+INSERT; a raw Owner call without the Host's transaction-local
 * PA05 source markers is denied by PostgreSQL itself.
 *
 * Privileged DBA/table owners can disable a trigger. A compromised Owner
 * LOGIN could forge GUC values for an EXISTING valid ticket; full machine/
 * command authenticity and arbitrary partition fail-stop remain unsigned.
 */
const ident=(s:string,pattern:RegExp,code:string)=>{
  if(typeof s!=="string"||!pattern.test(s))throw Error(code);
  return s;
};
export async function installPa05ObjectExtensionPhysicalFenceV010(input:{
  connectionString:string;objectSchema:string;workerSchema:string;
  businessOwnerLoginRole:string;
}):Promise<void>{
  const object=ident(input.objectSchema,/^pa02_[a-z0-9_]{1,58}$/,
    "PA05_OBJECT_SQL_PHYSICAL_SCHEMA_INVALID");
  const worker=ident(input.workerSchema,/^[a-z][a-z0-9_]{0,62}$/,
    "PA05_OBJECT_SQL_WORKER_SCHEMA_INVALID");
  const role=ident(input.businessOwnerLoginRole,/^[a-z][a-z0-9_]{0,62}$/,
    "PA05_OBJECT_SQL_BUSINESS_LOGIN_INVALID");
  if(!input.connectionString||worker===object)
    throw Error("PA05_OBJECT_SQL_DISTINCT_SCHEMAS_REQUIRED");
  const d='"'+object+'"',w='"'+worker+'"';
  const pg=postgres(input.connectionString,{max:2,connect_timeout:10});
  try{
    const auth=await pg.unsafe(
      "SELECT SESSION_USER AS login,"+
      "r.rolcanlogin,r.rolsuper,r.rolbypassrls,r.rolcreatedb,"+
      "r.rolcreaterole,r.rolreplication,"+
      "pg_has_role(r.oid,db.datdba,'MEMBER') AS db_owner "+
      "FROM pg_roles r JOIN pg_database db ON db.datname=current_database() "+
      "WHERE r.rolname=$1",[role]);
    const realRole=auth[0];
    const adminLogin=String((await pg.unsafe("SELECT SESSION_USER AS login"))[0].login);
    if(auth.length!==1||!realRole.rolcanlogin||realRole.rolsuper||
      realRole.rolbypassrls||realRole.rolcreatedb||realRole.rolcreaterole||
      realRole.rolreplication||realRole.db_owner||adminLogin===role)
      throw Error("PA05_OBJECT_SQL_OWNER_LOGIN_UNSAFE");
    const tables=["pa02_contexts","pa02_definitions","pa02_owner_evidence"];
    const acl=await pg.unsafe(
      "SELECT c.relname, "+
      "pg_has_role(r.oid,c.relowner,'MEMBER') AS table_owner,"+
      "has_schema_privilege(r.oid,n.oid,'CREATE') AS can_create,"+
      "has_table_privilege(r.oid,c.oid,'SELECT') AS can_select,"+
      "has_table_privilege(r.oid,c.oid,'INSERT') AS can_insert,"+
      "has_table_privilege(r.oid,c.oid,'UPDATE') AS can_update,"+
      "has_table_privilege(r.oid,c.oid,'DELETE') AS can_delete,"+
      "has_table_privilege(r.oid,c.oid,'TRUNCATE') AS can_truncate,"+
      "has_table_privilege(r.oid,c.oid,'TRIGGER') AS can_trigger "+
      "FROM pg_roles r JOIN pg_class c ON true "+
      "JOIN pg_namespace n ON n.oid=c.relnamespace "+
      "WHERE r.rolname=$1 AND n.nspname=$2 AND c.relname=ANY($3::text[])",
      [role,object,tables]);
    if(acl.length!==3||acl.some(row=>
      row.table_owner||row.can_create||!row.can_select||!row.can_insert||
      row.can_update||row.can_delete||row.can_truncate||row.can_trigger))
      throw Error("PA05_OBJECT_SQL_BUSINESS_DML_PRIVILEGES_UNSAFE");
    const actual=await pg.unsafe(
      "SELECT n.nspname,c.relname,a.attname FROM pg_class c "+
      "JOIN pg_namespace n ON n.oid=c.relnamespace "+
      "JOIN pg_attribute a ON a.attrelid=c.oid "+
      "WHERE n.nspname=$1 AND c.relname=ANY($2::text[]) "+
      "AND a.attnum>0 AND NOT a.attisdropped",[object,tables]);
    for(const table of tables){
      for(const column of ["context_id","enterprise_id"])
        if(!actual.some(x=>x.relname===table&&x.attname===column))
          throw Error("PA05_OBJECT_SQL_ACTUAL_TABLE_CONTRACT_MISSING");
    }
    const orig=await pg.unsafe(
      "SELECT t.tgenabled FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid "+
      "JOIN pg_namespace n ON n.oid=c.relnamespace "+
      "WHERE n.nspname=$1 AND c.relname='pa02_owner_evidence' "+
      "AND t.tgname='pa02_evidence_immutable'",[object]);
    if(orig.length!==1||orig[0].tgenabled!=="O")
      throw Error("PA05_OBJECT_SQL_IMMUTABLE_OWNER_EVIDENCE_REQUIRED");
    // No "temporary unguarded" interval between installing 3 triggers:
    // transactional DDL commits atomically on PostgreSQL.
    await pg.begin(async tx=>{
      const source=(key:string)=>"current_setting('evo.pa05."+key+"',true)";
      const body=[
        "DECLARE v_scope text;v_run text;v_effect text;v_digest text;",
        " v_context text;v_enterprise text;",
        "BEGIN",
        "IF TG_OP!='INSERT' THEN",
        " RAISE EXCEPTION 'PA05_OBJECT_SQL_MUTATION_DENIED'; END IF;",
        "IF SESSION_USER!='"+role+"' THEN",
        " RAISE EXCEPTION 'PA05_OBJECT_SQL_WRONG_LOGIN'; END IF;",
        "v_scope:="+source("scope_key")+";",
        "v_run:="+source("run_id")+";",
        "v_effect:="+source("effect_id")+";",
        "v_digest:="+source("input_digest")+";",
        "v_context:="+source("context_id")+";",
        "v_enterprise:="+source("enterprise_id")+";",
        "IF v_scope IS NULL OR v_scope='' OR v_run IS NULL OR",
        " v_effect IS NULL OR v_digest IS NULL OR",
        " v_context IS NULL OR v_enterprise IS NULL THEN",
        " RAISE EXCEPTION 'PA05_OBJECT_SQL_TRANSACTION_SOURCE_REQUIRED'; END IF;",
        "IF NEW.context_id IS DISTINCT FROM v_context OR",
        " NEW.enterprise_id IS DISTINCT FROM v_enterprise THEN",
        " RAISE EXCEPTION 'PA05_OBJECT_SQL_ENTERPRISE_MISMATCH'; END IF;",
        "IF TG_TABLE_NAME='pa02_owner_evidence' AND (",
        " NEW.run_id IS DISTINCT FROM v_run OR",
        " NEW.effect_id IS DISTINCT FROM v_effect OR",
        " NEW.input_digest IS DISTINCT FROM v_digest) THEN",
        " RAISE EXCEPTION 'PA05_OBJECT_SQL_OWNER_EVIDENCE_SOURCE_MISMATCH'; END IF;",
        "IF NOT EXISTS(SELECT 1 FROM "+w+".pa05_xdb_remote_config c",
        " WHERE c.singleton AND c.state='ACTIVE' FOR SHARE) THEN",
        " RAISE EXCEPTION 'PA05_OBJECT_SQL_LOCAL_FREEZE'; END IF;",
        "IF NOT EXISTS (SELECT 1 FROM "+w+".pa02b_writes p",
        " JOIN "+w+".pa05_xdb_remote_tickets t",
        " ON t.scope_key=p.scope_key AND t.effect_id=p.effect_id",
        " AND t.run_id=p.run_id AND t.input_digest=p.input_digest",
        " AND t.fence=p.fence",
        " WHERE p.scope_key=v_scope AND p.run_id=v_run",
        " AND p.effect_id=v_effect AND p.input_digest=v_digest",
        " AND p.state IN ('INVOKING','UNKNOWN')) THEN",
        " RAISE EXCEPTION 'PA05_OBJECT_SQL_DURABLE_ADMISSION_REQUIRED'; END IF;",
        "RETURN NEW; END;"
      ].join("\n");
      await tx.unsafe("CREATE OR REPLACE FUNCTION "+d+
        ".pa05_object_business_guard() RETURNS trigger LANGUAGE plpgsql "+
        "SECURITY DEFINER SET search_path=pg_catalog AS $pa05$"+
        body+"$pa05$");
      await tx.unsafe("CREATE OR REPLACE FUNCTION "+d+
        ".pa05_object_truncate_guard() RETURNS trigger LANGUAGE plpgsql "+
        "SECURITY DEFINER SET search_path=pg_catalog AS $pa05$"+
        "BEGIN RAISE EXCEPTION 'PA05_OBJECT_SQL_TRUNCATE_DENIED'; END;"+
        "$pa05$");
      for(const table of tables){
        const target=d+'."'+table+'"';
        await tx.unsafe("DROP TRIGGER IF EXISTS pa05_object_physical_guard ON "+target);
        await tx.unsafe("CREATE TRIGGER pa05_object_physical_guard "+
          "BEFORE INSERT OR UPDATE OR DELETE ON "+target+
          " FOR EACH ROW EXECUTE FUNCTION "+d+".pa05_object_business_guard()");
        await tx.unsafe("DROP TRIGGER IF EXISTS pa05_object_truncate_guard ON "+target);
        await tx.unsafe("CREATE TRIGGER pa05_object_truncate_guard "+
          "BEFORE TRUNCATE ON "+target+" FOR EACH STATEMENT EXECUTE FUNCTION "+
          d+".pa05_object_truncate_guard()");
      }
    });
  }finally{await pg.end();}
}
