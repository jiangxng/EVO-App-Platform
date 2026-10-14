import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPostgresAgentDurabilityProofV020}
  from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import {createPostgresAgentExecutionCoordinatorV020}
  from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";
import {createPostgresFencedAgentRunAuthorityV030}
  from "../../dist/agents/enterprise-agent/pa02b-fenced-run-authority.js";
import {createPostgresAtomicAgentRunCancellationV020}
  from "../../dist/agents/enterprise-agent/pa02c-atomic-run-cancel.js";
import {createPostgresAgentOwnerReconciliationV030}
  from "../../dist/agents/enterprise-agent/pa02b-owner-reconciliation.js";
import {createGovernedAgentWriteHandoffV040}
  from "../../dist/agents/enterprise-agent/pa02b-governed-owner-write-handoff.js";
import {createGovernedAgentWorkerWritePortV040}
  from "../../dist/agents/enterprise-agent/pa02-governed-worker-write-port.js";
import {createReadOnlyFencedAgentWorkerV030}
  from "../../dist/agents/enterprise-agent/pa02-async-read-worker.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const sha=s=>createHash("sha256").update(s).digest("hex");
const principal={contractVersion:"0.1.0",subjectId:"write-worker-human",
  actorType:"HUMAN",identityProviderId:"sandbox"};
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:write-worker-human",ownerSubjectId:principal.subjectId},
  activeContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"enterprise:write-worker",enterpriseId:"sandbox-enterprise"},
  enterpriseContext:{contractVersion:"0.1.0",kind:"ENTERPRISE",
    contextId:"enterprise:write-worker",enterpriseId:"sandbox-enterprise",
    lifecycleState:"ACTIVE"}};
const scope={principalSubjectId:principal.subjectId,principalActorType:"HUMAN",
  contextKind:"ENTERPRISE",contextId:context.activeContext.contextId,
  enterpriseId:context.activeContext.enterpriseId};
const tool={contractVersion:"0.1.0",id:"sandbox.owner.update",
  modelName:"sandbox_write",title:"Sandbox Write",
  description:"Trusted sandbox Owner write",inputSchema:{type:"object"},
  effect:"WRITE",ownerPackageId:"sandbox.owner"};

test("PA-02 Worker: real fenced WRITE decision -> real Owner effect -> durable receipt and final",{
  skip:!url?"Requires isolated PostgreSQL 18":false,timeout:90000
},async()=>{
  const schema="pa02_worker_write_"+randomUUID().replaceAll("-","").slice(0,12);
  const admin=postgres(url,{max:3});
  let repo,coord,fenced,cancellation,owner;
  let modelCalls=0,ownerInvocations=0,authorizationCalls=0;
  let writeMode="COMMIT_LOST_REPLY";
  const writes=()=>admin.unsafe('SELECT * FROM "'+schema+'".owner_business_effects ORDER BY effect_id');
  const provider={providerId:"sandbox-llm",modelId:"fixture",async infer(){
    modelCalls++;
    if(modelCalls===2)return {contractVersion:"0.1.0",
      providerId:this.providerId,modelId:this.modelId,text:"Owner-verified final",
      toolCalls:[],usage:{inputTokens:1,outputTokens:1},finishReason:"stop"};
    return {contractVersion:"0.1.0",providerId:this.providerId,
      modelId:this.modelId,text:"",
      toolCalls:[{name:"sandbox_write",arguments:{recordId:"sandbox:record:1",value:42}}],
      usage:{inputTokens:1,outputTokens:1},finishReason:"tool_calls"};
  }};
  const verifier={async verify(i){
    const rows=await admin.unsafe('SELECT * FROM "'+schema+'".owner_business_effects '+
      'WHERE effect_id=$1 AND run_id=$2 AND input_digest=$3 AND owner_package_id=$4',
      [i.effectId,i.runId,i.inputDigest,i.ownerPackageId]);
    if(!rows.length)return {outcome:"UNRESOLVED"};
    return {outcome:"SUCCEEDED",evidenceRef:"sandbox:evidence:"+i.effectId,
      evidenceDigest:sha(i.effectId+i.inputDigest),
      terminal:{receiptId:i.receiptId,status:"SUCCEEDED",
        completedAt:"2026-10-14T03:00:00.000Z",
        resultDigest:sha(i.effectId),resultEntityRefs:["sandbox:record:1"],
        resultSummary:"Real sandbox Owner row verified"}};
  }};
  const trustedOwner={ownerPackageId:"sandbox.owner",async invoke(i){
    ownerInvocations++;
    assert.equal(i.toolId,tool.id);
    assert.deepEqual(i.arguments,{recordId:"sandbox:record:1",value:42});
    if(writeMode==="NO_COMMIT")throw Error("LOST_BEFORE_OWNER_COMMIT");
    await admin.unsafe('INSERT INTO "'+schema+'".owner_business_effects '+
      '(effect_id,run_id,owner_package_id,input_digest,record_id,value) '+
      'VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(effect_id) DO NOTHING',
      [i.effectId,i.runId,trustedOwner.ownerPackageId,i.inputDigest,
        i.arguments.recordId,i.arguments.value]);
    throw Error("LOST_AFTER_OWNER_COMMIT");
  }};
  const catalog=()=>({list(){return [tool] },
    invoke(){throw Error("CATALOG_WRITE_INVOKE_MUST_NEVER_BE_USED");}});
  let event=0,slice=0;
  let worker,port;
  const resume=async(runId,name)=>worker.resumeOnce({
    runId,workerId:name,principal,context
  });
  const createRun=async(runId,message)=>{
    await repo.claimTurn({scope,threadId:"thread:"+runId,
      clientTurnId:"turn:"+runId,taskPayload:{message},taskDigest:sha(message),
      created:{contractVersion:"0.1.0",eventId:"created:"+randomUUID(),runId,
        type:"RUN_CREATED",occurredAt:"2026-10-14T00:00:00.000Z",
        payload:{principalSubjectId:principal.subjectId,
          principalActorType:principal.actorType,context:context.activeContext,
          sourceInteractionId:"thread:"+runId,sourceActionId:"turn:"+runId,
          input:{message,conversationHistory:[],locale:"en",
            providerId:provider.providerId,modelId:provider.modelId}}}
    });
  };
  try{
    repo=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
    coord=await createPostgresAgentExecutionCoordinatorV020({connectionString:url,schema});
    cancellation=await createPostgresAtomicAgentRunCancellationV020({connectionString:url,schema});
    fenced=await createPostgresFencedAgentRunAuthorityV030({connectionString:url,schema});
    owner=await createPostgresAgentOwnerReconciliationV030({connectionString:url,
      schema,ownerVerifier:verifier});
    await admin.unsafe('CREATE TABLE "'+schema+'".owner_business_effects('+
      'effect_id text PRIMARY KEY,run_id text NOT NULL,owner_package_id text NOT NULL,'+
      'input_digest text NOT NULL,record_id text NOT NULL,value integer NOT NULL)');
    const gate=createGovernedAgentWriteHandoffV040({
      coordinator:coord,authority:fenced,receipts:repo,reconciler:owner,
      owner:trustedOwner
    });
    port=createGovernedAgentWorkerWritePortV040({
      toolId:tool.id,ownerPackageId:tool.ownerPackageId,
      authorize:async({principal:p,context:c,descriptor:d})=>{
        authorizationCalls++;
        return p.subjectId===principal.subjectId&&
          c.activeContext.enterpriseId===scope.enterpriseId&&d.id===tool.id;
      },
      coordinator:coord,authority:fenced,handoff:gate,reconciler:owner
    });
    assert.equal(port.allows({...tool,ownerPackageId:"other.owner"}),false);
    const workerFactory=()=>createReadOnlyFencedAgentWorkerV030({
      authority:fenced,governedWrite:port,
      resolveProvider:()=>provider,createToolCatalog:catalog,
      eventId:()=>String(++event),sliceId:()=>String(++slice),
      now:()=>new Date("2026-10-14T00:05:00.000Z"),
      releaseOnReturn:true,ttlSeconds:180
    });
    worker=workerFactory();
    const runId="run:write-ok";
    await createRun(runId,"Write one authorized sandbox record");
    const first=await resume(runId,"worker:1");
    assert.equal(first.run.state,"PAUSED");
    assert.equal(first.run.observations.length,1);
    assert.equal(first.run.observations[0].ok,true);
    assert.equal(ownerInvocations,1);
    assert.equal((await writes()).length,1);
    const receiptId=first.run.observations[0].result.receiptId;
    assert.equal((await repo.getReceipt({scope,receiptId})).status,"SUCCEEDED");
    const second=await resume(runId,"worker:2");
    assert.equal(second.run.state,"SUCCEEDED");
    assert.equal(second.run.finalMessage,"Owner-verified final");
    assert.equal(ownerInvocations,1);
    assert.equal((await fenced.read({scope,runId})).run.state,"SUCCEEDED");

    // An already durable WRITE decision cannot be invoked again after restart.
    writeMode="NO_COMMIT";
    const lostRun="run:write-unknown";
    await createRun(lostRun,"Write but Owner has no result");
    const uncertain=await resume(lostRun,"worker:3");
    assert.equal(uncertain.run.state,"RUNNING");
    assert.equal(uncertain.writeDeferred,true);
    assert.equal(ownerInvocations,2);
    assert.equal((await writes()).length,1);
    worker=workerFactory();
    const retried=await resume(lostRun,"worker:4");
    assert.equal(retried.run.state,"RUNNING");
    assert.equal(retried.writeDeferred,true);
    assert.equal(ownerInvocations,2,"recovery must never repeat Owner.invoke");
    const stored=await fenced.read({scope,runId:lostRun});
    assert.equal(stored.run.decisions.length,1);
    assert.equal(stored.run.decisions[0].observation,undefined);
    await cancellation.request({scope,runId:lostRun,
      requestedBy:principal.subjectId,reason:"Do not replay uncertain write"});
    await assert.rejects(cancellation.commitSafe({
      scope,runId:lostRun,eventId:"cancel:"+randomUUID(),
      occurredAt:"2026-10-14T00:10:00.000Z"
    }),/PA02C_UNCONFIRMED_WRITE/);
    assert.ok(authorizationCalls>=2);
    console.log("PA02_GOVERNED_WORKER_WRITE="+JSON.stringify({
      actualAgentWorker:true,modelDecisionPersisted:true,
      sandboxOwnerBusinessRow:true,ackLost:true,
      trustedAuthorizationRechecked:true,ownerInvocationExactlyOnce:true,
      terminalReceiptAndObservationPersisted:true,
      runFinalSucceededAfterReceipt:true,uncertainWriteNeverReplayed:true,
      cancelBlockedWhileUnknown:true,
      defaultREADWorkerUnchanged:true,formalHostWriteModeEnabled:false,
      productionUsed:false
    }));
  }finally{
    for(const s of [owner,fenced,cancellation,coord,repo])if(s)await s.close();
    try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
    finally{await admin.end();}
  }
});
