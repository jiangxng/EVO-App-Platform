import test from "node:test";
import assert from "node:assert/strict";

import { appHostShellHtml } from "../../dist/manager/app-host-shell.js";
import { enterpriseAgentExperienceAssets } from "../../dist/agents/enterprise-agent/package.js";

test("EVO App Host uses a Workbench with narrow Activity Bar, resizable Side Panel and mobile surface switching", () => {
  assert.match(appHostShellHtml, /data-eidos-app-host-layout="workbench"/);
  assert.match(appHostShellHtml, /--activity-width:50px/);
  assert.match(appHostShellHtml, /data-eidos-activity-bar/);
  assert.match(appHostShellHtml, /data-eidos-side-panel/);
  assert.match(appHostShellHtml, /data-eidos-workbench-splitter/);
  assert.match(appHostShellHtml, /data-eidos-workspace/);
  assert.match(appHostShellHtml, /data-eidos-status-bar/);
  assert.match(appHostShellHtml, /@media\(max-width:700px\)/);
  assert.match(appHostShellHtml, /data-mobile-surface="panel"/);
  assert.match(appHostShellHtml, /data-mobile-surface="workspace"/);
});

test("Enterprise Agent remains a zero-config Chat Experience inside the Workbench", () => {
  const page = enterpriseAgentExperienceAssets.get("app://enterprise-agent/pages/home");
  assert.equal(page.kind, "chat");
  assert.equal(page.command.code, "enterprise-agent.chat");
  assert.equal(page.composer.key, "message");
  assert.equal(page.fields, undefined);
  assert.equal(page.actions, undefined);
});
