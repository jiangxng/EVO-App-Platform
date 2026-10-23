import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createObjectExtensionDefinitionRuntimeHostV010, createObjectExtensionValueRuntimeHostV010 } from '../../dist/manager/object-extension-runtime.js';
import { createObjectExtensionRepositoryV010 } from '../../dist/apps/object-extension/repository.js';
import { createObjectExtensionValueRepositoryV010 } from '../../dist/apps/object-extension/values.js';
import { createObjectExtensionActionHandlersV010 } from '../../dist/apps/object-extension/actions.js';
import { createAppActionRouter } from '../../dist/actions/router.js';
import { OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010, OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010, OBJECT_EXTENSION_DEFINITION_ARCHIVE_COMMAND_V010 } from '../../dist/apps/object-extension/constants.js';
import { createMemoryEnterpriseResourceRepositoryV010, createFileEnterpriseResourceRepositoryV010 } from '../../dist/providers/enterprise-context/resources.js';
const definition={contractVersion:'0.1.0',extensionId:'enterprise.test.bank',targetObjectType:'counterparty.subject',targetSlot:'counterparty.identity',namespace:'enterprise.test',fieldId:'bank',semanticType:'bank',valueType:'STRING',label:{default:'Bank'},required:false,order:1,surfaces:['DETAIL','IMPORT'],importable:true,exportable:true,agentReadable:false,agentWritable:false};
const valueSet={contractVersion:'0.1.0',targetRef:{objectType:'counterparty.subject',objectId:'c1',slot:'counterparty.identity'},namespace:'enterprise.test',values:{bank:'Sample'}};
const context={contractVersion:'0.1.0',principal:{contractVersion:'0.1.0',subjectId:'owner',actorType:'HUMAN',identityProviderId:'test'},scope:{contractVersion:'0.1.0',enterpriseId:'e'},context:{contractVersion:'0.1.0',activeContext:{contractVersion:'0.1.0',kind:'ENTERPRISE',contextId:'a',enterpriseId:'e'}}};
const request=(code,values={})=>({contractVersion:'0.1.0',type:'command',command:{code,inputVersion:'0.1.0'},values,actionId:'test',sourceInteractionId:'test',requiresConfirmation:true});
const saved={contextId:'a',actorSubjectId:'owner',recordedAt:'2026-10-17T00:00:00Z'};
function fixture(kind='definition',resources=createMemoryEnterpriseResourceRepositoryV010(),load) {
  let active=false,loads=0,creates=0;
  const original=kind==='definition'?createObjectExtensionRepositoryV010:createObjectExtensionValueRepositoryV010;
  const create=kind==='definition'?createObjectExtensionDefinitionRuntimeHostV010:createObjectExtensionValueRuntimeHostV010;
  const host=create({resources,isActive:()=>active,async loadFactory(){loads++;await load?.();return r=>{creates++;return original(r);};}});
  return {host,resources,set active(v){active=v;},counts:()=>({loads,creates})};
}
for(const kind of ['definition','value']) test(`${kind}: inactive/unused zero construction, concurrent calls share, read facade has no mutations`,async()=>{
  const x=fixture(kind);await assert.rejects(x.host.resolveRead(),/NOT_ACTIVE/);x.active=true;assert.equal(x.counts().loads,0);
  const [a,b]=await Promise.all([x.host.resolveRead(),x.host.resolveRead()]);assert.equal(a,b);assert.deepEqual(x.counts(),{loads:1,creates:1});
  for(const key of ['save','archive','saveMany'])assert.equal(key in a,false);
  await x.host.stop();assert.throws(()=>kind==='definition'?a.list('a'):a.listForObject({contextId:'a',objectType:'counterparty.subject',objectId:'c1'}),/NOT_ACTIVE/);
});
test('management and two business consumers share data authority but have independent stops',async()=>{
  const resources=createMemoryEnterpriseResourceRepositoryV010();const management=fixture('definition',resources),a=fixture('definition',resources),b=fixture('definition',resources),values=fixture('value',resources);
  management.active=a.active=b.active=values.active=true;
  const writer=await management.host.resolveManage();writer.save({...saved,definition});
  const first=await a.host.resolveRead(),second=await b.host.resolveRead();assert.equal(first.list('a').length,1);
  management.active=false;await management.host.stop();assert.equal(second.list('a').length,1);
  (await values.host.resolveWrite()).save({...saved,valueSet});assert.equal((await values.host.resolveRead()).listForObject({contextId:'a',objectType:'counterparty.subject',objectId:'c1'}).length,1);
  a.active=false;await a.host.stop();assert.equal(second.list('a').length,1);assert.throws(()=>first.list('a'),/NOT_ACTIVE/);
  assert.deepEqual(second.list('b'),[]);await Promise.all([b.host.stop(),values.host.stop()]);
});
for(const kind of ['definition','value']) test(`${kind}: stop during loading rejects late construction; failure retries`,async()=>{
  let entered,release;const ready=new Promise(r=>entered=r);let hold=true;
  const x=fixture(kind,undefined,()=>{if(hold){entered();return new Promise(r=>release=r);}});x.active=true;
  const call=x.host.resolveRead();const rejected=assert.rejects(call,/NOT_ACTIVE/);await ready;x.active=false;const stop=x.host.stop();x.active=true;release();await rejected;await stop;assert.equal(x.counts().creates,0);
  hold=false;await x.host.resolveRead();await x.host.stop();
  let fail=true;const y=fixture(kind,undefined,()=>{if(fail)throw Error('LOAD_FAILED');});y.active=true;await assert.rejects(y.host.resolveRead(),/LOAD_FAILED/);fail=false;await y.host.resolveRead();assert.equal(y.counts().creates,1);await y.host.stop();
});
test('file restart and re-enable retain definitions/values while old writable references remain revoked',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'extension-lazy-'));
  try{
    const file=path.join(dir,'resources.json');const resources=createFileEnterpriseResourceRepositoryV010(file);const d=fixture('definition',resources),v=fixture('value',resources);d.active=v.active=true;
    const oldDefinition=await d.host.resolveManage(),oldValues=await v.host.resolveWrite();assert.equal(fs.existsSync(file),false);
    oldDefinition.save({...saved,definition});oldValues.saveMany({...saved,valueSets:[valueSet]});await Promise.all([d.host.stop(),v.host.stop()]);
    await d.host.resolveManage();await v.host.resolveWrite();assert.throws(()=>oldDefinition.save({...saved,definition}),/NOT_ACTIVE/);assert.throws(()=>oldValues.save({...saved,valueSet}),/NOT_ACTIVE/);
    await Promise.all([d.host.stop(),v.host.stop()]);const reopened=createFileEnterpriseResourceRepositoryV010(file),nextD=fixture('definition',reopened),nextV=fixture('value',reopened);nextD.active=nextV.active=true;
    assert.equal((await nextD.host.resolveRead()).list('a').length,1);assert.equal((await nextV.host.resolveRead()).listForObject({contextId:'a',objectType:'counterparty.subject',objectId:'c1'})[0].values.bank,'Sample');await Promise.all([nextD.host.stop(),nextV.host.stop()]);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('management resolver runs after qualification and rechecks revoked permission before save',async()=>{
  let entered,release;const ready=new Promise(r=>entered=r);let allowed=false;
  const x=fixture('definition',undefined,()=>{entered();return new Promise(r=>release=r);});x.active=true;
  const handlers=createObjectExtensionActionHandlersV010({resolveRepository:x.host.resolveManage,canManageEnterpriseContext:()=>allowed});const router=createAppActionRouter(handlers,()=>true);
  const req=request(OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010,{definition});assert.equal((await router.execute(req,context)).error.code,'OBJECT_EXTENSION_MANAGE_ROLE_REQUIRED');assert.equal((await router.execute(req)).error.code,'REQUEST_CONTEXT_REQUIRED');assert.equal(x.counts().loads,0);
  allowed=true;const call=router.execute(req,context);await ready;allowed=false;release();assert.equal((await call).error.code,'OBJECT_EXTENSION_MANAGE_ROLE_REQUIRED');assert.equal(x.resources.list({contextId:'a',namespace:'evo.object-extension'}).length,0);await x.host.stop();
});
test('lazy management CRUD preserves behavior and stale references cannot write after stop',async()=>{
  const x=fixture();x.active=true;const router=createAppActionRouter(createObjectExtensionActionHandlersV010({resolveRepository:x.host.resolveManage,canManageEnterpriseContext:()=>true}),()=>true);
  assert.equal((await router.execute(request(OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010,{definition}),context)).ok,true);
  assert.equal((await router.execute(request(OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010),context)).result.definitions.length,1);
  assert.equal((await router.execute(request(OBJECT_EXTENSION_DEFINITION_ARCHIVE_COMMAND_V010,{extensionId:definition.extensionId}),context)).ok,true);
  assert.equal((await x.host.resolveRead()).list('a').length,0);await x.host.stop();
});
test('lazy management import preserves mapping and rejects a stopped facade after service loading',async()=>{
  let active=true,hold=false,entered,release,writes=0;
  const ready=new Promise(r=>entered=r);const x=fixture();x.active=true;
  let job={contractVersion:'0.1.0',importJobId:'job',targetId:'counterparty.subject',state:'STAGED',targetParameters:{relationshipMode:'SUPPLIER'},source:{kind:'ROWS',name:'fixture',headers:['Bank'],rows:[{Bank:'Sample'}]},mapping:[]};
  const handlers=createObjectExtensionActionHandlersV010({resolveRepository:x.host.resolveManage,canManageEnterpriseContext:()=>true,getImportJob:()=>job,
    async resolveImportServices(){if(hold){entered();await new Promise(r=>release=r);}return {applyImportMapping(input){writes++;job={...job,mapping:input.mapping};}};}});
  const router=createAppActionRouter(handlers,()=>active);
  // Use the public constant rather than assuming the command spelling.
  const { OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010 }=await import('../../dist/apps/object-extension/constants.js');
  const req=request(OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010,{importJobId:'job',sourceColumn:'Bank',label:'Bank',valueType:'STRING'});
  assert.equal((await router.execute(req,context)).ok,true);assert.equal(writes,1);assert.equal(job.mapping.length,1);
  job={...job,mapping:[]};hold=true;const call=router.execute(req,context);await ready;active=false;x.active=false;await x.host.stop();release();
  assert.equal((await call).error.code,'PROVIDER_NOT_ACTIVE_OR_STOPPING');assert.equal(writes,1);
});
