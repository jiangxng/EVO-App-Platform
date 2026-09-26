import type { PackageManifestV010 } from "../../contracts/package.js";

export const ENTERPRISE_AGENT_PACKAGE_ID = "enterprise-agent";
export const ENTERPRISE_AGENT_FEATURE_ID = "enterprise-agent.default";
export const ENTERPRISE_AGENT_PAGE_SOURCE = "app://enterprise-agent/pages/home";
export const ENTERPRISE_AGENT_SETUP_PAGE_SOURCE = "app://enterprise-agent/pages/setup";

const enMessages = {
  "workbench.activity.label": "Personal Agent",
  "navigation.enterprise-agent.nav.label": "Personal Agent",
  "page.enterprise-agent.home.title": "Personal Agent",
  "page.enterprise-agent.setup.title": "Personal Agent setup",
  "chat.enterprise-agent.home.composer.placeholder": "Ask or describe a task",
  "chat.enterprise-agent.home.composer.sendLabel": "Send",
  "chat.enterprise-agent.home.context.label": "Current context",
  "chat.enterprise-agent.home.readiness.ready.label": "Ready",
  "chat.enterprise-agent.home.readiness.ready.message": "Personal Agent is ready.",
  "chat.enterprise-agent.home.readiness.setup-required.label": "Needs setup",
  "chat.enterprise-agent.home.readiness.setup-required.message": "Complete Provider setup before using Personal Agent.",
  "chat.enterprise-agent.home.readiness.degraded.label": "Degraded",
  "chat.enterprise-agent.home.readiness.degraded.message": "The selected LLM Provider is degraded.",
  "chat.enterprise-agent.home.readiness.unavailable.label": "Unavailable",
  "chat.enterprise-agent.home.readiness.unavailable.message": "The selected LLM Provider is unavailable.",
  "chat.enterprise-agent.home.action.open-setup.label": "Open setup",
  "chat.enterprise-agent.home.empty.title": "How can I help?",
  "chat.enterprise-agent.home.empty.description": "I can inspect your available apps and Context, explain what is happening, and prepare an opinion or plan.",
  "chat.enterprise-agent.home.suggestion.attention.label": "What needs my attention?",
  "chat.enterprise-agent.home.suggestion.context.label": "Explain my current context",
  "setup.personal-agent.setup.title": "Personal Agent setup",
  "setup.personal-agent.setup.description": "Complete the required platform-owned Provider steps. Personal Agent does not store Provider credentials.",
  "setup.personal-agent.setup.step.provider.title": "LLM Provider",
  "setup.personal-agent.setup.step.provider.description": "Select or install a Provider for llm.inference.",
  "setup.personal-agent.setup.step.provider.status.current": "Required",
  "setup.personal-agent.setup.step.provider.status.complete": "Complete",
  "setup.personal-agent.setup.step.provider.status.pending": "Waiting",
  "setup.personal-agent.setup.step.credentials.title": "Provider configuration",
  "setup.personal-agent.setup.step.credentials.description": "Configure credentials and Provider-owned runtime settings in the Provider Settings surface.",
  "setup.personal-agent.setup.step.credentials.status.current": "Required",
  "setup.personal-agent.setup.step.credentials.status.complete": "Complete",
  "setup.personal-agent.setup.step.credentials.status.pending": "Waiting",
  "setup.personal-agent.setup.step.credentials.status.blocked": "Waiting",
  "setup.personal-agent.setup.step.readiness.title": "Provider readiness",
  "setup.personal-agent.setup.step.readiness.description": "The Host verifies that Provider resolution and runtime readiness are usable.",
  "setup.personal-agent.setup.step.readiness.status.current": "Checking",
  "setup.personal-agent.setup.step.readiness.status.complete": "Complete",
  "setup.personal-agent.setup.step.readiness.status.blocked": "Waiting",
  "setup.personal-agent.setup.step.readiness.status.error": "Attention required",
  "setup.personal-agent.setup.step.ready.title": "Ready",
  "setup.personal-agent.setup.step.ready.description": "Personal Agent can now use the selected LLM Provider.",
  "setup.personal-agent.setup.step.ready.status.complete": "Complete",
  "setup.personal-agent.setup.step.ready.status.blocked": "Waiting",
  "setup.personal-agent.setup.action.choose-provider.label": "Choose Provider",
  "setup.personal-agent.setup.action.open-provider-catalog.label": "Open Provider catalog",
  "setup.personal-agent.setup.action.configure-provider.label": "Configure Provider",
  "setup.personal-agent.setup.action.open-agent.label": "Open Personal Agent"
};

const zhCnMessages = {
  "workbench.activity.label": "个人代理",
  "navigation.enterprise-agent.nav.label": "个人代理",
  "page.enterprise-agent.home.title": "个人代理",
  "page.enterprise-agent.setup.title": "个人代理设置",
  "chat.enterprise-agent.home.composer.placeholder": "询问问题或描述任务",
  "chat.enterprise-agent.home.composer.sendLabel": "发送",
  "chat.enterprise-agent.home.context.label": "当前上下文",
  "chat.enterprise-agent.home.readiness.ready.label": "就绪",
  "chat.enterprise-agent.home.readiness.ready.message": "个人代理已就绪。",
  "chat.enterprise-agent.home.readiness.setup-required.label": "需要设置",
  "chat.enterprise-agent.home.readiness.setup-required.message": "使用个人代理前，请先完成 Provider 设置。",
  "chat.enterprise-agent.home.readiness.degraded.label": "性能下降",
  "chat.enterprise-agent.home.readiness.degraded.message": "当前 LLM Provider 处于降级状态。",
  "chat.enterprise-agent.home.readiness.unavailable.label": "不可用",
  "chat.enterprise-agent.home.readiness.unavailable.message": "当前 LLM Provider 不可用。",
  "chat.enterprise-agent.home.action.open-setup.label": "打开设置",
  "chat.enterprise-agent.home.empty.title": "我可以帮你做什么？",
  "chat.enterprise-agent.home.empty.description": "我可以查看可用应用和上下文，解释当前情况，并准备意见或方案。",
  "chat.enterprise-agent.home.suggestion.attention.label": "现在有哪些事情需要我关注？",
  "chat.enterprise-agent.home.suggestion.context.label": "解释我当前的上下文",
  "setup.personal-agent.setup.title": "个人代理设置",
  "setup.personal-agent.setup.description": "完成平台管理的 Provider 必要步骤。个人代理本身不保存 Provider 凭据。",
  "setup.personal-agent.setup.step.provider.title": "LLM Provider",
  "setup.personal-agent.setup.step.provider.description": "为 llm.inference 选择或安装 Provider。",
  "setup.personal-agent.setup.step.provider.status.current": "必需",
  "setup.personal-agent.setup.step.provider.status.complete": "完成",
  "setup.personal-agent.setup.step.provider.status.pending": "等待",
  "setup.personal-agent.setup.step.credentials.title": "Provider 配置",
  "setup.personal-agent.setup.step.credentials.description": "在 Provider 自己的设置界面配置凭据和运行参数。",
  "setup.personal-agent.setup.step.credentials.status.current": "必需",
  "setup.personal-agent.setup.step.credentials.status.complete": "完成",
  "setup.personal-agent.setup.step.credentials.status.pending": "等待",
  "setup.personal-agent.setup.step.credentials.status.blocked": "等待",
  "setup.personal-agent.setup.step.readiness.title": "Provider 就绪状态",
  "setup.personal-agent.setup.step.readiness.description": "Host 会验证 Provider 解析结果和运行时是否可用。",
  "setup.personal-agent.setup.step.readiness.status.current": "检查中",
  "setup.personal-agent.setup.step.readiness.status.complete": "完成",
  "setup.personal-agent.setup.step.readiness.status.blocked": "等待",
  "setup.personal-agent.setup.step.readiness.status.error": "需要处理",
  "setup.personal-agent.setup.step.ready.title": "就绪",
  "setup.personal-agent.setup.step.ready.description": "个人代理现在可以使用已选择的 LLM Provider。",
  "setup.personal-agent.setup.step.ready.status.complete": "完成",
  "setup.personal-agent.setup.step.ready.status.blocked": "等待",
  "setup.personal-agent.setup.action.choose-provider.label": "选择 Provider",
  "setup.personal-agent.setup.action.open-provider-catalog.label": "打开 Provider 目录",
  "setup.personal-agent.setup.action.configure-provider.label": "配置 Provider",
  "setup.personal-agent.setup.action.open-agent.label": "打开个人代理"
};

const jaMessages = {
  "workbench.activity.label": "パーソナルエージェント",
  "navigation.enterprise-agent.nav.label": "パーソナルエージェント",
  "page.enterprise-agent.home.title": "パーソナルエージェント",
  "page.enterprise-agent.setup.title": "パーソナルエージェントのセットアップ",
  "chat.enterprise-agent.home.composer.placeholder": "質問またはタスクを入力してください",
  "chat.enterprise-agent.home.composer.sendLabel": "送信",
  "chat.enterprise-agent.home.context.label": "現在のコンテキスト",
  "chat.enterprise-agent.home.readiness.ready.label": "準備完了",
  "chat.enterprise-agent.home.readiness.ready.message": "パーソナルエージェントを利用できます。",
  "chat.enterprise-agent.home.readiness.setup-required.label": "セットアップが必要",
  "chat.enterprise-agent.home.readiness.setup-required.message": "パーソナルエージェントを使う前に Provider の設定を完了してください。",
  "chat.enterprise-agent.home.readiness.degraded.label": "低下",
  "chat.enterprise-agent.home.readiness.degraded.message": "選択した LLM Provider は低下状態です。",
  "chat.enterprise-agent.home.readiness.unavailable.label": "利用不可",
  "chat.enterprise-agent.home.readiness.unavailable.message": "選択した LLM Provider は利用できません。",
  "chat.enterprise-agent.home.action.open-setup.label": "セットアップを開く",
  "chat.enterprise-agent.home.empty.title": "何をお手伝いしましょうか？",
  "chat.enterprise-agent.home.empty.description": "利用可能なアプリとコンテキストを確認し、状況を説明して、意見や計画を準備できます。",
  "chat.enterprise-agent.home.suggestion.attention.label": "今、注意すべきことは？",
  "chat.enterprise-agent.home.suggestion.context.label": "現在のコンテキストを説明して",
  "setup.personal-agent.setup.title": "パーソナルエージェントのセットアップ",
  "setup.personal-agent.setup.description": "プラットフォームが管理する Provider の必要な手順を完了してください。パーソナルエージェントは Provider の認証情報を保存しません。",
  "setup.personal-agent.setup.step.provider.title": "LLM Provider",
  "setup.personal-agent.setup.step.provider.description": "llm.inference 用の Provider を選択またはインストールします。",
  "setup.personal-agent.setup.step.provider.status.current": "必須",
  "setup.personal-agent.setup.step.provider.status.complete": "完了",
  "setup.personal-agent.setup.step.provider.status.pending": "待機中",
  "setup.personal-agent.setup.step.credentials.title": "Provider 設定",
  "setup.personal-agent.setup.step.credentials.description": "Provider の設定画面で認証情報とランタイム設定を構成します。",
  "setup.personal-agent.setup.step.credentials.status.current": "必須",
  "setup.personal-agent.setup.step.credentials.status.complete": "完了",
  "setup.personal-agent.setup.step.credentials.status.pending": "待機中",
  "setup.personal-agent.setup.step.credentials.status.blocked": "待機中",
  "setup.personal-agent.setup.step.readiness.title": "Provider の準備状態",
  "setup.personal-agent.setup.step.readiness.description": "Host が Provider の解決結果とランタイムの利用可否を確認します。",
  "setup.personal-agent.setup.step.readiness.status.current": "確認中",
  "setup.personal-agent.setup.step.readiness.status.complete": "完了",
  "setup.personal-agent.setup.step.readiness.status.blocked": "待機中",
  "setup.personal-agent.setup.step.readiness.status.error": "対応が必要",
  "setup.personal-agent.setup.step.ready.title": "準備完了",
  "setup.personal-agent.setup.step.ready.description": "パーソナルエージェントは選択した LLM Provider を利用できます。",
  "setup.personal-agent.setup.step.ready.status.complete": "完了",
  "setup.personal-agent.setup.step.ready.status.blocked": "待機中",
  "setup.personal-agent.setup.action.choose-provider.label": "Provider を選択",
  "setup.personal-agent.setup.action.open-provider-catalog.label": "Provider カタログを開く",
  "setup.personal-agent.setup.action.configure-provider.label": "Provider を設定",
  "setup.personal-agent.setup.action.open-agent.label": "パーソナルエージェントを開く"
};

const zhTwMessages = {
  "workbench.activity.label": "個人代理",
  "navigation.enterprise-agent.nav.label": "個人代理",
  "page.enterprise-agent.home.title": "個人代理",
  "page.enterprise-agent.setup.title": "個人代理設定",
  "chat.enterprise-agent.home.composer.placeholder": "詢問問題或描述任務",
  "chat.enterprise-agent.home.composer.sendLabel": "傳送",
  "chat.enterprise-agent.home.context.label": "目前內容環境",
  "chat.enterprise-agent.home.readiness.ready.label": "就緒",
  "chat.enterprise-agent.home.readiness.ready.message": "個人代理已就緒。",
  "chat.enterprise-agent.home.readiness.setup-required.label": "需要設定",
  "chat.enterprise-agent.home.readiness.setup-required.message": "使用個人代理前，請先完成 Provider 設定。",
  "chat.enterprise-agent.home.readiness.degraded.label": "效能下降",
  "chat.enterprise-agent.home.readiness.degraded.message": "目前 LLM Provider 處於降級狀態。",
  "chat.enterprise-agent.home.readiness.unavailable.label": "無法使用",
  "chat.enterprise-agent.home.readiness.unavailable.message": "目前 LLM Provider 無法使用。",
  "chat.enterprise-agent.home.action.open-setup.label": "開啟設定",
  "chat.enterprise-agent.home.empty.title": "我可以幫你做什麼？",
  "chat.enterprise-agent.home.empty.description": "我可以查看可用應用與內容環境、說明目前情況，並準備意見或方案。",
  "chat.enterprise-agent.home.suggestion.attention.label": "現在有哪些事情需要我關注？",
  "chat.enterprise-agent.home.suggestion.context.label": "說明我目前的內容環境",
  "setup.personal-agent.setup.title": "個人代理設定",
  "setup.personal-agent.setup.description": "完成由平台管理的 Provider 必要步驟。個人代理本身不保存 Provider 憑證。",
  "setup.personal-agent.setup.step.provider.title": "LLM Provider",
  "setup.personal-agent.setup.step.provider.description": "為 llm.inference 選擇或安裝 Provider。",
  "setup.personal-agent.setup.step.provider.status.current": "必要",
  "setup.personal-agent.setup.step.provider.status.complete": "完成",
  "setup.personal-agent.setup.step.provider.status.pending": "等待",
  "setup.personal-agent.setup.step.credentials.title": "Provider 設定",
  "setup.personal-agent.setup.step.credentials.description": "在 Provider 自己的設定介面配置憑證與執行參數。",
  "setup.personal-agent.setup.step.credentials.status.current": "必要",
  "setup.personal-agent.setup.step.credentials.status.complete": "完成",
  "setup.personal-agent.setup.step.credentials.status.pending": "等待",
  "setup.personal-agent.setup.step.credentials.status.blocked": "等待",
  "setup.personal-agent.setup.step.readiness.title": "Provider 就緒狀態",
  "setup.personal-agent.setup.step.readiness.description": "Host 會驗證 Provider 解析結果與執行階段是否可用。",
  "setup.personal-agent.setup.step.readiness.status.current": "檢查中",
  "setup.personal-agent.setup.step.readiness.status.complete": "完成",
  "setup.personal-agent.setup.step.readiness.status.blocked": "等待",
  "setup.personal-agent.setup.step.readiness.status.error": "需要處理",
  "setup.personal-agent.setup.step.ready.title": "就緒",
  "setup.personal-agent.setup.step.ready.description": "個人代理現在可以使用已選擇的 LLM Provider。",
  "setup.personal-agent.setup.step.ready.status.complete": "完成",
  "setup.personal-agent.setup.step.ready.status.blocked": "等待",
  "setup.personal-agent.setup.action.choose-provider.label": "選擇 Provider",
  "setup.personal-agent.setup.action.open-provider-catalog.label": "開啟 Provider 目錄",
  "setup.personal-agent.setup.action.configure-provider.label": "設定 Provider",
  "setup.personal-agent.setup.action.open-agent.label": "開啟個人代理"
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
                id: "enterprise-agent.setup",
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
                id: "enterprise-agent.setup",
                path: "/enterprise-agent/setup",
                pageId: "enterprise-agent.setup"
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
        ...([
          ["en", enMessages],
          ["zh-CN", zhCnMessages],
          ["ja", jaMessages],
          ["zh-TW", zhTwMessages]
        ] as const).map(([locale, messages]) => ({
          kind: "eidos.localization-bundle" as const,
          bundle: {
            contractVersion: "0.1.0" as const,
            namespace: ENTERPRISE_AGENT_PACKAGE_ID,
            locale,
            messages
          }
        }))
      ]
    }
  ]
};

export const enterpriseAgentExperienceAssets = new Map<string, unknown>([
  [ENTERPRISE_AGENT_PAGE_SOURCE, {
    contractVersion: "0.1.0",
    kind: "chat",
    id: "enterprise-agent.home",
    title: "Personal Agent",
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    composer: {
      key: "message",
      placeholder: "Tell Personal Agent what you want to accomplish",
      sendLabel: "Send"
    },
    emptyState: "Ask Personal Agent to inspect, explain or prepare an opinion or change.",
    metadata: {
      packageId: ENTERPRISE_AGENT_PACKAGE_ID,
      featureId: ENTERPRISE_AGENT_FEATURE_ID,
      convergence: {
        historicalProject: "Experience Compiler (EC)",
        sourceRepository: "jiangxng/Experience-Compiler",
        sourceRelease: "1.0.1",
        targetIdentity: "Personal Agent"
      },
      llm: {
        requiredCapability: "llm.inference",
        integrationStatus: "PROVIDER_RESOLVED_AT_RUNTIME"
      },
      preservedAssets: [
        "knowledge",
        "memory",
        "learning",
        "research",
        "context-compiler",
        "provenance-lineage",
        "industry-packs",
        "model-replacement"
      ]
    }
  }]
]);
