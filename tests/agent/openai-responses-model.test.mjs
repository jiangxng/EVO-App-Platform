import test from "node:test";
import assert from "node:assert/strict";
import { createOpenAIResponsesAgentModel } from "../../dist/agents/enterprise-agent/openai-responses-model.js";

const tools = [{
  contractVersion: "0.1.0",
  id: "app.install.plan",
  modelName: "app_install_plan",
  title: "Plan Package installation",
  description: "Run a side-effect-free installation preflight for a Package.",
  inputSchema: {
    type: "object",
    properties: {
      packageId: { type: "string" }
    },
    required: ["packageId"],
    additionalProperties: false
  },
  effect: "PLAN",
  ownerPackageId: "evo-app-platform"
}, {
  contractVersion: "0.1.0",
  id: "help.search",
  modelName: "help_search",
  title: "Help search",
  description: "Search authoritative Help.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" }
    },
    required: ["query"],
    additionalProperties: false
  },
  effect: "READ",
  ownerPackageId: "evo-app-platform",
  capability: "platform.help.search"
}];

test("OpenAI Responses adapter maps dynamic function call to stable Host tool id", async () => {
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
    tools,
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
  assert.deepEqual(
    request.tools.map(item => item.name),
    ["app_install_plan", "help_search"]
  );
  assert.match(request.tools[0].description, /Effect: PLAN/);
});

test("OpenAI Responses adapter maps output text to final reply with dynamic tools", async () => {
  let request;
  const model = createOpenAIResponsesAgentModel({
    apiKey: "test-key",
    fetchImpl: async (_url, init) => {
      request = JSON.parse(init.body);
      return Response.json({
        output: [{
          type: "message",
          content: [{ type: "output_text", text: "请选择要安装的应用。" }]
        }]
      });
    }
  });

  const decision = await model.decide({
    userMessage: "帮我安装一个应用",
    tools: [tools[1]],
    observations: []
  });

  assert.deepEqual(decision, {
    type: "final",
    message: "请选择要安装的应用。"
  });
  assert.deepEqual(request.tools.map(item => item.name), ["help_search"]);
});
