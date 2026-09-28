import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
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

const principal = {
  contractVersion: "0.1.0",
  subjectId: "thread-user",
  actorType: "HUMAN",
  identityProviderId: "test.identity"
};

const personalContext = {
  contractVersion: "0.1.0",
  personalContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:thread-user",
    ownerSubjectId: "thread-user"
  },
  activeContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:thread-user"
  }
};

const enterpriseContext = {
  contractVersion: "0.1.0",
  personalContext: personalContext.personalContext,
  activeContext: {
    contractVersion: "0.1.0",
    kind: "ENTERPRISE",
    contextId: "enterprise:one:thread-user",
    enterpriseId: "enterprise:one"
  },
  enterpriseContext: {
    contractVersion: "0.1.0",
    kind: "ENTERPRISE",
    contextId: "enterprise:one:thread-user",
    enterpriseId: "enterprise:one"
  }
};

function ids(prefix) {
  let n = 0;
  return () => prefix + (++n);
}

function memoryStore() {
  return createConversationThreadStoreV010({
    eventStore: createMemoryConversationThreadEventStoreV010(),
    eventId: ids("event-")
  });
}

function createThread(store, extra = {}) {
  return store.create({
    threadId: extra.threadId ?? "conversation-thread:1",
    principalSubjectId: extra.principalSubjectId ?? principal.subjectId,
    principalActorType: extra.principalActorType ?? principal.actorType,
    context: extra.context ?? personalContext.activeContext,
    createdAt: extra.createdAt ?? "2026-09-28T01:00:00.000Z",
    ...(extra.title ? { title: extra.title } : {})
  });
}

test("Conversation Thread materializes append-only visible discourse and run links", () => {
  const store = memoryStore();
  const created = createThread(store, { title: "Operations" });

  assert.equal(created.threadId, "conversation-thread:1");
  assert.equal(created.messages.length, 0);
  assert.equal(created.principalSubjectId, principal.subjectId);
  assert.deepEqual(created.context, personalContext.activeContext);

  store.appendMessage({
    threadId: created.threadId,
    messageId: "message:user:1",
    role: "USER",
    content: "检查 18:00 订单",
    createdAt: "2026-09-28T01:00:01.000Z",
    runId: "agent-run:1"
  });
  const next = store.appendMessage({
    threadId: created.threadId,
    messageId: "message:assistant:1",
    role: "ASSISTANT",
    content: "正常规则下已超过 17:00 截单。",
    createdAt: "2026-09-28T01:00:02.000Z",
    runId: "agent-run:1",
    replyToMessageId: "message:user:1",
    presentation: {
      parts: [{ type: "text", text: "正常规则下已超过 17:00 截单。" }]
    }
  });

  assert.equal(next.messages.length, 2);
  assert.equal(next.messages[0].runId, "agent-run:1");
  assert.equal(next.messages[1].replyToMessageId, "message:user:1");
  assert.equal(next.messages[1].runId, "agent-run:1");

  const events = store.events(created.threadId);
  assert.deepEqual(
    events.map(event => event.type),
    ["THREAD_CREATED", "MESSAGE_APPENDED", "MESSAGE_APPENDED"]
  );
});

test("Conversation Thread rejects ownership rewrite, duplicate message IDs and dangling replies", () => {
  const eventStore = createMemoryConversationThreadEventStoreV010();
  const store = createConversationThreadStoreV010({
    eventStore,
    eventId: ids("event-")
  });
  createThread(store);

  assert.throws(
    () => eventStore.append({
      contractVersion: "0.1.0",
      eventId: "event:second-root",
      threadId: "conversation-thread:1",
      type: "THREAD_CREATED",
      occurredAt: "2026-09-28T01:00:01.000Z",
      payload: {
        principalSubjectId: "attacker",
        principalActorType: "HUMAN",
        context: enterpriseContext.activeContext,
        createdAt: "2026-09-28T01:00:01.000Z"
      }
    }),
    /CONVERSATION_THREAD_CREATED_EVENT_REQUIRED/
  );

  store.appendMessage({
    threadId: "conversation-thread:1",
    messageId: "message:1",
    role: "USER",
    content: "one",
    createdAt: "2026-09-28T01:00:02.000Z"
  });

  assert.throws(
    () => store.appendMessage({
      threadId: "conversation-thread:1",
      messageId: "message:1",
      role: "ASSISTANT",
      content: "duplicate",
      createdAt: "2026-09-28T01:00:03.000Z"
    }),
    /CONVERSATION_MESSAGE_ID_DUPLICATE/
  );

  assert.throws(
    () => store.appendMessage({
      threadId: "conversation-thread:1",
      messageId: "message:2",
      role: "ASSISTANT",
      content: "dangling",
      createdAt: "2026-09-28T01:00:03.000Z",
      replyToMessageId: "message:missing"
    }),
    /CONVERSATION_MESSAGE_REPLY_TARGET_NOT_FOUND/
  );
});

test("Conversation Thread builds bounded model history from durable USER/ASSISTANT discourse only", () => {
  const store = memoryStore();
  createThread(store);

  const messages = [
    ["u1", "USER", "11111"],
    ["s1", "SYSTEM", "internal status"],
    ["a1", "ASSISTANT", "22222"],
    ["u2", "USER", "33333"]
  ];
  let second = 1;
  for (const [id, role, content] of messages) {
    store.appendMessage({
      threadId: "conversation-thread:1",
      messageId: id,
      role,
      content,
      createdAt: "2026-09-28T01:00:0" + (++second) + ".000Z"
    });
  }

  const history = store.conversationHistory({
    threadId: "conversation-thread:1",
    maxMessages: 10,
    maxTotalCharacters: 10,
    maxCharactersPerMessage: 100
  });

  assert.deepEqual(history, [
    { role: "assistant", content: "22222" },
    { role: "user", content: "33333" }
  ]);

  const beforeCurrentUser = store.conversationHistory({
    threadId: "conversation-thread:1",
    excludeMessageId: "u2"
  });
  assert.deepEqual(beforeCurrentUser, [
    { role: "user", content: "11111" },
    { role: "assistant", content: "22222" }
  ]);
});

test("Conversation Thread JSONL reconstructs after process restart without any Context Memory dependency", () => {
  const directory = mkdtempSync(join(tmpdir(), "conversation-thread-"));
  const path = join(directory, "threads.jsonl");

  const first = createConversationThreadStoreV010({
    eventStore: createJsonlConversationThreadEventStoreV010(path),
    eventId: ids("first-")
  });
  createThread(first);
  first.appendMessage({
    threadId: "conversation-thread:1",
    messageId: "message:1",
    role: "USER",
    content: "durable discourse",
    createdAt: "2026-09-28T01:00:01.000Z",
    runId: "agent-run:1"
  });

  const second = createConversationThreadStoreV010({
    eventStore: createJsonlConversationThreadEventStoreV010(path),
    eventId: ids("second-")
  });
  const restored = second.get("conversation-thread:1");
  assert.equal(restored.messages.length, 1);
  assert.equal(restored.messages[0].content, "durable discourse");
  assert.equal(restored.messages[0].runId, "agent-run:1");

  const lines = readFileSync(path, "utf8").trim().split(/\r?\n/u);
  assert.equal(lines.length, 2);
  assert.deepEqual(
    lines.map(line => JSON.parse(line).type),
    ["THREAD_CREATED", "MESSAGE_APPENDED"]
  );
  assert.equal(
    lines.some(line => line.includes("memoryId") || line.includes("Context Memory")),
    false
  );
});

test("Conversation Thread get/list actions are scoped to current Principal and active Context", async () => {
  const store = memoryStore();
  createThread(store, {
    threadId: "conversation-thread:personal",
    context: personalContext.activeContext
  });
  createThread(store, {
    threadId: "conversation-thread:enterprise",
    context: enterpriseContext.activeContext,
    createdAt: "2026-09-28T01:00:01.000Z"
  });

  const handlers = createPersonalAgentThreadActionHandlersV010({
    threadStore: store,
    resolveIdentitySession() {
      return { contractVersion: "0.1.0", principal };
    },
    resolveContext() {
      return personalContext;
    },
    threadId: ids("generated-"),
    now: () => new Date("2026-09-28T01:01:00.000Z")
  });
  const byCode = new Map(handlers.map(handler => [handler.commandCode, handler]));
  const requestContext = {
    contractVersion: "0.1.0",
    principal,
    context: personalContext
  };

  const list = await byCode.get("enterprise-agent.thread.list").execute({
    contractVersion: "0.1.0",
    type: "command",
    command: { code: "enterprise-agent.thread.list", inputVersion: "0.1.0" },
    values: {},
    sourceInteractionId: "test",
    actionId: "list",
    requiresConfirmation: false
  }, requestContext);

  assert.equal(list.ok, true);
  assert.deepEqual(
    list.result.threads.map(thread => thread.threadId),
    ["conversation-thread:personal"]
  );

  const hidden = await byCode.get("enterprise-agent.thread.get").execute({
    contractVersion: "0.1.0",
    type: "command",
    command: { code: "enterprise-agent.thread.get", inputVersion: "0.1.0" },
    values: { threadId: "conversation-thread:enterprise" },
    sourceInteractionId: "test",
    actionId: "get",
    requiresConfirmation: false
  }, requestContext);
  assert.equal(hidden.ok, false);
  assert.equal(hidden.error.code, "CONVERSATION_THREAD_NOT_FOUND");

  const created = await byCode.get("enterprise-agent.thread.create").execute({
    contractVersion: "0.1.0",
    type: "command",
    command: { code: "enterprise-agent.thread.create", inputVersion: "0.1.0" },
    values: {
      title: "New thread",
      activeContext: enterpriseContext.activeContext
    },
    sourceInteractionId: "test",
    actionId: "create",
    requiresConfirmation: false
  }, requestContext);
  assert.equal(created.ok, true);
  assert.deepEqual(created.result.thread.context, personalContext.activeContext);
  assert.equal(created.result.thread.principalSubjectId, principal.subjectId);
});
