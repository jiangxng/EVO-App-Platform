import type {
  AppActionExecutionResultV010,
  AppActionHandler,
  AppActionRequestV010
} from "../../actions/contracts.js";
import type { LlmInferenceProvider } from "../../contracts/llm.js";
import type {
  ActiveContextRefV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";
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
  resolveContext(selection?: ActiveContextRefV010): ResolvedContextSetV010;
  createToolCatalog(
    locale: string,
    context: ResolvedContextSetV010
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

function canonicalUiLocale(locale: string): "en" | "zh-CN" | "ja" | "zh-TW" {
  try {
    const canonical = Intl.getCanonicalLocales(locale.trim())[0] ?? "en";
    if (canonical === "zh-CN" || canonical.startsWith("zh-Hans")) return "zh-CN";
    if (canonical === "zh-TW" || canonical === "zh-HK" || canonical.startsWith("zh-Hant")) return "zh-TW";
    if (canonical === "ja" || canonical.startsWith("ja-")) return "ja";
    return "en";
  } catch {
    return "en";
  }
}

const toolLabels = {
  en: {
    "context.current.get": "Checked current Context",
    "platform.snapshot.get": "Read platform state",
    "capability.list": "Read available capabilities",
    "app.catalog.list": "Read available apps",
    "app.install.plan": "Prepared installation plan",
    "app.install.execute": "Executed package installation",
    "provider.list": "Read available Providers",
    "provider.health.get": "Read Provider health",
    "provider.binding.list": "Read Provider bindings",
    "help.search": "Searched product Help"
  },
  "zh-CN": {
    "context.current.get": "已查看当前上下文",
    "platform.snapshot.get": "已读取平台状态",
    "capability.list": "已读取可用能力",
    "app.catalog.list": "已读取可用应用",
    "app.install.plan": "已准备安装计划",
    "app.install.execute": "已执行 Package 安装",
    "provider.list": "已读取可用 Provider",
    "provider.health.get": "已读取 Provider 健康状态",
    "provider.binding.list": "已读取 Provider 绑定",
    "help.search": "已搜索产品帮助"
  },
  ja: {
    "context.current.get": "現在のコンテキストを確認しました",
    "platform.snapshot.get": "プラットフォーム状態を確認しました",
    "capability.list": "利用可能な機能を確認しました",
    "app.catalog.list": "利用可能なアプリを確認しました",
    "app.install.plan": "インストール計画を作成しました",
    "app.install.execute": "Package をインストールしました",
    "provider.list": "利用可能な Provider を確認しました",
    "provider.health.get": "Provider の状態を確認しました",
    "provider.binding.list": "Provider バインディングを確認しました",
    "help.search": "製品ヘルプを検索しました"
  },
  "zh-TW": {
    "context.current.get": "已查看目前上下文",
    "platform.snapshot.get": "已讀取平台狀態",
    "capability.list": "已讀取可用能力",
    "app.catalog.list": "已讀取可用應用",
    "app.install.plan": "已準備安裝計畫",
    "app.install.execute": "已執行 Package 安裝",
    "provider.list": "已讀取可用 Provider",
    "provider.health.get": "已讀取 Provider 健康狀態",
    "provider.binding.list": "已讀取 Provider 綁定",
    "help.search": "已搜尋產品說明"
  }
} as const;

function activityLabel(locale: string, tool: string): string {
  const ui = canonicalUiLocale(locale);
  return (toolLabels[ui] as Record<string, string>)[tool] ?? tool;
}

function messageParts(locale: string, reply: {
  message: string;
  observations: Array<{
    tool: string;
    ok: boolean;
    error?: { message: string };
  }>;
}) {
  return [
    ...reply.observations.map(observation => ({
      type: "activity" as const,
      label: activityLabel(locale, observation.tool),
      state: observation.ok ? "complete" as const : "error" as const,
      ...(observation.error?.message ? { detail: observation.error.message } : {})
    })),
    {
      type: "text" as const,
      text: reply.message
    }
  ];
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

      let context: ResolvedContextSetV010;
      try {
        context = dependencies.resolveContext(activeContextSelection(request));
      } catch (error) {
        return {
          ok: false,
          error: {
            code: errorCode(error),
            message: error instanceof Error ? error.message : "Context resolution failed."
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
        dependencies.createToolCatalog(locale, context)
      );

      const reply = await runtime.chat(message.trim(), context);
      return {
        ok: true,
        correlationId: request.sourceInteractionId,
        result: JSON.parse(JSON.stringify({
          ...reply,
          messageParts: messageParts(locale, reply)
        }))
      };
    }
  };
}
