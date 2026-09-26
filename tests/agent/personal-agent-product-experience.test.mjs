import test from "node:test";
import assert from "node:assert/strict";

import {
  createPersonalAgentChatExperienceV020,
  createPersonalAgentSetupFlowV010,
  evaluatePersonalAgentReadinessV010
} from "../../dist/agents/enterprise-agent/product-experience.js";

const agentInstalledSnapshot = {
  contractVersion: "0.1.0",
  installedPackages: [{
    packageId: "enterprise-agent",
    version: "0.1.0",
    installedAt: "2026-09-26T00:00:00.000Z"
  }],
  activeFeatures: [{
    packageId: "enterprise-agent",
    featureId: "enterprise-agent.default",
    activatedAt: "2026-09-26T00:00:00.000Z"
  }],
  effectiveCapabilities: ["agent.personal"]
};

function providerPackage(packageId, displayName, providerId) {
  return {
    contractVersion: "0.1.0",
    packageId,
    displayName,
    version: "0.1.0",
    type: "PLATFORM_PROVIDER",
    features: [{
      contractVersion: "0.1.0",
      featureId: packageId + ".default",
      packageId,
      version: "0.1.0",
      activationScope: "INSTALLATION",
      providesCapabilities: ["llm.inference"],
      contributions: [{
        kind: "platform.service-provider",
        provider: {
          contractVersion: "0.1.0",
          providerId,
          capability: "llm.inference",
          providerContract: "evo.llm.inference",
          providerContractVersion: "0.1.0",
          binding: { type: "IN_PROCESS", ref: "runtime://" + providerId }
        }
      }]
    }]
  };
}

const openai = providerPackage("openai-llm-provider", "OpenAI LLM Provider", "openai.responses");
const other = providerPackage("other-llm-provider", "Other LLM Provider", "other.responses");

test("Personal Agent requires setup when no LLM Provider is installed", () => {
  const readiness = evaluatePersonalAgentReadinessV010({
    catalog: [openai],
    snapshot: agentInstalledSnapshot,
    effectiveProviders: [],
    resolveProvider() {
      return undefined;
    }
  });

  assert.equal(readiness.state, "SETUP_REQUIRED");
  assert.equal(readiness.reason, "LLM_PROVIDER_REQUIRED");
  assert.equal(readiness.providerCandidates.length, 1);
  assert.equal(readiness.providerCandidates[0].installed, false);

  const setup = createPersonalAgentSetupFlowV010(readiness);
  assert.equal(setup.steps[0].state, "current");
  assert.equal(setup.steps[0].primaryAction.id, "browse-providers");

  const chat = createPersonalAgentChatExperienceV020(readiness);
  assert.equal(chat.contractVersion, "0.2.0");
  assert.equal(chat.readiness.state, "setup-required");
  assert.equal(chat.composer.disabled, true);
});

test("installed Provider without runtime/credential becomes Provider configuration step", () => {
  const snapshot = {
    ...agentInstalledSnapshot,
    installedPackages: [
      ...agentInstalledSnapshot.installedPackages,
      {
        packageId: "openai-llm-provider",
        version: "0.1.0",
        installedAt: "2026-09-26T00:00:00.000Z"
      }
    ],
    activeFeatures: [
      ...agentInstalledSnapshot.activeFeatures,
      {
        packageId: "openai-llm-provider",
        featureId: "openai-llm-provider.default",
        activatedAt: "2026-09-26T00:00:00.000Z"
      }
    ]
  };
  const readiness = evaluatePersonalAgentReadinessV010({
    catalog: [openai],
    snapshot,
    effectiveProviders: [{
      providerId: "openai.responses",
      packageId: "openai-llm-provider",
      capability: "llm.inference"
    }],
    resolveProvider() {
      return undefined;
    }
  });

  assert.equal(readiness.reason, "LLM_PROVIDER_CONFIGURATION_REQUIRED");
  assert.equal(readiness.selectedProviderPackageId, "openai-llm-provider");
  const setup = createPersonalAgentSetupFlowV010(readiness);
  assert.equal(setup.steps[0].state, "complete");
  assert.equal(setup.steps[1].state, "current");
  assert.equal(
    setup.steps[1].primaryAction.route,
    "/settings/openai-llm-provider"
  );
});

test("multiple LLM Providers require explicit Provider selection", () => {
  const readiness = evaluatePersonalAgentReadinessV010({
    catalog: [openai, other],
    snapshot: agentInstalledSnapshot,
    effectiveProviders: [
      { providerId: "openai.responses", packageId: "openai-llm-provider", capability: "llm.inference" },
      { providerId: "other.responses", packageId: "other-llm-provider", capability: "llm.inference" }
    ],
    resolveProvider() {
      throw new Error("PROVIDER_RESOLUTION_AMBIGUOUS: llm.inference: openai.responses,other.responses");
    }
  });

  assert.equal(readiness.reason, "LLM_PROVIDER_SELECTION_REQUIRED");
  const setup = createPersonalAgentSetupFlowV010(readiness);
  assert.equal(setup.steps[0].primaryAction.id, "choose-provider");
  assert.equal(setup.steps[0].primaryAction.route, "/providers/llm.inference");
});

test("resolved LLM Provider makes Personal Agent ready and enables Chat", () => {
  const readiness = evaluatePersonalAgentReadinessV010({
    catalog: [openai],
    snapshot: agentInstalledSnapshot,
    effectiveProviders: [{
      providerId: "openai.responses",
      packageId: "openai-llm-provider",
      capability: "llm.inference"
    }],
    resolveProvider() {
      return {
        providerId: "openai.responses",
        health: { state: "HEALTHY", message: "ok" }
      };
    }
  });

  assert.equal(readiness.state, "READY");
  assert.equal(readiness.reason, "READY");
  const chat = createPersonalAgentChatExperienceV020(readiness, "Context", "Personal");
  assert.equal(chat.readiness.state, "ready");
  assert.equal(chat.composer.disabled, false);
  assert.equal(chat.command.code, "enterprise-agent.chat");
  const setup = createPersonalAgentSetupFlowV010(readiness);
  assert.equal(setup.steps.every(step => step.state === "complete"), true);
  assert.equal(setup.completionAction.route, "/enterprise-agent");
});
