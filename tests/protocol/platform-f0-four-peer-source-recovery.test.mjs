// F0 source recovery: preserve the genuinely useful, non-economic assertions from
// tests/protocol/tr01b2d3-four-peer-stage-plugins.test.mjs at
// fb3db99272ef047aa7686715fd495545f9342ccf. Not a finance certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createPackageCatalog} from '../../dist/catalog/catalog.js';
import {createMemoryLifecycleStore} from '../../dist/manager/store.js';
import {createAppManagerService} from '../../dist/manager/service.js';
import {renderAppHostPageToHtml} from '../../dist/vendor/eidos/src/app-host/page-renderer.js';
import {
  salesStagePackageV010,salesStagePageV010
} from '../../dist/apps/trading-stage-sales/package.js';
import {
  shipmentStagePackageV010,shipmentStagePageV010
} from '../../dist/apps/trading-stage-shipment/package.js';
import {
  receivableStagePackageV010,receivableStagePageV010
} from '../../dist/apps/trading-stage-receivable/package.js';
import {
  cashStagePackageV010,cashStagePageV010
} from '../../dist/apps/trading-stage-cash/package.js';
import {
  stagePackageIdV010,stagePageSourceV010,stageRouteV010
} from '../../dist/apps/trading-stage/demo-kit.js';

const peers=[
  ['sales',salesStagePackageV010,salesStagePageV010],
  ['shipment',shipmentStagePackageV010,shipmentStagePageV010],
  ['receivable',receivableStagePackageV010,receivableStagePageV010],
  ['cash',cashStagePackageV010,cashStagePageV010]
];
const assets=new Map(peers.map(([domain,,page])=>[stagePageSourceV010(domain),page]));

test('F0 legacy four-peer capability scope stays installable but never becomes finance execution',()=>{
  assert.equal(new Set(peers.map(([,pkg])=>pkg.packageId)).size,4);
  for(const [domain,pkg] of peers){
    const feature=pkg.features[0];
    assert.equal(pkg.type,'APPLICATION');
    assert.equal(pkg.packageId,stagePackageIdV010(domain));
    assert.equal(feature.activationScope,'INSTALLATION');
    assert.deepEqual(feature.requiresCapabilities??[],[],'no hidden peer dependency');
    assert.deepEqual(feature.providesCapabilities,['demo.tr01b.'+domain+'.read']);
    assert.equal(feature.contributions.some(x=>x.kind==='platform.capability-operation'),false);
    assert.equal(feature.contributions.some(x=>x.kind==='platform.service-provider'),false);
    const experience=feature.contributions.find(x=>x.kind==='eidos.experience')?.manifest;
    assert.equal(experience?.defaultRoute,stageRouteV010(domain));
    assert.equal(experience?.pages[0]?.source,stagePageSourceV010(domain));
  }
});

test('F0 four peer experiences render through Eidos and remain independently disabled',()=>{
  const packages=peers.map(([,pkg])=>pkg);
  const manager=createAppManagerService(
    createPackageCatalog(packages),createMemoryLifecycleStore(),()=>new Date(),assets);
  for(const [domain,pkg] of peers){
    const source=stagePageSourceV010(domain);
    assert.equal(manager.loadExperiencePage(source),undefined);
    manager.install(pkg.packageId);
    const page=manager.loadExperiencePage(source);
    assert.equal(page?.kind,'catalog-browser');
    assert.equal(page?.items[0]?.metadata['生产认证'],'NOT_CERTIFIED');
    assert.equal(page?.items[0]?.metadata['财务写入'],'禁止');
    assert.ok(page?.items[0]?.badges.includes('SYNTHETIC'));
    assert.equal(page?.items[0]?.primaryAction,undefined);
    const html=renderAppHostPageToHtml({
      experienceId:pkg.packageId,packageId:pkg.packageId,
      featureId:pkg.features[0].featureId,route:{},page:{},definition:page
    });
    assert.match(html,/data-eidos-catalog/);
    assert.match(html,/SYNTHETIC/);
    assert.doesNotMatch(html,/<style\b/);
    assert.doesNotMatch(html,/finance-execution-allowed|data-finance-write/i);
  }
  // The old F0 peer-independence assertion was missing from the generic six-stage smoke test.
  const shipment=stagePackageIdV010('shipment');
  manager.disable(shipment);
  assert.equal(manager.loadExperiencePage(stagePageSourceV010('shipment')),undefined);
  for(const domain of ['sales','receivable','cash']){
    assert.ok(manager.loadExperiencePage(stagePageSourceV010(domain)),
      domain+' survives unrelated shipment disable');
  }
  manager.enable(shipment);
  assert.ok(manager.loadExperiencePage(stagePageSourceV010('shipment')));
  manager.uninstall(stagePackageIdV010('sales'));
  assert.equal(manager.loadExperiencePage(stagePageSourceV010('sales')),undefined);
  for(const domain of ['shipment','receivable','cash']){
    assert.ok(manager.loadExperiencePage(stagePageSourceV010(domain)));
  }
});
