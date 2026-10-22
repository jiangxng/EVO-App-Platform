#!/usr/bin/env node
/**
 * BEX-01 disposable, in-memory-on-disk enterprise fixture. No production data.
 * Reuses the same host+install+import commands as existing PA-01 browser proof.
 */
import assert from "node:assert/strict";
import { syntheticV3WorkbookV010, syntheticV3VisualReviewWorkbookV010 } from "./synthetic-v3-xlsx.mjs";
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
 for(let index=1;index<=54;index++){
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
 // A second real import intentionally fails the required subjectType field.
 // Its review page must still offer an exit to the supplier workspace.
 const badRows=["往来编码,往来名称,主体类型",
   "E0101,Bad supplier 1,","E0102,Bad supplier 2,","E0103,Bad supplier 3,"];
 const badCsv=Buffer.from(badRows.join("\n"),"utf8");
 const badStaged=await execute("data-import.stage-file",{
   targetId:"counterparty.subject",
   file:{name:"bex01-bad-supplier-mapping.csv",mediaType:"text/csv",
     size:badCsv.length,contentBase64:badCsv.toString("base64")},
   parameter__relationshipMode:"SUPPLIER"
 },contextId);
 const failedJobId=badStaged?.job?.importJobId;
 assert.ok(failedJobId,"BEX01_FAILED_JOB_MISSING");
 const badReview=await execute("data-import.review",{
   importJobId:failedJobId,map_0:"code",map_1:"displayName",map_2:"subjectType"
 },contextId);
 assert.equal(badReview?.job?.state,"DRY_RUN_FAILED");
 assert.equal(badReview?.job?.dryRun?.invalidRows,3);
 const extensionRows=["往来编码,往来名称,主体类型,开户银行",
  "EXT001,Extension Field Supplier,ORGANIZATION,HSBC"];
 const extensionCsv=Buffer.from(extensionRows.join("\n"),"utf8");
 const extensionStage=await execute("data-import.stage-file",{
   targetId:"counterparty.subject",
   file:{name:"bex01-extension-supplier.csv",mediaType:"text/csv",
     size:extensionCsv.length,contentBase64:extensionCsv.toString("base64")},
   parameter__relationshipMode:"SUPPLIER"
 },contextId);
 const extensionJobId=extensionStage?.job?.importJobId;
 assert.ok(extensionJobId,"BEX01_EXTENSION_JOB_MISSING");
 // Separate real Host job for multi-column extension acceptance.
 const batchRows=["往来编码,往来名称,主体类型,默认支付方式,结算方式,默认账期方式,账期天数,系统编码",
   "BATCH001,Batch Extension Supplier,ORGANIZATION,转账,月结,月末,30,LEGACY-001"];
 const batchCsv=Buffer.from(batchRows.join("\n"),"utf8");
 const batchStaged=await execute("data-import.stage-file",{
   targetId:"counterparty.subject",
   file:{name:"bex01-batch-extensions.csv",mediaType:"text/csv",
     size:batchCsv.length,contentBase64:batchCsv.toString("base64")},
   parameter__relationshipMode:"SUPPLIER"
 },contextId);
 const batchJobId=batchStaged?.job?.importJobId;
 assert.ok(batchJobId,"BEX01_BATCH_JOB_MISSING");
 const batchPageProbe=await request("/v1/experience-pages?"+new URLSearchParams({
   source:"evo-object-extension.from-import",
   route:"/object-extensions/from-import?job="+batchJobId+"&mode=batch",
   locale:"zh-CN"
 }).toString(),"GET",undefined,contextId);
 console.log("BEX_BATCH_HOST_PAGE_PROBE="+JSON.stringify({
   status:batchPageProbe.status,body:JSON.stringify(batchPageProbe.value).slice(0,2200)
 }));
 assert.equal(batchPageProbe.status,200,"BEX_BATCH_PAGE_HOST_HTTP_FAILURE: "+JSON.stringify(batchPageProbe).slice(0,1800));
 assert.equal(batchPageProbe.value.id,"evo-object-extension.batch-import","BEX_BATCH_PAGE_OWNER_NOT_RENDERED");
 // Synthetic XLSX, not the customer's workbook: 22 original columns and
 // 172 complete spreadsheet rows with three intentionally blank subjectTypes.
 // Real Host stage-file executes the installed XLSX parser, not test model mocks.
 const synthetic=syntheticV3WorkbookV010();
 assert.equal(synthetic.headers.length,22);
 assert.equal(synthetic.rows.length,172);
 assert.deepEqual(synthetic.missingRowNumbers,[165,169,172]);
 const syntheticStaged=await execute("data-import.stage-file",{
   targetId:"counterparty.subject",
   file:{name:"BEX01-SYNTHETIC-NOT-CUSTOMER-172.xlsx",
     mediaType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
     size:synthetic.bytes.length,
     contentBase64:synthetic.bytes.toString("base64")},
   parameter__relationshipMode:"SUPPLIER"
 },contextId);
 const syntheticJobId=syntheticStaged?.job?.importJobId;
 assert.ok(syntheticJobId,"BEX01_SYNTHETIC_XLSX_JOB_MISSING");
 assert.equal(syntheticStaged.job.source.kind,"XLSX");
 assert.deepEqual(syntheticStaged.job.source.headers,synthetic.headers);
 assert.equal(syntheticStaged.job.source.rows.length,172);
 for(const rowNumber of synthetic.missingRowNumbers) {
   assert.equal(syntheticStaged.job.source.rows[rowNumber-1]["主体类型"],"",
     "Missing synthetic business identity must not be inferred from SUPPLIER");
 }
 // Every unknown column requires an explicit, reversible ignore choice.
 const mappingChoices={importJobId:syntheticJobId,
   map_0:"code",map_1:"displayName",map_2:"subjectType"};
 synthetic.headers.slice(3).forEach((_,index)=>{
   mappingChoices["map_"+(index+3)]="__IGNORE__";
 });
 const syntheticReviewed=await execute("data-import.review",
   mappingChoices,contextId);
 assert.equal(syntheticReviewed.job.state,"DRY_RUN_FAILED");
 assert.equal(syntheticReviewed.job.dryRun.totalRows,172);
 assert.equal(syntheticReviewed.job.dryRun.validRows,169);
 assert.equal(syntheticReviewed.job.dryRun.invalidRows,3);
 assert.deepEqual(syntheticReviewed.job.ignoredSourceColumns,
   synthetic.headers.slice(3));
 assert.deepEqual(syntheticReviewed.job.source.rows,syntheticStaged.job.source.rows);
 console.log("BEX01_SYNTHETIC_XLSX_172_22_3_READY="+JSON.stringify({
   jobId:syntheticJobId,kind:"XLSX",columns:22,rows:172,invalidRows:3,
   synthetic:true,productionUsed:false
 }));
  // A second genuinely separate synthetic XLSX is uploaded only *after*
 // the existing single-field, batch and corrective Chromium journeys. This
 // prevents pre-created definitions from altering those original validations.
 const retainedXlsx=syntheticV3WorkbookV010({
   codePrefix:"RET-",namePrefix:"Retained Supplier "
 });
 assert.equal(retainedXlsx.rows.length,172);
 assert.equal(retainedXlsx.headers.length,22);
 writeFileSync(join(artifact,"synthetic-retained-fields.xlsx"),retainedXlsx.bytes);
 // Dedicated #909 parity fixture: 16 valid existing targets, four proposals,
 // two unresolved source columns, and three durable subjectType row issues.
 const visual=syntheticV3VisualReviewWorkbookV010();
 assert.equal(visual.headers.length,22);
 assert.equal(visual.rows.length,172);
 const visualStaged=await execute("data-import.stage-file",{
   targetId:"counterparty.subject",
   file:{name:"BEX-V3-VISUAL-REVIEW-SYNTHETIC.xlsx",
     mediaType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
     size:visual.bytes.length,contentBase64:visual.bytes.toString("base64")},
   parameter__relationshipMode:"SUPPLIER"
 },contextId);
 const visualReviewJobId=visualStaged?.job?.importJobId;
 assert.ok(visualReviewJobId,"BEX01_VISUAL_REVIEW_JOB_MISSING");
 assert.deepEqual(visualStaged.job.source.headers,visual.headers);
 const visualChoices={importJobId:visualReviewJobId,
   map_0:"code",map_1:"displayName",map_2:"subjectType",
   map_3:"legalName",map_4:"taxIdentifier",map_5:"countryOrRegion",
   map_6:"phone",map_7:"email",map_8:"notes",
   map_9:"supplierClassification",map_10:"procurementRegion",
   map_11:"primaryContactName",map_12:"primaryContactTitle",
   map_13:"primaryContactPhone",map_14:"primaryContactEmail",
   map_15:"primaryAddressLine1",
   map_16:"__CREATE__",map_17:"__CREATE__",map_18:"__CREATE__",map_19:"__CREATE__",
   map_20:"__PENDING__",map_21:"__PENDING__"};
 const visualMapping=await execute("data-import.review",visualChoices,contextId);
 assert.ok(visualMapping?.navigateTo?.includes("mode=batch"),
   "BEX01_VISUAL_REVIEW_PROPOSALS_NOT_RETAINED");
 const visualDryRun=await execute("data-import.dry-run",{
   importJobId:visualReviewJobId
 },contextId);
 assert.equal(visualDryRun?.job?.state,"DRY_RUN_FAILED");
 assert.equal(visualDryRun?.job?.dryRun?.invalidRows,3);
 assert.deepEqual(visualDryRun.job.ignoredSourceColumns??[],[]);
 console.log("BEX01_V3_VISUAL_REVIEW_FIXTURE_READY="+JSON.stringify({
   jobId:visualReviewJobId,columns:22,rows:172,matched:16,proposed:4,
   ignored:0,issueClasses:["bank target unresolved","3 subjectType rows missing","system code unresolved"],
   synthetic:true,productionUsed:false
 }));
 const query=new URLSearchParams({source:COUNTERPARTY_SUPPLIERS_PAGE_SOURCE,
   route:COUNTERPARTY_SUPPLIERS_ROUTE+"?page=0&pageSize=25"});
 const first=await request("/v1/experience-pages?"+query.toString(),"GET",undefined,contextId);
 assert.equal(first.status,200,JSON.stringify(first.value).slice(0,1800));
 assert.equal(first.value.table?.rows?.length,25,"BEX01_FIRST_PAGE_NOT_BOUNDED");
 assert.equal(first.value.table?.pageInfo?.total,54,"BEX01_NOT_ALL_SUPPLIERS_IMPORTED");
 assert.ok(first.value.actions?.some(x=>x.id==="import"),"BEX01_IMPORT_ENTRY_MISSING");
 const fixture={hostUrl,contextId,jobId,failedJobId,extensionJobId,batchJobId,
   syntheticXlsxJobId:syntheticJobId,syntheticXlsxRows:172,syntheticXlsxColumns:22,
   syntheticXlsxMissingRows:synthetic.missingRowNumbers,visualReviewJobId,visualReviewRows:172,visualReviewColumns:22,
   retainedXlsxArtifact:"synthetic-retained-fields.xlsx",
   retainedCodePrefix:"RET-",
   retainedNamePrefix:"Retained Supplier ",
   route:COUNTERPARTY_SUPPLIERS_ROUTE,
   expectedTotal:54,isolated:true,productionUsed:false};
 writeFileSync(join(artifact,"fixture.json"),JSON.stringify(fixture,null,2));
 console.log("BEX01_BROWSER_FIXTURE_READY="+JSON.stringify(fixture));
}catch(error){console.error("BEX01_BROWSER_FIXTURE_FAILED",error);await shutdown();process.exit(1);}
