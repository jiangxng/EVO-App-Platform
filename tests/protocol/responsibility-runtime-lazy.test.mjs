import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createResponsibilityRuntimeHostV010 } from '../../dist/manager/responsibility-runtime.js';
import { createResponsibilityRepositoryV010 } from '../../dist/apps/responsibility/repository.js';
import { createResponsibilityActionHandlersV010 } from '../../dist/apps/responsibility/actions.js';
import { createCounterpartyRuntimeHostV010 } from '../../dist/manager/counterparty-runtime.js';
import { createMemoryEnterpriseResourceRepositoryV010, createFileEnterpriseResourceRepositoryV010 } from '../../dist/providers/enterprise-context/resources.js';
import { createPackageCatalog } from '../../dist/catalog/catalog.js';
import { createMemoryLifecycleStore } from '../../dist/manager/store.js';
import { createAppManagerService } from '../../dist/manager/service.js';
import { responsibilityPackage } from '../../dist/apps/responsibility/package.js';
import { counterpartyPackage } from '../../dist/apps/counterparty/package.js';
import { itemPackage } from '../../dist/apps/item/package.js';
import { warehousePackage } from '../../dist/apps/warehouse/package.js';
const assignment={contextId:'a',targetRef:{objectType:'counterparty.subject',objectId:'c1'},responsibilityType:'SALES_OWNER',assigneeRef:{kind:'PRINCIPAL',id:'u'},effectiveFrom:'2026-10-17T00:00:00Z',actorSubjectId:'u'};
const context={contractVersion:'0.1.0',principal:{subjectId:'u'},context:{activeContext:{kind:'ENTERPRISE',contextId:'a',enterpriseId:'e'}}};
function fixture(resources=createMemoryEnterpriseResourceRepositoryV010(),load) {
  let active=false,loads=0,creates=0;
  const host=createResponsibilityRuntimeHostV010({resources,isActive:()=>active,async loadFactory(){loads++;await load?.();return r=>{creates++;return createResponsibilityRepositoryV010(r);};}});
  return {host,resources,set active(v){active=v;},counts:()=>({loads,creates})};
}
test('inactive and unused dependency creates nothing; concurrent consumers share same adapter',async()=>{
  const x=fixture();await assert.rejects(x.host.resolve(),/NOT_ACTIVE/);x.active=true;
  assert.deepEqual(x.counts(),{loads:0,creates:0});
  const [a,b,c]=await Promise.all([x.host.resolve(),x.host.resolve(),x.host.resolve()]);
  assert.equal(a,b);assert.equal(b,c);assert.deepEqual(x.counts(),{loads:1,creates:1});
  a.assign(assignment);assert.equal(b.list('a').length,1);assert.equal(c.list('b').length,0);await x.host.stop();
});
test('stop revokes retained references permanently; re-enable and file restart preserve authority',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'responsibility-lazy-'));
  try {
    const file=path.join(dir,'resources.json');const x=fixture(createFileEnterpriseResourceRepositoryV010(file));x.active=true;
    const first=await x.host.resolve();assert.equal(fs.existsSync(file),false);const saved=first.assign(assignment);
    x.active=false;await x.host.stop();assert.throws(()=>first.list('a'),/NOT_ACTIVE/);
    x.active=true;const second=await x.host.resolve();assert.notEqual(first,second);assert.throws(()=>first.assign(assignment),/NOT_ACTIVE/);
    assert.equal(second.get('a',saved.assignmentId).assignmentId,saved.assignmentId);await x.host.stop();
    const restarted=fixture(createFileEnterpriseResourceRepositoryV010(file));restarted.active=true;assert.equal((await restarted.host.resolve()).list('a').length,1);await restarted.host.stop();
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('late factory cannot construct after disable/re-enable; load failures remain retryable',async()=>{
  let release,entered;const ready=new Promise(r=>entered=r);let hold=true;
  const x=fixture(undefined,()=>{if(hold){entered();return new Promise(r=>release=r);}});x.active=true;
  const loading=x.host.resolve();const rejected=assert.rejects(loading,/NOT_ACTIVE/);await ready;
  x.active=false;const stop=x.host.stop();x.active=true;release();await rejected;await stop;
  assert.equal(x.counts().creates,0);hold=false;await x.host.resolve();await x.host.stop();
  let fail=true;const y=fixture(undefined,()=>{if(fail)throw Error('LOAD_FAILED');});y.active=true;
  await assert.rejects(y.host.resolve(),/LOAD_FAILED/);fail=false;await y.host.resolve();assert.equal(y.counts().creates,1);await y.host.stop();
});
test('management authorization precedes dependency load and is rechecked after waiting',async()=>{
  let allowed=false,release,entered;const ready=new Promise(r=>entered=r);
  const x=fixture(undefined,()=>{entered();return new Promise(r=>release=r);});x.active=true;
  const [assign]=createResponsibilityActionHandlersV010({resolveRepository:x.host.resolve,canManageEnterpriseContext:()=>allowed});
  const request={values:{targetObjectType:'counterparty.subject',targetObjectId:'c1',responsibilityType:'SALES_OWNER'}};
  assert.equal((await assign.execute(request,context)).error.code,'RESPONSIBILITY_MANAGE_ROLE_REQUIRED');assert.equal(x.counts().loads,0);
  allowed=true;const call=assign.execute(request,context);await ready;allowed=false;release();
  assert.equal((await call).error.code,'RESPONSIBILITY_MANAGE_ROLE_REQUIRED');assert.equal(x.resources.list({contextId:'a',namespace:'evo.responsibility'}).length,0);await x.host.stop();
});
test('stopping one object runtime does not stop shared responsibility for another consumer',async()=>{
  const x=fixture();x.active=true;let objectActive=true;
  const cp=createCounterpartyRuntimeHostV010({isActive:()=>objectActive,dependencies:async()=>({resources:x.resources,responsibilityRepository:await x.host.resolve(),resolveAuthorizationProvider:()=>undefined})});
  await cp.resolve();const shared=await x.host.resolve();shared.assign(assignment);
  objectActive=false;await cp.stop();assert.equal(shared.list('a').length,1);assert.equal((await x.host.resolve()),shared);await x.host.stop();
});
test('real object manifests keep Responsibility protected until all active consumers stop',()=>{
  // Only the unrelated generic resource/directory provider is a fixture.
  const generic={contractVersion:'0.1.0',packageId:'fixture-generic',displayName:'Generic',version:'0.1.0',type:'RUNTIME_EXTENSION',features:[{contractVersion:'0.1.0',packageId:'fixture-generic',featureId:'fixture-generic.default',version:'0.1.0',activationScope:'INSTALLATION',defaultActivation:true,providesCapabilities:['enterprise.directory','enterprise.resource.repository']}]};
  const objects=[counterpartyPackage,itemPackage,warehousePackage];
  const manager=createAppManagerService(createPackageCatalog([generic,responsibilityPackage,...objects]),createMemoryLifecycleStore());
  for(const p of objects)manager.install(p.packageId);
  for(const p of objects){assert.ok(manager.planDisable(responsibilityPackage.packageId).blockers.some(b=>b.code==='ACTIVE_DEPENDENT_CAPABILITY'));manager.disable(p.packageId);}
  assert.deepEqual(manager.planDisable(responsibilityPackage.packageId).blockers,[]);manager.disable(responsibilityPackage.packageId);
});
test('management assign/archive retain normal behavior through the resolver',async()=>{
  const x=fixture();x.active=true;
  const [assign,archive]=createResponsibilityActionHandlersV010({resolveRepository:x.host.resolve,canManageEnterpriseContext:()=>true});
  assert.equal((await assign.execute({values:{}},undefined)).error.code,'REQUEST_CONTEXT_REQUIRED');assert.equal(x.counts().loads,0);
  const result=await assign.execute({values:{targetObjectType:'counterparty.subject',targetObjectId:'c1',responsibilityType:'SALES_OWNER'}},context);
  assert.equal(result.ok,true);assert.equal((await x.host.resolve()).list('a').length,1);
  assert.equal((await archive.execute({values:{assignmentId:result.result.assignment.assignmentId}},context)).ok,true);
  assert.equal((await x.host.resolve()).list('a').length,0);await x.host.stop();
});
test('Counterparty stop while awaiting shared dependency prevents late domain construction',async()=>{
  let release,entered;const ready=new Promise(r=>entered=r);let active=true,created=0;
  const x=fixture();x.active=true;
  const cp=createCounterpartyRuntimeHostV010({isActive:()=>active,loadFactory:async()=>()=>{created++;return {};},dependencies:async()=>{entered();await new Promise(r=>release=r);return {resources:x.resources,responsibilityRepository:await x.host.resolve(),resolveAuthorizationProvider:()=>undefined};}});
  const call=cp.resolve();const rejected=assert.rejects(call,/NOT_ACTIVE/);await ready;active=false;const stopped=cp.stop();release();await rejected;await stopped;assert.equal(created,0);await x.host.stop();
});
