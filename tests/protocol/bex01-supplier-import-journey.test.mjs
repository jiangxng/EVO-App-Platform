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
  createCounterpartyProjectionPageV010
} from "../../dist/apps/counterparty/page.js";
import {
  COUNTERPARTY_SUPPLIERS_ROUTE
} from "../../dist/apps/counterparty/constants.js";
import {
  COUNTERPARTY_SUPPLIER_PROJECTION_V010
} from "../../dist/apps/counterparty/projections.js";
import {
  dataImportUploadRouteV010,
  parseDataImportUploadIntentV010,
  parseDataImportUploadRouteV010
} from "../../dist/apps/data-import/constants.js";
import {
  createDataImportUploadPageV010,
  createDataImportReviewPageV010
} from "../../dist/apps/data-import/page.js";
import {
  createDataImportRepositoryV010
} from "../../dist/apps/data-import/repository.js";
import {
  createDataImportRecipeRepositoryV010
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
    resources, repository: counterparties, roleRepository: roles,
    extensionRepository: extensions, extensionValueRepository: values
  });
  const repository = createDataImportRepositoryV010(resources);
  const recipes = createDataImportRecipeRepositoryV010(resources);
  const service = createDataImportServiceV010({
    repository, recipeRepository: recipes, targets: [target]
  });
  return { counterparties, roles, target, service };
}

const ctx = "enterprise-context:bex-a";
const supplierInput = {
  kind: "CSV",
  name: "bex-suppliers-a.csv",
  headers: ["供应商编码", "供应商名称", "主体类型"],
  rows: [{
    供应商编码: "00012",
    供应商名称: "供应商一",
    主体类型: "ORGANIZATION"
  }]
};
const mapping = [{
  sourceColumn: "供应商编码", targetFieldId: "code"
}, {
  sourceColumn: "供应商名称", targetFieldId: "displayName"
}, {
  sourceColumn: "主体类型", targetFieldId: "subjectType"
}];

test("BEX-01 supplier view retains authorized import action and the canonical target", () => {
  const route = dataImportUploadRouteV010("counterparty.subject", {
    relationshipMode: "SUPPLIER"
  });
  const page = createCounterpartyProjectionPageV010({
    projectionId: COUNTERPARTY_SUPPLIER_PROJECTION_V010,
    counterparties: [],
    canManage: true,
    importRoute: route,
    locale: "zh-CN"
  });
  assert.equal(page.actions.find(a => a.id === "import")?.route, route);
  const denied = createCounterpartyProjectionPageV010({
    projectionId: COUNTERPARTY_SUPPLIER_PROJECTION_V010,
    counterparties: [],
    canManage: false,
    importRoute: route
  });
  assert.equal(denied.actions.some(a => a.id === "import"), false);
  assert.deepEqual(parseDataImportUploadIntentV010(route), {
    targetId: "counterparty.subject",
    initialParameters: { relationshipMode: "SUPPLIER" }
  });
  assert.equal(parseDataImportUploadRouteV010(route), "counterparty.subject");
  assert.equal(parseDataImportUploadRouteV010(
    dataImportUploadRouteV010("counterparty.subject")), "counterparty.subject");
  assert.equal(parseDataImportUploadIntentV010(
    route + "&redirect=https://evil.example"), undefined);
  assert.equal(parseDataImportUploadIntentV010(
    route + "&parameter__relationshipMode=CUSTOMER"), undefined);
  assert.equal(parseDataImportUploadIntentV010(
    "https://evil.example/data-import/new/counterparty.subject"), undefined);
});

test("BEX-01 import upload prefills only target-recognized role values", () => {
  const { target } = fixture();
  const supplier = createDataImportUploadPageV010({
    target, locale: "zh-CN",
    initialParameters: { relationshipMode: "SUPPLIER" }
  });
  assert.equal(supplier.fields.find(x => x.key === "parameter__relationshipMode")?.initialValue,
    "SUPPLIER");
  const invalid = createDataImportUploadPageV010({
    target, initialParameters: { relationshipMode: "ADMIN" }
  });
  assert.equal(invalid.fields.find(x => x.key === "parameter__relationshipMode")?.initialValue,
    "NONE");
});

test("BEX-01 confirmed supplier import returns to supplier view and reuses Recipe", () => {
  const { target, roles, counterparties, service } = fixture();
  const schema = target.describe({
    contextId: ctx, parameters: { relationshipMode: "SUPPLIER" }
  });
  const initial = service.resolveInitialMapping({
    contextId: ctx,
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: supplierInput,
    schema
  });
  assert.equal(initial.origin, "DETERMINISTIC");

  service.stage({
    contextId: ctx,
    importJobId: "bex-first",
    targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: supplierInput,
    mapping,
    mappingOrigin: "HUMAN",
    actorSubjectId: "bex-operator",
    recordedAt: "2026-10-12T00:00:00.000Z"
  });
  const ready = service.dryRun({
    contextId: ctx,
    importJobId: "bex-first",
    actorSubjectId: "bex-operator",
    recordedAt: "2026-10-12T00:01:00.000Z"
  });
  assert.equal(ready.state, "DRY_RUN_READY");
  assert.equal(createDataImportReviewPageV010({job: ready,target})
    .actions.some(x => x.id === "return-to-target"), false);

  const committed = service.commit({
    contextId: ctx,
    importJobId: "bex-first",
    actorSubjectId: "bex-operator",
    recordedAt: "2026-10-12T00:02:00.000Z"
  });
  assert.equal(committed.state, "COMMITTED");
  const linked = roles.list(ctx).find(r => r.roleCode === "SUPPLIER");
  assert.ok(linked);
  assert.equal(counterparties.list(ctx).some(x =>
    x.counterpartyId === linked.counterpartyId && x.code === "00012"), true);
  const review = createDataImportReviewPageV010({
    job: committed, target, locale: "zh-CN"
  });
  assert.equal(review.actions.find(x => x.id === "return-to-target")?.route,
    COUNTERPARTY_SUPPLIERS_ROUTE);

  const second = service.resolveInitialMapping({
    contextId: ctx, targetId: target.targetId,
    targetParameters: { relationshipMode: "SUPPLIER" },
    source: { ...supplierInput, name: "bex-suppliers-b.csv" },
    schema
  });
  assert.equal(second.origin, "RECIPE");
  assert.deepEqual(second.mapping, mapping);
  const unrelated = service.resolveInitialMapping({
    contextId: ctx, targetId: target.targetId,
    targetParameters: { relationshipMode: "CUSTOMER" },
    source: { ...supplierInput, name: "customer.csv" },
    schema: target.describe({contextId:ctx,parameters:{relationshipMode:"CUSTOMER"}})
  });
  assert.notEqual(unrelated.origin, "RECIPE");
});
