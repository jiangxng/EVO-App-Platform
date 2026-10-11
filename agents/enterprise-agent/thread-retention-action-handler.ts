import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "../../actions/contracts.js";
import type {
  ConversationRetentionPolicySourceV010
} from "../../contracts/conversation-retention.js";
import type { ConversationThreadStoreV010 } from "../../contracts/conversation-thread.js";
import type {
  ActiveContextRefV010,
  IdentitySessionV010,
  PlatformRequestContextV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import { previewConversationRetentionV010 } from "../../manager/conversation-thread-retention.js";
import {
  ENTERPRISE_AGENT_FEATURE_ID,
  ENTERPRISE_AGENT_PACKAGE_ID
} from "./package.js";

export interface ConversationRetentionPreviewActionDependenciesV010 {
  threadStore: ConversationThreadStoreV010;
  resolveIdentitySession(): IdentitySessionV010;
  resolveContext(
    selection: ActiveContextRefV010 | undefined,
    session: IdentitySessionV010
  ): ResolvedContextSetV010;
  retainArchivedForDays: number;
  policySource: Exclude<ConversationRetentionPolicySourceV010, "PREVIEW_OVERRIDE">;
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

function result(
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
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return {
    ok: false,
    correlationId: request.sourceInteractionId,
    error: {
      code: candidate && /^[A-Z0-9_]+$/.test(candidate)
        ? candidate
        : "CONVERSATION_RETENTION_PREVIEW_FAILED",
      message
    }
  };
}

export function createConversationRetentionPreviewActionHandlerV010(
  dependencies: ConversationRetentionPreviewActionDependenciesV010
): AppActionHandler {
  return {
    packageId: ENTERPRISE_AGENT_PACKAGE_ID,
    featureId: ENTERPRISE_AGENT_FEATURE_ID,
    commandCode: "enterprise-agent.thread.retention.preview",

    async execute(
      request,
      requestContext?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      try {
        const requestedDays = request.values.retainArchivedForDays;
        if (
          requestedDays !== undefined
          && (
            typeof requestedDays !== "number"
            || !Number.isInteger(requestedDays)
            || requestedDays < 1
            || requestedDays > 36500
          )
        ) {
          throw new Error("CONVERSATION_RETENTION_POLICY_INVALID");
        }
        const explicitOverride = typeof requestedDays === "number";
        const days = explicitOverride
          ? requestedDays
          : dependencies.retainArchivedForDays;
        if (
          !Number.isInteger(days)
          || days < 1
          || days > 36500
        ) {
          throw new Error("CONVERSATION_RETENTION_POLICY_INVALID");
        }

        let session: IdentitySessionV010 | undefined;
        const principal = requestContext?.principal
          ?? (session = dependencies.resolveIdentitySession()).principal;
        const context = requestContext?.context
          ?? dependencies.resolveContext(
            activeContextSelection(request),
            session ?? dependencies.resolveIdentitySession()
          );

        return result(request, await previewConversationRetentionV010({
          threadStore: dependencies.threadStore,
          principalSubjectId: principal.subjectId,
          context: context.activeContext,
          candidatePolicy: {
            contractVersion: "0.1.0",
            retainArchivedForDays: days
          },
          policySource: explicitOverride
            ? "PREVIEW_OVERRIDE"
            : dependencies.policySource,
          now: dependencies.now?.()
        }));
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}


export function createConversationRetentionPolicyGetActionHandlerV010(
  dependencies: ConversationRetentionPreviewActionDependenciesV010
): AppActionHandler {
  const days = dependencies.retainArchivedForDays;
  if (
    !Number.isInteger(days)
    || days < 1
    || days > 36500
  ) {
    throw new Error("CONVERSATION_RETENTION_POLICY_INVALID");
  }

  return {
    packageId: ENTERPRISE_AGENT_PACKAGE_ID,
    featureId: ENTERPRISE_AGENT_FEATURE_ID,
    commandCode: "enterprise-agent.thread.retention.policy.get",

    async execute(
      request,
      requestContext?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      try {
        let session: IdentitySessionV010 | undefined;
        if (!requestContext?.context) {
          session = dependencies.resolveIdentitySession();
          dependencies.resolveContext(
            activeContextSelection(request),
            session
          );
        }

        return result(request, {
          policy: {
            contractVersion: "0.1.0",
            retainArchivedForDays: days,
            source: dependencies.policySource,
            appliesOnlyTo: "ARCHIVED_THREADS",
            clockStartsAt: "archivedAt",
            activeThreadsNeverEligible: true,
            destructivePurgeEnabled: false
          }
        });
      } catch (error) {
        return failure(request, error);
      }
    }
  };
}
