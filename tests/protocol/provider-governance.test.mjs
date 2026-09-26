import test from "node:test";
import assert from "node:assert/strict";

import {
  authenticateBootstrapAdministratorV010,
  authorizeProviderAdministrationV010,
  createMemoryProviderBindingAuditStoreV010,
  providerAuditEventV010
} from "../../dist/manager/provider-governance.js";
import { createProviderRuntimeRegistry } from "../../dist/providers/runtime-registry.js";

const allowingProvider = {
  providerId: "policy.test",
  async check(input) {
    return {
      contractVersion: "0.1.0",
      allowed: input.action === "provider.binding.update",
      policyProviderId: "policy.test",
      reasonCodes: [input.action === "provider.binding.update" ? "ALLOW" : "DENY"]
    };
  }
};

test("bootstrap authentication fails closed without configured credential", () => {
  const auth = authenticateBootstrapAdministratorV010("anything", undefined);
  assert.equal(auth.authenticated, false);
  assert.equal(auth.reason, "PROVIDER_ADMIN_AUTH_NOT_CONFIGURED");
});

test("bootstrap credential authenticates principal but does not authorize by itself", async () => {
  const auth = authenticateBootstrapAdministratorV010("secret", "secret");
  assert.equal(auth.authenticated, true);
  assert.equal(auth.principal.subjectId, "bootstrap-admin");

  const decision = await authorizeProviderAdministrationV010(
    auth,
    undefined,
    {
      action: "provider.binding.update",
      resource: { type: "provider-binding", id: "llm.inference" }
    }
  );
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "AUTHORIZATION_PROVIDER_UNAVAILABLE");
});

test("authorization Provider decides whether authenticated administrator may act", async () => {
  const auth = authenticateBootstrapAdministratorV010("secret", "secret");

  const allowed = await authorizeProviderAdministrationV010(
    auth,
    allowingProvider,
    {
      action: "provider.binding.update",
      resource: { type: "provider-binding", id: "llm.inference" }
    }
  );
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.policyProviderId, "policy.test");

  const denied = await authorizeProviderAdministrationV010(
    auth,
    allowingProvider,
    {
      action: "provider.health.probe",
      resource: { type: "provider-runtime", id: "alpha" }
    }
  );
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, "DENY");
});

test("Provider governance audit never stores secret material", () => {
  const store = createMemoryProviderBindingAuditStoreV010();
  store.append(providerAuditEventV010({
    action: "UPDATE_PROVIDER_BINDING",
    outcome: "ALLOWED",
    actorId: "bootstrap-admin",
    policyProviderId: "policy.test",
    correlationId: "corr-1",
    capability: "llm.inference",
    providerId: "alpha",
    scope: "SYSTEM",
    reason: "ALLOW"
  }, () => new Date("2026-09-26T00:00:00.000Z")));

  const [event] = store.list();
  assert.equal(event.capability, "llm.inference");
  assert.equal(event.outcome, "ALLOWED");
  assert.equal(event.policyProviderId, "policy.test");
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
