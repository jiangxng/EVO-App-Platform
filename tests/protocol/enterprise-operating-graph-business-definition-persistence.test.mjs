import test from "node:test";
import assert from "node:assert/strict";

import {
  BUSINESS_DEFINITION_KIND_ENTERPRISE_OPERATING_GRAPH_V010
} from "../../dist/contracts/enterprise-business-definition.js";
import {
  createEnterpriseOperatingGraphV010,
  applyEnterpriseOperatingGraphOperationV010
} from "../../dist/manager/enterprise-operating-graph-model.js";
import {
  createMemoryBusinessDefinitionRepositoryV010
} from "../../dist/providers/enterprise-context/business-definitions.js";
import {
  createEnterpriseOperatingGraphDefinitionPersistenceV010
} from "../../dist/apps/eog-2d-designer/definition-persistence.js";
import {
  migrateLegacyEnterpriseOperatingGraphSnapshotV010
} from "../../dist/apps/eog-2d-designer/legacy-definition-migration.js";
import {
  createEnterpriseOperatingGraphHostServiceV010
} from "../../dist/manager/enterprise-operating-graph-service.js";

const human = { type: "HUMAN", subjectId: "human:owner" };
const agent = { type: "AGENT", subjectId: "agent:personal" };

function operation(graph, input) {
  return applyEnterpriseOperatingGraphOperationV010(graph, {
    contractVersion: "0.1.0",
    operationId: "op:" + (graph.revision + 1),
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    actor: input.actor,
    occurredAt: input.occurredAt,
    ...input.mutation
  });
}

test("Enterprise Context repository can persist EOG semantic revisions without owning View State", () => {
  const repository = createMemoryBusinessDefinitionRepositoryV010();
  const persistence = createEnterpriseOperatingGraphDefinitionPersistenceV010(repository);
  let graph = createEnterpriseOperatingGraphV010({
    graphId: "eog:demo",
    enterpriseId: "enterprise:demo",
    createdAt: "2026-10-02T01:00:00.000Z"
  });
  graph = persistence.create({ graph, actor: human });
  assert.equal(graph.revision, 0);
  assert.equal(graph.state, "DRAFT");

  const next = operation(graph, {
    actor: agent,
    occurredAt: "2026-10-02T01:01:00.000Z",
    mutation: {
      type: "NODE_BIND",
      node: {
        nodeId: "node:app:sales",
        kind: "APPLICATION",
        semanticRef: {
          kind: "APPLICATION",
          authority: "HOST",
          refId: "application:sales-order"
        }
      }
    }
  });
  graph = persistence.replace({ current: graph, next, actor: agent });
  assert.equal(graph.revision, 1);
  assert.equal(graph.nodes.length, 1);

  const publishNext = operation(graph, {
    actor: human,
    occurredAt: "2026-10-02T01:02:00.000Z",
    mutation: { type: "PUBLISH" }
  });
  graph = persistence.replace({ current: graph, next: publishNext, actor: human });
  assert.equal(graph.revision, 2);
  assert.equal(graph.state, "PUBLISHED");
  assert.equal(graph.publishedAt, "2026-10-02T01:02:00.000Z");

  const history = repository.listHistory({
    enterpriseId: "enterprise:demo",
    definitionId: "eog:demo"
  });
  assert.deepEqual(
    history.map(item => [item.revision, item.state, item.recordedBy.actorType]),
    [[0, "DRAFT", "HUMAN"], [1, "DRAFT", "AI"], [2, "PUBLISHED", "HUMAN"]]
  );
  assert.equal(
    history.every(item => item.kind === BUSINESS_DEFINITION_KIND_ENTERPRISE_OPERATING_GRAPH_V010),
    true
  );
  assert.deepEqual(
    Object.keys(history[2].payload).sort(),
    ["enterpriseRelations", "graphContractVersion", "guidanceRelations", "nodes"]
  );
  assert.deepEqual(
    persistence.get({ enterpriseId: "enterprise:demo", graphId: "eog:demo" }),
    graph
  );
});

test("legacy EOG semantic snapshot migration is non-destructive and idempotent", () => {
  const repository = createMemoryBusinessDefinitionRepositoryV010();
  let graph = createEnterpriseOperatingGraphV010({
    graphId: "eog:legacy",
    enterpriseId: "enterprise:demo",
    createdAt: "2026-09-28T01:00:00.000Z"
  });
  graph = operation(graph, {
    actor: agent,
    occurredAt: "2026-09-28T01:01:00.000Z",
    mutation: {
      type: "NODE_BIND",
      node: {
        nodeId: "node:ledger:cash",
        kind: "LEDGER",
        semanticRef: {
          kind: "LEDGER_DEFINITION",
          authority: "EVO",
          refId: "ledger:cash"
        }
      }
    }
  });
  const snapshot = { contractVersion: "0.1.0", graphs: [graph] };
  const first = migrateLegacyEnterpriseOperatingGraphSnapshotV010({ snapshot, repository });
  assert.deepEqual(first, { sourcePresent: true, examined: 1, imported: 1, alreadyPresent: 0 });
  const second = migrateLegacyEnterpriseOperatingGraphSnapshotV010({ snapshot, repository });
  assert.deepEqual(second, { sourcePresent: true, examined: 1, imported: 0, alreadyPresent: 1 });

  const revision = repository.getLatest({
    enterpriseId: "enterprise:demo",
    definitionId: "eog:legacy"
  });
  assert.equal(revision.kind, "ENTERPRISE_OPERATING_GRAPH");
  assert.equal(revision.origin.type, "MIGRATED");
  assert.equal(revision.origin.sourceRef, "legacy:eog-semantic-store");
  assert.equal(revision.origin.historyComplete, false);

  const persistence = createEnterpriseOperatingGraphDefinitionPersistenceV010(repository);
  assert.deepEqual(
    persistence.get({ enterpriseId: "enterprise:demo", graphId: "eog:legacy" }),
    graph
  );
});

test("repository-backed EOG persistence remains enterprise scoped", () => {
  const repository = createMemoryBusinessDefinitionRepositoryV010();
  const persistence = createEnterpriseOperatingGraphDefinitionPersistenceV010(repository);
  const graph = createEnterpriseOperatingGraphV010({
    graphId: "eog:scope",
    enterpriseId: "enterprise:a",
    createdAt: "2026-10-02T01:00:00.000Z"
  });
  persistence.create({ graph, actor: human });
  assert.equal(persistence.get({ enterpriseId: "enterprise:b", graphId: "eog:scope" }), undefined);
  assert.deepEqual(persistence.listByEnterprise({ enterpriseId: "enterprise:b" }), []);
});

test("Host service can use Enterprise Context persistence without the legacy EOG semantic store", () => {
  const repository = createMemoryBusinessDefinitionRepositoryV010();
  const persistence = createEnterpriseOperatingGraphDefinitionPersistenceV010(repository);
  const service = createEnterpriseOperatingGraphHostServiceV010({
    persistence,
    id: () => "host",
    now: () => new Date("2026-10-02T02:00:00.000Z")
  });

  let graph = service.create({
    enterpriseId: "enterprise:host",
    graphId: "eog:host",
    actor: human
  });
  assert.equal(graph.revision, 0);

  graph = service.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    actor: agent,
    occurredAt: "2026-10-02T02:01:00.000Z",
    mutation: {
      type: "NODE_BIND",
      node: {
        nodeId: "node:app:host",
        kind: "APPLICATION",
        semanticRef: {
          kind: "APPLICATION",
          authority: "HOST",
          refId: "application:host"
        }
      }
    }
  });

  graph = service.apply({
    enterpriseId: graph.enterpriseId,
    graphId: graph.graphId,
    expectedRevision: graph.revision,
    actor: human,
    occurredAt: "2026-10-02T02:02:00.000Z",
    mutation: { type: "PUBLISH" }
  });

  assert.equal(graph.state, "PUBLISHED");
  const history = repository.listHistory({
    enterpriseId: graph.enterpriseId,
    definitionId: graph.graphId
  });
  assert.deepEqual(
    history.map(item => item.recordedBy.actorType),
    ["HUMAN", "AI", "HUMAN"]
  );
  assert.equal(history.at(-1).publishedBySubjectId, "human:owner");
});

test("legacy migration remains restart-safe after repository-backed EOG advances", () => {
  const repository = createMemoryBusinessDefinitionRepositoryV010();
  let legacy = createEnterpriseOperatingGraphV010({
    graphId: "eog:restart",
    enterpriseId: "enterprise:restart",
    createdAt: "2026-09-28T01:00:00.000Z"
  });
  legacy = operation(legacy, {
    actor: agent,
    occurredAt: "2026-09-28T01:01:00.000Z",
    mutation: {
      type: "NODE_BIND",
      node: {
        nodeId: "node:app:legacy",
        kind: "APPLICATION",
        semanticRef: {
          kind: "APPLICATION",
          authority: "HOST",
          refId: "application:legacy"
        }
      }
    }
  });
  const snapshot = { contractVersion: "0.1.0", graphs: [legacy] };
  migrateLegacyEnterpriseOperatingGraphSnapshotV010({ snapshot, repository });

  const persistence = createEnterpriseOperatingGraphDefinitionPersistenceV010(repository);
  const service = createEnterpriseOperatingGraphHostServiceV010({
    persistence,
    now: () => new Date("2026-10-02T03:00:00.000Z")
  });
  const advanced = service.apply({
    enterpriseId: legacy.enterpriseId,
    graphId: legacy.graphId,
    expectedRevision: legacy.revision,
    actor: agent,
    occurredAt: "2026-10-02T03:00:00.000Z",
    mutation: {
      type: "NODE_BIND",
      node: {
        nodeId: "node:ledger:restart",
        kind: "LEDGER",
        semanticRef: {
          kind: "LEDGER_DEFINITION",
          authority: "EVO",
          refId: "ledger:restart"
        }
      }
    }
  });
  assert.equal(advanced.revision, legacy.revision + 1);

  const restarted = migrateLegacyEnterpriseOperatingGraphSnapshotV010({
    snapshot,
    repository
  });
  assert.deepEqual(restarted, {
    sourcePresent: true,
    examined: 1,
    imported: 0,
    alreadyPresent: 1
  });
  assert.equal(
    repository.getLatest({
      enterpriseId: legacy.enterpriseId,
      definitionId: legacy.graphId
    }).revision,
    advanced.revision
  );
});
