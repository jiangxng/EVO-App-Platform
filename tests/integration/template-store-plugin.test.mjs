import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  TEMPLATE_STORE_DETAIL_PAGE_SOURCE,
  TEMPLATE_STORE_DETAIL_ROUTE,
  TEMPLATE_STORE_FEATURE_ID,
  TEMPLATE_STORE_PAGE_SOURCE,
  TEMPLATE_STORE_ROUTE,
  templateStorePackage
} from "../../dist/apps/template-store/package.js";
import {
  createTemplateStoreCatalogEntriesV010,
  createTemplateStoreDetailPageV010,
  createTemplateStorePageV010,
  templateStoreExperienceAssets
} from "../../dist/apps/template-store/experience-assets.js";
import {
  ledgerRuntimeBaselineTemplateV010
} from "../../dist/apps/template-store/templates.js";
import {
  templateStoreSeedRecordsV010
} from "../../dist/apps/template-store/seed-records.js";
import {
  renderAppHostPageToHtml
} from "../../dist/vendor/eidos/src/app-host/index.js";
import {
  renderCatalogBrowserToHtml
} from "../../dist/vendor/eidos/src/catalog-browser/render.js";

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
    definition.items[0].secondaryActions?.some(
      action => action.id === "detail"
    ),
    true
  );
  const previewAction = definition.items[0].secondaryActions?.find(
    action => action.id === "preview-2d"
  );
  assert.equal(previewAction?.enabled, false);
  assert.match(previewAction?.disabledReason, /2D Viewer/);

  const previewReady = createTemplateStorePageV010(
    undefined,
    { viewer2dAvailable: true, locale: "zh-CN" }
  );
  const previewReadyAction = previewReady.items[0].secondaryActions?.find(
    action => action.id === "preview-2d"
  );
  assert.equal(previewReadyAction?.enabled, true);
  assert.equal(previewReadyAction?.label, "预览");

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


test("Template Store package exposes a non-navigation detail route", () => {
  const manifest = templateStorePackage.features[0].contributions.find(
    contribution => contribution.kind === "eidos.experience"
  ).manifest;
  assert.equal(
    manifest.pages.some(page => page.source === TEMPLATE_STORE_DETAIL_PAGE_SOURCE),
    true
  );
  assert.equal(
    manifest.routes.some(route => route.path === TEMPLATE_STORE_DETAIL_ROUTE),
    true
  );
  assert.equal(
    manifest.navigation?.some(item => item.route === TEMPLATE_STORE_DETAIL_ROUTE) ?? false,
    false
  );
});

test("Template Store catalog reads latest immutable repository versions", () => {
  const latest = new Map();
  for (const record of templateStoreSeedRecordsV010) {
    const current = latest.get(record.templateId);
    if (!current || record.version > current.version) {
      latest.set(record.templateId, record);
    }
  }
  const entries = createTemplateStoreCatalogEntriesV010([...latest.values()]);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].version, 3);
  assert.equal(entries[0].projectionGallery?.primaryProjectionId, "projection:main");

  const page = createTemplateStorePageV010(entries, {
    viewer2dAvailable: true,
    locale: "zh-CN"
  });
  assert.equal(page.items[0].version, "v3");
  assert.equal(page.items[0].metadata["投影数量"], 1);
  assert.deepEqual(
    page.items[0].primaryAction.values,
    { templateVersion: 3 }
  );
  assert.deepEqual(
    page.items[0].secondaryActions.find(action => action.id === "detail")?.values,
    { templateVersion: 3 }
  );
});

test("Template Store detail renders every Projection Gallery item as an actionable 2D entry", () => {
  const record = templateStoreSeedRecordsV010.find(item => item.version === 3);
  assert.ok(record);
  const definition = createTemplateStoreDetailPageV010(record, {
    viewer2dAvailable: true,
    locale: "zh-CN"
  });
  assert.equal(definition.kind, "catalog-detail");
  assert.equal(definition.version, "v3");
  assert.equal(definition.gallery.items.length, 1);
  assert.equal(definition.gallery.primaryItemId, "projection:main");
  assert.equal(definition.gallery.maxItems, 9);
  assert.equal(definition.gallery.requireItemActions, true);
  assert.equal(
    definition.gallery.items[0].action.command,
    "evo-template-store.preview-2d"
  );
  assert.deepEqual(definition.gallery.items[0].action.values, {
    templateVersion: 3,
    projectionId: "projection:main"
  });

  const html = renderAppHostPageToHtml({
    experienceId: "evo-template-store",
    packageId: templateStorePackage.packageId,
    featureId: TEMPLATE_STORE_FEATURE_ID,
    route: {
      id: "evo-template-store.detail",
      path: TEMPLATE_STORE_DETAIL_ROUTE,
      pageId: "evo-template-store.detail"
    },
    page: {
      id: "evo-template-store.detail",
      source: TEMPLATE_STORE_DETAIL_PAGE_SOURCE
    },
    definition
  });
  assert.match(html, /data-eidos-capability="catalog-detail"/);
  assert.match(html, /data-eidos-media-id="projection:main"/);
  assert.match(html, /data-eidos-action-values=/);
  assert.match(html, /完整账本运行时/);
});
