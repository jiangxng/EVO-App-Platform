import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";

test("Enterprise Resource Library isolates resources by Enterprise Context", () => {
  const repository = createMemoryEnterpriseResourceRepositoryV010();

  repository.put({
    contextId: "enterprise-context:a",
    namespace: "evo.counterparty",
    collectionId: "counterparties",
    resourceType: "counterparty.subject",
    resourceId: "cp-1",
    schemaRef: "evo.counterparty/0.1.0",
    ownerPackageId: "evo-counterparty",
    payload: {
      contractVersion: "0.1.0",
      counterpartyId: "cp-1",
      code: "CP001",
      displayName: "Alpha",
      subjectType: "ORGANIZATION",
      status: "ACTIVE"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-06T00:00:00.000Z"
  });

  assert.equal(
    repository.list({
      contextId: "enterprise-context:a",
      namespace: "evo.counterparty"
    }).length,
    1
  );
  assert.equal(
    repository.list({
      contextId: "enterprise-context:b",
      namespace: "evo.counterparty"
    }).length,
    0
  );
});

test("Enterprise Resource Library overwrites current resource state without imposing domain versions", () => {
  const repository = createMemoryEnterpriseResourceRepositoryV010();
  const address = {
    contextId: "enterprise-context:a",
    namespace: "evo.counterparty",
    collectionId: "counterparties",
    resourceType: "counterparty.subject",
    resourceId: "cp-1"
  };

  repository.put({
    ...address,
    schemaRef: "evo.counterparty/0.1.0",
    payload: { name: "Alpha" },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-06T00:00:00.000Z"
  });
  repository.put({
    ...address,
    schemaRef: "evo.counterparty/0.1.0",
    payload: { name: "Alpha Limited" },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-06T01:00:00.000Z"
  });

  const resource = repository.get(address);
  assert.deepEqual(resource.payload, { name: "Alpha Limited" });
  assert.equal(resource.createdAt, "2026-10-06T00:00:00.000Z");
  assert.equal(resource.updatedAt, "2026-10-06T01:00:00.000Z");
  assert.equal(repository.list({ contextId: address.contextId }).length, 1);
});

test("Enterprise Resource Library archives instead of deleting enterprise-owned content", () => {
  const repository = createMemoryEnterpriseResourceRepositoryV010();
  const address = {
    contextId: "enterprise-context:a",
    namespace: "evo.counterparty",
    collectionId: "counterparties",
    resourceType: "counterparty.subject",
    resourceId: "cp-1"
  };
  repository.put({
    ...address,
    schemaRef: "evo.counterparty/0.1.0",
    payload: { name: "Alpha" },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-06T00:00:00.000Z"
  });

  repository.archive({
    address,
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-06T02:00:00.000Z"
  });

  assert.equal(repository.get(address).lifecycleState, "ARCHIVED");
  assert.equal(
    repository.list({
      contextId: address.contextId,
      lifecycleState: "ACTIVE"
    }).length,
    0
  );
  assert.equal(
    repository.list({
      contextId: address.contextId,
      lifecycleState: "ARCHIVED"
    }).length,
    1
  );
});
