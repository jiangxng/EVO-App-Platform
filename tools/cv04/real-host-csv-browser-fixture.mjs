#!/usr/bin/env node
/**
 * CV-04 nonproduction browser fixture. Spins up the ACTUAL installed EVO
 * Host/ActionRouter/Enterprise repositories; never reads Tokyo or customer data.
 * Uses the product's existing local-experience static HUMAN session.
 */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from "node:fs";
import {join,resolve} from "node:path";
import {tmpdir} from "node:os";
import {createPersonalAgentExperienceProfileV010} from "../../dist/manager/local-experience-profile.js";

const OUT=resolve("artifacts/cv04-csv-browser");
mkdirSync(OUT,{recursive:true});
const temp=mkdtempSync(join(tmpdir(),"cv04-csv-browser-"));
const port=41385,hostUrl="http://127.0.0.1:"+port;
const subjectId="cv04-local-csv-operator";
const profile=createPersonalAgentExperienceProfileV010({
 ...process.env,PORT:String(port),APP_PLATFORM_EXPERIENCE_SUBJECT_ID:subjectId,
 APP_PLATFORM_STATE_FILE:join(temp,"state.json"),
 APP_PLATFORM_ENTERPRISE_GOVERNANCE_FILE:join(temp,"governance.json"),
 APP_PLATFORM_ENTERPRISE_RESOURCES_FILE:join(temp,"resources.json"),
 APP_PLATFORM_MANAGED_SESSION_ENABLED:"false",
 APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED:"false",
 APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED:"false",
 NODE_ENV:"test",LOG_LEVEL:"silent"
});
let closed=false,log="";
const child=spawn(process.execPath,["dist/manager/server.js"],{
 env:profile.environment,stdio:["ignore","pipe","pipe"]
});
child.stdout.on("data",c=>{log+=String(c);process.stdout.write("[CV04_HOST] "+c)});
child.stderr.on("data",c=>{log+=String(c);process.stderr.write("[CV04_HOST_ERR] "+c)});
async function stop(){
 if(closed)return;closed=true;
 writeFileSync(join(OUT,"host.log"),log.slice(-400000));
 if(child.exitCode===null)child.kill("SIGTERM");
 rmSync(temp,{recursive:true,force:true});
}
for(const signal of ["SIGINT","SIGTERM"]){
 process.on(signal,()=>void stop().then(()=>process.exit(0)));
}
process.on("exit",()=>{if(!closed)child.kill("SIGTERM")});
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
async function http(path,method="GET",payload,contextId){
 const resp=await fetch(hostUrl+path,{
  method,
  headers:{
   accept:"application/json",
   ...(payload?{"content-type":"application/json"}:{}),
   ...(contextId?{"x-evo-context-id":contextId}:{})
  },
  ...(payload?{body:JSON.stringify(payload)}:{})
 });
 const body=await resp.text();
 let value;try{value=JSON.parse(body)}catch{value={raw:body.slice(0,500)}}
 return {status:resp.status,value};
}
async function execute(command,values,contextId,requiresConfirmation=false){
 const answer=await http("/v1/actions","POST",{
  contractVersion:"0.1.0",type:"command",
  command:{code:command,inputVersion:"0.1.0"},
  values,sourceInteractionId:"cv04-browser-real-host",
  actionId:command,requiresConfirmation
 },contextId);
 assert.equal(answer.status,200,JSON.stringify({command,answer}).slice(0,1200));
 assert.equal(answer.value.ok,true,JSON.stringify({command,answer}).slice(0,1500));
 return answer.value.result;
}
async function seedCounterparty(contextId,{code,displayName,role,assignee}){
 const saved=await execute("counterparty.create",{
  code,displayName,subjectType:"ORGANIZATION",
  email:"PRIVATE-"+code+"@example.invalid",
  taxIdentifier:"SECRET-"+code
 },contextId);
 const id=saved.counterpartyId;
 assert.ok(id,"CV04_CREATED_COUNTERPARTY_ID_MISSING");
 await execute("counterparty.role.assign",{counterpartyId:id,roleCode:role},contextId);
 await execute("responsibility.assign",{
  targetObjectType:"counterparty.subject",targetObjectId:id,
  responsibilityType:role==="CUSTOMER"?"SALES_OWNER":"PROCUREMENT_OWNER",
  assigneeSubjectId:assignee
 },contextId);
 return id;
}
async function getPage(source,route,contextId){
 return http("/v1/experience-pages?"+new URLSearchParams({
  source,route,locale:"zh-CN"
 }),"GET",undefined,contextId);
}
try {
 let ready=false;
 for(let n=0;n<120;n++){
  if(child.exitCode!==null)throw Error("CV04_HOST_EXIT="+child.exitCode);
  try {const answer=await http("/health");if(answer.status===200&&answer.value.ok){ready=true;break}}catch{}
  await sleep(250);
 }
 assert.ok(ready,"CV04_HOST_START_TIMEOUT");
 const created=await execute("enterprise.context.create",{
  displayName:"CV04 Isolated CSV Browser Enterprise",code:"CV04_CSV_BROWSER"
 },undefined,true);
 const contextId=created?.context?.contextId??created?.contextId;
 assert.ok(contextId,"CV04_CONTEXT_MISSING");
 for(const packageId of ["evo-counterparty","evo-responsibility","evo-business-dictionary"]){
  const answer=await http("/v1/install","POST",{packageId});
  assert.equal(answer.status,200,JSON.stringify({packageId,answer}).slice(0,1500));
  assert.ok(answer.value.snapshot?.installedPackages?.some(x=>x.packageId===packageId),
    "CV04_INSTALL_FAILED:"+packageId);
 }
 const records=[];
 for(const [role,prefix] of [["CUSTOMER","Customer"],["SUPPLIER","Supplier"]]){
  for(const [tag,assignee] of [["Alpha",subjectId],["Beta",subjectId],["Hidden","other-cv04-user"]]){
   const code=role.slice(0,1)+"_"+tag.toUpperCase();
   const name=prefix+" "+tag+" CV04";
   const id=await seedCounterparty(contextId,{code,displayName:name,role,assignee});
   records.push({id,role,tag,name,visible:assignee===subjectId});
  }
 }
 for(const [dictionaryId,name] of [
  ["cv04-a","Alpha CSV Dictionary"],
  ["cv04-b","Beta CSV Dictionary"]
 ]){
  const draft=await execute("dictionary.draft.save",{
   dictionaryId,displayName:name,expectedVersion:0,
   options:[{code:"SECRET_OPTION",label:{default:"Never Export Option"},status:"ACTIVE"}]
  },contextId);
  assert.equal(draft.data?.version,1);
  const published=await execute("dictionary.publish",{
   dictionaryId,expectedVersion:1
  },contextId,true);
  assert.equal(published.data?.state,"PUBLISHED");
 }
 // A separate real Enterprise Context owned by the same isolated test identity.
 // It proves switch-time Owner re-query, not actual production account login.
 const createdB=await execute("enterprise.context.create",{
  displayName:"CV04 Isolated Second Browser Enterprise",code:"CV04_CSV_BROWSER_B"
 },undefined,true);
 const secondaryContextId=createdB?.context?.contextId??createdB?.contextId;
 assert.ok(secondaryContextId&&secondaryContextId!==contextId,"CV04_SECOND_ENTERPRISE_MISSING");
 const secondaryNames={
  dictionary:"B-Only Dictionary CV04",
  "my-customers":"B-Only Customer CV04",
  "my-suppliers":"B-Only Supplier CV04"
 };
 await seedCounterparty(secondaryContextId,{code:"B_CUSTOMER",
  displayName:secondaryNames["my-customers"],role:"CUSTOMER",assignee:subjectId});
 await seedCounterparty(secondaryContextId,{code:"B_SUPPLIER",
  displayName:secondaryNames["my-suppliers"],role:"SUPPLIER",assignee:subjectId});
 const secondaryDraft=await execute("dictionary.draft.save",{
  dictionaryId:"cv04-b-only",displayName:secondaryNames.dictionary,
  expectedVersion:0,options:[{code:"B_SECRET_OPTION",
   label:{default:"B Private Option"},status:"ACTIVE"}]
 },secondaryContextId);
 assert.equal(secondaryDraft.data?.version,1);
 const secondaryPublished=await execute("dictionary.publish",{
  dictionaryId:"cv04-b-only",expectedVersion:1
 },secondaryContextId,true);
 assert.equal(secondaryPublished.data?.state,"PUBLISHED");
 const plans=[
  {source:"app://evo-business-dictionary/pages/directory",
   route:"/business-dictionaries?view=published&sort=displayName&page=1&pageSize=1",
   command:"dictionary.collection.page.export.csv",name:"dictionary"},
  {source:"app://evo-counterparty/pages/my-customers",
   route:"/counterparties/my-customers?sort=displayName&page=1&pageSize=1",
   command:"counterparty.collection.my-customers.page.export.csv",name:"my-customers"},
  {source:"app://evo-counterparty/pages/my-suppliers",
   route:"/counterparties/my-suppliers?sort=displayName&page=1&pageSize=1",
   command:"counterparty.collection.my-suppliers.page.export.csv",name:"my-suppliers"}
 ];
 for(const plan of plans){
  const answer=await getPage(plan.source,plan.route,contextId);
  assert.equal(answer.status,200,JSON.stringify({plan,answer}).slice(0,2200));
  assert.ok(answer.value.table?.pageInfo,"CV04_PAGE_NOT_BOUNDED:"+plan.name);
  assert.equal(answer.value.table.pageInfo.page,1,"CV04_PAGE_NOT_SECOND:"+plan.name);
  assert.equal(answer.value.table.rows.length,1,"CV04_PAGE_NOT_ONE_ROW:"+plan.name);
  assert.ok(answer.value.actions?.some(x=>x.command===plan.command),"CV04_EXPORT_ACTION_MISSING:"+plan.name);
  const otherRoute=plan.route.replace("page=1","page=0");
  const second=await getPage(plan.source,otherRoute,secondaryContextId);
  assert.equal(second.status,200,"CV04_SECOND_CONTEXT_PAGE_FAILED:"+plan.name);
  assert.equal(second.value.table?.rows?.length,1,"CV04_SECOND_ENTERPRISE_ROW_MISSING:"+plan.name);
  const secondaryPayload=JSON.stringify(second.value.table.rows);
  assert.ok(secondaryPayload.includes(secondaryNames[plan.name]),
    "CV04_SECOND_ENTERPRISE_ROW_UNEXPECTED:"+plan.name);
  assert.ok(!secondaryPayload.includes("Beta CSV Dictionary")
    && !secondaryPayload.includes("Customer Beta CV04")
    && !secondaryPayload.includes("Supplier Beta CV04"),
    "CV04_SECOND_ENTERPRISE_LEAK:"+plan.name);
 }
 const data={hostUrl,contextId,secondaryContextId,secondaryNames,subjectId,isolated:true,productionUsed:false,
  sourceSha:process.env.GITHUB_SHA??"local",
  records:records.map(x=>({role:x.role,tag:x.tag,name:x.name,visible:x.visible})),
  plans};
 writeFileSync(join(OUT,"fixture.json"),JSON.stringify(data,null,2));
 console.log("CV04_REAL_HOST_CSV_BROWSER_READY="+JSON.stringify({hostUrl,contextId,plans:plans.map(x=>x.name)}));
}catch(error){
 console.error("CV04_REAL_HOST_CSV_BROWSER_FAILED",error);
 await stop();
 process.exit(1);
}
