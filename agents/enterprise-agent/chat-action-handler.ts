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
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
import type { AgentToolCatalogV010 } from "./contracts.js";
import { createEnterpriseAgentRuntime } from "./runtime.js";
import { createProviderBackedAgentModel } from "./provider-model.js";
import { presentPersonalAgentReplyV020 } from "./reply-presentation.js";
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
    principal: PlatformPrincipalV010
  ): AgentToolCatalogV010;
}

function localeForRequest(
  request: AppActionRequestV010,
  message: string
): string {
  const explicit = request.values.locale;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  return /[\u3400-\u9fff]/u.test(message) ? "zh-CN" : "en";
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

    async execute(request: AppActionRequestV010): Promise<AppActionExecutionResultV010> {
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

      let session: IdentitySessionV010;
      let context: ResolvedContextSetV010;
      try {
        session = dependencies.resolveIdentitySession();
        context = dependencies.resolveContext(activeContextSelection(request), session);
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

      const locale = localeForRequest(request, message);
      const runtime = createEnterpriseAgentRuntime(
        createProviderBackedAgentModel(resolved.provider),
        dependencies.createToolCatalog(locale, context, session.principal)
      );

      const reply = await runtime.chat(message.trim(), context, session.principal);
      return {
        ok: true,
        correlationId: request.sourceInteractionId,
        result: JSON.parse(JSON.stringify({
          ...reply,
          messageParts: presentPersonalAgentReplyV020(reply)
        }))
      };
    }
  };
}
