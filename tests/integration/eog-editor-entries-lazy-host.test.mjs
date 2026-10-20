import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {createPersonalAgentExperienceProfileV010} from '../../dist/manager/local-experience-profile.js';
import {createFileSettingsStore} from '../../dist/manager/settings-store.js';
import {createEnterpriseOperatingGraphEditorPageV010} from '../../dist/apps/eog-2d-designer/enterprise-operating-graph-page.js';
import {EOG_2D_DESIGNER_PAGE_SOURCE, EOG_CREATE_ACTION, EOG_GET_ACTION,
  EOG_LIST_ACTION,EOG_VALIDATE_ACTION,EOG_APPLY_OPERATION_ACTION,
  EOG_VIEW_GET_ACTION,EOG_VIEW_OPERATION_ACTION,EOG_VIEW_SELECTION_GET_ACTION}
  from '../../dist/apps/eog-2d-designer/package.js';

const codes=[EOG_CREATE_ACTION,EOG_GET_ACTION,EOG_LIST_ACTION,EOG_VALIDATE_ACTION,
  EOG_APPLY_OPERATION_ACTION,EOG_VIEW_GET_ACTION,EOG_VIEW_OPERATION_ACTION,EOG_VIEW_SELECTION_GET_ACTION];
const semantic='dist/apps/eog-2d-designer/enterprise-operating-graph-actions.js';
const page='dist/apps/eog-2d-designer/enterprise-operating-graph-page.js';
const packageId='evo-eog-2d',graphId='eog:primary';
async function start(directory,extra={}){
  // Compatible startup normally auto-installs peer 3D/Observatory packages
  // (and their 2D dependency). Use the existing one-time defaults journal to
  // represent a user who retired those optional defaults, without changing
  // production defaults or bypassing lifecycle/authorization requests.
  const defaults=path.join(directory,'startup-defaults.json');
  if(!fs.existsSync(defaults))createFileSettingsStore(defaults).setNamespace('host.startup-defaults.v1',{
    'evo-eog-3d':true,'evo-enterprise-observatory':true,'eog-bottleneck-analysis-provider':true});
  const profile=createPersonalAgentExperienceProfileV010({PATH:process.env.PATH,PORT:'0',NODE_ENV:'test',
    APP_PLATFORM_STATE_FILE:path.join(directory,'state.json'),
    APP_PLATFORM_ENTERPRISE_GOVERNANCE_FILE:path.join(directory,'governance.json'),
    APP_PLATFORM_ENTERPRISE_RESOURCES_FILE:path.join(directory,'resources.json'),
    APP_PLATFORM_MANAGED_SESSION_ENABLED:'false',APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED:'false',
    APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED:'false',...extra});
  const child=fork(path.resolve('dist/manager/server.js'),[],{execArgv:[
    '--import',path.resolve('tools/plugin-loading-audit-probe.mjs'),
    '--import',path.resolve('tests/fixtures/eog-editor-import-barrier.mjs')],
    env:{...profile.environment,...extra},stdio:['ignore','pipe','pipe','ipc']});
  child.stdout.resume();let stderr='';child.stderr.on('data',part=>stderr+=part);
  const exited=new Promise(resolve=>child.once('exit',code=>resolve(code)));
  let timer;
  const stop=async()=>{if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');
    timer=setTimeout(()=>child.kill('SIGKILL'),7000);assert.equal(await exited,0);clearTimeout(timer);}
    assert.equal(stderr,'');};
  try{
    const sample=await new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('HOST_START_TIMEOUT')),30000);
      child.once('error',reject);child.once('exit',code=>reject(Error('HOST_EARLY_EXIT '+code+stderr)));
      child.on('message',x=>{if(x.kind==='host-baseline')resolve(x);});});
    clearTimeout(timer);assert.equal(sample.blockedOutbound,0);
    const call=async(route,payload,contextId)=>{
      const response=await fetch(`http://127.0.0.1:${sample.port}${route}`,{
        method:payload===undefined?'GET':'POST',signal:AbortSignal.timeout(15000),
        headers:{'content-type':'application/json',...(contextId?{'x-evo-context-id':contextId}:{})},
        ...(payload===undefined?{}:{body:JSON.stringify(payload)})});
      return {status:response.status,body:await response.json()};};
    const execute=async(code,values={},contextId,confirmed=true)=>{
      const r=await call('/v1/actions',{contractVersion:'0.1.0',type:'command',
        command:{code,inputVersion:'0.1.0'},values,actionId:'eog-editor-lazy',
        sourceInteractionId:'eog-editor-lazy',requiresConfirmation:confirmed},contextId);
      assert.equal(r.status,200,JSON.stringify(r));return r.body;};
    const snapshot=async()=>{const id=crypto.randomUUID();return new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{child.off('message',listener);reject(Error('MODULE_SNAPSHOT_TIMEOUT'));},5000);
      const listener=x=>{if(x.kind==='audit-module-snapshot'&&x.id===id){clearTimeout(timeout);child.off('message',listener);resolve(x.loadedModules);}};
      child.on('message',listener);child.send({kind:'audit-module-snapshot',id});});};
    const open=contextId=>call('/v1/experience-pages?source='+encodeURIComponent(EOG_2D_DESIGNER_PAGE_SOURCE)+'&locale=zh-CN',undefined,contextId);
    const lifecycle=async action=>assert.equal((await call('/v1/'+action,{packageId})).status,200);
    const enterprise=async code=>{const r=await execute('enterprise.context.create',{displayName:'Isolated EOG '+code,code});
      assert.equal(r.ok,true,JSON.stringify(r));return r.result.context?.contextId??r.result.contextId;};
    return {sample,call,execute,snapshot,open,lifecycle,enterprise,stop};
  }catch(error){clearTimeout(timer);child.kill('SIGKILL');await exited;throw error;}
}
const unloaded=modules=>{assert.ok(!modules.includes(semantic),'semantic implementation stays cold');
  assert.ok(!modules.includes(page),'page/view implementation stays cold');};
async function waitFiles(directory,names){const deadline=Date.now()+7000;
  while(!names.every(name=>fs.existsSync(path.join(directory,name)))){
    if(Date.now()>deadline)throw Error('IMPORT_BARRIER_NOT_REACHED:'+names.join(','));await delay(10);}}

test('real Host lazily loads semantic and view entries, preserving layout, CAS, isolation and persisted recovery',{timeout:60000},async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'eog-editor-lazy-'));let host;
  try{
    host=await start(directory);unloaded(host.sample.loadedModules);
    assert.ok(!JSON.parse(fs.readFileSync(path.join(directory,'state.json'),'utf8')).installedPackages
      .some(item=>item.packageId===packageId),'2D package is genuinely not installed in this fixture');
    const contextId=await host.enterprise('EOG_LAZY_A');
    for(const code of codes)assert.equal((await host.execute(code,{},contextId)).error.code,'ACTION_FEATURE_NOT_ACTIVE');
    assert.equal((await host.open(contextId)).status,404);unloaded(await host.snapshot());
    await host.lifecycle('install');unloaded(await host.snapshot());
    await host.lifecycle('disable');
    for(const code of codes)assert.equal((await host.execute(code,{},contextId)).error.code,'ACTION_FEATURE_NOT_ACTIVE');
    unloaded(await host.snapshot());await host.lifecycle('enable');
    const first=await Promise.all([0,1].map(()=>host.execute(EOG_LIST_ACTION,{},contextId)));
    assert.deepEqual(first[0],first[1]);assert.deepEqual(first[0].result.graphs,[]);
    const modules=await host.snapshot();assert.ok(modules.includes(semantic));assert.ok(!modules.includes(page));
    let graph=(await host.execute(EOG_CREATE_ACTION,{graphId},contextId)).result;assert.equal(graph.graphId,graphId);
    const mutation={type:'NODE_BIND',node:{nodeId:'node:sales',kind:'APPLICATION',
      semanticRef:{kind:'APPLICATION',authority:'HOST',refId:'application:sales-order'}}};
    const bound=await host.execute(EOG_APPLY_OPERATION_ACTION,{graphId,expectedRevision:graph.revision,mutation},contextId);
    assert.equal(bound.ok,true,JSON.stringify(bound));graph=bound.result;
    assert.equal((await host.execute(EOG_VALIDATE_ACTION,{graphId},contextId)).ok,true);
    const opened=await host.open(contextId);assert.equal(opened.status,200);
    assert.equal(opened.body.requestValues.activeContext.enterpriseId,graph.enterpriseId);
    assert.deepEqual(opened.body,createEnterpriseOperatingGraphEditorPageV010({
      activeContext:opened.body.requestValues.activeContext,locale:'zh-CN'}));
    const read=await host.execute(EOG_VIEW_GET_ACTION,{resourceId:graphId},contextId);assert.equal(read.ok,true);
    const inspected=await host.execute(EOG_VIEW_SELECTION_GET_ACTION,{resourceId:graphId,target:{kind:'node',id:'node:sales'}},contextId);
    assert.equal(inspected.ok,true,JSON.stringify(inspected));
    const move={resourceId:graphId,expectedRevision:read.result.revision,
      operation:{type:'MOVE_NODE',nodeId:'node:sales',x:123,y:234}};
    const moved=await host.execute(EOG_VIEW_OPERATION_ACTION,move,contextId);assert.equal(moved.ok,true,JSON.stringify(moved));
    assert.equal(moved.result.nodes.find(node=>node.id==='node:sales').x,123);
    assert.equal((await host.execute(EOG_VIEW_OPERATION_ACTION,move,contextId)).ok,false,'stale view revision cannot overwrite');
    assert.deepEqual((await host.execute(EOG_GET_ACTION,{graphId},contextId)).result,graph,'layout cannot mutate semantic truth');
    const unconfirmed=await host.execute(EOG_APPLY_OPERATION_ACTION,{graphId,expectedRevision:graph.revision,mutation:{type:'PUBLISH'}},contextId,false);
    assert.equal(unconfirmed.error.code,'EOG_PUBLISH_CONFIRMATION_REQUIRED');
    const other=await host.enterprise('EOG_LAZY_B');
    assert.equal((await host.execute(EOG_GET_ACTION,{graphId},other)).error.code,'EOG_GRAPH_NOT_FOUND');
    assert.deepEqual((await host.execute(EOG_LIST_ACTION,{},other)).result.graphs,[]);
    await host.lifecycle('disable');assert.equal((await host.open(contextId)).status,404);
    for(const code of codes)assert.equal((await host.execute(code,{},contextId)).error.code,'ACTION_FEATURE_NOT_ACTIVE');
    await host.lifecycle('enable');assert.deepEqual((await host.execute(EOG_VIEW_GET_ACTION,{resourceId:graphId},contextId)).result,moved.result);
    await host.lifecycle('uninstall');assert.equal((await host.open(contextId)).status,404);
    await host.lifecycle('install');assert.deepEqual((await host.execute(EOG_GET_ACTION,{graphId},contextId)).result,graph);
    await host.stop();host=await start(directory);unloaded(host.sample.loadedModules);
    assert.deepEqual((await host.execute(EOG_VIEW_GET_ACTION,{resourceId:graphId},contextId)).result,moved.result);
    assert.deepEqual((await host.execute(EOG_GET_ACTION,{graphId},contextId)).result,graph);
  }finally{await host?.stop();fs.rmSync(directory,{recursive:true,force:true});}
});

test('real Host rejects late semantic WRITE, view READ and page after disable during native import',{timeout:45000},async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'eog-editor-import-race-'));let host;
  try{
    host=await start(directory,{EOG_EDITOR_IMPORT_TEST_DIRECTORY:directory});
    const contextId=await host.enterprise('EOG_IMPORT_RACE');await host.lifecycle('install');
    const pending=[host.execute(EOG_CREATE_ACTION,{graphId},contextId),
      host.execute(EOG_VIEW_GET_ACTION,{resourceId:graphId},contextId),host.open(contextId)];
    const settled=Promise.all(pending);settled.catch(()=>{});
    await waitFiles(directory,['enterprise-operating-graph-actions.ready','enterprise-operating-graph-page.ready']);
    await host.lifecycle('disable');fs.writeFileSync(path.join(directory,'release'),'release');
    const [created,read,opened]=await settled;
    assert.equal(created.error.code,'ACTION_FEATURE_NOT_ACTIVE');assert.equal(read.error.code,'ACTION_FEATURE_NOT_ACTIVE');
    assert.equal(opened.status,404);
    await host.lifecycle('enable');assert.deepEqual((await host.execute(EOG_LIST_ACTION,{},contextId)).result.graphs,[]);
    assert.equal((await host.execute(EOG_CREATE_ACTION,{graphId},contextId)).ok,true,'same lazy handler recovers when qualified');
    assert.equal((await host.open(contextId)).status,200);
  }finally{fs.writeFileSync(path.join(directory,'release'),'release');await host?.stop();fs.rmSync(directory,{recursive:true,force:true});}
});

test('native import failure does not create a graph; restart after delivery recovery succeeds',{timeout:45000},async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'eog-editor-import-fault-'));let host;
  try{
    host=await start(directory,{EOG_EDITOR_IMPORT_TEST_DIRECTORY:directory,EOG_EDITOR_IMPORT_TEST_FAIL:'true'});
    const contextId=await host.enterprise('EOG_IMPORT_FAULT');await host.lifecycle('install');
    const result=await host.call('/v1/actions',{contractVersion:'0.1.0',type:'command',
      command:{code:EOG_CREATE_ACTION,inputVersion:'0.1.0'},values:{graphId},
      actionId:'import-fault',sourceInteractionId:'import-fault',requiresConfirmation:true},contextId);
    assert.equal(result.status,403,'retain the existing thrown-action HTTP envelope');
    assert.equal(result.body.ok,false);
    assert.equal(result.body.error.code,'EOG_EDITOR_TEST_IMPORT_FAILURE');
    assert.match(result.body.error.message,/EOG_EDITOR_TEST_IMPORT_FAILURE/);
    await waitFiles(directory,['enterprise-operating-graph-actions.ready']);
    await host.stop();host=await start(directory);unloaded(host.sample.loadedModules);
    assert.deepEqual((await host.execute(EOG_LIST_ACTION,{},contextId)).result.graphs,[]);
    assert.equal((await host.execute(EOG_CREATE_ACTION,{graphId},contextId)).ok,true);
  }finally{await host?.stop();fs.rmSync(directory,{recursive:true,force:true});}
});
