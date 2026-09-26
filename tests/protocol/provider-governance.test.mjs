import test from "node:test";
import assert from "node:assert/strict";

import {
  authorizeProviderAdministrationV010,
  createMemoryProviderBindingAuditStoreV010,
  providerAuditEventV010
} from "../../dist/manager/provider-governance.js";
import { createProviderRuntimeRegistry } from "../../dist/providers/runtime-registry.js";

test("Provider administration fails closed without configured Host authorization", () => {
  const decision = authorizeProviderAdministrationV010("anything", undefined);
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "PROVIDER_ADMIN_AUTH_NOT_CONFIGURED");
});

test("Provider administration accepts only exact configured secret", () => {
  assert.equal(authorizeProviderAdministrationV010("secret", "secret").allowed, true);
  assert.equal(authorizeProviderAdministrationV010("wrong", "secret").allowed, false);
  assert.equal(authorizeProviderAdministrationV010(undefined, "secret").allowed, false);
});

test("Provider governance audit never needs secret material", () => {
  const store = createMemoryProviderBindingAuditStoreV010();
  store.append(providerAuditEventV010({
    action: "UPDATE_PROVIDER_BINDING",
    outcome: "ALLOWED",
    actorId: "bootstrap-admin",
    correlationId: "corr-1",
    capability: "llm.inference",
    providerId: "alpha",
    scope: "SYSTEM",
    reason: "BOOTSTRAP_ADMIN_TOKEN_ACCEPTED"
  }, () => new Date("2026-09-26T00:00:00.000Z")));

  const [event] = store.list();
  assert.equal(event.capability, "llm.inference");
  assert.equal(event.outcome, "ALLOWED");
  assert.equal(Object.hasOwn(event, "adminToken"), false);
});

test("active Provider health probe updates registry posture", async () => {
  const registry = createProviderRuntimeRegistry();
  registry.replace("alpha", { id: "runtime" });
  registry.setHealthProbe("alpha", async () => ({
    state: "HEALTHY",
    message: "probe ok"
  }));

  assert.equal(registry.getHealth("alpha").state, "UNKNOWN");
  const health = await registry.runHealthProbe("alpha");
  assert.equal(health.state, "HEALTHY");
  assert.equal(registry.getHealth("alpha").state, "HEALTHY");
  assert.ok(health.checkedAt);
});

test("failed Provider health probe becomes unavailable", async () => {
  const registry = createProviderRuntimeRegistry();
  registry.replace("alpha", { id: "runtime" });
  registry.setHealthProbe("alpha", async () => {
    throw new Error("probe failed");
  });

  const health = await registry.runHealthProbe("alpha");
  assert.equal(health.state, "UNAVAILABLE");
  assert.match(health.message, /probe failed/);
});
