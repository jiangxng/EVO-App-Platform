import type { LlmInferenceProvider } from "../../contracts/llm.js";
import type {
  AgentRunResumeResultV010,
  AgentRunStoreV010,
  AgentRunV010
} from "../../contracts/agent-run.js";
import type {
  PlatformPrincipalV010,
  PlatformRequestContextV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import type {
  AgentModelInput,
  AgentToolCatalogV010,
  AgentToolDescriptorV010,
  AgentToolObservation
} from "./contracts.js";
import { createProviderBackedAgentModel } from "./provider-model.js";

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

function toolCallSignature(
  tool: string,
  argumentsValue: Record<string, unknown>
): string {
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
    const memoryIds = (result as { items: unknown[] }).items
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

function resultExplicitlyComplete(result: unknown): boolean {
  return (
    result !== null
    && typeof result === "object"
    && (result as { complete?: unknown }).complete === true
  );
}

interface DurableReadConvergenceV010 {
  successfulSignatures: Set<string>;
  exhaustedTools: Map<string, string>;
  convergenceObservations: AgentToolObservation[];
}

function deriveDurableReadConvergenceV010(
  run: AgentRunV010,
  tools: readonly AgentToolDescriptorV010[]
): DurableReadConvergenceV010 {
  const toolById = new Map(tools.map(tool => [tool.id, tool]));
  const successfulSignatures = new Set<string>();
  const evidenceByTool = new Map<string, Set<string>>();
  const successCounts = new Map<string, number>();
  const repeatSuppressions = new Map<string, number>();
  const exhaustedTools = new Map<string, string>();
  const maxSuccessfulReadsPerTool = 4;

  for (const record of run.decisions) {
    if (record.decision.type !== "tool" || !record.observation) continue;
    const descriptor = toolById.get(record.decision.call.tool);
    if (descriptor?.effect !== "READ") continue;

    if (
      !record.observation.ok
      && record.observation.error?.code === "AGENT_READ_REPEAT_SUPPRESSED"
    ) {
      const count = (repeatSuppressions.get(descriptor.id) ?? 0) + 1;
      repeatSuppressions.set(descriptor.id, count);
      if (count >= 2) {
        exhaustedTools.set(
          descriptor.id,
          "This READ repeatedly selected an already-successful identical call in earlier durable slices. Reuse the recorded observation and continue without probing this tool again."
        );
      }
      continue;
    }

    if (!record.observation.ok) continue;

    const signature = toolCallSignature(
      record.decision.call.tool,
      record.decision.call.arguments
    );
    successfulSignatures.add(signature);

    const count = (successCounts.get(descriptor.id) ?? 0) + 1;
    successCounts.set(descriptor.id, count);

    if (resultExplicitlyComplete(record.observation.result)) {
      exhaustedTools.set(
        descriptor.id,
        "This READ already returned an authoritative result with complete=true in an earlier durable slice. Use that complete evidence and answer or continue with a different tool."
      );
    }

    const evidenceSignature = readEvidenceSignature(
      descriptor.id,
      record.observation.result
    );
    if (evidenceSignature) {
      const seen = evidenceByTool.get(descriptor.id) ?? new Set<string>();
      if (seen.has(evidenceSignature)) {
        exhaustedTools.set(
          descriptor.id,
          "This READ has already returned the same authoritative evidence across durable slices. Stop paraphrased/redundant probing and use the evidence already recorded."
        );
      } else {
        seen.add(evidenceSignature);
        evidenceByTool.set(descriptor.id, seen);
      }
    }

    if (count >= maxSuccessfulReadsPerTool) {
      exhaustedTools.set(
        descriptor.id,
        "This READ reached the durable per-run successful-read limit (4). Use the observations already recorded and continue with another tool or final answer."
      );
    }
  }

  return {
    successfulSignatures,
    exhaustedTools,
    convergenceObservations: [...exhaustedTools.entries()].map(
      ([tool, reason]) => ({
        tool,
        ok: false,
        error: {
          code: "AGENT_READ_CONVERGENCE_REQUIRED",
          message: reason
        }
      })
    )
  };
}

function sameContext(
  run: AgentRunV010,
  context: ResolvedContextSetV010
): boolean {
  const active = context.activeContext;
  return run.context.kind === active.kind
    && run.context.contextId === active.contextId
    && (
      run.context.kind !== "ENTERPRISE"
      || active.kind !== "ENTERPRISE"
      || run.context.enterpriseId === active.enterpriseId
    );
}

function errorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return candidate && /^[A-Z0-9_]+$/.test(candidate)
    ? candidate
    : "AGENT_RUN_EXECUTION_FAILED";
}

export interface ResumableAgentRunExecutorDependenciesV010 {
  store: AgentRunStoreV010;
  resolveProvider(): LlmInferenceProvider | undefined;
  createToolCatalog(
    run: AgentRunV010,
    principal: PlatformPrincipalV010,
    context: ResolvedContextSetV010,
    requestContext: PlatformRequestContextV010 | undefined,
    interaction: {
      sourceInteractionId: string;
      sourceActionId: string;
    }
  ): AgentToolCatalogV010;
  now?: () => Date;
  eventId: () => string;
  sliceId: () => string;
}

export interface ResumableAgentRunExecutorV010 {
  resume(input: {
    runId: string;
    principal: PlatformPrincipalV010;
    context: ResolvedContextSetV010;
    requestContext?: PlatformRequestContextV010;
  }): Promise<AgentRunResumeResultV010>;
}


export interface DrainResumableAgentRunOptionsV010 {
  maxAdvances?: number;
  maxElapsedMs?: number;
}

export interface DrainResumableAgentRunResultV010
  extends AgentRunResumeResultV010 {
  advanceCount: number;
  exhaustedBudget: boolean;
}

/**
 * Advance a durable run inside the Host request boundary so normal multi-slice
 * execution does not require one browser round trip per slice.
 *
 * Every individual slice is still persisted by the underlying executor, so a
 * dropped request remains recoverable. The budget is deliberately bounded:
 * authority-blocked/terminal runs stop immediately, while exceptionally long
 * runs may return PAUSED and be resumed through the durable recovery path.
 */
export async function drainResumableAgentRunV010(
  executor: ResumableAgentRunExecutorV010,
  input: {
    runId: string;
    principal: PlatformPrincipalV010;
    context: ResolvedContextSetV010;
    requestContext?: PlatformRequestContextV010;
  },
  options: DrainResumableAgentRunOptionsV010 = {}
): Promise<DrainResumableAgentRunResultV010> {
  const maxAdvances = Math.max(1, Math.trunc(options.maxAdvances ?? 12));
  // Keep one Host action comfortably below the browser/proxy request timeout.
  // Longer work remains durable and is resumed by the run-backed client.
  const maxElapsedMs = Math.max(1_000, options.maxElapsedMs ?? 20_000);
  const startedAt = Date.now();

  let advanceCount = 0;
  let result = await executor.resume(input);
  advanceCount += result.advanced ? 1 : 0;

  while (
    result.run.state === "PAUSED"
    && advanceCount < maxAdvances
    && Date.now() - startedAt < maxElapsedMs
  ) {
    const next = await executor.resume(input);
    result = next;
    advanceCount += next.advanced ? 1 : 0;
    if (!next.advanced && next.run.state === "PAUSED") break;
  }

  return {
    ...result,
    advanceCount,
    exhaustedBudget: result.run.state === "PAUSED"
      && (
        advanceCount >= maxAdvances
        || Date.now() - startedAt >= maxElapsedMs
      )
  };
}

export function createResumableAgentRunExecutorV010(
  dependencies: ResumableAgentRunExecutorDependenciesV010
): ResumableAgentRunExecutorV010 {
  const activeRuns =
    new Map<string, Promise<AgentRunResumeResultV010>>();
  const now = () => (dependencies.now?.() ?? new Date()).toISOString();

  const append = (
    runId: string,
    input: {
      type:
        | "SLICE_STARTED"
        | "MODEL_DECISION_RECORDED"
        | "TOOL_OBSERVATION_RECORDED"
        | "SLICE_PAUSED"
        | "RUN_SUCCEEDED"
        | "RUN_BLOCKED"
        | "RUN_FAILED";
      sliceId?: string;
      payload: Record<string, unknown>;
    }
  ) => dependencies.store.append({
    contractVersion: "0.1.0",
    eventId: "agent-run-event:" + dependencies.eventId(),
    runId,
    type: input.type,
    occurredAt: now(),
    ...(input.sliceId ? { sliceId: input.sliceId } : {}),
    payload: input.payload
  });

  const verifyScope = (
    run: AgentRunV010,
    principal: PlatformPrincipalV010,
    context: ResolvedContextSetV010
  ): void => {
    if (
      run.principalSubjectId !== principal.subjectId
      || run.principalActorType !== principal.actorType
      || !sameContext(run, context)
    ) {
      throw new Error("AGENT_RUN_SCOPE_MISMATCH");
    }
  };

  const invokeRecordedTool = async (
    run: AgentRunV010,
    principal: PlatformPrincipalV010,
    context: ResolvedContextSetV010,
    requestContext: PlatformRequestContextV010 | undefined,
    decisionRecord: AgentRunV010["decisions"][number]
  ): Promise<AgentRunV010> => {
    const decision = decisionRecord.decision;
    if (decision.type !== "tool") {
      throw new Error("AGENT_RUN_PENDING_TOOL_DECISION_REQUIRED");
    }
    const catalog = dependencies.createToolCatalog(
      run,
      principal,
      context,
      requestContext,
      {
        sourceInteractionId: run.runId,
        sourceActionId: decisionRecord.decisionEventId
      }
    );
    const tools = await catalog.list();
    const descriptor = tools.find(
      tool => tool.id === decision.call.tool
    );
    const convergence = deriveDurableReadConvergenceV010(run, tools);
    const signature = toolCallSignature(
      decision.call.tool,
      decision.call.arguments
    );
    const observation: AgentToolObservation = (
      descriptor?.effect === "READ"
      && convergence.successfulSignatures.has(signature)
    )
      ? {
          tool: decision.call.tool,
          ok: false,
          error: {
            code: "AGENT_READ_REPEAT_SUPPRESSED",
            message: "An identical READ already succeeded in an earlier durable slice. Reuse that authoritative observation; the Host did not invoke this READ again."
          }
        }
      : await catalog.invoke(
          decision.call,
          run.observations
        );
    let next = append(run.runId, {
      type: "TOOL_OBSERVATION_RECORDED",
      sliceId: decisionRecord.sliceId,
      payload: {
        observation,
        decisionEventId: decisionRecord.decisionEventId
      }
    });

    if (
      observation.error?.code === "AGENT_ACTION_RECEIPT_INDETERMINATE"
    ) {
      return append(run.runId, {
        type: "RUN_BLOCKED",
        payload: {
          code: "AGENT_RUN_WRITE_INDETERMINATE",
          reason: "A resumed material WRITE has an indeterminate Action Receipt and cannot be repeated automatically."
        }
      });
    }

    next = append(run.runId, {
      type: "SLICE_PAUSED",
      sliceId: decisionRecord.sliceId,
      payload: {}
    });
    return next;
  };

  return {
    async resume(input) {
      const initial = dependencies.store.get(input.runId);
      if (!initial) throw new Error("AGENT_RUN_NOT_FOUND");
      verifyScope(initial, input.principal, input.context);

      if (["SUCCEEDED", "FAILED", "CANCELLED", "BLOCKED"].includes(initial.state)) {
        return {
          contractVersion: "0.1.0",
          run: initial,
          advanced: false
        };
      }

      const inFlight = activeRuns.get(initial.runId);
      if (inFlight) {
        return inFlight;
      }

      const execution = (async (): Promise<AgentRunResumeResultV010> => {
        let run = dependencies.store.get(initial.runId)!;
        verifyScope(run, input.principal, input.context);

        const provider = dependencies.resolveProvider();
        if (
          !provider
          || provider.providerId !== run.input.providerId
          || provider.modelId !== run.input.modelId
        ) {
          run = append(run.runId, {
            type: "RUN_BLOCKED",
            payload: {
              code: "AGENT_RUN_PROVIDER_UNAVAILABLE",
              reason: "The run's original LLM Provider/model is not currently available. Resume will not silently switch models."
            }
          });
          return {
            contractVersion: "0.1.0",
            run,
            advanced: true
          };
        }

        const pendingDecision = [...run.decisions]
          .reverse()
          .find(item =>
            item.decision.type === "tool"
            && item.observation === undefined
          );
        if (pendingDecision) {
          run = await invokeRecordedTool(
            run,
            input.principal,
            input.context,
            input.requestContext,
            pendingDecision
          );
          return {
            contractVersion: "0.1.0",
            run,
            advanced: true
          };
        }

        const pendingFinal = [...run.decisions]
          .reverse()
          .find(item =>
            item.decision.type === "final"
            && item === run.decisions[run.decisions.length - 1]
            && run.state === "RUNNING"
          );
        if (pendingFinal && pendingFinal.decision.type === "final") {
          run = append(run.runId, {
            type: "RUN_SUCCEEDED",
            payload: { message: pendingFinal.decision.message }
          });
          return {
            contractVersion: "0.1.0",
            run,
            advanced: true
          };
        }

        const sliceId = run.state === "RUNNING" && run.activeSliceId
          ? run.activeSliceId
          : "agent-run-slice:" + dependencies.sliceId();
        if (!(run.state === "RUNNING" && run.activeSliceId)) {
          run = append(run.runId, {
            type: "SLICE_STARTED",
            sliceId,
            payload: {}
          });
        }

        const listCatalog = dependencies.createToolCatalog(
          run,
          input.principal,
          input.context,
          input.requestContext,
          {
            sourceInteractionId: run.runId,
            sourceActionId: "agent-run-tool-list:" + sliceId
          }
        );
        const tools = await listCatalog.list();
        const convergence = deriveDurableReadConvergenceV010(run, tools);
        const offeredTools = tools.filter(
          tool => !convergence.exhaustedTools.has(tool.id)
        );
        const modelInput: AgentModelInput = {
          userMessage: run.input.message,
          ...(run.input.conversationHistory.length > 0
            ? {
                conversationHistory: structuredClone(
                  run.input.conversationHistory
                )
              }
            : {}),
          ...(run.input.interactionContext
            ? {
                interactionContext: structuredClone(
                  run.input.interactionContext
                )
              }
            : {}),
          tools: structuredClone(offeredTools),
          observations: structuredClone([
            ...run.observations,
            ...convergence.convergenceObservations
          ]),
          principal: structuredClone(input.principal),
          context: structuredClone(input.context)
        };

        let decision;
        try {
          decision = await createProviderBackedAgentModel(provider).decide(
            modelInput
          );
        } catch (error) {
          run = append(run.runId, {
            type: "RUN_FAILED",
            payload: {
              code: errorCode(error),
              reason: error instanceof Error ? error.message : String(error)
            }
          });
          return {
            contractVersion: "0.1.0",
            run,
            advanced: true
          };
        }

        run = append(run.runId, {
          type: "MODEL_DECISION_RECORDED",
          sliceId,
          payload: { decision }
        });
        const decisionRecord = run.decisions[run.decisions.length - 1];

        if (decision.type === "final") {
          run = append(run.runId, {
            type: "RUN_SUCCEEDED",
            payload: { message: decision.message }
          });
          return {
            contractVersion: "0.1.0",
            run,
            advanced: true
          };
        }

        run = await invokeRecordedTool(
          run,
          input.principal,
          input.context,
          input.requestContext,
          decisionRecord
        );
        return {
          contractVersion: "0.1.0",
          run,
          advanced: true
        };
      })();

      activeRuns.set(initial.runId, execution);
      try {
        return await execution;
      } finally {
        if (activeRuns.get(initial.runId) === execution) {
          activeRuns.delete(initial.runId);
        }
      }
    }
  };
}
