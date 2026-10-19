import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {createPersonalAgentExperienceProfileV010} from '../../dist/manager/local-experience-profile.js';
import {createEnterpriseOperatingGraphSpatialObservatoryPageV020} from '../../dist/apps/enterprise-observatory/spatial-page.js';
test('real Host spatial observatory page/action stay unloaded until used and recover after disable', {timeout:45000}, async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'spatial-lazy-host-'));
  const resourceFile=path.join(directory,'resources.json');
  const profile=createPersonalAgentExperienceProfileV010({PATH:process.env.PATH,PORT:'0',NODE_ENV:'test',APP_PLATFORM_STATE_FILE:path.join(directory,'state.json'),APP_PLATFORM_ENTERPRISE_GOVERNANCE_FILE:path.join(directory,'governance.json'),APP_PLATFORM_ENTERPRISE_RESOURCES_FILE:resourceFile,APP_PLATFORM_MANAGED_SESSION_ENABLED:'false',APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED:'false',APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED:'false'});
  const child=fork(path.resolve('dist/manager/server.js'),[],{execArgv:['--import',path.resolve('tools/plugin-loading-audit-probe.mjs')],env:profile.environment,stdio:['ignore','pipe','pipe','ipc']});
  child.stdout.resume();let stderr='',timer;child.stderr.on('data',part=>stderr+=part);
  const exited=new Promise(resolve=>child.once('exit',code=>resolve(code)));
  try{
    const sample=await new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('HOST_START_TIMEOUT')),30000);child.once('error',reject);child.once('exit',code=>reject(Error('HOST_EARLY_EXIT '+code+stderr)));child.on('message',x=>{if(x.kind==='host-baseline')resolve(x);});});
    clearTimeout(timer);assert.equal(sample.blockedOutbound,0);
    assert.ok(!sample.loadedModules.includes('dist/apps/enterprise-observatory/spatial-page.js'));
    const call=async(route,payload,contextId)=>{const response=await fetch(`http://127.0.0.1:${sample.port}${route}`,{method:'POST',signal:AbortSignal.timeout(10000),headers:{'content-type':'application/json',...(contextId?{'x-evo-context-id':contextId}:{})},body:JSON.stringify(payload)});return {status:response.status,body:await response.json()};};
    const execute=async(code,values,contextId)=>{const r=await call('/v1/actions',{contractVersion:'0.1.0',type:'command',command:{code,inputVersion:'0.1.0'},values,actionId:'spatial-lazy-host',sourceInteractionId:'spatial-lazy-host',requiresConfirmation:true},contextId);assert.equal(r.status,200,JSON.stringify(r));return r.body;};
    const created=await execute('enterprise.context.create',{displayName:'Isolated spatial lifecycle',code:'SPATIAL_LAZY'});assert.equal(created.ok,true,JSON.stringify(created));const contextId=created.result.context?.contextId??created.result.contextId;assert.ok(contextId);
    for(const packageId of ['evo-eog-2d','evo-eog-3d','evo-enterprise-observatory'])assert.equal((await call('/v1/install',{packageId})).status,200);
    const snapshot=async()=>{const id=crypto.randomUUID();return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{child.off('message',listener);reject(Error('MODULE_SNAPSHOT_TIMEOUT'));},5000);const listener=x=>{if(x.kind==='audit-module-snapshot'&&x.id===id){clearTimeout(timeout);child.off('message',listener);resolve(x.loadedModules);}};child.on('message',listener);child.send({kind:'audit-module-snapshot',id});});};
    const page=async()=>{const q=new URLSearchParams({source:'app://evo-enterprise-operating-graph/pages/observatory-spatial',route:'/operating-graph/observe/3d',locale:'zh-CN'});const r=await fetch(`http://127.0.0.1:${sample.port}/v1/experience-pages?${q}`,{headers:{'x-evo-context-id':contextId},signal:AbortSignal.timeout(10000)});return {status:r.status,body:await r.json()};};
    const module='dist/apps/enterprise-observatory/spatial-page.js';
    const code='enterprise-operating-graph.observatory.spatial.get';
    assert.ok(!(await snapshot()).includes(module),'installed unused stays lazy');
    {const d=await call('/v1/disable',{packageId:'evo-enterprise-observatory'});assert.equal(d.status,200,JSON.stringify(d));}
    assert.equal((await page()).status,404);
    assert.equal((await execute(code,{resourceId:'missing'},contextId)).error.code,'ACTION_FEATURE_NOT_ACTIVE');
    assert.ok(!(await snapshot()).includes(module),'denied inactive page/action stays lazy');
    assert.equal((await call('/v1/enable',{packageId:'evo-enterprise-observatory'})).status,200);
    const original=await page();assert.equal(original.status,200);
    const pageTime=new Date(original.body.readPresets[0].values.timeLens.primary.endAt);
    assert.deepEqual(original.body,createEnterpriseOperatingGraphSpatialObservatoryPageV020({activeContext:original.body.requestValues.activeContext,locale:'zh-CN',now:pageTime}));
    assert.ok((await snapshot()).includes(module));
    const empty=await execute(code,{resourceId:'missing'},contextId);assert.equal(empty.ok,false);assert.equal(empty.error.code,'EOG_GRAPH_NOT_FOUND');
    const graph=await execute('enterprise-operating-graph.create',{graphId:'graph:lazy'},contextId);assert.equal(graph.ok,true,JSON.stringify(graph));
    const [first,second]=await Promise.all([execute(code,{resourceId:'graph:lazy'},contextId),execute(code,{resourceId:'graph:lazy'},contextId)]);
    assert.equal(first.ok,true,JSON.stringify(first));assert.deepEqual(first,second);
    const viewFile=path.join(directory,'enterprise-operating-graph-views.json');const stored=fs.readFileSync(viewFile,'utf8');
    {const d=await call('/v1/disable',{packageId:'evo-enterprise-observatory'});assert.equal(d.status,200,JSON.stringify(d));}
    assert.equal((await page()).status,404);assert.equal((await execute(code,{resourceId:'graph:lazy'},contextId)).error.code,'ACTION_FEATURE_NOT_ACTIVE');assert.equal(fs.readFileSync(viewFile,'utf8'),stored);
    assert.equal((await call('/v1/enable',{packageId:'evo-enterprise-observatory'})).status,200);
    const restored=await page();assert.equal(restored.status,200);
    assert.deepEqual(restored.body,createEnterpriseOperatingGraphSpatialObservatoryPageV020({activeContext:original.body.requestValues.activeContext,locale:'zh-CN',now:new Date(restored.body.readPresets[0].values.timeLens.primary.endAt)}));assert.deepEqual(await execute(code,{resourceId:'graph:lazy'},contextId),first);
    child.kill('SIGTERM');timer=setTimeout(()=>child.kill('SIGKILL'),7000);assert.equal(await exited,0);assert.equal(stderr,'');
  } finally {clearTimeout(timer);if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await exited;}fs.rmSync(directory,{recursive:true,force:true});}
});
