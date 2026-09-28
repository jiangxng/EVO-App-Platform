import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createProviderRuntimeRegistry } from "../../dist/providers/runtime-registry.js";
import { createMemoryProviderBindingStoreV010 } from "../../dist/manager/provider-resolution.js";
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
  const settings = page.groups.flatMap(group => group.settings);
  assert.ok(settings.some(field => field.key === "scope"));
  assert.ok(settings.some(field => field.key === "providerId"));
  const runtimeGroup = page.groups.find(group => group.id === "runtime-status");
  assert.ok(runtimeGroup.settings.every(field => field.readOnly === true));
  const administration = page.groups.find(group => group.id === "administration");
  assert.equal(administration.advanced, true);
  const adminToken = settings.find(field => field.key === "adminToken");
  assert.equal(adminToken.type, "secret");
  assert.equal(adminToken.value, "");
  assert.equal(page.notice.tone, "success");
});
