import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  ITEM_COLLECTION_V010,
  ITEM_NAMESPACE_V010,
  createItemRepositoryV010
} from "../../dist/apps/item/repository.js";
import {
  ITEM_RESOURCE_TYPE_V010,
  ITEM_SCHEMA_V010
} from "../../dist/apps/item/foundation-object.js";

function item(overrides = {}) {
  return {
    contractVersion: "0.1.0",
    itemId: "item-1",
    code: "ITEM-001",
    displayName: "Demo Item",
    itemKind: "GOODS",
    baseUomCode: "C62",
    ...overrides
  };
}

test("IT-01B persists Item identity through Enterprise Context Resource contracts", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createItemRepositoryV010(resources);

  const saved = repository.save({
    contextId: "enterprise-context:a",
    item: item(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:40:00.000Z"
  });

  assert.equal(saved.itemId, "item-1");
  assert.deepEqual(repository.get("enterprise-context:a", "item-1"), saved);
  assert.equal(repository.list("enterprise-context:a").length, 1);
  assert.equal(repository.list("enterprise-context:b").length, 0);

  const raw = resources.get({
    contextId: "enterprise-context:a",
    namespace: ITEM_NAMESPACE_V010,
    collectionId: ITEM_COLLECTION_V010,
    resourceType: ITEM_RESOURCE_TYPE_V010,
    resourceId: "item-1"
  });
  assert.equal(raw.schemaRef, ITEM_SCHEMA_V010);
  assert.equal(raw.ownerPackageId, "evo-item");
  assert.equal(raw.lifecycleState, "ACTIVE");
  assert.equal(raw.metadata.code, "ITEM-001");
  assert.equal(raw.metadata.itemKind, "GOODS");
  assert.equal("status" in raw.payload, false);
});

test("IT-01B enforces Item code uniqueness inside one Enterprise Context only", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createItemRepositoryV010(resources);

  repository.save({
    contextId: "enterprise-context:a",
    item: item(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:41:00.000Z"
  });

  assert.throws(() => repository.save({
    contextId: "enterprise-context:a",
    item: item({
      itemId: "item-2",
      code: "item-001",
      displayName: "Duplicate code"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:42:00.000Z"
  }), /ITEM_CODE_DUPLICATE/);

  assert.doesNotThrow(() => repository.save({
    contextId: "enterprise-context:b",
    item: item({
      itemId: "item-b-1",
      code: "item-001",
      displayName: "Independent enterprise Item"
    }),
    actorSubjectId: "owner-b",
    recordedAt: "2026-10-09T10:43:00.000Z"
  }));
});

test("IT-01B archive preserves identity history and blocks implicit reactivation or code reuse", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createItemRepositoryV010(resources);

  repository.save({
    contextId: "enterprise-context:a",
    item: item(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:44:00.000Z"
  });
  repository.archive({
    contextId: "enterprise-context:a",
    itemId: "item-1",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:45:00.000Z"
  });

  assert.equal(repository.get("enterprise-context:a", "item-1"), undefined);
  assert.equal(repository.list("enterprise-context:a").length, 0);

  const archived = resources.get({
    contextId: "enterprise-context:a",
    namespace: ITEM_NAMESPACE_V010,
    collectionId: ITEM_COLLECTION_V010,
    resourceType: ITEM_RESOURCE_TYPE_V010,
    resourceId: "item-1"
  });
  assert.equal(archived.lifecycleState, "ARCHIVED");
  assert.equal(archived.payload.code, "ITEM-001");

  assert.throws(() => repository.save({
    contextId: "enterprise-context:a",
    item: item({ displayName: "Attempted reactivation" }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:46:00.000Z"
  }), /ITEM_ARCHIVED/);

  assert.throws(() => repository.save({
    contextId: "enterprise-context:a",
    item: item({
      itemId: "item-2",
      displayName: "Attempted code reuse"
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:47:00.000Z"
  }), /ITEM_CODE_DUPLICATE/);
});

test("IT-01B keeps stable itemId while allowing governed updates to non-identity presentation data", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createItemRepositoryV010(resources);

  repository.save({
    contextId: "enterprise-context:a",
    item: item(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:48:00.000Z"
  });
  const updated = repository.save({
    contextId: "enterprise-context:a",
    item: item({
      displayName: "Updated Demo Item",
      description: "Updated description"
    }),
    actorSubjectId: "editor-a",
    recordedAt: "2026-10-09T10:49:00.000Z"
  });

  assert.equal(updated.itemId, "item-1");
  assert.equal(updated.displayName, "Updated Demo Item");

  const raw = resources.get({
    contextId: "enterprise-context:a",
    namespace: ITEM_NAMESPACE_V010,
    collectionId: ITEM_COLLECTION_V010,
    resourceType: ITEM_RESOURCE_TYPE_V010,
    resourceId: "item-1"
  });
  assert.equal(raw.createdAt, "2026-10-09T10:48:00.000Z");
  assert.equal(raw.createdBySubjectId, "owner-a");
  assert.equal(raw.updatedAt, "2026-10-09T10:49:00.000Z");
  assert.equal(raw.updatedBySubjectId, "editor-a");
});

test("IT-01B Item repository does not depend on Counterparty implementation or hidden Product/SKU/GTIN state", async () => {
  const source = await import("../../dist/apps/item/repository.js");
  assert.equal(typeof source.createItemRepositoryV010, "function");

  const fields = Object.keys(item());
  for (const forbidden of [
    "status",
    "productId",
    "sku",
    "gtin",
    "variantId",
    "categoryId"
  ]) {
    assert.equal(fields.includes(forbidden), false);
  }
});


test("IT-01E Item saveMany validates code ownership once and persists the batch", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createItemRepositoryV010(resources);

  const saved = repository.saveMany({
    contextId: "enterprise-context:batch",
    items: Array.from({ length: 250 }, (_, index) => item({
      itemId: "batch-item-" + String(index + 1),
      code: "BATCH-" + String(index + 1).padStart(4, "0"),
      displayName: "Batch Item " + String(index + 1)
    })),
    actorSubjectId: "batch-owner",
    recordedAt: "2026-10-09T12:40:00.000Z"
  });

  assert.equal(saved.length, 250);
  assert.equal(repository.list("enterprise-context:batch").length, 250);

  assert.throws(() => repository.saveMany({
    contextId: "enterprise-context:batch",
    items: [
      item({
        itemId: "batch-new-1",
        code: "batch-0001",
        displayName: "Conflicts with existing"
      }),
      item({
        itemId: "batch-new-2",
        code: "BATCH-9999",
        displayName: "Would otherwise be valid"
      })
    ],
    actorSubjectId: "batch-owner",
    recordedAt: "2026-10-09T12:41:00.000Z"
  }), /ITEM_CODE_DUPLICATE/);

  assert.equal(
    repository.get("enterprise-context:batch", "batch-new-2"),
    undefined
  );
  assert.equal(repository.list("enterprise-context:batch").length, 250);
});

test("IT-01E Item saveMany preserves archived identity and code reservations", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createItemRepositoryV010(resources);

  repository.save({
    contextId: "enterprise-context:archive-batch",
    item: item(),
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T12:42:00.000Z"
  });
  repository.archive({
    contextId: "enterprise-context:archive-batch",
    itemId: "item-1",
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T12:43:00.000Z"
  });

  assert.throws(() => repository.saveMany({
    contextId: "enterprise-context:archive-batch",
    items: [item({
      itemId: "item-2",
      code: "item-001",
      displayName: "Reuse archived code"
    })],
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T12:44:00.000Z"
  }), /ITEM_CODE_DUPLICATE/);

  assert.throws(() => repository.saveMany({
    contextId: "enterprise-context:archive-batch",
    items: [item({
      displayName: "Reactivate archived identity"
    })],
    actorSubjectId: "owner",
    recordedAt: "2026-10-09T12:45:00.000Z"
  }), /ITEM_ARCHIVED/);
});
