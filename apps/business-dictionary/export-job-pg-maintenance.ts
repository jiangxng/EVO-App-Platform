import {randomUUID} from "node:crypto";
import type {
  EnterpriseResourceConditionalAsyncRepositoryV010,
  EnterpriseResourceAddressV010,
  EnterpriseResourceJsonV010
} from "../../contracts/enterprise-resource.js";
import type {DictionaryExportJobRecordV010} from "./export-jobs.js";

/**
 * CV04 restricted PostgreSQL maintenance proof. An independent, physically
 * authenticated Host SQL login discovers only expired job IDs; the existing
 * encrypted Enterprise Resource CAS writes a tombstone and an append-only
 * EXPIRED event atomically with the independent PG audit trigger.
 *
 * This is TEST ONLY and NOT a production background daemon. The privileged
 * encrypted-resource connection is NOT a signed multi-Host SQL Owner gateway.
 */
export const CV04_EXPORT_MAINTENANCE_ACTOR_V010="cv04.export-maintenance";
const NS="evo.dictionary.export-jobs",COLLECTION="bounded-csv-jobs",
  TYPE="evo.dictionary.export.job",SCHEMA="evo.dictionary.export-job/0.1.0",
  OWNER="evo-business-dictionary";
const JOB=/^exj-[a-f0-9]{48}$/u;
const MAX_BATCH=25;
const MAX_RETRIES=3;

export interface Cv04ExportDueJobAuthorityV010 {
  due(contextId:string,limit:number):Promise<{
    jobId:string;expiresAt:string
  }[]>;
  revoke(contextId:string,jobId:string):Promise<"REVOKED">;
}
export interface Cv04ExportExpiryReportV010 {
  contractVersion:"0.1.0";
  scanned:number;
  expired:number;
  skipped:number;
  conflictsRetried:number;
}

export function createIsolatedDictionaryExportPgMaintenanceV010(input:{
  resources:EnterpriseResourceConditionalAsyncRepositoryV010 & {
    readonly encryptedDictionaryExportJobs:true
  };
  leaseAuthority:Cv04ExportDueJobAuthorityV010;
  /** Context comes from a trusted Enterprise Context registry, not User input. */
  contextId:string;
  enterpriseId:string;
  isolatedTestOnly:true;
  now?:()=>Date;
}){
  if(process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true)
    throw Error("CV04_EXPORT_MAINTENANCE_PRODUCTION_DISABLED");
  if(!input.resources||input.resources.encryptedDictionaryExportJobs!==true||
    input.resources.conditionalWriteConsistency!=="SHARED_POSTGRES_TRANSACTION"||
    typeof input.resources.get!=="function"||
    typeof input.resources.putIfRevision!=="function"||
    typeof input.leaseAuthority?.due!=="function"||
    typeof input.leaseAuthority?.revoke!=="function")
    throw Error("CV04_EXPORT_MAINTENANCE_ENCRYPTED_PG_AND_SQL_HOST_REQUIRED");
  if(typeof input.contextId!=="string"||!input.contextId||
    typeof input.enterpriseId!=="string"||!input.enterpriseId)
    throw Error("CV04_EXPORT_MAINTENANCE_SCOPE_INVALID");
  const now=input.now??(()=>new Date());
  const address=(jobId:string):EnterpriseResourceAddressV010=>({
    contextId:input.contextId,namespace:NS,collectionId:COLLECTION,
    resourceType:TYPE,resourceId:jobId
  });
  async function cleanup(inputBatch:{limit?:number}={}):Promise<Cv04ExportExpiryReportV010>{
    const limit=inputBatch.limit??MAX_BATCH;
    if(!Number.isSafeInteger(limit)||limit<1||limit>MAX_BATCH)
      throw Error("CV04_EXPORT_MAINTENANCE_BATCH_INVALID");
    // Separate Host SQL LOGIN lists only due opaque IDs. Worker SQL role has
    // no EXECUTE on this function, no table read permission or encryption key.
    const discovered=await input.leaseAuthority.due(input.contextId,limit);
    if(!Array.isArray(discovered)||discovered.length>limit||
      discovered.some(x=>!x||!JOB.test(x.jobId)||
        !Number.isFinite(Date.parse(x.expiresAt)))||
      new Set(discovered.map(x=>x.jobId)).size!==discovered.length)
      throw Error("CV04_EXPORT_MAINTENANCE_DISCOVERY_INVALID");
    const report:Cv04ExportExpiryReportV010={
      contractVersion:"0.1.0",scanned:discovered.length,expired:0,
      skipped:0,conflictsRetried:0
    };
    for(const item of discovered){
      let committed=false;
      for(let attempt=0;attempt<MAX_RETRIES;attempt++){
        const found=await input.resources.get(address(item.jobId));
        if(!found||found.lifecycleState!=="ACTIVE"||
          !found.payload||found.ownerPackageId!==OWNER||
          found.schemaRef!==SCHEMA||!Number.isSafeInteger(found.revision))
          throw Error("CV04_EXPORT_MAINTENANCE_RESOURCE_INVALID");
        const job=found.payload as unknown as DictionaryExportJobRecordV010;
        if(job.contractVersion!=="0.1.0"||job.jobId!==item.jobId||
          job.contextId!==input.contextId||
          job.enterpriseId!==input.enterpriseId||
          !["HUMAN","AI","AUTOMATION","SERVICE"].includes(job.actorType)||
          !Array.isArray(job.audit))
          throw Error("CV04_EXPORT_MAINTENANCE_TENANT_OR_JOB_MISMATCH");
        if(job.state==="EXPIRED"||Date.parse(job.expiresAt)>now().getTime()){
          report.skipped++;
          committed=true;
          break;
        }
        // Must first revoke any outstanding physical SQL permit/claim, then
        // atomically transition encrypted job and audit to a redacted EXPIRED
        // tombstone. If revoke fails, never purge with active worker token.
        const revoked=await input.leaseAuthority.revoke(input.contextId,item.jobId);
        if(revoked!=="REVOKED")
          throw Error("CV04_EXPORT_MAINTENANCE_REVOKE_UNVERIFIED");
        const time=now().toISOString();
        const redacted:DictionaryExportJobRecordV010={
          ...job,state:"EXPIRED",pages:[],csv:undefined,
          csvSha256:undefined,leaseUntil:undefined,
          audit:[...job.audit,{eventId:randomUUID(),type:"EXPIRED",
            at:time,rows:0,bytes:0}]
        };
        try{
          await input.resources.putIfRevision({
            ...address(item.jobId),schemaRef:SCHEMA,
            ownerPackageId:OWNER,storageKind:"DOCUMENT",
            payload:JSON.parse(JSON.stringify(redacted)) as EnterpriseResourceJsonV010,
            actorSubjectId:CV04_EXPORT_MAINTENANCE_ACTOR_V010,
            recordedAt:time,expectedRevision:found.revision
          });
          report.expired++;
          committed=true;
          break;
        }catch(error){
          if((error as Error).message!=="ENTERPRISE_RESOURCE_REVISION_CONFLICT")
            throw error;
          report.conflictsRetried++;
        }
      }
      if(!committed)throw Error("CV04_EXPORT_MAINTENANCE_CAS_RETRY_EXHAUSTED");
    }
    return report;
  }
  return {cleanup};
}
