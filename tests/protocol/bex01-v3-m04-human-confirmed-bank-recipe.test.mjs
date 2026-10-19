import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { createCounterpartyRepositoryV010 } from "../../dist/apps/counterparty/repository.js";
import { createCounterpartyRoleRepositoryV010 } from "../../dist/apps/counterparty/roles.js";
import { createObjectExtensionRepositoryV010 } from "../../dist/apps/object-extension/repository.js";
import { createObjectExtensionValueRepositoryV010 } from "../../dist/apps/object-extension/values.js";
import { createCounterpartyImportTargetV010 } from "../../dist/apps/counterparty/import-target.js";
import { createDataImportRepositoryV010 } from "../../dist/apps/data-import/repository.js";
import { createDataImportRecipeRepositoryV010 } from "../../dist/apps/data-import/recipe.js";
import { createDataImportServiceV010 } from "../../dist/apps/data-import/service.js";
import { createDataImportActionHandlersV010 } from "../../dist/apps/data-import/actions.js";
import { DATA_IMPORT_STAGE_FILE_COMMAND_V010 } from "../../dist/apps/data-import/constants.js";

const contextId = "enterprise-context:m04-human-confirmed-bank-recipe";
const params = { relationshipMode: "SUPPLIER" };
const originalMapping = [
  { sourceColumn: "往来编码", targetFieldId: "code" },
  { sourceColumn: "往来名称", targetFieldId: "displayName" },
  { sourceColumn: "主体类型", targetFieldId: "subjectType" },
  { sourceColumn: "开户银行", targetFieldId: "test.bank.settlement" }
];

function fixture() {
  const resources = createMemoryEnterpriseResourceRepositoryV010();
  const counterparties = createCounterpartyRepositoryV010(resources);
  const roles = createCounterpartyRoleRepositoryV010(resources, counterparties);
  const extensions = createObjectExtensionRepositoryV010(resources);
  const extensionValues = createObjectExtensionValueRepositoryV010(resources);

  for (const [index, fieldId, description] of [
    [0, "test.bank.receiving", "客户回款用途"],
    [1, "test.bank.settlement", "供应商付款用途"]
  ]) {
    extensions.save({
      contextId, actorSubjectId: "owner",
      recordedAt: "2026-10-19T00:00:00.000Z",
      definition: {
        contractVersion: "0.1.0", extensionId: "test.m04.recipe." + index,
        targetObjectType: "counterparty.subject",
        targetSlot: "counterparty.supplier-profile",
        namespace: "enterprise.counterparty",
        fieldId, semanticType: "test.m04.recipe.bank." + index,
        valueType: "STRING", label: { default: "开户银行" },
        description: { default: description },
        required: false, order: 801 + index,
        applicability: { relationshipRoles: ["SUPPLIER"] },
        surfaces: ["DETAIL", "EDIT", "IMPORT"],
        importable: true, exportable: false
      }
    });
  }
  const target = createCounterpartyImportTargetV010({
    resources, repository: counterparties, roleRepository: roles,
    extensionRepository: extensions, extensionValueRepository: extensionValues
  });
  const repository = createDataImportRepositoryV010(resources);
  const recipes = createDataImportRecipeRepositoryV010(resources);
  const service = createDataImportServiceV010({
    repository, recipeRepository: recipes, targets: [target]
  });
  return { target, repository, recipes, service, counterparties, extensions };
}
function rowsSource(name, code, bank) {
  return {
    kind: "ROWS", name, headers: ["往来编码", "往来名称", "主体类型", "开户银行"],
    rows: [{
      往来编码: code, 往来名称: "Synthetic Supplier " + code,
      主体类型: "ORGANIZATION", 开户银行: bank
    }]
  };
}
function actor() {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0", subjectId: "owner",
      actorType: "HUMAN", identityProviderId: "test", sessionId: "test"
    },
    scope: { contractVersion: "0.1.0", enterpriseId: "test-enterprise" },
    context: {
      contractVersion: "0.1.0",
      activeContext: {
        contractVersion: "0.1.0", kind: "ENTERPRISE", contextId,
        enterpriseId: "test-enterprise"
      }
    },
    correlationId: "m04-confirmed-bank-recipe"
  };
}

test("M04: explicit Human bank ID decision survives validated Recipe reuse; no EC or supplier commit", async () => {
  const { target, repository, recipes, service, counterparties, extensions } = fixture();
  const original = rowsSource("synthetic-first.xlsx", "SUP-M04-001", "Synthetic Bank First");
  const schema = target.describe({ contextId, parameters: params, locale: "zh-CN" });
  assert.deepEqual(
    schema.fields.filter(x => x.resolvedLabel === "开户银行")
      .map(x => x.fieldId).sort(),
    ["test.bank.receiving", "test.bank.settlement"].sort()
  );
  assert.equal(
    service.suggestMapping({ schema, source: original })
      .some(x => x.sourceColumn === "开户银行"), false,
    "before Human decision neither same-label target may be inferred"
  );

  service.stage({
    contextId, importJobId: "m04-confirmed-first",
    targetId: target.targetId, targetParameters: params,
    source: original, mapping: originalMapping,
    mappingOrigin: "HUMAN", actorSubjectId: "owner",
    recordedAt: "2026-10-19T00:01:00.000Z"
  });
  const approved = service.dryRun({
    contextId, importJobId: "m04-confirmed-first",
    actorSubjectId: "owner", recordedAt: "2026-10-19T00:02:00.000Z"
  });
  assert.equal(approved.state, "DRY_RUN_READY", JSON.stringify(approved.dryRun?.rows));
  assert.equal(approved.dryRun.invalidRows, 0);
  assert.equal(approved.receipt, undefined);
  assert.equal(counterparties.list(contextId).length, 0);

  const recipe = recipes.findBySource({
    contextId, targetId: target.targetId, targetParameters: params, source: original
  });
  assert.ok(recipe, "successful Human-approved dry-run must persist a Recipe");
  assert.deepEqual(recipe.mapping, originalMapping);
  assert.equal(recipe.lastValidatedImportJobId, approved.importJobId);
  assert.equal(recipe.lastSuccessfulImportJobId, undefined,
    "no supplier commit has occurred merely by validating or saving Recipe");

  const second = rowsSource("synthetic-second.xlsx", "SUP-M04-002", "Synthetic Bank Second");
  const resolution = service.resolveInitialMapping({
    contextId, targetId: target.targetId, targetParameters: params,
    source: second, schema
  });
  assert.equal(resolution.origin, "RECIPE");
  assert.equal(resolution.recipeId, recipe.recipeId);
  assert.deepEqual(resolution.mapping, originalMapping,
    "the real Human-confirmed fieldId is remembered without guessing by label");

  let ecCalls = 0;
  const handlers = createDataImportActionHandlersV010({
    service, repository, targets: [target],
    canManageEnterpriseContext: () => true,
    experienceAdvisor: {
      recommend: async () => { ecCalls++; throw Error("EC_MUST_NOT_OVERRIDE_VALID_RECIPE"); },
      recordSuccessful: async () => { throw Error("STAGE_MUST_NOT_LEARN"); }
    },
    idFactory: () => "m04-confirmed-second",
    now: () => new Date("2026-10-19T00:03:00.000Z")
  });
  const stageFile = handlers.find(x =>
    x.commandCode === DATA_IMPORT_STAGE_FILE_COMMAND_V010
  );
  assert.ok(stageFile);
  const headers = second.headers;
  const record = second.rows[0];
  const csv = [headers.join(","), headers.map(h => record[h]).join(",")].join("\n");
  const response = await stageFile.execute({
    contractVersion: "0.1.0", type: "command",
    command: { code: DATA_IMPORT_STAGE_FILE_COMMAND_V010, inputVersion: "0.1.0" },
    actionId: "stage", sourceInteractionId: "m04-recipe-test",
    requiresConfirmation: false,
    values: {
      targetId: "counterparty.subject", parameter__relationshipMode: "SUPPLIER",
      file: {
        name: "synthetic-second.csv", mediaType: "text/csv",
        size: Buffer.byteLength(csv),
        contentBase64: Buffer.from(csv).toString("base64")
      }
    }
  }, actor());
  assert.equal(response.ok, true, JSON.stringify(response));
  const staged = repository.get(contextId, "m04-confirmed-second");
  assert.equal(staged.mappingOrigin, "RECIPE");
  assert.equal(staged.appliedRecipeId, recipe.recipeId);
  assert.deepEqual(staged.mapping, originalMapping);
  assert.equal(ecCalls, 0, "confirmed Recipe must bypass EC recommendations");
  assert.equal(staged.state, "DRY_RUN_READY");
  assert.equal(staged.dryRun.validRows, 1);
  assert.equal(staged.receipt, undefined);
  assert.equal(counterparties.list(contextId).length, 0);
  assert.equal(extensions.list(contextId, "counterparty.subject").length, 2,
    "reimport must never duplicate or create same-name schema fields");
});
