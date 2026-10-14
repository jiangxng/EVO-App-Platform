#!/usr/bin/env node
/** Disposable real HTTP Host + governed SQL Owner for PA-02 R09 Chromium.
 * ONLY test-local pa02-sandbox:* identity and PostgreSQL18 schemas.
 * The normal Host/Worker/Owner source remains unchanged.
 */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import postgres from 'postgres';
import {createPersonalAgentExperienceProfileV010} from '../../dist/manager/local-experience-profile.js';
import {preparePostgresObjectExtensionOwnerSchemaV010} from '../../dist/apps/object-extension/agent-owner-postgres.js';
import {HOST_ENTERPRISE_CONTEXT_PROVIDER_ID} from '../../dist/providers/enterprise-context/package.js';

const pg=process.env.PA02A_PROOF_DATABASE_URL;
assert.ok(pg?.startsWith('postgres://'),'Disposable PostgreSQL18 required');
assert.notEqual(process.env.NODE_ENV,'production','NEVER use production');
const suffix=randomUUID().replaceAll('-','').slice(0,12);
const runSchema='pa02_browser_run_'+suffix,ownerSchema='pa02_browser_owner_'+suffix;
const temp=mkdtempSync(join(tmpdir(),'pa02-owner-http-'));
const artifact=resolve('artifacts/agent-pa02-owner-browser');
mkdirSync(artifact,{recursive:true});
const subjectId='pa02-owner-browser-human',contextId='pa02-sandbox:chromium-'+suffix;
const enterpriseId='pa02-sandbox:enterprise-'+suffix;
const hostUrl='http://127.0.0.1:41349',mockUrl='http://127.0.0.1:41350';
const now=new Date().toISOString();
const governance={
 contractVersion:'0.1.0',
 contexts:[{contractVersion:'0.1.0',kind:'ENTERPRISE',contextId,enterpriseId,
  enterpriseProviderId:HOST_ENTERPRISE_CONTEXT_PROVIDER_ID,
  displayName:'Disposable PA02 Owner Chromium Sandbox',lifecycleState:'ACTIVE',
  createdBySubjectId:subjectId,createdAt:now,attributes:{source:'isolated-pa02-fixture'}}],
 relationships:[{contractVersion:'0.1.0',relationshipId:'relationship:'+suffix,
  subjectId,contextId,kind:'OWNER',state:'ACTIVE',createdAt:now,createdBySubjectId:subjectId}],
 grants:[{contractVersion:'0.1.0',grantId:'grant:'+suffix,subjectId,contextId,
  relationship:'OWNER',state:'ACTIVE',createdAt:now,createdBySubjectId:subjectId,
  attributes:{source:'isolated-pa02-fixture'}}],
 lifecycleEvents:[{contractVersion:'0.1.0',eventId:'lifecycle:'+suffix,
  contextId,to:'ACTIVE',occurredAt:now,actorSubjectId:subjectId}],
 invitations:[],ownershipTransfers:[],relationshipEvents:[],
 defaultContexts:[{contractVersion:'0.1.0',subjectId,contextId,
  selectedAt:now,selectedBySubjectId:subjectId}]
};
const governancePath=join(temp,'governance.json');
writeFileSync(governancePath,JSON.stringify(governance,null,2));
await preparePostgresObjectExtensionOwnerSchemaV010({
 connectionString:pg,schema:ownerSchema
});
const sql=postgres(pg,{max:2});
const extensionId='pa02-sandbox:extension:browser-'+suffix;
const definition={contractVersion:'0.1.0',extensionId,
 targetObjectType:'counterparty.subject',targetSlot:'basic',
 namespace:'pa02-chromium',fieldId:'browserProof',
 semanticType:'text',valueType:'STRING',
 label:{default:'PA02 owner browser proof'},required:false,order:40,surfaces:['DETAIL']};
let mockCalls=0,child,hostLog='',closed=false;
let holdSecondOwnerTool=false,releaseHeldModel,holdingModel=false;
const json=(res,status,payload)=>{res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(payload));};
async function read(req){const chunks=[];for await(const x of req)chunks.push(x);return JSON.parse(Buffer.concat(chunks).toString()||'{}');}
const mock=createServer(async(req,res)=>{
 try {
  if(req.method==='POST'&&req.url==='/__control'){
   const x=await read(req);
   if(x.mode==='hold-owner-tool')holdSecondOwnerTool=true;
   else if(x.mode==='release'){releaseHeldModel?.();releaseHeldModel=undefined;}
   else return json(res,400,{error:'UNKNOWN_TEST_CONTROL'});
   return json(res,200,{holdingModel,holdSecondOwnerTool});
  }
  if(req.method==='GET'&&req.url==='/__report'){
   const [definitions,evidence,receipts,turns]=await Promise.all([
    sql.unsafe('SELECT extension_id FROM "'+ownerSchema+'".pa02_definitions'),
    sql.unsafe('SELECT run_id,receipt_id FROM "'+ownerSchema+'".pa02_owner_evidence'),
    sql.unsafe('SELECT status FROM "'+runSchema+'".agent_receipts'),
    sql.unsafe('SELECT run_id FROM "'+runSchema+'".agent_turns ORDER BY run_id')
   ]);
   return json(res,200,{mockCalls,definitions,evidence,receipts,turns,holdingModel});
  }
  if(req.method==='POST'&&req.url==='/v1/responses'){
   const request=await read(req),index=++mockCalls;
   if(index===1){
    if(!(request.tools??[]).some(x=>x.name==='pa02_object_extension_create'))
     return json(res,422,{error:{message:'HOST_OWNER_TOOL_NOT_AUTHORIZED'}});
    return json(res,200,{id:'pa02-owner-function-'+index,object:'response',
     model:'pa02-browser-model',status:'completed',
     output:[{type:'function_call',name:'pa02_object_extension_create',
      call_id:'pa02-owner-call-1',arguments:JSON.stringify({definition})}],
     usage:{input_tokens:17,output_tokens:12}});
   }
   if(holdSecondOwnerTool){
    holdSecondOwnerTool=false;holdingModel=true;
    await new Promise(resolve=>{releaseHeldModel=resolve});
    holdingModel=false;
    const second={...definition,extensionId:extensionId+'-cancelled',fieldId:'cancelledProof'};
    return json(res,200,{id:'pa02-owner-cancel-tool-'+index,object:'response',
     model:'pa02-browser-model',status:'completed',
     output:[{type:'function_call',name:'pa02_object_extension_create',
      call_id:'pa02-owner-cancel-'+index,arguments:JSON.stringify({definition:second})}],
     usage:{input_tokens:8,output_tokens:12}});
   }
   return json(res,200,{id:'pa02-owner-response-'+index,object:'response',
    model:'pa02-browser-model',status:'completed',
    output:[{type:'message',role:'assistant',
     content:[{type:'output_text',text:'Owner confirmed the isolated extension with durable receipt.'}]}],
    usage:{input_tokens:10,output_tokens:12}});
  }
  return json(res,404,{error:'TEST_ONLY_ENDPOINT'});
 }catch(e){json(res,500,{error:String(e)});}
});
await new Promise((resolve,reject)=>mock.listen(41350,'127.0.0.1',e=>e?reject(e):resolve()));
const profile=createPersonalAgentExperienceProfileV010({...process.env,
 NODE_ENV:'test',LOG_LEVEL:'silent',PORT:'41349',
 APP_PLATFORM_AGENT_RUN_ASYNC_WORKER_MODE:'OWNER_SANDBOX',
 APP_PLATFORM_AGENT_RUN_PA02_DEV_OWNER_ACK:'ISOLATED_NO_PRODUCTION_DATA',
 APP_PLATFORM_AGENT_RUN_ASYNC_DATABASE_URL:pg,
 APP_PLATFORM_AGENT_RUN_ASYNC_SCHEMA:runSchema,
 APP_PLATFORM_AGENT_RUN_PA02_OBJECT_SCHEMA:ownerSchema,
 APP_PLATFORM_AGENT_RUN_PA02_SANDBOX_CONTEXT_ID:contextId,
 APP_PLATFORM_AGENT_RUN_PA02_SANDBOX_ENTERPRISE_ID:enterpriseId,
 APP_PLATFORM_EXPERIENCE_SUBJECT_ID:subjectId,
 APP_PLATFORM_STATE_FILE:join(temp,'host-state.json'),
 APP_PLATFORM_ENTERPRISE_GOVERNANCE_FILE:governancePath,
 APP_PLATFORM_ENTERPRISE_RESOURCES_FILE:join(temp,'resources.json'),
 OPENAI_API_KEY:'fixture-not-real-key',OPENAI_MODEL:'pa02-browser-model',
 OPENAI_BASE_URL:mockUrl+'/v1',
 APP_PLATFORM_AUTHORIZATION_POLICY_OVERLAY_JSON:JSON.stringify({
  contractVersion:'0.1.0',rules:[{
   id:'pa02-owner-chromium-ai-only',effect:'ALLOW',
   actions:['object-extension.definition.write'],
   resourceTypes:['enterprise.object-extension.definition'],
   subjectIds:[subjectId],actorTypes:['AI']
  }]
 })
});
child=spawn(process.execPath,['dist/manager/server.js'],{
 env:profile.environment,stdio:['ignore','pipe','pipe']});
child.stdout.on('data',x=>{hostLog+=String(x);process.stdout.write('[HOST] '+x)});
child.stderr.on('data',x=>{hostLog+=String(x);process.stderr.write('[HOST_ERR] '+x)});
async function stop(){
 if(closed)return;closed=true;
 writeFileSync(join(artifact,'host.log'),hostLog.slice(-500000));
 if(child?.exitCode===null)child.kill('SIGTERM');
 releaseHeldModel?.();mock.close();
 await sql.end({timeout:2});
 rmSync(temp,{recursive:true,force:true});
}
process.on('SIGTERM',()=>{void stop().then(()=>process.exit(0))});
process.on('SIGINT',()=>{void stop().then(()=>process.exit(0))});
process.on('exit',()=>{if(!closed&&child?.exitCode===null)child.kill('SIGTERM')});
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
async function request(path,method='GET',body,ctx){
 const res=await fetch(hostUrl+path,{method,headers:{
  'accept':'application/json',...(body?{'content-type':'application/json'}:{}),
  ...(ctx?{'x-evo-context-id':ctx}:{})
 },...(body?{body:JSON.stringify(body)}:{})});
 let result;try{result=await res.json()}catch{result={}};
 return{status:res.status,result};
}
try {
 let ok=false;
 for(let i=0;i<120;i++){
  if(child.exitCode!==null)throw Error('HOST_DIED_'+child.exitCode);
  try{const p=await request('/health');if(p.status===200&&p.result.ok){ok=true;break}}catch{}
  await sleep(250);
 }
 assert.ok(ok,'HOST_START_TIMEOUT');
 for(const packageId of ['evo-object-extension','enterprise-agent','openai-llm-provider']){
  const x=await request('/v1/install','POST',{packageId});
  assert.equal(x.status,200,'INSTALL_'+packageId+JSON.stringify(x).slice(0,1200));
 }
 const fixture={hostUrl,mockUrl,contextId,enterpriseId,subjectId,runSchema,
  ownerSchema,extensionId,productionUsed:false,model:'LOOPBACK_RESPONSES',
  runMode:'OWNER_SANDBOX',sourceHead:process.env.GITHUB_SHA||'local'};
 writeFileSync(join(artifact,'fixture.json'),JSON.stringify(fixture,null,2));
 console.log('PA02_OWNER_CHROMIUM_READY='+JSON.stringify(fixture));
}catch(error){console.error('PA02_OWNER_CHROMIUM_BOOT_ERROR',error);await stop();process.exit(1)}
