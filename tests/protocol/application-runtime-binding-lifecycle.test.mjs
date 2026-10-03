import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  ENTERPRISE_APPLICATION_RUNTIME_BINDING_CAPABILITY_V010
} from "../../dist/contracts/enterprise-application-runtime-binding.js";
import {
  APPLICATION_RUNTIME_BINDING_FEATURE_ID,
  APPLICATION_RUNTIME_BINDING_PACKAGE_ID,
  APPLICATION_RUNTIME_BINDING_PROVIDER_ID,
  applicationRuntimeBindingProviderPackage
} from "../../dist/providers/application-runtime-binding/package.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  createEnterpriseApplicationRuntimeBindingProviderV010
} from "../../dist/providers/application-runtime-binding/runtime.js";
import {
  createMemoryEnterpriseApplicationRuntimeBindingStoreV010
} from "../../dist/providers/application-runtime-binding/store.js";
import {
  createProviderRuntimeRegistry
} from "../../dist/providers/runtime-registry.js";
import {
  createMemoryProviderBindingStoreV010,
  resolveProviderRuntimeV010
} from "../../dist/manager/provider-resolution.js";

test("runtime registry presence alone does not bypass provider lifecycle descriptors", () => {
  const runtime = createEnterpriseApplicationRuntimeBindingProviderV010({
    store: createMemoryEnterpriseApplicationRuntimeBindingStoreV010()
  });
  const registry = createProviderRuntimeRegistry();
  registry.replace(APPLICATION_RUNTIME_BINDING_PROVIDER_ID, runtime);
  const bindings = createMemoryProviderBindingStoreV010();

  assert.equal(
    resolveProviderRuntimeV010(
      registry,
      [],
      bindings,
      ENTERPRISE_APPLICATION_RUNTIME_BINDING_CAPABILITY_V010,
      { installationId: "default" }
    ),
    undefined
  );

  const contribution =
    applicationRuntimeBindingProviderPackage.features[0]?.contributions?.[0];
  assert.equal(contribution?.kind, "platform.service-provider");
  const descriptor = contribution?.kind === "platform.service-provider"
    ? contribution.provider
    : undefined;
  assert.ok(descriptor);

  const resolved = resolveProviderRuntimeV010(
    registry,
    [descriptor],
    bindings,
    ENTERPRISE_APPLICATION_RUNTIME_BINDING_CAPABILITY_V010,
    { installationId: "default" }
  );
  assert.equal(resolved?.runtime, runtime);
});

test("Host Runtime Binding consumers resolve through installed provider descriptors", async () => {
  const server = await readFile("manager/server.ts", "utf8");

  assert.equal(
    server.includes("function resolveApplicationRuntimeBindingProvider()"),
    true
  );
  assert.equal(
    server.includes("manager.listEffectiveServiceProviders(\n      ENTERPRISE_APPLICATION_RUNTIME_BINDING_CAPABILITY_V010"),
    true
  );
  assert.equal(
    server.includes("return resolveApplicationRuntimeBindingProvider()?.resolve({"),
    true
  );
});

test("legacy configured bindings trigger package migration and activate the installed provider", async () => {
  const server = await readFile("manager/server.ts", "utf8");
  assert.equal(
    server.includes("applicationRuntimeBindingStore.snapshot().bindings.length > 0"),
    true
  );
  assert.equal(
    server.includes("evoObservatoryApplicationMap.length > 0"),
    true
  );
  assert.equal(
    applicationRuntimeBindingProviderPackage.features[0]?.defaultActivation,
    true
  );
});


test("legacy installed-but-inactive Runtime Binding package is repairable by enable", () => {
  const store = createMemoryLifecycleStore();
  store.saveInstalledPackage({
    packageId: APPLICATION_RUNTIME_BINDING_PACKAGE_ID,
    version: "0.1.0",
    installedAt: "2026-10-02T00:00:00.000Z",
    trustApproved: true,
    grantedPermissions: []
  });

  const manager = createAppManagerService(
    createPackageCatalog([applicationRuntimeBindingProviderPackage]),
    store,
    () => new Date("2026-10-03T12:30:00.000Z")
  );

  assert.equal(
    manager.getSnapshot().activeFeatures.some(
      item => item.featureId === APPLICATION_RUNTIME_BINDING_FEATURE_ID
    ),
    false
  );

  manager.enable(APPLICATION_RUNTIME_BINDING_PACKAGE_ID);

  assert.equal(
    manager.getSnapshot().activeFeatures.some(
      item => item.featureId === APPLICATION_RUNTIME_BINDING_FEATURE_ID
    ),
    true
  );
});

test("Host bootstrap repairs installed-but-inactive Runtime Binding state", async () => {
  const server = await readFile("manager/server.ts", "utf8");
  assert.equal(
    server.includes("item.featureId === APPLICATION_RUNTIME_BINDING_FEATURE_ID"),
    true
  );
  assert.equal(
    server.includes("manager.enable(APPLICATION_RUNTIME_BINDING_PACKAGE_ID)"),
    true
  );
});
