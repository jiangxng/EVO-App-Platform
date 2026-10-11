import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "../../actions/contracts.js";
import type {
  ConversationThreadStoreV010,
  ConversationThreadV010
} from "../../contracts/conversation-thread.js";
import type {
  ActiveContextRefV010,
  IdentitySessionV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import {
  ENTERPRISE_AGENT_FEATURE_ID,
  ENTERPRISE_AGENT_PACKAGE_ID
} from "./package.js";

export interface PersonalAgentThreadActionDependenciesV010 {
  threadStore: ConversationThreadStoreV010;
  resolveIdentitySession(): IdentitySessionV010;
  resolveContext(
    selection: ActiveContextRefV010 | undefined,
    session: IdentitySessionV010
  ): ResolvedContextSetV010;
  threadId: () => string;
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
  dependencies: PersonalAgentThreadActionDependenciesV010,
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

function sameScope(
  thread: ConversationThreadV010,
  principal: PlatformPrincipalV010,
  context: ResolvedContextSetV010
): boolean {
  const active = context.activeContext;
  return thread.principalSubjectId === principal.subjectId
    && thread.principalActorType === principal.actorType
    && thread.context.kind === active.kind
    && thread.context.contextId === active.contextId
    && (
      thread.context.kind !== "ENTERPRISE"
      || active.kind !== "ENTERPRISE"
      || thread.context.enterpriseId === active.enterpriseId
    );
}

function threadIdFromRequest(request: AppActionRequestV010): string {
  const threadId = request.values.threadId;
  if (typeof threadId !== "string" || !threadId.trim()) {
    throw new Error("CONVERSATION_THREAD_ID_REQUIRED");
  }
  return threadId.trim();
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

function errorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return candidate && /^[A-Z0-9_]+$/.test(candidate)
    ? candidate
    : "CONVERSATION_THREAD_ACTION_FAILED";
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

export function createPersonalAgentThreadActionHandlersV010(
  dependencies: PersonalAgentThreadActionDependenciesV010
): AppActionHandler[] {
  const base = {
    packageId: ENTERPRISE_AGENT_PACKAGE_ID,
    featureId: ENTERPRISE_AGENT_FEATURE_ID
  };

  return [
    {
      ...base,
      commandCode: "enterprise-agent.thread.create",
      async execute(request, requestContext) {
        try {
          const { principal, context } = scopeForRequest(
            dependencies,
            request,
            requestContext
          );
          const rawTitle = request.values.title;
          if (rawTitle !== undefined && typeof rawTitle !== "string") {
            throw new Error("CONVERSATION_THREAD_TITLE_INVALID");
          }
          const createdAt = (dependencies.now?.() ?? new Date()).toISOString();
          const thread = await dependencies.threadStore.create({
            threadId: "conversation-thread:" + dependencies.threadId(),
            principalSubjectId: principal.subjectId,
            principalActorType: principal.actorType,
            context: structuredClone(context.activeContext),
            createdAt,
            sourceInteractionId: request.sourceInteractionId,
            ...(typeof rawTitle === "string" && rawTitle.trim()
              ? { title: rawTitle.trim() }
              : {})
          });
          return success(request, { thread });
        } catch (error) {
          return failure(request, error);
        }
      }
    },
    {
      ...base,
      commandCode: "enterprise-agent.thread.get",
      async execute(request, requestContext) {
        try {
          const { principal, context } = scopeForRequest(
            dependencies,
            request,
            requestContext
          );
          const thread = await dependencies.threadStore.get(threadIdFromRequest(request));
          if (!thread || !sameScope(thread, principal, context)) {
            throw new Error("CONVERSATION_THREAD_NOT_FOUND");
          }
          return success(request, { thread });
        } catch (error) {
          return failure(request, error);
        }
      }
    },
    {
      ...base,
      commandCode: "enterprise-agent.thread.list",
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
            throw new Error("CONVERSATION_THREAD_LIMIT_INVALID");
          }
          const includeArchived = request.values.includeArchived;
          if (
            includeArchived !== undefined
            && typeof includeArchived !== "boolean"
          ) {
            throw new Error("CONVERSATION_THREAD_INCLUDE_ARCHIVED_INVALID");
          }
          return success(request, {
            threads: await dependencies.threadStore.list({
              principalSubjectId: principal.subjectId,
              context: context.activeContext,
              limit,
              ...(includeArchived !== undefined ? { includeArchived } : {})
            })
          });
        } catch (error) {
          return failure(request, error);
        }
      }
    },
    {
      ...base,
      commandCode: "enterprise-agent.thread.archive",
      async execute(request, requestContext) {
        try {
          const { principal, context } = scopeForRequest(
            dependencies,
            request,
            requestContext
          );
          const thread = await dependencies.threadStore.get(threadIdFromRequest(request));
          if (!thread || !sameScope(thread, principal, context)) {
            throw new Error("CONVERSATION_THREAD_NOT_FOUND");
          }
          const archivedAt = (dependencies.now?.() ?? new Date()).toISOString();
          return success(request, {
            thread: await dependencies.threadStore.archive({
              threadId: thread.threadId,
              archivedAt,
              archivedBySubjectId: principal.subjectId
            })
          });
        } catch (error) {
          return failure(request, error);
        }
      }
    }
  ];
}
