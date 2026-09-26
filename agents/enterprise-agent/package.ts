import type { PackageManifestV010 } from "../../contracts/package.js";

export const ENTERPRISE_AGENT_PACKAGE_ID = "enterprise-agent";
export const ENTERPRISE_AGENT_FEATURE_ID = "enterprise-agent.default";
export const ENTERPRISE_AGENT_PAGE_SOURCE = "app://enterprise-agent/pages/home";
export const ENTERPRISE_AGENT_SETUP_PAGE_SOURCE = "app://enterprise-agent/pages/setup";

const en = {
  "workbench.activity.label": "Personal Agent",
  "navigation.enterprise-agent.nav.label": "Personal Agent",
  "page.enterprise-agent.home.title": "Personal Agent",
  "chat.enterprise-agent.home.context.label": "Context",
  "chat.enterprise-agent.home.composer.placeholder": "Ask or describe a task",
  "chat.enterprise-agent.home.composer.sendLabel": "Send",
  "chat.enterprise-agent.home.readiness.setup-required.label": "Needs setup",
  "chat.enterprise-agent.home.readiness.setup-required.message": "Connect an LLM Provider before using Personal Agent.",
  "chat.enterprise-agent.home.readiness.unavailable.label": "Provider unavailable",
  "chat.enterprise-agent.home.readiness.unavailable.message": "The selected LLM Provider is currently unavailable.",
  "chat.enterprise-agent.home.action.setup.label": "Set up",
  "chat.enterprise-agent.home.empty.title": "How can I help?",
  "chat.enterprise-agent.home.empty.description": "I can inspect your current Context, explain what is happening, and prepare an opinion or plan.",
  "chat.enterprise-agent.home.suggestion.attention.label": "What needs my attention?",
  "chat.enterprise-agent.home.suggestion.apps.label": "Show available apps",
  "chat.enterprise-agent.home.suggestion.workspace.label": "Explain this workspace",
  "setup.personal-agent.setup.title": "Personal Agent setup",
  "setup.personal-agent.setup.description": "Connect Personal Agent to an LLM Provider without putting vendor credentials inside the Agent.",
  "setup.personal-agent.setup.step.provider.title": "LLM Provider",
  "setup.personal-agent.setup.step.provider.description": "Choose or install an LLM Provider.",
  "setup.personal-agent.setup.step.provider.status.current": "Required",
  "setup.personal-agent.setup.step.provider.status.complete": "Complete",
  "setup.personal-agent.setup.step.provider.status.pending": "Waiting",
  "setup.personal-agent.setup.step.provider.status.error": "Unavailable",
  "setup.personal-agent.setup.step.credentials.title": "Provider credentials",
  "setup.personal-agent.setup.step.credentials.description": "Configure credentials in the Provider-owned Settings surface.",
  "setup.personal-agent.setup.step.credentials.status.current": "Required",
  "setup.personal-agent.setup.step.credentials.status.complete": "Complete",
  "setup.personal-agent.setup.step.credentials.status.pending": "Waiting",
  "setup.personal-agent.setup.step.credentials.status.error": "Unavailable",
  "setup.personal-agent.setup.step.readiness.title": "Provider readiness",
  "setup.personal-agent.setup.step.readiness.description": "Check that llm.inference can be resolved.",
  "setup.personal-agent.setup.step.readiness.status.pending": "Waiting",
  "setup.personal-agent.setup.step.readiness.status.current": "Checking",
  "setup.personal-agent.setup.step.readiness.status.complete": "Complete",
  "setup.personal-agent.setup.step.readiness.status.error": "Unavailable",
  "setup.personal-agent.setup.step.ready.title": "Personal Agent",
  "setup.personal-agent.setup.step.ready.description": "Personal Agent is ready when Provider setup is complete.",
  "setup.personal-agent.setup.step.ready.status.pending": "Waiting",
  "setup.personal-agent.setup.step.ready.status.complete": "Ready",
  "setup.personal-agent.setup.action.browse-providers.label": "Browse Providers",
  "setup.personal-agent.setup.action.choose-provider.label": "Choose Provider",
  "setup.personal-agent.setup.action.manage-provider.label": "Manage Provider",
  "setup.personal-agent.setup.action.configure-provider.label": "Configure Provider",
  "setup.personal-agent.setup.action.open-agent.label": "Open Personal Agent"
};

const zhCN = {
  "workbench.activity.label": "个人 Agent",
  "navigation.enterprise-agent.nav.label": "个人 Agent",
  "page.enterprise-agent.home.title": "个人 Agent",
  "chat.enterprise-agent.home.context.label": "上下文",
  "chat.enterprise-agent.home.composer.placeholder": "输入问题或要处理的任务",
  "chat.enterprise-agent.home.composer.sendLabel": "发送",
  "chat.enterprise-agent.home.readiness.setup-required.label": "需要设置",
  "chat.enterprise-agent.home.readiness.setup-required.message": "使用个人 Agent 前，请先连接一个 LLM Provider。",
  "chat.enterprise-agent.home.readiness.unavailable.label": "Provider 不可用",
  "chat.enterprise-agent.home.readiness.unavailable.message": "当前选择的 LLM Provider 暂时不可用。",
  "chat.enterprise-agent.home.action.setup.label": "开始设置",
  "chat.enterprise-agent.home.empty.title": "我可以帮你做什么？",
  "chat.enterprise-agent.home.empty.description": "我可以查看当前上下文，解释发生了什么，并整理意见或方案。",
  "chat.enterprise-agent.home.suggestion.attention.label": "现在有什么需要我关注？",
  "chat.enterprise-agent.home.suggestion.apps.label": "显示可用应用",
  "chat.enterprise-agent.home.suggestion.workspace.label": "解释当前工作区",
  "setup.personal-agent.setup.title": "个人 Agent 设置",
  "setup.personal-agent.setup.description": "为个人 Agent 连接 LLM Provider，供应商凭据仍由 Provider 与 Secrets 管理。",
  "setup.personal-agent.setup.step.provider.title": "LLM Provider",
  "setup.personal-agent.setup.step.provider.description": "选择或安装一个 LLM Provider。",
  "setup.personal-agent.setup.step.provider.status.current": "必需",
  "setup.personal-agent.setup.step.provider.status.complete": "已完成",
  "setup.personal-agent.setup.step.provider.status.pending": "等待中",
  "setup.personal-agent.setup.step.provider.status.error": "不可用",
  "setup.personal-agent.setup.step.credentials.title": "Provider 凭据",
  "setup.personal-agent.setup.step.credentials.description": "在 Provider 自己的设置页面配置凭据。",
  "setup.personal-agent.setup.step.credentials.status.current": "必需",
  "setup.personal-agent.setup.step.credentials.status.complete": "已完成",
  "setup.personal-agent.setup.step.credentials.status.pending": "等待中",
  "setup.personal-agent.setup.step.credentials.status.error": "不可用",
  "setup.personal-agent.setup.step.readiness.title": "Provider 就绪状态",
  "setup.personal-agent.setup.step.readiness.description": "确认 llm.inference 可以正常解析。",
  "setup.personal-agent.setup.step.readiness.status.pending": "等待中",
  "setup.personal-agent.setup.step.readiness.status.current": "检查中",
  "setup.personal-agent.setup.step.readiness.status.complete": "已完成",
  "setup.personal-agent.setup.step.readiness.status.error": "不可用",
  "setup.personal-agent.setup.step.ready.title": "个人 Agent",
  "setup.personal-agent.setup.step.ready.description": "Provider 设置完成后，个人 Agent 即可使用。",
  "setup.personal-agent.setup.step.ready.status.pending": "等待中",
  "setup.personal-agent.setup.step.ready.status.complete": "已就绪",
  "setup.personal-agent.setup.action.browse-providers.label": "浏览 Provider",
  "setup.personal-agent.setup.action.choose-provider.label": "选择 Provider",
  "setup.personal-agent.setup.action.manage-provider.label": "管理 Provider",
  "setup.personal-agent.setup.action.configure-provider.label": "配置 Provider",
  "setup.personal-agent.setup.action.open-agent.label": "打开个人 Agent"
};

const ja = {
  "workbench.activity.label": "パーソナルエージェント",
  "navigation.enterprise-agent.nav.label": "パーソナルエージェント",
  "page.enterprise-agent.home.title": "パーソナルエージェント",
  "chat.enterprise-agent.home.context.label": "コンテキスト",
  "chat.enterprise-agent.home.composer.placeholder": "相談内容やタスクを入力",
  "chat.enterprise-agent.home.composer.sendLabel": "送信",
  "chat.enterprise-agent.home.readiness.setup-required.label": "セットアップが必要",
  "chat.enterprise-agent.home.readiness.setup-required.message": "パーソナルエージェントを使用する前に LLM Provider を接続してください。",
  "chat.enterprise-agent.home.readiness.unavailable.label": "Provider を利用できません",
  "chat.enterprise-agent.home.readiness.unavailable.message": "選択された LLM Provider は現在利用できません。",
  "chat.enterprise-agent.home.action.setup.label": "セットアップ",
  "chat.enterprise-agent.home.empty.title": "何をお手伝いしましょうか？",
  "chat.enterprise-agent.home.empty.description": "現在のコンテキストを確認し、状況を説明して、意見や計画を整理できます。",
  "chat.enterprise-agent.home.suggestion.attention.label": "注意が必要なことは？",
  "chat.enterprise-agent.home.suggestion.apps.label": "利用可能なアプリを表示",
  "chat.enterprise-agent.home.suggestion.workspace.label": "このワークスペースを説明",
  "setup.personal-agent.setup.title": "パーソナルエージェントのセットアップ",
  "setup.personal-agent.setup.description": "ベンダー資格情報をエージェント内に保存せず、LLM Provider を接続します。",
  "setup.personal-agent.setup.step.provider.title": "LLM Provider",
  "setup.personal-agent.setup.step.provider.description": "LLM Provider を選択またはインストールします。",
  "setup.personal-agent.setup.step.provider.status.current": "必須",
  "setup.personal-agent.setup.step.provider.status.complete": "完了",
  "setup.personal-agent.setup.step.provider.status.pending": "待機中",
  "setup.personal-agent.setup.step.provider.status.error": "利用不可",
  "setup.personal-agent.setup.step.credentials.title": "Provider の資格情報",
  "setup.personal-agent.setup.step.credentials.description": "Provider が所有する設定画面で資格情報を設定します。",
  "setup.personal-agent.setup.step.credentials.status.current": "必須",
  "setup.personal-agent.setup.step.credentials.status.complete": "完了",
  "setup.personal-agent.setup.step.credentials.status.pending": "待機中",
  "setup.personal-agent.setup.step.credentials.status.error": "利用不可",
  "setup.personal-agent.setup.step.readiness.title": "Provider の準備状態",
  "setup.personal-agent.setup.step.readiness.description": "llm.inference を解決できることを確認します。",
  "setup.personal-agent.setup.step.readiness.status.pending": "待機中",
  "setup.personal-agent.setup.step.readiness.status.current": "確認中",
  "setup.personal-agent.setup.step.readiness.status.complete": "完了",
  "setup.personal-agent.setup.step.readiness.status.error": "利用不可",
  "setup.personal-agent.setup.step.ready.title": "パーソナルエージェント",
  "setup.personal-agent.setup.step.ready.description": "Provider の設定が完了すると利用できます。",
  "setup.personal-agent.setup.step.ready.status.pending": "待機中",
  "setup.personal-agent.setup.step.ready.status.complete": "準備完了",
  "setup.personal-agent.setup.action.browse-providers.label": "Provider を探す",
  "setup.personal-agent.setup.action.choose-provider.label": "Provider を選択",
  "setup.personal-agent.setup.action.manage-provider.label": "Provider を管理",
  "setup.personal-agent.setup.action.configure-provider.label": "Provider を設定",
  "setup.personal-agent.setup.action.open-agent.label": "パーソナルエージェントを開く"
};

const zhTW = {
  "workbench.activity.label": "個人 Agent",
  "navigation.enterprise-agent.nav.label": "個人 Agent",
  "page.enterprise-agent.home.title": "個人 Agent",
  "chat.enterprise-agent.home.context.label": "上下文",
  "chat.enterprise-agent.home.composer.placeholder": "輸入問題或工作內容",
  "chat.enterprise-agent.home.composer.sendLabel": "傳送",
  "chat.enterprise-agent.home.readiness.setup-required.label": "需要設定",
  "chat.enterprise-agent.home.readiness.setup-required.message": "使用個人 Agent 前，請先連接一個 LLM Provider。",
  "chat.enterprise-agent.home.readiness.unavailable.label": "Provider 無法使用",
  "chat.enterprise-agent.home.readiness.unavailable.message": "目前選擇的 LLM Provider 暫時無法使用。",
  "chat.enterprise-agent.home.action.setup.label": "開始設定",
  "chat.enterprise-agent.home.empty.title": "我可以幫你做什麼？",
  "chat.enterprise-agent.home.empty.description": "我可以查看目前上下文、解釋正在發生的事情，並整理意見或方案。",
  "chat.enterprise-agent.home.suggestion.attention.label": "現在有什麼需要我注意？",
  "chat.enterprise-agent.home.suggestion.apps.label": "顯示可用應用",
  "chat.enterprise-agent.home.suggestion.workspace.label": "說明目前工作區",
  "setup.personal-agent.setup.title": "個人 Agent 設定",
  "setup.personal-agent.setup.description": "為個人 Agent 連接 LLM Provider，供應商憑據仍由 Provider 與 Secrets 管理。",
  "setup.personal-agent.setup.step.provider.title": "LLM Provider",
  "setup.personal-agent.setup.step.provider.description": "選擇或安裝一個 LLM Provider。",
  "setup.personal-agent.setup.step.provider.status.current": "必須",
  "setup.personal-agent.setup.step.provider.status.complete": "已完成",
  "setup.personal-agent.setup.step.provider.status.pending": "等待中",
  "setup.personal-agent.setup.step.provider.status.error": "無法使用",
  "setup.personal-agent.setup.step.credentials.title": "Provider 憑據",
  "setup.personal-agent.setup.step.credentials.description": "在 Provider 自己的設定頁面配置憑據。",
  "setup.personal-agent.setup.step.credentials.status.current": "必須",
  "setup.personal-agent.setup.step.credentials.status.complete": "已完成",
  "setup.personal-agent.setup.step.credentials.status.pending": "等待中",
  "setup.personal-agent.setup.step.credentials.status.error": "無法使用",
  "setup.personal-agent.setup.step.readiness.title": "Provider 就緒狀態",
  "setup.personal-agent.setup.step.readiness.description": "確認 llm.inference 可以正常解析。",
  "setup.personal-agent.setup.step.readiness.status.pending": "等待中",
  "setup.personal-agent.setup.step.readiness.status.current": "檢查中",
  "setup.personal-agent.setup.step.readiness.status.complete": "已完成",
  "setup.personal-agent.setup.step.readiness.status.error": "無法使用",
  "setup.personal-agent.setup.step.ready.title": "個人 Agent",
  "setup.personal-agent.setup.step.ready.description": "Provider 設定完成後，個人 Agent 即可使用。",
  "setup.personal-agent.setup.step.ready.status.pending": "等待中",
  "setup.personal-agent.setup.step.ready.status.complete": "已就緒",
  "setup.personal-agent.setup.action.browse-providers.label": "瀏覽 Provider",
  "setup.personal-agent.setup.action.choose-provider.label": "選擇 Provider",
  "setup.personal-agent.setup.action.manage-provider.label": "管理 Provider",
  "setup.personal-agent.setup.action.configure-provider.label": "配置 Provider",
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
        ...[
          ["en", en],
          ["zh-CN", zhCN],
          ["ja", ja],
          ["zh-TW", zhTW]
        ].map(([locale, messages]) => ({
          kind: "eidos.localization-bundle" as const,
          bundle: {
            contractVersion: "0.1.0" as const,
            namespace: ENTERPRISE_AGENT_PACKAGE_ID,
            locale: locale as string,
            messages: messages as Record<string, string>
          }
        }))
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
      value: "Personal"
    },
    readiness: {
      state: "setup-required",
      label: "Needs setup",
      message: "Connect an LLM Provider before using Personal Agent.",
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
      description: "I can inspect your current Context, explain what is happening, and prepare an opinion or plan.",
      suggestions: [
        { id: "attention", label: "What needs my attention?", prompt: "What needs my attention?" },
        { id: "apps", label: "Show available apps", prompt: "Show me the apps and capabilities available in my current Context." },
        { id: "workspace", label: "Explain this workspace", prompt: "Explain this workspace and what I can do here." }
      ]
    },
    metadata: {
      packageId: ENTERPRISE_AGENT_PACKAGE_ID,
      featureId: ENTERPRISE_AGENT_FEATURE_ID,
      targetIdentity: "Personal Agent",
      llm: {
        requiredCapability: "llm.inference",
        integrationStatus: "PROVIDER_RESOLVED_AT_RUNTIME"
      }
    }
  }],
  [ENTERPRISE_AGENT_SETUP_PAGE_SOURCE, {
    contractVersion: "0.1.0",
    kind: "setup-flow",
    id: "personal-agent.setup",
    title: "Personal Agent setup",
    description: "Connect Personal Agent to an LLM Provider.",
    steps: [
      {
        id: "provider",
        title: "LLM Provider",
        description: "Choose or install an LLM Provider.",
        state: "current",
        statusDetail: "Required",
        primaryAction: {
          id: "browse-providers",
          label: "Browse Providers",
          type: "navigate",
          route: "/store",
          primary: true
        }
      },
      {
        id: "credentials",
        title: "Provider credentials",
        state: "pending"
      },
      {
        id: "readiness",
        title: "Provider readiness",
        state: "pending"
      },
      {
        id: "ready",
        title: "Personal Agent",
        state: "pending"
      }
    ]
  }]
]);
