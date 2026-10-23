import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {createPersonalAgentExperienceProfileV010} from '../../dist/manager/local-experience-profile.js';
test('real Host observe/analyze commands stay unloaded until used and preserve fail-closed lifecycle', {timeout:45000}, async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'spatial-lazy-host-'));
  const resourceFile=path.join(directory,'resources.json');
  const profile=createPersonalAgentExperienceProfileV010({PATH:process.env.PATH,PORT:'0',NODE_ENV:'test',APP_PLATFORM_STATE_FILE:path.join(directory,'state.json'),APP_PLATFORM_ENTERPRISE_GOVERNANCE_FILE:path.join(directory,'governance.json'),APP_PLATFORM_ENTERPRISE_RESOURCES_FILE:resourceFile,APP_PLATFORM_MANAGED_SESSION_ENABLED:'false',APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED:'false',APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED:'false'});
  const child=fork(path.resolve('dist/manager/server.js'),[],{execArgv:['--import',path.resolve('tools/plugin-loading-audit-probe.mjs')],env:profile.environment,stdio:['ignore','pipe','pipe','ipc']});
  child.stdout.resume();let stderr='',timer;child.stderr.on('data',part=>stderr+=part);
  const exited=new Promise(resolve=>child.once('exit',code=>resolve(code)));
  try{
    const sample=await new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('HOST_START_TIMEOUT')),30000);child.once('error',reject);child.once('exit',code=>reject(Error('HOST_EARLY_EXIT '+code+stderr)));child.on('message',x=>{if(x.kind==='host-baseline')resolve(x);});});
    clearTimeout(timer);assert.equal(sample.blockedOutbound,0);
    assert.ok(!sample.loadedModules.includes('dist/apps/enterprise-observatory/observatory-actions.js'));
    const call=async(route,payload,contextId)=>{const response=await fetch(`http://127.0.0.1:${sample.port}${route}`,{method:'POST',signal:AbortSignal.timeout(10000),headers:{'content-type':'application/json',...(contextId?{'x-evo-context-id':contextId}:{})},body:JSON.stringify(payload)});return {status:response.status,body:await response.json()};};
    const execute=async(code,values,contextId)=>{const r=await call('/v1/actions',{contractVersion:'0.1.0',type:'command',command:{code,inputVersion:'0.1.0'},values,actionId:'spatial-lazy-host',sourceInteractionId:'spatial-lazy-host',requiresConfirmation:true},contextId);assert.equal(r.status,200,JSON.stringify(r));return r.body;};
    const created=await execute('enterprise.context.create',{displayName:'Isolated spatial lifecycle',code:'SPATIAL_LAZY'});assert.equal(created.ok,true,JSON.stringify(created));const contextId=created.result.context?.contextId??created.result.contextId;assert.ok(contextId);
    for(const packageId of ['evo-eog-2d','evo-eog-3d','evo-enterprise-observatory'])assert.equal((await call('/v1/install',{packageId})).status,200);
    const snapshot=async()=>{const id=crypto.randomUUID();return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{child.off('message',listener);reject(Error('MODULE_SNAPSHOT_TIMEOUT'));},5000);const listener=x=>{if(x.kind==='audit-module-snapshot'&&x.id===id){clearTimeout(timeout);child.off('message',listener);resolve(x.loadedModules);}};child.on('message',listener);child.send({kind:'audit-module-snapshot',id});});};
    const module='dist/apps/enterprise-observatory/observatory-actions.js';
    const codes=['enterprise-operating-graph.observatory.observe','enterprise-operating-graph.observatory.analyze'];
    const values={graphId:'eog:primary',timeLens:{contractVersion:'0.2.0',primary:{startAt:'2026-10-01T00:00:00.000Z',endAt:'2026-10-02T00:00:00.000Z'}}};
    assert.ok(!(await snapshot()).includes(module),'installed unused stays lazy');
    assert.equal((await call('/v1/disable',{packageId:'evo-enterprise-observatory'})).status,200);
    for(const code of codes) assert.equal((await execute(code,values,contextId)).error.code,'ACTION_FEATURE_NOT_ACTIVE');
    assert.ok(!(await snapshot()).includes(module),'denied commands do not load business implementation');
    assert.equal((await call('/v1/enable',{packageId:'evo-enterprise-observatory'})).status,200);
    const first=await Promise.all(codes.map(code=>execute(code,values,contextId)));
    for(const result of first){assert.equal(result.ok,false);assert.equal(result.error.code,'EOG_RUNTIME_PROVIDER_REQUIRED');}
    assert.ok((await snapshot()).includes(module));
    for(const code of codes){
      assert.equal((await execute(code,{},contextId)).error.code,'EOG_GRAPH_ID_REQUIRED');
      assert.equal((await execute(code,{graphId:'eog:primary'},contextId)).error.code,'EOG_TIME_LENS_INVALID');
    }
    assert.equal((await call('/v1/disable',{packageId:'evo-enterprise-observatory'})).status,200);
    for(const code of codes) assert.equal((await execute(code,values,contextId)).error.code,'ACTION_FEATURE_NOT_ACTIVE');
    assert.equal((await call('/v1/enable',{packageId:'evo-enterprise-observatory'})).status,200);
    assert.deepEqual(await Promise.all(codes.map(code=>execute(code,values,contextId))),first);
    child.kill('SIGTERM');timer=setTimeout(()=>child.kill('SIGKILL'),7000);assert.equal(await exited,0);assert.equal(stderr,'');
  } finally {clearTimeout(timer);if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await exited;}fs.rmSync(directory,{recursive:true,force:true});}
});
