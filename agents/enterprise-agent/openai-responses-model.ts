import type {
  AgentModel,
  AgentModelDecision,
  AgentModelInput,
  AgentToolDescriptorV010
} from "./contracts.js";

export interface OpenAIResponsesAgentModelOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

interface ResponseFunctionCall {
  type: "function_call";
  name: string;
  arguments: string;
}

interface ResponseMessage {
  type: "message";
  content?: Array<{ type?: string; text?: string }>;
}

interface ResponsesApiBody {
  output?: Array<ResponseFunctionCall | ResponseMessage | Record<string, unknown>>;
  error?: { message?: string };
}

function textFrom(body: ResponsesApiBody): string {
  for (const item of body.output ?? []) {
    if (item.type !== "message") continue;
    const message = item as ResponseMessage;
    for (const content of message.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return "";
}

function safeArguments(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function responseTools(tools: readonly AgentToolDescriptorV010[]) {
  const byModelName = new Map<string, AgentToolDescriptorV010>();
  const definitions = tools.map(tool => {
    if (byModelName.has(tool.modelName)) {
      throw new Error(`AGENT_TOOL_MODEL_NAME_DUPLICATE: ${tool.modelName}`);
    }
    byModelName.set(tool.modelName, tool);
    return {
      type: "function",
      name: tool.modelName,
      description: [
        tool.description,
        `Effect: ${tool.effect}.`,
        `Owner: ${tool.ownerPackageId}.`
      ].join(" "),
      parameters: tool.inputSchema,
      strict: true
    };
  });
  return { byModelName, definitions };
}

/**
 * Historical direct OpenAI AgentModel adapter.
 *
 * Production Personal Agent uses the generic llm.inference Provider boundary.
 * This adapter remains migration/reference evidence and therefore consumes the
 * same dynamic Host tool descriptors instead of preserving the old fixed tool list.
 */
export function createOpenAIResponsesAgentModel(
  options: OpenAIResponsesAgentModelOptions
): AgentModel {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("ENTERPRISE_AGENT_FETCH_UNAVAILABLE");

  const baseUrl = (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = options.model ?? "gpt-5.6-luna";

  return {
    async decide(input: AgentModelInput): Promise<AgentModelDecision> {
      const { byModelName, definitions } = responseTools(input.tools);
      const response = await fetchImpl(`${baseUrl}/responses`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${options.apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model,
          instructions: [
            "You are Personal Agent, the human user\'s work adviser.",
            "Use only the tools supplied by the Host for this turn.",
            "Enterprise Context is governed working and learning material, not a separate Agent.",
            "Analyze and propose; material final decisions belong to the human unless the Host explicitly delegates otherwise.",
            "Prefer READ tools to inspect authoritative state before asking the human.",
            "PLAN tools are side-effect-free preflight.",
            "WRITE tools are side-effectful; never claim success unless the Host observation confirms success.",
            "Never invent a tool that is not in the supplied catalog.",
            "Answer the user in the same language they used."
          ].join("\n"),
          input: [
            {
              role: "user",
              content: input.userMessage
            },
            {
              role: "developer",
              content: [
                "Authoritative Host-resolved Context:",
                JSON.stringify(input.context ?? null),
                "Authoritative Host tool catalog:",
                JSON.stringify(input.tools),
                "Tool observations from this turn (authoritative):",
                JSON.stringify(input.observations)
              ].join("\n")
            }
          ],
          tools: definitions,
          tool_choice: "auto"
        })
      });

      const body = await response.json() as ResponsesApiBody;
      if (!response.ok) {
        throw new Error(body.error?.message ?? `OpenAI Responses API HTTP ${response.status}`);
      }

      for (const item of body.output ?? []) {
        if (item.type !== "function_call") continue;
        const call = item as ResponseFunctionCall;
        const descriptor = byModelName.get(call.name);
        if (!descriptor) continue;
        return {
          type: "tool",
          call: {
            tool: descriptor.id,
            arguments: safeArguments(call.arguments)
          }
        };
      }

      const message = textFrom(body).trim();
      return {
        type: "final",
        message: message || "我暂时无法确定下一步操作。"
      };
    }
  };
}
