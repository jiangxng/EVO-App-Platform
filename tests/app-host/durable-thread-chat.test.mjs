import test from "node:test";
import assert from "node:assert/strict";

import {
  archiveConversationThreadV010,
  createConversationThreadV010,
  executeThreadBackedChatV010,
  getConversationThreadV010,
  listConversationThreadsV010,
  recoverThreadBackedChatV010,
  transcriptFromThreadV010
} from "../../dist/vendor/eidos/src/app-host/personal-agent-thread-chat.js";

function request(message = "hello") {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    values: {
      message,
      activeContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:test"
      },
      conversationHistory: [{
        role: "assistant",
        content: "browser-local history must not be authoritative"
      }],
      clientTurnId: "client-turn:test"
    },
    sourceInteractionId: "enterprise-agent.home",
    actionId: "chat.send",
    requiresConfirmation: false
  };
}

function message(messageId, role, content, runId) {
  return {
    messageId,
    role,
    content,
    createdAt: "2026-09-28T03:00:00.000Z",
    ...(runId ? { runId } : {})
  };
}

function thread(messages = []) {
  return {
    threadId: "conversation-thread:1",
    sourceInteractionId: "enterprise-agent.home",
    updatedAt: "2026-09-28T03:00:00.000Z",
    messages
  };
}

function run(state) {
  return {
    runId: "agent-run:1",
    state
  };
}

test("thread transcript recreates rich assistant presentation and visible user discourse", () => {
  const value = transcriptFromThreadV010(thread([
    message("u1", "USER", "hello", "agent-run:1"),
    {
      ...message("a1", "ASSISTANT", "answer", "agent-run:1"),
      presentation: {
        messageParts: [
          { type: "text", text: "answer" },
          { type: "activity", label: "Memory", state: "complete" }
        ]
      }
    }
  ]));

  assert.deepEqual(value, [
    {
      id: "u1",
      contractVersion: "0.2.0",
      role: "user",
      parts: [{ type: "text", text: "hello" }]
    },
    {
      id: "a1",
      contractVersion: "0.2.0",
      role: "assistant",
      parts: [
        { type: "text", text: "answer" },
        { type: "activity", label: "Memory", state: "complete" }
      ]
    }
  ]);
});

test("thread-backed Chat resolves Host thread, sends one turn and auto-resumes to durable transcript", async () => {
  const calls = [];
  const empty = thread([]);
  const afterUser = thread([
    message("u1", "USER", "hello", "agent-run:1")
  ]);
  const completed = thread([
    message("u1", "USER", "hello", "agent-run:1"),
    {
      ...message("a1", "ASSISTANT", "done", "agent-run:1"),
      replyToMessageId: "u1",
      presentation: {
        messageParts: [{ type: "text", text: "done" }]
      }
    }
  ]);
  const actionHost = {
    async execute(value) {
      calls.push(structuredClone(value));
      switch (value.command.code) {
        case "enterprise-agent.thread.list":
          return { ok: true, result: { threads: [] } };
        case "enterprise-agent.thread.create":
          return { ok: true, result: { thread: empty } };
        case "enterprise-agent.thread.send":
          assert.equal(value.values.threadId, "conversation-thread:1");
          assert.equal(value.values.message, "hello");
          assert.equal(value.values.clientTurnId, "client-turn:test");
          assert.equal("conversationHistory" in value.values, false);
          return {
            ok: true,
            result: {
              thread: afterUser,
              run: run("PAUSED")
            }
          };
        case "enterprise-agent.thread.resume":
          return {
            ok: true,
            result: {
              thread: completed,
              run: run("SUCCEEDED"),
              message: "done",
              messageParts: [{ type: "text", text: "done" }]
            }
          };
        default:
          throw new Error("unexpected command " + value.command.code);
      }
    }
  };

  const execution = await executeThreadBackedChatV010({
    actionHost,
    request: request()
  });

  assert.equal(execution.mode, "THREAD");
  assert.equal(execution.threadId, "conversation-thread:1");
  assert.equal(execution.runState, "SUCCEEDED");
  assert.equal(execution.resumeCount, 1);
  assert.deepEqual(
    calls.map(call => call.command.code),
    [
      "enterprise-agent.thread.list",
      "enterprise-agent.thread.create",
      "enterprise-agent.thread.send",
      "enterprise-agent.thread.resume"
    ]
  );
  assert.deepEqual(
    execution.transcript.map(item => [item.role, item.parts[0].text]),
    [
      ["user", "hello"],
      ["assistant", "done"]
    ]
  );
});

test("fresh browser recovery discovers latest matching Host thread and resumes unanswered turn", async () => {
  const calls = [];
  const pending = thread([
    message("u1", "USER", "persisted question", "agent-run:1")
  ]);
  const completed = thread([
    message("u1", "USER", "persisted question", "agent-run:1"),
    message("a1", "ASSISTANT", "persisted answer", "agent-run:1")
  ]);
  const actionHost = {
    async execute(value) {
      calls.push(structuredClone(value));
      if (value.command.code === "enterprise-agent.thread.list") {
        return {
          ok: true,
          result: {
            threads: [
              {
                threadId: "conversation-thread:other",
                sourceInteractionId: "other-surface",
                messages: []
              },
              pending
            ]
          }
        };
      }
      if (value.command.code === "enterprise-agent.thread.resume") {
        assert.equal(value.values.threadId, "conversation-thread:1");
        assert.equal(value.values.runId, "agent-run:1");
        return {
          ok: true,
          result: {
            thread: completed,
            run: run("SUCCEEDED"),
            message: "persisted answer"
          }
        };
      }
      throw new Error("unexpected command " + value.command.code);
    }
  };

  const recovered = await recoverThreadBackedChatV010({
    actionHost,
    request: request("")
  });

  assert.equal(recovered.threadId, "conversation-thread:1");
  assert.equal(recovered.runState, "SUCCEEDED");
  assert.deepEqual(
    calls.map(call => call.command.code),
    [
      "enterprise-agent.thread.list",
      "enterprise-agent.thread.resume"
    ]
  );
  assert.deepEqual(
    recovered.transcript.map(item => item.id),
    ["u1", "a1"]
  );
});

test("thread recovery with persisted threadId uses Host get and never needs browser transcript", async () => {
  const calls = [];
  const durable = thread([
    message("u1", "USER", "old question", "agent-run:1"),
    message("a1", "ASSISTANT", "old answer", "agent-run:1")
  ]);
  const actionHost = {
    async execute(value) {
      calls.push(structuredClone(value));
      assert.equal(value.command.code, "enterprise-agent.thread.get");
      assert.equal(value.values.threadId, "conversation-thread:1");
      return { ok: true, result: { thread: durable } };
    }
  };

  const recovered = await recoverThreadBackedChatV010({
    actionHost,
    request: request(""),
    threadId: "conversation-thread:1"
  });

  assert.equal(recovered.threadId, "conversation-thread:1");
  assert.equal(recovered.runId, undefined);
  assert.equal(recovered.transcript.length, 2);
  assert.deepEqual(
    calls.map(call => call.command.code),
    ["enterprise-agent.thread.get"]
  );
});

test("thread-backed adapter yields undefined only when thread actions are unavailable so run fallback can take over", async () => {
  const actionHost = {
    async execute() {
      return {
        ok: false,
        error: {
          code: "ACTION_HANDLER_NOT_FOUND",
          message: "thread actions not installed"
        }
      };
    }
  };

  const execution = await executeThreadBackedChatV010({
    actionHost,
    request: request()
  });
  const recovery = await recoverThreadBackedChatV010({
    actionHost,
    request: request("")
  });

  assert.equal(execution, undefined);
  assert.equal(recovery, undefined);
});


test("P1.8C thread management lists active+archived, creates a truly fresh thread, switches by exact get and archives through Host", async () => {
  const calls = [];
  const active = {
    ...thread([message("u-active", "USER", "active discourse")]),
    threadId: "conversation-thread:active",
    state: "ACTIVE",
    title: "Active"
  };
  const archived = {
    ...thread([message("u-archived", "USER", "archived discourse")]),
    threadId: "conversation-thread:archived",
    state: "ARCHIVED",
    title: "Archived",
    archivedAt: "2026-09-20T00:00:00.000Z"
  };
  const fresh = {
    ...thread([]),
    threadId: "conversation-thread:fresh",
    state: "ACTIVE"
  };
  const archivedActive = {
    ...active,
    state: "ARCHIVED",
    archivedAt: "2026-09-28T04:00:00.000Z"
  };

  const actionHost = {
    async execute(value) {
      calls.push(structuredClone(value));
      switch (value.command.code) {
        case "enterprise-agent.thread.list":
          assert.equal(value.values.includeArchived, true);
          return { ok: true, result: { threads: [active, archived] } };
        case "enterprise-agent.thread.create":
          return { ok: true, result: { thread: fresh } };
        case "enterprise-agent.thread.get":
          assert.equal(value.values.threadId, "conversation-thread:archived");
          return { ok: true, result: { thread: archived } };
        case "enterprise-agent.thread.archive":
          assert.equal(value.values.threadId, "conversation-thread:active");
          return { ok: true, result: { thread: archivedActive } };
        default:
          throw new Error("unexpected command " + value.command.code);
      }
    }
  };

  const options = {
    actionHost,
    request: request("")
  };

  const listed = await listConversationThreadsV010({
    ...options,
    includeArchived: true
  });
  assert.equal(listed.unavailable, false);
  assert.deepEqual(
    listed.threads.map(item => [item.threadId, item.state]),
    [
      ["conversation-thread:active", "ACTIVE"],
      ["conversation-thread:archived", "ARCHIVED"]
    ]
  );

  const created = await createConversationThreadV010(options);
  assert.equal(created.thread.threadId, "conversation-thread:fresh");
  assert.equal(created.thread.messages.length, 0);

  const got = await getConversationThreadV010(
    options,
    "conversation-thread:archived"
  );
  assert.equal(got.thread.state, "ARCHIVED");
  assert.equal(got.thread.messages[0].content, "archived discourse");

  const archivedResult = await archiveConversationThreadV010(
    options,
    "conversation-thread:active"
  );
  assert.equal(archivedResult.thread.state, "ARCHIVED");

  assert.deepEqual(
    calls.map(call => call.command.code),
    [
      "enterprise-agent.thread.list",
      "enterprise-agent.thread.create",
      "enterprise-agent.thread.get",
      "enterprise-agent.thread.archive"
    ]
  );
});

test("P1.8C explicit New Chat never lists or reuses an earlier sourceInteraction thread", async () => {
  const calls = [];
  const fresh = {
    ...thread([]),
    threadId: "conversation-thread:new-chat",
    state: "ACTIVE"
  };
  const actionHost = {
    async execute(value) {
      calls.push(structuredClone(value));
      assert.equal(value.command.code, "enterprise-agent.thread.create");
      return { ok: true, result: { thread: fresh } };
    }
  };

  const created = await createConversationThreadV010({
    actionHost,
    request: request("")
  });

  assert.equal(created.thread.threadId, "conversation-thread:new-chat");
  assert.deepEqual(
    calls.map(call => call.command.code),
    ["enterprise-agent.thread.create"]
  );
});


test("P1.8C archived thread recovery is read-only and never resumes an unanswered run", async () => {
  const calls = [];
  const archivedPending = {
    ...thread([
      message("u1", "USER", "unanswered before archive", "agent-run:1")
    ]),
    state: "ARCHIVED",
    archivedAt: "2026-09-28T04:30:00.000Z"
  };
  const actionHost = {
    async execute(value) {
      calls.push(structuredClone(value));
      if (value.command.code === "enterprise-agent.thread.get") {
        return { ok: true, result: { thread: archivedPending } };
      }
      throw new Error("archived recovery must not resume");
    }
  };

  const recovered = await recoverThreadBackedChatV010({
    actionHost,
    request: request(""),
    threadId: "conversation-thread:1"
  });

  assert.equal(recovered.thread.state, "ARCHIVED");
  assert.equal(recovered.runId, undefined);
  assert.deepEqual(
    calls.map(call => call.command.code),
    ["enterprise-agent.thread.get"]
  );
  assert.equal(recovered.transcript.length, 1);
});
