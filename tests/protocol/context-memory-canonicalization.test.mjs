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
  createMemoryContextMemoryCanonicalizationStoreV010
} from "../../dist/manager/context-memory-canonicalization-store.js";
import {
  createContextMemoryCanonicalizationServiceV010
} from "../../dist/manager/context-memory-canonicalization-service.js";

const principal = {
  contractVersion: "0.1.0",
  subjectId: "preview-user",
  actorType: "HUMAN",
  identityProviderId: "test.identity"
};

const context = {
  contractVersion: "0.1.0",
  kind: "PERSONAL",
  contextId: "personal:preview-user"
};

function memory(memoryId, summary, recordedAt) {
  return {
    contractVersion: "0.1.0",
    memoryId,
    context,
    kind: "FACT",
    summary,
    provenance: {
      contractVersion: "0.1.0",
      origin: "DIRECT",
      sourceContext: context,
      evidenceRefs: []
    },
    attribution: {
      contractVersion: "0.1.0",
      recordedBySubjectId: "preview-user",
      recordedByActorType: "HUMAN",
      recordedAt
    }
  };
}

async function harness() {
  const memoryStore = createMemoryContextMemoryStoreV010();
  const writer = createHostContextMemoryWriterV010(memoryStore);
  const a = memory(
    "memory:a",
    "仓库正常每天 17:00 截单；正常意味着可能有例外。",
    "2026-09-27T10:10:44.314Z"
  );
  const b = memory(
    "memory:b",
    "仓库正常每天 17:00 截单；正常意味着可能存在例外。",
    "2026-09-27T10:29:05.048Z"
  );
  await writer.write({ contractVersion: "0.1.0", item: a });
  await writer.write({ contractVersion: "0.1.0", item: b });

  const canonicalizationStore =
    createMemoryContextMemoryCanonicalizationStoreV010();
  const ids = [
    "proposal-1",
    "relation-1",
    "event-1",
    "proposal-2",
    "proposal-3"
  ];
  const service = createContextMemoryCanonicalizationServiceV010({
    store: canonicalizationStore,
    memoryStore,
    now: () => new Date("2026-09-27T12:00:00.000Z"),
    id: () => ids.shift() ?? "generated"
  });
  const reader = createHostContextMemoryReaderV010(memoryStore, {
    canonicalization: service
  });
  return { memoryStore, canonicalizationStore, service, reader, a, b };
}

test("Human-accepted canonicalization removes duplicate from ordinary retrieval without creating Memory", async () => {
  const h = await harness();

  const before = await h.reader.read({
    contractVersion: "0.1.0",
    context,
    query: "17:00",
    limit: 100
  });
  assert.deepEqual(
    new Set(before.items.map(item => item.memoryId)),
    new Set(["memory:a", "memory:b"])
  );

  const proposal = h.service.create({
    principal,
    context,
    duplicateMemoryId: "memory:a",
    canonicalMemoryId: "memory:b",
    reason: "Semantically equivalent; keep the newer wording.",
    authoredBy: "PERSONAL_AGENT"
  });
  assert.equal(proposal.state, "PENDING");
  assert.equal(h.memoryStore.snapshot().items.length, 2);

  const pendingRead = await h.reader.read({
    contractVersion: "0.1.0",
    context,
    query: "17:00",
    limit: 100
  });
  assert.equal(pendingRead.items.length, 2);

  const accepted = h.service.accept({
    proposalId: proposal.proposalId,
    principal
  });
  assert.equal(accepted.state, "ACCEPTED");
  assert.equal(h.memoryStore.snapshot().items.length, 2);

  const after = await h.reader.read({
    contractVersion: "0.1.0",
    context,
    query: "17:00",
    limit: 100
  });
  assert.deepEqual(after.items.map(item => item.memoryId), ["memory:b"]);

  const naturalKeywordQuery = await h.reader.read({
    contractVersion: "0.1.0",
    context,
    query: "仓库 17:00 截单",
    limit: 100
  });
  assert.deepEqual(
    naturalKeywordQuery.items.map(item => item.memoryId),
    ["memory:b"]
  );
  assert.deepEqual(
    naturalKeywordQuery.ranking[0].signals,
    ["SUMMARY_TOKENS_ALL"]
  );

  const audit = await h.reader.read({
    contractVersion: "0.1.0",
    context,
    memoryIds: ["memory:a", "memory:b"],
    limit: 100
  });
  assert.deepEqual(
    new Set(audit.items.map(item => item.memoryId)),
    new Set(["memory:a", "memory:b"])
  );

  const relation = h.canonicalizationStore.activeForDuplicate("memory:a");
  assert.equal(relation.canonicalMemoryId, "memory:b");
  assert.equal(relation.sourceProposalId, proposal.proposalId);
});

test("lexical Memory retrieval supports deterministic multi-token matching without semantic Provider", async () => {
  const h = await harness();

  const allTokens = await h.reader.read({
    contractVersion: "0.1.0",
    context,
    query: "仓库 17:00 截单",
    limit: 100
  });
  assert.deepEqual(
    new Set(allTokens.items.map(item => item.memoryId)),
    new Set(["memory:a", "memory:b"])
  );
  assert.equal(
    allTokens.ranking.every(entry =>
      entry.signals.includes("SUMMARY_TOKENS_ALL")
    ),
    true
  );

  const noMatch = await h.reader.read({
    contractVersion: "0.1.0",
    context,
    query: "仓库 18:00 发货",
    limit: 100
  });
  assert.equal(noMatch.items.length, 0);
});

test("canonicalization proposal creation is idempotent for the same pending pair", async () => {
  const h = await harness();
  const first = h.service.create({
    principal,
    context,
    duplicateMemoryId: "memory:a",
    canonicalMemoryId: "memory:b",
    reason: "duplicate"
  });
  const second = h.service.create({
    principal,
    context,
    duplicateMemoryId: "memory:a",
    canonicalMemoryId: "memory:b",
    reason: "same pair"
  });
  assert.equal(second.proposalId, first.proposalId);
  assert.equal(h.canonicalizationStore.snapshot().proposals.length, 1);
});

test("rejected canonicalization has no retrieval effect", async () => {
  const h = await harness();
  const proposal = h.service.create({
    principal,
    context,
    duplicateMemoryId: "memory:a",
    canonicalMemoryId: "memory:b"
  });
  h.service.reject({ proposalId: proposal.proposalId, principal });

  const read = await h.reader.read({
    contractVersion: "0.1.0",
    context,
    query: "17:00",
    limit: 100
  });
  assert.equal(read.items.length, 2);
  assert.equal(h.canonicalizationStore.listForContext(context).length, 0);
});

test("canonicalization rejects cycles and a second active canonical for one duplicate", async () => {
  const h = await harness();
  const proposal = h.service.create({
    principal,
    context,
    duplicateMemoryId: "memory:a",
    canonicalMemoryId: "memory:b"
  });
  h.service.accept({ proposalId: proposal.proposalId, principal });

  assert.throws(
    () => h.service.create({
      principal,
      context,
      duplicateMemoryId: "memory:b",
      canonicalMemoryId: "memory:a"
    }),
    /CONTEXT_MEMORY_CANONICALIZATION_CYCLE/
  );
  assert.throws(
    () => h.service.create({
      principal,
      context,
      duplicateMemoryId: "memory:a",
      canonicalMemoryId: "memory:b"
    }),
    /CONTEXT_MEMORY_ALREADY_CANONICALIZED/
  );
});
