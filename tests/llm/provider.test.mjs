import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import {
  createAgentActionReceiptServiceV010,
  createMemoryAgentActionReceiptEventStoreV010
} from "../../dist/manager/agent-action-receipt-store.js";
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

const testPrincipal = {
  contractVersion: "0.1.0",
  subjectId: "test-person",
  actorType: "HUMAN",
  identityProviderId: "test.identity"
};

const testSession = {
  contractVersion: "0.1.0",
  sessionId: "session:test",
  principal: testPrincipal,
  issuedAt: "2026-09-26T00:00:00.000Z"
};

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

let receiptSequence = 0;

function agentToolCatalog(manager, context = personalContext) {
  let eventSequence = 0;
  return createEnterpriseAgentHostToolCatalogV010({
    manager,
    principal: testPrincipal,
    context,
    actionReceipt: {
      sourceInteractionId: "provider-test:" + (++receiptSequence),
      sourceActionId: "enterprise-agent.chat",
      service: createAgentActionReceiptServiceV010({
        store: createMemoryAgentActionReceiptEventStoreV010(),
        eventId: () => "provider-test-event:" + (++eventSequence)
      }),
      now: () => new Date("2026-09-27T16:00:00.000Z")
    },
    listAvailableContexts() { return [structuredClone(context.activeContext)]; },
    listProviderBindings() { return []; },
    getProviderHealth() { return { state: "UNKNOWN" }; },
    searchHelp() { return []; },
    authorizeWrite() { return { allowed: true }; }
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
  assert.deepEqual(requestBody.tools[0].parameters.required, []);
  assert.equal(requestBody.tools[0].parameters.additionalProperties, false);
  assert.equal(result.providerId, "openai.responses");
  assert.equal(result.toolCalls[0].name, "app_catalog_list");
  assert.equal(result.usage.inputTokens, 11);
});

test("OpenAI strict tool adapter preserves EVO optional semantics", async () => {
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
          name: "context_memory_proposal_create",
          arguments: JSON.stringify({
            kind: "FACT",
            summary: "Warehouse cut-off is 17:00",
            evidenceRefs: null,
            proposedConfidence: null,
            observedAt: null,
            supersedesMemoryId: null,
            potentialContradictionMemoryIds: []
          })
        }],
        usage: { input_tokens: 25, output_tokens: 8 }
      }), { status: 200, headers: { "content-type": "application/json" } });
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
      },
      proposedConfidence: {
        type: "number",
        minimum: 0,
        maximum: 1
      },
      observedAt: { type: "string" },
      supersedesMemoryId: { type: "string" },
      potentialContradictionMemoryIds: {
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
      { role: "user", content: "remember this" }
    ],
    tools: [{
      name: "context_memory_proposal_create",
      description: "Create Memory proposal",
      inputSchema
    }]
  });

  const parameters = requestBody.tools[0].parameters;
  assert.equal(requestBody.tools[0].strict, true);
  assert.deepEqual(
    parameters.required,
    Object.keys(parameters.properties)
  );
  assert.deepEqual(
    parameters.properties.evidenceRefs.type,
    ["array", "null"]
  );
  assert.deepEqual(
    parameters.properties.proposedConfidence.type,
    ["number", "null"]
  );
  assert.deepEqual(
    parameters.properties.observedAt.type,
    ["string", "null"]
  );
  assert.deepEqual(
    parameters.properties.kind.type,
    "string"
  );
  assert.deepEqual(
    result.toolCalls[0].arguments,
    {
      kind: "FACT",
      summary: "Warehouse cut-off is 17:00",
      potentialContradictionMemoryIds: []
    }
  );
});

test("OpenAI strict tool adapter recursively normalizes nested optional object fields", async () => {
  let requestBody;
  const provider = createOpenAiResponsesLlmProvider({
    apiKey: "test-key",
    model: "gpt-test",
    fetchImpl: async (_url, init) => {
      requestBody = JSON.parse(init.body);
      return new Response(JSON.stringify({
        model: "gpt-test",
        output: [],
        usage: { input_tokens: 1, output_tokens: 1 }
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
  });

  await provider.infer({
    contractVersion: "0.1.0",
    messages: [{ role: "user", content: "hello" }],
    tools: [{
      name: "nested_tool",
      description: "nested",
      inputSchema: {
        type: "object",
        properties: {
          options: {
            type: "object",
            properties: {
              mode: {
                type: "string",
                enum: ["A", "B"]
              }
            },
            additionalProperties: true
          }
        },
        additionalProperties: true
      }
    }]
  });

  const schema = requestBody.tools[0].parameters;
  assert.deepEqual(schema.required, ["options"]);
  assert.deepEqual(schema.properties.options.type, ["object", "null"]);
  assert.equal(schema.properties.options.additionalProperties, false);
  assert.deepEqual(
    schema.properties.options.required,
    ["mode"]
  );
  assert.deepEqual(
    schema.properties.options.properties.mode.type,
    ["string", "null"]
  );
  assert.deepEqual(
    schema.properties.options.properties.mode.enum,
    ["A", "B", null]
  );
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
    resolveIdentitySession: () => testSession,
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
    resolveIdentitySession: () => testSession,
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
