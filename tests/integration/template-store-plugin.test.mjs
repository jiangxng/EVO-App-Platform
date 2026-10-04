import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  TEMPLATE_STORE_FEATURE_ID,
  TEMPLATE_STORE_PAGE_SOURCE,
  TEMPLATE_STORE_ROUTE,
  templateStorePackage
} from "../../dist/apps/template-store/package.js";
import {
  createTemplateStorePageV010,
  templateStoreExperienceAssets
} from "../../dist/apps/template-store/experience-assets.js";
import {
  ledgerRuntimeBaselineTemplateV010
} from "../../dist/apps/template-store/templates.js";
import {
  renderAppHostPageToHtml
} from "../../dist/vendor/eidos/src/app-host/index.js";

test("Template Store is an installable APPLICATION plugin with no Enterprise Context dependency", () => {
  const feature = templateStorePackage.features[0];
  assert.equal(templateStorePackage.type, "APPLICATION");
  assert.deepEqual(feature.requiresCapabilities ?? [], []);
  assert.deepEqual(feature.providesCapabilities, ["template.store.browse"]);

  const manager = createAppManagerService(
    createPackageCatalog([templateStorePackage]),
    createMemoryLifecycleStore(),
    () => new Date("2026-10-04T00:00:00.000Z"),
    templateStoreExperienceAssets
  );

  assert.equal(manager.listEffectiveExperiences().length, 0);
  manager.install(templateStorePackage.packageId);

  assert.equal(
    manager.getSnapshot().activeFeatures.some(
      item => item.featureId === TEMPLATE_STORE_FEATURE_ID
    ),
    true
  );
  assert.equal(
    manager.listEffectiveExperiences()[0]?.defaultRoute,
    TEMPLATE_STORE_ROUTE
  );
});

test("Template Store v0.1 renders thumbnail, name and description for the ledger runtime baseline", () => {
  const definition = createTemplateStorePageV010();
  assert.equal(definition.items.length, 1);
  assert.equal(definition.items[0].title, "EVO 账本运行时基线");
  assert.match(definition.items[0].summary, /143 个应用/);
  assert.match(definition.items[0].summary, /912 条 Posting Rules/);
  assert.match(definition.items[0].thumbnail.src, /^data:image\/svg\+xml/);
  assert.equal(definition.items[0].primaryAction?.id, "copy");
  assert.equal(
    definition.items[0].primaryAction?.command,
    "evo-template-store.copy"
  );
  assert.equal(
    definition.items[0].primaryAction?.requiresConfirmation,
    true
  );
  assert.equal(
    definition.items[0].secondaryActions?.[0]?.id,
    "preview-2d"
  );
  assert.equal(
    definition.items[0].secondaryActions?.[0]?.enabled,
    false
  );
  assert.match(
    definition.items[0].secondaryActions?.[0]?.disabledReason,
    /2D Viewer/
  );

  const previewReady = createTemplateStorePageV010(
    undefined,
    { viewer2dAvailable: true, locale: "zh-CN" }
  );
  assert.equal(
    previewReady.items[0].secondaryActions?.[0]?.enabled,
    true
  );
  assert.equal(
    previewReady.items[0].secondaryActions?.[0]?.label,
    "预览"
  );

  const html = renderAppHostPageToHtml({
    experienceId: "evo-template-store",
    packageId: templateStorePackage.packageId,
    featureId: TEMPLATE_STORE_FEATURE_ID,
    route: {
      id: "evo-template-store.home",
      path: TEMPLATE_STORE_ROUTE,
      pageId: "evo-template-store.home"
    },
    page: {
      id: "evo-template-store.home",
      source: TEMPLATE_STORE_PAGE_SOURCE
    },
    definition
  });

  assert.match(html, /data-eidos-catalog-thumbnail/);
  assert.match(html, /EVO 账本运行时基线/);
  assert.match(html, /143 个应用/);
  assert.match(html, /912 条 Posting Rules/);
  assert.match(html, /data-eidos-catalog-action="copy"/);
  assert.match(html, /data-eidos-command="evo-template-store.copy"/);
  assert.match(html, /data-eidos-catalog-action="preview-2d"/);
  assert.match(html, /disabled/);
});

test("built-in ledger runtime template preserves copy semantics without runtime linkage", () => {
  assert.equal(ledgerRuntimeBaselineTemplateV010.copyMode, "COPY");
  assert.equal(
    ledgerRuntimeBaselineTemplateV010.source.ownerProject,
    "EVO"
  );
  assert.equal(
    ledgerRuntimeBaselineTemplateV010.source.artifact,
    "ledger-runtime-configurator/bookkeeping-default"
  );
});


test("Template Store zh-CN page localizes complete system chrome", () => {
  const definition = createTemplateStorePageV010(
    undefined,
    { viewer2dAvailable: false, locale: "zh-CN" }
  );
  assert.equal(definition.title, "模板商店");
  assert.equal(
    definition.description,
    "浏览共享模板。使用模板后会在企业上下文仓库中创建独立副本。"
  );
  assert.equal(definition.search?.placeholder, "搜索模板");
  assert.equal(definition.search?.ariaLabel, "搜索模板");
  assert.equal(definition.search?.noResultsMessage, "没有匹配的模板。");
  assert.equal(definition.emptyMessage, "暂无可用的共享模板。");
});

test("Eidos Catalog Browser keeps Template Store primary action on trailing edge", () => {
  const definition = createTemplateStorePageV010(
    undefined,
    { viewer2dAvailable: true, locale: "zh-CN" }
  );
  const html = renderCatalogBrowserToHtml(definition);
  assert.ok(
    html.indexOf('data-eidos-catalog-action="preview-2d"')
      < html.indexOf('data-eidos-catalog-action="copy"')
  );
  assert.match(
    html,
    /data-eidos-catalog-action="copy"[^>]*data-eidos-primary="true"/
  );
});
