import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

import {createPackageCatalog} from '../../dist/catalog/catalog.js';
import {createMemoryLifecycleStore} from '../../dist/manager/store.js';
import {createAppManagerService} from '../../dist/manager/service.js';
import {createPluginStorePage} from '../../dist/manager/plugin-store-page.js';
import {renderAppHostPageToHtml} from '../../dist/vendor/eidos/src/app-host/page-renderer.js';
import {
  salesStagePackageV010,shipmentStagePackageV010,
  receivableStagePackageV010,cashStagePackageV010,
  tradingStageExperienceAssetsV010
} from '../../dist/catalog/seed.js';
import {
  stagePackageIdV010,stagePageSourceV010,stageRouteV010,
  stagePreviewEnabledV010
} from '../../dist/apps/trading-stage/demo-kit.js';

const domains=['sales','shipment','receivable','cash'];
const packages=[salesStagePackageV010,shipmentStagePackageV010,
  receivableStagePackageV010,cashStagePackageV010];

test('TR-01B four peer apps are separate native installable APPLICATION packages with own Eidos Experience',()=>{
  assert.equal(new Set(packages.map(p=>p.packageId)).size,4);
  for(const [i,p] of packages.entries()){
    const domain=domains[i], feature=p.features[0];
    assert.equal(p.packageId,stagePackageIdV010(domain));
    assert.equal(p.type,'APPLICATION');
    assert.equal(p.contractVersion,'0.1.0');
    assert.equal(feature.packageId,p.packageId);
    assert.equal(feature.activationScope,'INSTALLATION');
    assert.equal(feature.defaultActivation,true);
    assert.deepEqual(feature.providesCapabilities,['demo.tr01b.'+domain+'.read']);
    assert.deepEqual(feature.requiresCapabilities??[],[],'peer stages are independently installable');
    const experience=feature.contributions.find(c=>c.kind==='eidos.experience').manifest;
    assert.equal(experience.packageId,p.packageId);
    assert.equal(experience.defaultRoute,stageRouteV010(domain));
    assert.equal(experience.pages[0].source,stagePageSourceV010(domain));
    assert.equal(feature.contributions.filter(c=>c.kind==='eidos.localization-bundle').length,2);
    assert.equal(feature.contributions.some(c=>c.kind==='platform.capability-operation'),false,
      'demo does not announce fake execution authority');
    assert.equal(feature.contributions.some(c=>c.kind==='platform.service-provider'),false,
      'Finance Owner stays separate internal-only Provider');
  }
});

test('TR-01B stage flag is OFF by default and requires two exact nonproduction choices',()=>{
  const oldMode=process.env.APP_PLATFORM_STAGE_MODE;
  const oldDemo=process.env.APP_PLATFORM_TR01B_STAGE_DEMO;
  try{
    delete process.env.APP_PLATFORM_STAGE_MODE;
    delete process.env.APP_PLATFORM_TR01B_STAGE_DEMO;
    assert.equal(stagePreviewEnabledV010(),false);
    process.env.APP_PLATFORM_TR01B_STAGE_DEMO='enabled';
    assert.equal(stagePreviewEnabledV010(),false);
    process.env.APP_PLATFORM_STAGE_MODE='production';
    assert.equal(stagePreviewEnabledV010(),false);
    process.env.APP_PLATFORM_STAGE_MODE='isolated-preview';
    assert.equal(stagePreviewEnabledV010(),true);
    process.env.APP_PLATFORM_TR01B_STAGE_DEMO='false';
    assert.equal(stagePreviewEnabledV010(),false);
  }finally{
    if(oldMode===undefined)delete process.env.APP_PLATFORM_STAGE_MODE;
    else process.env.APP_PLATFORM_STAGE_MODE=oldMode;
    if(oldDemo===undefined)delete process.env.APP_PLATFORM_TR01B_STAGE_DEMO;
    else process.env.APP_PLATFORM_TR01B_STAGE_DEMO=oldDemo;
  }
});

test('TR-01B real plugin Host lifecycle: install / independently open / disable / enable / uninstall via Eidos',()=>{
  const assets=new Map([
    ...tradingStageExperienceAssetsV010
  ]);
  assert.equal(assets.size,4,'CI opt-in stage flag must register exactly 4 page fixtures');
  const manager=createAppManagerService(createPackageCatalog(packages),
    createMemoryLifecycleStore(),()=>new Date(),assets);
  let page=createPluginStorePage(packages,manager.getSnapshot());
  assert.equal(page.kind,'extension-manager');
  for(const p of packages)assert.equal(page.items.find(x=>x.packageId===p.packageId)?.status.id,'not-installed');
  assert.match(renderAppHostPageToHtml({
    experienceId:'evo-plugin-store',packageId:'evo-app-platform',
    featureId:'evo-plugin-store.system',route:{},page:{},definition:page
  }),/data-eidos-extension-manager/);

  for(const [i,p] of packages.entries()){
    assert.equal(manager.loadExperiencePage(stagePageSourceV010(domains[i])),undefined);
    manager.install(p.packageId);
    const model=manager.loadExperiencePage(stagePageSourceV010(domains[i]));
    assert.equal(model.kind,'catalog-browser');
    assert.equal(model.id,p.packageId+'.overview');
    assert.equal(model.items[0].metadata['生产认证'],'NOT_CERTIFIED');
    assert.equal(model.items[0].metadata['财务写入'],'禁止');
    assert.ok(model.items[0].badges.includes('SYNTHETIC'));
    const html=renderAppHostPageToHtml({
      experienceId:p.packageId,packageId:p.packageId,
      featureId:p.features[0].featureId,
      route:{},page:{},definition:model
    });
    assert.match(html,/data-eidos-catalog/);
    assert.match(html,/SYNTHETIC/);
    assert.doesNotMatch(html,/<style\b/);
    assert.doesNotMatch(html,/finance-execution-allowed|data-finance-write/i);
    manager.disable(p.packageId);
    assert.equal(manager.loadExperiencePage(stagePageSourceV010(domains[i])),undefined);
    manager.enable(p.packageId);
    assert.ok(manager.loadExperiencePage(stagePageSourceV010(domains[i])));
  }
  for(const p of packages)manager.uninstall(p.packageId);
  for(const domain of domains)assert.equal(manager.loadExperiencePage(stagePageSourceV010(domain)),undefined);
  page=createPluginStorePage(packages,manager.getSnapshot());
  assert.ok(page.items.every(x=>x.status.id==='not-installed'));
});

test('TR-01B cross-plugin business reference is deterministic; each plugin owns one synthetic object',()=>{
  const pages=domains.map(k=>tradingStageExperienceAssetsV010.get(stagePageSourceV010(k)));
  const ids=['DEMO-SO-1001','DEMO-SHIP-1001','DEMO-AR-1001','DEMO-REC-1001'];
  assert.deepEqual(pages.map(p=>p.items[0].id),ids);
  for(let i=0;i<pages.length;i++){
    const p=pages[i];
    assert.equal(p.items[0].metadata['业务链订单'],'DEMO-SO-1001');
    assert.equal(p.items[0].status.tone,'neutral','demo must not claim verified production');
    assert.equal(p.items[0].primaryAction,undefined,'demo has no write operation');
    const forward=p.actions.find(a=>a.id==='continue');
    if(i<3){
      assert.equal(forward?.type,'navigate');
      assert.equal(forward?.route,stageRouteV010(domains[i+1]));
    }else assert.equal(forward,undefined,'cash is terminal stage');
    assert.equal(p.actions.find(a=>a.id==='open-store')?.route,'/store');
  }
});

test('TR-01B branch scope remains separate from real sales-loop, B2D3 owner and Eidos source',()=>{
  const check=(path,required)=>assert.match(
    readFileSync(new URL('../../'+path,import.meta.url),'utf8'),required);
  check('manager/server.ts',/APP_PLATFORM_STAGE_MODE === "isolated-preview"/);
  check('manager/server.ts',/APP_PLATFORM_TR01B_STAGE_DEMO === "enabled"/);
  check('catalog/seed.ts',/stagePreviewEnabledV010\(\)/);
  for(const key of ['sales','shipment','receivable','cash'])
    check('apps/trading-stage-'+key+'/package.ts',/stagePackageV010/);
  assert.equal(packages.some(x=>x.packageId==='evo-trading-finance-owner-provider'),false);
});
