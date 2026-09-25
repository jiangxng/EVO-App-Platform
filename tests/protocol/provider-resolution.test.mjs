import test from "node:test";
import assert from "node:assert/strict";

import { createProviderRuntimeRegistry } from "../../dist/providers/runtime-registry.js";
import { createMemoryProviderBindingStoreV010, resolveProviderRuntimeV010 } from "../../dist/manager/provider-resolution.js";

const descriptors = [
  { providerId: "alpha", capability: "llm.inference" },
  { providerId: "beta", capability: "llm.inference" }
];

test("single provider resolves automatically", () => {
  const registry = createProviderRuntimeRegistry();
  registry.replace("alpha", { id: "alpha-runtime" });
  const result = resolveProviderRuntimeV010(registry, descriptors, createMemoryProviderBindingStoreV010(), "llm.inference");
  assert.equal(result.providerId, "alpha");
  assert.equal(result.source, "SINGLE_CANDIDATE");
});

test("multiple providers require an explicit binding", () => {
  const registry = createProviderRuntimeRegistry();
  registry.replace("alpha", {});
  registry.replace("beta", {});
  assert.throws(() => resolveProviderRuntimeV010(registry, descriptors, createMemoryProviderBindingStoreV010(), "llm.inference"), /PROVIDER_RESOLUTION_AMBIGUOUS/);
});

test("enterprise binding overrides system binding", () => {
  const registry = createProviderRuntimeRegistry();
  registry.replace("alpha", { id: "alpha" });
  registry.replace("beta", { id: "beta" });
  const bindings = createMemoryProviderBindingStoreV010([
    { contractVersion: "0.1.0", capability: "llm.inference", providerId: "alpha", scope: "SYSTEM" },
    { contractVersion: "0.1.0", capability: "llm.inference", providerId: "beta", scope: "ENTERPRISE", scopeId: "enterprise-a" }
  ]);
  const result = resolveProviderRuntimeV010(registry, descriptors, bindings, "llm.inference", { enterpriseId: "enterprise-a" });
  assert.equal(result.providerId, "beta");
  assert.equal(result.scope, "ENTERPRISE");
});

test("binding to unavailable runtime fails closed", () => {
  const registry = createProviderRuntimeRegistry();
  registry.replace("alpha", {});
  const bindings = createMemoryProviderBindingStoreV010([{ contractVersion: "0.1.0", capability: "llm.inference", providerId: "beta", scope: "SYSTEM" }]);
  assert.throws(() => resolveProviderRuntimeV010(registry, descriptors, bindings, "llm.inference"), /PROVIDER_BINDING_UNAVAILABLE/);
});
