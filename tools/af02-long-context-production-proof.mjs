import { randomUUID } from "node:crypto";

import {
  createConversationContextAssemblerV010
} from "../dist/manager/conversation-context-assembly.js";
import {
  createPostgresConversationContextArtifactStoreV010
} from "../dist/manager/conversation-context-postgres-store.js";
import {
  createPostgresConversationAuthorityV010
} from "../dist/manager/conversation-postgres-store.js";

function fail(message, details = {}) {
  console.error("AF02_LONG_CONTEXT_PRODUCTION_PROOF_FAIL", JSON.stringify({
    message,
    ...details
  }));
  process.exitCode = 1;
  throw new Error(message);
}

function assert(condition, message, details = {}) {
  if (!condition) fail(message, details);
}

const databaseUrl = process.env.APP_PLATFORM_CONVERSATION_DATABASE_URL?.trim();
if (!databaseUrl) fail("CONVERSATION_POSTGRES_DATABASE_URL_REQUIRED");
const schema =
  process.env.APP_PLATFORM_CONVERSATION_POSTGRES_SCHEMA?.trim()
  || "app_platform_conversation";
const runId =
  process.env.RAILWAY_DEPLOYMENT_ID?.trim()
  || process.env.AF02_PROOF_RUN_ID?.trim()
  || randomUUID();
const threadId = "conversation-thread:proof-af02-" + runId;
const context = {
  contractVersion: "0.1.0",
  kind: "PERSONAL",
  contextId: "personal:proof-af02-" + runId
};

const authority = await createPostgresConversationAuthorityV010({
  connectionString: databaseUrl,
  schema
});
const artifacts = await createPostgresConversationContextArtifactStoreV010({
  connectionString: databaseUrl,
  schema
});

try {
  await authority.store.create({
    threadId,
    principalSubjectId: "proof-af02",
    principalActorType: "HUMAN",
    context,
    createdAt: "2026-10-08T09:45:00.000Z",
    title: "AF-02 production proof"
  });

  for (let index = 0; index < 30; index += 1) {
    await authority.store.appendMessage({
      threadId,
      messageId: threadId + ":message:" + String(index + 1),
      role: index % 2 === 0 ? "USER" : "ASSISTANT",
      content:
        (index === 0 ? "目标: 验证长对话不会因为压缩丢失原始消息。\n" : "")
        + (index === 2 ? "决定: Conversation 原文始终是权威。\n" : "")
        + ("proof-turn-" + String(index + 1) + " ").repeat(180),
      createdAt: new Date(Date.UTC(2026, 9, 8, 9, 45, index)).toISOString(),
      runId: "proof-run-" + String(Math.floor(index / 2) + 1)
    });
  }

  const policyV1 = {
    contractVersion: "0.1.0",
    policyId: "af02-production-proof",
    version: "1",
    directHistoryMaxMessages: 8,
    directHistoryMaxCharacters: 6_000,
    recentTailMessages: 4,
    summaryMaxCharacters: 1_800
  };
  const v1Assembler = createConversationContextAssemblerV010({
    artifactStore: artifacts,
    policy: policyV1
  });
  const v1 = await v1Assembler.assemble({
    threadId,
    threadStore: authority.store,
    now: "2026-10-08T09:50:00.000Z"
  });
  assert(v1.mode === "COMPRESSED", "LONG_THREAD_NOT_COMPRESSED", { v1 });
  assert(v1.totalCharacters <= policyV1.directHistoryMaxCharacters, "CONTEXT_BUDGET_EXCEEDED", { v1 });
  assert(Boolean(v1.includedSummaryId), "SUMMARY_ID_REQUIRED", { v1 });

  const summaryV1 = await artifacts.latestSummary({
    threadId,
    policyId: policyV1.policyId,
    policyVersion: policyV1.version
  });
  assert(Boolean(summaryV1), "SUMMARY_NOT_PERSISTED");
  assert(summaryV1.sourceMessageCount === 26, "SUMMARY_SOURCE_COUNT_INVALID", {
    sourceMessageCount: summaryV1.sourceMessageCount
  });
  assert(summaryV1.sourceMessageIds.length === 26, "SUMMARY_SOURCE_IDS_INVALID");
  assert(summaryV1.sourceFirstMessageId.endsWith(":message:1"), "SUMMARY_FIRST_SOURCE_INVALID");
  assert(summaryV1.sourceLastMessageId.endsWith(":message:26"), "SUMMARY_LAST_SOURCE_INVALID");
  assert(summaryV1.provenance.policyVersion === "1", "SUMMARY_POLICY_PROVENANCE_INVALID");
  assert(summaryV1.activeGoals.some(value => value.includes("目标")), "SUMMARY_GOAL_SIGNAL_MISSING");
  assert(summaryV1.decisions.some(value => value.includes("决定")), "SUMMARY_DECISION_SIGNAL_MISSING");

  const policyV2 = { ...policyV1, version: "2", summaryMaxCharacters: 1_600 };
  const v2 = await createConversationContextAssemblerV010({
    artifactStore: artifacts,
    policy: policyV2
  }).assemble({
    threadId,
    threadStore: authority.store,
    now: "2026-10-08T09:51:00.000Z"
  });
  assert(v2.mode === "COMPRESSED", "POLICY_V2_NOT_COMPRESSED", { v2 });
  assert(v2.includedSummaryId !== v1.includedSummaryId, "POLICY_CHANGE_DID_NOT_REGENERATE");

  const summaryV2 = await artifacts.latestSummary({
    threadId,
    policyId: policyV2.policyId,
    policyVersion: policyV2.version
  });
  assert(Boolean(summaryV2), "SUMMARY_V2_NOT_PERSISTED");
  assert(summaryV2.provenance.policyVersion === "2", "SUMMARY_V2_POLICY_INVALID");

  const failure = await createConversationContextAssemblerV010({
    artifactStore: artifacts,
    compressor: {
      async compress() {
        throw new Error("PROOF_COMPRESSION_PROVIDER_UNAVAILABLE");
      }
    },
    policy: { ...policyV1, version: "failure" }
  }).assemble({
    threadId,
    threadStore: authority.store,
    now: "2026-10-08T09:52:00.000Z"
  });
  assert(failure.mode === "FALLBACK_RECENT", "COMPRESSION_FAILURE_DID_NOT_FALLBACK", { failure });
  assert(failure.diagnostic === "PROOF_COMPRESSION_PROVIDER_UNAVAILABLE", "FALLBACK_DIAGNOSTIC_INVALID", { failure });

  const raw = await authority.store.get(threadId);
  assert(raw?.messages.length === 30, "RAW_CONVERSATION_MUTATED", {
    messageCount: raw?.messages.length
  });
  assert(raw.messages[0].messageId.endsWith(":message:1"), "RAW_FIRST_MESSAGE_MISSING");
  assert(raw.messages.at(-1).messageId.endsWith(":message:30"), "RAW_LAST_MESSAGE_MISSING");

  const shortThreadId = threadId + ":short";
  await authority.store.create({
    threadId: shortThreadId,
    principalSubjectId: "proof-af02",
    principalActorType: "HUMAN",
    context,
    createdAt: "2026-10-08T09:53:00.000Z",
    title: "AF-02 short-path proof"
  });
  for (let index = 0; index < 4; index += 1) {
    await authority.store.appendMessage({
      threadId: shortThreadId,
      messageId: shortThreadId + ":message:" + String(index + 1),
      role: index % 2 === 0 ? "USER" : "ASSISTANT",
      content: "short-" + String(index + 1),
      createdAt: new Date(Date.UTC(2026, 9, 8, 9, 53, index)).toISOString()
    });
  }
  const short = await v1Assembler.assemble({
    threadId: shortThreadId,
    threadStore: authority.store,
    now: "2026-10-08T09:54:00.000Z"
  });
  assert(short.mode === "DIRECT", "SHORT_THREAD_OVERPROCESSED", { short });

  console.log("AF02_LONG_CONTEXT_PRODUCTION_PROOF_PASS", JSON.stringify({
    threadId,
    longSourceMessages: 30,
    v1SummaryId: v1.includedSummaryId,
    v1SummarySourceMessages: summaryV1.sourceMessageCount,
    v1ContextCharacters: v1.totalCharacters,
    contextBudget: policyV1.directHistoryMaxCharacters,
    v2SummaryId: v2.includedSummaryId,
    policyRegeneration: v2.includedSummaryId !== v1.includedSummaryId,
    failureFallback: failure.mode,
    rawMessagesRetained: raw.messages.length,
    shortMode: short.mode,
    schema
  }));
} finally {
  await artifacts.close();
  await authority.close();
}
