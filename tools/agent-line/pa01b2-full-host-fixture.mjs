#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createPersonalAgentExperienceProfileV010 } from '../../dist/manager/local-experience-profile.js';

const temp=mkdtempSync(join(tmpdir(),'evo-pa01b2-e2e-'));
const artifact=resolve('artifacts/agent-pa01b2-full-browser');
mkdirSync(artifact,{recursive:true});
const hostPort=41237,mockPort=41238,hostUrl='http://127.0.0.1:'+hostPort,mockUrl='http://127.0.0.1:'+mockPort;
let mode='success',requestNo=0,closed=false,hostLog='',applyJobId='',applySent=false;
const mockRequests=[],held=[];
const json=(r,status,v)=>{r.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});r.end(JSON.stringify(v));};
async function read(req){const parts=[];for await(const c of req)parts.push(c);return JSON.parse(Buffer.concat(parts).toString()||'{}');}
const mock=createServer(async(req,res)=>{
 try{
  if(req.method==='GET'&&req.url==='/__requests')return json(res,200,{requests:mockRequests,holding:held.length});
  if(req.method==='POST'&&req.url==='/__control'){
   const value=await read(req);
   if(value.mode==='release'){for(const wake of held.splice(0))wake();}
   else if(['success','hold','fail','apply'].includes(value.mode)){
    mode=value.mode;
    if(mode==='apply'){
     if(typeof value.importJobId!=='string'||!value.importJobId.startsWith('import-'))return json(res,400,{error:'APPLY_JOB_REQUIRED'});
     applyJobId=value.importJobId;applySent=false;
    }
   }
   else return json(res,400,{error:'INVALID_MODE'});
   return json(res,200,{mode,holding:held.length});
  }
  if(req.method==='POST'&&req.url==='/v1/responses'){
   const requestBody=await read(req);const action=mode,id=++requestNo;mockRequests.push({id,mode:action});
   if(action==='hold')await new Promise(resolve=>held.push(resolve));
   if(action==='fail')return json(res,503,{error:{message:'PA01B2_ISOLATED_MODEL_FAILURE'}});
   if(action==='apply' && !applySent){
    applySent=true;
    const available=(requestBody.tools??[]).some(tool=>tool.name==='evo_capabilities_invoke_write');
    if(!available)return json(res,422,{error:{message:'AGENT_WRITER_CAPABILITY_NOT_AUTHORIZED_IN_TEST'}}); 
    const argumentsText=JSON.stringify({operationId:'enterprise.data-import.mapping.apply',
      input:{importJobId:applyJobId,mapping:[
       {sourceColumn:'往来编码',targetFieldId:'code'},
       {sourceColumn:'往来名称',targetFieldId:'displayName'},
       {sourceColumn:'主体类型',targetFieldId:'subjectType'}
      ],dryRun:true}});
    return json(res,200,{id:'resp-write-'+id,object:'response',status:'completed',
      model:'agent-pa01b2-test-model',
      output:[{type:'function_call',call_id:'call-fixture-'+id,name:'evo_capabilities_invoke_write',arguments:argumentsText}],
      usage:{input_tokens:9,output_tokens:16}});
   }
   return json(res,200,{id:'resp-fixture-'+id,object:'response',status:'completed',model:'agent-pa01b2-test-model',
     output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Fixture response completed without business write.'}]}],
     usage:{input_tokens:6,output_tokens:8}});
  }
  if(req.method==='GET'&&req.url==='/v1/models/agent-pa01b2-test-model')return json(res,200,{id:'agent-pa01b2-test-model'});
  return json(res,404,{error:'TEST_ONLY_ROUTE_NOT_FOUND'});
 }catch(e){return json(res,500,{error:String(e)});}
});
await new Promise((resolve,reject)=>mock.listen(mockPort,'127.0.0.1',e=>e?reject(e):resolve()));
const profile=createPersonalAgentExperienceProfileV010({...process.env,
 PORT:String(hostPort),OPENAI_API_KEY:'isolated-no-network-key',
 OPENAI_MODEL:'agent-pa01b2-test-model',OPENAI_BASE_URL:mockUrl+'/v1',
 APP_PLATFORM_EXPERIENCE_SUBJECT_ID:'pa01b2-fixture-user',
 APP_PLATFORM_STATE_FILE:join(temp,'host-state.json'),
 APP_PLATFORM_ENTERPRISE_GOVERNANCE_FILE:join(temp,'governance.json'),
 APP_PLATFORM_ENTERPRISE_RESOURCES_FILE:join(temp,'resources.json'),
 // Product default deliberately allows scoped AI; negative fixture must use explicit DENY precedence.
 ...(process.env.PA01B3_DENY_AI_WRITE==='1' ? {
   APP_PLATFORM_AUTHORIZATION_POLICY_OVERLAY_JSON:JSON.stringify({contractVersion:'0.1.0',rules:[{
    id:'pa01b3-local-ai-import-deny',effect:'DENY',actions:['data-import.read','data-import.write'],
    resourceTypes:['enterprise.data-import.job'],subjectIds:['pa01b2-fixture-user'],actorTypes:['AI']
   }]})
 } : {
   APP_PLATFORM_AUTHORIZATION_POLICY_OVERLAY_JSON:JSON.stringify({contractVersion:'0.1.0',rules:[{
    id:'pa01b3-local-ai-import-only',effect:'ALLOW',actions:['data-import.read','data-import.write'],
    resourceTypes:['enterprise.data-import.job'],subjectIds:['pa01b2-fixture-user'],actorTypes:['AI']
   }]})
 }),
 NODE_ENV:'test',LOG_LEVEL:'silent'
});
const child=spawn(process.execPath,['dist/manager/server.js'],{env:profile.environment,stdio:['ignore','pipe','pipe']});
child.stdout.on('data',c=>{hostLog+=String(c);process.stdout.write('[HOST] '+c);});
child.stderr.on('data',c=>{hostLog+=String(c);process.stderr.write('[HOST_ERR] '+c);});
async function shutdown(sig='SIGTERM'){
 if(closed)return;closed=true;
 writeFileSync(join(artifact,'host.log'),hostLog.slice(-500000));
 if(child.exitCode===null)child.kill(sig);
 for(const fn of held.splice(0))fn();
 mock.close();rmSync(temp,{recursive:true,force:true});
}
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{void shutdown(sig).then(()=>process.exit(0));});
process.on('exit',()=>{if(!closed)child.kill('SIGTERM');});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function request(path,method='GET',payload,ctx){
 const r=await fetch(hostUrl+path,{method,headers:{accept:'application/json',...(payload?{'content-type':'application/json'}:{}),
  ...(ctx?{'x-evo-context-id':ctx}:{})},...(payload?{body:JSON.stringify(payload)}:{})});
 const t=await r.text();let value;try{value=JSON.parse(t);}catch{value={raw:t.slice(0,300)};}return{status:r.status,value};
}
function action(code,values={},confirm=false){return{contractVersion:'0.1.0',type:'command',command:{code,inputVersion:'0.1.0'},values,
 sourceInteractionId:'pa01b2-isolated-browser',actionId:code,requiresConfirmation:confirm};}
async function exec(code,values,ctx,confirm=false){
 const r=await request('/v1/actions','POST',action(code,values,confirm),ctx);
 assert.equal(r.status,200,JSON.stringify({code,r}).slice(0,1700));
 assert.equal(r.value.ok,true,JSON.stringify({code,r}).slice(0,1700));
 return r.value.result;
}
try{
 let ready=false;
 for(let i=0;i<120;i++){if(child.exitCode!==null)throw Error('HOST_EXIT_'+child.exitCode);
  try{const x=await request('/health');if(x.status===200&&x.value.ok){ready=true;break;}}catch{}
  await sleep(250);
 }
 assert.ok(ready,'HOST_START_TIMEOUT');
 const created=await exec('enterprise.context.create',{displayName:'Isolated Agent Browser Enterprise',code:'AGENT_BROWSER_ISOLATED'},undefined,true);
 const ctx=created?.context?.contextId??created?.contextId;
 assert.ok(ctx,'MISSING_CONTEXT:'+JSON.stringify(created).slice(0,900));
 console.log('PA01B2_CREATED_CONTEXT='+ctx);
 for(const packageId of ['evo-counterparty','evo-data-import','enterprise-agent','openai-llm-provider']){
  const r=await request('/v1/install','POST',{packageId});
  assert.equal(r.status,200,JSON.stringify({packageId,r}).slice(0,1500));
  assert.ok(r.value.snapshot?.installedPackages?.some(x=>x.packageId===packageId),'INSTALL_FAILED:'+packageId+JSON.stringify(r.value).slice(0,900));
  console.log('PA01B2_INSTALLED='+packageId);
 }
 const csv='往来编码,往来名称,主体类型,备注\nFIVE001,Fivefold Isolated Supplier,ORGANIZATION,original notes';
 const buffer=Buffer.from(csv,'utf8');
 const file={name:'agent-fixture.csv',mediaType:'text/csv',size:buffer.length,contentBase64:buffer.toString('base64')};
 const staged=await exec('data-import.stage-file',{targetId:'counterparty.subject',file,parameter__relationshipMode:'SUPPLIER'},ctx);
 const jobId=staged?.job?.importJobId;
 assert.ok(jobId,'MISSING_IMPORT_JOB:'+JSON.stringify(staged).slice(0,1200));
 const route='/data-import/jobs/'+encodeURIComponent(jobId)+'/map';
 const loaded=await request('/v1/experience-pages?'+new URLSearchParams({source:'app://evo-data-import/page/mapping',route}),'GET',undefined,ctx);
 assert.equal(loaded.status,200,JSON.stringify(loaded).slice(0,1400));
 assert.ok(loaded.value.actions?.some(x=>x.id==='ai-auto-map'),'AI_BUTTON_MISSING');
 const fixture={hostUrl,mockUrl,contextId:ctx,jobId,route,sourceHead:'db555162370b3c3c992c7aef88f605f9ebf2d0cd',
  model:'LOOPBACK_MOCK',appHost:'ACTUAL',agentThread:'ACTUAL',agentRun:'ACTUAL',businessData:'ISOLATED'};
 writeFileSync(join(artifact,'fixture.json'),JSON.stringify(fixture,null,2));
 console.log('PA01B2_E2E_FIXTURE_READY='+JSON.stringify({contextId:ctx,jobId,route,hostUrl,mockUrl}));
}catch(error){console.error('PA01B2_FIXTURE_ERROR',error);await shutdown();process.exit(1);}
