import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import postgres from "postgres";
import {
  createPostgresAgentDurabilityProofV020
} from "../../dist/agents/enterprise-agent/pa02a-postgres-durability-proof.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const scope={
  principalSubjectId:"pa02a-test-human",
  principalActorType:"HUMAN",
  contextKind:"ENTERPRISE",
  contextId:"enterprise:pa02a-test",
  enterpriseId:"pa02a-tenant"
};
function sha(value){return createHash("sha256").update(JSON.stringify(value)).digest("hex");}
function event(runId){
 return {contractVersion:"0.1.0",eventId:"ev:"+randomUUID(),runId,
  type:"RUN_CREATED",occurredAt:"2026-10-11T00:00:00.000Z",
  payload:{principalSubjectId:scope.principalSubjectId,
    principalActorType:scope.principalActorType,
    context:{contractVersion:"0.1.0",kind:"ENTERPRISE",contextId:scope.contextId,enterpriseId:scope.enterpriseId},
    sourceInteractionId:"thread:pa02a",sourceActionId:"test",
    input:{message:"test",conversationHistory:[],locale:"en",providerId:"test",modelId:"fixture"}}};
}
function claim(turn,payload={a:1,b:2}) {
 return {scope,threadId:"thread:pa02a",clientTurnId:turn,
  taskDigest:sha({identity:"same",turn}),taskPayload:payload,created:event("run:"+randomUUID())};
}
function receipt(id,idem="dedup-id"){
 return {scope,receipt:{receiptId:id,invocationId:"invocation:"+id,
  idempotencyKey:idem,sourceInteractionId:"thread:pa02a",sourceActionId:"write",
  principalSubjectId:scope.principalSubjectId,principalActorType:scope.principalActorType,
  context:{contractVersion:"0.1.0",kind:"ENTERPRISE",contextId:scope.contextId,enterpriseId:scope.enterpriseId},
  toolId:"evo.capabilities.invoke.write",ownerPackageId:"app-platform",inputDigest:sha("write:same"),requestedAt:"2026-10-11T00:00:00.000Z"}};
}
test("PA02A independent async database proof: durable claim, scoped reads, races, and receipt CAS",{
 skip: !url ? "Requires explicitly disposable PA02A_PROOF_DATABASE_URL" : false
},async()=>{
 const schema="agent_pa02a_"+randomUUID().replaceAll("-","").slice(0,17);
 const admin=postgres(url,{max:2});
 let left,right;
 try{
  left=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
  right=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
  const candidates=Array.from({length:32},()=>claim("initial-turn"));
  const outcomes=await Promise.all(candidates.map((req,i)=>(i%2?right:left).claimTurn(req)));
  assert.equal(outcomes.filter(x=>x.created).length,1);
  assert.equal(new Set(outcomes.map(x=>x.runId)).size,1);
  const original=outcomes[0].runId;
  const replay=await right.claimTurn(claim("initial-turn",{b:2,a:1}));
  assert.equal(replay.created,false);
  assert.equal(replay.runId,original);

  await assert.rejects(
   left.claimTurn(claim("initial-turn",{a:9,b:2})),
   /CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED/
  );
  const unauthorized={...scope,principalSubjectId:"someone-else"};
  assert.equal(await left.getByTurn({
   scope:unauthorized,threadId:"thread:pa02a",clientTurnId:"initial-turn"
  }),undefined);

  for(let i=1;i<=131;i++)await left.claimTurn(claim("turn-"+i));
  const originalAfter131=await right.getByTurn({
   scope,threadId:"thread:pa02a",clientTurnId:"initial-turn"
  });
  assert.equal(originalAfter131.runId,original);

  const started=await left.listRunEvents({scope,runId:original});
  assert.equal(started.length,1);
  assert.equal(started[0].type,"RUN_CREATED");

  const eventOk={contractVersion:"0.1.0",eventId:"run-success:"+randomUUID(),
    runId:original,type:"RUN_SUCCEEDED",occurredAt:"2026-10-11T00:01:00.000Z",
    payload:{message:"complete"}};
  const advanced=await left.appendRunEvent({scope,runId:original,expectedRevision:0,event:eventOk});
  assert.equal(advanced.revision,1);
  await assert.rejects(
   right.appendRunEvent({scope,runId:original,expectedRevision:0,event:{
    ...eventOk,eventId:"other:"+randomUUID()
   }}),
   /PA02A_RUN_REVISION_CONFLICT/
  );
  const ordered=await right.listRunEvents({scope,runId:original});
  assert.deepEqual(ordered.map(x=>x.type),["RUN_CREATED","RUN_SUCCEEDED"]);

  const starts=await Promise.all(Array.from({length:32},(_,i)=>
   (i%2?right:left).beginReceipt(receipt("receipt:"+i))));
  assert.equal(starts.filter(x=>x.created).length,1);
  assert.equal(new Set(starts.map(x=>x.receiptId)).size,1);
  const receiptId=starts[0].receiptId;
  await assert.rejects(left.beginReceipt({
   ...receipt("receipt:different"),receipt:{...receipt("receipt:different").receipt,inputDigest:sha("different")}
  }),/PA02A_RECEIPT_IDEMPOTENCY_CONFLICT/);

  const terminals=await Promise.all(Array.from({length:32},(_,i)=>
   (i%2?right:left).completeReceipt({scope,receiptId,status:"SUCCEEDED"})));
  assert.equal(terminals.filter(x=>x.transitioned).length,1);
  await assert.rejects(left.completeReceipt({scope,receiptId,status:"FAILED"}),/PA02A_RECEIPT_TERMINAL_CONFLICT/);
  assert.equal((await left.getReceipt({scope,receiptId})).status,"SUCCEEDED");
  assert.equal(await right.getReceipt({scope:unauthorized,receiptId}),undefined);

  await left.close();left=undefined;
  await right.close();right=undefined;
  const reopened=await createPostgresAgentDurabilityProofV020({connectionString:url,schema});
  left=reopened;
  assert.equal((await reopened.getByTurn({scope,threadId:"thread:pa02a",clientTurnId:"initial-turn"})).runId,original);
  assert.deepEqual((await reopened.listRunEvents({scope,runId:original})).map(x=>x.type),
   ["RUN_CREATED","RUN_SUCCEEDED"]);
  assert.equal((await reopened.getReceipt({scope,receiptId})).status,"SUCCEEDED");
  console.log("PA02A_POSTGRES_ISOLATED_PROOF="+JSON.stringify({
   status:"PASS",concurrentTurns:32,turnsBeyond100:131,turnIdempotent:true,
   scopeIsolation:true,revisionCAS:true,receiptConcurrentBegins:32,
   receiptConcurrentTerminals:32,postgresRestartRecovery:true,
   productionUsed:false,serverAdapterEnabled:false
  }));
 }finally{
  if(left)await left.close();
  if(right)await right.close();
  await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');
  await admin.end();
 }
});
