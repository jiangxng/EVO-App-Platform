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
  createCounterpartyAddressRepositoryV010,
  createCounterpartyContactRepositoryV010,
  createCounterpartyProfileRepositoryV010
} from "../../dist/apps/counterparty/facets.js";
import {
  createCounterpartyImportTargetV010
} from "../../dist/apps/counterparty/import-target.js";
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
  parseCsvSourceV010
} from "../../dist/apps/data-import/csv.js";
import {
  dataImportPackage
} from "../../dist/apps/data-import/package.js";

function extensionDefinition() {
  return {
    contractVersion: "0.1.0",
    extensionId: "enterprise-a.customer.channel-deposit-grade",
    targetObjectType: "counterparty.subject",
    targetSlot: "counterparty.customer-profile",
    namespace: "enterprise.a.counterparty",
    fieldId: "channelDepositGrade",
    semanticType: "customer-channel-deposit-grade",
    valueType: "ENUM",
    label: {
      default: "Channel deposit grade",
      translations: {
        "zh-CN": "渠道保证金等级"
      }
    },
    required: false,
    order: 10,
    applicability: {
      relationshipRoles: ["CUSTOMER"]
    },
    enumOptions: [{
      value: "A",
      label: { default: "A" }
    }, {
      value: "B",
      label: { default: "B" }
    }],
    surfaces: ["DETAIL", "EDIT"],
    searchable: true,
    importable: true,
    exportable: true,
    agentReadable: true,
    agentWritable: true
  };
}

function fixture() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterpartyRepository = createCounterpartyRepositoryV010(resources);
  const roleRepository = createCounterpartyRoleRepositoryV010(
    resources,
    counterpartyRepository
  );
  const contactRepository = createCounterpartyContactRepositoryV010({
    resources,
    counterpartyRepository
  });
  const addressRepository = createCounterpartyAddressRepositoryV010({
    resources,
    counterpartyRepository
  });
  const profileRepository = createCounterpartyProfileRepositoryV010({
    resources,
    counterpartyRepository,
    roleRepository
  });
  const extensionRepository = createObjectExtensionRepositoryV010(resources);
  const extensionValueRepository =
    createObjectExtensionValueRepositoryV010(resources);
  const importRepository = createDataImportRepositoryV010(resources);
  const target = createCounterpartyImportTargetV010({
    resources,
    repository: counterpartyRepository,
    roleRepository,
    contactRepository,
    addressRepository,
    profileRepository,
    extensionRepository,
    extensionValueRepository
  });
  const service = createDataImportServiceV010({
    repository: importRepository,
    targets: [target]
  });
  return {
    resources,
    counterpartyRepository,
    roleRepository,
    contactRepository,
    addressRepository,
    profileRepository,
    extensionRepository,
    extensionValueRepository,
    importRepository,
    target,
    service
  };
}

test("CSV parser preserves quoted commas and escaped quotes", () => {
  const source = parseCsvSourceV010({
    name: "counterparties.csv",
    csv: [
      "code,name,notes",
      "C001,\"Alpha, Inc.\",\"Uses \"\"special\"\" terms\"",
      "C002,Beta,"
    ].join("\n")
  });

  assert.deepEqual(source.headers, ["code", "name", "notes"]);
  assert.equal(source.rows.length, 2);
  assert.equal(source.rows[0].name, "Alpha, Inc.");
  assert.equal(source.rows[0].notes, 'Uses "special" terms');
});

test("Data Import maps core and enterprise extension fields through one Counterparty EffectiveObjectSchema", () => {
  const f = fixture();
  f.extensionRepository.save({
    contextId: "enterprise-context:a",
    definition: extensionDefinition(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:00:00.000Z"
  });

  const staged = f.service.stage({
    contextId: "enterprise-context:a",
    importJobId: "import-1",
    targetId: "counterparty.subject",
    targetParameters: {
      relationshipRoles: ["CUSTOMER"]
    },
    source: parseCsvSourceV010({
      name: "customers.csv",
      csv: [
        "客户编码,客户名称,主体类型,保证金等级,邮箱",
        "C001,甲公司,ORGANIZATION,A,a@example.com",
        "C002,乙公司,ORGANIZATION,B,b@example.com"
      ].join("\n")
    }),
    mapping: [{
      sourceColumn: "客户编码",
      targetFieldId: "code"
    }, {
      sourceColumn: "客户名称",
      targetFieldId: "displayName"
    }, {
      sourceColumn: "主体类型",
      targetFieldId: "subjectType"
    }, {
      sourceColumn: "保证金等级",
      targetFieldId: "channelDepositGrade"
    }, {
      sourceColumn: "邮箱",
      targetFieldId: "email"
    }],
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:01:00.000Z"
  });

  assert.equal(staged.state, "STAGED");
  assert.equal(staged.source.rows.length, 2);

  const dryRun = f.service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: "import-1",
    locale: "zh-CN",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:02:00.000Z"
  });
  assert.equal(dryRun.state, "DRY_RUN_READY");
  assert.equal(dryRun.dryRun.totalRows, 2);
  assert.equal(dryRun.dryRun.validRows, 2);
  assert.equal(
    dryRun.dryRun.rows[0].prepared.values.channelDepositGrade,
    "A"
  );

  const committed = f.service.commit({
    contextId: "enterprise-context:a",
    importJobId: "import-1",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:03:00.000Z"
  });
  assert.equal(committed.state, "COMMITTED");
  assert.equal(committed.receipt.succeededRows, 2);
  assert.equal(committed.receipt.failedRows, 0);

  const counterparties = f.counterpartyRepository.list(
    "enterprise-context:a"
  );
  assert.equal(counterparties.length, 2);
  assert.deepEqual(
    counterparties.map(item => item.code).sort(),
    ["C001", "C002"]
  );

  for (const counterparty of counterparties) {
    assert.equal(
      f.roleRepository.has(
        "enterprise-context:a",
        counterparty.counterpartyId,
        "CUSTOMER"
      ),
      true
    );
    const values = f.extensionValueRepository.listForObject({
      contextId: "enterprise-context:a",
      objectType: "counterparty.subject",
      objectId: counterparty.counterpartyId
    });
    assert.equal(values.length, 1);
    assert.equal(
      values[0].targetRef.slot,
      "counterparty.customer-profile"
    );
    assert.equal(values[0].provenance.source, "IMPORT");
  }

  assert.throws(() => f.service.commit({
    contextId: "enterprise-context:a",
    importJobId: "import-1",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:04:00.000Z"
  }), /DATA_IMPORT_JOB_ALREADY_COMMITTED/);

  assert.equal(
    f.counterpartyRepository.list("enterprise-context:b").length,
    0
  );
});

test("Data Import dry run blocks duplicate batch identities and exports correctable error CSV", () => {
  const f = fixture();
  const source = parseCsvSourceV010({
    csv: [
      "code,name,type",
      "C001,Alpha,ORGANIZATION",
      "C001,Duplicate Alpha,ORGANIZATION"
    ].join("\n")
  });
  f.service.stage({
    contextId: "enterprise-context:a",
    importJobId: "import-duplicates",
    targetId: "counterparty.subject",
    source,
    mapping: [{
      sourceColumn: "code",
      targetFieldId: "code"
    }, {
      sourceColumn: "name",
      targetFieldId: "displayName"
    }, {
      sourceColumn: "type",
      targetFieldId: "subjectType"
    }],
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:10:00.000Z"
  });

  const dryRun = f.service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: "import-duplicates",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:11:00.000Z"
  });

  assert.equal(dryRun.state, "DRY_RUN_FAILED");
  assert.equal(dryRun.dryRun.invalidRows, 1);
  assert.equal(
    dryRun.dryRun.rows[1].issues.some(issue =>
      issue.code === "DATA_IMPORT_DUPLICATE_IN_BATCH"
    ),
    true
  );
  assert.throws(() => f.service.commit({
    contextId: "enterprise-context:a",
    importJobId: "import-duplicates",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:12:00.000Z"
  }), /DATA_IMPORT_DRY_RUN_REQUIRED/);

  const csv = f.service.errorRowsCsv({
    contextId: "enterprise-context:a",
    importJobId: "import-duplicates"
  });
  assert.match(csv, /DATA_IMPORT_DUPLICATE_IN_BATCH/);
});

test("Data Import detects EffectiveObjectSchema changes after dry run", () => {
  const f = fixture();
  f.service.stage({
    contextId: "enterprise-context:a",
    importJobId: "import-schema-drift",
    targetId: "counterparty.subject",
    targetParameters: {
      relationshipRoles: ["CUSTOMER"]
    },
    source: parseCsvSourceV010({
      csv: [
        "code,name,type",
        "C001,Alpha,ORGANIZATION"
      ].join("\n")
    }),
    mapping: [{
      sourceColumn: "code",
      targetFieldId: "code"
    }, {
      sourceColumn: "name",
      targetFieldId: "displayName"
    }, {
      sourceColumn: "type",
      targetFieldId: "subjectType"
    }],
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:20:00.000Z"
  });
  assert.equal(f.service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: "import-schema-drift",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:21:00.000Z"
  }).state, "DRY_RUN_READY");

  f.extensionRepository.save({
    contextId: "enterprise-context:a",
    definition: extensionDefinition(),
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:22:00.000Z"
  });

  assert.throws(() => f.service.commit({
    contextId: "enterprise-context:a",
    importJobId: "import-schema-drift",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:23:00.000Z"
  }), /DATA_IMPORT_SCHEMA_CHANGED_AFTER_DRY_RUN/);
});

test("Data Import can stage and dry-run 10k Counterparty rows without committing business data", () => {
  const f = fixture();
  const rows = Array.from({ length: 10000 }, (_, index) => ({
    code: "C" + String(index + 1).padStart(5, "0"),
    name: "Counterparty " + (index + 1),
    type: "ORGANIZATION"
  }));
  const staged = f.service.stage({
    contextId: "enterprise-context:a",
    importJobId: "import-10k",
    targetId: "counterparty.subject",
    source: {
      kind: "ROWS",
      headers: ["code", "name", "type"],
      rows
    },
    mapping: [{
      sourceColumn: "code",
      targetFieldId: "code"
    }, {
      sourceColumn: "name",
      targetFieldId: "displayName"
    }, {
      sourceColumn: "type",
      targetFieldId: "subjectType"
    }],
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:30:00.000Z"
  });
  assert.equal(staged.source.rows.length, 10000);

  const dryRun = f.service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: "import-10k",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T05:31:00.000Z"
  });
  assert.equal(dryRun.state, "DRY_RUN_READY");
  assert.equal(dryRun.dryRun.validRows, 10000);
  assert.equal(
    f.counterpartyRepository.list("enterprise-context:a").length,
    0
  );
});

test("Data Import package is generic and exposes stage/dry-run/commit/read/error operations", () => {
  const feature = dataImportPackage.features[0];
  assert.equal(feature.activationScope, "INSTALLATION");
  assert.ok(feature.requiresCapabilities.includes(
    "enterprise.resource.repository"
  ));
  assert.ok(feature.providesCapabilities.includes(
    "enterprise.data-import"
  ));
  const operations = feature.contributions
    .filter(item => item.kind === "platform.capability-operation")
    .map(item => item.operation.operationId)
    .sort();
  assert.deepEqual(operations, [
    "enterprise.data-import.commit",
    "enterprise.data-import.dry-run",
    "enterprise.data-import.error-csv",
    "enterprise.data-import.get",
    "enterprise.data-import.mapping.apply",
    "enterprise.data-import.mapping.inspect",
    "enterprise.data-import.stage-csv",
    "enterprise.data-import.stage-file"
  ]);
});
