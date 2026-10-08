import test from "node:test";
import assert from "node:assert/strict";

import {
  createConversationThreadStoreV010,
  createMemoryConversationThreadEventStoreV010
} from "../../dist/manager/conversation-thread-store.js";
import {
  previewConversationRetentionV010
} from "../../dist/manager/conversation-thread-retention.js";
import {
  createConversationRetentionPolicyGetActionHandlerV010,
  createConversationRetentionPreviewActionHandlerV010
} from "../../dist/agents/enterprise-agent/thread-retention-action-handler.js";

const principal = {
  contractVersion: "0.1.0",
  subjectId: "retention-user",
  actorType: "HUMAN",
  identityProviderId: "test.identity"
};

const context = {
  contractVersion: "0.1.0",
  personalContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:retention-user",
    ownerSubjectId: "retention-user"
  },
  activeContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:retention-user"
  }
};

function ids(prefix) {
  let n = 0;
  return () => prefix + (++n);
}

function threadStore() {
  return createConversationThreadStoreV010({
    eventStore: createMemoryConversationThreadEventStoreV010(),
    eventId: ids("event-")
  });
}

function createThread(store, id, createdAt) {
  return store.create({
    threadId: id,
    principalSubjectId: principal.subjectId,
    principalActorType: principal.actorType,
    context: context.activeContext,
    createdAt
  });
}

test("retention preview never marks ACTIVE thread purge-eligible", async () => {
  const store = threadStore();
  createThread(store, "thread:active", "2020-01-01T00:00:00.000Z");

  const preview = await previewConversationRetentionV010({
    threadStore: store,
    principalSubjectId: principal.subjectId,
    context: context.activeContext,
    candidatePolicy: {
      contractVersion: "0.1.0",
      retainArchivedForDays: 1
    },
    now: new Date("2026-09-28T00:00:00.000Z")
  });

  assert.equal(preview.destructiveActionExecuted, false);
  assert.equal(preview.totals.examined, 1);
  assert.equal(preview.totals.activeNotEligible, 1);
  assert.equal(preview.totals.archivedWouldPurge, 0);
  assert.equal(preview.items[0].outcome, "ACTIVE_NOT_ELIGIBLE");
  assert.equal(preview.items[0].deadline, undefined);
});

test("retention clock begins at archivedAt and preview is deterministic", async () => {
  const store = threadStore();
  createThread(store, "thread:old", "2026-01-01T00:00:00.000Z");
  createThread(store, "thread:new", "2026-01-01T00:00:00.000Z");

  store.archive({
    threadId: "thread:old",
    archivedAt: "2026-08-01T00:00:00.000Z",
    archivedBySubjectId: principal.subjectId
  });
  store.archive({
    threadId: "thread:new",
    archivedAt: "2026-09-20T00:00:00.000Z",
    archivedBySubjectId: principal.subjectId
  });

  const preview = await previewConversationRetentionV010({
    threadStore: store,
    principalSubjectId: principal.subjectId,
    context: context.activeContext,
    candidatePolicy: {
      contractVersion: "0.1.0",
      retainArchivedForDays: 30
    },
    now: new Date("2026-09-28T00:00:00.000Z")
  });

  assert.equal(preview.totals.archivedWouldPurge, 1);
  assert.equal(preview.totals.archivedWouldRetain, 1);
  assert.deepEqual(
    preview.items.map(item => [item.threadId, item.outcome]),
    [
      ["thread:new", "ARCHIVED_WOULD_RETAIN"],
      ["thread:old", "ARCHIVED_WOULD_PURGE"]
    ]
  );
  assert.equal(
    preview.items.find(item => item.threadId === "thread:old").deadline,
    "2026-08-31T00:00:00.000Z"
  );
});

test("retention preview action is scoped and remains READ-only simulation", async () => {
  const store = threadStore();
  createThread(store, "thread:one", "2026-01-01T00:00:00.000Z");
  store.archive({
    threadId: "thread:one",
    archivedAt: "2026-08-01T00:00:00.000Z",
    archivedBySubjectId: principal.subjectId
  });

  const handler = createConversationRetentionPreviewActionHandlerV010({
    threadStore: store,
    resolveIdentitySession() {
      return { contractVersion: "0.1.0", principal };
    },
    resolveContext() { return context; },
    retainArchivedForDays: 90,
    policySource: "HUMAN_PLATFORM_DEFAULT",
    now: () => new Date("2026-09-28T00:00:00.000Z")
  });

  const beforeEvents = store.events("thread:one");
  const result = await handler.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "enterprise-agent.thread.retention.preview",
      inputVersion: "0.1.0"
    },
    values: {
      retainArchivedForDays: 30
    },
    sourceInteractionId: "retention:test",
    actionId: "preview",
    requiresConfirmation: false
  }, {
    contractVersion: "0.1.0",
    principal,
    context
  });

  assert.equal(result.ok, true);
  assert.equal(result.result.scope, "READER_VISIBLE_CURRENT_CONTEXT");
  assert.equal(result.result.destructiveActionExecuted, false);
  assert.equal(result.result.totals.archivedWouldPurge, 1);
  assert.deepEqual(store.events("thread:one"), beforeEvents);
});

test("retention preview rejects invalid candidate days", async () => {
  const store = threadStore();
  for (const days of [0, -1, 1.5, 36501]) {
    await assert.rejects(
      () => previewConversationRetentionV010({
        threadStore: store,
        principalSubjectId: principal.subjectId,
        context: context.activeContext,
        candidatePolicy: {
          contractVersion: "0.1.0",
          retainArchivedForDays: days
        }
      }),
      /CONVERSATION_RETENTION_POLICY_INVALID/
    );
  }
});


test("Human-selected 90-day policy is the default preview and is readable without enabling purge", async () => {
  const store = threadStore();
  createThread(store, "thread:policy", "2026-01-01T00:00:00.000Z");
  store.archive({
    threadId: "thread:policy",
    archivedAt: "2026-06-01T00:00:00.000Z",
    archivedBySubjectId: principal.subjectId
  });

  const dependencies = {
    threadStore: store,
    resolveIdentitySession() {
      return { contractVersion: "0.1.0", principal };
    },
    resolveContext() { return context; },
    retainArchivedForDays: 90,
    policySource: "HUMAN_PLATFORM_DEFAULT",
    now: () => new Date("2026-09-28T00:00:00.000Z")
  };

  const previewHandler = createConversationRetentionPreviewActionHandlerV010(
    dependencies
  );
  const preview = await previewHandler.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "enterprise-agent.thread.retention.preview",
      inputVersion: "0.1.0"
    },
    values: {},
    sourceInteractionId: "retention:default",
    actionId: "preview",
    requiresConfirmation: false
  }, {
    contractVersion: "0.1.0",
    principal,
    context
  });

  assert.equal(preview.ok, true);
  assert.equal(preview.result.candidatePolicy.retainArchivedForDays, 90);
  assert.equal(preview.result.policySource, "HUMAN_PLATFORM_DEFAULT");
  assert.equal(preview.result.destructiveActionExecuted, false);
  assert.equal(preview.result.items[0].deadline, "2026-08-30T00:00:00.000Z");
  assert.equal(preview.result.items[0].outcome, "ARCHIVED_WOULD_PURGE");

  const getHandler = createConversationRetentionPolicyGetActionHandlerV010(
    dependencies
  );
  const got = await getHandler.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "enterprise-agent.thread.retention.policy.get",
      inputVersion: "0.1.0"
    },
    values: {},
    sourceInteractionId: "retention:policy:get",
    actionId: "policy.get",
    requiresConfirmation: false
  }, {
    contractVersion: "0.1.0",
    principal,
    context
  });

  assert.equal(got.ok, true);
  assert.deepEqual(got.result.policy, {
    contractVersion: "0.1.0",
    retainArchivedForDays: 90,
    source: "HUMAN_PLATFORM_DEFAULT",
    appliesOnlyTo: "ARCHIVED_THREADS",
    clockStartsAt: "archivedAt",
    activeThreadsNeverEligible: true,
    destructivePurgeEnabled: false
  });
});
