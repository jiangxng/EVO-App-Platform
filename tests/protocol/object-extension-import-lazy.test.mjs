import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryEnterpriseResourceRepositoryV010 } from '../../dist/providers/enterprise-context/resources.js';
import { createObjectExtensionRepositoryV010 } from '../../dist/apps/object-extension/repository.js';
import { createObjectExtensionActionHandlersV010 } from '../../dist/apps/object-extension/actions.js';
import { createAppActionRouter } from '../../dist/actions/router.js';
import * as commands from '../../dist/apps/object-extension/constants.js';
const list = commands.OBJECT_EXTENSION_DEFINITION_LIST_COMMAND_V010;
const upsert = commands.OBJECT_EXTENSION_DEFINITION_UPSERT_COMMAND_V010;
const archive = commands.OBJECT_EXTENSION_DEFINITION_ARCHIVE_COMMAND_V010;
const create = commands.OBJECT_EXTENSION_IMPORT_CREATE_COMMAND_V010;
const contextId = 'enterprise:lazy';
const context = { contractVersion:'0.1.0', principal:{contractVersion:'0.1.0',subjectId:'owner',actorType:'HUMAN',identityProviderId:'test',sessionId:'test'},
  scope:{contractVersion:'0.1.0',enterpriseId:'ent'}, context:{contractVersion:'0.1.0',activeContext:{contractVersion:'0.1.0',kind:'ENTERPRISE',contextId,enterpriseId:'ent'}} };
const request = (code, values={}) => ({contractVersion:'0.1.0',type:'command',command:{code,inputVersion:'0.1.0'},values,actionId:'lazy',sourceInteractionId:'test',requiresConfirmation:true});
const importValues = {importJobId:'job',sourceColumn:'Bank',label:'Bank',valueType:'STRING'};
const definition = {contractVersion:'0.1.0',extensionId:'test.bank',targetObjectType:'counterparty.subject',targetSlot:'counterparty.supplier-profile',namespace:'enterprise.test',fieldId:'bank',semanticType:'bank',valueType:'STRING',label:{default:'Bank'},required:false,order:1,surfaces:['DETAIL','EDIT','IMPORT'],importable:true,exportable:true,agentReadable:false,agentWritable:false};
function setup(options={}) {
  const repository = createObjectExtensionRepositoryV010(createMemoryEnterpriseResourceRepositoryV010());
  let job = {contractVersion:'0.1.0',importJobId:'job',targetId:'counterparty.subject',state:'STAGED',targetParameters:{relationshipMode:'SUPPLIER'},source:{kind:'ROWS',name:'test',headers:['Bank'],rows:[{Bank:'Sample'}]},mapping:[]};
  let loads=0, writes=0, active=true, authorized=true;
  const services = {
    assertAvailable() { if (!active) throw Error('ACTION_FEATURE_NOT_ACTIVE'); },
    applyImportMapping(values) { writes++; job={...job,mapping:values.mapping,ignoredSourceColumns:values.ignoredSourceColumns}; }
  };
  const handlers = createObjectExtensionActionHandlersV010({repository,
    canManageEnterpriseContext:()=>authorized,
    getImportJob:(id,key)=>id===contextId && key==='job'?job:undefined,
    async resolveImportServices(current) { loads++; assert.equal(current.targetId,'counterparty.subject'); await options.load?.(); return services; }
  });
  const router=createAppActionRouter(handlers,()=>active);
  return {repository,router,handlers,services,get loads(){return loads;},get writes(){return writes;},get job(){return job;},set job(v){job=v;},set active(v){active=v;},set authorized(v){authorized=v;}};
}

test('ordinary definition CRUD never resolves import dependencies and preserves enterprise resources', async()=>{
  const x=setup({load:()=>{throw Error('import engine unavailable');}});
  for (const [code,values] of [[upsert,{definition}],[list,{}],[archive,{extensionId:definition.extensionId}]]) {
    const result=await x.router.execute(request(code,values),context);
    assert.equal(result.ok,true,JSON.stringify(result));
  }
  assert.equal(x.loads,0); assert.equal(x.writes,0);
  assert.equal(x.repository.list(contextId).length,0);
});

test('inactive, unauthorized, missing context and invalid job requests resolve no import dependencies',async()=>{
  const x=setup();
  x.active=false;
  assert.equal((await x.router.execute(request(create,importValues),context)).error.code,'ACTION_FEATURE_NOT_ACTIVE');
  x.active=true; x.authorized=false;
  assert.equal((await x.router.execute(request(create,importValues),context)).error.code,'OBJECT_EXTENSION_MANAGE_ROLE_REQUIRED');
  x.authorized=true;
  assert.equal((await x.router.execute(request(create,importValues))).error.code,'REQUEST_CONTEXT_REQUIRED');
  assert.equal((await x.router.execute(request(create,{importJobId:'missing'}),context)).error.code,'OBJECT_EXTENSION_IMPORT_TARGET_INVALID');
  assert.equal(x.loads,0); assert.equal(x.repository.list(contextId).length,0);
});

test('authorized single-field import resolves per request and applies original mapping algorithm',async()=>{
  const x=setup();
  const result=await x.router.execute(request(create,importValues),context);
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(x.loads,1); assert.equal(x.writes,1);
  assert.equal(x.repository.list(contextId).length,1);
  assert.equal(x.job.mapping[0].targetFieldId,result.result.definition.fieldId);
  assert.equal(result.result.navigateTo,'/data-import/jobs/job/map');
  assert.deepEqual(x.job.source.rows,[{Bank:'Sample'}]);
});

test('authorized batch import uses lazy services and still creates and maps together',async()=>{
  const x=setup();
  const result=await x.router.execute(request(create,{importJobId:'job',batchMode:'BATCH',choice_0:'__CREATE__',label_0:'Bank',type_0:'STRING'}),context);
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(x.loads,1); assert.equal(x.writes,1);
  assert.equal(result.result.created.length,1);
  assert.equal(x.repository.list(contextId).length,1);
});

for (const revoke of ['active','authorized']) test(`revoking ${revoke} while loading prevents field and mapping writes`,async()=>{
  let release,started;
  const ready=new Promise(r=>started=r);
  const x=setup({load:()=>{started();return new Promise(r=>release=r);}});
  const pending=x.router.execute(request(create,importValues),context);
  await ready; x[revoke]=false; release();
  const result=await pending;
  assert.equal(result.ok,false);
  assert.equal(result.error.code,revoke==='active'?'ACTION_FEATURE_NOT_ACTIVE':'OBJECT_EXTENSION_MANAGE_ROLE_REQUIRED');
  assert.equal(x.writes,0); assert.equal(x.repository.list(contextId).length,0);
  x[revoke]=true;
  // Each request re-resolves; no cached stale authorization or failed promise.
  const retry=x.router.execute(request(create,importValues),context);
  await new Promise(r=>setImmediate(r)); release();
  assert.equal((await retry).ok,true);
});

test('dependency failure is retryable without creating an orphan field',async()=>{
  let fail=true;
  const x=setup({load:()=>{if(fail)throw Error('IMPORT_LOAD_FAILED');}});
  assert.equal((await x.router.execute(request(create,importValues),context)).error.code,'IMPORT_LOAD_FAILED');
  assert.equal(x.repository.list(contextId).length,0); assert.equal(x.writes,0);
  fail=false;
  assert.equal((await x.router.execute(request(create,importValues),context)).ok,true);
  assert.equal(x.loads,2); assert.equal(x.writes,1);
});


test('job committed while loading is reread and cannot receive a new field',async()=>{
  let release,started;
  const ready=new Promise(r=>started=r);
  const x=setup({load:()=>{started();return new Promise(r=>release=r);}});
  const pending=x.router.execute(request(create,importValues),context);
  await ready; x.job={...x.job,state:'COMMITTED'}; release();
  const result=await pending;
  assert.equal(result.ok,false);
  assert.equal(result.error.code,'DATA_IMPORT_JOB_ALREADY_COMMITTED');
  assert.equal(x.writes,0); assert.equal(x.repository.list(contextId).length,0);
});
