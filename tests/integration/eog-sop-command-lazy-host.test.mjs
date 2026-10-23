// Loading/compatibility governance of preserved commands, not a SOP product
// certification or promotion of tests/preserved into the EOG Core gate.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {createPersonalAgentExperienceProfileV010} from '../../dist/manager/local-experience-profile.js';
import {createFileSettingsStore} from '../../dist/manager/settings-store.js';
import {EOG_SOP_LIST_ACTION as LIST,EOG_SOP_CREATE_ACTION as CREATE,
  EOG_SOP_REVISE_ACTION as REVISE,EOG_SOP_PUBLISH_ACTION as PUBLISH}
  from '../../dist/contracts/enterprise-operating-graph-sop.js';
const codes=[LIST,CREATE,REVISE,PUBLISH],owner='enterprise-agent';
const implementation='dist/manager/enterprise-operating-graph-sop-actions.js';
const graphId='eog:sop-lazy',sopId='sop:loading-compat';
async function start(directory,extra={}){
  const defaults=path.join(directory,'startup-defaults.json');
  if(!fs.existsSync(defaults))createFileSettingsStore(defaults).setNamespace('host.startup-defaults.v1',{
    'evo-eog-3d':true,'evo-enterprise-observatory':true,'eog-bottleneck-analysis-provider':true});
  const profile=createPersonalAgentExperienceProfileV010({PATH:process.env.PATH,PORT:'0',NODE_ENV:'test',
    APP_PLATFORM_STATE_FILE:path.join(directory,'state.json'),
    APP_PLATFORM_ENTERPRISE_GOVERNANCE_FILE:path.join(directory,'governance.json'),
    APP_PLATFORM_ENTERPRISE_RESOURCES_FILE:path.join(directory,'resources.json'),
    APP_PLATFORM_ENTERPRISE_BUSINESS_DEFINITIONS_FILE:path.join(directory,'definitions.json'),
    APP_PLATFORM_MANAGED_SESSION_ENABLED:'false',APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED:'false',
    APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED:'false',...extra});
  const child=fork(path.resolve('dist/manager/server.js'),[],{execArgv:[
    '--import',path.resolve('tools/plugin-loading-audit-probe.mjs'),
    '--import',path.resolve('tests/fixtures/sop-action-import-hook.mjs')],
    env:{...profile.environment,...extra},stdio:['ignore','pipe','pipe','ipc']});
  child.stdout.resume();let stderr='';child.stderr.on('data',part=>stderr+=part);
  const exited=new Promise(resolve=>child.once('exit',code=>resolve(code)));let timer;
  const stop=async()=>{if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');
    timer=setTimeout(()=>child.kill('SIGKILL'),7000);assert.equal(await exited,0);clearTimeout(timer);}
    assert.equal(stderr,'');};
  try{
    const sample=await new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('HOST_START_TIMEOUT')),30000);
      child.once('error',reject);child.once('exit',code=>reject(Error('HOST_EARLY_EXIT '+code+stderr)));
      child.on('message',x=>{if(x.kind==='host-baseline')resolve(x);});});
    clearTimeout(timer);assert.equal(sample.blockedOutbound,0);
    const call=async(route,payload,contextId)=>{const response=await fetch(`http://127.0.0.1:${sample.port}${route}`,{
      method:'POST',signal:AbortSignal.timeout(15000),headers:{'content-type':'application/json',
        ...(contextId?{'x-evo-context-id':contextId}:{})},body:JSON.stringify(payload)});
      return {status:response.status,body:await response.json()};};
    const request=(code,values={},confirmed=true)=>({contractVersion:'0.1.0',type:'command',
      command:{code,inputVersion:'0.1.0'},values,actionId:'sop-loading-compat',
      sourceInteractionId:'sop-loading-compat',requiresConfirmation:confirmed});
    const execute=async(code,values,contextId,confirmed=true)=>{const r=await call('/v1/actions',request(code,values,confirmed),contextId);
      assert.equal(r.status,200,JSON.stringify(r));return r.body;};
    const snapshot=async()=>{const id=crypto.randomUUID();return new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{child.off('message',listener);reject(Error('MODULE_SNAPSHOT_TIMEOUT'));},5000);
      const listener=x=>{if(x.kind==='audit-module-snapshot'&&x.id===id){clearTimeout(timeout);child.off('message',listener);resolve(x.loadedModules);}};
      child.on('message',listener);child.send({kind:'audit-module-snapshot',id});});};
    const lifecycle=async(action,packageId=owner)=>{const r=await call('/v1/'+action,{packageId});assert.equal(r.status,200,JSON.stringify(r));};
    const enterprise=async code=>{const r=await execute('enterprise.context.create',{displayName:'SOP loading '+code,code});
      assert.equal(r.ok,true,JSON.stringify(r));return r.result.context?.contextId??r.result.contextId;};
    return {sample,call,request,execute,snapshot,lifecycle,enterprise,stop};
  }catch(error){clearTimeout(timer);child.kill('SIGKILL');await exited;throw error;}
}
const bytes=directory=>{const file=path.join(directory,'definitions.json');return fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;};
const list=(host,contextId)=>host.execute(LIST,{graphId},contextId);
async function waitImport(directory){const deadline=Date.now()+7000;
  while(!fs.existsSync(path.join(directory,'sop-import.ready'))){
    if(Date.now()>deadline)throw Error('SOP_IMPORT_BARRIER_NOT_REACHED');await delay(10);}}

test('legacy SOP Human command loading retains original owner, authority, CAS and shared persisted state',{timeout:60000},async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'sop-lazy-host-'));let host;
  try{
    host=await start(directory);assert.ok(!host.sample.loadedModules.includes(implementation));
    const contextId=await host.enterprise('SOP_LAZY_A');
    for(const code of codes)assert.equal((await host.execute(code,{},contextId)).error.code,'ACTION_FEATURE_NOT_ACTIVE');
    await host.lifecycle('install');assert.ok(!(await host.snapshot()).includes(implementation));
    await host.lifecycle('disable');
    for(const code of codes)assert.equal((await host.execute(code,{},contextId)).error.code,'ACTION_FEATURE_NOT_ACTIVE');
    assert.ok(!(await host.snapshot()).includes(implementation));await host.lifecycle('enable');
    const first=await Promise.all([list(host,contextId),list(host,contextId)]);
    assert.deepEqual(first[0],first[1]);assert.deepEqual(first[0].result,[]);
    const loaded=await host.snapshot();assert.ok(loaded.includes(implementation));
    assert.ok(!loaded.includes('dist/apps/eog-2d-designer/enterprise-operating-graph-actions.js'));
    assert.ok(!loaded.includes('dist/apps/eog-2d-designer/enterprise-operating-graph-page.js'));
    await host.lifecycle('install','evo-eog-2d');
    let graph=(await host.execute('enterprise-operating-graph.create',{graphId},contextId)).result;
    assert.equal(graph.graphId,graphId);
    for(const nodeId of ['app:a','app:b']){
      const r=await host.execute('enterprise-operating-graph.operation.apply',{graphId,expectedRevision:graph.revision,
        mutation:{type:'NODE_BIND',node:{nodeId,kind:'APPLICATION',semanticRef:{kind:'APPLICATION',authority:'HOST',refId:nodeId}}}},contextId);
      assert.equal(r.ok,true,JSON.stringify(r));graph=r.result;
    }
    let r=await host.execute(CREATE,{graphId,sopId,title:'Original draft',applicationNodeIds:['app:a','app:b']},contextId);
    assert.equal(r.ok,true,JSON.stringify(r));let sop=r.result;assert.equal(sop.state,'DRAFT');
    r=await host.execute(REVISE,{graphId,sopId,expectedRevision:sop.revision,title:'Revised draft'},contextId);
    assert.equal(r.ok,true,JSON.stringify(r));sop=r.result;
    assert.equal((await host.execute(REVISE,{graphId,sopId,expectedRevision:sop.revision-1,title:'Stale'},contextId)).error.code,'EOG_EXPECTED_SOP_REVISION_CONFLICT');
    assert.equal((await host.execute(PUBLISH,{graphId,sopId,expectedRevision:sop.revision},contextId,false)).error.code,'EOG_SOP_PUBLISH_CONFIRMATION_REQUIRED');
    r=await host.execute(PUBLISH,{graphId,sopId,expectedRevision:sop.revision},contextId);assert.equal(r.ok,true,JSON.stringify(r));sop=r.result;
    assert.equal(sop.state,'PUBLISHED');assert.equal(sop.publishedBySubjectId,'experience-user');
    assert.equal((await host.execute(REVISE,{graphId,sopId,expectedRevision:sop.revision,title:'Cannot edit published'},contextId)).error.code,'EOG_EXPECTED_SOP_PUBLISHED_IMMUTABLE');
    const other=await host.enterprise('SOP_LAZY_B');assert.deepEqual((await list(host,other)).result,[]);
    await host.lifecycle('disable');for(const code of codes)assert.equal((await host.execute(code,{},contextId)).error.code,'ACTION_FEATURE_NOT_ACTIVE');
    assert.deepEqual((await host.execute('enterprise-operating-graph.get',{graphId},contextId)).result,graph,
      'disabling the legacy command owner cannot dispose shared graph state');
    await host.lifecycle('enable');assert.deepEqual((await list(host,contextId)).result,[sop]);
    await host.lifecycle('uninstall');await host.lifecycle('install');assert.deepEqual((await list(host,contextId)).result,[sop]);
    assert.ok(!JSON.parse(fs.readFileSync(path.join(directory,'state.json'),'utf8')).installedPackages.some(x=>x.packageId==='evo-sop-designer'));
    await host.stop();host=await start(directory);assert.ok(!host.sample.loadedModules.includes(implementation));
    assert.deepEqual((await list(host,contextId)).result,[sop]);
  }finally{await host?.stop();fs.rmSync(directory,{recursive:true,force:true});}
});

test('legacy owner disabled during actual import refuses late SOP read/write and recovers without mutation',{timeout:45000},async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'sop-import-race-'));let host;
  try{
    host=await start(directory,{SOP_ACTION_IMPORT_TEST_DIRECTORY:directory});
    const contextId=await host.enterprise('SOP_IMPORT_RACE');await host.lifecycle('install');const before=bytes(directory);
    const pending=Promise.all([list(host,contextId),host.execute(CREATE,{graphId,sopId,title:'Late draft',applicationNodeIds:[]},contextId)]);
    pending.catch(()=>{});await waitImport(directory);await host.lifecycle('disable');
    fs.writeFileSync(path.join(directory,'sop-import.release'),'release');
    for(const r of await pending)assert.equal(r.error.code,'ACTION_FEATURE_NOT_ACTIVE');
    assert.equal(bytes(directory),before,'late calls do not write shared definitions');
    await host.lifecycle('enable');assert.deepEqual((await list(host,contextId)).result,[]);
  }finally{fs.writeFileSync(path.join(directory,'sop-import.release'),'release');await host?.stop();fs.rmSync(directory,{recursive:true,force:true});}
});

test('legacy SOP module failure retains explicit Host error and no definition writes; restart restores list',{timeout:45000},async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'sop-import-fault-'));let host;
  try{
    host=await start(directory,{SOP_ACTION_IMPORT_TEST_DIRECTORY:directory,SOP_ACTION_IMPORT_TEST_FAIL:'true'});
    const contextId=await host.enterprise('SOP_IMPORT_FAULT');await host.lifecycle('install');const before=bytes(directory);
    const r=await host.call('/v1/actions',host.request(CREATE,{graphId,sopId,title:'Failed import',applicationNodeIds:[]}),contextId);
    assert.equal(r.status,403);assert.equal(r.body.error.code,'SOP_ACTION_TEST_IMPORT_FAILURE');await waitImport(directory);
    assert.equal(bytes(directory),before);await host.stop();host=await start(directory);
    assert.ok(!host.sample.loadedModules.includes(implementation));assert.deepEqual((await list(host,contextId)).result,[]);
  }finally{await host?.stop();fs.rmSync(directory,{recursive:true,force:true});}
});
