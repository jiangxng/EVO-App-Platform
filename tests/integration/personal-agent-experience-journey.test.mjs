import test from "node:test";
import assert from "node:assert/strict";

import {
  createPersonalAgentPluginStoreProductStateV010,
  createPersonalAgentSetupPageV010
} from "../../dist/manager/personal-agent-experience.js";
import {
  enterpriseAgentPackage
} from "../../dist/agents/enterprise-agent/package.js";

function readiness(overrides = {}) {
  return {
    contractVersion: "0.1.0",
    state: "setup-required",
    code: "LLM_PROVIDER_REQUIRED",
    message: "Install and configure an LLM Provider before using Personal Agent.",
    active: true,
    installedProviderPackageIds: [],
    catalogProviderPackageIds: ["openai-llm-provider"],
    ...overrides
  };
}

test("Personal Agent product journey maps Needs setup to Set up and Ready to Open", () => {
  const needsSetup = createPersonalAgentPluginStoreProductStateV010(readiness());
  assert.equal(needsSetup.readiness.id, "setup-required");
  assert.equal(needsSetup.primaryAction.id, "setup");
  assert.equal(needsSetup.primaryAction.route, "/enterprise-agent/setup");

  const ready = createPersonalAgentPluginStoreProductStateV010(readiness({
    state: "ready",
    code: "READY",
    message: "Personal Agent is ready.",
    providerId: "openai.responses",
    providerPackageId: "openai-llm-provider",
    installedProviderPackageIds: ["openai-llm-provider"]
  }));
  assert.equal(ready.readiness.id, "ready");
  assert.equal(ready.primaryAction.id, "open");
  assert.equal(ready.primaryAction.route, "/enterprise-agent");
});

test("first-run Setup points Provider discovery back to the real Plugin Store", () => {
  const setup = createPersonalAgentSetupPageV010(readiness());
  const provider = setup.steps.find(step => step.id === "provider");
  assert.equal(provider.state, "current");
  assert.equal(provider.primaryAction.id, "open-provider-catalog");
  assert.equal(provider.primaryAction.route, "/store");
  assert.equal(setup.completionAction, undefined);
  assert.match(setup.title, /Set up Personal Agent/);
  assert.doesNotMatch(setup.description, /llm\.inference|Provider/);
  assert.doesNotMatch(provider.title + " " + provider.description, /llm\.inference|Provider/);
});

test("configured Provider step links real Provider Settings and Provider status", () => {
  const setup = createPersonalAgentSetupPageV010(readiness({
    code: "LLM_PROVIDER_CONFIGURATION_REQUIRED",
    message: "Provider configuration required.",
    providerPackageId: "openai-llm-provider",
    installedProviderPackageIds: ["openai-llm-provider"]
  }));
  const credentials = setup.steps.find(step => step.id === "credentials");
  assert.equal(credentials.state, "current");
  assert.equal(credentials.primaryAction.id, "configure-provider");
  assert.equal(credentials.primaryAction.route, "/settings/openai-llm-provider");
  assert.deepEqual(credentials.primaryAction.continuation, {
    onActionId: "settings.save",
    route: "/enterprise-agent/setup"
  });
  assert.equal(
    credentials.secondaryActions.find(action => action.id === "provider-status").route,
    "/providers/llm.inference"
  );
});

test("Provider selection and degraded/unavailable readiness stay on governed Provider surfaces", () => {
  const selection = createPersonalAgentSetupPageV010(readiness({
    code: "LLM_PROVIDER_SELECTION_REQUIRED",
    message: "Choose Provider.",
    installedProviderPackageIds: ["openai-llm-provider", "other-llm-provider"],
    catalogProviderPackageIds: ["openai-llm-provider", "other-llm-provider"]
  }));
  const selectionAction = selection.steps.find(step => step.id === "provider").primaryAction;
  assert.equal(selectionAction.route, "/providers/llm.inference");
  assert.deepEqual(selectionAction.continuation, {
    onActionId: "settings.save",
    route: "/enterprise-agent/setup"
  });

  const unavailable = createPersonalAgentSetupPageV010(readiness({
    state: "unavailable",
    code: "LLM_PROVIDER_UNAVAILABLE",
    message: "Provider unavailable.",
    installedProviderPackageIds: ["openai-llm-provider"],
    providerPackageId: "openai-llm-provider"
  }));
  const providerReadiness = unavailable.steps.find(step => step.id === "readiness");
  assert.equal(providerReadiness.state, "error");
  assert.equal(providerReadiness.primaryAction.route, "/providers/llm.inference");
  assert.equal(providerReadiness.secondaryActions[0].route, "/enterprise-agent/setup");
});

test("Ready completes setup with one clear next action instead of unrelated exit links", () => {
  const setup = createPersonalAgentSetupPageV010(readiness({
    state: "ready",
    code: "READY",
    message: "Personal Agent is ready.",
    providerId: "openai.responses",
    providerPackageId: "openai-llm-provider",
    installedProviderPackageIds: ["openai-llm-provider"]
  }));

  assert.equal(setup.steps.every(step => step.state === "complete"), true);
  assert.equal(setup.completionAction.route, "/enterprise-agent");
  assert.equal(setup.completionAction.label, "Start using Personal Agent");

  const finalStep = setup.steps.find(step => step.id === "ready");
  assert.equal(finalStep.title, "Ready to use");
  assert.equal(finalStep.secondaryActions, undefined);
});

test("experience journey actions ship in all four first-class locales", () => {
  const bundles = enterpriseAgentPackage.features[0].contributions
    .filter(contribution => contribution.kind === "eidos.localization-bundle");
  assert.deepEqual(bundles.map(item => item.bundle.locale).sort(), [
    "en",
    "ja",
    "zh-CN",
    "zh-TW"
  ]);
  for (const contribution of bundles) {
    const messages = contribution.bundle.messages;
    for (const key of [
      "setup.personal-agent.setup.action.provider-status.label",
      "setup.personal-agent.setup.action.check-provider-status.label",
      "setup.personal-agent.setup.action.recheck-setup.label",
      "setup.personal-agent.setup.action.open-agent.label"
    ]) {
      assert.ok(messages[key], contribution.bundle.locale + " missing " + key);
    }
  }
});
