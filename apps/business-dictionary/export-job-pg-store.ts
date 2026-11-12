import {createCipheriv,createDecipheriv,randomBytes} from "node:crypto";
import type {
  EnterpriseResourceAddressV010,EnterpriseResourceConditionalAsyncRepositoryV010,
  EnterpriseResourceConditionalPutInputV010,EnterpriseResourceJsonV010,
  EnterpriseResourceV010
} from "../../contracts/enterprise-resource.js";
import type {DictionaryExportJobRecordV010} from "./export-jobs.js";

/**
 * CV04 test-only adapter over the EXISTING asynchronous Enterprise Resource
 * PostgreSQL CAS repository. The product Host does not register this adapter.
 *
 * Every byte of the rows, CSV and selected fields is encrypted at rest. The
 * metadata audit timeline is bound to the ciphertext with AES-GCM AAD and is
 * append-only under this adapter's CAS validation. This is NOT an independent
 * immutable SQL audit ledger or a production key-management certification.
 */
const NAMESPACE="evo.dictionary.export-jobs";
const COLLECTION="bounded-csv-jobs";
const TYPE="evo.dictionary.export.job";
const SCHEMA="evo.dictionary.export-job/0.1.0";
const OWNER="evo-business-dictionary";
const MAX_PAYLOAD_BYTES=500000;
const HEX_ID=/^[a-zA-Z0-9_-]{1,64}$/u;
const SHA256=/^[a-f0-9]{64}$/u;

type Job=DictionaryExportJobRecordV010;
type Audit=Job["audit"][number];
type PublicMeta=Omit<Job,"pages"|"csv"|"csvSha256"|"fields"|"policy">;
type PrivateBlob=Pick<Job,"pages"|"csv"|"csvSha256"|"fields"|"policy">;

type EncryptedEnvelope={
  contractVersion:"0.1.0";
  kind:"dictionary.export-job.encrypted";
  meta:PublicMeta;
  secret:{algorithm:"AES-256-GCM";keyId:string;iv:string;tag:string;ciphertext:string};
};
type State={
  contractVersion:"0.1.0";
  jobId:string;requestDigest:string;contextId:string;enterpriseId:string;
  subjectId:string;actorType:Job["actorType"];state:Job["state"];
  createdAt:string;expiresAt:string;attempt:number;leaseUntil?:string;
  snapshotId:string;rowCount:number;audit:Audit[];
};

function fail(code:string):never{throw new Error(code);}
function canonical(value:unknown):unknown{
  if(Array.isArray(value))return value.map(canonical);
  if(value && typeof value==="object")return Object.fromEntries(
    Object.entries(value as Record<string,unknown>)
      .filter(([,v])=>v!==undefined)
      .sort(([a],[b])=>a.localeCompare(b))
      .map(([k,v])=>[k,canonical(v)]));
  return value;
}
function json(value:unknown):string{return JSON.stringify(canonical(value));}
function addressOf(a:EnterpriseResourceAddressV010):EnterpriseResourceAddressV010 {
  if(a.namespace!==NAMESPACE||a.collectionId!==COLLECTION||a.resourceType!==TYPE
    ||typeof a.contextId!=="string"||!a.contextId
    ||!/^exj-[0-9a-f]{48}$/u.test(a.resourceId))
    return fail("COLLECTION_EXPORT_PG_ADDRESS_INVALID");
  // Never sign extra mutable resource fields or request properties in AAD.
  return {contextId:a.contextId,namespace:a.namespace,
    collectionId:a.collectionId,resourceType:a.resourceType,resourceId:a.resourceId};
}
function meta(job:Job):PublicMeta{
  const {pages:_,csv:_csv,csvSha256:_hash,fields:_fields,policy:_policy,...publicMeta}=job;
  return publicMeta;
}
function privateBlob(job:Job):PrivateBlob{
  return {pages:job.pages,fields:job.fields,policy:job.policy,
    ...(job.csv===undefined?{}:{csv:job.csv}),
    ...(job.csvSha256===undefined?{}:{csvSha256:job.csvSha256})};
}
function validateJob(j:Job,address:EnterpriseResourceAddressV010):void {
  if(!j||j.contractVersion!=="0.1.0"
    ||j.jobId!==address.resourceId||j.contextId!==address.contextId
    ||!j.enterpriseId||!j.subjectId
    ||!["HUMAN","AI","AUTOMATION","SERVICE"].includes(j.actorType)
    ||!["QUEUED","RUNNING","READY","FAILED","EXPIRED"].includes(j.state)
    ||typeof j.requestDigest!=="string"||!SHA256.test(j.requestDigest)
    ||!Number.isSafeInteger(j.attempt)||j.attempt<0||j.attempt>2
    ||!Number.isSafeInteger(j.rowCount)||j.rowCount<0||j.rowCount>1000
    ||!Number.isFinite(Date.parse(j.createdAt))
    ||!Number.isFinite(Date.parse(j.expiresAt))
    ||!/^dict-[a-f0-9]{44}$/u.test(j.snapshotId)
    ||!Array.isArray(j.pages)||j.pages.length>10
    ||!Array.isArray(j.fields)||j.fields.length===0||j.fields.length>5
    ||!Array.isArray(j.audit)||j.audit.length>24
    ||!j.policy||j.policy.maxRows>1000||j.policy.maxBytes>262144
    ||(j.csv!==undefined&&(typeof j.csv!=="string"
      ||Buffer.byteLength(j.csv,"utf8")>262144))
    ||(j.csvSha256!==undefined&&!SHA256.test(j.csvSha256))){
    return fail("COLLECTION_EXPORT_PG_JOB_INVALID");
  }
  for(const event of j.audit){
    if(!event||typeof event.eventId!=="string"
      ||!Number.isFinite(Date.parse(event.at))
      ||!["REQUESTED","STARTED","COMPLETED","REJECTED","READY",
        "DOWNLOAD_AUTHORIZED","EXPIRED"].includes(event.type)
      ||!Number.isSafeInteger(event.rows)||event.rows<0
      ||!Number.isSafeInteger(event.bytes)||event.bytes<0
      ||(event.code!==undefined&&!/^[A-Z0-9_]{1,128}$/u.test(event.code)))
      return fail("COLLECTION_EXPORT_PG_AUDIT_INVALID");
  }
  const plainBytes=Buffer.byteLength(json(privateBlob(j)),"utf8");
  if(plainBytes>MAX_PAYLOAD_BYTES)
    return fail("COLLECTION_EXPORT_PG_STORAGE_BUDGET_EXCEEDED");
}
function transition(previous:Job,next:Job){
  // The GCM associated data already authenticates the historical audit, but
  // a future accepted WRITE must not rewrite, truncate or replace old events.
  const unchanged=(k:keyof Job)=>json(previous[k])===json(next[k]);
  for(const k of ["jobId","requestDigest","contextId","enterpriseId",
    "subjectId","actorType","createdAt","expiresAt","snapshotId","fields","policy",
    "rowCount"] as (keyof Job)[]){
    if(!unchanged(k))fail("COLLECTION_EXPORT_PG_IMMUTABLE_METADATA");
  }
  if(next.audit.length<previous.audit.length
    ||json(next.audit.slice(0,previous.audit.length))!==json(previous.audit))
    fail("COLLECTION_EXPORT_PG_AUDIT_HISTORY_REWRITE_DENIED");
  const allowed:Record<Job["state"],Job["state"][]>={
    QUEUED:["RUNNING","EXPIRED"],
    RUNNING:["RUNNING","READY","FAILED","EXPIRED"],
    READY:["READY","EXPIRED"],
    FAILED:["FAILED","EXPIRED"],
    EXPIRED:["EXPIRED"]
  };
  if(!allowed[previous.state].includes(next.state))
    fail("COLLECTION_EXPORT_PG_STATE_TRANSITION_DENIED");
  if(next.attempt<previous.attempt||next.attempt>previous.attempt+1)
    fail("COLLECTION_EXPORT_PG_ATTEMPT_INVALID");
  if(previous.state==="READY"&&next.state==="READY"&&
    (next.csv!==previous.csv||next.csvSha256!==previous.csvSha256))
    fail("COLLECTION_EXPORT_PG_READY_BYTES_IMMUTABLE");
}
function envelopePayload(resource:EnterpriseResourceV010):EncryptedEnvelope{
  if(resource.schemaRef!==SCHEMA||resource.ownerPackageId!==OWNER||
    resource.storageKind!=="DOCUMENT"||!resource.payload||
    Array.isArray(resource.payload)||typeof resource.payload!=="object")
    return fail("COLLECTION_EXPORT_PG_ENCRYPTED_RESOURCE_REQUIRED");
  const env=resource.payload as unknown as EncryptedEnvelope;
  if(env.contractVersion!=="0.1.0"
    ||env.kind!=="dictionary.export-job.encrypted"||!env.meta||!env.secret
    ||env.secret.algorithm!=="AES-256-GCM")
    return fail("COLLECTION_EXPORT_PG_ENCRYPTED_RESOURCE_REQUIRED");
  return env;
}

/**
 * Reuse createPostgresConditionalResourceRepositoryV010 (shared row-level CAS).
 * This wrapper must never be installed with the CV03 signed SQL gateway mode:
 * that gateway correctly rejects unsigned writes from this new feature.
 * It also must never be registered by the ordinary production Host.
 */
export function createIsolatedEncryptedDictionaryExportPgStoreV010(input:{
  resources:EnterpriseResourceConditionalAsyncRepositoryV010;
  encryptionKey:Uint8Array;
  keyId:string;
  isolatedTestOnly:boolean;
}):{
  readonly conditionalWriteConsistency:"SHARED_POSTGRES_TRANSACTION";
  readonly encryptedDictionaryExportJobs:true;
  get(address:EnterpriseResourceAddressV010):Promise<EnterpriseResourceV010|undefined>;
  putIfRevision(input:EnterpriseResourceConditionalPutInputV010):Promise<EnterpriseResourceV010>;
}{
  if(process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true)
    fail("COLLECTION_EXPORT_PG_PRODUCTION_ADMISSION_NOT_CERTIFIED");
  if(input.resources?.conditionalWriteConsistency!=="SHARED_POSTGRES_TRANSACTION"
    ||!input.resources.get||!input.resources.putIfRevision)
    fail("COLLECTION_EXPORT_PG_SHARED_CAS_REQUIRED");
  if(!(input.encryptionKey instanceof Uint8Array)||input.encryptionKey.byteLength!==32
    ||!HEX_ID.test(input.keyId))
    fail("COLLECTION_EXPORT_PG_KEY_CONFIG_INVALID");
  const key=Buffer.from(input.encryptionKey);
  const decode=(resource:EnterpriseResourceV010):EnterpriseResourceV010=>{
    const addr=addressOf(resource);
    const env=envelopePayload(resource);
    if(env.secret.keyId!==input.keyId||
      !/^[a-f0-9]{24}$/u.test(env.secret.iv)||
      !/^[a-f0-9]{32}$/u.test(env.secret.tag)||
      !/^[A-Za-z0-9+/=]+$/u.test(env.secret.ciphertext))
      return fail("COLLECTION_EXPORT_PG_KEY_OR_CIPHER_INVALID");
    let secret:PrivateBlob;
    try{
      const decipher=createDecipheriv("aes-256-gcm",key,Buffer.from(env.secret.iv,"hex"));
      const aad=json({address:addr,meta:env.meta,schemaRef:SCHEMA});
      decipher.setAAD(Buffer.from(aad,"utf8"));
      decipher.setAuthTag(Buffer.from(env.secret.tag,"hex"));
      const clear=Buffer.concat([decipher.update(Buffer.from(env.secret.ciphertext,"base64")),
        decipher.final()]).toString("utf8");
      secret=JSON.parse(clear) as PrivateBlob;
    }catch{
      return fail("COLLECTION_EXPORT_PG_CIPHERTEXT_INTEGRITY_FAILED");
    }
    const job={...env.meta,...secret} as Job;
    validateJob(job,addr);
    return {...resource,payload:job as unknown as EnterpriseResourceJsonV010};
  };
  return{
    conditionalWriteConsistency:"SHARED_POSTGRES_TRANSACTION",
    encryptedDictionaryExportJobs:true,
    async get(address) {
      const raw=await input.resources.get(addressOf(address));
      return raw?decode(raw):undefined;
    },
    async putIfRevision(request) {
      const addr=addressOf(request);
      if(request.schemaRef!==SCHEMA||request.ownerPackageId!==OWNER
        ||(request.storageKind!==undefined&&request.storageKind!=="DOCUMENT")
        ||!request.payload||typeof request.payload!=="object")
        fail("COLLECTION_EXPORT_PG_ENCRYPTED_RESOURCE_REQUIRED");
      const job=request.payload as unknown as Job;
      validateJob(job,addr);
      // Only the explicit isolated maintenance service may expire a job
      // under its own actor identity; it cannot enqueue, run or download.
      if(request.actorSubjectId!==job.subjectId &&
        !(process.env.NODE_ENV==="test" &&
          request.actorSubjectId==="cv04.export-maintenance" &&
          request.expectedRevision!==null && job.state==="EXPIRED"))
        fail("COLLECTION_EXPORT_PG_ACTOR_MISMATCH");
      if(request.expectedRevision!==null){
        const old=await input.resources.get(addr);
        if(!old||old.revision!==request.expectedRevision)
          fail("ENTERPRISE_RESOURCE_REVISION_CONFLICT");
        transition(decode(old).payload as unknown as Job,job);
      }else if(job.state!=="QUEUED"
        ||job.audit.length!==1||job.audit[0].type!=="REQUESTED"){
        fail("COLLECTION_EXPORT_PG_CREATE_STATE_INVALID");
      }
      const metadata=meta(job);
      const nonce=randomBytes(12);
      const cipher=createCipheriv("aes-256-gcm",key,nonce);
      cipher.setAAD(Buffer.from(json({address:addr,meta:metadata,schemaRef:SCHEMA}),"utf8"));
      const encrypted=Buffer.concat([cipher.update(json(privateBlob(job)),"utf8"),
        cipher.final()]);
      const payload:EncryptedEnvelope={
        contractVersion:"0.1.0",kind:"dictionary.export-job.encrypted",meta:metadata,
        secret:{algorithm:"AES-256-GCM",keyId:input.keyId,iv:nonce.toString("hex"),
          tag:cipher.getAuthTag().toString("hex"),ciphertext:encrypted.toString("base64")}
      };
      const committed=await input.resources.putIfRevision({
        ...request,payload:payload as unknown as EnterpriseResourceJsonV010,
        storageKind:"DOCUMENT"
      });
      return decode(committed);
    }
  };
}
