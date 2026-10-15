import {createHash} from "node:crypto";
import postgres from "postgres";
import type {Pa05CrossDatabaseReservationAuthorityV010} from "./pa05-cross-database-admission.js";

/**
 * PA05-04D10 opt-in remote SQL guard; not a production WRITE route.
 * A Host obtains a durable central reservation before staging a bound ticket
 * on the independent Worker database. The Worker cannot mint that ticket.
 * A privileged DB owner, direct domain-Owner calls and network partitions
 * remain OUTSIDE this component's guarantee.
 */
export interface Pa05RemoteSqlAdmissionV010 {
  stagePreparedEffect(input: {scopeKey: string; effectId: string}):
    Promise<{reservationId: string; effectDigest: string}>;
  close(): Promise<void>;
}
const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const eq = (a: unknown,b: unknown) => JSON.stringify(a)===JSON.stringify(b);
const id = (v:string) => {
  if(typeof v!=="string" || !/^[a-zA-Z][a-zA-Z0-9_.-]{0,127}$/.test(v))
    throw Error("PA05_XDB_REMOTE_TRUSTED_ID_INVALID");
  return v;
};
const versionName = (v:string) => {
  if(typeof v!=="string" || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(v))
    throw Error("PA05_XDB_REMOTE_VERSION_INVALID");
  return v;
};
const scope = (v:string) => {
  if(typeof v!=="string" || !v || v.length>1024 || /[\u0000-\u001f]/.test(v))
    throw Error("PA05_XDB_REMOTE_EFFECT_ID_INVALID");
  return v;
};
const schemaName = (v:string) => {
  if(typeof v!=="string" || !/^[a-z][a-z0-9_]{0,62}$/.test(v))
    throw Error("PA05_XDB_REMOTE_SCHEMA_INVALID");
  return v;
};
const roleName = (v:string) => {
  if(typeof v!=="string" || !/^[a-z_][a-z0-9_]{0,62}$/.test(v))
    throw Error("PA05_XDB_REMOTE_ROLE_INVALID");
  return v;
};
type Effect = {scope_key:string;effect_id:string;run_id:string;input_digest:string;fence:string|number;state:string};
const fact = (r:Effect) => ({
  scopeKey:String(r.scope_key),effectId:String(r.effect_id),runId:String(r.run_id),
  inputDigest:String(r.input_digest),fence:String(r.fence)
});

export async function createPa05CrossDatabaseRemoteSqlAdmissionV010(input:{
  connectionString:string;
  workerSchema:string;
  workerId:string;
  ownerPackageId:string;
  ownerVersion:string;
  workerLoginRole:string;
  /** Host-owned central D9 authority, not supplied by a remote Worker. */
  authority:Pa05CrossDatabaseReservationAuthorityV010;
}):Promise<Pa05RemoteSqlAdmissionV010> {
  const workerId=id(input.workerId),owner=id(input.ownerPackageId),
    version=versionName(input.ownerVersion),role=roleName(input.workerLoginRole);
  const s=schemaName(input.workerSchema),q='"'+s+'"';
  const table=q+".pa02b_writes",tickets=q+".pa05_xdb_remote_tickets",
    config=q+".pa05_xdb_remote_config";
  if(!input.connectionString || !input.authority ||
    typeof input.authority.reserve!=="function")
    throw Error("PA05_XDB_REMOTE_AUTHORITY_REQUIRED");
  const db=postgres(input.connectionString,{max:4,connect_timeout:10,idle_timeout:15});
  try {
    const hostLogin=roleName(String((await db.unsafe("SELECT SESSION_USER AS name"))[0].name));
    if(hostLogin===role)throw Error("PA05_XDB_REMOTE_DISTINCT_LOGIN_REQUIRED");
    const cols=await db.unsafe("SELECT column_name FROM information_schema.columns "+
      "WHERE table_schema=$1 AND table_name='pa02b_writes'",[s]);
    const columns=new Set(cols.map(x=>String(x.column_name)));
    if(["scope_key","effect_id","run_id","input_digest","fence","state"].some(x=>!columns.has(x)))
      throw Error("PA05_XDB_REMOTE_PA02_WRITE_TABLE_REQUIRED");
    const check=await db.unsafe(
      "SELECT r.rolsuper,r.rolbypassrls,r.rolcreatedb,r.rolcreaterole,"+
      "r.rolreplication,r.rolcanlogin,"+
      "pg_has_role(r.oid,c.relowner,'MEMBER') AS owns_table,"+
      "pg_has_role(r.oid,d.datdba,'MEMBER') AS owns_database,"+
      "pg_has_role(r.oid,$3::regrole,'MEMBER') AS host_member,"+
      "has_schema_privilege(r.oid,n.oid,'CREATE') AS create_schema,"+
      "has_table_privilege(r.oid,c.oid,'UPDATE') AS can_update,"+
      "has_table_privilege(r.oid,c.oid,'INSERT') AS can_insert,"+
      "has_table_privilege(r.oid,c.oid,'DELETE') AS can_delete,"+
      "has_table_privilege(r.oid,c.oid,'TRUNCATE') AS can_truncate,"+
      "has_table_privilege(r.oid,c.oid,'TRIGGER') AS can_trigger "+
      "FROM pg_roles r JOIN pg_class c ON c.oid=$2::regclass "+
      "JOIN pg_namespace n ON n.oid=c.relnamespace "+
      "JOIN pg_database d ON d.datname=current_database() WHERE r.rolname=$1",
      [role,table,hostLogin]);
    if(check.length!==1)throw Error("PA05_XDB_REMOTE_LOGIN_NOT_FOUND");
    const acl=check[0];
    if(!acl.rolcanlogin||acl.rolsuper||acl.rolbypassrls||acl.rolcreatedb||
      acl.rolcreaterole||acl.rolreplication||acl.owns_table||acl.owns_database||
      acl.host_member||acl.create_schema||!acl.can_update||acl.can_insert||
      acl.can_delete||acl.can_truncate||acl.can_trigger)
      throw Error("PA05_XDB_REMOTE_UNSAFE_WORKER_SQL_ROLE");
    await db.begin(async tx=>{
      await tx.unsafe("CREATE TABLE IF NOT EXISTS "+config+"("+
        "singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),"+
        "worker_id text NOT NULL,owner_id text NOT NULL,owner_version text NOT NULL,"+
        "worker_login text NOT NULL,host_login text NOT NULL)");
      await tx.unsafe("CREATE TABLE IF NOT EXISTS "+tickets+"("+
        "scope_key text NOT NULL,effect_id text NOT NULL,run_id text NOT NULL,"+
        "input_digest text NOT NULL,fence bigint NOT NULL,"+
        "reservation_id text NOT NULL UNIQUE,effect_digest text NOT NULL,"+
        "created_at timestamptz NOT NULL DEFAULT clock_timestamp(),"+
        "PRIMARY KEY(scope_key,effect_id))");
      const desired={worker_id:workerId,owner_id:owner,owner_version:version,
        worker_login:role,host_login:hostLogin};
      await tx.unsafe("INSERT INTO "+config+
        "(singleton,worker_id,owner_id,owner_version,worker_login,host_login) "+
        "VALUES(true,$1,$2,$3,$4,$5) ON CONFLICT(singleton) DO NOTHING",
        [workerId,owner,version,role,hostLogin]);
      const existing=await tx.unsafe("SELECT worker_id,owner_id,owner_version,"+
        "worker_login,host_login FROM "+config+" WHERE singleton FOR UPDATE");
      if(existing.length!==1||!eq(existing[0],desired))
        throw Error("PA05_XDB_REMOTE_CONFIG_RECERTIFICATION_REQUIRED");
      const tacl=await tx.unsafe(
        "SELECT has_table_privilege($1::regrole,$2::regclass,'INSERT') AS i,"+
        "has_table_privilege($1::regrole,$2::regclass,'UPDATE') AS u,"+
        "has_table_privilege($1::regrole,$2::regclass,'DELETE') AS d,"+
        "has_table_privilege($1::regrole,$2::regclass,'TRUNCATE') AS t,"+
        "pg_has_role($1::regrole,c.relowner,'MEMBER') AS own "+
        "FROM pg_class c WHERE c.oid=$2::regclass",[role,tickets]);
      if(tacl.length!==1||tacl[0].i||tacl[0].u||tacl[0].d||tacl[0].t||tacl[0].own)
        throw Error("PA05_XDB_REMOTE_TICKET_PRIVILEGE_DENIED");
      const body=[
        "BEGIN",
        "IF NEW.scope_key IS DISTINCT FROM OLD.scope_key OR",
        " NEW.effect_id IS DISTINCT FROM OLD.effect_id OR",
        " NEW.run_id IS DISTINCT FROM OLD.run_id OR",
        " NEW.input_digest IS DISTINCT FROM OLD.input_digest OR",
        " NEW.fence IS DISTINCT FROM OLD.fence THEN",
        " RAISE EXCEPTION 'PA05_XDB_REMOTE_IMMUTABLE_EFFECT'; END IF;",
        "IF SESSION_USER = '"+role+"' THEN",
        " IF NOT (OLD.state='PREPARED' AND NEW.state='INVOKING') THEN",
        "  RAISE EXCEPTION 'PA05_XDB_REMOTE_WORKER_STATE_DENIED'; END IF;",
        " IF NOT EXISTS(SELECT 1 FROM "+tickets+" t",
        " WHERE t.scope_key=OLD.scope_key AND t.effect_id=OLD.effect_id",
        " AND t.run_id=OLD.run_id AND t.input_digest=OLD.input_digest",
        " AND t.fence=OLD.fence) THEN",
        "  RAISE EXCEPTION 'PA05_XDB_REMOTE_CENTRAL_TICKET_REQUIRED'; END IF;",
        "ELSIF SESSION_USER != '"+hostLogin+"' THEN",
        " RAISE EXCEPTION 'PA05_XDB_REMOTE_WRONG_LOGIN'; END IF;",
        "RETURN NEW; END;"
      ].join("\n");
      await tx.unsafe("CREATE OR REPLACE FUNCTION "+q+
        ".pa05_xdb_remote_admission_guard() RETURNS trigger "+
        "LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $pa05$"+
        body+"$pa05$");
      // Trigger replacement is transactional: no unguarded interleaving.
      await tx.unsafe("DROP TRIGGER IF EXISTS pa05_xdb_remote_admission ON "+table);
      await tx.unsafe("CREATE TRIGGER pa05_xdb_remote_admission BEFORE UPDATE ON "+
        table+" FOR EACH ROW EXECUTE FUNCTION "+q+".pa05_xdb_remote_admission_guard()");
    });
    return {
      async stagePreparedEffect({scopeKey,effectId}) {
        scopeKey=scope(scopeKey);effectId=scope(effectId);
        const rows=await db.unsafe("SELECT scope_key,effect_id,run_id,input_digest,fence,state "+
          "FROM "+table+" WHERE scope_key=$1 AND effect_id=$2",[scopeKey,effectId]);
        if(rows.length!==1||rows[0].state!=="PREPARED")
          throw Error("PA05_XDB_REMOTE_EFFECT_NOT_PREPARED");
        const data=fact(rows[0] as Effect);
        const effectDigest=sha(JSON.stringify(data));
        const reservationId=sha(JSON.stringify({workerId,owner,version,effectDigest}));
        // Network outage or central freeze prevents NEW tickets; central
        // pending reservation is intentionally not auto-cleared on local failure.
        await input.authority.reserve({
          packageId:owner,version,workerId,reservationId,effectDigest
        });
        await db.begin(async tx=>{
          const locked=await tx.unsafe("SELECT scope_key,effect_id,run_id,input_digest,"+
            "fence,state FROM "+table+" WHERE scope_key=$1 AND effect_id=$2 FOR UPDATE",
            [scopeKey,effectId]);
          if(locked.length!==1||locked[0].state!=="PREPARED"||
            !eq(fact(locked[0] as Effect),data))
            throw Error("PA05_XDB_REMOTE_EFFECT_CHANGED_AFTER_RESERVATION");
          await tx.unsafe("INSERT INTO "+tickets+
            "(scope_key,effect_id,run_id,input_digest,fence,reservation_id,effect_digest) "+
            "VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(scope_key,effect_id) DO NOTHING",
            [data.scopeKey,data.effectId,data.runId,data.inputDigest,data.fence,
              reservationId,effectDigest]);
          const t=await tx.unsafe("SELECT run_id,input_digest,fence,reservation_id,"+
            "effect_digest FROM "+tickets+" WHERE scope_key=$1 AND effect_id=$2",
            [scopeKey,effectId]);
          if(t.length!==1||!eq({
            runId:String(t[0].run_id),inputDigest:String(t[0].input_digest),
            fence:String(t[0].fence),reservationId:String(t[0].reservation_id),
            effectDigest:String(t[0].effect_digest)
          },{
            runId:data.runId,inputDigest:data.inputDigest,fence:data.fence,
            reservationId,effectDigest
          }))throw Error("PA05_XDB_REMOTE_TICKET_CONFLICT");
        });
        return {reservationId,effectDigest};
      },
      async close(){await db.end();}
    };
  }catch(error){await db.end();throw error;}
}
