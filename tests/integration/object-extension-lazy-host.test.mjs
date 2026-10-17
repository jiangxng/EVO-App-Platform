import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork } from 'node:child_process';
import { createPersonalAgentExperienceProfileV010 } from '../../dist/manager/local-experience-profile.js';
import { createFileEnterpriseResourceRepositoryV010 } from '../../dist/providers/enterprise-context/resources.js';
import { createCounterpartyRepositoryV010 } from '../../dist/apps/counterparty/repository.js';
import { createObjectExtensionValueRepositoryV010 } from '../../dist/apps/object-extension/values.js';
import { OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010 } from '../../dist/apps/object-extension/constants.js';

test('real Host: cached import actions recover after object re-enable while management remains disabled', {timeout:45000}, async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'extension-lazy-host-'));
  const resourceFile=path.join(directory,'resources.json');
  const profile=createPersonalAgentExperienceProfileV010({PATH:process.env.PATH,PORT:'0',NODE_ENV:'test',APP_PLATFORM_STATE_FILE:path.join(directory,'state.json'),APP_PLATFORM_ENTERPRISE_GOVERNANCE_FILE:path.join(directory,'governance.json'),APP_PLATFORM_ENTERPRISE_RESOURCES_FILE:resourceFile,APP_PLATFORM_MANAGED_SESSION_ENABLED:'false',APP_PLATFORM_EXTERNAL_AGENT_OAUTH_ENABLED:'false',APP_PLATFORM_EXTERNAL_AGENT_MCP_ENABLED:'false'});
  const child=fork(path.resolve('dist/manager/server.js'),[],{execArgv:['--import',path.resolve('tools/plugin-loading-audit-probe.mjs')],env:profile.environment,stdio:['ignore','pipe','pipe','ipc']});
  child.stdout.resume();let stderr='',timer;child.stderr.on('data',part=>stderr+=part);
  const exited=new Promise(resolve=>child.once('exit',code=>resolve(code)));
  try{
    const sample=await new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('HOST_START_TIMEOUT')),30000);child.once('error',reject);child.once('exit',code=>reject(Error('HOST_EARLY_EXIT '+code+stderr)));child.on('message',x=>{if(x.kind==='host-baseline')resolve(x);});});
    clearTimeout(timer);assert.equal(sample.blockedOutbound,0);
    for(const module of ['repository','values'])assert.ok(!sample.loadedModules.includes(`dist/apps/object-extension/${module}.js`));
    const call=async(route,payload,contextId)=>{const response=await fetch(`http://127.0.0.1:${sample.port}${route}`,{method:'POST',signal:AbortSignal.timeout(10000),headers:{'content-type':'application/json',...(contextId?{'x-evo-context-id':contextId}:{})},body:JSON.stringify(payload)});return {status:response.status,body:await response.json()};};
    const execute=async(code,values,contextId)=>{const r=await call('/v1/actions',{contractVersion:'0.1.0',type:'command',command:{code,inputVersion:'0.1.0'},values,actionId:'extension-lazy-host',sourceInteractionId:'extension-lazy-host',requiresConfirmation:true},contextId);assert.equal(r.status,200,JSON.stringify(r));return r.body;};
    const created=await execute('enterprise.context.create',{displayName:'Isolated extension lifecycle',code:'EXTENSION_LAZY'});assert.equal(created.ok,true,JSON.stringify(created));const contextId=created.result.context?.contextId??created.result.contextId;assert.ok(contextId);
    for(const packageId of ['evo-counterparty','evo-data-import','evo-object-extension'])assert.equal((await call('/v1/install',{packageId})).status,200);
    const definition={contractVersion:'0.1.0',extensionId:'enterprise.test.bank',targetObjectType:'counterparty.subject',targetSlot:'counterparty.identity',namespace:'enterprise.test',fieldId:'bank',semanticType:'bank',valueType:'STRING',label:{default:'Bank'},required:false,order:1,surfaces:['DETAIL','IMPORT'],importable:true,exportable:true,agentReadable:false,agentWritable:false};
    assert.equal((await execute(OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010,{definition},contextId)).ok,true);
    async function importRow(code,bank){
      const bytes=Buffer.from(`code,displayName,subjectType,bank\n${code},Supplier ${code},ORGANIZATION,${bank}`);
      const stage=await execute('data-import.stage-file',{targetId:'counterparty.subject',file:{name:`${code}.csv`,mediaType:'text/csv',size:bytes.length,contentBase64:bytes.toString('base64')},parameter__relationshipMode:'SUPPLIER'},contextId);assert.equal(stage.ok,true,JSON.stringify(stage));const importJobId=stage.result.job.importJobId;
      const review=await execute('data-import.review',{importJobId,map_0:'code',map_1:'displayName',map_2:'subjectType',map_3:'bank'},contextId);assert.equal(review.ok,true,JSON.stringify(review));assert.equal(review.result.job.state,'DRY_RUN_READY');
      const commit=await execute('data-import.commit',{importJobId},contextId);assert.equal(commit.ok,true,JSON.stringify(commit));assert.equal(commit.result.job.state,'COMMITTED');
    }
    await importRow('FIRST','FirstBank'); // Warm each cached lazy action.
    assert.equal((await call('/v1/disable',{packageId:'evo-object-extension'})).status,200);
    assert.equal((await execute(OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010,{definition},contextId)).ok,false);
    assert.equal((await call('/v1/disable',{packageId:'evo-counterparty'})).status,200);
    assert.equal((await call('/v1/enable',{packageId:'evo-counterparty'})).status,200);
    await importRow('SECOND','SecondBank');
    child.kill('SIGTERM');timer=setTimeout(()=>child.kill('SIGKILL'),7000);assert.equal(await exited,0);assert.equal(stderr,'');clearTimeout(timer);
    const resources=createFileEnterpriseResourceRepositoryV010(resourceFile);const subjects=createCounterpartyRepositoryV010(resources).list(contextId);assert.equal(subjects.length,2);
    const values=createObjectExtensionValueRepositoryV010(resources);
    for(const [code,bank] of [['FIRST','FirstBank'],['SECOND','SecondBank']]){const subject=subjects.find(x=>x.code===code);assert.ok(subject);assert.equal(values.listForObject({contextId,objectType:'counterparty.subject',objectId:subject.counterpartyId})[0].values.bank,bank);}
  }finally{clearTimeout(timer);if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await exited;}fs.rmSync(directory,{recursive:true,force:true});}
});
