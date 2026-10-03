import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  ENTERPRISE_APPLICATION_RUNTIME_BINDING_CAPABILITY_V010
} from "../../dist/contracts/enterprise-application-runtime-binding.js";
import {
  APPLICATION_RUNTIME_BINDING_PROVIDER_ID,
  applicationRuntimeBindingProviderPackage
} from "../../dist/providers/application-runtime-binding/package.js";
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
