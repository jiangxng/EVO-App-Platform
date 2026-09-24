import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { enterpriseAgentPackage } from "../../dist/agents/enterprise-agent/package.js";
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
    route: manifest.routes[0],
    page: manifest.pages[0],
    definition
  };
}

test("App Host locale changes platform chrome and app-owned Enterprise Agent text", () => {
  const manager = createAppManagerService(
    createPackageCatalog([enterpriseAgentPackage]),
    createMemoryLifecycleStore(),
    () => new Date("2026-09-24T00:00:00Z"),
    new Map()
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
  assert.equal(storeEn.items[0].primaryAction.label, "Open");
  assert.match(storeEn.items[0].summary, /provided capability/);

  const agentPage = {
    contractVersion: "0.1.0",
    kind: "chat",
    id: "enterprise-agent.home",
    title: "Enterprise Agent",
    command: { code: "enterprise-agent.chat", inputVersion: "0.1.0" },
    composer: {
      key: "message",
      placeholder: "Tell Enterprise Agent what you want to accomplish",
      sendLabel: "Send"
    },
    emptyState: "Ask Enterprise Agent to inspect, explain or prepare a change."
  };

  const agentEn = localizeAppHostPageDefinition(loadedAgent(agentPage), runtime);
  assert.equal(agentEn.title, "Enterprise Agent");
  assert.equal(agentEn.composer.sendLabel, "Send");
  assert.match(agentEn.emptyState, /Ask Enterprise Agent/);

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
  assert.equal(storeZh.items[0].primaryAction.label, "打开");
  assert.match(storeZh.items[0].summary, /提供/);

  const agentZh = localizeAppHostPageDefinition(loadedAgent(agentPage), runtime);
  assert.equal(agentZh.title, "企业智能体");
  assert.equal(agentZh.composer.placeholder, "告诉 Enterprise Agent 你要完成什么");
  assert.equal(agentZh.composer.sendLabel, "发送");
  assert.match(agentZh.emptyState, /Enterprise Agent/);
});

test("application localization resources follow Feature lifecycle", () => {
  const manager = createAppManagerService(
    createPackageCatalog([enterpriseAgentPackage]),
    createMemoryLifecycleStore()
  );

  assert.deepEqual(manager.listEffectiveLocalizationBundles(), []);
  manager.install("enterprise-agent");
  assert.deepEqual(
    manager.listEffectiveLocalizationBundles().map(bundle => bundle.locale),
    ["en", "zh-CN"]
  );

  manager.disable("enterprise-agent");
  assert.deepEqual(manager.listEffectiveLocalizationBundles(), []);
});
