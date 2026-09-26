import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "../../actions/contracts.js";
import type { LlmInferenceProvider } from "../../contracts/llm.js";
import type { AgentToolCatalogV010 } from "./contracts.js";
import { createEnterpriseAgentRuntime } from "./runtime.js";
import { createProviderBackedAgentModel } from "./provider-model.js";
import {
  ENTERPRISE_AGENT_FEATURE_ID,
  ENTERPRISE_AGENT_PACKAGE_ID
} from "./package.js";

export interface EnterpriseAgentChatDependencies {
  resolveLlmProvider(): {
    installedProviderIds: string[];
    provider?: LlmInferenceProvider;
  };
  createToolCatalog(locale: string): AgentToolCatalogV010;
}

function localeForRequest(
  request: AppActionRequestV010,
  message: string
): string {
  const explicit = request.values.locale;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  return /[\u3400-\u9fff]/u.test(message) ? "zh-CN" : "en";
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
            message: "请输入要让 Enterprise Agent 处理的内容。"
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
              : "Enterprise Agent 需要先安装一个提供 llm.inference 的 LLM Provider 插件。"
          }
        };
      }

      const locale = localeForRequest(request, message);
      const runtime = createEnterpriseAgentRuntime(
        createProviderBackedAgentModel(resolved.provider),
        dependencies.createToolCatalog(locale)
      );

      const reply = await runtime.chat(message.trim());
      return {
        ok: true,
        correlationId: request.sourceInteractionId,
        result: JSON.parse(JSON.stringify(reply))
      };
    }
  };
}
