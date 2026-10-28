import test from "node:test";
import assert from "node:assert/strict";
import {
  createEnterpriseContextDirectoryPageV010,
  createEnterpriseContextOverviewPageV010
} from "../../dist/apps/enterprise-context-governance/context-page.js";
import { renderCatalogBrowserToHtml } from "../../dist/vendor/eidos/src/catalog-browser/render.js";
import { enterpriseContextGovernanceAppPackage } from "../../dist/apps/enterprise-context-governance/package.js";

const context = {
  contractVersion: "0.1.0",
  contextId: "enterprise:ent-example",
  enterpriseId: "ent-example",
  displayName: "示例企业",
  lifecycleState: "ACTIVE",
  attributes: { code: "TEST" }
};
const activeContext = { contractVersion: "0.1.0", kind: "ENTERPRISE", contextId: context.contextId };

test("Human journey: directory → overview → directory always has visible Eidos parent navigation", () => {
  const directory = createEnterpriseContextDirectoryPageV010({
    contexts: [context],
    activeContext,
    defaultContextId: context.contextId,
    ownerContextIds: [context.contextId],
    createEligibility: { allowed: false, message: "请先切换到个人空间" },
    locale: "zh-CN"
  });
  assert.equal(directory.layout, "list");
  assert.equal(directory.items.length, 1);
  const entry = directory.items[0];
  assert.equal(entry.primaryAction.values.navigateTo, "/enterprise-contexts/overview");
  assert.equal(entry.primaryAction.command, "enterprise.context.select");
  assert.equal(entry.secondaryActions?.length ?? 0, 0, "low-frequency admin controls must not compete with Enter");
  assert.equal(directory.actions?.length, 1, "no duplicate create/eligibility cards");
  const listHtml = renderCatalogBrowserToHtml(directory);
  assert.doesNotMatch(listHtml, /ACTION|归档企业|\bACTIVE\b|Context ID/);
  const overview = createEnterpriseContextOverviewPageV010({
    context, currentRole: "OWNER", isDefault: true, locale: "zh-CN"
  });
  assert.equal(overview.layout, "list");
  const parent = overview.contextNavigation.items[0];
  assert.equal(parent.route, "/enterprise-contexts");
  assert.equal(overview.contextNavigation.items[1].label, context.displayName);
  const html = renderCatalogBrowserToHtml(overview);
  assert.match(html, /data-eidos-context-route="\/enterprise-contexts"/);
  assert.match(html, /data-eidos-mobile-context-parent/);
  assert.match(html, /企业信息/);
  assert.doesNotMatch(html, />Context ID|>Enterprise ID|薄容器|插件操作资源|>ACTIVE<|>OWNER</);
  assert.deepEqual(Object.keys(overview.items[0].metadata).sort(), ["企业代码", "我的身份", "默认企业"].sort());
  assert.equal(overview.items[1].secondaryActions[0].id, "archive");
  assert.equal(overview.items[1].secondaryActions[0].requiresConfirmation, true);
  assert.equal(overview.items[1].secondaryActions[0].values.targetContextId, context.contextId);
});

test("Human journey: viewer and default/non-default roles preserve authority and safe admin actions", () => {
  const ordinary = createEnterpriseContextOverviewPageV010({
    context, currentRole: "MEMBER", isDefault: true, locale: "zh-CN"
  });
  assert.equal(ordinary.items.length, 1);
  assert.doesNotMatch(renderCatalogBrowserToHtml(ordinary), /data-eidos-catalog-action="archive"/);
  const nonDefault = createEnterpriseContextOverviewPageV010({
    context, currentRole: "MEMBER", isDefault: false, locale: "zh-CN"
  });
  assert.equal(nonDefault.items[1].secondaryActions.length, 1);
  assert.equal(nonDefault.items[1].secondaryActions[0].command,
    "enterprise.context.default.set");
  const english = createEnterpriseContextOverviewPageV010({
    context, currentRole: "OWNER", isDefault: true, locale: "en"
  });
  assert.equal(english.contextNavigation.items[0].label, "My enterprises");
  assert.equal(english.contextNavigation.items[0].route, "/enterprise-contexts");
});

test("Human journey: every declared enterprise child route resolves to its declared Eidos Experience", () => {
  const contribution = enterpriseContextGovernanceAppPackage.features[0].contributions.find(
    x => x.kind === "eidos.experience"
  );
  assert.ok(contribution);
  const routes = contribution.manifest.routes;
  const overviewPaths = routes.filter(x => x.pageId === "evo-enterprise-context-governance.overview");
  assert.ok(overviewPaths.length >= 2, "legacy overview paths must be audited, not only the default route");
  assert.ok(routes.some(x => x.path === "/enterprise-contexts"
    && x.pageId === "evo-enterprise-context-governance.directory"));
  assert.ok(routes.some(x => x.path === "/enterprise-contexts/my-permissions"));
  assert.ok(routes.some(x => x.path === "/enterprise-contexts/new"));
  assert.ok(overviewPaths.some(x => x.path === "/enterprise-contexts/overview"));
  // All overview aliases share the same page source and therefore the same parent nav.
  const back = createEnterpriseContextOverviewPageV010({ context, locale: "zh-CN" });
  assert.equal(back.contextNavigation.items[0].route, "/enterprise-contexts");
});
