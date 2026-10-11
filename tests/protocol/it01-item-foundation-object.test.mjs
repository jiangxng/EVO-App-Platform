import test from "node:test";
import assert from "node:assert/strict";

import {
  assertObjectExtensionDefinitionV010
} from "../../dist/contracts/foundation-object/extension.js";
import {
  fieldsForSurfaceV010
} from "../../dist/contracts/foundation-object/schema.js";
import {
  assertFoundationObjectConformanceV010
} from "../../dist/foundation/testkit/index.js";
import {
  ITEM_INVENTORY_PROFILE_SLOT_V010,
  createItemEffectiveObjectSchemaV010,
  itemCoreSchemaV010,
  itemFoundationObjectDescriptorV010
} from "../../dist/apps/item/foundation-object.js";

function shelfLifeExtension() {
  return {
    contractVersion: "0.1.0",
    extensionId: "enterprise.demo.item.shelf-life-days",
    targetObjectType: "item.subject",
    targetSlot: ITEM_INVENTORY_PROFILE_SLOT_V010,
    namespace: "enterprise.demo.item",
    fieldId: "shelfLifeDays",
    semanticType: "shelf-life-days",
    valueType: "NUMBER",
    label: {
      default: "Shelf life (days)",
      translations: { "zh-CN": "保质期（天）" }
    },
    description: {
      default: "Enterprise-specific inventory handling attribute for goods."
    },
    required: false,
    order: 10,
    applicability: {
      qualifiers: {
        "ITEM.KIND": ["goods"]
      }
    },
    surfaces: ["DETAIL", "EDIT"],
    searchable: true,
    importable: true,
    exportable: true,
    agentReadable: true,
    agentWritable: true
  };
}

test("IT-01 Item is the materially different second Foundation Object consumer", () => {
  const report = assertFoundationObjectConformanceV010({
    descriptor: itemFoundationObjectDescriptorV010,
    coreSchema: itemCoreSchemaV010
  });

  assert.equal(report.objectType, "item.subject");
  assert.equal(report.ownerPackageId, "evo-item");
  assert.equal(report.schemaRef, "evo.item/0.1.0");
  assert.equal(report.fieldCount, 6);
  assert.equal(report.extensionSlotCount, 3);
  assert.ok(report.surfaces.includes("IMPORT"));
  assert.ok(report.surfaces.includes("AGENT_READ"));

  const serialized = JSON.stringify({
    descriptor: itemFoundationObjectDescriptorV010,
    schema: itemCoreSchemaV010
  }).toLocaleLowerCase();
  for (const forbidden of [
    "counterparty",
    "customer",
    "supplier",
    "relationshiproles"
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test("IT-01 generic qualifiers apply Item extensions without relationship-role semantics", () => {
  const extension = assertObjectExtensionDefinitionV010(shelfLifeExtension());

  assert.deepEqual(extension.applicability, {
    qualifiers: {
      "item.kind": ["GOODS"]
    }
  });

  const noKind = createItemEffectiveObjectSchemaV010({
    extensions: [extension]
  });
  assert.equal(
    noKind.fields.some(field => field.fieldId === "shelfLifeDays"),
    false
  );

  const goods = createItemEffectiveObjectSchemaV010({
    locale: "zh-CN",
    itemKind: "GOODS",
    extensions: [extension]
  });
  assert.deepEqual(goods.activeQualifiers, {
    "item.kind": ["GOODS"]
  });
  assert.equal(
    fieldsForSurfaceV010(goods, "IMPORT")
      .some(field => field.fieldId === "shelfLifeDays"),
    true
  );
  assert.equal(
    goods.fields.find(field => field.fieldId === "shelfLifeDays")
      ?.resolvedLabel,
    "保质期（天）"
  );

  const service = createItemEffectiveObjectSchemaV010({
    itemKind: "SERVICE",
    extensions: [extension]
  });
  assert.equal(
    service.fields.some(field => field.fieldId === "shelfLifeDays"),
    false
  );
});

test("IT-01 keeps Product/SKU/variant/GTIN out of the first Item identity lock-in", () => {
  const fieldIds = itemCoreSchemaV010.fields.map(field => field.fieldId);
  assert.deepEqual(fieldIds, [
    "itemId",
    "code",
    "displayName",
    "itemKind",
    "baseUomCode",
    "description"
  ]);
});
