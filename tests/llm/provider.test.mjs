import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { openAiLlmProviderPackage } from "../../dist/providers/openai/package.js";
import { createOpenAiResponsesLlmProvider } from "../../dist/providers/openai/runtime.js";
import { hostEncryptedSecretsProviderPackage } from "../../dist/providers/secrets/package.js";
import { createProviderRuntimeRegistry } from "../../dist/providers/runtime-registry.js";
import { createProviderBackedAgentModel } from "../../dist/agents/enterprise-agent/provider-model.js";
import { createEnterpriseAgentChatActionHandler } from "../../dist/agents/enterprise-agent/chat-action-handler.js";
import { createEnterpriseAgentHostToolCatalogV010 } from "../../dist/agents/enterprise-agent/host-tool-catalog.js";
import {
  companyNotesPackage,
  enterpriseAgentPackage
} from "../../dist/catalog/seed.js";

const personalContext = {
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

function agentToolCatalog(manager, context = personalContext) {
  return createEnterpriseAgentHostToolCatalogV010({
    manager,
    context,
    listAvailableContexts() { return [structuredClone(context.activeContext)]; },
    listProviderBindings() { return []; },
    getProviderHealth() { return { state: "UNKNOWN" }; },
    searchHelp() { return []; }
  });
}

const catalogListTool = {
  contractVersion: "0.1.0",
  id: "app.catalog.list",
  modelName: "app_catalog_list",
  title: "Package catalog",
  description: "List Packages currently available in the App Manager catalog.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  effect: "READ",
  ownerPackageId: "evo-app-platform"
};

test("OpenAI LLM provider is an ordinary lifecycle-managed platform provider", () => {
  const catalog = createPackageCatalog([
    openAiLlmProviderPackage,
    hostEncryptedSecretsProviderPackage
  ]);
  const manager = createAppManagerService(catalog, createMemoryLifecycleStore());

  assert.deepEqual(manager.listEffectiveServiceProviders("llm.inference"), []);

  const plan = manager.planInstall("openai-llm-provider");
  assert.deepEqual(plan.blockers, []);
  assert.deepEqual(plan.installPackages, [
    "host-encrypted-secrets-provider",
    "openai-llm-provider"
  ]);
  manager.install("openai-llm-provider");

  const providers = manager.listEffectiveServiceProviders("llm.inference");
  assert.equal(providers.length, 1);
  assert.equal(providers[0].providerId, "openai.responses");
  assert.equal(providers[0].binding.type, "IN_PROCESS");
  assert.equal(providers[0].metadata.apiKeySecretName, "openai-llm-provider/apiKey");
  assert.equal(
    manager.listEffectiveServiceProviders("secrets.resolve")[0].providerId,
    "host.encrypted-secrets"
  );

  manager.disable("openai-llm-provider");
  assert.deepEqual(manager.listEffectiveServiceProviders("llm.inference"), []);
});

test("runtime registry resolves only installed descriptors that have configured runtimes", () => {
  const registry = createProviderRuntimeRegistry();
  const runtime = { marker: "configured" };
  registry.register("openai.responses", runtime);

  assert.equal(
    registry.resolve([{ providerId: "other", capability: "llm.inference" }], "llm.inference"),
    undefined
  );

  const resolved = registry.resolve(
    [{ providerId: "openai.responses", capability: "llm.inference" }],
    "llm.inference"
  );
  assert.equal(resolved.runtime, runtime);
});

test("OpenAI Responses provider implements generic LLM inference and tool calls", async () => {
  let requestBody;
  const provider = createOpenAiResponsesLlmProvider({
    apiKey: "test-key",
    model: "gpt-test",
    fetchImpl: async (_url, init) => {
      requestBody = JSON.parse(init.body);
      return new Response(JSON.stringify({
        model: "gpt-test",
        output: [{
          type: "function_call",
          name: "app_catalog_list",
          arguments: "{}"
        }],
        usage: { input_tokens: 11, output_tokens: 3 }
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
  });

  const result = await provider.infer({
    contractVersion: "0.1.0",
    messages: [
      { role: "system", content: "system" },
      { role: "user", content: "hello" }
    ],
    tools: [{
      name: "app_catalog_list",
      description: "catalog",
      inputSchema: { type: "object", properties: {}, additionalProperties: false }
    }]
  });

  assert.equal(requestBody.model, "gpt-test");
  assert.equal(requestBody.tools[0].name, "app_catalog_list");
  assert.equal(result.providerId, "openai.responses");
  assert.equal(result.toolCalls[0].name, "app_catalog_list");
  assert.equal(result.usage.inputTokens, 11);
});

test("Enterprise Agent model is provider-neutral", async () => {
  const model = createProviderBackedAgentModel({
    providerId: "fake",
    modelId: "fake-model",
    async infer() {
      return {
        contractVersion: "0.1.0",
        providerId: "fake",
        modelId: "fake-model",
        text: "",
        toolCalls: [{ name: "app_catalog_list", arguments: {} }],
        usage: { inputTokens: 0, outputTokens: 0 },
        finishReason: "stop"
      };
    }
  });

  const decision = await model.decide({
    userMessage: "列出应用",
    tools: [catalogListTool],
    observations: []
  });
  assert.equal(decision.type, "tool");
  assert.equal(decision.call.tool, "app.catalog.list");
});

test("Enterprise Agent chat fails closed without a configured LLM runtime", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([enterpriseAgentPackage]),
    createMemoryLifecycleStore()
  );
  const handler = createEnterpriseAgentChatActionHandler({
    resolveLlmProvider: () => ({
      installedProviderIds: ["openai.responses"]
    }),
    resolveContext: () => personalContext,
    createToolCatalog: (_locale, context) => agentToolCatalog(manager, context)
  });

  const result = await handler.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: { code: "enterprise-agent.chat", inputVersion: "0.1.0" },
    values: { message: "你好" },
    sourceInteractionId: "test",
    actionId: "send",
    requiresConfirmation: false
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "LLM_PROVIDER_NOT_CONFIGURED");
});

test("Enterprise Agent uses a generic LLM provider to drive App Manager tools", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([enterpriseAgentPackage, companyNotesPackage]),
    createMemoryLifecycleStore()
  );

  let step = 0;
  const provider = {
    providerId: "fake",
    modelId: "fake-model",
    async infer() {
      step += 1;
      if (step === 1) return {
        contractVersion: "0.1.0", providerId: "fake", modelId: "fake-model",
        text: "", toolCalls: [{ name: "app_catalog_list", arguments: {} }],
        usage: { inputTokens: 0, outputTokens: 0 }, finishReason: "stop"
      };
      if (step === 2) return {
        contractVersion: "0.1.0", providerId: "fake", modelId: "fake-model",
        text: "", toolCalls: [{ name: "app_install_plan", arguments: { packageId: "company-notes" } }],
        usage: { inputTokens: 0, outputTokens: 0 }, finishReason: "stop"
      };
      if (step === 3) return {
        contractVersion: "0.1.0", providerId: "fake", modelId: "fake-model",
        text: "", toolCalls: [{ name: "app_install_execute", arguments: { packageId: "company-notes" } }],
        usage: { inputTokens: 0, outputTokens: 0 }, finishReason: "stop"
      };
      return {
        contractVersion: "0.1.0", providerId: "fake", modelId: "fake-model",
        text: "安装完成", toolCalls: [],
        usage: { inputTokens: 0, outputTokens: 0 }, finishReason: "stop"
      };
    }
  };

  const handler = createEnterpriseAgentChatActionHandler({
    resolveLlmProvider: () => ({
      installedProviderIds: ["fake"],
      provider
    }),
    resolveContext: () => personalContext,
    createToolCatalog: (_locale, context) => agentToolCatalog(manager, context)
  });

  const result = await handler.execute({
    contractVersion: "0.1.0",
    type: "command",
    command: { code: "enterprise-agent.chat", inputVersion: "0.1.0" },
    values: { message: "帮我安装 Company Notes" },
    sourceInteractionId: "test-chat",
    actionId: "send",
    requiresConfirmation: false
  });

  assert.equal(result.ok, true);
  assert.equal(result.result.message, "安装完成");
  assert.deepEqual(result.result.context, personalContext);
  assert.equal(
    manager.getSnapshot().installedPackages.some(x => x.packageId === "company-notes"),
    true
  );
});
