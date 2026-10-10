import type { AgentAssistanceResultV010 } from "../../contracts/agent-assistance.js";
import { parseAgentAssistanceRequestV010, assistanceInteractionContextV010 } from "./assistance-request.js";
import { isDeepStrictEqual } from "node:util";
import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "../../actions/contracts.js";
import type { AgentRunStoreV010, AgentRunV010 } from "../../contracts/agent-run.js";
import type { ConversationThreadStoreV010 } from "../../contracts/conversation-thread.js";
import type { ConversationContextAssemblerV010 } from "../../contracts/conversation-context.js";
import type { LlmInferenceProvider } from "../../contracts/llm.js";
import type {
  ActiveContextRefV010,
  IdentitySessionV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import type {
  AgentToolCatalogV010,
  PersonalAgentReplyV010
} from "./contracts.js";
import {
  parsePersonalAgentInteractionContextV010
} from "./chat-action-handler.js";
import { presentPersonalAgentReplyV020 } from "./reply-presentation.js";
import {
  drainResumableAgentRunV010,
  type ResumableAgentRunExecutorV010
} from "./run-runtime.js";
import {
  ENTERPRISE_AGENT_FEATURE_ID,
  ENTERPRISE_AGENT_PACKAGE_ID
} from "./package.js";

export interface ThreadBackedAgentTurnDependenciesV010 {
  threadStore: ConversationThreadStoreV010;
  contextAssembler?: ConversationContextAssemblerV010;
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
  messageId?: () => string;
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

function scopeForRequest(
  dependencies: ThreadBackedAgentTurnDependenciesV010,
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

function sameContext(
  left: ActiveContextRefV010,
  right: ActiveContextRefV010
): boolean {
  return left.kind === right.kind
    && left.contextId === right.contextId
    && (
      left.kind !== "ENTERPRISE"
      || right.kind !== "ENTERPRISE"
      || left.enterpriseId === right.enterpriseId
    );
}

async function threadForScope(
  dependencies: ThreadBackedAgentTurnDependenciesV010,
  threadId: string,
  principal: PlatformPrincipalV010,
  context: ResolvedContextSetV010
) {
  const thread = await dependencies.threadStore.get(threadId);
  if (
    !thread
    || thread.principalSubjectId !== principal.subjectId
    || thread.principalActorType !== principal.actorType
    || !sameContext(thread.context, context.activeContext)
  ) {
    throw new Error("CONVERSATION_THREAD_NOT_FOUND");
  }
  return thread;
}

function runForScope(
  dependencies: ThreadBackedAgentTurnDependenciesV010,
  runId: string,
  principal: PlatformPrincipalV010,
  context: ResolvedContextSetV010
): AgentRunV010 {
  const run = dependencies.runStore.get(runId);
  if (
    !run
    || run.principalSubjectId !== principal.subjectId
    || run.principalActorType !== principal.actorType
    || !sameContext(run.context, context.activeContext)
  ) {
    throw new Error("AGENT_RUN_NOT_FOUND");
  }
  return run;
}

function stringValue(
  request: AppActionRequestV010,
  key: string
): string {
  const value = request.values[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(key === "threadId"
      ? "CONVERSATION_THREAD_ID_REQUIRED"
      : key === "runId"
        ? "AGENT_RUN_ID_REQUIRED"
        : "MESSAGE_REQUIRED");
  }
  return value.trim();
}

function clientTurnIdForRequest(
  request: AppActionRequestV010
): string | undefined {
  const value = request.values.clientTurnId;
  if (value === undefined) return undefined;
  if (
    typeof value !== "string"
    || !value.trim()
    || value.length > 240
  ) {
    throw new Error("CONVERSATION_THREAD_CLIENT_TURN_ID_INVALID");
  }
  return value.trim();
}

function turnSourceActionId(clientTurnId: string | undefined): string {
  return clientTurnId
    ? "enterprise-agent.thread.send:" + clientTurnId
    : "enterprise-agent.thread.send";
}

function localeForRequest(
  request: AppActionRequestV010,
  message = ""
): string {
  const explicit = request.values.locale;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  return /[㐀-鿿]/u.test(message) ? "zh-CN" : "en";
}

function now(
  dependencies: ThreadBackedAgentTurnDependenciesV010
): string {
  return (dependencies.now?.() ?? new Date()).toISOString();
}

function userMessageId(runId: string): string {
  return "conversation-message:user:" + runId;
}

function assistantMessageId(runId: string): string {
  return "conversation-message:assistant:" + runId;
}

function errorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return candidate && /^[A-Z0-9_]+$/.test(candidate)
    ? candidate
    : "CONVERSATION_THREAD_TURN_FAILED";
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

async function terminalPresentation(
  dependencies: ThreadBackedAgentTurnDependenciesV010,
  run: AgentRunV010,
  principal: PlatformPrincipalV010,
  context: ResolvedContextSetV010,
  requestContext: PlatformRequestContextV010 | undefined
) {
  if (run.state !== "SUCCEEDED" || typeof run.finalMessage !== "string") {
    return undefined;
  }
  const catalog = dependencies.createToolCatalog(
    run.input.locale,
    context,
    principal,
    requestContext,
    {
      sourceInteractionId: run.runId,
      sourceActionId: "thread.turn.presentation"
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
  return presentPersonalAgentReplyV020(reply, run.input.locale);
}

async function ensureAssistantMessage(
  dependencies: ThreadBackedAgentTurnDependenciesV010,
  threadId: string,
  run: AgentRunV010,
  principal: PlatformPrincipalV010,
  context: ResolvedContextSetV010,
  requestContext: PlatformRequestContextV010 | undefined
) {
  const thread = await threadForScope(
    dependencies,
    threadId,
    principal,
    context
  );
  const existing = thread.messages.find(message =>
    message.role === "ASSISTANT"
    && message.runId === run.runId
  );
  if (existing) return thread;

  if (run.state !== "SUCCEEDED" || typeof run.finalMessage !== "string") {
    return thread;
  }

  const user = thread.messages.find(message =>
    message.role === "USER"
    && message.runId === run.runId
  );
  if (!user) {
    throw new Error("CONVERSATION_THREAD_RUN_USER_MESSAGE_REQUIRED");
  }
  const parts = await terminalPresentation(
    dependencies,
    run,
    principal,
    context,
    requestContext
  );
  return await dependencies.threadStore.appendMessage({
    threadId,
    messageId: assistantMessageId(run.runId),
    role: "ASSISTANT",
    content: run.finalMessage,
    createdAt: now(dependencies),
    runId: run.runId,
    replyToMessageId: user.messageId,
    ...(parts ? { presentation: { messageParts: parts } } : {})
  });
}

function verifyRunBelongsToThread(
  threadId: string,
  run: AgentRunV010
): void {
  if (run.sourceInteractionId !== threadId) {
    throw new Error("CONVERSATION_THREAD_RUN_MISMATCH");
  }
}

async function presentTurnResult(
  dependencies: ThreadBackedAgentTurnDependenciesV010,
  request: AppActionRequestV010,
  threadId: string,
  run: AgentRunV010,
  principal: PlatformPrincipalV010,
  context: ResolvedContextSetV010,
  requestContext: PlatformRequestContextV010 | undefined
): Promise<AppActionExecutionResultV010> {
  const thread = await ensureAssistantMessage(
    dependencies,
    threadId,
    run,
    principal,
    context,
    requestContext
  );
  const parts = run.state === "SUCCEEDED"
    ? await terminalPresentation(
        dependencies,
        run,
        principal,
        context,
        requestContext
      )
    : undefined;
  const assistanceResult: AgentAssistanceResultV010 | undefined = run.input.assistanceRequest
    ? {
        contractVersion: "0.1.0",
        requestId: run.input.assistanceRequest.requestId,
        taskKind: run.input.assistanceRequest.taskKind,
        source: structuredClone(run.input.assistanceRequest.source),
        runId: run.runId,
        runState: run.state,
        actionReceiptIds: [...run.actionReceiptIds]
      }
    : undefined;
  return success(request, {
    thread,
    run,
    ...(assistanceResult ? { assistanceResult } : {}),
    ...(run.state === "SUCCEEDED" && run.finalMessage
      ? {
          message: run.finalMessage,
          ...(parts ? { messageParts: parts } : {})
        }
      : {})
  });
}

export function createThreadBackedAgentTurnActionHandlersV010(
  dependencies: ThreadBackedAgentTurnDependenciesV010
): AppActionHandler[] {
  const base = {
    packageId: ENTERPRISE_AGENT_PACKAGE_ID,
    featureId: ENTERPRISE_AGENT_FEATURE_ID
  };

  return [
    {
      ...base,
      commandCode: "enterprise-agent.thread.send",
      async execute(request, requestContext) {
        try {
          const { principal, context } = scopeForRequest(
            dependencies,
            request,
            requestContext
          );
          const threadId = stringValue(request, "threadId");
          const assistanceRequest = parseAgentAssistanceRequestV010(
            request.values.assistanceRequest
          );
          const message = assistanceRequest?.userIntent ?? stringValue(request, "message");
          if (assistanceRequest && (
            (request.values.message !== undefined && stringValue(request, "message") !== message)
            || request.values.interactionContext !== undefined
          )) {
            throw new Error("PERSONAL_AGENT_ASSISTANCE_INPUT_CONFLICT");
          }
          const scopedThread = await threadForScope(
            dependencies,
            threadId,
            principal,
            context
          );
          if (scopedThread.state === "ARCHIVED") {
            throw new Error("CONVERSATION_THREAD_ARCHIVED");
          }

          const resolved = dependencies.resolveLlmProvider();
          if (!resolved.provider) {
            throw new Error(
              resolved.installedProviderIds.length > 0
                ? "LLM_PROVIDER_NOT_CONFIGURED"
                : "LLM_PROVIDER_REQUIRED"
            );
          }

          // Validate task coordinates before reusing or advancing an existing run.
          // Identical text can target different imports/resources.
          const interactionContext = assistanceRequest
            ? assistanceInteractionContextV010(assistanceRequest)
            : parsePersonalAgentInteractionContextV010(request);
          const explicitClientTurnId = clientTurnIdForRequest(request);
          if (assistanceRequest && explicitClientTurnId !== undefined
            && explicitClientTurnId !== assistanceRequest.requestId) {
            throw new Error("PERSONAL_AGENT_ASSISTANCE_INPUT_CONFLICT");
          }
          const clientTurnId = assistanceRequest?.requestId ?? explicitClientTurnId;
          const sourceActionId = turnSourceActionId(clientTurnId);
          const existingRun = clientTurnId
            ? dependencies.runStore.list({
                principalSubjectId: principal.subjectId,
                context: context.activeContext,
                limit: 100
              }).find(candidate =>
                candidate.sourceInteractionId === threadId
                && candidate.sourceActionId === sourceActionId
              )
            : undefined;

          if (existingRun) {
            if (
              existingRun.input.message !== message
              || !isDeepStrictEqual(existingRun.input.assistanceRequest, assistanceRequest)
              || !isDeepStrictEqual(
                existingRun.input.interactionContext,
                interactionContext
              )
            ) {
              throw new Error("CONVERSATION_THREAD_CLIENT_TURN_ID_REUSED");
            }
            const resumed = ["READY", "PAUSED", "RUNNING"].includes(
              existingRun.state
            )
              ? await drainResumableAgentRunV010(
                  dependencies.runExecutor,
                  {
                    runId: existingRun.runId,
                    principal,
                    context,
                    requestContext
                  }
                )
              : {
                  contractVersion: "0.1.0" as const,
                  run: existingRun,
                  advanced: false,
                  advanceCount: 0,
                  exhaustedBudget: false
                };
            return presentTurnResult(
              dependencies,
              request,
              threadId,
              resumed.run,
              principal,
              context,
              requestContext
            );
          }

          const runId = "agent-run:" + dependencies.runId();
          const createdAt = now(dependencies);
          const assembledContext = dependencies.contextAssembler
            ? await dependencies.contextAssembler.assemble({
                threadId,
                threadStore: dependencies.threadStore,
                now: createdAt
              })
            : undefined;
          const history = assembledContext?.messages
            ?? await dependencies.threadStore.conversationHistory({
              threadId
            });
          let run = dependencies.runStore.create({
            runId,
            principalSubjectId: principal.subjectId,
            principalActorType: principal.actorType,
            context: structuredClone(context.activeContext),
            sourceInteractionId: threadId,
            sourceActionId,
            input: {
              ...(assistanceRequest ? { assistanceRequest: structuredClone(assistanceRequest) } : {}),
              message,
              conversationHistory: history,
              ...(interactionContext
                ? { interactionContext: structuredClone(interactionContext) }
                : {}),
              locale: localeForRequest(request, message),
              providerId: resolved.provider.providerId,
              modelId: resolved.provider.modelId
            },
            createdAt
          });

          const threadBeforeMessage = (await dependencies.threadStore.get(threadId))!;
          if (!threadBeforeMessage.messages.some(item => item.runId === runId && item.role === "USER")) {
            await dependencies.threadStore.appendMessage({
              threadId,
              messageId: userMessageId(runId),
              role: "USER",
              content: message,
              createdAt,
              runId,
              ...(clientTurnId
                ? { presentation: { clientTurnId } }
                : {})
            });
          }

          const resumed = await drainResumableAgentRunV010(
            dependencies.runExecutor,
            {
              runId,
              principal,
              context,
              requestContext
            }
          );
          run = resumed.run;
          return presentTurnResult(
            dependencies,
            request,
            threadId,
            run,
            principal,
            context,
            requestContext
          );
        } catch (error) {
          return failure(request, error);
        }
      }
    },
    {
      ...base,
      commandCode: "enterprise-agent.thread.resume",
      async execute(request, requestContext) {
        try {
          const { principal, context } = scopeForRequest(
            dependencies,
            request,
            requestContext
          );
          const threadId = stringValue(request, "threadId");
          const runId = stringValue(request, "runId");
          const thread = await threadForScope(
            dependencies,
            threadId,
            principal,
            context
          );
          const currentRun = runForScope(
            dependencies,
            runId,
            principal,
            context
          );
          verifyRunBelongsToThread(threadId, currentRun);
          if (!thread.messages.some(item => item.role === "USER" && item.runId === runId)) {
            throw new Error("CONVERSATION_THREAD_RUN_USER_MESSAGE_REQUIRED");
          }

          const resumed = await drainResumableAgentRunV010(
            dependencies.runExecutor,
            {
              runId,
              principal,
              context,
              requestContext
            }
          );
          return presentTurnResult(
            dependencies,
            request,
            threadId,
            resumed.run,
            principal,
            context,
            requestContext
          );
        } catch (error) {
          return failure(request, error);
        }
      }
    }
  ];
}

