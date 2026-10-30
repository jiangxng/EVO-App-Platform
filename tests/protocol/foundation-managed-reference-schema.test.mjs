import test from "node:test";
import assert from "node:assert/strict";
import { compileEffectiveObjectSchemaV010 } from "../../dist/foundation/schema-compiler/index.js";
import { fieldsForSurfaceV010, agentFieldsFromEffectiveSchemaV010 } from "../../dist/contracts/foundation-object/schema.js";
import { assertObjectExtensionDefinitionV010 } from "../../dist/contracts/foundation-object/extension.js";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { createObjectExtensionRepositoryV010 } from "../../dist/apps/object-extension/repository.js";
import {
  counterpartyFoundationObjectDescriptorV010,
  counterpartyCoreSchemaV010
} from "../../dist/apps/counterparty/foundation-object.js";

const field = (kind = "BUSINESS_DICTIONARY", id = "counterparty.customer-level") => ({
  contractVersion: "0.1.0",
  extensionId: "customer-reference",
  targetObjectType: "counterparty.subject",
  targetSlot: "counterparty.customer-profile",
  namespace: "enterprise.a",
  fieldId: "customerLevelRef",
  semanticType: "business-reference",
  valueType: "REFERENCE",
  label: { default: "Customer level" },
  order: 101,
  required: false,
  surfaces: ["DETAIL", "EDIT", "IMPORT", "AGENT_READ"],
  reference: { sourceKind: kind, sourceId: id, expectedVersion: 3, cardinality: "ONE" }
});
const compile = (extensions, overrides = {}) => compileEffectiveObjectSchemaV010({
  descriptor: counterpartyFoundationObjectDescriptorV010,
  coreSchema: counterpartyCoreSchemaV010,
  extensions,
  activeRelationshipRoles: ["CUSTOMER"],
  ...overrides
});

test("MD-01: existing effective schema keeps the exact single source of truth", () => {
  const current = compile([]);
  assert.equal(current.fields.length > 0, true);
  assert.equal(current.fields.some(x => x.valueType === "REFERENCE"), false);
});

test("MD-01: managed dictionary, organization and personnel fields use SAME effective schema", () => {
  const references = [
    field(),
    { ...field("ORGANIZATION", "org.main"), extensionId: "responsible-dept",
      fieldId: "responsibleDepartment", reference: {
        sourceKind: "ORGANIZATION", sourceId: "org.main",
        expectedVersion: 2, cardinality: "ONE"
      } },
    { ...field("PERSONNEL", "staff"), extensionId: "responsible-person",
      fieldId: "responsiblePerson", reference: {
        sourceKind: "PERSONNEL", sourceId: "staff",
        expectedVersion: 5, cardinality: "ONE"
      } }
  ];
  const observed = [];
  const schema = compile(references, {
    resolvePublishedReference(x) { observed.push(x); return true; }
  });
  assert.equal(observed.length, 3);
  assert.deepEqual(schema.fields.filter(x => x.valueType === "REFERENCE")
    .map(x => [x.fieldId, x.reference.sourceKind, x.reference.expectedVersion, x.control]),
  [["customerLevelRef", "BUSINESS_DICTIONARY", 3, "select"],
   ["responsibleDepartment", "ORGANIZATION", 2, "select"],
   ["responsiblePerson", "PERSONNEL", 5, "select"]]);
  assert.ok(fieldsForSurfaceV010(schema, "IMPORT")
    .some(x => x.fieldId === "responsibleDepartment"));
  assert.ok(agentFieldsFromEffectiveSchemaV010(schema, "READ")
    .some(x => x.fieldId === "responsiblePerson"));
});

test("MD-01: absent or unpublished dependency rejects model consumption", () => {
  assert.throws(() => compile([field()]), /FOUNDATION_OBJECT_REFERENCE_PROVIDER_REQUIRED/);
  assert.throws(() => compile([field()], {
    resolvePublishedReference() { return false; }
  }), /FOUNDATION_OBJECT_REFERENCE_NOT_PUBLISHED/);
});

test("MD-01: invalid source version/type/cardinality and mixed ENUM cannot be added", () => {
  for (const [override, failure] of [
    [{ expectedVersion: 0 }, /OBJECT_EXTENSION_REFERENCE_VERSION_INVALID/],
    [{ sourceKind: "HOST_PRINCIPAL" }, /OBJECT_EXTENSION_REFERENCE_SOURCE_KIND_INVALID/],
    [{ cardinality: "UNKNOWN" }, /OBJECT_EXTENSION_REFERENCE_CARDINALITY_INVALID/],
    [{ sourceId: "" }, /OBJECT_EXTENSION_REFERENCE_SOURCE_REQUIRED/]
  ]) {
    assert.throws(() => assertObjectExtensionDefinitionV010({
      ...field(), reference: { ...field().reference, ...override }
    }), failure);
  }
  assert.throws(() => assertObjectExtensionDefinitionV010({
    ...field(), valueType: "ENUM", enumOptions: [{
      value: "A", label: { default: "A" }
    }]
  }), /OBJECT_EXTENSION_REFERENCE_TYPE_MISMATCH/);
  assert.throws(() => assertObjectExtensionDefinitionV010({
    ...field(), reference: undefined
  }), /OBJECT_EXTENSION_REFERENCE_REQUIRED/);
  assert.throws(() => assertObjectExtensionDefinitionV010({
    ...field(), enumOptions: [{ value: "A", label: { default: "A" } }]
  }), /OBJECT_EXTENSION_REFERENCE_ENUM_OPTIONS_FORBIDDEN/);
});

test("MD-01: legacy upsert may NOT publish an unreviewed REFERENCE extension", () => {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const manager = createObjectExtensionRepositoryV010(resources);
  assert.throws(() => manager.save({
    contextId: "enterprise:a",
    definition: field(),
    actorSubjectId: "owner", recordedAt: "2026-10-30T00:00:00Z"
  }), /OBJECT_EXTENSION_REFERENCE_REQUIRES_MODEL_PUBLICATION/);
  assert.equal(manager.list("enterprise:a").length, 0);
});

test("MD-01: existing scalar and static ENUM extensions retain original behavior", () => {
  const scalar = { ...field(), valueType: "STRING", reference: undefined };
  const value = assertObjectExtensionDefinitionV010(scalar);
  assert.equal(value.valueType, "STRING");
  const schema = compile([scalar]);
  assert.equal(schema.fields.find(x => x.fieldId === "customerLevelRef").valueType, "STRING");
});
