import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryContextMemoryStoreV010
} from "../../dist/manager/context-memory-store.js";
import {
  createHostContextMemoryReaderV010,
  createHostContextMemoryWriterV010
} from "../../dist/providers/context-memory/runtime.js";
import {
  createContextMemoryActionHandlersV010
} from "../../dist/manager/context-memory-actions.js";
import {
  createHostEnterpriseRelationshipProviderV010
} from "../../dist/providers/enterprise-relationship/runtime.js";
import {
  createHostStaticAuthorizationProviderV010
} from "../../dist/providers/authorization/runtime.js";

const alice = {
  contractVersion: "0.1.0",
  subjectId: "alice",
  actorType: "HUMAN",
  identityProviderId: "test.identity",
  displayName: "Alice"
};

const personalRef = {
  contractVersion: "0.1.0",
  kind: "PERSONAL",
  contextId: "personal:alice"
};

const enterpriseRef = {
  contractVersion: "0.1.0",
  kind: "ENTERPRISE",
  contextId: "enterprise:acme",
  enterpriseId: "acme"
};

const enterpriseProfile = {
  contractVersion: "0.1.0",
  kind: "ENTERPRISE",
  contextId: "enterprise:acme",
  enterpriseId: "acme",
  enterpriseProviderId: "test.enterprise",
  displayName: "Acme",
  lifecycleState: "ACTIVE"
};

function personalRequestContext() {
  return {
    contractVersion: "0.1.0",
    principal: alice,
    scope: {
      contractVersion: "0.1.0",
      userId: "alice"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:alice",
        ownerSubjectId: "alice",
        displayName: "Alice"
      },
      activeContext: personalRef
    },
    correlationId: "corr:personal"
  };
}

function enterpriseRequestContext() {
  return {
    contractVersion: "0.1.0",
    principal: alice,
    scope: {
      contractVersion: "0.1.0",
      userId: "alice",
      enterpriseId: "acme"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:alice",
        ownerSubjectId: "alice",
        displayName: "Alice"
      },
      activeContext: enterpriseRef,
      enterpriseContext: enterpriseProfile
    },
    correlationId: "corr:enterprise"
  };
}

function action(code, values, confirmed = true) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code, inputVersion: "0.1.0" },
    values,
    sourceInteractionId: "interaction:" + code,
    actionId: code,
    requiresConfirmation: confirmed
  };
}

function authorization(actions = ["context.memory.record", "context.memory.promote"]) {
  return createHostStaticAuthorizationProviderV010({
    contractVersion: "0.1.0",
    rules: [{
      id: "allow-memory",
      effect: "ALLOW",
      actions,
      subjectIds: ["alice"],
      actorTypes: ["HUMAN"],
      resourceTypes: ["context.memory", "context.memory.promotion"]
    }]
  });
}

function relationshipProvider(kind = "OWNER") {
  const relationships = [{
    contractVersion: "0.1.0",
    relationshipId: "relationship:alice:" + kind.toLowerCase(),
    subjectId: "alice",
    contextId: "enterprise:acme",
    kind,
    state: "ACTIVE",
    createdAt: "2026-09-27T00:00:00.000Z",
    createdBySubjectId: "alice"
  }];
  return createHostEnterpriseRelationshipProviderV010(() => relationships);
}

function harness({
  role = "OWNER",
  allowedActions,
  ids = []
} = {}) {
  const store = createMemoryContextMemoryStoreV010();
  const reader = createHostContextMemoryReaderV010(store);
  const writer = createHostContextMemoryWriterV010(store);
  let sequence = 0;
  const generated = [...ids];
  const handlers = createContextMemoryActionHandlersV010({
    resolveAuthorizationProvider() {
      return authorization(allowedActions);
    },
    resolveReader() {
      return reader;
    },
    resolveWriter() {
      return writer;
    },
    resolveRelationshipProvider() {
      return relationshipProvider(role);
    },
    listAvailableContexts() {
      return [personalRef, enterpriseRef];
    },
    now: () => new Date("2026-09-27T01:02:03.000Z"),
    id: () => generated.shift() ?? "id-" + (++sequence)
  });
  return {
    store,
    reader,
    writer,
    handlers: new Map(handlers.map(item => [item.commandCode, item]))
  };
}

async function execute(harness, code, values, requestContext, confirmed = true) {
  const handler = harness.handlers.get(code);
  assert.ok(handler, "handler " + code + " must exist");
  return handler.execute(action(code, values, confirmed), requestContext);
}

test("Personal Context Memory record has immutable attribution and provenance", async () => {
  const h = harness({ ids: ["personal-1", "personal-2"] });

  const first = await execute(
    h,
    "context.memory.record",
    {
      kind: "FACT",
      summary: "Alice prefers concise architecture reviews.",
      evidenceRefs: ["chat:123"],
      observedAt: "2026-09-27T00:30:00.000Z"
    },
    personalRequestContext()
  );
  assert.equal(first.ok, true);

  const original = structuredClone(h.store.snapshot().items[0]);
  assert.equal(original.context.contextId, "personal:alice");
  assert.equal(original.provenance.origin, "DIRECT");
  assert.equal(original.provenance.sourceContext.contextId, "personal:alice");
  assert.deepEqual(original.provenance.evidenceRefs, ["chat:123"]);
  assert.equal(original.attribution.recordedBySubjectId, "alice");
  assert.equal(original.attribution.recordedAt, "2026-09-27T01:02:03.000Z");

  const second = await execute(
    h,
    "context.memory.record",
    {
      kind: "FACT",
      summary: "Alice prefers concise architecture reviews with CI evidence.",
      supersedesMemoryId: original.memoryId
    },
    personalRequestContext()
  );
  assert.equal(second.ok, true);

  const snapshot = h.store.snapshot();
  assert.equal(snapshot.items.length, 2);
  assert.deepEqual(snapshot.items[0], original);
  assert.equal(snapshot.items[1].supersedesMemoryId, original.memoryId);

  const mutated = h.store.snapshot();
  mutated.items[0].summary = "rewrite history";
  assert.throws(
    () => h.store.save(mutated),
    /CONTEXT_MEMORY_APPEND_ONLY_MUTATION_FORBIDDEN/
  );
});

test("Enterprise Memory write requires OWNER ADMIN or MEMBER; AUDITOR is read-only", async () => {
  const auditor = harness({ role: "AUDITOR" });
  const denied = await execute(
    auditor,
    "context.memory.record",
    { kind: "FACT", summary: "Enterprise fact" },
    enterpriseRequestContext()
  );
  assert.equal(denied.ok, false);
  assert.equal(
    denied.error.code,
    "ENTERPRISE_CONTEXT_MEMORY_WRITE_RELATIONSHIP_REQUIRED"
  );
  assert.equal(auditor.store.snapshot().items.length, 0);

  const member = harness({ role: "MEMBER", ids: ["enterprise-fact"] });
  const allowed = await execute(
    member,
    "context.memory.record",
    { kind: "FACT", summary: "Enterprise fact" },
    enterpriseRequestContext()
  );
  assert.equal(allowed.ok, true);
  assert.equal(member.store.snapshot().items[0].context.contextId, "enterprise:acme");
});

test("Cross-context promotion is denied by default unless policy explicitly allows it", async () => {
  const h = harness({
    allowedActions: ["context.memory.record"],
    ids: ["enterprise-source", "personal-copy"]
  });

  const source = await execute(
    h,
    "context.memory.record",
    {
      kind: "PRACTICE",
      summary: "Use two-person review for supplier bank account changes.",
      evidenceRefs: ["policy:acme-7"]
    },
    enterpriseRequestContext()
  );
  assert.equal(source.ok, true);

  const sourceId = h.store.snapshot().items[0].memoryId;
  const denied = await execute(
    h,
    "context.memory.promote",
    {
      sourceMemoryId: sourceId,
      targetContextId: "personal:alice"
    },
    enterpriseRequestContext()
  );
  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "STATIC_POLICY_NO_MATCH");
  assert.equal(h.store.snapshot().items.length, 1);
});

test("Authorized promotion creates a new Memory with source Context and sourceMemoryId", async () => {
  const h = harness({
    ids: ["enterprise-source", "personal-copy"]
  });

  const recorded = await execute(
    h,
    "context.memory.record",
    {
      kind: "EXPERIENCE",
      summary: "Quarter-end close improved after checklist review.",
      evidenceRefs: ["evidence:close-2026-q3"]
    },
    enterpriseRequestContext()
  );
  assert.equal(recorded.ok, true);
  const source = h.store.snapshot().items[0];

  const promoted = await execute(
    h,
    "context.memory.promote",
    {
      sourceMemoryId: source.memoryId,
      targetContextId: "personal:alice"
    },
    enterpriseRequestContext()
  );
  assert.equal(promoted.ok, true);

  const snapshot = h.store.snapshot();
  assert.equal(snapshot.items.length, 2);
  assert.deepEqual(snapshot.items[0], source);

  const copy = snapshot.items[1];
  assert.equal(copy.context.contextId, "personal:alice");
  assert.equal(copy.provenance.origin, "PROMOTED");
  assert.equal(copy.provenance.sourceMemoryId, source.memoryId);
  assert.equal(copy.provenance.sourceContext.contextId, "enterprise:acme");
  assert.deepEqual(
    copy.provenance.evidenceRefs,
    ["evidence:close-2026-q3"]
  );
  assert.equal(copy.attribution.recordedBySubjectId, "alice");

  const personalRead = await h.reader.read({
    contractVersion: "0.1.0",
    context: personalRef,
    limit: 100
  });
  assert.deepEqual(personalRead.items.map(item => item.memoryId), [copy.memoryId]);

  const enterpriseRead = await h.reader.read({
    contractVersion: "0.1.0",
    context: enterpriseRef,
    limit: 100
  });
  assert.deepEqual(
    enterpriseRead.items.map(item => item.memoryId),
    [source.memoryId]
  );
});

test("Promotion cannot target an unavailable Context and Memory write requires confirmation", async () => {
  const h = harness({ ids: ["personal-source"] });

  const unconfirmed = await execute(
    h,
    "context.memory.record",
    { kind: "CLAIM", summary: "A tentative claim." },
    personalRequestContext(),
    false
  );
  assert.equal(unconfirmed.ok, false);
  assert.equal(unconfirmed.error.code, "MATERIAL_WRITE_CONFIRMATION_REQUIRED");

  await execute(
    h,
    "context.memory.record",
    { kind: "CLAIM", summary: "A tentative claim." },
    personalRequestContext()
  );
  const sourceId = h.store.snapshot().items[0].memoryId;

  const promoted = await execute(
    h,
    "context.memory.promote",
    {
      sourceMemoryId: sourceId,
      targetContextId: "enterprise:not-granted"
    },
    personalRequestContext()
  );
  assert.equal(promoted.ok, false);
  assert.equal(promoted.error.code, "CONTEXT_NOT_AVAILABLE");
});

test("Provider rejects malformed provenance and cross-context supersession", async () => {
  const store = createMemoryContextMemoryStoreV010();
  const writer = createHostContextMemoryWriterV010(store);

  const base = {
    contractVersion: "0.1.0",
    memoryId: "memory:base",
    context: personalRef,
    kind: "FACT",
    summary: "Base fact",
    provenance: {
      contractVersion: "0.1.0",
      origin: "DIRECT",
      sourceContext: personalRef,
      evidenceRefs: []
    },
    attribution: {
      contractVersion: "0.1.0",
      recordedBySubjectId: "alice",
      recordedByActorType: "HUMAN",
      recordedAt: "2026-09-27T00:00:00.000Z"
    }
  };
  await writer.write({ contractVersion: "0.1.0", item: base });

  await assert.rejects(
    () => writer.write({
      contractVersion: "0.1.0",
      item: {
        ...base,
        memoryId: "memory:bad-direct",
        context: enterpriseRef
      }
    }),
    /CONTEXT_MEMORY_DIRECT_SOURCE_MISMATCH/
  );

  await assert.rejects(
    () => writer.write({
      contractVersion: "0.1.0",
      item: {
        ...base,
        memoryId: "memory:bad-supersede",
        context: enterpriseRef,
        provenance: {
          contractVersion: "0.1.0",
          origin: "DIRECT",
          sourceContext: enterpriseRef,
          evidenceRefs: []
        },
        supersedesMemoryId: "memory:base"
      }
    }),
    /CONTEXT_MEMORY_SUPERSEDES_CONTEXT_MISMATCH/
  );
});
