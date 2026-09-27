import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryContextMemoryStoreV010
} from "../../dist/manager/context-memory-store.js";
import {
  createHostContextMemoryInventoryReaderV010,
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
  subjectId: "inventory-user",
  actorType: "HUMAN",
  identityProviderId: "test.identity"
};

const context = {
  contractVersion: "0.1.0",
  kind: "PERSONAL",
  contextId: "personal:inventory-user"
};

const otherContext = {
  contractVersion: "0.1.0",
  kind: "PERSONAL",
  contextId: "personal:other"
};

function memory(memoryId, summary, recordedAt, extra = {}) {
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
      recordedBySubjectId: principal.subjectId,
      recordedByActorType: "HUMAN",
      recordedAt
    },
    ...extra
  };
}

async function setup() {
  const store = createMemoryContextMemoryStoreV010();
  const writer = createHostContextMemoryWriterV010(store);

  const a = memory("memory:a", "duplicate A", "2026-09-27T10:00:00.000Z");
  const b = memory("memory:b", "canonical B", "2026-09-27T10:01:00.000Z");
  const c = memory("memory:c", "old C", "2026-09-27T10:02:00.000Z");
  const d = memory(
    "memory:d",
    "replacement D",
    "2026-09-27T10:03:00.000Z",
    { supersedesMemoryId: "memory:c" }
  );

  for (const item of [a, b, c, d]) {
    await writer.write({ contractVersion: "0.1.0", item });
  }
  await writer.write({
    contractVersion: "0.1.0",
    item: {
      ...memory("memory:other", "other context", "2026-09-27T10:04:00.000Z"),
      context: otherContext,
      provenance: {
        contractVersion: "0.1.0",
        origin: "DIRECT",
        sourceContext: otherContext,
        evidenceRefs: []
      }
    }
  });

  const canonicalizationStore =
    createMemoryContextMemoryCanonicalizationStoreV010();
  const ids = ["proposal", "relation", "event"];
  const canonicalization = createContextMemoryCanonicalizationServiceV010({
    store: canonicalizationStore,
    memoryStore: store,
    now: () => new Date("2026-09-27T11:00:00.000Z"),
    id: () => ids.shift() ?? "generated"
  });

  const proposal = canonicalization.create({
    principal,
    context,
    duplicateMemoryId: "memory:a",
    canonicalMemoryId: "memory:b",
    authoredBy: "HUMAN"
  });
  canonicalization.accept({ proposalId: proposal.proposalId, principal });

  const reader = createHostContextMemoryInventoryReaderV010(store, {
    canonicalization
  });

  return { store, writer, canonicalization, reader };
}

test("Context Memory inventory is deterministic, paginated and explicitly historical", async () => {
  const h = await setup();

  const first = await h.reader.list({
    contractVersion: "0.1.0",
    context,
    includeHistorical: true,
    limit: 2
  });

  assert.equal(first.scope, "READER_VISIBLE_CURRENT_CONTEXT");
  assert.equal(first.order, "RECORDED_AT_ASC_MEMORY_ID_ASC");
  assert.equal(first.totalCount, 4);
  assert.equal(first.complete, false);
  assert.equal(typeof first.snapshotDigest, "string");
  assert.equal(first.snapshotDigest.length, 64);
  assert.ok(first.nextCursor);
  assert.deepEqual(
    first.items.map(item => item.memory.memoryId),
    ["memory:a", "memory:b"]
  );
  assert.equal(first.items[0].effective, false);
  assert.deepEqual(
    first.items[0].historicalReasons,
    ["CANONICALIZED_DUPLICATE"]
  );
  assert.equal(first.items[0].canonicalizedToMemoryId, "memory:b");
  assert.equal(first.items[1].effective, true);

  const second = await h.reader.list({
    contractVersion: "0.1.0",
    context,
    includeHistorical: true,
    limit: 2,
    cursor: first.nextCursor
  });

  assert.equal(second.snapshotDigest, first.snapshotDigest);
  assert.equal(second.totalCount, 4);
  assert.equal(second.complete, true);
  assert.equal(second.nextCursor, undefined);
  assert.deepEqual(
    second.items.map(item => item.memory.memoryId),
    ["memory:c", "memory:d"]
  );
  assert.equal(second.items[0].effective, false);
  assert.deepEqual(second.items[0].historicalReasons, ["SUPERSEDED"]);
  assert.deepEqual(second.items[0].supersededByMemoryIds, ["memory:d"]);
  assert.equal(second.items[1].effective, true);

  const effectiveOnly = await h.reader.list({
    contractVersion: "0.1.0",
    context,
    includeHistorical: false,
    limit: 100
  });

  assert.equal(effectiveOnly.totalCount, 2);
  assert.equal(effectiveOnly.complete, true);
  assert.deepEqual(
    effectiveOnly.items.map(item => item.memory.memoryId),
    ["memory:b", "memory:d"]
  );
});

test("Context Memory inventory cursor fails closed when governed inventory changes", async () => {
  const h = await setup();

  const first = await h.reader.list({
    contractVersion: "0.1.0",
    context,
    limit: 1
  });
  assert.ok(first.nextCursor);

  await h.writer.write({
    contractVersion: "0.1.0",
    item: memory("memory:e", "new E", "2026-09-27T10:05:00.000Z")
  });

  assert.throws(
    () => h.reader.list({
      contractVersion: "0.1.0",
      context,
      limit: 1,
      cursor: first.nextCursor
    }),
    /CONTEXT_MEMORY_INVENTORY_CHANGED_RESTART_REQUIRED/
  );
});

test("Context Memory inventory is exact only over reader-visible current Context", async () => {
  const h = await setup();

  const governance = {
    providerId: "test.governance",
    get(memoryId) {
      if (memoryId === "memory:d") {
        return {
          contractVersion: "0.1.0",
          memoryId,
          context,
          state: "ACTIVE",
          privacyClass: "RESTRICTED"
        };
      }
      return undefined;
    },
    listForContext() { return []; }
  };

  const reader = createHostContextMemoryInventoryReaderV010(h.store, {
    governance,
    canonicalization: h.canonicalization
  });

  const result = await reader.list({
    contractVersion: "0.1.0",
    context,
    includeHistorical: true,
    limit: 100
  });

  assert.equal(result.totalCount, 3);
  assert.equal(result.complete, true);
  assert.deepEqual(
    result.items.map(item => item.memory.memoryId),
    ["memory:a", "memory:b", "memory:c"]
  );
  assert.equal(
    result.items.some(item => item.memory.memoryId === "memory:other"),
    false
  );
  assert.equal(
    result.items.some(item => item.memory.memoryId === "memory:d"),
    false
  );
});
