import postgres from "postgres";

/**
 * PA05-04D14C5: a distinct, real authenticated Host SQL LOGIN mints an
 * opaque per-effect permit via a SECURITY DEFINER PostgreSQL function.
 * A business Owner LOGIN has no rights to issue or read permits. Do not
 * expose this issuer through plugin capabilities or Agent-supplied input.
 *
 * Optional isolated Object Extension / PG18 certification path ONLY:
 * not production launch, credential provisioning, or remote fail-stop.
 */
export function createPa05ObjectExtensionHostPermitIssuerV010(input:{
  connectionString:string;
  objectSchema:string;
}){
  if(!input.connectionString||
     !/^pa02_[a-z0-9_]{1,58}$/.test(input.objectSchema))
    throw Error("PA05_OBJECT_SQL_HOST_ISSUER_CONFIG_INVALID");
  const sql=postgres(input.connectionString,{max:2,connect_timeout:10,idle_timeout:15});
  const q='"'+input.objectSchema+'".pa05_object_issue_host_permit';
  return {
    async issue(request:{
      scopeKey:string;runId:string;effectId:string;inputDigest:string;
      contextId:string;enterpriseId:string;
    }):Promise<string>{
      if(!request||!Object.values(request).every(x=>
        typeof x==="string"&&x.length>0&&x.length<=512)||
        !/^[a-f0-9]{64}$/.test(request.inputDigest))
        throw Error("PA05_OBJECT_SQL_HOST_ISSUER_SOURCE_INVALID");
      // The PostgreSQL function checks real SESSION_USER + immutable D10
      // ticket + PA-02 state + D14A ACTIVE and owns the permit table.
      const rows=await sql.unsafe("SELECT "+q+
        "($1,$2,$3,$4,$5,$6) AS token",[
          request.scopeKey,request.runId,request.effectId,
          request.inputDigest,request.contextId,request.enterpriseId
        ]);
      const token=rows[0]?.token;
      if(typeof token!=="string"||!/^[a-f0-9]{32,64}$/.test(token))
        throw Error("PA05_OBJECT_SQL_HOST_ISSUER_UNVERIFIED");
      return token;
    },
    close:()=>sql.end()
  };
}
