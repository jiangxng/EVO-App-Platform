import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import {
  createAgentRunStoreV010,
  createMemoryAgentRunEventStoreV010
} from "../../dist/manager/agent-run-store.js";
import {
  createResumableAgentRunExecutorV010
} from "../../dist/agents/enterprise-agent/run-runtime.js";
import {
  createPersonalAgentRunActionHandlersV010
} from "../../dist/agents/enterprise-agent/run-action-handlers.js";
import {
  createEnterpriseAgentHostToolCatalogV010
} from "../../dist/agents/enterprise-agent/host-tool-catalog.js";
import {
  createAgentActionReceiptServiceV010,
  createMemoryAgentActionReceiptEventStoreV010
} from "../../dist/manager/agent-action-receipt-store.js";
import { createAppActionRouter } from "../../dist/actions/router.js";
import {
  executeRunBackedChatV010,
  recoverRunBackedChatV010
} from "../../dist/vendor/eidos/src/app-host/personal-agent-run-chat.js";

const principal = {
  contractVersion: "0.1.0",
  subjectId: "p16-user",
  actorType: "HUMAN",
  identityProviderId: "test.identity"
};

const context = {
  contractVersion: "0.1.0",
  personalContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:p16-user",
    ownerSubjectId: "p16-user",
    displayName: "P1.6 User"
  },
  activeContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:p16-user"
  }
};

function request(message = "do the task") {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    values: {
      message,
      activeContext: context.activeContext,
      conversationHistory: []
    },
    sourceInteractionId: "enterprise-agent.home",
    actionId: "chat.send",
    requiresConfirmation: false
  };
}

function ids(prefix) {
  let n = 0;
  return () => prefix + (++n);
}

function harness({ provider, createToolCatalog }) {
  const runStore = createAgentRunStoreV010({
    eventStore: createMemoryAgentRunEventStoreV010(),
    eventId: ids("store-")
  });
  const runExecutor = createResumableAgentRunExecutorV010({
    store: runStore,
    resolveProvider: () => provider,
    createToolCatalog,
    eventId: ids("exec-"),
    sliceId: ids("slice-")
  });
  const handlers = createPersonalAgentRunActionHandlersV010({
    runStore,
    runExecutor,
    resolveLlmProvider() {
      return {
        installedProviderIds: [provider.providerId],
        provider
      };
    },
    resolveIdentitySession() {
      return {
        contractVersion: "0.1.0",
        principal
      };
    },
    resolveContext() {
      return context;
    },
    createToolCatalog(locale, resolvedContext, resolvedPrincipal, requestContext, interaction) {
      return createToolCatalog(
        undefined,
        resolvedPrincipal,
        resolvedContext,
        requestContext,
        interaction
      );
    },
    runId: ids("run-")
  });
  const router = createAppActionRouter(handlers, () => true);
  return {
    runStore,
    actionHost: {
      execute(value) {
        return router.execute(value);
      }
    }
  };
}

test("P1.6A primary chat path runs start/resume to a rich terminal reply", async () => {
  const calls = [];
  const provider = {
    providerId: "test.llm",
    modelId: "test-model",
    async infer(input) {
      const text = input.messages.map(item => item.content).join("\n");
      if (text.includes("READ-OK")) {
        return {
          contractVersion: "0.1.0",
          providerId: "test.llm",
          modelId: "test-model",
          text: "durable final answer",
          toolCalls: [],
          usage: { inputTokens: 1, outputTokens: 1 },
          finishReason: "stop"
        };
      }
      return {
        contractVersion: "0.1.0",
        providerId: "test.llm",
        modelId: "test-model",
        text: "",
        toolCalls: [{ name: "test_read", arguments: {} }],
        usage: { inputTokens: 1, outputTokens: 1 },
        finishReason: "tool_calls"
      };
    }
  };
  const h = harness({
    provider,
    createToolCatalog() {
      return {
        list() {
          return [{
            contractVersion: "0.1.0",
            id: "test.read",
            modelName: "test_read",
            title: "Read evidence",
            description: "Read evidence.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false
            },
            effect: "READ",
            ownerPackageId: "test"
          }];
        },
        async invoke(call) {
          calls.push(call.tool);
          return {
            tool: call.tool,
            ok: true,
            result: { value: "READ-OK" }
          };
        }
      };
    }
  });

  const execution = await executeRunBackedChatV010({
    actionHost: h.actionHost,
    request: request("inspect then answer")
  });

  assert.equal(execution.mode, "RUN");
  assert.equal(execution.runState, "SUCCEEDED");
  assert.equal(execution.resumeCount, 0);
  assert.equal(calls.length, 1);
  assert.equal(execution.result.result.message, "durable final answer");
  assert.equal(
    execution.result.result.messageParts.some(
      part => part.type === "text" && part.text === "durable final answer"
    ),
    true
  );
  assert.equal(
    execution.result.result.messageParts.some(
      part => part.type === "activity" && part.label === "Read evidence"
    ),
    true
  );
  assert.equal(
    execution.result.result.messageParts.some(
      part => part.type === "evidence" && part.title === "Read evidence"
    ),
    true
  );

  const runs = h.runStore.list({
    principalSubjectId: principal.subjectId,
    context: context.activeContext
  });
  assert.equal(runs.length, 1);
  assert.equal(runs[0].state, "SUCCEEDED");
  assert.equal(runs[0].sliceCount, 2);
});


test("P1.6A durable run preserves work-surface interaction context for the model", async () => {
  const providerInputs = [];
  const provider = {
    providerId: "test.llm",
    modelId: "test-model",
    async infer(input) {
      providerInputs.push(structuredClone(input));
      return {
        contractVersion: "0.1.0",
        providerId: "test.llm",
        modelId: "test-model",
        text: "used contextual task coordinates",
        toolCalls: [],
        usage: { inputTokens: 1, outputTokens: 1 },
        finishReason: "stop"
      };
    }
  };
  const h = harness({
    provider,
    createToolCatalog() {
      return {
        list() { return []; },
        async invoke() {
          throw new Error("unexpected tool call");
        }
      };
    }
  });

  const contextualRequest = request("帮我做字段映射");
  contextualRequest.values.interactionContext = {
    contractVersion: "0.1.0",
    source: {
      pageId: "evo-data-import.mapping",
      route: "/data-import/jobs/import-ctx-1/map",
      actionId: "ai-auto-map"
    },
    context: {
      taskKind: "data-import.mapping",
      importJobId: "import-ctx-1",
      targetId: "counterparty.subject"
    }
  };

  const execution = await executeRunBackedChatV010({
    actionHost: h.actionHost,
    request: contextualRequest
  });

  assert.equal(execution.runState, "SUCCEEDED");
  const run = h.runStore.get(execution.runId);
  assert.deepEqual(
    run.input.interactionContext,
    contextualRequest.values.interactionContext
  );
  assert.equal(providerInputs.length, 1);
  const developer = providerInputs[0].messages.find(
    message => message.role === "developer"
  )?.content ?? "";
  assert.match(developer, /import-ctx-1/);
  assert.match(developer, /data-import\.mapping/);
});

test("P1.6A Host drain completes a WRITE turn in one client request and reconnect stays exactly-once", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([]),
    createMemoryLifecycleStore()
  );
  let writes = 0;
  let receiptEvent = 0;
  const receiptService = createAgentActionReceiptServiceV010({
    store: createMemoryAgentActionReceiptEventStoreV010(),
    eventId: () => "receipt-event-" + (++receiptEvent)
  });

  const provider = {
    providerId: "test.llm",
    modelId: "test-model",
    async infer(input) {
      const text = input.messages.map(item => item.content).join("\n");
      if (text.includes("object:created")) {
        return {
          contractVersion: "0.1.0",
          providerId: "test.llm",
          modelId: "test-model",
          text: "write completed and recovered",
          toolCalls: [],
          usage: { inputTokens: 1, outputTokens: 1 },
          finishReason: "stop"
        };
      }
      return {
        contractVersion: "0.1.0",
        providerId: "test.llm",
        modelId: "test-model",
        text: "",
        toolCalls: [{
          name: "test_write",
          arguments: { value: "created" }
        }],
        usage: { inputTokens: 1, outputTokens: 1 },
        finishReason: "tool_calls"
      };
    }
  };

  const h = harness({
    provider,
    createToolCatalog(_run, resolvedPrincipal, resolvedContext, _requestContext, interaction) {
      return createEnterpriseAgentHostToolCatalogV010(
        {
          manager,
          principal: resolvedPrincipal,
          context: resolvedContext,
          listAvailableContexts() {
            return [resolvedContext.activeContext];
          },
          listProviderBindings() { return []; },
          getProviderHealth() { return { state: "UNKNOWN" }; },
          actionReceipt: {
            sourceInteractionId: interaction.sourceInteractionId,
            sourceActionId: interaction.sourceActionId,
            service: receiptService,
            now: () => new Date("2026-09-28T00:40:00.000Z")
          },
          searchHelp() { return []; },
          authorizeWrite() { return { allowed: true }; }
        },
        [{
          descriptor: {
            contractVersion: "0.1.0",
            id: "test.write",
            modelName: "test_write",
            title: "Create test object",
            description: "Create one test object.",
            inputSchema: {
              type: "object",
              properties: { value: { type: "string" } },
              required: ["value"],
              additionalProperties: false
            },
            effect: "WRITE",
            ownerPackageId: "test",
            capability: "test.write"
          },
          execute(args) {
            writes += 1;
            return {
              objectId: "object:" + args.value
            };
          }
        }]
      );
    }
  });

  const first = await executeRunBackedChatV010({
    actionHost: h.actionHost,
    request: request("write then finish"),
    maxConsecutiveResumes: 0
  });

  assert.equal(first.mode, "RUN");
  assert.equal(first.runState, "SUCCEEDED");
  assert.equal(first.resumeCount, 0);
  assert.equal(first.result.ok, true);
  assert.equal(first.result.result.message, "write completed and recovered");
  assert.equal(writes, 1);

  const receiptsAfterWrite = receiptService.list({
    principalSubjectId: principal.subjectId,
    context: context.activeContext
  });
  assert.equal(receiptsAfterWrite.length, 1);
  assert.equal(receiptsAfterWrite[0].status, "SUCCEEDED");

  const recovered = await recoverRunBackedChatV010({
    actionHost: h.actionHost,
    request: request(""),
    runId: first.runId
  });

  assert.equal(recovered.runId, first.runId);
  assert.equal(recovered.runState, "SUCCEEDED");
  assert.equal(recovered.result.result.message, "write completed and recovered");
  assert.equal(writes, 1);

  const finalRun = h.runStore.get(first.runId);
  assert.equal(finalRun.state, "SUCCEEDED");
  assert.equal(finalRun.actionReceiptIds.length, 1);
  assert.equal(finalRun.actionReceiptIds[0], receiptsAfterWrite[0].receiptId);
});
