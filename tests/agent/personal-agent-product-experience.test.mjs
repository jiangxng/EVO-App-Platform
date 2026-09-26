import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createProviderRuntimeRegistry } from "../../dist/providers/runtime-registry.js";
import { createMemoryProviderBindingStoreV010 } from "../../dist/manager/provider-resolution.js";
import { createPluginStorePage } from "../../dist/manager/plugin-store-page.js";
import {
  enterpriseAgentPackage,
  PERSONAL_AGENT_SETUP_ROUTE
} from "../../dist/agents/enterprise-agent/package.js";
import {
  evaluatePersonalAgentReadinessV010
} from "../../dist/agents/enterprise-agent/readiness.js";
import {
  createPersonalAgentChatPageV020,
  createPersonalAgentSetupPageV010
} from "../../dist/agents/enterprise-agent/product-pages.js";
import { openAiLlmProviderPackage, OPENAI_LLM_PROVIDER_ID } from "../../dist/providers/openai/package.js";
import { hostEncryptedSecretsProviderPackage } from "../../dist/providers/secrets/package.js";

function fixture() {
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
  return { manager, registry, bindings };
}

test("Personal Agent distinguishes installed from ready", () => {
  const { manager, registry, bindings } = fixture();
  const readiness = evaluatePersonalAgentReadinessV010(manager, registry, bindings);
  assert.equal(readiness.state, "SETUP_REQUIRED");
  assert.equal(readiness.code, "NO_PROVIDER_INSTALLED");

  const page = createPersonalAgentChatPageV020(readiness, {
    contractVersion: "0.1.0",
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:test",
      displayName: "Personal"
    },
    activeContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:test"
    }
  });
  assert.equal(page.contractVersion, "0.2.0");
  assert.equal(page.readiness.state, "setup-required");
  assert.equal(page.composer.disabled, true);
  assert.equal(page.readiness.action.route, PERSONAL_AGENT_SETUP_ROUTE);
});

test("installed Provider without credential/runtime stays setup-required", () => {
  const { manager, registry, bindings } = fixture();
  manager.install("openai-llm-provider");
  const readiness = evaluatePersonalAgentReadinessV010(manager, registry, bindings);
  assert.equal(readiness.code, "PROVIDER_NOT_CONFIGURED");

  const setup = createPersonalAgentSetupPageV010(readiness);
  assert.equal(setup.steps.find(step => step.id === "provider").state, "complete");
  assert.equal(setup.steps.find(step => step.id === "credentials").state, "current");
  assert.equal(
    setup.steps.find(step => step.id === "credentials").primaryAction.route,
    "/settings/openai-llm-provider"
  );
});

test("registered LLM runtime makes Personal Agent ready", () => {
  const { manager, registry, bindings } = fixture();
  manager.install("openai-llm-provider");
  registry.register(OPENAI_LLM_PROVIDER_ID, { infer: async () => ({}) });
  registry.setHealth(OPENAI_LLM_PROVIDER_ID, { state: "HEALTHY" });

  const readiness = evaluatePersonalAgentReadinessV010(manager, registry, bindings);
  assert.equal(readiness.state, "READY");
  assert.equal(readiness.providerId, OPENAI_LLM_PROVIDER_ID);

  const setup = createPersonalAgentSetupPageV010(readiness);
  assert.equal(setup.steps.every(step => step.state === "complete"), true);
  assert.equal(setup.completionAction.route, "/enterprise-agent");
});

test("Plugin Store shows Set up instead of Open when Personal Agent is installed but unready", () => {
  const { manager } = fixture();
  const page = createPluginStorePage(
    [enterpriseAgentPackage],
    manager.getSnapshot(),
    {
      evaluateProductReadiness(pkg) {
        if (pkg.packageId !== "enterprise-agent") return undefined;
        return {
          id: "setup-required",
          label: "Needs setup",
          tone: "warning",
          message: "Configure an LLM Provider.",
          primaryAction: {
            id: "setup",
            label: "Set up",
            type: "navigate",
            route: PERSONAL_AGENT_SETUP_ROUTE
          }
        };
      }
    }
  );

  const item = page.items[0];
  assert.equal(item.status.id, "enabled");
  assert.equal(item.readiness.id, "setup-required");
  assert.equal(item.primaryAction.id, "setup");
  assert.equal(item.primaryAction.route, PERSONAL_AGENT_SETUP_ROUTE);
  assert.notEqual(item.primaryAction.id, "open");
});

test("Extension Manager keeps technical detail behind progressive disclosure", () => {
  const { manager } = fixture();
  const page = createPluginStorePage([enterpriseAgentPackage], manager.getSnapshot());
  assert.equal(page.technicalDetailsLabel, "Technical details");
});


test("multiple installed LLM Providers require explicit selection before credential setup", () => {
  const second = structuredClone(openAiLlmProviderPackage);
  second.packageId = "second-llm-provider";
  second.displayName = "Second LLM Provider";
  second.features[0].packageId = second.packageId;
  second.features[0].featureId = "second-llm-provider.default";
  for (const contribution of second.features[0].contributions ?? []) {
    if (contribution.kind === "platform.service-provider") {
      contribution.provider.providerId = "second.llm";
    }
  }

  const manager = createAppManagerService(
    createPackageCatalog([
      enterpriseAgentPackage,
      openAiLlmProviderPackage,
      second,
      hostEncryptedSecretsProviderPackage
    ]),
    createMemoryLifecycleStore()
  );
  const registry = createProviderRuntimeRegistry();
  const bindings = createMemoryProviderBindingStoreV010();
  manager.install("enterprise-agent");
  manager.install("openai-llm-provider");
  manager.install("second-llm-provider");

  const readiness = evaluatePersonalAgentReadinessV010(manager, registry, bindings);
  assert.equal(readiness.code, "PROVIDER_AMBIGUOUS");

  const setup = createPersonalAgentSetupPageV010(readiness);
  assert.equal(setup.steps.find(step => step.id === "provider").state, "current");
  assert.equal(
    setup.steps.find(step => step.id === "provider").primaryAction.route,
    "/providers/llm.inference"
  );
});
