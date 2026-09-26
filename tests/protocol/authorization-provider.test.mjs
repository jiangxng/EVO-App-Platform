import test from "node:test";
import assert from "node:assert/strict";

import {
  createHostStaticAuthorizationProviderV010,
  parseHostStaticAuthorizationPolicyV010
} from "../../dist/providers/authorization/runtime.js";
import {
  HOST_STATIC_AUTHORIZATION_PROVIDER_ID,
  AUTHORIZATION_CHECK_CAPABILITY,
  hostStaticAuthorizationProviderPackage
} from "../../dist/providers/authorization/package.js";

const principal = {
  contractVersion: "0.1.0",
  subjectId: "bootstrap-admin",
  actorType: "HUMAN",
  identityProviderId: "host.bootstrap"
};

function check(action, resourceType = "provider-binding") {
  return {
    contractVersion: "0.1.0",
    principal,
    scope: { contractVersion: "0.1.0" },
    action,
    resource: { type: resourceType }
  };
}

test("reference authorization Provider package exposes authorization.check", () => {
  const contribution = hostStaticAuthorizationProviderPackage.features[0]
    .contributions.find(item => item.kind === "platform.service-provider");
  assert.equal(contribution.provider.providerId, HOST_STATIC_AUTHORIZATION_PROVIDER_ID);
  assert.equal(contribution.provider.capability, AUTHORIZATION_CHECK_CAPABILITY);
});

test("static authorization Provider denies by default", async () => {
  const policy = parseHostStaticAuthorizationPolicyV010(JSON.stringify({
    contractVersion: "0.1.0",
    rules: []
  }));
  const provider = createHostStaticAuthorizationProviderV010(policy);
  const decision = await provider.check(check("provider.binding.update"));
  assert.equal(decision.allowed, false);
  assert.deepEqual(decision.reasonCodes, ["STATIC_POLICY_NO_MATCH"]);
});

test("static authorization Provider explicitly allows matching administrator action", async () => {
  const policy = parseHostStaticAuthorizationPolicyV010(JSON.stringify({
    contractVersion: "0.1.0",
    rules: [{
      id: "provider-admin",
      effect: "ALLOW",
      actions: ["provider.binding.update", "provider.health.probe"],
      subjectIds: ["bootstrap-admin"],
      actorTypes: ["HUMAN"],
      resourceTypes: ["provider-binding", "provider-runtime"]
    }]
  }));
  const provider = createHostStaticAuthorizationProviderV010(policy);
  const decision = await provider.check(check("provider.binding.update"));
  assert.equal(decision.allowed, true);
  assert.deepEqual(decision.reasonCodes, ["STATIC_POLICY_ALLOW", "provider-admin"]);
});

test("explicit deny overrides matching allow", async () => {
  const policy = parseHostStaticAuthorizationPolicyV010(JSON.stringify({
    contractVersion: "0.1.0",
    rules: [
      {
        id: "allow-provider-admin",
        effect: "ALLOW",
        actions: ["*"],
        subjectIds: ["bootstrap-admin"]
      },
      {
        id: "deny-audit",
        effect: "DENY",
        actions: ["provider.governance.audit.read"],
        subjectIds: ["bootstrap-admin"]
      }
    ]
  }));
  const provider = createHostStaticAuthorizationProviderV010(policy);
  const decision = await provider.check(check("provider.governance.audit.read", "provider-governance-audit"));
  assert.equal(decision.allowed, false);
  assert.deepEqual(decision.reasonCodes, ["STATIC_POLICY_EXPLICIT_DENY", "deny-audit"]);
});

test("scope constraints are exact and default deny outside scope", async () => {
  const policy = parseHostStaticAuthorizationPolicyV010(JSON.stringify({
    contractVersion: "0.1.0",
    rules: [{
      id: "company-a-only",
      effect: "ALLOW",
      actions: ["provider.binding.update"],
      subjectIds: ["bootstrap-admin"],
      scope: { companyId: "company-a" }
    }]
  }));
  const provider = createHostStaticAuthorizationProviderV010(policy);
  const denied = await provider.check({
    ...check("provider.binding.update"),
    scope: { contractVersion: "0.1.0", companyId: "company-b" }
  });
  assert.equal(denied.allowed, false);

  const allowed = await provider.check({
    ...check("provider.binding.update"),
    scope: { contractVersion: "0.1.0", companyId: "company-a" }
  });
  assert.equal(allowed.allowed, true);
});
