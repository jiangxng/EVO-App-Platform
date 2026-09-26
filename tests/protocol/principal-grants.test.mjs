import test from "node:test";
import assert from "node:assert/strict";

import {
  createHostStaticSessionProviderV010,
  parseHostStaticSessionV010
} from "../../dist/providers/session/runtime.js";
import {
  createHostEnterpriseContextGrantProviderV010,
  parseHostEnterpriseContextGrantsV010
} from "../../dist/providers/enterprise-context-grant/runtime.js";
import {
  createHostEnterpriseContextProviderV010
} from "../../dist/providers/enterprise-context/runtime.js";
import {
  createPrincipalContextRegistryV010
} from "../../dist/manager/principal-context.js";

const alice = {
  contractVersion: "0.1.0",
  subjectId: "alice",
  actorType: "HUMAN",
  identityProviderId: "test.identity",
  displayName: "Alice"
};

const bob = {
  contractVersion: "0.1.0",
  subjectId: "bob",
  actorType: "HUMAN",
  identityProviderId: "test.identity",
  displayName: "Bob"
};

test("Static Session Provider parses a live Principal and fails closed after expiry", () => {
  const session = parseHostStaticSessionV010(JSON.stringify({
    contractVersion: "0.1.0",
    sessionId: "session:alice",
    principal: {
      subjectId: "alice",
      actorType: "HUMAN",
      identityProviderId: "test.identity",
      displayName: "Alice"
    },
    issuedAt: "2026-09-26T00:00:00.000Z",
    expiresAt: "2026-09-27T00:00:00.000Z",
    assurance: ["TEST"]
  }));

  const live = createHostStaticSessionProviderV010(
    session,
    () => new Date("2026-09-26T12:00:00.000Z")
  );
  assert.equal(live.current().principal.subjectId, "alice");

  const expired = createHostStaticSessionProviderV010(
    session,
    () => new Date("2026-09-27T00:00:00.000Z")
  );
  assert.equal(expired.current(), undefined);
});

test("Enterprise Context Grant Provider returns only grants for the current Principal", () => {
  const grants = parseHostEnterpriseContextGrantsV010(JSON.stringify({
    contractVersion: "0.1.0",
    grants: [
      {
        grantId: "grant:alice:acme",
        subjectId: "alice",
        contextId: "enterprise:acme",
        relationship: "member"
      },
      {
        grantId: "grant:bob:globex",
        subjectId: "bob",
        contextId: "enterprise:globex",
        relationship: "member"
      }
    ]
  }));
  const provider = createHostEnterpriseContextGrantProviderV010(grants);

  assert.deepEqual(
    provider.listForPrincipal(alice).map(grant => grant.contextId),
    ["enterprise:acme"]
  );
  assert.deepEqual(
    provider.listForPrincipal(bob).map(grant => grant.contextId),
    ["enterprise:globex"]
  );
});

test("Grant config rejects duplicate ids and malformed entries", () => {
  assert.throws(
    () => parseHostEnterpriseContextGrantsV010(JSON.stringify({
      contractVersion: "0.1.0",
      grants: [
        { grantId: "same", subjectId: "alice", contextId: "enterprise:acme" },
        { grantId: "same", subjectId: "bob", contextId: "enterprise:globex" }
      ]
    })),
    /ENTERPRISE_CONTEXT_GRANT_DUPLICATE/
  );
  assert.throws(
    () => parseHostEnterpriseContextGrantsV010(JSON.stringify({
      contractVersion: "0.1.0",
      grants: [{ grantId: "broken", subjectId: "alice" }]
    })),
    /ENTERPRISE_CONTEXT_GRANT_FIELD_REQUIRED/
  );
});

test("Principal Context Registry exposes only directory contexts granted to the Principal", () => {
  const directory = createHostEnterpriseContextProviderV010([
    {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:acme",
      enterpriseId: "acme",
      enterpriseProviderId: "host.enterprise-context",
      displayName: "Acme"
    },
    {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:globex",
      enterpriseId: "globex",
      enterpriseProviderId: "host.enterprise-context",
      displayName: "Globex"
    }
  ]);
  const grants = createHostEnterpriseContextGrantProviderV010([
    {
      contractVersion: "0.1.0",
      grantId: "grant:alice:acme",
      subjectId: "alice",
      contextId: "enterprise:acme"
    }
  ]);

  const aliceRegistry = createPrincipalContextRegistryV010(alice, {
    enterpriseDirectory: directory,
    enterpriseGrants: grants
  });
  assert.equal(aliceRegistry.personal().ownerSubjectId, "alice");
  assert.equal(aliceRegistry.personal().contextId, "personal:alice");
  assert.deepEqual(aliceRegistry.list().map(ref => ref.contextId), [
    "personal:alice",
    "enterprise:acme"
  ]);

  const bobRegistry = createPrincipalContextRegistryV010(bob, {
    enterpriseDirectory: directory,
    enterpriseGrants: grants
  });
  assert.deepEqual(bobRegistry.list().map(ref => ref.contextId), ["personal:bob"]);

  assert.throws(
    () => bobRegistry.resolve({
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:acme",
      enterpriseId: "acme"
    }),
    /CONTEXT_NOT_AVAILABLE/
  );
});

test("A grant for an unknown directory Context has no effect", () => {
  const directory = createHostEnterpriseContextProviderV010([]);
  const grants = createHostEnterpriseContextGrantProviderV010([
    {
      contractVersion: "0.1.0",
      grantId: "grant:alice:missing",
      subjectId: "alice",
      contextId: "enterprise:missing"
    }
  ]);
  const registry = createPrincipalContextRegistryV010(alice, {
    enterpriseDirectory: directory,
    enterpriseGrants: grants
  });
  assert.deepEqual(registry.list().map(ref => ref.contextId), ["personal:alice"]);
});
