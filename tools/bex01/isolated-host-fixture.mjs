#!/usr/bin/env node
/**
 * BEX-01 disposable, in-memory-on-disk enterprise fixture. No production data.
 * Reuses the same host+install+import commands as existing PA-01 browser proof.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { createPersonalAgentExperienceProfileV010 } from "../../dist/manager/local-experience-profile.js";
import { COUNTERPARTY_SUPPLIERS_PAGE_SOURCE, COUNTERPARTY_SUPPLIERS_ROUTE } from "../../dist/apps/counterparty/constants.js";

const artifact=resolve("artifacts/bex01-browser");
mkdirSync(artifact,{recursive:true});
const temp=mkdtempSync(join(tmpdir(),"bex01-browser-"));
const port=41353,hostUrl="http://127.0.0.1:"+port;
const profile=createPersonalAgentExperienceProfileV010({
 ...process.env,
 PORT:String(port),
 APP_PLATFORM_EXPERIENCE_SUBJECT_ID:"bex01-isolated-operator",
 APP_PLATFORM_STATE_FILE:join(temp,"state.json"),
 APP_PLATFORM_ENTERPRISE_GOVERNANCE_FILE:join(temp,"governance.json"),
 APP_PLATFORM_ENTERPRISE_RESOURCES_FILE:join(temp,"resources.json"),
 APP_PLATFORM_MANAGED_SESSION_ENABLED:"false",
 APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED:"false",
 APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED:"false",
 NODE_ENV:"test",LOG_LEVEL:"silent"
});
let hostLog="",closed=false;
const child=spawn(process.execPath,["dist/manager/server.js"],{
 env:profile.environment,stdio:["ignore","pipe","pipe"]
});
child.stdout.on("data",part=>{hostLog+=String(part);process.stdout.write("[HOST] "+part);});
child.stderr.on("data",part=>{hostLog+=String(part);process.stderr.write("[HOST_ERR] "+part);});
async function shutdown(){
 if(closed)return;
 closed=true;
 writeFileSync(join(artifact,"host.log"),hostLog.slice(-500000));
 if(child.exitCode===null)child.kill("SIGTERM");
 rmSync(temp,{recursive:true,force:true});
}
for(const signal of ["SIGINT","SIGTERM"]){
 process.on(signal,()=>void shutdown().then(()=>process.exit(0)));
}
process.on("exit",()=>{if(!closed)child.kill("SIGTERM");});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function request(path,method="GET",payload,contextId){
 const response=await fetch(hostUrl+path,{
  method,headers:{accept:"application/json",
   ...(payload?{"content-type":"application/json"}:{}),
   ...(contextId?{"x-evo-context-id":contextId}:{})},
  ...(payload?{body:JSON.stringify(payload)}:{})
 });
 const raw=await response.text();
 let value;try{value=JSON.parse(raw);}catch{value={raw:raw.slice(0,600)};}
 return {status:response.status,value};
}
async function execute(command,values,ctx,requiresConfirmation=false){
 const output=await request("/v1/actions","POST",{
  contractVersion:"0.1.0",type:"command",
  command:{code:command,inputVersion:"0.1.0"},
  values,sourceInteractionId:"bex01-disposable-host",actionId:command,requiresConfirmation
 },ctx);
 assert.equal(output.status,200,JSON.stringify({command,output}).slice(0,1600));
 assert.equal(output.value.ok,true,JSON.stringify({command,output}).slice(0,1600));
 return output.value.result;
}
try{
 let ready=false;
 for(let n=0;n<120;n++){
  if(child.exitCode!==null)throw Error("BEX01_HOST_EXIT_"+child.exitCode);
  try{
   const health=await request("/health");
   if(health.status===200&&health.value.ok){ready=true;break;}
  }catch{}
  await sleep(250);
 }
 assert.ok(ready,"BEX01_HOST_NOT_READY");
 const created=await execute("enterprise.context.create",{
   displayName:"Isolated Supplier Browser Acceptance",code:"BEX01_BROWSER_ISOLATED"
 },undefined,true);
 const contextId=created?.context?.contextId??created?.contextId;
 assert.ok(contextId,"BEX01_CONTEXT_MISSING");
 for(const packageId of ["evo-counterparty","evo-data-import"]){
   const outcome=await request("/v1/install","POST",{packageId});
   assert.equal(outcome.status,200,JSON.stringify({packageId,outcome}).slice(0,1500));
   assert.ok(outcome.value.snapshot?.installedPackages?.some(x=>x.packageId===packageId),"BEX01_INSTALL_FAILED_"+packageId);
 }
 const lines=["往来编码,往来名称,主体类型"];
 for(let index=1;index<=53;index++){
  const no=String(index).padStart(4,"0");
  lines.push("S"+no+",Supplier "+no+",ORGANIZATION");
 }
 const csv=Buffer.from(lines.join("\n"),"utf8");
 const staged=await execute("data-import.stage-file",{
   targetId:"counterparty.subject",
   file:{name:"bex01-isolated-suppliers.csv",mediaType:"text/csv",
     size:csv.length,contentBase64:csv.toString("base64")},
   parameter__relationshipMode:"SUPPLIER"
 },contextId);
 const jobId=staged?.job?.importJobId;
 assert.ok(jobId,"BEX01_JOB_MISSING");
 const reviewed=await execute("data-import.review",{
   importJobId:jobId,map_0:"code",map_1:"displayName",map_2:"subjectType"
 },contextId);
 assert.equal(reviewed?.job?.state,"DRY_RUN_READY");
 const committed=await execute("data-import.commit",{importJobId:jobId},contextId);
 assert.equal(committed?.job?.state,"COMMITTED");
 const query=new URLSearchParams({source:COUNTERPARTY_SUPPLIERS_PAGE_SOURCE,
   route:COUNTERPARTY_SUPPLIERS_ROUTE+"?page=0&pageSize=25"});
 const first=await request("/v1/experience-pages?"+query.toString(),"GET",undefined,contextId);
 assert.equal(first.status,200,JSON.stringify(first.value).slice(0,1800));
 assert.equal(first.value.table?.rows?.length,25,"BEX01_FIRST_PAGE_NOT_BOUNDED");
 assert.equal(first.value.table?.pageInfo?.total,53,"BEX01_NOT_ALL_SUPPLIERS_IMPORTED");
 assert.ok(first.value.actions?.some(x=>x.id==="import"),"BEX01_IMPORT_ENTRY_MISSING");
 const fixture={hostUrl,contextId,jobId,route:COUNTERPARTY_SUPPLIERS_ROUTE,
   expectedTotal:53,isolated:true,productionUsed:false};
 writeFileSync(join(artifact,"fixture.json"),JSON.stringify(fixture,null,2));
 console.log("BEX01_BROWSER_FIXTURE_READY="+JSON.stringify(fixture));
}catch(error){console.error("BEX01_BROWSER_FIXTURE_FAILED",error);await shutdown();process.exit(1);}
