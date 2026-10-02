import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createEnterpriseApplicationRuntimeBindingProviderV010
} from "../../dist/providers/application-runtime-binding/runtime.js";
import {
  createMemoryEnterpriseApplicationRuntimeBindingStoreV010
} from "../../dist/providers/application-runtime-binding/store.js";
import {
  createEogApplicationRuntimeBindingServiceV010
} from "../../dist/manager/enterprise-operating-graph-application-runtime-service.js";
import {
  createMemoryEogApplicationRuntimeBindingStoreV010
} from "../../dist/manager/enterprise-operating-graph-application-runtime-store.js";

test("provider-owned Application Runtime Binding preserves mapping semantics", () => {
  let tick = 0;
  const provider = createEnterpriseApplicationRuntimeBindingProviderV010({
    store: createMemoryEnterpriseApplicationRuntimeBindingStoreV010(),
    now: () => new Date(
      tick++ === 0
        ? "2026-10-02T00:00:00.000Z"
        : "2026-10-02T01:00:00.000Z"
    )
  });

  const first = provider.bind({
    enterpriseId: "enterprise:demo",
    hostApplicationRefId: "application:sales-order",
    runtimeProviderId: "evo.runtime-observatory",
    runtimeApplicationId: "sales-order-v1"
  });
  const changed = provider.bind({
    enterpriseId: "enterprise:demo",
    hostApplicationRefId: "application:sales-order",
    runtimeProviderId: "evo.runtime-observatory",
    runtimeApplicationId: "sales-order-v2"
  });

  assert.equal(first.bindingId, changed.bindingId);
  assert.equal(first.createdAt, changed.createdAt);
  assert.notEqual(first.updatedAt, changed.updatedAt);
  assert.equal(
    provider.resolve({
      enterpriseId: "enterprise:demo",
      hostApplicationRefId: "application:sales-order",
      runtimeProviderId: "evo.runtime-observatory"
    })?.runtimeApplicationId,
    "sales-order-v2"
  );
});

test("legacy manager API is only a compatibility re-export", async () => {
  assert.equal(
    createEogApplicationRuntimeBindingServiceV010,
    createEnterpriseApplicationRuntimeBindingProviderV010
  );
  assert.equal(
    createMemoryEogApplicationRuntimeBindingStoreV010,
    createMemoryEnterpriseApplicationRuntimeBindingStoreV010
  );

  const serviceSource = await readFile(
    "manager/enterprise-operating-graph-application-runtime-service.ts",
    "utf8"
  );
  const storeSource = await readFile(
    "manager/enterprise-operating-graph-application-runtime-store.ts",
    "utf8"
  );
  assert.equal(serviceSource.trim().startsWith("export {"), true);
  assert.equal(storeSource.trim().startsWith("export {"), true);
});

test("Host bootstrap consumes provider-owned implementation and preserves legacy path compatibility", async () => {
  const server = await readFile("manager/server.ts", "utf8");
  assert.equal(
    server.includes("../providers/application-runtime-binding/runtime.js"),
    true
  );
  assert.equal(
    server.includes("../providers/application-runtime-binding/store.js"),
    true
  );
  assert.equal(
    server.includes("./enterprise-operating-graph-application-runtime-service.js"),
    false
  );
  assert.equal(
    server.includes("APP_PLATFORM_APPLICATION_RUNTIME_BINDING_FILE"),
    true
  );
  assert.equal(
    server.includes("APP_PLATFORM_EOG_APPLICATION_RUNTIME_BINDING_FILE"),
    true
  );
});
