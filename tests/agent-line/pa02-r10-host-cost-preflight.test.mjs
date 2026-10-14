import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import postgres from "postgres";
import {createPostgresHostAsyncReadExecutionV030} from
  "../../dist/manager/agent-async-read-worker-runtime.js";
import {createPa02IsolatedPostgresCostLedgerV010} from
  "../../dist/agents/enterprise-agent/pa02-r10-postgres-cost-reservation.js";
import {createPersonalAgentRunActionHandlersV010} from
  "../../dist/agents/enterprise-agent/run-action-handlers.js";
import {createAgentRunStoreV010,createMemoryAgentRunEventStoreV010} from
  "../../dist/manager/agent-run-store.js";

const url=process.env.PA02A_PROOF_DATABASE_URL;
const principal={contractVersion:"0.1.0",subjectId:"pa02-r10-preflight-human",
 actorType:"HUMAN",identityProviderId:"fixture"};
const context={contractVersion:"0.1.0",
 personalContext:{contractVersion:"0.1.0",kind:"PERSONAL",
  contextId:"personal:pa02-r10-preflight-human",ownerSubjectId:principal.subjectId},
 activeContext:{contractVersion:"0.1.0",kind:"PERSONAL",
  contextId:"personal:pa02-r10-preflight-human"}};
const scope={principalSubjectId:principal.subjectId,principalActorType:"HUMAN",
 contextKind:"PERSONAL",contextId:context.activeContext.contextId};
const price={contractVersion:"0.1.0",approvalId:"SYNTHETIC_PA02_TEST_ONLY",
 pricingVersion:"unapproved-test-version",currency:"USD",
 providerId:"pa02:synthetic-provider",modelId:"test-bounded",
 runLimitMicros:170,maxBillableInputTokens:100,maxBillableOutputTokens:20,
 worstInputMicrosPerMillion:1000000,worstOutputMicrosPerMillion:2000000};
const cmd=(code,values,actionId)=>({
 contractVersion:"0.1.0",type:"command",command:{code,inputVersion:"0.1.0"},
 values,sourceInteractionId:"pa02-r10-test-preflight",actionId,requiresConfirmation:false
});
function handlers(runtime,provider,catalog){
 return new Map(createPersonalAgentRunActionHandlersV010({
  runStore:createAgentRunStoreV010({
   eventStore:createMemoryAgentRunEventStoreV010(),eventId:randomUUID
  }),runExecutor:{resume(){throw Error("OLD_EXECUTOR_FORBIDDEN")}},
  asyncRunRuntime:runtime,
  resolveLlmProvider:()=>({installedProviderIds:[provider.providerId],provider}),
  resolveIdentitySession:()=>({contractVersion:"0.1.0",principal}),
  resolveContext:()=>context,createToolCatalog:catalog,runId:randomUUID,
  now:()=>new Date()
 }).map(x=>[x.commandCode,x]));
}
// Synthetic ONLY: assert the quote receives the fully assembled request,
 // including system/developer messages and the Host-imposed output limit.
 // This fixture is NOT an actual billed-token count from a real supplier.
const syntheticFullRequestQuote=async request=>{
 assert.equal(request.maxOutputTokens,price.maxBillableOutputTokens);
 assert.ok(request.messages.some(x=>x.role==="system"&&x.content.length>100));
 assert.ok(request.messages.some(x=>x.role==="developer"&&x.content.length>100));
 return 75;
};
const emptyCatalog=()=>({list:()=>[],async invoke(){
 throw Error("UNEXPECTED_BUSINESS_WRITE");
}});
test("PA02 R10 actual Host Run: pre-inference PostgreSQL monetary reserve prevents second model request and survives restart",{
 skip:!url?"Requires disposable PG18":false,timeout:90000
},async()=>{
 const schema="pa02_cost_host_"+randomUUID().replaceAll("-","").slice(0,10);
 const admin=postgres(url,{max:2});let runtime,ledger,calls=0,reads=0;
 const provider={providerId:price.providerId,modelId:price.modelId,
  async infer(r){
   calls++;
   assert.equal(r.maxOutputTokens,price.maxBillableOutputTokens,
    "Host passes approved output cap to Provider adapter");
   if(calls>1)throw Error("SECOND_MODEL_MUST_HAVE_BEEN_BLOCKED");
   return{contractVersion:"0.1.0",providerId:this.providerId,
    modelId:this.modelId,text:"",finishReason:"tool_calls",
    toolCalls:[{name:"proof_read",arguments:{}}],
    usage:{inputTokens:25,outputTokens:5}};
  }};
 const catalog=()=>({
  list:()=>[{contractVersion:"0.1.0",id:"proof.read",modelName:"proof_read",
   title:"Read",description:"test only",inputSchema:{type:"object"},
   effect:"READ",ownerPackageId:"fixture"}],
  async invoke(call){reads++;return{tool:call.tool,ok:true,result:{count:reads}}}
 });
 try{
  runtime=await createPostgresHostAsyncReadExecutionV030({
   connectionString:url,schema,
   deps:{resolveProvider:()=>provider,createToolCatalog:catalog,
    testOnlyCostPolicy:price,
    testOnlyBilledInputUpperBound:syntheticFullRequestQuote}
  });
  const start=await handlers(runtime,provider,catalog).get(
   "enterprise-agent.run.start").execute(cmd("enterprise-agent.run.start",
    {message:"perform two model slices; deny second if not prepaid"},"preflight-one"));
  assert.equal(start.ok,true,JSON.stringify(start.error));
  const run=start.result.run;
  assert.equal(run.state,"BLOCKED",JSON.stringify(run.blocker));
  assert.equal(run.blocker.code,"PA02_R10_COST_BUDGET_EXHAUSTED");
  assert.equal(calls,1,"No second model inference may start");
  assert.equal(reads,1,"First READ result remains visible");
  assert.equal(run.modelUsages.length,1);
  ledger=await createPa02IsolatedPostgresCostLedgerV010({connectionString:url,schema});
  const before=await ledger.snapshot({scope,runId:run.runId});
  assert.equal(before.capMicros,"170");
  assert.equal(before.usedAndHeldMicros,"35");
  assert.equal(before.entries.length,1);
  assert.equal(before.entries[0].status,"SETTLED");
  await runtime.close();runtime=undefined;
  runtime=await createPostgresHostAsyncReadExecutionV030({
   connectionString:url,schema,
   deps:{resolveProvider:()=>provider,createToolCatalog:catalog,
    testOnlyCostPolicy:price,
    testOnlyBilledInputUpperBound:syntheticFullRequestQuote}
  });
  const after=await runtime.resume({runId:run.runId,principal,context});
  assert.equal(after.state,"BLOCKED");
  assert.equal(calls,1,"Other Host cannot bypass durable blocked state");
  console.log("PA02_R10_HOST_MONEY_PREFLIGHT="+JSON.stringify({
   providerCalls:1,secondInferenceDenied:true,pgCapMicros:170,
   conservativeSettledMicros:35,persistsAcrossHostRestart:true,
   noSupplierTariffApproved:true,productionUsed:false
  }));
 }finally{
  await ledger?.close();await runtime?.close();
  await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');
  await admin.end();
 }
});
test("PA02 R10 Host Run: provider missing usage or error holds money and forbids automatic inference retry",{
 skip:!url?"Requires disposable PG18":false,timeout:90000
},async()=>{
 const schema="pa02_cost_host_"+randomUUID().replaceAll("-","").slice(0,10);
 const admin=postgres(url,{max:2});let runtime,ledger;
 let calls=0;
 const provider={providerId:price.providerId,modelId:price.modelId,
  async infer(){
   calls++;
   if(calls===1)return{contractVersion:"0.1.0",providerId:this.providerId,
    modelId:this.modelId,text:"Provider did not return usage",
    finishReason:"stop",toolCalls:[]};
   if(calls===2)throw Error("PA02_TEST_PROVIDER_RESPONSE_LOST");
   throw Error("A BILLABLE RETRY IS FORBIDDEN");
  }};
 try{
  runtime=await createPostgresHostAsyncReadExecutionV030({
   connectionString:url,schema,
   deps:{resolveProvider:()=>provider,createToolCatalog:emptyCatalog,
    testOnlyCostPolicy:price,
    testOnlyBilledInputUpperBound:syntheticFullRequestQuote}
  });
  const start=handlers(runtime,provider,emptyCatalog).get("enterprise-agent.run.start");
  const missing=await start.execute(cmd("enterprise-agent.run.start",
   {message:"meter unknown usage safely"},"usage-unknown"));
  assert.equal(missing.ok,true);
  assert.equal(missing.result.run.state,"BLOCKED");
  assert.equal(missing.result.run.blocker.code,"PA02_R10_COST_USAGE_UNAVAILABLE");
  assert.equal(missing.result.run.modelUsages[0].status,"UNAVAILABLE");
  const ambiguous=await start.execute(cmd("enterprise-agent.run.start",
   {message:"provider response error after possibly paid inference"},"paid-err"));
  assert.equal(ambiguous.ok,true);
  assert.equal(ambiguous.result.run.state,"BLOCKED");
  assert.equal(ambiguous.result.run.blocker.code,"PA02_R10_COST_INFERENCE_UNCERTAIN");
  assert.equal(calls,2,"No 3-time retry once money may be charged");
  ledger=await createPa02IsolatedPostgresCostLedgerV010({connectionString:url,schema});
  for(const id of [missing.result.run.runId,ambiguous.result.run.runId]){
   const snap=await ledger.snapshot({scope,runId:id});
   assert.equal(snap.usedAndHeldMicros,"140");
   assert.equal(snap.entries.length,1);
   assert.equal(snap.entries[0].status,"UNKNOWN");
  }
  await runtime.close();runtime=undefined;
  runtime=await createPostgresHostAsyncReadExecutionV030({
   connectionString:url,schema,
   deps:{resolveProvider:()=>provider,createToolCatalog:emptyCatalog,
    testOnlyCostPolicy:price,
    testOnlyBilledInputUpperBound:syntheticFullRequestQuote}
  });
  const again=await runtime.resume({runId:ambiguous.result.run.runId,
   principal,context});
  assert.equal(again.state,"BLOCKED");
  assert.equal(calls,2);
  console.log("PA02_R10_HOST_UNKNOWN_CHARGE="+JSON.stringify({
   missingUsageNotFree:true,providerErrorMayBeCharged:true,
   bothHeldAfterRestart:true,noAutomaticPaidRetry:true,
   noActualVendorPricing:true,productionUsed:false
  }));
 }finally{
  await ledger?.close();await runtime?.close();
  await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');
  await admin.end();
 }
});
test("PA02 R10 Host rejects synthetic tariff/provider mismatch before inference",{
 skip:!url?"Requires disposable PG18":false,timeout:90000
},async()=>{
 const schema="pa02_cost_host_"+randomUUID().replaceAll("-","").slice(0,10);
 const admin=postgres(url,{max:2});let runtime,calls=0;
 const provider={providerId:"not-approved",modelId:"unapproved-model",
  async infer(){calls++;throw Error("PROVIDER_MUST_NOT_BE_CALLED");}};
 try{
  runtime=await createPostgresHostAsyncReadExecutionV030({
   connectionString:url,schema,
   deps:{resolveProvider:()=>provider,createToolCatalog:emptyCatalog,
    testOnlyCostPolicy:price,
    testOnlyBilledInputUpperBound:syntheticFullRequestQuote}
  });
  const start=await handlers(runtime,provider,emptyCatalog).get(
   "enterprise-agent.run.start").execute(cmd("enterprise-agent.run.start",
    {message:"deny mismatched provider before any paid request"},"unapproved"));
  assert.equal(start.ok,true,JSON.stringify(start.error));
  assert.equal(start.result.run.state,"BLOCKED");
  assert.equal(start.result.run.blocker.code,
   "PA02_R10_COST_PROVIDER_NOT_APPROVED");
  assert.equal(calls,0);
  console.log("PA02_R10_HOST_TARIFF_IDENTITY_DENIED="+JSON.stringify({
   mismatchedProviderDeniedBeforeInfer:true,calls:0,
   noActualVendorPricing:true,productionUsed:false
  }));
 }finally{
  await runtime?.close();
  await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');
  await admin.end();
 }
});

test("PA02 R10: absent, malformed or oversized full-request quote blocks BEFORE any cost reservation or Provider infer",{
 skip:!url?"Requires disposable PG18":false,timeout:90000
},async()=>{
 const schema="pa02_cost_host_"+randomUUID().replaceAll("-","").slice(0,10);
 const admin=postgres(url,{max:2});
 let runtime,ledger,calls=0,quoteSeen=0;
 const provider={providerId:price.providerId,modelId:price.modelId,
  async infer(){calls++;throw Error("QUOTE_GUARD_BYPASSED");}};
 try{
  runtime=await createPostgresHostAsyncReadExecutionV030({
   connectionString:url,schema,
   deps:{resolveProvider:()=>provider,createToolCatalog:emptyCatalog,
    testOnlyCostPolicy:price,
    testOnlyBilledInputUpperBound:async request=>{
     quoteSeen++;
     assert.ok(request.messages.some(m=>m.role==="system"));
     assert.ok(request.messages.some(m=>m.role==="developer"));
     assert.ok(request.messages.some(m=>m.role==="user"));
     assert.equal(request.maxOutputTokens,20);
     return quoteSeen===1?undefined:quoteSeen===2?101:NaN;
    }}
  });
  const start=handlers(runtime,provider,emptyCatalog).get("enterprise-agent.run.start");
  const runIds=[];
  for(let i=1;i<=3;i++){
   const result=await start.execute(cmd("enterprise-agent.run.start",
    {message:"entire request must be checked before billing"},
    "quote-denied-"+i));
   assert.equal(result.ok,true,JSON.stringify(result.error));
   assert.equal(result.result.run.state,"BLOCKED");
   assert.equal(result.result.run.blocker.code,
    "PA02_R10_COST_INPUT_UPPER_BOUND_UNVERIFIED");
   runIds.push(result.result.run.runId);
  }
  assert.equal(quoteSeen,3);
  assert.equal(calls,0,"unverified full request must never hit billable model");
  ledger=await createPa02IsolatedPostgresCostLedgerV010({connectionString:url,schema});
  for(const runId of runIds){
   const snap=await ledger.snapshot({scope,runId});
   assert.equal(snap.entries.length,0,"no fictional charge held before a request");
   assert.equal(snap.capMicros,undefined);
  }
  console.log("PA02_R10_REAL_REQUEST_BOUND_REQUIRED="+JSON.stringify({
   fullRequestMaterializedBeforeInputQuote:true,
   absentOversizeMalformedQuoteRejected:true,providerCalls:0,
   noSpuriousMonetaryReservations:true,syntheticQuoteOnly:true,
   productionUsed:false
  }));
 }finally{
  await ledger?.close();await runtime?.close();
  await admin.unsafe('DROP SCHEMA IF EXISTS "'+schema+'" CASCADE');
  await admin.end();
 }
});
