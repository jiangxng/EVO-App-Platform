import postgres from "postgres";

/**
 * CV04 isolated PHYSICAL SQL identity proof.
 * The trusted Host SQL LOGIN issues a short one-shot permit after checking
 * current Host authorization. The separate Worker SQL LOGIN can claim only a
 * matching permit and can neither mint permits nor read/write raw resources.
 *
 * This stages only a metadata lease, NOT a signed business resource write,
 * not PA05 source-generation authority, and NOT a production Host route.
 * Job content still belongs to the original Dictionary Owner/CAS.
 */
const schemaName=(x:string)=>{
  if(typeof x!=="string"||!/^cv03_[a-z0-9_]{1,58}$/u.test(x))
    throw Error("CV04_EXPORT_LEASE_ISOLATED_SCHEMA_REQUIRED");
  return '"'+x+'"';
};
const roleName=(x:string)=>{
  if(typeof x!=="string"||!/^cv04_[a-z0-9_]{1,55}$/u.test(x))
    throw Error("CV04_EXPORT_LEASE_SQL_LOGIN_INVALID");
  return '"'+x+'"';
};
const JOB=/^exj-[a-f0-9]{48}$/u;
const authInput=(a:{contextId:string;jobId:string})=>{
  if(typeof a?.contextId!=="string"||!a.contextId||!JOB.test(a.jobId))
    throw Error("CV04_EXPORT_LEASE_ADDRESS_INVALID");
};

export async function prepareIsolatedDictionaryExportSqlLeaseV010(input:{
  connectionString:string;
  schema:string;
  hostLoginRole:string;
  workerLoginRole:string;
  isolatedTestOnly:true;
}):Promise<void>{
  const q=schemaName(input.schema),host=roleName(input.hostLoginRole),
    worker=roleName(input.workerLoginRole);
  if(input.hostLoginRole===input.workerLoginRole)
    throw Error("CV04_EXPORT_LEASE_DISTINCT_SQL_IDENTITIES_REQUIRED");
  if(process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true)
    throw Error("CV04_EXPORT_LEASE_PRODUCTION_INSTALL_DENIED");
  if(!input.connectionString)
    throw Error("CV04_EXPORT_LEASE_CONNECTION_REQUIRED");
  const sql=postgres(input.connectionString,{max:2,connect_timeout:10,prepare:false});
  const permits=q+".cv04_export_work_permits",leases=q+".cv04_export_work_leases";
  try{
    const roles=await sql.unsafe(
      "SELECT r.rolname,r.rolcanlogin,r.rolsuper,r.rolbypassrls,"+
      "r.rolcreaterole,r.rolcreatedb,r.rolreplication,"+
      "pg_has_role(r.oid,n.nspowner,'MEMBER') AS owns_schema,"+
      "has_schema_privilege(r.oid,n.oid,'CREATE') AS can_create,"+
      "has_table_privilege(r.oid,cls.oid,'SELECT') AS can_read_resources,"+
      "has_table_privilege(r.oid,cls.oid,'INSERT') AS can_insert_resources,"+
      "has_table_privilege(r.oid,cls.oid,'UPDATE') AS can_update_resources "+
      "FROM pg_roles r JOIN pg_namespace n ON n.nspname=$1 "+
      "JOIN pg_class cls ON cls.relnamespace=n.oid AND cls.relname='resources' "+
      "WHERE r.rolname=ANY($2::text[])",[
        input.schema,[input.hostLoginRole,input.workerLoginRole]
      ]);
    if(roles.length!==2||roles.some(r=>!r.rolcanlogin||r.rolsuper||
      r.rolbypassrls||r.rolcreaterole||r.rolcreatedb||r.rolreplication||
      r.owns_schema||r.can_create||r.can_read_resources||
      r.can_insert_resources||r.can_update_resources))
      throw Error("CV04_EXPORT_LEASE_SQL_ROLE_UNSAFE");
    const cross=await sql.unsafe(
      "SELECT pg_has_role($1,$2,'MEMBER') AS h_to_w,"+
      "pg_has_role($2,$1,'MEMBER') AS w_to_h",[
        input.hostLoginRole,input.workerLoginRole
      ]);
    if(cross[0].h_to_w||cross[0].w_to_h)
      throw Error("CV04_EXPORT_LEASE_SQL_ROLE_MEMBERSHIP_UNSAFE");
    await sql.begin(async tx=>{
      await tx.unsafe("CREATE TABLE "+permits+" ("+
        "token_hash text PRIMARY KEY,context_id text NOT NULL,job_id text NOT NULL,"+
        "enterprise_id text NOT NULL,subject_id text NOT NULL,actor_type text NOT NULL,"+
        "job_revision bigint NOT NULL CHECK(job_revision >= 0),"+
        "approval_id text NOT NULL,"+
        "authority_epoch bigint NOT NULL DEFAULT 0 CHECK(authority_epoch>=0),"+
        "issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),"+
        "expires_at timestamptz NOT NULL,"+
        "state text NOT NULL CHECK(state IN ('ISSUED','CLAIMED','REVOKED')))");
      await tx.unsafe("CREATE TABLE "+leases+" ("+
        "context_id text NOT NULL,job_id text NOT NULL,epoch bigint NOT NULL CHECK(epoch BETWEEN 1 AND 2),"+
        "claimed_until timestamptz NOT NULL,claimed_token_hash text NOT NULL,"+
        "state text NOT NULL CHECK(state IN ('RUNNING','DONE','REVOKED')),"+
        "PRIMARY KEY(context_id,job_id))");
      for(const table of [permits,leases]){
        await tx.unsafe("REVOKE ALL ON "+table+" FROM PUBLIC");
        await tx.unsafe("REVOKE ALL ON "+table+" FROM "+host+","+worker);
      }
      // SQL body has fixed, server-side LOGIN checks, not a caller-supplied
      // current_setting() flag or an Agent-controlled SQL GUC.
      await tx.unsafe("CREATE FUNCTION "+q+".cv04_export_issue_lease("+
        "p_context text,p_job text,p_revision bigint,p_enterprise text,"+
        "p_subject text,p_actor text,p_approval text,p_epoch bigint DEFAULT NULL) RETURNS text "+
        "LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ "+
        "DECLARE record_revision bigint; m jsonb; token text; "+
        "BEGIN "+
        "IF session_user <> '"+input.hostLoginRole+"' "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_HOST_LOGIN_REQUIRED'; END IF; "+
        "IF p_context IS NULL OR p_context='' OR "+
        "p_job !~ '^exj-[a-f0-9]{48}$' OR p_revision < 0 OR "+
        "p_enterprise IS NULL OR p_enterprise='' OR "+
        "p_subject IS NULL OR p_subject='' OR "+
        "p_actor NOT IN ('HUMAN','AI') OR "+
        "p_approval IS NULL OR length(p_approval)<8 OR length(p_approval)>128 "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_HOST_APPROVAL_INVALID'; END IF; "+
        "IF p_epoch IS NOT NULL AND (p_epoch<=0 OR p_epoch>9007199254740991) "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_AUTHORITY_EPOCH_INVALID'; END IF; "+
        "PERFORM pg_advisory_xact_lock(hashtextextended(p_context||':'||p_job,42)); "+
        "SELECT revision,resource->'payload'->'meta' INTO record_revision,m FROM "+
          q+".resources WHERE context_id=p_context AND "+
        "namespace='evo.dictionary.export-jobs' AND "+
        "collection_id='bounded-csv-jobs' AND "+
        "resource_type='evo.dictionary.export.job' AND resource_id=p_job; "+
        "IF NOT FOUND OR m IS NULL OR record_revision<>p_revision OR "+
        "m->>'contextId'<>p_context OR m->>'jobId'<>p_job OR "+
        "m->>'enterpriseId'<>p_enterprise OR "+
        "m->>'subjectId'<>p_subject OR m->>'actorType'<>p_actor OR "+
        "m->>'state' IS NULL OR m->>'state' NOT IN ('QUEUED','RUNNING') OR "+
        "(m->>'expiresAt')::timestamptz<=clock_timestamp() "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_JOB_NOT_ADMISSIBLE'; END IF; "+
        "token:=replace(gen_random_uuid()::text,'-',''); "+
        "INSERT INTO "+permits+"(token_hash,context_id,job_id,enterprise_id,"+
        "subject_id,actor_type,job_revision,approval_id,authority_epoch,expires_at,state) "+
        "VALUES (md5(token),p_context,p_job,p_enterprise,p_subject,p_actor,"+
        "p_revision,p_approval,COALESCE(p_epoch,0),"+
        "clock_timestamp()+interval '30 seconds','ISSUED'); "+
        "RETURN token; END; $$");
      await tx.unsafe("CREATE FUNCTION "+q+".cv04_export_claim_lease("+
        "p_token text) RETURNS jsonb "+
        "LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ "+
        "DECLARE permit record; m jsonb; current_revision bigint; lease_epoch bigint;"+
        " lease_until timestamptz; lock_context text; lock_job text; "+
        "BEGIN "+
        "IF session_user <> '"+input.workerLoginRole+"' "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_WORKER_LOGIN_REQUIRED'; END IF; "+
        "IF p_token IS NULL OR p_token !~ '^[0-9a-f]{32}$' "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_TOKEN_INVALID'; END IF; "+
        "SELECT context_id,job_id INTO lock_context,lock_job FROM "+permits+
        " WHERE token_hash=md5(p_token); "+
        "IF NOT FOUND THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_PERMIT_NOT_ACTIVE'; END IF; "+
        "PERFORM pg_advisory_xact_lock(hashtextextended(lock_context||':'||lock_job,42)); "+
        "SELECT * INTO permit FROM "+permits+" WHERE token_hash=md5(p_token) FOR UPDATE; "+
        "IF NOT FOUND OR permit.state<>'ISSUED' OR "+
        "permit.expires_at<=clock_timestamp() "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_PERMIT_NOT_ACTIVE'; END IF; "+
        "SELECT revision,resource->'payload'->'meta' INTO current_revision,m "+
        "FROM "+q+".resources WHERE context_id=permit.context_id "+
        "AND namespace='evo.dictionary.export-jobs' "+
        "AND collection_id='bounded-csv-jobs' AND "+
        "resource_type='evo.dictionary.export.job' AND "+
        "resource_id=permit.job_id FOR SHARE; "+
        "IF NOT FOUND OR m IS NULL OR current_revision<>permit.job_revision OR "+
        "m->>'contextId'<>permit.context_id OR "+
        "m->>'enterpriseId'<>permit.enterprise_id OR "+
        "m->>'subjectId'<>permit.subject_id OR "+
        "m->>'actorType'<>permit.actor_type OR "+
        "m->>'state' NOT IN ('QUEUED','RUNNING') OR "+
        "(m->>'expiresAt')::timestamptz<=clock_timestamp() "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_STALE_JOB'; END IF; "+
        "INSERT INTO "+leases+" AS l "+
        "(context_id,job_id,epoch,claimed_until,claimed_token_hash,state) "+
        "VALUES (permit.context_id,permit.job_id,1,"+
        "clock_timestamp()+interval '15 seconds',permit.token_hash,'RUNNING') "+
        "ON CONFLICT(context_id,job_id) DO UPDATE SET "+
        "epoch=l.epoch+1,claimed_until=clock_timestamp()+interval '15 seconds',"+
        "claimed_token_hash=EXCLUDED.claimed_token_hash,state='RUNNING' "+
        "WHERE l.state='RUNNING' AND l.claimed_until<=clock_timestamp() "+
        "AND l.epoch<2 RETURNING epoch,claimed_until INTO lease_epoch,lease_until; "+
        "IF NOT FOUND THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_LEASE_ACTIVE_OR_EXHAUSTED'; END IF; "+
        "UPDATE "+permits+" SET state='CLAIMED' WHERE token_hash=permit.token_hash; "+
        "RETURN jsonb_build_object('contextId',permit.context_id,'jobId',permit.job_id,"+
        "'epoch',lease_epoch,'leaseUntil',lease_until,'expectedRevision',current_revision); "+
        "END; $$");
      await tx.unsafe("CREATE FUNCTION "+q+".cv04_export_complete_lease("+
        "p_token text,p_epoch bigint) RETURNS text "+
        "LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ "+
        "DECLARE permit record; lease record; m jsonb; lock_context text; lock_job text; BEGIN "+
        "IF session_user <> '"+input.workerLoginRole+"' "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_WORKER_LOGIN_REQUIRED'; END IF; "+
        "SELECT context_id,job_id INTO lock_context,lock_job FROM "+permits+
        " WHERE token_hash=md5(p_token); "+
        "IF NOT FOUND THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_PERMIT_NOT_CLAIMED'; END IF; "+
        "PERFORM pg_advisory_xact_lock(hashtextextended(lock_context||':'||lock_job,42)); "+
        "SELECT * INTO permit FROM "+permits+" WHERE token_hash=md5(p_token); "+
        "IF NOT FOUND OR permit.state<>'CLAIMED' "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_PERMIT_NOT_CLAIMED'; END IF; "+
        "SELECT * INTO lease FROM "+leases+" WHERE context_id=permit.context_id "+
        "AND job_id=permit.job_id FOR UPDATE; "+
        "IF NOT FOUND OR lease.epoch<>p_epoch OR lease.state<>'RUNNING' OR "+
        "lease.claimed_token_hash<>permit.token_hash OR "+
        "lease.claimed_until<=clock_timestamp() "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_STALE_LEASE_FENCE'; END IF; "+
        "SELECT resource->'payload'->'meta' INTO m FROM "+q+".resources "+
        "WHERE context_id=permit.context_id AND "+
        "namespace='evo.dictionary.export-jobs' AND "+
        "collection_id='bounded-csv-jobs' AND "+
        "resource_type='evo.dictionary.export.job' AND resource_id=permit.job_id; "+
        "IF NOT FOUND OR m IS NULL OR m->>'state' IS DISTINCT FROM 'READY' OR "+
        "(m->>'expiresAt')::timestamptz<=clock_timestamp() "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_OWNER_NOT_READY'; END IF; "+
        "UPDATE "+leases+" SET state='DONE' WHERE "+
        "context_id=permit.context_id AND job_id=permit.job_id; "+
        "RETURN 'DONE'; END; $$");
      await tx.unsafe("CREATE FUNCTION "+q+".cv04_export_revoke_lease("+
        "p_context text,p_job text) RETURNS text "+
        "LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ "+
        "BEGIN IF session_user<>'"+input.hostLoginRole+"' "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_HOST_LOGIN_REQUIRED'; END IF; "+
        "IF p_context IS NULL OR p_context='' OR "+
        "p_job !~ '^exj-[a-f0-9]{48}$' "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_REVOKE_SCOPE_INVALID'; END IF; "+
        "PERFORM pg_advisory_xact_lock(hashtextextended(p_context||':'||p_job,42)); "+
        "UPDATE "+permits+" SET state='REVOKED' WHERE "+
        "context_id=p_context AND job_id=p_job AND state<>'REVOKED'; "+
        "UPDATE "+leases+" SET state='REVOKED' WHERE "+
        "context_id=p_context AND job_id=p_job AND state='RUNNING'; "+
        "RETURN 'REVOKED'; END; $$");
      await tx.unsafe("CREATE FUNCTION "+q+".cv04_export_lease_status("+
        "p_context text,p_job text) RETURNS jsonb "+
        "LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ "+
        "DECLARE lease record; BEGIN "+
        "IF session_user<>'"+input.hostLoginRole+"' "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_HOST_LOGIN_REQUIRED'; END IF; "+
        "SELECT * INTO lease FROM "+leases+" WHERE "+
        "context_id=p_context AND job_id=p_job; "+
        "IF NOT FOUND THEN RETURN NULL; END IF; "+
        "RETURN jsonb_build_object('state',lease.state,'epoch',lease.epoch,"+
        "'leaseUntil',lease.claimed_until); END; $$");
      // Metadata-only due-job discovery is exclusive to the physical Host
      // SQL login. Worker SQL cannot enumerate enterprise resources or jobs.
      await tx.unsafe("CREATE FUNCTION "+q+".cv04_export_due_jobs("+
        "p_context text,p_limit integer) RETURNS TABLE(job_id text,expired_at timestamptz) "+
        "LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ "+
        "BEGIN "+
        "IF session_user <> '"+input.hostLoginRole+"' "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_HOST_LOGIN_REQUIRED'; END IF; "+
        "IF p_context IS NULL OR p_context='' OR p_limit<1 OR p_limit>25 "+
        "THEN RAISE EXCEPTION 'CV04_EXPORT_SQL_DUE_SCOPE_INVALID'; END IF; "+
        "RETURN QUERY "+
        "SELECT r.resource_id,(r.resource->'payload'->'meta'->>'expiresAt')::timestamptz "+
        "FROM "+q+".resources AS r "+
        "WHERE r.context_id=p_context AND r.namespace='evo.dictionary.export-jobs' "+
        "AND r.collection_id='bounded-csv-jobs' AND "+
        "r.resource_type='evo.dictionary.export.job' AND "+
        "r.resource->'payload'->>'kind'='dictionary.export-job.encrypted' "+
        "AND r.resource->'payload'->'meta'->>'state'<>'EXPIRED' "+
        "AND (r.resource->'payload'->'meta'->>'expiresAt')::timestamptz<=clock_timestamp() "+
        "ORDER BY (r.resource->'payload'->'meta'->>'expiresAt')::timestamptz,r.resource_id "+
        "LIMIT p_limit; "+
        "END; $$");
      const defs=[
        ["cv04_export_due_jobs","text,integer",host],
        ["cv04_export_issue_lease","text,text,bigint,text,text,text,text,bigint",host],
        ["cv04_export_claim_lease","text",worker],
        ["cv04_export_complete_lease","text,bigint",worker],
        ["cv04_export_revoke_lease","text,text",host],
        ["cv04_export_lease_status","text,text",host]
      ] as const;
      await tx.unsafe("GRANT USAGE ON SCHEMA "+q+" TO "+host+","+worker);
      for(const [name,signature,grantee] of defs){
        const fn=q+"."+name+"("+signature+")";
        await tx.unsafe("REVOKE ALL ON FUNCTION "+fn+" FROM PUBLIC");
        await tx.unsafe("REVOKE ALL ON FUNCTION "+fn+" FROM "+host+","+worker);
        await tx.unsafe("GRANT EXECUTE ON FUNCTION "+fn+" TO "+grantee);
      }
    });
  }finally{await sql.end();}
}

function api(input:{connectionString:string;schema:string;isolatedTestOnly:true}) {
  const schema=schemaName(input.schema);
  if(process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true)
    throw Error("CV04_EXPORT_LEASE_PRODUCTION_USE_DENIED");
  if(!input.connectionString)throw Error("CV04_EXPORT_LEASE_CONNECTION_REQUIRED");
  const sql=postgres(input.connectionString,{max:2,connect_timeout:10,prepare:false});
  return {schema,sql};
}

/** Independent, physically authenticated Host SQL principal; never Agent-exposed. */
export function createIsolatedDictionaryExportSqlHostLeaseIssuerV010(input:{
  connectionString:string;schema:string;isolatedTestOnly:true;
}){
  const {schema,sql}=api(input);
  return {
    async issue(request:{
      contextId:string;jobId:string;expectedRevision:number;
      enterpriseId:string;subjectId:string;actorType:"HUMAN"|"AI";approvalId:string;
      /** Required by joint SQL CAS, defaults to legacy unstamped lease (0). */
      authorityEpoch?:number;
    }):Promise<string>{
      authInput(request);
      if(request.authorityEpoch!==undefined &&
        (!Number.isSafeInteger(request.authorityEpoch)||request.authorityEpoch<1))
        throw Error("CV04_EXPORT_SQL_AUTHORITY_EPOCH_INVALID");
      const args=[request.contextId,request.jobId,request.expectedRevision,
        request.enterpriseId,request.subjectId,request.actorType,request.approvalId];
      if(request.authorityEpoch!==undefined)args.push(request.authorityEpoch);
      const query=".cv04_export_issue_lease("+
        (request.authorityEpoch===undefined?
          "$1,$2,$3,$4,$5,$6,$7":"$1,$2,$3,$4,$5,$6,$7,$8")+
        ") AS token";
      const rows=await sql.unsafe("SELECT "+schema+query,args);
      const token=rows[0]?.token;
      if(typeof token!=="string"||!/^[a-f0-9]{32}$/u.test(token))
        throw Error("CV04_EXPORT_SQL_PERMIT_ISSUE_INVALID");
      return token;
    },
    async revoke(contextId:string,jobId:string):Promise<"REVOKED">{
      authInput({contextId,jobId});
      const rows=await sql.unsafe("SELECT "+schema+
        ".cv04_export_revoke_lease($1,$2) AS result",[contextId,jobId]);
      if(rows[0]?.result!=="REVOKED")throw Error("CV04_EXPORT_SQL_REVOKE_UNVERIFIED");
      return "REVOKED";
    },
    async status(contextId:string,jobId:string){
      authInput({contextId,jobId});
      const rows=await sql.unsafe("SELECT "+schema+
        ".cv04_export_lease_status($1,$2) AS result",[contextId,jobId]);
      return rows[0]?.result??null;
    },
    async due(contextId:string,limit:number=25):Promise<{jobId:string;expiresAt:string}[]>{
      if(typeof contextId!=="string"||!contextId||
        !Number.isSafeInteger(limit)||limit<1||limit>25)
        throw Error("CV04_EXPORT_SQL_DUE_SCOPE_INVALID");
      const rows=await sql.unsafe("SELECT job_id,expired_at FROM "+schema+
        ".cv04_export_due_jobs($1,$2)",[contextId,limit]);
      return rows.map(x=>({jobId:String(x.job_id),
        expiresAt:new Date(x.expired_at).toISOString()}));
    },
    close:()=>sql.end()
  };
}
/** Distinct restricted SQL Worker LOGIN: cannot read resource or approval tables. */
export function createIsolatedDictionaryExportSqlWorkerLeaseV010(input:{
  connectionString:string;schema:string;isolatedTestOnly:true;
}){
  const {schema,sql}=api(input);
  return {
    async claim(token:string):Promise<{
      contextId:string;jobId:string;epoch:number;leaseUntil:string;
      expectedRevision:number;
    }>{
      if(!/^[a-f0-9]{32}$/u.test(token))
        throw Error("CV04_EXPORT_SQL_TOKEN_INVALID");
      const rows=await sql.unsafe("SELECT "+schema+
        ".cv04_export_claim_lease($1) AS lease",[token]);
      const lease=rows[0]?.lease;
      if(!lease||!Number.isInteger(lease.epoch)||lease.epoch<1||lease.epoch>2)
        throw Error("CV04_EXPORT_SQL_CLAIM_INVALID");
      return lease;
    },
    /**
     * Opt-in signed Gateway composition only. The database function does not
     * exist in the standalone lease fixture; it never grants raw resource
     * SELECT, and returns only the currently claimed encrypted Job envelope.
     * No production Host registers this capability.
     */
    async readCiphertext(token:string,epoch:number):Promise<{
      revision:number;resource:Record<string,unknown>;
    }>{
      if(!/^[a-f0-9]{32}$/u.test(token)||!Number.isSafeInteger(epoch)||
         epoch<1||epoch>2)
        throw Error("CV04_EXPORT_WORKER_READ_PROOF_INVALID");
      const rows=await sql.unsafe("SELECT "+schema+
        ".cv04_export_worker_read($1,$2) AS result",[token,epoch]);
      const data=rows[0]?.result;
      if(!data||!Number.isSafeInteger(data.revision)||
         data.revision<0||!data.resource||
         typeof data.resource!=="object"||Array.isArray(data.resource)||
         data.resource.payload?.kind!=="dictionary.export-job.encrypted"||
         data.resource.payload?.secret?.algorithm!=="AES-256-GCM")
        throw Error("CV04_EXPORT_WORKER_READ_ENCRYPTED_ENVELOPE_INVALID");
      return data;
    },
    async complete(token:string,epoch:number):Promise<"DONE">{
      if(!/^[a-f0-9]{32}$/u.test(token)||!Number.isSafeInteger(epoch))
        throw Error("CV04_EXPORT_SQL_COMPLETE_ARGUMENT_INVALID");
      const rows=await sql.unsafe("SELECT "+schema+
        ".cv04_export_complete_lease($1,$2) AS result",[token,epoch]);
      if(rows[0]?.result!=="DONE")throw Error("CV04_EXPORT_SQL_COMPLETE_UNVERIFIED");
      return "DONE";
    },
    close:()=>sql.end()
  };
}
