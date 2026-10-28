import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  checkEnterpriseCreateEligibilityV010,
  createEnterpriseCreateNotAllowedPageV010,
  createEnterpriseCreateEligibilityPageV010
} from "../../dist/manager/enterprise-create-eligibility.js";
import { createHostStaticAuthorizationProviderV010 } from "../../dist/providers/authorization/runtime.js";
import { createEnterpriseContextDirectoryPageV010 } from "../../dist/apps/enterprise-context-governance/context-page.js";
import { createEnterpriseContextSelectionActionHandlerV010 } from "../../dist/apps/enterprise-context-governance/context-actions.js";
import { renderCatalogBrowserToHtml } from "../../dist/vendor/eidos/src/catalog-browser/render.js";

const user = (subjectId = "user-a", actorType = "HUMAN") => ({
  contractVersion: "0.1.0",
  actorType, subjectId, identityProviderId: "test.individual"
});
const provider = (effect, subjectIds = ["user-a"]) =>
  createHostStaticAuthorizationProviderV010({
    contractVersion: "0.1.0",
    rules: [{ id: "create-rule", effect, subjectIds,
      actorTypes: ["HUMAN"], actions: ["enterprise.context.create"],
      resourceTypes: ["enterprise.context"] }]
  });
const check = (principal, p, extra = {}) =>
  checkEnterpriseCreateEligibilityV010({
    principal, provider: p, activeContextKind: "PERSONAL", locale: "zh-CN", ...extra
  });

test("M0: eligible, denied, unauthenticated and revoked states are distinct", async () => {
  const permitted = await check(user(), provider("ALLOW"));
  assert.equal(permitted.allowed, true);
  assert.equal(permitted.status, "ALLOWED");
  const denied = await check(user("user-b"), provider("ALLOW"));
  assert.equal(denied.allowed, false);
  assert.equal(denied.status, "DENIED");
  assert.match(denied.message, /联系平台管理员/);
  assert.doesNotMatch(denied.message, /STATIC_POLICY|host\.static-authorization/);
  const unauthenticated = await check(undefined, provider("ALLOW"));
  assert.equal(unauthenticated.status, "AUTH_REQUIRED");
  const revoked = await check(user(), provider("DENY"));
  assert.equal(revoked.status, "DENIED");
  assert.equal(revoked.allowed, false);
});

test("M0: human/personal/provider readiness fail closed and never throw raw details", async () => {
  assert.equal((await check(user("agent", "AI"), provider("ALLOW"))).status, "HUMAN_REQUIRED");
  assert.equal((await check(user(), provider("ALLOW"), { activeContextKind: "ENTERPRISE" })).status,
    "PERSONAL_CONTEXT_REQUIRED");
  assert.equal((await check(user(), undefined)).status, "UNAVAILABLE");
  assert.equal((await check(user(), { check: () => { throw Error("internal auth secret"); } })).status,
    "UNAVAILABLE");
});

test("M0: create eligibility stays separate from the platform permission admin page", async () => {
  const denied = await check(user(), provider("DENY"));
  const directory = createEnterpriseContextDirectoryPageV010({
    contexts: [], createEligibility: denied, locale: "zh-CN"
  });
  assert.deepEqual(directory.items, []);
  assert.equal(directory.actions.find(a => a.id === "create-enterprise"), undefined);
  assert.equal(directory.actions.find(a => a.id === "check-create-eligibility")?.route,
    "/enterprise-contexts/my-permissions");
  assert.match(directory.description, /联系平台管理员/);
  assert.doesNotMatch(renderCatalogBrowserToHtml(directory), />ACTION</);
  const deepLink = createEnterpriseCreateNotAllowedPageV010(denied, "zh-CN");
  assert.equal(deepLink.kind, "catalog-browser");
  assert.deepEqual(deepLink.items, []);
  assert.match(renderCatalogBrowserToHtml(deepLink), /联系平台管理员/);
  assert.equal(deepLink.actions[0].route, "/enterprise-contexts");
  const myPage = createEnterpriseCreateEligibilityPageV010(denied, "zh-CN");
  assert.equal(myPage.title, "创建企业资格");
  assert.match(myPage.description, /平台管理员/);
  assert.equal(myPage.actions[0].route, "/enterprise-contexts");
  assert.match(renderCatalogBrowserToHtml(myPage), /返回企业列表/);
  assert.equal(myPage.items[0].primaryAction, undefined);
  assert.equal(myPage.items[0].status.label, "未获授权");
  const allowed = await check(user(), provider("ALLOW"));
  const allowedPage = createEnterpriseCreateEligibilityPageV010(allowed, "zh-CN");
  assert.equal(allowedPage.items[0].primaryAction.route, "/enterprise-contexts/new");
  const allowedDirectory = createEnterpriseContextDirectoryPageV010({
    contexts: [], createEligibility: allowed, locale: "zh-CN"
  });
  assert.equal(allowedDirectory.actions.find(a => a.id === "create-enterprise")?.route,
    "/enterprise-contexts/new");
  assert.equal(allowedDirectory.items.length, 0, "actions are not represented as business records");
});

test("M0: enterprise-space requirement never impersonates an explicit permission denial", async () => {
  const inEnterprise = await check(user(), provider("ALLOW"), {activeContextKind: "ENTERPRISE"});
  assert.equal(inEnterprise.allowed, false);
  assert.equal(inEnterprise.status, "PERSONAL_CONTEXT_REQUIRED");
  const personalContextId = "personal:user-a";
  const page = createEnterpriseCreateEligibilityPageV010(inEnterprise, "zh-CN", personalContextId);
  assert.equal(page.items.length, 0, "context guidance is not a second fake permission record");
  assert.match(page.description, /不代表你没有权限/);
  assert.equal(page.actions[0].id, "switch-personal-and-create");
  assert.equal(page.actions[0].command, "enterprise.context.select");
  assert.equal(page.actions[0].values.targetContextId, personalContextId);
  assert.equal(page.actions[0].values.navigateTo, "/enterprise-contexts/new");
  assert.equal(page.actions[1].route, "/enterprise-contexts");

  const directory = createEnterpriseContextDirectoryPageV010({
    contexts: [], createEligibility: inEnterprise, personalContextId, locale: "zh-CN"
  });
  const create = directory.actions.find(action => action.id === "create-enterprise");
  assert.ok(create, "Create enterprise must remain visible in enterprise space");
  assert.equal(create.command, "enterprise.context.select");
  assert.equal(create.values.targetContextId, personalContextId);
  assert.equal(create.values.navigateTo, "/enterprise-contexts/new");
  assert.doesNotMatch(directory.description, /请先切换到个人空间/);
  assert.match(renderCatalogBrowserToHtml(directory), /创建新企业/);
  const deepLink = createEnterpriseCreateNotAllowedPageV010(inEnterprise, "zh-CN", personalContextId);
  assert.equal(deepLink.actions[0].values.targetContextId, personalContextId);
  assert.equal(deepLink.actions[1].route, "/enterprise-contexts");
});

test("M0: GET route uses request identity and same server provider as write; submit is not bypassed", () => {
  const server = readFileSync("manager/server.ts", "utf8");
  assert.match(server, /\/v1\/permissions\/me\/enterprise-create/);
  assert.match(server, /checkCreateEligibilityForRequest\(request, locale\)/);
  assert.match(server, /source === ENTERPRISE_CONTEXT_CREATE_PAGE_SOURCE/);
  const creation = readFileSync("manager/enterprise-context-creation.ts", "utf8");
  assert.match(creation, /authorizeMaterialWriteV010/);
  assert.match(creation, /ENTERPRISE_CONTEXT_CREATE_ACTION/);
});

test("M0: personal-space continuation validates principal scope and rechecks real create permission", async () => {
  const ownPersonal = {
    contractVersion: "0.1.0", kind: "PERSONAL", contextId: "personal:user-a"
  };
  const otherPersonal = {
    contractVersion: "0.1.0", kind: "PERSONAL", contextId: "personal:user-b"
  };
  const handler = createEnterpriseContextSelectionActionHandlerV010({
    listAvailableContexts(principal) {
      return principal.subjectId === "user-a" ? [ownPersonal] : [otherPersonal];
    }
  });
  const context = { principal: user() };
  const request = targetContextId => ({
    contractVersion: "0.1.0", type: "command",
    command: { code: "enterprise.context.select", inputVersion: "0.1.0" },
    values: { targetContextId, navigateTo: "/enterprise-contexts/new" },
    actionId: "switch-personal-and-create"
  });
  const selected = await handler.execute(request(ownPersonal.contextId), context);
  assert.equal(selected.ok, true);
  assert.equal(selected.result.selectedContextId, ownPersonal.contextId);
  assert.equal(selected.result.navigateTo, "/enterprise-contexts/new");
  const crossUser = await handler.execute(request(otherPersonal.contextId), context);
  assert.equal(crossUser.ok, false, "A must not select B's personal scope");
  assert.equal(crossUser.error.code, "ENTERPRISE_CONTEXT_NOT_AVAILABLE");

  const allow = await check(user(), provider("ALLOW"), { activeContextKind: "PERSONAL" });
  const deny = await check(user(), provider("DENY"), { activeContextKind: "PERSONAL" });
  assert.equal(allow.status, "ALLOWED");
  assert.equal(deny.status, "DENIED", "changing context must not grant create permission");
  const deniedDirectory = createEnterpriseContextDirectoryPageV010({
    contexts: [], createEligibility: deny, personalContextId: ownPersonal.contextId, locale: "zh-CN"
  });
  assert.equal(deniedDirectory.actions.some(x => x.id === "create-enterprise"), false);
});

test("M0: top switcher includes personal scope and never auto-forces an enterprise when personal is selected", () => {
  const code = readFileSync("manager/desktop-workbench-runtime.ts", "utf8");
  assert.match(code, /item\.ref\.kind === "PERSONAL"/);
  assert.match(code, /"👤 个人空间"/);
  assert.match(code, /option\.selected = item\.ref\.contextId === selectedContextId/);
  assert.match(code, /window\.localStorage\.setItem\("evo\.context\.id", selectedContextId\)/);
  assert.doesNotMatch(code, /loaded\.options\.filter\(\s*item => item\.ref\.kind === "ENTERPRISE"/);
});
