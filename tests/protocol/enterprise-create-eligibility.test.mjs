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

test("M0: directory shows status not a create action; deep link is guidance only", async () => {
  const denied = await check(user(), provider("DENY"));
  const directory = createEnterpriseContextDirectoryPageV010({
    contexts: [], createEligibility: denied, locale: "zh-CN"
  });
  const create = directory.items.find(x => x.id === "enterprise-context:create");
  assert.ok(create);
  assert.equal(create.primaryAction, undefined);
  assert.match(create.summary, /联系平台管理员/);
  assert.equal(directory.items.find(x => x.id === "enterprise-context:my-permissions")
    .primaryAction.route, "/enterprise-contexts/my-permissions");
  const deepLink = createEnterpriseCreateNotAllowedPageV010(denied, "zh-CN");
  assert.equal(deepLink.kind, "catalog-browser");
  assert.deepEqual(deepLink.items, []);
  assert.match(renderCatalogBrowserToHtml(deepLink), /联系平台管理员/);
  const myPage = createEnterpriseCreateEligibilityPageV010(denied, "zh-CN");
  assert.equal(myPage.items[0].primaryAction, undefined);
  const allowed = createEnterpriseCreateEligibilityPageV010(
    await check(user(), provider("ALLOW")), "zh-CN"
  );
  assert.equal(allowed.items[0].primaryAction.route, "/enterprise-contexts/new");
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
