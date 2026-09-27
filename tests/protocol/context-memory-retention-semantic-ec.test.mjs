import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryContextMemoryStoreV010
} from "../../dist/manager/context-memory-store.js";
import {
  createMemoryContextMemoryGovernanceStoreV010
} from "../../dist/manager/context-memory-governance-store.js";
import {
  createHostContextMemoryGovernanceProviderV010
} from "../../dist/providers/context-memory/governance.js";
import {
  createHostContextMemoryReaderV010,
  createHostContextMemoryWriterV010
} from "../../dist/providers/context-memory/runtime.js";
import {
  createContextMemoryGovernanceActionHandlerV010
} from "../../dist/manager/context-memory-governance-actions.js";
import {
  createHostEnterpriseRelationshipProviderV010
} from "../../dist/providers/enterprise-relationship/runtime.js";
import {
  createHostStaticAuthorizationProviderV010
} from "../../dist/providers/authorization/runtime.js";
import {
  createRemoteContextMemorySemanticRetrieverV010
} from "../../dist/providers/context-memory-semantic/runtime.js";
import {
  createExperienceCompilerEvidenceSourceProviderV010,
  createExperienceCompilerMemoryIntakeSourceAdapterV010,
  parseExperienceCompilerMemoryIntakeConfigV010
} from "../../dist/providers/experience-compiler-memory/runtime.js";

const alice = {
  contractVersion: "0.1.0",
  subjectId: "alice",
  actorType: "HUMAN",
  identityProviderId: "test.identity",
  displayName: "Alice"
};

const personalRef = {
  contractVersion: "0.1.0",
  kind: "PERSONAL",
  contextId: "personal:alice"
};

const enterpriseRef = {
  contractVersion: "0.1.0",
  kind: "ENTERPRISE",
  contextId: "enterprise:acme",
  enterpriseId: "acme"
};

function item(memoryId, context, summary) {
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
      recordedBySubjectId: "alice",
      recordedByActorType: "HUMAN",
      recordedAt: "2026-09-27T00:00:00.000Z"
    }
  };
}

function personalRequestContext() {
  return {
    contractVersion: "0.1.0",
    principal: alice,
    scope: {
      contractVersion: "0.1.0",
      userId: "alice"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:alice",
        ownerSubjectId: "alice",
        displayName: "Alice"
      },
      activeContext: personalRef
    },
    correlationId: "corr:personal"
  };
}

function enterpriseRequestContext() {
  return {
    contractVersion: "0.1.0",
    principal: alice,
    scope: {
      contractVersion: "0.1.0",
      userId: "alice",
      enterpriseId: "acme"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:alice",
        ownerSubjectId: "alice",
        displayName: "Alice"
      },
      activeContext: enterpriseRef,
      enterpriseContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise:acme",
        enterpriseId: "acme",
        enterpriseProviderId: "test.enterprise",
        lifecycleState: "ACTIVE"
      }
    },
    correlationId: "corr:enterprise"
  };
}

function allowGovernance() {
  return createHostStaticAuthorizationProviderV010({
    contractVersion: "0.1.0",
    rules: [{
      id: "allow-memory-governance",
      effect: "ALLOW",
      actions: ["context.memory.governance.set"],
      subjectIds: ["alice"],
      actorTypes: ["HUMAN"],
      resourceTypes: ["context.memory.governance"]
    }]
  });
}

function relationships(kind) {
  return createHostEnterpriseRelationshipProviderV010(() => [{
    contractVersion: "0.1.0",
    relationshipId: "relationship:alice:" + kind.toLowerCase(),
    subjectId: "alice",
    contextId: "enterprise:acme",
    kind,
    state: "ACTIVE",
    createdAt: "2026-09-27T00:00:00.000Z",
    createdBySubjectId: "alice"
  }]);
}

function governanceAction(values, confirmed = true) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "context.memory.governance.set",
      inputVersion: "0.1.0"
    },
    values,
    sourceInteractionId: "memory-governance",
    actionId: "set",
    requiresConfirmation: confirmed
  };
}

test("retention/privacy governance suppresses restricted and expired Memory without mutating the Memory record", async () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [
      item("memory:visible", personalRef, "Visible knowledge"),
      item("memory:private", personalRef, "Private knowledge"),
      item("memory:ttl", personalRef, "Time limited knowledge")
    ]
  });
  const governanceStore = createMemoryContextMemoryGovernanceStoreV010();
  const governance = createHostContextMemoryGovernanceProviderV010(
    governanceStore,
    () => new Date("2026-09-27T10:00:00.000Z")
  );
  const reader = createHostContextMemoryReaderV010(memoryStore, { governance });

  governanceStore.append({
    contractVersion: "0.1.0",
    eventId: "g:restricted",
    memoryId: "memory:private",
    context: personalRef,
    state: "RESTRICTED",
    privacyClass: "RESTRICTED",
    occurredAt: "2026-09-27T01:00:00.000Z",
    actorSubjectId: "alice"
  });
  governanceStore.append({
    contractVersion: "0.1.0",
    eventId: "g:ttl",
    memoryId: "memory:ttl",
    context: personalRef,
    state: "ACTIVE",
    privacyClass: "STANDARD",
    retainUntil: "2026-09-27T09:00:00.000Z",
    occurredAt: "2026-09-27T01:00:00.000Z",
    actorSubjectId: "alice"
  });

  const result = await reader.read({
    contractVersion: "0.1.0",
    context: personalRef,
    limit: 100
  });
  assert.deepEqual(result.items.map(value => value.memoryId), ["memory:visible"]);
  assert.equal(memoryStore.snapshot().items.length, 3);
  assert.equal(governanceStore.snapshot().events.length, 2);

  governanceStore.append({
    contractVersion: "0.1.0",
    eventId: "g:reactivate",
    memoryId: "memory:private",
    context: personalRef,
    state: "ACTIVE",
    privacyClass: "SENSITIVE",
    occurredAt: "2026-09-27T11:00:00.000Z",
    actorSubjectId: "alice"
  });
  const laterGovernance = createHostContextMemoryGovernanceProviderV010(
    governanceStore,
    () => new Date("2026-09-27T12:00:00.000Z")
  );
  const later = await createHostContextMemoryReaderV010(
    memoryStore,
    { governance: laterGovernance }
  ).read({
    contractVersion: "0.1.0",
    context: personalRef,
    limit: 100
  });
  assert.deepEqual(
    later.items.map(value => value.memoryId).sort(),
    ["memory:private", "memory:visible"]
  );
});

test("Enterprise Memory retention/privacy governance requires OWNER or ADMIN, not MEMBER", async () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [item("memory:enterprise", enterpriseRef, "Enterprise knowledge")]
  });
  const memberGovernance = createMemoryContextMemoryGovernanceStoreV010();
  const memberHandler = createContextMemoryGovernanceActionHandlerV010({
    memoryStore,
    governanceStore: memberGovernance,
    resolveAuthorizationProvider: allowGovernance,
    resolveRelationshipProvider() {
      return relationships("MEMBER");
    },
    now: () => new Date("2026-09-27T02:00:00.000Z"),
    id: () => "member"
  });
  const denied = await memberHandler.execute(
    governanceAction({
      memoryId: "memory:enterprise",
      state: "RESTRICTED",
      privacyClass: "RESTRICTED"
    }),
    enterpriseRequestContext()
  );
  assert.equal(denied.ok, false);
  assert.equal(
    denied.error.code,
    "ENTERPRISE_CONTEXT_MEMORY_GOVERNANCE_ROLE_REQUIRED"
  );
  assert.equal(memberGovernance.snapshot().events.length, 0);

  const ownerGovernance = createMemoryContextMemoryGovernanceStoreV010();
  const ownerHandler = createContextMemoryGovernanceActionHandlerV010({
    memoryStore,
    governanceStore: ownerGovernance,
    resolveAuthorizationProvider: allowGovernance,
    resolveRelationshipProvider() {
      return relationships("OWNER");
    },
    now: () => new Date("2026-09-27T02:00:00.000Z"),
    id: () => "owner"
  });
  const allowed = await ownerHandler.execute(
    governanceAction({
      memoryId: "memory:enterprise",
      state: "RESTRICTED",
      privacyClass: "RESTRICTED",
      reason: "Commercially sensitive"
    }),
    enterpriseRequestContext()
  );
  assert.equal(allowed.ok, true);
  assert.equal(ownerGovernance.snapshot().events.length, 1);
});

test("Semantic and HYBRID retrieval only send governance-visible candidates to the semantic Provider", async () => {
  const memoryStore = createMemoryContextMemoryStoreV010({
    contractVersion: "0.1.0",
    items: [
      item("memory:one", personalRef, "Supplier quality improved"),
      item("memory:hidden", personalRef, "Hidden supplier secret"),
      item("memory:two", personalRef, "Production bottleneck moved downstream")
    ]
  });
  const governanceStore = createMemoryContextMemoryGovernanceStoreV010({
    contractVersion: "0.1.0",
    events: [{
      contractVersion: "0.1.0",
      eventId: "g:hidden",
      memoryId: "memory:hidden",
      context: personalRef,
      state: "RESTRICTED",
      privacyClass: "RESTRICTED",
      occurredAt: "2026-09-27T01:00:00.000Z",
      actorSubjectId: "alice"
    }]
  });
  const governance = createHostContextMemoryGovernanceProviderV010(governanceStore);
  let candidates;
  const semanticRetriever = {
    providerId: "test.semantic",
    search(input) {
      candidates = input.candidates.map(value => value.memoryId);
      return {
        contractVersion: "0.1.0",
        ranking: [
          {
            contractVersion: "0.1.0",
            memoryId: "memory:two",
            score: 0.95,
            signals: ["VECTOR_SIMILARITY"]
          },
          {
            contractVersion: "0.1.0",
            memoryId: "memory:one",
            score: 0.4,
            signals: ["VECTOR_SIMILARITY"]
          }
        ]
      };
    }
  };
  const reader = createHostContextMemoryReaderV010(memoryStore, {
    governance,
    semanticRetriever
  });

  const semantic = await reader.read({
    contractVersion: "0.1.0",
    context: personalRef,
    query: "capacity constraint",
    strategy: "SEMANTIC",
    limit: 10
  });
  assert.deepEqual(candidates.sort(), ["memory:one", "memory:two"]);
  assert.equal(semantic.items[0].memoryId, "memory:two");
  assert.equal(semantic.strategyUsed, "SEMANTIC");

  const hybrid = await reader.read({
    contractVersion: "0.1.0",
    context: personalRef,
    query: "supplier",
    strategy: "HYBRID",
    limit: 10
  });
  assert.equal(hybrid.strategyUsed, "HYBRID");
  assert.equal(hybrid.ranking.some(value =>
    value.signals.some(signal => signal.startsWith("SEMANTIC:"))
  ), true);
});

test("remote semantic Provider sends bearer credential and rejects out-of-candidate ranking", async () => {
  let request;
  const provider = createRemoteContextMemorySemanticRetrieverV010({
    endpoint: "https://semantic.example.test/search",
    bearerToken: "semantic-token",
    fetchImpl: async (url, init) => {
      request = { url, init };
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            contractVersion: "0.1.0",
            ranking: [{
              memoryId: "memory:one",
              score: 0.88,
              signals: ["VECTOR"]
            }]
          };
        }
      };
    }
  });
  const result = await provider.search({
    contractVersion: "0.1.0",
    context: personalRef,
    query: "supplier",
    candidates: [{
      contractVersion: "0.1.0",
      memoryId: "memory:one",
      summary: "Supplier quality improved",
      kind: "FACT",
      evidenceRefs: []
    }],
    limit: 10
  });
  assert.equal(request.url, "https://semantic.example.test/search");
  assert.equal(request.init.headers.authorization, "Bearer semantic-token");
  assert.equal(result.ranking[0].score, 0.88);

  const invalid = createRemoteContextMemorySemanticRetrieverV010({
    endpoint: "https://semantic.example.test/search",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          contractVersion: "0.1.0",
          ranking: [{
            memoryId: "memory:not-authorized-candidate",
            score: 1,
            signals: ["BAD"]
          }]
        };
      }
    })
  });
  await assert.rejects(
    () => invalid.search({
      contractVersion: "0.1.0",
      context: personalRef,
      query: "supplier",
      candidates: [{
        contractVersion: "0.1.0",
        memoryId: "memory:one",
        summary: "Supplier quality improved",
        kind: "FACT",
        evidenceRefs: []
      }],
      limit: 10
    }),
    /CONTEXT_MEMORY_SEMANTIC_RANKING_INVALID/
  );
});

test("Experience Compiler production adapter preserves generic intake contract and bearer boundary", async () => {
  const config = parseExperienceCompilerMemoryIntakeConfigV010(JSON.stringify({
    contractVersion: "0.1.0",
    endpoint: "https://ec.example.test/v1/context-memory/intake",
    source: {
      sourceId: "ec:manufacturing",
      displayName: "Manufacturing Experience Compiler",
      trustLevel: "HOST_VERIFIED",
      trustPolicyId: "host.ec.production"
    }
  }));
  assert.ok(config);
  assert.equal(config.source.sourceType, "EXPERIENCE_COMPILER");

  let request;
  const adapter = createExperienceCompilerMemoryIntakeSourceAdapterV010({
    config,
    bearerToken: "ec-token",
    fetchImpl: async (url, init) => {
      request = { url, init };
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            contractVersion: "0.1.0",
            records: [{
              contractVersion: "0.1.0",
              sourceId: "ec:manufacturing",
              sourceRecordId: "practice:1",
              context: personalRef,
              kind: "PRACTICE",
              summary: "Review bottlenecks before adding capacity.",
              evidenceRefs: ["ec:evidence:1"]
            }]
          };
        }
      };
    }
  });

  const pulled = await adapter.pull({
    contractVersion: "0.1.0",
    context: personalRef,
    limit: 20
  });
  assert.equal(request.url, "https://ec.example.test/v1/context-memory/intake");
  assert.equal(request.init.headers.authorization, "Bearer ec-token");
  assert.equal(pulled.records[0].sourceRecordId, "practice:1");

  const evidence = createExperienceCompilerEvidenceSourceProviderV010(config);
  assert.equal(
    evidence.describe("ec:manufacturing").sourceType,
    "EXPERIENCE_COMPILER"
  );
  assert.equal(
    evidence.describe("ec:manufacturing").trustLevel,
    "HOST_VERIFIED"
  );
});
