import test from "node:test";
import assert from "node:assert/strict";

import {
  createConversationThreadStoreV010,
  createMemoryConversationThreadEventStoreV010
} from "../../dist/manager/conversation-thread-store.js";
import {
  createAgentRunStoreV010,
  createMemoryAgentRunEventStoreV010
} from "../../dist/manager/agent-run-store.js";
import {
  createResumableAgentRunExecutorV010
} from "../../dist/agents/enterprise-agent/run-runtime.js";
import {
  createThreadBackedAgentTurnActionHandlersV010
} from "../../dist/agents/enterprise-agent/thread-turn-action-handlers.js";

const principal = {
  contractVersion: "0.1.0",
  subjectId: "thread-turn-user",
  actorType: "HUMAN",
  identityProviderId: "test.identity"
};

const context = {
  contractVersion: "0.1.0",
  personalContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:thread-turn-user",
    ownerSubjectId: "thread-turn-user"
  },
  activeContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:thread-turn-user"
  }
};

function ids(prefix) {
  let n = 0;
  return () => prefix + (++n);
}

function request(code, values) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code, inputVersion: "0.1.0" },
    values,
    sourceInteractionId: "eidos:test",
    actionId: code,
    requiresConfirmation: false
  };
}

function harness() {
  const threadStore = createConversationThreadStoreV010({
    eventStore: createMemoryConversationThreadEventStoreV010(),
    eventId: ids("thread-event-")
  });
  threadStore.create({
    threadId: "conversation-thread:1",
    principalSubjectId: principal.subjectId,
    principalActorType: principal.actorType,
    context: context.activeContext,
    createdAt: "2026-09-28T02:00:00.000Z"
  });

  const runStore = createAgentRunStoreV010({
    eventStore: createMemoryAgentRunEventStoreV010(),
    eventId: ids("run-store-event-")
  });

  const providerInputs = [];
  const provider = {
    providerId: "test.llm",
    modelId: "thread-model",
    async infer(input) {
      providerInputs.push(structuredClone(input));
      const messages = input.messages.map(item => item.content).join("\n");
      const latestUser = [...input.messages].reverse()
        .find(item => item.role === "user")?.content ?? "";

      if (messages.includes("tool-result:ok")) {
        return {
          contractVersion: "0.1.0",
          providerId: "test.llm",
          modelId: "thread-model",
          text: latestUser.includes("second")
            ? "second final"
            : "first final",
          toolCalls: [],
          usage: { inputTokens: 1, outputTokens: 1 },
          finishReason: "stop"
        };
      }
      return {
        contractVersion: "0.1.0",
        providerId: "test.llm",
        modelId: "thread-model",
        text: "",
        toolCalls: [{
          name: "test_read",
          arguments: {}
        }],
        usage: { inputTokens: 1, outputTokens: 1 },
        finishReason: "tool_calls"
      };
    }
  };

  const runExecutor = createResumableAgentRunExecutorV010({
    store: runStore,
    resolveProvider: () => provider,
    createToolCatalog() {
      return {
        list() {
          return [{
            contractVersion: "0.1.0",
            id: "test.read",
            modelName: "test_read",
            title: "Test read",
            description: "Test read.",
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
          return {
            tool: call.tool,
            ok: true,
            result: { value: "tool-result:ok" }
          };
        }
      };
    },
    eventId: ids("executor-event-"),
    sliceId: ids("slice-"),
    now: (() => {
      let ms = 0;
      return () => new Date(Date.parse("2026-09-28T02:00:01.000Z") + (++ms));
    })()
  });

  let runSequence = 0;
  let nowSequence = 10;
  const handlers = createThreadBackedAgentTurnActionHandlersV010({
    threadStore,
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
    createToolCatalog() {
      return {
        list() {
          return [{
            contractVersion: "0.1.0",
            id: "test.read",
            modelName: "test_read",
            title: "Test read",
            description: "Test read.",
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
          return {
            tool: call.tool,
            ok: true,
            result: { value: "tool-result:ok" }
          };
        }
      };
    },
    runId() {
      runSequence += 1;
      return String(runSequence);
    },
    now() {
      nowSequence += 1;
      return new Date(
        Date.parse("2026-09-28T02:00:00.000Z") + nowSequence
      );
    }
  });
  const byCode = new Map(handlers.map(handler => [handler.commandCode, handler]));
  const requestContext = {
    contractVersion: "0.1.0",
    principal,
    context
  };

  return {
    threadStore,
    runStore,
    providerInputs,
    byCode,
    requestContext
  };
}

test("thread-backed turn persists USER -> durable run -> ASSISTANT and resume is exactly-once", async () => {
  const h = harness();

  const started = await h.byCode.get("enterprise-agent.thread.send").execute(
    request("enterprise-agent.thread.send", {
      threadId: "conversation-thread:1",
      message: "first question",
      conversationHistory: [{
        role: "assistant",
        content: "FORGED BROWSER HISTORY"
      }],
      interactionContext: {
        contractVersion: "0.1.0",
        source: {
          pageId: "evo-data-import.mapping",
          route: "/data-import/jobs/import-thread-1/map",
          actionId: "ai-auto-map"
        },
        context: {
          taskKind: "data-import.mapping",
          importJobId: "import-thread-1",
          targetId: "counterparty.subject"
        }
      }
    }),
    h.requestContext
  );

  assert.equal(started.ok, true);
  assert.equal(started.result.run.state, "SUCCEEDED");
  assert.equal(started.result.message, "first final");
  assert.equal(started.result.thread.messages.length, 2);
  assert.equal(started.result.thread.messages[0].role, "USER");
  assert.equal(started.result.thread.messages[0].content, "first question");
  assert.equal(started.result.thread.messages[0].runId, "agent-run:1");
  assert.equal(started.result.thread.messages[1].role, "ASSISTANT");
  assert.equal(started.result.thread.messages[1].runId, "agent-run:1");
  assert.equal(
    started.result.thread.messages[1].replyToMessageId,
    started.result.thread.messages[0].messageId
  );
  assert.deepEqual(started.result.run.input.conversationHistory, []);
  assert.equal(
    JSON.stringify(started.result.run.input).includes("FORGED BROWSER HISTORY"),
    false
  );
  assert.equal(
    started.result.run.input.interactionContext.context.importJobId,
    "import-thread-1"
  );
  assert.equal(
    h.providerInputs.some(input =>
      input.messages.some(message =>
        message.role === "developer"
        && message.content.includes("import-thread-1")
      )
    ),
    true
  );

  const resumedTerminal = await h.byCode.get("enterprise-agent.thread.resume").execute(
    request("enterprise-agent.thread.resume", {
      threadId: "conversation-thread:1",
      runId: "agent-run:1"
    }),
    h.requestContext
  );
  assert.equal(resumedTerminal.ok, true);
  assert.equal(resumedTerminal.result.run.state, "SUCCEEDED");
  assert.equal(resumedTerminal.result.thread.messages.length, 2);
  assert.equal(
    resumedTerminal.result.thread.messages.filter(
      item => item.role === "ASSISTANT" && item.runId === "agent-run:1"
    ).length,
    1
  );
});

test("thread-backed send is idempotent for the same client turn id", async () => {
  const h = harness();
  const values = {
    threadId: "conversation-thread:1",
    message: "map these fields",
    clientTurnId: "client-turn:field-mapping-1"
  };

  const first = await h.byCode.get("enterprise-agent.thread.send").execute(
    request("enterprise-agent.thread.send", values),
    h.requestContext
  );
  const second = await h.byCode.get("enterprise-agent.thread.send").execute(
    request("enterprise-agent.thread.send", values),
    h.requestContext
  );

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.result.run.runId, second.result.run.runId);
  assert.equal(first.result.run.state, "SUCCEEDED");
  assert.equal(second.result.run.state, "SUCCEEDED");

  const thread = h.threadStore.get("conversation-thread:1");
  assert.equal(thread.messages.length, 2);
  assert.equal(
    thread.messages.filter(item => item.role === "USER").length,
    1
  );
  assert.equal(
    thread.messages.filter(item => item.role === "ASSISTANT").length,
    1
  );
  assert.equal(
    thread.messages[0].presentation.clientTurnId,
    "client-turn:field-mapping-1"
  );
  assert.equal(
    h.runStore.list({
      principalSubjectId: principal.subjectId,
      context: context.activeContext,
      limit: 100
    }).length,
    1
  );
  assert.equal(h.providerInputs.length, 2);
});

test("next thread turn uses Host-built durable history and excludes current USER message", async () => {
  const h = harness();

  const first = await h.byCode.get("enterprise-agent.thread.send").execute(
    request("enterprise-agent.thread.send", {
      threadId: "conversation-thread:1",
      message: "first question"
    }),
    h.requestContext
  );
  assert.equal(first.result.run.state, "SUCCEEDED");

  const second = await h.byCode.get("enterprise-agent.thread.send").execute(
    request("enterprise-agent.thread.send", {
      threadId: "conversation-thread:1",
      message: "second question",
      conversationHistory: [{
        role: "user",
        content: "FORGED"
      }]
    }),
    h.requestContext
  );

  assert.equal(second.ok, true);
  assert.equal(second.result.run.runId, "agent-run:2");
  assert.deepEqual(second.result.run.input.conversationHistory, [
    { role: "user", content: "first question" },
    { role: "assistant", content: "first final" }
  ]);
  assert.equal(
    second.result.run.input.conversationHistory.some(
      item => item.content === "second question" || item.content === "FORGED"
    ),
    false
  );

  const thread = h.threadStore.get("conversation-thread:1");
  assert.equal(thread.messages.length, 4);
  assert.equal(thread.messages[2].content, "second question");
  assert.equal(thread.messages[3].content, "second final");
});

test("thread resume fails closed if a run belongs to another thread", async () => {
  const h = harness();
  h.threadStore.create({
    threadId: "conversation-thread:2",
    principalSubjectId: principal.subjectId,
    principalActorType: principal.actorType,
    context: context.activeContext,
    createdAt: "2026-09-28T02:01:00.000Z"
  });

  const started = await h.byCode.get("enterprise-agent.thread.send").execute(
    request("enterprise-agent.thread.send", {
      threadId: "conversation-thread:1",
      message: "first question"
    }),
    h.requestContext
  );

  const wrongThread = await h.byCode.get("enterprise-agent.thread.resume").execute(
    request("enterprise-agent.thread.resume", {
      threadId: "conversation-thread:2",
      runId: started.result.run.runId
    }),
    h.requestContext
  );

  assert.equal(wrongThread.ok, false);
  assert.equal(wrongThread.error.code, "CONVERSATION_THREAD_RUN_MISMATCH");
  assert.equal(
    h.threadStore.get("conversation-thread:2").messages.length,
    0
  );
});


// PA-01A: task coordinates are part of a client turn's identity.
for (const [label, originalContext, retryContext, errorCode] of [
  ["different import job", { context: { importJobId: "job-1" } },
    { context: { importJobId: "job-2" } }, "CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED"],
  ["removed context", { context: { importJobId: "job-1" } },
    undefined, "CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED"],
  ["added context", undefined, { context: { importJobId: "job-1" } },
    "CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED"],
  ["changed reference order", { refs: ["a", "b"] }, { refs: ["b", "a"] },
    "CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED"],
  ["malformed context", undefined, "not-an-object",
    "PERSONAL_AGENT_INTERACTION_CONTEXT_INVALID"]
]) {
  test(`client turn retry rejects ${label} without new effects`, async () => {
    const h = harness();
    const values = {
      threadId: "conversation-thread:1",
      message: "map these fields",
      clientTurnId: "client-turn:context-identity",
      ...(originalContext === undefined ? {} : { interactionContext: originalContext })
    };
    const send = input => h.byCode.get("enterprise-agent.thread.send").execute(
      request("enterprise-agent.thread.send", input), h.requestContext
    );
    const first = await send(values);
    assert.equal(first.ok, true);
    const beforeCalls = h.providerInputs.length;
    const beforeEvents = h.runStore.events(first.result.run.runId);
    const beforeThread = h.threadStore.get(values.threadId);
    const retry = await send({ ...values, interactionContext: retryContext });
    assert.equal(retry.ok, false);
    assert.equal(retry.error.code, errorCode);
    assert.equal(h.providerInputs.length, beforeCalls);
    assert.deepEqual(h.runStore.events(first.result.run.runId), beforeEvents);
    assert.deepEqual(h.threadStore.get(values.threadId), beforeThread);
    assert.equal(h.runStore.list({
      principalSubjectId: principal.subjectId, context: context.activeContext, limit: 100
    }).length, 1);
  });
}

test("client turn retry accepts equivalent context with different JSON key order", async () => {
  const h = harness();
  const values = {
    threadId: "conversation-thread:1",
    message: "map these fields",
    clientTurnId: "client-turn:ordered-context",
    interactionContext: {
      source: { pageId: "mapping", actionId: "ai-auto-map" },
      context: { taskKind: "data-import.mapping", importJobId: "job-1" }
    }
  };
  const send = input => h.byCode.get("enterprise-agent.thread.send").execute(
    request("enterprise-agent.thread.send", input), h.requestContext
  );
  const first = await send(values);
  assert.equal(first.ok, true);
  const beforeCalls = h.providerInputs.length;
  const second = await send({ ...values, interactionContext: {
    context: { importJobId: "job-1", taskKind: "data-import.mapping" },
    source: { actionId: "ai-auto-map", pageId: "mapping" }
  } });
  assert.equal(second.ok, true);
  assert.equal(second.result.run.runId, first.result.run.runId);
  assert.equal(h.providerInputs.length, beforeCalls);
  assert.equal(h.threadStore.get(values.threadId).messages.length, 2);
});

function assistanceEnvelope(overrides = {}) {
  return {
    contractVersion: "0.1.0", requestId: "assist:mapping-1",
    taskKind: "data-import.mapping", userIntent: "map these fields",
    source: { pageId: "mapping", actionId: "ai-auto-map",
      resourceRef: "import-job:1", resourceRevision: "17" },
    context: { importJobId: "job-1", targetId: "counterparty.subject" },
    ...overrides
  };
}

test("versioned assistance uses the existing durable turn and returns correlated source on send and resume", async () => {
  const h = harness();
  const envelope = assistanceEnvelope();
  const values = { threadId: "conversation-thread:1", assistanceRequest: envelope };
  const send = input => h.byCode.get("enterprise-agent.thread.send").execute(
    request("enterprise-agent.thread.send", input), h.requestContext
  );
  const first = await send(values);
  assert.equal(first.ok, true);
  assert.deepEqual(first.result.run.input.assistanceRequest, envelope);
  assert.equal(first.result.run.input.interactionContext.context.importJobId, "job-1");
  assert.equal(first.result.run.input.interactionContext.context.taskKind, "data-import.mapping");
  assert.equal(first.result.thread.messages[0].content, envelope.userIntent);
  assert.equal(first.result.thread.messages[0].presentation.clientTurnId, envelope.requestId);
  assert.deepEqual(first.result.assistanceResult, {
    contractVersion: "0.1.0", requestId: envelope.requestId, taskKind: envelope.taskKind,
    source: envelope.source, runId: first.result.run.runId, runState: "SUCCEEDED",
    actionReceiptIds: []
  });
  const beforeCalls = h.providerInputs.length;
  const again = await send(values);
  assert.equal(again.ok, true);
  assert.equal(again.result.run.runId, first.result.run.runId);
  assert.equal(h.providerInputs.length, beforeCalls);
  const resumed = await h.byCode.get("enterprise-agent.thread.resume").execute(
    request("enterprise-agent.thread.resume", { threadId: values.threadId, runId: first.result.run.runId }), h.requestContext
  );
  assert.equal(resumed.ok, true);
  assert.deepEqual(resumed.result.assistanceResult, first.result.assistanceResult);
  // The envelope is task data; it neither changes Host scope nor invents a write receipt.
  assert.deepEqual(first.result.run.context, context.activeContext);
  assert.equal("effects" in first.result.assistanceResult, false);
});

for (const [label, values, code] of [
  ["unknown version", { assistanceRequest: assistanceEnvelope({ contractVersion: "9.0.0" }) }, "PERSONAL_AGENT_ASSISTANCE_VERSION_UNSUPPORTED"],
  ["forged principal field", { assistanceRequest: assistanceEnvelope({ principalSubjectId: "admin" }) }, "PERSONAL_AGENT_ASSISTANCE_REQUEST_INVALID"],
  ["conflicting intent", { assistanceRequest: assistanceEnvelope(), message: "different" }, "PERSONAL_AGENT_ASSISTANCE_INPUT_CONFLICT"],
  ["conflicting request id", { assistanceRequest: assistanceEnvelope(), clientTurnId: "other" }, "PERSONAL_AGENT_ASSISTANCE_INPUT_CONFLICT"],
  ["mixed context transports", { assistanceRequest: assistanceEnvelope(), interactionContext: {} }, "PERSONAL_AGENT_ASSISTANCE_INPUT_CONFLICT"],
  ["revision without resource", { assistanceRequest: assistanceEnvelope({ source: { pageId: "x", actionId: "y", resourceRevision: "1" } }) }, "PERSONAL_AGENT_ASSISTANCE_REQUEST_INVALID"],
  ["conflicting task kind", { assistanceRequest: assistanceEnvelope({ context: { taskKind: "another" } }) }, "PERSONAL_AGENT_ASSISTANCE_REQUEST_INVALID"],
  ["non-finite JSON value", { assistanceRequest: assistanceEnvelope({ context: { score: Infinity } }) }, "PERSONAL_AGENT_ASSISTANCE_REQUEST_INVALID"],
  ["oversize envelope", { assistanceRequest: assistanceEnvelope({ context: { sample: "x".repeat(16001) } }) }, "PERSONAL_AGENT_ASSISTANCE_REQUEST_TOO_LARGE"]
]) {
  test(`assistance rejects ${label} before creating any task or model call`, async () => {
    const h = harness();
    const result = await h.byCode.get("enterprise-agent.thread.send").execute(
      request("enterprise-agent.thread.send", { threadId: "conversation-thread:1", ...values }), h.requestContext
    );
    assert.equal(result.ok, false);
    assert.equal(result.error.code, code);
    assert.equal(h.providerInputs.length, 0);
    assert.equal(h.threadStore.get("conversation-thread:1").messages.length, 0);
    assert.equal(h.runStore.list({principalSubjectId: principal.subjectId, context: context.activeContext}).length, 0);
  });
}

test("assistance retry cannot silently change source revision or lose its envelope", async () => {
  const h = harness();
  const envelope = assistanceEnvelope();
  const send = values => h.byCode.get("enterprise-agent.thread.send").execute(
    request("enterprise-agent.thread.send", { threadId: "conversation-thread:1", ...values }), h.requestContext
  );
  const first = await send({ assistanceRequest: envelope });
  assert.equal(first.ok, true);
  const beforeCalls = h.providerInputs.length;
  for (const values of [
    { assistanceRequest: assistanceEnvelope({ source: { ...envelope.source, resourceRevision: "18" } }) },
    { message: envelope.userIntent, clientTurnId: envelope.requestId,
      interactionContext: first.result.run.input.interactionContext }
  ]) {
    const result = await send(values);
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED");
  }
  assert.equal(h.providerInputs.length, beforeCalls);
  assert.equal(h.threadStore.get("conversation-thread:1").messages.length, 2);
});

test("assistance envelope survives durable event materialization and caller mutation", async () => {
  const h = harness();
  const envelope = assistanceEnvelope();
  const expected = structuredClone(envelope);
  const result = await h.byCode.get("enterprise-agent.thread.send").execute(
    request("enterprise-agent.thread.send", { threadId: "conversation-thread:1", assistanceRequest: envelope }), h.requestContext
  );
  assert.equal(result.ok, true);
  envelope.source.resourceRef = "changed-after-send";
  envelope.context.importJobId = "changed-after-send";
  result.result.assistanceResult.source.resourceRef = "changed-after-reply";
  const serializedEvents = JSON.parse(JSON.stringify(h.runStore.events(result.result.run.runId)));
  const restored = createAgentRunStoreV010({
    eventStore: createMemoryAgentRunEventStoreV010(serializedEvents), eventId: ids("restored-")
  });
  assert.deepEqual(restored.get(result.result.run.runId).input.assistanceRequest, expected);
  assert.equal(restored.get(result.result.run.runId).state, "SUCCEEDED");
});

test("assistance rejects excessive nesting and prototype keys without executing", async () => {
  let deep = {};
  for(let i=0;i<20;i++) deep = { nested: deep };
  for (const invalidContext of [deep, JSON.parse('{"__proto__":{"admin":true}}')]) {
    const h = harness();
    const result = await h.byCode.get("enterprise-agent.thread.send").execute(
      request("enterprise-agent.thread.send", { threadId: "conversation-thread:1", assistanceRequest: assistanceEnvelope({ context: invalidContext }) }), h.requestContext
    );
    assert.equal(result.ok, false);
    assert.equal(result.error.code, "PERSONAL_AGENT_ASSISTANCE_REQUEST_INVALID");
    assert.equal(h.providerInputs.length, 0);
    assert.equal(h.threadStore.get("conversation-thread:1").messages.length, 0);
  }
});
