import type {
  AgentModel,
  AgentToolCatalogV010,
  AgentToolObservation,
  EnterpriseAgentReplyV010
} from "./contracts.js";

export interface EnterpriseAgentRuntime {
  chat(message: string): Promise<EnterpriseAgentReplyV010>;
}

export function createEnterpriseAgentRuntime(
  model: AgentModel,
  catalog: AgentToolCatalogV010,
  maxSteps = 8
): EnterpriseAgentRuntime {
  return {
    async chat(message) {
      const observations: AgentToolObservation[] = [];
      const tools = await catalog.list();

      for (let step = 0; step < maxSteps; step += 1) {
        const decision = await model.decide({
          userMessage: message,
          tools: structuredClone(tools),
          observations: structuredClone(observations)
        });

        if (decision.type === "final") {
          return {
            contractVersion: "0.1.0",
            agentId: "enterprise-agent",
            message: decision.message,
            tools: tools.map(tool => ({
              id: tool.id,
              title: tool.title,
              effect: tool.effect,
              ownerPackageId: tool.ownerPackageId,
              ...(tool.capability ? { capability: tool.capability } : {})
            })),
            observations
          };
        }

        observations.push(await catalog.invoke(decision.call, observations));
      }

      return {
        contractVersion: "0.1.0",
        agentId: "enterprise-agent",
        message: "操作未能在允许的步骤数内完成。",
        tools: tools.map(tool => ({
          id: tool.id,
          title: tool.title,
          effect: tool.effect,
          ownerPackageId: tool.ownerPackageId,
          ...(tool.capability ? { capability: tool.capability } : {})
        })),
        observations
      };
    }
  };
}
