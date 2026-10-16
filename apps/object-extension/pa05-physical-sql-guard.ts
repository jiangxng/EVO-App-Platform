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
  /** D14C5: optional independent Host SQL LOGIN required to mint a one-effect permit. */
  trustedHostLoginRole?:string;
}):Promise<void>{
  const object=ident(input.objectSchema,/^pa02_[a-z0-9_]{1,58}$/,
    "PA05_OBJECT_SQL_PHYSICAL_SCHEMA_INVALID");
  const worker=ident(input.workerSchema,/^[a-z][a-z0-9_]{0,62}$/,
    "PA05_OBJECT_SQL_WORKER_SCHEMA_INVALID");
  const role=ident(input.businessOwnerLoginRole,/^[a-z][a-z0-9_]{0,62}$/,
    "PA05_OBJECT_SQL_BUSINESS_LOGIN_INVALID");
  const hostRole=input.trustedHostLoginRole
    ?ident(input.trustedHostLoginRole,/^[a-z][a-z0-9_]{0,62}$/,
      "PA05_OBJECT_SQL_HOST_LOGIN_INVALID"):null;
  if(hostRole===role)throw Error("PA05_OBJECT_SQL_HOST_OWNER_LOGIN_MUST_DIFFER");
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
    if(hostRole){
      const hostAudit=await pg.unsafe(
        "SELECT h.rolcanlogin,h.rolsuper,h.rolbypassrls,"+
        "h.rolcreatedb,h.rolcreaterole,h.rolreplication,"+
        "pg_has_role(h.oid,db.datdba,'MEMBER') AS database_owner,"+
        "pg_has_role(h.oid,b.oid,'MEMBER') AS host_can_assume_business,"+
        "pg_has_role(b.oid,h.oid,'MEMBER') AS business_can_assume_host,"+
        "has_schema_privilege(h.oid,$3,'CREATE') AS host_schema_create "+
        "FROM pg_roles h JOIN pg_roles b ON b.rolname=$2 "+
        "JOIN pg_database db ON db.datname=current_database() "+
        "WHERE h.rolname=$1",[hostRole,role,object]);
      const h=hostAudit[0];
      if(hostAudit.length!==1||!h.rolcanlogin||h.rolsuper||
        h.rolbypassrls||h.rolcreatedb||h.rolcreaterole||
        h.rolreplication||h.database_owner||h.host_can_assume_business||
        h.business_can_assume_host||h.host_schema_create||
        adminLogin===hostRole)
        throw Error("PA05_OBJECT_SQL_HOST_LOGIN_UNSAFE");
      const hostTableAcl=await pg.unsafe(
        "SELECT c.relname,pg_has_role(h.oid,c.relowner,'MEMBER') AS owns,"+
        "has_table_privilege(h.oid,c.oid,'INSERT') AS can_insert,"+
        "has_table_privilege(h.oid,c.oid,'UPDATE') AS can_update,"+
        "has_table_privilege(h.oid,c.oid,'DELETE') AS can_delete "+
        "FROM pg_roles h JOIN pg_class c ON true "+
        "JOIN pg_namespace n ON n.oid=c.relnamespace "+
        "WHERE h.rolname=$1 AND n.nspname=$2 "+
        "AND c.relname=ANY($3::text[])",[hostRole,object,tables]);
      if(hostTableAcl.length!==3||hostTableAcl.some(x=>
        x.owns||x.can_insert||x.can_update||x.can_delete))
        throw Error("PA05_OBJECT_SQL_HOST_DML_PRIVILEGES_UNSAFE");
    }
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
      if(hostRole){
        // Protected Host decision, not a Business Owner GUC or an Agent-facing
        // API. The Owner SQL LOGIN has NO read/write/execute access to minting.
        await tx.unsafe("CREATE TABLE "+d+".pa05_object_host_permits ("+
          "scope_key text NOT NULL,effect_id text NOT NULL,run_id text NOT NULL,"+
          "input_digest text NOT NULL,context_id text NOT NULL,"+
          "enterprise_id text NOT NULL,token text NOT NULL,"+
          "issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),"+
          "consumed boolean NOT NULL DEFAULT false,"+
          "revoked boolean NOT NULL DEFAULT false,"+
          "bound_backend_pid integer,bound_transaction_id text,"+
          "approved_resource jsonb NOT NULL,approved_evidence jsonb NOT NULL,"+
          "approved_evidence_digest text NOT NULL,"+
          "approved_idempotency_hash text NOT NULL,"+
          "PRIMARY KEY(scope_key,effect_id))");
        await tx.unsafe("REVOKE ALL ON "+d+
          ".pa05_object_host_permits FROM PUBLIC");
        await tx.unsafe("REVOKE ALL ON "+d+
          ".pa05_object_host_permits FROM "+'\"'+role+'\"'+","+'\"'+hostRole+'\"');
        // D14C9: a separately authenticated Host command is staged BEFORE
        // Owner invocation. This table is opaque to both business and Host
        // SQL LOGINs; only the Host SECURITY DEFINER registrar can INSERT.
        await tx.unsafe("CREATE TABLE "+d+".pa05_object_host_commands ("+
          "scope_key text NOT NULL,effect_id text NOT NULL,"+
          "run_id text NOT NULL,input_digest text NOT NULL,"+
          "context_id text NOT NULL,enterprise_id text NOT NULL,"+
          "approved_source jsonb NOT NULL CHECK(jsonb_typeof(approved_source)='object'),"+
          "registered_at timestamptz NOT NULL DEFAULT clock_timestamp(),"+
          "PRIMARY KEY(scope_key,effect_id))");
        await tx.unsafe("REVOKE ALL ON "+d+
          ".pa05_object_host_commands FROM PUBLIC");
        await tx.unsafe("REVOKE ALL ON "+d+
          ".pa05_object_host_commands FROM "+'\"'+role+'\"'+","+'\"'+hostRole+'\"');

        // D14C6: re-attest real database role grants INSIDE SQL authority,
        // not in an optional JS wrapper. A committed GRANT / membership
        // change invalidates both subsequent Host issuances and Owner writes.
        // It is not a global lock on concurrent administrator ACL mutations.
        const driftBody=[
          "DECLARE v_business oid;v_host oid;",
          "BEGIN",
          "SELECT oid INTO v_business FROM pg_roles WHERE rolname='"+role+"';",
          "SELECT oid INTO v_host FROM pg_roles WHERE rolname='"+hostRole+"';",
          "IF v_business IS NULL OR v_host IS NULL THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_ROLE_DRIFT'; END IF;",
          "IF EXISTS(SELECT 1 FROM pg_roles a",
          " WHERE a.oid IN(v_business,v_host) AND",
          " (NOT a.rolcanlogin OR a.rolsuper OR a.rolbypassrls",
          " OR a.rolcreatedb OR a.rolcreaterole OR a.rolreplication",
          " OR pg_has_role(a.oid,(SELECT datdba FROM pg_database",
          " WHERE datname=current_database()),'MEMBER'))) OR",
          " pg_has_role(v_business,v_host,'MEMBER') OR",
          " pg_has_role(v_host,v_business,'MEMBER') THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_ROLE_DRIFT'; END IF;",
          "IF (SELECT count(*) FROM pg_class c",
          " JOIN pg_namespace n ON n.oid=c.relnamespace",
          " WHERE (n.nspname='"+object+"' AND c.relname IN",
          " ('pa02_contexts','pa02_definitions','pa02_owner_evidence',",
          " 'pa05_object_host_permits','pa05_object_host_commands')) OR",
          " (n.nspname='"+worker+"' AND c.relname IN",
          " ('pa02b_writes','pa05_xdb_remote_tickets',",
          " 'pa05_xdb_remote_config'))) != 8 THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_ROLE_DRIFT'; END IF;",
          "IF EXISTS(SELECT 1 FROM pg_roles a",
          " JOIN pg_roles delegated ON delegated.oid=a.oid OR",
          " pg_has_role(a.oid,delegated.oid,'MEMBER')",
          " JOIN pg_class c ON true",
          " JOIN pg_namespace n ON n.oid=c.relnamespace",
          " WHERE a.oid IN(v_business,v_host) AND",
          " ((n.nspname='"+object+"' AND c.relname IN",
          " ('pa02_contexts','pa02_definitions','pa02_owner_evidence',",
          " 'pa05_object_host_permits','pa05_object_host_commands')) OR",
          " (n.nspname='"+worker+"' AND c.relname IN",
          " ('pa02b_writes','pa05_xdb_remote_tickets',",
          " 'pa05_xdb_remote_config'))) AND",
          " (pg_has_role(delegated.oid,c.relowner,'MEMBER') OR",
          " has_schema_privilege(delegated.oid,n.oid,'CREATE') OR",
          " has_table_privilege(delegated.oid,c.oid,'UPDATE') OR",
          " has_table_privilege(delegated.oid,c.oid,'DELETE') OR",
          " has_table_privilege(delegated.oid,c.oid,'TRUNCATE') OR",
          " has_table_privilege(delegated.oid,c.oid,'TRIGGER') OR",
          " has_table_privilege(delegated.oid,c.oid,'MAINTAIN') OR",
          " ((n.nspname='"+worker+"' OR",
          " c.relname IN('pa05_object_host_permits',",
          " 'pa05_object_host_commands') OR",
          " a.oid=v_host) AND",
          " (has_table_privilege(delegated.oid,c.oid,'SELECT') OR",
          " has_table_privilege(delegated.oid,c.oid,'INSERT'))))) THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_ROLE_DRIFT'; END IF;",
          "IF has_function_privilege(v_business,",
          " '"+object+".pa05_object_issue_host_permit(text,text,text,text,text,text,jsonb,jsonb,text,text,jsonb)',",
          " 'EXECUTE') OR has_function_privilege(v_business,",
          " '"+object+".pa05_object_register_host_command(text,text,text,text,text,text,jsonb)',",
          " 'EXECUTE') OR has_function_privilege(v_business,",
          " '"+object+".pa05_object_revoke_host_permit(text,text,text)',",
          " 'EXECUTE') OR has_function_privilege(v_business,",
          " '"+object+".pa05_object_bind_host_permit(text,text,text,integer,text)',",
          " 'EXECUTE') THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_ROLE_DRIFT'; END IF;",
          "RETURN; END;"
        ].join("\n");
        await tx.unsafe("CREATE FUNCTION "+d+
          ".pa05_object_assert_role_boundary() RETURNS void "+
          "LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog "+
          "AS $pa05$"+driftBody+"$pa05$");
        await tx.unsafe("REVOKE ALL ON FUNCTION "+d+
          ".pa05_object_assert_role_boundary() FROM PUBLIC");

        // Host-only immutable command registration is deliberately a separate
        // call from Owner's issue() request. No implicit auto-registration.
        const registerBody=[
          "DECLARE v_existing jsonb;",
          "BEGIN",
          "IF SESSION_USER!='"+hostRole+"' THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_HOST_LOGIN_REQUIRED'; END IF;",
          "PERFORM "+d+".pa05_object_assert_role_boundary();",
          "IF jsonb_typeof(p_source) IS DISTINCT FROM 'object'",
          " OR jsonb_typeof(p_source->'arguments') IS DISTINCT FROM 'object'",
          " OR p_source->>'runId' IS DISTINCT FROM p_run",
          " OR p_source->>'effectId' IS DISTINCT FROM p_effect",
          " OR p_source->>'inputDigest' IS DISTINCT FROM p_digest",
          " OR p_source->>'contextId' IS DISTINCT FROM p_context",
          " OR p_source->>'enterpriseId' IS DISTINCT FROM p_enterprise",
          " OR COALESCE(p_source->>'receiptId','')=''",
          " OR COALESCE(p_source->>'idempotencyKey','')=''",
          " OR COALESCE(p_source->>'toolId','')=''",
          " OR COALESCE(p_source->>'principalSubjectId','')=''",
          " OR p_source->>'principalActorType' NOT IN('AI','HUMAN') THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_HOST_COMMAND_SOURCE_INVALID';",
          "END IF;",
          "INSERT INTO "+d+".pa05_object_host_commands",
          " (scope_key,effect_id,run_id,input_digest,context_id,enterprise_id,approved_source)",
          " VALUES(p_scope,p_effect,p_run,p_digest,p_context,p_enterprise,p_source)",
          " ON CONFLICT DO NOTHING;",
          "SELECT approved_source INTO v_existing",
          " FROM "+d+".pa05_object_host_commands",
          " WHERE scope_key=p_scope AND effect_id=p_effect",
          " AND run_id=p_run AND input_digest=p_digest",
          " AND context_id=p_context AND enterprise_id=p_enterprise",
          " FOR SHARE;",
          "IF NOT FOUND OR v_existing IS DISTINCT FROM p_source THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_HOST_COMMAND_IMMUTABLE';",
          "END IF;",
          "RETURN 'APPROVED'; END;"
        ].join("\n");
        await tx.unsafe("CREATE FUNCTION "+d+
          ".pa05_object_register_host_command(p_scope text,p_run text,"+
          "p_effect text,p_digest text,p_context text,p_enterprise text,"+
          "p_source jsonb) RETURNS text LANGUAGE plpgsql SECURITY DEFINER "+
          "SET search_path=pg_catalog AS $pa05$"+registerBody+"$pa05$");
        await tx.unsafe("REVOKE ALL ON FUNCTION "+d+
          ".pa05_object_register_host_command(text,text,text,text,text,text,jsonb) FROM PUBLIC");
        await tx.unsafe("GRANT USAGE ON SCHEMA "+d+" TO "+'\"'+hostRole+'\"');
        await tx.unsafe("GRANT EXECUTE ON FUNCTION "+d+
          ".pa05_object_register_host_command(text,text,text,text,text,text,jsonb) TO "+'\"'+hostRole+'\"');
        const issueBody=[
          "DECLARE v_token text;",
          "BEGIN",
          "IF SESSION_USER!='"+hostRole+"' THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_HOST_LOGIN_REQUIRED'; END IF;",
          "PERFORM "+d+".pa05_object_assert_role_boundary();",
          "IF NOT EXISTS (SELECT 1 FROM "+w+".pa05_xdb_remote_config c",
          " WHERE c.singleton AND c.state='ACTIVE' FOR SHARE) THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_HOST_REMOTE_FROZEN'; END IF;",
          "IF NOT EXISTS (SELECT 1 FROM "+w+".pa02b_writes p",
          " JOIN "+w+".pa05_xdb_remote_tickets t",
          " ON t.scope_key=p.scope_key AND t.effect_id=p.effect_id",
          " AND t.run_id=p.run_id AND t.input_digest=p.input_digest",
          " AND t.fence=p.fence",
          " WHERE p.scope_key=p_scope AND p.effect_id=p_effect",
          " AND p.run_id=p_run AND p.input_digest=p_digest",
          " AND p.state IN ('INVOKING','UNKNOWN')) THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_HOST_ADMISSION_REQUIRED'; END IF;",
          // An actual separate authenticated Host registration must exist.
          "IF NOT EXISTS(SELECT 1 FROM "+d+".pa05_object_host_commands cmd",
          " WHERE cmd.scope_key=p_scope AND cmd.effect_id=p_effect",
          " AND cmd.run_id=p_run AND cmd.input_digest=p_digest",
          " AND cmd.context_id=p_context AND cmd.enterprise_id=p_enterprise",
          " AND cmd.approved_source=jsonb_build_object(",
          " 'runId',p_run,'effectId',p_effect,",
          " 'receiptId',p_evidence->>'receiptId',",
          " 'idempotencyKey',p_evidence->>'idempotencyKey',",
          " 'inputDigest',p_digest,'toolId',p_evidence->>'toolId',",
          " 'contextId',p_context,'enterpriseId',p_enterprise,",
          " 'principalSubjectId',p_evidence->>'principalSubjectId',",
          " 'principalActorType',p_evidence->>'principalActorType',",
          " 'arguments',p_arguments) FOR SHARE) THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_HOST_COMMAND_NOT_APPROVED'; END IF;",
          "IF EXISTS(SELECT 1 FROM "+d+".pa05_object_host_permits",
          " WHERE scope_key=p_scope AND effect_id=p_effect AND consumed",
          " AND run_id=p_run AND input_digest=p_digest",
          " AND context_id=p_context AND enterprise_id=p_enterprise) THEN",
          // No ability to create a second material effect: only a no-op
          // original Owner idempotency read may use this dummy value.
          " RETURN replace(gen_random_uuid()::text,'-',''); END IF;",
          "IF EXISTS(SELECT 1 FROM "+d+".pa05_object_host_permits",
          " WHERE scope_key=p_scope AND effect_id=p_effect) THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_HOST_PERMIT_UNRESOLVED'; END IF;",
          "v_token:=replace(gen_random_uuid()::text,'-','') ||",
          " replace(gen_random_uuid()::text,'-','');",
          "INSERT INTO "+d+".pa05_object_host_permits",
          " (scope_key,effect_id,run_id,input_digest,context_id,enterprise_id,token,"+
          " approved_resource,approved_evidence,approved_evidence_digest,"+
          " approved_idempotency_hash)",
          " VALUES(p_scope,p_effect,p_run,p_digest,p_context,p_enterprise,v_token,"+
          " p_resource,p_evidence,p_evidence_digest,p_idempotency_hash);",
          "RETURN v_token; END;"
        ].join("\n");
        await tx.unsafe("CREATE FUNCTION "+d+
          ".pa05_object_issue_host_permit(p_scope text,p_run text,"+
          "p_effect text,p_digest text,p_context text,p_enterprise text,"+
          "p_resource jsonb,p_evidence jsonb,p_evidence_digest text,"+
          "p_idempotency_hash text,p_arguments jsonb) "+
          "RETURNS text LANGUAGE plpgsql SECURITY DEFINER "+
          "SET search_path=pg_catalog AS $pa05$"+issueBody+"$pa05$");
        await tx.unsafe("REVOKE ALL ON FUNCTION "+d+
          ".pa05_object_issue_host_permit(text,text,text,text,text,text,jsonb,jsonb,text,text,jsonb) FROM PUBLIC");
        await tx.unsafe("GRANT USAGE ON SCHEMA "+d+" TO "+'\"'+hostRole+'\"');
        await tx.unsafe("GRANT EXECUTE ON FUNCTION "+d+
          ".pa05_object_issue_host_permit(text,text,text,text,text,text,jsonb,jsonb,text,text,jsonb) TO "+
          '\"'+hostRole+'\"');
        // D14C10: Host-only, actual SQL-backend/transaction attestation.
        // The original business SQL LOGIN has no EXECUTE rights.
        const bindBody=[
          "DECLARE v_bound integer;v_xid text;",
          "BEGIN",
          "IF SESSION_USER!='"+hostRole+"' THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_HOST_LOGIN_REQUIRED'; END IF;",
          "PERFORM "+d+".pa05_object_assert_role_boundary();",
          "IF p_pid IS NULL OR p_pid<=0 OR p_xid IS NULL OR",
          " p_xid !~ '^[0-9]{1,20}$' THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_TRANSACTION_BIND_SOURCE_INVALID'; END IF;",
          "IF NOT EXISTS(SELECT 1 FROM pg_stat_activity a",
          " WHERE a.pid=p_pid",
          " AND a.datid=(SELECT oid FROM pg_database",
          " WHERE datname=current_database())",
          " AND a.usesysid=(SELECT oid FROM pg_roles",
          " WHERE rolname='"+role+"')",
          " AND a.backend_xid IS NOT NULL",
          " AND a.backend_xid::text=",
          " ((p_xid::numeric % 4294967296)::bigint)::text",
          " AND a.xact_start IS NOT NULL) THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_TRANSACTION_BACKEND_UNVERIFIED';",
          "END IF;",
          "SELECT bound_backend_pid,bound_transaction_id",
          " INTO v_bound,v_xid FROM "+d+".pa05_object_host_permits",
          " WHERE scope_key=p_scope AND effect_id=p_effect",
          " AND token=p_token AND NOT consumed AND NOT revoked",
          " AND issued_at>clock_timestamp()-interval '2 minutes'",
          " FOR UPDATE;",
          "IF NOT FOUND THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_BIND_PERMIT_UNAVAILABLE'; END IF;",
          "IF v_bound IS NOT NULL AND",
          " (v_bound IS DISTINCT FROM p_pid OR v_xid IS DISTINCT FROM p_xid)",
          " THEN RAISE EXCEPTION 'PA05_OBJECT_SQL_TRANSACTION_REBIND_DENIED';",
          "END IF;",
          "UPDATE "+d+".pa05_object_host_permits",
          " SET bound_backend_pid=p_pid,bound_transaction_id=p_xid",
          " WHERE scope_key=p_scope AND effect_id=p_effect",
          " AND token=p_token AND NOT consumed AND NOT revoked;",
          "RETURN 'BOUND'; END;"
        ].join("\n");
        await tx.unsafe("CREATE FUNCTION "+d+
          ".pa05_object_bind_host_permit(p_scope text,p_effect text,"+
          "p_token text,p_pid integer,p_xid text) RETURNS text "+
          "LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog "+
          "AS $pa05$"+bindBody+"$pa05$");
        await tx.unsafe("REVOKE ALL ON FUNCTION "+d+
          ".pa05_object_bind_host_permit(text,text,text,integer,text) FROM PUBLIC");
        await tx.unsafe("GRANT EXECUTE ON FUNCTION "+d+
          ".pa05_object_bind_host_permit(text,text,text,integer,text) TO "+'\"'+hostRole+'\"');
        // D14C7: one-effect revocation is a durable PostgreSQL row transition.
        // Competing Owner trigger FOR UPDATE and Host revoke serialize on the
        // same permit row. A committed effect returns COMMITTED, not REVOKED.
        const revokeBody=[
          "DECLARE v_state text;",
          "BEGIN",
          "IF SESSION_USER!='"+hostRole+"' THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_HOST_LOGIN_REQUIRED'; END IF;",
          "PERFORM "+d+".pa05_object_assert_role_boundary();",
          "SELECT CASE WHEN consumed THEN 'COMMITTED'",
          " WHEN revoked THEN 'REVOKED' ELSE 'ACTIVE' END",
          " INTO v_state FROM "+d+".pa05_object_host_permits",
          " WHERE scope_key=p_scope AND effect_id=p_effect AND token=p_token",
          " FOR UPDATE;",
          "IF NOT FOUND THEN RETURN 'NOT_FOUND'; END IF;",
          "IF v_state='COMMITTED' THEN RETURN 'COMMITTED'; END IF;",
          "IF v_state='REVOKED' THEN RETURN 'REVOKED'; END IF;",
          "UPDATE "+d+".pa05_object_host_permits SET revoked=true",
          " WHERE scope_key=p_scope AND effect_id=p_effect",
          " AND token=p_token AND NOT consumed AND NOT revoked;",
          "IF NOT FOUND THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_REVOKE_RACE'; END IF;",
          "RETURN 'REVOKED'; END;"
        ].join("\n");
        await tx.unsafe("CREATE FUNCTION "+d+
          ".pa05_object_revoke_host_permit(p_scope text,p_effect text,p_token text) "+
          "RETURNS text LANGUAGE plpgsql SECURITY DEFINER "+
          "SET search_path=pg_catalog AS $pa05$"+revokeBody+"$pa05$");
        await tx.unsafe("REVOKE ALL ON FUNCTION "+d+
          ".pa05_object_revoke_host_permit(text,text,text) FROM PUBLIC");
        await tx.unsafe("GRANT EXECUTE ON FUNCTION "+d+
          ".pa05_object_revoke_host_permit(text,text,text) TO "+'\"'+hostRole+'\"');

      }
      const source=(key:string)=>"current_setting('evo.pa05."+key+"',true)";
      const body=[
        "DECLARE v_scope text;v_run text;v_effect text;v_digest text;",
        " v_permit text;v_resource jsonb;v_evidence jsonb;",
        " v_edigest text;v_ihash text;",
        " v_boundpid integer;v_boundxid text;",
        " v_context text;v_enterprise text;",
        "BEGIN",
        "IF TG_OP!='INSERT' THEN",
        " RAISE EXCEPTION 'PA05_OBJECT_SQL_MUTATION_DENIED'; END IF;",
        "IF SESSION_USER!='"+role+"' THEN",
        " RAISE EXCEPTION 'PA05_OBJECT_SQL_WRONG_LOGIN'; END IF;",
        ...(hostRole?["PERFORM "+d+".pa05_object_assert_role_boundary();"]:[]),
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
        "IF TG_TABLE_NAME='pa02_owner_evidence' THEN",
        " IF NEW.run_id IS DISTINCT FROM v_run OR",
        " NEW.effect_id IS DISTINCT FROM v_effect OR",
        " NEW.input_digest IS DISTINCT FROM v_digest THEN",
        "  RAISE EXCEPTION 'PA05_OBJECT_SQL_OWNER_EVIDENCE_SOURCE_MISMATCH'; END IF;",
        "END IF;",
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
        ...(hostRole?[
          // An existing Context already belongs to the same enterprise and
          // ON CONFLICT DO NOTHING does no material mutation. This exemption
          // permits original Owner idempotency replay after consumed evidence.
          "IF TG_TABLE_NAME='pa02_contexts' AND EXISTS(",
          " SELECT 1 FROM "+d+".pa02_contexts c WHERE",
          " c.context_id=NEW.context_id AND c.enterprise_id=NEW.enterprise_id)",
          " THEN RETURN NEW; END IF;",
          "SELECT p.token,p.approved_resource,p.approved_evidence,",
          " p.approved_evidence_digest,p.approved_idempotency_hash,",
          " p.bound_backend_pid,p.bound_transaction_id",
          " INTO v_permit,v_resource,v_evidence,v_edigest,v_ihash,",
          " v_boundpid,v_boundxid",
          " FROM "+d+".pa05_object_host_permits p",
          " WHERE p.scope_key=v_scope AND p.effect_id=v_effect",
          " AND p.run_id=v_run AND p.input_digest=v_digest",
          " AND p.context_id=v_context AND p.enterprise_id=v_enterprise",
          " AND NOT p.consumed AND NOT p.revoked",
          " AND p.issued_at > clock_timestamp()-interval '2 minutes'",
          " FOR UPDATE;",
          "IF v_permit IS NULL OR v_permit IS DISTINCT FROM "+
            source("host_permit")+" THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_HOST_PERMIT_REQUIRED'; END IF;",
          "IF v_boundpid IS DISTINCT FROM pg_backend_pid() OR",
          " v_boundxid IS DISTINCT FROM",
          " pg_current_xact_id_if_assigned()::text THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_TRANSACTION_BIND_REQUIRED';",
          "END IF;",
          "IF TG_TABLE_NAME='pa02_definitions' THEN",
          " IF NEW.extension_id IS DISTINCT FROM v_resource->>'resourceId'",
          " OR NEW.target_object_type IS DISTINCT FROM",
          " (v_resource->'payload'->>'targetObjectType')",
          " OR NEW.target_slot IS DISTINCT FROM",
          " (v_resource->'payload'->>'targetSlot')",
          " OR NEW.field_id IS DISTINCT FROM",
          " (v_resource->'payload'->>'fieldId')",
          " OR NEW.resource IS DISTINCT FROM v_resource",
          " OR NEW.created_at IS DISTINCT FROM",
          " (v_resource->>'createdAt')::timestamptz THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_APPROVED_RESOURCE_MISMATCH';",
          " END IF; END IF;",
          "IF TG_TABLE_NAME='pa02_owner_evidence' THEN",
          " IF NEW.receipt_id IS DISTINCT FROM v_evidence->>'receiptId'",
          " OR NEW.resource_id IS DISTINCT FROM v_resource->>'resourceId'",
          " OR NEW.idempotency_hash IS DISTINCT FROM v_ihash",
          " OR NEW.evidence_digest IS DISTINCT FROM v_edigest",
          " OR NEW.evidence IS DISTINCT FROM v_evidence",
          " OR NEW.recorded_at IS DISTINCT FROM",
          " (v_evidence->>'recordedAt')::timestamptz THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_APPROVED_EVIDENCE_MISMATCH';",
          " END IF; END IF;",
          "IF TG_TABLE_NAME='pa02_owner_evidence' THEN",
          " UPDATE "+d+".pa05_object_host_permits SET consumed=true",
          " WHERE scope_key=v_scope AND effect_id=v_effect",
          " AND NOT consumed AND NOT revoked;",
          " IF NOT FOUND THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_HOST_PERMIT_CONSUMED'; END IF;",
          "END IF;"
        ]:[]),
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
      if(hostRole){
        // A valid but partially used Host permit MUST NOT let raw SQL persist
        // orphan business rows without an actual immutable Owner receipt.
        // Deferred validation is evaluated at the real transaction COMMIT.
        const receiptBody=[
          "DECLARE v_token text;",
          "BEGIN",
          "IF SESSION_USER!='"+role+"' THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_RECEIPT_LOGIN_DENIED'; END IF;",
          "v_token:=current_setting('evo.pa05.host_permit',true);",
          "IF v_token IS NULL OR v_token='' THEN",
          " RAISE EXCEPTION 'PA05_OBJECT_SQL_RECEIPT_PERMIT_REQUIRED'; END IF;",
          "IF TG_TABLE_NAME='pa02_contexts' THEN",
          " IF NOT EXISTS(SELECT 1 FROM "+d+".pa05_object_host_permits p",
          " JOIN "+d+".pa02_owner_evidence e",
          " ON e.run_id=p.run_id AND e.effect_id=p.effect_id",
          " AND e.input_digest=p.input_digest AND e.context_id=p.context_id",
          " AND e.enterprise_id=p.enterprise_id",
          " WHERE p.token=v_token AND p.consumed",
          " AND p.context_id=NEW.context_id AND p.enterprise_id=NEW.enterprise_id)",
          " THEN RAISE EXCEPTION 'PA05_OBJECT_SQL_RECEIPT_REQUIRED'; END IF;",
          "ELSE",
          " IF NOT EXISTS(SELECT 1 FROM "+d+".pa05_object_host_permits p",
          " JOIN "+d+".pa02_owner_evidence e",
          " ON e.run_id=p.run_id AND e.effect_id=p.effect_id",
          " AND e.input_digest=p.input_digest AND e.context_id=p.context_id",
          " AND e.enterprise_id=p.enterprise_id",
          " WHERE p.token=v_token AND p.consumed",
          " AND e.resource_id=NEW.extension_id",
          " AND e.context_id=NEW.context_id AND e.enterprise_id=NEW.enterprise_id)",
          " THEN RAISE EXCEPTION 'PA05_OBJECT_SQL_RECEIPT_REQUIRED'; END IF;",
          "END IF;",
          "RETURN NULL; END;"
        ].join("\n");
        await tx.unsafe("CREATE FUNCTION "+d+
          ".pa05_object_receipt_commit_guard() RETURNS trigger LANGUAGE plpgsql "+
          "SECURITY DEFINER SET search_path=pg_catalog AS $pa05$"+
          receiptBody+"$pa05$");
        for(const table of ["pa02_contexts","pa02_definitions"]){
          await tx.unsafe("CREATE CONSTRAINT TRIGGER "+
            "pa05_object_commit_receipt_guard AFTER INSERT ON "+
            d+'."'+table+'"'+
            " DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "+
            d+".pa05_object_receipt_commit_guard()");
        }
      }
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
