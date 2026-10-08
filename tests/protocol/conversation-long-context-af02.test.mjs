import test from "node:test";
import assert from "node:assert/strict";

import {
  createConversationThreadStoreV010,
  createMemoryConversationThreadEventStoreV010
} from "../../dist/manager/conversation-thread-store.js";
import {
  createConversationContextAssemblerV010,
  createDeterministicConversationCompressionProviderV010,
  createMemoryConversationContextArtifactStoreV010
} from "../../dist/manager/conversation-context-assembly.js";

function ids(prefix) {
  let value = 0;
  return () => prefix + (++value);
}

async function threadWithMessages(count, size = 120) {
  const store = createConversationThreadStoreV010({
    eventStore: createMemoryConversationThreadEventStoreV010(),
    eventId: ids("event-")
  });
  await store.create({
    threadId: "conversation-thread:af02",
    principalSubjectId: "user-af02",
    principalActorType: "HUMAN",
    context: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:user-af02"
    },
    createdAt: "2026-10-08T09:40:00.000Z"
  });
  for (let index = 0; index < count; index += 1) {
    await store.appendMessage({
      threadId: "conversation-thread:af02",
      messageId: "message-" + (index + 1),
      role: index % 2 === 0 ? "USER" : "ASSISTANT",
      content:
        (index === 0 ? "目标: 保留长期上下文。 " : "")
        + (index === 2 ? "决定: 原始消息永远是权威。 " : "")
        + ("message-" + (index + 1) + " ").repeat(size),
      createdAt: new Date(Date.UTC(2026, 9, 8, 9, 40, index)).toISOString()
    });
  }
  return store;
}

test("AF-02 short conversations remain direct and uncompressed", async () => {
  const store = await threadWithMessages(4, 10);
  const artifacts = createMemoryConversationContextArtifactStoreV010();
  const assembler = createConversationContextAssemblerV010({
    artifactStore: artifacts,
    policy: {
      contractVersion: "0.1.0",
      policyId: "af02-test",
      version: "1",
      directHistoryMaxMessages: 8,
      directHistoryMaxCharacters: 10_000,
      recentTailMessages: 4,
      summaryMaxCharacters: 2_000
    }
  });

  const result = await assembler.assemble({
    threadId: "conversation-thread:af02",
    threadStore: store,
    now: "2026-10-08T09:50:00.000Z"
  });

  assert.equal(result.mode, "DIRECT");
  assert.equal(result.includedSummaryId, undefined);
  assert.equal(result.sourceMessageCount, 4);
  assert.ok(result.totalCharacters < 10_000);
});

test("AF-02 long conversations produce source-backed bounded checkpoint context", async () => {
  const store = await threadWithMessages(24, 40);
  const artifacts = createMemoryConversationContextArtifactStoreV010();
  const policy = {
    contractVersion: "0.1.0",
    policyId: "af02-test",
    version: "1",
    directHistoryMaxMessages: 8,
    directHistoryMaxCharacters: 4_000,
    recentTailMessages: 4,
    summaryMaxCharacters: 1_200
  };
  const assembler = createConversationContextAssemblerV010({
    artifactStore: artifacts,
    compressor: createDeterministicConversationCompressionProviderV010(),
    policy
  });

  const result = await assembler.assemble({
    threadId: "conversation-thread:af02",
    threadStore: store,
    now: "2026-10-08T09:50:00.000Z"
  });

  assert.equal(result.mode, "COMPRESSED");
  assert.ok(result.includedSummaryId);
  assert.equal(result.sourceMessageCount, 24);
  assert.equal(result.includedRecentMessageCount, 4);
  assert.ok(result.totalCharacters <= policy.directHistoryMaxCharacters);

  const summary = await artifacts.latestSummary({
    threadId: "conversation-thread:af02",
    policyId: policy.policyId,
    policyVersion: policy.version
  });
  assert.ok(summary);
  assert.equal(summary.sourceMessageCount, 20);
  assert.equal(summary.sourceFirstMessageId, "message-1");
  assert.equal(summary.sourceLastMessageId, "message-20");
  assert.equal(summary.sourceMessageIds.length, 20);
  assert.equal(summary.provenance.strategy, "DETERMINISTIC_EXTRACTIVE");
  assert.equal(summary.provenance.policyVersion, "1");
  assert.match(summary.activeGoals.join("\n"), /目标/);
  assert.match(summary.decisions.join("\n"), /决定/);

  const original = await store.get("conversation-thread:af02");
  assert.equal(original.messages.length, 24);
  assert.equal(original.messages[0].messageId, "message-1");
});

test("AF-02 changed compression policy regenerates a new summary version without overwriting source", async () => {
  const store = await threadWithMessages(18, 30);
  const artifacts = createMemoryConversationContextArtifactStoreV010();

  const make = version => createConversationContextAssemblerV010({
    artifactStore: artifacts,
    policy: {
      contractVersion: "0.1.0",
      policyId: "af02-test",
      version,
      directHistoryMaxMessages: 6,
      directHistoryMaxCharacters: 3_000,
      recentTailMessages: 4,
      summaryMaxCharacters: 900
    }
  });

  const first = await make("1").assemble({
    threadId: "conversation-thread:af02",
    threadStore: store,
    now: "2026-10-08T09:51:00.000Z"
  });
  const second = await make("2").assemble({
    threadId: "conversation-thread:af02",
    threadStore: store,
    now: "2026-10-08T09:52:00.000Z"
  });

  assert.equal(first.mode, "COMPRESSED");
  assert.equal(second.mode, "COMPRESSED");
  assert.notEqual(first.includedSummaryId, second.includedSummaryId);

  const v1 = await artifacts.latestSummary({
    threadId: "conversation-thread:af02",
    policyId: "af02-test",
    policyVersion: "1"
  });
  const v2 = await artifacts.latestSummary({
    threadId: "conversation-thread:af02",
    policyId: "af02-test",
    policyVersion: "2"
  });
  assert.ok(v1);
  assert.ok(v2);
  assert.equal(v1.provenance.policyVersion, "1");
  assert.equal(v2.provenance.policyVersion, "2");
  assert.equal((await store.get("conversation-thread:af02")).messages.length, 18);
});

test("AF-02 compressor failure falls back to recent raw Conversation without corruption", async () => {
  const store = await threadWithMessages(20, 35);
  const artifacts = createMemoryConversationContextArtifactStoreV010();
  const assembler = createConversationContextAssemblerV010({
    artifactStore: artifacts,
    compressor: {
      async compress() {
        throw new Error("MODEL_PROVIDER_UNAVAILABLE");
      }
    },
    policy: {
      contractVersion: "0.1.0",
      policyId: "af02-test",
      version: "failure",
      directHistoryMaxMessages: 6,
      directHistoryMaxCharacters: 2_000,
      recentTailMessages: 4,
      summaryMaxCharacters: 800
    }
  });

  const result = await assembler.assemble({
    threadId: "conversation-thread:af02",
    threadStore: store,
    now: "2026-10-08T09:53:00.000Z"
  });

  assert.equal(result.mode, "FALLBACK_RECENT");
  assert.equal(result.diagnostic, "MODEL_PROVIDER_UNAVAILABLE");
  assert.equal(result.includedRecentMessageCount, 4);
  assert.equal((await store.get("conversation-thread:af02")).messages.length, 20);
});
