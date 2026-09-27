import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  createAgentRunStoreV010,
  createJsonlAgentRunEventStoreV010,
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

const principal = {
  contractVersion: "0.1.0",
  subjectId: "run-user",
  actorType: "HUMAN",
  identityProviderId: "test.identity"
};

const context = {
  contractVersion: "0.1.0",
  personalContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:run-user",
    ownerSubjectId: "run-user"
  },
  activeContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:run-user"
  }
};

function ids(prefix) {
  let n = 0;
  return () => prefix + (++n);
}

function memoryStore() {
  return createAgentRunStoreV010({
    eventStore: createMemoryAgentRunEventStoreV010(),
    eventId: ids("store-")
  });
}

function createRun(store, extra = {}) {
  return store.create({
    runId: extra.runId ?? "agent-run:test",
    principalSubjectId: principal.subjectId,
    principalActorType: principal.actorType,
    context: context.activeContext,
    sourceInteractionId: "source-interaction",
    sourceActionId: "enterprise-agent.run.start",
    input: {
      message: extra.message ?? "Inspect then answer",
      conversationHistory: [],
      locale: "en",
      providerId: extra.providerId ?? "test.llm",
      modelId: extra.modelId ?? "test-model"
    },
    createdAt: "2026-09-28T00:00:00.000Z"
  });
}

function readCatalog(interactionLog = []) {
  return (_run, _principal, _context, _requestContext, interaction) => {
    interactionLog.push(structuredClone(interaction));
    return {
      list() {
        return [{
          contractVersion: "0.1.0",
          id: "test.read",
          modelName: "test_read",
          title: "Test read",
          description: "Read test evidence.",
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
        assert.equal(call.tool, "test.read");
        return {
          tool: "test.read",
          ok: true,
          result: { value: "READ-OK" }
        };
      }
    };
  };
}

function twoStepProvider() {
  return {
    providerId: "test.llm",
    modelId: "test-model",
    async infer(request) {
      const prior = request.messages.map(message => message.content).join("\n");
      if (prior.includes("READ-OK")) {
        return {
          contractVersion: "0.1.0",
          providerId: "test.llm",
          modelId: "test-model",
          text: "done from durable observation",
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
}

function executor(store, input = {}) {
  return createResumableAgentRunExecutorV010({
    store,
    resolveProvider: input.resolveProvider ?? (() => twoStepProvider()),
    createToolCatalog: input.createToolCatalog ?? readCatalog(),
    now: input.now ?? (() => new Date("2026-09-28T00:00:01.000Z")),
    eventId: input.eventId ?? ids("exec-event-"),
    sliceId: input.sliceId ?? ids("slice-")
  });
}

test("resumable run advances one model decision per slice and completes across requests", async () => {
  const store = memoryStore();
  createRun(store);
  const interactions = [];
  const runExecutor = executor(store, {
    createToolCatalog: readCatalog(interactions)
  });

  const first = await runExecutor.resume({
    runId: "agent-run:test",
    principal,
    context
  });
  assert.equal(first.run.state, "PAUSED");
  assert.equal(first.run.sliceCount, 1);
  assert.equal(first.run.observations.length, 1);
  assert.equal(first.run.observations[0].result.value, "READ-OK");
  assert.equal(first.run.finalMessage, undefined);

  const firstEvents = store.events("agent-run:test");
  const decisionIndex = firstEvents.findIndex(
    event => event.type === "MODEL_DECISION_RECORDED"
  );
  const observationIndex = firstEvents.findIndex(
    event => event.type === "TOOL_OBSERVATION_RECORDED"
  );
  assert.ok(decisionIndex >= 0);
  assert.ok(observationIndex > decisionIndex);

  const second = await runExecutor.resume({
    runId: "agent-run:test",
    principal,
    context
  });
  assert.equal(second.run.state, "SUCCEEDED");
  assert.equal(second.run.sliceCount, 2);
  assert.equal(second.run.finalMessage, "done from durable observation");
  assert.equal(interactions[1].sourceInteractionId, "agent-run:test");
});

test("file-backed run survives service reconstruction and resumes from durable observation", async () => {
  const directory = mkdtempSync(join(tmpdir(), "agent-run-"));
  const path = join(directory, "runs.jsonl");
  const firstStore = createAgentRunStoreV010({
    eventStore: createJsonlAgentRunEventStoreV010(path),
    eventId: ids("first-store-")
  });
  createRun(firstStore);

  const firstExecutor = executor(firstStore, {
    eventId: ids("first-exec-"),
    sliceId: ids("first-slice-")
  });
  const first = await firstExecutor.resume({
    runId: "agent-run:test",
    principal,
    context
  });
  assert.equal(first.run.state, "PAUSED");

  const secondStore = createAgentRunStoreV010({
    eventStore: createJsonlAgentRunEventStoreV010(path),
    eventId: ids("second-store-")
  });
  const restored = secondStore.get("agent-run:test");
  assert.equal(restored.state, "PAUSED");
  assert.equal(restored.observations[0].result.value, "READ-OK");

  const secondExecutor = executor(secondStore, {
    eventId: ids("second-exec-"),
    sliceId: ids("second-slice-")
  });
  const second = await secondExecutor.resume({
    runId: "agent-run:test",
    principal,
    context
  });
  assert.equal(second.run.state, "SUCCEEDED");
  assert.equal(second.run.finalMessage, "done from durable observation");
});

test("crash after SLICE_STARTED resumes inside the same durable slice", async () => {
  const store = memoryStore();
  createRun(store);
  store.append({
    contractVersion: "0.1.0",
    eventId: "agent-run-event:started-before-crash",
    runId: "agent-run:test",
    type: "SLICE_STARTED",
    occurredAt: "2026-09-28T00:00:01.000Z",
    sliceId: "agent-run-slice:crash-window",
    payload: {}
  });

  const before = store.get("agent-run:test");
  assert.equal(before.state, "RUNNING");
  assert.equal(before.sliceCount, 1);
  assert.equal(before.activeSliceId, "agent-run-slice:crash-window");
  assert.equal(before.decisions.length, 0);

  const runExecutor = executor(store, {
    sliceId: () => {
      throw new Error("NEW_SLICE_MUST_NOT_BE_CREATED");
    }
  });

  const resumed = await runExecutor.resume({
    runId: "agent-run:test",
    principal,
    context
  });

  assert.equal(resumed.run.state, "PAUSED");
  assert.equal(resumed.run.sliceCount, 1);
  assert.equal(resumed.run.decisions[0].sliceId, "agent-run-slice:crash-window");
  assert.equal(resumed.run.observations.length, 1);
});

test("resume executes a durable pending tool decision without re-running model inference", async () => {
  const store = memoryStore();
  createRun(store);
  store.append({
    contractVersion: "0.1.0",
    eventId: "agent-run-event:manual-slice",
    runId: "agent-run:test",
    type: "SLICE_STARTED",
    occurredAt: "2026-09-28T00:00:01.000Z",
    sliceId: "agent-run-slice:manual",
    payload: {}
  });
  store.append({
    contractVersion: "0.1.0",
    eventId: "agent-run-event:manual-decision",
    runId: "agent-run:test",
    type: "MODEL_DECISION_RECORDED",
    occurredAt: "2026-09-28T00:00:02.000Z",
    sliceId: "agent-run-slice:manual",
    payload: {
      decision: {
        type: "tool",
        call: { tool: "test.read", arguments: {} }
      }
    }
  });

  let inferenceCount = 0;
  const runExecutor = executor(store, {
    resolveProvider: () => ({
      providerId: "test.llm",
      modelId: "test-model",
      async infer() {
        inferenceCount += 1;
        throw new Error("MODEL_SHOULD_NOT_RUN");
      }
    })
  });

  const result = await runExecutor.resume({
    runId: "agent-run:test",
    principal,
    context
  });
  assert.equal(inferenceCount, 0);
  assert.equal(result.run.state, "PAUSED");
  assert.equal(result.run.observations.length, 1);
});

test("provider mismatch blocks instead of silently switching model", async () => {
  const store = memoryStore();
  createRun(store);
  const runExecutor = executor(store, {
    resolveProvider: () => ({
      providerId: "different.provider",
      modelId: "different-model",
      async infer() {
        throw new Error("SHOULD_NOT_RUN");
      }
    })
  });

  const result = await runExecutor.resume({
    runId: "agent-run:test",
    principal,
    context
  });
  assert.equal(result.run.state, "BLOCKED");
  assert.equal(result.run.blocker.code, "AGENT_RUN_PROVIDER_UNAVAILABLE");
});

test("resume rechecks Principal and Context scope", async () => {
  const store = memoryStore();
  createRun(store);
  const runExecutor = executor(store);

  await assert.rejects(
    () => runExecutor.resume({
      runId: "agent-run:test",
      principal: { ...principal, subjectId: "other-user" },
      context
    }),
    /AGENT_RUN_SCOPE_MISMATCH/
  );

  await assert.rejects(
    () => runExecutor.resume({
      runId: "agent-run:test",
      principal,
      context: {
        ...context,
        activeContext: {
          contractVersion: "0.1.0",
          kind: "PERSONAL",
          contextId: "personal:other"
        }
      }
    }),
    /AGENT_RUN_SCOPE_MISMATCH/
  );
});

test("concurrent resume is rejected while one slice is active", async () => {
  const store = memoryStore();
  createRun(store);

  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const provider = {
    providerId: "test.llm",
    modelId: "test-model",
    async infer() {
      await gate;
      return {
        contractVersion: "0.1.0",
        providerId: "test.llm",
        modelId: "test-model",
        text: "done",
        toolCalls: [],
        usage: { inputTokens: 1, outputTokens: 1 },
        finishReason: "stop"
      };
    }
  };
  const runExecutor = executor(store, {
    resolveProvider: () => provider
  });

  const first = runExecutor.resume({
    runId: "agent-run:test",
    principal,
    context
  });
  await new Promise(resolve => setTimeout(resolve, 0));

  await assert.rejects(
    () => runExecutor.resume({
      runId: "agent-run:test",
      principal,
      context
    }),
    /AGENT_RUN_RESUME_CONFLICT/
  );

  release();
  const completed = await first;
  assert.equal(completed.run.state, "SUCCEEDED");
});

test("indeterminate resumed WRITE blocks the run fail-closed", async () => {
  const store = memoryStore();
  createRun(store);
  store.append({
    contractVersion: "0.1.0",
    eventId: "agent-run-event:write-slice",
    runId: "agent-run:test",
    type: "SLICE_STARTED",
    occurredAt: "2026-09-28T00:00:01.000Z",
    sliceId: "agent-run-slice:write",
    payload: {}
  });
  store.append({
    contractVersion: "0.1.0",
    eventId: "agent-run-event:write-decision",
    runId: "agent-run:test",
    type: "MODEL_DECISION_RECORDED",
    occurredAt: "2026-09-28T00:00:02.000Z",
    sliceId: "agent-run-slice:write",
    payload: {
      decision: {
        type: "tool",
        call: { tool: "test.write", arguments: { value: "A" } }
      }
    }
  });

  const runExecutor = executor(store, {
    createToolCatalog() {
      return {
        list() { return []; },
        async invoke() {
          return {
            tool: "test.write",
            ok: false,
            error: {
              code: "AGENT_ACTION_RECEIPT_INDETERMINATE",
              message: "prior write is indeterminate"
            }
          };
        }
      };
    }
  });

  const result = await runExecutor.resume({
    runId: "agent-run:test",
    principal,
    context
  });
  assert.equal(result.run.state, "BLOCKED");
  assert.equal(result.run.blocker.code, "AGENT_RUN_WRITE_INDETERMINATE");
});

test("crash after successful WRITE but before run observation reuses Action Receipt without duplicate side effect", async () => {
  const store = memoryStore();
  createRun(store);
  store.append({
    contractVersion: "0.1.0",
    eventId: "agent-run-event:write-slice",
    runId: "agent-run:test",
    type: "SLICE_STARTED",
    occurredAt: "2026-09-28T00:00:01.000Z",
    sliceId: "agent-run-slice:write",
    payload: {}
  });
  store.append({
    contractVersion: "0.1.0",
    eventId: "agent-run-event:write-decision",
    runId: "agent-run:test",
    type: "MODEL_DECISION_RECORDED",
    occurredAt: "2026-09-28T00:00:02.000Z",
    sliceId: "agent-run-slice:write",
    payload: {
      decision: {
        type: "tool",
        call: { tool: "test.write", arguments: { value: "A" } }
      }
    }
  });

  let receiptEvent = 0;
  const receiptService = createAgentActionReceiptServiceV010({
    store: createMemoryAgentActionReceiptEventStoreV010(),
    eventId: () => "receipt-event-" + (++receiptEvent)
  });
  const manager = createAppManagerService(
    createPackageCatalog([]),
    createMemoryLifecycleStore()
  );
  let executions = 0;

  const catalogFactory = (_run, _principal, _context, _requestContext, interaction) =>
    createEnterpriseAgentHostToolCatalogV010({
      manager,
      principal,
      context,
      listAvailableContexts() { return [context.activeContext]; },
      listProviderBindings() { return []; },
      getProviderHealth() { return { state: "UNKNOWN" }; },
      actionReceipt: {
        sourceInteractionId: interaction.sourceInteractionId,
        sourceActionId: interaction.sourceActionId,
        service: receiptService,
        now: () => new Date("2026-09-28T00:00:03.000Z")
      },
      searchHelp() { return []; },
      authorizeWrite() { return { allowed: true }; }
    }, [{
      descriptor: {
        contractVersion: "0.1.0",
        id: "test.write",
        modelName: "test_write",
        title: "Test write",
        description: "Write exactly once.",
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
        executions += 1;
        return { objectId: "object:" + args.value };
      }
    }]);

  const runBeforeCrash = store.get("agent-run:test");
  const decision = runBeforeCrash.decisions[0];
  const preCrashCatalog = catalogFactory(
    runBeforeCrash,
    principal,
    context,
    undefined,
    {
      sourceInteractionId: runBeforeCrash.runId,
      sourceActionId: decision.decisionEventId
    }
  );
  const writeObservation = await preCrashCatalog.invoke(
    decision.decision.call,
    []
  );
  assert.equal(writeObservation.ok, true);
  assert.equal(writeObservation.receipt.status, "SUCCEEDED");
  assert.equal(executions, 1);

  const runExecutor = executor(store, {
    createToolCatalog: catalogFactory
  });
  const resumed = await runExecutor.resume({
    runId: "agent-run:test",
    principal,
    context
  });
  assert.equal(executions, 1);
  assert.equal(resumed.run.state, "PAUSED");
  assert.equal(
    resumed.run.observations[0].result.replayedFromReceipt,
    true
  );
  assert.equal(resumed.run.actionReceiptIds.length, 1);
});

test("run action handlers start, get and resume without resending original task", async () => {
  const store = memoryStore();
  const runExecutor = executor(store);
  const handlers = createPersonalAgentRunActionHandlersV010({
    runStore: store,
    runExecutor,
    resolveLlmProvider() {
      return { installedProviderIds: ["test.llm"], provider: twoStepProvider() };
    },
    resolveIdentitySession() {
      return {
        contractVersion: "0.1.0",
        sessionId: "session:test",
        principal,
        defaultContext: context.activeContext
      };
    },
    resolveContext() { return context; },
    createToolCatalog: readCatalog(),
    runId: () => "from-action",
    now: () => new Date("2026-09-28T00:00:00.000Z")
  });
  const byCode = new Map(handlers.map(handler => [handler.commandCode, handler]));

  const baseRequest = {
    contractVersion: "0.1.0",
    type: "command",
    sourceInteractionId: "ui:1",
    actionId: "action:1",
    requiresConfirmation: false
  };

  const started = await byCode.get("enterprise-agent.run.start").execute({
    ...baseRequest,
    command: { code: "enterprise-agent.run.start", inputVersion: "0.1.0" },
    values: { message: "Inspect then answer" }
  });
  assert.equal(started.ok, true);
  assert.equal(started.result.run.runId, "agent-run:from-action");
  assert.equal(started.result.run.state, "PAUSED");

  const got = await byCode.get("enterprise-agent.run.get").execute({
    ...baseRequest,
    command: { code: "enterprise-agent.run.get", inputVersion: "0.1.0" },
    values: { runId: "agent-run:from-action" }
  });
  assert.equal(got.ok, true);
  assert.equal(got.result.run.state, "PAUSED");

  const resumed = await byCode.get("enterprise-agent.run.resume").execute({
    ...baseRequest,
    sourceInteractionId: "ui:2",
    actionId: "action:2",
    command: { code: "enterprise-agent.run.resume", inputVersion: "0.1.0" },
    values: { runId: "agent-run:from-action" }
  });
  assert.equal(resumed.ok, true);
  assert.equal(resumed.result.run.state, "SUCCEEDED");
  assert.equal(
    resumed.result.run.finalMessage,
    "done from durable observation"
  );
});
