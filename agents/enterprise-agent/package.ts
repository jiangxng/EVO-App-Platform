import type { PackageManifestV010 } from "../../contracts/package.js";

export const ENTERPRISE_AGENT_PACKAGE_ID = "enterprise-agent";
export const ENTERPRISE_AGENT_FEATURE_ID = "enterprise-agent.default";
export const ENTERPRISE_AGENT_PAGE_SOURCE = "app://enterprise-agent/pages/home";
export const ENTERPRISE_AGENT_SETUP_PAGE_SOURCE = "app://enterprise-agent/pages/setup";

const localeMessages = {
  en: {
    "workbench.activity.label": "Personal Agent",
    "navigation.enterprise-agent.nav.label": "Personal Agent",
    "page.enterprise-agent.home.title": "Personal Agent",
    "page.personal-agent.setup.title": "Personal Agent setup",
    "chat.enterprise-agent.home.composer.placeholder": "Ask or describe a task",
    "chat.enterprise-agent.home.composer.sendLabel": "Send",
    "chat.enterprise-agent.home.context.label": "Context",
    "chat.enterprise-agent.home.empty.title": "How can I help?",
    "chat.enterprise-agent.home.empty.description": "I can inspect your current context, explain what is happening, and prepare an opinion or plan.",
    "chat.enterprise-agent.home.suggestion.attention.label": "What needs my attention?",
    "chat.enterprise-agent.home.suggestion.apps.label": "Show available apps",
    "chat.enterprise-agent.home.suggestion.workspace.label": "Explain this workspace",
    "chat.enterprise-agent.home.readiness.setup-required.label": "Personal Agent needs setup",
    "chat.enterprise-agent.home.readiness.setup-required.message": "Complete the required LLM Provider setup before using Personal Agent.",
    "chat.enterprise-agent.home.readiness.unavailable.label": "Personal Agent is unavailable",
    "chat.enterprise-agent.home.readiness.unavailable.message": "The selected LLM Provider is currently unavailable.",
    "chat.enterprise-agent.home.readiness.degraded.label": "Personal Agent is degraded",
    "chat.enterprise-agent.home.action.setup.label": "Set up",
    "setup.personal-agent.setup.title": "Personal Agent setup",
    "setup.personal-agent.setup.description": "Complete the required platform-owned setup. Personal Agent itself remains provider-neutral.",
    "setup.personal-agent.setup.step.provider.title": "LLM Provider",
    "setup.personal-agent.setup.step.provider.description": "Choose or install the Provider Personal Agent will use.",
    "setup.personal-agent.setup.step.credentials.title": "Provider credentials",
    "setup.personal-agent.setup.step.credentials.description": "Credentials and model settings remain owned by the selected Provider and Host Secrets.",
    "setup.personal-agent.setup.step.readiness.title": "Provider readiness",
    "setup.personal-agent.setup.step.readiness.description": "The Host verifies that the selected Provider can be resolved at runtime.",
    "setup.personal-agent.setup.step.ready.title": "Ready",
    "setup.personal-agent.setup.step.ready.description": "Personal Agent is ready to use.",
    "setup.personal-agent.setup.action.open-plugins.label": "Open Plugins",
    "setup.personal-agent.setup.action.choose-provider.label": "Choose Provider",
    "setup.personal-agent.setup.action.configure-provider.label": "Configure Provider",
    "setup.personal-agent.setup.action.open-agent.label": "Open Personal Agent"
  },
  "zh-CN": {
    "workbench.activity.label": "个人 Agent",
    "navigation.enterprise-agent.nav.label": "个人 Agent",
    "page.enterprise-agent.home.title": "个人 Agent",
    "page.personal-agent.setup.title": "个人 Agent 设置",
    "chat.enterprise-agent.home.composer.placeholder": "输入问题或描述任务",
    "chat.enterprise-agent.home.composer.sendLabel": "发送",
    "chat.enterprise-agent.home.context.label": "上下文",
    "chat.enterprise-agent.home.empty.title": "我可以帮你做什么？",
    "chat.enterprise-agent.home.empty.description": "我可以查看当前上下文、解释正在发生的事情，并整理意见或方案。",
    "chat.enterprise-agent.home.suggestion.attention.label": "现在有什么需要我关注？",
    "chat.enterprise-agent.home.suggestion.apps.label": "显示可用应用",
    "chat.enterprise-agent.home.suggestion.workspace.label": "解释当前工作区",
    "chat.enterprise-agent.home.readiness.setup-required.label": "个人 Agent 需要设置",
    "chat.enterprise-agent.home.readiness.setup-required.message": "使用个人 Agent 前，请完成所需的 LLM Provider 设置。",
    "chat.enterprise-agent.home.readiness.unavailable.label": "个人 Agent 暂不可用",
    "chat.enterprise-agent.home.readiness.unavailable.message": "当前选择的 LLM Provider 暂时不可用。",
    "chat.enterprise-agent.home.readiness.degraded.label": "个人 Agent 当前性能受限",
    "chat.enterprise-agent.home.action.setup.label": "设置",
    "setup.personal-agent.setup.title": "个人 Agent 设置",
    "setup.personal-agent.setup.description": "完成平台管理的必要设置。个人 Agent 本身保持 Provider 中立。",
    "setup.personal-agent.setup.step.provider.title": "LLM Provider",
    "setup.personal-agent.setup.step.provider.description": "选择或安装个人 Agent 要使用的 Provider。",
    "setup.personal-agent.setup.step.credentials.title": "Provider 凭据",
    "setup.personal-agent.setup.step.credentials.description": "凭据和模型设置继续由所选 Provider 与 Host Secrets 管理。",
    "setup.personal-agent.setup.step.readiness.title": "Provider 就绪状态",
    "setup.personal-agent.setup.step.readiness.description": "Host 会验证所选 Provider 是否能在运行时被正确解析。",
    "setup.personal-agent.setup.step.ready.title": "准备完成",
    "setup.personal-agent.setup.step.ready.description": "个人 Agent 已可以使用。",
    "setup.personal-agent.setup.action.open-plugins.label": "打开插件",
    "setup.personal-agent.setup.action.choose-provider.label": "选择 Provider",
    "setup.personal-agent.setup.action.configure-provider.label": "配置 Provider",
    "setup.personal-agent.setup.action.open-agent.label": "打开个人 Agent"
  },
  ja: {
    "workbench.activity.label": "パーソナルエージェント",
    "navigation.enterprise-agent.nav.label": "パーソナルエージェント",
    "page.enterprise-agent.home.title": "パーソナルエージェント",
    "page.personal-agent.setup.title": "パーソナルエージェントのセットアップ",
    "chat.enterprise-agent.home.composer.placeholder": "質問やタスクを入力",
    "chat.enterprise-agent.home.composer.sendLabel": "送信",
    "chat.enterprise-agent.home.context.label": "コンテキスト",
    "chat.enterprise-agent.home.empty.title": "何をお手伝いしましょうか？",
    "chat.enterprise-agent.home.empty.description": "現在のコンテキストを確認し、状況を説明して、意見や計画を整理できます。",
    "chat.enterprise-agent.home.suggestion.attention.label": "今、確認すべきことは？",
    "chat.enterprise-agent.home.suggestion.apps.label": "利用可能なアプリを表示",
    "chat.enterprise-agent.home.suggestion.workspace.label": "現在のワークスペースを説明",
    "chat.enterprise-agent.home.readiness.setup-required.label": "パーソナルエージェントの設定が必要です",
    "chat.enterprise-agent.home.readiness.setup-required.message": "利用する前に必要な LLM Provider の設定を完了してください。",
    "chat.enterprise-agent.home.readiness.unavailable.label": "パーソナルエージェントを利用できません",
    "chat.enterprise-agent.home.readiness.unavailable.message": "選択した LLM Provider は現在利用できません。",
    "chat.enterprise-agent.home.readiness.degraded.label": "パーソナルエージェントの状態が低下しています",
    "chat.enterprise-agent.home.action.setup.label": "設定する",
    "setup.personal-agent.setup.title": "パーソナルエージェントのセットアップ",
    "setup.personal-agent.setup.description": "プラットフォーム管理の必須設定を完了します。エージェント自体は Provider に依存しません。",
    "setup.personal-agent.setup.step.provider.title": "LLM Provider",
    "setup.personal-agent.setup.step.provider.description": "使用する Provider を選択またはインストールします。",
    "setup.personal-agent.setup.step.credentials.title": "Provider 認証情報",
    "setup.personal-agent.setup.step.credentials.description": "認証情報とモデル設定は選択した Provider と Host Secrets が管理します。",
    "setup.personal-agent.setup.step.readiness.title": "Provider の準備状態",
    "setup.personal-agent.setup.step.readiness.description": "Host が実行時に Provider を解決できることを確認します。",
    "setup.personal-agent.setup.step.ready.title": "準備完了",
    "setup.personal-agent.setup.step.ready.description": "パーソナルエージェントを利用できます。",
    "setup.personal-agent.setup.action.open-plugins.label": "プラグインを開く",
    "setup.personal-agent.setup.action.choose-provider.label": "Provider を選択",
    "setup.personal-agent.setup.action.configure-provider.label": "Provider を設定",
    "setup.personal-agent.setup.action.open-agent.label": "パーソナルエージェントを開く"
  },
  "zh-TW": {
    "workbench.activity.label": "個人 Agent",
    "navigation.enterprise-agent.nav.label": "個人 Agent",
    "page.enterprise-agent.home.title": "個人 Agent",
    "page.personal-agent.setup.title": "個人 Agent 設定",
    "chat.enterprise-agent.home.composer.placeholder": "輸入問題或描述工作",
    "chat.enterprise-agent.home.composer.sendLabel": "傳送",
    "chat.enterprise-agent.home.context.label": "上下文",
    "chat.enterprise-agent.home.empty.title": "我可以如何協助你？",
    "chat.enterprise-agent.home.empty.description": "我可以查看目前上下文、說明正在發生的事情，並整理意見或方案。",
    "chat.enterprise-agent.home.suggestion.attention.label": "現在有什麼需要我注意？",
    "chat.enterprise-agent.home.suggestion.apps.label": "顯示可用應用",
    "chat.enterprise-agent.home.suggestion.workspace.label": "說明目前工作區",
    "chat.enterprise-agent.home.readiness.setup-required.label": "個人 Agent 需要設定",
    "chat.enterprise-agent.home.readiness.setup-required.message": "使用個人 Agent 前，請完成必要的 LLM Provider 設定。",
    "chat.enterprise-agent.home.readiness.unavailable.label": "個人 Agent 暫時無法使用",
    "chat.enterprise-agent.home.readiness.unavailable.message": "目前選擇的 LLM Provider 暫時無法使用。",
    "chat.enterprise-agent.home.readiness.degraded.label": "個人 Agent 目前狀態受限",
    "chat.enterprise-agent.home.action.setup.label": "設定",
    "setup.personal-agent.setup.title": "個人 Agent 設定",
    "setup.personal-agent.setup.description": "完成平台管理的必要設定。個人 Agent 本身保持 Provider 中立。",
    "setup.personal-agent.setup.step.provider.title": "LLM Provider",
    "setup.personal-agent.setup.step.provider.description": "選擇或安裝個人 Agent 要使用的 Provider。",
    "setup.personal-agent.setup.step.credentials.title": "Provider 憑證",
    "setup.personal-agent.setup.step.credentials.description": "憑證與模型設定仍由所選 Provider 與 Host Secrets 管理。",
    "setup.personal-agent.setup.step.readiness.title": "Provider 就緒狀態",
    "setup.personal-agent.setup.step.readiness.description": "Host 會驗證所選 Provider 是否能在執行階段被正確解析。",
    "setup.personal-agent.setup.step.ready.title": "準備完成",
    "setup.personal-agent.setup.step.ready.description": "個人 Agent 已可使用。",
    "setup.personal-agent.setup.action.open-plugins.label": "開啟外掛",
    "setup.personal-agent.setup.action.choose-provider.label": "選擇 Provider",
    "setup.personal-agent.setup.action.configure-provider.label": "設定 Provider",
    "setup.personal-agent.setup.action.open-agent.label": "開啟個人 Agent"
  }
} as const;

function localizationContribution(locale: keyof typeof localeMessages) {
  return {
    kind: "eidos.localization-bundle" as const,
    bundle: {
      contractVersion: "0.1.0" as const,
      namespace: ENTERPRISE_AGENT_PACKAGE_ID,
      locale,
      messages: { ...localeMessages[locale] }
    }
  };
}

export const enterpriseAgentPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: ENTERPRISE_AGENT_PACKAGE_ID,
  displayName: "Personal Agent",
  version: "0.1.0",
  type: "AGENT",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: ENTERPRISE_AGENT_FEATURE_ID,
      packageId: ENTERPRISE_AGENT_PACKAGE_ID,
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: [
        "agent.personal",
        "agent.personal.tool-discovery",
        "agent.enterprise",
        "agent.enterprise.app-manager-tools",
        "agent.enterprise.tool-discovery"
      ],
      contributions: [
        {
          kind: "eidos.experience",
          manifest: {
            contractVersion: "0.1.0",
            experienceId: "enterprise-agent",
            packageId: ENTERPRISE_AGENT_PACKAGE_ID,
            featureId: ENTERPRISE_AGENT_FEATURE_ID,
            defaultRoute: "/enterprise-agent",
            pages: [
              {
                id: "enterprise-agent.home",
                title: "Personal Agent",
                source: ENTERPRISE_AGENT_PAGE_SOURCE
              },
              {
                id: "personal-agent.setup",
                title: "Personal Agent setup",
                source: ENTERPRISE_AGENT_SETUP_PAGE_SOURCE
              }
            ],
            routes: [
              {
                id: "enterprise-agent.home",
                path: "/enterprise-agent",
                pageId: "enterprise-agent.home"
              },
              {
                id: "personal-agent.setup",
                path: "/enterprise-agent/setup",
                pageId: "personal-agent.setup"
              }
            ],
            navigation: [
              {
                id: "enterprise-agent.nav",
                label: "Personal Agent",
                route: "/enterprise-agent",
                order: 10
              }
            ]
          }
        },
        {
          kind: "eidos.workbench-activity",
          activity: {
            contractVersion: "0.1.0",
            id: "enterprise-agent",
            title: "Personal Agent",
            icon: "agent",
            kind: "side-route",
            route: "/enterprise-agent",
            order: 20,
            localization: {
              namespace: ENTERPRISE_AGENT_PACKAGE_ID,
              key: "workbench.activity.label"
            }
          }
        },
        localizationContribution("en"),
        localizationContribution("zh-CN"),
        localizationContribution("ja"),
        localizationContribution("zh-TW")
      ]
    }
  ]
};

export const enterpriseAgentExperienceAssets = new Map<string, unknown>([
  [ENTERPRISE_AGENT_PAGE_SOURCE, {
    contractVersion: "0.2.0",
    kind: "chat",
    id: "enterprise-agent.home",
    title: "Personal Agent",
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    context: {
      label: "Context",
      value: "Personal",
      tone: "neutral"
    },
    readiness: {
      state: "setup-required",
      label: "Personal Agent needs setup",
      message: "Complete the required LLM Provider setup before using Personal Agent.",
      action: {
        id: "setup",
        label: "Set up",
        type: "navigate",
        route: "/enterprise-agent/setup"
      }
    },
    composer: {
      key: "message",
      placeholder: "Ask or describe a task",
      sendLabel: "Send",
      disabled: true
    },
    emptyState: {
      title: "How can I help?",
      description: "I can inspect your current context, explain what is happening, and prepare an opinion or plan.",
      suggestions: [
        { id: "attention", label: "What needs my attention?", prompt: "What needs my attention?" },
        { id: "apps", label: "Show available apps", prompt: "Show available apps" },
        { id: "workspace", label: "Explain this workspace", prompt: "Explain this workspace" }
      ]
    },
    metadata: {
      packageId: ENTERPRISE_AGENT_PACKAGE_ID,
      featureId: ENTERPRISE_AGENT_FEATURE_ID,
      productIdentity: "Personal Agent",
      llm: {
        requiredCapability: "llm.inference",
        integrationStatus: "PROVIDER_RESOLVED_AT_RUNTIME"
      }
    }
  }]
]);
