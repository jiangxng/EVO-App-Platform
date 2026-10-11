import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "../../actions/contracts.js";
import type { AgentRunStoreV010 } from "../../contracts/agent-run.js";
import type { LlmInferenceProvider } from "../../contracts/llm.js";
import type {
  ActiveContextRefV010,
  IdentitySessionV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import {
  parsePersonalAgentConversationHistoryV010,
  parsePersonalAgentInteractionContextV010
} from "./chat-action-handler.js";
import type {
  AgentToolCatalogV010,
  PersonalAgentReplyV010
} from "./contracts.js";
import { presentPersonalAgentReplyV020 } from "./reply-presentation.js";
import {
  drainResumableAgentRunV010,
  type ResumableAgentRunExecutorV010
} from "./run-runtime.js";
import {
  ENTERPRISE_AGENT_FEATURE_ID,
  ENTERPRISE_AGENT_PACKAGE_ID
} from "./package.js";

export interface PersonalAgentRunActionDependenciesV010 {
  runStore: AgentRunStoreV010;
  runExecutor: ResumableAgentRunExecutorV010;
  resolveLlmProvider(): {
    installedProviderIds: string[];
    provider?: LlmInferenceProvider;
  };
  resolveIdentitySession(): IdentitySessionV010;
  resolveContext(
    selection: ActiveContextRefV010 | undefined,
    session: IdentitySessionV010
  ): ResolvedContextSetV010;
  createToolCatalog(
    locale: string,
    context: ResolvedContextSetV010,
    principal: PlatformPrincipalV010,
    requestContext: PlatformRequestContextV010 | undefined,
    interaction: {
      sourceInteractionId: string;
      sourceActionId: string;
    }
  ): AgentToolCatalogV010;
  runId: () => string;
  now?: () => Date;
}

function activeContextSelection(
  request: AppActionRequestV010
): ActiveContextRefV010 | undefined {
  const raw = request.values.activeContext;
  if (raw === undefined) return undefined;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("ACTIVE_CONTEXT_INVALID");
  }
  const kind = raw.kind;
  const contextId = raw.contextId;
  if (typeof contextId !== "string" || !contextId.trim()) {
    throw new Error("ACTIVE_CONTEXT_INVALID");
  }
  if (kind === "PERSONAL") {
    return {
      contractVersion: "0.1.0",
      kind,
      contextId: contextId.trim()
    };
  }
  if (kind === "ENTERPRISE") {
    const enterpriseId = raw.enterpriseId;
    if (typeof enterpriseId !== "string" || !enterpriseId.trim()) {
      throw new Error("ACTIVE_CONTEXT_INVALID");
    }
    return {
      contractVersion: "0.1.0",
      kind,
      contextId: contextId.trim(),
      enterpriseId: enterpriseId.trim()
    };
  }
  throw new Error("ACTIVE_CONTEXT_INVALID");
}

function localeForRequest(
  request: AppActionRequestV010,
  message = ""
): string {
  const explicit = request.values.locale;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  return /[㐀-鿿]/u.test(message) ? "zh-CN" : "en";
}

function errorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return candidate && /^[A-Z0-9_]+$/.test(candidate)
    ? candidate
    : "AGENT_RUN_ACTION_FAILED";
}

function sameScope(
  run: NonNullable<ReturnType<AgentRunStoreV010["get"]>>,
  principal: PlatformPrincipalV010,
  context: ResolvedContextSetV010
): boolean {
  const active = context.activeContext;
  return run.principalSubjectId === principal.subjectId
    && run.principalActorType === principal.actorType
    && run.context.kind === active.kind
    && run.context.contextId === active.contextId
    && (
      run.context.kind !== "ENTERPRISE"
      || active.kind !== "ENTERPRISE"
      || run.context.enterpriseId === active.enterpriseId
    );
}

function scopeForRequest(
  dependencies: PersonalAgentRunActionDependenciesV010,
  request: AppActionRequestV010,
  requestContext?: PlatformRequestContextV010
): {
  principal: PlatformPrincipalV010;
  context: ResolvedContextSetV010;
} {
  if (requestContext?.context) {
    return {
      principal: requestContext.principal,
      context: requestContext.context
    };
  }
  const session = dependencies.resolveIdentitySession();
  return {
    principal: session.principal,
    context: dependencies.resolveContext(
      activeContextSelection(request),
      session
    )
  };
}

function runIdFromRequest(request: AppActionRequestV010): string {
  const runId = request.values.runId;
  if (typeof runId !== "string" || !runId.trim()) {
    throw new Error("AGENT_RUN_ID_REQUIRED");
  }
  return runId.trim();
}

async function presentedRunResult(
  dependencies: PersonalAgentRunActionDependenciesV010,
  request: AppActionRequestV010,
  run: NonNullable<ReturnType<AgentRunStoreV010["get"]>>,
  principal: PlatformPrincipalV010,
  context: ResolvedContextSetV010,
  requestContext?: PlatformRequestContextV010
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = { run };
  if (run.state !== "SUCCEEDED" || typeof run.finalMessage !== "string") {
    return result;
  }

  const catalog = dependencies.createToolCatalog(
    run.input.locale,
    context,
    principal,
    requestContext,
    {
      sourceInteractionId: run.runId,
      sourceActionId: request.actionId
    }
  );
  const tools = await catalog.list();
  const reply: PersonalAgentReplyV010 = {
    contractVersion: "0.1.0",
    agentId: "enterprise-agent",
    message: run.finalMessage,
    context: structuredClone(context),
    tools: tools.map(tool => ({
      id: tool.id,
      title: tool.title,
      effect: tool.effect,
      ownerPackageId: tool.ownerPackageId,
      ...(tool.capability ? { capability: tool.capability } : {})
    })),
    observations: structuredClone(run.observations)
  };
  return {
    run,
    message: run.finalMessage,
    messageParts: presentPersonalAgentReplyV020(reply, run.input.locale)
  };
}

function success(
  request: AppActionRequestV010,
  value: unknown
): AppActionExecutionResultV010 {
  return {
    ok: true,
    correlationId: request.sourceInteractionId,
    result: JSON.parse(JSON.stringify(value))
  };
}

function failure(
  request: AppActionRequestV010,
  error: unknown
): AppActionExecutionResultV010 {
  return {
    ok: false,
    correlationId: request.sourceInteractionId,
    error: {
      code: errorCode(error),
      message: error instanceof Error ? error.message : String(error)
    }
  };
}

export function createPersonalAgentRunActionHandlersV010(
  dependencies: PersonalAgentRunActionDependenciesV010
): AppActionHandler[] {
  const base = {
    packageId: ENTERPRISE_AGENT_PACKAGE_ID,
    featureId: ENTERPRISE_AGENT_FEATURE_ID
  };

  return [
    {
      ...base,
      commandCode: "enterprise-agent.run.start",
      async execute(request, requestContext) {
        try {
          const message = request.values.message;
          if (typeof message !== "string" || !message.trim()) {
            throw new Error("MESSAGE_REQUIRED");
          }
          const { principal, context } = scopeForRequest(
            dependencies,
            request,
            requestContext
          );
          const resolved = dependencies.resolveLlmProvider();
          if (!resolved.provider) {
            throw new Error(
              resolved.installedProviderIds.length > 0
                ? "LLM_PROVIDER_NOT_CONFIGURED"
                : "LLM_PROVIDER_REQUIRED"
            );
          }
          const conversationHistory =
            parsePersonalAgentConversationHistoryV010(request);
          const interactionContext =
            parsePersonalAgentInteractionContextV010(request);
          const createdAt = (dependencies.now?.() ?? new Date()).toISOString();
          const run = dependencies.runStore.create({
            runId: "agent-run:" + dependencies.runId(),
            principalSubjectId: principal.subjectId,
            principalActorType: principal.actorType,
            context: structuredClone(context.activeContext),
            sourceInteractionId: request.sourceInteractionId,
            sourceActionId: request.actionId,
            input: {
              message: message.trim(),
              conversationHistory,
              ...(interactionContext
                ? { interactionContext: structuredClone(interactionContext) }
                : {}),
              locale: localeForRequest(request, message),
              providerId: resolved.provider.providerId,
              modelId: resolved.provider.modelId
            },
            createdAt
          });
          const resumed = await drainResumableAgentRunV010(
            dependencies.runExecutor,
            {
              runId: run.runId,
              principal,
              context,
              requestContext
            }
          );
          return success(
            request,
            await presentedRunResult(
              dependencies,
              request,
              resumed.run,
              principal,
              context,
              requestContext
            )
          );
        } catch (error) {
          return failure(request, error);
        }
      }
    },
    {
      ...base,
      commandCode: "enterprise-agent.run.resume",
      async execute(request, requestContext) {
        try {
          const { principal, context } = scopeForRequest(
            dependencies,
            request,
            requestContext
          );
          const result = await drainResumableAgentRunV010(
            dependencies.runExecutor,
            {
              runId: runIdFromRequest(request),
              principal,
              context,
              requestContext
            }
          );
          return success(
            request,
            await presentedRunResult(
              dependencies,
              request,
              result.run,
              principal,
              context,
              requestContext
            )
          );
        } catch (error) {
          return failure(request, error);
        }
      }
    },
    {
      ...base,
      commandCode: "enterprise-agent.run.get",
      async execute(request, requestContext) {
        try {
          const { principal, context } = scopeForRequest(
            dependencies,
            request,
            requestContext
          );
          const run = dependencies.runStore.get(runIdFromRequest(request));
          if (!run || !sameScope(run, principal, context)) {
            throw new Error("AGENT_RUN_NOT_FOUND");
          }
          return success(
            request,
            await presentedRunResult(
              dependencies,
              request,
              run,
              principal,
              context,
              requestContext
            )
          );
        } catch (error) {
          return failure(request, error);
        }
      }
    },
    {
      ...base,
      commandCode: "enterprise-agent.run.list",
      async execute(request, requestContext) {
        try {
          const { principal, context } = scopeForRequest(
            dependencies,
            request,
            requestContext
          );
          const rawLimit = request.values.limit;
          const limit = rawLimit === undefined ? 20 : rawLimit;
          if (
            typeof limit !== "number"
            || !Number.isInteger(limit)
            || limit < 1
            || limit > 100
          ) {
            throw new Error("AGENT_RUN_LIMIT_INVALID");
          }
          return success(request, {
            runs: dependencies.runStore.list({
              principalSubjectId: principal.subjectId,
              context: context.activeContext,
              limit
            })
          });
        } catch (error) {
          return failure(request, error);
        }
      }
    }
  ];
}
