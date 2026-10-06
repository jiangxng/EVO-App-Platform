import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createMemorySettingsStore } from "../../dist/manager/settings-store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  createSettingsGroupPage,
  createSettingsIndexPage,
  createSettingsPage,
  validateAndMergeSettings
} from "../../dist/manager/settings-page.js";
import { createPluginStorePage } from "../../dist/manager/plugin-store-page.js";
import { openAiLlmProviderPackage } from "../../dist/providers/openai/package.js";
import { hostEncryptedSecretsProviderPackage } from "../../dist/providers/secrets/package.js";
import { createMemorySecretStoreV010 } from "../../dist/manager/secret-store.js";
import { createHostEncryptedSecretsProviderV010 } from "../../dist/providers/secrets/runtime.js";
import { enterpriseAgentPackage } from "../../dist/catalog/seed.js";
import { appPlatformLocalizationBundles } from "../../dist/manager/localization.js";

function settingsOf(page) {
  return page.groups.flatMap(group => group.settings);
}

test("settings contributions appear only after the owning package is installed", () => {
  const manager = createAppManagerService(
    createPackageCatalog([openAiLlmProviderPackage, hostEncryptedSecretsProviderPackage]),
    createMemoryLifecycleStore()
  );

  assert.deepEqual(manager.listInstalledSettings(), []);
  manager.install("openai-llm-provider");

  const settings = manager.listInstalledSettings();
  assert.equal(settings.length, 1);
  assert.equal(settings[0].namespace, "openai-llm-provider");
  assert.deepEqual(settings[0].properties.map(x => x.key), ["model", "baseUrl"]);

  manager.disable("openai-llm-provider");
  assert.equal(manager.listInstalledSettings().length, 1);
});

test("Settings Editor persists only declared non-secret settings", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([openAiLlmProviderPackage, hostEncryptedSecretsProviderPackage]),
    createMemoryLifecycleStore()
  );
  const store = createMemorySettingsStore();
  manager.install("openai-llm-provider");

  const secretStore = createMemorySecretStoreV010();
  const secrets = createHostEncryptedSecretsProviderV010(secretStore);
  const describe = reference => secrets.describe(reference);
  const initial = await createSettingsPage(manager, store, "openai-llm-provider", describe);
  assert.equal(initial.kind, "settings-editor");
  assert.equal(initial.contractVersion, "0.2.0");
  assert.equal(initial.namespace, "openai-llm-provider");
  assert.deepEqual(initial.groups.map(group => group.id), ["runtime", "credentials", "administration"]);
  assert.equal(initial.groups.find(group => group.id === "administration").advanced, true);
  const model = settingsOf(initial).find(x => x.key === "model");
  assert.equal(model.value, "gpt-5.6-luna");
  assert.equal(model.type, "select");
  assert.deepEqual(model.options, [
    { label: "GPT-5.6 Luna", value: "gpt-5.6-luna" }
  ]);
  const bootstrapAuthorization = initial.groups.find(group => group.id === "administration");
  assert.match(bootstrapAuthorization.title, /Bootstrap/);
  assert.match(settingsOf(initial).find(x => x.key === "adminToken").label, /Bootstrap/);
  assert.equal(settingsOf(initial).find(x => x.key === "secret:apiKey").type, "secret");
  assert.equal(settingsOf(initial).find(x => x.key === "secret:apiKey").value, "");
  assert.match(settingsOf(initial).find(x => x.key === "secret:apiKey").status.label, /Not configured/);
  assert.equal(store.getNamespace("openai-llm-provider").apiKey, undefined);

  const saved = validateAndMergeSettings(manager, store, "openai-llm-provider", {
    model: "gpt-5.6-luna",
    baseUrl: "https://example.invalid/v1",
    OPENAI_API_KEY: "must-not-be-persisted"
  });

  assert.equal(saved.model, "gpt-5.6-luna");
  assert.equal(saved.baseUrl, "https://example.invalid/v1");
  assert.equal(Object.prototype.hasOwnProperty.call(saved, "OPENAI_API_KEY"), false);

  const updated = await createSettingsPage(manager, store, "openai-llm-provider", describe);
  assert.equal(settingsOf(updated).find(x => x.key === "model").value, "gpt-5.6-luna");

  await secrets.put({
    contractVersion: "0.1.0",
    namespace: "openai-llm-provider",
    key: "apiKey",
    scope: "INSTALLATION",
    scopeId: "default"
  }, "sk-never-render-this");

  const zh = await createSettingsPage(
    manager,
    store,
    "openai-llm-provider",
    describe,
    { installationId: "default" },
    "zh-CN"
  );
  assert.match(settingsOf(zh).find(x => x.key === "secret:apiKey").status.label, /已配置/);
  assert.equal(settingsOf(zh).find(x => x.key === "secret:apiKey").value, "");
  assert.doesNotMatch(JSON.stringify(zh), /sk-never-render-this/);

  const ja = await createSettingsPage(
    manager,
    store,
    "openai-llm-provider",
    describe,
    { installationId: "default" },
    "ja"
  );
  const zhTw = await createSettingsPage(
    manager,
    store,
    "openai-llm-provider",
    describe,
    { installationId: "default" },
    "zh-TW"
  );
  assert.match(settingsOf(ja).find(x => x.key === "secret:apiKey").status.label, /設定済み/);
  assert.match(settingsOf(zhTw).find(x => x.key === "secret:apiKey").status.label, /已設定/);
  assert.doesNotMatch(JSON.stringify(ja), /sk-never-render-this/);
  assert.doesNotMatch(JSON.stringify(zhTw), /sk-never-render-this/);
});

test("invalid setting types and undeclared select values are rejected", () => {
  const manager = createAppManagerService(
    createPackageCatalog([openAiLlmProviderPackage, hostEncryptedSecretsProviderPackage]),
    createMemoryLifecycleStore()
  );
  const store = createMemorySettingsStore();
  manager.install("openai-llm-provider");

  assert.throws(
    () => validateAndMergeSettings(manager, store, "openai-llm-provider", {
      baseUrl: 42
    }),
    /SETTING_TYPE_INVALID/
  );
  assert.throws(
    () => validateAndMergeSettings(manager, store, "openai-llm-provider", {
      model: "undeclared-model"
    }),
    /SETTING_VALUE_INVALID/
  );
});

test("Settings index and Plugin Store expose Configure only for configurable installed packages", () => {
  const manager = createAppManagerService(
    createPackageCatalog([
      openAiLlmProviderPackage,
      hostEncryptedSecretsProviderPackage,
      enterpriseAgentPackage
    ]),
    createMemoryLifecycleStore()
  );
  manager.install("openai-llm-provider");
  manager.install("enterprise-agent");

  const index = createSettingsIndexPage(manager, "zh-CN");
  assert.deepEqual(index.items.map(item => item.id), [
    "business",
    "applications",
    "ai",
    "system"
  ]);
  assert.deepEqual(
    index.items.map(item => item.primaryAction.route),
    [
      "/settings/business",
      "/settings/applications",
      "/settings/ai",
      "/settings/system"
    ]
  );

  const system = createSettingsGroupPage(manager, "system", "en");
  assert.equal(
    system.items.some(item => item.id === "provider-bindings"),
    true
  );
  assert.equal(
    system.items.find(item => item.id === "openai-llm-provider")?.primaryAction.route,
    "/settings/openai-llm-provider"
  );

  const business = createSettingsGroupPage(manager, "business", "zh-CN");
  assert.deepEqual(
    business.items.map(item => item.primaryAction.route),
    ["/enterprise-contexts", "/ledger"]
  );

  const applications = createSettingsGroupPage(manager, "applications", "zh-CN");
  assert.deepEqual(
    applications.items.map(item => item.primaryAction.route),
    ["/store", "/templates"]
  );

  const ai = createSettingsGroupPage(manager, "ai", "zh-CN");
  assert.deepEqual(
    ai.items.map(item => item.primaryAction.route),
    ["/memory"]
  );

  const storePage = createPluginStorePage(
    [openAiLlmProviderPackage, enterpriseAgentPackage],
    manager.getSnapshot()
  );
  const openAi = storePage.items.find(item => item.id === "openai-llm-provider");
  const agent = storePage.items.find(item => item.id === "enterprise-agent");

  assert.equal(openAi.secondaryActions.some(action => action.id === "configure"), true);
  assert.equal(agent.secondaryActions.some(action => action.id === "configure"), false);
});


test("OpenAI Provider settings ship all four Personal Agent P0.4 locales", () => {
  const locales = openAiLlmProviderPackage.features[0].contributions
    .filter(contribution => contribution.kind === "eidos.localization-bundle")
    .map(contribution => contribution.bundle.locale)
    .sort();
  assert.deepEqual(locales, ["en", "ja", "zh-CN", "zh-TW"]);
});


test("llm.inference Provider selection ships all four P0.4 locales", () => {
  const locales = appPlatformLocalizationBundles
    .filter(bundle => bundle.namespace === "provider-binding:llm.inference")
    .map(bundle => bundle.locale)
    .sort();
  assert.deepEqual(locales, ["en", "ja", "zh-CN", "zh-TW"]);
  for (const locale of locales) {
    const bundle = appPlatformLocalizationBundles.find(
      item => item.namespace === "provider-binding:llm.inference" && item.locale === locale
    );
    assert.ok(bundle.messages["settings.providerId.label"]);
    assert.ok(bundle.messages["settings.saveLabel"]);
  }
});
