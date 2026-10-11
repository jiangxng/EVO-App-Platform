import test from 'node:test';
import assert from 'node:assert/strict';
import { createPackageCatalog } from '../../dist/catalog/catalog.js';
import { createMemoryLifecycleStore } from '../../dist/manager/store.js';
import { createAppManagerService } from '../../dist/manager/service.js';
import { createPluginStorePage } from '../../dist/manager/plugin-store-page.js';
import { createTradingStagePreviewContributionV010 } from '../../dist/apps/trading-stage/host-preview.js';

test('six peer stage packages are absent unless explicitly opted into isolated synthetic preview',()=>{
  const beforeStage=process.env.APP_PLATFORM_STAGE_MODE;
  const beforeDemo=process.env.APP_PLATFORM_TR01B_STAGE_DEMO;
  try {
    delete process.env.APP_PLATFORM_STAGE_MODE;
    delete process.env.APP_PLATFORM_TR01B_STAGE_DEMO;
    assert.equal(createTradingStagePreviewContributionV010().packages.length,0);
    process.env.APP_PLATFORM_STAGE_MODE='isolated-preview';
    assert.equal(createTradingStagePreviewContributionV010().packages.length,0);
    process.env.APP_PLATFORM_TR01B_STAGE_DEMO='enabled';
    const {packages,experienceAssets}=createTradingStagePreviewContributionV010();
    assert.equal(packages.length,6);
    assert.equal(experienceAssets.size,6);
    const manager=createAppManagerService(createPackageCatalog(packages),createMemoryLifecycleStore(),()=>new Date(),experienceAssets);
    const listing=createPluginStorePage(manager.listCatalog(),manager.getSnapshot());
    assert.equal(listing.items.filter(x=>x.id.startsWith('evo-trading-stage-')).length,6);
    for(const pkg of packages) {
      assert.equal(manager.loadExperiencePage('app://'+pkg.packageId+'/pages/overview'),undefined);
      manager.install(pkg.packageId);
      const page=manager.loadExperiencePage('app://'+pkg.packageId+'/pages/overview');
      assert.equal(page?.kind,'catalog-browser');
      assert.equal(page?.items[0].metadata['生产认证'],'NOT_CERTIFIED');
      assert.deepEqual(page?.items[0].badges,['SYNTHETIC','READ-ONLY']);
    }
    const installed=createPluginStorePage(manager.listCatalog(),manager.getSnapshot());
    assert.equal(installed.items.filter(x=>x.id.startsWith('evo-trading-stage-')&&x.status.id==='enabled').length,6);
    manager.disable(packages[0].packageId);
    assert.equal(manager.loadExperiencePage('app://'+packages[0].packageId+'/pages/overview'),undefined);
    manager.uninstall(packages[1].packageId);
    assert.equal(manager.loadExperiencePage('app://'+packages[1].packageId+'/pages/overview'),undefined);
  } finally {
    if(beforeStage===undefined) delete process.env.APP_PLATFORM_STAGE_MODE;
    else process.env.APP_PLATFORM_STAGE_MODE=beforeStage;
    if(beforeDemo===undefined) delete process.env.APP_PLATFORM_TR01B_STAGE_DEMO;
    else process.env.APP_PLATFORM_TR01B_STAGE_DEMO=beforeDemo;
  }
});
