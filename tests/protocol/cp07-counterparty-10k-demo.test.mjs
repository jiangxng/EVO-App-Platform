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
import {
  COUNTERPARTY_CUSTOMER_PROJECTION_V010,
  projectCounterpartiesV010
} from "../../dist/apps/counterparty/projections.js";

function extensionDefinition() {
  return {
    contractVersion: "0.1.0",
    extensionId: "cp07.customer.channel-deposit-grade",
    targetObjectType: "counterparty.subject",
    targetSlot: "counterparty.customer-profile",
    namespace: "enterprise.cp07.counterparty",
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

test("CP-07 commits a deterministic 10k Counterparty demo and projects the committed data through governed role semantics", () => {
  const contextId = "enterprise-context:cp07-demo";
  const actorSubjectId = "owner-cp07";

  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const roles = createCounterpartyRoleRepositoryV010(resources, counterparties);
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

  extensions.save({
    contextId,
    definition: extensionDefinition(),
    actorSubjectId,
    recordedAt: "2026-10-09T09:20:00.000Z"
  });

  const rows = createCounterpartyImportDemoRowsV010(10_000);
  const staged = service.stage({
    contextId,
    importJobId: "cp07-demo-10000",
    targetId: "counterparty.subject",
    targetParameters: {
      relationshipRoles: ["CUSTOMER"]
    },
    source: {
      kind: "ROWS",
      name: "cp07-counterparty-demo-10000",
      headers: [
        "code",
        "displayName",
        "subjectType",
        "countryOrRegion",
        "email",
        "channelDepositGrade"
      ],
      rows
    },
    mapping: mapping(),
    actorSubjectId,
    recordedAt: "2026-10-09T09:21:00.000Z"
  });
  assert.equal(staged.state, "STAGED");
  assert.equal(staged.source.rows.length, 10_000);

  const dryRun = service.dryRun({
    contextId,
    importJobId: "cp07-demo-10000",
    locale: "zh-CN",
    actorSubjectId,
    recordedAt: "2026-10-09T09:22:00.000Z"
  });
  assert.equal(dryRun.state, "DRY_RUN_READY");
  assert.equal(dryRun.dryRun.totalRows, 10_000);
  assert.equal(dryRun.dryRun.validRows, 10_000);
  assert.equal(dryRun.dryRun.invalidRows, 0);

  const committed = service.commit({
    contextId,
    importJobId: "cp07-demo-10000",
    actorSubjectId,
    recordedAt: "2026-10-09T09:23:00.000Z"
  });
  assert.equal(committed.state, "COMMITTED");
  assert.equal(committed.receipt.totalRows, 10_000);
  assert.equal(committed.receipt.succeededRows, 10_000);
  assert.equal(committed.receipt.failedRows, 0);

  const persistedCounterparties = counterparties.list(contextId);
  const persistedRoles = roles.list(contextId);
  assert.equal(persistedCounterparties.length, 10_000);
  assert.equal(persistedRoles.length, 10_000);
  assert.equal(
    new Set(persistedCounterparties.map(item => item.counterpartyId)).size,
    10_000
  );

  const authorizedCounterpartyIds = new Set(
    persistedCounterparties.map(item => item.counterpartyId)
  );
  const projected = projectCounterpartiesV010({
    projectionId: COUNTERPARTY_CUSTOMER_PROJECTION_V010,
    counterparties: persistedCounterparties,
    roles: persistedRoles,
    responsibilities: [],
    principalSubjectId: actorSubjectId,
    authorizedCounterpartyIds
  });
  assert.equal(projected.length, 10_000);
  assert.equal(
    new Set(projected.map(item => item.counterpartyId)).size,
    10_000
  );

  const first = persistedCounterparties.find(
    item => item.code === "DEMO-000001"
  );
  const last = persistedCounterparties.find(
    item => item.code === "DEMO-010000"
  );
  assert.ok(first);
  assert.ok(last);
  assert.deepEqual(
    roles.list(contextId, first.counterpartyId).map(item => item.roleCode),
    ["CUSTOMER"]
  );
  assert.equal(
    extensionValues.listForObject({
      contextId,
      objectType: "counterparty.subject",
      objectId: first.counterpartyId
    })[0].values.channelDepositGrade,
    "A"
  );
});
