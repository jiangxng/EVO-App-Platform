import type {
  LlmInferenceProvider,
  LlmToolV010
} from "../../contracts/llm.js";
import type {
  AgentModel,
  AgentModelDecision,
  AgentModelInput,
  AgentToolDescriptorV010
} from "./contracts.js";

function modelTools(tools: readonly AgentToolDescriptorV010[]): {
  llmTools: LlmToolV010[];
  byModelName: Map<string, AgentToolDescriptorV010>;
} {
  const byModelName = new Map<string, AgentToolDescriptorV010>();
  const llmTools: LlmToolV010[] = [];

  for (const tool of tools) {
    if (byModelName.has(tool.modelName)) {
      throw new Error(`AGENT_TOOL_MODEL_NAME_DUPLICATE: ${tool.modelName}`);
    }
    byModelName.set(tool.modelName, tool);
    llmTools.push({
      name: tool.modelName,
      description: [
        tool.description,
        `Effect: ${tool.effect}.`,
        `Owner: ${tool.ownerPackageId}.`,
        ...(tool.capability ? [`Capability: ${tool.capability}.`] : [])
      ].join(" "),
      inputSchema: tool.inputSchema
    });
  }

  return { llmTools, byModelName };
}

export function createProviderBackedAgentModel(
  provider: LlmInferenceProvider
): AgentModel {
  return {
    async decide(input: AgentModelInput): Promise<AgentModelDecision> {
      const { llmTools, byModelName } = modelTools(input.tools);
      const response = await provider.infer({
        contractVersion: "0.1.0",
        messages: [
          {
            role: "system",
            content: [
              "You are Enterprise Agent, an enterprise software agent.",
              "The Host dynamically supplies the only tools currently available to you.",
              "Use only those supplied tools for authoritative platform facts and platform changes.",
              "Prefer READ tools to inspect current state before asking the human for information that the platform can discover.",
              "Treat PLAN tools as side-effect-free preflight.",
              "Treat WRITE tools as side-effectful and never claim success unless the tool observation confirms success.",
              "Never invent a tool that is not present in the supplied catalog.",
              "If a tool fails, explain the observed failure rather than pretending the requested action succeeded.",
              "Answer in the same language as the user."
            ].join("\n")
          },
          { role: "user", content: input.userMessage },
          {
            role: "developer",
            content: [
              "Authoritative tool catalog for this turn:",
              JSON.stringify(input.tools),
              "Authoritative tool observations for this turn:",
              JSON.stringify(input.observations)
            ].join("\n")
          }
        ],
        tools: llmTools
      });

      const call = response.toolCalls[0];
      if (call) {
        const descriptor = byModelName.get(call.name);
        if (descriptor) {
          return {
            type: "tool",
            call: {
              tool: descriptor.id,
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
