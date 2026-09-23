import type {
  AgentModel,
  AgentToolCall,
  AgentToolObservation,
  AppManagerAgentTools,
  EnterpriseAgentReplyV010
} from "./contracts.js";

export interface EnterpriseAgentRuntime {
  chat(message: string): Promise<EnterpriseAgentReplyV010>;
}

async function executeTool(
  call: AgentToolCall,
  tools: AppManagerAgentTools
): Promise<AgentToolObservation> {
  try {
    if (call.tool === "app.catalog.list") {
      return { tool: call.tool, ok: true, result: await tools.listCatalog() };
    }

    const packageId = call.arguments.packageId;
    if (typeof packageId !== "string" || !packageId) {
      return {
        tool: call.tool,
        ok: false,
        error: { code: "PACKAGE_ID_REQUIRED", message: "packageId is required" }
      };
    }

    if (call.tool === "app.install.plan") {
      return { tool: call.tool, ok: true, result: await tools.planInstall(packageId) };
    }

    return { tool: call.tool, ok: true, result: await tools.install(packageId) };
  } catch (error) {
    return {
      tool: call.tool,
      ok: false,
      error: {
        code: "TOOL_EXECUTION_FAILED",
        message: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

export function createEnterpriseAgentRuntime(
  model: AgentModel,
  tools: AppManagerAgentTools,
  maxSteps = 8
): EnterpriseAgentRuntime {
  return {
    async chat(message) {
      const observations: AgentToolObservation[] = [];

      for (let step = 0; step < maxSteps; step += 1) {
        const decision = await model.decide({
          userMessage: message,
          observations: structuredClone(observations)
        });

        if (decision.type === "final") {
          return {
            contractVersion: "0.1.0",
            agentId: "enterprise-agent",
            message: decision.message,
            observations
          };
        }

        observations.push(await executeTool(decision.call, tools));
      }

      return {
        contractVersion: "0.1.0",
        agentId: "enterprise-agent",
        message: "操作未能在允许的步骤数内完成。",
        observations
      };
    }
  };
}
