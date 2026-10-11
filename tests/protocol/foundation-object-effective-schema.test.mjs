import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryEnterpriseResourceRepositoryV010
} from "../../dist/providers/enterprise-context/resources.js";
import {
  agentFieldsFromEffectiveSchemaV010,
  fieldsForSurfaceV010,
  importColumnsFromEffectiveSchemaV010
} from "../../dist/contracts/foundation-object/schema.js";
import {
  compileEffectiveObjectSchemaV010
} from "../../dist/foundation/schema-compiler/index.js";
import {
  assertFoundationObjectConformanceV010
} from "../../dist/foundation/testkit/index.js";
import {
  createObjectExtensionRepositoryV010,
  OBJECT_EXTENSION_COLLECTION_V010,
  OBJECT_EXTENSION_NAMESPACE_V010,
  OBJECT_EXTENSION_RESOURCE_TYPE_V010,
  OBJECT_EXTENSION_SCHEMA_V010
} from "../../dist/apps/object-extension/repository.js";
import {
  objectExtensionPackage,
  OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010
} from "../../dist/apps/object-extension/package.js";
import {
  counterpartyCoreSchemaV010,
  counterpartyFoundationObjectDescriptorV010,
  createCounterpartyEffectiveObjectSchemaV010
} from "../../dist/apps/counterparty/foundation-object.js";
import {
  createCounterpartyCreatePageV010,
  createCounterpartyEditPageV010
} from "../../dist/apps/counterparty/page.js";

function channelDepositGrade(extensionId = "enterprise-x.customer.channel-deposit-grade") {
  return {
    contractVersion: "0.1.0",
    extensionId,
    targetObjectType: "counterparty.subject",
    targetSlot: "counterparty.customer-profile",
    namespace: "enterprise.x.counterparty",
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
    permissions: {
      readCapability: "counterparty.customer-profile.read",
      writeCapability: "counterparty.customer-profile.write"
    },
    searchable: true,
    importable: true,
    exportable: true,
    agentReadable: true,
    agentWritable: true
  };
}

test("Counterparty satisfies the reusable Foundation Object conformance boundary", () => {
  const report = assertFoundationObjectConformanceV010({
    descriptor: counterpartyFoundationObjectDescriptorV010,
    coreSchema: counterpartyCoreSchemaV010
  });
  assert.equal(report.objectType, "counterparty.subject");
  assert.equal(report.schemaRef, "evo.counterparty/0.1.0");
  assert.equal(report.fieldCount, 19);
  assert.equal(report.extensionSlotCount, 5);
  assert.ok(report.surfaces.includes("IMPORT"));
  assert.ok(report.surfaces.includes("AGENT_READ"));
});

test("Counterparty core forms are rendered from one EffectiveObjectSchema without semantic loss", () => {
  const effective = createCounterpartyEffectiveObjectSchemaV010({
    locale: "zh-CN"
  });

  assert.equal(effective.objectType, "counterparty.subject");
  assert.equal(
    effective.baseSchemaRef,
    "evo.counterparty/0.1.0"
  );

  assert.deepEqual(
    fieldsForSurfaceV010(effective, "CREATE").map(field => field.fieldId),
    [
      "code",
      "displayName",
      "subjectType",
      "legalName",
      "taxIdentifier",
      "countryOrRegion",
      "phone",
      "email",
      "notes"
    ]
  );

  const page = createCounterpartyCreatePageV010("zh-CN");
  assert.deepEqual(
    page.fields.map(field => field.key),
    [
      "code",
      "displayName",
      "subjectType",
      "legalName",
      "taxIdentifier",
      "countryOrRegion",
      "phone",
      "email",
      "notes"
    ]
  );
  assert.equal(
    page.fields.find(field => field.key === "displayName").label,
    "往来名称"
  );
  assert.deepEqual(
    page.fields.find(field => field.key === "subjectType").options,
    [{
      value: "ORGANIZATION",
      label: "机构"
    }, {
      value: "PERSON",
      label: "个人"
    }]
  );

  const edit = createCounterpartyEditPageV010({
    counterparty: {
      contractVersion: "0.1.0",
      counterpartyId: "cp-1",
      code: "C001",
      displayName: "ABC有限公司",
      subjectType: "ORGANIZATION",
      status: "ACTIVE",
      countryOrRegion: "中国"
    },
    locale: "zh-CN"
  });
  assert.equal(edit.fields[0].key, "counterpartyId");
  assert.equal(edit.fields[0].readOnly, true);
  assert.equal(edit.fields[0].initialValue, "cp-1");
  assert.equal(
    edit.fields.find(field => field.key === "countryOrRegion").initialValue,
    "中国"
  );
});

test("Enterprise extension compiles into the same Human, Import and Agent schema only when applicable", () => {
  const definition = channelDepositGrade();

  const noRole = createCounterpartyEffectiveObjectSchemaV010({
    locale: "zh-CN",
    extensions: [definition]
  });
  assert.equal(
    noRole.fields.some(field => field.fieldId === "channelDepositGrade"),
    false
  );

  const customer = createCounterpartyEffectiveObjectSchemaV010({
    locale: "zh-CN",
    activeRelationshipRoles: ["CUSTOMER"],
    extensions: [definition]
  });
  const field = customer.fields.find(
    item => item.fieldId === "channelDepositGrade"
  );

  assert.equal(field.source, "ENTERPRISE_EXTENSION");
  assert.equal(field.extensionId, definition.extensionId);
  assert.equal(field.resolvedLabel, "渠道保证金等级");
  assert.equal(field.slotId, "counterparty.customer-profile");

  assert.equal(
    fieldsForSurfaceV010(customer, "EDIT")
      .some(item => item.fieldId === "channelDepositGrade"),
    true
  );
  assert.equal(
    importColumnsFromEffectiveSchemaV010(customer)
      .some(item => item.fieldId === "channelDepositGrade"),
    true
  );
  assert.equal(
    agentFieldsFromEffectiveSchemaV010(customer, "READ")
      .some(item => item.fieldId === "channelDepositGrade"),
    true
  );
  assert.equal(
    agentFieldsFromEffectiveSchemaV010(customer, "WRITE")
      .some(item => item.fieldId === "channelDepositGrade"),
    true
  );
});

test("Effective schema authorization removes unreadable fields and can make readable fields non-writable", () => {
  const definition = channelDepositGrade();
  const hidden = createCounterpartyEffectiveObjectSchemaV010({
    locale: "en",
    activeRelationshipRoles: ["CUSTOMER"],
    extensions: [definition],
    authorizeField(input) {
      if (input.fieldId === "channelDepositGrade") {
        return { readable: false, writable: false };
      }
      return { readable: true, writable: true };
    }
  });
  assert.equal(
    hidden.fields.some(field => field.fieldId === "channelDepositGrade"),
    false
  );

  const readOnly = createCounterpartyEffectiveObjectSchemaV010({
    locale: "en",
    activeRelationshipRoles: ["CUSTOMER"],
    extensions: [definition],
    authorizeField(input) {
      if (input.fieldId === "channelDepositGrade") {
        return { readable: true, writable: false };
      }
      return { readable: true, writable: true };
    }
  });
  const field = readOnly.fields.find(
    item => item.fieldId === "channelDepositGrade"
  );
  assert.equal(field.readable, true);
  assert.equal(field.writable, false);
  assert.equal(
    agentFieldsFromEffectiveSchemaV010(readOnly, "WRITE")
      .some(item => item.fieldId === "channelDepositGrade"),
    false
  );
});

test("Effective schema output is deterministic and rejects invalid extension slots/collisions", () => {
  const first = channelDepositGrade("ext-a");
  const second = {
    ...channelDepositGrade("ext-b"),
    fieldId: "customerSegmentCode",
    semanticType: "customer-segment-code",
    order: 5,
    valueType: "STRING",
    enumOptions: undefined,
    label: { default: "Customer segment code" }
  };

  const a = compileEffectiveObjectSchemaV010({
    descriptor: counterpartyFoundationObjectDescriptorV010,
    coreSchema: counterpartyCoreSchemaV010,
    activeRelationshipRoles: ["CUSTOMER"],
    extensions: [first, second]
  });
  const b = compileEffectiveObjectSchemaV010({
    descriptor: counterpartyFoundationObjectDescriptorV010,
    coreSchema: counterpartyCoreSchemaV010,
    activeRelationshipRoles: ["CUSTOMER"],
    extensions: [second, first]
  });

  assert.deepEqual(a, b);
  assert.ok(
    a.fields.findIndex(field => field.fieldId === "customerSegmentCode")
      < a.fields.findIndex(field => field.fieldId === "channelDepositGrade")
  );

  assert.throws(() => compileEffectiveObjectSchemaV010({
    descriptor: counterpartyFoundationObjectDescriptorV010,
    coreSchema: counterpartyCoreSchemaV010,
    activeRelationshipRoles: ["CUSTOMER"],
    extensions: [{
      ...first,
      extensionId: "invalid-slot",
      targetSlot: "counterparty.unknown"
    }]
  }), /OBJECT_EXTENSION_TARGET_SLOT_UNKNOWN/);

  assert.throws(() => compileEffectiveObjectSchemaV010({
    descriptor: counterpartyFoundationObjectDescriptorV010,
    coreSchema: counterpartyCoreSchemaV010,
    activeRelationshipRoles: ["CUSTOMER"],
    extensions: [{
      ...first,
      extensionId: "collision",
      targetSlot: "counterparty.identity",
      fieldId: "code"
    }]
  }), /EFFECTIVE_OBJECT_FIELD_ID_COLLISION/);
});

test("Object Extension definitions persist in Enterprise Context and remain isolated from plugin lifecycle semantics", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const repository = createObjectExtensionRepositoryV010(resources);
  const definition = channelDepositGrade();

  repository.save({
    contextId: "enterprise-context:a",
    definition,
    actorSubjectId: "admin-a",
    recordedAt: "2026-10-07T04:00:00.000Z"
  });

  assert.equal(
    repository.list("enterprise-context:a", "counterparty.subject").length,
    1
  );
  assert.equal(repository.list("enterprise-context:b").length, 0);

  const raw = resources.list({
    contextId: "enterprise-context:a",
    namespace: OBJECT_EXTENSION_NAMESPACE_V010,
    collectionId: OBJECT_EXTENSION_COLLECTION_V010,
    resourceType: OBJECT_EXTENSION_RESOURCE_TYPE_V010,
    lifecycleState: "ACTIVE"
  });
  assert.equal(raw.length, 1);
  assert.equal(raw[0].schemaRef, OBJECT_EXTENSION_SCHEMA_V010);
  assert.equal(raw[0].ownerPackageId, "evo-object-extension");

  assert.throws(() => repository.save({
    contextId: "enterprise-context:a",
    definition: {
      ...definition,
      extensionId: "duplicate-field"
    },
    actorSubjectId: "admin-a",
    recordedAt: "2026-10-07T04:01:00.000Z"
  }), /OBJECT_EXTENSION_FIELD_DUPLICATE/);

  repository.archive({
    contextId: "enterprise-context:a",
    extensionId: definition.extensionId,
    actorSubjectId: "admin-a",
    recordedAt: "2026-10-07T04:02:00.000Z"
  });

  assert.equal(
    repository.get("enterprise-context:a", definition.extensionId),
    undefined
  );
  assert.equal(
    resources.list({
      contextId: "enterprise-context:a",
      namespace: OBJECT_EXTENSION_NAMESPACE_V010,
      lifecycleState: "ARCHIVED"
    }).length,
    1
  );
});

test("Object Extension publishes governed capability operations after CP-03 wiring", () => {
  const feature = objectExtensionPackage.features[0];
  assert.equal(feature.activationScope, "INSTALLATION");
  assert.equal(feature.defaultActivation, true);
  assert.ok(
    feature.requiresCapabilities.includes("enterprise.resource.repository")
  );
  assert.ok(
    feature.providesCapabilities.includes(
      OBJECT_EXTENSION_DEFINITION_CAPABILITY_V010
    )
  );
  const operations = feature.contributions
    .filter(item => item.kind === "platform.capability-operation")
    .map(item => item.operation);
  assert.deepEqual(
    operations.map(item => item.operationId).sort(),
    [
      "enterprise.object-extension.definition.archive",
      "enterprise.object-extension.definition.list",
      "enterprise.object-extension.definition.upsert"
    ]
  );
  assert.equal(
    operations.every(item => item.dataScope === "ENTERPRISE"),
    true
  );
});
