import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "../../actions/contracts.js";
import type { LlmInferenceProvider } from "../../contracts/llm.js";
import type {
  ActiveContextRefV010,
  IdentitySessionV010,
  PlatformPrincipalV010,
  PlatformRequestContextV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import type {
  AgentConversationMessageV010,
  AgentInteractionContextV010,
  AgentToolCatalogV010
} from "./contracts.js";
import { createEnterpriseAgentRuntime } from "./runtime.js";
import { createProviderBackedAgentModel } from "./provider-model.js";
import { presentPersonalAgentReplyV020 } from "./reply-presentation.js";
import { createHostObservedQualityEvidenceV010, type PersonalAgentQualityEvidenceStoreV010 } from "./quality-evidence-store.js";
import {
  ENTERPRISE_AGENT_FEATURE_ID,
  ENTERPRISE_AGENT_PACKAGE_ID
} from "./package.js";

export interface EnterpriseAgentChatDependencies {
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
  qualityEvidenceStore?: PersonalAgentQualityEvidenceStoreV010;
  now?: () => Date;
  qualityEventId?: () => string;
}

function localeForRequest(
  request: AppActionRequestV010,
  message: string
): string {
  const explicit = request.values.locale;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  return /[\u3400-\u9fff]/u.test(message) ? "zh-CN" : "en";
}

export const PERSONAL_AGENT_CONVERSATION_HISTORY_MAX_MESSAGES = 16;
export const PERSONAL_AGENT_CONVERSATION_HISTORY_MAX_CHARACTERS = 24_000;
export const PERSONAL_AGENT_CONVERSATION_HISTORY_MAX_MESSAGE_CHARACTERS = 8_000;
export const PERSONAL_AGENT_INTERACTION_CONTEXT_MAX_CHARACTERS = 16_000;

export function parsePersonalAgentInteractionContextV010(
  request: AppActionRequestV010
): AgentInteractionContextV010 | undefined {
  const raw = request.values.interactionContext;
  if (raw === undefined) return undefined;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("PERSONAL_AGENT_INTERACTION_CONTEXT_INVALID");
  }

  const serialized = JSON.stringify(raw);
  if (
    serialized.length
    > PERSONAL_AGENT_INTERACTION_CONTEXT_MAX_CHARACTERS
  ) {
    throw new Error("PERSONAL_AGENT_INTERACTION_CONTEXT_TOO_LARGE");
  }

  return JSON.parse(serialized) as AgentInteractionContextV010;
}

export function parsePersonalAgentConversationHistoryV010(
  request: AppActionRequestV010
): AgentConversationMessageV010[] {
  const raw = request.values.conversationHistory;
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    throw new Error("PERSONAL_AGENT_CONVERSATION_HISTORY_INVALID");
  }
  if (raw.length > PERSONAL_AGENT_CONVERSATION_HISTORY_MAX_MESSAGES) {
    throw new Error("PERSONAL_AGENT_CONVERSATION_HISTORY_TOO_MANY_MESSAGES");
  }

  const history: AgentConversationMessageV010[] = [];
  let totalCharacters = 0;

  for (const item of raw) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("PERSONAL_AGENT_CONVERSATION_HISTORY_ITEM_INVALID");
    }
    const role = item.role;
    const content = item.content;
    if (
      (role !== "user" && role !== "assistant")
      || typeof content !== "string"
      || !content.trim()
    ) {
      throw new Error("PERSONAL_AGENT_CONVERSATION_HISTORY_ITEM_INVALID");
    }
    const normalized = content.trim();
    if (normalized.length > PERSONAL_AGENT_CONVERSATION_HISTORY_MAX_MESSAGE_CHARACTERS) {
      throw new Error("PERSONAL_AGENT_CONVERSATION_HISTORY_MESSAGE_TOO_LARGE");
    }
    totalCharacters += normalized.length;
    if (totalCharacters > PERSONAL_AGENT_CONVERSATION_HISTORY_MAX_CHARACTERS) {
      throw new Error("PERSONAL_AGENT_CONVERSATION_HISTORY_TOO_LARGE");
    }
    history.push({
      role,
      content: normalized
    });
  }

  return history;
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

function errorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const [candidate] = message.split(":");
  return candidate && /^[A-Z0-9_]+$/.test(candidate)
    ? candidate
    : "CONTEXT_RESOLUTION_FAILED";
}

export function createEnterpriseAgentChatActionHandler(
  dependencies: EnterpriseAgentChatDependencies
): AppActionHandler {
  return {
    packageId: ENTERPRISE_AGENT_PACKAGE_ID,
    featureId: ENTERPRISE_AGENT_FEATURE_ID,
    commandCode: "enterprise-agent.chat",

    async execute(
      request: AppActionRequestV010,
      requestContext?: PlatformRequestContextV010
    ): Promise<AppActionExecutionResultV010> {
      const message = request.values.message;
      if (typeof message !== "string" || !message.trim()) {
        return {
          ok: false,
          error: {
            code: "MESSAGE_REQUIRED",
            message: "请输入要让个人 Agent 处理的内容。"
          }
        };
      }

      let principal: PlatformPrincipalV010;
      let context: ResolvedContextSetV010;
      try {
        if (requestContext?.context) {
          principal = requestContext.principal;
          context = requestContext.context;
        } else {
          const session: IdentitySessionV010 = dependencies.resolveIdentitySession();
          principal = session.principal;
          context = dependencies.resolveContext(activeContextSelection(request), session);
        }
      } catch (error) {
        return {
          ok: false,
          error: {
            code: errorCode(error),
            message: error instanceof Error ? error.message : "Identity/Context resolution failed."
          }
        };
      }

      const resolved = dependencies.resolveLlmProvider();
      if (!resolved.provider) {
        return {
          ok: false,
          error: {
            code: resolved.installedProviderIds.length > 0
              ? "LLM_PROVIDER_NOT_CONFIGURED"
              : "LLM_PROVIDER_REQUIRED",
            message: resolved.installedProviderIds.length > 0
              ? "LLM Provider 已安装，但运行时凭据/配置尚未就绪。"
              : "个人 Agent 需要先安装一个提供 llm.inference 的 LLM Provider 插件。"
          }
        };
      }

      let conversationHistory: AgentConversationMessageV010[];
      let interactionContext: AgentInteractionContextV010 | undefined;
      try {
        conversationHistory = parsePersonalAgentConversationHistoryV010(request);
        interactionContext =
          parsePersonalAgentInteractionContextV010(request);
      } catch (error) {
        return {
          ok: false,
          error: {
            code: errorCode(error),
            message: error instanceof Error
              ? error.message
              : "Conversation/interaction context validation failed."
          }
        };
      }

      const locale = localeForRequest(request, message);
      const runtime = createEnterpriseAgentRuntime(
        createProviderBackedAgentModel(resolved.provider),
        dependencies.createToolCatalog(
          locale,
          context,
          principal,
          requestContext,
          {
            sourceInteractionId: request.sourceInteractionId,
            sourceActionId: request.actionId
          }
        )
      );

      const reply = await runtime.chat(
        message.trim(),
        context,
        principal,
        conversationHistory,
        interactionContext
      );
      if (dependencies.qualityEvidenceStore) {
        dependencies.qualityEvidenceStore.append(createHostObservedQualityEvidenceV010({
          eventId: `agent-quality:${dependencies.qualityEventId?.() ?? request.sourceInteractionId}`,
          interactionId: request.sourceInteractionId,
          occurredAt: (dependencies.now?.() ?? new Date()).toISOString(),
          principalSubjectId: principal.subjectId,
          context: context.activeContext,
          observations: reply.observations
        }));
      }
      return {
        ok: true,
        correlationId: request.sourceInteractionId,
        result: JSON.parse(JSON.stringify({
          ...reply,
          messageParts: presentPersonalAgentReplyV020(reply, locale)
        }))
      };
    }
  };
}
