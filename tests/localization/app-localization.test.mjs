import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  enterpriseAgentExperienceAssets,
  enterpriseAgentPackage
} from "../../dist/agents/enterprise-agent/package.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  createPluginStorePage,
  pluginStoreExperienceManifest
} from "../../dist/manager/plugin-store-page.js";
import { appPlatformLocalizationBundles } from "../../dist/manager/localization.js";
import {
  createLocalizationRuntime,
  eidosAppHostLocalizationBundles,
  localizeAppHostPageDefinition
} from "../../dist/vendor/eidos/src/localization/index.js";

function loadedPluginStore(definition) {
  return {
    experienceId: pluginStoreExperienceManifest.experienceId,
    packageId: pluginStoreExperienceManifest.packageId,
    featureId: pluginStoreExperienceManifest.featureId,
    route: pluginStoreExperienceManifest.routes[0],
    page: pluginStoreExperienceManifest.pages[0],
    definition
  };
}

function loadedAgent(definition) {
  const manifest = enterpriseAgentPackage.features[0].contributions.find(
    contribution => contribution.kind === "eidos.experience"
  ).manifest;
  return {
    experienceId: manifest.experienceId,
    packageId: manifest.packageId,
    featureId: manifest.featureId,
    route: manifest.routes.find(route => route.pageId === "enterprise-agent.home"),
    page: manifest.pages.find(page => page.id === "enterprise-agent.home"),
    definition
  };
}

test("Personal Agent product chrome localizes across en zh-CN ja and zh-TW", () => {
  const manager = createAppManagerService(
    createPackageCatalog([enterpriseAgentPackage]),
    createMemoryLifecycleStore(),
    () => new Date("2026-09-26T00:00:00Z"),
    enterpriseAgentExperienceAssets
  );
  manager.install("enterprise-agent");

  const runtime = createLocalizationRuntime(
    [
      ...eidosAppHostLocalizationBundles,
      ...appPlatformLocalizationBundles,
      ...manager.listEffectiveLocalizationBundles()
    ],
    { locale: "en", fallbackLocales: ["en"] }
  );

  const base = enterpriseAgentExperienceAssets.get("app://enterprise-agent/pages/home");
  const expectations = [
    ["en", "Personal Agent", "Context", "How can I help?", "Ask or describe a task"],
    ["zh-CN", "个人 Agent", "上下文", "我可以帮你做什么？", "输入问题或描述任务"],
    ["ja", "パーソナルエージェント", "コンテキスト", "何をお手伝いしましょうか？", "質問やタスクを入力"],
    ["zh-TW", "個人 Agent", "上下文", "我可以如何協助你？", "輸入問題或描述工作"]
  ];

  for (const [locale, title, contextLabel, emptyTitle, placeholder] of expectations) {
    runtime.setLocale(locale);
    const localized = localizeAppHostPageDefinition(loadedAgent(base), runtime);
    assert.equal(localized.contractVersion, "0.2.0");
    assert.equal(localized.title, title);
    assert.equal(localized.context.label, contextLabel);
    assert.equal(localized.emptyState.title, emptyTitle);
    assert.equal(localized.composer.placeholder, placeholder);
    assert.equal(localized.emptyState.suggestions.length, 3);
  }
});

test("Plugin Store readiness chrome has four-locale resources", () => {
  const bundles = new Map(
    appPlatformLocalizationBundles.map(bundle => [bundle.locale, bundle])
  );
  for (const locale of ["en", "zh-CN", "ja", "zh-TW"]) {
    const bundle = bundles.get(locale);
    assert.ok(bundle, "missing App Platform locale " + locale);
    assert.ok(bundle.messages["extensions.evo.plugin-store.action.setup.label"]);
    assert.ok(bundle.messages["extensions.evo.plugin-store.technicalDetails"]);
    assert.ok(bundle.messages["extensions.evo.plugin-store.readiness.setup-required.label"]);
  }
});

test("App Host locale changes Plugin Store platform chrome", () => {
  const manager = createAppManagerService(
    createPackageCatalog([enterpriseAgentPackage]),
    createMemoryLifecycleStore()
  );
  manager.install("enterprise-agent");

  const runtime = createLocalizationRuntime(
    [
      ...eidosAppHostLocalizationBundles,
      ...appPlatformLocalizationBundles,
      ...manager.listEffectiveLocalizationBundles()
    ],
    { locale: "en", fallbackLocales: ["en"] }
  );

  const storeEn = localizeAppHostPageDefinition(
    loadedPluginStore(createPluginStorePage(
      [enterpriseAgentPackage],
      manager.getSnapshot()
    )),
    runtime
  );
  assert.equal(storeEn.title, "EVO Plugin Store");
  assert.equal(storeEn.items[0].status.label, "Enabled");

  runtime.setLocale("zh-CN");
  const storeZh = localizeAppHostPageDefinition(
    loadedPluginStore(createPluginStorePage(
      [enterpriseAgentPackage],
      manager.getSnapshot()
    )),
    runtime
  );
  assert.equal(storeZh.title, "EVO 插件商店");
  assert.equal(storeZh.items[0].status.label, "已启用");
});

test("application localization resources follow Feature lifecycle", () => {
  const manager = createAppManagerService(
    createPackageCatalog([enterpriseAgentPackage]),
    createMemoryLifecycleStore()
  );

  assert.deepEqual(manager.listEffectiveLocalizationBundles(), []);
  manager.install("enterprise-agent");
  assert.deepEqual(
    manager.listEffectiveLocalizationBundles().map(bundle => bundle.locale).sort(),
    ["en", "ja", "zh-CN", "zh-TW"].sort()
  );

  manager.disable("enterprise-agent");
  assert.deepEqual(manager.listEffectiveLocalizationBundles(), []);
});
