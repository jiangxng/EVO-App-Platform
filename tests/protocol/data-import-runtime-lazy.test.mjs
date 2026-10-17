import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createDataImportRuntimeHostV010 } from '../../dist/manager/data-import-runtime.js';
import { createDataImportRuntimeV010 } from '../../dist/apps/data-import/runtime.js';
import { createDataImportServiceV010 } from '../../dist/apps/data-import/service.js';
import { assertDataImportManagementRequestV010 } from '../../dist/apps/data-import/management-access.js';
import { createObjectExtensionActionHandlersV010 } from '../../dist/apps/object-extension/actions.js';
import { createObjectExtensionRepositoryV010 } from '../../dist/apps/object-extension/repository.js';
import { createMemoryEnterpriseResourceRepositoryV010, createFileEnterpriseResourceRepositoryV010 } from '../../dist/providers/enterprise-context/resources.js';
const context={contractVersion:'0.1.0',principal:{contractVersion:'0.1.0',subjectId:'owner',actorType:'HUMAN'},context:{activeContext:{kind:'ENTERPRISE',contextId:'a',enterpriseId:'e'}}};
const base={contextId:'a',actorSubjectId:'owner',recordedAt:'2026-10-17T00:00:00Z'};
const source={kind:'ROWS',name:'fixture',headers:[],rows:[{}]};
const target={contractVersion:'0.1.0',targetId:'counterparty.subject',label:{default:'Fixture'},objectType:'counterparty.subject',ownerPackageId:'fixture',describe(){return {contractVersion:'0.1.0',objectType:'counterparty.subject',ownerPackageId:'fixture',baseSchemaRef:'fixture/0.1.0',locale:'en',activeRelationshipRoles:[],fields:[]};},validateRow(input){return {ok:true,prepared:{rowNumber:input.rowNumber,values:{}},issues:[]};},commitRow(){return {objectType:'counterparty.subject',objectId:'fixture-1'};}};
function fixture(options={}){let active=false,loads=0,creates=0;const resources=options.resources??createMemoryEnterpriseResourceRepositoryV010();const host=createDataImportRuntimeHostV010({isActive:()=>active,dependencies:{resources,...(options.advisor?{advisor:options.advisor}:{})},async loadFactory(){loads++;await options.load?.();return deps=>{creates++;return createDataImportRuntimeV010(deps);};}});return {host,resources,set active(v){active=v;},counts:()=>({loads,creates})};}
function service(runtime){return createDataImportServiceV010({repository:runtime.repository,recipeRepository:runtime.recipeRepository,targets:[target]});}
function seed(runtime,id='job'){return service(runtime).stage({...base,importJobId:id,targetId:target.targetId,source,mapping:[]});}

test('inactive and enabled-unused create nothing; concurrent first use shares original Job/Recipe adapters',async()=>{
  const x=fixture();await assert.rejects(x.host.resolve(),/NOT_ACTIVE/);x.active=true;assert.deepEqual(x.counts(),{loads:0,creates:0});
  const [a,b]=await Promise.all([x.host.resolve(),x.host.resolve()]);assert.equal(a,b);assert.deepEqual(x.counts(),{loads:1,creates:1});
  seed(a);assert.equal(b.repository.get('a','job').importJobId,'job');assert.equal(b.repository.get('b','job'),undefined);await x.host.stop();
});
test('Job and Recipe survive stop/re-enable/file restart; old writers remain revoked',async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'import-runtime-'));
  try{const file=path.join(directory,'resources.json');const x=fixture({resources:createFileEnterpriseResourceRepositoryV010(file)});x.active=true;
    const first=await x.host.resolve();assert.equal(fs.existsSync(file),false);seed(first);
    const recipe=first.recipeRepository.recordValidated({...base,targetId:target.targetId,source,targetSchemaDigest:'fixture-digest',mapping:[],importJobId:'job'});
    await x.host.stop();const next=await x.host.resolve();assert.notEqual(first,next);assert.throws(()=>first.repository.save({...base,job:next.repository.get('a','job')}),/NOT_ACTIVE/);assert.throws(()=>first.recipeRepository.list('a'),/NOT_ACTIVE/);
    assert.equal(next.recipeRepository.findBySource({contextId:'a',targetId:target.targetId,source}).recipeId,recipe.recipeId);assert.equal(next.repository.list('a').length,1);await x.host.stop();
    const y=fixture({resources:createFileEnterpriseResourceRepositoryV010(file)});y.active=true;const reopened=await y.host.resolve();assert.equal(reopened.repository.get('a','job').state,'STAGED');assert.equal(reopened.recipeRepository.list('a').length,1);assert.equal(reopened.recipeRepository.list('b').length,0);await y.host.stop();
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('stop during factory loading prevents late creation; failed loads retry',async()=>{
  let release,entered;const ready=new Promise(r=>entered=r);let hold=true;const x=fixture({load:()=>{if(hold){entered();return new Promise(r=>release=r);}}});x.active=true;
  const call=x.host.resolve();const rejected=assert.rejects(call,/NOT_ACTIVE/);await ready;x.active=false;const stop=x.host.stop();x.active=true;release();await rejected;await stop;assert.equal(x.counts().creates,0);hold=false;await x.host.resolve();await x.host.stop();
  let fail=true;const y=fixture({load:()=>{if(fail)throw Error('LOAD_FAILED');}});y.active=true;await assert.rejects(y.host.resolve(),/LOAD_FAILED/);fail=false;await y.host.resolve();assert.deepEqual(y.counts(),{loads:2,creates:1});await y.host.stop();
});
test('original import service validates and commits using guarded repositories; stale service cannot write after stop',async()=>{
  const x=fixture();x.active=true;const runtime=await x.host.resolve();const s=service(runtime);seed(runtime);
  assert.equal(s.dryRun({...base,importJobId:'job'}).state,'DRY_RUN_READY');const result=s.commit({...base,importJobId:'job'});assert.equal(result.state,'COMMITTED',JSON.stringify(result));
  await x.host.stop();assert.throws(()=>s.stage({...base,importJobId:'stale',targetId:target.targetId,source,mapping:[]}),/NOT_ACTIVE/);
  const next=await x.host.resolve();assert.equal(next.repository.get('a','job').state,'COMMITTED');assert.equal(next.repository.get('a','stale'),undefined);await x.host.stop();
});
test('shared management gate rejects invalid context/role before runtime acquisition',()=>{
  const x=fixture();x.active=true;
  assert.throws(()=>assertDataImportManagementRequestV010(undefined,()=>true),/REQUEST_CONTEXT_REQUIRED/);
  assert.throws(()=>assertDataImportManagementRequestV010({...context,context:{activeContext:{kind:'PERSONAL'}}},()=>true),/ENTERPRISE_CONTEXT_REQUIRED/);
  assert.throws(()=>assertDataImportManagementRequestV010(context,()=>false),/MANAGE_ROLE_REQUIRED/);assert.deepEqual(x.counts(),{loads:0,creates:0});
  assert.doesNotThrow(()=>assertDataImportManagementRequestV010(context,()=>true));
});
test('extension Job reader resolves only after qualification and rechecks authority before reading',async()=>{
  const x=fixture();x.active=true;const defs=createObjectExtensionRepositoryV010(x.resources);let allowed=false,entered,release,reads=0;
  const ready=new Promise(r=>entered=r);
  const handlers=createObjectExtensionActionHandlersV010({repository:defs,canManageEnterpriseContext:()=>allowed,async resolveImportJobReader(){entered();await new Promise(r=>release=r);const runtime=await x.host.resolve();return (...args)=>{reads++;return runtime.repository.get(...args);};}});
  const handler=handlers.find(x=>x.commandCode==='object-extension.definition.create-from-import');assert.ok(handler);
  const request={values:{importJobId:'job',sourceColumn:'Bank',label:'Bank',valueType:'STRING'}};
  assert.equal((await handler.execute(request,context)).error.code,'OBJECT_EXTENSION_MANAGE_ROLE_REQUIRED');assert.equal(x.counts().loads,0);
  allowed=true;const call=handler.execute(request,context);await ready;allowed=false;release();assert.equal((await call).error.code,'OBJECT_EXTENSION_MANAGE_ROLE_REQUIRED');assert.equal(reads,0);assert.equal(defs.list('a').length,0);await x.host.stop();
});
test('advisor is silent until used; stop drains accepted request and revokes old advisor after recovery',async()=>{
  let calls=0,release,entered;const ready=new Promise(r=>entered=r);let hold=true;
  const x=fixture({advisor:{baseUrl:'https://fixture.invalid',fetchImpl:async url=>{calls++;if(hold){entered();await new Promise(r=>release=r);}return new Response(JSON.stringify(url.endsWith('mapping-recommendations')?{recommendations:[]}:{observationRecordId:'o',patternRecordId:'p'}),{status:200,headers:{'content-type':'application/json'}});}}});x.active=true;
  const first=await x.host.resolve();assert.equal(calls,0);const input={tenantId:'e',targetId:target.targetId,sourceColumns:[],availableTargetFieldIds:[],targetSchemaDigest:'d'};
  const call=first.experienceAdvisor.recommend(input);await ready;const stop=x.host.stop();await assert.rejects(first.experienceAdvisor.recommend(input),/NOT_ACTIVE/);release();assert.deepEqual(await call,[]);await stop;
  hold=false;const next=await x.host.resolve();await assert.rejects(first.experienceAdvisor.recommend(input),/NOT_ACTIVE/);
  assert.deepEqual(await next.experienceAdvisor.recordSuccessful({tenantId:'e',targetId:target.targetId,sourceColumn:'Bank',targetFieldId:'bank',sourceHeaders:['Bank'],importJobId:'job',targetSchemaDigest:'d',observedAt:base.recordedAt}),{observationRecordId:'o',patternRecordId:'p'});assert.equal(calls,2);await x.host.stop();
});
test('ordinary extension management list does not acquire an import Job reader',async()=>{
  let reads=0;const resources=createMemoryEnterpriseResourceRepositoryV010();
  const handlers=createObjectExtensionActionHandlersV010({repository:createObjectExtensionRepositoryV010(resources),canManageEnterpriseContext:()=>true,async resolveImportJobReader(){reads++;throw Error('IMPORT_DISABLED');}});
  const { OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010 }=await import('../../dist/apps/object-extension/constants.js');
  const result=await handlers.find(x=>x.commandCode===OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010).execute({values:{}},context);assert.equal(result.ok,true);assert.equal(reads,0);
});
