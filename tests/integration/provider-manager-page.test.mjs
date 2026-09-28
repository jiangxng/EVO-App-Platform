import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createProviderRuntimeRegistry } from "../../dist/providers/runtime-registry.js";
import { createMemoryProviderBindingStoreV010 } from "../../dist/manager/provider-resolution.js";
import { appPlatformLocalizationBundles } from "../../dist/manager/localization.js";
import {
  createLocalizationRuntime,
  localizeAppHostPageDefinition
} from "../../dist/vendor/eidos/src/localization/index.js";
import {
  createProviderBindingPage,
  createProviderManagerExperienceManifest,
  createProviderManagerIndexPage
} from "../../dist/manager/provider-manager-page.js";

const providerPackage = {
  contractVersion: "0.1.0",
  packageId: "provider-pack",
  displayName: "Provider Pack",
  version: "0.1.0",
  type: "PLATFORM_PROVIDER",
  features: [{
    contractVersion: "0.1.0",
    featureId: "provider-pack.default",
    packageId: "provider-pack",
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    contributions: [
      {
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId: "alpha",
          capability: "llm.inference",
          providerContract: "evo.llm.inference",
          providerContractVersion: "0.1.0",
          binding: { type: "IN_PROCESS", ref: "runtime://alpha" }
        }
      }
    ]
  }]
};

function setup() {
  const catalog = createPackageCatalog([providerPackage]);
  const store = createMemoryLifecycleStore();
  store.saveInstalledPackage({
    packageId: "provider-pack",
    version: "0.1.0",
    installedAt: "2026-09-26T00:00:00.000Z"
  });
  store.saveActiveFeature({
    featureId: "provider-pack.default",
    packageId: "provider-pack",
    version: "0.1.0",
    activatedAt: "2026-09-26T00:00:00.000Z"
  });
  const manager = createAppManagerService(catalog, store);
  const registry = createProviderRuntimeRegistry();
  registry.replace("alpha", { id: "runtime" });
  registry.setHealth("alpha", {
    state: "HEALTHY",
    message: "ready"
  });
  const bindings = createMemoryProviderBindingStoreV010();
  return { manager, registry, bindings };
}

test("Provider Manager exposes capability page and health-aware summary", () => {
  const { manager, registry, bindings } = setup();
  const experience = createProviderManagerExperienceManifest(manager);
  assert.ok(experience.routes.some(route => route.path === "/providers/llm.inference"));

  const index = createProviderManagerIndexPage(manager, registry, bindings);
  assert.equal(index.items.length, 1);
  assert.match(index.items[0].summary, /alpha: healthy/);
  assert.match(index.items[0].summary, /single_candidate/);

  const page = createProviderBindingPage(
    manager,
    registry,
    bindings,
    "llm.inference"
  );
  assert.equal(page.contractVersion, "0.2.0");
  assert.equal(page.command.code, "app-platform.update-provider-binding");
  assert.deepEqual(
    page.groups.map(group => group.id),
    ["selection", "scope", "runtime-status", "administration"]
  );
  assert.equal(page.title, "AI service");
  assert.equal(page.saveLabel, "Save choice");
  assert.equal(page.notice.title, "Connection status");
  assert.equal(page.notice.message, "Provider Pack");
  const selection = page.groups.find(group => group.id === "selection");
  assert.equal(selection.advanced, undefined);
  assert.equal(selection.settings[0].label, "Service");
  assert.deepEqual(
    selection.settings[0].options.map(option => option.label),
    ["Provider Pack"]
  );
  const settings = page.groups.flatMap(group => group.settings);
  assert.ok(settings.some(field => field.key === "scope"));
  assert.ok(settings.some(field => field.key === "providerId"));
  const scopeGroup = page.groups.find(group => group.id === "scope");
  assert.equal(scopeGroup.advanced, true);
  const runtimeGroup = page.groups.find(group => group.id === "runtime-status");
  assert.equal(runtimeGroup.advanced, true);
  assert.ok(runtimeGroup.settings.every(field => field.readOnly === true));
  const administration = page.groups.find(group => group.id === "administration");
  assert.equal(administration.advanced, true);
  const adminToken = settings.find(field => field.key === "adminToken");
  assert.equal(adminToken.type, "secret");
  assert.equal(adminToken.value, "");
  assert.equal(page.notice.tone, "success");
});


test("AI service selection localizes novice copy while keeping scope machine values behind Advanced", () => {
  const { manager, registry, bindings } = setup();
  const definition = createProviderBindingPage(
    manager,
    registry,
    bindings,
    "llm.inference"
  );
  const page = {
    experienceId: "evo-provider-manager",
    packageId: "evo-app-platform",
    featureId: "evo-provider-manager.system",
    route: {
      id: "evo-providers.llm.inference",
      path: "/providers/llm.inference",
      pageId: "evo-providers.llm.inference"
    },
    page: {
      id: "evo-providers.llm.inference",
      source: "app://evo-app-platform/pages/providers/llm.inference"
    },
    definition
  };
  const expected = new Map([
    ["en", ["AI service", "System default"]],
    ["zh-CN", ["AI 服务", "系统默认"]],
    ["ja", ["AI サービス", "システム既定"]],
    ["zh-TW", ["AI 服務", "系統預設"]]
  ]);
  for (const [locale, [title, systemScope]] of expected) {
    const localized = localizeAppHostPageDefinition(
      page,
      createLocalizationRuntime(appPlatformLocalizationBundles, { locale })
    );
    assert.equal(localized.title, title);
    const scope = localized.groups.find(group => group.id === "scope");
    assert.equal(scope.advanced, true);
    assert.equal(
      scope.settings.find(setting => setting.key === "scope")
        .options.find(option => option.value === "SYSTEM").label,
      systemScope
    );
    assert.doesNotMatch(localized.description, /llm\.inference/);
  }
});
