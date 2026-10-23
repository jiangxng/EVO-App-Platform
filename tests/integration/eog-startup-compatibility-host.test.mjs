import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {createEnterpriseOperatingGraphV010} from '../../dist/apps/eog-2d-designer/enterprise-operating-graph-model.js';
const graphModule='dist/apps/eog-2d-designer/legacy-definition-migration.js';
const sopModule='dist/providers/enterprise-context/eog-sop-migration.js';
const seedModule='dist/manager/eog-preview-seed.js';
const graph=createEnterpriseOperatingGraphV010({graphId:'graph:legacy',enterpriseId:'enterprise:test',createdAt:'2026-10-18T00:00:00Z'});
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'eog-compat-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
async function boot(dir,extra={},failure) {
  const child=fork(path.resolve('dist/manager/server.js'),[],{
    execArgv:['--import',path.resolve('tools/plugin-loading-audit-probe.mjs')],
    env:{PATH:process.env.PATH,PORT:'0',NODE_ENV:'test',APP_PLATFORM_STATE_FILE:path.join(dir,'state.json'),APP_PLATFORM_STARTUP_PROFILE:'minimal',APP_PLATFORM_MANAGED_SESSION_ENABLED:'true',...extra},
    stdio:['ignore','pipe','pipe','ipc']
  });child.stdout.resume();let stderr='',timer;child.stderr.on('data',x=>stderr+=x);
  const exit=new Promise(resolve=>child.once('exit',code=>resolve(code)));
  try {
    const result=await new Promise((resolve,reject)=>{
      timer=setTimeout(()=>reject(Error('START_TIMEOUT')),30000);
      child.once('error',reject);child.once('exit',code=>resolve({code}));
      child.on('message',m=>{if(m.kind==='host-baseline')resolve({sample:m});});
    });clearTimeout(timer);
    if(failure){assert.ok(!result.sample,'invalid compatibility data must fail before listening');assert.notEqual(result.code,0);assert.match(stderr,failure);return;}
    assert.ok(result.sample,stderr);assert.equal(result.sample.blockedOutbound,0);
    child.kill('SIGTERM');timer=setTimeout(()=>child.kill('SIGKILL'),7000);
    assert.equal(await exit,0);assert.equal(stderr,'');return result.sample;
  } finally {clearTimeout(timer);if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await exit;}}
}
function has(sample,module){return sample.loadedModules.includes(module);}
function revisions(dir){return JSON.parse(fs.readFileSync(path.join(dir,'enterprise-business-definitions.json'),'utf8')).revisions;}
test('empty real Host does not load migration or preview implementation', {timeout:40000},async t=>{
  const dir=fixture(t);const sample=await boot(dir,{APP_PLATFORM_EOG_PREVIEW_SEED_JSON:'  '});
  for(const module of [graphModule,sopModule,seedModule])assert.equal(has(sample,module),false,module);
  assert.equal(fs.existsSync(path.join(dir,'enterprise-business-definitions.json')),false);
});
test('legacy graph and SOP migrate before listening and remain unchanged on restart', {timeout:60000},async t=>{
  const dir=fixture(t);const gp=path.join(dir,'enterprise-operating-graphs.json'),sp=path.join(dir,'eog-expected-sops.json');
  fs.writeFileSync(gp,JSON.stringify({contractVersion:'0.1.0',graphs:[graph]}));
  fs.writeFileSync(sp,JSON.stringify({contractVersion:'0.1.0',sops:[{contractVersion:'0.1.0',sopId:'sop:legacy',enterpriseId:graph.enterpriseId,graphId:graph.graphId,title:'Legacy SOP',state:'DRAFT',revision:0,steps:[],createdAt:graph.createdAt,updatedAt:graph.updatedAt}]}));
  const original=[fs.readFileSync(gp,'utf8'),fs.readFileSync(sp,'utf8')];
  const first=await boot(dir);assert.ok(has(first,graphModule));assert.ok(has(first,sopModule));assert.equal(has(first,seedModule),false);
  const saved=revisions(dir);assert.equal(saved.length,2);assert.deepEqual(saved.map(r=>r.definitionId).sort(),['graph:legacy','sop:legacy']);
  await boot(dir);assert.deepEqual(revisions(dir),saved);assert.deepEqual([fs.readFileSync(gp,'utf8'),fs.readFileSync(sp,'utf8')],original);
  const altered={...graph,nodes:[{nodeId:'app:new',kind:'APPLICATION',semanticRef:{kind:'APPLICATION',authority:'HOST',refId:'app:new'}}]};
  fs.writeFileSync(gp,JSON.stringify({contractVersion:'0.1.0',graphs:[altered]}));
  await boot(dir,{},/BUSINESS_DEFINITION_MIGRATION_CONFLICT/);assert.deepEqual(revisions(dir),saved);
});
test('explicit preview loads only its compatibility module and remains idempotent', {timeout:60000},async t=>{
  const dir=fixture(t);const env={APP_PLATFORM_EOG_PREVIEW_SEED_JSON:JSON.stringify({enterpriseId:'enterprise:preview',graphId:'graph:preview',nodes:[{nodeId:'app:sales',kind:'APPLICATION',semanticRef:{kind:'APPLICATION',authority:'HOST',refId:'app:sales'}}]})};
  const sample=await boot(dir,env);assert.ok(has(sample,seedModule));assert.equal(has(sample,graphModule),false);assert.equal(has(sample,sopModule),false);
  const saved=revisions(dir);assert.equal(saved.at(-1).payload.nodes.length,1);await boot(dir,env);assert.deepEqual(revisions(dir),saved);
});
test('corrupt legacy files and invalid explicit preview still fail startup', {timeout:60000},async t=>{
  const dir=fixture(t),gp=path.join(dir,'enterprise-operating-graphs.json'),sp=path.join(dir,'eog-expected-sops.json');
  fs.writeFileSync(gp,'{');await boot(dir,{},/SyntaxError/);assert.equal(fs.readFileSync(gp,'utf8'),'{');fs.rmSync(gp);
  fs.writeFileSync(sp,JSON.stringify({contractVersion:'0.1.0',sops:null}));await boot(dir,{},/LEGACY_SOP_SNAPSHOT_INVALID/);fs.rmSync(sp);
  await boot(dir,{APP_PLATFORM_EOG_PREVIEW_SEED_JSON:'{}'},/EOG_PREVIEW_SEED_ENTERPRISE_ID_REQUIRED/);
  assert.equal(fs.existsSync(path.join(dir,'enterprise-business-definitions.json')),false);
});
