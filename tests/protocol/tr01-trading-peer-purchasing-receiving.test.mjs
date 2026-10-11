import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

import {createPackageCatalog} from '../../dist/catalog/catalog.js';
import {createMemoryLifecycleStore} from '../../dist/manager/store.js';
import {createAppManagerService} from '../../dist/manager/service.js';
import {createPluginStorePage} from '../../dist/manager/plugin-store-page.js';
import {renderAppHostPageToHtml} from '../../dist/vendor/eidos/src/app-host/page-renderer.js';
import {
  purchasingStagePackageV010, purchasingStagePageV010
} from '../../dist/apps/trading-stage-purchasing/package.js';
import {
  receivingStagePackageV010, receivingStagePageV010
} from '../../dist/apps/trading-stage-receiving/package.js';
import {
  salesStagePackageV010, salesStagePageV010
} from '../../dist/apps/trading-stage-sales/package.js';
import {
  shipmentStagePackageV010, shipmentStagePageV010
} from '../../dist/apps/trading-stage-shipment/package.js';
import {
  receivableStagePackageV010, receivableStagePageV010
} from '../../dist/apps/trading-stage-receivable/package.js';
import {
  cashStagePackageV010, cashStagePageV010
} from '../../dist/apps/trading-stage-cash/package.js';
import {
  stagePackageIdV010, stagePageSourceV010, stageRouteV010
} from '../../dist/apps/trading-stage/demo-kit.js';

const domains=['purchasing','receiving','sales','shipment','receivable','cash'];
const packages=[
  purchasingStagePackageV010, receivingStagePackageV010,
  salesStagePackageV010, shipmentStagePackageV010,
  receivableStagePackageV010, cashStagePackageV010
];
const assets=new Map([
  [stagePageSourceV010('purchasing'), purchasingStagePageV010],
  [stagePageSourceV010('receiving'), receivingStagePageV010],
  [stagePageSourceV010('sales'), salesStagePageV010],
  [stagePageSourceV010('shipment'), shipmentStagePageV010],
  [stagePageSourceV010('receivable'), receivableStagePageV010],
  [stagePageSourceV010('cash'), cashStagePageV010]
]);

test('six distinct TR-01 native APPLICATION packages without an ERP monolith',()=>{
  assert.equal(new Set(packages.map(p=>p.packageId)).size,6);
  for(let i=0;i<packages.length;i++){
    const p=packages[i],feature=p.features[0],domain=domains[i];
    assert.equal(p.type,'APPLICATION');
    assert.equal(p.packageId,stagePackageIdV010(domain));
    assert.equal(feature.packageId,p.packageId);
    assert.equal(feature.activationScope,'INSTALLATION');
    assert.deepEqual(feature.requiresCapabilities??[],[],'each peer independently installable');
    assert.deepEqual(feature.providesCapabilities,['demo.tr01b.'+domain+'.read']);
    assert.equal(feature.contributions.filter(x=>x.kind==='eidos.experience').length,1);
    assert.equal(feature.contributions.filter(x=>x.kind==='eidos.localization-bundle').length,2);
    assert.equal(feature.contributions.some(x=>x.kind==='platform.capability-operation'),false,
      'never advertise an unavailable write capability');
  }
});

test('purchasing and receiving install independently, obey activation and render native Eidos',()=>{
  const manager=createAppManagerService(createPackageCatalog(packages),
    createMemoryLifecycleStore(),()=>new Date(),assets);
  const before=createPluginStorePage(packages,manager.getSnapshot());
  assert.equal(before.kind,'extension-manager');
  assert.ok(before.items.filter(x=>['evo-trading-stage-purchasing',
    'evo-trading-stage-receiving'].includes(x.id))
    .every(x=>x.status.id==='not-installed'));

  for(const d of ['purchasing','receiving']){
    assert.equal(manager.loadExperiencePage(stagePageSourceV010(d)),undefined);
    manager.install(stagePackageIdV010(d));
    const model=manager.loadExperiencePage(stagePageSourceV010(d));
    assert.equal(model.kind,'catalog-browser');
    assert.equal(model.items[0].metadata['生产认证'],'NOT_CERTIFIED');
    assert.equal(model.items[0].metadata['财务写入'],'禁止');
    assert.ok(model.items[0].badges.includes('SYNTHETIC'));
    assert.equal(model.items[0].primaryAction,undefined);
    const html=renderAppHostPageToHtml({
      experienceId:stagePackageIdV010(d),
      packageId:stagePackageIdV010(d),
      featureId:stagePackageIdV010(d)+'.default',
      route:{},page:{},definition:model
    });
    assert.match(html,/data-eidos-catalog/);
    assert.doesNotMatch(html,/<style\b/);
    assert.doesNotMatch(html,/finance-execution-allowed|data-finance-write/i);
  }
  assert.equal(purchasingStagePageV010.actions.find(x=>x.id==='continue')?.route,
    stageRouteV010('receiving'));

  manager.disable(stagePackageIdV010('receiving'));
  assert.equal(manager.loadExperiencePage(stagePageSourceV010('receiving')),undefined);
  assert.ok(manager.loadExperiencePage(stagePageSourceV010('purchasing')));
  manager.enable(stagePackageIdV010('receiving'));
  assert.ok(manager.loadExperiencePage(stagePageSourceV010('receiving')));
  manager.uninstall(stagePackageIdV010('purchasing'));
  assert.equal(manager.loadExperiencePage(stagePageSourceV010('purchasing')),undefined);
  assert.ok(manager.loadExperiencePage(stagePageSourceV010('receiving')));
});

test('new peer packages are app-local, no host/core/EVO engine import or finance execution',()=>{
  for(const domain of ['purchasing','receiving']){
    const body=readFileSync(new URL('../../apps/trading-stage-'+domain+
      '/package.ts',import.meta.url),'utf8');
    assert.match(body,/stagePackageV010/);
    const executable=body.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'');
    assert.doesNotMatch(executable,/manager\/|catalog\/seed|node:.*|ledger-entry|fifo|valuation|allocation|database|postgres|\.\.\/\.\.\/modules\//i);
  }
});
