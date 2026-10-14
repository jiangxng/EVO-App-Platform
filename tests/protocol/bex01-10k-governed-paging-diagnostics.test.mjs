import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { createCounterpartyProjectionServiceV010 } from "../../dist/apps/counterparty/projection-service.js";
import { COUNTERPARTY_SUPPLIER_PROJECTION_V010 } from "../../dist/apps/counterparty/projections.js";

test("BEX-01 governed 10k suppliers report bounded returned pages and measured service cost",async()=>{
 const contextId="enterprise-context:bex01-10k";
 const subjects=Array.from({length:10000},(_,i)=>({
   contractVersion:"0.1.0",counterpartyId:"bex-"+String(i).padStart(5,"0"),
   code:"S"+String(i).padStart(5,"0"),
   displayName:"Supplier "+String(i).padStart(5,"0"),
   status:"ACTIVE",subjectType:"ORGANIZATION",email:"hidden@example.test"
 }));
 const roles=subjects.map(x=>({counterpartyId:x.counterpartyId,roleCode:"SUPPLIER"}));
 let listCalls=0,authorizationChecks=0;
 const service=createCounterpartyProjectionServiceV010({
   repository:{list(){listCalls++;return subjects;}},
   roleRepository:{list:()=>roles},
   responsibilityRepository:{list:()=>[]},
   resolveAuthorizationProvider:()=>({
     async check(request){
       authorizationChecks++;
       if(request.resource.type==="counterparty.field")
         return {allowed:["displayName","code"].includes(request.resource.id)};
       return {allowed:true};
     }
   }),
   fieldIds:()=>["displayName","code","status","email"]
 });
 const context={
   contractVersion:"0.1.0",
   principal:{contractVersion:"0.1.0",subjectId:"bex-load",actorType:"HUMAN",
    identityProviderId:"test",sessionId:"bex-load"},
   scope:{contractVersion:"0.1.0",enterpriseId:"bex-load",userId:"bex-load"},
   context:{contractVersion:"0.1.0",activeContext:{
     contractVersion:"0.1.0",kind:"ENTERPRISE",
     enterpriseId:"bex-load",contextId
   }},
   correlationId:"bex01-10k"
 };
 const durations=[];
 let previousIndex=-1;
 for(const page of [0,1,399,400]){
   const started=performance.now();
   const result=await service.read({
     contextId,projectionId:COUNTERPARTY_SUPPLIER_PROJECTION_V010,
     requestContext:context,enterpriseRelationshipKind:"OWNER",
     query:{page,pageSize:25,sort:"code",direction:"asc"}
   });
   durations.push(Number((performance.now()-started).toFixed(1)));
   assert.equal(result.count,10000);
   assert.equal(result.pageInfo.total,10000);
   assert.ok(result.counterparties.length<=25);
   assert.ok(result.counterparties.every(x=>!Object.hasOwn(x,"email")
      && !Object.hasOwn(x,"status")));
   if(page===0||page===1||page===399){
     assert.equal(result.counterparties.length,25);
     const index=Number(result.counterparties[0].code.slice(1));
     assert.ok(index>previousIndex);
     previousIndex=index;
   }else assert.equal(result.counterparties.length,0);
 }
 assert.equal(listCalls,4,"one authoritative collection read per request");
 assert.ok(authorizationChecks>=40000,"full owner ACL enforced before each page");
 const source=readFileSync("manager/server.ts","utf8");
 const scoped=source.slice(source.indexOf('source === COUNTERPARTY_DIRECTORY_PAGE_SOURCE'));
 const projectionPos=scoped.indexOf("if (projectionId) {");
 const eagerPos=scoped.indexOf("const allCounterparties =");
 assert.ok(projectionPos>=0&&eagerPos>projectionPos,
   "Host must not duplicate full ACL scan before projection read");
 const sorted=[...durations].sort((a,b)=>a-b);
 const summary={records:10000,samples:durations,
   maxMs:sorted.at(-1),p95Ms:sorted[Math.ceil(sorted.length*.95)-1],
   memoryHeapMb:Number((process.memoryUsage().heapUsed/1024/1024).toFixed(1)),
   listCalls,authorizationChecks,returnedRowsMaximum:25,
   caveat:"in-memory synthetic Owner; NOT persistent DB or production latency"};
 console.log("BEX01_10K_QUERY_DIAGNOSTICS="+JSON.stringify(summary));
});
