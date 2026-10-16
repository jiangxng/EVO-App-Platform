import postgres from "postgres";
import {createHash} from "node:crypto";
const canonical=(v:unknown):unknown=>Array.isArray(v)?v.map(canonical):
  v!==null&&typeof v==="object"?Object.fromEntries(
    Object.entries(v as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b))
      .map(([k,x])=>[k,canonical(x)])):v;
const json=(v:unknown)=>JSON.stringify(canonical(v));
const hash=(v:string)=>createHash("sha256").update(v).digest("hex");

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
      approvedResource:unknown;approvedEvidence:unknown;
      approvedEvidenceDigest:string;approvedIdempotencyHash:string;
    }):Promise<string>{
      if(!request||!Object.values(request).every(x=>
        typeof x==="string"&&x.length>0&&x.length<=512)||
        !/^[a-f0-9]{64}$/.test(request.inputDigest))
        throw Error("PA05_OBJECT_SQL_HOST_ISSUER_SOURCE_INVALID");
      // A full approved snapshot is carried by a distinct SQL Host identity,
      // never by a business SQL marker. Recompute the existing Owner canonical
      // digest so a claimed approved document cannot silently diverge from D10.
      const resource=request.approvedResource;
      const evidence=request.approvedEvidence;
      if(!resource||typeof resource!=="object"||Array.isArray(resource)||
        !evidence||typeof evidence!=="object"||Array.isArray(evidence))
        throw Error("PA05_OBJECT_SQL_APPROVAL_SNAPSHOT_REQUIRED");
      const a=resource as Record<string,unknown>;
      const e=evidence as Record<string,unknown>;
      if(e.inputDigest!==request.inputDigest||
        e.runId!==request.runId||e.effectId!==request.effectId||
        e.contextId!==request.contextId||
        e.enterpriseId!==request.enterpriseId||
        a.contextId!==request.contextId||
        a.resourceId!==e.recordId||
        a.ownerPackageId!==e.ownerPackageId||
        a.createdAt!==e.recordedAt||a.updatedAt!==e.recordedAt||
        json(a.payload)!==json(e.definition)||
        hash(json({definition:e.definition}))!==request.inputDigest||
        hash(json(e))!==request.approvedEvidenceDigest||
        hash(String(e.idempotencyKey))!==request.approvedIdempotencyHash||
        !/^[a-f0-9]{64}$/.test(request.approvedEvidenceDigest)||
        !/^[a-f0-9]{64}$/.test(request.approvedIdempotencyHash))
        throw Error("PA05_OBJECT_SQL_APPROVED_COMMAND_MISMATCH");
      // The PostgreSQL function checks real SESSION_USER + immutable D10
      // ticket + PA-02 state + D14A ACTIVE and owns the permit table.
      const rows=await sql.unsafe("SELECT "+q+
        "($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10) AS token",[
          request.scopeKey,request.runId,request.effectId,
          request.inputDigest,request.contextId,request.enterpriseId,
          json(resource),json(evidence),request.approvedEvidenceDigest,
          request.approvedIdempotencyHash
        ]);
      const token=rows[0]?.token;
      if(typeof token!=="string"||!/^[a-f0-9]{32,64}$/.test(token))
        throw Error("PA05_OBJECT_SQL_HOST_ISSUER_UNVERIFIED");
      return token;
    },
    async revoke(request:{
      scopeKey:string;effectId:string;token:string;
    }):Promise<"REVOKED"|"COMMITTED"|"NOT_FOUND">{
      if(!request||typeof request.scopeKey!=="string"||
        !request.scopeKey||request.scopeKey.length>512||
        typeof request.effectId!=="string"||!request.effectId||
        request.effectId.length>512||
        typeof request.token!=="string"||
        !/^[a-f0-9]{64}$/.test(request.token))
        throw Error("PA05_OBJECT_SQL_REVOKE_SOURCE_INVALID");
      // Do not advertise cancellation: COMMITTED means the effect won the
      // permit-row transaction race, and must use original Owner verifier.
      const rows=await sql.unsafe("SELECT "+
        '"'+input.objectSchema+'".pa05_object_revoke_host_permit'+
        "($1,$2,$3) AS state",[
          request.scopeKey,request.effectId,request.token
        ]);
      const state=rows[0]?.state;
      if(state!=="REVOKED"&&state!=="COMMITTED"&&state!=="NOT_FOUND")
        throw Error("PA05_OBJECT_SQL_REVOKE_OUTCOME_UNVERIFIED");
      return state;
    },
    close:()=>sql.end()
  };
}
