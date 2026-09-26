import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createMemorySettingsStore } from "../../dist/manager/settings-store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
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
  const initialSettings = initial.groups.flatMap(group => group.settings);
  assert.deepEqual(initial.groups.map(group => group.id), ["general", "credentials", "advanced"]);
  assert.equal(initial.groups.find(group => group.id === "advanced").advanced, true);
  assert.equal(initialSettings.find(x => x.key === "model").value, "gpt-5.6-luna");
  assert.equal(initialSettings.find(x => x.key === "secret:apiKey").type, "secret");
  assert.equal(initialSettings.find(x => x.key === "secret:apiKey").value, "");
  assert.match(initialSettings.find(x => x.key === "secret-status:apiKey").value, /Not configured/);
  assert.equal(store.getNamespace("openai-llm-provider").apiKey, undefined);

  const saved = validateAndMergeSettings(manager, store, "openai-llm-provider", {
    model: "gpt-test",
    baseUrl: "https://example.invalid/v1",
    OPENAI_API_KEY: "must-not-be-persisted"
  });

  assert.equal(saved.model, "gpt-test");
  assert.equal(saved.baseUrl, "https://example.invalid/v1");
  assert.equal(Object.prototype.hasOwnProperty.call(saved, "OPENAI_API_KEY"), false);

  const updated = await createSettingsPage(manager, store, "openai-llm-provider", describe);
  assert.equal(updated.groups.flatMap(group => group.settings).find(x => x.key === "model").value, "gpt-test");

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
  const zhSettings = zh.groups.flatMap(group => group.settings);
  assert.match(zhSettings.find(x => x.key === "secret-status:apiKey").value, /已配置/);
  assert.equal(zhSettings.find(x => x.key === "secret:apiKey").value, "");
  assert.doesNotMatch(JSON.stringify(zh), /sk-never-render-this/);
});

test("invalid setting types are rejected", () => {
  const manager = createAppManagerService(
    createPackageCatalog([openAiLlmProviderPackage, hostEncryptedSecretsProviderPackage]),
    createMemoryLifecycleStore()
  );
  const store = createMemorySettingsStore();
  manager.install("openai-llm-provider");

  assert.throws(
    () => validateAndMergeSettings(manager, store, "openai-llm-provider", {
      model: 42
    }),
    /SETTING_TYPE_INVALID/
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

  const index = createSettingsIndexPage(manager);
  assert.deepEqual(index.items.map(item => item.id), [
    "provider-bindings",
    "openai-llm-provider"
  ]);
  assert.equal(
    index.items.find(item => item.id === "openai-llm-provider").primaryAction.route,
    "/settings/openai-llm-provider"
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


test("OpenAI Provider settings support Japanese and Traditional Chinese grouped chrome", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([openAiLlmProviderPackage, hostEncryptedSecretsProviderPackage]),
    createMemoryLifecycleStore()
  );
  const store = createMemorySettingsStore();
  manager.install("openai-llm-provider");
  const secretStore = createMemorySecretStoreV010();
  const secrets = createHostEncryptedSecretsProviderV010(secretStore);
  const describe = reference => secrets.describe(reference);

  const ja = await createSettingsPage(manager, store, "openai-llm-provider", describe, { installationId: "default" }, "ja");
  const tw = await createSettingsPage(manager, store, "openai-llm-provider", describe, { installationId: "default" }, "zh-TW");
  assert.equal(ja.groups.find(group => group.id === "credentials").title, "認証情報");
  assert.equal(tw.groups.find(group => group.id === "credentials").title, "憑證");
  assert.equal(ja.groups.find(group => group.id === "advanced").advanced, true);
  assert.equal(tw.groups.find(group => group.id === "advanced").advanced, true);
});
