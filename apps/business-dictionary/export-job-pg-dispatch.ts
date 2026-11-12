import type {
  createIsolatedDictionaryExportSqlHostLeaseIssuerV010,
  createIsolatedDictionaryExportSqlWorkerLeaseV010
} from "./export-job-pg-sql-lease.js";

/**
 * CV04 NEXT-04: one bounded, explicitly invoked scheduler sweep, NOT a
 * production daemon or alternate queue/lease. Durable recovery derives only
 * from existing PostgreSQL job revision, Host permit and Worker epoch tables.
 *
 * No product Host/ActionRouter/Agent registers this test-only orchestrator.
 * A genuine production Host MUST prove fresh PA05/T0 relationship, grant and
 * authority epoch before authorizing every candidate. Here it is a required
 * caller-supplied isolated test callback, never an automatic allow.
 */
type Host=Pick<ReturnType<typeof createIsolatedDictionaryExportSqlHostLeaseIssuerV010>,
  "runnable"|"issue">;
type Worker=Pick<ReturnType<typeof createIsolatedDictionaryExportSqlWorkerLeaseV010>,
  "claim"|"complete">;
type Candidate=Awaited<ReturnType<Host["runnable"]>>[number];
type Lease=Awaited<ReturnType<Worker["claim"]>>;

export interface Cv04ExportDispatchReportV010 {
  contractVersion:"0.1.0";
  scanned:number;issued:number;claimed:number;
  completed:number;skipped:number;failed:number;
}

const BUSY=new Set([
  "CV04_EXPORT_SQL_DISPATCH_BUSY",
  "CV04_EXPORT_SQL_LEASE_ACTIVE_OR_EXHAUSTED",
  "CV04_EXPORT_SQL_STALE_JOB",
  "CV04_EXPORT_SQL_PERMIT_NOT_ACTIVE",
  "CV04_EXPORT_SQL_JOB_NOT_ADMISSIBLE"
]);
const isBusy=(e:unknown)=>e instanceof Error &&
  [...BUSY].some(code=>e.message.includes(code));

export function createIsolatedDictionaryExportPgDispatcherV010(input:{
  host:Host;
  workers:readonly Worker[];
  /** Trusted Context registry, never user Action payload. */
  contextId:string;
  /**
   * Fresh permission check for every discovered job. Null denies. Approval
   * and epoch MUST originate in the trusted Host, not a Worker/LLM argument.
   */
  authorizeFresh(candidate:Readonly<Candidate>):Promise<{
    approvalId:string;authorityEpoch:number;
  }|null>;
  /** ONLY existing signed CAS Owner/Worker work, never privileged raw PG DML. */
  runWork(input:{
    candidate:Readonly<Candidate>;token:string;lease:Readonly<Lease>;
    worker:Worker;
  }):Promise<"READY">;
  isolatedTestOnly:true;
}){
  if(process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true)
    throw Error("CV04_EXPORT_DISPATCH_PRODUCTION_DISABLED");
  if(!input.host||typeof input.host.runnable!=="function"||
    typeof input.host.issue!=="function"||
    !Array.isArray(input.workers)||input.workers.length<1||
    input.workers.length>4||
    input.workers.some(w=>!w||typeof w.claim!=="function"||
      typeof w.complete!=="function")||
    typeof input.contextId!=="string"||!input.contextId||
    typeof input.authorizeFresh!=="function"||
    typeof input.runWork!=="function")
    throw Error("CV04_EXPORT_DISPATCH_TRUSTED_HOST_AND_WORKERS_REQUIRED");

  async function sweep({limit=10}:{limit?:number}={}):
    Promise<Cv04ExportDispatchReportV010>{
    if(!Number.isSafeInteger(limit)||limit<1||limit>25)
      throw Error("CV04_EXPORT_DISPATCH_BATCH_INVALID");
    const candidates=await input.host.runnable(input.contextId,limit);
    if(!Array.isArray(candidates)||candidates.length>limit||
       new Set(candidates.map(x=>x.jobId)).size!==candidates.length)
      throw Error("CV04_EXPORT_DISPATCH_DISCOVERY_INVALID");
    const report:Cv04ExportDispatchReportV010={
      contractVersion:"0.1.0",scanned:candidates.length,
      issued:0,claimed:0,completed:0,skipped:0,failed:0
    };
    // Bounded concurrency per SQL worker. Multiple Host sweep processes are
    // safe because issue/claim are serialized at the existing DB job key.
    await Promise.all(input.workers.map(async(worker,index)=>{
      for(let i=index;i<candidates.length;i+=input.workers.length){
        const candidate=candidates[i];
        if(!candidate||!/^exj-[a-f0-9]{48}$/u.test(candidate.jobId)||
          !Number.isSafeInteger(candidate.expectedRevision)||
          candidate.expectedRevision<0||
          candidate.attempt<0||candidate.attempt>1||
          !candidate.enterpriseId||!candidate.subjectId||
          !["HUMAN","AI"].includes(candidate.actorType))
          throw Error("CV04_EXPORT_DISPATCH_CANDIDATE_INVALID");
        // No cached authorization: every candidate is re-evaluated.
        const decision=await input.authorizeFresh(Object.freeze({...candidate}));
        if(!decision){report.skipped++;continue;}
        if(typeof decision.approvalId!=="string"||
          decision.approvalId.length<8||decision.approvalId.length>128||
          !Number.isSafeInteger(decision.authorityEpoch)||
          decision.authorityEpoch<1)
          throw Error("CV04_EXPORT_DISPATCH_APPROVAL_INVALID");
        let token:string;
        try{
          token=await input.host.issue({
            contextId:input.contextId,jobId:candidate.jobId,
            expectedRevision:candidate.expectedRevision,
            enterpriseId:candidate.enterpriseId,subjectId:candidate.subjectId,
            actorType:candidate.actorType,approvalId:decision.approvalId,
            authorityEpoch:decision.authorityEpoch
          });
        }catch(e){if(isBusy(e)){report.skipped++;continue;}throw e;}
        report.issued++;
        let lease:Lease;
        try{lease=await worker.claim(token);}
        catch(e){if(isBusy(e)){report.skipped++;continue;}throw e;}
        if(lease.contextId!==input.contextId||
           lease.jobId!==candidate.jobId||
           lease.expectedRevision!==candidate.expectedRevision||
           lease.epoch!==candidate.attempt+1||
           !Number.isFinite(Date.parse(lease.leaseUntil)))
          throw Error("CV04_EXPORT_DISPATCH_LEASE_MISMATCH");
        report.claimed++;
        try{
          const state=await input.runWork({candidate:Object.freeze({...candidate}),
            token,lease:Object.freeze({...lease}),worker});
          if(state!=="READY")throw Error("CV04_EXPORT_DISPATCH_OWNER_NOT_READY");
          await worker.complete(token,lease.epoch);
          report.completed++;
        }catch{
          // Never mark a crashed/missing Worker DONE, revoke on its behalf, or
          // retry in RAM. The existing PostgreSQL lease expires; future scans
          // permit only one bounded, delayed epoch=2 reclaim.
          report.failed++;
        }
      }
    }));
    return report;
  }
  return {sweep};
}


/**
 * CV04 NEXT-04b: an explicitly started, disposable polling driver for the
 * EXISTING bounded SQL-backed sweep. No second queue, lease, timer registry,
 * authorization cache, or production daemon is installed.
 *
 * Stop is graceful: prevent the NEXT cycle, await the current bounded sweep,
 * never revoke its in-flight permit or claim success on behalf of a Worker.
 * A killed process cannot run cleanup; a newly created Host process starts
 * afresh by scanning the durable PostgreSQL job, permit and lease state.
 * A failed sweep rejects "done" and stops rather than looping untrusted work.
 */
export function createIsolatedDictionaryExportPgPollingV010(input:{
  dispatcher:Pick<ReturnType<typeof createIsolatedDictionaryExportPgDispatcherV010>,
    "sweep">;
  intervalMs:number;
  maxIdleIntervalMs:number;
  batchLimit?:number;
  onTick?:(result:Readonly<Cv04ExportDispatchReportV010>,
    nextDelayMs:number)=>void;
  isolatedTestOnly:true;
}){
  if(process.env.NODE_ENV!=="test"||input.isolatedTestOnly!==true)
    throw Error("CV04_EXPORT_POLL_PRODUCTION_DISABLED");
  if(!input.dispatcher||typeof input.dispatcher.sweep!=="function"||
    !Number.isSafeInteger(input.intervalMs)||
    input.intervalMs<20||input.intervalMs>60000||
    !Number.isSafeInteger(input.maxIdleIntervalMs)||
    input.maxIdleIntervalMs<input.intervalMs||
    input.maxIdleIntervalMs>60000||
    (input.batchLimit!==undefined&&
      (!Number.isSafeInteger(input.batchLimit)||
        input.batchLimit<1||input.batchLimit>25))||
    (input.onTick!==undefined&&typeof input.onTick!=="function"))
    throw Error("CV04_EXPORT_POLL_CONFIG_INVALID");
  let started=false,stopping=false,done:Promise<void>|undefined;
  let timer:ReturnType<typeof setTimeout>|undefined;
  let wake:()=>void=()=>{};
  let ticks=0,consecutiveIdle=0;
  const sleep=(ms:number)=>new Promise<void>(resolve=>{
    wake=()=>{
      if(timer!==undefined)clearTimeout(timer);
      timer=undefined;wake=()=>{};resolve();
    };
    timer=setTimeout(wake,ms);
  });
  async function loop(){
    try{
      while(!stopping){
        const report=await input.dispatcher.sweep({
          limit:input.batchLimit??10
        });
        ticks++;
        const idle=report.claimed===0&&report.issued===0;
        consecutiveIdle=idle?Math.min(consecutiveIdle+1,20):0;
        const delay=idle?Math.min(input.maxIdleIntervalMs,
          input.intervalMs*2**Math.min(consecutiveIdle-1,20)):
          input.intervalMs;
        input.onTick?.(Object.freeze({...report}),delay);
        if(!stopping)await sleep(delay);
      }
    }finally{
      stopping=true;
      wake();
    }
  }
  function start():{done:Promise<void>;stop:()=>Promise<void>;
    status:()=>{running:boolean;stopping:boolean;ticks:number}}{
    if(started)throw Error("CV04_EXPORT_POLL_ALREADY_STARTED");
    started=true;
    done=loop();
    return {
      done,
      stop:async()=>{
        stopping=true;
        wake();
        await done;
      },
      status:()=>({running:started&&!stopping,
        stopping,ticks})
    };
  }
  return {start};
}
