import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  createMemoryProviderBindingStoreV010
} from "../../dist/manager/provider-resolution.js";
import {
  evaluatePersonalAgentReadinessV010
} from "../../dist/manager/personal-agent-experience.js";
import {
  deepSeekLlmProviderPackage
} from "../../dist/providers/deepseek/package.js";
import {
  createDeepSeekResponsesHealthProbe,
  createDeepSeekResponsesLlmProvider
} from "../../dist/providers/deepseek/runtime.js";
import {
  openAiLlmProviderPackage
} from "../../dist/providers/openai/package.js";
import {
  hostEncryptedSecretsProviderPackage
} from "../../dist/providers/secrets/package.js";
import {
  createProviderRuntimeRegistry
} from "../../dist/providers/runtime-registry.js";
import {
  enterpriseAgentPackage
} from "../../dist/catalog/seed.js";

test("DeepSeek LLM Provider is a lifecycle-managed platform provider with Host Secrets", () => {
  const catalog = createPackageCatalog([
    deepSeekLlmProviderPackage,
    hostEncryptedSecretsProviderPackage
  ]);
  const manager = createAppManagerService(
    catalog,
    createMemoryLifecycleStore()
  );

  assert.deepEqual(
    manager.listEffectiveServiceProviders("llm.inference"),
    []
  );

  const plan = manager.planInstall("deepseek-llm-provider");
  assert.deepEqual(plan.blockers, []);
  assert.deepEqual(plan.installPackages, [
    "deepseek-llm-provider",
    "host-encrypted-secrets-provider"
  ]);

  manager.install("deepseek-llm-provider");

  const providers = manager.listEffectiveServiceProviders("llm.inference");
  assert.equal(providers.length, 1);
  assert.equal(providers[0].providerId, "deepseek.responses");
  assert.equal(providers[0].binding.type, "IN_PROCESS");
  assert.equal(
    providers[0].metadata.apiKeySecretName,
    "deepseek-llm-provider/apiKey"
  );
  assert.equal(providers[0].metadata.defaultModel, "deepseek-flash");
});

test("DeepSeek Responses Provider maps EVO inference and tool calls without provider-specific schema mutation", async () => {
  let requestUrl;
  let requestBody;
  const provider = createDeepSeekResponsesLlmProvider({
    apiKey: "deepseek-test-key",
    model: "deepseek-flash",
    fetchImpl: async (url, init) => {
      requestUrl = String(url);
      requestBody = JSON.parse(init.body);
      return Response.json({
        model: "deepseek-flash",
        output: [{
          type: "function_call",
          name: "context_memory_proposal_create",
          arguments: JSON.stringify({
            kind: "FACT",
            summary: "Warehouse cut-off is 17:00"
          })
        }],
        usage: {
          input_tokens: 13,
          output_tokens: 5
        }
      });
    }
  });

  const inputSchema = {
    type: "object",
    properties: {
      kind: {
        type: "string",
        enum: ["FACT", "CLAIM", "EXPERIENCE", "PRACTICE"]
      },
      summary: { type: "string" },
      evidenceRefs: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["kind", "summary"],
    additionalProperties: false
  };

  const result = await provider.infer({
    contractVersion: "0.1.0",
    messages: [
      { role: "system", content: "system" },
      { role: "user", content: "remember this" },
      { role: "developer", content: "context" }
    ],
    tools: [{
      name: "context_memory_proposal_create",
      description: "Create a Memory proposal",
      inputSchema
    }]
  });

  assert.equal(
    requestUrl,
    "https://api.deepseek.com/responses"
  );
  assert.equal(requestBody.model, "deepseek-flash");
  assert.match(requestBody.instructions, /system/);
  assert.match(requestBody.instructions, /context/);
  assert.equal(requestBody.tools[0].strict, undefined);
  assert.deepEqual(requestBody.tools[0].parameters, inputSchema);
  assert.equal(requestBody.tool_choice, "auto");

  assert.equal(result.providerId, "deepseek.responses");
  assert.equal(result.modelId, "deepseek-flash");
  assert.deepEqual(result.toolCalls, [{
    name: "context_memory_proposal_create",
    arguments: {
      kind: "FACT",
      summary: "Warehouse cut-off is 17:00"
    }
  }]);
  assert.deepEqual(result.usage, {
    inputTokens: 13,
    outputTokens: 5
  });
});

test("DeepSeek inference times out before the browser request boundary", async () => {
  const provider = createDeepSeekResponsesLlmProvider({
    apiKey: "deepseek-test-key",
    inferenceTimeoutMs: 1000,
    fetchImpl: async (_url, init) => new Promise((resolve, reject) => {
      init.signal.addEventListener("abort", () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        reject(error);
      }, { once: true });
    })
  });

  await assert.rejects(
    () => provider.infer({
      contractVersion: "0.1.0",
      messages: [{ role: "user", content: "slow request" }]
    }),
    /DEEPSEEK_PROVIDER_INFERENCE_TIMEOUT/
  );
});

test("DeepSeek Responses Provider maps output text to generic LLM response", async () => {
  const provider = createDeepSeekResponsesLlmProvider({
    apiKey: "deepseek-test-key",
    model: "deepseek-v4-pro",
    baseUrl: "https://api.deepseek.com/",
    fetchImpl: async () => Response.json({
      model: "deepseek-v4-pro",
      output: [{
        type: "message",
        content: [{
          type: "output_text",
          text: "你好，我可以继续处理。"
        }]
      }],
      usage: {
        input_tokens: 7,
        output_tokens: 9
      }
    })
  });

  const result = await provider.infer({
    contractVersion: "0.1.0",
    messages: [{ role: "user", content: "你好" }]
  });

  assert.equal(result.text, "你好，我可以继续处理。");
  assert.deepEqual(result.toolCalls, []);
  assert.equal(result.modelId, "deepseek-v4-pro");
});

test("DeepSeek health probe validates the configured model against official /models response", async () => {
  let requestedUrl;
  const healthy = createDeepSeekResponsesHealthProbe({
    apiKey: "deepseek-test-key",
    model: "deepseek-flash",
    fetchImpl: async url => {
      requestedUrl = String(url);
      return Response.json({
        object: "list",
        data: [
          { id: "deepseek-flash", object: "model" },
          { id: "deepseek-v4-pro", object: "model" }
        ]
      });
    }
  });

  const health = await healthy();
  assert.equal(requestedUrl, "https://api.deepseek.com/models");
  assert.equal(health.state, "HEALTHY");
  assert.match(health.message, /deepseek-flash/);

  const missing = createDeepSeekResponsesHealthProbe({
    apiKey: "deepseek-test-key",
    model: "not-a-model",
    fetchImpl: async () => Response.json({
      object: "list",
      data: [{ id: "deepseek-flash", object: "model" }]
    })
  });
  const missingHealth = await missing();
  assert.equal(missingHealth.state, "UNAVAILABLE");
});

test("OpenAI and DeepSeek coexist without silent selection and explicit binding resolves DeepSeek", () => {
  const catalog = createPackageCatalog([
    enterpriseAgentPackage,
    openAiLlmProviderPackage,
    deepSeekLlmProviderPackage,
    hostEncryptedSecretsProviderPackage
  ]);
  const manager = createAppManagerService(
    catalog,
    createMemoryLifecycleStore()
  );
  manager.install("enterprise-agent");
  manager.install("openai-llm-provider");
  manager.install("deepseek-llm-provider");

  const registry = createProviderRuntimeRegistry();
  registry.register("openai.responses", {
    providerId: "openai.responses",
    modelId: "gpt-test",
    infer() {}
  });
  registry.register("deepseek.responses", {
    providerId: "deepseek.responses",
    modelId: "deepseek-flash",
    infer() {}
  });
  const bindings = createMemoryProviderBindingStoreV010();

  const ambiguous = evaluatePersonalAgentReadinessV010(
    manager,
    registry,
    bindings
  );
  assert.equal(ambiguous.state, "setup-required");
  assert.equal(
    ambiguous.code,
    "LLM_PROVIDER_SELECTION_REQUIRED"
  );
  assert.deepEqual(ambiguous.installedProviderPackageIds, [
    "deepseek-llm-provider",
    "openai-llm-provider"
  ]);

  bindings.save({
    contractVersion: "0.1.0",
    capability: "llm.inference",
    providerId: "deepseek.responses",
    scope: "INSTALLATION",
    scopeId: "default"
  });

  const selected = evaluatePersonalAgentReadinessV010(
    manager,
    registry,
    bindings
  );
  assert.equal(selected.state, "ready");
  assert.equal(selected.providerId, "deepseek.responses");
  assert.equal(
    selected.providerPackageId,
    "deepseek-llm-provider"
  );
});
