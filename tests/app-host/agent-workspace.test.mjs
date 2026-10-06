import test from "node:test";
import assert from "node:assert/strict";

import {
  appHostShellCss,
  appHostShellHtml
} from "../../dist/manager/app-host-shell.js";
import { enterpriseAgentExperienceAssets } from "../../dist/agents/enterprise-agent/package.js";

test("EVO bootstrap stays minimal while the lazy desktop runtime owns Workbench semantics", async () => {
  assert.match(
    appHostShellHtml,
    /href="\/assets\/dev\/manager\/app-host-shell\.css"/
  );
  assert.match(
    appHostShellHtml,
    /src="\/assets\/dev\/manager\/app-host-client\.js"/
  );
  assert.doesNotMatch(appHostShellHtml, /data-eidos-app-host-layout="workbench"/);

  assert.match(appHostShellCss, /--eidos-activity-width:56px/);
  assert.match(appHostShellCss, /data-eidos-activity-bar/);
  assert.match(appHostShellCss, /data-eidos-side-panel/);
  assert.match(appHostShellCss, /data-eidos-workbench-splitter/);
  assert.match(appHostShellCss, /data-eidos-workspace/);
  assert.match(appHostShellCss, /data-eidos-status-bar/);

  const { readFile } = await import("node:fs/promises");
  const desktop = await readFile(
    new URL("../../dist/manager/desktop-workbench-runtime.js", import.meta.url),
    "utf8"
  );
  assert.match(desktop, /mountAgentWorkspaceShell|mountWorkbench/i);
});

test("Personal Agent remains a zero-config Chat Experience inside the Workbench", () => {
  const page = enterpriseAgentExperienceAssets.get("app://enterprise-agent/pages/home");
  assert.equal(page.kind, "chat");
  assert.equal(page.command.code, "enterprise-agent.chat");
  assert.equal(page.composer.key, "message");
  assert.equal(page.fields, undefined);
  assert.equal(page.actions, undefined);
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


test("minimal App Host client stays product-neutral and Workbench activity discovery stays desktop-scoped", async () => {
  const { readFile } = await import("node:fs/promises");
  const bootstrap = await readFile(
    new URL("../../dist/manager/app-host-client.js", import.meta.url),
    "utf8"
  );
  const desktop = await readFile(
    new URL("../../dist/manager/desktop-workbench-runtime.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(bootstrap, /\/enterprise-agent/);
  assert.doesNotMatch(bootstrap, /id:\s*["']agent["']/);
  assert.doesNotMatch(bootstrap, /\/v1\/workbench\/activities/);
  assert.match(desktop, /\/v1\/workbench\/activities/);
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
  assert.equal(zh.bundle.messages["workbench.activity.label"], "个人代理");
  const ja = enterpriseAgentPackage.features[0].contributions.find(
    contribution => contribution.kind === "eidos.localization-bundle"
      && contribution.bundle.locale === "ja"
  );
  const zhTw = enterpriseAgentPackage.features[0].contributions.find(
    contribution => contribution.kind === "eidos.localization-bundle"
      && contribution.bundle.locale === "zh-TW"
  );
  assert.equal(ja.bundle.messages["workbench.activity.label"], "パーソナルエージェント");
  assert.equal(zhTw.bundle.messages["workbench.activity.label"], "個人代理");
});

test("Personal Agent declares a separate Setup Flow route without changing compatibility ids", async () => {
  const {
    enterpriseAgentPackage,
    ENTERPRISE_AGENT_SETUP_PAGE_SOURCE
  } = await import("../../dist/agents/enterprise-agent/package.js");
  const experience = enterpriseAgentPackage.features[0].contributions.find(
    contribution => contribution.kind === "eidos.experience"
  );
  const setupPage = experience.manifest.pages.find(page => page.id === "enterprise-agent.setup");
  const setupRoute = experience.manifest.routes.find(route => route.id === "enterprise-agent.setup");
  assert.equal(setupPage.source, ENTERPRISE_AGENT_SETUP_PAGE_SOURCE);
  assert.equal(setupRoute.path, "/enterprise-agent/setup");
  assert.equal(enterpriseAgentPackage.packageId, "enterprise-agent");
});
