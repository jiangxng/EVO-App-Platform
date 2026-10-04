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
  assert.match(definition.items[0].summary, /BusinessData/);
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
  assert.match(html, /BusinessData/);
  assert.match(html, /data-eidos-catalog-action="copy"/);
  assert.match(html, /data-eidos-command="evo-template-store.copy"/);
});

test("built-in ledger runtime template preserves copy semantics without runtime linkage", () => {
  assert.equal(ledgerRuntimeBaselineTemplateV010.copyMode, "COPY");
  assert.equal(
    ledgerRuntimeBaselineTemplateV010.source.ownerProject,
    "EVO"
  );
  assert.equal(
    ledgerRuntimeBaselineTemplateV010.source.artifact,
    "ledger-runtime"
  );
});
