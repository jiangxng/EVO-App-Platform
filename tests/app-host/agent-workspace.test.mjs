import test from "node:test";
import assert from "node:assert/strict";

import { appHostShellHtml } from "../../dist/manager/app-host-shell.js";
import {
  enterpriseAgentExperienceAssets,
  enterpriseAgentPackage
} from "../../dist/agents/enterprise-agent/package.js";
import { openAiLlmProviderPackage, OPENAI_LLM_PROVIDER_ID } from "../../dist/providers/openai/package.js";
import { hostEncryptedSecretsProviderPackage } from "../../dist/providers/secrets/package.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createProviderRuntimeRegistry } from "../../dist/providers/runtime-registry.js";
import { createMemoryProviderBindingStoreV010 } from "../../dist/manager/provider-resolution.js";
import {
  createPersonalAgentChatPageV020,
  createPersonalAgentSetupPageV010,
  resolvePersonalAgentReadinessV010
} from "../../dist/manager/personal-agent-experience.js";

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
  assert.equal(page.composer.disabled, true);
  assert.equal(page.context.value, "Personal");
  assert.equal(page.readiness.state, "setup-required");
  assert.equal(page.readiness.action.route, "/enterprise-agent/setup");
  assert.equal(page.emptyState.suggestions.length, 3);
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
  const bundles = enterpriseAgentPackage.features[0].contributions.filter(
    contribution => contribution.kind === "eidos.localization-bundle"
  );
  assert.deepEqual(
    bundles.map(contribution => contribution.bundle.locale).sort(),
    ["en", "ja", "zh-CN", "zh-TW"].sort()
  );
  const zh = bundles.find(contribution => contribution.bundle.locale === "zh-CN");
  const ja = bundles.find(contribution => contribution.bundle.locale === "ja");
  const zhTw = bundles.find(contribution => contribution.bundle.locale === "zh-TW");
  assert.equal(zh.bundle.messages["workbench.activity.label"], "个人 Agent");
  assert.equal(ja.bundle.messages["workbench.activity.label"], "パーソナルエージェント");
  assert.equal(zhTw.bundle.messages["workbench.activity.label"], "個人 Agent");

  const experience = enterpriseAgentPackage.features[0].contributions.find(
    contribution => contribution.kind === "eidos.experience"
  ).manifest;
  assert.ok(experience.routes.some(route => route.path === "/enterprise-agent/setup"));
});


test("Personal Agent readiness distinguishes installed, setup-required and ready", () => {
  const manager = createAppManagerService(
    createPackageCatalog([
      enterpriseAgentPackage,
      openAiLlmProviderPackage,
      hostEncryptedSecretsProviderPackage
    ]),
    createMemoryLifecycleStore()
  );
  const registry = createProviderRuntimeRegistry();
  const bindings = createMemoryProviderBindingStoreV010();

  manager.install("enterprise-agent");
  const missing = resolvePersonalAgentReadinessV010(manager, registry, bindings);
  assert.equal(missing.state, "setup-required");
  assert.equal(missing.code, "LLM_PROVIDER_MISSING");

  manager.install("openai-llm-provider");
  const configure = resolvePersonalAgentReadinessV010(manager, registry, bindings);
  assert.equal(configure.state, "setup-required");
  assert.equal(configure.code, "LLM_PROVIDER_CONFIGURATION_REQUIRED");
  assert.equal(configure.providerSettingsRoute, "/settings/openai-llm-provider");

  registry.register(OPENAI_LLM_PROVIDER_ID, {
    providerId: OPENAI_LLM_PROVIDER_ID,
    modelId: "test",
    async infer() {
      throw new Error("not used");
    }
  });
  registry.setHealth(OPENAI_LLM_PROVIDER_ID, { state: "HEALTHY" });

  const ready = resolvePersonalAgentReadinessV010(manager, registry, bindings);
  assert.equal(ready.state, "ready");
  assert.equal(ready.code, "READY");
  assert.equal(ready.selectedProviderId, OPENAI_LLM_PROVIDER_ID);
});

test("Personal Agent setup is an Eidos Setup Flow and ready Chat enables composer", () => {
  const context = {
    contractVersion: "0.1.0",
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:test"
    },
    activeContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:test"
    }
  };

  const setupRequired = {
    contractVersion: "0.1.0",
    state: "setup-required",
    code: "LLM_PROVIDER_MISSING",
    providerIds: [],
    setupRoute: "/enterprise-agent/setup"
  };
  const setup = createPersonalAgentSetupPageV010(setupRequired, "ja");
  assert.equal(setup.kind, "setup-flow");
  assert.equal(setup.contractVersion, "0.1.0");
  assert.equal(setup.title, "パーソナルエージェントのセットアップ");
  assert.equal(setup.steps[0].state, "current");
  assert.equal(setup.steps[0].primaryAction.route, "/store");

  const ready = {
    contractVersion: "0.1.0",
    state: "ready",
    code: "READY",
    providerIds: ["openai.responses"],
    selectedProviderId: "openai.responses",
    selectedProviderPackageId: "openai-llm-provider",
    setupRoute: "/enterprise-agent/setup",
    providerSettingsRoute: "/settings/openai-llm-provider"
  };
  const chat = createPersonalAgentChatPageV020(ready, context, "zh-TW");
  assert.equal(chat.kind, "chat");
  assert.equal(chat.contractVersion, "0.2.0");
  assert.equal(chat.title, "個人 Agent");
  assert.equal(chat.composer.disabled, false);
  assert.equal(chat.context.value, "個人");

  const done = createPersonalAgentSetupPageV010(ready, "zh-CN");
  assert.equal(done.steps.every(step => step.state === "complete"), true);
  assert.equal(done.completionAction.route, "/enterprise-agent");
});
