import test from "node:test";
import assert from "node:assert/strict";

import { appHostShellHtml } from "../../dist/manager/app-host-shell.js";
import { enterpriseAgentExperienceAssets } from "../../dist/agents/enterprise-agent/package.js";

test("EVO App Host uses a Workbench with narrow Activity Bar, resizable Side Panel and mobile surface switching", () => {
  assert.match(appHostShellHtml, /data-eidos-app-host-layout="workbench"/);
  assert.match(appHostShellHtml, /--eidos-activity-width:48px/);
  assert.match(appHostShellHtml, /data-eidos-activity-bar/);
  assert.match(appHostShellHtml, /data-eidos-side-panel/);
  assert.match(appHostShellHtml, /data-eidos-workbench-splitter/);
  assert.match(appHostShellHtml, /data-eidos-workspace/);
  assert.match(appHostShellHtml, /data-eidos-status-bar/);
  assert.match(appHostShellHtml, /@media\(max-width:700px\)/);
  assert.match(appHostShellHtml, /data-mobile-surface="panel"/);
  assert.match(appHostShellHtml, /data-mobile-surface="workspace"/);
});

test("Personal Agent remains a zero-config Chat Experience inside the Workbench", () => {
  const page = enterpriseAgentExperienceAssets.get("app://enterprise-agent/pages/home");
  assert.equal(page.kind, "chat");
  assert.equal(page.contractVersion, "0.2.0");
  assert.equal(page.command.code, "enterprise-agent.chat");
  assert.equal(page.composer.key, "message");
  assert.equal(page.fields, undefined);
  assert.equal(page.actions, undefined);
  assert.equal(page.context.label, "Context");
  assert.equal(page.emptyState.suggestions.length, 3);
});


test("Personal Agent owns its Activity contribution instead of App Host owning Agent semantics", async () => {
  const { enterpriseAgentPackage } = await import("../../dist/agents/enterprise-agent/package.js");
  const activity = enterpriseAgentPackage.features[0].contributions.find(
    contribution => contribution.kind === "eidos.workbench-activity"
  );
  assert.ok(activity);
  assert.equal(activity.activity.id, "enterprise-agent");
  assert.equal(activity.activity.route, "/enterprise-agent");
  assert.equal(activity.activity.kind, "side-route");
  assert.equal(activity.activity.icon, "agent");
});


test("App Host client has no hard-coded Personal Agent route or Activity", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../../dist/manager/app-host-client.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\/enterprise-agent/);
  assert.doesNotMatch(source, /id:\s*["']agent["']/);
  assert.match(source, /\/v1\/workbench\/activities/);
});


test("enterprise-agent compatibility identifiers present the product as Personal Agent", async () => {
  const { enterpriseAgentPackage } = await import("../../dist/agents/enterprise-agent/package.js");
  assert.equal(enterpriseAgentPackage.packageId, "enterprise-agent");
  assert.equal(enterpriseAgentPackage.displayName, "Personal Agent");
  assert.ok(enterpriseAgentPackage.features[0].providesCapabilities.includes("agent.personal"));
  assert.ok(enterpriseAgentPackage.features[0].providesCapabilities.includes("agent.personal.tool-discovery"));
  assert.ok(enterpriseAgentPackage.features[0].providesCapabilities.includes("agent.enterprise"));
  const activity = enterpriseAgentPackage.features[0].contributions.find(
    contribution => contribution.kind === "eidos.workbench-activity"
  );
  assert.equal(activity.activity.title, "Personal Agent");
  const zh = enterpriseAgentPackage.features[0].contributions.find(
    contribution => contribution.kind === "eidos.localization-bundle"
      && contribution.bundle.locale === "zh-CN"
  );
  assert.equal(zh.bundle.messages["workbench.activity.label"], "个人 Agent");
});


test("Personal Agent package ships four first-class locale bundles", async () => {
  const { enterpriseAgentPackage } = await import("../../dist/agents/enterprise-agent/package.js");
  const locales = enterpriseAgentPackage.features[0].contributions
    .filter(contribution => contribution.kind === "eidos.localization-bundle")
    .map(contribution => contribution.bundle.locale)
    .sort();
  assert.deepEqual(locales, ["en", "ja", "zh-CN", "zh-TW"]);
});
