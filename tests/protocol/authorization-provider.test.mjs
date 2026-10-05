import test from "node:test";
import assert from "node:assert/strict";

import {
  createHostStaticAuthorizationProviderV010,
  mergeHostStaticAuthorizationPoliciesV010,
  parseHostStaticAuthorizationPolicyV010
} from "../../dist/providers/authorization/runtime.js";
import {
  HOST_STATIC_AUTHORIZATION_PROVIDER_ID,
  AUTHORIZATION_CHECK_CAPABILITY,
  hostStaticAuthorizationProviderPackage
} from "../../dist/providers/authorization/package.js";
import {
  enterpriseContextGovernanceAuthorizationPolicyV010
} from "../../dist/manager/enterprise-context-authorization.js";
import {
  templateStoreAuthorizationPolicyV010
} from "../../dist/manager/template-store-authorization.js";

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


test("additive authorization policy overlay extends base policy without replacement", async () => {
  const base = parseHostStaticAuthorizationPolicyV010(JSON.stringify({
    contractVersion: "0.1.0",
    rules: [{
      id: "provider-admin",
      effect: "ALLOW",
      actions: ["provider.binding.update"],
      subjectIds: ["bootstrap-admin"]
    }]
  }));
  const overlay = parseHostStaticAuthorizationPolicyV010(JSON.stringify({
    contractVersion: "0.1.0",
    rules: [{
      id: "allow-human-enterprise-create",
      effect: "ALLOW",
      actions: ["enterprise.context.create"],
      actorTypes: ["HUMAN"],
      resourceTypes: ["enterprise.context"]
    }]
  }));
  const policy = mergeHostStaticAuthorizationPoliciesV010(base, overlay);
  const provider = createHostStaticAuthorizationProviderV010(policy);

  const providerAdmin = await provider.check(check("provider.binding.update"));
  assert.equal(providerAdmin.allowed, true);

  const enterpriseCreate = await provider.check(
    check("enterprise.context.create", "enterprise.context")
  );
  assert.equal(enterpriseCreate.allowed, true);
  assert.deepEqual(
    enterpriseCreate.reasonCodes,
    ["STATIC_POLICY_ALLOW", "allow-human-enterprise-create"]
  );
});

test("base explicit deny still overrides additive overlay allow", async () => {
  const base = parseHostStaticAuthorizationPolicyV010(JSON.stringify({
    contractVersion: "0.1.0",
    rules: [{
      id: "deny-enterprise-create",
      effect: "DENY",
      actions: ["enterprise.context.create"],
      actorTypes: ["HUMAN"],
      resourceTypes: ["enterprise.context"]
    }]
  }));
  const overlay = parseHostStaticAuthorizationPolicyV010(JSON.stringify({
    contractVersion: "0.1.0",
    rules: [{
      id: "allow-human-enterprise-create",
      effect: "ALLOW",
      actions: ["enterprise.context.create"],
      actorTypes: ["HUMAN"],
      resourceTypes: ["enterprise.context"]
    }]
  }));
  const provider = createHostStaticAuthorizationProviderV010(
    mergeHostStaticAuthorizationPoliciesV010(base, overlay)
  );
  const decision = await provider.check(
    check("enterprise.context.create", "enterprise.context")
  );
  assert.equal(decision.allowed, false);
  assert.deepEqual(
    decision.reasonCodes,
    ["STATIC_POLICY_EXPLICIT_DENY", "deny-enterprise-create"]
  );
});

test("authorization policy overlays reject duplicate rule ids", () => {
  const base = parseHostStaticAuthorizationPolicyV010(JSON.stringify({
    contractVersion: "0.1.0",
    rules: [{
      id: "same-rule",
      effect: "ALLOW",
      actions: ["provider.binding.update"]
    }]
  }));
  const overlay = parseHostStaticAuthorizationPolicyV010(JSON.stringify({
    contractVersion: "0.1.0",
    rules: [{
      id: "same-rule",
      effect: "ALLOW",
      actions: ["enterprise.context.create"]
    }]
  }));
  assert.throws(
    () => mergeHostStaticAuthorizationPoliciesV010(base, overlay),
    /AUTHORIZATION_POLICY_RULE_DUPLICATE/
  );
});

test("Enterprise Context archive baseline admits Human governance checks", async () => {
  const provider = createHostStaticAuthorizationProviderV010(
    mergeHostStaticAuthorizationPoliciesV010(
      {
        contractVersion: "0.1.0",
        rules: []
      },
      enterpriseContextGovernanceAuthorizationPolicyV010
    )
  );

  const decision = await provider.check(
    check("enterprise.context.archive", "enterprise.context")
  );
  assert.equal(decision.allowed, true);
  assert.deepEqual(
    decision.reasonCodes,
    ["STATIC_POLICY_ALLOW", "evo.enterprise-context.owner-archive"]
  );
});

test("deployment explicit deny still overrides Enterprise Context archive baseline", async () => {
  const provider = createHostStaticAuthorizationProviderV010(
    mergeHostStaticAuthorizationPoliciesV010(
      {
        contractVersion: "0.1.0",
        rules: [{
          id: "deployment-deny-archive",
          effect: "DENY",
          actions: ["enterprise.context.archive"],
          actorTypes: ["HUMAN"],
          resourceTypes: ["enterprise.context"]
        }]
      },
      enterpriseContextGovernanceAuthorizationPolicyV010
    )
  );

  const decision = await provider.check(
    check("enterprise.context.archive", "enterprise.context")
  );
  assert.equal(decision.allowed, false);
  assert.deepEqual(
    decision.reasonCodes,
    ["STATIC_POLICY_EXPLICIT_DENY", "deployment-deny-archive"]
  );
});

test("Template Store copy baseline admits Human copy checks", async () => {
  const provider = createHostStaticAuthorizationProviderV010(
    mergeHostStaticAuthorizationPoliciesV010(
      { contractVersion: "0.1.0", rules: [] },
      templateStoreAuthorizationPolicyV010
    )
  );
  const decision = await provider.check(
    check("template.store.copy", "template.store.entry")
  );
  assert.equal(decision.allowed, true);
  assert.deepEqual(
    decision.reasonCodes,
    ["STATIC_POLICY_ALLOW", "evo.template-store.copy-to-enterprise"]
  );
});

test("deployment explicit deny overrides Template Store copy baseline", async () => {
  const provider = createHostStaticAuthorizationProviderV010(
    mergeHostStaticAuthorizationPoliciesV010(
      {
        contractVersion: "0.1.0",
        rules: [{
          id: "deployment-deny-template-copy",
          effect: "DENY",
          actions: ["template.store.copy"],
          actorTypes: ["HUMAN"],
          resourceTypes: ["template.store.entry"]
        }]
      },
      templateStoreAuthorizationPolicyV010
    )
  );
  const decision = await provider.check(
    check("template.store.copy", "template.store.entry")
  );
  assert.equal(decision.allowed, false);
  assert.deepEqual(
    decision.reasonCodes,
    ["STATIC_POLICY_EXPLICIT_DENY", "deployment-deny-template-copy"]
  );
});
