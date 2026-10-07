import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  createCounterpartyRepositoryV010
} from "../../dist/apps/counterparty/repository.js";
import {
  createCounterpartyRoleRepositoryV010
} from "../../dist/apps/counterparty/roles.js";
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
  createCounterpartyImportTargetV010
} from "../../dist/apps/counterparty/import-target.js";
import {
  createCounterpartyImportDemoRowsV010
} from "../../dist/apps/counterparty/demo-data.js";

function extensionDefinition() {
  return {
    contractVersion: "0.1.0",
    extensionId: "demo.customer.channel-deposit-grade",
    targetObjectType: "counterparty.subject",
    targetSlot: "counterparty.customer-profile",
    namespace: "enterprise.demo.counterparty",
    fieldId: "channelDepositGrade",
    semanticType: "customer-channel-deposit-grade",
    valueType: "ENUM",
    label: {
      default: "Channel deposit grade",
      translations: { "zh-CN": "渠道保证金等级" }
    },
    required: false,
    order: 10,
    applicability: {
      relationshipRoles: ["CUSTOMER"]
    },
    enumOptions: [
      { value: "A", label: { default: "A" } },
      { value: "B", label: { default: "B" } },
      { value: "C", label: { default: "C" } }
    ],
    surfaces: ["EDIT"],
    searchable: true,
    importable: true,
    exportable: true,
    agentReadable: true,
    agentWritable: true
  };
}

function fixture() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const roles = createCounterpartyRoleRepositoryV010(
    resources,
    counterparties
  );
  const extensions = createObjectExtensionRepositoryV010(resources);
  const extensionValues = createObjectExtensionValueRepositoryV010(resources);
  const importJobs = createDataImportRepositoryV010(resources);
  const target = createCounterpartyImportTargetV010({
    resources,
    repository: counterparties,
    roleRepository: roles,
    extensionRepository: extensions,
    extensionValueRepository: extensionValues
  });
  const service = createDataImportServiceV010({
    repository: importJobs,
    targets: [target]
  });
  return {
    resources,
    counterparties,
    roles,
    extensions,
    extensionValues,
    importJobs,
    target,
    service
  };
}

function mapping() {
  return [
    ["code", "code"],
    ["displayName", "displayName"],
    ["subjectType", "subjectType"],
    ["countryOrRegion", "countryOrRegion"],
    ["email", "email"],
    ["channelDepositGrade", "channelDepositGrade"]
  ].map(([sourceColumn, targetFieldId]) => ({
    sourceColumn,
    targetFieldId
  }));
}

function source(rows) {
  return {
    kind: "ROWS",
    name: "counterparty-demo",
    headers: [
      "code",
      "displayName",
      "subjectType",
      "countryOrRegion",
      "email",
      "channelDepositGrade"
    ],
    rows
  };
}

test("Enterprise Resource transaction rolls back all staged resource writes on failure", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();

  assert.throws(() => resources.transaction(() => {
    resources.put({
      contextId: "enterprise-context:a",
      namespace: "test",
      collectionId: "items",
      resourceType: "test.item",
      resourceId: "one",
      schemaRef: "test.item/0.1.0",
      payload: { value: 1 },
      actorSubjectId: "owner-a",
      recordedAt: "2026-10-07T05:00:00.000Z"
    });
    resources.put({
      contextId: "enterprise-context:a",
      namespace: "test",
      collectionId: "items",
      resourceType: "test.item",
      resourceId: "two",
      schemaRef: "test.item/0.1.0",
      payload: { value: 2 },
      actorSubjectId: "owner-a",
      recordedAt: "2026-10-07T05:00:00.000Z"
    });
    throw new Error("ROLLBACK");
  }), /ROLLBACK/);

  assert.equal(
    resources.list({
      contextId: "enterprise-context:a",
      namespace: "test"
    }).length,
    0
  );
});

test("CP-03 commits a deterministic 1k Counterparty demo in one atomic batch", () => {
  const f = fixture();
  f.extensions.save({
    contextId: "enterprise-context:a",
    definition: extensionDefinition(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:01:00.000Z"
  });

  const rows = createCounterpartyImportDemoRowsV010(1000);
  const staged = f.service.stage({
    contextId: "enterprise-context:a",
    importJobId: "import-demo-1000",
    targetId: "counterparty.subject",
    targetParameters: {
      relationshipRoles: ["CUSTOMER", "SUPPLIER"]
    },
    source: source(rows),
    mapping: mapping(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:02:00.000Z"
  });
  assert.equal(staged.state, "STAGED");

  const dryRun = f.service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: "import-demo-1000",
    locale: "zh-CN",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:03:00.000Z"
  });
  assert.equal(dryRun.state, "DRY_RUN_READY");
  assert.equal(dryRun.dryRun.totalRows, 1000);
  assert.equal(dryRun.dryRun.validRows, 1000);
  assert.equal(dryRun.dryRun.invalidRows, 0);

  const committed = f.service.commit({
    contextId: "enterprise-context:a",
    importJobId: "import-demo-1000",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:04:00.000Z"
  });

  assert.equal(committed.state, "COMMITTED");
  assert.equal(committed.receipt.totalRows, 1000);
  assert.equal(committed.receipt.succeededRows, 1000);
  assert.equal(committed.receipt.failedRows, 0);
  assert.equal(f.counterparties.list("enterprise-context:a").length, 1000);
  assert.equal(f.roles.list("enterprise-context:a").length, 2000);
  assert.equal(
    f.resources.list({
      contextId: "enterprise-context:a",
      namespace: "evo.object-extension",
      collectionId: "values",
      resourceType: "object-extension.values",
      lifecycleState: "ACTIVE"
    }).length,
    1000
  );

  const first = f.counterparties.list("enterprise-context:a")
    .find(item => item.code === "DEMO-000001");
  assert.ok(first);
  assert.deepEqual(
    f.roles.list("enterprise-context:a", first.counterpartyId)
      .map(item => item.roleCode),
    ["CUSTOMER", "SUPPLIER"]
  );
  const values = f.extensionValues.listForObject({
    contextId: "enterprise-context:a",
    objectType: "counterparty.subject",
    objectId: first.counterpartyId
  });
  assert.equal(values.length, 1);
  assert.equal(values[0].values.channelDepositGrade, "A");
});

test("CP-03 atomic batch commit rolls back every imported row when post-dry-run conflict appears", () => {
  const f = fixture();
  const rows = createCounterpartyImportDemoRowsV010(2);

  f.service.stage({
    contextId: "enterprise-context:a",
    importJobId: "import-atomic-conflict",
    targetId: "counterparty.subject",
    source: source(rows),
    mapping: mapping().filter(item =>
      item.targetFieldId !== "channelDepositGrade"
    ),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:10:00.000Z"
  });

  const dryRun = f.service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: "import-atomic-conflict",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:11:00.000Z"
  });
  assert.equal(dryRun.state, "DRY_RUN_READY");

  f.counterparties.save({
    contextId: "enterprise-context:a",
    subject: {
      contractVersion: "0.1.0",
      counterpartyId: "preexisting",
      code: "DEMO-000002",
      displayName: "Existing conflict",
      subjectType: "ORGANIZATION",
      status: "ACTIVE"
    },
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:12:00.000Z"
  });

  const committed = f.service.commit({
    contextId: "enterprise-context:a",
    importJobId: "import-atomic-conflict",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:13:00.000Z"
  });

  assert.equal(committed.state, "COMMITTED_WITH_ERRORS");
  assert.equal(committed.receipt.succeededRows, 0);
  assert.equal(committed.receipt.failedRows, 2);
  assert.equal(
    committed.receipt.rows.every(row =>
      row.issues[0].code === "DATA_IMPORT_ATOMIC_BATCH_FAILED"
    ),
    true
  );

  const active = f.counterparties.list("enterprise-context:a");
  assert.deepEqual(active.map(item => item.counterpartyId), ["preexisting"]);
  assert.equal(f.roles.list("enterprise-context:a").length, 0);
});

test("Counterparty demo generator is deterministic and bounded", () => {
  assert.deepEqual(
    createCounterpartyImportDemoRowsV010(3),
    createCounterpartyImportDemoRowsV010(3)
  );
  assert.throws(
    () => createCounterpartyImportDemoRowsV010(0),
    /COUNTERPARTY_DEMO_ROW_COUNT_INVALID/
  );
  assert.throws(
    () => createCounterpartyImportDemoRowsV010(10001),
    /COUNTERPARTY_DEMO_ROW_COUNT_INVALID/
  );
});
