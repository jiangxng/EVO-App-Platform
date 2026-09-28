import test from "node:test";
import assert from "node:assert/strict";

import {
  executeRunBackedChatV010,
  recoverRunBackedChatV010
} from "../../dist/vendor/eidos/src/app-host/personal-agent-run-chat.js";

function request() {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    values: {
      message: "inspect then answer",
      activeContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:test"
      },
      conversationHistory: [
        { role: "user", content: "earlier" }
      ]
    },
    sourceInteractionId: "enterprise-agent.home",
    actionId: "chat.send",
    requiresConfirmation: false
  };
}

function response(run, extra = {}) {
  return {
    ok: true,
    result: {
      run,
      ...extra
    }
  };
}

function run(state, extra = {}) {
  return {
    runId: "agent-run:1",
    state,
    sourceInteractionId: "enterprise-agent.home",
    sourceActionId: "chat.run.start",
    sliceCount: extra.sliceCount ?? 1,
    ...extra
  };
}

test("run-backed Chat starts once and automatically resumes bounded slices to success", async () => {
  const calls = [];
  const queue = [
    response(run("PAUSED", { sliceCount: 1 })),
    response(run("PAUSED", { sliceCount: 2 })),
    response(run("SUCCEEDED", { sliceCount: 3, finalMessage: "done" }), {
      message: "done",
      messageParts: [{ type: "text", text: "done" }]
    })
  ];
  const progress = [];
  const actionHost = {
    async execute(value) {
      calls.push(structuredClone(value));
      return queue.shift();
    }
  };

  const execution = await executeRunBackedChatV010({
    actionHost,
    request: request(),
    onProgress(value) {
      progress.push(structuredClone(value));
    }
  });

  assert.equal(execution.mode, "RUN");
  assert.equal(execution.runId, "agent-run:1");
  assert.equal(execution.runState, "SUCCEEDED");
  assert.equal(execution.resumeCount, 2);
  assert.equal(execution.result.ok, true);
  assert.equal(execution.result.result.message, "done");
  assert.deepEqual(
    calls.map(call => call.command.code),
    [
      "enterprise-agent.run.start",
      "enterprise-agent.run.resume",
      "enterprise-agent.run.resume"
    ]
  );
  assert.equal(calls[0].values.message, "inspect then answer");
  assert.equal(calls[0].actionId, "chat.run.start");
  assert.equal(calls[1].values.runId, "agent-run:1");
  assert.equal(calls[1].values.activeContext.contextId, "personal:test");
  assert.deepEqual(
    progress.map(item => item.state),
    ["PAUSED", "PAUSED", "SUCCEEDED"]
  );
});

test("run-backed Chat falls back to legacy only when run start is unavailable", async () => {
  const calls = [];
  const actionHost = {
    async execute(value) {
      calls.push(structuredClone(value));
      if (value.command.code === "enterprise-agent.run.start") {
        return {
          ok: false,
          error: {
            code: "ACTION_HANDLER_NOT_FOUND",
            message: "run actions unavailable"
          }
        };
      }
      assert.equal(value.command.code, "enterprise-agent.chat");
      return { ok: true, result: { message: "legacy" } };
    }
  };

  const execution = await executeRunBackedChatV010({
    actionHost,
    request: request()
  });

  assert.equal(execution.mode, "LEGACY");
  assert.equal(execution.result.result.message, "legacy");
  assert.deepEqual(
    calls.map(call => call.command.code),
    ["enterprise-agent.run.start", "enterprise-agent.chat"]
  );
});

test("run-backed Chat never falls back after a durable run has been created", async () => {
  const calls = [];
  const actionHost = {
    async execute(value) {
      calls.push(structuredClone(value));
      if (value.command.code === "enterprise-agent.run.start") {
        return response(run("PAUSED"));
      }
      return {
        ok: false,
        error: {
          code: "NETWORK_TEMPORARY",
          message: "resume transport failed"
        }
      };
    }
  };

  const execution = await executeRunBackedChatV010({
    actionHost,
    request: request()
  });

  assert.equal(execution.mode, "RUN");
  assert.equal(execution.runId, "agent-run:1");
  assert.equal(execution.result.ok, false);
  assert.equal(execution.result.error.code, "NETWORK_TEMPORARY");
  assert.deepEqual(
    calls.map(call => call.command.code),
    ["enterprise-agent.run.start", "enterprise-agent.run.resume"]
  );
  assert.equal(
    calls.some(call => call.command.code === "enterprise-agent.chat"),
    false
  );
});

test("run recovery by persisted runId reads durable state then resumes without creating a new run", async () => {
  const calls = [];
  const actionHost = {
    async execute(value) {
      calls.push(structuredClone(value));
      if (value.command.code === "enterprise-agent.run.get") {
        return response(run("PAUSED", { sliceCount: 1 }));
      }
      if (value.command.code === "enterprise-agent.run.resume") {
        return response(run("SUCCEEDED", {
          sliceCount: 2,
          finalMessage: "recovered"
        }), {
          message: "recovered",
          messageParts: [{ type: "text", text: "recovered" }]
        });
      }
      throw new Error("unexpected command " + value.command.code);
    }
  };

  const execution = await recoverRunBackedChatV010({
    actionHost,
    request: request(),
    runId: "agent-run:1"
  });

  assert.equal(execution.mode, "RUN");
  assert.equal(execution.runState, "SUCCEEDED");
  assert.equal(execution.result.result.message, "recovered");
  assert.deepEqual(
    calls.map(call => call.command.code),
    ["enterprise-agent.run.get", "enterprise-agent.run.resume"]
  );
});

test("run recovery without local runId deterministically finds one matching non-terminal run", async () => {
  const calls = [];
  const actionHost = {
    async execute(value) {
      calls.push(structuredClone(value));
      if (value.command.code === "enterprise-agent.run.list") {
        return {
          ok: true,
          result: {
            runs: [
              {
                runId: "agent-run:other",
                state: "PAUSED",
                sourceInteractionId: "other-page",
                sourceActionId: "chat.run.start"
              },
              run("PAUSED")
            ]
          }
        };
      }
      if (value.command.code === "enterprise-agent.run.get") {
        assert.equal(value.values.runId, "agent-run:1");
        return response(run("PAUSED"));
      }
      if (value.command.code === "enterprise-agent.run.resume") {
        return response(run("SUCCEEDED", { finalMessage: "done" }), {
          message: "done"
        });
      }
      throw new Error("unexpected command " + value.command.code);
    }
  };

  const execution = await recoverRunBackedChatV010({
    actionHost,
    request: request()
  });

  assert.equal(execution.runState, "SUCCEEDED");
  assert.deepEqual(
    calls.map(call => call.command.code),
    [
      "enterprise-agent.run.list",
      "enterprise-agent.run.get",
      "enterprise-agent.run.resume"
    ]
  );
});

test("run recovery fails closed rather than guessing between multiple matching active runs", async () => {
  const actionHost = {
    async execute(value) {
      assert.equal(value.command.code, "enterprise-agent.run.list");
      return {
        ok: true,
        result: {
          runs: [
            run("PAUSED"),
            {
              ...run("PAUSED"),
              runId: "agent-run:2"
            }
          ]
        }
      };
    }
  };

  const execution = await recoverRunBackedChatV010({
    actionHost,
    request: request()
  });

  assert.equal(execution.result.ok, false);
  assert.equal(
    execution.result.error.code,
    "EIDOS_AGENT_RUN_RECOVERY_AMBIGUOUS"
  );
});

test("blocked durable run is surfaced as an explicit error boundary", async () => {
  const actionHost = {
    async execute() {
      return response(run("BLOCKED", {
        blocker: {
          code: "HUMAN_APPROVAL_REQUIRED",
          reason: "Human approval is required."
        }
      }));
    }
  };

  const execution = await executeRunBackedChatV010({
    actionHost,
    request: request()
  });

  assert.equal(execution.mode, "RUN");
  assert.equal(execution.runState, "BLOCKED");
  assert.equal(execution.result.ok, false);
  assert.equal(execution.result.error.code, "HUMAN_APPROVAL_REQUIRED");
});

test("client resume guard preserves runId instead of recreating work", async () => {
  const calls = [];
  const actionHost = {
    async execute(value) {
      calls.push(structuredClone(value));
      return response(run("PAUSED", { sliceCount: calls.length }));
    }
  };

  const execution = await executeRunBackedChatV010({
    actionHost,
    request: request(),
    maxConsecutiveResumes: 2
  });

  assert.equal(execution.result.ok, false);
  assert.equal(
    execution.result.error.code,
    "EIDOS_AGENT_RUN_RESUME_LIMIT_REACHED"
  );
  assert.equal(execution.runId, "agent-run:1");
  assert.equal(execution.runState, "PAUSED");
  assert.deepEqual(
    calls.map(call => call.command.code),
    [
      "enterprise-agent.run.start",
      "enterprise-agent.run.resume",
      "enterprise-agent.run.resume"
    ]
  );
});
