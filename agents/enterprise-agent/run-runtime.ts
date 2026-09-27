import type { LlmInferenceProvider } from "../../contracts/llm.js";
import type {
  AgentRunResumeResultV010,
  AgentRunStoreV010,
  AgentRunV010
} from "../../contracts/agent-run.js";
import type {
  PlatformPrincipalV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import type {
  AgentModelInput,
  AgentToolCatalogV010
} from "./contracts.js";
import { createProviderBackedAgentModel } from "./provider-model.js";

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
  }): Promise<AgentRunResumeResultV010>;
}

export function createResumableAgentRunExecutorV010(
  dependencies: ResumableAgentRunExecutorDependenciesV010
): ResumableAgentRunExecutorV010 {
  const activeRuns = new Set<string>();
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
    decisionRecord: AgentRunV010["decisions"][number]
  ): Promise<AgentRunV010> => {
    if (decisionRecord.decision.type !== "tool") {
      throw new Error("AGENT_RUN_PENDING_TOOL_DECISION_REQUIRED");
    }
    const catalog = dependencies.createToolCatalog(
      run,
      principal,
      context,
      {
        sourceInteractionId: run.runId,
        sourceActionId: decisionRecord.decisionEventId
      }
    );
    const observation = await catalog.invoke(
      decisionRecord.decision.call,
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

      if (activeRuns.has(initial.runId)) {
        throw new Error("AGENT_RUN_RESUME_CONFLICT");
      }
      activeRuns.add(initial.runId);

      try {
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

        const sliceId = "agent-run-slice:" + dependencies.sliceId();
        run = append(run.runId, {
          type: "SLICE_STARTED",
          sliceId,
          payload: {}
        });

        const listCatalog = dependencies.createToolCatalog(
          run,
          input.principal,
          input.context,
          {
            sourceInteractionId: run.runId,
            sourceActionId: "agent-run-tool-list:" + sliceId
          }
        );
        const tools = await listCatalog.list();
        const modelInput: AgentModelInput = {
          userMessage: run.input.message,
          ...(run.input.conversationHistory.length > 0
            ? {
                conversationHistory: structuredClone(
                  run.input.conversationHistory
                )
              }
            : {}),
          tools: structuredClone(tools),
          observations: structuredClone(run.observations),
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
          decisionRecord
        );
        return {
          contractVersion: "0.1.0",
          run,
          advanced: true
        };
      } finally {
        activeRuns.delete(initial.runId);
      }
    }
  };
}
