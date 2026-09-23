import test from "node:test";
import assert from "node:assert/strict";
import { createOpenAIResponsesAgentModel } from "../../dist/agents/enterprise-agent/openai-responses-model.js";

test("OpenAI Responses adapter maps function call to stable AgentModel tool", async () => {
  let request;
  const model = createOpenAIResponsesAgentModel({
    apiKey: "test-key",
    model: "test-model",
    fetchImpl: async (_url, init) => {
      request = JSON.parse(init.body);
      return Response.json({
        output: [{
          type: "function_call",
          call_id: "call-1",
          name: "app_install_plan",
          arguments: JSON.stringify({ packageId: "company-notes" })
        }]
      });
    }
  });

  const decision = await model.decide({
    userMessage: "帮我安装 Company Notes",
    observations: []
  });

  assert.deepEqual(decision, {
    type: "tool",
    call: {
      tool: "app.install.plan",
      arguments: { packageId: "company-notes" }
    }
  });
  assert.equal(request.model, "test-model");
  assert.ok(request.tools.some(x => x.name === "app_install_execute"));
});

test("OpenAI Responses adapter maps output text to final reply", async () => {
  const model = createOpenAIResponsesAgentModel({
    apiKey: "test-key",
    fetchImpl: async () => Response.json({
      output: [{
        type: "message",
        content: [{ type: "output_text", text: "请选择要安装的应用。" }]
      }]
    })
  });

  const decision = await model.decide({
    userMessage: "帮我安装一个应用",
    observations: []
  });

  assert.deepEqual(decision, {
    type: "final",
    message: "请选择要安装的应用。"
  });
});
