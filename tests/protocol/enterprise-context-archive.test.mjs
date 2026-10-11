import test from "node:test";
import assert from "node:assert/strict";

import {
  createEnterpriseContextArchiveActionHandlerV010
} from "../../dist/manager/enterprise-context-archive.js";
import {
  createMemoryEnterpriseContextGovernanceStoreV010
} from "../../dist/manager/enterprise-context-governance-store.js";
import {
  createHostEnterpriseContextProviderV010
} from "../../dist/providers/enterprise-context/runtime.js";
import {
  createHostEnterpriseContextGrantProviderV010
} from "../../dist/providers/enterprise-context-grant/runtime.js";
import {
  createHostStaticAuthorizationProviderV010
} from "../../dist/providers/authorization/runtime.js";
import {
  createPrincipalContextRegistryV010
} from "../../dist/manager/principal-context.js";
import {
  createEnterpriseContextDirectoryPageV010
} from "../../dist/apps/enterprise-context-governance/context-page.js";

const contextId = "enterprise:ent_acme";

function seed() {
  return {
    contractVersion: "0.1.0",
    contexts: [{
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId,
      enterpriseId: "ent_acme",
      enterpriseProviderId: "host.enterprise-context",
      displayName: "Acme",
      lifecycleState: "ACTIVE",
      createdBySubjectId: "alice",
      createdAt: "2026-10-05T00:00:00.000Z"
    }],
    relationships: [{
      contractVersion: "0.1.0",
      relationshipId: "relationship:owner",
      subjectId: "alice",
      contextId,
      kind: "OWNER",
      state: "ACTIVE",
      createdAt: "2026-10-05T00:00:00.000Z",
      createdBySubjectId: "alice"
    }],
    grants: [{
      contractVersion: "0.1.0",
      grantId: "grant:owner",
      subjectId: "alice",
      contextId,
      relationship: "OWNER",
      state: "ACTIVE",
      createdAt: "2026-10-05T00:00:00.000Z",
      createdBySubjectId: "alice"
    }],
    lifecycleEvents: [],
    invitations: [],
    ownershipTransfers: [],
    relationshipEvents: [],
    defaultContexts: [{
      contractVersion: "0.1.0",
      subjectId: "alice",
      contextId,
      selectedAt: "2026-10-05T00:00:00.000Z",
      selectedBySubjectId: "alice"
    }]
  };
}

function request(confirmed = true) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "enterprise.context.archive",
      inputVersion: "0.1.0"
    },
    values: {
      targetContextId: contextId
    },
    sourceInteractionId: "archive-acme",
    actionId: "archive",
    requiresConfirmation: confirmed
  };
}

function requestContext(subjectId = "alice") {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId,
      actorType: "HUMAN",
      identityProviderId: "test.identity"
    },
    scope: {
      contractVersion: "0.1.0",
      userId: subjectId
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:" + subjectId
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:" + subjectId
      }
    },
    correlationId: "correlation:archive"
  };
}

function authorizationProvider() {
  return createHostStaticAuthorizationProviderV010({
    contractVersion: "0.1.0",
    rules: [{
      id: "allow-owner-archive",
      effect: "ALLOW",
      actions: ["enterprise.context.archive"],
      subjectIds: ["alice"],
      resourceTypes: ["enterprise.context"]
    }]
  });
}

test("OWNER can archive an Enterprise Context and remove it from active resolution", async () => {
  const store = createMemoryEnterpriseContextGovernanceStoreV010(seed());
  const handler = createEnterpriseContextArchiveActionHandlerV010({
    store,
    resolveAuthorizationProvider: authorizationProvider,
    now: () => new Date("2026-10-05T01:00:00.000Z"),
    id: () => "archive-event"
  });

  const result = await handler.execute(request(), requestContext());
  assert.equal(result.ok, true);
  assert.equal(result.result.archivedContextId, contextId);

  const snapshot = store.snapshot();
  assert.equal(snapshot.contexts[0].lifecycleState, "ARCHIVED");
  assert.equal(snapshot.defaultContexts.length, 0);
  assert.deepEqual(
    snapshot.lifecycleEvents.map(item => [item.from, item.to]),
    [["ACTIVE", "ARCHIVED"]]
  );

  const registry = createPrincipalContextRegistryV010(
    requestContext().principal,
    {
      enterpriseDirectory: createHostEnterpriseContextProviderV010(
        [],
        () => store.snapshot().contexts
      ),
      enterpriseGrants: createHostEnterpriseContextGrantProviderV010(
        [],
        () => store.snapshot().grants
      )
    }
  );
  assert.deepEqual(
    registry.list().map(item => item.contextId),
    ["personal:alice"]
  );
});

test("archive requires OWNER role and explicit confirmation", async () => {
  const store = createMemoryEnterpriseContextGovernanceStoreV010(seed());
  const handler = createEnterpriseContextArchiveActionHandlerV010({
    store,
    resolveAuthorizationProvider: authorizationProvider
  });

  const unconfirmed = await handler.execute(request(false), requestContext());
  assert.equal(unconfirmed.ok, false);
  assert.equal(unconfirmed.error.code, "MATERIAL_WRITE_CONFIRMATION_REQUIRED");

  const notOwner = await handler.execute(request(), requestContext("bob"));
  assert.equal(notOwner.ok, false);
  assert.equal(notOwner.error.code, "ENTERPRISE_CONTEXT_ARCHIVE_OWNER_REQUIRED");
  assert.equal(store.snapshot().contexts[0].lifecycleState, "ACTIVE");
});

test("directory exposes archive only to an OWNER", () => {
  const enterprise = seed().contexts[0];
  const ownerPage = createEnterpriseContextDirectoryPageV010({
    contexts: [enterprise],
    ownerContextIds: [contextId],
    defaultContextId: contextId,
    locale: "zh-CN"
  });
  const ownerItem = ownerPage.items.find(item => item.id === contextId);
  assert.ok(ownerItem);
  assert.equal(
    ownerItem.secondaryActions.some(
      action => action.command === "enterprise.context.archive"
    ),
    true
  );

  const memberPage = createEnterpriseContextDirectoryPageV010({
    contexts: [enterprise],
    ownerContextIds: [],
    locale: "zh-CN"
  });
  const memberItem = memberPage.items.find(item => item.id === contextId);
  assert.ok(memberItem);
  assert.equal(
    memberItem.secondaryActions.some(
      action => action.command === "enterprise.context.archive"
    ),
    false
  );
});
