import type {
  PlatformPrincipalV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import type {
  AgentModel,
  AgentToolCatalogV010,
  AgentToolObservation,
  EnterpriseAgentReplyV010
} from "./contracts.js";

export interface EnterpriseAgentRuntime {
  chat(
    message: string,
    context?: ResolvedContextSetV010,
    principal?: PlatformPrincipalV010
  ): Promise<EnterpriseAgentReplyV010>;
}


function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stableValue(item)])
    );
  }
  return value;
}

function toolCallSignature(tool: string, argumentsValue: Record<string, unknown>): string {
  return tool + ":" + JSON.stringify(stableValue(argumentsValue));
}

function replyFromFinalDecision(input: {
  message: string;
  context?: ResolvedContextSetV010;
  tools: Awaited<ReturnType<AgentToolCatalogV010["list"]>>;
  observations: AgentToolObservation[];
}): EnterpriseAgentReplyV010 {
  return {
    contractVersion: "0.1.0",
    agentId: "enterprise-agent",
    message: input.message,
    ...(input.context ? { context: structuredClone(input.context) } : {}),
    tools: input.tools.map(tool => ({
      id: tool.id,
      title: tool.title,
      effect: tool.effect,
      ownerPackageId: tool.ownerPackageId,
      ...(tool.capability ? { capability: tool.capability } : {})
    })),
    observations: structuredClone(input.observations)
  };
}

export function createEnterpriseAgentRuntime(
  model: AgentModel,
  catalog: AgentToolCatalogV010,
  maxSteps = 8
): EnterpriseAgentRuntime {
  return {
    async chat(message, context, principal) {
      const observations: AgentToolObservation[] = [];
      const tools = await catalog.list();
      const toolById = new Map(tools.map(tool => [tool.id, tool]));
      const successfulReadSignatures = new Set<string>();

      const modelInput = (
        offeredTools: typeof tools,
        extraObservations: AgentToolObservation[] = []
      ) => ({
        userMessage: message,
        tools: structuredClone(offeredTools),
        observations: structuredClone([
          ...observations,
          ...extraObservations
        ]),
        ...(principal ? { principal: structuredClone(principal) } : {}),
        ...(context ? { context: structuredClone(context) } : {})
      });

      for (let step = 0; step < maxSteps; step += 1) {
        const decision = await model.decide(modelInput(tools));

        if (decision.type === "final") {
          return replyFromFinalDecision({
            message: decision.message,
            context,
            tools,
            observations
          });
        }

        const descriptor = toolById.get(decision.call.tool);
        const signature = toolCallSignature(
          decision.call.tool,
          decision.call.arguments
        );

        if (
          descriptor?.effect === "READ"
          && successfulReadSignatures.has(signature)
        ) {
          const convergence = await model.decide(modelInput([], [{
            tool: decision.call.tool,
            ok: false,
            error: {
              code: "AGENT_READ_REPEAT_SUPPRESSED",
              message: "An identical READ already succeeded in this turn. Use the existing authoritative observation and answer the human; do not repeat the same read."
            }
          }]));

          if (convergence.type === "final") {
            return replyFromFinalDecision({
              message: convergence.message,
              context,
              tools,
              observations
            });
          }

          return replyFromFinalDecision({
            message: "我已经取得了所需的权威读取结果，但模型没有基于现有结果完成回答。请查看本轮证据；系统已阻止重复读取。",
            context,
            tools,
            observations
          });
        }

        const observation = await catalog.invoke(decision.call, observations);
        observations.push(observation);

        if (
          descriptor?.effect === "READ"
          && observation.ok
        ) {
          successfulReadSignatures.add(signature);
        }
      }

      return replyFromFinalDecision({
        message: "操作未能在允许的步骤数内完成。",
        context,
        tools,
        observations
      });
    }
  };
}
