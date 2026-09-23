import type {
  AgentModel,
  AgentModelDecision,
  AgentModelInput,
  AgentToolName
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

const toolNameToInternal: Record<string, AgentToolName> = {
  app_catalog_list: "app.catalog.list",
  app_install_plan: "app.install.plan",
  app_install_execute: "app.install.execute"
};

const tools = [
  {
    type: "function",
    name: "app_catalog_list",
    description: "List installable Packages in the App Manager catalog.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "app_install_plan",
    description: "Create a side-effect-free installation plan for a Package. Always plan before executing installation.",
    parameters: {
      type: "object",
      properties: {
        packageId: { type: "string", description: "Exact Package id from the catalog." }
      },
      required: ["packageId"],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "app_install_execute",
    description: "Execute installation through App Manager. Call only after a successful plan with no blockers.",
    parameters: {
      type: "object",
      properties: {
        packageId: { type: "string", description: "Exact Package id from the successful install plan." }
      },
      required: ["packageId"],
      additionalProperties: false
    },
    strict: true
  }
] as const;

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

export function createOpenAIResponsesAgentModel(
  options: OpenAIResponsesAgentModelOptions
): AgentModel {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("ENTERPRISE_AGENT_FETCH_UNAVAILABLE");

  const baseUrl = (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = options.model ?? "gpt-5.6-luna";

  return {
    async decide(input: AgentModelInput): Promise<AgentModelDecision> {
      const response = await fetchImpl(`${baseUrl}/responses`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${options.apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model,
          instructions: [
            "You are Enterprise Agent, an enterprise software agent.",
            "Use only the provided tools for App Manager lifecycle changes.",
            "Never claim an app is installed unless app_install_execute succeeded.",
            "Always inspect the catalog when package identity is not already established.",
            "Always call app_install_plan before app_install_execute.",
            "If a plan has blockers, explain them and do not execute.",
            "If the user's target app is ambiguous, ask which catalog app they want.",
            "Answer the user in the same language they used."
          ].join("\n"),
          input: [
            {
              role: "user",
              content: input.userMessage
            },
            {
              role: "developer",
              content: `Tool observations from this turn (authoritative):\n${JSON.stringify(input.observations)}`
            }
          ],
          tools,
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
        const internal = toolNameToInternal[call.name];
        if (!internal) continue;
        return {
          type: "tool",
          call: {
            tool: internal,
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
