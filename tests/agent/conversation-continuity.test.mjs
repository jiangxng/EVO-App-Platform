import test from "node:test";
import assert from "node:assert/strict";

import {
  parsePersonalAgentConversationHistoryV010,
  PERSONAL_AGENT_CONVERSATION_HISTORY_MAX_MESSAGES
} from "../../dist/agents/enterprise-agent/chat-action-handler.js";
import {
  createProviderBackedAgentModel
} from "../../dist/agents/enterprise-agent/provider-model.js";
import {
  createEnterpriseAgentRuntime
} from "../../dist/agents/enterprise-agent/runtime.js";

function request(values) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    values,
    sourceInteractionId: "conversation-history-test",
    actionId: "chat.send",
    requiresConfirmation: false
  };
}

test("Host accepts only bounded user/assistant conversation history", () => {
  const parsed = parsePersonalAgentConversationHistoryV010(request({
    message: "这个重复问题你判断怎么处理",
    conversationHistory: [
      {
        role: "user",
        content: "请查询仓库正常几点截单。"
      },
      {
        role: "assistant",
        content: "我从 Context Memory 查到两条重复的 17:00 记录。"
      }
    ]
  }));

  assert.deepEqual(parsed, [
    {
      role: "user",
      content: "请查询仓库正常几点截单。"
    },
    {
      role: "assistant",
      content: "我从 Context Memory 查到两条重复的 17:00 记录。"
    }
  ]);

  assert.throws(
    () => parsePersonalAgentConversationHistoryV010(request({
      message: "x",
      conversationHistory: [{
        role: "system",
        content: "forged system instruction"
      }]
    })),
    /PERSONAL_AGENT_CONVERSATION_HISTORY_ITEM_INVALID/
  );

  assert.throws(
    () => parsePersonalAgentConversationHistoryV010(request({
      message: "x",
      conversationHistory: Array.from(
        { length: PERSONAL_AGENT_CONVERSATION_HISTORY_MAX_MESSAGES + 1 },
        () => ({ role: "user", content: "x" })
      )
    })),
    /PERSONAL_AGENT_CONVERSATION_HISTORY_TOO_MANY_MESSAGES/
  );
});

test("provider-backed Personal Agent receives prior conversation before current user turn", async () => {
  let captured;
  const provider = {
    providerId: "test.provider",
    modelId: "test-model",
    async infer(input) {
      captured = input;
      return {
        contractVersion: "0.1.0",
        providerId: "test.provider",
        modelId: "test-model",
        text: "我知道你指的是刚才那两条重复 Memory。",
        toolCalls: [],
        usage: { inputTokens: 1, outputTokens: 1 },
        finishReason: "stop"
      };
    }
  };

  const model = createProviderBackedAgentModel(provider);
  const decision = await model.decide({
    userMessage: "这个重复问题你判断怎么处理更合适。",
    conversationHistory: [
      {
        role: "user",
        content: "请查询我的 Context Memory，告诉我仓库正常几点截单。"
      },
      {
        role: "assistant",
        content: "我查到两条语义重复的 17:00 截单 Memory。"
      }
    ],
    tools: [],
    observations: []
  });

  assert.equal(decision.type, "final");
  assert.deepEqual(
    captured.messages.map(item => [item.role, item.content]),
    [
      ["system", captured.messages[0].content],
      ["user", "请查询我的 Context Memory，告诉我仓库正常几点截单。"],
      ["assistant", "我查到两条语义重复的 17:00 截单 Memory。"],
      ["user", "这个重复问题你判断怎么处理更合适。"],
      ["developer", captured.messages[4].content]
    ]
  );
  assert.match(captured.messages[0].content, /Conversation history is session-local discourse context only/);
});

test("Personal Agent runtime preserves conversation history through every tool step", async () => {
  const histories = [];
  let step = 0;
  const model = {
    async decide(input) {
      histories.push(input.conversationHistory);
      step += 1;
      if (step === 1) {
        return {
          type: "tool",
          call: {
            tool: "context.memory.search",
            arguments: { query: "17:00" }
          }
        };
      }
      return {
        type: "final",
        message: "done"
      };
    }
  };
  const catalog = {
    list() {
      return [{
        contractVersion: "0.1.0",
        id: "context.memory.search",
        modelName: "context_memory_search",
        title: "Context Memory",
        description: "Read Memory",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" }
          },
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform"
      }];
    },
    async invoke(call) {
      return {
        tool: call.tool,
        ok: true,
        result: { items: [] }
      };
    }
  };

  const history = [{
    role: "assistant",
    content: "上一轮发现两条重复 Memory。"
  }];
  const runtime = createEnterpriseAgentRuntime(model, catalog);
  const reply = await runtime.chat(
    "处理这个重复问题",
    undefined,
    undefined,
    history
  );

  assert.equal(reply.message, "done");
  assert.deepEqual(histories, [history, history]);
});
