import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {fileURLToPath} from "node:url";
import postgres from "postgres";
import {createPostgresAgentDurabilityProofV020}
  from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";
import {createPostgresAgentExecutionCoordinatorV020}
  from "../../dist/agents/enterprise-agent/pa02b-postgres-coordination.js";
import {createPostgresFencedAgentRunAuthorityV030}
  from "../../dist/agents/enterprise-agent/pa02b-fenced-run-authority.js";
import {createReadOnlyFencedAgentWorkerV030}
  from "../../dist/agents/enterprise-agent/pa02-async-read-worker.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"cross-process-reader",actorType:"HUMAN",identityProviderId:"sandbox"};
const context={contractVersion:"0.1.0",
  personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
    contextId:"personal:cross-process-reader",ownerSubjectId:"cross-process-reader"},
  activeContext:{contractVersion:"0.1.0",kind:"PERSONAL",contextId:"personal:cross-process-reader"}};
const scope={principalSubjectId:principal.subjectId,principalActorType:principal.actorType,
  contextKind:"PERSONAL",contextId:context.activeContext.contextId};
const hash=s=>createHash("sha256").update(s).digest("hex");

async function childWorker(schema,mode) {
  const authority=await createPostgresFencedAgentRunAuthorityV030({connectionString:url,schema});
  const worker=createReadOnlyFencedAgentWorkerV030({
    authority,
    resolveProvider:()=>({
      providerId:"process.test",modelId:"local",
      async infer() {
        if(mode==="crash"){
          process.stdout.write("PA02_WORKER_MODEL_ENTERED\n",()=>{
            process.kill(process.pid,"SIGKILL");
          });
          await new Promise(()=>{});
        }
        return {contractVersion:"0.1.0",providerId:"process.test",
          modelId:"local",text:"recovered final",toolCalls:[],
          usage:{inputTokens:1,outputTokens:1},finishReason:"stop"};
      }
    }),
    createToolCatalog:()=>({list:()=>[],invoke:async()=>{throw Error("NO_TOOL_ALLOWED");}}),
    eventId:()=>randomUUID(),sliceId:()=>randomUUID(),ttlSeconds:300
  });
  try {
    const result=await worker.resumeOnce({runId:"run:cross-process",workerId:mode,principal,context});
    process.stdout.write("PA02_WORKER_RESULT="+JSON.stringify({
      state:result.run.state,claimed:result.claimed,advanced:result.advanced
    })+"\n");
  } finally {await authority.close();}
}

function launch(schema,mode) {
  return new Promise((resolve,reject)=>{
    const cp=spawn(process.execPath,[fileURLToPath(import.meta.url),"--process-child",schema,mode],{
      env:{...process.env},stdio:["ignore","pipe","pipe"]
    });
    let out="",err="";
    cp.stdout.on("data",chunk=>out+=chunk);
    cp.stderr.on("data",chunk=>err+=chunk);
    cp.on("error",reject);
    cp.on("close",(code,signal)=>resolve({code,signal,out,err}));
  });
}
if(process.argv[2]==="--process-child") {
  childWorker(process.argv[3],process.argv[4]).then(()=>process.exit(0),
    error=>{console.error(error);process.exit(1);});
} else {
  test("PA02 actual Node process SIGKILL during LLM decision: fenced successor resumes Run",{
    skip:!url?"Requires disposable PA02A_PROOF_DATABASE_URL":false,timeout:90000
  },async()=>{
    const schema="agent_pa02_process_"+randomUUID().replaceAll("-","").slice(0,10);
    const admin=postgres(url,{max:2});
    let repo,coordinator,authority;
    try{
      repo=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
      coordinator=await createPostgresAgentExecutionCoordinatorV020({connectionString:url,schema});
      authority=await createPostgresFencedAgentRunAuthorityV030({connectionString:url,schema});
      await repo.claimTurn({
        scope,threadId:"thread:process",clientTurnId:"client:process",taskDigest:hash("process"),
        taskPayload:{message:"return a final"},
        created:{contractVersion:"0.1.0",eventId:"created:"+randomUUID(),
          runId:"run:cross-process",type:"RUN_CREATED",occurredAt:"2026-10-13T00:00:00.000Z",
          payload:{principalSubjectId:principal.subjectId,principalActorType:principal.actorType,
            context:context.activeContext,sourceInteractionId:"thread:process",
            sourceActionId:"turn:process",input:{message:"return a final",
              conversationHistory:[],locale:"en",providerId:"process.test",modelId:"local"}}}
      });
      const killed=await launch(schema,"crash");
      assert.equal(killed.signal,"SIGKILL",killed.err);
      assert.match(killed.out,/PA02_WORKER_MODEL_ENTERED/);
      const mid=await authority.read({scope,runId:"run:cross-process"});
      assert.equal(mid.run.state,"RUNNING");
      await admin.unsafe('UPDATE "'+schema+'".pa02b_leases '+
        "SET expires_at=clock_timestamp()-interval '1 second' WHERE run_id=$1",
        ["run:cross-process"]);
      const recovered=await launch(schema,"recover");
      assert.equal(recovered.code,0,recovered.err);
      const report=JSON.parse(recovered.out.split("PA02_WORKER_RESULT=")[1].split("\n")[0]);
      assert.equal(report.state,"SUCCEEDED");
      assert.equal(report.claimed,true);
      const last=await authority.read({scope,runId:"run:cross-process"});
      assert.equal(last.run.state,"SUCCEEDED");
      assert.equal(last.run.sliceCount,1);
      assert.equal(last.run.finalMessage,"recovered final");
      const audit=await admin.unsafe('SELECT owner_id,fence FROM "'+schema+
        '".pa02b_leases WHERE run_id=$1',["run:cross-process"]);
      assert.equal(audit.length,1);
      assert.equal(audit[0].owner_id,"recover");
      assert.equal(Number(audit[0].fence),2);
      console.log("PA02_REAL_READ_WORKER_PROCESS_RECOVERY="+JSON.stringify({
        status:"PASS",processAKilled:"SIGKILL",processBRecovered:true,
        sameSliceRestored:true,staleWorkerFenced:true,
        finalRunState:"SUCCEEDED",productionWired:false,businessWriteExecuted:false
      }));
    }finally{
      for(const s of [authority,coordinator,repo])if(s)await s.close();
      try{await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');}
      finally{await admin.end();}
    }
  });
}
