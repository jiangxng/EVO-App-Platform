import postgres from "postgres";
import {createHash} from "node:crypto";
import {assertObjectExtensionDefinitionV010} from "../../contracts/foundation-object/extension.js";
import type {ObjectExtensionDefinitionV010} from "../../contracts/foundation-object/extension.js";
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
  /** D14C12 opt-in, independently CA-verified client certificate for Host SQL. */
  hostTls?:{ca:string;cert:string;key:string};
}){
  if(!input.connectionString||
     !/^pa02_[a-z0-9_]{1,58}$/.test(input.objectSchema))
    throw Error("PA05_OBJECT_SQL_HOST_ISSUER_CONFIG_INVALID");
  if(input.hostTls && (!input.hostTls.ca||!input.hostTls.cert||!input.hostTls.key))
    throw Error("PA05_OBJECT_HOST_TLS_MATERIAL_REQUIRED");
  const sql=postgres(input.connectionString,{
    max:2,connect_timeout:10,idle_timeout:15,
    ...(input.hostTls?{ssl:{...input.hostTls,rejectUnauthorized:true}}:{})
  });
  const q='"'+input.objectSchema+'".pa05_object_issue_host_permit';
  const register='"'+input.objectSchema+'".pa05_object_register_host_command';

  // D14C9: Only an explicit, earlier Host caller may approve a command.
  // DO NOT call this from Owner.issue() or install default production routes.
  // Registration is persisted by the independently authenticated SQL Host.
  return {
    async approveCommand(request:{
      scopeKey:string;source:{
        scope:{contextKind:string;contextId:string;enterpriseId?:string;
          principalSubjectId:string;principalActorType:string};
        runId:string;effectId:string;receiptId:string;idempotencyKey:string;
        inputDigest:string;toolId:string;arguments?:Record<string,unknown>;
      }
    }):Promise<"APPROVED">{
      const r=request?.source,a=r?.scope;
      if(!request||typeof request.scopeKey!=="string"||
        !request.scopeKey||request.scopeKey.length>512||
        a?.contextKind!=="ENTERPRISE"||
        ![r?.runId,r?.effectId,r?.receiptId,r?.idempotencyKey,
          r?.toolId,a?.contextId,a?.enterpriseId,a?.principalSubjectId]
          .every(x=>typeof x==="string"&&x.length>0&&x.length<=512)||
        !["AI","HUMAN"].includes(a.principalActorType)||
        !r.arguments||typeof r.arguments!=="object"||
        Array.isArray(r.arguments)||
        typeof r.inputDigest!=="string"||
        !/^[a-f0-9]{64}$/.test(r.inputDigest)||
        hash(json(r.arguments))!==r.inputDigest)
        throw Error("PA05_OBJECT_SQL_HOST_COMMAND_SOURCE_INVALID");
      const source={
        runId:r.runId,effectId:r.effectId,receiptId:r.receiptId,
        idempotencyKey:r.idempotencyKey,inputDigest:r.inputDigest,
        toolId:r.toolId,contextId:a.contextId,enterpriseId:a.enterpriseId,
        principalSubjectId:a.principalSubjectId,
        principalActorType:a.principalActorType,
        arguments:r.arguments
      };
      const rows=await sql.unsafe("SELECT "+register+
        "($1,$2,$3,$4,$5,$6,$7::jsonb) AS state",[
          request.scopeKey,r.runId,r.effectId,r.inputDigest,
          a.contextId,a.enterpriseId!,
          sql.json(JSON.parse(json(source)))
        ]);
      if(rows[0]?.state!=="APPROVED")
        throw Error("PA05_OBJECT_SQL_HOST_COMMAND_APPROVAL_UNVERIFIED");
      return "APPROVED";
    },
    async issue(request:{
      scopeKey:string;runId:string;effectId:string;inputDigest:string;
      contextId:string;enterpriseId:string;
      approvedInputArguments:unknown;
      approvedResource:unknown;approvedEvidence:unknown;
      approvedEvidenceDigest:string;approvedIdempotencyHash:string;
    }):Promise<string>{
      if(!request||![
        request.scopeKey,request.runId,request.effectId,
        request.inputDigest,request.contextId,request.enterpriseId
      ].every(x=>typeof x==="string"&&x.length>0&&x.length<=512)||
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
      const args=request.approvedInputArguments;
      if(!args||typeof args!=="object"||Array.isArray(args)||
        !("definition" in args)||Object.keys(args).length!==1)
        throw Error("PA05_OBJECT_SQL_APPROVAL_SOURCE_REQUIRED");
      const normalized=assertObjectExtensionDefinitionV010(
        structuredClone((args as {definition:ObjectExtensionDefinitionV010}).definition));
      if(e.inputDigest!==request.inputDigest||
        e.runId!==request.runId||e.effectId!==request.effectId||
        e.contextId!==request.contextId||
        e.enterpriseId!==request.enterpriseId||
        a.contextId!==request.contextId||
        a.resourceId!==e.recordId||
        a.ownerPackageId!==e.ownerPackageId||
        a.createdAt!==e.recordedAt||a.updatedAt!==e.recordedAt||
        json(a.payload)!==json(e.definition)||
        hash(json(args))!==request.inputDigest||
        json(normalized)!==json(e.definition)||
        hash(json(e))!==request.approvedEvidenceDigest||
        hash(String(e.idempotencyKey))!==request.approvedIdempotencyHash||
        !/^[a-f0-9]{64}$/.test(request.approvedEvidenceDigest)||
        !/^[a-f0-9]{64}$/.test(request.approvedIdempotencyHash))
        throw Error("PA05_OBJECT_SQL_APPROVED_COMMAND_MISMATCH");
      // The PostgreSQL function checks real SESSION_USER + immutable D10
      // ticket + PA-02 state + D14A ACTIVE and owns the permit table.
      const rows=await sql.unsafe("SELECT "+q+
        "($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11::jsonb) AS token",[
          request.scopeKey,request.runId,request.effectId,
          request.inputDigest,request.contextId,request.enterpriseId,
          sql.json(JSON.parse(json(resource))),
          sql.json(JSON.parse(json(evidence))),
          request.approvedEvidenceDigest,
          request.approvedIdempotencyHash,
          sql.json(JSON.parse(json(args)))
        ]);
      const token=rows[0]?.token;
      if(typeof token!=="string"||!/^[a-f0-9]{32,64}$/.test(token))
        throw Error("PA05_OBJECT_SQL_HOST_ISSUER_UNVERIFIED");
      return token;
    },
    async bindTransaction(request:{
      scopeKey:string;effectId:string;token:string;
      backendPid:number;transactionId:string;
    }):Promise<"BOUND">{
      if(!request||typeof request.scopeKey!=="string"||
        !request.scopeKey||request.scopeKey.length>512||
        typeof request.effectId!=="string"||!request.effectId||
        request.effectId.length>512||
        typeof request.token!=="string"||
        !/^[a-f0-9]{64}$/.test(request.token)||
        !Number.isSafeInteger(request.backendPid)||request.backendPid<=0||
        typeof request.transactionId!=="string"||
        !/^[0-9]{1,20}$/.test(request.transactionId))
        throw Error("PA05_OBJECT_SQL_BIND_SOURCE_INVALID");
      // Same trusted Host SQL LOGIN, separate from business LOGIN. The
      // SECURITY DEFINER function checks a LIVE physical SQL transaction,
      // not an Owner-controlled custom GUC or application-supplied bool.
      const rows=await sql.unsafe("SELECT "+
        '"'+input.objectSchema+'".pa05_object_bind_host_permit'+
        "($1,$2,$3,$4,$5) AS state",[
          request.scopeKey,request.effectId,request.token,
          request.backendPid,request.transactionId
        ]);
      if(rows[0]?.state!=="BOUND")
        throw Error("PA05_OBJECT_SQL_BIND_OUTCOME_UNVERIFIED");
      return "BOUND";
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
