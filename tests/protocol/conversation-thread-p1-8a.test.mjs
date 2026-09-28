import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createConversationThreadStoreV010,
  createJsonlConversationThreadEventStoreV010,
  createMemoryConversationThreadEventStoreV010
} from "../../dist/manager/conversation-thread-store.js";
import {
  createPersonalAgentThreadActionHandlersV010
} from "../../dist/agents/enterprise-agent/thread-action-handlers.js";
import {
  createThreadBackedAgentTurnActionHandlersV010
} from "../../dist/agents/enterprise-agent/thread-turn-action-handlers.js";

const principal = {
  contractVersion: "0.1.0",
  subjectId: "lifecycle-user",
  actorType: "HUMAN",
  identityProviderId: "test.identity"
};

const context = {
  contractVersion: "0.1.0",
  personalContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:lifecycle-user",
    ownerSubjectId: "lifecycle-user"
  },
  activeContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:lifecycle-user"
  }
};

function ids(prefix) {
  let n = 0;
  return () => prefix + (++n);
}

function store(eventStore = createMemoryConversationThreadEventStoreV010()) {
  return createConversationThreadStoreV010({
    eventStore,
    eventId: ids("event-")
  });
}

function createThread(value, id = "conversation-thread:1") {
  return value.create({
    threadId: id,
    principalSubjectId: principal.subjectId,
    principalActorType: principal.actorType,
    context: context.activeContext,
    createdAt: "2026-09-28T01:00:00.000Z"
  });
}

function request(code, values = {}) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code, inputVersion: "0.1.0" },
    values,
    sourceInteractionId: "p1.8a:test",
    actionId: code,
    requiresConfirmation: false
  };
}

const requestContext = {
  contractVersion: "0.1.0",
  principal,
  context
};

test("Conversation Thread lifecycle is append-only ACTIVE -> ARCHIVED and messages remain readable", () => {
  const value = store();
  const created = createThread(value);
  assert.equal(created.state, "ACTIVE");

  value.appendMessage({
    threadId: created.threadId,
    messageId: "message:1",
    role: "USER",
    content: "durable discourse",
    createdAt: "2026-09-28T01:00:01.000Z"
  });

  const archived = value.archive({
    threadId: created.threadId,
    archivedAt: "2026-09-28T01:00:02.000Z",
    archivedBySubjectId: principal.subjectId
  });

  assert.equal(archived.state, "ARCHIVED");
  assert.equal(archived.archivedAt, "2026-09-28T01:00:02.000Z");
  assert.equal(archived.archivedBySubjectId, principal.subjectId);
  assert.equal(archived.messages.length, 1);
  assert.deepEqual(
    value.events(created.threadId).map(event => event.type),
    ["THREAD_CREATED", "MESSAGE_APPENDED", "THREAD_ARCHIVED"]
  );

  const idempotent = value.archive({
    threadId: created.threadId,
    archivedAt: "2026-09-28T01:00:03.000Z",
    archivedBySubjectId: principal.subjectId
  });
  assert.equal(idempotent.archivedAt, "2026-09-28T01:00:02.000Z");
  assert.equal(value.events(created.threadId).length, 3);

  assert.throws(
    () => value.appendMessage({
      threadId: created.threadId,
      messageId: "message:2",
      role: "USER",
      content: "must not append",
      createdAt: "2026-09-28T01:00:04.000Z"
    }),
    /CONVERSATION_THREAD_ARCHIVED/
  );

  assert.deepEqual(value.conversationHistory({
    threadId: created.threadId
  }), [{ role: "user", content: "durable discourse" }]);
});

test("default thread list excludes archived while exact get and includeArchived remain complete", () => {
  const value = store();
  createThread(value, "conversation-thread:active");
  createThread(value, "conversation-thread:archived");
  value.archive({
    threadId: "conversation-thread:archived",
    archivedAt: "2026-09-28T01:00:03.000Z",
    archivedBySubjectId: principal.subjectId
  });

  assert.deepEqual(
    value.list({
      principalSubjectId: principal.subjectId,
      context: context.activeContext
    }).map(item => item.threadId),
    ["conversation-thread:active"]
  );

  assert.deepEqual(
    new Set(value.list({
      principalSubjectId: principal.subjectId,
      context: context.activeContext,
      includeArchived: true
    }).map(item => item.threadId)),
    new Set(["conversation-thread:active", "conversation-thread:archived"])
  );

  assert.equal(
    value.get("conversation-thread:archived").state,
    "ARCHIVED"
  );
});

test("archive action is Host-scoped and default list behavior is explicit", async () => {
  const value = store();
  createThread(value);
  const handlers = createPersonalAgentThreadActionHandlersV010({
    threadStore: value,
    resolveIdentitySession() {
      return { contractVersion: "0.1.0", principal };
    },
    resolveContext() { return context; },
    threadId: ids("thread-"),
    now: () => new Date("2026-09-28T01:10:00.000Z")
  });
  const byCode = new Map(handlers.map(item => [item.commandCode, item]));

  const archived = await byCode.get("enterprise-agent.thread.archive").execute(
    request("enterprise-agent.thread.archive", {
      threadId: "conversation-thread:1"
    }),
    requestContext
  );
  assert.equal(archived.ok, true);
  assert.equal(archived.result.thread.state, "ARCHIVED");

  const list = await byCode.get("enterprise-agent.thread.list").execute(
    request("enterprise-agent.thread.list", {}),
    requestContext
  );
  assert.equal(list.ok, true);
  assert.equal(list.result.threads.length, 0);

  const all = await byCode.get("enterprise-agent.thread.list").execute(
    request("enterprise-agent.thread.list", { includeArchived: true }),
    requestContext
  );
  assert.equal(all.ok, true);
  assert.equal(all.result.threads.length, 1);
  assert.equal(all.result.threads[0].state, "ARCHIVED");
});

test("thread-backed send rejects archived thread before starting a new Agent Run", async () => {
  const value = store();
  createThread(value);
  value.archive({
    threadId: "conversation-thread:1",
    archivedAt: "2026-09-28T01:00:02.000Z",
    archivedBySubjectId: principal.subjectId
  });

  let providerResolved = false;
  let runCreated = false;
  const handlers = createThreadBackedAgentTurnActionHandlersV010({
    threadStore: value,
    runStore: {
      create() { runCreated = true; throw new Error("SHOULD_NOT_CREATE_RUN"); },
      get() { return undefined; },
      list() { return []; },
      events() { return []; }
    },
    runExecutor: {
      async resume() { throw new Error("SHOULD_NOT_RESUME"); }
    },
    resolveLlmProvider() {
      providerResolved = true;
      return { installedProviderIds: [] };
    },
    resolveIdentitySession() {
      return { contractVersion: "0.1.0", principal };
    },
    resolveContext() { return context; },
    createToolCatalog() {
      throw new Error("SHOULD_NOT_CREATE_CATALOG");
    },
    runId: ids("run-")
  });

  const send = handlers.find(
    item => item.commandCode === "enterprise-agent.thread.send"
  );
  const result = await send.execute(
    request("enterprise-agent.thread.send", {
      threadId: "conversation-thread:1",
      message: "should be rejected"
    }),
    requestContext
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "CONVERSATION_THREAD_ARCHIVED");
  assert.equal(providerResolved, false);
  assert.equal(runCreated, false);
});

test("file-backed lifecycle reconstructs archived state without deleting discourse", () => {
  const directory = mkdtempSync(join(tmpdir(), "conversation-lifecycle-"));
  const path = join(directory, "threads.jsonl");

  const first = store(createJsonlConversationThreadEventStoreV010(path));
  createThread(first);
  first.appendMessage({
    threadId: "conversation-thread:1",
    messageId: "message:1",
    role: "USER",
    content: "persist me",
    createdAt: "2026-09-28T01:00:01.000Z"
  });
  first.archive({
    threadId: "conversation-thread:1",
    archivedAt: "2026-09-28T01:00:02.000Z",
    archivedBySubjectId: principal.subjectId
  });

  const second = store(createJsonlConversationThreadEventStoreV010(path));
  const restored = second.get("conversation-thread:1");
  assert.equal(restored.state, "ARCHIVED");
  assert.equal(restored.messages[0].content, "persist me");
  assert.equal(restored.archivedBySubjectId, principal.subjectId);
});
