import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createObjectExtensionRepositoryV010
} from "../../dist/apps/object-extension/repository.js";
import {
  createObjectExtensionValueRepositoryV010
} from "../../dist/apps/object-extension/values.js";
import {
  createDataImportRepositoryV010
} from "../../dist/apps/data-import/repository.js";
import {
  createDataImportServiceV010
} from "../../dist/apps/data-import/service.js";
import {
  ITEM_IMPORT_TARGET_V010,
  createItemImportTargetV010
} from "../../dist/apps/item/import-target.js";
import {
  ITEM_RESOURCE_TYPE_V010,
  ITEM_TRADE_PROFILE_SLOT_V010
} from "../../dist/apps/item/foundation-object.js";
import {
  createItemRepositoryV010
} from "../../dist/apps/item/repository.js";

function extensionDefinition(overrides = {}) {
  return {
    contractVersion: "0.1.0",
    extensionId: "enterprise.demo.item.commodity-class",
    targetObjectType: ITEM_RESOURCE_TYPE_V010,
    targetSlot: ITEM_TRADE_PROFILE_SLOT_V010,
    namespace: "enterprise.demo.item",
    fieldId: "commodityClass",
    semanticType: "commodity-class",
    valueType: "STRING",
    label: {
      default: "Commodity class",
      translations: { "zh-CN": "商品分类码" }
    },
    required: false,
    order: 10,
    surfaces: ["DETAIL"],
    searchable: true,
    importable: true,
    exportable: true,
    agentReadable: true,
    agentWritable: true,
    ...overrides
  };
}

function harness(options = {}) {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const itemRepository = createItemRepositoryV010(resources);
  const extensionRepository = createObjectExtensionRepositoryV010(resources);
  const extensionValueRepository =
    createObjectExtensionValueRepositoryV010(resources);
  const dataImportRepository = createDataImportRepositoryV010(resources);

  extensionRepository.save({
    contextId: "enterprise-context:a",
    definition: extensionDefinition(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:50:00.000Z"
  });

  const values = options.extensionValueRepository
    ? options.extensionValueRepository(extensionValueRepository)
    : extensionValueRepository;

  const target = createItemImportTargetV010({
    resources,
    repository: itemRepository,
    extensionRepository,
    extensionValueRepository: values
  });
  const service = createDataImportServiceV010({
    repository: dataImportRepository,
    targets: [target]
  });
  return {
    resources,
    itemRepository,
    extensionRepository,
    extensionValueRepository,
    dataImportRepository,
    target,
    service
  };
}

function source(rows = [{
  code: "ITEM-001",
  displayName: "Green Tea 500 ml",
  itemKind: "GOODS",
  baseUomCode: "C62",
  commodityClass: "BEVERAGE"
}, {
  code: "SVC-001",
  displayName: "Installation service",
  itemKind: "SERVICE",
  baseUomCode: "E48",
  commodityClass: "SERVICE"
}]) {
  return {
    kind: "ROWS",
    name: "items",
    headers: [
      "code",
      "displayName",
      "itemKind",
      "baseUomCode",
      "commodityClass"
    ],
    rows
  };
}

function stageReady(h, jobId, rows = undefined) {
  const src = source(rows);
  const schema = h.target.describe({
    contextId: "enterprise-context:a",
    locale: "en"
  });
  const mapping = h.service.suggestMapping({ schema, source: src });
  assert.deepEqual(
    mapping.map(item => item.targetFieldId),
    [
      "code",
      "displayName",
      "itemKind",
      "baseUomCode",
      "commodityClass"
    ]
  );
  h.service.stage({
    contextId: "enterprise-context:a",
    importJobId: jobId,
    targetId: ITEM_IMPORT_TARGET_V010,
    source: src,
    mapping,
    mappingOrigin: "DETERMINISTIC",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:51:00.000Z"
  });
  return h.service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: jobId,
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:52:00.000Z"
  });
}

test("IT-01C Item uses the generic stage -> dry-run -> atomic commit Data Import flow", () => {
  const h = harness();
  const dry = stageReady(h, "job-item-1");

  assert.equal(dry.state, "DRY_RUN_READY");
  assert.equal(dry.dryRun.totalRows, 2);
  assert.equal(dry.dryRun.invalidRows, 0);

  const committed = h.service.commit({
    contextId: "enterprise-context:a",
    importJobId: "job-item-1",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:53:00.000Z"
  });

  assert.equal(committed.state, "COMMITTED");
  assert.equal(committed.receipt.succeededRows, 2);
  assert.equal(committed.receipt.failedRows, 0);

  const items = h.itemRepository.list("enterprise-context:a");
  assert.equal(items.length, 2);
  assert.deepEqual(
    items.map(item => item.code).sort(),
    ["ITEM-001", "SVC-001"]
  );
  assert.equal(
    committed.receipt.rows.every(row =>
      row.objectType === ITEM_RESOURCE_TYPE_V010
      && row.objectId.startsWith("item-import-")
    ),
    true
  );

  const goods = items.find(item => item.code === "ITEM-001");
  const values = h.extensionValueRepository.listForObject({
    contextId: "enterprise-context:a",
    objectType: ITEM_RESOURCE_TYPE_V010,
    objectId: goods.itemId
  });
  assert.equal(values.length, 1);
  assert.deepEqual(values[0].values, {
    commodityClass: "BEVERAGE"
  });
  assert.deepEqual(values[0].provenance, {
    source: "IMPORT",
    sourceRef: "job-item-1"
  });
});

test("IT-01C duplicate Item code fails during dry-run before any business write", () => {
  const h = harness();
  const dry = stageReady(h, "job-item-duplicate", [{
    code: "ITEM-X",
    displayName: "First",
    itemKind: "GOODS",
    baseUomCode: "C62",
    commodityClass: "A"
  }, {
    code: "item-x",
    displayName: "Second",
    itemKind: "GOODS",
    baseUomCode: "C62",
    commodityClass: "B"
  }]);

  assert.equal(dry.state, "DRY_RUN_FAILED");
  assert.equal(dry.dryRun.invalidRows, 1);
  assert.ok(
    dry.dryRun.rows[1].issues.some(issue =>
      issue.code === "DATA_IMPORT_DUPLICATE_IN_BATCH"
    )
  );
  assert.equal(h.itemRepository.list("enterprise-context:a").length, 0);
});

test("IT-01C detects Item schema drift after dry-run and refuses commit", () => {
  const h = harness();
  const dry = stageReady(h, "job-item-schema-drift");
  assert.equal(dry.state, "DRY_RUN_READY");

  h.extensionRepository.save({
    contextId: "enterprise-context:a",
    definition: extensionDefinition({
      extensionId: "enterprise.demo.item.channel-code",
      fieldId: "channelCode",
      semanticType: "channel-code",
      order: 20,
      label: { default: "Channel code" }
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:53:30.000Z"
  });

  assert.throws(() => h.service.commit({
    contextId: "enterprise-context:a",
    importJobId: "job-item-schema-drift",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:54:00.000Z"
  }), /DATA_IMPORT_SCHEMA_CHANGED_AFTER_DRY_RUN/);

  assert.equal(h.itemRepository.list("enterprise-context:a").length, 0);
});

test("IT-01C rolls back Item business writes when extension-value batch commit fails", () => {
  const h = harness({
    extensionValueRepository(real) {
      return {
        ...real,
        saveMany() {
          throw new Error("TEST_EXTENSION_WRITE_FAILED");
        }
      };
    }
  });
  const dry = stageReady(h, "job-item-rollback");
  assert.equal(dry.state, "DRY_RUN_READY");

  const committed = h.service.commit({
    contextId: "enterprise-context:a",
    importJobId: "job-item-rollback",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:55:00.000Z"
  });

  assert.equal(committed.state, "COMMITTED_WITH_ERRORS");
  assert.equal(committed.receipt.succeededRows, 0);
  assert.equal(committed.receipt.failedRows, 2);
  assert.equal(h.itemRepository.list("enterprise-context:a").length, 0);
  assert.ok(
    committed.receipt.rows.every(row =>
      row.issues[0].code === "DATA_IMPORT_ATOMIC_BATCH_FAILED"
      && row.issues[0].message === "TEST_EXTENSION_WRITE_FAILED"
    )
  );
});

test("IT-01E resolves qualifier-dependent Item import per row from one discovery schema", () => {
  const h = harness();
  h.extensionRepository.save({
    contextId: "enterprise-context:a",
    definition: extensionDefinition({
      extensionId: "enterprise.demo.item.goods-only",
      fieldId: "goodsHandlingClass",
      semanticType: "goods-handling-class",
      order: 30,
      label: { default: "Goods handling class" },
      applicability: {
        qualifiers: {
          "item.kind": ["GOODS"]
        }
      }
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:56:00.000Z"
  });

  const schema = h.target.describe({
    contextId: "enterprise-context:a",
    locale: "en"
  });
  assert.equal(
    schema.fields.some(field => field.fieldId === "goodsHandlingClass"),
    true
  );
  assert.deepEqual(
    schema.fields.find(field => field.fieldId === "goodsHandlingClass")
      ?.applicability,
    {
      qualifiers: {
        "item.kind": ["GOODS"]
      }
    }
  );

  const mixedSource = {
    kind: "ROWS",
    name: "mixed-items",
    headers: [
      "code",
      "displayName",
      "itemKind",
      "baseUomCode",
      "goodsHandlingClass"
    ],
    rows: [{
      code: "ITEM-GOODS-1",
      displayName: "Green Tea",
      itemKind: "GOODS",
      baseUomCode: "C62",
      goodsHandlingClass: "AMBIENT"
    }, {
      code: "ITEM-SVC-1",
      displayName: "Installation",
      itemKind: "SERVICE",
      baseUomCode: "E48",
      goodsHandlingClass: ""
    }]
  };
  const mapping = h.service.suggestMapping({
    schema,
    source: mixedSource
  });
  assert.ok(mapping.some(item =>
    item.targetFieldId === "goodsHandlingClass"
  ));

  h.service.stage({
    contextId: "enterprise-context:a",
    importJobId: "job-row-qualified",
    targetId: ITEM_IMPORT_TARGET_V010,
    source: mixedSource,
    mapping,
    mappingOrigin: "DETERMINISTIC",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:57:00.000Z"
  });
  const dry = h.service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: "job-row-qualified",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:58:00.000Z"
  });

  assert.equal(dry.state, "DRY_RUN_READY");
  assert.equal(dry.dryRun.invalidRows, 0);
  assert.equal(
    dry.dryRun.rows[0].prepared.values.goodsHandlingClass,
    "AMBIENT"
  );
  assert.equal(
    Object.hasOwn(
      dry.dryRun.rows[1].prepared.values,
      "goodsHandlingClass"
    ),
    false
  );

  const committed = h.service.commit({
    contextId: "enterprise-context:a",
    importJobId: "job-row-qualified",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T10:59:00.000Z"
  });
  assert.equal(committed.state, "COMMITTED");

  const goods = h.itemRepository.list("enterprise-context:a")
    .find(item => item.code === "ITEM-GOODS-1");
  const service = h.itemRepository.list("enterprise-context:a")
    .find(item => item.code === "ITEM-SVC-1");
  assert.deepEqual(
    h.extensionValueRepository.listForObject({
      contextId: "enterprise-context:a",
      objectType: ITEM_RESOURCE_TYPE_V010,
      objectId: goods.itemId
    })[0].values,
    { goodsHandlingClass: "AMBIENT" }
  );
  assert.equal(
    h.extensionValueRepository.listForObject({
      contextId: "enterprise-context:a",
      objectType: ITEM_RESOURCE_TYPE_V010,
      objectId: service.itemId
    }).length,
    0
  );
});

test("IT-01E rejects a nonblank qualifier-dependent field when it is not applicable to that row", () => {
  const h = harness();
  h.extensionRepository.save({
    contextId: "enterprise-context:a",
    definition: extensionDefinition({
      extensionId: "enterprise.demo.item.goods-only-invalid",
      fieldId: "goodsHandlingClass",
      semanticType: "goods-handling-class",
      order: 30,
      label: { default: "Goods handling class" },
      applicability: {
        qualifiers: {
          "item.kind": ["GOODS"]
        }
      }
    }),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T11:00:00.000Z"
  });

  const src = {
    kind: "ROWS",
    name: "service-with-goods-field",
    headers: [
      "code",
      "displayName",
      "itemKind",
      "baseUomCode",
      "goodsHandlingClass"
    ],
    rows: [{
      code: "ITEM-SVC-BAD",
      displayName: "Service with invalid goods attribute",
      itemKind: "SERVICE",
      baseUomCode: "E48",
      goodsHandlingClass: "AMBIENT"
    }]
  };
  const schema = h.target.describe({
    contextId: "enterprise-context:a",
    locale: "en"
  });
  const mapping = h.service.suggestMapping({ schema, source: src });
  h.service.stage({
    contextId: "enterprise-context:a",
    importJobId: "job-row-qualified-invalid",
    targetId: ITEM_IMPORT_TARGET_V010,
    source: src,
    mapping,
    mappingOrigin: "DETERMINISTIC",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T11:01:00.000Z"
  });
  const dry = h.service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: "job-row-qualified-invalid",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-09T11:02:00.000Z"
  });

  assert.equal(dry.state, "DRY_RUN_FAILED");
  assert.ok(dry.dryRun.rows[0].issues.some(issue =>
    issue.code === "DATA_IMPORT_FIELD_NOT_APPLICABLE"
    && issue.fieldId === "goodsHandlingClass"
  ));
  assert.equal(h.itemRepository.list("enterprise-context:a").length, 0);
});
