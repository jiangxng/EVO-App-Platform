import test from "node:test";
import assert from "node:assert/strict";

import {
  createHostBearerSessionProviderV010,
  parseHostBearerSessionsV010
} from "../../dist/providers/request-session/runtime.js";
import {
  createMemoryEnterpriseContextGovernanceStoreV010
} from "../../dist/manager/enterprise-context-governance-store.js";
import {
  createEnterpriseContextCreationActionHandlerV010
} from "../../dist/manager/enterprise-context-creation.js";
import {
  createHostStaticAuthorizationProviderV010
} from "../../dist/providers/authorization/runtime.js";
import {
  createHostContextRegistryV010
} from "../../dist/manager/context-registry.js";
import {
  createPlatformRequestContextV010
} from "../../dist/manager/request-context.js";
import {
  createHostEnterpriseContextProviderV010
} from "../../dist/providers/enterprise-context/runtime.js";
import {
  createHostEnterpriseContextGrantProviderV010
} from "../../dist/providers/enterprise-context-grant/runtime.js";
import {
  createPrincipalContextRegistryV010
} from "../../dist/manager/principal-context.js";

function bearerSessions() {
  return parseHostBearerSessionsV010(JSON.stringify({
    contractVersion: "0.1.0",
    sessions: [{
      token: "token-alice",
      session: {
        contractVersion: "0.1.0",
        sessionId: "session:alice",
        principal: {
          contractVersion: "0.1.0",
          subjectId: "alice",
          actorType: "HUMAN",
          identityProviderId: "test.identity",
          displayName: "Alice"
        },
        issuedAt: "2026-09-26T00:00:00.000Z",
        expiresAt: "2026-09-27T00:00:00.000Z"
      }
    }]
  }));
}

function personalRegistry() {
  return createHostContextRegistryV010({
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:alice",
      ownerSubjectId: "alice",
      displayName: "Alice"
    }
  });
}

function createAction(confirmed = true) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "enterprise.context.create",
      inputVersion: "0.1.0"
    },
    values: {
      displayName: "Acme",
      code: "ACME",
      attributes: {
        region: "HK"
      }
    },
    sourceInteractionId: "create-acme",
    actionId: "create",
    requiresConfirmation: confirmed
  };
}

function allowCreateProvider() {
  return createHostStaticAuthorizationProviderV010({
    contractVersion: "0.1.0",
    rules: [{
      id: "allow-alice-create-enterprise",
      effect: "ALLOW",
      actions: ["enterprise.context.create"],
      subjectIds: ["alice"],
      resourceTypes: ["enterprise.context"]
    }]
  });
}

test("request-bound bearer Session resolves the current Principal and rejects unknown token", () => {
  const provider = createHostBearerSessionProviderV010(
    bearerSessions(),
    () => new Date("2026-09-26T12:00:00.000Z")
  );
  const session = provider.resolve({
    contractVersion: "0.1.0",
    bearerToken: "token-alice"
  });
  assert.equal(session.principal.subjectId, "alice");
  assert.equal(session.sessionId, "session:alice");

  assert.equal(provider.resolve({
    contractVersion: "0.1.0",
    bearerToken: "wrong-token"
  }), undefined);

  assert.equal(provider.resolve({
    contractVersion: "0.1.0",
    sessionId: "session:alice"
  }), undefined);
});

test("Enterprise Context creation atomically creates context, OWNER relationship, initial grant and lifecycle", async () => {
  const sessions = createHostBearerSessionProviderV010(
    bearerSessions(),
    () => new Date("2026-09-26T12:00:00.000Z")
  );
  const session = sessions.resolve({
    contractVersion: "0.1.0",
    bearerToken: "token-alice"
  });
  const requestContext = createPlatformRequestContextV010(
    session,
    personalRegistry(),
    createAction(),
    { authorization: "Bearer token-alice" },
    "en"
  );

  const store = createMemoryEnterpriseContextGovernanceStoreV010();
  const ids = [
    "context-id",
    "owner-id",
    "grant-id",
    "creating-event",
    "active-event"
  ];
  const handler = createEnterpriseContextCreationActionHandlerV010({
    store,
    resolveAuthorizationProvider: allowCreateProvider,
    now: () => new Date("2026-09-26T12:34:56.000Z"),
    id: () => ids.shift()
  });

  const result = await handler.execute(createAction(), requestContext);
  assert.equal(result.ok, true);

  const snapshot = store.snapshot();
  assert.equal(snapshot.contexts.length, 1);
  assert.equal(snapshot.relationships.length, 1);
  assert.equal(snapshot.grants.length, 1);
  assert.equal(snapshot.lifecycleEvents.length, 2);
  assert.equal(snapshot.defaultContexts.length, 1);
  assert.equal(snapshot.defaultContexts[0].subjectId, "alice");
  assert.equal(snapshot.defaultContexts[0].contextId, snapshot.contexts[0].contextId);

  const context = snapshot.contexts[0];
  assert.equal(context.displayName, "Acme");
  assert.equal(context.lifecycleState, "ACTIVE");
  assert.equal(context.createdBySubjectId, "alice");
  assert.equal(context.createdAt, "2026-09-26T12:34:56.000Z");
  assert.equal(context.attributes.code, "ACME");
  assert.equal(context.attributes.region, "HK");

  const owner = snapshot.relationships[0];
  assert.equal(owner.kind, "OWNER");
  assert.equal(owner.subjectId, "alice");
  assert.equal(owner.contextId, context.contextId);
  assert.equal(owner.createdBySubjectId, "alice");

  const grant = snapshot.grants[0];
  assert.equal(grant.subjectId, "alice");
  assert.equal(grant.contextId, context.contextId);
  assert.equal(grant.relationship, "OWNER");

  assert.deepEqual(
    snapshot.lifecycleEvents.map(event => [event.from, event.to]),
    [[undefined, "CREATING"], ["CREATING", "ACTIVE"]]
  );

  const directory = createHostEnterpriseContextProviderV010(
    [],
    () => store.snapshot().contexts
  );
  const grants = createHostEnterpriseContextGrantProviderV010(
    [],
    () => store.snapshot().grants
  );
  const registry = createPrincipalContextRegistryV010(session.principal, {
    enterpriseDirectory: directory,
    enterpriseGrants: grants
  });
  assert.deepEqual(
    registry.list().map(item => item.contextId),
    ["personal:alice", context.contextId]
  );
});

test("Enterprise Context creation requires explicit confirmation and authorization", async () => {
  const session = createHostBearerSessionProviderV010(
    bearerSessions(),
    () => new Date("2026-09-26T12:00:00.000Z")
  ).resolve({
    contractVersion: "0.1.0",
    bearerToken: "token-alice"
  });
  const requestContext = createPlatformRequestContextV010(
    session,
    personalRegistry(),
    createAction(),
    {},
    "en"
  );

  const store = createMemoryEnterpriseContextGovernanceStoreV010();
  const handler = createEnterpriseContextCreationActionHandlerV010({
    store,
    resolveAuthorizationProvider: allowCreateProvider
  });

  const unconfirmed = await handler.execute(createAction(false), requestContext);
  assert.equal(unconfirmed.ok, false);
  assert.equal(unconfirmed.error.code, "MATERIAL_WRITE_CONFIRMATION_REQUIRED");
  assert.equal(store.snapshot().contexts.length, 0);

  const deniedHandler = createEnterpriseContextCreationActionHandlerV010({
    store,
    resolveAuthorizationProvider() {
      return createHostStaticAuthorizationProviderV010({
        contractVersion: "0.1.0",
        rules: []
      });
    }
  });
  const denied = await deniedHandler.execute(createAction(true), requestContext);
  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "STATIC_POLICY_NO_MATCH");
  assert.equal(store.snapshot().contexts.length, 0);
});

test("ACTIVE Enterprise Context cannot become ownerless and creation facts are immutable", () => {
  const store = createMemoryEnterpriseContextGovernanceStoreV010();
  const base = {
    contractVersion: "0.1.0",
    contexts: [{
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:acme",
      enterpriseId: "acme",
      enterpriseProviderId: "test",
      displayName: "Acme",
      lifecycleState: "ACTIVE",
      createdBySubjectId: "alice",
      createdAt: "2026-09-26T00:00:00.000Z"
    }],
    relationships: [{
      contractVersion: "0.1.0",
      relationshipId: "relationship:owner",
      subjectId: "alice",
      contextId: "enterprise:acme",
      kind: "OWNER",
      state: "ACTIVE",
      createdAt: "2026-09-26T00:00:00.000Z",
      createdBySubjectId: "alice"
    }],
    grants: [],
    lifecycleEvents: []
  };
  store.save(base);

  assert.throws(
    () => store.save({ ...base, relationships: [] }),
    /ENTERPRISE_CONTEXT_ACTIVE_OWNER_REQUIRED/
  );

  assert.throws(
    () => store.save({
      ...base,
      contexts: [{
        ...base.contexts[0],
        createdBySubjectId: "bob"
      }]
    }),
    /ENTERPRISE_CONTEXT_CREATION_FACT_IMMUTABLE/
  );
});
