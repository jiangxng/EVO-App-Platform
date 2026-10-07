import type {
  PlatformPrincipalV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import type {
  AgentConversationMessageV010,
  AgentInteractionContextV010,
  AgentModel,
  AgentToolCatalogV010,
  AgentToolObservation,
  EnterpriseAgentReplyV010
} from "./contracts.js";

export interface EnterpriseAgentRuntime {
  chat(
    message: string,
    context?: ResolvedContextSetV010,
    principal?: PlatformPrincipalV010,
    conversationHistory?: readonly AgentConversationMessageV010[],
    interactionContext?: AgentInteractionContextV010
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

function readEvidenceSignature(
  tool: string,
  result: unknown
): string | undefined {
  if (
    (tool === "context.memory.search" || tool === "context.memory.recall")
    && result !== null
    && typeof result === "object"
    && Array.isArray((result as { items?: unknown }).items)
  ) {
    const items = (result as { items: unknown[] }).items;
    const memoryIds = items
      .map(item =>
        item !== null
        && typeof item === "object"
        && typeof (item as { memoryId?: unknown }).memoryId === "string"
          ? (item as { memoryId: string }).memoryId
          : undefined
      )
      .filter((memoryId): memoryId is string => Boolean(memoryId))
      .sort();
    if (memoryIds.length > 0) {
      return tool + ":memoryIds:" + JSON.stringify(memoryIds);
    }
  }

  if (result === undefined) return undefined;
  return tool + ":result:" + JSON.stringify(stableValue(result));
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
    async chat(
      message,
      context,
      principal,
      conversationHistory = [],
      interactionContext
    ) {
      const observations: AgentToolObservation[] = [];
      const tools = await catalog.list();
      const toolById = new Map(tools.map(tool => [tool.id, tool]));
      const successfulReadSignatures = new Set<string>();
      const readEvidenceSignatures = new Map<string, Set<string>>();
      const successfulReadCounts = new Map<string, number>();
      const exhaustedReadTools = new Map<string, string>();
      const maxSuccessfulReadsPerTool = 4;

      const offeredTools = () => tools.filter(
        tool => !exhaustedReadTools.has(tool.id)
      );

      const convergenceObservations = (): AgentToolObservation[] =>
        [...exhaustedReadTools.entries()].map(([tool, reason]) => ({
          tool,
          ok: false,
          error: {
            code: "AGENT_READ_CONVERGENCE_REQUIRED",
            message: reason
          }
        }));

      const noteSuccessfulRead = (
        tool: string,
        result: unknown
      ): void => {
        const count = (successfulReadCounts.get(tool) ?? 0) + 1;
        successfulReadCounts.set(tool, count);

        const evidenceSignature = readEvidenceSignature(tool, result);
        if (evidenceSignature) {
          const seen = readEvidenceSignatures.get(tool) ?? new Set<string>();
          if (seen.has(evidenceSignature)) {
            exhaustedReadTools.set(
              tool,
              "This READ has already returned the same authoritative evidence with different arguments in this turn. Stop probing it with paraphrased queries; use the evidence already obtained and continue with a different tool or answer the human."
            );
          } else {
            seen.add(evidenceSignature);
            readEvidenceSignatures.set(tool, seen);
          }
        }

        if (count >= maxSuccessfulReadsPerTool) {
          exhaustedReadTools.set(
            tool,
            `This READ has reached the per-turn successful-read limit (${maxSuccessfulReadsPerTool}). Use the authoritative observations already obtained and continue with a different tool or answer the human.`
          );
        }
      };

      const modelInput = (
        offeredToolList: typeof tools,
        extraObservations: AgentToolObservation[] = []
      ) => ({
        userMessage: message,
        ...(conversationHistory.length
          ? { conversationHistory: structuredClone(conversationHistory) }
          : {}),
        ...(interactionContext
          ? { interactionContext: structuredClone(interactionContext) }
          : {}),
        tools: structuredClone(offeredToolList),
        observations: structuredClone([
          ...observations,
          ...extraObservations
        ]),
        ...(principal ? { principal: structuredClone(principal) } : {}),
        ...(context ? { context: structuredClone(context) } : {})
      });

      for (let step = 0; step < maxSteps; step += 1) {
        const decision = await model.decide(
          modelInput(offeredTools(), convergenceObservations())
        );

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
          exhaustedReadTools.set(
            decision.call.tool,
            "An identical READ already succeeded in this turn. Reuse that authoritative observation. This READ is now unavailable for the remainder of the turn; continue with a different Host tool or answer the human."
          );
          const repeatedReadSuppressed: AgentToolObservation = {
            tool: decision.call.tool,
            ok: false,
            error: {
              code: "AGENT_READ_REPEAT_SUPPRESSED",
              message: "An identical READ already succeeded in this turn. Reuse that observation. This READ is no longer offered for the remainder of the turn; other distinct Host tools remain available when additional authoritative inspection is still required."
            }
          };
          const convergence = await model.decide(
            modelInput(offeredTools(), [
              ...convergenceObservations().filter(
                observation => observation.tool !== decision.call.tool
              ),
              repeatedReadSuppressed
            ])
          );

          if (convergence.type === "final") {
            return replyFromFinalDecision({
              message: convergence.message,
              context,
              tools,
              observations
            });
          }

          const convergenceDescriptor = toolById.get(convergence.call.tool);
          const convergenceSignature = toolCallSignature(
            convergence.call.tool,
            convergence.call.arguments
          );
          if (exhaustedReadTools.has(convergence.call.tool)) {
            observations.push({
              tool: convergence.call.tool,
              ok: false,
              error: {
                code: "AGENT_TOOL_EXHAUSTED_FOR_TURN",
                message: "The model selected a READ that the Host already exhausted for this turn. Continue with another offered tool or answer from existing authoritative evidence."
              }
            });
            continue;
          }

          const convergenceObservation = await catalog.invoke(
            convergence.call,
            observations
          );
          observations.push(convergenceObservation);
          if (
            convergenceDescriptor?.effect === "READ"
            && convergenceObservation.ok
          ) {
            successfulReadSignatures.add(convergenceSignature);
            noteSuccessfulRead(
              convergence.call.tool,
              convergenceObservation.result
            );
          }
          continue;
        }

        const observation = await catalog.invoke(decision.call, observations);
        observations.push(observation);

        if (
          descriptor?.effect === "READ"
          && observation.ok
        ) {
          successfulReadSignatures.add(signature);
          noteSuccessfulRead(decision.call.tool, observation.result);
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
