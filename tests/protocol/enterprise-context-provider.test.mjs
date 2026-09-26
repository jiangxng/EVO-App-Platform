import test from "node:test";
import assert from "node:assert/strict";

import {
  createHostEnterpriseContextProviderV010,
  parseHostEnterpriseContextsV010
} from "../../dist/providers/enterprise-context/runtime.js";
import {
  HOST_ENTERPRISE_CONTEXT_PROVIDER_ID
} from "../../dist/providers/enterprise-context/package.js";
import { createHostContextRegistryV010 } from "../../dist/manager/context-registry.js";

test("Host Enterprise Context Provider parses deterministic Host-owned contexts", () => {
  const contexts = parseHostEnterpriseContextsV010(JSON.stringify({
    contractVersion: "0.1.0",
    contexts: [
      {
        contextId: "enterprise:acme",
        enterpriseId: "acme",
        displayName: "Acme",
        companyId: "acme-hq",
        attributes: { region: "global", active: true }
      }
    ]
  }));

  assert.equal(contexts.length, 1);
  assert.equal(contexts[0].kind, "ENTERPRISE");
  assert.equal(contexts[0].enterpriseProviderId, HOST_ENTERPRISE_CONTEXT_PROVIDER_ID);
  assert.equal(contexts[0].contextId, "enterprise:acme");
  assert.equal(contexts[0].displayName, "Acme");
});

test("Enterprise Context config rejects duplicate or malformed Host entries", () => {
  assert.throws(
    () => parseHostEnterpriseContextsV010(JSON.stringify({
      contractVersion: "0.1.0",
      contexts: [
        { contextId: "enterprise:acme", enterpriseId: "acme" },
        { contextId: "enterprise:acme", enterpriseId: "other" }
      ]
    })),
    /ENTERPRISE_CONTEXT_DUPLICATE/
  );

  assert.throws(
    () => parseHostEnterpriseContextsV010(JSON.stringify({
      contractVersion: "0.1.0",
      contexts: [{ enterpriseId: "acme" }]
    })),
    /ENTERPRISE_CONTEXT_FIELD_REQUIRED/
  );
});

test("Host Context Registry dynamically consumes the Enterprise Context Provider and still fails closed", () => {
  const provider = createHostEnterpriseContextProviderV010([
    {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:acme",
      enterpriseId: "acme",
      enterpriseProviderId: HOST_ENTERPRISE_CONTEXT_PROVIDER_ID,
      displayName: "Acme"
    }
  ]);

  const registry = createHostContextRegistryV010({
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:default",
      displayName: "Personal"
    },
    enterpriseContextSource: () => provider.list()
  });

  assert.deepEqual(registry.list().map(item => item.contextId), [
    "personal:default",
    "enterprise:acme"
  ]);

  const enterprise = registry.resolve({
    contractVersion: "0.1.0",
    kind: "ENTERPRISE",
    contextId: "enterprise:acme",
    enterpriseId: "acme"
  });
  assert.equal(enterprise.enterpriseContext.displayName, "Acme");

  assert.throws(
    () => registry.resolve({
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:forged",
      enterpriseId: "forged"
    }),
    /CONTEXT_NOT_AVAILABLE/
  );
});
