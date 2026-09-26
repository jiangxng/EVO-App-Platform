import type { LlmInferenceProvider } from "../contracts/llm.js";
import type { ResolvedContextSetV010 } from "../contracts/platform-services.js";
import type { AppManagerService } from "./service.js";
import type { ProviderBindingStoreV010 } from "./provider-resolution.js";
import {
  resolveProviderRuntimeV010
} from "./provider-resolution.js";
import type { ProviderRuntimeRegistry } from "../providers/runtime-registry.js";
import { providerManagerCapabilityRoute } from "./provider-manager-page.js";
import { settingsPackageRoute } from "./settings-page.js";
import type { ChatExperienceV020 } from "../vendor/eidos/src/chat/contracts.js";
import type { SetupFlowV010 } from "../vendor/eidos/src/setup-flow/contracts.js";

export const PERSONAL_AGENT_SETUP_ROUTE = "/enterprise-agent/setup";
export const PERSONAL_AGENT_SETUP_PAGE_SOURCE =
  "app://enterprise-agent/pages/setup";

export type PersonalAgentReadinessStateV010 =
  | "ready"
  | "setup-required"
  | "unavailable"
  | "degraded";

export interface PersonalAgentReadinessV010 {
  contractVersion: "0.1.0";
  state: PersonalAgentReadinessStateV010;
  code:
    | "READY"
    | "LLM_PROVIDER_MISSING"
    | "LLM_PROVIDER_SELECTION_REQUIRED"
    | "LLM_PROVIDER_CONFIGURATION_REQUIRED"
    | "LLM_PROVIDER_UNAVAILABLE";
  providerIds: string[];
  selectedProviderId?: string;
  selectedProviderPackageId?: string;
  setupRoute: string;
  providerSettingsRoute?: string;
  providerBindingRoute?: string;
  diagnostic?: string;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

export function resolvePersonalAgentReadinessV010(
  manager: AppManagerService,
  registry: ProviderRuntimeRegistry,
  bindings: ProviderBindingStoreV010
): PersonalAgentReadinessV010 {
  const descriptors = manager.listEffectiveServiceProviders("llm.inference");
  const providerIds = unique(descriptors.map(item => item.providerId));

  if (providerIds.length === 0) {
    return {
      contractVersion: "0.1.0",
      state: "setup-required",
      code: "LLM_PROVIDER_MISSING",
      providerIds,
      setupRoute: PERSONAL_AGENT_SETUP_ROUTE
    };
  }

  try {
    const resolved = resolveProviderRuntimeV010<LlmInferenceProvider>(
      registry,
      descriptors,
      bindings,
      "llm.inference",
      { installationId: "default" }
    );

    if (!resolved) {
      const single = descriptors.length === 1 ? descriptors[0] : undefined;
      return {
        contractVersion: "0.1.0",
        state: "setup-required",
        code: providerIds.length > 1
          ? "LLM_PROVIDER_SELECTION_REQUIRED"
          : "LLM_PROVIDER_CONFIGURATION_REQUIRED",
        providerIds,
        setupRoute: PERSONAL_AGENT_SETUP_ROUTE,
        ...(single ? {
          selectedProviderId: single.providerId,
          selectedProviderPackageId: single.packageId,
          providerSettingsRoute: settingsPackageRoute(single.packageId)
        } : {
          providerBindingRoute: providerManagerCapabilityRoute("llm.inference")
        })
      };
    }

    const descriptor = descriptors.find(item => item.providerId === resolved.providerId);
    return {
      contractVersion: "0.1.0",
      state: resolved.health.state === "DEGRADED" ? "degraded" : "ready",
      code: "READY",
      providerIds,
      selectedProviderId: resolved.providerId,
      ...(descriptor ? {
        selectedProviderPackageId: descriptor.packageId,
        providerSettingsRoute: settingsPackageRoute(descriptor.packageId)
      } : {}),
      setupRoute: PERSONAL_AGENT_SETUP_ROUTE
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const ambiguous = message.startsWith("PROVIDER_RESOLUTION_AMBIGUOUS");
    return {
      contractVersion: "0.1.0",
      state: ambiguous ? "setup-required" : "unavailable",
      code: ambiguous
        ? "LLM_PROVIDER_SELECTION_REQUIRED"
        : "LLM_PROVIDER_UNAVAILABLE",
      providerIds,
      setupRoute: PERSONAL_AGENT_SETUP_ROUTE,
      ...(ambiguous
        ? { providerBindingRoute: providerManagerCapabilityRoute("llm.inference") }
        : {}),
      diagnostic: message
    };
  }
}

type UiLocale = "en" | "zh-CN" | "ja" | "zh-TW";

function uiLocale(locale: string): UiLocale {
  try {
    const canonical = Intl.getCanonicalLocales(locale.trim())[0] ?? "en";
    if (canonical === "zh-CN" || canonical.startsWith("zh-Hans")) return "zh-CN";
    if (canonical === "zh-TW" || canonical === "zh-HK" || canonical.startsWith("zh-Hant")) return "zh-TW";
    if (canonical.startsWith("ja")) return "ja";
    return "en";
  } catch {
    return "en";
  }
}

const copy = {
  en: {
    context: "Context",
    personal: "Personal",
    title: "Personal Agent",
    emptyTitle: "How can I help?",
    emptyDescription: "I can inspect your current context, explain what is happening, and prepare an opinion or plan.",
    placeholder: "Ask or describe a task",
    send: "Send",
    setupLabel: "Personal Agent needs setup",
    providerMissing: "Install and configure an LLM Provider before using Personal Agent.",
    providerSelection: "Choose which LLM Provider Personal Agent should use.",
    providerConfig: "Configure the installed LLM Provider credential and runtime settings.",
    providerUnavailable: "The selected LLM Provider is currently unavailable.",
    setUp: "Set up",
    suggestionAttention: "What needs my attention?",
    suggestionApps: "Show available apps",
    suggestionWorkspace: "Explain this workspace",
    setupTitle: "Personal Agent setup",
    setupDescription: "Complete the required platform-owned setup. Personal Agent itself remains provider-neutral.",
    providerStep: "LLM Provider",
    providerChoose: "Choose or install the Provider Personal Agent will use.",
    credentialsStep: "Provider credentials",
    credentialsDescription: "Credentials and model settings remain owned by the selected Provider and Host Secrets.",
    readinessStep: "Provider readiness",
    readinessDescription: "The Host verifies that the selected Provider can be resolved at runtime.",
    readyStep: "Ready",
    readyDescription: "Personal Agent is ready to use.",
    required: "Required",
    waiting: "Waiting",
    complete: "Complete",
    blocked: "Blocked",
    installProvider: "Open Plugins",
    chooseProvider: "Choose Provider",
    configureProvider: "Configure Provider",
    openAgent: "Open Personal Agent"
  },
  "zh-CN": {
    context: "上下文",
    personal: "个人",
    title: "个人 Agent",
    emptyTitle: "我可以帮你做什么？",
    emptyDescription: "我可以查看当前上下文、解释正在发生的事情，并整理意见或方案。",
    placeholder: "输入问题或描述任务",
    send: "发送",
    setupLabel: "个人 Agent 需要设置",
    providerMissing: "使用个人 Agent 前，请先安装并配置一个 LLM Provider。",
    providerSelection: "请选择个人 Agent 要使用的 LLM Provider。",
    providerConfig: "请配置已安装 LLM Provider 的凭据和运行设置。",
    providerUnavailable: "当前选择的 LLM Provider 暂时不可用。",
    setUp: "设置",
    suggestionAttention: "现在有什么需要我关注？",
    suggestionApps: "显示可用应用",
    suggestionWorkspace: "解释当前工作区",
    setupTitle: "个人 Agent 设置",
    setupDescription: "完成平台管理的必要设置。个人 Agent 本身保持 Provider 中立。",
    providerStep: "LLM Provider",
    providerChoose: "选择或安装个人 Agent 要使用的 Provider。",
    credentialsStep: "Provider 凭据",
    credentialsDescription: "凭据和模型设置继续由所选 Provider 与 Host Secrets 管理。",
    readinessStep: "Provider 就绪状态",
    readinessDescription: "Host 会验证所选 Provider 是否可以在运行时被正确解析。",
    readyStep: "准备完成",
    readyDescription: "个人 Agent 已可以使用。",
    required: "需要处理",
    waiting: "等待",
    complete: "完成",
    blocked: "受阻",
    installProvider: "打开插件",
    chooseProvider: "选择 Provider",
    configureProvider: "配置 Provider",
    openAgent: "打开个人 Agent"
  },
  ja: {
    context: "コンテキスト",
    personal: "個人",
    title: "パーソナルエージェント",
    emptyTitle: "何をお手伝いしましょうか？",
    emptyDescription: "現在のコンテキストを確認し、状況を説明して、意見や計画を整理できます。",
    placeholder: "質問やタスクを入力",
    send: "送信",
    setupLabel: "パーソナルエージェントの設定が必要です",
    providerMissing: "利用する前に LLM Provider をインストールして設定してください。",
    providerSelection: "使用する LLM Provider を選択してください。",
    providerConfig: "インストール済み LLM Provider の認証情報と実行設定を構成してください。",
    providerUnavailable: "選択した LLM Provider は現在利用できません。",
    setUp: "設定する",
    suggestionAttention: "今、確認すべきことは？",
    suggestionApps: "利用可能なアプリを表示",
    suggestionWorkspace: "現在のワークスペースを説明",
    setupTitle: "パーソナルエージェントのセットアップ",
    setupDescription: "プラットフォーム管理の必須設定を完了します。エージェント自体は Provider に依存しません。",
    providerStep: "LLM Provider",
    providerChoose: "使用する Provider を選択またはインストールします。",
    credentialsStep: "Provider 認証情報",
    credentialsDescription: "認証情報とモデル設定は選択した Provider と Host Secrets が管理します。",
    readinessStep: "Provider の準備状態",
    readinessDescription: "Host が実行時に Provider を解決できることを確認します。",
    readyStep: "準備完了",
    readyDescription: "パーソナルエージェントを利用できます。",
    required: "必須",
    waiting: "待機中",
    complete: "完了",
    blocked: "ブロック",
    installProvider: "プラグインを開く",
    chooseProvider: "Provider を選択",
    configureProvider: "Provider を設定",
    openAgent: "パーソナルエージェントを開く"
  },
  "zh-TW": {
    context: "上下文",
    personal: "個人",
    title: "個人 Agent",
    emptyTitle: "我可以如何協助你？",
    emptyDescription: "我可以查看目前上下文、說明正在發生的事情，並整理意見或方案。",
    placeholder: "輸入問題或描述工作",
    send: "傳送",
    setupLabel: "個人 Agent 需要設定",
    providerMissing: "使用個人 Agent 前，請先安裝並設定一個 LLM Provider。",
    providerSelection: "請選擇個人 Agent 要使用的 LLM Provider。",
    providerConfig: "請設定已安裝 LLM Provider 的憑證與執行設定。",
    providerUnavailable: "目前選擇的 LLM Provider 暫時無法使用。",
    setUp: "設定",
    suggestionAttention: "現在有什麼需要我注意？",
    suggestionApps: "顯示可用應用",
    suggestionWorkspace: "說明目前工作區",
    setupTitle: "個人 Agent 設定",
    setupDescription: "完成平台管理的必要設定。個人 Agent 本身保持 Provider 中立。",
    providerStep: "LLM Provider",
    providerChoose: "選擇或安裝個人 Agent 要使用的 Provider。",
    credentialsStep: "Provider 憑證",
    credentialsDescription: "憑證與模型設定仍由所選 Provider 與 Host Secrets 管理。",
    readinessStep: "Provider 就緒狀態",
    readinessDescription: "Host 會驗證所選 Provider 是否能在執行階段被正確解析。",
    readyStep: "準備完成",
    readyDescription: "個人 Agent 已可使用。",
    required: "需要處理",
    waiting: "等待",
    complete: "完成",
    blocked: "受阻",
    installProvider: "開啟外掛",
    chooseProvider: "選擇 Provider",
    configureProvider: "設定 Provider",
    openAgent: "開啟個人 Agent"
  }
} satisfies Record<UiLocale, Record<string, string>>;

function readinessMessage(
  readiness: PersonalAgentReadinessV010,
  text: {
    providerMissing: string;
    providerSelection: string;
    providerConfig: string;
    providerUnavailable: string;
  }
): string {
  if (readiness.code === "LLM_PROVIDER_MISSING") return text.providerMissing;
  if (readiness.code === "LLM_PROVIDER_SELECTION_REQUIRED") return text.providerSelection;
  if (readiness.code === "LLM_PROVIDER_CONFIGURATION_REQUIRED") return text.providerConfig;
  if (readiness.code === "LLM_PROVIDER_UNAVAILABLE") return text.providerUnavailable;
  return "";
}

export function createPersonalAgentChatPageV020(
  readiness: PersonalAgentReadinessV010,
  context: ResolvedContextSetV010,
  locale: string
): ChatExperienceV020 {
  const text = copy[uiLocale(locale)];
  const active = context.activeContext;
  const contextValue = active.kind === "PERSONAL"
    ? text.personal
    : context.enterpriseContext?.displayName ?? active.enterpriseId;

  return {
    contractVersion: "0.2.0" as const,
    kind: "chat" as const,
    id: "enterprise-agent.home",
    title: text.title,
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    context: {
      label: text.context,
      value: contextValue,
      tone: "neutral" as const
    },
    readiness: readiness.state === "ready"
      ? {
          state: "ready" as const,
          label: text.complete
        }
      : {
          state: readiness.state,
          label: text.setupLabel,
          message: readinessMessage(readiness, text),
          action: {
            id: "setup",
            label: text.setUp,
            type: "navigate" as const,
            route: PERSONAL_AGENT_SETUP_ROUTE
          }
        },
    composer: {
      key: "message",
      placeholder: text.placeholder,
      sendLabel: text.send,
      disabled: readiness.state !== "ready"
    },
    emptyState: {
      title: text.emptyTitle,
      description: text.emptyDescription,
      suggestions: [
        { id: "attention", label: text.suggestionAttention, prompt: text.suggestionAttention },
        { id: "apps", label: text.suggestionApps, prompt: text.suggestionApps },
        { id: "workspace", label: text.suggestionWorkspace, prompt: text.suggestionWorkspace }
      ]
    },
    metadata: {
      productIdentity: "Personal Agent",
      compatibilityPackageId: "enterprise-agent",
      readinessCode: readiness.code
    }
  };
}

export function createPersonalAgentSetupPageV010(
  readiness: PersonalAgentReadinessV010,
  locale: string
): SetupFlowV010 {
  const text = copy[uiLocale(locale)];
  const providerInstalled = readiness.providerIds.length > 0;
  const selectionRequired = readiness.code === "LLM_PROVIDER_SELECTION_REQUIRED";
  const configurationRequired = readiness.code === "LLM_PROVIDER_CONFIGURATION_REQUIRED";
  const ready = readiness.state === "ready" || readiness.state === "degraded";

  const providerAction = !providerInstalled
    ? {
        id: "open-plugins",
        label: text.installProvider,
        type: "navigate" as const,
        route: "/store",
        primary: true
      }
    : selectionRequired
      ? {
          id: "choose-provider",
          label: text.chooseProvider,
          type: "navigate" as const,
          route: readiness.providerBindingRoute ?? providerManagerCapabilityRoute("llm.inference"),
          primary: true
        }
      : undefined;

  const credentialAction = configurationRequired && readiness.providerSettingsRoute
    ? {
        id: "configure-provider",
        label: text.configureProvider,
        type: "navigate" as const,
        route: readiness.providerSettingsRoute,
        primary: true
      }
    : undefined;

  return {
    contractVersion: "0.1.0" as const,
    kind: "setup-flow" as const,
    id: "personal-agent.setup",
    title: text.setupTitle,
    description: text.setupDescription,
    steps: [
      {
        id: "provider",
        title: text.providerStep,
        description: text.providerChoose,
        state: !providerInstalled || selectionRequired ? "current" as const : "complete" as const,
        statusDetail: !providerInstalled || selectionRequired ? text.required : text.complete,
        ...(providerAction ? { primaryAction: providerAction } : {})
      },
      {
        id: "credentials",
        title: text.credentialsStep,
        description: text.credentialsDescription,
        state: !providerInstalled || selectionRequired
          ? "pending" as const
          : configurationRequired
            ? "current" as const
            : ready
              ? "complete" as const
              : readiness.state === "unavailable"
                ? "error" as const
                : "pending" as const,
        statusDetail: configurationRequired
          ? text.required
          : ready
            ? text.complete
            : readiness.state === "unavailable"
              ? text.blocked
              : text.waiting,
        ...(credentialAction ? { primaryAction: credentialAction } : {})
      },
      {
        id: "readiness",
        title: text.readinessStep,
        description: text.readinessDescription,
        state: ready
          ? "complete" as const
          : readiness.state === "unavailable"
            ? "error" as const
            : "pending" as const,
        statusDetail: ready
          ? text.complete
          : readiness.state === "unavailable"
            ? text.blocked
            : text.waiting
      },
      {
        id: "ready",
        title: text.readyStep,
        description: text.readyDescription,
        state: ready ? "complete" as const : "pending" as const,
        statusDetail: ready ? text.complete : text.waiting
      }
    ],
    ...(ready ? {
      completionAction: {
        id: "open-agent",
        label: text.openAgent,
        type: "navigate" as const,
        route: "/enterprise-agent",
        primary: true
      }
    } : {})
  };
}
