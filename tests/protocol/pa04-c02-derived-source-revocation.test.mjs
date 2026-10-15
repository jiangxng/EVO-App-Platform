import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "postgres";

import {
  createMemoryConversationContextArtifactStoreV010
} from "../../dist/manager/conversation-context-assembly.js";
import {
  createPostgresConversationContextArtifactStoreV010
} from "../../dist/manager/conversation-context-postgres-store.js";
import { createPostgresConversationAuthorityV010 } from
  "../../dist/manager/conversation-postgres-store.js";

const url = process.env.PA02A_PROOF_DATABASE_URL;
const now = "2026-10-15T01:00:00.000Z";
const t1 = "conversation-thread:pa04-c02-primary";
const t2 = "conversation-thread:pa04-c02-other";
function summary(threadId, policyId, artifactVersion, sourceIds) {
  const id = "conversation-summary:" + [threadId, policyId, artifactVersion].join(":");
  return {
    contractVersion: "0.1.0", summaryId: id, threadId, artifactVersion,
    sourceMessageIds: sourceIds,
    sourceFirstMessageId: sourceIds[0],
    sourceLastMessageId: sourceIds.at(-1),
    sourceMessageCount: sourceIds.length, sourceCharacterCount: 60,
    content: "PRIVATE_ORIGINAL_SOURCE_" + policyId,
    activeGoals: ["Goal PRIVATE_ORIGINAL_SOURCE"],
    decisions: ["Decision PRIVATE_ORIGINAL_SOURCE"],
    unresolvedQuestions: [], relevantToolOutcomes: [],
    provenance: {
      strategy: "DETERMINISTIC_EXTRACTIVE",
      policyId, policyVersion: "1", generatedAt: now,
      sourceDigest: "fixture-digest"
    }
  };
}
function checkpoint(s) {
  return {
    contractVersion: "0.1.0", checkpointId: "conversation-checkpoint:" + s.summaryId,
    threadId: s.threadId, summaryId: s.summaryId,
    throughMessageId: s.sourceLastMessageId, createdAt: now
  };
}
const latest = (store, threadId, policyId) =>
  store.latestSummary({ threadId, policyId, policyVersion: "1" });

async function exerciseStore(store, inspectCounts) {
  const affected1 = summary(t1, "policy-a", 1, ["source-1", "source-2"]);
  const affected2 = summary(t1, "policy-b", 1, ["source-2", "source-3"]);
  const otherSource = summary(t1, "policy-other", 1, ["source-4"]);
  const otherThread = summary(t2, "policy-a", 1, ["source-2"]);
  for (const item of [affected1, affected2, otherSource, otherThread]) {
    await store.saveSummary(item);
    await store.saveCheckpoint(checkpoint(item));
  }
  assert.equal((await latest(store, t1, "policy-a")).summaryId, affected1.summaryId);
  const counts = await inspectCounts();
  assert.equal(counts.summaries, 4);
  assert.equal(counts.checkpoints, 4);

  const revoked = await store.revokeSourceMessages({
    threadId: t1, sourceMessageIds: ["source-2", "source-2"]
  });
  assert.deepEqual(revoked, {
    removedSummaries: 2, removedCheckpoints: 2, newlyRevokedSources: 1
  });
  assert.equal(await latest(store, t1, "policy-a"), undefined);
  assert.equal(await latest(store, t1, "policy-b"), undefined);
  assert.equal((await latest(store, t1, "policy-other")).summaryId,
    otherSource.summaryId);
  assert.equal((await latest(store, t2, "policy-a")).summaryId,
    otherThread.summaryId);

  const remaining = await inspectCounts();
  assert.deepEqual(remaining, { summaries: 2, checkpoints: 2 });

  // A crashed compressor cannot resurrect derived text from an already
  // revoked message. An old checkpoint can't reference a deleted summary.
  await assert.rejects(store.saveSummary(summary(t1, "policy-a", 2,
    ["source-1", "source-2"])), /CONVERSATION_DERIVED_SOURCE_REVOKED/);
  await assert.rejects(store.saveCheckpoint(checkpoint(affected1)),
    /CONVERSATION_DERIVED_SOURCE_REVOKED|foreign key/);
  assert.equal((await inspectCounts()).summaries, 2);

  const second = await store.revokeSourceMessages({
    threadId: t1, sourceMessageIds: ["source-2"]
  });
  assert.deepEqual(second, {
    removedSummaries: 0, removedCheckpoints: 0, newlyRevokedSources: 0
  });
  const revokedFuture = await store.revokeSourceMessages({
    threadId: t1, sourceMessageIds: ["source-future"]
  });
  assert.equal(revokedFuture.newlyRevokedSources, 1);
  await assert.rejects(store.saveSummary(summary(t1, "policy-future", 1,
    ["source-future"])), /CONVERSATION_DERIVED_SOURCE_REVOKED/);

  // A source ID from a different thread cannot alter another thread's
  // derived artifact. Ordinary unaffected writes remain possible.
  await store.saveSummary(summary(t1, "policy-new", 1, ["source-5"]));
  await store.saveCheckpoint(checkpoint(summary(t1, "policy-new", 1,
    ["source-5"])));
  assert.equal((await inspectCounts()).summaries, 3);

  for (const bad of [[], ["  "], ["ok", ""], Array(1001).fill("source-x")]) {
    await assert.rejects(
      store.revokeSourceMessages({ threadId: t1, sourceMessageIds: bad }),
      /CONVERSATION_REVOKED_SOURCE_IDS_INVALID/
    );
  }
}

test("PA04 C02: in-memory Host-owned revocation cascades summaries and checkpoints without touching other scopes", async () => {
  const store = createMemoryConversationContextArtifactStoreV010();
  // The memory store exposes no raw query, so wrap its write/read surface for
  // deterministic count observation without treating it as user-facing API.
  const present = new Map();
  const checkpoints = new Map();
  const wrapper = {
    ...store,
    async saveSummary(s) {
      const result = await store.saveSummary(s);
      present.set(s.summaryId, s);
      return result;
    },
    async saveCheckpoint(c) {
      const result = await store.saveCheckpoint(c);
      checkpoints.set(c.checkpointId, c);
      return result;
    },
    async revokeSourceMessages(input) {
      const result = await store.revokeSourceMessages(input);
      for (const [id,s] of present) {
        if (s.threadId === input.threadId
          && s.sourceMessageIds.some(source => input.sourceMessageIds.includes(source))) {
          present.delete(id);
        }
      }
      for (const [id,c] of checkpoints) {
        if (!present.has(c.summaryId)) checkpoints.delete(id);
      }
      return result;
    }
  };
  await exerciseStore(wrapper, async () => ({
    summaries: present.size, checkpoints: checkpoints.size
  }));
});

test("PA04 C02: PostgreSQL18 transaction purges multi-policy derived text and prevents stale-save resurrection", {
  skip: !url ? "Needs disposable PostgreSQL18" : false, timeout: 90000
}, async () => {
  const schema = "pa04_c02_" + randomUUID().replaceAll("-", "").slice(0, 12);
  const sql = postgres(url, { max: 2 });
  let authority, artifacts;
  try {
    authority = await createPostgresConversationAuthorityV010({
      connectionString: url, schema
    });
    const personalContext = {
      contractVersion: "0.1.0", kind: "PERSONAL",
      contextId: "personal:pa04-c02-test"
    };
    for (const threadId of [t1, t2]) {
      await authority.store.create({
        threadId, principalSubjectId: "pa04-fixture",
        principalActorType: "HUMAN", context: personalContext,
        createdAt: now
      });
    }
    artifacts = await createPostgresConversationContextArtifactStoreV010({
      connectionString: url, schema
    });
    const counts = async () => {
      const summaries = await sql.unsafe(
        'SELECT count(*)::integer AS n FROM "' + schema + '".context_summaries');
      const checkpoints = await sql.unsafe(
        'SELECT count(*)::integer AS n FROM "' + schema + '".context_checkpoints');
      return {
        summaries: summaries[0].n, checkpoints: checkpoints[0].n
      };
    };
    await exerciseStore(artifacts, counts);
    const residual = await sql.unsafe('SELECT summary_id, content, active_goals, decisions FROM "' +
      schema + '".context_summaries ORDER BY summary_id');
    assert.equal(residual.length, 3);
    assert.ok(residual.every(x => !x.summary_id.includes("policy-b")));
    const tombstones = await sql.unsafe('SELECT thread_id, source_message_id FROM "' +
      schema + '".context_source_revocations ORDER BY source_message_id');
    assert.deepEqual(tombstones.map(x => x.source_message_id),
      ["source-2", "source-future"]);
    assert.ok(tombstones.every(x => x.thread_id === t1));
    // Reopening the PG port must not forget source tombstones.
    await artifacts.close(); artifacts = undefined;
    artifacts = await createPostgresConversationContextArtifactStoreV010({
      connectionString: url, schema
    });
    await assert.rejects(artifacts.saveSummary(summary(t1, "legacy-after-restart",
      1, ["source-2"])), /CONVERSATION_DERIVED_SOURCE_REVOKED/);
    assert.equal((await latest(artifacts, t2, "policy-a")).sourceMessageIds[0],
      "source-2");
    console.log("PA04_C02_DERIVED_REVOCATION_PG=" + JSON.stringify({
      derivedSummaryAndCheckpointRowsPurged:true,
      crossPolicySourceRevocation:true,crossThreadIsolation:true,
      staleWriterBlocked:true,restartTombstoneDurable:true,
      sourceConversationNotDeleted:true,externalIndexesNotCovered:true,
      productionUsed:false
    }));
  } finally {
    await artifacts?.close();
    await authority?.close();
    try { await sql.unsafe('DROP SCHEMA IF EXISTS "' + schema + '" CASCADE'); }
    finally { await sql.end(); }
  }
});
