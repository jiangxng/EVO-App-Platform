import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseContextGovernanceStoreV010
} from "../../dist/manager/enterprise-context-governance-store.js";
import {
  createEnterpriseRelationshipActionHandlersV010
} from "../../dist/manager/enterprise-relationship-actions.js";
import {
  createHostStaticAuthorizationProviderV010
} from "../../dist/providers/authorization/runtime.js";
import {
  createHostEnterpriseContextProviderV010
} from "../../dist/providers/enterprise-context/runtime.js";
import {
  createHostEnterpriseContextGrantProviderV010
} from "../../dist/providers/enterprise-context-grant/runtime.js";
import {
  createPrincipalContextRegistryV010
} from "../../dist/manager/principal-context.js";

const context = {
  contractVersion: "0.1.0",
  kind: "ENTERPRISE",
  contextId: "enterprise:acme",
  enterpriseId: "acme",
  enterpriseProviderId: "test.enterprise",
  displayName: "Acme",
  lifecycleState: "ACTIVE",
  createdBySubjectId: "alice",
  createdAt: "2026-09-26T00:00:00.000Z"
};

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

const carol = {
  contractVersion: "0.1.0",
  subjectId: "carol",
  actorType: "HUMAN",
  identityProviderId: "test.identity",
  displayName: "Carol"
};

function seed() {
  return {
    contractVersion: "0.1.0",
    contexts: [structuredClone(context)],
    relationships: [{
      contractVersion: "0.1.0",
      relationshipId: "relationship:alice-owner",
      subjectId: "alice",
      contextId: context.contextId,
      kind: "OWNER",
      state: "ACTIVE",
      createdAt: "2026-09-26T00:00:00.000Z",
      createdBySubjectId: "alice"
    }],
    grants: [{
      contractVersion: "0.1.0",
      grantId: "grant:alice-owner",
      subjectId: "alice",
      contextId: context.contextId,
      relationship: "OWNER",
      state: "ACTIVE",
      createdAt: "2026-09-26T00:00:00.000Z",
      createdBySubjectId: "alice"
    }],
    lifecycleEvents: [],
    invitations: [],
    ownershipTransfers: [],
    relationshipEvents: []
  };
}

function allowAllGovernance() {
  return createHostStaticAuthorizationProviderV010({
    contractVersion: "0.1.0",
    rules: [{
      id: "allow-human-enterprise-governance",
      effect: "ALLOW",
      actions: ["enterprise.*", "*"],
      actorTypes: ["HUMAN"],
      resourceTypes: ["*"]
    }]
  });
}

function personalContext(principal) {
  return {
    contractVersion: "0.1.0",
    principal,
    scope: {
      contractVersion: "0.1.0",
      userId: principal.subjectId
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:" + principal.subjectId,
        ownerSubjectId: principal.subjectId,
        displayName: principal.displayName
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:" + principal.subjectId
      }
    },
    correlationId: "corr:" + principal.subjectId
  };
}

function enterpriseContext(principal) {
  return {
    contractVersion: "0.1.0",
    principal,
    scope: {
      contractVersion: "0.1.0",
      userId: principal.subjectId,
      enterpriseId: context.enterpriseId
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:" + principal.subjectId,
        ownerSubjectId: principal.subjectId,
        displayName: principal.displayName
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: context.contextId,
        enterpriseId: context.enterpriseId
      },
      enterpriseContext: structuredClone(context)
    },
    correlationId: "corr:" + principal.subjectId
  };
}

function action(code, values, requiresConfirmation = true) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code, inputVersion: "0.1.0" },
    values,
    sourceInteractionId: "interaction:" + code,
    actionId: code,
    requiresConfirmation
  };
}

function handlers(store, ids = []) {
  let sequence = 0;
  const generated = [...ids];
  const list = createEnterpriseRelationshipActionHandlersV010({
    store,
    resolveAuthorizationProvider: allowAllGovernance,
    now: () => new Date("2026-09-26T12:00:00.000Z"),
    id: () => generated.shift() ?? "id-" + (++sequence)
  });
  return new Map(list.map(handler => [handler.commandCode, handler]));
}

async function execute(map, code, values, requestContext) {
  const handler = map.get(code);
  assert.ok(handler, "handler " + code + " must exist");
  return handler.execute(action(code, values), requestContext);
}

test("invitation acceptance creates membership and effective Enterprise Context access", async () => {
  const store = createMemoryEnterpriseContextGovernanceStoreV010(seed());
  const map = handlers(store, [
    "invite-bob",
    "event-invite",
    "relationship-bob",
    "grant-bob",
    "event-accept",
    "event-active"
  ]);

  const invited = await execute(
    map,
    "enterprise.relationship.invite",
    { targetSubjectId: "bob", kind: "MEMBER" },
    enterpriseContext(alice)
  );
  assert.equal(invited.ok, true);

  let snapshot = store.snapshot();
  assert.equal(snapshot.invitations.length, 1);
  assert.equal(snapshot.invitations[0].state, "PENDING");
  assert.equal(
    snapshot.relationships.some(item => item.subjectId === "bob" && item.state === "ACTIVE"),
    false
  );

  const invitationId = snapshot.invitations[0].invitationId;
  const accepted = await execute(
    map,
    "enterprise.relationship.invitation.accept",
    { invitationId },
    personalContext(bob)
  );
  assert.equal(accepted.ok, true);

  snapshot = store.snapshot();
  assert.equal(snapshot.invitations[0].state, "ACCEPTED");
  assert.equal(
    snapshot.relationships.some(item =>
      item.subjectId === "bob"
      && item.contextId === context.contextId
      && item.kind === "MEMBER"
      && item.state === "ACTIVE"
    ),
    true
  );
  assert.equal(
    snapshot.grants.some(item =>
      item.subjectId === "bob"
      && item.contextId === context.contextId
      && item.relationship === "MEMBER"
      && item.state === "ACTIVE"
    ),
    true
  );

  const directory = createHostEnterpriseContextProviderV010(
    [],
    () => store.snapshot().contexts
  );
  const grants = createHostEnterpriseContextGrantProviderV010(
    [],
    () => store.snapshot().grants
  );
  const registry = createPrincipalContextRegistryV010(bob, {
    enterpriseDirectory: directory,
    enterpriseGrants: grants
  });
  assert.deepEqual(
    registry.list().map(item => item.contextId),
    ["personal:bob", "enterprise:acme"]
  );
});

test("Host relationship policy blocks MEMBER from inviting even when authorization Provider allows", async () => {
  const state = seed();
  state.relationships.push({
    contractVersion: "0.1.0",
    relationshipId: "relationship:bob-member",
    subjectId: "bob",
    contextId: context.contextId,
    kind: "MEMBER",
    state: "ACTIVE",
    createdAt: "2026-09-26T01:00:00.000Z",
    createdBySubjectId: "alice"
  });
  state.grants.push({
    contractVersion: "0.1.0",
    grantId: "grant:bob-member",
    subjectId: "bob",
    contextId: context.contextId,
    relationship: "MEMBER",
    state: "ACTIVE",
    createdAt: "2026-09-26T01:00:00.000Z",
    createdBySubjectId: "alice"
  });
  const store = createMemoryEnterpriseContextGovernanceStoreV010(state);
  const map = handlers(store);

  const result = await execute(
    map,
    "enterprise.relationship.invite",
    { targetSubjectId: "carol", kind: "MEMBER" },
    enterpriseContext(bob)
  );
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "ENTERPRISE_GOVERNANCE_ROLE_REQUIRED");
  assert.equal(store.snapshot().invitations.length, 0);
});

test("ADMIN cannot appoint another ADMIN even when authorization Provider allows", async () => {
  const state = seed();
  state.relationships.push({
    contractVersion: "0.1.0",
    relationshipId: "relationship:bob-admin",
    subjectId: "bob",
    contextId: context.contextId,
    kind: "ADMIN",
    state: "ACTIVE",
    createdAt: "2026-09-26T01:00:00.000Z",
    createdBySubjectId: "alice"
  });
  state.grants.push({
    contractVersion: "0.1.0",
    grantId: "grant:bob-admin",
    subjectId: "bob",
    contextId: context.contextId,
    relationship: "ADMIN",
    state: "ACTIVE",
    createdAt: "2026-09-26T01:00:00.000Z",
    createdBySubjectId: "alice"
  });
  const store = createMemoryEnterpriseContextGovernanceStoreV010(state);
  const map = handlers(store);

  const result = await execute(
    map,
    "enterprise.relationship.invite",
    { targetSubjectId: "carol", kind: "ADMIN" },
    enterpriseContext(bob)
  );
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "ENTERPRISE_GOVERNANCE_ROLE_REQUIRED");
  assert.equal(store.snapshot().invitations.length, 0);
});

test("OWNER transfer acceptance atomically activates the new owner and revokes the old owner", async () => {
  const store = createMemoryEnterpriseContextGovernanceStoreV010(seed());
  const map = handlers(store, [
    "transfer-bob",
    "event-transfer-created",
    "relationship-bob-owner",
    "grant-bob-owner",
    "event-transfer-accepted",
    "event-bob-owner-active",
    "event-alice-owner-revoked"
  ]);

  const initiated = await execute(
    map,
    "enterprise.ownership.transfer.initiate",
    { toSubjectId: "bob" },
    enterpriseContext(alice)
  );
  assert.equal(initiated.ok, true);

  let snapshot = store.snapshot();
  const transferId = snapshot.ownershipTransfers[0].transferId;
  assert.equal(snapshot.ownershipTransfers[0].state, "PENDING");

  const accepted = await execute(
    map,
    "enterprise.ownership.transfer.accept",
    { transferId },
    personalContext(bob)
  );
  assert.equal(accepted.ok, true);

  snapshot = store.snapshot();
  assert.equal(snapshot.ownershipTransfers[0].state, "ACCEPTED");
  assert.equal(snapshot.contexts[0].createdBySubjectId, "alice");

  const aliceOwner = snapshot.relationships.find(
    item => item.relationshipId === "relationship:alice-owner"
  );
  assert.equal(aliceOwner.state, "REVOKED");
  assert.equal(aliceOwner.revokedBySubjectId, "bob");

  const bobOwner = snapshot.relationships.find(
    item => item.subjectId === "bob" && item.kind === "OWNER"
  );
  assert.equal(bobOwner.state, "ACTIVE");

  const aliceGrant = snapshot.grants.find(item => item.grantId === "grant:alice-owner");
  assert.equal(aliceGrant.state, "REVOKED");

  const directory = createHostEnterpriseContextProviderV010(
    [],
    () => store.snapshot().contexts
  );
  const grants = createHostEnterpriseContextGrantProviderV010(
    [],
    () => store.snapshot().grants
  );
  assert.deepEqual(
    createPrincipalContextRegistryV010(alice, {
      enterpriseDirectory: directory,
      enterpriseGrants: grants
    }).list().map(item => item.contextId),
    ["personal:alice"]
  );
  assert.deepEqual(
    createPrincipalContextRegistryV010(bob, {
      enterpriseDirectory: directory,
      enterpriseGrants: grants
    }).list().map(item => item.contextId),
    ["personal:bob", "enterprise:acme"]
  );
});

test("OWNER cannot be revoked directly; transfer is the required path", async () => {
  const store = createMemoryEnterpriseContextGovernanceStoreV010(seed());
  const map = handlers(store);
  const result = await execute(
    map,
    "enterprise.relationship.revoke",
    { relationshipId: "relationship:alice-owner" },
    enterpriseContext(alice)
  );
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "ENTERPRISE_OWNER_REVOKE_REQUIRES_TRANSFER");
  assert.equal(store.snapshot().relationships[0].state, "ACTIVE");
});

test("ownership transfer cancellation is terminal and cannot later be accepted", async () => {
  const store = createMemoryEnterpriseContextGovernanceStoreV010(seed());
  const map = handlers(store, [
    "transfer-bob",
    "event-transfer-created",
    "event-transfer-cancelled"
  ]);

  await execute(
    map,
    "enterprise.ownership.transfer.initiate",
    { toSubjectId: "bob" },
    enterpriseContext(alice)
  );
  const transferId = store.snapshot().ownershipTransfers[0].transferId;

  const cancelled = await execute(
    map,
    "enterprise.ownership.transfer.cancel",
    { transferId },
    enterpriseContext(alice)
  );
  assert.equal(cancelled.ok, true);
  assert.equal(store.snapshot().ownershipTransfers[0].state, "CANCELLED");

  const accepted = await execute(
    map,
    "enterprise.ownership.transfer.accept",
    { transferId },
    personalContext(bob)
  );
  assert.equal(accepted.ok, false);
  assert.equal(accepted.error.code, "ENTERPRISE_OWNERSHIP_TRANSFER_NOT_PENDING");
});

test("relationship revocation also revokes its access Grant", async () => {
  const state = seed();
  state.relationships.push({
    contractVersion: "0.1.0",
    relationshipId: "relationship:bob-member",
    subjectId: "bob",
    contextId: context.contextId,
    kind: "MEMBER",
    state: "ACTIVE",
    createdAt: "2026-09-26T01:00:00.000Z",
    createdBySubjectId: "alice"
  });
  state.grants.push({
    contractVersion: "0.1.0",
    grantId: "grant:bob-member",
    subjectId: "bob",
    contextId: context.contextId,
    relationship: "MEMBER",
    state: "ACTIVE",
    createdAt: "2026-09-26T01:00:00.000Z",
    createdBySubjectId: "alice"
  });
  const store = createMemoryEnterpriseContextGovernanceStoreV010(state);
  const map = handlers(store, ["event-revoke"]);

  const revoked = await execute(
    map,
    "enterprise.relationship.revoke",
    { relationshipId: "relationship:bob-member" },
    enterpriseContext(alice)
  );
  assert.equal(revoked.ok, true);

  const snapshot = store.snapshot();
  assert.equal(
    snapshot.relationships.find(item => item.relationshipId === "relationship:bob-member").state,
    "REVOKED"
  );
  assert.equal(
    snapshot.grants.find(item => item.grantId === "grant:bob-member").state,
    "REVOKED"
  );
});

test("governance store preserves terminal states and forbids relationship reactivation", () => {
  const state = seed();
  state.relationships.push({
    contractVersion: "0.1.0",
    relationshipId: "relationship:bob-member",
    subjectId: "bob",
    contextId: context.contextId,
    kind: "MEMBER",
    state: "ACTIVE",
    createdAt: "2026-09-26T01:00:00.000Z",
    createdBySubjectId: "alice"
  });
  const store = createMemoryEnterpriseContextGovernanceStoreV010(state);

  const revoked = store.snapshot();
  revoked.relationships = revoked.relationships.map(item =>
    item.relationshipId === "relationship:bob-member"
      ? {
          ...item,
          state: "REVOKED",
          revokedAt: "2026-09-26T02:00:00.000Z",
          revokedBySubjectId: "alice"
        }
      : item
  );
  store.save(revoked);

  const reactivated = store.snapshot();
  reactivated.relationships = reactivated.relationships.map(item =>
    item.relationshipId === "relationship:bob-member"
      ? {
          ...item,
          state: "ACTIVE",
          revokedAt: undefined,
          revokedBySubjectId: undefined
        }
      : item
  );
  assert.throws(
    () => store.save(reactivated),
    /ENTERPRISE_RELATIONSHIP_REACTIVATION_FORBIDDEN/
  );
});
