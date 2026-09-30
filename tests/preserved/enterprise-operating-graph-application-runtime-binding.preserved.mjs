import test from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryEogApplicationRuntimeBindingStoreV010
} from "../../dist/manager/enterprise-operating-graph-application-runtime-store.js";
import {
  createEogApplicationRuntimeBindingServiceV010
} from "../../dist/manager/enterprise-operating-graph-application-runtime-service.js";

test("Host Application runtime bindings are explicit, stable and provider-scoped", () => {
  let tick = 0;
  const service = createEogApplicationRuntimeBindingServiceV010({
    store: createMemoryEogApplicationRuntimeBindingStoreV010(),
    now: () => new Date(
      tick++ === 0
        ? "2026-09-29T01:00:00.000Z"
        : "2026-09-29T02:00:00.000Z"
    )
  });

  const first = service.bind({
    enterpriseId: "enterprise:demo",
    hostApplicationRefId: "application:sales-order",
    runtimeProviderId: "evo.runtime-observatory",
    runtimeApplicationId: "legacy-sales-order"
  });
  const changed = service.bind({
    enterpriseId: "enterprise:demo",
    hostApplicationRefId: "application:sales-order",
    runtimeProviderId: "evo.runtime-observatory",
    runtimeApplicationId: "sales-order-v2"
  });

  assert.equal(first.bindingId, changed.bindingId);
  assert.equal(first.createdAt, changed.createdAt);
  assert.notEqual(first.updatedAt, changed.updatedAt);
  assert.equal(
    service.resolve({
      enterpriseId: "enterprise:demo",
      hostApplicationRefId: "application:sales-order",
      runtimeProviderId: "evo.runtime-observatory"
    }).runtimeApplicationId,
    "sales-order-v2"
  );
});

test("one runtime Application identity cannot silently bind to two Host Applications", () => {
  const service = createEogApplicationRuntimeBindingServiceV010({
    store: createMemoryEogApplicationRuntimeBindingStoreV010(),
    now: () => new Date("2026-09-29T01:00:00.000Z")
  });

  service.bind({
    enterpriseId: "enterprise:demo",
    hostApplicationRefId: "application:sales-order",
    runtimeProviderId: "evo.runtime-observatory",
    runtimeApplicationId: "sales-order"
  });

  assert.throws(
    () => service.bind({
      enterpriseId: "enterprise:demo",
      hostApplicationRefId: "application:other",
      runtimeProviderId: "evo.runtime-observatory",
      runtimeApplicationId: "sales-order"
    }),
    /EOG_APPLICATION_RUNTIME_IDENTITY_DUPLICATE/
  );
});
