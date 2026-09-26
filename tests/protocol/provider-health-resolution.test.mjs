import test from "node:test";
import assert from "node:assert/strict";

import { createProviderRuntimeRegistry } from "../../dist/providers/runtime-registry.js";
import {
  createMemoryProviderBindingStoreV010,
  resolveProviderRuntimeV010
} from "../../dist/manager/provider-resolution.js";

const descriptors = [
  { providerId: "alpha", capability: "llm.inference" },
  { providerId: "beta", capability: "llm.inference" }
];

test("explicit binding reports health and does not silently fail over", () => {
  const registry = createProviderRuntimeRegistry();
  registry.replace("alpha", { id: "alpha" });
  registry.replace("beta", { id: "beta" });
  registry.setHealth("alpha", {
    state: "UNAVAILABLE",
    message: "probe failed"
  });
  registry.setHealth("beta", {
    state: "HEALTHY"
  });

  const bindings = createMemoryProviderBindingStoreV010([{
    contractVersion: "0.1.0",
    capability: "llm.inference",
    providerId: "alpha",
    scope: "SYSTEM"
  }]);

  assert.throws(
    () => resolveProviderRuntimeV010(
      registry,
      descriptors,
      bindings,
      "llm.inference"
    ),
    /PROVIDER_BINDING_UNHEALTHY/
  );
});

test("single candidate returns its health posture", () => {
  const registry = createProviderRuntimeRegistry();
  registry.replace("alpha", { id: "alpha" });
  registry.setHealth("alpha", {
    state: "DEGRADED",
    message: "high latency"
  });

  const result = resolveProviderRuntimeV010(
    registry,
    [descriptors[0]],
    createMemoryProviderBindingStoreV010(),
    "llm.inference"
  );

  assert.equal(result.providerId, "alpha");
  assert.equal(result.health.state, "DEGRADED");
});
