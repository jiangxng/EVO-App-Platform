import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createEnterpriseAgentRuntime
} from "../../dist/agents/enterprise-agent/runtime.js";
import {
  createProviderBackedAgentModel
} from "../../dist/agents/enterprise-agent/provider-model.js";
import {
  parsePersonalAgentInteractionContextV010
} from "../../dist/agents/enterprise-agent/chat-action-handler.js";

test("Personal Agent runtime receives contextual page metadata without treating it as conversation text", async () => {
  let captured;
  const runtime = createEnterpriseAgentRuntime({
    async decide(input) {
      captured = structuredClone(input);
      return {
        type: "final",
        message: "done"
      };
    }
  }, {
    list() { return []; },
    async invoke() {
      throw new Error("unexpected tool call");
    }
  });

  const interactionContext = {
    contractVersion: "0.1.0",
    source: {
      pageId: "evo-data-import.mapping",
      route: "/data-import/jobs/import-1/map",
      actionId: "ai-auto-map"
    },
    context: {
      taskKind: "data-import.mapping",
      importJobId: "import-1",
      targetId: "counterparty.subject"
    }
  };

  const reply = await runtime.chat(
    "帮我做字段映射",
    undefined,
    undefined,
    [],
    interactionContext
  );

  assert.equal(reply.message, "done");
  assert.deepEqual(captured.interactionContext, interactionContext);
  assert.equal(captured.userMessage, "帮我做字段映射");
});

test("Provider-backed Agent labels interaction context as task context, not authorization evidence", async () => {
  let captured;
  const model = createProviderBackedAgentModel({
    providerId: "test.provider",
    modelId: "test.model",
    async infer(request) {
      captured = request;
      return {
        contractVersion: "0.1.0",
        providerId: "test.provider",
        modelId: "test.model",
        text: "done",
        toolCalls: [],
        usage: { inputTokens: 1, outputTokens: 1 },
        finishReason: "stop"
      };
    }
  });

  await model.decide({
    userMessage: "帮我做字段映射",
    interactionContext: {
      context: {
        importJobId: "import-1"
      }
    },
    tools: [],
    observations: []
  });

  const developer = captured.messages.find(
    message => message.role === "developer"
  )?.content ?? "";
  assert.match(developer, /interaction context/i);
  assert.match(developer, /never authorization evidence/i);
  assert.match(developer, /import-1/);
  assert.match(developer, /Re-read authoritative platform state/);
});

test("Personal Agent interaction context parser accepts bounded JSON objects", () => {
  const parsed = parsePersonalAgentInteractionContextV010({
    values: {
      interactionContext: {
        source: {
          route: "/data-import/jobs/import-1/map"
        },
        context: {
          importJobId: "import-1"
        }
      }
    }
  });
  assert.equal(parsed.context.importJobId, "import-1");

  assert.throws(
    () => parsePersonalAgentInteractionContextV010({
      values: {
        interactionContext: "not-an-object"
      }
    }),
    /PERSONAL_AGENT_INTERACTION_CONTEXT_INVALID/
  );
});

test("Eidos contextual Agent transport stays product-neutral and auto-submits through the mounted Chat surface", async () => {
  const workbench = await readFile(
    new URL(
      "../../dist/vendor/eidos/src/workbench/shell.js",
      import.meta.url
    ),
    "utf8"
  );
  const controller = await readFile(
    new URL(
      "../../dist/vendor/eidos/src/app-host/page-controller.js",
      import.meta.url
    ),
    "utf8"
  );
  const threadChat = await readFile(
    new URL(
      "../../dist/vendor/eidos/src/app-host/personal-agent-thread-chat.js",
      import.meta.url
    ),
    "utf8"
  );

  assert.match(workbench, /resolveAgentActivity/);
  assert.match(workbench, /submitChatPrompt/);
  assert.match(workbench, /refreshSourceOnComplete/);
  assert.match(workbench, /renderInternalWorkspace\(state\.workspaceTarget\)/);
  assert.doesNotMatch(workbench, /enterprise-agent/);
  assert.match(controller, /data-eidos-agent-action/);
  assert.match(controller, /page\.requestPath \?\? page\.route\.path/);
  assert.match(controller, /interactionContext/);
  assert.match(controller, /stageUserTurn\(normalized\)/);
  assert.match(controller, /if \(initialRecoveryPromise\) \{\s*await initialRecoveryPromise;/);
  assert.match(controller, /await submit\(interactionContext, staged\)/);
  assert.match(controller, /loadingConversation/);
  assert.match(controller, /正在加载对话/);
  assert.match(controller, /suppressEmptyState = true/);
  assert.match(controller, /setChatBusy\(true, "loadingConversation"\)/);
  assert.match(controller, /suppressEmptyState = false/);
  assert.match(
    controller,
    /interactionContext \? \{\} : contextValues\(\)/
  );
  assert.match(threadChat, /interactionContext/);
  assert.match(threadChat, /turnContextValues\(options\.request\)/);
});
