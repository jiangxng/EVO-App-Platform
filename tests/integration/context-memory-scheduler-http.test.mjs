import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {fork} from 'node:child_process';import {createServer} from 'node:http';import {randomUUID} from 'node:crypto';
const ec='experience-compiler-memory-intake-provider',local='host-memory-intake-provider';
const sourceCap='context.memory.intake-source',evidenceCap='context.memory.evidence-source';
const contexts=['a','b'].map(id=>({contractVersion:'0.1.0',kind:'PERSONAL',contextId:'personal:'+id}));
async function until(read,check){for(let i=0;i<200;i++){const value=await read();if(check(value))return value;await new Promise(r=>setTimeout(r,10));}throw Error('WAIT_CONDITION_TIMEOUT');}
test('real Host HTTP lifecycle, binding switch, in-flight page and restart preserve scheduler ownership and cursors',{timeout:60000},async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'memory-http-'));let live,held;const pulls=[];
 const remote=createServer(async(req,res)=>{let raw='';for await(const chunk of req)raw+=chunk;pulls.push(JSON.parse(raw));if(pulls.length===1){held=res;return;}res.setHeader('content-type','application/json');res.end(JSON.stringify({contractVersion:'0.1.0',records:[]}));});
 await new Promise(r=>remote.listen(0,'127.0.0.1',r));
 const bindings=['intake-source','evidence-source'].map((kind,i)=>({contractVersion:'0.1.0',capability:'context.memory.'+kind,providerId:i?'experience-compiler.evidence-source':'experience-compiler.memory-intake',scope:'SYSTEM'}));
 await fs.writeFile(path.join(root,'provider-bindings.json'),JSON.stringify({contractVersion:'0.1.0',bindings}));
 const token='isolated-fixture-admin';
 async function boot(){
  const child=fork(path.resolve('dist/manager/server.js'),[],{execArgv:['--import',path.resolve('tests/integration/fixtures/memory-scheduler-http-probe.mjs')],env:{PATH:process.env.PATH,PORT:'0',NODE_ENV:'test',APP_PLATFORM_STATE_FILE:path.join(root,'state.json'),APP_PLATFORM_STARTUP_PROFILE:'minimal',APP_PLATFORM_MANAGED_SESSION_ENABLED:'true',APP_PLATFORM_BOOTSTRAP_ADMIN_TOKEN:token,APP_PLATFORM_AUTHORIZATION_POLICY_JSON:JSON.stringify({contractVersion:'0.1.0',rules:[{id:'test-binding-only',effect:'ALLOW',actions:['provider.binding.update'],resourceTypes:['provider-binding']}]}),APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_MS:'60000',APP_PLATFORM_CONTEXT_MEMORY_SCHEDULE_CONTEXTS_JSON:JSON.stringify(contexts),APP_PLATFORM_EC_MEMORY_INTAKE_JSON:JSON.stringify({contractVersion:'0.1.0',endpoint:`http://127.0.0.1:${remote.address().port}`,source:{sourceId:'ec-fixture',trustLevel:'DECLARED'},timeoutMs:20000}),APP_PLATFORM_MEMORY_INTAKE_JSON:JSON.stringify({contractVersion:'0.1.0',source:{sourceId:'local-fixture',sourceType:'DOCUMENT',trustLevel:'DECLARED'},records:[]})},stdio:['ignore','pipe','pipe','ipc']});
  child.stdout.resume();let stderr='';child.stderr.on('data',x=>stderr+=x);const exited=new Promise(r=>child.once('exit',r));live={child,exited};
  let timeout;const port=await new Promise((resolve,reject)=>{timeout=setTimeout(()=>reject(Error('BOOT_TIMEOUT '+stderr)),15000);child.once('error',reject);child.once('exit',code=>reject(Error('BOOT_EXIT '+code+' '+stderr)));child.on('message',x=>{if(x.kind==='ready')resolve(x.port);});}).finally(()=>clearTimeout(timeout));
  async function ipc(kind){const id=randomUUID();return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{child.off('message',handler);reject(Error('IPC_TIMEOUT'));},5000);const handler=x=>{if(x.id===id){clearTimeout(timeout);child.off('message',handler);resolve(x);}};child.on('message',handler);child.send({kind,id});});}
  async function post(route,body){const response=await fetch(`http://127.0.0.1:${port}${route}`,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});return {status:response.status,body:await response.json()};}
  async function lifecycle(op,packageId){const r=await post('/v1/'+op,{packageId,trustApproved:true,approvedPermissions:[]});assert.equal(r.status,200,JSON.stringify(r.body));}
  async function bind(capability,providerId,adminToken=token){return post('/v1/actions',{contractVersion:'0.1.0',type:'command',command:{code:'app-platform.update-provider-binding',inputVersion:'0.1.0'},values:{namespace:'provider-binding:'+capability,settings:{providerId,scope:'SYSTEM',adminToken}},sourceInteractionId:'test:memory-http',actionId:randomUUID(),requiresConfirmation:false});}
  return {ipc,post,lifecycle,bind,async stop(){child.kill('SIGTERM');const kill=setTimeout(()=>child.kill('SIGKILL'),7000);assert.equal(await exited,0,stderr);clearTimeout(kill);live=undefined;assert.doesNotMatch(stderr,/TEST_NON_LOOPBACK|shutdown incomplete|BOOT_/);}};
 }
 const cursors=async()=>JSON.parse(await fs.readFile(path.join(root,'context-memory-schedule-state.json'),'utf8')).cursors;
 const logs=async()=>{try{return (await fs.readFile(path.join(root,'context-memory-operations.jsonl'),'utf8')).trim().split('\n').filter(Boolean).map(x=>JSON.parse(x));}catch(e){if(e.code==='ENOENT')return [];throw e;}};
 try{
  let h=await boot();assert.deepEqual((await h.ipc('inspect')).timers,[60000]);
  const denied=await h.bind(sourceCap,'host.memory-intake-source','wrong');assert.equal(denied.status,403);assert.deepEqual((await h.ipc('inspect')).timers,[60000]);
  await h.ipc('fire');await until(async()=>pulls.length,x=>x===1);assert.equal(pulls[0].context.contextId,'personal:a');assert.equal(pulls[0].limit,100);
  await h.lifecycle('disable',ec);assert.deepEqual((await h.ipc('inspect')).timers,[]);
  held.end(JSON.stringify({contractVersion:'0.1.0',records:[],nextCursor:'page:2'}));held=undefined;
  await until(logs,x=>x.length===1);assert.equal((await logs())[0].state,'SUCCEEDED');assert.equal((await cursors())[0].cursor,'page:2');await h.ipc('fire');assert.equal(pulls.length,1);
  await h.stop();h=await boot();assert.deepEqual((await h.ipc('inspect')).timers,[]);assert.equal((await cursors())[0].cursor,'page:2');
  await h.lifecycle('enable',ec);assert.deepEqual((await h.ipc('inspect')).timers,[60000]);await h.ipc('fire');await until(logs,x=>x.length===3);assert.equal(pulls[1].cursor,'page:2');assert.equal(pulls[2].context.contextId,'personal:b');assert.ok((await cursors()).every(x=>x.cursor===undefined));
  assert.equal((await h.bind(sourceCap,'host.memory-intake-source')).status,200);assert.deepEqual((await h.ipc('inspect')).timers,[],'mismatched evidence pauses');
  assert.equal((await h.bind(evidenceCap,'host.memory-evidence-source')).status,200);assert.deepEqual((await h.ipc('inspect')).timers,[60000]);await h.ipc('fire');await until(logs,x=>x.length===5);assert.equal(pulls.length,3,'local binding makes no remote request');
  await h.lifecycle('disable',local);assert.deepEqual((await h.ipc('inspect')).timers,[]);await h.lifecycle('enable',local);assert.deepEqual((await h.ipc('inspect')).timers,[60000]);
  await h.lifecycle('uninstall',local);assert.deepEqual((await h.ipc('inspect')).timers,[]);await h.lifecycle('install',local);assert.deepEqual((await h.ipc('inspect')).timers,[60000]);
  await h.stop();assert.equal((await logs()).length,5);assert.ok((await logs()).every(x=>x.state==='SUCCEEDED'));assert.equal((await cursors()).length,4);await assert.rejects(fs.stat(path.join(root,'context-memory-scheduler.lease.json')),/ENOENT/);await assert.rejects(fs.stat(path.join(root,'context-memory.json')),/ENOENT/,'empty source pages do not become durable Memory');
 }finally{held?.destroy();if(live){live.child.kill('SIGKILL');await live.exited;}remote.closeAllConnections();await new Promise(r=>remote.close(r));await fs.rm(root,{recursive:true,force:true});}
});
