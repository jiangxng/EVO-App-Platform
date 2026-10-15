import test from "node:test";
import assert from "node:assert/strict";

import {
  createConversationContextAssemblerV010,
  createMemoryConversationContextArtifactStoreV010
} from "../../dist/manager/conversation-context-assembly.js";

function fixture() {
  const messages = Array.from({ length: 12 }, (_, index) => ({
    messageId: "pa04-source-" + (index + 1),
    threadId: "thread:pa04-c02",
    role: index % 2 ? "ASSISTANT" : "USER",
    content: index === 3
      ? "PRIVATE_SOURCE_MUST_NOT_SURVIVE_REDACTION"
      : "Source text for message " + (index + 1),
    createdAt: "2026-10-15T01:00:00.000Z"
  }));
  const artifacts = createMemoryConversationContextArtifactStoreV010();
  const threadStore = {
    async get(id) {
      return id === "thread:pa04-c02"
        ? structuredClone({ threadId: id, messages })
        : undefined;
    }
  };
  const assembler = createConversationContextAssemblerV010({
    artifactStore: artifacts,
    policy: {
      contractVersion: "0.1.0",
      policyId: "pa04-c02-source",
      version: "1",
      directHistoryMaxMessages: 6,
      directHistoryMaxCharacters: 3000,
      recentTailMessages: 3,
      summaryMaxCharacters: 1800
    }
  });
  const assemble = () => assembler.assemble({
    threadId: "thread:pa04-c02",
    threadStore,
    now: "2026-10-15T01:20:00.000Z"
  });
  const latest = () => artifacts.latestSummary({
    threadId: "thread:pa04-c02",
    policyId: "pa04-c02-source",
    policyVersion: "1"
  });
  return { messages, artifacts, assemble, latest };
}

test("PA-04 C02: unchanged source safely reuses its derived summary", async () => {
  const f = fixture();
  const first = await f.assemble();
  const firstSummary = await f.latest();
  const repeated = await f.assemble();
  const repeatedSummary = await f.latest();
  assert.equal(first.mode, "COMPRESSED");
  assert.equal(repeated.mode, "COMPRESSED");
  assert.equal(first.includedSummaryId, repeated.includedSummaryId);
  assert.equal(firstSummary.artifactVersion, 1);
  assert.equal(repeatedSummary.artifactVersion, 1);
  assert.match(firstSummary.provenance.sourceDigest, /^[a-f0-9]{64}$/);
});

test("PA-04 C02: redacted source invalidates summary even when first/last IDs and count are unchanged", async () => {
  const f = fixture();
  await f.assemble();
  const previous = await f.latest();
  assert.match(previous.content, /PRIVATE_SOURCE_MUST_NOT_SURVIVE_REDACTION/);
  f.messages[3].content = "[REDACTED_BY_SOURCE_POLICY]";
  const current = await f.assemble();
  const latest = await f.latest();
  assert.equal(current.mode, "COMPRESSED");
  assert.equal(latest.artifactVersion, 2);
  assert.notEqual(latest.summaryId, previous.summaryId);
  assert.notEqual(latest.provenance.sourceDigest, previous.provenance.sourceDigest);
  assert.doesNotMatch(latest.content, /PRIVATE_SOURCE_MUST_NOT_SURVIVE_REDACTION/);
  assert.match(latest.content, /REDACTED_BY_SOURCE_POLICY/);
});

test("PA-04 C02: replaced/deleted middle source cannot reuse a same-sized stale summary", async () => {
  const f = fixture();
  await f.assemble();
  const previous = await f.latest();
  f.messages.splice(4, 1, {
    ...f.messages[4],
    messageId: "replacement-after-source-deletion",
    content: "Replaced after source retention"
  });
  const current = await f.assemble();
  const latest = await f.latest();
  assert.notEqual(current.includedSummaryId, previous.summaryId);
  assert.equal(latest.artifactVersion, 2);
  assert.ok(latest.sourceMessageIds.includes("replacement-after-source-deletion"));
  assert.ok(!latest.sourceMessageIds.includes("pa04-source-5"));
});

test("PA-04 C02: legacy digest-less summaries are regenerated, not trusted", async () => {
  const f = fixture();
  await f.assemble();
  const old = await f.latest();
  const legacy = structuredClone(old);
  legacy.summaryId = "conversation-summary:legacy-without-digest";
  legacy.artifactVersion = 2;
  delete legacy.provenance.sourceDigest;
  await f.artifacts.saveSummary(legacy);
  const current = await f.assemble();
  const latest = await f.latest();
  assert.notEqual(current.includedSummaryId, legacy.summaryId);
  assert.equal(latest.artifactVersion, 3);
  assert.match(latest.provenance.sourceDigest, /^[a-f0-9]{64}$/);
});
