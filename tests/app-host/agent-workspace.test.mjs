import test from "node:test";
import assert from "node:assert/strict";

import { appHostShellHtml } from "../../dist/manager/app-host-shell.js";
import { enterpriseAgentExperienceAssets } from "../../dist/agents/enterprise-agent/package.js";

test("EVO App Host uses a three-pane Agent Workspace with mobile pane switching", () => {
  assert.match(appHostShellHtml, /data-eidos-app-host-layout="agent-workspace"/);
  assert.match(appHostShellHtml, /data-eidos-workspace-pane="menu"/);
  assert.match(appHostShellHtml, /data-eidos-workspace-pane="chat"/);
  assert.match(appHostShellHtml, /data-eidos-workspace-pane="workspace"/);
  assert.match(appHostShellHtml, /data-eidos-mobile-tabs/);
  assert.match(appHostShellHtml, /@media\(max-width:760px\)/);
  assert.match(appHostShellHtml, /data-eidos-browser-frame/);
});

test("Enterprise Agent contributes a zero-config Chat Experience", () => {
  const page = enterpriseAgentExperienceAssets.get("app://enterprise-agent/pages/home");
  assert.equal(page.kind, "chat");
  assert.equal(page.command.code, "enterprise-agent.chat");
  assert.equal(page.composer.key, "message");
  assert.equal(page.fields, undefined);
  assert.equal(page.actions, undefined);
});
