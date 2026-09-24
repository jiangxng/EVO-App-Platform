import type {
  LlmInferenceProvider,
  LlmToolV010
} from "../../contracts/llm.js";
import type {
  AgentModel,
  AgentModelDecision,
  AgentModelInput,
  AgentToolName
} from "./contracts.js";

const toolNameToInternal: Record<string, AgentToolName> = {
  app_catalog_list: "app.catalog.list",
  app_install_plan: "app.install.plan",
  app_install_execute: "app.install.execute"
};

const tools: LlmToolV010[] = [
  {
    name: "app_catalog_list",
    description: "List installable Packages in the App Manager catalog.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "app_install_plan",
    description: "Run a side-effect-free internal preflight for a Package before installation.",
    inputSchema: {
      type: "object",
      properties: {
        packageId: { type: "string", description: "Exact Package id from the catalog." }
      },
      required: ["packageId"],
      additionalProperties: false
    }
  },
  {
    name: "app_install_execute",
    description: "Execute Package installation after a successful internal preflight.",
    inputSchema: {
      type: "object",
      properties: {
        packageId: { type: "string", description: "Exact Package id from the successful preflight." }
      },
      required: ["packageId"],
      additionalProperties: false
    }
  }
];

export function createProviderBackedAgentModel(
  provider: LlmInferenceProvider
): AgentModel {
  return {
    async decide(input: AgentModelInput): Promise<AgentModelDecision> {
      const response = await provider.infer({
        contractVersion: "0.1.0",
        messages: [
          {
            role: "system",
            content: [
              "You are Enterprise Agent, an enterprise software agent.",
              "Use only the provided tools for App Manager lifecycle changes.",
              "Never claim an app is installed unless app_install_execute succeeded.",
              "Use app_install_plan as an internal preflight before app_install_execute.",
              "Do not force the human to inspect an installation plan unless a blocker or material decision requires it.",
              "If a preflight has blockers, explain them and do not execute.",
              "If the target app is ambiguous, inspect the catalog before asking the user.",
              "Answer in the same language as the user."
            ].join("\n")
          },
          { role: "user", content: input.userMessage },
          {
            role: "developer",
            content: `Authoritative tool observations for this turn:\n${JSON.stringify(input.observations)}`
          }
        ],
        tools
      });

      const call = response.toolCalls[0];
      if (call) {
        const internal = toolNameToInternal[call.name];
        if (internal) {
          return {
            type: "tool",
            call: {
              tool: internal,
              arguments: call.arguments
            }
          };
        }
      }

      return {
        type: "final",
        message: response.text || "我暂时无法确定下一步操作。"
      };
    }
  };
}
