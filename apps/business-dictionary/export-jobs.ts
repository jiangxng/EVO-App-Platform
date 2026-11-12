import { createHash, randomUUID } from "node:crypto";
import type { AuthorizationProviderV010, PlatformRequestContextV010 } from "../../contracts/platform-services.js";
import type { EnterpriseResourceRepositoryV010, EnterpriseResourceConditionalAsyncRepositoryV010,
  EnterpriseResourceJsonV010 } from "../../contracts/enterprise-resource.js";
import type { DataCollectionResultV010 } from "../../contracts/data-collection/query.js";
import { createAuthorizedCrossPageCsvV010, type AuthorizedCrossPageExportPolicyV010 } from
  "../../foundation/collection-query/authorized-cross-page-csv.js";
import { queryBusinessDictionaryCollectionV010 } from "./collection-query.js";
import type { BusinessDictionaryRepositoryV010 } from "./repository.js";

/**
 * CV04 restricted Domain Owner staging API, NOT registered on ActionHost/Eidos.
 *
 * Only isolated NODE_ENV=test may use local filesystem/memory CAS. These are
 * NOT cross-host authorities. A future adapter must be certified for a shared
 * PostgreSQL transaction before any production Host command is registered.
 */
export const DICTIONARY_EXPORT_PERMISSION_V010 = "dictionary.export";
const NS="evo.dictionary.export-jobs", COLLECTION="bounded-csv-jobs", TYPE="evo.dictionary.export.job";
const SCHEMA="evo.dictionary.export-job/0.1.0";
const FIELDS=["dictionaryId","displayName","state","version","optionCount"] as const;
const KEY=/^[A-Za-z0-9_-]{8,80}$/u;
const JOB_TTL_MS=15*60*1000;
const LEASE_MS=15*1000;
const MAX_ATTEMPTS=2;
const MAX_SNAPSHOT_BYTES=262144;
const MAX_DOWNLOAD_AUDITS=3;
const DEFAULT_POLICY:AuthorizedCrossPageExportPolicyV010={
  pageSize:100,maxPages:10,maxRows:1000,maxBytes:262144,maxDurationMs:30000
};
export type DictionaryExportJobStateV010="QUEUED"|"RUNNING"|"READY"|"FAILED"|"EXPIRED";
export interface DictionaryExportJobAuditV010 {
  eventId:string;
  type:"REQUESTED"|"STARTED"|"COMPLETED"|"REJECTED"|"READY"|"DOWNLOAD_AUTHORIZED"|"EXPIRED";
  at:string;
  rows:number;
  bytes:number;
  code?:string;
}
export interface DictionaryExportJobRecordV010 {
  contractVersion:"0.1.0";
  jobId:string;
  requestDigest:string;
  contextId:string;
  enterpriseId:string;
  subjectId:string;
  actorType:"HUMAN"|"AI"|"AUTOMATION"|"SERVICE";
  state:DictionaryExportJobStateV010;
  createdAt:string;
  expiresAt:string;
  attempt:number;
  leaseUntil?:string;
  policy:AuthorizedCrossPageExportPolicyV010;
  fields:string[];
  snapshotId:string;
  pages:DataCollectionResultV010[];
  rowCount:number;
  csv?:string;
  csvSha256?:string;
  audit:DictionaryExportJobAuditV010[];
}
type JobAudit=DictionaryExportJobAuditV010;
type JobRecord=DictionaryExportJobRecordV010;
export interface DictionaryExportOwnerRequestV010 {
  idempotencyKey:string;
  query:{
    view?:"all"|"draft"|"published";
    search?:string;
    sort?:"dictionaryId"|"displayName"|"state"|"version";
    direction?:"asc"|"desc";
  };
  fieldIds:string[];
}
export interface DictionaryExportJobSummaryV010 {
  contractVersion:"0.1.0";
  jobId:string;
  state:DictionaryExportJobStateV010;
  createdAt:string;
  expiresAt:string;
  attempts:number;
  rows:number;
}
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const fail=(code:string):never=>{throw new Error(code)};
const clone=<T>(v:T):T=>structuredClone(v);
function scope(context:PlatformRequestContextV010) {
  const active=context.context?.activeContext;
  if (!active || active.kind!=="ENTERPRISE" || !active.contextId || !active.enterpriseId
    || context.scope.enterpriseId!==active.enterpriseId
    || context.scope.userId && context.scope.userId!==context.principal.subjectId) {
    return fail("COLLECTION_EXPORT_CONTEXT_INVALID");
  }
  return {contextId:active.contextId,enterpriseId:active.enterpriseId,
    subjectId:context.principal.subjectId,actorType:context.principal.actorType};
}
function normalizeRequest(request:DictionaryExportOwnerRequestV010){
  if (!request || !KEY.test(request.idempotencyKey)
    || !request.query || typeof request.query!=="object"
    || Array.isArray(request.query)
    || Object.keys(request.query).some(key=>!["view","search","sort","direction"].includes(key))
    || !Array.isArray(request.fieldIds) || request.fieldIds.length<1
    || request.fieldIds.length>FIELDS.length
    || new Set(request.fieldIds).size!==request.fieldIds.length
    || request.fieldIds.some(x=>!FIELDS.includes(x as typeof FIELDS[number]))) {
    return fail("COLLECTION_EXPORT_REQUEST_INVALID");
  }
  return {query:clone(request.query),fieldIds:[...request.fieldIds]};
}
function audit(job:JobRecord,type:JobAudit["type"],at:string,
  rows=0,bytes=0,code?:string):JobRecord {
  return {...job,audit:[...job.audit,{eventId:randomUUID(),type,at,rows,bytes,
    ...(code?{code}:{})}]};
}
function summary(job:JobRecord):DictionaryExportJobSummaryV010 {
  return {contractVersion:"0.1.0",jobId:job.jobId,state:job.state,
    createdAt:job.createdAt,expiresAt:job.expiresAt,attempts:job.attempt,
    rows:job.state==="READY"?job.rowCount:0};
}

export function createDictionaryExportJobOwnerV010(input:{
  repository:BusinessDictionaryRepositoryV010;
  resources:EnterpriseResourceRepositoryV010|EnterpriseResourceConditionalAsyncRepositoryV010;
  resolveAuthorizationProvider():AuthorizationProviderV010|undefined;
  /** Live Enterprise relationship check; never a cached membership Boolean. */
  hasLiveRelationship(context:PlatformRequestContextV010):boolean;
  isFeatureActive():boolean;
  /** Explicit test-only exception. Cannot be used by a production Host. */
  isolatedTestOnly?:boolean;
  now?:()=>Date;
}) {
  const testScope=input.isolatedTestOnly===true && process.env.NODE_ENV==="test";
  const isPg=input.resources?.conditionalWriteConsistency==="SHARED_POSTGRES_TRANSACTION";
  const encryptedPg=(input.resources as {encryptedDictionaryExportJobs?:boolean} | undefined)
    ?.encryptedDictionaryExportJobs===true;
  // A raw PG resource adapter stores plaintext JSONB and MUST NOT be a legal
  // Owner export store. Until independent production key/role/PA05 approval,
  // even encrypted PG is isolated-test-only, never a live Host capability.
  if (!input.resources?.putIfRevision || !testScope
    || (isPg && !encryptedPg)) {
    throw new Error("COLLECTION_EXPORT_SHARED_AUTHORITY_REQUIRED");
  }
  const now=input.now??(()=>new Date());
  const clock=()=>now().getTime();
  const iso=()=>now().toISOString();
  const address=(contextId:string,jobId:string)=>({
    contextId,namespace:NS,collectionId:COLLECTION,resourceType:TYPE,resourceId:jobId
  });
  const write=async(job:JobRecord,revision:number|null)=>{
    const resource=await input.resources.putIfRevision!({
      ...address(job.contextId,job.jobId),schemaRef:SCHEMA,ownerPackageId:"evo-business-dictionary",
      payload:JSON.parse(JSON.stringify(job)) as EnterpriseResourceJsonV010,
      storageKind:"DOCUMENT",actorSubjectId:job.subjectId,recordedAt:iso(),
      expectedRevision:revision
    });
    return {job,revision:resource.revision??0};
  };
  const load=async(context:PlatformRequestContextV010,jobId:string)=>{
    const s=scope(context);
    if (!/^exj-[0-9a-f]{48}$/u.test(jobId))return fail("COLLECTION_EXPORT_JOB_NOT_FOUND");
    const r=await input.resources.get(address(s.contextId,jobId));
    if (!r || r.lifecycleState!=="ACTIVE" || !r.payload
      || typeof r.revision!=="number")return fail("COLLECTION_EXPORT_JOB_NOT_FOUND");
    const j=r.payload as unknown as JobRecord;
    if (j.contractVersion!=="0.1.0" || j.jobId!==jobId || j.contextId!==s.contextId
      || j.enterpriseId!==s.enterpriseId || j.subjectId!==s.subjectId
      || j.actorType!==s.actorType) return fail("COLLECTION_EXPORT_JOB_NOT_FOUND");
    return {job:j,revision:r.revision};
  };
  const authorize=async(context:PlatformRequestContextV010)=>{
    const s=scope(context);
    if (!input.isFeatureActive() || !input.hasLiveRelationship(context))
      return fail("COLLECTION_EXPORT_PERMISSION_DENIED");
    let provider:AuthorizationProviderV010|undefined;
    try { provider=input.resolveAuthorizationProvider(); } catch {
      return fail("COLLECTION_EXPORT_AUTHORIZATION_UNAVAILABLE");
    }
    if (!provider) return fail("COLLECTION_EXPORT_AUTHORIZATION_UNAVAILABLE");
    let decision;
    try {
      decision=await provider.check({
        contractVersion:"0.1.0",principal:context.principal,scope:context.scope,
        action:DICTIONARY_EXPORT_PERMISSION_V010,
        resource:{type:"business-dictionary.definition",id:s.enterpriseId,
          attributes:{contextId:s.contextId,purpose:"BOUNDED_CSV_EXPORT"}},
        context:{activeContextKind:"ENTERPRISE",activeContextId:s.contextId,
          correlationId:context.correlationId}
      });
    } catch { return fail("COLLECTION_EXPORT_AUTHORIZATION_UNAVAILABLE") }
    if (decision?.allowed!==true) return fail("COLLECTION_EXPORT_PERMISSION_DENIED");
    return s;
  };
  const expire=async(job:JobRecord,revision:number)=>{
    if (clock()<Date.parse(job.expiresAt))return {job,revision};
    if (job.state==="EXPIRED")return {job,revision};
    const next=audit({...job,state:"EXPIRED",pages:[],csv:undefined,
      csvSha256:undefined}, "EXPIRED",iso());
    return write(next,revision);
  };
  async function request(context:PlatformRequestContextV010,details:DictionaryExportOwnerRequestV010) {
    const s=await authorize(context);
    const requestValues=normalizeRequest(details);
    const digest=hash(JSON.stringify(requestValues));
    const jobId="exj-"+hash([s.contextId,s.enterpriseId,s.subjectId,s.actorType,
      details.idempotencyKey].join("|")).slice(0,48);
    let previous=await input.resources.get(address(s.contextId,jobId));
    if (previous) {
      const old=await load(context,jobId);
      if (old.job.requestDigest!==digest) return fail("COLLECTION_EXPORT_IDEMPOTENCY_CONFLICT");
      return summary((await expire(old.job,old.revision)).job);
    }
    // Capture precisely one Domain Owner repository list. The serialized
    // snapshot only persists chosen readable fields, NEVER dictionary options.
    const dictionaries=input.repository.list(s.contextId);
    const seed=queryBusinessDictionaryCollectionV010({dictionaries,query:{
      ...requestValues.query,page:0,pageSize:DEFAULT_POLICY.pageSize}});
    const pageCount=Math.max(1,Math.ceil(seed.pageInfo.total/DEFAULT_POLICY.pageSize));
    if (seed.pageInfo.total>DEFAULT_POLICY.maxRows || pageCount>DEFAULT_POLICY.maxPages)
      return fail("COLLECTION_EXPORT_ROW_BUDGET_EXCEEDED");
    const pages:DataCollectionResultV010[]=[];
    for(let i=0;i<pageCount;i++){
      const page=i===0?seed:queryBusinessDictionaryCollectionV010({
        dictionaries,query:{...requestValues.query,page:i,pageSize:DEFAULT_POLICY.pageSize}
      });
      if (page.readableFieldIds.some(f=>!FIELDS.includes(f as typeof FIELDS[number])))
        return fail("COLLECTION_EXPORT_FIELD_NOT_READABLE");
      pages.push({
        ...page,readableFieldIds:[...requestValues.fieldIds],
        rows:page.rows.map(row=>({rowId:row.rowId,
          cells:Object.fromEntries(requestValues.fieldIds.map(id=>[id,row.cells[id]??null]))}))
      });
    }
    // Bound the durable queued snapshot itself, not only the eventual CSV.
    // Otherwise a huge readable value could exhaust storage before RUN.
    const snapshotBytes=Buffer.byteLength(JSON.stringify(pages),"utf8");
    if(snapshotBytes>MAX_SNAPSHOT_BYTES)
      return fail("COLLECTION_EXPORT_SNAPSHOT_BYTE_BUDGET_EXCEEDED");
    await authorize(context);
    const time=iso();
    const snap=hash(JSON.stringify(pages));
    const job:JobRecord={
      contractVersion:"0.1.0",jobId,requestDigest:digest,...s,
      state:"QUEUED",createdAt:time,expiresAt:new Date(clock()+JOB_TTL_MS).toISOString(),
      attempt:0,policy:DEFAULT_POLICY,fields:requestValues.fieldIds,
      snapshotId:"dict-"+snap.slice(0,44),pages,rowCount:seed.pageInfo.total,
      audit:[]
    };
    const toSave=audit(job,"REQUESTED",time);
    try { return summary((await write(toSave,null)).job) }
    catch(error) {
      if ((error as Error).message!=="ENTERPRISE_RESOURCE_REVISION_CONFLICT")throw error;
      previous=await input.resources.get(address(s.contextId,jobId));
      if (!previous)throw error;
      const conflict=await load(context,jobId);
      if(conflict.job.requestDigest!==digest)return fail("COLLECTION_EXPORT_IDEMPOTENCY_CONFLICT");
      return summary(conflict.job);
    }
  }
  async function status(context:PlatformRequestContextV010,jobId:string){
    await authorize(context);
    const current=await load(context,jobId);
    return summary((await expire(current.job,current.revision)).job);
  }
  async function run(context:PlatformRequestContextV010,jobId:string) {
    await authorize(context);
    let state=await load(context,jobId);
    state=await expire(state.job,state.revision);
    if (state.job.state==="READY")return summary(state.job);
    if (state.job.state==="EXPIRED"||state.job.state==="FAILED")
      return fail("COLLECTION_EXPORT_JOB_NOT_RUNNABLE");
    if (state.job.state==="RUNNING" && Date.parse(state.job.leaseUntil??"")>clock())
      return fail("COLLECTION_EXPORT_JOB_ALREADY_RUNNING");
    if (state.job.attempt>=MAX_ATTEMPTS)return fail("COLLECTION_EXPORT_JOB_ATTEMPT_EXHAUSTED");
    state=await write(audit({
      ...state.job,state:"RUNNING",attempt:state.job.attempt+1,
      leaseUntil:new Date(clock()+LEASE_MS).toISOString()
    },"STARTED",iso()),state.revision);
    // Audit append is CAS-atomic in exactly the same durable job resource.
    const append=async(type:JobAudit["type"],rows:number,bytes:number,code?:string)=>{
      const curr=await load(context,jobId);
      if(curr.job.state!=="RUNNING")return fail("COLLECTION_EXPORT_JOB_NOT_RUNNING");
      await write(audit(curr.job,type,iso(),rows,bytes,code),curr.revision);
    };
    try {
      const result=await createAuthorizedCrossPageCsvV010({
        auditId:jobId,
        scope:{enterpriseId:state.job.enterpriseId,subjectId:state.job.subjectId,
          actorType:state.job.actorType},
        fieldIds:state.job.fields,policy:state.job.policy,
        authorizeExport:async()=>{try {await authorize(context);return true} catch{return false}},
        openSnapshot:async()=>({
          snapshotId:state.job.snapshotId,
          readPage:async(i,pageSize)=>{
            if(pageSize!==state.job.policy.pageSize || !state.job.pages[i])
              return fail("COLLECTION_EXPORT_SNAPSHOT_PAGE_MISSING");
            return clone(state.job.pages[i]);
          }
        }),
        audit:async entry=>{
          await append(entry.stage==="REJECTED"?"REJECTED":
            entry.stage==="COMPLETED"?"COMPLETED":"STARTED",
            entry.rowCount,entry.byteCount,entry.denialCode);
        }
      });
      await authorize(context);
      const current=await load(context,jobId);
      if(current.job.state!=="RUNNING")return fail("COLLECTION_EXPORT_JOB_NOT_RUNNING");
      const next=audit({
        ...current.job,state:"READY",pages:[],leaseUntil:undefined,
        csv:result.csv,csvSha256:hash(result.csv),rowCount:result.rowCount
      },"READY",iso(),result.rowCount,result.byteCount);
      return summary((await write(next,current.revision)).job);
    } catch(error) {
      const code=error instanceof Error && /^[A-Z0-9_]+$/u.test(error.message)
        ?error.message:"COLLECTION_EXPORT_EXECUTION_FAILED";
      try{
        const current=await load(context,jobId);
        if(current.job.state==="RUNNING"){
          await write(audit({...current.job,state:"FAILED",pages:[],csv:undefined,
            leaseUntil:undefined},"REJECTED",iso(),0,0,code),current.revision);
        }
      }catch{/* fail closed; stale RUNNING lease can be resumed from saved snapshot */}
      throw error;
    }
  }
  async function download(context:PlatformRequestContextV010,jobId:string){
    await authorize(context);
    let current=await load(context,jobId);
    current=await expire(current.job,current.revision);
    if(current.job.state!=="READY" || typeof current.job.csv!=="string"
      || !current.job.csvSha256 || hash(current.job.csv)!==current.job.csvSha256)
      return fail("COLLECTION_EXPORT_DOWNLOAD_NOT_READY");
    await authorize(context);
    if(current.job.audit.filter(e=>e.type==="DOWNLOAD_AUTHORIZED").length>=MAX_DOWNLOAD_AUDITS)
      return fail("COLLECTION_EXPORT_DOWNLOAD_BUDGET_EXCEEDED");
    // A durable, metadata-only access audit must commit before bytes escape.
    current=await write(audit(current.job,"DOWNLOAD_AUTHORIZED",iso(),
      current.job.rowCount,Buffer.byteLength(current.job.csv,"utf8")),current.revision);
    await authorize(context);
    if(clock()>=Date.parse(current.job.expiresAt))
      return fail("COLLECTION_EXPORT_EXPIRED");
    return {contractVersion:"0.1.0" as const,jobId,
      fileName:"business-dictionaries-export.csv",
      mediaType:"text/csv;charset=utf-8" as const,
      content:current.job.csv!};
  }
  return {request,status,run,download};
}
