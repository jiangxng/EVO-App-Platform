import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryEnterpriseResourceRepositoryV010 } from "../../dist/providers/enterprise-context/resources.js";
import { hostEnterpriseContextProviderPackage } from "../../dist/providers/enterprise-context/package.js";
import { enterpriseContextGovernanceAppPackage } from "../../dist/apps/enterprise-context-governance/package.js";
import { businessDictionaryPackage } from "../../dist/catalog/seed.js";
import { createBusinessDictionaryRepositoryV010 } from "../../dist/apps/business-dictionary/repository.js";
import { createBusinessDictionaryActionHandlersV010 } from "../../dist/apps/business-dictionary/actions.js";
import {
  businessDictionaryDetailRouteV010, businessDictionaryOptionRouteV010,
  parseBusinessDictionaryRouteV010, createBusinessDictionaryDirectoryPageV010,
  createBusinessDictionaryDetailPageV010, createBusinessDictionaryOptionPageV010,
  createBusinessDictionaryContextRequiredPageV010
} from "../../dist/apps/business-dictionary/page.js";
import { validateUidl } from "../../dist/vendor/eidos/src/runtime/validate.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";

const contextId = "enterprise-context:dictionary-ui";
const command = {
  save: "dictionary.option.draft.save", publish: "dictionary.publish"
};
const request = (code, values) => ({
  contractVersion: "0.1.0", type: "command",
  command: { code, inputVersion: "0.1.0" }, values,
  actionId: code, sourceInteractionId: "dictionary-ui", requiresConfirmation: false
});
const context = (actorType = "HUMAN") => ({
  contractVersion: "0.1.0",
  principal: { contractVersion: "0.1.0", subjectId: "admin",
    actorType, identityProviderId: "test", sessionId: "session" },
  scope: { contractVersion: "0.1.0", enterpriseId: "enterprise" },
  context: { contractVersion: "0.1.0",
    personalContext: { contractVersion: "0.1.0", kind: "PERSONAL",
      contextId: "personal:admin", ownerSubjectId: "admin" },
    activeContext: { contractVersion: "0.1.0", kind: "ENTERPRISE",
      contextId, enterpriseId: "enterprise" } },
  correlationId: "dictionary-ui"
});

test("enterprise content library rename preserves package and resource identity", () => {
  assert.equal(enterpriseContextGovernanceAppPackage.packageId, "evo-enterprise-context-governance");
  assert.equal(enterpriseContextGovernanceAppPackage.displayNameTranslations["zh-CN"], "企业内容库");
  assert.equal(hostEnterpriseContextProviderPackage.displayNameTranslations["zh-CN"], "企业内容库服务");
  assert.ok(hostEnterpriseContextProviderPackage.features[0].providesCapabilities
    .includes("enterprise.resource.repository"));
});

test("business dictionary declares one discoverable Eidos management journey", () => {
  const contributions = businessDictionaryPackage.features[0].contributions;
  const experience = contributions.find(item => item.kind === "eidos.experience").manifest;
  assert.equal(experience.defaultRoute, "/business-dictionaries");
  assert.equal(experience.navigation.length, 1);
  assert.deepEqual(experience.routes.map(route => route.path), [
    "/business-dictionaries", "/business-dictionaries/view", "/business-dictionaries/option"
  ]);
  assert.ok(contributions.some(item => item.kind === "platform.capability-operation"
    && item.operation.operationId === command.save));
  assert.equal(businessDictionaryDetailRouteV010("sales.level"),
    "/business-dictionaries/view?dictionaryId=sales.level");
  assert.deepEqual(parseBusinessDictionaryRouteV010(
    businessDictionaryOptionRouteV010("sales.level", "A"), "option"),
    { dictionaryId: "sales.level", code: "A" });
  assert.equal(parseBusinessDictionaryRouteV010(
    "/business-dictionaries/view?dictionaryId=x&contextId=other", "detail"), undefined);
});

test("an already installed dictionary receives its new page from the current catalog", () => {
  const store = createMemoryLifecycleStore();
  store.saveInstalledPackage({ packageId: businessDictionaryPackage.packageId,
    version: "0.1.0", installedAt: "2026-10-30T00:00:00.000Z",
    trustApproved: true, grantedPermissions: [] });
  store.saveActiveFeature({ featureId: businessDictionaryPackage.features[0].featureId,
    packageId: businessDictionaryPackage.packageId, version: "0.1.0",
    activatedAt: "2026-10-30T00:00:00.000Z" });
  const manager = createAppManagerService(
    createPackageCatalog([businessDictionaryPackage, hostEnterpriseContextProviderPackage]), store);
  const experiences = manager.listEffectiveExperiences();
  assert.equal(experiences.length, 1);
  assert.equal(experiences[0].defaultRoute, "/business-dictionaries");
});

test("owner creates, edits and publishes dictionary through the page journey; member remains read-only", async () => {
  const repository = createBusinessDictionaryRepositoryV010(
    createMemoryEnterpriseResourceRepositoryV010());
  const handlers = createBusinessDictionaryActionHandlersV010({
    repository, canRead: () => true, canManage: () => true
  });
  const execute = (code, values, ctx = context()) =>
    handlers.find(handler => handler.commandCode === code).execute(request(code, values), ctx);
  const dictionaryId = "customer.level";
  const directory = createBusinessDictionaryDirectoryPageV010({
    dictionaries: [], canManage: true, locale: "zh-CN"
  });
  assert.equal(directory.actions[0].route, "/business-dictionaries/option");
  assert.equal(createBusinessDictionaryContextRequiredPageV010("zh-CN")
    .actions[0].route, "/enterprise-contexts");
  const createPage = createBusinessDictionaryOptionPageV010({ locale: "zh-CN" });
  assert.equal(validateUidl(createPage).ok, true);
  assert.equal(createPage.contextNavigation.items[0].route, directory.actions[0].route.replace(/\/option$/u, ""));

  const first = await execute(command.save, { dictionaryId, displayName: "客户等级",
    expectedVersion: 0, optionCode: "A", optionLabel: "重点客户",
    optionAliases: "重点，重要", optionStatus: "ACTIVE" });
  assert.equal(first.ok, true);
  assert.equal(first.result.navigateTo, businessDictionaryDetailRouteV010(dictionaryId));
  assert.equal(repository.get(contextId, dictionaryId).displayName, "客户等级");
  assert.equal(repository.get(contextId, dictionaryId).state, "DRAFT");
  const detail = createBusinessDictionaryDetailPageV010({
    dictionary: repository.get(contextId, dictionaryId), canManage: true, locale: "zh-CN"
  });
  assert.equal(detail.contextNavigation.items[0].route, "/business-dictionaries");
  assert.equal(detail.actions.find(action => action.id === "publish").values.expectedVersion, 1);
  assert.equal(detail.actions.find(action => action.id === "add-option").route,
    businessDictionaryOptionRouteV010(dictionaryId));
  const editPage = createBusinessDictionaryOptionPageV010({
    dictionary: repository.get(contextId, dictionaryId), code: "A", locale: "zh-CN"
  });
  assert.equal(validateUidl(editPage).ok, true);
  assert.ok(editPage.fields.find(field => field.key === "dictionaryId").hidden);
  assert.ok(editPage.fields.find(field => field.key === "optionCode").hidden);
  assert.equal(editPage.contextNavigation.items[1].route, detail.actions.find(action => action.id === "add-option")
    .route.replace(/\/option/u, "/view"));

  assert.equal((await execute(command.publish, { dictionaryId, expectedVersion: 1 })).ok, true);
  assert.equal(repository.getEffective(contextId, dictionaryId).version, 1);
  assert.equal((await execute(command.save, { dictionaryId, displayName: "客户等级",
    expectedVersion: 1, optionCode: "B", optionLabel: "普通客户",
    optionStatus: "ACTIVE" })).ok, true);
  assert.equal(repository.get(contextId, dictionaryId).version, 2);
  assert.equal(repository.getEffective(contextId, dictionaryId).version, 1,
    "new draft must not become effective before Human publication");
  const edited = await execute(command.save, { dictionaryId, displayName: "客户等级",
    expectedVersion: 2, originalCode: "A", optionCode: "A", optionLabel: "Key account",
    optionLabelZh: "重点客户", optionAliases: "重点，重要", optionStatus: "ACTIVE" });
  assert.equal(edited.ok, true);
  assert.equal(repository.get(contextId, dictionaryId).options[0].label.translations["zh-CN"],
    "重点客户", "editing default label must retain the localized name");
  const stale = await execute(command.save, { dictionaryId, displayName: "客户等级",
    expectedVersion: 1, optionCode: "C", optionLabel: "过期选择", optionStatus: "ACTIVE" });
  assert.equal(stale.error.code, "BUSINESS_DICTIONARY_VERSION_CONFLICT");
  const member = createBusinessDictionaryDetailPageV010({
    dictionary: repository.get(contextId, dictionaryId), canManage: false, locale: "zh-CN"
  });
  assert.deepEqual(member.actions, []);
  assert.ok(member.items.every(item => item.primaryAction === undefined));
  const denied = createBusinessDictionaryActionHandlersV010({ repository,
    canRead: () => true, canManage: () => false });
  assert.equal((await denied.find(handler => handler.commandCode === command.save)
    .execute(request(command.save, { dictionaryId, displayName: "客户等级", expectedVersion: 3,
      optionCode: "C", optionLabel: "非法", optionStatus: "ACTIVE" }), context())).error.code,
    "BUSINESS_DICTIONARY_PERMISSION_DENIED");
});
