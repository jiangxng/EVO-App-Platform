import type { PackageManifestV010 } from "../../contracts/package.js";

export const ENTERPRISE_AGENT_PACKAGE_ID = "enterprise-agent";
export const ENTERPRISE_AGENT_FEATURE_ID = "enterprise-agent.default";
export const ENTERPRISE_AGENT_PAGE_SOURCE = "app://enterprise-agent/pages/home";
export const PERSONAL_AGENT_SETUP_PAGE_SOURCE = "app://enterprise-agent/pages/setup";
export const PERSONAL_AGENT_HOME_ROUTE = "/enterprise-agent";
export const PERSONAL_AGENT_SETUP_ROUTE = "/enterprise-agent/setup";

type LocaleMessages = Record<string, string>;

function localizationBundle(locale: string, messages: LocaleMessages) {
  return {
    kind: "eidos.localization-bundle" as const,
    bundle: {
      contractVersion: "0.1.0" as const,
      namespace: ENTERPRISE_AGENT_PACKAGE_ID,
      locale,
      messages
    }
  };
}

const en: LocaleMessages = {
  "workbench.activity.label": "Personal Agent",
  "navigation.enterprise-agent.nav.label": "Personal Agent",
  "page.enterprise-agent.home.title": "Personal Agent",
  "chat.enterprise-agent.home.composer.placeholder": "Ask a question or describe a task",
  "chat.enterprise-agent.home.composer.sendLabel": "Send",
  "chat.enterprise-agent.home.context.label": "Context",
  "chat.enterprise-agent.home.readiness.ready.label": "Ready",
  "chat.enterprise-agent.home.readiness.setup-required.label": "Personal Agent needs setup",
  "chat.enterprise-agent.home.readiness.setup-required.message": "Choose and configure an LLM Provider before starting a conversation.",
  "chat.enterprise-agent.home.readiness.unavailable.label": "Personal Agent is unavailable",
  "chat.enterprise-agent.home.readiness.unavailable.message": "The selected LLM Provider is currently unavailable.",
  "chat.enterprise-agent.home.action.setup.label": "Set up",
  "chat.enterprise-agent.home.empty.title": "How can I help?",
  "chat.enterprise-agent.home.empty.description": "I can inspect the current Context, explain what is happening, and prepare an opinion or plan for you to review.",
  "chat.enterprise-agent.home.suggestion.attention.label": "What needs my attention?",
  "chat.enterprise-agent.home.suggestion.apps.label": "Show available apps",
  "chat.enterprise-agent.home.suggestion.workspace.label": "Explain this workspace",
  "setup.personal-agent.setup.title": "Personal Agent setup",
  "setup.personal-agent.setup.description": "Complete the required steps to make Personal Agent ready.",
  "setup.personal-agent.setup.step.provider.title": "LLM Provider",
  "setup.personal-agent.setup.step.provider.description": "Choose or install the inference Provider Personal Agent will use.",
  "setup.personal-agent.setup.step.provider.status.current": "Required",
  "setup.personal-agent.setup.step.provider.status.complete": "Complete",
  "setup.personal-agent.setup.step.provider.status.error": "Needs attention",
  "setup.personal-agent.setup.step.credentials.title": "Provider credentials",
  "setup.personal-agent.setup.step.credentials.description": "Configure credentials on the Provider-owned Settings surface.",
  "setup.personal-agent.setup.step.credentials.status.current": "Required",
  "setup.personal-agent.setup.step.credentials.status.complete": "Complete",
  "setup.personal-agent.setup.step.credentials.status.pending": "Waiting",
  "setup.personal-agent.setup.step.readiness.title": "Provider readiness",
  "setup.personal-agent.setup.step.readiness.description": "The Host verifies that a usable Provider runtime can be resolved.",
  "setup.personal-agent.setup.step.readiness.status.current": "Checking",
  "setup.personal-agent.setup.step.readiness.status.complete": "Ready",
  "setup.personal-agent.setup.step.readiness.status.error": "Unavailable",
  "setup.personal-agent.setup.step.readiness.status.pending": "Waiting",
  "setup.personal-agent.setup.step.ready.title": "Ready",
  "setup.personal-agent.setup.step.ready.description": "Personal Agent is ready for use.",
  "setup.personal-agent.setup.step.ready.status.complete": "Complete",
  "setup.personal-agent.setup.step.ready.status.pending": "Waiting",
  "setup.personal-agent.setup.action.open-plugins.label": "Open Plugins",
  "setup.personal-agent.setup.action.configure-provider.label": "Configure provider",
  "setup.personal-agent.setup.action.choose-provider.label": "Choose provider",
  "setup.personal-agent.setup.action.open-agent.label": "Open Personal Agent"
};

const zhCN: LocaleMessages = {
  "workbench.activity.label": "个人 Agent",
  "navigation.enterprise-agent.nav.label": "个人 Agent",
  "page.enterprise-agent.home.title": "个人 Agent",
  "chat.enterprise-agent.home.composer.placeholder": "输入问题或描述一项工作",
  "chat.enterprise-agent.home.composer.sendLabel": "发送",
  "chat.enterprise-agent.home.context.label": "上下文",
  "chat.enterprise-agent.home.readiness.ready.label": "已就绪",
  "chat.enterprise-agent.home.readiness.setup-required.label": "个人 Agent 需要完成设置",
  "chat.enterprise-agent.home.readiness.setup-required.message": "开始对话前，请选择并配置一个 LLM Provider。",
  "chat.enterprise-agent.home.readiness.unavailable.label": "个人 Agent 当前不可用",
  "chat.enterprise-agent.home.readiness.unavailable.message": "当前选择的 LLM Provider 暂时不可用。",
  "chat.enterprise-agent.home.action.setup.label": "设置",
  "chat.enterprise-agent.home.empty.title": "我可以帮你做什么？",
  "chat.enterprise-agent.home.empty.description": "我可以查看当前上下文、解释正在发生的事情，并整理意见或计划交给你审核。",
  "chat.enterprise-agent.home.suggestion.attention.label": "现在有什么需要我关注？",
  "chat.enterprise-agent.home.suggestion.apps.label": "显示可用应用",
  "chat.enterprise-agent.home.suggestion.workspace.label": "解释当前工作区",
  "setup.personal-agent.setup.title": "个人 Agent 设置",
  "setup.personal-agent.setup.description": "完成必要步骤，让个人 Agent 可以开始工作。",
  "setup.personal-agent.setup.step.provider.title": "LLM Provider",
  "setup.personal-agent.setup.step.provider.description": "选择或安装个人 Agent 使用的推理 Provider。",
  "setup.personal-agent.setup.step.provider.status.current": "需要处理",
  "setup.personal-agent.setup.step.provider.status.complete": "已完成",
  "setup.personal-agent.setup.step.provider.status.error": "需要关注",
  "setup.personal-agent.setup.step.credentials.title": "Provider 凭据",
  "setup.personal-agent.setup.step.credentials.description": "在 Provider 自己的设置页面中配置凭据。",
  "setup.personal-agent.setup.step.credentials.status.current": "需要处理",
  "setup.personal-agent.setup.step.credentials.status.complete": "已完成",
  "setup.personal-agent.setup.step.credentials.status.pending": "等待中",
  "setup.personal-agent.setup.step.readiness.title": "Provider 就绪状态",
  "setup.personal-agent.setup.step.readiness.description": "Host 会验证是否能够解析到可用的 Provider Runtime。",
  "setup.personal-agent.setup.step.readiness.status.current": "检查中",
  "setup.personal-agent.setup.step.readiness.status.complete": "已就绪",
  "setup.personal-agent.setup.step.readiness.status.error": "不可用",
  "setup.personal-agent.setup.step.readiness.status.pending": "等待中",
  "setup.personal-agent.setup.step.ready.title": "可以使用",
  "setup.personal-agent.setup.step.ready.description": "个人 Agent 已准备好。",
  "setup.personal-agent.setup.step.ready.status.complete": "已完成",
  "setup.personal-agent.setup.step.ready.status.pending": "等待中",
  "setup.personal-agent.setup.action.open-plugins.label": "打开插件",
  "setup.personal-agent.setup.action.configure-provider.label": "配置 Provider",
  "setup.personal-agent.setup.action.choose-provider.label": "选择 Provider",
  "setup.personal-agent.setup.action.open-agent.label": "打开个人 Agent"
};

const ja: LocaleMessages = {
  "workbench.activity.label": "パーソナルエージェント",
  "navigation.enterprise-agent.nav.label": "パーソナルエージェント",
  "page.enterprise-agent.home.title": "パーソナルエージェント",
  "chat.enterprise-agent.home.composer.placeholder": "質問またはタスクを入力",
  "chat.enterprise-agent.home.composer.sendLabel": "送信",
  "chat.enterprise-agent.home.context.label": "コンテキスト",
  "chat.enterprise-agent.home.readiness.ready.label": "準備完了",
  "chat.enterprise-agent.home.readiness.setup-required.label": "セットアップが必要です",
  "chat.enterprise-agent.home.readiness.setup-required.message": "会話を始める前に LLM Provider を選択して設定してください。",
  "chat.enterprise-agent.home.readiness.unavailable.label": "パーソナルエージェントを利用できません",
  "chat.enterprise-agent.home.readiness.unavailable.message": "選択した LLM Provider は現在利用できません。",
  "chat.enterprise-agent.home.action.setup.label": "セットアップ",
  "chat.enterprise-agent.home.empty.title": "何をお手伝いしましょうか？",
  "chat.enterprise-agent.home.empty.description": "現在のコンテキストを確認し、状況を説明し、あなたが判断できるよう意見や計画を整理します。",
  "chat.enterprise-agent.home.suggestion.attention.label": "注意が必要な項目は？",
  "chat.enterprise-agent.home.suggestion.apps.label": "利用可能なアプリを表示",
  "chat.enterprise-agent.home.suggestion.workspace.label": "このワークスペースを説明",
  "setup.personal-agent.setup.title": "パーソナルエージェントのセットアップ",
  "setup.personal-agent.setup.description": "必要な手順を完了して、パーソナルエージェントを利用可能にします。",
  "setup.personal-agent.setup.step.provider.title": "LLM Provider",
  "setup.personal-agent.setup.step.provider.description": "推論に使用する Provider を選択またはインストールします。",
  "setup.personal-agent.setup.step.provider.status.current": "必須",
  "setup.personal-agent.setup.step.provider.status.complete": "完了",
  "setup.personal-agent.setup.step.provider.status.error": "要確認",
  "setup.personal-agent.setup.step.credentials.title": "Provider の認証情報",
  "setup.personal-agent.setup.step.credentials.description": "Provider が所有する設定画面で認証情報を設定します。",
  "setup.personal-agent.setup.step.credentials.status.current": "必須",
  "setup.personal-agent.setup.step.credentials.status.complete": "完了",
  "setup.personal-agent.setup.step.credentials.status.pending": "待機中",
  "setup.personal-agent.setup.step.readiness.title": "Provider の準備状態",
  "setup.personal-agent.setup.step.readiness.description": "Host が利用可能な Provider Runtime を解決できることを確認します。",
  "setup.personal-agent.setup.step.readiness.status.current": "確認中",
  "setup.personal-agent.setup.step.readiness.status.complete": "利用可能",
  "setup.personal-agent.setup.step.readiness.status.error": "利用不可",
  "setup.personal-agent.setup.step.readiness.status.pending": "待機中",
  "setup.personal-agent.setup.step.ready.title": "準備完了",
  "setup.personal-agent.setup.step.ready.description": "パーソナルエージェントを利用できます。",
  "setup.personal-agent.setup.step.ready.status.complete": "完了",
  "setup.personal-agent.setup.step.ready.status.pending": "待機中",
  "setup.personal-agent.setup.action.open-plugins.label": "プラグインを開く",
  "setup.personal-agent.setup.action.configure-provider.label": "Provider を設定",
  "setup.personal-agent.setup.action.choose-provider.label": "Provider を選択",
  "setup.personal-agent.setup.action.open-agent.label": "パーソナルエージェントを開く"
};

const zhTW: LocaleMessages = {
  "workbench.activity.label": "個人 Agent",
  "navigation.enterprise-agent.nav.label": "個人 Agent",
  "page.enterprise-agent.home.title": "個人 Agent",
  "chat.enterprise-agent.home.composer.placeholder": "輸入問題或描述一項工作",
  "chat.enterprise-agent.home.composer.sendLabel": "傳送",
  "chat.enterprise-agent.home.context.label": "上下文",
  "chat.enterprise-agent.home.readiness.ready.label": "已就緒",
  "chat.enterprise-agent.home.readiness.setup-required.label": "個人 Agent 需要完成設定",
  "chat.enterprise-agent.home.readiness.setup-required.message": "開始對話前，請選擇並設定一個 LLM Provider。",
  "chat.enterprise-agent.home.readiness.unavailable.label": "個人 Agent 目前無法使用",
  "chat.enterprise-agent.home.readiness.unavailable.message": "目前選擇的 LLM Provider 暫時無法使用。",
  "chat.enterprise-agent.home.action.setup.label": "設定",
  "chat.enterprise-agent.home.empty.title": "我可以協助什麼？",
  "chat.enterprise-agent.home.empty.description": "我可以查看目前上下文、說明正在發生的事情，並整理意見或計畫交由你審核。",
  "chat.enterprise-agent.home.suggestion.attention.label": "目前有哪些事項需要我注意？",
  "chat.enterprise-agent.home.suggestion.apps.label": "顯示可用應用",
  "chat.enterprise-agent.home.suggestion.workspace.label": "說明目前工作區",
  "setup.personal-agent.setup.title": "個人 Agent 設定",
  "setup.personal-agent.setup.description": "完成必要步驟，讓個人 Agent 可以開始工作。",
  "setup.personal-agent.setup.step.provider.title": "LLM Provider",
  "setup.personal-agent.setup.step.provider.description": "選擇或安裝個人 Agent 使用的推理 Provider。",
  "setup.personal-agent.setup.step.provider.status.current": "需要處理",
  "setup.personal-agent.setup.step.provider.status.complete": "已完成",
  "setup.personal-agent.setup.step.provider.status.error": "需要注意",
  "setup.personal-agent.setup.step.credentials.title": "Provider 憑證",
  "setup.personal-agent.setup.step.credentials.description": "在 Provider 自己的設定頁面中設定憑證。",
  "setup.personal-agent.setup.step.credentials.status.current": "需要處理",
  "setup.personal-agent.setup.step.credentials.status.complete": "已完成",
  "setup.personal-agent.setup.step.credentials.status.pending": "等待中",
  "setup.personal-agent.setup.step.readiness.title": "Provider 就緒狀態",
  "setup.personal-agent.setup.step.readiness.description": "Host 會確認是否能解析到可用的 Provider Runtime。",
  "setup.personal-agent.setup.step.readiness.status.current": "檢查中",
  "setup.personal-agent.setup.step.readiness.status.complete": "已就緒",
  "setup.personal-agent.setup.step.readiness.status.error": "無法使用",
  "setup.personal-agent.setup.step.readiness.status.pending": "等待中",
  "setup.personal-agent.setup.step.ready.title": "可以使用",
  "setup.personal-agent.setup.step.ready.description": "個人 Agent 已準備完成。",
  "setup.personal-agent.setup.step.ready.status.complete": "已完成",
  "setup.personal-agent.setup.step.ready.status.pending": "等待中",
  "setup.personal-agent.setup.action.open-plugins.label": "開啟插件",
  "setup.personal-agent.setup.action.configure-provider.label": "設定 Provider",
  "setup.personal-agent.setup.action.choose-provider.label": "選擇 Provider",
  "setup.personal-agent.setup.action.open-agent.label": "開啟個人 Agent"
};

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
            defaultRoute: PERSONAL_AGENT_HOME_ROUTE,
            pages: [
              { id: "enterprise-agent.home", title: "Personal Agent", source: ENTERPRISE_AGENT_PAGE_SOURCE },
              { id: "personal-agent.setup", title: "Personal Agent setup", source: PERSONAL_AGENT_SETUP_PAGE_SOURCE }
            ],
            routes: [
              { id: "enterprise-agent.home", path: PERSONAL_AGENT_HOME_ROUTE, pageId: "enterprise-agent.home" },
              { id: "personal-agent.setup", path: PERSONAL_AGENT_SETUP_ROUTE, pageId: "personal-agent.setup" }
            ],
            navigation: [
              {
                id: "enterprise-agent.nav",
                label: "Personal Agent",
                route: PERSONAL_AGENT_HOME_ROUTE,
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
            route: PERSONAL_AGENT_HOME_ROUTE,
            order: 20,
            localization: {
              namespace: ENTERPRISE_AGENT_PACKAGE_ID,
              key: "workbench.activity.label"
            }
          }
        },
        localizationBundle("en", en),
        localizationBundle("zh-CN", zhCN),
        localizationBundle("ja", ja),
        localizationBundle("zh-TW", zhTW)
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
    composer: {
      key: "message",
      placeholder: "Ask a question or describe a task",
      sendLabel: "Send"
    },
    context: {
      label: "Context",
      value: "Personal"
    },
    readiness: {
      state: "ready",
      label: "Ready"
    },
    emptyState: {
      title: "How can I help?",
      description: "I can inspect the current Context, explain what is happening, and prepare an opinion or plan for you to review.",
      suggestions: [
        { id: "attention", label: "What needs my attention?", prompt: "What needs my attention right now?" },
        { id: "apps", label: "Show available apps", prompt: "Show me the apps I can use." },
        { id: "workspace", label: "Explain this workspace", prompt: "Explain the current workspace and what I can do here." }
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
  }],
  [PERSONAL_AGENT_SETUP_PAGE_SOURCE, {
    contractVersion: "0.1.0",
    kind: "setup-flow",
    id: "personal-agent.setup",
    title: "Personal Agent setup",
    description: "Complete the required steps to make Personal Agent ready.",
    steps: [
      { id: "provider", title: "LLM Provider", state: "current", statusDetail: "Required" },
      { id: "credentials", title: "Provider credentials", state: "pending", statusDetail: "Waiting" },
      { id: "readiness", title: "Provider readiness", state: "pending", statusDetail: "Waiting" },
      { id: "ready", title: "Ready", state: "pending", statusDetail: "Waiting" }
    ]
  }]
]);
