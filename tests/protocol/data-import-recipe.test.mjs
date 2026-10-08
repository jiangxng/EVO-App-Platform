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
  createCounterpartyImportTargetV010
} from "../../dist/apps/counterparty/import-target.js";
import {
  createDataImportRepositoryV010
} from "../../dist/apps/data-import/repository.js";
import {
  createDataImportRecipeRepositoryV010,
  dataImportSourceFingerprintV010
} from "../../dist/apps/data-import/recipe.js";
import {
  createDataImportServiceV010
} from "../../dist/apps/data-import/service.js";

function fixture() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const roles = createCounterpartyRoleRepositoryV010(resources, counterparties);
  const extensions = createObjectExtensionRepositoryV010(resources);
  const values = createObjectExtensionValueRepositoryV010(resources);
  const target = createCounterpartyImportTargetV010({
    resources,
    repository: counterparties,
    roleRepository: roles,
    extensionRepository: extensions,
    extensionValueRepository: values
  });
  const repository = createDataImportRepositoryV010(resources);
  const recipes = createDataImportRecipeRepositoryV010(resources);
  const service = createDataImportServiceV010({
    repository,
    recipeRepository: recipes,
    targets: [target]
  });
  return {
    resources,
    counterparties,
    target,
    repository,
    recipes,
    service
  };
}

function source(name, companyType = "企业") {
  return {
    kind: "XLSX",
    name,
    headers: ["供应商编码", "供应商名称", "供应商类型", "联系人"],
    rows: [{
      供应商编码: "S001",
      供应商名称: "甲供应商",
      供应商类型: companyType,
      联系人: "张三"
    }]
  };
}

const mapping = [{
  sourceColumn: "供应商编码",
  targetFieldId: "code"
}, {
  sourceColumn: "供应商名称",
  targetFieldId: "displayName"
}, {
  sourceColumn: "供应商类型",
  targetFieldId: "subjectType",
  transform: {
    kind: "VALUE_MAP",
    entries: [{
      source: "企业",
      target: "ORGANIZATION"
    }, {
      source: "公司",
      target: "ORGANIZATION"
    }, {
      source: "个人",
      target: "PERSON"
    }]
  }
}];

test("only a confirmed committed import becomes an auto-reusable enterprise Import Recipe", () => {
  const { target, recipes, service } = fixture();
  const inputSource = source("supplier-first.xlsx");
  const schema = target.describe({
    contextId: "enterprise-context:a",
    parameters: { relationshipMode: "SUPPLIER" }
  });

  service.stage({
    contextId: "enterprise-context:a",
    importJobId: "import-first",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: inputSource,
    mapping,
    mappingOrigin: "HUMAN",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T08:00:00.000Z"
  });
  const ready = service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: "import-first",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T08:01:00.000Z"
  });

  assert.equal(ready.state, "DRY_RUN_READY");
  assert.equal(
    ready.dryRun.rows[0].prepared.values.subjectType,
    "ORGANIZATION"
  );
  assert.equal(ready.appliedRecipeId, undefined);
  assert.equal(recipes.findBySource({
    contextId: "enterprise-context:a",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: inputSource
  }), undefined);

  const committed = service.commit({
    contextId: "enterprise-context:a",
    importJobId: "import-first",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T08:02:00.000Z"
  });
  assert.equal(committed.state, "COMMITTED");
  assert.ok(committed.appliedRecipeId);

  const saved = recipes.findBySource({
    contextId: "enterprise-context:a",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: inputSource
  });
  assert.ok(saved);
  assert.equal(saved.recipeId, committed.appliedRecipeId);
  assert.deepEqual(saved.mapping, mapping);
  assert.equal(saved.lastSuccessfulImportJobId, "import-first");
  assert.equal(saved.confirmedAt, "2026-10-07T08:02:00.000Z");

  const initial = service.resolveInitialMapping({
    contextId: "enterprise-context:a",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: source("completely-different-file-name.xlsx"),
    schema
  });
  assert.equal(initial.origin, "RECIPE");
  assert.equal(initial.recipeId, saved.recipeId);
  assert.deepEqual(initial.mapping, mapping);
});

test("CP-03D schema drift does not silently reuse a stale Import Recipe", () => {
  const { target, service } = fixture();
  const inputSource = source("supplier-schema-first.xlsx");
  const schema = target.describe({
    contextId: "enterprise-context:a",
    parameters: { relationshipMode: "SUPPLIER" }
  });

  service.stage({
    contextId: "enterprise-context:a",
    importJobId: "import-schema-first",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: inputSource,
    mapping,
    mappingOrigin: "HUMAN",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-08T00:10:00.000Z"
  });
  service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: "import-schema-first",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-08T00:11:00.000Z"
  });
  service.commit({
    contextId: "enterprise-context:a",
    importJobId: "import-schema-first",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-08T00:12:00.000Z"
  });

  const reused = service.resolveInitialMapping({
    contextId: "enterprise-context:a",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: source("same-structure-before-drift.xlsx"),
    schema
  });
  assert.equal(reused.origin, "RECIPE");

  const changedSchema = {
    ...schema,
    baseSchemaRef: schema.baseSchemaRef + "#changed"
  };
  const fallback = service.resolveInitialMapping({
    contextId: "enterprise-context:a",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: source("same-structure-after-drift.xlsx"),
    schema: changedSchema
  });
  assert.equal(fallback.origin, "DETERMINISTIC");
  assert.equal(fallback.recipeId, undefined);
});

test("Import Recipe fingerprint ignores filename and column order but remains enterprise and purpose scoped", () => {
  const a = dataImportSourceFingerprintV010({
    targetId: "counterparty.subject",
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: {
      headers: ["供应商编码", "供应商名称", "供应商类型"]
    }
  });
  const b = dataImportSourceFingerprintV010({
    targetId: "counterparty.subject",
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: {
      headers: ["供应商类型", "供应商名称", "供应商编码"]
    }
  });
  const customer = dataImportSourceFingerprintV010({
    targetId: "counterparty.subject",
    targetParameters: { relationshipMode: "CUSTOMER" },
    source: {
      headers: ["供应商编码", "供应商名称", "供应商类型"]
    }
  });
  assert.equal(a, b);
  assert.notEqual(a, customer);

  const { target, recipes, service } = fixture();
  service.stage({
    contextId: "enterprise-context:a",
    importJobId: "import-a",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: source("one.xlsx"),
    mapping,
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T08:00:00.000Z"
  });
  service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: "import-a",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T08:01:00.000Z"
  });
  assert.equal(recipes.findBySource({
    contextId: "enterprise-context:a",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: source("two.xlsx")
  }), undefined);
  service.commit({
    contextId: "enterprise-context:a",
    importJobId: "import-a",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T08:02:00.000Z"
  });

  assert.ok(recipes.findBySource({
    contextId: "enterprise-context:a",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: source("two.xlsx")
  }));
  assert.equal(recipes.findBySource({
    contextId: "enterprise-context:b",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: source("two.xlsx")
  }), undefined);
});

test("mapping inspection exposes bounded samples and preserves unmapped raw columns", () => {
  const { target, service } = fixture();
  service.stage({
    contextId: "enterprise-context:a",
    importJobId: "import-inspect",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: source("inspect.xlsx"),
    mapping,
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T08:00:00.000Z"
  });

  const inspected = service.inspectMapping({
    contextId: "enterprise-context:a",
    importJobId: "import-inspect",
    locale: "zh-CN"
  });

  assert.equal(inspected.rawSourcePreserved, true);
  assert.deepEqual(inspected.unmappedColumns, ["联系人"]);
  const subjectTypeField = inspected.schema.fields.find(
    field => field.fieldId === "subjectType"
  );
  assert.match(subjectTypeField.resolvedDescription, /不是客户\/供应商分类/);
  const type = inspected.sourceColumns.find(
    item => item.sourceColumn === "供应商类型"
  );
  assert.deepEqual(type.sampleValues, ["企业"]);
  assert.equal(type.mappedTargetFieldId, "subjectType");
  assert.equal(type.transform.kind, "VALUE_MAP");

  const contact = inspected.sourceColumns.find(
    item => item.sourceColumn === "联系人"
  );
  assert.deepEqual(contact.sampleValues, ["张三"]);
  assert.equal(contact.mappedTargetFieldId, undefined);
});

test("Data Import CONSTANT mapping represents a batch-wide target fact without abusing a source column", () => {
  const { target, service } = fixture();
  service.stage({
    contextId: "enterprise-context:a",
    importJobId: "import-constant-subject-type",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: source("constant.xlsx", "设备"),
    mapping: [{
      sourceColumn: "供应商编码",
      targetFieldId: "code"
    }, {
      sourceColumn: "供应商名称",
      targetFieldId: "displayName"
    }, {
      targetFieldId: "subjectType",
      transform: {
        kind: "CONSTANT",
        value: "ORGANIZATION"
      }
    }],
    mappingOrigin: "AGENT",
    actorSubjectId: "agent-a",
    recordedAt: "2026-10-07T08:05:00.000Z"
  });

  const ready = service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: "import-constant-subject-type",
    actorSubjectId: "agent-a",
    recordedAt: "2026-10-07T08:06:00.000Z"
  });
  assert.equal(ready.state, "DRY_RUN_READY");
  assert.equal(
    ready.dryRun.rows[0].prepared.values.subjectType,
    "ORGANIZATION"
  );

  const inspected = service.inspectMapping({
    contextId: "enterprise-context:a",
    importJobId: "import-constant-subject-type",
    locale: "zh-CN"
  });
  assert.deepEqual(inspected.constantMappings, [{
    targetFieldId: "subjectType",
    transform: {
      kind: "CONSTANT",
      value: "ORGANIZATION"
    }
  }]);
  assert.ok(inspected.unmappedColumns.includes("供应商类型"));
});

test("Agent enum VALUE_MAP accepts governed aliases and blocks unrelated semantic coercion", () => {
  const { target, service } = fixture();
  service.stage({
    contextId: "enterprise-context:a",
    importJobId: "import-agent-semantic-guard",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: source("semantic-guard.xlsx", "设备"),
    mapping: [],
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T08:10:00.000Z"
  });

  assert.doesNotThrow(() => service.updateMapping({
    contextId: "enterprise-context:a",
    importJobId: "import-agent-semantic-guard",
    mapping: [{
      sourceColumn: "供应商类型",
      targetFieldId: "subjectType",
      transform: {
        kind: "VALUE_MAP",
        entries: [{
          source: "企业",
          target: "ORGANIZATION"
        }, {
          source: "个人",
          target: "PERSON"
        }]
      }
    }],
    mappingOrigin: "AGENT",
    actorSubjectId: "agent-a",
    recordedAt: "2026-10-07T08:11:00.000Z"
  }));

  assert.throws(() => service.updateMapping({
    contextId: "enterprise-context:a",
    importJobId: "import-agent-semantic-guard",
    mapping: [{
      sourceColumn: "供应商类型",
      targetFieldId: "subjectType",
      transform: {
        kind: "VALUE_MAP",
        entries: [{
          source: "设备",
          target: "ORGANIZATION"
        }, {
          source: "物流",
          target: "ORGANIZATION"
        }]
      }
    }],
    mappingOrigin: "AGENT",
    actorSubjectId: "agent-a",
    recordedAt: "2026-10-07T08:12:00.000Z"
  }), /DATA_IMPORT_AGENT_ENUM_VALUE_MAP_REQUIRES_HUMAN_REVIEW/);

  const inspected = service.inspectMapping({
    contextId: "enterprise-context:a",
    importJobId: "import-agent-semantic-guard",
    locale: "zh-CN"
  });
  assert.equal(
    inspected.sourceColumns.find(
      item => item.sourceColumn === "供应商类型"
    )?.transform?.entries[0]?.source,
    "企业"
  );
});

test("unknown source enum values remain visible to validation instead of being silently coerced", () => {
  const { target, service } = fixture();
  service.stage({
    contextId: "enterprise-context:a",
    importJobId: "import-unknown-enum",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: source("unknown.xlsx", "事业单位"),
    mapping,
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T08:00:00.000Z"
  });
  const failed = service.dryRun({
    contextId: "enterprise-context:a",
    importJobId: "import-unknown-enum",
    actorSubjectId: "owner-a",
    recordedAt: "2026-10-07T08:01:00.000Z"
  });
  assert.equal(failed.state, "DRY_RUN_FAILED");
  assert.equal(failed.dryRun.invalidRows, 1);
  assert.ok(
    failed.dryRun.rows[0].issues.some(
      issue => issue.code === "DATA_IMPORT_VALUE_ENUM_INVALID"
    )
  );
});
