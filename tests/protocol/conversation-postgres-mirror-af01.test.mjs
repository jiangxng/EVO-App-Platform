import test from "node:test";
import assert from "node:assert/strict";

import {
  createConversationThreadStoreV010,
  createMemoryConversationThreadEventStoreV010
} from "../../dist/manager/conversation-thread-store.js";
import {
  createMirroredConversationThreadStoreV010
} from "../../dist/manager/conversation-mirror-store.js";

function ids(prefix) {
  let value = 0;
  return () => prefix + (++value);
}

function primaryStore() {
  return createConversationThreadStoreV010({
    eventStore: createMemoryConversationThreadEventStoreV010(),
    eventId: ids("event-")
  });
}

const personalContext = {
  contractVersion: "0.1.0",
  kind: "PERSONAL",
  contextId: "personal:af01"
};

test("AF-01 bounded mirror preserves authoritative JSONL event identities", async () => {
  const primary = primaryStore();
  const mirroredSnapshots = [];
  const postgres = {
    store: {},
    async importEvents(events) {
      mirroredSnapshots.push(structuredClone(events));
      return {
        sourceEventCount: events.length,
        sourceThreadCount: events.filter(event => event.type === "THREAD_CREATED").length,
        sourceMessageCount: events.filter(event => event.type === "MESSAGE_APPENDED").length,
        sourceDigest: "test",
        target: {
          schema: "app_platform_conversation",
          threadCount: 1,
          messageCount: events.filter(event => event.type === "MESSAGE_APPENDED").length,
          eventCount: events.length,
          eventDigest: "test"
        },
        imported: true
      };
    },
    async integrity() {
      throw new Error("NOT_NEEDED");
    },
    async close() {}
  };

  const store = createMirroredConversationThreadStoreV010({
    primary,
    postgres
  });

  const created = await store.create({
    threadId: "conversation-thread:af01",
    principalSubjectId: "af01-user",
    principalActorType: "HUMAN",
    context: personalContext,
    createdAt: "2026-10-08T09:00:00.000Z"
  });
  await store.appendMessage({
    threadId: created.threadId,
    messageId: "message:user:1",
    role: "USER",
    content: "persist this turn",
    createdAt: "2026-10-08T09:00:01.000Z",
    runId: "agent-run:1"
  });
  await store.archive({
    threadId: created.threadId,
    archivedAt: "2026-10-08T09:00:02.000Z",
    archivedBySubjectId: "af01-user"
  });

  assert.equal(mirroredSnapshots.length, 3);
  const authoritativeEvents = await primary.events(created.threadId);
  assert.deepEqual(
    mirroredSnapshots.at(-1).map(event => event.eventId),
    authoritativeEvents.map(event => event.eventId)
  );
  assert.deepEqual(
    mirroredSnapshots.at(-1).map(event => event.type),
    ["THREAD_CREATED", "MESSAGE_APPENDED", "THREAD_ARCHIVED"]
  );
  assert.equal((await store.get(created.threadId)).messages.length, 1);
});

test("AF-01 mirror outage does not replace JSONL authority before cutover", async () => {
  const primary = primaryStore();
  const errors = [];
  const store = createMirroredConversationThreadStoreV010({
    primary,
    postgres: {
      store: {},
      async importEvents() {
        throw new Error("POSTGRES_UNAVAILABLE");
      },
      async integrity() {
        throw new Error("NOT_NEEDED");
      },
      async close() {}
    },
    onMirrorError(error, threadId) {
      errors.push({
        threadId,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const created = await store.create({
    threadId: "conversation-thread:mirror-fallback",
    principalSubjectId: "af01-user",
    principalActorType: "HUMAN",
    context: personalContext,
    createdAt: "2026-10-08T09:10:00.000Z"
  });

  assert.equal(created.threadId, "conversation-thread:mirror-fallback");
  assert.equal((await primary.events(created.threadId)).length, 1);
  assert.deepEqual(errors, [{
    threadId: created.threadId,
    message: "POSTGRES_UNAVAILABLE"
  }]);
});
