import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createCounterpartyRuntimeHostV010 } from '../../dist/manager/counterparty-runtime.js';
import { createCounterpartyRuntimeV010 } from '../../dist/apps/counterparty/runtime.js';
import { createCounterpartyActionHandlersV010 } from '../../dist/apps/counterparty/actions.js';
import { createResponsibilityRepositoryV010 } from '../../dist/apps/responsibility/repository.js';
import { createMemoryEnterpriseResourceRepositoryV010, createFileEnterpriseResourceRepositoryV010 } from '../../dist/providers/enterprise-context/resources.js';
import { createAppActionRouter } from '../../dist/actions/router.js';
import { COUNTERPARTY_CREATE_COMMAND } from '../../dist/apps/counterparty/constants.js';
const context={contractVersion:'0.1.0',principal:{contractVersion:'0.1.0',subjectId:'owner',actorType:'HUMAN',identityProviderId:'test'},scope:{contractVersion:'0.1.0',enterpriseId:'e'},context:{contractVersion:'0.1.0',activeContext:{contractVersion:'0.1.0',kind:'ENTERPRISE',contextId:'a',enterpriseId:'e'}}};
const request={contractVersion:'0.1.0',type:'command',command:{code:COUNTERPARTY_CREATE_COMMAND,inputVersion:'0.1.0'},values:{subjectType:'ORGANIZATION',code:'S1',displayName:'Supplier'},actionId:'test',sourceInteractionId:'test',requiresConfirmation:true};
function fixture(resources=createMemoryEnterpriseResourceRepositoryV010(), load) {
  let active=false,loads=0,creates=0,authorized=true;
  const host=createCounterpartyRuntimeHostV010({isActive:()=>active,
    dependencies:{resources,responsibilityRepository:createResponsibilityRepositoryV010(resources),resolveAuthorizationProvider:()=>undefined},
    async loadFactory(){loads++;await load?.();return deps=>{creates++;return createCounterpartyRuntimeV010(deps);};}
  });
  const handlers=createCounterpartyActionHandlersV010({resolveRepositories:host.resolve,canManageEnterpriseContext:()=>authorized,idFactory:()=> 'cp-1'});
  const router=createAppActionRouter(handlers,()=>active);
  return {host,router,handlers,resources,set active(v){active=v;},set authorized(v){authorized=v;},counts:()=>({loads,creates})};
}

test('absent/disabled, active unused, denied Host and denied management create no business adapters',async()=>{
  const x=fixture();
  await assert.rejects(x.host.resolve(),/NOT_ACTIVE/);
  assert.equal((await x.router.execute(request,context)).error.code,'ACTION_FEATURE_NOT_ACTIVE');
  x.active=true; assert.deepEqual(x.counts(),{loads:0,creates:0});
  const denied=createAppActionRouter(x.handlers,()=>true,()=>({ok:false,error:{code:'CAPABILITY_DENIED',message:'denied'}}));
  assert.equal((await denied.execute(request,context)).error.code,'CAPABILITY_DENIED');
  x.authorized=false;
  assert.equal((await x.router.execute(request,context)).error.code,'COUNTERPARTY_MANAGE_ROLE_REQUIRED');
  assert.equal((await x.router.execute(request)).error.code,'REQUEST_CONTEXT_REQUIRED');
  assert.deepEqual(x.counts(),{loads:0,creates:0});
});

test('concurrent first use shares adapters; domain writes use original enterprise namespace and isolation',async()=>{
  const x=fixture();x.active=true;
  const [a,b]=await Promise.all([x.host.resolve(),x.host.resolve()]);
  assert.equal(a.repository,b.repository);assert.equal(a.roleRepository,b.roleRepository);
  assert.deepEqual(x.counts(),{loads:1,creates:1});
  const result=await x.router.execute(request,context);
  assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(a.repository.list('a').length,1);assert.equal(a.repository.list('b').length,0);
  assert.equal(x.resources.list({contextId:'a',namespace:'evo.counterparty'}).length,1);
});

test('stop and re-enable create fresh adapters while data survives; process restart attaches same file authority',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cp-lazy-'));
  try {
    const file=path.join(dir,'resources.json');const x=fixture(createFileEnterpriseResourceRepositoryV010(file));x.active=true;
    const first=await x.host.resolve();assert.equal(fs.existsSync(file),false,'construction does not provision storage');
    assert.equal((await x.router.execute(request,context)).ok,true);
    x.active=false;await x.host.stop();await assert.rejects(x.host.resolve(),/NOT_ACTIVE/);
    assert.throws(first.assertAvailable,/NOT_ACTIVE/);
    x.active=true;const second=await x.host.resolve();assert.notEqual(second.repository,first.repository);
    assert.equal(second.repository.list('a')[0].counterpartyId,'cp-1');await x.host.stop();
    const restarted=fixture(createFileEnterpriseResourceRepositoryV010(file));restarted.active=true;
    assert.equal((await restarted.host.resolve()).repository.list('a')[0].code,'S1');await restarted.host.stop();
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('disable and immediate re-enable during import cannot construct a late adapter; retry after stop works',async()=>{
  let release,entered;const ready=new Promise(r=>entered=r);
  const x=fixture(undefined,()=>{entered();return new Promise(r=>release=r);});x.active=true;
  const call=x.host.resolve();const rejected=assert.rejects(call,/NOT_ACTIVE/);await ready;
  x.active=false;const stop=x.host.stop();x.active=true;
  await assert.rejects(x.host.resolve(),/STOPPING/);release();await rejected;await stop;
  assert.equal(x.counts().creates,0);
  const retry=x.host.resolve();await new Promise(r=>setImmediate(r));release();await retry;
  assert.equal(x.counts().creates,1);await x.host.stop();
});

test('factory load failure retries without poisoning the shared lease',async()=>{
  let fail=true;const x=fixture(undefined,()=>{if(fail)throw Error('LOAD_FAILED');});x.active=true;
  await assert.rejects(x.host.resolve(),/LOAD_FAILED/);fail=false;await x.host.resolve();
  assert.deepEqual(x.counts(),{loads:2,creates:1});await x.host.stop();
});

test('management revocation while loading prevents mutation',async()=>{
  let release,entered;const ready=new Promise(r=>entered=r);
  const x=fixture(undefined,()=>{entered();return new Promise(r=>release=r);});x.active=true;
  const action=x.router.execute(request,context);await ready;x.authorized=false;release();
  assert.equal((await action).error.code,'COUNTERPARTY_MANAGE_ROLE_REQUIRED');
  assert.equal(x.resources.list({contextId:'a',namespace:'evo.counterparty'}).length,0);await x.host.stop();
});
